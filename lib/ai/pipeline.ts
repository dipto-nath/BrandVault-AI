import type { BrandGuideline, ApprovedFact } from '@/types/database';
import type { AnalysisOutput, ClaimResult, FindingResult } from './schemas';
import { AnalysisOutputSchema, FindingTypeSchema, SeveritySchema, RiskLevelSchema } from './schemas';
import { generateJson, extractJsonBlock, AI_PROVIDER, AI_MODEL, AI_AVAILABLE, ProviderUnavailableError } from './provider';
import { fullAnalysisPrompt, toneAnalysisPrompt, correctionsPrompt } from './prompts';
import { checkSuperlatives, checkProhibitedTerms, checkFactualClaimsAgainstFacts, retrieveEvidenceForClaim } from './rules';
import { VerificationStatus } from '@/types/database';

const EXAGGERATION_WORDS = ['incredible', 'amazing', 'revolutionary', 'miracle', 'act now', 'limited time', 'buy today', 'get yours today'];

interface DeterministicClaim {
  claimText: string;
  claimType: string;
}

function splitSentences(text: string): string[] {
  return text.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 3);
}

function looksFactual(sentence: string): boolean {
  const lower = sentence.toLowerCase();
  return /\d/.test(sentence) || /nova|nexatech|battery|weight|gram|hour|waterproof|launch|material|aluminium/i.test(lower);
}

function deterministicClaimExtraction(content: string): DeterministicClaim[] {
  const claims: DeterministicClaim[] = [];
  for (const sentence of splitSentences(content)) {
    if (looksFactual(sentence)) {
      claims.push({ claimText: sentence.endsWith('.') ? sentence : sentence + '.', claimType: 'PRODUCT_SPECIFICATION' });
    }
  }
  if (claims.length === 0) {
    claims.push({ claimText: content, claimType: 'OTHER' });
  }
  return claims;
}

async function aiExtractClaims(content: string): Promise<DeterministicClaim[]> {
  try {
    const text = await generateJson({ prompt: `Extract atomic factual claims from: "${content}". Return JSON: { "claims": [{ "claimText": "...", "claimType": "..." }] }`, temperature: 0.1 });
    const json = JSON.parse(extractJsonBlock(text));
    return (json.claims ?? []).map((c: any) => ({ claimText: String(c.claimText || ''), claimType: String(c.claimType || 'OTHER') })).filter((c: { claimText: string }) => c.claimText);
  } catch {
    return deterministicClaimExtraction(content);
  }
}

function deterministicVerify(claimText: string, evidence: ApprovedFact[]): { status: VerificationStatus; explanation: string; evidenceIds: string[]; confidence: number } {
  if (evidence.length === 0) {
    return { status: 'UNVERIFIED', explanation: 'No approved evidence found for this claim.', evidenceIds: [], confidence: 0.6 };
  }
  const claimNum = (claimText.match(/(\d+(?:[.,]\d+)*)/) ?? [])[0];
  const factNums = evidence.map((e) => (e.fact_text.match(/(\d+(?:[.,]\d+)*)/) ?? [])[0]);
  if (claimNum !== undefined && factNums.includes(claimNum)) {
    return { status: 'SUPPORTED', explanation: `Approved evidence confirms: "${evidence[0].fact_text}".`, evidenceIds: evidence.map((e) => e.id), confidence: 0.92 };
  }
  if (claimNum !== undefined && factNums.length > 0 && !factNums.includes(claimNum)) {
    return { status: 'CONTRADICTED', explanation: `The approved specification states: "${evidence[0].fact_text}", which conflicts with "${claimText}".`, evidenceIds: evidence.map((e) => e.id), confidence: 0.94 };
  }
  return { status: 'SUPPORTED', explanation: `Approved evidence is consistent with the claim: "${evidence[0].fact_text}".`, evidenceIds: evidence.map((e) => e.id), confidence: 0.75 };
}

