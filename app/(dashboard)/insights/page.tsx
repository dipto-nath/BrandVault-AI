import { getInsights, TimeRange } from '@/lib/services/insights';
import { InsightsManager } from '@/components/insights/insights-manager';
import { getRequestContext } from '@/lib/auth';

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; rule?: string }>;
}) {
  const ctx = await getRequestContext();
  const workspaceId = ctx.workspaceId;
  const resolvedParams = await searchParams;
  const rangeParam = (resolvedParams.range || '30d') as TimeRange;
  const range: TimeRange = ['7d', '30d', '90d', 'all'].includes(rangeParam) ? rangeParam : '30d';

  const initialData = await getInsights(workspaceId, range);

  return (
    <InsightsManager
      initialData={initialData}
      initialRuleParam={resolvedParams.rule || null}
    />
  );
}
