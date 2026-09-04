import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __lfsPool: Pool | undefined;
}

export function databaseUrl(): string {
  if (process.env.NODE_ENV === "test" && process.env.DATABASE_URL_TEST) {
    return process.env.DATABASE_URL_TEST;
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return url;
}

function createPool(): Pool {
  return new Pool({ connectionString: databaseUrl(), max: 10 });
}

export const pool: Pool = globalThis.__lfsPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalThis.__lfsPool = pool;

export const db = drizzle(pool, { schema });
export type Db = typeof db;
export { schema };
