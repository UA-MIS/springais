# BLOCK D: Vector Embeddings - TASKS

**Block:** BLOCK-D-VECTOR-EMBEDDINGS
**Total Tasks:** 13
**Completed:** 0/13 (0%)

---

## Progress Tracker

### Phase 1: Service Setup (Tasks 1-2)

- [ ] **Task 1:** Create EmbeddingService class structure
  - [ ] Create `backend/services/` directory if not exists
  - [ ] Create `backend/services/__init__.py`
  - [ ] Create `backend/services/embedding_service.py`
  - [ ] Define `EmbeddingService` class with __init__(openai_client, redis_client, db_session)
  - [ ] Add async methods stubs: `embed_skill()`, `embed_skills_batch()`, `find_similar_skills()`
  - [ ] Add private helper stubs: `_get_exact_match_cache()`, `_get_semantic_cache()`, `_call_openai()`
  - [ ] Test imports: `from backend.services import EmbeddingService`

- [ ] **Task 2:** Configure OpenAI and Redis clients
  - [ ] Add OpenAI client setup in `backend/config.py`
  - [ ] Add Redis client setup (use redis-py with asyncio support)
  - [ ] Add environment variables: `OPENAI_API_KEY`, `REDIS_URL`
  - [ ] Create client factory functions: `get_openai_client()`, `get_redis_client()`
  - [ ] Test connections: OpenAI API ping, Redis ping
  - [ ] Add error handling for missing credentials

### Phase 2: Caching Implementation (Tasks 3-5)

- [ ] **Task 3:** Implement Layer 1 - Exact match cache
  - [ ] Create `normalize_skill_text()` helper function (lowercase, strip, dedupe spaces)
  - [ ] Implement `_get_exact_match_cache(skill_text)`:
    - [ ] Normalize text: `normalized = normalize_skill_text(skill_text)`
    - [ ] Check Redis: `redis.get(f"embedding:exact:{normalized}")`
    - [ ] Return cached embedding if exists
  - [ ] Implement `_save_exact_match_cache(skill_text, embedding)`:
    - [ ] Serialize embedding to JSON
    - [ ] Save to Redis with 30-day TTL
  - [ ] Test cache hit/miss scenarios

- [ ] **Task 4:** Implement Layer 2 - Semantic similarity cache
  - [ ] Implement `_get_semantic_cache(skill_text)`:
    - [ ] Get all cached embeddings from Redis (scan pattern "embedding:exact:*")
    - [ ] Calculate cosine similarity to each cached embedding
    - [ ] Return cached if similarity >0.95
  - [ ] Add similarity calculation helper: `cosine_similarity(vec1, vec2)`
  - [ ] Test semantic cache finds "Python" when querying "Python Programming"
  - [ ] Optimize: Use Redis sorted sets for faster semantic search

- [ ] **Task 5:** Implement OpenAI API integration
  - [ ] Implement `_call_openai(skill_text)`:
    - [ ] Call `openai.embeddings.create(model="text-embedding-3-large", input=skill_text)`
    - [ ] Extract embedding from response: `response.data[0].embedding`
    - [ ] Track token count from response
    - [ ] Return 3072-dim vector
  - [ ] Implement `_call_openai_batch(skills)`:
    - [ ] Batch up to 100 skills per call
    - [ ] Call OpenAI API once with array of inputs
    - [ ] Map responses back to skill texts
  - [ ] Add retry logic for API failures (exponential backoff)
  - [ ] Add rate limiting (respect 5,000 req/min limit)
  - [ ] Test with mock skills, verify 3072 dimensions

### Phase 3: Core Embedding Methods (Tasks 6-7)

- [ ] **Task 6:** Implement embed_skill() with full caching pipeline
  - [ ] Call Layer 1: `cached = await self._get_exact_match_cache(skill_text)`
  - [ ] If cache hit, return cached embedding
  - [ ] Call Layer 2: `similar = await self._get_semantic_cache(skill_text)`
  - [ ] If similarity >0.95, return similar embedding
  - [ ] Call OpenAI API: `embedding = await self._call_openai(skill_text)`
  - [ ] Save to cache: `await self._save_exact_match_cache(skill_text, embedding)`
  - [ ] Save to database: `SkillEmbedding(skill_text=..., embedding=...)`
  - [ ] Return embedding
  - [ ] Test full pipeline with cache hits and misses

- [ ] **Task 7:** Implement embed_skills_batch() for bulk processing
  - [ ] Accept list of skill texts
  - [ ] Check cache for each skill (exact + semantic)
  - [ ] Collect uncached skills
  - [ ] Batch call OpenAI for uncached skills (100 at a time)
  - [ ] Save all embeddings to cache and database
  - [ ] Return dict: {skill_text: embedding}
  - [ ] Add progress bar using tqdm
  - [ ] Test with 300 mock skills, verify <30 seconds

