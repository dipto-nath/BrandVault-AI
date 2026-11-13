'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert, Clock, FileText, CheckCircle2, XCircle, AlertTriangle,
  Play, RotateCw, Sparkles, ArrowRight, ShieldCheck, Check, Edit3, Undo2,
  ExternalLink, ChevronRight, MessageSquare, Info
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { formatDateTime, getStatusLabel } from '@/lib/utils';
import type {
  ContentSubmission, ExtractedClaim, Finding, AnalysisRun,
  ReviewDecisionRecord, ContentVersion, FindingEvidence, ApprovedFact
} from '@/types/database';

interface ReviewStudioProps {
  submission: ContentSubmission;
  claims: ExtractedClaim[];
  findings: Array<Finding & { finding_evidence?: Array<FindingEvidence & { approved_facts?: ApprovedFact }> }>;
  analysisRuns: AnalysisRun[];
  decisions: ReviewDecisionRecord[];
  versions: ContentVersion[];
}

export function ReviewStudio({
  submission: initialSubmission,
  claims: initialClaims,
  findings: initialFindings,
  analysisRuns: initialRuns,
  decisions: initialDecisions,
  versions: initialVersions,
}: ReviewStudioProps) {
  const router = useRouter();
  const [submission, setSubmission] = useState(initialSubmission);
  const [claims, setClaims] = useState(initialClaims);
  const [findings, setFindings] = useState(initialFindings);
  const [decisions, setDecisions] = useState(initialDecisions);
  const [versions, setVersions] = useState(initialVersions);

  // Active view tab: 'findings' | 'claims' | 'diff' | 'approval'
  const [activeTab, setActiveTab] = useState<'findings' | 'claims' | 'diff' | 'approval'>('findings');

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Review decision state
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED'>('APPROVED');
  const [comment, setComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  // Correction editing state
  const [editingContent, setEditingContent] = useState(submission.current_content);
  const [isEditing, setIsEditing] = useState(false);
  const [applyingCorrection, setApplyingCorrection] = useState(false);

  const latestRun = initialRuns[0];
  const suggestedContent = latestRun?.result?.suggestedContent || null;

  // Run analysis handler
  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const res = await fetch(`/api/submissions/${submission.id}/analyze`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error?.message || data.error || 'Analysis failed');
      }
      // Refresh page data cleanly
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      setAnalysisError(err.message || 'Analysis could not be completed.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Submit human review decision
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewSubmitting(true);
    setReviewSuccess(null);
    try {
      const res = await fetch(`/api/submissions/${submission.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, comment }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error?.message || data.error || 'Failed to submit review');
      }
      setReviewSuccess(`Decision successfully recorded as ${decision}.`);
      setSubmission((prev) => ({ ...prev, status: decision }));
      router.refresh();
    } catch (err: any) {
      setAnalysisError(err.message || 'Review decision could not be recorded.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Apply suggested corrections
  const handleApplySuggestedContent = async (contentToApply: string) => {
    setApplyingCorrection(true);
    try {
      const res = await fetch(`/api/submissions/${submission.id}/corrections/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corrected_content: contentToApply }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error?.message || data.error || 'Failed to apply corrections');
      }
      setSubmission((prev) => ({ ...prev, current_content: contentToApply }));
      setEditingContent(contentToApply);
      setIsEditing(false);
      router.refresh();
    } catch (err: any) {
      setAnalysisError(err.message || 'Could not apply corrections.');
    } finally {
      setApplyingCorrection(false);
    }
  };

  // Restore original content
  const handleRestoreOriginal = async () => {
    await handleApplySuggestedContent(submission.original_content);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="card p-6 bg-surface border border-border">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-semibold text-ink-secondary uppercase bg-surface-subtle px-2 py-0.5 rounded">
                REV-{submission.id.slice(0, 8).toUpperCase()}
              </span>
              <span className="text-xs text-ink-secondary">•</span>
              <span className="text-xs font-medium text-ink-secondary">{submission.content_type}</span>
              <span className="text-xs text-ink-secondary">•</span>
              <span className="text-xs font-medium text-ink-secondary">{submission.channel}</span>
            </div>
            <h1 className="text-2xl font-bold text-ink-dark tracking-tight">
              {submission.title}
            </h1>
            <p className="text-xs text-ink-secondary mt-1">
              Submitted {formatDateTime(submission.created_at)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="btn-primary flex items-center gap-2"
            >
              {analyzing ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Against Evidence…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{findings.length > 0 ? 'Re-run Analysis' : 'Run Brand Analysis'}</span>
                </>
              )}
            </Button>

            <Link href={`/passports/${submission.id}`}>
              <Button variant="outline" className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-accent" />
                <span>View Passport</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Status Indicators Strip */}
        <div className="mt-6 pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
              Review Status
            </div>
            <Badge variant={statusToVariant(submission.status)} className="font-semibold">
              {getStatusLabel(submission.status)}
            </Badge>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
              Overall Risk Level
            </div>
            <Badge variant={submission.risk_level === 'HIGH' ? 'high' : submission.risk_level === 'MEDIUM' ? 'medium' : 'low'}>
              {submission.risk_level || 'LOW'} RISK
            </Badge>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
              Factual Findings
            </div>
            <div className="text-base font-bold text-ink-dark tnums">
              {findings.length} <span className="text-xs font-normal text-ink-secondary">detected</span>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary mb-1">
              Engine / Model
            </div>
            <div className="text-sm font-semibold text-ink-dark truncate">
              {latestRun?.model_name || 'Gemini 1.5 + Policy'}
            </div>
          </div>
        </div>
      </div>

      {analysisError && (
        <div className="p-4 rounded-lg bg-critical-soft border border-critical/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-critical shrink-0 mt-0.5" />
          <div className="text-sm text-critical">{analysisError}</div>
        </div>
      )}

      {reviewSuccess && (
        <div className="p-4 rounded-lg bg-success-soft border border-success/30 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
          <div className="text-sm text-success">{reviewSuccess}</div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-border flex items-center gap-1 sm:gap-2">
        <button
          onClick={() => setActiveTab('findings')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'findings'
              ? 'border-accent text-accent'
              : 'border-transparent text-ink-secondary hover:text-ink-dark'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Brand Findings</span>
          <span className="px-1.5 py-0.2 rounded-full text-xs bg-surface-subtle">
            {findings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('claims')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'claims'
              ? 'border-accent text-accent'
              : 'border-transparent text-ink-secondary hover:text-ink-dark'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Factual Claims</span>
          <span className="px-1.5 py-0.2 rounded-full text-xs bg-surface-subtle">
            {claims.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('diff')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'diff'
              ? 'border-accent text-accent'
              : 'border-transparent text-ink-secondary hover:text-ink-dark'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>Content & Corrections</span>
        </button>

        <button
          onClick={() => setActiveTab('approval')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'approval'
              ? 'border-accent text-accent'
              : 'border-transparent text-ink-secondary hover:text-ink-dark'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Human Review Gate</span>
          {decisions.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-success" />
          )}
        </button>
      </div>

      {/* TAB 1: FINDINGS & EVIDENCE */}
      {activeTab === 'findings' && (
        <div className="space-y-4">
          {findings.length === 0 ? (
            <Card className="p-8 text-center bg-surface">
              <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
              <h3 className="text-base font-bold text-ink-dark">No Brand Findings</h3>
              <p className="text-sm text-ink-secondary max-w-md mx-auto mt-1 mb-4">
                This submission complies with all approved brand guidelines, specifications, and tone policies.
              </p>
              <Button onClick={() => setActiveTab('approval')} variant="outline" size="sm">
                Proceed to Human Sign-Off
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {findings.map((f, idx) => (
                <Card key={f.id} className="p-5 bg-surface border border-border">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-md bg-surface-subtle flex items-center justify-center font-bold text-xs text-ink-dark shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-ink-dark leading-snug">
                          {f.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">
                            {f.finding_type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs text-ink-secondary">•</span>
                          <span className="text-xs text-ink-secondary font-mono">
                            Confidence: {Math.round((f.confidence ?? 0.8) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={f.severity === 'HIGH' ? 'high' : f.severity === 'MEDIUM' ? 'medium' : 'low'}>
                        {f.severity} SEVERITY
                      </Badge>
                      <Link href={`/reviews/${submission.id}/findings/${f.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs flex items-center gap-1">
                          Feedback <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    {/* Content Excerpt */}
                    <div className="p-3 rounded-md bg-surface-subtle/80 border border-border/60">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary block mb-1">
                        Problematic Content Excerpt
                      </span>
                      <span className="font-mono text-sm font-semibold text-critical">
                        &ldquo;{f.excerpt}&rdquo;
                      </span>
                    </div>

                    {/* Explanation */}
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary block mb-1">
                        Reason & Governance Analysis
                      </span>
                      <p className="text-ink-dark leading-relaxed">
                        {f.explanation}
                      </p>
                    </div>

                    {/* Linked Evidence Source */}
                    {f.finding_evidence && f.finding_evidence.length > 0 && (
                      <div className="p-3 rounded-md bg-accent-soft/30 border border-accent/20">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-accent block mb-1 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5" /> Authoritative Ground Truth Source
                        </span>
                        {f.finding_evidence.map((ev) => (
                          <div key={ev.id} className="text-xs text-ink leading-relaxed">
                            <span className="font-semibold text-ink-dark">
                              {ev.approved_facts?.source_name || 'Official Spec'}:
                            </span>{' '}
                            {ev.evidence_excerpt || ev.approved_facts?.fact_text}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Suggested Correction */}
                    {f.suggested_correction && (
                      <div className="p-3 rounded-md bg-success-soft/30 border border-success/30 flex items-start justify-between gap-4">
                        <div>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-success block mb-0.5">
                            Approved Replacement / Suggested Correction
                          </span>
                          <span className="text-sm font-medium text-ink-dark">
                            &ldquo;{f.suggested_correction}&rdquo;
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EXTRACTED CLAIMS (THREE MANDATORY FACTUAL STATES) */}
      {activeTab === 'claims' && (
        <Card className="bg-surface border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-ink-dark">
              Atomic Factual Claims & Verification States
            </CardTitle>
            <p className="text-xs text-ink-secondary">
              Strict evidence classification: SUPPORTED, CONTRADICTED, or UNVERIFIED. Missing evidence is never assumed false.
            </p>
          </CardHeader>
          <CardContent>
            {claims.length === 0 ? (
              <div className="text-center py-8 text-sm text-ink-secondary">
                No claims extracted yet. Run analysis to extract atomic statements.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <Thead>
                    <Tr>
                      <Th className="w-1/3">Extracted Claim</Th>
                      <Th className="w-32">Classification</Th>
                      <Th className="w-32">Status</Th>
                      <Th className="w-24">Confidence</Th>
                      <Th>Justification / Traceable Evidence</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {claims.map((claim) => (
                      <Tr key={claim.id} className="hover:bg-surface-subtle/50">
                        <Td className="font-medium text-ink-dark text-sm">
                          {claim.claim_text}
                        </Td>
                        <Td className="text-xs text-ink-secondary uppercase font-semibold">
                          {claim.claim_type.replace(/_/g, ' ')}
                        </Td>
                        <Td>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                              claim.verification_status === 'SUPPORTED'
                                ? 'bg-[#E9F2EB] text-[#52795F] border border-[#52795F]/30'
                                : claim.verification_status === 'CONTRADICTED'
                                ? 'bg-[#F9ECEC] text-[#B54B48] border border-[#B54B48]/30'
                                : 'bg-[#F5EDDF] text-[#B17C36] border border-[#B17C36]/30'
                            }`}
                          >
                            {claim.verification_status}
                          </span>
                        </Td>
                        <Td className="text-xs text-ink-secondary tnums">
                          {Math.round((claim.confidence ?? 0.8) * 100)}%
                        </Td>
                        <Td className="text-xs text-ink-secondary leading-relaxed">
                          {claim.explanation}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: CONTENT COMPARISON & CORRECTIONS */}
      {activeTab === 'diff' && (
        <div className="space-y-6">
          <Card className="p-6 bg-surface border border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-ink-dark">
                  Content Revision & Corrections
                </h3>
                <p className="text-xs text-ink-secondary">
                  Compare original submission against approved revisions. The original is always preserved.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {suggestedContent && (
                  <Button
                    onClick={() => handleApplySuggestedContent(suggestedContent)}
                    disabled={applyingCorrection}
                    size="sm"
                    className="btn-primary text-xs"
                  >
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    Apply All AI Suggestions
                  </Button>
                )}
                {submission.current_content !== submission.original_content && (
                  <Button
                    onClick={handleRestoreOriginal}
                    disabled={applyingCorrection}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <Undo2 className="w-3.5 h-3.5 mr-1.5" />
                    Restore Original
                  </Button>
                )}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Original Content */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">
                    Original Submitted Content (v1)
                  </span>
                  <span className="text-xs text-ink-secondary">Immutable</span>
                </div>
                <div className="p-4 rounded-lg border border-border bg-surface-subtle font-sans text-sm leading-relaxed text-ink whitespace-pre-wrap min-h-[220px]">
                  {submission.original_content}
                </div>
              </div>

              {/* Current or Revised Content */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">
                    Current Active Content {versions.length > 1 ? `(v${versions.length})` : ''}
                  </span>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-xs text-accent hover:underline font-semibold"
                  >
                    {isEditing ? 'Cancel Edit' : 'Edit Manually'}
                  </button>
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      rows={9}
                      className="textarea w-full text-sm leading-relaxed"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApplySuggestedContent(editingContent)}
                        disabled={applyingCorrection}
                        className="btn-primary text-xs"
                      >
                        Save Revised Content
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg border border-border bg-surface font-sans text-sm leading-relaxed text-ink-dark whitespace-pre-wrap min-h-[220px]">
                    {submission.current_content}
                  </div>
                )}
              </div>
            </div>

            {/* AI Suggested Content Preview if available */}
            {suggestedContent && suggestedContent !== submission.current_content && (
              <div className="mt-6 p-4 rounded-lg border border-success/30 bg-success-soft/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-success uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" /> Recommended Compliant Copy
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleApplySuggestedContent(suggestedContent)}
                    disabled={applyingCorrection}
                    className="btn-sm btn-accent text-xs h-7 px-3"
                  >
                    Accept This Revision
                  </Button>
                </div>
                <p className="text-sm text-ink-dark leading-relaxed font-sans whitespace-pre-wrap">
                  {suggestedContent}
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 4: HUMAN REVIEW & APPROVAL GATE */}
      {activeTab === 'approval' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sign-off Form */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-surface border border-border">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 text-accent" />
                  <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                    Human-in-the-Loop Governance
                  </span>
                </div>
                <h3 className="text-lg font-bold text-ink-dark">
                  Record Publishing Decision
                </h3>
                <p className="text-xs text-ink-secondary mt-0.5">
                  AI assists with claim verification, but final publication approval requires explicit human decision.
                </p>
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-5">
                <div>
                  <label className="label">Decision</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setDecision('APPROVED')}
                      className={`p-3.5 rounded-lg border text-left transition-all ${
                        decision === 'APPROVED'
                          ? 'border-success bg-success-soft/40 shadow-sm'
                          : 'border-border hover:bg-surface-subtle'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-sm text-success">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve</span>
                      </div>
                      <div className="text-[11px] text-ink-secondary mt-1">
                        Permit publication
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDecision('CHANGES_REQUESTED')}
                      className={`p-3.5 rounded-lg border text-left transition-all ${
                        decision === 'CHANGES_REQUESTED'
                          ? 'border-warning bg-warning-soft/40 shadow-sm'
                          : 'border-border hover:bg-surface-subtle'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-sm text-warning">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Request Changes</span>
                      </div>
                      <div className="text-[11px] text-ink-secondary mt-1">
                        Needs revision
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDecision('REJECTED')}
                      className={`p-3.5 rounded-lg border text-left transition-all ${
                        decision === 'REJECTED'
                          ? 'border-critical bg-critical-soft/40 shadow-sm'
                          : 'border-border hover:bg-surface-subtle'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-sm text-critical">
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </div>
                      <div className="text-[11px] text-ink-secondary mt-1">
                        Violates brand policies
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label">Reviewer Notes & Decision Rationale</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    placeholder="Provide traceable reasoning for your approval, rejection, or required changes..."
                    className="textarea w-full text-sm leading-relaxed"
                  />
                  <span className="text-[11px] text-ink-secondary mt-1 block">
                    This note is permanently recorded in the Brand Evidence Passport.
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-ink-secondary">
                    Reviewer: <span className="font-semibold text-ink-dark">Demo Reviewer</span>
                  </div>
                  <Button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="btn-primary"
                  >
                    {reviewSubmitting ? 'Recording Audit Event…' : 'Record Official Decision'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Past Review Audit Trail */}
          <div>
            <Card className="p-6 bg-surface border border-border">
              <h4 className="text-sm font-bold text-ink-dark uppercase tracking-wider mb-3">
                Decision Audit Trail
              </h4>
              {decisions.length === 0 ? (
                <div className="text-center py-6 text-xs text-ink-secondary">
                  No review decisions recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {decisions.map((d) => (
                    <div
                      key={d.id}
                      className="p-3.5 rounded-lg border border-border bg-surface-subtle text-xs"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <Badge variant={statusToVariant(d.decision)}>
                          {d.decision}
                        </Badge>
                        <span className="text-ink-secondary font-mono">
                          {formatDateTime(d.created_at)}
                        </span>
                      </div>
                      <p className="text-ink-dark leading-relaxed font-medium">
                        {d.comment || 'Decision recorded without additional notes.'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function statusToVariant(status: string): 'low' | 'medium' | 'high' | 'neutral' {
  switch (status) {
    case 'APPROVED':
      return 'low';
    case 'REJECTED':
      return 'high';
    case 'NEEDS_REVIEW':
    case 'CHANGES_REQUESTED':
      return 'medium';
    default:
      return 'neutral';
  }
}

