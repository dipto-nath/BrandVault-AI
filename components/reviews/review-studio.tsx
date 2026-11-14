'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert, Clock, FileText, CheckCircle2, XCircle, AlertTriangle,
  Play, RotateCw, Sparkles, ArrowRight, Shield, ShieldCheck, Check, Edit3, Undo2,
  ExternalLink, ChevronRight, MessageSquare, Info, ChevronLeft, Loader2
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
        throw new Error(data.error?.message || data.error || 'Review submission failed');
      }
      setReviewSuccess('Official review decision recorded in the Brand Evidence Passport.');
      setSubmission((prev) => ({ ...prev, status: decision }));
      router.refresh();
    } catch (err: any) {
      setAnalysisError(err.message || 'Failed to record review decision.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Apply AI suggested correction
  const handleApplyCorrection = async () => {
    if (!suggestedContent) return;
    setApplyingCorrection(true);
    try {
      const res = await fetch(`/api/submissions/${submission.id}/version`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: suggestedContent,
          change_reason: 'Applied AI-suggested correction',
        }),
      });
      if (!res.ok) throw new Error('Failed to create version');
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      setAnalysisError(err.message || 'Could not apply correction.');
    } finally {
      setApplyingCorrection(false);
    }
  };

  // Status badge variants
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUPPORTED': return 'low';
      case 'CONTRADICTED': return 'high';
      case 'UNVERIFIED': return 'medium';
      default: return 'neutral';
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'HIGH': return 'high';
      case 'MEDIUM': return 'medium';
      default: return 'low';
    }
  };

  // Tab configuration
  const tabs = [
    { id: 'findings', label: 'Findings', icon: ShieldAlert, count: findings.length },
    { id: 'claims', label: 'Extracted Claims', icon: FileText, count: claims.length },
    { id: 'diff', label: 'Content Diff', icon: Edit3, count: suggestedContent ? 1 : 0 },
    { id: 'approval', label: 'Review & Approve', icon: ShieldCheck, count: 0 },
  ] as const;

  return (
    <div className="space-y-6">
      {/* ── Submission Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-2">
        <div className="flex items-start gap-4">
          <Link
            href={`/reviews/${submission.id}`}
            className="btn-ghost btn-icon-sm text-ink-secondary hover:text-ink-dark"
            aria-label="Back to reviews"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={statusToVariant(submission.status)}>{getStatusLabel(submission.status)}</Badge>
              <Badge variant={getRiskBadge(submission.risk_level || 'LOW')}>{submission.risk_level || 'LOW'} Risk</Badge>
            </div>
            <h1 className="text-2xl font-bold text-ink-dark">{submission.title}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-ink-secondary">
              <span className="font-medium text-ink-dark">{submission.content_type}</span>
              <span>·</span>
              <span>{submission.channel}</span>
              <span>·</span>
              <span>Submitted {formatDateTime(submission.created_at)}</span>
              <span>·</span>
              <span className="font-mono">REV-{submission.id.slice(0, 8).toUpperCase()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/passports/${submission.id}`}>
            <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs">
              <Shield className="w-3.5 h-3.5" />
              <span>View Passport</span>
            </Button>
          </Link>
          {submission.status !== 'APPROVED' && submission.status !== 'REJECTED' && (
            <Button
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="btn-primary flex items-center gap-1.5 text-xs"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing…</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Run Analysis</span>
                </>)
            }
            </Button>
          )}
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="border-b border-border">
        <nav className="flex gap-1 overflow-x-auto pb-px" aria-label="Review sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={
                activeTab === tab.id
                  ? "btn-primary text-xs whitespace-nowrap"
                  : "btn-ghost text-xs whitespace-nowrap text-ink-secondary hover:text-ink-dark"
              }
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span className="ml-1">{tab.label}</span>
              {tab.count > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-surface-subtle text-ink-secondary">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Tab Panels ── */}
      {activeTab === 'findings' && (
        <FindingsPanel
          findings={findings}
          submissionId={submission.id}
          onUpdate={handleRunAnalysis}
        />
      )}
      {activeTab === 'claims' && (
        <ClaimsPanel claims={claims} />
      )}
      {activeTab === 'diff' && (
        <DiffPanel
          originalContent={submission.original_content}
          currentContent={submission.current_content}
          suggestedContent={suggestedContent}
          onApplyCorrection={handleApplyCorrection}
          isApplying={applyingCorrection}
        />
      )}
      {activeTab === 'approval' && (
        <ApprovalPanel
          submission={submission}
          findings={findings}
          decisions={decisions}
          decision={decision}
          setDecision={setDecision}
          comment={comment}
          setComment={setComment}
          reviewSubmitting={reviewSubmitting}
          reviewSuccess={reviewSuccess}
          onSubmit={handleReviewSubmit}
        />
      )}

      {/* Analysis Error Toast */}
      {analysisError && (
        <div className="card border-critical/30 bg-critical-soft/20 p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-critical flex-shrink-0" />
          <p className="text-sm text-critical">{analysisError}</p>
        </div>
      )}
      {reviewSuccess && (
        <div className="card border-success/30 bg-success-soft/20 p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
          <p className="text-sm text-success">{reviewSuccess}</p>
        </div>
      )}
    </div>
  );
}

