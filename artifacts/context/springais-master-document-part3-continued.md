
---

# 13. Data and Integration

## 13.1. API Contracts (Design Reference)

**Source**: `reference-docs/integration/api-contracts.md`
**Last Updated**: 2026-01-06
**Purpose**: Frontend-backend API contracts for integration blocks

### Contract Definition

Each contract specifies: request format (URL, method, headers, body), response format (status codes, JSON structure), error handling (error codes, messages), and performance targets (latency, caching).

### Authentication Contract

**POST /api/auth/login**
- Request: `{email: string, password: string}`
- Response (200): `{token: string, user: {id, email, name, role, department}}`
- Errors: 401 (invalid credentials), 400 (missing fields)

### Skills Dashboard Contract

**GET /api/employees/{employee_id}**
- Response (200): Employee object with skills array `[{name, proficiency, years_experience?, source?}]`
- Performance: <100ms

**POST /api/skill-extraction**
- Request: multipart/form-data with employee_id and file (PDF/DOCX)
- Response (200): `{employee_id, skills_extracted: [{name, proficiency, years_experience?, confidence}], embedding_created, processing_time_seconds}`
- Performance: 10-15 seconds (GPT-5.2 Instant call)
- Max file size: 10 MB

### Match Results Contract

**GET /api/matches/employee/{employee_id}**
- Query params: `min_score?`, `department?`, `location?`, `limit?`
- Response (200): `{employee_id, employee_name, matches: [{job_id, title, department, location, similarity_score, composite_score, overlapping_skills, missing_skills, transferable_skills?, gap_count}], total_count, cached}`
- Performance: <1 second (uncached), <100ms (cached)
- Caching: Redis, 1-hour TTL, invalidated on skill update

### Career Path Contract

**GET /api/career-paths/employee/{employee_id}**
- Query params: `depth?` (1-3, default 2)
- Response (200): `{employee_id, current_role, graph: {nodes: [{id, title, level, is_current}], edges: [{from, to, transition_count, avg_time_months, success_rate}]}, cached}`
- Performance: <300ms
- Caching: Redis, 1-hour TTL

### Success Patterns Contract

**GET /api/success-patterns**
- Query params: `from_role` (required), `to_role` (required)
- Response (200): `{from_role, to_role, metrics: {total_transitions, successful_transitions, success_rate, avg_time_months, median_time_months, avg_performance_score}, top_skills: [{name, frequency, avg_proficiency}]}`
- Performance: <200ms
- Caching: Redis, 24-hour TTL

### Error Response Format

```typescript
{
  error: string;
  detail?: string | object;
  status_code: number;
  timestamp: string;  // ISO 8601
}
```

### Contract Testing

Frontend: Vitest contract tests with mock backend (check response shape).
Backend: pytest contract tests with FastAPI TestClient (check status codes and field presence).

### Versioning Strategy

Current: No versioning (MVP). Future: URL versioning (`/api/v1/...`), 6-month deprecation period.

---

## 13.2. Testing Strategy

**Source**: `reference-docs/integration/testing-strategy.md`
**Last Updated**: 2026-01-06

### Testing Pyramid

- **Unit Tests (60%)**: pytest (backend), Vitest (frontend) -- Blocks A-L
- **Integration Tests (30%)**: FastAPI TestClient, React Testing Library -- Blocks M-P
- **E2E Tests (10%)**: Playwright -- Block Q

### Backend Unit Tests (pytest)

```python
def test_calculate_composite_score():
    service = MatchingService()
    score = service._calculate_composite_score(similarity=0.8, experience_match=0.9, success_pattern=0.7)
    expected = 0.50 * 0.8 + 0.25 * 0.9 + 0.25 * 0.7
    assert score == pytest.approx(expected, rel=0.01)
```

### Frontend Unit Tests (Vitest)

```typescript
describe('SkillCard', () => {
  it('renders skill name and proficiency', () => {
    render(<SkillCard name="Python" proficiency="Expert" />);
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('Expert')).toBeInTheDocument();
  });
});
```

