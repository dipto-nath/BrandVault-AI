import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/db/adaptor';
import { z } from 'zod';
import { getRequestContext } from '@/lib/auth';

const ApplySchema = z.object({
  corrections: z.array(z.object({
    findingId: z.string().optional(),
    originalExcerpt: z.string(),
    correctedExcerpt: z.string(),
    applied: z.boolean(),
  })).optional(),
  content: z.string().optional(),
  corrected_content: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const ctx = await getRequestContext();
    const body = await req.json();
    const parsed = ApplySchema.parse(body);
    const submission = await storage.getSubmission(id);
    if (!submission || submission.workspace_id !== ctx.workspaceId) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    let newContent = parsed.corrected_content || parsed.content || submission.current_content;
    if (parsed.corrections && parsed.corrections.length > 0) {
      const applied = parsed.corrections.filter((c) => c.applied);
      for (const c of applied) {
        newContent = newContent.split(c.originalExcerpt).join(c.correctedExcerpt);
      }
    }

    const versions = await storage.listVersions(id);
    const nextVersion = versions.length ? versions[versions.length - 1].version_number + 1 : 1;
    await storage.createVersion({
      workspace_id: ctx.workspaceId,
      submission_id: id,
      version_number: nextVersion,
      content: newContent,
      created_by: ctx.userId,
      change_reason: 'Applied suggested brand corrections',
    });
    await storage.updateSubmission(id, { current_content: newContent });
    return NextResponse.json({ success: true, current_content: newContent, version: nextVersion });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to apply corrections' }, { status: 500 });
  }
}
