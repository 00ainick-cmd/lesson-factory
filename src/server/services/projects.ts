import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { artifacts, assets, auditFindings, auditRuns, exports as exportsTable, projectVersions, projects, proposals } from "@/server/db/schema";
import { storeArtifact, readArtifact } from "@/server/artifacts";
import { enqueueJob, getJob } from "@/server/jobs/queue";
import { recordActivity } from "@/server/activity";
import { ApiError } from "@/server/api";
import { parseLessonDocument, type LessonDocument } from "@/server/lesson/model";
import { applyOps, type Op } from "@/server/lesson/ops";
import { documentHash } from "@/server/lesson/hash";
import { slugify } from "./workspaces";

export async function listProjects(workspaceId: string) {
  const rows = await db
    .select({
      id: projects.id,
      title: projects.title,
      slug: projects.slug,
      origin: projects.origin,
      status: projects.status,
      workingRevision: projects.workingRevision,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      beats: sql<number>`coalesce(jsonb_array_length(${projects.workingDocument}->'beats'), 0)::int`,
      versions: sql<number>`(select count(*)::int from project_versions v where v.project_id = ${projects.id})`,
      openProposals: sql<number>`(select count(*)::int from proposals p where p.project_id = ${projects.id} and p.status = 'open')`,
    })
    .from(projects)
    .where(eq(projects.workspaceId, workspaceId))
    .orderBy(desc(projects.updatedAt));
  return rows;
}

/** Store the uploaded original immutably, create the project, and queue the import job. */
export async function createImportProject(input: { workspaceId: string; userId: string; title: string; filename: string; body: Buffer }) {
  if (!/\.html?$/i.test(input.filename)) throw new ApiError(400, "Only self-contained .html lessons can be imported in Phase 1");
  if (input.body.length > 25 * 1024 * 1024) throw new ApiError(413, "File exceeds 25 MB");
  const art = await storeArtifact({ workspaceId: input.workspaceId, kind: "original_html", filename: input.filename, mimeType: "text/html", body: input.body, uploadedBy: input.userId });
  const base = slugify(input.title);
  const [project] = await db
    .insert(projects)
    .values({ workspaceId: input.workspaceId, title: input.title, slug: `${base}-${Date.now().toString(36)}`, origin: "import", originalArtifactId: art.id, createdBy: input.userId })
    .returning();
  await recordActivity({ workspaceId: input.workspaceId, projectId: project!.id, userId: input.userId, action: "project.create", targetType: "project", targetId: project!.id, details: { title: input.title, filename: input.filename, sha256: art.sha256, bytes: input.body.length } });
  const job = await enqueueJob({ type: "lesson.import", payload: { projectId: project!.id, artifactId: art.id, userId: input.userId }, workspaceId: input.workspaceId, projectId: project!.id, createdBy: input.userId });
  return { project: project!, artifact: art, job };
}

export async function getProjectFull(projectId: string) {
  const [p] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!p) throw new ApiError(404, "Project not found");
  const original = p.originalArtifactId ? (await db.select().from(artifacts).where(eq(artifacts.id, p.originalArtifactId)).limit(1))[0] ?? null : null;
  const assetRows = await db.select().from(assets).where(eq(assets.projectId, projectId));
  const versions = await db
    .select({ id: projectVersions.id, number: projectVersions.number, name: projectVersions.name, note: projectVersions.note, contentHash: projectVersions.contentHash, createdAt: projectVersions.createdAt })
    .from(projectVersions)
    .where(eq(projectVersions.projectId, projectId))
    .orderBy(desc(projectVersions.number));
  const importJob = await db.execute(sql`select id, status, error, result, finished_at from jobs where project_id = ${projectId} and type = 'lesson.import' order by created_at desc limit 1`);
  return { project: p, original, assets: assetRows, versions, importJob: (importJob.rows[0] as Record<string, unknown> | undefined) ?? null };
}

export async function getWorkingDocument(projectId: string): Promise<{ doc: LessonDocument; revision: number; workspaceId: string }> {
  const [p] = await db.select({ doc: projects.workingDocument, rev: projects.workingRevision, ws: projects.workspaceId }).from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!p) throw new ApiError(404, "Project not found");
  if (!p.doc) throw new ApiError(409, "Project has no working document yet (import pending or failed)");
  return { doc: parseLessonDocument(p.doc), revision: p.rev, workspaceId: p.ws };
}

