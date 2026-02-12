"""Add badge catalog, skill mapping, interactions, and user badges tables.

Revision ID: 027
Revises: 026
Create Date: 2026-02-11
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import inspect

revision = "027"
down_revision = "026"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    existing_tables = inspector.get_table_names()

    # 1. badge_catalog table
    if "badge_catalog" not in existing_tables:
        op.create_table(
            "badge_catalog",
            sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column("external_id", sa.String(255), nullable=False),
            sa.Column("name", sa.String(500), nullable=False),
            sa.Column("issuer", sa.String(255), nullable=False),
            sa.Column("platform", sa.String(50), nullable=False),
            sa.Column("url", sa.String(1000), nullable=False),
            sa.Column("image_url", sa.String(1000)),
            sa.Column("skills", JSONB, server_default="[]"),
            sa.Column("difficulty_level", sa.String(20)),
            sa.Column("estimated_cost_usd", sa.Float),
            sa.Column("estimated_hours", sa.Integer),
            sa.Column("renewal_months", sa.Integer),
            sa.Column("is_active", sa.Boolean, server_default="true"),
            sa.Column("last_refreshed_at", sa.DateTime(timezone=True)),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )
        op.create_index("idx_badge_catalog_platform_ext", "badge_catalog", ["platform", "external_id"], unique=True)
        op.create_index("idx_badge_catalog_active", "badge_catalog", ["is_active"])
        op.create_index("idx_badge_catalog_issuer", "badge_catalog", ["issuer"])

    # 2. badge_skill_mapping table
    if "badge_skill_mapping" not in existing_tables:
        op.create_table(
            "badge_skill_mapping",
            sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column("badge_id", UUID(as_uuid=True), sa.ForeignKey("badge_catalog.id", ondelete="CASCADE"), nullable=False),
            sa.Column("skill_name", sa.String(255), nullable=False),
            sa.Column("mapping_confidence", sa.Float, server_default="0.5"),
            sa.Column("source", sa.String(20), server_default="'curated'"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )
        op.create_index("idx_badge_skill_mapping_skill", "badge_skill_mapping", ["skill_name"])
        op.create_index("idx_badge_skill_mapping_badge", "badge_skill_mapping", ["badge_id"])
        op.create_index("idx_badge_skill_mapping_unique", "badge_skill_mapping", ["badge_id", "skill_name"], unique=True)

    # 3. badge_interactions table
    if "badge_interactions" not in existing_tables:
        op.create_table(
            "badge_interactions",
            sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False),
            sa.Column("badge_id", UUID(as_uuid=True), sa.ForeignKey("badge_catalog.id", ondelete="CASCADE"), nullable=False),
            sa.Column("interaction_type", sa.String(20), nullable=False),
            sa.Column("source", sa.String(20), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )
        op.create_index("idx_badge_interaction_user", "badge_interactions", ["user_id"])
        op.create_index("idx_badge_interaction_badge", "badge_interactions", ["badge_id"])
        op.create_index("idx_badge_interaction_type", "badge_interactions", ["interaction_type"])

    # 4. user_badges table
    if "user_badges" not in existing_tables:
        op.create_table(
            "user_badges",
            sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False),
            sa.Column("badge_id", UUID(as_uuid=True), sa.ForeignKey("badge_catalog.id", ondelete="CASCADE"), nullable=False),
            sa.Column("earned_date", sa.DateTime(timezone=True)),
            sa.Column("self_reported", sa.Boolean, server_default="true"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )
        op.create_index("idx_user_badge_user", "user_badges", ["user_id"])
        op.create_index("idx_user_badge_unique", "user_badges", ["user_id", "badge_id"], unique=True)


def downgrade() -> None:
    op.drop_table("user_badges")
    op.drop_table("badge_interactions")
    op.drop_table("badge_skill_mapping")
    op.drop_table("badge_catalog")
