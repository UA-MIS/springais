"""Add employees.career_history JSONB column.

app/services/pattern_service.py reads ``employees.career_history`` throughout —
including a raw SQL query at pattern_service.py:799 that does
``SELECT ... career_history FROM employees WHERE career_history IS NOT NULL``.

That column was never present in the Employee model and no migration ever
created it, so every Success-Pattern query failed with
``column "career_history" does not exist``. The synthetic employee dumps in
data/*.sql have always carried career_history values, so the data existed but
had nowhere to land.

This adds the column (nullable — employees legitimately may have no prior
history) and the GIN index the pattern queries want.

Revision ID: 033
Revises: 032
Create Date: 2026-09-01
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "033"
down_revision = "032"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "employees",
        sa.Column("career_history", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.create_index(
        "idx_employees_career_history",
        "employees",
        ["career_history"],
        postgresql_using="gin",
    )
    # Partial index used by the transition/pattern queries, which always filter
    # on career_history IS NOT NULL.
    op.execute(
        'CREATE INDEX IF NOT EXISTS idx_employees_with_history '
        'ON employees("current_role", service_line) '
        'WHERE career_history IS NOT NULL'
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_employees_with_history")
    op.drop_index("idx_employees_career_history", table_name="employees")
    op.drop_column("employees", "career_history")
