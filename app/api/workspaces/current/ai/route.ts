import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/auth';
import { z } from 'zod';
import { AI_PROVIDER, AI_MODEL, AI_AVAILABLE } from '@/lib/ai/provider';

const AiSettingsSchema = z.object({
  enabled: z.boolean(),
  provider: z.string().optional(),
  model: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const body = await req.json();
    const parsed = AiSettingsSchema.parse(body);

    return NextResponse.json({ 
      success: true, 
      enabled: parsed.enabled,
      provider: parsed.provider || AI_PROVIDER,
      model: parsed.model || AI_MODEL,
      message: parsed.enabled ? 'AI verification enabled' : 'AI verification disabled — running in deterministic mode'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to update AI settings' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const ctx = await getRequestContext();
    
    return NextResponse.json({
      enabled: AI_AVAILABLE,
      provider: AI_PROVIDER,
      model: AI_MODEL,
      note: 'AI settings are controlled by environment variables. This endpoint reflects current configuration.'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch AI settings' }, { status: 500 });
  }
}
