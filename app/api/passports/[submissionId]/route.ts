import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/db/adaptor';
import { getRequestContext } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await params;
  try {
    const ctx = await getRequestContext();
    const submission = await storage.getSubmission(submissionId);
    if (!submission || submission.workspace_id !== ctx.workspaceId) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }
    const [claims, findings, runs, decisions, versions] = await Promise.all([
      storage.listClaims(submissionId),
      storage.listFindings(submissionId),
      storage.listAnalysisRuns(submissionId),
      storage.listReviewDecisions(submissionId),
      storage.listVersions(submissionId),
    ]);
    const latestRun = runs[0];
    const latestVersion = versions[versions.length - 1];
    const passport = {
      passportId: `PASS-${submissionId.slice(0, 8)}`,
      submission,
      latestRun,
      latestVersion,
      claims,
      findings,
      decisions,
      generatedAt: new Date().toISOString(),
    };
    return NextResponse.json(passport);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Passport failed' }, { status: 500 });
  }
}
