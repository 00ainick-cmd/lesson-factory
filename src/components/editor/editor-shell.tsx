"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Bot, Download, Redo2, SlidersHorizontal, Tag, Undo2 } from "lucide-react";
import type { LessonDocument } from "@/server/lesson/model";
import { useEditor } from "./store";
import { BeatMap } from "./beat-map";
import { PreviewPane } from "./preview-pane";
import { Inspector } from "./inspector";
import { CopilotPanel } from "./copilot-panel";
import { Button, Input, Textarea } from "../ui";
import { Logo } from "../logo";
import { api, HttpError } from "@/lib/api";

type Props = { projectId: string; wsId: string; role: string; initialTab: "inspector" | "copilot"; beatTypes: { key: string; name: string }[]; objectives: { code: string; wording: string }[] };

export function EditorShell({ projectId, wsId, role, initialTab, beatTypes, objectives }: Props) {
  const canWrite = role === "admin" || role === "author";
  const canDecide = canWrite || role === "reviewer";
  const s = useEditor();
  const [loading, setLoading] = useState<string | null>("Loading lesson…");
  const [dialog, setDialog] = useState<"version" | "export" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conflictRev = useRef<number | null>(null);
  const saveRef = useRef<() => Promise<void>>(async () => {});
  const schedule = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void saveRef.current(), 900);
  }, []);

  // Load document
  useEffect(() => {
    api<{ document: LessonDocument; revision: number }>(`/api/projects/${projectId}/document`)
      .then((r) => {
        useEditor.getState().init({ projectId, wsId, doc: r.document, revision: r.revision });
        useEditor.getState().setRightTab(initialTab);
        setLoading(null);
      })
      .catch((e) => setLoading(`Could not load: ${e instanceof HttpError ? e.message : String(e)}`));
  }, [projectId, wsId, initialTab]);

  // Debounced autosave with optimistic concurrency
  const save = useCallback(async () => {
    const st = useEditor.getState();
    if (!st.doc || st.saveState === "conflict") return;
    st.setSave("saving");
    const base = st.revision;
    const opTypes = st.takeOpTypes();
    try {
      const r = await api<{ revision: number }>(`/api/projects/${projectId}/document`, { method: "PUT", json: { baseRevision: base, document: st.doc, opTypes } });
      // Only mark saved if nothing changed while the request was in flight.
      if (useEditor.getState().doc === st.doc) useEditor.getState().markSaved(r.revision);
      else {
        useEditor.setState({ revision: r.revision, saveState: "dirty" });
        schedule();
      }
    } catch (e) {
      if (e instanceof HttpError && e.status === 409) {
        conflictRev.current = (e.details as { revision?: number } | undefined)?.revision ?? null;
        useEditor.getState().setSave("conflict", e.message);
      } else useEditor.getState().setSave("error", e instanceof HttpError ? e.message : String(e));
    }
  }, [projectId, schedule]);
  saveRef.current = save;
  useEffect(() => {
    if (s.saveState === "dirty" && canWrite) schedule();
  }, [s.saveState, s.doc, canWrite, schedule]);
  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (useEditor.getState().saveState === "dirty" || useEditor.getState().saveState === "saving") e.preventDefault();
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const target = e.target as HTMLElement | null;
      const inEditable = target && (target.isContentEditable || /^(INPUT|TEXTAREA)$/.test(target.tagName));
      if (e.key.toLowerCase() === "z" && !inEditable) {
        e.preventDefault();
        if (e.shiftKey) useEditor.getState().redo();
        else useEditor.getState().undo();
      }
      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (saveTimer.current) clearTimeout(saveTimer.current);
        void save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  async function reloadServerCopy() {
    const r = await api<{ document: LessonDocument; revision: number }>(`/api/projects/${projectId}/document`);
    useEditor.getState().replaceDoc(r.document, r.revision);
    useEditor.getState().setSave("saved");
  }

  const onDocumentReplaced = useCallback((doc: LessonDocument, revision: number) => {
    useEditor.getState().replaceDoc(doc, revision);
    useEditor.getState().setSave("saved");
    setToast("Proposal accepted and applied to the working document.");
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-40 grid place-items-center bg-shell text-muted">
        <div className="text-center"><Logo size={36} /><p className="mt-3 text-[13px]">{loading}</p>{loading.startsWith("Could not") && <Link href={`/w/${wsId}/projects/${projectId}`} className="mt-2 inline-block text-accent underline">Back to project</Link>}</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-shell text-ink">
      <header className="flex h-11 shrink-0 items-center gap-3 border-b border-line bg-rail px-3">
        <Link href={`/w/${wsId}/projects/${projectId}`} className="flex items-center gap-1.5 text-[12.5px] text-muted hover:text-ink" aria-label="Back to project overview"><ArrowLeft size={14} /> Project</Link>
        <span className="h-4 w-px bg-line-2" />
        <input
          aria-label="Lesson title"
          className="min-w-0 flex-1 bg-transparent font-display text-[15px] font-semibold text-ink outline-none focus:border-b focus:border-accent"
          defaultValue={s.doc?.title ?? ""}
          readOnly={!canWrite}
          onBlur={(e) => {
            const t = e.target.value.trim();
            if (t && t !== s.doc?.title) s.apply([{ type: "set-title", title: t }], { live: { reload: true } });
          }}
        />
        <SaveIndicator state={s.saveState} error={s.saveError} onRetry={() => void save()} onReload={reloadServerCopy} conflictRev={conflictRev.current} />
        <div className="flex items-center gap-0.5">
          <Button size="sm" variant="ghost" aria-label="Undo" title="Undo (⌘Z)" disabled={s.past.length === 0} onClick={s.undo}><Undo2 size={14} /></Button>
          <Button size="sm" variant="ghost" aria-label="Redo" title="Redo (⇧⌘Z)" disabled={s.future.length === 0} onClick={s.redo}><Redo2 size={14} /></Button>
        </div>
        <span className="h-4 w-px bg-line-2" />
        <div className="flex rounded border border-line-2 font-mono text-[10.5px] uppercase" role="group" aria-label="Preview mode">
          {(["author", "learner"] as const).map((m) => <button key={m} type="button" aria-pressed={s.previewMode === m} onClick={() => s.setPreviewMode(m)} className={`px-2 py-0.5 ${s.previewMode === m ? "bg-panel-2 text-ink" : "text-muted hover:text-ink"}`}>{m}</button>)}
        </div>
        {canWrite && <Button size="sm" variant="secondary" onClick={() => setDialog("version")}><Tag size={13} /> Save version</Button>}
        {canWrite && <Button size="sm" variant="primary" onClick={() => setDialog("export")}><Download size={13} /> Export</Button>}
        <span className="h-4 w-px bg-line-2" />
        <div className="flex rounded border border-line-2 text-[12px]" role="tablist" aria-label="Right panel">
          <button role="tab" aria-selected={s.rightTab === "inspector"} onClick={() => s.setRightTab("inspector")} className={`flex items-center gap-1 px-2.5 py-1 ${s.rightTab === "inspector" ? "bg-panel-2 text-ink" : "text-muted hover:text-ink"}`}><SlidersHorizontal size={13} /> Inspector</button>
          <button role="tab" aria-selected={s.rightTab === "copilot"} onClick={() => s.setRightTab("copilot")} className={`flex items-center gap-1 px-2.5 py-1 ${s.rightTab === "copilot" ? "bg-panel-2 text-ink" : "text-muted hover:text-ink"}`}><Bot size={13} /> ID Copilot</button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)_380px]">
        <aside className="min-h-0 border-r border-line bg-rail" aria-label="Beat map"><BeatMap canWrite={canWrite} /></aside>
        <main className="min-h-0 min-w-0 bg-shell grid-bg"><PreviewPane /></main>
        <aside className="min-h-0 border-l border-line bg-rail" aria-label={s.rightTab === "inspector" ? "Inspector" : "ID Copilot"}>
          {s.rightTab === "inspector" ? <Inspector canWrite={canWrite} beatTypes={beatTypes} objectives={objectives} /> : <CopilotPanel canDecide={canDecide} onDocumentReplaced={onDocumentReplaced} />}
        </aside>
      </div>

      {s.previewErrors.length > 0 && (
        <div role="status" className="absolute bottom-3 left-[292px] max-w-md rounded border border-bad/40 bg-rail/95 px-3 py-2 text-[12px] text-bad shadow-lg">
          <p className="font-medium">Preview runtime error{s.previewErrors.length > 1 ? "s" : ""}</p>
          <ul className="mt-1 space-y-0.5 font-mono text-[11px]">{s.previewErrors.slice(-3).map((e, i) => <li key={i}>{e.message}</li>)}</ul>
        </div>
      )}
      {toast && <div role="status" className="absolute bottom-3 right-[392px] rounded border border-ok/40 bg-rail/95 px-3 py-2 text-[12.5px] text-ok shadow-lg">{toast}</div>}

      {dialog === "version" && <VersionDialog projectId={projectId} onClose={() => setDialog(null)} onDone={(n) => { setDialog(null); setToast(`Saved version ${n}.`); }} saveState={s.saveState} onFlush={save} />}
      {dialog === "export" && <ExportDialog projectId={projectId} wsId={wsId} onClose={() => setDialog(null)} saveState={s.saveState} onFlush={save} />}
    </div>
  );
}

