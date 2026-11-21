'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, AlertCircle, Eye, ArrowUpRight, Check, BookOpen, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StoredJob } from '@/lib/ai/consistency-store';
import { ConsistencyComparisonFinding } from '@/lib/ai/multilingual-consistency';

interface ProofViewDrawerProps {
  job: StoredJob | null;
  isOpen: boolean;
  onClose: () => void;
  onDecision?: (findingId: string, decision: 'CONFIRMED' | 'FALSE_POSITIVE' | 'NEEDS_CONTEXT' | 'RESOLVED') => void;
}

export function ProofViewDrawer({
  job,
  isOpen,
  onClose,
  onDecision,
}: ProofViewDrawerProps) {
  const [activeFindingId, setActiveFindingId] = useState<string | null>(null);
  const isReduced = useReducedMotion();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation & Focus management
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !job) return null;

  const isHindi = job.language === 'hi';
  const isBengali = job.language === 'bn';
  const indicClass = isHindi ? 'font-indic-hi' : isBengali ? 'font-indic-bn' : '';

  // Determine overall verdict
  const verdict = job.verdict || (job.findings.some(f => f.severity === 'CRITICAL' || f.type === 'NUMERIC_MISMATCH') ? 'CONFLICT' : job.findings.length > 0 ? 'NEEDS_REVIEW' : 'CONSISTENT');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end" role="dialog" aria-modal="true" aria-labelledby="proof-view-title">
      {/* Dimmed Scrim */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 bg-[#16203A]/30 backdrop-blur-xs"
      />

      {/* Slide-in Proof View Drawer */}
      <motion.div
        ref={drawerRef}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-4xl bg-sheet h-full border-l border-line shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-paper/60 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-surface border border-line text-ink-2">
              {job.id}
            </span>
            <span className="text-xs text-ink-3">
              Checked {new Date(job.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
            {job.is_sample && (
              <span className="text-[11px] text-ink-3 italic">
                Sample
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-sand/60 transition-colors focus-ring"
              aria-label="Close proof view"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Rubber Stamp Header Area */}
        <div className="p-6 border-b border-line bg-sheet flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
          <div>
            <h2 id="proof-view-title" className="font-serif text-2xl font-bold text-ink tracking-tight">
              Evidence Proof Record
            </h2>
            <p className="text-xs text-ink-2 mt-1">
              Cross-lingual assertion verification against approved specifications.
            </p>
          </div>

          {/* Authentic Ink Rubber Stamp */}
          <motion.div
            initial={isReduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.35, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: verdict === 'CONFLICT' ? -5 : verdict === 'CONSISTENT' ? -4 : -3 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="select-none"
          >
            {verdict === 'CONFLICT' ? (
              <div
                className="border-[2.5px] border-[#C2402E] rounded-[4px] p-2 text-center font-bold"
                style={{
                  color: '#C2402E',
                  backgroundColor: 'rgba(194, 64, 46, 0.04)',
                  boxShadow: '0 0 0 1px rgba(194, 64, 46, 0.25) inset',
                }}
              >
                <div className="border border-[#C2402E] px-3.5 py-1">
                  <div className="text-[15px] tracking-[0.2em] font-extrabold uppercase font-sans leading-none">
                    CONFLICT
                  </div>
                  <div className="text-[9.5px] font-mono tracking-wider font-semibold mt-1 text-[#C2402E]/90">
                    {job.id} · SPEC-MISMATCH
                  </div>
                </div>
              </div>
            ) : verdict === 'CONSISTENT' ? (
              <div
                className="border-[2.5px] border-[#3F8F6B] rounded-[4px] p-2 text-center font-bold"
                style={{
                  color: '#3F8F6B',
                  backgroundColor: 'rgba(63, 143, 107, 0.04)',
                  boxShadow: '0 0 0 1px rgba(63, 143, 107, 0.25) inset',
                }}
              >
                <div className="border border-[#3F8F6B] px-3.5 py-1">
                  <div className="text-[15px] tracking-[0.2em] font-extrabold uppercase font-sans leading-none">
                    CONSISTENT
                  </div>
                  <div className="text-[9.5px] font-mono tracking-wider font-semibold mt-1 text-[#3F8F6B]/90">
                    {job.id} · SPEC-VERIFIED
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="border-[2.5px] border-[#D97706] rounded-[4px] p-2 text-center font-bold"
                style={{
                  color: '#D97706',
                  backgroundColor: 'rgba(217, 119, 6, 0.04)',
                  boxShadow: '0 0 0 1px rgba(217, 119, 6, 0.25) inset',
                }}
              >
                <div className="border border-[#D97706] px-3.5 py-1">
                  <div className="text-[15px] tracking-[0.2em] font-extrabold uppercase font-sans leading-none">
                    NEEDS REVIEW
                  </div>
                  <div className="text-[9.5px] font-mono tracking-wider font-semibold mt-1 text-[#D97706]/90">
                    {job.id} · CONTEXT-REQUIRED
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Two-Pane Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-line">
          {/* Left Pane (5/12): Submitted Text on Ruled Paper */}
          <div className="md:col-span-5 p-6 bg-sheet/40 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-semibold text-ink-3">
                Submitted Copy ({job.language.toUpperCase()})
              </span>
              <span className="text-[11px] text-ink-3 font-mono">
                {job.raw_text.length} chars
              </span>
            </div>

            <div className="p-4 rounded-xl border border-line bg-sheet ruled-paper relative overflow-hidden flex-1 shadow-2xs">
              <p
                lang={job.language}
                className={`text-[15px] text-ink select-text leading-[32px] ${indicClass}`}
              >
                {/* Highlight checked segments if matching findings */}
                {job.findings.length > 0 ? (
                  <span>
                    {job.findings.map((finding) => {
                      const isHighlighted = activeFindingId === finding.id;
                      const isConflict = finding.severity === 'CRITICAL' || finding.type === 'NUMERIC_MISMATCH';

                      return (
                        <span
                          key={finding.id}
                          onMouseEnter={() => setActiveFindingId(finding.id)}
                          onMouseLeave={() => setActiveFindingId(null)}
                          className={`cursor-pointer transition-colors px-1 rounded ${
                            isConflict
                              ? isHighlighted
                                ? 'bg-[#F8E3E0] underline decoration-[#C2402E] decoration-wavy decoration-2'
                                : 'underline decoration-[#C2402E] decoration-wavy decoration-1 hover:bg-[#F8E3E0]/70'
                              : isHighlighted
                              ? 'bg-[#E4F0E5] underline decoration-[#3F8F6B] decoration-2'
                              : 'underline decoration-[#3F8F6B] decoration-1 hover:bg-[#E4F0E5]/70'
                          }`}
                          title={`Click to inspect finding: ${finding.title}`}
                        >
                          {finding.localizedClaim || job.raw_text}
                        </span>
                      );
                    })}
                  </span>
                ) : (
                  <span className="underline decoration-[#3F8F6B] decoration-solid decoration-1">
                    {job.raw_text}
                  </span>
                )}
              </p>
            </div>

            {/* Micro Legend */}
            <div className="p-3 rounded-lg border border-line bg-paper text-[11px] text-ink-2 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-[#C2402E] border-b-2 border-dashed border-[#C2402E]" />
                <span>Wavy red underline: factual contradiction</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-[#3F8F6B]" />
                <span>Solid green underline: consistent claim</span>
              </div>
            </div>
          </div>

          {/* Right Pane (7/12): Findings List */}
          <div className="md:col-span-7 p-6 space-y-4 bg-sheet overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-semibold text-ink-3">
                Assertion Audit Findings ({job.findings.length})
              </span>
              <span className="text-xs text-ink-3">
                Fact Set: <code className="font-mono text-ink text-[11px]">{job.fact_set_id}</code>
              </span>
            </div>

            {job.findings.length === 0 ? (
              <div className="p-8 text-center border border-line rounded-xl bg-paper/60 my-6">
                <CheckCircle className="w-8 h-8 text-[#3F8F6B] mx-auto mb-2" />
                <h4 className="font-serif text-lg font-semibold text-ink">Zero Conflicts Detected</h4>
                <p className="text-xs text-ink-2 max-w-sm mx-auto mt-1 leading-relaxed">
                  Every quantitative claim and technical entity aligns with approved specifications in this fact set.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {job.findings.map((f, idx) => {
                  const isActive = activeFindingId === f.id;
                  const isCritical = f.severity === 'CRITICAL' || f.type === 'NUMERIC_MISMATCH';

                  return (
                    <div
                      key={f.id || idx}
                      onMouseEnter={() => setActiveFindingId(f.id)}
                      onMouseLeave={() => setActiveFindingId(null)}
                      className={`proof-card transition-all duration-150 relative ${
                        isActive ? 'ring-2 ring-indigo border-indigo/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          {isCritical ? (
                            <span className="w-2 h-2 rounded-full bg-proof-red shrink-0" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-[#D97706] shrink-0" />
                          )}
                          <h4 className="text-sm font-semibold text-ink">
                            {f.title}
                          </h4>
                        </div>
                        <span className="font-mono text-[11px] text-ink-3 shrink-0">
                          {Math.round((f.confidence || 0.95) * 100)}% match
                        </span>
                      </div>

                      {/* Evidence Comparison Grid */}
                      <div className="grid grid-cols-1 gap-2 text-xs my-3">
                        {/* Localized claim */}
                        <div className="p-2.5 rounded-lg bg-paper border border-line">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-ink-3 block mb-0.5">
                            Localized Claim ({job.language.toUpperCase()})
                          </span>
                          <p lang={job.language} className={`text-ink font-medium ${indicClass}`}>
                            "{f.localizedClaim || f.evidence?.localizedClaim}"
                          </p>
                          {f.backTranslation && (
                            <p className="text-ink-3 italic text-[11px] mt-1">
                              ↳ Back-translation: "{f.backTranslation}"
                            </p>
                          )}
                        </div>

                        {/* Approved Specification */}
                        <div className="p-2.5 rounded-lg bg-paper border border-line">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-ink-3 block mb-0.5">
                            Approved English Fact ({f.approvedFactId})
                          </span>
                          <p className="text-ink font-serif text-[13px] italic">
                            "{f.approvedFact || f.evidence?.approvedFactText}"
                          </p>
                          <div className="flex items-center justify-between text-[11px] text-ink-3 mt-1.5 pt-1.5 border-t border-line/50">
                            <span>Citation: {f.evidence?.sourceDocument || 'Product Spec'} · {f.evidence?.sourceLocator || '§2.1'}</span>
                            <span className="font-mono">v{f.evidence?.factSetVersion || '2026.04'}</span>
                          </div>
                        </div>

                        {/* Value comparison if numeric */}
                        {f.evidence?.values && (
                          <div className="p-2.5 rounded-lg bg-[#F8E3E0]/40 border border-[#EBC1BF] text-xs">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-proof-red block mb-1">
                              Normalized Numeric Discrepancy
                            </span>
                            <div className="flex items-center gap-3 font-mono text-[11px] text-ink">
                              <span>Localized: <strong>{f.evidence.values.localized?.canonical || `${f.evidence.values.localized?.value} ${f.evidence.values.localized?.unit}`}</strong></span>
                              <span className="text-ink-3">≠</span>
                              <span>Approved: <strong>{f.evidence.values.approved?.canonical || `${f.evidence.values.approved?.value} ${f.evidence.values.approved?.unit}`}</strong></span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Explanation */}
                      {f.evidence?.explanation && (
                        <p className="text-xs text-ink-2 leading-relaxed mb-3">
                          {f.evidence.explanation}
                        </p>
                      )}

                      {/* Resolution Actions */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDecision && onDecision(f.id, 'CONFIRMED')}
                          className="h-7 text-xs px-2.5 border-line hover:bg-paper active:scale-98"
                        >
                          <Check className="w-3 h-3 mr-1 text-[#3F8F6B]" />
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDecision && onDecision(f.id, 'FALSE_POSITIVE')}
                          className="h-7 text-xs px-2.5 border-line hover:bg-paper active:scale-98"
                        >
                          <X className="w-3 h-3 mr-1 text-ink-3" />
                          False Positive
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDecision && onDecision(f.id, 'NEEDS_CONTEXT')}
                          className="h-7 text-xs px-2.5 border-line hover:bg-paper active:scale-98"
                        >
                          <Eye className="w-3 h-3 mr-1 text-[#D97706]" />
                          Needs Context
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
