import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/auth';
import { backendApi } from '@/lib/api/client';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: invitationId } = await params;
  try {
    const ctx = await getRequestContext();
    if (ctx.isDemo) {
      return NextResponse.json(
        { error: 'Demo workspace cannot delete invitations' },
        { status: 403 }
      );
    }

    if (ctx.token) {
      try {
        await backendApi(`/workspaces/current/invitations/${invitationId}`, {
          method: 'DELETE',
          token: ctx.token,
        });
      } catch (e: any) {
        // Fallback
      }
    }

    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to revoke invitation' },
      { status: 500 }
    );
  }
}
