# BLOCK C: Database Models - TASKS

**Block:** BLOCK-C-DATABASE-MODELS
**Total Tasks:** 14
**Completed:** 14/14 (100%)

---

## ⚠️ IMPORTANT: Update Instructions

**Note:** ORM models live under `backend/app/models` to align with the existing
`app` package imports; task path references map to that location.

**When you complete a task:**
1. Check the box: `- [x] Task name`
2. Update the "Completed" count at the top
3. Update `PROJECT-STATUS.md`:
   - Find "Block C" row in Step 2 table
   - Update Progress column (e.g., "3/14 tasks")

**When ALL tasks complete:**
1. ✅ Run all verification steps in `VERIFICATION.md`
2. ✅ Change status in `PROJECT-STATUS.md` from ⏸️ to ✅
3. ✅ Update Progress to "14/14 tasks (100%)"
4. ✅ Update "Overall Progress" section
5. ✅ After verification passes, commit changes (do NOT commit until verification is complete)

See `CONTEXT.md` section "Update Instructions (For AI)" for full details.

---

## Progress Tracker

### Phase 1: Base Configuration (Tasks 1-2)

- [x] **Task 1:** Create Base and TimestampMixin classes
  - [x] Create `backend/models/` directory if not exists
  - [x] Create `backend/models/__init__.py` with exports
  - [x] Create `backend/models/base.py`
  - [x] Define `Base` class using `DeclarativeBase`
  - [x] Define `TimestampMixin` with created_at/updated_at
  - [x] Add type hints: `Mapped[datetime]`
  - [x] Configure server_default and onupdate for timestamps
  - [x] Test imports work: `from backend.models.base import Base, TimestampMixin`

- [x] **Task 2:** Create Pydantic schemas for JSONB fields
  - [x] Create `backend/models/schemas.py`
  - [x] Define `PerformanceMetrics` schema (6 fields with validation)
  - [x] Define `MatchScores` schema (4 score fields)
  - [x] Define `ReactFlowGraph` schema (nodes, edges arrays)
  - [x] Add Field validators (ranges: 0-100%, 1-5 stars, etc.)
  - [x] Test schemas: `PerformanceMetrics(utilization=85, billing_rate=200, ...)`
  - [x] Document JSONB schema patterns in docstrings

### Phase 2: Core Models (Tasks 3-5)

- [x] **Task 3:** Implement Employee model
  - [x] Create `backend/models/employee.py`
  - [x] Define all 11 fields with proper types (Mapped[str], Mapped[dict], etc.)
  - [x] Add JSONB fields: skills, performance_metrics
  - [x] Add ARRAY field: feedback_themes
  - [x] Define `__table_args__` with 4 indexes (service_line, current_role, role_level, skills GIN)
  - [x] Add `metrics` property for type-safe JSONB access
  - [x] Add relationships placeholder: `matches: Mapped[List["Match"]]`
  - [x] Test model instantiation with mock data

- [x] **Task 4:** Implement JobPosting model
  - [x] Create `backend/models/job_posting.py`
  - [x] Define all 13 fields with proper types
  - [x] Add JSONB fields: required_skills, preferred_skills
  - [x] Add TEXT field: description
  - [x] Define `__table_args__` with 4 indexes (service_line, created_at BRIN, external_id unique, required_skills GIN)
  - [x] Add unique constraint on external_id
  - [x] Add relationships placeholder: `matches: Mapped[List["Match"]]`
  - [x] Test model instantiation with mock data

- [x] **Task 5:** Implement Match model
  - [x] Create `backend/models/match.py`
  - [x] Define all 14 fields with proper types
  - [x] Add UUID primary key with server_default=uuid4
  - [x] Add 3 foreign keys: employee_id, job_posting_id, user_id (nullable)
  - [x] Add JSONB fields: skill_gaps, matched_skills
  - [x] Define `__table_args__` with 4 indexes (employee_id, job_posting_id, user_id+score composite, match_mode)
  - [x] Add relationships: `employee`, `job_posting`, `user_profile`
  - [x] Add `scores` property for type-safe score access
  - [x] Test model instantiation with foreign keys

### Phase 3: Supporting Models (Tasks 6-8)

- [x] **Task 6:** Implement SkillEmbedding model
  - [x] Create `backend/models/skill_embedding.py`
  - [x] Define all 8 fields with proper types
  - [x] Add UUID primary key with server_default=uuid4
  - [x] Add VECTOR(3072) field for embeddings (pgvector type)
  - [x] Define `__table_args__` with 3 indexes (normalized_text, embedding HNSW, source composite)
  - [x] Configure HNSW index with vector_cosine_ops
  - [x] Add helper method: `similarity_to(other_embedding)` using cosine distance
  - [x] Test model instantiation with mock 3072-dim vector

