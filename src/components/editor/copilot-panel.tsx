"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Ignore, RefreshCw, Send, X } from "./icons";
import { Droid, type DroidState } from "../droid";
import { Badge, Button, Textarea, severityTone, fmtDate } from "../ui";
import { DiffView } from "./diff-view";
import { useEditor } from "./store";
import { api, HttpError } from "@/lib/api";
import type { LessonDocument } from "@/server/lesson/model";

type Finding = { id: string; ruleKey: string; ruleVersion: number; severity: string; title: string; message: string; evidence: unknown; beatId: string | null; blockId: string | null };
type Proposal = { id: string; findingId: string | null; kind: string; title: string; explanation: string; severity: string; ruleKey: string | null; ruleVersion: number | null; evidence: unknown; patch: unknown; diff: string; baseRevision: number; status: string; createdAt: string; copilotRunId: string | null };
type Run = { id: string; kind: string; workingRevision: number; summary: { counts: { error: number; warning: number; info: number }; exportReady: boolean; rulesEvaluated: number; durationMs: number }; createdAt: string };
type Audit = { run: Run | null; findings: Finding[]; proposals: Proposal[] };
type ChatMsg = { role: "user" | "assistant"; content: string; sources?: { title: string; seedPath: string | null; version: number; heading: string | null }[]; proposals?: { id: string; title: string }[]; provider?: string; model?: string; assumptions?: string[] };

