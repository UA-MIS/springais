# SpringAIS LLM Integration Guide

**Last Updated:** 2026-01-06
**Provider:** OpenAI
**Models Used:** GPT-5.2 Instant (skill extraction), text-embedding-3-large (semantic matching)

---

## Overview

SpringAIS uses OpenAI's API for two critical functions:

1. **Skill Extraction** - GPT-5.2 Instant parses resumes and extracts structured skill data
2. **Semantic Matching** - text-embedding-3-large creates 3072-D vectors for similarity search

This document covers API integration patterns, prompts, error handling, and cost optimization.

---

## OpenAI API Setup

### API Key Configuration

```python
# backend/.env
OPENAI_API_KEY=sk-proj-...your-key-here...
OPENAI_ORG_ID=org-...your-org... (optional)
```

### SDK Initialization

```python
# backend/app/services/openai_client.py
from openai import OpenAI
import os

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    organization=os.getenv("OPENAI_ORG_ID"),  # Optional
    timeout=30.0,  # 30 second timeout
    max_retries=3  # Retry on transient errors
)
```

**Implemented In:** Block D (Vector Embeddings), Block G (Skill Extraction)

---

## Skill Extraction with GPT-5.2

### Use Case

Extract structured skills from unstructured resume text (PDF/DOCX).

**Input:** Raw resume text (2-10 pages)
**Output:** JSON array of skills with proficiency levels

### System Prompt

```python
SKILL_EXTRACTION_SYSTEM_PROMPT = """
You are an expert HR skills analyst. Your job is to extract technical and soft skills from resumes.

Instructions:
1. Extract ALL skills mentioned in the resume (technical, soft, domain-specific)
2. Assign proficiency level based on context clues:
   - Beginner: "Familiar with", "Basic knowledge", <1 year experience
   - Intermediate: "Proficient in", "Working knowledge", 1-3 years
   - Advanced: "Expert in", "Strong skills in", 3-5 years
   - Expert: "Deep expertise", "Led projects using", 5+ years
3. Normalize skill names:
   - "Python programming" → "Python"
   - "ML/AI" → "Machine Learning"
   - "JavaScript (React)" → "JavaScript" and "React" (separate skills)
4. Return ONLY valid JSON. No markdown, no explanations.

Output format:
{
  "skills": [
    {
      "name": "Python",
      "proficiency": "Expert",
      "years_experience": 5,
      "confidence": 0.95
    }
  ]
}
"""
```

### API Call

```python
# backend/app/services/skill_extraction_service.py
from app.services.openai_client import client

def extract_skills_from_resume(resume_text: str) -> list[dict]:
    """
    Extract skills from resume using GPT-5.2 Instant.

    Args:
        resume_text: Full resume text (2000-10000 words)

    Returns:
        List of skill dicts: [{"name": "Python", "proficiency": "Expert", ...}]

    Raises:
        OpenAIError: If API call fails after retries
    """
    try:
        response = client.chat.completions.create(
            model="gpt-5.2-chat-latest",  # Most capable model
            messages=[
                {"role": "system", "content": SKILL_EXTRACTION_SYSTEM_PROMPT},
                {"role": "user", "content": f"Extract skills from this resume:\n\n{resume_text}"}
            ],
            response_format={"type": "json_object"},  # Force JSON output
            temperature=0.1,  # Low temperature for consistent extraction
            max_tokens=2000,  # ~150 skills max
            timeout=30.0
        )

        result = json.loads(response.choices[0].message.content)
        skills = result.get("skills", [])

        # Validate each skill
        validated_skills = []
        for skill in skills:
            if "name" in skill and "proficiency" in skill:
                validated_skills.append({
                    "name": skill["name"],
                    "proficiency": skill["proficiency"],
                    "years_experience": skill.get("years_experience", 0),
                    "confidence": skill.get("confidence", 0.8)
                })

        return validated_skills

    except Exception as e:
        logger.error(f"Skill extraction failed: {e}")
        raise
```

### Example Input/Output

**Input Resume (excerpt):**
```
SKILLS
------
- Python (5+ years): Built production ML pipelines using TensorFlow and PyTorch
- SQL (4 years): Optimized complex queries, designed database schemas
- Machine Learning: Developed NLP models, deployed to production
- Leadership: Led team of 3 engineers on AI modernization project
```

