"""Add achievement, cosmetic store, and side quest tables.

Creates:
- achievement_catalog: Server-side achievement definitions (seeded)
- user_achievements: Per-user achievement unlocks
- cosmetic_catalog: Store item definitions (seeded)
- user_inventory: Per-user owned cosmetics
- user_equipped_items: One equipped item per slot per user
- side_quest_catalog: Quest definitions with level requirements
- user_quest_progress: Per-user quest progress tracking

Revision ID: 030
Revises: 029
Create Date: 2026-02-11
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID


# revision identifiers, used by Alembic.
revision = "030"
down_revision = "029"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. achievement_catalog (string PK)
    op.create_table(
        "achievement_catalog",
        sa.Column("id", sa.String(100), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.String(500), nullable=False),
        sa.Column("icon", sa.String(100), server_default="trophy", nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("xp_reward", sa.Integer(), server_default="0", nullable=False),
        sa.Column("coin_reward", sa.Integer(), server_default="0", nullable=False),
        sa.Column("trigger_type", sa.String(50), nullable=False),
        sa.Column("trigger_config", JSONB, nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint(
            "category IN ('onboarding', 'learning', 'engagement', 'exploration', 'mastery')",
            name="ck_achievement_category_valid",
        ),
        sa.CheckConstraint(
            "trigger_type IN ('event_based', 'threshold_based', 'manual')",
            name="ck_trigger_type_valid",
        ),
    )
    op.create_index("idx_achievement_catalog_category", "achievement_catalog", ["category"])
    op.create_index("idx_achievement_catalog_active", "achievement_catalog", ["is_active"])

    # 2. user_achievements
    op.create_table(
        "user_achievements",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("achievement_id", sa.String(100), nullable=False),
        sa.Column("unlocked_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["user_profiles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["achievement_id"], ["achievement_catalog.id"], ondelete="CASCADE"),
    )
    op.create_index("uq_user_achievement", "user_achievements", ["user_id", "achievement_id"], unique=True)
    op.create_index("idx_user_achievements_user_id", "user_achievements", ["user_id"])

    # 3. cosmetic_catalog
    op.create_table(
        "cosmetic_catalog",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.String(500), nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("rarity", sa.String(20), nullable=False),
        sa.Column("coin_price", sa.Integer(), nullable=False),
        sa.Column("level_required", sa.Integer(), server_default="1", nullable=False),
        sa.Column("image_url", sa.String(500), nullable=True),
        sa.Column("is_quest_exclusive", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint(
            "category IN ('armor', 'cape', 'jewelry', 'boots', 'hairstyle', "
            "'color_palette', 'banner', 'emblem')",
            name="ck_cosmetic_category_valid",
        ),
        sa.CheckConstraint(
            "rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')",
            name="ck_cosmetic_rarity_valid",
        ),
        sa.CheckConstraint("coin_price >= 0", name="ck_cosmetic_price_non_negative"),
    )
    op.create_index("idx_cosmetic_catalog_category", "cosmetic_catalog", ["category"])
    op.create_index("idx_cosmetic_catalog_rarity", "cosmetic_catalog", ["rarity"])
    op.create_index("idx_cosmetic_catalog_active", "cosmetic_catalog", ["is_active"])

    # 4. user_inventory
    op.create_table(
        "user_inventory",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("cosmetic_id", UUID(as_uuid=True), nullable=False),
        sa.Column("source", sa.String(50), nullable=False),
        sa.Column("acquired_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["user_profiles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["cosmetic_id"], ["cosmetic_catalog.id"], ondelete="CASCADE"),
        sa.CheckConstraint(
            "source IN ('store_purchase', 'quest_reward', 'achievement_reward')",
            name="ck_inventory_source_valid",
        ),
    )
    op.create_index("uq_user_inventory", "user_inventory", ["user_id", "cosmetic_id"], unique=True)
    op.create_index("idx_user_inventory_user_id", "user_inventory", ["user_id"])

    # 5. user_equipped_items
    op.create_table(
        "user_equipped_items",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("slot", sa.String(50), nullable=False),
        sa.Column("cosmetic_id", UUID(as_uuid=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["user_profiles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["cosmetic_id"], ["cosmetic_catalog.id"], ondelete="CASCADE"),
        sa.CheckConstraint(
            "slot IN ('armor', 'cape', 'jewelry', 'boots', 'hairstyle', "
            "'color_palette', 'banner', 'emblem')",
            name="ck_equipped_slot_valid",
        ),
    )
    op.create_index("uq_user_equipped_slot", "user_equipped_items", ["user_id", "slot"], unique=True)
    op.create_index("idx_user_equipped_user_id", "user_equipped_items", ["user_id"])

    # 6. side_quest_catalog (depends on cosmetic_catalog for FK)
    op.create_table(
        "side_quest_catalog",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.String(1000), nullable=False),
        sa.Column("level_required", sa.Integer(), server_default="1", nullable=False),
        sa.Column("xp_reward", sa.Integer(), server_default="0", nullable=False),
        sa.Column("coin_reward", sa.Integer(), server_default="0", nullable=False),
        sa.Column("cosmetic_reward_id", UUID(as_uuid=True), nullable=True),
        sa.Column("requirements", JSONB, nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["cosmetic_reward_id"], ["cosmetic_catalog.id"]),
    )
    op.create_index("idx_side_quest_catalog_level", "side_quest_catalog", ["level_required"])
    op.create_index("idx_side_quest_catalog_active", "side_quest_catalog", ["is_active"])

    # 7. user_quest_progress
    op.create_table(
        "user_quest_progress",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("quest_id", UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.String(20), server_default="available", nullable=False),
        sa.Column("progress", JSONB, server_default="{}", nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["user_profiles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["quest_id"], ["side_quest_catalog.id"], ondelete="CASCADE"),
        sa.CheckConstraint(
            "status IN ('available', 'in_progress', 'completed')",
            name="ck_quest_status_valid",
        ),
    )
    op.create_index("uq_user_quest", "user_quest_progress", ["user_id", "quest_id"], unique=True)
    op.create_index("idx_user_quest_user_id", "user_quest_progress", ["user_id"])
    op.create_index("idx_user_quest_status", "user_quest_progress", ["status"])


def downgrade() -> None:
    op.drop_table("user_quest_progress")
    op.drop_table("side_quest_catalog")
    op.drop_table("user_equipped_items")
    op.drop_table("user_inventory")
    op.drop_table("cosmetic_catalog")
    op.drop_table("user_achievements")
    op.drop_table("achievement_catalog")
