import { createHash } from "node:crypto";
import { PRICES, type Product } from "./store/types.ts";

export type { Product };

/** frequency is PayFast's subscription code: 3 = monthly, 4 = quarterly. Null means a once-off payment. */
export const PRODUCTS: Record<Product, { name: string; amount: number; frequency: "3" | "4" | null }> = {
  dispute_pack: { name: "MeterProof Dispute Pack", amount: PRICES.dispute_pack, frequency: null },
  account_shield: { name: "MeterProof Account Shield", amount: PRICES.account_shield, frequency: "4" },
  landlord: { name: "MeterProof Landlord", amount: PRICES.landlord, frequency: "3" },
};

export const payfastHost = () =>
  process.env.PAYFAST_SANDBOX === "false" ? "www.payfast.co.za" : "sandbox.payfast.co.za";

/** PHP urlencode(): spaces as "+", and !'()* encoded too. */
const enc = (v: string) =>
  encodeURIComponent(v.trim())
    .replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase())
    .replace(/%20/g, "+");

export type Fields = [string, string][];

/**
 * PayFast signs fields in the order they are sent, then the passphrase.
 * Checkout forms are signed without blank fields; ITN notifications are signed with them (keepBlank).
 */
export function paramString(fields: Fields, passphrase?: string, keepBlank = false): string {
  const parts = fields.filter(([k, v]) => k !== "signature" && (keepBlank || v !== "")).map(([k, v]) => `${k}=${enc(v)}`);
  if (passphrase) parts.push(`passphrase=${enc(passphrase)}`);
  return parts.join("&");
}

export const sign = (fields: Fields, passphrase?: string, keepBlank = false) =>
  createHash("md5").update(paramString(fields, passphrase, keepBlank)).digest("hex");

export interface CheckoutInput {
  product: Product;
  paymentId: string;
  userId: string;
  disputeId: string | null;
  email: string;
  siteUrl: string;
}

/** Fields for the form POST to PayFast, in PayFast's documented order, with signature. */
export function checkoutFields(input: CheckoutInput): Fields {
  const p = PRODUCTS[input.product];
  const amount = p.amount.toFixed(2);
  const fields: Fields = [
    ["merchant_id", process.env.PAYFAST_MERCHANT_ID ?? ""],
    ["merchant_key", process.env.PAYFAST_MERCHANT_KEY ?? ""],
    ["return_url", `${input.siteUrl}/dashboard/dispute-pack?paid=1`],
    ["cancel_url", `${input.siteUrl}/dashboard/dispute-pack?cancelled=1`],
    ["notify_url", `${input.siteUrl}/api/payfast/notify`],
    ["email_address", input.email],
    ["m_payment_id", input.paymentId],
    ["amount", amount],
    ["item_name", p.name],
    ["custom_str1", input.userId],
    ["custom_str2", input.disputeId ?? ""],
    ["custom_str3", input.product],
  ];
  if (p.frequency) {
    // subscription_type 1 = subscription, cycles 0 = until cancelled
    fields.push(["subscription_type", "1"], ["recurring_amount", amount], ["frequency", p.frequency], ["cycles", "0"]);
  }
  // PayFast rejects the signature if a blank field is posted, so blanks are dropped, not just unsigned.
  const sent = fields.filter(([, v]) => v !== "");
  sent.push(["signature", sign(sent, process.env.PAYFAST_PASSPHRASE)]);
  return sent;
}

/** True when the ITN body's signature matches what we compute with our passphrase. */
export function verifyItnSignature(fields: Fields, passphrase?: string): boolean {
  const sent = fields.find(([k]) => k === "signature")?.[1];
  // PayFast's ITN includes its blank fields in the signature; accept the blank-free form too.
  return !!sent && (sent === sign(fields, passphrase, true) || sent === sign(fields, passphrase));
}
