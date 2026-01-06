# BLOCK C: Database Models - CONTEXT

**Block ID:** BLOCK-C-DATABASE-MODELS
**Phase:** STEP-2-DEVELOPMENT
**Category:** #backend #database #sqlalchemy
**Estimated Time:** 2 days
**Dependencies:** STEP-1-SETUP (database schema exists)

---

## AI Quick Start Prompt

```
You are working on BLOCK-C: Database Models for SpringAIS.

Goal: Create SQLAlchemy ORM models for all 6 PostgreSQL tables with relationships, indexes, and constraints.

Key constraints:
- 6 tables: employees, job_postings, matches, skill_embeddings, user_profiles, career_paths
- Full relationship mapping (ForeignKeys, back_populates)
- Performance indexes on commonly queried fields
- JSONB field handling for skills, performance_metrics
- Alembic migrations for version control

Read TASKS.md for step-by-step implementation checklist.
Read VERIFICATION.md for model validation tests.
```

---

## Purpose

Create production-ready SQLAlchemy ORM models that provide type-safe database access, enforce data integrity through relationships and constraints, and enable efficient querying through strategic indexing.

**Why this matters:**
- Type safety prevents runtime errors from invalid database operations
- Relationships enforce referential integrity at the ORM level
- Indexes ensure fast queries for matching engine and success patterns
- Migrations enable team collaboration on schema changes
- Models provide single source of truth for database structure

**Success outcome:**
- All 6 tables have complete ORM models with proper types
- Relationships defined (employees ↔ matches ↔ job_postings)
- Strategic indexes on high-query fields (service_line, current_role, match scores)
- Alembic migrations track all schema changes
- Models validated through automated tests

---

## Background: SpringAIS Database Schema

### Schema Overview (from STEP-1-SETUP)

**6 Core Tables:**
1. **employees** - Synthetic employee profiles with skills and performance metrics
2. **job_postings** - EY job postings scraped from careers site
3. **matches** - AI-generated employee-to-job matches with scores
4. **skill_embeddings** - Text embeddings for semantic similarity search
5. **user_profiles** - User accounts, resume data, skill assessments
6. **career_paths** - Career progression paths visualized in React Flow

### Table Relationships

```
employees (1) ──→ (N) matches (N) ←── (1) job_postings
    ↓                                        ↓
    └──→ (N) skill_embeddings               └──→ (N) skill_embeddings

user_profiles (1) ──→ (N) matches
    ↓
    └──→ (1) career_paths (current position visualization)
```

### Critical Indexes for Performance

**High-volume queries:**
- `employees.service_line` - Success pattern analysis (500+ queries/min in demo)
- `employees.current_role` - Role-based filtering
- `matches.user_id + match_score DESC` - Top matches per user
- `skill_embeddings.embedding` - pgvector similarity search (HNSW index)
- `job_postings.service_line + created_at DESC` - Recent jobs by line

**Index strategy:**
- B-tree indexes on equality/range queries (service_line, role_level)
- HNSW (Hierarchical Navigable Small World) indexes on vector embeddings
- Composite indexes on commonly combined filters

---

## SQLAlchemy Model Architecture

### Base Model Configuration

**File:** `backend/models/base.py`

```python
from datetime import datetime
from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models"""
    pass

class TimestampMixin:
    """Mixin for created_at/updated_at timestamps"""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
```

**Why this approach:**
- `DeclarativeBase` enables modern SQLAlchemy 2.0 mapped classes
- `TimestampMixin` provides audit trail for all records
- `Mapped[Type]` provides IDE type hints and validation

---

## Model Definitions

### 1. Employee Model

**File:** `backend/models/employee.py`

**Purpose:** Represents synthetic EY employees for testing matching engine

**Key fields:**
- `id` (VARCHAR) - Primary key: "EMP-ASR-0001"
- `service_line` (VARCHAR) - Assurance, Tax, Consulting
- `current_role` (VARCHAR) - Senior, Manager, Partner, etc.
- `role_level` (INTEGER) - 1-9 hierarchy level
- `years_experience` (NUMERIC) - Total years in field
- `skills` (JSONB) - Array of skill strings
- `performance_metrics` (JSONB) - utilization, billing_rate, quality_score, etc.
- `feedback_themes` (ARRAY[TEXT]) - Common feedback patterns
- `notable_achievement` (TEXT) - LLM-generated career highlight