- [x] **Task 7:** Implement UserProfile model
  - [x] Create `backend/models/user_profile.py`
  - [x] Define all 13 fields with proper types
  - [x] Add UUID primary key with server_default=uuid4
  - [x] Add JSONB fields: skills, skill_assessment_scores
  - [x] Add unique constraint on email
  - [x] Define `__table_args__` with 3 indexes (email unique, target_service_line, skills GIN)
  - [x] Add relationships: `matches: Mapped[List["Match"]]`, `career_path: Mapped["CareerPath"]`
  - [x] Add password validation helper: `verify_password(plain_password)`
  - [x] Test model instantiation with bcrypt password

- [x] **Task 8:** Implement CareerPath model
  - [x] Create `backend/models/career_path.py`
  - [x] Define all 6 fields with proper types
  - [x] Add UUID primary key with server_default=uuid4
  - [x] Add foreign key: user_id (unique)
  - [x] Add JSONB field: graph_data (React Flow nodes/edges)
  - [x] Add JSONB field: progression_status
  - [x] Define `__table_args__` with 1 index (user_id unique)
  - [x] Add relationship: `user_profile: Mapped["UserProfile"]`
  - [x] Add helper method: `update_progress(completed_step)` to update progression_status
  - [x] Test model instantiation with mock React Flow graph

### Phase 4: Relationships (Tasks 9-10)

- [x] **Task 9:** Configure bidirectional relationships
  - [x] Add `back_populates` to all relationships in all models
  - [x] Employee ↔ Match: `matches` / `employee`
  - [x] JobPosting ↔ Match: `matches` / `job_posting`
  - [x] UserProfile ↔ Match: `matches` / `user_profile`
  - [x] UserProfile ↔ CareerPath: `career_path` / `user_profile`
  - [x] Test relationship traversal: `employee.matches[0].job_posting.title`
  - [x] Verify cascade deletes work (delete employee → matches deleted)

- [x] **Task 10:** Update __init__.py with all exports
  - [x] Import all models in `backend/models/__init__.py`
  - [x] Export Base, TimestampMixin
  - [x] Export all 6 models: Employee, JobPosting, Match, SkillEmbedding, UserProfile, CareerPath
  - [x] Export Pydantic schemas: PerformanceMetrics, MatchScores, ReactFlowGraph
  - [x] Test imports: `from backend.models import Employee, Match, Base`

### Phase 5: Migrations (Tasks 11-13)

- [x] **Task 11:** Create migration 002 - Add indexes
  - [x] Create `alembic/versions/002_add_indexes.py`
  - [x] Add upgrade() function with all create_index() calls (17 total indexes)
  - [x] Add downgrade() function with all drop_index() calls
  - [x] Test migration: `alembic upgrade head`
  - [x] Verify indexes exist: `\d+ employees` in psql
  - [x] Test rollback: `alembic downgrade -1`

- [x] **Task 12:** Create migration 003 - Add foreign keys
  - [x] Create `alembic/versions/003_add_relationships.py`
  - [x] Add upgrade() function with all create_foreign_key() calls (4 total FKs)
  - [x] Configure ondelete='CASCADE' for all FKs
  - [x] Add downgrade() function with all drop_constraint() calls
  - [x] Test migration: `alembic upgrade head`
  - [x] Verify FKs exist: `\d+ matches` in psql
  - [x] Test cascade delete: delete employee → matches deleted

- [x] **Task 13:** Validate migration history
  - [x] Run `alembic history` - verify 3 migrations (001, 002, 003)
  - [x] Run `alembic current` - verify at head (003)
  - [x] Test full downgrade: `alembic downgrade base`
  - [x] Test full upgrade: `alembic upgrade head`
  - [x] Verify all tables, indexes, and FKs exist after upgrade
  - [x] Document migration commands in `backend/README.md`

### Phase 6: Testing (Task 14)

- [x] **Task 14:** Create model validation tests
  - [x] Create `tests/models/` directory
  - [x] Create `tests/models/conftest.py` with db_session fixture
  - [x] Create `tests/models/test_employee.py`
    - [x] Test CRUD operations (create, read, update, delete)
    - [x] Test JSONB field access via `metrics` property
    - [x] Test GIN index query: filter by skills array
  - [x] Create `tests/models/test_match.py`
    - [x] Test relationships: match.employee.service_line
    - [x] Test composite index query: top 10 matches per user
    - [x] Test cascade delete: delete employee → matches deleted
  - [x] Create `tests/models/test_skill_embedding.py`
    - [x] Test HNSW index query: similarity_to() method
    - [x] Test normalized_text exact match (cache layer)
  - [x] Run all tests: `pytest tests/models/ -v`
  - [x] Verify 100% pass rate

---

## Acceptance Criteria

