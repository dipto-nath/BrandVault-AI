import { storage } from '@/lib/db/adaptor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import Link from 'next/link';

export default async function KnowledgePage() {
  const ws = await storage.getDemoWorkspace();
  const facts = ws ? await storage.listFacts(ws.id) : [];
  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink-dark">Approved Knowledge</h2>
          <p className="text-ink-secondary">Verified facts and source material used as evidence.</p>
        </div>
        <Button>+ Add fact</Button>
      </div>
      <div className="card">
        <div className="overflow-x-auto">
          <Table>
            <Thead>
              <Tr>
                <Th className="w-48">Fact code</Th>
                <Th>Title</Th>
                <Th className="w-120">Entity</Th>
                <Th className="w-120">Source</Th>
                <Th className="w-64">Status</Th>
                <Th className="w-56 text-right">Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {facts.length === 0 ? (
                <Tr><Td className="text-ink-secondary py-8 text-center">No approved facts.</Td></Tr>
              ) : (
                facts.map((f) => (
                  <Tr key={f.id} className="hover:bg-surface-subtle/50">
                    <Td className="font-medium text-ink-dark mono">{f.fact_code}</Td>
                    <Td>{f.title}</Td>
                    <Td className="text-ink-secondary text-sm">{f.entity_name || '—'}</Td>
                    <Td className="text-ink-secondary text-sm">{f.source_name}</Td>
                    <Td><Badge variant={f.verification_status === 'APPROVED' ? 'low' : 'neutral'}>{f.verification_status}</Badge></Td>
                    <Td className="text-right"><Button variant="ghost" size="sm">Edit</Button></Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </div>
      </div>
      <div className="card mt-6">
        <h3 className="font-semibold text-ink-dark mb-4">Document upload</h3>
        <p className="text-ink-secondary text-sm mb-4">Upload PDF, DOCX or TXT files to extract knowledge for review.</p>
        <input type="file" className="input" accept=".pdf,.docx,.doc,.txt" />
      </div>
    </div>
  );
}
