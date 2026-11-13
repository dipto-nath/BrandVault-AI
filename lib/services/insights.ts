import { storage } from '@/lib/db/adaptor';

export async function getInsights(workspaceId: string) {
  const findings = await storage.listFindings(''); // will filter below
  const submissions = await storage.listSubmissions(workspaceId);
  const feedback = [];
  const suggestions = await storage.listGuidelineSuggestions(workspaceId);

  const findingFeedbackMap = new Map<string, any[]>();
  for (const s of submissions) {
    const fbs = await storage.listFindings(s.id);
    for (const f of fbs) {
      const fb = await storage.listFindingFeedback(f.id);
      if (fb.length) findingFeedbackMap.set(f.id, fb);
    }
  }

  const overrideCounts = new Map<string, number>();
  const reasonCounts = new Map<string, number>();
  for (const [fid, fbs] of findingFeedbackMap) {
    for (const fb of fbs) {
      overrideCounts.set(fid, (overrideCounts.get(fid) ?? 0) + 1);
      if (fb.reason) reasonCounts.set(fb.reason, (reasonCounts.get(fb.reason) ?? 0) + 1);
    }
  }

  const topReasons = [...reasonCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([reason, count]) => ({ reason, count }));
  const frequentlyOverridden = [...overrideCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([fid, count]) => ({ findingId: fid, count }));

  return {
    totalSubmissions: submissions.length,
    approved: submissions.filter((s) => s.status === 'APPROVED').length,
    rejected: submissions.filter((s) => s.status === 'REJECTED').length,
    pending: submissions.filter((s) => s.status === 'NEEDS_REVIEW' || s.status === 'CHANGES_REQUESTED').length,
    highRisk: submissions.filter((s) => s.risk_level === 'HIGH').length,
    totalFeedback: [...findingFeedbackMap.values()].reduce((a, b) => a + b.length, 0),
    topReasons,
    frequentlyOverridden,
    suggestions: suggestions.map((s) => ({ id: s.id, title: s.title, status: s.status, created_at: s.created_at })),
  };
}
