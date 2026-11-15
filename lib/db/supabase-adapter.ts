import { createServerClient } from '@/lib/db/server';
import type { Storage, DashboardStats, ListOptions } from './adapter';
import type {
  Workspace, Profile, WorkspaceMember, WorkspaceRole,
  BrandGuideline, ApprovedFact, SourceDocument, ContentSubmission,
  ContentVersion, AnalysisRun, AnalysisStatus, ExtractedClaim, Finding,
  FindingEvidence, ReviewDecisionRecord, FindingFeedback,
  GuidelineSuggestion, AuditLog,
} from '@/types/database';

const DEMO_WORKSPACE_SLUG = 'nextech';

function db() { return createServerClient(); }

function one<T>(result: { data: T | null; error: unknown }): T {
  if (result.error) throw result.error;
  if (!result.data) throw new Error('Record not found');
  return result.data as T;
}

function many<T>(result: { data: T[] | null; error: unknown }): T[] {
  if (result.error) throw result.error;
  return result.data ?? [];
}

export class SupabaseStorage implements Storage {
  async getWorkspaceBySlug(slug: string): Promise<Workspace | null> {
    return one(await db().from('workspaces').select('*').eq('slug', slug).single());
  }
  async getDemoWorkspace(): Promise<Workspace | null> {
    return this.getWorkspaceBySlug(DEMO_WORKSPACE_SLUG);
  }
  async createWorkspace(data: { name: string; slug: string; description?: string }): Promise<Workspace> {
    return one(await db().from('workspaces').insert({ ...data }).select().single());
  }
  async getCurrentUser(): Promise<{ id: string; email: string | null; full_name: string | null } | null> {
    const { data } = await db().auth.getUser();
    if (!data.user) return null;
    return { id: data.user.id, email: data.user.email ?? null, full_name: data.user.user_metadata?.full_name ?? null };
  }
  async getProfile(userId: string): Promise<Profile | null> {
    return one(await db().from('profiles').select('*').eq('id', userId).single());
  }
  async createProfile(data: { id: string; email: string | null; full_name: string | null }): Promise<Profile> {
    return one(await db().from('profiles').insert({ id: data.id, email: data.email, full_name: data.full_name }).select().single());
  }
  async getMember(workspaceId: string, userId: string): Promise<WorkspaceMember | null> {
    return one(await db().from('workspace_members').select('*').eq('workspace_id', workspaceId).eq('user_id', userId).single());
  }
  async listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    return many(await db().from('workspace_members').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: true }));
  }
  async ensureMember(workspaceId: string, userId: string, role: WorkspaceRole = 'CREATOR'): Promise<WorkspaceMember> {
    const existing = await this.getMember(workspaceId, userId);
    if (existing) return existing;
    return one(await db().from('workspace_members').insert({ workspace_id: workspaceId, user_id: userId, role }).select().single());
  }
  async listGuidelines(workspaceId: string, opts?: { active?: boolean; category?: string } & ListOptions): Promise<BrandGuideline[]> {
    let q = db().from('brand_guidelines').select('*').eq('workspace_id', workspaceId);
    if (opts?.active !== undefined) q = q.eq('active', opts.active);
    if (opts?.category) q = q.eq('category', opts.category);
    q = q.order('rule_code', { ascending: true });
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as BrandGuideline[];
  }
  async getGuideline(id: string): Promise<BrandGuideline | null> {
    return one(await db().from('brand_guidelines').select('*').eq('id', id).single());
  }
  async createGuideline(data: Omit<BrandGuideline, 'id' | 'created_at' | 'updated_at'> & { created_by?: string | null }): Promise<BrandGuideline> {
    const { rule_code, title, description, category, severity, examples, active, version, workspace_id, created_by } = data;
    return one(await db().from('brand_guidelines').insert({ rule_code, title, description, category, severity, examples, active, version: version ?? 1, workspace_id, created_by }).select().single());
  }
  async updateGuideline(id: string, data: Partial<Pick<BrandGuideline, 'title' | 'description' | 'category' | 'severity' | 'examples' | 'active' | 'version'>>): Promise<BrandGuideline> {
    return one(await db().from('brand_guidelines').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select().single());
  }
  async deactivateGuideline(id: string): Promise<void> {
    const { error } = await db().from('brand_guidelines').update({ active: false, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  }
  async listFacts(workspaceId: string, opts?: { active?: boolean } & ListOptions): Promise<ApprovedFact[]> {
    let q = db().from('approved_facts').select('*').eq('workspace_id', workspaceId);
    if (opts?.active !== undefined) q = q.eq('verification_status', 'APPROVED');
    const { data, error } = await q.order('fact_code', { ascending: true });
    if (error) throw error;
    return (data ?? []) as ApprovedFact[];
  }
  async getFact(id: string): Promise<ApprovedFact | null> {
    return one(await db().from('approved_facts').select('*').eq('id', id).single());
  }
  async createFact(data: Omit<ApprovedFact, 'id' | 'created_at' | 'updated_at'> & { created_by?: string | null }): Promise<ApprovedFact> {
    return one(await db().from('approved_facts').insert(data).select().single());
  }
  async updateFact(id: string, data: Partial<Pick<ApprovedFact, 'title' | 'fact_text' | 'entity_name' | 'source_name' | 'source_reference' | 'source_excerpt' | 'verification_status' | 'effective_from' | 'expires_at' | 'notes'>>): Promise<ApprovedFact> {
    return one(await db().from('approved_facts').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select().single());
  }
  async listDocuments(workspaceId: string): Promise<SourceDocument[]> {
    const { data, error } = await db().from('source_documents').select('*').eq('workspace_id', workspaceId).order('uploaded_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as SourceDocument[];
  }
  async getDocument(id: string): Promise<SourceDocument | null> {
    return one(await db().from('source_documents').select('*').eq('id', id).single());
  }
  async createDocument(data: Omit<SourceDocument, 'id' | 'uploaded_at'> & { uploaded_by?: string | null }): Promise<SourceDocument> {
    return one(await db().from('source_documents').insert(data).select().single());
  }
  async updateDocument(id: string, data: Partial<Pick<SourceDocument, 'document_status' | 'extracted_text' | 'extraction_error' | 'source_name'>>): Promise<SourceDocument> {
    return one(await db().from('source_documents').update(data).eq('id', id).select().single());
  }
  async approveDocument(id: string): Promise<SourceDocument> {
    return one(await db().from('source_documents').update({ document_status: 'APPROVED' }).eq('id', id).select().single());
  }
  async listSubmissions(workspaceId: string, opts?: ListOptions & { status?: string; risk_level?: string }): Promise<ContentSubmission[]> {
    let q = db().from('content_submissions').select('*').eq('workspace_id', workspaceId);
    if (opts?.status) q = q.eq('status', opts.status);
    if (opts?.risk_level) q = q.eq('risk_level', opts.risk_level);
    q = q.order('updated_at', { ascending: false });
    if (opts?.offset) q = q.range(Number(opts.offset), Number(opts.offset) + 99);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as ContentSubmission[];
  }
  async getSubmission(id: string): Promise<ContentSubmission | null> {
    return one(await db().from('content_submissions').select('*').eq('id', id).single());
  }
  async createSubmission(data: Omit<ContentSubmission, 'id' | 'created_at' | 'updated_at' | 'submitted_at'> & { created_by?: string | null }): Promise<ContentSubmission> {
    return one(await db().from('content_submissions').insert(data).select().single());
  }
  async updateSubmission(id: string, data: Partial<Pick<ContentSubmission, 'title' | 'content_type' | 'channel' | 'original_content' | 'current_content' | 'status' | 'risk_level' | 'reviewer_id' | 'submitted_at'>>): Promise<ContentSubmission> {
    return one(await db().from('content_submissions').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select().single());
  }
  async listVersions(submissionId: string): Promise<ContentVersion[]> {
    const { data, error } = await db().from('content_versions').select('*').eq('submission_id', submissionId).order('version_number', { ascending: true });
    if (error) throw error;
    return (data ?? []) as ContentVersion[];
  }
  async createVersion(data: Omit<ContentVersion, 'id' | 'created_at'> & { created_by?: string | null }): Promise<ContentVersion> {
    return one(await db().from('content_versions').insert(data).select().single());
  }
  async createAnalysisRun(data: Omit<AnalysisRun, 'id' | 'started_at'> & { started_at?: string }): Promise<AnalysisRun> {
    return one(await db().from('analysis_runs').insert(data).select().single());
  }
  async getAnalysisRun(id: string): Promise<AnalysisRun | null> {
    return one(await db().from('analysis_runs').select('*').eq('id', id).single());
  }
  async updateAnalysisRun(id: string, data: Partial<Pick<AnalysisRun, 'status' | 'result' | 'error_message' | 'completed_at' | 'duration_ms' | 'provider' | 'model_name'>>): Promise<AnalysisRun> {
    return one(await db().from('analysis_runs').update(data).eq('id', id).select().single());
  }
  async listAnalysisRuns(submissionId: string): Promise<AnalysisRun[]> {
    const { data, error } = await db().from('analysis_runs').select('*').eq('submission_id', submissionId).order('started_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as AnalysisRun[];
  }
  async createClaims(claims: Array<Omit<ExtractedClaim, 'id' | 'created_at'> & { created_by?: string | null }>): Promise<ExtractedClaim[]> {
    const { data, error } = await db().from('extracted_claims').insert(claims).select();
    if (error) throw error;
    return (data ?? []) as ExtractedClaim[];
  }
  async listClaims(submissionId: string): Promise<ExtractedClaim[]> {
    const { data, error } = await db().from('extracted_claims').select('*').eq('submission_id', submissionId).order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as ExtractedClaim[];
  }
  async createFindings(findings: Array<Omit<Finding, 'id' | 'created_at'> & { created_by?: string | null }>): Promise<Finding[]> {
    const { data, error } = await db().from('findings').insert(findings).select();
    if (error) throw error;
    return (data ?? []) as Finding[];
  }
  async listFindings(submissionId?: string): Promise<Finding[]> {
    let q = db().from('findings').select('*, brand_guidelines:rule_id(*), finding_evidence(*, approved_facts(*))');
    if (submissionId) q = q.eq('submission_id', submissionId);
    const { data, error } = await q.order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as Finding[];
  }
  async getFinding(id: string): Promise<Finding | null> {
    return one(await db().from('findings').select('*, brand_guidelines:rule_id(*), finding_evidence(*)').eq('id', id).single());
  }
  async createFindingEvidence(evidence: Array<Omit<FindingEvidence, 'id' | 'created_at'>>): Promise<FindingEvidence[]> {
    const { data, error } = await db().from('finding_evidence').insert(evidence).select();
    if (error) throw error;
    return (data ?? []) as FindingEvidence[];
  }
  async listFindingEvidence(findingId: string): Promise<FindingEvidence[]> {
    const { data, error } = await db().from('finding_evidence').select('*').eq('finding_id', findingId).order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as FindingEvidence[];
  }
  async createReviewDecision(data: Omit<ReviewDecisionRecord, 'id' | 'created_at'> & { created_by?: string | null }): Promise<ReviewDecisionRecord> {
    return one(await db().from('review_decisions').insert(data).select().single());
  }
  async listReviewDecisions(submissionId: string): Promise<ReviewDecisionRecord[]> {
    const { data, error } = await db().from('review_decisions').select('*').eq('submission_id', submissionId).order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as ReviewDecisionRecord[];
  }
  async createFindingFeedback(data: Omit<FindingFeedback, 'id' | 'created_at'> & { created_by?: string | null }): Promise<FindingFeedback> {
    return one(await db().from('finding_feedback').insert(data).select().single());
  }
  async listFindingFeedback(findingId: string): Promise<FindingFeedback[]> {
    const { data, error } = await db().from('finding_feedback').select('*').eq('finding_id', findingId).order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as FindingFeedback[];
  }
  async listGuidelineSuggestions(workspaceId: string): Promise<GuidelineSuggestion[]> {
    const { data, error } = await db().from('guideline_suggestions').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as GuidelineSuggestion[];
  }
  async createGuidelineSuggestion(data: Omit<GuidelineSuggestion, 'id' | 'created_at'> & { created_by?: string | null }): Promise<GuidelineSuggestion> {
    return one(await db().from('guideline_suggestions').insert(data).select().single());
  }
  async approveGuidelineSuggestion(id: string, reviewerId: string): Promise<void> {
    const { error } = await db().from('guideline_suggestions').update({ status: 'APPROVED', reviewed_by: reviewerId, reviewed_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  }
  async rejectGuidelineSuggestion(id: string, reviewerId: string, reason?: string): Promise<void> {
    const { error } = await db().from('guideline_suggestions').update({ status: 'REJECTED', reviewed_by: reviewerId, reviewed_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  }
  async createAuditLog(data: Omit<AuditLog, 'id' | 'created_at'> & { created_by?: string | null }): Promise<void> {
    const { error } = await db().from('audit_logs').insert(data);
    if (error) throw error;
  }
  async listAuditLogs(workspaceId: string, opts?: ListOptions): Promise<AuditLog[]> {
    let q = db().from('audit_logs').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false });
    if (opts?.offset) q = q.range(Number(opts.offset), Number(opts.offset) + 49);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as AuditLog[];
  }
  async dashboardStats(workspaceId: string): Promise<DashboardStats> {
    const { data: subs, error } = await db().from('content_submissions').select('status, risk_level, created_at, updated_at').eq('workspace_id', workspaceId);
    if (error) throw error;
    const rows = subs ?? [];
    const recent = [...rows].sort((a, b) => (b.updated_at || b.created_at).localeCompare(a.updated_at || a.created_at)).slice(0, 8);
    return {
      total: rows.length,
      pending: rows.filter((s) => s.status === 'NEEDS_REVIEW' || s.status === 'CHANGES_REQUESTED').length,
      approved: rows.filter((s) => s.status === 'APPROVED').length,
      rejected: rows.filter((s) => s.status === 'REJECTED').length,
      highRisk: rows.filter((s) => s.risk_level === 'HIGH').length,
      recent: recent as ContentSubmission[],
    };
  }
}
