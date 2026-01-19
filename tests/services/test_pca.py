"""
Tests for PCA dimensionality reduction functionality.

Tests PCA model loading, transformation, and similarity preservation.
"""

import pytest
import numpy as np
from backend.app.utils.pca_loader import load_pca_model, PCAModelNotFoundError


def test_pca_model_exists():
    """Test PCA model file exists and can be loaded."""
    try:
        pca, metadata = load_pca_model("v1")

        assert pca is not None
        assert metadata is not None
        assert metadata.version == "v1"
        assert metadata.n_components == 1536
        assert metadata.input_dimensions == 3072
        assert metadata.explained_variance_ratio > 0.95  # At least 95% variance

    except PCAModelNotFoundError:
        pytest.skip("PCA model not trained yet - run scripts/train_pca_model.py")


def test_pca_reduces_dimensions(embedding_service):
    """Test PCA reduces 3072 dimensions to 1536."""
    # Create mock 3072-dim embedding
    full_embedding = np.random.rand(3072).tolist()

    # Apply PCA reduction
    reduced = embedding_service._apply_pca(full_embedding)

    assert reduced is not None
    assert len(reduced) == 1536
    assert all(isinstance(x, (int, float)) for x in reduced)


def test_pca_validates_input_dimensions(embedding_service):
    """Test PCA rejects wrong input dimensions."""
    wrong_size_embedding = [0.1] * 1000  # Wrong size

    with pytest.raises(ValueError, match="Expected 3072-dim embedding"):
        embedding_service._apply_pca(wrong_size_embedding)


def test_pca_preserves_similarity(embedding_service):
    """Test PCA-reduced embeddings preserve relative similarity."""
    # Create two similar mock embeddings
    np.random.seed(42)
    base_embedding = np.random.rand(3072)

    # Create similar embedding (base + small noise)
    similar_embedding = base_embedding + np.random.rand(3072) * 0.1

    # Create dissimilar embedding
    dissimilar_embedding = np.random.rand(3072)

    # Apply PCA to all
    reduced_base = embedding_service._apply_pca(base_embedding.tolist())
    reduced_similar = embedding_service._apply_pca(similar_embedding.tolist())
    reduced_dissimilar = embedding_service._apply_pca(dissimilar_embedding.tolist())

    # Calculate cosine similarities
    def cosine_similarity(a, b):
        a_array = np.array(a)
        b_array = np.array(b)
        return np.dot(a_array, b_array) / (np.linalg.norm(a_array) * np.linalg.norm(b_array))

    sim_base_similar = cosine_similarity(reduced_base, reduced_similar)
    sim_base_dissimilar = cosine_similarity(reduced_base, reduced_dissimilar)

    # Similar embeddings should have higher similarity than dissimilar
    assert sim_base_similar > sim_base_dissimilar


def test_pca_handles_batch(embedding_service):
    """Test PCA can process multiple embeddings."""
    # Create batch of embeddings
    embeddings = [np.random.rand(3072).tolist() for _ in range(10)]

    # Apply PCA to all
    reduced_embeddings = [embedding_service._apply_pca(emb) for emb in embeddings]

    assert len(reduced_embeddings) == 10

    for reduced in reduced_embeddings:
        assert len(reduced) == 1536


@pytest.mark.asyncio
async def test_embed_skill_applies_pca(embedding_service):
    """Test embed_skill returns PCA-reduced embeddings."""
    skill_text = "Machine Learning"

    embedding = await embedding_service.embed_skill(skill_text)

    # Should be PCA-reduced to 1536 dims
    assert len(embedding) == 1536


@pytest.mark.asyncio
async def test_batch_embed_applies_pca(embedding_service):
    """Test batch embedding applies PCA to all embeddings."""
    skills = ["Python", "Java", "AWS"]

    results = await embedding_service.embed_skills_batch(skills)

    for skill, embedding in results.items():
        assert len(embedding) == 1536  # All PCA-reduced


def test_pca_without_model_fallback(mock_openai_client, redis_client, mock_db_session):
    """Test EmbeddingService works without PCA model (returns full 3072 dims)."""
    from backend.app.services.embedding_service import EmbeddingService
    from unittest.mock import patch

    # Patch PCA loader to return None (model not found)
    with patch('backend.app.services.embedding_service.load_pca_model_safe', return_value=None):
        service = EmbeddingService(
            openai_client=mock_openai_client,
            redis_client=redis_client,
            db_session=mock_db_session
        )

        # PCA should not be loaded
        assert service.pca is None

        # Applying PCA should return original embedding
        full_embedding = [0.1] * 3072
        result = service._apply_pca(full_embedding)

        assert result == full_embedding  # No reduction
        assert len(result) == 3072


def test_pca_metadata_correct():
    """Test PCA metadata contains expected information."""
    try:
        pca, metadata = load_pca_model("v1")

        assert metadata.version == "v1"
        assert metadata.n_components == 1536
        assert metadata.input_dimensions == 3072
        assert metadata.training_samples >= 1536  # Need at least n_components samples
        assert metadata.random_state == 42
        assert metadata.openai_model == "text-embedding-3-large"
        assert metadata.explained_variance_ratio >= 0.95  # 95%+ variance preserved
        assert metadata.created_at is not None

    except PCAModelNotFoundError:
        pytest.skip("PCA model not trained yet")


def test_pca_transform_reproducible(embedding_service):
    """Test PCA transformation is reproducible (same input → same output)."""
    embedding = np.random.rand(3072).tolist()

    # Transform twice
    reduced1 = embedding_service._apply_pca(embedding)
    reduced2 = embedding_service._apply_pca(embedding)

    # Should be identical
    assert reduced1 == reduced2
