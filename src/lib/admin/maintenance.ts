/**
 * Maintenance & repair requests — shared between the tenant portal (submit an
 * issue) and the operator console (triage → work order → complete). Seeded with
 * sample work orders; tenant submissions and operator edits persist to
 * localStorage and sync across both surfaces (like the conference store).
 *
 * PRODUCTION: a `maintenance_requests` table + Storage for photos, linked to the
 * space/unit and tenant; status changes write an audit trail; costs feed the
 * accounting module.
 */

export type MaintStatus = "new" | "scheduled" | "in_progress" | "completed";
export type MaintPriority = "low" | "normal" | "high" | "urgent";
export type MaintCategory =
  | "HVAC"
  | "Plumbing"
  | "Electrical"
  | "Door / Lock"
  | "Janitorial"
  | "IT / Network"
  | "General"
  | "Other";

export const MAINT_CATEGORIES: MaintCategory[] = ["HVAC", "Plumbing", "Electrical", "Door / Lock", "Janitorial", "IT / Network", "General", "Other"];
export const MAINT_STATUSES: MaintStatus[] = ["new", "scheduled", "in_progress", "completed"];
export const MAINT_PRIORITIES: MaintPriority[] = ["low", "normal", "high", "urgent"];

export const STATUS_LABEL: Record<MaintStatus, string> = {
  new: "New",
  scheduled: "Scheduled",
  in_progress: "In progress",
  completed: "Completed",
};

export type MaintRequest = {
  id: string;
  title: string;
  category: MaintCategory;
  location: string; // office code or "Common area" / "Exterior" / "Building"
  unitSlug?: string;
  priority: MaintPriority;
  status: MaintStatus;
  requester: string; // tenant org or "Operator"
  description: string;
  vendor?: string;
  costCents?: number;
  createdISO: string;
  updatedISO: string;
  completedISO?: string;
};

const SEED: MaintRequest[] = [
  { id: "mr_seed_1", title: "HVAC not cooling — B-wing offices", category: "HVAC", location: "2001 · B-wing", priority: "high", status: "in_progress", requester: "Delta Engineering", description: "Tenants report warm air from vents since Monday.", vendor: "Mize Mechanical", createdISO: "2026-06-21", updatedISO: "2026-06-22" },
  { id: "mr_seed_2", title: "Leaking faucet in shared break room", category: "Plumbing", location: "Common area", priority: "normal", status: "new", requester: "Magnolia Wealth", description: "Slow drip at the kitchenette sink.", createdISO: "2026-06-23", updatedISO: "2026-06-23" },
  { id: "mr_seed_3", title: "Front-door badge reader offline", category: "Door / Lock", location: "1993 · Entry", priority: "urgent", status: "scheduled", requester: "Operator", description: "Main entrance reader not accepting fobs; propped during business hours.", vendor: "SecureAccess MS", createdISO: "2026-06-22", updatedISO: "2026-06-23" },
  { id: "mr_seed_4", title: "Flickering lights in O3", category: "Electrical", location: "O3", unitSlug: "1993-main-o3", priority: "normal", status: "completed", requester: "Reservoir Realty", description: "Two overhead fixtures flickering.", vendor: "Bolt Electric", costCents: 24000, createdISO: "2026-06-12", updatedISO: "2026-06-16", completedISO: "2026-06-16" },
  { id: "mr_seed_5", title: "Carpet cleaning — O1", category: "Janitorial", location: "O1", unitSlug: "1993-main-o1", priority: "low", status: "completed", requester: "Caldwell & Associates", description: "Coffee stain, requested spot clean.", vendor: "Tidy Co.", costCents: 12000, createdISO: "2026-06-06", updatedISO: "2026-06-09", completedISO: "2026-06-09" },
  { id: "mr_seed_6", title: "Slow internet — 2001 main floor", category: "IT / Network", location: "2001 · Main", priority: "high", status: "in_progress", requester: "Stennis & Vaughn LLP", description: "Intermittent drops on the shared circuit; ISP ticket open.", vendor: "C Spire", createdISO: "2026-06-20", updatedISO: "2026-06-22" },
  { id: "mr_seed_7", title: "Restroom partition loose", category: "General", location: "Common area", priority: "low", status: "scheduled", requester: "Operator", description: "Stall partition needs re-anchoring.", vendor: "Handyman Joe", createdISO: "2026-06-17", updatedISO: "2026-06-19" },
  { id: "mr_seed_8", title: "Annual water-heater inspection", category: "Plumbing", location: "Building", priority: "normal", status: "completed", requester: "Operator", description: "Routine preventive inspection.", vendor: "Mize Mechanical", costCents: 18500, createdISO: "2026-06-02", updatedISO: "2026-06-04", completedISO: "2026-06-04" },
  { id: "mr_seed_9", title: "Parking-lot light out", category: "Electrical", location: "Exterior", priority: "normal", status: "new", requester: "Operator", description: "Pole light near the side entrance is dark.", createdISO: "2026-06-22", updatedISO: "2026-06-22" },
];

const KEY = "wg_maintenance";
const today = () => new Date().toISOString().slice(0, 10);

function read(): MaintRequest[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MaintRequest[]) : null;
  } catch {
    return null;
  }
}

export function loadMaintenance(): MaintRequest[] {
  return read() ?? SEED.map((r) => ({ ...r }));
}

export function saveMaintenance(list: MaintRequest[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("wg-maintenance"));
  } catch {
    /* ignore */
  }
}

let n = 0;
export function addRequest(input: Omit<MaintRequest, "id" | "status" | "createdISO" | "updatedISO">): MaintRequest[] {
  const list = loadMaintenance();
  const rec: MaintRequest = { ...input, id: `mr_${Date.now()}_${n++}`, status: "new", createdISO: today(), updatedISO: today() };
  const next = [rec, ...list];
  saveMaintenance(next);
  return next;
}

export function updateRequest(id: string, patch: Partial<MaintRequest>): MaintRequest[] {
  const next = loadMaintenance().map((r) => {
    if (r.id !== id) return r;
    const merged = { ...r, ...patch, updatedISO: today() };
    if (patch.status === "completed" && !merged.completedISO) merged.completedISO = today();
    if (patch.status && patch.status !== "completed") merged.completedISO = undefined;
    return merged;
  });
  saveMaintenance(next);
  return next;
}

export type MaintStats = {
  open: number;
  openUrgent: number;
  inProgress: number;
  scheduled: number;
  completed: number;
  spendCents: number; // sum of completed work-order costs
};

export function maintStats(list: MaintRequest[]): MaintStats {
  const openList = list.filter((r) => r.status !== "completed");
  return {
    open: openList.length,
    openUrgent: openList.filter((r) => r.priority === "urgent").length,
    inProgress: list.filter((r) => r.status === "in_progress").length,
    scheduled: list.filter((r) => r.status === "scheduled").length,
    completed: list.filter((r) => r.status === "completed").length,
    spendCents: list.filter((r) => r.status === "completed").reduce((s, r) => s + (r.costCents ?? 0), 0),
  };
}
