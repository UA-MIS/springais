# SpringAIS Backend - Exhaustive Codebase Scan

**Generated**: 2026-02-11
**Scan scope**: `backend/` directory, `scripts/` directory (project root)
**Total Python source files scanned**: ~90 files

---

## 1. Technology Stack

### Core Framework
- **FastAPI** (>=0.109.0) - Async web framework with automatic OpenAPI docs
- **Uvicorn** (>=0.27.0) - ASGI server (standard extras for lifespan support)
- **Python 3.11** (Dockerfile: `python:3.11-slim`)

### Database
- **PostgreSQL** with pgvector extension
  - **SQLAlchemy 2.0** (>=2.0.25) - ORM with declarative mapped columns
  - **psycopg3** (>=3.1.0) via `psycopg[binary]` - Primary async driver
  - **psycopg2-binary** (>=2.9.9) - Fallback driver
  - **pgvector** (>=0.2.4) - Vector similarity search (1536-dim, HNSW index, cosine distance)
  - **Alembic** (>=1.13.1) - Schema migrations (26 versions: 001-026)
- **Connection pooling**: `QueuePool(pool_size=20, max_overflow=30, pool_recycle=1800, pool_pre_ping=True)`
- **DSN normalization**: Auto-converts `postgres://` to `postgresql+psycopg://` for psycopg3

### Caching
- **Redis** (>=5.0.1) - Async connection pool (`max_connections=20`)
  - Match result caching (5 min TTL, skill-version invalidation)
  - Embedding caching (exact match Layer 1)
  - Pattern caching (24h TTL)
  - Job skill extraction caching (30-day TTL)

### AI/ML
- **OpenAI API** via `openai` (>=1.10.0) - AsyncOpenAI singleton client
  - `text-embedding-3-large` (3072 dims) with PCA reduction to 1536
  - `gpt-5.2` with `reasoning_effort="medium"` for deep analysis and roadmap generation
  - `gpt-5.2-chat-latest` for skill extraction, grouping, learning content, chat
  - `gpt-5-nano` for lightweight recommendation bootstrapping
- **scikit-learn** (>=1.4.0) - PCA dimensionality reduction (3072 -> 1536)
- **numpy** (>=1.26.0) - Vector math
- **joblib** (>=1.3.2) - PCA model serialization
- **tiktoken** (>=0.5.2) - Token counting
- **LangChain** (>=0.1.4) / **langchain-openai** (>=0.0.2) - Listed but minimal direct usage found

### Security
- **bcrypt** (>=4.1.0) - Password hashing
- **PyJWT** (>=2.9.0) - JWT token creation/verification (HS256, 7-day expiry)

### File Processing
- **pypdf** (>=5.0.0) - PDF text extraction
- **python-docx** (>=1.1.0) - DOCX text extraction
- **python-multipart** (>=0.0.6) - File upload handling

### Web Scraping (scripts/)
- **beautifulsoup4** (>=4.12.3) - HTML parsing
- **requests** (>=2.31.0) - HTTP client
- **lxml** (>=5.1.0) - XML/HTML parser
- **tqdm** (>=4.66.0) - Progress bars

### Configuration
- **pydantic** (>=2.5.3) / **pydantic-settings** (>=2.1.0) - Schema validation
- **python-dotenv** (>=1.0.0) - Environment variable loading
- **email-validator** (>=2.1.0) - Email validation in Pydantic

### Testing
- **pytest** (>=7.4.0)
- **pytest-asyncio** (>=0.21.0)
- **fakeredis** (>=2.21.0)

---

## 2. Entry Points & Configuration

### `backend/app/main.py` - Application Entry Point
- FastAPI app with `lifespan` context manager
- Creates tables via `Base.metadata.create_all(bind=engine)` on startup
- **Middleware**: `GZipMiddleware(minimum_size=500)`, `CORSMiddleware`
- **CORS origins**: `["http://localhost:3000"]`
- **Routers mounted**:
  - `auth_router` at `/auth`
  - `match_router` at `/api`
  - `skills_router` at `/api`
  - `patterns_router` at `/api`
  - `roadmap_router` at `/api`
  - `hiring_manager_router` at `/api`
- Root endpoint (`GET /`) returns `{"status": "running", "version": "1.0.0"}`

### `backend/app/config.py` - Client Factories
- `get_openai_client() -> AsyncOpenAI` - Singleton pattern, reads `OPENAI_API_KEY` from env
- `get_redis_client() -> redis.asyncio.Redis` - Connection pool with `max_connections=20`, reads `REDIS_URL`
- `OPENAI_API_KEY` exported as module-level constant
- DSN normalization function for psycopg3 compatibility

### `backend/app/database.py` - Database Engine
- `DATABASE_URL` from environment
- SQLAlchemy engine: `psycopg` dialect, `QueuePool`
- `SessionLocal` factory: `autocommit=False, autoflush=False`
- `get_db()` - FastAPI dependency yielding DB sessions

### `backend/app/config/matching_config.py` - Matching Configuration
- `ScoringWeights` dataclass: `skill=0.80, experience=0.10, role_fit=0.10`
- `MatchMode` enum: `BEST_FIT, GROWTH_OPPORTUNITY, ALL`
- `MatchingConfig`: `top_k=50, min_score=0.15, cache_ttl=300`
- Role level hierarchy (1-9): Staff through Partner
- Valid role transition deltas: `[-1, 0, 1, 2]`

### `backend/Dockerfile`
- Base: `python:3.11-slim`
- Working directory: `/app`
- Runs: `uvicorn app.main:app --host 0.0.0.0 --port 8000`

