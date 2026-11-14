import { storage } from '@/lib/db/adaptor';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { formatDateTime } from '@/lib/utils';
import { Shield, ArrowRight } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export default async function PassportsPage() {
  const ws = await storage.getDemoWorkspace();
  const submissions = ws ? await storage.listSubmissions(ws.id) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink-dark">Brand Evidence Passports</h2>
          <p className="text-sm text-ink-secondary mt-0.5">
            Immutable, traceable verification records preserving citations, factual claim states, and human sign-off.
          </p>
        </div>
      </div>

      <Card className="bg-surface border border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {submissions.length === 0 ? (
              <EmptyState
                title="No Passports Generated"
                description="Passports are automatically generated when content submissions are evaluated against brand knowledge."
                action={
                  <Link href="/reviews/new">
                    <Button variant="outline" size="sm" className="text-xs">
                      Create Submission
                    </Button>
                  </Link>
                }
              />
            ) : (
              <Table>
                <Thead>
                  <Tr>
                    <Th className="w-36">Passport ID</Th>
                    <Th className="w-2/5">Content Title</Th>
                    <Th className="w-32">Channel</Th>
                    <Th className="w-32">Review Status</Th>
                    <Th className="w-28">Risk Level</Th>
                    <Th className="w-32">Certified Date</Th>
                    <Th className="w-28 text-right">Certificate</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {submissions.map((s) => (
                    <Tr key={s.id} className="hover:bg-surface-hover">
                      <Td className="font-mono text-xs font-bold text-ink-dark">
                        BVP-{s.id.slice(0, 8).toUpperCase()}
                      </Td>
                      <Td>
                        <Link
                          href={`/passports/${s.id}`}
                          className="font-semibold text-ink-dark hover:text-accent hover:underline text-sm block"
                        >
                          {s.title}
                        </Link>
                        <span className="text-xs text-ink-secondary">
                          {s.content_type}
                        </span>
                      </Td>
                      <Td className="text-xs text-ink-secondary">
                        {s.channel}
                      </Td>
                      <Td>
                        <Badge variant={statusToVariant(s.status)}>
                          {s.status}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge variant={s.risk_level === 'HIGH' ? 'high' : s.risk_level === 'MEDIUM' ? 'medium' : 'low'}>
                          {s.risk_level || 'LOW'}
                        </Badge>
                      </Td>
                      <Td className="text-xs text-ink-secondary">
                        {formatDateTime(s.created_at)}
                      </Td>
                      <Td className="text-right">
                        <Link href={`/passports/${s.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs text-accent hover:bg-accent-soft flex items-center gap-1 ml-auto">
                            <span>Passport</span>
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
