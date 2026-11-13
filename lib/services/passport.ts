import { storage } from '@/lib/db/adaptor';

export async function getPassport(submissionId: string, workspaceId: string) {
  const submission = await storage.getSubmission(submissionId);
  if (!submission || submission.workspace_id !== workspaceId) return null;

  const [versions, runs, claims, findings, decisions] = await Promise.all([
    storage.listVersions(submissionId),
    storage.listAnalysisRuns(submissionId),
    storage.listClaims(submissionId),
    storage.listFindings(submissionId),
    storage.listReviewDecisions(submissionId),
  ]);

  const findingsWithEvidence = await Promise.all(findings.map(async (f) => {
    const evidence = await storage.getFinding(f.id);
    return { ...f, finding_evidence: [] };
  }));

  const latestRun = runs.length ? runs[0] : null;
  const latestVersion = versions.length ? versions[versions.length - 1] : null;

  return {
    passportId: `PASS-${submissionId}`,
    submission,
    versions,
    latestRun,
    latestVersion,
    claims,
    findings: findingsWithEvidence,
    decisions,
    evidence: [],
    generatedAt: new Date().toISOString(),
  };
}
