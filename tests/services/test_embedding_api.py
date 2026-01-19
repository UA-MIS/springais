"""
Tests for EmbeddingService OpenAI API integration.

Tests API calls, batch processing, retry logic, and error handling.
"""

import pytest
from unittest.mock import AsyncMock, patch
from openai import RateLimitError, APIError


@pytest.mark.asyncio
async def test_call_openai_single_skill(embedding_service):
    """Test calling OpenAI API for single skill returns 3072-dim embedding."""
    skill_text = "Python Programming"

    embedding = await embedding_service._call_openai(skill_text)

    assert embedding is not None
    assert isinstance(embedding, list)
    assert len(embedding) == 3072  # Full OpenAI embedding before PCA
    assert all(isinstance(x, (int, float)) for x in embedding)


@pytest.mark.asyncio
async def test_call_openai_batch_skills(embedding_service):
    """Test batch API call returns embeddings for all skills."""
    skills = ["Python Programming", "Java Programming", "AWS"]

    results = await embedding_service._call_openai_batch(skills)

    assert results is not None
    assert isinstance(results, dict)
    assert len(results) == 3

    for skill in skills:
        assert skill in results
        assert len(results[skill]) == 3072


@pytest.mark.asyncio
async def test_call_openai_batch_validates_size(embedding_service):
    """Test batch call rejects batches > 100 skills."""
    too_many_skills = [f"Skill {i}" for i in range(101)]

    with pytest.raises(ValueError, match="exceeds maximum of 100"):
        await embedding_service._call_openai_batch(too_many_skills)


@pytest.mark.asyncio
async def test_call_openai_batch_empty(embedding_service):
    """Test batch call with empty list returns empty dict."""
    results = await embedding_service._call_openai_batch([])

    assert results == {}


@pytest.mark.asyncio
async def test_embed_skill_full_pipeline(embedding_service):
    """Test full embed_skill pipeline: API → PCA → cache."""
    skill_text = "Cloud Architecture"

    # First call (cache miss)
    embedding = await embedding_service.embed_skill(skill_text)

    # Verify embedding dimensions (should be PCA-reduced)
    assert embedding is not None
    assert len(embedding) == 1536  # PCA-reduced from 3072

    # Verify cached
    cached = await embedding_service._get_exact_match_cache(skill_text)
    assert cached == embedding


@pytest.mark.asyncio
async def test_batch_embed_skills_pipeline(embedding_service):
    """Test batch embedding pipeline processes all skills."""
    skills = ["Python", "Java", "AWS", "React"]

    results = await embedding_service.embed_skills_batch(skills)

    assert len(results) == 4

    for skill in skills:
        assert skill in results
        assert len(results[skill]) == 1536  # PCA-reduced


@pytest.mark.asyncio
async def test_batch_embed_large_batch(embedding_service):
    """Test batch embedding handles > 100 skills by chunking."""
    # Create 250 unique skills
    skills = [f"Skill {i}" for i in range(250)]

    results = await embedding_service.embed_skills_batch(skills)

    assert len(results) == 250

    for skill in skills:
        assert skill in results
        assert len(results[skill]) == 1536


@pytest.mark.asyncio
async def test_retry_on_rate_limit(embedding_service, mock_openai_client):
    """Test API retries on rate limit error."""
    # Make first call succeed, second call rate limit, third succeed
    call_count = [0]

    async def mock_create_with_rate_limit(**kwargs):
        call_count[0] += 1
        if call_count[0] == 1:
            # First call: rate limit error
            from unittest.mock import MagicMock
            mock_response = MagicMock()
            mock_response.status_code = 429
            raise RateLimitError(
                message="Rate limit exceeded",
                response=mock_response,
                body={"error": {"message": "Rate limit exceeded"}}
            )
        else:
            # Subsequent calls: succeed
            from unittest.mock import MagicMock
            import numpy as np

            mock_embedding = MagicMock()
            mock_embedding.embedding = np.random.rand(3072).tolist()
            mock_embedding.index = 0

            mock_response = MagicMock()
            mock_response.data = [mock_embedding]
            return mock_response

    mock_openai_client.embeddings.create = AsyncMock(side_effect=mock_create_with_rate_limit)

    # Should retry and succeed
    embedding = await embedding_service._call_openai("Test Skill")

    assert embedding is not None
    assert len(embedding) == 3072
    assert call_count[0] == 2  # Initial call + 1 retry


@pytest.mark.asyncio
async def test_retry_exhaustion_raises_error(embedding_service, mock_openai_client):
    """Test API raises error after max retries exceeded."""

    async def mock_create_always_fails(**kwargs):
        from unittest.mock import MagicMock
        mock_response = MagicMock()
        mock_response.status_code = 429
        raise RateLimitError(
            message="Rate limit exceeded",
            response=mock_response,
            body={"error": {"message": "Rate limit exceeded"}}
        )

    mock_openai_client.embeddings.create = AsyncMock(side_effect=mock_create_always_fails)

    # Should fail after max retries (3)
    with pytest.raises(Exception, match="Rate limit exceeded after"):
        await embedding_service._call_openai("Test Skill")


@pytest.mark.asyncio
async def test_api_error_retry(embedding_service, mock_openai_client):
    """Test API retries on generic API errors."""
    call_count = [0]

    async def mock_create_with_api_error(**kwargs):
        call_count[0] += 1
        if call_count[0] == 1:
            from unittest.mock import MagicMock
            mock_request = MagicMock()
            raise APIError(
                message="API error",
                request=mock_request,
                body={"error": {"message": "API error"}}
            )
        else:
            from unittest.mock import MagicMock
            import numpy as np

            mock_embedding = MagicMock()
            mock_embedding.embedding = np.random.rand(3072).tolist()
            mock_embedding.index = 0

            mock_response = MagicMock()
            mock_response.data = [mock_embedding]
            return mock_response

    mock_openai_client.embeddings.create = AsyncMock(side_effect=mock_create_with_api_error)

    # Should retry and succeed
    embedding = await embedding_service._call_openai("Test Skill")

    assert embedding is not None
    assert call_count[0] == 2  # Initial + 1 retry