### Backend Integration Tests

Login + authenticated request patterns. Check: 200 with matches, 401 without token, 403 for unauthorized access.

### Frontend Integration Tests

React Testing Library with mocked API (vi.spyOn). QueryClientProvider wrapper. Wait for async data with `waitFor()`.

### E2E Tests (Playwright)

Full user journeys: login -> navigate to matches -> view match card -> apply. Graceful handling of missing skills state.

### Performance Testing (Locust)

100 concurrent users target. Match query <1 second (p95). API errors <1%.

### Security Testing

OWASP ZAP automated scan for SQL injection, XSS, missing security headers, JWT validation.

### Lighthouse Audit Targets

Performance >85, Accessibility >90, Best Practices >90.

### Test Coverage Targets

Backend services >80%, frontend components >70%, integration tests for all critical paths, E2E for all user journeys.

### CI/CD Pipeline (Future)

GitHub Actions with backend-tests, frontend-tests, and e2e-tests jobs.

---

## 13.3. Integration Patterns

**Source**: `docs/integration_patterns.md`

### Authenticated API Calls

Frontend uses shared API client that injects JWT token into every request:
```ts
import api from '../services/api';
const response = await api.get('/skills/recommendations');
```

### Auth Lifecycle

1. Login/register returns `{token, user}`
2. Store token in `localStorage`
3. API client injects `Authorization: Bearer <token>`
4. 401 responses clear token and redirect to `/login`

### Skill Recommendations (Hybrid)

- `GET /api/skills/recommendations` for profile "My Skills" view
- `PATCH /api/skills/recommendations/{skill}/status` to update status

### Save Match Trigger

`await api.post('/matches/save', payload)` -- Backend refreshes recommendations automatically.

### Troubleshooting

- **401 on every request**: Verify `Authorization: Bearer <token>` is set and `JWT_SECRET_KEY` matches backend config
- **CORS errors**: Ensure backend allows frontend origin and `Authorization` header
- **User logged out unexpectedly**: Check token expiration and system clock skew

---

## 13.4. EY Job Scraper Guide

**Source**: `docs/scraping_guide.md`

### Overview

`scripts/scrape_ey_jobs.py` scrapes job listings from `careers.ey.com` and upserts into `job_postings` table.

### Prerequisites

Docker stack with PostgreSQL running, backend deps installed (requests, beautifulsoup4, lxml, tqdm, sqlalchemy, psycopg).

### Usage

```bash
python scripts/scrape_ey_jobs.py --limit 25
```

**Flags**: `--dry-run` (no DB writes), `--limit N` (cap postings), `--locationsearch "United States"`, `--service-line Tax|Assurance|Consulting`, `--use-cache` (cached HTML).

### Scheduling

- Windows Task Scheduler or Linux cron (`0 2 * * *`)
- Docker: `docker compose --profile scraper run --rm ey_scraper --limit 25`

### Logs

`logs/scraper.log` and `logs/scraper_errors.log`.

### Quick DB Checks

```sql
SELECT COUNT(*) FROM job_postings;
SELECT COUNT(*) FILTER (WHERE is_active = TRUE) AS active, COUNT(*) FILTER (WHERE is_active = FALSE) AS archived FROM job_postings;
```

---

## 13.5. Scraping Notes

**Source**: `docs/scraping_notes.md`

### Key Findings

- `ey.com/en_us/careers` is marketing page only (no job links in HTML)
- **Actual job listings**: `https://careers.ey.com/ey/search/` (server-rendered HTML, no Selenium needed)
- ~50 job links per page, pagination via `startrow=25` query parameter
- Individual job URL pattern: `/ey/job/<slug>/<job_id>/` (numeric tail is stable `external_id`)

### HTML Selectors

**Search results**: `a.jobTitle-link[href]` (de-dupe by external_id due to responsive duplicates)

**Job detail page**: `h1` (title), `[data-careersite-propertyid=description]` (description), `.joblayouttoken-label + <span>` (Location, Date, Requisition ID)

### robots.txt