### `backend/alembic.ini`
- Database: `postgresql://postgres:postgres@postgres:5432/springais`

---

## 3. Data Models (SQLAlchemy)

All models in `backend/app/models/`. Base class uses `DeclarativeBase` with `TimestampMixin` (created_at, updated_at with server defaults).

### `employee.py` - Table: `employees`
| Column | Type | Notes |
|--------|------|-------|
| id | String(PK) | Employee ID |
| service_line | String | |
| current_role | String | |
| role_level | Integer | 1-9 hierarchy |
| years_experience | Numeric | |
| skills | JSONB | GIN indexed |
| performance_metrics | JSONB | Validated via Pydantic |
| feedback_themes | ARRAY(String) | |
| notable_achievement | Text | |
| career_history | JSONB | For pattern analysis |
- Relationship: `matches` -> Match

### `job_posting.py` - Table: `job_postings`
| Column | Type | Notes |
|--------|------|-------|
| id | String(PK) | |
| external_id | String(unique) | From scraper |
| title | String | |
| service_line | String | |
| location | String | |
| description | Text | |
| required_skills | JSONB | GIN indexed |
| preferred_skills | JSONB | GIN indexed |
| tags | JSONB | GIN indexed |
| experience_years_min/max | Integer | |
| posting_url | String | |
| source_locale | String | |
| posted_date | Date | |
| scraped_at | DateTime | |
| responsibilities_text | Text | |
| requirements_text | Text | |
| preferred_text | Text | |
| is_active | Boolean | |
| search_vector | TSVECTOR | GIN indexed for full-text search |
| llm_required_skills | JSONB | GPT-extracted |
| llm_inferred_skills | JSONB | GPT-inferred |
| llm_experience_years_min/max | Integer | |
| llm_primary_domain | String | |
| skill_extraction_hash | String | SHA256 of description |
| skills_extracted_at | DateTime | |
| description_embedding | Vector(1536) | |
| title_embedding | Vector(1536) | |
- Indexes: GIN on skills/tags/search_vector, BRIN on created_at, indexes on is_active+posted_date
- Relationships: `matches`, `hm_saved_jobs`

### `user_profile.py` - Table: `user_profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID(PK) | |
| email | String(unique) | |
| hashed_password | String | bcrypt |
| full_name | String | |
| current_role | String | |
| years_experience | Numeric | |
| target_service_line | String | |
| skills | JSONB | Profile skills list |
| employee_id | FK(employees.id) | Optional link |
| resume_text | Text | |
| resume_file_url | String | |
| skill_assessment_scores | JSONB | |
| onboarding_complete | Boolean | |
| account_type | String(20) | "personal" or "hiring_manager" |
| last_login_at | DateTime | |
| llm_listed_skills | JSONB | From resume extraction |
| llm_inferred_skills | JSONB | |
| skill_groupings | JSONB | AI-generated categories |
| resume_embedding | Vector(1536) | For role fit scoring |
- `verify_password()` method using bcrypt
- Relationships: `matches`, `employee`, `career_path`, `saved_roadmaps`, `hm_saved_jobs`

### `match.py` - Table: `matches`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID(PK) | |
| employee_id | FK(nullable) | |
| job_posting_id | FK | |
| user_id | FK(user_profiles) | |
| match_mode | String | |
| overall_score | Numeric | |
| skill_match_score | Numeric | |
| experience_score | Numeric | |
| growth_potential_score | Numeric | |
| skill_gaps | JSONB | |
| matched_skills | JSONB | |
| explanation | Text | |

### `skill_embedding.py` - Table: `skill_embeddings`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID(PK) | |
| skill_text | String | Original text |
| normalized_text | String | Lowercased, trimmed |
| embedding | Vector(1536) | HNSW indexed (vector_cosine_ops) |
| source_type | String | "user", "job_posting", etc. |
| source_id | String | |
| embedding_model | String | e.g., "text-embedding-3-large-pca" |
| token_count | Integer | |
- `similarity_to()` method using numpy cosine similarity

### `skill_taxonomy.py` - Table: `skill_taxonomy`
| Column | Type | Notes |
|--------|------|-------|
| id | Integer(PK) | |
| canonical_name | String(unique) | |
| category | String | |
| aliases | JSON | List of alternative names |
- `SEED_SKILLS` list: 120+ skills across categories (technical, soft, domain, certification)
- `matches()` method for skill name lookup

### `career_path.py` - Table: `career_paths`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID(PK) | |
| user_id | FK(unique) | One per user |
| current_position_node_id | String | |
| target_position_node_id | String | |
| graph_data | JSONB | React Flow format |
| progression_status | JSONB | |
| last_updated_at | DateTime | |

### `skill_progress.py` - Three tables:

**`user_skills`**:
| Column | Type | Notes |
|--------|------|-------|
| id | UUID(PK) | |
| user_id | FK | |
| skill_name | String | |
| category | String | |
| status | String | not_started/in_progress/completed |
| proficiency_level | Integer | 0-5 scale |
| source | String | resume/job_gap/manual/roadmap |
| started_at | DateTime | |
| completed_at | DateTime | |
| last_updated_at | DateTime | |

**`skill_modules`**:
| Column | Type | Notes |
|--------|------|-------|
| id | UUID(PK) | |
| skill_name | String | |
| module_number | Integer | |
| title | String | |
| description | Text | |
| sequence_order | Integer | |
| estimated_hours | Integer | |
| skill_type | String | technical/soft/tool |
| learning_content | JSONB | AI-generated |
| external_resources | JSONB | |
| ey_resources | JSONB | |

