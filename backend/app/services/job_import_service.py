"""
Enhanced job import with pre-computed embeddings.

This service front-loads embedding computation during job import/scrape,
significantly reducing match calculation time later.

When jobs are imported:
1. Extract all skills from the job posting
2. Generate embeddings for each skill
3. Store embeddings in the skill_embeddings table
4. Optionally generate job description embedding

This means match calculations only need to look up pre-computed embeddings
instead of generating them on-demand.
"""

import asyncio
import logging
from typing import List, Dict, Set, Optional
from sqlalchemy.orm import Session

from app.models.job_posting import JobPosting
from app.models.skill_embedding import SkillEmbedding
from app.services.embedding_service import EmbeddingService
from app.config import get_openai_client, get_redis_client
from app.utils.text import normalize_skill_text

logger = logging.getLogger(__name__)


async def extract_job_skills(job: JobPosting) -> Set[str]:
    """
    Extract all skills from a job posting.

    Combines skills from multiple sources:
    - required_skills (array)
    - preferred_skills (array)
    - llm_required_skills (JSONB)
    - llm_inferred_skills (JSONB)

    Args:
        job: The job posting to extract skills from

    Returns:
        Set of unique skill names
    """
    all_skills: Set[str] = set()

    # Required skills (array)
    if job.required_skills:
        all_skills.update(job.required_skills)

    # Preferred skills (array)
    if job.preferred_skills:
        all_skills.update(job.preferred_skills)

    # LLM-extracted required skills (JSONB)
    if job.llm_required_skills:
        for skill in job.llm_required_skills:
            if isinstance(skill, dict) and skill.get("name"):
                all_skills.add(skill["name"])
            elif isinstance(skill, str):
                all_skills.add(skill)

    # LLM-inferred skills (JSONB)
    if job.llm_inferred_skills:
        for skill in job.llm_inferred_skills:
            if isinstance(skill, dict) and skill.get("name"):
                all_skills.add(skill["name"])
            elif isinstance(skill, str):
                all_skills.add(skill)

    return all_skills


async def enrich_job_with_embeddings(
    db: Session,
    job: JobPosting,
    embedding_service: EmbeddingService
) -> Dict[str, int]:
    """
    Pre-compute all embeddings for a job posting.

    Called during job import/scrape to front-load embedding work.
    This means match calculations later only need to look up
    pre-computed embeddings, not generate them.

    Args:
        db: Database session
        job: The job posting to enrich
        embedding_service: Initialized embedding service

    Returns:
        Dict with counts: {skills_embedded, skills_cached, errors}
    """
    result = {
        "skills_embedded": 0,
        "skills_cached": 0,
        "errors": 0
    }

    try:
        # Get all skills from the job
        all_skills = await extract_job_skills(job)

        if not all_skills:
            return result

        # Filter to skills that don't already have embeddings
        skills_to_embed: List[str] = []
        for skill in all_skills:
            normalized = normalize_skill_text(skill)
            existing = db.query(SkillEmbedding).filter(
                SkillEmbedding.normalized_text == normalized
            ).first()

            if existing:
                result["skills_cached"] += 1
            else:
                skills_to_embed.append(skill)

        if not skills_to_embed:
            logger.debug(f"Job {job.id}: all {len(all_skills)} skills already have embeddings")
            return result

        # Batch embed all new skills
        try:
            embeddings = await embedding_service.embed_skills_batch(skills_to_embed)

            # Store embeddings in database
            for skill, embedding in embeddings.items():
                normalized = normalize_skill_text(skill)

                # Double-check not already stored (race condition safety)
                existing = db.query(SkillEmbedding).filter(
                    SkillEmbedding.normalized_text == normalized
                ).first()

                if not existing:
                    skill_emb = SkillEmbedding(
                        skill_text=skill,
                        normalized_text=normalized,
                        embedding=embedding,
                        source_type="job_posting",
                        source_id=str(job.id),
                        embedding_model="text-embedding-3-large-pca",
                        token_count=len(skill.split()),
                    )
                    db.add(skill_emb)
                    result["skills_embedded"] += 1

            db.commit()
            logger.debug(f"Job {job.id}: embedded {result['skills_embedded']} new skills")

        except Exception as e:
            logger.error(f"Failed to embed skills for job {job.id}: {e}")
            result["errors"] += 1
            db.rollback()

    except Exception as e:
        logger.error(f"Failed to enrich job {job.id}: {e}")
        result["errors"] += 1

    return result


