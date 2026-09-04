import { requireProject } from "@/server/auth/rbac";
import { handle, type Params } from "@/server/api";
import { getWorkingDocument, getVersion } from "@/server/services/projects";
import { compileLesson } from "@/server/lesson/compile";
import { parseLessonDocument } from "@/server/lesson/model";

/**
 * Sandboxed preview document. Served with its own strict CSP and loaded only inside
 * <iframe sandbox="allow-scripts"> from the editor: it gets an opaque origin, no cookies,
 * no network beyond fonts/images, and can only talk to the host via validated postMessage.
 */
export const GET = handle(async (req: Request, { params }: Params<"projectId">) => {
  const { projectId } = await params;
  await requireProject(projectId, "project.read");
  const url = new URL(req.url);
  const versionId = url.searchParams.get("versionId");
  const mode = url.searchParams.get("mode") === "learner" ? "learner" : "author";
  const doc = versionId ? parseLessonDocument((await getVersion(projectId, versionId)).document) : (await getWorkingDocument(projectId)).doc;
  const html = compileLesson(doc, { mode: "preview", authorMode: mode === "author" });
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": [
        "sandbox allow-scripts",
        "default-src 'none'",
        "style-src 'unsafe-inline' https://fonts.googleapis.com",
        "font-src https://fonts.gstatic.com data:",
        "script-src 'unsafe-inline'",
        "img-src * data: blob:",
        "media-src * data: blob:",
        "connect-src 'none'",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'none'",
      ].join("; "),
    },
  });
});
