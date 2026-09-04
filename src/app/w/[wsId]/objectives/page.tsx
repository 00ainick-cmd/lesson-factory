import { requireWorkspace } from "@/server/auth/rbac";
import { listObjectives } from "@/server/services/knowledge";
import { PageHeader } from "@/components/app-shell";
import { Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ObjectivesPage({ params }: { params: Promise<{ wsId: string }> }) {
  const { wsId } = await params;
  await requireWorkspace(wsId, "knowledge.read");
  const rows = await listObjectives(wsId);
  const cats = [...new Set(rows.map((r) => r.category))];
  return (
    <>
      <PageHeader kicker="Workspace" title="Objectives">
        <p className="mt-2 max-w-3xl text-[13px] text-muted">{rows.length} objectives parsed from the seed kit&rsquo;s content register. Beats link to these codes; the audit flags beats without objective coverage.</p>
      </PageHeader>
      <div className="space-y-6 px-8 py-6">
        {cats.map((c) => (
          <section key={c}>
            <h2 className="mb-2 font-display text-[12px] font-semibold uppercase tracking-[0.16em] text-muted">{c}</h2>
            <ul className="divide-y divide-line rounded-md border border-line bg-panel">
              {rows.filter((r) => r.category === c).map((o) => (
                <li key={o.id} className="grid grid-cols-[110px_1fr] gap-3 px-4 py-2.5 text-[13px]">
                  <span className="font-mono text-[12px] text-accent">{o.code}</span>
                  <div>
                    <p>{o.wording}</p>
                    <div className="mt-1 flex gap-2 text-[11px] text-faint">{o.studyGuide && <span>study guide: {o.studyGuide}</span>}{o.bankItems != null && <span>bank items: {String(o.bankItems)}</span>}{!o.active && <Badge tone="bad">inactive</Badge>}</div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
