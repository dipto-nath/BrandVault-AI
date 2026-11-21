/**
 * In-memory & local state store for Consistency Check jobs, fact sets, and glossary terms
 * Fully seeded with realistic demo sandbox data (Blueprint Part 2)
 */

import {
  extractMultilingualClaims,
  verifyConsistency,
  ConsistencyComparisonFinding,
  ApprovedFactItem,
} from './multilingual-consistency';

export interface StoredFact {
  id: string;
  category: string;
  statement: string;
  sourceDoc: string;
  sourceLocator: string;
  value?: number;
  unit?: string;
  tolerance?: number;
}

export interface StoredJob {
  id: string;
  submission_id: string;
  language: 'hi' | 'bn' | 'en';
  raw_text: string;
  fact_set_id: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  verdict: 'CONSISTENT' | 'CONFLICT' | 'NEEDS_REVIEW';
  submitted_by: string;
  is_sample: boolean;
  created_at: string;
  completed_at: string | null;
  findings: ConsistencyComparisonFinding[];
}

export interface StoredFactSet {
  id: string;
  name: string;
  version: string;
  product: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  facts_count: number;
  checks_count: number;
  created_at: string;
  updated_at: string;
  facts: StoredFact[];
}

export interface StoredGlossaryTerm {
  id: string;
  term_en: string;
  term_hi: string;
  term_bn: string;
  category: string;
  protected: boolean;
  checks_count: number;
  notes: string;
}

// ── 1. Approved Fact Sets ──
export const INITIAL_FACT_SETS: StoredFactSet[] = [
  {
    id: 'factset-nextech-specs',
    name: 'NexTech Nova - Product specs',
    version: '2026.04',
    product: 'NexTech Nova',
    status: 'ACTIVE',
    facts_count: 8,
    checks_count: 18,
    created_at: '2026-11-10T09:00:00.000Z',
    updated_at: '2026-11-15T14:30:00.000Z',
    facts: [
      {
        id: 'FACT-SPEC-001',
        category: 'BATTERY',
        statement: 'NexTech Nova offers up to 18 hours of mixed-use battery life under standard test conditions.',
        sourceDoc: 'Product Specification v4.1',
        sourceLocator: 'Section 2.1 Hardware',
        value: 18,
        unit: 'hours',
      },
      {
        id: 'FACT-SPEC-002',
        category: 'WATERPROOF',
        statement: 'The device features IP68 water and dust resistance up to 1.5 meters for 30 minutes.',
        sourceDoc: 'Product Specification v4.1',
        sourceLocator: 'Section 2.4 Ingress Protection',
      },
      {
        id: 'FACT-SPEC-003',
        category: 'WARRANTY',
        statement: 'The product warranty is 2 years covering manufacturing and hardware defects.',
        sourceDoc: 'Warranty Policy',
        sourceLocator: 'Section 3.2 Standard Warranty',
        value: 2,
        unit: 'years',
      },
      {
        id: 'FACT-SPEC-004',
        category: 'DISPLAY',
        statement: 'The phone features a 6.7-inch Super AMOLED display with 120Hz adaptive refresh rate.',
        sourceDoc: 'Display Engineering Specs',
        sourceLocator: 'Section 1.3 Panel Architecture',
        value: 6.7,
        unit: 'inch',
      },
      {
        id: 'FACT-SPEC-005',
        category: 'WEIGHT',
        statement: 'Device weight is certified at 185 grams under standard laboratory configurations.',
        sourceDoc: 'Mechanical Design Spec',
        sourceLocator: 'Section 4.2 Chassis Dimensions',
        value: 185,
        unit: 'grams',
        tolerance: 2,
      },
      {
        id: 'FACT-SPEC-006',
        category: 'CHARGING',
        statement: 'Supports 30W USB-C fast charging reaching 50% battery capacity in 28 minutes.',
        sourceDoc: 'Charging Architecture Doc',
        sourceLocator: 'Section 3.1 Power Delivery',
        value: 30,
        unit: 'W',
      },
      {
        id: 'FACT-SPEC-007',
        category: 'STORAGE',
        statement: 'Equipped with 256GB high-speed UFS 4.0 onboard storage.',
        sourceDoc: 'Hardware Architecture Spec',
        sourceLocator: 'Section 5.1 Memory Subsystem',
        value: 256,
        unit: 'GB',
      },
      {
        id: 'FACT-SPEC-008',
        category: 'AI_FEATURES',
        statement: 'Features built-in on-device AI Smart Assistant powered by Nova Core.',
        sourceDoc: 'Software Features Specification',
        sourceLocator: 'Section 1.2 Intelligence Services',
      },
    ],
  },
  {
    id: 'factset-launch-q4',
    name: 'Launch messaging - Q4',
    version: '2026.Q4',
    product: 'NexTech Nova Launch Campaign',
    status: 'ACTIVE',
    facts_count: 5,
    checks_count: 12,
    created_at: '2026-11-12T10:00:00.000Z',
    updated_at: '2026-11-18T11:20:00.000Z',
    facts: [
      {
        id: 'FACT-MKT-001',
        category: 'LAUNCH_DATE',
        statement: 'Official commercial launch date is 15 December 2026 across Asia-Pacific.',
        sourceDoc: 'Q4 Go-to-Market Plan',
        sourceLocator: 'Section 1.1 Timeline',
      },
      {
        id: 'FACT-MKT-002',
        category: 'PRICING',
        statement: 'Retail introductory price is set at $899 USD before local carrier rebates.',
        sourceDoc: 'Global Pricing Strategy',
        sourceLocator: 'Table 2 Regional Tiers',
      },
      {
        id: 'FACT-MKT-003',
        category: 'FINISHES',
        statement: 'Available in three finishes: Space Grey, Alpine White, and Obsidian Black.',
        sourceDoc: 'Industrial Design Guidelines',
        sourceLocator: 'Section 3.0 Color Palette',
      },
      {
        id: 'FACT-MKT-004',
        category: 'SUSTAINABILITY',
        statement: 'Every retail box utilizes 100% recycled paper packaging footprint with zero plastic inserts.',
        sourceDoc: 'Environmental Compliance Charter',
        sourceLocator: 'Section 4.5 Packaging Standards',
      },
      {
        id: 'FACT-MKT-005',
        category: 'SERVICES',
        statement: 'Complimentary 6 months of encrypted cloud backup is included with every activation.',
        sourceDoc: 'Services Promotion Policy',
        sourceLocator: 'Section 2.0 Free Tier Benefits',
      },
    ],
  },
];

