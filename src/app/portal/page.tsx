"use client";

import Link from "next/link";
import { usePortal } from "@/components/portal/PortalProvider";
import { money } from "@/lib/portal/mock";
import { fmtLongDate, choiceLabel } from "@/lib/portal/renewal";

export default function PortalDashboard() {
  const { confRemaining, paymentMethods, bookings, tenant, license, confBank, invoices, isGenerated, renewal, renewalChoice, setRenewalChoice } = usePortal();
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

      {renewal.windowOpen && (
        <div className={`renewal-banner${renewalChoice === "pending" ? " pending" : " decided"}`}>
          {renewalChoice === "pending" ? (
            <>
              <div className="rb-body">
                <div className="rb-title">Your license ends {fmtLongDate(renewal.endDate)} · {Math.max(renewal.daysToEnd, 0)} days left</div>
                <p className="rb-text">
                  To keep your offices, choose below by {fmtLongDate(renewal.noticeDeadline)} (the 60-day mark).
                  Renewing is the greater of <strong>+3%</strong> or the current rate — <strong>{money(renewal.renewMonthlyCents)}/mo</strong> for another {renewal.renewTermMonths} months,
                  starting {fmtLongDate(renewal.renewEffective)}. If you do nothing, it auto-renews at that rate.
                  {renewal.pastNoticeDeadline && " The notice deadline has passed — auto-renewal applies unless you switch to month-to-month."}
                </p>
              </div>
              <div className="rb-actions">
                <button className="btn btn-pop" onClick={() => setRenewalChoice("renew")}>Renew · {money(renewal.renewMonthlyCents)}/mo</button>
                <button className="btn btn-accent" onClick={() => setRenewalChoice("auto")}>Enable auto-renewal</button>
                <button className="btn btn-ghost" onClick={() => setRenewalChoice("mtm")}>Go month-to-month · {money(renewal.mtmMonthlyCents)}/mo</button>
              </div>
            </>
          ) : (
            <div className="rb-body">
              <div className="rb-title">✓ {choiceLabel[renewalChoice]}</div>
              <p className="rb-text">
                {renewalChoice === "mtm"
                  ? `Month-to-month at ${money(renewal.mtmMonthlyCents)}/mo begins ${fmtLongDate(renewal.renewEffective)} · 30-day notice to end. Billing updated.`
                  : `${money(renewal.renewMonthlyCents)}/mo for ${renewal.renewTermMonths} months begins ${fmtLongDate(renewal.renewEffective)}. Billing updated.`}
                {" "}<button className="linklike" onClick={() => setRenewalChoice("pending")}>Change</button>
              </p>
            </div>
          )}
        </div>
      )}

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

      <p className="portal-note">
        {isGenerated
          ? "Your portal · created from the offices you selected and signed for. Billing is simulated (no real charges)."
          : "Demo portal · sample tenant. Complete the reserve → sign → pay flow to generate your own. Billing is simulated."}
      </p>
    </div>
  );
}
