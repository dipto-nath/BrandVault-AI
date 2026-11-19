import { storage } from '@/lib/db/adaptor';
import { getRequestContext } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FlowButton } from '@/components/ui/flow-button';
import { EmptyState } from '@/components/ui/empty-state';
import Link from 'next/link';
import { formatRelative, getSubmissionReference, getPassportReference, statusToVariant, riskToVariant, getStatusLabel } from '@/lib/utils';
import {
  FileText, Clock, ShieldAlert, CheckCircle2, XCircle, AlertTriangle,
  ArrowRight, Shield, Database, Sparkles, BookOpen, TrendingUp, AlertCircle
} from 'lucide-react';

export default async function OverviewPage() {
  const ctx = await getRequestContext();
  const ws = (ctx.workspaceId ? await storage.getWorkspace(ctx.workspaceId) : null) || (await storage.getDemoWorkspace());
  const workspaceId = ws?.id || ctx.workspaceId;
  const workspaceName = ws?.name || 'Brand';

  const [data, guidelines, facts, allFindings, submissions] = await Promise.all([
    workspaceId
      ? storage.dashboardStats(workspaceId)
      : Promise.resolve({ total: 0, pending: 0, approved: 0, rejected: 0, highRisk: 0, recent: [] }),
    workspaceId ? storage.listGuidelines(workspaceId, { active: true }) : Promise.resolve([]),
    workspaceId ? storage.listFacts(workspaceId, { active: true }) : Promise.resolve([]),
    workspaceId ? storage.listFindings() : Promise.resolve([]),
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
  const freshnessValue = activeFacts === 0 ? '—' : `${freshnessPercent}%`;
  const latestCertified = submissions.find(s => s.status === 'APPROVED');

  return (
    <div className='space-y-6 animate-fade-in'>
      {/* Hero Band with Classical Background */}
      <div className='hero-band hero-band-torn-bottom relative min-h-[300px] flex items-center'>
        {/* Subtle lighting / readability overlay */}
        <div className='absolute inset-0 bg-gradient-to-r from-paper/60 via-paper/20 to-transparent pointer-events-none' />

        <div className='relative z-10 w-full flex flex-col lg:flex-row lg:items-center justify-between gap-6'>
          {/* Main Title & CTAs - adjusted to the left/center-left with column breathing room */}
          <div className='flex-1 min-w-0 lg:max-w-[460px] xl:max-w-[500px] pl-1 sm:pl-3'>
            <div className='inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-brand-soft/80 border border-brand/20 backdrop-blur-sm mb-3'>
              <span className='w-2 h-2 rounded-full bg-supported animate-pulse' />
              <span className='text-[11px] font-bold uppercase tracking-wider text-brand font-jakarta'>
                {ctx.isDemo ? 'Demo workspace' : 'Production workspace'}
              </span>
            </div>
            <h1 className='text-[34px] sm:text-[38px] xl:text-[42px] font-extrabold text-ink mb-3 font-jakarta leading-[1.15] tracking-tight'>
              {workspaceName} brand governance
            </h1>
            <p className='text-ink-2 text-sm sm:text-base leading-relaxed mb-6 font-medium font-jakarta'>
              Every claim checked against approved sources before it goes live.
            </p>
            <div className='flex flex-wrap items-center gap-3'>
              <Link href='/reviews/new' className='no-underline hover:no-underline'>
                <FlowButton text="Submit for review" />
              </Link>
              <Link href='/passports' className='no-underline hover:no-underline'>
                <Button variant='secondary' size='sm' className='bg-surface/90 hover:bg-surface border-line backdrop-blur-sm shadow-xs font-jakarta rounded-full px-5 py-2.5 no-underline hover:no-underline'>
                  View passports
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Mini passport preview - repositioned in the middle zone so David's statue on the right remains clear */}
          {latestCertified ? (
            <Link
              href={'/passports/' + (latestCertified.passport_reference || latestCertified.id)}
              className='flex justify-center shrink-0 w-full sm:w-[270px] -rotate-2 hover:rotate-0 transition-transform duration-300 mx-auto lg:mx-0 group cursor-pointer no-underline hover:no-underline'
              aria-label={`View evidence passport for ${latestCertified.title}`}
            >
              <div className='passport-card passport-card-approved w-full bg-paper/95 backdrop-blur-md shadow-md border border-line/90 group-hover:shadow-lg transition-shadow'>
                <div className='p-4 sm:p-5'>
                  <div className='flex items-center gap-2 mb-2'>
                    <span className='w-2 h-2 rounded-full bg-supported' />
                    <span className='text-[10px] font-bold uppercase tracking-wider text-ink-3 font-jakarta'>Certified</span>
                  </div>
                  <h3 className='text-base font-bold text-ink font-jakarta mb-0.5 truncate'>{latestCertified.title}</h3>
                  <p className='text-xs text-ink-2 mb-3 truncate font-jakarta'>{latestCertified.channel || latestCertified.content_type} · Approved · {latestCertified.risk_level || 'Low'} risk</p>
                  <div className='flex items-center justify-between pt-2.5 border-t border-line'>
                    <span className='text-xs font-mono text-ink-3'>{getPassportReference(latestCertified)}</span>
                    <div className='stamp stamp-approved scale-90 origin-right'>
                      <div className='stamp-circle' />
                      <div className='stamp-text'>APPROVED</div>
                    </div>
                  </div>
                  <p className='font-handwritten text-[11px] text-ink-3 italic mt-2.5 text-center'>
                    "Every claim here can be checked."
                  </p>
                </div>
              </div>
            </Link>
          ) : (
            <div className='flex justify-center shrink-0 w-full sm:w-[270px] mx-auto lg:mx-0'>
              <div className='w-full bg-paper/85 backdrop-blur-md p-5 rounded-xl border border-dashed border-line text-center'>
                <Shield className='w-6 h-6 text-ink-3 mx-auto mb-2 opacity-50' />
                <p className='text-xs font-semibold text-ink'>No certified passports yet</p>
                <p className='text-[11px] text-ink-3 mt-1'>Approve a submission to mint an evidence passport.</p>
              </div>
            </div>
          )}

          {/* Reserved visual breathing room for David's classical bust on the right */}
          <div className='hidden lg:block lg:w-[260px] xl:w-[300px] shrink-0 pointer-events-none' aria-hidden='true' />
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
                <AttentionItem key={s.id} submission={s} allFindings={allFindings} />
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
              value={freshnessValue}
              isProgress={activeFacts > 0}
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
                          {getSubmissionReference(s)}
                        </span>
                      </td>
                      <td className='py-3.5 px-4 text-xs text-ink-2'>
                        <span className='font-medium text-ink block'>{s.content_type}</span>
                        {s.channel && !s.content_type.toLowerCase().includes(s.channel.toLowerCase()) && (
                          <span className='inline-block px-1.5 py-0.5 mt-0.5 rounded text-[10px] bg-surface-2 text-ink-3 border border-line font-medium'>{s.channel}</span>
                        )}
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
                          <Link href={'/reviews/' + (s.reference || s.id)} className='no-underline hover:no-underline'>
                            <Button variant='ghost' size='sm' className='h-8 px-3 text-xs font-semibold hover:bg-surface-2'>
                              Review
                            </Button>
                          </Link>
                          <Link href={'/passports/' + (s.passport_reference || s.id)} className='no-underline hover:no-underline' aria-label={`Open passport for ${s.title}`}>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-8 px-2.5 text-xs text-brand hover:bg-brand-soft flex items-center gap-1.5 ml-auto font-semibold'
                              title={`View Brand Evidence Passport for ${s.title}`}
                            >
                              <Shield className='w-3.5 h-3.5' />
                              <span>Passport</span>
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

function AttentionItem({ submission, allFindings = [] }: { submission: any; allFindings?: any[] }) {
  const subFindings = allFindings.filter((f: any) => f.submission_id === submission.id);
  const contradicted = subFindings.filter((f: any) => f.finding_type === 'FACTUAL_CONTRADICTION' || f.title?.toLowerCase().includes('contradict')).length;
  const unverified = subFindings.filter((f: any) => f.finding_type === 'UNVERIFIED_CLAIM' || f.title?.toLowerCase().includes('unverified') || f.title?.toLowerCase().includes('superlative') || f.title?.toLowerCase().includes('benchmark')).length;
  const evidenceSummary = `${contradicted} contradicted · ${unverified} unverified`;
  
  return (
    <Link href={'/reviews/' + (submission.reference || submission.id)} className='card p-4 hover:shadow-lg hover:border-line transition-all duration-200 group flex items-center justify-between gap-4'>
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
