# SpringAIS Database Schema

**Last Updated:** 2026-01-06
**Database:** PostgreSQL 16 with pgvector 0.5.1
**ORM:** SQLAlchemy 2.0

---

## Overview

The SpringAIS database consists of **12 core tables** organized into 4 functional areas:

1. **Core Entities** (3 tables)
   - employees
   - job_postings
   - roles

2. **Skills & Embeddings** (4 tables)
   - employee_skills
   - job_posting_skills
   - employee_embeddings
   - job_posting_embeddings

3. **Career Data** (2 tables)
   - career_transitions
   - performance_reviews

4. **Application Tracking** (3 tables)
   - job_applications
   - saved_matches
   - user_auth

---

## Entity Relationship Diagram

```
┌─────────────────┐         ┌─────────────────┐
│   employees     │◄────────│  user_auth      │
│  (Core profile) │         │  (JWT tokens)   │
└────────┬────────┘         └─────────────────┘
         │
         │ 1:N
         ↓
┌─────────────────────┐     ┌──────────────────────┐
│  employee_skills    │     │ employee_embeddings  │
│  (Skills list)      │     │  (Vector: 3072-D)    │
└─────────────────────┘     └──────────────────────┘
         │
         │ M:N (via matching)
         ↓
┌─────────────────────┐     ┌──────────────────────┐
│  job_postings       │◄────│job_posting_embeddings│
│  (Open positions)   │     │  (Vector: 3072-D)    │
└────────┬────────────┘     └──────────────────────┘
         │
         │ 1:N
         ↓
┌─────────────────────┐
│ job_posting_skills  │
│  (Required skills)  │
└─────────────────────┘
         │
         │ M:N (employee → job_posting)
         ↓
┌──────────────────────┐    ┌──────────────────────┐
│  job_applications    │    │  saved_matches       │
│  (Apply tracking)    │    │  (Bookmarked jobs)   │
└──────────────────────┘    └──────────────────────┘

┌─────────────────────┐
│  roles              │
│  (Role hierarchy)   │
└────────┬────────────┘
         │
         │ 1:N (from_role, to_role)
         ↓
┌──────────────────────┐
│ career_transitions   │
│  (Role changes)      │
└──────────────────────┘
         │
         │ 1:N
         ↓
┌──────────────────────┐
│ performance_reviews  │
│  (Annual reviews)    │
└──────────────────────┘
```

---

## Core Entities

### employees

**Purpose:** Store employee profile information

```sql
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,  -- bcrypt hashed
    name VARCHAR(255) NOT NULL,
    role_id INTEGER REFERENCES roles(id),
    department VARCHAR(100),  -- Advisory, Technology, etc.
    service_line VARCHAR(100),  -- Assurance, Tax, Consulting
    location VARCHAR(100),  -- New York, London, etc.
    experience_years INTEGER,
    hire_date DATE,
    phone VARCHAR(50),
    resume_uploaded BOOLEAN DEFAULT FALSE,
    resume_parsed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employees_role_id ON employees(role_id);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_service_line ON employees(service_line);
```

**Sample Data:**
```sql
INSERT INTO employees VALUES (
    1,
    'john.doe@ey.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYk7qHjU9i2',  -- hashed "password"
    'John Doe',
    5,  -- role_id: Senior Consultant
    'Advisory',
    'Consulting',
    'New York',
    5,
    '2021-01-15',
    '+1-555-123-4567',
    TRUE,
    '2026-01-05 10:30:00',
    '2021-01-15 09:00:00',
    '2026-01-05 10:30:00'
);
```

**Implemented In:** Block C (Database Models)

---

### job_postings

**Purpose:** Store job postings scraped from EY careers site

```sql
CREATE TABLE job_postings (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    department VARCHAR(100),
    service_line VARCHAR(100),
    location VARCHAR(100),
    role_id INTEGER REFERENCES roles(id),
    experience_years_min INTEGER,
    experience_years_max INTEGER,
    salary_range VARCHAR(100),
    posted_date DATE NOT NULL,
    expires_date DATE,
    source_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_job_postings_department ON job_postings(department);
CREATE INDEX idx_job_postings_role_id ON job_postings(role_id);
CREATE INDEX idx_job_postings_posted_date ON job_postings(posted_date DESC);
CREATE INDEX idx_job_postings_is_active ON job_postings(is_active) WHERE is_active = TRUE;
```

