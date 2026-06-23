"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Office, AddOn } from "@/lib/inventory";
import { quote, addOnListPrice, officeListPrice, money, type Term } from "@/lib/engine";

export default function Configurator({ offices, addOns }: { offices: Office[]; addOns: AddOn[] }) {
  const router = useRouter();
  const [furnished, setFurnished] = useState(false);
  const [term, setTerm] = useState<Term>(12);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (slug: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });

  const chosenAddOns = addOns.filter((a) => selected.has(a.slug));

  const q = useMemo(
    () =>
      quote({
        officeBaseRates: offices.map((o) => o.rate),
        addOnRates: chosenAddOns.map((a) => a.rate),
        furnished,
        term,
      }),
    [offices, chosenAddOns, furnished, term],
  );

  const proceed = () => {
    const params = new URLSearchParams({
      offices: offices.map((o) => o.slug).join(","),
      furnished: furnished ? "1" : "0",
      term: String(term),
    });
    if (chosenAddOns.length) params.set("addons", chosenAddOns.map((a) => a.slug).join(","));
    router.push(`/checkout?${params.toString()}`);
  };

  return (
    <div className="detail-grid">
      {/* left: configure */}
      <div className="card panel">
        <h3>Your offices</h3>
        <div className="office-lines">
          {offices.map((o) => (
            <div className="kv" key={o.slug}>
              <span className="k">
                {o.code}
                {o.name ? ` · ${o.name}` : ""} <span style={{ color: "var(--drab)" }}>· {o.sqft} SF</span>
              </span>
              <span className="v">{money(officeListPrice(o.rate, furnished))}/mo</span>
            </div>
          ))}
        </div>

        <span className="ctl-label">Furnishing (applies to all offices)</span>
        <div className="seg">
          <button className={!furnished ? "on" : ""} onClick={() => setFurnished(false)}>Unfurnished</button>
          <button className={furnished ? "on" : ""} onClick={() => setFurnished(true)}>Furnished</button>
        </div>

        <span className="ctl-label">License term</span>
        <div className="seg brass">
          {([12, 24, 36] as Term[]).map((t) => (
            <button key={t} className={term === t ? "on" : ""} onClick={() => setTerm(t)}>
              {t} months
            </button>
          ))}
        </div>

        <span className="ctl-label">Add storage, conference &amp; more</span>
        <div className="addon-list">
          {addOns.map((a) => {
            const price = addOnListPrice(a.rate);
            const sel = selected.has(a.slug);
            return (
              <div key={a.slug} className={`addon${sel ? " sel" : ""}`} onClick={() => toggle(a.slug)}>
                <div>
                  <div className="nm">{a.name}</div>
                  <div className="meta">{a.sqft} SF · flat rate</div>
                </div>
                <div className="pr">{money(price)}<span style={{ fontSize: 11, color: "var(--drab)", fontWeight: 400, fontStyle: "normal" }}>/mo</span></div>
              </div>
            );
          })}
        </div>
        <p className="placeholder-note">
          Add-ons are flat-priced and don&apos;t count toward the multi-office discount, but receive the package discount.
        </p>
      </div>

      {/* right: live price */}
      <div className="card panel pricebox">
        <div className="kv"><span className="k">Offices</span><span className="v">{q.officeCount}</span></div>
        <div className="kv"><span className="k">Package gross</span><span className="v">{money(q.grossMonthly)}/mo</span></div>

        <div style={{ margin: "12px 0 6px" }}>
          <div className="disc-row"><span>Multi-office {q.capped ? "(cap 10%)" : ""}</span><span className="v">−{(q.multiDiscount * 100).toFixed(0)}%</span></div>
          <div className="disc-row"><span>Term · {term}mo</span><span className="v">−{(q.termDiscount * 100).toFixed(0)}%</span></div>
        </div>

        <div className="kv"><span className="k">Conference hrs / mo</span><span className="v">{q.confHours}</span></div>

        <div style={{ marginTop: 16 }}>
          <div className="big">{money(q.netMonthly)}<small>/mo</small> <span className="pill">−{(q.totalDiscount * 100).toFixed(0)}%</span></div>
          <div className="yr">{money(q.annual)} / yr · {money(q.contractValue)} over {term} months</div>
        </div>

        <button className="btn btn-pop" style={{ width: "100%", justifyContent: "center", marginTop: 18 }} onClick={proceed}>
          Reserve {q.officeCount > 1 ? "these offices" : "this office"} →
        </button>
        <p className="placeholder-note" style={{ textAlign: "center" }}>List price, a starting point for negotiation.</p>
      </div>
    </div>
  );
}
