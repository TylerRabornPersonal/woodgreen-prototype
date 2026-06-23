"use client";

import Link from "next/link";
import { usePortal } from "@/components/portal/PortalProvider";
import { tenant, license, confBank, invoices, money } from "@/lib/portal/mock";

export default function PortalDashboard() {
  const { confRemaining, paymentMethods, bookings } = usePortal();
  const due = invoices.find((i) => i.status === "due");
  const defaultPm = paymentMethods.find((p) => p.isDefault);
  const upcoming = bookings.filter((b) => b.dateISO >= new Date().toISOString().slice(0, 10));

  return (
    <div>
      <header className="portal-head">
        <div>
          <h1 className="portal-h1">Welcome back, {tenant.primaryContact.name.split(" ")[0]}.</h1>
          <p className="portal-sub">{tenant.suiteLabel}</p>
        </div>
        <span className="portal-status">{license.status}</span>
      </header>

      <div className="portal-grid">
        <div className="pcard">
          <span className="pcard-eyebrow">Your suite</span>
          <div className="pcard-big">{money(license.netMonthlyCents)}<small>/mo</small></div>
          <div className="pcard-meta">
            {license.offices.length} offices · {license.furnished ? "furnished" : "unfurnished"} · {license.termMonths}-month term
          </div>
          <div className="pcard-rows">
            <div className="prow"><span>License</span><span>{license.number}</span></div>
            <div className="prow"><span>Term</span><span>{license.startDate} – {license.endDate}</span></div>
            <div className="prow"><span>Conference bank</span><span>{confBank.allotted} hrs / mo</span></div>
          </div>
          <Link href="/portal/agreement" className="btn btn-ghost pcard-btn">View agreement</Link>
        </div>

        <div className="pcard">
          <span className="pcard-eyebrow">Next payment</span>
          <div className="pcard-big">{due ? money(due.amountCents) : "—"}</div>
          <div className="pcard-meta">{due ? `${due.periodLabel} · ${due.dateLabel}` : "Nothing due"}</div>
          <div className="pcard-rows">
            <div className="prow">
              <span>Auto-draft from</span>
              <span>{defaultPm ? `${defaultPm.label} ····${defaultPm.last4}` : "No method on file"}</span>
            </div>
          </div>
          <Link href="/portal/billing" className="btn btn-ghost pcard-btn">Manage billing</Link>
        </div>

        <div className="pcard">
          <span className="pcard-eyebrow">Conference hours · {confBank.periodLabel}</span>
          <div className="pcard-big">{confRemaining}<small> of {confBank.allotted} left</small></div>
          <div className="pcard-meta">{upcoming.length} upcoming booking{upcoming.length === 1 ? "" : "s"}</div>
          <div className="confmeter"><span style={{ width: `${(confRemaining / confBank.allotted) * 100}%` }} /></div>
          <Link href="/portal/book" className="btn btn-pop pcard-btn">Book a room</Link>
        </div>
      </div>

      <p className="portal-note">Demo portal · figures are illustrative. Billing is simulated (no real charges).</p>
    </div>
  );
}
