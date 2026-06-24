"use client";

import { useMemo, useState } from "react";
import {
  PAST_TENANTS,
  ALL_OFFICE_OPTIONS,
  officeLabel,
  fmtMonth,
  tenancyForOffice,
} from "@/lib/admin/history";
import { OccupancyControl, useOccupancy } from "@/components/admin/OccupancyControl";

export default function HistoryPage() {
  const [occ, setOcc] = useOccupancy();
  const [query, setQuery] = useState("");
  const [officeSlug, setOfficeSlug] = useState(ALL_OFFICE_OPTIONS[0]?.slug ?? "");

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      PAST_TENANTS.filter((t) =>
        !q ||
        [t.org, t.contact, t.email, t.phone].some((f) => f.toLowerCase().includes(q)),
      ).sort((a, b) => b.endISO.localeCompare(a.endISO)),
    [q],
  );

  const timeline = useMemo(() => tenancyForOffice(officeSlug, occ), [officeSlug, occ]);

  return (
    <div>
      <header className="portal-head">
        <div>
          <h1 className="portal-h1">Tenant history</h1>
          <p className="portal-sub">{PAST_TENANTS.length} past tenancies on record</p>
        </div>
        <OccupancyControl occ={occ} onChange={setOcc} />
      </header>

      {/* by office */}
      <div className="pcard">
        <div className="pcard-headrow">
          <span className="pcard-eyebrow">By office · who has held this space</span>
          <select className="hist-office" value={officeSlug} onChange={(e) => setOfficeSlug(e.target.value)}>
            {ALL_OFFICE_OPTIONS.map((o) => <option key={o.slug} value={o.slug}>{o.label}</option>)}
          </select>
        </div>
        {timeline.length ? (
          <div className="timeline">
            {timeline.map((t, i) => (
              <div className={`tl-row${t.current ? " current" : ""}`} key={i}>
                <div className="tl-dot" />
                <div className="tl-body">
                  <div className="tl-org">{t.org} {t.current && <span className="tl-badge">Current</span>}</div>
                  <div className="tl-meta">{fmtMonth(t.startISO)} – {t.endISO ? fmtMonth(t.endISO) : "present"} · {t.term}-month term · {t.contact}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="portal-note">No recorded tenants for {officeLabel(officeSlug)}.</p>
        )}
      </div>

      {/* holistic searchable table */}
      <div className="pcard">
        <div className="pcard-headrow">
          <span className="pcard-eyebrow">All past tenants</span>
          <input className="hist-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, company, email, phone…" />
        </div>
        <table className="bill-table">
          <thead><tr><th>Company</th><th>Contact</th><th>Email</th><th>Phone</th><th>Offices</th><th>Term</th><th>Dates</th></tr></thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id}>
                <td>{t.org}</td>
                <td>{t.contact}</td>
                <td className="cell-detail">{t.email}</td>
                <td className="cell-detail">{t.phone}</td>
                <td>{t.officeSlugs.map((s) => officeLabel(s).split(" · ")[0]).join(", ")}</td>
                <td>{t.term} mo</td>
                <td className="cell-detail">{fmtMonth(t.startISO)} – {fmtMonth(t.endISO)}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7}><p className="portal-note">No tenants match “{query}”.</p></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
