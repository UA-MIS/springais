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
