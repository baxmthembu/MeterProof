import { createClient } from "@supabase/supabase-js";
import { cacheLife } from "next/cache";
import { formatRand } from "@/lib/billing";

/** Below this the number undersells the product, so nothing is shown. */
const SHOW_FROM_RAND = 10_000;

/**
 * Public total of what users report the municipality credited back, from the recovered_total()
 * database function (totals only, capped per dispute at the calculated overcharge). Cached for hours.
 */
export async function RecoveredTotal() {
  "use cache";
  cacheLife("hours");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const { data, error } = await createClient(url, key, { auth: { persistSession: false } }).rpc("recovered_total");
  const row = (Array.isArray(data) ? data[0] : data) as { total: number | string; disputes: number | string } | null;
  const total = Number(row?.total ?? 0);
  if (error || total < SHOW_FROM_RAND) return null;
  return (
    <p className="label">
      <span className="fig">{formatRand(total)}</span> credited back to MeterProof users across{" "}
      <span className="fig">{Number(row?.disputes)}</span> resolved disputes
    </p>
  );
}
