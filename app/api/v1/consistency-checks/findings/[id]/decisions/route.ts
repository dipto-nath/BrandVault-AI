import { NextRequest, NextResponse } from 'next/server';
import { ConsistencyStore } from '@/lib/ai/consistency-store';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { decision } = body;

  const validDecisions = ['CONFIRMED', 'FALSE_POSITIVE', 'NEEDS_CONTEXT', 'RESOLVED'];
  if (!validDecisions.includes(decision)) {
    return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
  }

  const ok = ConsistencyStore.updateFindingStatus(id, decision);
  if (!ok) {
    return NextResponse.json({ error: 'Finding not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, decision });
}
