import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/db/adaptor';

export async function GET(req: NextRequest) {
  const storage = getStorage();
  const ws = await storage.getDemoWorkspace();
  if (!ws) {
    return NextResponse.json({ error: 'Demo workspace unavailable' }, { status: 500 });
  }
  const response = NextResponse.redirect(new URL('/overview', req.url));
  response.cookies.set('bv_demo', '1', { httpOnly: true, path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 });
  response.cookies.set('bv_demo_ws', ws.slug, { httpOnly: true, path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 });
  return response;
}
