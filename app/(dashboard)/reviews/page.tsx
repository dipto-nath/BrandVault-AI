import { storage } from '@/lib/db/adaptor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import Link from 'next/link';
import { formatRelative, getStatusLabel, getSubmissionReference, getPassportReference } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, Shield, ChevronRight, X } from 'lucide-react';

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; risk?: string }>;
}) {
  const ws = await storage.getDemoWorkspace();
  const submissions = ws ? await storage.listSubmissions(ws.id) : [];
  const params = (await searchParams) || {};
  const { status, risk } = params;

  let filtered = submissions;
  if (status) {
    filtered = filtered.filter((s) => s.status === status);
  }
  if (risk) {
    filtered = filtered.filter((s) => s.risk_level === risk);
  }

  const total = submissions.length;
  const pending = submissions.filter(s => s.status === 'NEEDS_REVIEW' || s.status === 'CHANGES_REQUESTED').length;
  const approved = submissions.filter(s => s.status === 'APPROVED').length;
  const rejected = submissions.filter(s => s.status === 'REJECTED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-accent ring-4 ring-accent/20" />
            <span className="text-xs font-bold text-accent uppercase tracking-wider">
              Verification Pipeline
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-jakarta text-ink-dark tracking-tight">
            Content Reviews Registry
          </h1>
          <p className="text-sm text-ink-secondary mt-1 max-w-2xl leading-relaxed">
            All submitted marketing and product copy with automated evidence verification, factual contradiction detection, and reviewer sign-offs.
          </p>
        </div>
        <Link href="/reviews/new">
          <Button className="btn-primary text-sm flex items-center gap-2 shadow-sm shadow-accent/20">
            <Plus className="w-4 h-4 text-white" />
            <span>Submit for Review</span>
          </Button>
        </Link>
      </div>

      {/* Mini Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-3.5 bg-surface border border-border rounded-xl shadow-sm">
          <div className="text-[11px] font-bold text-ink-secondary uppercase tracking-wider">Total Evaluated</div>
          <div className="text-2xl font-bold font-jakarta text-ink-dark tnums mt-1">{total}</div>
        </div>
        <div className="card p-3.5 bg-surface border border-border rounded-xl shadow-sm">
          <div className="text-[11px] font-bold text-warning uppercase tracking-wider">Needs Review</div>
          <div className="text-2xl font-bold font-jakarta text-warning tnums mt-1">{pending}</div>
        </div>
        <div className="card p-3.5 bg-surface border border-border rounded-xl shadow-sm">
          <div className="text-[11px] font-bold text-success uppercase tracking-wider">Approved</div>
          <div className="text-2xl font-bold font-jakarta text-success tnums mt-1">{approved}</div>
        </div>
        <div className="card p-3.5 bg-surface border border-border rounded-xl shadow-sm">
          <div className="text-[11px] font-bold text-critical uppercase tracking-wider">Rejected</div>
          <div className="text-2xl font-bold font-jakarta text-critical tnums mt-1">{rejected}</div>
        </div>
      </div>

      {/* Active Filter Indicator */}
      {(status || risk) && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-surface border border-accent/30 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-accent">Active Filter:</span>
            {status && (
              <Badge variant={statusVariant(status)}>
                Status: {getStatusLabel(status)}
              </Badge>
            )}
            {risk && (
              <Badge variant={risk === 'HIGH' ? 'high' : risk === 'MEDIUM' ? 'medium' : 'low'}>
                Risk: {risk}
              </Badge>
            )}
            <span className="text-ink-secondary">({filtered.length} matching)</span>
          </div>
          <Link href="/reviews">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-ink-secondary hover:text-ink flex items-center gap-1">
              <X className="w-3.5 h-3.5" />
              <span>Clear Filter</span>
            </Button>
          </Link>
        </div>
      )}

      {/* Submissions Card & Table */}
      <Card className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {filtered.length === 0 ? (
              <EmptyState
                title={status || risk ? "No matching submissions found" : "No submissions registered yet"}
                description={
                  status || risk
                    ? `No submissions match the filter for ${status ? `status "${status}"` : ''}${status && risk ? ' and ' : ''}${risk ? `risk "${risk}"` : ''}.`
                    : "Submit marketing copy or press releases to run automated fact-checking against the approved knowledge layer."
                }
                action={
                  status || risk ? (
                    <Link href="/reviews">
                      <Button variant="outline" size="sm" className="bg-surface hover:bg-surface-hover text-xs font-semibold">
                        Clear Filters
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/reviews/new">
                      <Button variant="outline" size="sm" className="bg-surface hover:bg-surface-hover text-xs font-semibold">
                        Open Review Studio
                      </Button>
                    </Link>
                  )
                }
              />
            ) : (
              <Table>
                <Thead>
                  <Tr className="bg-surface-subtle/80 border-b border-border">
                    <Th className="w-2/5 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">Title & Reference</Th>
                    <Th className="w-36 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">Type / Channel</Th>
                    <Th className="w-32 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">Status</Th>
                    <Th className="w-28 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">Risk Level</Th>
                    <Th className="w-28 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">Updated</Th>
                    <Th className="w-36 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary text-right">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filtered.map((s) => (
                    <Tr key={s.id} className="hover:bg-surface-hover/60 border-b border-border-soft transition-colors">
                      <Td className="py-3 px-4">
                        <Link
                          href={`/reviews/${s.reference || s.id}`}
                          className="font-bold text-ink-dark hover:text-accent transition-colors text-sm block tracking-tight"
                        >
                          {s.title}
                        </Link>
                        <span className="font-mono text-[11px] text-ink-muted bg-surface-subtle px-1.5 py-0.5 rounded mt-1 inline-block border border-border/50">
                          {getSubmissionReference(s)}
                        </span>
                      </Td>
                      <Td className="py-3 px-4 text-xs text-ink-secondary">
                        <span className="font-semibold text-ink-dark block">{s.content_type}</span>
                        {s.channel && !s.content_type.toLowerCase().includes(s.channel.toLowerCase()) && (
                          <span className="inline-block px-1.5 py-0.5 mt-0.5 rounded text-[10px] bg-surface-subtle text-ink-muted border border-border/40 font-medium">{s.channel}</span>
                        )}
                      </Td>
                      <Td className="py-3 px-4">
                        <Badge variant={statusVariant(s.status)}>
                          {getStatusLabel(s.status)}
                        </Badge>
                      </Td>
                      <Td className="py-3 px-4">
                        <Badge variant={s.risk_level === 'HIGH' ? 'high' : s.risk_level === 'MEDIUM' ? 'medium' : 'low'}>
                          {s.risk_level || 'LOW'}
                        </Badge>
                      </Td>
                      <Td className="py-3 px-4 text-xs text-ink-muted font-medium">
                        {formatRelative(s.updated_at || s.created_at)}
                      </Td>
                      <Td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/reviews/${s.reference || s.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-semibold hover:bg-surface-hover">
                              Review
                            </Button>
                          </Link>
                          <Link href={`/passports/${s.passport_reference || s.id}`} aria-label={`Open passport for ${s.title}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2.5 text-xs text-accent hover:bg-accent-soft flex items-center gap-1.5"
                              title={`View Brand Evidence Passport for ${s.title}`}
                            >
                              <Shield className="w-3.5 h-3.5" />
                              <span>Passport</span>
                            </Button>
                          </Link>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function statusVariant(s: string): 'low' | 'medium' | 'high' | 'neutral' {
  switch (s) {
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
