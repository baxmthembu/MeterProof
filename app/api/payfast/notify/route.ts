import { lookup } from "node:dns/promises";
import { paramString, payfastHost, PRODUCTS, verifyItnSignature, type Fields, type Product } from "@/lib/payfast";
import { hasSupabaseServer, supabaseAdmin } from "@/lib/supabase-server";

const PAYFAST_HOSTS = ["www.payfast.co.za", "sandbox.payfast.co.za", "w1w.payfast.co.za", "w2w.payfast.co.za"];
const SHIELD_DAYS = 35; // one month plus a grace period for the next debit

async function fromPayfast(request: Request): Promise<boolean> {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!ip) return false;
  const lists = await Promise.all(PAYFAST_HOSTS.map((h) => lookup(h, { all: true }).catch(() => [])));
  return lists.flat().some((a) => a.address === ip);
}

/**
 * PayFast ITN (instant transaction notification). PayFast's four checks, in order:
 * signature, source address, amount, and a server-to-server confirmation.
 * Always answer 200 once the notification is understood, or PayFast keeps retrying.
 */
export async function POST(request: Request) {
  if (!hasSupabaseServer()) return new Response("Not configured", { status: 503 });

  const raw = await request.text();
  const fields: Fields = [...new URLSearchParams(raw)]; // keeps PayFast's field order
  const get = (k: string) => fields.find(([key]) => key === k)?.[1] ?? "";

  if (!verifyItnSignature(fields, process.env.PAYFAST_PASSPHRASE)) return new Response("Bad signature", { status: 400 });
  // Behind a tunnel or proxy the source address may be missing; only then is the check skipped, and only in sandbox.
  if (!(await fromPayfast(request)) && !(process.env.PAYFAST_SANDBOX !== "false" && !request.headers.get("x-forwarded-for"))) {
    return new Response("Bad source", { status: 400 });
  }

  const admin = supabaseAdmin();
  const payment = await admin.from("payments").select("*").eq("id", get("m_payment_id")).maybeSingle();
  if (!payment.data) return new Response("Unknown payment", { status: 400 });
  const product = payment.data.product as Product;

  if (Math.abs(Number(get("amount_gross")) - PRODUCTS[product].amount) > 0.01) return new Response("Bad amount", { status: 400 });

  const confirm = await fetch(`https://${payfastHost()}/eng/query/validate`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: paramString(fields, undefined, true),
  });
  if (!(await confirm.text()).trim().startsWith("VALID")) return new Response("Not confirmed", { status: 400 });

  if (get("payment_status") !== "COMPLETE") return new Response("OK"); // cancelled or failed: nothing to unlock

  // Idempotent: a repeated notification for the same PayFast payment changes nothing.
  const pfId = get("pf_payment_id");
  if (payment.data.pf_payment_id !== pfId) {
    await admin.from("payments").update({ status: "complete", pf_payment_id: pfId }).eq("id", payment.data.id);
    if (product === "account_shield") {
      // Each monthly debit sends a new ITN and pushes the expiry forward.
      await admin.from("profiles")
        .update({ shield_active_until: new Date(Date.now() + SHIELD_DAYS * 86_400_000).toISOString() })
        .eq("id", payment.data.user_id);
    }
  }
  return new Response("OK");
}
