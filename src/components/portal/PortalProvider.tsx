"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { rooms, type PaymentMethod, type Booking, type Invoice } from "@/lib/portal/mock";
import {
  DEMO_SESSION,
  loadSession,
  type SessionTenant,
  type SessionLicense,
  type SessionConfBank,
} from "@/lib/portal/session";

type PortalState = {
  tenant: SessionTenant;
  license: SessionLicense;
  confBank: SessionConfBank;
  invoices: Invoice[];
  paymentMethods: PaymentMethod[];
  bookings: Booking[];
  confUsed: number;
  confRemaining: number;
  isGenerated: boolean; // true if a real flow created this tenant (vs demo)
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

  const createBooking: PortalState["createBooking"] = (b) =>
    setBookings((prev) => [...prev, { ...b, id: nextId("bk") }].sort((a, z) => (a.dateISO + a.start).localeCompare(z.dateISO + z.start)));

  const cancelBooking: PortalState["cancelBooking"] = (id) =>
    setBookings((prev) => prev.filter((b) => b.id !== id));

  const value: PortalState = {
    tenant: session.tenant,
    license: session.license,
    confBank: session.confBank,
    invoices: session.invoices,
    paymentMethods,
    bookings,
    confUsed,
    confRemaining,
    isGenerated,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    createBooking,
    cancelBooking,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export { rooms };
