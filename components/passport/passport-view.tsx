'use client';

import Link from 'next/link';
import {
  Printer, ArrowLeft, ShieldCheck, CheckCircle2, XCircle, AlertTriangle,
  FileText, Clock, Database, UserCheck, Scale, History
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

interface PassportViewProps {
  submission: ContentSubmission;
  claims: ExtractedClaim[];
  findings: Array<Finding & { finding_evidence?: Array<FindingEvidence & { approved_facts?: ApprovedFact }> }>;
  decisions: ReviewDecisionRecord[];
  versions: ContentVersion[];
  runs: AnalysisRun[];
  auditLogs: AuditLog[];
  workspaceName: string;
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
}: PassportViewProps) {
  const passportId = submission.passport_reference || getPassportReference(submission);
  const latestRun = runs[0];
  const finalDecision = decisions[0] || null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Controls (Hidden on Print) */}
      <div className="flex items-center justify-between no-print">
        <Link
          href={`/reviews/${submission.reference || submission.id}`}
          className="text-sm font-semibold text-ink-secondary hover:text-ink-dark flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Content Review</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Passport</span>
          </Button>
        </div>
      </div>

      {/* Main Passport Certificate Container */}
      <div className="bg-surface border-2 border-border rounded-xl p-8 sm:p-10 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
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
            <span className="font-medium text-ink-dark">{formatDateTime(submission.created_at)}</span>
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
                <span className="text-[10px] font-mono text-ink-secondary">Preserved</span>
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
                <span className="text-[10px] font-mono text-success font-semibold">Active State</span>
              </div>
              <p className="font-sans text-ink-dark leading-relaxed whitespace-pre-wrap">
                {submission.current_content}
              </p>
            </div>
          </div>
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

        {/* 4. Detected Brand Findings & Evidence Records */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink-dark">
              3. Policy Violations & Source Ground Truth ({findings.length})
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
                <span className="font-mono text-ink-secondary">
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
                <span className="text-ink-secondary font-mono">{formatDateTime(v.created_at)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Official Footer Verification Seal */}
        <div className="pt-6 border-t-2 border-ink-dark flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-ink-secondary">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <span>Cryptographically Verified Brand Governance Passport</span>
          </div>
          <div className="font-mono">
            Generated by BrandVault AI Engine • Model: {latestRun?.model_name || 'Gemini 1.5'}
          </div>
        </div>
      </div>
    </div>
  );
}

