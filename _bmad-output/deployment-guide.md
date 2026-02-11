# SpringAIS Deployment Guide

**Generated**: 2026-02-11
**Source**: `docker-compose.yml`, Dockerfiles, and integration scan findings

---

## Docker Compose Overview

SpringAIS runs as a multi-service Docker Compose application with 4 core services and 1 on-demand service.

### Service Topology

```
                   ┌─────────────┐
                   │   Frontend   │ Port 3000 (host)
                   │  Node 18    │ Vite dev server
                   │  alpine     │
                   └──────┬──────┘
                          │ VITE_API_URL=http://localhost:8000
                          v
                   ┌─────────────┐
                   │   Backend   │ Port 8000 (host)
                   │ Python 3.11 │ Uvicorn (--reload)
                   │   slim      │
                   └──┬──────┬───┘
                      │      │
           ┌──────────┘      └──────────┐
           v                            v
    ┌─────────────┐             ┌─────────────┐
    │  PostgreSQL  │ Port 5432  │    Redis     │ Port 6380 -> 6379
    │  pgvector    │ (host)     │  7-alpine    │
    │    pg16      │            └─────────────┘
    └─────────────┘

    ┌─────────────┐
    │  ey_scraper  │ Profile: "scraper" (on-demand)
    │ Python 3.11  │ scripts/scrape_ey_jobs.py
    └─────────────┘
```

---

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd SpringAIS

# Create .env file (see Environment Variables section below)
cp .env.example .env  # or create manually

# Start all services
docker compose up -d

# Verify services are running
docker compose ps

# View logs
docker compose logs -f
```

**Access points**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Swagger docs: http://localhost:8000/docs
- PostgreSQL: localhost:5432
- Redis: localhost:6380

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Required
OPENAI_API_KEY=sk-proj-your-key-here
JWT_SECRET_KEY=your-secure-secret-here
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/springais

# Optional (with defaults)
REDIS_URL=redis://localhost:6380
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_DAYS=7
VITE_API_URL=http://localhost:8000

# Only for scraper scripts
ONET_API_KEY=your-onet-key
```

**Important notes**:
- `DATABASE_URL` in `.env` uses `postgresql://` format; Docker Compose overrides this with `postgresql+psycopg://` for the backend container
- `REDIS_URL` in `.env` uses host port 6380; Docker Compose overrides with `redis://redis:6379/0` for container networking
- `JWT_SECRET_KEY` must be set to a strong value for production (dev default `i-am-dev` is not secure)

---

## Service Details

### PostgreSQL (`springais-postgres`)

| Setting | Value |
|---------|-------|
| **Image** | `pgvector/pgvector:pg16` |
| **Port** | 5432:5432 |
| **Database** | `springais` |
| **User** | `postgres` |
| **Password** | `postgres` |
| **Data volume** | `postgres_data:/var/lib/postgresql/data` |
| **Seed data mount** | `./data:/data` |
| **Init scripts** | `./docker/postgres-init/:/docker-entrypoint-initdb.d/:ro` |

**Health check**: `pg_isready -U postgres` (interval: 10s, retries: 5)

**Resource limits**: 1.0 CPU / 512M memory (reservation: 0.5 CPU / 256M)

**Init scripts** (run on first volume creation only):
- `01_extensions.sql`: Creates `vector` and `pgcrypto` extensions
- `02_pattern_indexes.sql`: Creates 6 performance indexes on `employees` table

### Redis (`springais-redis`)

| Setting | Value |
|---------|-------|
| **Image** | `redis:7-alpine` |
| **Port** | 6380:6379 (host:container) |
| **Data volume** | `redis_data:/data` |
| **Authentication** | None (no `requirepass`) |

**Health check**: `redis-cli ping` (interval: 10s, retries: 3)

**Resource limits**: 0.5 CPU / 256M memory (reservation: 0.25 CPU / 128M)

**Note**: Host port is 6380 (not standard 6379) to avoid conflicts with local Redis installations.

