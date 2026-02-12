"""Add transferable_skills column to matches table.

Adds:
- matches: transferable_skills (JSONB array of transferable/related skills)

Revision ID: 028
Revises: 027
Create Date: 2026-02-11
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision = "028"
down_revision = "027"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "matches",
        sa.Column("transferable_skills", JSONB, server_default="[]", nullable=False)
    )


def downgrade() -> None:
    op.drop_column("matches", "transferable_skills")
