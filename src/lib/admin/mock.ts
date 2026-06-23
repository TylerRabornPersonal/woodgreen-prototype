/**
 * Mock admin/operator dataset for the landlord console. Fake but internally
 * consistent: lease figures come from the real pricing engine, occupancy is
 * derived from the leases against the real 44-office inventory, and a couple of
 * payments are intentionally failing so the admin has something to act on.
 * No DB required — swap for Supabase queries later behind the same shapes.
 */
import { OFFICES, ADD_ONS } from "@/lib/inventory";
import { quote, type Term } from "@/lib/engine";
import { rooms, nextDateISO } from "@/lib/portal/mock";

export const money = (cents: number) => "$" + Math.round(cents / 100).toLocaleString();
const dollars = (n: number) => Math.round(n * 100);

type LeaseSeed = {
  id: string;
  org: string;
  contact: string;
  email: string;
  officeSlugs: string[];
  addOnSlugs: string[];
  furnished: boolean;
  term: Term;
  since: string;
};

const LEASES: LeaseSeed[] = [
  { id: "WG-2026-0142", org: "Caldwell & Associates", contact: "Jane Caldwell", email: "jane@caldwellpllc.com", officeSlugs: ["2001-main-p1", "2001-main-p2", "2001-main-p3"], addOnSlugs: ["conf-254"], furnished: true, term: 24, since: "Apr 2026" },
  { id: "WG-2026-0118", org: "Delta Engineering", contact: "Marcus Reed", email: "mreed@deltaeng.com", officeSlugs: ["2001-main-b1", "2001-main-b2", "2001-main-b3", "2001-main-b4"], addOnSlugs: ["server-it", "storage-a"], furnished: false, term: 36, since: "Jan 2026" },
  { id: "WG-2026-0155", org: "Magnolia Wealth", contact: "Susan Pike", email: "spike@magnoliawealth.com", officeSlugs: ["2001-second-a", "2001-second-b"], addOnSlugs: [], furnished: true, term: 12, since: "May 2026" },
  { id: "WG-2026-0103", org: "Pine & Co.", contact: "Aaron Pine", email: "aaron@pineco.law", officeSlugs: ["1993-main-o1"], addOnSlugs: [], furnished: true, term: 12, since: "Dec 2025" },
  { id: "WG-2026-0149", org: "Ridgeland Legal Group", contact: "Tina Holloway", email: "tina@ridgelandlegal.com", officeSlugs: ["2001-second-c", "2001-second-e"], addOnSlugs: ["flex"], furnished: false, term: 24, since: "Apr 2026" },
];

const officeBySlug = new Map(OFFICES.map((o) => [o.slug, o]));
const addOnBySlug = new Map(ADD_ONS.map((a) => [a.slug, a]));

export type Tenant = {
  id: string;
  org: string;
  contact: string;
  email: string;
  offices: { slug: string; code: string }[];
  officeCount: number;
  furnished: boolean;
  term: Term;
  since: string;
  netMonthlyCents: number;
};

export const tenants: Tenant[] = LEASES.map((l) => {
  const offices = l.officeSlugs.map((s) => officeBySlug.get(s)).filter(Boolean) as typeof OFFICES;
  const addRates = l.addOnSlugs.map((s) => addOnBySlug.get(s)?.rate ?? 0);
  const q = quote({ officeBaseRates: offices.map((o) => o.rate), addOnRates: addRates, furnished: l.furnished, term: l.term });
  return {
    id: l.id,
    org: l.org,
    contact: l.contact,
    email: l.email,
    offices: offices.map((o) => ({ slug: o.slug, code: o.code })),
    officeCount: offices.length,
    furnished: l.furnished,
    term: l.term,
    since: l.since,
    netMonthlyCents: dollars(q.netMonthly),
  };
});

/* --- unit occupancy across the whole building --- */
const leasedMap = new Map<string, Tenant>();
for (const t of tenants) for (const o of t.offices) leasedMap.set(o.slug, t);

export type Unit = {
  slug: string;
  code: string;
  floorId: string;
  sqft: number;
  status: "leased" | "available";
  tenant: string | null;
};

