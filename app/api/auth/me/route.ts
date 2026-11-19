import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, ApiError } from '@/lib/api/client';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('bv_session')?.value;
  const isDemo = req.cookies.get('bv_demo')?.value === '1';

  if (!token && !isDemo) {
    return NextResponse.json({ authenticated: false, user: null, organization: null }, { status: 401 });
  }

  try {
    const data = await backendFetch('/api/v1/auth/me', {
      token: token || undefined,
    });
    return NextResponse.json({
      authenticated: true,
      user: data.user,
      organization: data.organization,
      isDemo,
    });
  } catch (err: any) {
    if (isDemo) {
      // Fallback demo user
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
    return NextResponse.json({ authenticated: false, error: err.message }, { status: 401 });
  }
}
