import Link from "next/link";
import { Logo } from "@/components/logo";
import { OPERATOR } from "@/lib/legal";

/** Shared frame for the privacy and terms pages: long-form text at a readable measure. */
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="app">
      <header className="border-b border-rule bg-paper-2">
        <nav className="wrap flex items-center justify-between py-2" aria-label="Main">
          <Link href="/" className="link--tap text-lg font-semibold tracking-tight no-underline" translate="no"><Logo /></Link>
          <Link href="/dashboard" className="link link--tap">Dashboard</Link>
        </nav>
      </header>
      <main id="main" className="wrap wrap--app grid gap-6 py-10 [&_h2]:mt-4 [&_li]:mt-1 [&_ul]:m-0 [&_ul]:pl-5">
        <h1>{title}</h1>
        <p className="hint">Last updated {OPERATOR.updated}</p>
        {children}
        <nav className="flex flex-wrap gap-x-6 border-t border-rule pt-4" aria-label="Legal">
          <Link href="/privacy" className="link link--tap">Privacy policy</Link>
          <Link href="/terms" className="link link--tap">Terms and refunds</Link>
        </nav>
      </main>
    </div>
  );
}
