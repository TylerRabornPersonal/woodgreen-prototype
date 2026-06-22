/**
 * Data-access layer. Default source is the static inventory so the prototype
 * runs with zero setup. Set DATA_SOURCE=db to query Drizzle/Postgres instead
 * (see the commented implementations — they return the same shapes).
 */

import { FLOORS, OFFICES, ADD_ONS, type Floor, type Office, type AddOn } from "./inventory";

const SOURCE = process.env.DATA_SOURCE ?? "static";

export async function getFloors(): Promise<Floor[]> {
  if (SOURCE === "db") {
    // const rows = await db.select().from(floors).orderBy(floors.building, floors.level);
    // return rows.map(mapFloor);
  }
  return FLOORS;
}

export async function getOfficesByFloor(floorId: string): Promise<Office[]> {
  if (SOURCE === "db") {
    // return (await db.select().from(offices).where(eq(offices.floorId, floorId))).map(mapOffice);
  }
  return OFFICES.filter((o) => o.floorId === floorId);
}

export async function getOfficeBySlug(slug: string): Promise<Office | undefined> {
  if (SOURCE === "db") {
    // return mapOffice(await db.query.offices.findFirst({ where: eq(offices.slug, slug) }));
  }
  return OFFICES.find((o) => o.slug === slug);
}

export async function getAddOns(): Promise<AddOn[]> {
  if (SOURCE === "db") {
    // return (await db.select().from(addOns)).map(mapAddOn);
  }
  return ADD_ONS;
}

export { type Floor, type Office, type AddOn };
