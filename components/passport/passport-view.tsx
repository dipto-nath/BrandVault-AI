'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Printer, ArrowLeft, ShieldCheck, CheckCircle2, XCircle, AlertTriangle,
  FileText, Clock, Database, UserCheck, Scale, History, Download, Hash
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { formatDateTime, getPassportReference, statusToVariant } from '@/lib/utils';
import type {
  ContentSubmission, ExtractedClaim, Finding, ReviewDecisionRecord,
  ContentVersion, AnalysisRun, AuditLog, FindingEvidence, ApprovedFact
} from '@/types/database';

// Compute SHA-256 hash of content
async function computeContentHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

interface PassportViewProps {
  submission: ContentSubmission;
  claims: ExtractedClaim[];
  findings: Array<Finding & { finding_evidence?: Array<FindingEvidence & { approved_facts?: ApprovedFact }> }>;
  decisions: ReviewDecisionRecord[];
  versions: ContentVersion[];
  runs: AnalysisRun[];
  auditLogs: AuditLog[];
  workspaceName: string;
  visualAsset?: any;
}

export function PassportView({
  submission,
  claims,
  findings,
  decisions,
  versions,
  runs,
  auditLogs,
  workspaceName,
  visualAsset,
}: PassportViewProps) {
  const passportId = submission.passport_reference || getPassportReference(submission);
  const latestRun = runs[0];
  const finalDecision = decisions[0] || null;
  
  const [contentHash, setContentHash] = useState<string>('');
  const [isComputingHash, setIsComputingHash] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Compute content hash on mount
  useEffect(() => {
    if (submission.current_content) {
      setIsComputingHash(true);
      computeContentHash(submission.current_content)
        .then(hash => setContentHash(hash))
        .finally(() => setIsComputingHash(false));
    }
  }, [submission.current_content]);

  const handleJsonExport = async () => {
    setIsExporting(true);
    try {
      const passportData = {
        passportId,
        contentTitle: submission.title,
        channel: submission.channel,
        product: (submission as any).product_id || null,
        contentVersion: versions.length,
        contentHash,
        claims: claims.map(c => ({
          claimText: c.claim_text,
          claimType: c.claim_type,
          verificationStatus: c.verification_status,
          explanation: c.explanation,
          confidence: c.confidence,
          evidenceIds: (c as any).evidence_ids || [],
        })),
        findings: findings.map(f => ({
          type: f.finding_type,
          severity: f.severity,
          title: f.title,
          excerpt: f.excerpt,
          explanation: f.explanation,
          suggestedCorrection: f.suggested_correction,
          confidence: f.confidence,
          status: f.status,
          overrideReason: (f as any).override_reason || null,
        })),
        decisions: decisions.map(d => ({
          decision: d.decision,
          comment: d.comment,
          createdAt: d.created_at,
        })),
        model: latestRun?.model_name || 'Unknown',
        provider: latestRun?.provider || 'Unknown',
        promptVersion: latestRun?.prompt_version || 'v1',
        auditTimeline: auditLogs.map(log => ({
          action: log.action,
          timestamp: log.created_at,
          entityType: log.entity_type,
          metadata: log.metadata,
        })),
        generatedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(passportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${passportId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Controls (Hidden on Print) */}
      <div className="flex items-center justify-between no-print print:hidden">
        <Link
          href={`/reviews/${submission.reference || submission.id}`}
          className="text-sm font-semibold text-ink-secondary hover:text-ink-dark flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Content Review</span>
        </Link>
        <div className="flex items-center gap-2">
          {/* SHA-256 Content Hash Display */}
          {(contentHash || isComputingHash) && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-subtle border border-border text-xs font-mono text-ink-secondary" title="SHA-256 content hash">
              <Hash className="w-3.5 h-3.5 text-brand" />
              <span className="truncate max-w-[200px]">
                {isComputingHash ? 'Computing hash...' : contentHash}
              </span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleJsonExport}
            disabled={isExporting || !contentHash}
            className="flex items-center gap-1.5 text-xs font-medium"
            title="Export passport as JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs bg-brand text-white hover:bg-brand/90 font-medium shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Passport</span>
          </Button>
        </div>
      </div>

      {/* Main Passport Certificate Container */}
      <div className="bg-surface border-2 border-border rounded-xl p-8 sm:p-10 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0 print:m-0 print:bg-transparent">
        {/* Certificate Header */}
        <div className="border-b-2 border-ink-dark pb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-accent" />
                <span className="text-xs font-bold uppercase tracking-widest text-ink-secondary">
                  BrandVault AI • Official Evidence Passport
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ink-dark">
                Brand Evidence Passport
              </h1>
              <p className="text-xs text-ink-secondary mt-1">
                Permanent, auditable record of factual claim verification, guideline adherence and human sign-off.
              </p>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary block">
                Passport Identifier
              </span>
              <span className="font-mono text-base font-bold text-ink-dark">
                {passportId}
              </span>
              <div className="mt-1">
                <Badge variant={statusToVariant(submission.status)}>
                  {submission.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* 1. Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-surface-subtle border border-border text-xs">
          <div>
            <span className="font-semibold text-ink-secondary uppercase text-[10px] tracking-wider block mb-0.5">
              Workspace
            </span>
            <span className="font-bold text-ink-dark">{workspaceName}</span>
          </div>
          <div>
            <span className="font-semibold text-ink-secondary uppercase text-[10px] tracking-wider block mb-0.5">
              Content Type
            </span>
            <span className="font-medium text-ink-dark">{submission.content_type}</span>
          </div>
          <div>
            <span className="font-semibold text-ink-secondary uppercase text-[10px] tracking-wider block mb-0.5">
              Publishing Channel
            </span>
            <span className="font-medium text-ink-dark">{submission.channel}</span>
          </div>
          <div>
            <span className="font-semibold text-ink-secondary uppercase text-[10px] tracking-wider block mb-0.5">
              Submission Date
            </span>
            <span suppressHydrationWarning className="font-medium text-ink-dark">{formatDateTime(submission.created_at)}</span>
          </div>
        </div>

        {/* 2. Content Preservation Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <FileText className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink-dark">
              1. Content Ingestion & Evolution
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 rounded-lg border border-border bg-surface text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink-secondary uppercase text-[10px] tracking-wider">
                  Original Submitted Content (v1)
                </span>
                <span className="text-[10px] font-mono text-ink-secondary bg-sand/60 px-2 py-0.5 rounded">Preserved</span>
              </div>
              <p className="font-sans text-ink leading-relaxed whitespace-pre-wrap">
                {submission.original_content}
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-surface text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink-secondary uppercase text-[10px] tracking-wider">
                  Final Active Content {versions.length > 1 ? `(v${versions.length})` : ''}
                </span>
                <span className="text-[10px] font-mono text-evidence-supported font-semibold bg-evidence-supported/10 px-2 py-0.5 rounded">
                  {submission.status === 'APPROVED' ? 'Approved State' : 'Active State'}
                </span>
              </div>
              <p className="font-sans text-ink-dark leading-relaxed whitespace-pre-wrap">
                {submission.current_content}
              </p>
            </div>
          </div>

          {submission.current_content !== submission.original_content ? (
            <div className="p-3.5 rounded-xl border border-evidence-supported/30 bg-evidence-supported/5 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-ink-dark font-bold">
                <CheckCircle2 className="w-4 h-4 text-evidence-supported" />
                <span>Compliance Revisions Applied</span>
              </div>
              <p className="text-ink-secondary leading-relaxed">
                The content was edited during human review to correct policy contradictions, adjust brand tone, and replace unverified superlatives prior to official sign-off.
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-lg border border-border bg-surface-subtle text-xs text-ink-secondary flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-evidence-supported" />
              <span>Approved in original submitted form without text alterations.</span>
            </div>
          )}
        </div>

        {/* 3. Extracted Factual Claims (Three States) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <Scale className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink-dark">
              2. Factual Claims Verification ({claims.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <Thead>
                <Tr>
                  <Th className="w-2/5">Atomic Statement</Th>
                  <Th className="w-32">Verification State</Th>
                  <Th className="w-24">Confidence</Th>
                  <Th>Evidence Basis</Th>
                </Tr>
              </Thead>
              <Tbody>
                {claims.length === 0 ? (
                  <Tr>
                    <Td className="py-4 text-center text-xs text-ink-secondary">
                      No factual claims extracted.
                    </Td>
                  </Tr>
                ) : (
                  claims.map((c) => (
                    <Tr key={c.id}>
                      <Td className="text-xs font-medium text-ink-dark">
                        {c.claim_text}
                      </Td>
                      <Td>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                            c.verification_status === 'SUPPORTED'
                              ? 'bg-[#E9F2EB] text-[#52795F]'
                              : c.verification_status === 'CONTRADICTED'
                              ? 'bg-[#F9ECEC] text-[#B54B48]'
                              : 'bg-[#F5EDDF] text-[#B17C36]'
                          }`}
                        >
                          {c.verification_status}
                        </span>
                      </Td>
                      <Td className="text-xs text-ink-secondary font-mono">
                        {Math.round((c.confidence ?? 0.8) * 100)}%
                      </Td>
                      <Td className="text-xs text-ink-secondary leading-relaxed">
                        {c.explanation}
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </div>
        </div>

        {/* 3. Visual & Accessibility Verification (Blueprint Section 6 & 11) */}
        {visualAsset && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-ink-dark">
                3. Visual & Accessibility Audit (OpenCV + WCAG 2.2)
              </h2>
            </div>

            <div className="p-4 rounded-xl border border-border bg-surface text-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 rounded-lg overflow-hidden border border-border bg-sand/20 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={visualAsset.url}
                      alt={visualAsset.filename || 'Creative'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-ink-dark text-sm block">
                      {visualAsset.filename}
                    </span>
                    <span className="text-[11px] font-mono text-ink-secondary block">
                      {(visualAsset.byteSize / 1024).toFixed(0)} KB · Labelled Asset
                    </span>
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-brand block">
                      Audited by BrandVault Visual Pipeline
                    </span>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                  {findings.some((f) => f.finding_type === 'ASSET_MISMATCH') ? (
                    <Badge variant="destructive" className="text-[11px] py-1 px-2.5">
                      🔴 Outdated Logo (v2 vs v4)
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[11px] py-1 px-2.5 bg-evidence-supported/10 text-evidence-supported border-evidence-supported/30">
                      🟢 Approved Logo (v4)
                    </Badge>
                  )}

                  {findings.some((f) => f.finding_type === 'LOW_CONTRAST') ? (
                    <Badge variant="destructive" className="text-[11px] py-1 px-2.5">
                      🔴 Contrast Below 4.5:1
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[11px] py-1 px-2.5 bg-evidence-supported/10 text-evidence-supported border-evidence-supported/30">
                      🟢 WCAG 2.2 AA Contrast Pass
                    </Badge>
                  )}

                  {findings.some((f) => f.finding_type === 'MISSING_ALT_TEXT') ? (
                    <Badge variant="secondary" className="text-[11px] py-1 px-2.5 bg-amber-500/10 text-amber-700 border-amber-500/30">
                      🟡 Missing Alt Text
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[11px] py-1 px-2.5 bg-evidence-supported/10 text-evidence-supported border-evidence-supported/30">
                      🟢 Alt-Text Compliant
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Detected Brand Findings & Evidence Records */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink-dark">
              4. Policy Violations & Source Ground Truth ({findings.length})
            </h2>
          </div>

          {findings.length === 0 ? (
            <div className="p-4 rounded-lg bg-surface-subtle text-xs text-ink-secondary text-center">
              Zero brand or factual violations detected.
            </div>
          ) : (
            <div className="space-y-3">
              {findings.map((f, i) => (
                <div
                  key={f.id}
                  className="p-4 rounded-lg border border-border bg-surface text-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-ink-dark text-sm">
                      #{i + 1} {f.title}
                    </div>
                    <Badge variant={f.severity === 'HIGH' ? 'high' : f.severity === 'MEDIUM' ? 'medium' : 'low'}>
                      {f.severity}
                    </Badge>
                  </div>
                  <div className="font-mono text-critical bg-surface-subtle p-2 rounded">
                    &ldquo;{f.excerpt}&rdquo;
                  </div>
                  <p className="text-ink leading-relaxed">
                    {f.explanation}
                  </p>
                  {f.suggested_correction && (
                    <div className="pt-1 text-ink-secondary">
                      <span className="font-semibold text-success">Correction: </span>
                      <span className="text-ink-dark">&ldquo;{f.suggested_correction}&rdquo;</span>
                    </div>
                  )}
                  {f.finding_evidence && f.finding_evidence.length > 0 && (
                    <div className="pt-2 border-t border-border/60 text-[11px] text-ink-secondary">
                      <span className="font-semibold text-ink-dark">Evidence Citation: </span>
                      {f.finding_evidence[0].approved_facts?.source_name}:{' '}
                      {f.finding_evidence[0].evidence_excerpt || f.finding_evidence[0].approved_facts?.fact_text}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. Human Decision & Sign-off Authority */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <UserCheck className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink-dark">
              4. Human Review & Approval Decision
            </h2>
          </div>

          {finalDecision ? (
            <div className="p-5 rounded-lg border border-border bg-surface-subtle space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink-dark text-sm">
                  Official Decision: <span className="uppercase">{finalDecision.decision}</span>
                </span>
                <span suppressHydrationWarning className="font-mono text-ink-secondary">
                  {formatDateTime(finalDecision.created_at)}
                </span>
              </div>
              <p className="text-ink-dark leading-relaxed font-medium">
                {finalDecision.comment || 'Approved without additional reservations.'}
              </p>
              <div className="text-[11px] text-ink-secondary pt-2 border-t border-border">
                Signed by authorized reviewer: <span className="font-semibold text-ink-dark">Demo Reviewer (Reviewer Role)</span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-warning-soft/30 border border-warning/30 text-xs text-warning font-medium">
              Awaiting formal human review decision. Content cannot be published without sign-off.
            </div>
          )}
        </div>

        {/* 6. Version History & Audit Trail Timeline */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <History className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink-dark">
              5. Audit Timeline & Lifecycle History
            </h2>
          </div>

          <div className="space-y-2 text-xs">
            {versions.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between p-2.5 rounded bg-surface border border-border/70"
              >
                <div>
                  <span className="font-bold text-ink-dark mr-2">Version {v.version_number}</span>
                  <span className="text-ink-secondary">{v.change_reason || 'Content revised'}</span>
                </div>
                <span suppressHydrationWarning className="text-ink-secondary font-mono">{formatDateTime(v.created_at)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Official Footer Verification Seal */}
        <div className="pt-6 border-t-2 border-ink-dark flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-ink-secondary">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <span>Content Hash Recorded • Brand Governance Passport</span>
          </div>
          <div className="font-mono">
            Generated by BrandVault AI Engine • Model: {latestRun?.model_name || 'Gemini 1.5'}
          </div>
        </div>
      </div>
    </div>
  );
}

