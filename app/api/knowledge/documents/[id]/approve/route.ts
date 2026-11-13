import { withAdmin, ok, fail } from '@/lib/api/handler';
import { approveDocument } from '@/lib/services/knowledge';

export const POST = withAdmin(async (ctx, _req, params: Promise<{ id: string }>) => {
    const { id } = await params;
  try {
    const doc = await approveDocument(id, ctx.workspaceId, ctx.userId);
    return ok(doc);
  } catch (err: any) {
    return fail('NOT_FOUND', err?.message ?? 'Document not found', 404);
  }
});
