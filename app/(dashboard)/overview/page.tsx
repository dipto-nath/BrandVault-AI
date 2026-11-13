import { storage } from '@/lib/db/adaptor';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText, Clock, ShieldAlert, CheckCircle2, XCircle, AlertTriangle,
  ArrowRight, Shield, Database, Sparkles, BookOpen
} from 'lucide-react';
import Link from 'next/link';
import { formatRelative, getStatusLabel } from '@/lib/utils';

export default async function OverviewPage() {
  const ws = await storage.getDemoWorkspace();
  const workspaceId = ws?.id;

  const [data, guidelines, facts, allFindings] = await Promise.all([
    workspaceId
      ? storage.dashboardStats(workspaceId)
      : Promise.resolve({ total: 0, pending: 0, approved: 0, rejected: 0, highRisk: 0, recent: [] }),
    workspaceId ? storage.listGuidelines(workspaceId, { active: true }) : Promise.resolve([]),
    workspaceId ? storage.listFacts(workspaceId, { active: true }) : Promise.resolve([]),
    workspaceId ? storage.listFindings('') : Promise.resolve([]),
  ]);

  // Compute frequently flagged rules
  const ruleCounts = new Map<string, number>();
  for (const f of allFindings) {
    if (f.rule_id) {
      ruleCounts.set(f.rule_id, (ruleCounts.get(f.rule_id) ?? 0) + 1);
    }
  }

  const topFlaggedRules = [...ruleCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([ruleId, count]) => {
      const g = guidelines.find((item) => item.id === ruleId || item.rule_code === ruleId);
      return {
        ruleId,
        code: g?.rule_code ?? 'RULE',
        title: g?.title ?? 'Specification policy check',
        category: g?.category ?? 'CLAIMS',
        severity: g?.severity ?? 'HIGH',
        count,
      };
    });

  // Recent findings
  const recentFindings = [...allFindings]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Workspace Banner */}
      <div className="card p-6 border border-border bg-surface flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">
              Authoritative Demo Environment
            </span>
          </div>
          <h2 className="text-xl font-bold text-ink-dark">
            NexaTech Brand Governance Workspace
          </h2>
          <p className="text-sm text-ink-secondary mt-0.5">
            Real-time evidence verification across marketing copy, product specs, and public statements.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/reviews/new">
            <Button className="btn-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Submit Content for Review</span>
            </Button>
          </Link>
          <Link href="/passports">
            <Button variant="outline" size="sm">
              View Passports
            </Button>
          </Link>
        </div>
      </div>

      {/* Top Level Metric Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Submissions"
          value={data.total}
          icon={<FileText className="w-4 h-4" />}
          description="Audited artifacts"
        />
        <StatCard
          title="Pending Review"
          value={data.pending}
          icon={<Clock className="w-4 h-4 text-warning" />}
          description="Awaiting sign-off"
          badgeColor="text-warning"
        />
        <StatCard
          title="Approved"
          value={data.approved}
          icon={<CheckCircle2 className="w-4 h-4 text-success" />}
          description="Verified compliant"
          badgeColor="text-success"
        />
        <StatCard
          title="Rejected"
          value={data.rejected}
          icon={<XCircle className="w-4 h-4 text-critical" />}
          description="Contradicted / unsafe"
          badgeColor="text-critical"
        />
        <StatCard
          title="High Risk"
          value={data.highRisk}
          icon={<AlertTriangle className="w-4 h-4 text-critical" />}
          description="Urgent brand risk"
          badgeColor="text-critical"
        />
      </div>

      {/* Main Two-Column Operational Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Recent Activity & Recent Findings (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Submissions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold text-ink-dark">
                  Recent Content Submissions
                </CardTitle>
                <p className="text-xs text-ink-secondary">
                  Latest content evaluated against official brand knowledge
                </p>
              </div>
              <Link href="/reviews" className="text-xs text-accent hover:underline flex items-center gap-1 font-medium">
                View all reviews <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {data.recent.length === 0 ? (
                <div className="text-center py-8 text-ink-secondary text-sm">
                  No submissions yet. Submit your first piece of content to start governance.
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {data.recent.map((s: any) => (
                    <div
                      key={s.id}
                      className="py-3 flex items-center justify-between gap-4 hover:bg-surface-subtle/40 px-2 rounded-md transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/reviews/${s.id}`}
                          className="text-sm font-semibold text-ink-dark hover:text-accent hover:underline truncate block"
                        >
                          {s.title}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-ink-secondary mt-0.5">
                          <span className="font-medium text-ink-secondary">{s.content_type}</span>
                          <span>•</span>
                          <span>{s.channel}</span>
                          <span>•</span>
                          <span>{formatRelative(s.updated_at || s.created_at)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={statusToVariant(s.status)}>
                          {getStatusLabel(s.status)}
                        </Badge>
                        <Badge variant={s.risk_level === 'HIGH' ? 'high' : s.risk_level === 'MEDIUM' ? 'medium' : 'low'}>
                          {s.risk_level || 'LOW'}
                        </Badge>
                        <Link href={`/reviews/${s.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                            Review
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Brand Findings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold text-ink-dark">
                  Recent Policy & Factual Findings
                </CardTitle>
                <p className="text-xs text-ink-secondary">
                  Detected contradictions, unverified claims and tone issues
                </p>
              </div>
            </CardHeader>
            <CardContent>
              {recentFindings.length === 0 ? (
                <div className="text-center py-8 text-ink-secondary text-sm">
                  No findings recorded. All content complies with approved knowledge.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentFindings.map((f: any) => (
                    <div
                      key={f.id}
                      className="p-3.5 rounded-lg border border-border bg-surface text-sm"
                    >
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="font-semibold text-ink-dark">{f.title}</div>
                        <Badge variant={f.severity === 'HIGH' ? 'high' : f.severity === 'MEDIUM' ? 'medium' : 'low'}>
                          {f.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-ink-secondary leading-relaxed mb-2">
                        {f.explanation}
                      </p>
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-border/50">
                        <span className="font-mono text-ink-secondary bg-surface-subtle px-1.5 py-0.5 rounded">
                          &ldquo;{f.excerpt}&rdquo;
                        </span>
                        <Link
                          href={`/reviews/${f.submission_id}/findings/${f.id}`}
                          className="text-accent hover:underline font-medium flex items-center gap-1"
                        >
                          Inspect evidence <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Governance Engine & Frequently Flagged Rules (1 Col) */}
        <div className="space-y-6">
          {/* Knowledge & Guidelines Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-ink-dark">
                Authoritative Knowledge Layer
              </CardTitle>
              <p className="text-xs text-ink-secondary">
                Verified brand ground truth used for factual verification
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-subtle/50">
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-accent" />
                  <div>
                    <div className="text-sm font-semibold text-ink-dark">Approved Facts</div>
                    <div className="text-xs text-ink-secondary">Specifications, launch dates, materials</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold tnums text-ink-dark">{facts.length}</span>
                  <div className="text-[10px] uppercase font-semibold text-success">Active</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-subtle/50">
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-accent" />
                  <div>
                    <div className="text-sm font-semibold text-ink-dark">Brand Guidelines</div>
                    <div className="text-xs text-ink-secondary">Tone, terminology, superlatives</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold tnums text-ink-dark">{guidelines.length}</span>
                  <div className="text-[10px] uppercase font-semibold text-success">Active</div>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <Link href="/knowledge" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Manage Facts
                  </Button>
                </Link>
                <Link href="/guidelines" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Manage Rules
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Frequently Flagged Rules */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-ink-dark">
                Frequently Flagged Guidelines
              </CardTitle>
              <p className="text-xs text-ink-secondary">
                Rules triggered most often in content reviews
              </p>
            </CardHeader>
            <CardContent>
              {topFlaggedRules.length === 0 ? (
                <div className="text-center py-6 text-xs text-ink-secondary">
                  No guideline violations recorded yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {topFlaggedRules.map((rule) => (
                    <div
                      key={rule.ruleId}
                      className="p-3 rounded-lg border border-border bg-surface flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[11px] font-bold text-ink-dark bg-surface-subtle px-1.5 py-0.5 rounded">
                            {rule.code}
                          </span>
                          <span className="text-xs text-ink-secondary font-medium">{rule.category}</span>
                        </div>
                        <div className="text-xs font-medium text-ink-dark leading-tight line-clamp-1">
                          {rule.title}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-critical tnums">{rule.count}</span>
                        <div className="text-[10px] text-ink-secondary">flags</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Verification Protocol Notice */}
          <Card className="border-accent/30 bg-accent-soft/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Shield className="w-4 h-4 text-accent" />
                <h4 className="text-xs font-bold text-accent uppercase tracking-wider">
                  Auditable Governance Guarantee
                </h4>
              </div>
              <p className="text-xs text-ink leading-relaxed">
                BrandVault AI enforces traceable evidence: missing evidence is marked <span className="font-semibold text-warning">UNVERIFIED</span>, never assumed false. The AI suggests corrections, but only authorized human reviewers can approve content.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  description,
  badgeColor,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description: string;
  badgeColor?: string;
}) {
  return (
    <div className="card p-5 relative overflow-hidden flex flex-col justify-between min-h-[120px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">
          {title}
        </span>
        <div className="w-8 h-8 rounded-lg bg-surface-subtle flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>
      <div>
        <div className={`text-2xl sm:text-3xl font-bold font-sans tnums leading-tight ${badgeColor || 'text-ink-dark'}`}>
          {value}
        </div>
        <div className="text-[11px] text-ink-secondary truncate mt-1">
          {description}
        </div>
      </div>
    </div>
  );
}

function statusToVariant(status: string): 'low' | 'medium' | 'high' | 'neutral' {
  switch (status) {
    case 'APPROVED':
      return 'low';
    case 'REJECTED':
      return 'high';
    case 'NEEDS_REVIEW':
    case 'CHANGES_REQUESTED':
      return 'medium';
    default:
      return 'neutral';
  }
}
