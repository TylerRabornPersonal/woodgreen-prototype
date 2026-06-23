"use client";

import { useMemo, useState } from "react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const pad = (n: number) => String(n).padStart(2, "0");
const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Month grid date picker. Selectable range is [minISO, maxISO] inclusive. */
export default function MonthCalendar({
  minISO,
  maxISO,
  value,
  onChange,
}: {
  minISO: string;
  maxISO: string;
  value: string;
  onChange: (iso: string) => void;
}) {
  const [view, setView] = useState(() => {
    const base = new Date((value || minISO) + "T00:00:00");
    return { y: base.getFullYear(), m: base.getMonth() };
  });

  const cells = useMemo(() => {
    const startDow = new Date(view.y, view.m, 1).getDay();
    const daysIn = new Date(view.y, view.m + 1, 0).getDate();
    const out: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) out.push(null);
    for (let d = 1; d <= daysIn; d++) out.push(d);
    while (out.length % 7) out.push(null);
    return out;
  }, [view]);

  const monthLabel = new Date(view.y, view.m, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const ym = (y: number, m: number) => y * 12 + m;
  const minD = new Date(minISO + "T00:00:00");
  const maxD = new Date(maxISO + "T00:00:00");
  const canPrev = ym(view.y, view.m) > ym(minD.getFullYear(), minD.getMonth());
  const canNext = ym(view.y, view.m) < ym(maxD.getFullYear(), maxD.getMonth());

  return (
    <div>
      <div className="cm-head">
        <div className="cm-nav">
          <button className="cm-arrow" disabled={!canPrev} onClick={() => setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }))}>←</button>
          <span className="cm-month">{monthLabel}</span>
          <button className="cm-arrow" disabled={!canNext} onClick={() => setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }))}>→</button>
        </div>
      </div>
      <div className="cm-grid">
        {WEEKDAYS.map((w) => <div key={w} className="cm-wd">{w}</div>)}
        {cells.map((d, i) => {
          if (d === null) return <div key={i} className="cm-cell empty" />;
          const iso = isoOf(new Date(view.y, view.m, d));
          const ok = iso >= minISO && iso <= maxISO;
          return (
            <button key={i} className={`cm-cell${ok ? "" : " off"}${iso === value ? " on" : ""}`} disabled={!ok} onClick={() => onChange(iso)}>
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