**Relationships:**
- `matches` - One-to-many with Match model
- `skill_embeddings` - Implicit through skill text matching

**Indexes:**
```python
__table_args__ = (
    Index('idx_employee_service_line', 'service_line'),
    Index('idx_employee_current_role', 'current_role'),
    Index('idx_employee_role_level', 'role_level'),
    Index('idx_employee_skills', 'skills', postgresql_using='gin'),  # JSONB index
)
```

---

### 2. JobPosting Model

**File:** `backend/models/job_posting.py`

**Purpose:** EY job postings scraped from careers site

**Key fields:**
- `id` (VARCHAR) - Primary key: "JOB-2026-0001"
- `external_id` (VARCHAR) - EY's job ID (unique)
- `title` (VARCHAR) - Job title
- `service_line` (VARCHAR) - Assurance, Tax, Consulting
- `location` (VARCHAR) - City, State, Country
- `description` (TEXT) - Full job description (Markdown)
- `required_skills` (JSONB) - Array of required skill strings
- `preferred_skills` (JSONB) - Array of nice-to-have skills
- `experience_years_min` (INTEGER)
- `experience_years_max` (INTEGER)
- `posting_url` (VARCHAR) - Original EY URL
- `scraped_at` (TIMESTAMP) - When job was scraped

**Relationships:**
- `matches` - One-to-many with Match model
- `skill_embeddings` - Implicit through skill text matching

**Indexes:**
```python
__table_args__ = (
    Index('idx_job_posting_service_line', 'service_line'),
    Index('idx_job_posting_created_at', 'created_at', postgresql_using='brin'),  # Time-series
    Index('idx_job_posting_external_id', 'external_id', unique=True),
    Index('idx_job_posting_required_skills', 'required_skills', postgresql_using='gin'),
)
```

**BRIN index rationale:** Job postings are time-ordered, BRIN (Block Range INdex) is 10x smaller for time-series data

---

### 3. Match Model

**File:** `backend/models/match.py`

**Purpose:** AI-generated employee-to-job matches with multi-dimensional scores

**Key fields:**
- `id` (UUID) - Primary key (auto-generated)
- `employee_id` (VARCHAR) - Foreign key → employees.id
- `job_posting_id` (VARCHAR) - Foreign key → job_postings.id
- `user_id` (UUID) - Foreign key → user_profiles.id (nullable for synthetic employees)
- `match_mode` (VARCHAR) - "best_fit", "stretch", "exploratory"
- `overall_score` (NUMERIC) - 0.0-1.0 weighted aggregate score
- `skill_match_score` (NUMERIC) - 0.0-1.0 skill overlap score
- `experience_score` (NUMERIC) - 0.0-1.0 experience alignment
- `growth_potential_score` (NUMERIC) - 0.0-1.0 career development potential
- `skill_gaps` (JSONB) - Array of missing skills
- `matched_skills` (JSONB) - Array of overlapping skills
- `explanation` (TEXT) - LLM-generated match reasoning

**Relationships:**
- `employee` - Many-to-one with Employee model
- `job_posting` - Many-to-one with JobPosting model
- `user_profile` - Many-to-one with UserProfile model (nullable)

**Indexes:**
```python
__table_args__ = (
    Index('idx_match_employee_id', 'employee_id'),
    Index('idx_match_job_posting_id', 'job_posting_id'),
    Index('idx_match_user_score', 'user_id', 'overall_score', postgresql_order_by=['overall_score DESC']),  # Top matches per user
    Index('idx_match_mode', 'match_mode'),
)
```

**Composite index rationale:** `user_id + overall_score DESC` enables fast "top 10 matches for user" query

---

### 4. SkillEmbedding Model

**File:** `backend/models/skill_embedding.py`

**Purpose:** Text embeddings for semantic similarity search (pgvector)

**Key fields:**
- `id` (UUID) - Primary key (auto-generated)
- `skill_text` (VARCHAR) - Original skill text: "Python", "Cloud Architecture"
- `normalized_text` (VARCHAR) - Lowercase, standardized: "python", "cloud architecture"
- `embedding` (VECTOR(3072)) - text-embedding-3-large embedding
- `source_type` (VARCHAR) - "employee", "job_posting", "user_profile"
- `source_id` (VARCHAR) - ID of source record
- `embedding_model` (VARCHAR) - "text-embedding-3-large" (for future model changes)
- `token_count` (INTEGER) - Tokens used for cost tracking

