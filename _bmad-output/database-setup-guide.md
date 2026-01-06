# SpringAIS Database Setup & Collaboration Guide

**Last Updated:** 2026-01-02
**For:** Local PostgreSQL + pgvector with git-based team sharing

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Initial Setup (One-Time)](#initial-setup-one-time)
3. [Team Collaboration Workflow](#team-collaboration-workflow)
4. [Database Schema](#database-schema)
5. [Common Operations](#common-operations)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

**For teammates loading existing data:**

```bash
# 1. Start PostgreSQL
docker-compose up postgres -d

# 2. Pull latest data
git fetch origin
git checkout data-dumps
git pull

# 3. Load database
psql -h localhost -U postgres springais < data/synthetic_employees.sql

# 4. Back to main branch
git checkout main

# Done! Database is loaded
```

**For data generator (creating new data):**

```bash
# 1. Generate synthetic data
python scripts/generate_synthetic_data.py

# 2. Dump database
pg_dump -h localhost -U postgres springais > data/synthetic_employees.sql

# 3. Share with team
git checkout data-dumps
git add data/synthetic_employees.sql
git commit -m "Generate 900 employees - $(date +%Y-%m-%d)"
git push origin data-dumps
git checkout main
```

---

## Initial Setup (One-Time)

### Prerequisites

- Docker Desktop installed
- Git configured
- Python 3.11+ (for data generation script)
- PostgreSQL client tools (psql, pg_dump)

### Step 1: Clone Repository

```bash
git clone https://github.com/your-org/SpringAIS.git
cd SpringAIS
```

### Step 2: Set Up Docker Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your OpenAI API key
# OPENAI_API_KEY=your-key-here
# ONET_API_KEY=your-key-here (register at onetcenter.org)

# Start services
docker-compose up -d

# Verify PostgreSQL is running
docker-compose ps
```

Expected output:
```
NAME                SERVICE    STATUS
springais-postgres  postgres   running
springais-redis     redis      running
```

### Step 3: Create Database and Enable pgvector

```bash
# Connect to PostgreSQL
docker exec -it springais-postgres psql -U postgres

# Inside psql:
CREATE DATABASE springais;
\c springais
CREATE EXTENSION IF NOT EXISTS vector;
\q
```

### Step 4: Create Git Branch for Data Dumps

```bash
# Create dedicated branch (do this once, team-wide)
git checkout -b data-dumps
git push -u origin data-dumps

# This branch will ONLY contain SQL dumps
# Never merge it into main - it's just for data transfer
```

### Step 5: Initialize Database Schema

```bash
# Run migrations
python scripts/init_database.py

# This creates all tables:
# - employees
# - roles
# - job_postings
# - skill_embeddings
# - matches
# - etc.
```

---

## Team Collaboration Workflow

### Architecture: Why Git-Based Sharing?

**Problem:** 4 teammates need identical synthetic employee data

**Options considered:**
- ❌ Cloud database (costs money, requires hosting)
- ❌ One person hosts locally (requires them to be online 24/7)
- ✅ **Git-based SQL dumps (free, version-controlled, works offline)**

**How it works:**
1. One person generates synthetic data (~2 min, ~$2)
2. They dump database to SQL file (~10-50MB)
3. They commit to `data-dumps` branch
4. Teammates pull and load into local database
5. Everyone has identical data

### Workflow for Data Generator (One Person)

**Who should generate data?** Designate one team member as "data owner" to avoid conflicts.

```bash
# 1. Ensure you're on main branch
git checkout main
git pull

# 2. Start database
docker-compose up postgres -d

# 3. Generate synthetic employees
python scripts/generate_synthetic_data.py

# This will:
# - Load role templates
# - Call GPT-5 Nano for metrics (~$0.04)
# - Call GPT-5.2 Instant for feedback text (~$1.50)
# - Validate data quality
# - Save to PostgreSQL
# - Print summary

# 4. Verify data
psql -h localhost -U postgres springais -c "SELECT COUNT(*) FROM employees;"
# Should show: 900

# 5. Create SQL dump
mkdir -p data
pg_dump -h localhost -U postgres springais > data/synthetic_employees.sql

# Verify dump size
ls -lh data/synthetic_employees.sql
# Should be ~10-50MB

# 6. Switch to data-dumps branch
git checkout data-dumps

# 7. Add and commit
git add data/synthetic_employees.sql
git commit -m "Generate 900 synthetic employees - $(date +%Y-%m-%d)"

# 8. Push to remote
git push origin data-dumps

# 9. Return to main branch
git checkout main

# 10. Notify team
echo "✅ Synthetic data generated and pushed to data-dumps branch"
echo "   Team: run 'git checkout data-dumps && git pull' to get latest data"
```

### Workflow for Teammates (Loading Data)

```bash
# 1. Ensure your database is running
docker-compose up postgres -d

# 2. Fetch latest changes
git fetch origin

# 3. Switch to data-dumps branch
git checkout data-dumps

# 4. Pull latest data
git pull origin data-dumps

# 5. Check what you're loading
ls -lh data/synthetic_employees.sql
git log -1 --oneline
# Shows: "Generate 900 synthetic employees - 2026-01-02"

# 6. Drop existing data (if any)
psql -h localhost -U postgres springais -c "TRUNCATE TABLE employees CASCADE;"

# 7. Load data from SQL dump
psql -h localhost -U postgres springais < data/synthetic_employees.sql

# 8. Verify load
psql -h localhost -U postgres springais -c "SELECT COUNT(*) FROM employees;"
# Should show: 900

psql -h localhost -U postgres springais -c "
  SELECT service_line, COUNT(*)
  FROM employees
  GROUP BY service_line
  ORDER BY service_line;
"
# Should show:
#  service_line | count
# --------------+-------
#  Assurance    |   300
#  Consulting   |   300
#  Tax          |   300

# 9. Return to main branch
git checkout main

# Done! You have the same data as the rest of the team
```

### When to Regenerate Data

**Regenerate when:**
- Role templates change (added new roles, changed skills)
- Validation rules change (want better quality)
- Team wants to test with different distributions
- Found bugs in generation script

**Don't regenerate when:**
- Just for fun (costs $2 each time)
- Minor code changes unrelated to data
- One person had a local issue (they should just reload)

---

## Database Schema

### Core Tables

#### employees

Primary synthetic employee data for success pattern analysis.

```sql
CREATE TABLE employees (
    -- Identity
    id VARCHAR(20) PRIMARY KEY,  -- EMP-XXXXXX
    service_line VARCHAR(50) NOT NULL,  -- Assurance | Tax | Consulting
    current_role VARCHAR(100) NOT NULL,
    role_level INTEGER NOT NULL,  -- 1=Staff, 2=Senior, 3=Manager, etc.

    -- Experience
    years_experience NUMERIC(4, 2) NOT NULL,

    -- Skills (JSONB for flexible queries)
    skills JSONB NOT NULL,
    -- Example: [
    --   {"name": "Accounting", "proficiency": 4.5, "years": 4},
    --   {"name": "Audit", "proficiency": 4.2, "years": 3}
    -- ]

    -- Performance metrics (JSONB)
    performance_metrics JSONB NOT NULL,
    -- Example: {
    --   "financial": {"utilization": 82.5, "revenue_impact": "Medium"},
    --   "compliance": {"training_completion": 98, "audit_findings": 0},
    --   "quality": {"client_satisfaction": 4.1, "deliverable_quality": 4.3},
    --   "development": {"certifications": 2, "mentees": 1},
    --   "people": {"team_feedback": 4.2, "leadership_score": 3.8}
    -- }

    -- Career history (JSONB array)
    career_history JSONB,
    -- Example: [
    --   {"role": "Staff Accountant", "duration_months": 24},
    --   {"role": "Senior Accountant", "duration_months": 26}
    -- ]

    -- User-facing text
    feedback_themes TEXT[],
    -- Example: ["Strong attention to detail", "Excellent technical skills"]

    notable_achievement TEXT,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_employees_service_line ON employees(service_line);
CREATE INDEX idx_employees_role ON employees(current_role);
CREATE INDEX idx_employees_role_level ON employees(role_level);
CREATE INDEX idx_employees_service_role ON employees(service_line, current_role);

-- GIN index for JSONB skill searches
CREATE INDEX idx_employees_skills ON employees USING GIN(skills);
```

#### roles

Role definitions (the 25 role types across 3 service lines).

```sql
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    service_line VARCHAR(50) NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    role_level INTEGER NOT NULL,

    -- Skills required for this role
    core_skills JSONB NOT NULL,
    common_skills JSONB NOT NULL,

    -- Typical experience range
    min_years_experience INTEGER,
    max_years_experience INTEGER,

    -- Focus areas available for this role
    focus_areas TEXT[],

    UNIQUE(service_line, role_name)
);
```

#### job_postings

Scraped EY job postings (grows over time).

```sql
CREATE TABLE job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    service_line VARCHAR(50),
    location VARCHAR(255),

    -- Dates
    posted_date DATE NOT NULL,
    closed_date DATE,  -- NULL if still open
    scraped_at TIMESTAMP DEFAULT NOW(),

    -- Skills
    required_skills TEXT[],
    preferred_skills TEXT[],

    -- Content
    description TEXT,
    years_experience VARCHAR(50),  -- e.g., "3-5 years"

    -- Source
    posting_url TEXT,

    -- Full text search
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english',
            COALESCE(title, '') || ' ' ||
            COALESCE(description, ''))
    ) STORED
);

CREATE INDEX idx_job_postings_service_line ON job_postings(service_line);
CREATE INDEX idx_job_postings_posted_date ON job_postings(posted_date);
CREATE INDEX idx_job_postings_active ON job_postings(closed_date) WHERE closed_date IS NULL;
CREATE INDEX idx_job_postings_search ON job_postings USING GIN(search_vector);
```

#### skill_embeddings

Cached embeddings for vector search.

```sql
CREATE TABLE skill_embeddings (
    skill_name VARCHAR(255) PRIMARY KEY,
    embedding vector(3072),  -- text-embedding-3-large dimension
    created_at TIMESTAMP DEFAULT NOW()
);

-- Vector similarity index (HNSW for fast approximate search)
CREATE INDEX ON skill_embeddings USING hnsw (embedding vector_cosine_ops);
```

---

## Common Operations

### Query Success Patterns

**Get all Senior Analysts in Assurance:**

```sql
SELECT
    id,
    years_experience,
    skills,
    performance_metrics,
    feedback_themes
FROM employees
WHERE service_line = 'Assurance'
  AND current_role = 'Senior Analyst';
```

**Calculate average metrics for a role:**

```sql
SELECT
    AVG((performance_metrics->'financial'->>'utilization')::numeric) AS avg_utilization,
    AVG((performance_metrics->'quality'->>'client_satisfaction')::numeric) AS avg_client_sat,
    AVG(years_experience) AS avg_experience,
    COUNT(*) AS employee_count
FROM employees
WHERE service_line = 'Assurance'
  AND current_role = 'Senior Analyst';
```

**Find most common skills for a role:**

```sql
SELECT
    skill->>'name' AS skill_name,
    COUNT(*) AS employee_count,
    ROUND(100.0 * COUNT(*) / (
        SELECT COUNT(*)
        FROM employees
        WHERE service_line = 'Assurance'
          AND current_role = 'Senior Analyst'
    ), 1) AS percentage
FROM employees,
     jsonb_array_elements(skills) AS skill
WHERE service_line = 'Assurance'
  AND current_role = 'Senior Analyst'
GROUP BY skill->>'name'
ORDER BY employee_count DESC
LIMIT 10;
```

### Vector Similarity Search

**Find roles similar to user's skills:**

```sql
-- Assume user_embedding is already computed
WITH user_skills AS (
    SELECT embedding
    FROM skill_embeddings
    WHERE skill_name = 'Python'  -- Example
)
SELECT
    skill_name,
    1 - (embedding <=> (SELECT embedding FROM user_skills)) AS similarity
FROM skill_embeddings
ORDER BY embedding <=> (SELECT embedding FROM user_skills)
LIMIT 10;
```

### Data Validation Queries

**Check employee distribution:**

```sql
SELECT
    service_line,
    current_role,
    COUNT(*) AS count
FROM employees
GROUP BY service_line, current_role
ORDER BY service_line, current_role;
```

**Verify performance metric ranges:**

```sql
SELECT
    service_line,
    current_role,
    MIN((performance_metrics->'financial'->>'utilization')::numeric) AS min_util,
    AVG((performance_metrics->'financial'->>'utilization')::numeric) AS avg_util,
    MAX((performance_metrics->'financial'->>'utilization')::numeric) AS max_util
FROM employees
GROUP BY service_line, current_role
ORDER BY service_line, current_role;
```

---

## Troubleshooting

### Problem: "psql: command not found"

**Solution:** Install PostgreSQL client tools

**Mac:**
```bash
brew install postgresql
```

**Windows:**
```bash
# Download PostgreSQL installer from postgresql.org
# Or use chocolatey:
choco install postgresql
```

**Linux:**
```bash
sudo apt-get install postgresql-client
```

### Problem: "pg_dump: server version: 16.0; pg_dump version: 14.0"

**Solution:** Upgrade pg_dump or use Docker

```bash
# Option A: Upgrade pg_dump (recommended)
brew upgrade postgresql  # Mac
choco upgrade postgresql  # Windows

# Option B: Use Docker version
docker exec springais-postgres pg_dump -U postgres springais > data/synthetic_employees.sql
```

### Problem: "FATAL: database 'springais' does not exist"

**Solution:** Create the database first

```bash
docker exec -it springais-postgres psql -U postgres -c "CREATE DATABASE springais;"
docker exec -it springais-postgres psql -U postgres springais -c "CREATE EXTENSION vector;"
```

### Problem: SQL dump file is huge (>100MB)

**Solution:** Check if you have unnecessary data

```bash
# Check table sizes
docker exec -it springais-postgres psql -U postgres springais -c "
  SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"

# If employees table is >50MB, you might have generated too much data
# Or have redundant test data - truncate and reload
```

### Problem: "ERROR: syntax error at or near 'vector'"

**Solution:** pgvector extension not installed

```bash
docker exec -it springais-postgres psql -U postgres springais -c "CREATE EXTENSION vector;"
```

### Problem: Team members have different data

**Solution:** Verify everyone is on the same commit

```bash
# On data-dumps branch
git checkout data-dumps
git log -1 --oneline

# Everyone should see the same commit hash
# If not, someone forgot to pull:
git pull origin data-dumps

# Then reload
psql -h localhost -U postgres springais < data/synthetic_employees.sql
```

### Problem: "Permission denied" when loading SQL dump

**Solution:** Check file permissions or use sudo

```bash
# Option A: Fix permissions
chmod +r data/synthetic_employees.sql

# Option B: Use Docker (already has permissions)
docker exec -i springais-postgres psql -U postgres springais < data/synthetic_employees.sql
```

---

## Best Practices

### For Data Generators

1. **Test locally first** - Validate data before pushing
2. **Commit message clarity** - Include date and employee count
3. **Notify team** - Send message when new data is available
4. **Don't regenerate frivolously** - Costs $2 and invalidates team's work

### For All Team Members

1. **Pull before working** - Always have latest data
2. **Don't modify data-dumps branch** - It's read-only for most team
3. **Backup before reloading** - If you have local changes, save them first
4. **Verify after loading** - Run count query to confirm 900 employees

### SQL Dump Management

1. **Keep dumps under 50MB** - Git handles this well
2. **Use compression if needed** - `gzip data/synthetic_employees.sql`
3. **Don't commit to main** - Keep dumps on data-dumps branch only
4. **Version with dates** - Easy to revert to previous data if needed

---

## Appendix: Full Setup Script

For convenience, here's a complete setup script:

```bash
#!/bin/bash
# setup_database.sh - Complete database setup for SpringAIS

set -e  # Exit on error

echo "🚀 Setting up SpringAIS database..."

# 1. Start PostgreSQL
echo "📦 Starting PostgreSQL..."
docker-compose up postgres -d
sleep 5  # Wait for PostgreSQL to be ready

# 2. Create database and extension
echo "🗄️  Creating database..."
docker exec springais-postgres psql -U postgres -c "CREATE DATABASE IF NOT EXISTS springais;"
docker exec springais-postgres psql -U postgres springais -c "CREATE EXTENSION IF NOT EXISTS vector;"

# 3. Initialize schema
echo "📋 Initializing schema..."
python scripts/init_database.py

# 4. Check if data dump exists
if [ -f "data/synthetic_employees.sql" ]; then
    echo "📥 Loading synthetic data..."
    psql -h localhost -U postgres springais < data/synthetic_employees.sql
    echo "✅ Database loaded successfully!"
else
    echo "⚠️  No data dump found. To load data:"
    echo "   1. git checkout data-dumps"
    echo "   2. git pull"
    echo "   3. Run this script again"
fi

# 5. Verify
echo "🔍 Verifying setup..."
docker exec springais-postgres psql -U postgres springais -c "SELECT COUNT(*) AS employee_count FROM employees;"

echo "✨ Database setup complete!"
```

Usage:
```bash
chmod +x setup_database.sh
./setup_database.sh
```

---

**Need help?** Check the troubleshooting section or ask the team on Slack/Discord.

**Ready to start developing?** See `tech-stack.md` for architecture details and `data-generation-plan.md` for how synthetic data is created.
