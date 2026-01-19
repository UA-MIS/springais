"""
Embedding Service for generating and managing skill embeddings.

This service provides:
- Two-layer caching (exact match + semantic similarity)
- OpenAI text-embedding-3-large integration with PCA reduction
- pgvector similarity search
- Batch processing for cost optimization
"""

from typing import List, Dict, Optional, Tuple
import json
import asyncio
import numpy as np
from openai import AsyncOpenAI
from openai import RateLimitError, APIError
import redis.asyncio as redis
from sqlalchemy.orm import Session
import joblib
from ..utils.text import normalize_skill_text, calculate_cosine_similarity
from ..utils.pca_loader import load_pca_model_safe


class SimilarSkill:
    """Result from similarity search"""
    def __init__(self, skill_text: str, similarity: float):
        self.skill_text = skill_text
        self.similarity = similarity

    def __repr__(self):
        return f"SimilarSkill(skill_text='{self.skill_text}', similarity={self.similarity:.4f})"


class EmbeddingService:
    """
    Service for generating and managing skill embeddings.

    Features:
    - Two-layer Redis caching (exact match + semantic similarity)
    - OpenAI text-embedding-3-large (3072 dims)
    - PCA dimensionality reduction (3072 → 1536 dims)
    - pgvector HNSW similarity search
    - Batch processing for cost optimization
    """

    def __init__(
        self,
        openai_client: AsyncOpenAI,
        redis_client: redis.Redis,
        db_session: Session,
        pca_model_path: str = "backend/models/pca/pca_model_v1.pkl"
    ):
        """
        Initialize the EmbeddingService.

        Args:
            openai_client: AsyncOpenAI client for API calls
            redis_client: Redis client for caching
            db_session: SQLAlchemy database session
            pca_model_path: Path to trained PCA model
        """
        self.openai = openai_client
        self.redis = redis_client
        self.db = db_session
        self.pca_model_path = pca_model_path
        self.pca = None
        self.pca_metadata = None

        # Load PCA model and metadata
        result = load_pca_model_safe()
        if result:
            self.pca, self.pca_metadata = result
            print(f"[OK] Loaded PCA model: {self.pca_metadata.version}")
            print(f"     Components: {self.pca_metadata.n_components}")
            print(f"     Variance: {self.pca_metadata.explained_variance_ratio:.2%}")
        else:
            print("[WARNING] PCA model not found - embeddings will use full 3072 dimensions")
            print("          Run: python scripts/train_pca_model.py")

    async def embed_skill(self, skill_text: str) -> List[float]:
        """
        Embed a single skill with two-layer caching.

        Args:
            skill_text: The skill text to embed

        Returns:
            List of floats representing the 1536-dim embedding (PCA-reduced)

        Pipeline:
            1. Check exact match cache (Layer 1)
            2. Check semantic similarity cache (Layer 2)
            3. Call OpenAI API (Layer 3)
            4. Apply PCA reduction
            5. Save to cache
        """
        # Layer 1: Check exact match cache
        cached = await self._get_exact_match_cache(skill_text)
        if cached:
            return cached

        # Layer 2: Check semantic similarity cache
        similar = await self._get_semantic_cache(skill_text)
        if similar and hasattr(similar, 'embedding') and similar.similarity > 0.95:
            # Reuse similar embedding
            return similar.embedding

        # Layer 3: Call OpenAI API to get 3072-dim embedding
        full_embedding = await self._call_openai(skill_text)

        # Apply PCA reduction: 3072 → 1536
        reduced_embedding = self._apply_pca(full_embedding)

        # Save reduced embedding to cache (1536-dim)
        await self._save_exact_match_cache(skill_text, reduced_embedding)

        return reduced_embedding

    async def embed_skills_batch(self, skills: List[str]) -> Dict[str, List[float]]:
        """
        Embed multiple skills with batch processing.

        Args:
            skills: List of skill texts to embed

        Returns:
            Dictionary mapping skill_text to embedding vector

        Features:
            - Batch OpenAI API calls (100 skills per request)
            - Cache-aware (skips already cached skills)
            - PCA reduction applied to all embeddings
        """
        results = {}
        uncached = []

        # Check cache for all skills first
        for skill in skills:
            cached = await self._get_exact_match_cache(skill)
            if cached:
                results[skill] = cached
            else:
                uncached.append(skill)

        # If all cached, return early
        if not uncached:
            return results

        # Batch process uncached skills (100 at a time)
        batch_size = 100

        for i in range(0, len(uncached), batch_size):
            batch = uncached[i:i + batch_size]

            # Call OpenAI API for batch (returns 3072-dim embeddings)
            batch_full_embeddings = await self._call_openai_batch(batch)

            # Apply PCA reduction and save to cache
            for skill_text, full_embedding in batch_full_embeddings.items():
                # Apply PCA: 3072 → 1536
                reduced_embedding = self._apply_pca(full_embedding)

                # Save to cache
                await self._save_exact_match_cache(skill_text, reduced_embedding)

                # Add to results
                results[skill_text] = reduced_embedding

        return results

    async def find_similar_skills(
        self,
        query: str,
        top_n: int = 10
    ) -> List[SimilarSkill]:
        """
        Find skills semantically similar to the query using pgvector.

        Args:
            query: The query skill text
            top_n: Number of similar skills to return

        Returns:
            List of SimilarSkill objects sorted by similarity (highest first)

        Uses:
            - pgvector HNSW index for fast similarity search
            - Cosine distance operator (<=>)
        """
        # TODO: Implement in Task 12
        raise NotImplementedError("find_similar_skills() will be implemented in Phase 5")

    # ============================================
    # Private Helper Methods (Layer 1: Cache)
    # ============================================

    async def _get_exact_match_cache(self, skill_text: str) -> Optional[List[float]]:
        """
        Check Layer 1 cache (exact match) for cached embedding.

        Args:
            skill_text: The skill text to look up

        Returns:
            Cached embedding if found, None otherwise
        """
        # Normalize text for consistent lookup
        normalized = normalize_skill_text(skill_text)

        # Build cache key
        cache_key = f"embedding:exact:{normalized}"

        try:
            # Check Redis for cached embedding
            cached_data = await self.redis.get(cache_key)

            if cached_data:
                # Deserialize JSON data
                cache_entry = json.loads(cached_data)
                embedding = cache_entry.get("embedding")

                if embedding and isinstance(embedding, list):
                    return embedding

            return None

        except (json.JSONDecodeError, redis.RedisError) as e:
            # Log error but don't fail - just return None (cache miss)
            print(f"Cache lookup error for '{skill_text}': {e}")
            return None

    async def _save_exact_match_cache(
        self,
        skill_text: str,
        embedding: List[float]
    ) -> None:
        """
        Save embedding to Layer 1 cache (exact match).

        Args:
            skill_text: The skill text
            embedding: The embedding vector (1536-dim, PCA-reduced)
        """
        # Normalize text for consistent storage
        normalized = normalize_skill_text(skill_text)

        # Build cache key
        cache_key = f"embedding:exact:{normalized}"

        # Create cache entry with metadata
        cache_entry = {
            "embedding": embedding,
            "skill_text": skill_text,  # Store original text
            "normalized_text": normalized,
            "embedding_model": "text-embedding-3-large-pca",
            "dimensions": len(embedding)
        }

        try:
            # Serialize to JSON
            cache_data = json.dumps(cache_entry)

            # Save to Redis with 30-day TTL (2592000 seconds)
            await self.redis.set(cache_key, cache_data, ex=2592000)

        except (json.JSONEncodeError, redis.RedisError) as e:
            # Log error but don't fail the embedding operation
            print(f"Cache save error for '{skill_text}': {e}")

    # ============================================
    # Private Helper Methods (Layer 2: Semantic Cache)
    # ============================================

    async def _get_semantic_cache(self, skill_text: str) -> Optional[SimilarSkill]:
        """
        Check Layer 2 cache (semantic similarity) for similar cached skills.

        Strategy: Use text similarity heuristics to find potentially similar cached skills,
        then return their embeddings. Since we don't have the query embedding yet,
        we use text-based similarity as a proxy.

        Args:
            skill_text: The skill text to look up

        Returns:
            SimilarSkill if found with high text similarity, None otherwise
        """
        try:
            normalized_query = normalize_skill_text(skill_text)

            # Heuristic: Look for cached skills that are text-similar
            # 1. Exact substring matches
            # 2. Very similar normalized text (edit distance)

            # Scan cached embeddings (limit scan for performance)
            cursor = 0
            max_scans = 100  # Limit for performance
            scans = 0
            best_match = None
            best_score = 0.0

            while scans < max_scans:
                # Scan Redis keys matching pattern
                cursor, keys = await self.redis.scan(
                    cursor=cursor,
                    match="embedding:exact:*",
                    count=20
                )
                scans += 1

                for key in keys:
                    # Extract normalized text from key
                    # Key format: "embedding:exact:{normalized_text}"
                    cached_normalized = key.decode('utf-8').replace("embedding:exact:", "")

                    # Calculate text similarity score (simple heuristic)
                    score = self._calculate_text_similarity(normalized_query, cached_normalized)

                    # If very similar text (>0.95), fetch embedding
                    if score > best_score and score > 0.95:
                        # Get cached embedding
                        cached_data = await self.redis.get(key)
                        if cached_data:
                            cache_entry = json.loads(cached_data)
                            embedding = cache_entry.get("embedding")
                            if embedding:
                                best_match = SimilarSkill(
                                    skill_text=cache_entry.get("skill_text", cached_normalized),
                                    similarity=score
                                )
                                best_match.embedding = embedding
                                best_score = score

                # Break if no more keys
                if cursor == 0:
                    break

            return best_match

        except (json.JSONDecodeError, redis.RedisError) as e:
            print(f"Semantic cache lookup error for '{skill_text}': {e}")
            return None

    def _calculate_text_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate text similarity score using simple heuristics.

        Args:
            text1: First text (normalized)
            text2: Second text (normalized)

        Returns:
            Similarity score between 0 and 1
        """
        # Exact match
        if text1 == text2:
            return 1.0

        # Substring match (one contains the other)
        if text1 in text2 or text2 in text1:
            # Score based on length ratio
            longer = max(len(text1), len(text2))
            shorter = min(len(text1), len(text2))
            return shorter / longer

        # Token overlap (split by spaces)
        tokens1 = set(text1.split())
        tokens2 = set(text2.split())
        if not tokens1 or not tokens2:
            return 0.0

        intersection = tokens1 & tokens2
        union = tokens1 | tokens2
        jaccard = len(intersection) / len(union)

        return jaccard

    # ============================================
    # Private Helper Methods (OpenAI API)
    # ============================================

    async def _call_openai(self, skill_text: str) -> List[float]:
        """
        Call OpenAI API to generate embedding for a single skill.

        Args:
            skill_text: The skill text to embed

        Returns:
            3072-dim embedding vector from text-embedding-3-large
        """
        max_retries = 3
        base_delay = 1.0  # seconds

        for attempt in range(max_retries):
            try:
                # Call OpenAI embeddings API
                response = await self.openai.embeddings.create(
                    model="text-embedding-3-large",
                    input=skill_text
                )

                # Extract embedding from response
                embedding = response.data[0].embedding

                # Verify dimensions
                if len(embedding) != 3072:
                    raise ValueError(
                        f"Expected 3072 dimensions, got {len(embedding)}"
                    )

                return embedding

            except RateLimitError as e:
                # Rate limit hit - exponential backoff
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt)
                    print(f"Rate limit hit, retrying in {delay}s... (attempt {attempt + 1}/{max_retries})")
                    await asyncio.sleep(delay)
                else:
                    raise Exception(f"Rate limit exceeded after {max_retries} attempts: {e}")

            except APIError as e:
                # API error - retry with backoff
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt)
                    print(f"API error, retrying in {delay}s... (attempt {attempt + 1}/{max_retries})")
                    await asyncio.sleep(delay)
                else:
                    raise Exception(f"API error after {max_retries} attempts: {e}")

            except Exception as e:
                # Other errors - don't retry
                raise Exception(f"Failed to get embedding for '{skill_text}': {e}")

    async def _call_openai_batch(self, skills: List[str]) -> Dict[str, List[float]]:
        """
        Call OpenAI API to generate embeddings for multiple skills.

        Args:
            skills: List of skill texts (max 100 per call)

        Returns:
            Dictionary mapping skill_text to 3072-dim embedding
        """
        if len(skills) > 100:
            raise ValueError(f"Batch size {len(skills)} exceeds maximum of 100")

        if not skills:
            return {}

        max_retries = 3
        base_delay = 1.0  # seconds

        for attempt in range(max_retries):
            try:
                # Call OpenAI embeddings API with batch input
                response = await self.openai.embeddings.create(
                    model="text-embedding-3-large",
                    input=skills  # API accepts list of strings
                )

                # Map responses back to skill texts
                results = {}
                for i, data in enumerate(response.data):
                    skill_text = skills[i]
                    embedding = data.embedding

                    # Verify dimensions
                    if len(embedding) != 3072:
                        raise ValueError(
                            f"Expected 3072 dimensions for '{skill_text}', got {len(embedding)}"
                        )

                    results[skill_text] = embedding

                return results

            except RateLimitError as e:
                # Rate limit hit - exponential backoff
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt)
                    print(f"Rate limit hit (batch), retrying in {delay}s... (attempt {attempt + 1}/{max_retries})")
                    await asyncio.sleep(delay)
                else:
                    raise Exception(f"Rate limit exceeded after {max_retries} attempts: {e}")

            except APIError as e:
                # API error - retry with backoff
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt)
                    print(f"API error (batch), retrying in {delay}s... (attempt {attempt + 1}/{max_retries})")
                    await asyncio.sleep(delay)
                else:
                    raise Exception(f"API error after {max_retries} attempts: {e}")

            except Exception as e:
                # Other errors - don't retry
                raise Exception(f"Failed to get batch embeddings: {e}")

    # ============================================
    # Private Helper Methods (PCA)
    # ============================================

    def _apply_pca(self, embedding: List[float]) -> List[float]:
        """
        Apply PCA reduction to embedding.

        Args:
            embedding: 3072-dim embedding from OpenAI

        Returns:
            1536-dim PCA-reduced embedding (or original if PCA not loaded)
        """
        if not self.pca:
            # PCA model not loaded - return original embedding
            # This allows the service to work without PCA (though not recommended)
            return embedding

        # Validate input dimensions
        if len(embedding) != 3072:
            raise ValueError(
                f"Expected 3072-dim embedding for PCA reduction, got {len(embedding)}"
            )

        # Convert to NumPy array and reshape for sklearn
        embedding_array = np.array(embedding).reshape(1, -1)  # Shape: (1, 3072)

        # Apply PCA transformation
        reduced_array = self.pca.transform(embedding_array)  # Shape: (1, 1536)

        # Convert back to list
        reduced_embedding = reduced_array[0].tolist()  # Shape: (1536,)

        # Validate output dimensions
        if len(reduced_embedding) != 1536:
            raise ValueError(
                f"PCA reduction produced {len(reduced_embedding)} dims, expected 1536"
            )

        return reduced_embedding
