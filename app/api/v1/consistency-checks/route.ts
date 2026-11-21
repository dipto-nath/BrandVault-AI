import { NextRequest, NextResponse } from 'next/server';
import { ConsistencyStore } from '@/lib/ai/consistency-store';

export async function GET() {
  const jobs = ConsistencyStore.listJobs();
  return NextResponse.json(jobs);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { language, text, fact_set_id } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Text content is required' }, { status: 400 });
    }

    const lang = (language === 'hi' || language === 'bn' || language === 'en') ? language : 'bn';
    const job = ConsistencyStore.createJob(lang, text, fact_set_id);

    return NextResponse.json(
      {
        job_id: job.id,
        status: job.status,
        findings_count: job.findings.length,
      },
      { status: 202 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create check' }, { status: 500 });
  }
}
