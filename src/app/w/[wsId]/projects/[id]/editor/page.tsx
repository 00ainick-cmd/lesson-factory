import { requireProject } from "@/server/auth/rbac";
import { listBeatTypes, listObjectives } from "@/server/services/knowledge";
import { EditorShell } from "@/components/editor/editor-shell";

export const dynamic = "force-dynamic";

export default async function EditorPage({ params, searchParams }: { params: Promise<{ wsId: string; id: string }>; searchParams: Promise<{ panel?: string }> }) {
  const { wsId, id } = await params;
  const sp = await searchParams;
  const { role, project } = await requireProject(id, "project.read");
  const [beatTypes, objectives] = await Promise.all([listBeatTypes(project.workspaceId), listObjectives(project.workspaceId)]);
  return (
    <EditorShell
      projectId={id}
      wsId={wsId}
      role={role}
      initialTab={sp.panel === "copilot" ? "copilot" : "inspector"}
      beatTypes={beatTypes.map((t) => ({ key: t.key, name: t.name }))}
      objectives={objectives.map((o) => ({ code: o.code, wording: o.wording }))}
    />
  );
}