**Sample Data:**
```sql
INSERT INTO job_postings VALUES (
    42,
    'Senior AI Engineer',
    'We are seeking a Senior AI Engineer to join our Technology Consulting team...',
    'Technology',
    'Consulting',
    'New York',
    8,  -- role_id: Manager
    5,
    8,
    '$120,000 - $160,000',
    '2026-01-01',
    '2026-02-01',
    'https://careers.ey.com/jobs/12345',
    TRUE,
    '2026-01-01 08:00:00',
    '2026-01-01 08:00:00'
);
```

**Implemented In:** Block B (Job Scraper)

---

### roles

**Purpose:** Define role hierarchy and career levels

```sql
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) UNIQUE NOT NULL,
    service_line VARCHAR(100),  -- Assurance, Tax, Consulting
    level INTEGER NOT NULL,  -- 1 = entry, 9 = partner
    description TEXT,
    avg_salary_min INTEGER,
    avg_salary_max INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_roles_service_line ON roles(service_line);
CREATE INDEX idx_roles_level ON roles(level);
```

**Sample Data:**
```sql
-- Consulting roles (9 levels)
INSERT INTO roles (title, service_line, level, description) VALUES
('Analyst', 'Consulting', 1, 'Entry-level consultant role'),
('Associate', 'Consulting', 2, 'Junior consultant with 1-2 years experience'),
('Senior Associate', 'Consulting', 3, '3-4 years experience'),
('Consultant', 'Consulting', 4, '5-6 years experience'),
('Senior Consultant', 'Consulting', 5, '7-8 years experience, lead small projects'),
('Manager', 'Consulting', 6, '9-11 years, manage teams'),
('Senior Manager', 'Consulting', 7, '12+ years, lead large engagements'),
('Director', 'Consulting', 8, '15+ years, strategic leadership'),
('Partner', 'Consulting', 9, 'Top-level, business development and client relationships');

-- Assurance roles (5 levels)
INSERT INTO roles (title, service_line, level, description) VALUES
('Staff', 'Assurance', 1, 'Entry-level auditor'),
('Senior', 'Assurance', 2, '2-4 years audit experience'),
('Manager', 'Assurance', 3, '5-8 years, lead audit teams'),
('Senior Manager', 'Assurance', 4, '9-12 years, manage multiple engagements'),
('Partner', 'Assurance', 5, 'Top-level audit partner');

-- Tax roles (5 levels)
INSERT INTO roles (title, service_line, level, description) VALUES
('Staff', 'Tax', 1, 'Entry-level tax associate'),
('Senior', 'Tax', 2, '2-4 years tax experience'),
('Manager', 'Tax', 3, '5-8 years, manage tax engagements'),
('Senior Manager', 'Tax', 4, '9-12 years, lead complex tax matters'),
('Partner', 'Tax', 5, 'Top-level tax partner');
```

**Implemented In:** Block A (Synthetic Data)

---

## Skills & Embeddings

### employee_skills

**Purpose:** Store employee skills and proficiency levels

```sql
CREATE TABLE employee_skills (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    skill_name VARCHAR(255) NOT NULL,
    proficiency VARCHAR(50),  -- Beginner, Intermediate, Advanced, Expert
    years_experience INTEGER,
    source VARCHAR(50),  -- resume, manual, inferred
    confidence DECIMAL(3, 2),  -- 0.00 to 1.00 (for AI-extracted skills)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employee_skills_employee_id ON employee_skills(employee_id);
CREATE INDEX idx_employee_skills_skill_name ON employee_skills(skill_name);
CREATE INDEX idx_employee_skills_proficiency ON employee_skills(proficiency);
```

**Sample Data:**
```sql
INSERT INTO employee_skills (employee_id, skill_name, proficiency, years_experience, source, confidence) VALUES
(1, 'Python', 'Expert', 5, 'resume', 0.95),
(1, 'SQL', 'Advanced', 4, 'resume', 0.92),
(1, 'Machine Learning', 'Advanced', 3, 'resume', 0.88),
(1, 'TensorFlow', 'Intermediate', 2, 'resume', 0.85),
(1, 'Leadership', 'Advanced', 5, 'manual', 1.00);
```

