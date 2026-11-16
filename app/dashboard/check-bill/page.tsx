"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Empty, Loading, LoadError } from "@/components/states";
import { checkBill, formatRand, formatSast, formatUnits } from "@/lib/billing";
import { getStore, tariffUtility, type Meter } from "@/lib/store";
import { MUNICIPALITIES, TARIFF_YEAR } from "@/lib/tariffs";
import { errorMessage, useData } from "@/lib/use-data";

const num = (s: string) => (s.trim() === "" ? null : Number(s.replace(/[\s,]/g, "")));

export default function CheckBillPage() {
  const router = useRouter();
  const { state, reload } = useData();
  const [meterId, setMeterId] = useState("");
  const [evidenceId, setEvidenceId] = useState("");
  const [statementDate, setStatementDate] = useState("");
  const [days, setDays] = useState("30");
  const [previous, setPrevious] = useState("");
  const [current, setCurrent] = useState("");
  const [isEstimate, setIsEstimate] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (state.status === "loading") return <Loading label="Loading your meters" />;
  if (state.status === "error") return <LoadError message={state.message} onRetry={reload} />;

  const billable = state.data.meters.filter((m) => m.utility !== "electricity_prepaid");
  if (billable.length === 0) {
    return (
      <div className="grid gap-6">
        <h1>Check a bill</h1>
        <Empty
          title="Add a postpaid or water meter first"
          text="Bill checks compare a municipal statement with your own readings. Prepaid electricity has no estimated bills, so it cannot be checked here."
          href="/dashboard" action="Go to meters"
        />
      </div>
    );
  }

  const meter: Meter = billable.find((m) => m.id === meterId) ?? billable[0];
  const tariff = MUNICIPALITIES[meter.municipality].tariffs[tariffUtility(meter.utility)];
  const meterReadings = state.data.readings.filter((r) => r.meterId === meter.id); // newest first
  const evidence = meterReadings.find((r) => r.id === evidenceId) ?? meterReadings[0];
  const earlier = evidence && meterReadings.find((r) => r.loggedAt < evidence.loggedAt);

  const p = num(previous), c = num(current), d = num(days);
  const problems: string[] = [];
  if (p !== null && !(p >= 0)) problems.push("The previous reading must be a number.");
  if (c !== null && !(c >= 0)) problems.push("The current reading must be a number.");
  if (p !== null && c !== null && c < p) problems.push("The current reading is lower than the previous reading. Check the statement.");
  if (d !== null && !(d >= 1 && d <= 366)) problems.push("The billing period must be between 1 and 366 days.");
  if (evidence && p !== null && evidence.value < p) problems.push("Your photo reading is lower than the billed previous reading, so the previous reading may itself be wrong. Mention this in your dispute.");

  const ready = evidence && statementDate !== "" && p !== null && c !== null && d !== null && c >= p && d >= 1 && d <= 366;
  const result = ready
    ? checkBill({
        tariff, billingDays: d, billedPrevious: p, billedCurrent: c, actualReading: evidence.value,
        earlier: earlier && {
          reading: earlier.value,
          daysBefore: (new Date(evidence.loggedAt).getTime() - new Date(earlier.loggedAt).getTime()) / 86_400_000,
        },
      })
    : null;

  async function save() {
    if (!result || !evidence || p === null || c === null || d === null) return;
    setBusy(true);
    setError(null);
    try {
      const dispute = await getStore().addDispute({
        meterId: meter.id, statementDate, billingDays: d, billedPrevious: p, billedCurrent: c, isEstimate,
        evidenceReadingId: evidence.id, billedUnits: result.billedUnits, actualUnits: result.actualUnits,
        overbilledUnits: result.overbilledUnits, billedRand: result.billedRand, actualRand: result.actualRand,
        overchargeRand: result.overchargeRand, safePaymentRand: result.safePaymentRand,
      });
      router.push(`/dashboard/dispute-pack?id=${dispute.id}`);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1>Check a bill</h1>
        <p className="text-ink-2">Copy the readings from your latest statement. We compare them with your photo reading.</p>
      </div>

      <form className="stock grid gap-4 p-5" onSubmit={(e) => { e.preventDefault(); void save(); }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="field">
            <label htmlFor="meter">Meter</label>
            <select id="meter" name="meter" className="input" value={meter.id} onChange={(e) => { setMeterId(e.target.value); setEvidenceId(""); }}>
              {billable.map((m) => (
                <option key={m.id} value={m.id}>
                  {MUNICIPALITIES[m.municipality].shortName} {m.utility === "water" ? "water" : "electricity"}, {m.meterNumber}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="statementDate">Statement date</label>
            <input id="statementDate" name="statementDate" type="date" className="input fig" required value={statementDate}
              onChange={(e) => setStatementDate(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="previous">Billed previous reading</label>
            <input id="previous" name="previous" className="input fig" inputMode="decimal" required autoComplete="off" value={previous}
              onChange={(e) => setPrevious(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="current">Billed current reading</label>
            <input id="current" name="current" className="input fig" inputMode="decimal" required autoComplete="off" value={current}
              onChange={(e) => setCurrent(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="days">Billing period, in days</label>
            <input id="days" name="days" className="input fig" inputMode="numeric" required autoComplete="off" value={days}
              onChange={(e) => setDays(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="evidence">Your photo reading</label>
            {meterReadings.length ? (
              <select id="evidence" name="evidence" className="input fig" value={evidence?.id} onChange={(e) => setEvidenceId(e.target.value)}>
                {meterReadings.map((r) => <option key={r.id} value={r.id}>{r.value} on {formatSast(r.loggedAt)}</option>)}
              </select>
            ) : (
              <p id="evidence" className="notice">
                No readings logged for this meter. <Link className="link" href="/dashboard">Log one on the Meters screen</Link> first.
              </p>
            )}
          </div>
        </div>
        <label className="check">
          <input type="checkbox" name="isEstimate" checked={isEstimate} onChange={(e) => setIsEstimate(e.target.checked)} />
          The statement marks this reading as &ldquo;Estimate&rdquo; or &ldquo;Interim&rdquo;
        </label>

        {problems.length > 0 && (
          <ul className="notice m-0 grid list-none gap-1" role="status">{problems.map((x) => <li key={x}>{x}</li>)}</ul>
        )}

        <section aria-live="polite" aria-labelledby="result-title" className="grid gap-4 border-t border-rule pt-4">
          <h2 id="result-title">Result</h2>
          {!result ? (
            <p className="hint">Fill in the statement date and billed readings to see the comparison.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr><th scope="col"><span className="visually-hidden">Measure</span></th><th scope="col" className="num">Billed</th><th scope="col" className="num">Actual</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row" className="border-b-rule! font-normal! text-ink-2!">Consumption</th>
                      <td className="num fig">{formatUnits(result.billedUnits, tariff.unit)}</td>
                      <td className="num fig">{formatUnits(result.actualUnits, tariff.unit)}</td>
                    </tr>
                    <tr>
                      <th scope="row" className="border-b-rule! font-normal! text-ink-2!">Charge incl. VAT</th>
                      <td className="num fig">{formatRand(result.billedRand)}</td>
                      <td className="num fig">{formatRand(result.actualRand)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <dl className="rows">
                <div>
                  <dt>Estimated overcharge, incl. 15% VAT</dt>
                  <dd className="fig text-2xl font-medium">{formatRand(result.overchargeRand)}</dd>
                </div>
                <div>
                  <dt>Safe average payment, per month</dt>
                  <dd className="fig text-lg">{formatRand(result.safePaymentRand)}</dd>
                </div>
              </dl>
              <p className="hint">
                The safe average is {formatUnits(result.dailyAverageUnits, tariff.unit)} a day
                {result.averageFromPhotos ? ", from your last two photo readings," : ", from this billing period,"} over 30 days. It covers consumption only: keep
                paying fixed charges, rates and refuse in full.
              </p>
              <p className="notice">
                {tariff.verified ? "Rates" : "Indicative rates"}: {tariff.name}, {TARIFF_YEAR}. {tariff.note}
              </p>
              {result.overbilledUnits === 0 && (
                <p className="notice">The bill is not ahead of your meter on these readings, so there is nothing to dispute.</p>
              )}
            </>
          )}
        </section>

        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" className="btn btn--ink sm:justify-self-start" disabled={!result || result.overbilledUnits === 0 || busy} aria-busy={busy}>
          {busy ? "Saving…" : "Save and build dispute pack"}
        </button>
      </form>
    </div>
  );
}
