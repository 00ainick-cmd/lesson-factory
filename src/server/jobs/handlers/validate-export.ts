import http from "node:http";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { exports as exportsTable } from "@/server/db/schema";
import { readArtifact } from "@/server/artifacts";
import { logger } from "@/server/log";
import type { JobHandler } from "./index";

export type ValidationIssue = { type: "pageerror" | "console" | "request"; message: string; url?: string };
export type ValidationReport = {
  ok: boolean;
  engine: "chromium";
  durationMs: number;
  title: string | null;
  beatsRendered: number;
  autoSolveRan: boolean;
  completionReached: boolean | null;
  blocking: ValidationIssue[];
  warnings: ValidationIssue[];
  consoleLog: string[];
};

/**
 * Serve the exported HTML over a throwaway localhost HTTP server and open it in a clean Playwright
 * browser context. "Blocking" = uncaught page errors and non-404 console errors. 404s for assets the
 * import report already flagged as missing are warnings (they are expected until the assets are bundled).
 */
export async function validateExportedHtml(html: string, opts: { knownMissingAssets?: string[]; timeoutMs?: number } = {}): Promise<ValidationReport> {
  const { chromium } = await import("playwright");
  const started = Date.now();
  const server = http.createServer((req, res) => {
    if (req.url === "/" || req.url?.startsWith("/index.html")) {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(html);
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
  const port = (server.address() as { port: number }).port;
  const base = `http://127.0.0.1:${port}/`;
  const blocking: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const consoleLog: string[] = [];
  const known = new Set((opts.knownMissingAssets ?? []).map((p) => p.replace(/^\.\//, "")));
  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => blocking.push({ type: "pageerror", message: e.message }));
    page.on("console", (m) => {
      const text = m.text();
      consoleLog.push(`[${m.type()}] ${text}`);
      if (m.type() === "error") {
        // Resource 404s and CSP-delivery notices are advisory; uncaught exceptions and runtime errors block.
        const advisory = /404|Failed to load resource|Content Security Policy directive .* is ignored/i.test(text);
        (advisory ? warnings : blocking).push({ type: "console", message: text, url: m.location()?.url });
      }
    });
    page.on("requestfailed", (r) => warnings.push({ type: "request", message: r.failure()?.errorText ?? "failed", url: r.url() }));
    page.on("response", (r) => {
      if (r.status() >= 400) {
        const rel = r.url().replace(base, "");
        const knownMissing = [...known].some((k) => rel.endsWith(k.replace(/^(\.\.\/)+/, "")) || k.endsWith(rel));
        const issue: ValidationIssue = { type: "request", message: `${r.status()} ${knownMissing ? "(known missing asset)" : ""}`.trim(), url: r.url() };
        (knownMissing || r.status() === 404 ? warnings : blocking).push(issue);
      }
    });
    // domcontentloaded: external fonts/assets may be unreachable offline and must not stall validation.
    await page.goto(base, { waitUntil: "domcontentloaded", timeout: opts.timeoutMs ?? 20000 });
    await page.waitForTimeout(1200);
    const title = await page.title();
    const beatsRendered = await page.evaluate(() => document.querySelectorAll("[data-beat]").length);
    let autoSolveRan = false;
    let completionReached: boolean | null = null;
    const hasAutoSolve = await page.evaluate(() => typeof (window as unknown as { autoSolve?: unknown }).autoSolve === "function");
    if (hasAutoSolve) {
      await page.evaluate(() => (window as unknown as { autoSolve: () => unknown }).autoSolve());
      autoSolveRan = true;
      await page.waitForTimeout(800);
      completionReached = await page.evaluate(() => {
        const w = window as unknown as { AeroLesson?: { standalone?: boolean; getState?: () => { complete?: boolean } } };
        if (w.AeroLesson?.standalone && w.AeroLesson.getState) return Boolean(w.AeroLesson.getState().complete);
        const locked = document.querySelectorAll("[data-beat].is-locked").length;
        return locked === 0 ? true : null;
      });
    }
    return { ok: blocking.length === 0, engine: "chromium", durationMs: Date.now() - started, title: title || null, beatsRendered, autoSolveRan, completionReached, blocking, warnings, consoleLog: consoleLog.slice(0, 200) };
  } finally {
    await browser.close().catch(() => undefined);
    server.close();
  }
}

const Payload = z.object({ exportId: z.string().uuid() });

/** export.validate: re-run validation for an existing export artifact. */
export const validateExportHandler: JobHandler = async (raw) => {
  const p = Payload.parse(raw);
  const [exp] = await db.select().from(exportsTable).where(eq(exportsTable.id, p.exportId)).limit(1);
  if (!exp?.artifactId) throw new Error("Export has no artifact");
  const { body } = await readArtifact(exp.artifactId);
  const report = await validateExportedHtml(body.toString("utf8"));
  await db.update(exportsTable).set({ status: report.ok ? "passed" : "failed", validationReport: report, updatedAt: new Date() }).where(eq(exportsTable.id, exp.id));
  logger.info("export_validated", { exportId: exp.id, ok: report.ok });
  return report;
};
