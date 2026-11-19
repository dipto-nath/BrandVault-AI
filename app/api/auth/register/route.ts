import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, ApiError } from '@/lib/api/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { company_name, workspace_slug, email, password, full_name, industry } = body;

    if (!company_name || !email || !password || !full_name) {
      return NextResponse.json(
        { error: 'Company name, work email, password, and full name are required' },
        { status: 400 }
      );
    }

    const data = await backendFetch('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        company_name,
        workspace_slug: workspace_slug || undefined,
        email,
        password,
        full_name,
        industry: industry || undefined,
      }),
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
        maxAge: 60 * 60 * 24 * 7, // 7 days
        secure: process.env.NODE_ENV === 'production',
      });
    }

    if (data.refresh_token) {
      response.cookies.set('bv_refresh', data.refresh_token, {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        secure: process.env.NODE_ENV === 'production',
      });
    }

    // Set workspace slug for UI reference
    response.cookies.set('bv_ws', data.organization.slug, {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });

    // Clear demo flag
    response.cookies.delete('bv_demo');

    return response;
  } catch (err: any) {
    console.error('Registration error:', err);
    const status = err instanceof ApiError ? err.status : 500;
    const message = err.message || 'Failed to register';
    return NextResponse.json({ error: message }, { status });
  }
}