All tasks must be complete AND:
- [ ] All 6 models defined: `from backend.models import Employee, JobPosting, Match, SkillEmbedding, UserProfile, CareerPath`
- [ ] All models have proper type hints: `Mapped[Type]`
- [ ] All relationships bidirectional: `employee.matches[0].job_posting` works
- [ ] All indexes created: `\di` in psql shows 17+ indexes
- [ ] All foreign keys enforced: cascade deletes work
- [ ] Alembic migrations run: `alembic upgrade head` succeeds
- [ ] JSONB type safety: `employee.metrics.utilization` returns float (not dict['utilization'])
- [ ] All pytest tests pass: `pytest tests/models/ -v` shows 100% pass
- [ ] Can insert mock data: `db.add(Employee(...))` works without errors

---

## Dependencies

**This block depends on:**
- ✅ STEP-1-SETUP complete (database schema exists, alembic initialized)

**This block enables:**
- BLOCK-D: Vector Embeddings (needs SkillEmbedding model)
- BLOCK-E: Matching Engine (needs Employee, JobPosting, Match models)
- BLOCK-F: Success Patterns (needs Employee model with indexes)
- BLOCK-G: Skill Extraction (needs UserProfile, SkillEmbedding models)

**Critical files:**
- `backend/models/base.py` - Base classes
- `backend/models/schemas.py` - Pydantic JSONB schemas
- `backend/models/employee.py` - Employee ORM model
- `backend/models/job_posting.py` - JobPosting ORM model
- `backend/models/match.py` - Match ORM model
- `backend/models/skill_embedding.py` - SkillEmbedding ORM model
- `backend/models/user_profile.py` - UserProfile ORM model
- `backend/models/career_path.py` - CareerPath ORM model
- `backend/models/__init__.py` - Exports all models
- `alembic/versions/002_add_indexes.py` - Index migration
- `alembic/versions/003_add_relationships.py` - Foreign key migration
- `tests/models/test_*.py` - Model validation tests

---

## Index Performance Targets

**Query patterns to optimize:**
- Success patterns by service line: `SELECT ... FROM employees WHERE service_line = 'Consulting'` (<50ms for 300 rows)
- Top matches per user: `SELECT ... FROM matches WHERE user_id = '...' ORDER BY overall_score DESC LIMIT 10` (<10ms)
- Semantic similarity search: `SELECT ... FROM skill_embeddings ORDER BY embedding <=> '[...]' LIMIT 20` (<100ms for 10K embeddings)
- Job posting by date: `SELECT ... FROM job_postings WHERE created_at > '...' ORDER BY created_at DESC` (<20ms)

**Index verification commands:**
```sql
-- Check index usage
EXPLAIN ANALYZE SELECT * FROM employees WHERE service_line = 'Consulting';
-- Should show "Index Scan using idx_employee_service_line"

EXPLAIN ANALYZE SELECT * FROM matches WHERE user_id = '...' ORDER BY overall_score DESC LIMIT 10;
-- Should show "Index Scan using idx_match_user_score"

EXPLAIN ANALYZE SELECT * FROM skill_embeddings ORDER BY embedding <=> '[...]' LIMIT 20;
-- Should show "Index Scan using idx_skill_embedding_vector (HNSW)"
```

---

## Troubleshooting

### Issue: Alembic can't auto-detect models

**Symptom:** `alembic revision --autogenerate` doesn't detect model changes

**Solution:**
- Ensure `alembic/env.py` imports: `from backend.models import Base`
- Set `target_metadata = Base.metadata`
- Ensure all models are imported (not just Base)

### Issue: HNSW index creation fails

**Symptom:** `CREATE INDEX ... USING hnsw` fails with "extension not found"

**Solution:**
- Ensure pgvector installed: `CREATE EXTENSION IF NOT EXISTS vector;`
- Check pgvector version: `SELECT * FROM pg_extension WHERE extname = 'vector';`
- Minimum version: 0.5.0 (for HNSW support)

### Issue: Relationship AttributeError

**Symptom:** `AttributeError: 'Employee' object has no attribute 'matches'`

**Solution:**
- Ensure both sides of relationship defined with back_populates
- Employee: `matches: Mapped[List["Match"]] = relationship(..., back_populates="employee")`
- Match: `employee: Mapped["Employee"] = relationship(..., back_populates="matches")`
- Ensure lazy loading configured: `lazy="select"` (default)

### Issue: JSONB type errors

**Symptom:** `TypeError: 'dict' object is not callable` when accessing employee.metrics.utilization

**Solution:**
- Ensure property decorator used: `@property def metrics(self) -> PerformanceMetrics:`
- Return Pydantic model: `return PerformanceMetrics(**self.performance_metrics)`
- Access via property: `employee.metrics.utilization` (not `employee.performance_metrics['utilization']`)

---

**Last Updated:** 2026-01-19
**Status:** Completed
