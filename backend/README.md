# BrandVault AI Backend

Production-ready FastAPI backend for the Brand Governance Platform. Implements the **Brand Evidence Passport** workflow with evidence-grounded claim verification, multi-tenant isolation, and human-in-the-loop review.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      FASTAPI BACKEND                             │
├─────────────────────────────────────────────────────────────────┤
│  API Layer (Routers)                                            │
│  ├── /auth          - JWT authentication, demo mode             │
│  ├── /workspaces  - Organization & dashboard                    │
│  ├── /sources     - Document upload & processing (PDF/DOCX)     │
│  ├── /facts       - Approved facts CRUD                         │
│  ├── /guidelines  - Brand guidelines with pattern matching      │
│  ├── /content     - Content submissions & versions              │
│  ├── /reviews     - Human review workflow & decisions           │
│  ├── /passport    - Brand Evidence Passport generation          │
│  ├── /insights    - Governance analytics & suggestions          │
│  └── /audit       - Complete audit trail                        │
├─────────────────────────────────────────────────────────────────┤
│  Services (Business Logic)                                      │
│  ├── VerificationEngine  - 4-stage pipeline (core)              │
│  ├── IngestionService    - Document parsing & embedding         │
│  ├── FactService         - Approved facts management            │
│  ├── GuidelineService    - Brand guidelines CRUD                │
│  ├── ReviewService       - Human review workflow                │
│  ├── PassportService     - Evidence passport generation         │
│  └── AuditService        - Immutable audit logging              │
├─────────────────────────────────────────────────────────────────┤
│  Agents (AI/LLM)                                                │
│  ├── ClaimExtraction     - Atomic claim extraction              │
│  ├── ContextualVerification - Evidence-grounded verification    │
│  ├── ToneAnalysis        - Brand tone/guideline checking        │
│  └── Correction          - Content correction suggestions       │
├─────────────────────────────────────────────────────────────────┤
│  Data Layer                                                     │
│  ├── PostgreSQL + pgvector - Relational + vector search         │
│  ├── Redis                 - Celery broker & caching            │
│  └── SQLAlchemy 2.0        - Async ORM with RLS                 │
└─────────────────────────────────────────────────────────────────┘
```

## ✨ Key Features

### 🔍 4-Stage Verification Pipeline
1. **Claim Extraction** - LLM extracts atomic, verifiable claims
2. **Deterministic Check** - Exact matching against approved facts (no AI)
3. **Semantic Retrieval** - pgvector RAG with tenant isolation & temporal validity
4. **Contextual Verification** - LLM classifies: `SUPPORTED`, `CONTRADICTED`, `UNVERIFIED`, `OUTDATED_CONFLICTING`

### 🛡️ Security & Compliance
- **Row-Level Security (RLS)** - PostgreSQL policies enforce tenant isolation
- **JWT Authentication** - Role-based access (ADMIN, CREATOR, REVIEWER)
- **Prompt Injection Prevention** - Document content sanitized & wrapped
- **Confidence Calibration** - Auto-downgrade to UNVERIFIED if confidence < 85%
- **Audit Trail** - Every action logged with actor, timestamp, before/after values

### 📄 Brand Evidence Passport
Complete, auditable record for every content version:
- All claims with verification status & evidence
- All findings with source snippets & page numbers
- Human decisions with override reasons
- Full audit trail
- AI provider, model, & prompt version disclosure

### 🎯 Demo-Ready (NexaTech)
Pre-seeded fictional brand with:
- 5 brand guidelines (terminology, tone, claims)
- 6 approved facts (battery, Bluetooth, weight, warranty, waterproof, charging)
- Works without external API keys (mock LLM mode)

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL 15+ with pgvector
- Redis 7+

### Local Development

```bash
cd backend

# Install dependencies
pip install -e .

# Copy environment template
cp .env.example .env
# Edit .env with your settings

# Run migrations
alembic upgrade head

# Seed demo data
python scripts/seed_demo.py

# Start development server
uvicorn app.main:app --reload --port 8000
```

### Docker (Recommended)

```bash
cd backend

# Copy environment
cp .env.example .env

# Start all services
docker-compose up -d

# Run migrations
docker-compose exec backend alembic upgrade head

# Seed demo data
docker-compose exec backend python scripts/seed_demo.py

# View logs
docker-compose logs -f backend
```

Services available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **Health**: http://localhost:8000/health

## 🧪 Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run evaluation suite (35-case matrix)
python tests/evaluation/run_evaluation.py
```

## 📚 API Documentation

### Authentication
```bash
# Demo login (no password)
curl -X POST http://localhost:8000/api/v1/auth/demo \
  -H "Content-Type: application/json" \
  -d '{"workspace_slug": "nexatech"}'

# Regular login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secret"}'
```

### Core Workflows

**Upload Source Document**
```bash
curl -X POST http://localhost:8000/api/v1/sources/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@product_spec.pdf" \
  -F "source_name=Product Spec v4"
```

