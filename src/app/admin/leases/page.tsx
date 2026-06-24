"use client";

import { leaseGridFor, floorLabels } from "@/lib/admin/mock";
import { OccupancyControl, useOccupancy } from "@/components/admin/OccupancyControl";

const FLOOR_ORDER = Object.keys(floorLabels);

export default function LeaseTimelinePage() {
  const [occ, setOcc] = useOccupancy();
  const grid = leaseGridFor(occ, 36);
  const { months, rows, totals } = grid;

  // group office rows by floor, in nav order
  const byFloor = FLOOR_ORDER.map((fid) => ({
    fid,
    label: floorLabels[fid],
    rows: rows.filter((r) => r.floorId === fid),
  })).filter((g) => g.rows.length);

  const peak = Math.max(1, ...totals);

  return (
    <div>
      <header className="portal-head">
        <div>
          <h1 className="portal-h1">Lease timeline</h1>
          <p className="portal-sub">Committed lease terms over the next 36 months · {rows.filter((r) => r.tenant).length} of {rows.length} offices currently leased</p>
        </div>
        <OccupancyControl occ={occ} onChange={setOcc} />
      </header>

      <div className="lease-legend">
        <span className="sw"><i className="lg-key leased" /> Leased</span>
        <span className="sw"><i className="lg-key expiring" /> Term ends (renewal due)</span>
        <span className="sw"><i className="lg-key" /> Available</span>
        <span className="lease-note">No auto-renewal is modeled — bars stop at each lease&apos;s committed term, so the cliffs show where renewals come due.</span>
      </div>

      <div className="lease-wrap">
        <table className="lease-grid">
          <thead>
            <tr>
              <th className="lg-office">Office</th>
              {months.map((mo, i) => (
                <th key={i} className={mo.m === 1 ? "lg-jan" : ""}>{mo.short}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="lg-total">
              <td className="lg-office">Leased units</td>
              {totals.map((t, i) => (
                <td key={i} title={`${months[i].short}: ${t} leased`}>
                  <span className="lg-total-bar" style={{ opacity: 0.18 + 0.82 * (t / peak) }} />
                  <span className="lg-total-num">{t}</span>
                </td>
              ))}
            </tr>

            {byFloor.map((g) => (
              <FloorBlock key={g.fid} label={g.label} rows={g.rows} monthCount={months.length} months={months} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FloorBlock({ label, rows, monthCount, months }: { label: string; rows: ReturnType<typeof leaseGridFor>["rows"]; monthCount: number; months: ReturnType<typeof leaseGridFor>["months"] }) {
  return (
    <>
      <tr className="lg-floor">
        <td className="lg-office">{label}</td>
        <td colSpan={monthCount} />
      </tr>
      {rows.map((r) => (
        <tr key={r.slug}>
          <td className="lg-office" title={r.tenant ?? "Available"}>
            {r.code}{r.tenant ? <span className="lg-ten"> · {r.tenant}</span> : ""}
          </td>
          {r.cells.map((c, i) => (
            <td
              key={i}
              className={`lg-cell${c.leased ? " leased" : ""}${c.expiring ? " expiring" : ""}`}
              title={c.leased ? `${months[i].short} · ${r.tenant}${c.expiring ? " (term ends)" : ""}` : `${months[i].short} · available`}
            />
          ))}
        </tr>
      ))}
    </>
  );
}
