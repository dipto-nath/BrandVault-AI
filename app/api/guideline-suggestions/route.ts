import { NextRequest } from 'next/server';
import { withAuth, withAdmin, ok, fail, parseBody } from '@/lib/api/handler';
import { GuidelineSuggestionSchema } from '@/lib/validations';
import { storage } from '@/lib/db/adaptor';

export const GET = withAuth(async (ctx) => {
  const suggestions = await storage.listGuidelineSuggestions(ctx.workspaceId);
  return ok(suggestions);
});

export const POST = withAdmin(async (ctx, req) => {
  const parsed = await parseBody(req, GuidelineSuggestionSchema);
  if ('error' in parsed) return parsed.error;

  const suggestion = await storage.createGuidelineSuggestion({
    workspace_id: ctx.workspaceId,
    guideline_id: parsed.data.guideline_id,
    title: parsed.data.title,
    suggested_change: parsed.data.suggested_change,
    supporting_feedback_ids: parsed.data.supporting_feedback_ids ?? [],
    created_by: ctx.userId,
  });

  return ok(suggestion);
});