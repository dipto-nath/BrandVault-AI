import { storage } from '@/lib/db/adaptor';
import { getPassportReference } from '@/lib/utils';

export async function getPassport(submissionId: string, workspaceId: string) {
  const submission = await storage.getSubmission(submissionId);
  if (!submission || submission.workspace_id !== workspaceId) return null;

  const [versions, runs, claims, findings, decisions, allFacts] = await Promise.all([
    storage.listVersions(submissionId),
    storage.listAnalysisRuns(submissionId),
    storage.listClaims(submissionId),
    storage.listFindings(submissionId),
    storage.listReviewDecisions(submissionId),
    storage.listFacts(workspaceId),
  ]);

  const factsMap = new Map(allFacts.map((f) => [f.id, f]));
  const findingsWithEvidence = await Promise.all(findings.map(async (f) => {
    const rawEvidence = await storage.listFindingEvidence(f.id);
    const evidence = rawEvidence.map((ev) => ({
      ...ev,
      approved_facts: ev.approved_fact_id ? factsMap.get(ev.approved_fact_id) : undefined,
    }));
    return { ...f, finding_evidence: evidence };
  }));

  const latestRun = runs.length ? runs[0] : null;
  const latestVersion = versions.length ? versions[versions.length - 1] : null;

  return {
    passportId: submission.passport_reference || getPassportReference(submission),
    submission,
    versions,
    latestRun,
    latestVersion,
    claims,
    findings: findingsWithEvidence,
    decisions,
    evidence: allFacts,
    generatedAt: new Date().toISOString(),
  };
}
