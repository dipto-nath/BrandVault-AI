import { NextRequest, NextResponse } from 'next/server';
import { getInsights, TimeRange } from '@/lib/services/insights';
import { getRequestContext } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const url = new URL(req.url);
    const rangeParam = (url.searchParams.get('range') || '30d') as TimeRange;
    const range: TimeRange = ['7d', '30d', '90d', 'all'].includes(rangeParam) ? rangeParam : '30d';

    const data = await getInsights(ctx.workspaceId, range);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Insights failed' }, { status: 500 });
  }
}
