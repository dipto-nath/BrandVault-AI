/**
 * In-memory & local state store for Consistency Check jobs, fact sets, and glossary terms
 */

import {
  extractMultilingualClaims,
  verifyConsistency,
  DEFAULT_FACT_SET,
  ConsistencyComparisonFinding,
} from './multilingual-consistency';

export interface StoredJob {
  id: string;
  submission_id: string;
  language: 'hi' | 'bn' | 'en';
  raw_text: string;
  fact_set_id: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
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
  created_at: string;
  facts: typeof DEFAULT_FACT_SET;
}

export interface StoredGlossaryTerm {
  id: string;
  term_en: string;
  term_hi: string;
  term_bn: string;
  category: string;
  protected: boolean;
  notes: string;
}

// Initial seed jobs including the Core Acceptance Test
let JOBS_STORE: StoredJob[] = [
  {
    id: 'job-acceptance-bengali-warranty',
    submission_id: 'sub-acceptance-001',
    language: 'bn',
    raw_text: 'আমাদের নতুন নেক্সটেক নোভা ফোনে পাচ্ছেন ৫ বছরের সম্পূর্ণ অফিসিয়াল ওয়ারেন্টি।',
    fact_set_id: 'factset-nextech-2026-04',
    status: 'COMPLETED',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    completed_at: new Date(Date.now() - 3590000).toISOString(),
    findings: [
      {
        id: 'finding-acceptance-001',
        type: 'NUMERIC_MISMATCH',
        severity: 'CRITICAL',
        title: 'Warranty duration mismatch with approved specification',
        localizedClaim: '৫ বছরের সম্পূর্ণ অফিসিয়াল ওয়ারেন্টি',
        backTranslation: 'This product comes with a 5-year official warranty.',
        approvedFact: 'The product warranty is 2 years.',
        approvedFactId: 'FACT-003',
        confidence: 0.98,
        status: 'OPEN',
        evidence: {
          localizedClaim: '৫ বছরের সম্পূর্ণ অফিসিয়াল ওয়ারেন্টি',
          backTranslation: 'This product comes with a 5-year official warranty.',
          approvedFactText: 'The product warranty is 2 years.',
          approvedFactId: 'FACT-003',
          sourceDocument: 'Warranty Policy',
          sourceLocator: 'Section 3.2',
          factSetVersion: '2026.04',
          values: {
            localized: { value: 5, unit: 'year', canonical: '60 months' },
            approved: { value: 2, unit: 'year', canonical: '24 months' },
          },
          explanation:
            'Localized Bengali claim specifies a 5-year warranty (60 months), but approved official specification explicitly limits warranty to 2 years (24 months).',
        },
      },
    ],
  },
  {
    id: 'job-normalized-hindi-warranty',
    submission_id: 'sub-hindi-002',
    language: 'hi',
    raw_text: 'इस स्मार्टफोन पर पूरे 24 महीने की आधिकारिक वारंटी दी जा रही है।',
    fact_set_id: 'factset-nextech-2026-04',
    status: 'COMPLETED',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    completed_at: new Date(Date.now() - 7195000).toISOString(),
    findings: [], // 24 months = 2 years -> Normalized match! No contradictions!
  },
];

let FACT_SETS_STORE: StoredFactSet[] = [
  {
    id: 'factset-nextech-2026-04',
    name: 'NexaTech Nova Approved Fact Set',
    version: '2026.04',
    product: 'NexaTech Nova',
    status: 'ACTIVE',
    facts_count: DEFAULT_FACT_SET.length,
    created_at: '2026-11-15T00:00:00.000Z',
    facts: DEFAULT_FACT_SET,
  },
  {
    id: 'factset-legacy-2025-01',
    name: 'Legacy Hardware Baseline',
    version: '2025.01',
    product: 'Nova v2',
    status: 'ARCHIVED',
    facts_count: 4,
    created_at: '2025-01-10T00:00:00.000Z',
    facts: DEFAULT_FACT_SET.slice(0, 4),
  },
];

let GLOSSARY_STORE: StoredGlossaryTerm[] = [
  {
    id: 'glossary-001',
    term_en: 'NexTech Nova',
    term_hi: 'नेक्सटेक नोवा',
    term_bn: 'নেক্সটেক নোভা',
    category: 'Product Brand Name',
    protected: true,
    notes: 'Approved trademark product title. Must never be translated literally.',
  },
  {
    id: 'glossary-002',
    term_en: 'Warranty',
    term_hi: 'वारंटी',
    term_bn: 'ওয়ারেন্টি',
    category: 'Legal / Policy',
    protected: true,
    notes: 'Official consumer guarantee term.',
  },
  {
    id: 'glossary-003',
    term_en: 'AI Smart Assistant',
    term_hi: 'एआई स्मार्ट असिस्टेंट',
    term_bn: 'এআই স্মার্ট অ্যাসিস্ট্যান্ট',
    category: 'Feature Terminology',
    protected: true,
    notes: 'Do not use colloquial "robot buddy" in regional copy.',
  },
  {
    id: 'glossary-004',
    term_en: 'Battery Life',
    term_hi: 'बैटरी लाइफ',
    term_bn: 'ব্যাটারি লাইফ',
    category: 'Hardware Specs',
    protected: false,
    notes: 'Standard performance metric.',
  },
];

export const ConsistencyStore = {
  listJobs(): StoredJob[] {
    return [...JOBS_STORE].sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  getJob(id: string): StoredJob | null {
    return JOBS_STORE.find((j) => j.id === id) || null;
  },

  createJob(language: 'hi' | 'bn' | 'en', text: string, factSetId?: string): StoredJob {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const subId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Run Multilingual Consistency Engine
    const claims = extractMultilingualClaims(text, language);
    const findings = verifyConsistency(claims, DEFAULT_FACT_SET);

    const newJob: StoredJob = {
      id: jobId,
      submission_id: subId,
      language,
      raw_text: text,
      fact_set_id: factSetId || 'factset-nextech-2026-04',
      status: 'COMPLETED',
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      findings,
    };

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

  listGlossary(): StoredGlossaryTerm[] {
    return GLOSSARY_STORE;
  },
};
