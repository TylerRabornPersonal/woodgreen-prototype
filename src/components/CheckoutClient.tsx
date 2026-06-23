"use client";

import { useState } from "react";
import Link from "next/link";
import { money } from "@/lib/engine";

export type LineItem = { label: string; sub: string; price: number };
export type CheckoutData = {
  officeCodes: string[];
  officeSlugs: string[];
  term: number;
  furnished: boolean;
  lines: LineItem[];
  grossMonthly: number;
  multiDiscount: number;
  termDiscount: number;
  totalDiscount: number;
  netMonthly: number;
  annual: number;
  contractValue: number;
  confHours: number;
};

export default function CheckoutClient({ data }: { data: CheckoutData }) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ company: "", name: "", email: "", phone: "" });

  const valid = form.company.trim() && form.name.trim() && form.email.trim();

  if (submitted) {
    return (
      <div className="card panel confirm-screen">
        <div className="check">✓</div>
        <h2>Reservation request received</h2>
        <p className="lead" style={{ margin: "0 auto 6px" }}>
          Thanks, {form.name.split(" ")[0] || "there"} — we&apos;ve logged your request for{" "}
          {data.officeCodes.length > 1
            ? `${data.officeCodes.length} offices (${data.officeCodes.join(", ")})`
            : `Office ${data.officeCodes[0]}`}{" "}
          at {money(data.netMonthly)}/mo on a {data.term}-month term. Our team will reach out to{" "}
          {form.email} to finalize the license agreement.
        </p>
        <p className="placeholder-note">
          (Prototype: no charge was made and no email was sent. This is where the signed license +
          first invoice would kick off.)
        </p>
        <div style={{ marginTop: 22 }}>
          <Link href="/" className="btn btn-ghost">Back to building plan</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-grid">
      {/* summary */}
      <div className="card panel">
        <h3>Your package</h3>
        {data.lines.map((l, i) => (
          <div className="summary-line" key={i}>
            <span><strong>{l.label}</strong><br /><span style={{ color: "var(--muted)", fontSize: 12 }}>{l.sub}</span></span>
            <span>{money(l.price)}/mo</span>
          </div>
        ))}
        <div className="summary-line"><span>Gross monthly (list)</span><span>{money(data.grossMonthly)}</span></div>
        <div className="summary-line"><span>Multi-office discount</span><span style={{ color: "var(--brass)" }}>−{(data.multiDiscount * 100).toFixed(0)}%</span></div>
        <div className="summary-line"><span>Term discount · {data.term}mo</span><span style={{ color: "var(--brass)" }}>−{(data.termDiscount * 100).toFixed(0)}%</span></div>
        <div className="summary-line"><span>Furnishing</span><span>{data.furnished ? "Furnished" : "Unfurnished"}</span></div>
        <div className="summary-line"><span>Conference hours / mo</span><span>{data.confHours}</span></div>
        <div className="summary-line total"><span>You pay / month</span><span>{money(data.netMonthly)}</span></div>
        <p className="footnote">
          {money(data.annual)} per year · {money(data.contractValue)} total contract value over {data.term} months.
          List price — a starting point for negotiation.
        </p>
      </div>

      {/* contact / mock checkout */}
      <div className="card panel pricebox">
        <h3>Reserve it</h3>
        <p className="lead" style={{ fontSize: 12.5 }}>Tell us who you are and we&apos;ll prepare the license agreement.</p>
        <div className="field"><label>Company</label><input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Acme LLC" /></div>
        <div className="field"><label>Your name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" /></div>
        <div className="field"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@acme.com" /></div>
        <div className="field"><label>Phone (optional)</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(601) 555-0100" /></div>
        <button className="btn btn-pop" style={{ width: "100%", justifyContent: "center" }} disabled={!valid} onClick={() => setSubmitted(true)}>
          Submit reservation request
        </button>
        <p className="placeholder-note" style={{ textAlign: "center" }}>No payment taken in this prototype.</p>
      </div>
    </div>
  );
}
