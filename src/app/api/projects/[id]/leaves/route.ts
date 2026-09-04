import { requireProject } from "@/server/auth/rbac";
import { ApiError, handle, json, type Params } from "@/server/api";
import { getWorkingDocument } from "@/server/services/projects";
import { findBlock } from "@/server/lesson/model";
import { listLeaves } from "@/server/lesson/leaves";

/** Editable text/alt leaves inside a wrapped custom block (?blockId=). */
export const GET = handle(async (req: Request, { params }: Params<"id">) => {
  const { id } = await params;
  await requireProject(id, "project.read");
  const blockId = new URL(req.url).searchParams.get("blockId");
  if (!blockId) throw new ApiError(400, "blockId required");
  const { doc } = await getWorkingDocument(id);
  const loc = findBlock(doc, blockId);
  if (!loc) throw new ApiError(404, "Block not found");
  const b = loc.block;
  if (b.kind !== "custom" && b.kind !== "opaque" && b.kind !== "unsupported") return json({ leaves: [] });
  return json({ leaves: listLeaves(b.rawHtml, new Set(b.kind === "custom" ? b.interactionIds : [])) });
});
