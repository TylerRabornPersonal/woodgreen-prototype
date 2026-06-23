"use client";

import { useEffect, useMemo, useState } from "react";
import { rooms, tenants } from "@/lib/admin/mock";
import {
  loadConf,
  saveConf,
  mondayOf,
  weekDays,
  isoOf,
  START_SLOTS,
  DURATIONS,
  addHours,
  type ConfBooking,
} from "@/lib/admin/conf-store";

export default function CalendarPage() {
  const [ready, setReady] = useState(false);
  const [bookings, setBookings] = useState<ConfBooking[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [open, setOpen] = useState(false);

  // add-meeting form
  const [roomId, setRoomId] = useState(rooms[0].id);
  const [who, setWho] = useState<"tenant" | "other">("tenant");
  const [tenantOrg, setTenantOrg] = useState(tenants[0].org);
  const [otherName, setOtherName] = useState("");
  const [dateISO, setDateISO] = useState("");
  const [start, setStart] = useState("10:00");
  const [duration, setDuration] = useState(1);

  useEffect(() => {
    setBookings(loadConf());
    setReady(true);
  }, []);

  const weekStart = useMemo(() => {
    const m = mondayOf(new Date());
    m.setDate(m.getDate() + weekOffset * 7);
    return m;
  }, [weekOffset]);
  const days = useMemo(() => weekDays(weekStart), [weekStart]);
  const rangeLabel = `${days[0].label} – ${days[6].label}`;

  const end = addHours(start, duration);
  const bookerName = who === "tenant" ? tenantOrg : otherName.trim();
  const conflict = useMemo(
    () => bookings.some((b) => b.roomId === roomId && b.dateISO === dateISO && start < b.end && end > b.start),
    [bookings, roomId, dateISO, start, end],
  );
  const addValid = bookerName && dateISO && !conflict;

  const openModal = () => {
    setDateISO(days[0].iso);
    setOtherName("");
    setWho("tenant");
    setOpen(true);
  };

  const addMeeting = () => {
    if (!addValid) return;
    const next: ConfBooking[] = [...bookings, { id: `cb_${Date.now()}`, roomId, tenant: bookerName, dateISO, start, end }];
    setBookings(next);
    saveConf(next);
    setOpen(false);
  };

  const remove = (id: string) => {
    const next = bookings.filter((b) => b.id !== id);
    setBookings(next);
    saveConf(next);
  };

  if (!ready) return <p className="portal-note">Loading…</p>;

  return (
    <div>
      <header className="portal-head">
        <div>
          <h1 className="portal-h1">Conference calendar</h1>
          <p className="portal-sub">{rooms.length} rooms · click a booking to remove it</p>
        </div>
        <button className="btn btn-pop" onClick={openModal}>+ Add meeting</button>
      </header>

      <div className="cal-nav">
        <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset((w) => w - 1)}>← Prev</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(0)} disabled={weekOffset === 0}>Today</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset((w) => w + 1)}>Next →</button>
        <span className="cal-range">{rangeLabel}{weekOffset !== 0 ? ` · ${weekOffset > 0 ? "+" : ""}${weekOffset} wk` : " · this week"}</span>
      </div>

      <div className="pcard" style={{ overflowX: "auto" }}>
        <div className="cal-grid" style={{ gridTemplateColumns: `150px repeat(7, minmax(120px, 1fr))` }}>
          <div className="cal-corner" />
          {days.map((d) => (
            <div key={d.iso} className="cal-day"><span className="cal-dow">{d.dow}</span><span className="cal-date">{d.label}</span></div>
          ))}

          {rooms.map((r) => (
            <div className="cal-row" key={r.id} style={{ display: "contents" }}>
              <div className="cal-room">
                <span className="cal-room-name">{r.name}</span>
                <span className="cal-room-meta">Seats {r.capacity}{r.boardroom ? " · boardroom" : ""}</span>
              </div>
              {days.map((d) => {
                const cell = bookings.filter((b) => b.roomId === r.id && b.dateISO === d.iso);
                return (
                  <div key={d.iso} className="cal-cell">
                    {cell.map((b) => (
                      <button key={b.id} className={`cal-chip${r.boardroom ? " boardroom" : ""}`} onClick={() => remove(b.id)} title="Click to remove">
                        <span className="chip-time">{b.start}–{b.end}</span>
                        <span className="chip-tenant">{b.tenant}</span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="portal-note">Tenant bookings draw from each tenant&apos;s conference-hour bank; operator-added meetings reserve the room directly. Production syncs each room to a Google Calendar (see plan §10).</p>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Add a meeting</h3>
              <button className="modal-x" onClick={() => setOpen(false)}>×</button>
            </div>

            <span className="ctl-label" style={{ marginTop: 0 }}>Reserve for</span>
            <div className="seg" style={{ marginBottom: 8 }}>
              <button className={who === "tenant" ? "on" : ""} onClick={() => setWho("tenant")}>A tenant</button>
              <button className={who === "other" ? "on" : ""} onClick={() => setWho("other")}>Someone else</button>
            </div>
            {who === "tenant" ? (
              <div className="field"><label>Tenant</label><select value={tenantOrg} onChange={(e) => setTenantOrg(e.target.value)}>{tenants.map((t) => <option key={t.id}>{t.org}</option>)}</select></div>
            ) : (
              <div className="field"><label>Name / company</label><input value={otherName} onChange={(e) => setOtherName(e.target.value)} placeholder="Guest or prospect name" /></div>
            )}

            <div className="field"><label>Room</label><select value={roomId} onChange={(e) => setRoomId(e.target.value)}>{rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
            <div className="book-row">
              <div className="field"><label>Date</label><input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} /></div>
              <div className="field"><label>Start</label><select value={start} onChange={(e) => setStart(e.target.value)}>{START_SLOTS.map((s) => <option key={s}>{s}</option>)}</select></div>
              <div className="field"><label>Duration</label><select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>{DURATIONS.map((d) => <option key={d} value={d}>{d} hr{d === 1 ? "" : "s"}</option>)}</select></div>
            </div>
            <p className="portal-note" style={{ marginTop: 0 }}>{start}–{end}{conflict ? " · ⚠ conflicts with an existing booking" : ""}</p>

            <button className="btn btn-pop" style={{ width: "100%", justifyContent: "center" }} disabled={!addValid} onClick={addMeeting}>Add meeting</button>
          </div>
        </div>
      )}
    </div>
  );
}
