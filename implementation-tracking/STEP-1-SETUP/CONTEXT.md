# STEP 1: Project Setup - CONTEXT

**Block:** STEP-1-SETUP
**Phase:** Foundation (Must complete before Step 2)
**Estimated Time:** 1 day
**Prerequisites:** None
**Provides Foundation For:** All Step 2 blocks

---

## AI Quick Start Prompt

> You are setting up the foundational infrastructure for SpringAIS, an AI-powered talent mobility platform. Read this entire document. Ask no questions. Follow the instructions exactly. When complete, update TASKS.md checkboxes and PROJECT-STATUS.md.

---

## What (Goal)

Set up the complete development environment so that 4 developers can work in parallel on independent blocks:

1. ✅ Docker Compose with PostgreSQL+pgvector and Redis
2. ✅ Database schema with all tables and indexes
3. ✅ FastAPI backend skeleton with project structure
4. ✅ React frontend skeleton with TypeScript and routing
5. ✅ Environment configuration (.env) for local development
6. ✅ Git branching strategy for data sharing

**Success Criteria:** Any team member can run `docker-compose up` and have a working development environment in <5 minutes.

---

## Why (Purpose)

This setup phase:
- **Unblocks all parallel work:** Once complete, all 12 Step 2 blocks can start simultaneously
- **Establishes contracts:** Database schema = interface between backend blocks
- **Prevents conflicts:** Standard project structure ensures everyone follows same patterns
- **Enables testing:** Each block can test in isolation with this foundation

---

## How (Implementation)

### Architecture Overview

```
SpringAIS/
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── main.py         # FastAPI entry point
│   │   ├── database.py     # SQLAlchemy setup
│   │   ├── models/         # Database models (Block C will populate)
│   │   ├── routes/         # API endpoints (Blocks will add)
│   │   ├── services/       # Business logic (Blocks will add)
│   │   └── utils/          # Helpers
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile
├── frontend/               # React application
│   ├── src/
│   │   ├── App.tsx        # Main component
│   │   ├── main.tsx       # Entry point
│   │   ├── pages/         # Page components (Blocks will add)
│   │   ├── components/    # Reusable components (Blocks will add)
│   │   └── lib/           # Utilities
│   ├── package.json
│   └── Dockerfile
├── data/                   # SQL dumps and synthetic data
├── docker-compose.yml      # Local development stack
├── .env                    # Environment variables (gitignored)
└── .env.example            # Template for environment setup
```

---

## Tech Stack

### Backend
- **Language:** Python 3.11+
- **Framework:** FastAPI (async REST API)
- **Database:** PostgreSQL 16 with pgvector extension
- **ORM:** SQLAlchemy 2.0
- **Caching:** Redis 7
- **Dependencies:**
  ```
  fastapi==0.109.0
  uvicorn[standard]==0.27.0
  sqlalchemy==2.0.25
  psycopg2-binary==2.9.9
  pgvector==0.2.4
  redis==5.0.1
  python-dotenv==1.0.0
  pydantic==2.5.3
  ```

### Frontend
- **Language:** TypeScript
- **Framework:** React 18 with Vite
- **UI Library:** shadcn/ui (Radix UI + Tailwind CSS)
- **Router:** React Router v6
- **State:** React Query (TanStack Query)
- **Charts:** Recharts
- **Visualization:** React Flow
- **Dependencies:** (see package.json in TASKS.md)

### Infrastructure
- **Docker:** Docker Compose for local orchestration
- **Database:** PostgreSQL 16 (pgvector/pgvector:pg16 image)
- **Cache:** Redis 7 (redis:7-alpine image)

---

## Step-by-Step Implementation

### Task 1: Create Project Folder Structure

```bash
mkdir -p backend/app/models backend/app/routes backend/app/services backend/app/utils
mkdir -p frontend/src/pages frontend/src/components frontend/src/lib
mkdir -p data
mkdir -p scripts
```

### Task 2: Create Docker Compose Configuration

**File:** `docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    container_name: springais-postgres
    environment:
      POSTGRES_DB: springais
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./data:/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: springais-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: springais-backend
    command: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    volumes:
      - ./backend:/app
      - ./uploads:/app/uploads
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/springais
      - REDIS_URL=redis://redis:6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ONET_API_KEY=${ONET_API_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: springais-frontend
    command: npm run dev -- --host
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:8000

volumes:
  postgres_data:
  redis_data:
```

### Task 3: Create Backend Dockerfile