`ey.com/robots.txt` is broadly permissive. Use 1-2s delays and reasonable crawl rate.

---

## 13.6. Mock Data Formats

**Source**: `reference-docs/data/mock-data-formats.md`
**Last Updated**: 2026-01-06

### Purpose

Standard mock data structures for frontend development before backend integration (Blocks H-L). Replace with real API calls in Blocks M-P.

### Data Types

**Employee**: `{id, email, name, role, department, service_line, location, experience_years, hire_date}`

**Skill**: `{name, proficiency: 'Beginner'|'Intermediate'|'Advanced'|'Expert', years_experience?, source?}`

**JobMatch**: `{job_id, title, department, location, similarity_score, composite_score, overlapping_skills, missing_skills, transferable_skills?, gap_count}`

**CareerGraph**: `{nodes: [{id, title, level, is_current}], edges: [{from, to, transition_count, avg_time_months, success_rate}]}`

**SuccessPattern**: `{from_role, to_role, metrics: {total_transitions, successful_transitions, success_rate, avg_time_months, median_time_months, avg_performance_score}, top_skills: [{name, frequency, avg_proficiency}]}`

**LoginResponse**: `{token: string, user: {id, email, name, role, department}}`

**SkillExtractionResponse**: `{employee_id, skills_extracted: [{name, proficiency, years_experience?, confidence}], embedding_created, processing_time_seconds}`

### Mock API Service Pattern

```typescript
const MOCK_DELAY = 500;
export const mockApi = {
  getMatches: async (employeeId: number): Promise<JobMatch[]> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    return mockMatches;
  },
};
```

### Switching Mock/Real API

```typescript
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
export const api = USE_MOCK ? mockApi : realApi;
```

---

## 13.7. Database Seeding

**Source**: `reference-docs/data/seed-scripts.md`
**Last Updated**: 2026-01-06

### Seeding Overview

1. **Role hierarchy**: 25 roles across Assurance, Tax, Consulting
2. **Synthetic employees**: 900 employees
3. **Job postings**: 30-50 scraped jobs
4. **Skills and embeddings**: For matching
5. **Career transitions**: 5,000 transitions for success patterns

### Quick Start

```bash
cd backend
python scripts/seed_database.py
# Or individually:
python scripts/seed_roles.py
python scripts/generate_synthetic_employees.py
python scripts/scrape_job_postings.py
python scripts/generate_embeddings.py
```

### Seed Scripts

**seed_roles.py**: Creates 25 roles (Consulting: 9 levels Analyst->Partner, Assurance: 5 levels Staff->Partner, Tax: 5 levels Staff->Partner).

**generate_synthetic_employees.py**: 900 employees (300 per service line). Template-based skills by role. Cost ~$2 (GPT for variation).

**scrape_job_postings.py**: EY careers site scraper. Extracts job details and required skills.

**generate_embeddings.py**: text-embedding-3-large for employee skill text and job descriptions. Cost ~$0.02.

### Team Data Sharing (Git-Based)

One person generates, pg_dump to SQL, commit to `data-dumps` branch. Teammates pull and load. Benefits: only one person pays API costs, consistent data, version controlled.

### Minimal Seed (Testing)

1 role, 10 employees, 5 jobs -- no AI costs needed.

---

## 13.8. Synthetic Data Generation

**Source**: `reference-docs/data/synthetic-data-generation.md`
**Last Updated**: 2026-01-06

### Hybrid Approach

- **Hard-coded templates** for structure and baseline quality ($0)
- **LLM generation** for realistic variation (~$2 total)
- Cost: ~$2 for 900 employees. Time: ~2 minutes.

### Data Volume

| Data Type | Count | Method | Cost |
|-----------|-------|--------|------|
| Roles | 25 | Hard-coded | $0 |
| Employees | 900 | Template + LLM | $2 |
| Skills/employee | 12 avg | Template + O*NET | $0 |
| Job postings | 30-50 | Scraped + manual | $0 |
| Career transitions | 5,000 | Simulated | $0 |
| Performance reviews | 4,500 | LLM variation | $1.50 |
| **Total** | **~20K rows** | | **~$2** |