async def batch_enrich_jobs(
    db: Session,
    jobs: List[JobPosting],
    batch_size: int = 10
) -> Dict[str, int]:
    """
    Enrich multiple jobs with embeddings in batches.

    Processes jobs in parallel batches for efficiency while
    respecting rate limits on the embedding API.

    Args:
        db: Database session
        jobs: Jobs to enrich
        batch_size: Jobs to process concurrently

    Returns:
        Dict with total counts: {jobs_processed, skills_embedded, skills_cached, errors}
    """
    total_result = {
        "jobs_processed": 0,
        "skills_embedded": 0,
        "skills_cached": 0,
        "errors": 0,
    }

    if not jobs:
        return total_result

    # Initialize shared clients
    openai_client = get_openai_client()
    redis_client = await get_redis_client()

    embedding_service = EmbeddingService(
        openai_client=openai_client,
        redis_client=redis_client,
        db_session=db,
    )

    # Process in batches
    for i in range(0, len(jobs), batch_size):
        batch = jobs[i:i + batch_size]

        tasks = [
            enrich_job_with_embeddings(db, job, embedding_service)
            for job in batch
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, Exception):
                logger.error(f"Batch enrichment error: {result}")
                total_result["errors"] += 1
            elif isinstance(result, dict):
                total_result["skills_embedded"] += result.get("skills_embedded", 0)
                total_result["skills_cached"] += result.get("skills_cached", 0)
                total_result["errors"] += result.get("errors", 0)
            total_result["jobs_processed"] += 1

        logger.info(f"Enriched {total_result['jobs_processed']}/{len(jobs)} jobs")

    return total_result


async def enrich_new_jobs(
    db: Session,
    limit: int = 100
) -> Dict[str, int]:
    """
    Find and enrich jobs that don't have embeddings yet.

    Useful for backfilling embeddings on existing jobs or
    running as a scheduled task.

    Args:
        db: Database session
        limit: Maximum jobs to process

    Returns:
        Dict with processing stats
    """
    from sqlalchemy import and_, exists, not_

    # Find active jobs that don't have any embeddings yet
    # This is a heuristic - we check if any skill from the job exists
    jobs = db.query(JobPosting).filter(
        JobPosting.is_active == True
    ).limit(limit).all()

    # Filter to jobs that might need enrichment
    jobs_to_enrich = []
    for job in jobs:
        skills = await extract_job_skills(job)
        if skills:
            # Check if any skill needs embedding
            sample_skill = list(skills)[0]
            normalized = normalize_skill_text(sample_skill)
            existing = db.query(SkillEmbedding).filter(
                SkillEmbedding.normalized_text == normalized
            ).first()
            if not existing:
                jobs_to_enrich.append(job)

    if not jobs_to_enrich:
        logger.info("No jobs need enrichment")
        return {"jobs_processed": 0, "skills_embedded": 0, "skills_cached": 0, "errors": 0}

    logger.info(f"Found {len(jobs_to_enrich)} jobs needing enrichment")
    return await batch_enrich_jobs(db, jobs_to_enrich)


async def get_enrichment_stats(db: Session) -> Dict[str, int]:
    """
    Get statistics about job enrichment status.

    Args:
        db: Database session

    Returns:
        Dict with stats: {total_jobs, jobs_with_skills, embeddings_count}
    """
    from sqlalchemy import func

    total_jobs = db.query(func.count(JobPosting.id)).filter(
        JobPosting.is_active == True
    ).scalar() or 0

    embeddings_count = db.query(func.count(SkillEmbedding.id)).scalar() or 0

    unique_skills = db.query(func.count(func.distinct(SkillEmbedding.normalized_text))).scalar() or 0

    job_source_embeddings = db.query(func.count(SkillEmbedding.id)).filter(
        SkillEmbedding.source_type == "job_posting"
    ).scalar() or 0

    return {
        "total_active_jobs": total_jobs,
        "total_embeddings": embeddings_count,
        "unique_skills_embedded": unique_skills,
        "job_source_embeddings": job_source_embeddings,
    }