### Phase 4: Database Integration (Tasks 8-9)

- [ ] **Task 8:** Implement save_to_database() for SkillEmbedding records
  - [ ] Create `SkillEmbedding` record with all fields:
    - [ ] skill_text, normalized_text, embedding (convert to pgvector format)
    - [ ] source_type, source_id (if provided)
    - [ ] embedding_model = "text-embedding-3-large"
    - [ ] token_count (from OpenAI response)
  - [ ] Use `db.add()` and `db.commit()`
  - [ ] Handle duplicates: upsert if normalized_text already exists
  - [ ] Test insertion, verify pgvector VECTOR(3072) type works

- [ ] **Task 9:** Implement find_similar_skills() using pgvector
  - [ ] Accept query text and top_n parameter
  - [ ] Embed query: `query_embedding = await self.embed_skill(query)`
  - [ ] Query database using pgvector <=> operator:
    ```sql
    SELECT skill_text, embedding <=> :embedding AS distance
    FROM skill_embeddings
    ORDER BY embedding <=> :embedding
    LIMIT :top_n
    ```
  - [ ] Convert distance to similarity: `similarity = 1 - distance`
  - [ ] Return list of (skill_text, similarity) tuples
  - [ ] Test query returns sensible results
  - [ ] Verify HNSW index used (EXPLAIN ANALYZE)

### Phase 5: Batch Processing Scripts (Tasks 10-11)

- [ ] **Task 10:** Create script to embed all employee skills
  - [ ] Create `scripts/embed_employee_skills.py`
  - [ ] Load all employees from database (or synthetic data SQL dump)
  - [ ] Extract all unique skills: `set(skill for emp in employees for skill in emp.skills)`
  - [ ] Call `embedding_service.embed_skills_batch(unique_skills)`
  - [ ] Show progress bar: "Embedding 3,000 skills [████████] 100%"
  - [ ] Print stats: total skills, cache hits, API calls, cost, duration
  - [ ] Test with Block A synthetic data (900 employees)

- [ ] **Task 11:** Create script to embed all job posting skills
  - [ ] Create `scripts/embed_job_skills.py`
  - [ ] Load all job postings from database (or Block B scraped data)
  - [ ] Extract all unique skills from required_skills + preferred_skills
  - [ ] Call `embedding_service.embed_skills_batch(unique_skills)`
  - [ ] Show progress bar
  - [ ] Print stats: total skills, cache hits, API calls, cost, duration
  - [ ] Test with Block B job posting data (300 jobs)

### Phase 6: Testing & Validation (Tasks 12-13)

- [ ] **Task 12:** Create comprehensive pytest tests
  - [ ] Create `tests/services/` directory
  - [ ] Create `tests/services/conftest.py` with fixtures:
    - [ ] `mock_openai_client` (returns fake embeddings)
    - [ ] `redis_client` (use fakeredis for testing)
    - [ ] `embedding_service` (EmbeddingService with mocks)
  - [ ] Create `tests/services/test_embedding_cache.py`:
    - [ ] test_exact_match_cache_hit
    - [ ] test_exact_match_cache_miss
    - [ ] test_semantic_cache_hit (similarity >0.95)
    - [ ] test_semantic_cache_miss
  - [ ] Create `tests/services/test_embedding_api.py`:
    - [ ] test_openai_single_skill
    - [ ] test_openai_batch_skills
    - [ ] test_retry_on_api_failure
  - [ ] Create `tests/services/test_similarity_search.py`:
    - [ ] test_find_similar_skills_returns_top_n
    - [ ] test_similarity_scores_descending
    - [ ] test_hnsw_index_used (check query plan)
  - [ ] Run all tests: `pytest tests/services/ -v`

- [ ] **Task 13:** Validate embedding quality manually
  - [ ] Embed test skills: ["Python", "Java", "Tax Law", "AWS"]
  - [ ] Calculate similarity matrix (all pairs)
  - [ ] Verify expected similarities:
    - [ ] Python-Java: 0.6-0.8 (similar, both programming)
    - [ ] Python-Tax Law: <0.2 (not similar)
    - [ ] AWS-Cloud: >0.8 (very similar)
  - [ ] Query "Python Programming" → verify "Python", "Python Development" in top 3
  - [ ] Query "Cloud Architecture" → verify "AWS", "Azure", "GCP" in top 5
  - [ ] Document test results in `tests/services/embedding_quality_report.md`

---

## Update Instructions

**When you complete a task:**
1. Check the box: `- [x] Task name`
2. Update the "Completed" count at the top
3. Update `PROJECT-STATUS.md`:
   - Find "Block D" row in Step 2 table
   - Update Progress column (e.g., "3/13 tasks")

