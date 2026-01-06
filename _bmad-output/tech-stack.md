# SpringAIS Technical Stack Documentation

**Last Updated:** 2026-01-02
**Status:** MVP Architecture - Competition Demo
**Total Infrastructure Cost:** $0/month

---

## Executive Summary

SpringAIS leverages **free-tier services and local development** to minimize costs while maintaining demo-ready capabilities. This stack is optimized for an **8-week competition timeline** with local demo deployment (no cloud hosting required).

**Key Principle:** Only code what we HAVE to. Use open-source frameworks, free APIs, and local infrastructure for everything else.

**Key Architectural Decision:** Run demo locally on laptops during judging - no cloud hosting needed. This is MORE impressive (judges see it work in real-time) and costs $0.

---

## Infrastructure Services (All Free)

### Core Services

| Service | Purpose | Development | Demo/Production | Cost |
|---------|---------|-------------|-----------------|------|
| **PostgreSQL + pgvector** | Main database + vector embeddings | Docker local | Docker local or Supabase (optional) | $0 |
| **Redis** | Session cache, skill embedding cache, LLM response cache | Docker local | Docker local or Upstash (optional) | $0 |
| **File Storage** | Resume/document uploads | Local filesystem or Supabase | Local filesystem | $0 |
| **Authentication** | User auth for demo | Simple JWT or Supabase Auth | Simple JWT | $0 |
| **Backend** | FastAPI application | uvicorn locally | uvicorn locally | $0 |
| **Frontend** | React application | Vite dev server | Vite build (static) | $0 |

**Development & Demo Strategy:**
- **Everything runs locally** in Docker Compose
- **No cloud dependencies** for demo
- **Optional Supabase** if you want free cloud hosting later (not required for competition)
- **Git-based database sharing** for team collaboration

### Why Local-First Architecture?

- **$0 cost** - No monthly hosting bills
- **Demo reliability** - No "server is down" moments during judging
- **Fast iteration** - No deployment delays
- **Portable** - Runs on any laptop with Docker
- **Impressive** - Judges see real-time execution, not a hosted demo
- **Team collaboration** - Git-based SQL dumps for data sharing

---

## External Free Services & APIs

| Service | Purpose | Why Use It | Cost |
|---------|---------|------------|------|
| **O\*NET API** | Skills taxonomy (39K+ skills, occupations, relationships) | Free, comprehensive, saves 2-3 weeks | $0 |
| **OpenAI API** | Skill extraction, validation, embeddings | Direct API access | Pay-per-use |
| **React Flow** | Career path visualization, skill trees | Free open-source, saves 3-4 days | $0 |

---

## Technology Stack Details

### Backend Stack

**Framework:**
- **FastAPI** (Python 3.11+) - Async REST API framework
  - Auto-generates OpenAPI 3.0 docs
  - Pydantic validation
  - WebSocket support for real-time notifications (optional)
  - Runs locally via uvicorn

**Database:**
- **PostgreSQL 16** with **pgvector extension**
  - Structured data (employees, roles, matches, audit logs)
  - Vector embeddings storage (3072-D vectors from text-embedding-3-large)
  - Unified database (no separate vector DB needed)
  - Runs in Docker locally
  - **Why pgvector:**
    - Single database for all data
    - Excellent semantic search performance
    - Easier to maintain than separate vector DB
    - Industry standard for vector similarity search

**Caching:**
- **Redis** (via `redis-py`)
  - **LangChain Semantic Cache** - Similar prompts → cached LLM responses (68.8% API reduction target)
  - **Redis Direct Cache** - Exact matches for:
    - Skill extraction results (7 days TTL)
    - Embeddings (indefinite TTL)
    - O\*NET API responses (24 hours TTL)
    - Session data (15 minutes TTL)
  - Runs in Docker locally

**LLM Integration:**
- **OpenAI SDK** - Direct API calls for:
  - **GPT-5.2 Instant:** Real-time skill extraction during demo (user uploads)
  - **GPT-5.2 Instant:** User-facing text generation (match explanations, gap analysis)
  - **GPT-5 Nano:** Synthetic data generation (one-time, offline)
  - **text-embedding-3-large:** Skill embeddings for vector search
- **LangChain** - LLM orchestration, prompt management, semantic caching
- **tiktoken** - Accurate token counting for cost estimation

