"use client";

import { useState } from "react";
import { DEMO_MODE, getStore, type Product } from "@/lib/store";
import { errorMessage } from "@/lib/use-data";

/**
 * Starts a payment. Demo mode records it at once; otherwise the server signs a PayFast
 * checkout and the browser posts the form to PayFast.
 */
export function PayButton({ product, disputeId, onPaid, children, variant = "ink" }: {
  product: Product;
  disputeId: string | null;
  onPaid: () => void | Promise<void>;
  children: React.ReactNode;
  variant?: "ink" | "card";
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const store = getStore();
      if (DEMO_MODE) {
        await store.demoPay(product, disputeId);
        await onPaid();
        return;
      }
      if (store.mode === "local") {
        throw new Error("Payments need Supabase and PayFast keys. Set NEXT_PUBLIC_DEMO_MODE=true in .env.local to test the paid flow.");
      }
      const res = await fetch("/api/payfast/checkout", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ product, disputeId }),
      });
      const body = (await res.json()) as { action?: string; fields?: [string, string][]; error?: string };
      if (!res.ok || !body.action || !body.fields) throw new Error(body.error ?? "Could not start the payment.");
      const form = document.createElement("form");
      form.method = "POST";
      form.action = body.action;
      for (const [name, value] of body.fields) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.append(input);
      }
      document.body.append(form);
      form.submit();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-2">
      <button type="button" className={`btn btn--${variant} btn--block`} onClick={pay} disabled={busy} aria-busy={busy}>
        {busy ? "Working…" : children}
      </button>
      {DEMO_MODE && <p className="hint">Demo mode: this unlocks immediately and nothing is charged.</p>}
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}
