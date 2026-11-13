import { storage } from '@/lib/db/adaptor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import Link from 'next/link';

export default async function GuidelinesPage() {
  const ws = await storage.getDemoWorkspace();
  const guidelines = ws ? await storage.listGuidelines(ws.id) : [];
  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink-dark">Brand Guidelines</h2>
          <p className="text-ink-secondary">Manage brand voice, tone, terminology, and rules.</p>
        </div>
        <Link href="/(dashboard)/guidelines/new">
          <Button>+ Add guideline</Button>
        </Link>
      </div>
      <div className="card">
        <div className="overflow-x-auto">
          <Table>
            <Thead>
              <Tr>
                <Th className="w-48">Rule code</Th>
                <Th>Title</Th>
                <Th className="w-48">Category</Th>
                <Th className="w-32">Severity</Th>
                <Th className="w-48">Status</Th>
                <Th className="w-56 text-right">Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {guidelines.length === 0 ? (
                <Tr><Td className="text-ink-secondary py-8 text-center">No guidelines defined.</Td></Tr>
              ) : (
                guidelines.map((g) => (
                  <Tr key={g.id} className="hover:bg-surface-subtle/50">
                    <Td className="font-medium text-ink-dark mono">{g.rule_code}</Td>
                    <Td><Link href={`/(dashboard)/guidelines/${g.id}`}>{g.title}</Link></Td>
                    <Td className="text-ink-secondary text-sm">{g.category}</Td>
                    <Td><Badge variant={g.severity === 'HIGH' ? 'high' : g.severity === 'MEDIUM' ? 'medium' : 'low'}>{g.severity}</Badge></Td>
                    <Td><Badge variant={g.active ? 'low' : 'neutral'}>{g.active ? 'Active' : 'Inactive'}</Badge></Td>
                    <Td className="text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </Td>
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
