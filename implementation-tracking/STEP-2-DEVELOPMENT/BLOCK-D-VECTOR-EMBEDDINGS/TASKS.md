# BLOCK D: Vector Embeddings - TASKS

**Block:** BLOCK-D-VECTOR-EMBEDDINGS
**Total Tasks:** 16
**Completed:** 0/16 (0%)

---

## ⚠️ IMPORTANT: Update Instructions

**When you complete a task:**
1. Check the box: `- [x] Task name`
2. Update the "Completed" count at the top
3. Update `PROJECT-STATUS.md`:
   - Find "Block D" row in Step 2 table
   - Update Progress column (e.g., "3/13 tasks")

**When ALL tasks complete:**
1. ✅ Run all verification steps in `VERIFICATION.md`
2. ✅ Change status in `PROJECT-STATUS.md` from ⏸️ to ✅
3. ✅ Update Progress to "13/13 tasks (100%)"
4. ✅ Update "Overall Progress" section
5. ✅ After verification passes, commit changes (do NOT commit until verification is complete)

See `CONTEXT.md` section "Update Instructions (For AI)" for full details.

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

### Phase 3: PCA Dimensionality Reduction (Tasks 6-8)

- [ ] **Task 6:** Set up PCA model storage and infrastructure
  - [ ] Create `backend/models/pca/` directory
  - [ ] Add scikit-learn dependency to requirements.txt (already in Step 1)
  - [ ] Create PCA model loader utility: `backend/utils/pca_loader.py`
  - [ ] Implement `load_pca_model(version="v1")` function
  - [ ] Implement `save_pca_model(pca, metadata, version)` function
  - [ ] Create PCA metadata schema (JSON with n_components, variance_ratio, etc.)

- [ ] **Task 7:** Train initial PCA model on diverse skill embeddings
  - [ ] Create `scripts/train_pca_model.py` script
  - [ ] Collect 5000+ diverse skill embeddings:
    - [ ] Mix of technical skills (Python, AWS, React, etc.)
    - [ ] Soft skills (Leadership, Communication)
    - [ ] Domain skills (Finance, Healthcare, etc.)
  - [ ] Call OpenAI to get 3072-dim embeddings for training set
  - [ ] Train PCA model: `PCA(n_components=1536, random_state=42)`
  - [ ] Validate variance preservation: assert explained_variance_ratio > 0.95
  - [ ] Save PCA model to `backend/models/pca/pca_model_v1.pkl` (using joblib)
  - [ ] Save metadata to `backend/models/pca/pca_metadata_v1.json`
  - [ ] Print training stats: variance preserved, components used, etc.
  - [ ] Test: load model and transform test embedding (3072 → 1536)

- [ ] **Task 8:** Integrate PCA into EmbeddingService pipeline
  - [ ] Load PCA model in `EmbeddingService.__init__()`
  - [ ] Update `_call_openai()` to return full 3072-dim embedding
  - [ ] Add `_apply_pca(embedding)` method to reduce 3072 → 1536
  - [ ] Update `embed_skill()` to apply PCA before returning:
    - [ ] Get 3072-dim from OpenAI
    - [ ] Apply PCA reduction to 1536-dim
    - [ ] Cache reduced embedding (1536-dim)
    - [ ] Return reduced embedding
  - [ ] Update cache to store 1536-dim embeddings (not 3072)
  - [ ] Update database saves to use 1536-dim embeddings
  - [ ] Test full pipeline: input skill → 3072 OpenAI → 1536 PCA → cache/DB
  - [ ] Verify reduced embeddings maintain similarity relationships

### Phase 4: Core Embedding Methods (Tasks 9-10)

- [ ] **Task 9:** Implement embed_skill() with full caching pipeline
  - [ ] Call Layer 1: `cached = await self._get_exact_match_cache(skill_text)`
  - [ ] If cache hit, return cached embedding
  - [ ] Call Layer 2: `similar = await self._get_semantic_cache(skill_text)`
  - [ ] If similarity >0.95, return similar embedding
  - [ ] Call OpenAI API: `embedding = await self._call_openai(skill_text)`
  - [ ] Save to cache: `await self._save_exact_match_cache(skill_text, embedding)`
  - [ ] Save to database: `SkillEmbedding(skill_text=..., embedding=...)`
  - [ ] Return embedding
  - [ ] Test full pipeline with cache hits and misses

- [ ] **Task 10:** Implement embed_skills_batch() for bulk processing
  - [ ] Accept list of skill texts
  - [ ] Check cache for each skill (exact + semantic)
  - [ ] Collect uncached skills
  - [ ] Batch call OpenAI for uncached skills (100 at a time)
  - [ ] Save all embeddings to cache and database
  - [ ] Return dict: {skill_text: embedding}
  - [ ] Add progress bar using tqdm
  - [ ] Test with 300 mock skills, verify <30 seconds

