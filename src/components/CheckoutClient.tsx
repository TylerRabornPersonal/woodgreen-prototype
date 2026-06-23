"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { money } from "@/lib/engine";

export type LineItem = { label: string; sub: string; price: number };
export type CheckoutData = {
  officeCodes: string[];
  officeSlugs: string[];
  addOnSlugs: string[];
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
  const router = useRouter();
  const [form, setForm] = useState({ company: "", name: "", email: "", phone: "" });

  const valid = form.company.trim() && form.name.trim() && form.email.trim();

  const toSign = () => {
    if (!valid) return;
    const p = new URLSearchParams({
      offices: data.officeSlugs.join(","),
      furnished: data.furnished ? "1" : "0",
      term: String(data.term),
      company: form.company,
      name: form.name,
      email: form.email,
    });
    if (data.addOnSlugs.length) p.set("addons", data.addOnSlugs.join(","));
    router.push(`/sign?${p.toString()}`);
  };

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
          This becomes the locked License Fee on Schedule A.
        </p>
      </div>

      {/* details → sign */}
      <div className="card panel pricebox">
        <h3>Your details</h3>
        <p className="lead" style={{ fontSize: 12.5 }}>We&apos;ll use these to prepare your license agreement for signature.</p>
        <div className="field"><label>Company / legal name</label><input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Acme LLC" /></div>
        <div className="field"><label>Your name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" /></div>
        <div className="field"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@acme.com" /></div>
        <div className="field"><label>Phone (optional)</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(601) 555-0100" /></div>
        <button className="btn btn-pop" style={{ width: "100%", justifyContent: "center" }} disabled={!valid} onClick={toSign}>
          Continue to license agreement →
        </button>
        <p className="placeholder-note" style={{ textAlign: "center" }}>Next: review &amp; e-sign. No payment taken in this prototype.</p>
      </div>
    </div>
  );
}
