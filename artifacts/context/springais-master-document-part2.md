# SpringAIS Master Document -- Part 2: Architecture and Decisions

> **Compiled**: 2026-02-16
> **Part**: 2 of 4
> **Scope**: System Architecture, Architecture Decision Records, Technology Stack, Security Review

---

## Table of Contents (Part 2)

- **7. System Architecture**
  - 7.1 System Overview
  - 7.2 Data Flow
  - 7.3 Block Dependencies
  - 7.4 Backend Architecture
  - 7.5 Frontend Architecture
  - 7.6 Integration Architecture
  - 7.7 Architecture Updates 2026
  - 7.8 Badge System Architecture
  - 7.9 Cedric Avatar Architecture
  - 7.10 Medieval Mode Architecture
- **8. Architecture Decision Records (ADRs)**
  - 8.1 ADR-001: Curated Catalog Primary
  - 8.2 ADR-002: Microsoft Learn First
  - 8.3 ADR-003: Additive Schema Changes
  - 8.4 ADR-004: Async Badge Loading
  - 8.5 ADR-005: Interaction Tracking
  - 8.6 ADR-MM-001: Alembic Migrations
  - 8.7 ADR-MM-002: Redis Progression Cache
  - 8.8 ADR-MM-003: Sync Achievement Evaluation
  - 8.9 ADR-MM-004: Coin Balance Locking
  - 8.10 ADR-MM-005: Linear XP Curve
  - 8.11 ADR-MM-006: No LocalStorage Migration
  - 8.12 ADR-MM-007: Cosmetic Equipment Rendering
- **9. Technology Stack**
  - 9.1 Technology Stack Document
  - 9.2 Docker Compose Configuration
- **10. Security Review**
  - 10.1 Architecture Security Review

---

# 7. System Architecture

## 7.1 System Overview

*Source: reference-docs/architecture/system-overview.md*

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


---

## 7.2 Data Flow

*Source: reference-docs/architecture/data-flow.md*

# SpringAIS Data Flow Architecture

**Last Updated:** 2026-01-06
**Purpose:** Document how data flows through the entire system

---

## Overview

This document traces data flows for the 4 core user journeys:
1. **Employee Profile Creation** - Upload resume → Extract skills → Store profile
2. **Job Matching** - Get profile → Calculate similarity → Return ranked matches
3. **Career Path Visualization** - Get employee → Build graph → Display paths
4. **Success Pattern Analysis** - Query transitions → Aggregate metrics → Show insights

---

## 1. Employee Profile Creation Flow

### User Journey: "Upload My Resume"

```
┌─────────────┐
│   Browser   │ User clicks "Upload Resume"
└──────┬──────┘
       │ POST /api/employees/{id}/resume (multipart/form-data)
       │ File: resume.pdf, File size: 2.5 MB
       ↓
┌─────────────────────────────────────┐
│  FastAPI Endpoint                   │
│  routes/employees.py                │
│  - Validate file type (PDF/DOCX)    │
│  - Check size limit (10 MB max)     │
│  - Save to temp storage             │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  Skill Extraction Service           │
│  services/skill_extraction.py       │
│                                     │
│  1. Parse PDF/DOCX with PyPDF2      │
│  2. Extract text sections           │
│  3. Call OpenAI GPT-5.2 Instant:            │
│     "Extract skills from resume"    │
│  4. Parse JSON response             │
│  5. Normalize skills with O*NET     │
└──────────────┬──────────────────────┘
               │ Returns: ["Python", "SQL", "Data Analysis", ...]
               ↓
┌─────────────────────────────────────┐
│  Embedding Service                  │
│  services/embedding_service.py      │
│                                     │
│  1. Concatenate skills: "Python,    │
│     SQL, Data Analysis, ..."        │
│  2. Call OpenAI text-embedding-     │
│     3-large                         │
│  3. Get 3072-D vector               │
└──────────────┬──────────────────────┘
               │ Returns: [0.234, -0.891, 0.456, ...]
               ↓
┌─────────────────────────────────────┐
│  PostgreSQL (Transaction)           │
│                                     │
│  BEGIN;                             │
│  1. INSERT INTO employee_skills     │
│     VALUES (emp_id, skill_name)     │
│  2. INSERT INTO employee_embeddings │
│     VALUES (emp_id, vector)         │
│  3. UPDATE employees SET            │
│     resume_parsed = true            │
│  COMMIT;                            │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  Cache Invalidation                 │
│  Redis                              │
│                                     │
│  DEL matches:employee:{id}          │
│  DEL profile:employee:{id}          │
└──────────────┬──────────────────────┘
               │
               ↓ 200 OK {"skills": [...], "embedding_created": true}
┌─────────────┐
│   Browser   │ Display extracted skills in UI
└─────────────┘
```

**Performance:**
- Total time: ~15 seconds (GPT-5.2 Instant call dominates)
- Cached repeat: ~3 seconds (exact text cache hit)
- File limit: 10 MB, 50 pages max

**Error Handling:**
- Invalid file type → 400 Bad Request
- GPT-5.2 Instant timeout (>30s) → Retry 3x, then 500 error
- Skill extraction failure → Return partial results + warning

---

## 2. Job Matching Flow

### User Journey: "Show Me My Matches"

```
┌─────────────┐
│   Browser   │ User clicks "Match Results"
└──────┬──────┘
       │ GET /api/matches/employee/1
       │ Headers: Authorization: Bearer [jwt-token]
       ↓
┌─────────────────────────────────────┐
│  Auth Middleware                    │
│  middleware/auth.py                 │
│  - Verify JWT signature             │
│  - Extract employee_id from token   │
│  - Check employee_id == path param  │
└──────────────┬──────────────────────┘
               │ Authorized: employee_id = 1
               ↓
┌─────────────────────────────────────┐
│  Cache Check (Redis)                │
│                                     │
│  GET matches:employee:1             │
│                                     │
│  IF EXISTS:                         │
│    Return cached result (TTL 1hr)   │
│  ELSE:                              │
│    Continue to matching engine →   │
└──────────────┬──────────────────────┘
               │ CACHE MISS
               ↓
┌─────────────────────────────────────┐
│  Matching Service                   │
│  services/matching_service.py       │
│                                     │
│  1. Get employee embedding from DB  │
│  2. Vector similarity search:       │
│     SELECT job_id,                  │
│       1 - (embedding <=> $1)        │
│         AS similarity               │
│     FROM job_posting_embeddings     │
│     WHERE similarity > 0.6          │
│     ORDER BY similarity DESC        │
│     LIMIT 50;                       │
└──────────────┬──────────────────────┘
               │ Returns: 23 jobs with similarity > 0.6
               ↓
┌─────────────────────────────────────┐
│  Skill Gap Analysis                 │
│  services/matching_service.py       │
│                                     │
│  FOR EACH job:                      │
│    1. Get employee skills (array)   │
│    2. Get job required skills       │
│    3. Calculate:                    │
│       - Overlapping = intersection  │
│       - Missing = job - employee    │
│       - Transferable = semantic     │
│         similarity > 0.7            │
└──────────────┬──────────────────────┘
               │ Enriched job data with skill gaps
               ↓
┌─────────────────────────────────────┐
│  Success Pattern Service            │
│  services/success_pattern.py        │
│                                     │
│  FOR EACH job:                      │
│    1. Find employees who had        │
│       employee's role → job role    │
│    2. Calculate avg metrics:        │
│       - Time to transition          │
│       - Success rate                │
│       - Common skills               │
│    3. Compute pattern score         │
└──────────────┬──────────────────────┘
               │ Pattern scores: [0.82, 0.65, 0.91, ...]
               ↓
┌─────────────────────────────────────┐
│  Composite Scoring                  │
│  services/matching_service.py       │
│                                     │
│  composite_score =                  │
│    0.50 × skill_similarity +        │
│    0.25 × experience_match +        │
│    0.25 × success_pattern_score     │
│                                     │
│  Sort by composite_score DESC       │
│  Take top 10                        │
└──────────────┬──────────────────────┘
               │ Top 10 matches with scores
               ↓
┌─────────────────────────────────────┐
│  Cache Result (Redis)               │
│                                     │
│  SET matches:employee:1             │
│    JSON.stringify(matches)          │
│    EX 3600  # 1 hour TTL            │
└──────────────┬──────────────────────┘
               │
               ↓ 200 OK {matches: [...], count: 10}
┌─────────────┐
│   Browser   │ Display match cards with scores
└─────────────┘
```

**Performance:**
- Cold (no cache): ~800ms
  - Vector search: 60ms (HNSW index)
  - Skill gap (23 jobs): 200ms
  - Success pattern: 400ms
  - Scoring + sorting: 140ms
- Warm (cached): ~50ms (Redis GET)

**Caching Strategy:**
- TTL: 1 hour (matches don't change frequently)
- Invalidate on:
  - Employee skills updated
  - New job posting added
  - Employee applies to job

---

## 3. Career Path Visualization Flow

### User Journey: "Show My Career Options"

```
┌─────────────┐
│   Browser   │ User navigates to /career-path
└──────┬──────┘
       │ GET /api/career-paths/employee/1
       ↓
┌─────────────────────────────────────┐
│  Career Path Service                │
│  services/career_path.py            │
│                                     │
│  1. Get employee current role       │
│  2. Query transitions FROM role:    │
│     SELECT DISTINCT to_role_id,     │
│       COUNT(*) as transition_count, │
│       AVG(months_to_transition)     │
│     FROM career_transitions         │
│     WHERE from_role_id = $1         │
│     GROUP BY to_role_id;            │
└──────────────┬──────────────────────┘
               │ Returns: 12 possible next roles
               ↓
┌─────────────────────────────────────┐
│  Graph Builder                      │
│  services/career_path.py            │
│                                     │
│  1. Build node list:                │
│     - Current role (highlighted)    │
│     - Next 1-hop roles              │
│     - Next 2-hop roles (BFS)        │
│  2. Build edge list:                │
│     - from_role → to_role           │
│     - weight = transition_count     │
│  3. Calculate positions:            │
│     - Dagre layout algorithm        │
│     - Rank by career level          │
└──────────────┬──────────────────────┘
               │ Graph: {nodes: [...], edges: [...]}
               ↓
┌─────────────────────────────────────┐
│  Success Metrics Enrichment         │
│  services/success_pattern.py        │
│                                     │
│  FOR EACH edge:                     │
│    1. Get avg time to transition    │
│    2. Get success rate (%)          │
│    3. Get common skills             │
│    4. Get salary increase (%)       │
└──────────────┬──────────────────────┘
               │ Enriched graph with metrics
               ↓ 200 OK {graph: {...}, current_role_id: 1}
┌─────────────┐
│   Browser   │ React Flow renders graph
└─────────────┘
```

**Performance:**
- Graph generation: ~200ms
  - Transition query: 80ms (indexed)
  - BFS traversal: 60ms
  - Dagre layout: 40ms
  - Metric enrichment: 20ms

**Graph Limits:**
- Max depth: 3 hops
- Max nodes: 30 (to keep graph readable)
- Cache: 1 hour TTL per role

---

## 4. Success Pattern Analysis Flow

### User Journey: "What Makes People Successful?"

```
┌─────────────┐
│   Browser   │ User navigates to /success-patterns
└──────┬──────┘
       │ GET /api/success-patterns?from_role=5&to_role=12
       ↓
┌─────────────────────────────────────┐
│  Success Pattern Service            │
│  services/success_pattern.py        │
│                                     │
│  SQL Aggregation Query:             │
│  SELECT                             │
│    AVG(months_to_transition),       │
│    AVG(performance_score),          │
│    COUNT(*) FILTER (promoted)       │
│      / COUNT(*) as success_rate,    │
│    ARRAY_AGG(skills) as all_skills  │
│  FROM career_transitions ct         │
│  JOIN employees e ON ct.emp_id      │
│  WHERE from_role = 5                │
│    AND to_role = 12;                │
└──────────────┬──────────────────────┘
               │ Raw metrics: {avg_months: 18, success_rate: 0.68, ...}
               ↓
┌─────────────────────────────────────┐
│  Skill Frequency Analysis           │
│  services/success_pattern.py        │
│                                     │
│  1. Extract all_skills array        │
│  2. Count frequency per skill       │
│  3. Sort by frequency DESC          │
│  4. Take top 10 skills              │
│  5. Calculate % of successful       │
│     employees with each skill       │
└──────────────┬──────────────────────┘
               │ Top skills: [("Python", 92%), ("SQL", 88%), ...]
               ↓
┌─────────────────────────────────────┐
│  Comparison Metrics                 │
│  services/success_pattern.py        │
│                                     │
│  Compare:                           │
│  - Successful transitions           │
│    (promoted within 24 months)      │
│  - Unsuccessful transitions         │
│    (not promoted / left)            │
│                                     │
│  Calculate delta:                   │
│  - Performance score diff           │
│  - Skill count diff                 │
│  - Time to transition diff          │
└──────────────┬──────────────────────┘
               │ Comparison: successful avg 3.2 years faster
               ↓ 200 OK {metrics: {...}, top_skills: [...]}
┌─────────────┐
│   Browser   │ Recharts displays bar charts, line graphs
└─────────────┘
```

**Performance:**
- Aggregation query: ~50ms (indexed on from_role, to_role)
- Skill frequency: ~30ms (PostgreSQL array operations)
- Total: ~100ms

**Caching:**
- Cache per role pair: 24 hours (patterns stable)
- Invalidate on: New employee transitions added

---

## Database Query Patterns

### Hot Paths (Optimized with Indexes)

**1. Vector Similarity Search**
```sql
-- Index: HNSW (pgvector)
CREATE INDEX ON job_posting_embeddings
  USING hnsw (embedding_vector vector_cosine_ops);

-- Query: <100ms for 10K embeddings
SELECT job_id, 1 - (embedding <=> $1) AS similarity
FROM job_posting_embeddings
WHERE 1 - (embedding <=> $1) > 0.6
ORDER BY similarity DESC
LIMIT 50;
```

**2. Career Transitions**
```sql
-- Composite index for FROM role queries
CREATE INDEX idx_transitions_from_to
  ON career_transitions (from_role_id, to_role_id);

-- Query: <50ms for 5K transitions
SELECT to_role_id, COUNT(*), AVG(months_to_transition)
FROM career_transitions
WHERE from_role_id = $1
GROUP BY to_role_id;
```

**3. Employee Skills Lookup**
```sql
-- Index on employee_id
CREATE INDEX idx_employee_skills_emp_id
  ON employee_skills (employee_id);

-- Query: <10ms for 20 skills per employee
SELECT skill_name
FROM employee_skills
WHERE employee_id = $1;
```

---

## Caching Strategy Summary

| Data Type | TTL | Invalidate On | Storage |
|-----------|-----|---------------|---------|
| Match results | 1 hour | Skills updated, new job posted | Redis |
| Career paths | 1 hour | New transitions added | Redis |
| Success patterns | 24 hours | Bulk data import | Redis |
| Skill extraction | 24 hours | Resume re-uploaded | Redis |
| Auth tokens | 7 days | Logout | localStorage |

**Redis Memory Estimate:**
- 900 employees × 10 KB avg = 9 MB
- 50 job postings × 5 KB avg = 250 KB
- Total: ~10 MB peak (easily fits in 512 MB Redis)

---

## Error Handling Flows

### Network Errors (Frontend → Backend)
```
Browser → Backend API
    ↓ Network timeout (>10s)
    ↓
React Query retry policy:
1. Retry after 1s
2. Retry after 2s
3. Retry after 4s (max 3 retries)
    ↓ All retries fail
    ↓
Display error message:
"Unable to load matches. Please check your connection."
+ [Retry Button]
```

### LLM API Errors (Backend → OpenAI)
```
Backend → OpenAI API
    ↓ 429 Rate Limit Error
    ↓
Exponential backoff:
1. Wait 2s, retry
2. Wait 4s, retry
3. Wait 8s, retry (max 5 retries)
    ↓ Still failing
    ↓
Return 503 Service Unavailable:
{
  "error": "AI service temporarily unavailable",
  "retry_after": 60
}
```

### Database Connection Loss
```
Backend → PostgreSQL
    ↓ Connection refused
    ↓
SQLAlchemy pool retry:
1. Retry connection (5 attempts)
2. Exponential backoff (1s, 2s, 4s, 8s, 16s)
    ↓ Connection restored
    ↓
Resume normal operation
    ↓ Connection permanently lost
    ↓
Return 500 Internal Server Error
+ Log critical alert
```

---

## Performance Monitoring

### Key Metrics to Track

**API Endpoints:**
- `/api/matches/employee/{id}` - Target: <1s (p95)
- `/api/skill-extraction` - Target: <15s (p95)
- `/api/career-paths/employee/{id}` - Target: <300ms (p95)
- `/api/success-patterns` - Target: <200ms (p95)

**Database Queries:**
- Vector similarity: <100ms (p99)
- Skill lookup: <10ms (p99)
- Transition aggregation: <50ms (p99)

**Cache Hit Rates:**
- Match results: Target >80%
- Skill extraction: Target >60%
- Career paths: Target >70%

**LLM API:**
- GPT-5.2 Instant latency: <12s (p95)
- Embedding latency: <500ms (p95)
- Error rate: <1%

---

## Related Documentation

**Architecture:**
- `reference-docs/architecture/system-overview.md` - High-level system design
- `reference-docs/architecture/block-dependencies.md` - Block dependency graph

**Backend:**
- `reference-docs/backend/api-reference.md` - All API endpoints
- `reference-docs/backend/database-schema.md` - Complete database schema

**Frontend:**
- `reference-docs/frontend/state-management.md` - React Query patterns

**Integration:**
- `reference-docs/integration/api-contracts.md` - Frontend-backend contracts

---

**Document Purpose:** Trace data flows through the entire system
**Audience:** Developers debugging performance issues or understanding system behavior
**Last Updated:** 2026-01-06


---

## 7.3 Block Dependencies

*Source: reference-docs/architecture/block-dependencies.md*

# SpringAIS Block Dependencies

**Last Updated:** 2026-01-06
**Purpose:** Visual dependency graph for all 18 implementation blocks

---

## Overview

SpringAIS is implemented in **18 blocks** across **3 phases**:
- **Step 1:** SETUP (1 block) - Foundation
- **Step 2:** DEVELOPMENT (12 blocks) - Parallel feature development
- **Step 3:** INTEGRATION (5 blocks) - Connect everything together

This document shows which blocks depend on which, enabling parallel development.

---

## Dependency Graph

```
STEP 1: SETUP
═════════════════════════════════════════════════════════════════════
┌─────────────────────────────────────────────────────────────────┐
│  BLOCK: STEP-1-SETUP                                            │
│  • Docker Compose (PostgreSQL, Redis, Backend, Frontend)       │
│  • Database creation + pgvector extension                       │
│  • CORS configuration                                           │
│  • Basic health check endpoints                                 │
└─────────────────────────────────────────────────────────────────┘
      ↓              ↓              ↓              ↓
      (All Step 2 blocks depend on Step 1 Setup)


STEP 2: DEVELOPMENT (Parallel - 4 developers)
═════════════════════════════════════════════════════════════════════

Backend Track 1 (Data Generation)
──────────────────────────────────
┌──────────────────────┐
│  BLOCK A             │  Dependencies: STEP-1-SETUP
│  Synthetic Data Gen  │  Owner: Backend Dev 1
│  • 900 employees     │  Time: 3 days
│  • Role hierarchy    │
│  • Performance data  │
└──────────────────────┘

Backend Track 2 (Job Scraping)
──────────────────────────────
┌──────────────────────┐
│  BLOCK B             │  Dependencies: STEP-1-SETUP
│  Job Scraper         │  Owner: Backend Dev 1
│  • Scrape EY jobs    │  Time: 2 days
│  • Parse job posts   │
│  • Store in DB       │
└──────────────────────┘

Backend Track 3 (Database Models)
──────────────────────────────────
┌──────────────────────┐
│  BLOCK C             │  Dependencies: STEP-1-SETUP
│  Database Models     │  Owner: Backend Dev 2
│  • SQLAlchemy models │  Time: 2 days
│  • Relationships     │
│  • Alembic migrations│
└──────────────────────┘
           ↓
┌──────────────────────┐
│  BLOCK D             │  Dependencies: BLOCK C (models)
│  Vector Embeddings   │  Owner: Backend Dev 2
│  • OpenAI embedding  │  Time: 2 days
│  • pgvector storage  │
│  • HNSW indexes      │
└──────────────────────┘
           ↓
┌──────────────────────┐
│  BLOCK E             │  Dependencies: BLOCK D (embeddings)
│  Matching Engine     │  Owner: Backend Dev 3
│  • Cosine similarity │  Time: 3 days
│  • Skill gap analysis│
│  • Multi-factor score│
└──────────────────────┘

Backend Track 4 (Success Patterns)
──────────────────────────────────
┌──────────────────────┐
│  BLOCK F             │  Dependencies: BLOCK C (models)
│  Success Patterns    │  Owner: Backend Dev 2
│  • SQL aggregations  │  Time: 3 days
│  • Career transitions│
│  • Pattern discovery │
└──────────────────────┘

Backend Track 5 (Skill Extraction)
──────────────────────────────────
┌──────────────────────┐
│  BLOCK G             │  Dependencies: BLOCK C (models)
│  Skill Extraction    │  Owner: Backend Dev 3
│  • GPT-5.2 Instant parsing   │  Time: 4 days
│  • PDF/DOCX upload   │
│  • O*NET normalization│
└──────────────────────┘

Frontend Track 1 (Foundation)
──────────────────────────────
┌──────────────────────┐
│  BLOCK H             │  Dependencies: STEP-1-SETUP
│  Auth & Layout       │  Owner: Frontend Dev 1
│  • JWT auth          │  Time: 2 days
│  • Protected routes  │
│  • MainLayout        │
└──────────────────────┘
           ↓
       (All frontend UI blocks depend on Block H layout)
           ↓
    ┌──────┴──────┬──────────┬──────────┐
    ↓             ↓          ↓          ↓
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│ BLOCK I │  │ BLOCK J │  │ BLOCK K │  │ BLOCK L │
│ Skills  │  │ Match   │  │ Career  │  │ Success │
│Dashboard│  │ Results │  │ Viz     │  │Patterns │
│         │  │         │  │         │  │         │
│Owner:   │  │Owner:   │  │Owner:   │  │Owner:   │
│Frontend │  │Frontend │  │Frontend │  │Frontend │
│Dev 1    │  │Dev 2    │  │Dev 1    │  │Dev 2    │
│         │  │         │  │         │  │         │
│Time:    │  │Time:    │  │Time:    │  │Time:    │
│3 days   │  │3 days   │  │4 days   │  │3 days   │
└─────────┘  └─────────┘  └─────────┘  └─────────┘


STEP 3: INTEGRATION (Sequential)
═════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│  BLOCK M: Core Integration                                      │
│  • Connect auth to backend DB                                   │
│  • Real JWT tokens (not mock)                                   │
│  • Employee CRUD endpoints                                      │
│  Dependencies: BLOCK H (auth), BLOCK C (models)                 │
│  Owner: Full-stack Dev                                          │
│  Time: 2 days                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
     ┌────────────────────────┼────────────────────────┐
     ↓                        ↓                        ↓
┌──────────┐          ┌──────────┐          ┌──────────┐
│ BLOCK N  │          │ BLOCK O  │          │ BLOCK P  │
│ Skills   │          │ Matching │          │ Viz      │
│Integration│         │Integration│         │Integration│
│          │          │          │          │          │
│Connect:  │          │Connect:  │          │Connect:  │
│Block I → │          │Block J → │          │Block K,L→│
│Block G   │          │Block E,F │          │Block F   │
│          │          │          │          │          │
│Owner:    │          │Owner:    │          │Owner:    │
│Frontend  │          │Frontend  │          │Frontend  │
│Dev 1     │          │Dev 2     │          │Dev 1     │
│          │          │          │          │          │
│Time:     │          │Time:     │          │Time:     │
│2 days    │          │2 days    │          │2 days    │
└──────────┘          └──────────┘          └──────────┘
     │                        │                        │
     └────────────────────────┼────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  BLOCK Q: E2E Testing & Polish                                  │
│  • Playwright E2E tests                                         │
│  • Performance optimization                                     │
│  • OWASP security scan                                          │
│  • Demo preparation                                             │
│  Dependencies: ALL blocks (final integration)                   │
│  Owner: Entire team                                             │
│  Time: 3 days                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Parallelization Strategy

### Week 1-2: Setup + Backend Foundation (4 people)

**Dev 1 (Backend - Data):**
- Day 1-3: BLOCK A (Synthetic Data)
- Day 4-5: BLOCK B (Job Scraper)

**Dev 2 (Backend - Database):**
- Day 1-2: BLOCK C (Database Models)
- Day 3-4: BLOCK D (Vector Embeddings)
- Day 5-7: BLOCK F (Success Patterns)

**Dev 3 (Backend - AI/ML):**
- Day 1-3: BLOCK E (Matching Engine) - wait for Block D
- Day 4-7: BLOCK G (Skill Extraction)

**Dev 4 (Frontend - Foundation):**
- Day 1-2: BLOCK H (Auth & Layout)
- Day 3-5: BLOCK I (Skills Dashboard)

### Week 3-4: Frontend + Integration (4 people)

**Dev 1 (Frontend):**
- Day 1-3: BLOCK K (Career Visualization)
- Day 4-5: BLOCK N (Skills Integration)
- Day 6-7: BLOCK P (Viz Integration)

**Dev 2 (Frontend):**
- Day 1-3: BLOCK J (Match Results)
- Day 4-5: BLOCK L (Success Pattern UI)
- Day 6-7: BLOCK O (Matching Integration)

**Dev 3 (Full-stack):**
- Day 1-2: BLOCK M (Core Integration)
- Day 3-5: Help with integration blocks (N, O, P)
- Day 6-7: BLOCK Q (E2E Testing)

**Dev 4 (Full-stack):**
- Day 1-2: BLOCK M (Core Integration) - pair with Dev 3
- Day 3-5: Help with integration blocks
- Day 6-7: BLOCK Q (E2E Testing)

### Week 5-6: Testing, Polish, Demo Prep (All 4)

**Entire Team:**
- BLOCK Q (E2E Testing & Polish)
- Performance optimization
- Security hardening
- Demo script preparation

---

## Critical Path Analysis

**Longest dependency chain:**
```
STEP-1-SETUP (1 day)
    → BLOCK C: Database Models (2 days)
    → BLOCK D: Vector Embeddings (2 days)
    → BLOCK E: Matching Engine (3 days)
    → BLOCK M: Core Integration (2 days)
    → BLOCK O: Matching Integration (2 days)
    → BLOCK Q: E2E Testing (3 days)

TOTAL: 15 days (3 weeks)
```

**With parallelization:** 5-6 weeks total (buffer for integration issues)

---

## Dependency Rules

### Hard Dependencies (MUST wait)

1. **All blocks → STEP-1-SETUP**
   - Cannot start any block until Docker environment is ready

2. **BLOCK D → BLOCK C**
   - Vector embeddings need database models defined first

3. **BLOCK E → BLOCK D**
   - Matching engine needs embeddings stored in DB

4. **BLOCK I, J, K, L → BLOCK H**
   - All frontend UI blocks need auth + layout structure

5. **BLOCK M → BLOCK H + BLOCK C**
   - Core integration needs both frontend auth and backend models

6. **BLOCK N → BLOCK M + BLOCK I + BLOCK G**
   - Skills integration needs core auth + UI + backend service

7. **BLOCK O → BLOCK M + BLOCK J + BLOCK E + BLOCK F**
   - Matching integration needs core auth + UI + matching + patterns

8. **BLOCK P → BLOCK M + BLOCK K + BLOCK L + BLOCK F**
   - Viz integration needs core auth + UI + success patterns

9. **BLOCK Q → ALL blocks**
   - Final testing needs entire system working

### Soft Dependencies (Recommended but flexible)

1. **BLOCK F → BLOCK A**
   - Success patterns work better with synthetic data, but can use minimal seed data

2. **BLOCK E → BLOCK A, BLOCK B**
   - Matching engine works better with real data, but can test with minimal data

3. **BLOCK G → BLOCK A**
   - Skill extraction can be tested with sample resumes before full data ready

---

## Integration Points

### Backend → Backend

| From Block | To Block | Integration Point | Data Passed |
|------------|----------|-------------------|-------------|
| Block D | Block E | Embedding retrieval | 3072-D vectors |
| Block C | Block F | Employee transitions | Role history |
| Block G | Block D | Skill text | Raw skill strings → embeddings |

### Frontend → Backend

| From Block | To Block | Integration Point | API Endpoint |
|------------|----------|-------------------|--------------|
| Block I | Block G | Resume upload | POST /api/skill-extraction |
| Block J | Block E | Get matches | GET /api/matches/employee/{id} |
| Block K | Block F | Career paths | GET /api/career-paths/employee/{id} |
| Block L | Block F | Success metrics | GET /api/success-patterns |

### Frontend → Frontend

| From Block | To Block | Integration Point | Shared Component |
|------------|----------|-------------------|------------------|
| Block H | Block I, J, K, L | Layout wrapper | MainLayout |
| Block H | All | Auth context | useAuth() hook |
| Block I | Block J | Skill data | SkillBadge component |

---

## Mock Data Strategy

### Blocks That Can Use Mock Data (During Development)

**Block H (Auth & Layout):**
```javascript
// Mock login response
{
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock",
  user: {id: 1, name: "John Doe", role: "Consultant"}
}
```

**Block I (Skills Dashboard):**
```javascript
// Mock employee skills
{
  employee_id: 1,
  skills: ["Python", "SQL", "Data Analysis"],
  experience_years: 5
}
```

**Block J (Match Results):**
```javascript
// Mock matches
{
  matches: [
    {
      job_id: 42,
      title: "Senior Data Analyst",
      similarity_score: 0.87,
      overlapping_skills: ["Python", "SQL"],
      missing_skills: ["Tableau"]
    }
  ]
}
```

**Block K (Career Visualization):**
```javascript
// Mock career graph
{
  nodes: [
    {id: 1, label: "Analyst", level: 1},
    {id: 2, label: "Senior Analyst", level: 2}
  ],
  edges: [
    {from: 1, to: 2, transition_count: 45}
  ]
}
```

**Block L (Success Pattern UI):**
```javascript
// Mock success metrics
{
  success_rate: 0.72,
  avg_time_months: 18,
  top_skills: ["Python", "SQL", "Tableau"]
}
```

### Blocks That Need Real Backend (No Mocking)

- **Block A, B, C, D, E, F, G** - All backend blocks need real DB
- **Block M, N, O, P** - Integration blocks by definition
- **Block Q** - E2E testing needs full system

---

## Risk Mitigation

### Critical Dependency Risks

**Risk 1: Block D (Vector Embeddings) Delays Matching**
- **Impact:** Blocks E, O delayed (critical path)
- **Mitigation:**
  - Allocate most experienced backend dev to Block D
  - Create minimal embedding service first (happy path only)
  - Add error handling later

**Risk 2: Block H (Auth & Layout) Delays All Frontend**
- **Impact:** Blocks I, J, K, L cannot start
- **Mitigation:**
  - Start Block H on Day 1 (highest priority)
  - Create MainLayout shell first (empty sidebar/header)
  - Frontend devs can build UI components in isolation, integrate later

**Risk 3: Block M (Core Integration) Bottleneck**
- **Impact:** Blocks N, O, P blocked
- **Mitigation:**
  - Assign 2 devs to Block M (pair programming)
  - Pre-define API contracts before Block M starts
  - Frontend blocks can continue with mock data if Block M delayed

---

## Block Completion Criteria

Each block is considered "complete" when:

1. ✅ All tasks in `TASKS.md` checked off
2. ✅ All verification steps in `VERIFICATION.md` passing
3. ✅ Code merged to `main` branch
4. ✅ Documentation updated (API docs, README)
5. ✅ Demo-able (can show working feature to team)

**Important:** Blocks can be "complete enough" to unblock downstream blocks even if polish remains.

Example: Block C (Database Models) can unblock Block D once models are defined, even if Alembic migrations aren't perfect yet.

---

## Related Documentation

**Implementation Tracking:**
- `implementation-tracking/PROJECT-STATUS.md` - Overall progress tracker
- `implementation-tracking/STEP-*/BLOCK-*/TASKS.md` - Detailed task lists

**Architecture:**
- `reference-docs/architecture/system-overview.md` - System design
- `reference-docs/architecture/data-flow.md` - Data flow diagrams

**Integration:**
- `reference-docs/integration/api-contracts.md` - Frontend-backend contracts

---

**Document Purpose:** Enable parallel development by showing block dependencies
**Audience:** Project manager, developers planning work
**Last Updated:** 2026-01-06


---

## 7.4 Backend Architecture

*Source: _bmad-output/architecture-backend.md*

# SpringAIS Backend Architecture

**Generated**: 2026-02-11
**Source**: `backend/` directory scan findings

---

## 1. High-Level Architecture

The backend is a monolithic FastAPI application following a layered architecture pattern: Routes (API) -> Services (Business Logic) -> Models (Data Access). It uses SQLAlchemy 2.0 as ORM, PostgreSQL with pgvector for vector search, Redis for multi-layer caching, and OpenAI for AI capabilities.

```
                         ┌───────────────────────────┐
                         │      FastAPI App           │
                         │      (main.py)             │
                         │  Middleware: CORS, GZip    │
                         └────────────┬──────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                   │
           ┌────────┴────────┐ ┌─────┴──────┐ ┌────────┴────────┐
           │  Auth Routes    │ │ API Routes │ │  HM Routes      │
           │  /auth/*        │ │  /api/*    │ │  /api/hm/*      │
           └────────┬────────┘ └─────┬──────┘ └────────┬────────┘
                    │                │                   │
                    └────────────────┼───────────────────┘
                                     │
                         ┌───────────┴───────────┐
                         │    Services Layer     │
                         │    (20 files)         │
                         │  matching_service     │
                         │  embedding_service    │
                         │  skill_extractor      │
                         │  pattern_service      │
                         │  roadmap_service      │
                         │  ...                  │
                         └───────┬───────┬───────┘
                                 │       │
                    ┌────────────┘       └────────────┐
                    │                                  │
           ┌────────┴────────┐              ┌─────────┴────────┐
           │   SQLAlchemy    │              │   External APIs   │
           │   Models (15)   │              │  OpenAI, Redis    │
           │   PostgreSQL    │              │                   │
           └─────────────────┘              └──────────────────┘
```

---

## 2. API Layer (Routes)

### Router Mounting (`main.py`)

```python
app.include_router(auth_router)                    # /auth/*
app.include_router(match_router, prefix="/api")    # /api/matches/*
app.include_router(skills_router, prefix="/api")   # /api/skills/*
app.include_router(patterns_router, prefix="/api") # /api/patterns/*
app.include_router(roadmap_router, prefix="/api")  # /api/roadmap/*
app.include_router(hiring_manager_router, prefix="/api")  # /api/hm/*
```

### Middleware Stack

1. **GZipMiddleware**: Compresses responses > 500 bytes (configurable `minimum_size`)
2. **CORSMiddleware**: Allows `http://localhost:3000`, all methods, all headers, credentials enabled

### Route Files

| File | Prefix | Lines | Auth | Description |
|------|--------|-------|------|-------------|
| `auth.py` | `/auth` | ~150 | Public | Registration, login, profile |
| `matches.py` | `/api/matches` | ~400 | Required | Match finding, saving, deep analysis |
| `skills.py` | `/api/skills` | ~1800 | Required | Skill management, modules, extraction, grouping |
| `patterns.py` | `/api/patterns` | ~300 | Mixed | Career pattern analysis, graph generation |
| `roadmap.py` | `/api/roadmap` | ~1150 | Required | Roadmap generation, progress, chat, editing |
| `hiring_manager.py` | `/api/hm` | ~200 | HM only | Job browsing, candidate interest (anonymized) |

### Authentication Flow

1. User sends `POST /auth/login` with email and password
2. Backend verifies password against bcrypt hash in `user_profiles` table
3. Returns JWT token (HS256, 7-day expiry) with payload `{user_id, email, exp}`
4. All authenticated routes use `get_current_user_from_token()` FastAPI dependency
5. Dependency extracts token from `Authorization: Bearer {token}` header via `HTTPBearer`
6. Token verified using PyJWT with `JWT_SECRET_KEY`
7. User profile loaded from database using `user_id` from token payload

### Hiring Manager Authorization

Hiring manager endpoints additionally check `user.account_type == "hiring_manager"` before processing.

---

## 3. Service Layer

The service layer contains all business logic. Services are initialized per-request with database sessions and user context.

### Core Services

| Service | File | Lines | Description |
|---------|------|-------|-------------|
| **MatchingService** | `matching_service.py` | ~1420 | Core matching algorithm (80/10/10 scoring) |
| **EmbeddingService** | `embedding_service.py` | ~400 | Vector embedding generation and caching |
| **SkillExtractor** | `skill_extractor.py` | ~350 | Resume skill extraction via LLM |
| **SuccessPatternService** | `pattern_service.py` | ~1377 | Career transition pattern analysis |
| **RoadmapService** | `roadmap_service.py` | ~500 | AI-powered roadmap generation |
| **SkillProgressService** | `skill_progress_service.py` | ~709 | Skill learning progress tracking |
| **DeepAnalysisService** | `analysis_service.py` | ~200 | GPT-5.2 deep match analysis |
| **HiringManagerService** | `hiring_manager_service.py` | ~300 | Anonymized candidate data |

### Supporting Services

| Service | File | Description |
|---------|------|-------------|
| **SkillTaxonomyService** | `skill_taxonomy.py` | 50+ skill relationships with parent/child/alias resolution |
| **SkillNormalizerCache** | `skill_normalizer.py` | Skill name normalization and deduplication |
| **SkillGroupingService** | `skill_grouping_service.py` | AI-powered skill categorization |
| **RecommendationService** | `recommendation_service.py` | Skill recommendations from matches, goals, LLM |
| **MatchCacheService** | `match_cache_service.py` | Redis match result caching with version invalidation |
| **IncrementalMatchService** | `incremental_match_service.py` | Recalculate only affected matches on skill change |
| **LearningContentService** | `learning_content_service.py` | AI-generated learning guides and proof review |
| **JobSkillExtractorService** | `job_skill_extractor.py` | Batch LLM skill extraction for job postings |
| **JobImportService** | `job_import_service.py` | Embedding enrichment during job import |
| **RoadmapProgressService** | `roadmap_progress_service.py` | Milestone tracking, edit audit trail |
| **ResumeParser** | `resume_parser.py` | PDF, DOCX, TXT file parsing |

### Singleton Patterns

The following services use module-level singleton patterns:
- `AsyncOpenAI` client (`config.py`)
- Redis connection pool (`config.py`)
- `SkillTaxonomyService` instance (`skill_taxonomy.py`)
- `SkillNormalizerCache` instance (`skill_normalizer.py`)
- `MatchCacheService` instance (`match_cache_service.py`)

### Lazy Loading

The `services/__init__.py` uses `__getattr__` for lazy imports, avoiding heavy import costs at application startup.

---

## 4. AI/ML Pipeline

### OpenAI Model Selection

| Model | Temperature | Max Tokens | Use Cases |
|-------|------------|------------|-----------|
| `gpt-5.2` | N/A | 12000 | Deep analysis, roadmap generation (`reasoning_effort="medium"`) |
| `gpt-5.2-chat-latest` | 0.3 | 4000 | Skill extraction, grouping, learning content, chat |
| `gpt-5-nano` | Default | Default | Lightweight recommendation bootstrapping |
| `text-embedding-3-large` | N/A | N/A | Vector embeddings (3072 dims, PCA to 1536) |

### Embedding Pipeline

1. **Input**: Skill text, resume text, or job description
2. **Cache check**: Redis exact-match lookup (7-day TTL)
3. **API call**: OpenAI `text-embedding-3-large` produces 3072-dimension vectors
4. **PCA reduction**: scikit-learn PCA transforms 3072 -> 1536 dimensions
5. **Storage**: `skill_embeddings` table with HNSW index, or model-specific Vector(1536) columns
6. **Cache store**: Result cached in Redis with 7-day TTL

PCA model is pre-trained via `scripts/train_pca_model.py` and stored at `backend/backend/models/pca/pca_v1.pkl`.

### Matching Algorithm (80/10/10)

**Skill Match (80% weight)** - Four-layer approach:
1. **Taxonomy match**: `SkillTaxonomyService.calculate_skill_coverage()` checks parent/child/alias relationships. Scores: direct=1.0, implied=0.85, parent=0.80, related=0.70
2. **Exact string match**: Case-insensitive direct comparison
3. **pgvector HNSW search**: Cosine distance `<=>` operator. Matched >= 0.65, Transferable >= 0.50
4. **Fuzzy token Jaccard**: Fallback for remaining unmatched skills

**Experience Match (10% weight)**: Penalizes under/over-qualification based on years of experience vs. job requirements.

**Role Fit (10% weight)**: Cosine similarity between `user_profiles.resume_embedding` and `job_postings.description_embedding`.

### Skill Extraction Pipeline

1. Resume text parsed (PDF/DOCX/TXT via `resume_parser.py`)
2. PII stripped (`text_cleaner.py` - emails, phones, URLs, addresses, names)
3. Text chunked if > 3500 tokens (tiktoken)
4. Sent to `gpt-5.2-chat-latest` with structured prompt
5. Returns `{listed_skills, inferred_skills}` across 16 categories
6. Category fallback mapping for invalid LLM-returned categories
7. Stored in `user_profile.llm_listed_skills` and `llm_inferred_skills`

---

## 5. Data Layer

### Database Configuration

- **Engine**: PostgreSQL 16 with pgvector extension
- **Driver**: psycopg3 (`postgresql+psycopg://` dialect)
- **ORM**: SQLAlchemy 2.0 with `DeclarativeBase` and `MappedColumn`
- **Connection pool**: `QueuePool(pool_size=20, max_overflow=30, pool_recycle=1800, pool_pre_ping=True)`
- **Session**: `autocommit=False, autoflush=False`, yielded per-request via `get_db()` dependency
- **Table creation**: `Base.metadata.create_all(bind=engine)` on app startup (FastAPI lifespan)

### Database Schema (16 tables)

See `data-models-backend.md` for full schema documentation.

### Index Strategy

| Index Type | Tables | Purpose |
|------------|--------|---------|
| **HNSW** | `skill_embeddings.embedding` | O(log N) vector similarity search (cosine distance) |
| **GIN** | `job_postings.required_skills`, `preferred_skills`, `tags`, `search_vector`; `employees.skills`, `career_history` | JSONB containment and full-text search |
| **BRIN** | `job_postings.created_at` | Time-range queries on append-only timestamps |
| **B-tree** | Various PKs, FKs, `is_active+posted_date` | Standard lookups and joins |
| **TSVECTOR** | `job_postings.search_vector` | PostgreSQL full-text search |

### Migrations

26 Alembic migrations from initial schema through hiring manager support. Key milestones:
- 001: Initial schema (employees, job_postings, matches, user_profiles, career_paths)
- 017: Skill embeddings table + pgvector extension
- 018: Skill progress tables (user_skills, skill_modules, user_module_progress)
- 020: Saved roadmaps
- 026: Hiring manager tables

---

## 6. Caching Strategy

### Redis Cache Layers

| Layer | Key Pattern | TTL | Purpose |
|-------|------------|-----|---------|
| Match results | `matches:{user_id}:{params_hash}` | 5 min | Avoid re-running matching algorithm |
| Skill versions | `skill_version:{user_id}` | 1 hour | Match cache invalidation trigger |
| Embedding cache (L1) | `emb:exact:{hash}` | 7 days | Avoid duplicate OpenAI API calls |
| Pattern cache | `patterns:{hash}` | 24 hours | Career transition analysis results |
| Job skill extraction | `job_skills:{sha256_hash}` | 30 days | LLM-extracted skills per job |

### In-Memory Caches

| Cache | Location | TTL | Max Size |
|-------|----------|-----|----------|
| Global embedding cache | `matching_service.py` | 5 min | Unbounded (thread-locked) |
| Skill taxonomy expansion | `skill_taxonomy.py` | None | 1000 entries (LRU) |
| Skill normalizer | `skill_normalizer.py` | None | Unbounded |

### Cache Invalidation

1. **Match cache**: Per-user invalidation via `invalidate_user_cache(user_id)` which deletes all `matches:{user_id}:*` keys and bumps `skill_version:{user_id}`. Triggered as FastAPI `BackgroundTask` after skill updates.
2. **Embedding cache**: Natural 7-day TTL expiry (no active invalidation)
3. **Pattern cache**: Manual via `POST /api/patterns/cache/invalidate` + local dict fallback

---

## 7. Background Processing

FastAPI `BackgroundTasks` are used for non-blocking operations that execute after the HTTP response is sent:

| Trigger | Background Task |
|---------|----------------|
| Resume upload / skill update | `vectorize_user_skills_and_resume()` - Batch embed user skills and resume |
| Match saved | Recommendation refresh |
| Skill proficiency change | Match cache invalidation, incremental match recalculation |
| Job import | `batch_enrich_jobs()` - Parallel embedding generation |

---

## 8. Security

### Authentication

- **Password hashing**: bcrypt via `hash_password()` / `verify_password()`
- **JWT tokens**: PyJWT with HS256 algorithm, 7-day expiry
- **Token delivery**: Returned in login response body (not cookies)
- **Route protection**: `get_current_user_from_token()` FastAPI dependency using `HTTPBearer` scheme

### PII/Bias Mitigation

- Resume text is PII-stripped before LLM processing (`text_cleaner.py`)
- Removes: emails, phones, URLs, addresses, candidate names
- Optional aggressive mode: obscures prestigious institution names
- Hiring manager endpoints return ONLY anonymized candidate data (no names, emails, identifiers)

### Configuration

| Variable | Purpose | Default |
|----------|---------|---------|
| `JWT_SECRET_KEY` | Token signing key | `""` (errors if empty) |
| `JWT_ALGORITHM` | Signing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_DAYS` | Token lifespan | `7` |

---

## 9. Error Handling

- **OpenAI API**: Exponential backoff retry logic in embedding and analysis services
- **Database**: SQLAlchemy session cleanup via `finally` blocks in `get_db()` dependency
- **Redis**: Pattern service falls back to local dict cache when Redis is unavailable
- **File uploads**: Max 10MB size enforcement, supported types validated (.pdf, .docx, .txt)
- **No global exception handler**: Individual routes handle errors with try/except blocks

---

## 10. Entry Point and Startup

### Application Bootstrap (`main.py`)

1. FastAPI app created with `lifespan` context manager
2. On startup: `Base.metadata.create_all(bind=engine)` creates tables
3. Middleware registered: GZip, CORS
4. Routers mounted with prefixes
5. Root endpoint `GET /` returns `{"status": "running", "version": "1.0.0"}`

### Uvicorn Server

- **Production**: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- **Development**: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000` (via docker-compose command override)


---

## 7.5 Frontend Architecture

*Source: _bmad-output/architecture-frontend.md*

# SpringAIS Frontend Architecture

**Generated**: 2026-02-11
**Source**: `frontend/` directory scan findings

---

## 1. High-Level Architecture

The frontend is a React 18 single-page application written in TypeScript (with some JSX for skills components). It follows a context-driven state management pattern with a service layer for API communication.

```
                    ┌────────────────────────────────┐
                    │           App.tsx               │
                    │   Provider Hierarchy + Routes   │
                    └────────────┬───────────────────┘
                                 │
                    ┌────────────┴───────────────────┐
                    │       Context Providers (9)     │
                    │  Auth, Theme, Adventure,        │
                    │  Matches, Skills, Roadmap,      │
                    │  CareerPath, HM, Notification   │
                    └────────────┬───────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                    │
     ┌────────┴────────┐  ┌─────┴──────┐  ┌────────┴────────┐
     │  Layout Layer   │  │   Pages    │  │  Components     │
     │  MainLayout     │  │  9 pages   │  │  76 components  │
     │  HMLayout       │  │  (lazy)    │  │  10 directories │
     │  Sidebar/Header │  └─────┬──────┘  └────────┬────────┘
     └─────────────────┘        │                   │
                                └───────┬───────────┘
                                        │
                              ┌─────────┴──────────┐
                              │   Services Layer   │
                              │   9 service files  │
                              │   Axios APIClient  │
                              └─────────┬──────────┘
                                        │
                                        v
                              ┌─────────────────────┐
                              │  FastAPI Backend     │
                              │  http://localhost:8000│
                              └─────────────────────┘
```

---

## 2. Component Hierarchy

### Provider Tree (App.tsx)

```
QueryClientProvider (TanStack React Query)
  └── AuthProvider
      └── ThemeProvider
          └── AdventureProvider
              └── MatchesProvider
                  └── SkillsProvider
                      └── NotificationProvider
                          └── BrowserRouter
                              └── Routes (React Router v6)
```

### Layout Structure

**Personal Account Layout** (`MainLayout.tsx`):
```
┌─────────────────────────────────────────┐
│  Header (user greeting, ThemeSwitcher)  │
├────────┬────────────────────────────────┤
│        │                                │
│ Sidebar│       Page Content             │
│ (nav)  │       (lazy loaded)            │
│        │                                │
├────────┴────────────────────────────────┤
│  [AdventureHUD + NotificationToasts]    │  (when adventure mode enabled)
└─────────────────────────────────────────┘
```

**Hiring Manager Layout** (`HMLayout.tsx`):
```
┌─────────────────────────────────────────┐
│  Header                                 │
├────────┬────────────────────────────────┤
│ HM     │                                │
│ Sidebar│       HM Page Content          │
│ (nav)  │                                │
└────────┴────────────────────────────────┘
```

### Component Directory Map

```
components/
├── auth/              (4 files)  Login, Register, ForgotPassword, Logout
├── common/            (2 files)  ProgressRing, SkillTag (shared UI atoms)
├── career-viz/       (10 files)  Career graph (ReactFlow), layout utils, transforms
├── game/              (8 files)  Adventure HUD, achievements, coin flip, themed UI
├── layout/            (8 files)  MainLayout, HMLayout, Sidebar, Header, route guards
├── matches/           (9 files)  Match cards, filters, sort, virtual list, details modal
├── roadmap/          (11 files)  Roadmap viewer, tabs, milestones, chat assistant, editing
├── role-detail/       (5 files)  Role overview, skill gap, path planning, success patterns
├── skills/           (11 files)  Dashboard, categories, modules, resume upload, search
└── successPatterns/   (8 files)  Charts (Recharts), filters, sortable widgets (dnd-kit)
```

---

## 3. Routing Configuration

All routes use `React.lazy()` with `Suspense` fallback for code splitting.

### Personal Routes (requires auth, account_type = "personal")

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `DashboardPage` | Personal dashboard |
| `/matches` | `MatchesPage` | Job match results with progressive loading |
| `/match/:matchId` | `MatchDetailPage` | Detailed match view with deep analysis |
| `/role/:roleId` | `RoleDetailPage` | Role detail with tabs (Overview, Skills Gap, Path To, Patterns) |
| `/skills` | `SkillsPage` | Skills portfolio and learning dashboard |
| `/career-path` | `CareerPathPage` | Interactive career graph visualization |
| `/roadmap/:matchId` | `RoadmapPage` | AI-generated career roadmap viewer |
| `/success-patterns` | `SuccessPatternsPage` | Career transition analytics |

### Hiring Manager Routes (requires auth, account_type = "hiring_manager")

| Path | Component | Description |
|------|-----------|-------------|
| `/hm` | `HMDashboardPage` | Hiring manager dashboard |
| `/hm/candidates` | `HMCandidatesPage` | Anonymized candidate management |
| `/hm/matches` | `HMMatchesPage` | Job-candidate matches |
| `/hm/analytics` | `HMAnalyticsPage` | Hiring analytics |

### Public Routes

| Path | Component |
|------|-----------|
| `/login` | `LoginPage` |
| `/register` | `RegisterPage` |
| `/forgot-password` | `ForgotPasswordPage` |

### Route Guards

- **`ProtectedRoute`**: Checks `useAuth().isAuthenticated`, redirects to `/login` if false
- **`AccountTypeRoute`**: Checks `useAuth().user.accountType`, redirects personal users away from `/hm/*` routes and vice versa

---

## 4. State Management

### Context Provider Details

| Context | State | Key Methods | Persistence |
|---------|-------|-------------|-------------|
| **AuthContext** | user, token, isAuthenticated, isLoading | login(), register(), logout() | localStorage (JWT token) |
| **ThemeContext** | theme ('light'/'dark'/'game'), isDark, isGame | setTheme() | localStorage |
| **AdventureContext** | xp, gold, level, achievements, loginStreak, notifications, isAdventureMode | addXP(), addGold(), spendGold(), unlockAchievement(), completeMiniGame(), toggleAdventureMode() | localStorage |
| **MatchesContext** | matches[], allMatches[], isLoading, hasMore, savedMatches[] | loadMatches(), loadMoreMatches(), saveMatch(), unsaveMatch(), getMatchById() | 5-min memory cache |
| **SkillsContext** | skills[], selectedSkill, filterTab, searchQuery, skillCategories[] | addSkill(), updateSkill(), clearSkills(), fetchSkillsWithProgress(), generateSkillGroupings(), markSkillComplete() | None |
| **RoadmapContext** | roadmap, isLoading, error, editMode, chatMessages[] | generateRoadmap(), toggleMilestone(), addExtra(), removeExtra(), sendChatMessage(), applyAIEdits(), previewAIEdits() | None |
| **CareerPathContext** | graphData, selectedNode, goalNode | setGoalNode(), fetchGraph() | None |
| **HMContext** | candidates[], jobs[], analytics | fetchCandidates(), fetchJobs(), fetchAnalytics() | None |
| **NotificationContext** | notifications[], unreadCount | addNotification(), markRead(), clearAll() | None |

The RoadmapContext is the most complex, using `useReducer` with 17 action types for managing roadmap state, AI edits, and chat messages.

### TanStack React Query Configuration

Configured in `App.tsx` with:
- `staleTime`: 5 minutes
- `gcTime`: 10 minutes
- `refetchOnWindowFocus`: false

---

## 5. API Client Layer

### Primary Client (`lib/api.ts`)

The `APIClient` class wraps Axios with:
- **Base URL**: `VITE_API_URL` env var (default `http://localhost:8000`) with `/api` auto-appended
- **Auth interceptor**: Injects `Authorization: Bearer {token}` header from localStorage on every request
- **401 interceptor**: Auto-clears token and user from localStorage, redirects to `/login`
- **Network error handling**: Overrides error messages when `!error.response`
- **Methods**: `get<T>()`, `post<T>()`, `put<T>()`, `delete<T>()`, `patch<T>()`

### Auth Service (`services/authService.ts`)

Uses a **separate** Axios instance with:
- Base URL: `VITE_API_URL || 'http://localhost:8000'` (no `/api` suffix)
- Calls auth endpoints at `/auth/*` directly
- This is because the backend auth router is mounted without the `/api` prefix

### Service Files

| Service | Endpoints Called |
|---------|----------------|
| `authService.ts` | POST /auth/login, POST /auth/register, GET /auth/me |
| `matchService.ts` | GET /matches/employee/{id}, GET /matches/saved, POST /matches/save, DELETE /matches/saved/{id}, GET /matches/job/{id}/deep-analysis |
| `skillService.ts` | GET /skills, POST /skills, POST /skills/upload, GET/POST /skills/groupings |
| `skillProgressService.ts` | GET /skills/me/progress, POST /skills/{name}/start, PATCH /skills/{name}/modules/{id}/progress, POST /skills/{name}/modules/{id}/complete, POST /skills/{name}/modules/{id}/generate-content, POST /skills/{name}/modules/{id}/upload-proof, and 8 more |
| `careerGraphService.ts` | GET /career-graph |
| `roadmapService.ts` | POST /roadmap/generate, GET /roadmap/saved, GET/DELETE /roadmap/saved/{id}, POST /roadmap/saved/{id}/milestones/{id}/toggle, POST /roadmap/saved/{id}/chat/enhanced, POST /roadmap/saved/{id}/edit/ai, POST /roadmap/saved/{id}/edit/apply, and more |
| `successPatternService.ts` | GET /patterns/transitions (with filter query params) |
| `hmService.ts` | GET /hm/candidates, GET /hm/jobs, GET /hm/analytics |

---

## 6. Build and Bundle Configuration

### Vite Configuration (`vite.config.ts`)

- **Path alias**: `@` maps to `./src`
- **Dev server**: Port 3000, host `0.0.0.0`
- **No API proxy**: Frontend connects directly via `VITE_API_URL` (CORS required)
- **Test**: Vitest configuration embedded

### TypeScript Configuration (`tsconfig.json`)

- **Strict mode**: Enabled
- **Path alias**: `@/*` maps to `./src/*`
- **Target**: ES2020+

### PostCSS Configuration

- Uses `@tailwindcss/postcss` (TailwindCSS v4 approach)
- TailwindCSS v4 uses `@theme` directive instead of `tailwind.config.js` `theme.extend`

### Docker Configuration

**Development** (current Dockerfile):
- Base: `node:18-alpine`
- Runs `npm run dev -- --host` (Vite dev server)
- Bind mount for hot reload
- Named volume for `node_modules` isolation

**Production** (referenced but not wired):
- Multi-stage build: Node 20 build stage + nginx:alpine serve stage
- Serves built assets on port 80

---

## 7. Testing Strategy

### Framework

- **Unit/Component**: Vitest + React Testing Library
- **E2E**: Playwright listed in root `package.json` (no test files found)
- **Lint**: ESLint with `eslint:recommended`, `@typescript-eslint/recommended`, `react-hooks/recommended`

### Test Coverage

Minimal test files were found in the frontend scan. Testing infrastructure is configured but test coverage is limited.

---

## 8. Theme System

Three themes managed by `ThemeContext`:

### Light Theme
- White cards, dark text, slate headers
- Standard professional appearance

### Dark Theme
- Glassmorphic cards: `rgba(255,255,255,0.07)` with `backdrop-blur`
- White text on dark backgrounds
- Consistent with EY brand colors

### Game Theme (Medieval/Adventure)
- Dark theme base with medieval fantasy overlay
- Custom fonts: Cinzel (headings), Spectral (body), MedievalSharp (accents)
- Level titles: Squire, Knight, Baron, Count, Duke, King
- Castle/sword iconography
- Framer Motion animations throughout

### EY Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `ey-yellow` | `#FFE600` | Primary accent, buttons, progress rings |
| `ey-yellow-dark` | `#e6cf00` | Hover states |
| `ey-confident-black` | `#2E2E38` | Primary text, dark backgrounds |
| `ey-off-white` | `#F6F6FA` | Light backgrounds |

---

## 9. Key Libraries and Patterns

### Graph Visualization (ReactFlow)

Used in two distinct views:
1. **Career Graph** (`components/career-viz/`): Custom `RoleNode` and `TransitionEdge` components with dagre layout, BFS shortest path highlighting, department filtering, and search with 1-hop expansion
2. **Skill Plan Tree** (`components/career-viz/RoleRequirementTree.tsx`): Radial layout algorithm with custom `SkillNode` and `SkillPlanEdge`, edge bundling, draggable nodes in customize mode with localStorage persistence

### Charts (Recharts)

Used in success patterns for:
- Vertical bar charts (success rate by transition)
- Horizontal bar charts (skill frequency top 10)
- Donut pie charts (department distribution)
- Multi-line charts (time-to-promotion by department)

### Drag-and-Drop (dnd-kit)

Used for widget reorder in:
- `SuccessPatternPage.tsx`: 4 draggable chart widgets
- `RoleSuccessPatterns.tsx`: Draggable analytics widgets
- Layout persisted to localStorage

### Virtual Scrolling (@tanstack/react-virtual)

`VirtualMatchList.tsx` enables efficient rendering of 50+ match results with 5-item overscan.

### Framer Motion

Animations throughout game components:
- Entry animations (slide-in, scale)
- Hover/tap interactions (`whileHover`, `whileTap`)
- Toast notifications (slide-in, shake, scale)
- Achievement unlock (bounce)

### Forms (react-hook-form)

Used in `AddSkillModal.jsx` for skill creation form with validation.

### File Upload (react-dropzone)

`ResumeUpload.jsx` accepts PDF/DOC/DOCX/TXT files via drag-and-drop or click.

---

## 10. localStorage Persistence

| Key Pattern | Data | Used By |
|-------------|------|---------|
| Auth token | JWT bearer token | AuthContext |
| Theme preference | 'light' / 'dark' / 'game' | ThemeContext |
| Adventure state | XP, gold, level, achievements, login streak | AdventureContext |
| Skill plan node positions | Dragged node positions per role | RoleRequirementTree |
| Widget layout (Success Patterns) | `springais.successPatterns.layout.v1` | SuccessPatternPage |
| Widget layout (Role Detail) | Widget order array | RoleSuccessPatterns |


---

## 7.6 Integration Architecture

*Source: _bmad-output/integration-architecture.md*

# SpringAIS Integration Architecture

**Generated**: 2026-02-11
**Source**: Integration scan findings, docker-compose.yml, frontend/backend source analysis

---

## 1. System Communication Overview

SpringAIS is a two-tier web application where the frontend communicates with the backend exclusively via HTTP REST API. There are no WebSocket, Server-Sent Events, or GraphQL communication channels.

```
┌──────────────────────────────────────────────────────────────────┐
│                        Browser                                    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              React SPA (Frontend)                         │    │
│  │  Port 3000 (Vite dev server)                              │    │
│  │                                                           │    │
│  │  AuthContext ─── authService ───────── POST /auth/*       │    │
│  │  MatchesContext ── matchService ────── GET /api/matches/*  │    │
│  │  SkillsContext ── skillService ─────── GET/POST /api/skills/*│  │
│  │  RoadmapContext ── roadmapService ──── POST /api/roadmap/* │    │
│  │  CareerPathContext ── careerGraphService── GET /api/patterns/*│  │
│  │  HMContext ─── hmService ──────────── GET /api/hm/*       │    │
│  └────────────────────────┬─────────────────────────────────┘    │
│                           │                                       │
│                    HTTP REST (JSON)                               │
│                    Auth: Bearer JWT                               │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                            v
┌───────────────────────────────────────────────────────────────────┐
│                   FastAPI Backend                                  │
│                   Port 8000 (Uvicorn)                             │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  Routes Layer (API Handlers)                             │     │
│  │  auth.py | matches.py | skills.py | patterns.py         │     │
│  │  roadmap.py | hiring_manager.py                          │     │
│  └────────────────────────┬────────────────────────────────┘     │
│                           │                                       │
│  ┌────────────────────────┴────────────────────────────────┐     │
│  │  Services Layer (Business Logic)                         │     │
│  │  matching_service | embedding_service | skill_extractor  │     │
│  │  pattern_service | roadmap_service | ...                 │     │
│  └──────────┬─────────────┬──────────────┬─────────────────┘     │
│             │             │              │                         │
│     ┌───────┘      ┌──────┘       ┌──────┘                       │
│     v              v              v                               │
│  PostgreSQL     Redis          OpenAI API                         │
│  + pgvector    (Cache)        (AI/ML)                            │
│  Port 5432     Port 6379     External                            │
└───────────────────────────────────────────────────────────────────┘
```

---

## 2. API Path Convention

The backend uses a split path convention:

| Router | Mount Prefix | Full Path | Frontend Client |
|--------|-------------|-----------|-----------------|
| `auth_router` | None (bare mount) | `/auth/*` | Separate Axios instance (no `/api` prefix) |
| `match_router` | `/api` | `/api/matches/*` | Main APIClient (auto-appends `/api`) |
| `skills_router` | `/api` | `/api/skills/*` | Main APIClient |
| `patterns_router` | `/api` | `/api/patterns/*` | Main APIClient |
| `roadmap_router` | `/api` | `/api/roadmap/*` | Main APIClient |
| `hiring_manager_router` | `/api` | `/api/hm/*` | Main APIClient |

**Key detail**: The auth service (`authService.ts`) uses a separate Axios instance with base URL `http://localhost:8000` (no `/api`), while all other services use the main `APIClient` which auto-appends `/api` to the base URL.

---

## 3. Authentication Flow

```
[Login Form] ────POST /auth/login────> [Backend auth.py]
                 {email, password}          │
                                            v
                                    bcrypt.verify(password, hash)
                                            │
                                            v
                                    [PostgreSQL user_profiles]
                                            │
                                            v
                                    Generate JWT (HS256, 7-day expiry)
                                    Payload: {user_id, email, exp}
                                            │
<────{token, user}─────────────────────────┘
         │
         v
[Frontend stores token in localStorage]
         │
         v
[All subsequent requests]
  Authorization: Bearer {token}
         │
         v
[Backend get_current_user_from_token()]
  HTTPBearer -> PyJWT verify -> load user_profiles by user_id
```

**JWT Configuration**:
- Algorithm: HS256
- Secret: `JWT_SECRET_KEY` environment variable
- Expiry: 7 days (configurable via `ACCESS_TOKEN_EXPIRE_DAYS`)
- Payload fields: `user_id`, `email`, `exp`

**Auto-logout**: Frontend 401 response interceptor clears localStorage and redirects to `/login`.

---

## 4. Frontend-Backend Endpoint Mapping

### Authentication

| Frontend | Backend | Handler |
|----------|---------|---------|
| `POST /auth/login` | `POST /auth/login` | `auth.py:login()` |
| `POST /auth/register` | `POST /auth/register` | `auth.py:register()` |
| `GET /auth/me` | `GET /auth/me` | `auth.py:get_current_user()` |

### Matches

| Frontend | Backend | Handler |
|----------|---------|---------|
| `GET /matches/employee/{id}` | `GET /api/matches/employee/{id}` | `matches.py:get_matches()` |
| `GET /matches/employee/{id}/job/{jobId}` | `GET /api/matches/employee/{id}/job/{jobId}` | `matches.py:get_match_detail()` |
| `POST /matches/save` | `POST /api/matches/save` | `matches.py:save_match()` |
| `GET /matches/saved` | `GET /api/matches/saved` | `matches.py:get_saved_matches()` |
| `DELETE /matches/saved/{id}` | `DELETE /api/matches/saved/{id}` | `matches.py:delete_saved_match()` |
| `GET /matches/job/{id}/deep-analysis` | `GET /api/matches/job/{id}/deep-analysis` | `matches.py:deep_analysis()` |

### Skills & Progress

| Frontend | Backend | Handler |
|----------|---------|---------|
| `GET /skills/me/progress` | `GET /api/skills/me/progress` | `skills.py:get_skills_progress()` |
| `POST /skills/{name}/start` | `POST /api/skills/{name}/start` | `skills.py:start_skill()` |
| `PATCH /skills/{name}/modules/{id}/progress` | `PATCH /api/skills/{name}/modules/{id}/progress` | `skills.py:update_module_progress()` |
| `POST /skills/{name}/modules/{id}/complete` | `POST /api/skills/{name}/modules/{id}/complete` | `skills.py:complete_module()` |
| `POST /skills/{name}/complete` | `POST /api/skills/{name}/complete` | `skills.py:complete_skill()` |
| `PATCH /skills/{name}/proficiency` | `PATCH /api/skills/{name}/proficiency` | `skills.py:update_proficiency()` |
| `POST /skills/{name}/modules/{id}/complete-with-proof` | `POST /api/skills/{name}/modules/{id}/complete-with-proof` | `skills.py:complete_with_proof()` |
| `POST /skills/{name}/modules/{id}/upload-proof` | `POST /api/skills/{name}/modules/{id}/upload-proof` | `skills.py:upload_proof()` |
| `POST /skills/{name}/modules/{id}/generate-content` | `POST /api/skills/{name}/modules/{id}/generate-content` | `skills.py:generate_content()` |
| `PATCH /skills/{name}/modules/{id}/tasks` | `PATCH /api/skills/{name}/modules/{id}/tasks` | `skills.py:update_tasks()` |
| `POST /skills/quick-add` | `POST /api/skills/quick-add` | `skills.py:quick_add()` |
| `POST /skills/recategorize` | `POST /api/skills/recategorize` | `skills.py:recategorize()` |

### Patterns & Career

| Frontend | Backend | Handler |
|----------|---------|---------|
| `GET /patterns/transitions` | `GET /api/patterns/transitions` | `patterns.py:get_transitions()` |
| `GET /patterns/role/{title}` | `GET /api/patterns/role/{title}` | `patterns.py:get_role_patterns()` |
| `POST /patterns/role-skills` | `POST /api/patterns/role-skills` | `patterns.py:get_role_skills()` |

### Roadmap

| Frontend | Backend | Handler |
|----------|---------|---------|
| `POST /roadmap/generate` | `POST /api/roadmap/generate` | `roadmap.py:generate_roadmap()` |
| `GET /roadmap/saved` | `GET /api/roadmap/saved` | `roadmap.py:list_saved()` |
| `GET /roadmap/saved/{id}` | `GET /api/roadmap/saved/{id}` | `roadmap.py:get_saved()` |
| `DELETE /roadmap/saved/{id}` | `DELETE /api/roadmap/saved/{id}` | `roadmap.py:delete_saved()` |
| `POST /roadmap/saved/{id}/milestones/{id}/toggle` | `POST /api/roadmap/saved/{id}/milestones/{id}/toggle` | `roadmap.py:toggle_milestone()` |
| `POST /roadmap/saved/{id}/milestones/{id}/notes` | `POST /api/roadmap/saved/{id}/milestones/{id}/notes` | `roadmap.py:update_notes()` |
| `POST /roadmap/saved/{id}/extras` | `POST /api/roadmap/saved/{id}/extras` | `roadmap.py:add_extra()` |
| `DELETE /roadmap/saved/{id}/extras/{id}` | `DELETE /api/roadmap/saved/{id}/extras/{id}` | `roadmap.py:delete_extra()` |
| `POST /roadmap/saved/{id}/edit/ai` | `POST /api/roadmap/saved/{id}/edit/ai` | `roadmap.py:ai_edit()` |
| `POST /roadmap/saved/{id}/edit/apply` | `POST /api/roadmap/saved/{id}/edit/apply` | `roadmap.py:apply_edit()` |
| `POST /roadmap/saved/{id}/chat/enhanced` | `POST /api/roadmap/saved/{id}/chat/enhanced` | `roadmap.py:enhanced_chat()` |

### Hiring Manager

| Frontend | Backend | Handler |
|----------|---------|---------|
| `GET /hm/jobs` | `GET /api/hm/jobs` | `hiring_manager.py:browse_jobs()` |
| `POST /hm/my-jobs` | `POST /api/hm/my-jobs` | `hiring_manager.py:save_job()` |
| `GET /hm/my-jobs` | `GET /api/hm/my-jobs` | `hiring_manager.py:get_saved_jobs()` |
| `DELETE /hm/my-jobs/{id}` | `DELETE /api/hm/my-jobs/{id}` | `hiring_manager.py:remove_job()` |
| `GET /hm/my-jobs/{job_id}/interest` | `GET /api/hm/my-jobs/{job_id}/interest` | `hiring_manager.py:get_interest()` |

---

## 5. Data Flow: End-to-End Matching Pipeline

```
STEP 1: RESUME UPLOAD
[User] -> ResumeUpload.jsx -> POST /api/skills/upload (FormData)
    -> resume_parser.py (PDF/DOCX/TXT extraction)
    -> text_cleaner.py (PII stripping)
    -> skill_extractor.py (GPT-5.2-chat-latest)
    -> Returns: {listed_skills, inferred_skills}
    -> Stores in user_profiles (llm_listed_skills, llm_inferred_skills)
    -> BackgroundTask: vectorize_user_skills_and_resume()

STEP 2: EMBEDDING GENERATION (Background)
    -> embedding_service.py (text-embedding-3-large, 3072 dims)
    -> PCA reduction (3072 -> 1536 dims)
    -> Stores in skill_embeddings table + Redis cache (7-day TTL)
    -> Stores resume_embedding in user_profiles

STEP 3: MATCH CALCULATION
[User views Matches] -> MatchesContext.loadMatches()
    -> GET /api/matches/employee/{id}?limit=20&offset=0
    -> matching_service.py
        -> Cache check (Redis, 5-min TTL)
        -> If miss: full matching pipeline
            A. SKILL MATCH (80%):
               1. Taxonomy match (1.0/0.85/0.80/0.70)
               2. Exact string match
               3. pgvector HNSW search (>= 0.65 matched, >= 0.50 transferable)
               4. Fuzzy Jaccard fallback
            B. EXPERIENCE MATCH (10%): penalty for under/over-qualified
            C. ROLE FIT (10%): resume vs job description cosine similarity
        -> Cache result (Redis, 5-min TTL)

STEP 4: DISPLAY
    -> MatchResultsPage (progressive loading, BATCH_SIZE=20)
    -> Virtual scrolling at 50+ matches
    -> US location filtering (client-side)

STEP 5: DEEP ANALYSIS (On-demand)
[User clicks Deep Analysis] -> GET /api/matches/job/{id}/deep-analysis
    -> analysis_service.py (GPT-5.2, reasoning_effort="medium")
    -> Returns: skill impacts, success factors, risk factors, ramp-up time
```

---

## 6. Data Flow: Skill Learning Pipeline

```
[User starts skill] -> POST /api/skills/{name}/start
    -> skill_progress_service.py
    -> Creates UserSkill + auto-generates SkillModules
       (Priority: existing DB > AI groupings > dynamic fallback)

[User updates progress] -> PATCH /api/skills/{name}/modules/{id}/progress
    -> Updates progress_percentage

[User completes module with proof] -> POST /api/skills/{name}/modules/{id}/complete-with-proof
    -> learning_content_service.py (AI review of proof)
    -> Returns AI feedback

[Proficiency reaches >= 3] -> Auto-sync to user_profiles.skills
    -> BackgroundTask: invalidate match cache
    -> BackgroundTask: incremental match recalculation (only affected jobs)
```

---

## 7. Data Flow: Roadmap Generation Pipeline

```
[User selects target roles] -> POST /api/roadmap/generate
    -> roadmap_service.py
    -> Fetches: user profile, success patterns, skill proficiencies
    -> GPT-5.2 (reasoning_effort="medium", max_tokens=12000)
    -> Returns: phases, milestones, executive_summary, quick_wins, blockers
    -> Saves to saved_roadmaps table

[User interacts with roadmap]
    -> Toggle milestones: POST /api/roadmap/saved/{id}/milestones/{id}/toggle
    -> Chat assistant: POST /api/roadmap/saved/{id}/chat/enhanced
    -> AI editing: POST /api/roadmap/saved/{id}/edit/ai (preview)
                   POST /api/roadmap/saved/{id}/edit/apply (apply)
```

---

## 8. Shared Dependencies and Type Contracts

### No Shared Type System

Frontend and backend define types independently:
- **Frontend**: TypeScript interfaces in service files
- **Backend**: Pydantic schemas in `backend/app/schemas/`

There is no shared OpenAPI schema consumption, code generation, or shared type package. The frontend uses manual mapping functions to transform backend responses.

### Key Type Mapping Patterns

| Pattern | Frontend | Backend |
|---------|----------|---------|
| Match ID | `String(item.job_id)` (conflates match/job ID) | `match.id` (UUID) |
| Scores | Nested `item.scores.overall` | Flat `overall_score` field |
| Case convention | camelCase | snake_case |
| Proficiency labels | Array: `['None','Beginner','Elementary','Intermediate','Advanced','Expert']` | Equivalent in `skill_progress_service.py` |

### Duplicated Constants

| Constant | Frontend Location | Backend Location |
|----------|------------------|-----------------|
| Proficiency scale (0-5) | `skillProgressService.ts` | `skill_progress_service.py` |
| Skill categories | `mockSkills.js` (7 categories) | `schemas/skill.py` (16 categories) |
| Match mode options | `MatchModeToggle.tsx` | `config/matching_config.py` |

---

## 9. Caching Architecture

### Multi-Layer Cache Strategy

```
Layer 1: Frontend (Browser)
├── MatchesContext: 5-min in-memory cache (CACHE_TTL_MS)
├── localStorage: auth token, theme, adventure state, widget layouts
└── React Query: 5-min staleTime, 10-min gcTime

Layer 2: Redis (Backend)
├── Match results: 5-min TTL (per-user, skill-version validated)
├── Embeddings: 7-day TTL (exact match cache)
├── Career patterns: 24-hour TTL
└── Job skills: 30-day TTL (SHA256 hash key)

Layer 3: In-Memory (Backend Process)
├── Global embedding cache: 5-min TTL (thread-locked dict)
├── Skill taxonomy: LRU cache (1000 entries, no TTL)
└── Skill normalizer: Unbounded dict (no TTL)
```

### Cache Invalidation Flow

```
[Skill proficiency changes]
    -> BackgroundTask: invalidate_user_cache(user_id)
        -> Delete all matches:{user_id}:* Redis keys
        -> Bump skill_version:{user_id} counter
    -> BackgroundTask: IncrementalMatchService
        -> Recalculate only affected job matches
```

---

## 10. CORS and Network Configuration

### Development Setup

```
Browser (any origin)
    │
    ├── http://localhost:3000 (frontend Vite dev server)
    │       │
    │       │ (browser makes cross-origin requests)
    │       v
    └── http://localhost:8000 (backend FastAPI)
            │
            │ CORS: allow_origins=["http://localhost:3000"]
            │ allow_credentials=True
            │ allow_methods=["*"]
            │ allow_headers=["*"]
```

### Docker Networking

```
Container Network (bridge):
    frontend (3000) ──> NOT direct to backend (browser-side requests)
    backend (8000) ──> postgres:5432 (container DNS)
    backend (8000) ──> redis:6379 (container DNS)

Host Ports:
    localhost:3000 -> frontend:3000
    localhost:8000 -> backend:8000
    localhost:5432 -> postgres:5432
    localhost:6380 -> redis:6379
```

**Important**: Frontend connects to backend via `http://localhost:8000` (browser-side, not container-to-container). This requires CORS to be properly configured.

---

## 11. Background Task Processing

FastAPI `BackgroundTasks` execute after the HTTP response is sent:

| Trigger | Background Task | Effect |
|---------|----------------|--------|
| Resume upload | `vectorize_user_skills_and_resume()` | Generates embeddings for user skills and resume text |
| Skill update | `invalidate_user_cache()` | Deletes cached matches, bumps skill version |
| Skill proficiency change | `IncrementalMatchService` | Recalculates only affected job matches |
| Match saved | Recommendation refresh | Updates skill recommendations based on new match |
| Job import | `batch_enrich_jobs()` | Parallel embedding generation for new jobs |

---

## 12. Known Integration Issues

1. **No API Proxy**: Frontend Vite config does not proxy requests to backend. Browser makes cross-origin requests requiring CORS headers.

2. **Hardcoded CORS Origin**: Only `http://localhost:3000` is allowed. Production requires configuration changes.

3. **No Rate Limiting**: No API rate limiting middleware. Only OpenAI API retry logic exists.

4. **No Shared Type Contract**: Frontend and backend types are independently defined. FastAPI auto-generates OpenAPI docs but the frontend does not consume them.

5. **Auth Service Separate Client**: `authService.ts` uses a different Axios instance than the main APIClient, with a different base URL pattern.

6. **Dev-Only Frontend Docker**: Current Dockerfile runs Vite dev server, not a production build.

7. **No Frontend Health Check**: Frontend Docker container has no health check defined.

8. **Redis Port Mapping Confusion**: Host port 6380 maps to container port 6379. `.env` uses `redis://localhost:6380` while docker-compose sets `redis://redis:6379/0` for the backend.

9. **Match/Job ID Conflation**: Frontend `Match.id` is set from `job_id`, not the actual match UUID. Works for single match per job but would break with multiple match modes.

10. **No Real-Time Communication**: Long-running operations (roadmap generation, deep analysis) block the HTTP request. No streaming or push mechanism exists.


---

## 7.7 Architecture Updates 2026

*Source: _bmad-output/architecture-updates-2026.md*

# SpringAIS Architecture Updates - January 2026

**Date:** 2026-01-02
**Status:** APPROVED - Replace December 2025 architecture
**Replaces:** Azure-based cloud architecture
**New Approach:** Local-first development, competition demo optimized

---

## Executive Summary of Changes

**Major Shift:** From cloud-hosted production architecture → Local development + demo architecture

**Why:** 8-week competition timeline, $0 infrastructure budget, more impressive live demo

**Key Changes:**
1. ❌ **Removed:** All Azure services (PostgreSQL, Blob Storage, AD B2C, App Service)
2. ✅ **Added:** Local Docker-based development, git-based data sharing
3. ✅ **Added:** Multi-track EY organizational structure (3 service lines)
4. ✅ **Changed:** Hybrid synthetic data generation (hard-coded + LLM)
5. ✅ **Simplified:** Vector-only matching (no ML ranking for MVP)
6. 💰 **Cost:** $3 total (was expecting $30-50/month ongoing)

---

## Infrastructure Changes

### OLD Architecture (December 2025)

```
Backend:
- Azure App Service (FastAPI)
- Azure PostgreSQL (~$15-30/month)
- Azure Blob Storage (~$2-5/month)
- Azure AD B2C (complex setup)
- Azure Functions (background jobs)
- Azure Application Insights
- Azure Key Vault

Frontend:
- Azure Static Web Apps or App Service

Total: ~$30-50/month + $100 student credit burns out in 2-3 months
```

### NEW Architecture (January 2026)

```
Backend:
- Local Docker: PostgreSQL 16 + pgvector
- Local Docker: Redis 7
- Local FastAPI (uvicorn)
- Local filesystem (resume uploads)
- Simple JWT auth (or skip for demo)

Frontend:
- Local Vite dev server (React)
- Static build for demo

Infrastructure Cost: $0/month
Demo: Runs on laptop, no cloud dependencies
```

**Why this is better for 8-week competition:**
- ✅ Zero infrastructure costs
- ✅ No deployment delays (iterate faster)
- ✅ More impressive (judges see real-time execution)
- ✅ No "server down" risk during demo
- ✅ Portable (can demo anywhere with laptop + Docker)

---

## Data Architecture Changes

### OLD: Generic Consulting Roles

**Problem:** PRD assumed generic "Analyst → Partner" progression

**Missed:** EY has 3 distinct service lines with different career paths

### NEW: Multi-Track Service Lines

**SpringAIS now models EY's actual structure:**

#### 1. Assurance (300 employees, 33%)
```
Career Path: Staff → Senior → Manager → Senior Manager → Partner
Core Skills: Accounting, Audit, GAAP, Financial Reporting
Focus Areas: Audit, Financial Reporting, Risk & Compliance, SEC Reporting
```

#### 2. Tax (300 employees, 33%)
```
Career Path: Staff → Senior → Manager → Senior Manager → Partner
Core Skills: Tax Law, Tax Planning, Compliance, Research
Focus Areas: Corporate Tax, International Tax, Transfer Pricing, M&A Tax
```

#### 3. Consulting (300 employees, 34%)
```
Career Path: Analyst → Associate → Sr Associate → Consultant →
             Sr Consultant → Manager → Sr Manager → Director → Partner
Core Skills: Strategy, Client Management, Project Management
Focus Areas (Tech): Cloud, Data & Analytics, Cybersecurity, AI/ML
Focus Areas (Business): Strategy, Operations, Finance Transform, Supply Chain
```

**Total Role Types:** ~25 (was 7)

**Why this matters:**
- ✅ Shows cross-functional mobility (Tax → Consulting)
- ✅ More realistic demo scenarios
- ✅ Reflects actual EY structure
- ✅ Same cost (still 900 employees total)

---

## Synthetic Data Changes

### OLD: Full LLM Generation

```
GPT-5.2 Instant generates everything:
- Role titles
- Skills
- Experience
- Performance metrics
- Career history
- Feedback text

Cost: ~$22 for 1000 employees
Risk: Skills might not match requirements
Risk: Data quality issues hard to fix
```

### NEW: Hybrid Hard-Coded + LLM

```
HARD-CODED ($0):
- Role titles and hierarchy
- Core required skills (from job postings/O*NET)
- Experience ranges per role
- Performance metric ranges

GPT-5 NANO ($0.04):
- Individual metric variation
- Soft skills
- Career history
- Skill proficiency levels

GPT-5.2 Instant ($1.50):
- Feedback themes (user-facing text)
- Notable achievements

Cost: ~$2 for 900 employees (vs $22)
Quality: GUARANTEED correctness of core skills
Speed: Faster generation (less API calls)
```

**Example:**
```
Hard-coded template guarantees:
  "Every Senior Analyst has: Accounting, Audit, GAAP"

LLM adds variation:
  Employee A: 82% utilization, "detail-oriented" feedback
  Employee B: 77% utilization, "collaborative" feedback

Result: Realistic diversity WITH guaranteed baseline quality
```

---

## Matching Algorithm Changes

### OLD: Vector + ML Hybrid

```
1. Vector search: Find top 100 candidates
2. ML model: Rank those 100 using features
   - Vector similarity
   - Skill gaps
   - Success patterns
   - Recency
3. Return top 10

Development time: +3-5 days
Complexity: High
Value add for MVP: Low (only ~25 role types to rank)
```

### NEW: Vector-Only (Simpler, Sufficient)

```
1. Vector similarity search against ~25 role types
2. Sort by cosine similarity
3. Return top 10

Development time: Saved 3-5 days
Complexity: Low
Value add: SAME as ML for this scale
Future: Add ML when job posting DB grows to 100+
```

**Why skip ML for MVP:**
- Only ~25 role types to rank (too few for ML benefit)
- Vector similarity performs excellently at this scale
- Saves development time
- Can add ML later when job posting database grows

---

## Success Pattern Priority Changes

### OLD: Success Patterns Only

```
User wants: Senior Analyst role

System shows:
- Success pattern analysis (from synthetic employees)
- Common skills, metrics, paths

Missing: Actual job requirements
```

### NEW: Job Postings FIRST, Success Patterns SECOND

```
User wants: Senior Analyst role

IF job posting exists:
  PRIMARY: Job posting requirements
    "Senior Analyst requires: CPA, 3-5 years, GAAP, Excel"

  AUGMENTATION: Success pattern insights
    "92% of current Senior Analysts also have Excel ✅
     78% have strong communication skills (not in posting!)
     Avg 4.2 years experience (you: 3.5 - on track)"

ELSE (no posting):
  PRIMARY: Success patterns only
    "Based on 47 current Senior Analysts:
     Common skills: Accounting (100%), Audit (98%)..."
```

**Why this is better:**
- Job postings = ground truth (when available)
- Success patterns = hidden insights (always valuable)
- System works even without job postings (graceful degradation)
- Growing posting database improves over time

**Scraping strategy:**
- Scrape EY careers weekly/daily
- Archive closed postings (historical data valuable)
- Week 1: ~30-50 postings
- Month 3: ~100+ postings (now ML ranking adds value)

---

## Team Collaboration Changes

### OLD: Cloud Database Sharing

```
Options considered:
- Supabase free tier (500MB limit)
- One person hosts locally (requires them online)
- Everyone generates own data (inconsistent)

Problems: Limited, unreliable, or inconsistent
```

### NEW: Git-Based SQL Dump Sharing

```
Workflow:
1. One person generates synthetic data (~$2, 2 min)
2. They dump database to SQL file (10-50MB)
3. They commit to "data-dumps" git branch
4. Teammates pull and load into local DB
5. Everyone has identical data

Benefits:
✅ Free (git hosting)
✅ Version controlled (can revert)
✅ Works offline
✅ No merge conflicts (separate branch)
✅ Simple (SQL dump/restore)
```

**Branch strategy:**
```bash
# Create once
git checkout -b data-dumps  # ONLY for SQL dumps, never merge

# Data generator workflow
pg_dump springais > data/synthetic_employees.sql
git checkout data-dumps
git add data/synthetic_employees.sql
git commit -m "Generate 900 employees - 2026-01-02"
git push

# Teammate workflow
git checkout data-dumps
git pull
psql springais < data/synthetic_employees.sql
```

---

## Cost Changes

### OLD Estimates (December 2025)

```
Infrastructure (Monthly):
- Azure PostgreSQL: $15-30/month
- Azure Blob Storage: $2-5/month
- Azure Redis: Included in App Service
- Total: $17-35/month

Azure Student Credit: $100
Burn rate: 3-4 months until credit exhausted

Data Generation:
- Full LLM: ~$22 one-time

Total 8-week project: ~$60-80
```

### NEW Actuals (January 2026)

```
Infrastructure (Monthly):
- PostgreSQL: $0 (Docker local)
- Redis: $0 (Docker local)
- Hosting: $0 (runs on laptop)
- Total: $0/month

No cloud credits needed!

Data Generation:
- Hybrid approach: ~$2 one-time

Demo Runtime:
- 50 test resumes × $0.02 = $1

Total 8-week project: ~$3
```

**Savings: ~$57-77** 🎉

---

## PRD Section Updates

### Update: Epic 1 (Infrastructure)

**OLD:**
> Azure AD B2C authentication, Azure Blob Storage, Azure App Service, Azure Functions, Azure Application Insights, Azure Key Vault

**NEW:**
```
Epic 1: Local Infrastructure & Development Setup

- Docker Compose deployment (PostgreSQL 16 + pgvector, Redis 7)
- FastAPI backend with local development
- React frontend with Vite
- Simple JWT authentication (or skip for demo)
- Local file storage for uploads
- Optional: Supabase for free hosting (not required for competition)

Deliverable: `docker-compose up` runs entire stack locally
Time: 1 week
```

### Update: Epic 2 (Data Generation)

**ADD NEW EPIC:**
```
Epic 2a: Synthetic Data Generation

- Define role templates (3 service lines, ~25 role types)
- Hybrid generation script (hard-coded + LLM)
- O*NET API integration for skill taxonomy
- Multi-layer validation (distribution, correlation, progression)
- Git-based team sharing (SQL dumps)

Deliverable: 900 realistic employees across Assurance, Tax, Consulting
Time: 1 week
Cost: ~$2 one-time
```

### Update: Epic 3 (Matching)

**REMOVE:** ML ranking pipeline

**KEEP:**
- pgvector similarity search
- Cosine similarity scoring
- Multi-mode discovery (Best Fit, Stretch, Exploratory)

**SIMPLIFY:**
```
Matching Algorithm:

1. Vector search against ~25 role types
2. Vector search against job postings (grows over time)
3. Sort by cosine similarity
4. Return top 10

For each match:
  IF job posting exists:
    - Show job requirements (PRIMARY)
    - Add success patterns (AUGMENTATION)
  ELSE:
    - Show success patterns only (PRIMARY)

No ML ranking needed for MVP (can add later)
```

### Update: Success Criteria

**ADD:**

```
Data Quality Success:
- 900 synthetic employees generated
- 300 Assurance, 300 Tax, 300 Consulting
- Realistic distributions validated
- All role types have 20+ employees
- Performance metrics correlate with role level
- No impossible patterns (e.g., Junior with 10y experience)

Infrastructure Success:
- Entire stack runs locally in Docker
- Zero cloud costs during 8-week dev
- Team can share data via git
- Demo runs reliably on any laptop
```

---

## Migration Notes

### For Development Team

**If you started with old architecture:**

1. **Remove Azure dependencies**
   ```bash
   # Uninstall Azure SDKs
   pip uninstall azure-storage-blob azure-identity
   npm uninstall @azure/storage-blob
   ```

2. **Switch to Docker local**
   ```bash
   docker-compose up postgres redis -d
   ```

3. **Pull synthetic data**
   ```bash
   git checkout data-dumps
   git pull
   psql springais < data/synthetic_employees.sql
   ```

4. **Update environment variables**
   ```bash
   # Remove
   AZURE_STORAGE_CONNECTION_STRING
   AZURE_AD_B2C_TENANT_ID
   # etc.

   # Keep
   OPENAI_API_KEY
   ONET_API_KEY
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/springais
   ```

**If you're starting fresh:** Just follow `tech-stack.md` setup instructions

---

## Timeline Impact

### OLD 8-Week Timeline

```
Week 1: Azure setup, authentication
Week 2: Skill extraction pipeline
Week 3: Matching engine
Week 4: Career visualization
Week 5: Success patterns
Week 6: Job posting integration
Week 7: ML ranking model
Week 8: Polish
```

### NEW 8-Week Timeline

```
Week 1: Docker setup, local dev environment ✅ FASTER
Week 2: Synthetic data generation ✅ NEW
Week 3: Skill extraction pipeline (same)
Week 4: Matching engine (simpler, no ML) ✅ FASTER
Week 5: Success pattern analysis (same)
Week 6: Visualization (React Flow) (same)
Week 7: Job posting scraper + integration (same)
Week 8: Polish + demo prep (same)

Saved time: ~3-5 days (no Azure setup, no ML model)
Better use of time: Generated realistic data, multi-track structure
```

---

## Updated Success Metrics

### Technical Metrics (Unchanged)

- Skill extraction accuracy: >85%
- pgvector query time: <2s
- Cached skill inference: <3s
- Uncached skill inference: <15s

### NEW Metrics (Added)

```
Data Quality:
- Synthetic employees: 900 (300/300/300)
- Role distribution: Within ±10% of target
- Performance correlation: Higher roles → better metrics ✅
- Career progression: No impossible jumps ✅

Infrastructure:
- Setup time: <30 min (docker-compose up)
- Team data sync: <5 min (git pull + psql load)
- Demo reliability: 100% uptime (local = no server issues)
- Cost: $0/month infrastructure ✅
```

---

## Documentation Updates Needed

1. ✅ **tech-stack.md** - Completely rewritten (2026-01-02)
2. ✅ **data-generation-plan.md** - New document created
3. ✅ **database-setup-guide.md** - New document created
4. ⚠️ **prd.md** - Add this document as appendix
5. ⚠️ **README.md** - Update setup instructions

---

## Appendix: Architecture Comparison

| Aspect | OLD (Dec 2025) | NEW (Jan 2026) | Impact |
|--------|----------------|----------------|---------|
| **Hosting** | Azure App Service | Local Docker | $0 cost ✅ |
| **Database** | Azure PostgreSQL ($30/mo) | Local PostgreSQL | $0 cost ✅ |
| **Storage** | Azure Blob | Local filesystem | $0 cost ✅ |
| **Auth** | Azure AD B2C | Simple JWT | Faster setup ✅ |
| **Data Approach** | Full LLM ($22) | Hybrid ($2) | 90% cheaper ✅ |
| **Roles Modeled** | 7 generic | 25 across 3 lines | More realistic ✅ |
| **Matching** | Vector + ML | Vector only | Simpler, sufficient ✅ |
| **Team Collab** | Cloud DB | Git SQL dumps | Free, versioned ✅ |
| **Demo** | Hosted URL | Laptop local | More impressive ✅ |
| **Setup Time** | 2-3 days | 30 minutes | Faster iteration ✅ |
| **Total Cost (8wk)** | ~$60-80 | ~$3 | 95% savings ✅ |

---

## Approval

**This architecture is APPROVED for 8-week competition MVP.**

**Next steps:**
1. Update PRD with this addendum
2. Follow tech-stack.md for implementation
3. Generate synthetic data using data-generation-plan.md
4. Team loads data using database-setup-guide.md

**Questions?** See tech-stack.md or ask the team.

---

**Document Status:** FINAL - Ready for implementation
**Last Updated:** 2026-01-02
**Author:** Clays


---

## 7.8 Badge System Architecture

*Source: artifacts/design/badge-system-architecture.md*
*Cross-references: See Section 3.2 (Badge System PRD), ADR-001 through ADR-005*

# Badge Discovery & Integration System -- Architecture Document

> **Status**: DRAFT
> **Author**: Architect Agent
> **Date**: 2026-02-11
> **Version**: 1.0
> **Upstream Artifacts**:
>   - `artifacts/planning/badge-system-prd.md`
>   - `artifacts/exploration/badge-discovery-research.md`
>   - `artifacts/exploration/current-badge-analysis.md`

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Backend Architecture](#2-backend-architecture)
3. [Frontend Architecture](#3-frontend-architecture)
4. [AI Integration](#4-ai-integration)
5. [Caching Strategy](#5-caching-strategy)
6. [Migration Strategy](#6-migration-strategy)
7. [ADR Index](#7-adr-index)

---

## 1. System Overview

### 1.1 High-Level Component Diagram

```
                            +--------------------+
                            |    Frontend (React) |
                            |                    |
                            | SkillDetailModal   |
                            | MilestoneCard      |
                            | BadgeCard (new)    |
                            | BadgeSearch (new)  |
                            | BadgeSection (new) |
                            +--------+-----------+
                                     |
                                     | HTTP REST
                                     v
                 +-------------------------------------------+
                 |          FastAPI Backend                   |
                 |                                           |
                 |  /api/badges/*       (new router)         |
                 |  /api/skills/*       (existing, extended) |
                 |  /api/roadmap/*      (existing, extended) |
                 +--------+----------+----------+-----------+
                          |          |          |
              +-----------+    +-----+-----+   +----------+
              |                |           |              |
              v                v           v              v
    +------------------+  +--------+  +--------+  +------------------+
    | BadgeDiscovery   |  | Redis  |  | Postgres|  | learning_content |
    | Service (new)    |  | Cache  |  |   DB    |  | _service (mod)   |
    +--+-------+-------+  +--------+  +--------+  +------------------+
       |       |                          |
       |       |         +----------------+--------+
       |       |         |                |        |
       |       |    badge_catalog   badge_skill  badge_
       |       |    (new table)     _mapping     interaction
       |       |                   (new table)   (new table)
       v       v                                  user_badge
  +--------+ +---------+                         (new table)
  | MS     | | Credly  |
  | Learn  | | API     |
  | API    | | (Ph C)  |
  +--------+ +---------+
```

### 1.2 Data Flow -- Badge Discovery

```
User views SkillDetailModal for "Azure"
  |
  |--> Frontend: GET /api/badges/discover?skills=azure
  |
  |--> Backend: BadgeDiscoveryService.discover_badges(["azure"])
  |       |
  |       |--> 1. Check Redis cache (key: badge:discover:azure)
  |       |       |-- HIT: return cached results
  |       |       |-- MISS: continue
  |       |
  |       |--> 2. Query badge_catalog + badge_skill_mapping
  |       |       (curated matches, confidence=1.0)
  |       |
  |       |--> 3. Query Microsoft Learn Catalog API
  |       |       (live API, skill/role filter)
  |       |
  |       |--> 4. (Phase C) Query Credly API
  |       |       (org-specific badge templates, skill filter)
  |       |
  |       |--> 5. (Phase D) AI Semantic matching fallback
  |       |       (Sentence-BERT embedding similarity)
  |       |
  |       |--> 6. Merge, deduplicate, rank by relevance_score
  |       |
  |       |--> 7. Write to Redis cache (TTL=24h)
  |       |
  |       |--> Return BadgeDiscoverResponse
  |
  |--> Frontend renders BadgeCard components
  |       - Shows badge name, issuer, difficulty, direct link
  |       - On click: POST /api/badges/interactions (FR-5.1)
```

### 1.3 Data Flow -- Roadmap Certification Enrichment

```
User generates a roadmap with include_certifications=true
  |
  |--> roadmap_service.py: _build_prompt()
  |       |
  |       |--> BadgeDiscoveryService.get_badges_for_skills(target_role_skills)
  |       |       returns top 10-20 relevant certifications
  |       |
  |       |--> Injects known cert data into ROADMAP_GENERATION_PROMPT:
  |             "KNOWN CERTIFICATIONS FOR THESE SKILLS:
  |              - Azure Solutions Architect Expert (Microsoft, $165)
  |              - AWS Solutions Architect Associate (AWS, $150)"
  |
  |--> GPT generates roadmap referencing real certs
  |
  |--> _build_response() parses milestones
  |       - For cert milestones: attach structured certifications[]
  |       - Match milestone resource strings against badge_catalog
  |
  |--> Frontend: MilestoneCard renders clickable cert cards
```

---

## 2. Backend Architecture

### 2.1 Badge Discovery Service

**File**: `backend/app/services/badge_discovery_service.py`

```python
class BadgeDiscoveryService:
    """
    Multi-source badge discovery with caching and relevance ranking.

    Matching pipeline (ADR-001):
      1. Curated catalog (confidence=1.0)
      2. Microsoft Learn API (confidence=0.7-0.9)
      3. Credly API (Phase C, confidence=0.7-0.9)
      4. Keyword matching (confidence=0.4-0.6)
      5. AI semantic matching (Phase D, confidence=0.3-0.5)
    """

    def __init__(self, db: Session):
        self.db = db
        self._ms_learn_client = MicrosoftLearnClient()
        self._credly_client: Optional[CredlyClient] = None  # Phase C

    async def discover_badges(
        self,
        skills: List[str],
        page: int = 1,
        per_page: int = 20,
    ) -> BadgeDiscoverResponse:
        """
        Discover relevant badges for given skills.

        1. Check Redis cache
        2. Query curated catalog
        3. Query external APIs
        4. Merge, deduplicate, rank
        5. Cache results
        6. Return paginated response
        """

    async def get_badge_by_id(self, badge_id: str) -> Optional[BadgeCatalogEntry]:
        """Get a single badge by internal catalog ID."""

    async def get_badges_for_skills(
        self,
        skills: List[str],
        limit: int = 20,
    ) -> List[BadgeCatalogEntry]:
        """
        Get top badges for a list of skills (used by roadmap service).
        Lightweight version of discover_badges, catalog-only, no pagination.
        """

    async def search_catalog(
        self,
        query: str,
        limit: int = 10,
    ) -> List[BadgeCatalogEntry]:
        """Search badge catalog by name (for autocomplete)."""

    async def refresh_catalog(self, source: str = "microsoft") -> int:
        """
        Refresh catalog from external source. Called by background jobs.
        Returns number of badges added/updated.
        """
```

#### Matching Engine Design

```python
class BadgeMatchingEngine:
    """
    Extensible matching engine (FR-2.4).
    Matchers are tried in priority order; results are merged and deduplicated.
    """

    def __init__(self, db: Session):
        self.matchers: List[BadgeMatcher] = [
            CuratedMatcher(db),          # Priority 1: curated mappings
            MicrosoftLearnMatcher(),      # Priority 2: MS Learn API
            # CredlyMatcher(),            # Priority 3: Credly API (Phase C)
            KeywordMatcher(db),           # Priority 4: normalized keyword match
            # SemanticMatcher(),          # Priority 5: AI embeddings (Phase D)
        ]

    async def match(self, skills: List[str]) -> List[ScoredBadge]:
        """Run all matchers, merge, deduplicate by external_id+platform, sort by relevance_score desc."""

class BadgeMatcher(ABC):
    """Abstract base for matching strategies."""

    @abstractmethod
    async def find_matches(self, skills: List[str]) -> List[ScoredBadge]:
        """Return scored badge matches for given skills."""

class CuratedMatcher(BadgeMatcher):
    """Queries badge_skill_mapping where source='curated'. Confidence=1.0."""

class MicrosoftLearnMatcher(BadgeMatcher):
    """Queries Microsoft Learn Catalog API by skill keywords. Confidence=0.7-0.9."""

class KeywordMatcher(BadgeMatcher):
    """
    Normalized keyword matching against badge_catalog.skills array.
    Case-insensitive, abbreviation expansion (e.g., "JS" -> "JavaScript").
    Confidence=0.4-0.6.
    """
```

#### External API Clients

```python
class MicrosoftLearnClient:
    """
    Client for Microsoft Learn Catalog API (free, no auth).
    Endpoint: https://learn.microsoft.com/api/catalog/
    ADR-002: First external API integration.
    """

    BASE_URL = "https://learn.microsoft.com/api/catalog/"

    async def get_certifications(
        self,
        skills: Optional[List[str]] = None,
        level: Optional[str] = None,
        role: Optional[str] = None,
    ) -> List[dict]:
        """Fetch certifications from MS Learn Catalog API."""

    async def get_full_catalog(self) -> List[dict]:
        """Fetch entire certification catalog for refresh job."""


class CredlyClient:
    """
    Client for Credly API (Phase C, requires enterprise auth).
    ADR-002: Second external API integration.
    """

    BASE_URL = "https://api.credly.com/v1/"

    def __init__(self, api_token: str, organization_id: str):
        self.api_token = api_token
        self.organization_id = organization_id

    async def get_badge_templates(
        self,
        skills: Optional[List[str]] = None,
        state: str = "active",
        page: int = 1,
        per_page: int = 50,
    ) -> List[dict]:
        """Fetch badge templates from Credly org."""

    async def get_badge_template(self, template_id: str) -> dict:
        """Fetch single badge template by ID."""
```

### 2.2 Data Model

**File**: `backend/app/models/badge.py`

All models follow existing patterns from `backend/app/models/base.py` (Base, TimestampMixin) and `skill_progress.py` (UUID primary keys, PGUUID, mapped_column).

```python
import enum

class BadgePlatform(str, enum.Enum):
    CREDLY = "credly"
    MICROSOFT = "microsoft"
    AWS = "aws"
    GOOGLE = "google"
    COMPTIA = "comptia"
    PMI = "pmi"
    OTHER = "other"

class DifficultyLevel(str, enum.Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

class MappingSource(str, enum.Enum):
    CURATED = "curated"
    API = "api"
    AI = "ai"

class InteractionType(str, enum.Enum):
    CLICK = "click"
    EARNED = "earned"
    THUMBS_UP = "thumbs_up"
    THUMBS_DOWN = "thumbs_down"

class InteractionSource(str, enum.Enum):
    SKILL_MODULE = "skill_module"
    ROADMAP = "roadmap"
    SEARCH = "search"
```

#### BadgeCatalog Table

```python
class BadgeCatalog(Base, TimestampMixin):
    """Central catalog of known badges and certifications (FR-6.1)."""
    __tablename__ = "badge_catalog"

    id: Mapped[UUID]            = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    external_id: Mapped[str]    = mapped_column(String(255), nullable=False)
    name: Mapped[str]           = mapped_column(String(500), nullable=False)
    issuer: Mapped[str]         = mapped_column(String(255), nullable=False)
    platform: Mapped[str]       = mapped_column(String(50), nullable=False)  # BadgePlatform enum value
    url: Mapped[str]            = mapped_column(String(1000), nullable=False)
    image_url: Mapped[Optional[str]]     = mapped_column(String(1000))
    skills: Mapped[list]        = mapped_column(JSONB, default=list)  # ["azure", "cloud computing"]
    difficulty_level: Mapped[Optional[str]] = mapped_column(String(20))  # DifficultyLevel enum value
    estimated_cost_usd: Mapped[Optional[float]]  = mapped_column(Float)
    estimated_hours: Mapped[Optional[int]]       = mapped_column(Integer)
    renewal_months: Mapped[Optional[int]]        = mapped_column(Integer)  # 0 = lifetime
    is_active: Mapped[bool]     = mapped_column(Boolean, default=True)
    last_refreshed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Relationships
    skill_mappings: Mapped[List["BadgeSkillMapping"]] = relationship(back_populates="badge", cascade="all, delete-orphan")
    interactions: Mapped[List["BadgeInteraction"]]     = relationship(back_populates="badge")

    __table_args__ = (
        Index("idx_badge_catalog_platform_ext", "platform", "external_id", unique=True),
        Index("idx_badge_catalog_active", "is_active"),
        Index("idx_badge_catalog_issuer", "issuer"),
    )
```

#### BadgeSkillMapping Table

```python
class BadgeSkillMapping(Base, TimestampMixin):
    """Explicit skill-to-badge mapping with confidence scores (FR-6.3)."""
    __tablename__ = "badge_skill_mapping"

    id: Mapped[UUID]          = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    badge_id: Mapped[UUID]    = mapped_column(PGUUID(as_uuid=True), ForeignKey("badge_catalog.id", ondelete="CASCADE"))
    skill_name: Mapped[str]   = mapped_column(String(255), nullable=False)  # normalized lowercase
    mapping_confidence: Mapped[float] = mapped_column(Float, default=0.5)   # 0.0-1.0
    source: Mapped[str]       = mapped_column(String(20), default="curated")  # MappingSource enum value

    badge: Mapped["BadgeCatalog"] = relationship(back_populates="skill_mappings")

    __table_args__ = (
        Index("idx_badge_skill_mapping_skill", "skill_name"),
        Index("idx_badge_skill_mapping_badge", "badge_id"),
        Index("idx_badge_skill_mapping_unique", "badge_id", "skill_name", unique=True),
    )
```

#### BadgeInteraction Table

```python
class BadgeInteraction(Base):
    """Tracks user interactions with badge suggestions (FR-5.1, FR-5.3)."""
    __tablename__ = "badge_interactions"

    id: Mapped[UUID]         = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID]    = mapped_column(PGUUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"))
    badge_id: Mapped[UUID]   = mapped_column(PGUUID(as_uuid=True), ForeignKey("badge_catalog.id", ondelete="CASCADE"))
    interaction_type: Mapped[str] = mapped_column(String(20), nullable=False)  # InteractionType enum value
    source: Mapped[str]      = mapped_column(String(20), nullable=False)       # InteractionSource enum value
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    badge: Mapped["BadgeCatalog"] = relationship(back_populates="interactions")

    __table_args__ = (
        Index("idx_badge_interaction_user", "user_id"),
        Index("idx_badge_interaction_badge", "badge_id"),
        Index("idx_badge_interaction_type", "interaction_type"),
    )
```

#### UserBadge Table

```python
class UserBadge(Base, TimestampMixin):
    """Tracks badges a user has earned (FR-5.2)."""
    __tablename__ = "user_badges"

    id: Mapped[UUID]         = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID]    = mapped_column(PGUUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"))
    badge_id: Mapped[UUID]   = mapped_column(PGUUID(as_uuid=True), ForeignKey("badge_catalog.id", ondelete="CASCADE"))
    earned_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    self_reported: Mapped[bool] = mapped_column(Boolean, default=True)

    __table_args__ = (
        Index("idx_user_badge_user", "user_id"),
        Index("idx_user_badge_unique", "user_id", "badge_id", unique=True),
    )
```

### 2.3 API Endpoints

**File**: `backend/app/routes/badges.py`

Router prefix: `/badges`, tags: `["badges"]`

All endpoints follow existing patterns from `routes/skills.py` and `routes/roadmap.py`: FastAPI router, Depends(get_current_user_from_token), Depends(get_db), Pydantic request/response models.

| Method | Path | Description | FR |
|--------|------|-------------|-----|
| GET | `/api/badges/discover` | Discover badges for skills | FR-1.1 |
| GET | `/api/badges/{badge_id}` | Get badge detail | - |
| POST | `/api/badges/interactions` | Record click/rating | FR-5.1, FR-5.3 |
| POST | `/api/badges/earned` | Mark badge as earned | FR-5.2 |
| GET | `/api/badges/analytics` | Admin analytics | FR-5.4 |
| GET | `/api/badges/catalog/search` | Search catalog (autocomplete) | FR-4.5 |

#### Endpoint Details

```
GET /api/badges/discover?skills=azure,python&page=1&per_page=20
  Auth: Required (user token)
  Response: BadgeDiscoverResponse
    {
      "badges": [BadgeResponse, ...],
      "total_count": int,
      "page": int,
      "per_page": int,
      "skills_queried": ["azure", "python"]
    }

GET /api/badges/{badge_id}
  Auth: Required
  Response: BadgeResponse
    {
      "id": "uuid",
      "name": "Azure Solutions Architect Expert",
      "issuer": "Microsoft",
      "platform": "microsoft",
      "url": "https://learn.microsoft.com/...",
      "image_url": "https://...",
      "skills": ["azure", "cloud architecture"],
      "difficulty_level": "advanced",
      "estimated_cost_usd": 165.0,
      "estimated_hours": 120,
      "renewal_months": 12,
      "relevance_score": 0.95,
      "mapping_source": "curated"
    }

POST /api/badges/interactions
  Auth: Required
  Body: BadgeInteractionRequest
    {
      "badge_id": "uuid",
      "interaction_type": "click",  // click | thumbs_up | thumbs_down
      "source": "skill_module"      // skill_module | roadmap | search
    }
  Response: { "recorded": true }

POST /api/badges/earned
  Auth: Required
  Body: BadgeEarnedRequest
    {
      "badge_id": "uuid",
      "earned_date": "2026-01-15T00:00:00Z"  // optional, defaults to now
    }
  Response: { "id": "uuid", "badge_id": "uuid", "earned_date": "..." }

GET /api/badges/analytics
  Auth: Required (admin only)
  Response: BadgeAnalyticsResponse
    {
      "total_badges": int,
      "total_interactions": int,
      "click_through_rates": { "badge_id": float, ... },
      "top_clicked_badges": [...],
      "relevance_ratings": { "positive": int, "negative": int },
      "flagged_badges": [...]  // >60% negative ratings over 50+ ratings
    }

GET /api/badges/catalog/search?q=azure&limit=10
  Auth: Required
  Response: { "results": [BadgeResponse, ...], "count": int }
```

### 2.4 Pydantic Schemas

**File**: `backend/app/schemas/badge.py`

```python
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class BadgeResponse(BaseModel):
    """Single badge in API responses."""
    id: str
    name: str
    issuer: str
    platform: str
    url: str
    image_url: Optional[str] = None
    skills: List[str] = []
    difficulty_level: Optional[str] = None
    estimated_cost_usd: Optional[float] = None
    estimated_hours: Optional[int] = None
    renewal_months: Optional[int] = None
    relevance_score: float = 0.0
    mapping_source: str = "curated"  # curated | api | ai


class BadgeDiscoverResponse(BaseModel):
    """Paginated badge discovery response."""
    badges: List[BadgeResponse] = []
    total_count: int = 0
    page: int = 1
    per_page: int = 20
    skills_queried: List[str] = []


class BadgeInteractionRequest(BaseModel):
    """Record a user interaction with a badge."""
    badge_id: str
    interaction_type: str = Field(..., pattern="^(click|thumbs_up|thumbs_down)$")
    source: str = Field(..., pattern="^(skill_module|roadmap|search)$")


class BadgeEarnedRequest(BaseModel):
    """Mark a badge as earned."""
    badge_id: str
    earned_date: Optional[datetime] = None


class BadgeAnalyticsResponse(BaseModel):
    """Admin analytics for badge suggestions."""
    total_badges: int
    total_interactions: int
    click_through_rates: dict = {}
    top_clicked_badges: List[dict] = []
    relevance_ratings: dict = {"positive": 0, "negative": 0}
    flagged_badges: List[dict] = []
```

### 2.5 Schema Extensions (Existing Files)

#### EYResourceSchema Extension (ADR-003)

**File**: `backend/app/schemas/skill_progress.py`

Add optional fields to `EYResourceSchema`:

```python
class EYResourceSchema(BaseModel):
    title: str
    url: str
    type: str
    badge_available: bool = False
    description: str
    # New optional fields (ADR-003: additive, non-breaking)
    badge_id: Optional[str] = None       # Internal badge catalog ID
    issuer: Optional[str] = None         # "Microsoft", "AWS", "EY"
    image_url: Optional[str] = None      # Badge image URL
    difficulty_level: Optional[str] = None  # beginner/intermediate/advanced/expert
```

#### RoadmapMilestone Extension (ADR-003)

**File**: `backend/app/schemas/roadmap.py`

Add optional `certifications` array to `RoadmapMilestone`:

```python
class MilestoneCertification(BaseModel):
    """Structured certification data on a roadmap milestone."""
    name: str
    provider: str
    url: str
    difficulty_level: Optional[str] = None
    estimated_cost_usd: Optional[float] = None
    estimated_hours: Optional[int] = None

class RoadmapMilestone(BaseModel):
    # ... existing fields unchanged ...
    resources: List[str] = Field(default=[], description="Recommended resources/actions")
    # New optional field (ADR-003: additive, non-breaking)
    certifications: List[MilestoneCertification] = Field(
        default=[],
        description="Structured certification data (Phase B+)"
    )
```

### 2.6 Background Jobs

Background jobs follow the existing pattern in `routes/skills.py` where `BackgroundTasks` from FastAPI is used. For scheduled jobs, we add a lightweight scheduler module.

**File**: `backend/app/jobs/badge_refresh.py`

| Job | Schedule | Source | Description |
|-----|----------|--------|-------------|
| `refresh_microsoft_catalog` | Weekly (configurable) | Microsoft Learn API | Full catalog pull, upsert into badge_catalog |
| `refresh_credly_catalog` | Daily (Phase C) | Credly API | Incremental pull of EY badge templates |
| `validate_badge_urls` | Weekly | badge_catalog | HTTP HEAD check on all active badge URLs |
| `deactivate_stale_entries` | Monthly | badge_catalog | Mark inactive if last_refreshed_at > 90 days and source != curated |

```python
async def refresh_microsoft_catalog(db: Session) -> int:
    """
    Pull full Microsoft Learn certification catalog and upsert into badge_catalog.

    1. GET https://learn.microsoft.com/api/catalog/?type=mergedCertifications
    2. For each certification:
       - Upsert into badge_catalog (platform=microsoft, external_id=uid)
       - Upsert badge_skill_mapping entries from cert.skills array
    3. Update last_refreshed_at
    4. Return count of badges added/updated
    """

async def validate_badge_urls(db: Session) -> dict:
    """
    Validate all active badge URLs via HTTP HEAD.

    1. Query badge_catalog WHERE is_active=True
    2. For each badge, send HEAD request (timeout=10s)
    3. If 4xx/5xx: mark is_active=False, log warning
    4. Return {"checked": N, "deactivated": M}
    """
```

---

## 3. Frontend Architecture

### 3.1 New Components

All new components follow existing patterns: TypeScript (.tsx), Tailwind CSS classes, consistent with the dark/light theming in MilestoneCard.tsx and SkillDetailModal.jsx.

#### `frontend/src/components/badges/BadgeCard.tsx`

Reusable badge display component used in SkillDetailModal and MilestoneCard.

```typescript
interface BadgeCardProps {
  badge: Badge;
  source: 'skill_module' | 'roadmap' | 'search';
  onEarnedToggle?: (badgeId: string) => void;
  onRate?: (badgeId: string, rating: 'thumbs_up' | 'thumbs_down') => void;
  compact?: boolean;  // Compact mode for inline lists
}

// Renders:
// - Badge name + issuer logo/name
// - Difficulty level indicator (color-coded)
// - "View Badge" link (opens external URL, tracks click via POST /api/badges/interactions)
// - "Earned" toggle button (optional, Phase D)
// - Thumbs up/down rating (optional, Phase D)
// - Verified/Suggested indicator based on mapping_source
```

#### `frontend/src/components/badges/BadgeSearch.tsx`

Searchable autocomplete for badge catalog, used in AddExtraModal.

```typescript
interface BadgeSearchProps {
  onSelect: (badge: Badge) => void;
  placeholder?: string;
}

// Behavior:
// - Input with debounced search (300ms)
// - GET /api/badges/catalog/search?q={input}&limit=10
// - Dropdown with badge name, issuer, difficulty
// - On select: calls onSelect with full badge data
```

#### `frontend/src/components/badges/BadgeSection.tsx`

Section component for SkillDetailModal showing discovered badges.

```typescript
interface BadgeSectionProps {
  skillName: string;
}

// Behavior:
// - On mount: GET /api/badges/discover?skills={skillName}
// - Shows loading skeleton while fetching (ADR-004: async, non-blocking)
// - Renders list of BadgeCard components
// - Shows "Some results may be limited" if external APIs were unavailable
// - Falls back to skill-specific Credly search link if no results
```

### 3.2 Modified Components

#### `SkillDetailModal.jsx`

**Changes**:
1. Import and render `BadgeSection` component after EY Resources section
2. Update EY resource rendering to show distinct badge icon when `badge_id` is present
3. Remove or wire up the dead `certifications` section at line 620-634:
   - Phase A: Remove the section (it only renders with mock data)
   - Phase B+: Replace with `BadgeSection` which shows real data

#### `MilestoneCard.tsx`

**Changes**:
1. For certification milestones: render `certifications[]` array as clickable `BadgeCard` components (compact mode)
2. Auto-link URLs in `resources[]` strings:
   ```typescript
   // Detect URLs in resource strings
   const urlRegex = /(https?:\/\/[^\s]+)/g;
   // Replace with <a> tags
   ```
3. Track clicks on certification links via `badgeService.recordInteraction()`

#### `ExtrasSection.tsx`

**Changes**:
1. When category === "certification", show `BadgeSearch` autocomplete in the add modal
2. Pre-fill title and description from selected badge

#### `AddExtraModal.tsx`

**Changes**:
1. Add `BadgeSearch` integration when category is "Certification"
2. On badge select: populate title with badge name, add badge URL to description

### 3.3 New Service

**File**: `frontend/src/services/badgeService.ts`

```typescript
import api from './api';

export interface Badge {
  id: string;
  name: string;
  issuer: string;
  platform: string;
  url: string;
  image_url?: string;
  skills: string[];
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimated_cost_usd?: number;
  estimated_hours?: number;
  renewal_months?: number;
  relevance_score: number;
  mapping_source: 'curated' | 'api' | 'ai';
}

export interface BadgeDiscoverResponse {
  badges: Badge[];
  total_count: number;
  page: number;
  per_page: number;
  skills_queried: string[];
}

export async function discoverBadges(
  skills: string[],
  page: number = 1,
  perPage: number = 20
): Promise<BadgeDiscoverResponse> {
  const response = await api.get('/badges/discover', {
    params: { skills: skills.join(','), page, per_page: perPage }
  });
  return response.data;
}

export async function getBadge(badgeId: string): Promise<Badge> {
  const response = await api.get(`/badges/${badgeId}`);
  return response.data;
}

export async function recordInteraction(
  badgeId: string,
  interactionType: 'click' | 'thumbs_up' | 'thumbs_down',
  source: 'skill_module' | 'roadmap' | 'search'
): Promise<void> {
  await api.post('/badges/interactions', {
    badge_id: badgeId,
    interaction_type: interactionType,
    source,
  });
}

export async function markBadgeEarned(
  badgeId: string,
  earnedDate?: string
): Promise<{ id: string; badge_id: string; earned_date: string }> {
  const response = await api.post('/badges/earned', {
    badge_id: badgeId,
    earned_date: earnedDate,
  });
  return response.data;
}

export async function searchCatalog(
  query: string,
  limit: number = 10
): Promise<{ results: Badge[]; count: number }> {
  const response = await api.get('/badges/catalog/search', {
    params: { q: query, limit }
  });
  return response.data;
}
```

### 3.4 Frontend Type Extensions

**File**: `frontend/src/services/skillProgressService.ts`

Extend `EYResource` interface:

```typescript
export interface EYResource {
  title: string;
  url: string;
  type: string;
  badge_available: boolean;
  description: string;
  // New optional fields (Phase B+)
  badge_id?: string;
  issuer?: string;
  image_url?: string;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}
```

**File**: `frontend/src/services/roadmapService.ts`

Extend `RoadmapMilestone` interface:

```typescript
export interface MilestoneCertification {
  name: string;
  provider: string;
  url: string;
  difficulty_level?: string;
  estimated_cost_usd?: number;
  estimated_hours?: number;
}

export interface RoadmapMilestone {
  // ... existing fields unchanged ...
  resources: string[];
  // New optional field (Phase B+)
  certifications?: MilestoneCertification[];
}
```

---

## 4. AI Integration

### 4.1 Learning Content Service Enhancement

**File**: `backend/app/services/learning_content_service.py`

#### Phase A: Quick Wins

Replace static `EY_RESOURCES["badges"]` with skill-specific URLs:

```python
# Before (generic):
EY_RESOURCES = {
    "badges": "https://www.credly.com/organizations/ey/badges",
}

# After (skill-specific in fallback):
def _generate_fallback_content(skill_name, module_title, skill_type):
    skill_encoded = skill_name.replace(" ", "+").replace("#", "%23")
    ey_resources = [
        {
            "title": f"EY Badges for {skill_name}",
            "url": f"https://www.credly.com/organizations/ey/badges?search={skill_encoded}",
            "type": "badge",
            "badge_available": True,
            "description": f"Search EY badges related to {skill_name}"
        },
        # ... Virtual Academy unchanged ...
    ]
```

#### Phase B: Badge-Aware Content Generation

Update `LEARNING_CONTENT_PROMPT` to inject known badges:

```python
# In generate_module_learning_content():
# 1. Query BadgeDiscoveryService for this skill
# 2. Inject results into prompt:

BADGE_INJECTION = """
## VERIFIED BADGES AND CERTIFICATIONS FOR THIS SKILL:
{badge_list}

IMPORTANT: When suggesting EY resources or certifications, prefer the VERIFIED badges listed above.
For each verified badge, use the EXACT URL provided. Do NOT invent badge names or URLs.
Mark verified badges with badge_id so the frontend can display them with verification indicators.
"""
```

### 4.2 Roadmap Service Enhancement

**File**: `backend/app/services/roadmap_service.py`

Update `_build_prompt()` to inject known certifications:

```python
# In _build_prompt():
# 1. Collect all required_skills from target roles
# 2. Query BadgeDiscoveryService.get_badges_for_skills(all_skills)
# 3. Inject into prompt:

CERT_INJECTION = """
## KNOWN CERTIFICATIONS FOR TARGET ROLE SKILLS:
{cert_list}

When creating certification milestones, reference these REAL certifications with their exact names and URLs.
Include the certification name, provider, URL, cost, and difficulty level in the milestone resources.
Format certification resources as: "CERT: {name} | {provider} | {url} | ${cost} | {difficulty}"
"""
```

Update `_build_response()` to parse structured cert data:

```python
# In _build_response(), when parsing milestones:
# If category == "certification" and resources contain "CERT:" prefix:
#   Parse structured cert data into MilestoneCertification objects
#   Populate milestone.certifications[] array
```

### 4.3 Phase D: Sentence-BERT Semantic Matching

For skills that lack curated mappings and don't match API keywords, use embedding similarity:

```
1. Pre-compute embeddings for all badge_catalog entries:
   - Combine name + description + skills into a single text
   - Generate embedding using Sentence-BERT (all-MiniLM-L6-v2)
   - Store in badge_catalog.embedding column (pgvector)

2. At query time:
   - Generate embedding for user's skill name
   - Compute cosine similarity against all badge embeddings
   - Return badges with similarity > 0.3 threshold
   - Confidence = similarity_score * 0.5 (capped at 0.5)
```

This uses the same embedding infrastructure already present in `backend/app/models/skill_embedding.py`.

---

## 5. Caching Strategy

### 5.1 Redis Key Patterns and TTLs

| Key Pattern | TTL | Description |
|-------------|-----|-------------|
| `badge:discover:{skills_hash}` | 24 hours | Discovery results for a skill set |
| `badge:catalog:{badge_id}` | 7 days | Individual badge detail |
| `badge:catalog:search:{query}` | 1 hour | Search results |
| `badge:ms_learn:catalog` | 7 days | Full MS Learn catalog snapshot |
| `badge:credly:catalog:{org}` | 1 hour | Credly org badge templates |
| `badge:skills_map:{skill}` | 24 hours | Curated mappings for a skill |

Key format details:
- `skills_hash` = MD5 of sorted, lowercased, comma-joined skill names
- All values stored as JSON-serialized strings

### 5.2 Cache Invalidation

| Event | Invalidation |
|-------|--------------|
| Catalog refresh job completes | Delete `badge:discover:*`, `badge:catalog:*`, `badge:skills_map:*` |
| Manual catalog update (admin) | Delete affected `badge:catalog:{id}` and `badge:skills_map:{skill}` |
| Badge deactivated | Delete `badge:catalog:{id}` and all `badge:discover:*` |

### 5.3 Cache Warm-up

On application startup or post-refresh:
1. Pre-compute discovery results for top 50 skills (from user_skills frequency)
2. Load all curated badge_skill_mapping entries into Redis
3. Cache full Microsoft Learn catalog snapshot

### 5.4 Fallback Behavior

When Redis is unavailable (NFR-2):
- Query PostgreSQL directly
- Accept higher latency (200ms -> 500-1000ms)
- Log warning, do not fail the request

---

## 6. Migration Strategy

### 6.1 Alembic Migration

Create a single migration for all four new tables:

```python
# alembic/versions/xxxx_add_badge_tables.py

def upgrade():
    # 1. badge_catalog table
    op.create_table('badge_catalog', ...)

    # 2. badge_skill_mapping table
    op.create_table('badge_skill_mapping', ...)

    # 3. badge_interactions table
    op.create_table('badge_interactions', ...)

    # 4. user_badges table
    op.create_table('user_badges', ...)

def downgrade():
    op.drop_table('user_badges')
    op.drop_table('badge_interactions')
    op.drop_table('badge_skill_mapping')
    op.drop_table('badge_catalog')
```

### 6.2 Seed Data Strategy

**File**: `backend/app/data/badge_seed.py`

Seed with 50+ curated certifications across major platforms:

| Platform | Count | Examples |
|----------|-------|---------|
| Microsoft/Azure | 20+ | Azure Solutions Architect Expert, Azure Developer Associate, Azure AI Engineer, etc. |
| AWS | 12 | Solutions Architect (Assoc/Pro), Developer Associate, SysOps Associate, Cloud Practitioner, etc. |
| Google Cloud | 10 | Associate Cloud Engineer, Professional Cloud Architect, Professional Data Engineer, etc. |
| CompTIA | 15 | A+, Security+, Network+, Cloud+, Data+, Linux+, etc. |
| PMI | 7 | PMP, CAPM, PMI-ACP, PMI-PBA, PgMP, PfMP, PMI-RMP |
| EY/Credly | 5+ | EY Strategy Learning, EY Data Strategy, etc. (known vanity slugs) |

Each seed entry includes:
- `external_id`, `name`, `issuer`, `platform`, `url`
- `skills` array (for keyword matching)
- `difficulty_level`, `estimated_cost_usd`, `estimated_hours`, `renewal_months`
- Badge-skill mappings with `confidence=1.0`, `source=curated`

Seed script runs as a CLI command or Alembic data migration:
```bash
python -m backend.app.data.badge_seed
```

### 6.3 Backward Compatibility Plan (ADR-003)

All changes to existing schemas are additive:

1. **EYResourceSchema**: New fields (`badge_id`, `issuer`, `image_url`, `difficulty_level`) are Optional with `None` defaults. Existing data continues to work.

2. **RoadmapMilestone**: New `certifications` field defaults to `[]`. Existing roadmap JSON in `saved_roadmaps.roadmap_data` is unaffected since the field is optional.

3. **Frontend interfaces**: New optional properties added to `EYResource` and `RoadmapMilestone` TypeScript interfaces. Existing component rendering is unchanged for data without the new fields.

4. **No existing data migration needed**: Old records function identically. New fields are populated only for newly generated content.

---

## 7. ADR Index

| ADR | Title | File |
|-----|-------|------|
| ADR-001 | Curated Catalog as Primary Source | `artifacts/design/decisions/ADR-001-curated-catalog-primary.md` |
| ADR-002 | Microsoft Learn API First, Credly API Second | `artifacts/design/decisions/ADR-002-microsoft-learn-first.md` |
| ADR-003 | Additive Schema Changes with Optional Fields | `artifacts/design/decisions/ADR-003-additive-schema-changes.md` |
| ADR-004 | Async Badge Loading (Non-Blocking UI) | `artifacts/design/decisions/ADR-004-async-badge-loading.md` |
| ADR-005 | Badge Interaction Tracking for ROI Measurement | `artifacts/design/decisions/ADR-005-interaction-tracking.md` |

---

## Appendix A: Phase-to-File Mapping

### Phase A: Quick Wins + Curated Catalog

| File | Action | FR |
|------|--------|-----|
| `backend/app/services/learning_content_service.py` | Replace generic URLs with skill-specific | FR-7.1, FR-7.2 |
| `backend/app/models/badge.py` | Create BadgeCatalog, BadgeSkillMapping, BadgeInteraction, UserBadge models | FR-6.1, FR-6.3 |
| `backend/app/data/badge_seed.py` | Seed 50+ curated entries | FR-6.2 |
| `backend/app/schemas/badge.py` | Create badge schemas | - |
| `backend/app/routes/badges.py` | Create POST /interactions endpoint | FR-5.1 |
| `frontend/src/components/roadmap/MilestoneCard.tsx` | Auto-link URLs in resources | FR-7.3 |
| `frontend/src/components/skills/SkillDetailModal.jsx` | Remove dead certifications section | FR-7.4 |
| `frontend/src/components/skills/SkillDetailModal.jsx` | Badge icon for badge-type resources | FR-7.5 |
| Alembic migration | Create 4 new tables | - |

### Phase B: MS Learn API + Discovery Service

| File | Action | FR |
|------|--------|-----|
| `backend/app/services/badge_discovery_service.py` | Full discovery service with matching engine | FR-1, FR-2 |
| `backend/app/services/microsoft_learn_client.py` | MS Learn API client | FR-1.2 |
| `backend/app/routes/badges.py` | GET /discover, GET /{id}, GET /catalog/search endpoints | FR-1.1, FR-4.5 |
| `backend/app/schemas/skill_progress.py` | Extend EYResourceSchema | FR-3.2 |
| `backend/app/schemas/roadmap.py` | Extend RoadmapMilestone with certifications | FR-4.1 |
| `backend/app/services/learning_content_service.py` | Inject verified badges into AI prompt | FR-3.3 |
| `backend/app/services/roadmap_service.py` | Inject known certs into roadmap prompt | FR-4.2 |
| `backend/app/jobs/badge_refresh.py` | Weekly MS Learn catalog refresh | FR-6.4 |
| `frontend/src/services/badgeService.ts` | Badge API client | - |
| `frontend/src/components/badges/BadgeCard.tsx` | Badge display component | FR-3.1 |
| `frontend/src/components/badges/BadgeSection.tsx` | Badge section for skill modals | FR-3.1 |
| `frontend/src/components/roadmap/MilestoneCard.tsx` | Structured cert rendering | FR-4.3 |
| `frontend/src/services/skillProgressService.ts` | Extend EYResource interface | FR-3.2 |
| `frontend/src/services/roadmapService.ts` | Extend RoadmapMilestone interface | FR-4.1 |

### Phase C: Credly API

| File | Action | FR |
|------|--------|-----|
| `backend/app/services/credly_client.py` | Credly API client | FR-1.2 |
| `backend/app/services/badge_discovery_service.py` | Add CredlyMatcher | FR-2 |
| `backend/app/jobs/badge_refresh.py` | Daily Credly catalog refresh | FR-6.5 |
| `frontend/src/components/badges/BadgeSearch.tsx` | Searchable autocomplete | FR-4.5 |
| `frontend/src/components/roadmap/AddExtraModal.tsx` | Badge autocomplete integration | FR-4.5 |

### Phase D: AI Matching + Analytics

| File | Action | FR |
|------|--------|-----|
| `backend/app/services/badge_discovery_service.py` | Add SemanticMatcher | FR-2.4 |
| `backend/app/routes/badges.py` | POST /earned, GET /analytics endpoints | FR-5.2, FR-5.4 |
| `frontend/src/components/badges/BadgeCard.tsx` | Earned toggle, relevance rating | FR-5.2, FR-5.3 |
| `backend/app/jobs/badge_refresh.py` | Monthly confidence recalculation | FR-5.5 |


---

## 7.9 Cedric Avatar Architecture

*Source: artifacts/design/architecture-cedric-avatar.md*

# Architecture: Cedric Avatar Companion System

**Date**: 2026-02-12
**Author**: Architect agent
**Status**: Architecture Document
**Upstream**: avatar-guide-concept.md, avatar-concept.md, avatar-research.md, avatar-guide-research.md

---

## Table of Contents

1. [Overview](#1-overview)
2. [Component Hierarchy](#2-component-hierarchy)
3. [State Management Architecture](#3-state-management-architecture)
4. [React Joyride Integration](#4-react-joyride-integration)
5. [Speech Bubble System](#5-speech-bubble-system)
6. [Animation System](#6-animation-system)
7. [Asset Architecture](#7-asset-architecture)
8. [Onboarding Flow Architecture](#8-onboarding-flow-architecture)
9. [Loading Narrator Architecture](#9-loading-narrator-architecture)
10. [Contextual Guidance Architecture](#10-contextual-guidance-architecture)
11. [Backend Changes](#11-backend-changes)
12. [ADR Log](#12-adr-log)

---

## 1. Overview

### System Purpose

Cedric is a persistent on-screen pixel-art companion character that serves three roles:

1. **Onboarding guide** -- walks new users through the platform via a React Joyride walkthrough disguised as the first quest
2. **Roadmap assistant** -- narrates AI loading states with phased dialogue and animations
3. **Contextual companion** -- provides page-specific tips, celebrates achievements, and reflects equipped cosmetic items

### Integration Surface

Cedric plugs into the existing gamification infrastructure without replacing it:

| Existing System | How Cedric Uses It |
|---|---|
| `AdventureModeContext` | Reads `enabled`, `level`, `gold`, `equipped_items`, notification events |
| `progressionApi` | Reads `ProgressionState` for walkthrough detection and progression data |
| `storeApi.equip()` / `unequip()` | Equipment changes flow through React Query invalidation to the avatar |
| `NotificationToasts` | Remains the primary notification system; Cedric's reactions supplement it visually |
| `reward_hook_service` | Backend walkthrough step rewards dispatched through existing reward pipeline |
| `ThemeContext` | Determines speech bubble style (game/light/dark) and whether avatar is medieval or modern |

### New Dependency

| Package | Version | Size | Purpose |
|---|---|---|---|
| `react-joyride` | `^2.9` | ~25 KB | Walkthrough spotlight overlay with custom tooltip rendering |

### Key Design Decisions

- **D-CA-001**: Separate `CedricContext` rather than extending `AdventureModeContext` (see ADR section)
- **D-CA-002**: DOM/CSS layered PNGs for equipment rendering (validated by avatar-research.md)
- **D-CA-003**: CSS sprite sheets + Framer Motion for animation (zero new rendering dependencies)
- **D-CA-004**: Speech queue with priority levels and anti-annoyance protocol
- **D-CA-005**: Walkthrough as a real quest in the quest system with backend progression tracking

---

## 2. Component Hierarchy

### Tree

```
AvatarCompanion (root - fixed position wrapper)
├── AvatarSprite (the character + equipment layers)
│   ├── BaseSpriteLayer (base body, always present)
│   ├── EquipmentLayer × 8 (one per slot, z-indexed)
│   ├── RarityEffectLayer (glow/particles per highest-rarity equipped item)
│   ├── AnimationController (manages current animation state via CSS class)
│   └── Pedestal (base platform, changes with level)
├── SpeechBubble (dialogue/tips/actions)
│   ├── TypingAnimation (character-by-character reveal)
│   ├── ActionButtons (optional 1-2 buttons)
│   └── DismissButton (X close + optional "Don't show again")
├── CharacterSheet (mini popup on click)
│   ├── EquipmentGrid (8 slots, 2×4)
│   └── StatsDisplay (level, XP, coins)
├── NamePlate (title + level below pedestal)
└── WalkthroughOverlay (React Joyride wrapper, active during onboarding)
```

### Component Specifications

#### `AvatarCompanion` (Root)

**Location**: `frontend/src/components/avatar/AvatarCompanion.tsx`

```typescript
interface AvatarCompanionProps {
  // No props -- reads all state from CedricContext and AdventureModeContext
}

// Internal state managed by CedricContext:
// - visibility: 'full' | 'minimized' | 'hidden'
// - position: { anchor: 'bottom-right' | 'bottom-left' | 'bottom-center' }
// - characterSheetOpen: boolean
// - walkthroughActive: boolean
```

**Responsibilities**:
- Fixed-position container at `z-index: 35` (below HUD at 40, above page content)
- Default position: bottom-right, 24px from edges
- Renders nothing when `adventureMode.enabled === false` AND `isNewUser === false`
- For non-adventure new users: renders modern guide variant (compass icon)
- Manages entrance/exit animations via Framer Motion `AnimatePresence`
- Delegates all subcomponent rendering

**Sizing**:
- Full mode: 160×180px container (128×128 sprite + 128×32 pedestal + 128×20 nameplate)
- Minimized: 32×32px (just the character head, circular border)
- Store page expanded: 192×192px sprite (automatic on `/store` route)
- Loading narrator: 192×192px centered in loading area (not in the fixed-position container)

#### `AvatarSprite`

**Location**: `frontend/src/components/avatar/AvatarSprite.tsx`

```typescript
interface AvatarSpriteProps {
  size: 64 | 128 | 192;           // CSS pixel size (sprite renders at 2x, 3x, or 4x)
  equippedItems: Record<string, CosmeticBrief | null>;
  animationState: AnimationState;
  colorPalette: string | null;     // CSS color overlay value
  level: number;                   // For pedestal variant
  showPedestal?: boolean;          // Default true
  showNameplate?: boolean;         // Default true
  className?: string;
}
```

**Responsibilities**:
- Renders base sprite + equipment layers as stacked `<img>` elements with `position: absolute`
- Applies `image-rendering: pixelated` for crisp pixel art
- Applies color palette via CSS `mix-blend-mode: multiply` overlay div
- Applies rarity effects per-layer via CSS filters and Framer Motion particles
- Delegates animation state to CSS class on the container

**Equipment Layer Order** (back to front):

| Layer | Z-Index | Slot | Notes |
|---|---|---|---|
| Banner | 0 | `banner` | Behind character body |
| Base Body | 1 | (always) | Default sprite, never removed |
| Boots | 2 | `boots` | Feet layer |
| Armor | 3 | `armor` | Torso overlay |
| Cape | 4 | `cape` | Behind head, over armor |
| Hairstyle | 5 | `hairstyle` | Head layer, replaces default hair |
| Jewelry | 6 | `jewelry` | Small bright details on body |
| Emblem | 7 | `emblem` | Shield/badge on chest/arm |

Each `<img>` uses the same 64×64 canvas size with transparent backgrounds, pre-aligned so they stack without manual offsets.

#### `SpeechBubble`

**Location**: `frontend/src/components/avatar/SpeechBubble.tsx`

```typescript
interface SpeechBubbleProps {
  message: SpeechMessage | null;
  theme: 'game' | 'light' | 'dark';
  onDismiss: () => void;
  onAction?: (actionId: string) => void;
  position: 'above' | 'beside';     // 'above' default, 'beside' for loading stage
}
```

**Responsibilities**:
- Renders styled bubble with theme-appropriate styling
- Typing animation for narrative/walkthrough messages (25ms per character)
- Action button rendering with fade-in after text completes
- Dismiss button (X) and optional "Don't show again" link
- Framer Motion entrance/exit animations
- Pointer triangle aimed at the avatar

#### `CharacterSheet`

**Location**: `frontend/src/components/avatar/CharacterSheet.tsx`

```typescript
interface CharacterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  equippedItems: Record<string, CosmeticBrief | null>;
  level: number;
  title: string;
  xp: { current: number; toNext: number };
  gold: number;
}
```

**Responsibilities**:
- Slide-in panel from bottom-right on click
- 192×192 enlarged avatar preview at top
- 2×4 equipment grid showing slot name + item name (or "Empty")
- Stats: level, title, XP bar, gold
- "Visit Armory" link to `/store`

#### `WalkthroughOverlay`

**Location**: `frontend/src/components/avatar/WalkthroughOverlay.tsx`

```typescript
interface WalkthroughOverlayProps {
  isActive: boolean;
  currentStep: number;
  onStepComplete: (stepIndex: number) => void;
  onComplete: () => void;
  onSkip: () => void;
}
```

**Responsibilities**:
- Wraps `react-joyride` with `run={isActive}` and `controlled={true}`
- Custom `tooltipComponent` that renders `AvatarSprite` + `SpeechBubble` as the tooltip
- Step definitions with target selectors, Cedric dialogue, and avatar animation states
- Callback integration for step transitions, rewards, and navigation
- Skip button ("Skip Tutorial") in the step progress indicator

---

## 3. State Management Architecture

### New CedricContext

A dedicated `CedricContext` manages Cedric-specific state. It lives *inside* the `AdventureModeProvider` in the component tree and reads from `AdventureModeContext` via `useAdventureMode()`.

**Location**: `frontend/src/context/CedricContext.tsx`

**Rationale for separation (D-CA-001)**:
- `AdventureModeContext` already has 15+ state fields and 12+ methods; adding Cedric state (animation, speech queue, walkthrough, guidance) would push it to 30+ fields
- Cedric can be feature-flagged independently
- Clear ownership boundary: `AdventureModeContext` = gamification numbers, `CedricContext` = companion behavior

```typescript
interface CedricState {
  // Visibility
  visibility: 'full' | 'minimized' | 'hidden';
  position: { anchor: 'bottom-right' | 'bottom-left' | 'bottom-center' };

  // Animation
  animationState: AnimationState;
  animationQueue: AnimationQueueEntry[];

  // Speech
  currentMessage: SpeechMessage | null;
  speechQueue: SpeechMessage[];

  // Walkthrough
  walkthroughActive: boolean;
  walkthroughStep: number;       // 0-based, -1 = not started
  walkthroughComplete: boolean;  // From backend
  isNewUser: boolean;            // onboarding_complete === false

  // Guidance
  quietMode: boolean;
  sessionMessageCount: number;   // For daily cap (max 8 proactive)
  lastMessageTimestamp: number;  // For cooldown (90s)

  // UI
  characterSheetOpen: boolean;
}

interface CedricContextType {
  state: CedricState;

  // Speech
  enqueueMessage: (message: SpeechMessage) => void;
  dismissCurrentMessage: () => void;
  suppressMessageType: (messageType: string) => void;

  // Animation
  triggerAnimation: (animation: AnimationState, duration?: number) => void;

  // Walkthrough
  startWalkthrough: () => void;
  advanceWalkthrough: () => void;
  skipWalkthrough: () => void;
  completeWalkthrough: () => void;

  // Visibility
  minimize: () => void;
  restore: () => void;
  toggleQuietMode: () => void;

  // Character sheet
  openCharacterSheet: () => void;
  closeCharacterSheet: () => void;
}
```

### Provider Placement in Component Tree

```
<App>
  <ProtectedRoute>
    <AdventureModeProvider>
      <ToastProvider>
        <CedricProvider>           {/* NEW */}
          <MatchesProvider>
            <SavedRolesProvider>
              <SkillsProvider>
                <MainLayout />     {/* AvatarCompanion rendered inside */}
              </SkillsProvider>
            </SavedRolesProvider>
          </MatchesProvider>
        </CedricProvider>
      </ToastProvider>
    </AdventureModeProvider>
  </ProtectedRoute>
</App>
```

### Animation State Machine

```typescript
enum AnimationState {
  // Idle progression (automatic, inactivity-driven)
  Idle = 'idle',                      // Default: breathing/bobbing (2s cycle)
  LookAround = 'lookAround',         // Random every 15-20s
  Sitting = 'sitting',               // After 30s inactivity
  Sleeping = 'sleeping',             // After 2min inactivity
  WakeUp = 'wakeUp',                 // On user activity from sleeping

  // Reactions (triggered by game events, play once then return to Idle)
  JumpXP = 'jumpXP',                 // +6px jump, floating XP text
  CelebrateLevelUp = 'celebrateLevelUp',  // +16px jump, confetti, glow
  CatchCoin = 'catchCoin',           // Coin falls, character catches
  HoldTrophy = 'holdTrophy',         // Achievement unlocked
  VictoryPose = 'victoryPose',       // Quest complete
  SpinNewItem = 'spinNewItem',       // Store purchase
  WaveHello = 'waveHello',           // Login streak, first appearance

  // Contextual (held states during specific app activities)
  Thinking = 'thinking',             // Loading states <5s
  Reading = 'reading',               // Roadmap generation phase 1-2
  Pointing = 'pointing',             // Walkthrough, directing attention
  Confused = 'confused',             // API error
  Excited = 'excited',               // Higher bob rate, slight bouncing
  LookingFar = 'lookingFar',         // Match loading (spyglass)
  TracingLines = 'tracingLines',     // Roadmap generation phase 3
  LookingUp = 'lookingUp',           // Roadmap generation phase 4
}
```

**Transition Rules**:

| From | To | Trigger |
|---|---|---|
| Any | WakeUp | User activity when in Sleeping |
| Any | Reaction (Jump, Trophy, etc.) | Game event fires |
| Any reaction | Idle | Reaction animation completes |
| Idle | LookAround | Random timer (15-20s) |
| LookAround | Idle | After 2s hold |
| Idle | Sitting | 30s inactivity |
| Sitting | Sleeping | 2min inactivity |
| Sleeping | WakeUp → Idle | User activity (with 0.3s debounce) |
| Any | Contextual state | Loading/walkthrough/error begins |
| Contextual | Idle | Loading/walkthrough/error ends |

**Interrupt priority** (higher number interrupts lower):
1. Idle states (Idle, LookAround, Sitting, Sleeping) -- lowest, interruptible by anything
2. Contextual states (Thinking, Reading, Pointing) -- interruptible by reactions
3. Reactions (JumpXP, CatchCoin) -- play to completion, queue subsequent reactions
4. Major reactions (CelebrateLevelUp, VictoryPose) -- never interrupted, always play

### Speech Queue

```typescript
interface SpeechMessage {
  id: string;
  text: string;
  priority: 'walkthrough' | 'reward' | 'reaction' | 'proactive';
  duration: number;              // Auto-dismiss in ms (default 8000)
  typing: boolean;               // True for narrative, false for quick tips
  actions?: SpeechAction[];      // Up to 2 buttons
  dismissible: boolean;          // Show X button (default true)
  suppressible: boolean;         // Show "Don't show again" link
  messageType?: string;          // For frequency tracking
  avatarState?: AnimationState;  // Set avatar to this state while showing
  onDismiss?: () => void;
}

interface SpeechAction {
  id: string;
  label: string;
  variant: 'primary' | 'ghost';
  onClick: () => void;
}
```

**Queue Management Rules**:

1. Messages enter a FIFO queue sorted by priority
2. Current message displays for its `duration` or until dismissed
3. On dismissal/timeout, next queued message appears (with exit/entrance animation, ~0.5s gap)
4. If queue exceeds 3 messages, `proactive` and `reaction` priorities are dropped (only `walkthrough` and `reward` preserved)
5. Queue is cleared on route change except `reward` and `walkthrough` messages
6. 90-second cooldown between `proactive` messages (tracked by `lastMessageTimestamp`)
7. Maximum 8 `proactive` messages per session (tracked by `sessionMessageCount`)

### Walkthrough Progress Persistence

Walkthrough progress is stored in **two places**:

1. **Backend** (`user_progression` table, new fields): `walkthrough_step` (int), `walkthrough_completed` (bool) -- authoritative state, survives logout
2. **CedricContext** (in-memory): mirrors backend state, updated optimistically on step completion

On mount, `CedricProvider` reads `progressionApi.getProgression()` to determine:
- `isNewUser = !progression.onboarding_complete` (existing field on `UserProfile`)
- `walkthroughStep = progression.walkthrough_step` (new field)
- `walkthroughComplete = progression.walkthrough_completed` (new field)

---

## 4. React Joyride Integration

### Installation

```bash
npm install react-joyride
```

### Usage Pattern: Controlled Mode

React Joyride runs in controlled mode where `CedricContext` owns `stepIndex` and `run` state:

```typescript
<Joyride
  steps={WALKTHROUGH_STEPS}
  run={state.walkthroughActive}
  stepIndex={state.walkthroughStep}
  continuous={false}                    // We control step advancement
  scrollToFirstStep={true}
  showSkipButton={false}               // Custom skip in our tooltip
  disableOverlayClose={true}
  disableCloseOnEsc={true}
  tooltipComponent={CedricTooltip}     // Custom: renders avatar + speech bubble
  spotlightClicks={true}               // Allow clicking spotlighted elements
  callback={handleJoyrideCallback}
  styles={{
    options: {
      zIndex: 45,                      // Above HUD (40), below modals (50)
      arrowColor: 'transparent',       // We use our own pointer
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
  }}
/>
```

### Custom Tooltip Component

The `tooltipComponent` prop replaces Joyride's default tooltip with Cedric's avatar and speech bubble:

```typescript
function CedricTooltip({
  step,
  index,
  tooltipProps,
  primaryProps,
  backProps,
  skipProps,
  isLastStep,
}: TooltipRenderProps) {
  const { state: cedricState } = useCedric();

  return (
    <div {...tooltipProps} className="cedric-walkthrough-tooltip">
      {/* Step progress indicator */}
      <div className="text-xs text-amber-400 mb-1">
        Step [{index + 1}/{TOTAL_STEPS}]
        <button className="ml-4 text-gray-500 underline" {...skipProps}>
          Skip Tutorial
        </button>
      </div>

      {/* Speech bubble with walkthrough text */}
      <SpeechBubble
        message={{
          text: step.content as string,
          priority: 'walkthrough',
          typing: true,
          duration: 0,  // No auto-dismiss during walkthrough
          dismissible: false,
        }}
        theme={/* from ThemeContext */}
        onDismiss={() => {}}
        position="above"
      />

      {/* Avatar sprite in the tooltip */}
      <AvatarSprite
        size={128}
        equippedItems={/* from AdventureModeContext */}
        animationState={step.data?.avatarState || AnimationState.Pointing}
        colorPalette={null}
        level={/* from AdventureModeContext */}
        showPedestal={true}
        showNameplate={false}
      />
    </div>
  );
}
```

### Step Definitions

```typescript
interface WalkthroughStepData {
  avatarState: AnimationState;
  rewardXP: number;
  rewardGold: number;
  completionDetection: 'navigation' | 'action' | 'timer' | 'element-click';
  targetRoute?: string;         // Route to navigate to when step activates
  completionRoute?: string;     // Route that signals step completion
  completionSelector?: string;  // Element that must be clicked
  completionTimer?: number;     // Auto-complete after N ms
}

const WALKTHROUGH_STEPS: Step[] = [
  // Step 0: "Forge Your Identity" -- Navigate to Profile
  {
    target: '[data-tour="nav-profile"]',   // Sidebar nav item
    content: 'First, we must inscribe your name and abilities in the Guild Registry. The realm cannot match you to worthy quests without knowing your strengths!',
    placement: 'right',
    data: {
      avatarState: AnimationState.Pointing,
      rewardXP: 100,
      rewardGold: 50,
      completionDetection: 'action',       // Resume upload success callback
      targetRoute: '/profile',
    } as WalkthroughStepData,
  },
  // Step 1: "Survey the Quest Board" -- Navigate to Matches
  {
    target: '[data-tour="nav-matches"]',
    content: 'Now let us visit the Quest Board. The Guild has opportunities that match your abilities. This way!',
    placement: 'right',
    data: {
      avatarState: AnimationState.Pointing,
      rewardXP: 50,
      rewardGold: 0,
      completionDetection: 'timer',
      completionTimer: 5000,               // Auto-complete after 5s on page
      targetRoute: '/matches',
    } as WalkthroughStepData,
  },
  // Step 2: "Mark Your First Quest" -- Save a role
  {
    target: '[data-tour="save-role-button"]',
    content: 'A wise adventurer marks the quests that interest them most. Find a role that calls to you and press the "Mark Quest" button to save it!',
    placement: 'bottom',
    data: {
      avatarState: AnimationState.Pointing,
      rewardXP: 100,
      rewardGold: 50,
      completionDetection: 'action',       // Save role callback
    } as WalkthroughStepData,
  },
  // Step 3: "Chart Your Course" -- Navigate to Roadmap
  {
    target: '[data-tour="nav-roadmap"]',
    content: 'Every hero needs a map. Let us consult the Oracle of Paths to chart your journey. To the Adventure Path!',
    placement: 'right',
    data: {
      avatarState: AnimationState.Excited,
      rewardXP: 500,
      rewardGold: 200,
      completionDetection: 'action',       // Roadmap generation success callback
      targetRoute: '/roadmap',
    } as WalkthroughStepData,
  },
  // Step 4: "Visit the Merchant's Armory" -- Navigate to Store
  {
    target: '[data-tour="nav-store"]',
    content: 'You have earned gold through your deeds! Let us visit Old Grimshaw at the Merchant\'s Armory. He has wares that can... enhance your appearance.',
    placement: 'right',
    data: {
      avatarState: AnimationState.Excited,
      rewardXP: 50,
      rewardGold: 25,
      completionDetection: 'navigation',
      targetRoute: '/store',
    } as WalkthroughStepData,
  },
  // Step 5: "Don Your Gear" -- Equip first item
  {
    target: '[data-tour="inventory-tab"]',
    content: 'Switch to your Treasure Chest and equip those boots. You will see the change on me right away!',
    placement: 'bottom',
    data: {
      avatarState: AnimationState.Pointing,
      rewardXP: 50,
      rewardGold: 0,
      completionDetection: 'action',       // Equip callback
    } as WalkthroughStepData,
  },
  // Step 6: "Return to the Quest Board" -- Closing
  {
    target: 'body',                        // No specific element
    content: 'Your training is complete! As you grow in power, the Adventurer\'s Guild will offer you side quests for extra rewards. For now, return to the Quest Board and begin your journey in earnest!',
    placement: 'center',
    data: {
      avatarState: AnimationState.VictoryPose,
      rewardXP: 0,
      rewardGold: 0,
      completionDetection: 'timer',
      completionTimer: 5000,
    } as WalkthroughStepData,
  },
];
```

### Callback Integration

```typescript
function handleJoyrideCallback(data: CallbackProps) {
  const { action, status, index, type } = data;

  if (type === 'step:after') {
    // Step completed -- dispatch rewards
    const stepData = WALKTHROUGH_STEPS[index].data as WalkthroughStepData;
    if (stepData.rewardXP > 0) {
      addXP(stepData.rewardXP, 'walkthrough');
    }
    if (stepData.rewardGold > 0) {
      addGold(stepData.rewardGold, 'walkthrough');
    }

    // Persist step to backend
    progressionApi.completeWalkthroughStep(index + 1);

    // Advance to next step
    advanceWalkthrough();
  }

  if (status === 'finished' || action === 'skip') {
    completeWalkthrough();
  }
}
```

### First-Time User Detection

On `CedricProvider` mount:

```typescript
const { data: progression } = useQuery({ queryKey: QUERY_KEYS.progression, ... });

// Determine if this is a new user who needs onboarding
const isNewUser = !progression?.onboarding_complete && !progression?.walkthrough_completed;

// If new user, show the "Enable Adventure Mode?" prompt after 1.5s delay
useEffect(() => {
  if (isNewUser && !state.walkthroughActive) {
    const timer = setTimeout(() => {
      enqueueMessage({
        id: 'cedric-intro',
        text: 'Hail, traveler! I see you have just arrived at the realm of SpringAIS. My name is Cedric, and I shall be your guide through these lands.',
        priority: 'walkthrough',
        duration: 0,       // Don't auto-dismiss
        typing: true,
        dismissible: false,
        actions: [
          {
            id: 'enable-adventure',
            label: 'Enable Adventure Mode!',
            variant: 'primary',
            onClick: () => {
              enableAdventureMode();
              startWalkthrough();
            },
          },
          {
            id: 'maybe-later',
            label: 'Maybe Later',
            variant: 'ghost',
            onClick: () => handleMaybeLater(),
          },
        ],
      });
    }, 1500);
    return () => clearTimeout(timer);
  }
}, [isNewUser]);
```

The `onboarding_complete` field already exists on `UserProfile` (set to `False` on registration, currently unused). The new `walkthrough_completed` field on `UserProgression` tracks whether the avatar walkthrough specifically has been completed.

---

## 5. Speech Bubble System

### Message Interface

```typescript
interface SpeechMessage {
  id: string;                             // Unique message ID
  text: string;                           // Display text (supports medieval/modern variants)
  priority: SpeechPriority;
  duration: number;                       // Auto-dismiss in ms (0 = manual only)
  typing: boolean;                        // Enable typing animation
  typingSpeed?: number;                   // ms per character (default 25)
  actions?: SpeechAction[];               // Max 2 action buttons
  dismissible: boolean;                   // Show X button
  suppressible: boolean;                  // Show "Don't show again" link
  messageType?: string;                   // For frequency tracking key
  avatarState?: AnimationState;           // Set avatar state while showing
  onDismiss?: () => void;                 // Callback when dismissed
}

type SpeechPriority = 'walkthrough' | 'reward' | 'reaction' | 'proactive';
```

### Queue Management

Priority ordering (processed first):
1. `walkthrough` -- never dropped, never auto-dismissed
2. `reward` -- never dropped, auto-dismissed after duration
3. `reaction` -- dropped if queue > 3, auto-dismissed after duration
4. `proactive` -- lowest priority, first to drop, subject to cooldown and daily cap

**Queue overflow logic**:
```
if (queue.length >= 3) {
  queue = queue.filter(m => m.priority === 'walkthrough' || m.priority === 'reward');
}
```

**Route change behavior**:
- `walkthrough` and `reward` messages persist across navigation
- `reaction` and `proactive` messages are cleared on route change

### Timing

| Parameter | Value | Applies To |
|---|---|---|
| Default duration | 8000ms | All non-walkthrough messages |
| Typing speed | 25ms/char | Walkthrough and narrative messages |
| Button fade-in delay | 150ms after text completes | Messages with actions |
| Entrance animation | 250ms (opacity + translateY + scale) | All messages |
| Exit animation | 200ms (opacity + translateY) | All messages |
| Gap between messages | 500ms | Between queue items |
| Proactive cooldown | 90000ms (90s) | Between proactive messages |
| Session proactive cap | 8 messages | Per browser session |

### Medieval vs Modern Text

All dialogue text is stored in a config file with both variants:

**Location**: `frontend/src/components/avatar/cedricMessages.ts`

```typescript
interface MessageVariant {
  medieval: string;
  modern: string;
}

// Selected at render time based on adventureMode.enabled
function getCedricText(variant: MessageVariant, adventureEnabled: boolean): string {
  return adventureEnabled ? variant.medieval : variant.modern;
}
```

### Speech Bubble Visual Styles

**Game theme** (adventure mode on):
- Background: `linear-gradient(180deg, #F5E6C8 0%, #E8D5A8 100%)` (parchment)
- Border: `2px solid #8B6914`
- Font: `'Cinzel', serif` for "Cedric:" label, system sans-serif for body
- Text: `#3D2B1F` (dark brown)
- Max width: 280px
- Shadow: `0 4px 16px rgba(0, 0, 0, 0.3)`

**Light/dark themes** (adventure mode off):
- Background: `#FFFFFF` / `#2D2D3D`
- Border: `1px solid #E0E0E0` / `#404050`
- Font: System sans-serif throughout
- Rounded corners: 12px (more modern)
- Shadow: `0 2px 8px rgba(0, 0, 0, 0.1)` / `0 2px 12px rgba(0, 0, 0, 0.4)`

### Positioning Logic

The speech bubble renders **above** the avatar by default. If the avatar is in the top third of the viewport (e.g., during walkthrough when avatar is in a tooltip), the bubble flips to below. Calculation:

```typescript
const bubblePosition = avatarTop < window.innerHeight / 3 ? 'below' : 'above';
```

---

## 6. Animation System

### Animation States Enum

See the `AnimationState` enum in Section 3. There are 18 total states across three categories: idle progression, reactions, and contextual.

### CSS Sprite Sheet Approach

Animations use horizontal sprite strips at 64×64 per frame, animated with CSS `steps()`:

```css
.cedric-sprite {
  width: 64px;
  height: 64px;
  image-rendering: pixelated;
}

/* Idle breathing: 4 frames at 2fps (2s cycle) */
.cedric-sprite--idle {
  background: url('/assets/cedric/sprites/idle.png') no-repeat;
  animation: cedric-idle 2s steps(4) infinite;
}

@keyframes cedric-idle {
  from { background-position: 0 0; }
  to { background-position: -256px 0; }    /* 4 frames × 64px */
}

/* Look around: 3 frames (center, left, right) */
.cedric-sprite--lookAround {
  background: url('/assets/cedric/sprites/lookAround.png') no-repeat;
  animation: cedric-look 2s steps(3) 1;
}

/* Sitting: 2 frames (transition + sitting idle) */
.cedric-sprite--sitting {
  background: url('/assets/cedric/sprites/sitting.png') no-repeat;
  animation: cedric-sit 4s steps(2) infinite;
}

/* Sleeping: 2 frames + ZZZ particles */
.cedric-sprite--sleeping {
  background: url('/assets/cedric/sprites/sleeping.png') no-repeat;
  animation: cedric-sleep 4s steps(2) infinite;  /* Slower cycle */
}
```

### Framer Motion Reaction Animations

Reactions use Framer Motion `animate` for positional and scale transforms on the container, combined with CSS sprite swaps for the character pose:

```typescript
// XP gained: small jump
const xpJumpVariants = {
  initial: { y: 0 },
  animate: {
    y: [0, -6, 0],
    transition: { duration: 0.5, type: 'spring', stiffness: 300 }
  },
};

// Level up: big jump + scale pulse
const levelUpVariants = {
  initial: { y: 0, scale: 1 },
  animate: {
    y: [0, -16, 0],
    scale: [1, 1.1, 1],
    transition: { duration: 1.5, type: 'spring' }
  },
};

// Coin catch: coin falls from above
const coinCatchVariants = {
  initial: { y: -40, opacity: 0 },
  animate: {
    y: [null, 0],
    opacity: [null, 1],
    transition: { duration: 0.6, ease: 'easeIn' }
  },
};
```

### Animation Queue

When multiple game events fire in quick succession:

```typescript
interface AnimationQueueEntry {
  animation: AnimationState;
  duration: number;          // How long to hold before next
  onStart?: () => void;      // e.g., show floating "+50 XP" text
}
```

**Queue rules**:
1. Entries processed FIFO
2. Each animation plays for its `duration` before the next begins
3. If queue exceeds 3, intermediate `JumpXP` and `CatchCoin` are collapsed into a single combined animation showing total
4. `CelebrateLevelUp` and `HoldTrophy` are never collapsed

### Inactivity Timer

```typescript
// Managed inside CedricProvider
let inactivityTimer: number;

function resetInactivity() {
  clearTimeout(inactivityTimer);
  if (state.animationState === AnimationState.Sleeping) {
    triggerAnimation(AnimationState.WakeUp, 1000);
  }
  inactivityTimer = setTimeout(() => {
    if (state.animationState === AnimationState.Idle) {
      triggerAnimation(AnimationState.Sitting);
      inactivityTimer = setTimeout(() => {
        triggerAnimation(AnimationState.Sleeping);
      }, 90_000);  // 1.5 min more → sleeping
    }
  }, 30_000);  // 30s → sitting
}

// Listen for user activity
useEffect(() => {
  const handler = () => resetInactivity();
  window.addEventListener('mousemove', handler, { passive: true });
  window.addEventListener('keydown', handler, { passive: true });
  resetInactivity();
  return () => {
    window.removeEventListener('mousemove', handler);
    window.removeEventListener('keydown', handler);
    clearTimeout(inactivityTimer);
  };
}, []);
```

---

## 7. Asset Architecture

### Directory Structure

```
frontend/public/assets/cedric/
├── sprites/
│   ├── idle.png                    # 4-frame horizontal strip (256×64)
│   ├── lookAround.png              # 3-frame strip (192×64)
│   ├── sitting.png                 # 2-frame strip (128×64)
│   ├── sleeping.png                # 2-frame strip (128×64)
│   ├── wakeUp.png                  # 3-frame strip (192×64)
│   ├── jumpXP.png                  # 3-frame strip (192×64)
│   ├── celebrateLevelUp.png        # 6-frame strip (384×64)
│   ├── catchCoin.png               # 3-frame strip (192×64)
│   ├── holdTrophy.png              # 2-frame strip (128×64)
│   ├── victoryPose.png             # 3-frame strip (192×64)
│   ├── spinNewItem.png             # 4-frame strip (256×64)
│   ├── waveHello.png               # 4-frame strip (256×64)
│   ├── thinking.png                # 2-frame strip (128×64)
│   ├── reading.png                 # 2-frame strip (128×64)
│   ├── pointing.png                # 1 frame (64×64)
│   ├── confused.png                # 2-frame strip (128×64)
│   ├── excited.png                 # 3-frame strip (192×64)
│   ├── lookingFar.png              # 1 frame (64×64)
│   ├── tracingLines.png            # 3-frame strip (192×64)
│   └── lookingUp.png               # 1 frame (64×64)
├── equipment/
│   ├── armor/
│   │   ├── bronze-armor.png        # 64×64 transparent overlay
│   │   ├── iron-chainmail.png
│   │   ├── steel-plate-armor.png
│   │   └── golden-armor.png
│   ├── cape/
│   │   ├── travelers-cloak.png
│   │   ├── silver-cloak.png
│   │   ├── phoenix-cloak.png
│   │   ├── shadow-mantle.png
│   │   └── arena-champion-cape.png
│   ├── boots/
│   │   ├── leather-boots.png
│   │   ├── iron-shod-boots.png
│   │   ├── winged-sandals.png
│   │   └── void-walkers.png
│   ├── hairstyle/
│   │   ├── classic-warrior-cut.png
│   │   ├── noble-braids.png
│   │   ├── crown-of-flames.png
│   │   ├── celestial-locks.png
│   │   └── legendary-crown.png
│   ├── jewelry/
│   │   ├── copper-ring.png
│   │   ├── silver-amulet.png
│   │   ├── guild-ring.png
│   │   ├── dragon-pendant.png
│   │   └── merchant-ring.png
│   ├── banner/
│   │   ├── apprentice-banner.png
│   │   ├── knights-standard.png
│   │   ├── dragon-banner.png
│   │   ├── legendary-crest.png
│   │   └── scribes-quill-banner.png
│   └── emblem/
│       ├── novice-emblem.png
│       ├── scholars-seal.png
│       ├── dragon-emblem.png
│       ├── legendary-crown-emblem.png
│       ├── knights-crest-emblem.png
│       └── squires-trial-emblem.png  # Onboarding reward
├── pedestals/
│   ├── pedestal-level-1.png        # Plain grey stone
│   ├── pedestal-level-3.png        # Stone with moss
│   ├── pedestal-level-5.png        # Polished stone
│   ├── pedestal-level-7.png        # Dark marble with gold
│   └── pedestal-level-9.png        # Gilded with glow
├── particles/
│   ├── confetti.png                # Sprite sheet of confetti pieces
│   ├── sparkle.png                 # Sparkle particle
│   ├── zzz.png                     # Z character for sleeping
│   └── coin.png                    # Gold coin (8×8)
└── modern/
    └── compass-icon.png            # 32×32 modern guide icon
```

### Naming Convention

Equipment assets: `{slug}.png` where slug is derived from item name via `toLowerCase().replace(/[^a-z0-9]+/g, '-')`.

Example: "Iron Chainmail" → `iron-chainmail.png`

The mapping from cosmetic item to asset path:

```typescript
function getEquipmentAssetPath(category: string, itemName: string): string {
  const slug = itemName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `/assets/cedric/equipment/${category}/${slug}.png`;
}
```

### Layer Z-Order

| Z-Index | Layer | Slot |
|---|---|---|
| 0 | Banner | `banner` |
| 1 | Base body sprite | (always) |
| 2 | Boots | `boots` |
| 3 | Armor | `armor` |
| 4 | Cape | `cape` |
| 5 | Hairstyle | `hairstyle` |
| 6 | Jewelry | `jewelry` |
| 7 | Emblem | `emblem` |
| 8 | Rarity effects | (computed from equipped items) |
| 9 | Color palette overlay | `color_palette` (mix-blend-mode) |

### MVP Placeholder Strategy

For Phase 1 (MVP), equipment layers are **not rendered**. The base character sprite is sufficient. Equipment rendering begins in Phase 2. The `AvatarSprite` component accepts `equippedItems` from day one but gracefully renders nothing for slots where no asset file exists (the `<img>` has `onError` handler that hides the element).

### Color Palette Implementation

```typescript
// Color palette is CSS-only, no image asset needed
const COLOR_PALETTE_MAP: Record<string, string> = {
  'Earth Tones': 'rgba(139, 115, 85, 0.15)',
  'Royal Purple': 'rgba(128, 0, 128, 0.12)',
  'Crimson & Gold': 'rgba(180, 50, 20, 0.10)',
};

// Applied as an overlay div with mix-blend-mode: multiply
<div
  style={{
    position: 'absolute',
    inset: 0,
    backgroundColor: paletteColor,
    mixBlendMode: 'multiply',
    pointerEvents: 'none',
    zIndex: 9,
  }}
/>
```

### Rarity Visual Effects

| Rarity | Effect | Implementation |
|---|---|---|
| Common | None | No additional CSS |
| Uncommon | Shimmer sweep every 4s | CSS `@keyframes shimmer` with `background-position` animation on a gradient overlay |
| Rare | Soft blue glow outline | CSS `filter: drop-shadow(0 0 2px #3b82f6) drop-shadow(0 0 4px rgba(59,130,246,0.5))` on the equipment `<img>` |
| Epic | Purple particle dots (3-5) orbiting | Framer Motion animated `<div>` dots with circular motion keyframes |
| Legendary | Golden aura + sparkle particles | CSS `box-shadow: 0 0 8px rgba(255,215,0,0.6)` + Framer Motion sparkle dots |

The highest rarity among all equipped items determines an additional container-level effect. Individual item rarity effects apply per-layer.

---

## 8. Onboarding Flow Architecture

### Detection: Is This a New User?

```
CedricProvider mounts
  → reads progressionApi.getProgression()
  → checks: progression.walkthrough_completed === false (new field)
  → checks: userProfile.onboarding_complete === false (existing field)
  → if both false → isNewUser = true → Cedric onboarding mode
```

### Complete Flow

```
1. User registers → POST /auth/register
   → Creates user + progression row (existing behavior)
   → Redirect to "/" → HomeRedirect → /matches (empty)

2. /matches loads with empty state (no skills/resume)
   → CedricProvider detects isNewUser
   → After 1.5s delay: Cedric entrance animation (slide up from bottom with dust cloud)
   → After 0.8s more: Speech bubble with intro text + adventure mode prompt

3. User clicks "Enable Adventure Mode!" OR "Maybe Later"

   IF "Enable Adventure Mode!":
     → toggleAdventureMode() → POST /progression/toggle-adventure-mode
     → Theme switches to 'game'
     → AdventureHUD slides in
     → Quest notification: "THE SQUIRE'S TRIAL" (speech bubble)
     → After "Begin Quest" or 5s: React Joyride activates
     → Walkthrough begins (Steps 0-6, see Section 4)

   IF "Maybe Later":
     → Speech bubble: "No worries! Want a quick tour without the medieval flair?"
     → "Sure, show me around!" → Same walkthrough with modern language
     → "I'll explore on my own" → Cedric minimizes to compass icon
     → POST /progression/complete-onboarding (marks onboarding as dismissed)

4. Each walkthrough step:
   → Spotlight targets UI element (data-tour selector)
   → Cedric speaks walkthrough text in tooltip
   → User performs action (or timer auto-completes)
   → POST /progression/walkthrough-step with step index
   → Reward dispatch via reward_hook_service
   → NotificationToasts show XP/Gold gains
   → Cedric plays reaction animation (JumpXP)

5. Step 4 (Roadmap): special handling
   → If user generates roadmap → Oracle Sequence plays (Section 9)
   → Walkthrough pauses until roadmap completes
   → Large reward on completion (+500 XP, +200 Gold)

6. Step 4 (Store): free Leather Boots granted
   → POST /progression/walkthrough-step triggers one-time reward hook
   → Backend grants "Leather Boots" to inventory
   → Gift notification in speech bubble

7. All steps complete → Walkthrough Complete celebration
   → React Joyride overlay dismissed
   → Level Up celebration animation (confetti, glow, jump)
   → Quest completion banner (parchment card with rewards)
   → "Squire's Trial" emblem cosmetic awarded
   → POST /progression/complete-onboarding
   → Backend: onboarding_complete = true, walkthrough_completed = true
   → Quest "The Squire's Trial" marked completed in quest system
   → Cedric: "I am proud to call you my companion, adventurer."
   → Enters persistent companion mode
```

### Walkthrough as a Real Quest

"The Squire's Trial" is seeded in the `side_quest_catalog` as a level-0 quest. Unlike other quests (level 3+), it is available immediately and auto-started on registration. Its requirements track walkthrough step completion:

```python
# In quest_seed.py (new entry)
{
    "name": "The Squire's Trial",
    "description": (
        "Every legend begins with a single step. Prove your worth "
        "by mastering the tools of the realm."
    ),
    "level_required": 0,           # Available at level 0 (new users)
    "xp_reward": 950,              # Total quest XP
    "coin_reward": 475,            # Total quest gold
    "sort_order": 1,               # First in list
    "requirements": [
        {"type": "walkthrough_step", "target_id": None, "count": 7,
         "description": "Complete all walkthrough steps"},
    ],
}
```

### Squire's Trial Emblem

A new cosmetic item in `cosmetic_seed.py`:

```python
{
    "name": "Squire's Trial Emblem",
    "description": "A shield bearing a quill and compass. Awarded for completing the Squire's Trial.",
    "category": "emblem",
    "rarity": "uncommon",
    "coin_price": 0,
    "level_required": 0,
    "is_quest_exclusive": True,
    "sort_order": 84,
}
```

### Step Completion Detection

Each walkthrough step uses a specific detection mechanism:

| Step | Detection | How |
|---|---|---|
| 0: Profile/Resume | `action` | Listen for `resume_uploaded` event via `reward_hook_service` callback |
| 1: View Matches | `timer` | 5s after navigating to `/matches`, or on scroll/click |
| 2: Save a Role | `action` | Listen for `role_saved` event |
| 3: Generate Roadmap | `action` | Listen for `roadmap_generated` event |
| 4: Visit Store | `navigation` | Route change to `/store` |
| 5: Equip Item | `action` | Listen for `storeApi.equip()` success |
| 6: Closing | `timer` | 5s auto-complete |

Detection is implemented via React Query mutation success callbacks and route change listeners in `CedricProvider`.

### Backend Endpoint

```
POST /api/progression/complete-onboarding
```

**Request**: Empty body (user ID from auth token)

**Response**:
```json
{
  "onboarding_complete": true,
  "walkthrough_completed": true,
  "rewards": {
    "xp_total": 950,
    "gold_total": 475,
    "cosmetic_id": "...",
    "cosmetic_name": "Squire's Trial Emblem"
  }
}
```

**Backend logic**:
1. Set `user_profiles.onboarding_complete = True`
2. Set `user_progression.walkthrough_completed = True`
3. Set `user_progression.walkthrough_step = 7`
4. Complete "The Squire's Trial" quest via `quest_service`
5. Award the "Squire's Trial Emblem" cosmetic to user inventory
6. Return summary

---

## 9. Loading Narrator Architecture

### Hook: `useCedricNarrator`

**Location**: `frontend/src/components/avatar/useCedricNarrator.ts`

```typescript
interface NarratorPhase {
  minTime: number;               // Earliest time (ms) this phase can start
  maxTime: number;               // Latest time this phase transitions
  dialogue: MessageVariant;      // Medieval/modern text
  avatarState: AnimationState;
  tip?: MessageVariant;          // Optional cycling tip below progress bar
}

interface NarratorConfig {
  phases: NarratorPhase[];
  queryKey: readonly unknown[];  // React Query key to monitor
  onComplete?: () => void;       // Called when loading finishes
}

function useCedricNarrator(config: NarratorConfig): {
  isLoading: boolean;
  currentPhase: NarratorPhase | null;
  progress: number;              // 0-100 estimated progress
  elapsedTime: number;
  tip: string | null;
} {
  // 1. Monitor React Query loading state for the given queryKey
  // 2. Track elapsed time since loading began
  // 3. Determine current phase based on elapsed time
  // 4. Calculate estimated progress (phase-based percentage)
  // 5. Cycle tips within the current phase
}
```

### Oracle Sequence (Roadmap Generation)

The roadmap generation loading screen is the most elaborate narrator sequence:

```typescript
const ORACLE_PHASES: NarratorPhase[] = [
  {
    minTime: 0,
    maxTime: 15000,
    dialogue: {
      medieval: 'Ah, you seek the Oracle\'s wisdom! Let me consult the ancient tomes...',
      modern: 'Starting your career path analysis...',
    },
    avatarState: AnimationState.Reading,
    tip: {
      medieval: 'While we wait -- did you know you earn XP for completing roadmap milestones?',
      modern: 'Tip: You earn rewards for completing milestones on your roadmap.',
    },
  },
  {
    minTime: 15000,
    maxTime: 30000,
    dialogue: {
      medieval: 'The scribes are studying your skills and achievements. Your abilities are... impressive!',
      modern: 'Analyzing your skills and experience...',
    },
    avatarState: AnimationState.Thinking,
    tip: {
      medieval: 'Adventurers who follow their roadmap are more likely to reach their career goals.',
      modern: 'Following a structured roadmap significantly improves career outcomes.',
    },
  },
  {
    minTime: 30000,
    maxTime: 60000,
    dialogue: {
      medieval: 'The cartographers are mapping your optimal path through the realm...',
      modern: 'Mapping your optimal learning path...',
    },
    avatarState: AnimationState.TracingLines,
  },
  {
    minTime: 60000,
    maxTime: 90000,
    dialogue: {
      medieval: 'Your destiny is nearly revealed... The stars are aligning in your favor!',
      modern: 'Almost done -- finalizing your personalized roadmap...',
    },
    avatarState: AnimationState.LookingUp,
  },
  {
    minTime: 90000,
    maxTime: Infinity,
    dialogue: {
      medieval: 'Any moment now... The Oracle works to ensure every detail is perfect.',
      modern: 'Putting the finishing touches on your roadmap...',
    },
    avatarState: AnimationState.Excited,
  },
];
```

### Integration Pattern

The `useCedricNarrator` hook wraps existing loading states without modifying the underlying data-fetching code:

```typescript
// In RoadmapPage.tsx (or a wrapper component)
function RoadmapLoadingNarrator({ queryKey }: { queryKey: readonly unknown[] }) {
  const { isLoading, currentPhase, progress, tip } = useCedricNarrator({
    phases: ORACLE_PHASES,
    queryKey,
  });

  if (!isLoading || !currentPhase) return null;

  return (
    <div className="flex flex-col items-center py-12">
      {/* Speech bubble */}
      <SpeechBubble
        message={{
          text: getCedricText(currentPhase.dialogue, adventureEnabled),
          priority: 'reaction',
          duration: 0,
          typing: false,
          dismissible: false,
        }}
        theme={theme}
        onDismiss={() => {}}
        position="above"
      />

      {/* Enlarged avatar (192×192) */}
      <AvatarSprite
        size={192}
        equippedItems={equippedItems}
        animationState={currentPhase.avatarState}
        colorPalette={colorPalette}
        level={level}
        showPedestal={true}
        showNameplate={false}
      />

      {/* Progress bar */}
      <div className="w-80 mt-6">
        <div className="h-3 rounded-full overflow-hidden bg-amber-900/30">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-700 via-yellow-500 to-amber-700"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="text-center text-sm mt-2 text-amber-200/70">
          {progress}%
        </div>
      </div>

      {/* Tip */}
      {tip && (
        <div className="mt-4 text-center text-sm text-amber-200/50 max-w-md">
          {tip}
        </div>
      )}
    </div>
  );
}
```

### Generic Loading Fallback

For shorter loading states (match results, store catalog, etc.):

```typescript
const GENERIC_LOADING_PHASES: NarratorPhase[] = [
  {
    minTime: 0,
    maxTime: Infinity,
    dialogue: {
      medieval: 'One moment, adventurer...',
      modern: 'Loading...',
    },
    avatarState: AnimationState.Thinking,
  },
];
```

For loads under 2 seconds, no speech bubble is shown -- only the avatar state changes briefly.
For loads over 5 seconds, the speech bubble appears after a 1-second delay.

### Completion Animation

When loading finishes:
1. Avatar switches to `Excited` state
2. If roadmap: scroll reveal animation (sprite swap to holding scroll, 1.5s)
3. Confetti burst (8 particles, gold and blue)
4. Completion speech bubble fades in
5. After 1s: loading area fades out, results fade in
6. Avatar returns to normal size in fixed position

---

## 10. Contextual Guidance Architecture

### Page Config Map

**Location**: `frontend/src/components/avatar/cedricPageConfig.ts`

```typescript
interface PageConfig {
  firstVisitMessage: MessageVariant;
  firstVisitAvatarState: AnimationState;
  returnMessages: MessageVariant[];   // Rotated, shown with frequency decay
  returnAvatarState: AnimationState;
  emptyStateMessage?: MessageVariant; // Shown when page has no data
  emptyStateAvatarState?: AnimationState;
  proactiveSuggestions?: ProactiveSuggestion[];
}

interface ProactiveSuggestion {
  id: string;
  trigger: 'idle_time' | 'data_condition';
  condition?: (state: { gold: number; level: number; daysAway: number }) => boolean;
  message: MessageVariant;
  avatarState: AnimationState;
}

const PAGE_CONFIGS: Record<string, PageConfig> = {
  '/matches': {
    firstVisitMessage: {
      medieval: 'Welcome to the Quest Board! Each card shows a role matched to your abilities. Save the ones that interest you.',
      modern: 'Welcome to your matched roles! Each card shows a role based on your skills. Save the ones you like.',
    },
    firstVisitAvatarState: AnimationState.Pointing,
    returnMessages: [
      {
        medieval: 'Back to scout for opportunities? The realm always has new quests.',
        modern: 'Checking for new matches? Great habit!',
      },
    ],
    returnAvatarState: AnimationState.LookAround,
    emptyStateMessage: {
      medieval: 'Hmm, the Quest Board is empty. Have you uploaded your scroll of abilities on the Hero Sheet?',
      modern: 'No matches yet. Try uploading your resume on the Profile page.',
    },
    emptyStateAvatarState: AnimationState.Confused,
  },
  '/profile': { /* ... */ },
  '/saved': { /* ... */ },
  '/roadmap': { /* ... */ },
  '/store': { /* ... */ },
  '/quests': { /* ... */ },
  '/success-patterns': { /* ... */ },
};
```

### Tip Tracking

Tips are tracked to prevent repetition:

```typescript
// localStorage keys:
// cedric-first-visit-{path}     : boolean (has first visit been shown)
// cedric-msg-freq-{messageType} : number (how many times shown)
// cedric-msg-suppress-{messageType} : boolean (user clicked "Don't show again")
```

### Anti-Annoyance Protocol

Implemented in `CedricProvider`:

```typescript
function shouldShowProactiveMessage(messageType: string): boolean {
  // Rule 1: Quiet mode
  if (state.quietMode) return false;

  // Rule 2: Session cap
  if (state.sessionMessageCount >= 8) return false;

  // Rule 3: Cooldown
  if (Date.now() - state.lastMessageTimestamp < 90_000) return false;

  // Rule 4: Suppressed by user
  if (localStorage.getItem(`cedric-msg-suppress-${messageType}`)) return false;

  // Rule 5: Frequency decay
  const showCount = parseInt(localStorage.getItem(`cedric-msg-freq-${messageType}`) || '0');
  const probability = Math.max(0.1, 1 / Math.pow(2, showCount));
  if (Math.random() > probability) return false;

  // Rule 6: No exact repeats
  if (state.currentMessage?.messageType === messageType) return false;

  return true;
}
```

**Frequency decay formula**:
- 1st showing: 100% probability
- 2nd showing: 50%
- 3rd showing: 25%
- 4th+ showing: 10% (minimum floor)

### Route Change Listener

```typescript
// Inside CedricProvider
const location = useLocation();

useEffect(() => {
  // Clear non-persistent messages
  clearQueueExcept(['walkthrough', 'reward']);

  // Check if this is a first visit
  const path = location.pathname;
  const pageConfig = PAGE_CONFIGS[path];
  if (!pageConfig) return;

  const hasVisited = localStorage.getItem(`cedric-first-visit-${path}`);

  if (!hasVisited && !state.walkthroughActive) {
    // First visit message
    enqueueMessage({
      id: `first-visit-${path}`,
      text: getCedricText(pageConfig.firstVisitMessage, adventureEnabled),
      priority: 'reaction',
      duration: 8000,
      typing: false,
      dismissible: true,
      suppressible: false,
      avatarState: pageConfig.firstVisitAvatarState,
    });
    localStorage.setItem(`cedric-first-visit-${path}`, 'true');
  } else if (hasVisited && !state.walkthroughActive) {
    // Return visit -- subject to anti-annoyance rules
    const returnMsg = pageConfig.returnMessages[
      Math.floor(Math.random() * pageConfig.returnMessages.length)
    ];
    if (returnMsg && shouldShowProactiveMessage(`return-${path}`)) {
      enqueueMessage({
        id: `return-${path}-${Date.now()}`,
        text: getCedricText(returnMsg, adventureEnabled),
        priority: 'proactive',
        duration: 8000,
        typing: false,
        dismissible: true,
        suppressible: true,
        messageType: `return-${path}`,
        avatarState: pageConfig.returnAvatarState,
      });
    }
  }
}, [location.pathname]);
```

### Quiet Mode

Toggled via right-click context menu on the avatar. Stored in `localStorage`:

```typescript
// Key: cedric-quiet-mode (boolean)

// When quiet mode is on:
// - No proactive suggestions
// - First-visit messages still shown (once per page, ever)
// - Reaction animations still play
// - Speech bubbles for reactions are suppressed
// - Walkthrough/onboarding messages are unaffected
```

---

## 11. Backend Changes

### New Fields on `user_progression` Table

| Field | Type | Default | Description |
|---|---|---|---|
| `walkthrough_step` | `Integer` | `0` | Current walkthrough step (0-7) |
| `walkthrough_completed` | `Boolean` | `False` | Whether walkthrough has been completed or skipped |

**Migration**: New Alembic migration `031_add_walkthrough_fields.py`:

```python
# In migration
op.add_column('user_progression',
    sa.Column('walkthrough_step', sa.Integer(), nullable=False, server_default='0'))
op.add_column('user_progression',
    sa.Column('walkthrough_completed', sa.Boolean(), nullable=False, server_default='false'))
```

### Updated `UserProgression` Model

Add to `backend/app/models/progression.py`:

```python
class UserProgression(Base, TimestampMixin):
    # ... existing fields ...
    walkthrough_step: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    walkthrough_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
```

### New Seed Data

#### "The Squire's Trial" Quest

Add to `quest_seed.py`:

```python
{
    "name": "The Squire's Trial",
    "description": (
        "Every legend begins with a single step. Prove your worth "
        "by mastering the tools of the realm."
    ),
    "level_required": 0,
    "xp_reward": 950,
    "coin_reward": 475,
    "sort_order": 1,
    "requirements": [
        {
            "type": "walkthrough_step",
            "target_id": None,
            "count": 7,
            "description": "Complete the onboarding walkthrough",
        },
    ],
},
```

#### "Squire's Trial Emblem" Cosmetic

Add to `cosmetic_seed.py`:

```python
{
    "name": "Squire's Trial Emblem",
    "description": "A shield bearing a quill and compass. Awarded for completing the Squire's Trial.",
    "category": "emblem",
    "rarity": "uncommon",
    "coin_price": 0,
    "level_required": 0,
    "is_quest_exclusive": True,
    "sort_order": 84,
},
```

### New API Endpoints

#### `POST /progression/walkthrough-step`

Records completion of a walkthrough step and dispatches step-specific rewards.

```python
@router.post("/walkthrough-step")
def record_walkthrough_step(
    request: WalkthroughStepRequest,  # { step: int }
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user_from_token),
):
    prog = db.query(UserProgression).filter(
        UserProgression.user_id == current_user.id
    ).with_for_update().first()

    if prog is None or request.step <= prog.walkthrough_step:
        return {"step": prog.walkthrough_step if prog else 0, "already_completed": True}

    prog.walkthrough_step = request.step
    db.flush()

    # Dispatch step reward via reward_hook_service
    reward = reward_hook_service.process_action(
        db, current_user.id,
        event_type="walkthrough_step",
        event_key=f"walkthrough_step:{request.step}",
        metadata={"step": request.step},
    )

    db.commit()

    return {
        "step": request.step,
        "already_completed": False,
        "reward": {
            "xp_awarded": reward.xp_awarded if reward else 0,
            "coins_awarded": reward.coins_awarded if reward else 0,
        },
    }
```

#### `POST /progression/complete-onboarding`

Marks onboarding as complete and awards final quest rewards.

```python
@router.post("/complete-onboarding")
def complete_onboarding(
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user_from_token),
):
    # 1. Mark user profile onboarding complete
    current_user.onboarding_complete = True
    db.flush()

    # 2. Mark walkthrough complete
    prog = db.query(UserProgression).filter(
        UserProgression.user_id == current_user.id
    ).with_for_update().first()
    prog.walkthrough_completed = True
    prog.walkthrough_step = 7
    db.flush()

    # 3. Complete "The Squire's Trial" quest
    quest = db.query(SideQuestCatalog).filter(
        SideQuestCatalog.name == "The Squire's Trial"
    ).first()
    if quest:
        quest_service.complete_quest(db, current_user.id, quest.id)

    # 4. Award "Squire's Trial Emblem"
    emblem = db.query(CosmeticCatalog).filter(
        CosmeticCatalog.name == "Squire's Trial Emblem"
    ).first()
    if emblem:
        store_service.grant_cosmetic(db, current_user.id, emblem.id, source="quest_reward")

    db.commit()

    return {
        "onboarding_complete": True,
        "walkthrough_completed": True,
    }
```

### Updated `ProgressionState` Response

Add to the `get_progression` endpoint response:

```python
return {
    # ... existing fields ...
    "walkthrough_step": prog.walkthrough_step,
    "walkthrough_completed": prog.walkthrough_completed,
    "onboarding_complete": user.onboarding_complete,  # From UserProfile
}
```

### Updated Frontend Types

```typescript
// In progressionService.ts
export interface ProgressionState {
  // ... existing fields ...
  walkthrough_step: number;
  walkthrough_completed: boolean;
  onboarding_complete: boolean;
}
```

### New Reward Config Entries

Add to `REWARD_CONFIG` in `reward_hook_service.py`:

```python
"walkthrough_step": RewardConfig(xp=50, coins=25),   # Base per-step reward
```

Step-specific bonus rewards (beyond the base) are handled by the walkthrough step endpoint based on step index.

---

## 12. ADR Log

### D-CA-001: Separate CedricContext

**Decision**: Create a new `CedricContext` rather than extending `AdventureModeContext`.

**Rationale**:
- `AdventureModeContext` already has 15+ state fields and 12+ actions. Adding Cedric's state (animation, speech queue, walkthrough progress, guidance config) would push it past 30 fields, violating single responsibility.
- Cedric can be feature-flagged independently (e.g., disable avatar but keep gamification).
- Testing is simpler with a focused context.
- `CedricContext` reads from `AdventureModeContext` via `useAdventureMode()` -- no data duplication.

**Alternative considered**: Extend `AdventureModeContext`. Rejected due to complexity and coupling.

### D-CA-002: DOM/CSS Layers for Equipment Rendering

**Decision**: Use stacked `<img>` elements with `position: absolute` and z-index ordering.

**Rationale**:
- Zero additional dependencies (no PixiJS, no Canvas)
- Proven by Habitica at scale (millions of users)
- Sufficient performance for <10 layers on a single widget
- Easy to debug via browser dev tools
- Compatible with existing Framer Motion for reactions

**Alternative considered**: PixiJS (`@pixi/react`). Rejected: ~200KB bundle addition for a single small widget.

### D-CA-003: CSS Sprite Sheets + Framer Motion for Animation

**Decision**: Frame-based animations via CSS `@keyframes` with `steps()`, positional/scale animations via Framer Motion.

**Rationale**:
- Framer Motion is already in the project (11.18.2)
- CSS sprite sheets are the standard for pixel art animation
- No new dependencies
- Clear separation: CSS handles sprite frame cycling, Framer Motion handles container transforms

### D-CA-004: Priority Speech Queue with Anti-Annoyance Protocol

**Decision**: FIFO queue with 4 priority levels, frequency decay, cooldowns, session caps, and quiet mode.

**Rationale**:
- Multiple message sources (walkthrough, rewards, reactions, proactive tips) need coordination
- The #1 risk for companion characters is becoming annoying (Clippy problem)
- The anti-annoyance protocol (frequency decay, 90s cooldown, 8-message session cap, quiet mode) prevents this
- Priority levels ensure walkthrough and reward messages are never dropped

### D-CA-005: Walkthrough as Real Quest

**Decision**: "The Squire's Trial" is a seeded quest in `side_quest_catalog` with backend progression tracking.

**Rationale**:
- Leverages existing quest infrastructure (no new tables)
- Quest completion awards cosmetic reward via existing `cosmetic_reward_id` foreign key
- Progress tracked server-side (survives logout/device change)
- Consistent with the platform's gamification model: every user action = rewards

### D-CA-006: React Joyride for Walkthrough Engine

**Decision**: Use `react-joyride` (MIT, ~25KB) as the walkthrough spotlight overlay engine.

**Rationale**:
- Custom `tooltipComponent` prop allows rendering Cedric as the tooltip (no forced UI)
- Rich callback system for step transitions, rewards, and navigation
- Built-in spotlight overlay with click-through support
- React 18 compatible, TypeScript types included
- MIT license (free for commercial use)
- Largest React-specific walkthrough community

**Alternative considered**: Shepherd.js (more stars but less React-native), OnboardJS (headless but newer/smaller community).

---

## File Inventory

### New Frontend Files

```
frontend/src/
├── components/avatar/
│   ├── AvatarCompanion.tsx           # Root persistent component
│   ├── AvatarSprite.tsx              # Layered sprite rendering
│   ├── SpeechBubble.tsx              # Speech bubble with typing, buttons
│   ├── CharacterSheet.tsx            # Mini popup equipment panel
│   ├── WalkthroughOverlay.tsx        # React Joyride wrapper
│   ├── CedricTooltip.tsx             # Custom Joyride tooltip (avatar + bubble)
│   ├── AvatarLoadingStage.tsx        # 192×192 narrator for loading screens
│   ├── useCedricNarrator.ts          # Hook for loading state narration
│   ├── cedricMessages.ts             # All dialogue text (medieval + modern)
│   ├── cedricPageConfig.ts           # Page-specific guidance config
│   ├── cedricAnimations.ts           # Animation state machine + queue logic
│   ├── cedricConfig.ts               # Timing, sizing, and behavior constants
│   └── index.ts                      # Barrel export
├── context/
│   └── CedricContext.tsx             # Cedric state management
└── (modified)
    ├── App.tsx                       # Add CedricProvider to tree
    ├── components/layout/MainLayout.tsx  # Render AvatarCompanion
    └── services/progressionService.ts   # Add walkthrough fields to types
```

### New Backend Files

```
backend/
├── alembic/versions/
│   └── 031_add_walkthrough_fields.py      # Migration for new columns
├── app/data/
│   ├── cosmetic_seed.py                   # (modified) Add Squire's Trial Emblem
│   └── quest_seed.py                      # (modified) Add The Squire's Trial quest
├── app/routes/
│   └── progression.py                     # (modified) Add walkthrough-step and complete-onboarding endpoints
├── app/models/
│   └── progression.py                     # (modified) Add walkthrough_step, walkthrough_completed fields
└── app/services/
    └── reward_hook_service.py             # (modified) Add walkthrough_step to REWARD_CONFIG
```

### New Asset Files

```
frontend/public/assets/cedric/
├── sprites/                               # 20 sprite sheet PNGs
├── equipment/                             # 37 equipment overlay PNGs (8 subdirectories)
├── pedestals/                             # 5 pedestal PNGs
├── particles/                             # 4 particle PNGs
└── modern/                                # 1 compass icon PNG
```

Total new image assets: ~67 files. Phase 1 (MVP) requires only: base idle sprite, 1-2 sprite poses (pointing, waveHello), and the compass icon (~5 files).


---

## 7.10 Medieval Mode Architecture

*Source: artifacts/design/architecture-medieval-mode.md*
*Cross-references: See Section 3.3 (Medieval Mode PRD), ADR-MM-001 through ADR-MM-007*

# Medieval Mode Economy & Progression System -- Architecture Document

> **Status**: DRAFT -- Awaiting Human Approval
> **Author**: Architect Agent
> **Date**: 2026-02-11
> **Version**: 1.0
> **Upstream Artifacts**:
>   - `artifacts/exploration/codebase-analysis.md`
>   - `artifacts/planning/prd-medieval-mode.md`

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Database Schema Design](#2-database-schema-design)
3. [API Endpoint Design](#3-api-endpoint-design)
4. [Service Layer Architecture](#4-service-layer-architecture)
5. [XP Calculation Engine](#5-xp-calculation-engine)
6. [Event System Architecture](#6-event-system-architecture)
7. [Frontend Architecture Changes](#7-frontend-architecture-changes)
8. [Redis Usage](#8-redis-usage)
9. [Migration Plan](#9-migration-plan)
10. [ADR Index](#10-adr-index)

---

## 1. System Overview

### 1.1 Architecture Diagram

```
+------------------+       +-------------------+       +-----------+
|   React Frontend |<----->|   FastAPI Backend  |<----->| PostgreSQL|
| (TypeScript)     |  JWT  |   (Python 3.11)   |  SQL  |    16     |
|                  |       |                    |       +-----------+
| AdventureModeCtx |       | Routes:            |
| -> React Query   |       |   /api/progression |       +-----------+
| -> API Client    |       |   /api/achievements|<----->|   Redis 7 |
|                  |       |   /api/store       |       | (Cache)   |
| New Pages:       |       |   /api/quests      |       +-----------+
|   StorePage      |       |                    |
|   QuestsPage     |       | Services:          |
+------------------+       |   progression_svc  |
                           |   achievement_svc  |
                           |   reward_hook_svc  |
                           |   store_svc        |
                           |   quest_svc        |
                           |   streak_svc       |
                           +-------------------+
```

### 1.2 Key Design Principles

1. **Server Authority**: The server is the single source of truth for all gamification state. The client never directly mutates XP, Coins, level, or inventory.
2. **Atomic Mutations**: All XP/Coin changes happen within a single database transaction with corresponding event/transaction log entries.
3. **Idempotent Rewards**: Every reward-triggering action uses an `event_key` to prevent duplicate rewards.
4. **Fire-and-Forget Hooks**: Gamification event emission never blocks the primary action. Failures are logged, not propagated.
5. **Separation of Tracks**: XP (learning) and Coins (engagement) serve different purposes and are never interconverted except through designed bridges (side quests, level-ups).

### 1.3 Technology Decisions

| Concern | Decision | ADR |
|---------|----------|-----|
| Schema migrations | Alembic (already in requirements.txt) | ADR-MM-001 |
| Progression caching | Redis with fallback to direct DB | ADR-MM-002 |
| Achievement evaluation | In-process, synchronous after event insert | ADR-MM-003 |
| Coin balance integrity | SELECT FOR UPDATE + CHECK constraint | ADR-MM-004 |
| XP curve | Linear-step (not exponential) | ADR-MM-005 |
| localStorage removal | No migration; clean start for all users | ADR-MM-006 |

---

## 2. Database Schema Design

### 2.1 Entity Relationship Overview

```
user_profiles (existing)
    |
    |-- 1:1 -- user_progression
    |               |
    |               |-- 1:N -- gamification_events
    |               |-- 1:N -- coin_transactions
    |
    |-- 1:N -- user_achievements --> achievement_catalog
    |
    |-- 1:N -- user_inventory --> cosmetic_catalog
    |-- 1:N -- user_equipped_items --> cosmetic_catalog
    |
    |-- 1:N -- user_quest_progress --> side_quest_catalog --> cosmetic_catalog
    |
    |-- 1:N -- user_page_visits
```

### 2.2 Table: `user_progression`

Stores per-user gamification state. One row per user. Replaces all localStorage gamification data.

**References**: FR-001, D-MM-1

```python
# backend/app/models/progression.py

class UserProgression(Base, TimestampMixin):
    __tablename__ = "user_progression"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True,
        default=uuid4, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        unique=True, nullable=False,
    )
    xp_total: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    level: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    coin_balance: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    login_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_login_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    adventure_mode_enabled: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    # Relationships
    user: Mapped["UserProfile"] = relationship("UserProfile", backref="progression")
    events: Mapped[list["GamificationEvent"]] = relationship(
        back_populates="progression", cascade="all, delete-orphan"
    )
    coin_txns: Mapped[list["CoinTransaction"]] = relationship(
        back_populates="progression", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_user_progression_user_id", "user_id", unique=True),
        CheckConstraint("coin_balance >= 0", name="ck_coin_balance_non_negative"),
        CheckConstraint("xp_total >= 0", name="ck_xp_total_non_negative"),
        CheckConstraint("level >= 1", name="ck_level_positive"),
    )
```

**DDL equivalent**:
```sql
CREATE TABLE user_progression (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
    xp_total INTEGER NOT NULL DEFAULT 0 CHECK (xp_total >= 0),
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
    coin_balance INTEGER NOT NULL DEFAULT 0 CHECK (coin_balance >= 0),
    login_streak INTEGER NOT NULL DEFAULT 0,
    last_login_date DATE,
    adventure_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_user_progression_user_id ON user_progression(user_id);
```

### 2.3 Table: `gamification_events`

Append-only event log. Records every action that triggers a reward. Supports idempotency via `event_key`.

**References**: FR-002, D-MM-2

```python
class GamificationEvent(Base):
    __tablename__ = "gamification_events"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True,
        default=uuid4, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user_progression.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    event_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    xp_awarded: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    coins_awarded: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    metadata: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    progression: Mapped["UserProgression"] = relationship(
        back_populates="events", foreign_keys=[user_id]
    )

    __table_args__ = (
        Index("idx_gamification_events_user_id", "user_id"),
        Index("idx_gamification_events_type", "event_type"),
        Index("idx_gamification_events_created", "created_at"),
        Index(
            "uq_gamification_events_user_key",
            "user_id", "event_key",
            unique=True,
            postgresql_where=text("event_key IS NOT NULL"),
        ),
    )
```

**DDL equivalent**:
```sql
CREATE TABLE gamification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_progression(user_id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_key VARCHAR(255),
    xp_awarded INTEGER NOT NULL DEFAULT 0,
    coins_awarded INTEGER NOT NULL DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gamification_events_user_id ON gamification_events(user_id);
CREATE INDEX idx_gamification_events_type ON gamification_events(event_type);
CREATE INDEX idx_gamification_events_created ON gamification_events(created_at);
CREATE UNIQUE INDEX uq_gamification_events_user_key
    ON gamification_events(user_id, event_key)
    WHERE event_key IS NOT NULL;
```

**Key Design Notes**:
- The partial unique index on `(user_id, event_key) WHERE event_key IS NOT NULL` enforces idempotency for one-time events while allowing repeatable events (null `event_key`).
- FK references `user_progression.user_id` (not `user_profiles.id`) to keep the gamification domain self-contained.

### 2.4 Table: `coin_transactions`

Transaction ledger for all Coin movements. Every credit and debit is recorded.

**References**: FR-003, D-MM-3

```python
class CoinTransaction(Base):
    __tablename__ = "coin_transactions"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True,
        default=uuid4, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user_progression.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    balance_after: Mapped[int] = mapped_column(Integer, nullable=False)
    transaction_type: Mapped[str] = mapped_column(String(20), nullable=False)
    source: Mapped[str] = mapped_column(String(100), nullable=False)
    reference_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    progression: Mapped["UserProgression"] = relationship(
        back_populates="coin_txns", foreign_keys=[user_id]
    )

    __table_args__ = (
        Index("idx_coin_transactions_user_id", "user_id"),
        Index("idx_coin_transactions_created", "created_at"),
        CheckConstraint("balance_after >= 0", name="ck_balance_after_non_negative"),
        CheckConstraint(
            "transaction_type IN ('earned', 'spent', 'refund')",
            name="ck_transaction_type_valid",
        ),
    )
```

### 2.5 Table: `achievement_catalog`

Server-side achievement definitions. Seeded with data; new achievements added via seed scripts.

**References**: FR-011, D-MM-6

```python
# backend/app/models/achievement.py

class AchievementCatalog(Base):
    __tablename__ = "achievement_catalog"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    icon: Mapped[str] = mapped_column(String(100), default="trophy", nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    xp_reward: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    coin_reward: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    trigger_type: Mapped[str] = mapped_column(String(50), nullable=False)
    trigger_config: Mapped[dict] = mapped_column(JSONB, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    __table_args__ = (
        Index("idx_achievement_catalog_category", "category"),
        Index("idx_achievement_catalog_active", "is_active"),
        CheckConstraint(
            "category IN ('onboarding', 'learning', 'engagement', 'exploration', 'mastery')",
            name="ck_achievement_category_valid",
        ),
        CheckConstraint(
            "trigger_type IN ('event_based', 'threshold_based', 'manual')",
            name="ck_trigger_type_valid",
        ),
    )
```

**`trigger_config` Schema**:

For `event_based` triggers:
```json
{
  "event_type": "module_completed",
  "count": 1
}
```
Meaning: triggers when the user has `count` events of type `event_type`.

For `threshold_based` triggers:
```json
{
  "field": "login_streak",
  "threshold": 7
}
```
Meaning: triggers when `user_progression.{field} >= threshold`.

For `manual` triggers:
```json
{
  "action": "enable_adventure_mode"
}
```
Meaning: triggers only via explicit code call in a specific endpoint.

### 2.6 Table: `user_achievements`

Tracks which achievements each user has unlocked.

**References**: FR-013

```python
class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True,
        default=uuid4, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    achievement_id: Mapped[str] = mapped_column(
        String(100),
        ForeignKey("achievement_catalog.id", ondelete="CASCADE"),
        nullable=False,
    )
    unlocked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    achievement: Mapped["AchievementCatalog"] = relationship("AchievementCatalog")

    __table_args__ = (
        Index("uq_user_achievement", "user_id", "achievement_id", unique=True),
        Index("idx_user_achievements_user_id", "user_id"),
    )
```

### 2.7 Table: `cosmetic_catalog`

Store item definitions. Seeded with data.

**References**: FR-014, D-MM-7

```python
# backend/app/models/cosmetic.py

class CosmeticCatalog(Base):
    __tablename__ = "cosmetic_catalog"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True,
        default=uuid4, server_default=text("gen_random_uuid()")
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    rarity: Mapped[str] = mapped_column(String(20), nullable=False)
    coin_price: Mapped[int] = mapped_column(Integer, nullable=False)
    level_required: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_quest_exclusive: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        Index("idx_cosmetic_catalog_category", "category"),
        Index("idx_cosmetic_catalog_rarity", "rarity"),
        Index("idx_cosmetic_catalog_active", "is_active"),
        CheckConstraint(
            "category IN ('armor', 'cape', 'jewelry', 'boots', 'hairstyle', "
            "'color_palette', 'banner', 'emblem')",
            name="ck_cosmetic_category_valid",
        ),
        CheckConstraint(
            "rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')",
            name="ck_cosmetic_rarity_valid",
        ),
        CheckConstraint("coin_price >= 0", name="ck_cosmetic_price_non_negative"),
    )
```

### 2.8 Table: `user_inventory`

Per-user owned cosmetics.

**References**: FR-015

```python
class UserInventory(Base):
    __tablename__ = "user_inventory"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True,
        default=uuid4, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    cosmetic_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("cosmetic_catalog.id", ondelete="CASCADE"),
        nullable=False,
    )
    source: Mapped[str] = mapped_column(String(50), nullable=False)
    acquired_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    cosmetic: Mapped["CosmeticCatalog"] = relationship("CosmeticCatalog")

    __table_args__ = (
        Index("uq_user_inventory", "user_id", "cosmetic_id", unique=True),
        Index("idx_user_inventory_user_id", "user_id"),
        CheckConstraint(
            "source IN ('store_purchase', 'quest_reward', 'achievement_reward')",
            name="ck_inventory_source_valid",
        ),
    )
```

### 2.9 Table: `user_equipped_items`

Tracks which cosmetic is equipped in each slot. One item per slot per user.

**References**: FR-015

```python
class UserEquippedItem(Base):
    __tablename__ = "user_equipped_items"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True,
        default=uuid4, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    slot: Mapped[str] = mapped_column(String(50), nullable=False)
    cosmetic_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("cosmetic_catalog.id", ondelete="CASCADE"),
        nullable=False,
    )

    cosmetic: Mapped["CosmeticCatalog"] = relationship("CosmeticCatalog")

    __table_args__ = (
        Index("uq_user_equipped_slot", "user_id", "slot", unique=True),
        Index("idx_user_equipped_user_id", "user_id"),
        CheckConstraint(
            "slot IN ('armor', 'cape', 'jewelry', 'boots', 'hairstyle', "
            "'color_palette', 'banner', 'emblem')",
            name="ck_equipped_slot_valid",
        ),
    )
```

### 2.10 Table: `side_quest_catalog`

Quest definitions with level requirements and rewards.

**References**: FR-018, D-MM-9

```python
# backend/app/models/quest.py

class SideQuestCatalog(Base):
    __tablename__ = "side_quest_catalog"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True,
        default=uuid4, server_default=text("gen_random_uuid()")
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(1000), nullable=False)
    level_required: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    xp_reward: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    coin_reward: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    cosmetic_reward_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("cosmetic_catalog.id", ondelete="SET NULL"),
        nullable=True,
    )
    requirements: Mapped[list] = mapped_column(JSONB, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    cosmetic_reward: Mapped["CosmeticCatalog | None"] = relationship("CosmeticCatalog")

    __table_args__ = (
        Index("idx_side_quest_catalog_level", "level_required"),
        Index("idx_side_quest_catalog_active", "is_active"),
    )
```

**`requirements` Schema**:
```json
[
  {
    "type": "module_completed",
    "target_id": null,
    "count": 2,
    "description": "Complete 2 analytics modules"
  },
  {
    "type": "assessment_passed",
    "target_id": "data-challenge-01",
    "count": 1,
    "description": "Pass the data challenge"
  }
]
```

### 2.11 Table: `user_quest_progress`

Tracks user progress toward side quest requirements.

**References**: FR-019

```python
class UserQuestProgress(Base):
    __tablename__ = "user_quest_progress"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True,
        default=uuid4, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    quest_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("side_quest_catalog.id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(20), default="available", nullable=False
    )
    progress: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    quest: Mapped["SideQuestCatalog"] = relationship("SideQuestCatalog")

    __table_args__ = (
        Index("uq_user_quest", "user_id", "quest_id", unique=True),
        Index("idx_user_quest_user_id", "user_id"),
        Index("idx_user_quest_status", "status"),
        CheckConstraint(
            "status IN ('available', 'in_progress', 'completed')",
            name="ck_quest_status_valid",
        ),
    )
```

**`progress` Schema**:
```json
{
  "requirements": [
    { "index": 0, "completed": true, "current_count": 2, "required_count": 2 },
    { "index": 1, "completed": false, "current_count": 0, "required_count": 1 }
  ]
}
```

### 2.12 Table: `user_page_visits`

Tracks page visits for the "explorer" achievement and engagement metrics.

**References**: FR-021

```python
# backend/app/models/page_visit.py

class UserPageVisit(Base):
    __tablename__ = "user_page_visits"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True,
        default=uuid4, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    page: Mapped[str] = mapped_column(String(100), nullable=False)
    first_visited_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    visit_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    __table_args__ = (
        Index("uq_user_page_visit", "user_id", "page", unique=True),
        Index("idx_user_page_visits_user_id", "user_id"),
    )
```

### 2.13 Complete Table Summary

| Table | Row Count Estimate | Growth Pattern | Indexes |
|-------|-------------------|----------------|---------|
| `user_progression` | 1 per user | Slow | user_id (unique) |
| `gamification_events` | ~50-200 per user/month | Unbounded, append-only | user_id, event_type, created_at, (user_id, event_key) partial unique |
| `coin_transactions` | ~10-50 per user/month | Unbounded, append-only | user_id, created_at |
| `achievement_catalog` | ~25 rows (seed) | Static | category, is_active |
| `user_achievements` | ~5-15 per user | Slow | (user_id, achievement_id) unique |
| `cosmetic_catalog` | ~30-50 rows (seed) | Static | category, rarity, is_active |
| `user_inventory` | ~5-20 per user | Slow | (user_id, cosmetic_id) unique |
| `user_equipped_items` | 0-8 per user | Slow | (user_id, slot) unique |
| `side_quest_catalog` | ~5-10 rows (seed) | Static | level_required, is_active |
| `user_quest_progress` | ~2-5 per user | Slow | (user_id, quest_id) unique |
| `user_page_visits` | ~5-8 per user | Slow | (user_id, page) unique |

### 2.14 Alembic Migration Strategy

**References**: D-MM-11

1. Initialize Alembic in the backend root: `alembic init alembic`
2. Configure `alembic/env.py` to use the same `DATABASE_URL` and `Base.metadata` from the project.
3. Create the initial migration with all 11 new tables.
4. Seed data is applied in the same migration using `op.bulk_insert()` for:
   - `achievement_catalog` (24 rows)
   - `cosmetic_catalog` (30+ rows)
   - `side_quest_catalog` (5 rows)
5. The existing `Base.metadata.create_all()` call in `main.py` continues to work for existing tables. New gamification tables are managed exclusively by Alembic.
6. On deployment: run `alembic upgrade head` before starting the FastAPI process.

---

## 3. API Endpoint Design

All endpoints require JWT authentication via the existing `get_current_user_from_token` dependency unless otherwise noted. All endpoints use the `/api` prefix (applied by `app.include_router(router, prefix="/api")`).

### 3.1 Progression Endpoints

**Router**: `backend/app/routes/progression.py`
**Prefix**: `/api/progression`
**Tags**: `["progression"]`

---

#### `GET /api/progression`

Returns the authenticated user's full progression state.

**Response** (200):
```json
{
  "xp_total": 1250,
  "level": 6,
  "title": "Knight",
  "coin_balance": 430,
  "login_streak": 5,
  "last_login_date": "2026-02-10",
  "adventure_mode_enabled": true,
  "current_level_xp": 250,
  "xp_to_next_level": 350,
  "feature_unlocks": {
    "side_quests": true,
    "guild_rank": true,
    "advanced_arena": false,
    "special_title": false
  },
  "equipped_items": {
    "armor": { "id": "uuid", "name": "Bronze Armor", "category": "armor", "rarity": "common" },
    "cape": null,
    "jewelry": null,
    "boots": null,
    "hairstyle": null,
    "color_palette": null,
    "banner": null,
    "emblem": null
  },
  "unlocked_achievements_count": 5,
  "active_quests_count": 2
}
```

**Response** (404 -- no progression row):
```json
{ "detail": "Progression not found. Call POST /api/progression/login to initialize." }
```

**Performance target**: < 100ms (p95). Uses Redis cache.

---

#### `POST /api/progression/toggle-adventure-mode`

Toggles `adventure_mode_enabled` and returns the new state.

**Response** (200):
```json
{
  "adventure_mode_enabled": true
}
```

---

#### `POST /api/progression/login`

Records a daily login. Awards daily login Coins, updates streak. Idempotent per calendar day.

**Response** (200):
```json
{
  "login_streak": 5,
  "coins_awarded": 10,
  "streak_bonus": 0,
  "total_coins_awarded": 10,
  "achievements_unlocked": [],
  "is_new_day": true
}
```

If called again on the same day:
```json
{
  "login_streak": 5,
  "coins_awarded": 0,
  "streak_bonus": 0,
  "total_coins_awarded": 0,
  "achievements_unlocked": [],
  "is_new_day": false
}
```

---

#### `GET /api/progression/history`

Returns paginated event or transaction history.

**Query params**:
- `type`: `"event"` | `"transaction"` (required)
- `limit`: int, default 50, max 100
- `offset`: int, default 0

**Response** (200):
```json
{
  "items": [
    {
      "id": "uuid",
      "event_type": "module_completed",
      "xp_awarded": 50,
      "coins_awarded": 0,
      "created_at": "2026-02-10T14:30:00Z"
    }
  ],
  "total": 142,
  "limit": 50,
  "offset": 0
}
```

---

#### `POST /api/progression/visit`

Records a page visit. Used for the "explorer" achievement.

**Request**:
```json
{ "page": "/matches" }
```

**Response** (200):
```json
{
  "page": "/matches",
  "visit_count": 3,
  "achievements_unlocked": []
}
```

---

### 3.2 Achievement Endpoints

**Router**: `backend/app/routes/achievements.py`
**Prefix**: `/api/achievements`
**Tags**: `["achievements"]`

---

#### `GET /api/achievements/catalog`

Returns all active achievements with unlock status for the current user.

**Response** (200):
```json
{
  "achievements": [
    {
      "id": "first_login",
      "name": "The Journey Begins",
      "description": "Enable adventure mode",
      "icon": "scroll",
      "category": "onboarding",
      "xp_reward": 100,
      "coin_reward": 50,
      "is_unlocked": true,
      "unlocked_at": "2026-02-01T10:00:00Z"
    },
    {
      "id": "first_match",
      "name": "Seeker of Destiny",
      "description": "View match results",
      "icon": "compass",
      "category": "exploration",
      "xp_reward": 150,
      "coin_reward": 75,
      "is_unlocked": false,
      "unlocked_at": null
    }
  ]
}
```

---

#### `GET /api/achievements`

Returns only the user's unlocked achievements with timestamps.

**Response** (200):
```json
{
  "achievements": [
    {
      "id": "first_login",
      "name": "The Journey Begins",
      "unlocked_at": "2026-02-01T10:00:00Z",
      "xp_reward": 100,
      "coin_reward": 50
    }
  ],
  "count": 5
}
```

---

### 3.3 Store Endpoints

**Router**: `backend/app/routes/store.py`
**Prefix**: `/api/store`
**Tags**: `["store"]`

---

#### `GET /api/store/catalog`

Returns paginated store items with optional filters.

**Query params**:
- `category`: optional filter (armor, cape, jewelry, boots, hairstyle, color_palette, banner, emblem)
- `rarity`: optional filter (common, uncommon, rare, epic, legendary)
- `limit`: int, default 50, max 100
- `offset`: int, default 0

**Response** (200):
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Bronze Armor",
      "description": "Basic protective armor",
      "category": "armor",
      "rarity": "common",
      "coin_price": 200,
      "level_required": 1,
      "image_url": null,
      "is_quest_exclusive": false,
      "is_affordable": true,
      "is_owned": false,
      "is_level_locked": false
    }
  ],
  "total": 30,
  "limit": 50,
  "offset": 0
}
```

---

#### `POST /api/store/purchase`

Purchase a cosmetic item.

**Request**:
```json
{ "cosmetic_id": "uuid" }
```

**Response** (200):
```json
{
  "item": {
    "id": "uuid",
    "name": "Bronze Armor",
    "category": "armor",
    "rarity": "common"
  },
  "new_coin_balance": 230,
  "achievements_unlocked": []
}
```

**Error Responses** (400):
```json
{ "detail": "insufficient_coins", "required": 200, "current_balance": 150 }
{ "detail": "already_owned" }
{ "detail": "level_too_low", "required_level": 5, "current_level": 3 }
{ "detail": "item_unavailable" }
{ "detail": "quest_exclusive" }
```

---

#### `GET /api/store/inventory`

Returns all cosmetics owned by the user.

**Response** (200):
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Bronze Armor",
      "category": "armor",
      "rarity": "common",
      "source": "store_purchase",
      "acquired_at": "2026-02-05T12:00:00Z",
      "is_equipped": true
    }
  ],
  "count": 5
}
```

---

#### `POST /api/store/equip`

Equip a cosmetic item into a slot.

**Request**:
```json
{ "cosmetic_id": "uuid", "slot": "armor" }
```

**Response** (200):
```json
{
  "slot": "armor",
  "cosmetic": {
    "id": "uuid",
    "name": "Bronze Armor",
    "category": "armor",
    "rarity": "common"
  }
}
```

**Errors** (400):
```json
{ "detail": "item_not_owned" }
{ "detail": "category_slot_mismatch", "item_category": "cape", "requested_slot": "armor" }
```

---

#### `POST /api/store/unequip`

Remove a cosmetic from a slot.

**Request**:
```json
{ "slot": "armor" }
```

**Response** (200):
```json
{ "slot": "armor", "cosmetic": null }
```

---

### 3.4 Quest Endpoints

**Router**: `backend/app/routes/quests.py`
**Prefix**: `/api/quests`
**Tags**: `["quests"]`

---

#### `GET /api/quests/catalog`

Returns all quests the user has unlocked (level >= `level_required`), with progress status.

**Response** (200):
```json
{
  "quests": [
    {
      "id": "uuid",
      "name": "Trade Data Analysis",
      "description": "A merchant requests assistance analyzing trade data...",
      "level_required": 3,
      "xp_reward": 200,
      "coin_reward": 150,
      "cosmetic_reward": {
        "id": "uuid",
        "name": "Merchant Ring",
        "category": "jewelry",
        "rarity": "rare"
      },
      "requirements": [
        {
          "type": "module_completed",
          "count": 2,
          "description": "Complete 2 analytics modules",
          "current_count": 1,
          "completed": false
        }
      ],
      "status": "in_progress",
      "started_at": "2026-02-08T09:00:00Z",
      "completed_at": null
    }
  ]
}
```

---

#### `GET /api/quests/active`

Returns the user's in-progress quests with current progress.

**Response** (200): Same schema as catalog, filtered to `status == "in_progress"`.

---

#### `GET /api/quests/completed`

Returns completed quests.

**Response** (200): Same schema as catalog, filtered to `status == "completed"`.

---

#### `POST /api/quests/{quest_id}/start`

Start a quest.

**Response** (200):
```json
{
  "quest_id": "uuid",
  "status": "in_progress",
  "started_at": "2026-02-11T10:00:00Z"
}
```

**Errors**:
- `403`: User level too low (`{ "detail": "level_too_low", "required_level": 5, "current_level": 3 }`)
- `400`: Quest already started or completed (`{ "detail": "quest_already_started" }`)

---

### 3.5 Error Response Convention

All error responses follow this pattern:

```json
{
  "detail": "error_code_string",
  ...additional_context_fields
}
```

HTTP status codes:
- `400` Bad Request: Invalid input, business rule violation
- `401` Unauthorized: Missing or invalid JWT
- `403` Forbidden: Level-locked content
- `404` Not Found: Resource does not exist
- `409` Conflict: Duplicate operation (already owned, already started)
- `500` Internal Server Error: Unexpected failure

---

## 4. Service Layer Architecture

### 4.1 Service Dependency Graph

```
reward_hook_service.py
    |-- progression_service.py
    |       |-- (DB: user_progression, gamification_events, coin_transactions)
    |       |-- (Redis: progression cache)
    |-- achievement_service.py
    |       |-- (DB: achievement_catalog, user_achievements)
    |       |-- progression_service.py (for awarding achievement XP/Coins)
    |-- quest_service.py
    |       |-- (DB: side_quest_catalog, user_quest_progress)
    |       |-- progression_service.py (for awarding quest rewards)
    |       |-- store_service.py (for awarding quest cosmetics)

store_service.py
    |-- progression_service.py (for spend_coins)
    |-- (DB: cosmetic_catalog, user_inventory, user_equipped_items)

streak_service.py  (embedded in progression_service.record_login)
    |-- (Redis: streak cache)
```

### 4.2 `progression_service.py`

**File**: `backend/app/services/progression_service.py`
**References**: FR-005

```python
class ProgressionService:
    """Encapsulates all XP, Coin, Level, and Login Streak mutations.

    All methods accept a SQLAlchemy Session and operate within the caller's
    transaction. The caller is responsible for commit/rollback.
    """

    # --- XP Operations ---

    def award_xp(
        self,
        db: Session,
        user_id: UUID,
        amount: int,
        event_type: str,
        event_key: str | None = None,
        metadata: dict | None = None,
    ) -> AwardXPResult:
        """
        Atomically awards XP to a user.

        Steps:
        1. If event_key is provided, check for existing event. If found, return
           {already_awarded: True} without modification.
        2. Insert gamification_event row.
        3. Increment xp_total on user_progression (SELECT FOR UPDATE).
        4. Recompute level from new xp_total using threshold table.
        5. If level changed, emit level_up event and award level-up Coin bonus.
        6. Return AwardXPResult with xp_awarded, new_total, old_level, new_level,
           level_up (bool), coins_from_level_up.
        """

    # --- Coin Operations ---

    def award_coins(
        self,
        db: Session,
        user_id: UUID,
        amount: int,
        source: str,
        reference_id: UUID | None = None,
    ) -> AwardCoinsResult:
        """
        Atomically awards Coins.

        Steps:
        1. SELECT FOR UPDATE on user_progression.
        2. Increment coin_balance.
        3. Insert coin_transaction (type="earned", balance_after=new balance).
        4. Invalidate Redis cache.
        5. Return AwardCoinsResult with coins_awarded, new_balance.
        """

    def spend_coins(
        self,
        db: Session,
        user_id: UUID,
        amount: int,
        source: str,
        reference_id: UUID | None = None,
    ) -> SpendCoinsResult:
        """
        Atomically spends Coins.

        Steps:
        1. SELECT FOR UPDATE on user_progression.
        2. Check coin_balance >= amount. If not, return {success: False, reason: "insufficient_coins"}.
        3. Decrement coin_balance.
        4. Insert coin_transaction (type="spent", amount=-amount, balance_after=new balance).
        5. Invalidate Redis cache.
        6. Return SpendCoinsResult with success, new_balance.
        """

    # --- Login Streak ---

    def record_login(
        self,
        db: Session,
        user_id: UUID,
    ) -> LoginResult:
        """
        Records daily login. Manages streak logic.

        Steps:
        1. SELECT FOR UPDATE on user_progression.
        2. Get today's date (server timezone, UTC).
        3. If last_login_date == today: return no-op (is_new_day=False).
        4. If last_login_date == yesterday: increment login_streak.
        5. Else: reset login_streak to 1.
        6. Update last_login_date = today.
        7. Award daily login Coins (10 coins).
        8. Check streak milestones (multiples of 3 and 7), award bonus Coins.
        9. Update Redis cache.
        10. Return LoginResult with streak, coins_awarded, streak_bonuses.
        """

    # --- Read Operations ---

    def get_progression(
        self,
        db: Session,
        user_id: UUID,
    ) -> ProgressionState | None:
        """
        Returns full progression state. Checks Redis first, falls back to DB.
        Includes computed fields: title, current_level_xp, xp_to_next_level,
        feature_unlocks.
        """

    def ensure_progression_exists(
        self,
        db: Session,
        user_id: UUID,
    ) -> UserProgression:
        """
        Returns existing progression row or creates one with defaults.
        Called during registration and on first API access.
        """
```

**Result Dataclasses**:

```python
@dataclass
class AwardXPResult:
    already_awarded: bool = False
    xp_awarded: int = 0
    new_xp_total: int = 0
    old_level: int = 1
    new_level: int = 1
    level_up: bool = False
    coins_from_level_up: int = 0

@dataclass
class AwardCoinsResult:
    coins_awarded: int = 0
    new_balance: int = 0

@dataclass
class SpendCoinsResult:
    success: bool = False
    reason: str | None = None
    new_balance: int = 0

@dataclass
class LoginResult:
    is_new_day: bool = False
    login_streak: int = 0
    coins_awarded: int = 0
    streak_bonuses: list[dict] = field(default_factory=list)
    total_coins_awarded: int = 0
```

### 4.3 `achievement_service.py`

**File**: `backend/app/services/achievement_service.py`
**References**: FR-013

```python
class AchievementService:
    """Evaluates and unlocks achievements based on gamification events."""

    def __init__(self):
        self._catalog_cache: list[AchievementCatalog] | None = None

    def load_catalog(self, db: Session) -> list[AchievementCatalog]:
        """Load and cache the active achievement catalog.

        Catalog is small (~25 rows) and static. Cached in memory after first load.
        """

    def evaluate_achievements(
        self,
        db: Session,
        user_id: UUID,
        event_type: str,
        progression: UserProgression,
    ) -> list[UnlockedAchievement]:
        """
        Evaluate all active achievements against the user's current state.

        Steps:
        1. Load catalog (from cache).
        2. Get user's already-unlocked achievement IDs.
        3. For each not-yet-unlocked achievement:
           a. If event_based: count events of matching type for user, compare to trigger_config.count.
           b. If threshold_based: check user_progression field against trigger_config.threshold.
           c. If manual: skip (handled by specific endpoints).
        4. For each newly unlocked:
           a. Insert user_achievements row.
           b. Award XP and Coins via progression_service.
        5. Return list of UnlockedAchievement with name, description, rewards.
        """

    def get_user_achievements(
        self, db: Session, user_id: UUID
    ) -> list[UserAchievement]:
        """Return all achievements unlocked by user."""

    def get_catalog_with_status(
        self, db: Session, user_id: UUID
    ) -> list[AchievementWithStatus]:
        """Return full catalog with is_unlocked and unlocked_at per user."""
```

### 4.4 `reward_hook_service.py`

**File**: `backend/app/services/reward_hook_service.py`
**References**: FR-020

This is the **central dispatcher** that existing endpoints call when an action occurs. It orchestrates XP/Coin awards and achievement/quest evaluation in a single call.

```python
class RewardHookService:
    """Central event-to-reward dispatcher.

    Existing route handlers call a single method on this service after
    a rewarded action succeeds. The service handles all downstream effects:
    XP, Coins, achievements, quest progress.
    """

    def __init__(
        self,
        progression_service: ProgressionService,
        achievement_service: AchievementService,
        quest_service: QuestService,
    ):
        self.progression = progression_service
        self.achievement = achievement_service
        self.quest = quest_service

    def process_action(
        self,
        db: Session,
        user_id: UUID,
        event_type: str,
        event_key: str | None = None,
        metadata: dict | None = None,
    ) -> RewardResult:
        """
        Process a platform action and distribute all rewards.

        Steps:
        1. Look up XP and Coin amounts from the reward config table.
        2. If XP > 0: call progression_service.award_xp().
        3. If Coins > 0: call progression_service.award_coins().
        4. Call achievement_service.evaluate_achievements().
        5. Call quest_service.evaluate_quest_progress().
        6. Aggregate all results into RewardResult.
        7. Return RewardResult (XP gained, Coins gained, level changes,
           achievements unlocked, quest progress updates).

        IMPORTANT: This method catches all exceptions internally. If any step
        fails, it logs the error but does NOT propagate the exception to the
        caller. The primary action must never fail due to gamification.
        """

    def get_reward_config(self, event_type: str) -> RewardConfig:
        """Look up XP/Coin amounts for an event type from the config table."""
```

**Reward Configuration Table** (Python dict, loaded at startup):

```python
REWARD_CONFIG: dict[str, RewardConfig] = {
    "module_completed":      RewardConfig(xp=50,  coins=0),
    "assessment_completed":  RewardConfig(xp=75,  coins=0),
    "milestone_passed":      RewardConfig(xp=150, coins=0),
    "certification_earned":  RewardConfig(xp=300, coins=0),
    "weekly_consistency":    RewardConfig(xp=100, coins=0),
    "daily_login":           RewardConfig(xp=0,   coins=10),
    "streak_3":              RewardConfig(xp=0,   coins=50),
    "streak_7":              RewardConfig(xp=0,   coins=100),
    "first_module_week":     RewardConfig(xp=0,   coins=40),
    "peer_endorsement":      RewardConfig(xp=0,   coins=25),
    "side_quest_completed":  RewardConfig(xp=0,   coins=100),
    "roadmap_generated":     RewardConfig(xp=50,  coins=25),
    "first_match_view":      RewardConfig(xp=50,  coins=25),
    "resume_uploaded":       RewardConfig(xp=50,  coins=25),
    "profile_completed":     RewardConfig(xp=50,  coins=25),
}
```

### 4.5 `store_service.py`

**File**: `backend/app/services/store_service.py`
**References**: FR-016

```python
class StoreService:
    """Cosmetic store: browse, purchase, inventory, equip/unequip."""

    def get_catalog(
        self,
        db: Session,
        user_id: UUID,
        category: str | None = None,
        rarity: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> PaginatedCatalog:
        """
        Returns catalog items with is_affordable, is_owned, is_level_locked
        computed per-user.
        """

    def purchase(
        self,
        db: Session,
        user_id: UUID,
        cosmetic_id: UUID,
    ) -> PurchaseResult:
        """
        Atomic purchase flow:
        1. Load cosmetic item. Validate: exists, is_active, not quest_exclusive.
        2. Check user does not already own it (user_inventory).
        3. Load user_progression. Check level >= level_required.
        4. Call progression_service.spend_coins(). If fails, return error.
        5. Insert user_inventory row (source="store_purchase").
        6. Check for "first_purchase" achievement via achievement_service.
        7. Return PurchaseResult.

        All steps in a single transaction.
        """

    def get_inventory(
        self, db: Session, user_id: UUID
    ) -> list[InventoryItem]:
        """Return all cosmetics owned by user with equipped status."""

    def equip(
        self,
        db: Session,
        user_id: UUID,
        cosmetic_id: UUID,
        slot: str,
    ) -> EquipResult:
        """
        Equip a cosmetic.
        1. Validate user owns item.
        2. Validate item category matches slot.
        3. Upsert user_equipped_items (replace existing item in slot).
        """

    def unequip(
        self, db: Session, user_id: UUID, slot: str
    ) -> None:
        """Remove equipped item from slot."""
```

### 4.6 `quest_service.py`

**File**: `backend/app/services/quest_service.py`
**References**: FR-019

```python
class QuestService:
    """Side quest management: catalog, start, progress, completion."""

    def get_available_quests(
        self, db: Session, user_id: UUID, user_level: int
    ) -> list[QuestWithProgress]:
        """Return quests user has unlocked (level >= required), with progress."""

    def start_quest(
        self,
        db: Session,
        user_id: UUID,
        quest_id: UUID,
        user_level: int,
    ) -> UserQuestProgress:
        """
        Start a quest.
        1. Validate quest exists and is active.
        2. Validate user level >= level_required.
        3. Validate quest not already started/completed.
        4. Create user_quest_progress row with status="in_progress" and
           initialized progress JSON.
        """

    def evaluate_quest_progress(
        self,
        db: Session,
        user_id: UUID,
        event_type: str,
        event_key: str | None = None,
    ) -> list[QuestProgressUpdate]:
        """
        Check all in-progress quests for this user. For each quest:
        1. Check if any requirement matches the event_type.
        2. If so, count matching events for the user.
        3. Update progress JSON.
        4. If all requirements met, complete the quest and award rewards.

        Returns list of quests that had progress updates or completions.
        """

    def complete_quest(
        self,
        db: Session,
        user_id: UUID,
        quest_progress: UserQuestProgress,
    ) -> QuestCompletionResult:
        """
        Award quest rewards:
        1. XP via progression_service.award_xp().
        2. Coins via progression_service.award_coins().
        3. Cosmetic (if any) added to user_inventory with source="quest_reward".
        4. Set quest status to "completed", completed_at to now.
        """
```

### 4.7 Service Instantiation Pattern

Services are instantiated as module-level singletons (matching the existing pattern in the codebase where services are functions/classes in `backend/app/services/`):

```python
# backend/app/services/progression_service.py
progression_service = ProgressionService()

# backend/app/services/achievement_service.py
achievement_service = AchievementService()

# backend/app/services/quest_service.py
quest_service = QuestService()

# backend/app/services/store_service.py
store_service = StoreService()

# backend/app/services/reward_hook_service.py
reward_hook_service = RewardHookService(
    progression_service=progression_service,
    achievement_service=achievement_service,
    quest_service=quest_service,
)
```

Route handlers receive the `db: Session` via `Depends(get_db)` and pass it to service methods. The route handler is responsible for `db.commit()` on success.

---

## 5. XP Calculation Engine

### 5.1 Level Threshold Table

**References**: FR-007, D-MM-5

The exponential curve from the current implementation (`100 * 1.5^(level-1)`) makes high levels unreachable. The new system uses a linear-step curve:

```python
# backend/app/services/progression_service.py

XP_THRESHOLDS: list[tuple[int, int, str]] = [
    # (level, total_xp_required, title)
    (1,   0,      "Apprentice"),
    (2,   100,    "Apprentice"),
    (3,   300,    "Apprentice"),
    (4,   600,    "Squire"),
    (5,   1000,   "Squire"),
    (6,   1500,   "Knight"),
    (7,   2100,   "Knight"),
    (8,   2800,   "Warrior"),
    (9,   3600,   "Warrior"),
    (10,  4500,   "Champion"),
]

def compute_level_from_xp(xp_total: int) -> tuple[int, str]:
    """Derive level and title from total XP.

    For levels 1-10, use the threshold table.
    For levels 11+: threshold = 4500 + (level - 10) * 1000.
    Title mapping for 11+:
      11-14: Master
      15-19: Grandmaster
      20+: Legend
    """
    # Check levels 1-10
    for i in range(len(XP_THRESHOLDS) - 1, -1, -1):
        level, threshold, title = XP_THRESHOLDS[i]
        if xp_total >= threshold:
            # Check if there's a higher level above 10
            if level == 10:
                extra_level = (xp_total - 4500) // 1000
                if extra_level > 0:
                    actual_level = 10 + extra_level
                    if actual_level >= 20:
                        return actual_level, "Legend"
                    elif actual_level >= 15:
                        return actual_level, "Grandmaster"
                    else:
                        return actual_level, "Master"
            return level, title
    return 1, "Apprentice"


def compute_xp_for_next_level(level: int) -> int:
    """Return the total XP required to reach level+1."""
    if level < 10:
        return XP_THRESHOLDS[level][1]  # next level's threshold
    return 4500 + (level - 9) * 1000


def compute_level_progress(xp_total: int, level: int) -> tuple[int, int]:
    """Return (current_level_xp, xp_to_next_level).

    current_level_xp: XP earned within the current level.
    xp_to_next_level: XP remaining to reach the next level.
    """
    if level <= 10:
        current_threshold = XP_THRESHOLDS[level - 1][1]
    else:
        current_threshold = 4500 + (level - 10) * 1000

    next_threshold = compute_xp_for_next_level(level)

    current_level_xp = xp_total - current_threshold
    xp_to_next_level = next_threshold - xp_total

    return current_level_xp, max(0, xp_to_next_level)
```

### 5.2 Level-Up Detection

When `award_xp()` is called:

```
1. old_xp = user.xp_total
2. new_xp = old_xp + amount
3. old_level, _ = compute_level_from_xp(old_xp)
4. new_level, new_title = compute_level_from_xp(new_xp)
5. user.xp_total = new_xp
6. user.level = new_level
7. if new_level > old_level:
     for each level from old_level+1 to new_level:
       award_coins(user_id, level * 10, "level_up_bonus")
       insert gamification_event(type="level_up", metadata={"level": level})
     check feature_unlocks(new_level)
```

### 5.3 Feature Unlock Evaluation

**References**: FR-008

```python
FEATURE_UNLOCKS = {
    3:  "side_quests",
    5:  "guild_rank",
    8:  "advanced_arena",
    10: "special_title",
}

def get_feature_unlocks(level: int) -> dict[str, bool]:
    return {
        "side_quests": level >= 3,
        "guild_rank": level >= 5,
        "advanced_arena": level >= 8,
        "special_title": level >= 10,
    }
```

---

## 6. Event System Architecture

### 6.1 Event Flow

```
User Action (e.g., complete module)
    |
    v
Existing Route Handler (e.g., POST /api/skills/progress/module/{id}/complete)
    |
    | (primary action succeeds)
    |
    v
reward_hook_service.process_action(
    db, user_id,
    event_type="module_completed",
    event_key="module:{module_id}"
)
    |
    +---> progression_service.award_xp(50 XP)
    |         |
    |         +---> (level-up check)
    |         +---> (level-up Coin bonus if applicable)
    |
    +---> achievement_service.evaluate_achievements()
    |         |
    |         +---> (unlock achievements if conditions met)
    |         +---> (award achievement XP/Coins)
    |
    +---> quest_service.evaluate_quest_progress()
    |         |
    |         +---> (update quest progress)
    |         +---> (complete quest if all requirements met)
    |         +---> (award quest XP/Coins/Cosmetic)
    |
    v
RewardResult returned to route handler
    |
    v
Route response includes gamification_rewards field (optional)
```

### 6.2 Fire-and-Forget Pattern

**References**: FR-020.3, D-MM-10

```python
# In each route handler:
try:
    reward_result = reward_hook_service.process_action(
        db, user_id,
        event_type="module_completed",
        event_key=f"module:{module_id}",
    )
except Exception:
    logger.exception("Gamification reward failed for module %s", module_id)
    reward_result = None

# The primary response is always returned regardless of reward_result
return ModuleCompletionResponse(
    module=module_data,
    gamification=reward_result,  # None if gamification failed
)
```

### 6.3 Event Type Registry

| Event Type | XP | Coins | Event Key Pattern | Triggered By |
|------------|-----|-------|-------------------|--------------|
| `module_completed` | 50 | 0 | `module:{module_id}` | `POST /api/skills/progress/module/{id}/complete` |
| `assessment_completed` | 75 | 0 | `assessment:{id}` | Assessment completion flow |
| `milestone_passed` | 150 | 0 | `milestone:{id}` | `POST /api/roadmap/progress/milestone/{id}` |
| `certification_earned` | 300 | 0 | `cert:{badge_id}` | Badge earned flow |
| `weekly_consistency` | 100 | 0 | `weekly:{year}:{week}` | Login tracking (checked weekly) |
| `daily_login` | 0 | 10 | null (repeatable) | `POST /api/progression/login` |
| `streak_3` | 0 | 50 | null (repeatable) | Login streak evaluation |
| `streak_7` | 0 | 100 | null (repeatable) | Login streak evaluation |
| `first_module_week` | 0 | 40 | `first_module:{year}:{week}` | Module completion (weekly first) |
| `roadmap_generated` | 50 | 25 | `roadmap:{roadmap_id}` | `POST /api/roadmap/generate` |
| `first_match_view` | 50 | 25 | `first_match:{user_id}` | `POST /api/matches` |
| `resume_uploaded` | 50 | 25 | `resume:{user_id}` | `POST /api/skills/upload` |
| `profile_completed` | 50 | 25 | `profile:{user_id}` | Profile update endpoint |
| `level_up` | 0 | level * 10 | `level_up:{level}` | Auto-emitted by award_xp |
| `side_quest_completed` | varies | varies | `quest:{quest_id}` | Quest completion |
| `page_visit` | 0 | 0 | null | `POST /api/progression/visit` |

### 6.4 Integration Points in Existing Routes

| File | Modification | Event |
|------|-------------|-------|
| `backend/app/routes/auth.py` | After user creation in `register()`: call `progression_service.ensure_progression_exists()`. After login: call `reward_hook_service.process_action("daily_login")` | `daily_login` |
| `backend/app/routes/skills.py` | After module completion: call `reward_hook_service.process_action("module_completed", event_key=f"module:{id}")` | `module_completed` |
| `backend/app/routes/roadmap.py` | After milestone marked complete: call `reward_hook_service.process_action("milestone_passed", event_key=f"milestone:{id}")`. After roadmap generation: call `reward_hook_service.process_action("roadmap_generated", event_key=f"roadmap:{id}")` | `milestone_passed`, `roadmap_generated` |
| `backend/app/routes/matches.py` | After first match query: call `reward_hook_service.process_action("first_match_view", event_key=f"first_match:{user_id}")` | `first_match_view` |
| `backend/app/routes/__init__.py` | Add imports for new routers | N/A |
| `backend/app/main.py` | Register new routers (progression, achievements, store, quests) | N/A |

### 6.5 First-Time Action Detection

First-time actions are automatically handled by the idempotency mechanism:
- The `event_key` includes the entity ID (e.g., `module:abc123`).
- The partial unique index on `(user_id, event_key)` prevents duplicate inserts.
- If the insert is a duplicate, `award_xp()` returns `{already_awarded: True}` and no XP/Coins are granted.

This means **no special first-time detection code is needed**. The event system inherently handles it.

---

## 7. Frontend Architecture Changes

### 7.1 AdventureModeContext Migration

**File**: `frontend/src/context/AdventureModeContext.tsx`
**References**: FR-022, D-MM-12

**Current state**: All gamification data in localStorage key `springais-adventure-mode`.
**Target state**: All gamification data fetched from `GET /api/progression` via React Query. Zero localStorage usage for gamification.

**Changes**:
1. Remove `STORAGE_KEY`, `loadState()`, `saveState()` functions entirely.
2. Remove all `localStorage.getItem`/`localStorage.setItem` calls.
3. On mount (when `AuthContext` has a valid user), fetch progression from server.
4. Store progression data in React state, fed by `useQuery('progression')`.
5. Expose the same public API (totalXP, gold, level, title, etc.) but backed by server data.
6. Keep derived calculations (currentXP, xpToNextLevel) client-side for instant UI.
7. Validate client-side level against server-provided level on each fetch.

**React Query Integration**:

```typescript
// frontend/src/services/progressionService.ts

export const progressionApi = {
  getProgression: () => api.get('/progression'),
  toggleAdventureMode: () => api.post('/progression/toggle-adventure-mode'),
  recordLogin: () => api.post('/progression/login'),
  recordVisit: (page: string) => api.post('/progression/visit', { page }),
  getHistory: (type: 'event' | 'transaction', limit = 50, offset = 0) =>
    api.get(`/progression/history?type=${type}&limit=${limit}&offset=${offset}`),
};
```

```typescript
// In AdventureModeContext.tsx:

const { data: progression, refetch } = useQuery({
  queryKey: ['progression'],
  queryFn: () => progressionApi.getProgression(),
  enabled: !!user,  // Only fetch when logged in
  staleTime: 30_000,  // 30s cache
  refetchOnWindowFocus: true,
});
```

### 7.2 New API Client Functions

**File**: `frontend/src/services/progressionService.ts` (new)

```typescript
export const progressionApi = {
  getProgression: () => api.get<ProgressionState>('/progression'),
  toggleAdventureMode: () => api.post<{ adventure_mode_enabled: boolean }>('/progression/toggle-adventure-mode'),
  recordLogin: () => api.post<LoginResult>('/progression/login'),
  recordVisit: (page: string) => api.post<VisitResult>('/progression/visit', { page }),
  getHistory: (type: string, limit?: number, offset?: number) =>
    api.get<PaginatedHistory>(`/progression/history`, { params: { type, limit, offset } }),
};
```

**File**: `frontend/src/services/storeService.ts` (new)

```typescript
export const storeApi = {
  getCatalog: (params?: { category?: string; rarity?: string; limit?: number; offset?: number }) =>
    api.get<PaginatedCatalog>('/store/catalog', { params }),
  purchase: (cosmetic_id: string) =>
    api.post<PurchaseResult>('/store/purchase', { cosmetic_id }),
  getInventory: () => api.get<InventoryResponse>('/store/inventory'),
  equip: (cosmetic_id: string, slot: string) =>
    api.post<EquipResult>('/store/equip', { cosmetic_id, slot }),
  unequip: (slot: string) =>
    api.post<UnequipResult>('/store/unequip', { slot }),
};
```

**File**: `frontend/src/services/questService.ts` (new)

```typescript
export const questApi = {
  getCatalog: () => api.get<QuestCatalogResponse>('/quests/catalog'),
  getActive: () => api.get<QuestCatalogResponse>('/quests/active'),
  getCompleted: () => api.get<QuestCatalogResponse>('/quests/completed'),
  startQuest: (questId: string) => api.post<StartQuestResult>(`/quests/${questId}/start`),
};
```

**File**: `frontend/src/services/achievementService.ts` (new)

```typescript
export const achievementApi = {
  getCatalog: () => api.get<AchievementCatalogResponse>('/achievements/catalog'),
  getUnlocked: () => api.get<UnlockedAchievementsResponse>('/achievements'),
};
```

### 7.3 React Query Integration Strategy

All gamification data uses `@tanstack/react-query` (already installed):

| Query Key | Endpoint | Stale Time | Refetch Strategy |
|-----------|----------|------------|------------------|
| `['progression']` | `GET /api/progression` | 30s | On window focus, after mutations |
| `['achievements', 'catalog']` | `GET /api/achievements/catalog` | 5min | After gamification events |
| `['store', 'catalog', filters]` | `GET /api/store/catalog` | 5min | After purchase |
| `['store', 'inventory']` | `GET /api/store/inventory` | 1min | After purchase/equip |
| `['quests', 'catalog']` | `GET /api/quests/catalog` | 2min | After gamification events |
| `['quests', 'active']` | `GET /api/quests/active` | 1min | After gamification events |

**Invalidation Pattern**: After any action that triggers a gamification event, the mutation's `onSuccess` callback invalidates `['progression']` and relevant query keys:

```typescript
const completeMutation = useMutation({
  mutationFn: completeModule,
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['progression'] });
    queryClient.invalidateQueries({ queryKey: ['quests', 'active'] });
    queryClient.invalidateQueries({ queryKey: ['achievements', 'catalog'] });

    // Show toasts for gamification rewards
    if (data.gamification?.level_up) {
      showLevelUpToast(data.gamification.new_level);
    }
    if (data.gamification?.achievements_unlocked?.length) {
      data.gamification.achievements_unlocked.forEach(showAchievementToast);
    }
  },
});
```

### 7.4 New Components

| Component | Purpose | Route |
|-----------|---------|-------|
| `frontend/src/pages/StorePage.tsx` | Cosmetic store with catalog grid, filters, purchase dialog | `/store` |
| `frontend/src/pages/QuestsPage.tsx` | Quest board with available/active/completed tabs | `/quests` |
| `frontend/src/components/store/StoreItemCard.tsx` | Individual item in the store grid | N/A (used in StorePage) |
| `frontend/src/components/store/InventoryPanel.tsx` | User inventory with equip/unequip | N/A (tab in StorePage) |
| `frontend/src/components/store/PurchaseDialog.tsx` | Confirmation dialog for purchases | N/A (modal in StorePage) |
| `frontend/src/components/quests/QuestCard.tsx` | Individual quest with progress | N/A (used in QuestsPage) |
| `frontend/src/components/quests/QuestProgressBar.tsx` | Requirement progress visualization | N/A (used in QuestCard) |

### 7.5 Routing Changes

**File**: `frontend/src/App.tsx`

Add two new routes inside the `ProtectedRoute` wrapper:

```typescript
<Route path="/store" element={<StorePage />} />
<Route path="/quests" element={<QuestsPage />} />
```

### 7.6 Sidebar Navigation

**File**: `frontend/src/components/layout/Sidebar.tsx`

Add navigation items for Store and Quests (conditionally shown when adventure mode is enabled):

```typescript
// When adventure mode is active:
{ path: '/store', label: 'Merchant\'s Armory', icon: ShoppingBag, fantasyLabel: 'Merchant\'s Armory' }
{ path: '/quests', label: 'Quest Board', icon: Scroll, fantasyLabel: 'Adventurer\'s Guild' }
```

### 7.7 State Management for Equipped Cosmetics

Equipped cosmetics are part of the progression state returned by `GET /api/progression`. The `equipped_items` field is a dict of slot -> cosmetic data. This data is used by:

1. **AdventureHUD**: Display equipped items as visual indicators.
2. **ProfilePage**: Show equipped cosmetics on user profile.
3. **StorePage**: Show equipped status on items in inventory.

No separate React context is needed. The `['progression']` query provides this data.

---

## 8. Redis Usage

### 8.1 Progression State Cache

**Key**: `progression:{user_id}`
**Value**: JSON blob of full progression state
**TTL**: 300 seconds (5 minutes)
**Invalidation**: On any XP/Coin/level/streak mutation

```python
async def get_cached_progression(redis: Redis, user_id: UUID) -> dict | None:
    data = await redis.get(f"progression:{user_id}")
    return json.loads(data) if data else None

async def set_cached_progression(redis: Redis, user_id: UUID, state: dict):
    await redis.setex(
        f"progression:{user_id}",
        300,  # 5 min TTL
        json.dumps(state, default=str),
    )

async def invalidate_progression_cache(redis: Redis, user_id: UUID):
    await redis.delete(f"progression:{user_id}")
```

### 8.2 Login Streak Tracking

Login streak logic is primarily database-driven (using `last_login_date` and `login_streak` on `user_progression`). Redis is used as a short-lived guard to prevent duplicate daily login processing:

**Key**: `login_guard:{user_id}:{date}`
**Value**: `"1"`
**TTL**: 86400 seconds (24 hours)

```python
async def is_login_processed_today(redis: Redis, user_id: UUID) -> bool:
    today = date.today().isoformat()
    return await redis.exists(f"login_guard:{user_id}:{today}") > 0

async def mark_login_processed(redis: Redis, user_id: UUID):
    today = date.today().isoformat()
    await redis.setex(f"login_guard:{user_id}:{today}", 86400, "1")
```

### 8.3 Rate Limiting

Rate limiting for reward hooks is handled via the idempotency mechanism (event_key) rather than Redis. The daily login rate limit is handled by the login guard above. No additional Redis-based rate limiting is needed for MVP.

### 8.4 Graceful Degradation

**References**: NFR-005

```python
async def get_progression_with_fallback(
    db: Session, redis: Redis | None, user_id: UUID
) -> ProgressionState:
    """Try Redis first, fall back to DB if Redis unavailable."""
    if redis:
        try:
            cached = await get_cached_progression(redis, user_id)
            if cached:
                return ProgressionState(**cached)
        except Exception:
            logger.warning("Redis unavailable, falling back to DB")

    # Direct DB query
    return progression_service.get_progression(db, user_id)
```

---

## 9. Migration Plan

### 9.1 Alembic Setup

**References**: D-MM-11

1. The `alembic` package is already in `backend/requirements.txt`.
2. Run `alembic init alembic` in `backend/` to create the `alembic/` directory.
3. Configure `alembic/env.py`:
   - Import `Base` from `app.models.base`
   - Import all new models so they register with Base.metadata
   - Set `target_metadata = Base.metadata`
   - Configure `sqlalchemy.url` from `DATABASE_URL` env var
4. Create initial migration: `alembic revision --autogenerate -m "add_gamification_tables"`

### 9.2 Initial Migration Content

The initial migration creates all 11 new tables and seeds catalog data:

```python
# alembic/versions/001_add_gamification_tables.py

def upgrade():
    # 1. Create tables (in dependency order)
    op.create_table("user_progression", ...)
    op.create_table("gamification_events", ...)
    op.create_table("coin_transactions", ...)
    op.create_table("achievement_catalog", ...)
    op.create_table("user_achievements", ...)
    op.create_table("cosmetic_catalog", ...)
    op.create_table("user_inventory", ...)
    op.create_table("user_equipped_items", ...)
    op.create_table("side_quest_catalog", ...)
    op.create_table("user_quest_progress", ...)
    op.create_table("user_page_visits", ...)

    # 2. Seed achievement catalog (24 rows)
    op.bulk_insert(achievement_catalog_table, ACHIEVEMENT_SEED_DATA)

    # 3. Seed cosmetic catalog (30+ rows)
    op.bulk_insert(cosmetic_catalog_table, COSMETIC_SEED_DATA)

    # 4. Seed side quest catalog (5 rows)
    op.bulk_insert(side_quest_catalog_table, QUEST_SEED_DATA)

def downgrade():
    # Drop tables in reverse dependency order
    op.drop_table("user_page_visits")
    op.drop_table("user_quest_progress")
    op.drop_table("side_quest_catalog")
    op.drop_table("user_equipped_items")
    op.drop_table("user_inventory")
    op.drop_table("cosmetic_catalog")
    op.drop_table("user_achievements")
    op.drop_table("achievement_catalog")
    op.drop_table("coin_transactions")
    op.drop_table("gamification_events")
    op.drop_table("user_progression")
```

### 9.3 Existing User Handling

**References**: D-MM-12

- **No migration of localStorage data**. All localStorage gamification data is untrusted.
- When an existing user first calls `POST /api/progression/login` (triggered on frontend login), the service creates a `user_progression` row with defaults if one does not exist.
- New users get a `user_progression` row created during registration (in `auth.py` register endpoint).

### 9.4 Frontend Cleanup

After backend is deployed:
1. Remove `STORAGE_KEY` constant from `AdventureModeContext.tsx`.
2. Remove `loadState()` and `saveState()` functions.
3. Remove all `localStorage.getItem('springais-adventure-mode')` / `localStorage.setItem(...)` calls.
4. The `localStorage` keys for theme (`springais-theme`) and auth (`token`, `user`) remain unchanged.

### 9.5 Deployment Order

1. **Backend first**: Deploy new tables, endpoints, services. Existing endpoints are backward-compatible (new gamification calls are additive).
2. **Frontend second**: Deploy the React changes that switch from localStorage to API calls.
3. **Rollback**: Frontend can be reverted independently; backend changes are additive and do not break existing functionality.

### 9.6 Backward Compatibility Notes

**References**: NFR-006

- The `Base.metadata.create_all()` call in `main.py` remains for existing tables. It will NOT create the new gamification tables (those are Alembic-managed).
- Existing endpoints are not broken by the new code. The reward hooks are additive (try/except wrapped).
- The `user_profiles` table is NOT modified. The `user_progression` table has a FK to `user_profiles.id`.

---

## 10. ADR Index

| ADR | Title | Location |
|-----|-------|----------|
| ADR-MM-001 | Adopt Alembic for gamification schema migrations | `artifacts/design/decisions/ADR-MM-001-alembic-migrations.md` |
| ADR-MM-002 | Redis caching for progression state with DB fallback | `artifacts/design/decisions/ADR-MM-002-redis-progression-cache.md` |
| ADR-MM-003 | Synchronous in-process achievement evaluation | `artifacts/design/decisions/ADR-MM-003-sync-achievement-eval.md` |
| ADR-MM-004 | SELECT FOR UPDATE for Coin balance integrity | `artifacts/design/decisions/ADR-MM-004-coin-balance-locking.md` |
| ADR-MM-005 | Linear-step XP curve replacing exponential | `artifacts/design/decisions/ADR-MM-005-linear-xp-curve.md` |
| ADR-MM-006 | No migration of localStorage data | `artifacts/design/decisions/ADR-MM-006-no-localstorage-migration.md` |

---

## Appendix A: Pydantic Schema Summary

### Progression Schemas (`backend/app/schemas/progression.py`)

```python
class ProgressionResponse(BaseModel):
    xp_total: int
    level: int
    title: str
    coin_balance: int
    login_streak: int
    last_login_date: date | None
    adventure_mode_enabled: bool
    current_level_xp: int
    xp_to_next_level: int
    feature_unlocks: FeatureUnlocks
    equipped_items: dict[str, CosmeticBrief | None]
    unlocked_achievements_count: int
    active_quests_count: int

class FeatureUnlocks(BaseModel):
    side_quests: bool
    guild_rank: bool
    advanced_arena: bool
    special_title: bool

class LoginResponse(BaseModel):
    login_streak: int
    coins_awarded: int
    streak_bonus: int
    total_coins_awarded: int
    achievements_unlocked: list[AchievementBrief]
    is_new_day: bool

class ToggleAdventureModeResponse(BaseModel):
    adventure_mode_enabled: bool

class VisitRequest(BaseModel):
    page: str

class VisitResponse(BaseModel):
    page: str
    visit_count: int
    achievements_unlocked: list[AchievementBrief]

class HistoryResponse(BaseModel):
    items: list[dict]
    total: int
    limit: int
    offset: int
```

### Achievement Schemas (`backend/app/schemas/achievement.py`)

```python
class AchievementBrief(BaseModel):
    id: str
    name: str
    description: str
    xp_reward: int
    coin_reward: int

class AchievementCatalogItem(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    category: str
    xp_reward: int
    coin_reward: int
    is_unlocked: bool
    unlocked_at: datetime | None

class AchievementCatalogResponse(BaseModel):
    achievements: list[AchievementCatalogItem]

class UserAchievementsResponse(BaseModel):
    achievements: list[AchievementBrief]
    count: int
```

### Store Schemas (`backend/app/schemas/cosmetic.py`)

```python
class CosmeticBrief(BaseModel):
    id: str
    name: str
    category: str
    rarity: str

class StoreCatalogItem(BaseModel):
    id: str
    name: str
    description: str
    category: str
    rarity: str
    coin_price: int
    level_required: int
    image_url: str | None
    is_quest_exclusive: bool
    is_affordable: bool
    is_owned: bool
    is_level_locked: bool

class PaginatedCatalogResponse(BaseModel):
    items: list[StoreCatalogItem]
    total: int
    limit: int
    offset: int

class PurchaseRequest(BaseModel):
    cosmetic_id: str

class PurchaseResponse(BaseModel):
    item: CosmeticBrief
    new_coin_balance: int
    achievements_unlocked: list[AchievementBrief]

class InventoryItem(BaseModel):
    id: str
    name: str
    category: str
    rarity: str
    source: str
    acquired_at: datetime
    is_equipped: bool

class InventoryResponse(BaseModel):
    items: list[InventoryItem]
    count: int

class EquipRequest(BaseModel):
    cosmetic_id: str
    slot: str

class UnequipRequest(BaseModel):
    slot: str
```

### Quest Schemas (`backend/app/schemas/quest.py`)

```python
class QuestRequirement(BaseModel):
    type: str
    count: int
    description: str
    current_count: int = 0
    completed: bool = False

class QuestCatalogItem(BaseModel):
    id: str
    name: str
    description: str
    level_required: int
    xp_reward: int
    coin_reward: int
    cosmetic_reward: CosmeticBrief | None
    requirements: list[QuestRequirement]
    status: str  # "available", "in_progress", "completed"
    started_at: datetime | None
    completed_at: datetime | None

class QuestCatalogResponse(BaseModel):
    quests: list[QuestCatalogItem]

class StartQuestResponse(BaseModel):
    quest_id: str
    status: str
    started_at: datetime
```

---

## Appendix B: New File Inventory

### Backend -- New Files

| File | Purpose |
|------|---------|
| `backend/app/models/progression.py` | UserProgression, GamificationEvent, CoinTransaction |
| `backend/app/models/achievement.py` | AchievementCatalog, UserAchievement |
| `backend/app/models/cosmetic.py` | CosmeticCatalog, UserInventory, UserEquippedItem |
| `backend/app/models/quest.py` | SideQuestCatalog, UserQuestProgress |
| `backend/app/models/page_visit.py` | UserPageVisit |
| `backend/app/schemas/progression.py` | Pydantic schemas for progression API |
| `backend/app/schemas/achievement.py` | Pydantic schemas for achievement API |
| `backend/app/schemas/cosmetic.py` | Pydantic schemas for store API |
| `backend/app/schemas/quest.py` | Pydantic schemas for quest API |
| `backend/app/services/progression_service.py` | XP/Coin/Level/Streak management |
| `backend/app/services/achievement_service.py` | Achievement evaluation and unlock |
| `backend/app/services/store_service.py` | Cosmetic store operations |
| `backend/app/services/quest_service.py` | Side quest management |
| `backend/app/services/reward_hook_service.py` | Central reward dispatcher |
| `backend/app/routes/progression.py` | Progression API endpoints |
| `backend/app/routes/achievements.py` | Achievement API endpoints |
| `backend/app/routes/store.py` | Store API endpoints |
| `backend/app/routes/quests.py` | Quest API endpoints |
| `backend/app/data/gamification_seed.py` | Seed data for catalogs |
| `backend/alembic/` | Alembic config and migrations |
| `backend/alembic.ini` | Alembic configuration |
| `backend/alembic/env.py` | Alembic environment config |
| `backend/alembic/versions/001_add_gamification_tables.py` | Initial migration |

### Backend -- Modified Files

| File | Changes |
|------|---------|
| `backend/app/routes/auth.py` | Create progression row on register; record login |
| `backend/app/routes/skills.py` | Emit module_completed event |
| `backend/app/routes/roadmap.py` | Emit milestone_passed, roadmap_generated events |
| `backend/app/routes/matches.py` | Emit first_match_view event |
| `backend/app/routes/__init__.py` | Register new routers |
| `backend/app/main.py` | Include new routers |
| `backend/app/models/__init__.py` | Export new models |

### Frontend -- New Files

| File | Purpose |
|------|---------|
| `frontend/src/services/progressionService.ts` | Progression API client |
| `frontend/src/services/storeService.ts` | Store API client |
| `frontend/src/services/questService.ts` | Quest API client |
| `frontend/src/services/achievementService.ts` | Achievement API client |
| `frontend/src/pages/StorePage.tsx` | Cosmetic store page |
| `frontend/src/pages/QuestsPage.tsx` | Side quests page |
| `frontend/src/components/store/StoreItemCard.tsx` | Store item card |
| `frontend/src/components/store/InventoryPanel.tsx` | Inventory with equip |
| `frontend/src/components/store/PurchaseDialog.tsx` | Purchase confirmation |
| `frontend/src/components/quests/QuestCard.tsx` | Quest card with progress |
| `frontend/src/components/quests/QuestProgressBar.tsx` | Requirement progress |

### Frontend -- Modified Files

| File | Changes |
|------|---------|
| `frontend/src/context/AdventureModeContext.tsx` | Remove localStorage, add API sync, expand fantasy text |
| `frontend/src/components/game/AdventureHUD.tsx` | Dual-track display, Store/Quest buttons |
| `frontend/src/components/game/AchievementsPanel.tsx` | Fetch from server API |
| `frontend/src/components/game/CoinFlipGame.tsx` | Remove or replace |
| `frontend/src/components/game/NotificationToasts.tsx` | Coin gain toasts, quest toasts |
| `frontend/src/components/game/ThemeSwitcher.tsx` | Toggle calls server API |
| `frontend/src/components/layout/Sidebar.tsx` | Add Store and Quest nav items |
| `frontend/src/App.tsx` | Add /store and /quests routes |


---

# 8. Architecture Decision Records (ADRs)

This section contains all 12 Architecture Decision Records. ADR-001 through ADR-005 relate to the Badge Discovery System (Section 7.8). ADR-MM-001 through ADR-MM-007 relate to the Medieval Mode Economy & Progression System (Section 7.10).

---

## 8.1 ADR-001: Curated Catalog Primary

*Source: artifacts/design/decisions/ADR-001-curated-catalog-primary.md*
*Related: Section 7.8 (Badge System Architecture), Section 3.2 (Badge System PRD)*

# ADR-001: Curated Catalog as Primary Source, External APIs as Enrichment

> **Status**: Accepted
> **Date**: 2026-02-11
> **Decision Makers**: Architect Agent
> **References**: D-PRD-3, FR-1.2, FR-2.1, FR-6.1

---

## Context

The badge discovery system needs to match user skills to relevant badges and certifications. Multiple data sources are available:

1. **Curated catalog**: Manually maintained mappings of skills to known certifications (e.g., "Azure" -> "Azure Solutions Architect Expert")
2. **Microsoft Learn Catalog API**: Free public API with ~150 certifications including skill tags
3. **Credly API**: Enterprise API with org-specific badges (requires paid access)
4. **AI inference**: GPT or embedding-based matching (probabilistic, may hallucinate)
5. **Keyword matching**: Automated text matching against badge metadata

The core problem this system solves is **AI hallucination of badge names and URLs** (PRD Section 1). The AI currently invents badges that do not exist, eroding user trust.

## Decision

**The curated badge catalog is the authoritative primary source.** External APIs and AI matching enrich and extend the catalog but never override curated data.

The matching pipeline executes in this order:
1. **Curated mappings** (confidence = 1.0) -- highest priority
2. **External API results** (confidence = 0.7-0.9) -- second priority
3. **Keyword matching** (confidence = 0.4-0.6) -- third priority
4. **AI semantic matching** (confidence = 0.3-0.5, Phase D) -- fallback only

Results from all sources are merged and deduplicated. When a badge appears in both the curated catalog and an API result, the curated data takes precedence for metadata (URL, skills mapping, difficulty level).

## Consequences

### Positive

- **Deterministic accuracy**: Curated mappings guarantee correct badge names, URLs, and skill associations. No hallucination risk for curated entries.
- **Trust foundation**: Users see verified badges prominently. Curated entries can display a "Verified" indicator.
- **Graceful degradation**: If all external APIs fail, the curated catalog still provides results (NFR-2, FR-1.5).
- **Fast responses**: Curated catalog queries are database-only, meeting the 200ms p95 target (NFR-1).

### Negative

- **Maintenance burden**: Curated catalog requires periodic manual review (~2-4 hours/quarter per the research artifact). Initial seeding of 50+ entries requires one-time effort.
- **Coverage gaps**: Skills not in the curated catalog rely on external APIs or AI matching, which may return less accurate results.
- **Scaling ceiling**: The curated approach does not scale to thousands of niche certifications. Phase D's AI matching addresses the long tail.

### Mitigations

- Start with 50+ high-value certifications covering the most common skills (AWS, Azure, GCP, CompTIA, PMI, EY badges).
- External API results are automatically added to the catalog as "api-sourced" entries, reducing future manual curation.
- Phase D adds AI semantic matching as a fallback for uncovered skills.
- User feedback (FR-5.3, FR-5.5) identifies gaps in coverage and informs catalog updates.


---

## 8.2 ADR-002: Microsoft Learn First

*Source: artifacts/design/decisions/ADR-002-microsoft-learn-first.md*
*Related: Section 7.8 (Badge System Architecture), Section 3.2 (Badge System PRD)*

# ADR-002: Microsoft Learn API First, Credly API Second

> **Status**: Accepted
> **Date**: 2026-02-11
> **Decision Makers**: Architect Agent
> **References**: D-PRD-2, FR-1.2, FR-6.4, FR-6.5

---

## Context

Two major external APIs are candidates for live badge discovery:

1. **Microsoft Learn Catalog API**
   - Free, public, no authentication required
   - ~150 certifications with rich metadata (skills arrays, roles, levels, direct URLs)
   - Covers Azure, Microsoft 365, Dynamics, Power Platform, Security
   - Generous rate limits (no documented restrictions)
   - Endpoint: `https://learn.microsoft.com/api/catalog/`

2. **Credly API**
   - Requires enterprise agreement ($2,500-$20,000/year)
   - EY-specific badges available via org filter
   - Skill-based search (`filter=skills::value`)
   - Includes vanity slugs for deep-linking
   - EY likely already has enterprise access (they actively issue badges)

Both APIs provide skill-based filtering and detailed badge metadata. The question is which to integrate first.

## Decision

**Integrate Microsoft Learn Catalog API in Phase B. Integrate Credly API in Phase C.**

Rationale:
1. **Zero external dependencies**: Microsoft Learn API is free and requires no API keys, contracts, or coordination with external teams. Development can begin immediately.
2. **High coverage for technical skills**: Microsoft/Azure certifications are among the most sought-after in EY's technology consulting practice. ~150 certifications cover a significant portion of user needs.
3. **Rich skill metadata**: MS Learn response includes `skills[]` arrays, making relevance matching straightforward.
4. **Direct deep-link URLs**: Every certification has a deterministic URL pattern (`/credentials/certifications/{id}/`).
5. **Credly requires coordination**: Obtaining API credentials requires engagement with EY's Credly enterprise agreement administrators. This coordination is decoupled from development work.

## Consequences

### Positive

- **Immediate progress**: Phase B development proceeds without any external dependencies or procurement.
- **Proven value before investment**: By Phase C, the badge system has demonstrated value with curated + MS Learn data. This justifies the Credly investment.
- **Risk isolation**: Phase C (Credly) is fully optional. If Credly API access cannot be obtained, Phases A+B still deliver significant value.
- **Parallel development**: Phase C and Phase D can develop in parallel since neither depends on the other.

### Negative

- **No EY-specific badges until Phase C**: EY organization badges on Credly are not discoverable via API until Phase C. Curated mappings and skill-specific Credly search URLs (Phase A) partially mitigate this.
- **No AWS/GCP/CompTIA API discovery**: These providers lack public APIs. Coverage depends on the curated catalog until Credly API (which hosts their badges) is available in Phase C.

### Mitigations

- Phase A seeds the curated catalog with AWS (12), GCP (10), CompTIA (15), and PMI (7) certifications with known URLs. These are available immediately.
- Phase A replaces generic Credly links with skill-specific search URLs (`?search={skill}`), providing better UX even without API access.
- Credly API integration in Phase C is designed as a pluggable matcher, adding the `CredlyMatcher` to the matching engine without modifying existing matchers.


---

## 8.3 ADR-003: Additive Schema Changes

*Source: artifacts/design/decisions/ADR-003-additive-schema-changes.md*
*Related: Section 7.8 (Badge System Architecture)*

# ADR-003: Additive Schema Changes with Optional Fields

> **Status**: Accepted
> **Date**: 2026-02-11
> **Decision Makers**: Architect Agent
> **References**: D-PRD-4, D-PRD-7, FR-3.2, FR-4.1

---

## Context

The badge discovery system requires changes to two existing data schemas:

1. **EYResourceSchema** (`backend/app/schemas/skill_progress.py`): Currently has `title`, `url`, `type`, `badge_available`, `description`. Badge integration needs `badge_id`, `issuer`, `image_url`, `difficulty_level`.

2. **RoadmapMilestone** (`backend/app/schemas/roadmap.py`): Currently has `resources: List[str]` (plain strings). Badge integration needs structured certification data alongside resources.

Both schemas are used extensively:
- `EYResourceSchema` data is stored in `skill_modules.ey_resources` (JSONB column) with existing generated content for many users
- `RoadmapMilestone` data is stored in `saved_roadmaps.roadmap_data` (JSONB column) with existing saved roadmaps

A breaking schema change would require migrating all existing JSONB data or cause deserialization errors.

## Decision

**All schema changes are additive: new fields are optional with default values.** Existing data continues to work without modification.

Specifically:

### EYResourceSchema Extensions

```python
class EYResourceSchema(BaseModel):
    # Existing fields (unchanged)
    title: str
    url: str
    type: str
    badge_available: bool = False
    description: str
    # New optional fields
    badge_id: Optional[str] = None
    issuer: Optional[str] = None
    image_url: Optional[str] = None
    difficulty_level: Optional[str] = None
```

### RoadmapMilestone Extensions

```python
class RoadmapMilestone(BaseModel):
    # Existing fields (unchanged)
    resources: List[str] = Field(default=[])
    # New optional field
    certifications: List[MilestoneCertification] = Field(default=[])
```

### Frontend Type Extensions

```typescript
export interface EYResource {
  // Existing fields (unchanged)
  title: string;
  url: string;
  type: string;
  badge_available: boolean;
  description: string;
  // New optional fields
  badge_id?: string;
  issuer?: string;
  image_url?: string;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}
```

## Consequences

### Positive

- **Zero downtime**: No data migration needed. Existing saved roadmaps and learning content work immediately.
- **Backward compatible**: Old API clients that don't send new fields get default values. Old data without new fields deserializes correctly.
- **Incremental adoption**: Frontend can check for new fields with optional chaining (`resource.badge_id?.`) and progressively enhance the UI.
- **No JSONB migration**: The JSONB columns in `skill_modules` and `saved_roadmaps` do not need schema-level changes. New fields are simply present or absent in the JSON.

### Negative

- **Data inconsistency**: Older records lack badge metadata. Some skill modules have rich badge data while others have generic EY resource links.
- **Optional field checks**: Frontend and backend code must handle the absence of new fields gracefully.

### Mitigations

- New content generation (Phase B+) always includes badge data when available. Over time, as users generate new content, coverage improves organically.
- Frontend components degrade gracefully: if `badge_id` is absent, the EY resource renders as before (generic link). If present, it renders with enhanced badge display.
- A background job could optionally re-generate content for existing modules, but this is not required for the initial rollout.


---

## 8.4 ADR-004: Async Badge Loading

*Source: artifacts/design/decisions/ADR-004-async-badge-loading.md*
*Related: Section 7.8 (Badge System Architecture)*

# ADR-004: Async Badge Loading (Non-Blocking UI)

> **Status**: Accepted
> **Date**: 2026-02-11
> **Decision Makers**: Architect Agent
> **References**: D-PRD-5, NFR-1, NFR-2

---

## Context

Badge discovery involves querying the local database, Redis cache, and potentially external APIs (Microsoft Learn, Credly). Response times vary:

| Source | Typical Latency |
|--------|----------------|
| Redis cache hit | < 5ms |
| PostgreSQL query (curated catalog) | 10-50ms |
| Microsoft Learn API | 200-800ms |
| Credly API | 300-1000ms |

The SkillDetailModal currently loads immediately when a user clicks a skill. Adding a synchronous badge discovery call would delay the modal opening by 200-1000ms, degrading the user experience.

Similarly, roadmap generation already takes 30-90 seconds (GPT-5.2 with reasoning). Adding badge discovery to the generation pipeline should not increase this time significantly.

The PRD states: "No badge-related failure should prevent the skill detail modal or roadmap from loading" (NFR-2).

## Decision

**Badge suggestions load asynchronously and never block the primary UI.**

### SkillDetailModal

1. The modal opens immediately with existing data (learning content, EY resources, progress).
2. A separate `BadgeSection` component mounts and triggers `GET /api/badges/discover?skills={skill}`.
3. While loading, a skeleton/shimmer placeholder is shown in the badge section.
4. On success, badge cards animate in.
5. On failure (API error, timeout), the section shows a fallback: "Could not load badge suggestions" with a retry link, or a skill-specific Credly search URL.
6. Impact on modal load time: 0ms (badge load is decoupled).

### Roadmap Generation

1. When `include_certifications=true`, the roadmap service queries `BadgeDiscoveryService.get_badges_for_skills()` before building the prompt.
2. This uses only the curated catalog (fast, no external API calls), adding < 50ms.
3. External API results are not used during roadmap generation -- they are too slow and could timeout.
4. After the roadmap is generated and saved, a background task can optionally enrich certification milestones with additional badge data from APIs.

### Click Tracking

1. Badge click tracking (`POST /api/badges/interactions`) fires asynchronously on click.
2. The user's browser navigates to the badge URL immediately; the tracking request is fire-and-forget.
3. If the tracking request fails, the click is lost but the user experience is unaffected.

## Consequences

### Positive

- **No UX degradation**: Modal load time unchanged. Roadmap generation time unchanged.
- **Resilience**: External API failures never block core features. The UI always loads.
- **Progressive enhancement**: Badge data appears when available, enriching the experience without being required.
- **Meets NFR-1**: Badge discovery impact on skill detail modal < 100ms (0ms for modal itself, badge section loads independently).

### Negative

- **Visual shift**: Badge cards appearing after the modal is open causes a layout shift. Must be handled with reserved space (skeleton) to avoid jarring reflow.
- **Stale data possible**: If the user opens the modal while a cache refresh is in progress, they may see slightly outdated results.
- **Lost tracking events**: Fire-and-forget click tracking may lose events under high failure rates. Acceptable tradeoff for UX.

### Mitigations

- `BadgeSection` reserves vertical space with a fixed-height skeleton to prevent layout shift.
- Cache TTLs (24h for discovery results) ensure data freshness without real-time overhead.
- Click tracking failures are logged server-side for monitoring. A retry mechanism can be added if loss rates exceed 5%.


---

## 8.5 ADR-005: Interaction Tracking

*Source: artifacts/design/decisions/ADR-005-interaction-tracking.md*
*Related: Section 7.8 (Badge System Architecture)*

# ADR-005: Badge Interaction Tracking for ROI Measurement

> **Status**: Accepted
> **Date**: 2026-02-11
> **Decision Makers**: Architect Agent
> **References**: D-G3, D-G4, FR-5.1, FR-5.2, FR-5.3, FR-5.4, FR-5.5

---

## Context

A central goal of the badge discovery system is proving that badge suggestions are useful (D-G3). The current system has **zero tracking** -- there is no data on whether users click badge links, find them relevant, or eventually earn certifications.

Without tracking data, we cannot:
- Measure ROI of the badge system
- Identify which badges are most/least relevant
- Improve suggestion quality over time (D-G4 feedback loop)
- Compare specific badge links vs generic links (A/B test in Phase A)

We need to decide what interactions to track, where to store them, and how to use the data.

## Decision

**Track four interaction types in a dedicated `badge_interactions` table, with an admin analytics endpoint for aggregation.**

### Tracked Interactions

| Type | Trigger | Data Captured | Phase |
|------|---------|---------------|-------|
| `click` | User clicks a badge link (opens in new tab) | user_id, badge_id, source (skill_module/roadmap/search), timestamp | Phase A |
| `earned` | User marks a badge as "Earned" | user_id, badge_id, earned_date (stored in user_badges table) | Phase D |
| `thumbs_up` | User rates a badge suggestion positively | user_id, badge_id, source, timestamp | Phase D |
| `thumbs_down` | User rates a badge suggestion negatively | user_id, badge_id, source, timestamp | Phase D |

### Storage Design

```
badge_interactions table:
  id (UUID PK)
  user_id (FK -> user_profiles)
  badge_id (FK -> badge_catalog)
  interaction_type (click|earned|thumbs_up|thumbs_down)
  source (skill_module|roadmap|search)
  created_at (timestamp)

user_badges table:
  id (UUID PK)
  user_id (FK -> user_profiles)
  badge_id (FK -> badge_catalog)
  earned_date (timestamp)
  self_reported (bool, default true)
  created_at, updated_at
```

### Analytics Endpoint

`GET /api/badges/analytics` returns aggregated metrics:

```json
{
  "total_badges": 75,
  "total_interactions": 1234,
  "click_through_rates": {
    "overall": 0.23,
    "by_source": {
      "skill_module": 0.18,
      "roadmap": 0.31,
      "search": 0.25
    }
  },
  "top_clicked_badges": [...],
  "relevance_ratings": {
    "positive": 892,
    "negative": 134,
    "positive_rate": 0.87
  },
  "flagged_badges": [
    {
      "badge_id": "...",
      "name": "...",
      "negative_rate": 0.65,
      "total_ratings": 52
    }
  ]
}
```

### Flagging Logic (FR-5.5)

Badges with > 60% negative ratings over 50+ total ratings are flagged for review. Flagged badges are surfaced in the analytics endpoint and can be deactivated from the curated catalog.

## Consequences

### Positive

- **ROI measurement**: Click-through rates, completion rates, and relevance ratings provide concrete evidence of badge system value.
- **Continuous improvement**: User feedback identifies low-quality suggestions. Flagging mechanism automates quality control.
- **A/B testing support**: Click tracking in Phase A enables comparison of specific vs. generic badge links.
- **Personalization potential**: Future work can use interaction data to personalize badge rankings (e.g., boost badges similar to ones the user clicked before).

### Negative

- **Storage growth**: Each badge click generates a row. At 100 clicks/day, this is ~36,500 rows/year -- negligible for PostgreSQL.
- **Privacy considerations**: Tracking user interactions with specific badges could raise privacy concerns. Data is only accessible via the admin analytics endpoint, not exposed to other users.
- **Write overhead**: Every badge click triggers a POST request. This is fire-and-forget and does not block the user.

### Mitigations

- Click tracking is asynchronous and fire-and-forget (ADR-004). No impact on user experience.
- Analytics endpoint is admin-only (internal use). User-level interaction data is not exposed in any public API.
- Interaction data can be periodically aggregated and purged (e.g., keep raw data for 12 months, then aggregate to daily summaries).
- The `source` field enables filtering analytics by context (skill module vs roadmap vs search), providing actionable insights.


---

## 8.6 ADR-MM-001: Alembic Migrations

*Source: artifacts/design/decisions/ADR-MM-001-alembic-migrations.md*
*Related: Section 7.10 (Medieval Mode Architecture), Section 3.3 (Medieval Mode PRD)*

# ADR-MM-001: Adopt Alembic for Gamification Schema Migrations

**Status**: Proposed
**Date**: 2026-02-11
**Decision**: D-MM-11

## Context

The SpringAIS backend currently uses `Base.metadata.create_all()` on startup to create database tables. This approach has worked for the initial set of tables but is insufficient for the gamification overhaul because:

1. **11 new tables** are being added, with complex constraints, indexes, and seed data.
2. `create_all()` does not handle schema modifications to existing tables.
3. `create_all()` does not support seed data insertion.
4. There is no rollback mechanism if a deployment fails.
5. Alembic is already listed in `backend/requirements.txt` but has never been initialized.

## Decision

Adopt Alembic for managing all new gamification tables. Existing tables continue to be managed by `create_all()` (no retroactive migration of existing schema).

### Implementation

1. Initialize Alembic in `backend/` with `alembic init alembic`.
2. Configure `alembic/env.py` to use the project's `DATABASE_URL` and `Base.metadata`.
3. Create a single initial migration that:
   - Creates all 11 gamification tables in dependency order.
   - Seeds achievement_catalog (24 rows), cosmetic_catalog (30+ rows), side_quest_catalog (5 rows).
4. Add `alembic upgrade head` to the deployment process (before starting uvicorn).
5. Keep `Base.metadata.create_all()` in `main.py` for existing tables -- it is idempotent and harmless.

### Coexistence Strategy

- Alembic's `target_metadata` includes ALL models (existing + new).
- The `--autogenerate` flag will detect existing tables but we mark them as already created using `op.create_table_if_not_exists` or by excluding them in `env.py` include_object filter.
- Future schema changes (to any table) should use Alembic migrations.

## Consequences

- **Positive**: Versioned, reversible migrations. Seed data is part of the migration. Schema changes are auditable.
- **Positive**: Future developers can run `alembic upgrade head` to get the full schema.
- **Negative**: Two schema management systems coexist temporarily. This is acceptable for the transition period.
- **Negative**: Slightly more complex deployment (run migration before start). Mitigated by adding to entrypoint script.

## Alternatives Considered

1. **Continue with `create_all()` only**: Rejected. Cannot handle seed data, constraints added after initial creation, or rollbacks.
2. **Raw SQL migration scripts**: Rejected. Lacks version tracking, rollback support, and autogenerate capability.
3. **Full Alembic migration of existing tables**: Rejected. Unnecessary risk for tables that are stable and working. Can be done later as a separate project.


---

## 8.7 ADR-MM-002: Redis Progression Cache

*Source: artifacts/design/decisions/ADR-MM-002-redis-progression-cache.md*
*Related: Section 7.10 (Medieval Mode Architecture)*

# ADR-MM-002: Redis Caching for Progression State with DB Fallback

**Status**: Proposed
**Date**: 2026-02-11
**Decision**: D-MM-4

## Context

`GET /api/progression` will be the most frequently called gamification endpoint -- invoked on every page load, by the AdventureHUD, and after every action that triggers rewards. The response aggregates data from `user_progression`, `user_equipped_items`, `user_achievements` (count), and `user_quest_progress` (count). Without caching, this requires multiple DB queries on every request.

Redis is already used in the project for match caching (`backend/app/services/match_cache_service.py`, `backend/app/config.py`).

## Decision

Cache the full progression state in Redis with a 5-minute TTL. Invalidate on any mutation (XP award, Coin change, level-up, equip/unequip, login streak update).

### Cache Strategy

- **Key**: `progression:{user_id}` (string)
- **Value**: JSON blob of the full `ProgressionResponse` data
- **TTL**: 300 seconds (5 minutes)
- **Invalidation**: Explicit `DELETE` after any mutation in `progression_service`

### Read Path

```
1. Check Redis for progression:{user_id}
2. If cache hit: deserialize and return
3. If cache miss or Redis unavailable: query DB, compute derived fields, cache result, return
```

### Write Path

```
1. Perform DB mutation (within transaction)
2. After commit: delete Redis key progression:{user_id}
3. Next read will repopulate the cache
```

### Graceful Degradation

If Redis is unavailable:
- All operations fall back to direct DB queries.
- A warning is logged.
- No user-facing errors.
- Performance degrades but functionality is preserved.

## Consequences

- **Positive**: `GET /api/progression` response time < 100ms (p95) from cache.
- **Positive**: Reduces DB load for the most frequent query.
- **Positive**: Uses existing Redis infrastructure.
- **Negative**: Cache invalidation adds complexity to every mutation method.
- **Negative**: Brief window (between DB commit and cache delete) where stale data could be served. Acceptable for gamification data.

## Alternatives Considered

1. **No caching (DB only)**: Rejected. The progression query joins multiple tables and will be called very frequently.
2. **In-memory cache (Python dict/lru_cache)**: Rejected. Does not survive process restarts. Not shared across multiple workers if scaled.
3. **Write-through cache (update cache on mutation instead of invalidate)**: Considered but rejected for simplicity. Invalidate-on-write is simpler and the read-through rebuild is fast.


---

## 8.8 ADR-MM-003: Sync Achievement Evaluation

*Source: artifacts/design/decisions/ADR-MM-003-sync-achievement-eval.md*
*Related: Section 7.10 (Medieval Mode Architecture)*

# ADR-MM-003: Synchronous In-Process Achievement Evaluation

**Status**: Proposed
**Date**: 2026-02-11

## Context

After a gamification event is recorded (e.g., module_completed), the system needs to check whether any achievements should be unlocked. There are two main approaches:

1. **Synchronous (in-process)**: Evaluate achievements within the same request/transaction that created the event.
2. **Asynchronous (background worker)**: Push the event to a queue and process achievements in a separate worker.

## Decision

Use synchronous in-process evaluation. After every gamification event, `achievement_service.evaluate_achievements()` is called within the same request lifecycle.

### Rationale

1. **Low overhead**: The achievement catalog has ~25 rows. Evaluation is a simple in-memory loop comparing event counts and thresholds. Expected time: < 10ms.
2. **Immediate feedback**: Users see achievement unlock toasts immediately after the triggering action, not seconds later.
3. **Simpler architecture**: No message queue, no background worker, no eventual consistency issues.
4. **Transaction consistency**: Achievement unlock and its XP/Coin rewards are committed in the same transaction as the triggering event.

### Performance Budget

The NFR specifies < 50ms added latency for achievement evaluation. With ~25 achievements and simple conditions:
- In-memory catalog iteration: < 1ms
- DB query for user's current achievement count: < 5ms (indexed)
- Event count queries (for event_based triggers): < 5ms each (indexed)
- Total: well under 50ms budget.

### Error Handling

Achievement evaluation is wrapped in the `reward_hook_service.process_action()` try/except. If it fails, the primary action still succeeds. This matches the fire-and-forget pattern.

## Consequences

- **Positive**: Instant achievement feedback to users.
- **Positive**: Simpler infrastructure (no queue/worker).
- **Positive**: Transactional consistency.
- **Negative**: Adds latency to the triggering request (~10-30ms). Acceptable within budget.
- **Negative**: If the catalog grows to hundreds of achievements, evaluation time may need optimization (pre-filter by event_type, lazy evaluation). Not a concern at ~25 achievements.

## Alternatives Considered

1. **Background worker (Celery/Redis queue)**: Rejected. Adds infrastructure complexity, delayed feedback, eventual consistency. Not warranted for ~25 achievements.
2. **Database trigger**: Rejected. Business logic in SQL is harder to test and maintain.
3. **Lazy evaluation (check only on GET /api/achievements)**: Rejected. Users would not see unlock toasts until they navigate to the achievements page.


---

## 8.9 ADR-MM-004: Coin Balance Locking

*Source: artifacts/design/decisions/ADR-MM-004-coin-balance-locking.md*
*Related: Section 7.10 (Medieval Mode Architecture)*

# ADR-MM-004: SELECT FOR UPDATE for Coin Balance Integrity

**Status**: Proposed
**Date**: 2026-02-11
**Decision**: D-MM-3

## Context

Coin balance mutations (award, spend) must be atomic to prevent:
1. **Race conditions**: Two concurrent requests could both read balance=100, both approve a 75-coin purchase, resulting in balance=-50.
2. **Negative balances**: The business rule requires `coin_balance >= 0` at all times.
3. **Ledger inconsistency**: The `balance_after` in `coin_transactions` must match the actual `coin_balance`.

## Decision

Use `SELECT FOR UPDATE` row-level locking on `user_progression` for all Coin balance mutations.

### Implementation

```python
def spend_coins(self, db: Session, user_id: UUID, amount: int, ...):
    # Acquire row lock
    progression = db.query(UserProgression).filter(
        UserProgression.user_id == user_id
    ).with_for_update().one()

    if progression.coin_balance < amount:
        return SpendCoinsResult(success=False, reason="insufficient_coins")

    progression.coin_balance -= amount

    txn = CoinTransaction(
        user_id=user_id,
        amount=-amount,
        balance_after=progression.coin_balance,
        transaction_type="spent",
        source=source,
        reference_id=reference_id,
    )
    db.add(txn)
    # Lock released on commit
```

### Defense in Depth

Three layers of protection:
1. **Application layer**: `SELECT FOR UPDATE` prevents concurrent reads.
2. **Database constraint**: `CHECK (coin_balance >= 0)` on `user_progression` table catches any bypass.
3. **Transaction ledger**: `CHECK (balance_after >= 0)` on `coin_transactions` table.

### Performance Implications

- Row-level lock scope: Only locks the single user's progression row. Other users are unaffected.
- Lock duration: Held for the duration of the DB transaction (typically < 50ms).
- Contention: Very low. A single user is unlikely to send concurrent coin-spending requests.

## Consequences

- **Positive**: Guarantees balance never goes negative, even under concurrent requests.
- **Positive**: Ledger `balance_after` is always consistent with actual balance.
- **Positive**: Simple implementation using SQLAlchemy's `with_for_update()`.
- **Negative**: Serializes concurrent mutations for the same user. Acceptable because coin mutations are infrequent per-user.

## Alternatives Considered

1. **Optimistic locking (version column)**: Rejected. Requires retry logic on conflict. `SELECT FOR UPDATE` is simpler for this use case.
2. **Database-only constraint (no app lock)**: Rejected. The CHECK constraint would reject the transaction after the fact, requiring error handling. Better to check proactively.
3. **Redis-based distributed lock**: Rejected. Overkill for a single-database system. The DB row lock is sufficient.


---

## 8.10 ADR-MM-005: Linear XP Curve

*Source: artifacts/design/decisions/ADR-MM-005-linear-xp-curve.md*
*Related: Section 7.10 (Medieval Mode Architecture)*

# ADR-MM-005: Linear-Step XP Curve Replacing Exponential

**Status**: Proposed
**Date**: 2026-02-11
**Decision**: D-MM-5

## Context

The current adventure mode uses an exponential XP curve: `xpForLevel(level) = floor(100 * 1.5^(level-1))`.

This produces:
| Level | XP for level | Cumulative XP |
|-------|-------------|---------------|
| 1 | 100 | 0 |
| 5 | 506 | 862 |
| 10 | 3,844 | 7,538 |
| 15 | 29,193 | 58,287 |
| 20 | 221,803 | 443,504 |

At 50 XP per module, reaching level 20 would require completing 8,870 modules -- clearly unreachable.

## Decision

Replace the exponential curve with a linear-step curve:

| Level | Total XP Required | XP for this level | Title |
|-------|-------------------|-------------------|-------|
| 1 | 0 | 100 | Apprentice |
| 2 | 100 | 200 | Apprentice |
| 3 | 300 | 300 | Apprentice |
| 4 | 600 | 400 | Squire |
| 5 | 1,000 | 500 | Squire |
| 6 | 1,500 | 600 | Knight |
| 7 | 2,100 | 700 | Knight |
| 8 | 2,800 | 800 | Warrior |
| 9 | 3,600 | 900 | Warrior |
| 10 | 4,500 | 1,000 | Champion |
| 11+ | 4,500 + (L-10)*1,000 | 1,000 | Master/Grandmaster/Legend |

The pattern: each level from 1-10 requires `level * 100` XP more than the previous. After level 10, the per-level requirement flattens at 1,000 XP.

### Reachability Analysis

At 50 XP per module:
- Level 5 (Squire): 20 modules
- Level 10 (Champion): 90 modules
- Level 15 (Grandmaster): 190 modules
- Level 20 (Legend): 290 modules

With assessments (75 XP), milestones (150 XP), and certifications (300 XP), these numbers are significantly lower. A dedicated user can reach level 10 within a few months and level 20 within a year.

## Consequences

- **Positive**: Levels are achievable. Users see meaningful progress.
- **Positive**: Simple formula, easy to understand and communicate.
- **Positive**: Flat tail (1,000 XP per level after 10) prevents levels from becoming unreachable.
- **Negative**: Existing localStorage XP values are meaningless under the new curve. Mitigated by D-MM-12 (no migration of localStorage data).

## Alternatives Considered

1. **Keep exponential curve with lower base**: Rejected. Any exponential curve eventually becomes unreachable.
2. **Logarithmic curve**: Rejected. Levels get easier over time, which reduces the sense of achievement.
3. **Fixed XP per level (e.g., 500 per level)**: Considered. Simpler but too flat -- no sense of increasing challenge.


---

## 8.11 ADR-MM-006: No LocalStorage Migration

*Source: artifacts/design/decisions/ADR-MM-006-no-localstorage-migration.md*
*Related: Section 7.10 (Medieval Mode Architecture), Section 3.3 (Medieval Mode PRD)*

# ADR-MM-006: No Migration of localStorage Gamification Data

**Status**: Proposed
**Date**: 2026-02-11
**Decision**: D-MM-12

## Context

The current adventure mode stores all gamification state in browser `localStorage` under the key `springais-adventure-mode`. When migrating to server-side storage, we must decide whether to attempt migrating existing localStorage data.

### Problems with localStorage Data

1. **Not per-user**: localStorage is shared across all users on the same browser. User A's data could include progress from User B.
2. **Manipulable**: Anyone can open browser devtools and edit localStorage values. XP, gold, and achievements can be freely inflated.
3. **Incomplete**: Users who cleared browser data have already lost their progression. The data is inherently lossy.
4. **Different schema**: The current XP curve is exponential. The new system uses a linear-step curve. XP values do not translate directly.
5. **Client-side only**: There is no server API to upload localStorage data, so the frontend would need to send a "migration bundle" to a new endpoint -- which the server cannot verify.

### Options

**Option A: Attempt migration**
- Add a temporary `POST /api/progression/migrate` endpoint.
- Frontend reads localStorage and sends the data to the server on first login.
- Server accepts the data with some validation (e.g., cap XP at reasonable levels).
- Delete localStorage after successful migration.

**Option B: Clean start**
- All users start fresh with the new server-side system.
- LocalStorage data is ignored and eventually cleaned up by the frontend.
- No migration endpoint needed.

## Decision

**Option B: Clean start.** No migration of localStorage data.

### Rationale

1. The current data is untrustworthy (not per-user, manipulable, lossy).
2. The XP curve is changing, so existing XP values would need arbitrary re-mapping.
3. The gold system is changing fundamentally (renamed to Coins, new reward sources, new spending destinations). Existing gold balances are meaningless.
4. The achievement system is expanding from 14 to 24+ achievements with different trigger mechanisms.
5. A migration endpoint would require complex validation to prevent abuse (users injecting inflated values).
6. The user impact is low: the current system was broken (data could be lost at any time), and the old gold had no meaningful use beyond gambling.

### User Communication

To soften the transition:
- Consider a one-time "Welcome Back" Coin bonus (e.g., 100 Coins) for users who had adventure mode enabled before the migration. This can be detected by checking if `localStorage.getItem('springais-adventure-mode')` exists.
- The frontend can show a brief message: "Adventure Mode has been upgraded! Your journey begins anew with the new server-backed progression system."

## Consequences

- **Positive**: Simpler implementation. No migration endpoint, no validation logic, no edge cases.
- **Positive**: Eliminates the risk of migrating corrupt or manipulated data.
- **Positive**: Clean baseline for metrics (all users start at 0, making engagement tracking meaningful).
- **Negative**: Users with legitimate progress lose it. Mitigated by the fact that progress was already unreliable and the old gold had no value.
- **Negative**: Some users may be briefly disappointed. Mitigated by the welcome bonus and improved system.

## Alternatives Considered

1. **Full migration with server validation**: Rejected. Cannot validate client-sent data. Adds complexity for untrustworthy data.
2. **Partial migration (only achievements)**: Rejected. Achievement triggers are changing. Would still need validation and the effort is not justified.
3. **Honor system migration (accept whatever the client sends)**: Rejected. Creates a cheating vector on day one of the new anti-cheat system.


---

## 8.12 ADR-MM-007: Cosmetic Equipment Rendering

*Source: artifacts/design/decisions/ADR-MM-007-cosmetic-equipment-rendering.md*
*Related: Section 7.10 (Medieval Mode Architecture)*

# ADR-MM-007: Cosmetic Equipment Rendering Strategy

**Status**: Proposed
**Date**: 2026-02-15
**Decision**: D-CA-007

## Context

The Cedric avatar companion is a 2D pixel-art character (64x64 base) that appears in the bottom-right of the screen. He has 20 different animation states (idle, sitting, sleeping, celebrating, pointing, etc.), each rendered as a horizontal sprite strip with 1-6 frames per animation.

The current architecture (D-CA-002) specifies DOM/CSS layered PNGs for equipment rendering: transparent overlay images stacked on top of the base sprite via `position: absolute` and z-index ordering. `AvatarSprite.tsx` implements this with 8 equipment slots (banner, boots, armor, cape, hairstyle, jewelry, emblem) plus a color palette overlay.

### The Problem

The overlay approach assumes that equipment PNGs are pre-aligned to the base sprite at a specific pose. However, Cedric has **20 distinct animation states** with different body positions:

- **Idle states**: idle (breathing), lookAround (head turns), sitting (legs bent), sleeping (lying down)
- **Reactions**: jumpXP (airborne +6px), celebrateLevelUp (airborne +16px), catchCoin (arms up), holdTrophy (arms extended), victoryPose (arms raised), spinNewItem (rotating), waveHello (arm waving)
- **Contextual**: thinking (hand on chin), reading (holding book), pointing (arm extended), confused (scratching head), excited (bouncing), lookingFar (hand on brow), tracingLines (drawing), lookingUp (head tilted back)

Body-conforming items (armor, boots, capes, hairstyles, jewelry) must align with the character's body in each pose. Creating overlay PNGs for all combinations would require:

- 6 body-conforming categories x ~4 items each x 20 poses = **480 overlay assets**
- Each must be pixel-perfect aligned to the corresponding sprite frame
- Any future animation or item addition multiplies this further

This is impractical for an MVP and likely impractical even at scale for AI-generated pixel art where subtle frame-to-frame alignment is difficult to guarantee.

### Current Cosmetic Inventory

The 36 cosmetic items break down as follows:

| Category | Count | Body-Conforming? | Alignment Difficulty |
|---|---|---|---|
| Armor | 4 | Yes | High -- covers torso, changes shape with poses |
| Boots | 4 | Yes | High -- feet move with sitting, jumping, sleeping |
| Cape | 5 | Yes | High -- drapes behind body, affected by all poses |
| Hairstyle | 5 | Yes | Medium -- head position changes but less dramatically |
| Jewelry | 5 | Yes | Medium-High -- small items on body, hard to see if misaligned |
| Banner | 5 | No | Low -- behind character, fixed position relative to container |
| Emblem | 6 | No | Low -- badge/shield element, can be pinned to fixed position |
| Color Palette | 3 | No | None -- CSS `mix-blend-mode` overlay, works regardless of pose |

**22 items are body-conforming** (require per-pose alignment), **14 items are non-body-conforming** (work with any pose).

### Options Considered

**Option A: Idle-only overlays**
Keep the overlay approach but only render equipment layers when Cedric is in the `idle` animation state. Other poses fall back to the base sprite with no equipment visible.

- Pro: Simple implementation, reuses existing code
- Con: Equipment disappears during most interactions (reactions, loading, walkthrough) -- the moments when users are most likely watching Cedric. Breaks the visual contract: "I equipped golden armor but it vanishes when Cedric jumps"

**Option B: Reclassify cosmetics into body-conforming vs. non-body categories**
Keep items that work without body alignment (color palettes, banners, emblems). Reclassify or remove items that require body alignment (armor, boots, capes, hairstyles, jewelry). Replace them with new non-body items: auras, particles, pets, title plates, frame borders.

- Pro: All cosmetics render correctly in all poses
- Con: Requires reworking 22 of 36 existing catalog items; invalidates the store seed data, pricing tiers, and quest rewards that reference armor/boots/capes; removes the most visually exciting items (golden armor, phoenix cloak, void walkers)

**Option C: AI-generated sprite variants**
Generate complete sprite sheets for every item+pose combination using AI image generation. Each equipped item produces a full 20-pose sprite set where the item is baked into every frame.

- Pro: Highest visual quality, items appear in all poses perfectly
- Con: Requires 22 items x 20 poses x ~3 frames avg = ~1,320 individual sprite frames generated and validated; ongoing cost for new items; inconsistent style between AI batches; asset management complexity

**Option D: Non-body cosmetics only**
Simplify the cosmetic system to only include categories that never need body alignment: color palettes, banners/frames, emblems/badges, and add new non-body categories (aura effects, pedestal styles, title styles, pet companions).

- Pro: Every cosmetic always renders correctly in every pose
- Con: Similar to Option B but more aggressive; removes even more items; store feels less exciting without wearable gear

**Option E: Hybrid -- idle-pose overlays for body items, always-on for non-body items (Recommended)**
Render body-conforming equipment overlays (armor, boots, capes, hairstyles, jewelry) only during idle-family poses where the body position is known and consistent. Render non-body cosmetics (banners, emblems, color palettes) in all poses. Add visual feedback so the transition feels intentional rather than broken.

## Decision

**Option E: Hybrid rendering with idle-pose overlays for body-conforming items.**

### How It Works

1. **Classify each equipment slot as body-conforming or non-body**:

```typescript
const BODY_CONFORMING_SLOTS = new Set(['armor', 'boots', 'cape', 'hairstyle', 'jewelry']);
const ALWAYS_VISIBLE_SLOTS = new Set(['banner', 'emblem', 'color_palette']);
```

2. **Define idle-family poses** where body-conforming overlays are safe to render:

```typescript
const IDLE_FAMILY_POSES = new Set([
  'idle',           // Default standing -- primary equipment display pose
  'lookAround',     // Head turns but body stays same
  'wakeUp',         // Transitional, brief
]);
```

3. **In AvatarSprite.tsx**, conditionally render equipment layers:

```typescript
{EQUIPMENT_LAYERS.filter(({ slot }) => {
  const item = equippedItems[slot];
  if (!item) return false;
  if (ALWAYS_VISIBLE_SLOTS.has(slot)) return true;
  if (BODY_CONFORMING_SLOTS.has(slot)) return IDLE_FAMILY_POSES.has(animationState);
  return true;
}).map(({ slot, zIndex }) => (
  // ... render <img> overlay
))}
```

4. **Smooth transition**: When switching away from an idle-family pose, body-conforming layers fade out over 200ms (CSS `opacity` transition). When returning to idle, they fade back in. This prevents jarring pop-in/pop-out.

```css
.equipment-layer--body-conforming {
  transition: opacity 200ms ease-in-out;
}
.equipment-layer--body-conforming.hidden {
  opacity: 0;
  pointer-events: none;
}
```

5. **Equipment overlays only need to be created for the idle pose** -- a single 64x64 transparent PNG per item, aligned to the default standing position. This means:
   - 22 body-conforming items x 1 pose = **22 overlay assets** (not 480)
   - 5 banners x 1 asset = 5 assets (banners are position-fixed behind the sprite)
   - 6 emblems x 1 asset = 6 assets (emblems are position-fixed on the sprite)
   - 3 color palettes = 0 assets (CSS only)
   - **Total: 33 overlay assets** (same as original plan, no multiplication)

6. **Store preview and Character Sheet always show idle pose**: The 192x192 enlarged avatar in the store page and character sheet popup always renders in idle state, so equipped items are always visible in the "inspection" context where users care most about how their loadout looks.

### Rationale

- **Cedric spends most time in idle-family states.** The inactivity cycle is: idle (0-30s) -> sitting (30s-2min) -> sleeping (2min+). Reactions are brief (0.5-1.5s). During typical usage, Cedric is in idle/lookAround ~70-80% of the time. Body equipment is visible for the majority of the experience.
- **Reactions are brief and attention-grabbing.** When Cedric jumps for XP or catches a coin, the user's attention is on the animation itself, not on whether the armor overlay is pixel-perfect. A brief fade-out during the 0.5s jump animation is unlikely to be noticed.
- **Non-body items stay visible always.** Banners behind the character, emblems pinned to a fixed position, and color palette tints all render regardless of pose. Users always see some customization.
- **The store/character sheet shows full equipment.** The moments where users deliberately inspect their loadout (store page, character sheet) always use idle pose, so all items are visible.
- **Asset cost stays at O(N items) not O(N items x M poses).** Adding a new cosmetic item requires exactly one overlay PNG, not 20.
- **No catalog rework needed.** All 36 existing cosmetic items remain in the catalog. No renaming, re-pricing, or removal.
- **No external dependencies.** Pure CSS transitions handle the show/hide. No canvas rendering, no PixiJS, no AI generation pipeline.
- **Forward-compatible.** If in the future specific high-value items (e.g., legendary armor) warrant per-pose overlays, they can be added incrementally. The system checks for pose-specific assets first, falls back to idle-only.

### Future Enhancement Path

For high-priority items, the system can be extended to support per-pose overlays:

```
equipment/armor/golden-armor.png           # Default (idle) overlay
equipment/armor/golden-armor--sitting.png  # Optional: sitting pose overlay
equipment/armor/golden-armor--sleeping.png # Optional: sleeping pose overlay
```

Asset resolution logic:
```typescript
function getEquipmentAssetPath(category: string, itemName: string, pose?: string): string {
  const slug = itemName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (pose) {
    // Try pose-specific asset first
    return `/assets/cedric/equipment/${category}/${slug}--${pose}.png`;
  }
  return `/assets/cedric/equipment/${category}/${slug}.png`;
}
```

The existing `onError` handler already hides missing images, so pose-specific assets are a graceful enhancement that degrades to idle-only when not available. This can be done selectively for high-rarity or heavily-promoted items without requiring a full sprite matrix.

## Consequences

- **Positive**: All 36 cosmetic items remain viable with a manageable asset budget (33 PNGs).
- **Positive**: Equipment is visible during the majority of user interaction time (idle states).
- **Positive**: No catalog data changes, no seed data rework, no pricing rebalance needed.
- **Positive**: Simple implementation: one `Set` lookup + CSS opacity transition in `AvatarSprite.tsx`.
- **Positive**: Forward-compatible with per-pose overlays for specific items if justified later.
- **Negative**: Body-conforming equipment is not visible during reactions and contextual states (sitting, sleeping, thinking, etc.). Mitigated by fade transitions and the brevity of most non-idle states.
- **Negative**: Users in sitting/sleeping states for extended periods (AFK) will not see their armor. Mitigated by the fact that AFK users are not actively looking at the screen, and the character sheet is always available for inspection.

## Alternatives Rejected

1. **Option A (Idle-only, no transition)**: Rejected because abrupt show/hide is visually jarring. The fade transition in Option E solves this.
2. **Option B (Reclassify catalog)**: Rejected because it removes the most exciting items and requires significant rework to seed data, pricing, and quest rewards.
3. **Option C (AI-generated variants)**: Rejected because of the 1,300+ asset generation requirement, ongoing AI costs, and style consistency risk. May be revisited for a future "premium" tier.
4. **Option D (Non-body only)**: Rejected because it is too aggressive -- removes 22 of 36 items and makes the store less compelling.


---

# 9. Technology Stack

## 9.1 Technology Stack Document

*Source: _bmad-output/tech-stack.md*

# SpringAIS Technical Stack Documentation

**Last Updated:** 2026-01-02
**Status:** MVP Architecture - Competition Demo
**Total Infrastructure Cost:** $0/month

---

## Executive Summary

SpringAIS leverages **free-tier services and local development** to minimize costs while maintaining demo-ready capabilities. This stack is optimized for an **8-week competition timeline** with local demo deployment (no cloud hosting required).

**Key Principle:** Only code what we HAVE to. Use open-source frameworks, free APIs, and local infrastructure for everything else.

**Key Architectural Decision:** Run demo locally on laptops during judging - no cloud hosting needed. This is MORE impressive (judges see it work in real-time) and costs $0.

---

## Infrastructure Services (All Free)

### Core Services

| Service | Purpose | Development | Demo/Production | Cost |
|---------|---------|-------------|-----------------|------|
| **PostgreSQL + pgvector** | Main database + vector embeddings | Docker local | Docker local or Supabase (optional) | $0 |
| **Redis** | Session cache, skill embedding cache, LLM response cache | Docker local | Docker local or Upstash (optional) | $0 |
| **File Storage** | Resume/document uploads | Local filesystem or Supabase | Local filesystem | $0 |
| **Authentication** | User auth for demo | Simple JWT or Supabase Auth | Simple JWT | $0 |
| **Backend** | FastAPI application | uvicorn locally | uvicorn locally | $0 |
| **Frontend** | React application | Vite dev server | Vite build (static) | $0 |

**Development & Demo Strategy:**
- **Everything runs locally** in Docker Compose
- **No cloud dependencies** for demo
- **Optional Supabase** if you want free cloud hosting later (not required for competition)
- **Git-based database sharing** for team collaboration

### Why Local-First Architecture?

- **$0 cost** - No monthly hosting bills
- **Demo reliability** - No "server is down" moments during judging
- **Fast iteration** - No deployment delays
- **Portable** - Runs on any laptop with Docker
- **Impressive** - Judges see real-time execution, not a hosted demo
- **Team collaboration** - Git-based SQL dumps for data sharing

---

## External Free Services & APIs

| Service | Purpose | Why Use It | Cost |
|---------|---------|------------|------|
| **O\*NET API** | Skills taxonomy (39K+ skills, occupations, relationships) | Free, comprehensive, saves 2-3 weeks | $0 |
| **OpenAI API** | Skill extraction, validation, embeddings | Direct API access | Pay-per-use |
| **React Flow** | Career path visualization, skill trees | Free open-source, saves 3-4 days | $0 |

---

## Technology Stack Details

### Backend Stack

**Framework:**
- **FastAPI** (Python 3.11+) - Async REST API framework
  - Auto-generates OpenAPI 3.0 docs
  - Pydantic validation
  - WebSocket support for real-time notifications (optional)
  - Runs locally via uvicorn

**Database:**
- **PostgreSQL 16** with **pgvector extension**
  - Structured data (employees, roles, matches, audit logs)
  - Vector embeddings storage (3072-D vectors from text-embedding-3-large)
  - Unified database (no separate vector DB needed)
  - Runs in Docker locally
  - **Why pgvector:**
    - Single database for all data
    - Excellent semantic search performance
    - Easier to maintain than separate vector DB
    - Industry standard for vector similarity search

**Caching:**
- **Redis** (via `redis-py`)
  - **LangChain Semantic Cache** - Similar prompts → cached LLM responses (68.8% API reduction target)
  - **Redis Direct Cache** - Exact matches for:
    - Skill extraction results (7 days TTL)
    - Embeddings (indefinite TTL)
    - O\*NET API responses (24 hours TTL)
    - Session data (15 minutes TTL)
  - Runs in Docker locally

**LLM Integration:**
- **OpenAI SDK** - Direct API calls for:
  - **GPT-5.2 Instant:** Real-time skill extraction during demo (user uploads)
  - **GPT-5.2 Instant:** User-facing text generation (match explanations, gap analysis)
  - **GPT-5 Nano:** Synthetic data generation (one-time, offline)
  - **text-embedding-3-large:** Skill embeddings for vector search
- **LangChain** - LLM orchestration, prompt management, semantic caching
- **tiktoken** - Accurate token counting for cost estimation

**File Storage:**
- **Local Filesystem** - Resume/document uploads stored locally
- **Optional: Supabase Storage** - If you want cloud storage later (1GB free)

**Document Processing:**
- **PyPDF2** or **pdfplumber** - PDF text extraction
- **python-docx** - Word document parsing

**Authentication:**
- **JWT tokens** - Simple auth for demo
- **Optional: Supabase Auth** - If you want full auth later (includes SSO support)

**Background Jobs:**
- **FastAPI BackgroundTasks** - Async skill extraction processing (inline)
- Simple for MVP, no separate job queue needed

**Monitoring & Logging:**
- **structlog** - Structured JSON logging
- **Optional: Sentry** - Error tracking (free tier: 5K events/month)

**Secrets Management:**
- **Environment variables** - .env file (gitignored)
- **Optional: Azure Key Vault** - If you deploy to production later

### Frontend Stack

**Framework:**
- **React 18+** with **TypeScript**
- **Vite** - Build tool and dev server (fast, modern)

**UI Components:**
- **shadcn/ui** - Professional component library
  - Built on Radix UI primitives
  - Tailwind CSS styling
  - Accessible by default

**Visualization:**
- **React Flow** - Career path visualization, skill trees
  - Interactive node graphs
  - Custom node/edge rendering
  - Shows career progression paths

**Charts & Analytics:**
- **Recharts** - Dashboard visualizations
  - Success pattern charts
  - Match statistics
  - Career competitiveness metrics

**HTTP Client:**
- **Axios** - API communication with FastAPI backend
- **openapi-typescript** - TypeScript types generated from FastAPI OpenAPI spec

**State Management:**
- **React Query (TanStack Query)** - Server state management, caching
- **Zustand** (optional) - Client state management if needed

---

## Vector Search Architecture

### Why Vectorization is Critical

SpringAIS's core value proposition depends on **semantic matching**, not keyword matching:

**Without Vectors (Keyword Matching):**
```
User has: ["AWS", "Docker", "CI/CD"]
Role requires: ["Cloud Infrastructure", "Containerization", "DevOps"]
→ 0% keyword match ❌ (same concepts, different words)
```

**With Vectors (Semantic Matching):**
```
User skills embedded: [0.23, 0.84, 0.12, ...] (3072-D)
Role requirements embedded: [0.25, 0.81, 0.15, ...] (3072-D)
→ Cosine similarity: 0.92 ✅ (semantically similar!)
```

**Key Use Cases:**
1. **Cross-functional discovery:** Tax accountant discovers Consulting opportunities
2. **Synonym handling:** "Python programming" matches "Python development"
3. **Skill relationship understanding:** "Data Analysis" similar to "SQL, Tableau, Excel"
4. **Hidden opportunity discovery:** Core PRD differentiator

### Matching Architecture (Hybrid Option C)

```
User uploads resume
  ↓
Extract skills (GPT-5.2 Instant, ~$0.02)
  ↓
Generate embeddings (text-embedding-3-large, ~$0.0001)
  ↓
Vector similarity search in pgvector
  ├─ Search against ~25 role types
  └─ Search against current job postings
  ↓
Top 10 matches (sorted by cosine similarity)
  ↓
For each match:
  ├─ IF job posting exists:
  │    ├─ Show job requirements (PRIMARY)
  │    └─ Add success patterns (AUGMENTATION)
  │        "92% of Senior Analysts also have Excel (not in posting!)"
  │
  └─ ELSE (no job posting):
       └─ Show success patterns only (PRIMARY)
           "Based on 47 current Senior Analysts..."
  ↓
Display ranked opportunities to user
```

**No ML ranking needed for MVP** - Vector cosine similarity is sufficient with ~25 role types. ML ranking can be added later when job posting database grows to 100+ entries.

### Embedding Strategy

**What gets embedded:**
1. **Role requirements** (~25 role types × 10 skills = ~250 skill mentions)
2. **Job posting requirements** (~30-50 postings × 10 skills = ~300-500 skill mentions)
3. **Unique skills** (total ~1,000-1,500 unique skills after deduplication)

**Embedding process:**
```python
# 1. Extract unique skills from all sources
unique_skills = set()
for employee in employees:
    unique_skills.update(employee.skills)
for job in job_postings:
    unique_skills.update(job.required_skills)

# 2. Embed each unique skill once
embeddings = {}
for skill in unique_skills:
    embedding = openai.embeddings.create(
        model="text-embedding-3-large",
        input=skill
    )
    embeddings[skill] = embedding.data[0].embedding

# 3. Cache in Redis indefinitely
redis.set(f"embedding:{skill}", embedding, ex=None)
```

**Cost:** ~$0.003 total for all embeddings (one-time)

**Pre-caching strategy:**
- Embed all role requirement skills during setup
- Embed all job posting skills when scraped
- Embed user skills on-demand (cache after first use)
- Common skills pre-cached: ~250 most common EY skills

---

## Caching Strategy (Multi-Layer)

### Layer 1: LangChain Semantic Cache

**Purpose:** Cache LLM responses based on semantic similarity (not exact matches)

**What it caches:**
- LLM prompt → response pairs
- Uses embedding similarity (cosine similarity > 0.95)
- Handles prompt variations automatically

**Benefits:**
- 68.8% API call reduction target (per PRD)
- Handles similar prompts without exact match
- Reduces LLM costs significantly

**Example:**
```
Prompt A: "Extract skills from: 'I built Python APIs'"
Prompt B: "Extract skills from: 'Developed Python REST APIs'"
→ LangChain sees these as similar
→ Returns cached response from Prompt A
```

### Layer 2: Redis Exact Match Cache

**Purpose:** Fast lookups for identical requests

**What it caches:**

1. **Skill Extraction Results** (7 days TTL)
   - Key: `skill_extraction:{resume_hash}`
   - Value: Extracted skills with confidence scores

2. **Embeddings** (Indefinite TTL)
   - Key: `embedding:{skill_name}`
   - Value: 3072-D vector from text-embedding-3-large
   - Pre-cached: ~250 common EY skills

3. **O\*NET API Responses** (24 hours TTL)
   - Key: `onet_api:{endpoint}:{params}`
   - Value: API response JSON

4. **Session Data** (15 minutes TTL)
   - Key: `session:{user_id}`
   - Value: User session data

**Benefits:**
- O(1) lookup time
- Prevents redundant API calls
- Instant responses for cached data

---

## Synthetic Data Strategy

### Purpose of Synthetic Data

**Synthetic employees are NOT just test data** - they are the **source of success pattern analysis**:

```
User: "I want to become a Senior Analyst"

System analyzes 47 synthetic Senior Analysts:
- Common skills: SQL (95%), Python (87%), Excel (92%), Tableau (78%)
- Avg performance: 82% utilization, 4.1 client satisfaction
- Avg experience: 4.2 years
- Typical path: Staff (2y) → Senior (3y) → Senior Analyst
- Common feedback: "strong analytical skills", "proactive communication"

Shows user: "You have SQL & Python ✅, but need to develop Excel & Tableau skills.
             Current Senior Analysts average 82% utilization (you: 78% - close!)
             Typical timeline: 4.2 years experience (you: 3.5 years - on track)"
```

**This is the core differentiator:** Show what ACTUALLY drives advancement, not just job posting requirements.

### EY Organizational Structure (3 Service Lines)

**Distribution of 900 synthetic employees:**

1. **Assurance** (300 employees, 33%)
   - Roles: Staff → Senior → Manager → Senior Manager → Partner
   - Core skills: Accounting, Audit, GAAP, Financial Reporting, Risk Assessment
   - Focus areas (30% of employees): Audit, Financial Reporting, Risk & Compliance, SEC Reporting, Internal Controls, Fraud Investigation

2. **Tax** (300 employees, 33%)
   - Roles: Staff → Senior → Manager → Senior Manager → Partner
   - Core skills: Tax Law, Tax Planning, Compliance, Research, Excel
   - Focus areas (30% of employees): Corporate Tax, International Tax, Transfer Pricing, M&A Tax, Tax Technology, SALT, Estate Planning

3. **Consulting** (300 employees, 34%)
   - Roles: Analyst → Associate → Senior Associate → Consultant → Senior Consultant → Manager → Senior Manager → Director → Partner
   - Core skills: Strategy, Client Management, Project Management, Stakeholder Management
   - Focus areas (30% of employees):
     - **Technology:** Cloud & Infrastructure, Data & Analytics, Cybersecurity, AI & Machine Learning
     - **Business:** Strategy, Operations, Finance Transformation, Supply Chain, HR & Workforce, Customer Experience

**Total role types:** ~25 (5 roles × 3 service lines, with some variation in Consulting)

### Hybrid Data Generation Approach

**What gets hard-coded ($0, deterministic):**
- Role titles and hierarchy per service line
- Core required skills per role (from scraped job postings / O*NET)
- Years of experience ranges per role level
- Base performance metric ranges per role level

**What LLM generates (~$2 total):**
- **GPT-5 Nano:** Individual employee performance metric variation
- **GPT-5 Nano:** Career progression history (previous roles, durations)
- **GPT-5 Nano:** Soft skills (3-6 per person, varied)
- **GPT-5.2 Instant:** Feedback themes (realistic peer feedback text - user-facing)
- **GPT-5.2 Instant:** Notable achievements (1-2 sentences per person)

**Benefits of hybrid approach:**
- 80% cost reduction vs. full LLM generation
- Guaranteed data quality (core skills always correct)
- Realistic variation where it matters (metrics, feedback)
- LLM focuses on what it's good at (text generation, variation)

### Data Quality Validation

**Multi-layer validation ensures realism:**

1. **Role distribution validation**
   - Check pyramid structure (more junior, fewer senior)
   - Assurance: 60 Staff, 90 Senior, 80 Manager, 50 Sr Manager, 20 Partner

2. **Performance metric correlation**
   - Higher roles should have higher average performance
   - Partners: avg 4.5 client satisfaction vs Analysts: avg 3.8

3. **Career progression realism**
   - No impossible jumps (Staff → Partner in 2 years)
   - Minimum time in role enforced (2 years typical)
   - Progression follows service line tracks

4. **Skill distribution realism**
   - Core skills present in 90-100% of role holders
   - Common skills present in 60-80% of role holders
   - Specialization skills present in 20-40% of role holders

5. **No impossible patterns**
   - Junior roles can't have 10+ years experience
   - Can't have more mentees than years of experience
   - All skills must exist in O*NET taxonomy

---

## Job Posting Strategy

### Scraping & Storage

**Source:** EY public careers page (legal, publicly available)

**Scraping frequency:**
- Initial: Scrape all current openings (~30-50 postings)
- Ongoing: Weekly or daily scraping to capture new postings
- Archive closed postings (historical data is valuable)

**What we extract:**
```python
job_posting = {
    "id": "uuid",
    "title": "Senior Analyst - Assurance",
    "service_line": "Assurance",
    "location": "New York, NY",
    "posted_date": "2026-01-02",
    "closed_date": None,  # Still open
    "required_skills": ["Accounting", "Audit", "GAAP", "Excel", "CPA"],
    "preferred_skills": ["SEC Reporting", "SOX Compliance"],
    "years_experience": "3-5 years",
    "description": "Full posting text...",
    "posting_url": "https://careers.ey.com/...",
}
```

**Storage:** PostgreSQL table with full-text search capabilities

**Growth over time:**
- Week 1: ~30-50 postings
- Month 3: ~100-150 postings (includes archived)
- Month 6: ~300+ postings (comprehensive historical archive)

### Priority: Job Postings First, Success Patterns Second

**When job posting exists:**
```
Show user:
  PRIMARY: Job posting requirements
    "Senior Analyst - Assurance requires: CPA, 3-5 years audit experience,
     GAAP expertise, Excel proficiency"

  AUGMENTATION: Success pattern insights
    "Additional insights from 47 current Senior Analysts:
     - 92% also have Excel (confirmed ✅)
     - 78% have strong communication skills (not in posting!)
     - Average 4.2 years experience (you: 3.5 years - on track)
     - Common feedback: 'detail-oriented', 'client-focused'"
```

**When no job posting exists:**
```
Show user:
  PRIMARY: Success pattern analysis
    "Senior Analyst - Assurance (based on 47 current employees):
     - Common skills: Accounting (100%), Audit (98%), GAAP (95%),
       Excel (92%), CPA (87%)
     - Avg experience: 4.2 years
     - Performance: 82% utilization, 4.1 client satisfaction
     - Typical path: Staff (2y) → Senior (3y) → Senior Analyst"
```

**Fallback hierarchy:**
1. Real job posting (if available) → PRIMARY
2. Success patterns from synthetic employees → AUGMENTATION or PRIMARY
3. O*NET occupation profile → FALLBACK if no synthetic data for role
4. LLM inference from role title → LAST RESORT ($0.001 per role)

---

## Development Environment

### Local Development Setup

**Prerequisites:**
- Docker Desktop installed
- Python 3.11+
- Node.js 18+
- Git

**Docker Compose Services:**

```yaml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: springais
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./data:/data  # For SQL dumps

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    command: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    volumes:
      - ./backend:/app
      - ./uploads:/app/uploads  # Resume uploads
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/springais
      - REDIS_URL=redis://redis:6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ONET_API_KEY=${ONET_API_KEY}
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    command: npm run dev -- --host
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:8000

volumes:
  postgres_data:
  redis_data:
```

**Environment Variables (.env file):**

```bash
# OpenAI API
OPENAI_API_KEY=your-openai-key

# O*NET API (free registration)
ONET_API_KEY=your-onet-key

# Database (local)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/springais
REDIS_URL=redis://localhost:6379

# Optional: Supabase (if using cloud features)
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
```

**Start Command:**

```bash
# Start all services
docker-compose up

# Access points:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8000
# - API Docs: http://localhost:8000/docs
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
```

---

## Database Sharing Strategy (Git-Based)

### Team Collaboration Workflow

**Problem:** 4 team members need access to same synthetic employee database

**Solution:** Git-based SQL dump sharing (branch strategy)

**Setup:**

```bash
# 1. Create dedicated branch for data dumps (do this once)
git checkout -b data-dumps
git push -u origin data-dumps

# This branch is ONLY for SQL dumps, never merged to main
# Prevents merge conflicts with application code
```

**Workflow for data generator (one person):**

```bash
# 1. Generate synthetic data
python scripts/generate_synthetic_data.py

# 2. Dump database to SQL file
pg_dump -h localhost -U postgres springais > data/synthetic_employees.sql

# 3. Commit to data-dumps branch
git checkout data-dumps
git add data/synthetic_employees.sql
git commit -m "Generate 900 synthetic employees - $(date +%Y-%m-%d)"
git push origin data-dumps

# 4. Back to your working branch
git checkout main
```

**Workflow for teammates (load data):**

```bash
# 1. Pull latest data dump
git fetch origin
git checkout data-dumps
git pull origin data-dumps

# 2. Load data into local database
psql -h localhost -U postgres springais < data/synthetic_employees.sql

# 3. Back to your working branch
git checkout main

# You now have the same data as the rest of the team!
```

**Benefits:**
- ✅ Single source of truth (one person generates data)
- ✅ Version controlled (can revert to previous data versions)
- ✅ No merge conflicts (separate branch)
- ✅ Works offline (everyone has local copy)
- ✅ Simple (just SQL dump/restore)

**Notes:**
- SQL dump size: ~10-50MB for 900 employees (acceptable for git)
- Private repo recommended (synthetic data stays internal)
- Regenerate data as needed (update SQL dump on data-dumps branch)

---

## What We DON'T Build (Use Services/Libraries Instead)

| Component | Solution | Time Saved | Cost |
|-----------|----------|------------|------|
| **Skills Taxonomy** | O\*NET API | 2-3 weeks | $0 |
| **Vector Storage + Search** | pgvector | 1-2 weeks | $0 |
| **PDF Parsing** | pdfplumber | 2-3 days | $0 |
| **Graph Visualization** | React Flow | 3-4 days | $0 |
| **Token Counting** | tiktoken | 0.5 days | $0 |
| **Auth (optional)** | Supabase Auth | 1-2 weeks | $0 |

**Total Time Saved: ~4-6 weeks**

---

## What We Code By Hand

### Backend Components

| Component | Description | Complexity | Est. Time |
|-----------|-------------|------------|-----------|
| **API Routes** | REST endpoints for all features | Medium | 3-4 days |
| **Database Models** | SQLAlchemy/SQLModel schemas | Low | 1 day |
| **Skill Extraction Pipeline** | LLM prompts + O\*NET mapping + validation | Medium | 3-4 days |
| **Matching Algorithm** | pgvector queries + scoring logic | Medium | 3-4 days |
| **Success Pattern Analysis** | Query synthetic employees, calculate metrics | Medium | 2-3 days |
| **Gap Analysis** | Compare user skills vs target role | Low | 1 day |
| **Job Posting Scraper** | BeautifulSoup scraper for EY careers | Low | 1-2 days |
| **Data Generation Script** | Hybrid LLM + hard-coded approach | Medium | 2-3 days |

### Frontend Components

| Component | Description | Complexity | Est. Time |
|-----------|-------------|------------|-----------|
| **Auth Flow UI** | Login/logout | Low | 0.5 days |
| **Profile Upload/Display** | Resume upload, extracted skills view | Medium | 1-2 days |
| **Skill Confidence UI** | Show skills with evidence, confidence | Medium | 1 day |
| **Opportunity Search** | Filters, search interface | Medium | 2 days |
| **Match Results Display** | Cards with match scores, skill gaps | Medium | 1-2 days |
| **Career Journey Map** | React Flow integration | Medium | 3-4 days |
| **Success Patterns Overlay** | Charts showing advancement patterns | Medium | 1-2 days |
| **Gap Analysis View** | What skills are missing, how to get them | Low | 1 day |

### Integration Code

| Component | Description | Complexity | Est. Time |
|-----------|-------------|------------|-----------|
| **O\*NET Client** | API wrapper for skills/occupations | Low | 0.5 days |
| **LLM Service** | Abstraction for skill extraction calls | Low | 0.5 days |
| **Embedding Service** | Generate + cache embeddings | Low | 0.5 days |
| **Vector Search Service** | pgvector similarity queries | Low | 1 day |

---

## Performance Targets

### Response Times (Per PRD)

| Operation | Target | Notes |
|-----------|--------|-------|
| Uncached skill inference | <15s | Full GPT-5.2 Instant extraction pipeline |
| Cached skill inference | <3s | Semantic cache hit |
| Role matching queries | <2s | pgvector similarity search |
| Career Journey Map render | <3s | React Flow visualization |

### Caching Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Semantic cache hit rate | >60% | LangChain semantic caching |
| Embedding cache hit rate | >80% | Pre-cached common skills |
| O\*NET API cache hit rate | >90% | Aggressive caching (24h TTL) |

---

## Cost Breakdown

### One-Time Setup Costs

| Task | Model | Cost |
|------|-------|------|
| **Generate 900 synthetic employees (metrics)** | GPT-5 Nano | ~$0.04 |
| **Generate 900 synthetic employees (feedback text)** | GPT-5.2 Instant | ~$1.50 |
| **Embed all unique skills** | text-embedding-3-large | ~$0.003 |
| **Role requirement inference (if needed)** | GPT-5.2 Instant | ~$0.05 |
| **TOTAL ONE-TIME SETUP** | | **~$2** |

### Runtime Costs (Per Demo)

| Task | Model | Cost Per Use |
|------|-------|--------------|
| **Extract skills from resume** | GPT-5.2 Instant | ~$0.02 |
| **Generate embeddings for new skills** | text-embedding-3-large | ~$0.0001 |
| **Match explanations (optional)** | GPT-5.2 Instant | ~$0.01 |

**Demo scenario:**
- 50 test resumes during judging
- 50 × $0.02 = **$1 total runtime cost**

### Total Project Cost

**8-Week Competition:**
- Setup: ~$2
- Demo runtime: ~$1
- **TOTAL: ~$3**

**Monthly Infrastructure:**
- PostgreSQL: $0 (Docker local)
- Redis: $0 (Docker local)
- Hosting: $0 (runs on laptop)
- **TOTAL: $0/month**

---

## Development Timeline

### Phase 1: Foundation (Week 1)
- Docker Compose setup
- FastAPI skeleton + PostgreSQL schema
- React app + shadcn/ui
- Basic auth (JWT or skip for demo)
- **Deliverable:** `docker-compose up` works

### Phase 2: Data Generation (Week 2)
- Role template definitions (3 service lines)
- Hybrid data generation script (hard-coded + LLM)
- O\*NET API integration
- Generate 900 synthetic employees
- Database validation and SQL dump
- **Deliverable:** Realistic employee database ready

### Phase 3: Skill Extraction Pipeline (Week 3)
- OpenAI API integration
- Resume upload and parsing
- Skill extraction with GPT-5.2 Instant
- Embedding generation
- Caching layer (Redis)
- **Deliverable:** Upload resume → extracted skills

### Phase 4: Matching Engine (Week 4)
- pgvector similarity queries
- Vector search against role types
- Vector search against job postings
- Match scoring and ranking
- Success pattern aggregation from synthetic employees
- **Deliverable:** Top 10 role matches

### Phase 5: Success Pattern Analysis (Week 5)
- Query synthetic employees by role
- Calculate aggregate metrics (skills, performance, timelines)
- Gap analysis (user vs. success patterns)
- Career path progression analysis
- **Deliverable:** "What do successful Senior Analysts look like?"

### Phase 6: Visualization (Week 6)
- React Flow career path map
- Success pattern charts (Recharts)
- Match results cards
- Skill gap visualization
- **Deliverable:** Visual career journey and insights

### Phase 7: Job Posting Integration (Week 7)
- EY careers page scraper
- Job posting parser and storage
- Priority display logic (posting > success patterns)
- Weekly scraping automation
- **Deliverable:** Real job postings integrated with success patterns

### Phase 8: Polish & Testing (Week 8)
- UI polish and animations
- Edge case handling
- Demo data preparation
- Performance optimization
- Practice demo presentations
- **Deliverable:** Competition-ready demo

**Total: 8 weeks**

---

## Key Architectural Decisions

### 1. Local-First, No Cloud Hosting

**Decision:** Run demo locally on laptops during judging

**Rationale:**
- Zero infrastructure costs
- More impressive (real-time execution)
- No reliability concerns ("server down" during demo)
- Faster iteration (no deployment delays)
- Easy team collaboration (git-based data sharing)

### 2. pgvector for Vector Search

**Decision:** Use PostgreSQL pgvector extension (not separate vector DB)

**Rationale:**
- Unified database for all data
- Excellent performance for <10K roles
- Easier to maintain (one database)
- Industry standard, well-documented
- Free, open-source

### 3. Hybrid Data Generation (Hard-coded + LLM)

**Decision:** Hard-code deterministic data, use LLM for variation

**Rationale:**
- 80% cost reduction vs. full LLM generation
- Guaranteed correctness of core requirements
- Realistic variation where it matters
- Faster generation (less API calls)
- Better control over data quality

### 4. No ML Ranking for MVP

**Decision:** Use vector cosine similarity only (no trained ML model)

**Rationale:**
- Only ~25 role types to rank (too few for ML benefit)
- Vector similarity performs well at this scale
- Saves 3-5 days development time
- Can add ML later when job posting DB grows to 100+

### 5. Three Service Lines (Multi-Track)

**Decision:** Model Assurance, Tax, and Consulting separately

**Rationale:**
- Shows cross-functional mobility (differentiator)
- Reflects EY's actual structure
- More impressive demo scenarios
- Better represents talent mobility problem
- Same cost as single track

### 6. Job Postings as Primary (When Available)

**Decision:** Job posting requirements override success patterns when both exist

**Rationale:**
- Job postings are ground truth
- Success patterns add hidden insights
- System gracefully degrades without postings
- Supports growing posting database over time

---

## References

- [PostgreSQL](https://www.postgresql.org/) - Open-source relational database
- [pgvector](https://github.com/pgvector/pgvector) - PostgreSQL vector extension
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React](https://react.dev/) - Frontend JavaScript library
- [OpenAI API](https://platform.openai.com/) - LLM and embedding APIs
- [O\*NET API](https://www.onetcenter.org/web-services.html) - Skills taxonomy API
- [React Flow](https://reactflow.dev/) - Node graph visualization
- [shadcn/ui](https://ui.shadcn.com/) - React component library
- [LangChain](https://python.langchain.com/) - LLM orchestration framework
- [tiktoken](https://github.com/openai/tiktoken) - Token counting library
- [Supabase](https://supabase.com/) - Optional: PostgreSQL hosting (free tier)
- [Upstash](https://upstash.com/) - Optional: Redis hosting (free tier)

---

## Document History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-12-23 | 1.0 | Initial tech stack documentation | Clays |
| 2026-01-02 | 2.0 | Complete architecture overhaul: local-first, multi-track service lines, hybrid data generation, vector-only matching | Clays |


---

## 9.2 Docker Compose Configuration

*Source: docker-compose.yml*

The following is the complete Docker Compose configuration that defines the multi-service deployment topology for SpringAIS.

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg16
    container_name: springais-postgres
    environment:
      POSTGRES_DB: springais
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./data:/data
      - ./docker/postgres-init:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M

  redis:
    image: redis:7-alpine
    container_name: springais-redis
    ports:
      - "6380:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.25'
          memory: 128M

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: springais-backend
    command: uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
    volumes:
      - ./backend:/app
      - ./uploads:/app/uploads
      - ./scripts:/app/scripts
      - ./data:/app/data
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgresql+psycopg://postgres:postgres@postgres:5432/springais
      - REDIS_URL=redis://redis:6379/0
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ONET_API_KEY=${ONET_API_KEY}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - JWT_ALGORITHM=${JWT_ALGORITHM:-HS256}
      - ACCESS_TOKEN_EXPIRE_DAYS=${ACCESS_TOKEN_EXPIRE_DAYS:-7}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: springais-frontend
    command: npm run dev -- --host
    volumes:
      - ./frontend:/app
      - frontend_node_modules:/app/node_modules
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:8080
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M

  ey_scraper:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: springais-ey-scraper
    profiles: ["scraper"]
    working_dir: /repo
    entrypoint: ["python", "scripts/scrape_ey_jobs.py"]
    volumes:
      - ./:/repo
    environment:
      - DATABASE_URL=postgresql+psycopg://postgres:postgres@postgres:5432/springais
    depends_on:
      postgres:
        condition: service_healthy
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M

volumes:
  postgres_data:
  redis_data:
  frontend_node_modules:
```


---

# 10. Security Review

## 10.1 Architecture Security Review

*Source: artifacts/reviews/architecture-security-review.md*
*Cross-references: Section 7 (System Architecture), Section 3.1 (Main PRD security requirements)*

# Security-Focused Architecture Review: Medieval Mode Economy & Progression System

> **Reviewer**: Reviewer Agent (Security Focus)
> **Date**: 2026-02-11
> **Artifact Reviewed**: `artifacts/design/architecture-medieval-mode.md` (v1.0)
> **Supporting Artifacts**: PRD, Codebase Analysis, ADR-MM-001 through ADR-MM-006
> **Review Type**: Multi-perspective adversarial security review (complexity 13)

---

## Review Summary

The architecture document is well-structured and demonstrates strong security awareness. The server-authority model, idempotency mechanism, SELECT FOR UPDATE locking, and CHECK constraints represent solid defensive design. However, the review identified **4 BLOCKING** and **12 ADVISORY** findings that should be addressed before and during implementation.

---

## 1. Security Vulnerabilities

### FINDING-SEC-001: XP/Coin Amounts Determined by Client-Chosen `event_type` [ADVISORY]

**Severity**: ADVISORY

The `reward_hook_service.process_action()` receives `event_type` as a parameter from the calling route handler. The architecture correctly places this call inside backend route handlers (not exposed as a direct client API), so the client cannot directly choose the event_type. This is well-designed.

However, the architecture should explicitly state: **there must never be a public API endpoint that accepts an arbitrary `event_type` from the client.** The reward config lookup (`REWARD_CONFIG` dict) is server-side, but if a future developer adds a generic `POST /api/progression/award` endpoint that accepts event_type from the request body, the entire anti-cheat system collapses.

**Recommendation**: Add an explicit statement in Section 4.4 or Section 6.2: "No API endpoint shall accept `event_type` or reward amounts from the client. All event emissions originate from server-side route handlers after validating the primary action."

---

### FINDING-SEC-002: Race Condition Gap in `award_xp()` -- Level-Up Coin Bonus [BLOCKING]

**Severity**: BLOCKING

Section 4.2 describes `award_xp()` performing these steps:
1. Check idempotency (event_key).
2. Insert gamification_event.
3. Increment xp_total on user_progression (SELECT FOR UPDATE).
4. Recompute level.
5. If level changed, call `award_coins()` for level-up bonus.

The problem: Step 3 uses SELECT FOR UPDATE, but step 2 (insert gamification_event) happens **before** the row lock is acquired. If two concurrent requests both pass the idempotency check (step 1) before either acquires the lock (step 3), both could insert events and both could award XP.

The partial unique index on `(user_id, event_key)` would catch this at the DB level for events with non-null event_keys (the second insert would fail with a unique constraint violation). However:
- The architecture does not specify how this constraint violation is handled. An unhandled IntegrityError would result in a 500 error.
- For events with `event_key = NULL` (repeatable events like `daily_login`), there is no deduplication.

**Recommendation**:
1. Move the SELECT FOR UPDATE to step 1 (acquire the row lock first, then do all subsequent operations).
2. Explicitly handle `IntegrityError` from the unique constraint on `(user_id, event_key)` as a graceful "already awarded" response, not a 500 error.
3. For repeatable events with null event_key, document that the idempotency is handled at the application level (e.g., the login guard in Redis) and that duplicate awards are possible if Redis is unavailable. Assess whether this is acceptable.

---

### FINDING-SEC-003: Double-Spend on Coin Purchases -- Transaction Boundary [BLOCKING]

**Severity**: BLOCKING

ADR-MM-004 correctly specifies SELECT FOR UPDATE for `spend_coins()`. However, the architecture document describes the purchase flow in Section 4.5 (`store_service.purchase()`) as:

1. Load cosmetic item (validate exists, active, not quest-exclusive).
2. Check user does not already own it.
3. Load user_progression and check level.
4. Call `progression_service.spend_coins()`.
5. Insert user_inventory row.

The problem: Steps 1-3 are read operations that happen **before** the SELECT FOR UPDATE in step 4. A time-of-check-to-time-of-use (TOCTOU) vulnerability exists:
- Two concurrent purchase requests for the same item could both pass step 2 ("user does not own it") before either reaches step 4.
- Both would succeed in spending coins, and both would attempt to insert a user_inventory row.
- The UNIQUE constraint on `(user_id, cosmetic_id)` would catch the second insert, but the coins would already be deducted. The user loses coins without getting the item.

**Recommendation**:
1. The entire purchase flow must be wrapped in a single transaction where the SELECT FOR UPDATE on `user_progression` is acquired at the beginning (before checking ownership).
2. Alternatively, use SELECT FOR UPDATE on the `user_inventory` check as well, or handle the IntegrityError from the duplicate inventory insert by rolling back the entire transaction (including the coin deduction).
3. Explicitly specify: "If any step in the purchase flow fails after coins are deducted, the entire transaction rolls back and coins are restored."

---

### FINDING-SEC-004: Users Could Equip Items They Don't Own [ADVISORY]

**Severity**: ADVISORY

The equip flow (Section 4.5) validates that the user owns the item before equipping. However, the check and the upsert happen in separate operations. If a user sells/loses an item between the ownership check and the equip upsert, they could equip an item they no longer own.

In the current design, items cannot be sold or lost (no sell endpoint, no item expiry), so this is not currently exploitable. However, if a future "sell" or "trade" feature is added, this becomes a vulnerability.

**Recommendation**: Add a note in the equip flow: "The ownership check and equip upsert must be atomic. If item trading or selling is added in the future, a foreign key from `user_equipped_items.cosmetic_id` to `user_inventory.cosmetic_id` (not just `cosmetic_catalog.id`) should be added to enforce this at the database level."

---

### FINDING-SEC-005: Forged Gamification Events via Replay [ADVISORY]

**Severity**: ADVISORY

The idempotency mechanism (event_key) prevents duplicate rewards for the same action. However, the architecture does not address whether a user can trigger the underlying action multiple times to generate multiple legitimate events.

For example:
- Can a user call `POST /api/roadmap/generate` 100 times to generate 100 roadmaps and earn 100 * 50 XP? The event_key is `roadmap:{roadmap_id}`, and each call generates a new roadmap with a new ID, so each event_key is unique.
- Can a user call `POST /api/progression/visit` with the same page repeatedly? The architecture says it uses a unique constraint on `(user_id, page)` with a visit_count, so this is handled correctly for visits.

**Recommendation**: Review each integration point in Section 6.4 and confirm that the primary action cannot be trivially repeated to farm rewards. Specifically:
- `roadmap_generated`: Ensure there is a rate limit or cap on roadmap generation (e.g., max 10 per day, or only the first N roadmaps award XP).
- `first_match_view`: The event_key `first_match:{user_id}` ensures this is one-time. Correct.
- `resume_uploaded`: The event_key `resume:{user_id}` ensures this is one-time. Correct.
- `module_completed`: The event_key `module:{module_id}` ensures per-module uniqueness. Correct, assuming modules can only be completed once.

---

## 2. Data Integrity

### FINDING-INT-001: Coin Ledger Can Desync from Balance [BLOCKING]

**Severity**: BLOCKING

FR-003.3 and NFR-002.4 specify that `balance_after` must match the running total, and that a weekly validation job checks this. However, the architecture has a subtle desync risk:

In `award_coins()` (Section 4.2):
1. SELECT FOR UPDATE on user_progression.
2. Increment coin_balance.
3. Insert coin_transaction with `balance_after = new balance`.

The problem: If `award_coins()` is called from `award_xp()` (for level-up bonuses) and ALSO called from `reward_hook_service.process_action()` (for direct coin rewards), and both happen within the same DB transaction (before commit), the second `award_coins()` call would read the **uncommitted** balance from step 2 of the first call (since they share the same session). This is actually correct behavior in SQLAlchemy with `autoflush=True` (which reads dirty state), but the architecture specifies `autoflush=False` in Section 5 of the codebase analysis (database.py: `autocommit=False, autoflush=False`).

With `autoflush=False`, the second `award_coins()` call within the same transaction might read the **old** balance from the DB (before the first increment was flushed), resulting in an incorrect `balance_after` in the second transaction record.

**Recommendation**:
1. Explicitly call `db.flush()` after each balance mutation within a transaction to ensure subsequent reads within the same transaction see the updated value.
2. Or, change the session configuration to `autoflush=True` for gamification operations.
3. Add this as an explicit implementation note in Section 4.2.

---

### FINDING-INT-002: Foreign Key on `gamification_events` References `user_progression.user_id` [ADVISORY]

**Severity**: ADVISORY

Section 2.3 specifies that `gamification_events.user_id` has a FK to `user_progression.user_id`, not to `user_profiles.id`. The stated rationale is "to keep the gamification domain self-contained."

This creates a dependency ordering issue: a `user_progression` row must exist before any gamification events can be inserted. If `ensure_progression_exists()` fails or is not called before a reward hook fires, the event insert will fail with a FK violation.

The fire-and-forget pattern (Section 6.2) would catch this as an exception and log it, but the user would silently lose their reward with no indication.

**Recommendation**:
1. Either change the FK to reference `user_profiles.id` (simpler, no ordering dependency).
2. Or ensure that `reward_hook_service.process_action()` calls `ensure_progression_exists()` at the top of every invocation before inserting events.
3. Document this dependency explicitly.

---

### FINDING-INT-003: `balance_after` CHECK Constraint Insufficient Alone [ADVISORY]

**Severity**: ADVISORY

The `coin_transactions` table has `CHECK (balance_after >= 0)`. This is good, but `balance_after` is computed by the application. A bug in the application could set `balance_after` to an incorrect positive value while the actual `coin_balance` goes negative.

The defense-in-depth is provided by the `CHECK (coin_balance >= 0)` on `user_progression`, which is correct. The two constraints together provide adequate protection.

No action needed -- this is a confirmation that the design is sound.

---

## 3. Authentication & Authorization

### FINDING-AUTH-001: All Gamification Endpoints Use JWT Authentication [ADVISORY -- CONFIRMED CORRECT]

**Severity**: ADVISORY (Positive confirmation)

Section 3 states: "All endpoints require JWT authentication via the existing `get_current_user_from_token` dependency." The architecture correctly specifies that user_id is derived from the JWT token, never from the request body.

Confirmed that:
- `GET /api/progression` returns only the authenticated user's data.
- `POST /api/store/purchase` uses the authenticated user_id.
- `POST /api/quests/{quest_id}/start` uses the authenticated user_id.
- No endpoint accepts a `user_id` parameter in the request body.

This is correct. No action needed.

---

### FINDING-AUTH-002: `POST /api/progression/visit` Accepts Arbitrary Page String [ADVISORY]

**Severity**: ADVISORY

The visit endpoint accepts `{ "page": string }` from the client. While this is not a direct security vulnerability (it only affects the user's own page visit records), a malicious client could:
1. Send thousands of unique page strings to bloat the `user_page_visits` table.
2. Send very long page strings (up to 100 chars per the schema).

**Recommendation**:
1. Validate the `page` parameter against an allowlist of known pages: `/matches`, `/profile`, `/saved`, `/roadmap`, `/success-patterns`, `/store`, `/quests`.
2. Reject any page string not in the allowlist.
3. This also prevents the "explorer" achievement from being trivially unlocked by sending fake page visits.

---

### FINDING-AUTH-003: No Endpoint Leaks Other Users' Data [ADVISORY -- CONFIRMED CORRECT]

**Severity**: ADVISORY (Positive confirmation)

All API responses return data scoped to the authenticated user. The store catalog is public data (item definitions), which is appropriate. No endpoint exposes another user's XP, Coins, inventory, or achievements.

Confirmed correct. No action needed.

---

## 4. EY Compliance

### FINDING-EY-001: CoinFlipGame Removal Correctly Specified [ADVISORY -- CONFIRMED CORRECT]

**Severity**: ADVISORY (Positive confirmation)

FR-017 specifies removing the CoinFlipGame. The architecture correctly removes it from the modified files list. The replacement (if any) must award fixed amounts, not variable amounts based on chance. This is correctly specified.

No action needed.

---

### FINDING-EY-002: No Hidden Randomization Mechanics [ADVISORY -- CONFIRMED CORRECT]

**Severity**: ADVISORY (Positive confirmation)

The architecture has no loot boxes, no random item drops, no random reward amounts. All XP/Coin values are deterministic and defined in the REWARD_CONFIG table. Store prices are fixed and visible. Side quest rewards are fixed and visible before starting.

No action needed.

---

### FINDING-EY-003: No Pay-to-Win Vectors [ADVISORY -- CONFIRMED CORRECT]

**Severity**: ADVISORY (Positive confirmation)

Cosmetics are display-only (no functional effects). Coins cannot be purchased with real money. XP cannot be bought with Coins. No endpoint allows direct balance manipulation.

The only bridge between tracks is: (a) level-up Coin bonus (XP -> Coins, earned), and (b) side quest completion awards both XP and Coins (earned through learning tasks). Both are engagement-gated, not purchasable.

No action needed.

---

## 5. Performance

### FINDING-PERF-001: N+1 Query Risk in Achievement Evaluation [ADVISORY]

**Severity**: ADVISORY

Section 4.3 describes `evaluate_achievements()` iterating over all ~25 achievements and checking event counts for event-based triggers. If each event-based achievement requires a separate `COUNT(*)` query on `gamification_events`, this could result in 15-20 individual queries per evaluation cycle.

The NFR specifies < 50ms budget. With proper indexing (which the architecture provides: `idx_gamification_events_user_id` and `idx_gamification_events_type`), each COUNT query should be < 2ms. 20 queries at 2ms each = 40ms, which is tight against the 50ms budget.

**Recommendation**:
1. Batch the event count queries into a single aggregation query: `SELECT event_type, COUNT(*) FROM gamification_events WHERE user_id = ? GROUP BY event_type`. This returns all counts in one query.
2. Use this result set to evaluate all event-based achievements in memory.
3. Document this optimization in Section 4.3.

---

### FINDING-PERF-002: `gamification_events` Unbounded Growth [ADVISORY]

**Severity**: ADVISORY

Section 2.13 acknowledges unbounded growth (~50-200 rows per user per month) and NFR-003.1 specifies monthly partitioning once the table exceeds 1M rows.

However, the architecture does not specify:
1. Who monitors the table size and triggers partitioning?
2. How partitioning affects the event count queries used by achievement evaluation?
3. Whether old events can be archived or purged?

**Recommendation**: Add a note in Section 2.13: "Partitioning and archival strategy will be designed as a separate operational task when the table approaches 1M rows. The current index-based approach is sufficient for the expected user base during initial deployment."

---

### FINDING-PERF-003: Redis Cache Invalidation Creates Brief Stale Window [ADVISORY]

**Severity**: ADVISORY

ADR-MM-002 acknowledges a brief window between DB commit and cache deletion where stale data could be served. For gamification data, this is acceptable.

However, the write path described is: "After commit: delete Redis key." If the Redis delete fails (network issue), the cache will serve stale data until the 5-minute TTL expires. This could mean a user sees their old coin balance for up to 5 minutes after a purchase.

**Recommendation**: This is acceptable for MVP but should be documented as a known limitation. The graceful degradation section (8.4) already handles Redis unavailability for reads; it should also note that cache invalidation failures result in temporary stale reads.

---

### FINDING-PERF-004: Index Coverage for Common Query Patterns [ADVISORY -- CONFIRMED ADEQUATE]

**Severity**: ADVISORY (Positive confirmation)

The architecture specifies indexes for:
- `user_progression.user_id` (unique) -- covers all per-user lookups.
- `gamification_events(user_id)`, `(event_type)`, `(created_at)`, `(user_id, event_key)` partial unique -- covers dedup and count queries.
- `coin_transactions(user_id)`, `(created_at)` -- covers ledger queries.
- All catalog tables have category/active indexes.
- All user-specific tables have `(user_id, entity_id)` unique indexes.

The store catalog query (`GET /api/store/catalog?category=X&rarity=Y`) has individual indexes on `category` and `rarity` but no composite index. For 30-50 rows, this is fine. A composite index would only matter at 1000+ rows.

No action needed for current scale.

---

## 6. Architecture Consistency

### FINDING-ARCH-001: Fire-and-Forget Pattern Masks Silent Failures [BLOCKING]

**Severity**: BLOCKING

The fire-and-forget pattern (Section 6.2) catches ALL exceptions from the reward hook and returns `reward_result = None`. While this correctly prevents gamification from blocking primary actions, it creates an observability gap:

1. If a reward hook consistently fails for a specific event type (e.g., due to a bug in achievement evaluation), users silently lose XP/Coins with no indication.
2. There is no retry mechanism. A transient DB error during reward processing means the reward is permanently lost.
3. The architecture does not specify logging, monitoring, or alerting for reward hook failures.

**Recommendation**:
1. Add structured logging with severity "ERROR" for reward hook failures, including user_id, event_type, event_key, and the exception details.
2. Add a "pending rewards" mechanism: if the reward hook fails, insert a record into a `pending_rewards` table. A background job retries pending rewards periodically.
3. At minimum, add a metric/counter for reward hook failures so operational alerts can be configured.
4. If a full retry mechanism is out of scope for MVP, document this as a known gap and ensure the logging is sufficient for manual investigation and remediation.

---

### FINDING-ARCH-002: Service Boundary Between Progression and Store [ADVISORY]

**Severity**: ADVISORY

The `store_service.purchase()` calls `progression_service.spend_coins()`. This creates a bidirectional dependency if `progression_service` ever needs to call `store_service` (e.g., to award quest cosmetics). Currently, quest cosmetics are handled by `quest_service.complete_quest()` calling both `progression_service` and inserting directly into `user_inventory`, bypassing `store_service`.

This means inventory insertion logic exists in two places: `store_service.purchase()` and `quest_service.complete_quest()`. If inventory rules change (e.g., inventory cap, duplicate handling), both must be updated.

**Recommendation**: Consider extracting inventory management into a dedicated method (either on `store_service` or a shared `inventory_service`) that both purchase and quest completion call. This is not blocking but improves maintainability.

---

### FINDING-ARCH-003: Async vs Sync Redis Operations [ADVISORY]

**Severity**: ADVISORY

Section 8 shows Redis operations using `async def` and `await` (e.g., `await redis.get(...)`, `await redis.setex(...)`). However, the existing codebase uses synchronous Redis operations (the `match_cache_service.py` uses synchronous Redis client from `backend/app/config.py`).

The architecture should specify whether the new gamification services use:
- The existing synchronous Redis client (simpler, consistent with existing code).
- A new async Redis client (better performance but requires async route handlers).

FastAPI supports both sync and async route handlers. The existing routes appear to be synchronous (`def` not `async def`). If the new routes are also synchronous, the async Redis calls shown in Section 8 would need to be synchronous.

**Recommendation**: Align the Redis usage pattern with the existing codebase. If existing services use synchronous Redis, the new services should too. If async is desired, document that new gamification routes will use `async def` handlers and note the implications for the DB session management (async sessions vs sync sessions).

---

### FINDING-ARCH-004: `autoflush=False` Interaction with Multi-Step Mutations [ADVISORY]

**Severity**: ADVISORY (Related to FINDING-INT-001)

The codebase analysis notes `SessionLocal` uses `autocommit=False, autoflush=False`. The architecture's multi-step mutation flows (award_xp -> award_coins -> evaluate_achievements -> evaluate_quests) all operate within a single session transaction. With autoflush=False, intermediate state changes (e.g., xp_total increment) are not visible to subsequent queries within the same transaction unless explicitly flushed.

This is critical for:
- `award_xp()` incrementing xp_total, then `evaluate_achievements()` checking if xp_total meets a threshold.
- `spend_coins()` decrementing coin_balance, then the ownership check querying the balance.

**Recommendation**: Document in Section 4.2 and 4.7 that `db.flush()` must be called after each balance mutation within a multi-step flow to ensure subsequent reads see the updated state. This is an implementation requirement, not a design change.

---

## Finding Summary

| ID | Category | Severity | Summary |
|----|----------|----------|---------|
| FINDING-SEC-001 | Security | ADVISORY | Add explicit prohibition against client-facing event_type endpoints |
| FINDING-SEC-002 | Security | **BLOCKING** | Race condition in award_xp: lock before event insert, handle IntegrityError |
| FINDING-SEC-003 | Security | **BLOCKING** | TOCTOU in purchase flow: acquire lock before ownership check, rollback on failure |
| FINDING-SEC-004 | Security | ADVISORY | Equip flow ownership check not atomic (not exploitable today) |
| FINDING-SEC-005 | Security | ADVISORY | Review action repeatability for reward farming (roadmap_generated) |
| FINDING-INT-001 | Data Integrity | **BLOCKING** | autoflush=False causes coin ledger desync in multi-step transactions |
| FINDING-INT-002 | Data Integrity | ADVISORY | FK to user_progression.user_id creates ordering dependency |
| FINDING-INT-003 | Data Integrity | ADVISORY | balance_after CHECK adequate with defense-in-depth (confirmed correct) |
| FINDING-AUTH-001 | Auth | ADVISORY | All endpoints use JWT auth (confirmed correct) |
| FINDING-AUTH-002 | Auth | ADVISORY | Validate page parameter against allowlist |
| FINDING-AUTH-003 | Auth | ADVISORY | No cross-user data leakage (confirmed correct) |
| FINDING-EY-001 | EY Compliance | ADVISORY | CoinFlipGame removal correct (confirmed) |
| FINDING-EY-002 | EY Compliance | ADVISORY | No hidden randomization (confirmed) |
| FINDING-EY-003 | EY Compliance | ADVISORY | No pay-to-win vectors (confirmed) |
| FINDING-PERF-001 | Performance | ADVISORY | Batch achievement event count queries to avoid N+1 |
| FINDING-PERF-002 | Performance | ADVISORY | Document partitioning trigger criteria |
| FINDING-PERF-003 | Performance | ADVISORY | Document cache invalidation failure as known limitation |
| FINDING-PERF-004 | Performance | ADVISORY | Index coverage adequate (confirmed) |
| FINDING-ARCH-001 | Architecture | **BLOCKING** | Fire-and-forget masks failures: add logging, consider retry mechanism |
| FINDING-ARCH-002 | Architecture | ADVISORY | Inventory insertion logic duplicated in store and quest services |
| FINDING-ARCH-003 | Architecture | ADVISORY | Async vs sync Redis: align with existing codebase pattern |
| FINDING-ARCH-004 | Architecture | ADVISORY | Document db.flush() requirement for multi-step mutations |

---

## Blocking Findings Summary

The following 4 findings **must be resolved** before implementation begins:

1. **FINDING-SEC-002**: The `award_xp()` flow must acquire the SELECT FOR UPDATE lock before inserting the gamification event. IntegrityError from the event_key unique constraint must be caught and returned as "already awarded", not a 500 error.

2. **FINDING-SEC-003**: The store purchase flow must be fully atomic. If coins are deducted but inventory insertion fails (e.g., duplicate), the entire transaction must roll back. The SELECT FOR UPDATE should be acquired at the beginning of the flow, not partway through.

3. **FINDING-INT-001**: The architecture must document that `db.flush()` is required after each balance mutation in multi-step transaction flows (due to `autoflush=False`). Without this, coin ledger `balance_after` values will be incorrect, and achievement threshold checks will evaluate stale data.

4. **FINDING-ARCH-001**: The fire-and-forget pattern must include structured error logging with user_id, event_type, and exception details. A mechanism for recovering lost rewards (either a retry queue or manual reconciliation process) must be specified, even if implementation is deferred to Phase 5.

---

## Overall Assessment

**Verdict**: The architecture is fundamentally sound and demonstrates strong security thinking. The server-authority model, dual-layer coin balance protection (SELECT FOR UPDATE + CHECK constraint), idempotency mechanism, and EY compliance guardrails are well-designed. The 4 blocking findings are implementation-level ordering and atomicity issues that are straightforward to resolve with minor architectural amendments. Once these are addressed, the design is ready for implementation.


---

# End of Part 2 -- Architecture and Decisions

*Compiled on: 2026-02-16*
*Total sections: System Architecture (10 subsections), Architecture Decision Records (12 ADRs), Technology Stack (2 subsections), Security Review (1 subsection)*

