/**
 * Multilingual Consistency Engine for Hindi and Bengali
 * Implements deterministic claim extraction, numeral normalization (Bengali/Devanagari to Latin),
 * canonical unit conversions, and cross-language semantic comparison against English facts.
 */

export interface NormalizedQuantity {
  value: number;
  unit: string;
  canonicalValue: number; // Normalized to baseline (months for duration, grams for weight, etc.)
  canonicalUnit: string;
}

export interface ExtractedMultilingualClaim {
  id: string;
  claimText: string;
  claimType: 'WARRANTY' | 'BATTERY' | 'WEIGHT' | 'WATERPROOF' | 'DISPLAY' | 'LAUNCH_DATE' | 'GENERAL';
  language: 'hi' | 'bn' | 'en';
  extractedQuantity?: NormalizedQuantity;
  backTranslation: string;
}

export interface ConsistencyComparisonFinding {
  id: string;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  localizedClaim: string;
  backTranslation: string;
  approvedFact: string;
  approvedFactId: string;
  confidence: number;
  status: 'OPEN' | 'CONFIRMED' | 'FALSE_POSITIVE' | 'NEEDS_CONTEXT' | 'RESOLVED';
  evidence: {
    localizedClaim: string;
    backTranslation: string;
    approvedFactText: string;
    approvedFactId: string;
    sourceDocument: string;
    sourceLocator: string;
    factSetVersion: string;
    values?: {
      localized: { value: number; unit: string; canonical: string };
      approved: { value: number; unit: string; canonical: string };
    };
    explanation: string;
  };
}

// Map Bengali digits to Latin digits
const BENGALI_DIGITS: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

// Map Devanagari digits to Latin digits
const DEVANAGARI_DIGITS: Record<string, string> = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
};

// Number words
const WORD_NUMBERS: Record<string, number> = {
  // Bengali
  'এক': 1, 'দুই': 2, 'তিন': 3, 'চার': 4, 'পাঁচ': 5,
  'ছয়': 6, 'সাত': 7, 'আট': 8, 'নয়': 9, 'দশ': 10,
  'বারো': 12, 'চব্বিশ': 24, 'ছত্রিশ': 36, 'আটচল্লিশ': 48,
  // Hindi
  'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'पाँच': 5,
  'छह': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10,
  'बारह': 12, 'चौबीस': 24, 'छत्तीस': 36, 'अड़तालीस': 48,
  // English
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'twelve': 12, 'twenty-four': 24, 'twenty four': 24, 'forty-eight': 48,
};

export function normalizeDigits(input: string): string {
  let res = '';
  for (const char of input) {
    if (BENGALI_DIGITS[char]) {
      res += BENGALI_DIGITS[char];
    } else if (DEVANAGARI_DIGITS[char]) {
      res += DEVANAGARI_DIGITS[char];
    } else {
      res += char;
    }
  }
  return res;
}

export function parseNumberFromText(text: string): number | null {
  const normalized = normalizeDigits(text);
  const match = normalized.match(/\d+(?:\.\d+)?/);
  if (match) {
    return parseFloat(match[0]);
  }
  for (const [word, val] of Object.entries(WORD_NUMBERS)) {
    if (text.includes(word)) {
      return val;
    }
  }
  return null;
}

export interface ApprovedFactItem {
  id: string;
  code: string;
  title: string;
  text: string;
  category: string;
  sourceDocument: string;
  sourceLocator: string;
  factSetVersion: string;
  canonicalQuantity?: NormalizedQuantity;
}

