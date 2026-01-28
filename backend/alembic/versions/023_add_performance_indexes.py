"""Add performance indexes for location filtering and experience range.

Revision ID: 023
Revises: 022
Create Date: 2026-01-27

These indexes optimize:
1. Location-based filtering (most common filter)
2. Experience range filtering
3. Active US jobs query (partial index)
4. LLM-extracted skills (JSONB)
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "023"
down_revision = "022"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Index for location filtering (most common filter)
    # Uses expression index on lowercased location
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_job_posting_location_lower
        ON job_postings (LOWER(location));
    """)

    # Index for experience range filtering
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_job_posting_experience_range
        ON job_postings (experience_years_min, experience_years_max);
    """)

    # Index for LLM experience range
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_job_posting_llm_experience_range
        ON job_postings (llm_experience_years_min, llm_experience_years_max);
    """)

    # Composite index for active jobs filtering
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_job_posting_active_service_line
        ON job_postings (is_active, service_line);
    """)

    # GIN index for LLM-extracted skills (JSONB)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_job_posting_llm_skills
        ON job_postings USING GIN (llm_required_skills);
    """)

    # GIN index for LLM-inferred skills (JSONB)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_job_posting_llm_inferred
        ON job_postings USING GIN (llm_inferred_skills);
    """)

    # Partial index for active jobs only (smaller, faster)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_job_posting_active_only
        ON job_postings (id, service_line, location)
        WHERE is_active = true;
    """)

    # Index on skill_embeddings updated_at for cache versioning
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_skill_embedding_updated_at
        ON skill_embeddings (updated_at DESC);
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_skill_embedding_updated_at;")
    op.execute("DROP INDEX IF EXISTS idx_job_posting_active_only;")
    op.execute("DROP INDEX IF EXISTS idx_job_posting_llm_inferred;")
    op.execute("DROP INDEX IF EXISTS idx_job_posting_llm_skills;")
    op.execute("DROP INDEX IF EXISTS idx_job_posting_active_service_line;")
    op.execute("DROP INDEX IF EXISTS idx_job_posting_llm_experience_range;")
    op.execute("DROP INDEX IF EXISTS idx_job_posting_experience_range;")
    op.execute("DROP INDEX IF EXISTS idx_job_posting_location_lower;")
