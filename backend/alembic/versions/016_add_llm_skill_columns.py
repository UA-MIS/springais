"""Add LLM skill extraction columns and embedding columns.

Revision ID: 016
Revises: 015
Create Date: 2026-01-20
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = "016"
down_revision = "015"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)

    # Get existing columns for job_postings
    job_columns = {col["name"] for col in inspector.get_columns("job_postings")}

    # Add LLM-extracted skill columns to job_postings
    if "llm_required_skills" not in job_columns:
        op.add_column(
            "job_postings",
            sa.Column("llm_required_skills", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        )

    if "llm_inferred_skills" not in job_columns:
        op.add_column(
            "job_postings",
            sa.Column("llm_inferred_skills", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        )

    if "llm_experience_years_min" not in job_columns:
        op.add_column(
            "job_postings",
            sa.Column("llm_experience_years_min", sa.Integer(), nullable=True),
        )

    if "llm_experience_years_max" not in job_columns:
        op.add_column(
            "job_postings",
            sa.Column("llm_experience_years_max", sa.Integer(), nullable=True),
        )

    if "llm_primary_domain" not in job_columns:
        op.add_column(
            "job_postings",
            sa.Column("llm_primary_domain", sa.String(100), nullable=True),
        )

    if "skill_extraction_hash" not in job_columns:
        op.add_column(
            "job_postings",
            sa.Column("skill_extraction_hash", sa.String(64), nullable=True),
        )

    if "skills_extracted_at" not in job_columns:
        op.add_column(
            "job_postings",
            sa.Column("skills_extracted_at", sa.DateTime(timezone=True), nullable=True),
        )

    # Add embedding columns to job_postings (using raw SQL for vector type)
    if "description_embedding" not in job_columns:
        op.execute("ALTER TABLE job_postings ADD COLUMN description_embedding vector(1536)")

    if "title_embedding" not in job_columns:
        op.execute("ALTER TABLE job_postings ADD COLUMN title_embedding vector(1536)")

    # Create indexes for vector search
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_job_desc_embedding
        ON job_postings USING hnsw(description_embedding vector_cosine_ops)
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_job_title_embedding
        ON job_postings USING hnsw(title_embedding vector_cosine_ops)
    """)

    # Index for skill extraction hash (for caching lookups)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_job_skill_extraction_hash
        ON job_postings(skill_extraction_hash)
    """)

    # Get existing columns for user_profiles
    user_columns = {col["name"] for col in inspector.get_columns("user_profiles")}

    # Add LLM skill columns to user_profiles
    if "llm_listed_skills" not in user_columns:
        op.add_column(
            "user_profiles",
            sa.Column("llm_listed_skills", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        )

    if "llm_inferred_skills" not in user_columns:
        op.add_column(
            "user_profiles",
            sa.Column("llm_inferred_skills", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        )

    # Add embedding column to user_profiles
    if "resume_embedding" not in user_columns:
        op.execute("ALTER TABLE user_profiles ADD COLUMN resume_embedding vector(1536)")

    # Create index for user resume embedding
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_user_resume_embedding
        ON user_profiles USING hnsw(resume_embedding vector_cosine_ops)
    """)


def downgrade() -> None:
    # Drop indexes first
    op.execute("DROP INDEX IF EXISTS idx_user_resume_embedding")
    op.execute("DROP INDEX IF EXISTS idx_job_skill_extraction_hash")
    op.execute("DROP INDEX IF EXISTS idx_job_title_embedding")
    op.execute("DROP INDEX IF EXISTS idx_job_desc_embedding")

    # Drop user_profiles columns
    op.drop_column("user_profiles", "resume_embedding")
    op.drop_column("user_profiles", "llm_inferred_skills")
    op.drop_column("user_profiles", "llm_listed_skills")

    # Drop job_postings columns
    op.drop_column("job_postings", "title_embedding")
    op.drop_column("job_postings", "description_embedding")
    op.drop_column("job_postings", "skills_extracted_at")
    op.drop_column("job_postings", "skill_extraction_hash")
    op.drop_column("job_postings", "llm_primary_domain")
    op.drop_column("job_postings", "llm_experience_years_max")
    op.drop_column("job_postings", "llm_experience_years_min")
    op.drop_column("job_postings", "llm_inferred_skills")
    op.drop_column("job_postings", "llm_required_skills")
