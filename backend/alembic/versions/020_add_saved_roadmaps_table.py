"""Add saved_roadmaps table for storing generated career roadmaps.

Revision ID: 020_add_saved_roadmaps_table
Revises: 019_make_match_employee_id_nullable
Create Date: 2024-01-23

Stores generated career roadmaps with key fields for querying
and full roadmap data as JSONB for flexibility.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID


revision = "020"
down_revision = "019"
branch_labels = None
depends_on = None


def upgrade():
    # Check if table already exists (for idempotency)
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if "saved_roadmaps" not in tables:
        op.create_table(
            "saved_roadmaps",
            sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False),
            sa.Column("title", sa.String(255), nullable=False, server_default="Career Roadmap"),
            sa.Column("target_role_titles", JSONB, nullable=False, server_default="[]"),
            sa.Column("total_phases", sa.Integer, nullable=False, server_default="0"),
            sa.Column("total_milestones", sa.Integer, nullable=False, server_default="0"),
            sa.Column("total_estimated_months", sa.Integer, nullable=False, server_default="0"),
            sa.Column("emphasis", sa.String(50), nullable=False, server_default="balanced"),
            sa.Column("executive_summary", sa.Text, nullable=True),
            sa.Column("roadmap_data", JSONB, nullable=False),
            sa.Column("generated_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )

    # Create indexes if they don't exist
    if "saved_roadmaps" in tables:
        indexes = [idx["name"] for idx in inspector.get_indexes("saved_roadmaps")]
        
        if "idx_saved_roadmaps_user_id" not in indexes:
            try:
                op.create_index("idx_saved_roadmaps_user_id", "saved_roadmaps", ["user_id"])
            except Exception:
                pass  # Index might already exist
        
        if "idx_saved_roadmaps_created_at" not in indexes:
            try:
                op.create_index("idx_saved_roadmaps_created_at", "saved_roadmaps", ["created_at"])
            except Exception:
                pass  # Index might already exist
    else:
        # Create indexes when creating new table
        op.create_index("idx_saved_roadmaps_user_id", "saved_roadmaps", ["user_id"])
        op.create_index("idx_saved_roadmaps_created_at", "saved_roadmaps", ["created_at"])


def downgrade():
    op.drop_index("idx_saved_roadmaps_created_at", table_name="saved_roadmaps")
    op.drop_index("idx_saved_roadmaps_user_id", table_name="saved_roadmaps")
    op.drop_table("saved_roadmaps")
