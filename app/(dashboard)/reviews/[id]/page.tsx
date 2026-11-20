import { storage } from '@/lib/db/adaptor';
import { ReviewStudio } from '@/components/reviews/review-studio';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cookies } from 'next/headers';
import { runAnalysis } from '@/lib/services/submissions';
import { getRequestContext } from '@/lib/auth';

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getRequestContext();
  let submission = await storage.getSubmission(id);

  // If not found in this serverless container instance, attempt recovery from session cookie
  if (!submission) {
    try {
      const cookieStore = await cookies();
      const recentRaw = cookieStore.get('bv_recent_sub')?.value;
      if (recentRaw) {
        const decoded = JSON.parse(decodeURIComponent(recentRaw));
        if (decoded.id === id || decoded.reference === id) {
          const ws = await storage.getDemoWorkspace();
          const workspaceId = ws?.id || decoded.workspaceId || '11111111-1111-1111-1111-111111111111';
          submission = await storage.createSubmission({
            id: decoded.id,
            workspace_id: workspaceId,
            title: decoded.title,
            content_type: decoded.contentType,
            channel: decoded.channel,
            original_content: decoded.originalContent,
            current_content: decoded.originalContent,
            status: 'NEEDS_REVIEW',
            risk_level: 'HIGH',
            reviewer_id: null,
            created_by: '22222222-2222-2222-2222-222222222222',
          });
          await storage.createVersion({
            workspace_id: workspaceId,
            submission_id: submission.id,
            version_number: 1,
            content: decoded.originalContent,
            created_by: '22222222-2222-2222-2222-222222222222',
            change_reason: 'Initial submission',
          });
          try {
            await runAnalysis(submission.id, workspaceId, '22222222-2222-2222-2222-222222222222');
            submission = (await storage.getSubmission(id)) || submission;
          } catch {
            // ignore analysis edge cases during recovery
          }
        }
      }
    } catch {
      // ignore recovery failure
    }
  }

  if (!submission) {
    return (
      <div className="card p-12 text-center bg-surface">
        <h2 className="text-xl font-bold text-ink-dark mb-2">Submission Not Found</h2>
        <p className="text-sm text-ink-secondary mb-6">
          The requested submission does not exist in the active workspace.
        </p>
        <Link href="/reviews">
          <Button variant="outline">Back to Reviews</Button>
        </Link>
      </div>
    );
  }

  let [claims, rawFindings, runs, decisions, versions, allFacts, allGuidelines] = await Promise.all([
    storage.listClaims(submission.id),
    storage.listFindings(submission.id),
    storage.listAnalysisRuns(submission.id),
    storage.listReviewDecisions(submission.id),
    storage.listVersions(submission.id),
    storage.listFacts(submission.workspace_id),
    storage.listGuidelines(submission.workspace_id),
  ]);

  // Auto-run analysis if findings are not yet present in this container instance
  if (claims.length === 0 && rawFindings.length === 0 && submission.status !== 'APPROVED') {
    try {
      await runAnalysis(submission.id, submission.workspace_id, '22222222-2222-2222-2222-222222222222');
      [claims, rawFindings, runs] = await Promise.all([
        storage.listClaims(submission.id),
        storage.listFindings(submission.id),
        storage.listAnalysisRuns(submission.id),
      ]);
    } catch {
      // ignore
    }
  }

  const factsMap = new Map(allFacts.map((f) => [f.id, f]));

  // Check for attached visual asset
  let initialVisualAsset: any = null;
  try {
    const fs = await import('fs');
    const path = await import('path');
    const uploadsDir = path.join(process.cwd(), '.brandvault', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      const match = files.find((f) => f.startsWith(`${submission.id}_`));
      if (match) {
        const filePath = path.join(uploadsDir, match);
        const stat = fs.statSync(filePath);
        initialVisualAsset = {
          filename: match.replace(`${submission.id}_`, ''),
          storageKey: match,
          url: `/api/uploads/${match}`,
          byteSize: stat.size,
        };
      }
    }
  } catch {}

  // Fetch visual analysis results from analysis runs (already loaded)
  if (initialVisualAsset) {
    try {
      // Find the visual analysis run (provider: 'OpenCV + WCAG 2.2 Engine')
      const visualRun = runs.find((run: any) => run.provider === 'OpenCV + WCAG 2.2 Engine');
      if (visualRun && visualRun.result) {
        const analysis = visualRun.result;
        // Merge the visual analysis data
        initialVisualAsset = {
          ...initialVisualAsset,
          analysis: analysis,
          visualFindings: analysis.findings || [],
        };
      }
    } catch (e) {
      console.warn('Could not extract visual analysis from runs:', e);
    }
  }

  // Populate finding evidence
  const findingsWithEvidence = await Promise.all(
    rawFindings.map(async (f) => {
      const rawEvidence = await storage.listFindingEvidence(f.id);
      const evidence = rawEvidence.map((ev) => ({
        ...ev,
        approved_facts: ev.approved_fact_id ? factsMap.get(ev.approved_fact_id) : undefined,
      }));
      return {
        ...f,
        finding_evidence: evidence,
      };
    })
  );

  return (
    <ReviewStudio
      submission={submission}
      claims={claims}
      findings={findingsWithEvidence}
      analysisRuns={runs}
      decisions={decisions}
      versions={versions}
      allGuidelines={allGuidelines}
      allFacts={allFacts}
      userRole={ctx.role}
      userId={ctx.userId}
      initialVisualAsset={initialVisualAsset}
    />
  );
}
