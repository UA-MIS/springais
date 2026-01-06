# BLOCK D: Vector Embeddings - CONTEXT

**Block ID:** BLOCK-D-VECTOR-EMBEDDINGS
**Phase:** STEP-2-DEVELOPMENT
**Category:** #backend #ai #pgvector
**Estimated Time:** 2-3 days
**Dependencies:** BLOCK-C (SkillEmbedding model), STEP-1-SETUP (pgvector extension)

---

## AI Quick Start Prompt

```
You are working on BLOCK-D: Vector Embeddings for SpringAIS.

Goal: Generate text embeddings for all skills using OpenAI's text-embedding-3-large model, store in pgvector, implement Redis caching for cost optimization.

Key constraints:
- OpenAI text-embedding-3-large: 3072 dimensions, $0.13/1M tokens
- pgvector HNSW index for fast similarity search (<100ms for 10K embeddings)
- Two-layer Redis cache: (1) exact match, (2) semantic similarity
- Batch processing: 100 skills per API call
- Cost target: <$1 for all employee + job posting skills

Read TASKS.md for step-by-step implementation checklist.
Read VERIFICATION.md for embedding quality and performance tests.
```

---

## Purpose

Create a semantic similarity search system that enables AI-powered skill matching beyond exact string matches. This allows SpringAIS to recommend jobs even when skill terminology differs (e.g., "React" vs "React.js", "Cloud Architecture" vs "AWS Solutions Architect").

**Why this matters:**
- Exact string matching misses semantic equivalents ("Python" != "Python Programming")
- Users describe skills differently than job postings
- Semantic search finds conceptually similar skills across terminology gaps
- Enables "stretch" matches (user has 80% semantic overlap with job requirements)

**Success outcome:**
- All employee and job posting skills embedded (3072-dim vectors)
- pgvector HNSW index enables <100ms similarity search
- Redis cache reduces OpenAI API costs by 90%+
- Matching engine can find semantically similar skills
- Cost under $1 for initial embedding generation

---

## Background: Semantic Similarity Search

### The Problem with Exact String Matching

**Scenario 1: Terminology Variations**
```python
user_skills = ["React", "Node.js", "MongoDB"]
job_required = ["React.js", "NodeJS", "Mongo"]

# Exact match: 0% overlap ❌
# Semantic match: 100% overlap ✅
```

**Scenario 2: Conceptual Overlap**
```python
user_skills = ["AWS", "EC2", "S3", "Lambda"]
job_required = ["Cloud Architecture", "Serverless Computing", "Object Storage"]

# Exact match: 0% overlap ❌
# Semantic match: 90% overlap ✅ (AWS services map to cloud concepts)
```

**Scenario 3: Skill Hierarchies**
```python
user_skills = ["Python", "Django", "Flask"]
job_required = ["Python Web Development"]

# Exact match: 33% overlap (only "Python")
# Semantic match: 100% overlap ✅ (Django/Flask are Python web frameworks)
```

### How Vector Embeddings Work

**Step 1: Text → Vector**
```python
# OpenAI text-embedding-3-large converts text to 3072-dim vector
"Python Programming" → [0.023, -0.145, 0.089, ..., 0.012]  # 3072 numbers
```

**Step 2: Vector Similarity**
```python
# Cosine similarity measures angle between vectors
# Range: -1 (opposite) to 1 (identical)

cosine_similarity("Python Programming", "Python Development")
# = 0.94 ✅ Very similar

cosine_similarity("Python Programming", "Tax Law")
# = 0.12 ❌ Not similar
```

**Step 3: Semantic Search**
```python
# Find top N most similar skills to query
query = "Cloud Architecture"
results = find_similar_skills(query, top_n=5)
# Results:
# 1. "AWS Solutions Architect" (0.92)
# 2. "Azure Cloud Engineer" (0.88)
# 3. "Cloud Infrastructure" (0.86)
# 4. "DevOps Engineering" (0.71)
# 5. "Kubernetes" (0.68)
```

---

## OpenAI Embedding Model: text-embedding-3-large

### Model Specs

