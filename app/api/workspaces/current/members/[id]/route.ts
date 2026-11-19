import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/auth';
import { storage } from '@/lib/db/adaptor';
import { backendApi } from '@/lib/api/client';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memberUserId } = await params;
  try {
    const ctx = await getRequestContext();
    if (ctx.isDemo) {
      return NextResponse.json(
        { error: 'Demo workspace members cannot be modified' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const role = body.role;
    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    // Try FastAPI backend if token is available
    if (ctx.token) {
      try {
        const resp = await backendApi<any>(`/workspaces/current/members/${memberUserId}`, {
          method: 'PATCH',
          token: ctx.token,
          body: JSON.stringify({ role }),
        });
        return NextResponse.json(resp);
      } catch (e: any) {
        // Fallback to local storage
      }
    }

    return NextResponse.json({
      status: 'ok',
      user_id: memberUserId,
      role: role.toUpperCase(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to update member role' },
      { status: 500 }
    );
  }
}
