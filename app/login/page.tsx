"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/logo";
import { HAS_SUPABASE } from "@/lib/store";
import { supabaseBrowser } from "@/lib/store/supabase";

/**
 * Sign-in by email. The email carries a link and a one-time code:
 * - the link signs in whichever browser opens it;
 * - the code signs in this browser, so it works when the email is read on another device.
 */
export default function LoginPage() {
  const router = useRouter();
  const emailInput = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If the link is opened in another tab of this browser, this tab follows it in.
  useEffect(() => {
    if (!HAS_SUPABASE) return;
    const sb = supabaseBrowser();
    void sb.auth.getSession().then(({ data }) => data.session && router.replace("/dashboard"));
    const { data } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) router.replace("/dashboard");
    });
    return () => data.subscription.unsubscribe();
  }, [router]);

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const address = String(new FormData(e.currentTarget).get("email")).trim();
    setBusy(true);
    setError(null);
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email: address, options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    if (error) {
      console.error("MeterProof sign-in error:", error.message);
      return setError(/rate|too many|seconds/i.test(error.message)
        ? "Too many attempts. Wait a minute, then try again."
        : "We could not send the email. Check the address and try again.");
    }
    setEmail(address);
    setStep("code");
  }

  function haveCode() {
    const input = emailInput.current;
    if (!input?.reportValidity()) return;
    setError(null);
    setEmail(input.value.trim());
    setStep("code");
  }

  async function verify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const token = String(new FormData(e.currentTarget).get("code")).replace(/\D/g, "");
    if (token.length < 6) return setError("Enter the code from the email. It is 6 digits or more.");
    setBusy(true);
    setError(null);
    const { error } = await supabaseBrowser().auth.verifyOtp({ email, token, type: "email" });
    if (error) {
      setBusy(false);
      return setError("That code is wrong or has expired. Check it, or request a new email.");
    }
    router.replace("/dashboard");
  }

  return (
    <main id="main" className="app desk grid min-h-dvh place-items-center py-10">
      <div className="wrap max-w-[440px]!">
        <div className="stock grid gap-4 p-6">
          <Link href="/" className="link--tap text-lg font-semibold tracking-tight no-underline" translate="no"><Logo /></Link>
          {!HAS_SUPABASE ? (
            <>
              <h1>No sign-in needed</h1>
              <p className="text-ink-2">This copy runs in local mode. Your readings stay in this browser.</p>
              <Link href="/dashboard" className="btn btn--ink">Open the dashboard</Link>
            </>
          ) : step === "code" ? (
            // The keys stop React reusing the email <input> as the code input, which kept the typed email.
            <form key="code" className="grid grid-cols-1 gap-4" onSubmit={verify}>
              <h1>Check your email</h1>
              <p className="text-ink-2" role="status">
                We emailed <span className="font-medium break-all">{email}</span>. Type the code from that email here.
              </p>
              <div className="field">
                <label htmlFor="code">Code from the email</label>
                <input id="code" name="code" className="input fig text-lg" inputMode="numeric" autoComplete="one-time-code" required
                  maxLength={12} spellCheck={false} aria-invalid={!!error} aria-describedby="code-hint" />
                <p id="code-hint" className="hint">You can read the email on any device. The code signs you in here.</p>
              </div>
              {error && <p className="error" role="alert">{error}</p>}
              <button type="submit" className="btn btn--ink" disabled={busy} aria-busy={busy}>{busy ? "Signing in…" : "Sign in"}</button>
              <button type="button" className="btn btn--card" onClick={() => { setStep("email"); setError(null); }}>Use a different email</button>
            </form>
          ) : (
            <form key="email" className="grid grid-cols-1 gap-4" onSubmit={send}>
              <h1>Sign in</h1>
              <p className="text-ink-2">We email you a one-time code. There is no password to remember.</p>
              <div className="field">
                <label htmlFor="email">Email address</label>
                <input ref={emailInput} id="email" name="email" type="email" className="input" required autoComplete="email" spellCheck={false}
                  defaultValue={email} aria-invalid={!!error} />
              </div>
              {error && <p className="error" role="alert">{error}</p>}
              <button type="submit" className="btn btn--ink" disabled={busy} aria-busy={busy}>{busy ? "Sending…" : "Email me a sign-in code"}</button>
              <button type="button" className="btn btn--card" onClick={haveCode}>I already have a code</button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
