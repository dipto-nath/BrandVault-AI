import { withAdmin, ok, fail } from '@/lib/api/handler';
import { deactivateGuideline } from '@/lib/services/guidelines';

export const POST = withAdmin(async (ctx, _req, params: Promise<{ id: string }>) => {
    const { id } = await params;
  try {
    await deactivateGuideline(id, ctx.workspaceId, ctx.userId);
    return ok({ success: true });
  } catch (err: any) {
    return fail('NOT_FOUND', err?.message ?? 'Guideline not found', 404);
  }
});
