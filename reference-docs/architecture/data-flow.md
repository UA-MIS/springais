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
