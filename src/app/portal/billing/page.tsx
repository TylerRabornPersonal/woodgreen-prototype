"use client";

import { useState } from "react";
import { usePortal } from "@/components/portal/PortalProvider";
import { invoices, license, money } from "@/lib/portal/mock";

function brandFromNumber(digits: string): string {
  if (digits.startsWith("4")) return "Visa";
  if (digits.startsWith("5")) return "Mastercard";
  if (digits.startsWith("3")) return "Amex";
  return "Card";
}

export default function BillingPage() {
  const { paymentMethods, addPaymentMethod, removePaymentMethod, setDefaultPaymentMethod } = usePortal();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"card" | "bank">("card");
  const [num, setNum] = useState("");
  const [extra, setExtra] = useState(""); // exp or routing

  const submit = () => {
    const digits = num.replace(/\D/g, "");
    if (digits.length < 4) return;
    const last4 = digits.slice(-4);
    addPaymentMethod({
      kind,
      label: kind === "card" ? brandFromNumber(digits) : "Bank · Checking",
      last4,
    });
    setNum("");
    setExtra("");
    setOpen(false);
  };

  return (
    <div>
      <header className="portal-head">
        <div>
          <h1 className="portal-h1">Billing &amp; payments</h1>
          <p className="portal-sub">{money(license.netMonthlyCents)}/mo · auto-drafted in advance</p>
        </div>
      </header>

      <div className="pcard">
        <div className="pcard-headrow">
          <span className="pcard-eyebrow">Payment methods</span>
          <button className="btn btn-pop btn-sm" onClick={() => setOpen(true)}>+ Add method</button>
        </div>
        <div className="pm-list">
          {paymentMethods.map((p) => (
            <div className="pm" key={p.id}>
              <div className="pm-info">
                <span className="pm-icon">{p.kind === "card" ? "▭" : "🏦"}</span>
                <div>
                  <div className="pm-label">{p.label} <span className="pm-dots">····{p.last4}</span></div>
                  <div className="pm-kind">{p.kind === "card" ? "Credit / debit card" : "Bank account · ACH"}</div>
                </div>
              </div>
              <div className="pm-actions">
                {p.isDefault ? (
                  <span className="pm-default">Default</span>
                ) : (
                  <button className="linklike" onClick={() => setDefaultPaymentMethod(p.id)}>Make default</button>
                )}
                <button className="linklike danger" onClick={() => removePaymentMethod(p.id)}>Remove</button>
              </div>
            </div>
          ))}
          {paymentMethods.length === 0 && <p className="portal-note">No payment method on file. Add one to enable auto-draft.</p>}
        </div>
        <p className="portal-note">Simulated billing — this mimics the Stripe Customer Portal. No real card or bank data is stored or charged.</p>
      </div>

      <div className="pcard">
        <span className="pcard-eyebrow">Invoice history</span>
        <table className="bill-table">
          <thead><tr><th>Invoice</th><th>Period</th><th>Status</th><th className="num">Amount</th></tr></thead>
          <tbody>
            {invoices.map((i) => (
              <tr key={i.id}>
                <td>{i.number}</td>
                <td>{i.periodLabel}</td>
                <td><span className={`inv-status ${i.status}`}>{i.dateLabel}</span></td>
                <td className="num">{money(i.amountCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Add a payment method</h3>
              <button className="modal-x" onClick={() => setOpen(false)}>×</button>
            </div>
            <div className="seg" style={{ marginBottom: 14 }}>
              <button className={kind === "card" ? "on" : ""} onClick={() => setKind("card")}>Card</button>
              <button className={kind === "bank" ? "on" : ""} onClick={() => setKind("bank")}>Bank (ACH)</button>
            </div>
            <div className="field">
              <label>{kind === "card" ? "Card number" : "Account number"}</label>
              <input value={num} onChange={(e) => setNum(e.target.value)} placeholder={kind === "card" ? "4242 4242 4242 4242" : "000123456789"} inputMode="numeric" />
            </div>
            <div className="field">
              <label>{kind === "card" ? "Expiry · CVC" : "Routing number"}</label>
              <input value={extra} onChange={(e) => setExtra(e.target.value)} placeholder={kind === "card" ? "12 / 28 · 123" : "062000019"} inputMode="numeric" />
            </div>
            <button className="btn btn-pop" style={{ width: "100%", justifyContent: "center" }} onClick={submit} disabled={num.replace(/\D/g, "").length < 4}>
              Add {kind === "card" ? "card" : "bank account"}
            </button>
            <p className="portal-note" style={{ textAlign: "center" }}>🔒 Simulated. In production this is Stripe’s secure element — we never touch raw numbers.</p>
          </div>
        </div>
      )}
    </div>
  );
}
