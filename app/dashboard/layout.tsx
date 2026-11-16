"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Gauge, Calculator, FileText, ListChecks } from "lucide-react";
import { getStore, HAS_SUPABASE } from "@/lib/store";

const NAV = [
  { href: "/dashboard", label: "Meters", icon: Gauge },
  { href: "/dashboard/check-bill", label: "Check bill", icon: Calculator },
  { href: "/dashboard/dispute-pack", label: "Dispute pack", icon: FileText },
  { href: "/dashboard/tracker", label: "Tracker", icon: ListChecks },
];

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const pathname = usePathname();
  const router = useRouter();
  // Local mode has no accounts, so there is nothing to wait for.
  const [signedIn, setSignedIn] = useState(!HAS_SUPABASE);

  useEffect(() => {
    if (!HAS_SUPABASE) return;
    getStore().userId().then((id) => (id ? setSignedIn(true) : router.replace("/login")));
  }, [router]);

  const links = (className: string, iconSize: number) =>
    NAV.map(({ href, label, icon: Icon }) => (
      <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className={className}>
        <Icon aria-hidden="true" size={iconSize} strokeWidth={1.75} />
        {label}
      </Link>
    ));

  return (
    <div className="app flex min-h-dvh flex-col bg-paper">
      <header className="border-b border-rule bg-paper-2">
        <div className="wrap flex items-center justify-between gap-4 py-2">
          <Link href="/" className="link--tap text-lg font-semibold tracking-tight no-underline" translate="no">MeterProof</Link>
          <nav className="topnav flex gap-1 max-md:hidden" aria-label="Dashboard">{links("gap-2", 18)}</nav>
          <div className="flex items-center gap-3">
            {!HAS_SUPABASE && <span className="tag text-muted" title="No Supabase keys set: data is kept in this browser only">Local mode</span>}
            <Link href="/dashboard/account" className="link link--tap" aria-current={pathname === "/dashboard/account" ? "page" : undefined}>Account</Link>
          </div>
        </div>
      </header>

      <main id="main" className="wrap wrap--app flex-1 py-6 max-md:pb-24">
        {/* Suspense lets pages read the clock and the URL without blocking the prerender. */}
        <Suspense fallback={<div className="skeleton h-40" aria-busy="true" aria-label="Loading" />}>
          {signedIn ? children : <div className="skeleton h-40" aria-busy="true" aria-label="Checking your sign-in" />}
        </Suspense>
      </main>

      <nav className="tabbar fixed inset-x-0 bottom-0 z-(--z-sticky) grid grid-cols-4 border-t border-rule-2 bg-cotton pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Dashboard">
        {links("", 22)}
      </nav>
    </div>
  );
}
