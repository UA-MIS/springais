"""Backfill missing job_postings columns used by model.

Revision ID: 011
Revises: 010
Create Date: 2026-01-20
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects.postgresql import JSONB, TSVECTOR

# revision identifiers, used by Alembic.
revision = "011"
down_revision = "010"
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
        "tags",
        sa.Column("tags", JSONB(), nullable=True),
    )
    _add_column_if_missing(
        "job_postings",
        "source_locale",
        sa.Column("source_locale", sa.String(), nullable=True),
    )
    _add_column_if_missing(
        "job_postings",
        "responsibilities_text",
        sa.Column("responsibilities_text", sa.Text(), nullable=True),
    )
    _add_column_if_missing(
        "job_postings",
        "requirements_text",
        sa.Column("requirements_text", sa.Text(), nullable=True),
    )
    _add_column_if_missing(
        "job_postings",
        "preferred_text",
        sa.Column("preferred_text", sa.Text(), nullable=True),
    )
    _add_column_if_missing(
        "job_postings",
        "last_seen_at",
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
    )
    _add_column_if_missing(
        "job_postings",
        "closed_at",
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
    )
    _add_column_if_missing(
        "job_postings",
        "is_active",
        sa.Column("is_active", sa.Boolean(), nullable=True),
    )
    _add_column_if_missing(
        "job_postings",
        "search_vector",
        sa.Column("search_vector", TSVECTOR(), nullable=True),
    )


def downgrade() -> None:
    # No-op: defensive patch for missing columns
    pass
