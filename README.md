# BrandVault AI

<div align="center">

![BrandVault AI](https://img.shields.io/badge/BrandVault-AI-2F4FB3?style=for-the-badge&logo=shield&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15.5-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![pgvector](https://img.shields.io/badge/pgvector-enabled-FF6B35?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)

**Evidence-First Brand Governance Platform** — Verify every claim. Explain every finding. Account for every decision.

[🚀 Quick Start](#-quick-start) • [✨ Features](#-features) • [🏗 Architecture](#-architecture) • [📖 Documentation](#-documentation) • [🛠 Development](#-development) • [🚢 Deployment](#-deployment) • [🔐 Security](#-security) • [🤝 Contributing](#-contributing)

</div>

---

## 🎯 What is BrandVault AI?

BrandVault AI is a **pre-publication review gate** for brand content. It catches factual contradictions, unverified claims, and guideline violations before they go live — with full traceability and human accountability.

### The Problem
- **1000+ content pieces/month** across Web, Social, Email, Ads
- **73% of marketers** publish unverified claims under deadline pressure  
- **$2.4M average cost** per regulatory violation (FTC, ASCI, GDPR)
- **Zero accountability** — no traceable record of who approved what and why

### The Solution
| Traditional Tools | BrandVault AI |
|-------------------|---------------|
| Keyword blocking / regex | 4-stage AI verification pipeline |
| Manual fact-checking | Deterministic + semantic verification |
| No audit trail | Cryptographic Brand Evidence Passports |
| Siloed feedback | Governance Intelligence Loop (AI-suggested rule improvements) |
| Reactive | Proactive knowledge gap detection |

---

## ✨ Features

### 🔍 **Intelligent Content Verification**
- **4-Stage AI Pipeline**: Claim extraction → Evidence retrieval → Verification → Tone analysis
- **4 Evidence States**: `SUPPORTED` • `CONTRADICTED` • `UNVERIFIED` • `OUTDATED` (no "false" state)
- **Deterministic Fallback**: Works without API keys using rule-based checks
- **Traceable Citations**: Every finding links to approved fact + source document + page excerpt

### 👥 **Human-in-the-Loop Review**
- **Review Studio**: Split-pane editor with inline findings, evidence drawer, side-by-side diff
- **Override Tracking**: Every rejection requires written justification
- **Role-Based Decisions**: APPROVE / CHANGES_REQUESTED / REJECT with reviewer signatures
- **Visual Asset Checks**: Brand asset version validation + WCAG AA contrast analysis

### 📚 **Approved Knowledge Base**
- **Fact Management**: CRUD with versioning, expiry dates, provenance tracking
- **Document Ingestion**: PDF/DOCX/TXT upload → AI extraction → Candidate queue → 1-click approval
- **Product Catalog**: Link facts to products with categories, models, launch dates
- **Multilingual Support**: Hindi (Devanagari) & Bengali consistency checking

### 📜 **Brand Evidence Passports**
- **Cryptographic Hash**: SHA-256 of approved content (tamper-evident)
- **Immutable Record**: Claims, findings, decisions, versions, audit trail
- **Export**: JSON (machine-readable) + Print/PDF (clean paginated layout)
- **Stale Detection**: Auto-flags when underlying facts/guidelines change

### 🧠 **Governance Intelligence Loop**
- **Override Pattern Detection**: AI clusters reviewer override reasons by guideline
- **Rule Suggestions**: Auto-drafts guideline amendments with before/after diffs
- **Clarity Score**: `100 - (override_rate × 0.7) - (triggers > 6 ? 10 : 0)` → Visual indicators
- **10-Second Undo**: Rollback approvals with audit logging

### ⚡ **Automatic Re-verification**
- **Source-Change Alerts**: Fact/guideline/source updates → auto-flag dependent content
- **Review Task Queue**: "Needs Re-Review" filter with before/after diffs
- **Background Re-analysis**: Auto-triggers verification on affected submissions

### 🌐 **Multilingual Consistency (HI/BN)**
- **Numeral Normalization**: ০-৯ / ०-९ → 0-9, word numbers ("पांच" → 5)
- **Unit Canonicalization**: Local units → canonical (months, grams, hours, inches)
- **20 Labelled Test Cases**: Precision ~0.95, Recall ~0.90, F1 ~0.92

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS 15 FRONTEND                          │
│  App Router • React 19 • TypeScript • Tailwind + Radix UI      │
│  JWT in HttpOnly Cookies • Default-Deny Middleware             │
└─────────────────────────────┬───────────────────────────────────┘
                              │ REST + Polling
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FASTAPI BACKEND                              │
│  API Layer → Services → LLM Agents → Celery Tasks              │
│  PostgreSQL + pgvector (single DB, RLS for tenant isolation)   │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow
```
Submit Content → Extract Claims → Verify Against Facts → 
Generate Findings → Human Review → Evidence Passport → Learning Loop
```

### Core Modules
| Module | Frontend | Backend |
|--------|----------|---------|
| **Auth** | `app/(auth)/*`, `middleware.ts` | `/api/v1/auth` |
| **Reviews** | `components/reviews/review-studio.tsx` | `/api/v1/reviews`, `/api/v1/content` |
| **Knowledge** | `components/knowledge/*` | `/api/v1/facts`, `/api/v1/sources` |
| **Guidelines** | `components/guidelines/*` | `/api/v1/guidelines` |
| **Insights** | `components/insights/*` | `/api/v1/insights` |
| **Passports** | `components/passport/*` | `/api/v1/passport` |
| **Consistency** | `app/(dashboard)/consistency-checks/*` | `/api/v1/consistency-checks` |
| **AI Pipeline** | `lib/ai/pipeline.ts` | `app/agents/*`, `app/tasks/*` |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20+ and **pnpm** (or npm/yarn)
- **Python** 3.11+ and **poetry** (or pip)
- **PostgreSQL** 16+ with **pgvector** extension
- **Redis** 7+ (for Celery)

### 1. Clone & Configure
```bash
git clone <repository-url>
cd "BrandVault AI"

# Frontend env
cp .env.example .env.local
# Edit .env.local with your keys

# Backend env
cd backend
cp .env.example .env
# Edit .env with DATABASE_URL, REDIS_URL, API keys
cd ..
```

### 2. Run with Docker (Recommended)
```bash
# Full stack: Frontend + Backend + PostgreSQL + Redis
docker-compose up --build

# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### 3. Local Development (Without Docker)
```bash
# Terminal 1: Database & Redis
# Ensure PostgreSQL + pgvector running on localhost:5432
# Ensure Redis running on localhost:6379

# Terminal 2: Backend
cd backend
poetry install  # or pip install -r requirements.txt
poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload --port 8000

# Terminal 3: Frontend
pnpm install  # or npm install
pnpm dev      # or npm run dev
```

---

## 🛠 Development

### Project Structure
```
BrandVault AI/
├── app/                          # Next.js 15 App Router
│   ├── (auth)/                   # Login, signup, auth gate
│   ├── (dashboard)/              # Protected routes (overview, reviews, knowledge, guidelines, passports, insights, settings, consistency, findings)
│   ├── api/                      # API route handlers (proxy to FastAPI)
│   ├── globals.css               # Design tokens, global styles
│   ├── layout.tsx                # Root layout
│   ├── middleware.ts             # Auth protection (default-deny)
│   └── page.tsx                  # Landing page (PrismaHero)
├── components/                   # React components
│   ├── auth/                     # Proof sheets, auth gate modal
│   ├── consistency/              # Multilingual UI
│   ├── guidelines/               # Guidelines manager
│   ├── insights/                 # Insights dashboard (7500+ lines)
│   ├── knowledge/                # Knowledge manager (6200+ lines)
│   ├── layout/                   # Header, sidebar, search, notifications
│   ├── passport/                 # Evidence passport view
│   ├── reviews/                  # Review studio, finding mapper
│   ├── settings/                 # Settings manager
│   └── ui/                       # Base primitives (Button, Card, Table, etc.)
├── lib/                          # Shared libraries
│   ├── ai/                       # Pipeline, prompts, rules, schemas, consistency
│   ├── api/                      # Client, handler utilities
│   ├── db/                       # Storage adapters (Supabase, File)
│   ├── services/                 # Insights, re-verification, audit
│   ├── auth.ts                   # Session management
│   ├── utils.ts                  # Formatting, validation
│   └── validations.ts            # Zod schemas
├── types/database.ts             # Core domain types (enums, interfaces)
├── backend/                      # FastAPI backend
│   ├── app/
│   │   ├── api/v1/               # 10 routers (auth, workspaces, content, reviews, facts, guidelines, sources, insights, passport, consistency)
│   │   ├── core/                 # Config, DB, auth, exceptions, security
│   │   ├── models/               # 23+ SQLAlchemy models
│   │   ├── schemas/              # Pydantic request/response
│   │   ├── services/             # Business logic
│   │   ├── agents/               # LLM prompt engineering
│   │   └── tasks/                # Celery background tasks
│   └── Dockerfile.backend
├── supabase/schema.sql           # PostgreSQL schema + seed data
├── docker-compose.yml            # Local development stack
├── tailwind.config.js            # Complete design system
└── package.json
```

### Key Commands
```bash
# Frontend
pnpm dev          # Development server
pnpm build        # Production build
pnpm lint         # ESLint
pnpm type-check   # TypeScript check

# Backend
cd backend
poetry run uvicorn app.main:app --reload
poetry run pytest                 # Run tests
poetry run alembic revision --autogenerate -m "message"  # New migration
poetry run alembic upgrade head   # Apply migrations

# Database
# Apply Supabase schema:
psql -d brandvault -f supabase/schema.sql
```

### Code Quality
- **TypeScript**: Strict mode enabled, path aliases (`@/*`)
- **ESLint + Prettier**: Configured (add to CI)
- **Zod**: Runtime validation on all API boundaries
- **Error Boundaries**: Per-section in dashboard layout
### 4. Access Demo Sandbox (Judge Mode)
- **URL**: `http://localhost:3000/login?judge=true`
- **Email**: `demo@nexatech.example`
- **Password**: `demo12345`
- Pre-loaded: NexaTech workspace with 5 guidelines, 5 facts, sample submissions

---

## 🚢 Deployment

### Frontend (Vercel)
```bash
# Connect GitHub repo to Vercel
# Environment variables from .env.local
# Auto-deploys on push to main
```

### Backend (Render / Railway / Fly.io)
```bash
# Docker-based deployment
# Required: PostgreSQL + pgvector, Redis
# Environment variables from backend/.env
# Run migrations on startup: alembic upgrade head
```

### Database (Supabase / Neon / Managed PG)
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Run schema
\i supabase/schema.sql
```

### Environment Variables

**Frontend (`.env.local`)**
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
BACKEND_URL=https://your-backend-domain.com
JWT_SECRET=min-32-char-secret-change-in-production
GEMINI_API_KEY=           # Optional: for AI features
GROQ_API_KEY=             # Optional: fallback provider
```

**Backend (`backend/.env`)**
```env
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/brandvault
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=backend-secret-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
GEMINI_API_KEY=
GROQ_API_KEY=
ENVIRONMENT=production
CORS_ORIGINS=["https://your-frontend-domain.com"]
STORAGE_PATH=./uploads
```

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [`final_report.md`](final_report.md) | **Complete A-to-Z technical report** (1500+ lines) — architecture, features, API, database, security, roadmap |
| [`PROJECT_REPORT.md`](PROJECT_REPORT.md) | Original project report with team, problem statement, solution overview |
| [`MASTER_BACKEND_PROMPT.md`](MASTER_BACKEND_PROMPT.md) | Backend specification (FastAPI, PostgreSQL, Celery, agents) |
| [`FRONTEND_BUG_REPORT.md`](FRONTEND_BUG_REPORT.md) | 87-issue audit: Critical/High/Medium/Low with remediation phases |
| [`NOTES.md`](NOTES.md) | `/insights` page verification: 39 interactive controls tested |
| [`supabase/schema.sql`](supabase/schema.sql) | PostgreSQL DDL + seed data (workspaces, guidelines, facts) |

---

## 🔐 Security

### Implemented
- ✅ JWT in HttpOnly, Secure, SameSite=Lax cookies
- ✅ Default-deny middleware (all dashboard routes protected)
- ✅ Server-side session validation on every protected page
- ✅ RBAC: ADMIN / MANAGER / REVIEWER / CREATOR / AGENCY
- ✅ Tenant isolation: every query filtered by `workspace_id`
- ✅ Rate limiting on login (10 attempts/minute)
- ✅ File upload validation (type, size 15MB)
- ✅ Path traversal protection (`safeWriteUpload`)

### Known Gaps (Pre-Production)
| Issue | Severity | Fix |
|-------|----------|-----|
| No CSRF tokens on mutating forms | Critical | Add `next-safe-action` or double-submit cookie |
| localStorage without SSR guards | Critical | Wrap in `typeof window !== 'undefined'` |
| No input sanitization (XSS risk) | Critical | Add DOMPurify for user content |
| IDOR in API routes | Critical | Add `workspace_id` checks to all `/api/*/[id]` |
| No API rate limiting | Critical | Upstash Redis or middleware |
| Hardcoded demo secrets | Critical | Feature flag + env-based demo mode |

See [`FRONTEND_BUG_REPORT.md`](FRONTEND_BUG_REPORT.md) for full 87-issue audit with 5-phase remediation plan.

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** Pull Request

### Development Guidelines
- Follow existing code patterns and conventions
- Add Zod schemas for new API endpoints
- Include TypeScript types in `types/database.ts`
- Write deterministic tests for AI rules
- Update documentation for user-facing changes

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

**Team SHINRAI** (CodeNova India 2026)
- **Dipto Nath** — Team Lead, Backend/AI-ML, Architecture
- **Anuj Shaw** — Full-stack, Frontend, API Integration, DevOps
- **Rumki Dhar** — Research, KPIs, Demo Script, Stakeholder Communication
- **Baeish Akhtar** — Research, Source Pack, Test Set, Privacy/Security
- **Anjali Singh** — UI/UX Design, Design System, Findings UX, Accessibility

**Technologies**
- [Next.js](https://nextjs.org/) • [React](https://react.dev/) • [Tailwind CSS](https://tailwindcss.com/)
- [FastAPI](https://fastapi.tiangolo.com/) • [PostgreSQL](https://www.postgresql.org/) • [pgvector](https://github.com/pgvector/pgvector)
- [Radix UI](https://www.radix-ui.com/) • [Framer Motion](https://www.framer.com/motion/) • [Lucide](https://lucide.dev/)
- [Google Gemini](https://ai.google.dev/) • [Groq](https://groq.com/) • [Celery](https://docs.celeryq.dev/)

---

<div align="center">

**Built with ❤️ for brands that value truth.**

[⭐ Star this repo] • [🐛 Report Bug] • [💡 Request Feature] • [📧 Contact]

</div>