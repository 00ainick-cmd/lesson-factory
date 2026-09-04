"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthFrame } from "@/components/auth-frame";
import { Button, Field, Input } from "@/components/ui";
import { api, HttpError } from "@/lib/api";

export default function SetupPage() {
  const router = useRouter();
  const [needs, setNeeds] = useState<boolean | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", workspaceName: "AERO Studio" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api<{ needsSetup: boolean }>("/api/auth/setup").then((r) => setNeeds(r.needsSetup)).catch(() => setNeeds(false));
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ workspace: { id: string } }>("/api/auth/setup", { method: "POST", json: form });
      router.push(`/w/${r.workspace.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "Setup failed");
    } finally {
      setBusy(false);
    }
  }
  if (needs === null) return <AuthFrame title="Checking…"><p className="text-muted">One moment.</p></AuthFrame>;
  if (!needs)
    return (
      <AuthFrame title="Setup already completed" subtitle="An administrator account exists. Sign in or ask an admin for an invite.">
        <Button variant="primary" className="w-full" onClick={() => router.push("/login")}>Go to sign in</Button>
      </AuthFrame>
    );
  return (
    <AuthFrame title="First-run setup" subtitle="Create the platform administrator and the first workspace. The seed kit's guidance is copied into the workspace as editable documents.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Your name" id="name"><Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Email" id="email"><Input id="email" type="email" required autoComplete="username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Password" id="pw" hint="At least 10 characters."><Input id="pw" type="password" required minLength={10} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        <Field label="Workspace name" id="ws"><Input id="ws" required value={form.workspaceName} onChange={(e) => setForm({ ...form, workspaceName: e.target.value })} /></Field>
        {error && <p role="alert" className="rounded border border-bad/40 bg-bad/10 px-3 py-2 text-[13px] text-bad">{error}</p>}
        <Button type="submit" variant="primary" className="w-full" disabled={busy}>{busy ? "Seeding workspace…" : "Create studio"}</Button>
      </form>
    </AuthFrame>
  );
}
