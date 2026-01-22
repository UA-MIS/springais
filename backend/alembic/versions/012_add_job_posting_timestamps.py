"""Backfill job_postings created_at/updated_at if missing.

Revision ID: 012
Revises: 011
Create Date: 2026-01-20
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = "012"
down_revision = "011"
branch_labels = None
depends_on = None


def _add_column_if_missing(table: str, name: str, column: sa.Column) -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = {col["name"] for col in inspector.get_columns(table)}
    if name not in columns:
        op.add_column(table, column)


def upgrade() -> None:
    _add_column_if_missing(
        "job_postings",
        "created_at",
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
    )
    _add_column_if_missing(
        "job_postings",
        "updated_at",
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    conn = op.get_bind()
    conn.execute(sa.text(
        "UPDATE job_postings "
        "SET created_at = COALESCE(created_at, now()), "
        "    updated_at = COALESCE(updated_at, now())"
    ))

    op.alter_column("job_postings", "created_at", nullable=False, server_default=sa.text("now()"))
    op.alter_column("job_postings", "updated_at", nullable=False, server_default=sa.text("now()"))


def downgrade() -> None:
    # No-op: defensive patch for missing columns
    pass