**File Storage:**
- **Local Filesystem** - Resume/document uploads stored locally
- **Optional: Supabase Storage** - If you want cloud storage later (1GB free)

**Document Processing:**
- **PyPDF2** or **pdfplumber** - PDF text extraction
- **python-docx** - Word document parsing

**Authentication:**
- **JWT tokens** - Simple auth for demo
- **Optional: Supabase Auth** - If you want full auth later (includes SSO support)

**Background Jobs:**
- **FastAPI BackgroundTasks** - Async skill extraction processing (inline)
- Simple for MVP, no separate job queue needed

**Monitoring & Logging:**
- **structlog** - Structured JSON logging
- **Optional: Sentry** - Error tracking (free tier: 5K events/month)

**Secrets Management:**
- **Environment variables** - .env file (gitignored)
- **Optional: Azure Key Vault** - If you deploy to production later

### Frontend Stack

**Framework:**
- **React 18+** with **TypeScript**
- **Vite** - Build tool and dev server (fast, modern)

**UI Components:**
- **shadcn/ui** - Professional component library
  - Built on Radix UI primitives
  - Tailwind CSS styling
  - Accessible by default

**Visualization:**
- **React Flow** - Career path visualization, skill trees
  - Interactive node graphs
  - Custom node/edge rendering
  - Shows career progression paths

**Charts & Analytics:**
- **Recharts** - Dashboard visualizations
  - Success pattern charts
  - Match statistics
  - Career competitiveness metrics

**HTTP Client:**
- **Axios** - API communication with FastAPI backend
- **openapi-typescript** - TypeScript types generated from FastAPI OpenAPI spec

**State Management:**
- **React Query (TanStack Query)** - Server state management, caching
- **Zustand** (optional) - Client state management if needed

---

## Vector Search Architecture

### Why Vectorization is Critical

SpringAIS's core value proposition depends on **semantic matching**, not keyword matching:

**Without Vectors (Keyword Matching):**
```
User has: ["AWS", "Docker", "CI/CD"]
Role requires: ["Cloud Infrastructure", "Containerization", "DevOps"]
→ 0% keyword match ❌ (same concepts, different words)
```

**With Vectors (Semantic Matching):**
```
User skills embedded: [0.23, 0.84, 0.12, ...] (3072-D)
Role requirements embedded: [0.25, 0.81, 0.15, ...] (3072-D)
→ Cosine similarity: 0.92 ✅ (semantically similar!)
```

**Key Use Cases:**
1. **Cross-functional discovery:** Tax accountant discovers Consulting opportunities
2. **Synonym handling:** "Python programming" matches "Python development"
3. **Skill relationship understanding:** "Data Analysis" similar to "SQL, Tableau, Excel"
4. **Hidden opportunity discovery:** Core PRD differentiator

### Matching Architecture (Hybrid Option C)

```
User uploads resume
  ↓
Extract skills (GPT-5.2 Instant, ~$0.02)
  ↓
Generate embeddings (text-embedding-3-large, ~$0.0001)
  ↓
Vector similarity search in pgvector
  ├─ Search against ~25 role types
  └─ Search against current job postings
  ↓
Top 10 matches (sorted by cosine similarity)
  ↓
For each match:
  ├─ IF job posting exists:
  │    ├─ Show job requirements (PRIMARY)
  │    └─ Add success patterns (AUGMENTATION)
  │        "92% of Senior Analysts also have Excel (not in posting!)"
  │
  └─ ELSE (no job posting):
       └─ Show success patterns only (PRIMARY)
           "Based on 47 current Senior Analysts..."
  ↓
Display ranked opportunities to user
```

**No ML ranking needed for MVP** - Vector cosine similarity is sufficient with ~25 role types. ML ranking can be added later when job posting database grows to 100+ entries.

### Embedding Strategy

**What gets embedded:**
1. **Role requirements** (~25 role types × 10 skills = ~250 skill mentions)
2. **Job posting requirements** (~30-50 postings × 10 skills = ~300-500 skill mentions)
3. **Unique skills** (total ~1,000-1,500 unique skills after deduplication)