// ── 2. Approved Glossary Terms (12 terms, English / Hindi / Bengali) ──
export const INITIAL_GLOSSARY: StoredGlossaryTerm[] = [
  {
    id: 'glos-001',
    term_en: 'battery life',
    term_hi: 'बैटरी लाइफ',
    term_bn: 'ব্যাটারি লাইফ',
    category: 'Hardware Specs',
    protected: true,
    checks_count: 34,
    notes: 'Standard consumer metric. Do not translate as "battery longevity" or "battery endurance".',
  },
  {
    id: 'glos-002',
    term_en: 'mixed use',
    term_hi: 'मिश्रित उपयोग',
    term_bn: 'মিশ্র ব্যবহার',
    category: 'Usage Conditions',
    protected: true,
    checks_count: 22,
    notes: 'Official test qualification. Must be retained when stating battery duration.',
  },
  {
    id: 'glos-003',
    term_en: 'warranty',
    term_hi: 'वारंटी',
    term_bn: 'ওয়ারেন্টি',
    category: 'Legal & Policy',
    protected: true,
    checks_count: 41,
    notes: 'Official manufacturer warranty term. Use वारंटी in Hindi and ওয়ারেন্টি in Bengali.',
  },
  {
    id: 'glos-004',
    term_en: 'water resistant',
    term_hi: 'जल-प्रतिरोधी',
    term_bn: 'জল-প্রতিরোধী',
    category: 'Hardware Specs',
    protected: true,
    checks_count: 19,
    notes: 'Must not be translated as waterproof / 완전히 방수 (completely impervious). Always specify IP68.',
  },
  {
    id: 'glos-005',
    term_en: 'fast charging',
    term_hi: 'फास्ट चार्जिंग',
    term_bn: 'ফাস্ট চার্জিং',
    category: 'Charging',
    protected: true,
    checks_count: 17,
    notes: 'Approved standard phrase for 30W USB-C PD 3.0 technology.',
  },
  {
    id: 'glos-006',
    term_en: 'display',
    term_hi: 'डिस्प्ले',
    term_bn: 'ডিসপ্লে',
    category: 'Hardware Specs',
    protected: true,
    checks_count: 28,
    notes: 'Acceptable transliterated tech term in both Hindi and Bengali communications.',
  },
  {
    id: 'glos-007',
    term_en: 'weight',
    term_hi: 'वजन',
    term_bn: 'ওজন',
    category: 'Physical Specs',
    protected: true,
    checks_count: 15,
    notes: 'Always accompanied by certified grams unit (ग्राम / গ্রাম).',
  },
  {
    id: 'glos-008',
    term_en: 'smart assistant',
    term_hi: 'स्मार्ट असिस्टेंट',
    term_bn: 'স্মার্ট অ্যাসিস্ট্যান্ট',
    category: 'AI Features',
    protected: true,
    checks_count: 16,
    notes: 'Never translate as "robot buddy" or informal bot terms.',
  },
  {
    id: 'glos-009',
    term_en: 'manufacturer guarantee',
    term_hi: 'निर्माता गारंटी',
    term_bn: 'নির্মাতা গ্যারান্টি',
    category: 'Legal & Policy',
    protected: true,
    checks_count: 11,
    notes: 'Legal guarantee term for direct factory coverage.',
  },
  {
    id: 'glos-010',
    term_en: 'scratch resistant',
    term_hi: 'स्क्रैच प्रतिरोधी',
    term_bn: 'স্ক্র্যাচ প্রতিরোধী',
    category: 'Durability',
    protected: true,
    checks_count: 9,
    notes: 'Designates Gorilla Glass Victus 2 surface protection.',
  },
  {
    id: 'glos-011',
    term_en: 'storage capacity',
    term_hi: 'स्टोरेज क्षमता',
    term_bn: 'স্টোরেজ ক্ষমতা',
    category: 'Hardware Specs',
    protected: true,
    checks_count: 14,
    notes: 'Refers to standard 256GB internal flash memory.',
  },
  {
    id: 'glos-012',
    term_en: 'launch date',
    term_hi: 'लॉन्च की तारीख',
    term_bn: 'মুক্তির তারিখ',
    category: 'Marketing',
    protected: true,
    checks_count: 20,
    notes: 'Commercial release milestone date (15 December 2026).',
  },
];

