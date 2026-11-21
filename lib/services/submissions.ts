import { storage } from '@/lib/db/adaptor';
import { audit } from './audit';
import { runAnalysisPipeline } from '@/lib/ai/pipeline';
import type { ContentSubmission } from '@/types/database';

export interface SubmissionCreateInput {
  workspaceId: string;
  createdBy: string | null;
  title: string;
  contentType: string;
  channel: string;
  originalContent: string;
}

export async function createSubmission(input: SubmissionCreateInput): Promise<ContentSubmission> {
  const submission = await storage.createSubmission({
    workspace_id: input.workspaceId,
    title: input.title,
    content_type: input.contentType,
    channel: input.channel,
    original_content: input.originalContent,
    current_content: input.originalContent,
    status: 'DRAFT',
    risk_level: 'LOW',
    reviewer_id: null,
    created_by: input.createdBy,
  });
  await storage.createVersion({
    workspace_id: input.workspaceId,
    submission_id: submission.id,
    version_number: 1,
    content: input.originalContent,
    created_by: input.createdBy,
    change_reason: 'Initial submission',
  });
  await audit.log(input.workspaceId, input.createdBy, 'content_submission', submission.id, 'CREATE', null, {
    title: submission.title,
    content_type: submission.content_type,
    channel: submission.channel,
  });
  return submission;
}

export async function getSubmissionWithDetails(submissionId: string, workspaceId: string) {
  const submission = await storage.getSubmission(submissionId);
  if (!submission || submission.workspace_id !== workspaceId) return null;
  const [versions, runs, claims, findings, decisions, feedback] = await Promise.all([
    storage.listVersions(submissionId),
    storage.listAnalysisRuns(submissionId),
    storage.listClaims(submissionId),
    storage.listFindings(submissionId),
    storage.listReviewDecisions(submissionId),
    storage.listFindingFeedback(''), // placeholder; finding-level feedback fetched per finding
  ]);
  const findingsWithEvidence = await Promise.all(findings.map(async (f) => {
    const evidence = await storage.listFindingEvidence(f.id);
    return { ...f, finding_evidence: evidence };
  }));
  return { submission, versions, runs, claims, findings: findingsWithEvidence, decisions };
}

