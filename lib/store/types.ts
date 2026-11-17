import type { MunicipalityId, Utility } from "@/lib/tariffs";

export type MeterUtility = "electricity_postpaid" | "electricity_prepaid" | "water";
export const METER_UTILITY_LABEL: Record<MeterUtility, string> = {
  electricity_postpaid: "Electricity, postpaid",
  electricity_prepaid: "Electricity, prepaid",
  water: "Water",
};
export const tariffUtility = (u: MeterUtility): Utility => (u === "water" ? "water" : "electricity");

export const CHANNELS = ["Email", "Walk-in Centre", "Municipal Portal", "Call Centre"] as const;
export type Channel = (typeof CHANNELS)[number];
export const STATUSES = ["Logged", "Awaiting Site Inspection", "Escalated", "Resolved & Credited"] as const;
export type DisputeStatus = (typeof STATUSES)[number];

export interface Profile {
  fullName: string;
  address: string;
  email: string;
  /** ISO date; Account Shield is active until then. */
  shieldActiveUntil: string | null;
  /** ISO date; the Landlord plan (Shield plus up to 30 meters) is active until then. */
  landlordUntil?: string | null;
}

export interface Meter {
  id: string;
  /** Optional property label, e.g. "12 Oak St, flat 3". */
  property?: string;
  municipality: MunicipalityId;
  accountNumber: string;
  meterNumber: string;
  utility: MeterUtility;
  createdAt: string;
}

export interface Reading {
  id: string;
  meterId: string;
  value: number;
  note: string;
  /** ISO timestamp. Set by the database in Supabase mode, by the device in local mode. */
  loggedAt: string;
  photoPath: string | null;
}

export interface Dispute {
  id: string;
  meterId: string;
  statementDate: string;
  billingDays: number;
  billedPrevious: number;
  billedCurrent: number;
  isEstimate: boolean;
  evidenceReadingId: string;
  billedUnits: number;
  actualUnits: number;
  overbilledUnits: number;
  billedRand: number;
  actualRand: number;
  overchargeRand: number;
  safePaymentRand: number;
  referenceNumber: string;
  submittedOn: string | null;
  channel: Channel | null;
  status: DisputeStatus;
  /** Rand the municipality credited back, recorded once resolved. */
  recoveredRand?: number | null;
  createdAt: string;
}

export type Product = "dispute_pack" | "account_shield" | "landlord";
/** Prices in rand, VAT included where applicable. lib/payfast.ts charges these. */
export const PRICES: Record<Product, number> = { dispute_pack: 79, account_shield: 129, landlord: 299 };
/**
 * Days of access per subscription debit: Shield is billed quarterly, so a single quarter (R129)
 * costs more than one R79 pack and the pay-once-and-cancel route stops being cheaper.
 * Each value includes a few days' grace for the next debit.
 */
export const PLAN_DAYS: Record<Exclude<Product, "dispute_pack">, number> = { account_shield: 95, landlord: 35 };
/** Automatic reads (Claude calls) a free account gets per 30 days; Shield and Landlord are unlimited. */
export const FREE_AI_LIMITS = { read: 2, explain: 1 } as const;

export const METER_LIMIT = 3;
export const LANDLORD_METER_LIMIT = 30;
const active = (until: string | null | undefined) => !!until && new Date(until) > new Date();
export const isLandlord = (p: Profile) => active(p.landlordUntil);
export const isShield = (p: Profile) => active(p.shieldActiveUntil);
export const meterLimit = (p: Profile) => (isLandlord(p) ? LANDLORD_METER_LIMIT : METER_LIMIT);
export const meterLimitMessage = (limit: number) =>
  limit >= LANDLORD_METER_LIMIT
    ? `The Landlord plan covers up to ${LANDLORD_METER_LIMIT} meters. Delete one to add another.`
    : `You can add up to ${METER_LIMIT} meters. The Landlord plan covers up to ${LANDLORD_METER_LIMIT}.`;
export interface Payment {
  id: string;
  disputeId: string | null;
  product: Product;
  amount: number;
  status: "pending" | "complete";
  createdAt: string;
}

export type NewDispute = Omit<Dispute, "id" | "createdAt" | "referenceNumber" | "submittedOn" | "channel" | "status">;

export interface Store {
  /** "local" keeps everything in this browser; "supabase" is the real backend. */
  mode: "local" | "supabase";
  /** Null means signed out (never null in local mode). */
  userId(): Promise<string | null>;
  signOut(): Promise<void>;
  getProfile(): Promise<Profile>;
  saveProfile(p: Pick<Profile, "fullName" | "address">): Promise<void>;
  listMeters(): Promise<Meter[]>;
  addMeter(m: Omit<Meter, "id" | "createdAt">): Promise<Meter>;
  updateMeter(id: string, patch: Pick<Meter, "accountNumber" | "meterNumber" | "property">): Promise<void>;
  /** Also removes the meter's readings, photos and disputes. */
  deleteMeter(id: string): Promise<void>;
  /** Newest first. */
  listReadings(): Promise<Reading[]>;
  addReading(r: { meterId: string; value: number; note: string; photo: Blob | null }): Promise<Reading>;
  photoBlob(path: string): Promise<Blob | null>;
  listDisputes(): Promise<Dispute[]>;
  addDispute(d: NewDispute): Promise<Dispute>;
  updateDispute(id: string, patch: Partial<Pick<Dispute, "referenceNumber" | "submittedOn" | "channel" | "status" | "recoveredRand">>): Promise<void>;
  deleteDispute(id: string): Promise<void>;
  listPayments(): Promise<Payment[]>;
  /** Erases everything held for this user. */
  deleteAccount(): Promise<void>;
  /** Demo mode only: record a completed payment without PayFast. */
  demoPay(product: Product, disputeId: string | null): Promise<void>;
}

/** A pack is unlocked by its own R79 payment or by an active Account Shield. */
export function isUnlocked(disputeId: string, payments: Payment[], profile: Profile): boolean {
  if (isShield(profile)) return true;
  return payments.some((p) => p.status === "complete" && p.product === "dispute_pack" && p.disputeId === disputeId);
}
