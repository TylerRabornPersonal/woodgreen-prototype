"use client";

import { useEffect, useMemo, useState } from "react";
import {
  SLOT_TIMES,
  to12,
  upcomingWeekdays,
  slotKey,
  loadTours,
  loadBlocked,
  saveBlocked,
  type TourBooking,
  type DayInfo,
} from "@/lib/tour/store";

export default function AdminTourPage() {
  const [ready, setReady] = useState(false);
  const [days, setDays] = useState<DayInfo[]>([]);
  const [tours, setTours] = useState<TourBooking[]>([]);
  const [blocked, setBlocked] = useState<string[]>([]);

  useEffect(() => {
    setDays(upcomingWeekdays(10));
    setTours(loadTours());
    setBlocked(loadBlocked());
    setReady(true);
  }, []);

  const bookedSet = useMemo(() => new Set(tours.map((t) => slotKey(t.dateISO, t.time))), [tours]);
  const tourByKey = useMemo(() => {
    const m = new Map<string, TourBooking>();
    for (const t of tours) m.set(slotKey(t.dateISO, t.time), t);
    return m;
  }, [tours]);

  const toggle = (key: string) => {
    if (bookedSet.has(key)) return;
    const next = blocked.includes(key) ? blocked.filter((k) => k !== key) : [...blocked, key];
    setBlocked(next);
    saveBlocked(next);
  };

  const upcomingTours = [...tours].sort((a, b) => (a.dateISO + a.time).localeCompare(b.dateISO + b.time));
  const fmtDay = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  if (!ready) return <p className="portal-note">Loading…</p>;

  return (
    <div>
      <header className="portal-head">
        <div>
          <h1 className="portal-h1">Tour requests &amp; availability</h1>
          <p className="portal-sub">{tours.length} upcoming tour{tours.length === 1 ? "" : "s"} · click a slot to open or block it</p>
        </div>
      </header>

      <div className="pcard">
        <span className="pcard-eyebrow">Availability · click to block / unblock</span>
        <div className="avail-grid">
          {days.map((d) => (
            <div className="avail-row" key={d.iso}>
              <div className="avail-day"><span className="ad-dow">{d.dow}</span><span className="ad-date">{d.label}</span></div>
              <div className="avail-slots">
                {SLOT_TIMES.map((s) => {
                  const key = slotKey(d.iso, s);
                  const booked = bookedSet.has(key);
                  const isBlocked = blocked.includes(key);
                  const cls = booked ? "booked" : isBlocked ? "blocked" : "open";
                  const title = booked ? tourByKey.get(key)?.name : isBlocked ? "Blocked" : "Available";
                  return (
                    <button key={s} className={`aslot ${cls}`} onClick={() => toggle(key)} disabled={booked} title={title}>
                      {to12(s)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="legend" style={{ marginTop: 14 }}>
          <span className="sw"><span className="chip" /> Available</span>
          <span className="sw"><span className="chip" style={{ background: "var(--sand)", borderColor: "var(--linen)" }} /> Blocked</span>
          <span className="sw"><span className="chip" style={{ background: "var(--brass-300)", borderColor: "var(--brass-600)" }} /> Booked</span>
        </div>
        <p className="portal-note">
          Production: this view is backed by the operator&apos;s Google Calendar — slots auto-block when you&apos;re
          busy or on vacation (two-way free/busy sync), and each confirmed tour writes an event back. Not wired yet.
        </p>
      </div>

      <div className="pcard">
        <span className="pcard-eyebrow">Upcoming tour requests</span>
        {upcomingTours.length ? (
          <div className="tour-req-list">
            {upcomingTours.map((t) => (
              <div className="tour-req" key={t.id}>
                <div className="tr-when">
                  <div className="tr-time">{to12(t.time)}</div>
                  <div className="tr-date">{fmtDay(t.dateISO)}</div>
                </div>
                <div className="tr-body">
                  <div className="tr-name">{t.name} <span className="tr-contact">· {t.email}{t.phone ? ` · ${t.phone}` : ""}</span></div>
                  <div className="tr-offices"><strong>Wants to view:</strong> {t.offices || "—"}</div>
                  {t.notes && <div className="tr-notes">{t.notes}</div>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="portal-note">No tour requests yet.</p>
        )}
      </div>
    </div>
  );
}
