import Link from "next/link";
import { withBase } from "@/lib/base-path";
import { notFound } from "next/navigation";
import { requireProject } from "@/server/auth/rbac";
import { getProjectFull, listExports, latestAudit } from "@/server/services/projects";
import { PageHeader } from "@/components/app-shell";
import { Badge, Card, fmtBytes, fmtDate } from "@/components/ui";
import { ProjectPanels } from "@/components/project-panels";
import type { ImportReport } from "@/server/lesson/import";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ wsId: string; id: string }> }) {
  const { wsId, id } = await params;
  const { role } = await requireProject(id, "project.read");
  const full = await getProjectFull(id).catch(() => null);
  if (!full || full.project.workspaceId !== wsId) notFound();
  const { project, original, assets, versions, importJob } = full;
  const exportsList = await listExports(id);
  const audit = await latestAudit(id);
  const report = project.importReport as ImportReport | null;
  const openProposals = audit.proposals.filter((p) => p.status === "open").length;
  const canWrite = role !== "reviewer";

  return (
    <>
      <PageHeader
        kicker="Project"
        title={project.title}
        actions={
          <>
            <Badge tone={project.status.startsWith("approved") ? "ok" : "muted"}>{project.status.replaceAll("_", " ")}</Badge>
            <Link href={`/w/${wsId}/projects/${id}/editor`} className="inline-flex h-9 items-center rounded bg-accent px-3.5 text-[13px] font-medium text-white hover:bg-[#3d9bff]">Open editor</Link>
          </>
        }
      >
        <p className="mt-2 font-mono text-[11px] text-faint">
          working revision {project.workingRevision} · {report?.counts.beats ?? "–"} beats · {report?.counts.blocks ?? "–"} blocks · imported {fmtDate(project.createdAt)}
        </p>
      </PageHeader>

      <div className="grid gap-5 px-8 py-6 xl:grid-cols-[1.1fr_1fr]">
        <div className="space-y-5">
          <Card title="Original source (immutable)">
            {original ? (
              <dl className="grid grid-cols-[120px_1fr] gap-y-1.5 text-[13px]">
                <dt className="text-muted">File</dt><dd>{original.filename}</dd>
                <dt className="text-muted">Size</dt><dd>{fmtBytes(original.sizeBytes)}</dd>
                <dt className="text-muted">SHA-256</dt><dd className="break-all font-mono text-[11.5px] text-ok">{original.sha256}</dd>
                <dt className="text-muted">Stored</dt><dd>{fmtDate(original.createdAt)}</dd>
                <dt className="text-muted">Download</dt><dd><a className="text-accent hover:underline" href={withBase(`/api/projects/${id}/original`)}>byte-identical copy</a></dd>
              </dl>
            ) : (
              <p className="text-muted">No original artifact (authored from scratch).</p>
            )}
          </Card>

          <Card title="Import report" actions={importJob ? <Badge tone={importJob.status === "succeeded" ? "ok" : importJob.status === "failed" ? "bad" : "gold"}>{String(importJob.status)}</Badge> : null}>
            {importJob?.status === "failed" && <p className="mb-3 rounded border border-bad/40 bg-bad/10 p-2 text-[12.5px] text-bad">{String(importJob.error)}</p>}
            {report ? (
              <div className="space-y-4 text-[13px]">
                <div className="grid grid-cols-3 gap-3">
                  <Stat label="Chassis" value={report.chassis.profile} sub={`${Math.round(report.chassis.confidence * 100)}% confidence`} />
                  <Stat label="Beats / blocks" value={`${report.counts.beats} / ${report.counts.blocks}`} />
                  <Stat label="Source" value={`${report.sourceLines} lines`} sub={fmtBytes(report.sourceBytes)} />
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] uppercase tracking-[0.14em] text-muted">Region classification</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(report.counts.byClassification).map(([k, v]) => (
                      <Badge key={k} tone={k === "managed" ? "ok" : k === "wrapped-custom" ? "gold" : k === "opaque-embed" ? "info" : "bad"}>{k} {v}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] uppercase tracking-[0.14em] text-muted">Block kinds</p>
                  <div className="flex flex-wrap gap-1.5">{Object.entries(report.counts.byKind).map(([k, v]) => <Badge key={k}>{k} {v}</Badge>)}</div>
                </div>
                <div className="grid grid-cols-4 gap-2 font-mono text-[11.5px] text-muted">
                  <span>inline scripts {report.counts.scriptsInline}</span><span>external scripts {report.counts.scriptsExternal}</span><span>styles {report.counts.styles}</span><span>svg {report.counts.svgs}</span>
                  <span>canvas {report.counts.canvases}</span><span>images {report.counts.images}</span><span>tables {report.counts.tables}</span><span>ids {report.counts.ids}</span>
                </div>
                {report.externalHosts.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[11px] uppercase tracking-[0.14em] text-muted">External hosts</p>
                    <ul className="space-y-0.5 font-mono text-[12px]">{report.externalHosts.map((h) => <li key={h.host}>{h.host} <span className="text-faint">×{h.count}</span> {h.allowed ? <span className="text-ok">allowed</span> : <span className="text-bad">not allow-listed</span>}</li>)}</ul>
                  </div>
                )}
                {report.warnings.length > 0 && (
                  <details>
                    <summary className="cursor-pointer text-[12.5px] text-muted">{report.warnings.length} import warnings</summary>
                    <ul className="mt-2 space-y-1.5">{report.warnings.map((w, i) => <li key={i} className="rounded border border-line px-2.5 py-1.5 text-[12.5px]"><Badge tone={w.severity === "error" ? "bad" : w.severity === "warning" ? "gold" : "info"}>{w.code}</Badge> <span className="ml-1.5">{w.message}</span>{w.where && <span className="ml-1 font-mono text-[11px] text-faint">{w.where}</span>}</li>)}</ul>
                  </details>
                )}
                {report.lostRegions.length > 0 && <p className="text-bad">Lossy regions: {report.lostRegions.length}</p>}
                {report.gateSummary.length > 0 && (
                  <details>
                    <summary className="cursor-pointer text-[12.5px] text-muted">Gate map ({report.gateSummary.length} beats)</summary>
                    <ul className="mt-2 grid grid-cols-2 gap-1 font-mono text-[11.5px]">{report.gateSummary.map((g) => <li key={g.beatId}><span className="text-ink">{g.beatId}</span> <span className="text-muted">{g.kind}{g.need ? ` need ${g.need}` : ""}{g.clearId ? ` → ${g.clearId}` : ""}</span></li>)}</ul>
                  </details>
                )}
              </div>
            ) : (
              <p className="text-muted">Import has not produced a report yet.</p>
            )}
          </Card>

          <Card title={`Referenced assets (${assets.length})`}>
            {assets.length === 0 ? <p className="text-muted text-[13px]">No external assets referenced.</p> : (
              <ul className="max-h-64 space-y-1 overflow-auto scroll-thin font-mono text-[12px]">
                {assets.map((a) => <li key={a.id} className="flex items-center justify-between gap-2"><span className="truncate">{a.path}</span><Badge tone={a.status === "missing" ? "bad" : a.status === "external" ? "gold" : "ok"}>{a.status}</Badge></li>)}
              </ul>
            )}
          </Card>
        </div>

        <ProjectPanels projectId={id} wsId={wsId} canWrite={canWrite} versions={versions.map((v) => ({ ...v, createdAt: String(v.createdAt) }))} exportsInit={exportsList.map((e) => ({ id: e.id, format: e.format, status: e.status, createdAt: String(e.createdAt), versionId: e.versionId, validationReport: e.validationReport, artifactId: e.artifactId }))} audit={{ run: audit.run ? { id: audit.run.id, kind: audit.run.kind, createdAt: String(audit.run.createdAt), summary: audit.run.summary } : null, findings: audit.findings.length, openProposals }} />
      </div>
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded border border-line bg-rail px-3 py-2">
      <p className="text-[10.5px] uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="font-display text-[16px] font-semibold">{value}</p>
      {sub && <p className="text-[11px] text-faint">{sub}</p>}
    </div>
  );
}
