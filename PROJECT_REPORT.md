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
