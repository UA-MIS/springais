"""Add user_skill_recommendations table.

Revision ID: 007
Revises: 006
Create Date: 2026-01-20
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_skill_recommendations",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user_profiles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("skill_name", sa.String(), nullable=False),
        sa.Column("category", sa.String()),
        sa.Column("priority_score", sa.Numeric(), server_default="0.5", nullable=False),
        sa.Column("source", sa.String(), nullable=False),
        sa.Column("related_job_ids", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("status", sa.String(), server_default="recommended", nullable=False),
        sa.Column("user_notes", sa.Text()),
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

    op.create_index(
        "idx_skill_rec_user_id",
        "user_skill_recommendations",
        ["user_id"],
    )
    op.create_index(
        "idx_skill_rec_priority",
        "user_skill_recommendations",
        ["user_id", "priority_score"],
    )


def downgrade() -> None:
    op.drop_index("idx_skill_rec_priority", table_name="user_skill_recommendations")
    op.drop_index("idx_skill_rec_user_id", table_name="user_skill_recommendations")
    op.drop_table("user_skill_recommendations")
