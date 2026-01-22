"""Add external_id to job_postings if missing.

Revision ID: 009
Revises: 008
Create Date: 2026-01-20
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = "009"
down_revision = "008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)

    columns = {col["name"] for col in inspector.get_columns("job_postings")}
    if "external_id" not in columns:
        op.add_column("job_postings", sa.Column("external_id", sa.String(), nullable=True))
        conn.execute(sa.text("UPDATE job_postings SET external_id = id WHERE external_id IS NULL"))
        op.alter_column("job_postings", "external_id", nullable=False)

    unique_constraints = {c["name"] for c in inspector.get_unique_constraints("job_postings")}
    if "uq_job_postings_external_id" not in unique_constraints:
        op.create_unique_constraint("uq_job_postings_external_id", "job_postings", ["external_id"])

    indexes = {i["name"] for i in inspector.get_indexes("job_postings")}
    if "idx_job_posting_external_id" not in indexes:
        op.create_index("idx_job_posting_external_id", "job_postings", ["external_id"], unique=True)


def downgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)

    indexes = {i["name"] for i in inspector.get_indexes("job_postings")}
    if "idx_job_posting_external_id" in indexes:
        op.drop_index("idx_job_posting_external_id", table_name="job_postings")

    unique_constraints = {c["name"] for c in inspector.get_unique_constraints("job_postings")}
    if "uq_job_postings_external_id" in unique_constraints:
        op.drop_constraint("uq_job_postings_external_id", "job_postings", type_="unique")

    columns = {col["name"] for col in inspector.get_columns("job_postings")}
    if "external_id" in columns:
        op.drop_column("job_postings", "external_id")
