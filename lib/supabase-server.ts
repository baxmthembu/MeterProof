// Server-only Supabase clients for the PayFast routes.
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

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

export const hasSupabaseServer = () =>
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
