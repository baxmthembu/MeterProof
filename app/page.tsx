import Link from "next/link";
import { Suspense } from "react";
import { Camera, Calculator, FileText } from "lucide-react";
import { QuickCheck } from "@/components/quick-check";
import { Logo } from "@/components/logo";
import { RecoveredTotal } from "@/components/recovered-total";
import { FREE_AI_LIMITS, LANDLORD_METER_LIMIT } from "@/lib/store/types";
import { checkBill, formatRand, formatUnits } from "@/lib/billing";
import { MUNICIPALITIES, MUNICIPALITY_IDS, TARIFF_YEAR } from "@/lib/tariffs";

// The worked example is computed by the same engine the dashboard uses, never typed in.
const exampleTariff = MUNICIPALITIES.joburg.tariffs.electricity;
const example = checkBill({ tariff: exampleTariff, billingDays: 30, billedPrevious: 47590, billedCurrent: 48210, actualReading: 47980 });

const plans = [
  {
    name: "Free forever", price: "R0", unit: "", href: "/dashboard", action: "Start logging readings",
    items: ["Monthly timestamped meter photo logger", "Overcharge estimator", `${FREE_AI_LIMITS.read} automatic photo or bill reads every 30 days`],
  },
  {
    name: "Dispute Pack", price: "R79", unit: "once-off", href: "/dashboard/dispute-pack", action: "Build a dispute pack",
    items: ["Downloadable PDF dispute letter", "Embedded timestamped photo evidence", "Estimated-vs-actual tariff maths", "Safe average payment calculator"],
  },
  {
    name: "Account Shield", price: "R129", unit: "a quarter", href: "/dashboard/tracker", action: "Open the tracker",
    items: ["Unlimited dispute packs", "Unlimited photo and bill reads","Dispute reference number and escalation tracker", "Escalation letters up to the Public Protector", "Monthly reading reminder for your calendar"],
  },
  {
    name: "Landlord", price: "R299", unit: "a month", href: "/dashboard", action: "Add your properties",
    items: [`Everything in Account Shield`, `Up to ${LANDLORD_METER_LIMIT} meters across your properties`, "Property labels on every meter"],
  },
];

