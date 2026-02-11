# SpringAIS Integration Architecture & Infrastructure Scan

**Generated**: 2026-02-11
**Sources**: `_bmad-output/backend-scan-findings.md`, `_bmad-output/frontend-scan-findings.md`, `docker-compose.yml`, root config files, frontend/backend source files

---

## 1. Frontend-Backend Integration

### Communication Pattern

The frontend communicates with the backend exclusively via HTTP REST API. There is no WebSocket, Server-Sent Events, or GraphQL communication.

**HTTP Client**: Axios-based `APIClient` class (`frontend/src/services/api.ts`)
- **Base URL**: `VITE_API_URL` env var (default: `http://localhost:8000`) with `/api` path automatically appended
- **Auth**: JWT Bearer token injected via Axios request interceptor from `localStorage.getItem('token')`
- **Auto-logout**: 401 response interceptor clears token/user from localStorage and redirects to `/login`
- **Network error handling**: Overrides error message with "Network error. Please check your connection." when `!error.response`
- **Methods exposed**: `get<T>()`, `post<T>()`, `put<T>()`, `put<T>()`, `delete<T>()`, `patch<T>()`

**Auth Service** (`frontend/src/services/authService.ts`) uses a **separate** Axios instance:
- Base URL: `VITE_API_URL || 'http://localhost:8000'` -- notably does NOT append `/api`
- Calls `POST /auth/login`, `POST /auth/register`, `GET /auth/me` directly
- This is because the auth router is mounted at `/auth` (no `/api` prefix) in the backend

### CORS Configuration

**Backend** (`backend/app/main.py`):
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

- Only `http://localhost:3000` is allowed (Docker dev mode port)
- The Vite dev server runs on port 3000 (configured in `vite.config.ts: server.port = 3000`)
- No production CORS origins are configured -- production would need updates

### API Path Mapping

The backend mounts routers with the following prefix structure:

| Backend Mount | Prefix | Frontend APIClient Prepends |
|---------------|--------|-----------------------------|
| `auth_router` | none (mounted bare) | authService uses separate client without `/api` |
| `matches_router` | `/api` | APIClient auto-appends `/api` to base URL |
| `skills_router` | `/api` | APIClient auto-appends `/api` |
| `patterns_router` | `/api` | APIClient auto-appends `/api` |
| `roadmap_router` | `/api` | APIClient auto-appends `/api` |
| `hiring_manager_router` | `/api` | APIClient auto-appends `/api` |

This creates a split path convention:
- **Auth endpoints**: `http://localhost:8000/auth/*` (no `/api` prefix)
- **All other endpoints**: `http://localhost:8000/api/*`

### Frontend-Backend Endpoint Mapping