**Dimensions:** 3072 (high-dimensional for better accuracy)
**Max Input:** 8,191 tokens (~30K characters)
**Pricing:** $0.13 per 1M tokens

**Performance:**
- MTEB Score: 64.6% (state-of-the-art as of 2025)
- Better than text-embedding-3-small (1536 dims, 62.3% MTEB)
- Better than text-embedding-ada-002 (1536 dims, legacy)

**Why text-embedding-3-large:**
- Higher accuracy for nuanced skill matching
- 3072 dims capture subtle semantic differences
- Worth the cost ($0.13 vs $0.02) for better match quality

### Cost Analysis

**Initial embedding generation:**
```
900 employees × 7 avg skills = 6,300 skills
300 job postings × 8 avg skills = 2,400 skills
Total unique skills (deduplicated): ~3,000 skills

3,000 skills × 3 tokens avg = 9,000 tokens
9,000 tokens / 1M × $0.13 = $0.0012 (~$0.001)

Cost: <$0.01 for initial generation ✅
```

**Ongoing cost (without cache):**
```
User uploads resume → 15 skills extracted
15 skills × 3 tokens × $0.13/1M = $0.000006 per user

100 users/day = $0.0006/day = $0.22/year

Cost acceptable, but cache reduces by 90%+ ✅
```

---

## Two-Layer Redis Caching Strategy

### Layer 1: Exact Match Cache (Fastest)

**Purpose:** Avoid re-embedding identical skill text

**Key structure:** `embedding:exact:{normalized_text}`
```python
# Example
key = "embedding:exact:python programming"
value = {
    "embedding": [0.023, -0.145, ...],  # 3072 floats
    "skill_text": "Python Programming",
    "embedding_model": "text-embedding-3-large",
    "created_at": "2026-01-06T10:30:00Z"
}
```

**Normalization:**
```python
def normalize_skill_text(text: str) -> str:
    """Normalize for exact match cache"""
    return text.lower().strip().replace("  ", " ")

# Examples:
"Python Programming" → "python programming"
"React.js" → "react.js"
"  AWS   Cloud  " → "aws cloud"
```

**Cache hit rate:** ~85-90% (most skills reused across employees/jobs)

**TTL:** 30 days (embeddings rarely change)

---

### Layer 2: Semantic Similarity Cache (Fast Fallback)

**Purpose:** Find cached embeddings for semantically similar skills (avoid re-embedding "Python" when "Python Programming" already cached)

**Key structure:** `embedding:semantic:{hash}`
```python
# Example: Query "Python Programming"
# Redis search finds similar cached skills:
key = "embedding:semantic:abc123"
value = {
    "skill_text": "Python Development",  # Similar to "Python Programming"
    "embedding": [0.025, -0.142, ...],
    "similarity_threshold": 0.95  # Use cached if >0.95 similar
}
```

**Similarity threshold:** 0.95 cosine similarity
- If cached skill is >0.95 similar to query, reuse embedding
- Small difference (<0.05) negligible for matching engine

**Cache hit rate:** ~5-10% additional (on top of exact match)

**Combined cache hit rate:** ~90-95% (only 5-10% require OpenAI API call)

---

## pgvector Storage and Indexing

### Vector Storage

**Table:** `skill_embeddings`
```sql
CREATE TABLE skill_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_text VARCHAR(255) NOT NULL,
    normalized_text VARCHAR(255) NOT NULL,
    embedding VECTOR(3072) NOT NULL,  -- pgvector type
    source_type VARCHAR(50),  -- "employee", "job_posting", "user_profile"
    source_id VARCHAR(255),
    embedding_model VARCHAR(100) DEFAULT 'text-embedding-3-large',
    token_count INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
```sql
-- Exact match cache (fastest)
CREATE INDEX idx_skill_embedding_normalized ON skill_embeddings(normalized_text);

-- Semantic similarity search (HNSW for vectors)
CREATE INDEX idx_skill_embedding_vector ON skill_embeddings
USING hnsw (embedding vector_cosine_ops);

