import { rooms, adminBookings } from "@/lib/admin/mock";

function next7(): { iso: string; label: string; dow: string }[] {
  const out = [];
  const base = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    out.push({
      iso: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      dow: d.toLocaleDateString("en-US", { weekday: "short" }),
    });
  }
  return out;
}

export default function CalendarPage() {
  const days = next7();

  return (
    <div>
      <header className="portal-head">
        <div>
          <h1 className="portal-h1">Conference calendar</h1>
          <p className="portal-sub">{adminBookings.length} bookings · next 7 days · {rooms.length} rooms</p>
        </div>
      </header>

      <div className="pcard" style={{ overflowX: "auto" }}>
        <div className="cal-grid" style={{ gridTemplateColumns: `150px repeat(${days.length}, minmax(120px, 1fr))` }}>
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
                const cell = adminBookings.filter((b) => b.roomId === r.id && b.dateISO === d.iso);
                return (
                  <div key={d.iso} className="cal-cell">
                    {cell.map((b) => (
                      <div key={b.id} className={`cal-chip${r.boardroom ? " boardroom" : ""}`}>
                        <span className="chip-time">{b.start}–{b.end}</span>
                        <span className="chip-tenant">{b.tenant}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="portal-note">Bookings draw from each tenant&apos;s monthly conference-hour bank; overage is billed automatically.</p>
    </div>
  );
}
