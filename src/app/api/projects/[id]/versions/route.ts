import { z } from "zod";
import { requireProject } from "@/server/auth/rbac";
import { handle, json, readJson, type Params } from "@/server/api";
import { createVersion, getProjectFull } from "@/server/services/projects";

export const GET = handle(async (_req: Request, { params }: Params<"id">) => {
  const { id } = await params;
  await requireProject(id, "project.read");
  return json({ versions: (await getProjectFull(id)).versions });
});

export const POST = handle(async (req: Request, { params }: Params<"id">) => {
  const { id } = await params;
  const { user } = await requireProject(id, "project.write");
  const body = await readJson(req, z.object({ name: z.string().min(1).max(120), note: z.string().max(1000).optional() }));
  const v = await createVersion({ projectId: id, userId: user.id, ...body });
  return json({ version: { id: v.id, number: v.number, name: v.name, note: v.note, contentHash: v.contentHash, createdAt: v.createdAt } }, { status: 201 });
});
