/**
 * Active-tenant session for the prototype. When a prospect completes the flow
 * (select → sign → pay), we save the assembled tenant here in localStorage and
 * the portal renders THAT tenant ("generates a new portal"). With no session,
 * the portal falls back to the built-in demo tenant. No backend required.
 *
 * Swap localStorage for Supabase + a real auth session later; the shapes match.
 */
import {
  tenant as demoTenant,
  license as demoLicense,
  confBank as demoConfBank,
  invoices as demoInvoices,
  initialPaymentMethods,
  initialBookings,
  type PaymentMethod,
  type Invoice,
  type Booking,
} from "./mock";

export type SessionTenant = typeof demoTenant;
// Widen termMonths off the demo's literal type so any elected term (12/24/36) fits.
export type SessionLicense = Omit<typeof demoLicense, "termMonths"> & { termMonths: number };
export type SessionConfBank = typeof demoConfBank;

export type TenantSession = {
  tenant: SessionTenant;
  license: SessionLicense;
  confBank: SessionConfBank;
  invoices: Invoice[];
  paymentMethods: PaymentMethod[];
  bookings: Booking[];
  signed: { name: string; date: string };
};

const KEY = "wg_active_tenant";

export const DEMO_SESSION: TenantSession = {
  tenant: demoTenant,
  license: demoLicense,
  confBank: demoConfBank,
  invoices: demoInvoices,
  paymentMethods: initialPaymentMethods,
  bookings: initialBookings,
  signed: { name: demoTenant.primaryContact.name, date: demoLicense.startDate },
};

export function saveSession(s: TenantSession) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore quota/availability errors in the prototype */
  }
}

export function loadSession(): TenantSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TenantSession) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** The session to render: the created tenant if present, else the demo. */
export function getActiveSession(): TenantSession {
  return loadSession() ?? DEMO_SESSION;
}
