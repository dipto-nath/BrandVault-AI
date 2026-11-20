'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileText, ShieldCheck, AlertTriangle, MessageSquare, ChevronDown, ChevronRight,
  Info, Sparkles, Check, X, Shield, ArrowUpRight, RotateCw, Download, ArrowRight,
  CheckCircle2, XCircle, SlidersHorizontal, BarChart3, PieChart, Table as TableIcon,
  HelpCircle, ExternalLink, CornerDownRight, Plus, Eye, Undo2, Clock, CheckCheck,
  Flame, BookOpen, AlertCircle, Layers
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { GovernanceInsightsData, TimeRange, ScrutinyRule, KnowledgeGap } from '@/lib/services/insights';
import { RuleDrawer } from './rule-drawer';
import { AddFactDrawer } from './add-fact-drawer';
import { AuditLogDrawer } from './audit-log-drawer';

interface InsightsManagerProps {
  initialData: GovernanceInsightsData;
  initialRuleParam?: string | null;
}

export function InsightsManager({
  initialData,
  initialRuleParam = null,
}: InsightsManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<GovernanceInsightsData>(initialData);
  const [selectedRange, setSelectedRange] = useState<TimeRange>(initialData.timeRange || '30d');
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; undoId?: string; undoTimer?: number } | null>(null);

  // Active Rule Drawer
  const [drawerRule, setDrawerRule] = useState<ScrutinyRule | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Add Fact Drawer
  const [factDrawerGap, setFactDrawerGap] = useState<KnowledgeGap | null>(null);
  const [isFactDrawerOpen, setIsFactDrawerOpen] = useState(false);

  // Audit Log Drawer
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);

  // Filter & Sort for Guidelines under scrutiny
  const [scrutinyFilter, setScrutinyFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [scrutinySort, setScrutinySort] = useState<'risk' | 'overrides' | 'newest'>('risk');

  // Chart table toggles
  const [showTableChart1, setShowTableChart1] = useState(false);
  const [showTableChart2, setShowTableChart2] = useState(false);
  const [showTableChart3, setShowTableChart3] = useState(false);
  const [showTableChart4, setShowTableChart4] = useState(false);

  // Chart series toggles for Chart 1
  const [seriesActive, setSeriesActive] = useState({
    supported: true,
    contradicted: true,
    unverified: true,
    outdated: true,
  });

  // Modal dialog states
  const [confirmApproveRule, setConfirmApproveRule] = useState<ScrutinyRule | null>(null);
  const [dismissRuleTarget, setDismissRuleTarget] = useState<ScrutinyRule | null>(null);
  const [dismissReasonInput, setDismissReasonInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Undo countdown timer ref
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [undoCountdown, setUndoCountdown] = useState<number>(10);

  // Deep-link rule parameter handling on mount or searchParams change
  useEffect(() => {
    const ruleParam = searchParams.get('rule') || initialRuleParam;
    if (ruleParam) {
      const match = data.rulesUnderScrutiny.find((r) => r.rule_code === ruleParam || r.id === ruleParam);
      if (match) {
        setDrawerRule(match);
        setIsDrawerOpen(true);
      }
    }
  }, [searchParams, initialRuleParam, data.rulesUnderScrutiny]);

  // Handle popstate for browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const ruleParam = params.get('rule');
      if (ruleParam) {
        const match = data.rulesUnderScrutiny.find((r) => r.rule_code === ruleParam || r.id === ruleParam);
        if (match) {
          setDrawerRule(match);
          setIsDrawerOpen(true);
        }
      } else {
        setIsDrawerOpen(false);
        setDrawerRule(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [data.rulesUnderScrutiny]);

  // Handle Time Range change
  const handleRangeChange = async (newRange: TimeRange) => {
    setSelectedRange(newRange);
    setRefreshing(true);
    const url = new URL(window.location.href);
    url.searchParams.set('range', newRange);
    window.history.pushState({}, '', url.toString());
    try {
      const res = await fetch(`/api/insights?range=${newRange}`);
      if (res.ok) {
        const newData = await res.json();
        setData(newData);
      }
    } catch {
      // Keep existing data on error
    } finally {
      setRefreshing(false);
    }
  };

  // Handle Refresh button
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/insights?range=${selectedRange}`);
      if (res.ok) {
        const newData = await res.json();
        setData(newData);
        showToast('Insights updated with latest workspace data.');
      }
    } finally {
      setRefreshing(false);
    }
  };

  // Toast with automatic dismissal
  const showToast = (text: string, undoId?: string) => {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setToastMessage({ text, undoId });
    setUndoCountdown(10);

    if (undoId) {
      const interval = setInterval(() => {
        setUndoCountdown((c) => {
          if (c <= 1) {
            clearInterval(interval);
            setToastMessage(null);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } else {
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Open Rule Drawer with deep link
  const openRuleDrawer = (rule: ScrutinyRule) => {
    setDrawerRule(rule);
    setIsDrawerOpen(true);
    const url = new URL(window.location.href);
    url.searchParams.set('rule', rule.rule_code);
    window.history.pushState({}, '', url.toString());
  };

  // Close Rule Drawer
  const closeRuleDrawer = () => {
    setIsDrawerOpen(false);
    setDrawerRule(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('rule');
    window.history.pushState({}, '', url.toString());
  };

  // Handle Approve Guideline change
  const handleApproveConfirm = async () => {
    if (!confirmApproveRule) return;
    const rule = confirmApproveRule;
    setActionLoading(true);

    try {
      const suggestionId = rule.suggestionId || rule.id;
      const res = await fetch(`/api/guideline-suggestions/${suggestionId}/approve`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to approve guideline change');

      // Optimistically update scrutiny rules & KPIs
      setData((prev) => ({
        ...prev,
        rulesUnderScrutiny: prev.rulesUnderScrutiny.map((r) =>
          r.id === rule.id ? { ...r, status: 'APPROVED', version: r.version + 1 } : r
        ),
        loopStats: {
          ...prev.loopStats,
          awaitingApprovalCount: Math.max(0, prev.loopStats.awaitingApprovalCount - 1),
          approvedCount: prev.loopStats.approvedCount + 1,
        },
      }));

      setConfirmApproveRule(null);
      if (drawerRule?.id === rule.id) {
        setDrawerRule((prev) => (prev ? { ...prev, status: 'APPROVED', version: prev.version + 1 } : null));
      }

      showToast(`Guideline ${rule.rule_code} updated to v${rule.version + 1}.`, suggestionId);
    } catch (err: any) {
      alert(err.message || 'Error approving guideline');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Undo Guideline approval
  const handleUndo = async (suggestionId: string) => {
    try {
      const res = await fetch(`/api/guideline-suggestions/${suggestionId}/undo`, {
        method: 'POST',
      });
      if (res.ok) {
        setToastMessage(null);
        // Refresh data
        handleRefresh();
      }
    } catch {
      alert('Could not undo action.');
    }
  };

  // Handle Dismiss Guideline proposal
  const handleDismissConfirm = async () => {
    if (!dismissRuleTarget) return;
    const rule = dismissRuleTarget;
    setActionLoading(true);

    try {
      const suggestionId = rule.suggestionId || rule.id;
      const res = await fetch(`/api/guideline-suggestions/${suggestionId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: dismissReasonInput.trim() || 'Dismissed by reviewer' }),
      });

      if (!res.ok) throw new Error('Failed to dismiss proposal');

      setData((prev) => ({
        ...prev,
        rulesUnderScrutiny: prev.rulesUnderScrutiny.map((r) =>
          r.id === rule.id ? { ...r, status: 'REJECTED' } : r
        ),
      }));

      setDismissRuleTarget(null);
      setDismissReasonInput('');
      if (drawerRule?.id === rule.id) {
        setDrawerRule((prev) => (prev ? { ...prev, status: 'REJECTED' } : null));
      }
      showToast(`Proposal for ${rule.rule_code} dismissed.`);
    } catch (err: any) {
      alert(err.message || 'Error dismissing proposal');
    } finally {
      setActionLoading(false);
    }
  };

  // Export CSV functionality
  const handleExportCSV = () => {
    const headers = ['Rule Code', 'Title', 'Severity', 'Clarity Score', 'Times Triggered', 'Overrides', 'Override Rate %', 'Status'];
    const rows = data.rulesUnderScrutiny.map((r) => [
      r.rule_code,
      `"${r.title.replace(/"/g, '""')}"`,
      r.severity,
      r.clarityScore,
      r.triggerCount,
      r.overrideCount,
      `${r.overrideRate}%`,
      r.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `brandvault_governance_insights_${selectedRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Governance CSV report downloaded.');
  };

  // Export PDF functionality
  const handleExportPDF = () => {
    window.print();
  };

  // Filter & Sort for Scrutiny cards
  const displayedScrutinyRules = useMemo(() => {
    let list = [...data.rulesUnderScrutiny];

    if (scrutinyFilter !== 'ALL') {
      list = list.filter((r) => r.status === scrutinyFilter);
    }

    if (scrutinySort === 'risk') {
      list.sort((a, b) => a.clarityScore - b.clarityScore);
    } else if (scrutinySort === 'overrides') {
      list.sort((a, b) => b.overrideCount - a.overrideCount);
    } else {
      list.sort((a, b) => b.triggerCount - a.triggerCount);
    }

    return list;
  }, [data.rulesUnderScrutiny, scrutinyFilter, scrutinySort]);

  return (
    <div className="space-y-8 pb-20 text-ink-dark max-w-7xl mx-auto">
      {/* 3.1 Header */}
      <div className="space-y-3 pt-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-brand" />
              Insights
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-ink-dark tracking-tight">
              Governance insights
            </h1>
            <p className="text-sm text-ink-secondary mt-1">
              Where your guidelines work, and where people keep stumbling.
            </p>
          </div>

          {/* Right Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Time range segmented control */}
            <div className="flex items-center rounded-xl bg-surface border border-sand-dark/40 p-1 shadow-2xs text-xs font-semibold">
              {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRangeChange(r)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    selectedRange === r
                      ? 'bg-brand text-white shadow-xs'
                      : 'text-ink-secondary hover:text-ink-dark hover:bg-sand/40'
                  }`}
                >
                  {r === '7d' ? '7 days' : r === '30d' ? '30 days' : r === '90d' ? '90 days' : 'All time'}
                </button>
              ))}
            </div>

            {/* Export Menu */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="gap-1.5 text-xs bg-surface border-sand-dark/50 text-ink-dark hover:bg-sand/40"
              >
                <Download className="w-3.5 h-3.5 text-ink-muted" />
                <span>CSV</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                className="gap-1.5 text-xs bg-surface border-sand-dark/50 text-ink-dark hover:bg-sand/40"
              >
                <FileText className="w-3.5 h-3.5 text-ink-muted" />
                <span>PDF summary</span>
              </Button>
            </div>

            {/* Last synced pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-sand-dark/40 text-xs text-ink-secondary shadow-2xs">
              <span className="text-[11px]">Synced {data.lastSynced}</span>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                title="Refresh insights from database"
                className="p-0.5 rounded text-ink-muted hover:text-brand transition-colors"
                aria-label="Refresh insights"
              >
                <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3.2 The Guideline Learning Loop Strip */}
      <div className="p-5 sm:p-6 rounded-2xl bg-brand/5 border border-brand/20 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1 max-w-md">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand" />
              <h2 className="text-sm font-bold text-ink-dark uppercase tracking-wide">
                The guideline learning loop
              </h2>
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Repeated overrides show where a rule is unclear. BrandVault drafts clearer wording. An admin decides.
            </p>
          </div>

          {/* 4-Step Diagram */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            <Link
              href="/reviews"
              className="p-2.5 px-3.5 rounded-xl bg-surface border border-sand-dark/40 hover:border-brand/50 shadow-2xs flex items-center gap-2 transition-all group"
            >
              <span className="w-5 h-5 rounded-full bg-sand font-mono text-[11px] font-bold flex items-center justify-center text-ink-dark group-hover:bg-brand group-hover:text-white transition-colors">
                1
              </span>
              <div>
                <div className="font-semibold text-ink-dark group-hover:text-brand">Review</div>
                <div className="text-[10px] text-ink-muted">{data.loopStats.submissionsCount} submissions</div>
              </div>
            </Link>

            <span className="text-sand-dark font-mono hidden sm:inline">→</span>

            <a
              href="#chart-overrides"
              className="p-2.5 px-3.5 rounded-xl bg-surface border border-sand-dark/40 hover:border-accent-terracotta/50 shadow-2xs flex items-center gap-2 transition-all group"
            >
              <span className="w-5 h-5 rounded-full bg-sand font-mono text-[11px] font-bold flex items-center justify-center text-ink-dark group-hover:bg-accent-terracotta group-hover:text-white transition-colors">
                2
              </span>
              <div>
                <div className="font-semibold text-ink-dark group-hover:text-accent-terracotta">Overrides</div>
                <div className="text-[10px] text-ink-muted">{data.loopStats.overridesCount} overrides</div>
              </div>
            </a>

            <span className="text-sand-dark font-mono hidden sm:inline">→</span>

            <a
              href="#scrutiny-section"
              className="p-2.5 px-3.5 rounded-xl bg-surface border border-sand-dark/40 hover:border-brand/50 shadow-2xs flex items-center gap-2 transition-all group"
            >
              <span className="w-5 h-5 rounded-full bg-sand font-mono text-[11px] font-bold flex items-center justify-center text-ink-dark group-hover:bg-brand group-hover:text-white transition-colors">
                3
              </span>
              <div>
                <div className="font-semibold text-ink-dark group-hover:text-brand">Unclear rules</div>
                <div className="text-[10px] text-ink-muted">{data.loopStats.unclearRulesCount} flagged</div>
              </div>
            </a>

            <span className="text-sand-dark font-mono hidden sm:inline">→</span>

            <button
              type="button"
              onClick={() => {
                setScrutinyFilter('PENDING');
                const el = document.getElementById('scrutiny-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="p-2.5 px-3.5 rounded-xl bg-surface border border-sand-dark/40 hover:border-evidence-supported/50 shadow-2xs flex items-center gap-2 transition-all group text-left"
            >
              <span className="w-5 h-5 rounded-full bg-sand font-mono text-[11px] font-bold flex items-center justify-center text-ink-dark group-hover:bg-evidence-supported group-hover:text-white transition-colors">
                4
              </span>
              <div>
                <div className="font-semibold text-ink-dark group-hover:text-evidence-supported">Admin approves</div>
                <div className="text-[10px] text-ink-muted">{data.loopStats.awaitingApprovalCount} awaiting · {data.loopStats.approvedCount} approved</div>
              </div>
            </button>
          </div>

          {/* Caveat Handwritten Note */}
          <div className="text-accent-terracotta text-sm italic font-serif tracking-wide border-t lg:border-t-0 lg:border-l border-sand-dark/30 pt-3 lg:pt-0 lg:pl-6 shrink-0">
            "AI suggests. People decide."
          </div>
        </div>
      </div>

      {/* 3.3 KPI Row (Equal height, 5-up grid, real data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1 */}
        <Link
          href={data.kpis.submissions.href}
          className="p-5 rounded-2xl bg-surface border border-sand-dark/40 hover:border-sand-dark/70 transition-all shadow-xs flex flex-col justify-between group h-full"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-ink-muted group-hover:text-brand transition-colors" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-ink-dark">
              {data.kpis.submissions.value}
            </div>
            <div className="text-xs font-semibold text-ink-dark mt-0.5">{data.kpis.submissions.title}</div>
            <div className="text-[11px] text-ink-muted mt-1 leading-snug">{data.kpis.submissions.caption}</div>
          </div>
          <div className="mt-3 pt-2 border-t border-sand-dark/25 text-[10px] font-mono text-ink-muted">
            {data.kpis.submissions.deltaText}
          </div>
        </Link>

        {/* KPI 2 */}
        <Link
          href={data.kpis.approvalRate.href}
          className="p-5 rounded-2xl bg-surface border border-sand-dark/40 hover:border-sand-dark/70 transition-all shadow-xs flex flex-col justify-between group h-full"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-8 h-8 rounded-full bg-evidence-supported/10 text-evidence-supported flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-ink-muted group-hover:text-evidence-supported transition-colors" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-ink-dark">
              {data.kpis.approvalRate.value}
            </div>
            <div className="text-xs font-semibold text-ink-dark mt-0.5">{data.kpis.approvalRate.title}</div>
            <div className="text-[11px] text-ink-muted mt-1 leading-snug">{data.kpis.approvalRate.caption}</div>
          </div>
          <div className="mt-3 pt-2 border-t border-sand-dark/25 text-[10px] font-mono text-ink-muted">
            {data.kpis.approvalRate.deltaText}
          </div>
        </Link>

        {/* KPI 3 */}
        <Link
          href={data.kpis.openCritical.href}
          className="p-5 rounded-2xl bg-surface border border-sand-dark/40 hover:border-sand-dark/70 transition-all shadow-xs flex flex-col justify-between group h-full"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-8 h-8 rounded-full bg-evidence-contradicted/10 text-evidence-contradicted flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-ink-muted group-hover:text-evidence-contradicted transition-colors" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-ink-dark">
              {data.kpis.openCritical.value}
            </div>
            <div className="text-xs font-semibold text-ink-dark mt-0.5">{data.kpis.openCritical.title}</div>
            <div className="text-[11px] text-ink-muted mt-1 leading-snug">{data.kpis.openCritical.caption}</div>
          </div>
          <div className="mt-3 pt-2 border-t border-sand-dark/25 text-[10px] font-mono text-ink-muted">
            {data.kpis.openCritical.deltaText}
          </div>
        </Link>

        {/* KPI 4 */}
        <a
          href="#chart-overrides"
          className="p-5 rounded-2xl bg-surface border border-sand-dark/40 hover:border-sand-dark/70 transition-all shadow-xs flex flex-col justify-between group h-full"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-8 h-8 rounded-full bg-accent-terracotta/10 text-accent-terracotta flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-ink-muted group-hover:text-accent-terracotta transition-colors" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-ink-dark">
              {data.kpis.overrides.value}
            </div>
            <div className="text-xs font-semibold text-ink-dark mt-0.5">{data.kpis.overrides.title}</div>
            <div className="text-[11px] text-ink-muted mt-1 leading-snug">{data.kpis.overrides.caption}</div>
          </div>
          <div className="mt-3 pt-2 border-t border-sand-dark/25 text-[10px] font-mono text-ink-muted">
            {data.kpis.overrides.deltaText}
          </div>
        </a>

        {/* KPI 5 */}
        <a
          href="#scrutiny-section"
          className="p-5 rounded-2xl bg-surface border border-sand-dark/40 hover:border-sand-dark/70 transition-all shadow-xs flex flex-col justify-between group h-full"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-8 h-8 rounded-full bg-sand text-ink-dark flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-brand" />
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-ink-muted group-hover:text-brand transition-colors" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-ink-dark">
              {data.kpis.unclearRules.value}
            </div>
            <div className="text-xs font-semibold text-ink-dark mt-0.5">{data.kpis.unclearRules.title}</div>
            <div className="text-[11px] text-ink-muted mt-1 leading-snug">{data.kpis.unclearRules.caption}</div>
          </div>
          <div className="mt-3 pt-2 border-t border-sand-dark/25 text-[10px] font-mono text-ink-muted">
            {data.kpis.unclearRules.deltaText}
          </div>
        </a>
      </div>

      {/* 3.4 Charts Section (2x2 Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Findings by Evidence State Over Time */}
        <Card className="border-sand-dark/40 bg-surface shadow-xs">
          <CardHeader className="py-4 px-5 border-b border-sand-dark/30 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-ink-dark">
                Findings by Evidence State Over Time
              </CardTitle>
              <p className="text-xs text-evidence-supported mt-0.5">
                {data.charts.takeaways.evidenceOverTime}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTableChart1(!showTableChart1)}
                className="h-7 text-xs px-2 gap-1 text-ink-secondary"
                title="Toggle accessible table view"
              >
                <TableIcon className="w-3.5 h-3.5" />
                {showTableChart1 ? 'Chart' : 'Table'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {!showTableChart1 ? (
              <div className="space-y-4">
                {/* Interactive Legend */}
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-ink-secondary pb-1">
                  <button
                    type="button"
                    onClick={() => setSeriesActive((p) => ({ ...p, supported: !p.supported }))}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer transition-all ${
                      seriesActive.supported ? 'bg-evidence-supported/10 text-evidence-supported font-semibold' : 'opacity-40'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-xs bg-evidence-supported" />
                    Supported
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeriesActive((p) => ({ ...p, contradicted: !p.contradicted }))}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer transition-all ${
                      seriesActive.contradicted ? 'bg-evidence-contradicted/10 text-evidence-contradicted font-semibold' : 'opacity-40'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-xs bg-evidence-contradicted" />
                    Contradicted
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeriesActive((p) => ({ ...p, unverified: !p.unverified }))}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer transition-all ${
                      seriesActive.unverified ? 'bg-evidence-unverified/10 text-evidence-unverified font-semibold' : 'opacity-40'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-xs bg-evidence-unverified" />
                    Unverified
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeriesActive((p) => ({ ...p, outdated: !p.outdated }))}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer transition-all ${
                      seriesActive.outdated ? 'bg-evidence-outdated/10 text-evidence-outdated font-semibold' : 'opacity-40'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-xs bg-evidence-outdated" />
                    Outdated
                  </button>
                </div>

                {/* Stacked Bars Visual */}
                <div className="h-48 flex items-end justify-between gap-2 pt-4 px-2 border-b border-sand-dark/40">
                  {data.charts.evidenceOverTime.map((item, idx) => {
                    const sup = seriesActive.supported ? item.supported : 0;
                    const con = seriesActive.contradicted ? item.contradicted : 0;
                    const unv = seriesActive.unverified ? item.unverified : 0;
                    const out = seriesActive.outdated ? item.outdated : 0;
                    const total = Math.max(1, sup + con + unv + out);
                    const maxHeight = 150;

                    return (
                      <Link
                        key={idx}
                        href="/reviews"
                        className="flex-1 flex flex-col items-center group cursor-pointer"
                        title={`${item.label}: ${total} findings (Click to see reviews)`}
                      >
                        <div className="w-full max-w-[28px] rounded-t-md overflow-hidden flex flex-col-reverse transition-transform group-hover:scale-105">
                          {sup > 0 && (
                            <div
                              style={{ height: `${(sup / 8) * maxHeight}px` }}
                              className="bg-evidence-supported w-full"
                            />
                          )}
                          {unv > 0 && (
                            <div
                              style={{ height: `${(unv / 8) * maxHeight}px` }}
                              className="bg-evidence-unverified w-full"
                            />
                          )}
                          {con > 0 && (
                            <div
                              style={{ height: `${(con / 8) * maxHeight}px` }}
                              className="bg-evidence-contradicted w-full"
                            />
                          )}
                          {out > 0 && (
                            <div
                              style={{ height: `${(out / 8) * maxHeight}px` }}
                              className="bg-evidence-outdated w-full"
                            />
                          )}
                        </div>
                        <span className="text-[10px] text-ink-muted font-mono mt-2 truncate w-full text-center">
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-sand-dark/40 text-left text-ink-muted">
                      <th className="py-2">Date</th>
                      <th className="py-2">Supported</th>
                      <th className="py-2">Contradicted</th>
                      <th className="py-2">Unverified</th>
                      <th className="py-2">Outdated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-dark/20 font-mono">
                    {data.charts.evidenceOverTime.map((row, idx) => (
                      <tr key={idx} className="hover:bg-sand/30">
                        <td className="py-1.5 font-sans font-medium">{row.label}</td>
                        <td className="py-1.5 text-evidence-supported">{row.supported}</td>
                        <td className="py-1.5 text-evidence-contradicted">{row.contradicted}</td>
                        <td className="py-1.5 text-evidence-unverified">{row.unverified}</td>
                        <td className="py-1.5 text-evidence-outdated">{row.outdated}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 2: Most Triggered Rules */}
        <Card className="border-sand-dark/40 bg-surface shadow-xs">
          <CardHeader className="py-4 px-5 border-b border-sand-dark/30 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-ink-dark">
                Most Triggered Rules
              </CardTitle>
              <p className="text-xs text-ink-secondary mt-0.5">
                {data.charts.takeaways.mostTriggered}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTableChart2(!showTableChart2)}
              className="h-7 text-xs px-2 gap-1 text-ink-secondary"
            >
              <TableIcon className="w-3.5 h-3.5" />
              {showTableChart2 ? 'Chart' : 'Table'}
            </Button>
          </CardHeader>
          <CardContent className="p-5">
            {!showTableChart2 ? (
              <div className="space-y-3.5 pt-1">
                {data.charts.mostTriggeredRules.map((rule) => {
                  const targetScrutinyRule = data.rulesUnderScrutiny.find((r) => r.rule_code === rule.ruleCode);
                  return (
                    <div
                      key={rule.ruleCode}
                      onClick={() => targetScrutinyRule && openRuleDrawer(targetScrutinyRule)}
                      className="group cursor-pointer space-y-1"
                      title="Click to view full rule details and history"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-ink-dark group-hover:text-brand transition-colors">
                            {rule.ruleCode}
                          </span>
                          <span className="text-ink-secondary truncate max-w-[220px]">{rule.ruleTitle}</span>
                        </div>
                        <span className="font-mono text-xs font-semibold text-ink-muted">
                          {rule.count} flags
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-sand overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, (rule.count / 15) * 100)}%` }}
                          className="h-full bg-brand rounded-full transition-all group-hover:bg-brand/90"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-x-auto text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-sand-dark/40 text-left text-ink-muted">
                      <th className="py-2">Rule Code</th>
                      <th className="py-2">Rule Title</th>
                      <th className="py-2">Category</th>
                      <th className="py-2">Flags</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-dark/20">
                    {data.charts.mostTriggeredRules.map((r, idx) => (
                      <tr key={idx} className="hover:bg-sand/30">
                        <td className="py-2 font-mono font-bold">{r.ruleCode}</td>
                        <td className="py-2">{r.ruleTitle}</td>
                        <td className="py-2 capitalize">{r.category.toLowerCase()}</td>
                        <td className="py-2 font-mono font-bold">{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 3: Why Reviewers Override */}
        <Card id="chart-overrides" className="border-sand-dark/40 bg-surface shadow-xs">
          <CardHeader className="py-4 px-5 border-b border-sand-dark/30 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-ink-dark">
                Why Reviewers Override
              </CardTitle>
              <p className="text-xs text-accent-terracotta mt-0.5">
                {data.charts.takeaways.overrideReasons}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTableChart3(!showTableChart3)}
              className="h-7 text-xs px-2 gap-1 text-ink-secondary"
            >
              <TableIcon className="w-3.5 h-3.5" />
              {showTableChart3 ? 'Chart' : 'Table'}
            </Button>
          </CardHeader>
          <CardContent className="p-5">
            {!showTableChart3 ? (
              <div className="space-y-3 pt-1">
                {data.charts.overrideReasons.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('scrutiny-section');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full text-left group space-y-1.5 p-2 rounded-xl hover:bg-sand/30 transition-all"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-ink-dark group-hover:text-accent-terracotta transition-colors">
                        {item.reason}
                      </span>
                      <span className="font-mono text-xs font-semibold text-accent-terracotta">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-sand overflow-hidden">
                      <div
                        style={{ width: `${item.percentage}%` }}
                        className="h-full bg-accent-terracotta rounded-full transition-all"
                      />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-sand-dark/40 text-left text-ink-muted">
                      <th className="py-2">Reason Category</th>
                      <th className="py-2">Count</th>
                      <th className="py-2">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-dark/20">
                    {data.charts.overrideReasons.map((r, idx) => (
                      <tr key={idx} className="hover:bg-sand/30">
                        <td className="py-2">{r.reason}</td>
                        <td className="py-2 font-mono">{r.count}</td>
                        <td className="py-2 font-mono">{r.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 4: Findings by Channel */}
        <Card className="border-sand-dark/40 bg-surface shadow-xs">
          <CardHeader className="py-4 px-5 border-b border-sand-dark/30 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-ink-dark">
                Findings by Channel
              </CardTitle>
              <p className="text-xs text-ink-secondary mt-0.5">
                {data.charts.takeaways.channels}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTableChart4(!showTableChart4)}
              className="h-7 text-xs px-2 gap-1 text-ink-secondary"
            >
              <TableIcon className="w-3.5 h-3.5" />
              {showTableChart4 ? 'Chart' : 'Table'}
            </Button>
          </CardHeader>
          <CardContent className="p-5">
            {!showTableChart4 ? (
              <div className="space-y-3 pt-1">
                {data.charts.channelBreakdown.map((item) => (
                  <Link
                    key={item.channel}
                    href={`/reviews?channel=${item.channel.toUpperCase()}`}
                    className="group block space-y-1.5 p-2 rounded-xl hover:bg-sand/30 transition-all"
                    title={`View ${item.channel} reviews`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink-dark group-hover:text-brand transition-colors">
                          {item.channel}
                        </span>
                        <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono">
                          {item.riskScore}
                        </Badge>
                      </div>
                      <span className="font-mono text-xs text-ink-muted">
                        {item.count} flags ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-sand overflow-hidden">
                      <div
                        style={{ width: `${item.percentage}%` }}
                        className="h-full bg-brand/80 rounded-full group-hover:bg-brand transition-all"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-sand-dark/40 text-left text-ink-muted">
                      <th className="py-2">Channel</th>
                      <th className="py-2">Findings</th>
                      <th className="py-2">Share</th>
                      <th className="py-2">Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-dark/20">
                    {data.charts.channelBreakdown.map((ch, idx) => (
                      <tr key={idx} className="hover:bg-sand/30">
                        <td className="py-2 font-medium">{ch.channel}</td>
                        <td className="py-2 font-mono">{ch.count}</td>
                        <td className="py-2 font-mono">{ch.percentage}%</td>
                        <td className="py-2">{ch.riskScore}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3.5 Guidelines Under Scrutiny (The Hero Section) */}
      <div id="scrutiny-section" className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sand-dark/40 pb-4">
          <div>
            <h2 className="text-2xl font-serif font-bold text-ink-dark">
              Guidelines under scrutiny
            </h2>
            <p className="text-xs text-ink-secondary mt-0.5">
              Rules that keep triggering overrides or confusion.
            </p>
          </div>

          {/* Filters & Sort */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter pills */}
            <div className="flex items-center rounded-xl bg-surface border border-sand-dark/40 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setScrutinyFilter('ALL')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  scrutinyFilter === 'ALL' ? 'bg-ink-dark text-white shadow-xs' : 'text-ink-secondary hover:text-ink-dark'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setScrutinyFilter('PENDING')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  scrutinyFilter === 'PENDING' ? 'bg-brand text-white shadow-xs' : 'text-ink-secondary hover:text-ink-dark'
                }`}
              >
                Awaiting approval
              </button>
              <button
                type="button"
                onClick={() => setScrutinyFilter('APPROVED')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  scrutinyFilter === 'APPROVED' ? 'bg-evidence-supported text-white shadow-xs' : 'text-ink-secondary hover:text-ink-dark'
                }`}
              >
                Approved
              </button>
              <button
                type="button"
                onClick={() => setScrutinyFilter('REJECTED')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  scrutinyFilter === 'REJECTED' ? 'bg-sand-dark text-ink-dark shadow-xs' : 'text-ink-secondary hover:text-ink-dark'
                }`}
              >
                Dismissed
              </button>
            </div>

            {/* Sort selector */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-ink-muted">Sort:</span>
              <select
                value={scrutinySort}
                onChange={(e) => setScrutinySort(e.target.value as any)}
                className="bg-surface border border-sand-dark/40 rounded-lg px-2.5 py-1 text-xs text-ink-dark font-medium focus:outline-none"
              >
                <option value="risk">Clarity risk (lowest score)</option>
                <option value="overrides">Most overridden</option>
                <option value="newest">Most triggered</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scrutiny Cards Stack */}
        {displayedScrutinyRules.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-sand-dark/40 bg-surface">
            <CheckCircle2 className="w-8 h-8 text-evidence-supported mx-auto mb-2" />
            <h3 className="font-semibold text-ink-dark text-sm">All rules are working smoothly. Nice.</h3>
            <p className="text-xs text-ink-muted mt-1">
              No guideline currently meets the threshold for scrutiny in this filter.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedScrutinyRules.map((rule) => {
              const isAwaiting = rule.status === 'PENDING';
              const isApproved = rule.status === 'APPROVED';

              // Clarity score ring colors
              const ringColor =
                rule.clarityScore >= 80 ? 'text-evidence-supported' :
                rule.clarityScore >= 60 ? 'text-evidence-unverified' : 'text-evidence-contradicted';

              return (
                <div
                  key={rule.id}
                  className={`p-5 sm:p-6 rounded-2xl border transition-all duration-200 bg-surface shadow-xs space-y-4 ${
                    isAwaiting
                      ? 'border-l-4 border-l-brand border-sand-dark/50 hover:border-sand-dark/80'
                      : 'border-sand-dark/40 hover:border-sand-dark/70'
                  }`}
                >
                  {/* Top Metadata Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-sand text-ink-dark border border-sand-dark/40">
                        {rule.rule_code}
                      </span>
                      <Badge variant={rule.severity === 'HIGH' ? 'danger' : 'medium'} className="text-[10px] uppercase font-bold">
                        {rule.severity}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] capitalize font-medium">
                        {rule.category.toLowerCase()}
                      </Badge>
                      <span className="text-xs text-ink-muted font-medium">v{rule.version}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAwaiting && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand bg-brand/10 px-2.5 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                          Awaiting approval
                        </span>
                      )}
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-evidence-supported bg-evidence-supported/10 px-2.5 py-0.5 rounded-full">
                          <Check className="w-3 h-3" /> Approved · v{rule.version}
                        </span>
                      )}
                      {rule.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-muted bg-sand px-2.5 py-0.5 rounded-full">
                          Dismissed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Main Info Row with Clarity Ring */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <h3 className="text-lg font-serif font-bold text-ink-dark">
                        {rule.title}
                      </h3>
                      <p className="text-xs text-ink-secondary leading-relaxed font-serif">
                        "{rule.description}"
                      </p>
                    </div>

                    {/* Clarity Ring */}
                    <div
                      className="flex items-center gap-3 p-2.5 px-4 rounded-xl bg-sand/30 border border-sand-dark/30 shrink-0"
                      title={rule.clarityFormula}
                    >
                      <div className="relative w-11 h-11 flex items-center justify-center">
                        <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-sand-dark/40"
                            strokeWidth="3.5"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className={ringColor}
                            strokeDasharray={`${rule.clarityScore}, 100`}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <span className="absolute font-mono text-xs font-bold text-ink-dark">
                          {rule.clarityScore}
                        </span>
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-ink-dark">Clarity Score</div>
                        <div className="text-[10px] text-ink-muted">Lower = more overrides</div>
                      </div>
                    </div>
                  </div>

                  {/* Evidence Strip & Sparkline */}
                  <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-surface border border-sand-dark/30 rounded-xl text-xs">
                    <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-ink-secondary">
                      <span>Triggered <strong className="text-ink-dark">{rule.triggerCount}</strong> times</span>
                      <span>•</span>
                      <span>Overridden <strong className="text-accent-terracotta">{rule.overrideCount}</strong> times ({rule.overrideRate}%)</span>
                      <span>•</span>
                      <span>{rule.reviewerCount} reviewers</span>
                    </div>

                    {/* Sparkline */}
                    <div className="flex items-center gap-1.5" title="Trigger velocity over selected period">
                      <span className="text-[10px] text-ink-muted">Triggers:</span>
                      <div className="flex items-end gap-1 h-5 w-20">
                        {rule.sparkline.map((val, sIdx) => (
                          <div
                            key={sIdx}
                            style={{ height: `${Math.max(4, val * 5)}px` }}
                            className="flex-1 bg-brand/50 rounded-xs"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* What We Noticed (Observation) */}
                  <div className="p-3.5 bg-brand/5 border border-brand/20 rounded-xl space-y-1 text-xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-brand flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Detected from override patterns · wording drafted by AI
                    </div>
                    <p className="text-ink-dark leading-relaxed">
                      {rule.observation}
                    </p>
                  </div>

                  {/* Suggested Clearer Wording Diff Block */}
                  <div className="p-3.5 bg-sand/20 rounded-xl border border-sand-dark/40 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                        Proposed Clearer Wording (v2 draft)
                      </span>
                      <span className="text-[10px] text-accent-terracotta font-medium italic">
                        Proposal, not yet active
                      </span>
                    </div>

                    <div className="font-serif leading-relaxed text-ink-dark">
                      <span>{rule.proposal.before} </span>
                      <span className="bg-evidence-supported/20 text-evidence-supported px-1 py-0.5 rounded font-medium">
                        {rule.proposal.addedText || rule.proposal.after}
                      </span>
                    </div>
                  </div>

                  {/* Example Overrides (Collapsible preview) */}
                  {rule.exampleOverrides.length > 0 && (
                    <details className="text-xs group">
                      <summary className="cursor-pointer font-medium text-ink-muted hover:text-ink-dark flex items-center gap-1 select-none">
                        <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
                        <span>View {rule.exampleOverrides.length} recorded reviewer justification{rule.exampleOverrides.length > 1 ? 's' : ''}</span>
                      </summary>
                      <div className="pt-2 pl-4 space-y-2">
                        {rule.exampleOverrides.map((ex, exIdx) => (
                          <div key={exIdx} className="p-2.5 rounded-lg border border-sand-dark/30 bg-surface text-xs space-y-0.5">
                            <p className="italic font-serif text-ink-dark">"{ex.reason}"</p>
                            <div className="text-[10px] text-ink-muted flex items-center justify-between">
                              <span>{ex.reviewerRole}</span>
                              <span>{ex.date}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  {/* Actions Bar */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-sand-dark/25">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openRuleDrawer(rule)}
                      className="gap-1.5 text-xs bg-surface border-sand-dark/50 text-ink-dark hover:bg-sand/40"
                    >
                      <Eye className="w-3.5 h-3.5 text-ink-muted" />
                      View details
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDismissRuleTarget(rule);
                          setDismissReasonInput('');
                        }}
                        className="text-xs text-ink-muted hover:text-ink-dark border-sand-dark/40"
                      >
                        Dismiss
                      </Button>

                      <div className="relative group">
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={rule.status === 'APPROVED'}
                          onClick={() => setConfirmApproveRule(rule)}
                          className={`text-xs gap-1.5 ${
                            rule.status === 'APPROVED'
                              ? 'bg-evidence-supported text-white opacity-80 cursor-default'
                              : 'bg-brand hover:bg-brand/90 text-white shadow-xs'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          {rule.status === 'APPROVED' ? 'Approved (v2 active)' : 'Approve change (v2)'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3.6 Knowledge Gaps: "Claims people keep making without evidence" */}
      <Card className="border-sand-dark/40 bg-surface shadow-xs">
        <CardHeader className="py-4 px-5 border-b border-sand-dark/30">
          <CardTitle className="text-base font-serif font-bold text-ink-dark">
            Knowledge Gaps: Claims repeatedly made without approved evidence
          </CardTitle>
          <p className="text-xs text-ink-muted">
            Unverified marketing claims appearing across submissions. Certify official specifications to support or prohibit them.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-sand-dark/25">
            {data.knowledgeGaps.map((gap) => (
              <div key={gap.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-sand/20 transition-colors">
                <div className="space-y-1">
                  <div className="font-serif italic text-sm text-ink-dark font-medium">
                    "{gap.claimText}"
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                    <span className="font-semibold text-evidence-unverified">Seen {gap.timesSeen} times</span>
                    <span>•</span>
                    <span>Channels: {gap.channels.join(', ')}</span>
                    <span>•</span>
                    <span>Last observed: {gap.lastSeen}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFactDrawerGap(gap);
                      setIsFactDrawerOpen(true);
                    }}
                    className="gap-1.5 text-xs text-brand border-brand/40 hover:bg-brand/10"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add approved fact
                  </Button>

                  <Link href={`/reviews/${gap.submissionId}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs text-ink-secondary hover:text-ink-dark border-sand-dark/40"
                    >
                      See submissions <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 3.7 Loop Activity Timeline */}
      <Card className="border-sand-dark/40 bg-surface shadow-xs">
        <CardHeader className="py-4 px-5 border-b border-sand-dark/30 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-serif font-bold text-ink-dark">
              Loop Activity Timeline
            </CardTitle>
            <p className="text-xs text-ink-muted">
              Recent governance events, rule approvals, and reviewer justifications.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAuditDrawerOpen(true)}
            className="h-7 text-xs px-2.5 gap-1 text-ink-secondary hover:text-ink-dark"
          >
            <Layers className="w-3.5 h-3.5" />
            View full audit log
          </Button>
        </CardHeader>
        <CardContent className="p-5">
          <div className="relative border-l-2 border-sand-dark/40 ml-3 space-y-4 pl-5">
            {data.timeline.slice(0, 5).map((ev) => (
              <div key={ev.id} className="relative group text-xs">
                <span className="absolute -left-[27px] top-1 w-3 h-3 rounded-full border-2 border-surface bg-brand" />
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-bold text-ink-dark">{ev.title}</span>
                  <span className="text-[10px] text-ink-muted font-mono">{ev.timestamp}</span>
                </div>
                <p className="text-ink-secondary mt-0.5">{ev.description}</p>
                {ev.link && (
                  <Link href={ev.link} className="text-brand hover:underline inline-flex items-center gap-0.5 mt-1 text-[11px] font-medium">
                    View related submission <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer Disclaimer */}
      <div className="text-center text-xs text-ink-muted pt-2 border-t border-sand-dark/30">
        Demo data: fictional NexaTech workspace • Governed by BrandVault AI
      </div>

      {/* Rule Detail Drawer (Section 5) */}
      <RuleDrawer
        rule={drawerRule}
        isOpen={isDrawerOpen}
        onClose={closeRuleDrawer}
        onApprove={(r) => {
          setConfirmApproveRule(r);
        }}
        onDismiss={(r) => {
          setDismissRuleTarget(r);
          setDismissReasonInput('');
        }}
        isAdmin={true}
      />

      {/* Add Approved Fact Drawer */}
      <AddFactDrawer
        gap={factDrawerGap}
        isOpen={isFactDrawerOpen}
        onClose={() => setIsFactDrawerOpen(false)}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Full Audit Log Drawer */}
      <AuditLogDrawer
        isOpen={isAuditDrawerOpen}
        onClose={() => setIsAuditDrawerOpen(false)}
        events={data.timeline}
      />

      {/* Confirm Approve Change Modal */}
      {confirmApproveRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-dark/40 backdrop-blur-xs p-4">
          <div className="bg-surface border border-sand-dark/50 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-base text-ink-dark flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-evidence-supported" />
                  Approve Guideline Change (v{confirmApproveRule.version + 1})
                </h3>
                <p className="text-xs text-ink-muted mt-1">
                  This creates version {confirmApproveRule.version + 1} of the rule. Past reviews keep the version they were checked against.
                </p>
              </div>
              <button onClick={() => setConfirmApproveRule(null)} className="text-ink-muted hover:text-ink-dark">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-sand/30 rounded-xl space-y-2 text-xs">
              <div className="font-semibold text-ink-dark">{confirmApproveRule.rule_code}: {confirmApproveRule.title}</div>
              <div className="space-y-1 font-serif text-ink-secondary">
                <div className="line-through text-evidence-contradicted">{confirmApproveRule.proposal.before}</div>
                <div className="text-evidence-supported font-medium">{confirmApproveRule.proposal.after}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmApproveRule(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={actionLoading}
                onClick={handleApproveConfirm}
                className="bg-brand text-white"
              >
                {actionLoading ? 'Updating guideline...' : 'Confirm & Publish v2'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dismiss Proposal Modal */}
      {dismissRuleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-dark/40 backdrop-blur-xs p-4">
          <div className="bg-surface border border-sand-dark/50 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-base text-ink-dark">
                  Dismiss Clarification Proposal
                </h3>
                <p className="text-xs text-ink-muted mt-1">
                  Document why this suggested guideline change will not be adopted.
                </p>
              </div>
              <button onClick={() => setDismissRuleTarget(null)} className="text-ink-muted hover:text-ink-dark">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-dark">Dismissal Reason *</label>
              <textarea
                required
                rows={3}
                value={dismissReasonInput}
                onChange={(e) => setDismissReasonInput(e.target.value)}
                placeholder="e.g. Existing rule is sufficiently clear; current exceptions are rare..."
                className="w-full text-xs p-3 rounded-xl border border-sand-dark/60 bg-cream/30 focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDismissRuleTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={actionLoading || !dismissReasonInput.trim()}
                onClick={handleDismissConfirm}
                className="bg-accent-terracotta text-white"
              >
                {actionLoading ? 'Dismissing...' : 'Confirm Dismissal'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast with 10-Second Undo */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink-dark text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 text-xs animate-in slide-in-from-bottom duration-200 border border-sand-dark/30">
          <div className="flex items-center gap-2">
            <CheckCheck className="w-4 h-4 text-evidence-supported" />
            <span>{toastMessage.text}</span>
          </div>

          {toastMessage.undoId && (
            <button
              type="button"
              onClick={() => handleUndo(toastMessage.undoId!)}
              className="px-2.5 py-1 rounded-lg bg-surface/20 hover:bg-surface/30 text-white font-semibold flex items-center gap-1 transition-all"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo ({undoCountdown}s)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-white/60 hover:text-white ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
