'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3, ShieldCheck, AlertTriangle, CheckCircle2, XCircle,
  HelpCircle, MessageSquare, Sparkles, Check, X, ArrowUpRight, Shield
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="card p-6 bg-surface border border-border">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-xs font-semibold text-accent uppercase tracking-wider">
            Continuous Brand Intelligence
          </span>
        </div>
        <h2 className="text-xl font-bold text-ink-dark">
          Guideline Intelligence Loop & Governance Insights
        </h2>
        <p className="text-xs text-ink-secondary mt-0.5 max-w-2xl leading-relaxed">
          Aggregates reviewer overrides, finding feedback, and ambiguous rules to suggest policy refinements. Official changes strictly require human administrator approval.
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Submissions Evaluated"
          value={stats.totalSubmissions}
          sub="Total content runs"
        />
        <StatCard
          title="Verified Approved"
          value={stats.approved}
          sub="Compliant with evidence"
          textColor="text-success"
        />
        <StatCard
          title="Contradicted / Rejected"
          value={stats.rejected}
          sub="Blocked from publishing"
          textColor="text-critical"
        />
        <StatCard
          title="Reviewer Feedback Events"
          value={stats.totalFeedback}
          sub="Intelligence loop signals"
          textColor="text-accent"
        />
      </div>

      {/* Main Two Column Insights Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Top Reviewer Feedback Reasons */}
        <Card className="bg-surface border border-border">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-bold text-ink-dark flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-accent" />
              <span>Reviewer Feedback Breakdown</span>
            </CardTitle>
            <p className="text-xs text-ink-secondary">
              Why human reviewers override or question automated AI findings
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            {stats.topReasons.length === 0 ? (
              <div className="p-4 rounded-lg bg-surface-subtle text-center text-xs text-ink-secondary">
                No feedback reasons recorded yet. As reviewers inspect findings, patterns will appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {stats.topReasons.map((r, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-ink-dark truncate max-w-[80%]">
                        {r.reason}
                      </span>
                      <span className="font-bold text-ink-dark tnums">{r.count}</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-subtle rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full"
                        style={{
                          width: `${Math.min(100, (r.count / Math.max(1, stats.totalFeedback)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Frequently Flagged Guidelines */}
        <Card className="bg-surface border border-border">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-bold text-ink-dark flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              <span>Guidelines Under Scrutiny</span>
            </CardTitle>
            <p className="text-xs text-ink-secondary">
              Rules generating the highest friction or ambiguity in reviews
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {guidelines.slice(0, 3).map((g) => (
                <div
                  key={g.id}
                  className="p-3.5 rounded-lg border border-border bg-surface-subtle text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-ink-dark">{g.rule_code}</span>
                    <Badge variant={g.severity === 'HIGH' ? 'high' : 'medium'}>
                      {g.severity}
                    </Badge>
                  </div>
                  <div className="font-semibold text-ink-dark text-sm mb-1">{g.title}</div>
                  <p className="text-ink-secondary leading-relaxed line-clamp-2">
                    {g.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suggested Guideline Clarifications (Loop Recommendations) */}
      <Card className="bg-surface border border-border">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-ink-dark flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <span>Proposed Guideline Clarifications ({suggestions.length})</span>
              </CardTitle>
              <p className="text-xs text-ink-secondary">
                Governance recommendations derived from repeated reviewer overrides and feedback.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-ink-secondary uppercase tracking-wider bg-surface-subtle px-2 py-0.5 rounded">
              Requires Admin Sign-off
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {suggestions.length === 0 ? (
            <div className="text-center py-8 text-xs text-ink-secondary">
              No pending guideline suggestions. The system generates proposals when sufficient feedback accumulates.
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((s) => {
                const targetGuideline = guidelinesMap.get(s.guideline_id);
                return (
                  <div
                    key={s.id}
                    className="p-4 rounded-lg border border-border bg-surface text-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink-dark text-sm">
                          {s.title}
                        </span>
                        <Badge variant={s.status === 'APPROVED' ? 'low' : s.status === 'REJECTED' ? 'high' : 'medium'}>
                          {s.status}
                        </Badge>
                      </div>
                      <span className="text-ink-secondary font-mono">
                        {formatDateTime(s.created_at)}
                      </span>
                    </div>

                    {targetGuideline && (
                      <div className="p-2.5 rounded bg-surface-subtle border border-border/60 text-ink-secondary">
                        <span className="font-semibold text-ink-dark">Target Policy: </span>
                        <span className="font-mono font-semibold">{targetGuideline.rule_code}</span> — {targetGuideline.title}
                      </div>
                    )}

                    <div>
                      <span className="font-semibold text-ink-secondary uppercase text-[10px] tracking-wider block mb-1">
                        Proposed Policy Clarification
                      </span>
                      <p className="text-ink-dark leading-relaxed font-sans text-sm p-3 rounded bg-accent-soft/20 border border-accent/20">
                        {s.suggested_change}
                      </p>
                    </div>

                    {s.status === 'PENDING' && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectSuggestion(s.id)}
                          disabled={actionLoading === s.id}
                          className="text-xs h-7 px-3 text-critical hover:bg-critical-soft"
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
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
  textColor,
}: {
  title: string;
  value: number;
  sub: string;
  textColor?: string;
}) {
  return (
    <Card className="p-4 bg-surface border border-border">
      <div className="text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-1">
        {title}
      </div>
      <div className={`text-2xl font-bold tnums ${textColor || 'text-ink-dark'}`}>
        {value}
      </div>
      <div className="text-[11px] text-ink-secondary mt-0.5">
        {sub}
      </div>
    </Card>
  );
}
