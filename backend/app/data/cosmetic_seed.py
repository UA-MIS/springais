"""Cosmetic Catalog Seed Data.

30+ medieval-themed cosmetic items across 8 categories and 5 rarity tiers.
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
    # --- Armor (4) ---
    {"name": "Bronze Armor", "description": "Basic protective armor forged from bronze", "category": "armor", "rarity": "common", "coin_price": 150, "level_required": 1, "sort_order": 10},
    {"name": "Iron Chainmail", "description": "Sturdy iron chainmail for the aspiring warrior", "category": "armor", "rarity": "uncommon", "coin_price": 300, "level_required": 3, "sort_order": 11},
    {"name": "Steel Plate Armor", "description": "Polished steel plate armor of the knightly order", "category": "armor", "rarity": "rare", "coin_price": 600, "level_required": 5, "sort_order": 12},
    {"name": "Golden Armor", "description": "Magnificent golden armor blessed by the realm", "category": "armor", "rarity": "epic", "coin_price": 1000, "level_required": 8, "sort_order": 13},
    # --- Cape (4) ---
    {"name": "Traveler's Cloak", "description": "A simple cloak worn by wandering adventurers", "category": "cape", "rarity": "common", "coin_price": 100, "level_required": 1, "sort_order": 20},
    {"name": "Silver Cloak", "description": "A shimmering silver cloak of the moonlight order", "category": "cape", "rarity": "uncommon", "coin_price": 250, "level_required": 3, "sort_order": 21},
    {"name": "Phoenix Cloak", "description": "A fiery cloak woven from phoenix feathers", "category": "cape", "rarity": "rare", "coin_price": 550, "level_required": 6, "sort_order": 22},
    {"name": "Shadow Mantle", "description": "A dark mantle that seems to absorb light", "category": "cape", "rarity": "epic", "coin_price": 900, "level_required": 8, "sort_order": 23},
    # --- Jewelry (4) ---
    {"name": "Copper Ring", "description": "A simple copper ring with a small gem", "category": "jewelry", "rarity": "common", "coin_price": 100, "level_required": 1, "sort_order": 30},
    {"name": "Silver Amulet", "description": "An enchanted silver amulet of protection", "category": "jewelry", "rarity": "uncommon", "coin_price": 300, "level_required": 3, "sort_order": 31},
    {"name": "Guild Ring", "description": "An ornate ring marking membership in the guild", "category": "jewelry", "rarity": "rare", "coin_price": 500, "level_required": 5, "sort_order": 32},
    {"name": "Dragon Pendant", "description": "A legendary pendant forged in dragon fire", "category": "jewelry", "rarity": "legendary", "coin_price": 1500, "level_required": 10, "sort_order": 33},
    # --- Boots (4) ---
    {"name": "Leather Boots", "description": "Comfortable leather boots for long journeys", "category": "boots", "rarity": "common", "coin_price": 120, "level_required": 1, "sort_order": 40},
    {"name": "Iron-Shod Boots", "description": "Heavy boots with iron plating", "category": "boots", "rarity": "uncommon", "coin_price": 280, "level_required": 3, "sort_order": 41},
    {"name": "Winged Sandals", "description": "Enchanted sandals that grant swift movement", "category": "boots", "rarity": "rare", "coin_price": 600, "level_required": 6, "sort_order": 42},
    {"name": "Void Walkers", "description": "Boots that leave no footprint upon the earth", "category": "boots", "rarity": "epic", "coin_price": 950, "level_required": 8, "sort_order": 43},
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
    {"name": "Merchant Ring", "description": "A ring gifted by the Merchant Guild", "category": "jewelry", "rarity": "rare", "coin_price": 0, "level_required": 3, "is_quest_exclusive": True, "sort_order": 90},
    {"name": "Scribe's Quill Banner", "description": "A banner earned through scholarly pursuit", "category": "banner", "rarity": "rare", "coin_price": 0, "level_required": 3, "is_quest_exclusive": True, "sort_order": 91},
    {"name": "Knight's Crest Emblem", "description": "The crest of the Knight's Trial", "category": "emblem", "rarity": "epic", "coin_price": 0, "level_required": 5, "is_quest_exclusive": True, "sort_order": 92},
    {"name": "Arena Champion Cape", "description": "Cape of the Arena Champion", "category": "cape", "rarity": "epic", "coin_price": 0, "level_required": 8, "is_quest_exclusive": True, "sort_order": 93},
    {"name": "Legendary Crown", "description": "A crown worn only by true legends", "category": "hairstyle", "rarity": "legendary", "coin_price": 0, "level_required": 10, "is_quest_exclusive": True, "sort_order": 94},
    # --- Onboarding Reward ---
    {"name": "Squire's Trial Emblem", "description": "An emblem earned by completing the Squire's Trial onboarding walkthrough. A mark of your first steps in the realm.", "category": "emblem", "rarity": "uncommon", "coin_price": 0, "level_required": 0, "is_quest_exclusive": True, "sort_order": 84},
]


def seed_cosmetic_catalog(db: Session) -> int:
    """Seed the cosmetic catalog with medieval-themed items.

    Returns the number of items added.
    """
    from app.models.cosmetic import CosmeticCatalog

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
