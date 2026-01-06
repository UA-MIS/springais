# SpringAIS System Overview

**Last Updated:** 2026-01-06
**Source:** Extracted from `_bmad-output/tech-stack.md` and `architecture-updates-2026.md`

---

## Executive Summary

SpringAIS is an AI-powered internal talent mobility platform for EY that matches employees to roles using semantic skill analysis, success pattern insights, and career path visualization.

**Architecture:** Local-first development with Docker
**Timeline:** 8-week competition MVP
**Cost:** ~$3 total (was $60-80 with Azure)
**Demo:** Runs on laptop, no cloud dependencies

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  React 18 + TypeScript + Vite + Tailwind + shadcn/ui           │
│                                                                  │
│  • Skills Dashboard (Block I) - Profile & skill input           │
│  • Match Results (Block J) - Job matches with gaps              │
│  • Career Visualization (Block K) - React Flow progression      │
│  • Success Patterns (Block L) - Charts & insights               │
└─────────────────────────────────────────────────────────────────┘
                               ↕ HTTP/JSON (localhost:8000)
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND API                              │
│  FastAPI + Python 3.11 + SQLAlchemy 2.0                        │
│                                                                  │
│  • Skill Extraction (Block G) - GPT-5.2 Instant resume parsing         │
│  • Matching Engine (Block E) - Cosine similarity ranking        │
│  • Success Patterns (Block F) - SQL aggregation queries         │
│  • Vector Embeddings (Block D) - text-embedding-3-large         │
└─────────────────────────────────────────────────────────────────┘
                               ↕
┌─────────────────────────────────────────────────────────────────┐
│                      INFRASTRUCTURE                              │
│                                                                  │
│  PostgreSQL 16 + pgvector     Redis 7 (Cache)                  │
│  • 900 synthetic employees    • Semantic match cache           │
│  • ~30-50 job postings        • Exact text match cache         │
│  • Vector embeddings (3072-D) • Session storage                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
- **React 18.2** - UI framework
- **TypeScript 5.0** - Type safety
- **Vite 5.0** - Build tool and dev server
- **Tailwind CSS 3.3** - Utility-first CSS
- **shadcn/ui** - Component library
- **React Query (TanStack)** - Server state management
- **React Router 6** - Client-side routing
- **React Flow** - Career path visualization
- **Recharts** - Success pattern charts

### Backend
- **FastAPI 0.109** - Modern Python web framework
- **Python 3.11** - Core language
- **SQLAlchemy 2.0** - ORM with type hints
- **Pydantic 2.5** - Data validation
- **OpenAI SDK 1.10** - GPT-5.2 Instant & embeddings
- **uvicorn** - ASGI server
- **bcrypt** - Password hashing
- **PyJWT** - JWT authentication

### Database & Cache
- **PostgreSQL 16** - Primary database
- **pgvector 0.5.1** - Vector similarity search
- **Redis 7.2** - Caching layer
- **Alembic** - Database migrations

### Infrastructure
- **Docker 24** - Containerization
- **Docker Compose** - Multi-container orchestration

---

## Data Architecture

### Three Service Lines (EY Structure)

**Assurance (300 employees, 33%)**
- Roles: Staff → Senior → Manager → Senior Manager → Partner (5 levels)
- Focus: Audit, Financial Reporting, Risk & Compliance, SEC Reporting

**Tax (300 employees, 33%)**
- Roles: Staff → Senior → Manager → Senior Manager → Partner (5 levels)
- Focus: Corporate Tax, International Tax, M&A Tax, State & Local

**Consulting (300 employees, 34%)**
- Roles: Analyst → Associate → Sr Associate → Consultant → Sr Consultant → Manager → Sr Manager → Director → Partner (9 levels)
- Focus: Cloud, Data & Analytics, Cybersecurity, AI/ML, Strategy, Operations, Finance Transform, M&A Advisory

**Total:** ~25 unique role types across 900 employees

---

## Key Design Decisions

### 1. Local-First Development (Not Cloud)

**Why:** 8-week timeline, $0 budget, more impressive live demo

**Benefits:**
- ✅ Zero infrastructure costs ($0 vs $30-50/month)
- ✅ No deployment delays (iterate faster)
- ✅ No "server down" risk during demo
- ✅ Portable (demo anywhere with laptop + Docker)