### Backend (`springais-backend`)

| Setting | Value |
|---------|-------|
| **Build context** | `./backend/Dockerfile` |
| **Port** | 8000:8000 |
| **Command** | `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000` |
| **Depends on** | postgres (healthy), redis (healthy) |

**Volumes**:
- `./backend:/app` - Source code bind mount (hot reload)
- `./uploads:/app/uploads` - File upload storage
- `./scripts:/app/scripts` - Data pipeline scripts
- `./data:/app/data` - Seed data files

**Environment** (set in docker-compose.yml):
```
DATABASE_URL=postgresql+psycopg://postgres:postgres@postgres:5432/springais
REDIS_URL=redis://redis:6379/0
OPENAI_API_KEY=${OPENAI_API_KEY}
ONET_API_KEY=${ONET_API_KEY}
JWT_SECRET_KEY=${JWT_SECRET_KEY}
JWT_ALGORITHM=${JWT_ALGORITHM:-HS256}
ACCESS_TOKEN_EXPIRE_DAYS=${ACCESS_TOKEN_EXPIRE_DAYS:-7}
```

**Resource limits**: 2.0 CPU / 1G memory (reservation: 0.5 CPU / 512M)

### Frontend (`springais-frontend`)

| Setting | Value |
|---------|-------|
| **Build context** | `./frontend/Dockerfile` |
| **Port** | 3000:3000 |
| **Command** | `npm run dev -- --host` |

**Volumes**:
- `./frontend:/app` - Source code bind mount (HMR)
- `frontend_node_modules:/app/node_modules` - Isolated node_modules

**Environment**: `VITE_API_URL=http://localhost:8000`

**Resource limits**: 1.0 CPU / 512M memory (reservation: 0.25 CPU / 256M)

**Note**: No health check defined. No `depends_on` (frontend connects to backend via browser, not container networking).

### EY Scraper (`springais-ey-scraper`)

| Setting | Value |
|---------|-------|
| **Profile** | `scraper` (on-demand only) |
| **Build context** | `./backend/Dockerfile` |
| **Entry point** | `python scripts/scrape_ey_jobs.py` |
| **Working dir** | `/repo` |
| **Depends on** | postgres (healthy) |

**Start manually**:
```bash
docker compose --profile scraper up ey_scraper
```

**Resource limits**: 1.0 CPU / 512M memory (reservation: 0.25 CPU / 256M)

---

## Named Volumes

| Volume | Purpose | Service |
|--------|---------|---------|
| `postgres_data` | PostgreSQL data directory persistence | postgres |
| `redis_data` | Redis data persistence (AOF/RDB) | redis |
| `frontend_node_modules` | Isolates node_modules from host bind mount | frontend |

---

## Network Configuration

- **Network**: Default Docker Compose bridge network (auto-created)
- **Service discovery**: Services reference each other by name (`postgres`, `redis`, `backend`)
- **Frontend-to-backend**: Browser-side connection via `http://localhost:8000` (not container-to-container)
- **CORS**: Backend allows `http://localhost:3000` only

---

## Database Initialization

### First-Time Setup

1. Start services: `docker compose up -d`
2. PostgreSQL init scripts run automatically (extensions, indexes)
3. FastAPI creates all tables on startup: `Base.metadata.create_all(bind=engine)`
4. Run Alembic migrations for latest schema:
   ```bash
   docker compose exec backend alembic upgrade head
   ```

### Seeding Data

```bash
# Load seed job postings
docker compose exec postgres psql -U postgres -d springais -f /data/seed_job_postings.sql

# Load test employees
docker compose exec postgres psql -U postgres -d springais -f /data/test_employees.sql

# Load synthetic employees
docker compose exec postgres psql -U postgres -d springais -f /data/synthetic_employees_llm.sql

# Seed skill taxonomy via API
curl -X POST http://localhost:8000/api/skills/taxonomy/seed \
  -H "Authorization: Bearer <jwt-token>"
```

