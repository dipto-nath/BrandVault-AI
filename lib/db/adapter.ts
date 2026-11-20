import type {
  Workspace,
  Profile,
  WorkspaceMember,
  WorkspaceRole,
  BrandGuideline,
  ApprovedFact,
  SourceDocument,
  ContentSubmission,
  ContentVersion,
  AnalysisRun,
  ExtractedClaim,
  Finding,
  FindingEvidence,
  ReviewDecisionRecord,
  FindingFeedback,
  GuidelineSuggestion,
  AuditLog,
  Product,
} from '@/types/database';

export interface ListOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
}

export interface DashboardStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  highRisk: number;
  recent: ContentSubmission[];
}

export interface Storage {
  // ---------- Workspace ----------
  getWorkspace(id: string): Promise<Workspace | null>;
  getWorkspaceBySlug(slug: string): Promise<Workspace | null>;
  getDemoWorkspace(): Promise<Workspace | null>;
  createWorkspace(data: { name: string; slug: string; description?: string }): Promise<Workspace>;

  // ---------- Auth / profile ----------
  getCurrentUser(): Promise<{ id: string; email: string | null; full_name: string | null } | null>;
  getProfile(userId: string): Promise<Profile | null>;
  getProfileByEmail(email: string): Promise<Profile | null>;
  getWorkspaceForUserByEmail(email: string): Promise<Workspace | null>;
  createProfile(data: { id: string; email: string | null; full_name: string | null }): Promise<Profile>;

  // ---------- Workspace members ----------
  getMember(workspaceId: string, userId: string): Promise<WorkspaceMember | null>;
  listMembers(workspaceId: string): Promise<WorkspaceMember[]>;
  ensureMember(workspaceId: string, userId: string, role?: WorkspaceRole): Promise<WorkspaceMember>;

  // ---------- Brand guidelines ----------
  listGuidelines(workspaceId: string, opts?: { active?: boolean; category?: string } & ListOptions): Promise<BrandGuideline[]>;
  getGuideline(id: string): Promise<BrandGuideline | null>;
  createGuideline(data: Omit<BrandGuideline, 'id' | 'created_at' | 'updated_at'> & { created_by?: string | null }): Promise<BrandGuideline>;
  updateGuideline(id: string, data: Partial<Pick<BrandGuideline, 'title' | 'description' | 'category' | 'severity' | 'examples' | 'active' | 'version'>>): Promise<BrandGuideline>;
  deactivateGuideline(id: string): Promise<void>;

  // ---------- Approved facts ----------
  listFacts(workspaceId: string, opts?: { active?: boolean } & ListOptions): Promise<ApprovedFact[]>;
  getFact(id: string): Promise<ApprovedFact | null>;
  createFact(data: Omit<ApprovedFact, 'id' | 'created_at' | 'updated_at'> & { created_by?: string | null }): Promise<ApprovedFact>;
  updateFact(id: string, data: Partial<Pick<ApprovedFact, 'title' | 'fact_text' | 'entity_name' | 'source_name' | 'source_reference' | 'source_excerpt' | 'verification_status' | 'effective_from' | 'expires_at' | 'notes'>>): Promise<ApprovedFact>;

  // ---------- Source documents ----------
  listDocuments(workspaceId: string): Promise<SourceDocument[]>;
  getDocument(id: string): Promise<SourceDocument | null>;
  createDocument(data: Omit<SourceDocument, 'id' | 'uploaded_at'> & { uploaded_by?: string | null }): Promise<SourceDocument>;
  updateDocument(id: string, data: Partial<Pick<SourceDocument, 'document_status' | 'extracted_text' | 'extraction_error' | 'source_name'>>): Promise<SourceDocument>;
  approveDocument(id: string): Promise<SourceDocument>;

