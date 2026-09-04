"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Field, Input, Textarea, fmtDate } from "./ui";
import { api, HttpError } from "@/lib/api";

const ROLES = ["design", "phrasing", "alignment", "checks", "audit", "export", "reference"];
type Version = { id: string; number: number; contentSha256: string; isBaseline: boolean; note: string | null; createdAt: string };

export function KnowledgeEditor({ docId, canWrite, initial, versions }: { docId: string; canWrite: boolean; initial: { content: string; version: number; roles: string[]; active: boolean; baselineSha256: string | null; contentSha256: string }; versions: Version[] }) {
  const router = useRouter();
  const [content, setContent] = useState(initial.content);
  const [roles, setRoles] = useState(initial.roles);
  const [active, setActive] = useState(initial.active);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [viewing, setViewing] = useState<{ number: number; content: string } | null>(null);
  const dirty = content !== initial.content || roles.join() !== initial.roles.join() || active !== initial.active;

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      await api(`/api/knowledge/${docId}`, { method: "PUT", json: { content, note: note || undefined, roles, active, expectedVersion: initial.version } });
      setMsg({ tone: "ok", text: "Saved as a new version and re-indexed for Copilot retrieval." });
      setNote("");
      router.refresh();
    } catch (e) {
      setMsg({ tone: "bad", text: e instanceof HttpError ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }
  async function restore() {
    if (!confirm("Restore the seed-kit baseline text? Your current version stays in history.")) return;
    setBusy(true);
    try {
      await api(`/api/knowledge/${docId}/restore-baseline`, { method: "POST" });
      router.refresh();
      const fresh = await api<{ document: { content: string } }>(`/api/knowledge/${docId}`);
      setContent(fresh.document.content);
      setMsg({ tone: "ok", text: "Baseline restored." });
    } catch (e) {
      setMsg({ tone: "bad", text: e instanceof HttpError ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }
  async function view(v: Version) {
    const r = await api<{ version: { content: string } }>(`/api/knowledge/${docId}/versions/${v.id}`);
    setViewing({ number: v.number, content: r.version.content });
  }

  return (
    <div className="grid gap-6 px-8 py-6 xl:grid-cols-[1fr_320px]">
      <div>
        <Textarea aria-label="Document Markdown" className="min-h-[70vh] font-mono text-[12.5px] leading-relaxed" value={content} onChange={(e) => setContent(e.target.value)} readOnly={!canWrite} spellCheck={false} />
        {canWrite && (
          <div className="mt-3 flex items-end gap-2">
            <Field label="Version note" id="note"><Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What changed and why" /></Field>
            <Button variant="primary" onClick={save} disabled={!dirty || busy}>{busy ? "Saving…" : "Save new version"}</Button>
            {initial.baselineSha256 && <Button variant="ghost" onClick={restore} disabled={busy}>Restore baseline</Button>}
          </div>
        )}
        {msg && <p role="status" className={`mt-3 text-[13px] ${msg.tone === "ok" ? "text-ok" : "text-bad"}`}>{msg.text}</p>}
      </div>
      <aside className="space-y-5">
        <section className="rounded-md border border-line bg-panel p-4">
          <h3 className="mb-2 font-display text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Copilot roles</h3>
          <p className="mb-2 text-[12px] text-faint">Which assistant roles may retrieve from this document.</p>
          <div className="flex flex-wrap gap-1.5">
            {ROLES.map((r) => (
              <button key={r} type="button" disabled={!canWrite} aria-pressed={roles.includes(r)} onClick={() => setRoles(roles.includes(r) ? roles.filter((x) => x !== r) : [...roles, r])} className={`rounded-sm border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider ${roles.includes(r) ? "border-accent text-accent" : "border-line-2 text-faint"}`}>{r}</button>
            ))}
          </div>
          <label className="mt-3 flex items-center gap-2 text-[13px]"><input type="checkbox" checked={active} disabled={!canWrite} onChange={(e) => setActive(e.target.checked)} /> Active for retrieval</label>
        </section>
        <section className="rounded-md border border-line bg-panel p-4">
          <h3 className="mb-2 font-display text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Baseline</h3>
          <dl className="text-[12px]">
            <dt className="text-faint">Seed baseline</dt><dd className="break-all font-mono text-[11px]">{initial.baselineSha256 ?? "—"}</dd>
            <dt className="mt-1.5 text-faint">Current</dt><dd className="break-all font-mono text-[11px]">{initial.contentSha256}</dd>
          </dl>
        </section>
        <section className="rounded-md border border-line bg-panel p-4">
          <h3 className="mb-2 font-display text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Versions ({versions.length})</h3>
          <ul className="divide-y divide-line text-[12.5px]">
            {versions.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-2 py-1.5">
                <div className="min-w-0">
                  <p className="truncate"><span className="font-mono text-muted">v{v.number}</span> {v.note ?? ""} {v.isBaseline && <Badge tone="ok">baseline</Badge>}</p>
                  <p className="font-mono text-[10.5px] text-faint">{v.contentSha256.slice(0, 12)} · {fmtDate(v.createdAt)}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => view(v)}>View</Button>
              </li>
            ))}
          </ul>
        </section>
      </aside>
      {viewing && (
        <div role="dialog" aria-modal="true" aria-label={`Version ${viewing.number}`} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-8" onClick={() => setViewing(null)}>
          <div className="flex max-h-full w-full max-w-4xl flex-col rounded-md border border-line bg-panel" onClick={(e) => e.stopPropagation()}>
            <header className="flex items-center justify-between border-b border-line px-4 py-2.5"><h3 className="font-display text-[14px] font-semibold">Version {viewing.number}</h3><Button size="sm" variant="ghost" onClick={() => setViewing(null)}>Close</Button></header>
            <pre className="overflow-auto whitespace-pre-wrap p-4 font-mono text-[12px] leading-relaxed scroll-thin">{viewing.content}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
