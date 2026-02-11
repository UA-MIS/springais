# SpringAIS Backend Development Guide

**Generated**: 2026-02-11
**Source**: `backend/` directory scan findings

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Python | 3.11 | Specified in Dockerfile |
| PostgreSQL | 16 | With pgvector extension |
| Redis | 7+ | For caching layer |
| Docker | Latest | For containerized development |
| Docker Compose | v2+ | Multi-service orchestration |
| OpenAI API key | N/A | Required for AI features |

---

## Project Setup

### Option 1: Docker (Recommended)

From the project root:

```bash
# Start all services
docker compose up

# Start only backend + dependencies
docker compose up backend postgres redis
```

The backend will be available at `http://localhost:8000`.

**Docker configuration**:
- Image: `python:3.11-slim`
- Bind mount: `./backend:/app` (enables hot reload via `--reload`)
- Port: 8000
- Command override: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
- Depends on: postgres (healthy), redis (healthy)

### Option 2: Local Development

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Note**: Local development requires PostgreSQL with pgvector and Redis running locally.

---

## Environment Variables

Create a `.env` file in the project root:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | None | PostgreSQL connection string (psycopg3 dialect) |
| `REDIS_URL` | No | `redis://localhost:6379/0` | Redis connection URL |
| `OPENAI_API_KEY` | Yes | None | OpenAI API key for AI features |
| `JWT_SECRET_KEY` | Yes | `""` (errors if empty) | JWT token signing secret |
| `JWT_ALGORITHM` | No | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_DAYS` | No | `7` | JWT token expiry in days |
| `ONET_API_KEY` | No | None | O*NET API key (only for scraper scripts) |
| `PCA_MODEL_DIR` | No | Auto-detected | Path to PCA model directory |

### Database URL Formats

```
# Docker (psycopg3 dialect, preferred):
DATABASE_URL=postgresql+psycopg://postgres:postgres@postgres:5432/springais

# Local (auto-normalized by config.py):
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/springais
```

The backend auto-converts `postgresql://` to `postgresql+psycopg://` for psycopg3 compatibility.

### Redis URL

```
# Docker (container-to-container):
REDIS_URL=redis://redis:6379/0

# Local (host-mapped port):
REDIS_URL=redis://localhost:6380
```

Note: Docker maps host port 6380 to container port 6379.

---

## Development Commands

| Command | Description |
|---------|-------------|
| `uvicorn app.main:app --reload` | Start dev server with hot reload |
| `pytest` | Run test suite |
| `pytest -v` | Run tests with verbose output |
| `alembic upgrade head` | Apply all migrations |
| `alembic revision --autogenerate -m "description"` | Generate new migration |
| `alembic downgrade -1` | Rollback last migration |

---

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI entry point (lifespan, middleware, routers)
│   ├── config.py             # Client factories (OpenAI, Redis singletons)
│   ├── database.py           # SQLAlchemy engine, session, get_db()
│   ├── config/
│   │   └── matching_config.py # Scoring weights (80/10/10), match modes, role hierarchy
│   ├── models/               # SQLAlchemy ORM models (15 files, 16 tables)
│   ├── routes/               # API route handlers (7 files)
│   ├── schemas/              # Pydantic request/response schemas (9 files)
│   ├── services/             # Business logic layer (20 files)
│   └── utils/                # Security, text processing, PCA, categorization (6 files)
├── tests/                    # pytest test suite (12 files)
├── alembic/                  # Database migrations (26 versions)
├── backend/models/pca/       # Pre-trained PCA model (pca_v1.pkl)
├── requirements.txt          # Python dependencies
├── Dockerfile                # Container definition
├── alembic.ini               # Migration configuration
└── pytest.ini                # Test configuration
```

---

## Database Setup

### Initial Setup (Docker)

PostgreSQL initialization scripts run automatically on first volume creation:

1. `docker/postgres-init/01_extensions.sql`: Creates `vector` and `pgcrypto` extensions
2. `docker/postgres-init/02_pattern_indexes.sql`: Creates 6 performance indexes on `employees` table

### Running Migrations

```bash
# From backend directory
alembic upgrade head

# Or from Docker
docker compose exec backend alembic upgrade head
```

### Creating a New Migration

```bash
# After modifying SQLAlchemy models
alembic revision --autogenerate -m "description of changes"

# Review the generated migration in alembic/versions/
# Then apply:
alembic upgrade head
```

### Seeding Data

```bash
# Load seed job postings
docker compose exec postgres psql -U postgres -d springais -f /data/seed_job_postings.sql

# Load test employees
docker compose exec postgres psql -U postgres -d springais -f /data/test_employees.sql

