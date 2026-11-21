import { storage } from '@/lib/db/adaptor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import Link from 'next/link';
import { formatRelative, getSubmissionReference, statusToVariant } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { FileText, Filter, Check } from 'lucide-react';
import { getRequestContext } from '@/lib/auth';

export default async function FindingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string; severity?: string }>;
}) {
  const ctx = await getRequestContext();
  const workspaceId = ctx.workspaceId;
  const submissions = workspaceId ? await storage.listSubmissions(workspaceId) : [];

  const allFindings = [];
  for (const s of submissions) {
    const findings = await storage.listFindings(s.id);
    allFindings.push(...findings.map((f) => ({ ...f, submission: s })));
  }

  const params = (await searchParams) || {};
  const activeType = params.type || 'ALL';
  const activeSeverity = params.severity || 'ALL';

  let filteredFindings = allFindings;
  if (activeType !== 'ALL') {
    filteredFindings = filteredFindings.filter((f) => f.finding_type === activeType);
  }
  if (activeSeverity !== 'ALL') {
    filteredFindings = filteredFindings.filter((f) => f.severity === activeSeverity);
  }

  const total = allFindings.length;
  const byType = allFindings.reduce((acc, f) => {
    acc[f.finding_type] = (acc[f.finding_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const bySeverity = allFindings.reduce((acc, f) => {
    acc[f.severity] = (acc[f.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const byStatus = allFindings.reduce((acc, f) => {
    acc[f.status] = (acc[f.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-brand ring-4 ring-brand/20" />
            <span className="text-xs font-bold text-brand uppercase tracking-wider">
              Findings Registry
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-ink tracking-tight">
            All Findings
          </h1>
          <p className="text-sm text-ink-2 mt-1 max-w-2xl leading-relaxed">
            Complete registry of all factual contradictions, unverified claims, guideline violations, and tone issues detected across submissions.
          </p>
        </div>
        <Link href="/reviews/new">
          <Button className="btn-primary text-sm flex items-center gap-2 shadow-sm shadow-brand/20">
            <span className="w-4 h-4">+</span>
            <span>Submit for Review</span>
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Total Findings" value={total} icon="📋" />
        <StatCard title="Contradicted" value={byType.FACTUAL_CONTRADICTION || 0} icon="🔴" variant="high" />
        <StatCard title="Unverified" value={byType.UNVERIFIED_CLAIM || 0} icon="🟡" variant="medium" />
        <StatCard title="Open" value={byStatus.OPEN || 0} icon="📂" variant="medium" />
      </div>

      {/* Interactive Filters Bar */}
      <Card className="bg-sheet border border-line rounded-xl shadow-xs">
        <div className="p-4 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink mr-1">
              <Filter className="w-3.5 h-3.5 text-brand" />
              <span>Filters:</span>
            </div>

            {/* All Findings Button */}
            <FilterBadge
              label={`All Findings (${total})`}
              href={activeSeverity !== 'ALL' ? `/findings?severity=${activeSeverity}` : '/findings'}
              active={activeType === 'ALL'}
            />

            {/* Type Filter Buttons */}
            {Object.entries(byType).map(([type, count]) => {
              const href = activeSeverity !== 'ALL'
                ? `/findings?type=${type}&severity=${activeSeverity}`
                : `/findings?type=${type}`;
              return (
                <FilterBadge
                  key={type}
                  label={`${typeToLabel(type)} (${count})`}
                  href={href}
                  active={activeType === type}
                />
              );
            })}
          </div>

          {/* Severity Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-ink-3 mr-1">Severity:</span>
            {['HIGH', 'MEDIUM', 'LOW'].map((sev) => {
              const count = bySeverity[sev] || 0;
              const isCurrent = activeSeverity === sev;
              const href = isCurrent
                ? (activeType !== 'ALL' ? `/findings?type=${activeType}` : '/findings')
                : (activeType !== 'ALL' ? `/findings?type=${activeType}&severity=${sev}` : `/findings?severity=${sev}`);
              return (
                <SeverityBadge
                  key={sev}
                  severity={sev}
                  count={count}
                  href={href}
                  active={isCurrent}
                />
              );
            })}
          </div>
        </div>
      </Card>

      {/* Findings Table */}
      <Card className="bg-sheet border border-line rounded-xl shadow-xs overflow-hidden">
        {filteredFindings.length === 0 ? (
          <EmptyState
            title="No Findings Match Filter"
            description={total === 0
              ? "Findings appear here when content is submitted for brand verification and analyzed against approved facts and guidelines."
              : "No findings matched your active filter criteria. Clear filters to view all findings."
            }
            icon={<span className="w-10 h-10 text-ink-3">📄</span>}
            action={total === 0 ? (
              <Link href="/reviews/new"><Button className="btn-primary">Submit First Content</Button></Link>
            ) : (
              <Link href="/findings"><Button variant="outline" className="text-xs">Clear Filters</Button></Link>
            )}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <Thead>
                <Tr className="border-b border-line bg-surface/50">
                  <Th className="w-10 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-2">#</Th>
                  <Th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-2">Finding</Th>
                  <Th className="w-48 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-2">Type</Th>
                  <Th className="w-32 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-2">Severity</Th>
                  <Th className="w-36 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-2">Status</Th>
                  <Th className="w-48 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-2">Submission</Th>
                  <Th className="w-40 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-2">Detected</Th>
                  <Th className="w-36 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-2 text-right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredFindings.map((f, idx) => (
                  <Tr key={f.id} className="hover:bg-surface-hover/60 border-b border-line/60 transition-colors">
                    <Td className="py-3 px-4 text-xs font-mono text-ink-3">{idx + 1}</Td>
                    <Td className="py-3 px-4">
                      <Link href={`/reviews/${f.submission.id}/findings/${f.id}`} className="font-semibold text-ink hover:text-brand transition-colors text-sm block truncate max-w-[300px]">
                        {f.title}
                      </Link>
                      <p className="text-xs text-ink-2 mt-0.5 truncate max-w-[300px]">{f.excerpt}</p>
                    </Td>
                    <Td className="py-3 px-4">
                      <Badge variant={typeToVariant(f.finding_type)} className="text-xs w-full justify-center">
                        {typeToLabel(f.finding_type)}
                      </Badge>
                    </Td>
                    <Td className="py-3 px-4">
                      <Badge variant={f.severity.toLowerCase() as any}>
                        {f.severity}
                      </Badge>
                    </Td>
                    <Td className="py-3 px-4">
                      <Badge variant={statusToVariant(f.status)}>
                        {f.status.replace('_', ' ')}
                      </Badge>
                    </Td>
                    <Td className="py-3 px-4 text-xs text-ink-2">
                      <Link href={`/reviews/${f.submission.reference || f.submission.id}`} className="font-medium text-ink hover:text-brand truncate block max-w-[150px]">
                        {f.submission.title}
                      </Link>
                      <span className="font-mono text-[10px] text-ink-3 bg-surface px-1.5 py-0.5 rounded mt-0.5 inline-block border border-line">
                        {getSubmissionReference(f.submission)}
                      </span>
                    </Td>
                    <Td className="py-3 px-4 text-xs text-ink-3 font-medium">
                      {formatRelative(f.created_at)}
                    </Td>
                    <Td className="py-3 px-4 text-right">
                      <Link href={`/reviews/${f.submission.id}/findings/${f.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-semibold hover:bg-surface-hover">
                          Inspect
                        </Button>
                      </Link>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon, variant = 'neutral' }: { title: string; value: number; icon: string; variant?: 'low' | 'medium' | 'high' | 'neutral' }) {
  const variantColors = {
    low: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    medium: 'bg-amber-50 text-amber-900 border-amber-200',
    high: 'bg-red-50 text-proof-red border-red-200',
    neutral: 'bg-sheet text-ink border-line',
  };
  return (
    <div className={`p-3.5 rounded-xl border ${variantColors[variant]} shadow-2xs`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider">{title}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="text-2xl font-bold font-serif mt-1">{value}</div>
    </div>
  );
}

function FilterBadge({ label, href, active = false }: { label: string; href: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 inline-flex items-center gap-1.5 cursor-pointer ${
        active
          ? 'bg-ink text-white shadow-xs border border-ink'
          : 'bg-sheet border border-line text-ink-2 hover:text-ink hover:bg-surface-hover'
      }`}
    >
      <span>{label}</span>
      {active && <Check className="w-3 h-3 text-white" />}
    </Link>
  );
}

function SeverityBadge({
  severity,
  count,
  href,
  active = false,
}: {
  severity: string;
  count: number;
  href: string;
  active?: boolean;
}) {
  const colors = {
    HIGH: active ? 'bg-proof-red text-white border-proof-red shadow-xs font-bold' : 'bg-red-50 text-proof-red border-proof-red/30 hover:bg-red-100/60',
    MEDIUM: active ? 'bg-amber-600 text-white border-amber-600 shadow-xs font-bold' : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100/60',
    LOW: active ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-bold' : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100/60',
  };
  return (
    <Link
      href={href}
      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all inline-flex items-center gap-1 cursor-pointer ${
        colors[severity as keyof typeof colors] || (active ? 'bg-ink text-white' : 'bg-sheet border-line text-ink-2')
      }`}
    >
      <span>{severity}</span>
      <span className="opacity-90 font-mono text-[11px]">({count})</span>
    </Link>
  );
}

function typeToVariant(type: string): 'low' | 'medium' | 'high' | 'neutral' {
  switch (type) {
    case 'FACTUAL_CONTRADICTION':
    case 'OUTDATED_SOURCE':
    case 'CONFLICTING_SOURCES':
      return 'high';
    case 'UNVERIFIED_CLAIM':
    case 'UNSUPPORTED_CLAIM':
      return 'medium';
    case 'TERMINOLOGY_VIOLATION':
    case 'TONE_VIOLATION':
    case 'GUIDELINE_VIOLATION':
      return 'medium';
    default:
      return 'neutral';
  }
}

function typeToLabel(type: string): string {
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
