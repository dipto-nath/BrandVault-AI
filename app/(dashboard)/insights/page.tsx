import { storage } from '@/lib/db/adaptor';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

export default async function InsightsPage() {
  const ws = await storage.getDemoWorkspace();
  const submissions = ws ? await storage.listSubmissions(ws.id) : [];
  const totalFeedback = 0;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink-dark">Governance Insights</h2>
        <p className="text-ink-secondary">Aggregated reviewer feedback and guideline intelligence.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard title="Submissions" value={submissions.length} />
        <StatCard title="Approved" value={submissions.filter((s) => s.status === 'APPROVED').length} />
        <StatCard title="Rejected" value={submissions.filter((s) => s.status === 'REJECTED').length} />
        <StatCard title="Feedback" value={totalFeedback} />
      </div>
      <div className="card">
        <h3 className="font-semibold text-ink-dark mb-4">Top feedback reasons</h3>
        <EmptyState title="No feedback recorded" description="Reviewer feedback will appear here once findings are reviewed." />
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <div className="p-6">
        <div className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">{title}</div>
        <div className="text-2xl font-bold tnums text-ink-dark mt-1">{value}</div>
      </div>
    </Card>
  );
}