**`user_module_progress`**:
| Column | Type | Notes |
|--------|------|-------|
| id | UUID(PK) | |
| user_skill_id | FK | |
| module_id | FK | |
| status | String | |
| progress_percentage | Integer | 0-100 |
| started_at | DateTime | |
| completed_at | DateTime | |
| tasks_completed | JSONB | |
| proof_description | Text | |
| proof_link | String | |
| proof_file_data | LargeBinary | BYTEA in DB |
| proof_file_name | String | |
| proof_file_type | String | |
| ai_feedback | Text | |

### `skill_recommendation.py` - Table: `user_skill_recommendations`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID(PK) | |
| user_id | FK | |
| skill_name | String | |
| category | String | |
| priority_score | Numeric | 0-1 |
| source | String | saved_matches/career_goal/llm_bootstrap |
| related_job_ids | JSONB | |
| status | String | recommended/in_progress/completed/dismissed |
| user_notes | Text | |

### `roadmap.py` - Table: `saved_roadmaps`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID(PK) | |
| user_id | FK | |
| title | String | |
| target_role_titles | JSONB | |
| total_phases | Integer | |
| total_milestones | Integer | |
| estimated_months | Integer | |
| emphasis | String | technical/leadership/balanced |
| executive_summary | Text | |
| roadmap_data | JSONB | Full roadmap JSON |
| edit_mode | String | view/suggest/edit |
| has_manual_edits | Boolean | |
| current_phase_id | String | |

### `roadmap_progress.py` - Three tables:
- **`roadmap_milestone_progress`**: roadmap_id, milestone_id, phase_id, status, completed_at, notes
- **`roadmap_extras`**: User-added achievements with title, description, category
- **`roadmap_edits`**: Audit trail with edit_type, change_description, affected_elements, original/new_values

### `hm_saved_job.py` - Table: `hm_saved_jobs`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID(PK) | |
| hm_user_id | FK(user_profiles) | |
| job_posting_id | FK(job_postings) | |
| notes | Text | |

### `schemas.py` - Pydantic utility models
- `PerformanceMetrics`, `MatchScores`, `ReactFlowNode/Edge/Graph`

---

## 4. API Endpoints (Routes)

### Authentication - `backend/app/routes/auth.py`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register new user (email, password 8-128, name) |
| POST | `/auth/login` | Login, returns JWT token |
| GET | `/auth/me` | Get current user profile (requires auth) |

### Matches - `backend/app/routes/matches.py`
All endpoints require authentication.
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/matches/employee/{id}` | Paginated matches with Redis caching |
| GET | `/api/matches/employee/{id}/job/{job_id}` | Detailed match for specific job |
| GET | `/api/matches/employee/{id}/skill-gaps/{job_id}` | Skill gap analysis |
| POST | `/api/matches/save` | Save a match result |
| GET | `/api/matches/saved` | Get saved matches |
| GET | `/api/matches/job/{job_id}/deep-analysis` | GPT-5.2 deep analysis |
| DELETE | `/api/matches/saved/{match_id}` | Delete saved match |

### Skills - `backend/app/routes/skills.py` (~1800 lines)
All endpoints require authentication.
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/skills/me` | Current user's skills |
| GET | `/api/skills/me/progress` | Skills with module progress |
| POST | `/api/skills/{name}/start` | Start learning a skill |
| PATCH | `/api/skills/{name}/modules/{id}/progress` | Update module progress |
| POST | `/api/skills/{name}/modules/{id}/complete` | Complete a module |
| POST | `/api/skills/{name}/complete` | Complete entire skill |
| PATCH | `/api/skills/{name}/proficiency` | Update proficiency (0-5) |
| POST | `/api/skills/{name}/modules/{id}/complete-with-proof` | Complete with proof |
| POST | `/api/skills/{name}/modules/{id}/upload-proof` | Upload proof file (10MB max, BYTEA) |
| GET | `/api/skills/{name}/modules/{id}/proof-file` | Download proof file |
| PATCH | `/api/skills/{name}/modules/{id}/tasks` | Update task checklist |
| POST | `/api/skills/{name}/modules/{id}/generate-content` | AI learning content |
| POST | `/api/skills/quick-add` | Quick-add skill |
| GET | `/api/skills/stale` | Skills needing update (6+ months) |
| POST | `/api/skills/extract` | Extract skills from text |
| POST | `/api/skills/upload` | Upload resume, extract skills |
| GET | `/api/skills/taxonomy` | Get skill taxonomy |
| POST | `/api/skills/taxonomy/seed` | Seed taxonomy DB |
| GET | `/api/skills/taxonomy/search` | Search taxonomy |
| GET | `/api/skills/recommendations` | Get skill recommendations |
| PATCH | `/api/skills/recommendations/{name}/status` | Update recommendation status |
| POST | `/api/skills/plan/{job_id}` | Generate upskilling plan |
| POST | `/api/skills/normalize` | Normalize skill names |
| GET | `/api/skills/stats` | Skill statistics |
| POST | `/api/skills/group` | AI skill grouping (GPT-5.2) |
| POST | `/api/skills/enhance` | Enhance groupings with new skills |
| GET | `/api/skills/groupings` | Get saved groupings |
| POST | `/api/skills/recategorize` | Recategorize skills |
| GET | `/api/skills/debug/modules/{name}` | Debug module data |
- Background tasks: vectorization, recommendation refresh, cache invalidation