export default function Home() {
  return (
    <>
      <header className="desk">
        <nav className="wrap flex items-center justify-between py-3" aria-label="Main">
          <Link href="/" className="link--tap text-lg font-semibold tracking-tight no-underline" translate="no"><Logo /></Link>
          <div className="flex items-center gap-2">
            <a href="#pricing" className="link--tap px-3 font-medium no-underline max-sm:hidden">Pricing</a>
            <Link href="/dashboard" className="btn btn--card">Open dashboard</Link>
          </div>
        </nav>
      </header>

      <main id="main">
        <section className="desk">
          <div className="wrap grid items-center gap-10 pb-16 pt-8 lg:min-h-[calc(100svh-72px)] lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-16 lg:pb-24">
            <div className="grid gap-6">
              <h1>Fight estimated municipal bills with evidence.</h1>
              <p className="lead">
                Stop paying inflated estimated municipal bills. Log timestamped meter photos, calculate your exact overcharge in Rands, and
                generate a formal dispute pack in 2 minutes.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/dashboard" className="btn btn--ink">Log a meter reading</Link>
                <a href="#pricing" className="btn btn--card">See pricing</a>
              </div>
              <Suspense fallback={null}><RecoveredTotal /></Suspense>
            </div>
            <QuickCheck />
          </div>
        </section>

        <section className="wrap py-(--section-gap)" aria-labelledby="metros">
          <h2 id="metros">Seven metros, each with its own tariff table</h2>
          <ul className="mt-10 grid list-none gap-(--gap-columns) p-0 sm:grid-cols-2 lg:grid-cols-4">
            {MUNICIPALITY_IDS.map((id) => {
              const m = MUNICIPALITIES[id];
              return (
                <li key={id} className="stock grid content-start gap-2 p-6">
                  <h3>{m.name}</h3>
                  <p className="text-sm text-ink-2">{m.utilities.electricity} and {m.utilities.water}</p>
                  <p className="label mt-2">Letters go to {m.billingDepartment.split(", ")[1]}</p>
                </li>
              );
            })}
          </ul>
          <p className="hint mt-6">Stepped residential rates for {TARIFF_YEAR}, including 15% VAT.</p>
        </section>

        <section className="wrap pb-(--section-gap)" aria-labelledby="example">
          <h2 id="example">What the bill says, and what your photo proves</h2>
          <div className="mt-10 grid gap-(--gap-columns) lg:grid-cols-2">
            <article className="stock p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <h3>Municipal statement</h3>
                <span className="tag">Estimate</span>
              </div>
              <dl className="rows mt-4">
                <div><dt>Previous reading</dt><dd className="fig">47 590</dd></div>
                <div><dt>Current reading, estimated</dt><dd className="fig">48 210</dd></div>
                <div><dt>Billed consumption</dt><dd className="fig">{formatUnits(example.billedUnits, "kWh")}</dd></div>
                <div><dt>Electricity charge</dt><dd className="fig">{formatRand(example.billedRand)}</dd></div>
              </dl>
            </article>
            <article className="stock p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <h3>Your photo evidence</h3>
                <span className="fig text-sm text-muted">2026-11-14 07:42 SAST</span>
              </div>
              <dl className="rows mt-4">
                <div><dt>Reading in your photo</dt><dd className="fig">47 980</dd></div>
                <div><dt>Actual consumption</dt><dd className="fig">{formatUnits(example.actualUnits, "kWh")}</dd></div>
                <div><dt>Overcharge to dispute</dt><dd className="fig font-medium">{formatRand(example.overchargeRand)}</dd></div>
                <div><dt>Safe average payment</dt><dd className="fig">{formatRand(example.safePaymentRand)}</dd></div>
              </dl>
              <p className="mt-4 text-right"><span className="pressed" aria-hidden="true">Disputed</span></p>
            </article>
          </div>
          <p className="hint mt-6">A worked example on City Power&rsquo;s conventional tariff, 30-day period.</p>

          <ol className="mt-16 grid list-none gap-(--gap-columns) p-0 md:grid-cols-3">
            {[
              { icon: Camera, title: "Photograph the meter", text: "Each photo is stamped with the date and time it was logged." },
              { icon: Calculator, title: "Check the statement", text: "Enter the billed readings and see the overcharge at your metro's rates." },
              { icon: FileText, title: "Send the dispute pack", text: "A formal letter, the maths and your photos in one PDF." },
            ].map(({ icon: Icon, title, text }) => (
              <li key={title} className="grid content-start gap-2 border-t border-rule-2 pt-6">
                <Icon aria-hidden="true" size={24} strokeWidth={1.75} />
                <h3>{title}</h3>
                <p className="text-ink-2">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="pricing" className="board" aria-labelledby="pricing-title">
          <div className="wrap py-(--section-gap)">
            <h2 id="pricing-title">Free to log. Pay only when you dispute.</h2>
            <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-(--gap-columns)">
              {plans.map((p) => (
                <article key={p.name} className="grid content-start gap-4 border-t border-board-type/25 pt-6">
                  <h3>{p.name}</h3>
                  <p className="flex items-baseline gap-2">
                    <span className="text-[3.5rem] font-semibold leading-none tracking-[-0.05em]">{p.price}</span>
                    {p.unit && <span className="label">{p.unit}</span>}
                  </p>
                  <ul className="grid list-none gap-2 p-0">
                    {p.items.map((item) => <li key={item} className="border-t border-board-type/15 pt-2">{item}</li>)}
                  </ul>
                  <Link href={p.href} className="btn btn--card mt-2 lg:justify-self-start">{p.action}</Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="wrap grid gap-6 py-16">
        <p className="text-3xl font-semibold tracking-tight" translate="no"><Logo /></p>
        <p className="max-w-[60ch]">MeterProof provides administrative templates and billing calculations, not legal advice.</p>
        <nav className="flex flex-wrap gap-x-6" aria-label="Footer">
          <Link href="/dashboard" className="link link--tap">Dashboard</Link>
          <Link href="/dashboard/check-bill" className="link link--tap">Check a bill</Link>
          <a href="#pricing" className="link link--tap">Pricing</a>
          <Link href="/privacy" className="link link--tap">Privacy policy</Link>
          <Link href="/terms" className="link link--tap">Terms and refunds</Link>
        </nav>
        <p className="hint">Tariffs for the {TARIFF_YEAR} municipal year. Always compare with the rates printed on your own statement.</p>
      </footer>
    </>
  );
}
