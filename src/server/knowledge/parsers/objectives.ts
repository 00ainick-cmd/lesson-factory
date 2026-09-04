export type ParsedObjective = { code: string; category: string; wording: string; studyGuide?: string; bankItems?: number };

/** Parse content/caet-lo-registry.md: "## 2. Electrical Theory" sections with "- **2.4** wording" bullets. */
export function parseObjectiveRegistry(md: string): ParsedObjective[] {
  const out: ParsedObjective[] = [];
  let category = "General";
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const h = line.match(/^##\s+(?:\d+\.\s*)?(.+)$/);
    if (h) {
      category = h[1]!.trim();
      continue;
    }
    const m = line.match(/^-\s+\*\*(\d+\.\d+)\*\*\s+(.+)$/);
    if (m) {
      const obj: ParsedObjective = { code: m[1]!, category, wording: m[2]!.trim() };
      const next = lines[i + 1] ?? "";
      const sg = next.match(/Study guide:\s*(.+?)(?:\.\s*Bank items:\s*(\d+))?\.?\s*$/);
      if (sg) {
        obj.studyGuide = sg[1]!.trim().replace(/\.$/, "");
        if (sg[2]) obj.bankItems = Number(sg[2]);
      }
      out.push(obj);
    }
  }
  return out;
}
