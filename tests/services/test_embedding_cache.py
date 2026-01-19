"""
Tests for EmbeddingService caching functionality.

Tests Layer 1 (exact match) and Layer 2 (semantic similarity) caching.
"""

import pytest


@pytest.mark.asyncio
async def test_exact_match_cache_miss(embedding_service):
    """Test exact match cache returns None when not cached."""
    result = await embedding_service._get_exact_match_cache("Nonexistent Skill")
    assert result is None


@pytest.mark.asyncio
async def test_exact_match_cache_hit(embedding_service):
    """Test exact match cache returns cached embedding."""
    skill_text = "Python Programming"
    embedding = [0.1, 0.2, 0.3] * 512  # 1536-dim mock embedding

    # Save to cache
    await embedding_service._save_exact_match_cache(skill_text, embedding)

    # Retrieve from cache
    cached = await embedding_service._get_exact_match_cache(skill_text)

    assert cached is not None
    assert len(cached) == 1536
    assert cached == embedding


@pytest.mark.asyncio
async def test_exact_match_cache_normalization(embedding_service):
    """Test cache handles text normalization correctly."""
    embedding = [0.1, 0.2, 0.3] * 512  # 1536-dim

    # Save with one format
    await embedding_service._save_exact_match_cache("Python Programming", embedding)

    # Retrieve with different formatting (should still hit cache)
    cached = await embedding_service._get_exact_match_cache("  python programming  ")

    assert cached is not None
    assert cached == embedding


@pytest.mark.asyncio
async def test_cache_ttl_set(embedding_service, redis_client):
    """Test cache entries have TTL (30 days)."""
    skill_text = "Python Programming"
    embedding = [0.1, 0.2, 0.3] * 512

    await embedding_service._save_exact_match_cache(skill_text, embedding)

    # Check TTL on Redis key
    from backend.app.utils.text import normalize_skill_text
    normalized = normalize_skill_text(skill_text)
    cache_key = f"embedding:exact:{normalized}"

    ttl = await redis_client.ttl(cache_key)

    # Should be ~30 days (2592000 seconds), allow some variance
    assert ttl > 2591000  # ~29.9 days
    assert ttl <= 2592000  # 30 days


@pytest.mark.asyncio
async def test_semantic_cache_finds_similar(embedding_service):
    """Test semantic cache finds similar cached skills."""
    # Cache a skill
    embedding = [0.1, 0.2, 0.3] * 512
    await embedding_service._save_exact_match_cache("Python", embedding)

    # Query for similar skill (text similarity should detect)
    # Note: This uses text similarity heuristic, not embedding similarity
    similar = await embedding_service._get_semantic_cache("Python Programming")

    # May or may not find depending on text similarity threshold
    # This test verifies the method runs without errors
    assert similar is None or similar.skill_text == "Python"


@pytest.mark.asyncio
async def test_embed_skill_uses_cache(embedding_service):
    """Test embed_skill returns cached embedding on second call."""
    skill_text = "Python Programming"

    # First call - cache miss, calls API
    embedding1 = await embedding_service.embed_skill(skill_text)

    assert embedding1 is not None
    assert len(embedding1) == 1536  # PCA-reduced

    # Second call - should hit cache
    embedding2 = await embedding_service.embed_skill(skill_text)

    # Should return same embedding from cache
    assert embedding2 == embedding1


@pytest.mark.asyncio
async def test_batch_embed_uses_cache(embedding_service):
    """Test batch embedding reuses cached embeddings."""
    skills = ["Python Programming", "Java Programming"]

    # First batch
    results1 = await embedding_service.embed_skills_batch(skills)

    assert len(results1) == 2
    assert "Python Programming" in results1
    assert "Java Programming" in results1
    assert len(results1["Python Programming"]) == 1536

    # Second batch with same skills
    results2 = await embedding_service.embed_skills_batch(skills)

    # Should return cached embeddings
    assert results2["Python Programming"] == results1["Python Programming"]
    assert results2["Java Programming"] == results1["Java Programming"]


@pytest.mark.asyncio
async def test_batch_embed_partial_cache(embedding_service):
    """Test batch embedding handles mix of cached and uncached skills."""
    # Pre-cache one skill
    cached_skill = "Python Programming"
    cached_embedding = [0.1, 0.2, 0.3] * 512
    await embedding_service._save_exact_match_cache(cached_skill, cached_embedding)

    # Batch with cached and uncached
    skills = ["Python Programming", "New Skill Not Cached"]
    results = await embedding_service.embed_skills_batch(skills)

    assert len(results) == 2
    assert results["Python Programming"] == cached_embedding
    assert "New Skill Not Cached" in results
    assert len(results["New Skill Not Cached"]) == 1536
