# SpringAIS Architecture Updates - January 2026

**Date:** 2026-01-02
**Status:** APPROVED - Replace December 2025 architecture
**Replaces:** Azure-based cloud architecture
**New Approach:** Local-first development, competition demo optimized

---

## Executive Summary of Changes

**Major Shift:** From cloud-hosted production architecture → Local development + demo architecture

**Why:** 8-week competition timeline, $0 infrastructure budget, more impressive live demo

**Key Changes:**
1. ❌ **Removed:** All Azure services (PostgreSQL, Blob Storage, AD B2C, App Service)
2. ✅ **Added:** Local Docker-based development, git-based data sharing
3. ✅ **Added:** Multi-track EY organizational structure (3 service lines)
4. ✅ **Changed:** Hybrid synthetic data generation (hard-coded + LLM)
5. ✅ **Simplified:** Vector-only matching (no ML ranking for MVP)
6. 💰 **Cost:** $3 total (was expecting $30-50/month ongoing)

---

## Infrastructure Changes

### OLD Architecture (December 2025)

```
Backend:
- Azure App Service (FastAPI)
- Azure PostgreSQL (~$15-30/month)
- Azure Blob Storage (~$2-5/month)
- Azure AD B2C (complex setup)
- Azure Functions (background jobs)
- Azure Application Insights
- Azure Key Vault

Frontend:
- Azure Static Web Apps or App Service

Total: ~$30-50/month + $100 student credit burns out in 2-3 months
```

### NEW Architecture (January 2026)

```
Backend:
- Local Docker: PostgreSQL 16 + pgvector
- Local Docker: Redis 7
- Local FastAPI (uvicorn)
- Local filesystem (resume uploads)
- Simple JWT auth (or skip for demo)

Frontend:
- Local Vite dev server (React)
- Static build for demo

Infrastructure Cost: $0/month
Demo: Runs on laptop, no cloud dependencies
```

**Why this is better for 8-week competition:**
- ✅ Zero infrastructure costs
- ✅ No deployment delays (iterate faster)
- ✅ More impressive (judges see real-time execution)
- ✅ No "server down" risk during demo
- ✅ Portable (can demo anywhere with laptop + Docker)

---

## Data Architecture Changes

### OLD: Generic Consulting Roles

**Problem:** PRD assumed generic "Analyst → Partner" progression

**Missed:** EY has 3 distinct service lines with different career paths

### NEW: Multi-Track Service Lines

**SpringAIS now models EY's actual structure:**

#### 1. Assurance (300 employees, 33%)
```
Career Path: Staff → Senior → Manager → Senior Manager → Partner
Core Skills: Accounting, Audit, GAAP, Financial Reporting
Focus Areas: Audit, Financial Reporting, Risk & Compliance, SEC Reporting
```

#### 2. Tax (300 employees, 33%)
```
Career Path: Staff → Senior → Manager → Senior Manager → Partner
Core Skills: Tax Law, Tax Planning, Compliance, Research
Focus Areas: Corporate Tax, International Tax, Transfer Pricing, M&A Tax
```

#### 3. Consulting (300 employees, 34%)
```
Career Path: Analyst → Associate → Sr Associate → Consultant →
             Sr Consultant → Manager → Sr Manager → Director → Partner
Core Skills: Strategy, Client Management, Project Management
Focus Areas (Tech): Cloud, Data & Analytics, Cybersecurity, AI/ML
Focus Areas (Business): Strategy, Operations, Finance Transform, Supply Chain
```

**Total Role Types:** ~25 (was 7)

**Why this matters:**
- ✅ Shows cross-functional mobility (Tax → Consulting)
- ✅ More realistic demo scenarios
- ✅ Reflects actual EY structure
- ✅ Same cost (still 900 employees total)

---

## Synthetic Data Changes

### OLD: Full LLM Generation

```
GPT-5.2 Instant generates everything:
- Role titles
- Skills
- Experience
- Performance metrics
- Career history
- Feedback text

Cost: ~$22 for 1000 employees
Risk: Skills might not match requirements
Risk: Data quality issues hard to fix
```

