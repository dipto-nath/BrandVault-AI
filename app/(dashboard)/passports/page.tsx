import { storage } from '@/lib/db/adaptor';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { formatDateTime } from '@/lib/utils';

export default async function PassportsPage() {
  const ws = await storage.getDemoWorkspace();
  const submissions = ws ? await storage.listSubmissions(ws.id) : [];
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink-dark">Brand Evidence Passports</h2>
        <p className="text-ink-secondary">Auditable records of every content review decision.</p>
      </div>
      <div className="card">
        <div className="overflow-x-auto">
          <Table>
            <Thead>
              <Tr>
                <Th className="w-48">Passport ID</Th>
                <Th>Content title</Th>
                <Th className="w-64">Status</Th>
                <Th className="w-48">Risk</Th>
                <Th className="w-64">Submitted</Th>
                <Th className="w-56 text-right">Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {submissions.length === 0 ? (
                <Tr><Td className="text-ink-secondary py-8 text-center">No passports yet.</Td></Tr>
              ) : (
                submissions.map((s) => (
                  <Tr key={s.id} className="hover:bg-surface-subtle/50">
                    <Td className="font-medium text-ink-dark mono">PASS-{s.id.slice(0, 8)}</Td>
                    <Td><Link href={`/(dashboard)/passports/${s.id}`}>{s.title}</Link></Td>
                    <Td><Badge variant="neutral">{s.status}</Badge></Td>
                    <Td><Badge variant={s.risk_level === 'HIGH' ? 'high' : s.risk_level === 'MEDIUM' ? 'medium' : 'low'}>{s.risk_level || '—'}</Badge></Td>
                    <Td className="text-ink-secondary text-sm">{formatDateTime(s.created_at)}</Td>
                    <Td className="text-right"><Link href={`/(dashboard)/passports/${s.id}`}><Button variant="ghost" size="sm">View</Button></Link></Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </div>
      </div>
    </div>
  );
}
