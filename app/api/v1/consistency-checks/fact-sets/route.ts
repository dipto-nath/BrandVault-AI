import { NextRequest, NextResponse } from 'next/server';
import { ConsistencyStore } from '@/lib/ai/consistency-store';

export async function GET() {
  const factSets = ConsistencyStore.listFactSets();
  return NextResponse.json(factSets);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, facts } = body;
    if (!name || !facts || !Array.isArray(facts) || facts.length === 0) {
      return NextResponse.json({ error: 'Name and at least one fact are required' }, { status: 400 });
    }
    const newFactSet = ConsistencyStore.createFactSet(name, facts);
    return NextResponse.json(newFactSet, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to create fact set' }, { status: 500 });
  }
}