**Embedding process:**
```python
# 1. Extract unique skills from all sources
unique_skills = set()
for employee in employees:
    unique_skills.update(employee.skills)
for job in job_postings:
    unique_skills.update(job.required_skills)

# 2. Embed each unique skill once
embeddings = {}
for skill in unique_skills:
    embedding = openai.embeddings.create(
        model="text-embedding-3-large",
        input=skill
    )
    embeddings[skill] = embedding.data[0].embedding

# 3. Cache in Redis indefinitely
redis.set(f"embedding:{skill}", embedding, ex=None)
```

**Cost:** ~$0.003 total for all embeddings (one-time)

**Pre-caching strategy:**
- Embed all role requirement skills during setup
- Embed all job posting skills when scraped
- Embed user skills on-demand (cache after first use)
- Common skills pre-cached: ~250 most common EY skills

---

## Caching Strategy (Multi-Layer)

### Layer 1: LangChain Semantic Cache

**Purpose:** Cache LLM responses based on semantic similarity (not exact matches)

**What it caches:**
- LLM prompt → response pairs
- Uses embedding similarity (cosine similarity > 0.95)
- Handles prompt variations automatically

**Benefits:**
- 68.8% API call reduction target (per PRD)
- Handles similar prompts without exact match
- Reduces LLM costs significantly

**Example:**
```
Prompt A: "Extract skills from: 'I built Python APIs'"
Prompt B: "Extract skills from: 'Developed Python REST APIs'"
→ LangChain sees these as similar
→ Returns cached response from Prompt A
```

### Layer 2: Redis Exact Match Cache

**Purpose:** Fast lookups for identical requests

**What it caches:**

1. **Skill Extraction Results** (7 days TTL)
   - Key: `skill_extraction:{resume_hash}`
   - Value: Extracted skills with confidence scores

2. **Embeddings** (Indefinite TTL)
   - Key: `embedding:{skill_name}`
   - Value: 3072-D vector from text-embedding-3-large
   - Pre-cached: ~250 common EY skills

3. **O\*NET API Responses** (24 hours TTL)
   - Key: `onet_api:{endpoint}:{params}`
   - Value: API response JSON

4. **Session Data** (15 minutes TTL)
   - Key: `session:{user_id}`
   - Value: User session data

**Benefits:**
- O(1) lookup time
- Prevents redundant API calls
- Instant responses for cached data

---

## Synthetic Data Strategy

### Purpose of Synthetic Data

**Synthetic employees are NOT just test data** - they are the **source of success pattern analysis**:

```
User: "I want to become a Senior Analyst"

System analyzes 47 synthetic Senior Analysts:
- Common skills: SQL (95%), Python (87%), Excel (92%), Tableau (78%)
- Avg performance: 82% utilization, 4.1 client satisfaction
- Avg experience: 4.2 years
- Typical path: Staff (2y) → Senior (3y) → Senior Analyst
- Common feedback: "strong analytical skills", "proactive communication"

Shows user: "You have SQL & Python ✅, but need to develop Excel & Tableau skills.
             Current Senior Analysts average 82% utilization (you: 78% - close!)
             Typical timeline: 4.2 years experience (you: 3.5 years - on track)"
```

**This is the core differentiator:** Show what ACTUALLY drives advancement, not just job posting requirements.

### EY Organizational Structure (3 Service Lines)

**Distribution of 900 synthetic employees:**

1. **Assurance** (300 employees, 33%)
   - Roles: Staff → Senior → Manager → Senior Manager → Partner
   - Core skills: Accounting, Audit, GAAP, Financial Reporting, Risk Assessment
   - Focus areas (30% of employees): Audit, Financial Reporting, Risk & Compliance, SEC Reporting, Internal Controls, Fraud Investigation

2. **Tax** (300 employees, 33%)
   - Roles: Staff → Senior → Manager → Senior Manager → Partner
   - Core skills: Tax Law, Tax Planning, Compliance, Research, Excel
   - Focus areas (30% of employees): Corporate Tax, International Tax, Transfer Pricing, M&A Tax, Tax Technology, SALT, Estate Planning

3. **Consulting** (300 employees, 34%)
   - Roles: Analyst → Associate → Senior Associate → Consultant → Senior Consultant → Manager → Senior Manager → Director → Partner
   - Core skills: Strategy, Client Management, Project Management, Stakeholder Management
   - Focus areas (30% of employees):
     - **Technology:** Cloud & Infrastructure, Data & Analytics, Cybersecurity, AI & Machine Learning
     - **Business:** Strategy, Operations, Finance Transformation, Supply Chain, HR & Workforce, Customer Experience

