import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/db/adaptor';
import { z } from 'zod';
import { getRequestContext } from '@/lib/auth';

const FeedbackSchema = z.object({
  feedback_type: z.enum(['ACCEPTED', 'OVERRIDDEN', 'EDITED_CORRECTION', 'REJECTED_CORRECTION', 'MARKED_AMBIGUOUS']),
  reason: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const ctx = await getRequestContext();
    const body = await req.json();
    const parsed = FeedbackSchema.parse(body);
    const finding = await storage.getFinding(id);
    if (!finding || finding.workspace_id !== ctx.workspaceId) {
      return NextResponse.json({ error: 'Finding not found' }, { status: 404 });
    }
    await storage.createFindingFeedback({
      workspace_id: ctx.workspaceId,
      finding_id: id,
      user_id: ctx.userId,
      feedback_type: parsed.feedback_type,
      reason: parsed.reason ?? null,
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Feedback failed' }, { status: 500 });
  }
}
