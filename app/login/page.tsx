"use client";

import Link from "next/link";
import { useState } from "react";
import { HAS_SUPABASE } from "@/lib/store";
import { supabaseBrowser } from "@/lib/store/supabase";

export default function LoginPage() {
  const [sent, setSent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email")).trim();
    setBusy(true);
    setError(null);
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(email);
  }

  return (
    <main id="main" className="app desk grid min-h-dvh place-items-center py-10">
      <div className="wrap max-w-[440px]!">
        <div className="stock grid gap-4 p-6">
          <Link href="/" className="link--tap text-lg font-semibold tracking-tight no-underline" translate="no">MeterProof</Link>
          {!HAS_SUPABASE ? (
            <>
              <h1>No sign-in needed</h1>
              <p className="text-ink-2">This copy runs in local mode. Your readings stay in this browser.</p>
              <Link href="/dashboard" className="btn btn--ink">Open the dashboard</Link>
            </>
          ) : sent ? (
            <>
              <h1>Check your email</h1>
              <p className="text-ink-2" role="status">We sent a sign-in link to <span className="font-medium">{sent}</span>. Open it on this device.</p>
              <button type="button" className="btn btn--card" onClick={() => setSent(null)}>Use a different email</button>
            </>
          ) : (
            <form className="grid grid-cols-1 gap-4" onSubmit={submit}>
              <h1>Sign in</h1>
              <p className="text-ink-2">We email you a one-time link. There is no password to remember.</p>
              <div className="field">
                <label htmlFor="email">Email address</label>
                <input id="email" name="email" type="email" className="input" required autoComplete="email" spellCheck={false} aria-invalid={!!error} />
              </div>
              {error && <p className="error" role="alert">{error}</p>}
              <button type="submit" className="btn btn--ink" disabled={busy} aria-busy={busy}>{busy ? "Sending…" : "Email me a sign-in link"}</button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