**Relationships:**
- Implicit relationships through `source_type` + `source_id`

**Indexes:**
```python
__table_args__ = (
    Index('idx_skill_embedding_normalized', 'normalized_text'),  # Exact match cache
    Index('idx_skill_embedding_vector', 'embedding', postgresql_using='hnsw', postgresql_ops={'embedding': 'vector_cosine_ops'}),  # Semantic search
    Index('idx_skill_embedding_source', 'source_type', 'source_id'),
)
```

**HNSW index:** Enables fast approximate nearest neighbor search for semantic similarity

---

### 5. UserProfile Model

**File:** `backend/models/user_profile.py`

**Purpose:** Real user accounts with resume data and skill assessments

**Key fields:**
- `id` (UUID) - Primary key (auto-generated)
- `email` (VARCHAR) - Unique user email
- `hashed_password` (VARCHAR) - bcrypt hash
- `full_name` (VARCHAR)
- `current_role` (VARCHAR)
- `years_experience` (NUMERIC)
- `target_service_line` (VARCHAR) - Desired career path: Assurance, Tax, Consulting
- `skills` (JSONB) - Self-assessed skills array
- `resume_text` (TEXT) - Extracted resume text
- `resume_file_url` (VARCHAR) - S3/local storage URL
- `skill_assessment_scores` (JSONB) - Optional quiz scores per skill
- `onboarding_complete` (BOOLEAN) - Has user completed skill input?
- `last_login_at` (TIMESTAMP)

**Relationships:**
- `matches` - One-to-many with Match model
- `career_path` - One-to-one with CareerPath model

**Indexes:**
```python
__table_args__ = (
    Index('idx_user_profile_email', 'email', unique=True),
    Index('idx_user_profile_target_service_line', 'target_service_line'),
    Index('idx_user_profile_skills', 'skills', postgresql_using='gin'),
)
```

---

### 6. CareerPath Model

**File:** `backend/models/career_path.py`

**Purpose:** React Flow graph data for career progression visualization

**Key fields:**
- `id` (UUID) - Primary key (auto-generated)
- `user_id` (UUID) - Foreign key → user_profiles.id (unique)
- `current_position_node_id` (VARCHAR) - React Flow node ID for current role
- `target_position_node_id` (VARCHAR) - React Flow node ID for target role
- `graph_data` (JSONB) - Full React Flow graph: {nodes: [], edges: []}
- `progression_status` (JSONB) - Progress tracking: {completed_steps: [], current_step: "..."}
- `last_updated_at` (TIMESTAMP)

**Relationships:**
- `user_profile` - One-to-one with UserProfile model

**Indexes:**
```python
__table_args__ = (
    Index('idx_career_path_user_id', 'user_id', unique=True),
)
```

**JSONB structure for graph_data:**
```json
{
  "nodes": [
    {"id": "node-1", "type": "role", "data": {"label": "Senior Consultant", "role_level": 5}, "position": {"x": 100, "y": 100}},
    {"id": "node-2", "type": "role", "data": {"label": "Manager", "role_level": 6}, "position": {"x": 300, "y": 100}}
  ],
  "edges": [
    {"id": "edge-1", "source": "node-1", "target": "node-2", "label": "2-3 years", "data": {"required_skills": ["Leadership"]}}
  ]
}
```

---

## Alembic Migration Strategy

### Initial Setup (STEP-1-SETUP already created base schema)

**Migration history:**
```
versions/
  001_initial_schema.py      # ✅ Created in STEP-1-SETUP (tables exist)
  002_add_indexes.py          # 🔄 This block: Add performance indexes
  003_add_relationships.py    # 🔄 This block: Add foreign key constraints
```

### Migration 002: Add Performance Indexes

**File:** `alembic/versions/002_add_indexes.py`