export function CopilotPanel({ canDecide, onDocumentReplaced }: { canDecide: boolean; onDocumentReplaced: (doc: LessonDocument, revision: number) => void }) {
  const projectId = useEditor((s) => s.projectId);
  const wsId = useEditor((s) => s.wsId);
  const revision = useEditor((s) => s.revision);
  const saveState = useEditor((s) => s.saveState);
  const selectedBlockId = useEditor((s) => s.selectedBlockId);
  const selectedBeatId = useEditor((s) => s.selectedBeatId);
  const select = useEditor((s) => s.select);
  const [tab, setTab] = useState<"audit" | "proposals" | "chat">("proposals");
  const [audit, setAudit] = useState<Audit | null>(null);
  const [droid, setDroid] = useState<DroidState>("idle");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [showDecided, setShowDecided] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const a = await api<Audit>(`/api/projects/${projectId}/audit`);
    setAudit(a);
    const open = a.proposals.filter((p) => p.status === "open").length;
    setDroid(open > 0 ? "attention" : a.run ? "done" : "idle");
    return a;
  }, [projectId]);
  useEffect(() => {
    load().catch((e) => setErr(String(e)));
  }, [load]);
  useEffect(() => {
    chatEnd.current?.scrollIntoView({ block: "end" });
  }, [chat]);

  async function runAudit(kind: "quality_audit" | "import_audit" | "export_preflight") {
    setBusy("audit");
    setErr(null);
    setDroid("scanning");
    try {
      const before = audit?.run?.id ?? null;
      await api(`/api/projects/${projectId}/audit`, { method: "POST", json: { kind } });
      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 700));
        const a = await load();
        if (a.run && a.run.id !== before) break;
      }
      setTab("proposals");
    } catch (e) {
      setErr(e instanceof HttpError ? e.message : String(e));
      setDroid("attention");
    } finally {
      setBusy(null);
    }
  }

  async function decide(p: Proposal, decision: "accept" | "reject" | "ignore") {
    if (decision === "accept" && saveState === "dirty") {
      setErr("You have unsaved edits. Wait for autosave to finish, then accept.");
      return;
    }
    setBusy(p.id);
    setErr(null);
    try {
      const r = await api<{ status: string; workingRevision: number }>(`/api/proposals/${p.id}/decide`, { method: "POST", json: { decision } });
      if (decision === "accept") {
        const d = await api<{ document: LessonDocument; revision: number }>(`/api/projects/${projectId}/document`);
        onDocumentReplaced(d.document, d.revision);
      }
      await load();
      void r;
    } catch (e) {
      setErr(e instanceof HttpError ? `${e.message}${e.status === 409 ? " — the proposal was drafted against an older revision. Re-run the audit to refresh it." : ""}` : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function sendChat() {
    const message = input.trim();
    if (!message) return;
    setInput("");
    const history = chat.slice(-10).map((m) => ({ role: m.role, content: m.content }));
    setChat((c) => [...c, { role: "user", content: message }]);
    setBusy("chat");
    setDroid("scanning");
    try {
      const r = await api<{ reply: string; sources: ChatMsg["sources"]; proposals: { id: string; title: string }[]; provider: string; model: string; assumptions: string[] }>(`/api/copilot/chat`, {
        method: "POST",
        json: { workspaceId: wsId, projectId, message, history, selection: { blockId: selectedBlockId ?? undefined, beatId: selectedBeatId ?? undefined } },
      });
      setChat((c) => [...c, { role: "assistant", content: r.reply, sources: r.sources, proposals: r.proposals, provider: r.provider, model: r.model, assumptions: r.assumptions }]);
      if (r.proposals.length) await load();
      else setDroid(audit?.proposals.some((p) => p.status === "open") ? "attention" : "done");
    } catch (e) {
      setChat((c) => [...c, { role: "assistant", content: `Request failed: ${e instanceof HttpError ? e.message : String(e)}` }]);
      setDroid("attention");
    } finally {
      setBusy(null);
    }
  }

  const open = audit?.proposals.filter((p) => p.status === "open") ?? [];
  const decided = audit?.proposals.filter((p) => p.status !== "open") ?? [];
  const counts = audit?.run?.summary.counts;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-line px-3">
        <div className="flex items-center gap-2">
          <Droid size={22} state={droid} />
          <span className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">ID Copilot</span>
        </div>
        <div className="flex gap-0.5 font-mono text-[10.5px] uppercase">
          {(["proposals", "audit", "chat"] as const).map((t) => (
            <button key={t} type="button" aria-pressed={tab === t} onClick={() => setTab(t)} className={`rounded px-2 py-0.5 ${tab === t ? "bg-panel-2 text-ink" : "text-muted hover:text-ink"}`}>{t}{t === "proposals" && open.length ? ` ${open.length}` : ""}</button>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-3 py-2 text-[11.5px] text-muted">
        {audit?.run ? (
          <span>
            {audit.run.kind.replaceAll("_", " ")} · rev {audit.run.workingRevision} · {fmtDate(audit.run.createdAt)}
            {counts && <span className="ml-2"><span className="text-bad">{counts.error}E</span> <span className="text-gold">{counts.warning}W</span> <span className="text-faint">{counts.info}I</span></span>}
            {audit.run.workingRevision !== revision && <span className="ml-2 text-gold">stale (rev {revision} now)</span>}
          </span>
        ) : (
          <span>No audit yet.</span>
        )}
        <div className="flex gap-1">
          <Button size="sm" variant="secondary" disabled={busy === "audit"} onClick={() => runAudit("quality_audit")} title="Evaluate the active workspace quality rules against the working document"><RefreshCw size={12} className={busy === "audit" ? "animate-spin" : ""} /> {audit?.run ? "Re-run audit" : "Run import audit"}</Button>
        </div>
      </div>
      {err && <p role="alert" className="mx-3 mt-2 rounded border border-bad/40 bg-bad/10 px-2.5 py-1.5 text-[12px] text-bad">{err}</p>}

      <div className="min-h-0 flex-1 overflow-auto scroll-thin">
        {tab === "proposals" && (
          <div className="space-y-2 p-3">
            <p className="text-[12px] text-faint">Every proposal is draft-only. Nothing changes in the lesson until you accept it; accepted changes carry the proposal id in their provenance.</p>
            {open.length === 0 && <p className="text-[12.5px] text-muted">No open proposals.{audit?.run ? "" : " Run the import audit to generate repair proposals."}</p>}
            {open.map((p) => <ProposalCard key={p.id} p={p} busy={busy === p.id} canDecide={canDecide} onDecide={decide} onLocate={(id) => select(id)} />)}
            {decided.length > 0 && (
              <details open={showDecided} onToggle={(e) => setShowDecided((e.target as HTMLDetailsElement).open)}>
                <summary className="cursor-pointer text-[12px] text-muted">{decided.length} decided proposals</summary>
                <div className="mt-2 space-y-2">{decided.map((p) => <ProposalCard key={p.id} p={p} busy={false} canDecide={false} onDecide={decide} onLocate={(id) => select(id)} />)}</div>
              </details>
            )}
          </div>
        )}
        {tab === "audit" && (
          <div className="p-3">
            {!audit?.run && <p className="text-[12.5px] text-muted">Run the audit to evaluate the workspace quality rules (QUALITY-BAR, quality-gate, accessibility, beat metadata, event contracts).</p>}
            {audit?.run && (
              <>
                <p className="mb-2 text-[12px] text-faint">{audit.run.summary.rulesEvaluated} rules evaluated in {audit.run.summary.durationMs} ms · export {audit.run.summary.exportReady ? <span className="text-ok">ready</span> : <span className="text-bad">blocked</span>}</p>
                <ul className="space-y-1.5">
                  {audit.findings.map((f) => (
                    <li key={f.id} className="rounded border border-line bg-panel p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-medium">{f.title}</p>
                          <p className="mt-0.5 text-[12px] text-muted">{f.message}</p>
                        </div>
                        <Badge tone={severityTone(f.severity)}>{f.severity}</Badge>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 font-mono text-[10.5px] text-faint">
                        <span>{f.ruleKey} v{f.ruleVersion}</span>
                        {(f.blockId || f.beatId) && <button type="button" className="text-accent hover:underline" onClick={() => select(f.blockId ?? null, f.beatId ?? undefined)}>locate →</button>}
                        {f.evidence != null && <details className="w-full"><summary className="cursor-pointer">evidence</summary><pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap">{JSON.stringify(f.evidence, null, 1)}</pre></details>}
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
        {tab === "chat" && (
          <div className="flex h-full flex-col">
            <div className="flex-1 space-y-3 p-3">
              {chat.length === 0 && (
                <div className="rounded border border-dashed border-line-2 p-3 text-[12.5px] text-muted">
                  <p>Ask about the selected beat or block. Retrieval is role-aware: design, phrasing, alignment, checks, audit, and export roles each read only their relevant workspace documents.</p>
                  <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[12px]">
                    <li>&ldquo;Does this beat meet the check-beat requirements?&rdquo;</li>
                    <li>&ldquo;Tighten this paragraph to the AERO voice.&rdquo;</li>
                    <li>&ldquo;Which objectives should this Lab beat link to?&rdquo;</li>
                  </ul>
                </div>
              )}
              {chat.map((m, i) => (
                <div key={i} className={`rounded-md px-3 py-2 text-[13px] ${m.role === "user" ? "ml-6 bg-panel-2" : "mr-2 border border-line bg-panel"}`}>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-2 border-t border-line pt-1.5">
                      <p className="text-[10.5px] uppercase tracking-wider text-faint">Sources</p>
                      <ul className="mt-0.5 space-y-0.5 text-[11.5px] text-muted">{m.sources.map((s, j) => <li key={j}>{s.title} <span className="text-faint">v{s.version}{s.heading ? ` · ${s.heading}` : ""}</span></li>)}</ul>
                    </div>
                  )}
                  {m.proposals && m.proposals.length > 0 && <p className="mt-1.5 text-[12px] text-gold">Drafted {m.proposals.length} proposal{m.proposals.length > 1 ? "s" : ""} — review in the Proposals tab.</p>}
                  {m.assumptions && m.assumptions.length > 0 && <p className="mt-1 text-[11px] text-faint">Assumptions: {m.assumptions.join("; ")}</p>}
                  {m.provider && <p className="mt-1 font-mono text-[10px] text-faint">{m.provider} · {m.model}</p>}
                </div>
              ))}
              <div ref={chatEnd} />
            </div>
            <form className="sticky bottom-0 flex items-end gap-2 border-t border-line bg-panel p-2.5" onSubmit={(e) => { e.preventDefault(); void sendChat(); }}>
              <Textarea aria-label="Message ID Copilot" rows={2} value={input} disabled={busy === "chat"} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendChat(); } }} placeholder={selectedBlockId ? "Ask about the selected block…" : "Ask about this lesson…"} className="min-h-0 resize-none" />
              <Button type="submit" variant="primary" disabled={busy === "chat" || !input.trim()} aria-label="Send"><Send size={14} /></Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function ProposalCard({ p, busy, canDecide, onDecide, onLocate }: { p: Proposal; busy: boolean; canDecide: boolean; onDecide: (p: Proposal, d: "accept" | "reject" | "ignore") => void; onLocate: (blockId: string) => void }) {
  const [open, setOpen] = useState(p.status === "open");
  const ev = (p.evidence ?? {}) as Record<string, unknown>;
  const blockId = typeof ev.blockId === "string" ? ev.blockId : null;
  return (
    <article className={`rounded-md border ${p.status === "open" ? "border-line-2 bg-panel" : "border-line bg-transparent opacity-80"}`}>
      <header className="flex items-start justify-between gap-2 px-3 pt-2.5">
        <button type="button" className="min-w-0 text-left" onClick={() => setOpen(!open)} aria-expanded={open}>
          <p className="text-[13px] font-medium">{p.title}</p>
          <p className="font-mono text-[10.5px] text-faint">{p.kind}{p.ruleKey ? ` · ${p.ruleKey} v${p.ruleVersion}` : ""} · base rev {p.baseRevision}</p>
        </button>
        <div className="flex shrink-0 items-center gap-1"><Badge tone={severityTone(p.severity)}>{p.severity}</Badge>{p.status !== "open" && <Badge tone={p.status === "accepted" ? "ok" : "muted"}>{p.status}</Badge>}</div>
      </header>
      {open && (
        <div className="space-y-2 px-3 pb-3 pt-2">
          <p className="text-[12.5px] text-muted">{p.explanation}</p>
          {blockId && <button type="button" className="font-mono text-[11px] text-accent hover:underline" onClick={() => onLocate(blockId)}>locate block →</button>}
          <details>
            <summary className="cursor-pointer text-[11.5px] text-faint">Evidence</summary>
            <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded border border-line bg-rail p-2 font-mono text-[10.5px] text-muted">{JSON.stringify(p.evidence, null, 1)}</pre>
          </details>
          <details open>
            <summary className="cursor-pointer text-[11.5px] text-faint">Proposed change (compiled HTML diff)</summary>
            <div className="mt-1"><DiffView diff={p.diff || "(no textual diff — structural or runtime change; see patch)"} /></div>
          </details>
          <details>
            <summary className="cursor-pointer text-[11.5px] text-faint">Structured patch (ops)</summary>
            <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded border border-line bg-rail p-2 font-mono text-[10.5px] text-muted">{JSON.stringify(p.patch, null, 1)}</pre>
          </details>
          {p.status === "open" && canDecide && (
            <div className="flex gap-1.5 pt-1">
              <Button size="sm" variant="ok" disabled={busy} onClick={() => onDecide(p, "accept")}><Check size={12} /> Accept</Button>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => onDecide(p, "reject")}><X size={12} /> Reject</Button>
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => onDecide(p, "ignore")}><Ignore size={12} /> Ignore</Button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
