import { NextRequest } from 'next/server';
import { withAuth, ok, fail, parseBody, isApiError } from '@/lib/api/handler';
import { GuidelineSuggestionSchema } from '@/lib/validations';
import { storage } from '@/lib/db/adaptor';
import { audit } from '@/lib/services/audit';

export const POST = withAuth(async (ctx, req) => {
  const parsed = await parseBody(req, GuidelineSuggestionSchema);
  if (isApiError(parsed)) return parsed.error;
  const suggestion = await storage.createGuidelineSuggestion({
    workspace_id: ctx.workspaceId,
    guideline_id: parsed.data.guideline_id,
    title: parsed.data.title,
    suggested_change: parsed.data.suggested_change,
    supporting_feedback_ids: parsed.data.supporting_feedback_ids,
    created_by: ctx.userId,
  });
  await audit.log(ctx.workspaceId, ctx.userId, 'guideline_suggestion', suggestion.id, 'CREATE', null, {
    guideline_id: parsed.data.guideline_id,
    title: parsed.data.title,
  });
  return ok(suggestion);
});
