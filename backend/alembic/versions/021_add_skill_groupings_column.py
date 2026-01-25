"""Add skill_groupings column to user_profiles

Revision ID: 021
Revises: 020
Create Date: 2024-01-24

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision = "021"
down_revision = "020"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add skill_groupings column to user_profiles
    op.add_column(
        "user_profiles",
        sa.Column("skill_groupings", JSONB, nullable=True, server_default="{}")
    )


def downgrade() -> None:
    op.drop_column("user_profiles", "skill_groupings")
