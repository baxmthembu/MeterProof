import { jsPDF } from "jspdf";
import { formatSast } from "@/lib/billing";
import type { Letter } from "@/lib/letters";

export interface Annexure {
  /** JPEG data URL. */
  dataUrl: string;
  reading: number;
  loggedAt: string;
  note: string;
}

const M = 20; // page margin, mm
const W = 210 - 2 * M; // text width on A4
const BOTTOM = 297 - M;

/**
 * Dispute pack: the letter and comparison table first, then the dated meter photographs
 * as annexures starting on their own page.
 */
export function buildDisputePack(letter: Letter, annexures: Annexure[], reference: string): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = M;

  const need = (h: number) => {
    if (y + h > BOTTOM) {
      doc.addPage();
      y = M;
    }
  };
  const text = (s: string, size = 10.5, style: "normal" | "bold" = "normal", gap = 2.5) => {
    doc.setFont("helvetica", style).setFontSize(size);
    const lines = doc.splitTextToSize(s, W) as string[];
    const lh = size * 0.3528 * 1.4;
    for (const line of lines) {
      need(lh);
      doc.text(line, M, y + lh * 0.75);
      y += lh;
    }
    y += gap;
  };

  for (const line of letter.sender) text(line, 10.5, "normal", 0);
  y += 5;
  text(letter.date, 10.5, "normal", 4);
  for (const line of letter.addressee) text(line, 10.5, "normal", 0);
  y += 5;
  text(letter.subject, 11, "bold", 4);
  for (const p of letter.paragraphs.slice(0, 4)) text(p);

  // Comparison table
  const cols = [58, 38, 38, 36];
  const rowH = 9;
  need(rowH * letter.table.length + 6);
  y += 2;
  letter.table.forEach((row, r) => {
    let x = M;
    doc.setFont("helvetica", r === 0 ? "bold" : "normal").setFontSize(9);
    row.forEach((cell, c) => {
      const lines = doc.splitTextToSize(cell, cols[c] - 3) as string[];
      doc.text(lines[0] ?? "", c === 0 ? x : x + cols[c] - 3, y + 6, { align: c === 0 ? "left" : "right" });
      x += cols[c];
    });
    doc.setDrawColor(r === 0 ? 60 : 190).setLineWidth(r === 0 ? 0.4 : 0.2).line(M, y + rowH, M + W, y + rowH);
    y += rowH;
  });
  y += 6;

  for (const p of letter.paragraphs.slice(4)) text(p);
  y += 4;
  need(22);
  for (const line of letter.closing) text(line, 10.5, "normal", line === letter.closing[0] ? 12 : 0);

  // Annexures always start on a fresh page (page 2 onward).
  if (annexures.length) {
    doc.addPage();
    y = M;
    text("Annexure A: dated meter photographs", 13, "bold", 2);
    text("Each photograph was logged in MeterProof at the time shown. Times are South African Standard Time.", 9.5, "normal", 6);
    annexures.forEach((a, i) => {
      const props = doc.getImageProperties(a.dataUrl);
      const maxW = W;
      const maxH = 105;
      const scale = Math.min(maxW / props.width, maxH / props.height);
      const w = props.width * scale;
      const h = props.height * scale;
      need(h + 20);
      doc.addImage(a.dataUrl, "JPEG", M, y, w, h);
      y += h + 3;
      text(`A${i + 1}. Reading ${a.reading}, logged ${formatSast(a.loggedAt)}${a.note ? `. ${a.note}` : ""}`, 9.5, "normal", 8);
    });
  }

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p).setFont("helvetica", "normal").setFontSize(8).setTextColor(110);
    doc.text(`Dispute pack ${reference}. Prepared with MeterProof: administrative template and billing calculation, not legal advice.`, M, 297 - 10);
    doc.text(`Page ${p} of ${pages}`, 210 - M, 297 - 10, { align: "right" });
    doc.setTextColor(0);
  }
  return doc;
}
