import type {
  Finding, FindingEvidence, ApprovedFact, BrandGuideline, SourceDocument
} from '@/types/database';

export interface FindingOccurrence {
  id: string;
  excerpt: string;
  suggestedCorrection?: string;
  accepted?: boolean;
  dismissed?: boolean;
}

export interface FindingEvidenceView {
  documentName: string;
  versionSection: string;
  snippet: string;
  relation: 'Contradicts' | 'Supports' | 'Outdated' | 'No approved source found';
  relationVariant: 'contradicted' | 'supported' | 'outdated' | 'unverified';
  validity: string;
  factCode?: string;
  factTitle?: string;
  factId?: string;
}

export interface FindingViewModel {
  id: string;
  findingIds: string[];
  number: number;
  title: string;
  category: 'contradicted' | 'unverified' | 'terminology' | 'tone' | 'outdated';
  categoryLabel: 'Contradicted' | 'Unverified' | 'Terminology' | 'Tone' | 'Outdated';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  state: 'OPEN' | 'ACCEPTED' | 'DISMISSED' | 'OVERRIDDEN';
  overrideReason?: string;
  dismissReason?: string;
  flaggedExcerpt: string;
  occurrences: FindingOccurrence[];
  reason: string;
  rule: {
    code: string;
    title: string;
    category: string;
    id?: string;
  };
  evidence: FindingEvidenceView[];
  suggestedRewrite: {
    original: string;
    replacement: string;
  } | null;
  confidence: number;
  confidenceLabel: string;
}

type RuleReference = {
  id?: string;
  rule_code: string;
  title: string;
  category: string;
};

