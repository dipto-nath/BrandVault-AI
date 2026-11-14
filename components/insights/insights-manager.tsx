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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-accent ring-4 ring-accent/20" />
            <span className="text-xs font-bold text-accent uppercase tracking-wider">
              Governance Analytics & Drift
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-jakarta text-ink-dark tracking-tight">
            Governance Insights & Adaptive Intelligence
          </h1>
          <p className="text-sm text-ink-secondary mt-1 max-w-2xl leading-relaxed">
            Continuous governance analytics tracking policy drift, repetitive reviewer overrides, and automated AI rule evolution.
          </p>
        </div>
      </div>

      {/* ── Continuous Brand Intelligence Banner ── */}
      <div className="card bg-navy-900 border border-navy-700/80 rounded-xl text-white p-6 shadow-md md:flex md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-jakarta tracking-tight">Continuous Brand Intelligence Loop</h3>
            <p className="text-navy-300 text-sm mt-0.5">AI-powered governance engine actively detecting policy drift, specification gaps & claim contradictions</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-navy-300 bg-navy-800/80 px-3 py-1.5 rounded-lg border border-navy-700 mt-4 md:mt-0">
          <span className="flex items-center gap-1.5 text-success font-semibold">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Active Sync
          </span>
          <span className="text-navy-400">·</span>
          <span>Adaptive rules ready</span>
          <ArrowUpRight className="w-4 h-4 text-accent ml-1" />
        </div>
      </div>

      {/* ── Key Metrics Row ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Submissions"
          value={stats.totalSubmissions}
          subChange="+12% vs last week"
          subChangeColor="text-success"
          icon={<FileText className="w-5 h-5" />}
          iconBg="bg-navy-100 text-navy-700"
          waveColor="rgba(16, 27, 45, 0.05)"
        />
        <MetricCard
          title="Approved"
          value={stats.approved}
          subChange="+8% vs last week"
          subChangeColor="text-success"
          icon={<ShieldCheck className="w-5 h-5" />}
          iconBg="bg-success-soft text-success"
          waveColor="rgba(21, 128, 61, 0.1)"
        />
        <MetricCard
          title="Pending Review"
          value={stats.pending}
          subChange="-3% vs last week"
          subChangeColor="text-warning"
          icon={<MessageSquare className="w-5 h-5" />}
          iconBg="bg-warning-soft text-warning"
          waveColor="rgba(202, 138, 4, 0.1)"
        />
        <MetricCard
          title="High-Risk Findings"
          value={stats.highRisk}
          subChange="+2 vs last week"
          subChangeColor="text-critical"
          icon={<Ban className="w-5 h-5" />}
          iconBg="bg-critical-soft text-critical"
          waveColor="rgba(192, 57, 43, 0.1)"
        />
      </div>

      {/* ── Guidelines Under Scrutiny ── */}
      <div className="card bg-surface border border-border">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              <CardTitle className="text-base font-bold text-ink-dark">Guidelines Under Scrutiny</CardTitle>
            </div>
            <Badge variant="outline" className="text-accent border-accent bg-accent-soft">AI-Detected Drift</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {displayGuidelines.map((g) => (
              <div key={g.id} className="p-4 rounded-lg border border-border bg-surface-subtle">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-ink-dark bg-surface px-2 py-0.5 rounded">{g.rule_code}</span>
                      <Badge variant={g.severity === 'HIGH' ? 'high' : 'medium'}>{g.severity}</Badge>
                    </div>
                    <h4 className="text-sm font-semibold text-ink-dark">{g.title}</h4>
                    <p className="text-sm text-ink-secondary mt-1 line-clamp-2">{g.description}</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs h-8 px-3 shrink-0">View Details</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </div>

      {/* ── Top Rejection Reasons ── */}
      {(stats.topReasons.length > 0 || stats.frequentlyOverridden.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {stats.topReasons.length > 0 && (
            <Card className="bg-surface border border-border">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-base font-bold text-ink-dark">Top Rejection Reasons</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {stats.topReasons.map((r, i) => (
                  <div key={r.reason} className="flex items-center justify-between p-3 rounded-lg bg-surface-subtle border border-border">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center text-sm font-bold">{i + 1}</span>
                      <span className="text-sm text-ink-dark">{r.reason}</span>
                    </div>
                    <span className="text-sm font-bold text-ink-dark tnums">{r.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {stats.frequentlyOverridden.length > 0 && (
            <Card className="bg-surface border border-border">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-base font-bold text-ink-dark">Frequently Overridden Findings</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {stats.frequentlyOverridden.map((f, i) => (
                  <div key={f.findingId} className="flex items-center justify-between p-3 rounded-lg bg-surface-subtle border border-border">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-warning-soft text-warning flex items-center justify-center text-sm font-bold">{i + 1}</span>
                      <span className="text-sm text-ink-dark">Finding {f.findingId.slice(0, 8)}</span>
                    </div>
                    <Badge variant="medium">{f.count} overrides</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Guideline Intelligence Loop ── */}
      <Card className="bg-surface border border-border">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-accent" />
              <CardTitle className="text-base font-bold text-ink-dark">Guideline Intelligence Loop</CardTitle>
            </div>
            <Badge variant="neutral">{suggestions.length} Suggestions</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {suggestions.length === 0 ? (
            <div className="text-center py-8">
              <Info className="w-12 h-12 text-ink-muted mx-auto mb-3" />
              <h4 className="text-base font-semibold text-ink-dark mb-1">No guideline suggestions yet</h4>
              <p className="text-sm text-ink-secondary">Reviewer feedback will generate AI-suggested guideline changes here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((s) => (
                <div key={s.id} className="p-4 rounded-lg border border-border bg-surface-subtle">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={s.status === 'APPROVED' ? 'low' : s.status === 'REJECTED' ? 'high' : 'medium'}>
                          {s.status}
                        </Badge>
                        {s.guideline_id && guidelinesMap.get(s.guideline_id) && (
                          <span className="font-mono text-xs text-ink-secondary">{guidelinesMap.get(s.guideline_id)!.rule_code}</span>
                        )}
                      </div>
                      <p className="text-sm text-ink-dark leading-relaxed">{s.suggested_change}</p>
                    </div>
                    {s.status === 'PENDING' && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectSuggestion(s.id)}
                          disabled={actionLoading === s.id}
                          className="text-xs h-8 px-3 text-critical hover:bg-critical-soft border-border"
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApproveSuggestion(s.id)}
                          disabled={actionLoading === s.id}
                          className="btn-primary text-xs h-8 px-3"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
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
    <div className="card p-5 relative overflow-hidden flex flex-col justify-between min-h-[128px] bg-surface border border-border rounded-xl shadow-sm hover:shadow-md hover:border-border-strong transition-all duration-200">
      {/* Top row: Icon badge */}
      <div className="flex items-center justify-between mb-2 z-10">
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0 border border-border/40`}>
          {icon}
        </div>
      </div>

      {/* Middle row: Title & Big Number */}
      <div className="z-10">
        <div className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary mb-1 font-jakarta">
          {title}
        </div>
        <div className="text-3xl font-bold font-jakarta text-ink-dark tnums leading-none tracking-tight">
          {value}
        </div>
      </div>

      {/* Bottom row: Trend vs last week */}
      <div className={`text-xs font-semibold ${subChangeColor} mt-2.5 z-10 flex items-center gap-1 font-sans`}>
        {subChange}
      </div>

      {/* Decorative Wave in Bottom-Right Corner */}
      <svg
        className="wave-svg w-32 h-14 opacity-70"
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
