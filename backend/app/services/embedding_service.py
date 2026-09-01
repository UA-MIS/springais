"""
Embedding Service for generating and managing skill embeddings.

This service provides:
- Two-layer caching (exact match + semantic similarity)
- OpenAI text-embedding-3-large integration with PCA reduction
- pgvector similarity search
- Batch processing for cost optimization
"""

from typing import List, Dict, Optional, Tuple, Literal
import json
import asyncio
import logging
import numpy as np
from openai import AsyncOpenAI
from openai import RateLimitError, APIError
import redis.asyncio as redis
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import joblib
from ..utils.text import normalize_skill_text, calculate_cosine_similarity
from ..utils.pca_loader import load_pca_model_safe
from ..models.skill_embedding import SkillEmbedding
from ..models.job_posting import JobPosting
from ..models.user_profile import UserProfile

logger = logging.getLogger(__name__)

# The OpenAI embedding model this service is built around. Embeddings from a
# different model are NOT comparable to these, so this string is part of the
# cache key (see _cache_namespace).
EMBEDDING_MODEL = "text-embedding-3-large"

# Dimensions produced by EMBEDDING_MODEL, before PCA reduction.
RAW_EMBEDDING_DIMENSIONS = 3072

# Dimensions after PCA reduction. This MUST match the width of the
# skill_embeddings.embedding column, which is Vector(1536).
PCA_EMBEDDING_DIMENSIONS = 1536


