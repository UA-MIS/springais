# BLOCK R: Embeddings Persistence Integration - TASKS

**Block:** BLOCK-R-EMBEDDINGS-PERSISTENCE
**Total Tasks:** 4
**Completed:** 0/4 (0%)

---

## ⚠️ IMPORTANT: Update Instructions

**When you complete a task:**
1. Check the box: `- [x] Task name`
2. Update the "Completed" count at the top
3. Update `PROJECT-STATUS.md`:
   - Find "Block R" row in Step 3 table
   - Update Progress column (e.g., "2/4 tasks")

**When ALL tasks complete:**
1. ✅ Run all verification steps in `VERIFICATION.md`
2. ✅ Change status in `PROJECT-STATUS.md` from ⏸️ to ✅
3. ✅ Update Progress to "4/4 tasks (100%)"
4. ✅ Update "Overall Progress" section
5. ✅ After verification passes, commit changes (do NOT commit until verification is complete)

See `CONTEXT.md` section "Success Criteria" for full details.

---

## Progress Tracker

### Phase 1: Database Integration (Tasks 1-2)

- [ ] **Task 1:** Implement save_skill_embedding() for SkillEmbedding records
  - [ ] Add `save_skill_embedding()` method to EmbeddingService class
  - [ ] Accept parameters: skill_text, embedding, source_type, source_id, token_count
  - [ ] Import SkillEmbedding model from Block C
  - [ ] Normalize skill text using `normalize_skill_text()` helper
  - [ ] Check for existing record by normalized_text + source_type
  - [ ] If exists: Update embedding and token_count, commit
  - [ ] If new: Create SkillEmbedding record with all fields:
    - [ ] skill_text (original)
    - [ ] normalized_text (lowercase, stripped)
    - [ ] embedding (convert list to pgvector VECTOR format)
    - [ ] source_type ("employee" or "job_posting")
    - [ ] source_id (employee ID or job ID)
    - [ ] embedding_model = "text-embedding-3-large-pca"
    - [ ] pca_version = "v1"
    - [ ] token_count (from OpenAI response)
  - [ ] Use `db.add()` and `db.commit()`
  - [ ] Call `db.refresh()` to get generated ID
  - [ ] Return SkillEmbedding record
  - [ ] Handle database errors (unique constraint, connection errors)
  - [ ] Test: Insert sample embedding, verify in database
  - [ ] Test: Insert duplicate normalized_text, verify upsert works

- [ ] **Task 2:** Implement find_similar_skills() using pgvector
  - [ ] Add `find_similar_skills()` async method to EmbeddingService
  - [ ] Accept parameters: query (str), top_n (int, default=10), source_type (optional filter)
  - [ ] Embed query text: `query_embedding = await self.embed_skill(query)`
  - [ ] Build pgvector similarity search SQL query:
    ```sql
    SELECT skill_text, source_type, source_id,
           embedding <=> :embedding::vector AS distance
    FROM skill_embeddings
    WHERE source_type = :source_type  -- if filter provided
    ORDER BY embedding <=> :embedding::vector
    LIMIT :top_n
    ```
  - [ ] Use SQLAlchemy `text()` for raw SQL execution
  - [ ] Pass query_embedding as parameter (convert to string format for pgvector)
  - [ ] Execute query: `results = self.db.execute(text(sql), params).fetchall()`
  - [ ] Convert distance to similarity: `similarity = 1 - distance`
  - [ ] Return list of dicts: `[{"skill_text": ..., "similarity": ..., "source_type": ...}]`
  - [ ] Verify HNSW index used: Run `EXPLAIN ANALYZE` and check for "Index Scan using idx_skill_embedding_vector"
  - [ ] Test: Query "Python", verify returns ["Python Programming", "Python Development", etc.]
  - [ ] Test: Query "Cloud Architecture", verify returns ["AWS", "Azure", "GCP", etc.]
  - [ ] Test: Similarity scores are descending (highest first)
  - [ ] Test: Performance <100ms for 10K embeddings

### Phase 2: Batch Processing Scripts (Tasks 3-4)

