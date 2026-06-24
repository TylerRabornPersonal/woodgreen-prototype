"use client";

import { unitsFor, tenantsFor, adminBookingsFor, rooms, kpisFor, floorLabels, money } from "@/lib/admin/mock";
import { OccupancyControl, useOccupancy } from "@/components/admin/OccupancyControl";

function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [occ, setOcc] = useOccupancy();
  const units = unitsFor(occ);
  const tenants = tenantsFor(occ);
  const adminBookings = adminBookingsFor(occ);
  const kpis = kpisFor(occ);

  const occupancyCSV = () =>
    downloadCSV("woodgreen-occupancy.csv", [
      ["Office", "Floor", "SF", "Status", "Tenant"],
      ...units.map((u) => [u.code, floorLabels[u.floorId], u.sqft, u.status, u.tenant ?? ""]),
    ]);

  const revenueCSV = () =>
    downloadCSV("woodgreen-revenue.csv", [
      ["Tenant", "Contact", "Offices", "Term (mo)", "Furnished", "Net monthly ($)"],
      ...tenants.map((t) => [t.org, t.contact, t.officeCount, t.term, t.furnished ? "Yes" : "No", Math.round(t.netMonthlyCents / 100)]),
    ]);

  const rosterCSV = () =>
    downloadCSV("woodgreen-tenant-roster.csv", [
      ["Tenant", "Contact", "Email", "License", "Member since", "Offices"],
      ...tenants.map((t) => [t.org, t.contact, t.email, t.id, t.since, t.offices.map((o) => o.code).join(" / ")]),
    ]);

  const bookingsCSV = () =>
    downloadCSV("woodgreen-bookings.csv", [
      ["Room", "Tenant", "Date", "Start", "End"],
      ...adminBookings.map((b) => [rooms.find((r) => r.id === b.roomId)?.name ?? b.roomId, b.tenant, b.dateISO, b.start, b.end]),
    ]);

  const reports = [
    { title: "Occupancy report", stat: `${kpis.occupancyPct}% · ${kpis.leasedCount}/${kpis.totalOffices}`, desc: "Every office with lease status and tenant.", action: occupancyCSV },
    { title: "Revenue report", stat: `${money(kpis.mrrCents)} MRR`, desc: "Net monthly by tenant, net of discounts.", action: revenueCSV },
    { title: "Tenant roster", stat: `${kpis.activeTenants} tenants`, desc: "Contacts, licenses, and offices held.", action: rosterCSV },
    { title: "Booking utilization", stat: `${adminBookings.length} this week`, desc: "Conference room usage across tenants.", action: bookingsCSV },
  ];

  return (
    <div>
      <header className="portal-head">
        <div>
          <h1 className="portal-h1">Reports</h1>
          <p className="portal-sub">Pull a snapshot of occupancy, revenue, tenants, or bookings</p>
        </div>
        <OccupancyControl occ={occ} onChange={setOcc} />
      </header>

      <div className="report-grid">
        {reports.map((r) => (
          <div className="pcard report" key={r.title}>
            <span className="pcard-eyebrow">{r.title}</span>
            <div className="report-stat">{r.stat}</div>
            <p className="report-desc">{r.desc}</p>
            <button className="btn btn-ghost report-btn" onClick={r.action}>Download CSV</button>
          </div>
        ))}
      </div>
      <p className="portal-note">Demo reports export live from the mock dataset. Production adds date-range filters + scheduled email delivery (Resend).</p>
    </div>
  );
}
