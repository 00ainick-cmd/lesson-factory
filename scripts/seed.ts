/**
 * Bootstrap script: creates the first admin user + workspace (if none exist) and seeds the
 * Knowledge Library from the vendored kit. Credentials come from env (never committed):
 *   SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_WORKSPACE_NAME (defaults: admin@lfs.local / change-me-now / "AERO Studio")
 */
import "dotenv/config";
import { db, pool } from "@/server/db/client";
import { users, workspaces, workspaceMembers } from "@/server/db/schema";
import { hashPassword } from "@/server/auth/password";
import { seedWorkspaceKnowledge } from "@/server/knowledge/seed";
import { eq } from "drizzle-orm";

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@lfs.local").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "change-me-now";
  const wsName = process.env.SEED_WORKSPACE_NAME ?? "AERO Studio";
  let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    [user] = await db.insert(users).values({ email, name: "Studio Admin", passwordHash: await hashPassword(password), isPlatformAdmin: true }).returning();
    console.log(`created user ${email}`);
  }
  let [ws] = await db.select().from(workspaces).where(eq(workspaces.slug, "aero-studio")).limit(1);
  if (!ws) {
    [ws] = await db.insert(workspaces).values({ name: wsName, slug: "aero-studio", createdBy: user!.id }).returning();
    await db.insert(workspaceMembers).values({ workspaceId: ws!.id, userId: user!.id, role: "admin" });
    console.log(`created workspace ${wsName}`);
  }
  const summary = await seedWorkspaceKnowledge(ws!.id, user!.id);
  console.log("seeded", summary);
  await pool.end();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
