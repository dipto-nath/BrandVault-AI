export type WorkspaceRole = 'ADMIN' | 'CREATOR' | 'REVIEWER';
export type ContentStatus = 'DRAFT' | 'ANALYZING' | 'NEEDS_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED' | 'FAILED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type VerificationStatus = 'SUPPORTED' | 'CONTRADICTED' | 'UNVERIFIED';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH';
export type FindingType = 'FACTUAL_CONTRADICTION' | 'UNSUPPORTED_CLAIM' | 'UNVERIFIED_CLAIM' | 'TONE_VIOLATION' | 'TERMINOLOGY_VIOLATION' | 'GUIDELINE_VIOLATION' | 'OTHER';
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