| Frontend Service | Frontend Call | Backend Route | Backend Handler |
|-----------------|--------------|---------------|-----------------|
| `authService.ts` | `POST /auth/login` | `POST /auth/login` | `auth.py:login()` |
| `authService.ts` | `POST /auth/register` | `POST /auth/register` | `auth.py:register()` |
| `authService.ts` | `GET /auth/me` | `GET /auth/me` | `auth.py:get_current_user()` |
| `matchService.ts` | `GET /matches/employee/{id}` | `GET /api/matches/employee/{id}` | `matches.py:get_matches()` |
| `matchService.ts` | `GET /matches/employee/{id}/job/{jobId}` | `GET /api/matches/employee/{id}/job/{jobId}` | `matches.py:get_match_detail()` |
| `matchService.ts` | `POST /matches/save` | `POST /api/matches/save` | `matches.py:save_match()` |
| `matchService.ts` | `GET /matches/saved` | `GET /api/matches/saved` | `matches.py:get_saved_matches()` |
| `matchService.ts` | `DELETE /matches/saved/{id}` | `DELETE /api/matches/saved/{id}` | `matches.py:delete_saved_match()` |
| `matchService.ts` | `GET /matches/job/{id}/deep-analysis` | `GET /api/matches/job/{id}/deep-analysis` | `matches.py:deep_analysis()` |
| `skillProgressService.ts` | `GET /skills/me/progress` | `GET /api/skills/me/progress` | `skills.py:get_skills_progress()` |
| `skillProgressService.ts` | `POST /skills/{name}/start` | `POST /api/skills/{name}/start` | `skills.py:start_skill()` |
| `skillProgressService.ts` | `PATCH /skills/{name}/modules/{id}/progress` | `PATCH /api/skills/{name}/modules/{id}/progress` | `skills.py:update_module_progress()` |
| `skillProgressService.ts` | `POST /skills/{name}/modules/{id}/complete` | `POST /api/skills/{name}/modules/{id}/complete` | `skills.py:complete_module()` |
| `skillProgressService.ts` | `POST /skills/{name}/complete` | `POST /api/skills/{name}/complete` | `skills.py:complete_skill()` |
| `skillProgressService.ts` | `PATCH /skills/{name}/proficiency` | `PATCH /api/skills/{name}/proficiency` | `skills.py:update_proficiency()` |
| `skillProgressService.ts` | `POST /skills/{name}/modules/{id}/complete-with-proof` | `POST /api/skills/{name}/modules/{id}/complete-with-proof` | `skills.py:complete_with_proof()` |
| `skillProgressService.ts` | `POST /skills/{name}/modules/{id}/upload-proof` | `POST /api/skills/{name}/modules/{id}/upload-proof` | `skills.py:upload_proof()` |
| `skillProgressService.ts` | `POST /skills/{name}/modules/{id}/generate-content` | `POST /api/skills/{name}/modules/{id}/generate-content` | `skills.py:generate_content()` |
| `skillProgressService.ts` | `PATCH /skills/{name}/modules/{id}/tasks` | `PATCH /api/skills/{name}/modules/{id}/tasks` | `skills.py:update_tasks()` |
| `skillProgressService.ts` | `POST /skills/quick-add` | `POST /api/skills/quick-add` | `skills.py:quick_add()` |
| `skillProgressService.ts` | `GET /skills/stale` | `GET /api/skills/stale` | `skills.py:get_stale_skills()` |
| `skillProgressService.ts` | `POST /skills/recategorize` | `POST /api/skills/recategorize` | `skills.py:recategorize()` |
| `successPatternService.ts` | `GET /patterns/transitions` | `GET /api/patterns/transitions` | `patterns.py:get_transitions()` |
| `roadmapService.ts` | `POST /roadmap/generate` | `POST /api/roadmap/generate` | `roadmap.py:generate_roadmap()` |
| `roadmapService.ts` | `GET /roadmap/saved` | `GET /api/roadmap/saved` | `roadmap.py:list_saved()` |
| `roadmapService.ts` | `GET /roadmap/saved/{id}` | `GET /api/roadmap/saved/{id}` | `roadmap.py:get_saved()` |
| `roadmapService.ts` | `DELETE /roadmap/saved/{id}` | `DELETE /api/roadmap/saved/{id}` | `roadmap.py:delete_saved()` |
| `roadmapService.ts` | `POST /roadmap/saved/{id}/milestones/{id}/toggle` | `POST /api/roadmap/saved/{id}/milestones/{id}/toggle` | `roadmap.py:toggle_milestone()` |
| `roadmapService.ts` | `POST /roadmap/saved/{id}/milestones/{id}/notes` | `POST /api/roadmap/saved/{id}/milestones/{id}/notes` | `roadmap.py:update_notes()` |
| `roadmapService.ts` | `POST /roadmap/saved/{id}/extras` | `POST /api/roadmap/saved/{id}/extras` | `roadmap.py:add_extra()` |
| `roadmapService.ts` | `DELETE /roadmap/saved/{id}/extras/{id}` | `DELETE /api/roadmap/saved/{id}/extras/{id}` | `roadmap.py:delete_extra()` |
| `roadmapService.ts` | `GET /roadmap/saved/{id}/edits` | `GET /api/roadmap/saved/{id}/edits` | `roadmap.py:get_edits()` |
| `roadmapService.ts` | `POST /roadmap/saved/{id}/edits` | `POST /api/roadmap/saved/{id}/edits` | `roadmap.py:record_edit()` |
| `roadmapService.ts` | `PUT /roadmap/saved/{id}/edit-mode` | `PUT /api/roadmap/saved/{id}/edit-mode` | `roadmap.py:set_edit_mode()` |
| `roadmapService.ts` | `POST /roadmap/saved/{id}/edit/ai` | `POST /api/roadmap/saved/{id}/edit/ai` | `roadmap.py:ai_edit()` |
| `roadmapService.ts` | `POST /roadmap/saved/{id}/edit/apply` | `POST /api/roadmap/saved/{id}/edit/apply` | `roadmap.py:apply_edit()` |
| `roadmapService.ts` | `POST /roadmap/saved/{id}/chat/enhanced` | `POST /api/roadmap/saved/{id}/chat/enhanced` | `roadmap.py:enhanced_chat()` |

### Shared Types / Contracts

There is **no shared type system** between frontend and backend. Types are independently defined:

- **Frontend**: TypeScript interfaces in service files (`matchService.ts`, `roadmapService.ts`, `skillProgressService.ts`, etc.)
- **Backend**: Pydantic schemas in `backend/app/schemas/` (auth.py, match_result.py, skill.py, pattern.py, roadmap.py, analysis.py, hiring_manager.py, skill_progress.py)

The frontend uses manual mapping functions (e.g., `mapMatchResult`, `mapMatchDetail`, `transformApiResponse`) to transform backend JSON responses into frontend types. This creates a **tight implicit coupling** without compile-time verification.

**Key type mapping discrepancies noted**:
- Frontend `Match.id` is derived from `String(item.job_id)` -- the match ID and job ID are conflated
- Frontend score fields (`overall_score`, `skill_match_score`, etc.) map from nested `item.scores.overall`, `item.scores.skill_match` objects
- Frontend `successPatternService.ts` transforms `TransitionPattern[]` from backend snake_case to frontend camelCase format
- `PROFICIENCY_LABELS` is duplicated: frontend defines `{0:'None', 1:'Beginner', 2:'Elementary', 3:'Intermediate', 4:'Advanced', 5:'Expert'}`, backend has equivalent in `skill_progress_service.py`

