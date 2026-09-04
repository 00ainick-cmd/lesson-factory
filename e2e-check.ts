import "dotenv/config";
import { readFileSync } from "node:fs";
import { eq, desc } from "drizzle-orm";
import { db, pool } from "@/server/db/client";
import { workspaces, users, projects, auditFindings, proposals, exports as exportsTable } from "@/server/db/schema";
import { storeArtifact } from "@/server/artifacts";
import { enqueueJob, runJob } from "@/server/jobs/queue";
import { decideProposal } from "@/server/copilot/proposals";
process.env.JOBS_MODE = "off";
(async () => {
  const [ws] = await db.select().from(workspaces);
  const [user] = await db.select().from(users);
  const body = readFileSync("seed-kit/lesson-factory/gold/01-resistance.html");
  const art = await storeArtifact({ workspaceId: ws!.id, kind: "original_html", filename: "01-resistance.html", mimeType: "text/html", body, uploadedBy: user!.id });
  const [project] = await db.insert(projects).values({ workspaceId: ws!.id, title: "Resistance (gold)", slug: "resistance-" + Date.now(), origin: "import", originalArtifactId: art.id, createdBy: user!.id }).returning();
  let t = Date.now();
  const j = await enqueueJob({ type: "lesson.import", payload: { projectId: project!.id, artifactId: art.id, userId: user!.id }, workspaceId: ws!.id, projectId: project!.id });
  const r1 = await runJob(j.id); console.log("import", Date.now() - t, "ms", JSON.stringify(r1).slice(0, 200));
  // audit was enqueued (JOBS_MODE off => still queued); run pending
  const { runPendingJobs } = await import("@/server/jobs/queue");
  t = Date.now(); await runPendingJobs(); console.log("audit", Date.now() - t, "ms");
  const findings = await db.select().from(auditFindings).where(eq(auditFindings.projectId, project!.id));
  const bySev: Record<string, number> = {}; for (const f of findings) bySev[f.severity] = (bySev[f.severity] ?? 0) + 1;
  console.log("findings", findings.length, bySev);
  for (const f of findings) console.log(` [${f.severity}] ${f.ruleKey}@${f.ruleVersion}: ${f.title}`.slice(0, 140));
  const props = await db.select().from(proposals).where(eq(proposals.projectId, project!.id));
  console.log("proposals", props.length, props.map(p => p.title));
  const shim = props.find(p => p.ruleKey === "assets.runtime-guard");
  if (shim) { console.log(shim.diff.split("\n").slice(0, 12).join("\n")); const d = await decideProposal({ proposalId: shim.id, projectId: project!.id, userId: user!.id, decision: "accept" }); console.log("accepted", d); }
  const [exp] = await db.insert(exportsTable).values({ projectId: project!.id, format: "standalone_html", createdBy: user!.id }).returning();
  t = Date.now();
  const ej = await enqueueJob({ type: "lesson.export", payload: { exportId: exp!.id, userId: user!.id, validate: true }, workspaceId: ws!.id, projectId: project!.id });
  const r2 = await runJob(ej.id) as any; console.log("export+validate", Date.now() - t, "ms", r2?.ok === false ? r2.error.slice(0,400) : "");
  const [expRow] = await db.select().from(exportsTable).where(eq(exportsTable.id, exp!.id));
  const rep = expRow!.validationReport as any;
  console.log("export status", expRow!.status, "ok", rep?.ok, "blocking", rep?.blocking, "warnings", rep?.warnings?.length, "beats", rep?.beatsRendered, "autoSolve", rep?.autoSolveRan, "complete", rep?.completionReached);
  await pool.end();
})().catch(e => { console.error(e); process.exit(1); });