**File:** `backend/Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Task 4: Create Backend Requirements

**File:** `backend/requirements.txt`

```
fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlalchemy==2.0.25
psycopg2-binary==2.9.9
pgvector==0.2.4
redis==5.0.1
python-dotenv==1.0.0
pydantic==2.5.3
pydantic-settings==2.1.0
python-multipart==0.0.6
openai==1.10.0
tiktoken==0.5.2
langchain==0.1.4
langchain-openai==0.0.2
beautifulsoup4==4.12.3
requests==2.31.0
```

### Task 5: Create FastAPI Skeleton

**File:** `backend/app/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting SpringAIS backend...")
    # Create tables (will be populated by migrations later)
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown
    print("👋 Shutting down SpringAIS backend...")

app = FastAPI(
    title="SpringAIS API",
    description="AI-powered talent mobility platform for EY",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "SpringAIS API",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}
```

**File:** `backend/app/database.py`

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/springais")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### Task 6: Initialize Database Schema

**File:** `scripts/init_database.sql`

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Employees table (synthetic data from Block A)
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(20) PRIMARY KEY,
    service_line VARCHAR(50) NOT NULL,
    current_role VARCHAR(100) NOT NULL,
    role_level INTEGER NOT NULL,
    years_experience NUMERIC(4, 2) NOT NULL,
    skills JSONB NOT NULL,
    performance_metrics JSONB NOT NULL,
    career_history JSONB,
    feedback_themes TEXT[],
    notable_achievement TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_employees_service_line ON employees(service_line);
CREATE INDEX idx_employees_role ON employees(current_role);
CREATE INDEX idx_employees_service_role ON employees(service_line, current_role);
CREATE INDEX idx_employees_skills ON employees USING GIN(skills);

-- Roles table (role definitions)
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    service_line VARCHAR(50) NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    role_level INTEGER NOT NULL,
    core_skills JSONB NOT NULL,
    common_skills JSONB NOT NULL,
    min_years_experience INTEGER,
    max_years_experience INTEGER,
    focus_areas TEXT[],
    UNIQUE(service_line, role_name)
);

-- Job postings table (scraped from EY careers)
CREATE TABLE IF NOT EXISTS job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    service_line VARCHAR(50),
    location VARCHAR(255),
    posted_date DATE NOT NULL,
    closed_date DATE,
    scraped_at TIMESTAMP DEFAULT NOW(),
    required_skills TEXT[],
    preferred_skills TEXT[],
    description TEXT,
    years_experience VARCHAR(50),
    posting_url TEXT,
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, ''))
    ) STORED
);

CREATE INDEX idx_job_postings_service_line ON job_postings(service_line);
CREATE INDEX idx_job_postings_posted_date ON job_postings(posted_date);
CREATE INDEX idx_job_postings_active ON job_postings(closed_date) WHERE closed_date IS NULL;
CREATE INDEX idx_job_postings_search ON job_postings USING GIN(search_vector);

-- Skill embeddings table (cached vectors)
CREATE TABLE IF NOT EXISTS skill_embeddings (
    skill_name VARCHAR(255) PRIMARY KEY,
    embedding vector(3072),  -- text-embedding-3-large dimension
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON skill_embeddings USING hnsw (embedding vector_cosine_ops);

-- User profiles table (demo users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    service_line VARCHAR(50),
    current_role VARCHAR(100),
    extracted_skills JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Matches table (user → role matches)
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    role_id INTEGER REFERENCES roles(id),
    job_posting_id UUID REFERENCES job_postings(id),
    similarity_score NUMERIC(3, 2),
    matched_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_matches_user ON matches(user_id);
CREATE INDEX idx_matches_role ON matches(role_id);
```

Run initialization:
```bash
docker exec -i springais-postgres psql -U postgres springais < scripts/init_database.sql
```

### Task 7: Create Frontend Dockerfile

**File:** `frontend/Dockerfile`

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host"]
```

### Task 8: Initialize React App with Vite

```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install
```

### Task 9: Install Frontend Dependencies

```bash
cd frontend
npm install react-router-dom@6 @tanstack/react-query axios
npm install -D tailwindcss postcss autoprefixer
npm install recharts react-flow-renderer
npx shadcn-ui@latest init
```

### Task 10: Create Frontend Skeleton

**File:** `frontend/src/main.tsx`

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
```

**File:** `frontend/src/App.tsx`