```python
"""Add performance indexes

Revision ID: 002
Revises: 001
Create Date: 2026-01-06
"""

def upgrade():
    # Employee indexes
    op.create_index('idx_employee_service_line', 'employees', ['service_line'])
    op.create_index('idx_employee_current_role', 'employees', ['current_role'])
    op.create_index('idx_employee_role_level', 'employees', ['role_level'])
    op.create_index('idx_employee_skills', 'employees', ['skills'], postgresql_using='gin')

    # Job posting indexes
    op.create_index('idx_job_posting_service_line', 'job_postings', ['service_line'])
    op.create_index('idx_job_posting_created_at', 'job_postings', ['created_at'], postgresql_using='brin')
    op.create_index('idx_job_posting_external_id', 'job_postings', ['external_id'], unique=True)
    op.create_index('idx_job_posting_required_skills', 'job_postings', ['required_skills'], postgresql_using='gin')

    # Match indexes
    op.create_index('idx_match_employee_id', 'matches', ['employee_id'])
    op.create_index('idx_match_job_posting_id', 'matches', ['job_posting_id'])
    op.create_index('idx_match_user_score', 'matches', ['user_id', sa.desc('overall_score')])

    # Skill embedding indexes
    op.create_index('idx_skill_embedding_normalized', 'skill_embeddings', ['normalized_text'])
    op.create_index('idx_skill_embedding_vector', 'skill_embeddings', ['embedding'],
                    postgresql_using='hnsw',
                    postgresql_ops={'embedding': 'vector_cosine_ops'})

    # User profile indexes
    op.create_index('idx_user_profile_email', 'user_profiles', ['email'], unique=True)

    # Career path indexes
    op.create_index('idx_career_path_user_id', 'career_paths', ['user_id'], unique=True)

def downgrade():
    # Drop all indexes (reverse order)
    op.drop_index('idx_career_path_user_id')
    # ... etc
```

### Migration 003: Add Foreign Key Constraints

**File:** `alembic/versions/003_add_relationships.py`

```python
"""Add foreign key relationships

Revision ID: 003
Revises: 002
Create Date: 2026-01-06
"""

def upgrade():
    # Match relationships
    op.create_foreign_key('fk_match_employee', 'matches', 'employees',
                          ['employee_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_match_job_posting', 'matches', 'job_postings',
                          ['job_posting_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_match_user_profile', 'matches', 'user_profiles',
                          ['user_id'], ['id'], ondelete='CASCADE')

    # Career path relationship
    op.create_foreign_key('fk_career_path_user', 'career_paths', 'user_profiles',
                          ['user_id'], ['id'], ondelete='CASCADE')

def downgrade():
    # Drop foreign keys
    op.drop_constraint('fk_career_path_user', 'career_paths')
    # ... etc
```

---

## JSONB Field Handling

### Pattern: Type-Safe JSONB Access

**Problem:** JSONB fields lose type safety, prone to KeyError

**Solution:** Pydantic models for JSONB validation

**Example: PerformanceMetrics**

```python
# backend/models/schemas.py
from pydantic import BaseModel, Field

class PerformanceMetrics(BaseModel):
    """Type-safe schema for employee performance_metrics JSONB field"""
    utilization: float = Field(ge=0, le=100)  # 0-100%
    billing_rate: float = Field(ge=0, le=500)  # $/hr
    realization: float = Field(ge=0, le=100)  # 0-100%
    quality_score: float = Field(ge=1.0, le=5.0)  # 1-5 stars
    training_hours: int = Field(ge=0, le=120)  # per year
    client_feedback: float = Field(ge=1.0, le=5.0)  # 1-5 stars

# Usage in Employee model
from sqlalchemy import JSON
from sqlalchemy.orm import Mapped, mapped_column
from .schemas import PerformanceMetrics

class Employee(Base, TimestampMixin):
    __tablename__ = 'employees'

    performance_metrics: Mapped[dict] = mapped_column(JSON)

    @property
    def metrics(self) -> PerformanceMetrics:
        """Type-safe access to performance metrics"""
        return PerformanceMetrics(**self.performance_metrics)

    @metrics.setter
    def metrics(self, value: PerformanceMetrics):
        """Type-safe setter with validation"""
        self.performance_metrics = value.model_dump()
```

**Benefits:**
- IDE autocomplete for JSONB fields
- Validation prevents invalid data
- Type hints for all JSONB operations

---

## Mock Data for Independent Testing

**Problem:** This block needs to test models before synthetic data exists (Block A)

**Solution:** Pytest fixtures with minimal mock data

