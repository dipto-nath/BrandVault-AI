import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/db/adaptor';
import { getRequestContext } from '@/lib/auth';
import { runVisualCheck } from '@/lib/ai/visual-checker';
import fs from 'fs';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const ctx = await getRequestContext();
    const submission = await storage.getSubmission(id);
    if (!submission || submission.workspace_id !== ctx.workspaceId) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Check if visual asset exists for this submission in uploads
    const uploadsDir = path.join(process.cwd(), '.brandvault', 'uploads');
    let visualAsset: any = null;

    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      const match = files.find((f) => f.startsWith(`${id}_`));
      if (match) {
        const filePath = path.join(uploadsDir, match);
        const stat = fs.statSync(filePath);
        visualAsset = {
          filename: match.replace(`${id}_`, ''),
          storageKey: match,
          url: `/api/uploads/${match}`,
          byteSize: stat.size,
        };
      }
    }

    // Get visual findings
    const allFindings = await storage.listFindings(id);
    const visualFindings = allFindings.filter(
      (f) => f.finding_type === 'ASSET_MISMATCH' || f.finding_type === 'LOW_CONTRAST' || f.finding_type === 'MISSING_ALT_TEXT' || f.finding_type === 'OCR_UNAVAILABLE'
    );

    return NextResponse.json({
      success: true,
      visualAsset,
      visualFindings,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch visual assets' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const ctx = await getRequestContext();
    const submission = await storage.getSubmission(id);
    if (!submission || submission.workspace_id !== ctx.workspaceId) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const altText = (formData.get('altText') as string | null) || null;
    const isDecorative = formData.get('isDecorative') === 'true';
    const foregroundColor = (formData.get('foregroundColor') as string | null) || null;
    const backgroundColor = (formData.get('backgroundColor') as string | null) || null;
    const isLargeText = formData.get('isLargeText') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No image file uploaded' }, { status: 400 });
    }

    // Validate type and size
    const allowedMime = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedMime.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a PNG, JPEG, or WebP image.' },
        { status: 415 }
      );
    }

    const maxBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: 'Image exceeds maximum size limit of 10MB.' },
        { status: 413 }
      );
    }

    // Save image to .brandvault/uploads
    const uploadsDir = path.join(process.cwd(), '.brandvault', 'uploads');
    fs.mkdirSync(uploadsDir, { recursive: true });

    // Sanitize filename
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `${id}_${safeName}`;
    const destinationPath = path.join(uploadsDir, storageKey);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(destinationPath, buffer);

    // Run visual analysis engine
    const analysis = await runVisualCheck({
      imagePath: destinationPath,
      altText,
      isDecorative,
      channel: submission.channel || 'WEBSITE',
      foregroundColor,
      backgroundColor,
      isLargeText,
    });

    // Create analysis run for visual check
    const run = await storage.createAnalysisRun({
      workspace_id: submission.workspace_id,
      submission_id: id,
      content_version_id: null,
      provider: 'OpenCV + WCAG 2.2 Engine',
      model_name: 'opencv-orb-wcag22',
      prompt_version: 'v1-visual',
      status: 'COMPLETED',
      result: analysis as any,
      error_message: null,
      completed_at: new Date().toISOString(),
      duration_ms: 150,
    });

    // Persist visual findings into the standard findings table
    const findingInputs = analysis.findings.map((f) => ({
      workspace_id: submission.workspace_id,
      submission_id: id,
      analysis_run_id: run.id,
      finding_type: f.type,
      severity: f.severity,
      rule_id: f.ruleId,
      title: f.title,
      message: f.message,
      excerpt: f.originalPhrase,
      original_phrase: f.originalPhrase,
      explanation: f.message,
      suggested_correction: f.suggestedCorrection,
      diff: f.evidence as any,
      confidence: f.confidence,
      status: 'OPEN',
    }));

    const createdFindings = await storage.createFindings(findingInputs as any);

    // Attach evidence
    for (let i = 0; i < createdFindings.length; i++) {
      const f = analysis.findings[i];
      await storage.createFindingEvidence([
        {
          finding_id: createdFindings[i].id,
          approved_fact_id: null,
          source_document_id: null,
          evidence_excerpt: JSON.stringify(f.evidence),
          relevance_explanation: f.message,
          evidence_relation: 'CONTRADICTS',
        } as any,
      ]);
    }

    // Update submission risk level if visual violations found
    if (analysis.findings.length > 0) {
      const hasCritical = analysis.findings.some((f) => f.severity === 'HIGH');
      await storage.updateSubmission(id, {
        risk_level: hasCritical ? 'HIGH' : 'MEDIUM',
        status: 'NEEDS_REVIEW',
      });
    }

    return NextResponse.json({
      success: true,
      visualReview: analysis,
      imageUrl: `/api/uploads/${storageKey}`,
      findings: createdFindings,
    });
  } catch (err: any) {
    console.error('Visual assets upload error:', err);
    return NextResponse.json({ error: err?.message || 'Visual analysis failed' }, { status: 500 });
  }
}
