"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  SLOT_TIMES,
  to12,
  slotKey,
  loadTours,
  saveTours,
  loadBlocked,
  type TourBooking,
} from "@/lib/tour/store";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const isoOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function TourPage() {
  const [ready, setReady] = useState(false);
  const [tours, setTours] = useState<TourBooking[]>([]);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [view, setView] = useState({ y: 2026, m: 0 });
  const [dateISO, setDateISO] = useState("");
  const [time, setTime] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", offices: "", notes: "" });
  const [done, setDone] = useState<{ day: string; time: string } | null>(null);

  // bookable window
  const bounds = useMemo(() => {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    const min = new Date(t); min.setDate(min.getDate() + 1);
    const max = new Date(t); max.setDate(max.getDate() + 90);
    return { minISO: isoOf(min), maxISO: isoOf(max), maxYM: { y: max.getFullYear(), m: max.getMonth() }, todayYM: { y: t.getFullYear(), m: t.getMonth() } };
  }, []);

  useEffect(() => {
    setTours(loadTours());
    setBlocked(loadBlocked());
    setView(bounds.todayYM);
    setReady(true);
  }, [bounds]);

  const takenSet = useMemo(() => {
    const s = new Set(blocked);
    for (const t of tours) s.add(slotKey(t.dateISO, t.time));
    return s;
  }, [blocked, tours]);

  const cells = useMemo(() => {
    const first = new Date(view.y, view.m, 1);
    const startDow = first.getDay();
    const daysIn = new Date(view.y, view.m + 1, 0).getDate();
    const out: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) out.push(null);
    for (let d = 1; d <= daysIn; d++) out.push(d);
    while (out.length % 7) out.push(null);
    return out;
  }, [view]);

  const monthLabel = new Date(view.y, view.m, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const ymVal = (ym: { y: number; m: number }) => ym.y * 12 + ym.m;
  const cur = ymVal(view);
  const canPrev = cur > ymVal(bounds.todayYM);
  const canNext = cur < ymVal(bounds.maxYM);

  const selectable = (d: number) => {
    const iso = isoOf(new Date(view.y, view.m, d));
    const dow = new Date(view.y, view.m, d).getDay();
    return iso >= bounds.minISO && iso <= bounds.maxISO && dow >= 1 && dow <= 5;
  };

  const selectedFull = dateISO
    ? new Date(dateISO + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : "";

  const valid = form.name.trim() && form.email.trim() && time && dateISO;

  const book = () => {
    if (!valid || !time) return;
    const t: TourBooking = { id: `t_${Date.now()}`, dateISO, time, name: form.name, email: form.email, phone: form.phone, offices: form.offices, notes: form.notes, createdAt: new Date().toISOString() };
    const next = [...tours, t];
    setTours(next);
    saveTours(next);
    setDone({ day: selectedFull, time: to12(time) });
  };

  if (!ready) return <div className="wrap page"><p className="lead">Loading the calendar…</p></div>;

  if (done) {
    return (
      <div className="wrap page">
        <div className="card panel confirm-screen">
          <div className="check">✓</div>
          <h2>Your tour is booked</h2>
          <p className="lead" style={{ margin: "0 auto 6px" }}>
            See you {done.day} at {done.time}, {form.name.split(" ")[0]}. Park out front and come through the main
            doors{form.offices ? `; we'll have ${form.offices} ready to show you` : ""}. A confirmation will go to {form.email}.
          </p>
          <p className="placeholder-note">(Demo: no email sent. In production this lands on the operator&apos;s Google Calendar.)</p>
          <div style={{ marginTop: 22 }}><Link href="/" className="btn btn-ghost">Back to building plan</Link></div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap page">
      <h2 className="section">Book a tour</h2>
      <p className="lead">Pick a time to come see the building. Tell us which offices you&apos;d like to view and we&apos;ll have them ready.</p>

      <div className="tour-grid">
        <div className="card panel">
          <div className="cm-head">
            <span className="ctl-label" style={{ margin: 0 }}>Select a date</span>
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
              const ok = selectable(d);
              return (
                <button key={i} className={`cm-cell${ok ? "" : " off"}${iso === dateISO ? " on" : ""}`} disabled={!ok} onClick={() => { setDateISO(iso); setTime(null); }}>
                  {d}
                </button>
              );
            })}
          </div>

          {dateISO && (
            <>
              <span className="ctl-label">Available times · {selectedFull}</span>
              <div className="slot-pick">
                {SLOT_TIMES.map((s) => {
                  const taken = takenSet.has(slotKey(dateISO, s));
                  return (
                    <button key={s} className={`slot${time === s ? " on" : ""}${taken ? " taken" : ""}`} disabled={taken} onClick={() => setTime(s)}>
                      {to12(s)}
                    </button>
                  );
                })}
              </div>
              <p className="portal-note">Greyed-out times are already booked or blocked by the office.</p>
            </>
          )}
          {!dateISO && <p className="portal-note">Pick a weekday within the next 90 days to see available times.</p>}
        </div>

        <div className="card panel pricebox">
          <h3>Your details</h3>
          {time && dateISO ? (
            <p className="lead" style={{ fontSize: 12.5 }}>Booking <strong>{selectedFull}</strong> at <strong>{to12(time)}</strong>.</p>
          ) : (
            <p className="lead" style={{ fontSize: 12.5 }}>Pick a date and time to continue.</p>
          )}
          <div className="field"><label>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" /></div>
          <div className="field"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@firm.com" /></div>
          <div className="field"><label>Phone (optional)</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(601) 555-0100" /></div>
          <div className="field"><label>Which office(s) would you like to view?</label><input value={form.offices} onChange={(e) => setForm({ ...form, offices: e.target.value })} placeholder="e.g. A & B on the 2nd floor, or anything with windows" /></div>
          <div className="field"><label>Anything else? (optional)</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Team size, timing, questions…" rows={3} /></div>
          <button className="btn btn-pop" style={{ width: "100%", justifyContent: "center" }} disabled={!valid} onClick={book}>Confirm tour</button>
        </div>
      </div>
    </div>
  );
}
