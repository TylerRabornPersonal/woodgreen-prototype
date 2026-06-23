/**
 * Historical (past) tenants for the operator console. Mock records of prior
 * tenancies, referencing real office slugs so the "by office" view can show the
 * full chain of who occupied an office over time. Production: a `tenancies`
 * table with start/end + status.
 */
import { OFFICES } from "@/lib/inventory";
import { floorLabels, tenants as currentTenants } from "@/lib/admin/mock";

export type PastTenant = {
  id: string;
  org: string;
  contact: string;
  email: string;
  phone: string;
  officeSlugs: string[];
  term: number;
  startISO: string; // YYYY-MM
  endISO: string; // YYYY-MM
};

export const PAST_TENANTS: PastTenant[] = [
  { id: "h1", org: "Odell Group", contact: "Ray Odell", email: "ray@odellgroup.com", phone: "(601) 555-0144", officeSlugs: ["2001-main-p1"], term: 12, startISO: "2019-01", endISO: "2020-01" },
  { id: "h2", org: "Beaumont Tax", contact: "Lila Beaumont", email: "lila@beaumonttax.com", phone: "(601) 555-0182", officeSlugs: ["2001-main-p1", "2001-main-p2"], term: 24, startISO: "2021-03", endISO: "2023-03" },
  { id: "h3", org: "Crane Architecture", contact: "Sam Crane", email: "scrane@cranearch.com", phone: "(601) 555-0119", officeSlugs: ["2001-main-b1", "2001-main-b2", "2001-main-b3"], term: 36, startISO: "2020-06", endISO: "2023-06" },
  { id: "h4", org: "Pinnacle Advisors", contact: "Grace Pinnacle", email: "grace@pinnacleadv.com", phone: "(601) 555-0156", officeSlugs: ["2001-second-a", "2001-second-b"], term: 24, startISO: "2022-02", endISO: "2024-02" },
  { id: "h5", org: "Tate Holdings", contact: "Will Tate", email: "will@tateholdings.com", phone: "(601) 555-0167", officeSlugs: ["2001-second-a"], term: 12, startISO: "2024-04", endISO: "2025-04" },
  { id: "h6", org: "Vale Consulting", contact: "Nadia Vale", email: "nadia@valeconsulting.com", phone: "(601) 555-0133", officeSlugs: ["1993-main-o1"], term: 12, startISO: "2023-01", endISO: "2024-01" },
  { id: "h7", org: "Sutter & Pugh", contact: "Joel Pugh", email: "jpugh@sutterpugh.law", phone: "(601) 555-0128", officeSlugs: ["2001-second-c", "2001-second-d"], term: 24, startISO: "2022-05", endISO: "2024-05" },
  { id: "h8", org: "Lowell Media", contact: "Erin Lowell", email: "erin@lowellmedia.co", phone: "(601) 555-0191", officeSlugs: ["2001-main-p4", "2001-main-p5"], term: 18, startISO: "2023-02", endISO: "2024-08" },
  { id: "h9", org: "Hargrove Realty", contact: "Dell Hargrove", email: "dell@hargroverealty.com", phone: "(601) 555-0102", officeSlugs: ["2001-main-b6"], term: 12, startISO: "2022-09", endISO: "2023-09" },
  { id: "h10", org: "Briar CPA", contact: "Anne Briar", email: "anne@briarcpa.com", phone: "(601) 555-0175", officeSlugs: ["1993-main-o3"], term: 24, startISO: "2021-07", endISO: "2023-07" },
  { id: "h11", org: "Marsh & Lane", contact: "Pete Marsh", email: "pete@marshlane.com", phone: "(601) 555-0148", officeSlugs: ["2001-main-p3"], term: 18, startISO: "2020-08", endISO: "2022-02" },
  { id: "h12", org: "Foster Logistics", contact: "Kara Foster", email: "kara@fosterlog.com", phone: "(601) 555-0163", officeSlugs: ["2001-main-b4", "2001-main-b5"], term: 12, startISO: "2022-10", endISO: "2023-10" },
  { id: "h13", org: "Quincy Design", contact: "Theo Quincy", email: "theo@quincydesign.studio", phone: "(601) 555-0188", officeSlugs: ["1993-second-o2"], term: 12, startISO: "2023-03", endISO: "2024-03" },
  { id: "h14", org: "Kingsley Partners", contact: "Mara Kingsley", email: "mara@kingsleypartners.com", phone: "(601) 555-0121", officeSlugs: ["2001-second-e"], term: 12, startISO: "2023-06", endISO: "2024-06" },
];

/* office label lookup */
const officeBySlug = new Map(OFFICES.map((o) => [o.slug, o]));
export function officeLabel(slug: string): string {
  const o = officeBySlug.get(slug);
  if (!o) return slug;
  return `${o.code} · ${floorLabels[o.floorId] ?? ""}`.trim();
}
export const ALL_OFFICE_OPTIONS = OFFICES.map((o) => ({ slug: o.slug, label: officeLabel(o.slug) }));

/* date helpers */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function fmtMonth(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return `${MONTHS[(m || 1) - 1]} ${y}`;
}
export function parseSince(since: string): string {
  // "Apr 2026" -> "2026-04"
  const [mon, y] = since.split(" ");
  const m = MONTHS.indexOf(mon) + 1;
  return `${y}-${String(m || 1).padStart(2, "0")}`;
}

/* unified tenancy timeline for one office (past + current) */
export type Tenancy = {
  org: string;
  contact: string;
  term: number;
  startISO: string;
  endISO: string | null; // null = current
  current: boolean;
};

export function tenancyForOffice(slug: string): Tenancy[] {
  const rows: Tenancy[] = PAST_TENANTS.filter((p) => p.officeSlugs.includes(slug)).map((p) => ({
    org: p.org,
    contact: p.contact,
    term: p.term,
    startISO: p.startISO,
    endISO: p.endISO,
    current: false,
  }));
  for (const t of currentTenants) {
    if (t.offices.some((o) => o.slug === slug)) {
      rows.push({ org: t.org, contact: t.contact, term: t.term, startISO: parseSince(t.since), endISO: null, current: true });
    }
  }
  return rows.sort((a, b) => a.startISO.localeCompare(b.startISO));
}
