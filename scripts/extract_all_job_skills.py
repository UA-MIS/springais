#!/usr/bin/env python3
"""
Batch extract skills from all job postings using LLM.

This script:
1. Loads all processable jobs from the database
2. Groups similar jobs by description hash for caching efficiency
3. Sends batches to GPT-5 nano for skill extraction
4. Stores results in the job_postings table
5. Tracks progress and costs

Usage:
    python scripts/extract_all_job_skills.py --batch-size 5 --concurrency 5
    python scripts/extract_all_job_skills.py --dry-run  # Preview only
"""

import asyncio
import argparse
import logging
import sys
from datetime import datetime, timedelta
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

from sqlalchemy import create_engine, select, text
from sqlalchemy.orm import Session
import os

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def get_database_url():
    """Get database URL from environment."""
    return os.environ.get(
        "DATABASE_URL",
        "postgresql+psycopg://postgres:postgres@localhost:5432/springais"
    )


def get_processable_jobs(session: Session, limit: int = None):
    """Get all jobs that need skill extraction."""
    query = text("""
        SELECT id, title, description, service_line
        FROM job_postings
        WHERE is_active = true
          AND LENGTH(description) > 100
          AND posted_date > NOW() - INTERVAL '12 months'
          AND llm_required_skills IS NULL
        ORDER BY posted_date DESC
    """)

    if limit:
        query = text(str(query) + f" LIMIT {limit}")

    result = session.execute(query)
    return result.fetchall()


async def extract_skills_for_batch(jobs: list, extractor) -> dict:
    """Extract skills for a batch of jobs."""
    job_inputs = [
        {"id": j.id, "title": j.title, "description": j.description}
        for j in jobs
    ]

    extractions, usage = await extractor.extract_skills(job_inputs, use_cache=True)
    return {
        "extractions": extractions,
        "usage": usage
    }


def update_job_with_skills(session: Session, job_id: str, extraction):
    """Update job posting with extracted skills."""
    import json

    required_skills_json = json.dumps([s.model_dump() for s in extraction.required_skills])
    inferred_skills_json = json.dumps([s.model_dump() for s in extraction.inferred_skills])

    session.execute(
        text("""
            UPDATE job_postings
            SET llm_required_skills = CAST(:required_skills AS jsonb),
                llm_inferred_skills = CAST(:inferred_skills AS jsonb),
                llm_experience_years_min = :exp_min,
                llm_experience_years_max = :exp_max,
                llm_primary_domain = :domain,
                skills_extracted_at = NOW()
            WHERE id = :job_id
        """),
        {
            "job_id": job_id,
            "required_skills": required_skills_json,
            "inferred_skills": inferred_skills_json,
            "exp_min": extraction.experience_years_min,
            "exp_max": extraction.experience_years_max,
            "domain": extraction.primary_domain
        }
    )


async def process_batch(batch, extractor, session, semaphore, results_lock, results):
    """Process a batch of jobs with concurrency control."""
    import json

    async with semaphore:
        try:
            job_inputs = [
                {"id": job.id, "title": job.title, "description": job.description}
                for job in batch
            ]
            extractions, usage = await extractor.extract_skills(job_inputs, use_cache=True)

            # Update database (need lock for thread safety)
            async with results_lock:
                for extraction in extractions:
                    for job_id in extraction.job_ids:
                        required_skills_json = json.dumps([s.model_dump() for s in extraction.required_skills])
                        inferred_skills_json = json.dumps([s.model_dump() for s in extraction.inferred_skills])

                        session.execute(
                            text("""
                                UPDATE job_postings
                                SET llm_required_skills = CAST(:required_skills AS jsonb),
                                    llm_inferred_skills = CAST(:inferred_skills AS jsonb),
                                    llm_experience_years_min = :exp_min,
                                    llm_experience_years_max = :exp_max,
                                    llm_primary_domain = :domain,
                                    skills_extracted_at = NOW()
                                WHERE id = :job_id
                            """),
                            {
                                "job_id": job_id,
                                "required_skills": required_skills_json,
                                "inferred_skills": inferred_skills_json,
                                "exp_min": extraction.experience_years_min,
                                "exp_max": extraction.experience_years_max,
                                "domain": extraction.primary_domain
                            }
                        )
                session.commit()

                results["processed"] += len(batch)
                results["tokens"] += usage["total_tokens"]
                results["cost"] += usage["cost_usd"]

                logger.info(
                    f"Progress: {results['processed']}/{results['total']} jobs "
                    f"({results['processed']/results['total']*100:.1f}%) - "
                    f"Cost: ${results['cost']:.4f}"
                )

            return True
        except Exception as e:
            logger.error(f"Error processing batch: {e}")
            return False


async def main():
    parser = argparse.ArgumentParser(description="Extract skills from job postings")
    parser.add_argument("--batch-size", type=int, default=3, help="Jobs per LLM call")
    parser.add_argument("--concurrency", type=int, default=10, help="Concurrent API requests")
    parser.add_argument("--limit", type=int, help="Max jobs to process")
    parser.add_argument("--dry-run", action="store_true", help="Preview only, don't extract")
    args = parser.parse_args()

    # Connect to database
    engine = create_engine(get_database_url())

    with Session(engine) as session:
        # Get jobs to process
        jobs = get_processable_jobs(session, args.limit)
        logger.info(f"Found {len(jobs)} jobs to process (batch={args.batch_size}, concurrency={args.concurrency})")

        if not jobs:
            logger.info("No jobs need processing")
            return

        if args.dry_run:
            logger.info("DRY RUN - Would process these jobs:")
            for job in jobs[:10]:
                logger.info(f"  - {job.id}: {job.title}")
            if len(jobs) > 10:
                logger.info(f"  ... and {len(jobs) - 10} more")
            return

        # Import extractor (needs OpenAI API key)
        from app.services.job_skill_extractor import JobSkillExtractorService

        extractor = JobSkillExtractorService()

        # Split jobs into batches
        batches = [jobs[i:i + args.batch_size] for i in range(0, len(jobs), args.batch_size)]
        logger.info(f"Split into {len(batches)} batches")

        # Concurrency control
        semaphore = asyncio.Semaphore(args.concurrency)
        results_lock = asyncio.Lock()
        results = {"processed": 0, "tokens": 0, "cost": 0.0, "total": len(jobs)}

        # Process all batches concurrently (limited by semaphore)
        tasks = [
            process_batch(batch, extractor, session, semaphore, results_lock, results)
            for batch in batches
        ]

        await asyncio.gather(*tasks)
        await extractor.close()

        logger.info(f"\n{'='*50}")
        logger.info(f"COMPLETE")
        logger.info(f"Jobs processed: {results['processed']}/{results['total']}")
        logger.info(f"Total tokens: {results['tokens']:,}")
        logger.info(f"Total cost: ${results['cost']:.4f}")


if __name__ == "__main__":
    asyncio.run(main())