### NEW: Hybrid Hard-Coded + LLM

```
HARD-CODED ($0):
- Role titles and hierarchy
- Core required skills (from job postings/O*NET)
- Experience ranges per role
- Performance metric ranges

GPT-5 NANO ($0.04):
- Individual metric variation
- Soft skills
- Career history
- Skill proficiency levels

GPT-5.2 Instant ($1.50):
- Feedback themes (user-facing text)
- Notable achievements

Cost: ~$2 for 900 employees (vs $22)
Quality: GUARANTEED correctness of core skills
Speed: Faster generation (less API calls)
```

**Example:**
```
Hard-coded template guarantees:
  "Every Senior Analyst has: Accounting, Audit, GAAP"

LLM adds variation:
  Employee A: 82% utilization, "detail-oriented" feedback
  Employee B: 77% utilization, "collaborative" feedback

Result: Realistic diversity WITH guaranteed baseline quality
```

---

## Matching Algorithm Changes

### OLD: Vector + ML Hybrid

```
1. Vector search: Find top 100 candidates
2. ML model: Rank those 100 using features
   - Vector similarity
   - Skill gaps
   - Success patterns
   - Recency
3. Return top 10

Development time: +3-5 days
Complexity: High
Value add for MVP: Low (only ~25 role types to rank)
```

### NEW: Vector-Only (Simpler, Sufficient)

```
1. Vector similarity search against ~25 role types
2. Sort by cosine similarity
3. Return top 10

Development time: Saved 3-5 days
Complexity: Low
Value add: SAME as ML for this scale
Future: Add ML when job posting DB grows to 100+
```

**Why skip ML for MVP:**
- Only ~25 role types to rank (too few for ML benefit)
- Vector similarity performs excellently at this scale
- Saves development time
- Can add ML later when job posting database grows

---

## Success Pattern Priority Changes

### OLD: Success Patterns Only

```
User wants: Senior Analyst role

System shows:
- Success pattern analysis (from synthetic employees)
- Common skills, metrics, paths

Missing: Actual job requirements
```

### NEW: Job Postings FIRST, Success Patterns SECOND

```
User wants: Senior Analyst role

IF job posting exists:
  PRIMARY: Job posting requirements
    "Senior Analyst requires: CPA, 3-5 years, GAAP, Excel"

  AUGMENTATION: Success pattern insights
    "92% of current Senior Analysts also have Excel ✅
     78% have strong communication skills (not in posting!)
     Avg 4.2 years experience (you: 3.5 - on track)"

ELSE (no posting):
  PRIMARY: Success patterns only
    "Based on 47 current Senior Analysts:
     Common skills: Accounting (100%), Audit (98%)..."
```

**Why this is better:**
- Job postings = ground truth (when available)
- Success patterns = hidden insights (always valuable)
- System works even without job postings (graceful degradation)
- Growing posting database improves over time

**Scraping strategy:**
- Scrape EY careers weekly/daily
- Archive closed postings (historical data valuable)
- Week 1: ~30-50 postings
- Month 3: ~100+ postings (now ML ranking adds value)

---

## Team Collaboration Changes

### OLD: Cloud Database Sharing

```
Options considered:
- Supabase free tier (500MB limit)
- One person hosts locally (requires them online)
- Everyone generates own data (inconsistent)

Problems: Limited, unreliable, or inconsistent
```

### NEW: Git-Based SQL Dump Sharing

```
Workflow:
1. One person generates synthetic data (~$2, 2 min)
2. They dump database to SQL file (10-50MB)
3. They commit to "data-dumps" git branch
4. Teammates pull and load into local DB
5. Everyone has identical data

Benefits:
✅ Free (git hosting)
✅ Version controlled (can revert)
✅ Works offline
✅ No merge conflicts (separate branch)
✅ Simple (SQL dump/restore)
```

