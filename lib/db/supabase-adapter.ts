import { createServerClient } from '@/lib/db/server';
import type { Storage, DashboardStats, ListOptions } from './adapter';
import type {
  Workspace, Profile, WorkspaceMember, WorkspaceRole,
  BrandGuideline, ApprovedFact, SourceDocument, ContentSubmission,
  ContentVersion, AnalysisRun, AnalysisStatus, ExtractedClaim, Finding,
  FindingEvidence, ReviewDecisionRecord, FindingFeedback,
  GuidelineSuggestion, AuditLog,
  Product, FactVersion, ClaimDependency, DependencyChangeEvent, ReverificationReviewTask,
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
  async getWorkspace(id: string): Promise<Workspace | null> {
    try {
      const { data, error } = await db().from('workspaces').select('*').eq('id', id).maybeSingle();
      if (error || !data) return null;
      return data as Workspace;
    } catch {
      return null;
    }
  }
  async getWorkspaceBySlug(slug: string): Promise<Workspace | null> {
    try {
      const { data, error } = await db().from('workspaces').select('*').eq('slug', slug).maybeSingle();
      if (error || !data) {
        if (slug === 'nextech' || slug === 'nexatech') {
          const altSlug = slug === 'nextech' ? 'nexatech' : 'nextech';
          const alt = await db().from('workspaces').select('*').eq('slug', altSlug).maybeSingle();
          if (alt.data) return alt.data as Workspace;
        }
        return null;
      }
      return data as Workspace;
    } catch {
      return null;
    }
  }
  async getDemoWorkspace(): Promise<Workspace | null> {
    let ws = await this.getWorkspaceBySlug(DEMO_WORKSPACE_SLUG);
    if (!ws) {
      ws = await this.getWorkspaceBySlug('nexatech');
    }
    if (!ws) {
      const { data } = await db().from('workspaces').select('*').limit(1);
      if (data && data.length > 0) ws = data[0] as Workspace;
    }
    return ws;
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
    try {
      const { data, error } = await db().from('profiles').select('*').eq('id', userId).maybeSingle();
      if (error || !data) return null;
      return data as Profile;
    } catch {
      return null;
    }
  }
  async getProfileByEmail(email: string): Promise<Profile | null> {
    try {
      const { data, error } = await db()
        .from('profiles')
        .select('*')
        .ilike('email', email.trim())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error || !data) return null;
      return data as Profile;
    } catch {
      return null;
    }
  }
  async getWorkspaceForUserByEmail(email: string): Promise<Workspace | null> {
    try {
      const profile = await this.getProfileByEmail(email);
      if (!profile) return null;
      const { data: members } = await db()
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      if (members && members.length > 0) {
        for (const m of members) {
          const { data: ws } = await db()
            .from('workspaces')
            .select('*')
            .eq('id', m.workspace_id)
            .maybeSingle();
          if (ws && ws.id !== '11111111-1111-1111-1111-111111111111') {
            return ws as Workspace;
          }
        }
        const { data: ws } = await db()
          .from('workspaces')
          .select('*')
          .eq('id', members[0].workspace_id)
          .maybeSingle();
        if (ws) return ws as Workspace;
      }
      return null;
    } catch {
      return null;
    }
  }
  async createProfile(data: { id: string; email: string | null; full_name: string | null }): Promise<Profile> {
    return one(await db().from('profiles').insert({ id: data.id, email: data.email, full_name: data.full_name }).select().single());
  }
  async getMember(workspaceId: string, userId: string): Promise<WorkspaceMember | null> {
    try {
      const { data, error } = await db().from('workspace_members').select('*').eq('workspace_id', workspaceId).eq('user_id', userId).maybeSingle();
      if (error || !data) return null;
      return data as WorkspaceMember;
    } catch {
      return null;
    }
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
    try {
      const { data, error } = await db().from('brand_guidelines').select('*').eq('id', id).maybeSingle();
      if (error || !data) return null;
      return data as BrandGuideline;
    } catch {
      return null;
    }
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

  // ---------- Products ----------
  async listProducts(workspaceId: string): Promise<Product[]> {
    const { data, error } = await db().from('products').select('*').eq('workspace_id', workspaceId).order('name', { ascending: true });
    if (error) throw error;
    return (data ?? []) as Product[];
  }
  async getProduct(id: string): Promise<Product | null> {
    try {
      const { data, error } = await db().from('products').select('*').eq('id', id).maybeSingle();
      if (error || !data) return null;
      return data as Product;
    } catch {
      return null;
    }
  }
  async createProduct(data: Omit<Product, 'id' | 'created_at' | 'updated_at'> & { created_by?: string | null }): Promise<Product> {
    const { created_by, ...rest } = data;
    return one(await db().from('products').insert({ ...rest, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }).select().single());
  }
  async updateProduct(id: string, data: Partial<Pick<Product, 'name' | 'category' | 'model_or_version' | 'launch_date' | 'status' | 'description'>>): Promise<Product> {
    return one(await db().from('products').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select().single());
  }

  async listFacts(workspaceId: string, opts?: { active?: boolean } & ListOptions): Promise<ApprovedFact[]> {
    let q = db().from('approved_facts').select('*').eq('workspace_id', workspaceId);
    if (opts?.active !== undefined) q = q.eq('verification_status', 'APPROVED');
    const { data, error } = await q.order('fact_code', { ascending: true });
    if (error) throw error;
    return (data ?? []) as ApprovedFact[];
  }
  async getFact(id: string): Promise<ApprovedFact | null> {
    try {
      const { data, error } = await db().from('approved_facts').select('*').eq('id', id).maybeSingle();
      if (error || !data) return null;
      return data as ApprovedFact;
    } catch {
      return null;
    }
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
    try {
      const { data, error } = await db().from('source_documents').select('*').eq('id', id).maybeSingle();
      if (error || !data) return null;
      return data as SourceDocument;
    } catch {
      return null;
    }
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
    try {
      const { data, error } = await db().from('content_submissions').select('*').eq('id', id).maybeSingle();
      if (error || !data) return null;
      return data as ContentSubmission;
    } catch {
      return null;
    }
  }
  async createSubmission(data: Omit<ContentSubmission, 'id' | 'created_at' | 'updated_at' | 'submitted_at'> & { id?: string; created_by?: string | null }): Promise<ContentSubmission> {
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
    const { content_version_id, prompt_version, ...rest } = data as any;
    return one(await db().from('analysis_runs').insert(rest).select().single());
  }
  async getAnalysisRun(id: string): Promise<AnalysisRun | null> {
    try {
      const { data, error } = await db().from('analysis_runs').select('*').eq('id', id).maybeSingle();
      if (error || !data) return null;
      return data as AnalysisRun;
    } catch {
      return null;
    }
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
    const dbRows = claims.map((c: any) => ({
      workspace_id: c.workspace_id,
      submission_id: c.submission_id,
      analysis_run_id: c.analysis_run_id || null,
      claim_text: c.claim_text || c.claimText,
      claim_type: c.claim_type || c.claimType || 'PRODUCT_SPECIFICATION',
      verification_status: c.verification_status || c.verificationStatus || 'UNVERIFIED',
      explanation: c.explanation || null,
      confidence: c.confidence ?? 0.95,
      created_by: c.created_by || null,
    }));
    const { data, error } = await db().from('extracted_claims').insert(dbRows).select();
    if (error) throw error;
    return (data ?? []) as ExtractedClaim[];
  }
  async listClaims(submissionId: string): Promise<ExtractedClaim[]> {
    const { data, error } = await db().from('extracted_claims').select('*').eq('submission_id', submissionId).order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as ExtractedClaim[];
  }
  async createFindings(findings: Array<Omit<Finding, 'id' | 'created_at'> & { created_by?: string | null }>): Promise<Finding[]> {
    const dbRows = findings.map((f: any) => ({
      workspace_id: f.workspace_id,
      submission_id: f.submission_id,
      analysis_run_id: f.analysis_run_id || null,
      rule_id: f.rule_id || null,
      finding_type: f.finding_type || 'OTHER',
      severity: f.severity || 'HIGH',
      message: f.message || f.title || 'Brand finding',
      explanation: f.explanation || null,
      suggested_correction: f.suggested_correction || null,
      original_phrase: f.original_phrase || f.excerpt || null,
      corrected_phrase: f.corrected_phrase || null,
      diff: f.diff || null,
      status: f.status || 'OPEN',
      feedback_state: f.feedback_state || null,
      override_reason: f.override_reason || null,
      created_by: f.created_by || null,
    }));
    const { data, error } = await db().from('findings').insert(dbRows).select();
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      ...row,
      title: row.message || row.title || 'Brand finding',
      excerpt: row.original_phrase || row.excerpt || '',
      confidence: row.confidence ?? 0.95,
    })) as Finding[];
  }
  async listFindings(submissionId?: string, workspaceId?: string): Promise<Finding[]> {
    try {
      let q = db().from('findings').select('*');
      if (submissionId) q = q.eq('submission_id', submissionId);
      if (workspaceId) q = q.eq('workspace_id', workspaceId);
      const { data, error } = await q.order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        ...row,
        title: row.message || row.title || 'Brand finding',
        excerpt: row.original_phrase || row.excerpt || '',
        confidence: row.confidence ?? 0.95,
      })) as Finding[];
    } catch (e) {
      console.warn('Failed to list findings from Supabase:', e);
      return [];
    }
  }
  async getFinding(id: string): Promise<Finding | null> {
    try {
      const { data, error } = await db().from('findings').select('*').eq('id', id).maybeSingle();
      if (error || !data) return null;
      return {
        ...data,
        title: (data as any).message || (data as any).title || 'Brand finding',
        excerpt: (data as any).original_phrase || (data as any).excerpt || '',
        confidence: (data as any).confidence ?? 0.95,
      } as Finding;
    } catch {
      return null;
    }
  }
  async createFindingEvidence(evidence: Array<Omit<FindingEvidence, 'id' | 'created_at'>>): Promise<FindingEvidence[]> {
    const dbRows = evidence.map((e: any) => ({
      finding_id: e.finding_id,
      fact_id: e.fact_id || e.approved_fact_id || null,
      evidence_relation: e.evidence_relation || 'SUPPORTS',
      source_quote: e.source_quote || e.evidence_excerpt || '',
      relevance_score: e.relevance_score ?? 0.9,
    }));
    const { data, error } = await db().from('finding_evidence').insert(dbRows).select();
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      ...row,
      approved_fact_id: row.fact_id || row.approved_fact_id || null,
      evidence_excerpt: row.source_quote || row.evidence_excerpt || '',
      relevance_explanation: 'Linked approved evidence',
    })) as FindingEvidence[];
  }
  async listFindingEvidence(findingId: string): Promise<FindingEvidence[]> {
    const { data, error } = await db().from('finding_evidence').select('*').eq('finding_id', findingId).order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      ...row,
      approved_fact_id: row.fact_id || row.approved_fact_id || null,
      evidence_excerpt: row.source_quote || row.evidence_excerpt || '',
      relevance_explanation: 'Linked approved evidence',
    })) as FindingEvidence[];
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
  async listFindingFeedbacks(findingIds: string[]): Promise<FindingFeedback[]> {
    if (!findingIds || findingIds.length === 0) return [];
    try {
      const chunks: string[][] = [];
      for (let i = 0; i < findingIds.length; i += 100) {
        chunks.push(findingIds.slice(i, i + 100));
      }
      const results = await Promise.all(
        chunks.map((chunk) => db().from('finding_feedback').select('*').in('finding_id', chunk).order('created_at', { ascending: true }))
      );
      const allData: FindingFeedback[] = [];
      for (const res of results) {
        if (res.data) allData.push(...(res.data as FindingFeedback[]));
      }
      return allData;
    } catch (e) {
      console.warn('Failed to list finding feedbacks:', e);
      return [];
    }
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
    const { data: sugg, error: sErr } = await db().from('guideline_suggestions').select('*').eq('id', id).maybeSingle();
    if (sErr || !sugg) throw new Error('Suggestion not found');
    const { error } = await db().from('guideline_suggestions').update({ status: 'APPROVED', reviewed_by: reviewerId, reviewed_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;

    if (sugg.guideline_id) {
      const { data: oldG } = await db().from('brand_guidelines').select('*').eq('id', sugg.guideline_id).maybeSingle();
      if (oldG) {
        const newVersion = (oldG.version || 1) + 1;
        const newDesc = `${oldG.description} ${sugg.suggested_change}`;
        await db().from('brand_guidelines').update({
          version: newVersion,
          description: newDesc,
          updated_at: new Date().toISOString(),
        }).eq('id', oldG.id);
        await db().from('audit_logs').insert({
          workspace_id: sugg.workspace_id,
          user_id: reviewerId,
          entity_type: 'brand_guideline',
          entity_id: oldG.id,
          action: 'GUIDELINE_VERSION_APPROVED',
          old_value: { version: oldG.version, description: oldG.description },
          new_value: { version: newVersion, description: newDesc, suggestion_id: id },
          metadata: { rule_code: oldG.rule_code, title: oldG.title },
          created_at: new Date().toISOString(),
        });
      }
    }
  }
  async rejectGuidelineSuggestion(id: string, reviewerId: string, reason?: string): Promise<void> {
    const { data: sugg, error: sErr } = await db().from('guideline_suggestions').select('*').eq('id', id).maybeSingle();
    if (sErr || !sugg) throw new Error('Suggestion not found');
    const { error } = await db().from('guideline_suggestions').update({ status: 'REJECTED', reviewed_by: reviewerId, reviewed_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    await db().from('audit_logs').insert({
      workspace_id: sugg.workspace_id,
      user_id: reviewerId,
      entity_type: 'guideline_suggestion',
      entity_id: id,
      action: 'SUGGESTION_DISMISSED',
      old_value: { status: sugg.status },
      new_value: { status: 'REJECTED', reason: reason || 'Dismissed by reviewer' },
      metadata: { suggestion_title: sugg.title },
      created_at: new Date().toISOString(),
    });
  }
  async undoGuidelineSuggestion(id: string, reviewerId: string): Promise<void> {
    const { data: sugg, error } = await db().from('guideline_suggestions').select('*').eq('id', id).maybeSingle();
    if (error || !sugg) throw new Error('Suggestion not found');
    await db().from('guideline_suggestions').update({ status: 'PENDING', reviewed_by: null, reviewed_at: null }).eq('id', id);
    if (sugg.guideline_id) {
      const { data: g } = await db().from('brand_guidelines').select('*').eq('id', sugg.guideline_id).maybeSingle();
      if (g) {
        const prevVersion = Math.max(1, (g.version || 2) - 1);
        const origDesc = (g.description || '').replace(` ${sugg.suggested_change}`, '');
        await db().from('brand_guidelines').update({ version: prevVersion, description: origDesc, updated_at: new Date().toISOString() }).eq('id', g.id);
        await db().from('audit_logs').insert({
          workspace_id: sugg.workspace_id,
          user_id: reviewerId,
          entity_type: 'brand_guideline',
          entity_id: g.id,
          action: 'GUIDELINE_VERSION_REVERTED',
          old_value: { version: g.version },
          new_value: { version: prevVersion },
          metadata: { rule_code: g.rule_code, suggestion_id: id },
          created_at: new Date().toISOString(),
        });
      }
    }
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
    const { data: subs, error } = await db().from('content_submissions').select('*').eq('workspace_id', workspaceId);
    if (error) throw error;
    const rows = (subs ?? []) as ContentSubmission[];
    const recent = [...rows].sort((a, b) => (b.updated_at || b.created_at).localeCompare(a.updated_at || a.created_at)).slice(0, 8);
    return {
      total: rows.length,
      pending: rows.filter((s) => s.status === 'NEEDS_REVIEW' || s.status === 'CHANGES_REQUESTED').length,
      approved: rows.filter((s) => s.status === 'APPROVED').length,
      rejected: rows.filter((s) => s.status === 'REJECTED').length,
      highRisk: rows.filter((s) => s.risk_level === 'HIGH').length,
      recent,
    };
  }

  // Feature 3: Fact versions & history
  async createFactVersion(data: Omit<FactVersion, 'id' | 'created_at'>): Promise<FactVersion> {
    try {
      return one(await db().from('fact_versions').insert(data).select().single());
    } catch {
      return { id: String(Date.now()), created_at: new Date().toISOString(), ...data } as FactVersion;
    }
  }
  async listFactVersions(factId: string): Promise<FactVersion[]> {
    try {
      const { data, error } = await db().from('fact_versions').select('*').eq('fact_id', factId).order('version_number', { ascending: false });
      if (error) return [];
      return (data ?? []) as FactVersion[];
    } catch {
      return [];
    }
  }

  // Feature 3: Claim dependencies
  async createClaimDependencies(dependencies: Array<Omit<ClaimDependency, 'id' | 'created_at'>>): Promise<ClaimDependency[]> {
    try {
      return many(await db().from('claim_dependencies').insert(dependencies).select());
    } catch {
      return dependencies.map((d) => ({ id: String(Date.now()), created_at: new Date().toISOString(), ...d }));
    }
  }
  async listClaimDependencies(submissionId: string): Promise<ClaimDependency[]> {
    try {
      const { data, error } = await db().from('claim_dependencies').select('*').eq('submission_id', submissionId);
      if (error) return [];
      return (data ?? []) as ClaimDependency[];
    } catch {
      return [];
    }
  }
  async findSubmissionsByDependency(workspaceId: string, dependencyType: 'FACT' | 'GUIDELINE' | 'SOURCE', dependencyId: string): Promise<string[]> {
    try {
      const { data, error } = await db().from('claim_dependencies').select('submission_id').eq('workspace_id', workspaceId).eq('dependency_type', dependencyType).eq('dependency_id', dependencyId);
      if (error || !data) return [];
      return Array.from(new Set(data.map((r: any) => r.submission_id)));
    } catch {
      return [];
    }
  }

  // Feature 3: Dependency change events & review tasks
  async createChangeEvent(data: Omit<DependencyChangeEvent, 'id' | 'created_at'>): Promise<DependencyChangeEvent> {
    try {
      return one(await db().from('dependency_change_events').insert(data).select().single());
    } catch {
      return { id: String(Date.now()), created_at: new Date().toISOString(), ...data } as DependencyChangeEvent;
    }
  }
  async listChangeEvents(workspaceId: string): Promise<DependencyChangeEvent[]> {
    try {
      const { data, error } = await db().from('dependency_change_events').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false });
      if (error) return [];
      return (data ?? []) as DependencyChangeEvent[];
    } catch {
      return [];
    }
  }
  async getChangeEvent(id: string): Promise<DependencyChangeEvent | null> {
    try {
      const { data, error } = await db().from('dependency_change_events').select('*').eq('id', id).maybeSingle();
      if (error || !data) return null;
      return data as DependencyChangeEvent;
    } catch {
      return null;
    }
  }
  async createReviewTask(data: Omit<ReverificationReviewTask, 'id' | 'created_at'>): Promise<ReverificationReviewTask> {
    try {
      return one(await db().from('reverification_review_tasks').insert(data).select().single());
    } catch {
      return { id: String(Date.now()), created_at: new Date().toISOString(), ...data } as ReverificationReviewTask;
    }
  }
  async listReviewTasks(workspaceId: string, opts?: { status?: string }): Promise<ReverificationReviewTask[]> {
    try {
      let q = db().from('reverification_review_tasks').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false });
      if (opts?.status) q = q.eq('status', opts.status);
      const { data, error } = await q;
      if (error) return [];
      return (data ?? []) as ReverificationReviewTask[];
    } catch {
      return [];
    }
  }
  async updateReviewTask(id: string, data: Partial<Pick<ReverificationReviewTask, 'status' | 'resolved_at'>>): Promise<ReverificationReviewTask> {
    try {
      return one(await db().from('reverification_review_tasks').update(data).eq('id', id).select().single());
    } catch {
      return { id, ...data } as ReverificationReviewTask;
    }
  }
}
