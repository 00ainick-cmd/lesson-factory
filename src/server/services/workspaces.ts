import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import { db } from "@/server/db/client";
import { activityLog, invites, users, workspaceMembers, workspaces } from "@/server/db/schema";
import { seedWorkspaceKnowledge } from "@/server/knowledge/seed";
import { recordActivity } from "@/server/activity";
import { ApiError } from "@/server/api";
import type { Role } from "@/server/auth/rbac";

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "workspace";
}

export async function listWorkspacesForUser(userId: string, platformAdmin: boolean) {
  if (platformAdmin) {
    const rows = await db.select().from(workspaces).orderBy(workspaces.name);
    return rows.map((w) => ({ ...w, role: "admin" as Role }));
  }
  const rows = await db
    .select({ w: workspaces, role: workspaceMembers.role })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(eq(workspaceMembers.userId, userId))
    .orderBy(workspaces.name);
  return rows.map((r) => ({ ...r.w, role: r.role }));
}

/** Create a workspace, add creator as admin, and copy the seed kit's guidance into editable documents. */
export async function createWorkspace(input: { name: string; userId: string }) {
  let slug = slugify(input.name);
  const clash = await db.select({ id: workspaces.id }).from(workspaces).where(eq(workspaces.slug, slug)).limit(1);
  if (clash.length) slug = `${slug}-${randomBytes(2).toString("hex")}`;
  const [ws] = await db.insert(workspaces).values({ name: input.name, slug, createdBy: input.userId }).returning();
  await db.insert(workspaceMembers).values({ workspaceId: ws!.id, userId: input.userId, role: "admin" });
  const seed = await seedWorkspaceKnowledge(ws!.id, input.userId);
  await recordActivity({ workspaceId: ws!.id, userId: input.userId, action: "workspace.create", targetType: "workspace", targetId: ws!.id, details: { seed } });
  return { workspace: ws!, seed };
}

export async function getWorkspace(id: string) {
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, id)).limit(1);
  if (!ws) throw new ApiError(404, "Workspace not found");
  return ws;
}

export async function listMembers(workspaceId: string) {
  return db
    .select({ id: workspaceMembers.id, userId: users.id, email: users.email, name: users.name, role: workspaceMembers.role, since: workspaceMembers.createdAt })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.userId))
    .where(eq(workspaceMembers.workspaceId, workspaceId))
    .orderBy(users.name);
}

export async function updateMemberRole(workspaceId: string, memberId: string, role: Role, actorId: string) {
  const [row] = await db.update(workspaceMembers).set({ role }).where(and(eq(workspaceMembers.id, memberId), eq(workspaceMembers.workspaceId, workspaceId))).returning();
  if (!row) throw new ApiError(404, "Member not found");
  await recordActivity({ workspaceId, userId: actorId, action: "member.role", targetType: "member", targetId: memberId, details: { role } });
  return row;
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createInvite(input: { workspaceId: string; email: string; role: Role; invitedBy: string }) {
  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  const [row] = await db
    .insert(invites)
    .values({ workspaceId: input.workspaceId, email: input.email.toLowerCase(), role: input.role, tokenHash: hashToken(token), invitedBy: input.invitedBy, expiresAt })
    .returning();
  await recordActivity({ workspaceId: input.workspaceId, userId: input.invitedBy, action: "invite.create", targetType: "invite", targetId: row!.id, details: { email: input.email, role: input.role } });
  // The invite link is returned to the admin (no outbound email in this deployment).
  return { invite: row!, token };
}

export async function listInvites(workspaceId: string) {
  return db.select({ id: invites.id, email: invites.email, role: invites.role, expiresAt: invites.expiresAt, acceptedAt: invites.acceptedAt, createdAt: invites.createdAt }).from(invites).where(eq(invites.workspaceId, workspaceId)).orderBy(desc(invites.createdAt));
}

export async function getInviteByToken(token: string) {
  const [row] = await db
    .select({ inv: invites, ws: workspaces })
    .from(invites)
    .innerJoin(workspaces, eq(workspaces.id, invites.workspaceId))
    .where(and(eq(invites.tokenHash, hashToken(token)), isNull(invites.acceptedAt)))
    .limit(1);
  if (!row || row.inv.expiresAt < new Date()) return null;
  return row;
}

export async function acceptInvite(token: string, userId: string) {
  const row = await getInviteByToken(token);
  if (!row) throw new ApiError(410, "Invite is invalid or expired");
  await db
    .insert(workspaceMembers)
    .values({ workspaceId: row.inv.workspaceId, userId, role: row.inv.role })
    .onConflictDoUpdate({ target: [workspaceMembers.workspaceId, workspaceMembers.userId], set: { role: row.inv.role } });
  await db.update(invites).set({ acceptedAt: new Date() }).where(eq(invites.id, row.inv.id));
  await recordActivity({ workspaceId: row.inv.workspaceId, userId, action: "invite.accept", targetType: "invite", targetId: row.inv.id });
  return row.ws;
}

export async function listActivity(workspaceId: string, opts: { projectId?: string; limit?: number } = {}) {
  const where = opts.projectId ? and(eq(activityLog.workspaceId, workspaceId), eq(activityLog.projectId, opts.projectId)) : eq(activityLog.workspaceId, workspaceId);
  return db
    .select({ id: activityLog.id, action: activityLog.action, targetType: activityLog.targetType, targetId: activityLog.targetId, details: activityLog.details, createdAt: activityLog.createdAt, projectId: activityLog.projectId, userName: users.name, userEmail: users.email })
    .from(activityLog)
    .leftJoin(users, eq(users.id, activityLog.userId))
    .where(where)
    .orderBy(desc(activityLog.createdAt))
    .limit(opts.limit ?? 100);
}

export async function userCount() {
  const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(users);
  return r?.n ?? 0;
}
