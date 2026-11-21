import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/db/adaptor';
import { getRequestContext } from '@/lib/auth';
import { handleSourceExpiry } from '@/lib/services/reverification';

/**
 * POST /api/source-expiry/sweep
 * Scheduled or manual sweep that scans active evidence sources and facts.
 * When an approved fact or document passes its validity date (valid_until / expires_at),
 * escalates dependent posts to 'OUTDATED' without requiring any manual submission.
 */
export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const nowIso = new Date().toISOString();
    
    // Fetch all facts and documents
    const facts = await storage.listFacts(ctx.workspaceId);
    const documents = await storage.listDocuments(ctx.workspaceId);

    let expiredCount = 0;
    const expiredItems: Array<{ type: string; id: string; name: string }> = [];

    // Check facts with past expires_at
    for (const f of facts) {
      if (f.expires_at && f.expires_at <= nowIso && f.verification_status === 'APPROVED') {
        expiredCount++;
        expiredItems.push({ type: 'FACT', id: f.id, name: f.title });
        await storage.updateFact(f.id, { verification_status: 'REJECTED' });
        await handleSourceExpiry({
          workspaceId: ctx.workspaceId,
          sourceId: f.id,
          sourceName: `${f.title} (${f.fact_code})`,
          expiredAt: f.expires_at,
          actorId: ctx.userId,
        });
      }
    }

    // Check source documents with past validity date if specified
    for (const d of documents) {
      const docWithExpiry = d as any;
      if (docWithExpiry.valid_until && docWithExpiry.valid_until <= nowIso && d.document_status === 'APPROVED') {
        expiredCount++;
        expiredItems.push({ type: 'DOCUMENT', id: d.id, name: d.source_name });
        await storage.updateDocument(d.id, { document_status: 'FAILED' });
        await handleSourceExpiry({
          workspaceId: ctx.workspaceId,
          sourceId: d.id,
          sourceName: d.source_name,
          expiredAt: docWithExpiry.valid_until,
          actorId: ctx.userId,
        });
      }
    }

    // Demo acceleration: if simulate query param is present, simulate expiry of a demo source
    const url = new URL(req.url);
    if (url.searchParams.get('simulate') === 'true') {
      const demoFact = facts.find((f) => f.fact_code === 'FACT-004' || f.title.toLowerCase().includes('waterproof')) || facts[0];
      if (demoFact) {
        expiredCount++;
        const simulatedExpiry = new Date(Date.now() - 3600000).toISOString();
        await storage.updateFact(demoFact.id, { expires_at: simulatedExpiry, verification_status: 'REJECTED' });
        await handleSourceExpiry({
          workspaceId: ctx.workspaceId,
          sourceId: demoFact.id,
          sourceName: `${demoFact.title} (${demoFact.fact_code})`,
          expiredAt: simulatedExpiry,
          actorId: ctx.userId,
        });
        expiredItems.push({ type: 'FACT', id: demoFact.id, name: demoFact.title });
      }
    }

    return NextResponse.json({
      success: true,
      sweepTimestamp: nowIso,
      expiredCount,
      expiredItems,
      message: expiredCount > 0
        ? `Sweep completed: ${expiredCount} expired source(s) detected. Dependent content escalated to OUTDATED.`
        : 'Sweep completed: All approved sources and facts are within their active validity period.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Sweep failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const tasks = await storage.listReviewTasks(ctx.workspaceId);
    const events = await storage.listChangeEvents(ctx.workspaceId);
    return NextResponse.json({
      activeReviewTasks: tasks,
      recentChangeEvents: events,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed listing tasks' }, { status: 500 });
  }
}
