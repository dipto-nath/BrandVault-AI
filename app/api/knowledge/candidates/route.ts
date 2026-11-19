import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, ApiError } from '@/lib/api/client';
import { getRequestContext } from '@/lib/auth';

const DEMO_CANDIDATES = [
  {
    id: 'cand-001',
    org_id: '11111111-1111-1111-1111-111111111111',
    product_id: 'prod-001-nova-phone',
    entity: 'NexaTech Nova Phone',
    attribute: 'Peak Display Brightness',
    value_text: '2600 nits',
    value_numeric: 2600,
    unit: 'nits',
    qualifier: 'Outdoor sunlight boost mode',
    source_page: 8,
    excerpt: 'The OLED SuperRetina panel reaches a peak outdoor sunlight brightness of 2,600 nits under certified lab conditions.',
    confidence: 0.94,
    status: 'PENDING',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'cand-002',
    org_id: '11111111-1111-1111-1111-111111111111',
    product_id: 'prod-002-nova-buds',
    entity: 'NexaBuds Ultra',
    attribute: 'Battery Playback Time',
    value_text: '10 hours continuous playback',
    value_numeric: 10,
    unit: 'hours',
    qualifier: 'ANC off at 50% volume',
    source_page: 2,
    excerpt: 'Single-charge earbud playtime provides up to 10 hours continuous playback with Active Noise Cancellation turned off.',
    confidence: 0.91,
    status: 'PENDING',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
];

export async function GET(req: NextRequest) {
  const ctx = await getRequestContext();
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('product_id') || undefined;
  const statusFilter = searchParams.get('status') || undefined;

  try {
    const candidates = await backendFetch('/api/v1/facts/candidates', {
      token: ctx.token,
      params: { product_id: productId, status: statusFilter },
    });
    return NextResponse.json(candidates);
  } catch (err) {
    if (ctx.isDemo) {
      let filtered = DEMO_CANDIDATES;
      if (productId) {
        filtered = filtered.filter((c) => c.product_id === productId);
      }
      if (statusFilter) {
        filtered = filtered.filter((c) => c.status === statusFilter);
      }
      return NextResponse.json(filtered);
    }
    const status = err instanceof ApiError ? err.status : 500;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}

export async function POST(req: NextRequest) {
  const ctx = await getRequestContext();
  if (ctx.isDemo) {
    return NextResponse.json(
      { error: 'The demo workspace is read-only. Please create a workspace to submit candidates.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const candidate = await backendFetch('/api/v1/facts/candidates', {
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
