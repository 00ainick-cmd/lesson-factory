import Link from "next/link";
import { requireWorkspace } from "@/server/auth/rbac";
import { getDocument } from "@/server/services/knowledge";
import { PageHeader } from "@/components/app-shell";
import { Badge } from "@/components/ui";
import { KnowledgeEditor } from "@/components/knowledge-editor";

export const dynamic = "force-dynamic";

export default async function DocPage({ params }: { params: Promise<{ wsId: string; docId: string }> }) {
  const { wsId, docId } = await params;
  const { role } = await requireWorkspace(wsId, "knowledge.read");
  const { document, versions, drifted } = await getDocument(wsId, docId);
  return (
    <>
      <PageHeader kicker="Knowledge Library" title={document.title}>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-muted">
          <Badge tone="muted">{document.category}</Badge>
          {(document.roles as string[]).map((r) => <Badge key={r} tone="info">{r}</Badge>)}
          <span className="font-mono text-[11px]">{document.seedPath ?? "workspace-authored"}</span>
          {document.seedCommit && <span className="font-mono text-[11px] text-faint">seed {document.seedCommit.slice(0, 10)}</span>}
          <span className="font-mono text-[11px]">v{document.currentVersion}</span>
          {drifted ? <Badge tone="gold">drifted from baseline</Badge> : <Badge tone="ok">matches baseline</Badge>}
        </div>
      </PageHeader>
      <KnowledgeEditor
        docId={docId}
        canWrite={role !== "reviewer"}
        initial={{ content: document.content, version: document.currentVersion, roles: document.roles as string[], active: document.active, baselineSha256: document.baselineSha256, contentSha256: document.contentSha256 }}
        versions={versions.map((v) => ({ ...v, createdAt: String(v.createdAt) }))}
      />
    </>
  );
}
