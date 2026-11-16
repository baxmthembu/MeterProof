"use client";

import { useState } from "react";
import { quickCheck, formatRand, formatUnits } from "@/lib/billing";
import { MUNICIPALITIES, MUNICIPALITY_IDS, TARIFF_YEAR, type MunicipalityId, type Utility } from "@/lib/tariffs";

const toNumber = (s: string) => (s.trim() === "" ? null : Number(s.replace(/[\s,]/g, "")));

export function QuickCheck() {
  const [municipality, setMunicipality] = useState<MunicipalityId>("joburg");
  const [utility, setUtility] = useState<Utility>("electricity");
  const [actual, setActual] = useState("");
  const [billed, setBilled] = useState("");

  const tariff = MUNICIPALITIES[municipality].tariffs[utility];
  const a = toNumber(actual);
  const b = toNumber(billed);
  const invalid = (a !== null && !(a >= 0)) || (b !== null && !(b >= 0));
  const ready = a !== null && b !== null && !invalid;
  const result = ready ? quickCheck(tariff, a, b) : null;

  return (
    <form className="stock grid gap-4 p-6 sm:p-8" onSubmit={(e) => e.preventDefault()} aria-labelledby="quick-check-title">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="quick-check-title" className="text-xl! tracking-tight!">Quick bill check</h2>
        <span className="label">No signup</span>
      </div>

      <div className="field">
        <label htmlFor="qc-municipality">Municipality</label>
        <select id="qc-municipality" name="municipality" className="input" value={municipality}
          onChange={(e) => setMunicipality(e.target.value as MunicipalityId)}>
          {MUNICIPALITY_IDS.map((id) => <option key={id} value={id}>{MUNICIPALITIES[id].name}</option>)}
        </select>
      </div>

      <fieldset className="field border-0 p-0 m-0">
        <legend className="mb-1">Utility</legend>
        <div className="groove">
          {(["electricity", "water"] as const).map((u) => (
            <label key={u}>
              <input type="radio" name="utility" value={u} checked={utility === u} onChange={() => setUtility(u)} />
              {u === "electricity" ? "Electricity" : "Water"}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-4">
        <div className="field">
          <label htmlFor="qc-actual">Your meter reading</label>
          <input id="qc-actual" name="actual" className="input fig" inputMode="decimal" autoComplete="off" placeholder="47 980…"
            value={actual} onChange={(e) => setActual(e.target.value)} aria-invalid={a !== null && !(a >= 0)} aria-describedby="qc-result" />
        </div>
        <div className="field">
          <label htmlFor="qc-billed">Reading on your bill</label>
          <input id="qc-billed" name="billed" className="input fig" inputMode="decimal" autoComplete="off" placeholder="48 210…"
            value={billed} onChange={(e) => setBilled(e.target.value)} aria-invalid={b !== null && !(b >= 0)} aria-describedby="qc-result" />
        </div>
      </div>

      <div id="qc-result" aria-live="polite" className="border-t border-rule pt-4 min-h-36">
        {invalid ? (
          <p className="error">Readings must be numbers, like 47980.</p>
        ) : !result ? (
          <p className="hint">Enter both readings in {tariff.unit} to see what you were billed for but did not use.</p>
        ) : result.units === 0 ? (
          <p>Your bill is not ahead of your meter on these readings, so there is no overcharge to dispute.</p>
        ) : (
          <div className="grid gap-3">
            <dl className="rows">
              <div><dt>Billed but not used</dt><dd className="fig">{formatUnits(result.units, tariff.unit)}</dd></div>
              <div>
                <dt>Approximate overcharge, incl. VAT</dt>
                <dd className="fig text-2xl font-medium">{formatRand(result.rand)}</dd>
              </div>
            </dl>
            <div className="flex items-end justify-between gap-4">
              <p className="hint max-w-[34ch]">
                {tariff.verified ? "Priced" : "Indicative: priced"} on {TARIFF_YEAR} rates as the top slice of a {tariff.typicalMonthlyUse} {tariff.unit} month.
              </p>
              <span className="pressed" aria-hidden="true">Overbilled</span>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
