import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/db/adaptor';
import { z } from 'zod';
import { getRequestContext } from '@/lib/auth';

const FeedbackSchema = z.object({
  feedback_type: z.enum(['ACCEPTED', 'OVERRIDDEN', 'EDITED_CORRECTION', 'REJECTED_CORRECTION', 'MARKED_AMBIGUOUS']),
  reason: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const ctx = await getRequestContext();
    const finding = await storage.getFinding(id);
    if (!finding || finding.workspace_id !== ctx.workspaceId) {
      return NextResponse.json({ error: 'Finding not found' }, { status: 404 });
    }
    const feedback = await storage.listFindingFeedback(id);
    return NextResponse.json(feedback);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch feedback' }, { status: 500 });
  }
}

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
    
    // Enforce role-based permissions for OVERRIDDEN feedback
    if (parsed.feedback_type === 'OVERRIDDEN') {
      if (!['ADMIN', 'REVIEWER'].includes(ctx.role)) {
        return NextResponse.json(
          { error: 'Override requires Reviewer or Admin role' },
          { status: 403 }
        );
      }
      // Require a reason for override
      if (!parsed.reason || !parsed.reason.trim()) {
        return NextResponse.json(
          { error: 'Override requires a written reason' },
          { status: 400 }
        );
      }
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
