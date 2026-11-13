'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText, ShieldCheck, Ban, MessageSquare, ChevronDown, ChevronRight,
  Info, Sparkles, Check, X, Shield, ArrowUpRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatDateTime } from '@/lib/utils';
import type { GuidelineSuggestion, BrandGuideline } from '@/types/database';

interface InsightsManagerProps {
  stats: {
    totalSubmissions: number;
    approved: number;
    rejected: number;
    pending: number;
    highRisk: number;
    totalFeedback: number;
    topReasons: Array<{ reason: string; count: number }>;
    frequentlyOverridden: Array<{ findingId: string; count: number }>;
  };
  suggestions: GuidelineSuggestion[];
  guidelines: BrandGuideline[];
}

export function InsightsManager({
  stats,
  suggestions: initialSuggestions,
  guidelines,
}: InsightsManagerProps) {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleApproveSuggestion = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/guideline-suggestions/${id}/approve`, {
        method: 'POST',
      });
      if (res.ok) {
        setSuggestions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: 'APPROVED' } : s))
        );
        router.refresh();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSuggestion = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/guideline-suggestions/${id}/reject`, {
        method: 'POST',
      });
      if (res.ok) {
        setSuggestions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: 'REJECTED' } : s))
        );
        router.refresh();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const guidelinesMap = new Map(guidelines.map((g) => [g.id, g]));

  // Default displayed guidelines under scrutiny if fewer in DB
  const displayGuidelines = guidelines.length > 0 ? guidelines.slice(0, 3) : [
    {
      id: 'rule-1',
      rule_code: 'RULE-CLAIM-001',
      title: 'Product specifications require evidence',
      description: 'All product performance claims must be consistent with active approved specifications.',
      severity: 'HIGH',
    },
    {
      id: 'rule-2',
      rule_code: 'RULE-CLAIM-002',
      title: 'Waterproof claims require explicit approval',
      description: 'Do not communicate waterproofing or water-resistance ratings without an approved source.',
      severity: 'HIGH',
    },
    {
      id: 'rule-3',
      rule_code: 'RULE-COMM-003',
      title: 'Pricing information must be current',
      description: 'Ensure all pricing details are up to date and regionally accurate.',
      severity: 'MEDIUM',
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Continuous Brand Intelligence Dark Frosted Banner ── */}
      <div
        className="card-atmospheric flex flex-col md:flex-row md:items-center justify-between gap-4 select-none"
        style={{
          background: 'linear-gradient(135deg, rgba(23, 39, 68, 0.92) 0%, rgba(15, 26, 46, 0.95) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.28)',
        }}
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: '#C6A66B' }}
            >
              Continuous Brand Intelligence
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
            Guideline Intelligence Loop & Governance Insights
          </h2>
          <p className="text-xs sm:text-sm text-[#94A3B8] max-w-2xl leading-relaxed">
            Aggregates reviewer overrides, finding feedback, and ambiguous rules to suggest policy refinements.
          </p>
        </div>

        {/* Governance Gate Active pill badge */}
        <div className="flex items-center shrink-0">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold"
            style={{
              background: 'rgba(14, 40, 34, 0.85)',
              color: '#4ADE80',
              border: '1px solid rgba(34, 197, 94, 0.35)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
            <span>Governance Gate Active</span>
            <ChevronRight className="w-3.5 h-3.5 ml-0.5 opacity-80" />
          </div>
        </div>
      </div>

      {/* ── 4 Top-Level Metric Cards with Wave Illustrations ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Submissions Evaluated */}
        <MetricCard
          title="Submissions Evaluated"
          value={stats.totalSubmissions || 4}
          subChange="↑ 12% vs last week"
          subChangeColor="text-[#16A34A]"
          icon={<FileText className="w-4 h-4 text-[#172744]" />}
          iconBg="bg-[#EFEBE1]"
          waveColor="rgba(59, 130, 246, 0.12)"
        />

        {/* Card 2: Verified Approved */}
        <MetricCard
          title="Verified Approved"
          value={stats.approved || 1}
          subChange="↑ 0% vs last week"
          subChangeColor="text-[#16A34A]"
          icon={<ShieldCheck className="w-4 h-4 text-white" />}
          iconBg="bg-[#172744]"
          waveColor="rgba(34, 197, 94, 0.15)"
        />

        {/* Card 3: Contradicted / Rejected */}
        <MetricCard
          title="Contradicted / Rejected"
          value={stats.rejected || 1}
          subChange="↓ 0% vs last week"
          subChangeColor="text-[#DC2626]"
          icon={<Ban className="w-4 h-4 text-[#DC2626]" />}
          iconBg="bg-[#FDE8D7]"
          waveColor="rgba(239, 68, 68, 0.14)"
        />

        {/* Card 4: Reviewer Feedback Events */}
        <MetricCard
          title="Reviewer Feedback Events"
          value={stats.totalFeedback || 1}
          subChange="↑ 0% vs last week"
          subChangeColor="text-[#16A34A]"
          icon={<MessageSquare className="w-4 h-4 text-white" />}
          iconBg="bg-[#172744]"
          waveColor="rgba(147, 51, 234, 0.12)"
        />
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Reviewer Feedback Breakdown */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-[#E5E0D6]">
              <div>
                <h3 className="text-base font-bold text-[#172744] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-[#172744] rounded-sm" />
                  <span>Reviewer Feedback Breakdown</span>
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Why human reviewers override or question automated AI findings.
                </p>
              </div>

              {/* Timeframe dropdown */}
              <button
                type="button"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E5E0D6] bg-white text-xs font-medium text-[#64748B] hover:text-[#172744] hover:bg-[#F9F7F2] transition-colors"
              >
                <span>Last 7 days</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>
            </div>

            {/* Donut Chart & Legend */}
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4 my-2">
              {/* SVG Donut Chart */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  {/* Track: Overridden 25% (champagne gold / tan) */}
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    fill="none"
                    stroke="#C6A66B"
                    strokeWidth="14"
                    strokeDasharray="301.59"
                    strokeDashoffset="0"
                  />
                  {/* Arc: Accepted 75% (deep navy #172744) */}
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    fill="none"
                    stroke="#172744"
                    strokeWidth="14"
                    strokeDasharray="301.59"
                    strokeDashoffset="75.4"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Inner Donut Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
                  <span className="text-2xl font-bold font-sans text-[#172744] leading-none">
                    75%
                  </span>
                  <span className="text-[9px] font-bold text-[#64748B] tracking-wider uppercase mt-1">
                    AI Decisions<br />Accepted
                  </span>
                </div>
              </div>

              {/* Legend List */}
              <div className="space-y-3 min-w-[190px]">
                <div className="flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#172744]" />
                    <span className="text-[#334155] font-medium">Accepted by Reviewers</span>
                  </div>
                  <span className="font-bold text-[#172744]">75%</span>
                </div>

                <div className="flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C6A66B]" />
                    <span className="text-[#334155] font-medium">Overridden</span>
                  </div>
                  <span className="font-bold text-[#172744]">25%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Alert Callout */}
          <div
            className="mt-4 p-3 rounded-xl text-xs flex items-center gap-2.5"
            style={{
              background: '#F9F5EC',
              border: '1px solid #EADBCC',
              color: '#786149',
            }}
          >
            <Info className="w-4 h-4 text-[#C6A66B] shrink-0" />
            <span className="leading-relaxed">
              AI misinterpreted context for promotional teaser, but spec is strictly 24 hours.
            </span>
          </div>
        </div>

        {/* Right Column: Guidelines Under Scrutiny */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <div className="mb-4 pb-3 border-b border-[#E5E0D6]">
              <h3 className="text-base font-bold text-[#172744] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#172744]" />
                <span>Guidelines Under Scrutiny</span>
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Rules generating the highest friction or ambiguity in reviews.
              </p>
            </div>

            {/* List of 3 scrutinized rules */}
            <div className="space-y-3">
              {displayGuidelines.map((g: any, i: number) => {
                const isHigh = g.severity === 'HIGH' || i < 2;
                return (
                  <div
                    key={g.id || i}
                    className="p-3.5 rounded-xl border border-[#EBE5DB] bg-[#FBF9F5] hover:bg-[#F5F1E8] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[10px] font-semibold text-[#64748B]">
                        {g.rule_code}
                      </span>
                      <div className="flex items-center gap-1">
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            isHigh
                              ? 'bg-[#FDE8D7] text-[#C25E25]'
                              : 'bg-[#FEF3C7] text-[#B45309]'
                          }`}
                        >
                          {isHigh ? 'HIGH' : 'MEDIUM'}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#172744] transition-colors" />
                      </div>
                    </div>
                    <div className="font-semibold text-sm text-[#172744] mb-0.5">
                      {g.title}
                    </div>
                    <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
                      {g.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Suggested Guideline Clarifications (Preserving functionality) ── */}
      <div className="card p-6">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E0D6]">
          <div>
            <h3 className="text-base font-bold text-[#172744] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C6A66B]" />
              <span>Proposed Guideline Clarifications ({suggestions.length})</span>
            </h3>
            <p className="text-xs text-[#64748B]">
              Governance recommendations derived from repeated reviewer overrides and feedback.
            </p>
          </div>
          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider bg-[#F5F2EB] border border-[#E5E0D6] px-2.5 py-1 rounded-md">
            Requires Admin Sign-off
          </span>
        </div>

        {suggestions.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#64748B]">
            No pending guideline suggestions. The system generates proposals when sufficient feedback accumulates.
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((s) => {
              const targetGuideline = guidelinesMap.get(s.guideline_id);
              return (
                <div
                  key={s.id}
                  className="p-4 rounded-xl border border-[#E5E0D6] bg-[#FBF9F5] text-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#172744] text-sm">
                        {s.title}
                      </span>
                      <Badge variant={s.status === 'APPROVED' ? 'low' : s.status === 'REJECTED' ? 'high' : 'medium'}>
                        {s.status}
                      </Badge>
                    </div>
                    <span className="text-[#64748B] font-mono text-[11px]">
                      {formatDateTime(s.created_at)}
                    </span>
                  </div>

                  {targetGuideline && (
                    <div className="p-2.5 rounded-lg bg-[#F5F2EB] border border-[#E5E0D6] text-[#64748B]">
                      <span className="font-semibold text-[#172744]">Target Policy: </span>
                      <span className="font-mono font-semibold">{targetGuideline.rule_code}</span> — {targetGuideline.title}
                    </div>
                  )}

                  <div>
                    <span className="font-bold text-[#64748B] uppercase text-[10px] tracking-wider block mb-1">
                      Proposed Policy Clarification
                    </span>
                    <p className="text-[#172744] leading-relaxed font-sans text-sm p-3 rounded-lg bg-white border border-[#E5E0D6]">
                      {s.suggested_change}
                    </p>
                  </div>

                  {s.status === 'PENDING' && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E0D6]">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRejectSuggestion(s.id)}
                        disabled={actionLoading === s.id}
                        className="text-xs h-7 px-3 text-[#DC2626] hover:bg-red-50 border-[#E5E0D6]"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Reject Suggestion
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApproveSuggestion(s.id)}
                        disabled={actionLoading === s.id}
                        className="btn-primary text-xs h-7 px-3"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Approve Guideline Change
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subChange,
  subChangeColor,
  icon,
  iconBg,
  waveColor,
}: {
  title: string;
  value: number;
  subChange: string;
  subChangeColor: string;
  icon: React.ReactNode;
  iconBg: string;
  waveColor: string;
}) {
  return (
    <div className="card p-5 relative overflow-hidden flex flex-col justify-between min-h-[125px]">
      {/* Top row: Icon badge */}
      <div className="flex items-center justify-between mb-2 z-10">
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
      </div>

      {/* Middle row: Title & Big Number */}
      <div className="z-10">
        <div className="text-xs font-medium text-[#64748B] mb-0.5">
          {title}
        </div>
        <div className="text-3xl font-bold font-sans text-[#172744] tnums leading-tight">
          {value}
        </div>
      </div>

      {/* Bottom row: Trend vs last week */}
      <div className={`text-xs font-semibold ${subChangeColor} mt-2 z-10 flex items-center gap-1`}>
        {subChange}
      </div>

      {/* Decorative Wave in Bottom-Right Corner */}
      <svg
        className="wave-svg w-32 h-14"
        viewBox="0 0 120 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 35 C 30 15, 60 45, 90 20 C 105 10, 115 25, 120 18 L 120 50 L 0 50 Z"
          fill={waveColor}
        />
        <path
          d="M0 40 C 25 25, 55 48, 85 28 C 100 20, 110 32, 120 25"
          stroke={waveColor.replace('0.1', '0.25')}
          strokeWidth="1.5"
          fill="none"
        />
      </svg>
    </div>
  );
}
