import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, ApiError } from '@/lib/api/client';
import { storage } from '@/lib/db/adaptor';
import crypto from 'crypto';

function createLocalJwt(payload: { sub: string; org_id: string; role: string; email: string; name?: string; is_demo?: boolean }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const secret = process.env.JWT_SECRET || 'brandvault-jwt-secret-key-change-in-production-min-32-bytes';
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

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

    let data: any = null;

    try {
      data = await backendFetch('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    } catch (backendErr: any) {
      if (backendErr instanceof ApiError && (backendErr.status === 400 || backendErr.status === 401)) {
        return NextResponse.json({ error: backendErr.message }, { status: backendErr.status });
      }

      console.warn('Backend unavailable, falling back to local session for login:', backendErr.message);

      // In local/demo mode without backend, find or use demo/existing workspace
      const demoWs = await storage.getDemoWorkspace();
      const ws = demoWs || {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'NexTech',
        slug: 'nexatech',
      };

      const userId = '22222222-2222-2222-2222-222222222222';
      const accessToken = createLocalJwt({
        sub: userId,
        org_id: ws.id,
        role: 'ADMIN',
        email,
        is_demo: false,
      });

      data = {
        access_token: accessToken,
        refresh_token: crypto.randomBytes(32).toString('hex'),
        token_type: 'bearer',
        user: {
          id: userId,
          email,
          full_name: email.split('@')[0],
          role: 'ADMIN',
          created_at: new Date().toISOString(),
        },
        organization: {
          id: ws.id,
          name: ws.name,
          slug: ws.slug,
          created_at: new Date().toISOString(),
        },
      };
    }

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
    response.cookies.delete('bv_demo_ws');

    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    const status = err instanceof ApiError ? err.status : 500;
    const message = err.message || 'Invalid email or password';
    return NextResponse.json({ error: message }, { status });
  }
}
