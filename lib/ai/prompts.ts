import type { AnalysisOutput, ClaimResult, FindingResult } from './schemas';
import type { VerificationStatus } from '@/types/database';

export function systemPrefix(workspaceName: string): string {
  return `You are a brand governance analyst for ${workspaceName}. Your job is to review marketing and brand content against the organisation's approved knowledge and brand guidelines. You do not write content. You identify problems, cite evidence, and explain findings with traceable sources. Be precise, cautious, and never fabricate evidence. If evidence is missing, say so. Never treat missing evidence as proof that a claim is false.`;
}

export function extractClaimsPrompt(content: string): string {
  return `${systemPrefix('the organisation')}

TASK: Extract atomic factual claims from the content below.

Rules:
- Identify only factual, verifiable statements: product specifications, quantified statements, comparisons, performance claims, guarantees, launch dates, materials, statistics.
- Do NOT treat opinions, subjective praise, calls to action, or general marketing fluff as factual claims.
- Each claim must be atomic (one fact per claim).
- Return JSON only.

Content:
"${content}"

Output JSON:
{
  "claims": [
    { "claimText": "...", "claimType": "PRODUCT_SPECIFICATION" }
  ]
}`;
}

export function verifyClaimsPrompt(content: string, claims: { claimText: string; claimType: string }[], evidence: Record<string, any[]>): string {
  const evidenceJson = JSON.stringify(evidence, null, 2);
  return `${systemPrefix('the organisation')}

TASK: Classify each extracted claim as SUPPORTED, CONTRADICTED or UNVERIFIED using ONLY the approved evidence below.

Definitions:
- SUPPORTED: approved evidence confirms the claim.
- CONTRADICTED: an approved source explicitly conflicts with the claim.
- UNVERIFIED: no sufficient approved evidence exists to establish the claim. Missing evidence is NOT proof of falsehood.

Approved evidence:
${evidenceJson}

Claims to verify:
${JSON.stringify(claims, null, 2)}

For each claim, find the matching evidence (by entity and subject) and classify it. Return JSON only.

Output JSON:
{
  "claims": [
    { "claimText": "...", "claimType": "...", "verificationStatus": "SUPPORTED|CONTRADICTED|UNVERIFIED", "explanation": "...", "evidenceIds": ["..."], "confidence": 0.0 }
  ]
}`;
}

export function toneAnalysisPrompt(content: string, guidelines: any[]): string {
  return `${systemPrefix('the organisation')}

TASK: Analyse the tone and language of the content against the active brand guidelines below. Do not flag a different writing style as a violation; only flag real conflicts with the published guidelines.

Guidelines:
${JSON.stringify(guidelines, null, 2)}

Content:
"${content}"

Return JSON only.

Output JSON:
{
  "summary": "...",
  "riskLevel": "LOW|MEDIUM|HIGH",
  "findings": [
    { "type": "TONE_VIOLATION|TERMINOLOGY_VIOLATION|GUIDELINE_VIOLATION|OTHER", "severity": "LOW|MEDIUM|HIGH", "title": "...", "excerpt": "...", "explanation": "...", "ruleId": "...", "evidenceIds": [], "suggestedCorrection": "...", "confidence": 0.0 }
  ],
  "suggestedContent": "...",
  "analysisNotes": "..."
}`;
}

export function correctionsPrompt(content: string, findings: FindingResult[], claims: Array<{ claimText: string; status: VerificationStatus; evidenceIds: string[] }>): string {
  return `${systemPrefix('the organisation')}

TASK: Produce a revised version of the content that resolves the findings and claim classifications below.

Rules:
- Preserve the author's intent and voice where possible.
- Correct contradicted claims using the evidence.
- Remove or qualify unverified statements.
- Use approved terminology.
- Do not introduce new unsupported claims.
- Return only the revised content text.

Original content:
"${content}"

Findings:
${JSON.stringify(findings, null, 2)}

Claims:
${JSON.stringify(claims, null, 2)}

Output JSON:
{
  "suggestedContent": "...",
  "analysisNotes": "..."
}`;
}

export function fullAnalysisPrompt(content: string, guidelines: any[], facts: any[]): string {
  return `${systemPrefix('the organisation')}

TASK: Perform a complete brand governance review of the content below.

Approved facts (evidence):
${JSON.stringify(facts, null, 2)}

Active brand guidelines:
${JSON.stringify(guidelines, null, 2)}

Content to review:
"${content}"

Steps:
1. Extract atomic factual claims.
2. Classify each claim SUPPORTED / CONTRADICTED / UNVERIFIED against the approved facts.
3. Detect terminology, tone and guideline violations.
4. Generate a corrected version.
5. Assign an overall risk level:
   - HIGH: any contradicted product-specification claim, unsupported superlative, or prohibited claim.
   - MEDIUM: unverified claims or tone violations without contradictions.
   - LOW: only minor issues or fully supported.

Return JSON only matching this schema:
{
  "summary": "string",
  "riskLevel": "LOW|MEDIUM|HIGH",
  "claims": [
    { "claimText": "string", "claimType": "string", "verificationStatus": "SUPPORTED|CONTRADICTED|UNVERIFIED", "explanation": "string", "evidenceIds": ["string"], "confidence": 0.0 }
  ],
  "findings": [
    { "type": "FACTUAL_CONTRADICTION|UNSUPPORTED_CLAIM|UNVERIFIED_CLAIM|TONE_VIOLATION|TERMINOLOGY_VIOLATION|GUIDELINE_VIOLATION|OTHER", "severity": "LOW|MEDIUM|HIGH", "title": "string", "excerpt": "string", "explanation": "string", "ruleId": "string|null", "evidenceIds": ["string"], "suggestedCorrection": "string|null", "confidence": 0.0 }
  ],
  "suggestedContent": "string",
  "analysisNotes": "string"
}`;
}