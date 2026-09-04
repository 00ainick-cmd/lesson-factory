"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Field, Input, Select, fmtDate } from "./ui";
import { api, HttpError } from "@/lib/api";

type Member = { id: string; userId: string; email: string; name: string; role: string; since: string };
type Invite = { id: string; email: string; role: string; expiresAt: string; acceptedAt: string | null; createdAt: string };

export function MembersPanel({ wsId, members, invites }: { wsId: string; members: Member[]; invites: Invite[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("author");
  const [link, setLink] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="grid gap-5 px-8 py-6 xl:grid-cols-2">
      <Card title={`Members (${members.length})`}>
        <ul className="divide-y divide-line text-[13px]">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 py-2">
              <div><p>{m.name}</p><p className="text-[11.5px] text-faint">{m.email} · since {fmtDate(m.since)}</p></div>
              <Select aria-label={`Role for ${m.name}`} className="w-32 h-8" value={m.role} onChange={async (e) => { try { await api(`/api/members/${m.id}`, { method: "PATCH", json: { workspaceId: wsId, role: e.target.value } }); router.refresh(); } catch (er) { setErr(er instanceof HttpError ? er.message : String(er)); } }}>
                {["admin", "author", "reviewer"].map((r) => <option key={r}>{r}</option>)}
              </Select>
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Invite">
        <form className="flex items-end gap-2" onSubmit={async (e) => { e.preventDefault(); setErr(null); try { const r = await api<{ link: string }>(`/api/workspaces/${wsId}/invites`, { method: "POST", json: { email, role } }); setLink(r.link); setEmail(""); router.refresh(); } catch (er) { setErr(er instanceof HttpError ? er.message : String(er)); } }}>
          <Field label="Email" id="inv-email"><Input id="inv-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Role" id="inv-role"><Select id="inv-role" value={role} onChange={(e) => setRole(e.target.value)}>{["admin", "author", "reviewer"].map((r) => <option key={r}>{r}</option>)}</Select></Field>
          <Button type="submit" variant="primary">Create invite</Button>
        </form>
        {link && <p className="mt-3 break-all rounded border border-ok/40 bg-ok/10 p-2 font-mono text-[12px] text-ok">Share this link (shown once): {link}</p>}
        {err && <p role="alert" className="mt-3 text-[13px] text-bad">{err}</p>}
        <ul className="mt-4 divide-y divide-line text-[12.5px]">
          {invites.map((i) => (
            <li key={i.id} className="flex items-center justify-between py-1.5"><span>{i.email} <span className="text-faint">· {i.role}</span></span>{i.acceptedAt ? <Badge tone="ok">accepted</Badge> : new Date(i.expiresAt) < new Date() ? <Badge tone="bad">expired</Badge> : <Badge tone="gold">pending</Badge>}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