### Authentication Flow

```
[User] -- login form --> [Frontend AuthContext]
                              |
                              v
                    POST /auth/login {email, password}
                              |
                              v
                    [Backend auth.py] -- bcrypt verify --> [PostgreSQL user_profiles]
                              |
                              v
                    {token: JWT, user: UserResponse}
                              |
                              v
                    [Frontend] stores token in localStorage
                              |
                              v
                    All subsequent requests include Authorization: Bearer {token}
                              |
                              v
                    [Backend] get_current_user_from_token() -- PyJWT verify (HS256)
```

**JWT Token Details**:
- Algorithm: HS256
- Secret: `JWT_SECRET_KEY` env var (dev value: `i-am-dev`)
- Expiry: 7 days (configurable via `ACCESS_TOKEN_EXPIRE_DAYS`)
- Payload: `{user_id, email, exp}`

---

## 2. Docker Compose Infrastructure

### Full Service Topology (`docker-compose.yml`)

```
                   ┌─────────────┐
                   │   Frontend   │ Port 3000 (host)
                   │  Node 18    │ -> Vite dev server
                   │  alpine     │
                   └──────┬──────┘
                          │ VITE_API_URL=http://localhost:8000
                          v
                   ┌─────────────┐
                   │   Backend   │ Port 8000 (host)
                   │ Python 3.11 │ -> Uvicorn (--reload)
                   │   slim      │
                   └──┬──────┬───┘
                      │      │
           ┌──────────┘      └──────────┐
           v                            v
    ┌─────────────┐             ┌─────────────┐
    │  PostgreSQL  │ Port 5432  │    Redis     │ Port 6380 (host->6379)
    │  pgvector    │ (host)     │  7-alpine    │
    │    pg16      │            └─────────────┘
    └─────────────┘

    ┌─────────────┐
    │  ey_scraper  │ Profile: "scraper" (on-demand only)
    │ Python 3.11  │ -> scripts/scrape_ey_jobs.py
    └──────┬──────┘
           │ DATABASE_URL -> postgres
           v
    ┌─────────────┐
    │  PostgreSQL  │
    └─────────────┘
```

### Service Details

#### `postgres` (springais-postgres)
- **Image**: `pgvector/pgvector:pg16` -- PostgreSQL 16 with pgvector extension pre-installed
- **Credentials**: `POSTGRES_DB=springais`, `POSTGRES_USER=postgres`, `POSTGRES_PASSWORD=postgres`
- **Ports**: `5432:5432` (host:container)
- **Volumes**:
  - `postgres_data:/var/lib/postgresql/data` -- Persistent data (named volume)
  - `./data:/data` -- SQL seed files accessible inside container
  - `./docker/postgres-init:/docker-entrypoint-initdb.d:ro` -- Init scripts (run on first volume creation only)
- **Init Scripts** (executed alphabetically on fresh volume):
  - `01_extensions.sql`: `CREATE EXTENSION IF NOT EXISTS vector; CREATE EXTENSION IF NOT EXISTS pgcrypto;`
  - `02_pattern_indexes.sql`: Creates 6 indexes on employees table (current_role, service_line, compound, GIN on career_history, GIN on skills, partial index with career_history IS NOT NULL)
- **Health Check**: `pg_isready -U postgres` every 10s, 5 retries
- **Resources**: 1.0 CPU / 512M memory (limits), 0.5 CPU / 256M (reservations)

#### `redis` (springais-redis)
- **Image**: `redis:7-alpine`
- **Ports**: `6380:6379` -- NOTE: Host port 6380, container port 6379
- **Volumes**: `redis_data:/data` -- Persistence (AOF or RDB, default Redis config)
- **Health Check**: `redis-cli ping` every 10s, 3 retries
- **Resources**: 0.5 CPU / 256M (limits), 0.25 CPU / 128M (reservations)
- **No authentication** configured (no `requirepass`)

#### `backend` (springais-backend)
- **Build**: `./backend/Dockerfile` (Python 3.11-slim)
- **Command**: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
- **Ports**: `8000:8000`
- **Volumes**:
  - `./backend:/app` -- Bind mount for hot reload
  - `./uploads:/app/uploads` -- File upload storage
  - `./scripts:/app/scripts` -- Data pipeline scripts
  - `./data:/app/data` -- SQL seed data files
- **Environment** (passed from `.env` or defaults):
  - `DATABASE_URL=postgresql+psycopg://postgres:postgres@postgres:5432/springais`
  - `REDIS_URL=redis://redis:6379/0`
  - `OPENAI_API_KEY=${OPENAI_API_KEY}` -- From host `.env`
  - `ONET_API_KEY=${ONET_API_KEY}` -- From host `.env`
  - `JWT_SECRET_KEY=${JWT_SECRET_KEY}` -- From host `.env`
  - `JWT_ALGORITHM=${JWT_ALGORITHM:-HS256}`
  - `ACCESS_TOKEN_EXPIRE_DAYS=${ACCESS_TOKEN_EXPIRE_DAYS:-7}`
- **Depends On**: postgres (healthy), redis (healthy)
- **Resources**: 2.0 CPU / 1G (limits), 0.5 CPU / 512M (reservations)

