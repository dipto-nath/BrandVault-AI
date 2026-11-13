import { withAuth, ok, fail } from '@/lib/api/handler';
import { storage } from '@/lib/db/adaptor';

export const GET = withAuth(async (ctx, _req, params: Promise<{ id: string }>) => {
    const { id } = await params;
  const doc = await storage.getDocument(id);
  if (!doc || doc.workspace_id !== ctx.workspaceId) return fail('NOT_FOUND', 'Document not found', 404);
  return ok(doc);
});
