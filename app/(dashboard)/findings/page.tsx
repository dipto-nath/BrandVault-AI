import { storage } from '@/lib/db/adaptor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import Link from 'next/link';
import { formatRelative, getSubmissionReference, statusToVariant } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { FileText, Filter } from 'lucide-react';
import { getRequestContext } from '@/lib/auth';

export default async function FindingsPage() {
  const ctx = await getRequestContext();
  const workspaceId = ctx.workspaceId;
  const submissions = workspaceId ? await storage.listSubmissions(workspaceId) : [];

  const allFindings = [];
  for (const s of submissions) {
    const findings = await storage.listFindings(s.id);
    allFindings.push(...findings.map(f => ({ ...f, submission: s })));
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-accent ring-4 ring-accent/20" />
            <span className="text-xs font-bold text-accent uppercase tracking-wider">
              Findings Registry
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-jakarta text-ink-dark tracking-tight">
            All Findings
          </h1>
          <p className="text-sm text-ink-secondary mt-1 max-w-2xl leading-relaxed">
            Complete registry of all factual contradictions, unverified claims, guideline violations, and tone issues detected across submissions.
          </p>
        </div>
        <Link href="/reviews/new">
          <Button className="btn-primary text-sm flex items-center gap-2 shadow-sm shadow-accent/20">
            <span className="w-4 h-4">+</span>
            <span>Submit for Review</span>
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Total Findings" value={allFindings.length} icon="📋" />
        <StatCard title="Contradicted" value={byType.FACTUAL_CONTRADICTION || 0} icon="🔴" variant="high" />
        <StatCard title="Unverified" value={byType.UNVERIFIED_CLAIM || 0} icon="🟡" variant="medium" />
        <StatCard title="Open" value={byStatus.OPEN || 0} icon="📂" variant="medium" />
      </div>

      <Card className="bg-surface border border-border">
        <div className="p-4 border-b border-border flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4">🔍</span>
            <span className="text-sm font-semibold text-ink">Filters:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterBadge label="All Types" active />
            {Object.entries(byType).map(([type, count]) => (
              <FilterBadge key={type} label={`${type} (${count})`} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2 ml-auto">
            {Object.entries(bySeverity).map(([sev, count]) => (
              <SeverityBadge key={sev} severity={sev} count={count} />
            ))}
          </div>
        </div>
      </Card>

      <Card className="bg-surface border border-border">
        {allFindings.length === 0 ? (
          <EmptyState
            title="No Findings Yet"
            description="Findings appear here when content is submitted for brand verification and analyzed against approved facts and guidelines."
            icon={<span className="w-10 h-10 text-ink-2">📄</span>}
            action={<Link href="/reviews/new"><Button className="btn-primary">Submit First Content</Button></Link>}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <Thead>
                <Tr className="border-b border-border">
                  <Th className="w-10 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">#</Th>
                  <Th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">Finding</Th>
                  <Th className="w-48 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">Type</Th>
                  <Th className="w-32 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">Severity</Th>
                  <Th className="w-36 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">Status</Th>
                  <Th className="w-48 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">Submission</Th>
                  <Th className="w-40 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">Detected</Th>
                  <Th className="w-36 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary text-right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {allFindings.map((f, idx) => (
                  <Tr key={f.id} className="hover:bg-surface-hover/60 border-b border-border-soft transition-colors">
                    <Td className="py-3 px-4 text-xs font-mono text-ink-3">{idx + 1}</Td>
                    <Td className="py-3 px-4">
                      <Link href={`/reviews/${f.submission.id}/findings/${f.id}`} className="font-medium text-ink-dark hover:text-accent transition-colors text-sm block truncate max-w-[300px]">
                        {f.title}
                      </Link>
                      <p className="text-xs text-ink-secondary mt-0.5 truncate max-w-[300px]">{f.excerpt}</p>
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
                    <Td className="py-3 px-4 text-xs text-ink-secondary">
                      <Link href={`/reviews/${f.submission.reference || f.submission.id}`} className="font-medium text-ink hover:text-accent truncate block max-w-[150px]">
                        {f.submission.title}
                      </Link>
                      <span className="font-mono text-[10px] text-ink-muted bg-surface-subtle px-1.5 py-0.5 rounded mt-0.5 inline-block border border-border/50">
                        {getSubmissionReference(f.submission)}
                      </span>
                    </Td>
                    <Td className="py-3 px-4 text-xs text-ink-muted font-medium">
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
    low: 'bg-supported/10 text-supported border-supported/20',
    medium: 'bg-unverified/10 text-unverified border-unverified/20',
    high: 'bg-contradicted/10 text-contradicted border-contradicted/20',
    neutral: 'bg-brand/10 text-brand border-brand/20',
  };
  return (
    <div className={`card p-3.5 rounded-xl border ${variantColors[variant]} shadow-sm`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider">{title}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="text-2xl font-bold font-jakarta tnums mt-1">{value}</div>
    </div>
  );
}

function FilterBadge({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${active ? 'bg-accent text-white border-accent' : 'bg-surface border-border text-ink-secondary hover:bg-surface-hover'}`}>
      {label}
    </span>
  );
}

function SeverityBadge({ severity, count }: { severity: string; count: number }) {
  const colors = {
    HIGH: 'bg-contradicted/10 text-contradicted border-contradicted/20',
    MEDIUM: 'bg-unverified/10 text-unverified border-unverified/20',
    LOW: 'bg-supported/10 text-supported border-supported/20',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${colors[severity as keyof typeof colors] || 'bg-brand/10 text-brand border-brand/20'}`}>
      {severity} ({count})
    </span>
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
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