### Employee Generation

Hard-coded: SERVICE_LINE_DISTRIBUTION (33/33/34%), LEVEL_DISTRIBUTION (pyramid: 25% entry to <1% partners), LOCATIONS (6 cities), DEPARTMENTS by service line.

Skills templates: required (95-100%), common (60-80%), rare (30% chance) per role.

### LLM-Enhanced Realism

**GPT-5-Nano** ($0.04): Individual performance metric variation within ranges.
**GPT-5.2-Instant** ($1.50): Realistic peer feedback themes (2-3 snippets per employee).

### Career Transition Simulation

Probabilistic based on EY promotion rates: Analyst->Associate 85%, Consultant->Sr. Consultant 72%, Sr. Consultant->Manager 68%, Manager->Sr. Manager 55%, Sr. Manager->Director 40%, Director->Partner 25%.

### Data Quality Checks

Role distribution validation (pyramid structure, +/-10% tolerance), performance metric correlation (higher roles -> better performance), career progression realism (no level skips, min 12 months per role), skill distribution (core skills in 90%+ of role holders), no impossible patterns (junior roles capped experience, mentees <= years).

---

## 13.9. Data Generation Plan

**Source**: `_bmad-output/data-generation-plan.md`
**Created**: 2026-01-02
**Status**: Implementation Ready

### Purpose

Synthetic employees are the foundation of success pattern analysis. When a user asks "What does it take to become a Senior Analyst?", the system analyzes synthetic employees to show common skills, performance metrics, career paths, and feedback themes.

### EY Organizational Structure

**Assurance** (300 employees): Staff(60) -> Senior(90) -> Manager(80) -> Sr. Manager(50) -> Partner(20). Core skills: Accounting, Audit, GAAP, Financial Reporting, Risk Assessment.

**Tax** (300 employees): Staff(60) -> Senior(90) -> Manager(80) -> Sr. Manager(50) -> Partner(20). Core skills: Tax Law, Tax Planning, Tax Compliance, Tax Research, Excel.

**Consulting** (300 employees): Analyst(40) -> Associate(45) -> Sr. Associate(50) -> Consultant(50) -> Sr. Consultant(45) -> Manager(40) -> Sr. Manager(20) -> Director(7) -> Partner(3). Core skills: Strategy, Client Management, Project Management, Stakeholder Management.

### Focus Areas (30% of employees)

**Assurance**: Audit, Financial Reporting, Risk & Compliance, SEC Reporting, Internal Controls, Fraud Investigation.

**Tax**: Corporate Tax, International Tax, Transfer Pricing, M&A Tax, Tax Technology, SALT, Estate Planning.

**Consulting Technology**: Cloud & Infrastructure, Data & Analytics, Cybersecurity, AI & Machine Learning.

**Consulting Business**: Strategy, Operations, Finance Transformation, Supply Chain, HR & Workforce, Customer Experience.

### Role Template Structure

Each template defines: role_name, service_line, level, core_skills, common_skills, years_experience_range, performance_ranges (utilization, client_satisfaction, mentees, certifications), focus_areas, count.

### LLM Prompt Templates

**GPT-5 Nano (metrics)**: Generate `{count}` employees with exact years, performance metrics (financial, compliance, quality, development, people), soft skills (3-6 from pool), additional skills (2-4 from common), career history (no level skips, 18-36 months per role), optional focus area (30%).

**GPT-5.2 Instant (feedback)**: 2-3 authentic peer feedback snippets per employee reflecting performance level. Natural language, 15-30 words each, include strengths and development areas.

### Multi-Layer Validation

5 validation checks: role distribution, performance correlation, career progression, skill distribution, no impossible patterns. Regenerate problematic employees if validation fails.

### Cost Breakdown

GPT-5-Nano (metrics): ~$0.04 (15 batches of 60).
GPT-5.2-Instant (feedback): ~$1.50 (15 batches).
Total: ~$1.54 (budgeted $2 with buffer).