**API Response:**
```json
{
  "skills": [
    {
      "name": "Python",
      "proficiency": "Expert",
      "years_experience": 5,
      "confidence": 0.95
    },
    {
      "name": "TensorFlow",
      "proficiency": "Advanced",
      "years_experience": 3,
      "confidence": 0.88
    },
    {
      "name": "PyTorch",
      "proficiency": "Advanced",
      "years_experience": 3,
      "confidence": 0.88
    },
    {
      "name": "SQL",
      "proficiency": "Advanced",
      "years_experience": 4,
      "confidence": 0.92
    },
    {
      "name": "Machine Learning",
      "proficiency": "Advanced",
      "years_experience": 3,
      "confidence": 0.90
    },
    {
      "name": "Natural Language Processing",
      "proficiency": "Intermediate",
      "years_experience": 2,
      "confidence": 0.75
    },
    {
      "name": "Leadership",
      "proficiency": "Advanced",
      "years_experience": 5,
      "confidence": 0.85
    }
  ]
}
```

### Cost Optimization

**Prompt Tokens:**
- System prompt: ~300 tokens
- Resume text: ~2,000-5,000 tokens (2-5 pages)
- **Total input: ~2,500 tokens**

**Completion Tokens:**
- Skill JSON: ~500-1,000 tokens (~50-100 skills)
- **Total output: ~800 tokens**

**Cost Per Resume (GPT-5.2 Instant):**
- Input: 2,500 tokens × $3.00 / 1M = $0.0075
- Output: 800 tokens × $15.00 / 1M = $0.012
- **Total: ~$0.02 per resume**

**For 900 employees:** 900 × $0.02 = **$18 total**

### Caching Strategy

**Redis Cache:**
- Key: `skill_extraction:{sha256_hash_of_resume_text}`
- TTL: 24 hours
- Cache hit rate: ~60% (employees re-upload same resume)

**Savings:**
- First upload: $0.02 (API call)
- Subsequent uploads: $0 (cache hit)
- **Effective cost: ~$0.008 per resume**

```python
# backend/app/services/skill_extraction_service.py
import hashlib
import redis

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def extract_skills_with_cache(resume_text: str) -> list[dict]:
    # Generate cache key
    text_hash = hashlib.sha256(resume_text.encode()).hexdigest()
    cache_key = f"skill_extraction:{text_hash}"

    # Check cache
    cached_result = redis_client.get(cache_key)
    if cached_result:
        logger.info(f"Cache hit for {cache_key}")
        return json.loads(cached_result)

    # Cache miss - call API
    skills = extract_skills_from_resume(resume_text)

    # Store in cache (24 hour TTL)
    redis_client.setex(cache_key, 86400, json.dumps(skills))

    return skills
```

**Implemented In:** Block G (Skill Extraction)

---

## Vector Embeddings with text-embedding-3-large

### Use Case

Generate 3072-D vector representations of skills for semantic matching.

**Input:** Concatenated skill string (e.g., "Python, SQL, Machine Learning, Leadership")
**Output:** 3072-D float vector

### API Call

```python
# backend/app/services/embedding_service.py
from app.services.openai_client import client
import numpy as np

def generate_embedding(text: str) -> list[float]:
    """
    Generate 3072-D embedding vector for text.

    Args:
        text: Input text (e.g., skill list)

    Returns:
        List of 3072 floats (normalized to unit length)

    Raises:
        OpenAIError: If API call fails
    """
    try:
        response = client.embeddings.create(
            model="text-embedding-3-large",
            input=text,
            encoding_format="float"
        )

        embedding = response.data[0].embedding

        # Verify dimension
        assert len(embedding) == 3072, f"Expected 3072-D, got {len(embedding)}"

        return embedding

    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        raise
```

### Skill Text Formatting

**For Employees:**
```python
def format_employee_skills_for_embedding(employee_id: int) -> str:
    """
    Concatenate employee skills into embedding-friendly text.

    Format: "Skill1 (Expert, 5y), Skill2 (Advanced, 3y), ..."
    """
    skills = db.query(EmployeeSkill).filter_by(employee_id=employee_id).all()

    skill_parts = []
    for skill in skills:
        years = skill.years_experience or 0
        proficiency = skill.proficiency or "Intermediate"
        skill_parts.append(f"{skill.skill_name} ({proficiency}, {years}y)")

    return ", ".join(skill_parts)

# Example output:
# "Python (Expert, 5y), SQL (Advanced, 4y), Machine Learning (Advanced, 3y)"
```

**For Job Postings:**
```python
def format_job_posting_for_embedding(job_id: int) -> str:
    """
    Concatenate job title + description + required skills.
    """
    job = db.query(JobPosting).filter_by(id=job_id).first()
    skills = db.query(JobPostingSkill).filter_by(job_posting_id=job_id).all()

    parts = [
        f"Title: {job.title}",
        f"Description: {job.description[:500]}",  # First 500 chars
        f"Required skills: {', '.join([s.skill_name for s in skills])}"
    ]

    return " | ".join(parts)

# Example output:
# "Title: Senior AI Engineer | Description: We are seeking... | Required skills: Python, TensorFlow, Kubernetes"
```

