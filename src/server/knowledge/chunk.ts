export type Chunk = { heading: string | null; content: string };

/** Split Markdown into heading-delimited chunks of roughly <= 1800 chars for retrieval. */
export function chunkMarkdown(md: string, maxChars = 1800): Chunk[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: Chunk[] = [];
  let heading: string | null = null;
  let buf: string[] = [];
  const flush = () => {
    const text = buf.join("\n").trim();
    if (text.length > 0) {
      if (text.length <= maxChars) out.push({ heading, content: text });
      else {
        // split long sections on blank lines
        let cur = "";
        for (const para of text.split(/\n\s*\n/)) {
          if ((cur + "\n\n" + para).length > maxChars && cur) {
            out.push({ heading, content: cur.trim() });
            cur = para;
          } else cur = cur ? cur + "\n\n" + para : para;
        }
        if (cur.trim()) out.push({ heading, content: cur.trim() });
      }
    }
    buf = [];
  };
  for (const line of lines) {
    const m = line.match(/^(#{1,4})\s+(.+)$/);
    if (m) {
      flush();
      heading = m[2]!.trim();
      buf.push(line);
    } else buf.push(line);
  }
  flush();
  return out;
}
