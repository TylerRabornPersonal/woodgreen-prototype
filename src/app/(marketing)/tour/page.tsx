"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  SLOT_TIMES,
  to12,
  upcomingWeekdays,
  slotKey,
  loadTours,
  saveTours,
  loadBlocked,
  type TourBooking,
  type DayInfo,
} from "@/lib/tour/store";

export default function TourPage() {
  const [ready, setReady] = useState(false);
  const [days, setDays] = useState<DayInfo[]>([]);
  const [tours, setTours] = useState<TourBooking[]>([]);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [dateISO, setDateISO] = useState("");
  const [time, setTime] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", offices: "", notes: "" });
  const [done, setDone] = useState<{ day: string; time: string } | null>(null);

  useEffect(() => {
    const d = upcomingWeekdays(10);
    setDays(d);
    setDateISO(d[0]?.iso ?? "");
    setTours(loadTours());
    setBlocked(loadBlocked());
    setReady(true);
  }, []);

  const day = days.find((x) => x.iso === dateISO);
  const takenSet = useMemo(() => {
    const s = new Set(blocked);
    for (const t of tours) s.add(slotKey(t.dateISO, t.time));
    return s;
  }, [blocked, tours]);

  const valid = form.name.trim() && form.email.trim() && time;

  const book = () => {
    if (!valid || !time || !day) return;
    const t: TourBooking = {
      id: `t_${Date.now()}`,
      dateISO,
      time,
      name: form.name,
      email: form.email,
      phone: form.phone,
      offices: form.offices,
      notes: form.notes,
      createdAt: new Date().toISOString(),
    };
    const next = [...tours, t];
    setTours(next);
    saveTours(next);
    setDone({ day: day.full, time: to12(time) });
  };

  if (!ready) {
    return <div className="wrap page"><p className="lead">Loading the calendar…</p></div>;
  }

  if (done) {
    return (
      <div className="wrap page">
        <div className="card panel confirm-screen">
          <div className="check">✓</div>
          <h2>Your tour is booked</h2>
          <p className="lead" style={{ margin: "0 auto 6px" }}>
            See you {done.day} at {done.time}, {form.name.split(" ")[0]}. Park out front and come
            through the main doors{form.offices ? `; we'll have ${form.offices} ready to show you` : ""}.
            A confirmation will go to {form.email}.
          </p>
          <p className="placeholder-note">(Demo: no email sent. In production this lands on the operator&apos;s Google Calendar.)</p>
          <div style={{ marginTop: 22 }}>
            <Link href="/" className="btn btn-ghost">Back to building plan</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap page">
      <h2 className="section">Book a tour</h2>
      <p className="lead">Pick a time to come see the building. Tell us which offices you&apos;d like to view and we&apos;ll have them ready.</p>

      <div className="tour-grid">
        {/* calendar / slots */}
        <div className="card panel">
          <span className="ctl-label">Select a date</span>
          <div className="day-pick">
            {days.map((d) => (
              <button key={d.iso} className={`day-chip${d.iso === dateISO ? " on" : ""}`} onClick={() => { setDateISO(d.iso); setTime(null); }}>
                <span className="dc-dow">{d.dow}</span>
                <span className="dc-date">{d.label}</span>
              </button>
            ))}
          </div>

          <span className="ctl-label">Available times{day ? ` · ${day.full}` : ""}</span>
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
        </div>

        {/* form */}
        <div className="card panel pricebox">
          <h3>Your details</h3>
          {time && day ? (
            <p className="lead" style={{ fontSize: 12.5 }}>Booking <strong>{day.full}</strong> at <strong>{to12(time)}</strong>.</p>
          ) : (
            <p className="lead" style={{ fontSize: 12.5 }}>Pick a date and time to continue.</p>
          )}
          <div className="field"><label>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" /></div>
          <div className="field"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@firm.com" /></div>
          <div className="field"><label>Phone (optional)</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(601) 555-0100" /></div>
          <div className="field"><label>Which office(s) would you like to view?</label><input value={form.offices} onChange={(e) => setForm({ ...form, offices: e.target.value })} placeholder="e.g. A & B on the 2nd floor, or anything with windows" /></div>
          <div className="field"><label>Anything else? (optional)</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Team size, timing, questions…" rows={3} /></div>
          <button className="btn btn-pop" style={{ width: "100%", justifyContent: "center" }} disabled={!valid} onClick={book}>
            Confirm tour
          </button>
        </div>
      </div>
    </div>
  );
}
