"""Add roadmap progress tracking tables and edit mode columns.

Revision ID: 022_add_roadmap_progress_tables
Revises: 021_add_skill_groupings_column
Create Date: 2024-01-26

Creates tables for:
- roadmap_milestone_progress: Track milestone completion status
- roadmap_extras: User-added achievements beyond the roadmap
- roadmap_edits: Audit trail for all roadmap modifications

Adds columns to saved_roadmaps:
- edit_mode: Current editing mode (view, ai_edit, manual_edit)
- has_manual_edits: Whether user has made manual changes
- current_phase_id: Quick access to current phase
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID


revision = "022"
down_revision = "021"
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to saved_roadmaps
    op.add_column(
        "saved_roadmaps",
        sa.Column("edit_mode", sa.String(20), nullable=False, server_default="view")
    )
    op.add_column(
        "saved_roadmaps",
        sa.Column("has_manual_edits", sa.Boolean, nullable=False, server_default="false")
    )
    op.add_column(
        "saved_roadmaps",
        sa.Column("current_phase_id", sa.String(100), nullable=True)
    )

    # Create roadmap_milestone_progress table
    op.create_table(
        "roadmap_milestone_progress",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("roadmap_id", UUID(as_uuid=True), sa.ForeignKey("saved_roadmaps.id", ondelete="CASCADE"), nullable=False),
        sa.Column("milestone_id", sa.String(100), nullable=False),
        sa.Column("phase_id", sa.String(100), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="not_started"),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("idx_milestone_progress_roadmap_id", "roadmap_milestone_progress", ["roadmap_id"])
    op.create_index("idx_milestone_progress_milestone_id", "roadmap_milestone_progress", ["milestone_id"])

    # Create roadmap_extras table
    op.create_table(
        "roadmap_extras",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("roadmap_id", UUID(as_uuid=True), sa.ForeignKey("saved_roadmaps.id", ondelete="CASCADE"), nullable=False),
        sa.Column("phase_id", sa.String(100), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("idx_roadmap_extras_roadmap_id", "roadmap_extras", ["roadmap_id"])
    op.create_index("idx_roadmap_extras_phase_id", "roadmap_extras", ["phase_id"])

    # Create roadmap_edits table
    op.create_table(
        "roadmap_edits",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("roadmap_id", UUID(as_uuid=True), sa.ForeignKey("saved_roadmaps.id", ondelete="CASCADE"), nullable=False),
        sa.Column("edit_type", sa.String(20), nullable=False),
        sa.Column("change_description", sa.Text, nullable=False),
        sa.Column("affected_elements", JSONB, nullable=False, server_default="[]"),
        sa.Column("original_values", JSONB, nullable=False, server_default="{}"),
        sa.Column("new_values", JSONB, nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("idx_roadmap_edits_roadmap_id", "roadmap_edits", ["roadmap_id"])
    op.create_index("idx_roadmap_edits_created_at", "roadmap_edits", ["created_at"])


def downgrade():
    # Drop roadmap_edits table
    op.drop_index("idx_roadmap_edits_created_at", table_name="roadmap_edits")
    op.drop_index("idx_roadmap_edits_roadmap_id", table_name="roadmap_edits")
    op.drop_table("roadmap_edits")

    # Drop roadmap_extras table
    op.drop_index("idx_roadmap_extras_phase_id", table_name="roadmap_extras")
    op.drop_index("idx_roadmap_extras_roadmap_id", table_name="roadmap_extras")
    op.drop_table("roadmap_extras")

    # Drop roadmap_milestone_progress table
    op.drop_index("idx_milestone_progress_milestone_id", table_name="roadmap_milestone_progress")
    op.drop_index("idx_milestone_progress_roadmap_id", table_name="roadmap_milestone_progress")
    op.drop_table("roadmap_milestone_progress")

    # Remove columns from saved_roadmaps
    op.drop_column("saved_roadmaps", "current_phase_id")
    op.drop_column("saved_roadmaps", "has_manual_edits")
    op.drop_column("saved_roadmaps", "edit_mode")
