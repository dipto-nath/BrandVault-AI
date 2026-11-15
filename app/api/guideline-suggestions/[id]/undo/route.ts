import { withAdmin, ok, fail } from '@/lib/api/handler';
import { storage } from '@/lib/db/adaptor';

export const POST = withAdmin(async (ctx, _req, params: Promise<{ id: string }>) => {
  const { id } = await params;
  try {
    if (typeof (storage as any).undoGuidelineSuggestion === 'function') {
      await (storage as any).undoGuidelineSuggestion(id, ctx.userId);
    }
    return ok({ success: true });
  } catch (err: any) {
    return fail('NOT_FOUND', err?.message ?? 'Suggestion not found', 404);
  }
});
