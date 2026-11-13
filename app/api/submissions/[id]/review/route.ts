import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/db/adaptor';
import { z } from 'zod';
import { getRequestContext } from '@/lib/auth';

const ReviewSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED', 'CHANGES_REQUESTED']),
  comment: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const ctx = await getRequestContext();
    const body = await req.json();
    const parsed = ReviewSchema.parse(body);
    const submission = await storage.getSubmission(id);
    if (!submission || submission.workspace_id !== ctx.workspaceId) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }
    const previousStatus = submission.status;
    await storage.createReviewDecision({
      workspace_id: ctx.workspaceId,
      submission_id: id,
      reviewer_id: ctx.userId,
      decision: parsed.decision,
      comment: parsed.comment ?? null,
    });
    await storage.updateSubmission(id, {
      status: parsed.decision,
      reviewer_id: ctx.userId,
    });
    return NextResponse.json({ success: true, status: parsed.decision, previousStatus });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Review failed' }, { status: 500 });
  }
}
