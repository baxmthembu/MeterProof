"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loading, LoadError } from "@/components/states";
import { formatLongDate } from "@/lib/billing";
import { getStore } from "@/lib/store";
import { errorMessage, useData } from "@/lib/use-data";

export default function AccountPage() {
  const router = useRouter();
  const { state, reload } = useData();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (state.status === "loading") return <Loading label="Loading your account" />;
  if (state.status === "error") return <LoadError message={state.message} onRetry={reload} />;
  const { profile, meters, readings, disputes } = state.data;
  const store = getStore();
  const shield = !!profile.shieldActiveUntil && new Date(profile.shieldActiveUntil) > new Date();

  async function erase() {
    if (!window.confirm("Delete your account and everything in it: meters, readings, photos, bill checks and letters? This cannot be undone.")) return;
    setBusy(true);
    setError(null);
    try {
      await store.deleteAccount();
      router.replace("/");
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <h1>Account</h1>

      <section className="stock grid gap-3 p-5" aria-labelledby="held">
        <h2 id="held">What we hold</h2>
        <dl className="rows">
          {store.mode === "supabase" && <div><dt>Signed in as</dt><dd className="break-all">{profile.email}</dd></div>}
          <div><dt>Meters</dt><dd className="fig">{meters.length}</dd></div>
          <div><dt>Readings</dt><dd className="fig">{readings.length}</dd></div>
          <div><dt>Bill checks</dt><dd className="fig">{disputes.length}</dd></div>
          <div>
            <dt>Account Shield</dt>
            <dd>{shield ? `Active until ${formatLongDate(profile.shieldActiveUntil!)}` : "Not active"}</dd>
          </div>
        </dl>
        <p className="hint">
          {store.mode === "local"
            ? "Local mode: all of this is stored in this browser only."
            : "Stored in your MeterProof account."}{" "}
          See the <Link href="/privacy" className="link">privacy policy</Link>.
        </p>
        {shield && store.mode === "supabase" && (
          <p className="notice">To stop the monthly Account Shield debit, cancel the subscription in your PayFast account or with your bank. Access then ends on the date above.</p>
        )}
      </section>

      {store.mode === "supabase" && (
        <button type="button" className="btn btn--card justify-self-start" onClick={() => store.signOut().then(() => router.replace("/"))}>
          Sign out
        </button>
      )}

      <section className="stock grid gap-3 p-5" aria-labelledby="erase">
        <h2 id="erase">Delete everything</h2>
        <p className="text-ink-2">
          Removes your meters, readings, photos, bill checks and letters{store.mode === "supabase" ? ", and your sign-in" : " from this browser"}. Download any dispute pack you still need first.
        </p>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="button" className="btn btn--ink justify-self-start" onClick={() => void erase()} disabled={busy} aria-busy={busy}>
          {busy ? "Deleting…" : store.mode === "supabase" ? "Delete my account" : "Delete my data"}
        </button>
      </section>
    </div>
  );
}
