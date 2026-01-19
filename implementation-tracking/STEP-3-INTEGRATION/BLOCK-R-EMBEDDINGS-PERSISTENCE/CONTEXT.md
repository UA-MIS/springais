# BLOCK R: Embeddings Persistence Integration - CONTEXT

**Block ID:** BLOCK-R-EMBEDDINGS-PERSISTENCE
**Phase:** STEP-3-INTEGRATION
**Category:** #integration #backend #database #ai
**Estimated Time:** 1-2 days
**Dependencies:** STEP-2: Block C (Database Models), Block D (Vector Embeddings)

---

## AI Quick Start Prompt

```
You are working on BLOCK-R: Embeddings Persistence Integration for SpringAIS.

Goal: Wire Block D's EmbeddingService to Block C's SkillEmbedding database model. Persist all skill embeddings to pgvector, implement similarity search, and batch-process employee and job posting skills.

Key constraints:
- Block D provides: EmbeddingService with embed_skill() and embed_skills_batch()
- Block C provides: SkillEmbedding model with pgvector VECTOR(1536) column
- Must implement: Database persistence, pgvector similarity search, batch scripts
- Performance: Similarity search <100ms using HNSW index
- Cost: Total OpenAI cost <$1 for all embeddings

Read TASKS.md for step-by-step integration tasks.
Read VERIFICATION.md for performance and quality tests.
```

---

## Purpose

Connect the embedding generation service (Block D) to the database persistence layer (Block C), enabling semantic similarity search across all system skills (employees, job postings).

**Why this matters:**
- Block D can generate embeddings, but they're not persisted yet
- Block C has the SkillEmbedding table ready, but nothing writes to it
- Blocks N and O need embeddings in the database for similarity search and matching
- Without this integration, semantic matching cannot work

**Success outcome:**
- All employee skills embedded and stored in database
- All job posting skills embedded and stored in database
- pgvector HNSW index enables <100ms similarity search
- find_similar_skills() API function works end-to-end
- Total cost <$1 for initial embedding generation

---

## What This Block Integrates

### From Block D: Vector Embeddings Service

**What's already built:**
- `EmbeddingService` class with embedding generation
- OpenAI text-embedding-3-large integration
- PCA dimensionality reduction (3072 → 1536)
- Two-layer Redis caching (exact + semantic)
- Batch processing (100 skills per API call)

**What this block does:**
- Call `embedding_service.embed_skill()` for each unique skill
- Call `embedding_service.embed_skills_batch()` for bulk processing
- Use PCA-reduced embeddings (1536 dims) for database storage
- Track embedding generation progress and costs

### From Block C: Database Models

**What's already built:**
- `SkillEmbedding` SQLAlchemy model
- pgvector VECTOR(1536) column for embeddings
- Database schema with indexes:
  - `idx_skill_embedding_normalized` (normalized_text)
  - `idx_skill_embedding_vector` (HNSW index for similarity)
  - `idx_skill_embedding_source` (source_type, source_id)

**What this block does:**
- Insert SkillEmbedding records for each skill
- Store 1536-dim PCA-reduced embeddings
- Set source_type ('employee', 'job_posting') and source_id
- Handle upserts for duplicate normalized_text

---

## Integration Architecture

### Database Persistence Flow

```
EmbeddingService (Block D)
    ↓
embed_skill("Python Programming")
    ↓
Returns: [0.023, -0.145, ..., 0.089]  # 1536 dims (PCA-reduced)
    ↓
SkillEmbedding record (Block C)
    ↓
INSERT INTO skill_embeddings (
    skill_text = "Python Programming",
    normalized_text = "python programming",
    embedding = [0.023, -0.145, ..., 0.089],  # VECTOR(1536)
    source_type = "employee",
    source_id = "emp_12345",
    embedding_model = "text-embedding-3-large-pca",
    pca_version = "v1"
)
    ↓
Stored in PostgreSQL + pgvector
```

### Similarity Search Flow

```
User Query: "Python Programming"
    ↓
embed_skill("Python Programming")
    ↓
Query embedding: [0.023, -0.145, ..., 0.089]
    ↓
SQL: SELECT skill_text, embedding <=> $1::vector AS distance
     FROM skill_embeddings
     ORDER BY embedding <=> $1::vector
     LIMIT 10
    ↓
pgvector HNSW index (fast search)
    ↓
Results:
1. "Python Development" (distance: 0.06, similarity: 0.94)
2. "Python" (distance: 0.12, similarity: 0.88)
3. "Django" (distance: 0.18, similarity: 0.82)
...
```

---

## Implementation Tasks Overview

### Task 1: Implement save_to_database() function
- Create `save_skill_embedding()` helper in EmbeddingService
- Accept skill_text, embedding, source_type, source_id
- Create SkillEmbedding record with all fields
- Handle upserts (duplicate normalized_text)
- Commit to database

