import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, ApiError } from '@/lib/api/client';
import { getRequestContext } from '@/lib/auth';

const DEMO_TEMPLATES = [
  {
    id: 'tpl-001',
    industry: 'Consumer Tech & Hardware',
    rule_code: 'RULE-CLAIM-001',
    title: 'Substantiated Performance Claims',
    description: 'All hardware performance, battery longevity, and weight figures must match certified laboratory specifications.',
    category: 'CLAIMS',
    severity: 'HIGH',
    examples: {
      good: ['Up to 48 hours of battery life under standard test conditions'],
      bad: ["Infinite battery life", "World's fastest phone without citation"],
    },
  },
  {
    id: 'tpl-002',
    industry: 'Consumer Tech & Hardware',
    rule_code: 'RULE-TONE-002',
    title: 'Confident, Unpretentious Tone',
    description: 'Speak plainly and directly about what the device actually does. Avoid hollow hype and unsubstantiated superlatives.',
    category: 'TONE',
    severity: 'MEDIUM',
    examples: {
      good: ['Engineered for smooth multi-tasking'],
      bad: ['The revolutionary miracle device that changes everything'],
    },
  },
  {
    id: 'tpl-003',
    industry: 'B2B SaaS & Enterprise Software',
    rule_code: 'RULE-LEGAL-001',
    title: 'Uptime & SLA Precision',
    description: 'Never promise 100% uptime. Cite the standard SLA of 99.9% as defined in enterprise contracts.',
    category: 'LEGAL',
    severity: 'HIGH',
    examples: {
      good: ['Backed by our 99.9% enterprise uptime SLA'],
      bad: ['Guaranteed zero downtime ever'],
    },
  },
  {
    id: 'tpl-004',
    industry: 'Health & Wellness',
    rule_code: 'RULE-LEGAL-002',
    title: 'No Medical Treatment Claims',
    description: 'Do not state or imply that products diagnose, treat, cure, or prevent any medical condition without formal regulatory clearance.',
    category: 'LEGAL',
    severity: 'HIGH',
    examples: {
      good: ['Supports everyday physical wellbeing'],
      bad: ['Cures insomnia and eliminates chronic fatigue'],
    },
  },
];

export async function GET(req: NextRequest) {
  const ctx = await getRequestContext();
  const { searchParams } = new URL(req.url);
  const industry = searchParams.get('industry') || undefined;

  try {
    const templates = await backendFetch('/api/v1/guidelines/templates', {
      token: ctx.token,
      params: { industry },
    });
    return NextResponse.json(templates);
  } catch (err) {
    let filtered = DEMO_TEMPLATES;
    if (industry) {
      filtered = filtered.filter((t) => t.industry === industry || t.industry === 'ALL');
    }
    return NextResponse.json(filtered);
  }
}

export async function POST(req: NextRequest) {
  const ctx = await getRequestContext();
  if (ctx.isDemo) {
    return NextResponse.json(
      { error: 'The demo workspace is read-only. Please create a company workspace to clone rules.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const cloned = await backendFetch('/api/v1/guidelines/templates/clone', {
      method: 'POST',
      token: ctx.token,
      body: JSON.stringify(body),
    });
    return NextResponse.json(cloned);
  } catch (err: any) {
    const status = err instanceof ApiError ? err.status : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
