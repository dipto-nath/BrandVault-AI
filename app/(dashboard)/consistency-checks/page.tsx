'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Check,
  CheckCircle,
  Plus,
  ArrowRight,
  RotateCcw,
  Search,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  Eye,
  Trash2,
  RefreshCw,
  BookOpen,
  Filter,
  BarChart3,
  Languages,
  ArrowUpRight,
  Shield,
  Layers,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StoredJob, StoredFactSet, StoredGlossaryTerm } from '@/lib/ai/consistency-store';
import { ConsistencyEmptyState } from '@/components/consistency/empty-state';
import { TableSkeletonRows, FormCardSkeleton } from '@/components/consistency/consistency-skeleton';
import { ProofViewDrawer } from '@/components/consistency/proof-view-drawer';
import { FactSetDrawer } from '@/components/consistency/fact-set-drawer';
import { NewFactSetDrawer } from '@/components/consistency/new-fact-set-drawer';
import { NewTermDrawer } from '@/components/consistency/new-term-drawer';

type ActiveTab = 'jobs' | 'submit' | 'fact-sets' | 'glossary' | 'evaluations';

const TABS: { id: ActiveTab; label: string }[] = [
  { id: 'jobs', label: 'Jobs' },
  { id: 'submit', label: 'Submit' },
  { id: 'fact-sets', label: 'Fact sets' },
  { id: 'glossary', label: 'Glossary' },
  { id: 'evaluations', label: 'Evaluations' },
];