class PCAUnavailableError(RuntimeError):
    """
    Raised when an embedding is requested but the PCA model is not loaded.

    This is deliberately fatal to the embedding operation rather than a
    fallback. Without PCA, embeddings come out at 3072 dimensions while every
    vector already indexed is 1536-dimensional, so the two live in different
    spaces and any similarity computed between them is meaningless. Previously
    this path silently returned the raw 3072-dim vector, which produced
    confidently wrong match scores instead of an error.
    """


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
            logger.info(
                "Loaded PCA model version=%s components=%d variance=%.2f%%",
                self.pca_metadata.version,
                self.pca_metadata.n_components,
                self.pca_metadata.explained_variance_ratio * 100,
            )
        else:
            # Loud, and at a level that actually reaches production logs. This
            # used to be a print() at WARNING wording only, which meant a
            # missing PCA model was invisible in any real deployment while the
            # service quietly emitted vectors in the wrong space.
            logger.error(
                "PCA model could not be loaded. Embedding generation is DISABLED: "
                "every embed_skill/embed_skills_batch call will raise "
                "PCAUnavailableError rather than return an incomparable "
                "%d-dim vector for a Vector(%d) column. "
                "Fix by training the model (python scripts/train_pca_model.py) "
                "or pointing PCA_MODEL_DIR at an existing one.",
                RAW_EMBEDDING_DIMENSIONS,
                PCA_EMBEDDING_DIMENSIONS,
            )

        # Cache namespace discriminator.
        #
        # Cached vectors are only interchangeable with vectors produced by the
        # SAME embedding model AND the same PCA fit. The key used to be just
        # "embedding:exact:{text}" with a 30-day TTL, so changing the model or
        # retraining PCA served vectors from an incompatible space for a month
        # with no signal. Including both in the key makes such a change a clean
        # cache miss instead of silent corruption.
        pca_version = self.pca_metadata.version if self.pca_metadata else "none"
        self._cache_namespace = f"{EMBEDDING_MODEL}:pca-{pca_version}"

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

    def _exact_match_cache_key(self, skill_text: str) -> str:
        """
        Build the Layer 1 cache key for a skill.

        The key is namespaced by embedding model and PCA version because a
        cached vector is only reusable by the exact pipeline that produced it.
        Without the discriminator, changing OPENAI embedding models or
        retraining PCA left up to 30 days (the TTL) of vectors from a different
        vector space being served as if they were current.
        """
        normalized = normalize_skill_text(skill_text)
        return f"embedding:exact:{self._cache_namespace}:{normalized}"

    async def _get_exact_match_cache(self, skill_text: str) -> Optional[List[float]]:
        """
        Check Layer 1 cache (exact match) for cached embedding.

        Args:
            skill_text: The skill text to look up

        Returns:
            Cached embedding if found, None otherwise
        """
        cache_key = self._exact_match_cache_key(skill_text)

        try:
            # Check Redis for cached embedding
            cached_data = await self.redis.get(cache_key)

            if cached_data:
                # Deserialize JSON data
                cache_entry = json.loads(cached_data)
                embedding = cache_entry.get("embedding")

                if embedding and isinstance(embedding, list):
                    # Defence in depth: the namespace should already guarantee
                    # this, but a wrong-width vector reaching the matcher is
                    # exactly the silent corruption we are eliminating, so
                    # verify rather than trust and treat a mismatch as a miss.
                    if len(embedding) != PCA_EMBEDDING_DIMENSIONS:
                        logger.error(
                            "Discarding cached embedding for %r: %d dims, "
                            "expected %d (key=%s). This should be unreachable "
                            "now that the key is namespaced by model+PCA "
                            "version - investigate.",
                            skill_text,
                            len(embedding),
                            PCA_EMBEDDING_DIMENSIONS,
                            cache_key,
                        )
                        return None
                    return embedding

            return None

        except (json.JSONDecodeError, redis.RedisError) as e:
            # A cache miss is a safe degradation (we re-embed), but it is not
            # free and it is not normal - say so at a level that is visible.
            logger.warning(
                "Cache lookup failed for %r (key=%s); treating as a miss and "
                "re-embedding: %s",
                skill_text,
                cache_key,
                e,
                exc_info=True,
            )
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

        cache_key = self._exact_match_cache_key(skill_text)

        # Refuse to cache a vector of the wrong width. A 30-day TTL turns one
        # bad write into a month of bad reads.
        if len(embedding) != PCA_EMBEDDING_DIMENSIONS:
            logger.error(
                "Refusing to cache %d-dim embedding for %r; expected %d dims.",
                len(embedding),
                skill_text,
                PCA_EMBEDDING_DIMENSIONS,
            )
            return

        # Create cache entry with metadata
        cache_entry = {
            "embedding": embedding,
            "skill_text": skill_text,  # Store original text
            "normalized_text": normalized,
            "embedding_model": EMBEDDING_MODEL,
            "pca_version": self.pca_metadata.version if self.pca_metadata else None,
            "dimensions": len(embedding),
        }

        try:
            # Serialize to JSON
            cache_data = json.dumps(cache_entry)

            # Save to Redis with 30-day TTL (2592000 seconds)
            await self.redis.set(cache_key, cache_data, ex=2592000)

        except (TypeError, ValueError, redis.RedisError) as e:
            # Not fatal - the caller already has the embedding - but a cache
            # that silently never writes looks identical to a cache that works
            # and just misses a lot, so this must be visible.
            logger.warning(
                "Cache save failed for %r (key=%s); embedding returned but not "
                "cached: %s",
                skill_text,
                cache_key,
                e,
                exc_info=True,
            )

    # ============================================
    # Private Helper Methods (Layer 2: Semantic Cache)
    # ============================================

    async def _get_semantic_cache(self, skill_text: str) -> Optional[SimilarSkill]:
        """
        Check Layer 2 cache (semantic similarity) for similar cached skills.

        DISABLED FOR PERFORMANCE: The Redis SCAN operation is O(N) and becomes
        slow with many cached embeddings. The exact match cache (Layer 1) provides
        sufficient cache hit rates without this overhead.

        The semantic cache was designed to reuse embeddings for very similar skill
        texts (e.g., "Python" vs "python programming"), but in practice:
        1. Normalized text matching catches most of these cases
        2. The SCAN operation adds 50-200ms latency per lookup
        3. Cache hit rate improvement is marginal (<5%)

        Args:
            skill_text: The skill text to look up

        Returns:
            Always None (disabled for performance)
        """
        # DISABLED: Return None immediately to skip slow Redis SCAN
        # The exact match cache (Layer 1) is sufficient for most use cases
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
                    logger.warning(
                        "OpenAI rate limit on embed of %r; retrying in %ss (attempt %d/%d)",
                        skill_text, delay, attempt + 1, max_retries,
                    )
                    await asyncio.sleep(delay)
                else:
                    raise Exception(f"Rate limit exceeded after {max_retries} attempts: {e}")

            except APIError as e:
                # API error - retry with backoff
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt)
                    logger.warning(
                        "OpenAI API error on embed of %r; retrying in %ss (attempt %d/%d): %s",
                        skill_text, delay, attempt + 1, max_retries, e,
                    )
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
                    logger.warning(
                        "OpenAI rate limit on batch embed of %d skills; retrying in %ss (attempt %d/%d)",
                        len(skills), delay, attempt + 1, max_retries,
                    )
                    await asyncio.sleep(delay)
                else:
                    raise Exception(f"Rate limit exceeded after {max_retries} attempts: {e}")

            except APIError as e:
                # API error - retry with backoff
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt)
                    logger.warning(
                        "OpenAI API error on batch embed of %d skills; retrying in %ss (attempt %d/%d): %s",
                        len(skills), delay, attempt + 1, max_retries, e,
                    )
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
            1536-dim PCA-reduced embedding

        Raises:
            PCAUnavailableError: If the PCA model is not loaded. This is fatal
                by design - see PCAUnavailableError for why returning the raw
                vector instead is worse than failing.
        """
        if not self.pca:
            # Previously: `return embedding` - i.e. hand back a 3072-dim vector
            # from a function whose contract is 1536 dims. Callers then wrote it
            # to a Vector(1536) column or compared it against 1536-dim vectors,
            # so the failure surfaced far from its cause (or, combined with the
            # swallowed pgvector exception in matching_service, not at all: the
            # dimension mismatch raised inside the SQL, got caught, and became a
            # 0.0 similarity that looks exactly like an honest "no match").
            logger.error(
                "PCA model unavailable - refusing to emit a %d-dim embedding "
                "where %d dims are required. Indexed vectors are %d-dim, so a "
                "raw vector would be silently incomparable to all of them.",
                RAW_EMBEDDING_DIMENSIONS,
                PCA_EMBEDDING_DIMENSIONS,
                PCA_EMBEDDING_DIMENSIONS,
            )
            raise PCAUnavailableError(
                f"PCA model not loaded: cannot reduce "
                f"{RAW_EMBEDDING_DIMENSIONS} -> {PCA_EMBEDDING_DIMENSIONS} dims. "
                f"Train it with `python scripts/train_pca_model.py` or set "
                f"PCA_MODEL_DIR to a directory containing pca_model_v1.pkl."
            )

        # Validate input dimensions
        if len(embedding) != RAW_EMBEDDING_DIMENSIONS:
            raise ValueError(
                f"Expected {RAW_EMBEDDING_DIMENSIONS}-dim embedding for PCA "
                f"reduction, got {len(embedding)}"
            )

        # Convert to NumPy array and reshape for sklearn
        embedding_array = np.array(embedding).reshape(1, -1)  # Shape: (1, 3072)

        # Apply PCA transformation
        reduced_array = self.pca.transform(embedding_array)  # Shape: (1, 1536)

        # Convert back to list
        reduced_embedding = reduced_array[0].tolist()  # Shape: (1536,)

        # Validate output dimensions
        if len(reduced_embedding) != PCA_EMBEDDING_DIMENSIONS:
            raise ValueError(
                f"PCA reduction produced {len(reduced_embedding)} dims, "
                f"expected {PCA_EMBEDDING_DIMENSIONS}"
            )

        return reduced_embedding

    # ============================================
    # Database Storage Methods
    # ============================================

    async def embed_and_store_skill(
        self,
        db: AsyncSession,
        skill_text: str,
        source_type: Literal["job_posting", "user"],
        source_id: str
    ) -> SkillEmbedding:
        """
        Embed a skill and store it in the database.

        Args:
            db: Async SQLAlchemy session
            skill_text: The skill text to embed
            source_type: Either "job_posting" or "user"
            source_id: The ID of the source (job posting ID or user ID)

        Returns:
            SkillEmbedding record (existing or newly created)
        """
        normalized = normalize_skill_text(skill_text)

        try:
            # Check if already embedded
            stmt = select(SkillEmbedding).where(
                SkillEmbedding.normalized_text == normalized,
                SkillEmbedding.source_type == source_type,
                SkillEmbedding.source_id == source_id
            )
            result = await db.execute(stmt)
            existing = result.scalar_one_or_none()

            if existing:
                logger.debug(f"Found existing embedding for skill '{skill_text}'")
                return existing

            # Generate embedding using existing method
            embedding = await self.embed_skill(skill_text)

            # Create SkillEmbedding record
            skill_embedding = SkillEmbedding(
                skill_text=skill_text,
                normalized_text=normalized,
                embedding=embedding,
                source_type=source_type,
                source_id=source_id,
                embedding_model="text-embedding-3-large-pca",
                token_count=len(skill_text.split())  # Approximate token count
            )

            db.add(skill_embedding)
            await db.commit()
            await db.refresh(skill_embedding)

            logger.info(f"Stored embedding for skill '{skill_text}' (source: {source_type}/{source_id})")
            return skill_embedding

        except Exception as e:
            logger.error(f"Failed to embed and store skill '{skill_text}': {e}")
            await db.rollback()
            raise

    async def embed_and_store_job(
        self,
        db: AsyncSession,
        job: JobPosting
    ) -> None:
        """
        Generate and store embeddings for a job posting.

        Args:
            db: Async SQLAlchemy session
            job: JobPosting model instance

        Updates:
            - job.description_embedding
            - job.title_embedding
        """
        try:
            # Generate embedding for job description
            if job.description:
                description_embedding = await self.embed_skill(job.description)
                job.description_embedding = description_embedding
                logger.debug(f"Generated description embedding for job '{job.id}'")

            # Generate embedding for job title
            if job.title:
                title_embedding = await self.embed_skill(job.title)
                job.title_embedding = title_embedding
                logger.debug(f"Generated title embedding for job '{job.id}'")

            await db.commit()
            logger.info(f"Stored embeddings for job posting '{job.id}'")

        except Exception as e:
            logger.error(f"Failed to embed job posting '{job.id}': {e}")
            await db.rollback()
            raise

    async def embed_and_store_user_resume(
        self,
        db: AsyncSession,
        user: UserProfile
    ) -> None:
        """
        Generate and store embedding for a user's resume.

        Args:
            db: Async SQLAlchemy session
            user: UserProfile model instance

        Updates:
            - user.resume_embedding
        """
        # Skip if no resume text
        if user.resume_text is None:
            logger.debug(f"User '{user.id}' has no resume text, skipping embedding")
            return

        try:
            # Generate embedding for resume text
            resume_embedding = await self.embed_skill(user.resume_text)
            user.resume_embedding = resume_embedding

            await db.commit()
            logger.info(f"Stored resume embedding for user '{user.id}'")

        except Exception as e:
            logger.error(f"Failed to embed resume for user '{user.id}': {e}")
            await db.rollback()
            raise

    async def batch_embed_and_store_skills(
        self,
        db: AsyncSession,
        skills: List[str],
        source_type: str,
        source_id: str
    ) -> List[SkillEmbedding]:
        """
        Embed multiple skills and store them in the database.

        Args:
            db: Async SQLAlchemy session
            skills: List of skill texts to embed
            source_type: Source type for all skills
            source_id: Source ID for all skills

        Returns:
            List of all SkillEmbedding records (existing + new)
        """
        if not skills:
            return []

        all_embeddings: List[SkillEmbedding] = []
        skills_to_embed: List[str] = []
        skill_to_normalized: Dict[str, str] = {}

        try:
            # Check which skills are already embedded
            for skill in skills:
                normalized = normalize_skill_text(skill)
                skill_to_normalized[skill] = normalized

                stmt = select(SkillEmbedding).where(
                    SkillEmbedding.normalized_text == normalized,
                    SkillEmbedding.source_type == source_type,
                    SkillEmbedding.source_id == source_id
                )
                result = await db.execute(stmt)
                existing = result.scalar_one_or_none()

                if existing:
                    all_embeddings.append(existing)
                    logger.debug(f"Found existing embedding for skill '{skill}'")
                else:
                    skills_to_embed.append(skill)

            # If all skills already embedded, return early
            if not skills_to_embed:
                logger.debug(f"All {len(skills)} skills already embedded")
                return all_embeddings

            # Batch embed new skills using existing batch method
            logger.info(f"Embedding {len(skills_to_embed)} new skills (batch)")
            embeddings_map = await self.embed_skills_batch(skills_to_embed)

            # Store new embeddings in database
            for skill_text, embedding in embeddings_map.items():
                skill_embedding = SkillEmbedding(
                    skill_text=skill_text,
                    normalized_text=skill_to_normalized[skill_text],
                    embedding=embedding,
                    source_type=source_type,
                    source_id=source_id,
                    embedding_model="text-embedding-3-large-pca",
                    token_count=len(skill_text.split())
                )
                db.add(skill_embedding)
                all_embeddings.append(skill_embedding)

            await db.commit()

            # Refresh all new embeddings to get their IDs
            for emb in all_embeddings:
                if emb.id is None:
                    await db.refresh(emb)

            logger.info(f"Stored {len(skills_to_embed)} new skill embeddings")
            return all_embeddings

        except Exception as e:
            logger.error(f"Failed to batch embed skills: {e}")
            await db.rollback()
            raise
