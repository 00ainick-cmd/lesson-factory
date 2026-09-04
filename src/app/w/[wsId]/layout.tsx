import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/server/auth/session";
import { membershipRole } from "@/server/auth/rbac";
import { getWorkspace } from "@/server/services/workspaces";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({ children, params }: { children: React.ReactNode; params: Promise<{ wsId: string }> }) {
  const { wsId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const role = user.isPlatformAdmin ? "admin" : await membershipRole(user.id, wsId);
  if (!role) redirect("/w");
  const workspace = await getWorkspace(wsId).catch(() => null);
  if (!workspace) redirect("/w");
  return (
    <AppShell workspace={workspace} role={role} user={user}>
      {children}
    </AppShell>
  );
}
