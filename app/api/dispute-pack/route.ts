import { NextResponse } from "next/server";
import { clientIp, crossSite, isUuid, rateLimited } from "@/lib/api-guard";
import { disputeLetter } from "@/lib/letters";
import { buildDisputePack, type Annexure } from "@/lib/pdf";
import { toDispute, toMeter, toPayment, toReading } from "@/lib/store/rows";
import { isUnlocked, type Profile } from "@/lib/store/types";
import { hasSupabaseServer, supabaseAdmin, supabaseFromCookies } from "@/lib/supabase-server";

/**
 * Builds the dispute pack PDF on the server, so the paywall cannot be bypassed in the browser.
 * The entitlement is checked here against the payments table before anything is generated.
 */
export async function POST(request: Request) {
  if (!hasSupabaseServer()) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const blocked = crossSite(request) ?? (await rateLimited(`pack:ip:${clientIp(request)}`, 60, 600));
  if (blocked) return blocked;

  const body = (await request.json().catch(() => null)) as { disputeId?: string } | null;
  if (!isUuid(body?.disputeId)) return NextResponse.json({ error: "That dispute was not found." }, { status: 404 });

  const { data } = await (await supabaseFromCookies()).auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const userId = data.user.id;
  // Building a PDF with photos is the most expensive thing the server does.
  const tooMany = await rateLimited(`pack:user:${userId}`, 20, 3600);
  if (tooMany) return tooMany;

  // The service-role client bypasses RLS, so every query is scoped to this user by hand.
  const admin = supabaseAdmin();
  const disputeRow = await admin.from("disputes").select("*").eq("id", body.disputeId).eq("user_id", userId).maybeSingle();
  if (!disputeRow.data) return NextResponse.json({ error: "That dispute was not found." }, { status: 404 });
  const dispute = toDispute(disputeRow.data);

  const [profileRow, paymentRows, meterRow, readingRows] = await Promise.all([
    admin.from("profiles").select("*").eq("id", userId).maybeSingle(),
    admin.from("payments").select("*").eq("user_id", userId),
    admin.from("meters").select("*").eq("id", dispute.meterId).eq("user_id", userId).maybeSingle(),
    admin.from("readings").select("*").eq("meter_id", dispute.meterId).eq("user_id", userId).order("logged_at", { ascending: false }),
  ]);

  const profile: Profile = {
    fullName: profileRow.data?.full_name ?? "",
    address: profileRow.data?.address ?? "",
    email: data.user.email ?? "",
    shieldActiveUntil: profileRow.data?.shield_active_until ?? null,
  };
  if (!isUnlocked(dispute.id, (paymentRows.data ?? []).map(toPayment), profile)) {
    return NextResponse.json({ error: "This dispute pack has not been paid for." }, { status: 402 });
  }

  const readings = (readingRows.data ?? []).map(toReading);
  const evidence = readings.find((r) => r.id === dispute.evidenceReadingId);
  if (!meterRow.data || !evidence) return NextResponse.json({ error: "The meter or photo reading for this dispute is missing." }, { status: 404 });
  const meter = toMeter(meterRow.data);

  // Evidence photo first, then up to three earlier photos of the same meter.
  const withPhotos = [evidence, ...readings.filter((r) => r.id !== evidence.id && r.loggedAt < evidence.loggedAt).slice(0, 3)].filter((r) => r.photoPath);
  const annexures: Annexure[] = [];
  for (const r of withPhotos) {
    const file = await admin.storage.from("meter-photos").download(r.photoPath!);
    if (!file.data) continue;
    const base64 = Buffer.from(await file.data.arrayBuffer()).toString("base64");
    annexures.push({ dataUrl: `data:image/jpeg;base64,${base64}`, reading: r.value, loggedAt: r.loggedAt, note: r.note });
  }

  const pdf = buildDisputePack(disputeLetter(profile, meter, dispute, evidence), annexures, dispute.id.slice(0, 8).toUpperCase());
  return new Response(pdf.output("arraybuffer"), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="MeterProof-dispute-pack-${dispute.statementDate}.pdf"`,
      "cache-control": "no-store",
    },
  });
}
