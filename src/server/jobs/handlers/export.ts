import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { exports as exportsTable, projects, projectVersions } from "@/server/db/schema";
import { storeArtifact } from "@/server/artifacts";
import { compileLesson } from "@/server/lesson/compile";
import { LessonDocumentSchema } from "@/server/lesson/model";
import { recordActivity } from "@/server/activity";
import { validateExportedHtml } from "./validate-export";
import type { JobHandler } from "./index";

const Payload = z.object({
  exportId: z.string().uuid(),
  userId: z.string().uuid().nullable().optional(),
  validate: z.boolean().default(true),
});

export type ExportOptions = { standaloneShim?: boolean; dropMissingScripts?: boolean };

/**
 * lesson.export: compile a version (or the working copy) to a standalone HTML artifact, then run the
 * clean-browser validation. Only standalone_html is implemented in Phase 1; web_zip and scorm12 are
 * reserved (see docs/export.md).
 */
export const exportHandler: JobHandler = async (raw) => {
  const p = Payload.parse(raw);
  const [exp] = await db.select().from(exportsTable).where(eq(exportsTable.id, p.exportId)).limit(1);
  if (!exp) throw new Error("Export not found");
  const [project] = await db.select().from(projects).where(eq(projects.id, exp.projectId)).limit(1);
  if (!project) throw new Error("Project not found");
  if (exp.format !== "standalone_html") {
    await db.update(exportsTable).set({ status: "failed", validationReport: { error: `format ${exp.format} is not implemented yet` }, updatedAt: new Date() }).where(eq(exportsTable.id, exp.id));
    throw new Error(`Export format ${exp.format} not implemented`);
  }
  await db.update(exportsTable).set({ status: "building", updatedAt: new Date() }).where(eq(exportsTable.id, exp.id));

  let rawDoc: unknown = project.workingDocument;
  if (exp.versionId) {
    const [v] = await db.select().from(projectVersions).where(eq(projectVersions.id, exp.versionId)).limit(1);
    if (!v) throw new Error("Version not found");
    rawDoc = v.document;
  }
  const doc = LessonDocumentSchema.parse(rawDoc);
  const options = (exp.options ?? {}) as ExportOptions;
  const missingScripts = doc.assets.filter((a) => a.kind === "script" && a.status === "missing").map((a) => a.path);
  const html = compileLesson(doc, {
    mode: "export",
    standaloneShim: options.standaloneShim ?? doc.runtime.standaloneShim,
    dropMissingScripts: options.dropMissingScripts ? missingScripts : undefined,
  });
  const filename = `${project.slug}${exp.versionId ? "" : "-working"}.html`;
  const artifact = await storeArtifact({ workspaceId: project.workspaceId, kind: "export_html", filename, mimeType: "text/html; charset=utf-8", body: Buffer.from(html, "utf8"), uploadedBy: p.userId ?? null });
  await db.update(exportsTable).set({ artifactId: artifact.id, status: p.validate ? "validating" : "passed", updatedAt: new Date() }).where(eq(exportsTable.id, exp.id));

  let report: Awaited<ReturnType<typeof validateExportedHtml>> | null = null;
  if (p.validate) {
    const knownMissing = doc.assets.filter((a) => a.status === "missing").map((a) => a.path);
    report = await validateExportedHtml(html, { knownMissingAssets: knownMissing });
    await db.update(exportsTable).set({ status: report.ok ? "passed" : "failed", validationReport: report, updatedAt: new Date() }).where(eq(exportsTable.id, exp.id));
  }
  await recordActivity({
    workspaceId: project.workspaceId,
    projectId: project.id,
    userId: p.userId ?? null,
    action: "export.create",
    targetType: "export",
    targetId: exp.id,
    details: { format: exp.format, artifactId: artifact.id, sha256: artifact.sha256, bytes: artifact.sizeBytes, validation: report ? { ok: report.ok, blocking: report.blocking.length, warnings: report.warnings.length } : null },
  });
  return { artifactId: artifact.id, sha256: artifact.sha256, validation: report };
};