/** Apply author ops with optimistic concurrency on workingRevision. */
export async function applyProjectOps(input: { projectId: string; userId: string; baseRevision: number; ops: Op[] }) {
  const { doc, revision } = await getWorkingDocument(input.projectId);
  if (revision !== input.baseRevision) throw new ApiError(409, `Stale revision: server is at ${revision}, you sent ${input.baseRevision}`, { revision });
  const next = applyOps(doc, input.ops, { provenance: { origin: "author", userId: input.userId, at: new Date().toISOString() } });
  const [row] = await db
    .update(projects)
    .set({ workingDocument: next, workingRevision: revision + 1, updatedAt: new Date() })
    .where(and(eq(projects.id, input.projectId), eq(projects.workingRevision, revision)))
    .returning({ rev: projects.workingRevision });
  if (!row) throw new ApiError(409, "Concurrent edit detected; reload and retry");
  await recordActivity({ projectId: input.projectId, workspaceId: (await getWorkingDocument(input.projectId)).workspaceId, userId: input.userId, action: "document.edit", targetType: "project", targetId: input.projectId, details: { ops: input.ops.map((o) => o.type), revision: row.rev } });
  return { document: next, revision: row.rev };
}

/** Replace the whole working document (used by the editor's debounced save after client-side ops). */
export async function saveWorkingDocument(input: { projectId: string; userId: string; baseRevision: number; document: unknown; opTypes?: string[] }) {
  const next = parseLessonDocument(input.document);
  const [row] = await db
    .update(projects)
    .set({ workingDocument: next, workingRevision: input.baseRevision + 1, updatedAt: new Date() })
    .where(and(eq(projects.id, input.projectId), eq(projects.workingRevision, input.baseRevision)))
    .returning({ rev: projects.workingRevision, ws: projects.workspaceId });
  if (!row) {
    const [cur] = await db.select({ rev: projects.workingRevision }).from(projects).where(eq(projects.id, input.projectId)).limit(1);
    throw new ApiError(409, `Stale revision: server is at ${cur?.rev}, you sent ${input.baseRevision}`, { revision: cur?.rev });
  }
  await recordActivity({ projectId: input.projectId, workspaceId: row.ws, userId: input.userId, action: "document.save", targetType: "project", targetId: input.projectId, details: { revision: row.rev, ops: input.opTypes ?? [] } });
  return { revision: row.rev };
}

export async function createVersion(input: { projectId: string; userId: string; name: string; note?: string }) {
  const { doc, revision, workspaceId } = await getWorkingDocument(input.projectId);
  const [last] = await db.select({ n: sql<number>`coalesce(max(${projectVersions.number}), 0)::int` }).from(projectVersions).where(eq(projectVersions.projectId, input.projectId));
  const number = (last?.n ?? 0) + 1;
  const [v] = await db
    .insert(projectVersions)
    .values({ projectId: input.projectId, number, name: input.name, note: input.note ?? null, document: doc, contentHash: documentHash(doc), createdBy: input.userId })
    .returning();
  await recordActivity({ projectId: input.projectId, workspaceId, userId: input.userId, action: "version.create", targetType: "version", targetId: v!.id, details: { number, name: input.name, revision, contentHash: v!.contentHash } });
  return v!;
}

export async function getVersion(projectId: string, versionId: string) {
  const [v] = await db.select().from(projectVersions).where(and(eq(projectVersions.id, versionId), eq(projectVersions.projectId, projectId))).limit(1);
  if (!v) throw new ApiError(404, "Version not found");
  return v;
}

export async function restoreVersion(input: { projectId: string; userId: string; versionId: string }) {
  const v = await getVersion(input.projectId, input.versionId);
  const doc = parseLessonDocument(v.document);
  const [row] = await db.update(projects).set({ workingDocument: doc, workingRevision: sql`${projects.workingRevision} + 1`, updatedAt: new Date() }).where(eq(projects.id, input.projectId)).returning({ rev: projects.workingRevision, ws: projects.workspaceId });
  await recordActivity({ projectId: input.projectId, workspaceId: row!.ws, userId: input.userId, action: "version.restore", targetType: "version", targetId: v.id, details: { number: v.number, revision: row!.rev } });
  return { revision: row!.rev };
}

