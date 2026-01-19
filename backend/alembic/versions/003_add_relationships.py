"""Add foreign key relationships.

Revision ID: 003
Revises: 002
Create Date: 2026-01-19
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Match relationships
    op.create_foreign_key(
        "fk_match_employee",
        "matches",
        "employees",
        ["employee_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_match_job_posting",
        "matches",
        "job_postings",
        ["job_posting_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_match_user_profile",
        "matches",
        "user_profiles",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # Career path relationship
    op.create_foreign_key(
        "fk_career_path_user",
        "career_paths",
        "user_profiles",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint("fk_career_path_user", "career_paths", type_="foreignkey")
    op.drop_constraint("fk_match_user_profile", "matches", type_="foreignkey")
    op.drop_constraint("fk_match_job_posting", "matches", type_="foreignkey")
    op.drop_constraint("fk_match_employee", "matches", type_="foreignkey")
