import { withAuth, ok } from '@/lib/api/handler';
import { storage } from '@/lib/db/adaptor';

export const GET = withAuth(async (ctx) => {
  const stats = await storage.dashboardStats(ctx.workspaceId);
  return ok(stats);
});
