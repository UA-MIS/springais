"""Add job posting tags + sectioned text + source locale.

Revision ID: 005
Revises: 004
Create Date: 2026-01-19
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "job_postings",
        sa.Column(
            "tags",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
    )
    op.add_column("job_postings", sa.Column("source_locale", sa.String(), nullable=True))

    op.add_column("job_postings", sa.Column("responsibilities_text", sa.Text(), nullable=True))
    op.add_column("job_postings", sa.Column("requirements_text", sa.Text(), nullable=True))
    op.add_column("job_postings", sa.Column("preferred_text", sa.Text(), nullable=True))

    op.create_index("idx_job_posting_tags", "job_postings", ["tags"], postgresql_using="gin")

    # Backfill tags to [] (server_default handles new rows; this handles existing)
    op.execute("UPDATE job_postings SET tags = '[]'::jsonb WHERE tags IS NULL;")


def downgrade() -> None:
    op.drop_index("idx_job_posting_tags", table_name="job_postings")
    op.drop_column("job_postings", "preferred_text")
    op.drop_column("job_postings", "requirements_text")
    op.drop_column("job_postings", "responsibilities_text")
    op.drop_column("job_postings", "source_locale")
    op.drop_column("job_postings", "tags")

