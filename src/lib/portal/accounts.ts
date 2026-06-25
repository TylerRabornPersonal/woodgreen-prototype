/**
 * Tenant portal accounts for the prototype login. Two distinct tenants you can
 * sign in as: Caldwell (the existing near-renewal demo) and Magnolia Wealth.
 * Logging in sets the active portal session (localStorage) so the portal renders
 * that tenant. Production: real Supabase auth + per-tenant rows.
 */
import { quote, officeListPrice, type Term } from "@/lib/engine";
import { initialPaymentMethods, type Invoice } from "@/lib/portal/mock";
import { DEMO_SESSION, saveSession, type TenantSession } from "@/lib/portal/session";

const dollars = (n: number) => Math.round(n * 100);

type Office = { code: string; name: string | null; sqft: number; rate: number };
type Profile = {
  number: string;
  org: string;
  legal: string;
  contact: string;
  email: string;
  memberSince: string;
  suite: string;
  offices: Office[];
  furnished: boolean;
  term: Term;
  start: string;
  end: string;
};

function build(p: Profile): TenantSession {
  const q = quote({ officeBaseRates: p.offices.map((o) => o.rate), addOnRates: [], furnished: p.furnished, term: p.term });
  const net = dollars(q.netMonthly);
  const license = {
    number: p.number,
    status: "Active" as const,
    furnished: p.furnished,
    termMonths: p.term,
    startDate: p.start,
    endDate: p.end,
    offices: p.offices,
    addOns: [] as { name: string; sqft: number; rate: number }[],
    grossMonthlyCents: dollars(q.grossMonthly),
    netMonthlyCents: net,
    annualCents: dollars(q.annual),
    contractValueCents: dollars(q.contractValue),
    multiDiscount: q.multiDiscount,
    termDiscount: q.termDiscount,
    totalDiscount: q.totalDiscount,
    depositCents: net,
    lineItems: p.offices.map((o) => ({ label: `Office ${o.code}`, sub: `${o.sqft} SF · ${p.furnished ? "furnished" : "unfurnished"}`, cents: dollars(officeListPrice(o.rate, p.furnished)) })),
  };
  const invoices: Invoice[] = [
    { id: "in_b", number: "WG-INV-0612", periodLabel: "June 2026", amountCents: net, status: "due", dateLabel: "Due Jun 1" },
    { id: "in_a", number: "WG-INV-0512", periodLabel: "May 2026", amountCents: net, status: "paid", dateLabel: "Paid May 1" },
  ];
  return {
    tenant: {
      orgName: p.org,
      legalName: p.legal,
      primaryContact: { name: p.contact, email: p.email },
      memberSince: p.memberSince,
      suiteLabel: p.suite,
    },
    license,
    confBank: { allotted: q.confHours, periodLabel: "June 2026" },
    invoices,
    paymentMethods: initialPaymentMethods,
    bookings: [],
    signed: { name: p.contact, date: p.start },
  };
}

const MAGNOLIA = build({
  number: "WG-2026-0155",
  org: "Magnolia Wealth",
  legal: "Magnolia Wealth Advisors, LLC",
  contact: "Susan Pike",
  email: "spike@magnoliawealth.com",
  memberSince: "May 2026",
  suite: "Offices A & B · 2001 Building · Loft",
  offices: [
    { code: "A", name: null, sqft: 390, rate: 1225 },
    { code: "B", name: null, sqft: 390, rate: 1225 },
  ],
  furnished: true,
  term: 12,
  start: "May 1, 2026",
  end: "April 30, 2027",
});

/** Tenant sessions keyed by account tenantId. Caldwell reuses the near-renewal demo. */
export const TENANT_SESSIONS: Record<string, TenantSession> = {
  caldwell: DEMO_SESSION,
  magnolia: MAGNOLIA,
};

/** Activate a tenant's portal session (called on login). */
export function setActiveTenant(tenantId: string) {
  const session = TENANT_SESSIONS[tenantId];
  if (session) saveSession(session);
}