### Implementation Steps

1. Define role templates (manual, 1-2 hours)
2. Scrape EY job postings (optional)
3. Generate synthetic employees (~2 minutes, ~$2)
4. Save to database + create SQL dump
5. Git-based team sharing via data-dumps branch

---

## 13.10. Integration Scan Findings

**Source**: `_bmad-output/integration-scan-findings.md`
**Generated**: 2026-02-11

### Frontend-Backend Communication

HTTP REST API only (no WebSocket, SSE, or GraphQL). Axios-based APIClient with JWT Bearer token interceptor. Separate auth service instance (no `/api` prefix for auth routes).

### CORS Configuration

Backend allows `http://localhost:3000` only. No production origins configured.

### API Path Mapping

Auth endpoints: `http://localhost:8000/auth/*` (no `/api` prefix).
All other endpoints: `http://localhost:8000/api/*`.

### Shared Types

No shared type system. Frontend TypeScript interfaces defined independently from backend Pydantic schemas. Manual mapping functions transform responses. Key discrepancies: Match.id conflated with job_id, nested score objects, PROFICIENCY_LABELS duplicated.

### Authentication Flow

Login -> bcrypt verify -> JWT (HS256, 7-day expiry, payload: user_id, email, exp) -> localStorage -> Bearer token on all requests -> PyJWT verify on backend.

### Docker Compose (4 core + 1 on-demand)

- **postgres** (pgvector/pgvector:pg16): Port 5432, persistent volume, init scripts (extensions + indexes), health check
- **redis** (redis:7-alpine): Port 6380->6379, no auth, health check
- **backend** (Python 3.11-slim): Port 8000, uvicorn --reload, depends on postgres+redis
- **frontend** (Node 18-alpine): Port 3000, Vite dev server, no health check
- **ey_scraper** (profile: scraper): On-demand, same backend Dockerfile

### Database Integration

SQLAlchemy 2.0 with psycopg3 dialect. QueuePool(pool_size=20, max_overflow=30). 16 tables, 26 Alembic migrations. pgvector HNSW index on skill_embeddings (cosine distance, 1536 dims).

### Redis Caching

| Cache | TTL | Purpose |
|-------|-----|---------|
| Match results | 5 min | Avoid re-running matching |
| Skill versions | 1 hour | Invalidation trigger |
| Embeddings (L1) | 7 days | Avoid duplicate OpenAI calls |
| Pattern cache | 24 hours | Transition analysis |
| Job skill extraction | 30 days | LLM-extracted skills |

In-memory caches: global embedding cache (5 min), skill taxonomy LRU (1000 entries), skill normalizer (unbounded).

### AI/ML Pipeline

Full flow: User uploads resume -> text extraction -> PII stripping -> GPT-5.2-chat-latest skill extraction -> text-embedding-3-large (3072 dims) -> PCA reduction (1536) -> pgvector storage -> matching algorithm (80/10/10 weighted: taxonomy + exact + HNSW + Jaccard) -> Redis cache -> progressive frontend loading.

### Data Pipeline

Scrape (careers.ey.com, BeautifulSoup) -> Enrich (LLM skill extraction, Redis 30-day cache) -> Vectorize (embeddings + PCA) -> Synthetic data (GPT + templates + validation) -> PCA model training (200+ skills, 1600 variations).

### Testing Infrastructure

Backend: pytest + pytest-asyncio, 12 test files, fakeredis for cache testing. Major gaps in matching/embedding/skill_progress/roadmap tests.
Frontend: Vitest + React Testing Library, minimal test files found.
E2E: Playwright dependency listed but no test files found.

### Notable Integration Issues

1. No API proxy in Docker (browser makes CORS requests)
2. Hardcoded CORS origin (localhost:3000 only)
3. No rate limiting
4. No shared type contract
5. Auth service uses separate Axios instance
6. Dev-only frontend Dockerfile
7. No frontend health check
8. Redis port confusion (6380 host, 6379 container)
9. Match/Job ID conflation
10. No WebSocket/SSE for long-running operations

---

