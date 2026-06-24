/**
 * Demo occupancy — the single source of truth for "how full is the building."
 * Drives BOTH the public floor plan (which offices read as occupied) and the
 * whole operator console (tenant roster, MRR, units, invoices, conference
 * bookings, KPIs), so changing the level makes the platform behave as if the
 * building is genuinely leased to that degree.
 *
 * The roster is authored in three nested tiers (1 → ~25%, +2 → ~50%, +3 → ~75%).
 * A preset includes every tier at or below it, so dropping from 75%→50%→25%
 * removes the same quarter of tenants each time (never re-randomized). "live"
 * is intentionally NOT a concept here — the roster IS the data.
 */
import { OFFICES, type Office } from "./inventory";
import type { Term } from "./engine";

export type Occupancy = 0 | 25 | 50 | 75;
export const OCCUPANCY_PRESETS: Occupancy[] = [0, 25, 50, 75];
export const DEFAULT_OCCUPANCY: Occupancy = 50;
export const occupancyLabel = (o: Occupancy) => `${o}%`;

export type PayStatus = "paid" | "due" | "failed" | "overdue";

export type LeaseSeed = {
  id: string;
  org: string;
  contact: string;
  email: string;
  officeSlugs: string[];
  furnished: boolean;
  term: Term;
  since: string;
  tier: 1 | 2 | 3; // 1 ≤25%, 2 ≤50%, 3 ≤75%
  pay: PayStatus;
};

/**
 * Authored roster — ~37 of 50 offices at full (75%). Tiers are cumulative.
 * Office slugs must exist in inventory. Spread across all floors so each floor
 * fills progressively.
 */
export const LEASE_ROSTER: LeaseSeed[] = [
  // ── Tier 1 — first ~25% (12 offices) ───────────────────────────────
  { id: "WG-2026-0142", org: "Caldwell & Associates", contact: "Jane Caldwell", email: "jane@caldwellpllc.com", officeSlugs: ["2001-main-p1", "2001-main-p2"], furnished: true, term: 24, since: "Apr 2026", tier: 1, pay: "paid" },
  { id: "WG-2026-0118", org: "Delta Engineering", contact: "Marcus Reed", email: "mreed@deltaeng.com", officeSlugs: ["2001-main-b1", "2001-main-b2"], furnished: false, term: 36, since: "Jan 2026", tier: 1, pay: "paid" },
  { id: "WG-2026-0155", org: "Magnolia Wealth", contact: "Susan Pike", email: "spike@magnoliawealth.com", officeSlugs: ["2001-second-a"], furnished: true, term: 12, since: "May 2026", tier: 1, pay: "overdue" },
  { id: "WG-2026-0103", org: "Pine & Co.", contact: "Aaron Pine", email: "aaron@pineco.law", officeSlugs: ["1993-main-o1"], furnished: true, term: 12, since: "Dec 2025", tier: 1, pay: "paid" },
  { id: "WG-2026-0149", org: "Ridgeland Legal Group", contact: "Tina Holloway", email: "tina@ridgelandlegal.com", officeSlugs: ["2001-second-c"], furnished: false, term: 24, since: "Apr 2026", tier: 1, pay: "due" },
  { id: "WG-2024-0161", org: "Beacon Advisory", contact: "Will Stone", email: "will@beaconadvisory.com", officeSlugs: ["1993-second-o4"], furnished: true, term: 24, since: "Aug 2024", tier: 1, pay: "paid" }, // term ends ~Jul 2026 → in renewal window
  { id: "WG-2024-0137", org: "Tupelo Title", contact: "Dana Briggs", email: "dana@tupelotitle.com", officeSlugs: ["1993-main-o9"], furnished: false, term: 24, since: "Oct 2024", tier: 1, pay: "paid" }, // term ends ~Sep 2026 → reminder sent
  { id: "WG-2026-0170", org: "Cypress Storage Co.", contact: "Ben Voss", email: "ben@cypressstorage.com", officeSlugs: ["2001-basement-fr"], furnished: false, term: 12, since: "Mar 2026", tier: 1, pay: "paid" },
  { id: "WG-2026-0128", org: "Oakhurst CPA", contact: "Rita Glenn", email: "rita@oakhurstcpa.com", officeSlugs: ["2001-main-p6", "2001-main-p7"], furnished: true, term: 18, since: "May 2026", tier: 1, pay: "failed" },

  // ── Tier 2 — up to ~50% (+13 offices) ──────────────────────────────
  { id: "WG-2025-0091", org: "Stennis & Vaughn LLP", contact: "Carl Vaughn", email: "cvaughn@stennisvaughn.com", officeSlugs: ["2001-main-b3", "2001-main-b4", "2001-main-b5"], furnished: false, term: 36, since: "Nov 2025", tier: 2, pay: "paid" },
  { id: "WG-2026-0146", org: "Reservoir Realty", contact: "Mia Carter", email: "mia@reservoirrealty.com", officeSlugs: ["1993-main-o3", "1993-main-o4"], furnished: true, term: 24, since: "Feb 2026", tier: 2, pay: "paid" },
  { id: "WG-2026-0152", org: "Lacey Financial", contact: "Paul Lacey", email: "paul@laceyfinancial.com", officeSlugs: ["2001-second-d", "2001-second-e"], furnished: true, term: 12, since: "Apr 2026", tier: 2, pay: "paid" },
  { id: "WG-2026-0115", org: "Natchez Trace Consulting", contact: "Erin Boyd", email: "erin@natcheztrace.co", officeSlugs: ["1993-second-o1", "1993-second-o2"], furnished: false, term: 24, since: "Jan 2026", tier: 2, pay: "failed" },
  { id: "WG-2026-0158", org: "Highland Insurance", contact: "Greg Mann", email: "greg@highlandins.com", officeSlugs: ["2001-main-p3", "2001-main-p4"], furnished: true, term: 12, since: "May 2026", tier: 2, pay: "paid" },
  { id: "WG-2026-0133", org: "Brookhaven Architects", contact: "Nora Diaz", email: "nora@brookhavenarch.com", officeSlugs: ["1993-main-o5"], furnished: false, term: 18, since: "Mar 2026", tier: 2, pay: "paid" },
  { id: "WG-2026-0166", org: "DataVault IT", contact: "Sam Okafor", email: "sam@datavaultit.com", officeSlugs: ["2001-basement-svr"], furnished: false, term: 24, since: "Feb 2026", tier: 2, pay: "paid" },

  // ── Tier 3 — up to ~75% (+12 offices) ──────────────────────────────
  { id: "WG-2025-0077", org: "Gulfstream Partners", contact: "Hank Doyle", email: "hank@gulfstreampartners.com", officeSlugs: ["2001-main-b6", "2001-main-b7", "2001-main-b8"], furnished: true, term: 36, since: "Oct 2025", tier: 3, pay: "paid" },
  { id: "WG-2026-0162", org: "Yazoo Health Group", contact: "Dr. Lena Park", email: "lpark@yazoohealth.com", officeSlugs: ["1993-second-o5", "1993-second-o7"], furnished: true, term: 24, since: "Feb 2026", tier: 3, pay: "paid" },
  { id: "WG-2026-0159", org: "Vicksburg Ventures", contact: "Troy Bell", email: "troy@vicksburgvc.com", officeSlugs: ["2001-second-f", "2001-second-g"], furnished: false, term: 12, since: "May 2026", tier: 3, pay: "overdue" },
  { id: "WG-2026-0144", org: "Lefleur Marketing", contact: "Quinn Avery", email: "quinn@lefleur.co", officeSlugs: ["1993-main-o6", "1993-main-o7"], furnished: true, term: 18, since: "Apr 2026", tier: 3, pay: "paid" },
  { id: "WG-2026-0151", org: "Capitol Strategies", contact: "Drew Hale", email: "drew@capitolstrategies.com", officeSlugs: ["2001-main-i1", "2001-main-conf"], furnished: true, term: 24, since: "Mar 2026", tier: 3, pay: "paid" },
  { id: "WG-2026-0168", org: "Madison Mutual", contact: "Faye Ross", email: "faye@madisonmutual.com", officeSlugs: ["1993-main-o2"], furnished: true, term: 12, since: "May 2026", tier: 3, pay: "paid" },
];

