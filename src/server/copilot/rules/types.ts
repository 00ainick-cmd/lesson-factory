import type { CheerioAPI } from "cheerio";
import type { LessonDocument } from "@/server/lesson/model";
import type { ImportReport } from "@/server/lesson/import";
import type { Op } from "@/server/lesson/ops";

export type Severity = "info" | "warning" | "error" | "blocker";

export type RuleDefinition = {
  key: string;
  name: string;
  category: string;
  severity: Severity;
  description: string;
  params: Record<string, unknown>;
  version: number;
  active: boolean;
  sourceRef: string | null;
};

export type ProposalDraft = {
  kind: "repair" | "rewrite" | "structure" | "style" | "accessibility" | "code";
  title: string;
  explanation: string;
  ops: Op[];
};

export type Finding = {
  ruleKey: string;
  ruleVersion: number;
  severity: Severity;
  title: string;
  message: string;
  evidence: Record<string, unknown>;
  beatId?: string;
  blockId?: string;
  proposal?: ProposalDraft;
};

export type RuleContext = {
  doc: LessonDocument;
  /** Export-mode compile of the working document (what a learner would receive). */
  html: string;
  $: CheerioAPI;
  report: ImportReport | null;
  objectives: { code: string; wording: string; category: string }[];
  beatTypes: { key: string; phase: string; mandatory: boolean; gateKind: string; budgetMin: number | null; budgetMax: number | null }[];
  /** Visible prose (script/style stripped) for writing rules. */
  text: string;
  scriptText: string;
};

export type RuleImpl = (ctx: RuleContext, rule: RuleDefinition) => Finding[];

export function finding(rule: RuleDefinition, f: Omit<Finding, "ruleKey" | "ruleVersion" | "severity"> & { severity?: Severity }): Finding {
  return { ruleKey: rule.key, ruleVersion: rule.version, severity: f.severity ?? rule.severity, ...f };
}
