import { requireWorkspace } from "@/server/auth/rbac";
import { listRules } from "@/server/services/knowledge";
import { PageHeader } from "@/components/app-shell";
import { RulesTable } from "@/components/rules-table";

export const dynamic = "force-dynamic";

export default async function RulesPage({ params }: { params: Promise<{ wsId: string }> }) {
  const { wsId } = await params;
  const { role } = await requireWorkspace(wsId, "knowledge.read");
  const rules = await listRules(wsId);
  return (
    <>
      <PageHeader kicker="Workspace" title="Quality Rules">
        <p className="mt-2 max-w-3xl text-[13px] text-muted">{rules.length} rules mirrored from the seed kit&rsquo;s QUALITY-BAR and quality-gate. ID Copilot&rsquo;s Import Audit evaluates the active set; each finding records rule key and version for provenance.</p>
      </PageHeader>
      <div className="px-8 py-6">
        <RulesTable canWrite={role === "admin"} rules={rules.map((r) => ({ id: r.id, key: r.key, name: r.name, category: r.category, severity: r.severity, description: r.description, params: r.params as Record<string, unknown> | null, version: r.version, active: r.active, sourceRef: r.sourceRef }))} />
      </div>
    </>
  );
}
