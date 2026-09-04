import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { workspaceMembers, projects } from "@/server/db/schema";
import { getCurrentUser, type CurrentUser } from "./session";

export type Role = "admin" | "author" | "reviewer";

// Capability matrix. Reviewers are read-only on content but may comment/approve (Phase 3).
const CAPABILITIES: Record<string, Role[]> = {
  "workspace.manage": ["admin"],
  "workspace.invite": ["admin"],
  "knowledge.read": ["admin", "author", "reviewer"],
  "knowledge.write": ["admin", "author"],
  "rules.write": ["admin"],
  "project.read": ["admin", "author", "reviewer"],
  "project.write": ["admin", "author"],
  "project.delete": ["admin"],
  "project.export": ["admin", "author"],
  "proposal.decide": ["admin", "author"],
  "copilot.use": ["admin", "author", "reviewer"],
  "review.comment": ["admin", "author", "reviewer"],
  "review.approve": ["admin", "reviewer"],
};

export type Capability = keyof typeof CAPABILITIES;

export class AuthError extends Error {
  constructor(
    public status: 401 | 403,
    message: string,
  ) {
    super(message);
  }
}

export async function requireUser(): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u) throw new AuthError(401, "Not signed in");
  return u;
}

export async function membershipRole(userId: string, workspaceId: string): Promise<Role | null> {
  const rows = await db
    .select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.userId, userId), eq(workspaceMembers.workspaceId, workspaceId)))
    .limit(1);
  return rows[0]?.role ?? null;
}

export function roleCan(role: Role, cap: Capability): boolean {
  return (CAPABILITIES[cap] ?? []).includes(role);
}

export async function requireWorkspace(workspaceId: string, cap: Capability) {
  const user = await requireUser();
  const role = user.isPlatformAdmin ? "admin" : await membershipRole(user.id, workspaceId);
  if (!role) throw new AuthError(403, "Not a member of this workspace");
  if (!roleCan(role, cap)) throw new AuthError(403, `Role ${role} cannot ${cap}`);
  return { user, role };
}

export async function requireProject(projectId: string, cap: Capability) {
  const rows = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  const project = rows[0];
  if (!project) throw new AuthError(403, "Project not found");
  const ctx = await requireWorkspace(project.workspaceId, cap);
  return { ...ctx, project };
}
