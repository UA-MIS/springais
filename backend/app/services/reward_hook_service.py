"""Reward Hook Service -- Central event-to-reward dispatcher.

Existing route handlers call a single method on this service after
a rewarded action succeeds. The service handles all downstream effects:
XP, Coins, achievements, quest progress.

Security fixes incorporated:
- FINDING-ARCH-001: Structured error logging with user_id, event_type, event_key
- FINDING-SEC-005: Idempotent event_keys prevent duplicate rewards
- FINDING-INT-002: Calls ensure_progression_exists() before processing

References: FR-020, D-MM-10
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from uuid import UUID

from sqlalchemy.orm import Session

from app.services.progression_service import (
    AwardCoinsResult,
    AwardXPResult,
    ProgressionService,
    progression_service as _default_progression_service,
)

logger = logging.getLogger(__name__)


@dataclass
class RewardConfig:
    """XP and Coin amounts for an event type."""

    xp: int = 0
    coins: int = 0


@dataclass
class RewardResult:
    """Aggregated result from processing a platform action."""

    xp_awarded: int = 0
    coins_awarded: int = 0
    level_up: bool = False
    new_level: int | None = None
    new_title: str | None = None
    achievements_unlocked: list[dict] = field(default_factory=list)
    quest_updates: list[dict] = field(default_factory=list)
    already_awarded: bool = False


# Reward configuration table -- Architecture Section 4.4
REWARD_CONFIG: dict[str, RewardConfig] = {
    "module_completed": RewardConfig(xp=50, coins=0),
    "assessment_completed": RewardConfig(xp=75, coins=0),
    "milestone_passed": RewardConfig(xp=150, coins=0),
    "certification_earned": RewardConfig(xp=300, coins=0),
    "weekly_consistency": RewardConfig(xp=100, coins=0),
    "daily_login": RewardConfig(xp=0, coins=10),
    "streak_3": RewardConfig(xp=0, coins=50),
    "streak_7": RewardConfig(xp=0, coins=100),
    "first_module_week": RewardConfig(xp=0, coins=40),
    "peer_endorsement": RewardConfig(xp=0, coins=25),
    "side_quest_completed": RewardConfig(xp=0, coins=100),
    "roadmap_generated": RewardConfig(xp=50, coins=25),
    "first_match_view": RewardConfig(xp=50, coins=25),
    "resume_uploaded": RewardConfig(xp=50, coins=25),
    "profile_completed": RewardConfig(xp=50, coins=25),
    "explorer_completed": RewardConfig(xp=50, coins=25),
    "walkthrough_step": RewardConfig(xp=50, coins=25),
}


class RewardHookService:
    """Central event-to-reward dispatcher.

    Existing route handlers call process_action() after a rewarded action
    succeeds. This service orchestrates XP/Coin awards, achievement
    evaluation, and quest progress in a single call.
    """

    def __init__(
        self,
        progression_service: ProgressionService | None = None,
        achievement_service=None,
        quest_service=None,
    ):
        self.progression = progression_service or _default_progression_service
        self.achievement = achievement_service
        self.quest = quest_service

    def process_action(
        self,
        db: Session,
        user_id: UUID,
        event_type: str,
        event_key: str | None = None,
        metadata: dict | None = None,
    ) -> RewardResult | None:
        """Process a platform action and distribute all rewards.

        FINDING-ARCH-001: Catches ALL exceptions internally with structured
        logging. Never propagates exceptions to the caller.
        FINDING-INT-002: Calls ensure_progression_exists() first.
        """
        try:
            return self._process_action_internal(
                db, user_id, event_type, event_key, metadata
            )
        except Exception:
            logger.exception(
                "Gamification reward failed",
                extra={
                    "user_id": str(user_id),
                    "event_type": event_type,
                    "event_key": event_key,
                },
            )
            return None

    def _process_action_internal(
        self,
        db: Session,
        user_id: UUID,
        event_type: str,
        event_key: str | None = None,
        metadata: dict | None = None,
    ) -> RewardResult:
        """Internal implementation -- may raise exceptions."""
        # 0. Ensure progression row exists (FINDING-INT-002)
        self.progression.ensure_progression_exists(db, user_id)

        # 1. Look up reward config
        config = REWARD_CONFIG.get(event_type)
        if config is None:
            logger.warning(
                "No REWARD_CONFIG entry for event_type=%s", event_type,
                extra={"user_id": str(user_id), "event_type": event_type},
            )
            return RewardResult()

        result = RewardResult()

        # 2. Award XP if configured
        xp_result: AwardXPResult | None = None
        if config.xp > 0:
            xp_result = self.progression.award_xp(
                db, user_id, config.xp, event_type, event_key, metadata
            )
            if xp_result.already_awarded:
                result.already_awarded = True
                return result
            result.xp_awarded = xp_result.xp_awarded
            result.level_up = xp_result.level_up
            result.new_level = xp_result.new_level
            result.coins_awarded += xp_result.coins_from_level_up

        # 3. Award Coins if configured
        if config.coins > 0:
            coins_result: AwardCoinsResult = self.progression.award_coins(
                db, user_id, config.coins, event_type
            )
            result.coins_awarded += coins_result.coins_awarded

        # 4. Evaluate achievements (if service available)
        if self.achievement is not None:
            try:
                from app.models.progression import UserProgression

                prog = (
                    db.query(UserProgression)
                    .filter(UserProgression.user_id == user_id)
                    .first()
                )
                if prog:
                    unlocked = self.achievement.evaluate_achievements(
                        db, user_id, event_type, prog
                    )
                    result.achievements_unlocked = [
                        {
                            "id": a.id if hasattr(a, "id") else str(a),
                            "name": a.name if hasattr(a, "name") else str(a),
                        }
                        for a in (unlocked or [])
                    ]
            except Exception:
                logger.exception(
                    "Achievement evaluation failed",
                    extra={"user_id": str(user_id), "event_type": event_type},
                )

        # 5. Evaluate quest progress (graceful if not yet implemented)
        if self.quest is not None:
            try:
                quest_updates = self.quest.evaluate_quest_progress(
                    db, user_id, event_type, event_key
                )
                result.quest_updates = [
                    {
                        "quest_id": str(u.quest_id) if hasattr(u, "quest_id") else str(u),
                        "status": u.status if hasattr(u, "status") else "updated",
                    }
                    for u in (quest_updates or [])
                ]
            except Exception:
                logger.exception(
                    "Quest progress evaluation failed",
                    extra={"user_id": str(user_id), "event_type": event_type},
                )

        return result

    def get_reward_config(self, event_type: str) -> RewardConfig | None:
        """Look up XP/Coin amounts for an event type."""
        return REWARD_CONFIG.get(event_type)


# Module-level singleton -- wired with achievement_service and quest_service
from app.services.achievement_service import achievement_service as _default_achievement_service
from app.services.quest_service import quest_service as _default_quest_service

reward_hook_service = RewardHookService(
    achievement_service=_default_achievement_service,
    quest_service=_default_quest_service,
)
