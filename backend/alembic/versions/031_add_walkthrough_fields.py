"""Add walkthrough_step and walkthrough_completed fields to user_progression.

These fields track the onboarding walkthrough (Cedric Avatar System).
- walkthrough_step: Current step (0-7), 0 = not started
- walkthrough_completed: Whether walkthrough has been completed or skipped

Revision ID: 031
Revises: 030
Create Date: 2026-02-12
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "031"
down_revision = "030"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "user_progression",
        sa.Column("walkthrough_step", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "user_progression",
        sa.Column(
            "walkthrough_completed", sa.Boolean(), nullable=False, server_default="false"
        ),
    )


def downgrade() -> None:
    op.drop_column("user_progression", "walkthrough_completed")
    op.drop_column("user_progression", "walkthrough_step")
