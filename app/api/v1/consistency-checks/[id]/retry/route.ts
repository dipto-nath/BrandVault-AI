import { NextRequest, NextResponse } from 'next/server';
import { ConsistencyStore } from '@/lib/ai/consistency-store';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = ConsistencyStore.getJob(id);

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Re-run job
  const newJob = ConsistencyStore.createJob(job.language, job.raw_text, job.fact_set_id);
  return NextResponse.json(newJob);
}
