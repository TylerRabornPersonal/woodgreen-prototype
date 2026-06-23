import Link from "next/link";
import { kpis, adminInvoices, adminBookings, money } from "@/lib/admin/mock";

export default function AdminOverview() {
  const issues = adminInvoices.filter((i) => i.status === "failed" || i.status === "overdue");

  const stats = [
    { label: "Occupancy", num: `${kpis.occupancyPct}%`, sub: `${kpis.leasedCount} of ${kpis.totalOffices} offices leased` },
    { label: "Available units", num: String(kpis.availableCount), sub: "ready to lease" },
    { label: "Monthly recurring", num: money(kpis.mrrCents), sub: "net of discounts" },
    { label: "Active tenants", num: String(kpis.activeTenants), sub: "current licenses" },
    { label: "Payment issues", num: String(kpis.paymentIssues), sub: "need attention", alert: kpis.paymentIssues > 0 },
    { label: "Bookings this week", num: String(kpis.bookingsThisWeek), sub: "conference rooms" },
  ];

  return (
    <div>
      <header className="portal-head">
        <div>
          <h1 className="portal-h1">Overview</h1>
          <p className="portal-sub">25 Woodgreen Place · operator console</p>
        </div>
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
          <span className="pcard-eyebrow">Next conference bookings</span>
          <Link href="/admin/calendar" className="linklike">Open calendar</Link>
        </div>
        <p className="portal-note">{adminBookings.length} bookings scheduled across the week.</p>
      </div>

      <p className="portal-note">Demo console · figures illustrative. Payments are simulated.</p>
    </div>
  );
}