export const DEFAULT_FACT_SET: ApprovedFactItem[] = [
  {
    id: 'FACT-003',
    code: 'FACT-003',
    title: 'Warranty Period',
    text: 'The product warranty is 2 years.',
    category: 'PRODUCT_SPECIFICATION',
    sourceDocument: 'Warranty Policy',
    sourceLocator: 'Section 3.2',
    factSetVersion: '2026.04',
    canonicalQuantity: {
      value: 2,
      unit: 'year',
      canonicalValue: 24,
      canonicalUnit: 'months',
    },
  },
  {
    id: 'FACT-001',
    code: 'FACT-001',
    title: 'Battery Life',
    text: 'NexTech Nova delivers up to 24 hours of battery life under standard test conditions.',
    category: 'PRODUCT_SPECIFICATION',
    sourceDocument: 'Nova Product Specification',
    sourceLocator: '§2.1 Hardware',
    factSetVersion: '2026.04',
    canonicalQuantity: {
      value: 24,
      unit: 'hours',
      canonicalValue: 24,
      canonicalUnit: 'hours',
    },
  },
  {
    id: 'FACT-002',
    code: 'FACT-002',
    title: 'Device Weight',
    text: 'NexTech Nova weighs 185 grams.',
    category: 'PRODUCT_SPECIFICATION',
    sourceDocument: 'Nova Hardware Specification',
    sourceLocator: '§1.4 Dimensions',
    factSetVersion: '2026.04',
    canonicalQuantity: {
      value: 185,
      unit: 'grams',
      canonicalValue: 185,
      canonicalUnit: 'grams',
    },
  },
  {
    id: 'FACT-004',
    code: 'FACT-004',
    title: 'Waterproofing',
    text: 'No approved waterproof rating is currently documented for NexTech Nova.',
    category: 'PRODUCT_SPECIFICATION',
    sourceDocument: 'Safety & Compliance Standards',
    sourceLocator: '§4.0',
    factSetVersion: '2026.04',
  },
  {
    id: 'FACT-006',
    code: 'FACT-006',
    title: 'Display Size',
    text: 'NexTech Nova features a 6.7-inch display.',
    category: 'PRODUCT_SPECIFICATION',
    sourceDocument: 'Display Specification',
    sourceLocator: '§2.2',
    factSetVersion: '2026.04',
    canonicalQuantity: {
      value: 6.7,
      unit: 'inch',
      canonicalValue: 6.7,
      canonicalUnit: 'inch',
    },
  },
  {
    id: 'FACT-005',
    code: 'FACT-005',
    title: 'Launch Date',
    text: 'The NexTech Nova launch is scheduled for 15 December 2026.',
    category: 'PRODUCT_SPECIFICATION',
    sourceDocument: 'Global GTM Roadmap',
    sourceLocator: '§3.1',
    factSetVersion: '2026.04',
  },
];

