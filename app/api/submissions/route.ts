import { NextRequest } from 'next/server';
import { withAuth, ok, fail, parseBody } from '@/lib/api/handler';
import { CreateSubmissionSchema } from '@/lib/validations';
import { storage } from '@/lib/db/adaptor';
import { createSubmission } from '@/lib/services/submissions';

export const GET = withAuth(async (ctx) => {
  const submissions = await storage.listSubmissions(ctx.workspaceId);
  return ok(submissions);
});

export const POST = withAuth(async (ctx, req) => {
  const parsed = await parseBody(req, CreateSubmissionSchema);
  if ('error' in parsed) return parsed.error;
  const submission = await createSubmission({
    workspaceId: ctx.workspaceId,
    createdBy: ctx.userId,
    title: parsed.data.title,
    contentType: parsed.data.content_type,
    channel: parsed.data.channel,
    originalContent: parsed.data.original_content,
  });
  return ok(submission);
});
