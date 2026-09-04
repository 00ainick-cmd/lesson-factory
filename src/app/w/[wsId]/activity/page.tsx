import { requireWorkspace } from "@/server/auth/rbac";
import { listActivity } from "@/server/services/workspaces";
import { PageHeader } from "@/components/app-shell";
import { fmtDate } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ActivityPage({ params }: { params: Promise<{ wsId: string }> }) {
  const { wsId } = await params;
  await requireWorkspace(wsId, "project.read");
  const rows = await listActivity(wsId, { limit: 200 });
  return (
    <>
      <PageHeader kicker="Workspace" title="Activity">
        <p className="mt-2 text-[13px] text-muted">Structured audit log: every import, save, version, proposal decision, export, and membership change.</p>
      </PageHeader>
      <ul className="divide-y divide-line px-8 py-4 text-[13px]">
        {rows.map((r) => (
          <li key={r.id} className="grid grid-cols-[150px_180px_1fr] gap-3 py-2">
            <span className="font-mono text-[11.5px] text-faint">{fmtDate(r.createdAt)}</span>
            <span className="truncate text-muted">{r.userName ?? "system"}</span>
            <span>
              <span className="font-mono text-[12px] text-accent">{r.action}</span>
              {r.details != null && <span className="ml-2 font-mono text-[11px] text-faint">{JSON.stringify(r.details).slice(0, 160)}</span>}
            </span>
          </li>
        ))}
        {rows.length === 0 && <li className="py-6 text-muted">No activity yet.</li>}
      </ul>
    </>
  );
}
