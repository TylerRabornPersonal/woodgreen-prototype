/**
 * Drizzle client. Only used when DATA_SOURCE=db. The prototype runs on static
 * inventory by default, so importing this without a DATABASE_URL is harmless
 * until a query actually runs.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { schema });
export { schema };
