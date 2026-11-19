'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert, Clock, FileText, CheckCircle2, XCircle, AlertTriangle,
  Play, RotateCw, Sparkles, ArrowRight, Shield, ShieldCheck, Check, Edit3, Undo2,
  ExternalLink, ChevronRight, MessageSquare, Info, ChevronLeft, Loader2,
  Copy, CheckCheck, Eye, SlidersHorizontal, BookOpen, AlertCircle,
  HelpCircle, ThumbsUp, ThumbsDown, CornerDownRight, Split, RefreshCw, X,
  CheckCircle, ArrowUpRight, Flame, ShieldX
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { formatDateTime, getStatusLabel, getSubmissionReference, getPassportReference } from '@/lib/utils';
import type {
  ContentSubmission, ExtractedClaim, Finding, AnalysisRun,
  ReviewDecisionRecord, ContentVersion, FindingEvidence, ApprovedFact, BrandGuideline
} from '@/types/database';
import { mapRawFindingsToViewModel, FindingViewModel, FindingOccurrence } from './finding-mapper';

interface ReviewStudioProps {
  submission: ContentSubmission;
  claims: ExtractedClaim[];
  findings: Array<Finding & { finding_evidence?: Array<FindingEvidence & { approved_facts?: ApprovedFact; source_documents?: any }> }>;
  analysisRuns: AnalysisRun[];
  decisions: ReviewDecisionRecord[];
  versions: ContentVersion[];
  allGuidelines?: BrandGuideline[];
  allFacts?: ApprovedFact[];
}

