#!/usr/bin/env python3
"""
Generate embeddings for all skills and job content.

This script:
1. Collects all unique skills from LLM-extracted job skills
2. Generates embeddings using text-embedding-3-large + PCA
3. Stores embeddings in skill_embeddings table
4. Optionally generates job description/title embeddings

Usage:
    python scripts/generate_all_embeddings.py --type skills
    python scripts/generate_all_embeddings.py --type jobs
    python scripts/generate_all_embeddings.py --type all
"""

import asyncio
import argparse
import logging
import sys
from pathlib import Path

# Add backend to path (handles both local and Docker execution)
backend_path = Path(__file__).parent.parent / "backend"
app_in_backend = backend_path / "app"
if app_in_backend.exists():
    # Local: app module is at backend/app
    sys.path.insert(0, str(backend_path))
else:
    # Docker: app module is at /app/app, script is at /app/scripts
    sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
import os

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def get_database_url():
    return os.environ.get(
        "DATABASE_URL",
        "postgresql+psycopg://postgres:postgres@localhost:5432/springais"
    )


def get_unique_skills(session: Session) -> list[str]:
    """Get all unique skills from LLM-extracted data."""
    # Get skills from job postings
    result = session.execute(text("""
        WITH all_skills AS (
            SELECT DISTINCT jsonb_array_elements(llm_required_skills)->>'name' as skill
            FROM job_postings
            WHERE llm_required_skills IS NOT NULL
            UNION
            SELECT DISTINCT jsonb_array_elements(llm_inferred_skills)->>'name' as skill
            FROM job_postings
            WHERE llm_inferred_skills IS NOT NULL
            UNION
            SELECT DISTINCT jsonb_array_elements(llm_listed_skills)->>'name' as skill
            FROM user_profiles
            WHERE llm_listed_skills IS NOT NULL
            UNION
            SELECT DISTINCT jsonb_array_elements(llm_inferred_skills)->>'name' as skill
            FROM user_profiles
            WHERE llm_inferred_skills IS NOT NULL
        )
        SELECT skill FROM all_skills
        WHERE skill IS NOT NULL AND skill != ''
        ORDER BY skill
    """))
    return [row[0] for row in result.fetchall()]


def get_unembedded_skills(session: Session, skills: list[str]) -> list[str]:
    """Filter out skills that already have embeddings."""
    if not skills:
        return []

    # Get skills that already have embeddings
    result = session.execute(text("""
        SELECT DISTINCT normalized_text
        FROM skill_embeddings
    """))
    embedded = {row[0] for row in result.fetchall()}

    # Filter
    unembedded = [s for s in skills if s.lower().strip() not in embedded]
    return unembedded


def get_jobs_without_embeddings(session: Session, limit: int = None) -> list:
    """Get jobs that don't have embeddings yet."""
    query = """
        SELECT id, title, description
        FROM job_postings
        WHERE is_active = true
          AND description_embedding IS NULL
        ORDER BY posted_date DESC
    """
    if limit:
        query += f" LIMIT {limit}"

    result = session.execute(text(query))
    return result.fetchall()


async def generate_skill_embeddings(session: Session, skills: list[str], batch_size: int = 50):
    """Generate and store embeddings for skills."""
    from app.services.embedding_service import EmbeddingService
    from app.config import get_openai_client, get_redis_client
    from app.models.skill_embedding import SkillEmbedding
    from app.utils.text import normalize_skill_text

    # Initialize embedding service
    openai_client = get_openai_client()
    redis_client = await get_redis_client()
    embedding_service = EmbeddingService(openai_client, redis_client, session)

    total = len(skills)
    processed = 0

    for i in range(0, len(skills), batch_size):
        batch = skills[i:i + batch_size]

        try:
            # Get embeddings for batch
            embeddings = await embedding_service.embed_skills_batch(batch)

            # Store in database
            for skill, embedding in embeddings.items():
                normalized = normalize_skill_text(skill)

                # Check if already exists
                existing = session.execute(text("""
                    SELECT id FROM skill_embeddings
                    WHERE normalized_text = :normalized
                    LIMIT 1
                """), {"normalized": normalized}).fetchone()

                if not existing:
                    session.execute(text("""
                        INSERT INTO skill_embeddings (skill_text, normalized_text, embedding, source_type, source_id, embedding_model)
                        VALUES (:skill_text, :normalized, :embedding, 'global', 'batch_script', 'text-embedding-3-large-pca')
                    """), {
                        "skill_text": skill,
                        "normalized": normalized,
                        "embedding": embedding
                    })

            session.commit()
            processed += len(batch)
            logger.info(f"Skills: {processed}/{total} ({processed/total*100:.1f}%)")

        except Exception as e:
            logger.error(f"Error processing skill batch: {e}")
            session.rollback()

    return processed


