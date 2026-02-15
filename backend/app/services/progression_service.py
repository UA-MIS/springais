"""Progression service -- all XP, Coin, Level, and Login Streak mutations.

All methods accept a SQLAlchemy Session and operate within the caller's
transaction. The caller is responsible for commit/rollback.

Security fixes incorporated:
- FINDING-SEC-002: SELECT FOR UPDATE acquired BEFORE inserting events
- FINDING-INT-001: db.flush() after each mutation in multi-step operations
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.cosmetic import UserEquippedItem
from app.models.progression import CoinTransaction, GamificationEvent, UserProgression

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# XP Threshold Table (linear-step curve) -- ADR-MM-005
# ---------------------------------------------------------------------------

XP_THRESHOLDS: list[tuple[int, int, str]] = [
    # (level, total_xp_required, title)
    (1, 0, "Apprentice"),
    (2, 100, "Apprentice"),
    (3, 300, "Apprentice"),
    (4, 600, "Squire"),
    (5, 1000, "Squire"),
    (6, 1500, "Knight"),
    (7, 2100, "Knight"),
    (8, 2800, "Warrior"),
    (9, 3600, "Warrior"),
    (10, 4500, "Champion"),
]

# Feature unlocks by level -- FR-008
FEATURE_UNLOCKS = {
    3: "side_quests",
    5: "guild_rank",
    8: "advanced_arena",
    10: "special_title",
}

# Valid pages for visit tracking -- FINDING-AUTH-002
VALID_PAGES = frozenset([
    "/matches",
    "/profile",
    "/saved",
    "/roadmap",
    "/success-patterns",
    "/store",
    "/quests",
])


def compute_level_from_xp(xp_total: int) -> tuple[int, str]:
    """Derive level and title from total XP.

    For levels 1-10, use the threshold table.
    For levels 11+: threshold = 4500 + (level - 10) * 1000.
    Title mapping for 11+: 11-14 Master, 15-19 Grandmaster, 20+ Legend.
    """
    # Check from highest level down
    for i in range(len(XP_THRESHOLDS) - 1, -1, -1):
        level, threshold, title = XP_THRESHOLDS[i]
        if xp_total >= threshold:
            if level == 10:
                extra_level = (xp_total - 4500) // 1000
                if extra_level > 0:
                    actual_level = 10 + extra_level
                    if actual_level >= 20:
                        return actual_level, "Legend"
                    elif actual_level >= 15:
                        return actual_level, "Grandmaster"
                    else:
                        return actual_level, "Master"
            return level, title
    return 1, "Apprentice"


def compute_xp_for_next_level(level: int) -> int:
    """Return the total XP required to reach level+1."""
    if level < 10:
        return XP_THRESHOLDS[level][1]  # next level's threshold
    return 4500 + (level - 9) * 1000


def compute_level_progress(xp_total: int, level: int) -> tuple[int, int]:
    """Return (current_level_xp, xp_to_next_level)."""
    if level <= 10:
        current_threshold = XP_THRESHOLDS[level - 1][1]
    else:
        current_threshold = 4500 + (level - 10) * 1000

    next_threshold = compute_xp_for_next_level(level)

    current_level_xp = xp_total - current_threshold
    xp_to_next_level = next_threshold - xp_total

    return current_level_xp, max(0, xp_to_next_level)


def get_feature_unlocks(level: int) -> dict[str, bool]:
    """Return feature unlock state for the given level."""
    return {
        "side_quests": level >= 3,
        "guild_rank": level >= 5,
        "advanced_arena": level >= 8,
        "special_title": level >= 10,
    }


# ---------------------------------------------------------------------------
# Result Dataclasses
# ---------------------------------------------------------------------------


@dataclass
class AwardXPResult:
    already_awarded: bool = False
    xp_awarded: int = 0
    new_xp_total: int = 0
    old_level: int = 1
    new_level: int = 1
    level_up: bool = False
    coins_from_level_up: int = 0


@dataclass
class AwardCoinsResult:
    coins_awarded: int = 0
    new_balance: int = 0


@dataclass
class SpendCoinsResult:
    success: bool = False
    reason: str | None = None
    new_balance: int = 0


@dataclass
class LoginResult:
    is_new_day: bool = False
    login_streak: int = 0
    coins_awarded: int = 0
    streak_bonuses: list[dict] = field(default_factory=list)
    total_coins_awarded: int = 0


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------


class ProgressionService:
    """Encapsulates all XP, Coin, Level, and Login Streak mutations."""

    # --- Ensure Progression Exists ---

    def ensure_progression_exists(
        self,
        db: Session,
        user_id: UUID,
    ) -> UserProgression:
        """Returns existing progression row or creates one with defaults."""
        prog = (
            db.query(UserProgression)
            .filter(UserProgression.user_id == user_id)
            .first()
        )
        if prog is None:
            prog = UserProgression(user_id=user_id)
            db.add(prog)
            db.flush()
        return prog

    # --- XP Operations ---

    def award_xp(
        self,
        db: Session,
        user_id: UUID,
        amount: int,
        event_type: str,
        event_key: str | None = None,
        metadata: dict | None = None,
    ) -> AwardXPResult:
        """Atomically awards XP to a user.

        FINDING-SEC-002 fix: Acquires SELECT FOR UPDATE lock BEFORE inserting
        the gamification event.
        FINDING-INT-001 fix: Calls db.flush() after each balance mutation.
        """
        if amount <= 0:
            return AwardXPResult()

        # 1. Acquire row lock FIRST (FINDING-SEC-002)
        prog = (
            db.query(UserProgression)
            .filter(UserProgression.user_id == user_id)
            .with_for_update()
            .first()
        )
        if prog is None:
            prog = self.ensure_progression_exists(db, user_id)
            # Re-acquire with lock
            prog = (
                db.query(UserProgression)
                .filter(UserProgression.user_id == user_id)
                .with_for_update()
                .first()
            )

        # 2. Check idempotency
        if event_key is not None:
            existing = (
                db.query(GamificationEvent)
                .filter(
                    GamificationEvent.user_id == user_id,
                    GamificationEvent.event_key == event_key,
                )
                .first()
            )
            if existing:
                return AwardXPResult(already_awarded=True, new_xp_total=prog.xp_total)

        # 3. Insert gamification event
        event = GamificationEvent(
            user_id=user_id,
            event_type=event_type,
            event_key=event_key,
            xp_awarded=amount,
            coins_awarded=0,
            metadata_=metadata,
        )
        try:
            savepoint = db.begin_nested()
            db.add(event)
            savepoint.commit()
        except IntegrityError:
            # FINDING-SEC-002: Handle unique constraint violation gracefully
            # Savepoint is automatically rolled back; outer transaction preserved
            return AwardXPResult(already_awarded=True, new_xp_total=prog.xp_total)

        # 4. Update XP
        old_xp = prog.xp_total
        old_level, _ = compute_level_from_xp(old_xp)
        new_xp = old_xp + amount
        new_level, new_title = compute_level_from_xp(new_xp)

        prog.xp_total = new_xp
        prog.level = new_level
        db.flush()  # FINDING-INT-001

        # 5. Level-up coin bonuses
        coins_from_level_up = 0
        if new_level > old_level:
            for lvl in range(old_level + 1, new_level + 1):
                bonus = lvl * 10
                coins_from_level_up += bonus
                self.award_coins(db, user_id, bonus, "level_up_bonus")
                # Insert level_up event
                level_event = GamificationEvent(
                    user_id=user_id,
                    event_type="level_up",
                    event_key=f"level_up:{lvl}",
                    xp_awarded=0,
                    coins_awarded=bonus,
                    metadata_={"level": lvl, "title": compute_level_from_xp(
                        XP_THRESHOLDS[lvl - 1][1] if lvl <= 10 else 4500 + (lvl - 10) * 1000
                    )[1]},
                )
                try:
                    savepoint = db.begin_nested()
                    db.add(level_event)
                    savepoint.commit()
                except IntegrityError:
                    # Already recorded this level-up, skip
                    # Savepoint is automatically rolled back; outer transaction preserved
                    pass

        return AwardXPResult(
            xp_awarded=amount,
            new_xp_total=new_xp,
            old_level=old_level,
            new_level=new_level,
            level_up=new_level > old_level,
            coins_from_level_up=coins_from_level_up,
        )

    # --- Coin Operations ---

    def award_coins(
        self,
        db: Session,
        user_id: UUID,
        amount: int,
        source: str,
        reference_id: UUID | None = None,
    ) -> AwardCoinsResult:
        """Atomically awards coins."""
        if amount <= 0:
            return AwardCoinsResult()

        # SELECT FOR UPDATE
        prog = (
            db.query(UserProgression)
            .filter(UserProgression.user_id == user_id)
            .with_for_update()
            .first()
        )
        if prog is None:
            return AwardCoinsResult()

        prog.coin_balance += amount
        db.flush()  # FINDING-INT-001

        txn = CoinTransaction(
            user_id=user_id,
            amount=amount,
            balance_after=prog.coin_balance,
            transaction_type="earned",
            source=source,
            reference_id=reference_id,
        )
        db.add(txn)
        db.flush()  # FINDING-INT-001

        return AwardCoinsResult(
            coins_awarded=amount,
            new_balance=prog.coin_balance,
        )

    def spend_coins(
        self,
        db: Session,
        user_id: UUID,
        amount: int,
        source: str,
        reference_id: UUID | None = None,
    ) -> SpendCoinsResult:
        """Atomically spends coins."""
        if amount <= 0:
            return SpendCoinsResult(success=False, reason="invalid_amount")

        # SELECT FOR UPDATE
        prog = (
            db.query(UserProgression)
            .filter(UserProgression.user_id == user_id)
            .with_for_update()
            .first()
        )
        if prog is None:
            return SpendCoinsResult(success=False, reason="progression_not_found")

        if prog.coin_balance < amount:
            return SpendCoinsResult(
                success=False,
                reason="insufficient_coins",
                new_balance=prog.coin_balance,
            )

        prog.coin_balance -= amount
        db.flush()  # FINDING-INT-001

        txn = CoinTransaction(
            user_id=user_id,
            amount=-amount,
            balance_after=prog.coin_balance,
            transaction_type="spent",
            source=source,
            reference_id=reference_id,
        )
        db.add(txn)
        db.flush()  # FINDING-INT-001

        return SpendCoinsResult(
            success=True,
            new_balance=prog.coin_balance,
        )

    # --- Login Streak ---

    def record_login(
        self,
        db: Session,
        user_id: UUID,
    ) -> LoginResult:
        """Records daily login. Manages streak logic.

        Uses UTC dates for consistency.
        """
        # SELECT FOR UPDATE
        prog = (
            db.query(UserProgression)
            .filter(UserProgression.user_id == user_id)
            .with_for_update()
            .first()
        )
        if prog is None:
            prog = self.ensure_progression_exists(db, user_id)
            prog = (
                db.query(UserProgression)
                .filter(UserProgression.user_id == user_id)
                .with_for_update()
                .first()
            )

        today = datetime.now(timezone.utc).date()

        # Already processed today
        if prog.last_login_date == today:
            return LoginResult(
                is_new_day=False,
                login_streak=prog.login_streak,
            )

        # Streak logic
        yesterday = date.fromordinal(today.toordinal() - 1)
        if prog.last_login_date == yesterday:
            prog.login_streak += 1
        else:
            prog.login_streak = 1

        prog.last_login_date = today
        db.flush()

        # Award daily login coins (10 coins)
        total_coins = 0
        streak_bonuses = []

        daily_result = self.award_coins(db, user_id, 10, "daily_login")
        total_coins += daily_result.coins_awarded

        # Insert daily_login gamification event
        daily_event = GamificationEvent(
            user_id=user_id,
            event_type="daily_login",
            event_key=None,  # repeatable
            xp_awarded=0,
            coins_awarded=10,
        )
        db.add(daily_event)
        db.flush()

        # Streak milestones -- each creates its own gamification_event and coin_transaction
        if prog.login_streak > 0 and prog.login_streak % 7 == 0:
            bonus_result = self.award_coins(db, user_id, 100, "streak_7_bonus")
            total_coins += bonus_result.coins_awarded
            streak_bonuses.append({"type": "streak_7", "coins": 100})
            streak_7_event = GamificationEvent(
                user_id=user_id,
                event_type="streak_7",
                event_key=None,  # repeatable
                xp_awarded=0,
                coins_awarded=100,
            )
            db.add(streak_7_event)
            db.flush()

        if prog.login_streak > 0 and prog.login_streak % 3 == 0:
            bonus_result = self.award_coins(db, user_id, 50, "streak_3_bonus")
            total_coins += bonus_result.coins_awarded
            streak_bonuses.append({"type": "streak_3", "coins": 50})
            streak_3_event = GamificationEvent(
                user_id=user_id,
                event_type="streak_3",
                event_key=None,  # repeatable
                xp_awarded=0,
                coins_awarded=50,
            )
            db.add(streak_3_event)
            db.flush()

        return LoginResult(
            is_new_day=True,
            login_streak=prog.login_streak,
            coins_awarded=10,
            streak_bonuses=streak_bonuses,
            total_coins_awarded=total_coins,
        )

    # --- Read Operations ---

    def get_progression(
        self,
        db: Session,
        user_id: UUID,
    ) -> dict | None:
        """Returns full progression state as a dict with computed fields."""
        prog = (
            db.query(UserProgression)
            .filter(UserProgression.user_id == user_id)
            .first()
        )
        if prog is None:
            return None

        level, title = compute_level_from_xp(prog.xp_total)
        current_level_xp, xp_to_next_level = compute_level_progress(
            prog.xp_total, level
        )

        # Fetch onboarding_complete from user_profiles
        from app.models.user_profile import UserProfile
        user = db.query(UserProfile).filter(UserProfile.id == user_id).first()
        onboarding_complete = user.onboarding_complete if user else True

        return {
            "xp_total": prog.xp_total,
            "level": level,
            "title": title,
            "coin_balance": prog.coin_balance,
            "login_streak": prog.login_streak,
            "last_login_date": (
                prog.last_login_date.isoformat() if prog.last_login_date else None
            ),
            "adventure_mode_enabled": prog.adventure_mode_enabled,
            "current_level_xp": current_level_xp,
            "xp_to_next_level": xp_to_next_level,
            "feature_unlocks": get_feature_unlocks(level),
            "equipped_items": self._get_equipped_items(db, user_id),
            "unlocked_achievements_count": self._get_achievement_count(db, user_id),
            "active_quests_count": self._get_active_quest_count(db, user_id),
            "walkthrough_step": prog.walkthrough_step,
            "walkthrough_completed": prog.walkthrough_completed,
            "onboarding_complete": onboarding_complete,
        }

    def _get_equipped_items(self, db: Session, user_id: UUID) -> dict:
        """Query equipped items joined with cosmetic catalog. Story 6.6."""
        all_slots = {
            "pet": None, "pedestal": None, "aura": None,
            "hairstyle": None, "color_palette": None, "banner": None, "emblem": None,
        }
        equipped_rows = (
            db.query(UserEquippedItem)
            .filter(UserEquippedItem.user_id == user_id)
            .all()
        )
        for row in equipped_rows:
            cosmetic = row.cosmetic
            if cosmetic:
                all_slots[row.slot] = {
                    "id": str(cosmetic.id),
                    "name": cosmetic.name,
                    "category": cosmetic.category,
                    "rarity": cosmetic.rarity,
                }
        return all_slots

    def _get_achievement_count(self, db: Session, user_id: UUID) -> int:
        """Count unlocked achievements for user."""
        from app.models.achievement import UserAchievement
        return (
            db.query(func.count(UserAchievement.id))
            .filter(UserAchievement.user_id == user_id)
            .scalar()
        ) or 0

    def _get_active_quest_count(self, db: Session, user_id: UUID) -> int:
        """Count in-progress quests for user."""
        from app.models.quest import UserQuestProgress
        return (
            db.query(func.count(UserQuestProgress.id))
            .filter(
                UserQuestProgress.user_id == user_id,
                UserQuestProgress.status == "in_progress",
            )
            .scalar()
        ) or 0

    def toggle_adventure_mode(
        self,
        db: Session,
        user_id: UUID,
    ) -> bool:
        """Toggle adventure_mode_enabled and return new state."""
        prog = (
            db.query(UserProgression)
            .filter(UserProgression.user_id == user_id)
            .first()
        )
        if prog is None:
            prog = self.ensure_progression_exists(db, user_id)

        prog.adventure_mode_enabled = not prog.adventure_mode_enabled
        db.flush()
        return prog.adventure_mode_enabled


# Module-level singleton
progression_service = ProgressionService()
