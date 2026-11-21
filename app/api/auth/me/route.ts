import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api/client';
import { storage } from '@/lib/db/adaptor';

function parseJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const decoded = Buffer.from(parts[1], 'base64url').toString('utf-8');
      return JSON.parse(decoded);
    }
  } catch {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const decoded = Buffer.from(parts[1], 'base64').toString('utf-8');
        return JSON.parse(decoded);
      }
    } catch {}
  }
  return null;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('bv_session')?.value;
  const isDemo = req.cookies.get('bv_demo')?.value === '1';

  if (!token && !isDemo) {
    return NextResponse.json({ authenticated: false, user: null, organization: null }, { status: 401 });
  }

  // 1. If it's a demo token or local JWT, return immediately without network calls
  if (token) {
    const payload = parseJwtPayload(token);
    if (payload?.is_demo || payload?.sub === '22222222-2222-2222-2222-222222222222') {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: payload.sub,
          email: payload.email || 'demo@nexatech.example',
          full_name: payload.name || 'Demo Reviewer',
          role: payload.role || 'ADMIN',
        },
        organization: {
          id: payload.org_id || '11111111-1111-1111-1111-111111111111',
          name: 'NexaTech',
          slug: 'nexatech',
          is_demo: true,
        },
        isDemo: true,
      });
    }

    try {
      const data = await backendFetch('/api/v1/auth/me', {
        token,
      });
      return NextResponse.json({
        authenticated: true,
        user: data.user,
        organization: data.organization,
        isDemo,
      });
    } catch {
      // Backend offline, fall back to local token
      if (payload && payload.sub && payload.org_id) {
        const wsName = 'NexaTech';
        const wsSlug = req.cookies.get('bv_ws')?.value || 'nexatech';
        const userName = payload.name || (payload.email ? payload.email.split('@')[0] : 'User');

        return NextResponse.json({
          authenticated: true,
          user: {
            id: payload.sub,
            email: payload.email,
            full_name: userName,
            role: payload.role || 'ADMIN',
          },
          organization: {
            id: payload.org_id,
            name: wsName,
            slug: wsSlug,
            is_demo: Boolean(payload.is_demo),
          },
          isDemo: Boolean(payload.is_demo),
        });
      }
    }
  }

  if (isDemo) {
    return NextResponse.json({
      authenticated: true,
      user: {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'demo@nexatech.example',
        full_name: 'Demo Reviewer',
        role: 'ADMIN',
      },
      organization: {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'NexaTech',
        slug: 'nexatech',
        is_demo: true,
      },
      isDemo: true,
    });
  }

  return NextResponse.json({ authenticated: false, error: 'Unauthorized' }, { status: 401 });
}
