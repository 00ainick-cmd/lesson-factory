"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileCheck2, Play, RotateCcw } from "lucide-react";
import { Badge, Button, Card, Empty, Field, Input, fmtDate } from "./ui";
import { api, HttpError } from "@/lib/api";
import { Droid } from "./droid";

type Version = { id: string; number: number; name: string; note: string | null; contentHash: string; createdAt: string };
type Export = { id: string; format: string; status: string; createdAt: string; versionId: string | null; validationReport: unknown; artifactId: string | null };
type Validation = { ok: boolean; durationMs: number; title: string | null; beatsRendered: number; autoSolveRan: boolean; completionReached: boolean | null; blocking: { message: string }[]; warnings: { message: string }[]; consoleLog: string[] } | null;
type AuditSummary = { run: { id: string; kind: string; createdAt: string; summary: unknown } | null; findings: number; openProposals: number };

export function ProjectPanels({ projectId, wsId, canWrite, versions, exportsInit, audit }: { projectId: string; wsId: string; canWrite: boolean; versions: Version[]; exportsInit: Export[]; audit: AuditSummary }) {
  const router = useRouter();
  const [exportsList, setExports] = useState<Export[]>(exportsInit);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [vName, setVName] = useState("");
  const [vNote, setVNote] = useState("");
  const [exportVersion, setExportVersion] = useState<string>("");

  const pending = exportsList.some((e) => e.status === "queued" || e.status === "building" || e.status === "validating");
  useEffect(() => {
    if (!pending) return;
    const t = setInterval(async () => {
      const r = await api<{ exports: Export[] }>(`/api/projects/${projectId}/exports`).catch(() => null);
      if (r) setExports(r.exports);
    }, 1500);
    return () => clearInterval(t);
  }, [pending, projectId]);

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(label);
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof HttpError ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }
  const counts = (audit.run?.summary as { counts?: { error: number; warning: number; info: number } } | null)?.counts;

  return (
    <div className="space-y-5">
      <Card title="ID Copilot audit" actions={<Droid size={28} state={audit.openProposals > 0 ? "attention" : audit.run ? "done" : "idle"} />}>
        {audit.run ? (
          <div className="text-[13px]">
            <p className="text-muted">Last run <span className="text-ink">{audit.run.kind.replace("_", " ")}</span> · {fmtDate(audit.run.createdAt)}</p>
            <div className="mt-2 flex gap-2">
              <Badge tone="bad">{counts?.error ?? 0} errors</Badge>
              <Badge tone="gold">{counts?.warning ?? 0} warnings</Badge>
              <Badge tone="info">{counts?.info ?? 0} info</Badge>
              <Badge tone={audit.openProposals ? "accent" : "muted"}>{audit.openProposals} open proposals</Badge>
            </div>
            <a href={`/w/${wsId}/projects/${projectId}/editor?panel=copilot`} className="mt-3 inline-block text-accent hover:underline">Review in editor →</a>
          </div>
        ) : (
          <p className="text-[13px] text-muted">No audit yet. Open the editor and run an Import Audit.</p>
        )}
      </Card>

      <Card title={`Named versions (${versions.length})`}>
        {canWrite && (
          <form
            className="mb-4 flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              run("version", async () => {
                await api(`/api/projects/${projectId}/versions`, { method: "POST", json: { name: vName, note: vNote || undefined } });
                setVName("");
                setVNote("");
                router.refresh();
              });
            }}
          >
            <Field label="Version name" id="vname"><Input id="vname" required value={vName} onChange={(e) => setVName(e.target.value)} placeholder="e.g. Gold import baseline" /></Field>
            <Field label="Note" id="vnote"><Input id="vnote" value={vNote} onChange={(e) => setVNote(e.target.value)} placeholder="optional" /></Field>
            <Button type="submit" variant="primary" disabled={busy === "version"}>Save version</Button>
          </form>
        )}
        {versions.length === 0 ? <p className="text-[13px] text-muted">No named versions yet. Versions snapshot the working document and its content hash.</p> : (
          <ul className="divide-y divide-line text-[13px]">
            {versions.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate"><span className="font-mono text-muted">v{v.number}</span> <span className="font-medium">{v.name}</span>{v.note && <span className="text-muted"> — {v.note}</span>}</p>
                  <p className="font-mono text-[11px] text-faint">{v.contentHash.slice(0, 16)} · {fmtDate(v.createdAt)}</p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <a className="inline-flex h-7 items-center gap-1 rounded border border-line-2 px-2 text-[12px] text-muted hover:text-ink" href={`/api/preview/${projectId}?versionId=${v.id}&mode=learner`} target="_blank" rel="noreferrer"><Play size={12} /> Preview</a>
                  {canWrite && (
                    <Button size="sm" variant="ghost" title="Restore this version as the working document" onClick={() => confirm(`Restore v${v.number} "${v.name}" as the working document? The current working state is snapshotted first.`) && run("restore", async () => { await api(`/api/projects/${projectId}/versions/${v.id}/restore`, { method: "POST" }); router.refresh(); })}><RotateCcw size={12} /> Restore</Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Exports">
        {canWrite && (
          <div className="mb-4 flex items-end gap-2">
            <Field label="Source" id="exp-v">
              <select id="exp-v" className="h-9 w-full rounded border border-line-2 bg-rail px-2 text-[13px]" value={exportVersion} onChange={(e) => setExportVersion(e.target.value)}>
                <option value="">Working document (current)</option>
                {versions.map((v) => <option key={v.id} value={v.id}>v{v.number} — {v.name}</option>)}
              </select>
            </Field>
            <Button variant="primary" disabled={busy === "export"} onClick={() => run("export", async () => { await api(`/api/projects/${projectId}/exports`, { method: "POST", json: { format: "standalone_html", versionId: exportVersion || undefined } }); const r = await api<{ exports: Export[] }>(`/api/projects/${projectId}/exports`); setExports(r.exports); })}><FileCheck2 size={14} /> Export standalone HTML</Button>
          </div>
        )}
        <p className="mb-3 text-[12px] text-faint">Each export is compiled, then opened in a clean headless Chromium session. Blocking console errors fail the export; CSP-meta notices and missing-asset 404s are advisory.</p>
        {exportsList.length === 0 ? <Empty title="No exports yet" /> : (
          <ul className="divide-y divide-line text-[13px]">
            {exportsList.map((e) => {
              const v = e.validationReport as Validation;
              return (
                <li key={e.id} className="py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="font-mono text-[11.5px] text-muted">{e.format}</span> <Badge tone={e.status === "passed" ? "ok" : e.status === "failed" ? "bad" : "gold"}>{e.status}</Badge>
                      <span className="ml-2 text-[11.5px] text-faint">{fmtDate(e.createdAt)}</span>
                    </div>
                    {e.artifactId && <a className="inline-flex h-7 items-center gap-1 rounded border border-line-2 px-2 text-[12px] text-ink hover:border-accent" href={`/api/projects/${projectId}/exports/${e.id}/download`}><Download size={12} /> Download</a>}
                  </div>
                  {v && (
                    <details className="mt-1.5">
                      <summary className="cursor-pointer text-[12px] text-muted">
                        Validation: {v.blocking.length} blocking · {v.warnings.length} advisory · {v.beatsRendered} beats rendered · autosolve {v.autoSolveRan ? "ran" : "n/a"} · completion {v.completionReached === null ? "n/a" : v.completionReached ? "reached" : "not reached"} · {v.durationMs} ms
                      </summary>
                      <div className="mt-2 space-y-1 font-mono text-[11.5px]">
                        {v.blocking.map((b, i) => <p key={i} className="text-bad">{b.message}</p>)}
                        {v.warnings.map((w, i) => <p key={i} className="text-gold/80">{w.message}</p>)}
                        {v.consoleLog.length > 0 && <details><summary className="text-faint">console ({v.consoleLog.length})</summary><pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap text-faint">{v.consoleLog.join("\n")}</pre></details>}
                      </div>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      {err && <p role="alert" className="rounded border border-bad/40 bg-bad/10 px-3 py-2 text-[13px] text-bad">{err}</p>}
    </div>
  );
}
