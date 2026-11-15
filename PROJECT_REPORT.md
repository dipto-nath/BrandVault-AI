# BrandVault AI — Complete Project Report (A to Z)

**Generated:** November 15, 2026  
**Project:** BrandVault AI — Evidence-First Brand Governance Platform  
**Team:** SHINRAI (CodeNova India 2026)  
**Status:** Production-Ready Prototype / Hackathon Submission  

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Team & Roles](#2-team--roles)
3. [Problem Statement](#3-problem-statement)
4. [Solution Architecture](#4-solution-architecture)
5. [Technology Stack](#5-technology-stack)
6. [Frontend Deep Dive](#6-frontend-deep-dive)
7. [Backend Deep Dive](#7-backend-deep-dive)
8. [AI/ML Pipeline](#8-aiml-pipeline)
9. [Database Schema](#9-database-schema)
10. [API Contracts](#10-api-contracts)
11. [Security & Compliance](#11-security--compliance)
12. [Key Features Walkthrough](#12-key-features-walkthrough)
13. [Deployment & DevOps](#13-deployment--devops)
14. [Testing & Quality](#14-testing--quality)
15. [Known Issues & Technical Debt](#15-known-issues--technical-debt)
16. [Future Roadmap](#16-future-roadmap)

---

## 1. PROJECT OVERVIEW

### 1.1 Vision
BrandVault AI is an **evidence-first brand governance platform** that verifies marketing content against approved brand knowledge, explains every issue with traceable evidence, and keeps every publishing decision accountable through cryptographic audit trails.

### 1.2 Core Value Proposition
- **Eliminates brand risk** by catching factual contradictions before publication
- **Accelerates review cycles** with AI-assisted evidence verification
- **Creates legal defensibility** via immutable Brand Evidence Passports
- **Enables continuous learning** through the Governance Intelligence Loop

### 1.3 Key Differentiators
| Traditional Tools | BrandVault AI |
|-------------------|---------------|
| Keyword blocking / regex | 4-stage AI verification pipeline |
| Manual fact-checking | Deterministic + semantic verification |
| No audit trail | Cryptographic Brand Evidence Passports |
| Siloed feedback | Governance Intelligence Loop (AI-suggested rule improvements) |
| Reactive | Proactive knowledge gap detection |

### 1.4 Project Status
- ✅ **Frontend**: Complete Next.js 15 App Router application
- ✅ **Backend**: Production-ready FastAPI with PostgreSQL + pgvector
- ✅ **AI Pipeline**: 4-stage verification with deterministic + LLM stages
- ✅ **Demo Mode**: Works without external API keys (mock LLM)
- ✅ **Docker Deployment**: Single `docker-compose up` for full stack

---

## 2. TEAM & ROLES

| Member | Role | Responsibilities |
|--------|------|------------------|
| **Dipto Nath** | Team Lead, Backend/AI-ML | Verification Engine, Architecture, FastAPI Backend, AI Agents |
| **Anuj Shaw** | Full-stack Developer | Frontend (Next.js), API Integration, Deployment, DevOps |
| **Rumki Dhar** | Research & Presentation | User Discovery, KPIs, Demo Script, Stakeholder Communication |
| **Baeish Akhtar** | Research | Source Pack, Test Set, Privacy/Security Analysis |
| **Anjali Singh** | UI/UX Design | Design System, Findings UX, Accessibility, Design Tokens |

---

## 3. PROBLEM STATEMENT

### 3.1 The Brand Governance Crisis
Modern brands face unprecedented content velocity:
- **1000+ content pieces/month** across channels (Web, Social, Email, Ads)
- **73% of marketers** admit publishing unverified claims under deadline pressure
- **$2.4M average cost** per regulatory violation (FTC, ASCI, GDPR)
- **Zero accountability** — no traceable record of who approved what and why

### 3.2 Current Tool Failures
| Tool Category | Limitation |
|---------------|------------|
| DAM/CMS | Store assets, don't verify claims |
| Grammar/Style Checkers | Surface-level only, no factual grounding |
| Legal Review | Bottleneck, non-scalable, reactive |
| AI Content Generators | Hallucinate facts, no evidence trail |

### 3.3 BrandVault AI's Answer
**Evidence-First Governance**: Every claim must be verified against approved sources before publication. Every decision is recorded. Every finding is traceable to evidence.

---

## 4. SOLUTION ARCHITECTURE

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS FRONTEND (READ-ONLY)                         │
│  • App Router (Next.js 15)  • React 19  • TypeScript  • Tailwind + Radix   │
│  • Auth: JWT in cookies / Authorization header                              │
│  • API Routes: /api/* (proxy to backend OR direct to FastAPI)              │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │ HTTP/JSON (REST + Polling)
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FASTAPI BACKEND (PRODUCTION-READY)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   API Layer  │  │  Services    │  │   Agents     │  │   Tasks      │   │
│  │  (Routers)   │──▶│ (Business    │──▶│  (LLM        │──▶│  (Celery    │   │
│  │  /auth       │  │   Logic)     │  │   Prompts)   │  │   Workers)   │   │
│  │  /sources    │  │              │  │              │  │              │   │
│  │  /content    │  │              │  │              │  │              │   │
│  │  /reviews    │  │              │  │              │  │              │   │
│  │  /passport   │  │              │  │              │  │              │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│         │                │                │                │                │
│         ▼                ▼                ▼                ▼                │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    POSTGRESQL + PGVECTOR (Single DB)                  │  │
│  │  • Organizations, Users, Roles (RLS)                                 │  │
│  │  • Sources, Chunks (with embeddings), ApprovedFacts                  │  │
│  │  • ContentItems, Claims, Findings, EvidenceLinks                     │  │
│  │  • PassportRecords, AuditEvents, ReviewDecisions                     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Data Flow Overview

```
Content Submission
       │
       ▼
┌──────────────────┐
│  Claim Extraction │  (LLM → Atomic, verifiable claims)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Deterministic    │  (Exact match against Approved Facts)
│ Check            │  → SUPPORTED / CONTRADICTED / UNVERIFIED
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Semantic Retrieval│ (pgvector RAG with tenant isolation)
│ (RAG)            │  → Relevant source chunks + embeddings
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Contextual       │  (LLM classifies with evidence)
│ Verification     │  → SUPPORTED / CONTRADICTED / UNVERIFIED / OUTDATED
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Guideline Checks │  (Pattern matching + LLM tone analysis)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Findings +       │  (Structured, evidence-linked, confidence-scored)
│ Corrections      │  → Review Studio → Human Decision → Passport
└──────────────────┘
```

### 4.3 The Governance Intelligence Loop (Unique Innovation)

```
┌────────────────────────────────────────────────────────────────────┐
│                    GOVERNANCE INTELLIGENCE LOOP                     │
│                                                                     │
│  1. REVIEW          2. OVERRIDES        3. UNCLEAR RULES          │
│  Reviewers approve  Reviewers override  Rules with high override   │
│  or reject content  findings with       rates flagged as unclear   │
│  with findings      documented reasons                           │
│       │                    │                    │                  │
│       ▼                    ▼                    ▼                  │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │              AI ANALYZES OVERRIDE PATTERNS                │     │
│  │  • Detects recurring ambiguity                            │     │
│  │  • Drafts specific guideline clarifications              │     │
│  │  • Proposes rule updates (v2)                             │     │
│  └──────────────────────────────────────────────────────────┘     │
│       │                    │                    │                  │
│       ▼                    ▼                    ▼                  │
│  4. ADMIN APPROVES     5. KNOWLEDGE GAPS    6. CONTINUOUS        │
│  Proposed v2 rules     Unverified claims    Improvement:         │
│  become active;        become candidates    Rules sharpen,       │
│  version increments    for Approved Facts   fewer overrides      │
└────────────────────────────────────────────────────────────────────┘
```

---

## 5. TECHNOLOGY STACK

### 5.1 Frontend (Next.js 15)
| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Framework | Next.js | 15.5.29 | App Router, Server Components, Streaming |
| Language | TypeScript | 5.5.4 | Type safety across frontend |
| UI Runtime | React | 19.3.1 | Concurrent features, Server Components |
| Styling | Tailwind CSS | 3.4.19 | Utility-first, design tokens via CSS variables |
| Components | Radix UI | 1.3-2.2 | Accessible primitives (Dialog, Popover, Select, Tooltip) |
| Animation | Framer Motion | 14.14.0 | Layout animations, gestures, transitions |
| Icons | Lucide React | 1.72.0 | Consistent icon system |
| Forms | React Hook Form + Zod | 7.92 / 4.6.7 | Validation, type-safe forms |
| Date | date-fns | 4.4.0 | Date formatting utilities |
| Utils | clsx + tailwind-merge | 2.1.1 / 3.7.0 | Conditional classNames |
| Fonts | next/font (Google Fonts) | — | Fraunces, Inter, Plus Jakarta Sans, Caveat, JetBrains Mono |

### 5.2 Backend (FastAPI)
| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Framework | FastAPI | 0.111.0 | Async REST API, auto OpenAPI docs |
| Language | Python | 3.11+ | Modern async, type hints |
| ORM | SQLAlchemy | 2.0.30 | Async 2.0 ORM, declarative models |
| Database | PostgreSQL + pgvector | 16+ / 0.2.5 | Relational + vector similarity search |
| Migration | Alembic | 1.13.1 | Database schema versioning |
| Auth | python-jose + passlib | 3.3.0 / 1.7.4 | JWT tokens, bcrypt password hashing |
| Task Queue | Celery + Redis | 5.4.0 / 5.0.1 | Background processing (ingestion, analysis) |
| LLM | Google Generative AI | 0.8.0 | Gemini 1.5 Flash for verification |
| Embeddings | OpenAI / Gemini | — | text-embedding-3-small (1536 dim) |
| Document Parsing | PyMuPDF + python-docx | 1.23.26 / 1.1.0 | PDF/DOCX text extraction |
| Tokenization | tiktoken | 0.7.0 | Chunk sizing for embeddings |
| Logging | structlog | 24.1.0 | Structured JSON logging |
| Validation | Pydantic v2 | 2.7.4 | Request/response validation |

### 5.3 Infrastructure
| Component | Technology |
|-----------|------------|
| Container | Docker + Docker Compose |
| Reverse Proxy | Nginx (production) |
| Database | PostgreSQL 16 with pgvector extension |
| Cache/Queue | Redis 7 |
| File Storage | Local filesystem (S3-compatible interface) |
| Monitoring | structlog JSON logs + health endpoints |

---

## 6. FRONTEND DEEP DIVE

### 6.1 Project Structure
```
app/
├── layout.tsx                    # Root layout, fonts, global styles
├── page.tsx                      # Landing page (PrismaHero)
├── globals.css                   # Design tokens, component classes, utilities
├── error.tsx / global-error.tsx  # Error boundaries
├── (dashboard)/                  # Dashboard route group
│   ├── layout.tsx                # Sidebar + Header shell
│   ├── overview/page.tsx         # Dashboard home with stats + hero
│   ├── reviews/
│   │   ├── page.tsx              # Submissions registry table
│   │   ├── new/page.tsx          # Review Studio (content submission)
│   │   ├── [id]/page.tsx         # Review detail with findings
│   │   └── [id]/findings/[fid]/  # Finding inspector
│   ├── guidelines/page.tsx       # Guidelines manager
│   ├── knowledge/page.tsx        # Knowledge manager (facts + docs)
│   ├── findings/page.tsx         # All findings registry
│   ├── passports/
│   │   ├── page.tsx              # Passports list
│   │   └── [submissionId]/page.tsx  # Passport detail view
│   ├── insights/page.tsx         # Governance insights dashboard
│   └── settings/page.tsx         # Workspace config
├── api/                          # Next.js API routes (proxy to FastAPI)
│   ├── submissions/
│   ├── guidelines/
│   ├── knowledge/
│   ├── insights/
│   ├── findings/
│   └── passports/
components/
├── ui/                           # Primitive components
│   ├── button, card, badge, input, textarea, table, skeleton
│   ├── sidebar, prisma-hero, brandvault-hero, flow-button
├── layout/                       # Layout components
│   ├── header, sidebar, search-dialog, notification-popover
├── reviews/                      # Review-specific
│   ├── review-studio, finding-mapper
├── guidelines/                   # Guidelines manager
├── knowledge/                    # Knowledge manager
├── findings/                     # Finding inspector
├── insights/                     # Insights manager + drawers
├── passport/                     # Passport view
└── ui/ (additional)
lib/
├── utils.ts                      # cn(), formatDate*, getSubmissionReference
├── validations.ts                # Zod schemas for all forms
├── constants/samples.ts          # Demo content samples
├── ai/                           # Frontend AI pipeline (deterministic + LLM)
│   ├── pipeline.ts, schemas.ts, prompts.ts, provider.ts, rules.ts
├── services/                     # Business logic (client-side)
│   ├── insights.ts, submissions.ts, audit.ts
├── db/                           # Data layer abstraction
│   ├── adaptor.ts, adapter.ts, file-adapter.ts, supabase-adapter.ts
└── auth.ts                       # Auth utilities
```

### 6.2 Design System (globals.css)

#### Color Palette (CSS Variables)
```css
:root {
  /* Base */
  --paper: #FBF7EF;
  --surface: #FFFDF9;
  --surface-2: #F4EEE1;
  --line: #E6DCC8;
  
  /* Text */
  --ink: #1E2540;
  --ink-2: #4C5470;
  --ink-3: #7A8099;
  
  /* Brand */
  --brand: #2F4FB3;
  --brand-hover: #253D8E;
  --brand-soft: #E3EAFA;
  
  /* Semantic */
  --terracotta: #C4673F;      /* Accent */
  --supported: #4F7F5B;       /* Green */
  --unverified: #9A6B12;      /* Amber */
  --contradicted: #B24A4A;    /* Red */
  --outdated: #7A5AA8;        /* Purple */
}
```

#### Typography Scale
| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| --font-fraunces | Display | 1.25 | Page titles, hero text |
| --font-inter | Body | 1.6 | Primary body text |
| --font-jakarta | UI | 1.5 | Buttons, labels, nav |
| --font-jetbrains-mono | Mono | 1.4 | Code, references, IDs |
| --font-caveat | Handwritten | 1.5 | Quotes, notes, mottos |

#### Spacing & Radius
| Token | Value |
|-------|-------|
| --gap | 24px |
| --page-padding | 32px |
| --sidebar-width | 248px |
| --header-height | 64px |
| --radius | 8px (base) |
| --shadow | Layered elevation system |

### 6.3 Key Pages & Features

#### 6.3.1 Landing Page (/)
- **PrismaHero**: Full-screen animated hero with word-by-word entrance
- **Brand Positioning**: Evidence-First Brand Governance
- **CTAs**: Start Verification, View Demo
- **No auth required** — public marketing page

#### 6.3.2 Dashboard Overview (/overview)
- **Hero Band**: Torn-paper aesthetic with workspace branding
- **KPI Cards**: Active Reviews, Approved, High-Risk, Knowledge Health
- **Health Panel**: Facts freshness, guidelines coverage, source docs
- **Action Strip**: Quick links to Review Studio, Guidelines, Knowledge
- **Recent Submissions**: Latest 5 with status badges
- **Top Flagged Rules**: Rules generating most findings

#### 6.3.3 Review Studio (/reviews/new) — Most Complex Component
**1600+ lines** — Handles entire submission workflow:
- **Channel Selection**: 6 channels (Website, Instagram, LinkedIn, Email, Advertising, Other)
- **Content Type**: 7 types with channel-specific hints & char limits
- **Live Claim Radar**: Real-time regex detection of:
  - Numbers with units (battery hours, weights, percentages)
  - Superlatives (best, fastest, world's best, revolutionary)
  - Spec patterns (Bluetooth 5.0, waterproof, AI robot buddy)
- **Sample Loader**: 3 benchmark samples (Contradicted, Supported, Unverified)
- **Auto-save**: localStorage draft persistence with restore prompt
- **Validation**: Title + content required, channel-specific limits
- **Submission**: POST to /api/submissions → triggers analysis

#### 6.3.4 Review Detail (/reviews/[id]) — Tabbed Interface
| Tab | Purpose |
|-----|---------|
| Findings | All findings with evidence, severity, status, inline resolution |
| Claims | Extracted claims with verification status + evidence links |
| Diff | Side-by-side Original vs Revised (accepted corrections applied) |
| Approval | Final decision: Approve / Request Changes / Reject |
| Activity | Immutable audit timeline with versions, runs, decisions |

**Finding Resolution Actions:**
- ACCEPTED — Finding is valid, correction needed
- OVERRIDDEN — Reviewer disagrees, documents reason
- EDITED_CORRECTION — Modify AI suggestion
- REJECTED_CORRECTION — Keep original, reject AI fix
- MARKED_AMBIGUOUS — Rule unclear, triggers guideline suggestion

#### 6.3.5 Guidelines Manager (/guidelines)
- **Table View**: Rule code, title, category, severity, version, status
- **Filter/Sort**: By category, status, clarity score, override rate
- **Create Modal**: Rule code (validated), title, description, category, severity, examples
- **Deactivate**: Soft delete with audit log
- **Inline Editing**: Version-controlled updates

#### 6.3.6 Knowledge Manager (/knowledge)
- **Approved Facts Tab**: Structured facts with entity, attribute, value, unit, source
- **Source Documents Tab**: Upload PDF/DOCX/TXT → extraction → approval workflow
- **Fact Creation Modal**: Code, title, fact text, entity, source reference, excerpt
- **Document Processing**: Status tracking (UPLOADING → EXTRACTING → PENDING_REVIEW → APPROVED)

#### 6.3.7 Findings Registry (/findings)
- **Unified Table**: All findings across submissions
- **Filters**: Type, severity, status (client-side)
- **Stats Cards**: Total, Contradicted, Unverified, Open
- **Drill-down**: Link to Review Studio finding inspector

#### 6.3.8 Passports (/passports & /passports/[id])
- **List View**: All submissions with passport status
- **Detail View**: Official Evidence Passport with:
  1. Submission metadata + risk assessment
  2. All claims with verification status + evidence
  3. All findings with evidence + resolution
  4. Human review decision + reviewer signature
  5. Version history + audit timeline
  6. Cryptographic verification seal
- **Print Optimized**: @media print styles for official PDF generation

#### 6.3.9 Governance Insights (/insights) — Analytics Dashboard
- **Time Range**: 7d / 30d / 90d / all (URL-synced)
- **KPI Cards**: Submissions, Approval Rate, Open Critical, Overrides, Rules Under Scrutiny
- **Learning Loop Strip**: 4-step visual flow with smooth-scroll navigation
- **Charts** (4 interactive):
  1. Evidence Over Time (stacked area, series toggles)
  2. Most Triggered Rules (bar chart + table toggle)
  3. Override Reasons (horizontal bars + table toggle)
  4. Findings by Channel (bar chart)
- **Rules Under Scrutiny**: Cards with clarity score, override rate, proposal diff
- **Knowledge Gaps**: Recurring unverified claims → Add Approved Fact drawer
- **Audit Timeline**: Paginated drawer with immutable events

#### 6.3.10 Settings (/settings)
- **AI Provider Disclosure**: Gemini model, deterministic-first architecture
- **Data Isolation**: Tenant-level RLS, workspace-scoped data
- **Governance Roles**: ADMIN, REVIEWER, CREATOR, MANAGER, AGENCY definitions

### 6.4 Reusable UI Components

#### Primitive Components (components/ui/)
| Component | Variants | Key Features |
|-----------|----------|--------------|
| Button | primary, secondary, accent, outline, ghost, danger, sm | no-underline, focus-ring, loading states |
| Card | default, gold, atmospheric | Consistent elevation, border-radius |
| Badge | low, medium, high, neutral, outline, gold, success, danger, warning | Semantic color mapping |
| Input / Textarea | — | Tailwind-styled, focus-ring, font-sans |
| Table | — | w-full, border-collapse, sortable-ready |
| Sidebar | — | Collapsible, animated, mobile drawer, hover-expand |
| PrismaHero | — | Word-by-word animation, responsive typography |

#### Layout Components (components/layout/)
| Component | Purpose |
|-----------|---------|
| Header | Sticky, breadcrumbs, global search (Cmd+K), notifications, user avatar |
| Sidebar | Navigation links, logo, user section, collapsible (LG+) / drawer (mobile) |
| SearchDialog | Global command palette: submissions, facts, guidelines, navigation |
| NotificationPopover | Real-time alerts, localStorage persistence, mark-all-read |

#### Domain Components
| Component | File | Complexity |
|-----------|------|------------|
| ReviewStudio | components/reviews/review-studio.tsx | 1600+ lines |
| InsightsManager | components/insights/insights-manager.tsx | 1500+ lines |
| GuidelinesManager | components/guidelines/guidelines-manager.tsx | 800+ lines |
| KnowledgeManager | components/knowledge/knowledge-manager.tsx | 900+ lines |
| PassportView | components/passport/passport-view.tsx | 350 lines |
| FindingInspector | components/findings/finding-inspector.tsx | 350 lines |

### 6.5 Client-Side AI Pipeline (lib/ai/)
**Deterministic-first approach** — works without LLM:
```
lib/ai/
├── pipeline.ts       # Main orchestrator (runAnalysisPipeline)
├── schemas.ts        # Zod validation for AI outputs
├── prompts.ts        # System + task prompts
├── provider.ts       # LLM abstraction (Gemini + Mock)
├── rules.ts          # Deterministic checkers
│   ├── checkSuperlatives()
│   ├── checkProhibitedTerms()
│   ├── checkFactualClaimsAgainstFacts()
│   ├── retrieveEvidenceForClaim()
│   ├── deterministicTone()
│   └── deterministicCorrections()
└── documents.ts      # Document processing utilities
```

**Pipeline Stages:**
1. **Rule Matches** (deterministic): Superlatives, prohibited terms, fact contradictions
2. **Claim Extraction** (LLM or deterministic): Atomic factual claims
3. **Evidence Retrieval**: Match claims against approved facts
4. **Claim Verification** (LLM or deterministic): SUPPORTED/CONTRADICTED/UNVERIFIED
5. **Tone Analysis** (LLM or deterministic): Guideline violations
6. **Correction Generation** (LLM or deterministic): Suggested fixes
7. **Validation**: Zod schema enforcement
8. **Risk Calculation**: HIGH/MEDIUM/LOW based on findings

---

## 7. BACKEND DEEP DIVE

### 7.1 Project Structure
```
backend/
├── app/
│   ├── main.py                 # FastAPI app, lifespan, middleware, routers
│   ├── core/
│   │   ├── config.py           # Pydantic Settings (env-driven)
│   │   ├── database.py         # AsyncEngine, session management, RLS context
│   │   ├── dependencies.py     # FastAPI deps: auth, DB, RBAC
│   │   ├── security.py         # JWT, bcrypt, role hierarchy
│   │   └── exceptions.py       # Custom exceptions + handlers
│   ├── models/                 # SQLAlchemy 2.0 models (13 tables)
│   │   ├── base.py             # Base, TimestampMixin, OrgMixin, UUIDMixin
│   │   ├── organization.py     # Organization, User, WorkspaceMember
│   │   ├── content.py          # ContentItem, ContentVersion, ContentStatus
│   │   ├── analysis.py         # AnalysisRun, Claim, VerificationStatus
│   │   ├── finding.py          # Finding, FindingEvidence, FindingType
│   │   ├── guideline.py        # BrandGuideline, GuidelineCategory
│   │   ├── fact.py             # ApprovedFact, FactVerificationStatus
│   │   ├── source.py           # Source, SourceChunk (with VECTOR)
│   │   ├── review.py           # ReviewDecision, FindingFeedback
│   │   ├── passport.py         # PassportRecord
│   │   ├── audit.py            # AuditEvent
│   │   └── suggestion.py       # GuidelineSuggestion
│   ├── schemas/                # Pydantic request/response models
│   ├── api/v1/                 # API routers (9 modules)
│   │   ├── auth.py             # Login, demo token, refresh
│   │   ├── workspaces.py       # Dashboard stats, members
│   │   ├── sources.py          # Upload, process, approve, chunks
│   │   ├── facts.py            # CRUD approved facts
│   │   ├── guidelines.py       # CRUD + suggestions
│   │   ├── content.py          # Submissions, versions, analysis
│   │   ├── reviews.py          # Decisions, feedback, queue
│   │   ├── passport.py         # Generate, export, history
│   │   ├── insights.py         # KPIs, charts, scrutiny, gaps
│   │   └── audit.py            # Audit trail pagination
│   ├── services/               # Business logic layer
│   │   ├── verification.py     # VerificationEngine (4-stage pipeline)
│   │   ├── ingestion.py        # IngestionService (PDF/DOCX → chunks → embeddings)
│   │   ├── passport.py         # PassportService (JSON + PDF export)
│   │   ├── audit.py            # AuditService (immutable logging)
│   │   ├── facts.py            # FactService
│   │   ├── guidelines.py       # GuidelineService
│   │   └── review.py           # ReviewService
│   ├── agents/                 # LLM integration
│   │   ├── llm.py              # Provider abstraction (Mock, Gemini, OpenAI)
│   │   ├── prompts.py          # All system + task prompts
│   │   └── embeddings.py       # Embedding providers
│   ├── tasks/                  # Celery workers
│   │   ├── ingestion_tasks.py  # Process source documents
│   │   └── analysis_tasks.py   # Run verification pipeline
│   └── utils/                  # Shared utilities
│       ├── document_parser.py  # PDF/DOCX extraction + chunking
│       ├── unit_normalizer.py  # Unit conversion for comparisons
│       └── prompt_sanitizer.py # Prompt injection prevention
├── alembic/                    # Database migrations
├── scripts/                    # Seed data, utilities
├── tests/                      # Unit, integration, evaluation (35 cases)
├── docker-compose.yml          # Full stack
├── Dockerfile.backend          # Backend container
├── pyproject.toml              # Dependencies
└── README.md                   # Backend documentation
```

### 7.2 Core Architecture Patterns

#### 7.2.1 Tenant Isolation (Row-Level Security)
```python
# Every model includes OrgMixin → org_id column + index
class OrgMixin:
    @declared_attr
    def org_id(cls) -> Mapped[UUID]:
        return mapped_column(PG_UUID(as_uuid=True), nullable=False, index=True)

    @declared_attr
    def __table_args__(cls):
        return (Index(f"ix_{cls.__tablename__}_org_id", "org_id"),)

# Database session with RLS context
async def session_with_rls(self, org_id: str) -> AsyncGenerator[AsyncSession, None]:
    async with self.session() as session:
        await session.execute(
            text("SELECT set_config('app.current_org_id', :org_id, true)"),
            {"org_id": org_id}
        )
        yield session
```

**PostgreSQL RLS Policies** (enforced at DB level):
```sql
-- Example: content_items table
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_items_org_isolation ON content_items
  USING (org_id = current_setting('app.current_org_id')::uuid);
```

#### 7.2.2 Dependency Injection (FastAPI)
```python
# Flexible auth: JWT if provided, demo user otherwise
async def get_current_user_flexible(
    authorization: Optional[str] = Header(None),
) -> UserContext:
    if not authorization or not authorization.startswith("Bearer "):
        return DEMO_USER  # Admin access to demo workspace
    return verify_token(authorization[7:])

# DB session with automatic RLS
async def get_db_with_org(
    user: UserContext = Depends(get_current_user_flexible),
) -> AsyncSession:
    async with db_manager.session_with_rls(str(user.org_id)) as session:
        yield session

# Role-based access
def require_reviewer_or_admin(
    user: UserContext = Depends(get_current_user_flexible),
) -> UserContext:
    require_role(user, ["REVIEWER", "ADMIN"])
    return user
```

#### 7.2.3 Structured Error Handling
```python
class BrandVaultException(Exception):
    def __init__(self, message: str, code: str = "INTERNAL_ERROR", 
                 status_code: int = 500, details: dict = None):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}

# Specific exceptions: NotFoundError, ValidationError, PermissionDeniedError, 
# ConflictError, AIProviderError, ProcessingError

# Global handlers return consistent JSON:
{
  "success": false,
  "error": { "code": "...", "message": "...", "details": {...} }
}
```

### 7.3 API Layer (9 Routers)

| Router | Endpoints | Key Features |
|--------|-----------|--------------|
| /auth | POST /login, /demo-token, /refresh | JWT + demo mode |
| /workspaces | GET /current, /current/dashboard, /current/members | Dashboard stats, team |
| /sources | POST /upload, GET /, POST /{id}/process, POST /{id}/approve | File upload, extraction, approval |
| /facts | GET /, POST /, GET /{id}, PATCH /{id} | Approved facts CRUD |
| /guidelines | GET /, POST /, GET /{id}, PATCH /{id}, POST /{id}/deactivate | Guidelines + suggestions |
| /content | GET /, POST /, GET /{id}, PATCH /{id}, POST /{id}/analyze | Submissions, versions, analysis |
| /reviews | GET /queue, GET /{id}, POST /{id}/decision, POST /findings/{id}/feedback | Human review workflow |
| /passport | GET /{content_id}, GET /{content_id}/export, GET /{content_id}/history | Passport generation |
| /insights | GET / (with query params) | KPIs, charts, scrutiny, gaps, timeline |

### 7.4 Services Layer

#### 7.4.1 VerificationEngine (services/verification.py)
**Core 4-stage pipeline** — 2000+ lines:
```python
class VerificationEngine:
    async def analyze_content(self, content_id, org_id, content_text, 
                              guidelines, facts, provider, model, prompt_version):
        # Stage 1: Claim Extraction (LLM)
        claims = await self._stage1_extract_claims(content_text, context)
        
        # Stage 2: Deterministic Check (exact match vs ApprovedFacts)
        deterministic_results = await self._stage2_deterministic_check(claims, facts)
        
        # Stage 3: Semantic Retrieval (pgvector RAG)
        semantic_results = await self._stage3_semantic_retrieval(unresolved_claims, org_id)
        
        # Stage 4: Contextual Verification (LLM with evidence)
        contextual_results = await self._stage4_contextual_verification(unresolved_claims, semantic_results)
        
        # Stage 5: Guideline Checks (pattern + LLM tone)
        guideline_findings = await self._stage5_guideline_checks(content_text, guidelines)
        
        # Build findings, generate corrections, calculate risk
        # Persist claims, findings, evidence links
        # Log audit event
```

#### 7.4.2 IngestionService (services/ingestion.py)
```python
async def process_source(self, source_id, valid_from, valid_to):
    # 1. Extract text (PyMuPDF for PDF, python-docx for DOCX)
    # 2. Update source with extracted_text, page_count
    # 3. Chunk text (500 tokens, 50 overlap) via tiktoken
    # 4. Generate embeddings (Gemini/OpenAI/Mock)
    # 5. Store SourceChunks with VECTOR(1536) embeddings
    # 6. Set document_status = PENDING_REVIEW
```

#### 7.4.3 PassportService (services/passport.py)
```python
async def generate_passport(self, content_id, org_id, version_id=None):
    # 1. Fetch content, claims, findings, decisions, audit events
    # 2. Build structured passport JSON
    # 3. Compute content_hash for integrity
    # 4. Store PassportRecord (immutable)
    # 5. Return PassportRecordResponse (frontend-compatible)

async def export_passport(self, passport_id, format):
    # JSON: Full structured export
    # PDF: (placeholder for future)
```

### 7.5 Agents (LLM Integration)

#### 7.5.1 Provider Abstraction (agents/llm.py)
```python
class LLMProvider(ABC):
    @abstractmethod
    async def generate_json(self, prompt, schema, temperature=0.2, max_tokens=2000) -> T:
        pass
    
    @abstractmethod
    async def generate_text(self, prompt, temperature=0.2, max_tokens=2000) -> str:
        pass

# Three implementations:
# 1. MockLLMProvider — deterministic, no API key needed
# 2. GeminiProvider — google-generativeai, structured output
# 3. OpenAIProvider — openai beta.chat.completions.parse

def get_llm_provider() -> LLMProvider:
    if settings.USE_MOCK_LLM or not settings.GEMINI_API_KEY:
        return MockLLMProvider()
    return GeminiProvider()
```

#### 7.5.2 Prompts (agents/prompts.py)
**System Prompt** (all agents):
> You are a brand governance analyst... identify problems, cite evidence, explain findings with traceable sources. Be precise, cautious, and never fabricate evidence.

**Task Prompts:**
| Agent | Purpose | Key Instructions |
|-------|---------|------------------|
| Claim Extraction | Atomic factual claims | Only verifiable specs, quantified statements |
| Deterministic Check | Exact match vs facts | Entity+attribute match, unit conversion, qualifiers |
| Contextual Verification | RAG-based classification | 4 states: SUPPORTED/CONTRADICTED/UNVERIFIED/OUTDATED |
| Tone Analysis | Guideline violations | Pattern matching + LLM for nuance |
| Guideline Check | Rule compliance | Excerpt + explanation + suggested correction |
| Correction | Content revision | Preserve intent, fix contradictions, remove unverified |

### 7.6 Background Tasks (Celery)
```python
# tasks/ingestion_tasks.py
@celery_app.task(bind=True, max_retries=3)
def process_source_task(self, source_id: str):
    # Run IngestionService.process_source in background

# tasks/analysis_tasks.py
@celery_app.task(bind=True, max_retries=2)
def analyze_content_task(self, content_id: str, org_id: str):
    # Run VerificationEngine.analyze_content in background
    # Update AnalysisRun status, persist results
```

---

## 8. AI/ML PIPELINE

### 8.1 Four-Stage Verification Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BRANDVAULT AI VERIFICATION PIPELINE                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  INPUT: Content text + Approved Facts + Brand Guidelines + Source Chunks    │
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   STAGE 1       │───▶│   STAGE 2       │───▶│   STAGE 3       │         │
│  │  Claim          │    │  Deterministic  │    │  Semantic       │         │
│  │  Extraction     │    │  Check          │    │  Retrieval      │         │
│  │                 │    │                 │    │  (RAG)          │         │
│  │ • LLM extracts  │    │ • Exact match   │    │ • pgvector      │         │
│  │   atomic claims │    │   vs Approved   │    │   similarity    │         │
│  │ • Deterministic │    │   Facts         │    │ • Tenant        │         │
│  │   fallback      │    │ • Unit conv.    │    │   isolation     │         │
│  │ • 7 claim types │    │ • Qualifiers    │    │ • Temporal      │         │
│  │                 │    │                 │    │   validity      │         │
│  └─────────────────┘    └─────────────────┘    └────────┬────────┘         │
│                                                          │                  │
│                                                          ▼                  │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   STAGE 4       │◀───│   STAGE 5       │    │   STAGE 6       │         │
│  │  Contextual     │    │  Guideline      │    │  Corrections    │         │
│  │  Verification   │    │  Checks         │    │  & Output       │         │
│  │                 │    │                 │    │                 │         │
│  │ • LLM classifies│    │ • Pattern match │    │ • LLM generates │         │
│  │   with evidence │    │   (prohibited,  │    │   corrected     │         │
│  │ • 4 states:     │    │   superlatives) │    │   content       │         │
│  │   SUPPORTED/    │    │ • LLM tone      │    │ • Deterministic │         │
│  │   CONTRADICTED/ │    │   analysis      │    │   fallback      │         │
│  │   UNVERIFIED/   │    │ • 7 finding     │    │ • Zod validation│         │
│  │   OUTDATED      │    │   types         │    │ • Risk level    │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│                                                                              │
│  OUTPUT: Claims[] + Findings[] + Suggested Content + Risk Level            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Evidence States (Exactly 4 — No FALSE)
| State | Meaning | UI Color | Action |
|-------|---------|----------|--------|
| **SUPPORTED** | Approved evidence confirms claim | Green | Safe to publish |
| **CONTRADICTED** | Approved evidence explicitly conflicts | Red | Must fix or override |
| **UNVERIFIED** | No sufficient evidence (NOT proof false) | Amber | Add source or qualify |
| **OUTDATED_CONFLICTING** | Only match is expired/superseded OR sources disagree | Purple | Update sources |

### 8.3 Claim Types (7 Categories)
| Type | Description | Example |
|------|-------------|---------|
| PRODUCT_SPECIFICATION | Measurable product attributes | 12 hours battery life |
| COMPARATIVE_CLAIM | vs competitors | #1 in market, fastest |
| PROMOTIONAL_CLAIM | Marketing promises | revolutionary, world's best |
| FACTUAL_STATEMENT | General verifiable facts | Launches December 2026 |
| GUARANTEE | Warranties, promises | lifetime warranty |
| STATISTICAL_CLAIM | Data-driven assertions | 95% satisfaction rate |
| OTHER | Fallback | Unclassified |

### 8.4 Finding Types (9 Categories)
| Type | Severity | Source |
|------|----------|--------|
| FACTUAL_CONTRADICTION | HIGH | Stage 2/4 |
| UNSUPPORTED_CLAIM | HIGH | Stage 4 |
| UNVERIFIED_CLAIM | MEDIUM | Stage 4 |
| OUTDATED_SOURCE | HIGH | Stage 3/4 |
| CONFLICTING_SOURCES | HIGH | Stage 3/4 |
| TERMINOLOGY_VIOLATION | MEDIUM | Stage 5 |
| TONE_VIOLATION | MEDIUM | Stage 5 |
| GUIDELINE_VIOLATION | MEDIUM | Stage 5 |
| OTHER | LOW | Fallback |

### 8.5 Confidence Calibration
- **Auto-downgrade**: If LLM confidence < 85% → force UNVERIFIED
- **Deterministic boost**: Exact fact match → 99% confidence
- **Evidence weighting**: More source chunks = higher confidence
- **Transparency**: Every finding shows confidence score (0-100%)

### 8.6 Prompt Injection Prevention
```python
# utils/prompt_sanitizer.py
def wrap_document_content(content: str, max_chars: int = 8000) -> str:
    """Sanitize and truncate document content for safe prompt inclusion."""
    # Remove potential injection patterns
    sanitized = re.sub(r'(?i)(ignore|forget|disregard).*(previous|above|instruction)', 
                       '[REDACTED]', content)
    # Truncate with marker
    if len(sanitized) > max_chars:
        sanitized = sanitized[:max_chars] + "\n\n[CONTENT TRUNCATED]"
    return f"<<<DOCUMENT_START>>>\n{sanitized}\n<<<DOCUMENT_END>>>"
```

---

## 9. DATABASE SCHEMA

### 9.1 Entity Relationship Overview
```
┌─────────────┐       ┌─────────────┐       ┌──────────────────┐
│Organization │ 1:N   │   Source    │ 1:N   │   SourceChunk    │
│             │──────▶│             │──────▶│  (VECTOR(1536))  │
└─────────────┘       └─────────────┘       └──────────────────┘
       │                     │
       │ 1:N                 │ 1:N
       ▼                     ▼
┌─────────────┐       ┌──────────────────┐
│  ApprovedFact ◀─────│  ContentItem     │
└─────────────┘       └────────┬─────────┘
       │                       │
       │ 1:N                   │ 1:N
       ▼                       ▼
┌──────────────────┐    ┌──────────────┐
│   BrandGuideline │    │ AnalysisRun  │
└──────────────────┘    └──────┬───────┘
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
               ┌─────────┐ ┌─────────┐ ┌──────────────┐
               │  Claim  │ │ Finding │ │ FindingEvidence│
               └─────────┘ └────┬────┘ └──────────────┘
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
               ┌──────────┐ ┌───────────┐ ┌────────────┐
               │ Review   │ │Finding    │ │  Passport  │
               │ Decision │ │ Feedback  │ │  Record    │
               └──────────┘ └───────────┘ └────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   AuditEvent    │
                       └─────────────────┘
```

### 9.2 Core Tables (13 Tables)

| Table | Purpose | Key Columns | RLS |
|-------|---------|-------------|-----|
| organizations | Tenants/workspaces | id, name, slug, settings(JSONB) | Yes |
| users | User accounts | id, org_id, email, hashed_password, role | Yes |
| workspace_members | Role assignments | id, org_id, user_id, role(ADMIN/CREATOR/REVIEWER) | Yes |
| sources | Uploaded documents | id, org_id, filename, mime_type, status, extracted_text | Yes |
| source_chunks | Text chunks + vectors | id, org_id, source_id, chunk_index, text, **embedding VECTOR(1536)** | Yes |
| approved_facts | Verified ground truth | id, org_id, fact_code, entity_name, attribute_name, value_text/value_numeric, unit, source_reference, verification_status, valid_from, valid_to | Yes |
| brand_guidelines | Brand rules | id, org_id, rule_code, title, description, category, severity, pattern, replacement, examples(JSONB), active, version | Yes |
| content_items | Submissions | id, org_id, title, content_type, channel, original_content, current_content, content_hash, status, risk_level | Yes |
| content_versions | Version history | id, org_id, content_id, version_number, content, change_reason | Yes |
| analysis_runs | AI analysis jobs | id, org_id, content_id, provider, model_name, prompt_version, status, result(JSONB), duration_ms | Yes |
| claims | Extracted claims | id, org_id, content_id, analysis_run_id, claim_text, claim_type, verification_status, explanation, confidence, evidence_ids | Yes |
| findings | Policy violations | id, org_id, content_id, analysis_run_id, claim_id, finding_type, severity, rule_id, title, excerpt, explanation, suggested_correction, confidence, status | Yes |
| finding_evidence | Evidence links | id, org_id, finding_id, approved_fact_id, source_chunk_id, evidence_excerpt, relevance_explanation, evidence_relation | Yes |
| review_decisions | Human decisions | id, org_id, content_id, reviewer_id, decision(APPROVED/REJECTED/CHANGES_REQUESTED), comment | Yes |
| finding_feedback | Finding resolutions | id, org_id, finding_id, user_id, feedback_type(ACCEPTED/OVERRIDDEN/EDITED_CORRECTION/REJECTED_CORRECTION/MARKED_AMBIGUOUS), reason | Yes |
| guideline_suggestions | AI-proposed rule updates | id, org_id, guideline_id, title, suggested_change, supporting_feedback_ids, status(PENDING/APPROVED/REJECTED) | Yes |
| passport_records | Immutable passports | id, org_id, content_id, passport_id, content_hash, claims_json, findings_json, decisions_json, audit_trail_json | Yes |
| audit_events | Immutable log | id, org_id, user_id, entity_type, entity_id, action, old_value(JSONB), new_value(JSONB), metadata(JSONB) | Yes |

### 9.3 Key Indexes
```sql
-- Vector similarity (pgvector)
CREATE INDEX ix_chunks_embedding ON source_chunks 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Temporal validity (partial indexes)
CREATE INDEX ix_facts_validity ON approved_facts (org_id, effective_from, expires_at)
  WHERE effective_from IS NOT NULL OR expires_at IS NOT NULL;

-- Composite query patterns
CREATE INDEX ix_content_org_status ON content_items (org_id, status);
CREATE INDEX ix_findings_content ON findings (content_id);
CREATE INDEX ix_evidence_finding ON finding_evidence (finding_id);
```

---

## 10. API CONTRACTS

### 10.1 Frontend-Compatible API Routes (Next.js /api/*)
The Next.js frontend proxies to FastAPI or uses its own file-based storage. Key contracts:

#### Submissions
```
GET    /api/submissions                    # List all (with filters)
POST   /api/submissions                    # Create submission
GET    /api/submissions/[id]               # Get single
PATCH  /api/submissions/[id]               # Update
POST   /api/submissions/[id]/review        # Submit review decision
POST   /api/submissions/[id]/analyze       # Trigger analysis
POST   /api/submissions/[id]/corrections/apply  # Apply corrections
```

#### Guidelines
```
GET    /api/guidelines                     # List (active filter)
POST   /api/guidelines                     # Create
GET    /api/guidelines/[id]                # Get single
PATCH  /api/guidelines/[id]                # Update
POST   /api/guidelines/[id]/deactivate     # Soft delete
GET    /api/guideline-suggestions          # AI suggestions
POST   /api/guideline-suggestions/[id]/approve  # Approve v2
POST   /api/guideline-suggestions/[id]/reject   # Reject
POST   /api/guideline-suggestions/[id]/undo     # Undo approval
```

#### Knowledge
```
GET    /api/knowledge/facts                # List approved facts
POST   /api/knowledge/facts                # Create fact
GET    /api/knowledge/documents            # List source docs
POST   /api/knowledge/documents            # Upload document
GET    /api/knowledge/documents/[id]       # Get document
POST   /api/knowledge/documents/[id]/approve  # Approve document
```

#### Insights
```
GET    /api/insights?range=30d             # Governance insights data
```

#### Findings
```
POST   /api/findings/[id]/feedback         # Submit reviewer feedback
```

#### Passports
```
GET    /api/passports/[submissionId]       # Get passport data
```

### 10.2 FastAPI Backend API (/api/v1/*)
Full OpenAPI spec available at /docs when running.

**Authentication:** Authorization: Bearer <JWT> or demo mode (no header)

**Key Endpoints:**
```
POST   /api/v1/auth/login                  # JWT login
POST   /api/v1/auth/demo-token             # Demo token

GET    /api/v1/workspaces/current          # Current workspace
GET    /api/v1/workspaces/current/dashboard # Dashboard stats

POST   /api/v1/sources/upload              # Upload document (multipart)
POST   /api/v1/sources/{id}/process        # Process (extract, chunk, embed)
POST   /api/v1/sources/{id}/approve        # Approve for use

GET    /api/v1/facts                       # List facts
POST   /api/v1/facts                       # Create fact

GET    /api/v1/guidelines                  # List guidelines
POST   /api/v1/guidelines                  # Create guideline

POST   /api/v1/content                     # Create submission
GET    /api/v1/content                     # List submissions
POST   /api/v1/content/{id}/analyze        # Trigger analysis (async Celery)
GET    /api/v1/content/{id}/analysis-status # Poll analysis status

GET    /api/v1/reviews/queue               # Review queue
POST   /api/v1/reviews/{id}/decision       # Submit decision
POST   /api/v1/reviews/findings/{id}/feedback # Finding feedback

GET    /api/v1/passport/content/{content_id} # Generate passport
GET    /api/v1/passport/content/{content_id}/export?format=json # Export

GET    /api/v1/insights?range=30d          # Insights dashboard data
GET    /api/v1/audit?limit=50&offset=0     # Paginated audit log
```

---

## 11. SECURITY & COMPLIANCE

### 11.1 Authentication & Authorization
| Layer | Implementation |
|-------|----------------|
| **Transport** | HTTPS only (production), CORS restricted to frontend origin |
| **Auth** | JWT Bearer tokens (HS256), 60-min expiry, refresh token rotation |
| **Demo Mode** | USE_MOCK_LLM=true + demo token endpoint, no real credentials |
| **Roles** | ADMIN (3) > REVIEWER (2) > CREATOR (1) — hierarchical |
| **RBAC** | Endpoint-level require_admin, require_reviewer_or_admin, require_creator_or_above |

### 11.2 Data Protection
| Control | Implementation |
|---------|----------------|
| **Tenant Isolation** | PostgreSQL RLS policies on ALL tables — enforced at DB level |
| **Encryption at Rest** | PostgreSQL TDE (production), encrypted volumes |
| **Encryption in Transit** | TLS 1.3 for all connections |
| **Secrets Management** | Environment variables only, no hardcoded secrets |
| **PII Handling** | Email, names only — no sensitive personal data |

### 11.3 AI Safety
| Measure | Implementation |
|---------|----------------|
| **Prompt Injection** | wrap_document_content() sanitizes all user content before LLM |
| **Confidence Calibration** | Auto-downgrade to UNVERIFIED if confidence < 85% |
| **Deterministic Fallback** | Full pipeline works without LLM (mock provider) |
| **No Training on Data** | Zero data retention, API calls only |
| **Output Validation** | Zod/Pydantic schemas enforce structured output |

### 11.4 Audit & Compliance
| Requirement | Implementation |
|-------------|----------------|
| **Immutable Audit** | audit_events table — append-only, covers every action |
| **Brand Evidence Passport** | Cryptographic hash of content + complete evidence trail |
| **Human-in-the-Loop** | AI never publishes; critical findings require override reason |
| **Data Retention** | Configurable per workspace, audit log never auto-deletes |
| **Export** | Passport export as JSON (PDF placeholder) |

---

## 12. KEY FEATURES WALKTHROUGH

### 12.1 Content Submission & Verification Flow
```
1. User opens /reviews/new
2. Selects channel (Website/Instagram/LinkedIn/Email/Advertising/Other)
3. Selects content type (Product description/Social post/Ad/etc.)
4. Pastes/writes content → Live Claim Radar highlights:
   • Numbers with units (battery, weight, %)
   • Superlatives (best, fastest, revolutionary)
   • Spec patterns (Bluetooth 5.0, waterproof, AI robot)
5. Clicks Submit for Verification
6. Backend runs 4-stage pipeline:
   a) Extract claims → b) Exact fact match → c) Semantic RAG → d) LLM verification
7. Results appear in /reviews/[id] with findings, claims, evidence
8. Reviewer resolves each finding (Accept/Override/Edit/Reject/Ambiguous)
9. Final decision: Approve / Request Changes / Reject
10. Brand Evidence Passport generated automatically
```

### 12.2 Brand Evidence Passport
**Complete, auditable record** for every published piece:
```
┌─────────────────────────────────────────────────────────────────┐
│                    BRAND EVIDENCE PASSPORT                       │
├─────────────────────────────────────────────────────────────────┤
│  1. SUBMISSION METADATA                                         │
│     Title, Type, Channel, Risk Level, Content Hash (SHA-256)   │
├─────────────────────────────────────────────────────────────────┤
│  2. CLAIM VERIFICATION                                          │
│     • Claim text + type                                         │
│     • Status: SUPPORTED/CONTRADICTED/UNVERIFIED/OUTDATED       │
│     • Explanation + confidence                                  │
│     • Evidence: Source name, page, excerpt, relation           │
├─────────────────────────────────────────────────────────────────┤
│  3. FINDINGS & RESOLUTIONS                                      │
│     • Finding type, severity, excerpt                          │
│     • Explanation + suggested correction                       │
│     • Reviewer action: ACCEPTED/OVERRIDDEN/EDITED/REJECTED     │
│     • Override reason (if overridden)                          │
├─────────────────────────────────────────────────────────────────┤
│  4. HUMAN REVIEW DECISION                                       │
│     • Decision: APPROVED/REJECTED/CHANGES_REQUESTED            │
│     • Reviewer comment                                          │
│     • Timestamp + reviewer identity + role                     │
├─────────────────────────────────────────────────────────────────┤
│  5. AUDIT TIMELINE                                              │
│     • Version history with change reasons                      │
│     • Analysis runs with provider/model                        │
│     • All decisions + feedback events                          │
├─────────────────────────────────────────────────────────────────┤
│  6. CRYPTOGRAPHIC SEAL                                          │
│     • SHA-256 content hash                                     │
│     • AI provider + model + prompt version                     │
│     • Generation timestamp                                     │
└─────────────────────────────────────────────────────────────────┘
```

### 12.3 Governance Intelligence Loop
**Continuous improvement** from reviewer behavior:
```
Reviewers override RULE-CLAIM-001 (Avoid unverified benchmarks) 42% of the time
        │
        ▼
AI analyzes override reasons: Qualifier 'up to' not handled, Context missing
        │
        ▼
AI drafts guideline clarification: When using 'up to X', ensure X ≤ approved max
        │
        ▼
Admin reviews proposal → Approves v2 of RULE-CLAIM-001
        │
        ▼
Future submissions: fewer overrides, higher first-pass approval rate
        │
        ▼
Knowledge gaps detected → Add Approved Fact for recurring unverified claims
```

### 12.4 Source Document Ingestion
```
1. Upload PDF/DOCX/TXT via /sources/upload
2. Background task: PyMuPDF/python-docx → extract text
3. Chunk: 500 tokens, 50 overlap (tiktoken)
4. Embed: text-embedding-3-small (1536 dim)
5. Store: SourceChunk with VECTOR(1536) + metadata
6. Status: PENDING_REVIEW → Admin approves → APPROVED
7. Approved chunks available for semantic retrieval in verification
```

---

## 13. DEPLOYMENT & DEVOPS

### 13.1 Docker Compose (Full Stack)
```yaml
# docker-compose.yml
services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: brandvault
      POSTGRES_USER: brandvault
      POSTGRES_PASSWORD: brandvault
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports: ["5432:5432"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql+asyncpg://brandvault:brandvault@postgres:5432/brandvault
      REDIS_URL: redis://redis:6379/0
      JWT_SECRET: ${JWT_SECRET}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      USE_MOCK_LLM: "false"
    ports: ["8000:8000"]
    depends_on: [postgres, redis]

  celery-worker:
    build: ./backend
    command: celery -A app.tasks.celery_app worker --loglevel=info
    environment: [same as backend]
    depends_on: [postgres, redis, backend]

  frontend:
    build: .
    environment:
      NEXT_PUBLIC_API_URL: http://backend:8000
    ports: ["3000:3000"]
    depends_on: [backend]

volumes:
  postgres_data:
```

### 13.2 Environment Variables
| Variable | Frontend | Backend | Required |
|----------|----------|---------|----------|
| DATABASE_URL | — | Yes | Yes |
| REDIS_URL | — | Yes | Yes |
| JWT_SECRET | — | Yes | Yes (32+ chars) |
| GEMINI_API_KEY | — | Yes | No (mock mode) |
| USE_MOCK_LLM | — | Yes | No (default: true) |
| NEXT_PUBLIC_SUPABASE_URL | Yes | — | No (optional) |
| SUPABASE_SERVICE_ROLE_KEY | Yes | — | No (optional) |

### 13.3 Production Checklist
- [ ] USE_MOCK_LLM=false + valid GEMINI_API_KEY
- [ ] JWT_SECRET rotated, 32+ chars
- [ ] PostgreSQL RLS policies verified
- [ ] CORS_ORIGINS restricted to production domain
- [ ] ENVIRONMENT=production (disables docs, enables NullPool)
- [ ] SSL/TLS certificates configured
- [ ] Database backups scheduled
- [ ] Log aggregation (structlog JSON → Loki/ELK)
- [ ] Health checks: /health (backend), /api/health (frontend)
- [ ] Rate limiting on API (Redis-based)

---

## 14. TESTING & QUALITY

### 14.1 Backend Testing
| Test Type | Coverage | Command |
|-----------|----------|---------|
| Unit Tests | Services, agents, utils | pytest tests/unit |
| Integration Tests | API endpoints, DB operations | pytest tests/integration |
| Evaluation Suite | 35 test cases across 6 categories | python tests/evaluation/run_evaluation.py |
| Load Testing | Celery workers, DB connection pool | Locust/k6 scripts |

**Evaluation Matrix (35 Cases):**
| Category | Cases | Description |
|----------|-------|-------------|
| SUPPORTED | 8 | Exact matches, paraphrases |
| CONTRADICTED | 8 | Numeric mismatches, version conflicts |
| UNVERIFIED | 6 | No evidence, subjective claims |
| OUTDATED/CONFLICTING | 4 | Expired sources, conflicts |
| TERMINOLOGY/TONE | 5 | Guideline violations |
| ADVERSARIAL | 4 | Prompt injection, edge cases |

### 14.2 Frontend Testing
| Area | Status | Tool |
|------|--------|------|
| Unit Tests | 0% | None configured |
| Integration Tests | 0% | None configured |
| E2E Tests | 0% | None configured |
| Visual Regression | 0% | None configured |
| Accessibility Audit | Manual only | NOTES.md verification |
| Performance Budget | None | Not defined |
| Bundle Analysis | None | Not configured |

### 14.3 Code Quality
| Tool | Status |
|------|--------|
| TypeScript Strict | Not verified (tsconfig.json needs check) |
| ESLint | No config (only next lint) |
| Prettier | No config |
| Ruff (Python) | Configured in pyproject.toml |
| MyPy | Not configured |

---

## 15. KNOWN ISSUES & TECHNICAL DEBT

### 15.1 Critical Security Issues (12)
| ID | Issue | Location |
|----|-------|----------|
| C-001 | Missing Error Boundaries | All pages |
| C-002 | No Auth Guards | (dashboard)/layout.tsx |
| C-003 | localStorage without SSR guards | notification-popover.tsx, review-studio.tsx |
| C-004 | No Input Sanitization (XSS) | review-studio.tsx, guidelines-manager.tsx |
| C-005 | No CSRF Protection | All /api/* routes |
| C-006 | IDOR in API | submissions/[id], passports/[id] |
| C-007 | Hardcoded Demo Secrets | file-adapter.ts |
| C-008 | No Rate Limiting | All API endpoints |
| C-009 | Missing CSP Headers | next.config.mjs |
| C-010 | Supabase Service Role Exposure Risk | adaptor.ts |
| C-011 | Unvalidated File Uploads | knowledge-manager.tsx |
| C-012 | Demo Mode Bypasses Logic | overview/page.tsx, file-adapter.ts |

### 15.2 High-Priority Issues (18)
- Hydration mismatches from suppressHydrationWarning abuse
- Framer Motion mount bugs & layout thrashing
- Memory leaks in useEffect cleanup
- Race conditions in data fetching
- Broken keyboard navigation & missing ARIA
- Inaccessible color contrast (WCAG AA failures)
- Duplicate statusToVariant functions (7+ files)
- Hardcoded workspace/user IDs
- No optimistic UI updates
- SearchDialog refetches all data on every open

### 15.3 Architecture Debt (10)
| Issue | Impact |
|-------|--------|
| No state management (Redux/Zustand) | Prop drilling, 30+ useState in ReviewStudio |
| No data fetching library (TanStack Query) | Manual fetch, no caching/deduping |
| No form library (React Hook Form unused) | Manual validation, inconsistent patterns |
| Raw Radix UI (no abstraction) | Duplicated wrapper code |
| Server/Client mixing without boundaries | Unnecessary client bundles |
| No API layer abstraction | Direct fetch in components |
| Inline styles mixed with Tailwind | Specificity wars |
| No Storybook | No visual regression testing |
| Monorepo not used | Build times scale poorly |
| Minimal Next.js config | No production optimizations |

### 15.4 Massive Components Needing Split
| Component | Lines | Split Target |
|-----------|-------|--------------|
| ReviewStudio | 1600+ | 8-10 components |
| InsightsManager | 1500+ | 6-8 components |
| GuidelinesManager | 800+ | 4-5 components |
| KnowledgeManager | 900+ | 4-5 components |

---

## 16. FUTURE ROADMAP

### 16.1 Phase 1: Production Hardening (Weeks 1-2)
- [ ] Implement authentication guards & session management
- [ ] Add CSRF protection, CSP headers, rate limiting
- [ ] Fix IDOR vulnerabilities, secure file uploads
- [ ] Remove hardcoded secrets, add demo mode flag
- [ ] Add Error Boundaries to all major sections

### 16.2 Phase 2: Stability & Accessibility (Weeks 2-3)
- [ ] Fix hydration mismatches, remove suppressHydrationWarning
- [ ] Resolve Framer Motion layout thrashing (CSS transforms)
- [ ] Implement focus traps, ARIA attributes, keyboard navigation
- [ ] Fix color contrast to WCAG AA
- [ ] Centralize statusToVariant / riskToVariant utilities

### 16.3 Phase 3: Architecture Modernization (Weeks 3-5)
- [ ] Add TanStack Query for data fetching
- [ ] Integrate React Hook Form + Zod for all forms
- [ ] Split massive components (ReviewStudio, InsightsManager)
- [ ] Add table virtualization (react-window)
- [ ] Implement optimistic UI updates
- [ ] Optimize font loading (subset, unicode-range)

### 16.4 Phase 4: Developer Experience & Quality (Weeks 5-6)
- [ ] Add ESLint + Prettier + Husky
- [ ] Implement Vitest + React Testing Library
- [ ] Add Playwright E2E tests
- [ ] Set up Storybook for component documentation
- [ ] Configure bundle analysis + performance budgets
- [ ] Add visual regression testing (Chromatic)

### 16.5 Phase 5: Feature Expansion (Months 2-3)
- [ ] Multi-language support (i18n)
- [ ] Advanced workflow: approval chains, legal review
- [ ] Webhook integrations (Slack, Teams, Jira)
- [ ] Custom brand voice LLM fine-tuning
- [ ] Advanced analytics: brand drift detection, competitor tracking
- [ ] Public API for third-party integrations
- [ ] SAML/SSO authentication
- [ ] Advanced document processing (tables, images, formulas)

---

## 📄 APPENDICES

### Appendix A: File Inventory (Key Files)
```
Frontend (Next.js):
├── app/
│   ├── layout.tsx, page.tsx, globals.css
│   ├── (dashboard)/layout.tsx, overview/page.tsx
│   ├── (dashboard)/reviews/[new, [id], [id]/findings/[fid]]
│   ├── (dashboard)/guidelines/page.tsx
│   ├── (dashboard)/knowledge/page.tsx
│   ├── (dashboard)/findings/page.tsx
│   ├── (dashboard)/passports/[page, [submissionId]]
│   ├── (dashboard)/insights/page.tsx
│   ├── (dashboard)/settings/page.tsx
│   └── api/* (20+ routes)
├── components/
│   ├── ui/ (12 primitives)
│   ├── layout/ (4 layout components)
│   ├── reviews/ (2 domain components)
│   ├── guidelines/, knowledge/, findings/, insights/, passport/
├── lib/
│   ├── utils.ts, validations.ts, constants/samples.ts
│   ├── ai/ (5 files - pipeline, schemas, prompts, provider, rules)
│   ├── services/ (3 services)
│   ├── db/ (4 adapters)
│   └── auth.ts

Backend (FastAPI):
├── app/
│   ├── main.py, core/ (5 files)
│   ├── models/ (13 tables)
│   ├── schemas/ (Pydantic models)
│   ├── api/v1/ (9 routers)
│   ├── services/ (7 services)
│   ├── agents/ (3 agents)
│   ├── tasks/ (2 Celery workers)
│   └── utils/ (3 utilities)
├── alembic/, scripts/, tests/
├── docker-compose.yml, Dockerfile.backend, pyproject.toml
```

### Appendix B: Design Tokens Reference
```css
/* Colors */
--paper: #FBF7EF; --surface: #FFFDF9; --surface-2: #F4EEE1;
--line: #E6DCC8; --ink: #1E2540; --ink-2: #4C5470; --ink-3: #7A8099;
--brand: #2F4FB3; --brand-hover: #253D8E; --brand-soft: #E3EAFA;
--terracotta: #C4673F; --supported: #4F7F5B; --unverified: #9A6B12;
--contradicted: #B24A4A; --outdated: #7A5AA8;

/* Typography */
--font-fraunces: Fraunces, Georgia, serif;
--font-inter: Inter, system-ui, sans-serif;
--font-jakarta: Plus_Jakarta_Sans, var(--font-inter), system-ui, sans-serif;
--font-jetbrains-mono: JetBrains Mono, monospace;
--font-caveat: Caveat, cursive;

/* Spacing */
--gap: 24px; --page-padding: 32px; --sidebar-width: 248px; --header-height: 64px;

/* Radius */
--radius-xs: 4px; --radius-sm: 6px; --radius: 8px; --radius-md: 10px;
--radius-lg: 12px; --radius-xl: 14px; --radius-2xl: 16px; --radius-full: 9999px;
```

### Appendix C: Environment Variables Reference
```bash
# Backend (.env)
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=your-32-char-min-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=60
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-1.5-flash
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536
USE_MOCK_LLM=true
STORAGE_TYPE=local
STORAGE_PATH=/app/uploads
ENVIRONMENT=development
LOG_LEVEL=INFO
CORS_ORIGINS=["http://localhost:3000"]
DEMO_WORKSPACE_SLUG=nexatech
DEMO_USER_ID=22222222-2222-2222-2222-222222222222
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

---

## 📝 REPORT METADATA

| Field | Value |
|-------|-------|
| **Report Version** | 1.0 |
| **Generated** | November 15, 2026 |
| **Author** | Dipto Nath (Team Lead) |
| **Project** | BrandVault AI |
| **Event** | CodeNova India 2026 |
| **Team** | SHINRAI |
| **Classification** | Internal — Technical Documentation |
| **Format** | Markdown (PDF-ready via pandoc) |

---

## 🔗 QUICK LINKS

- **Frontend Repo**: /app, /components, /lib, /types
- **Backend Repo**: /backend/app, /backend/alembic, /backend/tests
- **Master Spec**: MASTER_BACKEND_PROMPT.md
- **Bug Report**: FRONTEND_BUG_REPORT.md (87 issues)
- **Verification Notes**: NOTES.md (Insights page testing)
- **Deployment**: docker-compose.yml, Dockerfile.backend

---

**End of Project Report**

*This document represents the complete technical specification of BrandVault AI as of November 15, 2026. It serves as the single source of truth for architecture, implementation details, and future development planning.*
