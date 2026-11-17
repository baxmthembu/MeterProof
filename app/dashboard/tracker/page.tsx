"use client";

import { useState } from "react";
import { CalendarPlus, Copy } from "lucide-react";
import { PayButton } from "@/components/pay-button";
import { Empty, Loading, LoadError } from "@/components/states";
import { businessDaysBetween, ESCALATION_BUSINESS_DAYS, formatRand, readingReminderIcs } from "@/lib/billing";
import { escalationLadder } from "@/lib/letters";
import {
  CHANNELS, getStore, isShield, LANDLORD_METER_LIMIT, STATUSES,
  type Channel, type Dispute, type DisputeStatus, type Meter, type Profile,
} from "@/lib/store";
import { MUNICIPALITIES } from "@/lib/tariffs";
import { errorMessage, useData } from "@/lib/use-data";

export default function TrackerPage() {
  const { state, reload } = useData();

  if (state.status === "loading") return <Loading label="Loading your disputes" />;
  if (state.status === "error") return <LoadError message={state.message} onRetry={reload} />;
  const { disputes, meters, profile } = state.data;
  const shield = isShield(profile);

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1>Tracker</h1>
        <p className="text-ink-2">
          Record the reference number the municipality gives you. Disputes still open after {ESCALATION_BUSINESS_DAYS} business days are flagged for escalation.
        </p>
      </div>

      {!shield ? (
        <div className="stock grid gap-4 p-5">
          <h2>The tracker is part of Account Shield</h2>
          <p className="text-ink-2">R129 a quarter (R43 a month): unlimited dispute packs, unlimited photo and bill reads, the reference number and escalation tracker, and reading reminders.</p>
          <PayButton product="account_shield" disputeId={null} onPaid={reload}>Start Account Shield (R129 a quarter)</PayButton>
          <p className="hint">Managing several properties? The Landlord plan is Account Shield for up to {LANDLORD_METER_LIMIT} meters, R299 a month.</p>
          <PayButton product="landlord" disputeId={null} onPaid={reload} variant="card">Start the Landlord plan (R299 a month)</PayButton>
        </div>
      ) : disputes.length === 0 ? (
        <>
          <ReminderSchedule />
          <Empty title="No disputes to track" text="Check a bill and send your dispute pack. Then log the reference number here."
            href="/dashboard/check-bill" action="Check a bill" />
        </>
      ) : (
        <>
          <ReminderSchedule />
          <ul className="grid list-none gap-4 p-0">
            {disputes.map((d) => {
              const meter = meters.find((m) => m.id === d.meterId);
              return meter ? <li key={d.id}><DisputeCard dispute={d} meter={meter} profile={profile} reload={reload} /></li> : null;
            })}
          </ul>
        </>
      )}
    </div>
  );
}