### Patterns - `backend/app/routes/patterns.py`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/patterns/career-goal` | Set career goal |
| GET | `/api/patterns/role/{name}` | Get patterns by role |
| POST | `/api/patterns/role-skills` | Get role skill requirements |
| GET | `/api/patterns/transition/{source}/{target}` | Transition details |
| GET | `/api/patterns/graph` | Career graph (React Flow) |
| GET | `/api/patterns/transitions` | All transitions |
| GET | `/api/patterns/employee/{id}/recommendations` | Role recommendations |
| GET | `/api/patterns/employee/{id}/trajectory` | Career trajectory |
| POST | `/api/patterns/cache/invalidate` | Invalidate pattern cache |
| GET | `/api/patterns/skills/{source}/{target}` | Skill-based patterns |

### Roadmap - `backend/app/routes/roadmap.py` (~1150 lines)
All endpoints require authentication.
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/roadmap/generate` | Generate roadmap (GPT-5.2 reasoning) |
| GET | `/api/roadmap/saved` | List saved roadmaps |
| GET | `/api/roadmap/saved/{id}` | Get specific roadmap |
| DELETE | `/api/roadmap/saved/{id}` | Delete roadmap |
| POST | `/api/roadmap/chat` | Chat about career (GPT-5.2-chat) |
| GET | `/api/roadmap/saved/{id}/progress` | Get roadmap progress |
| POST | `/api/roadmap/saved/{id}/milestones/{id}/toggle` | Toggle milestone |
| POST | `/api/roadmap/saved/{id}/milestones/{id}/complete-with-skills` | Complete + boost skills |
| POST | `/api/roadmap/saved/{id}/milestones/{id}/notes` | Update milestone notes |
| POST | `/api/roadmap/saved/{id}/extras` | Add user achievement |
| DELETE | `/api/roadmap/saved/{id}/extras/{id}` | Delete achievement |
| GET | `/api/roadmap/saved/{id}/edits` | Get edit history |
| POST | `/api/roadmap/saved/{id}/edits` | Record manual edit |
| PUT | `/api/roadmap/saved/{id}/edit-mode` | Set edit mode |
| POST | `/api/roadmap/saved/{id}/edit/ai` | AI-assisted edit |
| POST | `/api/roadmap/saved/{id}/edit/apply` | Apply edit |
| POST | `/api/roadmap/saved/{id}/chat/enhanced` | Enhanced chat |

### Hiring Manager - `backend/app/routes/hiring_manager.py`
All endpoints require `account_type == "hiring_manager"`.
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/hm/jobs` | Browse all jobs (paginated, filterable) |
| POST | `/api/hm/my-jobs` | Save job to "My Jobs" |
| GET | `/api/hm/my-jobs` | Get saved jobs |
| DELETE | `/api/hm/my-jobs/{id}` | Remove saved job |
| PATCH | `/api/hm/my-jobs/{id}/notes` | Update job notes |
| GET | `/api/hm/my-jobs/{job_id}/interest` | ANONYMIZED candidate interest |

---

## 5. Services Layer

### `matching_service.py` (~1420 lines) - Core Matching Engine
- **Class**: `MatchingService(db, user_profile, mode, scoring_weights)`
- **Dataclasses**: `EmployeeProfile`, `JobPostingData`, `MatchCandidate`
- **Global embedding cache**: Thread-locked `_GLOBAL_EMBEDDING_CACHE` with TTL (5 min)
- **Three-tier skill matching** (80% weight):
  1. **Taxonomy match**: Parent/child/alias via `SkillTaxonomyService`
  2. **Exact string match**: Case-insensitive direct comparison
  3. **pgvector HNSW search**: O(log N) semantic similarity (cosine distance `<=>` operator)
  4. **Fuzzy token Jaccard**: Fallback for remaining skills
- **Thresholds**: Semantic match >= 0.65, Transferable >= 0.50
- **Experience scoring** (10%): Under/over-qualified penalties
- **Role fit scoring** (10%): Resume-to-job description embedding cosine similarity
- **US-only location filtering**: Extensive SQL LIKE patterns for US cities/states
- **Employee resolution**: Maps `UserProfile` to `Employee` via `employee_id` FK

### `embedding_service.py` - Vector Embeddings
- **Class**: `EmbeddingService(openai_client, redis_client, db_session)`
- **Model**: `text-embedding-3-large` (3072 dimensions)
- **PCA reduction**: 3072 -> 1536 via pre-trained model
- **Two-layer cache**: Layer 1 (exact match in Redis, 7-day TTL), Layer 2 (semantic - disabled)
- **Batch processing**: Up to 100 skills per API call
- **Retry**: Exponential backoff for API failures
- **Methods**: `embed_skill()`, `embed_skills_batch()`, `embed_and_store_skill()`, `embed_and_store_job()`, `embed_and_store_user_resume()`

### `embedding_integration.py` - Convenience Functions
- `vectorize_user_skills_and_resume(db, user)` - Batch embed user skills + resume
- `vectorize_job_skills(db, job)` - Batch embed job skills

### `analysis_service.py` - Deep Analysis
- **Class**: `DeepAnalysisService(db)`
- **Model**: `gpt-5.2` with `reasoning_effort="medium"`
- Detailed candidate-job fit analysis with structured JSON output
- Retry logic with exponential backoff

