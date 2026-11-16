// Supabase mode: the same Store, run from the browser and protected by Row Level Security.
import { createBrowserClient } from "@supabase/ssr";
import type { Profile, Store } from "./types";

// The session cookie is Secure on https and SameSite=Lax. It cannot be HttpOnly: this client reads
// it in the browser to talk to Supabase directly (see security-checklist.md).
export const supabaseBrowser = () =>
  createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookieOptions: { sameSite: "lax", secure: typeof location !== "undefined" && location.protocol === "https:" },
  });

import { toDispute, toMeter, toPayment, toReading, type Row } from "./rows";

/** Database errors name tables, columns and policies, so they are logged, never shown. */
function ok<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) {
    console.error("MeterProof data error:", res.error.message);
    throw new Error("We could not save or load that. Check your connection and try again.");
  }
  return res.data as T;
}

export function createSupabaseStore(): Store {
  const sb = supabaseBrowser();
  const uid = async () => {
    const { data } = await sb.auth.getUser();
    if (!data.user) throw new Error("You are signed out. Please sign in again.");
    return data.user;
  };

  return {
    mode: "supabase",
    userId: async () => (await sb.auth.getSession()).data.session?.user.id ?? null,
    signOut: async () => { await sb.auth.signOut(); },

    async getProfile(): Promise<Profile> {
      const user = await uid();
      const r = ok(await sb.from("profiles").select("*").eq("id", user.id).maybeSingle()) as Row | null;
      return { fullName: r?.full_name ?? "", address: r?.address ?? "", email: user.email ?? "", shieldActiveUntil: r?.shield_active_until ?? null };
    },
    async saveProfile(p) {
      const user = await uid();
      ok(await sb.from("profiles").update({ full_name: p.fullName, address: p.address }).eq("id", user.id).select());
    },

    listMeters: async () => (ok(await sb.from("meters").select("*").order("created_at")) as Row[]).map(toMeter),
    async addMeter(m) {
      const user = await uid();
      return toMeter(ok(await sb.from("meters").insert({
        user_id: user.id, municipality: m.municipality, account_number: m.accountNumber, meter_number: m.meterNumber, utility: m.utility,
      }).select().single()));
    },

    async updateMeter(id, patch) {
      ok(await sb.from('meters').update({ account_number: patch.accountNumber, meter_number: patch.meterNumber }).eq('id', id).select());
    },
    // Readings and disputes for the meter go with it (foreign keys cascade).
    async deleteMeter(id) {
      const photos = (ok(await sb.from('readings').select('photo_path').eq('meter_id', id)) as Row[]).map((r) => r.photo_path).filter(Boolean);
      if (photos.length) await sb.storage.from('meter-photos').remove(photos);
      ok(await sb.from('meters').delete().eq('id', id).select());
    },

    listReadings: async () => (ok(await sb.from("readings").select("*").order("logged_at", { ascending: false })) as Row[]).map(toReading),
    async addReading({ meterId, value, note, photo }) {
      const user = await uid();
      let photoPath: string | null = null;
      if (photo) {
        photoPath = `${user.id}/${meterId}/${crypto.randomUUID()}.jpg`;
        const up = await sb.storage.from("meter-photos").upload(photoPath, photo, { contentType: "image/jpeg" });
        if (up.error) {
          console.error("MeterProof upload error:", up.error.message);
          throw new Error("We could not upload that photo. Try again, or use a smaller photo.");
        }
      }
      // logged_at is left to the database clock on purpose.
      const saved = await sb.from("readings").insert({ user_id: user.id, meter_id: meterId, value, note, photo_path: photoPath }).select().single();
      // Do not leave an uploaded photo behind if the reading itself failed to save.
      if (saved.error && photoPath) await sb.storage.from("meter-photos").remove([photoPath]);
      return toReading(ok(saved));
    },
    async photoBlob(path) {
      const { data } = await sb.storage.from("meter-photos").download(path);
      return data ?? null;
    },

    listDisputes: async () => (ok(await sb.from("disputes").select("*").order("created_at", { ascending: false })) as Row[]).map(toDispute),
    async addDispute(d) {
      const user = await uid();
      return toDispute(ok(await sb.from("disputes").insert({
        user_id: user.id, meter_id: d.meterId, statement_date: d.statementDate, billing_days: d.billingDays,
        billed_previous: d.billedPrevious, billed_current: d.billedCurrent, is_estimate: d.isEstimate,
        evidence_reading_id: d.evidenceReadingId, billed_units: d.billedUnits, actual_units: d.actualUnits,
        overbilled_units: d.overbilledUnits, billed_rand: d.billedRand, actual_rand: d.actualRand, overcharge_rand: d.overchargeRand, safe_payment_rand: d.safePaymentRand,
      }).select().single()));
    },
    async updateDispute(id, patch) {
      ok(await sb.from("disputes").update({
        reference_number: patch.referenceNumber, submitted_on: patch.submittedOn, channel: patch.channel, status: patch.status,
      }).eq("id", id).select());
    },

    async deleteDispute(id) {
      ok(await sb.from('disputes').delete().eq('id', id).select());
    },

    listPayments: async () => (ok(await sb.from("payments").select("*")) as Row[]).map(toPayment),
    async deleteAccount() {
      const res = await fetch('/api/account', { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? 'Could not delete your account.');
      await sb.auth.signOut();
    },
    async demoPay(product, disputeId) {
      const res = await fetch("/api/payfast/demo-unlock", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ product, disputeId }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Demo unlock failed.");
    },
  };
}
