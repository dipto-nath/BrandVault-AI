import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/auth';
import { apiSuccess, apiError } from '@/types/api';

export interface ApiHandlerContext {
  userId: string;
  userEmail: string | null;
  userName: string | null;
  workspaceId: string;
  workspaceSlug: string;
  role: string;
  isDemo: boolean;
  isAdmin: boolean;
}

export type ApiHandler = (ctx: ApiHandlerContext, req: NextRequest, params?: any) => Promise<NextResponse>;

export function withAuth(handler: ApiHandler) {
  return async (req: NextRequest, context: any = {}): Promise<NextResponse> => {
    try {
      const ctx = await getRequestContext();
      const params = context?.params ?? context;
      return handler(ctx, req, params);
    } catch (err: any) {
      const message = err?.message ?? 'Unauthorized';
      return NextResponse.json(apiError('UNAUTHORIZED', message), { status: 401 });
    }
  };
}

export function withAdmin(handler: ApiHandler) {
  return withAuth(async (ctx, req, params) => {
    if (!ctx.isAdmin) {
      return NextResponse.json(apiError('FORBIDDEN', 'Administrator role required'), { status: 403 });
    }
    return handler(ctx, req, params);
  });
}

export function ok<T>(data: T) {
  return NextResponse.json(apiSuccess(data));
}

export function fail(code: string, message: string, status = 400, details?: unknown) {
  return NextResponse.json(apiError(code, message, details), { status });
}

export async function parseBody<T = any>(req: NextRequest, schema: any): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const body = await req.json();
    const parsed = schema.parse(body);
    return { data: parsed };
  } catch (err: any) {
    if (err?.issues) {
      return { error: NextResponse.json(apiError('VALIDATION_ERROR', err.issues.map((i: any) => i.message).join(', ')), { status: 400 }) };
    }
    return { error: NextResponse.json(apiError('VALIDATION_ERROR', err?.message ?? 'Invalid request body'), { status: 400 }) };
  }
}

export function isApiError(x: any): x is { error: NextResponse } {
  return 'error' in x;
}
