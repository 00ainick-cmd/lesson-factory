import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { artifacts } from "@/server/db/schema";
import { storage, sha256, contentKey } from "@/server/storage";

export async function storeArtifact(input: {
  workspaceId: string;
  kind: string;
  filename: string;
  mimeType: string;
  body: Buffer;
  uploadedBy?: string | null;
  immutable?: boolean;
}) {
  const hash = sha256(input.body);
  const ext = path.extname(input.filename) || "";
  const key = contentKey(input.workspaceId, input.kind, hash, ext);
  await storage().put(key, input.body, input.mimeType);
  const [row] = await db
    .insert(artifacts)
    .values({
      workspaceId: input.workspaceId,
      kind: input.kind,
      filename: input.filename,
      mimeType: input.mimeType,
      sizeBytes: input.body.length,
      sha256: hash,
      storageKey: key,
      immutable: input.immutable ?? true,
      uploadedBy: input.uploadedBy ?? null,
    })
    .returning();
  return row!;
}

export async function readArtifact(artifactId: string) {
  const [row] = await db.select().from(artifacts).where(eq(artifacts.id, artifactId)).limit(1);
  if (!row) throw new Error("Artifact not found");
  const body = await storage().get(row.storageKey);
  // Integrity check: the stored bytes must still match the recorded hash.
  if (sha256(body) !== row.sha256) throw new Error(`Artifact ${artifactId} failed integrity check`);
  return { row, body };
}
