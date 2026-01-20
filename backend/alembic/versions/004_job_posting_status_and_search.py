"""Add job posting lifecycle + search fields.

Revision ID: 004
Revises: 003
Create Date: 2026-01-19
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Lifecycle fields
    op.add_column(
        "job_postings",
        sa.Column("posted_date", sa.Date(), nullable=True),
    )
    op.add_column(
        "job_postings",
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
    )
    op.add_column(
        "job_postings",
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "job_postings",
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
    )

    # Search
    op.add_column(
        "job_postings",
        sa.Column("search_vector", postgresql.TSVECTOR(), nullable=True),
    )

    # Backfill lifecycle fields based on existing scraped_at/created_at
    op.execute(
        """
        UPDATE job_postings
        SET last_seen_at = COALESCE(scraped_at, created_at, now()),
            is_active = TRUE
        WHERE last_seen_at IS NULL;
        """
    )

    # Indexes
    op.create_index("idx_job_posting_is_active", "job_postings", ["is_active"])
    op.create_index("idx_job_posting_posted_date", "job_postings", ["posted_date"])
    op.create_index(
        "idx_job_posting_search_vector",
        "job_postings",
        ["search_vector"],
        postgresql_using="gin",
    )

    # Trigger to keep search_vector up-to-date.
    op.execute(
        """
        CREATE OR REPLACE FUNCTION update_job_postings_search_vector()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.search_vector :=
                setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
                setweight(to_tsvector('english', COALESCE(NEW.location, '')), 'B') ||
                setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C');
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """
    )
    op.execute(
        """
        DROP TRIGGER IF EXISTS job_postings_search_vector_update ON job_postings;
        CREATE TRIGGER job_postings_search_vector_update
            BEFORE INSERT OR UPDATE ON job_postings
            FOR EACH ROW EXECUTE FUNCTION update_job_postings_search_vector();
        """
    )

    # Backfill search vector for existing rows (direct compute; don't rely on trigger).
    op.execute(
        """
        UPDATE job_postings
        SET search_vector =
            setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(location, '')), 'B') ||
            setweight(to_tsvector('english', COALESCE(description, '')), 'C');
        """
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS job_postings_search_vector_update ON job_postings;")
    op.execute("DROP FUNCTION IF EXISTS update_job_postings_search_vector();")

    op.drop_index("idx_job_posting_search_vector", table_name="job_postings")
    op.drop_index("idx_job_posting_posted_date", table_name="job_postings")
    op.drop_index("idx_job_posting_is_active", table_name="job_postings")

    op.drop_column("job_postings", "search_vector")
    op.drop_column("job_postings", "closed_at")
    op.drop_column("job_postings", "last_seen_at")
    op.drop_column("job_postings", "is_active")
    op.drop_column("job_postings", "posted_date")

