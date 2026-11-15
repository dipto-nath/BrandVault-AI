'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  X, ExternalLink, ShieldCheck, AlertTriangle, ArrowRight,
  BookOpen, Sparkles, Check, CheckCheck, FileText, CornerDownRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ScrutinyRule } from '@/lib/services/insights';

export function RuleDrawer({
  rule,
  isOpen,
  onClose,
  onApprove,
  onDismiss,
  isAdmin = true,
}: {
  rule: ScrutinyRule | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (rule: ScrutinyRule) => void;
  onDismiss: (rule: ScrutinyRule) => void;
  isAdmin?: boolean;
}) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !rule) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-ink-dark/40 backdrop-blur-xs animate-in fade-in-50 duration-150">
      <div
        ref={drawerRef}
        className="fixed inset-y-0 right-0 max-w-full flex pl-10"
      >
        <div className="w-screen max-w-xl bg-surface border-l border-sand-dark/50 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-sand-dark/40 bg-surface-subtle/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-sand text-ink-dark border border-sand-dark/50">
                  {rule.rule_code}
                </span>
                <Badge variant={rule.severity === 'HIGH' ? 'danger' : 'medium'} className="text-[10px] uppercase font-bold">
                  {rule.severity}
                </Badge>
                <Badge variant="outline" className="text-[10px] capitalize font-medium">
                  {rule.category.toLowerCase()}
                </Badge>
                <span className="text-xs text-ink-muted">v{rule.version}</span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-ink-muted hover:text-ink-dark hover:bg-sand/60 transition-colors"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h2 className="text-xl font-serif font-bold text-ink-dark">
                {rule.title}
              </h2>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-ink-muted">
                <Link
                  href="/guidelines"
                  className="text-brand hover:underline flex items-center gap-1 font-medium"
                >
                  Open in Brand Guidelines <ExternalLink className="w-3 h-3" />
                </Link>
                <span>•</span>
                <span>Clarity score: <strong className="text-ink-dark">{rule.clarityScore}/100</strong></span>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs text-ink-dark">
            {/* Wording Diff Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink-dark text-xs uppercase tracking-wider">
                  Wording Evolution
                </span>
                <span className="text-[10px] text-ink-muted">Version 1 → Proposed v2</span>
              </div>

              <div className="space-y-2">
                <div className="p-3.5 rounded-xl border border-sand-dark/40 bg-sand/20 space-y-1">
                  <div className="text-[10px] font-bold text-ink-muted uppercase">Current active rule (v1)</div>
                  <p className="font-serif text-ink-secondary leading-relaxed text-xs">
                    {rule.proposal.before}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-evidence-supported/30 bg-evidence-supported/5 space-y-1">
                  <div className="text-[10px] font-bold text-evidence-supported uppercase flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Proposed clarified rule (v2 proposal)
                  </div>
                  <p className="font-serif text-ink-dark leading-relaxed text-xs">
                    <span>{rule.proposal.before} </span>
                    <span className="bg-evidence-supported/20 text-evidence-supported px-1 py-0.5 rounded font-medium">
                      {rule.proposal.addedText || rule.proposal.after}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Impact Numbers */}
            <div className="p-4 rounded-xl border border-sand-dark/40 bg-surface space-y-3 shadow-xs">
              <span className="font-bold text-ink-dark text-xs uppercase tracking-wider block">
                Historical Impact & Signal
              </span>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2.5 rounded-lg bg-sand/30 border border-sand-dark/30">
                  <div className="font-mono text-lg font-bold text-ink-dark">{rule.triggerCount}</div>
                  <div className="text-[10px] text-ink-muted uppercase font-medium mt-0.5">Times Triggered</div>
                </div>
                <div className="p-2.5 rounded-lg bg-sand/30 border border-sand-dark/30">
                  <div className="font-mono text-lg font-bold text-accent-terracotta">{rule.overrideCount}</div>
                  <div className="text-[10px] text-ink-muted uppercase font-medium mt-0.5">Overrides</div>
                </div>
                <div className="p-2.5 rounded-lg bg-sand/30 border border-sand-dark/30">
                  <div className="font-mono text-lg font-bold text-ink-dark">{rule.overrideRate}%</div>
                  <div className="text-[10px] text-ink-muted uppercase font-medium mt-0.5">Override Rate</div>
                </div>
              </div>
            </div>

            {/* Why It's Unclear */}
            <div className="space-y-2">
              <span className="font-bold text-ink-dark text-xs uppercase tracking-wider block">
                Why Reviewers Overrode This Rule
              </span>
              <div className="p-3.5 bg-brand/5 border border-brand/20 rounded-xl text-ink-secondary text-xs leading-relaxed">
                <p className="font-medium text-brand mb-1">Pattern Analysis:</p>
                <p>{rule.observation}</p>
              </div>

              {rule.exampleOverrides.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-ink-muted">Recorded Reviewer Justifications:</span>
                  {rule.exampleOverrides.map((ex, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-sand-dark/30 bg-surface text-xs space-y-1">
                      <p className="italic font-serif text-ink-dark">"{ex.reason}"</p>
                      <div className="text-[10px] text-ink-muted flex items-center justify-between pt-0.5">
                        <span>{ex.reviewerRole}</span>
                        <span>{ex.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Related Findings */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink-dark text-xs uppercase tracking-wider">
                  Recent Triggering Submissions
                </span>
                <Link
                  href={`/reviews?rule=${rule.rule_code}`}
                  className="text-brand hover:underline text-[11px] font-medium"
                >
                  See all matches →
                </Link>
              </div>

              <div className="space-y-1.5">
                {rule.relatedFindings.length === 0 ? (
                  <p className="text-ink-muted text-xs p-3 bg-sand/20 rounded-lg">No recent findings logged for this rule.</p>
                ) : (
                  rule.relatedFindings.map((rf) => (
                    <Link
                      key={rf.id}
                      href={`/reviews/${rf.submissionId}`}
                      className="p-2.5 rounded-lg border border-sand-dark/30 hover:border-brand/40 bg-surface flex items-center justify-between gap-2 transition-all block group"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-ink-dark truncate group-hover:text-brand">
                          {rf.submissionTitle}
                        </div>
                        <div className="text-[11px] text-ink-muted truncate font-serif italic mt-0.5">
                          "{rf.excerpt}"
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                          {rf.outcome}
                        </Badge>
                        <div className="text-[9px] text-ink-muted mt-0.5">{rf.date}</div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="p-4 sm:p-5 border-t border-sand-dark/40 bg-surface-subtle/80 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs text-ink-secondary"
            >
              Close
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDismiss(rule)}
                className="text-xs text-ink-muted hover:text-ink-dark border-sand-dark/50"
              >
                Dismiss proposal
              </Button>

              <div className="relative group">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!isAdmin || rule.status === 'APPROVED'}
                  onClick={() => onApprove(rule)}
                  className={`text-xs gap-1.5 ${
                    rule.status === 'APPROVED'
                      ? 'bg-evidence-supported text-white opacity-80 cursor-default'
                      : 'bg-brand hover:bg-brand/90 text-white'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  {rule.status === 'APPROVED' ? 'Approved (v2 active)' : 'Approve change (v2)'}
                </Button>
                {!isAdmin && (
                  <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-48 p-2 rounded-lg bg-ink-dark text-white text-[10px] leading-tight z-50">
                    Only an admin can approve guideline changes.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
