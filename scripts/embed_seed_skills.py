#!/usr/bin/env python3
"""
Generate skill embeddings for the skills actually present in the seeded data.

Why this exists
---------------
scripts/generate_all_embeddings.py --type skills collects skill names ONLY from
the LLM-extraction columns (job_postings.llm_required_skills /
llm_inferred_skills / llm_listed_skills). Those columns are populated by a
separate LLM skill-extraction pass, so on a freshly seeded database they are all
NULL and that script embeds nothing.

Meanwhile MatchingService._build_skill_embeddings() reads embeddings ONLY from
the skill_embeddings table. So with an empty table the semantic/vector leg of
matching never contributes and scoring silently falls back to the skill
taxonomy plus exact/fuzzy token overlap.

This script closes that gap: it collects the distinct skill strings that are
really in employees.skills and job_postings.required_skills/preferred_skills,
embeds them with the same EmbeddingService (text-embedding-3-large + PCA to
1536 dims) and writes them to skill_embeddings using the same schema and
model tag as the batch script.

Requires OPENAI_API_KEY. Bounded and cheap: the seeded corpus has roughly 200
distinct short skill strings.

Usage (inside the backend container):
    docker exec springais-backend python /app/scripts/embed_seed_skills.py
    docker exec springais-backend python /app/scripts/embed_seed_skills.py --dry-run
"""

import argparse
import asyncio
import logging
import os
import sys
from pathlib import Path

backend_path = Path(__file__).parent.parent / "backend"
if (backend_path / "app").exists():
    sys.path.insert(0, str(backend_path))
else:
    sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

BATCH_SIZE = 64


def get_database_url() -> str:
    return os.environ.get(
        "DATABASE_URL",
        "postgresql+psycopg://postgres:postgres@localhost:5432/springais",
    )


def collect_seed_skills(session: Session) -> list[str]:
    """Distinct skill strings from the seeded employees and job postings."""
    rows = session.execute(text("""
        WITH all_skills AS (
            SELECT DISTINCT jsonb_array_elements_text(skills) AS skill
            FROM employees
            WHERE jsonb_typeof(skills) = 'array'
            UNION
            SELECT DISTINCT jsonb_array_elements_text(required_skills) AS skill
            FROM job_postings
            WHERE jsonb_typeof(required_skills) = 'array'
            UNION
            SELECT DISTINCT jsonb_array_elements_text(preferred_skills) AS skill
            FROM job_postings
            WHERE jsonb_typeof(preferred_skills) = 'array'
        )
        SELECT skill FROM all_skills
        WHERE skill IS NOT NULL AND length(trim(skill)) > 0
        ORDER BY skill
    """)).fetchall()
    return [r[0] for r in rows]


async def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true",
                    help="List the skills that would be embedded, call no APIs.")
    args = ap.parse_args()

    engine = create_engine(get_database_url())
    with Session(engine) as session:
        skills = collect_seed_skills(session)
        logger.info("Distinct seed skills found: %d", len(skills))

        if args.dry_run:
            for s in skills:
                print(" ", s)
            return 0

        if not skills:
            logger.warning("No skills found - is the seed data loaded?")
            return 1

        from app.config import get_openai_client, get_redis_client
        from app.services.embedding_service import EmbeddingService
        from app.utils.text import normalize_skill_text

        redis_client = await get_redis_client()
        service = EmbeddingService(get_openai_client(), redis_client, session)

        # Skip anything already embedded so the script is safely re-runnable.
        existing = {
            r[0] for r in session.execute(text(
                "SELECT normalized_text FROM skill_embeddings"
            )).fetchall()
        }
        todo = [s for s in skills if normalize_skill_text(s) not in existing]
        logger.info("Already embedded: %d | to embed: %d", len(existing), len(todo))

        processed = 0
        for i in range(0, len(todo), BATCH_SIZE):
            batch = todo[i:i + BATCH_SIZE]
            try:
                embeddings = await service.embed_skills_batch(batch)
                for skill, embedding in embeddings.items():
                    normalized = normalize_skill_text(skill)
                    if normalized in existing:
                        continue
                    session.execute(text("""
                        INSERT INTO skill_embeddings
                            (skill_text, normalized_text, embedding,
                             source_type, source_id, embedding_model)
                        VALUES
                            (:skill_text, :normalized, :embedding,
                             'global', 'seed_script', 'text-embedding-3-large-pca')
                    """), {
                        "skill_text": skill,
                        "normalized": normalized,
                        "embedding": str(embedding),
                    })
                    existing.add(normalized)
                session.commit()
                processed += len(batch)
                logger.info("Embedded %d/%d", processed, len(todo))
            except Exception as exc:
                session.rollback()
                logger.error("Batch failed: %s", exc)
                return 1

        total = session.execute(text("SELECT count(*) FROM skill_embeddings")).scalar()
        logger.info("Done. skill_embeddings now holds %s rows.", total)
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