**Total role types:** ~25 (5 roles × 3 service lines, with some variation in Consulting)

### Hybrid Data Generation Approach

**What gets hard-coded ($0, deterministic):**
- Role titles and hierarchy per service line
- Core required skills per role (from scraped job postings / O*NET)
- Years of experience ranges per role level
- Base performance metric ranges per role level

**What LLM generates (~$2 total):**
- **GPT-5 Nano:** Individual employee performance metric variation
- **GPT-5 Nano:** Career progression history (previous roles, durations)
- **GPT-5 Nano:** Soft skills (3-6 per person, varied)
- **GPT-5.2 Instant:** Feedback themes (realistic peer feedback text - user-facing)
- **GPT-5.2 Instant:** Notable achievements (1-2 sentences per person)

**Benefits of hybrid approach:**
- 80% cost reduction vs. full LLM generation
- Guaranteed data quality (core skills always correct)
- Realistic variation where it matters (metrics, feedback)
- LLM focuses on what it's good at (text generation, variation)

### Data Quality Validation

**Multi-layer validation ensures realism:**

1. **Role distribution validation**
   - Check pyramid structure (more junior, fewer senior)
   - Assurance: 60 Staff, 90 Senior, 80 Manager, 50 Sr Manager, 20 Partner

2. **Performance metric correlation**
   - Higher roles should have higher average performance
   - Partners: avg 4.5 client satisfaction vs Analysts: avg 3.8

3. **Career progression realism**
   - No impossible jumps (Staff → Partner in 2 years)
   - Minimum time in role enforced (2 years typical)
   - Progression follows service line tracks

4. **Skill distribution realism**
   - Core skills present in 90-100% of role holders
   - Common skills present in 60-80% of role holders
   - Specialization skills present in 20-40% of role holders

5. **No impossible patterns**
   - Junior roles can't have 10+ years experience
   - Can't have more mentees than years of experience
   - All skills must exist in O*NET taxonomy

---

## Job Posting Strategy

### Scraping & Storage

**Source:** EY public careers page (legal, publicly available)

**Scraping frequency:**
- Initial: Scrape all current openings (~30-50 postings)
- Ongoing: Weekly or daily scraping to capture new postings
- Archive closed postings (historical data is valuable)

**What we extract:**
```python
job_posting = {
    "id": "uuid",
    "title": "Senior Analyst - Assurance",
    "service_line": "Assurance",
    "location": "New York, NY",
    "posted_date": "2026-01-02",
    "closed_date": None,  # Still open
    "required_skills": ["Accounting", "Audit", "GAAP", "Excel", "CPA"],
    "preferred_skills": ["SEC Reporting", "SOX Compliance"],
    "years_experience": "3-5 years",
    "description": "Full posting text...",
    "posting_url": "https://careers.ey.com/...",
}
```

**Storage:** PostgreSQL table with full-text search capabilities

**Growth over time:**
- Week 1: ~30-50 postings
- Month 3: ~100-150 postings (includes archived)
- Month 6: ~300+ postings (comprehensive historical archive)

### Priority: Job Postings First, Success Patterns Second

**When job posting exists:**
```
Show user:
  PRIMARY: Job posting requirements
    "Senior Analyst - Assurance requires: CPA, 3-5 years audit experience,
     GAAP expertise, Excel proficiency"

  AUGMENTATION: Success pattern insights
    "Additional insights from 47 current Senior Analysts:
     - 92% also have Excel (confirmed ✅)
     - 78% have strong communication skills (not in posting!)
     - Average 4.2 years experience (you: 3.5 years - on track)
     - Common feedback: 'detail-oriented', 'client-focused'"
```

**When no job posting exists:**
```
Show user:
  PRIMARY: Success pattern analysis
    "Senior Analyst - Assurance (based on 47 current employees):
     - Common skills: Accounting (100%), Audit (98%), GAAP (95%),
       Excel (92%), CPA (87%)
     - Avg experience: 4.2 years
     - Performance: 82% utilization, 4.1 client satisfaction
     - Typical path: Staff (2y) → Senior (3y) → Senior Analyst"
```