**Create Approved Fact**
```bash
curl -X POST http://localhost:8000/api/v1/facts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "fact_code": "FACT-001",
    "title": "Battery Life",
    "fact_text": "Up to 12 hours",
    "entity_name": "NexaTech Buds X",
    "attribute_name": "battery_life",
    "value_numeric": 12,
    "unit": "hours",
    "qualifier": "up to",
    "source_name": "Product Spec v4",
    "source_reference": "Page 3"
  }'
```

**Submit Content for Analysis**
```bash
curl -X POST http://localhost:8000/api/v1/content \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Launch Post",
    "content_type": "SOCIAL_MEDIA_POST",
    "channel": "INSTAGRAM",
    "original_content": "Experience up to 18 hours of battery life with Bluetooth 5.3!"
  }'

# Trigger async analysis
curl -X POST http://localhost:8000/api/v1/content/{content_id}/analyze \
  -H "Authorization: Bearer <token>"

# Poll for results
curl http://localhost:8000/api/v1/content/{content_id}/status \
  -H "Authorization: Bearer <token>"

# Get findings
curl http://localhost:8000/api/v1/content/{content_id}/findings \
  -H "Authorization: Bearer <token>"
```

**Generate Brand Evidence Passport**
```bash
curl http://localhost:8000/api/v1/passport/content/{content_id} \
  -H "Authorization: Bearer <token>"
```

## 📁 Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI app & middleware
│   ├── core/                   # Config, DB, Auth, Exceptions
│   ├── models/                 # SQLAlchemy models (18 tables)
│   ├── schemas/                # Pydantic request/response models
│   ├── api/v1/                 # API routers (9 modules)
│   ├── services/               # Business logic (7 services)
│   ├── agents/                 # LLM prompts & providers
│   ├── tasks/                  # Celery background tasks
│   └── utils/                  # Document parsing, normalization
├── alembic/                    # Database migrations
├── scripts/                    # Seed & utility scripts
├── tests/                      # Unit, integration, evaluation
├── docker-compose.yml          # Full stack deployment
├── Dockerfile.backend          # Container image
├── pyproject.toml              # Dependencies
└── README.md                   # This file
```

## 🔧 Configuration

Key environment variables (`.env`):

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://...` |
| `REDIS_URL` | Redis connection | `redis://localhost:6379/0` |
| `JWT_SECRET` | JWT signing key (min 32 chars) | Required |
| `GEMINI_API_KEY` | Google Gemini API key | Optional (mock mode) |
| `USE_MOCK_LLM` | Use deterministic mock LLM | `true` |
| `EMBEDDING_DIMENSIONS` | Vector dimensions | `1536` |
| `STORAGE_PATH` | File upload directory | `/app/uploads` |

## 🎯 Evaluation Matrix (35 Cases)

| Category | Cases | Description |
|----------|-------|-------------|
| **SUPPORTED** | 8 | Exact matches, paraphrases |
| **CONTRADICTED** | 8 | Numeric mismatches, version conflicts |
| **UNVERIFIED** | 6 | No evidence, subjective claims |
| **OUTDATED/CONFLICTING** | 4 | Expired sources, conflicts |
| **TERMINOLOGY/TONE** | 5 | Guideline violations |
| **ADVERSARIAL** | 4 | Prompt injection, edge cases |

Run evaluation: `python tests/evaluation/run_evaluation.py`

## 🏆 Hackathon Compliance

- ✅ **Frontend READ-ONLY** - Zero modifications to Next.js frontend
- ✅ **API Compatibility** - Matches existing `/api/*` contracts exactly
- ✅ **4 Evidence States** - No "FALSE" state, only SUPPORTED/CONTRADICTED/UNVERIFIED/OUTDATED
- ✅ **Tenant Isolation** - RLS at database level
- ✅ **Human Control** - AI never publishes, critical findings require override reason
- ✅ **Async Processing** - Celery for document ingestion & analysis
- ✅ **Docker Deployable** - Single `docker-compose up`
- ✅ **Demo Mode** - Works without external API keys

## 📖 Learn More

- [Master Backend Prompt](../MASTER_BACKEND_PROMPT.md) - Complete specification
- [Problem Statement](../Problem_statement.pdf) - Original challenge
- [Round 1 Plan](../BrandVault_AI_Round1_Plan_SHINRAI.pdf) - Team SHINRAI's plan

## 👥 Team SHINRAI

- **Dipto Nath** - Team Lead, Backend/AI-ML (Verification Engine, Architecture)
- **Anuj Shaw** - Full-stack Developer (Frontend, API Integration, Deployment)
- **Rumki Dhar** - Research & Presentation (User Discovery, KPIs, Demo)
- **Baeish Akhtar** - Research (Source Pack, Test Set, Privacy/Security)
- **Anjali Singh** - UI/UX Design (Design System, Findings UX, Accessibility)

---

**Built for CodeNova India 2026** 🇮🇳
