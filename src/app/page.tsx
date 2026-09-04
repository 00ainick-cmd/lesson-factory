import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { listWorkspacesForUser, userCount } from "@/server/services/workspaces";

export const dynamic = "force-dynamic";

export default async function Home() {
  if ((await userCount()) === 0) redirect("/setup");
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const ws = await listWorkspacesForUser(user.id, user.isPlatformAdmin);
  if (ws[0]) redirect(`/w/${ws[0].id}`);
  redirect("/w");
}