export async function requestExport(input: { projectId: string; workspaceId: string; userId: string; format: "standalone_html"; versionId?: string; validate: boolean; standaloneShim?: boolean }) {
  const [exp] = await db
    .insert(exportsTable)
    .values({ projectId: input.projectId, versionId: input.versionId ?? null, format: input.format, createdBy: input.userId, options: { standaloneShim: input.standaloneShim, validate: input.validate } })
    .returning();
  const job = await enqueueJob({ type: "lesson.export", payload: { exportId: exp!.id, userId: input.userId, validate: input.validate }, workspaceId: input.workspaceId, projectId: input.projectId, createdBy: input.userId });
  await db.update(exportsTable).set({ jobId: job.id }).where(eq(exportsTable.id, exp!.id));
  await recordActivity({ projectId: input.projectId, workspaceId: input.workspaceId, userId: input.userId, action: "export.request", targetType: "export", targetId: exp!.id, details: { format: input.format, versionId: input.versionId ?? null } });
  return { export: (await db.select().from(exportsTable).where(eq(exportsTable.id, exp!.id)))[0]!, job: await getJob(job.id) };
}

export async function listExports(projectId: string) {
  return db
    .select({ id: exportsTable.id, format: exportsTable.format, status: exportsTable.status, versionId: exportsTable.versionId, artifactId: exportsTable.artifactId, validationReport: exportsTable.validationReport, options: exportsTable.options, createdAt: exportsTable.createdAt, updatedAt: exportsTable.updatedAt, versionName: projectVersions.name, versionNumber: projectVersions.number })
    .from(exportsTable)
    .leftJoin(projectVersions, eq(projectVersions.id, exportsTable.versionId))
    .where(eq(exportsTable.projectId, projectId))
    .orderBy(desc(exportsTable.createdAt));
}

export async function getExport(projectId: string, exportId: string) {
  const [e] = await db.select().from(exportsTable).where(and(eq(exportsTable.id, exportId), eq(exportsTable.projectId, projectId))).limit(1);
  if (!e) throw new ApiError(404, "Export not found");
  return e;
}

export async function readArtifactForProject(projectId: string, artifactId: string) {
  const [p] = await db.select({ ws: projects.workspaceId }).from(projects).where(eq(projects.id, projectId)).limit(1);
  const art = await readArtifact(artifactId);
  if (!p || art.row.workspaceId !== p.ws) throw new ApiError(404, "Artifact not found");
  return art;
}

export async function latestAudit(projectId: string) {
  const [run] = await db.select().from(auditRuns).where(eq(auditRuns.projectId, projectId)).orderBy(desc(auditRuns.createdAt)).limit(1);
  if (!run) return { run: null, findings: [], proposals: [] };
  const findings = await db.select().from(auditFindings).where(eq(auditFindings.runId, run.id)).orderBy(sql`case ${auditFindings.severity} when 'blocker' then 0 when 'error' then 1 when 'warning' then 2 else 3 end`, auditFindings.ruleKey);
  const props = await db.select().from(proposals).where(eq(proposals.projectId, projectId)).orderBy(desc(proposals.createdAt)).limit(200);
  return { run, findings, proposals: props };
}

export async function requestAudit(input: { projectId: string; workspaceId: string; userId: string; kind?: string }) {
  const job = await enqueueJob({ type: "copilot.audit", payload: { projectId: input.projectId, kind: input.kind ?? "quality_audit", userId: input.userId }, workspaceId: input.workspaceId, projectId: input.projectId, createdBy: input.userId });
  return getJob(job.id);
}

export async function deleteProject(projectId: string, userId: string) {
  const [p] = await db.delete(projects).where(eq(projects.id, projectId)).returning({ ws: projects.workspaceId, title: projects.title });
  if (p) await recordActivity({ workspaceId: p.ws, userId, action: "project.delete", targetType: "project", targetId: projectId, details: { title: p.title } });
}
