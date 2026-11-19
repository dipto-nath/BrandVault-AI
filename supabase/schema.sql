-- BrandVault AI - Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor if deploying with Supabase

-- 1. Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Workspace Members
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'CREATOR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- 4. Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  model_or_version TEXT,
  launch_date TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Brand Guidelines
CREATE TABLE IF NOT EXISTS brand_guidelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  rule_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'CLAIMS',
  severity TEXT NOT NULL DEFAULT 'HIGH',
  examples JSONB DEFAULT '{"good":[],"bad":[]}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  version INT NOT NULL DEFAULT 1,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Source Documents
CREATE TABLE IF NOT EXISTS source_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT,
  mime_type TEXT NOT NULL DEFAULT 'text/plain',
  file_size INT,
  source_name TEXT NOT NULL,
  document_status TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
  extracted_text TEXT,
  extraction_error TEXT,
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Approved Facts
CREATE TABLE IF NOT EXISTS approved_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  fact_code TEXT NOT NULL,
  title TEXT NOT NULL,
  fact_text TEXT NOT NULL,
  entity_name TEXT,
  source_document_id UUID REFERENCES source_documents(id) ON DELETE SET NULL,
  source_name TEXT NOT NULL,
  source_reference TEXT,
  source_excerpt TEXT,
  verification_status TEXT NOT NULL DEFAULT 'APPROVED',
  effective_from TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Content Submissions
CREATE TABLE IF NOT EXISTS content_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'Marketing Copy',
  channel TEXT DEFAULT 'Website',
  original_content TEXT NOT NULL,
  current_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NEEDS_REVIEW',
  risk_level TEXT NOT NULL DEFAULT 'LOW',
  reviewer_id UUID,
  passport_reference TEXT,
  certified_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Content Versions
CREATE TABLE IF NOT EXISTS content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES content_submissions(id) ON DELETE CASCADE,
  version_number INT NOT NULL DEFAULT 1,
  content TEXT NOT NULL,
  change_reason TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Analysis Runs
CREATE TABLE IF NOT EXISTS analysis_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES content_submissions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING',
  result JSONB,
  error_message TEXT,
  provider TEXT,
  model_name TEXT,
  duration_ms INT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 11. Extracted Claims
CREATE TABLE IF NOT EXISTS extracted_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES content_submissions(id) ON DELETE CASCADE,
  analysis_run_id UUID REFERENCES analysis_runs(id) ON DELETE SET NULL,
  claim_text TEXT NOT NULL,
  claim_type TEXT NOT NULL DEFAULT 'PRODUCT_SPECIFICATION',
  verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED',
  explanation TEXT,
  confidence FLOAT DEFAULT 0.95,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Findings
CREATE TABLE IF NOT EXISTS findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES content_submissions(id) ON DELETE CASCADE,
  analysis_run_id UUID REFERENCES analysis_runs(id) ON DELETE SET NULL,
  rule_id TEXT,
  finding_type TEXT NOT NULL DEFAULT 'OTHER',
  severity TEXT NOT NULL DEFAULT 'HIGH',
  message TEXT NOT NULL,
  explanation TEXT,
  suggested_correction TEXT,
  original_phrase TEXT,
  corrected_phrase TEXT,
  diff JSONB,
  status TEXT NOT NULL DEFAULT 'OPEN',
  feedback_state TEXT,
  override_reason TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Finding Evidence
CREATE TABLE IF NOT EXISTS finding_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  fact_id UUID REFERENCES approved_facts(id) ON DELETE SET NULL,
  evidence_relation TEXT NOT NULL DEFAULT 'SUPPORTS',
  source_quote TEXT,
  relevance_score FLOAT DEFAULT 0.9,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Review Decisions
CREATE TABLE IF NOT EXISTS review_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES content_submissions(id) ON DELETE CASCADE,
  reviewer_id UUID,
  decision TEXT NOT NULL,
  comment TEXT,
  passport_hash TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Finding Feedback
CREATE TABLE IF NOT EXISTS finding_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL,
  reason TEXT,
  edited_correction TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Guideline Suggestions
CREATE TABLE IF NOT EXISTS guideline_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  guideline_id TEXT,
  title TEXT NOT NULL,
  suggested_change TEXT NOT NULL,
  supporting_feedback_ids JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_by UUID,
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- 17. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  metadata JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for high performance multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_members_ws ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_guidelines_ws ON brand_guidelines(workspace_id);
CREATE INDEX IF NOT EXISTS idx_facts_ws ON approved_facts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_submissions_ws ON content_submissions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_findings_sub ON findings(submission_id);
CREATE INDEX IF NOT EXISTS idx_audit_ws ON audit_logs(workspace_id);

