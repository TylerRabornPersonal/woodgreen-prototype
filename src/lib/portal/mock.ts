/**
 * Mock tenant for the portal prototype. Everything here is fake but internally
 * consistent (the license figures come from the real pricing engine). No DB or
 * Stripe required — this is what the portal renders so the experience is fully
 * clickable. Swap for real Supabase/Stripe data later behind the same shapes.
 */
import { quote, officeListPrice, addOnListPrice, type Term } from "@/lib/engine";

export type PaymentMethod = {
  id: string;
  kind: "card" | "bank";
  label: string; // "Visa", "Regions Bank — Checking"
  last4: string;
  isDefault: boolean;
};

export type Invoice = {
  id: string;
  number: string;
  periodLabel: string; // "June 2026"
  amountCents: number;
  status: "paid" | "due" | "upcoming";
  dateLabel: string; // issued / due date
};

export type Room = {
  id: string;
  name: string;
  capacity: number;
  boardroom: boolean;
};

export type Booking = {
  id: string;
  roomId: string;
  dateISO: string; // YYYY-MM-DD
  start: string; // "09:00"
  end: string; // "11:00"
  hours: number;
};

const dollars = (n: number) => Math.round(n * 100);

/* --- the tenant's license (built from real engine math) --- */

const OFFICES = [
  { code: "P1", name: null as string | null, sqft: 222, rate: 850 },
  { code: "P2", name: null as string | null, sqft: 171, rate: 725 },
  { code: "P3", name: null as string | null, sqft: 198, rate: 750 },
];
const ADDONS = [{ name: "Dedicated Conference · 254 SF", sqft: 254, rate: 850 }];
const FURNISHED = true;
const TERM: Term = 24;

const q = quote({
  officeBaseRates: OFFICES.map((o) => o.rate),
  addOnRates: ADDONS.map((a) => a.rate),
  furnished: FURNISHED,
  term: TERM,
});

export const tenant = {
  orgName: "Caldwell & Associates",
  legalName: "Caldwell & Associates, PLLC",
  primaryContact: { name: "Jane Caldwell", email: "jane@caldwellpllc.com" },
  memberSince: "September 2024",
  suiteLabel: "Offices P1, P2, P3 · 2001 Building, Main Floor",
};

export const license = {
  number: "WG-2026-0142",
  status: "Active" as const,
  furnished: FURNISHED,
  termMonths: TERM,
  startDate: "September 1, 2024",
  endDate: "August 31, 2026",
  offices: OFFICES,
  addOns: ADDONS,
  grossMonthlyCents: dollars(q.grossMonthly),
  netMonthlyCents: dollars(q.netMonthly),
  annualCents: dollars(q.annual),
  contractValueCents: dollars(q.contractValue),
  multiDiscount: q.multiDiscount,
  termDiscount: q.termDiscount,
  totalDiscount: q.totalDiscount,
  depositCents: dollars(q.netMonthly), // one month deposit
  lineItems: [
    ...OFFICES.map((o) => ({
      label: `Office ${o.code}`,
      sub: `${o.sqft} SF · ${FURNISHED ? "furnished" : "unfurnished"}`,
      cents: dollars(officeListPrice(o.rate, FURNISHED)),
    })),
    ...ADDONS.map((a) => ({
      label: a.name,
      sub: `${a.sqft} SF · add-on`,
      cents: dollars(addOnListPrice(a.rate)),
    })),
  ],
};

export const confBank = {
  allotted: q.confHours, // monthly hours
  periodLabel: "June 2026",
};

export const initialPaymentMethods: PaymentMethod[] = [
  { id: "pm_1", kind: "bank", label: "Regions Bank · Checking", last4: "4021", isDefault: true },
  { id: "pm_2", kind: "card", label: "Visa", last4: "4242", isDefault: false },
];

export const invoices: Invoice[] = [
  { id: "in_6", number: "WG-INV-0612", periodLabel: "June 2026", amountCents: license.netMonthlyCents, status: "due", dateLabel: "Due Jun 1" },
  { id: "in_5", number: "WG-INV-0512", periodLabel: "May 2026", amountCents: license.netMonthlyCents, status: "paid", dateLabel: "Paid May 1" },
  { id: "in_4", number: "WG-INV-0412", periodLabel: "April 2026", amountCents: license.netMonthlyCents + license.depositCents, status: "paid", dateLabel: "Paid Apr 1 (incl. deposit)" },
];

export const rooms: Room[] = [
  { id: "oak", name: "The Oak Room", capacity: 8, boardroom: true },
  { id: "magnolia", name: "The Magnolia Room", capacity: 4, boardroom: false },
  { id: "study", name: "The Study", capacity: 2, boardroom: false },
];

export const initialBookings: Booking[] = [
  { id: "bk_1", roomId: "oak", dateISO: nextDateISO(2), start: "10:00", end: "11:30", hours: 1.5 },
];

/* helpers */
export function nextDateISO(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}
export const money = (cents: number) => "$" + Math.round(cents / 100).toLocaleString();