**Implemented In:** Block G (Skill Extraction)

---

### job_posting_skills

**Purpose:** Store required skills for each job posting

```sql
CREATE TABLE job_posting_skills (
    id SERIAL PRIMARY KEY,
    job_posting_id INTEGER NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    skill_name VARCHAR(255) NOT NULL,
    required_proficiency VARCHAR(50),  -- Beginner, Intermediate, Advanced, Expert
    is_required BOOLEAN DEFAULT TRUE,  -- TRUE = required, FALSE = nice-to-have
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_job_posting_skills_job_id ON job_posting_skills(job_posting_id);
CREATE INDEX idx_job_posting_skills_skill_name ON job_posting_skills(skill_name);
```

**Sample Data:**
```sql
INSERT INTO job_posting_skills (job_posting_id, skill_name, required_proficiency, is_required) VALUES
(42, 'Python', 'Advanced', TRUE),
(42, 'Machine Learning', 'Advanced', TRUE),
(42, 'TensorFlow', 'Intermediate', TRUE),
(42, 'Kubernetes', 'Intermediate', FALSE),
(42, 'Distributed Systems', 'Intermediate', FALSE);
```

**Implemented In:** Block B (Job Scraper)

---

### employee_embeddings

**Purpose:** Store 3072-D vector embeddings for semantic matching

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE employee_embeddings (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER UNIQUE NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    embedding_vector vector(3072),  -- pgvector type
    model_version VARCHAR(50) DEFAULT 'text-embedding-3-large',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- HNSW index for fast similarity search
CREATE INDEX idx_employee_embeddings_vector ON employee_embeddings
    USING hnsw (embedding_vector vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_employee_embeddings_employee_id ON employee_embeddings(employee_id);
```

**Sample Data:**
```sql
INSERT INTO employee_embeddings (employee_id, embedding_vector) VALUES
(1, '[0.234, -0.891, 0.456, ...]'::vector);  -- 3072 dimensions
```

**Vector Operations:**
```sql
-- Find similar employees (cosine similarity)
SELECT employee_id, 1 - (embedding_vector <=> $1) AS similarity
FROM employee_embeddings
WHERE 1 - (embedding_vector <=> $1) > 0.7
ORDER BY similarity DESC
LIMIT 10;
```

**Implemented In:** Block D (Vector Embeddings)

---

### job_posting_embeddings

**Purpose:** Store 3072-D vector embeddings for job postings

```sql
CREATE TABLE job_posting_embeddings (
    id SERIAL PRIMARY KEY,
    job_posting_id INTEGER UNIQUE NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    embedding_vector vector(3072),
    model_version VARCHAR(50) DEFAULT 'text-embedding-3-large',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- HNSW index for fast similarity search
CREATE INDEX idx_job_posting_embeddings_vector ON job_posting_embeddings
    USING hnsw (embedding_vector vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_job_posting_embeddings_job_id ON job_posting_embeddings(job_posting_id);
```

**Sample Data:**
```sql
INSERT INTO job_posting_embeddings (job_posting_id, embedding_vector) VALUES
(42, '[0.123, -0.456, 0.789, ...]'::vector);
```

**Implemented In:** Block D (Vector Embeddings)

---

## Career Data

### career_transitions

**Purpose:** Track employee role changes for success pattern analysis

```sql
CREATE TABLE career_transitions (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    from_role_id INTEGER NOT NULL REFERENCES roles(id),
    to_role_id INTEGER NOT NULL REFERENCES roles(id),
    transition_date DATE NOT NULL,
    months_to_transition INTEGER,  -- Calculated from time in from_role
    was_promoted BOOLEAN DEFAULT TRUE,  -- TRUE = promotion, FALSE = lateral
    performance_score DECIMAL(3, 2),  -- Avg performance in from_role (1.00-5.00)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_career_transitions_employee_id ON career_transitions(employee_id);
CREATE INDEX idx_career_transitions_from_to ON career_transitions(from_role_id, to_role_id);
CREATE INDEX idx_career_transitions_date ON career_transitions(transition_date DESC);
```

**Sample Data:**
```sql
INSERT INTO career_transitions VALUES (
    1,
    1,  -- employee_id
    4,  -- from_role_id: Consultant
    5,  -- to_role_id: Senior Consultant
    '2024-01-15',
    18,  -- took 18 months
    TRUE,  -- was promoted
    4.2,  -- avg performance score
    '2024-01-15 09:00:00'
);
```

**Aggregation Query (Success Patterns):**
```sql
-- Get success metrics for Consultant → Senior Consultant
SELECT
    COUNT(*) AS total_transitions,
    COUNT(*) FILTER (WHERE was_promoted = TRUE) AS promoted,
    AVG(months_to_transition) AS avg_months,
    AVG(performance_score) AS avg_performance
FROM career_transitions
WHERE from_role_id = 4 AND to_role_id = 5;
```

**Implemented In:** Block F (Success Patterns)

---

### performance_reviews

**Purpose:** Store annual performance review data

```sql
CREATE TABLE performance_reviews (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    review_year INTEGER NOT NULL,
    score DECIMAL(3, 2),  -- 1.00 to 5.00 (EY uses 1-5 scale)
    feedback_summary TEXT,
    strengths TEXT,
    development_areas TEXT,
    reviewer_role VARCHAR(100),  -- Manager, Senior Manager, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_performance_reviews_employee_id ON performance_reviews(employee_id);
CREATE INDEX idx_performance_reviews_year ON performance_reviews(review_year);
CREATE UNIQUE INDEX idx_performance_reviews_employee_year ON performance_reviews(employee_id, review_year);
```

**Sample Data:**
```sql
INSERT INTO performance_reviews VALUES (
    1,
    1,  -- employee_id
    2025,
    4.2,
    'John demonstrated exceptional technical leadership on the AI modernization project...',
    'Strong Python skills, excellent communication',
    'Could improve delegation and mentoring',
    'Senior Manager',
    '2025-12-15 14:30:00'
);
```

**Implemented In:** Block A (Synthetic Data)

---

## Application Tracking

### job_applications

**Purpose:** Track employee applications to internal job postings

```sql
CREATE TABLE job_applications (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    job_posting_id INTEGER NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'applied',  -- applied, interviewing, offered, accepted, rejected, withdrawn
    notes TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_job_applications_employee_id ON job_applications(employee_id);
CREATE INDEX idx_job_applications_job_id ON job_applications(job_posting_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);
CREATE UNIQUE INDEX idx_job_applications_employee_job ON job_applications(employee_id, job_posting_id);
```

**Sample Data:**
```sql
INSERT INTO job_applications VALUES (
    1,
    1,  -- employee_id
    42,  -- job_posting_id
    '2026-01-06 10:00:00',
    'interviewing',
    'Initial screening completed, technical interview scheduled for 2026-01-10',
    '2026-01-06 10:00:00'
);
```

**Implemented In:** Block O (Matching Integration)

---

### saved_matches

**Purpose:** Track bookmarked/saved job matches

```sql
CREATE TABLE saved_matches (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    job_posting_id INTEGER NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    saved_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE INDEX idx_saved_matches_employee_id ON saved_matches(employee_id);
CREATE UNIQUE INDEX idx_saved_matches_employee_job ON saved_matches(employee_id, job_posting_id);
```

**Sample Data:**
```sql
INSERT INTO saved_matches VALUES (
    1,
    1,  -- employee_id
    42,  -- job_posting_id
    '2026-01-06 09:30:00',
    'Great fit, need to improve Kubernetes skills first'
);
```

**Implemented In:** Block O (Matching Integration)

---

### user_auth

**Purpose:** Store JWT refresh tokens (optional for MVP)

```sql
CREATE TABLE user_auth (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER UNIQUE NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500),
    refresh_token_expires_at TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_auth_employee_id ON user_auth(employee_id);
```

**Note:** For MVP, JWT tokens are stateless (no DB storage). This table is for future enhancement.

**Implemented In:** Block M (Core Integration)

---

## Database Indexes Summary

### Performance-Critical Indexes

**Vector Similarity (HNSW):**
- `idx_employee_embeddings_vector` - Enable fast cosine similarity search (<100ms for 10K vectors)
- `idx_job_posting_embeddings_vector` - Enable fast job matching

**Career Transition Queries:**
- `idx_career_transitions_from_to` - Composite index for success pattern analysis (<50ms)

**Employee Skill Lookup:**
- `idx_employee_skills_employee_id` - Enable fast skill retrieval (<10ms)

**Job Posting Filters:**
- `idx_job_postings_department` - Department filter
- `idx_job_postings_is_active` - Partial index for active jobs only

### Index Maintenance

**Check index usage:**
```sql
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

**Rebuild HNSW index (if needed):**
```sql
REINDEX INDEX idx_employee_embeddings_vector;
```

---

## Materialized Views (Future Enhancement)

### mv_employee_match_scores

**Purpose:** Pre-compute top matches for all employees (refresh nightly)

```sql
CREATE MATERIALIZED VIEW mv_employee_match_scores AS
SELECT
    e.id AS employee_id,
    jp.id AS job_posting_id,
    1 - (ee.embedding_vector <=> jpe.embedding_vector) AS similarity_score
FROM employees e
JOIN employee_embeddings ee ON e.id = ee.employee_id
CROSS JOIN job_postings jp
JOIN job_posting_embeddings jpe ON jp.id = jpe.job_posting_id
WHERE jp.is_active = TRUE
    AND 1 - (ee.embedding_vector <=> jpe.embedding_vector) > 0.6
ORDER BY employee_id, similarity_score DESC;

CREATE UNIQUE INDEX idx_mv_match_scores ON mv_employee_match_scores(employee_id, job_posting_id);

-- Refresh nightly at 2 AM
-- (cron job or scheduled task)
```

**Benefits:**
- Match query drops from 800ms → 50ms
- No real-time vector computation needed

**Trade-offs:**
- Stale data (up to 24 hours old)
- Increased storage (~500 MB for 900 employees × 50 jobs)

---

## Database Migrations (Alembic)

### Migration Workflow

```bash
# Create new migration
alembic revision -m "Add user_auth table"

# Apply migration
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Show current version
alembic current
```

### Sample Migration: Add Indexes

```python
# alembic/versions/002_add_indexes.py
def upgrade():
    op.create_index(
        'idx_employee_skills_employee_id',
        'employee_skills',
        ['employee_id']
    )
    op.execute("""
        CREATE INDEX idx_employee_embeddings_vector
        ON employee_embeddings
        USING hnsw (embedding_vector vector_cosine_ops)
        WITH (m = 16, ef_construction = 64);
    """)

def downgrade():
    op.drop_index('idx_employee_skills_employee_id')
    op.drop_index('idx_employee_embeddings_vector')
```

**Implemented In:** Block C (Database Models)

---

## Data Volume Estimates

### 8-Week MVP

| Table | Rows | Size |
|-------|------|------|
| employees | 900 | 500 KB |
| employee_skills | 10,800 (12 per employee) | 1.5 MB |
| employee_embeddings | 900 | 12 MB (3072-D vectors) |
| job_postings | 50 | 200 KB |
| job_posting_embeddings | 50 | 700 KB |
| career_transitions | 5,000 | 1 MB |
| performance_reviews | 4,500 (5 years × 900) | 5 MB |
| **Total** | **~22K rows** | **~21 MB** |

### Future Production (10,000 employees)

| Table | Rows | Size |
|-------|------|------|
| employees | 10,000 | 5 MB |
| employee_skills | 120,000 | 15 MB |
| employee_embeddings | 10,000 | 135 MB |
| job_postings | 500 | 2 MB |
| job_posting_embeddings | 500 | 7 MB |
| **Total** | **~140K rows** | **~165 MB** |

**Conclusion:** Database will fit comfortably in memory (PostgreSQL shared_buffers = 256 MB)

---

## Related Documentation

**Backend:**
- `reference-docs/backend/api-reference.md` - API endpoints that query this schema
- `reference-docs/backend/llm-integration.md` - How embeddings are generated

**Architecture:**
- `reference-docs/architecture/data-flow.md` - How data flows through tables

**Implementation:**
- `implementation-tracking/STEP-2-DEVELOPMENT/BLOCK-C-DATABASE-MODELS/` - SQLAlchemy models
- `implementation-tracking/STEP-2-DEVELOPMENT/BLOCK-D-VECTOR-EMBEDDINGS/` - pgvector setup

---

**Document Purpose:** Complete database schema reference
**Audience:** Backend developers, database administrators
**Last Updated:** 2026-01-06
