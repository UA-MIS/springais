"""
Embedding Integration Service.

Provides a simple interface to vectorize skills and resumes
after extraction, storing embeddings for semantic matching.
"""

import logging
from typing import List, Optional
from sqlalchemy.orm import Session

from app.config import get_openai_client, get_redis_client
from app.services.embedding_service import EmbeddingService
from app.models.skill_embedding import SkillEmbedding
from app.models.user_profile import UserProfile
from app.utils.text import normalize_skill_text

logger = logging.getLogger(__name__)


async def vectorize_user_skills_and_resume(
    db: Session,
    user: UserProfile,
    skills: List[str],
    resume_text: Optional[str] = None,
) -> dict:
    """
    Vectorize a user's skills and optionally their resume text.

    This function:
    1. Creates embeddings for each skill using OpenAI text-embedding-3-large
    2. Stores skill embeddings in the skill_embeddings table
    3. Creates an embedding for the full resume text
    4. Stores the resume embedding in the user profile

    Args:
        db: SQLAlchemy database session
        user: The UserProfile to update
        skills: List of skill names to vectorize
        resume_text: Optional full resume text to vectorize

    Returns:
        Dict with counts: {skills_embedded, skills_cached, resume_embedded}
    """
    results = {
        "skills_embedded": 0,
        "skills_cached": 0,
        "resume_embedded": False,
        "errors": [],
    }

    try:
        # Initialize clients
        openai_client = get_openai_client()
        redis_client = await get_redis_client()

        # Create embedding service
        embedding_service = EmbeddingService(
            openai_client=openai_client,
            redis_client=redis_client,
            db_session=db,
        )

        # 1. Vectorize skills
        if skills:
            logger.info(f"Vectorizing {len(skills)} skills for user {user.id}")

            # Check which skills already have embeddings
            skills_to_embed = []
            for skill in skills:
                normalized = normalize_skill_text(skill)
                existing = db.query(SkillEmbedding).filter(
                    SkillEmbedding.normalized_text == normalized,
                    SkillEmbedding.source_type == "user",
                    SkillEmbedding.source_id == str(user.id),
                ).first()

                if existing:
                    results["skills_cached"] += 1
                else:
                    skills_to_embed.append(skill)

            # Batch embed new skills
            if skills_to_embed:
                try:
                    embeddings_map = await embedding_service.embed_skills_batch(skills_to_embed)

                    # Store embeddings in database
                    for skill_text, embedding in embeddings_map.items():
                        normalized = normalize_skill_text(skill_text)

                        # Double-check not already stored (race condition safety)
                        existing = db.query(SkillEmbedding).filter(
                            SkillEmbedding.normalized_text == normalized,
                            SkillEmbedding.source_type == "user",
                            SkillEmbedding.source_id == str(user.id),
                        ).first()

                        if not existing:
                            skill_embedding = SkillEmbedding(
                                skill_text=skill_text,
                                normalized_text=normalized,
                                embedding=embedding,
                                source_type="user",
                                source_id=str(user.id),
                                embedding_model="text-embedding-3-large-pca",
                                token_count=len(skill_text.split()),
                            )
                            db.add(skill_embedding)
                            results["skills_embedded"] += 1

                    db.commit()
                    logger.info(f"Embedded {results['skills_embedded']} new skills")

                except Exception as e:
                    logger.error(f"Failed to embed skills: {e}")
                    results["errors"].append(f"Skill embedding failed: {str(e)}")

        # 2. Vectorize resume text
        if resume_text and len(resume_text) > 50:
            logger.info(f"Vectorizing resume for user {user.id} ({len(resume_text)} chars)")

            try:
                # Generate embedding for full resume
                resume_embedding = await embedding_service.embed_skill(resume_text)

                # Store in user profile
                user.resume_text = resume_text
                user.resume_embedding = resume_embedding
                db.commit()

                results["resume_embedded"] = True
                logger.info(f"Stored resume embedding for user {user.id}")

            except Exception as e:
                logger.error(f"Failed to embed resume: {e}")
                results["errors"].append(f"Resume embedding failed: {str(e)}")

        # Cleanup
        await redis_client.close()

    except Exception as e:
        logger.error(f"Embedding integration failed: {e}")
        results["errors"].append(f"Integration error: {str(e)}")

    return results


async def vectorize_job_skills(
    db: Session,
    job_id: str,
    skills: List[str],
) -> dict:
    """
    Vectorize skills for a job posting.

    Args:
        db: SQLAlchemy database session
        job_id: The job posting ID
        skills: List of skill names to vectorize

    Returns:
        Dict with counts: {skills_embedded, skills_cached}
    """
    results = {
        "skills_embedded": 0,
        "skills_cached": 0,
        "errors": [],
    }

    if not skills:
        return results

    try:
        # Initialize clients
        openai_client = get_openai_client()
        redis_client = await get_redis_client()

        # Create embedding service
        embedding_service = EmbeddingService(
            openai_client=openai_client,
            redis_client=redis_client,
            db_session=db,
        )

        # Check which skills need embedding
        skills_to_embed = []
        for skill in skills:
            normalized = normalize_skill_text(skill)
            existing = db.query(SkillEmbedding).filter(
                SkillEmbedding.normalized_text == normalized,
                SkillEmbedding.source_type == "job_posting",
                SkillEmbedding.source_id == job_id,
            ).first()

            if existing:
                results["skills_cached"] += 1
            else:
                skills_to_embed.append(skill)

        # Batch embed new skills
        if skills_to_embed:
            embeddings_map = await embedding_service.embed_skills_batch(skills_to_embed)

            for skill_text, embedding in embeddings_map.items():
                normalized = normalize_skill_text(skill_text)

                skill_embedding = SkillEmbedding(
                    skill_text=skill_text,
                    normalized_text=normalized,
                    embedding=embedding,
                    source_type="job_posting",
                    source_id=job_id,
                    embedding_model="text-embedding-3-large-pca",
                    token_count=len(skill_text.split()),
                )
                db.add(skill_embedding)
                results["skills_embedded"] += 1

            db.commit()

        # Cleanup
        await redis_client.close()

    except Exception as e:
        logger.error(f"Job skill embedding failed: {e}")
        results["errors"].append(str(e))

    return results
