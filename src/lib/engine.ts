/**
 * Pricing engine — identical logic to woodgreen-pricing-calculator.html.
 * Works in whole DOLLARS (matching the calculator) so quotes reconcile exactly.
 * These constants mirror the `pricing_config` / `term_options` / `conf_hour_tiers`
 * seed rows; swap to DB-driven config later without changing call sites.
 */

export type ConfHourTier = { min: number; hours: number };

export type EngineConfig = {
  listMult: number;
  furnishedMult: number;
  roundIncrement: number;
  multiPerOffice: number;
  multiCap: number;
  termDiscount: Record<number, number>;
  /** Monthly included conference hours per office by list-price tier (sorted high→low). */
  confHourTiers: ConfHourTier[];
  overageStd: number;
  overageBoardroom: number;
};

export const CONFIG: EngineConfig = {
  listMult: 1.1, // negotiation headroom baked into list price
  furnishedMult: 1.2, // furnished = unfurnished × 1.20
  roundIncrement: 25, // round to nearest $25
  multiPerOffice: 0.01, // 1% per office (beyond the first)
  multiCap: 0.1, // capped at 10%
  // 1.5% per 6-month step beyond 12 months.
  termDiscount: { 12: 0, 18: 0.015, 24: 0.03, 30: 0.045, 36: 0.06 },
  // Included conference hours/mo per office, sized for TWO shared conference
  // rooms (previously implied ~3, which over-allocated). Higher-priced offices
  // earn a larger monthly bank; sorted high→low for lookup.
  confHourTiers: [
    { min: 900, hours: 10 },
    { min: 725, hours: 8 },
    { min: 575, hours: 6 },
    { min: 0, hours: 4 },
  ],
  overageStd: 25, // $/hr standard room
  overageBoardroom: 35, // $/hr boardroom
};

export type Term = 12 | 18 | 24 | 30 | 36;

export const round25 = (n: number, inc: number = CONFIG.roundIncrement) =>
  Math.round(n / inc) * inc;

export const money = (n: number) => "$" + Math.round(n).toLocaleString();

/** Displayed monthly list price for an office (after list mult + furnishing + rounding). */
export function officeListPrice(baseUnfurnishedRate: number, furnished: boolean, cfg: EngineConfig = CONFIG): number {
  return round25(baseUnfurnishedRate * cfg.listMult * (furnished ? cfg.furnishedMult : 1), cfg.roundIncrement);
}

/** Displayed monthly price for an add-on (flat — furnishing does not apply). */
export function addOnListPrice(flatRate: number, cfg: EngineConfig = CONFIG): number {
  return round25(flatRate * cfg.listMult, cfg.roundIncrement);
}

/** Monthly conference-hour bank an office earns, by its computed price tier. */
export function confHoursForPrice(price: number, cfg: EngineConfig = CONFIG): number {
  for (const t of cfg.confHourTiers) if (price >= t.min) return t.hours;
  return 0;
}

export type QuoteInput = {
  /** Base UNFURNISHED rates ($) of the selected offices. */
  officeBaseRates: number[];
  /** Flat rates ($) of the selected add-ons. */
  addOnRates: number[];
  furnished: boolean;
  term: Term;
  /** Additional concession fraction 0..1 (the calculator's "Additional % Off"). */
  concession?: number;
};

export type Quote = {
  officeCount: number;
  grossMonthly: number;
  multiDiscount: number;
  termDiscount: number;
  concession: number;
  totalDiscount: number;
  netMonthly: number;
  annual: number;
  contractValue: number;
  confHours: number;
  capped: boolean;
};

export function quote(input: QuoteInput, cfg: EngineConfig = CONFIG): Quote {
  const { officeBaseRates, addOnRates, furnished, term, concession = 0 } = input;

  let gross = 0;
  let confHours = 0;
  const officeCount = officeBaseRates.length;

  for (const base of officeBaseRates) {
    const p = officeListPrice(base, furnished, cfg);
    gross += p;
    confHours += confHoursForPrice(p, cfg);
  }
  for (const rate of addOnRates) {
    gross += addOnListPrice(rate, cfg); // add-ons priced flat, no conf hours
  }

  // Multi-office discount starts at the SECOND office: 1 office = 0%,
  // 2 = 1%, 3 = 2%, … capped at the cap. (A single office gets no multi discount.)
  const multiRaw = Math.max(officeCount - 1, 0) * cfg.multiPerOffice;
  const multiDiscount = Math.min(multiRaw, cfg.multiCap);
  const termDiscount = cfg.termDiscount[term] ?? 0;
  const conc = Math.max(0, Math.min(concession, 1));
  const totalDiscount = multiDiscount + termDiscount + conc;
  const netMonthly = gross * (1 - totalDiscount);

  return {
    officeCount,
    grossMonthly: gross,
    multiDiscount,
    termDiscount,
    concession: conc,
    totalDiscount,
    netMonthly,
    annual: netMonthly * 12,
    contractValue: netMonthly * term,
    confHours,
    capped: multiRaw >= cfg.multiCap,
  };
}
