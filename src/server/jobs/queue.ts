import { and, eq, lte, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { jobs } from "@/server/db/schema";
import { logger } from "@/server/log";
import { handlers, type JobType } from "./handlers";

export async function enqueueJob(input: {
  type: JobType;
  payload: unknown;
  workspaceId?: string | null;
  projectId?: string | null;
  createdBy?: string | null;
}) {
  const [row] = await db
    .insert(jobs)
    .values({
      type: input.type,
      payload: input.payload,
      workspaceId: input.workspaceId ?? null,
      projectId: input.projectId ?? null,
      createdBy: input.createdBy ?? null,
    })
    .returning();
  // In inline mode the web process runs jobs immediately after enqueue (dev / tests).
  if ((process.env.JOBS_MODE ?? "inline") === "inline") {
    void runJob(row!.id).catch((e) => logger.error("inline_job_failed", { error: String(e) }));
  }
  return row!;
}

export async function claimNextJob() {
  // FOR UPDATE SKIP LOCKED lets several workers share the table safely.
  const claimed = await db.execute<{ id: string }>(sql`
    UPDATE jobs SET status = 'running', started_at = now(), attempts = attempts + 1
    WHERE id = (
      SELECT id FROM jobs WHERE status = 'queued' AND run_after <= now()
      ORDER BY created_at ASC FOR UPDATE SKIP LOCKED LIMIT 1
    ) RETURNING id
  `);
  return claimed.rows[0]?.id ?? null;
}

export async function runJob(jobId: string) {
  // Claim this specific job if it is still queued.
  const [job] = await db
    .update(jobs)
    .set({ status: "running", startedAt: new Date(), attempts: sql`${jobs.attempts} + 1` })
    .where(and(eq(jobs.id, jobId), eq(jobs.status, "queued"), lte(jobs.runAfter, new Date())))
    .returning();
  if (!job) return executeClaimed(jobId);
  return executeClaimed(jobId);
}

export async function executeClaimed(jobId: string) {
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  if (!job || job.status !== "running") return;
  const handler = handlers[job.type as JobType];
  const started = Date.now();
  try {
    if (!handler) throw new Error(`No handler for job type ${job.type}`);
    const result = await handler(job.payload, { jobId: job.id, projectId: job.projectId, workspaceId: job.workspaceId });
    await db
      .update(jobs)
      .set({ status: "succeeded", result: result ?? null, finishedAt: new Date() })
      .where(eq(jobs.id, job.id));
    logger.info("job_succeeded", { type: job.type, id: job.id, ms: Date.now() - started });
  } catch (e) {
    const message = e instanceof Error ? `${e.message}\n${e.stack ?? ""}` : String(e);
    await db.update(jobs).set({ status: "failed", error: message, finishedAt: new Date() }).where(eq(jobs.id, job.id));
    logger.error("job_failed", { type: job.type, id: job.id, error: message.split("\n")[0] });
  }
}

export async function runPendingJobs(max = 50) {
  let n = 0;
  while (n < max) {
    const id = await claimNextJob();
    if (!id) break;
    await executeClaimed(id);
    n++;
  }
  return n;
}

export async function getJob(jobId: string) {
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  return job ?? null;
}
