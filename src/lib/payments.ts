/**
 * Payment processing fees (passed to the licensee, per Tyler). Standard US
 * Stripe rates: cards 2.9% + $0.30; ACH 0.8% capped at $5.00. Production reads
 * the live rates from the Stripe account; these constants are the defaults.
 */
export const STRIPE_FEES = {
  cardPct: 0.029,
  cardFixedCents: 30,
  achPct: 0.008,
  achCapCents: 500,
};

export function processingFeeCents(subtotalCents: number, kind: "card" | "bank"): number {
  if (kind === "card") return Math.round(subtotalCents * STRIPE_FEES.cardPct) + STRIPE_FEES.cardFixedCents;
  return Math.min(Math.round(subtotalCents * STRIPE_FEES.achPct), STRIPE_FEES.achCapCents);
}

export function feeLabel(kind: "card" | "bank"): string {
  return kind === "card" ? "Card processing (2.9% + $0.30)" : "ACH processing (0.8%, max $5.00)";
}