### `skill_extractor.py` - Resume Skill Extraction
- **Class**: `SkillExtractor(model, temperature, max_tokens)`
- **Model**: `gpt-5.2-chat-latest`, temp 0.3, max 4000 tokens
- Extracts **listed** vs **inferred** skills
- **16 skill categories**: technical, programming, tool, soft, leadership_management, domain, certification, methodology, cloud_infrastructure, data_analytics, business_acumen, research, security, consulting_excellence
- **Chunking**: For resumes > 3500 tokens
- **PII stripping**: Before sending to LLM
- **Category fallback mapping** for invalid LLM-returned categories
- **Cost tracking**: GPT-5.2 pricing ($1.75/1M input, $14/1M output)

### `skill_normalizer.py` - Skill Name Normalization
- **Class**: `SkillNormalizerCache` - Global in-memory cache (alias -> canonical)
- `normalize_skill()` - Cache lookup then DB fallback
- `deduplicate_skills()` - Keeps highest proficiency for duplicates
- `seed_skill_taxonomy()` - Seeds DB from SEED_SKILLS list

### `skill_taxonomy.py` (service) - Skill Relationship Engine
- **Class**: `SkillTaxonomyService` - Singleton
- **SKILL_TAXONOMY dict**: 50+ detailed `SkillRelationship` entries covering:
  - Microsoft Office ecosystem, Programming languages, Cloud platforms, DevOps, Data/Analytics, Leadership, Communication, Business/Finance, Frameworks
- **Each relationship**: canonical_name, aliases, parent_skills, child_skills, related_skills, category
- **Methods**:
  - `normalize_skill()` - Resolve aliases to canonical names
  - `get_implied_skills()` - Infer parent skills from 2+ children
  - `expand_user_skills()` - Union of original + implied + parent skills (cached)
  - `calculate_skill_coverage()` - Returns 1.0 (direct), 0.85 (implied), 0.80 (parent), 0.70 (related), 0.0 (none)
- **Performance**: LRU caching with MAX_CACHE_SIZE=1000

### `pattern_service.py` (~1377 lines) - Career Pattern Analysis
- **Class**: `SuccessPatternService(db, use_mock, use_cache)`
- **Mock data**: 22 employees across Advisory, Technology, Assurance, Tax service lines
- **Redis caching**: 24h TTL, local fallback
- **Fuzzy role matching**: `SequenceMatcher` similarity >= 0.65
- **Methods**: `analyze_transitions()`, `find_common_skills()`, `build_career_graph()`, `get_next_role_recommendations()`, `get_trajectory_metrics()`, `get_patterns_by_skills()`
- React Flow compatible graph output with calculated node positions

### `recommendation_service.py` - Skill Recommendations
- **Class**: `SkillRecommendationService(db)`
- **Shared ThreadPoolExecutor** (4 workers) for DB operations
- **Sources**: saved matches skill gaps, career goal target skills, LLM bootstrap
- **LLM bootstrap**: `gpt-5-nano` for lightweight recommendations
- **Default fallback**: 8 bootstrap skills across categories
- **Persistence**: Creates/updates `UserSkillRecommendation` records, removes stale recommendations

### `skill_grouping_service.py` - AI Skill Grouping
- **Model**: `gpt-5.2-chat-latest`
- `generate_skill_groupings(skills, context)` - AI-powered categorization with learning modules
- `enhance_skill_groupings(existing, new_skills)` - Merge new skills into existing structure
- **Fallback**: Keyword-based categorization (programming, cloud, data, leadership, communication)

### `skill_progress_service.py` (~709 lines) - Skill Progress Tracking
- **Class**: `SkillProgressService(db, user_profile)`
- **Proficiency scale**: 0-5 (None, Beginner, Elementary, Intermediate, Advanced, Expert)
- **Match threshold**: Proficiency >= 3 syncs to user_profile.skills for matching
- **Skill decay**: Warning after 6 months without update
- **Module creation priority**: 1) Existing DB, 2) AI groupings, 3) Dynamic fallback
- **Profile sync**: Auto-adds/removes skills from user_profile.skills based on proficiency
- **Methods**: `start_skill()`, `update_module_progress()`, `complete_module()`, `complete_skill()`, `update_proficiency()`, `boost_skill_proficiency()`

### `job_skill_extractor.py` - Job Posting Skill Extraction
- **Class**: `JobSkillExtractorService(model, temperature, max_tokens)`
- **Model**: `gpt-5.2-chat-latest`
- Batch processing of multiple jobs
- Redis caching with 30-day TTL (SHA256 hash of description)
- Extracts: required_skills, inferred_skills, experience_years, primary_domain
- Category normalization mapping for LLM output

### `job_import_service.py` - Job Enrichment with Embeddings
- `enrich_job_with_embeddings(db, job, embedding_service)` - Pre-compute embeddings during import
- `batch_enrich_jobs(db, jobs, batch_size=10)` - Parallel batch processing
- `enrich_new_jobs(db, limit=100)` - Backfill embeddings for existing jobs

### `match_cache_service.py` - Smart Match Caching
- **Class**: `MatchCacheService` - Singleton
- **Cache key**: `matches:{user_id}:{hash}` with skill-version validation
- **Match TTL**: 5 minutes
- **Skill version TTL**: 1 hour
- **Invalidation**: Per-user pattern-based deletion + version bump

### `incremental_match_service.py` - Incremental Match Updates
- **Class**: `IncrementalMatchService(db, user)`
- Only recalculates matches affected by skill changes
- Searches `required_skills`, `preferred_skills`, `llm_required_skills` for affected jobs
- Merges with cached scores for unaffected jobs

