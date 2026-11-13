import { storage } from '@/lib/db/adaptor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import Link from 'next/link';
import { formatRelative } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';

export default async function ReviewsPage() {
  const ws = await storage.getDemoWorkspace();
  const submissions = ws ? await storage.listSubmissions(ws.id) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink-dark">Content Reviews</h2>
          <p className="text-ink-secondary">All submitted content and their review status.</p>
        </div>
        <Link href="/(dashboard)/reviews/new">
          <Button>+ Submit content</Button>
        </Link>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          {submissions.length === 0 ? (
            <EmptyState
              title="No submissions yet"
              description="Submit your first piece of content for brand analysis."
              action={<Link href="/(dashboard)/reviews/new"><Button variant="outline" size="sm">Create submission</Button></Link>}
            />
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th className="w-[260px]">Title</Th>
                  <Th>Type / Channel</Th>
                  <Th className="w-64">Status</Th>
                  <Th className="w-48">Risk</Th>
                  <Th className="w-64">Updated</Th>
                  <Th className="w-48 text-right">Action</Th>
                </Tr>
              </Thead>
              <Tbody>
                {submissions.map((s) => (
                  <Tr key={s.id} className="group hover:bg-surface-subtle/50">
                    <Td className="font-medium text-ink-dark">
                      <Link href={`/(dashboard)/reviews/${s.id}`} className="hover:underline">
                        {s.title}
                      </Link>
                    </Td>
                    <Td className="text-ink-secondary text-sm">{s.content_type} · {s.channel}</Td>
                    <Td><Badge variant={statusVariant(s.status)}>{getStatusLabel(s.status)}</Badge></Td>
                    <Td><Badge variant={riskVariant(s.risk_level)}>{s.risk_level || '—'}</Badge></Td>
                    <Td className="text-ink-secondary text-sm">{formatRelative(s.updated_at)}</Td>
                    <Td className="text-right">
                      <Link href={`/(dashboard)/reviews/${s.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}

function statusVariant(s: string) {
  switch (s) {
    case 'APPROVED': return 'low';
    case 'REJECTED': return 'high';
    case 'NEEDS_REVIEW': return 'medium';
    case 'CHANGES_REQUESTED': return 'medium';
    case 'FAILED': return 'high';
    default: return 'neutral';
  }
}

function riskVariant(r: string | null) {
  switch (r) {
    case 'HIGH': return 'high';
    case 'MEDIUM': return 'medium';
    case 'LOW': return 'low';
    default: return 'neutral';
  }
}

function getStatusLabel(s: string) {
  const labels: Record<string, string> = {
    DRAFT: 'Draft', ANALYZING: 'Analysing', NEEDS_REVIEW: 'Needs Review',
    CHANGES_REQUESTED: 'Changes Requested', APPROVED: 'Approved', REJECTED: 'Rejected', FAILED: 'Failed',
  };
  return labels[s] || s;
}
