"""Add hiring manager tables and account type.

Revision ID: 026
Revises: 025
Create Date: 2026-02-04
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import inspect

revision = "026"
down_revision = "025"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    existing_tables = inspector.get_table_names()

    # Check existing columns in user_profiles
    existing_columns = [col['name'] for col in inspector.get_columns('user_profiles')]

    # Add account_type to user_profiles if not exists
    if 'account_type' not in existing_columns:
        op.add_column(
            'user_profiles',
            sa.Column(
                'account_type',
                sa.String(20),
                server_default='personal',
                nullable=False
            )
        )
        op.create_index(
            'idx_user_profile_account_type',
            'user_profiles',
            ['account_type']
        )

    # Create hm_saved_jobs table (HM's "My Jobs" list)
    if "hm_saved_jobs" not in existing_tables:
        op.create_table(
            "hm_saved_jobs",
            sa.Column(
                "id",
                UUID(as_uuid=True),
                primary_key=True,
                server_default=sa.text("gen_random_uuid()")
            ),
            sa.Column(
                "hm_user_id",
                UUID(as_uuid=True),
                sa.ForeignKey("user_profiles.id", ondelete="CASCADE"),
                nullable=False
            ),
            sa.Column(
                "job_posting_id",
                sa.String,
                sa.ForeignKey("job_postings.id", ondelete="CASCADE"),
                nullable=False
            ),
            sa.Column("notes", sa.Text),  # HM's private notes about this position
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False
            ),
        )
        op.create_index(
            "idx_hm_saved_jobs_user",
            "hm_saved_jobs",
            ["hm_user_id"]
        )
        op.create_index(
            "idx_hm_saved_jobs_job",
            "hm_saved_jobs",
            ["job_posting_id"]
        )
        op.create_index(
            "idx_hm_saved_jobs_unique",
            "hm_saved_jobs",
            ["hm_user_id", "job_posting_id"],
            unique=True
        )


def downgrade() -> None:
    op.drop_table("hm_saved_jobs")
    op.drop_index("idx_user_profile_account_type")
    op.drop_column("user_profiles", "account_type")