### Cost Optimization

**Cost Per Embedding (text-embedding-3-large):**
- Input: ~100 tokens (skill list)
- Cost: 100 tokens × $0.13 / 1M = **$0.000013 per embedding**

**For 900 employees:**
- 900 × $0.000013 = **$0.012 total**

**For 50 job postings:**
- 50 × $0.000013 = **$0.0007 total**

**Total embedding cost: ~$0.02** (negligible)

### Batch Processing

```python
# backend/app/services/embedding_service.py
def generate_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for multiple texts in a single API call.

    OpenAI allows up to 2048 inputs per batch.
    Cost savings: Single API call overhead instead of N calls.
    """
    response = client.embeddings.create(
        model="text-embedding-3-large",
        input=texts,  # List of strings
        encoding_format="float"
    )

    embeddings = [data.embedding for data in response.data]
    return embeddings

# Example usage:
employee_texts = [format_employee_skills_for_embedding(id) for id in range(1, 901)]
embeddings = generate_embeddings_batch(employee_texts)  # Single API call for 900 employees
```

**Implemented In:** Block D (Vector Embeddings)

---

## Error Handling

### Retry Logic with Exponential Backoff

```python
# backend/app/services/openai_client.py
import time
from openai import OpenAI, OpenAIError, RateLimitError, APITimeoutError

def call_openai_with_retry(api_call_func, max_retries=5, initial_delay=1.0):
    """
    Call OpenAI API with exponential backoff retry.

    Args:
        api_call_func: Lambda function that calls OpenAI API
        max_retries: Max retry attempts
        initial_delay: Initial delay in seconds

    Returns:
        API response

    Raises:
        OpenAIError: If all retries fail
    """
    for attempt in range(max_retries):
        try:
            return api_call_func()

        except RateLimitError as e:
            # 429 Rate Limit - wait and retry
            delay = initial_delay * (2 ** attempt)  # Exponential backoff
            logger.warning(f"Rate limit hit. Retrying in {delay}s (attempt {attempt + 1}/{max_retries})")
            time.sleep(delay)

        except APITimeoutError as e:
            # Timeout - retry with same delay
            logger.warning(f"API timeout. Retrying (attempt {attempt + 1}/{max_retries})")
            time.sleep(initial_delay)

        except OpenAIError as e:
            # Other errors - log and re-raise
            logger.error(f"OpenAI API error: {e}")
            raise

    raise OpenAIError("Max retries exceeded")

# Example usage:
skills = call_openai_with_retry(
    lambda: extract_skills_from_resume(resume_text),
    max_retries=5,
    initial_delay=2.0
)
```

### Graceful Degradation

```python
# backend/app/api/routes/skill_extraction.py
from fastapi import HTTPException

@router.post("/skill-extraction")
async def extract_skills_endpoint(file: UploadFile):
    try:
        # Parse resume text
        resume_text = parse_pdf_or_docx(file)

        # Extract skills (with retry logic)
        skills = extract_skills_with_cache(resume_text)

        # Generate embedding (with retry logic)
        embedding = generate_embedding(format_skills_for_embedding(skills))

        return {
            "skills": skills,
            "embedding_created": True
        }

    except OpenAIError as e:
        # OpenAI API failure - return partial results
        logger.error(f"OpenAI API failed: {e}")
        return {
            "skills": [],
            "embedding_created": False,
            "error": "AI service temporarily unavailable. Please try again later.",
            "retry_after": 60
        }

    except Exception as e:
        # Unexpected error
        logger.exception(f"Skill extraction failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
```

---

## Rate Limiting

### OpenAI Rate Limits (as of 2026)

| Model | Requests/min | Tokens/min |
|-------|--------------|------------|
| gpt-5.2 | 10,000 | 10M |
| text-embedding-3-large | 10,000 | 10M |

**Our Usage:**
- Skill extraction: ~50 requests/day during testing
- Embeddings: ~950 requests once (initial data load)
- **Well within limits**

### Local Rate Limiting (Optional)

```python
# backend/app/middleware/rate_limit.py
from fastapi import Request, HTTPException
import redis
import time

redis_client = redis.Redis(host='localhost', port=6379, db=0)

async def rate_limit_middleware(request: Request, call_next):
    """
    Rate limit: 10 skill extractions per user per hour.
    """
    if request.url.path == "/api/skill-extraction":
        user_id = request.state.user_id  # From JWT
        rate_limit_key = f"rate_limit:skill_extraction:{user_id}"

        # Increment counter
        count = redis_client.incr(rate_limit_key)
        if count == 1:
            redis_client.expire(rate_limit_key, 3600)  # 1 hour TTL

        # Check limit
        if count > 10:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Try again in 1 hour.",
                headers={"Retry-After": "3600"}
            )

    return await call_next(request)
```