# Seed skill taxonomy (via API)
curl -X POST http://localhost:8000/api/skills/taxonomy/seed -H "Authorization: Bearer <token>"
```

---

## Architecture Patterns

### Layered Architecture

```
Routes (API handlers) -> Services (Business logic) -> Models (Data access)
```

- **Routes**: Request validation, auth checks, response formatting. Located in `app/routes/`.
- **Services**: Core business logic, AI pipeline, caching. Located in `app/services/`.
- **Models**: SQLAlchemy ORM definitions. Located in `app/models/`.
- **Schemas**: Pydantic request/response types. Located in `app/schemas/`.

### Adding a New Endpoint

1. Define Pydantic schemas in `app/schemas/`
2. Create or extend a service in `app/services/`
3. Add the route in `app/routes/`
4. Mount the router in `app/main.py` (if new router file)

### Adding a New Model

1. Define the model in `app/models/`
2. Import it in `app/models/__init__.py`
3. Generate migration: `alembic revision --autogenerate -m "add new_table"`
4. Apply migration: `alembic upgrade head`

### Dependency Injection

FastAPI dependencies are used for:
- **Database sessions**: `db: Session = Depends(get_db)` - yields per-request sessions
- **Authentication**: `user: UserProfile = Depends(get_current_user_from_token)` - JWT validation
- **Background tasks**: `background_tasks: BackgroundTasks` - post-response processing

### Singleton Services

Module-level singletons (initialized once, reused across requests):
- `AsyncOpenAI` client (`config.py`)
- Redis connection pool (`config.py`)
- `SkillTaxonomyService` (`services/skill_taxonomy.py`)
- `SkillNormalizerCache` (`services/skill_normalizer.py`)
- `MatchCacheService` (`services/match_cache_service.py`)

---

## Testing

### Configuration (`pytest.ini`)

```ini
[pytest]
asyncio_mode = auto
asyncio_default_fixture_loop_scope = function
testpaths = tests
```

### Running Tests

```bash
# All tests
pytest

# Verbose
pytest -v

# Specific file
pytest tests/test_auth.py

# With coverage (if pytest-cov installed)
pytest --cov=app tests/
```

### Test Structure

```
tests/
├── __init__.py
├── models/                    # Model unit tests
│   ├── conftest.py            # Test fixtures (mock DB sessions, sample data)
│   ├── test_career_path.py
│   ├── test_employee.py
│   ├── test_match.py
│   ├── test_skill_embedding.py
│   └── test_user_profile.py
├── test_auth.py               # Auth endpoint tests
├── test_pattern_service.py    # Pattern service tests (mock data)
├── test_recommendation_endpoints.py
├── test_recommendation_service.py
└── test_security.py           # JWT/bcrypt tests
```

### Mock Libraries

- **fakeredis**: Mock Redis for cache tests
- **pytest-asyncio**: Async test support

### Test Coverage Gaps

Major untested areas:
- `matching_service.py` (core algorithm)
- `embedding_service.py`
- `skill_extractor.py`
- `skill_progress_service.py`
- `roadmap_service.py`
- `hiring_manager_service.py`
- Most route handlers

---

## Data Pipeline Scripts

Scripts in the project root `scripts/` directory:

### Running the Scraper

```bash
# Via Docker (recommended)
docker compose --profile scraper up ey_scraper

# Or locally
python scripts/scrape_ey_jobs.py
```

### Enriching Jobs with AI

```bash
# Extract skills from job descriptions (requires OPENAI_API_KEY)
python scripts/extract_all_job_skills.py

# Generate embeddings for all skills and jobs
python scripts/generate_all_embeddings.py
```

### Training PCA Model

```bash
# One-time setup: train PCA model for embedding dimensionality reduction
python scripts/train_pca_model.py

# Validate PCA model quality
python scripts/validate_embedding_quality.py
```

Output: `backend/backend/models/pca/pca_v1.pkl` and `metadata.json`

### Generating Synthetic Data

```bash
python scripts/generate_synthetic_data.py
python scripts/sql_exporter.py
```

---

## API Documentation

FastAPI auto-generates OpenAPI documentation:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`

---

## Caching

### Redis Cache Layers

| Cache | TTL | Purpose |
|-------|-----|---------|
| Match results | 5 min | Avoid re-running matching algorithm |
| Skill versions | 1 hour | Match cache invalidation trigger |
| Embeddings | 7 days | Avoid duplicate OpenAI API calls |
| Career patterns | 24 hours | Transition analysis results |
| Job skills | 30 days | LLM-extracted skills |

### In-Memory Caches

| Cache | TTL | Max Size |
|-------|-----|----------|
| Global embedding cache | 5 min | Unbounded (thread-locked) |
| Skill taxonomy LRU | None | 1000 entries |
| Skill normalizer | None | Unbounded |

### Cache Invalidation

Match cache is invalidated per-user via background tasks when skills change. Pattern cache has a manual invalidation endpoint. Embedding cache relies on TTL expiry.

---

## Security

### Authentication

- bcrypt password hashing (`utils/security.py`)
- JWT tokens with HS256 algorithm, 7-day expiry
- `get_current_user_from_token()` FastAPI dependency for route protection

### PII Protection

- `utils/text_cleaner.py` strips PII from resume text before LLM processing
- Hiring manager endpoints return only anonymized data

### Best Practices for Development

- Never commit `.env` files (already in `.gitignore`)
- Use strong JWT secret in production (dev value `i-am-dev` is not secure)
- Add rate limiting middleware before production deployment
- Configure production CORS origins (currently only `http://localhost:3000`)

---

## Debugging

### Debug Scripts

Located at `backend/` root:
- `debug_matching.py` through `debug_matching6.py`: 6 iterations of matching algorithm debugging
- `test_embedding_similarity.py`: Test embedding similarity calculations
- `test_fix.py` / `test_fix2.py`: Ad-hoc fix validation

### Useful Endpoints

- `GET /`: Health check (`{"status": "running", "version": "1.0.0"}`)
- `GET /api/skills/debug/modules/{skill_name}`: Debug module data
- `GET /docs`: Swagger UI for interactive API testing
