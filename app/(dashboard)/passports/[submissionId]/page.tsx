import { storage } from '@/lib/db/adaptor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import Link from 'next/link';
import { formatDateTime } from '@/lib/utils';
import { Printer } from 'lucide-react';

export default async function PassportDetailPage({ params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await params;
  const submission = await storage.getSubmission(submissionId);
  if (!submission) return <div className="card p-12">Passport not found.</div>;
  const [claims, findings, decisions, versions, runs] = await Promise.all([
    storage.listClaims(submissionId),
    storage.listFindings(submissionId),
    storage.listReviewDecisions(submissionId),
    storage.listVersions(submissionId),
    storage.listAnalysisRuns(submissionId),
  ]);
  return (
    <div className="space-y-6 max-w-4xl no-print">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-dark">Brand Evidence Passport</h1>
          <p className="text-ink-secondary">Passport ID: <span className="font-medium text-ink-dark mono">PASS-{submission.id.slice(0, 8)}</span></p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-icon" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />
          </button>
          <Link href={`/(dashboard)/reviews/${submissionId}`}><Button variant="outline" size="sm">Back to review</Button></Link>
        </div>
      </div>

      <Card>
        <h3 className="font-semibold text-ink-dark mb-2">Submission</h3>
        <div className="grid gap-4 lg:grid-cols-4 text-sm mb-4">
          <div><div className="text-xs text-ink-secondary">Workspace</div><div className="text-ink-dark">NexaTech (demo)</div></div>
          <div><div className="text-xs text-ink-secondary">Content type</div><div className="text-ink-dark">{submission.content_type}</div></div>
          <div><div className="text-xs text-ink-secondary">Channel</div><div className="text-ink-dark">{submission.channel}</div></div>
          <div><div className="text-xs text-ink-secondary">Submitted</div><div className="text-ink-dark">{formatDateTime(submission.created_at)}</div></div>
        </div>
        <div className="mb-4">
          <div className="text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-1">Original content</div>
          <div className="rounded-lg border border-border bg-surface p-4 font-sans text-sm leading-relaxed text-ink whitespace-pre-wrap break-words">{submission.original_content}</div>
        </div>
        {submission.current_content !== submission.original_content && (
          <div className="mb-4">
            <div className="text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-1">Revised content</div>
            <div className="rounded-lg border border-border bg-surface p-4 font-sans text-sm leading-relaxed text-ink whitespace-pre-wrap break-words">{submission.current_content}</div>
          </div>
        )}
      </Card>

      <Card>
        <h3 className="font-semibold text-ink-dark mb-4">Verification claims ({claims.length})</h3>
        <div className="overflow-x-auto">
          <Table>
            <Thead>
              <Tr><Th>Claim</Th><Th className="w-64">Type</Th><Th className="w-64">Status</Th><Th className="w-64">Confidence</Th></Tr>
            </Thead>
            <Tbody>
              {claims.length === 0 ? <Tr><Td className="text-ink-secondary py-8 text-center">No claims extracted.</Td></Tr> : claims.map((c) => (
                <Tr key={c.id} className="hover:bg-surface-subtle/50">
                  <Td className="text-sm text-ink-dark">{c.claim_text}</Td>
                  <Td className="text-ink-secondary text-sm">{c.claim_type}</Td>
                  <Td><Badge variant={c.verification_status === 'SUPPORTED' ? 'low' : c.verification_status === 'CONTRADICTED' ? 'high' : 'medium'}>{c.verification_status}</Badge></Td>
                  <Td className="text-ink-secondary text-sm">{Math.round((c.confidence ?? 0) * 100)}%</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-ink-dark mb-4">Findings ({findings.length})</h3>
        <div className="overflow-x-auto">
          <Table>
            <Thead>
              <Tr><Th className="w-64">Title</Th><Th className="w-48">Category</Th><Th className="w-40">Severity</Th><Th>Suggested correction</Th></Tr>
            </Thead>
            <Tbody>
              {findings.length === 0 ? <Tr><Td className="text-ink-secondary py-8 text-center">No findings.</Td></Tr> : findings.map((f) => (
                <Tr key={f.id} className="hover:bg-surface-subtle/50">
                  <Td className="font-medium text-ink-dark text-sm">{f.title}</Td>
                  <Td className="text-ink-secondary text-sm">{f.finding_type.replace(/_/g, ' ')}</Td>
                  <Td><Badge variant={f.severity === 'HIGH' ? 'high' : f.severity === 'MEDIUM' ? 'medium' : 'low'}>{f.severity}</Badge></Td>
                  <Td className="text-ink-secondary text-sm">{f.suggested_correction || '—'}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-ink-dark mb-4">Human review decisions ({decisions.length})</h3>
        <div className="space-y-3">
          {decisions.length === 0 ? (
            <p className="text-ink-secondary">No human review decisions recorded.</p>
          ) : (
            decisions.map((d) => (
              <div key={d.id} className="flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-surface">
                <div>
                  <div className="text-sm font-medium text-ink-dark">{d.decision}</div>
                  <div className="text-xs text-ink-secondary">{d.comment || 'No comment'} · {formatDateTime(d.created_at)}</div>
                </div>
                <Badge variant="neutral">{d.decision}</Badge>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-ink-dark mb-4">Version history ({versions.length})</h3>
        <div className="overflow-x-auto">
          <Table>
            <Thead>
              <Tr><Th className="w-48">Version</Th><Th>Change reason</Th><Th className="w-64">Created</Th></Tr>
            </Thead>
            <Tbody>
              {versions.map((v) => (
                <Tr key={v.id} className="hover:bg-surface-subtle/50">
                  <Td className="font-medium text-ink-dark text-sm">v{v.version_number}</Td>
                  <Td className="text-ink-secondary text-sm">{v.change_reason || '—'}</Td>
                  <Td className="text-ink-secondary text-sm">{formatDateTime(v.created_at)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
