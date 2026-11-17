import { NextResponse } from "next/server";
import { apiFailed, askJson, cleanNumber, cleanText, freeLimit, guard, mediaFrom, nullable } from "@/lib/claude";

/** Reads the figures the bill check needs from a statement photo or PDF. */

const SCHEMA = {
  type: "object",
  properties: {
    statementDate: { ...nullable("string"), description: "Statement or invoice date, YYYY-MM-DD." },
    previousReading: { ...nullable("number"), description: "Previous meter reading for the requested meter." },
    currentReading: { ...nullable("number"), description: "Current meter reading for the requested meter." },
    billingDays: { ...nullable("integer"), description: "Days in the reading period for this meter." },
    isEstimate: { ...nullable("boolean"), description: "True if the current reading is marked estimated, interim or 'E'." },
    meterNumber: { ...nullable("string"), description: "Meter number printed beside these readings." },
  },
  required: ["statementDate", "previousReading", "currentReading", "billingDays", "isEstimate", "meterNumber"],
  additionalProperties: false,
};

export type BillFigures = {
  statementDate: string | null;
  previousReading: number | null;
  currentReading: number | null;
  billingDays: number | null;
  isEstimate: boolean | null;
  meterNumber: string | null;
};

export async function POST(request: Request) {
  const blocked = await guard(request, "bill");
  if (blocked) return blocked;
  const form = await request.formData().catch(() => null);
  const media = await mediaFrom(form);
  if (media instanceof NextResponse) return media;
  const capped = await freeLimit("read");
  if (capped) return capped;

  const utility = form?.get("utility") === "water" ? "water" : "electricity";
  const meterNumber = String(form?.get("meterNumber") ?? "").slice(0, 40);
  try {
    const raw = await askJson<BillFigures>(
      media,
      `This is a South African municipal account statement. Find the ${utility} meter readings` +
        (meterNumber ? ` for meter number ${meterNumber}` : "") +
        ". Return the figures exactly as printed. Use null for anything you cannot read clearly; never guess.",
      SCHEMA,
    );
    if (!raw) return NextResponse.json({ error: "That file could not be read. Type the figures in." }, { status: 422 });
    return NextResponse.json(clean(raw));
  } catch (e) {
    return apiFailed("read-bill", e, "Reading the bill failed. Try again, or type the figures in.");
  }
}

/** The model output is untrusted: keep only well-formed values. */
function clean(r: BillFigures): BillFigures {
  const days = cleanNumber(r.billingDays);
  return {
    statementDate: typeof r.statementDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.statementDate) ? r.statementDate : null,
    previousReading: cleanNumber(r.previousReading),
    currentReading: cleanNumber(r.currentReading),
    billingDays: days !== null && Number.isInteger(days) && days >= 1 && days <= 366 ? days : null,
    isEstimate: typeof r.isEstimate === "boolean" ? r.isEstimate : null,
    meterNumber: cleanText(r.meterNumber, 40),
  };
}
