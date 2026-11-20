import { NextRequest } from 'next/server';
import { withAuth, ok, fail } from '@/lib/api/handler';
import { storage } from '@/lib/db/adaptor';

export const GET = withAuth(async (ctx, req) => {
  try {
    const products = await storage.listProducts(ctx.workspaceId);
    return ok(products);
  } catch (err: any) {
    return fail('DATABASE_ERROR', err?.message ?? 'Failed to list products', 500);
  }
});

export const POST = withAuth(async (ctx, req) => {
  try {
    const body = await req.json();
    if (!body.name || !body.name.trim()) {
      return fail('VALIDATION_ERROR', 'Product name is required', 400);
    }

    const product = await storage.createProduct({
      workspace_id: ctx.workspaceId,
      name: body.name.trim(),
      category: body.category?.trim() || null,
      model_or_version: body.model_or_version?.trim() || null,
      launch_date: body.launch_date?.trim() || null,
      status: body.status || 'ACTIVE',
      description: body.description?.trim() || null,
    });

    return ok(product);
  } catch (err: any) {
    return fail('DATABASE_ERROR', err?.message ?? 'Failed to create product', 500);
  }
});