# 14. Database and Deployment

## 14.1. Database Setup Guide

**Source**: `_bmad-output/database-setup-guide.md`
**Last Updated**: 2026-01-02

### Quick Start (Teammates Loading Data)

```bash
docker-compose up postgres -d
git fetch origin && git checkout data-dumps && git pull
psql -h localhost -U postgres springais < data/synthetic_employees.sql
git checkout main
```

### Initial Setup (One-Time)

1. Clone repository
2. Copy `.env.example` to `.env`, set `OPENAI_API_KEY` and `ONET_API_KEY`
3. `docker-compose up -d`
4. Create database and enable pgvector:
   ```bash
   docker exec -it springais-postgres psql -U postgres
   CREATE DATABASE springais;
   \c springais
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
5. Create `data-dumps` branch for SQL dumps
6. Run `python scripts/init_database.py`

### Team Collaboration: Git-Based Data Sharing

One designated "data owner" generates data (~$2) and dumps to SQL. Committed to `data-dumps` branch (never merged to main). Teammates pull and load with `psql < data/synthetic_employees.sql`. Everyone verifies: `SELECT COUNT(*) FROM employees;` should show 900.

### Core Database Schema

**employees**: String PK (EMP-XXXXXX), service_line, current_role, role_level, years_experience, skills (JSONB, GIN indexed), performance_metrics (JSONB), career_history (JSONB), feedback_themes (TEXT[]), notable_achievement (TEXT). Indexes: service_line, role, role_level, service_line+role (compound), GIN on skills.

**roles**: service_line, role_name, role_level, core_skills (JSONB), common_skills (JSONB), min/max years, focus_areas (TEXT[]). Unique on (service_line, role_name).

**job_postings**: UUID PK, title, service_line, location, posted/closed dates, required/preferred skills (TEXT[]), description (TEXT), posting_url, search_vector (TSVECTOR). Indexes: service_line, posted_date, active filter, GIN search.

**skill_embeddings**: skill_name PK, embedding vector(3072), HNSW index (vector_cosine_ops).

### Common Operations

Success pattern queries: employees by service_line and role, average performance metrics, most common skills with percentages.

Vector similarity search: `1 - (embedding <=> user_embedding) AS similarity ORDER BY embedding <=> user_embedding LIMIT 10`.

### Troubleshooting

- `psql: command not found`: Install PostgreSQL client tools
- pg_dump version mismatch: Upgrade or use Docker version
- Database doesn't exist: `CREATE DATABASE springais;`
- pgvector not installed: `CREATE EXTENSION vector;`
- Team data mismatch: Verify same git commit on data-dumps branch
- Large dump files: Check for unnecessary test data

### Best Practices

- Test locally before pushing generated data
- Include date and count in commit messages
- Don't regenerate frivolously ($2 each time)
- Pull before working, verify after loading
- Keep dumps under 50MB, use gzip if needed

---

## 14.2. Deployment Guide

**Source**: `_bmad-output/deployment-guide.md`
**Generated**: 2026-02-11

### Docker Compose Overview

4 core services + 1 on-demand:

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| postgres | pgvector/pgvector:pg16 | 5432 | Database with vector search |
| redis | redis:7-alpine | 6380->6379 | Caching layer |
| backend | Python 3.11-slim | 8000 | FastAPI + Uvicorn |
| frontend | Node 18-alpine | 3000 | Vite dev server |
| ey_scraper | Python 3.11-slim | N/A | On-demand job scraper |

### Quick Start

```bash
git clone <repository-url> && cd SpringAIS
cp .env.example .env  # Set OPENAI_API_KEY, JWT_SECRET_KEY
docker compose up -d
```

Access: Frontend http://localhost:3000, Backend http://localhost:8000, Swagger http://localhost:8000/docs.

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | N/A | OpenAI API key |
| `JWT_SECRET_KEY` | Yes | N/A | JWT signing secret |
| `DATABASE_URL` | Yes | N/A | PostgreSQL connection |
| `REDIS_URL` | No | redis://localhost:6380 | Redis URL |
| `JWT_ALGORITHM` | No | HS256 | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_DAYS` | No | 7 | Token expiry |
| `VITE_API_URL` | No | http://localhost:8000 | Backend URL |
| `ONET_API_KEY` | No | N/A | For scraper only |

