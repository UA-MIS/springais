"""Add tasks_completed field for tracking individual tasks within modules.

Adds:
- user_module_progress: tasks_completed (JSONB array of completed task indices)

Revision ID: 025
Revises: 024
Create Date: 2026-02-02
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision = "025"
down_revision = "024"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # user_module_progress: Add tasks_completed for tracking individual tasks
    op.add_column(
        "user_module_progress",
        sa.Column("tasks_completed", JSONB, server_default="[]", nullable=False)
    )


def downgrade() -> None:
    op.drop_column("user_module_progress", "tasks_completed")
