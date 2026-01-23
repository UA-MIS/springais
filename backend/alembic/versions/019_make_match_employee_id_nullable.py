"""Make employee_id nullable in matches table.

Revision ID: 019_make_match_employee_id_nullable
Revises: 018_add_skill_progress_tables
Create Date: 2024-01-23

This allows user-based saves without requiring a link to the employees table.
"""
from alembic import op
import sqlalchemy as sa


revision = "019"
down_revision = "018"
branch_labels = None
depends_on = None


def upgrade():
    # Make employee_id nullable
    op.alter_column(
        "matches",
        "employee_id",
        existing_type=sa.String(),
        nullable=True,
    )


def downgrade():
    # Make employee_id non-nullable again
    # Note: This will fail if there are rows with NULL employee_id
    op.alter_column(
        "matches",
        "employee_id",
        existing_type=sa.String(),
        nullable=False,
    )