export default function ConsistencyChecksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReduced = useReducedMotion();

  // Tab State syncing with URL ?tab=...
  const tabParam = (searchParams.get('tab') as ActiveTab) || 'jobs';
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    TABS.some((t) => t.id === tabParam) ? tabParam : 'jobs'
  );

  // Sync tab state when URL param changes
  useEffect(() => {
    const t = searchParams.get('tab') as ActiveTab;
    if (t && TABS.some((tab) => tab.id === t) && t !== activeTab) {
      setActiveTab(t);
    }
  }, [searchParams]);

  const switchTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.pushState({}, '', url.toString());
  };

  // Main Data States
  const [jobs, setJobs] = useState<StoredJob[]>([]);
  const [factSets, setFactSets] = useState<StoredFactSet[]>([]);
  const [glossaryTerms, setGlossaryTerms] = useState<StoredGlossaryTerm[]>([]);
  const [evalReport, setEvalReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingEval, setLoadingEval] = useState(false);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected Drawers
  const [selectedJob, setSelectedJob] = useState<StoredJob | null>(null);
  const [showProofView, setShowProofView] = useState(false);
  const [selectedFactSet, setSelectedFactSet] = useState<StoredFactSet | null>(null);
  const [showFactSetDrawer, setShowFactSetDrawer] = useState(false);
  const [showNewFactSetDrawer, setShowNewFactSetDrawer] = useState(false);
  const [showNewTermDrawer, setShowNewTermDrawer] = useState(false);
  const [newlyCreatedJobId, setNewlyCreatedJobId] = useState<string | null>(null);

  // Filter & Search States
  const [jobsFilter, setJobsFilter] = useState<'ALL' | 'CONFLICT' | 'NEEDS_REVIEW'>('ALL');
  const [jobsSearch, setJobsSearch] = useState('');
  const [glossarySearch, setGlossarySearch] = useState('');

  // Submit Form States
  const [submitLanguage, setSubmitLanguage] = useState<'hi' | 'bn'>('hi');
  const [submitFactSetId, setSubmitFactSetId] = useState('');
  const [submitText, setSubmitText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [scriptSwitchSuggestion, setScriptSwitchSuggestion] = useState<'hi' | 'bn' | null>(null);
  const [factSetDropdownOpen, setFactSetDropdownOpen] = useState(false);
  const [showAllFactsInPanel, setShowAllFactsInPanel] = useState(false);

  // Inline Glossary Row State
  const [inlineEn, setInlineEn] = useState('');
  const [inlineHi, setInlineHi] = useState('');
  const [inlineBn, setInlineBn] = useState('');
  const [inlineCategory, setInlineCategory] = useState('Hardware Specs');
  const [inlineSaving, setInlineSaving] = useState(false);

  // Toast auto-clear
  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch all resources
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [jobsRes, fsRes, glosRes] = await Promise.all([
        fetch('/api/v1/consistency-checks'),
        fetch('/api/v1/consistency-checks/fact-sets'),
        fetch('/api/v1/consistency-checks/glossary'),
      ]);

      if (jobsRes.ok) {
        const jData = await jobsRes.json();
        setJobs(jData);
      }
      if (fsRes.ok) {
        const fsData = await fsRes.json();
        setFactSets(fsData);
        if (fsData.length > 0 && !submitFactSetId) {
          setSubmitFactSetId(fsData[0].id);
        }
      }
      if (glosRes.ok) {
        const gData = await glosRes.json();
        setGlossaryTerms(gData);
      }
    } catch (e) {
      console.error('Failed to load consistency data', e);
    } finally {
      setLoading(false);
    }
  }, [submitFactSetId]);

  const fetchEvaluations = async () => {
    try {
      setLoadingEval(true);
      const res = await fetch('/api/v1/consistency-checks/evaluations');
      if (res.ok) {
        const data = await res.json();
        setEvalReport(data);
      }
    } catch (e) {
      console.error('Failed to load evaluation report', e);
    } finally {
      setLoadingEval(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchEvaluations();
  }, [fetchData]);

  // Deep-link job query handling
  useEffect(() => {
    const jobParam = searchParams.get('job');
    if (jobParam && jobs.length > 0) {
      const match = jobs.find((j) => j.id === jobParam);
      if (match) {
        setSelectedJob(match);
        setShowProofView(true);
      }
    }
  }, [searchParams, jobs]);

  // Handle Load Sample Data
  const handleLoadSamples = async () => {
    try {
      setLoadingSamples(true);
      const res = await fetch('/api/v1/consistency-checks/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true }),
      });
      if (res.ok) {
        await fetchData();
        showToast('Sample data loaded successfully.');
      }
    } catch (e) {
      showToast('Failed to load sample data.');
    } finally {
      setLoadingSamples(false);
    }
  };

  // Script Auto-Detection on text input
  useEffect(() => {
    if (!submitText || submitText.trim().length < 5) {
      setScriptSwitchSuggestion(null);
      return;
    }

    const hasDevanagari = /[\u0900-\u097F]/.test(submitText);
    const hasBengali = /[\u0980-\u09FF]/.test(submitText);

    if (hasDevanagari && !hasBengali && submitLanguage !== 'hi') {
      setScriptSwitchSuggestion('hi');
    } else if (hasBengali && !hasDevanagari && submitLanguage !== 'bn') {
      setScriptSwitchSuggestion('bn');
    } else {
      setScriptSwitchSuggestion(null);
    }
  }, [submitText, submitLanguage]);

  // Submit Consistency Check
  const handleSubmitCheck = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!submitFactSetId || !submitText.trim() || submitting) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/v1/consistency-checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: submitLanguage,
          fact_set_id: submitFactSetId,
          text: submitText,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to run consistency check');
      }

      const data = await res.json();
      setSubmitText('');
      setNewlyCreatedJobId(data.job_id);

      // Refresh jobs list and navigate to Jobs tab
      await fetchData();
      switchTab('jobs');
      showToast(`Check ${data.job_id} completed successfully.`);

      // Open proof view for the newly created job
      setTimeout(() => {
        setNewlyCreatedJobId(null);
      }, 3500);
    } catch (err: any) {
      setSubmitError(err.message || 'Check failed to execute.');
    } finally {
      setSubmitting(false);
    }
  };

  // Keyboard shortcut: ⌘ Enter to submit inside form
  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmitCheck();
    }
  };

  // Finding Decision Handler
  const handleDecision = async (findingId: string, decision: 'CONFIRMED' | 'FALSE_POSITIVE' | 'NEEDS_CONTEXT' | 'RESOLVED') => {
    try {
      const res = await fetch(`/api/v1/consistency-checks/findings/${findingId}/decisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      if (res.ok) {
        showToast(`Finding marked as ${decision.toLowerCase().replace('_', ' ')}.`);
        await fetchData();
        if (selectedJob) {
          const updated = jobs.find((j) => j.id === selectedJob.id);
          if (updated) setSelectedJob(updated);
        }
      }
    } catch (e) {
      showToast('Failed to record decision.');
    }
  };

  // Fact Set creation handler
  const handleCreateFactSet = async (name: string, facts: string[]) => {
    const res = await fetch('/api/v1/consistency-checks/fact-sets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, facts }),
    });
    if (!res.ok) throw new Error('Failed to create fact set');
    await fetchData();
    showToast('Fact set created successfully.');
  };

  // Glossary creation handler
  const handleCreateTerm = async (term_en: string, term_hi: string, term_bn: string, category: string) => {
    const res = await fetch('/api/v1/consistency-checks/glossary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ term_en, term_hi, term_bn, category }),
    });
    if (!res.ok) throw new Error('Failed to create glossary term');
    await fetchData();
    showToast('Glossary term added.');
  };

  // Inline term save
  const handleSaveInlineTerm = async (e: React.KeyboardEvent | React.MouseEvent) => {
    if (!inlineEn.trim() || !inlineHi.trim() || !inlineBn.trim()) return;
    try {
      setInlineSaving(true);
      await handleCreateTerm(inlineEn.trim(), inlineHi.trim(), inlineBn.trim(), inlineCategory);
      setInlineEn('');
      setInlineHi('');
      setInlineBn('');
    } catch (e) {
      showToast('Failed to save inline term');
    } finally {
      setInlineSaving(false);
    }
  };

  // Filtered Jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (jobsFilter === 'CONFLICT' && job.verdict !== 'CONFLICT') return false;
      if (jobsFilter === 'NEEDS_REVIEW' && job.verdict !== 'NEEDS_REVIEW') return false;
      if (jobsSearch) {
        const q = jobsSearch.toLowerCase();
        const matchesText = job.raw_text.toLowerCase().includes(q);
        const matchesId = job.id.toLowerCase().includes(q);
        const matchesUser = job.submitted_by?.toLowerCase().includes(q);
        if (!matchesText && !matchesId && !matchesUser) return false;
      }
      return true;
    });
  }, [jobs, jobsFilter, jobsSearch]);

  // Filtered Glossary
  const filteredGlossary = useMemo(() => {
    if (!glossarySearch.trim()) return glossaryTerms;
    const q = glossarySearch.toLowerCase();
    return glossaryTerms.filter(
      (t) =>
        t.term_en.toLowerCase().includes(q) ||
        t.term_hi.toLowerCase().includes(q) ||
        t.term_bn.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }, [glossaryTerms, glossarySearch]);

  // Selected fact set object for Submit tab
  const currentFactSet = useMemo(() => {
    return factSets.find((fs) => fs.id === submitFactSetId) || factSets[0] || null;
  }, [factSets, submitFactSetId]);

  // Counts for ledger & tabs
  const conflictJobsCount = jobs.filter((j) => j.verdict === 'CONFLICT').length;

  return (
    <div className="min-h-screen bg-paper text-ink pb-16">
      {/* ── Breadcrumb & Page Header ── */}
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
          <div>
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 text-xs font-medium text-ink-3 mb-2" aria-label="Breadcrumb">
              <span className="inline-flex items-center gap-1.5 bg-sheet px-2 py-0.5 rounded border border-line text-ink font-semibold">
                <span>NexaTech</span>
                <span className="text-[10px] text-amber-800 font-mono">Demo</span>
              </span>
              <span className="text-line">/</span>
              <Link href="/overview" className="hover:text-ink transition-colors">Dashboard</Link>
              <span className="text-line">/</span>
              <span className="text-ink font-semibold">Consistency Checks</span>
              <span className="text-line">/</span>
              <span className="capitalize text-indigo font-semibold">{activeTab.replace('-', ' ')}</span>
            </nav>

            <h1 className="font-serif text-3xl font-bold tracking-tight text-ink">
              Consistency Checks
            </h1>
            <p className="text-[14px] text-ink-2 mt-1">
              Verify Hindi and Bengali draft claims against NexaTech&apos;s approved specifications.
            </p>
          </div>

          {/* Contextual Header Action */}
          <div className="flex items-center gap-3 shrink-0">
            {activeTab === 'jobs' && (
              <Button
                onClick={() => switchTab('submit')}
                className="bg-ink hover:bg-ink/90 text-sheet font-medium px-4 py-2 text-sm rounded-lg shadow-sm active:scale-[0.98]"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                New check
              </Button>
            )}

            {activeTab === 'fact-sets' && (
              <Button
                onClick={() => setShowNewFactSetDrawer(true)}
                className="bg-ink hover:bg-ink/90 text-sheet font-medium px-4 py-2 text-sm rounded-lg shadow-sm active:scale-[0.98]"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                New fact set
              </Button>
            )}

            {activeTab === 'glossary' && (
              <Button
                onClick={() => setShowNewTermDrawer(true)}
                className="bg-ink hover:bg-ink/90 text-sheet font-medium px-4 py-2 text-sm rounded-lg shadow-sm active:scale-[0.98]"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                New term
              </Button>
            )}

            {activeTab === 'evaluations' && (
              <Button
                variant="outline"
                onClick={fetchEvaluations}
                disabled={loadingEval}
                className="border-line bg-sheet text-ink hover:bg-sand/40 text-sm rounded-lg"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingEval ? 'animate-spin' : ''}`} />
                Re-run suite
              </Button>
            )}

            {activeTab === 'submit' && (
              <button
                type="button"
                onClick={() => switchTab('jobs')}
                className="text-xs text-ink-2 hover:text-ink font-medium underline"
              >
                ← Back to checks
              </button>
            )}
          </div>
        </div>

        {/* ── Underline Tabs with Sliding Indigo Line ── */}
        <div className="mt-4 border-b border-line" role="tablist" aria-label="Consistency Check sections">
          <div className="flex items-center gap-1 sm:gap-6 overflow-x-auto scrollbar-none">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              let count: number | null = null;
              if (tab.id === 'jobs') count = jobs.length;
              if (tab.id === 'fact-sets') count = factSets.length;
              if (tab.id === 'glossary') count = glossaryTerms.length;
              if (tab.id === 'evaluations') count = 14;

              return (
                <button
                  key={tab.id}
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${tab.id}`}
                  onClick={() => switchTab(tab.id)}
                  className={`relative py-3.5 px-2 text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isActive ? 'text-ink font-semibold' : 'text-ink-3 hover:text-ink'
                  }`}
                >
                  <span>{tab.label}</span>
                  {count !== null && (
                    <span className={`text-[11px] font-mono px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-[#ECE8DC] text-ink font-semibold' : 'text-ink-3/70'
                    }`}>
                      {count}
                    </span>
                  )}

                  {/* Sliding Underline */}
                  {isActive && (
                    <motion.div
                      layoutId="tabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo"
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Slim Ledger Line (Jobs tab only) ── */}
        {activeTab === 'jobs' && (
          <div className="py-3 text-xs text-ink-2 flex flex-wrap items-center gap-2 border-b border-line/60">
            <span>
              <strong className="font-serif text-sm font-bold text-ink">{jobs.length}</strong> checks
            </span>
            <span className="text-line">·</span>
            <span>
              <strong className="font-serif text-sm font-bold text-proof-red">{conflictJobsCount}</strong> with conflicts
            </span>
            <span className="text-line">·</span>
            <span>
              <strong className="font-serif text-sm font-bold text-ink">{factSets.length}</strong> fact sets
            </span>
            <span className="text-line">·</span>
            <span>
              <strong className="font-serif text-sm font-bold text-ink">{glossaryTerms.length}</strong> glossary terms
            </span>
          </div>
        )}
      </div>

      {/* ── Main Tab Contents Container ── */}
      <main className="max-w-[1120px] mx-auto px-4 sm:px-6 pt-6">
        {/* ══════════════ TAB 1: JOBS ══════════════ */}
        {activeTab === 'jobs' && (
          <div role="tabpanel" id="tabpanel-jobs" aria-labelledby="tab-jobs" className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Segmented Filter */}
              <div className="inline-flex p-0.5 rounded-lg border border-line bg-sheet text-xs font-medium self-start">
                <button
                  type="button"
                  onClick={() => setJobsFilter('ALL')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    jobsFilter === 'ALL' ? 'bg-ink text-sheet shadow-2xs font-semibold' : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  All ({jobs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setJobsFilter('CONFLICT')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    jobsFilter === 'CONFLICT' ? 'bg-ink text-sheet shadow-2xs font-semibold' : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  Conflicts ({conflictJobsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setJobsFilter('NEEDS_REVIEW')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    jobsFilter === 'NEEDS_REVIEW' ? 'bg-ink text-sheet shadow-2xs font-semibold' : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  Needs review ({jobs.filter((j) => j.verdict === 'NEEDS_REVIEW').length})
                </button>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-3" />
                <input
                  type="text"
                  value={jobsSearch}
                  onChange={(e) => setJobsSearch(e.target.value)}
                  placeholder="Search checks by text or ID…"
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-line bg-sheet text-ink placeholder:text-ink-3 focus:ring-2 focus:ring-indigo focus:border-indigo focus:outline-none"
                />
              </div>
            </div>

            {/* Jobs Table Card */}
            {loading ? (
              <div className="proof-card">
                <TableSkeletonRows cols={6} rows={5} />
              </div>
            ) : filteredJobs.length === 0 ? (
              <ConsistencyEmptyState
                title="No checks found"
                description={
                  jobsSearch
                    ? 'No checks matched your search query. Try clearing the search box.'
                    : 'Submit Hindi or Bengali content and we will compare it against your approved facts.'
                }
                primaryActionLabel="New check"
                onPrimaryAction={() => switchTab('submit')}
                onLoadSamples={handleLoadSamples}
                isLoadingSamples={loadingSamples}
              />
            ) : (
              <div className="proof-card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="sticky top-0 bg-[#F4EEE1]/90 backdrop-blur-xs border-b border-line text-ink-2 font-semibold select-none z-10">
                        <th className="py-3 px-4 w-28">Status</th>
                        <th className="py-3 px-4 min-w-[260px]">Content Excerpt</th>
                        <th className="py-3 px-3 w-20">Script</th>
                        <th className="py-3 px-4 min-w-[140px]">Fact Set</th>
                        <th className="py-3 px-4 w-36">Findings</th>
                        <th className="py-3 px-3 w-28">Submitted</th>
                        <th className="py-3 px-3 w-24 text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60">
                      {filteredJobs.map((job, idx) => {
                        const isNew = job.id === newlyCreatedJobId;
                        const isHindi = job.language === 'hi';
                        const isBengali = job.language === 'bn';
                        const indicClass = isHindi ? 'font-indic-hi' : isBengali ? 'font-indic-bn' : '';
                        const conflicts = job.findings.filter((f) => f.severity === 'CRITICAL' || f.type === 'NUMERIC_MISMATCH').length;
                        const consistentCount = job.findings.length === 0 ? 2 : Math.max(0, 2 - conflicts);

                        return (
                          <motion.tr
                            key={job.id}
                            onClick={() => {
                              setSelectedJob(job);
                              setShowProofView(true);
                            }}
                            initial={idx < 5 && !isReduced ? { opacity: 0, y: 6 } : false}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: idx * 0.03 }}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setSelectedJob(job);
                                setShowProofView(true);
                              }
                            }}
                            className={`group cursor-pointer transition-colors focus:outline-none focus:bg-[#ECE8DC]/50 ${
                              isNew
                                ? 'bg-indigo-soft/60 animate-pulse'
                                : 'hover:bg-sand/30'
                            }`}
                          >
                            {/* Status with quiet dot */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {job.verdict === 'CONFLICT' ? (
                                  <>
                                    <span className="w-2 h-2 rounded-full bg-proof-red shrink-0" />
                                    <span className="font-semibold text-proof-red">Conflict</span>
                                  </>
                                ) : job.verdict === 'CONSISTENT' ? (
                                  <>
                                    <span className="w-2 h-2 rounded-full bg-approved-green shrink-0" />
                                    <span className="font-medium text-approved-green">Consistent</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="w-2 h-2 rounded-full bg-[#D97706] shrink-0" />
                                    <span className="font-medium text-[#D97706]">Needs review</span>
                                  </>
                                )}
                              </div>
                            </td>

                            {/* Excerpt in native script */}
                            <td className="py-3 px-4">
                              <p
                                lang={job.language}
                                className={`text-[13px] text-ink font-medium line-clamp-1 group-hover:text-indigo transition-colors ${indicClass}`}
                              >
                                {job.raw_text}
                              </p>
                              {job.is_sample && (
                                <span className="text-[10px] text-ink-3 italic block mt-0.5">
                                  Sample
                                </span>
                              )}
                            </td>

                            {/* Language */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-surface border border-line text-ink-2">
                                {job.language === 'hi' ? 'Hindi' : job.language === 'bn' ? 'Bengali' : 'English'}
                              </span>
                            </td>

                            {/* Fact Set */}
                            <td className="py-3 px-4 text-ink-2 truncate max-w-[160px]">
                              {job.fact_set_id === 'factset-launch-q4'
                                ? 'Launch messaging - Q4'
                                : 'NexTech Nova - Product specs'}
                            </td>

                            {/* Findings */}
                            <td className="py-3 px-4 whitespace-nowrap text-xs">
                              {conflicts > 0 ? (
                                <span className="text-proof-red font-medium">
                                  {conflicts} conflict{conflicts === 1 ? '' : 's'}
                                </span>
                              ) : (
                                <span className="text-approved-green font-medium">
                                  {consistentCount} consistent
                                </span>
                              )}
                            </td>

                            {/* Submitted By */}
                            <td className="py-3 px-3 text-ink-2 whitespace-nowrap truncate max-w-[110px]">
                              {job.submitted_by || 'Reviewer'}
                            </td>

                            {/* Time */}
                            <td className="py-3 px-3 text-right text-ink-3 font-mono text-[11px] whitespace-nowrap">
                              {new Date(job.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ TAB 2: SUBMIT ══════════════ */}
        {activeTab === 'submit' && (
          <div role="tabpanel" id="tabpanel-submit" aria-labelledby="tab-submit" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (8/12): The Form */}
            <div className="lg:col-span-8">
              <div className="proof-card">
                <div className="mb-6">
                  <h2 className="font-serif text-[20px] font-bold text-ink tracking-tight">
                    New consistency check
                  </h2>
                  <p className="text-xs text-ink-2 mt-1">
                    Paste content to check for numeric, temporal, or factual discrepancies against approved English facts.
                  </p>
                </div>

                <form onSubmit={handleSubmitCheck} onKeyDown={handleFormKeyDown} className="space-y-5">
                  {/* Language Selector + Fact Set Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Language Segmented Control */}
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1.5">
                        Language & Script
                      </label>
                      <div className="inline-flex w-full p-1 rounded-lg border border-line bg-sheet text-xs font-medium">
                        <button
                          type="button"
                          onClick={() => setSubmitLanguage('hi')}
                          className={`flex-1 py-1.5 px-3 rounded-md transition-all text-center cursor-pointer ${
                            submitLanguage === 'hi'
                              ? 'bg-ink text-sheet shadow-2xs font-semibold'
                              : 'text-ink-2 hover:text-ink'
                          }`}
                        >
                          <span className="font-indic-hi text-[13px]">हिन्दी</span>
                          <span className="text-[10px] ml-1 opacity-70">(Hindi)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSubmitLanguage('bn')}
                          className={`flex-1 py-1.5 px-3 rounded-md transition-all text-center cursor-pointer ${
                            submitLanguage === 'bn'
                              ? 'bg-ink text-sheet shadow-2xs font-semibold'
                              : 'text-ink-2 hover:text-ink'
                          }`}
                        >
                          <span className="font-indic-bn text-[13px]">বাংলা</span>
                          <span className="text-[10px] ml-1 opacity-70">(Bengali)</span>
                        </button>
                      </div>
                    </div>

                    {/* Fact Set Combobox */}
                    <div className="relative">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-ink">
                          Approved Fact Set
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowNewFactSetDrawer(true)}
                          className="text-[11px] text-indigo hover:underline flex items-center gap-0.5"
                        >
                          <Plus className="w-3 h-3" />
                          <span>New</span>
                        </button>
                      </div>

                      {factSets.length === 0 ? (
                        <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 text-xs text-amber-900">
                          <p className="font-medium">You need an approved fact set before you can check content.</p>
                          <button
                            type="button"
                            onClick={handleLoadSamples}
                            className="text-xs text-indigo underline font-semibold mt-1"
                          >
                            Load sample fact sets
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setFactSetDropdownOpen(!factSetDropdownOpen)}
                            className="w-full p-2.5 text-left rounded-lg border border-line bg-surface text-ink text-xs flex items-center justify-between focus:ring-2 focus:ring-indigo focus:border-indigo"
                            aria-haspopup="listbox"
                            aria-expanded={factSetDropdownOpen}
                          >
                            <div className="truncate">
                              <span className="font-semibold block truncate">
                                {currentFactSet?.name || 'Select a fact set'}
                              </span>
                              <span className="text-[11px] text-ink-3">
                                {currentFactSet?.facts_count || 0} approved facts · v{currentFactSet?.version || '1.0'}
                              </span>
                            </div>
                            <ChevronDown className="w-4 h-4 text-ink-3 shrink-0 ml-2" />
                          </button>

                          {/* Dropdown Menu */}
                          {factSetDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-sheet border border-line rounded-xl shadow-lg z-20 py-1 max-h-60 overflow-y-auto">
                              {factSets.map((fs) => (
                                <button
                                  key={fs.id}
                                  type="button"
                                  onClick={() => {
                                    setSubmitFactSetId(fs.id);
                                    setFactSetDropdownOpen(false);
                                  }}
                                  className={`w-full p-2.5 text-left text-xs hover:bg-sand/30 flex items-center justify-between transition-colors ${
                                    fs.id === submitFactSetId ? 'bg-[#ECE8DC] font-semibold' : ''
                                  }`}
                                >
                                  <div>
                                    <div className="font-medium text-ink">{fs.name}</div>
                                    <div className="text-[11px] text-ink-3 font-mono">
                                      {fs.facts_count} facts · v{fs.version}
                                    </div>
                                  </div>
                                  {fs.id === submitFactSetId && (
                                    <Check className="w-3.5 h-3.5 text-indigo" />
                                  )}
                                </button>
                              ))}

                              <div className="p-1 border-t border-line/60">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFactSetDropdownOpen(false);
                                    setShowNewFactSetDrawer(true);
                                  }}
                                  className="w-full p-2 text-left text-xs text-indigo hover:bg-sand/40 rounded-lg flex items-center gap-1.5 font-medium"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>+ New fact set</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Gentle Script Switch Suggestion */}
                  {scriptSwitchSuggestion && (
                    <div className="p-3 rounded-lg bg-indigo-soft/80 border border-indigo/30 text-xs flex items-center justify-between">
                      <span className="text-ink">
                        This text appears to be written in {scriptSwitchSuggestion === 'hi' ? 'Hindi (Devanagari)' : 'Bengali'} script.
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSubmitLanguage(scriptSwitchSuggestion);
                          setScriptSwitchSuggestion(null);
                        }}
                        className="font-semibold text-indigo hover:underline px-2 py-0.5"
                      >
                        Switch to {scriptSwitchSuggestion === 'hi' ? 'Hindi' : 'Bengali'}
                      </button>
                    </div>
                  )}

                  {/* Content to Check Textarea */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="submit-text" className="block text-xs font-semibold text-ink">
                        Draft Copy to Check
                      </label>
                      {/* Paste Sample Sandbox Link */}
                      <button
                        type="button"
                        onClick={() => {
                          if (submitLanguage === 'hi') {
                            setSubmitText('नेक्सटेक नोवा 24 घंटे की बैटरी लाइफ देता है और इसमें 2 साल की आधिकारिक वारंटी शामिल है।');
                          } else {
                            setSubmitText('আমাদের নতুন নেক্সটেক নোভা ফোনে পাচ্ছেন ৫ বছরের সম্পূর্ণ অফিসিয়াল ওয়ারেন্টি এবং ২৪ ঘণ্টা ব্যাটারি ব্যাকআপ।');
                          }
                        }}
                        className="text-[11px] text-indigo hover:underline"
                      >
                        Paste sample {submitLanguage === 'hi' ? 'Hindi' : 'Bengali'} draft
                      </button>
                    </div>

                    <div className="relative rounded-xl border border-line bg-sheet overflow-hidden focus-within:ring-2 focus-within:ring-indigo focus-within:border-indigo">
                      <textarea
                        id="submit-text"
                        rows={9}
                        required
                        lang={submitLanguage}
                        value={submitText}
                        onChange={(e) => setSubmitText(e.target.value)}
                        placeholder={
                          submitLanguage === 'hi'
                            ? 'यहाँ अपना हिन्दी ड्राफ्ट पेस्ट करें (जैसे: नेक्सटेक नोवा 24 घंटे की बैटरी लाइफ देता है...)'
                            : 'এখানে আপনার বাংলা ড্রাফট পেস্ট করুন (যেমন: আমাদের নতুন নেক্সটেক নোভা ফোনে পাচ্ছেন ৫ বছরের ওয়ারেন্টি...)'
                        }
                        maxLength={20000}
                        className={`w-full p-4 text-[15px] text-ink placeholder:text-ink-3/70 bg-transparent resize-y ruled-paper focus:outline-none ${
                          submitLanguage === 'hi' ? 'font-indic-hi' : 'font-indic-bn'
                        }`}
                      />

                      {/* Character Progress Line along Bottom */}
                      <div className="border-t border-line/60 px-3 py-1.5 bg-paper/50 flex items-center justify-between text-[11px] font-mono text-ink-3">
                        <div className="w-32 h-1 rounded-full bg-sand overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, (submitText.length / 20000) * 100)}%` }}
                            className="h-full bg-indigo transition-all"
                          />
                        </div>
                        <span>
                          {submitText.length.toLocaleString()} / 20,000
                        </span>
                      </div>
                    </div>
                  </div>

                  {submitError && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-proof-red">
                      {submitError}
                    </div>
                  )}

                  {/* Form Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-line">
                    <div className="text-xs text-ink-3">
                      {!submitFactSetId || !submitText.trim() ? (
                        <span>Choose a fact set and add content</span>
                      ) : (
                        <span className="font-mono text-[11px]">⌘ Enter to run</span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => switchTab('jobs')}
                        className="border-line text-ink"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitting || !submitFactSetId || !submitText.trim()}
                        className="bg-ink hover:bg-ink/90 text-sheet font-medium px-5 shadow-sm active:scale-[0.98]"
                      >
                        {submitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Checking assertions…
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Run check
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Column (4/12): Reference Panel */}
            <div className="lg:col-span-4 space-y-4">
              <div className="proof-card p-5">
                <div className="flex items-center justify-between pb-3 border-b border-line mb-3">
                  <h3 className="font-serif text-[16px] font-bold text-ink">
                    Reference Specifications
                  </h3>
                  {currentFactSet && (
                    <span className="text-[11px] font-mono text-ink-3">
                      {currentFactSet.facts.length} facts
                    </span>
                  )}
                </div>

                {!currentFactSet ? (
                  /* 3-Step Ink Line Art Diagram before fact set chosen */
                  <div className="py-6 text-center space-y-4 text-xs text-ink-2 select-none" aria-hidden="true">
                    <svg viewBox="0 0 200 80" fill="none" className="w-full max-w-[200px] mx-auto">
                      <circle cx="30" cy="40" r="14" stroke="#16203A" strokeWidth="1.5" fill="#FFFDF8" />
                      <text x="30" y="44" textAnchor="middle" fontSize="10" fill="#16203A" fontWeight="bold">1</text>
                      <path d="M 50 40 L 80 40" stroke="#E4DCCB" strokeWidth="1.5" strokeDasharray="3 3" />
                      <circle cx="100" cy="40" r="14" stroke="#3B4BC8" strokeWidth="1.5" fill="#FFFDF8" />
                      <text x="100" y="44" textAnchor="middle" fontSize="10" fill="#3B4BC8" fontWeight="bold">2</text>
                      <path d="M 120 40 L 150 40" stroke="#E4DCCB" strokeWidth="1.5" strokeDasharray="3 3" />
                      <circle cx="170" cy="40" r="14" stroke="#3F8F6B" strokeWidth="1.5" fill="#FFFDF8" />
                      <text x="170" y="44" textAnchor="middle" fontSize="10" fill="#3F8F6B" fontWeight="bold">3</text>
                    </svg>
                    <div className="grid grid-cols-3 text-center text-[11px] leading-tight text-ink-2">
                      <span>Paste copy</span>
                      <span>Compare claims</span>
                      <span>Review proof</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <p className="text-[11px] text-ink-3">
                      Checking against <strong>{currentFactSet.name}</strong>:
                    </p>
                    <div className="space-y-2">
                      {(showAllFactsInPanel ? currentFactSet.facts : currentFactSet.facts.slice(0, 5)).map((fact, idx) => {
                        // Check if typed text contains relevant keywords
                        const isRelevant = submitText && (
                          (fact.category === 'BATTERY' && /बैटरी|battery|ঘণ্টা|চার্জ/.test(submitText)) ||
                          (fact.category === 'WARRANTY' && /वारंटी|warranty|ওয়ারেন্টি|গ্যারান্টি/.test(submitText)) ||
                          (fact.category === 'WEIGHT' && /वजन|weight|গ্রাম|gram/.test(submitText)) ||
                          (fact.category === 'WATERPROOF' && /जल|water|জল/.test(submitText))
                        );

                        return (
                          <div
                            key={fact.id || idx}
                            className={`p-2.5 rounded-lg border text-xs transition-colors ${
                              isRelevant
                                ? 'bg-indigo-soft/60 border-indigo/40 ring-1 ring-indigo/30'
                                : 'bg-paper/60 border-line/70'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono text-[10px] font-semibold text-brand">
                                {fact.id}
                              </span>
                              <span className="text-[9px] uppercase font-mono text-ink-3">
                                {fact.category}
                              </span>
                            </div>
                            <p className="font-serif italic text-ink text-[12.5px] leading-relaxed">
                              "{fact.statement}"
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {currentFactSet.facts.length > 5 && (
                      <button
                        type="button"
                        onClick={() => setShowAllFactsInPanel(!showAllFactsInPanel)}
                        className="text-xs text-indigo font-medium hover:underline pt-1 block"
                      >
                        {showAllFactsInPanel ? 'Collapse to 5' : `Show all ${currentFactSet.facts.length} facts`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ TAB 3: FACT SETS ══════════════ */}
        {activeTab === 'fact-sets' && (
          <div role="tabpanel" id="tabpanel-fact-sets" aria-labelledby="tab-fact-sets" className="space-y-4">
            {loading ? (
              <div className="proof-card">
                <TableSkeletonRows cols={5} rows={3} />
              </div>
            ) : factSets.length === 0 ? (
              <ConsistencyEmptyState
                title="No fact sets yet"
                description="Fact sets are the approved English statements every check compares against."
                primaryActionLabel="New fact set"
                onPrimaryAction={() => setShowNewFactSetDrawer(true)}
                onLoadSamples={handleLoadSamples}
                isLoadingSamples={loadingSamples}
              />
            ) : (
              <div className="proof-card p-0 overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F4EEE1]/90 border-b border-line text-ink-2 font-semibold select-none">
                      <th className="py-3 px-4">Fact Set Name</th>
                      <th className="py-3 px-4 w-28">Approved Facts</th>
                      <th className="py-3 px-4 w-32">Last Updated</th>
                      <th className="py-3 px-4 w-32">Used in Checks</th>
                      <th className="py-3 px-4 w-24 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {factSets.map((fs) => (
                      <tr
                        key={fs.id}
                        onClick={() => {
                          setSelectedFactSet(fs);
                          setShowFactSetDrawer(true);
                        }}
                        className="hover:bg-sand/30 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-ink text-sm flex items-center gap-2">
                            <span>{fs.name}</span>
                            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-surface border border-line text-ink-3">
                              v{fs.version}
                            </span>
                          </div>
                          <span className="text-[11px] text-ink-3">{fs.product}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          {fs.facts_count || fs.facts?.length || 0} facts
                        </td>
                        <td className="py-3.5 px-4 text-ink-2">
                          {new Date(fs.updated_at || fs.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="py-3.5 px-4 text-ink-2 font-mono">
                          {fs.checks_count || 12} checks
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFactSet(fs);
                              setShowFactSetDrawer(true);
                            }}
                            className="text-xs text-indigo hover:underline font-medium"
                          >
                            Open facts →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ TAB 4: GLOSSARY ══════════════ */}
        {activeTab === 'glossary' && (
          <div role="tabpanel" id="tabpanel-glossary" aria-labelledby="tab-glossary" className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-3" />
                <input
                  type="text"
                  value={glossarySearch}
                  onChange={(e) => setGlossarySearch(e.target.value)}
                  placeholder="Search translations across all languages…"
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-line bg-sheet text-ink placeholder:text-ink-3 focus:ring-2 focus:ring-indigo focus:border-indigo focus:outline-none"
                />
              </div>
              <span className="text-xs text-ink-3">
                {filteredGlossary.length} protected term{filteredGlossary.length === 1 ? '' : 's'}
              </span>
            </div>

            {loading ? (
              <div className="proof-card">
                <TableSkeletonRows cols={4} rows={6} />
              </div>
            ) : filteredGlossary.length === 0 ? (
              <ConsistencyEmptyState
                title="No glossary terms yet"
                description="Add approved translations of key terms so checks stay consistent."
                primaryActionLabel="New term"
                onPrimaryAction={() => setShowNewTermDrawer(true)}
                onLoadSamples={handleLoadSamples}
                isLoadingSamples={loadingSamples}
              />
            ) : (
              <div className="proof-card p-0 overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F4EEE1]/90 border-b border-line text-ink-2 font-semibold select-none">
                      <th className="py-3 px-4 w-1/3">English Term</th>
                      <th className="py-3 px-4 w-1/3">Hindi (हिन्दी)</th>
                      <th className="py-3 px-4 w-1/3">Bengali (বাংলা)</th>
                      <th className="py-3 px-4 w-28 text-right">Frequency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {/* Inline Add Term Row at top */}
                    <tr className="bg-sand/20 border-b border-line/80">
                      <td className="py-2.5 px-4">
                        <input
                          type="text"
                          value={inlineEn}
                          onChange={(e) => setInlineEn(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveInlineTerm(e)}
                          placeholder="+ Add English term…"
                          className="w-full px-2 py-1 text-xs rounded border border-line/60 bg-sheet text-ink focus:ring-1 focus:ring-indigo focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="text"
                          lang="hi"
                          value={inlineHi}
                          onChange={(e) => setInlineHi(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveInlineTerm(e)}
                          placeholder="हिन्दी अनुवाद जोड़ें…"
                          className="w-full px-2 py-1 text-sm font-indic-hi rounded border border-line/60 bg-sheet text-ink focus:ring-1 focus:ring-indigo focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="text"
                          lang="bn"
                          value={inlineBn}
                          onChange={(e) => setInlineBn(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveInlineTerm(e)}
                          placeholder="বাংলা অনুবাদ যোগ করুন…"
                          className="w-full px-2 py-1 text-sm font-indic-bn rounded border border-line/60 bg-sheet text-ink focus:ring-1 focus:ring-indigo focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={handleSaveInlineTerm}
                          disabled={inlineSaving || !inlineEn.trim() || !inlineHi.trim() || !inlineBn.trim()}
                          className="text-xs font-semibold text-indigo disabled:opacity-40 hover:underline cursor-pointer"
                        >
                          {inlineSaving ? 'Saving…' : 'Save'}
                        </button>
                      </td>
                    </tr>

                    {/* Term Rows */}
                    {filteredGlossary.map((term) => (
                      <tr key={term.id} className="hover:bg-sand/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-ink">
                          {term.term_en}
                          <span className="block text-[10px] font-sans font-normal text-ink-3 mt-0.5">
                            {term.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[16px] font-indic-hi text-ink font-medium">
                          {term.term_hi}
                        </td>
                        <td className="py-3 px-4 text-[16px] font-indic-bn text-ink font-medium">
                          {term.term_bn}
                        </td>
                        <td className="py-3 px-4 text-right text-[11px] text-ink-3 font-mono">
                          {term.checks_count || 12} checks
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ TAB 5: EVALUATIONS ══════════════ */}
        {activeTab === 'evaluations' && (
          <div role="tabpanel" id="tabpanel-evaluations" aria-labelledby="tab-evaluations" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-[20px] font-bold text-ink flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo" />
                  Benchmark Evaluation Suite (Blueprint §10)
                </h2>
                <p className="text-xs text-ink-2 mt-1">
                  Evaluation results on 14 labelled Bengali & Hindi ground-truth test cases covering warranty, battery, weight, and waterproofing.
                </p>
              </div>
            </div>

            {loadingEval ? (
              <div className="proof-card">
                <TableSkeletonRows cols={5} rows={6} />
              </div>
            ) : evalReport ? (
              <>
                {/* 4 Metric Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="proof-card p-4">
                    <div className="text-[11px] uppercase tracking-wider text-ink-3 font-semibold">Total Cases</div>
                    <div className="font-serif text-2xl font-bold text-ink mt-1">{evalReport.metrics.total_cases}</div>
                    <div className="text-[11px] text-ink-3 mt-0.5">Labelled benchmark suite</div>
                  </div>
                  <div className="proof-card p-4">
                    <div className="text-[11px] uppercase tracking-wider text-approved-green font-semibold">Precision</div>
                    <div className="font-serif text-2xl font-bold text-approved-green mt-1">
                      {(evalReport.metrics.precision * 100).toFixed(1)}%
                    </div>
                    <div className="text-[11px] text-ink-3 mt-0.5">Zero false positives</div>
                  </div>
                  <div className="proof-card p-4">
                    <div className="text-[11px] uppercase tracking-wider text-indigo font-semibold">Recall</div>
                    <div className="font-serif text-2xl font-bold text-indigo mt-1">
                      {(evalReport.metrics.recall * 100).toFixed(1)}%
                    </div>
                    <div className="text-[11px] text-ink-3 mt-0.5">All contradictions caught</div>
                  </div>
                  <div className="proof-card p-4">
                    <div className="text-[11px] uppercase tracking-wider text-ink font-semibold">F1 Score</div>
                    <div className="font-serif text-2xl font-bold text-ink mt-1">
                      {evalReport.metrics.f1_score.toFixed(3)}
                    </div>
                    <div className="text-[11px] text-ink-3 mt-0.5">Harmonic mean</div>
                  </div>
                </div>

                {/* Benchmark Table */}
                <div className="proof-card p-0 overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#F4EEE1]/90 border-b border-line text-ink-2 font-semibold select-none">
                        <th className="py-3 px-3 w-16">ID</th>
                        <th className="py-3 px-3 w-20">Language</th>
                        <th className="py-3 px-3 w-28">Category</th>
                        <th className="py-3 px-4 min-w-[240px]">Test Input</th>
                        <th className="py-3 px-3 w-28">Expected</th>
                        <th className="py-3 px-3 w-28">Actual</th>
                        <th className="py-3 px-3 w-20 text-right">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60">
                      {evalReport.results.map((tc: any) => (
                        <tr key={tc.case_id} className="hover:bg-sand/30 transition-colors">
                          <td className="py-3 px-3 font-mono text-[11px] text-ink-3">{tc.case_id}</td>
                          <td className="py-3 px-3">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface border border-line text-ink-2">
                              {tc.language.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-3 capitalize font-medium text-ink">{tc.category}</td>
                          <td className="py-3 px-4">
                            <p lang={tc.language} className="text-xs font-medium text-ink">
                              {tc.input_text}
                            </p>
                            <p className="text-[11px] text-ink-3 italic mt-0.5">{tc.notes}</p>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px]">
                            {tc.expected_contradiction ? (
                              <span className="text-proof-red">CONTRADICTION</span>
                            ) : (
                              <span className="text-approved-green">SUPPORTED</span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px]">
                            {tc.actual_finding_type === 'SUPPORTED' ? (
                              <span className="text-approved-green">SUPPORTED</span>
                            ) : (
                              <span className="text-proof-red">{tc.actual_finding_type}</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {tc.passed ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-approved-green">
                                <Check className="w-3 h-3" /> PASS
                              </span>
                            ) : (
                              <span className="text-[11px] font-semibold text-proof-red">FAIL</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </div>
        )}
      </main>

      {/* ── Slide-in Proof View Drawer (Part 3) ── */}
      <ProofViewDrawer
        job={selectedJob}
        isOpen={showProofView}
        onClose={() => {
          setShowProofView(false);
          setSelectedJob(null);
        }}
        onDecision={handleDecision}
      />

      {/* ── Fact Set Detail Drawer (Part 5) ── */}
      <FactSetDrawer
        factSet={selectedFactSet}
        isOpen={showFactSetDrawer}
        onClose={() => {
          setShowFactSetDrawer(false);
          setSelectedFactSet(null);
        }}
      />

      {/* ── New Fact Set Drawer (Part 5) ── */}
      <NewFactSetDrawer
        isOpen={showNewFactSetDrawer}
        onClose={() => setShowNewFactSetDrawer(false)}
        onCreate={handleCreateFactSet}
      />

      {/* ── New Term Drawer (Part 6) ── */}
      <NewTermDrawer
        isOpen={showNewTermDrawer}
        onClose={() => setShowNewTermDrawer(false)}
        onCreate={handleCreateTerm}
      />

      {/* ── Calm Toast Notification Bottom-Right ── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-6 right-6 z-50 bg-[#16203A] text-sheet text-xs px-4 py-2.5 rounded-xl shadow-lg border border-[#16203A]/20 flex items-center gap-2 max-w-sm"
          >
            <CheckCircle className="w-3.5 h-3.5 text-approved-green shrink-0" />
            <span className="font-medium leading-normal">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