#### `frontend` (springais-frontend)
- **Build**: `./frontend/Dockerfile` (Node 18-alpine)
- **Command**: `npm run dev -- --host` (Vite dev server, not production build)
- **Ports**: `3000:3000`
- **Volumes**:
  - `./frontend:/app` -- Bind mount for hot reload
  - `frontend_node_modules:/app/node_modules` -- Named volume (prevents host node_modules from overriding)
- **Environment**: `VITE_API_URL=http://localhost:8000`
- **Resources**: 1.0 CPU / 512M (limits), 0.25 CPU / 256M (reservations)
- **No health check** defined
- **No depends_on** defined (frontend connects to backend via browser, not container networking)

#### `ey_scraper` (springais-ey-scraper)
- **Profile**: `scraper` -- Only starts with `docker compose --profile scraper up ey_scraper`
- **Build**: Uses same `./backend/Dockerfile`
- **Working Dir**: `/repo` (mounts entire project root)
- **Entry Point**: `python scripts/scrape_ey_jobs.py`
- **Volumes**: `./:/repo` -- Entire project root mounted
- **Environment**: `DATABASE_URL=postgresql+psycopg://postgres:postgres@postgres:5432/springais`
- **Depends On**: postgres (healthy)
- **Resources**: 1.0 CPU / 512M (limits), 0.25 CPU / 256M (reservations)

### Named Volumes (3 total)
| Volume | Purpose |
|--------|---------|
| `postgres_data` | PostgreSQL data directory persistence |
| `redis_data` | Redis data persistence |
| `frontend_node_modules` | Isolates node_modules from host bind mount |

### Network
- Default Docker Compose bridge network (auto-created)
- Services reference each other by service name (`postgres`, `redis`, `backend`)
- Frontend connects to backend via `http://localhost:8000` (browser-side, not container-to-container)

---

## 3. Database Integration

### Data Flow Architecture

```
[Frontend Browser]
       │
       │ HTTP REST API (JSON)
       v
[FastAPI Backend] ──── SQLAlchemy 2.0 ──── [PostgreSQL + pgvector]
       │                                          │
       │                                          │ pgvector HNSW Index
       │                                          │ GIN Indexes (JSONB)
       │                                          │ TSVECTOR Full-text
       │                                          │ BRIN Index (timestamps)
       v
[Redis Cache]
```

The frontend **never** directly accesses the database. All database interactions flow through the FastAPI backend.

### SQLAlchemy Session Management

- **Engine**: `psycopg` dialect (psycopg3), `QueuePool(pool_size=20, max_overflow=30, pool_recycle=1800, pool_pre_ping=True)`
- **Session Factory**: `SessionLocal = sessionmaker(autocommit=False, autoflush=False)`
- **FastAPI Dependency**: `get_db()` yields sessions per-request with automatic close in finally block
- **Table Creation**: `Base.metadata.create_all(bind=engine)` runs on app startup via FastAPI lifespan

### Database Schema (12 tables, 26 Alembic migrations)

| Table | Key Columns | Vector/Special Columns |
|-------|-------------|----------------------|
| `user_profiles` | id (UUID), email, hashed_password, full_name, skills (JSONB) | `resume_embedding` Vector(1536) |
| `employees` | id (String), service_line, current_role, skills (JSONB), career_history (JSONB) | GIN indexes on skills, career_history |
| `job_postings` | id (String), title, required_skills (JSONB), preferred_skills (JSONB), llm_required_skills (JSONB) | `description_embedding` Vector(1536), `title_embedding` Vector(1536), `search_vector` TSVECTOR |
| `matches` | id (UUID), user_id (FK), job_posting_id (FK), overall_score, skill_gaps (JSONB) | |
| `skill_embeddings` | id (UUID), skill_text, normalized_text, source_type | `embedding` Vector(1536) with HNSW index |
| `skill_taxonomy` | id (Int), canonical_name, category, aliases (JSON) | |
| `user_skills` | id (UUID), user_id (FK), skill_name, proficiency_level (0-5), status | |
| `skill_modules` | id (UUID), skill_name, module_number, learning_content (JSONB) | |
| `user_module_progress` | id (UUID), user_skill_id (FK), module_id (FK), proof_file_data (LargeBinary) | |
| `user_skill_recommendations` | id (UUID), user_id (FK), skill_name, priority_score | |
| `career_paths` | id (UUID), user_id (FK unique), graph_data (JSONB) | React Flow format |
| `saved_roadmaps` | id (UUID), user_id (FK), roadmap_data (JSONB) | Full roadmap JSON |
| `roadmap_milestone_progress` | id (UUID), roadmap_id (FK), milestone_id, status | |
| `roadmap_extras` | id (UUID), roadmap_id (FK), title, category | |
| `roadmap_edits` | id (UUID), roadmap_id (FK), edit_type, original_values (JSONB) | Audit trail |
| `hm_saved_jobs` | id (UUID), hm_user_id (FK), job_posting_id (FK), notes | |

### pgvector Configuration

