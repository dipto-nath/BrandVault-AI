import { createHash } from 'crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { Storage, DashboardStats, ListOptions } from './adapter';
import type {
  Workspace, Profile, WorkspaceMember, WorkspaceRole,
  BrandGuideline, ApprovedFact, SourceDocument, ContentSubmission,
  ContentVersion, AnalysisRun, AnalysisStatus, ExtractedClaim, Finding,
  FindingEvidence, ReviewDecisionRecord, FindingFeedback,
  GuidelineSuggestion, AuditLog, FactVerificationStatus,
  DocumentStatus, SuggestionStatus, FeedbackType,
} from '@/types/database';

const IS_VERCEL = Boolean(process.env.VERCEL);
const DATA_DIR = IS_VERCEL ? join('/tmp', '.brandvault') : join(process.cwd(), '.brandvault');
const DATA_FILE = join(DATA_DIR, 'store.json');
const DEMO_WORKSPACE_ID = '11111111-1111-1111-1111-111111111111';
const DEMO_USER_ID = '22222222-2222-2222-2222-222222222222';
const DEMO_WORKSPACE_SLUG = 'nextech';

function uid(): string {
  return createHash('sha1').update(String(Date.now()) + Math.random()).digest('hex').slice(0, 32);
}
function now(): string { return new Date().toISOString(); }
function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }

