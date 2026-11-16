import { NextResponse } from "next/server";
import { checkoutFields, payfastHost, PRODUCTS, type Product } from "@/lib/payfast";
import { hasSupabaseServer, supabaseAdmin, supabaseFromCookies } from "@/lib/supabase-server";

/** Creates a pending payment and returns the signed form fields to POST to PayFast. */
export async function POST(request: Request) {
  if (!hasSupabaseServer() || !process.env.PAYFAST_MERCHANT_ID || !process.env.PAYFAST_MERCHANT_KEY) {
    return NextResponse.json({ error: "Payments are not configured. Add the Supabase and PayFast keys to .env.local." }, { status: 503 });
  }
  const body = (await request.json().catch(() => null)) as { product?: Product; disputeId?: string | null } | null;
  if (!body?.product || !(body.product in PRODUCTS)) return NextResponse.json({ error: "Unknown product." }, { status: 400 });

  const { data } = await (await supabaseFromCookies()).auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const admin = supabaseAdmin();
  const disputeId = body.product === "dispute_pack" ? (body.disputeId ?? null) : null;
  if (body.product === "dispute_pack") {
    // The dispute must belong to the buyer.
    const owned = await admin.from("disputes").select("id").eq("id", disputeId ?? "").eq("user_id", data.user.id).maybeSingle();
    if (!owned.data) return NextResponse.json({ error: "That dispute was not found." }, { status: 404 });
  }

  const payment = await admin.from("payments")
    .insert({ user_id: data.user.id, dispute_id: disputeId, product: body.product, amount: PRODUCTS[body.product].amount })
    .select("id").single();
  if (payment.error) return NextResponse.json({ error: "Could not start the payment." }, { status: 500 });

  // PayFast must return to, and notify, the address the buyer is actually using. A deployed site
  // always knows its own origin; NEXT_PUBLIC_SITE_URL only matters on localhost, where it can
  // point at a tunnel so PayFast can reach the webhook.
  const origin = new URL(request.url).origin;
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  const siteUrl = (isLocal && process.env.NEXT_PUBLIC_SITE_URL?.trim()) || origin;
  return NextResponse.json({
    action: `https://${payfastHost()}/eng/process`,
    fields: checkoutFields({ product: body.product, paymentId: payment.data.id, userId: data.user.id, disputeId, email: data.user.email ?? "", siteUrl }),
  });
}
