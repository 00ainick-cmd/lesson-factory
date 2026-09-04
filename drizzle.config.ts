import type { Config } from "drizzle-kit";
export default {
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "postgres://lfs:lfs@localhost:5432/lesson_factory" },
} satisfies Config;
