"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { tenant } from "@/lib/portal/mock";
import type { ReactNode } from "react";

const NAV = [
  { href: "/portal", label: "Dashboard" },
  { href: "/portal/agreement", label: "License agreement" },
  { href: "/portal/billing", label: "Billing & payments" },
  { href: "/portal/book", label: "Book a room" },
];

export default function PortalShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const initials = tenant.orgName.split(" ").filter((w) => /[A-Za-z]/.test(w[0])).slice(0, 2).map((w) => w[0]).join("");

  return (
    <div className="portal">
      <aside className="portal-side">
        <Link href="/" className="portal-brand">
          <span className="wm"><span className="n">25</span><span className="t">WOODGREEN</span></span>
        </Link>
        <div className="portal-tenant">
          <div className="pt-avatar">{initials}</div>
          <div>
            <div className="pt-name">{tenant.orgName}</div>
            <div className="pt-sub">Tenant portal · demo</div>
          </div>
        </div>
        <nav className="portal-nav">
          {NAV.map((n) => {
            const active = n.href === "/portal" ? path === "/portal" : path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={`portal-navlink${active ? " on" : ""}`}>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <Link href="/" className="portal-signout">← Sign out</Link>
      </aside>
      <div className="portal-main">{children}</div>
    </div>
  );
}
