"use client";

import { useRef, useState } from "react";
import { Camera, Pencil, Plus, Trash2 } from "lucide-react";
import { Photo } from "@/components/photo";
import { Loading, LoadError } from "@/components/states";
import { formatSast } from "@/lib/billing";
import { downscale } from "@/lib/image";
import { getStore, METER_UTILITY_LABEL, tariffUtility, type Meter, type MeterUtility } from "@/lib/store";
import { MUNICIPALITIES, MUNICIPALITY_IDS, type MunicipalityId } from "@/lib/tariffs";
import { errorMessage, useData } from "@/lib/use-data";

const unitOf = (m: Meter) => MUNICIPALITIES[m.municipality].tariffs[tariffUtility(m.utility)].unit;

export default function MetersPage() {
  const { state, reload } = useData();
  const [adding, setAdding] = useState(false);
  const [logFor, setLogFor] = useState<Meter | null>(null);
  const [editing, setEditing] = useState<Meter | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  if (state.status === "loading") return <Loading label="Loading your meters" />;
  if (state.status === "error") return <LoadError message={state.message} onRetry={reload} />;
  const { meters, readings } = state.data;

  async function remove(m: Meter) {
    const count = readings.filter((r) => r.meterId === m.id).length;
    const what = `Delete meter ${m.meterNumber}? Its ${count} reading${count === 1 ? "" : "s"}, photos and bill checks are deleted too. This cannot be undone.`;
    if (!window.confirm(what)) return;
    setActionError(null);
    try {
      await getStore().deleteMeter(m.id);
      await reload();
    } catch (e) {
      setActionError(errorMessage(e));
    }
  }

  const openLog = (m: Meter) => {
    setLogFor(m);
    dialog.current?.showModal();
  };

  return (
    <div className="grid gap-8">
      <div className="flex items-center justify-between gap-4">
        <h1>Meters</h1>
        {meters.length > 0 && !adding && (
          <button type="button" className="btn btn--card" onClick={() => setAdding(true)}>
            <Plus aria-hidden="true" size={18} /> Add meter
          </button>
        )}
      </div>

      {(meters.length === 0 || adding) && (
        <MeterForm
          first={meters.length === 0}
          onCancel={meters.length ? () => setAdding(false) : undefined}
          onSaved={async () => { setAdding(false); await reload(); }}
        />
      )}

      {actionError && <p className="error" role="alert">{actionError}</p>}

      {meters.length > 0 && (
        <ul className="grid list-none gap-4 p-0">
          {meters.map((m) => {
            const latest = readings.find((r) => r.meterId === m.id);
            if (editing?.id === m.id) {
              return (
                <li key={m.id}>
                  <MeterForm first={false} editing={m} onCancel={() => setEditing(null)} onSaved={async () => { setEditing(null); await reload(); }} />
                </li>
              );
            }
            return (
              <li key={m.id} className="stock grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="grid gap-1">
                  <h2>{MUNICIPALITIES[m.municipality].name}</h2>
                  <p className="text-sm text-ink-2">{METER_UTILITY_LABEL[m.utility]}</p>
                  <dl className="mt-1 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
                    <dt className="text-muted">Account</dt><dd className="fig m-0 break-all">{m.accountNumber}</dd>
                    <dt className="text-muted">Meter</dt><dd className="fig m-0 break-all">{m.meterNumber}</dd>
                    <dt className="text-muted">Latest reading</dt>
                    <dd className="fig m-0">{latest ? `${latest.value} ${unitOf(m)}` : "None yet"}</dd>
                  </dl>
                </div>
                <div className="grid gap-2">
                  <button type="button" className="btn btn--ink" onClick={() => openLog(m)}>
                    <Camera aria-hidden="true" size={18} /> Log reading
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" className="btn btn--card px-3!" onClick={() => setEditing(m)}>
                      <Pencil aria-hidden="true" size={16} /> Edit
                    </button>
                    <button type="button" className="btn btn--card px-3!" onClick={() => void remove(m)}>
                      <Trash2 aria-hidden="true" size={16} /> Delete
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {meters.length > 0 && (
        <section aria-labelledby="timeline" className="grid gap-4">
          <h2 id="timeline">Evidence timeline</h2>
          {readings.length === 0 ? (
            <p className="notice">No readings yet. Photograph your meter and log the reading: each entry is stamped with the date and time.</p>
          ) : (
            <ol className="grid list-none gap-0 p-0">
              {readings.map((r) => {
                const m = meters.find((x) => x.id === r.meterId);
                return (
                  <li key={r.id} className="grid grid-cols-[72px_minmax(0,1fr)] gap-4 border-t border-rule py-4 first:border-t-0">
                    <Photo path={r.photoPath} alt={`Meter photo, reading ${r.value}`} className="h-[72px] w-[72px]" />
                    <div className="grid content-start gap-1">
                      <p className="fig text-lg font-medium">{r.value} {m ? unitOf(m) : ""}</p>
                      <p className="fig text-sm text-ink-2"><time dateTime={r.loggedAt}>{formatSast(r.loggedAt)}</time></p>
                      <p className="text-sm text-muted">
                        {m ? `${MUNICIPALITIES[m.municipality].shortName}, meter ${m.meterNumber}` : "Meter removed"}
                        {r.note ? `. ${r.note}` : ""}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      )}

      <dialog ref={dialog} className="stock sheet" aria-labelledby="log-title" onClose={() => setLogFor(null)}>
        {logFor && (
          <LogForm
            meter={logFor}
            onCancel={() => dialog.current?.close()}
            onSaved={async () => { dialog.current?.close(); await reload(); }}
          />
        )}
      </dialog>
    </div>
  );
}

function MeterForm({ first, editing, onSaved, onCancel }: { first: boolean; editing?: Meter; onSaved: () => Promise<void>; onCancel?: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const numbers = { accountNumber: String(f.get("accountNumber")).trim(), meterNumber: String(f.get("meterNumber")).trim() };
      if (editing) await getStore().updateMeter(editing.id, numbers);
      else await getStore().addMeter({ municipality: f.get("municipality") as MunicipalityId, utility: f.get("utility") as MeterUtility, ...numbers });
      await onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="stock grid gap-4 p-5" onSubmit={submit} aria-labelledby="meter-form-title">
      <div className="grid gap-1">
        <h2 id="meter-form-title">{editing ? "Edit meter" : first ? "Add your first meter" : "Add a meter"}</h2>
        {editing && <p className="text-sm text-ink-2">The municipality and utility cannot change, because past bill checks used their tariff.</p>}
        {first && <p className="text-sm text-ink-2">The account and meter numbers are printed on your municipal statement.</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="municipality">Municipality</label>
          <select id="municipality" name="municipality" className="input" required disabled={!!editing} defaultValue={editing?.municipality ?? "joburg"}>
            {MUNICIPALITY_IDS.map((id) => <option key={id} value={id}>{MUNICIPALITIES[id].name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="utility">Utility type</label>
          <select id="utility" name="utility" className="input" required disabled={!!editing} defaultValue={editing?.utility ?? "electricity_postpaid"}>
            {(Object.keys(METER_UTILITY_LABEL) as MeterUtility[]).map((u) => <option key={u} value={u}>{METER_UTILITY_LABEL[u]}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="accountNumber">Municipal account number</label>
          <input id="accountNumber" name="accountNumber" className="input fig" required autoComplete="off" spellCheck={false} maxLength={40} defaultValue={editing?.accountNumber} />
        </div>
        <div className="field">
          <label htmlFor="meterNumber">Meter number</label>
          <input id="meterNumber" name="meterNumber" className="input fig" required autoComplete="off" spellCheck={false} maxLength={40} defaultValue={editing?.meterNumber} />
        </div>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="submit" className="btn btn--ink" disabled={busy} aria-busy={busy}>{busy ? "Saving…" : "Save meter"}</button>
        {onCancel && <button type="button" className="btn btn--card" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

function LogForm({ meter, onSaved, onCancel }: { meter: Meter; onSaved: () => Promise<void>; onCancel: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const value = Number(String(f.get("value")).replace(/[\s,]/g, ""));
    if (!(value >= 0)) return setError("Enter the reading as a number, like 47980.");
    const file = f.get("photo");
    setBusy(true);
    setError(null);
    try {
      const photo = file instanceof File && file.size > 0 ? await downscale(file) : null;
      await getStore().addReading({ meterId: meter.id, value, note: String(f.get("note") ?? "").trim(), photo });
      await onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="grid grid-cols-1 gap-4" onSubmit={submit}>
      <div className="grid gap-1">
        <h2 id="log-title">Log a reading</h2>
        <p className="text-sm text-ink-2">
          {MUNICIPALITIES[meter.municipality].shortName}, meter <span className="fig">{meter.meterNumber}</span>. The date and time are stamped when you save.
        </p>
      </div>
      <div className="field">
        <label htmlFor="photo">Meter photo</label>
        <input id="photo" name="photo" type="file" accept="image/*" capture="environment" className="input" aria-describedby="photo-hint" />
        <p id="photo-hint" className="hint">Make sure the digits and the meter number are readable.</p>
      </div>
      <div className="field">
        <label htmlFor="value">Meter reading, in {unitOf(meter)}</label>
        <input id="value" name="value" className="input fig" inputMode="decimal" required autoComplete="off" />
      </div>
      <div className="field">
        <label htmlFor="note">Note, optional</label>
        <input id="note" name="note" className="input" maxLength={140} autoComplete="off" />
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="submit" className="btn btn--ink" disabled={busy} aria-busy={busy}>{busy ? "Saving…" : "Save reading"}</button>
        <button type="button" className="btn btn--card" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
