import Link from "next/link";
import { requireWorkspace } from "@/server/auth/rbac";
import { listProjects } from "@/server/services/projects";
import { PageHeader } from "@/components/app-shell";
import { Badge, Empty, fmtDate } from "@/components/ui";
import { ImportProjectDialog } from "@/components/import-project";

export const dynamic = "force-dynamic";

export default async function Dashboard({ params }: { params: Promise<{ wsId: string }> }) {
  const { wsId } = await params;
  const { role } = await requireWorkspace(wsId, "project.read");
  const projects = await listProjects(wsId);
  const canWrite = role !== "reviewer";
  return (
    <>
      <PageHeader kicker="Workspace" title="Projects" actions={canWrite ? <ImportProjectDialog wsId={wsId} /> : null} />
      <div className="px-8 py-6">
        {projects.length === 0 ? (
          <Empty title="No lessons yet" body="Import a self-contained HTML lesson. The original file is stored immutably; the Studio builds an editable copy and runs ID Copilot's import audit." action={canWrite ? <ImportProjectDialog wsId={wsId} /> : undefined} />
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line text-left font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">
                <th className="py-2 pr-4 font-medium">Lesson</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Beats</th>
                <th className="py-2 pr-4 font-medium">Versions</th>
                <th className="py-2 pr-4 font-medium">Open proposals</th>
                <th className="py-2 pr-4 font-medium">Updated</th>
                <th className="py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-b border-line/60 hover:bg-panel">
                  <td className="py-3 pr-4">
                    <Link href={`/w/${wsId}/projects/${p.id}`} className="font-medium text-ink hover:text-accent">{p.title}</Link>
                    <div className="font-mono text-[11px] text-faint">{p.origin} · rev {p.workingRevision}</div>
                  </td>
                  <td className="py-3 pr-4"><Badge tone={p.status.startsWith("approved") || p.status === "exported" ? "ok" : p.status === "in_review" || p.status === "ready_for_review" ? "gold" : "muted"}>{p.status.replaceAll("_", " ")}</Badge></td>
                  <td className="py-3 pr-4 font-mono">{p.beats}</td>
                  <td className="py-3 pr-4 font-mono">{p.versions}</td>
                  <td className="py-3 pr-4 font-mono">{p.openProposals > 0 ? <span className="text-gold">{p.openProposals}</span> : "0"}</td>
                  <td className="py-3 pr-4 text-muted">{fmtDate(p.updatedAt)}</td>
                  <td className="py-3 text-right"><Link href={`/w/${wsId}/projects/${p.id}/editor`} className="text-accent hover:underline">Open editor</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
