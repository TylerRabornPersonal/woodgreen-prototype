"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Office, AddOn } from "@/lib/inventory";
import { quote, officeListPrice, addOnListPrice, money, type Term } from "@/lib/engine";
import { defaultOverrides, loadOverrides, toEngineConfig, rateFor } from "@/lib/pricing/store";
import { formatPhone, isValidPhone, isValidEmail } from "@/lib/format";

export default function CheckoutClient({
  offices: rawOffices,
  allAddOns,
  addOnSlugs,
  furnished,
  term,
}: {
  offices: Office[];
  allAddOns: AddOn[];
  addOnSlugs: string[];
  furnished: boolean;
  term: number;
}) {
  const router = useRouter();
  const [form, setForm] = useState({ company: "", name: "", email: "", phone: "" });
  const [ov, setOv] = useState(defaultOverrides());
  useEffect(() => setOv(loadOverrides()), []);
  const cfg = useMemo(() => toEngineConfig(ov), [ov]);

  const offices = useMemo(() => rawOffices.map((o) => ({ ...o, rate: rateFor(ov, o.slug, o.rate) })), [rawOffices, ov]);
  const chosen = useMemo(() => allAddOns.filter((a) => addOnSlugs.includes(a.slug)), [allAddOns, addOnSlugs]);

  const q = useMemo(
    () => quote({ officeBaseRates: offices.map((o) => o.rate), addOnRates: chosen.map((a) => a.rate), furnished, term: term as Term }, cfg),
    [offices, chosen, furnished, term, cfg],
  );

  const lines = [
    ...offices.map((o) => ({ label: `Office ${o.code}`, sub: `${o.sqft} SF · ${furnished ? "furnished" : "unfurnished"}`, price: officeListPrice(o.rate, furnished, cfg) })),
    ...chosen.map((a) => ({ label: a.name, sub: `${a.sqft} SF · add-on`, price: addOnListPrice(a.rate, cfg) })),
  ];

  const pct = (n: number) => `−${(n * 100).toFixed(1)}%`;
  const emailOk = isValidEmail(form.email);
  const phoneOk = isValidPhone(form.phone);
  const valid = !!(form.company.trim() && form.name.trim() && emailOk && phoneOk);

  const toSign = () => {
    if (!valid) return;
    const p = new URLSearchParams({
      offices: offices.map((o) => o.slug).join(","),
      furnished: furnished ? "1" : "0",
      term: String(term),
      company: form.company,
      name: form.name,
      email: form.email,
      phone: form.phone,
    });
    if (chosen.length) p.set("addons", chosen.map((a) => a.slug).join(","));
    router.push(`/sign?${p.toString()}`);
  };

  return (
    <div className="detail-grid">
      <div className="card panel">
        <h3>Your package</h3>
        {lines.map((l, i) => (
          <div className="summary-line" key={i}>
            <span><strong>{l.label}</strong><br /><span style={{ color: "var(--muted)", fontSize: 12 }}>{l.sub}</span></span>
            <span>{money(l.price)}/mo</span>
          </div>
        ))}
        <div className="summary-line"><span>Gross monthly (list)</span><span>{money(q.grossMonthly)}</span></div>
        <div className="summary-line"><span>Multi-office discount</span><span style={{ color: "var(--brass)" }}>{pct(q.multiDiscount)}</span></div>
        <div className="summary-line"><span>Term discount · {term}mo</span><span style={{ color: "var(--brass)" }}>{pct(q.termDiscount)}</span></div>
        <div className="summary-line"><span>Furnishing</span><span>{furnished ? "Furnished" : "Unfurnished"}</span></div>
        <div className="summary-line"><span>Conference hours / mo</span><span>{q.confHours}</span></div>
        <div className="summary-line total"><span>You pay / month</span><span>{money(q.netMonthly)}</span></div>
        <p className="footnote">{money(q.annual)} per year · {money(q.contractValue)} total contract value over {term} months. This becomes the locked License Fee on Schedule A.</p>
      </div>

      <div className="card panel pricebox">
        <h3>Your details</h3>
        <p className="lead" style={{ fontSize: 12.5 }}>We&apos;ll use these to prepare your license agreement for signature.</p>
        <div className="field"><label>Company / legal name</label><input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Acme LLC" /></div>
        <div className="field"><label>Your name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" /></div>
        <div className="field"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@acme.com" />{form.email && !emailOk && <span className="field-err">Enter a valid email address</span>}</div>
        <div className="field"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })} placeholder="(601) 555-0100" inputMode="tel" />{form.phone && !phoneOk && <span className="field-err">Enter a 10-digit phone number</span>}</div>
        <button className="btn btn-pop" style={{ width: "100%", justifyContent: "center" }} disabled={!valid} onClick={toSign}>Continue to license agreement →</button>
        <p className="placeholder-note" style={{ textAlign: "center" }}>Next: review &amp; e-sign. No payment taken in this prototype.</p>
      </div>
    </div>
  );
}
