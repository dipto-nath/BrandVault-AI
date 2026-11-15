'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Pencil, Check, Sparkles, AlertTriangle, ShieldCheck,
  Globe, Camera, Briefcase, Mail, Megaphone, MoreHorizontal,
  Info, RotateCw, Play, CheckCircle2, Lock, Award, FileText,
  FileCheck2, ChevronRight, X, ExternalLink, HelpCircle, Layers, BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BENCHMARK_SAMPLES, SampleBenchmark } from '@/lib/constants/samples';

interface ChannelItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
  charLimit?: number;
}

const CHANNELS: ChannelItem[] = [
  {
    name: 'Website',
    icon: Globe,
    hint: 'Long-form copy with technical specifications. Ensure model names and specs match.',
    charLimit: 15000,
  },
  {
    name: 'Instagram',
    icon: Camera,
    hint: 'Short, punchy captions. Watch for unsupported superlatives.',
    charLimit: 2200,
  },
  {
    name: 'LinkedIn',
    icon: Briefcase,
    hint: 'Professional thought leadership and corporate news. Claims should link to official releases.',
    charLimit: 3000,
  },
  {
    name: 'Email',
    icon: Mail,
    hint: 'Subject lines and body copy are both checked.',
    charLimit: 10000,
  },
  {
    name: 'Advertising',
    icon: Megaphone,
    hint: 'Objective claims need substantiation (ASCI and CCPA context).',
    charLimit: 600,
  },
  {
    name: 'Other',
    icon: MoreHorizontal,
    hint: 'General brand copy. All factual statements will be verified against approved knowledge.',
  },
];

const CONTENT_TYPES = [
  'Product description',
  'Social media post',
  'Advertisement',
  'Website copy',
  'Email campaign',
  'Press release',
  'Other',
];

