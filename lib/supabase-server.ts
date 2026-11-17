// Server-only Supabase clients for the PayFast routes.
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { PLAN_DAYS } from "@/lib/store/types";

/** Reads the signed-in user from the request cookies (anon key, RLS applies). */
export async function supabaseFromCookies() {
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => jar.getAll(), setAll: () => {} },
  });
}

/** Service-role client: bypasses RLS. Only ever used to write payments and entitlements. */
export const supabaseAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

/**
 * Extends Account Shield (and the Landlord plan) after a subscription payment. Each debit
 * (quarterly for Shield, monthly for Landlord) pushes the expiry forward; a payment never
 * shortens a longer period already paid for.
 */
export async function grantPlan(userId: string, product: string) {
  if (product !== "account_shield" && product !== "landlord") return;
  const admin = supabaseAdmin();
  const until = new Date(Date.now() + PLAN_DAYS[product] * 86_400_000);
  const current = (await admin.from("profiles").select("shield_active_until").eq("id", userId).maybeSingle()).data?.shield_active_until;
  const shield = current && new Date(current) > until ? new Date(current) : until;
  await admin.from("profiles")
    .update({ shield_active_until: shield.toISOString(), ...(product === "landlord" ? { landlord_until: until.toISOString() } : {}) })
    .eq("id", userId);
}

export const hasSupabaseServer = () =>
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
