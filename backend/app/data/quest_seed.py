"""Quest Catalog Seed Data.

5 themed side quests matching FR-018.2 / Story 7.1.
Each quest has level requirements, learning-task requirements, and rewards.

References: FR-018, D-MM-9
Architecture Section 2.10
"""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

QUEST_SEED_DATA: list[dict[str, Any]] = [
    {
        "name": "The Squire's Trial",
        "description": (
            "Complete the onboarding walkthrough to prove your worth as "
            "a new member of the Guild. Cedric will guide you through "
            "each step of your initiation."
        ),
        "level_required": 0,
        "xp_reward": 950,
        "coin_reward": 475,
        "sort_order": 1,
        "requirements": [
            {
                "type": "walkthrough_step",
                "target_id": None,
                "count": 7,
                "description": "Complete all 7 walkthrough steps",
            },
        ],
    },
    {
        "name": "Trade Data Analysis",
        "description": (
            "The Merchant Guild requests your aid in analyzing trade "
            "routes. Complete analytical modules and prove your worth "
            "with an assessment to earn the Merchant Ring."
        ),
        "level_required": 3,
        "xp_reward": 200,
        "coin_reward": 150,
        "sort_order": 10,
        "requirements": [
            {
                "type": "module_completed",
                "target_id": None,
                "count": 2,
                "description": "Complete 2 analytics modules",
            },
            {
                "type": "assessment_completed",
                "target_id": None,
                "count": 1,
                "description": "Pass 1 assessment",
            },
        ],
    },
    {
        "name": "The Scribe's Request",
        "description": (
            "The Royal Scribe needs your credentials cataloged. "
            "Upload your resume and complete your profile to receive "
            "the Scribe's Quill Banner."
        ),
        "level_required": 3,
        "xp_reward": 150,
        "coin_reward": 100,
        "sort_order": 20,
        "requirements": [
            {
                "type": "resume_uploaded",
                "target_id": None,
                "count": 1,
                "description": "Upload your resume",
            },
            {
                "type": "profile_completed",
                "target_id": None,
                "count": 1,
                "description": "Complete your profile",
            },
        ],
    },
    {
        "name": "Knight's Trial",
        "description": (
            "The Order of Knights challenges you to prove your "
            "dedication through sustained learning. Complete three "
            "modules and an assessment to earn the Knight's Crest Emblem."
        ),
        "level_required": 5,
        "xp_reward": 300,
        "coin_reward": 200,
        "sort_order": 30,
        "requirements": [
            {
                "type": "module_completed",
                "target_id": None,
                "count": 3,
                "description": "Complete 3 skill modules",
            },
            {
                "type": "assessment_completed",
                "target_id": None,
                "count": 1,
                "description": "Pass 1 assessment",
            },
        ],
    },
    {
        "name": "Arena Challenge",
        "description": (
            "Enter the Arena and face a gauntlet of assessments. "
            "Only the most knowledgeable warriors can conquer five "
            "assessments and claim the Arena Champion Cape."
        ),
        "level_required": 8,
        "xp_reward": 400,
        "coin_reward": 300,
        "sort_order": 40,
        "requirements": [
            {
                "type": "assessment_completed",
                "target_id": None,
                "count": 5,
                "description": "Pass 5 assessments",
            },
        ],
    },
    {
        "name": "Legend's Path",
        "description": (
            "Walk the path of legends. Master ten modules, conquer "
            "three milestones, and earn a certification to prove you "
            "are worthy of the Legendary Crown."
        ),
        "level_required": 10,
        "xp_reward": 600,
        "coin_reward": 500,
        "sort_order": 50,
        "requirements": [
            {
                "type": "module_completed",
                "target_id": None,
                "count": 10,
                "description": "Complete 10 skill modules",
            },
            {
                "type": "milestone_passed",
                "target_id": None,
                "count": 3,
                "description": "Pass 3 roadmap milestones",
            },
            {
                "type": "certification_earned",
                "target_id": None,
                "count": 1,
                "description": "Earn 1 certification",
            },
        ],
    },
]


def seed_quest_catalog(db: Session) -> int:
    """Seed the quest catalog with themed side quests.

    Returns the number of quests added.
    """
    from app.models.quest import SideQuestCatalog

    count = 0

    for entry in QUEST_SEED_DATA:
        existing = (
            db.query(SideQuestCatalog)
            .filter(SideQuestCatalog.name == entry["name"])
            .first()
        )
        if existing:
            continue

        quest = SideQuestCatalog(
            name=entry["name"],
            description=entry["description"],
            level_required=entry["level_required"],
            xp_reward=entry["xp_reward"],
            coin_reward=entry["coin_reward"],
            cosmetic_reward_id=None,
            requirements=entry["requirements"],
            is_active=True,
            sort_order=entry["sort_order"],
        )
        db.add(quest)
        db.flush()
        count += 1

    db.commit()
    logger.info(f"Seeded quest catalog with {count} new quests ({len(QUEST_SEED_DATA)} total)")
    return count
