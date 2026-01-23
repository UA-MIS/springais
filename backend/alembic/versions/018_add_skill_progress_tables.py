"""Add skill progress tables.

Revision ID: 018
Revises: 017
Create Date: 2026-01-23
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = "018"
down_revision = "017"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    existing_tables = inspector.get_table_names()

    # Create user_skills table
    if "user_skills" not in existing_tables:
        op.create_table(
            "user_skills",
            sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False),
            sa.Column("skill_name", sa.String(255), nullable=False),
            sa.Column("category", sa.String(50), nullable=False),
            sa.Column("status", sa.String(20), server_default="not_started"),
            sa.Column("proficiency_level", sa.Integer, server_default="0"),
            sa.Column("started_at", sa.DateTime(timezone=True)),
            sa.Column("completed_at", sa.DateTime(timezone=True)),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )
        op.create_index("idx_user_skill_user_id", "user_skills", ["user_id"])
        op.create_index("idx_user_skill_name", "user_skills", ["user_id", "skill_name"], unique=True)

    # Create skill_modules table
    if "skill_modules" not in existing_tables:
        op.create_table(
            "skill_modules",
            sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column("skill_name", sa.String(255), nullable=False),
            sa.Column("module_number", sa.Integer, nullable=False),
            sa.Column("title", sa.String(255), nullable=False),
            sa.Column("description", sa.Text),
            sa.Column("sequence_order", sa.Integer, nullable=False),
            sa.Column("estimated_hours", sa.Integer),
            sa.Column("resources", JSONB, server_default="[]"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )
        op.create_index("idx_skill_module_name", "skill_modules", ["skill_name"])
        op.create_index("idx_skill_module_order", "skill_modules", ["skill_name", "sequence_order"], unique=True)

    # Create user_module_progress table
    if "user_module_progress" not in existing_tables:
        op.create_table(
            "user_module_progress",
            sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column("user_skill_id", UUID(as_uuid=True), sa.ForeignKey("user_skills.id", ondelete="CASCADE"), nullable=False),
            sa.Column("module_id", UUID(as_uuid=True), sa.ForeignKey("skill_modules.id", ondelete="CASCADE"), nullable=False),
            sa.Column("status", sa.String(20), server_default="not_started"),
            sa.Column("progress_percentage", sa.Integer, server_default="0"),
            sa.Column("started_at", sa.DateTime(timezone=True)),
            sa.Column("completed_at", sa.DateTime(timezone=True)),
            sa.Column("notes", sa.Text),
            sa.Column("metadata", JSONB, server_default="{}"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )
        op.create_index("idx_user_module_skill", "user_module_progress", ["user_skill_id"])
        op.create_index("idx_user_module_unique", "user_module_progress", ["user_skill_id", "module_id"], unique=True)


def downgrade() -> None:
    op.drop_table("user_module_progress")
    op.drop_table("skill_modules")
    op.drop_table("user_skills")
