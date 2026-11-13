import { withAuth, ok } from '@/lib/api/handler';
import { storage } from '@/lib/db/adaptor';

export const GET = withAuth(async (ctx) => {
  const ws = await storage.getWorkspaceBySlug(ctx.workspaceSlug);
  return ok(ws);
});
