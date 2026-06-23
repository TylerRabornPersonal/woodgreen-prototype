/**
 * Tour-booking store for the prototype (Calendly/HubSpot-style). Availability is
 * weekday time-slots; the admin can block slots, and booked tours occupy slots.
 * Blocked slots + booked tours live in localStorage so the admin console and the
 * public /tour page share state in the same browser — no backend needed.
 *
 * PRODUCTION PLAN (not built yet): this links to the operator's Google Calendar
 * with two-way free/busy sync — slots auto-disable when the operator is busy or
 * on vacation, and each confirmed tour writes an event back. Swap the localStorage
 * helpers for a server + Google Calendar API; the slot/availability shapes stay.
 */

export type TourBooking = {
  id: string;
  dateISO: string; // YYYY-MM-DD
  time: string; // "10:00"
  name: string;
  email: string;
  phone: string;
  offices: string; // "Which office(s) would you like to view?"
  notes: string;
  createdAt: string;
};

export const SLOT_TIMES = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];

export function to12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ap = h < 12 ? "AM" : "PM";
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${String(m).padStart(2, "0")} ${ap}`;
}

const isoOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export type DayInfo = { iso: string; label: string; dow: string; full: string };

export function upcomingWeekdays(count = 12): DayInfo[] {
  const out: DayInfo[] = [];
  const d = new Date();
  d.setDate(d.getDate() + 1); // start tomorrow
  while (out.length < count) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) {
      out.push({
        iso: isoOf(d),
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        dow: d.toLocaleDateString("en-US", { weekday: "short" }),
        full: d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
      });
    }
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export const slotKey = (iso: string, time: string) => `${iso}|${time}`;

const TOURS_KEY = "wg_tours";
const BLOCKED_KEY = "wg_tour_blocked";

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function write(key: string, val: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* ignore */
  }
}

function defaultTours(): TourBooking[] {
  const days = upcomingWeekdays(12);
  return [
    { id: "t1", dateISO: days[1].iso, time: "10:00", name: "Robert Hayes", email: "rhayes@hayescpa.com", phone: "(601) 555-0173", offices: "A & B — 2001 2nd floor (premium)", notes: "Two adjacent premium offices for a CPA practice; bringing a partner.", createdAt: "" },
    { id: "t2", dateISO: days[3].iso, time: "14:00", name: "Dana Whitfield", email: "dana@whitfielddesign.co", phone: "", offices: "O1 or O2 (windows), 1993 Main", notes: "Solo designer, wants a windowed office.", createdAt: "" },
  ];
}

export function loadTours(): TourBooking[] {
  return read<TourBooking[]>(TOURS_KEY) ?? defaultTours();
}
export function saveTours(t: TourBooking[]) {
  write(TOURS_KEY, t);
}
export function loadBlocked(): string[] {
  return read<string[]>(BLOCKED_KEY) ?? [];
}
export function saveBlocked(b: string[]) {
  write(BLOCKED_KEY, b);
}
