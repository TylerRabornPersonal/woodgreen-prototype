/**
 * Data-access layer. Default source is the static inventory so the prototype
 * runs with zero setup. Set DATA_SOURCE=db to read from Postgres (Supabase)
 * via Drizzle. Both branches return the same shapes the UI expects.
 *
 * Money note: the DB stores rate as integer CENTS; the app/engine works in
 * whole DOLLARS, so we divide by 100 on the way out.
 */

import { FLOORS, OFFICES, ADD_ONS, type Floor, type Office, type AddOn } from "./inventory";

const SOURCE = process.env.DATA_SOURCE ?? "static";

/* --- row → app-shape mappers (DB mode) --- */

type FloorRow = {
  slug: string;
  building: "1993" | "2001";
  level: number;
  label: string;
  short: string | null;
  isPremium: boolean;
};
type OfficeRow = {
  slug: string;
  code: string;
  name: string | null;
  sqft: number;
  baseUnfurnishedRateCents: number;
  hasWindows: boolean;
  status: string;
  floorSlug: string;
  floorIsPremium: boolean;
};
type AddOnRow = {
  code: string;
  name: string;
  category: AddOn["category"];
  sqft: number | null;
  flatRateCents: number;
};

const mapFloor = (r: FloorRow): Floor => ({
  id: r.slug,
  building: r.building,
  level: r.level,
  label: r.label,
  short: r.short ?? `${r.building} · ${r.level === 1 ? "Main" : "2nd"}`,
  premium: r.isPremium,
});

const mapOffice = (r: OfficeRow): Office => ({
  slug: r.slug,
  code: r.code,
  name: r.name,
  sqft: r.sqft,
  rate: r.baseUnfurnishedRateCents / 100,
  windows: r.hasWindows,
  premium: r.floorIsPremium,
  taken: r.status !== "available",
  floorId: r.floorSlug,
});

const mapAddOn = (r: AddOnRow): AddOn => ({
  slug: r.code.toLowerCase(),
  code: r.code,
  name: r.name,
  category: r.category,
  sqft: r.sqft ?? 0,
  rate: r.flatRateCents / 100,
});

/* --- public API --- */

export async function getFloors(): Promise<Floor[]> {
  if (SOURCE === "db") {
    const { db, schema } = await import("@/db/client");
    const { asc } = await import("drizzle-orm");
    const rows = await db
      .select()
      .from(schema.floors)
      .orderBy(asc(schema.floors.building), asc(schema.floors.level));
    return rows.map((r) => mapFloor(r as unknown as FloorRow));
  }
  return FLOORS;
}

export async function getOfficesByFloor(floorId: string): Promise<Office[]> {
  if (SOURCE === "db") {
    const { db, schema } = await import("@/db/client");
    const { eq } = await import("drizzle-orm");
    const rows = await db
      .select({
        slug: schema.offices.slug,
        code: schema.offices.code,
        name: schema.offices.name,
        sqft: schema.offices.sqft,
        baseUnfurnishedRateCents: schema.offices.baseUnfurnishedRateCents,
        hasWindows: schema.offices.hasWindows,
        status: schema.offices.status,
        floorSlug: schema.floors.slug,
        floorIsPremium: schema.floors.isPremium,
      })
      .from(schema.offices)
      .innerJoin(schema.floors, eq(schema.offices.floorId, schema.floors.id))
      .where(eq(schema.floors.slug, floorId))
      .orderBy(schema.offices.code);
    return rows.map((r) => mapOffice(r as unknown as OfficeRow));
  }
  return OFFICES.filter((o) => o.floorId === floorId);
}

export async function getOfficeBySlug(slug: string): Promise<Office | undefined> {
  if (SOURCE === "db") {
    const { db, schema } = await import("@/db/client");
    const { eq } = await import("drizzle-orm");
    const [row] = await db
      .select({
        slug: schema.offices.slug,
        code: schema.offices.code,
        name: schema.offices.name,
        sqft: schema.offices.sqft,
        baseUnfurnishedRateCents: schema.offices.baseUnfurnishedRateCents,
        hasWindows: schema.offices.hasWindows,
        status: schema.offices.status,
        floorSlug: schema.floors.slug,
        floorIsPremium: schema.floors.isPremium,
      })
      .from(schema.offices)
      .innerJoin(schema.floors, eq(schema.offices.floorId, schema.floors.id))
      .where(eq(schema.offices.slug, slug))
      .limit(1);
    return row ? mapOffice(row as unknown as OfficeRow) : undefined;
  }
  return OFFICES.find((o) => o.slug === slug);
}

export async function getAddOns(): Promise<AddOn[]> {
  if (SOURCE === "db") {
    const { db, schema } = await import("@/db/client");
    const rows = await db.select().from(schema.addOns).orderBy(schema.addOns.code);
    return rows.map((r) => mapAddOn(r as unknown as AddOnRow));
  }
  return ADD_ONS;
}

export { type Floor, type Office, type AddOn };