**When ALL tasks complete:**
1. Change status in `PROJECT-STATUS.md` from ⏸️ to ✅
2. Update Progress to "13/13 tasks (100%)"
3. Update "Overall Progress" section
4. Commit: `git add . && git commit -m "Complete BLOCK-D: Vector embeddings with two-layer caching"`
5. Notify team: "Block D complete - semantic similarity search ready for matching engine"

---

## Acceptance Criteria

All tasks must be complete AND:
- [ ] EmbeddingService class implemented: `from backend.services import EmbeddingService`
- [ ] Two-layer cache working: exact match + semantic similarity
- [ ] Redis cache hit rate >90% (track in logs)
- [ ] OpenAI API integration works: returns 3072-dim vectors
- [ ] Batch processing: 100 skills per API call
- [ ] All employee skills embedded: `SELECT COUNT(*) FROM skill_embeddings WHERE source_type = 'employee'` returns ~3,000
- [ ] All job posting skills embedded: `SELECT COUNT(*) FROM skill_embeddings WHERE source_type = 'job_posting'` returns ~1,000
- [ ] Similarity search returns results in <100ms
- [ ] HNSW index used: `EXPLAIN` shows "Index Scan using idx_skill_embedding_vector"
- [ ] Total OpenAI cost <$1 (check OpenAI dashboard)
- [ ] All pytest tests pass: `pytest tests/services/ -v`
- [ ] Embedding quality validated: similar skills have high similarity scores

---

## Dependencies

**This block depends on:**
- ✅ BLOCK-C complete (SkillEmbedding model exists)
- ✅ STEP-1-SETUP complete (pgvector extension installed, Redis running)

**This block enables:**
- BLOCK-E: Matching Engine (needs semantic skill matching)
- BLOCK-G: Skill Extraction (needs embedding service for user skills)

**Critical files:**
- `backend/services/embedding_service.py` - Core embedding logic
- `backend/config.py` - OpenAI and Redis client setup
- `scripts/embed_employee_skills.py` - Bulk embed employee skills
- `scripts/embed_job_skills.py` - Bulk embed job posting skills
- `tests/services/test_embedding_*.py` - Comprehensive tests

---

## Cost Tracking

**Budget:** $1.00
**Actual:** $TBD

| Component | Budget | Actual | Notes |
|-----------|--------|--------|-------|
| Initial employee skills (3K unique) | $0.0004 | - | 3K × 3 tokens × $0.13/1M |
| Initial job skills (1K unique) | $0.0001 | - | 1K × 3 tokens × $0.13/1M |
| User skills (ongoing) | $0.20/year | - | 100 users/day × 15 skills |
| Buffer | $0.80 | - | For re-embeddings, testing |
| **Total** | **$1.00** | **-** | Track in OpenAI dashboard |

**How to track:**
1. Note OpenAI usage before: https://platform.openai.com/usage
2. Run embedding scripts: `python scripts/embed_employee_skills.py`
3. Note OpenAI usage after
4. Calculate: `cost = (tokens_used / 1M) * $0.13`

---

## Performance Targets

**Embedding generation:**
- Single skill (cache miss): <200ms
- Single skill (cache hit): <5ms
- Batch 100 skills (all cache miss): <2 seconds
- Batch 3,000 skills (90% cache hit): <30 seconds

**Similarity search:**
- Top 10 similar skills (1K embeddings): <20ms
- Top 10 similar skills (10K embeddings): <50ms
- Top 10 similar skills (100K embeddings): <100ms

**Cache performance:**
- Redis exact match lookup: <1ms
- Redis semantic search (100 cached): <10ms
- Cache hit rate: >90% after initial embedding

---

## Troubleshooting

### Issue: OpenAI API rate limit exceeded

**Symptom:** `RateLimitError: You exceeded your current quota`

**Solution:**
- Check OpenAI dashboard for quota/billing
- Reduce batch size from 100 to 50
- Add sleep between batches: `await asyncio.sleep(1)`

### Issue: pgvector HNSW index not used

**Symptom:** `EXPLAIN` shows "Seq Scan" instead of "Index Scan"

**Solution:**
- Verify index exists: `\d+ skill_embeddings`
- Rebuild index: `REINDEX INDEX idx_skill_embedding_vector;`
- Increase work_mem for index building: `SET work_mem = '256MB';`

### Issue: Redis connection refused

**Symptom:** `ConnectionRefusedError: [Errno 111] Connection refused`

**Solution:**
- Check Redis running: `docker ps | grep redis`
- Start Redis: `docker-compose up -d redis`
- Verify REDIS_URL in .env: `redis://localhost:6379/0`

### Issue: Embeddings have wrong dimensions

**Symptom:** Database error "expected 3072 dimensions, got 1536"

**Solution:**
- Verify model: Must use "text-embedding-3-large" (not "text-embedding-3-small")
- Check API response: `len(response.data[0].embedding)` should be 3072
- Recreate embeddings with correct model

---

**Last Updated:** 2026-01-06
**Status:** Not Started
