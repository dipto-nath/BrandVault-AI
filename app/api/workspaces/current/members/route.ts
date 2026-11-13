import { withAuth, ok } from '@/lib/api/handler';
import { storage } from '@/lib/db/adaptor';

export const GET = withAuth(async (ctx) => {
  const members = await storage.listMembers(ctx.workspaceId);
  return ok(members);
});
