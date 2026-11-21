import { NextRequest, NextResponse } from 'next/server';
import { ConsistencyStore } from '@/lib/ai/consistency-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const force = Boolean(body?.force);
    const result = ConsistencyStore.seedSampleData(force);
    return NextResponse.json({
      success: true,
      message: 'Demo sandbox sample data loaded successfully',
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to seed sample data' }, { status: 500 });
  }
}
