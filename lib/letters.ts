import { formatLongDate, formatRand, formatSast, formatUnits, ESCALATION_BUSINESS_DAYS } from "@/lib/billing";
import { MUNICIPALITIES } from "@/lib/tariffs";
import { METER_UTILITY_LABEL, tariffUtility, type Dispute, type Meter, type Profile, type Reading } from "@/lib/store/types";

export interface Letter {
  addressee: string[];
  sender: string[];
  date: string;
  subject: string;
  paragraphs: string[];
  /** Comparison table: header row, then body rows. */
  table: string[][];
  closing: string[];
}

const or = (value: string, placeholder: string) => (value.trim() ? value.trim() : placeholder);

/** The formal dispute letter. The same content feeds the on-screen preview and the PDF. */
export function disputeLetter(profile: Profile, meter: Meter, dispute: Dispute, evidence: Reading, today = new Date()): Letter {
  const m = MUNICIPALITIES[meter.municipality];
  const tariff = m.tariffs[tariffUtility(meter.utility)];
  const unit = tariff.unit;
  const name = or(profile.fullName, "[Your full name]");
  const service = meter.utility === "water" ? m.utilities.water : m.utilities.electricity;

  return {
    addressee: [m.billingDepartment, `Attention: Billing Queries (${service})`],
    sender: [name, ...or(profile.address, "[Your postal address]").split("\n"), ...(profile.email ? [profile.email] : [])],
    date: formatLongDate(today),
    subject: `Formal billing dispute: account ${meter.accountNumber}, meter ${meter.meterNumber}, statement dated ${formatLongDate(dispute.statementDate)}`,
    paragraphs: [
      "Dear Sir or Madam,",
      `I am the account holder for municipal account ${meter.accountNumber} (${METER_UTILITY_LABEL[meter.utility].toLowerCase()}, meter number ${meter.meterNumber}). I am writing to lodge a formal dispute, in terms of section 102(2) of the Local Government: Municipal Systems Act 32 of 2000, concerning a specific amount on my statement dated ${formatLongDate(dispute.statementDate)}.`,
      `That statement bills a current reading of ${dispute.billedCurrent}${dispute.isEstimate ? ", which the statement marks as an estimate or interim reading" : ""}. My own dated photograph of the meter, logged on ${formatSast(evidence.loggedAt)}, shows a reading of ${evidence.value}. The statement therefore bills ${formatUnits(dispute.overbilledUnits, unit)} more than the meter has recorded.`,
      `Priced at the ${tariff.name} tariff, the amount in dispute is ${formatRand(dispute.overchargeRand)} including VAT. The comparison is set out below and the photograph is attached as Annexure A.`,
      `Pending your adjustment I will continue to pay, in good faith, an undisputed average of ${formatRand(dispute.safePaymentRand)} per month for consumption on this meter, calculated from my actual usage, together with all other charges on the account that are not in dispute.`,
      "I respectfully request that you: (1) correct the account to the actual reading and credit the amount in dispute; (2) arrange an actual meter reading if you do not accept the photograph; (3) confirm a dispute reference number in writing; and (4) take no credit control or disconnection action on the disputed amount while this dispute is open.",
      "Please acknowledge receipt of this letter.",
    ],
    table: [
      ["", "Municipal statement", "My photo evidence", "Difference"],
      ["Current reading", String(dispute.billedCurrent), String(evidence.value), formatUnits(dispute.overbilledUnits, unit)],
      [`Consumption over ${dispute.billingDays} days`, formatUnits(dispute.billedUnits, unit), formatUnits(dispute.actualUnits, unit), formatUnits(dispute.overbilledUnits, unit)],
      ["Charge incl. VAT", formatRand(dispute.billedRand), formatRand(dispute.actualRand), formatRand(dispute.overchargeRand)],
    ],
    closing: ["Yours faithfully,", name],
  };
}

export function escalationEmail(profile: Profile, meter: Meter, dispute: Dispute, businessDays: number): string {
  const m = MUNICIPALITIES[meter.municipality];
  const name = or(profile.fullName, "[Your full name]");
  return [
    `Subject: Escalation of unresolved billing dispute ${or(dispute.referenceNumber, "[reference number]")}, account ${meter.accountNumber}`,
    "",
    `To: ${m.billingDepartment}`,
    "",
    "Dear Sir or Madam,",
    "",
    `On ${dispute.submittedOn ? formatLongDate(dispute.submittedOn) : "[date]"} I lodged a formal billing dispute${dispute.channel ? ` via ${dispute.channel}` : ""} for municipal account ${meter.accountNumber}, meter ${meter.meterNumber}. The reference number is ${or(dispute.referenceNumber, "[reference number]")}.`,
    "",
    `${businessDays} business days have now passed, which is more than ${ESCALATION_BUSINESS_DAYS}, and the account has not been corrected. The amount in dispute is ${formatRand(dispute.overchargeRand)} including VAT, being ${dispute.overbilledUnits} units billed on an incorrect reading. My dated meter photograph and calculation were supplied with the original dispute.`,
    "",
    "I request that this dispute be escalated to a supervisor, that the account be corrected to the actual reading, and that I receive a written response within 7 days. I continue to pay the undisputed average each month, and I ask that no credit control or disconnection action be taken on the disputed amount while the dispute remains open.",
    "",
    "Yours faithfully,",
    name,
  ].join("\n");
}
