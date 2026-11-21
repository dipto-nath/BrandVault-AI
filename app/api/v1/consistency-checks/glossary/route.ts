import { NextRequest, NextResponse } from 'next/server';
import { ConsistencyStore } from '@/lib/ai/consistency-store';

export async function GET() {
  const glossary = ConsistencyStore.listGlossary();
  return NextResponse.json(glossary);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { term_en, term_hi, term_bn, category } = body;
    if (!term_en || !term_hi || !term_bn) {
      return NextResponse.json({ error: 'All three language terms (en, hi, bn) are required' }, { status: 400 });
    }
    const newTerm = ConsistencyStore.addGlossaryTerm(term_en, term_hi, term_bn, category || 'General');
    return NextResponse.json(newTerm, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to add glossary term' }, { status: 500 });
  }
}
