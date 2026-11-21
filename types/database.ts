export type WorkspaceRole = 'ADMIN' | 'MANAGER' | 'REVIEWER' | 'CREATOR' | 'AGENCY';
export type ContentStatus = 'DRAFT' | 'ANALYZING' | 'NEEDS_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED' | 'FAILED' | 'NEEDS_RE_REVIEW' | 'OUTDATED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type VerificationStatus = 'SUPPORTED' | 'CONTRADICTED' | 'UNVERIFIED';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH';
export type FindingType = 'FACTUAL_CONTRADICTION' | 'UNSUPPORTED_CLAIM' | 'UNVERIFIED_CLAIM' | 'TONE_VIOLATION' | 'TERMINOLOGY_VIOLATION' | 'GUIDELINE_VIOLATION' | 'ASSET_MISMATCH' | 'LOW_CONTRAST' | 'MISSING_ALT_TEXT' | 'OCR_UNAVAILABLE' | 'OTHER';
export type ReviewDecision = 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
export type FeedbackType = 'ACCEPTED' | 'OVERRIDDEN' | 'EDITED_CORRECTION' | 'REJECTED_CORRECTION' | 'MARKED_AMBIGUOUS';
export type GuidelineCategory = 'TONE' | 'TERMINOLOGY' | 'CLAIMS' | 'FORMATTING' | 'LEGAL' | 'POSITIONING' | 'OTHER';
export type FactVerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type DocumentStatus = 'UPLOADING' | 'EXTRACTING' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'FAILED';
export type AnalysisStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
export type EvidenceRelation = 'SUPPORTS' | 'CONTRADICTS' | 'RELATED';
export type SuggestionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  workspace_id: string;
  name: string;
  category: string | null;
  model_or_version: string | null;
  launch_date: string | null;
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
  description: string | null;
  facts_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
}