**Branch strategy:**
```bash
# Create once
git checkout -b data-dumps  # ONLY for SQL dumps, never merge

# Data generator workflow
pg_dump springais > data/synthetic_employees.sql
git checkout data-dumps
git add data/synthetic_employees.sql
git commit -m "Generate 900 employees - 2026-01-02"
git push

# Teammate workflow
git checkout data-dumps
git pull
psql springais < data/synthetic_employees.sql
```

---

## Cost Changes

### OLD Estimates (December 2025)

```
Infrastructure (Monthly):
- Azure PostgreSQL: $15-30/month
- Azure Blob Storage: $2-5/month
- Azure Redis: Included in App Service
- Total: $17-35/month

Azure Student Credit: $100
Burn rate: 3-4 months until credit exhausted

Data Generation:
- Full LLM: ~$22 one-time

Total 8-week project: ~$60-80
```

### NEW Actuals (January 2026)

```
Infrastructure (Monthly):
- PostgreSQL: $0 (Docker local)
- Redis: $0 (Docker local)
- Hosting: $0 (runs on laptop)
- Total: $0/month

No cloud credits needed!

Data Generation:
- Hybrid approach: ~$2 one-time

Demo Runtime:
- 50 test resumes × $0.02 = $1

Total 8-week project: ~$3
```

**Savings: ~$57-77** 🎉

---

## PRD Section Updates

### Update: Epic 1 (Infrastructure)

**OLD:**
> Azure AD B2C authentication, Azure Blob Storage, Azure App Service, Azure Functions, Azure Application Insights, Azure Key Vault

**NEW:**
```
Epic 1: Local Infrastructure & Development Setup

- Docker Compose deployment (PostgreSQL 16 + pgvector, Redis 7)
- FastAPI backend with local development
- React frontend with Vite
- Simple JWT authentication (or skip for demo)
- Local file storage for uploads
- Optional: Supabase for free hosting (not required for competition)

Deliverable: `docker-compose up` runs entire stack locally
Time: 1 week
```

### Update: Epic 2 (Data Generation)

**ADD NEW EPIC:**
```
Epic 2a: Synthetic Data Generation

- Define role templates (3 service lines, ~25 role types)
- Hybrid generation script (hard-coded + LLM)
- O*NET API integration for skill taxonomy
- Multi-layer validation (distribution, correlation, progression)
- Git-based team sharing (SQL dumps)

Deliverable: 900 realistic employees across Assurance, Tax, Consulting
Time: 1 week
Cost: ~$2 one-time
```

### Update: Epic 3 (Matching)

**REMOVE:** ML ranking pipeline

**KEEP:**
- pgvector similarity search
- Cosine similarity scoring
- Multi-mode discovery (Best Fit, Stretch, Exploratory)

**SIMPLIFY:**
```
Matching Algorithm:

1. Vector search against ~25 role types
2. Vector search against job postings (grows over time)
3. Sort by cosine similarity
4. Return top 10

For each match:
  IF job posting exists:
    - Show job requirements (PRIMARY)
    - Add success patterns (AUGMENTATION)
  ELSE:
    - Show success patterns only (PRIMARY)

No ML ranking needed for MVP (can add later)
```

### Update: Success Criteria

**ADD:**

```
Data Quality Success:
- 900 synthetic employees generated
- 300 Assurance, 300 Tax, 300 Consulting
- Realistic distributions validated
- All role types have 20+ employees
- Performance metrics correlate with role level
- No impossible patterns (e.g., Junior with 10y experience)

Infrastructure Success:
- Entire stack runs locally in Docker
- Zero cloud costs during 8-week dev
- Team can share data via git
- Demo runs reliably on any laptop
```

---

## Migration Notes

### For Development Team

**If you started with old architecture:**

1. **Remove Azure dependencies**
   ```bash
   # Uninstall Azure SDKs
   pip uninstall azure-storage-blob azure-identity
   npm uninstall @azure/storage-blob
   ```

2. **Switch to Docker local**
   ```bash
   docker-compose up postgres redis -d
   ```

