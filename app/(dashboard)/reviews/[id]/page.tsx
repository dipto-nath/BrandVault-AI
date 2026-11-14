import { storage } from '@/lib/db/adaptor';
import { ReviewStudio } from '@/components/reviews/review-studio';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const submission = await storage.getSubmission(id);
  if (!submission) {
    return (
      <div className="card p-12 text-center bg-surface">
        <h2 className="text-xl font-bold text-ink-dark mb-2">Submission Not Found</h2>
        <p className="text-sm text-ink-secondary mb-6">
          The requested submission does not exist in the active workspace.
        </p>
        <Link href="/reviews">
          <Button variant="outline">Back to Reviews</Button>
        </Link>
      </div>
    );
  }

  const [claims, rawFindings, runs, decisions, versions, allFacts, allGuidelines] = await Promise.all([
    storage.listClaims(submission.id),
    storage.listFindings(submission.id),
    storage.listAnalysisRuns(submission.id),
    storage.listReviewDecisions(submission.id),
    storage.listVersions(submission.id),
    storage.listFacts(submission.workspace_id),
    storage.listGuidelines(submission.workspace_id),
  ]);

  const factsMap = new Map(allFacts.map((f) => [f.id, f]));

  // Populate finding evidence
  const findingsWithEvidence = await Promise.all(
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
    <ReviewStudio
      submission={submission}
      claims={claims}
      findings={findingsWithEvidence}
      analysisRuns={runs}
      decisions={decisions}
      versions={versions}
      allGuidelines={allGuidelines}
      allFacts={allFacts}
    />
  );
}
