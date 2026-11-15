import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/db/adaptor';
import { z } from 'zod';
import { getRequestContext } from '@/lib/auth';
import { cookies } from 'next/headers';

const ReviewSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED', 'CHANGES_REQUESTED']),
  comment: z.string().optional(),
  revised_content: z.string().optional(),
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

    if (parsed.revised_content && parsed.revised_content.trim() && parsed.revised_content !== submission.current_content) {
      const existingVersions = await storage.listVersions(id);
      await storage.createVersion({
        workspace_id: ctx.workspaceId,
        submission_id: id,
        version_number: existingVersions.length + 1,
        content: parsed.revised_content,
        created_by: ctx.userId,
        change_reason: parsed.decision === 'APPROVED' ? 'Approved revised draft' : 'Reviewer revisions',
      });
      await storage.updateSubmission(id, {
        current_content: parsed.revised_content,
        status: parsed.decision,
        reviewer_id: ctx.userId,
      });
    } else {
      await storage.updateSubmission(id, {
        status: parsed.decision,
        reviewer_id: ctx.userId,
      });
    }

    // Persist update in cookie bridge for serverless container continuity
    try {
      const cookieStore = await cookies();
      const recentRaw = cookieStore.get('bv_recent_sub')?.value;
      if (recentRaw) {
        const decoded = JSON.parse(decodeURIComponent(recentRaw));
        if (decoded.id === id) {
          decoded.status = parsed.decision;
          if (parsed.revised_content) {
            decoded.currentContent = parsed.revised_content;
          }
          cookieStore.set('bv_recent_sub', encodeURIComponent(JSON.stringify(decoded)), {
            path: '/',
            maxAge: 3600,
            sameSite: 'lax',
          });
        }
      }
    } catch {
      // Cookie update is best-effort
    }

    return NextResponse.json({ success: true, status: parsed.decision, previousStatus });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Review failed' }, { status: 500 });
  }
}
