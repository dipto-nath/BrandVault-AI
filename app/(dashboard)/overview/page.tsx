import { storage } from '@/lib/db/adaptor';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Clock, ShieldAlert, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { formatRelative } from '@/lib/utils';

export default async function OverviewPage() {
  const ws = await storage.getDemoWorkspace();
  const workspaceId = ws?.id;
  const data = workspaceId ? await storage.dashboardStats(workspaceId) : { total: 0, pending: 0, approved: 0, rejected: 0, highRisk: 0, recent: [] };
  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink-dark">Workspace overview</h2>
          <p className="text-ink-secondary">NexaTech — demo workspace. All data is fictional.</p>
        </div>
        <Link href="/(dashboard)/reviews/new">
          <Button className="ml-auto">Submit content</Button>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard title="Total submissions" value={data.total} icon={<FileText className="w-5 h-5" />} />
        <StatCard title="Pending review" value={data.pending} icon={<Clock className="w-5 h-5" />} />
        <StatCard title="Approved" value={data.approved} icon={<ShieldAlert className="w-5 h-5" />} />
        <StatCard title="High risk" value={data.highRisk} icon={<TriangleAlert className="w-5 h-5" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recent.length === 0 ? (
                <div className="text-center py-8 text-ink-secondary">No submissions yet.</div>
              ) : (
                data.recent.map((s: any) => (
                  <div key={s.id} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                    <div className="w-8 h-8 rounded bg-surface-subtle flex items-center justify-center text-xs font-medium text-ink-secondary">
                      {s.content_type?.slice(0, 1) || 'C'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink-dark truncate">{s.title}</div>
                      <div className="text-xs text-ink-secondary">{formatRelative(s.updated_at)} • {s.channel}</div>
                    </div>
                    <Badge variant={s.risk_level === 'HIGH' ? 'high' : s.risk_level === 'MEDIUM' ? 'medium' : 'low'}>{s.risk_level}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>What to do next</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded bg-accent-soft flex items-center justify-center text-accent text-xs font-medium mt-0.5">1</div>
              <div>
                <div className="text-sm font-medium text-ink-dark">Submit a draft</div>
                <div className="text-xs text-ink-secondary">Use Content Review Studio to paste content and run analysis.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded bg-accent-soft flex items-center justify-center text-accent text-xs font-medium mt-0.5">2</div>
              <div>
                <div className="text-sm font-medium text-ink-dark">Review findings</div>
                <div className="text-xs text-ink-secondary">Inspect extracted claims and linked evidence.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded bg-accent-soft flex items-center justify-center text-accent text-xs font-medium mt-0.5">3</div>
              <div>
                <div className="text-sm font-medium text-ink-dark">Approve or reject</div>
                <div className="text-xs text-ink-secondary">Human review is recorded in the Brand Evidence Passport.</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number | string; icon: React.ReactNode }) {
  return (
    <Card>
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