export function extractMultilingualClaims(
  text: string,
  language: 'hi' | 'bn' | 'en'
): ExtractedMultilingualClaim[] {
  const claims: ExtractedMultilingualClaim[] = [];
  const normalized = normalizeDigits(text);

  // Split into sentences using punctuation for Hindi/Bengali ('।', '?', '!', '\n', '.')
  const sentences = normalized
    .split(/[।!?.|\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  for (const sentence of sentences) {
    const rawSentence = sentence;
    const lower = rawSentence.toLowerCase();

    // 1. Warranty Check (Bengali: ওয়ারেন্টি/ওয়ারেন্টি/বছর/মাস; Hindi: वारंटी/साल/महीने)
    const isWarranty =
      /ওয়ারেন্টি|ওয়ারেন্টি|গ্যারান্টি|warranty|guarantee/i.test(rawSentence) ||
      /वारंटी|वारण्टी|गारंटी/i.test(rawSentence) ||
      (/বছর|साल|वर्ष/i.test(rawSentence) && /কভারেজ|সার্ভিস|सुरक्षा|कवरेज/i.test(rawSentence));

    if (isWarranty) {
      const num = parseNumberFromText(rawSentence);
      if (num !== null) {
        let isMonth = /মাস|महीने|माह|month/i.test(rawSentence);
        let canonicalValue = isMonth ? num : num * 12;
        let unit = isMonth ? 'month' : 'year';

        let backTranslation = `Product offers a ${num}-${unit} warranty.`;
        if (language === 'bn') {
          backTranslation = `This product comes with a ${num}-${unit} official warranty.`;
        } else if (language === 'hi') {
          backTranslation = `This device includes a ${num}-${unit} official warranty coverage.`;
        }

        claims.push({
          id: `claim-warranty-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          claimText: rawSentence,
          claimType: 'WARRANTY',
          language,
          extractedQuantity: {
            value: num,
            unit,
            canonicalValue,
            canonicalUnit: 'months',
          },
          backTranslation,
        });
        continue;
      }
    }

    // 2. Battery Life (Bengali: ব্যাটারি, ঘণ্টা; Hindi: बैटरी, घंटे)
    const isBattery =
      /ব্যাটারি|battery/i.test(rawSentence) ||
      /बैटरी/i.test(rawSentence) ||
      (/घंटे|ঘণ্টা|ঘন্টা/i.test(rawSentence) && /ব্যাকআপ|बैकअप|चलेगी|चलती/i.test(rawSentence));

    if (isBattery) {
      const num = parseNumberFromText(rawSentence);
      if (num !== null) {
        claims.push({
          id: `claim-battery-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          claimText: rawSentence,
          claimType: 'BATTERY',
          language,
          extractedQuantity: {
            value: num,
            unit: 'hours',
            canonicalValue: num,
            canonicalUnit: 'hours',
          },
          backTranslation: `Device delivers ${num} hours of battery life.`,
        });
        continue;
      }
    }

    // 3. Weight (Bengali: ওজন, গ্রাম; Hindi: वजन, भार, ग्राम)
    const isWeight =
      /ওজন|weight/i.test(rawSentence) ||
      /वजन|भार/i.test(rawSentence) ||
      /গ্রাম|ग्राम|gram/i.test(rawSentence);

    if (isWeight) {
      const num = parseNumberFromText(rawSentence);
      if (num !== null) {
        let isKg = /কেজি|किलो|kg/i.test(rawSentence);
        let canonicalValue = isKg ? num * 1000 : num;
        let unit = isKg ? 'kg' : 'grams';

        claims.push({
          id: `claim-weight-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          claimText: rawSentence,
          claimType: 'WEIGHT',
          language,
          extractedQuantity: {
            value: num,
            unit,
            canonicalValue,
            canonicalUnit: 'grams',
          },
          backTranslation: `Device weighs ${num} ${unit}.`,
        });
        continue;
      }
    }

    // 4. Waterproofing (Bengali: জলরোধী, ওয়াটারপ্রুফ; Hindi: वाटरप्रूफ, जलरोधक)
    const isWaterproof =
      /জলরোধী|ওয়াটারপ্রুফ|waterproof|পানি নিরোধক/i.test(rawSentence) ||
      /वाटरप्रूफ|जलरोधक|पानी प्रतिरोधी/i.test(rawSentence);

    if (isWaterproof) {
      claims.push({
        id: `claim-waterproof-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        claimText: rawSentence,
        claimType: 'WATERPROOF',
        language,
        backTranslation: 'Claims that the device is completely waterproof.',
      });
      continue;
    }

    // 5. Display (Bengali: ডিসপ্লে, ইঞ্চি; Hindi: डिस्प्ले, स्क्रीन, इंच)
    const isDisplay =
      /ডিসপ্লে|স্ক্রিন|display|screen/i.test(rawSentence) ||
      /डिस्प्ले|स्क्रीन/i.test(rawSentence) ||
      /ইঞ্চি|इंच|inch/i.test(rawSentence);

    if (isDisplay) {
      const num = parseNumberFromText(rawSentence);
      if (num !== null) {
        claims.push({
          id: `claim-display-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          claimText: rawSentence,
          claimType: 'DISPLAY',
          language,
          extractedQuantity: {
            value: num,
            unit: 'inch',
            canonicalValue: num,
            canonicalUnit: 'inch',
          },
          backTranslation: `Features a ${num}-inch display.`,
        });
        continue;
      }
    }
  }

  // Fallback: If no claim segmented by sentence, check the entire block for key claims
  if (claims.length === 0 && text.trim().length > 3) {
    const raw = text.trim();
    if (/ওয়ারেন্টি|ওয়ারেন্টি|গ্যারান্টি|वारंटी|गारंटी|warranty/i.test(raw)) {
      const num = parseNumberFromText(raw);
      if (num !== null) {
        let isMonth = /মাস|महीने|माह|month/i.test(raw);
        let canonicalValue = isMonth ? num : num * 12;
        let unit = isMonth ? 'month' : 'year';
        claims.push({
          id: `claim-warranty-fallback-${Date.now()}`,
          claimText: raw,
          claimType: 'WARRANTY',
          language,
          extractedQuantity: {
            value: num,
            unit,
            canonicalValue,
            canonicalUnit: 'months',
          },
          backTranslation: `Product offers a ${num}-${unit} warranty.`,
        });
      }
    }
  }

  return claims;
}

export function verifyConsistency(
  claims: ExtractedMultilingualClaim[],
  facts: ApprovedFactItem[] = DEFAULT_FACT_SET
): ConsistencyComparisonFinding[] {
  const findings: ConsistencyComparisonFinding[] = [];

  for (const claim of claims) {
    if (claim.claimType === 'WARRANTY') {
      const approvedFact = facts.find((f) => f.code === 'FACT-003' || f.category === 'PRODUCT_SPECIFICATION' && f.text.toLowerCase().includes('warranty'));
      if (approvedFact && approvedFact.canonicalQuantity && claim.extractedQuantity) {
        const localizedMonths = claim.extractedQuantity.canonicalValue;
        const approvedMonths = approvedFact.canonicalQuantity.canonicalValue;

        if (localizedMonths !== approvedMonths) {
          findings.push({
            id: `finding-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            type: 'NUMERIC_MISMATCH',
            severity: 'CRITICAL',
            title: 'Warranty duration mismatch with approved specification',
            localizedClaim: claim.claimText,
            backTranslation: claim.backTranslation,
            approvedFact: approvedFact.text,
            approvedFactId: approvedFact.id,
            confidence: 0.98,
            status: 'OPEN',
            evidence: {
              localizedClaim: claim.claimText,
              backTranslation: claim.backTranslation,
              approvedFactText: approvedFact.text,
              approvedFactId: approvedFact.id,
              sourceDocument: approvedFact.sourceDocument,
              sourceLocator: approvedFact.sourceLocator,
              factSetVersion: approvedFact.factSetVersion,
              values: {
                localized: {
                  value: claim.extractedQuantity.value,
                  unit: claim.extractedQuantity.unit,
                  canonical: `${localizedMonths} months`,
                },
                approved: {
                  value: approvedFact.canonicalQuantity.value,
                  unit: approvedFact.canonicalQuantity.unit,
                  canonical: `${approvedMonths} months`,
                },
              },
              explanation: `Localized claim specifies a ${claim.extractedQuantity.value} ${claim.extractedQuantity.unit} warranty (${localizedMonths} months), but approved official fact specifies ${approvedFact.canonicalQuantity.value} ${approvedFact.canonicalQuantity.unit} (${approvedMonths} months).`,
            },
          });
        }
      }
    } else if (claim.claimType === 'BATTERY') {
      const approvedFact = facts.find((f) => f.code === 'FACT-001' || f.text.toLowerCase().includes('battery'));
      if (approvedFact && approvedFact.canonicalQuantity && claim.extractedQuantity) {
        if (claim.extractedQuantity.value > approvedFact.canonicalQuantity.value * 1.05) {
          findings.push({
            id: `finding-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            type: 'NUMERIC_MISMATCH',
            severity: 'HIGH',
            title: 'Battery life exceeds approved specification',
            localizedClaim: claim.claimText,
            backTranslation: claim.backTranslation,
            approvedFact: approvedFact.text,
            approvedFactId: approvedFact.id,
            confidence: 0.96,
            status: 'OPEN',
            evidence: {
              localizedClaim: claim.claimText,
              backTranslation: claim.backTranslation,
              approvedFactText: approvedFact.text,
              approvedFactId: approvedFact.id,
              sourceDocument: approvedFact.sourceDocument,
              sourceLocator: approvedFact.sourceLocator,
              factSetVersion: approvedFact.factSetVersion,
              values: {
                localized: {
                  value: claim.extractedQuantity.value,
                  unit: 'hours',
                  canonical: `${claim.extractedQuantity.value} hours`,
                },
                approved: {
                  value: approvedFact.canonicalQuantity.value,
                  unit: 'hours',
                  canonical: `${approvedFact.canonicalQuantity.value} hours`,
                },
              },
              explanation: `Localized claim states ${claim.extractedQuantity.value} hours of battery life, contradicting the approved maximum of ${approvedFact.canonicalQuantity.value} hours.`,
            },
          });
        }
      }
    } else if (claim.claimType === 'WEIGHT') {
      const approvedFact = facts.find((f) => f.code === 'FACT-002' || f.text.toLowerCase().includes('weigh'));
      if (approvedFact && approvedFact.canonicalQuantity && claim.extractedQuantity) {
        if (Math.abs(claim.extractedQuantity.canonicalValue - approvedFact.canonicalQuantity.canonicalValue) > 5) {
          findings.push({
            id: `finding-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            type: 'NUMERIC_MISMATCH',
            severity: 'HIGH',
            title: 'Device weight specification contradicted',
            localizedClaim: claim.claimText,
            backTranslation: claim.backTranslation,
            approvedFact: approvedFact.text,
            approvedFactId: approvedFact.id,
            confidence: 0.95,
            status: 'OPEN',
            evidence: {
              localizedClaim: claim.claimText,
              backTranslation: claim.backTranslation,
              approvedFactText: approvedFact.text,
              approvedFactId: approvedFact.id,
              sourceDocument: approvedFact.sourceDocument,
              sourceLocator: approvedFact.sourceLocator,
              factSetVersion: approvedFact.factSetVersion,
              values: {
                localized: {
                  value: claim.extractedQuantity.value,
                  unit: claim.extractedQuantity.unit,
                  canonical: `${claim.extractedQuantity.canonicalValue}g`,
                },
                approved: {
                  value: approvedFact.canonicalQuantity.value,
                  unit: approvedFact.canonicalQuantity.unit,
                  canonical: `${approvedFact.canonicalQuantity.canonicalValue}g`,
                },
              },
              explanation: `Localized claim specifies weight of ${claim.extractedQuantity.canonicalValue}g, which contradicts the approved weight of ${approvedFact.canonicalQuantity.canonicalValue}g.`,
            },
          });
        }
      }
    } else if (claim.claimType === 'WATERPROOF') {
      const approvedFact = facts.find((f) => f.code === 'FACT-004' || f.text.toLowerCase().includes('waterproof'));
      if (approvedFact) {
        findings.push({
          id: `finding-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          type: 'TERMINOLOGY_MISMATCH',
          severity: 'HIGH',
          title: 'Unsubstantiated waterproofing claim in regional copy',
          localizedClaim: claim.claimText,
          backTranslation: claim.backTranslation,
          approvedFact: approvedFact.text,
          approvedFactId: approvedFact.id,
          confidence: 0.98,
          status: 'OPEN',
          evidence: {
            localizedClaim: claim.claimText,
            backTranslation: claim.backTranslation,
            approvedFactText: approvedFact.text,
            approvedFactId: approvedFact.id,
            sourceDocument: approvedFact.sourceDocument,
            sourceLocator: approvedFact.sourceLocator,
            factSetVersion: approvedFact.factSetVersion,
            explanation: `Regional copy claims the product is waterproof, but official brand documentation explicitly states: "${approvedFact.text}".`,
          },
        });
      }
    }
  }

  return findings;
}
