"use client";

import { adminInvoicesFor, money, kpisFor } from "@/lib/admin/mock";
import { OccupancyControl, useOccupancy } from "@/components/admin/OccupancyControl";

const STATUS_LABEL: Record<string, string> = {
  paid: "Paid",
  due: "Scheduled",
  failed: "Payment failed",
  overdue: "Overdue",
};

export default function PaymentsPage() {
  const [occ, setOcc] = useOccupancy();
  const adminInvoices = adminInvoicesFor(occ);
  const kpis = kpisFor(occ);
  const collectedCents = adminInvoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amountCents, 0);
  const atRiskCents = adminInvoices.filter((i) => i.status === "failed" || i.status === "overdue").reduce((s, i) => s + i.amountCents, 0);

  return (
    <div>
      <header className="portal-head">
        <div>
          <h1 className="portal-h1">Payments</h1>
          <p className="portal-sub">June 2026 billing cycle · {kpis.paymentIssues} issue{kpis.paymentIssues === 1 ? "" : "s"} to resolve</p>
        </div>
        <OccupancyControl occ={occ} onChange={setOcc} />
      </header>

      <div className="kpi-grid three">
        <div className="kpi"><span className="kpi-label">Collected</span><span className="kpi-num">{money(collectedCents)}</span><span className="kpi-sub">this cycle</span></div>
        <div className="kpi alert"><span className="kpi-label">At risk</span><span className="kpi-num">{money(atRiskCents)}</span><span className="kpi-sub">failed + overdue</span></div>
        <div className="kpi"><span className="kpi-label">Scheduled</span><span className="kpi-num">{money(adminInvoices.filter((i) => i.status === "due").reduce((s, i) => s + i.amountCents, 0))}</span><span className="kpi-sub">upcoming drafts</span></div>
      </div>

      <div className="pcard">
        <span className="pcard-eyebrow">All invoices</span>
        <table className="bill-table">
          <thead><tr><th>Tenant</th><th>Invoice</th><th>Period</th><th>Status</th><th>Detail</th><th className="num">Amount</th></tr></thead>
          <tbody>
            {adminInvoices.map((i) => (
              <tr key={i.id} className={i.status === "failed" || i.status === "overdue" ? "row-alert" : ""}>
                <td>{i.tenant}</td>
                <td>{i.id}</td>
                <td>{i.periodLabel}</td>
                <td><span className={`inv-status ${i.status}`}>{STATUS_LABEL[i.status]}</span></td>
                <td className="cell-detail">{i.detail}</td>
                <td className="num">{money(i.amountCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="portal-note">Simulated billing. In production, failed/overdue rows trigger Stripe retries + dunning emails via Resend.</p>
      </div>
    </div>
  );
}