### Task 2: Implement find_similar_skills() function
- Accept query text, top_n, optional filters
- Embed query using EmbeddingService
- Execute pgvector similarity search with <=> operator
- Convert distance to similarity (1 - distance)
- Return list of (skill_text, similarity_score) tuples
- Verify HNSW index is used (check query plan)

### Task 3: Create batch embedding script for employees
- Script: `scripts/embed_employee_skills.py`
- Load all employees from database (or synthetic data)
- Extract unique skills from all employees
- Batch embed using `embed_skills_batch()`
- Save each embedding to database with source_type='employee'
- Show progress bar and cost tracking

### Task 4: Create batch embedding script for job postings
- Script: `scripts/embed_job_skills.py`
- Load all job postings from database
- Extract unique skills from required_skills + preferred_skills
- Batch embed using `embed_skills_batch()`
- Save each embedding to database with source_type='job_posting'
- Show progress bar and cost tracking

---

## Key Functions to Implement

### save_skill_embedding()

**File:** `backend/app/services/embedding_service.py` (update existing)

```python
def save_skill_embedding(
    self,
    skill_text: str,
    embedding: List[float],
    source_type: str,
    source_id: str,
    token_count: int
) -> SkillEmbedding:
    """
    Save skill embedding to database.

    Args:
        skill_text: Original skill text
        embedding: PCA-reduced 1536-dim embedding
        source_type: "employee" or "job_posting"
        source_id: ID of source record
        token_count: Number of tokens used for embedding

    Returns:
        SkillEmbedding record
    """
    from ..models.skill_embedding import SkillEmbedding
    from ..utils.text import normalize_skill_text

    normalized = normalize_skill_text(skill_text)

    # Check if already exists
    existing = self.db.query(SkillEmbedding).filter(
        SkillEmbedding.normalized_text == normalized,
        SkillEmbedding.source_type == source_type
    ).first()

    if existing:
        # Update existing
        existing.embedding = embedding
        existing.token_count = token_count
        self.db.commit()
        return existing

    # Create new
    skill_emb = SkillEmbedding(
        skill_text=skill_text,
        normalized_text=normalized,
        embedding=embedding,
        source_type=source_type,
        source_id=source_id,
        embedding_model="text-embedding-3-large-pca",
        pca_version="v1",
        token_count=token_count
    )

    self.db.add(skill_emb)
    self.db.commit()
    self.db.refresh(skill_emb)

    return skill_emb
```

### find_similar_skills()

**File:** `backend/app/services/embedding_service.py` (update existing)

```python
async def find_similar_skills(
    self,
    query: str,
    top_n: int = 10,
    source_type: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Find semantically similar skills using pgvector.

    Args:
        query: Skill text to find similar skills for
        top_n: Number of results to return
        source_type: Optional filter ("employee", "job_posting")

    Returns:
        List of dicts with skill_text, similarity, source_type
    """
    from sqlalchemy import text
    from ..models.skill_embedding import SkillEmbedding

    # Get query embedding
    query_embedding = await self.embed_skill(query)

    # Build SQL query
    sql = """
        SELECT
            skill_text,
            source_type,
            source_id,
            embedding <=> :embedding::vector AS distance
        FROM skill_embeddings
    """

    if source_type:
        sql += " WHERE source_type = :source_type"

    sql += """
        ORDER BY embedding <=> :embedding::vector
        LIMIT :limit
    """

    # Execute query
    params = {
        "embedding": query_embedding,
        "limit": top_n
    }
    if source_type:
        params["source_type"] = source_type

    results = self.db.execute(text(sql), params).fetchall()

    # Convert to response format
    return [
        {
            "skill_text": row.skill_text,
            "similarity": 1 - row.distance,  # Convert distance to similarity
            "source_type": row.source_type,
            "source_id": row.source_id
        }
        for row in results
    ]
```

---

## Batch Processing Scripts

### embed_employee_skills.py

**Purpose:** Embed all skills from employee database

**Usage:**
```bash
cd backend
python scripts/embed_employee_skills.py
```

**Output:**
```
Loading employees from database...
Found 900 employees with 6,300 total skills (3,000 unique)

Embedding skills: [████████████████████] 100% (3,000/3,000)

Results:
  - Total skills embedded: 3,000
  - Cache hits: 0 (0%)
  - OpenAI API calls: 30 batches
  - Tokens used: 9,000
  - Cost: $0.0012
  - Duration: 18.5 seconds

✓ All employee skills embedded and saved to database!
```

### embed_job_skills.py

**Purpose:** Embed all skills from job posting database

**Usage:**
```bash
cd backend
python scripts/embed_job_skills.py
```

**Output:**
```
Loading job postings from database...
Found 300 jobs with 2,400 total skills (1,200 unique)

Embedding skills: [████████████████████] 100% (1,200/1,200)

Results:
  - Total skills embedded: 1,200
  - Cache hits: 600 (50%)  # Many overlap with employee skills
  - OpenAI API calls: 6 batches
  - Tokens used: 1,800
  - Cost: $0.0002
  - Duration: 4.2 seconds

✓ All job posting skills embedded and saved to database!
```

