import { promises as fs } from "node:fs";
import path from "node:path";
import type { ObjectStorage } from "./index";

export class LocalStorage implements ObjectStorage {
  constructor(private root: string) {}
  private resolve(key: string) {
    const p = path.resolve(this.root, key);
    if (!p.startsWith(path.resolve(this.root))) throw new Error("Invalid storage key");
    return p;
  }
  async put(key: string, body: Buffer): Promise<void> {
    const p = this.resolve(key);
    await fs.mkdir(path.dirname(p), { recursive: true });
    // Never overwrite an existing object: originals are immutable and content-addressed.
    try {
      await fs.writeFile(p, body, { flag: "wx" });
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
    }
  }
  async get(key: string): Promise<Buffer> {
    return fs.readFile(this.resolve(key));
  }
  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.resolve(key));
      return true;
    } catch {
      return false;
    }
  }
}
