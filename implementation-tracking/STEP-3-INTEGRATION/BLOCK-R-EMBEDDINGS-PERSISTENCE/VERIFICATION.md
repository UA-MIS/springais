# BLOCK R: Embeddings Persistence Integration - VERIFICATION

**Block:** BLOCK-R-EMBEDDINGS-PERSISTENCE
**Purpose:** Verify embedding persistence, similarity search, and performance

---

## Pre-Verification Checklist

Before running verification, ensure:
- [ ] All 4 tasks in TASKS.md are checked complete
- [ ] Block C (SkillEmbedding model) exists in database
- [ ] Block D (EmbeddingService) is fully implemented
- [ ] OpenAI API key configured and valid
- [ ] Redis running for caching
- [ ] PostgreSQL with pgvector extension running
- [ ] Batch scripts executed successfully

---

## Verification Steps

### Step 1: Database Schema Verification

**Verify SkillEmbedding table and indexes exist:**

```sql
-- Connect to database
psql -U springais_user -d springais_db

-- Check table schema
\d+ skill_embeddings

-- Expected columns:
-- id (uuid)
-- skill_text (varchar 255)
-- normalized_text (varchar 255)
-- embedding (vector 1536)  ← Must be 1536 dims
-- source_type (varchar 50)
-- source_id (varchar 255)
-- embedding_model (varchar 100)
-- pca_version (varchar 50)
-- token_count (integer)
-- created_at (timestamp)

-- Check indexes
\d skill_embeddings

-- Expected indexes:
-- skill_embeddings_pkey (PRIMARY KEY on id)
-- idx_skill_embedding_normalized (btree on normalized_text)
-- idx_skill_embedding_vector (hnsw on embedding)  ← Critical for performance
-- idx_skill_embedding_source (btree on source_type, source_id)
```

**✅ Pass Criteria:**
- Table exists with all required columns
- embedding column is VECTOR(1536), not VECTOR(3072)
- HNSW index exists on embedding column

---

### Step 2: Data Verification

**Verify embeddings were saved correctly:**

```sql
-- Check total count
SELECT COUNT(*) FROM skill_embeddings;
-- Expected: ~4,000 (varies based on synthetic data)

-- Check by source type
SELECT source_type, COUNT(*) as count
FROM skill_embeddings
GROUP BY source_type;
-- Expected output:
--  source_type  | count
-- --------------+-------
--  employee     | ~3000
--  job_posting  | ~1000

-- Check embedding dimensions
SELECT
    skill_text,
    vector_dims(embedding) as dims,
    embedding_model,
    pca_version
FROM skill_embeddings
LIMIT 5;
-- Expected: dims = 1536 for all rows
-- Expected: embedding_model = 'text-embedding-3-large-pca'
-- Expected: pca_version = 'v1'

-- Check for NULL embeddings (should be 0)
SELECT COUNT(*) FROM skill_embeddings WHERE embedding IS NULL;
-- Expected: 0

-- Sample embeddings
SELECT skill_text, normalized_text, source_type
FROM skill_embeddings
ORDER BY created_at DESC
LIMIT 10;
-- Verify skills look reasonable
```

**✅ Pass Criteria:**
- Total count >3,000 embeddings
- Both 'employee' and 'job_posting' source types present
- All embeddings are 1536 dimensions
- No NULL embeddings
- embedding_model is 'text-embedding-3-large-pca'
- pca_version is 'v1'

---

### Step 3: Similarity Search Functional Test

**Test find_similar_skills() returns correct results:**

```python
import asyncio
from backend.app.services.embedding_service import EmbeddingService
from backend.app.database import get_db

async def test_similarity_search():
    # Initialize service
    db = next(get_db())
    embedding_service = EmbeddingService(openai_client, redis_client, db)

    # Test 1: Python skills
    print("Test 1: Finding skills similar to 'Python Programming'")
    results = await embedding_service.find_similar_skills("Python Programming", top_n=10)

    print(f"Found {len(results)} results:")
    for i, result in enumerate(results, 1):
        print(f"  {i}. {result['skill_text']:<30} Similarity: {result['similarity']:.3f}")

    # Expected top results: "Python", "Python Development", "Django", "Flask", etc.
    assert len(results) == 10, "Should return 10 results"
    assert results[0]['similarity'] > 0.85, "Top result should be very similar"
    assert results[0]['similarity'] > results[-1]['similarity'], "Results should be descending"

    # Test 2: Cloud skills
    print("\nTest 2: Finding skills similar to 'Cloud Architecture'")
    results = await embedding_service.find_similar_skills("Cloud Architecture", top_n=5)

    print(f"Found {len(results)} results:")
    for i, result in enumerate(results, 1):
        print(f"  {i}. {result['skill_text']:<30} Similarity: {result['similarity']:.3f}")

    # Expected: "AWS", "Azure", "GCP", "Cloud Engineering", etc.
    cloud_keywords = ['aws', 'azure', 'gcp', 'cloud']
    assert any(
        keyword in result['skill_text'].lower()
        for result in results[:3]
        for keyword in cloud_keywords
    ), "Top results should contain cloud-related skills"

    # Test 3: Filter by source type
    print("\nTest 3: Finding employee skills similar to 'Python'")
    employee_results = await embedding_service.find_similar_skills(
        "Python",
        top_n=5,
        source_type="employee"
    )

    print(f"Found {len(employee_results)} employee skills")
    for result in employee_results:
        assert result['source_type'] == 'employee', "Should only return employee skills"

    print("\n✅ All similarity search tests passed!")

# Run tests
asyncio.run(test_similarity_search())
```

