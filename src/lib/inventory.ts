/**
 * Static inventory — the actual 25 Woodgreen rooms (verbatim from the
 * calculator OFFICES / ADDONS arrays). Mirrors the Drizzle seed. Each office
 * has a stable `slug` used for routing (codes repeat across floors).
 *
 * `rate` = raw unfurnished base ($/mo, the calculator's o[2]); the engine
 * applies list mult / furnishing / rounding.
 */

export type Office = {
  slug: string;
  code: string;
  name: string | null;
  sqft: number;
  rate: number;
  windows: boolean;
  premium: boolean;
  taken: boolean; // prototype: a couple shown as occupied
  floorId: string;
};

export type Floor = {
  id: string;
  building: "1993" | "2001";
  level: number;
  label: string;
  short: string;
  premium: boolean;
};

export type AddOn = {
  slug: string;
  code: string;
  name: string;
  category: "conference" | "storage" | "server" | "specialty";
  sqft: number;
  rate: number;
};

export const FLOORS: Floor[] = [
  { id: "1993-main", building: "1993", level: 1, label: "1993 Building ·Main Floor", short: "1993 · Main", premium: false },
  { id: "1993-second", building: "1993", level: 2, label: "1993 Building ·Second Floor", short: "1993 · 2nd", premium: false },
  { id: "2001-main", building: "2001", level: 1, label: "2001 Building ·Main Floor", short: "2001 · Main", premium: false },
  { id: "2001-second", building: "2001", level: 2, label: "2001 Building ·Second Floor", short: "2001 · 2nd (Premium)", premium: true },
  { id: "2001-basement", building: "2001", level: 0, label: "2001 Building ·Basement (Storage)", short: "2001 · Basement", premium: false },
];

type Raw = [code: string, name: string | null, sqft: number, rate: number, windows?: boolean];

const RAW: Record<string, Raw[]> = {
  "1993-main": [
    ["O1", "windows", 220, 850, true], ["O2", "windows", 220, 850, true], ["O3", null, 231, 800],
    ["O4", null, 173, 725], ["O5", null, 163, 675], ["O6", null, 148, 625],
    ["O7", null, 173, 725], ["O8", null, 125, 525], ["O9", null, 204, 775],
    ["FILE", "Fireproof filing · storage", 144, 300],
  ],
  "1993-second": [
    ["O1", "connecting", 149, 625], ["O2", null, 260, 900], ["O3", "R.side", 206, 775],
    ["O4", null, 278, 925], ["O5", "L.side", 207, 775], ["O6", null, 147, 625],
    ["O7", null, 210, 800], ["O8", null, 215, 800],
  ],
  "2001-main": [
    ["P1", null, 222, 850], ["P2", null, 171, 725], ["P3", null, 198, 750], ["P4", null, 182, 750],
    ["P5", null, 188, 775], ["P6", null, 229, 850], ["P7", null, 199, 750], ["P8", null, 156, 725],
    ["P9", null, 162, 675], ["B1", null, 297, 1025], ["B2", null, 240, 775], ["B3", null, 210, 800],
    ["B4", null, 172, 675], ["B5", null, 160, 625], ["B6", null, 203, 775], ["B7", null, 175, 675],
    ["B8", null, 230, 875], ["I1", "copy", 151, 650],
    ["CONF", "Dedicated conference", 254, 850],
  ],
  "2001-basement": [
    ["SVR", "Server / IT", 377, 525],
    ["FR", "Front-right · storage", 649, 1125],
    ["FL", "Front-left · storage", 619, 750],
    ["LCK", "Locked · storage", 207, 625],
  ],
  "2001-second": [
    ["A", null, 390, 1225], ["B", null, 390, 1225], ["C", null, 289, 1000], ["D", null, 245, 850],
    ["E", null, 315, 1000], ["F", null, 299, 1025], ["G", null, 306, 925], ["H", null, 256, 875],
    ["I", null, 256, 875],
  ],
};

// A few rooms marked occupied to make the plan feel live.
const TAKEN = new Set(["2001-main-p4", "1993-second-o6", "2001-second-d"]);

export const OFFICES: Office[] = FLOORS.flatMap((f) =>
  RAW[f.id].map(([code, name, sqft, rate, windows]) => {
    const slug = `${f.id}-${code.toLowerCase()}`;
    return {
      slug,
      code,
      name,
      sqft,
      rate,
      windows: !!windows,
      premium: f.premium,
      taken: TAKEN.has(slug),
      floorId: f.id,
    };
  }),
);

// Add-ons were promoted to selectable rooms on the floor plans (2026-06-24):
// conference → 2001-main "CONF"; fireproof filing → 1993-main "FILE"; the four
// storage units → the 2001-basement floor. Empty array keeps the type/UI intact.
export const ADD_ONS: AddOn[] = [];
