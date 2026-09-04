"use client";
export function DiffView({ diff }: { diff: string }) {
  const lines = diff.split("\n");
  return (
    <pre className="max-h-72 overflow-auto rounded border border-line bg-[#0a0e13] py-1 font-mono text-[11px] leading-snug scroll-thin" aria-label="Unified diff">
      {lines.map((l, i) => {
        const cls = l.startsWith("+") && !l.startsWith("+++") ? "diff-add" : l.startsWith("-") && !l.startsWith("---") ? "diff-del" : l.startsWith("@@") ? "diff-hunk" : "text-muted";
        return <div key={i} className={`diff-line ${cls}`}>{l || " "}</div>;
      })}
    </pre>
  );
}