-- Source lookup
CREATE INDEX idx_skill_embedding_source ON skill_embeddings(source_type, source_id);
```

---

### HNSW Index (Hierarchical Navigable Small World)

**What is HNSW:**
- Approximate nearest neighbor (ANN) algorithm
- 10-100x faster than exact search with 95%+ accuracy
- Builds hierarchical graph structure for fast traversal

**Performance:**
```
Exact search (no index):    500ms for 10K vectors
HNSW index:                  <50ms for 10K vectors (10x faster)
HNSW index (100K vectors):   <100ms (scales well)
```

**Configuration:**
```sql
-- Default HNSW parameters (good for most use cases)
CREATE INDEX idx_skill_embedding_vector ON skill_embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- m: max connections per node (higher = better accuracy, slower build)
-- ef_construction: search breadth (higher = better accuracy, slower build)
```

**Similarity search query:**
```sql
-- Find top 10 skills most similar to query vector
SELECT skill_text, embedding <=> $1::vector AS distance
FROM skill_embeddings
ORDER BY embedding <=> $1::vector
LIMIT 10;

-- <=> is cosine distance operator (1 - cosine_similarity)
-- Returns: 0 (identical) to 2 (opposite)
```

---

## Architecture: Embedding Service

### Service Structure

**File:** `backend/services/embedding_service.py`

**Core methods:**
```python
class EmbeddingService:
    def __init__(self, openai_client, redis_client, db_session):
        self.openai = openai_client
        self.redis = redis_client
        self.db = db_session

    async def embed_skill(self, skill_text: str) -> List[float]:
        """Embed a single skill with two-layer caching"""
        # Layer 1: Exact match cache
        cached = await self._get_exact_match_cache(skill_text)
        if cached:
            return cached

        # Layer 2: Semantic similarity cache
        similar = await self._get_semantic_cache(skill_text)
        if similar and similar.similarity > 0.95:
            return similar.embedding

        # Layer 3: Call OpenAI API
        embedding = await self._call_openai(skill_text)
        await self._save_to_cache(skill_text, embedding)
        return embedding

    async def embed_skills_batch(self, skills: List[str]) -> Dict[str, List[float]]:
        """Embed multiple skills (batch API call for cache misses)"""
        results = {}
        uncached = []

        # Check cache for all skills
        for skill in skills:
            cached = await self.embed_skill(skill)
            if cached:
                results[skill] = cached
            else:
                uncached.append(skill)

        # Batch call OpenAI for uncached (max 100 per call)
        if uncached:
            batch_embeddings = await self._call_openai_batch(uncached)
            results.update(batch_embeddings)

        return results

    async def find_similar_skills(self, query: str, top_n: int = 10) -> List[SimilarSkill]:
        """Semantic similarity search using pgvector"""
        query_embedding = await self.embed_skill(query)

        # pgvector similarity search
        results = self.db.execute(
            text("""
                SELECT skill_text, embedding <=> :embedding AS distance
                FROM skill_embeddings
                ORDER BY embedding <=> :embedding
                LIMIT :limit
            """),
            {"embedding": query_embedding, "limit": top_n}
        )

        return [
            SimilarSkill(skill_text=row.skill_text, similarity=1 - row.distance)
            for row in results
        ]
```

---

## Batch Processing Strategy

**Problem:** OpenAI API has rate limits and latency

**Solution:** Batch processing with progress tracking

### Batch Configuration

**Batch size:** 100 skills per API call
- OpenAI supports up to 2,048 inputs per request
- 100 is optimal balance (fast, doesn't hit limits)

**Rate limits (Tier 2):**
- 5,000 requests per minute
- 2M tokens per minute

**For 3,000 skills:**
```
3,000 skills / 100 per batch = 30 API calls
30 calls × 0.5s per call = ~15 seconds total
```

**Progress tracking:**
```python
from tqdm import tqdm

async def embed_all_employee_skills():
    """Embed all skills from synthetic employees"""
    # Get all unique skills
    all_skills = get_unique_skills_from_employees()  # ~3,000 unique

    # Batch process
    for batch in tqdm(chunk(all_skills, 100), desc="Embedding skills"):
        embeddings = await embedding_service.embed_skills_batch(batch)
        save_to_database(embeddings)

    print(f"✓ Embedded {len(all_skills)} skills in {elapsed_time}s")
