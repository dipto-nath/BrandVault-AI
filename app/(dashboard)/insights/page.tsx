import { storage } from '@/lib/db/adaptor';
import { getInsights } from '@/lib/services/insights';
import { InsightsManager } from '@/components/insights/insights-manager';

export default async function InsightsPage() {
  const ws = await storage.getDemoWorkspace();
  const workspaceId = ws?.id || '11111111-1111-1111-1111-111111111111';

  const [insightsStats, rawSuggestions, guidelines] = await Promise.all([
    getInsights(workspaceId),
    storage.listGuidelineSuggestions(workspaceId),
    storage.listGuidelines(workspaceId),
  ]);

  return (
    <InsightsManager
      stats={insightsStats}
      suggestions={rawSuggestions}
      guidelines={guidelines}
    />
  );
}
