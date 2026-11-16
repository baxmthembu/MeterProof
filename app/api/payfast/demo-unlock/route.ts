import { NextResponse } from "next/server";
import { clientIp, crossSite, isUuid, rateLimited } from "@/lib/api-guard";
import { PRODUCTS, type Product } from "@/lib/payfast";
import { hasSupabaseServer, supabaseAdmin, supabaseFromCookies } from "@/lib/supabase-server";

/** Demo mode only: records a completed payment without PayFast, so the paid flow can be tested. */
export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") return NextResponse.json({ error: "Demo mode is off." }, { status: 403 });
  if (!hasSupabaseServer()) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const blocked = crossSite(request) ?? (await rateLimited(`demo:ip:${clientIp(request)}`, 30, 600));
  if (blocked) return blocked;

  const body = (await request.json().catch(() => null)) as { product?: Product; disputeId?: string | null } | null;
  if (!body?.product || !Object.hasOwn(PRODUCTS, body.product)) return NextResponse.json({ error: "Unknown product." }, { status: 400 });
  if (body.product === "dispute_pack" && !isUuid(body.disputeId)) return NextResponse.json({ error: "That dispute was not found." }, { status: 404 });

  const { data } = await (await supabaseFromCookies()).auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const admin = supabaseAdmin();
  const insert = await admin.from("payments").insert({
    user_id: data.user.id,
    dispute_id: body.product === "dispute_pack" ? (body.disputeId ?? null) : null,
    product: body.product, amount: PRODUCTS[body.product].amount, status: "complete",
  });
  if (insert.error) return NextResponse.json({ error: "Could not record the demo payment." }, { status: 500 });

  if (body.product === "account_shield") {
    await admin.from("profiles").update({ shield_active_until: new Date(Date.now() + 35 * 86_400_000).toISOString() }).eq("id", data.user.id);
  }
  return NextResponse.json({ ok: true });
}
