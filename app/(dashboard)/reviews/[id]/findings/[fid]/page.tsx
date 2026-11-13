import { storage } from '@/lib/db/adaptor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { z } from 'zod';

export default async function FindingDetailPage({ params }: { params: Promise<{ id: string; fid: string }> }) {
  const { id, fid } = await params;
  const submission = await storage.getSubmission(id);
  const finding = await storage.getFinding(fid);
  if (!submission || !finding) return <div className="card p-12">Not found.</div>;
  const evidence = await storage.listFindingEvidence(fid);
  const feedback = await storage.listFindingFeedback(fid);

  const FeedbackSchema = z.object({
    feedback_type: z.enum(['ACCEPTED', 'OVERRIDDEN', 'EDITED_CORRECTION', 'REJECTED_CORRECTION', 'MARKED_AMBIGUOUS']),
    reason: z.string().optional(),
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/(dashboard)/reviews/${id}`}><Button variant="outline" size="sm">← Back to review</Button></Link>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-ink-dark">{finding.title}</h2>
            <p className="text-ink-secondary">{finding.finding_type.replace(/_/g, ' ')}</p>
          </div>
          <Badge variant={finding.severity === 'HIGH' ? 'high' : finding.severity === 'MEDIUM' ? 'medium' : 'low'}>{finding.severity}</Badge>
        </div>
        <div className="mb-4">
          <div className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">Excerpt</div>
          <div className="rounded-lg border border-border bg-surface p-4 font-sans text-sm leading-relaxed text-ink whitespace-pre-wrap">{finding.excerpt}</div>
        </div>
        <div className="mb-4">
          <div className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">Explanation</div>
          <div className="text-sm text-ink-dark leading-relaxed">{finding.explanation}</div>
        </div>
        {finding.rule_id && (
          <div className="mb-4">
            <div className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">Related guideline</div>
            <div className="text-sm text-ink-secondary">{finding.rule_id}</div>
          </div>
        )}
        {finding.suggested_correction && (
          <div className="mb-4">
            <div className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">Suggested correction</div>
            <div className="rounded-lg border border-border bg-surface p-4 font-sans text-sm leading-relaxed text-ink whitespace-pre-wrap">{finding.suggested_correction}</div>
          </div>
        )}
        <div className="mb-4">
          <div className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">Confidence</div>
          <div className="text-sm text-ink-dark">{Math.round((finding.confidence ?? 0) * 100)}%</div>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-ink-dark mb-4">Evidence ({evidence.length})</h3>
        <div className="space-y-3">
          {evidence.length === 0 ? (
            <p className="text-ink-secondary">No linked evidence sources.</p>
          ) : (
            evidence.map((e) => (
              <div key={e.id} className="p-4 rounded-lg border border-border bg-surface">
                <div className="text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-1">{e.evidence_relation}</div>
                <div className="text-sm text-ink-dark">{e.evidence_excerpt}</div>
                <div className="text-xs text-ink-secondary mt-2">{e.relevance_explanation}</div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-ink-dark mb-4">Reviewer feedback</h3>
        <div className="space-y-3">
          {feedback.length === 0 ? (
            <p className="text-ink-secondary">No feedback recorded for this finding.</p>
          ) : (
            feedback.map((f) => (
              <div key={f.id} className="p-3 rounded-lg border border-border bg-surface">
                <div className="text-xs font-medium text-ink-dark">{f.feedback_type}</div>
                {f.reason && <div className="text-xs text-ink-secondary">{f.reason}</div>}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
