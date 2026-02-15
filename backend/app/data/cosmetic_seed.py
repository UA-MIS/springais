"""Cosmetic Catalog Seed Data.

30+ medieval-themed cosmetic items across 7 categories and 5 rarity tiers.
Categories: pet, pedestal, aura, hairstyle, color_palette, banner, emblem.
Pricing per FR-014.2:
  Common: 100-200, Uncommon: 200-400, Rare: 400-700, Epic: 700-1200, Legendary: 1200-2000

References: FR-014, D-MM-7
Architecture Section 2.7
"""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

COSMETIC_SEED_DATA: list[dict[str, Any]] = [
    # --- Pet (6) ---
    {"name": "Tabby Cat", "description": "A friendly tabby cat that follows you on your adventures", "category": "pet", "rarity": "common", "coin_price": 150, "level_required": 1, "sort_order": 10},
    {"name": "Baby Dragon", "description": "A tiny dragon hatchling with smoldering breath", "category": "pet", "rarity": "uncommon", "coin_price": 300, "level_required": 3, "sort_order": 11},
    {"name": "Barn Owl", "description": "A wise barn owl perched upon your shoulder", "category": "pet", "rarity": "uncommon", "coin_price": 350, "level_required": 3, "sort_order": 12},
    {"name": "Fox Cub", "description": "A cunning fox cub with a bushy tail", "category": "pet", "rarity": "rare", "coin_price": 550, "level_required": 5, "sort_order": 13},
    {"name": "Wolf Pup", "description": "A loyal wolf pup that never leaves your side", "category": "pet", "rarity": "rare", "coin_price": 600, "level_required": 6, "sort_order": 14},
    {"name": "Phoenix Chick", "description": "A radiant phoenix chick wreathed in gentle flames", "category": "pet", "rarity": "epic", "coin_price": 1000, "level_required": 8, "sort_order": 15},
    # --- Pedestal (4) ---
    {"name": "Stone Pedestal", "description": "A sturdy stone pedestal for displaying your avatar", "category": "pedestal", "rarity": "common", "coin_price": 120, "level_required": 1, "sort_order": 20},
    {"name": "Crystal Pedestal", "description": "A shimmering crystal pedestal that refracts light", "category": "pedestal", "rarity": "uncommon", "coin_price": 280, "level_required": 3, "sort_order": 21},
    {"name": "Nature Pedestal", "description": "A living pedestal overgrown with vines and flowers", "category": "pedestal", "rarity": "rare", "coin_price": 550, "level_required": 5, "sort_order": 22},
    {"name": "Golden Throne", "description": "A magnificent golden throne fit for royalty", "category": "pedestal", "rarity": "epic", "coin_price": 950, "level_required": 8, "sort_order": 23},
    # --- Aura (9) ---
    {"name": "Fire Aura", "description": "A flickering aura of warm flames", "category": "aura", "rarity": "common", "coin_price": 100, "level_required": 1, "sort_order": 30},
    {"name": "Frost Aura", "description": "An icy aura that chills the air around you", "category": "aura", "rarity": "uncommon", "coin_price": 250, "level_required": 3, "sort_order": 31},
    {"name": "Shadow Aura", "description": "A dark aura of swirling shadows", "category": "aura", "rarity": "uncommon", "coin_price": 300, "level_required": 3, "sort_order": 32},
    {"name": "Nature Wreath", "description": "A verdant wreath of leaves and blossoms", "category": "aura", "rarity": "rare", "coin_price": 500, "level_required": 5, "sort_order": 33},
    {"name": "Ice Orb", "description": "A floating orb of crystallized ice", "category": "aura", "rarity": "rare", "coin_price": 600, "level_required": 6, "sort_order": 34},
    {"name": "Void Aura", "description": "An aura of pure void energy from beyond the realm", "category": "aura", "rarity": "epic", "coin_price": 900, "level_required": 8, "sort_order": 35},
    {"name": "Starlight Aura", "description": "A celestial aura of twinkling starlight", "category": "aura", "rarity": "epic", "coin_price": 1100, "level_required": 9, "sort_order": 36},
    {"name": "Nature Aura", "description": "A gentle aura of nature's embrace", "category": "aura", "rarity": "rare", "coin_price": 550, "level_required": 5, "sort_order": 37},
    {"name": "Fire Aura Lg", "description": "An intense inferno aura of legendary proportions", "category": "aura", "rarity": "legendary", "coin_price": 1500, "level_required": 10, "sort_order": 38},
    # --- Hairstyle (4) ---
    {"name": "Classic Warrior Cut", "description": "A practical hairstyle favored by warriors", "category": "hairstyle", "rarity": "common", "coin_price": 100, "level_required": 1, "sort_order": 50},
    {"name": "Noble Braids", "description": "Intricate braids worn by the nobility", "category": "hairstyle", "rarity": "uncommon", "coin_price": 200, "level_required": 2, "sort_order": 51},
    {"name": "Crown of Flames", "description": "A fiery hairstyle that glows with inner light", "category": "hairstyle", "rarity": "rare", "coin_price": 450, "level_required": 5, "sort_order": 52},
    {"name": "Celestial Locks", "description": "Hair that shimmers with starlight", "category": "hairstyle", "rarity": "epic", "coin_price": 800, "level_required": 7, "sort_order": 53},
    # --- Color Palette (3) ---
    {"name": "Earth Tones", "description": "Natural earth-colored theme for your avatar", "category": "color_palette", "rarity": "common", "coin_price": 100, "level_required": 1, "sort_order": 60},
    {"name": "Royal Purple", "description": "A regal purple color scheme", "category": "color_palette", "rarity": "uncommon", "coin_price": 250, "level_required": 3, "sort_order": 61},
    {"name": "Crimson & Gold", "description": "The colors of the champion's crest", "category": "color_palette", "rarity": "rare", "coin_price": 500, "level_required": 5, "sort_order": 62},
    # --- Banner (4) ---
    {"name": "Apprentice Banner", "description": "A simple banner for new adventurers", "category": "banner", "rarity": "common", "coin_price": 100, "level_required": 1, "sort_order": 70},
    {"name": "Knight's Standard", "description": "The proud standard of the knightly order", "category": "banner", "rarity": "uncommon", "coin_price": 350, "level_required": 4, "sort_order": 71},
    {"name": "Dragon Banner", "description": "A fearsome banner bearing the dragon sigil", "category": "banner", "rarity": "rare", "coin_price": 650, "level_required": 7, "sort_order": 72},
    {"name": "Legendary Crest", "description": "The most prestigious banner in all the realm", "category": "banner", "rarity": "legendary", "coin_price": 1800, "level_required": 10, "sort_order": 73},
    # --- Emblem (4) ---
    {"name": "Novice Emblem", "description": "A simple emblem marking your start", "category": "emblem", "rarity": "common", "coin_price": 100, "level_required": 1, "sort_order": 80},
    {"name": "Scholar's Seal", "description": "The seal of the learned scholars", "category": "emblem", "rarity": "uncommon", "coin_price": 300, "level_required": 3, "sort_order": 81},
    {"name": "Dragon Emblem", "description": "An emblem depicting the ancient dragon", "category": "emblem", "rarity": "rare", "coin_price": 700, "level_required": 6, "sort_order": 82},
    {"name": "Legendary Crown Emblem", "description": "The crown emblem worn by legends", "category": "emblem", "rarity": "legendary", "coin_price": 2000, "level_required": 10, "sort_order": 83},
    # --- Quest Exclusive Items (5) ---
    {"name": "Merchant's Barn Owl", "description": "A wise owl gifted by the Merchant Guild", "category": "pet", "rarity": "rare", "coin_price": 0, "level_required": 3, "is_quest_exclusive": True, "sort_order": 90},
    {"name": "Scribe's Quill Banner", "description": "A banner earned through scholarly pursuit", "category": "banner", "rarity": "rare", "coin_price": 0, "level_required": 3, "is_quest_exclusive": True, "sort_order": 91},
    {"name": "Knight's Crest Emblem", "description": "The crest of the Knight's Trial", "category": "emblem", "rarity": "epic", "coin_price": 0, "level_required": 5, "is_quest_exclusive": True, "sort_order": 92},
    {"name": "Arena Champion Aura", "description": "Aura of the Arena Champion", "category": "aura", "rarity": "epic", "coin_price": 0, "level_required": 8, "is_quest_exclusive": True, "sort_order": 93},
    {"name": "Legendary Crown", "description": "A crown worn only by true legends", "category": "hairstyle", "rarity": "legendary", "coin_price": 0, "level_required": 10, "is_quest_exclusive": True, "sort_order": 94},
    # --- Onboarding Reward ---
    {"name": "Squire's Trial Emblem", "description": "An emblem earned by completing the Squire's Trial onboarding walkthrough. A mark of your first steps in the realm.", "category": "emblem", "rarity": "uncommon", "coin_price": 0, "level_required": 0, "is_quest_exclusive": True, "sort_order": 84},
]


