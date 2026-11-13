import type { BrandGuideline, ApprovedFact } from '@/types/database';
import type { FindingType, Severity } from '@/types/database';

export interface RuleMatch {
  ruleId: string | null;
  ruleCode: string | null;
  title: string;
  type: FindingType;
  severity: Severity;
  excerpt: string;
  explanation: string;
  suggestedCorrection: string | null;
  evidenceIds: string[];
  confidence: number;
}

const SUPERLATIVES = [
  { phrase: "world's best" },
  { phrase: 'number one' },
  { phrase: 'unmatched' },
  { phrase: 'best-in-class' },
  { phrase: 'the best' },
];

const TERM_MAP: Array<{ prohibited: string[]; preferred: string; ruleCode: string }> = [
  { prohibited: ['ai robot buddy', 'ai robot', 'robot buddy'], preferred: 'smart assistant', ruleCode: 'RULE-TERM-001' },
];

function findGuideline(guidelines: BrandGuideline[], ruleCode: string): BrandGuideline | null {
  return guidelines.find((g) => g.active && g.rule_code === ruleCode) ?? null;
}

function containsIgnoreCase(text: string, phrase: string): boolean {
  return text.toLowerCase().includes(phrase.toLowerCase());
}

function extractNumber(text: string): number | null {
  const m = text.match(/(\d+(?:[.,]\d+)*)/);
  return m ? Number(m[1].replace(/,/g, '.')) : null;
}

export function checkSuperlatives(content: string, guidelines: BrandGuideline[]): RuleMatch[] {
  const matches: RuleMatch[] = [];
  const rule = findGuideline(guidelines, 'RULE-TONE-002');
  for (const { phrase } of SUPERLATIVES) {
    const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    let m: RegExpExecArray | null;
    while ((m = re.exec(content))) {
      matches.push({
        ruleId: rule?.id ?? null,
        ruleCode: rule?.rule_code ?? null,
        title: 'Unsupported superlative',
        type: 'TERMINOLOGY_VIOLATION',
        severity: rule?.severity ?? 'HIGH',
        excerpt: m[0],
        explanation: `"${m[0]}" is an unsupported superlative. It must be backed by approved evidence before publication.`,
        suggestedCorrection: null,
        evidenceIds: [],
        confidence: 0.95,
      });
    }
  }
  return matches;
}

export function checkProhibitedTerms(content: string, guidelines: BrandGuideline[]): RuleMatch[] {
  const matches: RuleMatch[] = [];
  for (const { prohibited, preferred, ruleCode } of TERM_MAP) {
    const rule = findGuideline(guidelines, ruleCode);
    for (const term of prohibited) {
      const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      let m: RegExpExecArray | null;
      while ((m = re.exec(content))) {
        matches.push({
          ruleId: rule?.id ?? null,
          ruleCode,
          title: 'Non-preferred terminology',
          type: 'TERMINOLOGY_VIOLATION',
          severity: rule?.severity ?? 'MEDIUM',
          excerpt: m[0],
          explanation: `Use "${preferred}" instead of "${m[0]}".`,
          suggestedCorrection: preferred,
          evidenceIds: [],
          confidence: 0.97,
        });
      }
    }
  }
  return matches;
}

function factKeywords(fact: ApprovedFact): string[] {
  const text = `${fact.title} ${fact.fact_text} ${fact.source_excerpt ?? ''}`.toLowerCase();
  const stop = new Set(['the','a','an','and','or','of','is','are','was','were','in','on','at','to','for','with','up','under','no','not','currently','documented','offers','uses','weighs','scheduled','launch']);
  const words = text.split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !stop.has(w));
  return [...new Set(words)];
}

export function checkFactualClaimsAgainstFacts(content: string, facts: ApprovedFact[]): RuleMatch[] {
  const matches: RuleMatch[] = [];
  const approved = facts.filter((f) => f.verification_status === 'APPROVED');
  const indexed = approved.map((f) => ({ fact: f, keywords: factKeywords(f) }));
  const contentLower = content.toLowerCase();

  for (const { fact, keywords } of indexed) {
    const hits = keywords.filter((k) => contentLower.includes(k));
    if (hits.length === 0) continue;
    const number = extractNumber(content);
    const factNumber = extractNumber(fact.fact_text);
    if (number !== null && factNumber !== null && number !== factNumber) {
      matches.push({
        ruleId: null,
        ruleCode: 'RULE-CLAIM-001',
        title: 'Product specification contradicted',
        type: 'FACTUAL_CONTRADICTION',
        severity: 'HIGH',
        excerpt: `${number}`,
        explanation: `The approved specification (${fact.source_name}) states: "${fact.fact_text}". The content states a different value.`,
        suggestedCorrection: fact.fact_text,
        evidenceIds: [fact.id],
        confidence: 0.9,
      });
    }
  }

  const waterproofFact = approved.find((f) => /waterproof|water-resist|water resistant|ip\d/i.test(`${f.title} ${f.fact_text}`));
  if (!waterproofFact && /waterproof|water.resistant|water-resistant|ip\d/i.test(content)) {
    matches.push({
      ruleId: null,
      ruleCode: 'RULE-CLAIM-002',
      title: 'Waterproof claim without approved rating',
      type: 'UNVERIFIED_CLAIM',
      severity: 'HIGH',
      excerpt: 'waterproof',
      explanation: 'No approved waterproof or water-resistance rating is documented for this product.',
      suggestedCorrection: null,
      evidenceIds: [],
      confidence: 0.85,
    });
  }

  return matches;
}
export function buildEvidenceIndex(facts: ApprovedFact[]): Record<string, ApprovedFact[]> {
  const index: Record<string, ApprovedFact[]> = {};
  const approved = facts.filter((f) => f.verification_status === 'APPROVED');
  for (const fact of approved) {
    const words = `${fact.title} ${fact.fact_text} ${fact.source_excerpt ?? ''}`.toLowerCase().split(/[^a-z0-9]+/);
    for (const w of words) {
      if (w.length > 3) {
        if (!index[w]) index[w] = [];
        index[w].push(fact);
      }
    }
  }
  return index;
}

export function retrieveEvidenceForClaim(claimText: string, facts: ApprovedFact[]): ApprovedFact[] {
  const approved = facts.filter((f) => f.verification_status === 'APPROVED');
  if (approved.length === 0) return [];
  const words = claimText.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3);
  const scores = new Map<string, number>();
  for (const word of words) {
    for (const fact of approved) {
      const haystack = `${fact.title} ${fact.fact_text} ${fact.source_excerpt ?? ''}`.toLowerCase();
      if (haystack.includes(word)) {
        scores.set(fact.id, (scores.get(fact.id) ?? 0) + 1);
      }
    }
  }
  return approved
    .filter((f) => (scores.get(f.id) ?? 0) > 0)
    .sort((a, b) => ((scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0)))
    .slice(0, 4);
}
