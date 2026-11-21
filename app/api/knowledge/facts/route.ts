import { NextRequest } from 'next/server';
import { withAuth, withAdmin, ok, fail, parseBody } from '@/lib/api/handler';
import { CreateFactSchema } from '@/lib/validations';
import { listFacts, createFact } from '@/lib/services/knowledge';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = withAuth(async (ctx) => {
  const facts = await listFacts(ctx.workspaceId);
  return ok(facts);
});

export const POST = withAdmin(async (ctx, req) => {
  const parsed = await parseBody(req, CreateFactSchema);
  if ('error' in parsed) return parsed.error;
  const fact = await createFact(ctx.workspaceId, ctx.userId, parsed.data);
  return ok(fact);
});
