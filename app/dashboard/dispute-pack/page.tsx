"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { useConfirm } from "@/components/confirm";
import { PayButton } from "@/components/pay-button";
import { Photo } from "@/components/photo";
import { Empty, Loading, LoadError } from "@/components/states";
import { formatLongDate, formatRand, formatSast } from "@/lib/billing";
import { blobToDataUrl } from "@/lib/image";
import { disputeLetter } from "@/lib/letters";
import { getStore, isUnlocked } from "@/lib/store";
import { MUNICIPALITIES } from "@/lib/tariffs";
import { errorMessage, useData, type Data } from "@/lib/use-data";

export default function DisputePackPage() {
  return (
    <Suspense fallback={<Loading label="Loading your dispute pack" />}>
      <DisputePack />
    </Suspense>
  );
}

function DisputePack() {
  const params = useSearchParams();
  const { state, reload } = useData();

  if (state.status === "loading") return <Loading label="Loading your dispute pack" />;
  if (state.status === "error") return <LoadError message={state.message} onRetry={reload} />;
  if (state.data.disputes.length === 0) {
    return (
      <div className="grid gap-6">
        <h1>Dispute pack</h1>
        <Empty title="No bill checked yet" text="Check a statement against your photo reading first. The pack is built from that result."
          href="/dashboard/check-bill" action="Check a bill" />
      </div>
    );
  }
  return <Pack data={state.data} selectedId={params.get("id")} justPaid={params.get("paid") === "1"} cancelled={params.get("cancelled") === "1"} reload={reload} />;
}

