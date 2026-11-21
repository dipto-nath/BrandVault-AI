import { NextResponse } from 'next/server';
import { runMultilingualEvaluation } from '@/lib/ai/multilingual-evaluation';

export async function GET() {
  const report = runMultilingualEvaluation();
  return NextResponse.json(report);
}