interface Store {
  workspaces: Workspace[]; profiles: Profile[]; members: WorkspaceMember[];
  guidelines: BrandGuideline[]; facts: ApprovedFact[]; documents: SourceDocument[];
  submissions: ContentSubmission[]; versions: ContentVersion[];
  analysisRuns: AnalysisRun[]; claims: ExtractedClaim[]; findings: Finding[];
  findingEvidence: FindingEvidence[]; reviewDecisions: ReviewDecisionRecord[];
  findingFeedback: FindingFeedback[]; guidelineSuggestions: GuidelineSuggestion[];
  auditLogs: AuditLog[];
}
function emptyStore(): Store {
  return { workspaces: [], profiles: [], members: [], guidelines: [], facts: [], documents: [],
    submissions: [], versions: [], analysisRuns: [], claims: [], findings: [],
    findingEvidence: [], reviewDecisions: [], findingFeedback: [], guidelineSuggestions: [], auditLogs: [], };
}
function loadStore(): Store {
  try {
    if (existsSync(DATA_FILE)) {
      return JSON.parse(readFileSync(DATA_FILE, 'utf8')) as Store;
    }
    const tmpFile = join('/tmp', '.brandvault', 'store.json');
    if (existsSync(tmpFile)) {
      return JSON.parse(readFileSync(tmpFile, 'utf8')) as Store;
    }
    return emptyStore();
  } catch {
    return emptyStore();
  }
}
function saveStore(store: Store): void {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch {
    try {
      const fallbackDir = join('/tmp', '.brandvault');
      mkdirSync(fallbackDir, { recursive: true });
      writeFileSync(join(fallbackDir, 'store.json'), JSON.stringify(store, null, 2), 'utf8');
    } catch {
      // In-memory fallback
    }
  }
}
function seed(store: Store): Store {
  // Deduplicate workspaces if any were duplicated
  if (store.workspaces.some((w) => w.id === DEMO_WORKSPACE_ID)) {
    // Already seeded - deduplicate in-memory if needed
    const seenWs = new Set<string>();
    store.workspaces = store.workspaces.filter((w) => !seenWs.has(w.id) && seenWs.add(w.id));
    const seenG = new Set<string>();
    store.guidelines = store.guidelines.filter((g) => !seenG.has(g.rule_code) && seenG.add(g.rule_code));
    const seenF = new Set<string>();
    store.facts = store.facts.filter((f) => !seenF.has(f.fact_code) && seenF.add(f.fact_code));
    return store;
  }

  const t = now();
  const workspace: Workspace = { id: DEMO_WORKSPACE_ID, name: 'NexaTech', slug: DEMO_WORKSPACE_SLUG, description: 'Fictional Indian consumer technology company — demo workspace for BrandVault AI.', logo_url: null, created_at: t, updated_at: t };
  const profile: Profile = { id: DEMO_USER_ID, full_name: 'Demo Reviewer', email: 'demo@nexatech.example', created_at: t };
  const member: WorkspaceMember = { id: uid(), workspace_id: DEMO_WORKSPACE_ID, user_id: DEMO_USER_ID, role: 'ADMIN', created_at: t };
  store.workspaces.push(workspace); store.profiles.push(profile); store.members.push(member);

  const guidelines: BrandGuideline[] = [
    { id: '00000000-0000-0000-0001-000000000001', workspace_id: DEMO_WORKSPACE_ID, rule_code: 'RULE-TONE-001', title: 'Professional and helpful voice', description: 'Content must be clear, helpful and professional. Avoid exaggerated statements, aggressive urgency and unnecessary slang.', category: 'TONE', severity: 'MEDIUM', examples: { good: ['Our solution helps teams ship faster.'], bad: ["This is the world's best tool, buy now!"] }, active: true, version: 1, created_by: DEMO_USER_ID, created_at: t, updated_at: t },
    { id: '00000000-0000-0000-0001-000000000002', workspace_id: DEMO_WORKSPACE_ID, rule_code: 'RULE-TONE-002', title: 'Avoid unsupported superlatives', description: 'Statements such as "world\'s best", "number one" or "unmatched" must have approved evidence.', category: 'TONE', severity: 'HIGH', examples: { good: ['Rated 4.5 stars by independent reviewers.'], bad: ["The world's best smartphone for everyone."] }, active: true, version: 1, created_by: DEMO_USER_ID, created_at: t, updated_at: t },
    { id: '00000000-0000-0000-0001-000000000003', workspace_id: DEMO_WORKSPACE_ID, rule_code: 'RULE-TERM-001', title: 'Preferred terminology', description: 'Use "smart assistant" instead of "AI robot buddy".', category: 'TERMINOLOGY', severity: 'MEDIUM', examples: { good: ['The smart assistant helps you set reminders.'], bad: ['Our AI robot buddy is ready to help.'] }, active: true, version: 1, created_by: DEMO_USER_ID, created_at: t, updated_at: t },
    { id: '00000000-0000-0000-0001-000000000004', workspace_id: DEMO_WORKSPACE_ID, rule_code: 'RULE-CLAIM-001', title: 'Product specifications require evidence', description: 'All product performance claims must be consistent with active approved specifications.', category: 'CLAIMS', severity: 'HIGH', examples: { good: ['Up to 24 hours of battery life.'], bad: ['48 hours of battery life.'] }, active: true, version: 1, created_by: DEMO_USER_ID, created_at: t, updated_at: t },
    { id: '00000000-0000-0000-0001-000000000005', workspace_id: DEMO_WORKSPACE_ID, rule_code: 'RULE-CLAIM-002', title: 'Waterproof claims require explicit approval', description: 'Do not communicate waterproofing or water-resistance ratings without an approved source.', category: 'CLAIMS', severity: 'HIGH', examples: { good: [], bad: ['Completely waterproof.'] }, active: true, version: 1, created_by: DEMO_USER_ID, created_at: t, updated_at: t },
  ];
  store.guidelines.push(...guidelines);

  const facts: ApprovedFact[] = [
    { id: '00000000-0000-0000-0002-000000000001', workspace_id: DEMO_WORKSPACE_ID, fact_code: 'FACT-001', title: 'Battery life', fact_text: 'NexaTech Nova offers up to 24 hours of battery life under specified test conditions.', entity_name: 'NexaTech Nova', source_document_id: null, source_name: 'Nova Product Specification', source_reference: 'Nova Product Specification', source_excerpt: 'Up to 24 hours of battery life under specified test conditions.', verification_status: 'APPROVED', effective_from: null, expires_at: null, notes: null, created_by: DEMO_USER_ID, created_at: t, updated_at: t },
    { id: '00000000-0000-0000-0002-000000000002', workspace_id: DEMO_WORKSPACE_ID, fact_code: 'FACT-002', title: 'Device weight', fact_text: 'NexaTech Nova weighs 185 grams.', entity_name: 'NexaTech Nova', source_document_id: null, source_name: 'Nova Product Specification', source_reference: 'Nova Product Specification', source_excerpt: '185 grams.', verification_status: 'APPROVED', effective_from: null, expires_at: null, notes: null, created_by: DEMO_USER_ID, created_at: t, updated_at: t },
    { id: '00000000-0000-0000-0002-000000000003', workspace_id: DEMO_WORKSPACE_ID, fact_code: 'FACT-003', title: 'Materials', fact_text: 'The NexaTech Nova chassis uses recycled aluminium.', entity_name: 'NexaTech Nova', source_document_id: null, source_name: 'Sustainability Fact Sheet', source_reference: 'Sustainability Fact Sheet', source_excerpt: 'Recycled aluminium chassis.', verification_status: 'APPROVED', effective_from: null, expires_at: null, notes: null, created_by: DEMO_USER_ID, created_at: t, updated_at: t },
    { id: '00000000-0000-0000-0002-000000000004', workspace_id: DEMO_WORKSPACE_ID, fact_code: 'FACT-004', title: 'Waterproofing', fact_text: 'No approved waterproof rating is currently documented.', entity_name: 'NexaTech Nova', source_document_id: null, source_name: 'Product Claims Register', source_reference: 'Product Claims Register', source_excerpt: 'No waterproof rating documented.', verification_status: 'APPROVED', effective_from: null, expires_at: null, notes: null, created_by: DEMO_USER_ID, created_at: t, updated_at: t },
    { id: '00000000-0000-0000-0002-000000000005', workspace_id: DEMO_WORKSPACE_ID, fact_code: 'FACT-005', title: 'Launch date', fact_text: 'The NexaTech Nova launch is scheduled for 15 December 2026.', entity_name: 'NexaTech Nova', source_document_id: null, source_name: 'NexaTech Launch Plan', source_reference: 'NexaTech Launch Plan', source_excerpt: 'Launch scheduled for 15 December 2026.', verification_status: 'APPROVED', effective_from: null, expires_at: null, notes: null, created_by: DEMO_USER_ID, created_at: t, updated_at: t },
  ];
  store.facts.push(...facts);

  // Seed demo submissions if empty
  if (store.submissions.length === 0) {
    const sub1: ContentSubmission = {
      id: '00000000-0000-0000-0003-000000000001',
      workspace_id: DEMO_WORKSPACE_ID,
      title: 'Nova Product Launch — Instagram Post',
      content_type: 'Social media post',
      channel: 'Instagram',
      original_content: 'Introducing the NexaTech Nova. Up to 24 hours of battery life. Weighing just 185g, crafted from recycled aluminium. Available 15 December 2026.',
      current_content: 'Introducing the NexaTech Nova. Up to 24 hours of battery life. Weighing just 185g, crafted from recycled aluminium. Available 15 December 2026.',
      status: 'APPROVED',
      risk_level: 'LOW',
      reviewer_id: DEMO_USER_ID,
      created_by: DEMO_USER_ID,
      created_at: t,
      updated_at: t,
      submitted_at: t,
    };
    const sub2: ContentSubmission = {
      id: '00000000-0000-0000-0003-000000000002',
      workspace_id: DEMO_WORKSPACE_ID,
      title: 'Nova Battery Campaign — Email',
      content_type: 'Email campaign',
      channel: 'Email',
      original_content: 'Experience three full days of battery life with NexaTech Nova. The world\'s most efficient smartphone — available soon.',
      current_content: 'Experience three full days of battery life with NexaTech Nova. The world\'s most efficient smartphone — available soon.',
      status: 'REJECTED',
      risk_level: 'HIGH',
      reviewer_id: DEMO_USER_ID,
      created_by: DEMO_USER_ID,
      created_at: t,
      updated_at: t,
      submitted_at: t,
    };
    const sub3: ContentSubmission = {
      id: '00000000-0000-0000-0003-000000000003',
      workspace_id: DEMO_WORKSPACE_ID,
      title: 'Nova Product Page — Website Copy',
      content_type: 'Website copy',
      channel: 'Website',
      original_content: 'Meet NexaTech Nova. The smart assistant built in helps you stay connected without lifting a finger. Sustainable by design, capable by nature.',
      current_content: 'Meet NexaTech Nova. The smart assistant built in helps you stay connected without lifting a finger. Sustainable by design, capable by nature.',
      status: 'NEEDS_REVIEW',
      risk_level: 'MEDIUM',
      reviewer_id: null,
      created_by: DEMO_USER_ID,
      created_at: t,
      updated_at: t,
      submitted_at: t,
    };
    store.submissions.push(sub1, sub2, sub3);

    // Seed versions
    store.versions.push(
      { id: uid(), workspace_id: DEMO_WORKSPACE_ID, submission_id: sub1.id, version_number: 1, content: sub1.original_content, created_by: DEMO_USER_ID, created_at: t, change_reason: 'Initial submission' },
      { id: uid(), workspace_id: DEMO_WORKSPACE_ID, submission_id: sub2.id, version_number: 1, content: sub2.original_content, created_by: DEMO_USER_ID, created_at: t, change_reason: 'Initial submission' },
      { id: uid(), workspace_id: DEMO_WORKSPACE_ID, submission_id: sub3.id, version_number: 1, content: sub3.original_content, created_by: DEMO_USER_ID, created_at: t, change_reason: 'Initial submission' }
    );

    // Seed review decisions
    store.reviewDecisions.push(
      { id: uid(), workspace_id: DEMO_WORKSPACE_ID, submission_id: sub1.id, reviewer_id: DEMO_USER_ID, decision: 'APPROVED', comment: 'All claims verified against approved specifications. Content approved for publication.', created_at: t },
      { id: uid(), workspace_id: DEMO_WORKSPACE_ID, submission_id: sub2.id, reviewer_id: DEMO_USER_ID, decision: 'REJECTED', comment: 'Battery claim (three full days) contradicts the approved 24-hour specification. Superlative "world\'s most efficient" is unsupported. Requires significant revision.', created_at: t }
    );

    // Seed claims and findings for sub1 & sub2
    store.claims.push(
      { id: uid(), workspace_id: DEMO_WORKSPACE_ID, submission_id: sub1.id, analysis_run_id: uid(), claim_text: 'Up to 24 hours of battery life.', claim_type: 'PRODUCT_SPECIFICATION', verification_status: 'SUPPORTED', explanation: 'Matches FACT-001 (up to 24 hours under test conditions).', confidence: 0.96, created_at: t },
      { id: uid(), workspace_id: DEMO_WORKSPACE_ID, submission_id: sub1.id, analysis_run_id: uid(), claim_text: 'Weighing just 185g.', claim_type: 'PRODUCT_SPECIFICATION', verification_status: 'SUPPORTED', explanation: 'Matches FACT-002 (weighs 185 grams).', confidence: 0.95, created_at: t },
      { id: uid(), workspace_id: DEMO_WORKSPACE_ID, submission_id: sub2.id, analysis_run_id: uid(), claim_text: 'Three full days of battery life.', claim_type: 'PRODUCT_SPECIFICATION', verification_status: 'CONTRADICTED', explanation: 'Approved spec states up to 24 hours.', confidence: 0.95, created_at: t }
    );

    const f1Id = uid();
    store.findings.push({
      id: f1Id,
      workspace_id: DEMO_WORKSPACE_ID,
      submission_id: sub2.id,
      analysis_run_id: uid(),
      claim_id: null,
      finding_type: 'FACTUAL_CONTRADICTION',
      severity: 'HIGH',
      rule_id: '00000000-0000-0000-0001-000000000004',
      title: 'Battery life claim is contradicted',
      excerpt: 'three full days of battery life',
      explanation: 'Conflicts directly with approved Nova Product Specification (24 hours).',
      suggested_correction: 'Up to 24 hours of battery life under specified test conditions.',
      confidence: 0.96,
      status: 'OPEN',
      created_at: t,
    });

    store.findingEvidence.push({
      id: uid(),
      finding_id: f1Id,
      approved_fact_id: '00000000-0000-0000-0002-000000000001',
      source_document_id: null,
      evidence_excerpt: 'NexaTech Nova offers up to 24 hours of battery life under specified test conditions.',
      relevance_explanation: 'Nova Product Specification: 24 hours maximum test battery life.',
      evidence_relation: 'CONTRADICTS',
      created_at: t,
    });

    // Seed feedback for guideline intelligence loop
    store.findingFeedback.push({
      id: uid(),
      workspace_id: DEMO_WORKSPACE_ID,
      finding_id: f1Id,
      user_id: DEMO_USER_ID,
      feedback_type: 'OVERRIDDEN',
      reason: 'AI misinterpreted context for promotional teaser, but spec is strictly 24 hours.',
      created_at: t,
    });

    // Seed guideline suggestion
    store.guidelineSuggestions.push({
      id: uid(),
      workspace_id: DEMO_WORKSPACE_ID,
      guideline_id: '00000000-0000-0000-0001-000000000004',
      title: 'Clarify battery measurement conditions for email marketing',
      suggested_change: 'Explicitly require standard disclaimer "under specified test conditions" whenever battery metrics are cited in email or digital campaigns.',
      supporting_feedback_ids: [],
      status: 'PENDING',
      created_by: DEMO_USER_ID,
      reviewed_by: null,
      created_at: t,
      reviewed_at: null,
    });

    // Seed audit logs
    store.auditLogs.push(
      { id: uid(), workspace_id: DEMO_WORKSPACE_ID, user_id: DEMO_USER_ID, entity_type: 'content_submission', entity_id: sub1.id, action: 'REVIEW_APPROVED', old_value: { status: 'NEEDS_REVIEW' }, new_value: { status: 'APPROVED' }, metadata: null, created_at: t },
      { id: uid(), workspace_id: DEMO_WORKSPACE_ID, user_id: DEMO_USER_ID, entity_type: 'content_submission', entity_id: sub2.id, action: 'REVIEW_REJECTED', old_value: { status: 'NEEDS_REVIEW' }, new_value: { status: 'REJECTED' }, metadata: null, created_at: t }
    );
  }

  return store;
}
let storeCache: Store | null = null;
function getStore(): Store { if (!storeCache) storeCache = seed(loadStore()); return storeCache; }
function persist(store: Store): void { storeCache = store; saveStore(store); }
function filterByWorkspace<T extends { workspace_id: string }>(arr: T[], workspaceId: string): T[] { return arr.filter((x) => x.workspace_id === workspaceId); }

