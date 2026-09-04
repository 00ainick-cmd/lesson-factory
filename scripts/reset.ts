import "dotenv/config";
import { pool } from "../src/server/db/client";

async function main() {
  await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public; DROP SCHEMA IF EXISTS drizzle CASCADE;");
  await pool.query("CREATE EXTENSION IF NOT EXISTS vector");
  console.log("database reset");
  await pool.end();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
