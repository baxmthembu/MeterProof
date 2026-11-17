import { NextResponse } from "next/server";
import { apiFailed, askJson, cleanNumber, cleanText, freeLimit, guard, mediaFrom, nullable } from "@/lib/claude";

/** Reads the register digits and meter number from a meter photo, so a typo can be caught before saving. */

const SCHEMA = {
  type: "object",
  properties: {
    reading: { ...nullable("number"), description: "The register reading shown, as a number. Ignore red or decimal drums unless the meter shows a decimal point." },
    meterNumber: { ...nullable("string"), description: "The meter's serial number if printed on it." },
  },
  required: ["reading", "meterNumber"],
  additionalProperties: false,
};

export type MeterPhoto = { reading: number | null; meterNumber: string | null };

export async function POST(request: Request) {
  const blocked = await guard(request, "meter");
  if (blocked) return blocked;
  const form = await request.formData().catch(() => null);
  const media = await mediaFrom(form, { pdf: false });
  if (media instanceof NextResponse) return media;
  const capped = await freeLimit("read");
  if (capped) return capped;

  const utility = form?.get("utility") === "water" ? "water meter (kilolitres)" : "electricity meter (kWh)";
  try {
    const raw = await askJson<MeterPhoto>(
      media,
      `This is a photo of a South African ${utility}. Read the register exactly as shown. Use null if the digits are not clearly readable; never guess.`,
      SCHEMA,
      500,
    );
    if (!raw) return NextResponse.json({ error: "The photo could not be read." }, { status: 422 });
    return NextResponse.json({ reading: cleanNumber(raw.reading), meterNumber: cleanText(raw.meterNumber, 40) } satisfies MeterPhoto);
  } catch (e) {
    return apiFailed("read-meter", e, "Reading the photo failed. Type the reading in.");
  }
}
