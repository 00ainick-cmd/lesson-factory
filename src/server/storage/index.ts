import { createHash } from "node:crypto";
import { env } from "@/server/env";
import { LocalStorage } from "./local";
import { S3Storage } from "./s3";

export interface ObjectStorage {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  exists(key: string): Promise<boolean>;
}

let instance: ObjectStorage | undefined;
export function storage(): ObjectStorage {
  if (instance) return instance;
  const e = env();
  instance = e.STORAGE_DRIVER === "s3" ? new S3Storage() : new LocalStorage(e.STORAGE_LOCAL_DIR);
  return instance;
}

export function sha256(buf: Buffer | string): string {
  return createHash("sha256").update(buf).digest("hex");
}

// Content-addressed key: originals are immutable, so the key never changes for the same bytes.
export function contentKey(workspaceId: string, kind: string, hash: string, ext: string): string {
  return `${workspaceId}/${kind}/${hash.slice(0, 2)}/${hash}${ext}`;
}
