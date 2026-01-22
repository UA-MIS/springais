"""Add missing employees.updated_at column.

Revision ID: 014
Revises: 013
Create Date: 2026-01-20
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = "014"
down_revision = "013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = {col["name"] for col in inspector.get_columns("employees")}
    if "updated_at" not in columns:
        op.add_column(
            "employees",
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        )
        conn.execute(sa.text("UPDATE employees SET updated_at = COALESCE(updated_at, now())"))
        op.alter_column("employees", "updated_at", nullable=False, server_default=sa.text("now()"))


def downgrade() -> None:
    # No-op: defensive patch for missing columns
    pass
