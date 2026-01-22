"""Normalize job_postings types to match models.

Revision ID: 013
Revises: 012
Create Date: 2026-01-20
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = "013"
down_revision = "012"
branch_labels = None
depends_on = None


def _column_info(conn, table: str, column: str) -> tuple[str | None, str | None]:
    row = conn.execute(
        sa.text(
            """
            SELECT data_type, udt_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = :table_name
              AND column_name = :column_name
            """
        ),
        {"table_name": table, "column_name": column},
    ).fetchone()
    if not row:
        return None, None
    return row[0], row[1]


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)

    job_id_type, job_id_udt = _column_info(conn, "job_postings", "id")
    match_job_type, match_job_udt = _column_info(conn, "matches", "job_posting_id")

    # Drop FK if it exists and we need to change types.
    fk_name = None
    for fk in inspector.get_foreign_keys("matches"):
        if "job_posting_id" in (fk.get("constrained_columns") or []):
            fk_name = fk.get("name")
            break

    if job_id_type == "uuid":
        if fk_name:
            op.drop_constraint(fk_name, "matches", type_="foreignkey")
        if match_job_type == "uuid":
            op.execute("ALTER TABLE matches ALTER COLUMN job_posting_id TYPE text USING job_posting_id::text")
        op.execute("ALTER TABLE job_postings ALTER COLUMN id TYPE text USING id::text")
        if fk_name:
            op.create_foreign_key(
                fk_name,
                "matches",
                "job_postings",
                ["job_posting_id"],
                ["id"],
                ondelete="CASCADE",
            )

    # Convert arrays to jsonb if needed.
    for col in ("required_skills", "preferred_skills", "tags"):
        data_type, udt_name = _column_info(conn, "job_postings", col)
        if data_type == "ARRAY" and udt_name == "_text":
            op.execute(
                f"ALTER TABLE job_postings ALTER COLUMN {col} TYPE jsonb USING to_jsonb({col})"
            )


def downgrade() -> None:
    # No-op: defensive normalization for local/dev schema drift
    pass
