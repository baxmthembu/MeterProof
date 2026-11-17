// Shared protections for the API routes: CSRF (same-origin), rate limiting, input checks.
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/**
 * CSRF: a state-changing request must come from this site's own pages.
 * Browsers always send Origin on cross-site POST/DELETE, so a mismatch is refused.
 * (The session cookie is also SameSite=Lax, which already keeps it off cross-site POSTs.)
 */
export function crossSite(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const sameOrigin = origin ? safeHost(origin) === host : site === null || site === "same-origin" || site === "none";
  if (sameOrigin) return null;
  return NextResponse.json({ error: "This request did not come from MeterProof." }, { status: 403 });
}

function safeHost(origin: string): string | null {
  try {
    return new URL(origin).host;
  } catch {
    return null;
  }
}

/**
 * Fixed-window rate limit, counted in Postgres so it holds across serverless instances.
 * Needs the rate_limit_hit function from supabase/schema.sql.
 */
// ponytail: fails open if the function is missing or the database is down, so a schema that
// has not been re-run never locks users out. Move to an edge limiter if abuse becomes real.
export async function rateLimited(
  key: string, max: number, windowSeconds: number,
  message = "Too many requests. Please wait a moment and try again.",
): Promise<NextResponse | null> {
  try {
    const { data, error } = await supabaseAdmin().rpc("rate_limit_hit", { p_key: key, p_max: max, p_window_seconds: windowSeconds });
    if (error) {
      console.warn("rate limit unavailable:", error.message);
      return null;
    }
    if (data === false) {
      return NextResponse.json(
        { error: message },
        { status: 429, headers: { "retry-after": String(windowSeconds) } },
      );
    }
  } catch (e) {
    console.warn("rate limit unavailable:", e);
  }
  return null;
}
