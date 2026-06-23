/**
 * Operator pricing overrides for the prototype. The matrix at /admin/pricing
 * edits these and saves to localStorage; client pricing surfaces read them and
 * pass them to the engine, so edited prices/discounts flow through the app.
 * Production: this becomes the `pricing_config` + per-office rate rows in the DB.
 */
import { OFFICES } from "@/lib/inventory";
import { CONFIG, type EngineConfig } from "@/lib/engine";

export type PricingOverrides = {
  officeRates: Record<string, number>; // slug -> unfurnished base $ /mo
  multiPerOffice: number;
  multiCap: number;
  termDiscount: Record<number, number>;
  listMult: number;
  furnishedMult: number;
};

export function defaultOverrides(): PricingOverrides {
  return {
    officeRates: Object.fromEntries(OFFICES.map((o) => [o.slug, o.rate])),
    multiPerOffice: CONFIG.multiPerOffice,
    multiCap: CONFIG.multiCap,
    termDiscount: { ...CONFIG.termDiscount },
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
      termDiscount: { ...base.termDiscount, ...(stored.termDiscount ?? {}) },
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
  };
}

/** Overridden base rate for an office slug (falls back to the provided default). */
export function rateFor(o: PricingOverrides, slug: string, fallback: number): number {
  return o.officeRates[slug] ?? fallback;
}
