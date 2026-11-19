import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api/client';
import { getStorage } from '@/lib/db/adaptor';

export async function GET(req: NextRequest) {
  const response = NextResponse.redirect(new URL('/overview', req.url));

  // Try to obtain a demo token from backend if available
  try {
    const data = await backendFetch('/api/v1/auth/demo', {
      method: 'POST',
      body: JSON.stringify({ workspace_slug: 'nexatech' }),
    });
    if (data?.access_token) {
      response.cookies.set('bv_session', data.access_token, {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      });
    }
  } catch (err) {
    // Backend may be offline, file-storage fallback handles demo
  }

  // Set demo cookies for local and frontend recognition
  response.cookies.set('bv_demo', '1', {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  });
  response.cookies.set('bv_demo_ws', 'nexatech', {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  });
  response.cookies.set('bv_ws', 'nexatech', {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
