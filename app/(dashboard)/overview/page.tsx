import { storage } from '@/lib/db/adaptor';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import Link from 'next/link';
import { formatRelative } from '@/lib/utils';
import {
  FileText, Clock, ShieldAlert, CheckCircle2, XCircle, AlertTriangle,
  ArrowRight, Shield, Database, Sparkles, BookOpen, TrendingUp, AlertCircle
} from 'lucide-react';

export default async function OverviewPage() {
  const ws = await storage.getDemoWorkspace();
  const workspaceId = ws?.id;

  const [data, guidelines, facts, allFindings, submissions] = await Promise.all([
    workspaceId
      ? storage.dashboardStats(workspaceId)
      : Promise.resolve({ total: 0, pending: 0, approved: 0, rejected: 0, highRisk: 0, recent: [] }),
    workspaceId ? storage.listGuidelines(workspaceId, { active: true }) : Promise.resolve([]),
    workspaceId ? storage.listFacts(workspaceId, { active: true }) : Promise.resolve([]),
    workspaceId ? storage.listFindings('') : Promise.resolve([]),
    workspaceId ? storage.listSubmissions(workspaceId) : Promise.resolve([]),
  ]);

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

  const needsAttention = submissions
    .filter(s => s.status === 'NEEDS_REVIEW' || s.status === 'CHANGES_REQUESTED')
    .sort((a, b) => {
      const riskOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return (riskOrder[b.risk_level as keyof typeof riskOrder] || 0) - (riskOrder[a.risk_level as keyof typeof riskOrder] || 0);
    })
    .slice(0, 5);

  const activeFacts = facts.filter(f => f.verification_status === 'APPROVED').length;
  const activeGuidelines = guidelines.filter(g => g.active).length;
  const sourceDocuments = await (workspaceId ? storage.listDocuments(workspaceId) : Promise.resolve([]));
  const approvedSources = sourceDocuments.filter(d => d.document_status === 'APPROVED').length;
  const freshnessPercent = activeFacts > 0 ? Math.round((facts.filter(f => !f.expires_at || new Date(f.expires_at) > new Date()).length / activeFacts) * 100) : 100;

  return (
    <div className='space-y-6 animate-fade-in'>
      {/* Hero Band */}
      <div className='hero-band hero-band-torn-bottom relative'>
        <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8'>
          <div className='lg:w-2/3'>
            <span className='eyebrow'>Production workspace</span>
            <h1 className='text-[36px] sm:text-[40px] font-bold text-ink mb-3 font-serif leading-tight'>
              NexTech brand governance
            </h1>
            <p className='text-ink-2 text-base max-w-xl leading-relaxed mb-6'>
              Every claim checked against approved sources before it goes live.
            </p>
            <div className='flex flex-wrap items-center gap-3'>
              <Link href='/reviews/new'>
                <Button className='btn-primary flex items-center gap-2 shadow-sm shadow-brand/20'>
                  <Sparkles className='w-4 h-4 text-white' />
                  <span>Submit for review</span>
                </Button>
              </Link>
              <Link href='/passports'>
                <Button variant='secondary' size='sm' className='bg-surface-2 hover:bg-surface-hover border-line'>
                  View passports
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Mini passport preview */}
          <div className='lg:w-1/3 flex justify-center lg:justify-end -rotate-2 lg:-rotate-3'>
            <div className='passport-card passport-card-approved w-full max-w-xs opacity-90'>
              <div className='p-5'>
                <div className='flex items-center gap-2 mb-3'>
                  <span className='w-2 h-2 rounded-full bg-supported' />
                  <span className='text-[11px] font-semibold uppercase tracking-wider text-ink-3'>Certified</span>
                </div>
                <h3 className='text-lg font-bold text-ink font-serif mb-1'>Nova Product Launch</h3>
                <p className='text-sm text-ink-2 mb-4'>Instagram · Approved · Low risk</p>
                <div className='flex items-center justify-between pt-3 border-t border-line'>
                  <span className='text-xs font-mono text-ink-3'>BVP-2026-0001</span>
                  <div className='stamp stamp-approved'>
                    <div className='stamp-circle' />
                    <div className='stamp-text'>APPROVED</div>
                  </div>
                </div>
                <p className='font-handwritten text-[12px] text-ink-3 italic mt-3 text-center'>
                  "Every claim here can be checked."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today at a Glance - Stat Cards */}
      <section aria-label='Today at a glance'>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <StatCard
            title='Total Submissions'
            value={data.total}
            icon={<FileText className='w-5 h-5 text-white' />}
            iconBg='bg-brand'
            description='All content submitted'
            linkHref='/reviews'
            linkText='View all'
          />
          <StatCard
            title='Pending Review'
            value={data.pending}
            icon={<Clock className='w-5 h-5 text-white' />}
            iconBg='bg-unverified'
            description='Needs human attention'
            linkHref='/reviews?status=NEEDS_REVIEW'
            linkText='Review now'
          />
          <StatCard
            title='Approved'
            value={data.approved}
            icon={<CheckCircle2 className='w-5 h-5 text-white' />}
            iconBg='bg-supported'
            description='Ready to publish'
            linkHref='/reviews?status=APPROVED'
            linkText='View approved'
          />
          <StatCard
            title='High-Risk Findings'
            value={data.highRisk}
            icon={<AlertTriangle className='w-5 h-5 text-white' />}
            iconBg='bg-contradicted'
            description='Critical issues open'
            linkHref='/reviews?risk=HIGH'
            linkText='Investigate'
          />
        </div>
      </section>

      {/* Needs Your Attention + Knowledge Health */}
      <section className='grid gap-6 lg:grid-cols-[2fr_1fr]'>
        {/* Needs Your Attention */}
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-bold text-ink font-serif'>Needs your attention</h2>
            <Link href='/reviews?status=NEEDS_REVIEW' className='text-sm text-brand hover:underline font-medium'>
              View all →
            </Link>
          </div>
          {needsAttention.length > 0 ? (
            <div className='space-y-3'>
              {needsAttention.map((s) => (
                <AttentionItem key={s.id} submission={s} />
              ))}
            </div>
          ) : (
            <EmptyState
              title='Nothing waiting on you'
              description="Nice and quiet. All submissions are either approved or don\u2019t need review right now."
              icon={<CheckCircle2 className='w-6 h-6' />}
            />
          )}
        </div>

        {/* Knowledge Health */}
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-bold text-ink font-serif'>Knowledge health</h2>
          </div>
          <div className='knowledge-health-panel space-y-1'>
            <KnowledgeHealthRow
              label='Approved facts'
              value={activeFacts}
              linkHref='/knowledge'
              linkText='Manage facts'
            />
            <KnowledgeHealthRow
              label='Active guidelines'
              value={activeGuidelines}
              linkHref='/guidelines'
              linkText='View guidelines'
            />
            <KnowledgeHealthRow
              label='Verified sources'
              value={approvedSources}
              linkHref='/knowledge'
              linkText='View sources'
            />
            <KnowledgeHealthRow
              label='Freshness'
              value={'${freshnessPercent}%'}
              isProgress
              progressValue={freshnessPercent}
            />
          </div>
        </div>
      </section>

      {/* Recent Submissions Table */}
      <section>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-bold text-ink font-serif'>Recent submissions</h2>
          <Link href='/reviews' className='text-sm text-brand hover:underline font-medium'>
            View all →
          </Link>
        </div>
        <div className='card overflow-hidden'>
          <div className='overflow-x-auto'>
            {submissions.length === 0 ? (
              <EmptyState
                title='No submissions yet'
                description='Submit your first piece of content for review to get started.'
                action={<Link href='/reviews/new'><Button className='btn-primary'>Submit for review</Button></Link>}
                icon={<FileText className='w-6 h-6' />}
              />
            ) : (
              <table className='data-table'>
                <thead>
                  <tr>
                    <th className='w-40'>Title</th>
                    <th className='w-40'>Type / Channel</th>
                    <th className='w-36'>Status</th>
                    <th className='w-28'>Risk</th>
                    <th className='w-36'>Updated</th>
                    <th className='w-32 text-right'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.slice(0, 10).map((s) => (
                    <tr key={s.id} className='hover:bg-surface-2/50 border-b border-line/50 transition-colors'>
                      <td className='py-3.5 px-4'>
                        <Link
                          href={'/reviews/' + s.id}
                          className='font-semibold text-ink hover:text-brand transition-colors text-sm block tracking-tight'
                        >
                          {s.title}
                        </Link>
                        <span className='id-chip mt-1 inline-block'>
                          REV-{s.id.slice(0, 8).toUpperCase()}
                        </span>
                      </td>
                      <td className='py-3.5 px-4 text-xs text-ink-2'>
                        <span className='font-medium text-ink block'>{s.content_type}</span>
                        <span className='text-[11px] text-ink-3'>{s.channel}</span>
                      </td>
                      <td className='py-3.5 px-4'>
                        <Badge variant={statusToVariant(s.status)}>
                          {getStatusLabel(s.status)}
                        </Badge>
                      </td>
                      <td className='py-3.5 px-4'>
                        <Badge variant={riskToVariant(s.risk_level || 'LOW')}> 
                          {s.risk_level || 'LOW'}
                        </Badge>
                      </td>
                      <td className='py-3.5 px-4 text-xs text-ink-3 font-medium'>
                        {formatRelative(s.updated_at || s.created_at)}
                      </td>
                      <td className='py-3.5 px-4 text-right'>
                        <div className='flex items-center justify-end gap-1.5'>
                          <Link href={'/reviews/' + s.id}>
                            <Button variant='ghost' size='sm' className='h-8 px-3 text-xs font-semibold hover:bg-surface-2'>
                              Review
                            </Button>
                          </Link>
                          <Link href={'/passports/' + s.id}>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-8 px-2 text-xs text-brand hover:bg-brand-soft flex items-center gap-1.5 ml-auto font-semibold'
                              title='View Brand Evidence Passport'
                            >
                              <Shield className='w-3.5 h-3.5' />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      {/* AI Disclosure */}
      <div className='ai-disclosure no-print'>
        <Shield className='ai-disclosure-icon' />
        <span>AI-assisted findings · Humans decide</span>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  iconBg,
  description,
  linkHref,
  linkText,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg: string;
  description: string;
  linkHref?: string;
  linkText?: string;
}) {
  return (
    <div className='card p-5 relative overflow-hidden flex flex-col justify-between min-h-[128px] bg-surface border border-line rounded-2xl shadow-sm hover:shadow-lg hover:border-line transition-all duration-200 group'>
      <div className='flex items-center justify-between mb-3'>
        <span className='stat-card-label'>{title}</span>
        <div className={'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ' + iconBg}>
          {icon}
        </div>
      </div>
      <div>
        <div className='stat-card-value'>{value}</div>
        <div className='stat-card-description'>{description}</div>
      </div>
      {linkHref && linkText && (
        <div className='mt-3 pt-2.5 border-t border-line/50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity'>
          <Link href={linkHref} className='text-xs font-semibold text-brand hover:underline flex items-center gap-1'>
            {linkText} <ArrowRight className='w-3 h-3' />
          </Link>
        </div>
      )}
    </div>
  );
}

function AttentionItem({ submission }: { submission: any }) {
  const findings = submission.findings || [];
  const evidenceSummary = findings.filter((f: any) => f.verification_status === 'CONTRADICTED').length + ' contradicted · ' + findings.filter((f: any) => f.verification_status === 'UNVERIFIED').length + ' unverified';
  
  return (
    <Link href={'/reviews/' + submission.id} className='card p-4 hover:shadow-lg hover:border-line transition-all duration-200 group flex items-center justify-between gap-4'>
      <div className='flex-1 min-w-0'>
        <h3 className='font-semibold text-ink truncate group-hover:text-brand transition-colors'>{submission.title}</h3>
        <div className='flex items-center gap-2 mt-1.5 text-xs text-ink-3'>
          <span className='font-medium text-ink'>{submission.content_type}</span>
          <span>·</span>
          <span>{submission.channel}</span>
          <span>·</span>
          <span className='font-medium'>{evidenceSummary}</span>
        </div>
      </div>
      <div className='flex items-center gap-2 shrink-0'>
        <Badge variant={statusToVariant(submission.status)} className='mr-2'>
          {getStatusLabel(submission.status)}
        </Badge>
        <Badge variant={riskToVariant(submission.risk_level || 'LOW')}>
          {submission.risk_level || 'LOW'}
        </Badge>
        <Button variant='ghost' size='sm' className='h-8 px-3 text-xs font-semibold hover:bg-surface-2 opacity-0 group-hover:opacity-100 transition-opacity ml-2'>
          Review
        </Button>
      </div>
    </Link>
  );
}

function KnowledgeHealthRow({
  label,
  value,
  isProgress = false,
  progressValue = 0,
  linkHref,
  linkText,
}: {
  label: string;
  value: string | number;
  isProgress?: boolean;
  progressValue?: number;
  linkHref?: string;
  linkText?: string;
}) {
  return (
    <div className='knowledge-health-row'>
      <span className='knowledge-health-label'>{label}</span>
      <div className='flex items-center gap-3'>
        {isProgress ? (
          <div className='flex items-center gap-2'>
            <div className='knowledge-health-progress'>
              <div className='knowledge-health-progress-bar' style={{ width: progressValue + '%' }} />
            </div>
            <span className='knowledge-health-value font-mono'>{value}</span>
          </div>
        ) : (
          <span className='knowledge-health-value font-mono'>{value}</span>
        )}
        {linkHref && linkText && (
          <Link href={linkHref} className='text-xs font-semibold text-brand hover:underline flex items-center gap-1'>
            {linkText} <ArrowRight className='w-3 h-3' />
          </Link>
        )}
      </div>
    </div>
  );
}

function statusToVariant(status: string): 'low' | 'medium' | 'high' | 'neutral' {
  switch (status) {
    case 'APPROVED': return 'low';
    case 'REJECTED': return 'high';
    case 'NEEDS_REVIEW':
    case 'CHANGES_REQUESTED': return 'medium';
    default: return 'neutral';
  }
}

function riskToVariant(risk: string): 'low' | 'medium' | 'high' | 'neutral' {
  switch (risk) {
    case 'HIGH': return 'high';
    case 'MEDIUM': return 'medium';
    default: return 'low';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'NEEDS_REVIEW': return 'Needs review';
    case 'CHANGES_REQUESTED': return 'Changes requested';
    case 'APPROVED': return 'Approved';
    case 'REJECTED': return 'Rejected';
    case 'DRAFT': return 'Draft';
    case 'ANALYZING': return 'Analyzing';
    default: return status;
  }
}
