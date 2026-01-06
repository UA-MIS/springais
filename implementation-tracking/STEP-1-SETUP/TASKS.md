# STEP 1: Project Setup - TASKS

**Block:** STEP-1-SETUP
**Total Tasks:** 15
**Completed:** 0/15 (0%)

---

## Progress Tracker

### Phase 1: Project Structure (Tasks 1-3)
- [ ] **Task 1:** Create project folder structure
  - [ ] Create `backend/app/models/` directory
  - [ ] Create `backend/app/routes/` directory
  - [ ] Create `backend/app/services/` directory
  - [ ] Create `backend/app/utils/` directory
  - [ ] Create `frontend/src/pages/` directory
  - [ ] Create `frontend/src/components/` directory
  - [ ] Create `frontend/src/lib/` directory
  - [ ] Create `data/` directory
  - [ ] Create `scripts/` directory

- [ ] **Task 2:** Create Docker Compose configuration
  - [ ] Write `docker-compose.yml` with postgres, redis, backend, frontend services
  - [ ] Configure health checks for postgres and redis
  - [ ] Set up volume mounts for development
  - [ ] Configure environment variable passing

- [ ] **Task 3:** Create `.gitignore` file
  - [ ] Add Python ignores
  - [ ] Add Node ignores
  - [ ] Add Docker ignores
  - [ ] Add IDE ignores
  - [ ] Add `.env` to gitignore

### Phase 2: Backend Setup (Tasks 4-6)
- [ ] **Task 4:** Create backend Dockerfile
  - [ ] Write `backend/Dockerfile`
  - [ ] Install system dependencies (gcc, postgresql-client)
  - [ ] Set working directory
  - [ ] Configure Python dependencies installation

- [ ] **Task 5:** Create `backend/requirements.txt`
  - [ ] Add fastapi==0.109.0
  - [ ] Add uvicorn[standard]==0.27.0
  - [ ] Add sqlalchemy==2.0.25
  - [ ] Add psycopg2-binary==2.9.9
  - [ ] Add pgvector==0.2.4
  - [ ] Add redis==5.0.1
  - [ ] Add python-dotenv==1.0.0
  - [ ] Add pydantic==2.5.3
  - [ ] Add openai==1.10.0
  - [ ] Add langchain dependencies
  - [ ] Add beautifulsoup4==4.12.3

- [ ] **Task 6:** Create FastAPI application skeleton
  - [ ] Write `backend/app/main.py` with FastAPI app
  - [ ] Add CORS middleware
  - [ ] Create root endpoint `/`
  - [ ] Create health endpoint `/health`
  - [ ] Write `backend/app/database.py` with SQLAlchemy setup
  - [ ] Create `get_db()` dependency function
  - [ ] Create empty `backend/app/models/__init__.py`
  - [ ] Create empty `backend/app/routes/__init__.py`

### Phase 3: Database Schema (Tasks 7-8)
- [ ] **Task 7:** Write database initialization SQL
  - [ ] Create `scripts/init_database.sql`
  - [ ] Add CREATE EXTENSION vector
  - [ ] Create `employees` table with indexes
  - [ ] Create `roles` table
  - [ ] Create `job_postings` table with full-text search
  - [ ] Create `skill_embeddings` table with vector index
  - [ ] Create `users` table
  - [ ] Create `matches` table with foreign keys

- [ ] **Task 8:** Initialize database
  - [ ] Start Docker services: `docker-compose up postgres -d`
  - [ ] Wait for postgres to be ready
  - [ ] Run `docker exec -i springais-postgres psql -U postgres springais < scripts/init_database.sql`
  - [ ] Verify tables created: `\dt` in psql
  - [ ] Verify indexes created: `\di` in psql
  - [ ] Verify pgvector extension: `SELECT * FROM pg_extension WHERE extname = 'vector';`

