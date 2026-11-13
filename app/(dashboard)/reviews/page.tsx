import { storage } from '@/lib/db/adaptor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import Link from 'next/link';
import { formatRelative } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, ShieldCheck, ChevronRight, FileText } from 'lucide-react';

export default async function ReviewsPage() {
  const ws = await storage.getDemoWorkspace();
  const submissions = ws ? await storage.listSubmissions(ws.id) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink-dark">Content Reviews Registry</h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            All submitted marketing and product content with verification status and risk classification.
          </p>
        </div>
        <Link href="/reviews/new">
          <Button className="btn-primary text-xs flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>Submit Content for Review</span>
          </Button>
        </Link>
      </div>

      <Card className="bg-surface border border-border">
        <div className="overflow-x-auto">
          {submissions.length === 0 ? (
            <EmptyState
              title="No submissions yet"
              description="Submit your first piece of content for automated evidence verification and human sign-off."
              action={
                <Link href="/reviews/new">
                  <Button variant="outline" size="sm" className="text-xs">
                    Open Content Review Studio
                  </Button>
                </Link>
              }
            />
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th className="w-2/5">Title & Reference</Th>
                  <Th className="w-36">Type / Channel</Th>
                  <Th className="w-32">Status</Th>
                  <Th className="w-28">Risk Level</Th>
                  <Th className="w-28">Updated</Th>
                  <Th className="w-36 text-right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {submissions.map((s) => (
                  <Tr key={s.id} className="hover:bg-surface-subtle/40">
                    <Td>
                      <Link
                        href={`/reviews/${s.id}`}
                        className="font-semibold text-ink-dark hover:text-accent hover:underline text-sm block"
                      >
                        {s.title}
                      </Link>
                      <span className="font-mono text-[11px] text-ink-secondary">
                        REV-{s.id.slice(0, 8).toUpperCase()}
                      </span>
                    </Td>
                    <Td className="text-xs text-ink-secondary">
                      <span className="font-medium text-ink-dark block">{s.content_type}</span>
                      <span className="text-[11px] text-ink-secondary">{s.channel}</span>
                    </Td>
                    <Td>
                      <Badge variant={statusVariant(s.status)}>
                        {getStatusLabel(s.status)}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge variant={s.risk_level === 'HIGH' ? 'high' : s.risk_level === 'MEDIUM' ? 'medium' : 'low'}>
                        {s.risk_level || 'LOW'}
                      </Badge>
                    </Td>
                    <Td className="text-xs text-ink-secondary">
                      {formatRelative(s.updated_at || s.created_at)}
                    </Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/reviews/${s.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs">
                            Review
                          </Button>
                        </Link>
                        <Link href={`/passports/${s.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-accent hover:bg-accent-soft"
                            title="View Brand Evidence Passport"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
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

function getStatusLabel(s: string) {
  const labels: Record<string, string> = {
    DRAFT: 'Draft',
    ANALYZING: 'Analysing',
    NEEDS_REVIEW: 'Needs Review',
    CHANGES_REQUESTED: 'Changes Req.',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    FAILED: 'Failed',
  };
  return labels[s] || s;
}
