import { requireWorkspace } from "@/server/auth/rbac";
import { listBeatTypes } from "@/server/services/knowledge";
import { PageHeader } from "@/components/app-shell";
import { Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function BeatTypesPage({ params }: { params: Promise<{ wsId: string }> }) {
  const { wsId } = await params;
  await requireWorkspace(wsId, "knowledge.read");
  const rows = await listBeatTypes(wsId);
  return (
    <>
      <PageHeader kicker="Workspace" title="Beat Types">
        <p className="mt-2 max-w-3xl text-[13px] text-muted">The seed kit&rsquo;s beat grammar. A beat is an instructional event with a purpose, an objective link, a learner action, and optional completion evidence — blocks live inside beats.</p>
      </PageHeader>
      <ol className="grid gap-3 px-8 py-6 md:grid-cols-2 2xl:grid-cols-3">
        {rows.map((b) => (
          <li key={b.id} className="rounded-md border border-line bg-panel p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-[14px] font-semibold">{b.ordinal}. {b.name}</h2>
              <div className="flex gap-1.5"><Badge tone="info">{b.phase}</Badge><Badge tone="muted">{b.key}</Badge></div>
            </div>
            <p className="mt-1.5 text-[13px] text-muted">{b.definition}</p>
            <p className="mt-2 font-mono text-[11px] text-faint">gate {b.gateKind}{b.budgetMin != null ? ` · ${b.budgetMin}–${b.budgetMax} words` : ""}</p>
            {Array.isArray(b.requirements) && (b.requirements as string[]).length > 0 && (
              <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[12.5px] text-muted">{(b.requirements as string[]).map((r, i) => <li key={i}>{r}</li>)}</ul>
            )}
          </li>
        ))}
      </ol>
    </>
  );
}