  // ---------- Content submissions ----------
  listSubmissions(workspaceId: string, opts?: ListOptions & { status?: string; risk_level?: string }): Promise<ContentSubmission[]>;
  getSubmission(id: string): Promise<ContentSubmission | null>;
  createSubmission(data: Omit<ContentSubmission, 'id' | 'created_at' | 'updated_at' | 'submitted_at'> & { id?: string; created_by?: string | null }): Promise<ContentSubmission>;
  updateSubmission(id: string, data: Partial<Pick<ContentSubmission, 'title' | 'content_type' | 'channel' | 'original_content' | 'current_content' | 'status' | 'risk_level' | 'reviewer_id' | 'submitted_at'>>): Promise<ContentSubmission>;

  // ---------- Content versions ----------
  listVersions(submissionId: string): Promise<ContentVersion[]>;
  createVersion(data: Omit<ContentVersion, 'id' | 'created_at'> & { created_by?: string | null }): Promise<ContentVersion>;

  // ---------- Analysis runs ----------
  createAnalysisRun(data: Omit<AnalysisRun, 'id' | 'started_at'> & { started_at?: string }): Promise<AnalysisRun>;
  getAnalysisRun(id: string): Promise<AnalysisRun | null>;
  updateAnalysisRun(id: string, data: Partial<Pick<AnalysisRun, 'status' | 'result' | 'error_message' | 'completed_at' | 'duration_ms' | 'provider' | 'model_name'>>): Promise<AnalysisRun>;
  listAnalysisRuns(submissionId: string): Promise<AnalysisRun[]>;

  // ---------- Claims ----------
  createClaims(claims: Array<Omit<ExtractedClaim, 'id' | 'created_at'> & { created_by?: string | null }>): Promise<ExtractedClaim[]>;
  listClaims(submissionId: string): Promise<ExtractedClaim[]>;

  // ---------- Findings ----------
  createFindings(findings: Array<Omit<Finding, 'id' | 'created_at'> & { created_by?: string | null }>): Promise<Finding[]>;
  listFindings(submissionId?: string, workspaceId?: string): Promise<Finding[]>;
  getFinding(id: string): Promise<Finding | null>;
  createFindingEvidence(evidence: Array<Omit<FindingEvidence, 'id' | 'created_at'>>): Promise<FindingEvidence[]>;
  listFindingEvidence(findingId: string): Promise<FindingEvidence[]>;

  // ---------- Review decisions ----------
  createReviewDecision(data: Omit<ReviewDecisionRecord, 'id' | 'created_at'> & { created_by?: string | null }): Promise<ReviewDecisionRecord>;
  listReviewDecisions(submissionId: string): Promise<ReviewDecisionRecord[]>;

  // ---------- Finding feedback ----------
  createFindingFeedback(data: Omit<FindingFeedback, 'id' | 'created_at'> & { created_by?: string | null }): Promise<FindingFeedback>;
  listFindingFeedback(findingId: string): Promise<FindingFeedback[]>;

  // ---------- Guideline suggestions ----------
  listGuidelineSuggestions(workspaceId: string): Promise<GuidelineSuggestion[]>;
  createGuidelineSuggestion(data: Omit<GuidelineSuggestion, 'id' | 'created_at' | 'status' | 'reviewed_by' | 'reviewed_at'> & { created_by?: string | null }): Promise<GuidelineSuggestion>;
  approveGuidelineSuggestion(id: string, reviewerId: string): Promise<void>;
  rejectGuidelineSuggestion(id: string, reviewerId: string, reason?: string): Promise<void>;
  undoGuidelineSuggestion?(id: string, reviewerId: string): Promise<void>;

  // ---------- Audit log ----------
  createAuditLog(data: Omit<AuditLog, 'id' | 'created_at'> & { created_by?: string | null }): Promise<void>;
  listAuditLogs(workspaceId: string, opts?: ListOptions): Promise<AuditLog[]>;

  // ---------- Products ----------
  listProducts(workspaceId: string): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
  createProduct(data: Omit<Product, 'id' | 'created_at' | 'updated_at'> & { created_by?: string | null }): Promise<Product>;
  updateProduct(id: string, data: Partial<Pick<Product, 'name' | 'category' | 'model_or_version' | 'launch_date' | 'status' | 'description'>>): Promise<Product>;

  // ---------- Dashboard ----------
  dashboardStats(workspaceId: string): Promise<DashboardStats>;
}