```

---

## Mock Data for Independent Testing

**Problem:** This block needs to test embeddings before synthetic data (Block A) exists

**Solution:** Mock skills for unit testing

**File:** `tests/fixtures/mock_skills.py`

```python
MOCK_SKILLS = [
    "Python Programming",
    "Python Development",  # Similar to Python Programming (0.94 similarity)
    "Java Programming",    # Somewhat similar (0.65 similarity)
    "Tax Law",             # Not similar (0.12 similarity)
    "AWS",
    "Cloud Architecture",  # Conceptually similar to AWS (0.78 similarity)
    "React",
    "React.js",            # Exact synonym (0.99 similarity)
]

MOCK_EMBEDDINGS = {
    "Python Programming": [0.023, -0.145, 0.089, ..., 0.012],  # 3072 dims
    # ... (use actual OpenAI embeddings for realistic tests)
}
```

**Integration in Step 3:** Replace mocks with Block A synthetic employee skills + Block B job posting skills

---

## References

**Related Documentation:**
- `implementation-tracking/BLOCK-C-DATABASE-MODELS/CONTEXT.md` - SkillEmbedding model definition
- `_bmad-output/tech-stack.md` - Vector search architecture
- `_bmad-output/architecture-updates-2026.md` - Caching strategy rationale

**OpenAI Resources:**
- Embeddings Guide: https://platform.openai.com/docs/guides/embeddings
- text-embedding-3-large: https://platform.openai.com/docs/models/embeddings
- Pricing: https://openai.com/api/pricing/

**pgvector Resources:**
- pgvector GitHub: https://github.com/pgvector/pgvector
- HNSW Index: https://github.com/pgvector/pgvector#hnsw
- Performance Tuning: https://github.com/pgvector/pgvector#indexing

**Redis Resources:**
- Redis Caching: https://redis.io/docs/manual/client-side-caching/
- Redis JSON: https://redis.io/docs/stack/json/

---

## Success Criteria

**This block is complete when:**

1. ✅ EmbeddingService implemented with two-layer caching
2. ✅ All employee skills embedded and stored in pgvector
3. ✅ All job posting skills embedded and stored in pgvector
4. ✅ Redis cache hit rate >90%
5. ✅ Similarity search returns results in <100ms
6. ✅ Batch processing handles 3,000 skills in <30 seconds
7. ✅ Total OpenAI cost <$1 for initial generation
8. ✅ Pytest tests validate cache, similarity search, batch processing

**Quality Checklist:**
- [ ] Exact match cache prevents re-embedding identical skills
- [ ] Semantic cache reuses similar embeddings (>0.95 similarity)
- [ ] pgvector HNSW index used for all similarity queries
- [ ] Batch processing uses max 100 skills per OpenAI call
- [ ] Progress bars show embedding generation status
- [ ] Cost tracking logs all OpenAI API usage
- [ ] Error handling for API failures (retry logic)
- [ ] Similarity search returns sensible results (validated manually)

---

## AI Auto-Update Instructions

When you complete a task in TASKS.md:

1. **Update the task checkbox:**
   ```markdown
   - [x] Task 1: Create EmbeddingService class structure
   ```

2. **Update PROJECT-STATUS.md:**
   ```markdown
   | **D** | Vector Embeddings | 🔄 In Progress | [Your name] | 3/13 tasks | 2-3 days | #backend #ai #pgvector |
   ```

3. **Update this CONTEXT.md if you discover:**
   - Better caching strategies
   - OpenAI API optimizations
   - pgvector performance tuning
   - Similarity threshold adjustments

4. **When block complete:**
   - Change status to ✅ Completed in PROJECT-STATUS.md
   - Update "Overall Progress" section
   - Add note: "Block D complete - semantic similarity search ready for Block E matching engine"

---

**Last Updated:** 2026-01-06
**Status:** Ready for development
**Blocking:** BLOCK-E (Matching Engine needs embeddings for semantic matching)
**Blocked by:** BLOCK-C (needs SkillEmbedding model)
