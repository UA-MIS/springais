"""Backfill missing job_postings columns for seed data.

Revision ID: 010
Revises: 009
Create Date: 2026-01-20
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision = "010"
down_revision = "009"
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
        "experience_years_min",
        sa.Column("experience_years_min", sa.Integer(), nullable=True),
    )
    _add_column_if_missing(
        "job_postings",
        "experience_years_max",
        sa.Column("experience_years_max", sa.Integer(), nullable=True),
    )
    _add_column_if_missing(
        "job_postings",
        "posting_url",
        sa.Column("posting_url", sa.String(), nullable=True),
    )
    _add_column_if_missing(
        "job_postings",
        "scraped_at",
        sa.Column("scraped_at", sa.DateTime(timezone=True), nullable=True),
    )
    _add_column_if_missing(
        "job_postings",
        "required_skills",
        sa.Column("required_skills", JSONB(), nullable=True),
    )
    _add_column_if_missing(
        "job_postings",
        "preferred_skills",
        sa.Column("preferred_skills", JSONB(), nullable=True),
    )


def downgrade() -> None:
    # No-op: this is a defensive patch for missing columns
    pass