- [ ] **Task 3:** Create script to embed all employee skills
  - [ ] Create `backend/scripts/embed_employee_skills.py`
  - [ ] Import: EmbeddingService, database session, Employee model
  - [ ] Load all employees from database: `employees = db.query(Employee).all()`
  - [ ] Extract all unique skills:
    ```python
    all_skills = set()
    for emp in employees:
        all_skills.update(emp.skills)  # Assuming skills is JSON array
    unique_skills = list(all_skills)
    ```
  - [ ] Initialize EmbeddingService with OpenAI, Redis, DB clients
  - [ ] Batch process skills:
    ```python
    from tqdm import tqdm
    for batch in tqdm(chunk(unique_skills, 100), desc="Embedding skills"):
        embeddings = await embedding_service.embed_skills_batch(batch)
        for skill_text, embedding in embeddings.items():
            embedding_service.save_skill_embedding(
                skill_text=skill_text,
                embedding=embedding,
                source_type="employee",
                source_id="",  # Or link to specific employee if needed
                token_count=3  # Approximate
            )
    ```
  - [ ] Add progress bar using tqdm: `tqdm(batches, desc="Embedding skills")`
  - [ ] Track metrics:
    - [ ] Total skills embedded
    - [ ] Cache hits vs API calls
    - [ ] Total tokens used
    - [ ] Total cost ($tokens / 1M × $0.13)
    - [ ] Duration (start to end)
  - [ ] Print summary report:
    ```
    Results:
      - Total skills embedded: 3,000
      - Cache hits: 0 (0%)
      - OpenAI API calls: 30 batches
      - Tokens used: 9,000
      - Cost: $0.0012
      - Duration: 18.5 seconds
    ```
  - [ ] Add error handling: OpenAI rate limits, database errors, network issues
  - [ ] Add retry logic for transient failures
  - [ ] Test with Block A synthetic data (900 employees)
  - [ ] Verify: `SELECT COUNT(*) FROM skill_embeddings WHERE source_type = 'employee'` returns expected count

- [ ] **Task 4:** Create script to embed all job posting skills
  - [ ] Create `backend/scripts/embed_job_skills.py`
  - [ ] Import: EmbeddingService, database session, Job model (or job posting model)
  - [ ] Load all job postings from database: `jobs = db.query(Job).all()`
  - [ ] Extract all unique skills from required_skills + preferred_skills:
    ```python
    all_skills = set()
    for job in jobs:
        all_skills.update(job.required_skills or [])
        all_skills.update(job.preferred_skills or [])
    unique_skills = list(all_skills)
    ```
  - [ ] Initialize EmbeddingService
  - [ ] Batch process skills (same as Task 3 but source_type='job_posting')
  - [ ] Track same metrics (total, cache hits, cost, duration)
  - [ ] Print summary report
  - [ ] Note: Cache hit rate should be ~50% (many skills overlap with employees)
  - [ ] Add error handling and retry logic
  - [ ] Test with Block B job posting data (300 jobs)
  - [ ] Verify: `SELECT COUNT(*) FROM skill_embeddings WHERE source_type = 'job_posting'` returns expected count
  - [ ] Verify total cost: Employee + Job embeddings < $1

---

## Acceptance Criteria

All tasks must be complete AND:
- [ ] `save_skill_embedding()` function implemented and tested
- [ ] `find_similar_skills()` function implemented and tested
- [ ] All employee skills embedded: `SELECT COUNT(*) FROM skill_embeddings WHERE source_type = 'employee'` returns ~3,000
- [ ] All job posting skills embedded: `SELECT COUNT(*) FROM skill_embeddings WHERE source_type = 'job_posting'` returns ~1,000
- [ ] Database stores 1536-dim vectors: `SELECT vector_dims(embedding) FROM skill_embeddings LIMIT 1` returns 1536
- [ ] Similarity search returns results in <100ms
- [ ] HNSW index used: `EXPLAIN ANALYZE` shows "Index Scan using idx_skill_embedding_vector"
- [ ] Total OpenAI cost <$1 (check OpenAI dashboard)
- [ ] Cache hit rate >90% after initial embedding
- [ ] Batch scripts complete successfully with progress bars
- [ ] Similarity search returns sensible results (manually validated)
- [ ] All database constraints satisfied (no errors on insert)

---

## Dependencies

**This block depends on:**
- ✅ Block C (Database Models) - SkillEmbedding model must exist
- ✅ Block D (Vector Embeddings) - EmbeddingService must be implemented

