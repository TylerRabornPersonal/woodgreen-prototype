"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Office, AddOn } from "@/lib/inventory";
import { quote, addOnListPrice, officeListPrice, money, type Term } from "@/lib/engine";

export default function Configurator({ office, addOns }: { office: Office; addOns: AddOn[] }) {
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
        officeBaseRates: [office.rate],
        addOnRates: chosenAddOns.map((a) => a.rate),
        furnished,
        term,
      }),
    [office.rate, chosenAddOns, furnished, term],
  );

  const proceed = () => {
    const params = new URLSearchParams({
      office: office.slug,
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
        <h3>Configure your office</h3>

        <span className="ctl-label">Furnishing</span>
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
                <div className="pr">{money(price)}<span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 400 }}>/mo</span></div>
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
        <div className="kv"><span className="k">{office.code} — unfurnished list</span><span className="v">{money(officeListPrice(office.rate, false))}/mo</span></div>
        <div className="kv"><span className="k">This config (gross)</span><span className="v">{money(q.grossMonthly)}/mo</span></div>

        <div style={{ margin: "12px 0 6px" }}>
          <div className="disc-row"><span>Multi-office {q.capped ? "(cap 10%)" : ""}</span><span className="v">−{(q.multiDiscount * 100).toFixed(0)}%</span></div>
          <div className="disc-row"><span>Term · {term}mo</span><span className="v">−{(q.termDiscount * 100).toFixed(0)}%</span></div>
        </div>

        <div className="kv"><span className="k">Conference hrs / mo</span><span className="v">{q.confHours}</span></div>

        <div style={{ marginTop: 16 }}>
          <div className="big">{money(q.netMonthly)}<small>/mo</small> <span className="pill">−{(q.totalDiscount * 100).toFixed(0)}%</span></div>
          <div className="yr">{money(q.annual)} / yr · {money(q.contractValue)} over {term} months</div>
        </div>

        <button className="btn btn-brass" style={{ width: "100%", justifyContent: "center", marginTop: 18 }} onClick={proceed}>
          Reserve this office →
        </button>
        <p className="placeholder-note" style={{ textAlign: "center" }}>List price — starting point for negotiation.</p>
      </div>
    </div>
  );
}
