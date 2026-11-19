import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, ApiError } from '@/lib/api/client';
import { getRequestContext } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getRequestContext();

  if (ctx.isDemo) {
    return NextResponse.json(
      { error: 'The demo workspace is read-only.' },
      { status: 403 }
    );
  }

  try {
    const candidate = await backendFetch(`/api/v1/facts/candidates/${id}/reject`, {
      method: 'POST',
      token: ctx.token,
    });
    return NextResponse.json(candidate);
  } catch (err: any) {
    const status = err instanceof ApiError ? err.status : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
