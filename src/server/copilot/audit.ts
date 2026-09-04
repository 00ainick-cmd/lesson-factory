import * as cheerio from "cheerio";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { beatTypes, objectives, qualityRules } from "@/server/db/schema";
import { compileLesson } from "@/server/lesson/compile";
import type { LessonDocument } from "@/server/lesson/model";
import type { ImportReport } from "@/server/lesson/import";
import { RULES } from "./rules";
import type { Finding, RuleContext, RuleDefinition } from "./rules/types";

export type AuditSummary = {
  auditVersion: string;
  rulesEvaluated: number;
  rulesSkipped: string[];
  counts: { error: number; warning: number; info: number };
  exportReady: boolean;
  durationMs: number;
};

export const AUDIT_VERSION = "1.0.0";

export async function loadWorkspaceRules(workspaceId: string): Promise<RuleDefinition[]> {
  const rows = await db.select().from(qualityRules).where(and(eq(qualityRules.workspaceId, workspaceId), eq(qualityRules.active, true)));
  return rows.map((r) => ({ key: r.key, name: r.name, category: r.category, severity: r.severity, description: r.description, params: r.params, version: r.version, active: r.active, sourceRef: r.sourceRef }));
}

/** Build the rule context once; rules are pure functions over it. */
export function buildRuleContext(doc: LessonDocument, extra: { report: ImportReport | null; objectives: RuleContext["objectives"]; beatTypes: RuleContext["beatTypes"] }): RuleContext {
  // Preview compile carries data-lfs-block markers so DOM-level findings can point at a block.
  const html = compileLesson(doc, { mode: "preview", authorMode: false });
  const $ = cheerio.load(html);
  const scriptText = $("script")
    .map((_, el) => $(el).html() ?? "")
    .get()
    .join("\n");
  const text = visibleText(html);
  return { doc, html, $, report: extra.report, objectives: extra.objectives, beatTypes: extra.beatTypes, text, scriptText };
}

/** Visible text extraction that mirrors tools/quality-gate.py visible_text so counts agree with the kit gate. */
export function visibleText(html: string): string {
  let t = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  t = t.replace(/<\/(p|li|h\d|div|section|figcaption|td|blockquote)>/gi, "\n").replace(/<br[^>]*>/gi, "\n");
  t = t.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
  return t.split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n");
}

export function runRules(ctx: RuleContext, rules: RuleDefinition[]): { findings: Finding[]; summary: AuditSummary } {
  const started = Date.now();
  const findings: Finding[] = [];
  const skipped: string[] = [];
  let evaluated = 0;
  for (const rule of rules) {
    const impl = RULES[rule.key];
    if (!impl) {
      if (rule.key !== "export.readiness") skipped.push(rule.key);
      continue;
    }
    evaluated++;
    try {
      findings.push(...impl(ctx, rule));
    } catch (e) {
      findings.push({ ruleKey: rule.key, ruleVersion: rule.version, severity: "info", title: `Rule ${rule.key} failed to run`, message: String(e), evidence: { error: String(e) } });
    }
  }
  const counts = { error: 0, warning: 0, info: 0 };
  for (const f of findings) counts[f.severity === "blocker" ? "error" : f.severity]++;
  const readiness = rules.find((r) => r.key === "export.readiness");
  if (readiness) {
    evaluated++;
    findings.push({
      ruleKey: readiness.key,
      ruleVersion: readiness.version,
      severity: counts.error ? "warning" : "info",
      title: counts.error ? `Not export-ready: ${counts.error} blocking finding(s)` : "Export-ready",
      message: counts.error ? "Resolve or explicitly ignore every error-severity finding before shipping." : "No error-severity findings. Warnings remain advisory.",
      evidence: { counts },
    });
  }
  return { findings, summary: { auditVersion: AUDIT_VERSION, rulesEvaluated: evaluated, rulesSkipped: skipped, counts, exportReady: counts.error === 0, durationMs: Date.now() - started } };
}

export async function auditDocument(workspaceId: string, doc: LessonDocument, report: ImportReport | null) {
  const [rules, objs, types] = await Promise.all([
    loadWorkspaceRules(workspaceId),
    db.select({ code: objectives.code, wording: objectives.wording, category: objectives.category }).from(objectives).where(and(eq(objectives.workspaceId, workspaceId), eq(objectives.active, true))),
    db.select({ key: beatTypes.key, phase: beatTypes.phase, mandatory: beatTypes.mandatory, gateKind: beatTypes.gateKind, budgetMin: beatTypes.budgetMin, budgetMax: beatTypes.budgetMax }).from(beatTypes).where(and(eq(beatTypes.workspaceId, workspaceId), eq(beatTypes.active, true))),
  ]);
  const ctx = buildRuleContext(doc, { report, objectives: objs, beatTypes: types });
  return runRules(ctx, rules);
}