export async function runAnalysis(submissionId: string, workspaceId: string, userId: string | null) {
  const submission = await storage.getSubmission(submissionId);
  if (!submission || submission.workspace_id !== workspaceId) throw new Error('Submission not found');
  if (submission.status === 'ANALYZING') throw new Error('Analysis already running');

  await storage.updateSubmission(submissionId, { status: 'ANALYZING' });
  await audit.log(workspaceId, userId, 'content_submission', submissionId, 'ANALYZE_START', null, {});

  const guidelines = await storage.listGuidelines(workspaceId, { active: true });
  const facts = await storage.listFacts(workspaceId, { active: true });

  const run = await storage.createAnalysisRun({
    workspace_id: workspaceId,
    submission_id: submissionId,
    content_version_id: null,
    provider: process.env.GEMINI_API_KEY ? 'Google Gemini' : 'deterministic',
    model_name: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    prompt_version: 'v1',
    status: 'RUNNING',
    result: null,
    error_message: null,
    completed_at: null,
    duration_ms: null,
  });

  let result: any;
  try {
    result = await runAnalysisPipeline({
      workspaceId,
      submissionId,
      content: submission.original_content,
      guidelines,
      facts,
    });

    // Merge visual check findings if an image asset exists for this submission
    try {
      const fs = await import('fs');
      const path = await import('path');
      const uploadsDir = path.join(process.cwd(), '.brandvault', 'uploads');
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        const match = files.find((f) => f.startsWith(`${submissionId}_`));
        if (match) {
          const { runVisualCheck } = await import('@/lib/ai/visual-checker');
          const visualResult = await runVisualCheck({
            imagePath: path.join(uploadsDir, match),
            channel: submission.channel || 'WEBSITE',
          });
          const visualFindingResults = visualResult.findings.map((f) => ({
            type: f.type,
            severity: f.severity,
            title: f.title,
            excerpt: f.originalPhrase,
            explanation: f.message,
            ruleId: f.ruleId,
            evidenceIds: [],
            suggestedCorrection: f.suggestedCorrection,
            confidence: f.confidence,
            diff: f.evidence,
          }));
          result.findings = [...result.findings, ...visualFindingResults];
        }
      }
    } catch (vErr) {
      console.warn('Visual check during pipeline error:', vErr);
    }
  } catch (err: any) {
    await storage.updateAnalysisRun(run.id, { status: 'FAILED', error_message: err?.message ?? String(err), completed_at: new Date().toISOString() });
    await storage.updateSubmission(submissionId, { status: 'FAILED' });
    await audit.log(workspaceId, userId, 'analysis_run', run.id, 'FAILED', null, { error: err?.message ?? String(err) });
    throw err;
  }

  const completedAt = new Date().toISOString();
  await storage.updateAnalysisRun(run.id, {
    status: 'COMPLETED',
    result: result as any,
    error_message: null,
    completed_at: completedAt,
    duration_ms: result.durationMs,
    provider: result.provider,
    model_name: result.model,
  });

  // Persist claims
  await storage.createClaims(result.claims.map((c: any) => ({
    workspace_id: workspaceId,
    submission_id: submissionId,
    analysis_run_id: run.id,
    claim_text: c.claimText,
    claim_type: c.claimType,
    verification_status: c.verificationStatus,
    explanation: c.explanation,
    confidence: c.confidence,
  })));

  // Persist findings + evidence
  const findingInputs = result.findings.map((f: any) => ({
    workspace_id: workspaceId,
    submission_id: submissionId,
    analysis_run_id: run.id,
    claim_id: null,
    finding_type: f.type,
    severity: f.severity,
    rule_id: f.ruleId,
    title: f.title,
    excerpt: f.excerpt,
    explanation: f.explanation,
    suggested_correction: f.suggestedCorrection ?? null,
    diff: f.diff ?? null,
    confidence: f.confidence,
    status: 'OPEN',
  }));
  const createdFindings = await storage.createFindings(findingInputs);
  for (let i = 0; i < createdFindings.length; i++) {
    const f = result.findings[i];
    if (f.evidenceIds && f.evidenceIds.length) {
      const evidenceRows = f.evidenceIds.map((evId: string) => ({
        finding_id: createdFindings[i].id,
        fact_id: evId,
        approved_fact_id: evId,
        source_document_id: null,
        evidence_excerpt: '',
        relevance_explanation: 'Linked approved evidence',
        evidence_relation: (f.type === 'FACTUAL_CONTRADICTION' ? 'CONTRADICTS' : 'SUPPORTS') as 'CONTRADICTS' | 'SUPPORTS',
      }));
      await storage.createFindingEvidence(evidenceRows);
    }
  }

  // Feature 3: Persist exact claim dependencies for re-verification tracking
  try {
    const citedFactIds = new Set<string>();
    for (const c of result.claims || []) {
      if (c.evidenceIds) c.evidenceIds.forEach((id: string) => citedFactIds.add(id));
    }
    for (const f of result.findings || []) {
      if (f.evidenceIds) f.evidenceIds.forEach((id: string) => citedFactIds.add(id));
    }

    if (citedFactIds.size > 0) {
      const factsList = await storage.listFacts(workspaceId);
      const factsMap = new Map(factsList.map((f) => [f.id, f]));
      const dependenciesToSave = Array.from(citedFactIds).map((factId) => {
        const fact = factsMap.get(factId);
        return {
          workspace_id: workspaceId,
          submission_id: submissionId,
          claim_id: null,
          dependency_type: 'FACT' as const,
          dependency_id: factId,
          dependency_code: fact?.fact_code || 'FACT',
          dependency_name: fact?.title || 'Approved Fact',
          dependency_version: 1,
          cited_value: fact?.fact_text || '',
        };
      });

      if (dependenciesToSave.length > 0) {
        await storage.createClaimDependencies(dependenciesToSave);
      }
    }
  } catch (depErr) {
    console.warn('[Submissions] Failed saving claim dependencies:', depErr);
  }

  const riskLevel = result.riskLevel as 'LOW' | 'MEDIUM' | 'HIGH';
  const currentSub = await storage.getSubmission(submissionId);
  const nextStatus = currentSub?.status === 'OUTDATED'
    ? 'OUTDATED'
    : currentSub?.status === 'NEEDS_RE_REVIEW' || currentSub?.stale_passport
    ? 'NEEDS_RE_REVIEW'
    : 'NEEDS_REVIEW';

  await storage.updateSubmission(submissionId, {
    status: nextStatus,
    risk_level: riskLevel,
  });
  await audit.log(workspaceId, userId, 'analysis_run', run.id, 'COMPLETED', null, {
    riskLevel, findingCount: result.findings.length, claimCount: result.claims.length, partial: result.partial,
  });

  return { submissionId, runId: run.id, result };
}