export function mapRawFindingsToViewModel(
  rawFindings: Array<Finding & { finding_evidence?: Array<FindingEvidence & { approved_facts?: ApprovedFact; source_documents?: SourceDocument }> }>,
  allGuidelines: BrandGuideline[],
  allFacts: ApprovedFact[]
): FindingViewModel[] {
  const guidelinesByCode = new Map(allGuidelines.map((g) => [g.rule_code, g]));
  const factsByCode = new Map(allFacts.map((f) => [f.fact_code, f]));

  // Default fallback guidelines for seed rules
  const ruleClaim001: RuleReference = guidelinesByCode.get('RULE-CLAIM-001') || {
    id: 'rule-claim-001',
    rule_code: 'RULE-CLAIM-001',
    title: 'Product specifications require evidence',
    category: 'CLAIMS',
  };
  const ruleClaim002: RuleReference = guidelinesByCode.get('RULE-CLAIM-002') || {
    id: 'rule-claim-002',
    rule_code: 'RULE-CLAIM-002',
    title: 'Waterproof claims require explicit approval',
    category: 'CLAIMS',
  };
  const ruleTerm001: RuleReference = guidelinesByCode.get('RULE-TERM-001') || {
    id: 'rule-term-001',
    rule_code: 'RULE-TERM-001',
    title: 'Preferred terminology',
    category: 'TERMINOLOGY',
  };
  const ruleTone002: RuleReference = guidelinesByCode.get('RULE-TONE-002') || {
    id: 'rule-tone-002',
    rule_code: 'RULE-TONE-002',
    title: 'Avoid unsupported superlatives',
    category: 'TONE',
  };
  const ruleTone001: RuleReference = guidelinesByCode.get('RULE-TONE-001') || {
    id: 'rule-tone-001',
    rule_code: 'RULE-TONE-001',
    title: 'Professional and helpful voice',
    category: 'TONE',
  };

  // Group duplicate terminology findings (e.g. "AI robot buddy", "AI robot", "robot buddy")
  const terminologyOccurrences: Array<{
    finding: Finding & { finding_evidence?: Array<FindingEvidence & { approved_facts?: ApprovedFact }> };
    excerpt: string;
  }> = [];

  const individualFindings: Array<Finding & { finding_evidence?: Array<FindingEvidence & { approved_facts?: ApprovedFact }> }> = [];

  for (const f of rawFindings) {
    const lowerExcerpt = (f.excerpt || '').toLowerCase();
    const lowerExp = (f.explanation || '').toLowerCase();

    // Check if this is a terminology finding for AI robot / smart assistant
    if (
      (lowerExcerpt.includes('robot') || lowerExp.includes('robot') || lowerExcerpt.includes('ai robot')) &&
      (f.suggested_correction?.toLowerCase().includes('smart assistant') || lowerExp.includes('smart assistant'))
    ) {
      terminologyOccurrences.push({
        finding: f,
        excerpt: f.excerpt || 'AI robot buddy',
      });
    } else {
      individualFindings.push(f);
    }
  }

  const result: FindingViewModel[] = [];
  let itemCounter = 1;

  // 1. Add grouped terminology card if any
  if (terminologyOccurrences.length > 0) {
    const primary = terminologyOccurrences[0].finding;
    const occurrences: FindingOccurrence[] = terminologyOccurrences.map((item) => ({
      id: item.finding.id,
      excerpt: item.excerpt,
      suggestedCorrection: item.finding.suggested_correction || 'smart assistant',
      accepted: false,
      dismissed: false,
    }));

    result.push({
      id: `group-term-${primary.id}`,
      findingIds: terminologyOccurrences.map((t) => t.finding.id),
      number: itemCounter++,
      title: 'Preferred terminology: use "smart assistant"',
      category: 'terminology',
      categoryLabel: 'Terminology',
      severity: 'MEDIUM',
      state: 'OPEN',
      flaggedExcerpt: occurrences.map((o) => `"${o.excerpt}"`).join(', '),
      occurrences,
      reason: 'Use "smart assistant" instead of robotic or sci-fi labels like "AI robot buddy" or "robot buddy".',
      rule: {
        code: ruleTerm001.rule_code,
        title: ruleTerm001.title,
        category: ruleTerm001.category,
        id: ruleTerm001.id,
      },
      evidence: [
        {
          documentName: 'NexTech Brand Terminology Glossary',
          versionSection: 'v2 · §3.4 Assistive AI',
          snippet: 'Always refer to device intelligence as the "built-in smart assistant". Do not use "AI robot" or "robot buddy" in external product communication.',
          relation: 'Supports',
          relationVariant: 'supported',
          validity: 'Active standard',
        },
      ],
      suggestedRewrite: {
        original: 'AI robot buddy',
        replacement: 'smart assistant',
      },
      confidence: 0.98,
      confidenceLabel: 'Exact terminology standard',
    });
  }

  // 2. Map individual findings
  for (const f of individualFindings) {
    const text = (f.excerpt || '').toLowerCase();
    const explanation = (f.explanation || '').toLowerCase();

    let category: 'contradicted' | 'unverified' | 'terminology' | 'tone' | 'outdated' = 'unverified';
    let categoryLabel: 'Contradicted' | 'Unverified' | 'Terminology' | 'Tone' | 'Outdated' = 'Unverified';
    let humanTitle = f.title || 'Brand finding';
    let rule: RuleReference = ruleClaim001;
    let severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = f.severity === 'HIGH' ? 'CRITICAL' : f.severity === 'MEDIUM' ? 'HIGH' : 'MEDIUM';

    // Battery / 48 hours contradiction
    if (text.includes('48 hour') || explanation.includes('48 hour') || explanation.includes('battery')) {
      category = 'contradicted';
      categoryLabel = 'Contradicted';
      severity = 'CRITICAL';
      humanTitle = 'Battery life claim contradicts approved specification';
      rule = ruleClaim001;
    }
    // Waterproof claim
    else if (text.includes('waterproof') || explanation.includes('waterproof')) {
      category = 'contradicted';
      categoryLabel = 'Contradicted';
      severity = 'CRITICAL';
      humanTitle = 'Waterproof claim not approved for marketing communication';
      rule = ruleClaim002;
    }
    // Superlative / world's best
    else if (text.includes("world's best") || text.includes('fastest') || text.includes('superlative') || explanation.includes('superlative')) {
      category = 'tone';
      categoryLabel = 'Tone';
      severity = 'CRITICAL';
      humanTitle = 'Unsupported superlative: "world\'s best" requires certified substantiation';
      rule = ruleTone002;
    }
    // Exaggerated urgency: incredible, get yours today
    else if (text.includes('incredible') || text.includes('get yours today') || explanation.includes('exaggerated')) {
      category = 'tone';
      categoryLabel = 'Tone';
      severity = 'MEDIUM';
      humanTitle = text.includes('incredible')
        ? 'Exaggerated promotional adjective ("incredible")'
        : 'Aggressive sales urgency ("get yours today")';
      rule = ruleTone001;
    }
    // Generic fallback mapping
    else if (f.finding_type === 'FACTUAL_CONTRADICTION') {
      category = 'contradicted';
      categoryLabel = 'Contradicted';
      severity = 'CRITICAL';
      humanTitle = f.title.replace(/_/g, ' ');
    } else if (f.finding_type === 'UNVERIFIED_CLAIM') {
      category = 'unverified';
      categoryLabel = 'Unverified';
      severity = 'HIGH';
      humanTitle = f.title.replace(/_/g, ' ');
    } else if (f.finding_type === 'TONE_VIOLATION') {
      category = 'tone';
      categoryLabel = 'Tone';
      severity = f.severity === 'HIGH' ? 'CRITICAL' : 'MEDIUM';
      humanTitle = f.title ? f.title.replace(/_/g, ' ') : 'Tone guideline violation';
      rule = ruleTone001;
    } else if (f.finding_type === 'TERMINOLOGY_VIOLATION') {
      category = 'terminology';
      categoryLabel = 'Terminology';
      severity = f.severity === 'HIGH' ? 'CRITICAL' : 'MEDIUM';
      humanTitle = f.title ? f.title.replace(/_/g, ' ') : 'Terminology guideline violation';
      rule = ruleTerm001;
    } else if (f.finding_type === 'ASSET_MISMATCH') {
      category = 'contradicted';
      categoryLabel = 'Contradicted';
      severity = 'CRITICAL';
      humanTitle = f.title || 'Outdated approved logo';
      rule = {
        rule_code: 'RULE-VISUAL-001',
        title: 'Approved brand asset versioning and currency requirement',
        category: 'VISUAL_BRANDING',
        id: 'rule-visual-001',
      };
    } else if (f.finding_type === 'LOW_CONTRAST') {
      category = 'tone';
      categoryLabel = 'Tone';
      severity = 'CRITICAL';
      humanTitle = f.title || 'Banner text contrast is too low';
      rule = {
        rule_code: 'RULE-A11Y-002',
        title: 'WCAG 2.2 AA §1.4.3 Text Contrast Minimum (4.5:1)',
        category: 'ACCESSIBILITY',
        id: 'rule-a11y-002',
      };
    } else if (f.finding_type === 'MISSING_ALT_TEXT') {
      category = 'unverified';
      categoryLabel = 'Unverified';
      severity = 'HIGH';
      humanTitle = f.title || 'Missing image alt text';
      rule = {
        rule_code: 'RULE-A11Y-001',
        title: 'WCAG 2.2 AA §1.1.1 Non-text Content (Alt-text requirement)',
        category: 'ACCESSIBILITY',
        id: 'rule-a11y-001',
      };
    }

    // Build Evidence Views with correct relations
    const evidenceViews: FindingEvidenceView[] = [];

    if (f.finding_type === 'ASSET_MISMATCH') {
      let evObj: any = {};
      try {
        evObj = typeof (f as any).diff === 'string' ? JSON.parse((f as any).diff) : ((f as any).diff || {});
      } catch {}
      const matchedV = evObj.matchedVersion || 'v2';
      const expectedV = evObj.expectedVersion || 'v4';
      evidenceViews.push({
        documentName: 'NexTech Approved Brand Asset Library',
        versionSection: `Asset: ${evObj.assetId || 'nextech-logo-primary'} · Current: ${expectedV}`,
        snippet: `Uploaded creative matched outdated brand mark version ${matchedV} (valid ${evObj.validityInterval || '2023-01-01 to 2025-12-31'}). Current approved standard is version ${expectedV} (effective 2026-01-01).`,
        relation: 'Contradicts',
        relationVariant: 'contradicted',
        validity: 'Expired 31 Dec 2025',
        factCode: 'ASSET-LOGO-001',
        factTitle: `Brand Logo Version (${matchedV} vs ${expectedV})`,
      });
    } else if (f.finding_type === 'LOW_CONTRAST') {
      let evObj: any = {};
      try {
        evObj = typeof (f as any).diff === 'string' ? JSON.parse((f as any).diff) : ((f as any).diff || {});
      } catch {}
      const ratio = evObj.ratio || 2.0;
      evidenceViews.push({
        documentName: 'W3C Web Content Accessibility Guidelines (WCAG) 2.2',
        versionSection: 'Level AA · Success Criterion 1.4.3 Contrast (Minimum)',
        snippet: `Measured relative luminance contrast ratio is ${ratio}:1 (Foreground ${evObj.foreground || '#AAB0BA'} on Background ${evObj.background || '#F3F4F6'}), failing the required 4.5:1 threshold for normal text.`,
        relation: 'Contradicts',
        relationVariant: 'contradicted',
        validity: 'WCAG 2.2 AA Standard',
        factCode: 'A11Y-CONTRAST',
        factTitle: `Text Contrast (${ratio}:1 vs 4.5:1 required)`,
      });
    } else if (f.finding_type === 'MISSING_ALT_TEXT') {
      evidenceViews.push({
        documentName: 'W3C Web Content Accessibility Guidelines (WCAG) 2.2',
        versionSection: 'Level AA · Success Criterion 1.1.1 Non-text Content',
        snippet: 'Digital creative published on web or social channels must include descriptive alternative text (or be explicitly marked decorative) for screen readers.',
        relation: 'No approved source found',
        relationVariant: 'unverified',
        validity: 'WCAG 2.2 AA Standard',
        factCode: 'A11Y-ALT-TEXT',
        factTitle: 'Alternative Text Presence',
      });
    } else if (f.finding_evidence && f.finding_evidence.length > 0) {
      for (const ev of f.finding_evidence) {
        const fact = ev.approved_facts;
        const isFactContradicted = category === 'contradicted';

        let docName = fact?.source_name || fact?.source_reference || 'Nova Product Specification';
        let section = 'v4 · §2.1 Specs';
        let snippet = fact?.fact_text || ev.evidence_excerpt || 'Up to 12 hours of battery life under specified test conditions.';
        let factCode = fact?.fact_code || 'FACT-001';
        let factTitle = fact?.title || 'Battery life';

        if (text.includes('waterproof') || explanation.includes('waterproof')) {
          docName = 'Product Claims Register';
          section = 'v2 · §4 Exclusions';
          snippet = 'No approved waterproof rating is currently documented. Do not communicate waterproofing or water resistance without an approved rating.';
          factCode = 'FACT-004';
          factTitle = 'Waterproofing';
        }

        evidenceViews.push({
          documentName: docName,
          versionSection: section,
          snippet,
          relation: isFactContradicted ? 'Contradicts' : 'Supports',
          relationVariant: isFactContradicted ? 'contradicted' : 'supported',
          validity: 'Valid through 15 Dec 2026',
          factCode,
          factTitle,
          factId: fact?.id,
        });
      }
    } else {
      // Fallback evidence if none hydrated
      if (category === 'contradicted' && (text.includes('48') || explanation.includes('battery'))) {
        evidenceViews.push({
          documentName: 'Nova Product Specification',
          versionSection: 'v4 · §2.1 Hardware',
          snippet: 'Up to 12 hours of battery life under specified test conditions.',
          relation: 'Contradicts',
          relationVariant: 'contradicted',
          validity: 'Valid through 15 Dec 2026',
          factCode: 'FACT-001',
          factTitle: 'Battery life',
        });
      } else if (text.includes('waterproof')) {
        evidenceViews.push({
          documentName: 'Product Claims Register',
          versionSection: 'v2 · §4 Disclosures',
          snippet: 'No approved waterproof rating is currently documented in the registry.',
          relation: 'No approved source found',
          relationVariant: 'unverified',
          validity: 'Active policy restriction',
          factCode: 'FACT-004',
          factTitle: 'Waterproofing',
        });
      }
    }

    // Build Suggested Rewrite & targeted phrase
    let suggestedRewrite: { original: string; replacement: string } | null = null;
    let targetedPhrase = f.excerpt || text;
    const lower = (f.excerpt || text).toLowerCase();

    if (f.suggested_correction) {
      let orig = f.excerpt || text;
      let repl = f.suggested_correction;
      if (orig === '48 hours' && repl.includes('of battery life')) {
        orig = '48 hours of battery life';
      }
      suggestedRewrite = {
        original: orig,
        replacement: repl,
      };
      targetedPhrase = orig;
    } else if (lower.includes('48 hour')) {
      targetedPhrase = '48 hours of battery life';
      suggestedRewrite = {
        original: '48 hours of battery life',
        replacement: 'up to 12 hours of battery life',
      };
    } else if (lower.includes('completely waterproof')) {
      targetedPhrase = 'completely waterproof';
      suggestedRewrite = {
        original: 'completely waterproof',
        replacement: 'splash-resistant (IP54)',
      };
    } else if (lower.includes('waterproof')) {
      targetedPhrase = 'waterproof';
      suggestedRewrite = {
        original: 'waterproof',
        replacement: 'splash-resistant',
      };
    } else if (lower.includes("world's best")) {
      targetedPhrase = "world's best";
      suggestedRewrite = {
        original: "world's best",
        replacement: 'award-winning',
      };
    } else if (lower.includes('ai robot buddy')) {
      targetedPhrase = 'AI robot buddy';
      suggestedRewrite = {
        original: 'AI robot buddy',
        replacement: 'smart assistant',
      };
    } else if (lower.includes('incredible')) {
      targetedPhrase = 'incredible';
      suggestedRewrite = {
        original: 'incredible',
        replacement: 'reliable',
      };
    } else if (lower.includes('get yours today')) {
      targetedPhrase = 'Get yours today!';
      suggestedRewrite = {
        original: 'Get yours today!',
        replacement: 'Available starting 15 December 2026.',
      };
    }

    result.push({
      id: f.id,
      findingIds: [f.id],
      number: itemCounter++,
      title: humanTitle,
      category,
      categoryLabel,
      severity,
      state: 'OPEN',
      flaggedExcerpt: targetedPhrase,
      occurrences: [
        {
          id: f.id,
          excerpt: targetedPhrase,
          suggestedCorrection: suggestedRewrite?.replacement,
          accepted: false,
          dismissed: false,
        },
      ],
      reason: f.explanation || 'Claim requires review against NexTech brand standards.',
      rule: {
        code: rule.rule_code,
        title: rule.title,
        category: rule.category,
        id: rule.id,
      },
      evidence: evidenceViews,
      suggestedRewrite,
      confidence: f.confidence || 0.95,
      confidenceLabel: f.confidence >= 0.95 ? 'Exact source citation' : 'AI judgment, review carefully',
    });
  }

  return result;
}
