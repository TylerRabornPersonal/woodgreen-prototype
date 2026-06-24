/**
 * Conference-booking store for the operator console. Seeded from the static
 * adminBookings; operator-added meetings persist in localStorage so they show
 * across weeks. PRODUCTION: replace with the room's Google Calendar (see
 * woodgreen-portal-plan.md §10) — list/insert events + free/busy checks.
 */
import { adminBookingsFor, type AdminBooking } from "./mock";
import { DEFAULT_OCCUPANCY } from "@/lib/occupancy";

export type ConfBooking = AdminBooking; // { id, roomId, tenant, dateISO, start, end }

const KEY = "wg_conf_bookings";

function read(): ConfBooking[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ConfBooking[]) : null;
  } catch {
    return null;
  }
}

export function loadConf(): ConfBooking[] {
  return read() ?? adminBookingsFor(DEFAULT_OCCUPANCY).map((b) => ({ ...b }));
}

export function saveConf(b: ConfBooking[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(b));
  } catch {
    /* ignore */
  }
}

/* week + time helpers */

export function mondayOf(d: Date): Date {
  const x = new Date(d);
  const dow = (x.getDay() + 6) % 7; // 0 = Monday
  x.setDate(x.getDate() - dow);
  x.setHours(0, 0, 0, 0);
  return x;
}

export const isoOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function weekDays(weekStart: Date): { iso: string; dow: string; label: string }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return {
      iso: isoOf(d),
      dow: d.toLocaleDateString("en-US", { weekday: "short" }),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
  });
}

export const START_SLOTS: string[] = [];
for (let h = 8; h <= 17; h++) {
  START_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
  START_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
}
export const DURATIONS = [0.5, 1, 1.5, 2, 3, 4];

export function addHours(time: string, hours: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + hours * 60;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
