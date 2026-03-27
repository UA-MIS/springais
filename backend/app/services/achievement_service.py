"""Achievement Service -- evaluates and unlocks achievements.

FINDING-PERF-001 fix: Uses a single GROUP BY query to get all event counts
instead of N+1 individual COUNT queries per achievement.

References: FR-013, NFR-001, D-MM-6
Architecture Section 4.3
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.achievement import AchievementCatalog, UserAchievement
from app.models.progression import GamificationEvent, UserProgression
from app.services.progression_service import (
    ProgressionService,
    progression_service as _default_progression_service,
)

logger = logging.getLogger(__name__)


@dataclass
class UnlockedAchievement:
    """An achievement that was just unlocked."""

    id: str
    name: str
    description: str
    icon: str
    category: str
    xp_reward: int
    coin_reward: int


@dataclass
class AchievementWithStatus:
    """Achievement catalog entry with user unlock status."""

    id: str
    name: str
    description: str
    icon: str
    category: str
    xp_reward: int
    coin_reward: int
    is_unlocked: bool
    unlocked_at: datetime | None


class AchievementService:
    """Evaluates and unlocks achievements based on gamification events.

    The catalog is cached in memory after first load (~25 rows).
    """

    def __init__(self, progression_service: ProgressionService | None = None):
        self.progression = progression_service or _default_progression_service
        self._catalog_cache: list[AchievementCatalog] | None = None

    def load_catalog(self, db: Session) -> list[AchievementCatalog]:
        """Load and cache the active achievement catalog."""
        if self._catalog_cache is not None:
            return self._catalog_cache

        catalog = (
            db.query(AchievementCatalog)
            .filter(AchievementCatalog.is_active.is_(True))
            .order_by(AchievementCatalog.sort_order)
            .all()
        )
        # Expunge from session so cached objects survive across requests
        for item in catalog:
            db.expunge(item)
        self._catalog_cache = catalog
        return catalog

    def invalidate_cache(self) -> None:
        """Clear the catalog cache (for testing)."""
        self._catalog_cache = None

    def evaluate_achievements(
        self,
        db: Session,
        user_id: UUID,
        event_type: str,
        progression: UserProgression,
    ) -> list[UnlockedAchievement]:
        """Evaluate all active achievements against the user's current state.

        FINDING-PERF-001 fix: Uses a SINGLE batch query
        SELECT event_type, COUNT(*) FROM gamification_events
        WHERE user_id = ? GROUP BY event_type
        instead of individual COUNT queries per achievement.

        Steps:
        1. Load catalog from cache.
        2. Get user's already-unlocked achievement IDs in a single query.
        3. For event_based: batch query all event counts, evaluate in-memory.
        4. For threshold_based: check progression fields.
        5. For manual: skip.
        6. For each newly unlocked: insert row, award XP/Coins.
        """
        catalog = self.load_catalog(db)
        if not catalog:
            return []

        # Get already-unlocked achievement IDs
        unlocked_ids = set(
            row[0]
            for row in db.query(UserAchievement.achievement_id)
            .filter(UserAchievement.user_id == user_id)
            .all()
        )

        # FINDING-PERF-001: Batch event count query
        event_counts: dict[str, int] = {}
        rows = (
            db.query(
                GamificationEvent.event_type,
                func.count(GamificationEvent.id),
            )
            .filter(GamificationEvent.user_id == user_id)
            .group_by(GamificationEvent.event_type)
            .all()
        )
        for etype, count in rows:
            event_counts[etype] = count

        newly_unlocked: list[UnlockedAchievement] = []

        for achievement in catalog:
            if achievement.id in unlocked_ids:
                continue

            triggered = self._check_trigger(
                achievement, event_counts, progression
            )
            if not triggered:
                continue

            # Unlock the achievement
            user_achievement = UserAchievement(
                user_id=user_id,
                achievement_id=achievement.id,
                unlocked_at=datetime.now(timezone.utc),
            )
            try:
                savepoint = db.begin_nested()
                db.add(user_achievement)
                savepoint.commit()
            except IntegrityError:
                # Already unlocked (race condition), skip
                # Savepoint is automatically rolled back; outer transaction preserved
                continue

            # Award XP and Coins for achievement
            if achievement.xp_reward > 0:
                self.progression.award_xp(
                    db,
                    user_id,
                    achievement.xp_reward,
                    "achievement_unlocked",
                    event_key=f"achievement:{achievement.id}",
                    metadata={"achievement_id": achievement.id},
                )

            if achievement.coin_reward > 0:
                self.progression.award_coins(
                    db,
                    user_id,
                    achievement.coin_reward,
                    "achievement_unlocked",
                )

            newly_unlocked.append(
                UnlockedAchievement(
                    id=achievement.id,
                    name=achievement.name,
                    description=achievement.description,
                    icon=achievement.icon,
                    category=achievement.category,
                    xp_reward=achievement.xp_reward,
                    coin_reward=achievement.coin_reward,
                )
            )

        return newly_unlocked

    def _check_trigger(
        self,
        achievement: AchievementCatalog,
        event_counts: dict[str, int],
        progression: UserProgression,
    ) -> bool:
        """Check if an achievement's trigger condition is met."""
        config = achievement.trigger_config

        if achievement.trigger_type == "event_based":
            target_event = config.get("event_type", "")
            required_count = config.get("count", 1)
            actual_count = event_counts.get(target_event, 0)
            return actual_count >= required_count

        elif achievement.trigger_type == "threshold_based":
            field_name = config.get("field", "")
            threshold = config.get("threshold", 0)
            actual_value = getattr(progression, field_name, 0)
            return actual_value >= threshold

        elif achievement.trigger_type == "manual":
            # Manual achievements are not auto-triggered
            return False

        return False

    def get_user_achievements(
        self, db: Session, user_id: UUID
    ) -> list[UserAchievement]:
        """Return all achievements unlocked by user."""
        return (
            db.query(UserAchievement)
            .filter(UserAchievement.user_id == user_id)
            .order_by(UserAchievement.unlocked_at.desc())
            .all()
        )

    def get_catalog_with_status(
        self, db: Session, user_id: UUID
    ) -> list[AchievementWithStatus]:
        """Return full catalog with is_unlocked and unlocked_at per user."""
        catalog = self.load_catalog(db)

        # Get all user unlocks in a single query
        unlocked_map: dict[str, datetime] = {}
        for row in (
            db.query(
                UserAchievement.achievement_id,
                UserAchievement.unlocked_at,
            )
            .filter(UserAchievement.user_id == user_id)
            .all()
        ):
            unlocked_map[row[0]] = row[1]

        result = []
        for ach in catalog:
            unlocked_at = unlocked_map.get(ach.id)
            result.append(
                AchievementWithStatus(
                    id=ach.id,
                    name=ach.name,
                    description=ach.description,
                    icon=ach.icon,
                    category=ach.category,
                    xp_reward=ach.xp_reward,
                    coin_reward=ach.coin_reward,
                    is_unlocked=unlocked_at is not None,
                    unlocked_at=unlocked_at,
                )
            )

        return result


# Module-level singleton
achievement_service = AchievementService()
