"use client";

import { license, tenant, money } from "@/lib/portal/mock";

export default function AgreementPage() {
  return (
    <div>
      <header className="portal-head">
        <div>
          <h1 className="portal-h1">License agreement</h1>
          <p className="portal-sub">{license.number} · executed {license.startDate}</p>
        </div>
        <button className="btn btn-pop" onClick={() => window.print()}>Download PDF</button>
      </header>

      <div className="pcard doc">
        <div className="doc-mark"><span className="wm"><span className="n">25</span><span className="t">WOODGREEN</span></span></div>
        <h2 className="doc-title">Office License Agreement</h2>

        <div className="doc-grid">
          <div><span className="doc-k">Licensee</span><span className="doc-v">{license ? tenant.legalName : ""}</span></div>
          <div><span className="doc-k">Primary contact</span><span className="doc-v">{tenant.primaryContact.name}</span></div>
          <div><span className="doc-k">Premises</span><span className="doc-v">{tenant.suiteLabel}</span></div>
          <div><span className="doc-k">Term</span><span className="doc-v">{license.termMonths} months · {license.startDate} – {license.endDate}</span></div>
          <div><span className="doc-k">Furnishing</span><span className="doc-v">{license.furnished ? "Furnished" : "Unfurnished"}</span></div>
          <div><span className="doc-k">Status</span><span className="doc-v">{license.status}</span></div>
        </div>

        <h3 className="doc-h3">Schedule A — Premises &amp; charges</h3>
        <table className="doc-table">
          <tbody>
            {license.lineItems.map((l, i) => (
              <tr key={i}>
                <td>{l.label}<span className="doc-sub"> · {l.sub}</span></td>
                <td className="num">{money(l.cents)}/mo</td>
              </tr>
            ))}
            <tr className="doc-tr-sum"><td>Gross monthly</td><td className="num">{money(license.grossMonthlyCents)}</td></tr>
            <tr><td>Less discounts ({(license.totalDiscount * 100).toFixed(0)}%: {(license.multiDiscount * 100).toFixed(0)}% multi-office + {(license.termDiscount * 100).toFixed(0)}% term)</td><td className="num">−{money(license.grossMonthlyCents - license.netMonthlyCents)}</td></tr>
            <tr className="doc-tr-total"><td>Net monthly license fee</td><td className="num">{money(license.netMonthlyCents)}</td></tr>
            <tr><td>Security deposit (one month)</td><td className="num">{money(license.depositCents)}</td></tr>
            <tr><td>Total contract value ({license.termMonths} mo)</td><td className="num">{money(license.contractValueCents)}</td></tr>
          </tbody>
        </table>

        <p className="doc-body">
          The Licensee is granted a non-exclusive license to occupy the Premises for the Term, together
          with the shared conference-hour allotment and building services described in Schedule B. The
          monthly license fee is billed in advance and drafted automatically from the payment method on
          file. This is a demonstration document; figures are illustrative and not a binding agreement.
        </p>

        <div className="doc-sign">
          <div className="doc-sign-block">
            <div className="doc-sign-line">{tenant.primaryContact.name}</div>
            <span className="doc-k">Licensee · signed electronically {license.startDate}</span>
          </div>
          <div className="doc-sign-block">
            <div className="doc-sign-line">25 Woodgreen Place, LLC</div>
            <span className="doc-k">Licensor</span>
          </div>
        </div>
      </div>
    </div>
  );
}