export function ReviewStudio({
  submission: initialSubmission,
  claims: initialClaims,
  findings: initialFindings,
  analysisRuns: initialRuns,
  decisions: initialDecisions,
  versions: initialVersions,
  allGuidelines = [],
  allFacts = [],
}: ReviewStudioProps) {
  const router = useRouter();
  const [submission, setSubmission] = useState(initialSubmission);
  const [claims, setClaims] = useState(initialClaims);
  const [decisions, setDecisions] = useState(initialDecisions);
  const [versions, setVersions] = useState(initialVersions);

  // Active view tab: 'findings' | 'claims' | 'diff' | 'approval' | 'activity'
  const [activeTab, setActiveTab] = useState<'findings' | 'claims' | 'diff' | 'approval' | 'activity'>('findings');

  // Map raw findings to polished view models
  const initialViewModels = useMemo(() => {
    return mapRawFindingsToViewModel(initialFindings, allGuidelines, allFacts);
  }, [initialFindings, allGuidelines, allFacts]);

  const [findingModels, setFindingModels] = useState<FindingViewModel[]>(initialViewModels);

  // Interactive selection / bidirectional scroll
  const [activeFindingId, setActiveFindingId] = useState<string | null>(null);
  const [highlightedExcerpt, setHighlightedExcerpt] = useState<string | null>(null);

  // Filter & sorting state
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'contradicted' | 'unverified' | 'terminology' | 'tone'>('ALL');
  const [sortBy, setSortBy] = useState<'severity' | 'position'>('severity');

  // Copy view: 'original' | 'revised'
  const [copyMode, setCopyMode] = useState<'original' | 'revised'>('original');

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Inline edit state for suggestions
  const [editingFindingId, setEditingFindingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  // Override modal state
  const [overrideModalFinding, setOverrideModalFinding] = useState<FindingViewModel | null>(null);
  const [overrideReasonInput, setOverrideReasonInput] = useState('');

  // Decision state
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [decisionComment, setDecisionComment] = useState('');
  const [stampAnimation, setStampAnimation] = useState<'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED' | null>(null);
  const [decisionModalOpen, setDecisionModalOpen] = useState<'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED' | null>(null);

  // Copy reference state
  const [copiedRef, setCopiedRef] = useState(false);

  // Keyboard shortcut dialog
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Compute live counts
  const totalFindingsCount = findingModels.length;
  const criticalFindings = findingModels.filter(f => f.severity === 'CRITICAL' && f.state === 'OPEN');
  const openFindings = findingModels.filter(f => f.state === 'OPEN');
  const resolvedFindings = findingModels.filter(f => f.state !== 'OPEN');

  const contradictedCount = findingModels.filter(f => f.category === 'contradicted').length;
  const unverifiedCount = findingModels.filter(f => f.category === 'unverified').length;
  const terminologyCount = findingModels.filter(f => f.category === 'terminology').length;
  const toneCount = findingModels.filter(f => f.category === 'tone').length;

  const canApprove = criticalFindings.length === 0;

  // Filtered & sorted findings
  const displayedFindings = useMemo(() => {
    let list = [...findingModels];
    if (categoryFilter !== 'ALL') {
      list = list.filter(f => f.category === categoryFilter);
    }
    if (sortBy === 'severity') {
      const rank: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      list.sort((a, b) => {
        // Open items first
        if (a.state === 'OPEN' && b.state !== 'OPEN') return -1;
        if (a.state !== 'OPEN' && b.state === 'OPEN') return 1;
        return (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9);
      });
    } else {
      list.sort((a, b) => a.number - b.number);
    }
    return list;
  }, [findingModels, categoryFilter, sortBy]);

  // Derived revised content based on accepted suggestions
  const revisedContent = useMemo(() => {
    let text = submission.current_content;
    findingModels.forEach(f => {
      if (f.state === 'ACCEPTED' && f.suggestedRewrite) {
        if (f.occurrences && f.occurrences.length > 0) {
          f.occurrences.forEach(occ => {
            if (occ.suggestedCorrection) {
              text = text.split(occ.excerpt).join(occ.suggestedCorrection);
            }
          });
        } else if (f.suggestedRewrite.original && f.suggestedRewrite.replacement) {
          text = text.split(f.suggestedRewrite.original).join(f.suggestedRewrite.replacement);
        }
      }
    });
    return text;
  }, [submission.current_content, findingModels]);

  // Handle Accept finding
  const handleAccept = (findingId: string) => {
    setFindingModels(prev => prev.map(f => {
      if (f.id === findingId) {
        return {
          ...f,
          state: 'ACCEPTED',
          occurrences: f.occurrences.map(o => ({ ...o, accepted: true, dismissed: false }))
        };
      }
      return f;
    }));
  };

  // Handle Dismiss finding
  const handleDismiss = (findingId: string) => {
    setFindingModels(prev => prev.map(f => {
      if (f.id === findingId) {
        return {
          ...f,
          state: 'DISMISSED',
          occurrences: f.occurrences.map(o => ({ ...o, dismissed: true, accepted: false }))
        };
      }
      return f;
    }));
  };

  // Handle Reopen / Undo action
  const handleReopen = (findingId: string) => {
    setFindingModels(prev => prev.map(f => {
      if (f.id === findingId) {
        return {
          ...f,
          state: 'OPEN',
          overrideReason: undefined,
          occurrences: f.occurrences.map(o => ({ ...o, accepted: false, dismissed: false }))
        };
      }
      return f;
    }));
  };

  // Handle Accept individual occurrence in grouped terminology
  const handleToggleOccurrence = (findingId: string, occId: string, accept: boolean) => {
    setFindingModels(prev => prev.map(f => {
      if (f.id === findingId) {
        const updatedOccurrences = f.occurrences.map(o => {
          if (o.id === occId) {
            return { ...o, accepted: accept, dismissed: !accept };
          }
          return o;
        });
        const allAccepted = updatedOccurrences.every(o => o.accepted);
        const anyAccepted = updatedOccurrences.some(o => o.accepted);
        return {
          ...f,
          occurrences: updatedOccurrences,
          state: allAccepted ? 'ACCEPTED' : anyAccepted ? 'OPEN' : f.state
        };
      }
      return f;
    }));
  };

  // Handle Fix All occurrences
  const handleFixAllOccurrences = (findingId: string) => {
    setFindingModels(prev => prev.map(f => {
      if (f.id === findingId) {
        return {
          ...f,
          state: 'ACCEPTED',
          occurrences: f.occurrences.map(o => ({ ...o, accepted: true, dismissed: false }))
        };
      }
      return f;
    }));
  };

  // Handle Override
  const handleSaveOverride = () => {
    if (!overrideModalFinding || !overrideReasonInput.trim()) return;
    setFindingModels(prev => prev.map(f => {
      if (f.id === overrideModalFinding.id) {
        return {
          ...f,
          state: 'OVERRIDDEN',
          overrideReason: overrideReasonInput.trim()
        };
      }
      return f;
    }));
    setOverrideModalFinding(null);
    setOverrideReasonInput('');
  };

  // Handle Inline Edit Save
  const handleSaveEditedRewrite = (findingId: string) => {
    setFindingModels(prev => prev.map(f => {
      if (f.id === findingId) {
        return {
          ...f,
          state: 'ACCEPTED',
          suggestedRewrite: f.suggestedRewrite ? {
            ...f.suggestedRewrite,
            replacement: editingText
          } : { original: f.flaggedExcerpt, replacement: editingText }
        };
      }
      return f;
    }));
    setEditingFindingId(null);
  };

  // Re-run analysis handler
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
  const executeReviewDecision = async (dec: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED') => {
    setReviewSubmitting(true);
    try {
      const res = await fetch(`/api/submissions/${submission.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: dec,
          comment: decisionComment.trim() || undefined,
          revised_content: copyMode === 'revised' || findingModels.some(f => f.state === 'ACCEPTED') ? revisedContent : undefined
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error?.message || data.error || 'Review submission failed');
      }

      setDecisionModalOpen(null);
      setStampAnimation(dec);

      setTimeout(() => {
        if (dec === 'APPROVED') {
          window.location.href = `/passports/${submission.id}`;
        } else {
          window.location.reload();
        }
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Error recording review decision.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Scroll to finding card when highlight clicked
  const scrollToFinding = (findingId: string) => {
    setActiveFindingId(findingId);
    const el = document.getElementById(`finding-card-${findingId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-accent-terracotta');
      setTimeout(() => el.classList.remove('ring-2', 'ring-accent-terracotta'), 2000);
    }
  };

  // Scroll to text excerpt when finding card clicked
  const scrollToExcerpt = (excerpt: string, findingId: string) => {
    setActiveFindingId(findingId);
    setHighlightedExcerpt(excerpt);
    const el = document.getElementById(`highlight-${findingId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Keyboard navigation (J / K / A / D / ?)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === '?') {
        setShowShortcuts(prev => !prev);
        return;
      }

      const openList = displayedFindings;
      if (!openList.length) return;
      const currentIndex = openList.findIndex(f => f.id === activeFindingId);

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = currentIndex < openList.length - 1 ? openList[currentIndex + 1] : openList[0];
        scrollToFinding(next.id);
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = currentIndex > 0 ? openList[currentIndex - 1] : openList[openList.length - 1];
        scrollToFinding(prev.id);
      } else if (e.key === 'a' && activeFindingId) {
        e.preventDefault();
        handleAccept(activeFindingId);
      } else if (e.key === 'd' && activeFindingId) {
        e.preventDefault();
        handleDismiss(activeFindingId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [displayedFindings, activeFindingId]);

  const copyRefCode = () => {
    navigator.clipboard.writeText(getSubmissionReference(submission));
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const [copiedRevised, setCopiedRevised] = useState(false);
  const copyRevisedDraft = () => {
    navigator.clipboard.writeText(revisedContent);
    setCopiedRevised(true);
    setTimeout(() => setCopiedRevised(false), 2000);
  };

  const passportRef = getPassportReference(submission);

  return (
    <div className="space-y-6 pb-28 text-ink-dark">
      {/* 4.1 Header */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/reviews"
              className="inline-flex items-center gap-1.5 text-ink-muted hover:text-ink-dark transition-colors font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Content reviews
            </Link>
            <span className="text-sand-dark">•</span>
            <button
              onClick={copyRefCode}
              title="Click to copy submission reference"
              className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded bg-sand/60 hover:bg-sand text-ink-dark border border-sand-dark/40 transition-colors"
            >
              {getSubmissionReference(submission)}
              {copiedRef ? <CheckCheck className="w-3 h-3 text-evidence-supported" /> : <Copy className="w-3 h-3 text-ink-muted" />}
            </button>
            <Badge variant="outline" className="text-xs uppercase tracking-wider font-semibold">
              {submission.channel || 'General'}
            </Badge>
          </div>

          {/* Stepper */}
          <div className="hidden lg:flex items-center gap-2 text-xs bg-surface border border-sand-dark/30 rounded-full px-4 py-1.5 shadow-sm">
            <span className="flex items-center gap-1 text-evidence-supported font-medium">
              <CheckCircle className="w-3.5 h-3.5" /> 1 Draft
            </span>
            <span className="text-sand-dark">→</span>
            <span className="flex items-center gap-1 text-evidence-supported font-medium">
              <CheckCircle className="w-3.5 h-3.5" /> 2 Analysed
            </span>
            <span className="text-sand-dark">→</span>
            <span className="flex items-center gap-1 text-brand font-semibold px-2 py-0.5 rounded-full bg-brand/10">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
              3 In review
            </span>
            <span className="text-sand-dark">→</span>
            <span className="flex items-center gap-1 text-ink-muted">
              4 Decision
            </span>
            <span className="text-sand-dark">→</span>
            <span className="flex items-center gap-1 text-ink-muted">
              5 Passport
            </span>
          </div>
        </div>

        {/* Title and Top Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-ink-dark tracking-tight">
                {submission.title || 'Untitled submission'}
              </h1>
              <Badge
                variant={
                  submission.status === 'APPROVED' ? 'success' :
                  submission.status === 'REJECTED' ? 'danger' :
                  submission.status === 'CHANGES_REQUESTED' ? 'warning' : 'neutral'
                }
                className="font-medium capitalize text-xs"
              >
                {getStatusLabel(submission.status)}
              </Badge>
            </div>
            <p className="text-xs text-ink-muted flex flex-wrap items-center gap-2">
              <span suppressHydrationWarning>Submitted {formatDateTime(submission.created_at)}</span>
              <span>•</span>
              <span>Version {versions.length || 1}</span>
              {submission.status === 'APPROVED' && (
                <>
                  <span>•</span>
                  <span className="text-evidence-supported font-mono font-medium">Passport: {passportRef}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="gap-2 bg-surface hover:bg-cream border-sand-dark/50 text-ink-dark"
            >
              <RotateCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin text-brand' : 'text-ink-muted'}`} />
              {analyzing ? 'Analysing draft...' : 'Re-run analysis'}
            </Button>

            <Link href={`/passports/${submission.id}`}>
              <Button
                variant={submission.status === 'APPROVED' ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                View passport
              </Button>
            </Link>

            <button
              onClick={() => setShowShortcuts(true)}
              title="Keyboard shortcuts (?)"
              className="p-2 rounded-lg border border-sand-dark/40 hover:bg-sand/40 text-ink-muted hover:text-ink-dark text-xs"
            >
              <kbd className="font-mono text-xs font-semibold">?</kbd>
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Error Alert */}
      {analysisError && (
        <div className="p-3.5 rounded-xl border border-evidence-contradicted/30 bg-evidence-contradicted/10 text-evidence-contradicted text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{analysisError}</span>
          </div>
          <button onClick={() => setAnalysisError(null)} className="hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4.2 Verdict Summary Strip */}
      <Card className="border-sand-dark/40 bg-surface shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Verdict Overview:</span>
              <button
                onClick={() => setCategoryFilter(categoryFilter === 'contradicted' ? 'ALL' : 'contradicted')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                  categoryFilter === 'contradicted'
                    ? 'bg-evidence-contradicted text-white ring-2 ring-evidence-contradicted/40'
                    : 'bg-evidence-contradicted/15 text-evidence-contradicted hover:bg-evidence-contradicted/25'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-evidence-contradicted" />
                {contradictedCount} Contradicted
              </button>

              <button
                onClick={() => setCategoryFilter(categoryFilter === 'unverified' ? 'ALL' : 'unverified')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                  categoryFilter === 'unverified'
                    ? 'bg-evidence-unverified text-white ring-2 ring-evidence-unverified/40'
                    : 'bg-evidence-unverified/15 text-evidence-unverified hover:bg-evidence-unverified/25'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-evidence-unverified" />
                {unverifiedCount} Unverified
              </button>

              <button
                onClick={() => setCategoryFilter(categoryFilter === 'terminology' ? 'ALL' : 'terminology')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                  categoryFilter === 'terminology'
                    ? 'bg-ink-dark text-white ring-2 ring-ink-dark/40'
                    : 'bg-sand text-ink-dark hover:bg-sand-dark/40'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-ink-muted" />
                {terminologyCount} Terminology
              </button>

              <button
                onClick={() => setCategoryFilter(categoryFilter === 'tone' ? 'ALL' : 'tone')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                  categoryFilter === 'tone'
                    ? 'bg-accent-terracotta text-white ring-2 ring-accent-terracotta/40'
                    : 'bg-accent-terracotta/15 text-accent-terracotta hover:bg-accent-terracotta/25'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-accent-terracotta" />
                {toneCount} Tone
              </button>
            </div>
            <p className="text-xs text-ink-secondary">
              {criticalFindings.length > 0
                ? `${criticalFindings.length} critical finding${criticalFindings.length > 1 ? 's' : ''} blocking approval. Resolve or override to proceed.`
                : 'All critical findings resolved. Ready for approval review.'}
            </p>
          </div>

          {/* Resolution Progress */}
          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-sand-dark/30 pt-3 md:pt-0 md:pl-5">
            <div className="text-right">
              <div className="text-xs font-semibold text-ink-dark">
                {resolvedFindings.length} of {totalFindingsCount} resolved
              </div>
              <div className="text-[11px] text-ink-muted">
                {Math.round((resolvedFindings.length / (totalFindingsCount || 1)) * 100)}% complete
              </div>
            </div>
            <div className="w-24 h-2.5 bg-sand rounded-full overflow-hidden border border-sand-dark/40">
              <div
                className="h-full bg-evidence-supported transition-all duration-300"
                style={{ width: `${(resolvedFindings.length / (totalFindingsCount || 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs Bar */}
      <div className="flex border-b border-sand-dark/40 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('findings')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'findings'
              ? 'text-brand font-semibold'
              : 'text-ink-muted hover:text-ink-dark'
          }`}
        >
          Findings & Copy Desk
          {openFindings.length === 0 ? (
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-supported-soft text-supported font-bold">
              ✓ {findingModels.length} resolved
            </span>
          ) : (
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-brand-soft text-brand font-bold">
              {findingModels.length} ({openFindings.length} open)
            </span>
          )}
          {activeTab === 'findings' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('claims')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'claims'
              ? 'text-brand font-semibold'
              : 'text-ink-muted hover:text-ink-dark'
          }`}
        >
          Extracted Claims
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-sand text-ink-secondary">
            {claims.length}
          </span>
          {activeTab === 'claims' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('diff')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'diff'
              ? 'text-brand font-semibold'
              : 'text-ink-muted hover:text-ink-dark'
          }`}
        >
          Content Diff
          {activeTab === 'diff' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'activity'
              ? 'text-brand font-semibold'
              : 'text-ink-muted hover:text-ink-dark'
          }`}
        >
          Audit History & Decisions
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-sand text-ink-secondary">
            {decisions.length}
          </span>
          {activeTab === 'activity' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />
          )}
        </button>
      </div>

      {/* TAB 1: FINDINGS & SPLIT-PANE DESK */}
      {activeTab === 'findings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Submitted Copy (5/12) */}
          <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-4 self-start">
            <Card className="border-sand-dark/40 bg-surface shadow-xs">
              <CardHeader className="py-3 px-4 border-b border-sand-dark/30 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-ink-muted" />
                  <CardTitle className="text-sm font-bold text-ink-dark">Submitted Copy</CardTitle>
                </div>
                {/* Original / Revised toggle */}
                <div className="flex items-center rounded-lg bg-sand/60 p-0.5 border border-sand-dark/30 text-xs font-semibold">
                  <button
                    onClick={() => setCopyMode('original')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      copyMode === 'original'
                        ? 'bg-surface text-ink-dark shadow-xs'
                        : 'text-ink-muted hover:text-ink-dark'
                    }`}
                  >
                    Original
                  </button>
                  <button
                    onClick={() => setCopyMode('revised')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      copyMode === 'revised'
                        ? 'bg-surface text-ink-dark shadow-xs'
                        : 'text-ink-muted hover:text-ink-dark'
                    }`}
                  >
                    Revised
                    {findingModels.some(f => f.state === 'ACCEPTED') && (
                      <span className="ml-1 w-1.5 h-1.5 rounded-full bg-evidence-supported inline-block" />
                    )}
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-5">
                <div className="font-serif text-base sm:text-lg leading-relaxed text-ink-dark/95 whitespace-pre-wrap select-text">
                  {copyMode === 'original' ? (
                    // Highlighted original copy
                    <RenderHighlightedCopy
                      text={submission.current_content}
                      findings={findingModels}
                      activeFindingId={activeFindingId}
                      onHighlightClick={scrollToFinding}
                    />
                  ) : (
                    // Revised copy with changes applied
                    <div className="space-y-4 font-sans">
                      <div className="p-3 bg-supported-soft/60 rounded-xl border border-supported/30 text-xs flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-ink-dark font-medium">
                          <Sparkles className="w-3.5 h-3.5 text-supported" />
                          <span>
                            {findingModels.filter(f => f.state === 'ACCEPTED').length > 0
                              ? `${findingModels.filter(f => f.state === 'ACCEPTED').length} accepted correction(s) applied live.`
                              : 'No corrections accepted yet. Accept suggestions on the right to see live updates.'}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyRevisedDraft}
                          className="h-7 text-xs bg-surface border-sand-dark/40 hover:bg-sand/40 font-medium"
                        >
                          {copiedRevised ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-supported mr-1 stroke-[2.5]" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-ink-muted mr-1" />
                              Copy revised draft
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="p-4 bg-sand/20 rounded-xl border border-sand-dark/30 font-serif text-base sm:text-lg leading-relaxed text-ink-dark/95 whitespace-pre-wrap select-text">
                        {revisedContent}
                      </div>
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="mt-6 pt-4 border-t border-sand-dark/30 text-[11px] text-ink-muted flex flex-wrap items-center gap-3">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Highlights:</span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-xs bg-evidence-contradicted/25 border-b-2 border-evidence-contradicted" />
                    Contradicted
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-xs bg-evidence-unverified/25 border-b-2 border-evidence-unverified" />
                    Unverified
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-xs bg-accent-terracotta/25 border-b-2 border-accent-terracotta" />
                    Tone / Terminology
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Context Card */}
            <div className="p-4 rounded-xl border border-sand-dark/40 bg-sand/30 text-xs text-ink-secondary space-y-2">
              <div className="font-semibold text-ink-dark flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-brand" />
                Reviewer Instructions
              </div>
              <p>
                Click any highlighted phrase to jump to its policy finding. Accepting a correction updates the live revised draft. All critical issues must be resolved or justified with an override note before final sign-off.
              </p>
            </div>
          </div>

          {/* Right Column: Findings List (7/12) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-sand-dark/40">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-ink-muted" />
                <span className="text-xs font-semibold text-ink-dark">
                  Showing {displayedFindings.length} of {findingModels.length} findings
                </span>
                {categoryFilter !== 'ALL' && (
                  <button
                    onClick={() => setCategoryFilter('ALL')}
                    className="text-xs text-brand hover:underline flex items-center gap-1 ml-1"
                  >
                    Clear filter <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-ink-muted">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-sand/60 border border-sand-dark/40 rounded-md px-2 py-1 text-xs text-ink-dark font-medium focus:outline-none"
                >
                  <option value="severity">Severity (Critical first)</option>
                  <option value="position">Position in text</option>
                </select>
              </div>
            </div>

            {/* Findings Stack */}
            {displayedFindings.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-sand-dark/40 bg-surface">
                <CheckCircle2 className="w-8 h-8 text-evidence-supported mx-auto mb-2" />
                <h3 className="font-semibold text-ink-dark text-sm">No findings in this view</h3>
                <p className="text-xs text-ink-muted mt-1">
                  Try clearing the category filter to view all policy checks.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedFindings.map((finding) => (
                  <FindingCard
                    key={finding.id}
                    finding={finding}
                    isActive={activeFindingId === finding.id}
                    onFocus={() => {
                      setActiveFindingId(finding.id);
                      scrollToExcerpt(finding.flaggedExcerpt, finding.id);
                    }}
                    onAccept={() => handleAccept(finding.id)}
                    onDismiss={() => handleDismiss(finding.id)}
                    onReopen={() => handleReopen(finding.id)}
                    onOverride={() => {
                      setOverrideModalFinding(finding);
                      setOverrideReasonInput(finding.overrideReason || '');
                    }}
                    onStartEdit={() => {
                      setEditingFindingId(finding.id);
                      setEditingText(finding.suggestedRewrite?.replacement || finding.flaggedExcerpt);
                    }}
                    isEditing={editingFindingId === finding.id}
                    editingText={editingText}
                    onEditingTextChange={setEditingText}
                    onSaveEdit={() => handleSaveEditedRewrite(finding.id)}
                    onCancelEdit={() => setEditingFindingId(null)}
                    onToggleOccurrence={(occId, accept) => handleToggleOccurrence(finding.id, occId, accept)}
                    onFixAllOccurrences={() => handleFixAllOccurrences(finding.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CLAIMS TABLE */}
      {activeTab === 'claims' && (
        <Card className="border-sand-dark/40 bg-surface shadow-xs overflow-hidden">
          <CardHeader className="py-4 px-6 border-b border-sand-dark/30">
            <CardTitle className="text-base font-bold text-ink-dark">
              Extracted Claims ({claims.length})
            </CardTitle>
            <p className="text-xs text-ink-muted">
              Every factual assertion, superlative, and product metric parsed from the submission.
            </p>
          </CardHeader>
          <Table>
            <Thead>
              <Tr>
                <Th className="w-12">#</Th>
                <Th>Claim Text</Th>
                <Th>Claim Type</Th>
                <Th>Verification Status</Th>
                <Th>Confidence</Th>
              </Tr>
            </Thead>
            <Tbody>
              {claims.length === 0 ? (
                <Tr>
                  <Td colSpan={5} className="text-center py-8 text-ink-muted text-xs">
                    No claims extracted yet.
                  </Td>
                </Tr>
              ) : (
                claims.map((claim, idx) => (
                  <Tr key={claim.id || idx}>
                    <Td className="font-mono text-xs text-ink-muted">{idx + 1}</Td>
                    <Td className="font-medium text-ink-dark max-w-md">
                      "{claim.claim_text}"
                    </Td>
                    <Td>
                      <Badge variant="outline" className="text-[11px] font-mono capitalize">
                        {claim.claim_type ? claim.claim_type.toLowerCase().replace('_', ' ') : 'General'}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge
                        variant={
                          claim.verification_status === 'CONTRADICTED' ? 'danger' :
                          claim.verification_status === 'SUPPORTED' ? 'success' :
                          claim.verification_status === 'UNVERIFIED' ? 'warning' : 'neutral'
                        }
                        className="text-[11px] font-semibold uppercase"
                      >
                        {claim.verification_status || 'PENDING'}
                      </Badge>
                    </Td>
                    <Td className="font-mono text-xs text-ink-muted">
                      {claim.confidence ? `${Math.round(Number(claim.confidence) * 100)}%` : '—'}
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* TAB 3: CONTENT DIFF */}
      {activeTab === 'diff' && (
        <Card className="border-sand-dark/40 bg-surface shadow-xs">
          <CardHeader className="py-4 px-6 border-b border-sand-dark/30">
            <CardTitle className="text-base font-bold text-ink-dark">Original vs Revised Comparison</CardTitle>
            <p className="text-xs text-ink-muted">
              Side-by-side view comparing original submitted copy with accepted revisions.
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-ink-muted">
                  <span>ORIGINAL SUBMISSION</span>
                  <span className="font-mono">{submission.current_content.length} chars</span>
                </div>
                <div className="p-4 rounded-xl border border-sand-dark/40 bg-cream/40 font-serif text-sm leading-relaxed text-ink-dark whitespace-pre-wrap min-h-[200px]">
                  {submission.current_content}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-evidence-supported">
                  <span>REVISED DRAFT (WITH ACCEPTED EDITS)</span>
                  <span className="font-mono">{revisedContent.length} chars</span>
                </div>
                <div className="p-4 rounded-xl border border-evidence-supported/40 bg-evidence-supported/5 font-serif text-sm leading-relaxed text-ink-dark whitespace-pre-wrap min-h-[200px]">
                  {revisedContent}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: AUDIT HISTORY & DECISIONS */}
      {activeTab === 'activity' && (
        <Card className="border-sand-dark/40 bg-surface shadow-xs">
          <CardHeader className="py-4 px-6 border-b border-sand-dark/30">
            <CardTitle className="text-base font-bold text-ink-dark">Audit Trail & Decisions</CardTitle>
            <p className="text-xs text-ink-muted">
              Immutable log of reviewer actions, system analyses, and governance decisions.
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {decisions.length === 0 ? (
              <div className="text-center py-8 text-xs text-ink-muted">
                No formal review decisions recorded yet.
              </div>
            ) : (
              <div className="relative border-l-2 border-sand-dark/40 ml-4 space-y-6 pl-6">
                {decisions.map((dec) => (
                  <div key={dec.id} className="relative">
                    <span className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-surface ${
                      dec.decision === 'APPROVED' ? 'bg-evidence-supported' :
                      dec.decision === 'REJECTED' ? 'bg-evidence-contradicted' : 'bg-evidence-unverified'
                    }`} />
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-ink-dark">
                        {dec.decision.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-ink-muted">by Reviewer</span>
                      <span suppressHydrationWarning className="text-xs text-ink-muted">• {formatDateTime(dec.created_at)}</span>
                    </div>
                    {dec.comment && (
                      <p className="text-xs text-ink-secondary bg-sand/30 p-3 rounded-lg border border-sand-dark/30 mt-2">
                        "{dec.comment}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 4.5 Sticky Decision Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-sand-dark/40 px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${criticalFindings.length === 0 ? 'bg-evidence-supported' : 'bg-evidence-contradicted animate-pulse'}`} />
            <div>
              <div className="text-xs font-bold text-ink-dark flex items-center gap-2">
                <span>{criticalFindings.length} critical finding{criticalFindings.length === 1 ? '' : 's'} open</span>
                <span className="text-sand-dark">•</span>
                <span className="text-evidence-supported">{resolvedFindings.length} resolved</span>
              </div>
              <p className="text-[11px] text-ink-muted">
                {canApprove
                  ? 'All critical issues addressed. Ready to sign off.'
                  : 'Resolve or override open critical findings to unlock approval.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDecisionModalOpen('CHANGES_REQUESTED')}
              className="text-xs text-ink-secondary hover:text-ink-dark border-sand-dark/50"
            >
              Request changes
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setDecisionModalOpen('REJECTED')}
              className="text-xs text-evidence-contradicted hover:bg-evidence-contradicted/10 border-evidence-contradicted/30"
            >
              Reject
            </Button>

            <div className="relative group">
              <Button
                variant={canApprove ? 'default' : 'outline'}
                size="sm"
                disabled={!canApprove}
                onClick={() => setDecisionModalOpen('APPROVED')}
                className={`gap-1.5 text-xs font-semibold px-4 ${
                  canApprove
                    ? 'bg-evidence-supported hover:bg-evidence-supported/90 text-white shadow-xs'
                    : 'opacity-50 cursor-not-allowed bg-sand/50 text-ink-muted border-sand-dark/40'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Approve & Issue Passport
              </Button>
              {!canApprove && (
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-56 p-2 rounded-lg bg-ink-dark text-white text-[11px] leading-tight shadow-lg z-50">
                  {criticalFindings.length} critical finding{criticalFindings.length > 1 ? 's' : ''} must be resolved or overridden before approval.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Override Dialog */}
      {overrideModalFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-dark/40 backdrop-blur-xs p-4">
          <div className="bg-surface border border-sand-dark/50 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-base text-ink-dark flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-accent-terracotta" />
                  Override Policy Finding
                </h3>
                <p className="text-xs text-ink-muted mt-1">
                  Document why this finding is being manually accepted against brand guidelines.
                </p>
              </div>
              <button onClick={() => setOverrideModalFinding(null)} className="text-ink-muted hover:text-ink-dark">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-sand/40 rounded-xl text-xs space-y-1">
              <div className="font-semibold text-ink-dark">{overrideModalFinding.title}</div>
              <div className="text-ink-secondary">Policy: {overrideModalFinding.rule.code} ({overrideModalFinding.rule.title})</div>
              <div className="font-serif italic text-ink-muted">"{overrideModalFinding.flaggedExcerpt}"</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-dark">
                Override Rationale <span className="text-evidence-contradicted">*</span>
              </label>
              <textarea
                value={overrideReasonInput}
                onChange={(e) => setOverrideReasonInput(e.target.value)}
                placeholder="e.g. Legal exception granted per executive memo dated 14 Nov; or verified under pilot exception..."
                rows={4}
                className="w-full text-xs p-3 rounded-xl border border-sand-dark/60 bg-cream/30 focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
              <p className="text-[11px] text-ink-muted">
                This rationale will be sealed into the permanent verification passport audit trail.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setOverrideModalFinding(null)}>
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                disabled={!overrideReasonInput.trim()}
                onClick={handleSaveOverride}
                className="bg-accent-terracotta hover:bg-accent-terracotta/90 text-white"
              >
                Confirm Override
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Decision Confirmation Modal */}
      {decisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-dark/40 backdrop-blur-xs p-4">
          <div className="bg-surface border border-sand-dark/50 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-base text-ink-dark flex items-center gap-2">
                  {decisionModalOpen === 'APPROVED' && <ShieldCheck className="w-5 h-5 text-evidence-supported" />}
                  {decisionModalOpen === 'REJECTED' && <XCircle className="w-5 h-5 text-evidence-contradicted" />}
                  {decisionModalOpen === 'CHANGES_REQUESTED' && <AlertTriangle className="w-5 h-5 text-evidence-unverified" />}
                  Confirm Decision: {decisionModalOpen.replace('_', ' ')}
                </h3>
                <p className="text-xs text-ink-muted mt-1">
                  {decisionModalOpen === 'APPROVED'
                    ? 'This will sign off the submission and issue an official BrandVault Evidence Passport.'
                    : 'Provide guidance for the creator on the decision.'}
                </p>
              </div>
              <button onClick={() => setDecisionModalOpen(null)} className="text-ink-muted hover:text-ink-dark">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-dark">
                Reviewer Notes {decisionModalOpen !== 'APPROVED' && <span className="text-evidence-contradicted">*</span>}
              </label>
              <textarea
                value={decisionComment}
                onChange={(e) => setDecisionComment(e.target.value)}
                placeholder="Optional sign-off note or required changes for the author..."
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-sand-dark/60 bg-cream/30 focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDecisionModalOpen(null)}>
                Cancel
              </Button>
              <Button
                variant={decisionModalOpen === 'APPROVED' ? 'default' : 'outline'}
                size="sm"
                disabled={reviewSubmitting || (decisionModalOpen !== 'APPROVED' && !decisionComment.trim())}
                onClick={() => executeReviewDecision(decisionModalOpen)}
                className={decisionModalOpen === 'APPROVED' ? 'bg-evidence-supported text-white' : ''}
              >
                {reviewSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Record Decision'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stamp Animation Overlay */}
      {stampAnimation && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink-dark/40 backdrop-blur-xs pointer-events-none">
          <div className="transform -rotate-6 scale-125 transition-transform duration-500 animate-in zoom-in-75">
            <div className={`px-8 py-4 border-4 rounded-2xl font-serif text-3xl font-extrabold tracking-widest uppercase shadow-2xl flex items-center gap-3 ${
              stampAnimation === 'APPROVED'
                ? 'border-evidence-supported text-evidence-supported bg-surface/95'
                : stampAnimation === 'REJECTED'
                ? 'border-evidence-contradicted text-evidence-contradicted bg-surface/95'
                : 'border-evidence-unverified text-evidence-unverified bg-surface/95'
            }`}>
              <ShieldCheck className="w-8 h-8 stroke-[2.5]" />
              {stampAnimation.replace('_', ' ')}
            </div>
          </div>
          {stampAnimation === 'APPROVED' && (
            <div className="mt-6 px-4 py-2 bg-surface/95 rounded-full border border-sand-dark/50 text-xs font-semibold text-ink-dark shadow-xl animate-pulse flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand" />
              <span>Redirecting to Brand Evidence Passport...</span>
            </div>
          )}
        </div>
      )}

      {/* Keyboard Shortcuts Dialog */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-dark/40 backdrop-blur-xs p-4">
          <div className="bg-surface border border-sand-dark/50 rounded-2xl max-w-sm w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-ink-dark">Keyboard Shortcuts</h4>
              <button onClick={() => setShowShortcuts(false)} className="text-ink-muted hover:text-ink-dark">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-sand-dark/20">
                <span className="text-ink-secondary">Next finding</span>
                <kbd className="px-2 py-0.5 rounded bg-sand font-mono font-semibold">J</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-sand-dark/20">
                <span className="text-ink-secondary">Previous finding</span>
                <kbd className="px-2 py-0.5 rounded bg-sand font-mono font-semibold">K</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-sand-dark/20">
                <span className="text-ink-secondary">Accept correction</span>
                <kbd className="px-2 py-0.5 rounded bg-sand font-mono font-semibold">A</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-sand-dark/20">
                <span className="text-ink-secondary">Dismiss finding</span>
                <kbd className="px-2 py-0.5 rounded bg-sand font-mono font-semibold">D</kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-ink-secondary">Toggle shortcuts</span>
                <kbd className="px-2 py-0.5 rounded bg-sand font-mono font-semibold">?</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SUB-COMPONENT: Render Highlighted Copy with Click-to-Jump
// ---------------------------------------------------------------------------
function RenderHighlightedCopy({
  text,
  findings,
  activeFindingId,
  onHighlightClick,
}: {
  text: string;
  findings: FindingViewModel[];
  activeFindingId: string | null;
  onHighlightClick: (findingId: string) => void;
}) {
  interface Range {
    start: number;
    end: number;
    finding: FindingViewModel;
    excerpt: string;
  }

  const ranges: Range[] = [];

  findings.forEach((finding) => {
    // Collect all search phrases for this finding
    const excerptsToFind: string[] = [];
    if (finding.occurrences && finding.occurrences.length > 0) {
      finding.occurrences.forEach((occ) => {
        if (occ.excerpt) excerptsToFind.push(occ.excerpt);
      });
    }
    if (finding.flaggedExcerpt && !excerptsToFind.includes(finding.flaggedExcerpt)) {
      excerptsToFind.push(finding.flaggedExcerpt);
    }

    excerptsToFind.forEach((rawExcerpt) => {
      const clean = rawExcerpt.replace(/^[“”"']|[“”"']$/g, '').trim();
      if (!clean || clean.length < 2) return;

      try {
        const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'gi');
        let match: RegExpExecArray | null;
        while ((match = regex.exec(text)) !== null) {
          ranges.push({
            start: match.index,
            end: match.index + match[0].length,
            finding,
            excerpt: match[0],
          });
        }
      } catch {
        // fallback to indexOf
        let idx = 0;
        while (idx < text.length) {
          const found = text.toLowerCase().indexOf(clean.toLowerCase(), idx);
          if (found === -1) break;
          ranges.push({
            start: found,
            end: found + clean.length,
            finding,
            excerpt: text.substring(found, found + clean.length),
          });
          idx = found + clean.length;
        }
      }
    });
  });

  // Sort ranges: earlier start first; for same start, prefer shorter/more targeted phrases
  ranges.sort((a, b) => a.start - b.start || (a.end - a.start) - (b.end - b.start));

  // Filter overlapping ranges (keep tighter/first matches)
  const nonOverlapping: Range[] = [];
  let lastEnd = 0;
  for (const r of ranges) {
    if (r.start >= lastEnd) {
      nonOverlapping.push(r);
      lastEnd = r.end;
    }
  }

  // Build highlighted output
  const segments: React.ReactNode[] = [];
  let cursor = 0;

  nonOverlapping.forEach((r, idx) => {
    if (r.start > cursor) {
      segments.push(text.substring(cursor, r.start));
    }

    const isCurrent = activeFindingId === r.finding.id;
    const cat = r.finding.category;
    const isResolved = r.finding.state !== 'OPEN';

    // Tailored palette tokens: warm, calm, zero fluorescent neon
    const colorTheme =
      isResolved
        ? {
            wrapper: 'bg-supported-soft/60 text-ink border-b-2 border-supported/70',
            badge: 'bg-supported text-white',
            label: 'Resolved',
          }
        : cat === 'contradicted'
        ? {
            wrapper: 'bg-contradicted-soft text-contradicted border-b-2 border-contradicted',
            badge: 'bg-contradicted text-white',
            label: 'Contradicted',
          }
        : cat === 'unverified'
        ? {
            wrapper: 'bg-unverified-soft text-unverified border-b-2 border-unverified',
            badge: 'bg-unverified text-white',
            label: 'Unverified',
          }
        : cat === 'tone'
        ? {
            wrapper: 'bg-[#FBEAE3] text-terracotta border-b-2 border-terracotta',
            badge: 'bg-terracotta text-white',
            label: 'Tone',
          }
        : {
            wrapper: 'bg-brand-soft text-brand border-b-2 border-brand',
            badge: 'bg-brand text-white',
            label: 'Terminology',
          };

    segments.push(
      <span
        key={`highlight-${r.finding.id}-${idx}`}
        id={`highlight-${r.finding.id}`}
        role="button"
        tabIndex={0}
        onClick={() => onHighlightClick(r.finding.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onHighlightClick(r.finding.id);
          }
        }}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer transition-all duration-150 select-text ${
          colorTheme.wrapper
        } ${
          isCurrent
            ? 'ring-2 ring-brand ring-offset-2 scale-[1.02] shadow-xs'
            : 'hover:brightness-95 hover:shadow-2xs'
        }`}
        title={`Finding #${r.finding.number}: ${r.finding.title} (${colorTheme.label})`}
      >
        <span
          className={`text-[10px] font-sans font-bold px-1.5 py-0.2 rounded-full leading-tight shrink-0 shadow-2xs select-none ${
            colorTheme.badge
          }`}
        >
          {r.finding.number}
        </span>
        <span className="font-medium">{text.substring(r.start, r.end)}</span>
        {isResolved && (
          <Check className="w-3 h-3 text-supported shrink-0 inline-block stroke-[2.5]" />
        )}
      </span>
    );

    cursor = r.end;
  });

  if (cursor < text.length) {
    segments.push(text.substring(cursor));
  }

  return <span className="leading-relaxed whitespace-pre-wrap">{segments}</span>;
}

// ---------------------------------------------------------------------------
// SUB-COMPONENT: Individual Finding Card
// ---------------------------------------------------------------------------
function FindingCard({
  finding,
  isActive,
  onFocus,
  onAccept,
  onDismiss,
  onReopen,
  onOverride,
  onStartEdit,
  isEditing,
  editingText,
  onEditingTextChange,
  onSaveEdit,
  onCancelEdit,
  onToggleOccurrence,
  onFixAllOccurrences,
}: {
  finding: FindingViewModel;
  isActive: boolean;
  onFocus: () => void;
  onAccept: () => void;
  onDismiss: () => void;
  onReopen: () => void;
  onOverride: () => void;
  onStartEdit: () => void;
  isEditing: boolean;
  editingText: string;
  onEditingTextChange: (t: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onToggleOccurrence: (occId: string, accept: boolean) => void;
  onFixAllOccurrences: () => void;
}) {
  const isResolved = finding.state !== 'OPEN';

  // Category styling
  const catStyles = {
    contradicted: { badge: 'bg-evidence-contradicted/15 text-evidence-contradicted border-evidence-contradicted/30', border: 'border-l-evidence-contradicted' },
    unverified: { badge: 'bg-evidence-unverified/15 text-evidence-unverified border-evidence-unverified/30', border: 'border-l-evidence-unverified' },
    terminology: { badge: 'bg-sand text-ink-dark border-sand-dark/40', border: 'border-l-ink-muted' },
    tone: { badge: 'bg-accent-terracotta/15 text-accent-terracotta border-accent-terracotta/30', border: 'border-l-accent-terracotta' },
    outdated: { badge: 'bg-evidence-outdated/15 text-evidence-outdated border-evidence-outdated/30', border: 'border-l-evidence-outdated' },
  }[finding.category];

  return (
    <div
      id={`finding-card-${finding.id}`}
      onClick={onFocus}
      className={`rounded-2xl border transition-all duration-200 bg-surface shadow-xs overflow-hidden ${
        isActive ? 'ring-2 ring-brand border-brand/50' : 'border-sand-dark/40 hover:border-sand-dark/70'
      } ${isResolved ? 'opacity-70 bg-sand/20' : ''}`}
    >
      {/* Header Bar */}
      <div className={`p-4 border-b border-sand-dark/30 flex flex-wrap items-center justify-between gap-3 border-l-4 ${catStyles.border}`}>
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="w-5 h-5 rounded-full bg-sand text-ink-dark font-mono text-xs font-bold flex items-center justify-center">
            {finding.number}
          </span>
          <Badge variant="outline" className={`text-[11px] font-semibold uppercase ${catStyles.badge}`}>
            {finding.categoryLabel}
          </Badge>
          <Badge
            variant={
              finding.severity === 'CRITICAL' ? 'danger' :
              finding.severity === 'HIGH' ? 'danger' :
              finding.severity === 'MEDIUM' ? 'warning' : 'neutral'
            }
            className="text-[10px] font-bold tracking-wider"
          >
            {finding.severity}
          </Badge>
          <span className="text-xs text-ink-muted font-mono">
            {finding.rule.code}
          </span>
        </div>

        {/* State Pill */}
        <div className="flex items-center gap-2">
          {finding.state === 'ACCEPTED' && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-evidence-supported bg-evidence-supported/10 px-2 py-0.5 rounded-full">
              <Check className="w-3 h-3" /> Accepted
            </span>
          )}
          {finding.state === 'DISMISSED' && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-muted bg-sand px-2 py-0.5 rounded-full">
              Dismissed
            </span>
          )}
          {finding.state === 'OVERRIDDEN' && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-terracotta bg-accent-terracotta/10 px-2 py-0.5 rounded-full" title={finding.overrideReason}>
              Overridden
            </span>
          )}
          {finding.state === 'OPEN' && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-muted bg-sand/60 px-2 py-0.5 rounded-full">
              Open
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Title & Human Sentence Reason */}
        <div>
          <h4 className="font-bold text-base text-ink-dark leading-snug">
            {finding.title}
          </h4>
          <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
            {finding.reason}
          </p>
        </div>

        {/* Flagged Quote Chip */}
        <div className="p-3 bg-sand/40 rounded-xl border border-sand-dark/30 text-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-ink-muted mb-1">
            Flagged Excerpt
          </div>
          <div className="font-serif italic text-ink-dark text-sm">
            "{finding.flaggedExcerpt}"
          </div>
        </div>

        {/* Grouped Terminology Occurrences (if any) */}
        {finding.occurrences && finding.occurrences.length > 1 && (
          <div className="p-3.5 bg-cream/40 rounded-xl border border-sand-dark/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-ink-dark">
                Found {finding.occurrences.length} occurrences in text:
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onFixAllOccurrences}
                className="text-[11px] h-7 px-2.5 gap-1 text-brand border-brand/30 hover:bg-brand/10"
              >
                <Sparkles className="w-3 h-3" />
                Fix all
              </Button>
            </div>
            <div className="space-y-1.5 pt-1">
              {finding.occurrences.map((occ) => (
                <div key={occ.id} className="flex items-center justify-between p-2 rounded-lg bg-surface border border-sand-dark/30 text-xs">
                  <span className="font-serif italic text-ink-dark">"{occ.excerpt}"</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-ink-muted">→ {occ.suggestedCorrection}</span>
                    <button
                      onClick={() => onToggleOccurrence(occ.id, !occ.accepted)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                        occ.accepted
                          ? 'bg-evidence-supported text-white'
                          : 'bg-sand hover:bg-sand-dark/50 text-ink-dark'
                      }`}
                    >
                      {occ.accepted ? 'Fixed ✓' : 'Fix'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evidence Block */}
        {finding.evidence && finding.evidence.length > 0 && (
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
              Source Evidence
            </div>
            {finding.evidence.map((ev, evIdx) => (
              <div key={evIdx} className="p-3 bg-surface border border-sand-dark/40 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 font-semibold text-ink-dark">
                    <BookOpen className="w-3.5 h-3.5 text-brand" />
                    <span>{ev.documentName}</span>
                    <span className="text-sand-dark">•</span>
                    <span className="text-ink-muted font-normal">{ev.versionSection}</span>
                  </div>
                  <Badge
                    variant={
                      ev.relation === 'Contradicts' ? 'danger' :
                      ev.relation === 'Supports' ? 'success' : 'warning'
                    }
                    className="text-[10px] font-semibold"
                  >
                    {ev.relation}
                  </Badge>
                </div>
                <div className="font-serif italic text-xs text-ink-secondary bg-sand/20 p-2 rounded border border-sand-dark/20">
                  "{ev.snippet}"
                </div>
                {ev.factCode && (
                  <div className="text-[10px] text-ink-muted flex items-center justify-between pt-0.5">
                    <span>Approved Fact: <strong className="font-mono text-ink-dark">{ev.factCode}</strong> ({ev.factTitle})</span>
                    <span>Valid: {ev.validity}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Suggested Rewrite with Diff */}
        {finding.suggestedRewrite && (
          <div className="p-3.5 bg-brand/5 border border-brand/20 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-brand uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Suggested Correction
              </span>
              {!isEditing && (
                <button
                  onClick={onStartEdit}
                  className="text-xs text-brand hover:underline inline-flex items-center gap-1 font-medium"
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  value={editingText}
                  onChange={(e) => onEditingTextChange(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-brand/40 bg-surface text-ink-dark focus:outline-none focus:ring-1 focus:ring-brand"
                />
                <div className="flex items-center gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={onCancelEdit} className="h-7 text-xs">
                    Cancel
                  </Button>
                  <Button variant="default" size="sm" onClick={onSaveEdit} className="h-7 text-xs bg-brand text-white">
                    Save edit
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs flex-wrap font-serif">
                <span className="line-through text-evidence-contradicted bg-evidence-contradicted/10 px-1.5 py-0.5 rounded">
                  {finding.suggestedRewrite.original}
                </span>
                <ArrowRight className="w-3 h-3 text-ink-muted" />
                <span className="text-evidence-supported bg-evidence-supported/10 px-1.5 py-0.5 rounded font-medium">
                  {finding.suggestedRewrite.replacement}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Override Note Display */}
        {finding.state === 'OVERRIDDEN' && finding.overrideReason && (
          <div className="p-3 bg-accent-terracotta/10 border border-accent-terracotta/30 rounded-xl text-xs space-y-1">
            <span className="font-bold text-accent-terracotta text-[10px] uppercase tracking-wider">
              Reviewer Override Rationale
            </span>
            <p className="text-ink-dark italic">"{finding.overrideReason}"</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-sand-dark/25">
          <div className="flex items-center gap-2">
            {finding.state === 'OPEN' ? (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={onAccept}
                  className="gap-1.5 text-xs bg-brand hover:bg-brand/90 text-white font-medium shadow-xs"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  Accept suggestion
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDismiss}
                  className="text-xs text-ink-muted hover:text-ink-dark border-sand-dark/40 hover:bg-sand/40"
                >
                  Dismiss
                </Button>
              </>
            ) : finding.state === 'ACCEPTED' ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-supported inline-flex items-center gap-1 bg-supported-soft px-2.5 py-1 rounded-md">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  Correction accepted
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReopen}
                  className="gap-1 text-xs text-ink-muted hover:text-ink-dark border-sand-dark/40 hover:bg-sand/40"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  Undo accept
                </Button>
              </div>
            ) : finding.state === 'DISMISSED' ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-muted italic bg-sand/60 px-2 py-1 rounded-md">
                  Dismissed
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReopen}
                  className="gap-1 text-xs text-ink-muted hover:text-ink-dark border-sand-dark/40 hover:bg-sand/40"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  Reopen finding
                </Button>
              </div>
            ) : (
              // OVERRIDDEN
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-accent-terracotta inline-flex items-center gap-1 bg-accent-terracotta/15 px-2.5 py-1 rounded-md">
                  Overridden by reviewer
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReopen}
                  className="gap-1 text-xs text-ink-muted hover:text-ink-dark border-sand-dark/40 hover:bg-sand/40"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  Clear override
                </Button>
              </div>
            )}
          </div>

          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={onOverride}
              className="text-xs text-ink-secondary hover:text-accent-terracotta border-sand-dark/40 hover:bg-sand/40"
            >
              {finding.state === 'OVERRIDDEN' ? 'Edit override note' : 'Override with note'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
