"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { rooms, type PaymentMethod, type Booking, type Invoice } from "@/lib/portal/mock";
import { loadConf, saveConf } from "@/lib/admin/conf-store";
import {
  DEMO_SESSION,
  loadSession,
  type SessionTenant,
  type SessionLicense,
  type SessionConfBank,
} from "@/lib/portal/session";
import {
  renewalInfo,
  loadRenewalChoice,
  saveRenewalChoice,
  type RenewalChoice,
  type RenewalInfo,
} from "@/lib/portal/renewal";

type PortalState = {
  tenant: SessionTenant;
  license: SessionLicense;
  confBank: SessionConfBank;
  invoices: Invoice[];
  paymentMethods: PaymentMethod[];
  bookings: Booking[];
  confUsed: number;
  confRemaining: number;
  bookingsVersion: number; // bumps when conference bookings change (for the shared calendar)
  isGenerated: boolean; // true if a real flow created this tenant (vs demo)
  renewal: RenewalInfo;
  renewalChoice: RenewalChoice;
  setRenewalChoice: (c: RenewalChoice) => void;
  addPaymentMethod: (m: Omit<PaymentMethod, "id" | "isDefault">) => void;
  removePaymentMethod: (id: string) => void;
  setDefaultPaymentMethod: (id: string) => void;
  createBooking: (b: Omit<Booking, "id">) => void;
  cancelBooking: (id: string) => void;
};

const Ctx = createContext<PortalState | null>(null);

export function usePortal() {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePortal must be used inside <PortalProvider>");
  return v;
}

let idn = 100;
const nextId = (p: string) => `${p}_${++idn}`;

export default function PortalProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(DEMO_SESSION);
  const [isGenerated, setIsGenerated] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(DEMO_SESSION.paymentMethods);
  const [bookings, setBookings] = useState<Booking[]>(DEMO_SESSION.bookings);
  const [bookingsVersion, setBookingsVersion] = useState(0);

  // After mount, swap in the tenant created by the flow (if any).
  useEffect(() => {
    const s = loadSession();
    if (s) {
      setSession(s);
      setPaymentMethods(s.paymentMethods);
      setBookings(s.bookings);
      setIsGenerated(true);
    }
  }, []);

  const confUsed = useMemo(() => bookings.reduce((s, b) => s + b.hours, 0), [bookings]);
  const confRemaining = Math.max(session.confBank.allotted - confUsed, 0);

  const renewal = useMemo(() => renewalInfo(session.license), [session.license]);
  const [renewalChoice, setRenewalChoiceState] = useState<RenewalChoice>("pending");
  useEffect(() => setRenewalChoiceState(loadRenewalChoice()), []);
  const setRenewalChoice = (c: RenewalChoice) => {
    saveRenewalChoice(c);
    setRenewalChoiceState(c);
  };

  const addPaymentMethod: PortalState["addPaymentMethod"] = (m) =>
    setPaymentMethods((prev) => {
      const makeDefault = prev.length === 0;
      const next: PaymentMethod = { ...m, id: nextId("pm"), isDefault: makeDefault };
      return makeDefault ? [next] : [...prev, next];
    });

  const removePaymentMethod: PortalState["removePaymentMethod"] = (id) =>
    setPaymentMethods((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      if (filtered.length && !filtered.some((p) => p.isDefault)) filtered[0].isDefault = true;
      return [...filtered];
    });

  const setDefaultPaymentMethod: PortalState["setDefaultPaymentMethod"] = (id) =>
    setPaymentMethods((prev) => prev.map((p) => ({ ...p, isDefault: p.id === id })));

  const createBooking: PortalState["createBooking"] = (b) => {
    const id = nextId("bk");
    setBookings((prev) => [...prev, { ...b, id }].sort((a, z) => (a.dateISO + a.start).localeCompare(z.dateISO + z.start)));
    // mirror into the shared building conference calendar (so admin + the grid see it)
    saveConf([...loadConf(), { id, roomId: b.roomId, tenant: session.tenant.orgName, dateISO: b.dateISO, start: b.start, end: b.end }]);
    setBookingsVersion((v) => v + 1);
  };

  const cancelBooking: PortalState["cancelBooking"] = (id) => {
    setBookings((prev) => prev.filter((b) => b.id !== id));
    saveConf(loadConf().filter((x) => x.id !== id));
    setBookingsVersion((v) => v + 1);
  };

  const value: PortalState = {
    tenant: session.tenant,
    license: session.license,
    confBank: session.confBank,
    invoices: session.invoices,
    paymentMethods,
    bookings,
    confUsed,
    confRemaining,
    bookingsVersion,
    isGenerated,
    renewal,
    renewalChoice,
    setRenewalChoice,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    createBooking,
    cancelBooking,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export { rooms };
