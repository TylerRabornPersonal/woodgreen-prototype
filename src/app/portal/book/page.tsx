"use client";

import { useMemo, useState } from "react";
import { usePortal } from "@/components/portal/PortalProvider";
import { rooms, nextDateISO, money } from "@/lib/portal/mock";
import { CONFIG } from "@/lib/engine";

const START_SLOTS: string[] = [];
for (let h = 8; h <= 17; h++) {
  START_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
  START_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
}
const DURATIONS = [0.5, 1, 1.5, 2, 3, 4];

function addHours(time: string, hours: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + hours * 60;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
const fmtDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

export default function BookPage() {
  const { bookings, confRemaining, createBooking, cancelBooking, confBank } = usePortal();
  const [roomId, setRoomId] = useState(rooms[0].id);
  const [dateISO, setDateISO] = useState(nextDateISO(1));
  const [start, setStart] = useState("09:00");
  const [duration, setDuration] = useState(1);
  const [flash, setFlash] = useState<string | null>(null);

  const room = rooms.find((r) => r.id === roomId)!;
  const end = addHours(start, duration);
  const overage = Math.max(0, duration - confRemaining);
  const overageRateCents = room.boardroom ? CONFIG.overageBoardroom * 100 : CONFIG.overageStd * 100;
  const overageCostCents = Math.round(overage * overageRateCents);

  const conflict = useMemo(
    () =>
      bookings.some(
        (b) => b.roomId === roomId && b.dateISO === dateISO && start < b.end && end > b.start,
      ),
    [bookings, roomId, dateISO, start, end],
  );

  const book = () => {
    if (conflict) return;
    createBooking({ roomId, dateISO, start, end, hours: duration });
    setFlash(`Booked ${room.name} · ${fmtDate(dateISO)} ${start}–${end}`);
    setTimeout(() => setFlash(null), 3500);
  };

  const upcoming = bookings.filter((b) => b.dateISO >= new Date().toISOString().slice(0, 10));

  return (
    <div>
      <header className="portal-head">
        <div>
          <h1 className="portal-h1">Book a room</h1>
          <p className="portal-sub">{confRemaining} of {confBank.allotted} conference hours left this month</p>
        </div>
      </header>

      {flash && <div className="flash">✓ {flash}</div>}

      <div className="book-grid">
        <div className="pcard">
          <span className="pcard-eyebrow">New booking</span>

          <span className="ctl-label">Room</span>
          <div className="room-pick">
            {rooms.map((r) => (
              <button key={r.id} className={`room-opt${r.id === roomId ? " on" : ""}`} onClick={() => setRoomId(r.id)}>
                <span className="ro-name">{r.name}</span>
                <span className="ro-meta">Seats {r.capacity}{r.boardroom ? " · boardroom" : ""}</span>
              </button>
            ))}
          </div>

          <div className="book-row">
            <div className="field">
              <label>Date</label>
              <input type="date" value={dateISO} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDateISO(e.target.value)} />
            </div>
            <div className="field">
              <label>Start</label>
              <select value={start} onChange={(e) => setStart(e.target.value)}>
                {START_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Duration</label>
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                {DURATIONS.map((d) => <option key={d} value={d}>{d} hr{d === 1 ? "" : "s"}</option>)}
              </select>
            </div>
          </div>

          <div className="book-summary">
            <div className="prow"><span>When</span><span>{fmtDate(dateISO)} · {start}–{end}</span></div>
            <div className="prow"><span>Draws from bank</span><span>{Math.min(duration, confRemaining)} hr{Math.min(duration, confRemaining) === 1 ? "" : "s"}</span></div>
            {overage > 0 && (
              <div className="prow over"><span>Overage ({overage} hr @ {money(overageRateCents)}/hr)</span><span>{money(overageCostCents)}</span></div>
            )}
          </div>

          {conflict && <p className="portal-note danger">That room is already booked for an overlapping time. Pick another slot.</p>}

          <button className="btn btn-pop" style={{ width: "100%", justifyContent: "center" }} onClick={book} disabled={conflict}>
            Confirm booking
          </button>
        </div>

        <div className="pcard">
          <span className="pcard-eyebrow">Upcoming bookings</span>
          {upcoming.length ? (
            <div className="bk-list">
              {upcoming.map((b) => {
                const r = rooms.find((x) => x.id === b.roomId)!;
                return (
                  <div className="bk" key={b.id}>
                    <div>
                      <div className="bk-room">{r.name}</div>
                      <div className="bk-when">{fmtDate(b.dateISO)} · {b.start}–{b.end} · {b.hours} hr{b.hours === 1 ? "" : "s"}</div>
                    </div>
                    <button className="linklike danger" onClick={() => cancelBooking(b.id)}>Cancel</button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="portal-note">No upcoming bookings.</p>
          )}
        </div>
      </div>
    </div>
  );
}
