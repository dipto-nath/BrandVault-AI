import { NextRequest } from 'next/server';
import { withAuth, withAdmin, ok, fail, parseBody } from '@/lib/api/handler';
import { UpdateGuidelineSchema } from '@/lib/validations';
import { getGuideline, updateGuideline } from '@/lib/services/guidelines';

export const GET = withAuth(async (ctx, _req, params: Promise<{ id: string }>) => {
    const { id } = await params;
  const guideline = await getGuideline(id, ctx.workspaceId);
  if (!guideline) return fail('NOT_FOUND', 'Guideline not found', 404);
  return ok(guideline);
});

export const PATCH = withAdmin(async (ctx, req, params: Promise<{ id: string }>) => {
  const { id } = await params;
  const parsed = await parseBody(req, UpdateGuidelineSchema);
  if ('error' in parsed) return parsed.error;
  try {
    const guideline = await updateGuideline(id, ctx.workspaceId, ctx.userId, parsed.data);
    return ok(guideline);
  } catch (err: any) {
    return fail('NOT_FOUND', err?.message ?? 'Guideline not found', 404);
  }
});
