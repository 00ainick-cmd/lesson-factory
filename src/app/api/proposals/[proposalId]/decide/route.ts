import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { proposals } from "@/server/db/schema";
import { requireProject } from "@/server/auth/rbac";
import { ApiError, handle, json, readJson, type Params } from "@/server/api";
import { decideProposal, ProposalDecision } from "@/server/copilot/proposals";

export const POST = handle(async (req: Request, { params }: Params<"proposalId">) => {
  const { proposalId } = await params;
  const [p] = await db.select({ projectId: proposals.projectId }).from(proposals).where(eq(proposals.id, proposalId)).limit(1);
  if (!p) throw new ApiError(404, "Proposal not found");
  const { user } = await requireProject(p.projectId, "proposal.decide");
  const body = await readJson(req, ProposalDecision);
  return json(await decideProposal({ proposalId, projectId: p.projectId, userId: user.id, decision: body.decision, editedOps: body.editedOps }));
});
