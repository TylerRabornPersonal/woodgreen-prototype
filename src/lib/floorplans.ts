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

export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
  /** optional polygon points for non-rectangular (L-shaped) rooms; x/y/w/h is the bounding box used for label placement */
  points?: string;
};

export type FixedBlock = Rect & {
  label: string;
  sub?: string;
  kind: "conference" | "amenity";
};

export type TracedPlan = {
  /** full SVG viewBox string "minX minY width height" (lets each floor crop tight) */
  vb: string;
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
    vb: "60 94 945 605",
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

  // 1993 Building · Second Floor — remodel (long back office split into two).
  // Office numbers in the drawing map 1:1 to inventory codes O1–O8.
  "1993-second": {
    vb: "55 90 935 480",
    fill:
      "256,104 785,104 785,270.5 970,270.5 970,378 785,378 785,550 256,550 256,378 70,378 70,270.5 256,270.5",
    walls: [
      "256,104 785,104 785,270.5 970,270.5 970,378 785,378 785,550 256,550 256,378 70,378 70,270.5 256,270.5 256,104",
    ],
    rooms: {
      O1: { x: 439, y: 104, w: 175, h: 129 }, // connecting
      O2: { x: 614, y: 104, w: 171, h: 219 },
      O4: { x: 256, y: 104, w: 183, h: 219 },
      O5: { x: 70, y: 270.5, w: 186, h: 160 }, // L. side
      O3: { x: 785, y: 270.5, w: 185, h: 160 }, // R. side
      O6: { x: 256, y: 378, w: 123, h: 172 },
      O7: { x: 434, y: 378, w: 175, h: 172 }, // split / new
      O8: { x: 609, y: 378, w: 176, h: 172 }, // split / new
    },
    fixed: [],
  },

  // 2001 Building · Main Floor — current (offices on the real appraisal footprint).
  // Breezeway and the 1993 wing are excluded. Offices map 1:1 to inventory codes
  // P1–P9, B1–B8, I1 (SF verified against inventory). Conf = 254 SF dedicated
  // conference (display-only). Source: 2001-floorplan-filled.html (viewBox 1097×582).
  "2001-main": {
    vb: "486 110 512 302",
    fill:
      "496,287.7 496,143.7 608.1,143.7 608.1,120 874.7,120 874.7,143.7 988,143.7 988,386.2 875.8,386.2 875.8,403.8 776.5,403.8 776.5,387 708.1,387 708.1,403.8 608.1,403.8 608.1,386.2 495.3,386.2 495.3,287.7",
    walls: [
      "496,287.7 496,143.7 608.1,143.7 608.1,120 874.7,120 874.7,143.7 988,143.7 988,386.2 875.8,386.2 875.8,403.8 776.5,403.8 776.5,387 708.1,387 708.1,403.8 608.1,403.8 608.1,386.2 495.3,386.2 495.3,287.7 496,287.7",
    ],
    rooms: {
      // back row
      B1: { x: 496.0, y: 143.7, w: 84.2, h: 65.2 },
      B2: {
        x: 580.2, y: 120.0, w: 49.5, h: 89.6,
        points: "580.2,143.7 608.1,143.7 608.1,120 629.7,120 629.7,209.6 580.2,209.6",
      },
      B3: { x: 657.6, y: 120.0, w: 59.5, h: 65.2 },
      B4: { x: 717.1, y: 120.0, w: 48.8, h: 65.2 },
      B5: { x: 765.9, y: 120.0, w: 45.2, h: 65.6 },
      B6: { x: 811.1, y: 120.0, w: 57.3, h: 65.6 },
      B7: { x: 868.4, y: 143.7, w: 49.8, h: 64.9 },
      B8: { x: 922.4, y: 143.7, w: 65.6, h: 64.9 },
      // interior
      I1: { x: 496.0, y: 208.9, w: 53.0, h: 52.7 },
      // front row
      P9: { x: 495.3, y: 322.8, w: 46.9, h: 63.4 },
      P8: { x: 542.2, y: 322.8, w: 45.5, h: 63.4 },
      P7: {
        x: 587.7, y: 322.8, w: 45.5, h: 81.0,
        points: "587.7,322.8 633.2,322.8 633.2,403.8 608.1,403.8 608.1,386.2 587.7,386.2",
      },
      P6: { x: 652.5, y: 322.8, w: 51.0, h: 81.0 },
      P5: { x: 703.5, y: 322.8, w: 51.9, h: 63.4 },
      P4: { x: 776.5, y: 322.8, w: 40.1, h: 81.0 },
      P3: { x: 816.6, y: 322.8, w: 45.5, h: 81.0 },
      P2: { x: 875.8, y: 322.8, w: 49.8, h: 63.4 },
      P1: { x: 925.6, y: 322.8, w: 62.4, h: 63.4 },
    },
    fixed: [
      { x: 940.7, y: 208.6, w: 47.3, h: 99.3, label: "CONF", sub: "254 SF", kind: "conference" },
    ],
  },

  // 2001 Building · Second Floor — renovation (loft buildout). Offices A–I map to
  // inventory codes/SF; conference is display-only. Reconstructed to match Tyler's
  // approved A–I layout (the editor's saved geometry differed).
  "2001-second": {
    vb: "20 65 965 440",
    fill: "245,75 750,75 750,252 970,252 970,492 32,492 32,252 245,252",
    walls: ["245,75 750,75 750,252 970,252 970,492 32,492 32,252 245,252 245,75"],
    rooms: {
      A: { x: 245, y: 75, w: 148, h: 170 },
      B: { x: 593, y: 75, w: 157, h: 170 },
      C: { x: 32, y: 252, w: 133, h: 143 },
      D: { x: 169, y: 252, w: 114, h: 143 },
      F: { x: 600, y: 300, w: 114, h: 180 },
      G: { x: 720, y: 300, w: 130, h: 134 },
      E: { x: 855, y: 300, w: 115, h: 134 },
      I: { x: 332, y: 345, w: 138, h: 135 },
      H: { x: 474, y: 345, w: 108, h: 135 },
    },
    fixed: [
      { x: 397, y: 75, w: 192, h: 140, label: "CONFERENCE", sub: "shared · ~373 SF", kind: "conference" },
    ],
  },
};

export function tracedPlanFor(floorId?: string): TracedPlan | undefined {
  return floorId ? TRACED_PLANS[floorId] : undefined;
}