/** Leases active at a given occupancy (tiers at or below the level). */
export const activeLeases = (occ: Occupancy): LeaseSeed[] =>
  LEASE_ROSTER.filter((l) => l.tier * 25 <= occ);

/** Office slugs occupied at a given occupancy. */
export const occupiedSlugs = (occ: Occupancy): Set<string> =>
  new Set(activeLeases(occ).flatMap((l) => l.officeSlugs));

/** New officesByFloor map with `taken` overridden to match the occupancy. */
export function applyOccupancy(
  officesByFloor: Record<string, Office[]>,
  occ: Occupancy,
): Record<string, Office[]> {
  const taken = occupiedSlugs(occ);
  return Object.fromEntries(
    Object.entries(officesByFloor).map(([k, v]) => [k, v.map((o) => ({ ...o, taken: taken.has(o.slug) }))]),
  );
}

export const TOTAL_OFFICES = OFFICES.length;

/* ── persistence (shared across floor plan + operator console) ── */
const KEY = "wg_occupancy";

export function loadOccupancy(): Occupancy {
  if (typeof window === "undefined") return DEFAULT_OCCUPANCY;
  try {
    const raw = window.localStorage.getItem(KEY);
    const n = raw == null ? NaN : Number(raw);
    return (OCCUPANCY_PRESETS as number[]).includes(n) ? (n as Occupancy) : DEFAULT_OCCUPANCY;
  } catch {
    return DEFAULT_OCCUPANCY;
  }
}

export function saveOccupancy(o: Occupancy) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, String(o));
    // notify same-tab listeners (storage event only fires cross-tab)
    window.dispatchEvent(new CustomEvent("wg-occupancy", { detail: o }));
  } catch {
    /* ignore */
  }
}