**This block enables:**
- Block N (Skills Integration) - Uses `find_similar_skills()` for gap analysis
- Block O (Matching Integration) - Uses embeddings for semantic matching

**Critical files:**
- `backend/app/services/embedding_service.py` - Add save/find methods (from Block D)
- `backend/app/models/skill_embedding.py` - SkillEmbedding model (from Block C)
- `backend/scripts/embed_employee_skills.py` - New script
- `backend/scripts/embed_job_skills.py` - New script

---

## Verification Checklist

Before marking this block complete, verify:

### Database Verification
```sql
-- Check total embeddings
SELECT COUNT(*) FROM skill_embeddings;
-- Expected: ~4,000 (3,000 employee + 1,000 job)

-- Check employee embeddings
SELECT COUNT(*) FROM skill_embeddings WHERE source_type = 'employee';
-- Expected: ~3,000

-- Check job embeddings
SELECT COUNT(*) FROM skill_embeddings WHERE source_type = 'job_posting';
-- Expected: ~1,000

-- Check embedding dimensions
SELECT vector_dims(embedding) FROM skill_embeddings LIMIT 1;
-- Expected: 1536

-- Check HNSW index exists
\d skill_embeddings
-- Should show: idx_skill_embedding_vector USING hnsw

-- Test similarity search performance
EXPLAIN ANALYZE
SELECT skill_text, embedding <=> '[0.1, 0.2, ...]'::vector AS distance
FROM skill_embeddings
ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector
LIMIT 10;
-- Should show: Index Scan using idx_skill_embedding_vector
-- Execution time: <100ms
```

### Functional Verification
```python
# Test find_similar_skills()
results = await embedding_service.find_similar_skills("Python Programming", top_n=10)
assert len(results) == 10
assert results[0]['similarity'] > 0.9  # Top result very similar
assert results[0]['similarity'] > results[-1]['similarity']  # Descending order

# Test with different source types
employee_skills = await embedding_service.find_similar_skills(
    "Python", source_type="employee"
)
job_skills = await embedding_service.find_similar_skills(
    "Python", source_type="job_posting"
)
assert len(employee_skills) > 0
assert len(job_skills) > 0
```

### Cost Verification
```bash
# Check OpenAI usage dashboard
# Go to: https://platform.openai.com/usage
# Filter by date range (today)
# Verify total cost <$1
```

---

## Troubleshooting

### Issue: "Database error: column 'embedding' is type vector(1536) but expression is type vector(3072)"

**Symptom:** Error when inserting embeddings

**Solution:**
- Verify PCA is applied in Block D: Check `EmbeddingService.embed_skill()` applies PCA reduction
- Check embedding length: `assert len(embedding) == 1536`
- Verify PCA model loaded: Check `self.pca` exists in EmbeddingService
- If embeddings are 3072 dims, apply PCA before saving

### Issue: "HNSW index not used (sequential scan instead)"

**Symptom:** `EXPLAIN` shows "Seq Scan" instead of "Index Scan"

**Solution:**
- Verify index exists: `\d skill_embeddings` should show idx_skill_embedding_vector
- Rebuild index: `REINDEX INDEX idx_skill_embedding_vector;`
- Check index type: Should be USING hnsw, not btree
- Increase work_mem: `SET work_mem = '256MB';`
- Check database stats: `ANALYZE skill_embeddings;`

### Issue: "Batch script times out or fails"

**Symptom:** Script crashes after X embeddings

**Solution:**
- Check OpenAI API key valid and has credits
- Check rate limits (5,000 req/min on Tier 2)
- Add retry logic with exponential backoff
- Reduce batch size from 100 to 50
- Add sleep between batches: `await asyncio.sleep(0.5)`
- Check database connection (may timeout on long operations)
- Run in smaller chunks (1,000 skills at a time)

### Issue: "Similarity search returns unexpected results"

**Symptom:** Query "Python" returns "Tax Law" as similar

**Solution:**
- Verify embeddings are correct (check sample embeddings)
- Verify PCA applied correctly (check variance preserved >95%)
- Check cosine distance vs cosine similarity (may be inverted)
- Verify normalization applied consistently
- Check embedding model version (should be text-embedding-3-large)
- Manually test with OpenAI API directly to compare

---

**Last Updated:** 2026-01-13
**Status:** Not Started
