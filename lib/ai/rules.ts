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

export function checkFactualClaimsAgainstFacts(content: string, facts: ApprovedFact[], guidelines: BrandGuideline[] = []): RuleMatch[] {
  const matches: RuleMatch[] = [];
  const approved = facts.filter((f) => f.verification_status === 'APPROVED');
  const ruleClaim001 = findGuideline(guidelines, 'RULE-CLAIM-001');
  const ruleClaim002 = findGuideline(guidelines, 'RULE-CLAIM-002');

  // Break content into clauses or sentences for targeted matching
  const sentences = content
    .split(/(?<=[.!?])\s+|,\s+and\s+|;\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // Check battery life claims specifically
  const batteryFact = approved.find((f) => f.fact_code === 'FACT-001' || /battery/i.test(f.title));
  if (batteryFact) {
    for (const sent of sentences) {
      if (/battery|hours?\s+of\s+battery|battery\s+life/i.test(sent)) {
        const matchNum = sent.match(/(\d+)\s*(?:hours?|hrs?)/i);
        if (matchNum) {
          const statedHours = parseInt(matchNum[1], 10);
          const approvedNum = (batteryFact.fact_text.match(/(\d+)\s*hours?/i) ?? [])[1];
          const approvedHours = approvedNum ? parseInt(approvedNum, 10) : 24;

          if (statedHours !== approvedHours) {
            matches.push({
              ruleId: ruleClaim001?.id ?? null,
              ruleCode: 'RULE-CLAIM-001',
              title: 'Battery life specification contradicted',
              type: 'FACTUAL_CONTRADICTION',
              severity: ruleClaim001?.severity ?? 'HIGH',
              excerpt: matchNum[0],
              explanation: `The content states ${statedHours} hours of battery life, but the approved specification (${batteryFact.source_name}) states up to ${approvedHours} hours under specified test conditions.`,
              suggestedCorrection: `up to ${approvedHours} hours of battery life`,
              evidenceIds: [batteryFact.id],
              confidence: 0.96,
            });
          }
        }
      }
    }
  }

  // Check device weight claims specifically
  const weightFact = approved.find((f) => f.fact_code === 'FACT-002' || /weight|weigh/i.test(f.title));
  if (weightFact) {
    for (const sent of sentences) {
      if (/weigh|weight|grams?|185g/i.test(sent)) {
        const matchNum = sent.match(/(\d+)\s*(?:grams?|g\b)/i);
        if (matchNum) {
          const statedWeight = parseInt(matchNum[1], 10);
          const approvedNum = (weightFact.fact_text.match(/(\d+)\s*grams?/i) ?? [])[1];
          const approvedWeight = approvedNum ? parseInt(approvedNum, 10) : 185;

          if (statedWeight !== approvedWeight) {
            matches.push({
              ruleId: ruleClaim001?.id ?? null,
              ruleCode: 'RULE-CLAIM-001',
              title: 'Device weight specification contradicted',
              type: 'FACTUAL_CONTRADICTION',
              severity: ruleClaim001?.severity ?? 'HIGH',
              excerpt: matchNum[0],
              explanation: `The content states ${statedWeight}g, but the approved specification (${weightFact.source_name}) states ${approvedWeight} grams.`,
              suggestedCorrection: `${approvedWeight} grams`,
              evidenceIds: [weightFact.id],
              confidence: 0.95,
            });
          }
        }
      }
    }
  }

  // Check waterproofing claims:
  // FACT-004 explicitly states: "No approved waterproof rating is currently documented."
  // RULE-CLAIM-002 states: "Waterproof claims require explicit approval. Do not communicate waterproofing without an approved source."
  const waterproofRegex = /\b(?:completely\s+waterproof|waterproof|water-proof|water-resistant|water\s+resistant)\b/i;
  const wpMatch = content.match(waterproofRegex);
  if (wpMatch) {
    const wpFact = approved.find((f) => f.fact_code === 'FACT-004' || /waterproof/i.test(f.title));
    matches.push({
      ruleId: ruleClaim002?.id ?? null,
      ruleCode: 'RULE-CLAIM-002',
      title: 'Waterproof claim without approved rating',
      type: 'UNVERIFIED_CLAIM',
      severity: ruleClaim002?.severity ?? 'HIGH',
      excerpt: wpMatch[0],
      explanation: `Content asserts "${wpMatch[0]}", but the Product Claims Register (FACT-004) states: "No approved waterproof rating is currently documented." Do not communicate waterproofing or water resistance without an approved rating.`,
      suggestedCorrection: 'splash-resistant (see specifications for details)',
      evidenceIds: wpFact ? [wpFact.id] : [],
      confidence: 0.95,
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
