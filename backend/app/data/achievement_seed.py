"""Achievement Catalog Seed Data.

24 achievements: 14 migrated from frontend + 10 new.
Matches FR-012.1 exactly.

References: FR-011, FR-012, D-MM-6
Architecture Section 2.5
"""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

ACHIEVEMENT_SEED_DATA: list[dict[str, Any]] = [
    # --- Onboarding (5) ---
    {
        "id": "first_login",
        "name": "The Journey Begins",
        "description": "Enable adventure mode and begin your quest",
        "icon": "scroll",
        "category": "onboarding",
        "xp_reward": 100,
        "coin_reward": 50,
        "trigger_type": "manual",
        "trigger_config": {"action": "enable_adventure_mode"},
        "sort_order": 10,
    },
    {
        "id": "profile_complete",
        "name": "Royal Registry",
        "description": "Complete your adventurer profile",
        "icon": "user-check",
        "category": "onboarding",
        "xp_reward": 50,
        "coin_reward": 25,
        "trigger_type": "event_based",
        "trigger_config": {"event_type": "profile_completed", "count": 1},
        "sort_order": 20,
    },
    {
        "id": "resume_uploaded",
        "name": "Scribe's Apprentice",
        "description": "Upload your resume to the Royal Archives",
        "icon": "file-text",
        "category": "onboarding",
        "xp_reward": 50,
        "coin_reward": 25,
        "trigger_type": "event_based",
        "trigger_config": {"event_type": "resume_uploaded", "count": 1},
        "sort_order": 30,
    },
    {
        "id": "first_roadmap",
        "name": "Cartographer",
        "description": "Generate your first learning roadmap",
        "icon": "map",
        "category": "onboarding",
        "xp_reward": 50,
        "coin_reward": 25,
        "trigger_type": "event_based",
        "trigger_config": {"event_type": "roadmap_generated", "count": 1},
        "sort_order": 40,
    },
    {
        "id": "first_match",
        "name": "Seeker of Destiny",
        "description": "View your first match results",
        "icon": "compass",
        "category": "onboarding",
        "xp_reward": 50,
        "coin_reward": 25,
        "trigger_type": "event_based",
        "trigger_config": {"event_type": "first_match_view", "count": 1},
        "sort_order": 50,
    },
    {
        "id": "save_role",
        "name": "Marked for Greatness",
        "description": "Save a role to your quest log",
        "icon": "bookmark",
        "category": "onboarding",
        "xp_reward": 25,
        "coin_reward": 10,
        "trigger_type": "event_based",
        "trigger_config": {"event_type": "role_saved", "count": 1},
        "sort_order": 55,
    },
    # --- Learning (6) ---
    {
        "id": "first_module",
        "name": "Eager Pupil",
        "description": "Complete your first learning module",
        "icon": "book-open",
        "category": "learning",
        "xp_reward": 75,
        "coin_reward": 30,
        "trigger_type": "event_based",
        "trigger_config": {"event_type": "module_completed", "count": 1},
        "sort_order": 60,
    },
    {
        "id": "skill_master_5",
        "name": "Skill Adept",
        "description": "Complete 5 learning modules",
        "icon": "award",
        "category": "learning",
        "xp_reward": 150,
        "coin_reward": 75,
        "trigger_type": "event_based",
        "trigger_config": {"event_type": "module_completed", "count": 5},
        "sort_order": 70,
    },
    {
        "id": "skill_master_10",
        "name": "Skill Master",
        "description": "Complete 10 learning modules",
        "icon": "star",
        "category": "learning",
        "xp_reward": 300,
        "coin_reward": 150,
        "trigger_type": "event_based",
        "trigger_config": {"event_type": "module_completed", "count": 10},
        "sort_order": 80,
    },
    {
        "id": "first_assessment",
        "name": "Trial by Fire",
        "description": "Complete your first assessment",
        "icon": "zap",
        "category": "learning",
        "xp_reward": 100,
        "coin_reward": 50,
        "trigger_type": "event_based",
        "trigger_config": {"event_type": "assessment_completed", "count": 1},
        "sort_order": 90,
    },
    {
        "id": "assessment_expert",
        "name": "Arena Veteran",
        "description": "Complete 5 assessments",
        "icon": "shield",
        "category": "learning",
        "xp_reward": 200,
        "coin_reward": 100,
        "trigger_type": "event_based",
        "trigger_config": {"event_type": "assessment_completed", "count": 5},
        "sort_order": 100,
    },
    {
        "id": "first_certification",
        "name": "Certified Knight",
        "description": "Earn your first certification badge",
        "icon": "badge",
        "category": "learning",
        "xp_reward": 300,
        "coin_reward": 150,
        "trigger_type": "event_based",
        "trigger_config": {"event_type": "certification_earned", "count": 1},
        "sort_order": 110,
    },
    # --- Engagement (6) ---
    {
        "id": "daily_login_3",
        "name": "Consistent Adventurer",
        "description": "Maintain a 3-day login streak",
        "icon": "flame",
        "category": "engagement",
        "xp_reward": 50,
        "coin_reward": 25,
        "trigger_type": "threshold_based",
        "trigger_config": {"field": "login_streak", "threshold": 3},
        "sort_order": 120,
    },
    {
        "id": "daily_login_7",
        "name": "Dedicated Knight",
        "description": "Maintain a 7-day login streak",
        "icon": "flame",
        "category": "engagement",
        "xp_reward": 100,
        "coin_reward": 50,
        "trigger_type": "threshold_based",
        "trigger_config": {"field": "login_streak", "threshold": 7},
        "sort_order": 130,
    },
    {
        "id": "daily_login_14",
        "name": "Stalwart Guardian",
        "description": "Maintain a 14-day login streak",
        "icon": "flame",
        "category": "engagement",
        "xp_reward": 200,
        "coin_reward": 100,
        "trigger_type": "threshold_based",
        "trigger_config": {"field": "login_streak", "threshold": 14},
        "sort_order": 140,
    },
    {
        "id": "daily_login_30",
        "name": "Legendary Devotion",
        "description": "Maintain a 30-day login streak",
        "icon": "crown",
        "category": "engagement",
        "xp_reward": 500,
        "coin_reward": 250,
        "trigger_type": "threshold_based",
        "trigger_config": {"field": "login_streak", "threshold": 30},
        "sort_order": 150,
    },
    {
        "id": "first_quest_complete",
        "name": "Questborne",
        "description": "Complete your first side quest",
        "icon": "scroll",
        "category": "engagement",
        "xp_reward": 100,
        "coin_reward": 50,
        "trigger_type": "event_based",
        "trigger_config": {"event_type": "side_quest_completed", "count": 1},
        "sort_order": 160,
    },
    {
        "id": "three_quests_complete",
        "name": "Quest Champion",
        "description": "Complete 3 side quests",
        "icon": "trophy",
        "category": "engagement",
        "xp_reward": 250,
        "coin_reward": 125,
        "trigger_type": "event_based",
        "trigger_config": {"event_type": "side_quest_completed", "count": 3},
        "sort_order": 170,
    },
    # --- Exploration (4) ---
    {
        "id": "explorer",
        "name": "Realm Explorer",
        "description": "Visit all 5 main pages of the realm",
        "icon": "globe",
        "category": "exploration",
        "xp_reward": 150,
        "coin_reward": 75,
        "trigger_type": "event_based",
        "trigger_config": {"event_type": "profile_completed", "count": 1},
        "sort_order": 180,
    },
    {
        "id": "first_milestone",
        "name": "Pathfinder",
        "description": "Complete your first roadmap milestone",
        "icon": "flag",
        "category": "exploration",
        "xp_reward": 100,
        "coin_reward": 50,
        "trigger_type": "event_based",
        "trigger_config": {"event_type": "milestone_passed", "count": 1},
        "sort_order": 190,
    },
    {
        "id": "milestone_master",
        "name": "Wayfinder",
        "description": "Complete 5 roadmap milestones",
        "icon": "flag",
        "category": "exploration",
        "xp_reward": 250,
        "coin_reward": 125,
        "trigger_type": "event_based",
        "trigger_config": {"event_type": "milestone_passed", "count": 5},
        "sort_order": 200,
    },
    {
        "id": "peer_helper",
        "name": "Mentor's Heart",
        "description": "Receive 3 peer endorsements",
        "icon": "heart",
        "category": "exploration",
        "xp_reward": 100,
        "coin_reward": 50,
        "trigger_type": "event_based",
        "trigger_config": {"event_type": "peer_endorsement", "count": 3},
        "sort_order": 210,
    },
    # --- Mastery (3) ---
    {
        "id": "level_5",
        "name": "Squire's Ascension",
        "description": "Reach level 5 and earn the Squire title",
        "icon": "trending-up",
        "category": "mastery",
        "xp_reward": 100,
        "coin_reward": 50,
        "trigger_type": "threshold_based",
        "trigger_config": {"field": "level", "threshold": 5},
        "sort_order": 220,
    },
    {
        "id": "level_10",
        "name": "Champion's Glory",
        "description": "Reach level 10 and become a Champion",
        "icon": "award",
        "category": "mastery",
        "xp_reward": 300,
        "coin_reward": 200,
        "trigger_type": "threshold_based",
        "trigger_config": {"field": "level", "threshold": 10},
        "sort_order": 230,
    },
    {
        "id": "coin_hoarder",
        "name": "Dragon's Hoard",
        "description": "Accumulate 1000 coins in your treasury",
        "icon": "dollar-sign",
        "category": "mastery",
        "xp_reward": 150,
        "coin_reward": 0,
        "trigger_type": "threshold_based",
        "trigger_config": {"field": "coin_balance", "threshold": 1000},
        "sort_order": 240,
    },
]


def seed_achievement_catalog(db: Session) -> int:
    """Seed the achievement catalog with all 24 achievements.

    Returns the number of achievements added.
    """
    from app.models.achievement import AchievementCatalog

    count = 0

    for entry in ACHIEVEMENT_SEED_DATA:
        existing = (
            db.query(AchievementCatalog)
            .filter(AchievementCatalog.id == entry["id"])
            .first()
        )
        if existing:
            continue

        achievement = AchievementCatalog(
            id=entry["id"],
            name=entry["name"],
            description=entry["description"],
            icon=entry["icon"],
            category=entry["category"],
            xp_reward=entry["xp_reward"],
            coin_reward=entry["coin_reward"],
            trigger_type=entry["trigger_type"],
            trigger_config=entry["trigger_config"],
            is_active=True,
            sort_order=entry["sort_order"],
        )
        db.add(achievement)
        db.flush()
        count += 1

    db.commit()
    logger.info(
        f"Seeded achievement catalog with {count} new achievements "
        f"({len(ACHIEVEMENT_SEED_DATA)} total)"
    )
    return count
