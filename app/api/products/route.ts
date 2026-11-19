import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, ApiError } from '@/lib/api/client';
import { getRequestContext } from '@/lib/auth';

const DEMO_PRODUCTS = [
  {
    id: 'prod-001-nova-phone',
    org_id: '11111111-1111-1111-1111-111111111111',
    name: 'NexaTech Nova Phone',
    category: 'Smartphones',
    model_or_version: 'Nova Pro v2',
    status: 'ACTIVE',
    description: 'Flagship AI smartphone with 48h active battery, titanium-glass chassis, and spatial audio.',
    facts_count: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-002-nova-buds',
    org_id: '11111111-1111-1111-1111-111111111111',
    name: 'NexaBuds Ultra',
    category: 'Audio & Wearables',
    model_or_version: 'Gen 2',
    status: 'ACTIVE',
    description: 'Lossless spatial wireless earbuds with hybrid adaptive noise cancelling.',
    facts_count: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-003-aerovision',
    org_id: '11111111-1111-1111-1111-111111111111',
    name: 'AeroVision Glasses',
    category: 'Spatial Computing',
    model_or_version: 'Developer Edition',
    status: 'ACTIVE',
    description: 'Lightweight AR eyewear with real-time neural coprocessor display.',
    facts_count: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function GET(req: NextRequest) {
  const ctx = await getRequestContext();
  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get('status') || undefined;

  try {
    const products = await backendFetch('/api/v1/products', {
      token: ctx.token,
      params: { status: statusFilter },
    });
    return NextResponse.json(products);
  } catch (err) {
    if (ctx.isDemo) {
      return NextResponse.json(DEMO_PRODUCTS);
    }
    const status = err instanceof ApiError ? err.status : 500;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}

export async function POST(req: NextRequest) {
  const ctx = await getRequestContext();
  if (ctx.isDemo) {
    return NextResponse.json(
      { error: 'The demo workspace is read-only. Please create your own workspace to register products.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const product = await backendFetch('/api/v1/products', {
      method: 'POST',
      token: ctx.token,
      body: JSON.stringify(body),
    });
    return NextResponse.json(product, { status: 201 });
  } catch (err: any) {
    const status = err instanceof ApiError ? err.status : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