async def generate_job_embeddings(session: Session, jobs: list, batch_size: int = 10):
    """Generate and store embeddings for job descriptions and titles."""
    from app.services.embedding_service import EmbeddingService
    from app.config import get_openai_client, get_redis_client

    openai_client = get_openai_client()
    redis_client = await get_redis_client()
    embedding_service = EmbeddingService(openai_client, redis_client, session)

    total = len(jobs)
    processed = 0

    for i in range(0, len(jobs), batch_size):
        batch = jobs[i:i + batch_size]

        try:
            for job in batch:
                # Generate description embedding (truncate to ~8k chars for token limit)
                desc_text = job.description[:8000] if job.description else ""
                if desc_text:
                    desc_embedding = await embedding_service.embed_skill(desc_text)

                    session.execute(text("""
                        UPDATE job_postings
                        SET description_embedding = :embedding
                        WHERE id = :job_id
                    """), {"embedding": desc_embedding, "job_id": job.id})

                # Generate title embedding
                title_embedding = await embedding_service.embed_skill(job.title)
                session.execute(text("""
                    UPDATE job_postings
                    SET title_embedding = :embedding
                    WHERE id = :job_id
                """), {"embedding": title_embedding, "job_id": job.id})

            session.commit()
            processed += len(batch)
            logger.info(f"Jobs: {processed}/{total} ({processed/total*100:.1f}%)")

        except Exception as e:
            logger.error(f"Error processing job batch: {e}")
            session.rollback()

    return processed


async def main():
    parser = argparse.ArgumentParser(description="Generate embeddings for skills and jobs")
    parser.add_argument("--type", choices=["skills", "jobs", "all"], default="all", help="What to embed")
    parser.add_argument("--batch-size", type=int, default=50, help="Batch size for embedding")
    parser.add_argument("--limit", type=int, help="Max items to process")
    parser.add_argument("--dry-run", action="store_true", help="Preview only")
    args = parser.parse_args()

    engine = create_engine(get_database_url())

    with Session(engine) as session:
        if args.type in ["skills", "all"]:
            # Get unique skills
            all_skills = get_unique_skills(session)
            logger.info(f"Found {len(all_skills)} unique skills")

            # Filter to unembedded
            skills_to_embed = get_unembedded_skills(session, all_skills)
            logger.info(f"{len(skills_to_embed)} skills need embeddings")

            if args.dry_run:
                logger.info("DRY RUN - Would embed these skills:")
                for s in skills_to_embed[:20]:
                    logger.info(f"  - {s}")
                if len(skills_to_embed) > 20:
                    logger.info(f"  ... and {len(skills_to_embed) - 20} more")
            elif skills_to_embed:
                if args.limit:
                    skills_to_embed = skills_to_embed[:args.limit]
                processed = await generate_skill_embeddings(session, skills_to_embed, args.batch_size)
                logger.info(f"Embedded {processed} skills")

        if args.type in ["jobs", "all"]:
            # Get jobs without embeddings
            jobs = get_jobs_without_embeddings(session, args.limit)
            logger.info(f"Found {len(jobs)} jobs without embeddings")

            if args.dry_run:
                logger.info("DRY RUN - Would embed these jobs:")
                for j in jobs[:10]:
                    logger.info(f"  - {j.id}: {j.title}")
                if len(jobs) > 10:
                    logger.info(f"  ... and {len(jobs) - 10} more")
            elif jobs:
                processed = await generate_job_embeddings(session, jobs, args.batch_size)
                logger.info(f"Embedded {processed} jobs")

        logger.info("Done!")


if __name__ == "__main__":
    asyncio.run(main())
