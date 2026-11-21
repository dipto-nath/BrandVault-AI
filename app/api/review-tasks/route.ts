import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/db/adaptor';
import { getRequestContext } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const tasks = await storage.listReviewTasks(ctx.workspaceId, { status });
    return NextResponse.json({ tasks });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed fetching review tasks' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const body = await req.json();
    const { taskId, action } = body;
    if (!taskId) return NextResponse.json({ error: 'taskId required' }, { status: 400 });

    const status = action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED';
    const updated = await storage.updateReviewTask(taskId, { status });
    return NextResponse.json({ task: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed updating review task' }, { status: 500 });
  }
}
