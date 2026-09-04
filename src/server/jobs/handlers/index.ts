import { importHandler } from "./import";
import { exportHandler } from "./export";
import { validateExportHandler } from "./validate-export";
import { auditHandler } from "./audit";

export type JobContext = { jobId: string; projectId: string | null; workspaceId: string | null };
export type JobHandler = (payload: unknown, ctx: JobContext) => Promise<unknown>;

export const handlers = {
  "lesson.import": importHandler,
  "lesson.export": exportHandler,
  "export.validate": validateExportHandler,
  "copilot.audit": auditHandler,
} satisfies Record<string, JobHandler>;

export type JobType = keyof typeof handlers;
