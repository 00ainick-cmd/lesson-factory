import { db } from "@/server/db/client";
import { activityLog } from "@/server/db/schema";
import { logger } from "@/server/log";

export async function recordActivity(entry: {
  workspaceId?: string | null;
  projectId?: string | null;
  userId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: unknown;
  ip?: string;
}) {
  try {
    await db.insert(activityLog).values({
      workspaceId: entry.workspaceId ?? null,
      projectId: entry.projectId ?? null,
      userId: entry.userId ?? null,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      details: entry.details ?? null,
      ip: entry.ip,
    });
    logger.info("activity", { action: entry.action, target: entry.targetId, user: entry.userId });
  } catch (e) {
    logger.error("activity_log_failed", { error: String(e) });
  }
}