**✅ Pass Criteria:**
- Returns exactly top_n results
- Similarity scores are between 0 and 1
- Results sorted by similarity (descending)
- Top result has similarity >0.85
- Cloud query returns cloud-related skills in top 3
- source_type filter works correctly

---

### Step 4: Performance Verification

**Test similarity search speed:**

```python
import time
import asyncio

async def test_performance():
    db = next(get_db())
    embedding_service = EmbeddingService(openai_client, redis_client, db)

    # Warm up (first query may be slower due to caching)
    await embedding_service.find_similar_skills("Python", top_n=10)

    # Test 1: Single search performance
    print("Test 1: Similarity search performance")
    times = []
    for i in range(10):
        start = time.time()
        results = await embedding_service.find_similar_skills("Python Programming", top_n=10)
        elapsed = (time.time() - start) * 1000  # Convert to ms
        times.append(elapsed)

    avg_time = sum(times) / len(times)
    print(f"  Average search time: {avg_time:.2f}ms")
    print(f"  Min: {min(times):.2f}ms, Max: {max(times):.2f}ms")

    assert avg_time < 100, f"Search too slow: {avg_time:.2f}ms (target: <100ms)"
    print(f"  ✅ Performance target met: {avg_time:.2f}ms < 100ms")

    # Test 2: HNSW index verification
    print("\nTest 2: Verify HNSW index is used")

    # Get a sample embedding to query
    sample_embedding = await embedding_service.embed_skill("Python")

    # Run EXPLAIN ANALYZE
    from sqlalchemy import text
    explain_query = text(f"""
        EXPLAIN ANALYZE
        SELECT skill_text, embedding <=> :embedding::vector AS distance
        FROM skill_embeddings
        ORDER BY embedding <=> :embedding::vector
        LIMIT 10
    """)

    result = db.execute(explain_query, {"embedding": sample_embedding})
    explain_output = "\n".join([str(row) for row in result])

    print("Query plan:")
    print(explain_output)

    # Check for HNSW index usage
    assert "idx_skill_embedding_vector" in explain_output, "HNSW index not used!"
    assert "Index Scan" in explain_output, "Should use Index Scan, not Seq Scan"

    print("  ✅ HNSW index is being used correctly")

asyncio.run(test_performance())
```

**✅ Pass Criteria:**
- Average search time <100ms
- HNSW index used (check EXPLAIN output)
- No sequential scans

---

### Step 5: Cache Verification

**Test Redis caching reduces API calls:**

```python
async def test_caching():
    db = next(get_db())
    redis_client = get_redis_client()
    embedding_service = EmbeddingService(openai_client, redis_client, db)

    # Clear cache first
    redis_client.flushdb()

    # Test 1: Cache miss
    print("Test 1: First embedding (cache miss)")
    start = time.time()
    embedding1 = await embedding_service.embed_skill("Machine Learning")
    time1 = (time.time() - start) * 1000
    print(f"  Time: {time1:.2f}ms (includes OpenAI API call)")

    # Test 2: Cache hit (same skill)
    print("\nTest 2: Second embedding (cache hit)")
    start = time.time()
    embedding2 = await embedding_service.embed_skill("Machine Learning")
    time2 = (time.time() - start) * 1000
    print(f"  Time: {time2:.2f}ms (from Redis cache)")

    # Verify embeddings are identical
    assert embedding1 == embedding2, "Cached embedding should match original"
    assert time2 < time1 / 10, f"Cache hit should be 10x faster: {time2:.2f}ms vs {time1:.2f}ms"

    print(f"  ✅ Cache speedup: {time1/time2:.1f}x faster")

    # Test 3: Check cache hit rate after batch processing
    # Query Redis for cache stats
    cache_keys = redis_client.keys("embedding:exact:*")
    print(f"\nTest 3: Cache coverage")
    print(f"  Total cached embeddings: {len(cache_keys)}")

    # Expected: >3000 (all unique skills)
    assert len(cache_keys) > 1000, "Should have many cached embeddings"
    print(f"  ✅ Cache well-populated")

asyncio.run(test_caching())
```

**✅ Pass Criteria:**
- Cache miss takes >100ms (OpenAI API call)
- Cache hit takes <10ms (Redis lookup)
- Cache hit is >10x faster than cache miss
- >1000 embeddings cached in Redis

---

### Step 6: Cost Verification

**Verify OpenAI costs are within budget:**

```bash
# Check OpenAI usage dashboard
echo "Visit: https://platform.openai.com/usage"
echo "Filter by: Today's date"
echo "Check: Total cost for text-embedding-3-large"
echo ""
echo "Expected cost: ~$0.002 for initial embedding generation"
echo "Budget: <$1.00 total"
```