**Fallback hierarchy:**
1. Real job posting (if available) → PRIMARY
2. Success patterns from synthetic employees → AUGMENTATION or PRIMARY
3. O*NET occupation profile → FALLBACK if no synthetic data for role
4. LLM inference from role title → LAST RESORT ($0.001 per role)

---

## Development Environment

### Local Development Setup

**Prerequisites:**
- Docker Desktop installed
- Python 3.11+
- Node.js 18+
- Git

**Docker Compose Services:**

```yaml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: springais
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./data:/data  # For SQL dumps

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    command: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    volumes:
      - ./backend:/app
      - ./uploads:/app/uploads  # Resume uploads
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/springais
      - REDIS_URL=redis://redis:6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ONET_API_KEY=${ONET_API_KEY}
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
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

**Environment Variables (.env file):**

```bash
# OpenAI API
OPENAI_API_KEY=your-openai-key

# O*NET API (free registration)
ONET_API_KEY=your-onet-key

# Database (local)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/springais
REDIS_URL=redis://localhost:6379

# Optional: Supabase (if using cloud features)
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
```

**Start Command:**

```bash
# Start all services
docker-compose up

# Access points:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8000
# - API Docs: http://localhost:8000/docs
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
```

---

## Database Sharing Strategy (Git-Based)

### Team Collaboration Workflow

**Problem:** 4 team members need access to same synthetic employee database

**Solution:** Git-based SQL dump sharing (branch strategy)

**Setup:**

```bash
# 1. Create dedicated branch for data dumps (do this once)
git checkout -b data-dumps
git push -u origin data-dumps

# This branch is ONLY for SQL dumps, never merged to main
# Prevents merge conflicts with application code
```

**Workflow for data generator (one person):**

```bash
# 1. Generate synthetic data
python scripts/generate_synthetic_data.py

# 2. Dump database to SQL file
pg_dump -h localhost -U postgres springais > data/synthetic_employees.sql

# 3. Commit to data-dumps branch
git checkout data-dumps
git add data/synthetic_employees.sql
git commit -m "Generate 900 synthetic employees - $(date +%Y-%m-%d)"
git push origin data-dumps

# 4. Back to your working branch
git checkout main
```

**Workflow for teammates (load data):**

```bash
# 1. Pull latest data dump
git fetch origin
git checkout data-dumps
git pull origin data-dumps

# 2. Load data into local database
psql -h localhost -U postgres springais < data/synthetic_employees.sql

# 3. Back to your working branch
git checkout main

