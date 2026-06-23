"use client";

import { useEffect, useMemo, useState } from "react";
import { OFFICES } from "@/lib/inventory";
import { floorLabels } from "@/lib/admin/mock";
import { officeListPrice, money, type Term } from "@/lib/engine";
import {
  defaultOverrides,
  loadOverrides,
  saveOverrides,
  resetOverrides,
  toEngineConfig,
  type PricingOverrides,
} from "@/lib/pricing/store";

const FLOOR_IDS = Object.keys(floorLabels);
const TERMS: Term[] = [12, 18, 24, 30, 36];

export default function PricingPage() {
  const [ov, setOv] = useState<PricingOverrides>(defaultOverrides());
  const [ready, setReady] = useState(false);
  const [bulk, setBulk] = useState("");
  const [bulkTarget, setBulkTarget] = useState<"both" | "unf" | "furn">("both");
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    setOv(loadOverrides());
    setReady(true);
  }, []);

  const cfg = useMemo(() => toEngineConfig(ov), [ov]);

  const setRate = (slug: string, v: number) =>
    setOv((p) => ({ ...p, officeRates: { ...p.officeRates, [slug]: v } }));
  const setFurnRate = (slug: string, v: number) =>
    setOv((p) => ({ ...p, officeFurnishedRates: { ...p.officeFurnishedRates, [slug]: v } }));

  const applyBulk = () => {
    const pct = parseFloat(bulk);
    if (!pct) return;
    const scale = (m: Record<string, number>) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, Math.round(v * (1 + pct / 100))]));
    setOv((p) => ({
      ...p,
      officeRates: bulkTarget !== "furn" ? scale(p.officeRates) : p.officeRates,
      officeFurnishedRates: bulkTarget !== "unf" ? scale(p.officeFurnishedRates) : p.officeFurnishedRates,
    }));
    setBulk("");
  };

  const save = () => {
    saveOverrides(ov);
    setFlash("Pricing saved — it now applies across the site.");
    setTimeout(() => setFlash(null), 3500);
  };
  const reset = () => {
    resetOverrides();
    setOv(defaultOverrides());
    setFlash("Reset to default pricing.");
    setTimeout(() => setFlash(null), 3500);
  };

  if (!ready) return <p className="portal-note">Loading…</p>;

  return (
    <div>
      <header className="portal-head">
        <div>
          <h1 className="portal-h1">Pricing matrix</h1>
          <p className="portal-sub">Set base rates and discounts. Saved locally and applied across the prototype.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={reset}>Reset</button>
          <button className="btn btn-pop" onClick={save}>Save pricing</button>
        </div>
      </header>

      {flash && <div className="flash">✓ {flash}</div>}

      {/* discounts + mults */}
      <div className="pcard">
        <span className="pcard-eyebrow">Discounts &amp; markups</span>
        <div className="price-knobs">
          <div className="knob"><label>Multi-office, per extra office (%)</label><input type="number" step="0.5" value={(ov.multiPerOffice * 100).toString()} onChange={(e) => setOv((p) => ({ ...p, multiPerOffice: (parseFloat(e.target.value) || 0) / 100 }))} /></div>
          <div className="knob"><label>Multi-office cap (%)</label><input type="number" step="0.5" value={(ov.multiCap * 100).toString()} onChange={(e) => setOv((p) => ({ ...p, multiCap: (parseFloat(e.target.value) || 0) / 100 }))} /></div>
          <div className="knob"><label>List markup (×)</label><input type="number" step="0.01" value={ov.listMult.toString()} onChange={(e) => setOv((p) => ({ ...p, listMult: parseFloat(e.target.value) || 1 }))} /></div>
          <div className="knob"><label>Furnished uplift (×)</label><input type="number" step="0.01" value={ov.furnishedMult.toString()} onChange={(e) => setOv((p) => ({ ...p, furnishedMult: parseFloat(e.target.value) || 1 }))} /></div>
        </div>
        <span className="ctl-label">Term discounts (%)</span>
        <div className="price-knobs">
          {TERMS.map((t) => (
            <div className="knob" key={t}><label>{t} months</label><input type="number" step="0.5" value={((ov.termDiscount[t] ?? 0) * 100).toString()} onChange={(e) => setOv((p) => ({ ...p, termDiscount: { ...p.termDiscount, [t]: (parseFloat(e.target.value) || 0) / 100 } }))} /></div>
          ))}
        </div>
      </div>

      {/* per-office rates */}
      <div className="pcard">
        <div className="pcard-headrow">
          <span className="pcard-eyebrow">Per-office base rates ($/mo) — unfurnished &amp; furnished, independent</span>
          <div className="bulk">
            <input type="number" step="1" value={bulk} onChange={(e) => setBulk(e.target.value)} placeholder="e.g. 5" />
            <span className="bulk-pct">%</span>
            <select value={bulkTarget} onChange={(e) => setBulkTarget(e.target.value as "both" | "unf" | "furn")}>
              <option value="both">both</option>
              <option value="unf">unfurnished</option>
              <option value="furn">furnished</option>
            </select>
            <button className="btn btn-ghost btn-sm" onClick={applyBulk}>Apply to all</button>
          </div>
        </div>
        <p className="portal-note" style={{ marginTop: 0 }}>Each office has its own unfurnished and furnished base; the engine marks each up to the displayed list price. Bulk-adjust both or either with the dropdown.</p>

        {FLOOR_IDS.map((fid) => {
          const offices = OFFICES.filter((o) => o.floorId === fid);
          return (
            <div key={fid} className="price-floor">
              <h4 className="price-floor-h">{floorLabels[fid]}</h4>
              <div className="rate-grid wide">
                {offices.map((o) => {
                  const rate = ov.officeRates[o.slug] ?? o.rate;
                  const furn = ov.officeFurnishedRates[o.slug] ?? Math.round(rate * ov.furnishedMult);
                  return (
                    <div className="rate-cell" key={o.slug}>
                      <div className="rate-code">{o.code} <span className="rate-sf">{o.sqft} SF</span></div>
                      <div className="rate-two">
                        <div>
                          <span className="rate-tag">Unfurnished</span>
                          <div className="rate-input"><span className="rate-dollar">$</span><input type="number" step="5" value={rate} onChange={(e) => setRate(o.slug, parseInt(e.target.value) || 0)} /></div>
                          <div className="rate-preview">→ {money(officeListPrice(rate, false, cfg))}/mo</div>
                        </div>
                        <div>
                          <span className="rate-tag">Furnished</span>
                          <div className="rate-input"><span className="rate-dollar">$</span><input type="number" step="5" value={furn} onChange={(e) => setFurnRate(o.slug, parseInt(e.target.value) || 0)} /></div>
                          <div className="rate-preview">→ {money(officeListPrice(furn, false, cfg))}/mo</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