// ── 3. Initial 5 Completed Demo Checks ──
export const INITIAL_JOBS: StoredJob[] = [
  {
    id: 'chk-001',
    submission_id: 'sub-001-hi-battery-conflict',
    language: 'hi',
    raw_text: 'नेक्सटेक नोवा 24 घंटे की बैटरी लाइफ देता है और इसमें 2 साल की आधिकारिक वारंटी शामिल है।',
    fact_set_id: 'factset-nextech-specs',
    status: 'COMPLETED',
    verdict: 'CONFLICT',
    submitted_by: 'Ananya Sharma',
    is_sample: true,
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 2 * 3600 * 1000 + 4000).toISOString(),
    findings: [
      {
        id: 'find-001',
        type: 'NUMERIC_MISMATCH',
        severity: 'CRITICAL',
        title: 'Battery life claim contradicts approved specification',
        localizedClaim: '24 घंटे की बैटरी लाइफ देता है',
        backTranslation: 'Provides 24 hours of battery life under usage conditions.',
        approvedFact: 'NexTech Nova offers up to 18 hours of mixed-use battery life under standard test conditions.',
        approvedFactId: 'FACT-SPEC-001',
        confidence: 0.98,
        status: 'OPEN',
        evidence: {
          localizedClaim: '24 घंटे की बैटरी लाइफ',
          backTranslation: '24 hours of battery life',
          approvedFactText: 'NexTech Nova offers up to 18 hours of mixed-use battery life under standard test conditions.',
          approvedFactId: 'FACT-SPEC-001',
          sourceDocument: 'Product Specification v4.1',
          sourceLocator: 'Section 2.1 Hardware',
          factSetVersion: '2026.04',
          values: {
            localized: { value: 24, unit: 'hours', canonical: '24 hours' },
            approved: { value: 18, unit: 'hours', canonical: '18 hours' },
          },
          explanation: 'Hindi claim promises 24 hours of battery life, but approved laboratory testing certifies a maximum of up to 18 hours mixed-use.',
        },
      },
    ],
  },
  {
    id: 'chk-002',
    submission_id: 'sub-002-bn-warranty-conflict',
    language: 'bn',
    raw_text: 'আমাদের নতুন নেক্সটেক নোভা ফোনে পাচ্ছেন ৫ বছরের সম্পূর্ণ অফিসিয়াল ওয়ারেন্টি এবং ২৪ ঘণ্টা ব্যাটারি ব্যাকআপ।',
    fact_set_id: 'factset-nextech-specs',
    status: 'COMPLETED',
    verdict: 'CONFLICT',
    submitted_by: 'Sourav Ganguly',
    is_sample: true,
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 5 * 3600 * 1000 + 3500).toISOString(),
    findings: [
      {
        id: 'find-002-a',
        type: 'NUMERIC_MISMATCH',
        severity: 'CRITICAL',
        title: 'Warranty duration mismatch with approved policy',
        localizedClaim: '৫ বছরের সম্পূর্ণ অফিসিয়াল ওয়ারেন্টি',
        backTranslation: 'This product comes with a 5-year official warranty.',
        approvedFact: 'The product warranty is 2 years covering manufacturing and hardware defects.',
        approvedFactId: 'FACT-SPEC-003',
        confidence: 0.99,
        status: 'OPEN',
        evidence: {
          localizedClaim: '৫ বছরের সম্পূর্ণ অফিসিয়াল ওয়ারেন্টি',
          backTranslation: '5-year full official warranty',
          approvedFactText: 'The product warranty is 2 years covering manufacturing and hardware defects.',
          approvedFactId: 'FACT-SPEC-003',
          sourceDocument: 'Warranty Policy',
          sourceLocator: 'Section 3.2 Standard Warranty',
          factSetVersion: '2026.04',
          values: {
            localized: { value: 5, unit: 'year', canonical: '60 months' },
            approved: { value: 2, unit: 'year', canonical: '24 months' },
          },
          explanation: 'Bengali copy claims a 5-year warranty (60 months), directly contradicting the official 2-year (24 months) warranty limit.',
        },
      },
      {
        id: 'find-002-b',
        type: 'NUMERIC_MISMATCH',
        severity: 'CRITICAL',
        title: 'Battery duration exceeds tested rating',
        localizedClaim: '২৪ ঘণ্টা ব্যাটারি ব্যাকআপ',
        backTranslation: '24 hours battery backup',
        approvedFact: 'NexTech Nova offers up to 18 hours of mixed-use battery life under standard test conditions.',
        approvedFactId: 'FACT-SPEC-001',
        confidence: 0.96,
        status: 'OPEN',
        evidence: {
          localizedClaim: '২৪ ঘণ্টা ব্যাটারি ব্যাকআপ',
          backTranslation: '24-hour battery backup',
          approvedFactText: 'NexTech Nova offers up to 18 hours of mixed-use battery life under standard test conditions.',
          approvedFactId: 'FACT-SPEC-001',
          sourceDocument: 'Product Specification v4.1',
          sourceLocator: 'Section 2.1 Hardware',
          factSetVersion: '2026.04',
          values: {
            localized: { value: 24, unit: 'hours', canonical: '24 hours' },
            approved: { value: 18, unit: 'hours', canonical: '18 hours' },
          },
          explanation: 'Bengali numeral ২৪ (24) exceeds the certified mixed-use specification of 18 hours.',
        },
      },
    ],
  },
  {
    id: 'chk-003',
    submission_id: 'sub-003-hi-consistent',
    language: 'hi',
    raw_text: 'नेक्सटेक नोवा स्मार्टफोन में 18 घंटे की बैटरी लाइफ और 2 साल की निर्माता वारंटी दी जा रही है।',
    fact_set_id: 'factset-nextech-specs',
    status: 'COMPLETED',
    verdict: 'CONSISTENT',
    submitted_by: 'Pooja Verma',
    is_sample: true,
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 24 * 3600 * 1000 + 2800).toISOString(),
    findings: [], // Completely verified!
  },
  {
    id: 'chk-004',
    submission_id: 'sub-004-bn-consistent',
    language: 'bn',
    raw_text: 'নেক্সটেক নোভা ১৮ ঘণ্টা মিশ্র ব্যবহারের ব্যাটারি লাইফ প্রদান করে এবং এর ওজন মাত্র ১৮৫ গ্রাম।',
    fact_set_id: 'factset-nextech-specs',
    status: 'COMPLETED',
    verdict: 'CONSISTENT',
    submitted_by: 'Tanmoy Roy',
    is_sample: true,
    created_at: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 28 * 3600 * 1000 + 3100).toISOString(),
    findings: [], // 18 hrs + 185g verified!
  },
  {
    id: 'chk-005',
    submission_id: 'sub-005-hi-needs-review',
    language: 'hi',
    raw_text: 'नेक्सटेक नोवा में उन्नत जल-प्रतिरोधी तकनीक और अत्यधिक टिकाऊ सुरक्षा दी गई है।',
    fact_set_id: 'factset-nextech-specs',
    status: 'COMPLETED',
    verdict: 'NEEDS_REVIEW',
    submitted_by: 'Rohit Kulkarni',
    is_sample: true,
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 48 * 3600 * 1000 + 2900).toISOString(),
    findings: [
      {
        id: 'find-005',
        type: 'UNVERIFIED_CLAIM',
        severity: 'MEDIUM',
        title: 'Water resistance qualifier requires exact IP68 depth citation',
        localizedClaim: 'उन्नत जल-प्रतिरोधी तकनीक और अत्यधिक टिकाऊ सुरक्षा',
        backTranslation: 'Advanced water-resistant technology and extreme durable protection',
        approvedFact: 'The device features IP68 water and dust resistance up to 1.5 meters for 30 minutes.',
        approvedFactId: 'FACT-SPEC-002',
        confidence: 0.82,
        status: 'NEEDS_CONTEXT',
        evidence: {
          localizedClaim: 'उन्नत जल-प्रतिरोधी तकनीक',
          backTranslation: 'Advanced water-resistant technology',
          approvedFactText: 'The device features IP68 water and dust resistance up to 1.5 meters for 30 minutes.',
          approvedFactId: 'FACT-SPEC-002',
          sourceDocument: 'Product Specification v4.1',
          sourceLocator: 'Section 2.4 Ingress Protection',
          factSetVersion: '2026.04',
          explanation: 'General water resistance claim is permitted, but brand guideline RULE-CLAIM-002 requires explicit IP68 specification (1.5 meters for 30 min) in consumer marketing copy.',
        },
      },
    ],
  },
];

