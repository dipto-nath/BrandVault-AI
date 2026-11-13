import { NextRequest } from 'next/server';
import { withAuth, withAdmin, ok, fail, parseBody } from '@/lib/api/handler';
import { CreateGuidelineSchema } from '@/lib/validations';
import { listGuidelines, createGuideline } from '@/lib/services/guidelines';

export const GET = withAuth(async (ctx) => {
  const guidelines = await listGuidelines(ctx.workspaceId);
  return ok(guidelines);
});

export const POST = withAdmin(async (ctx, req) => {
  const parsed = await parseBody(req, CreateGuidelineSchema);
  if ('error' in parsed) return parsed.error;
  const guideline = await createGuideline(ctx.workspaceId, ctx.userId, parsed.data);
  return ok(guideline);
});