def seed_cosmetic_catalog(db: Session) -> int:
    """Seed the cosmetic catalog with medieval-themed items.

    Cleans up any legacy categories (armor, boots, cape, jewelry) that may
    remain if migration 032 hasn't run, then seeds new items.
    Returns the number of items added.
    """
    from app.models.cosmetic import CosmeticCatalog, UserInventory, UserEquippedItem
    from app.models.quest import SideQuestCatalog, UserQuestProgress

    # Clean up legacy categories that no longer exist
    OLD_CATEGORIES = ("armor", "boots", "cape", "jewelry")
    old_ids = [
        r[0]
        for r in db.query(CosmeticCatalog.id)
        .filter(CosmeticCatalog.category.in_(OLD_CATEGORIES))
        .all()
    ]
    if old_ids:
        # 1. Delete equipped items with old slots
        db.query(UserEquippedItem).filter(
            UserEquippedItem.slot.in_(OLD_CATEGORIES)
        ).delete(synchronize_session=False)
        # 2. Delete inventory rows referencing old cosmetics
        db.query(UserInventory).filter(
            UserInventory.cosmetic_id.in_(old_ids)
        ).delete(synchronize_session=False)
        # 3. Delete quest progress for quests rewarding old cosmetics
        quest_ids = [
            r[0]
            for r in db.query(SideQuestCatalog.id)
            .filter(SideQuestCatalog.cosmetic_reward_id.in_(old_ids))
            .all()
        ]
        if quest_ids:
            db.query(UserQuestProgress).filter(
                UserQuestProgress.quest_id.in_(quest_ids)
            ).delete(synchronize_session=False)
        # 4. Null out quest cosmetic_reward_id references
        db.query(SideQuestCatalog).filter(
            SideQuestCatalog.cosmetic_reward_id.in_(old_ids)
        ).update(
            {SideQuestCatalog.cosmetic_reward_id: None},
            synchronize_session=False,
        )
        # 5. Delete old cosmetic catalog rows
        db.query(CosmeticCatalog).filter(
            CosmeticCatalog.id.in_(old_ids)
        ).delete(synchronize_session=False)
        db.flush()
        logger.info(f"Cleaned up {len(old_ids)} legacy cosmetic items")

    count = 0

    for entry in COSMETIC_SEED_DATA:
        existing = (
            db.query(CosmeticCatalog)
            .filter(CosmeticCatalog.name == entry["name"])
            .first()
        )
        if existing:
            continue

        item = CosmeticCatalog(
            name=entry["name"],
            description=entry["description"],
            category=entry["category"],
            rarity=entry["rarity"],
            coin_price=entry["coin_price"],
            level_required=entry.get("level_required", 1),
            image_url=None,
            is_quest_exclusive=entry.get("is_quest_exclusive", False),
            is_active=True,
            sort_order=entry["sort_order"],
        )
        db.add(item)
        db.flush()
        count += 1

    db.commit()
    logger.info(
        f"Seeded cosmetic catalog with {count} new items "
        f"({len(COSMETIC_SEED_DATA)} total)"
    )
    return count
