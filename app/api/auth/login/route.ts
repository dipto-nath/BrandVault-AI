import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, ApiError } from '@/lib/api/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const data = await backendFetch('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const response = NextResponse.json({
      user: data.user,
      organization: data.organization,
    });

    // Set secure HTTP-only cookies
    if (data.access_token) {
      response.cookies.set('bv_session', data.access_token, {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        secure: process.env.NODE_ENV === 'production',
      });
    }

    if (data.refresh_token) {
      response.cookies.set('bv_refresh', data.refresh_token, {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        secure: process.env.NODE_ENV === 'production',
      });
    }

    if (data.organization?.slug) {
      response.cookies.set('bv_ws', data.organization.slug, {
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    response.cookies.delete('bv_demo');

    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    const status = err instanceof ApiError ? err.status : 500;
    const message = err.message || 'Invalid email or password';
    return NextResponse.json({ error: message }, { status });
  }
}
