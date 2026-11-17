import { NextResponse } from "next/server";
import { apiFailed, askJson, cleanText, freeLimit, guard, mediaFrom, nullable } from "@/lib/claude";

/** Explains every charge on a municipal statement in plain language. */

const SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string", description: "Two or three plain sentences: what this bill is for and the total due." },
    lines: {
      type: "array",
      items: {
        type: "object",
        properties: {
          item: { type: "string", description: "The charge as printed on the statement." },
          amountRand: { ...nullable("number"), description: "Amount in rand as printed, or null." },
          meaning: { type: "string", description: "One plain sentence: what this charge is and what it depends on." },
        },
        required: ["item", "amountRand", "meaning"],
        additionalProperties: false,
      },
    },
    worthChecking: { type: "array", items: { type: "string" }, description: "Things on this bill worth querying, e.g. estimated readings, arrears interest, a charge that looks unusual. Empty if none." },
  },
  required: ["summary", "lines", "worthChecking"],
  additionalProperties: false,
};

export type BillExplanation = {
  summary: string;
  lines: { item: string; amountRand: number | null; meaning: string }[];
  worthChecking: string[];
};

export async function POST(request: Request) {
  const blocked = await guard(request, "explain");
  if (blocked) return blocked;
  const media = await mediaFrom(await request.formData().catch(() => null));
  if (media instanceof NextResponse) return media;
  const capped = await freeLimit("explain");
  if (capped) return capped;

  try {
    const raw = await askJson<BillExplanation>(
      media,
      "This is a South African municipal account statement. Explain each charge to a homeowner with no accounting background, " +
        "in plain English. Use only what is printed on the statement; do not invent amounts. Do not give legal advice.",
      SCHEMA,
      4000,
    );
    if (!raw) return NextResponse.json({ error: "That file could not be read." }, { status: 422 });
    return NextResponse.json(clean(raw));
  } catch (e) {
    return apiFailed("explain-bill", e, "Explaining the bill failed. Try again.");
  }
}

/** The model output is untrusted: keep only strings and numbers, capped in size. */
function clean(r: BillExplanation): BillExplanation {
  return {
    summary: cleanText(r.summary, 600) ?? "",
    lines: (Array.isArray(r.lines) ? r.lines : []).slice(0, 40).flatMap((l) => {
      const item = cleanText(l?.item, 80);
      const meaning = cleanText(l?.meaning, 300);
      return item && meaning ? [{ item, meaning, amountRand: typeof l.amountRand === "number" && Number.isFinite(l.amountRand) ? l.amountRand : null }] : [];
    }),
    worthChecking: (Array.isArray(r.worthChecking) ? r.worthChecking : []).slice(0, 8).flatMap((s) => cleanText(s, 300) ?? []),
  };
}
