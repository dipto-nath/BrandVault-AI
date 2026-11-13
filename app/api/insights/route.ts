import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/db/adaptor';
import { getRequestContext } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const submissions = await storage.listSubmissions(ctx.workspaceId);
    let totalFeedback = 0;
    const reasonCounts: Record<string, number> = {};
    for (const s of submissions) {
      const findings = await storage.listFindings(s.id);
      for (const f of findings) {
        const fb = await storage.listFindingFeedback(f.id);
        totalFeedback += fb.length;
        for (const x of fb) {
          if (x.reason) reasonCounts[x.reason] = (reasonCounts[x.reason] ?? 0) + 1;
        }
      }
    }
    const topReasons = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([reason, count]) => ({ reason, count }));
    const insights = {
      totalSubmissions: submissions.length,
      approved: submissions.filter((s) => s.status === 'APPROVED').length,
      rejected: submissions.filter((s) => s.status === 'REJECTED').length,
      pending: submissions.filter((s) => s.status === 'NEEDS_REVIEW' || s.status === 'CHANGES_REQUESTED').length,
      highRisk: submissions.filter((s) => s.risk_level === 'HIGH').length,
      totalFeedback,
      topReasons,
      suggestions: [],
    };
    return NextResponse.json(insights);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Insights failed' }, { status: 500 });
  }
}