### `learning_content_service.py` - AI Learning Content
- **Model**: `gpt-5.2-chat-latest`
- Generates: learning guides, external resources, EY resources (Credly badges, Virtual Academy, Tech MBA), practice exercises, success criteria
- `review_proof_submission()` - AI feedback on proof of completion
- `generate_skill_modules()` - Dynamic module generation
- **EY-specific resources**: Credly badges, Virtual Academy, Tech MBA, Learning on Demand, Career Path Accelerator

### `hiring_manager_service.py` - Hiring Manager Operations
- **Class**: `HiringManagerService(db)`
- **Privacy**: NEVER exposes PII - all data anonymized
- **Semantic matching**: Uses pgvector HNSW for transferable skill detection
- **Thresholds**: Matched >= 0.65, Transferable >= 0.50
- **Fit levels**: strong_fit (>=0.8), good_fit (>=0.65), moderate_fit (>=0.5), developing (<0.5)

### `roadmap_service.py` - Career Roadmap Generation
- **Class**: `RoadmapService(db)`
- **Model**: `gpt-5.2` with `reasoning_effort="medium"`, max 12000 tokens
- Combines: user profile, target roles, success patterns, skill proficiencies
- Generates: phases with milestones, executive summary, quick wins, blockers
- **Emphasis options**: technical, leadership, balanced
- **Auto-ordering**: AI determines optimal role progression sequence

### `roadmap_progress_service.py` - Roadmap Progress Tracking
- **Class**: `RoadmapProgressService(db)`
- Milestone toggling, notes, extra achievements, edit history
- Edit audit trail with original/new values

### `resume_parser.py` - File Parsing
- PDF (pypdf), DOCX (python-docx), TXT (multi-encoding detection)
- Max 10MB file size
- Supported types: `.pdf`, `.docx`, `.txt`

---

## 6. Schemas (Pydantic)

### `auth.py`
- `RegisterRequest(email, password[8-128], full_name)`
- `LoginRequest(email, password)`
- `UserResponse(id, email, full_name, current_role, ...)`
- `AuthResponse(token, user)`

### `match_result.py`
- `MatchModeEnum(best_fit, growth_opportunity, all)`
- `MatchScores(skill_match[80%], experience_match[10%], role_fit[10%], overall)`
- `SkillGapAnalysis(overlapping_skills, missing_skills, transferable_skills, match_percentage)`
- `MatchResult`, `MatchResultDetail`, `SavedMatchResponse`, `SavedMatchesResponse`

### `skill.py`
- `SkillCategory` - 16 literal values (technical, soft, domain, certification, tool, methodology, programming, cloud_infrastructure, data_analytics, leadership_management, business_acumen, tools, research, consulting_excellence, security)
- `ProficiencyLevel(beginner, intermediate, advanced, expert)`
- `Skill(name, category, proficiency, years_experience)`
- `SkillExtractionRequest/Response`, `ResumeUploadResponse`
- `ExtractedSkill(name, category, confidence)`, `JobSkillExtraction`

### `pattern.py`
- `TransitionPattern(pattern_id, source_role, target_role, success_rate, avg_time, sample_size, common_skills)`
- `CareerGraphNode/Edge/Graph` - React Flow compatible
- `RoleRecommendation`, `TrajectoryMetrics`
- `SkillBasedPatternsResponse` with metrics, transitions, time-to-promotion, skill frequency, department distribution

### `roadmap.py`
- `RoadmapEmphasis(technical, leadership, balanced)`
- `TargetRole(job_id, job_title, service_line, order)`
- `RoadmapGenerateRequest(target_roles, emphasis, custom_instructions, include_certifications, timeline_preference, auto_order)`
- `RoadmapPhase(id, name, description, target_role, milestones, status)`
- `RoadmapMilestone(id, title, description, category, priority, duration, prerequisites, skills, resources, success_indicators)`

### `analysis.py`
- `ImportanceLevel(critical, high, medium, low)` / `GapSeverity`
- `SkillImpactAnalysis`, `ComplexAnalysis`

### `hiring_manager.py`
- `FitLevelDistribution(strong_fit, good_fit, moderate_fit, developing)`
- `AnonymizedCandidateDetail(candidate_label, scores, matched/transferable/gap skills, fit_level)` - NO PII
- `CandidateInterestResponse(total_interested, fit_distribution, averages, common_gaps, candidates)`
- `JobBrowseItem/Response`

### `skill_progress.py`
- `ExternalResourceSchema`, `EYResourceSchema`
- `ModuleSchema`, `SkillProgressSchema`
- `UserSkillWithProgress`, `UserSkillsWithProgressResponse`

---

## 7. Utils

### `security.py` - Authentication
- `hash_password(password) -> str` using bcrypt
- `verify_password(password, hashed) -> bool`
- `create_jwt_token(payload) -> str` using PyJWT (HS256, 7-day expiry)
- `verify_jwt_token(token) -> dict`
- `get_current_user_from_token()` - FastAPI dependency (HTTPBearer)
- Env vars: `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_DAYS`

### `pca_loader.py` - PCA Model Management
- `PCAMetadata` dataclass (version, n_components, input_dimensions, variance_ratio, training_samples)
- `load_pca_model(version, base_dir) -> (PCA, PCAMetadata)`
- `save_pca_model(pca_model, metadata, version, base_dir)`
- `load_pca_model_safe()` - Returns None if not found
- Default path resolution: `backend/backend/models/pca/`