Docker Compose overrides: DATABASE_URL uses `postgresql+psycopg://` (psycopg3), REDIS_URL uses `redis://redis:6379/0` (container networking).

### Service Configuration Details

**PostgreSQL**: pgvector:pg16, persistent volume, init scripts (01_extensions.sql: vector+pgcrypto, 02_pattern_indexes.sql: 6 indexes), health check (pg_isready), resources 1.0 CPU / 512M.

**Redis**: 7-alpine, host port 6380, no authentication, health check (redis-cli ping), resources 0.5 CPU / 256M.

**Backend**: Python 3.11-slim, uvicorn --reload, bind mounts (backend, uploads, scripts, data), depends on postgres+redis healthy, resources 2.0 CPU / 1G.

**Frontend**: Node 18-alpine, Vite dev server, bind mount + isolated node_modules volume, no health check, resources 1.0 CPU / 512M.

**EY Scraper**: Profile "scraper" (on-demand only), same backend Dockerfile, mounts entire project root, depends on postgres.

### Named Volumes

postgres_data (PostgreSQL persistence), redis_data (Redis persistence), frontend_node_modules (isolated from host).

### Network

Default Docker Compose bridge. Services reference by name. Frontend connects via browser (localhost:8000), not container networking.

### Database Initialization

1. Start services
2. Init scripts run automatically (extensions, indexes)
3. FastAPI creates tables on startup (`Base.metadata.create_all`)
4. Run Alembic migrations: `docker compose exec backend alembic upgrade head`
5. Seed data from `/data/*.sql`

### Data Pipeline (Full Enrichment)

```bash
docker compose --profile scraper up ey_scraper             # Scrape jobs
docker compose exec backend python /app/scripts/extract_all_job_skills.py  # Extract skills
docker compose exec backend python /app/scripts/generate_all_embeddings.py # Generate embeddings
```

### Health Checks

| Service | Check | Interval | Retries |
|---------|-------|----------|---------|
| PostgreSQL | pg_isready | 10s | 5 |
| Redis | redis-cli ping | 10s | 3 |
| Backend | GET / (manual) | N/A | N/A |
| Frontend | None | N/A | N/A |

### Resource Allocation

| Service | CPU Limit | Memory Limit |
|---------|-----------|-------------|
| PostgreSQL | 1.0 | 512M |
| Redis | 0.5 | 256M |
| Backend | 2.0 | 1G |
| Frontend | 1.0 | 512M |
| **Total** | **4.5** | **2.25G** |

### Common Operations

```bash
docker compose up -d            # Start all
docker compose down             # Stop all
docker compose down -v          # Stop + delete volumes (destructive)
docker compose restart backend  # Restart service
docker compose logs -f backend  # View logs
docker compose exec backend bash              # Shell access
docker compose exec postgres psql -U postgres # Database CLI
docker compose exec backend alembic upgrade head  # Run migrations
docker compose exec postgres pg_dump -U postgres springais > backup.sql  # Backup
```

### Production Considerations

1. **Frontend**: Replace Vite dev server with nginx (production build)
2. **CORS**: Update allow_origins to production domain(s)
3. **JWT Secret**: Use strong random secret (not `i-am-dev`)
4. **Redis**: Configure `requirepass`
5. **Database**: Non-default credentials + PgBouncer
6. **Rate Limiting**: Add API rate limiting middleware
7. **HTTPS**: TLS termination via nginx or load balancer
8. **Health Checks**: Add frontend container health check
9. **Logging**: Structured logging (replace default uvicorn)
10. **Monitoring**: Prometheus, DataDog, etc.
11. **Secrets**: Use secrets manager instead of .env files
12. **Scaling**: Backend is stateless, scalable behind load balancer

---

*End of Part 3: Implementation Details*