export class FileStorage implements Storage {
  private store(): Store { return getStore(); }
  async getWorkspace(id: string): Promise<Workspace | null> {
    return this.store().workspaces.find((w) => w.id === id) ?? null;
  }
  async getWorkspaceBySlug(slug: string): Promise<Workspace | null> {
    const s = (slug || '').toLowerCase();
    return this.store().workspaces.find((w) => {
      const wsSlug = (w.slug || '').toLowerCase();
      return wsSlug === s || ((s === 'nexatech' || s === 'nextech') && (wsSlug === 'nextech' || wsSlug === 'nexatech'));
    }) ?? null;
  }
  async getDemoWorkspace(): Promise<Workspace | null> {
    const ws = await this.getWorkspaceBySlug(DEMO_WORKSPACE_SLUG);
    if (ws) return ws;
    return this.store().workspaces[0] ?? null;
  }
  async createWorkspace(data: { name: string; slug: string; description?: string }): Promise<Workspace> {
    const store = this.store(); const w: Workspace = { id: uid(), name: data.name, slug: data.slug, description: data.description ?? null, logo_url: null, created_at: now(), updated_at: now() };
    store.workspaces.push(w); persist(store); return clone(w);
  }
  async getCurrentUser(): Promise<{ id: string; email: string | null; full_name: string | null } | null> { return { id: DEMO_USER_ID, email: 'demo@nexatech.example', full_name: 'Demo Reviewer' }; }
  async getProfile(userId: string): Promise<Profile | null> { return this.store().profiles.find((p) => p.id === userId) ?? null; }
  async createProfile(data: { id: string; email: string | null; full_name: string | null }): Promise<Profile> {
    const store = this.store(); const p: Profile = { id: data.id, email: data.email ?? '', full_name: data.full_name, created_at: now() };
    store.profiles.push(p); persist(store); return clone(p);
  }
  async getMember(workspaceId: string, userId: string): Promise<WorkspaceMember | null> { return this.store().members.find((m) => m.workspace_id === workspaceId && m.user_id === userId) ?? null; }
  async listMembers(workspaceId: string): Promise<WorkspaceMember[]> { return clone(filterByWorkspace(this.store().members, workspaceId)); }
  async ensureMember(workspaceId: string, userId: string, role: WorkspaceRole = 'CREATOR'): Promise<WorkspaceMember> {
    const existing = await this.getMember(workspaceId, userId); if (existing) return clone(existing);
    const store = this.store(); const m: WorkspaceMember = { id: uid(), workspace_id: workspaceId, user_id: userId, role, created_at: now() };
    store.members.push(m); persist(store); return clone(m);
  }
  async listGuidelines(workspaceId: string, opts?: { active?: boolean; category?: string } & ListOptions): Promise<BrandGuideline[]> {
    let arr = filterByWorkspace(this.store().guidelines, workspaceId);
    if (opts?.active !== undefined) arr = arr.filter((g) => g.active === opts.active);
    if (opts?.category) arr = arr.filter((g) => g.category === opts.category);
    return clone(arr.sort((a, b) => a.rule_code.localeCompare(b.rule_code)));
  }
  async getGuideline(id: string): Promise<BrandGuideline | null> { return this.store().guidelines.find((g) => g.id === id) ?? null; }
  async createGuideline(data: Omit<BrandGuideline, 'id' | 'created_at' | 'updated_at'> & { created_by?: string | null }): Promise<BrandGuideline> {
    const store = this.store(); const g: BrandGuideline = { id: uid(), workspace_id: data.workspace_id, rule_code: data.rule_code, title: data.title, description: data.description, category: data.category, severity: data.severity, examples: data.examples ?? null, active: data.active ?? true, version: data.version ?? 1, created_by: data.created_by ?? null, created_at: now(), updated_at: now() };
    store.guidelines.push(g); persist(store); return clone(g);
  }
  async updateGuideline(id: string, data: Partial<Pick<BrandGuideline, 'title' | 'description' | 'category' | 'severity' | 'examples' | 'active' | 'version'>>): Promise<BrandGuideline> {
    const store = this.store(); const idx = store.guidelines.findIndex((g) => g.id === id);
    if (idx === -1) throw new Error('Guideline not found');
    const g = { ...store.guidelines[idx], ...data, updated_at: now(), version: (store.guidelines[idx].version || 1) + 1 };
    store.guidelines[idx] = g; persist(store); return clone(g);
  }
  async deactivateGuideline(id: string): Promise<void> { await this.updateGuideline(id, { active: false }); }
  async listFacts(workspaceId: string, opts?: { active?: boolean } & ListOptions): Promise<ApprovedFact[]> {
    let arr = filterByWorkspace(this.store().facts, workspaceId);
    if (opts?.active !== undefined) arr = arr.filter((f) => f.verification_status === 'APPROVED');
    return clone(arr);
  }
  async getFact(id: string): Promise<ApprovedFact | null> { return this.store().facts.find((f) => f.id === id) ?? null; }
  async createFact(data: Omit<ApprovedFact, 'id' | 'created_at' | 'updated_at'> & { created_by?: string | null }): Promise<ApprovedFact> {
    const store = this.store(); const f: ApprovedFact = { id: uid(), workspace_id: data.workspace_id, fact_code: data.fact_code, title: data.title, fact_text: data.fact_text, entity_name: data.entity_name ?? null, source_document_id: data.source_document_id ?? null, source_name: data.source_name, source_reference: data.source_reference ?? null, source_excerpt: data.source_excerpt ?? null, verification_status: data.verification_status ?? 'PENDING', effective_from: data.effective_from ?? null, expires_at: data.expires_at ?? null, notes: data.notes ?? null, created_by: data.created_by ?? null, created_at: now(), updated_at: now() };
    store.facts.push(f); persist(store); return clone(f);
  }
  async updateFact(id: string, data: Partial<Pick<ApprovedFact, 'title' | 'fact_text' | 'entity_name' | 'source_name' | 'source_reference' | 'source_excerpt' | 'verification_status' | 'effective_from' | 'expires_at' | 'notes'>>): Promise<ApprovedFact> {
    const store = this.store(); const idx = store.facts.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error('Fact not found');
    const f = { ...store.facts[idx], ...data, updated_at: now() };
    store.facts[idx] = f; persist(store); return clone(f);
  }
  async listDocuments(workspaceId: string): Promise<SourceDocument[]> { return clone(filterByWorkspace(this.store().documents, workspaceId)); }
  async getDocument(id: string): Promise<SourceDocument | null> { return this.store().documents.find((d) => d.id === id) ?? null; }
  async createDocument(data: Omit<SourceDocument, 'id' | 'uploaded_at'> & { uploaded_by?: string | null }): Promise<SourceDocument> {
    const store = this.store(); const d: SourceDocument = { id: uid(), workspace_id: data.workspace_id, filename: data.filename, storage_path: data.storage_path ?? null, mime_type: data.mime_type, file_size: data.file_size ?? null, source_name: data.source_name, document_status: data.document_status ?? 'UPLOADING', extracted_text: data.extracted_text ?? null, extraction_error: data.extraction_error ?? null, uploaded_by: data.uploaded_by ?? null, uploaded_at: now() };
    store.documents.push(d); persist(store); return clone(d);
  }
  async updateDocument(id: string, data: Partial<Pick<SourceDocument, 'document_status' | 'extracted_text' | 'extraction_error' | 'source_name'>>): Promise<SourceDocument> {
    const store = this.store(); const idx = store.documents.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error('Document not found');
    const d = { ...store.documents[idx], ...data };
    store.documents[idx] = d; persist(store); return clone(d);
  }
  async approveDocument(id: string): Promise<SourceDocument> {
    const store = this.store(); const idx = store.documents.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error('Document not found');
    const d = { ...store.documents[idx], document_status: 'APPROVED' as DocumentStatus };
    store.documents[idx] = d; persist(store); return clone(d);
  }
  async listSubmissions(workspaceId: string, opts?: ListOptions & { status?: string; risk_level?: string }): Promise<ContentSubmission[]> {
    let arr = filterByWorkspace(this.store().submissions, workspaceId);
    if (opts?.status) arr = arr.filter((s) => s.status === opts.status);
    if (opts?.risk_level) arr = arr.filter((s) => s.risk_level === opts.risk_level);
    arr = arr.sort((a, b) => (b.updated_at || b.created_at).localeCompare(a.updated_at || a.created_at));
    if (opts?.offset) arr = arr.slice(Number(opts.offset));
    if (opts?.limit) arr = arr.slice(0, Number(opts.limit));
    return clone(arr);
  }
  async getSubmission(id: string): Promise<ContentSubmission | null> { return this.store().submissions.find((s) => s.id === id || s.reference === id || s.passport_reference === id) ?? null; }
  async createSubmission(data: Omit<ContentSubmission, 'id' | 'created_at' | 'updated_at' | 'submitted_at'> & { id?: string; created_by?: string | null }): Promise<ContentSubmission> {
    const store = this.store(); const s: ContentSubmission = { id: data.id || uid(), workspace_id: data.workspace_id, title: data.title, content_type: data.content_type, channel: data.channel, original_content: data.original_content, current_content: data.current_content, status: data.status ?? 'DRAFT', risk_level: null, created_by: data.created_by ?? null, reviewer_id: null, created_at: now(), updated_at: now(), submitted_at: null };
    store.submissions.push(s); persist(store); return clone(s);
  }
  async updateSubmission(id: string, data: Partial<Pick<ContentSubmission, 'title' | 'content_type' | 'channel' | 'original_content' | 'current_content' | 'status' | 'risk_level' | 'reviewer_id' | 'submitted_at'>>): Promise<ContentSubmission> {
    const store = this.store(); const idx = store.submissions.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Submission not found');
    const s = { ...store.submissions[idx], ...data, updated_at: now() };
    store.submissions[idx] = s; persist(store); return clone(s);
  }
  async listVersions(submissionId: string): Promise<ContentVersion[]> { return clone(this.store().versions.filter((v) => v.submission_id === submissionId).sort((a, b) => a.version_number - b.version_number)); }
  async createVersion(data: Omit<ContentVersion, 'id' | 'created_at'> & { created_by?: string | null }): Promise<ContentVersion> {
    const store = this.store(); const v: ContentVersion = { id: uid(), workspace_id: data.workspace_id, submission_id: data.submission_id, version_number: data.version_number, content: data.content, created_by: data.created_by ?? null, created_at: now(), change_reason: data.change_reason ?? null };
    store.versions.push(v); persist(store); return clone(v);
  }
  async createAnalysisRun(data: Omit<AnalysisRun, 'id' | 'started_at'> & { started_at?: string }): Promise<AnalysisRun> {
    const store = this.store(); const r: AnalysisRun = { id: uid(), workspace_id: data.workspace_id, submission_id: data.submission_id, content_version_id: data.content_version_id ?? null, provider: data.provider, model_name: data.model_name, prompt_version: data.prompt_version ?? 'v1', status: data.status ?? 'PENDING', result: data.result ?? null, error_message: data.error_message ?? null, started_at: data.started_at ?? now(), completed_at: null, duration_ms: null };
    store.analysisRuns.push(r); persist(store); return clone(r);
  }
  async getAnalysisRun(id: string): Promise<AnalysisRun | null> { return this.store().analysisRuns.find((r) => r.id === id) ?? null; }
  async updateAnalysisRun(id: string, data: Partial<Pick<AnalysisRun, 'status' | 'result' | 'error_message' | 'completed_at' | 'duration_ms' | 'provider' | 'model_name'>>): Promise<AnalysisRun> {
    const store = this.store(); const idx = store.analysisRuns.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Analysis run not found');
    const r = { ...store.analysisRuns[idx], ...data };
    store.analysisRuns[idx] = r; persist(store); return clone(r);
  }
  async listAnalysisRuns(submissionId: string): Promise<AnalysisRun[]> { return clone(this.store().analysisRuns.filter((r) => r.submission_id === submissionId)); }
  async createClaims(claims: Array<Omit<ExtractedClaim, 'id' | 'created_at'> & { created_by?: string | null }>): Promise<ExtractedClaim[]> {
    const store = this.store(); const out: ExtractedClaim[] = [];
    for (const c of claims) { const x: ExtractedClaim = { id: uid(), workspace_id: c.workspace_id, submission_id: c.submission_id, analysis_run_id: c.analysis_run_id, claim_text: c.claim_text, claim_type: c.claim_type, verification_status: c.verification_status, explanation: c.explanation, confidence: c.confidence, created_at: now() }; store.claims.push(x); out.push(clone(x)); }
    persist(store); return out;
  }
  async listClaims(submissionId: string): Promise<ExtractedClaim[]> { return clone(this.store().claims.filter((c) => c.submission_id === submissionId)); }
  async createFindings(findings: Array<Omit<Finding, 'id' | 'created_at'> & { created_by?: string | null }>): Promise<Finding[]> {
    const store = this.store(); const out: Finding[] = [];
    for (const f of findings) { const x: Finding = { id: uid(), workspace_id: f.workspace_id, submission_id: f.submission_id, analysis_run_id: f.analysis_run_id, claim_id: f.claim_id ?? null, finding_type: f.finding_type, severity: f.severity, rule_id: f.rule_id ?? null, title: f.title, excerpt: f.excerpt, explanation: f.explanation, suggested_correction: f.suggested_correction ?? null, confidence: f.confidence, status: f.status ?? 'OPEN', created_at: now() }; store.findings.push(x); out.push(clone(x)); }
    persist(store); return out;
  }
  async listFindings(submissionId?: string): Promise<Finding[]> { if (!submissionId) return clone(this.store().findings); return clone(this.store().findings.filter((f) => f.submission_id === submissionId)); }
  async getFinding(id: string): Promise<Finding | null> { return this.store().findings.find((f) => f.id === id) ?? null; }
  async createFindingEvidence(evidence: Array<Omit<FindingEvidence, 'id' | 'created_at'>>): Promise<FindingEvidence[]> {
    const store = this.store(); const out: FindingEvidence[] = [];
    for (const e of evidence) { const x: FindingEvidence = { id: uid(), finding_id: e.finding_id, approved_fact_id: e.approved_fact_id ?? null, source_document_id: e.source_document_id ?? null, evidence_excerpt: e.evidence_excerpt, relevance_explanation: e.relevance_explanation, evidence_relation: e.evidence_relation, created_at: now() }; store.findingEvidence.push(x); out.push(clone(x)); }
    persist(store); return out;
  }
  async listFindingEvidence(findingId: string): Promise<FindingEvidence[]> { return clone(this.store().findingEvidence.filter((e) => e.finding_id === findingId)); }
  async createReviewDecision(data: Omit<ReviewDecisionRecord, 'id' | 'created_at'> & { created_by?: string | null }): Promise<ReviewDecisionRecord> {
    const store = this.store(); const r: ReviewDecisionRecord = { id: uid(), workspace_id: data.workspace_id, submission_id: data.submission_id, reviewer_id: data.reviewer_id, decision: data.decision, comment: data.comment ?? null, created_at: now() };
    store.reviewDecisions.push(r); persist(store); return clone(r);
  }
  async listReviewDecisions(submissionId: string): Promise<ReviewDecisionRecord[]> { return clone(this.store().reviewDecisions.filter((r) => r.submission_id === submissionId).sort((a, b) => a.created_at.localeCompare(b.created_at))); }
  async createFindingFeedback(data: Omit<FindingFeedback, 'id' | 'created_at'> & { created_by?: string | null }): Promise<FindingFeedback> {
    const store = this.store(); const f: FindingFeedback = { id: uid(), workspace_id: data.workspace_id, finding_id: data.finding_id, user_id: data.user_id, feedback_type: data.feedback_type, reason: data.reason ?? null, created_at: now() };
    store.findingFeedback.push(f); persist(store); return clone(f);
  }
  async listFindingFeedback(findingId: string): Promise<FindingFeedback[]> { return clone(this.store().findingFeedback.filter((f) => f.finding_id === findingId)); }
  async listGuidelineSuggestions(workspaceId: string): Promise<GuidelineSuggestion[]> { return clone(filterByWorkspace(this.store().guidelineSuggestions, workspaceId).sort((a, b) => b.created_at.localeCompare(a.created_at))); }
  async createGuidelineSuggestion(data: Omit<GuidelineSuggestion, 'id' | 'created_at'> & { created_by?: string | null }): Promise<GuidelineSuggestion> {
    const store = this.store(); const s: GuidelineSuggestion = { id: uid(), workspace_id: data.workspace_id, guideline_id: data.guideline_id, title: data.title, suggested_change: data.suggested_change, supporting_feedback_ids: data.supporting_feedback_ids ?? [], status: 'PENDING', created_by: data.created_by ?? null, reviewed_by: null, created_at: now(), reviewed_at: null };
    store.guidelineSuggestions.push(s); persist(store); return clone(s);
  }
  async approveGuidelineSuggestion(id: string, reviewerId: string): Promise<void> {
    const store = this.store(); const idx = store.guidelineSuggestions.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Suggestion not found');
    const sugg = store.guidelineSuggestions[idx];
    store.guidelineSuggestions[idx] = { ...sugg, status: 'APPROVED', reviewed_by: reviewerId, reviewed_at: now() };
    
    if (sugg.guideline_id) {
      const gIdx = store.guidelines.findIndex(g => g.id === sugg.guideline_id);
      if (gIdx !== -1) {
        const oldG = store.guidelines[gIdx];
        const newVersion = (oldG.version || 1) + 1;
        const newDesc = `${oldG.description} ${sugg.suggested_change}`;
        store.guidelines[gIdx] = {
          ...oldG,
          version: newVersion,
          description: newDesc,
          updated_at: now(),
        };
        store.auditLogs.unshift({
          id: uid(),
          workspace_id: sugg.workspace_id,
          user_id: reviewerId,
          entity_type: 'brand_guideline',
          entity_id: oldG.id,
          action: 'GUIDELINE_VERSION_APPROVED',
          old_value: { version: oldG.version, description: oldG.description },
          new_value: { version: newVersion, description: newDesc, suggestion_id: id },
          metadata: { rule_code: oldG.rule_code, title: oldG.title },
          created_at: now(),
        });
      }
    }
    persist(store);
  }
  async rejectGuidelineSuggestion(id: string, reviewerId: string, reason?: string): Promise<void> {
    const store = this.store(); const idx = store.guidelineSuggestions.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Suggestion not found');
    const sugg = store.guidelineSuggestions[idx];
    store.guidelineSuggestions[idx] = { ...sugg, status: 'REJECTED', reviewed_by: reviewerId, reviewed_at: now() };
    store.auditLogs.unshift({
      id: uid(),
      workspace_id: sugg.workspace_id,
      user_id: reviewerId,
      entity_type: 'guideline_suggestion',
      entity_id: id,
      action: 'SUGGESTION_DISMISSED',
      old_value: { status: sugg.status },
      new_value: { status: 'REJECTED', reason: reason || 'Dismissed by reviewer' },
      metadata: { suggestion_title: sugg.title },
      created_at: now(),
    });
    persist(store);
  }
  async undoGuidelineSuggestion(id: string, reviewerId: string): Promise<void> {
    const store = this.store(); const idx = store.guidelineSuggestions.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Suggestion not found');
    const sugg = store.guidelineSuggestions[idx];
    store.guidelineSuggestions[idx] = { ...sugg, status: 'PENDING', reviewed_by: null, reviewed_at: null };
    if (sugg.guideline_id) {
      const gIdx = store.guidelines.findIndex(g => g.id === sugg.guideline_id);
      if (gIdx !== -1) {
        const g = store.guidelines[gIdx];
        const prevVersion = Math.max(1, (g.version || 2) - 1);
        const origDesc = g.description.replace(` ${sugg.suggested_change}`, '');
        store.guidelines[gIdx] = {
          ...g,
          version: prevVersion,
          description: origDesc,
          updated_at: now(),
        };
        store.auditLogs.unshift({
          id: uid(),
          workspace_id: sugg.workspace_id,
          user_id: reviewerId,
          entity_type: 'brand_guideline',
          entity_id: g.id,
          action: 'GUIDELINE_VERSION_REVERTED',
          old_value: { version: g.version },
          new_value: { version: prevVersion },
          metadata: { rule_code: g.rule_code, suggestion_id: id },
          created_at: now(),
        });
      }
    }
    persist(store);
  }
  async createAuditLog(data: Omit<AuditLog, 'id' | 'created_at'> & { created_by?: string | null }): Promise<void> {
    const store = this.store(); const a: AuditLog = { id: uid(), workspace_id: data.workspace_id, user_id: data.user_id ?? null, entity_type: data.entity_type, entity_id: data.entity_id, action: data.action, old_value: data.old_value ?? null, new_value: data.new_value ?? null, metadata: data.metadata ?? null, created_at: now() };
    store.auditLogs.push(a); persist(store);
  }
  async listAuditLogs(workspaceId: string, opts?: ListOptions): Promise<AuditLog[]> {
    let arr = filterByWorkspace(this.store().auditLogs, workspaceId);
    arr = arr.sort((a, b) => b.created_at.localeCompare(a.created_at));
    if (opts?.offset) arr = arr.slice(Number(opts.offset));
    if (opts?.limit) arr = arr.slice(0, Number(opts.limit));
    return clone(arr);
  }
  async dashboardStats(workspaceId: string): Promise<DashboardStats> {
    const subs = filterByWorkspace(this.store().submissions, workspaceId);
    const recent = [...subs].sort((a, b) => (b.updated_at || b.created_at).localeCompare(a.updated_at || a.created_at)).slice(0, 8);
    const pendingSubs = subs.filter((s) => s.status === 'NEEDS_REVIEW' || s.status === 'CHANGES_REQUESTED');
    const pendingSubIds = new Set(pendingSubs.map((s) => s.id));
    const openHighFindings = this.store().findings.filter(
      (f) =>
        f.workspace_id === workspaceId &&
        f.status === 'OPEN' &&
        f.severity === 'HIGH' &&
        pendingSubIds.has(f.submission_id)
    );
    return {
      total: subs.length,
      pending: pendingSubs.length,
      approved: subs.filter((s) => s.status === 'APPROVED').length,
      rejected: subs.filter((s) => s.status === 'REJECTED').length,
      highRisk: openHighFindings.length,
      recent: clone(recent),
    };
  }
}