# You now have the same data as the rest of the team!
```

**Benefits:**
- ✅ Single source of truth (one person generates data)
- ✅ Version controlled (can revert to previous data versions)
- ✅ No merge conflicts (separate branch)
- ✅ Works offline (everyone has local copy)
- ✅ Simple (just SQL dump/restore)

**Notes:**
- SQL dump size: ~10-50MB for 900 employees (acceptable for git)
- Private repo recommended (synthetic data stays internal)
- Regenerate data as needed (update SQL dump on data-dumps branch)

---

## What We DON'T Build (Use Services/Libraries Instead)

| Component | Solution | Time Saved | Cost |
|-----------|----------|------------|------|
| **Skills Taxonomy** | O\*NET API | 2-3 weeks | $0 |
| **Vector Storage + Search** | pgvector | 1-2 weeks | $0 |
| **PDF Parsing** | pdfplumber | 2-3 days | $0 |
| **Graph Visualization** | React Flow | 3-4 days | $0 |
| **Token Counting** | tiktoken | 0.5 days | $0 |
| **Auth (optional)** | Supabase Auth | 1-2 weeks | $0 |

**Total Time Saved: ~4-6 weeks**

---

## What We Code By Hand

### Backend Components

| Component | Description | Complexity | Est. Time |
|-----------|-------------|------------|-----------|
| **API Routes** | REST endpoints for all features | Medium | 3-4 days |
| **Database Models** | SQLAlchemy/SQLModel schemas | Low | 1 day |
| **Skill Extraction Pipeline** | LLM prompts + O\*NET mapping + validation | Medium | 3-4 days |
| **Matching Algorithm** | pgvector queries + scoring logic | Medium | 3-4 days |
| **Success Pattern Analysis** | Query synthetic employees, calculate metrics | Medium | 2-3 days |
| **Gap Analysis** | Compare user skills vs target role | Low | 1 day |
| **Job Posting Scraper** | BeautifulSoup scraper for EY careers | Low | 1-2 days |
| **Data Generation Script** | Hybrid LLM + hard-coded approach | Medium | 2-3 days |

### Frontend Components

| Component | Description | Complexity | Est. Time |
|-----------|-------------|------------|-----------|
| **Auth Flow UI** | Login/logout | Low | 0.5 days |
| **Profile Upload/Display** | Resume upload, extracted skills view | Medium | 1-2 days |
| **Skill Confidence UI** | Show skills with evidence, confidence | Medium | 1 day |
| **Opportunity Search** | Filters, search interface | Medium | 2 days |
| **Match Results Display** | Cards with match scores, skill gaps | Medium | 1-2 days |
| **Career Journey Map** | React Flow integration | Medium | 3-4 days |
| **Success Patterns Overlay** | Charts showing advancement patterns | Medium | 1-2 days |
| **Gap Analysis View** | What skills are missing, how to get them | Low | 1 day |

### Integration Code

| Component | Description | Complexity | Est. Time |
|-----------|-------------|------------|-----------|
| **O\*NET Client** | API wrapper for skills/occupations | Low | 0.5 days |
| **LLM Service** | Abstraction for skill extraction calls | Low | 0.5 days |
| **Embedding Service** | Generate + cache embeddings | Low | 0.5 days |
| **Vector Search Service** | pgvector similarity queries | Low | 1 day |

---

## Performance Targets

### Response Times (Per PRD)

| Operation | Target | Notes |
|-----------|--------|-------|
| Uncached skill inference | <15s | Full GPT-5.2 Instant extraction pipeline |
| Cached skill inference | <3s | Semantic cache hit |
| Role matching queries | <2s | pgvector similarity search |
| Career Journey Map render | <3s | React Flow visualization |

### Caching Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Semantic cache hit rate | >60% | LangChain semantic caching |
| Embedding cache hit rate | >80% | Pre-cached common skills |
| O\*NET API cache hit rate | >90% | Aggressive caching (24h TTL) |

---

## Cost Breakdown

### One-Time Setup Costs

| Task | Model | Cost |
|------|-------|------|
| **Generate 900 synthetic employees (metrics)** | GPT-5 Nano | ~$0.04 |
| **Generate 900 synthetic employees (feedback text)** | GPT-5.2 Instant | ~$1.50 |
| **Embed all unique skills** | text-embedding-3-large | ~$0.003 |
| **Role requirement inference (if needed)** | GPT-5.2 Instant | ~$0.05 |
| **TOTAL ONE-TIME SETUP** | | **~$2** |

### Runtime Costs (Per Demo)

| Task | Model | Cost Per Use |
|------|-------|--------------|
| **Extract skills from resume** | GPT-5.2 Instant | ~$0.02 |
| **Generate embeddings for new skills** | text-embedding-3-large | ~$0.0001 |
| **Match explanations (optional)** | GPT-5.2 Instant | ~$0.01 |

**Demo scenario:**
- 50 test resumes during judging
- 50 × $0.02 = **$1 total runtime cost**

### Total Project Cost

**8-Week Competition:**
- Setup: ~$2
- Demo runtime: ~$1
- **TOTAL: ~$3**

**Monthly Infrastructure:**
- PostgreSQL: $0 (Docker local)
- Redis: $0 (Docker local)
- Hosting: $0 (runs on laptop)
- **TOTAL: $0/month**

---

## Development Timeline

### Phase 1: Foundation (Week 1)
- Docker Compose setup
- FastAPI skeleton + PostgreSQL schema
- React app + shadcn/ui
- Basic auth (JWT or skip for demo)
- **Deliverable:** `docker-compose up` works

### Phase 2: Data Generation (Week 2)
- Role template definitions (3 service lines)
- Hybrid data generation script (hard-coded + LLM)
- O\*NET API integration
- Generate 900 synthetic employees
- Database validation and SQL dump
- **Deliverable:** Realistic employee database ready

### Phase 3: Skill Extraction Pipeline (Week 3)
- OpenAI API integration
- Resume upload and parsing
- Skill extraction with GPT-5.2 Instant
- Embedding generation
- Caching layer (Redis)
- **Deliverable:** Upload resume → extracted skills

### Phase 4: Matching Engine (Week 4)
- pgvector similarity queries
- Vector search against role types
- Vector search against job postings
- Match scoring and ranking
- Success pattern aggregation from synthetic employees
- **Deliverable:** Top 10 role matches

### Phase 5: Success Pattern Analysis (Week 5)
- Query synthetic employees by role
- Calculate aggregate metrics (skills, performance, timelines)
- Gap analysis (user vs. success patterns)
- Career path progression analysis
- **Deliverable:** "What do successful Senior Analysts look like?"

### Phase 6: Visualization (Week 6)
- React Flow career path map
- Success pattern charts (Recharts)
- Match results cards
- Skill gap visualization
- **Deliverable:** Visual career journey and insights

### Phase 7: Job Posting Integration (Week 7)
- EY careers page scraper
- Job posting parser and storage
- Priority display logic (posting > success patterns)
- Weekly scraping automation
- **Deliverable:** Real job postings integrated with success patterns

### Phase 8: Polish & Testing (Week 8)
- UI polish and animations
- Edge case handling
- Demo data preparation
- Performance optimization
- Practice demo presentations
- **Deliverable:** Competition-ready demo

**Total: 8 weeks**

---

## Key Architectural Decisions

### 1. Local-First, No Cloud Hosting

**Decision:** Run demo locally on laptops during judging

**Rationale:**
- Zero infrastructure costs
- More impressive (real-time execution)
- No reliability concerns ("server down" during demo)
- Faster iteration (no deployment delays)
- Easy team collaboration (git-based data sharing)

### 2. pgvector for Vector Search

**Decision:** Use PostgreSQL pgvector extension (not separate vector DB)

**Rationale:**
- Unified database for all data
- Excellent performance for <10K roles
- Easier to maintain (one database)
- Industry standard, well-documented
- Free, open-source

### 3. Hybrid Data Generation (Hard-coded + LLM)

**Decision:** Hard-code deterministic data, use LLM for variation

**Rationale:**
- 80% cost reduction vs. full LLM generation
- Guaranteed correctness of core requirements
- Realistic variation where it matters
- Faster generation (less API calls)
- Better control over data quality

### 4. No ML Ranking for MVP

**Decision:** Use vector cosine similarity only (no trained ML model)

**Rationale:**
- Only ~25 role types to rank (too few for ML benefit)
- Vector similarity performs well at this scale
- Saves 3-5 days development time
- Can add ML later when job posting DB grows to 100+

### 5. Three Service Lines (Multi-Track)

**Decision:** Model Assurance, Tax, and Consulting separately

**Rationale:**
- Shows cross-functional mobility (differentiator)
- Reflects EY's actual structure
- More impressive demo scenarios
- Better represents talent mobility problem
- Same cost as single track

### 6. Job Postings as Primary (When Available)

**Decision:** Job posting requirements override success patterns when both exist

**Rationale:**
- Job postings are ground truth
- Success patterns add hidden insights
- System gracefully degrades without postings
- Supports growing posting database over time

---

## References

- [PostgreSQL](https://www.postgresql.org/) - Open-source relational database
- [pgvector](https://github.com/pgvector/pgvector) - PostgreSQL vector extension
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React](https://react.dev/) - Frontend JavaScript library
- [OpenAI API](https://platform.openai.com/) - LLM and embedding APIs
- [O\*NET API](https://www.onetcenter.org/web-services.html) - Skills taxonomy API
- [React Flow](https://reactflow.dev/) - Node graph visualization
- [shadcn/ui](https://ui.shadcn.com/) - React component library
- [LangChain](https://python.langchain.com/) - LLM orchestration framework
- [tiktoken](https://github.com/openai/tiktoken) - Token counting library
- [Supabase](https://supabase.com/) - Optional: PostgreSQL hosting (free tier)
- [Upstash](https://upstash.com/) - Optional: Redis hosting (free tier)

---

## Document History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-12-23 | 1.0 | Initial tech stack documentation | Clays |
| 2026-01-02 | 2.0 | Complete architecture overhaul: local-first, multi-track service lines, hybrid data generation, vector-only matching | Clays |
