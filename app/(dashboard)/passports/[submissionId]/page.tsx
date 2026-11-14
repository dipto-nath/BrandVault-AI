import { storage } from '@/lib/db/adaptor';
import { PassportView } from '@/components/passport/passport-view';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function PassportDetailPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  const submission = await storage.getSubmission(submissionId);

  if (!submission) {
    return (
      <div className="card p-12 text-center bg-surface">
        <h2 className="text-xl font-bold text-ink-dark mb-2">Passport Not Found</h2>
        <p className="text-sm text-ink-secondary mb-6">
          No compliance passport was found for this submission.
        </p>
        <Link href="/passports">
          <Button variant="outline">Back to Passports</Button>
        </Link>
      </div>
    );
  }

  const [claims, rawFindings, decisions, versions, runs, auditLogs, allFacts] = await Promise.all([
    storage.listClaims(submission.id),
    storage.listFindings(submission.id),
    storage.listReviewDecisions(submission.id),
    storage.listVersions(submission.id),
    storage.listAnalysisRuns(submission.id),
    storage.listAuditLogs(submission.workspace_id),
    storage.listFacts(submission.workspace_id),
  ]);

  const factsMap = new Map(allFacts.map((f) => [f.id, f]));
  const findings = await Promise.all(
    rawFindings.map(async (f) => {
      const rawEvidence = await storage.listFindingEvidence(f.id);
      const evidence = rawEvidence.map((ev) => ({
        ...ev,
        approved_facts: ev.approved_fact_id ? factsMap.get(ev.approved_fact_id) : undefined,
      }));
      return {
        ...f,
        finding_evidence: evidence,
      };
    })
  );

  return (
    <PassportView
      submission={submission}
      claims={claims}
      findings={findings}
      decisions={decisions}
      versions={versions}
      runs={runs}
      auditLogs={auditLogs}
      workspaceName="NexTech"
    />
  );
}
