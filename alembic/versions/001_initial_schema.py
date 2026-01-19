"""Initial schema baseline.

Revision ID: 001
Revises: 
Create Date: 2026-01-19
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Baseline migration - schema created in STEP-1-SETUP.
    pass


def downgrade() -> None:
    # No-op baseline downgrade.
    pass
