import { VAT_RATE, type Tariff } from "./tariffs.ts";

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Rand cost (including VAT) of `units` used over `days`, on a stepped tariff.
 * Block ceilings are monthly, so they are scaled to the billing period (days / 30),
 * which is how municipalities pro-rate short and long periods.
 */
export function steppedCharge(tariff: Tariff, units: number, days = 30): number {
  if (!(units > 0) || !(days > 0)) return 0;
  const scale = days / 30;
  let remaining = units;
  let floor = 0;
  let total = 0;
  for (const block of tariff.blocks) {
    const ceiling = block.upTo === null ? Infinity : block.upTo * scale;
    const inBlock = Math.min(remaining, ceiling - floor);
    if (inBlock > 0) {
      total += inBlock * block.rate;
      remaining -= inBlock;
    }
    floor = ceiling;
    if (remaining <= 0) break;
  }
  return round2(tariff.ratesIncludeVat ? total : total * (1 + VAT_RATE));
}

/** Two photo readings must be at least this many days apart to set the daily average. */
export const MIN_AVERAGE_DAYS = 7;

export interface BillCheckInput {
  tariff: Tariff;
  billingDays: number;
  billedPrevious: number;
  billedCurrent: number;
  /** The meter reading in the user's dated photo. */
  actualReading: number;
  /** Optional earlier photo reading, for a daily average from the user's own evidence. */
  earlier?: { reading: number; daysBefore: number };
}

export interface BillCheckResult {
  billedUnits: number;
  actualUnits: number;
  /** Units billed but not used (never negative). */
  overbilledUnits: number;
  billedRand: number;
  actualRand: number;
  overchargeRand: number;
  dailyAverageUnits: number;
  /** True when the average came from two of the user's photos, false when from the billing period. */
  averageFromPhotos: boolean;
  /** Fair monthly amount for consumption, to keep paying while the dispute runs. */
  safePaymentRand: number;
}

export function checkBill(input: BillCheckInput): BillCheckResult {
  const { tariff, billingDays, billedPrevious, billedCurrent, actualReading, earlier } = input;
  const billedUnits = Math.max(0, billedCurrent - billedPrevious);
  const actualUnits = Math.max(0, actualReading - billedPrevious);
  const billedRand = steppedCharge(tariff, billedUnits, billingDays);
  const actualRand = steppedCharge(tariff, actualUnits, billingDays);

  // Prefer the user's own two photos for the average, but only when they are far enough apart
  // to mean something: two readings minutes apart would extrapolate to an absurd daily figure.
  const averageFromPhotos = !!earlier && earlier.daysBefore >= MIN_AVERAGE_DAYS && actualReading >= earlier.reading;
  const dailyAverageUnits = averageFromPhotos
    ? (actualReading - earlier!.reading) / earlier!.daysBefore
    : actualUnits / Math.max(1, billingDays);

  return {
    billedUnits: round2(billedUnits),
    actualUnits: round2(actualUnits),
    overbilledUnits: round2(Math.max(0, billedUnits - actualUnits)),
    billedRand,
    actualRand,
    overchargeRand: round2(Math.max(0, billedRand - actualRand)),
    dailyAverageUnits: round2(dailyAverageUnits),
    averageFromPhotos,
    safePaymentRand: steppedCharge(tariff, dailyAverageUnits * 30, 30),
  };
}

/**
 * Homepage quick check: only two readings are known, so the over-billed units are priced
 * as the top slice of a typical month (tariff.typicalMonthlyUse).
 */
export function quickCheck(tariff: Tariff, actualReading: number, billedReading: number) {
  const units = round2(Math.max(0, billedReading - actualReading));
  const base = tariff.typicalMonthlyUse;
  const rand = round2(steppedCharge(tariff, base + units) - steppedCharge(tariff, base));
  return { units, rand };
}

/** Weekdays between two dates, excluding the start day. */
// ponytail: public holidays are not excluded; add a holiday list if the 21-day flag must be exact.
export function businessDaysBetween(from: Date, to: Date): number {
  const start = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const end = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  let count = 0;
  for (let t = start + 86_400_000; t <= end; t += 86_400_000) {
    const day = new Date(t).getUTCDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

export const ESCALATION_BUSINESS_DAYS = 21;

export interface LeakAlert {
  /** kL a day since the second-last reading. */
  latestPerDay: number;
  /** kL a day over all earlier readings. */
  usualPerDay: number;
  since: string;
}

/**
 * Flags a possible water leak: daily use since the last reading is at least double the earlier
 * average, and at least 200 litres a day more. Readings less than a day apart are skipped, and a
 * negative step (meter replaced or misread) turns the check off.
 */
// ponytail: compares against the whole history; a seasonal baseline would need a year of readings.
export function leakAlert(readings: { value: number; loggedAt: string }[]): LeakAlert | null {
  const days = (a: { loggedAt: string }, b: { loggedAt: string }) => (Date.parse(b.loggedAt) - Date.parse(a.loggedAt)) / 86_400_000;
  const points = [...readings]
    .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt))
    .reduce<typeof readings>((kept, r) => (kept.length === 0 || days(kept[kept.length - 1], r) >= 1 ? [...kept, r] : kept), []);
  if (points.length < 3) return null;
  const [first, prev, last] = [points[0], points[points.length - 2], points[points.length - 1]];
  const usualPerDay = (prev.value - first.value) / days(first, prev);
  const latestPerDay = (last.value - prev.value) / days(prev, last);
  if (usualPerDay < 0 || latestPerDay < 0) return null;
  return latestPerDay >= 2 * usualPerDay && latestPerDay - usualPerDay >= 0.2 ? { latestPerDay, usualPerDay, since: prev.loggedAt } : null;
}

/** A repeating monthly calendar reminder (on the 1st) to photograph and log every meter. */
export function readingReminderIcs(siteUrl: string, from = new Date()): string {
  const first = new Date(from.getFullYear(), from.getMonth() + 1, 1);
  const ymd = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MeterProof//Reading reminder//EN", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:reading-reminder-${ymd(first)}@meterproof`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${ymd(first)}`,
    "RRULE:FREQ=MONTHLY;BYMONTHDAY=1",
    "SUMMARY:Photograph and log your meter readings",
    `DESCRIPTION:Open MeterProof and log a photo of every meter: ${siteUrl}/dashboard`,
    "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Log your meter readings in MeterProof", "TRIGGER:PT9H", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR", "",
  ].join("\r\n");
}

/** "2026-11-15 22:03 SAST" */
export function formatSast(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const s = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Africa/Johannesburg",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).format(d);
  return `${s} SAST`;
}

/** "15 November 2026" for letters. */
export function formatLongDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Johannesburg", day: "numeric", month: "long", year: "numeric" }).format(d);
}

/** "R 1 234.56": spaces for thousands, decimal point, as on SA municipal statements. */
export function formatRand(n: number): string {
  const [whole, cents] = Math.abs(n).toFixed(2).split(".");
  return `${n < 0 ? "-" : ""}R ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}.${cents}`;
}

export function formatUnits(n: number, unit: string): string {
  return `${Number.isInteger(n) ? n : n.toFixed(2)} ${unit}`;
}
