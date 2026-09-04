export class StaleProposalError extends Error {}

export function assertProposalRevision(baseRevision: number, currentRevision: number) {
  if (baseRevision !== currentRevision) {
    throw new StaleProposalError(`This proposal was drafted against older revision ${baseRevision}; the lesson is now at revision ${currentRevision}. Re-run the check.`);
  }
}
