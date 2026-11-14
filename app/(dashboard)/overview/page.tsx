import { storage } from '@/lib/db/adaptor';
import { Card, CardContent } from '@/components/ui/card';
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

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">
              Production Workspace
            </span>
          </div>
          <h2 className="text-xl font-bold text-ink-dark">
            NexaTech Brand Governance
          </h2>
          <p className="text-sm text-ink-secondary mt-0.5">
            Real-time evidence verification across marketing copy, product specs, and public statements.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/reviews/new">
            <Button className="btn-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Submit for Review</span>
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Total Submissions"
          value={data.total}
          icon={<FileText className="w-5 h-5" />}
          iconBg="bg-navy-100 text-navy-700"
          description="All-time content submissions"
        />
        <MetricCard
          title="Pending Review"
          value={data.pending}
          icon={<Clock className="w-5 h-5" />}
          iconBg="bg-warning-soft text-warning"
          description="Awaiting human decision"
        />
        <MetricCard
          title="Approved"
          value={data.approved}
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBg="bg-success-soft text-success"
          description="Signed off for publishing"
        />
        <MetricCard
          title="Rejected"
          value={data.rejected}
          icon={<XCircle className="w-5 h-5" />}
          iconBg="bg-critical-soft text-critical"
          description="Failed verification"
        />
        <MetricCard
          title="High-Risk Findings"
          value={data.highRisk}
          icon={<ShieldAlert className="w-5 h-5" />}
          iconBg="bg-critical-soft text-critical"
          description="Critical issues detected"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Priority Attention + Recent Submissions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Priority Attention Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-ink-dark">Priority Attention</h3>
                <p className="text-sm text-ink-secondary">Content requiring immediate review</p>
              </div>
              <Link href="/reviews" className="text-sm font-medium text-accent hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {data.recent.length === 0 ? (
              <div className="card p-8 text-center bg-surface-subtle border border-border/50">
                <Shield className="w-12 h-12 text-ink-muted mx-auto mb-3" />
                <h4 className="text-base font-semibold text-ink-dark mb-1">No items requiring attention</h4>
                <p className="text-sm text-ink-secondary">All submissions are up to date.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recent.slice(0, 3).map((item) => (
                  <Link key={item.id} href={"/reviews/" + item.id} className="block">
                    <div className="card p-4 hover:bg-surface-hover transition-colors border-border flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-ink-dark text-sm truncate">{item.title}</span>
                          <Badge variant={statusVariant(item.status)} className="shrink-0">
                            {getStatusLabel(item.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-ink-secondary">
                          <span>{item.content_type}</span>
                          <span>•</span>
                          <span>{item.channel}</span>
                          <span>•</span>
                          <span>{formatRelative(item.updated_at || item.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant={item.risk_level === 'HIGH' ? 'high' : item.risk_level === 'MEDIUM' ? 'medium' : 'low'}>
                          {item.risk_level || 'LOW'}
                        </Badge>
                        <ArrowRight className="w-4 h-4 text-ink-muted" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Submissions Table */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-ink-dark">Recent Submissions</h3>
                <p className="text-sm text-ink-secondary">Latest content submissions across all channels</p>
              </div>
              <Link href="/reviews" className="text-sm font-medium text-accent hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="card bg-surface border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th className="w-2/5">Title & Reference</th>
                      <th className="w-36">Type / Channel</th>
                      <th className="w-32">Status</th>
                      <th className="w-28">Risk Level</th>
                      <th className="w-28">Updated</th>
                      <th className="w-36 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-ink-secondary">
                          No submissions yet. <Link href="/reviews/new" className="text-accent hover:underline">Submit your first content</Link>.
                        </td>
                      </tr>
                    ) : (
                      data.recent.map((s) => (
                        <tr key={s.id} className="hover:bg-surface-subtle/40">
                          <td>
                            <Link
                              href={"/reviews/" + s.id}
                              className="font-semibold text-ink-dark hover:text-accent hover:underline text-sm block"
                            >
                              {s.title}
                            </Link>
                            <span className="font-mono text-[11px] text-ink-secondary">
                              REV-{s.id.slice(0, 8).toUpperCase()}
                            </span>
                          </td>
                          <td className="text-xs text-ink-secondary">
                            <span className="font-medium text-ink-dark block">{s.content_type}</span>
                            <span className="text-[11px] text-ink-secondary">{s.channel}</span>
                          </td>
                          <td>
                            <Badge variant={statusVariant(s.status)}>
                              {getStatusLabel(s.status)}
                            </Badge>
                          </td>
                          <td>
                            <Badge variant={s.risk_level === 'HIGH' ? 'high' : s.risk_level === 'MEDIUM' ? 'medium' : 'low'}>
                              {s.risk_level || 'LOW'}
                            </Badge>
                          </td>
                          <td className="text-xs text-ink-secondary">
                            {formatRelative(s.updated_at || s.created_at)}
                          </td>
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link href={"/reviews/" + s.id}>
                                <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs">
                                  Review
                                </Button>
                              </Link>
                              <Link href={"/passports/" + s.id}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-accent hover:bg-accent-soft"
                                  title="View Brand Evidence Passport"
                                >
                                  <Shield className="w-3.5 h-3.5" />
                                </Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Knowledge Layer + Top Flagged Rules */}
        <div className="space-y-6">
          {/* Knowledge Layer */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-ink-dark">Knowledge Layer</h3>
                <p className="text-sm text-ink-secondary">Approved facts, guidelines & sources</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <KnowledgeCard
                title="Approved Facts"
                value={facts.length}
                icon={<Database className="w-5 h-5" />}
                description="Verified brand claims"
                linkHref="/knowledge"
                linkText="Manage facts"
              />
              <KnowledgeCard
                title="Active Guidelines"
                value={guidelines.filter(g => g.active).length}
                icon={<Shield className="w-5 h-5" />}
                description="Enforcement rules"
                linkHref="/guidelines"
                linkText="View guidelines"
              />
              <KnowledgeCard
                title="Verified Sources"
                value={guidelines.length + facts.length}
                icon={<BookOpen className="w-5 h-5" />}
                description="Source documents"
                linkHref="/knowledge"
                linkText="Browse sources"
              />
              <KnowledgeCard
                title="Knowledge Freshness"
                value="94%"
                icon={<Sparkles className="w-5 h-5" />}
                description="Up-to-date records"
              />
            </div>
          </div>

          {/* Top Flagged Rules */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-ink-dark">Top Flagged Rules</h3>
                <p className="text-sm text-ink-secondary">Most frequently violated guidelines</p>
              </div>
            </div>

            {topFlaggedRules.length === 0 ? (
              <div className="card p-6 bg-surface-subtle border border-border/50">
                <ShieldAlert className="w-10 h-10 text-ink-muted mx-auto mb-3" />
                <h4 className="text-base font-semibold text-ink-dark mb-1">No guideline violations yet</h4>
                <p className="text-sm text-ink-secondary">Rules will appear here as content is reviewed.</p>
              </div>
            ) : (
              <div className="card bg-surface border border-border">
                <div className="p-4 border-b border-border">
                  <h4 className="text-sm font-semibold text-ink-dark">Rule Violations</h4>
                </div>
                <div className="p-4 space-y-3">
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
              </div>
            )}
          </div>

          {/* Verification Protocol Notice */}
          <div className="card border-accent/30 bg-accent-soft/20">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Shield className="w-4 h-4 text-accent" />
                <h4 className="text-xs font-bold text-accent uppercase tracking-wider">
                  Auditable Governance Guarantee
                </h4>
              </div>
              <p className="text-xs text-ink leading-relaxed">
                BrandVault AI enforces traceable evidence: missing evidence is marked <span className="font-semibold text-warning">UNVERIFIED</span>, never assumed false. The AI suggests corrections, but only authorized human reviewers can approve content.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  iconBg,
  description,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg: string;
  description: string;
}) {
  return (
    <div className="card p-5 relative overflow-hidden flex flex-col justify-between min-h-[120px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">
          {title}
        </span>
        <div className={"w-9 h-9 rounded-lg " + iconBg + " flex items-center justify-center shrink-0"}>
          {icon}
        </div>
      </div>
      <div>
        <div className="text-2xl sm:text-3xl font-bold font-sans tnums leading-tight text-ink-dark">
          {value}
        </div>
        <div className="text-[11px] text-ink-secondary truncate mt-1">
          {description}
        </div>
      </div>
    </div>
  );
}

function KnowledgeCard({
  title,
  value,
  icon,
  description,
  linkHref,
  linkText,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description: string;
  linkHref: string;
  linkText: string;
}) {
  return (
    <Link href={linkHref} className="card-interactive block">
      <div className="card p-4 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">{title}</span>
          <div className="w-9 h-9 rounded-lg bg-surface-subtle flex items-center justify-center shrink-0 text-ink-secondary">
            {icon}
          </div>
        </div>
        <div className="flex-1">
          <div className="text-2xl font-bold font-sans tnums leading-tight text-ink-dark">
            {value}
          </div>
          <div className="text-[11px] text-ink-secondary truncate mt-1">{description}</div>
        </div>
        <div className="mt-2 pt-2 border-t border-border-soft flex items-center justify-between">
          <span className="text-xs font-medium text-accent hover:underline">{linkText}</span>
        </div>
      </div>
    </Link>
  );
}

function statusVariant(status: string): 'low' | 'medium' | 'high' | 'neutral' {
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
