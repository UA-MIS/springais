"""Add employee_id to user_profiles.

Revision ID: 008
Revises: 007
Create Date: 2026-01-20
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("user_profiles", sa.Column("employee_id", sa.String(), nullable=True))
    op.create_foreign_key(
        "fk_user_profiles_employee_id",
        "user_profiles",
        "employees",
        ["employee_id"],
        ["id"],
    )
    op.create_index("idx_user_profiles_employee_id", "user_profiles", ["employee_id"])


def downgrade() -> None:
    op.drop_index("idx_user_profiles_employee_id", table_name="user_profiles")
    op.drop_constraint("fk_user_profiles_employee_id", "user_profiles", type_="foreignkey")
    op.drop_column("user_profiles", "employee_id")
