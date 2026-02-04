"""Add proficiency scale and proof of completion fields.

Adds:
- user_skills: source, last_updated_at
- skill_modules: learning_content, external_resources, ey_resources, skill_type
- user_module_progress: completion_type, proof_description, proof_link,
  proof_file_data, proof_file_name, proof_file_type, ai_feedback

Revision ID: 024
Revises: 023
Create Date: 2026-02-02
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision = "024"
down_revision = "023"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # user_skills: Add source and last_updated_at
    op.add_column(
        "user_skills",
        sa.Column("source", sa.String(20), server_default="manual", nullable=False)
    )
    op.add_column(
        "user_skills",
        sa.Column("last_updated_at", sa.DateTime(timezone=True), nullable=True)
    )

    # skill_modules: Add learning content and resource fields
    op.add_column(
        "skill_modules",
        sa.Column("learning_content", sa.Text(), nullable=True)
    )
    op.add_column(
        "skill_modules",
        sa.Column("external_resources", JSONB, server_default="[]", nullable=False)
    )
    op.add_column(
        "skill_modules",
        sa.Column("ey_resources", JSONB, server_default="[]", nullable=False)
    )
    op.add_column(
        "skill_modules",
        sa.Column("skill_type", sa.String(20), server_default="technical", nullable=False)
    )

    # user_module_progress: Add proof of completion fields
    op.add_column(
        "user_module_progress",
        sa.Column("completion_type", sa.String(20), server_default="self_reported", nullable=False)
    )
    op.add_column(
        "user_module_progress",
        sa.Column("proof_description", sa.Text(), nullable=True)
    )
    op.add_column(
        "user_module_progress",
        sa.Column("proof_link", sa.String(500), nullable=True)
    )
    op.add_column(
        "user_module_progress",
        sa.Column("proof_file_data", sa.LargeBinary(), nullable=True)
    )
    op.add_column(
        "user_module_progress",
        sa.Column("proof_file_name", sa.String(255), nullable=True)
    )
    op.add_column(
        "user_module_progress",
        sa.Column("proof_file_type", sa.String(100), nullable=True)
    )
    op.add_column(
        "user_module_progress",
        sa.Column("ai_feedback", sa.Text(), nullable=True)
    )


def downgrade() -> None:
    # user_module_progress
    op.drop_column("user_module_progress", "ai_feedback")
    op.drop_column("user_module_progress", "proof_file_type")
    op.drop_column("user_module_progress", "proof_file_name")
    op.drop_column("user_module_progress", "proof_file_data")
    op.drop_column("user_module_progress", "proof_link")
    op.drop_column("user_module_progress", "proof_description")
    op.drop_column("user_module_progress", "completion_type")

    # skill_modules
    op.drop_column("skill_modules", "skill_type")
    op.drop_column("skill_modules", "ey_resources")
    op.drop_column("skill_modules", "external_resources")
    op.drop_column("skill_modules", "learning_content")

    # user_skills
    op.drop_column("user_skills", "last_updated_at")
    op.drop_column("user_skills", "source")