function SaveIndicator({ state, error, onRetry, onReload, conflictRev }: { state: string; error: string | null; onRetry: () => void; onReload: () => Promise<void>; conflictRev: number | null }) {
  const dot = state === "saved" || state === "idle" ? "bg-ok" : state === "saving" || state === "dirty" ? "bg-gold" : "bg-bad";
  const label = state === "idle" ? "Up to date" : state === "dirty" ? "Unsaved edits" : state === "saving" ? "Saving…" : state === "saved" ? "Saved" : state === "conflict" ? "Conflict" : "Save failed";
  return (
    <div className="flex items-center gap-2 text-[12px] text-muted" aria-live="polite">
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${dot} ${state === "saving" ? "animate-pulse" : ""}`} aria-hidden />
      <span>{label}</span>
      {state === "error" && <button type="button" className="text-accent underline" onClick={onRetry} title={error ?? undefined}>Retry</button>}
      {state === "conflict" && (
        <span className="flex items-center gap-1.5 text-bad">
          <span title={error ?? undefined}>server is at rev {conflictRev ?? "?"}</span>
          <button type="button" className="text-accent underline" onClick={() => void onReload()}>Reload server copy</button>
        </span>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-black/50" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className="w-[440px] rounded-lg border border-line-2 bg-panel p-5 shadow-2xl">
        <h2 id="modal-title" className="font-display text-[16px] font-semibold">{title}</h2>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

function VersionDialog({ projectId, onClose, onDone, saveState, onFlush }: { projectId: string; onClose: () => void; onDone: (n: number) => void; saveState: string; onFlush: () => Promise<void> }) {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Modal title="Save named version" onClose={onClose}>
      <form className="space-y-3" onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr(null);
        try {
          if (saveState === "dirty" || saveState === "saving") await onFlush();
          const r = await api<{ version: { number: number } }>(`/api/projects/${projectId}/versions`, { method: "POST", json: { name, note: note || undefined } });
          onDone(r.version.number);
        } catch (er) {
          setErr(er instanceof HttpError ? er.message : String(er));
        } finally {
          setBusy(false);
        }
      }}>
        <p className="text-[12.5px] text-muted">A version is an immutable, content-hashed snapshot of the working document. Approvals and exports reference a version hash.</p>
        <label className="block text-[12px] text-muted">Name<Input required autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alt text pass complete" className="mt-1" /></label>
        <label className="block text-[12px] text-muted">Note (optional)<Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="mt-1" /></label>
        {err && <p role="alert" className="text-[12px] text-bad">{err}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" variant="primary" disabled={busy || !name.trim()}>{busy ? "Saving…" : "Save version"}</Button></div>
      </form>
    </Modal>
  );
}

function ExportDialog({ projectId, wsId, onClose, saveState, onFlush }: { projectId: string; wsId: string; onClose: () => void; saveState: string; onFlush: () => Promise<void> }) {
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; status: string; report?: { ok?: boolean; blocking?: unknown[]; warnings?: unknown[] } | null } | null>(null);
  async function run() {
    setState("running");
    setMsg(null);
    try {
      if (saveState === "dirty" || saveState === "saving") await onFlush();
      const r = await api<{ export: { id: string } } | { id: string }>(`/api/projects/${projectId}/exports`, { method: "POST", json: { format: "standalone_html", validate: true } });
      const id = "export" in r ? r.export.id : r.id;
      for (let i = 0; i < 60; i++) {
        await new Promise((res) => setTimeout(res, 1000));
        const list = await api<{ exports: { id: string; status: string; validationReport?: unknown; report?: unknown }[] }>(`/api/projects/${projectId}/exports`);
        const ex = list.exports.find((x) => x.id === id);
        if (ex && (ex.status === "passed" || ex.status === "failed")) {
          setResult({ id, status: ex.status, report: (ex.validationReport ?? ex.report ?? null) as never });
          setState("done");
          return;
        }
      }
      setMsg("Export is still running; check the project overview for its result.");
      setState("done");
    } catch (e) {
      setMsg(e instanceof HttpError ? e.message : String(e));
      setState("error");
    }
  }
  return (
    <Modal title="Export standalone HTML" onClose={onClose}>
      <p className="text-[12.5px] text-muted">Compiles the working document to a single self-contained HTML file, then validates it in a clean headless browser (console errors, interaction contract, blocking runtime failures) before it is offered for download.</p>
      {state === "idle" && <div className="mt-4 flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={() => void run()}>Export and validate</Button></div>}
      {state === "running" && <p className="mt-4 text-[13px] text-gold">Compiling and validating… this runs a headless browser and usually takes 5–15 seconds.</p>}
      {(state === "done" || state === "error") && (
        <div className="mt-4 space-y-2 text-[13px]">
          {result && <p className={result.status === "passed" ? "text-ok" : "text-bad"}>Export {result.status}{result.report && Array.isArray(result.report.blocking) ? ` · ${result.report.blocking.length} blocking, ${result.report.warnings?.length ?? 0} warnings` : ""}</p>}
          {msg && <p className={state === "error" ? "text-bad" : "text-muted"}>{msg}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Close</Button>
            {result && result.status === "passed" && <a className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[13px] font-medium text-white hover:bg-accent-dim" href={`/api/projects/${projectId}/exports/${result.id}/download`}>Download HTML</a>}
            <Link href={`/w/${wsId}/projects/${projectId}#exports`} className="inline-flex items-center rounded-md border border-line-2 px-3 py-1.5 text-[13px] text-muted hover:text-ink">Export history</Link>
          </div>
        </div>
      )}
    </Modal>
  );
}
