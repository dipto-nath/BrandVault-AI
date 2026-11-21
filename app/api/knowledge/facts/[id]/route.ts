import { NextRequest } from 'next/server';
import { withAuth, withAdmin, ok, fail } from '@/lib/api/handler';
import { updateFact } from '@/lib/services/knowledge';
import { storage } from '@/lib/db/adaptor';

export const GET = withAuth(async (ctx, _req, params: Promise<{ id: string }>) => {
  const { id } = await params;
  const fact = await storage.getFact(id);
  if (!fact || fact.workspace_id !== ctx.workspaceId) {
    return fail('NOT_FOUND', 'Fact not found', 404);
  }
  return ok(fact);
});

export const PATCH = withAdmin(async (ctx, req, params: Promise<{ id: string }>) => {
  const { id } = await params;
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  try {
    const fact = await updateFact(id, ctx.workspaceId, ctx.userId, body);
    return ok(fact);
  } catch (err: any) {
    return fail('UPDATE_FAILED', err?.message ?? 'Failed to update fact', 400);
  }
});

export const PUT = PATCH;
