/**
 * Demo occupancy presets. Lets the floor-plan tool show the building at a few
 * fixed occupancy levels (for sales demos / screenshots) without touching the
 * real inventory. "live" = the actual inventory `taken` flags; a percentage
 * deterministically marks ~that share of offices occupied, spread evenly across
 * the (slug-sorted) inventory so each floor reads roughly the same level.
 */
import type { Office } from "./inventory";

export type Occupancy = "live" | 0 | 25 | 50 | 75;

export const OCCUPANCY_PRESETS: Occupancy[] = ["live", 0, 25, 50, 75];

export function occupancyLabel(o: Occupancy): string {
  return o === "live" ? "Live" : `${o}%`;
}

/** Returns a new officesByFloor map with `taken` overridden to match the preset. */
export function applyOccupancy(
  officesByFloor: Record<string, Office[]>,
  occ: Occupancy,
): Record<string, Office[]> {
  if (occ === "live") return officesByFloor; // use real inventory taken flags

  const f = occ / 100;
  const all = Object.values(officesByFloor)
    .flat()
    .slice()
    .sort((a, b) => a.slug.localeCompare(b.slug));

  const taken = new Set<string>();
  // even spread: office i is taken when the running count of taken slots ticks up
  all.forEach((o, i) => {
    if (Math.floor((i + 1) * f) > Math.floor(i * f)) taken.add(o.slug);
  });

  return Object.fromEntries(
    Object.entries(officesByFloor).map(([k, v]) => [
      k,
      v.map((o) => ({ ...o, taken: taken.has(o.slug) })),
    ]),
  );
}

/** Slugs that would be occupied at the given preset — handy for pruning selections. */
export function occupiedSlugs(
  officesByFloor: Record<string, Office[]>,
  occ: Occupancy,
): Set<string> {
  const view = applyOccupancy(officesByFloor, occ);
  return new Set(
    Object.values(view)
      .flat()
      .filter((o) => o.taken)
      .map((o) => o.slug),
  );
}
