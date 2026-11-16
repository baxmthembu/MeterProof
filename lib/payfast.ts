import { createHash } from "node:crypto";

export type Product = "dispute_pack" | "account_shield";

export const PRODUCTS: Record<Product, { name: string; amount: number; recurring: boolean }> = {
  dispute_pack: { name: "MeterProof Dispute Pack", amount: 79, recurring: false },
  account_shield: { name: "MeterProof Account Shield", amount: 39, recurring: true },
};

export const payfastHost = () =>
  process.env.PAYFAST_SANDBOX === "false" ? "www.payfast.co.za" : "sandbox.payfast.co.za";

/** PHP urlencode(): spaces as "+", and !'()* encoded too. */
const enc = (v: string) =>
  encodeURIComponent(v.trim())
    .replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase())
    .replace(/%20/g, "+");

export type Fields = [string, string][];

/** PayFast signs fields in the order they are sent, skipping blanks, then the passphrase. */
export function paramString(fields: Fields, passphrase?: string): string {
  const parts = fields.filter(([k, v]) => k !== "signature" && v !== "").map(([k, v]) => `${k}=${enc(v)}`);
  if (passphrase) parts.push(`passphrase=${enc(passphrase)}`);
  return parts.join("&");
}

export const sign = (fields: Fields, passphrase?: string) =>
  createHash("md5").update(paramString(fields, passphrase)).digest("hex");

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
  if (p.recurring) {
    // subscription_type 1 = subscription, frequency 3 = monthly, cycles 0 = until cancelled
    fields.push(["subscription_type", "1"], ["recurring_amount", amount], ["frequency", "3"], ["cycles", "0"]);
  }
  fields.push(["signature", sign(fields, process.env.PAYFAST_PASSPHRASE)]);
  return fields;
}

/** True when the ITN body's signature matches what we compute with our passphrase. */
export function verifyItnSignature(fields: Fields, passphrase?: string): boolean {
  const sent = fields.find(([k]) => k === "signature")?.[1];
  return !!sent && sent === sign(fields, passphrase);
}
