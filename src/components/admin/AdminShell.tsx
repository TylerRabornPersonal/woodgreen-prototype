"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/units", label: "Units" },
  { href: "/admin/leases", label: "Lease timeline" },
  { href: "/admin/history", label: "Tenant history" },
  { href: "/admin/pricing", label: "Pricing" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/calendar", label: "Conference calendar" },
  { href: "/admin/tour", label: "Tour requests" },
  { href: "/admin/reports", label: "Reports" },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  return (
    <div className="portal admin">
      <aside className="portal-side">
        <Link href="/" className="portal-brand">
          <span className="wm"><span className="n">25</span><span className="t">WOODGREEN</span></span>
        </Link>
        <div className="portal-tenant">
          <div className="pt-avatar">OP</div>
          <div>
            <div className="pt-name">Operator console</div>
            <div className="pt-sub">25 Woodgreen · admin</div>
          </div>
        </div>
        <nav className="portal-nav">
          {NAV.map((n) => {
            const active = n.href === "/admin" ? path === "/admin" : path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={`portal-navlink${active ? " on" : ""}`}>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <Link href="/" className="portal-signout">← Back to site</Link>
      </aside>
      <div className="portal-main">{children}</div>
    </div>
  );
}