---

## Database Schema Verification

**Before running scripts, verify:**

```sql
-- Check SkillEmbedding table exists
\d+ skill_embeddings

-- Expected schema:
-- id (uuid)
-- skill_text (varchar 255)
-- normalized_text (varchar 255)
-- embedding (vector 1536)  ← PCA-reduced dimensions
-- source_type (varchar 50)
-- source_id (varchar 255)
-- embedding_model (varchar 100, default 'text-embedding-3-large-pca')
-- pca_version (varchar 50)
-- token_count (integer)
-- created_at (timestamp)

-- Check indexes exist
\d skill_embeddings

-- Expected indexes:
-- idx_skill_embedding_normalized (normalized_text)
-- idx_skill_embedding_vector (HNSW index on embedding)
-- idx_skill_embedding_source (source_type, source_id)
```

---

## Performance Targets

**Embedding generation:**
- Single skill (cache miss): <200ms
- Single skill (cache hit): <5ms
- Batch 3,000 employee skills: <30 seconds
- Batch 1,200 job skills: <10 seconds (50% cache hit)

**Similarity search:**
- Top 10 similar (3,000 embeddings): <20ms
- Top 10 similar (10,000 embeddings): <50ms
- Top 10 similar (100,000 embeddings): <100ms

**Database:**
- HNSW index must be used (verify with EXPLAIN)
- No sequential scans on similarity search

---

## Cost Tracking

**Expected costs:**
```
Employee skills: 3,000 unique × 3 tokens = 9,000 tokens
                 9,000 / 1M × $0.13 = $0.0012

Job skills:      1,200 unique × 3 tokens = 3,600 tokens
                 3,600 / 1M × $0.13 = $0.0005

Total:           $0.0017 (~$0.002)
```

**Note:** Actual cost may be lower due to Redis caching

---

## What Blocks N and O Will Use

### Block N (Skills Integration):
```python
# Find similar skills for skill gap analysis
similar = await embedding_service.find_similar_skills(
    query="Python Programming",
    top_n=10,
    source_type="job_posting"
)

# Calculate skill gap between user skills and job requirements
for job_skill in job.required_skills:
    user_matches = await embedding_service.find_similar_skills(
        query=job_skill,
        top_n=5,
        source_type="employee"
    )
    # Check if any user skill has similarity > 0.8
```

### Block O (Matching Integration):
```python
# Find employees with similar skills to job requirements
for job_skill in job.required_skills:
    similar_employee_skills = await embedding_service.find_similar_skills(
        query=job_skill,
        top_n=50,
        source_type="employee"
    )
    # Match employees based on skill similarity
```

---

## Success Criteria

**This block is complete when:**

1. ✅ `save_skill_embedding()` function works
2. ✅ `find_similar_skills()` function works
3. ✅ All employee skills embedded and in database
4. ✅ All job posting skills embedded and in database
5. ✅ pgvector similarity search returns results <100ms
6. ✅ HNSW index used (verify with EXPLAIN)
7. ✅ Total OpenAI cost <$1
8. ✅ Cache hit rate >90% after initial embedding
9. ✅ Batch scripts complete successfully
10. ✅ All tests pass

**Integration Checklist:**
- [ ] Block D EmbeddingService connected to Block C SkillEmbedding model
- [ ] Embeddings stored with correct dimensions (1536 from PCA)
- [ ] pgvector HNSW index used for similarity search
- [ ] Employee skills embedded from database
- [ ] Job skills embedded from database
- [ ] `find_similar_skills()` returns sensible results
- [ ] Performance targets met (<100ms search)
- [ ] Cost targets met (<$1 total)

---

## References

**Related Step 2 Blocks:**
- `BLOCK-C-DATABASE-MODELS/CONTEXT.md` - SkillEmbedding model
- `BLOCK-D-VECTOR-EMBEDDINGS/CONTEXT.md` - EmbeddingService implementation

**Related Step 3 Blocks:**
- `BLOCK-M-CORE-INTEGRATION/CONTEXT.md` - Database connection pattern
- `BLOCK-N-SKILLS-INTEGRATION/CONTEXT.md` - Will use find_similar_skills()
- `BLOCK-O-MATCHING-INTEGRATION/CONTEXT.md` - Will use embeddings for matching

**Technology Docs:**
- pgvector: https://github.com/pgvector/pgvector
- SQLAlchemy ORM: https://docs.sqlalchemy.org/en/20/orm/
- Python asyncio: https://docs.python.org/3/library/asyncio.html

---

**Last Updated:** 2026-01-13
**Status:** Ready for development
**Blocking:** Blocks N, O (need embeddings in database for similarity search)
**Blocked by:** Block C (Database Models), Block D (Vector Embeddings)
