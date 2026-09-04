import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { listWorkspacesForUser } from "@/server/services/workspaces";
import { AuthFrame } from "@/components/auth-frame";
import { NewWorkspaceForm } from "@/components/new-workspace-form";

export const dynamic = "force-dynamic";

export default async function WorkspacesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const ws = await listWorkspacesForUser(user.id, user.isPlatformAdmin);
  return (
    <AuthFrame title="Workspaces" subtitle={ws.length ? "Choose a workspace." : "You are not a member of any workspace yet."}>
      <ul className="space-y-2">
        {ws.map((w) => (
          <li key={w.id}>
            <a href={`/w/${w.id}`} className="flex items-center justify-between rounded border border-line-2 px-3 py-2 hover:border-accent">
              <span>{w.name}</span>
              <span className="font-mono text-[11px] uppercase text-muted">{w.role}</span>
            </a>
          </li>
        ))}
      </ul>
      <NewWorkspaceForm />
    </AuthFrame>
  );
}
