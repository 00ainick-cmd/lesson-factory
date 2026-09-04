import Link from "next/link";
import { requireWorkspace } from "@/server/auth/rbac";
import { listDocuments } from "@/server/services/knowledge";
import { PageHeader } from "@/components/app-shell";
import { Badge, fmtDate } from "@/components/ui";

export const dynamic = "force-dynamic";

const CATEGORY_ORDER = ["core", "pedagogy", "voice", "content", "assessment", "quality", "identity", "chassis", "ship", "runtime", "reference", "other"];

export default async function KnowledgePage({ params }: { params: Promise<{ wsId: string }> }) {
  const { wsId } = await params;
  await requireWorkspace(wsId, "knowledge.read");
  const docs = await listDocuments(wsId);
  const groups = new Map<string, typeof docs>();
  for (const d of docs) groups.set(d.category, [...(groups.get(d.category) ?? []), d]);
  const cats = [...groups.keys()].sort((a, b) => (CATEGORY_ORDER.indexOf(a) + 100) % 100 - (CATEGORY_ORDER.indexOf(b) + 100) % 100 || a.localeCompare(b));
  const drifted = docs.filter((d) => d.drifted).length;
  return (
    <>
      <PageHeader kicker="Workspace" title="Knowledge Library">
        <p className="mt-2 max-w-3xl text-[13px] text-muted">
          {docs.length} documents seeded from the lesson-factory kit as editable, versioned Markdown. ID Copilot retrieves from these by role (design, phrasing, alignment, checks, audit, export) — never the whole library at once. {drifted > 0 ? `${drifted} document${drifted > 1 ? "s have" : " has"} drifted from the seed baseline.` : "All documents match their seed baselines."}
        </p>
      </PageHeader>
      <div className="grid gap-6 px-8 py-6 lg:grid-cols-2 2xl:grid-cols-3">
        {cats.map((cat) => (
          <section key={cat}>
            <h2 className="mb-2 font-display text-[12px] font-semibold uppercase tracking-[0.16em] text-muted">{cat}</h2>
            <ul className="divide-y divide-line rounded-md border border-line bg-panel">
              {groups.get(cat)!.map((d) => (
                <li key={d.id}>
                  <Link href={`/w/${wsId}/knowledge/${d.id}`} className="flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-panel-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium">{d.title}</p>
                      <p className="truncate font-mono text-[11px] text-faint">{d.seedPath ?? "workspace-authored"} · v{d.currentVersion}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {(d.roles as string[]).map((r) => <Badge key={r} tone="info">{r}</Badge>)}
                      {d.drifted && <Badge tone="gold">edited</Badge>}
                      {!d.active && <Badge tone="bad">off</Badge>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