- **Extension**: Created via `docker/postgres-init/01_extensions.sql` (`CREATE EXTENSION IF NOT EXISTS vector`)
- **Index Type**: HNSW (Hierarchical Navigable Small World) on `skill_embeddings.embedding`
- **Distance Metric**: Cosine distance (`<=>` operator in SQL, `vector_cosine_ops` in index)
- **Dimensions**: 1536 (reduced from OpenAI's native 3072 via PCA)
- **Query Pattern**: `ORDER BY embedding <=> :query_vector LIMIT :k` for k-nearest neighbor search

### Alembic Migration Setup

- **Root-level** `alembic.ini`: `sqlalchemy.url = postgresql+psycopg://postgres:postgres@postgres:5432/springais`
- **Backend-level** `alembic.ini`: Same URL (both exist; the backend one is used when running from backend directory)
- **Versions**: 26 sequential migrations (001 through 026)
- **Key schema changes**: pgvector columns added in migration 017, skill progress in 018, roadmap in 020, hiring manager in 026

---

## 4. Redis Caching Patterns

### Connection Configuration

- **URL**: `REDIS_URL` env var (default `redis://localhost:6379/0`, Docker: `redis://redis:6379/0`)
- **Host Port**: 6380 (mapped to container 6379) -- NOTE: `.env` uses `redis://localhost:6380`
- **Pool**: `max_connections=20`, `decode_responses=False` (binary mode)
- **Singleton**: Module-level connection pool in `config.py`

### Cache Layers and TTLs

| Cache Layer | Key Pattern | TTL | Service | Purpose |
|-------------|------------|-----|---------|---------|
| Match results | `matches:{user_id}:{params_hash}` | 5 min | `match_cache_service.py` | Avoid re-running matching algorithm |
| Skill versions | `skill_version:{user_id}` | 1 hour | `match_cache_service.py` | Invalidation trigger for match cache |
| Embedding cache (L1) | `emb:exact:{hash}` | 7 days | `embedding_service.py` | Avoid duplicate OpenAI API calls |
| Pattern cache | `patterns:{hash}` | 24 hours | `pattern_service.py` | Career transition analysis results |
| Job skill extraction | `job_skills:{sha256_hash}` | 30 days | `job_skill_extractor.py` | LLM-extracted skills per job |

### Cache Invalidation Strategy

1. **Match Cache**: Per-user invalidation when skills change
   - `invalidate_user_cache(user_id)` deletes all `matches:{user_id}:*` keys
   - Bumps `skill_version:{user_id}` counter to invalidate stale reads
   - Triggered as FastAPI `BackgroundTask` after skill updates

2. **Embedding Cache**: No active invalidation (7-day TTL natural expiry)

3. **Pattern Cache**: Manual invalidation endpoint `POST /api/patterns/cache/invalidate`
   - Also has local dict fallback when Redis is unavailable

4. **Frontend Cache**: 5-minute TTL in `MatchesContext` (`CACHE_TTL_MS = 5 * 60 * 1000`)
   - Cache key: JSON serialized filters object comparison
   - `clearCache()` method available for forced refresh

### In-Memory Caches (Non-Redis)

| Cache | Location | TTL | Max Size |
|-------|----------|-----|----------|
| Global embedding cache | `matching_service.py` `_GLOBAL_EMBEDDING_CACHE` | 5 min | Unbounded |
| Skill taxonomy expansion | `skill_taxonomy.py` LRU | None | 1000 entries |
| Skill normalizer | `skill_normalizer.py` `SkillNormalizerCache` | None | Unbounded |

---

## 5. AI/ML Pipeline Flow

### Full End-to-End Flow: User Input to Match Results

```
┌──────────────────────────────────────────────────────────────────┐
│ STEP 1: USER INPUT                                               │
│                                                                  │
│ [User uploads resume]                                            │
│     │                                                            │
│     v                                                            │
│ Frontend: ResumeUpload.jsx                                       │
│   POST /api/skills/upload (FormData with file)                   │
│     │                                                            │
│     v                                                            │
│ Backend: skills.py route                                         │
│   resume_parser.py -> extract text (PDF/DOCX/TXT)               │
│   text_cleaner.py -> strip_pii(text) -> clean_resume_text()      │
│     │                                                            │
│     v                                                            │
│ STEP 2: SKILL EXTRACTION (GPT-5.2-chat-latest)                  │
│                                                                  │
│ skill_extractor.py -> SkillExtractor.extract_skills()            │
│   Chunks text if > 3500 tokens (tiktoken)                        │
│   Sends PII-stripped text to GPT-5.2-chat-latest                 │
│   Returns: {listed_skills, inferred_skills}                      │
│   Stores in user_profile.llm_listed_skills, llm_inferred_skills  │
│     │                                                            │
│     v                                                            │
│ STEP 3: EMBEDDING GENERATION (text-embedding-3-large + PCA)      │
│                                                                  │
│ [BackgroundTask: vectorize_user_skills_and_resume()]             │
│                                                                  │
│ embedding_service.py -> EmbeddingService.embed_skills_batch()    │
│   For each skill:                                                │
│     1. Check Redis cache (L1 exact match, 7-day TTL)             │
│     2. If miss: call OpenAI text-embedding-3-large (3072 dims)   │
│     3. PCA transform: 3072 -> 1536 dims (scikit-learn)           │
│     4. Store in skill_embeddings table + Redis cache             │
│                                                                  │
│ Also: embed user resume text -> user_profiles.resume_embedding   │
│     │                                                            │
│     v                                                            │
│ STEP 4: MATCHING (80/10/10 algorithm)                            │
│                                                                  │
│ [User views Matches page -> MatchesContext.fetchMatchesProgressive] │
│ GET /api/matches/employee/{id}?limit=20&offset=0                 │
│                                                                  │
│ matching_service.py -> MatchingService.calculate_matches()       │
│                                                                  │
│   Check match cache (Redis, 5-min TTL):                          │
│     If hit: return cached results                                │
│     If miss: run full matching pipeline:                         │
│                                                                  │
│   A. SKILL MATCH (80% weight):                                   │
│     1. Taxonomy match: SkillTaxonomyService.calculate_skill_coverage() │
│        - Direct match: 1.0                                       │
│        - Implied (2+ child skills): 0.85                         │
│        - Parent skill: 0.80                                      │
│        - Related skill: 0.70                                     │
│     2. Exact string match (case-insensitive)                     │
│     3. pgvector HNSW search (cosine distance <=>)                │
│        - Threshold >= 0.65 for match                             │
│        - Threshold >= 0.50 for transferable                      │
│     4. Fuzzy token Jaccard (fallback for remaining)              │
│                                                                  │
│   B. EXPERIENCE MATCH (10% weight):                              │
│     - Under/over-qualified penalties                              │
│                                                                  │
│   C. ROLE FIT (10% weight):                                      │
│     - resume_embedding <=> job description_embedding              │
│     - Cosine similarity                                          │
│                                                                  │
│   Cache results in Redis (5-min TTL)                             │
│     │                                                            │
│     v                                                            │
│ STEP 5: DISPLAY                                                  │
│                                                                  │
│ Frontend: MatchResultsPage                                       │
│   Progressive loading (BATCH_SIZE=20)                            │
│   Virtual scrolling at 50+ matches                               │
│   US location filtering (client-side)                            │
│   Score-based sorting                                            │
│                                                                  │
│ [User clicks match -> Deep Analysis]                             │
│   GET /api/matches/job/{id}/deep-analysis                        │
│   analysis_service.py -> GPT-5.2 (reasoning_effort="medium")     │
│   Returns: skill impacts, success factors, risk factors,          │
│            ramp-up time, comparable roles, learning path          │
└──────────────────────────────────────────────────────────────────┘
```

### Skill Learning Flow

```
[User starts skill] -> POST /api/skills/{name}/start
     │
     v
skill_progress_service.py -> create UserSkill + auto-generate SkillModules
     │ (Priority: existing DB modules > AI groupings > dynamic fallback)
     │
     v
[User completes modules] -> PATCH/POST .../modules/{id}/progress|complete
     │
     v
[Module complete with proof] -> POST .../modules/{id}/complete-with-proof
     │ -> AI review via learning_content_service.review_proof_submission()
     │
     v
[Proficiency >= 3] -> auto-sync to user_profile.skills (counts for matching)
     │ -> BackgroundTask: invalidate match cache, trigger incremental updates
     │
     v
[incremental_match_service.py] -> only recalculate affected jobs
```

### Roadmap Generation Flow

```
[User selects target roles] -> POST /api/roadmap/generate
     │ {target_roles, emphasis, auto_order, custom_instructions}
     │
     v
roadmap_service.py -> RoadmapService.generate()
     │
     ├── Fetch user profile (skills, experience, role)
     ├── Fetch success patterns (analyze_transitions + get_patterns_by_skills)
     ├── Fetch skill proficiencies
     │
     v
[GPT-5.2] (reasoning_effort="medium", max_tokens=12000)
     │ Prompt includes: current skills, target roles, patterns, proficiencies
     │
     v
{phases, milestones, executive_summary, quick_wins, blockers}
     │
     v
[Save to DB] -> saved_roadmaps table (roadmap_data JSONB)
     │
     v
[Frontend: RoadmapViewer] -> tabs (Overview/Insights/Phase), progress tracking,
                             AI chat assistant, AI-assisted editing
```

---

## 6. Environment Configuration

### Environment Variable Inventory

| Variable | Used By | Docker Default | `.env` Default | Required |
|----------|---------|----------------|----------------|----------|
| `DATABASE_URL` | `database.py`, `config.py` | `postgresql+psycopg://postgres:postgres@postgres:5432/springais` | `postgresql://postgres:postgres@localhost:5432/springais` | Yes |
| `REDIS_URL` | `config.py` | `redis://redis:6379/0` | `redis://localhost:6380` | No (defaults) |
| `OPENAI_API_KEY` | `config.py` | `${OPENAI_API_KEY}` (from host) | `sk-proj-...` | Yes |
| `ONET_API_KEY` | scraper scripts | `${ONET_API_KEY}` (from host) | `7jXK...` | No (only for scraper) |
| `JWT_SECRET_KEY` | `security.py` | `${JWT_SECRET_KEY}` (from host) | `i-am-dev` | Yes |
| `JWT_ALGORITHM` | `security.py` | `${JWT_ALGORITHM:-HS256}` | (HS256 default) | No |
| `ACCESS_TOKEN_EXPIRE_DAYS` | `security.py` | `${ACCESS_TOKEN_EXPIRE_DAYS:-7}` | (7 default) | No |
| `VITE_API_URL` | Frontend | `http://localhost:8000` | `http://localhost:8000` | No (defaults) |
| `PCA_MODEL_DIR` | `pca_loader.py` | (auto-detected) | (auto-detected) | No |

### Notable Configuration Issues

1. **Port mismatch**: `.env` sets `REDIS_URL=redis://localhost:6380` (host-mapped port), but Docker internal URL is `redis://redis:6379/0`. The docker-compose.yml correctly sets `REDIS_URL=redis://redis:6379/0` for the backend container, overriding the `.env` file.

2. **DATABASE_URL dialect mismatch**: `.env` uses `postgresql://` (psycopg2 dialect) while the backend code auto-normalizes to `postgresql+psycopg://` (psycopg3 dialect). The Docker env uses the correct `postgresql+psycopg://` directly.

3. **JWT secret**: Dev value is `i-am-dev` which is not production-safe. No production secret rotation mechanism.

4. **OpenAI API key**: Present in `.env` file (should be in `.gitignore` -- confirmed `.env` is not tracked in git based on `git status` output showing only untracked `.claude/` files).

---

## 7. Data Pipeline

### Scraping Pipeline

```
┌──────────────────────────────────────────────────────────────────┐
│ SCRAPE: EY Careers Website                                       │
│                                                                  │
│ scripts/scrape_ey_jobs.py                                        │
│   Runs as: docker compose --profile scraper up ey_scraper        │
│   OR: python scripts/scrape_ey_jobs.py (from project root)       │
│                                                                  │
│   1. Search URL: https://careers.ey.com/ey/search/               │
│   2. Parse listing pages (BeautifulSoup + lxml)                  │
│   3. Extract job links, visit each detail page                   │
│   4. field_extractors.py: extract experience, education, certs   │
│   5. Upsert into job_postings table (external_id dedup)          │
│   6. Uses .cache/ey_scraper/ for HTTP response caching           │
│                                                                  │
│   User-Agent: "SpringAIS/1.0 (Educational Project)"             │
│   Concurrent: ThreadPoolExecutor for parallel page fetches       │
│   Rate limiting: Random delays between requests                  │
└──────────────────────────────────────────────────────────────────┘
           │
           v
┌──────────────────────────────────────────────────────────────────┐
│ ENRICH: LLM Skill Extraction                                    │
│                                                                  │
│ scripts/extract_all_job_skills.py                                │
│   For each job_posting without skills_extracted_at:              │
│     job_skill_extractor.py -> GPT-5.2-chat-latest                │
│     Redis cache: SHA256(description) -> extracted skills         │
│     Stores: llm_required_skills, llm_inferred_skills,            │
│             llm_experience_years_min/max, llm_primary_domain     │
│             skill_extraction_hash, skills_extracted_at            │
└──────────────────────────────────────────────────────────────────┘
           │
           v
┌──────────────────────────────────────────────────────────────────┐
│ VECTORIZE: Embedding Generation                                  │
│                                                                  │
│ scripts/generate_all_embeddings.py                               │
│   For each job_posting and skill without embeddings:             │
│     embedding_service.py -> text-embedding-3-large (3072 dims)   │
│     PCA reduction: 3072 -> 1536 dims                            │
│     Store in: skill_embeddings table (with HNSW index)           │
│               job_postings.description_embedding                 │
│               job_postings.title_embedding                       │
└──────────────────────────────────────────────────────────────────┘
           │
           v
┌──────────────────────────────────────────────────────────────────┐
│ SYNTHETIC DATA (Optional)                                        │
│                                                                  │
│ scripts/generate_synthetic_data.py + llm_generator.py            │
│   Generates fake employees using:                                │
│     - role_templates.py (career paths, skill sets)               │
│     - onet_client.py (O*NET API for occupation data)             │
│     - GPT models for realistic profiles                          │
│   Output: data/synthetic_employees_llm.json -> .sql              │
│   Export: sql_exporter.py writes INSERT statements               │
│   Validation: validators.py checks data integrity                │
└──────────────────────────────────────────────────────────────────┘
           │
           v
┌──────────────────────────────────────────────────────────────────┐
│ PCA MODEL TRAINING (One-time setup)                              │
│                                                                  │
│ scripts/train_pca_model.py                                       │
│   1. Expand 200+ base skills to 1600 variations                  │
│   2. Generate embeddings via OpenAI (text-embedding-3-large)     │
│   3. Train PCA: 3072 -> 1536 dims (sklearn)                     │
│   4. Validate: cosine similarity preservation, variance >= 95%   │
│   5. Save: backend/backend/models/pca/pca_v1.pkl + metadata.json│
│                                                                  │
│ scripts/validate_embedding_quality.py                            │
│   Validates the trained PCA model quality                        │
└──────────────────────────────────────────────────────────────────┘
```

### Data Directory Contents

```
data/
  README.md                    - Documentation
  seed_job_postings.sql        - Initial job posting seed data
  test_employees.sql           - Test employee data
  synthetic_employees.sql      - Generated employee data v1
  synthetic_employees_v2.sql   - Generated employee data v2
  synthetic_employees_llm.json - LLM-generated employees (JSON)
  synthetic_employees_llm.sql  - LLM-generated employees (SQL)
  pipeline_test.json           - Pipeline test data
  pipeline_test.sql            - Pipeline test SQL
  test_real_api.json           - Real API test data
  test_real_api.sql            - Real API test SQL
```

### Scraper Cache

The `.cache/ey_scraper/` directory contains thousands of `.meta.json` files -- one per scraped page. These serve as an HTTP response cache to avoid re-fetching pages during development.

---

## 8. Testing Infrastructure

### Backend Tests

- **Framework**: pytest with `pytest-asyncio`
- **Config** (`pytest.ini`):
  ```ini
  asyncio_mode = auto
  asyncio_default_fixture_loop_scope = function
  testpaths = tests
  ```
- **12 test files** covering: models (5), auth (1), patterns (1), recommendations (2), security (1)
- **Mock Redis**: `fakeredis` library for cache testing
- **Test gaps**: matching_service, embedding_service, skill_extractor, skill_progress, roadmap, hiring_manager, most routes

### Frontend Tests

- **Framework**: Vitest + React Testing Library (referenced in `TESTING-SUMMARY.md`)
- **Config**: Via `vite.config.ts` test section
- **Minimal test files found in scan**

### E2E Tests

- **Root `package.json`**: Lists `playwright` (`^1.57.0`) as devDependency
- **No Playwright test files found** in the scan

---

## 9. Build and Deployment Configuration

### Backend Dockerfile

```dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y postgresql-client
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN mkdir -p /app/uploads
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- `postgresql-client` for `pg_isready` or manual DB operations
- No multi-stage build (dev only)
- `--reload` flag added in docker-compose command override

### Frontend Dockerfile

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host"]
```

- Dev-only Dockerfile (runs Vite dev server, not production build)
- Frontend scan mentions multi-stage build with nginx for production, but current Dockerfile is dev-only
- No `npm run build` or nginx config present

### GZip Compression

Backend applies `GZipMiddleware(minimum_size=1000)` -- compresses responses > 1000 bytes (60-80% reduction).

---

## 10. Notable Integration Patterns and Issues

### Patterns

1. **Progressive Loading**: Frontend loads matches in batches of 20 with 100ms delays between batches, avoiding large single responses. Backend supports `limit` and `offset` query params.

2. **Background Tasks**: Non-blocking operations (vectorization, cache invalidation, recommendation refresh) use FastAPI's `BackgroundTasks` dependency, executing after the HTTP response is sent.

3. **Singleton Services**: OpenAI client, Redis pool, SkillTaxonomyService, SkillNormalizerCache, MatchCacheService all use module-level singleton patterns to avoid connection overhead.

4. **Dual Account System**: Frontend enforces account type routing (`AccountTypeRoute` component), backend enforces via `account_type == "hiring_manager"` check in hiring manager endpoints.

5. **PII Protection**: Resume text is PII-stripped before LLM processing. Hiring manager endpoints return anonymized candidate data only (no names, emails, or identifying information).

### Issues and Risks

1. **No API Proxy in Docker**: Frontend Vite config does NOT set up a proxy to the backend -- it connects directly via `VITE_API_URL`. This means the browser makes cross-origin requests requiring CORS. A Vite proxy or nginx reverse proxy would simplify deployment.

2. **Hardcoded CORS Origin**: Only `http://localhost:3000` is allowed. Production deployment requires updating this.

3. **No Rate Limiting**: No API rate limiting middleware on the backend. Only OpenAI API retry logic exists.

4. **No Shared Type Contract**: Frontend and backend define types independently. No OpenAPI schema generation is consumed by the frontend, despite FastAPI auto-generating OpenAPI docs.

5. **Auth Service Separate Client**: `authService.ts` creates its own Axios instance with a different base URL pattern than the main `APIClient`, which could cause inconsistency if base URL configuration changes.

6. **Dev-Only Frontend Dockerfile**: Current Dockerfile runs Vite dev server. No production build pipeline or nginx configuration is wired up.

7. **No Health Check for Frontend**: The frontend Docker container has no health check defined, unlike postgres and redis.

8. **Redis Port Mapping**: Host port 6380 maps to container port 6379. The `.env` file uses `redis://localhost:6380` for local development, while docker-compose sets `redis://redis:6379/0` for the backend container. This dual-port configuration could confuse developers.

9. **Match/Job ID Conflation**: Frontend `Match.id` is set from `job_id`, not the actual match record ID. This works for one-match-per-job but would break if multiple match modes stored per job.

10. **No WebSocket/SSE**: Long-running operations (roadmap generation, deep analysis, skill extraction) block the HTTP request. No streaming or push notification mechanism exists for real-time updates.