### Data Pipeline (Full Enrichment)

```bash
# 1. Scrape job postings
docker compose --profile scraper up ey_scraper

# 2. Extract skills from job descriptions (requires OPENAI_API_KEY)
docker compose exec backend python /app/scripts/extract_all_job_skills.py

# 3. Generate embeddings for skills and jobs
docker compose exec backend python /app/scripts/generate_all_embeddings.py
```

---

## Health Checks

| Service | Check | Interval | Retries |
|---------|-------|----------|---------|
| PostgreSQL | `pg_isready -U postgres` | 10s | 5 |
| Redis | `redis-cli ping` | 10s | 3 |
| Backend | `GET /` returns `{"status": "running"}` | Manual | N/A |
| Frontend | None defined | N/A | N/A |

### Manual Health Verification

```bash
# Check all services
docker compose ps

# Backend health
curl http://localhost:8000/

# PostgreSQL
docker compose exec postgres pg_isready -U postgres

# Redis
docker compose exec redis redis-cli ping
```

---

## Resource Allocation

| Service | CPU Limit | Memory Limit | CPU Reservation | Memory Reservation |
|---------|-----------|-------------|-----------------|-------------------|
| PostgreSQL | 1.0 | 512M | 0.5 | 256M |
| Redis | 0.5 | 256M | 0.25 | 128M |
| Backend | 2.0 | 1G | 0.5 | 512M |
| Frontend | 1.0 | 512M | 0.25 | 256M |
| EY Scraper | 1.0 | 512M | 0.25 | 256M |
| **Total (limits)** | **4.5** | **2.25G** | **1.5** | **1.25G** |
| **Total (with scraper)** | **5.5** | **2.75G** | **1.75** | **1.5G** |

---

## Common Operations

### Start/Stop Services

```bash
# Start all services (detached)
docker compose up -d

# Stop all services
docker compose down

# Stop and remove volumes (destructive - deletes all data)
docker compose down -v

# Restart a specific service
docker compose restart backend

# Rebuild a specific service (after Dockerfile change)
docker compose up -d --build backend
```

### Viewing Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend

# Last 100 lines
docker compose logs --tail=100 backend
```

### Accessing Containers

```bash
# Backend shell
docker compose exec backend bash

# PostgreSQL CLI
docker compose exec postgres psql -U postgres -d springais

# Redis CLI
docker compose exec redis redis-cli
```

### Database Operations

```bash
# Run migrations
docker compose exec backend alembic upgrade head

# Create new migration
docker compose exec backend alembic revision --autogenerate -m "description"

# Rollback
docker compose exec backend alembic downgrade -1

# Database backup
docker compose exec postgres pg_dump -U postgres springais > backup.sql

# Database restore
cat backup.sql | docker compose exec -T postgres psql -U postgres -d springais
```

---

## Production Considerations

The current setup is **development-oriented**. For production deployment:

1. **Frontend**: Replace Vite dev server with production build served by nginx (multi-stage Dockerfile exists but is not wired)
2. **CORS**: Update `allow_origins` in `backend/app/main.py` from `["http://localhost:3000"]` to production domain(s)
3. **JWT Secret**: Use a strong, randomly generated secret (not `i-am-dev`)
4. **Redis Authentication**: Configure `requirepass` for Redis
5. **Database Credentials**: Use non-default credentials and connection pooling service (PgBouncer)
6. **Rate Limiting**: Add API rate limiting middleware (currently none)
7. **HTTPS**: Add TLS termination (nginx or load balancer)
8. **Health Checks**: Add health check for frontend container
9. **Logging**: Configure structured logging (current setup uses default uvicorn logging)
10. **Monitoring**: Add metrics collection (Prometheus, DataDog, etc.)
11. **Secrets Management**: Use a secrets manager instead of `.env` files
12. **Horizontal Scaling**: Backend is stateless (except module-level caches) and can be scaled behind a load balancer