3. **Pull synthetic data**
   ```bash
   git checkout data-dumps
   git pull
   psql springais < data/synthetic_employees.sql
   ```

4. **Update environment variables**
   ```bash
   # Remove
   AZURE_STORAGE_CONNECTION_STRING
   AZURE_AD_B2C_TENANT_ID
   # etc.

   # Keep
   OPENAI_API_KEY
   ONET_API_KEY
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/springais
   ```

**If you're starting fresh:** Just follow `tech-stack.md` setup instructions

---

## Timeline Impact

### OLD 8-Week Timeline

```
Week 1: Azure setup, authentication
Week 2: Skill extraction pipeline
Week 3: Matching engine
Week 4: Career visualization
Week 5: Success patterns
Week 6: Job posting integration
Week 7: ML ranking model
Week 8: Polish
```

### NEW 8-Week Timeline

```
Week 1: Docker setup, local dev environment ✅ FASTER
Week 2: Synthetic data generation ✅ NEW
Week 3: Skill extraction pipeline (same)
Week 4: Matching engine (simpler, no ML) ✅ FASTER
Week 5: Success pattern analysis (same)
Week 6: Visualization (React Flow) (same)
Week 7: Job posting scraper + integration (same)
Week 8: Polish + demo prep (same)

Saved time: ~3-5 days (no Azure setup, no ML model)
Better use of time: Generated realistic data, multi-track structure
```

---

## Updated Success Metrics

### Technical Metrics (Unchanged)

- Skill extraction accuracy: >85%
- pgvector query time: <2s
- Cached skill inference: <3s
- Uncached skill inference: <15s

### NEW Metrics (Added)

```
Data Quality:
- Synthetic employees: 900 (300/300/300)
- Role distribution: Within ±10% of target
- Performance correlation: Higher roles → better metrics ✅
- Career progression: No impossible jumps ✅

Infrastructure:
- Setup time: <30 min (docker-compose up)
- Team data sync: <5 min (git pull + psql load)
- Demo reliability: 100% uptime (local = no server issues)
- Cost: $0/month infrastructure ✅
```

---

## Documentation Updates Needed

1. ✅ **tech-stack.md** - Completely rewritten (2026-01-02)
2. ✅ **data-generation-plan.md** - New document created
3. ✅ **database-setup-guide.md** - New document created
4. ⚠️ **prd.md** - Add this document as appendix
5. ⚠️ **README.md** - Update setup instructions

---

## Appendix: Architecture Comparison

| Aspect | OLD (Dec 2025) | NEW (Jan 2026) | Impact |
|--------|----------------|----------------|---------|
| **Hosting** | Azure App Service | Local Docker | $0 cost ✅ |
| **Database** | Azure PostgreSQL ($30/mo) | Local PostgreSQL | $0 cost ✅ |
| **Storage** | Azure Blob | Local filesystem | $0 cost ✅ |
| **Auth** | Azure AD B2C | Simple JWT | Faster setup ✅ |
| **Data Approach** | Full LLM ($22) | Hybrid ($2) | 90% cheaper ✅ |
| **Roles Modeled** | 7 generic | 25 across 3 lines | More realistic ✅ |
| **Matching** | Vector + ML | Vector only | Simpler, sufficient ✅ |
| **Team Collab** | Cloud DB | Git SQL dumps | Free, versioned ✅ |
| **Demo** | Hosted URL | Laptop local | More impressive ✅ |
| **Setup Time** | 2-3 days | 30 minutes | Faster iteration ✅ |
| **Total Cost (8wk)** | ~$60-80 | ~$3 | 95% savings ✅ |

---

## Approval

**This architecture is APPROVED for 8-week competition MVP.**

**Next steps:**
1. Update PRD with this addendum
2. Follow tech-stack.md for implementation
3. Generate synthetic data using data-generation-plan.md
4. Team loads data using database-setup-guide.md

**Questions?** See tech-stack.md or ask the team.

---

**Document Status:** FINAL - Ready for implementation
**Last Updated:** 2026-01-02
**Author:** Clays
