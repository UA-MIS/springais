"""Initial schema baseline.

Revision ID: 001
Revises:
Create Date: 2026-01-19
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    op.create_table(
        "employees",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("service_line", sa.String(), nullable=False),
        sa.Column("current_role", sa.String(), nullable=False),
        sa.Column("role_level", sa.Integer(), nullable=False),
        sa.Column("years_experience", sa.Numeric(), nullable=False),
        sa.Column("skills", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column(
            "performance_metrics",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column(
            "feedback_themes",
            postgresql.ARRAY(sa.String()),
            nullable=False,
        ),
        sa.Column("notable_achievement", sa.Text()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    op.create_table(
        "job_postings",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("external_id", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("service_line", sa.String(), nullable=False),
        sa.Column("location", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column(
            "required_skills",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column(
            "preferred_skills",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column("experience_years_min", sa.Integer()),
        sa.Column("experience_years_max", sa.Integer()),
        sa.Column("posting_url", sa.String()),
        sa.Column("scraped_at", sa.DateTime(timezone=True)),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint("external_id"),
    )

    op.create_table(
        "user_profiles",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("full_name", sa.String()),
        sa.Column("current_role", sa.String()),
        sa.Column("years_experience", sa.Numeric()),
        sa.Column("target_service_line", sa.String()),
        sa.Column("skills", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("resume_text", sa.Text()),
        sa.Column("resume_file_url", sa.String()),
        sa.Column(
            "skill_assessment_scores",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column("onboarding_complete", sa.Boolean(), nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True)),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint("email"),
    )

    op.create_table(
        "career_paths",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("current_position_node_id", sa.String()),
        sa.Column("target_position_node_id", sa.String()),
        sa.Column("graph_data", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column(
            "progression_status",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column("last_updated_at", sa.DateTime(timezone=True)),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint("user_id"),
    )

    op.create_table(
        "skill_embeddings",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("skill_text", sa.String(), nullable=False),
        sa.Column("normalized_text", sa.String(), nullable=False),
        sa.Column("embedding", Vector(1536), nullable=False),
        sa.Column("source_type", sa.String(), nullable=False),
        sa.Column("source_id", sa.String(), nullable=False),
        sa.Column("embedding_model", sa.String(), nullable=False),
        sa.Column("token_count", sa.Integer()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    op.create_table(
        "matches",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("employee_id", sa.String(), nullable=False),
        sa.Column("job_posting_id", sa.String(), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True)),
        sa.Column("match_mode", sa.String(), nullable=False),
        sa.Column("overall_score", sa.Numeric(), nullable=False),
        sa.Column("skill_match_score", sa.Numeric(), nullable=False),
        sa.Column("experience_score", sa.Numeric(), nullable=False),
        sa.Column("growth_potential_score", sa.Numeric(), nullable=False),
        sa.Column(
            "skill_gaps",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column(
            "matched_skills",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column("explanation", sa.Text()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("matches")
    op.drop_table("skill_embeddings")
    op.drop_table("career_paths")
    op.drop_table("user_profiles")
    op.drop_table("job_postings")
    op.drop_table("employees")
