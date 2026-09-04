import "dotenv/config";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "../src/server/db/client";

async function main() {
  await pool.query("CREATE EXTENSION IF NOT EXISTS vector");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("migrations applied");
  await pool.end();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
