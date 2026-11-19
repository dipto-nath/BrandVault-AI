import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, ApiError } from '@/lib/api/client';
import { getRequestContext } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const ctx = await getRequestContext();
  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get('status') || undefined;

  try {
    const candidates = await backendFetch('/api/v1/guidelines/candidates', {
      token: ctx.token,
      params: { status: statusFilter },
    });
    return NextResponse.json(candidates);
  } catch (err) {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const ctx = await getRequestContext();
  if (ctx.isDemo) {
    return NextResponse.json(
      { error: 'The demo workspace is read-only.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const candidate = await backendFetch('/api/v1/guidelines/candidates', {
      method: 'POST',
      token: ctx.token,
      body: JSON.stringify(body),
    });
    return NextResponse.json(candidate, { status: 201 });
  } catch (err: any) {
    const status = err instanceof ApiError ? err.status : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
