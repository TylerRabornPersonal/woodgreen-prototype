/**
 * Mock admin/operator dataset for the landlord console. Fake but internally
 * consistent: lease figures come from the real pricing engine, occupancy is
 * derived from the leases against the real 44-office inventory, and a couple of
 * payments are intentionally failing so the admin has something to act on.
 * No DB required — swap for Supabase queries later behind the same shapes.
 */
import { OFFICES } from "@/lib/inventory";
import { quote, type Term } from "@/lib/engine";
import { rooms, nextDateISO } from "@/lib/portal/mock";
import { activeLeases, type Occupancy, type PayStatus } from "@/lib/occupancy";

export const money = (cents: number) => "$" + Math.round(cents / 100).toLocaleString();
const dollars = (n: number) => Math.round(n * 100);

const officeBySlug = new Map(OFFICES.map((o) => [o.slug, o]));

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
  confHours: number;
  pay: PayStatus;
};

/** Active tenants at the given occupancy, with money & conf hours from the engine. */
export function tenantsFor(occ: Occupancy): Tenant[] {
  return activeLeases(occ).map((l) => {
    const offices = l.officeSlugs.map((s) => officeBySlug.get(s)).filter(Boolean) as typeof OFFICES;
    const q = quote({ officeBaseRates: offices.map((o) => o.rate), addOnRates: [], furnished: l.furnished, term: l.term });
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
      confHours: q.confHours,
      pay: l.pay,
    };
  });
}

/* --- unit occupancy across the whole building --- */
export type Unit = {
  slug: string;
  code: string;
  floorId: string;
  sqft: number;
  status: "leased" | "available";
  tenant: string | null;
};

export function unitsFor(occ: Occupancy): Unit[] {
  const leasedMap = new Map<string, string>();
  for (const t of tenantsFor(occ)) for (const o of t.offices) leasedMap.set(o.slug, t.org);
  return OFFICES.map((o) => ({
    slug: o.slug,
    code: o.code,
    floorId: o.floorId,
    sqft: o.sqft,
    status: leasedMap.has(o.slug) ? "leased" : "available",
    tenant: leasedMap.get(o.slug) ?? null,
  }));
}

export const floorLabels: Record<string, string> = {
  "1993-main": "1993 · Main",
  "1993-second": "1993 · 2nd",
  "2001-main": "2001 · Main",
  "2001-second": "2001 · 2nd",
  "2001-basement": "2001 · Basement (Storage)",
};

/* --- building-wide invoices (one per active tenant, current period) --- */
export type AdminInvoice = {
  id: string;
  tenant: string;
  periodLabel: string;
  amountCents: number;
  status: PayStatus;
  detail: string;
};

const PAY_DETAIL: Record<PayStatus, string> = {
  paid: "ACH · Jun 1",
  due: "Scheduled · drafts Jun 1",
  failed: "Card declined (insufficient funds) · retry 3 of 4",
  overdue: "Unpaid · 9 days past due",
};

export function adminInvoicesFor(occ: Occupancy): AdminInvoice[] {
  return tenantsFor(occ).map((t, i) => ({
    id: `WG-INV-0626-${String(i + 1).padStart(2, "0")}`,
    tenant: t.org,
    periodLabel: "June 2026",
    amountCents: t.netMonthlyCents,
    status: t.pay,
    detail: PAY_DETAIL[t.pay],
  }));
}

/* --- conference bookings across all rooms (next ~7 days) --- */
export type AdminBooking = {
  id: string;
  roomId: string;
  tenant: string;
  dateISO: string;
  start: string;
  end: string;
};

const SLOTS: [string, string][] = [
  ["09:00", "10:30"], ["13:00", "14:00"], ["11:00", "12:00"],
  ["15:00", "16:30"], ["10:00", "12:00"], ["09:30", "10:30"], ["14:00", "15:00"],
];

export function adminBookingsFor(occ: Occupancy): AdminBooking[] {
  const ten = tenantsFor(occ);
  const roomIds = rooms.map((r) => r.id);
  const out: AdminBooking[] = [];
  // ~half the active tenants have a booking in the next week, spread across rooms/days
  ten.forEach((t, i) => {
    if (i % 2 !== 0) return;
    const slot = SLOTS[i % SLOTS.length];
    out.push({
      id: `abk_${i}`,
      roomId: roomIds[i % roomIds.length],
      tenant: t.org,
      dateISO: nextDateISO((i % 5) + 1),
      start: slot[0],
      end: slot[1],
    });
  });
  return out;
}

export { rooms };

/* --- KPI rollups --- */
export function kpisFor(occ: Occupancy) {
  const ten = tenantsFor(occ);
  const u = unitsFor(occ);
  const inv = adminInvoicesFor(occ);
  const totalOffices = OFFICES.length;
  const leasedCount = u.filter((x) => x.status === "leased").length;
  return {
    totalOffices,
    leasedCount,
    availableCount: totalOffices - leasedCount,
    occupancyPct: Math.round((leasedCount / totalOffices) * 100),
    mrrCents: ten.reduce((s, t) => s + t.netMonthlyCents, 0),
    activeTenants: ten.length,
    confHoursAllotted: ten.reduce((s, t) => s + t.confHours, 0),
    paymentIssues: inv.filter((i) => i.status === "failed" || i.status === "overdue").length,
    bookingsThisWeek: adminBookingsFor(occ).length,
  };
}
