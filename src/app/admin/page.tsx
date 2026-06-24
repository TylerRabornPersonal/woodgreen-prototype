"use client";

import Link from "next/link";
import { kpisFor, adminInvoicesFor, adminBookingsFor, renewalsDueFor, money } from "@/lib/admin/mock";
import { fmtLongDate } from "@/lib/portal/renewal";
import { OccupancyControl, useOccupancy } from "@/components/admin/OccupancyControl";

export default function AdminOverview() {
  const [occ, setOcc] = useOccupancy();
  const kpis = kpisFor(occ);
  const issues = adminInvoicesFor(occ).filter((i) => i.status === "failed" || i.status === "overdue");
  const bookings = adminBookingsFor(occ);
  const renewals = renewalsDueFor(occ);

  const stats = [
    { label: "Occupancy", num: `${kpis.occupancyPct}%`, sub: `${kpis.leasedCount} of ${kpis.totalOffices} offices leased` },
    { label: "Available units", num: String(kpis.availableCount), sub: "ready to lease" },
    { label: "Monthly recurring", num: money(kpis.mrrCents), sub: "net of discounts" },
    { label: "Active tenants", num: String(kpis.activeTenants), sub: "current licenses" },
    { label: "Conference hrs / mo", num: String(kpis.confHoursAllotted), sub: "allotted to tenants" },
    { label: "Payment issues", num: String(kpis.paymentIssues), sub: "need attention", alert: kpis.paymentIssues > 0 },
  ];

  return (
    <div>
      <header className="portal-head">
        <div>
          <h1 className="portal-h1">Overview</h1>
          <p className="portal-sub">25 Woodgreen Place · operator console</p>
        </div>
        <OccupancyControl occ={occ} onChange={setOcc} />
      </header>

      <div className="kpi-grid">
        {stats.map((s) => (
          <div key={s.label} className={`kpi${s.alert ? " alert" : ""}`}>
            <span className="kpi-label">{s.label}</span>
            <span className="kpi-num">{s.num}</span>
            <span className="kpi-sub">{s.sub}</span>
          </div>
        ))}
      </div>

      <div className="pcard">
        <div className="pcard-headrow">
          <span className="pcard-eyebrow">Needs attention · payments</span>
          <Link href="/admin/payments" className="linklike">View all payments</Link>
        </div>
        {issues.length ? (
          <div className="att-list">
            {issues.map((i) => (
              <div className="att" key={i.id}>
                <div>
                  <div className="att-tenant">{i.tenant}</div>
                  <div className="att-detail">{i.detail}</div>
                </div>
                <div className="att-right">
                  <span className={`inv-status ${i.status}`}>{i.status}</span>
                  <span className="att-amt">{money(i.amountCents)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="portal-note">All payments current.</p>
        )}
      </div>

      <div className="pcard">
        <div className="pcard-headrow">
          <span className="pcard-eyebrow">Upcoming renewals · next 120 days</span>
          <Link href="/admin/leases" className="linklike">Lease timeline</Link>
        </div>
        {renewals.length ? (
          <div className="att-list">
            {renewals.map((r) => (
              <div className="att" key={r.tenant}>
                <div>
                  <div className="att-tenant">{r.tenant}</div>
                  <div className="att-detail">
                    Term ends {fmtLongDate(r.endDate)} · {r.days < 0 ? `${-r.days}d past (holdover)` : `${r.days}d`}
                    {r.reminderSent ? " · 90-day reminder sent" : ""}
                    {r.pastNotice ? " · past 60-day notice → auto-renewing" : ""}
                  </div>
                </div>
                <div className="att-right">
                  <span className="att-amt">{money(r.monthlyCents)} → {money(r.renewMonthlyCents)}/mo</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="portal-note">No renewals due in the next 120 days.</p>
        )}
        <p className="portal-note">Reminder emails send 90 days out (Resend, in production); auto-renewal at +3% or the current Fee Schedule unless the tenant opts out by the 60-day mark.</p>
      </div>

      <div className="pcard">
        <div className="pcard-headrow">
          <span className="pcard-eyebrow">Next conference bookings</span>
          <Link href="/admin/calendar" className="linklike">Open calendar</Link>
        </div>
        <p className="portal-note">{bookings.length} bookings scheduled across the week.</p>
      </div>

      <p className="portal-note">Demo console · occupancy preset drives tenants, money &amp; bookings. Payments are simulated.</p>
    </div>
  );
}