**Manual verification:**
1. Go to OpenAI dashboard: https://platform.openai.com/usage
2. Select date range (day scripts were run)
3. Filter by model: text-embedding-3-large
4. Check total cost

**✅ Pass Criteria:**
- Total cost <$1.00
- Cost per 1K tokens ≈ $0.00013
- Typical cost for 4,000 skills ≈ $0.002

---

### Step 7: Batch Script Verification

**Verify batch scripts completed successfully:**

```bash
# Check script logs
cat backend/scripts/embed_employee_skills.log
cat backend/scripts/embed_job_skills.log

# Expected output:
# ✓ All employee skills embedded and saved to database!
# ✓ All job posting skills embedded and saved to database!
```

**Query database to verify:**

```sql
-- Check last embedded skills
SELECT skill_text, source_type, created_at
FROM skill_embeddings
ORDER BY created_at DESC
LIMIT 20;

-- Verify created_at timestamps are recent
-- Should see timestamps from when scripts were run
```

**✅ Pass Criteria:**
- Both scripts completed without errors
- Progress bars reached 100%
- Database contains embeddings with recent timestamps
- No errors in script output

---

### Step 8: Integration Test with Block N/O

**Test that Blocks N and O can use embeddings:**

```python
# Simulate Block N usage (Skills Integration)
async def test_block_n_integration():
    db = next(get_db())
    embedding_service = EmbeddingService(openai_client, redis_client, db)

    # Scenario: User has Python skills, job requires Python Programming
    user_skills = ["Python", "JavaScript", "SQL"]
    job_required_skills = ["Python Programming", "Django", "PostgreSQL"]

    print("Block N Integration Test: Skill Gap Analysis")
    print(f"User skills: {user_skills}")
    print(f"Job required: {job_required_skills}")

    # Find matches
    matches = []
    gaps = []

    for job_skill in job_required_skills:
        similar = await embedding_service.find_similar_skills(
            job_skill,
            top_n=5,
            source_type="employee"
        )

        # Check if user has similar skill (similarity > 0.8)
        user_match = None
        for user_skill in user_skills:
            for sim_result in similar:
                if sim_result['skill_text'].lower() == user_skill.lower():
                    if sim_result['similarity'] > 0.8:
                        user_match = user_skill
                        break

        if user_match:
            matches.append((job_skill, user_match))
            print(f"  ✓ Match: {job_skill} ≈ {user_match}")
        else:
            gaps.append(job_skill)
            print(f"  ✗ Gap: {job_skill} (user doesn't have)")

    match_percentage = (len(matches) / len(job_required_skills)) * 100
    print(f"\nMatch percentage: {match_percentage:.1f}%")

    # Expected: Python matches, Django/PostgreSQL are gaps
    assert len(matches) >= 1, "Should find at least one match (Python)"
    assert len(gaps) >= 1, "Should find at least one gap"
    print("✅ Block N integration test passed!")

asyncio.run(test_block_n_integration())
```

**✅ Pass Criteria:**
- Skill gap analysis works
- Finds matches between user and job skills
- Identifies missing skills (gaps)
- Returns reasonable match percentage

---

## Final Verification Checklist

Before marking Block R complete, verify ALL of the following:

### Database
- [ ] SkillEmbedding table exists with correct schema
- [ ] HNSW index exists on embedding column
- [ ] >3,000 embeddings in database
- [ ] All embeddings are 1536 dimensions (PCA-reduced)
- [ ] Both 'employee' and 'job_posting' source types present
- [ ] No NULL embeddings

### Functionality
- [ ] `save_skill_embedding()` works and saves to database
- [ ] `find_similar_skills()` returns correct results
- [ ] Similarity scores between 0 and 1
- [ ] Results sorted by similarity (descending)
- [ ] source_type filter works correctly

### Performance
- [ ] Similarity search <100ms average
- [ ] HNSW index used (verify with EXPLAIN)
- [ ] No sequential scans on similarity queries
- [ ] Cache hit >10x faster than cache miss

### Integration
- [ ] Block N can use embeddings for skill gap analysis
- [ ] Block O can use embeddings for matching
- [ ] find_similar_skills() API works end-to-end

### Cost
- [ ] Total OpenAI cost <$1
- [ ] Cost tracked and documented
- [ ] Cache reduces API calls by >90%

### Scripts
- [ ] embed_employee_skills.py completed successfully
- [ ] embed_job_skills.py completed successfully
- [ ] Progress bars worked correctly
- [ ] No errors in script execution

---

## Verification Complete

If ALL checks above pass:
1. ✅ Mark all tasks complete in TASKS.md
2. ✅ Update PROJECT-STATUS.md: Block R → ✅ Completed
3. ✅ Commit changes with message: "Complete Block R: Embeddings Persistence Integration"
4. ✅ Notify blocks N and O that embeddings are ready

If ANY checks fail:
1. Document failures in this file
2. Return to TASKS.md and fix issues
3. Re-run verification

---

**Last Verified:** [DATE]
**Verified By:** [NAME]
**Status:** [PASS / FAIL]
**Notes:** [Any issues or observations]