### `text.py` - Text Utilities
- `normalize_skill_text(text) -> str` - Lowercase, strip, collapse spaces
- `calculate_cosine_similarity(vec1, vec2) -> float` - Pure Python implementation

### `text_cleaner.py` - Resume Text Processing
- `strip_pii(text, aggressive=False) -> (stripped_text, metadata)` - Removes emails, phones, URLs, addresses, names, optionally prestigious institution names
- `clean_resume_text(raw_text, strip_pii_flag=True) -> str` - Unicode normalization, page number removal, whitespace cleanup
- `chunk_text(text, max_tokens=3000, overlap_tokens=200) -> List[str]` - Token-aware text splitting
- `count_tokens(text, model="gpt-4") -> int` - Using tiktoken
- `extract_years_experience(text) -> dict` - Regex-based extraction
- **Bias mitigation**: PII stripping before LLM processing, optional prestigious institution obscuring

### `skill_categorizer.py` - Keyword-Based Categorization
- `CATEGORY_KEYWORDS` dict with extensive keyword lists for: programming, cloud_infrastructure, data_analytics, leadership_management, soft, business_acumen, domain, tools, research
- `categorize_skill(skill_name) -> str` - Keyword matching with smart fallback

---

## 8. Tests

**Location**: `backend/tests/`
**Test files** (12 total):

| File | Coverage |
|------|----------|
| `tests/__init__.py` | Empty |
| `tests/models/conftest.py` | Test fixtures for model tests |
| `tests/models/test_career_path.py` | CareerPath model tests |
| `tests/models/test_employee.py` | Employee model tests |
| `tests/models/test_match.py` | Match model tests |
| `tests/models/test_skill_embedding.py` | SkillEmbedding model tests |
| `tests/models/test_user_profile.py` | UserProfile model tests |
| `tests/test_auth.py` | Authentication endpoint tests |
| `tests/test_pattern_service.py` | SuccessPatternService tests (mock data) |
| `tests/test_recommendation_endpoints.py` | Recommendation API tests |
| `tests/test_recommendation_service.py` | SkillRecommendationService tests |
| `tests/test_security.py` | JWT/bcrypt security tests |

**Test coverage gaps**: No tests for matching_service, embedding_service, skill_extractor, skill_progress_service, roadmap_service, hiring_manager_service, most routes.

---

## 9. Scripts (Project Root `scripts/`)

| Script | Purpose |
|--------|---------|
| `scrape_ey_jobs.py` | Scrapes EY careers page, parses HTML, stores in DB |
| `field_extractors.py` | Extracts experience, education, certifications from job HTML |
| `extract_all_job_skills.py` | Batch LLM skill extraction for all jobs |
| `generate_all_embeddings.py` | Batch embedding generation for all skills |
| `generate_synthetic_data.py` | Generates synthetic employee data |
| `llm_generator.py` | LLM-based synthetic data generation |
| `onet_client.py` | O*NET API client for occupation data |
| `role_templates.py` | Role/skill templates for synthetic data |
| `sql_exporter.py` | Exports data to SQL format |
| `train_pca_model.py` | Trains PCA model (3072 -> 1536 dimensions) |
| `validate_embedding_quality.py` | Validates PCA embedding quality |
| `test_llm_generator.py` | Tests for LLM generator |
| `validators.py` | Data validation utilities |

---

## 10. Debug Scripts (Backend Root)

| Script | Purpose |
|--------|---------|
| `debug_matching.py` through `debug_matching6.py` | 6 iterations of matching debug scripts |
| `test_embedding_similarity.py` | Test embedding similarity calculations |
| `test_fix.py` / `test_fix2.py` | Ad-hoc fix validation scripts |

---

## 11. Database Migrations (Alembic)

**26 versions** from initial schema through hiring manager support:

| Migration | Description |
|-----------|-------------|
| 001 | Initial schema (employees, job_postings, matches, user_profiles, career_paths) |
| 002 | Add indexes |
| 003 | Add relationships |
| 004 | Job posting status and search |
| 005 | Job posting tags and sections |
| 006 | Search vector include sections |
| 007 | User skill recommendations table |
| 008 | User-employee mapping |
| 009 | Job posting external_id |
| 010-011 | Backfill job posting columns |
| 012 | Job posting timestamps |
| 013 | Normalize job posting types |
| 014 | Employee updated_at |
| 015 | Remove seed jobs |
| 016 | LLM skill columns |
| 017 | Skill embeddings table + pgvector |
| 018 | Skill progress tables |
| 019 | Make match employee_id nullable |
| 020 | Saved roadmaps table |
| 021 | Skill groupings column |
| 022 | Roadmap progress tables |
| 023 | Performance indexes |
| 024 | Proficiency and proof fields |
| 025 | Tasks completed field |
| 026 | Hiring manager tables |

---

## 12. Architecture Patterns & Key Design Decisions

### Matching Algorithm (80/10/10 Split)
1. **Skill Match (80%)**: Four-layer approach - taxonomy (parent/child/alias), exact string, pgvector HNSW semantic search, fuzzy Jaccard fallback
2. **Experience Match (10%)**: Penalizes under/over-qualification
3. **Role Fit (10%)**: Resume-to-job embedding cosine similarity

### Embedding Pipeline
- OpenAI `text-embedding-3-large` produces 3072-dim vectors
- PCA reduces to 1536-dim for pgvector compatibility
- HNSW index enables O(log N) similarity search
- Two-tier caching: Redis (exact match) + in-memory (global thread-locked)

