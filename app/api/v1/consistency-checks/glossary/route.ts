import { NextResponse } from 'next/server';
import { ConsistencyStore } from '@/lib/ai/consistency-store';

export async function GET() {
  const glossary = ConsistencyStore.listGlossary();
  return NextResponse.json(glossary);
}
