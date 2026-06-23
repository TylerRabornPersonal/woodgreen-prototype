/**
 * ============================================================================
 * 25 Woodgreen Place — Inventory + Engine Config Seed
 * ----------------------------------------------------------------------------
 * Loads the ACTUAL office inventory and pricing-engine constants from the
 * build-your-own calculator (woodgreen-pricing-calculator.html) into the
 * Drizzle schema (woodgreen-platform-schema.ts).
 *
 * Counts: 4 floors · 44 offices · 6 add-ons.
 *
 * Run:  npx tsx woodgreen-seed.ts        (expects DATABASE_URL env var)
 *
 * Rates below are the calculator's RAW unfurnished base values (o[2]) in
 * DOLLARS — converted to cents on insert. List/furnished/rounding are applied
 * by the engine at quote time, not stored here.
 * ============================================================================
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  floors,
  offices,
  addOns,
  pricingConfig,
  termOptions,
  confHourTiers,
} from "./schema";

/* ---------------------------------------------------------------------------
 * INVENTORY DATA  (verbatim from the calculator OFFICES / ADDONS arrays)
 * office tuple: [code, name|null, sqft, baseUnfurnishedRate$, hasWindows]
 * -------------------------------------------------------------------------*/

type Office = {
  code: string;
  name: string | null;
  sqft: number;
  rate: number; // dollars, unfurnished base (o[2])
  windows?: boolean;
};

type FloorSeed = {
  building: "1993" | "2001";
  level: number;
  label: string;
  isPremium: boolean;
  offices: Office[];
};

const FLOORS: FloorSeed[] = [
  {
    building: "1993",
    level: 1,
    label: "1993 Building — Main Floor",
    isPremium: false,
    offices: [
      { code: "O1", name: "windows", sqft: 220, rate: 850, windows: true },
      { code: "O2", name: "windows", sqft: 220, rate: 850, windows: true },
      { code: "O3", name: null, sqft: 231, rate: 800 },
      { code: "O4", name: null, sqft: 173, rate: 725 },
      { code: "O5", name: null, sqft: 163, rate: 675 },
      { code: "O6", name: null, sqft: 148, rate: 625 },
      { code: "O7", name: null, sqft: 173, rate: 725 },
      { code: "O8", name: null, sqft: 125, rate: 525 },
      { code: "O9", name: null, sqft: 204, rate: 775 },
    ],
  },
  {
    building: "1993",
    level: 2,
    label: "1993 Building — Second Floor",
    isPremium: false,
    offices: [
      { code: "O1", name: "connecting", sqft: 149, rate: 625 },
      { code: "O2", name: null, sqft: 260, rate: 900 },
      { code: "O3", name: "R.side", sqft: 206, rate: 775 },
      { code: "O4", name: null, sqft: 278, rate: 925 },
      { code: "O5", name: "L.side", sqft: 207, rate: 775 },
      { code: "O6", name: null, sqft: 147, rate: 625 },
      { code: "O7", name: null, sqft: 210, rate: 800 },
      { code: "O8", name: null, sqft: 215, rate: 800 },
    ],
  },
  {
    building: "2001",
    level: 1,
    label: "2001 Building — Main Floor",
    isPremium: false,
    offices: [
      { code: "P1", name: null, sqft: 222, rate: 850 },
      { code: "P2", name: null, sqft: 171, rate: 725 },
      { code: "P3", name: null, sqft: 198, rate: 750 },
      { code: "P4", name: null, sqft: 182, rate: 750 },
      { code: "P5", name: null, sqft: 188, rate: 775 },
      { code: "P6", name: null, sqft: 229, rate: 850 },
      { code: "P7", name: null, sqft: 199, rate: 750 },
      { code: "P8", name: null, sqft: 156, rate: 725 },
      { code: "P9", name: null, sqft: 162, rate: 675 },
      { code: "B1", name: null, sqft: 297, rate: 1025 },
      { code: "B2", name: null, sqft: 240, rate: 775 },
      { code: "B3", name: null, sqft: 210, rate: 800 },
      { code: "B4", name: null, sqft: 172, rate: 675 },
      { code: "B5", name: null, sqft: 160, rate: 625 },
      { code: "B6", name: null, sqft: 203, rate: 775 },
      { code: "B7", name: null, sqft: 175, rate: 675 },
      { code: "B8", name: null, sqft: 230, rate: 875 },
      { code: "I1", name: "copy", sqft: 151, rate: 650 },
    ],
  },
  {
    building: "2001",
    level: 2,
    label: "2001 Building — Second Floor",
    isPremium: true,
    offices: [
      { code: "A", name: null, sqft: 390, rate: 1225 },
      { code: "B", name: null, sqft: 390, rate: 1225 },
      { code: "C", name: null, sqft: 289, rate: 1000 },
      { code: "D", name: null, sqft: 245, rate: 850 },
      { code: "E", name: null, sqft: 315, rate: 1000 },
      { code: "F", name: null, sqft: 299, rate: 1025 },
      { code: "G", name: null, sqft: 306, rate: 925 },
      { code: "H", name: null, sqft: 256, rate: 875 },
      { code: "I", name: null, sqft: 256, rate: 875 },
    ],
  },
];

