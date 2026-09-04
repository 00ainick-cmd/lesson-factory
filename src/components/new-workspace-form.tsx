"use client";
import { withBase } from "@/lib/base-path";
import { useState } from "react";
import { Button, Input } from "./ui";
import { api } from "@/lib/api";

export function NewWorkspaceForm() {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <form
      className="mt-5 flex gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr(null);
        try {
          const r = await api<{ workspace: { id: string } }>("/api/workspaces", { method: "POST", json: { name } });
          window.location.assign(withBase(`/w/${r.workspace.id}`));
        } catch (e) {
          setErr(e instanceof Error ? e.message : "Failed");
        } finally {
          setBusy(false);
        }
      }}
    >
      <Input placeholder="New workspace name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Button type="submit" variant="primary" disabled={busy}>{busy ? "Seeding…" : "Create"}</Button>
      {err && <p className="text-bad text-[12px]">{err}</p>}
    </form>
  );
}