let JOBS_STORE: StoredJob[] = [...INITIAL_JOBS];
let FACT_SETS_STORE: StoredFactSet[] = [...INITIAL_FACT_SETS];
let GLOSSARY_STORE: StoredGlossaryTerm[] = [...INITIAL_GLOSSARY];

export const ConsistencyStore = {
  listJobs(): StoredJob[] {
    return [...JOBS_STORE].sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  getJob(id: string): StoredJob | null {
    return JOBS_STORE.find((j) => j.id === id) || null;
  },

  createJob(language: 'hi' | 'bn' | 'en', text: string, factSetId?: string): StoredJob {
    const jobId = `chk-${Date.now().toString().slice(-4)}`;
    const subId = `sub-${Date.now().toString().slice(-4)}`;

    // Convert stored facts to engine fact format
    const selectedFactSet = FACT_SETS_STORE.find((f) => f.id === factSetId) || FACT_SETS_STORE[0];
    const engineFacts: ApprovedFactItem[] = selectedFactSet.facts.map((f) => ({
      id: f.id,
      code: f.id,
      title: f.category,
      text: f.statement,
      category: f.category,
      sourceDocument: f.sourceDoc,
      sourceLocator: f.sourceLocator,
      factSetVersion: selectedFactSet.version,
      canonicalQuantity: f.value ? {
        value: f.value,
        unit: f.unit || '',
        canonicalValue: f.unit === 'year' || f.unit === 'years' ? f.value * 12 : f.value,
        canonicalUnit: f.unit === 'year' || f.unit === 'years' ? 'months' : (f.unit || ''),
      } : undefined,
    }));

    // Run Multilingual Consistency Engine
    const claims = extractMultilingualClaims(text, language);
    const findings = verifyConsistency(claims, engineFacts);

    let verdict: 'CONSISTENT' | 'CONFLICT' | 'NEEDS_REVIEW' = 'CONSISTENT';
    if (findings.some((f) => f.severity === 'CRITICAL' || f.type === 'NUMERIC_MISMATCH')) {
      verdict = 'CONFLICT';
    } else if (findings.some((f) => f.type === 'UNVERIFIED_CLAIM' || f.severity === 'MEDIUM')) {
      verdict = 'NEEDS_REVIEW';
    }

    const newJob: StoredJob = {
      id: jobId,
      submission_id: subId,
      language,
      raw_text: text,
      fact_set_id: selectedFactSet.id,
      status: 'COMPLETED',
      verdict,
      submitted_by: 'Demo Reviewer',
      is_sample: false,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      findings,
    };

    // Increment fact set check count
    selectedFactSet.checks_count = (selectedFactSet.checks_count || 0) + 1;

    JOBS_STORE.unshift(newJob);
    return newJob;
  },

  deleteJob(id: string): boolean {
    const prevLen = JOBS_STORE.length;
    JOBS_STORE = JOBS_STORE.filter((j) => j.id !== id);
    return JOBS_STORE.length < prevLen;
  },

  updateFindingStatus(findingId: string, decision: 'CONFIRMED' | 'FALSE_POSITIVE' | 'NEEDS_CONTEXT' | 'RESOLVED'): boolean {
    for (const job of JOBS_STORE) {
      const finding = job.findings.find((f) => f.id === findingId);
      if (finding) {
        finding.status = decision;
        return true;
      }
    }
    return false;
  },

  listFactSets(): StoredFactSet[] {
    return FACT_SETS_STORE;
  },

  getFactSet(id: string): StoredFactSet | null {
    return FACT_SETS_STORE.find((f) => f.id === id) || null;
  },

  createFactSet(name: string, factsText: string[]): StoredFactSet {
    const id = `factset-${Date.now().toString().slice(-4)}`;
    const parsedFacts: StoredFact[] = factsText.filter((line) => line.trim().length > 0).map((line, idx) => ({
      id: `FACT-USER-${idx + 1}`,
      category: 'GENERAL',
      statement: line.trim(),
      sourceDoc: name,
      sourceLocator: `Fact ${idx + 1}`,
    }));

    const newFactSet: StoredFactSet = {
      id,
      name,
      version: '1.0',
      product: 'NexTech Nova',
      status: 'ACTIVE',
      facts_count: parsedFacts.length,
      checks_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      facts: parsedFacts,
    };

    FACT_SETS_STORE.unshift(newFactSet);
    return newFactSet;
  },

  listGlossary(): StoredGlossaryTerm[] {
    return GLOSSARY_STORE;
  },

  addGlossaryTerm(term_en: string, term_hi: string, term_bn: string, category: string = 'General'): StoredGlossaryTerm {
    const id = `glos-${Date.now().toString().slice(-4)}`;
    const newTerm: StoredGlossaryTerm = {
      id,
      term_en,
      term_hi,
      term_bn,
      category,
      protected: true,
      checks_count: 0,
      notes: 'Added via glossary editor',
    };
    GLOSSARY_STORE.unshift(newTerm);
    return newTerm;
  },

  /**
   * Idempotent seed function for demo sandbox (Blueprint Part 2)
   */
  seedSampleData(force: boolean = false): { jobsCount: number; factSetsCount: number; glossaryCount: number } {
    if (force || JOBS_STORE.length === 0) {
      JOBS_STORE = [...INITIAL_JOBS];
    }
    if (force || FACT_SETS_STORE.length === 0) {
      FACT_SETS_STORE = [...INITIAL_FACT_SETS];
    }
    if (force || GLOSSARY_STORE.length === 0) {
      GLOSSARY_STORE = [...INITIAL_GLOSSARY];
    }
    return {
      jobsCount: JOBS_STORE.length,
      factSetsCount: FACT_SETS_STORE.length,
      glossaryCount: GLOSSARY_STORE.length,
    };
  },

  clearData(): void {
    JOBS_STORE = [];
    FACT_SETS_STORE = [];
    GLOSSARY_STORE = [];
  },
};