const NUMBER_UNIT_REGEX = /\b(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|grams?|g|kg|years?|yrs?|%|percent|mAh|W|watts?|GB|TB|MP|fps|Hz|mm|cm|inches?|in)\b/gi;
const SUPERLATIVE_REGEX = /\b(best|fastest|world['’]s\s+(?:best|first|fastest|most)|unmatched|#1|number\s+one|incredible|completely\s+waterproof|completely|revolutionary|ultimate|flawless|miraculous)\b/gi;
const SPEC_REGEX = /\b(Bluetooth\s*\d+(?:\.\d+)?|Wi-?Fi\s*\d+|AI\s+robot(?:\s+buddy)?|quantum[- ]enhanced|ultra[- ]conductive|waterproof|recycled\s+aluminium|smart\s+assistant)\b/gi;

const DRAFT_STORAGE_KEY = 'brandvault_draft_nextech_v1';

export default function ReviewStudioPage() {
  const router = useRouter();

  // Form State
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState('Product description');
  const [channel, setChannel] = useState('Website');
  const [content, setContent] = useState('');

  // Interaction State
  const [touched, setTouched] = useState<{ title?: boolean; content?: boolean }>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [sampleConfirm, setSampleConfirm] = useState<SampleBenchmark | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);

  // Autosave State
  const [autosaveTime, setAutosaveTime] = useState<string | null>(null);
  const [restorableDraft, setRestorableDraft] = useState<{
    title: string;
    contentType: string;
    channel: string;
    content: string;
    time: string;
  } | null>(null);

  // Submission & Analysis Progression State
  const [loading, setLoading] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Side panel live data
  const [ruleStats, setRuleStats] = useState<{ facts: number; guidelines: number; date: string } | null>(null);
  const [ruleStatsLoading, setRuleStatsLoading] = useState(true);

  // Textarea & highlight mirror refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);

  // 1. Initial Load: Check for stored draft & rulebook stats
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.content?.trim() || parsed.title?.trim()) {
          setRestorableDraft({
            title: parsed.title || '',
            contentType: parsed.contentType || 'Product description',
            channel: parsed.channel || 'Website',
            content: parsed.content || '',
            time: parsed.savedAt ? new Date(parsed.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently',
          });
        }
      }
    } catch {
      // Ignore localStorage errors
    }

    // Fetch rulebook stats
    async function fetchCounts() {
      try {
        setRuleStatsLoading(true);
        const [factsRes, rulesRes] = await Promise.all([
          fetch('/api/knowledge/facts'),
          fetch('/api/guidelines'),
        ]);
        const factsJson = await factsRes.json();
        const rulesJson = await rulesRes.json();

        const factsCount = factsJson.data?.length ?? 5;
        const rulesCount = rulesJson.data?.length ?? 5;
        setRuleStats({
          facts: factsCount,
          guidelines: rulesCount,
          date: 'Nov 2026',
        });
      } catch {
        // Fallback gracefully to default seed counts
        setRuleStats({
          facts: 5,
          guidelines: 5,
          date: 'Nov 2026',
        });
      } finally {
        setRuleStatsLoading(false);
      }
    }

    fetchCounts();
  }, []);

  // 2. Autosave with debounce
  useEffect(() => {
    if (!title && !content) return;

    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({
            title,
            contentType,
            channel,
            content,
            savedAt: new Date().toISOString(),
          })
        );
        setAutosaveTime('just now');
      } catch {
        // Ignore localStorage quota errors
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [title, contentType, channel, content]);

  // Sync scroll between textarea and highlight mirror
  const handleScroll = () => {
    if (textareaRef.current && mirrorRef.current) {
      mirrorRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Keyboard shortcut: Cmd/Ctrl + Enter to submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (!loading && title.trim() && content.trim()) {
          e.preventDefault();
          executeSubmission();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // 3. Claim Radar: Heuristic matches computed live
  const radar = useMemo(() => {
    if (!content) return { numbers: [], superlatives: [], specs: [] };

    const numbers = Array.from(content.matchAll(NUMBER_UNIT_REGEX), (m) => m[0]);
    const superlatives = Array.from(content.matchAll(SUPERLATIVE_REGEX), (m) => m[0]);
    const specs = Array.from(content.matchAll(SPEC_REGEX), (m) => m[0]);

    return { numbers, superlatives, specs };
  }, [content]);

  // Highlight tokens for mirror layer
  const renderedMirrorTokens = useMemo(() => {
    if (!content) return null;

    interface MatchPos {
      start: number;
      end: number;
      type: 'number' | 'superlative' | 'spec';
      text: string;
    }

    const matches: MatchPos[] = [];

    let m: RegExpExecArray | null;
    const numRegex = new RegExp(NUMBER_UNIT_REGEX.source, 'gi');
    while ((m = numRegex.exec(content)) !== null) {
      matches.push({ start: m.index, end: m.index + m[0].length, type: 'number', text: m[0] });
    }

    const supRegex = new RegExp(SUPERLATIVE_REGEX.source, 'gi');
    while ((m = supRegex.exec(content)) !== null) {
      matches.push({ start: m.index, end: m.index + m[0].length, type: 'superlative', text: m[0] });
    }

    const specRegex = new RegExp(SPEC_REGEX.source, 'gi');
    while ((m = specRegex.exec(content)) !== null) {
      matches.push({ start: m.index, end: m.index + m[0].length, type: 'spec', text: m[0] });
    }

    // Sort by start position
    matches.sort((a, b) => a.start - b.start);

    // Filter out overlaps
    const nonOverlapping: MatchPos[] = [];
    let lastEnd = 0;
    for (const match of matches) {
      if (match.start >= lastEnd) {
        nonOverlapping.push(match);
        lastEnd = match.end;
      }
    }

    const elements: React.ReactNode[] = [];
    let currentIndex = 0;

    nonOverlapping.forEach((match, idx) => {
      // Plain text before match
      if (match.start > currentIndex) {
        elements.push(
          <span key={`plain-${idx}`} className="text-transparent">
            {content.slice(currentIndex, match.start)}
          </span>
        );
      }

      // Highlighted match token
      if (match.type === 'number') {
        elements.push(
          <mark
            key={`match-${idx}`}
            className="bg-unverified-soft/50 border-b-2 border-dashed border-unverified text-transparent rounded-xs px-0.5"
          >
            {match.text}
          </mark>
        );
      } else if (match.type === 'superlative') {
        elements.push(
          <mark
            key={`match-${idx}`}
            className="bg-contradicted-soft/50 underline decoration-wavy decoration-contradicted decoration-2 text-transparent rounded-xs px-0.5"
          >
            {match.text}
          </mark>
        );
      } else {
        elements.push(
          <mark
            key={`match-${idx}`}
            className="bg-brand-soft/60 border-b-2 border-dotted border-brand text-transparent rounded-xs px-0.5"
          >
            {match.text}
          </mark>
        );
      }

      currentIndex = match.end;
    });

    if (currentIndex < content.length) {
      elements.push(
        <span key="plain-tail" className="text-transparent">
          {content.slice(currentIndex)}
        </span>
      );
    }

    return elements;
  }, [content]);

  // Character and word counts
  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const activeChannelConfig = CHANNELS.find((c) => c.name === channel);
  const isNearLimit = activeChannelConfig?.charLimit ? charCount > activeChannelConfig.charLimit * 0.9 : false;

  // Validation: can submit if there is content and a channel selected (title auto-fallbacks)
  const titleError = (touched.title || hasAttemptedSubmit) && !title.trim();
  const contentError = (touched.content || hasAttemptedSubmit) && !content.trim();
  const canSubmit = Boolean(content.trim() && channel);

  // 4. Sample Selection with Animated Stream / Typing
  const loadSample = (sample: SampleBenchmark) => {
    // If user already wrote custom text, prompt for confirmation
    if (content.trim() && content.trim() !== sample.draft && selectedSampleId !== sample.id) {
      setSampleConfirm(sample);
      return;
    }

    applySample(sample);
  };

  const applySample = (sample: SampleBenchmark) => {
    setSampleConfirm(null);
    setSelectedSampleId(sample.id);
    setTitle(sample.title);
    setContentType(sample.contentType);
    setChannel(sample.channel);

    // Check for prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setContent(sample.draft);
      return;
    }

    // Stream text in ~600ms
    const totalChars = sample.draft.length;
    const steps = 15;
    const chunkSize = Math.max(1, Math.ceil(totalChars / steps));
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const currentLength = Math.min(totalChars, currentStep * chunkSize);
      setContent(sample.draft.slice(0, currentLength));

      if (currentLength >= totalChars) {
        clearInterval(interval);
      }
    }, 35);
  };

  const handleClearSample = () => {
    setSelectedSampleId(null);
    setTitle('');
    setContent('');
  };

  const restoreDraft = () => {
    if (restorableDraft) {
      setTitle(restorableDraft.title);
      setContentType(restorableDraft.contentType);
      setChannel(restorableDraft.channel);
      setContent(restorableDraft.content);
      setRestorableDraft(null);
    }
  };

  const dismissDraft = () => {
    setRestorableDraft(null);
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const handleClearForm = () => {
    setTitle('');
    setContent('');
    setSelectedSampleId(null);
    setClearConfirm(false);
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  // 5. Submission Handler with Multi-Stage Progress View
  const executeSubmission = async () => {
    if (!content.trim()) {
      setHasAttemptedSubmit(true);
      document.getElementById('draft-content')?.focus();
      return;
    }

    const submissionTitle = title.trim() || `${channel} Copy — ${content.slice(0, 32).trim()}…`;

    setError(null);
    setLoading(true);
    setAnalysisStep(0);

    // Honest stage progression timing while awaiting analysis response
    const stageTimer1 = setTimeout(() => setAnalysisStep(1), 600);
    const stageTimer2 = setTimeout(() => setAnalysisStep(2), 1400);
    const stageTimer3 = setTimeout(() => setAnalysisStep(3), 2200);

    try {
      // Step 1: Create submission record
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: submissionTitle,
          content_type: contentType,
          channel,
          original_content: content.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.error || 'Submission failed');
      }

      const submissionId = json.data.id;

      // Clear local storage draft upon successful submission
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // ignore
      }

      // Step 2: Trigger real analysis pipeline
      try {
        await fetch(`/api/submissions/${submissionId}/analyze`, {
          method: 'POST',
        });
      } catch {
        // Even if background analyze encounters edge condition, navigate to review page
      }

      // Smooth transition to review page
      router.push(`/reviews/${submissionId}`);
    } catch (err: any) {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      setLoading(false);
      setError(err?.message || 'Failed to submit content. Your text has been preserved.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSubmission();
  };

  // Keyboard navigation for channel radio group
  const handleChannelKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (index + 1) % CHANNELS.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (index - 1 + CHANNELS.length) % CHANNELS.length;
    }

    if (nextIndex !== -1) {
      setChannel(CHANNELS[nextIndex].name);
      const nextBtn = document.getElementById(`channel-radio-${nextIndex}`);
      nextBtn?.focus();
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. Page Header with Single Back Link & Workflow Stepper */}
      <div>
        <Link
          href="/reviews"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-3 hover:text-ink transition-colors mb-3 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Content reviews</span>
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-[36px] font-bold text-ink font-serif tracking-tight leading-tight">
              Review studio
            </h1>
            <p className="text-sm text-ink-2 mt-1.5 max-w-2xl leading-relaxed font-sans">
              Paste your draft and we&apos;ll check every claim against NexTech&apos;s approved facts. You decide what happens next.
            </p>
          </div>

          {/* Workflow Stepper */}
          <div
            className="flex items-center gap-2 bg-surface border border-line rounded-full px-4 py-2 shadow-2xs self-start lg:self-auto shrink-0"
            role="navigation"
            aria-label="Review Workflow"
          >
            <div
              className="flex items-center gap-1.5 text-xs font-bold text-brand"
              title="1 Draft: Compose or paste copy to evaluate"
            >
              <span className="w-5 h-5 rounded-full bg-brand text-white text-[11px] font-bold flex items-center justify-center">
                1
              </span>
              <span>Draft</span>
            </div>

            <ChevronRight className="w-3 h-3 text-ink-3/40" />

            <div
              className="flex items-center gap-1.5 text-xs font-medium text-ink-3/60"
              title="2 Analyse: Extract claims and verify against specifications"
            >
              <span className="w-5 h-5 rounded-full bg-surface-2 text-ink-3 text-[11px] font-medium flex items-center justify-center border border-line">
                2
              </span>
              <span>Analyse</span>
            </div>

            <ChevronRight className="w-3 h-3 text-ink-3/40" />

            <div
              className="flex items-center gap-1.5 text-xs font-medium text-ink-3/60"
              title="3 Review: Inspect evidence findings and make judgment"
            >
              <span className="w-5 h-5 rounded-full bg-surface-2 text-ink-3 text-[11px] font-medium flex items-center justify-center border border-line">
                3
              </span>
              <span>Review</span>
            </div>

            <ChevronRight className="w-3 h-3 text-ink-3/40" />

            <div
              className="flex items-center gap-1.5 text-xs font-medium text-ink-3/60"
              title="4 Passport: Issue cryptographically sealed Evidence Passport"
            >
              <span className="w-5 h-5 rounded-full bg-surface-2 text-ink-3 text-[11px] font-medium flex items-center justify-center border border-line">
                4
              </span>
              <span>Passport</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner with Friendly Recovery */}
      {error && (
        <div className="p-4 rounded-[12px] bg-contradicted-soft border border-contradicted-border flex items-start gap-3 animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-critical shrink-0 mt-0.5" />
          <div className="flex-1 text-sm text-critical">
            <span className="font-semibold block mb-0.5">Your draft is safe. Nothing was lost.</span>
            <span>{error}</span>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={executeSubmission}
            className="shrink-0 text-xs bg-surface hover:bg-surface-2 text-ink border-critical/30"
          >
            Retry analysis
          </Button>
        </div>
      )}

      {/* 2. Analysis In-Progress View (Replaces Form when Submitting) */}
      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          <div className="xl:col-span-8 bg-surface border border-line rounded-[14px] p-8 sm:p-10 shadow-sm space-y-8 animate-fadeIn">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-soft border border-brand/20 text-xs font-bold text-brand uppercase tracking-wider mb-3">
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Verification in progress</span>
              </div>
              <h2 className="text-2xl font-bold text-ink font-serif tracking-tight">
                Analysing your draft…
              </h2>
              <p className="text-sm text-ink-2 mt-1">
                Checking claims against NexTech approved specs and active brand rules.
              </p>
            </div>

            {/* 4 Multi-Stage Steps */}
            <div className="space-y-4 max-w-lg">
              {[
                { title: 'Extracting claims from draft', desc: 'Isolating factual statements, numbers, and promises' },
                { title: 'Checking approved NexTech facts', desc: 'Validating battery specs, materials, weights, and dates' },
                { title: 'Applying brand & tone rules', desc: 'Detecting unsupported superlatives and prohibited terms' },
                { title: 'Preparing Evidence Passport', desc: 'Synthesizing confidence scores and audit trail' },
              ].map((step, idx) => {
                const isDone = analysisStep > idx;
                const isCurrent = analysisStep === idx;

                return (
                  <div
                    key={idx}
                    className={cn(
                      'flex items-start gap-3.5 p-3.5 rounded-[10px] border transition-all duration-300',
                      isDone
                        ? 'bg-supported-soft/40 border-supported-border'
                        : isCurrent
                        ? 'bg-brand-soft/50 border-brand/30 shadow-xs'
                        : 'bg-surface-2/40 border-line/60 opacity-60'
                    )}
                  >
                    <div className="shrink-0 mt-0.5">
                      {isDone ? (
                        <div className="w-5 h-5 rounded-full bg-supported text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : isCurrent ? (
                        <div className="w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center">
                          <RotateCw className="w-3 h-3 animate-spin" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-ink-3/40 text-ink-3 text-xs flex items-center justify-center font-mono">
                          {idx + 1}
                        </div>
                      )}
                    </div>
                    <div>
                      <div
                        className={cn(
                          'text-xs font-bold',
                          isDone ? 'text-supported' : isCurrent ? 'text-brand' : 'text-ink-3'
                        )}
                      >
                        {step.title}
                      </div>
                      <div className="text-[11px] text-ink-2 mt-0.5">{step.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dimmed Draft Preview Beside Analysis Card */}
          <div className="xl:col-span-4 bg-paper border border-line rounded-[14px] p-6 space-y-4 opacity-80">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-3">Draft under audit</span>
              <span className="text-[11px] font-mono text-ink-3">{channel}</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink mb-1 truncate">{title}</h3>
              <p className="text-xs text-ink-2 italic font-serif leading-relaxed line-clamp-8">
                &ldquo;{content}&rdquo;
              </p>
            </div>
            <div className="pt-3 border-t border-line text-[11px] text-ink-3 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-supported" />
              <span>Original text permanently preserved in audit record</span>
            </div>
          </div>
        </div>
      ) : (
        /* 3. Main Two-Column Layout (Form 8/12, Side Panel 4/12) */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: THE WRITING DESK (xl:col-span-8) */}
          <div className="xl:col-span-8 bg-surface border border-line rounded-[14px] shadow-xs overflow-hidden">
            {/* Restorable Draft Alert */}
            {restorableDraft && (
              <div className="bg-brand-soft/90 border-b border-brand/20 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-brand animate-fadeIn">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                  <span>
                    Unsaved draft found from <strong>{restorableDraft.time}</strong> (&ldquo;{restorableDraft.title || 'Untitled'}&rdquo;).
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={restoreDraft}
                    className="font-bold underline hover:no-underline cursor-pointer"
                  >
                    Restore draft
                  </button>
                  <button
                    type="button"
                    onClick={dismissDraft}
                    className="text-ink-3 hover:text-ink cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Replace Draft Confirmation Dialog */}
            {sampleConfirm && (
              <div className="bg-unverified-soft/90 border-b border-unverified-border px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-unverified animate-fadeIn">
                <span>
                  Replace your current draft with <strong>&ldquo;{sampleConfirm.name}&rdquo;</strong>?
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => applySample(sampleConfirm)}
                    className="text-xs bg-unverified text-white hover:bg-unverified/90 py-1 px-3"
                  >
                    Replace
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSampleConfirm(null)}
                    className="text-xs text-ink-2 hover:bg-surface/60 py-1 px-3"
                  >
                    Keep draft
                  </Button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-7">
              {/* a. Details Row: Title & Content Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="submission-title"
                    className="flex items-center justify-between text-xs font-semibold text-ink mb-1.5"
                  >
                    <span className="flex items-center gap-1.5">
                      <Pencil className="w-3.5 h-3.5 text-terracotta" />
                      <span>Submission title</span>
                    </span>
                    <span className="text-[10px] text-ink-3 uppercase tracking-wider font-bold">Required</span>
                  </label>
                  <input
                    id="submission-title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, title: true }))}
                    placeholder="e.g. Nova launch post, Instagram"
                    disabled={loading}
                    className={cn(
                      'w-full px-3.5 py-2.5 rounded-[10px] text-sm text-ink bg-surface border transition-all duration-200 outline-none',
                      titleError
                        ? 'border-critical focus:ring-2 focus:ring-critical/20'
                        : 'border-line focus:border-brand focus:ring-2 focus:ring-brand/20'
                    )}
                    aria-describedby={titleError ? 'title-error-helper' : 'title-hint'}
                  />
                  {titleError ? (
                    <p id="title-error-helper" className="text-[11px] text-critical font-medium mt-1">
                      Please enter a title so your team can recognise this review later.
                    </p>
                  ) : (
                    <p id="title-hint" className="text-[11px] text-ink-3 mt-1">
                      Something your team will recognise later.
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="content-type" className="block text-xs font-semibold text-ink mb-1.5">
                    Content type
                  </label>
                  <select
                    id="content-type"
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2.5 rounded-[10px] text-xs font-medium text-ink bg-surface border border-line focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all duration-200 cursor-pointer"
                  >
                    {CONTENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* b. Channel Selector (Icon Cards with Keyboard Arrow Navigation) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-ink">Publishing channel</label>
                  <span className="text-[11px] text-ink-3">Select one</span>
                </div>

                <div
                  role="radiogroup"
                  aria-label="Publishing channel"
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5"
                >
                  {CHANNELS.map((c, idx) => {
                    const isSelected = channel === c.name;
                    const Icon = c.icon;

                    return (
                      <button
                        key={c.name}
                        id={`channel-radio-${idx}`}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={isSelected ? 0 : -1}
                        onClick={() => setChannel(c.name)}
                        onKeyDown={(e) => handleChannelKeyDown(e, idx)}
                        disabled={loading}
                        className={cn(
                          'relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-[10px] border text-center transition-all duration-200 cursor-pointer outline-none',
                          'focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
                          isSelected
                            ? 'border-brand bg-brand-soft/80 text-brand shadow-xs font-semibold -translate-y-0.5'
                            : 'border-line bg-surface hover:bg-surface-2/70 text-ink-2 hover:-translate-y-0.5'
                        )}
                      >
                        {isSelected && (
                          <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-brand text-white flex items-center justify-center shadow-xs">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                        <Icon className={cn('w-4 h-4', isSelected ? 'text-brand' : 'text-ink-3')} />
                        <span className="text-xs tracking-tight">{c.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Animated Channel Hint */}
                {activeChannelConfig && (
                  <div className="mt-2.5 px-3.5 py-2 rounded-[8px] bg-surface-2/70 border border-line/70 flex items-start gap-2 text-xs text-ink-2 animate-fadeIn">
                    <Info className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" />
                    <span>{activeChannelConfig.hint}</span>
                  </div>
                )}
              </div>

              {/* c. "Not sure where to start? Try a sample" */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-terracotta" />
                    <span className="text-xs font-bold text-ink">Not sure where to start? Try a sample</span>
                  </div>
                  {selectedSampleId && (
                    <button
                      type="button"
                      onClick={handleClearSample}
                      className="text-[11px] text-ink-3 hover:text-ink underline hover:no-underline cursor-pointer"
                    >
                      Clear sample
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {BENCHMARK_SAMPLES.map((sample) => {
                    const isSelected = selectedSampleId === sample.id;

                    const tagClasses = {
                      contradicted: 'bg-contradicted-soft text-critical border-contradicted-border',
                      supported: 'bg-supported-soft text-supported border-supported-border',
                      unverified: 'bg-unverified-soft text-unverified border-unverified-border',
                    }[sample.tagVariant];

                    return (
                      <button
                        key={sample.id}
                        type="button"
                        onClick={() => loadSample(sample)}
                        disabled={loading}
                        className={cn(
                          'p-3.5 rounded-[12px] border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2.5',
                          'hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
                          isSelected
                            ? 'border-brand bg-brand-soft/40 shadow-xs'
                            : 'border-line bg-surface hover:bg-surface-2/70'
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold text-ink">{sample.name}</span>
                          <span
                            className={cn(
                              'text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider',
                              tagClasses
                            )}
                          >
                            {sample.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-ink-2 leading-relaxed">{sample.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* d. Draft Editor with Live Claim Radar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="draft-content" className="text-xs font-semibold text-ink">
                    Your draft
                  </label>
                  <div className="flex items-center gap-2">
                    {autosaveTime && (
                      <span className="text-[11px] text-ink-3 font-mono flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-supported" />
                        Draft saved {autosaveTime}
                      </span>
                    )}
                  </div>
                </div>

                {/* Textarea with Highlight Mirror Layer */}
                <div
                  className={cn(
                    'relative rounded-[10px] border bg-surface transition-all duration-200 overflow-hidden',
                    contentError
                      ? 'border-critical focus-within:ring-2 focus-within:ring-critical/20'
                      : 'border-line focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20'
                  )}
                >
                  {/* Highlight Mirror (Visual Radar Layer Behind Cursor) */}
                  <div
                    ref={mirrorRef}
                    aria-hidden="true"
                    className="absolute inset-0 p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap break-words overflow-hidden pointer-events-none select-none"
                    style={{ minHeight: '260px' }}
                  >
                    {renderedMirrorTokens}
                  </div>

                  {/* Interactive Textarea */}
                  <textarea
                    ref={textareaRef}
                    id="draft-content"
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onScroll={handleScroll}
                    onBlur={() => setTouched((t) => ({ ...t, content: true }))}
                    placeholder="Paste your copy here. Product specs, promises and numbers are what we check most carefully."
                    disabled={loading}
                    className="relative z-10 w-full min-h-[260px] max-h-[500px] p-4 text-sm leading-relaxed text-ink bg-transparent outline-none resize-y placeholder:text-ink-3/70"
                    aria-describedby={contentError ? 'content-error-helper' : undefined}
                  />
                </div>

                {contentError && (
                  <p id="content-error-helper" className="text-[11px] text-critical font-medium mt-1">
                    Please paste or write your draft copy to proceed with verification.
                  </p>
                )}

                {/* Radar Legend Chips & Counter Row */}
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
                  {/* Live Claim Radar Summary Chips */}
                  <div
                    className="flex flex-wrap items-center gap-2"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-unverified-soft text-unverified text-[11px] font-medium border border-unverified-border"
                      title="Numbers with units (battery hours, weight, frequencies, percentages)"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-unverified" />
                      {radar.numbers.length} numbers
                    </span>

                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-contradicted-soft text-critical text-[11px] font-medium border border-contradicted-border"
                      title="Superlatives and unbacked absolute claims"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-contradicted" />
                      {radar.superlatives.length} superlatives
                    </span>

                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-soft text-brand text-[11px] font-medium border border-brand/20"
                      title="Model specifications and technology features"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                      {radar.specs.length} specs
                    </span>

                    <span className="text-[11px] text-ink-3 hidden sm:inline">
                      · Preview only. Real check happens after submit.
                    </span>
                  </div>

                  {/* Character / Word Counter */}
                  <div className="text-[11px] text-ink-3 font-mono tnums shrink-0 ml-auto">
                    <span>
                      {charCount} chars · {wordCount} words
                    </span>
                    {isNearLimit && activeChannelConfig?.charLimit && (
                      <span className="text-unverified ml-1.5 font-sans font-semibold">
                        (approaching {activeChannelConfig.charLimit.toLocaleString()} limit)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* e. Sticky Action Bar */}
              <div className="sticky bottom-0 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 p-4 sm:p-5 bg-surface/95 backdrop-blur-md border-t border-line rounded-b-[14px] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 z-20 shadow-sm">
                {/* Left: Origin Preservation Note */}
                <div className="flex items-center gap-2 text-xs text-ink-2">
                  <ShieldCheck className="w-4 h-4 text-supported shrink-0" />
                  <span>Your original text is kept exactly as submitted.</span>
                </div>

                {/* Right: Requirements Checklist & Submit Button */}
                <div className="flex flex-wrap items-center justify-end gap-3">
                  {/* Mini Requirements Checklist */}
                  <div className="hidden md:flex items-center gap-2 text-[11px] font-mono mr-1">
                    <span
                      className={cn(
                        'flex items-center gap-1 transition-colors',
                        title.trim() ? 'text-supported' : 'text-ink-3'
                      )}
                    >
                      <span
                        className={cn(
                          'w-3.5 h-3.5 rounded-full flex items-center justify-center border text-[9px]',
                          title.trim()
                            ? 'bg-supported text-white border-supported'
                            : 'border-line text-ink-3'
                        )}
                      >
                        ✓
                      </span>
                      Title
                    </span>

                    <span className="text-line">•</span>

                    <span
                      className={cn(
                        'flex items-center gap-1 transition-colors',
                        channel ? 'text-supported' : 'text-ink-3'
                      )}
                    >
                      <span
                        className={cn(
                          'w-3.5 h-3.5 rounded-full flex items-center justify-center border text-[9px]',
                          channel
                            ? 'bg-supported text-white border-supported'
                            : 'border-line text-ink-3'
                        )}
                      >
                        ✓
                      </span>
                      Channel
                    </span>

                    <span className="text-line">•</span>

                    <span
                      className={cn(
                        'flex items-center gap-1 transition-colors',
                        content.trim() ? 'text-supported' : 'text-ink-3'
                      )}
                    >
                      <span
                        className={cn(
                          'w-3.5 h-3.5 rounded-full flex items-center justify-center border text-[9px]',
                          content.trim()
                            ? 'bg-supported text-white border-supported'
                            : 'border-line text-ink-3'
                        )}
                      >
                        ✓
                      </span>
                      Draft
                    </span>
                  </div>

                  {/* Clear Ghost Button */}
                  {(title || content) && (
                    <button
                      type="button"
                      onClick={() => (clearConfirm ? handleClearForm() : setClearConfirm(true))}
                      className="text-xs text-ink-3 hover:text-critical font-medium px-2.5 py-1.5 transition-colors cursor-pointer"
                    >
                      {clearConfirm ? 'Confirm clear?' : 'Clear'}
                    </button>
                  )}

                  {/* Submit Button */}
                  <div
                    title={
                      !canSubmit
                        ? 'Paste some copy to begin verification (⌘↵)'
                        : 'Submit for brand verification (⌘↵)'
                    }
                  >
                    <Button
                      type="button"
                      disabled={loading || !canSubmit}
                      onClick={(e) => {
                        e.preventDefault();
                        executeSubmission();
                      }}
                      className={cn(
                        'btn-primary text-xs px-6 py-2.5 flex items-center gap-2 rounded-full font-bold shadow-sm transition-all',
                        canSubmit ? 'cursor-pointer hover:shadow-md active:scale-95' : 'opacity-60 cursor-not-allowed'
                      )}
                    >
                      {loading ? (
                        <>
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Verifying…</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Submit for brand verification</span>
                          <span className="hidden lg:inline text-[10px] opacity-75 font-mono ml-0.5">⌘↵</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN: "WHAT HAPPENS NEXT" SIDE PANEL (xl:col-span-4, sticky top-24) */}
          <div className="xl:col-span-4 space-y-5 sticky top-24">
            {/* 1. Guide Card */}
            <div className="bg-surface border border-line rounded-[14px] p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-soft flex items-center justify-center text-brand">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink font-serif">What happens next</h3>
                  <p className="text-[11px] text-ink-3">Automated audit against approved ground truth</p>
                </div>
              </div>

              {/* Handwritten Note in Caveat */}
              <div className="p-3 rounded-[10px] bg-paper border border-line/80 font-handwritten text-lg text-terracotta leading-snug">
                &ldquo;Every claim gets checked. You make the final call.&rdquo;
              </div>

              {/* 4-Step Vertical Timeline */}
              <div className="space-y-3 pt-1 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-surface-2 border border-line text-ink-2 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <span className="font-bold text-ink block">Extract claims</span>
                    <span className="text-[11px] text-ink-2">Identifies every factual statement, number, and promise.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-surface-2 border border-line text-ink-2 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <span className="font-bold text-ink block">Compare with approved facts</span>
                    <span className="text-[11px] text-ink-2">Matches against NexTech source specs and registers.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-surface-2 border border-line text-ink-2 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <span className="font-bold text-ink block">Apply brand rules</span>
                    <span className="text-[11px] text-ink-2">Flags banned words, superlatives, and channel tone.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-surface-2 border border-line text-ink-2 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    4
                  </div>
                  <div>
                    <span className="font-bold text-ink block">Issue your Evidence Passport</span>
                    <span className="text-[11px] text-ink-2">Generates a permanent, auditable proof record.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Your Rulebook Card */}
            <div className="bg-surface border border-line rounded-[14px] p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-terracotta" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink font-jakarta">Your rulebook</h3>
                </div>
                <span className="text-[10px] text-ink-3 font-mono">NexTech workspace</span>
              </div>

              {ruleStatsLoading ? (
                <div className="py-2 space-y-2 animate-pulse">
                  <div className="h-4 bg-surface-2 rounded w-3/4" />
                  <div className="h-3 bg-surface-2 rounded w-1/2" />
                </div>
              ) : (
                <div>
                  <div className="text-sm font-bold text-ink">
                    {ruleStats?.facts ?? 5} approved facts · {ruleStats?.guidelines ?? 5} active guidelines
                  </div>
                  <p className="text-[11px] text-ink-3 mt-0.5">Ground truth synchronized from verified sources</p>
                </div>
              )}

              <div className="pt-2 border-t border-line flex items-center justify-between text-xs font-semibold">
                <Link
                  href="/knowledge"
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand hover:underline inline-flex items-center gap-1"
                >
                  <span>View facts</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
                <Link
                  href="/guidelines"
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand hover:underline inline-flex items-center gap-1"
                >
                  <span>View guidelines</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* 3. Trust Card */}
            <div className="bg-surface border border-line rounded-[14px] p-5 shadow-xs space-y-3.5">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-brand" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink font-jakarta">Trust & Governance</h3>
              </div>

              <div className="space-y-2.5 text-xs text-ink-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-supported shrink-0 mt-0.5" />
                  <span>AI suggests findings; human reviewers decide approvals.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-supported shrink-0 mt-0.5" />
                  <span>Official specifications are immutable and never edited by AI.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-supported shrink-0 mt-0.5" />
                  <span>Only your submitted draft copy and relevant source excerpts leave this workspace.</span>
                </div>
              </div>

              <div className="pt-2 border-t border-line flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-ink-3">Google Gemini · gemini-1.5-flash</span>
                <Link
                  href="/settings"
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand font-semibold hover:underline"
                >
                  How AI is used →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
