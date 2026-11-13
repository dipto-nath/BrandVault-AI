import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getStorage } from '@/lib/db/adaptor';

export async function GET() {
  const storage = getStorage();
  const ws = await storage.getDemoWorkspace();
  if (!ws) {
    return NextResponse.json({ error: 'Demo workspace unavailable' }, { status: 500 });
  }
  const response = NextResponse.redirect(new URL('/(dashboard)/overview', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
  response.cookies.set('bv_demo', '1', { httpOnly: true, path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 });
  response.cookies.set('bv_demo_ws', ws.slug, { httpOnly: true, path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 });
  return response;
}
