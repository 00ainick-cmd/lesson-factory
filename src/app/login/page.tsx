"use client";
import { withBase } from "@/lib/base-path";
import { useState } from "react";
import { AuthFrame } from "@/components/auth-frame";
import { Button, Field, Input } from "@/components/ui";
import { api, HttpError } from "@/lib/api";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/auth/login", { method: "POST", json: { password } });
      window.location.assign(withBase("/"));
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "Could not unlock workspace");
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthFrame title="Enter workspace" subtitle="Enter the shared password to open Lesson Factory Studio." footer="Password protected">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Shared password" id="password">
          <Input id="password" type="password" autoComplete="current-password" autoFocus required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error && <p role="alert" className="rounded border border-bad/40 bg-bad/10 px-3 py-2 text-[13px] text-bad">{error}</p>}
        <Button type="submit" variant="primary" className="w-full" disabled={busy}>{busy ? "Unlocking…" : "Unlock workspace"}</Button>
      </form>
    </AuthFrame>
  );
}
