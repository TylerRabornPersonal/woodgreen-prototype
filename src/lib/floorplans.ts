/**
 * Traced 2D floor plans — hand-traced from the real reconfigured CAD drawings.
 * Keyed by `floorId` (see inventory FLOORS). When a plan exists for a floor,
 * <FloorPlan> renders the traced geometry; otherwise it falls back to the
 * schematic placeholder grid.
 *
 * Coordinates live in the plan's own viewBox space. Office rects are keyed by
 * the office `code` (O1..O9) so they bind to live inventory/pricing. `fixed`
 * blocks are display-only context (e.g. the shared conference room) and are not
 * selectable.
 */

export type Rect = { x: number; y: number; w: number; h: number };

export type FixedBlock = Rect & {
  label: string;
  sub?: string;
  kind: "conference" | "amenity";
};

export type TracedPlan = {
  /** viewBox width/height */
  vb: [number, number];
  /** solid floor fill (everything that isn't a leasable office) */
  fill: string; // polygon points
  /** exterior + interior wall runs, each a polyline points string */
  walls: string[];
  /** office rects keyed by inventory code */
  rooms: Record<string, Rect>;
  /** display-only labelled blocks (not selectable) */
  fixed: FixedBlock[];
};

export const TRACED_PLANS: Record<string, TracedPlan> = {
  "1993-main": {
    vb: [1027, 705],
    fill: "70,104 993,104 993,653 805.6,653 805.6,689 257.4,689 257.4,653 70,653",
    walls: [
      "70,104 70,653",
      "70,104 993,104",
      "993,104 993,653",
      "70,653 257.4,653 257.4,689 805.6,689 805.6,653 993,653",
    ],
    rooms: {
      O9: { x: 70, y: 104, w: 173, h: 203 },
      O3: { x: 248, y: 104, w: 151, h: 222 },
      O1: { x: 630, y: 104, w: 179, h: 181 },
      O2: { x: 814, y: 104, w: 179, h: 181 },
      O8: { x: 70, y: 312, w: 119, h: 151 },
      O7: { x: 70, y: 518, w: 185, h: 135 },
      O6: { x: 260, y: 518, w: 125, h: 171 },
      O5: { x: 666, y: 518, w: 137, h: 171 },
      O4: { x: 808, y: 518, w: 185, h: 135 },
    },
    fixed: [
      {
        x: 630,
        y: 290,
        w: 363,
        h: 173,
        label: "CONFERENCE",
        sub: "shared · ~450 SF",
        kind: "conference",
      },
    ],
  },
};

export function tracedPlanFor(floorId?: string): TracedPlan | undefined {
  return floorId ? TRACED_PLANS[floorId] : undefined;
}