### PII/Bias Mitigation
- Resume text is PII-stripped before LLM processing
- Removes: emails, phones, URLs, addresses, candidate names
- Optional aggressive mode: obscures prestigious institution names
- Hiring manager view shows ONLY anonymized candidate data

### Caching Strategy
- **Match results**: 5-min TTL, skill-version invalidation per user
- **Embeddings**: 7-day Redis TTL + global in-memory cache with thread locking
- **Patterns**: 24-hour Redis TTL + local dict fallback
- **Job skill extraction**: 30-day Redis TTL (SHA256 hash key)

### Background Processing
- FastAPI `BackgroundTasks` for non-blocking operations:
  - Vectorization of user skills and resume after upload
  - Recommendation refresh after match save
  - Match cache invalidation after skill changes

### AI Model Usage
| Model | Use Case | Cost |
|-------|----------|------|
| `gpt-5.2` (reasoning) | Deep analysis, roadmap generation | $2.50/$10 per 1M tokens |
| `gpt-5.2-chat-latest` | Skill extraction, grouping, learning content, chat | $1.75/$14 per 1M tokens |
| `gpt-5-nano` | Lightweight recommendation bootstrap | Low cost |
| `text-embedding-3-large` | Skill/job/resume embeddings (3072 dims) | Embedding pricing |

### Singleton Patterns
- OpenAI AsyncClient (module-level)
- Redis connection pool (module-level)
- SkillTaxonomyService (module-level)
- SkillNormalizerCache (module-level)
- MatchCacheService (module-level)

---

## 13. Key File Inventory

### Source Files by Directory

```
backend/app/
  main.py                          - FastAPI application entry point
  config.py                        - OpenAI/Redis client factories
  database.py                      - SQLAlchemy engine and session
  __init__.py

  config/
    __init__.py                    - Config module exports
    matching_config.py             - Scoring weights, match modes, role hierarchy

  models/ (15 files)
    base.py, employee.py, job_posting.py, match.py, user_profile.py,
    career_path.py, skill_embedding.py, skill_taxonomy.py,
    skill_recommendation.py, skill_progress.py, roadmap.py,
    roadmap_progress.py, hm_saved_job.py, schemas.py, __init__.py

  routes/ (7 files)
    auth.py, matches.py, skills.py, patterns.py, roadmap.py,
    hiring_manager.py, __init__.py

  schemas/ (9 files)
    auth.py, match_result.py, skill.py, pattern.py, roadmap.py,
    analysis.py, hiring_manager.py, skill_progress.py, __init__.py

  services/ (17 files)
    __init__.py (lazy imports), matching_service.py, embedding_service.py,
    embedding_integration.py, analysis_service.py, skill_extractor.py,
    skill_normalizer.py, skill_taxonomy.py, pattern_service.py,
    recommendation_service.py, skill_grouping_service.py,
    skill_progress_service.py, job_skill_extractor.py,
    job_import_service.py, match_cache_service.py,
    incremental_match_service.py, learning_content_service.py,
    hiring_manager_service.py, roadmap_service.py,
    roadmap_progress_service.py, resume_parser.py

  utils/ (6 files)
    security.py, pca_loader.py, text.py, text_cleaner.py,
    skill_categorizer.py, __init__.py

backend/tests/ (12 files)
backend/alembic/ (27 files - env.py + 26 migrations)
backend/ (9 debug scripts at root)
scripts/ (13 pipeline scripts)
```

### Configuration Files
```
backend/requirements.txt          - Python dependencies (~30 packages)
backend/Dockerfile                - Python 3.11-slim container
backend/alembic.ini               - Migration configuration
backend/.env (expected)           - OPENAI_API_KEY, REDIS_URL, DATABASE_URL, JWT_SECRET_KEY
```

---

## 14. Environment Variables

| Variable | Required | Default | Used By |
|----------|----------|---------|---------|
| `OPENAI_API_KEY` | Yes | None | config.py |
| `REDIS_URL` | No | `redis://localhost:6379/0` | config.py, pattern_service.py |
| `DATABASE_URL` | Yes | None | database.py |
| `JWT_SECRET_KEY` | Yes | `""` (errors if empty) | security.py |
| `JWT_ALGORITHM` | No | `HS256` | security.py |
| `ACCESS_TOKEN_EXPIRE_DAYS` | No | `7` | security.py |
| `PCA_MODEL_DIR` | No | Auto-detected | pca_loader.py |

---

## 15. Notable Observations

1. **Large service files**: `matching_service.py` (1420 lines), `skills.py` route (1800 lines), `pattern_service.py` (1377 lines), `roadmap.py` route (1150 lines) are candidates for refactoring
2. **Debug scripts**: 9 debug scripts at backend root suggest active development/troubleshooting of matching algorithm
3. **Test coverage**: Limited to models, auth, patterns, recommendations, security. Major gaps in service layer testing
4. **Services lazy loading**: `__init__.py` uses `__getattr__` to avoid heavy import costs
5. **EY-specific content**: Learning resources reference EY Credly badges, Virtual Academy, Tech MBA programs
6. **Multiple OpenAI models**: Uses 4 different models based on task complexity/cost
7. **Scraper infrastructure**: Full web scraping pipeline for EY careers site with field extractors, validators, and SQL export
8. **Synthetic data generation**: Scripts to generate fake employee data using LLM + O*NET API
9. **PCA model**: Pre-trained scikit-learn PCA model stored as `.pkl` file in `backend/backend/models/pca/`
10. **No rate limiting**: No API rate limiting middleware found (only OpenAI API retry logic)
