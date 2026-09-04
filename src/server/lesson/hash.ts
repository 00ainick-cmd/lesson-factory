import { createHash } from "node:crypto";
import type { LessonDocument } from "./model";

/** Deterministic content hash of a lesson document (sorted keys). Used for version identity. */
export function documentHash(doc: LessonDocument): string {
  return createHash("sha256").update(stableStringify(doc)).digest("hex");
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + stableStringify((value as Record<string, unknown>)[k])).join(",") + "}";
}
