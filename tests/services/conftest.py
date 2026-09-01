"""
Pytest fixtures for embedding service tests.

Provides mock clients and service instances for testing.
"""

import pytest
import pytest_asyncio
import numpy as np
from unittest.mock import AsyncMock, MagicMock, patch
from openai.types.create_embedding_response import CreateEmbeddingResponse, Embedding
from openai.types import CreateEmbeddingResponse as CreateEmbeddingResponseType
import fakeredis.aioredis as fakeredis
from sklearn.decomposition import PCA


# Mock OpenAI embeddings for testing
MOCK_EMBEDDINGS = {
    "Python Programming": np.random.rand(3072).tolist(),
    "Python Development": np.random.rand(3072).tolist(),
    "Java Programming": np.random.rand(3072).tolist(),
    "Tax Law": np.random.rand(3072).tolist(),
    "AWS": np.random.rand(3072).tolist(),
    "Cloud Architecture": np.random.rand(3072).tolist(),
}


@pytest_asyncio.fixture
async def redis_client():
    """Fake Redis client for testing."""
    client = await fakeredis.FakeRedis()
    yield client
    await client.flushall()
    await client.close()


@pytest.fixture(scope="session")
def mock_pca_model():
    """
    Mock PCA model that reduces 3072 -> 1536 dimensions.

    Session-scoped because fitting a 1536-component PCA on a 2000x3072 matrix
    costs 20-90 SECONDS, and this was previously refit for every test that
    touched it - which is why the suite took over half an hour and why nobody
    ran it. The model is only ever read (``transform``) by tests, never
    mutated, so a single fit is safe to share.
    """
    pca = PCA(n_components=1536, random_state=42)

    # Generate fake training data and fit
    fake_data = np.random.rand(2000, 3072)
    pca.fit(fake_data)

    return pca


@pytest.fixture
def mock_openai_client():
    """Mock OpenAI client that returns fake embeddings."""
    client = MagicMock()

    async def mock_create(**kwargs):
        """Mock embeddings.create() method."""
        input_text = kwargs.get("input")

        # Handle single input
        if isinstance(input_text, str):
            if input_text in MOCK_EMBEDDINGS:
                embedding = MOCK_EMBEDDINGS[input_text]
            else:
                # Generate random embedding for unknown text
                embedding = np.random.rand(3072).tolist()

            # Create mock response
            mock_embedding = MagicMock()
            mock_embedding.embedding = embedding
            mock_embedding.index = 0

            mock_response = MagicMock()
            mock_response.data = [mock_embedding]
            mock_response.model = "text-embedding-3-large"
            mock_response.usage = MagicMock(total_tokens=100)

            return mock_response

        # Handle batch input (list)
        elif isinstance(input_text, list):
            embeddings = []
            for i, text in enumerate(input_text):
                if text in MOCK_EMBEDDINGS:
                    embedding = MOCK_EMBEDDINGS[text]
                else:
                    embedding = np.random.rand(3072).tolist()

                mock_embedding = MagicMock()
                mock_embedding.embedding = embedding
                mock_embedding.index = i
                embeddings.append(mock_embedding)

            mock_response = MagicMock()
            mock_response.data = embeddings
            mock_response.model = "text-embedding-3-large"
            mock_response.usage = MagicMock(total_tokens=len(input_text) * 100)

            return mock_response

    client.embeddings.create = AsyncMock(side_effect=mock_create)

    return client


@pytest.fixture
def mock_db_session():
    """Mock SQLAlchemy database session."""
    session = MagicMock()
    return session


@pytest_asyncio.fixture
async def embedding_service(mock_openai_client, redis_client, mock_db_session, mock_pca_model):
    """EmbeddingService instance with mocked dependencies."""
    from app.services.embedding_service import EmbeddingService

    # Patch PCA loader to return mock PCA
    with patch('app.services.embedding_service.load_pca_model_safe') as mock_loader:
        from app.utils.pca_loader import PCAMetadata

        mock_metadata = PCAMetadata(
            version="v1",
            n_components=1536,
            input_dimensions=3072,
            explained_variance_ratio=0.96,
            training_samples=2000,
            random_state=42,
            openai_model="text-embedding-3-large",
            created_at="2026-01-15T10:00:00Z"
        )

        mock_loader.return_value = (mock_pca_model, mock_metadata)

        service = EmbeddingService(
            openai_client=mock_openai_client,
            redis_client=redis_client,
            db_session=mock_db_session
        )

    return service


@pytest.fixture
def sample_skills():
    """Sample skills for testing."""
    return [
        "Python Programming",
        "Python Development",
        "Java Programming",
        "Tax Law",
        "AWS",
        "Cloud Architecture",
    ]
