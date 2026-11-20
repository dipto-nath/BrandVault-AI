import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/db/adaptor';
import { runAnalysis } from '@/lib/services/submissions';
import { getRequestContext } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const ctx = await getRequestContext();
    const submission = await storage.getSubmission(id);
    if (!submission || submission.workspace_id !== ctx.workspaceId) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }
    const result = await runAnalysis(id, ctx.workspaceId, ctx.userId);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error(`Analysis failed for submission ${id}:`, err);
    return NextResponse.json({ error: err?.message || 'Analysis failed' }, { status: 500 });
  }
}
