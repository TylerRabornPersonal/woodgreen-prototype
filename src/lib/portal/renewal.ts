/**
 * Renewal workflow (per agreement §2.2–2.3). A license auto-renews for a like
 * term unless either party gives notice by the 60-day mark, at the GREATER of
 * +3% or the then-current Fee Schedule. The platform sends a reminder 90 days
 * out (30 days before the notice mark) and surfaces a dashboard notification
 * that persists until the tenant renews, enables auto-renewal, or elects
 * month-to-month (125%). Stripe billing is adjusted to match the choice.
 */

export type RenewalChoice = "pending" | "renew" | "auto" | "mtm";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY = 86_400_000;

/** Parse "August 31, 2026" → Date (local). Falls back to Date(str). */
export function parseLongDate(s: string): Date {
  const m = /^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/.exec(s.trim());
  if (m) return new Date(Number(m[3]), MONTHS.indexOf(m[1]), Number(m[2]));
  const d = new Date(s);
  return isNaN(+d) ? new Date() : d;
}

export function fmtLongDate(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export type RenewalInfo = {
  endDate: Date;
  daysToEnd: number;
  reminderAt: Date; // end − 90d (email + dashboard notification)
  noticeDeadline: Date; // end − 60d (decide by here or it auto-renews)
  reminderSent: boolean; // now ≥ reminderAt
  windowOpen: boolean; // within [reminderAt, endDate)
  pastNoticeDeadline: boolean;
  daysToNotice: number;
  currentMonthlyCents: number;
  renewMonthlyCents: number; // greater of +3% or then-current Fee Schedule
  mtmMonthlyCents: number; // 125%
  renewTermMonths: number;
  renewEffective: Date; // day after current term ends
};

/**
 * @param feeScheduleMonthlyCents optional "then-current Fee Schedule" net for the
 *        same offices/term/furnishing; defaults to current (so +3% governs when
 *        rates are unchanged).
 */
export function renewalInfo(
  license: { endDate: string; netMonthlyCents: number; termMonths: number },
  now: Date = new Date(),
  feeScheduleMonthlyCents?: number,
): RenewalInfo {
  const endDate = parseLongDate(license.endDate);
  const reminderAt = new Date(+endDate - 90 * DAY);
  const noticeDeadline = new Date(+endDate - 60 * DAY);
  const daysToEnd = Math.ceil((+endDate - +now) / DAY);
  const current = license.netMonthlyCents;
  const feeSched = feeScheduleMonthlyCents ?? current;
  return {
    endDate,
    daysToEnd,
    reminderAt,
    noticeDeadline,
    reminderSent: +now >= +reminderAt,
    windowOpen: +now >= +reminderAt && +now < +endDate,
    pastNoticeDeadline: +now >= +noticeDeadline,
    daysToNotice: Math.ceil((+noticeDeadline - +now) / DAY),
    currentMonthlyCents: current,
    renewMonthlyCents: Math.max(Math.round(current * 1.03), feeSched),
    mtmMonthlyCents: Math.round(current * 1.25),
    renewTermMonths: license.termMonths,
    renewEffective: new Date(+endDate + DAY),
  };
}

/** Effective monthly once a choice takes effect (next term / MTM). */
export function effectiveMonthlyCents(info: RenewalInfo, choice: RenewalChoice): number {
  if (choice === "mtm") return info.mtmMonthlyCents;
  if (choice === "renew" || choice === "auto") return info.renewMonthlyCents;
  return info.currentMonthlyCents;
}

/* ── persistence (per browser; prototype stand-in for the tenant record) ── */
const KEY = "wg_renewal_choice";

export function loadRenewalChoice(): RenewalChoice {
  if (typeof window === "undefined") return "pending";
  try {
    const v = window.localStorage.getItem(KEY) as RenewalChoice | null;
    return v && ["pending", "renew", "auto", "mtm"].includes(v) ? v : "pending";
  } catch {
    return "pending";
  }
}

export function saveRenewalChoice(c: RenewalChoice) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, c);
    window.dispatchEvent(new CustomEvent("wg-renewal", { detail: c }));
  } catch {
    /* ignore */
  }
  // PRODUCTION: persist on the tenant record AND adjust Stripe — see below.
  applyRenewalToStripe(c);
}

/**
 * Stripe adjustment hook. In the static prototype this is a no-op stub; the new
 * monthly is reflected in the portal UI immediately. In production this updates
 * the subscription at the renewal effective date:
 *   - renew/auto → subscription item price = renewMonthly (new term schedule)
 *   - mtm        → price = mtmMonthly, cancel_at removed (month-to-month)
 *   - non-renew  → subscription set to cancel at period end
 * e.g. stripe.subscriptions.update(subId, { items: [{ id, price: newPriceId }],
 *      proration_behavior: "none", billing_cycle_anchor: renewEffective }).
 */
export function applyRenewalToStripe(_choice: RenewalChoice) {
  /* no-op in prototype */
}

export const choiceLabel: Record<Exclude<RenewalChoice, "pending">, string> = {
  renew: "Renewed for a new term",
  auto: "Auto-renewal enabled",
  mtm: "Switched to month-to-month",
};
