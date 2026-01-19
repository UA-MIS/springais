"""Add performance indexes.

Revision ID: 002
Revises: 001
Create Date: 2026-01-19
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Employee indexes
    op.create_index("idx_employee_service_line", "employees", ["service_line"])
    op.create_index("idx_employee_current_role", "employees", ["current_role"])
    op.create_index("idx_employee_role_level", "employees", ["role_level"])
    op.create_index(
        "idx_employee_skills",
        "employees",
        ["skills"],
        postgresql_using="gin",
    )

    # Job posting indexes
    op.create_index("idx_job_posting_service_line", "job_postings", ["service_line"])
    op.create_index(
        "idx_job_posting_created_at",
        "job_postings",
        ["created_at"],
        postgresql_using="brin",
    )
    op.create_index(
        "idx_job_posting_external_id",
        "job_postings",
        ["external_id"],
        unique=True,
    )
    op.create_index(
        "idx_job_posting_required_skills",
        "job_postings",
        ["required_skills"],
        postgresql_using="gin",
    )

    # Match indexes
    op.create_index("idx_match_employee_id", "matches", ["employee_id"])
    op.create_index("idx_match_job_posting_id", "matches", ["job_posting_id"])
    op.create_index(
        "idx_match_user_score",
        "matches",
        ["user_id", sa.text("overall_score DESC")],
    )
    op.create_index("idx_match_mode", "matches", ["match_mode"])

    # Skill embedding indexes
    op.create_index(
        "idx_skill_embedding_normalized",
        "skill_embeddings",
        ["normalized_text"],
    )
    op.create_index(
        "idx_skill_embedding_vector",
        "skill_embeddings",
        ["embedding"],
        postgresql_using="hnsw",
        postgresql_ops={"embedding": "vector_cosine_ops"},
    )
    op.create_index(
        "idx_skill_embedding_source",
        "skill_embeddings",
        ["source_type", "source_id"],
    )

    # User profile indexes
    op.create_index("idx_user_profile_email", "user_profiles", ["email"], unique=True)
    op.create_index(
        "idx_user_profile_target_service_line",
        "user_profiles",
        ["target_service_line"],
    )
    op.create_index(
        "idx_user_profile_skills",
        "user_profiles",
        ["skills"],
        postgresql_using="gin",
    )

    # Career path indexes
    op.create_index("idx_career_path_user_id", "career_paths", ["user_id"], unique=True)


def downgrade() -> None:
    # Drop indexes (reverse order)
    op.drop_index("idx_career_path_user_id", table_name="career_paths")
    op.drop_index("idx_user_profile_skills", table_name="user_profiles")
    op.drop_index("idx_user_profile_target_service_line", table_name="user_profiles")
    op.drop_index("idx_user_profile_email", table_name="user_profiles")
    op.drop_index("idx_skill_embedding_source", table_name="skill_embeddings")
    op.drop_index("idx_skill_embedding_vector", table_name="skill_embeddings")
    op.drop_index("idx_skill_embedding_normalized", table_name="skill_embeddings")
    op.drop_index("idx_match_mode", table_name="matches")
    op.drop_index("idx_match_user_score", table_name="matches")
    op.drop_index("idx_match_job_posting_id", table_name="matches")
    op.drop_index("idx_match_employee_id", table_name="matches")
    op.drop_index("idx_job_posting_required_skills", table_name="job_postings")
    op.drop_index("idx_job_posting_external_id", table_name="job_postings")
    op.drop_index("idx_job_posting_created_at", table_name="job_postings")
    op.drop_index("idx_job_posting_service_line", table_name="job_postings")
    op.drop_index("idx_employee_skills", table_name="employees")
    op.drop_index("idx_employee_role_level", table_name="employees")
    op.drop_index("idx_employee_current_role", table_name="employees")
    op.drop_index("idx_employee_service_line", table_name="employees")