async function aiVerifyClaims(content: string, claims: DeterministicClaim[], evidenceMap: Map<string, ApprovedFact[]>): Promise<Array<{ claimText: string; status: VerificationStatus; explanation: string; evidenceIds: string[]; confidence: number }>> {
  try {
    const evidence: Record<string, any[]> = {};
    for (const c of claims) evidence[c.claimText] = (evidenceMap.get(c.claimText) ?? []).map((e) => ({ id: e.id, sourceName: e.source_name, excerpt: e.source_excerpt ?? e.fact_text, sourceType: 'APPROVED_FACT' }));
    const text = await generateJson({ prompt: JSON.stringify({ content, claims, evidence }) + '\nClassify each claim SUPPORTED/CONTRADICTED/UNVERIFIED. Return JSON: { "claims": [{ "claimText", "claimType", "verificationStatus", "explanation", "evidenceIds", "confidence" }] }', temperature: 0.1 });
    const json = JSON.parse(extractJsonBlock(text));
    const out: Array<{ claimText: string; status: VerificationStatus; explanation: string; evidenceIds: string[]; confidence: number }> = [];
    for (const c of (json.claims ?? [])) {
      const base = claims.find((x) => x.claimText === String(c.claimText)) ?? claims[0];
      out.push({ claimText: base.claimText, status: c.verificationStatus, explanation: String(c.explanation || ''), evidenceIds: Array.isArray(c.evidenceIds) ? c.evidenceIds : [], confidence: Number(c.confidence ?? 0.7) });
    }
    return out;
  } catch {
    return claims.map((c) => { const v = deterministicVerify(c.claimText, evidenceMap.get(c.claimText) ?? []); return { claimText: c.claimText, ...v }; });
  }
}

function deterministicTone(content: string, guidelines: BrandGuideline[]): FindingResult[] {
  const findings: FindingResult[] = [];
  const lower = content.toLowerCase();
  for (const word of EXAGGERATION_WORDS) {
    if (lower.includes(word)) {
      findings.push({ type: 'TONE_VIOLATION', severity: 'MEDIUM', title: 'Exaggerated promotional language', excerpt: word, explanation: `Avoid exaggerated or urgent language ("${word}") that cannot be substantiated.`, ruleId: null, evidenceIds: [], suggestedCorrection: null, confidence: 0.7 });
    }
  }
  return findings;
}

async function aiTone(content: string, guidelines: BrandGuideline[]): Promise<FindingResult[]> {
  try {
    const text = await generateJson({ prompt: toneAnalysisPrompt(content, guidelines), temperature: 0.2 });
    const json = JSON.parse(extractJsonBlock(text));
    return (json.findings ?? []).map((f: any) => ({ type: f.type, severity: f.severity, title: f.title, excerpt: f.excerpt, explanation: f.explanation, ruleId: f.ruleId ?? null, evidenceIds: f.evidenceIds ?? [], suggestedCorrection: f.suggestedCorrection ?? null, confidence: Number(f.confidence ?? 0.7) }));
  } catch {
    return deterministicTone(content, guidelines);
  }
}

async function aiCorrections(content: string, findings: FindingResult[], claims: Array<{ claimText: string; status: VerificationStatus; evidenceIds: string[] }>): Promise<string> {
  try {
    const text = await generateJson({ prompt: correctionsPrompt(content, findings, claims), temperature: 0.3 });
    const json = JSON.parse(extractJsonBlock(text));
    return String(json.suggestedContent || content);
  } catch {
    return deterministicCorrections(content, findings, claims);
  }
}

function deterministicCorrections(content: string, findings: FindingResult[], claims: Array<{ claimText: string; status: VerificationStatus; evidenceIds: string[] }>): string {
  let revised = content;
  for (const f of findings) {
    if (f.suggestedCorrection) {
      revised = revised.replace(new RegExp(f.excerpt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), f.suggestedCorrection);
    }
  }
  for (const c of claims) {
    if (c.status === 'UNVERIFIED') {
      revised = revised.replace(new RegExp(c.claimText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), `[unverified: ${c.claimText}]`);
    }
    if (c.status === 'CONTRADICTED') {
      revised = revised.replace(new RegExp(c.claimText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), `[corrected: ${c.claimText}]`);
    }
  }
  return revised;
}

function calculateRiskLevel(ruleMatches: any[], claimFindings: FindingResult[], toneFindings: FindingResult[]): 'LOW' | 'MEDIUM' | 'HIGH' {
  const all = [...ruleMatches, ...claimFindings, ...toneFindings];
  if (all.some((f) => f.severity === 'HIGH')) return 'HIGH';
  if (all.length > 0) return 'MEDIUM';
  return 'LOW';
}

