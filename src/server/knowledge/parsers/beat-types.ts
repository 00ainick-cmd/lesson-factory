export type ParsedBeatType = {
  key: string;
  name: string;
  phase: string;
  ordinal: number;
  gateKind: string;
  budgetMin: number | null;
  budgetMax: number | null;
  definition: string;
  requirements: string[];
  recipes: string[];
  mandatory: boolean;
};

const PHASES: Record<string, string> = {
  orientation: "FRAME",
  case: "FRAME",
  definition: "DELIVER",
  explanation: "DELIVER",
  demonstration: "DELIVER",
  simulation: "APPLY",
  practice: "APPLY",
  procedure: "APPLY",
  check: "VERIFY",
  consolidation: "CLOSE",
};

/** Parse chassis/BEAT-TYPES.md "### 3.N Name" sections. */
export function parseBeatTypes(md: string): ParsedBeatType[] {
  const text = md.replace(/\r\n/g, "\n");
  const sections = text.split(/^### 3\.(\d+)\s+(.+)$/m);
  const out: ParsedBeatType[] = [];
  for (let i = 1; i < sections.length; i += 3) {
    const ordinal = Number(sections[i]);
    const name = sections[i + 1]!.trim();
    const body = sections[i + 2] ?? "";
    const key = name.toLowerCase().replace(/[^a-z]+/g, "-");
    const definition = body.match(/\*\*Definition\.\*\*\s*([^\n]+)/)?.[1]?.trim() ?? "";
    const gateLine = body.match(/\*\*Gate\.\*\*\s*([^*]+?)(?:\*\*Budget\.\*\*\s*([^\n]+))?$/m);
    const gateText = (gateLine?.[1] ?? "").toLowerCase();
    let gateKind = "read";
    if (/withholds release/.test(gateText)) gateKind = "lab";
    if (/pass threshold is met/.test(gateText) || key === "check") gateKind = "check";
    if (/completion releases/.test(gateText) || key === "consolidation") gateKind = "completion";
    const budget = (gateLine?.[2] ?? body.match(/\*\*Budget\.\*\*\s*([^\n]+)/)?.[1] ?? "").match(/(\d+)\s*(?:to|–|-)\s*(\d+)/);
    const reqBlock = body.match(/\*\*Design requirements\.\*\*\s*\n([\s\S]*?)\n\n\*\*/);
    const requirements = reqBlock ? reqBlock[1]!.split("\n").map((l) => l.replace(/^\d+\.\s*/, "").trim()).filter(Boolean) : [];
    out.push({
      key,
      name,
      phase: PHASES[key] ?? "DELIVER",
      ordinal,
      gateKind,
      budgetMin: budget ? Number(budget[1]) : null,
      budgetMax: budget ? Number(budget[2]) : null,
      definition,
      requirements,
      recipes: [],
      mandatory: ["orientation", "check", "consolidation"].includes(key),
    });
  }
  return out;
}
