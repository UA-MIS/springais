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