### 2. Hybrid Synthetic Data Generation

**Hard-coded ($0):**
- Role templates and hierarchy
- Core required skills (from O*NET + job postings)
- Experience ranges per role
- Performance metric ranges

**LLM-generated (~$2):**
- GPT-5 Nano: Individual metric variation ($0.04)
- GPT-5.2 Instant: Feedback themes and achievements ($1.50)

**Result:** Guaranteed baseline quality + realistic diversity

### 3. Vector-Only Matching (No ML Ranking)

**Why:** Only ~25 role types (too few for ML to add value)

**Approach:**
1. Vector similarity search against role types
2. Sort by cosine similarity
3. Return top 10

**Future:** Add ML ranking when job posting DB grows to 100+

### 4. Job Postings PRIMARY, Success Patterns AUGMENTATION

**User wants: Senior Analyst role**

**IF job posting exists:**
- PRIMARY: Job posting requirements (ground truth)
- AUGMENTATION: Success pattern insights (hidden gems)

**ELSE (no posting):**
- PRIMARY: Success patterns only (graceful degradation)

**Growing database:** Week 1: 30 postings → Month 3: 100+ postings

---

## Development Workflow

### Setup (1 command)
```bash
docker-compose up -d
```

### Team Data Sharing (Git-Based)
```bash
# One person generates data (~$2, 2 min)
python scripts/generate_synthetic_data.py
pg_dump springais > data/synthetic_employees.sql

# Commit to data-dumps branch
git checkout data-dumps
git add data/synthetic_employees.sql
git commit -m "Generate 900 employees - 2026-01-06"
git push

# Teammates pull and load
git checkout data-dumps && git pull
psql springais < data/synthetic_employees.sql
```

### Hot Reload
- Backend: Uvicorn auto-reloads on file changes (2-3 seconds)
- Frontend: Vite HMR (Hot Module Replacement) (instant)

---

## Performance Targets

### API Response Times
- Health check: <10ms
- Skill extraction (GPT-5.2 Instant): <15s uncached, <3s cached
- Vector similarity search: <100ms (pgvector HNSW index)
- Success pattern queries: <50ms (PostgreSQL indexed aggregations)
- Match generation (10 results): <2s total

### Database Query Targets
- Employee lookup by service line: <50ms (300 rows)
- Top 10 matches per user: <10ms (composite index)
- Semantic similarity (10K embeddings): <100ms (HNSW)
- Job postings by date range: <20ms (BRIN index)

### Cost Targets
- Infrastructure: $0/month (local Docker)
- Data generation: ~$2 one-time
- Demo runtime: ~$1 (50 test resumes)
- **Total 8-week project: ~$3**

---

## Security Architecture

### Authentication
- JWT tokens (7-day expiration)
- bcrypt password hashing (12 rounds)
- HTTPS in production (local HTTP for dev)

### Data Protection
- Passwords never stored in plaintext
- JWT secrets in environment variables
- CORS configured for frontend origin only
- SQL injection prevented by SQLAlchemy ORM

### Demo Considerations
- Simple JWT auth (can skip for competition demo)
- No sensitive real data (all synthetic)
- Local-only (no internet exposure)

---

## Scalability Considerations

### Current Scale (8-Week MVP)
- 900 employees (synthetic)
- ~30-50 job postings (scraped)
- ~10 concurrent demo users
- Single Docker host

### Future Scale (Production)
- 10,000+ employees (real EY data)
- 500+ active job postings
- 1,000+ concurrent users
- Kubernetes deployment
- ML ranking model (when job posting DB > 100)

---

## References

**Full Documentation:**
- `_bmad-output/tech-stack.md` - Complete technical specification
- `_bmad-output/architecture-updates-2026.md` - Design rationale
- `_bmad-output/prd.md` - Product requirements

**Implementation Tracking:**
- `implementation-tracking/PROJECT-STATUS.md` - Progress tracker
- `implementation-tracking/STEP-1-SETUP/` - Foundation setup
- `implementation-tracking/STEP-2-DEVELOPMENT/` - Feature blocks
- `implementation-tracking/STEP-3-INTEGRATION/` - Integration blocks

---

**Document Purpose:** Quick reference for system architecture
**Audience:** Developers joining project mid-stream
**Next Steps:** See `reference-docs/README.md` for complete documentation index
