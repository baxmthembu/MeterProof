// Database row to app type mappers, shared by the browser store and the server routes.
import type { Dispute, Meter, Payment, Reading } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any -- rows are mapped by hand below */
export type Row = Record<string, any>;

export const toMeter = (r: Row): Meter => ({
  id: r.id, municipality: r.municipality, accountNumber: r.account_number, meterNumber: r.meter_number,
  utility: r.utility, property: r.property ?? "", createdAt: r.created_at,
});
export const toReading = (r: Row): Reading => ({
  id: r.id, meterId: r.meter_id, value: Number(r.value), note: r.note ?? "", loggedAt: r.logged_at, photoPath: r.photo_path,
});
export const toDispute = (r: Row): Dispute => ({
  id: r.id, meterId: r.meter_id, statementDate: r.statement_date, billingDays: r.billing_days,
  billedPrevious: Number(r.billed_previous), billedCurrent: Number(r.billed_current), isEstimate: r.is_estimate,
  evidenceReadingId: r.evidence_reading_id, billedUnits: Number(r.billed_units), actualUnits: Number(r.actual_units),
  overbilledUnits: Number(r.overbilled_units), billedRand: Number(r.billed_rand), actualRand: Number(r.actual_rand), overchargeRand: Number(r.overcharge_rand), safePaymentRand: Number(r.safe_payment_rand),
  referenceNumber: r.reference_number ?? "", submittedOn: r.submitted_on, channel: r.channel, status: r.status,
  recoveredRand: r.recovered_rand == null ? null : Number(r.recovered_rand), createdAt: r.created_at,
});
export const toPayment = (r: Row): Payment => ({
  id: r.id, disputeId: r.dispute_id, product: r.product, amount: Number(r.amount), status: r.status, createdAt: r.created_at,
});