---

## Monitoring & Logging

### Log OpenAI API Calls

```python
# backend/app/services/openai_client.py
import logging
import time

logger = logging.getLogger(__name__)

def log_api_call(model: str, input_tokens: int, output_tokens: int, duration: float, cost: float):
    """
    Log OpenAI API call metrics.
    """
    logger.info(
        f"OpenAI API call | "
        f"model={model} | "
        f"input_tokens={input_tokens} | "
        f"output_tokens={output_tokens} | "
        f"duration={duration:.2f}s | "
        f"cost=${cost:.4f}"
    )

# Example usage:
start = time.time()
response = client.chat.completions.create(...)
duration = time.time() - start

input_tokens = response.usage.prompt_tokens
output_tokens = response.usage.completion_tokens
cost = (input_tokens * 3.00 / 1e6) + (output_tokens * 15.00 / 1e6)

log_api_call("gpt-5.2", input_tokens, output_tokens, duration, cost)
```

### Cost Tracking Dashboard (Future)

**Store in PostgreSQL:**
```sql
CREATE TABLE openai_api_usage (
    id SERIAL PRIMARY KEY,
    model VARCHAR(50),
    endpoint VARCHAR(100),  -- skill_extraction, embedding, etc.
    input_tokens INTEGER,
    output_tokens INTEGER,
    cost_usd DECIMAL(10, 6),
    duration_seconds DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Query total cost
SELECT SUM(cost_usd) AS total_cost FROM openai_api_usage;

-- Query cost per model
SELECT model, SUM(cost_usd) AS cost FROM openai_api_usage GROUP BY model;
```

---

## Testing Strategies

### Mock OpenAI API for Tests

```python
# backend/tests/test_skill_extraction.py
import pytest
from unittest.mock import patch, MagicMock

@pytest.fixture
def mock_openai_client():
    with patch("app.services.openai_client.client") as mock:
        # Mock chat.completions.create
        mock_response = MagicMock()
        mock_response.choices[0].message.content = json.dumps({
            "skills": [
                {"name": "Python", "proficiency": "Expert", "confidence": 0.95}
            ]
        })
        mock.chat.completions.create.return_value = mock_response

        yield mock

def test_extract_skills(mock_openai_client):
    resume_text = "Experienced Python developer with 5 years..."
    skills = extract_skills_from_resume(resume_text)

    assert len(skills) == 1
    assert skills[0]["name"] == "Python"
    assert skills[0]["proficiency"] == "Expert"
```

### Integration Test with Real API

```python
# backend/tests/integration/test_openai_integration.py
import pytest
import os

@pytest.mark.skipif(
    not os.getenv("RUN_INTEGRATION_TESTS"),
    reason="Integration tests disabled (set RUN_INTEGRATION_TESTS=1)"
)
def test_real_skill_extraction():
    """
    Test real OpenAI API call.
    Only run when explicitly enabled (costs $0.02).
    """
    resume_text = "Python developer with 5 years experience in TensorFlow and PyTorch..."
    skills = extract_skills_from_resume(resume_text)

    assert len(skills) > 0
    assert any(s["name"] == "Python" for s in skills)
```

**Run integration tests:**
```bash
RUN_INTEGRATION_TESTS=1 pytest backend/tests/integration/
```

---

## Cost Tracking Summary

### 8-Week MVP Cost Breakdown

| Operation | Count | Cost Per | Total |
|-----------|-------|----------|-------|
| Skill extraction (initial) | 900 resumes | $0.02 | $18.00 |
| Skill extraction (testing) | 50 resumes | $0.02 | $1.00 |
| Employee embeddings | 900 | $0.00001 | $0.01 |
| Job posting embeddings | 50 | $0.00001 | $0.0005 |
| **Total** | | | **~$19** |

**With caching (60% hit rate):**
- Effective skill extraction cost: $18 × 0.4 = **$7.20**
- **Total with caching: ~$8**

---

## Related Documentation

**Backend:**
- `reference-docs/backend/api-reference.md` - Skill extraction API endpoint
- `reference-docs/backend/database-schema.md` - employee_embeddings table

**Architecture:**
- `reference-docs/architecture/data-flow.md` - Skill extraction flow diagram

**Implementation:**
- `implementation-tracking/STEP-2-DEVELOPMENT/BLOCK-G-SKILL-EXTRACTION/` - Skill extraction implementation
- `implementation-tracking/STEP-2-DEVELOPMENT/BLOCK-D-VECTOR-EMBEDDINGS/` - Embedding generation

---

**Document Purpose:** OpenAI API integration patterns and best practices
**Audience:** Backend developers working on LLM features
**Last Updated:** 2026-01-06