/** Most metros accept customer readings in the days before the scheduled read; a monthly rhythm keeps evidence current. */
function ReminderSchedule() {
  const next = new Date();
  next.setMonth(next.getMonth() + 1, 1);
  const dates = [0, 1, 2].map((i) => {
    const d = new Date(next.getFullYear(), next.getMonth() + i, 1);
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(d);
  });
  // A calendar file needs no SMS provider: the phone's own calendar does the reminding.
  function download() {
    const url = URL.createObjectURL(new Blob([readingReminderIcs(location.origin)], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "meterproof-reading-reminder.ics";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section className="notice grid gap-3" aria-labelledby="reminders">
      <div className="grid gap-1">
        <h2 id="reminders">Reading reminder schedule</h2>
        <p>Photograph and log every meter on the first of each month: <span className="fig">{dates.join(", ")}</span>.</p>
      </div>
      <button type="button" className="btn btn--card sm:justify-self-start" onClick={download}>
        <CalendarPlus aria-hidden="true" size={18} /> Add monthly reminder to my calendar
      </button>
    </section>
  );
}

function DisputeCard({ dispute, meter, profile, reload }: { dispute: Dispute; meter: Meter; profile: Profile; reload: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(0);

  const open = dispute.status !== "Resolved & Credited";
  const elapsed = dispute.submittedOn ? businessDaysBetween(new Date(`${dispute.submittedOn}T00:00:00`), new Date()) : null;
  const overdue = open && elapsed !== null && elapsed > ESCALATION_BUSINESS_DAYS;
  const ladder = overdue ? escalationLadder(profile, meter, dispute, elapsed) : [];
  const email = ladder[step]?.text ?? "";
  const idp = dispute.id.slice(0, 8);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const credited = String(f.get("recovered") ?? "").replace(/[\sR,]/g, "");
    const recoveredRand = credited === "" ? null : Number(credited);
    if (recoveredRand !== null && !(recoveredRand >= 0 && recoveredRand <= 1_000_000)) {
      return setMessage({ kind: "error", text: "Enter the amount credited in rand, like 1250.50." });
    }
    setBusy(true);
    setMessage(null);
    try {
      await getStore().updateDispute(dispute.id, {
        referenceNumber: String(f.get("referenceNumber")).trim(),
        submittedOn: String(f.get("submittedOn")) || null,
        channel: (String(f.get("channel")) || null) as Channel | null,
        status: f.get("status") as DisputeStatus,
        recoveredRand,
      });
      await reload();
      setMessage({ kind: "ok", text: "Saved." });
    } catch (err) {
      setMessage({ kind: "error", text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
    } catch {
      setMessage({ kind: "error", text: "Could not copy. Select the text and copy it manually." });
    }
  }

  return (
    <article className="stock grid gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="grid gap-1">
          <h2>{MUNICIPALITIES[meter.municipality].name}</h2>
          <p className="text-sm text-ink-2">
            Statement <span className="fig">{dispute.statementDate}</span>, meter <span className="fig">{meter.meterNumber}</span>, disputing{" "}
            <span className="fig">{formatRand(dispute.overchargeRand)}</span>
          </p>
        </div>
        <span className="tag">{overdue ? "Overdue" : dispute.status}</span>
      </div>

      <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit} onChange={() => setMessage(null)}>
        <div className="field">
          <label htmlFor={`ref-${idp}`}>Municipal reference number</label>
          <input id={`ref-${idp}`} name="referenceNumber" className="input fig" autoComplete="off" spellCheck={false} defaultValue={dispute.referenceNumber} />
        </div>
        <div className="field">
          <label htmlFor={`date-${idp}`}>Submission date</label>
          <input id={`date-${idp}`} name="submittedOn" type="date" className="input fig" defaultValue={dispute.submittedOn ?? ""} />
        </div>
        <div className="field">
          <label htmlFor={`channel-${idp}`}>Channel</label>
          <select id={`channel-${idp}`} name="channel" className="input" defaultValue={dispute.channel ?? ""}>
            <option value="">Not submitted yet</option>
            {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`status-${idp}`}>Status</label>
          <select id={`status-${idp}`} name="status" className="input" defaultValue={dispute.status}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`recovered-${idp}`}>Amount credited, once resolved (R)</label>
          <input id={`recovered-${idp}`} name="recovered" className="input fig" inputMode="decimal" autoComplete="off"
            defaultValue={dispute.recoveredRand ?? ""} aria-describedby={`recovered-hint-${idp}`} />
          <p id={`recovered-hint-${idp}`} className="hint">Counts towards the total MeterProof users have recovered. No personal details are shown.</p>
        </div>
        <div className="flex items-center gap-4 sm:col-span-2">
          <button type="submit" className="btn btn--card" disabled={busy} aria-busy={busy}>{busy ? "Saving…" : "Save"}</button>
          <span role="status" className={message?.kind === "error" ? "error" : "hint"}>{message?.text}</span>
        </div>
      </form>

      <p className="border-t border-rule pt-4 text-sm">
        {elapsed === null
          ? "Add the submission date to start counting business days."
          : <><span className="fig font-medium">{elapsed}</span> business day{elapsed === 1 ? "" : "s"} since you submitted{open ? "" : ". Resolved"}.</>}
      </p>

      {overdue && (
        <div className="grid gap-3">
          <p className="notice">
            More than {ESCALATION_BUSINESS_DAYS} business days have passed without a resolution. Work up these steps in order, and set the status to Escalated.
          </p>
          <div className="field">
            <label htmlFor={`step-${idp}`}>Escalation step</label>
            <select id={`step-${idp}`} className="input" value={step} onChange={(e) => { setStep(Number(e.target.value)); setCopied(false); }}>
              {ladder.map((s, i) => <option key={s.title} value={i}>{s.title}</option>)}
            </select>
            <p className="hint">{ladder[step]?.when}</p>
          </div>
          <div className="field">
            <label htmlFor={`email-${idp}`}>Text to send</label>
            <textarea id={`email-${idp}`} name="escalationEmail" className="input text-sm" rows={14} readOnly value={email} />
          </div>
          <div className="flex items-center gap-4">
            <button type="button" className="btn btn--ink" onClick={copy}><Copy aria-hidden="true" size={18} /> Copy text</button>
            <span role="status" className="hint">{copied ? "Copied to clipboard." : ""}</span>
          </div>
        </div>
      )}
    </article>
  );
}