### Phase 5: Database Integration (Tasks 11-12)

- [ ] **Task 11:** Implement save_to_database() for SkillEmbedding records
  - [ ] Create `SkillEmbedding` record with all fields:
    - [ ] skill_text, normalized_text, embedding (convert to pgvector format)
    - [ ] source_type, source_id (if provided)
    - [ ] embedding_model = "text-embedding-3-large-pca"
    - [ ] pca_version = "v1"
    - [ ] token_count (from OpenAI response)
  - [ ] Use `db.add()` and `db.commit()`
  - [ ] Handle duplicates: upsert if normalized_text already exists
  - [ ] Test insertion, verify pgvector VECTOR(1536) type works

- [ ] **Task 12:** Implement find_similar_skills() using pgvector
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

### Phase 6: Batch Processing Scripts (Tasks 13-14)

- [ ] **Task 13:** Create script to embed all employee skills
  - [ ] Create `scripts/embed_employee_skills.py`
  - [ ] Load all employees from database (or synthetic data SQL dump)
  - [ ] Extract all unique skills: `set(skill for emp in employees for skill in emp.skills)`
  - [ ] Call `embedding_service.embed_skills_batch(unique_skills)`
  - [ ] Show progress bar: "Embedding 3,000 skills [████████] 100%"
  - [ ] Print stats: total skills, cache hits, API calls, cost, duration
  - [ ] Test with Block A synthetic data (900 employees)

- [ ] **Task 14:** Create script to embed all job posting skills
  - [ ] Create `scripts/embed_job_skills.py`
  - [ ] Load all job postings from database (or Block B scraped data)
  - [ ] Extract all unique skills from required_skills + preferred_skills
  - [ ] Call `embedding_service.embed_skills_batch(unique_skills)`
  - [ ] Show progress bar
  - [ ] Print stats: total skills, cache hits, API calls, cost, duration
  - [ ] Test with Block B job posting data (300 jobs)

### Phase 7: Testing & Validation (Tasks 15-16)

- [ ] **Task 15:** Create comprehensive pytest tests
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
  - [ ] Create `tests/services/test_pca.py`:
    - [ ] test_pca_model_loads
    - [ ] test_pca_reduces_dimensions (3072 → 1536)
    - [ ] test_pca_preserves_similarity (compare before/after)
  - [ ] Run all tests: `pytest tests/services/ -v`

- [ ] **Task 16:** Validate embedding quality manually
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

## Acceptance Criteria

All tasks must be complete AND:
- [ ] EmbeddingService class implemented: `from backend.services import EmbeddingService`
- [ ] Two-layer cache working: exact match + semantic similarity
- [ ] Redis cache hit rate >90% (track in logs)
- [ ] OpenAI API integration works: returns 3072-dim vectors from API
- [ ] PCA model trained and stored: `backend/models/pca/pca_model_v1.pkl` exists
- [ ] PCA reduces embeddings: 3072 → 1536 dimensions
- [ ] PCA preserves >95% variance (check metadata.json)
- [ ] Batch processing: 100 skills per API call
- [ ] All employee skills embedded: `SELECT COUNT(*) FROM skill_embeddings WHERE source_type = 'employee'` returns ~3,000
- [ ] All job posting skills embedded: `SELECT COUNT(*) FROM skill_embeddings WHERE source_type = 'job_posting'` returns ~1,000
- [ ] Database stores 1536-dim vectors: `SELECT vector_dims(embedding) FROM skill_embeddings LIMIT 1` returns 1536
- [ ] Similarity search returns results in <100ms
- [ ] HNSW index used: `EXPLAIN` shows "Index Scan using idx_skill_embedding_vector"
- [ ] Total OpenAI cost <$1 (check OpenAI dashboard)
- [ ] All pytest tests pass: `pytest tests/services/ -v`
- [ ] Embedding quality validated: similar skills have high similarity scores
- [ ] PCA-reduced embeddings maintain similarity rankings (validate in tests)

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

**Symptom:** Database error "expected 1536 dimensions, got 3072" or "expected 1536 dimensions, got X"

**Solution:**
- Verify PCA model is loaded: Check `self.pca` in EmbeddingService
- Verify PCA is applied: embeddings should be reduced before saving
- Check `len(embedding)` should be 1536 after PCA reduction
- If storing unreduced embeddings, apply PCA: `self.pca.transform([embedding])[0]`
- Recreate embeddings with PCA pipeline

---

**Last Updated:** 2026-01-06
**Status:** Not Started
