"""Update cosmetic categories from body-conforming to companion types.

Replaces armor, boots, cape, jewelry with pet, pedestal, aura.
- Drops old CHECK constraints on cosmetic_catalog.category and user_equipped_items.slot
- Deletes rows referencing old categories from cosmetic_catalog, user_inventory, user_equipped_items
- Creates new CHECK constraints with updated category list

Revision ID: 032
Revises: 031
Create Date: 2026-02-15
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "032"
down_revision = "031"
branch_labels = None
depends_on = None

OLD_CATEGORIES = ("armor", "boots", "cape", "jewelry")
NEW_CATEGORY_CHECK = (
    "category IN ('pet', 'pedestal', 'aura', 'hairstyle', "
    "'color_palette', 'banner', 'emblem')"
)
NEW_SLOT_CHECK = (
    "slot IN ('pet', 'pedestal', 'aura', 'hairstyle', "
    "'color_palette', 'banner', 'emblem')"
)
OLD_CATEGORY_CHECK = (
    "category IN ('armor', 'cape', 'jewelry', 'boots', 'hairstyle', "
    "'color_palette', 'banner', 'emblem')"
)
OLD_SLOT_CHECK = (
    "slot IN ('armor', 'cape', 'jewelry', 'boots', 'hairstyle', "
    "'color_palette', 'banner', 'emblem')"
)


def upgrade() -> None:
    # 1. Delete equipped items referencing old categories
    op.execute(
        "DELETE FROM user_equipped_items WHERE slot IN ('armor', 'boots', 'cape', 'jewelry')"
    )

    # 2. Delete inventory rows for cosmetics with old categories
    op.execute(
        "DELETE FROM user_inventory WHERE cosmetic_id IN "
        "(SELECT id FROM cosmetic_catalog WHERE category IN ('armor', 'boots', 'cape', 'jewelry'))"
    )

    # 3. Delete quest progress for quests whose cosmetic reward is in old categories
    op.execute(
        "DELETE FROM user_quest_progress WHERE quest_id IN "
        "(SELECT sq.id FROM side_quest_catalog sq "
        "JOIN cosmetic_catalog cc ON sq.cosmetic_reward_id = cc.id "
        "WHERE cc.category IN ('armor', 'boots', 'cape', 'jewelry'))"
    )

    # 4. Null out cosmetic_reward_id on quests that reference old-category cosmetics
    op.execute(
        "UPDATE side_quest_catalog SET cosmetic_reward_id = NULL "
        "WHERE cosmetic_reward_id IN "
        "(SELECT id FROM cosmetic_catalog WHERE category IN ('armor', 'boots', 'cape', 'jewelry'))"
    )

    # 5. Delete cosmetic catalog rows with old categories
    op.execute(
        "DELETE FROM cosmetic_catalog WHERE category IN ('armor', 'boots', 'cape', 'jewelry')"
    )

    # 6. Drop old CHECK constraints and create new ones
    op.drop_constraint("ck_cosmetic_category_valid", "cosmetic_catalog", type_="check")
    op.create_check_constraint(
        "ck_cosmetic_category_valid",
        "cosmetic_catalog",
        NEW_CATEGORY_CHECK,
    )

    op.drop_constraint("ck_equipped_slot_valid", "user_equipped_items", type_="check")
    op.create_check_constraint(
        "ck_equipped_slot_valid",
        "user_equipped_items",
        NEW_SLOT_CHECK,
    )


def downgrade() -> None:
    # Restore old CHECK constraints (data in new categories will need manual cleanup)
    op.drop_constraint("ck_cosmetic_category_valid", "cosmetic_catalog", type_="check")
    op.create_check_constraint(
        "ck_cosmetic_category_valid",
        "cosmetic_catalog",
        OLD_CATEGORY_CHECK,
    )

    op.drop_constraint("ck_equipped_slot_valid", "user_equipped_items", type_="check")
    op.create_check_constraint(
        "ck_equipped_slot_valid",
        "user_equipped_items",
        OLD_SLOT_CHECK,
    )