function Pack({ data, selectedId, justPaid, cancelled, reload }: {
  data: Data; selectedId: string | null; justPaid: boolean; cancelled: boolean; reload: () => Promise<void>;
}) {
  const router = useRouter();
  const dispute = data.disputes.find((d) => d.id === selectedId) ?? data.disputes[0];
  const meter = data.meters.find((m) => m.id === dispute.meterId);
  const evidence = data.readings.find((r) => r.id === dispute.evidenceReadingId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const { confirm, dialog } = useConfirm();

  if (!meter || !evidence) {
    return <LoadError message="This dispute's meter or photo reading is missing." onRetry={reload} />;
  }

  const unlocked = isUnlocked(dispute.id, data.payments, data.profile);
  const letter = disputeLetter(data.profile, meter, dispute, evidence);
  // Annexures: the evidence photo first, then up to three earlier photos of the same meter.
  const annexReadings = [evidence, ...data.readings.filter((r) => r.meterId === meter.id && r.id !== evidence.id && r.photoPath && r.loggedAt < evidence.loggedAt).slice(0, 3)]
    .filter((r) => r.photoPath);

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setError(null);
    try {
      await getStore().saveProfile({ fullName: String(f.get("fullName")).trim(), address: String(f.get("address")).trim() });
      await reload();
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function removeDispute() {
    const ok = await confirm({
      title: "Delete this bill check?",
      body: "The bill check and its letter are deleted. Your meter readings and photos stay. This cannot be undone.",
      confirmLabel: "Delete bill check",
    });
    if (!ok) return;
    setError(null);
    try {
      await getStore().deleteDispute(dispute.id);
      router.replace("/dashboard/dispute-pack");
      await reload();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const store = getStore();
      const filename = `MeterProof-dispute-pack-${meter!.accountNumber}-${dispute.statementDate}.pdf`;
      if (store.mode === "supabase") {
        // Real accounts: the server checks the payment and builds the PDF.
        const res = await fetch("/api/dispute-pack", {
          method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ disputeId: dispute.id }),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Could not build the PDF.");
        const url = URL.createObjectURL(await res.blob());
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
      const annexures = [];
      for (const r of annexReadings) {
        const blob = await store.photoBlob(r.photoPath!);
        if (blob) annexures.push({ dataUrl: await blobToDataUrl(blob), reading: r.value, loggedAt: r.loggedAt, note: r.note });
      }
      const { buildDisputePack } = await import("@/lib/pdf"); // keeps jsPDF out of every other page
      const reference = dispute.id.slice(0, 8).toUpperCase();
      buildDisputePack(letter, annexures, reference).save(filename);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1>Dispute pack</h1>
        <p className="text-ink-2">A formal letter to {MUNICIPALITIES[meter.municipality].billingDepartment}, with the maths and your photos.</p>
      </div>

      {justPaid && !unlocked && (
        <p className="notice" role="status">
          Thank you. PayFast is confirming your payment, which can take a minute.{" "}
          <button type="button" className="link" onClick={() => void reload()}>Check again</button>
        </p>
      )}
      {cancelled && <p className="notice" role="status">The payment was cancelled. Nothing was charged.</p>}

      {data.disputes.length > 1 && (
        <div className="field">
          <label htmlFor="dispute">Bill check</label>
          <select id="dispute" name="dispute" className="input" value={dispute.id} onChange={(e) => router.replace(`/dashboard/dispute-pack?id=${e.target.value}`)}>
            {data.disputes.map((d) => {
              const m = data.meters.find((x) => x.id === d.meterId);
              return <option key={d.id} value={d.id}>Statement {d.statementDate}, {m?.meterNumber ?? "meter"}, {formatRand(d.overchargeRand)}</option>;
            })}
          </select>
        </div>
      )}

      <form className="stock grid gap-4 p-5" onSubmit={saveProfile} onChange={() => setSaved(false)}>
        <h2>Account holder</h2>
        <div className="field">
          <label htmlFor="fullName">Full name, as on the municipal account</label>
          <input id="fullName" name="fullName" className="input" autoComplete="name" required defaultValue={data.profile.fullName} />
        </div>
        <div className="field">
          <label htmlFor="address">Postal address</label>
          <textarea id="address" name="address" className="input" autoComplete="street-address" rows={3} required defaultValue={data.profile.address} />
        </div>
        <div className="flex items-center gap-4">
          <button type="submit" className="btn btn--card">Save details</button>
          <span className="hint" role="status">{saved ? "Saved. The letter below is updated." : ""}</span>
        </div>
      </form>

      <section aria-labelledby="preview-title" className="grid gap-3">
        <div className="flex items-center justify-between gap-4">
          <h2 id="preview-title">{unlocked ? "Your letter" : "Preview"}</h2>
          <span className="tag">{unlocked ? "Unlocked" : "Locked"}</span>
        </div>
        <article className={`stock grid gap-4 p-5 text-sm leading-relaxed sm:p-8 ${unlocked ? "" : "watermark"}`}>
          <p className="whitespace-pre-line">{letter.sender.join("\n")}</p>
          <p>{letter.date}</p>
          <p className="whitespace-pre-line">{letter.addressee.join("\n")}</p>
          <p className="font-semibold">{letter.subject}</p>
          {(unlocked ? letter.paragraphs.slice(0, 4) : letter.paragraphs.slice(0, 2)).map((p) => <p key={p} className="max-w-none!">{p}</p>)}
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>{letter.table[0].map((h, i) => <th key={i} scope="col" className={i ? "num" : ""}>{h || <span className="visually-hidden">Measure</span>}</th>)}</tr>
              </thead>
              <tbody>
                {letter.table.slice(1).map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell, i) => i === 0
                      ? <th key={i} scope="row" className="border-b-rule! font-normal! text-ink-2!">{cell}</th>
                      : <td key={i} className="num fig">{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {unlocked ? (
            <>
              {letter.paragraphs.slice(4).map((p) => <p key={p} className="max-w-none!">{p}</p>)}
              <p className="whitespace-pre-line">{letter.closing.join("\n\n")}</p>
            </>
          ) : (
            <p className="text-muted">
              The full letter continues with your undisputed average payment of {formatRand(dispute.safePaymentRand)} a month, the corrections
              requested, and {annexReadings.length || "no"} photo annexure{annexReadings.length === 1 ? "" : "s"}.
            </p>
          )}
        </article>
      </section>

      <section aria-labelledby="annex-title" className="grid gap-3">
        <h2 id="annex-title">Photo annexures</h2>
        {annexReadings.length === 0 ? (
          <p className="notice">The reading you used has no photo. A dispute is much stronger with one: log a new reading with a photo, then check the bill again.</p>
        ) : (
          <ul className="grid list-none grid-cols-2 gap-4 p-0 sm:grid-cols-4">
            {annexReadings.map((r) => (
              <li key={r.id} className="grid gap-1">
                <Photo path={r.photoPath} alt={`Meter photo, reading ${r.value}`} className="aspect-square w-full" />
                <span className="fig text-sm">{r.value}</span>
                <span className="fig text-xs text-muted">{formatSast(r.loggedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error && <p className="error" role="alert">{error}</p>}

      {unlocked ? (
        <button type="button" className="btn btn--ink" onClick={download} disabled={busy} aria-busy={busy}>
          <Download aria-hidden="true" size={18} /> {busy ? "Building PDF…" : "Download PDF"}
        </button>
      ) : (
        <div className="grid gap-4">
          <PayButton product="dispute_pack" disputeId={dispute.id} onPaid={reload}>Unlock &amp; Download PDF (R79)</PayButton>
          <PayButton product="account_shield" disputeId={null} onPaid={reload} variant="card">Or Account Shield, R39 a month</PayButton>
        </div>
      )}
      <button type="button" className="btn btn--card justify-self-start" onClick={() => void removeDispute()}>
        <Trash2 aria-hidden="true" size={16} /> Delete this bill check
      </button>
      <p className="hint">
        Statement dated {formatLongDate(dispute.statementDate)}. MeterProof provides administrative templates and billing calculations, not legal advice.
      </p>
      {dialog}
    </div>
  );
}
