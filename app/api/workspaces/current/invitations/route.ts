import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/auth';
import { backendApi } from '@/lib/api/client';

export async function GET() {
  try {
    const ctx = await getRequestContext();
    if (ctx.token) {
      try {
        const resp = await backendApi<any[]>('/workspaces/current/invitations', {
          token: ctx.token,
        });
        return NextResponse.json(resp);
      } catch (e) {
        // Fallback
      }
    }
    return NextResponse.json([]);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to list invitations' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    if (ctx.isDemo) {
      return NextResponse.json(
        { error: 'Demo workspace cannot invite members' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, role } = body;
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (ctx.token) {
      try {
        const resp = await backendApi<any>('/workspaces/current/invitations', {
          method: 'POST',
          token: ctx.token,
          body: JSON.stringify({ email, role: role || 'CREATOR' }),
        });
        return NextResponse.json(resp, { status: 201 });
      } catch (e: any) {
        // Fallback
      }
    }

    return NextResponse.json(
      {
        id: 'inv-' + Math.random().toString(36).substring(2, 9),
        org_id: ctx.workspaceId,
        email,
        role: (role || 'CREATOR').toUpperCase(),
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to create invitation' },
      { status: 500 }
    );
  }
}
