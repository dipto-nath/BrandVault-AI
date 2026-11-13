import { storage } from '@/lib/db/adaptor';
import { FindingInspector } from '@/components/findings/finding-inspector';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function FindingDetailPage({
  params,
}: {
  params: Promise<{ id: string; fid: string }>;
}) {
  const { id, fid } = await params;
  const submission = await storage.getSubmission(id);
  const finding = await storage.getFinding(fid);

  if (!submission || !finding) {
    return (
      <div className="card p-12 text-center bg-surface">
        <h2 className="text-xl font-bold text-ink-dark mb-2">Finding Not Found</h2>
        <p className="text-sm text-ink-secondary mb-6">
          The requested finding record could not be found.
        </p>
        <Link href={`/reviews/${id}`}>
          <Button variant="outline">Back to Review</Button>
        </Link>
      </div>
    );
  }

  const [rawEvidence, feedback, allFacts, guideline] = await Promise.all([
    storage.listFindingEvidence(fid),
    storage.listFindingFeedback(fid),
    storage.listFacts(submission.workspace_id),
    finding.rule_id ? storage.getGuideline(finding.rule_id) : Promise.resolve(null),
  ]);

  const factsMap = new Map(allFacts.map((f) => [f.id, f]));
  const evidence = rawEvidence.map((ev) => ({
    ...ev,
    approved_facts: ev.approved_fact_id ? factsMap.get(ev.approved_fact_id) : undefined,
  }));

  return (
    <FindingInspector
      submissionId={id}
      finding={finding}
      evidence={evidence}
      guideline={guideline}
      feedback={feedback}
    />
  );
}