// Add-ons: flat-priced, excluded from multi-office discount tally.
const ADD_ONS: {
  code: string;
  name: string;
  category: "conference" | "storage" | "server" | "specialty";
  building: "1993" | "2001" | null;
  sqft: number;
  rate: number;
}[] = [
  { code: "CONF-254", name: "Dedicated Conference · 254 SF", category: "conference", building: null, sqft: 254, rate: 850 },
  { code: "FILE-FP", name: "Fireproof Filing (storage)", category: "storage", building: null, sqft: 144, rate: 300 },
  { code: "SERVER-IT", name: "Server / IT room", category: "server", building: null, sqft: 250, rate: 525 },
  { code: "STORAGE-A", name: "Storage A", category: "storage", building: null, sqft: 450, rate: 625 },
  { code: "STORAGE-B", name: "Storage B", category: "storage", building: null, sqft: 600, rate: 750 },
  { code: "FLEX", name: "Specialty / Flex", category: "specialty", building: null, sqft: 700, rate: 1125 },
];

const d2c = (dollars: number) => Math.round(dollars * 100); // dollars → cents

/* ---------------------------------------------------------------------------
 * SEED
 * -------------------------------------------------------------------------*/

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log("Seeding 25 Woodgreen inventory + engine config…");

  // --- engine config (from calculator constants) ---
  await db.insert(pricingConfig).values({
    listMult: "1.1000",
    furnishedMult: "1.2000",
    roundIncrementCents: 2500,
    multiOfficePerOffice: "0.0100",
    multiOfficeCap: "0.1000",
    confOverageStdCents: 2500,
    confOverageBoardroomCents: 3500,
    isActive: true,
  });

  await db.insert(termOptions).values([
    { months: 12, discount: "0.0000", label: "12 months" },
    { months: 18, discount: "0.0150", label: "18 months" },
    { months: 24, discount: "0.0300", label: "24 months" },
    { months: 30, discount: "0.0450", label: "30 months" },
    { months: 36, discount: "0.0600", label: "36 months" },
  ]);

  // conf-hour tiers: priceCents >= threshold → hours (highest first)
  await db.insert(confHourTiers).values([
    { minPriceCents: 75000, hoursPerMonth: 16 },
    { minPriceCents: 60000, hoursPerMonth: 12 },
    { minPriceCents: 47500, hoursPerMonth: 8 },
    { minPriceCents: 0, hoursPerMonth: 6 },
  ]);

  // --- inventory ---
  let officeCount = 0;
  for (const f of FLOORS) {
    const floorSlug = `${f.building}-${f.level === 1 ? "main" : "second"}`;
    const short = `${f.building} · ${f.level === 1 ? "Main" : "2nd"}${f.isPremium ? " (Premium)" : ""}`;
    const [floorRow] = await db
      .insert(floors)
      .values({
        slug: floorSlug,
        building: f.building,
        level: f.level,
        label: f.label,
        short,
        isPremium: f.isPremium,
      })
      .returning();

    await db.insert(offices).values(
      f.offices.map((o) => ({
        slug: `${floorSlug}-${o.code.toLowerCase()}`,
        floorId: floorRow.id,
        code: o.code,
        name: o.name,
        sqft: o.sqft,
        baseUnfurnishedRateCents: d2c(o.rate),
        isFurnishable: true,
        hasWindows: !!o.windows,
        status: "available" as const,
      })),
    );
    officeCount += f.offices.length;
  }

  await db.insert(addOns).values(
    ADD_ONS.map((a) => ({
      building: a.building ?? undefined,
      code: a.code,
      name: a.name,
      category: a.category,
      sqft: a.sqft,
      flatRateCents: d2c(a.rate),
      countsTowardMultiOffice: false,
      status: "available" as const,
    })),
  );

  console.log(
    `Seeded ${FLOORS.length} floors · ${officeCount} offices · ${ADD_ONS.length} add-ons.`,
  );
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
