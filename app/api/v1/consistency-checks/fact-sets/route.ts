import { NextResponse } from 'next/server';
import { ConsistencyStore } from '@/lib/ai/consistency-store';

export async function GET() {
  const factSets = ConsistencyStore.listFactSets();
  return NextResponse.json(factSets);
}