### Phase 4: Frontend Setup (Tasks 9-11)
- [ ] **Task 9:** Create frontend Dockerfile
  - [ ] Write `frontend/Dockerfile`
  - [ ] Set Node 18 alpine base image
  - [ ] Configure npm install
  - [ ] Set up dev server command

- [ ] **Task 10:** Initialize React app with Vite
  - [ ] Run `npm create vite@latest frontend -- --template react-ts`
  - [ ] Install base dependencies
  - [ ] Verify app runs: `npm run dev`

- [ ] **Task 11:** Install frontend dependencies
  - [ ] Install `react-router-dom@6`
  - [ ] Install `@tanstack/react-query`
  - [ ] Install `axios`
  - [ ] Install Tailwind CSS: `tailwindcss postcss autoprefixer`
  - [ ] Install `recharts`
  - [ ] Install `react-flow-renderer`
  - [ ] Run `npx shadcn-ui@latest init`
  - [ ] Configure Tailwind in `tailwind.config.js`
  - [ ] Add Tailwind directives to `index.css`

### Phase 5: Frontend Application (Tasks 12)
- [ ] **Task 12:** Create frontend skeleton
  - [ ] Write `frontend/src/main.tsx` with React Query provider
  - [ ] Add BrowserRouter wrapper
  - [ ] Write `frontend/src/App.tsx` with basic routes
  - [ ] Create placeholder HomePage component
  - [ ] Create placeholder LoginPage component
  - [ ] Add basic Tailwind styling

### Phase 6: Environment & Git (Tasks 13-14)
- [ ] **Task 13:** Create environment configuration
  - [ ] Create `.env.example` with all variables documented
  - [ ] Create `.env` from example (gitignored)
  - [ ] Add DATABASE_URL
  - [ ] Add REDIS_URL
  - [ ] Add OPENAI_API_KEY placeholder
  - [ ] Add ONET_API_KEY placeholder
  - [ ] Add VITE_API_URL

- [ ] **Task 14:** Create Git data branch
  - [ ] Create branch: `git checkout -b data-dumps`
  - [ ] Push branch: `git push -u origin data-dumps`
  - [ ] Add README in data-dumps explaining purpose
  - [ ] Return to main: `git checkout main`

### Phase 7: Verification & Documentation (Task 15)
- [ ] **Task 15:** Verify complete setup
  - [ ] Run `docker-compose up -d`
  - [ ] Verify all services running: `docker-compose ps`
  - [ ] Test backend: `curl http://localhost:8000/health`
  - [ ] Test frontend: Open http://localhost:3000 in browser
  - [ ] Test database: Connect with psql and check tables
  - [ ] Test Redis: `docker exec springais-redis redis-cli ping`
  - [ ] Create `README.md` with setup instructions
  - [ ] Document troubleshooting common issues

---

## Update Instructions

**When you complete a task:**
1. Check the box: `- [x] Task name`
2. Update the "Completed" count at the top
3. Update `PROJECT-STATUS.md`:
   - Find "STEP-1-SETUP" row
   - Update Progress column (e.g., "3/15 tasks")
   - Update percentage

**When ALL tasks complete:**
1. Change status in `PROJECT-STATUS.md` from ⏸️ to ✅
2. Update Progress to "15/15 tasks (100%)"
3. Update "Overall Progress" section
4. Commit: `git add . && git commit -m "Complete STEP-1-SETUP"`

---

## Acceptance Criteria

All tasks must be complete AND:
- [ ] `docker-compose up` runs without errors
- [ ] Backend responds with `{"status": "healthy"}` at /health
- [ ] Frontend displays homepage at localhost:3000
- [ ] Database has 6 tables (employees, roles, job_postings, skill_embeddings, users, matches)
- [ ] pgvector extension enabled
- [ ] Redis responds to PING
- [ ] Team can clone and setup in <5 minutes

---

**Last Updated:** 2026-01-02
**Status:** Not Started
