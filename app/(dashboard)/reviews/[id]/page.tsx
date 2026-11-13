import { storage } from '@/lib/db/adaptor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { formatDateTime, getRiskColor, getStatusLabel } from '@/lib/utils';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';
import { ShieldAlert, Clock, FileText, ChevronRight, Play, Copy } from 'lucide-react';

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const submission = await storage.getSubmission(id);
  if (!submission) {
    return <div className="card p-12">Submission not found.</div>;
  }
  const [claims, findings, runs, decisions] = await Promise.all([
    storage.listClaims(id),
    storage.listFindings(id),
    storage.listAnalysisRuns(id),
    storage.listReviewDecisions(id),
  ]);

  const latestRun = runs[0];
  const risk = submission.risk_level;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink-dark">Review: {submission.title}</h2>
          <p className="text-ink-secondary">Review #{submission.id.slice(0, 8)} · {submission.content_type} · {submission.channel}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/(dashboard)/reviews">
            <Button variant="outline" size="sm">← Back</Button>
          </Link>
          {latestRun && latestRun.status === 'COMPLETED' && (
            <Button>Re-run analysis</Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard title="Status" value={getStatusLabel(submission.status)} icon={<Clock className="w-5 h-5" />} />
        <StatCard title="Risk level" value={risk || '—'} icon={<ShieldAlert className="w-5 h-5" />} className={risk === 'HIGH' ? 'border-critical/30' : ''} />
        <StatCard title="Findings" value={findings.length} icon={<FileText className="w-5 h-5" />} />
        <StatCard title="Claims" value={claims.length} icon={<ShieldAlert className="w-5 h-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-accent" />
                <h3 className="font-semibold text-ink-dark">Original content</h3>
              </div>
              <span className="text-xs text-ink-secondary">Submitted {formatDateTime(submission.created_at)}</span>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4 font-sans text-sm leading-relaxed text-ink whitespace-pre-wrap break-words">
              {submission.original_content}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <h3 className="font-semibold text-ink-dark mb-4">Analysis</h3>
            {latestRun ? (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">Provider</div>
                  <div className="text-sm text-ink-dark">{latestRun.provider}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">Model</div>
                  <div className="text-sm text-ink-dark">{latestRun.model_name}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">Duration</div>
                  <div className="text-sm text-ink-dark">{latestRun.duration_ms} ms</div>
                </div>
              </div>
            ) : (
              <EmptyState title="No analysis" description="Run analysis to see results." />
            )}
          </Card>
        </div>
      </div>

      {findings.length > 0 ? (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-accent" />
            <h3 className="font-semibold text-ink-dark">Findings ({findings.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <Thead>
                <Tr>
                  <Th className="w-48">Title</Th>
                  <Th className="w-32">Category</Th>
                  <Th className="w-32">Severity</Th>
                  <Th className="w-48">Verification</Th>
                  <Th>Excerpt</Th>
                  <Th className="w-56 text-right">Action</Th>
                </Tr>
              </Thead>
              <Tbody>
                {findings.map((f) => (
                  <Tr key={f.id} className="hover:bg-surface-subtle/50">
                    <Td className="font-medium text-ink-dark">{f.title}</Td>
                    <Td className="text-ink-secondary text-sm">{f.finding_type.replace(/_/g, ' ')}</Td>
                    <Td><Badge variant={f.severity === 'HIGH' ? 'high' : f.severity === 'MEDIUM' ? 'medium' : 'low'}>{f.severity}</Badge></Td>
                    <Td><Badge variant="neutral" className="text-xs">{f.claim_id ? 'Linked claim' : 'Rule-based'}</Badge></Td>
                    <Td className="text-ink-secondary text-sm max-w-[200px] truncate" title={f.excerpt}>{f.excerpt}</Td>
                    <Td className="text-right">
                      <Link href={`/(dashboard)/reviews/${id}/findings/${f.id}`}>
                        <Button variant="ghost" size="sm">Inspect <ChevronRight className="w-3 h-3 ml-1" /></Button>
                      </Link>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        </div>
      ) : (
        <EmptyState title="No findings" description="This content has no brand findings." />
      )}

      <div className="mt-8">
        <h3 className="font-semibold text-ink-dark mb-4">Review decisions</h3>
        <div className="space-y-2">
          {decisions.length === 0 ? (
            <p className="text-ink-secondary">No review decisions yet.</p>
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
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, className }: { title: string; value: string | number; icon: React.ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-accent-soft flex items-center justify-center text-accent">{icon}</div>
        <div>
          <div className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">{title}</div>
          <div className="text-2xl font-bold tnums text-ink-dark">{value}</div>
        </div>
      </div>
    </Card>
  );
}
