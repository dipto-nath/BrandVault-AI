import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, ApiError } from '@/lib/api/client';
import { getRequestContext } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getRequestContext();

  try {
    const product = await backendFetch(`/api/v1/products/${id}`, {
      token: ctx.token,
    });
    return NextResponse.json(product);
  } catch (err: any) {
    const status = err instanceof ApiError ? err.status : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

export async function PATCH(
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
    const body = await req.json();
    const product = await backendFetch(`/api/v1/products/${id}`, {
      method: 'PATCH',
      token: ctx.token,
      body: JSON.stringify(body),
    });
    return NextResponse.json(product);
  } catch (err: any) {
    const status = err instanceof ApiError ? err.status : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

export async function DELETE(
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
    await backendFetch(`/api/v1/products/${id}`, {
      method: 'DELETE',
      token: ctx.token,
    });
    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    const status = err instanceof ApiError ? err.status : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
