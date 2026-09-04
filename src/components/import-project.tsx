"use client";
import { withBase } from "@/lib/base-path";
import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button, Field, Input } from "./ui";
import { HttpError } from "@/lib/api";

export function ImportProjectDialog({ wsId }: { wsId: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setErr(null);
    const fd = new FormData();
    fd.set("title", title || file.name.replace(/\.html?$/i, ""));
    fd.set("file", file);
    const res = await fetch(withBase(`/api/workspaces/${wsId}/projects`), { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr((data as { error?: string }).error ?? `Upload failed (${res.status})`);
      return;
    }
    ref.current?.close();
    window.location.assign(withBase(`/w/${wsId}/projects/${(data as { project: { id: string } }).project.id}`));
  }
  return (
    <>
      <Button variant="primary" onClick={() => ref.current?.showModal()}><Upload size={14} /> Import lesson</Button>
      <dialog ref={ref} className="w-[460px] rounded-md border border-line bg-panel p-0 text-ink backdrop:bg-black/60" onClose={() => setErr(null)}>
        <form onSubmit={submit} className="p-5">
          <h2 className="font-display text-[17px] font-semibold">Import a lesson</h2>
          <p className="mt-1 text-[12.5px] text-muted">Self-contained HTML only (Phase 1). The upload is stored as an immutable original with a SHA-256 fingerprint; edits happen on a separate working copy.</p>
          <div className="mt-4 space-y-3">
            <Field label="Project title" id="imp-title"><Input id="imp-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={file ? file.name.replace(/\.html?$/i, "") : "e.g. Resistance"} /></Field>
            <Field label="Lesson file (.html)" id="imp-file">
              <input id="imp-file" type="file" accept=".html,.htm,text/html" required onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-[13px] text-muted file:mr-3 file:rounded file:border file:border-line-2 file:bg-rail file:px-3 file:py-1.5 file:text-ink" />
            </Field>
          </div>
          {err && <p role="alert" className="mt-3 rounded border border-bad/40 bg-bad/10 px-3 py-2 text-[13px] text-bad">{err}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => ref.current?.close()}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={busy || !file}>{busy ? "Importing…" : "Import"}</Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