export interface PipelineInput {
  workspaceId: string;
  submissionId: string;
  content: string;
  guidelines: BrandGuideline[];
  facts: ApprovedFact[];
}

export interface PipelineResult {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  summary: string;
  claims: Array<{ claimText: string; claimType: string; verificationStatus: VerificationStatus; explanation: string; evidenceIds: string[]; confidence: number }>;
  findings: FindingResult[];
  suggestedContent: string;
  analysisNotes: string;
  partial: boolean;
  provider: string;
  model: string;
  durationMs: number;
}

export async function runAnalysisPipeline(input: PipelineInput): Promise<PipelineResult> {
  const start = Date.now();
  const partial = !AI_AVAILABLE;
  const provider = AI_PROVIDER;
  const model = AI_MODEL;

  // Stage 4: deterministic brand policy rules
  const ruleMatches = [
    ...checkSuperlatives(input.content, input.guidelines),
    ...checkProhibitedTerms(input.content, input.guidelines),
    ...checkFactualClaimsAgainstFacts(input.content, input.facts),
  ];

  // Stage 1: claim extraction
  const claims = await aiExtractClaims(input.content);

  // Stage 2 + 3: evidence retrieval + verification
  const evidenceMap = new Map<string, ApprovedFact[]>();
  for (const c of claims) evidenceMap.set(c.claimText, retrieveEvidenceForClaim(c.claimText, input.facts));
  const verified = await aiVerifyClaims(input.content, claims, evidenceMap);

  // Stage 5: tone analysis
  const toneFindings = partial ? deterministicTone(input.content, input.guidelines) : await aiTone(input.content, input.guidelines);

  // Build claim-based findings
  const claimFindings: FindingResult[] = [];
  for (const v of verified) {
    if (v.status === 'CONTRADICTED') {
      claimFindings.push({ type: 'FACTUAL_CONTRADICTION', severity: 'HIGH', title: 'Factual claim contradicted', excerpt: v.claimText, explanation: v.explanation, ruleId: null, evidenceIds: v.evidenceIds, suggestedCorrection: null, confidence: v.confidence });
    } else if (v.status === 'UNVERIFIED') {
      claimFindings.push({ type: 'UNVERIFIED_CLAIM', severity: 'MEDIUM', title: 'Unverified claim', excerpt: v.claimText, explanation: v.explanation, ruleId: null, evidenceIds: [], suggestedCorrection: null, confidence: v.confidence });
    }
  }

  // Merge findings (dedupe by excerpt)
  const allFindings: FindingResult[] = [];
  const seen = new Set<string>();
  const add = (f: FindingResult) => {
    const key = `${f.type}:${f.excerpt}`;
    if (!seen.has(key)) { seen.add(key); allFindings.push(f); }
  };
  for (const f of ruleMatches) add(f);
  for (const f of claimFindings) add(f);
  for (const f of toneFindings) add(f);

  // Stage 6: corrections
  const suggestedContent = partial ? deterministicCorrections(input.content, allFindings, verified) : await aiCorrections(input.content, allFindings, verified);

  // Stage 7/8: assemble + validate
  const summary = allFindings.length === 0 ? 'Content appears consistent with approved brand knowledge.' : `Review identified ${allFindings.length} issue(s) that should be resolved before publication.`;
  const riskLevel = calculateRiskLevel(ruleMatches, claimFindings, toneFindings);

  const output: AnalysisOutput = {
    summary,
    riskLevel,
    claims: verified.map((v) => ({ claimText: v.claimText, claimType: 'PRODUCT_SPECIFICATION', verificationStatus: v.status, explanation: v.explanation, evidenceIds: v.evidenceIds, confidence: v.confidence })),
    findings: allFindings,
    suggestedContent,
    analysisNotes: partial ? 'AI provider unavailable; deterministic checks only.' : 'AI-assisted analysis.',
  };

  AnalysisOutputSchema.parse(output); // Stage 8 validation

  return { ...output, partial, provider, model, durationMs: Date.now() - start, analysisNotes: output.analysisNotes ?? '' };
}