-- Demo Workspace Seed Data
INSERT INTO workspaces (id, name, slug, description)
VALUES ('11111111-1111-1111-1111-111111111111', 'NexaTech', 'nexatech', 'Fictional Indian consumer technology company — demo workspace for BrandVault AI.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, email, full_name)
VALUES ('22222222-2222-2222-2222-222222222222', 'demo@nexatech.example', 'Demo Reviewer')
ON CONFLICT (id) DO NOTHING;

INSERT INTO workspace_members (id, workspace_id, user_id, role)
VALUES ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'ADMIN')
ON CONFLICT (id) DO NOTHING;

INSERT INTO brand_guidelines (id, workspace_id, rule_code, title, description, category, severity, examples, active, version)
VALUES 
  ('00000000-0000-0000-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'RULE-TONE-001', 'Professional and helpful voice', 'Content must be clear, helpful and professional. Avoid exaggerated statements, aggressive urgency and unnecessary slang.', 'TONE', 'MEDIUM', '{"good": ["Our solution helps teams ship faster."], "bad": ["This is the worlds best tool, buy now!"]}'::jsonb, true, 1),
  ('00000000-0000-0000-0001-000000000002', '11111111-1111-1111-1111-111111111111', 'RULE-TONE-002', 'Avoid unsupported superlatives', 'Statements such as "worlds best", "number one" or "unmatched" must have approved evidence.', 'TONE', 'HIGH', '{"good": ["Rated 4.5 stars by independent reviewers."], "bad": ["The worlds best smartphone for everyone."]}'::jsonb, true, 1),
  ('00000000-0000-0000-0001-000000000003', '11111111-1111-1111-1111-111111111111', 'RULE-TERM-001', 'Preferred terminology', 'Use "smart assistant" instead of "AI robot buddy".', 'TERMINOLOGY', 'MEDIUM', '{"good": ["The smart assistant helps you set reminders."], "bad": ["Our AI robot buddy is ready to help."]}'::jsonb, true, 1),
  ('00000000-0000-0000-0001-000000000004', '11111111-1111-1111-1111-111111111111', 'RULE-CLAIM-001', 'Product specifications require evidence', 'All product performance claims must be consistent with active approved specifications.', 'CLAIMS', 'HIGH', '{"good": ["Up to 24 hours of battery life."], "bad": ["48 hours of battery life."]}'::jsonb, true, 1),
  ('00000000-0000-0000-0001-000000000005', '11111111-1111-1111-1111-111111111111', 'RULE-CLAIM-002', 'Waterproof claims require explicit approval', 'Do not communicate waterproofing or water-resistance ratings without an approved source.', 'CLAIMS', 'HIGH', '{"good": [], "bad": ["Completely waterproof."]}'::jsonb, true, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO approved_facts (id, workspace_id, fact_code, title, fact_text, entity_name, source_name, source_excerpt, verification_status)
VALUES
  ('00000000-0000-0000-0002-000000000001', '11111111-1111-1111-1111-111111111111', 'FACT-001', 'Battery life', 'NexaTech Nova offers up to 24 hours of battery life under specified test conditions.', 'NexaTech Nova', 'Nova Product Specification', 'Up to 24 hours of battery life under specified test conditions.', 'APPROVED'),
  ('00000000-0000-0000-0002-000000000002', '11111111-1111-1111-1111-111111111111', 'FACT-002', 'Device weight', 'NexaTech Nova weighs 185 grams.', 'NexaTech Nova', 'Nova Product Specification', '185 grams.', 'APPROVED'),
  ('00000000-0000-0000-0002-000000000003', '11111111-1111-1111-1111-111111111111', 'FACT-003', 'Materials', 'The NexaTech Nova chassis uses recycled aluminium.', 'NexaTech Nova', 'Sustainability Fact Sheet', 'Recycled aluminium chassis.', 'APPROVED'),
  ('00000000-0000-0000-0002-000000000004', '11111111-1111-1111-1111-111111111111', 'FACT-004', 'Waterproofing', 'No approved waterproof rating is currently documented.', 'NexaTech Nova', 'Product Claims Register', 'No waterproof rating documented.', 'APPROVED'),
  ('00000000-0000-0000-0002-000000000005', '11111111-1111-1111-1111-111111111111', 'FACT-005', 'Launch date', 'The NexaTech Nova launch is scheduled for 15 December 2026.', 'NexaTech Nova', 'NexaTech Launch Plan', 'Launch scheduled for 15 December 2026.', 'APPROVED')
ON CONFLICT (id) DO NOTHING;

