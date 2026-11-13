import { NextRequest } from 'next/server';
import { withAuth, ok, fail, parseBody } from '@/lib/api/handler';
import { UpdateSubmissionSchema } from '@/lib/validations';
import { storage } from '@/lib/db/adaptor';

export const GET = withAuth(async (ctx, _req, params: Promise<{ id: string }>) => {
    const { id } = await params;
  const submission = await storage.getSubmission(id);
  if (!submission || submission.workspace_id !== ctx.workspaceId) return fail('NOT_FOUND', 'Submission not found', 404);
  return ok(submission);
});

export const PATCH = withAuth(async (ctx, req, params: Promise<{ id: string }>) => {
  const { id } = await params;
  const submission = await storage.getSubmission(id);
  if (!submission || submission.workspace_id !== ctx.workspaceId) return fail('NOT_FOUND', 'Submission not found', 404);
  const parsed = await parseBody(req, UpdateSubmissionSchema);
  if ('error' in parsed) return parsed.error;
  const updated = await storage.updateSubmission(id, parsed.data);
  return ok(updated);
});
