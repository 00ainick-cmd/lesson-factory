"use client";
import { withBase } from "@/lib/base-path";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AuthFrame } from "@/components/auth-frame";
import { Button, Field, Input } from "@/components/ui";
import { api, HttpError } from "@/lib/api";

type Info = { email: string; role: string; workspace: { id: string; name: string }; hasAccount: boolean; signedIn: boolean };

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const [info, setInfo] = useState<Info | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", password: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api<Info>(`/api/invites/${token}/accept`).then(setInfo).catch((e) => setError(e instanceof HttpError ? e.message : "Invite not found"));
  }, [token]);
  async function accept(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ workspace: { id: string } }>(`/api/invites/${token}/accept`, { method: "POST", json: info?.signedIn || info?.hasAccount ? {} : form });
      window.location.assign(withBase(`/w/${r.workspace.id}`));
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "Could not accept invite");
    } finally {
      setBusy(false);
    }
  }
  if (error && !info) return <AuthFrame title="Invite unavailable" subtitle={error}><Button className="w-full" onClick={() => window.location.assign(withBase("/login"))}>Sign in</Button></AuthFrame>;
  if (!info) return <AuthFrame title="Checking invite…"><p className="text-muted">One moment.</p></AuthFrame>;
  const needsAccount = !info.signedIn && !info.hasAccount;
  return (
    <AuthFrame title={`Join ${info.workspace.name}`} subtitle={`You were invited as ${info.role} (${info.email}).`}>
      <form onSubmit={accept} className="space-y-4">
        {needsAccount && (
          <>
            <Field label="Your name" id="name"><Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Choose a password" id="pw" hint="At least 10 characters."><Input id="pw" type="password" minLength={10} required autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
          </>
        )}
        {info.hasAccount && !info.signedIn && <p className="text-[13px] text-muted">You already have an account. <a className="text-accent underline" href={withBase("/login")}>Sign in</a> first, then open this link again.</p>}
        {error && <p role="alert" className="rounded border border-bad/40 bg-bad/10 px-3 py-2 text-[13px] text-bad">{error}</p>}
        <Button type="submit" variant="primary" className="w-full" disabled={busy || (info.hasAccount && !info.signedIn)}>{busy ? "Joining…" : "Accept invite"}</Button>
      </form>
    </AuthFrame>
  );
}