export interface BrandGuideline {
  id: string;
  workspace_id: string;
  rule_code: string;
  title: string;
  description: string;
  category: GuidelineCategory;
  severity: Severity;
  examples: { good?: string[]; bad?: string[] } | null;
  active: boolean;
  version: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApprovedFact {
  id: string;
  workspace_id: string;
  product_id?: string | null;
  fact_code: string;
  title: string;
  fact_text: string;
  entity_name: string | null;
  source_document_id: string | null;
  source_name: string;
  source_reference: string | null;
  source_excerpt: string | null;
  verification_status: FactVerificationStatus;
  effective_from: string | null;
  expires_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SourceDocument {
  id: string;
  workspace_id: string;
  filename: string;
  storage_path: string | null;
  mime_type: string;
  file_size: number | null;
  source_name: string;
  document_status: DocumentStatus;
  extracted_text: string | null;
  extraction_error: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface ContentSubmission {
  id: string;
  workspace_id: string;
  reference?: string;
  passport_reference?: string;
  title: string;
  content_type: string;
  channel: string;
  original_content: string;
  current_content: string;
  status: ContentStatus;
  risk_level: RiskLevel | null;
  created_by: string | null;
  reviewer_id: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  stale_passport?: boolean;
  stale_reason?: string | null;
  stale_trigger_event_id?: string | null;
  stale_at?: string | null;
  stale_dependency_name?: string | null;
  stale_diff_before?: string | null;
  stale_diff_after?: string | null;
}

export interface ContentVersion {
  id: string;
  workspace_id: string;
  submission_id: string;
  version_number: number;
  content: string;
  created_by: string | null;
  created_at: string;
  change_reason: string | null;
}

export interface AnalysisRun {
  id: string;
  workspace_id: string;
  submission_id: string;
  content_version_id: string | null;
  provider: string;
  model_name: string;
  prompt_version: string;
  status: AnalysisStatus;
  result: AnalysisResult | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
}

export interface ExtractedClaim {
  id: string;
  workspace_id: string;
  submission_id: string;
  analysis_run_id: string;
  claim_text: string;
  claim_type: string;
  verification_status: VerificationStatus;
  explanation: string;
  confidence: number;
  created_at: string;
  // Multilingual fields
  language?: string;
  original_text?: string;
  back_translation?: string;
  localized_claim?: string;
  normalized_value?: { value: number; unit: string };
  approved_value?: { value: number; unit: string };
}

// Consistency Check Types
export type ConsistencyCheckLanguage = 'hi' | 'bn' | 'en';

export interface ConsistencyCheckSubmission {
  id: string;
  workspace_id: string;
  user_id: string;
  language: ConsistencyCheckLanguage;
  raw_text: string;
  normalized_text: string;
  fact_set_id: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  created_at: string;
  completed_at?: string;
}

export interface ConsistencyCheckJob {
  id: string;
  submission_id: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  findings: ConsistencyFinding[];
  created_at: string;
  completed_at?: string;
}

export interface ConsistencyFinding {
  id: string;
  job_id: string;
  claim_id: string;
  finding_type: ConsistencyFindingType;
  severity: Severity;
  title: string;
  localized_claim: string;
  back_translation: string;
  approved_fact: string;
  approved_fact_id: string;
  evidence: ConsistencyEvidence;
  confidence: number;
  status: 'OPEN' | 'CONFIRMED' | 'FALSE_POSITIVE' | 'NEEDS_CONTEXT' | 'RESOLVED';
  created_at: string;
}

export type ConsistencyFindingType = 
  | 'NUMERIC_MISMATCH'
  | 'UNIT_MISMATCH'
  | 'DATE_MISMATCH'
  | 'PRODUCT_NAME_MISMATCH'
  | 'VERSION_MISMATCH'
  | 'TERMINOLOGY_MISMATCH'
  | 'UNSUPPORTED_CLAIM'
  | 'UNVERIFIED_CLAIM';

export interface ConsistencyEvidence {
  localized_claim: string;
  back_translation: string;
  approved_fact_text: string;
  approved_fact_id: string;
  source_document: string;
  source_locator: string;
  fact_set_version: string;
  values?: {
    localized: { value: number; unit: string };
    approved: { value: number; unit: string };
  };
}

// Glossary Term
export interface GlossaryTerm {
  id: string;
  workspace_id: string;
  term_en: string;
  term_hi: string;
  term_bn: string;
  category: string;
  protected: boolean;
  valid_from: string;
  valid_to: string | null;
  created_at: string;
  updated_at: string;
}

// Approved Fact Set
export interface ApprovedFactSet {
  id: string;
  workspace_id: string;
  brand_id?: string;
  product_id?: string;
  version: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Evaluation Case
export interface EvaluationCase {
  id: string;
  language: ConsistencyCheckLanguage;
  input_text: string;
  expected_labels: ConsistencyFindingType[];
  dataset_version: string;
  created_at: string;
}

export interface Finding {
  id: string;
  workspace_id: string;
  submission_id: string;
  analysis_run_id: string;
  claim_id: string | null;
  finding_type: FindingType;
  severity: Severity;
  rule_id: string | null;
  title: string;
  excerpt: string;
  explanation: string;
  suggested_correction: string | null;
  confidence: number;
  status: string;
  created_at: string;
  brand_guidelines?: BrandGuideline;
  finding_evidence?: FindingEvidence[];
}

export interface FindingEvidence {
  id: string;
  finding_id: string;
  approved_fact_id: string | null;
  source_document_id: string | null;
  evidence_excerpt: string;
  relevance_explanation: string;
  evidence_relation: EvidenceRelation;
  created_at: string;
  approved_facts?: ApprovedFact;
  source_documents?: SourceDocument;
}

export interface ReviewDecisionRecord {
  id: string;
  workspace_id: string;
  submission_id: string;
  reviewer_id: string;
  decision: ReviewDecision;
  comment: string | null;
  created_at: string;
}

export interface FindingFeedback {
  id: string;
  workspace_id: string;
  finding_id: string;
  user_id: string;
  feedback_type: FeedbackType;
  reason: string | null;
  created_at: string;
}

export interface GuidelineSuggestion {
  id: string;
  workspace_id: string;
  guideline_id: string;
  title: string;
  suggested_change: string;
  supporting_feedback_ids: string[];
  status: SuggestionStatus;
  created_by: string | null;
  reviewed_by: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface AuditLog {
  id: string;
  workspace_id: string;
  user_id: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// AI types
export interface AnalysisResult {
  summary: string;
  riskLevel: RiskLevel;
  claims: ClaimResult[];
  findings: FindingResult[];
  suggestedContent: string;
  analysisNotes: string;
}

export interface ClaimResult {
  claimText: string;
  claimType: string;
  verificationStatus: VerificationStatus;
  explanation: string;
  evidenceIds: string[];
  confidence: number;
}

export interface FindingResult {
  type: FindingType;
  severity: Severity;
  title: string;
  excerpt: string;
  explanation: string;
  ruleId: string | null;
  evidenceIds: string[];
  suggestedCorrection: string | null;
  confidence: number;
}

// Feature 3: Source-change Alerts and Automatic Re-verification
export interface FactVersion {
  id: string;
  workspace_id: string;
  fact_id: string;
  version_number: number;
  title: string;
  fact_text: string;
  canonical_value?: string | null;
  unit?: string | null;
  changed_by: string | null;
  change_reason?: string | null;
  valid_from: string;
  valid_to?: string | null;
  created_at: string;
}

export interface ClaimDependency {
  id: string;
  workspace_id: string;
  submission_id: string;
  claim_id?: string | null;
  dependency_type: 'FACT' | 'GUIDELINE' | 'SOURCE';
  dependency_id: string;
  dependency_code?: string;
  dependency_name?: string;
  dependency_version: number;
  cited_value?: string;
  created_at: string;
}

export interface DependencyChangeEvent {
  id: string;
  workspace_id: string;
  event_type: 'FACT_VERSION_CHANGED' | 'GUIDELINE_VERSION_PUBLISHED' | 'SOURCE_EXPIRED';
  dependency_type: 'FACT' | 'GUIDELINE' | 'SOURCE';
  dependency_id: string;
  dependency_code: string;
  dependency_name: string;
  old_version: number;
  new_version: number;
  before_value: string;
  after_value: string;
  reason?: string | null;
  actor_id: string | null;
  affected_submission_ids: string[];
  created_at: string;
}

export interface ReverificationReviewTask {
  id: string;
  workspace_id: string;
  submission_id: string;
  submission_title?: string;
  trigger_event_id: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  dependency_type: 'FACT' | 'GUIDELINE' | 'SOURCE';
  dependency_code: string;
  dependency_name: string;
  before_value: string;
  after_value: string;
  change_reason?: string | null;
  suggested_action: string;
  created_at: string;
  resolved_at?: string | null;
}
