"use client";
import { useState } from "react";
import { Badge, Select, severityTone } from "./ui";
import { api } from "@/lib/api";

type Rule = { id: string; key: string; name: string; category: string; severity: string; description: string; params: Record<string, unknown> | null; version: number; active: boolean; sourceRef: string | null };

export function RulesTable({ rules: init, canWrite }: { rules: Rule[]; canWrite: boolean }) {
  const [rules, setRules] = useState(init);
  const [err, setErr] = useState<string | null>(null);
  async function patch(id: string, body: Partial<Pick<Rule, "active" | "severity">>) {
    try {
      const r = await api<{ rule: Rule }>(`/api/rules/${id}`, { method: "PATCH", json: body });
      setRules((rs) => rs.map((x) => (x.id === id ? { ...x, ...r.rule } : x)));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }
  const cats = [...new Set(rules.map((r) => r.category))];
  return (
    <div className="space-y-6">
      {err && <p role="alert" className="text-bad text-[13px]">{err}</p>}
      {cats.map((cat) => (
        <section key={cat}>
          <h2 className="mb-2 font-display text-[12px] font-semibold uppercase tracking-[0.16em] text-muted">{cat}</h2>
          <table className="w-full text-[13px]">
            <tbody>
              {rules.filter((r) => r.category === cat).map((r) => (
                <tr key={r.id} className="border-b border-line/60 align-top">
                  <td className="w-10 py-2.5"><input type="checkbox" aria-label={`Enable ${r.name}`} checked={r.active} disabled={!canWrite} onChange={(e) => patch(r.id, { active: e.target.checked })} /></td>
                  <td className="py-2.5 pr-4">
                    <p className={r.active ? "font-medium" : "font-medium text-faint"}>{r.name} <span className="ml-1 font-mono text-[11px] text-faint">{r.key} · v{r.version}</span></p>
                    <p className="text-[12.5px] text-muted">{r.description}</p>
                    {r.params && Object.keys(r.params).length > 0 && <p className="mt-0.5 font-mono text-[11px] text-faint">{Object.entries(r.params).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join("  ")}</p>}
                    {r.sourceRef && <p className="font-mono text-[10.5px] text-faint">source: {r.sourceRef}</p>}
                  </td>
                  <td className="w-36 py-2.5">
                    {canWrite ? (
                      <Select aria-label={`Severity for ${r.name}`} value={r.severity} onChange={(e) => patch(r.id, { severity: e.target.value })} className="h-8">
                        {["info", "warning", "error", "blocker"].map((s) => <option key={s} value={s}>{s}</option>)}
                      </Select>
                    ) : (
                      <Badge tone={severityTone(r.severity)}>{r.severity}</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
