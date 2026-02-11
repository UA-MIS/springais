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
