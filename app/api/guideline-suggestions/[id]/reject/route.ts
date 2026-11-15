import { withAdmin, ok, fail } from '@/lib/api/handler';
import { storage } from '@/lib/db/adaptor';

export const POST = withAdmin(async (ctx, req, params: Promise<{ id: string }>) => {
  const { id } = await params;
  try {
    let reason: string | undefined;
    try {
      const body = await req.json();
      reason = body?.reason;
    } catch {
      // Body is optional
    }
    await storage.rejectGuidelineSuggestion(id, ctx.userId, reason);
    return ok({ success: true });
  } catch (err: any) {
    return fail('NOT_FOUND', err?.message ?? 'Suggestion not found', 404);
  }
});
