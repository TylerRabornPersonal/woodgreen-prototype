/**
 * Operator pricing overrides for the prototype. The matrix at /admin/pricing
 * edits these and saves to localStorage; client pricing surfaces read them and
 * pass them to the engine, so edited prices/discounts flow through the app.
 * Production: this becomes the `pricing_config` + per-office rate rows in the DB.
 */
import { OFFICES } from "@/lib/inventory";
import { CONFIG, type EngineConfig, type ConfHourTier } from "@/lib/engine";

export type PricingOverrides = {
  officeRates: Record<string, number>; // slug -> unfurnished base $ /mo
  officeFurnishedRates: Record<string, number>; // slug -> furnished base $ /mo (independent)
  multiPerOffice: number;
  multiCap: number;
  termDiscount: Record<number, number>;
  confHourTiers: ConfHourTier[]; // included conf hours/mo per office by price tier
  listMult: number;
  furnishedMult: number; // only the default seed for furnished rates now
};

export function defaultOverrides(): PricingOverrides {
  return {
    officeRates: Object.fromEntries(OFFICES.map((o) => [o.slug, o.rate])),
    officeFurnishedRates: Object.fromEntries(OFFICES.map((o) => [o.slug, Math.round(o.rate * CONFIG.furnishedMult)])),
    multiPerOffice: CONFIG.multiPerOffice,
    multiCap: CONFIG.multiCap,
    termDiscount: { ...CONFIG.termDiscount },
    confHourTiers: CONFIG.confHourTiers.map((t) => ({ ...t })),
    listMult: CONFIG.listMult,
    furnishedMult: CONFIG.furnishedMult,
  };
}

const KEY = "wg_pricing";

export function loadOverrides(): PricingOverrides {
  const base = defaultOverrides();
  if (typeof window === "undefined") return base;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return base;
    const stored = JSON.parse(raw) as Partial<PricingOverrides>;
    return {
      ...base,
      ...stored,
      // merge maps so newly-added offices/terms keep defaults
      officeRates: { ...base.officeRates, ...(stored.officeRates ?? {}) },
      officeFurnishedRates: { ...base.officeFurnishedRates, ...(stored.officeFurnishedRates ?? {}) },
      termDiscount: { ...base.termDiscount, ...(stored.termDiscount ?? {}) },
      confHourTiers: stored.confHourTiers ?? base.confHourTiers,
    };
  } catch {
    return base;
  }
}

export function saveOverrides(o: PricingOverrides) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(o));
  } catch {
    /* ignore */
  }
}

export function resetOverrides() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Build an engine config from the overrides (keeps non-overridable fields). */
export function toEngineConfig(o: PricingOverrides): EngineConfig {
  return {
    ...CONFIG,
    listMult: o.listMult,
    furnishedMult: o.furnishedMult,
    multiPerOffice: o.multiPerOffice,
    multiCap: o.multiCap,
    termDiscount: o.termDiscount,
    confHourTiers: o.confHourTiers,
  };
}

/** Overridden UNFURNISHED base rate for an office slug. */
export function rateFor(o: PricingOverrides, slug: string, fallback: number): number {
  return o.officeRates[slug] ?? fallback;
}

/** Overridden FURNISHED base rate (defaults to unfurnished × furnished mult). */
export function furnishedRateFor(o: PricingOverrides, slug: string, unfFallback: number): number {
  return o.officeFurnishedRates[slug] ?? Math.round((o.officeRates[slug] ?? unfFallback) * o.furnishedMult);
}

/** Effective base rate for the chosen furnishing. The engine then applies list markup. */
export function baseFor(o: PricingOverrides, slug: string, unfFallback: number, furnished: boolean): number {
  return furnished ? furnishedRateFor(o, slug, unfFallback) : rateFor(o, slug, unfFallback);
}