export const units: Unit[] = OFFICES.map((o) => ({
  slug: o.slug,
  code: o.code,
  floorId: o.floorId,
  sqft: o.sqft,
  status: leasedMap.has(o.slug) ? "leased" : "available",
  tenant: leasedMap.get(o.slug)?.org ?? null,
}));

export const floorLabels: Record<string, string> = {
  "1993-main": "1993 · Main",
  "1993-second": "1993 · 2nd",
  "2001-main": "2001 · Main",
  "2001-second": "2001 · 2nd (Premium)",
};

/* --- building-wide invoices, with payment errors to act on --- */
export type AdminInvoice = {
  id: string;
  tenant: string;
  periodLabel: string;
  amountCents: number;
  status: "paid" | "due" | "failed" | "overdue";
  detail: string;
};

export const adminInvoices: AdminInvoice[] = [
  { id: "WG-INV-0612-A", tenant: "Caldwell & Associates", periodLabel: "June 2026", amountCents: tenants[0].netMonthlyCents, status: "paid", detail: "ACH · Jun 1" },
  { id: "WG-INV-0612-B", tenant: "Delta Engineering", periodLabel: "June 2026", amountCents: tenants[1].netMonthlyCents, status: "paid", detail: "ACH · Jun 1" },
  { id: "WG-INV-0612-C", tenant: "Magnolia Wealth", periodLabel: "June 2026", amountCents: tenants[2].netMonthlyCents, status: "overdue", detail: "Unpaid · 9 days past due" },
  { id: "WG-INV-0612-D", tenant: "Pine & Co.", periodLabel: "June 2026", amountCents: tenants[3].netMonthlyCents, status: "failed", detail: "Card declined (insufficient funds) · retry 3 of 4" },
  { id: "WG-INV-0612-E", tenant: "Ridgeland Legal Group", periodLabel: "June 2026", amountCents: tenants[4].netMonthlyCents, status: "due", detail: "Scheduled · drafts Jun 1" },
];

/* --- conference bookings across all rooms (next ~7 days) --- */
export type AdminBooking = {
  id: string;
  roomId: string;
  tenant: string;
  dateISO: string;
  start: string;
  end: string;
};

export const adminBookings: AdminBooking[] = [
  { id: "abk_1", roomId: "oak", tenant: "Caldwell & Associates", dateISO: nextDateISO(1), start: "09:00", end: "10:30" },
  { id: "abk_2", roomId: "magnolia", tenant: "Delta Engineering", dateISO: nextDateISO(1), start: "13:00", end: "14:00" },
  { id: "abk_3", roomId: "oak", tenant: "Magnolia Wealth", dateISO: nextDateISO(2), start: "11:00", end: "12:00" },
  { id: "abk_4", roomId: "study", tenant: "Ridgeland Legal Group", dateISO: nextDateISO(2), start: "15:00", end: "16:30" },
  { id: "abk_5", roomId: "oak", tenant: "Delta Engineering", dateISO: nextDateISO(3), start: "10:00", end: "12:00" },
  { id: "abk_6", roomId: "magnolia", tenant: "Caldwell & Associates", dateISO: nextDateISO(4), start: "09:30", end: "10:30" },
  { id: "abk_7", roomId: "study", tenant: "Pine & Co.", dateISO: nextDateISO(5), start: "14:00", end: "15:00" },
];

export { rooms };

/* --- KPI rollups --- */
const totalOffices = OFFICES.length;
const leasedCount = units.filter((u) => u.status === "leased").length;

export const kpis = {
  totalOffices,
  leasedCount,
  availableCount: totalOffices - leasedCount,
  occupancyPct: Math.round((leasedCount / totalOffices) * 100),
  mrrCents: tenants.reduce((s, t) => s + t.netMonthlyCents, 0),
  activeTenants: tenants.length,
  paymentIssues: adminInvoices.filter((i) => i.status === "failed" || i.status === "overdue").length,
  bookingsThisWeek: adminBookings.length,
};
