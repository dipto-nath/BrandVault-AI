'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck, FileText,
  RotateCw, MessageSquare, BookOpen, ExternalLink, HelpCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatDateTime } from '@/lib/utils';
import type { Finding, FindingEvidence, FindingFeedback, BrandGuideline, ApprovedFact } from '@/types/database';

interface FindingInspectorProps {
  submissionId: string;
  finding: Finding;
  evidence: Array<FindingEvidence & { approved_facts?: ApprovedFact }>;
  guideline?: BrandGuideline | null;
  feedback: FindingFeedback[];
}

const COMMON_REASONS = [
  'AI misinterpreted context',
  'Guideline is unclear or ambiguous',
  'Rules conflict with each other',
  'Evidence is outdated or needs revision',
  'Finding is factually incorrect',
  'Suggested correction changes intended meaning',
  'Approved exception for this marketing channel',
];

export function FindingInspector({
  submissionId,
  finding,
  evidence,
  guideline,
  feedback: initialFeedback,
}: FindingInspectorProps) {
  const router = useRouter();
  const [feedbackList, setFeedbackList] = useState(initialFeedback);
  const [feedbackType, setFeedbackType] = useState<
    'ACCEPTED' | 'OVERRIDDEN' | 'EDITED_CORRECTION' | 'REJECTED_CORRECTION' | 'MARKED_AMBIGUOUS'
  >('OVERRIDDEN');
  const [reason, setReason] = useState(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const finalReason = customReason.trim() ? `${reason}: ${customReason.trim()}` : reason;

    try {
      const res = await fetch(`/api/findings/${finding.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback_type: feedbackType,
          reason: finalReason,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error?.message || data.error || 'Failed to submit feedback');
      }

      setSuccessMsg('Reviewer feedback recorded in the Guideline Intelligence Loop.');
      setFeedbackList((prev) => [
        {
          id: 'temp-' + Date.now(),
          workspace_id: finding.workspace_id,
          finding_id: finding.id,
          user_id: '00000000-0000-0000-0000-000000000011',
          feedback_type: feedbackType,
          reason: finalReason,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setCustomReason('');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error recording feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link
          href={`/reviews/${submissionId}`}
          className="text-sm font-semibold text-ink-secondary hover:text-ink-dark flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Content Review</span>
        </Link>
        <span className="font-mono text-xs text-ink-secondary">
          Finding ID: {finding.id.slice(0, 8)}
        </span>
      </div>

      {/* Main Finding Overview Card */}
      <Card className="p-6 bg-surface border border-border">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-secondary">
                {finding.finding_type.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-ink-secondary">•</span>
              <span className="text-xs text-ink-secondary font-mono">
                Confidence: {Math.round((finding.confidence ?? 0.8) * 100)}%
              </span>
            </div>
            <h1 className="text-xl font-bold text-ink-dark">
              {finding.title}
            </h1>
          </div>

          <Badge variant={finding.severity === 'HIGH' ? 'high' : finding.severity === 'MEDIUM' ? 'medium' : 'low'}>
            {finding.severity} SEVERITY
          </Badge>
        </div>

        <div className="space-y-4 text-sm">
          {/* Flagged Excerpt */}
          <div className="p-4 rounded-lg bg-surface-subtle border border-border">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-secondary block mb-1">
              Flagged Content Excerpt
            </span>
            <div className="font-mono text-base font-semibold text-critical">
              &ldquo;{finding.excerpt}&rdquo;
            </div>
          </div>

          {/* Explanation */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-secondary block mb-1">
              Analysis & Justification
            </span>
            <p className="text-ink-dark leading-relaxed">
              {finding.explanation}
            </p>
          </div>

          {/* Suggested Correction */}
          {finding.suggested_correction && (
            <div className="p-3.5 rounded-lg bg-success-soft/30 border border-success/30">
              <span className="text-xs font-semibold uppercase tracking-wider text-success block mb-0.5">
                AI Suggested Brand Correction
              </span>
              <div className="text-sm font-medium text-ink-dark">
                &ldquo;{finding.suggested_correction}&rdquo;
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Linked Authoritative Evidence Sources */}
      <Card className="p-6 bg-surface border border-border">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-accent" />
          <h2 className="text-base font-bold text-ink-dark">
            Authoritative Evidence Sources ({evidence.length})
          </h2>
        </div>

        {evidence.length === 0 ? (
          <div className="text-center py-6 text-sm text-ink-secondary">
            No linked document or fact sources found. This claim is unverified by approved ground truth.
          </div>
        ) : (
          <div className="space-y-3">
            {evidence.map((ev) => (
              <div
                key={ev.id}
                className="p-4 rounded-lg border border-border bg-surface-subtle text-sm"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-semibold text-ink-dark text-sm">
                    {ev.approved_facts?.source_name || 'Nova Product Specification'}
                  </span>
                  <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-surface border border-border text-ink-secondary">
                    {ev.evidence_relation}
                  </span>
                </div>
                <div className="p-3 rounded bg-surface border border-border/60 text-xs text-ink-dark leading-relaxed font-mono">
                  {ev.evidence_excerpt || ev.approved_facts?.fact_text}
                </div>
                {ev.relevance_explanation && (
                  <p className="text-xs text-ink-secondary mt-2">
                    {ev.relevance_explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Related Brand Guideline */}
      {guideline && (
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-accent" />
            <h2 className="text-base font-bold text-ink-dark">
              Referenced Brand Guideline
            </h2>
          </div>
          <div className="p-4 rounded-lg bg-surface-subtle border border-border text-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold text-ink-dark bg-surface px-1.5 py-0.5 rounded border border-border">
                {guideline.rule_code}
              </span>
              <span className="font-semibold text-ink-dark">{guideline.title}</span>
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed">
              {guideline.description}
            </p>
          </div>
        </Card>
      )}

      {/* Reviewer Feedback Form (Guideline Intelligence Loop) */}
      <Card className="p-6 bg-surface border border-border">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-4 h-4 text-accent" />
            <span className="text-xs font-semibold text-accent uppercase tracking-wider">
              Guideline Intelligence Loop
            </span>
          </div>
          <h2 className="text-base font-bold text-ink-dark">
            Record Human Feedback on Finding
          </h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Your evaluation trains brand intelligence and identifies ambiguous or frequently overridden rules.
          </p>
        </div>

        {successMsg && (
          <div className="mb-4 p-3.5 rounded-lg bg-success-soft border border-success/30 text-xs text-success font-medium">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-lg bg-critical-soft border border-critical/30 text-xs text-critical font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmitFeedback} className="space-y-4">
          <div>
            <label className="label">Evaluation Action</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                { type: 'ACCEPTED', label: 'Accept Finding' },
                { type: 'OVERRIDDEN', label: 'Override Finding' },
                { type: 'EDITED_CORRECTION', label: 'Edit Correction' },
                { type: 'REJECTED_CORRECTION', label: 'Reject Correction' },
                { type: 'MARKED_AMBIGUOUS', label: 'Mark Rule Ambiguous' },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setFeedbackType(item.type as any)}
                  className={`p-2.5 rounded-md border text-left font-medium transition-colors ${
                    feedbackType === item.type
                      ? 'border-accent bg-accent-soft text-accent font-semibold'
                      : 'border-border hover:bg-surface-subtle text-ink-secondary'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Primary Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input w-full text-xs"
            >
              {COMMON_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Additional Reviewer Notes</label>
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Explain context or nuance for the governance committee..."
              rows={3}
              className="textarea w-full text-xs"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={submitting}
              className="btn-primary text-xs"
            >
              {submitting ? 'Recording Feedback…' : 'Submit Reviewer Feedback'}
            </Button>
          </div>
        </form>

        {/* Existing Feedback History */}
        {feedbackList.length > 0 && (
          <div className="mt-6 pt-5 border-t border-border">
            <h4 className="text-xs font-bold text-ink-dark uppercase tracking-wider mb-3">
              Recorded Reviewer Feedback History ({feedbackList.length})
            </h4>
            <div className="space-y-2">
              {feedbackList.map((fb) => (
                <div
                  key={fb.id}
                  className="p-3 rounded-lg border border-border bg-surface-subtle text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-ink-dark">{fb.feedback_type}</span>
                    <span className="text-ink-secondary font-mono">{formatDateTime(fb.created_at)}</span>
                  </div>
                  <p className="text-ink-secondary">{fb.reason || 'No detailed reason provided.'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

