export type ParsedTokenFamily = { family: string; name: string; tokens: Record<string, string>; meaning: Record<string, string> };

/** Parse identity/tokens.css: the :root block (lesson surface) plus the documented shell values in the header comment. */
export function parseTokensCss(css: string): ParsedTokenFamily[] {
  const out: ParsedTokenFamily[] = [];
  const root = css.match(/:root\s*\{([\s\S]*?)\}/);
  if (root) {
    const tokens: Record<string, string> = {};
    const meaning: Record<string, string> = {};
    let section = "";
    for (const line of root[1]!.split("\n")) {
      const c = line.match(/\/\*\s*(.+?)\s*\*\//);
      const t = line.match(/(--[\w-]+)\s*:\s*([^;]+);/);
      if (t) {
        tokens[t[1]!] = t[2]!.trim();
        if (section) meaning[t[1]!] = section;
      } else if (c) section = c[1]!;
    }
    out.push({ family: "field-manual", name: "Field Manual lesson surface", tokens, meaning });
  }
  const shell: Record<string, string> = {};
  for (const m of css.matchAll(/(shell|rail|ink|muted|accent|ok|gold)\s+(#[0-9a-fA-F]{6})/g)) shell[`--shell-${m[1]}`] = m[2]!;
  for (const m of css.matchAll(/(mono|ui|display)\s+'([^']+)'/g)) shell[`--font-${m[1]}`] = m[2]!;
  if (Object.keys(shell).length) out.push({ family: "shell", name: "AERO shell chrome (locked)", tokens: shell, meaning: { note: "Documented in tokens.css header; not overridable by lessons" } });
  return out;
}