**File:** `tests/fixtures/mock_data.py`

```python
import pytest
from backend.models import Employee, JobPosting, Match

@pytest.fixture
def mock_employee(db_session):
    """Create a mock employee for testing relationships"""
    employee = Employee(
        id="MOCK-EMP-001",
        service_line="Consulting",
        current_role="Manager",
        role_level=6,
        years_experience=8.0,
        skills=["Strategy", "Client Management", "AWS"],
        performance_metrics={
            "utilization": 82,
            "billing_rate": 250,
            "quality_score": 4.5
        }
    )
    db_session.add(employee)
    db_session.commit()
    return employee

@pytest.fixture
def mock_job_posting(db_session):
    """Create a mock job posting for testing relationships"""
    job = JobPosting(
        id="MOCK-JOB-001",
        external_id="EY-123456",
        title="Senior Manager - Cloud Consulting",
        service_line="Consulting",
        location="New York, NY",
        description="Lead cloud transformation projects...",
        required_skills=["AWS", "Strategy", "Leadership"],
        experience_years_min=7,
        experience_years_max=12
    )
    db_session.add(job)
    db_session.commit()
    return job
```

---

## References

**Related Documentation:**
- `implementation-tracking/STEP-1-SETUP/CONTEXT.md` - Database schema definition
- `_bmad-output/tech-stack.md` - SQLAlchemy 2.0 architecture
- `_bmad-output/architecture-updates-2026.md` - Database design rationale

**SQLAlchemy Resources:**
- SQLAlchemy 2.0 Docs: https://docs.sqlalchemy.org/en/20/
- Declarative Mapping: https://docs.sqlalchemy.org/en/20/orm/declarative_tables.html
- Relationship Configuration: https://docs.sqlalchemy.org/en/20/orm/relationships.html

**PostgreSQL Resources:**
- JSONB Indexing: https://www.postgresql.org/docs/current/datatype-json.html
- pgvector Extension: https://github.com/pgvector/pgvector
- HNSW Indexes: https://github.com/pgvector/pgvector#hnsw

**Alembic Resources:**
- Alembic Tutorial: https://alembic.sqlalchemy.org/en/latest/tutorial.html
- Auto-generating Migrations: https://alembic.sqlalchemy.org/en/latest/autogenerate.html

---

## Success Criteria

**This block is complete when:**

1. ✅ All 6 models defined with proper types (Mapped[Type])
2. ✅ All relationships configured (ForeignKey + back_populates)
3. ✅ All indexes created (B-tree, GIN, HNSW, BRIN)
4. ✅ Alembic migrations run successfully: `alembic upgrade head`
5. ✅ Pytest tests validate all relationships work
6. ✅ JSONB fields have Pydantic schemas for type safety
7. ✅ Mock data fixtures enable testing without Block A/B data
8. ✅ Models can insert/query records without errors

**Quality Checklist:**
- [ ] All models inherit from Base and TimestampMixin
- [ ] All foreign keys have ondelete='CASCADE' or appropriate behavior
- [ ] All indexes match query patterns from matching engine/success patterns
- [ ] JSONB fields have property accessors with type hints
- [ ] All relationships are bidirectional (back_populates)
- [ ] Migration history is clean and reversible (upgrade/downgrade)

---

## AI Auto-Update Instructions

When you complete a task in TASKS.md:

1. **Update the task checkbox:**
   ```markdown
   - [x] Task 1: Create Base and TimestampMixin classes
   ```

2. **Update PROJECT-STATUS.md:**
   ```markdown
   | **C** | Database Models | 🔄 In Progress | [Your name] | 3/14 tasks | 2 days | #backend #database #sqlalchemy |
   ```

3. **Update this CONTEXT.md if you discover:**
   - Missing indexes for query optimization
   - Better relationship patterns
   - JSONB schema improvements
   - Migration strategy issues

4. **When block complete:**
   - Change status to ✅ Completed in PROJECT-STATUS.md
   - Update "Overall Progress" section
   - Add note: "Block C complete - all models ready for Blocks D-G backend development"

---

**Last Updated:** 2026-01-06
**Status:** Ready for development
**Blocking:** None (can start after STEP-1-SETUP)
**Blocked by:** STEP-1-SETUP must be complete (database schema exists)
