import { storage } from '@/lib/db/adaptor';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { formatDateTime, getPassportReference, statusToVariant } from '@/lib/utils';
import { Shield, ArrowRight } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export default async function PassportsPage() {
  const ws = await storage.getDemoWorkspace();
  const submissions = ws ? await storage.listSubmissions(ws.id) : [];

  const total = submissions.length;
  const certified = submissions.filter(s => s.status === 'APPROVED').length;
  const underReview = submissions.filter(s => s.status === 'NEEDS_REVIEW' || s.status === 'CHANGES_REQUESTED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-accent ring-4 ring-accent/20" />
            <span className="text-xs font-bold text-accent uppercase tracking-wider">
              Cryptographic Audit Trail
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-jakarta text-ink-dark tracking-tight">
            Brand Evidence Passports
          </h1>
          <p className="text-sm text-ink-secondary mt-1 max-w-2xl leading-relaxed">
            Immutable, traceable verification records preserving citations, factual claim states, and human sign-off signatures for publishing accountability.
          </p>
        </div>
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-3.5 bg-surface border border-border rounded-xl shadow-sm">
          <div className="text-[11px] font-bold text-ink-secondary uppercase tracking-wider">Passports Generated</div>
          <div className="text-2xl font-bold font-jakarta text-ink-dark tnums mt-1">{total}</div>
        </div>
        <div className="card p-3.5 bg-surface border border-border rounded-xl shadow-sm">
          <div className="text-[11px] font-bold text-success uppercase tracking-wider">Certified Compliant</div>
          <div className="text-2xl font-bold font-jakarta text-success tnums mt-1">{certified}</div>
        </div>
        <div className="card p-3.5 bg-surface border border-border rounded-xl shadow-sm">
          <div className="text-[11px] font-bold text-warning uppercase tracking-wider">Pending Audit</div>
          <div className="text-2xl font-bold font-jakarta text-warning tnums mt-1">{underReview}</div>
        </div>
        <div className="card p-3.5 bg-surface border border-border rounded-xl shadow-sm">
          <div className="text-[11px] font-bold text-accent uppercase tracking-wider">Tamper Protection</div>
          <div className="text-2xl font-bold font-jakarta text-accent tnums mt-1">100% SHA-256</div>
        </div>
      </div>

      {/* Passports Table Card */}
      <Card className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {submissions.length === 0 ? (
              <EmptyState
                title="No Passports Generated Yet"
                description="Passports are automatically minted when content submissions are evaluated against brand knowledge specifications."
                action={
                  <Link href="/reviews/new">
                    <Button variant="outline" size="sm" className="bg-surface hover:bg-surface-hover text-xs font-semibold">
                      Create Submission
                    </Button>
                  </Link>
                }
              />
            ) : (
              <Table>
                <Thead>
                  <Tr className="bg-surface-subtle/80 border-b border-border">
                    <Th className="w-40 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">Passport ID</Th>
                    <Th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">Content Title</Th>
                    <Th className="w-32 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">Channel</Th>
                    <Th className="w-32 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">Review Status</Th>
                    <Th className="w-28 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">Risk Level</Th>
                    <Th className="w-36 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">Certified Date</Th>
                    <Th className="w-32 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary text-right">Certificate</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {submissions.map((s) => (
                    <Tr key={s.id} className="hover:bg-surface-hover/60 border-b border-border-soft transition-colors">
                      <Td className="py-3 px-4 font-mono text-xs font-bold text-ink-dark">
                        <span className="bg-surface-subtle px-2 py-1 rounded border border-border text-accent font-semibold">
                          {getPassportReference(s)}
                        </span>
                      </Td>
                      <Td className="py-3 px-4">
                        <Link
                          href={`/passports/${s.passport_reference || s.id}`}
                          className="font-bold text-ink-dark hover:text-accent transition-colors text-sm block tracking-tight"
                        >
                          {s.title}
                        </Link>
                        <span className="text-xs text-ink-muted">
                          {s.content_type}
                        </span>
                      </Td>
                      <Td className="py-3 px-4 text-xs text-ink-secondary font-medium">
                        {s.channel}
                      </Td>
                      <Td className="py-3 px-4">
                        <Badge variant={statusToVariant(s.status)}>
                          {s.status}
                        </Badge>
                      </Td>
                      <Td className="py-3 px-4">
                        <Badge variant={s.risk_level === 'HIGH' ? 'high' : s.risk_level === 'MEDIUM' ? 'medium' : 'low'}>
                          {s.risk_level || 'LOW'}
                        </Badge>
                      </Td>
                      <Td className="py-3 px-4 text-xs text-ink-muted font-medium">
                        {s.status === 'APPROVED' ? formatDateTime(s.updated_at || s.created_at) : <span className="italic opacity-60">Pending approval</span>}
                      </Td>
                      <Td className="py-3 px-4 text-right">
                        <Link href={`/passports/${s.passport_reference || s.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs text-accent hover:bg-accent-soft flex items-center gap-1.5 ml-auto font-semibold">
                            <span>Inspect</span>
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
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
