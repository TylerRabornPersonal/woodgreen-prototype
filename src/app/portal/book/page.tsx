"use client";

import { useEffect, useMemo, useState } from "react";
import { usePortal } from "@/components/portal/PortalProvider";
import { rooms } from "@/lib/portal/mock";
import { money } from "@/lib/portal/mock";
import { CONFIG } from "@/lib/engine";
import {
  loadConf,
  mondayOf,
  weekDays,
  START_SLOTS,
  DURATIONS,
  addHours,
  type ConfBooking,
} from "@/lib/admin/conf-store";

export default function BookPage() {
  const { confRemaining, confBank, createBooking, cancelBooking, bookingsVersion, tenant } = usePortal();
  const org = tenant.orgName;

  const [confAll, setConfAll] = useState<ConfBooking[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [open, setOpen] = useState(false);
  const [roomId, setRoomId] = useState(rooms[0].id);
  const [dateISO, setDateISO] = useState("");
  const [start, setStart] = useState("10:00");
  const [duration, setDuration] = useState(1);

  useEffect(() => {
    setConfAll(loadConf());
  }, [bookingsVersion]);

  const weekStart = useMemo(() => {
    const m = mondayOf(new Date());
    m.setDate(m.getDate() + weekOffset * 7);
    return m;
  }, [weekOffset]);
  const days = useMemo(() => weekDays(weekStart), [weekStart]);
  const rangeLabel = `${days[0].label} – ${days[6].label}`;

  const end = addHours(start, duration);
  const room = rooms.find((r) => r.id === roomId)!;
  const overage = Math.max(0, duration - confRemaining);
  const overageRateCents = (room.boardroom ? CONFIG.overageBoardroom : CONFIG.overageStd) * 100;
  const conflict = useMemo(
    () => confAll.some((b) => b.roomId === roomId && b.dateISO === dateISO && start < b.end && end > b.start),
    [confAll, roomId, dateISO, start, end],
  );
  const valid = dateISO && !conflict;

  const openModal = () => { setDateISO(days[0].iso); setOpen(true); };
  const submit = () => {
    if (!valid) return;
    createBooking({ roomId, dateISO, start, end, hours: duration });
    setOpen(false);
  };

  return (
    <div>
      <header className="portal-head">
        <div>
          <h1 className="portal-h1">Book a room</h1>
          <p className="portal-sub">{confRemaining} of {confBank.allotted} conference hours left this month</p>
        </div>
        <button className="btn btn-pop" onClick={openModal}>+ Book a room</button>
      </header>

      <div className="confmeter" style={{ maxWidth: 280, marginBottom: 18 }}><span style={{ width: `${(confRemaining / confBank.allotted) * 100}%` }} /></div>

      <div className="cal-nav">
        <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset((w) => w - 1)}>← Prev</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(0)} disabled={weekOffset === 0}>This week</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset((w) => w + 1)}>Next →</button>
        <span className="cal-range">{rangeLabel}</span>
      </div>

      <div className="pcard" style={{ overflowX: "auto" }}>
        <div className="cal-grid" style={{ gridTemplateColumns: `150px repeat(7, minmax(118px, 1fr))` }}>
          <div className="cal-corner" />
          {days.map((d) => (
            <div key={d.iso} className="cal-day"><span className="cal-dow">{d.dow}</span><span className="cal-date">{d.label}</span></div>
          ))}
          {rooms.map((r) => (
            <div className="cal-row" key={r.id} style={{ display: "contents" }}>
              <div className="cal-room"><span className="cal-room-name">{r.name}</span><span className="cal-room-meta">Seats {r.capacity}{r.boardroom ? " · boardroom" : ""}</span></div>
              {days.map((d) => {
                const cell = confAll.filter((b) => b.roomId === r.id && b.dateISO === d.iso);
                return (
                  <div key={d.iso} className="cal-cell">
                    {cell.map((b) => {
                      const mine = b.tenant === org;
                      return (
                        <button key={b.id} className={`cal-chip${mine ? " mine" : " other"}`} onClick={() => mine && cancelBooking(b.id)} title={mine ? "Your booking · click to cancel" : `Booked by ${b.tenant}`} disabled={!mine}>
                          <span className="chip-time">{b.start}–{b.end}</span>
                          <span className="chip-tenant">{mine ? "You" : b.tenant}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="portal-note">Your bookings (green) draw from your monthly hour bank; click one to cancel. Greyed bookings belong to other tenants.</p>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head"><h3>Book a room</h3><button className="modal-x" onClick={() => setOpen(false)}>×</button></div>
            <div className="field"><label>Room</label><select value={roomId} onChange={(e) => setRoomId(e.target.value)}>{rooms.map((r) => <option key={r.id} value={r.id}>{r.name} · seats {r.capacity}</option>)}</select></div>
            <div className="book-row">
              <div className="field"><label>Date</label><input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} /></div>
              <div className="field"><label>Start</label><select value={start} onChange={(e) => setStart(e.target.value)}>{START_SLOTS.map((s) => <option key={s}>{s}</option>)}</select></div>
              <div className="field"><label>Duration</label><select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>{DURATIONS.map((d) => <option key={d} value={d}>{d} hr{d === 1 ? "" : "s"}</option>)}</select></div>
            </div>
            <div className="book-summary">
              <div className="prow"><span>When</span><span>{days.find((d) => d.iso === dateISO)?.dow ?? ""} · {start}–{end}</span></div>
              <div className="prow"><span>Draws from bank</span><span>{Math.min(duration, confRemaining)} hr{Math.min(duration, confRemaining) === 1 ? "" : "s"}</span></div>
              {overage > 0 && <div className="prow over"><span>Overage ({overage} hr @ {money(overageRateCents)}/hr)</span><span>{money(Math.round(overage * overageRateCents))}</span></div>}
            </div>
            {conflict && <p className="portal-note danger">That room is already booked for an overlapping time.</p>}
            <button className="btn btn-pop" style={{ width: "100%", justifyContent: "center" }} disabled={!valid} onClick={submit}>Confirm booking</button>
          </div>
        </div>
      )}
    </div>
  );
}
