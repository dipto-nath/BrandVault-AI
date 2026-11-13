import { NextRequest } from 'next/server';
import { withAuth, withAdmin, ok, fail } from '@/lib/api/handler';
import { uploadDocument } from '@/lib/services/knowledge';

export const POST = withAdmin(async (ctx, req) => {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  if (!file) return fail('VALIDATION_ERROR', 'No file provided', 400);
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || 'application/octet-stream';
  try {
    const result = await uploadDocument(ctx.workspaceId, ctx.userId, buffer, file.name, mimeType);
    return ok(result);
  } catch (err: any) {
    return fail('UPLOAD_ERROR', err?.message ?? 'Upload failed', 400);
  }
});