// ─── Findings Panel ───
function FindingsPanel({
  findings,
  submissionId,
  onUpdate,
}: {
  findings: ReviewStudioProps['findings'];
  submissionId: string;
  onUpdate: () => void;
}) {
  if (findings.length === 0) {
    return (
      <div className="card p-12 text-center bg-surface-subtle border border-border/50">
        <ShieldAlert className="w-16 h-16 text-ink-muted mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-ink-dark mb-2">No findings detected</h3>
        <p className="text-sm text-ink-secondary mb-6">
          The content appears clean. Run analysis to verify against brand guidelines.
        </p>
        <Button onClick={onUpdate} className="btn-primary">
          <Play className="w-4 h-4 mr-2" /> Run Full Analysis
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {findings.map((finding) => (
        <FindingCard key={finding.id} finding={finding} submissionId={submissionId} />
      ))}
    </div>
  );
}

function FindingCard({
  finding,
  submissionId,
}: {
  finding: ReviewStudioProps['findings'][0];
  submissionId: string;
}) {
  const evidence = finding.finding_evidence || [];
  const hasEvidence = evidence.length > 0;

  return (
    <Card className="bg-surface border border-border">
      <CardContent className="p-5 space-y-4">
        {/* Finding Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-ink-dark">{finding.finding_type}</span>
              <Badge variant={getStatusBadge(finding.status)}>{finding.status}</Badge>
              <Badge variant={getRiskBadge(finding.severity)}>{finding.severity}</Badge>
            </div>
            {finding.rule_id && (
              <span className="font-mono text-xs text-ink-secondary">Rule: {finding.rule_id.slice(0, 8).toUpperCase()}</span>
            )}
          </div>
          <Link
            href={`/reviews/${submissionId}/findings/${finding.id}`}
            className="btn-ghost btn-icon-sm text-ink-secondary hover:text-ink-dark shrink-0"
            title="View details"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Finding Message */}
        <div className="text-sm text-ink leading-relaxed">{finding.message}</div>

        {/* Suggested Correction */}
        {finding.suggested_correction && (
          <div className="p-3 rounded-lg bg-surface-subtle border border-border space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-ink-secondary">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>AI Suggested Correction</span>
            </div>
            <p className="text-sm text-ink-dark font-medium">{finding.suggested_correction}</p>
          </div>
        )}

        {/* Evidence */}
        {hasEvidence && (
          <div className="pt-2 border-t border-border space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-ink-secondary uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-accent" />
              <span>Supporting Evidence ({evidence.length})</span>
            </div>
            <div className="space-y-2">
              {evidence.map((ev) => (
                <div key={ev.id} className="p-3 rounded-lg bg-surface border border-border">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {ev.approved_facts && (
                        <div className="text-sm font-medium text-ink-dark mb-1">
                          {ev.approved_facts.fact_code}: {ev.approved_facts.title}
                        </div>
                      )}
                      {ev.evidence_text && (
                        <p className="text-sm text-ink leading-relaxed">
                          "{ev.evidence_text}"
                        </p>
                      )}
                      {ev.source_reference && (
                        <span className="text-xs text-ink-secondary">Source: {ev.source_reference}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {ev.match_type === 'SUPPORTED' && <Badge variant="low">Supported</Badge>}
                      {ev.match_type === 'CONTRADICTED' && <Badge variant="high">Contradicted</Badge>}
                      {ev.match_type === 'PARTIAL' && <Badge variant="medium">Partial</Badge>}
                      {ev.match_type === 'UNVERIFIED' && <Badge variant="neutral">Unverified</Badge>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Claims Panel ───
function ClaimsPanel({ claims }: { claims: ReviewStudioProps['claims'] }) {
  if (claims.length === 0) {
    return (
      <div className="card p-12 text-center bg-surface-subtle border border-border/50">
        <FileText className="w-16 h-16 text-ink-muted mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-ink-dark mb-2">No claims extracted</h3>
        <p className="text-sm text-ink-secondary">Run analysis to extract factual claims from the content.</p>
      </div>
    );
  }

  return (
    <div className="card bg-surface border border-border overflow-hidden">
      <Table>
        <Thead>
          <Tr>
            <Th className="w-2/5">Claim Text</Th>
            <Th className="w-28">Type</Th>
            <Th className="w-32">Status</Th>
            <Th className="w-28">Confidence</Th>
            <Th className="w-32">Risk</Th>
          </Tr>
        </Thead>
        <Tbody>
          {claims.map((claim) => (
            <Tr key={claim.id} className="hover:bg-surface-hover">
              <Td className="text-sm text-ink-dark max-w-xs truncate">{claim.claim_text}</Td>
              <Td className="text-xs text-ink-secondary">{claim.claim_type}</Td>
              <Td><Badge variant={getStatusBadge(claim.status)}>{claim.status}</Badge></Td>
              <Td className="text-xs text-ink-secondary">{Math.round((claim.confidence || 0) * 100)}%</Td>
              <Td><Badge variant={getRiskBadge(claim.risk_level || 'LOW')}>{claim.risk_level || 'LOW'}</Badge></Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </div>
  );
}

// ─── Diff Panel ───
function DiffPanel({
  originalContent,
  currentContent,
  suggestedContent,
  onApplyCorrection,
  isApplying,
}: {
  originalContent: string;
  currentContent: string;
  suggestedContent: string | null;
  onApplyCorrection: () => void;
  isApplying: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Original vs Current */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card bg-surface border border-border p-4">
          <h4 className="text-sm font-semibold text-ink-secondary uppercase tracking-wider mb-3">Original Submission</h4>
          <pre className="text-sm text-ink leading-relaxed whitespace-pre-wrap bg-surface-subtle p-4 rounded-lg border border-border max-h-96 overflow-auto">{originalContent}</pre>
        </div>
        <div className="card bg-surface border border-border p-4">
          <h4 className="text-sm font-semibold text-ink-secondary uppercase tracking-wider mb-3">Current Version</h4>
          <pre className="text-sm text-ink leading-relaxed whitespace-pre-wrap bg-surface-subtle p-4 rounded-lg border border-border max-h-96 overflow-auto">{currentContent}</pre>
        </div>
      </div>

      {/* AI Suggested Correction */}
      {suggestedContent && (
        <div className="card bg-accent-soft/20 border-accent/30 p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-accent">
              <Sparkles className="w-4 h-4" /> AI Suggested Correction
            </h4>
            <Button onClick={onApplyCorrection} disabled={isApplying} className="btn-primary text-xs">
              {isApplying ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />Applying…</>
              ) : (
                <><Check className="w-3.5 h-3.5 mr-2" />Apply Correction</>
              )}
            </Button>
          </div>
          <pre className="text-sm text-ink-dark leading-relaxed whitespace-pre-wrap bg-surface p-4 rounded-lg border border-accent/30 max-h-96 overflow-auto">{suggestedContent}</pre>
          <p className="text-xs text-ink-secondary mt-2">This correction addresses all flagged findings. Review before applying.</p>
        </div>
      )}
    </div>
  );
}

// ─── Approval Panel ───
function ApprovalPanel({
  submission,
  findings,
  decisions,
  decision,
  setDecision,
  comment,
  setComment,
  reviewSubmitting,
  reviewSuccess,
  onSubmit,
}: {
  submission: ReviewStudioProps['submission'];
  findings: ReviewStudioProps['findings'];
  decisions: ReviewStudioProps['decisions'];
  decision: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
  setDecision: (d: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED') => void;
  comment: string;
  setComment: (c: string) => void;
  reviewSubmitting: boolean;
  reviewSuccess: string | null;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const highRiskFindings = findings.filter(f => f.severity === 'HIGH').length;
  const contradictedFindings = findings.filter(f => f.status === 'CONTRADICTED').length;
  const unverifiedFindings = findings.filter(f => f.status === 'UNVERIFIED').length;

  return (
    <div className="space-y-6">
      {/* Risk Summary */}
      <div className="card bg-surface border border-border p-5">
        <h4 className="text-sm font-bold text-ink-dark uppercase tracking-wider mb-4">Risk Assessment Summary</h4>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="p-3 rounded-lg bg-critical-soft/30 border border-critical/20">
            <div className="text-2xl font-bold text-critical tnums">{highRiskFindings}</div>
            <div className="text-xs text-ink-secondary mt-1">High Severity Findings</div>
          </div>
          <div className="p-3 rounded-lg bg-warning-soft/30 border border-warning/20">
            <div className="text-2xl font-bold text-warning tnums">{contradictedFindings}</div>
            <div className="text-xs text-ink-secondary mt-1">Contradicted Claims</div>
          </div>
          <div className="p-3 rounded-lg bg-accent-soft/30 border border-accent/20">
            <div className="text-2xl font-bold text-accent tnums">{unverifiedFindings}</div>
            <div className="text-xs text-ink-secondary mt-1">Unverified Claims</div>
          </div>
        </div>
      </div>

      {/* Decision Form */}
      <form onSubmit={onSubmit} className="space-y-6">
        <Card className="bg-surface border border-border">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base font-bold text-ink-dark">Record Official Review Decision</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-5">
            {/* Decision Buttons */}
            <div>
              <label className="label">Review Decision</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'APPROVED', label: 'Approve', icon: CheckCircle2, desc: 'Content meets all brand standards', color: 'success' },
                  { value: 'REJECTED', label: 'Reject', icon: XCircle, desc: 'Content violates brand policies', color: 'critical' },
                  { value: 'CHANGES_REQUESTED', label: 'Changes Required', icon: AlertTriangle, desc: 'Requires revisions before approval', color: 'warning' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDecision(opt.value as any)}
                    className={
                      decision === opt.value
                        ? "p-4 rounded-lg border-2 text-left transition-all " +
                          (opt.color === 'success' ? "border-success bg-success-soft" :
                           opt.color === 'critical' ? "border-critical bg-critical-soft" :
                           "border-warning bg-warning-soft")
                        : "p-4 rounded-lg border border-border bg-surface hover:bg-surface-hover text-left transition-all"
                    }
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <opt.icon className={"w-4 h-4 " + (opt.color === 'success' ? "text-success" : opt.color === 'critical' ? "text-critical" : "text-warning")} />
                      <span className="font-semibold text-ink-dark">{opt.label}</span>
                    </div>
                    <div className="text-[11px] text-ink-secondary">{opt.desc}</div>
                  </button>
                ))}
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
              <Button type="submit" disabled={reviewSubmitting} className="btn-primary">
                {reviewSubmitting ? 'Recording Audit Event…' : 'Record Official Decision'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Past Review Audit Trail */}
        <Card className="bg-surface border border-border">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base font-bold text-ink-dark">Decision Audit Trail</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {decisions.length === 0 ? (
              <div className="text-center py-6 text-xs text-ink-secondary">
                No review decisions recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {decisions.map((d) => (
                  <div key={d.id} className="p-3.5 rounded-lg border border-border bg-surface-subtle text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <Badge variant={statusToVariant(d.decision)}>{d.decision}</Badge>
                      <span className="text-ink-secondary font-mono">{formatDateTime(d.created_at)}</span>
                    </div>
                    <p className="text-ink-dark leading-relaxed font-medium">{d.comment || 'Decision recorded without additional notes.'}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

function statusToVariant(status: string): 'low' | 'medium' | 'high' | 'neutral' {
  switch (status) {
    case 'APPROVED': return 'low';
    case 'REJECTED': return 'high';
    case 'NEEDS_REVIEW':
    case 'CHANGES_REQUESTED': return 'medium';
    default: return 'neutral';
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'SUPPORTED': return 'low';
    case 'CONTRADICTED': return 'high';
    case 'UNVERIFIED': return 'medium';
    default: return 'neutral';
  }
}

function getRiskBadge(risk: string) {
  switch (risk) {
    case 'HIGH': return 'high';
    case 'MEDIUM': return 'medium';
    default: return 'low';
  }
}
