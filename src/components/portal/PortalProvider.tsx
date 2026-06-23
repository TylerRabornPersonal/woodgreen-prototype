"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  initialPaymentMethods,
  initialBookings,
  confBank,
  rooms,
  type PaymentMethod,
  type Booking,
} from "@/lib/portal/mock";

type PortalState = {
  paymentMethods: PaymentMethod[];
  bookings: Booking[];
  confUsed: number;
  confRemaining: number;
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
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(initialPaymentMethods);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);

  const confUsed = useMemo(() => bookings.reduce((s, b) => s + b.hours, 0), [bookings]);
  const confRemaining = Math.max(confBank.allotted - confUsed, 0);

  const addPaymentMethod: PortalState["addPaymentMethod"] = (m) =>
    setPaymentMethods((prev) => {
      const makeDefault = prev.length === 0;
      const next: PaymentMethod = { ...m, id: nextId("pm"), isDefault: makeDefault };
      return makeDefault ? [next] : [...prev, next];
    });

  const removePaymentMethod: PortalState["removePaymentMethod"] = (id) =>
    setPaymentMethods((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      // keep a default if we removed it
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
    paymentMethods,
    bookings,
    confUsed,
    confRemaining,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    createBooking,
    cancelBooking,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export { rooms };
