"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HAS_SUPABASE } from "@/lib/store";
import { supabaseBrowser } from "@/lib/store/supabase";

/** The magic link lands here. The Supabase client exchanges the code in the URL for a session. */
export default function AuthCallback() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!HAS_SUPABASE) return router.replace("/dashboard");
    supabaseBrowser().auth.getSession().then(({ data }) => (data.session ? router.replace("/dashboard") : setFailed(true)));
  }, [router]);

  return (
    <main id="main" className="app desk grid min-h-dvh place-items-center">
      <div className="wrap max-w-[440px]!">
        <div className="stock grid gap-4 p-6" role="status">
          {failed ? (
            <>
              <h1>That link did not work</h1>
              <p className="text-ink-2">Sign-in links expire and can be used once. Request a new one.</p>
              <Link href="/login" className="btn btn--ink">Back to sign in</Link>
            </>
          ) : (
            <h1>Signing you in…</h1>
          )}
        </div>
      </div>
    </main>
  );
}
