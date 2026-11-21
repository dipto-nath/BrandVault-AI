import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/db/adaptor';
import { getRequestContext } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getRequestContext();
    const event = await storage.getChangeEvent(id);
    if (!event || event.workspace_id !== ctx.workspaceId) {
      return NextResponse.json({ error: 'Change event not found' }, { status: 404 });
    }

    const allSubs = await storage.listSubmissions(ctx.workspaceId);
    const affected = allSubs.filter((s) => event.affected_submission_ids?.includes(s.id));

    return NextResponse.json({
      eventId: event.id,
      eventType: event.event_type,
      dependency: {
        type: event.dependency_type,
        code: event.dependency_code,
        name: event.dependency_name,
        before: event.before_value,
        after: event.after_value,
      },
      impact: {
        totalAffected: affected.length,
        approvedItems: affected.filter((s) => s.status === 'APPROVED' || s.status === 'NEEDS_RE_REVIEW').length,
        outdatedItems: affected.filter((s) => s.status === 'OUTDATED').length,
      },
      affectedSubmissions: affected.map((s) => ({
        id: s.id,
        title: s.title,
        status: s.status,
        channel: s.channel,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed fetching impact' }, { status: 500 });
  }
}