```typescript
import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        {/* Blocks will add more routes */}
      </Routes>
    </div>
  )
}

function HomePage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold">SpringAIS</h1>
      <p className="text-lg mt-4">AI-powered talent mobility platform</p>
    </div>
  )
}

function LoginPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold">Login</h1>
      {/* Block H will implement this */}
    </div>
  )
}

export default App
```

### Task 11: Create Environment Configuration

**File:** `.env.example`

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/springais

# Redis
REDIS_URL=redis://localhost:6379

# OpenAI API
OPENAI_API_KEY=your-openai-key-here

# O*NET API (register at https://services.onetcenter.org/reference)
ONET_API_KEY=your-onet-key-here

# Frontend (for docker-compose)
VITE_API_URL=http://localhost:8000
```

**File:** `.env` (create from example, gitignore this)

```bash
cp .env.example .env
# Edit .env with actual API keys
```

### Task 12: Create Git Data Branch

```bash
# Create dedicated branch for SQL dumps
git checkout -b data-dumps
git push -u origin data-dumps

# This branch is ONLY for data/synthetic_employees.sql
# Never merge to main

git checkout main
```

### Task 13: Create .gitignore

**File:** `.gitignore`

```
# Environment
.env
.env.local

# Python
__pycache__/
*.py[cod]
*$py.class
.Python
venv/
ENV/

# Node
node_modules/
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo

# Docker
postgres_data/
redis_data/

# Uploads
uploads/*
!uploads/.gitkeep

# OS
.DS_Store
Thumbs.db
```

### Task 14: Verify Setup

```bash
# Start all services
docker-compose up -d

# Check services are running
docker-compose ps

# Test backend
curl http://localhost:8000/health

# Test frontend
curl http://localhost:3000

# Test database
docker exec -it springais-postgres psql -U postgres springais -c "SELECT COUNT(*) FROM employees;"

# Check Redis
docker exec -it springais-redis redis-cli ping
```

### Task 15: Document Setup for Team

Create `README.md` with quick start instructions for teammates.

---

## Integration Points for Step 2 Blocks

This setup provides:

**For Backend Blocks (C, D, E, F, G):**
- ✅ Database connection (`app/database.py`)
- ✅ FastAPI app (`app/main.py`)
- ✅ Schema with all tables
- ✅ SQLAlchemy Base class for models

**For Frontend Blocks (H, I, J, K, L):**
- ✅ React + TypeScript + Vite setup
- ✅ React Router for navigation
- ✅ shadcn/ui component library
- ✅ Tailwind CSS styling
- ✅ React Query for API calls

**For Data Blocks (A, B):**
- ✅ Database with schema ready
- ✅ `data/` folder for SQL dumps
- ✅ Git data-dumps branch for sharing

---

## Update Instructions (For AI)

After completing this setup block:

1. ✅ Check all boxes in `TASKS.md`
2. ✅ Run all verification steps in `VERIFICATION.md`
3. ✅ Update `PROJECT-STATUS.md`:
   - Change status from ⏸️ to ✅
   - Update progress to "15/15 tasks"
   - Update Phase status
4. ✅ Commit changes:
   ```bash
   git add .
   git commit -m "Complete STEP-1-SETUP: Project foundation ready"
   git push
   ```
5. ✅ Notify team that Step 2 blocks can now begin

---

## Acceptance Criteria

- [ ] `docker-compose up` starts all services without errors
- [ ] Backend responds at http://localhost:8000/health
- [ ] Frontend responds at http://localhost:3000
- [ ] PostgreSQL has all tables created with indexes
- [ ] pgvector extension is enabled
- [ ] Redis is accessible
- [ ] Team can clone repo and run setup in <5 minutes
- [ ] .env.example exists with all required variables documented
- [ ] Git data-dumps branch exists for data sharing

---

## Next Steps After Completion

**All team members can now:**
1. Clone repository
2. Copy `.env.example` to `.env` and add API keys
3. Run `docker-compose up`
4. Choose any Step 2 block and start developing

**Step 2 blocks that can start immediately:**
- All 12 blocks are now unblocked!
- Choose blocks based on skills: #frontend, #backend, #data

---

## Reference Documentation

- Architecture: `reference-docs/architecture/tech-stack-summary.md`
- Database Schema: `reference-docs/architecture/database-schema.md`
- API Patterns: `reference-docs/backend/api-patterns.md`
- Frontend Patterns: `reference-docs/frontend/component-patterns.md`

---

**Created:** 2026-01-02
**Status:** Ready for implementation
**Estimated Completion:** 1 day
