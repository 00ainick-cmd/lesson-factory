import { requireWorkspace } from "@/server/auth/rbac";
import { listInvites, listMembers } from "@/server/services/workspaces";
import { PageHeader } from "@/components/app-shell";
import { MembersPanel } from "@/components/members-panel";

export const dynamic = "force-dynamic";

export default async function MembersPage({ params }: { params: Promise<{ wsId: string }> }) {
  const { wsId } = await params;
  await requireWorkspace(wsId, "workspace.manage");
  const [members, invites] = await Promise.all([listMembers(wsId), listInvites(wsId)]);
  return (
    <>
      <PageHeader kicker="Workspace" title="Members & invites">
        <p className="mt-2 text-[13px] text-muted">Invite-only. Roles: admin (everything), author (edit, version, export, accept proposals), reviewer (read, comment, approve).</p>
      </PageHeader>
      <MembersPanel wsId={wsId} members={members.map((m) => ({ ...m, since: String(m.since) }))} invites={invites.map((i) => ({ ...i, expiresAt: String(i.expiresAt), acceptedAt: i.acceptedAt ? String(i.acceptedAt) : null, createdAt: String(i.createdAt) }))} />
    </>
  );
}
