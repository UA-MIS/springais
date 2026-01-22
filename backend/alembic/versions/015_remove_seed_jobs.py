"""Remove seed job data - use only scraped jobs.

Revision ID: 015
Revises: 014
Create Date: 2026-01-20
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "015"
down_revision = "014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Delete all seed job postings
    op.execute("DELETE FROM job_postings WHERE external_id LIKE 'SEED%'")


def downgrade() -> None:
    # Seed data would need to be re-inserted from seed_job_postings.sql
    # This is a data migration, downgrade is manual
    pass
