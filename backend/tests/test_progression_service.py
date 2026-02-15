"""Tests for progression service.

Covers Stories 1.5, 1.6: Core mutations, login/streak, XP threshold logic.
Also covers Epic 2 Stories 2.1-2.3: XP thresholds, multi-level jumps, feature unlocks.
"""

from __future__ import annotations

import os
import sys
from datetime import date, datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from app.database import DATABASE_URL
from app.models import Base
from app.models.progression import CoinTransaction, GamificationEvent, UserProgression
from app.models.user_profile import UserProfile
from app.services.progression_service import (
    ProgressionService,
    compute_level_from_xp,
    compute_level_progress,
    compute_xp_for_next_level,
    get_feature_unlocks,
)

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", DATABASE_URL)
engine = create_engine(TEST_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def _create_schema():
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture()
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = SessionLocal(bind=connection)
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture()
def service():
    return ProgressionService()


def _utc_today() -> date:
    """Return today's date in UTC, matching the service's logic."""
    return datetime.now(timezone.utc).date()


def _create_user(db, email="svc_test@test.com"):
    from app.utils.security import hash_password

    user = UserProfile(
        email=email,
        hashed_password=hash_password("TestPass123"),
        full_name="Test User",
        skills=[],
        skill_assessment_scores={},
    )
    db.add(user)
    db.flush()
    return user


# --- XP Threshold Tests (Story 2.1) ---


class TestXPThresholds:
    def test_level_1_at_zero_xp(self):
        level, title = compute_level_from_xp(0)
        assert level == 1
        assert title == "Apprentice"

    def test_level_2_at_100_xp(self):
        level, title = compute_level_from_xp(100)
        assert level == 2
        assert title == "Apprentice"

    def test_level_3_at_300_xp(self):
        level, title = compute_level_from_xp(300)
        assert level == 3
        assert title == "Apprentice"

    def test_level_4_squire(self):
        level, title = compute_level_from_xp(600)
        assert level == 4
        assert title == "Squire"

    def test_level_6_knight(self):
        level, title = compute_level_from_xp(1500)
        assert level == 6
        assert title == "Knight"

    def test_level_8_warrior(self):
        level, title = compute_level_from_xp(2800)
        assert level == 8
        assert title == "Warrior"

    def test_level_10_champion(self):
        level, title = compute_level_from_xp(4500)
        assert level == 10
        assert title == "Champion"

    def test_level_11_master(self):
        level, title = compute_level_from_xp(5500)
        assert level == 11
        assert title == "Master"

    def test_level_15_grandmaster(self):
        level, title = compute_level_from_xp(9500)
        assert level == 15
        assert title == "Grandmaster"

    def test_level_20_legend(self):
        level, title = compute_level_from_xp(14500)
        assert level == 20
        assert title == "Legend"

    def test_between_thresholds(self):
        level, title = compute_level_from_xp(50)
        assert level == 1
        assert title == "Apprentice"

    def test_exactly_on_threshold(self):
        level, title = compute_level_from_xp(1000)
        assert level == 5
        assert title == "Squire"

    def test_xp_for_next_level_low(self):
        assert compute_xp_for_next_level(1) == 100
        assert compute_xp_for_next_level(2) == 300
        assert compute_xp_for_next_level(9) == 4500

    def test_xp_for_next_level_high(self):
        assert compute_xp_for_next_level(10) == 5500
        assert compute_xp_for_next_level(11) == 6500

    def test_level_progress_at_zero(self):
        current, to_next = compute_level_progress(0, 1)
        assert current == 0
        assert to_next == 100

    def test_level_progress_midway(self):
        current, to_next = compute_level_progress(150, 2)
        assert current == 50  # 150 - 100
        assert to_next == 150  # 300 - 150


# --- Feature Unlock Tests (Story 2.3) ---


class TestFeatureUnlocks:
    def test_level_1_no_unlocks(self):
        unlocks = get_feature_unlocks(1)
        assert not unlocks["side_quests"]
        assert not unlocks["guild_rank"]
        assert not unlocks["advanced_arena"]
        assert not unlocks["special_title"]

    def test_level_3_side_quests(self):
        unlocks = get_feature_unlocks(3)
        assert unlocks["side_quests"]
        assert not unlocks["guild_rank"]

    def test_level_5_guild_rank(self):
        unlocks = get_feature_unlocks(5)
        assert unlocks["side_quests"]
        assert unlocks["guild_rank"]
        assert not unlocks["advanced_arena"]

    def test_level_10_all_unlocked(self):
        unlocks = get_feature_unlocks(10)
        assert all(unlocks.values())


# --- Ensure Progression Exists Tests ---


class TestEnsureProgressionExists:
    def test_creates_new_row(self, db_session, service):
        user = _create_user(db_session, "ensure_new@test.com")
        prog = service.ensure_progression_exists(db_session, user.id)
        assert prog.user_id == user.id
        assert prog.xp_total == 0

    def test_returns_existing_row(self, db_session, service):
        user = _create_user(db_session, "ensure_exist@test.com")
        prog1 = service.ensure_progression_exists(db_session, user.id)
        prog2 = service.ensure_progression_exists(db_session, user.id)
        assert prog1.id == prog2.id


# --- Award XP Tests (Story 1.5 + Story 2.2) ---


class TestAwardXP:
    def test_basic_xp_award(self, db_session, service):
        user = _create_user(db_session, "xp_basic@test.com")
        service.ensure_progression_exists(db_session, user.id)

        result = service.award_xp(
            db_session, user.id, 50, "module_completed", "module:test1"
        )
        assert result.xp_awarded == 50
        assert result.new_xp_total == 50
        assert not result.level_up

    def test_xp_award_with_level_up(self, db_session, service):
        user = _create_user(db_session, "xp_levelup@test.com")
        service.ensure_progression_exists(db_session, user.id)

        result = service.award_xp(
            db_session, user.id, 100, "module_completed", "module:test2"
        )
        assert result.new_xp_total == 100
        assert result.old_level == 1
        assert result.new_level == 2
        assert result.level_up is True
        assert result.coins_from_level_up == 20  # level 2 * 10

    def test_multi_level_jump(self, db_session, service):
        """Story 2.2: A single XP award that jumps multiple levels."""
        user = _create_user(db_session, "xp_multi@test.com")
        service.ensure_progression_exists(db_session, user.id)

        # Award enough XP to jump from level 1 to level 5 (need >= 1000)
        result = service.award_xp(
            db_session, user.id, 1000, "big_award", "big:test1"
        )
        assert result.old_level == 1
        assert result.new_level == 5
        assert result.level_up is True
        # Coin bonuses: level 2*10 + 3*10 + 4*10 + 5*10 = 140
        assert result.coins_from_level_up == 140

    def test_idempotent_event_key(self, db_session, service):
        user = _create_user(db_session, "xp_idempotent@test.com")
        service.ensure_progression_exists(db_session, user.id)

        result1 = service.award_xp(
            db_session, user.id, 50, "module_completed", "module:same"
        )
        assert result1.xp_awarded == 50

        result2 = service.award_xp(
            db_session, user.id, 50, "module_completed", "module:same"
        )
        assert result2.already_awarded is True
        assert result2.xp_awarded == 0

    def test_no_level_up_within_level(self, db_session, service):
        user = _create_user(db_session, "xp_nolevel@test.com")
        service.ensure_progression_exists(db_session, user.id)

        result = service.award_xp(
            db_session, user.id, 50, "module_completed", "module:nolevel"
        )
        assert result.level_up is False
        assert result.old_level == 1
        assert result.new_level == 1

    def test_zero_xp_returns_empty(self, db_session, service):
        user = _create_user(db_session, "xp_zero@test.com")
        service.ensure_progression_exists(db_session, user.id)

        result = service.award_xp(
            db_session, user.id, 0, "nothing", "nothing:test"
        )
        assert result.xp_awarded == 0


# --- Award Coins Tests (Story 1.5) ---


class TestAwardCoins:
    def test_basic_coin_award(self, db_session, service):
        user = _create_user(db_session, "coin_basic@test.com")
        service.ensure_progression_exists(db_session, user.id)

        result = service.award_coins(db_session, user.id, 100, "test_source")
        assert result.coins_awarded == 100
        assert result.new_balance == 100

    def test_coin_award_creates_transaction(self, db_session, service):
        user = _create_user(db_session, "coin_txn@test.com")
        service.ensure_progression_exists(db_session, user.id)

        service.award_coins(db_session, user.id, 100, "test_source")

        txn = (
            db_session.query(CoinTransaction)
            .filter(CoinTransaction.user_id == user.id)
            .first()
        )
        assert txn is not None
        assert txn.amount == 100
        assert txn.balance_after == 100
        assert txn.transaction_type == "earned"

    def test_multiple_awards_accumulate(self, db_session, service):
        user = _create_user(db_session, "coin_multi@test.com")
        service.ensure_progression_exists(db_session, user.id)

        service.award_coins(db_session, user.id, 50, "source1")
        result = service.award_coins(db_session, user.id, 30, "source2")
        assert result.new_balance == 80

        # Check that balance_after on second txn is correct (FINDING-INT-001)
        txns = (
            db_session.query(CoinTransaction)
            .filter(CoinTransaction.user_id == user.id)
            .order_by(CoinTransaction.created_at)
            .all()
        )
        assert len(txns) == 2
        assert txns[0].balance_after == 50
        assert txns[1].balance_after == 80


# --- Spend Coins Tests (Story 1.5) ---


class TestSpendCoins:
    def test_successful_spend(self, db_session, service):
        user = _create_user(db_session, "spend_ok@test.com")
        service.ensure_progression_exists(db_session, user.id)
        service.award_coins(db_session, user.id, 200, "seed")

        result = service.spend_coins(db_session, user.id, 50, "store_purchase")
        assert result.success is True
        assert result.new_balance == 150

    def test_insufficient_coins(self, db_session, service):
        user = _create_user(db_session, "spend_fail@test.com")
        service.ensure_progression_exists(db_session, user.id)
        service.award_coins(db_session, user.id, 30, "seed")

        result = service.spend_coins(db_session, user.id, 50, "store_purchase")
        assert result.success is False
        assert result.reason == "insufficient_coins"
        assert result.new_balance == 30

    def test_spend_creates_negative_amount_transaction(self, db_session, service):
        user = _create_user(db_session, "spend_txn@test.com")
        service.ensure_progression_exists(db_session, user.id)
        service.award_coins(db_session, user.id, 100, "seed")

        service.spend_coins(db_session, user.id, 40, "store_purchase")

        txns = (
            db_session.query(CoinTransaction)
            .filter(
                CoinTransaction.user_id == user.id,
                CoinTransaction.transaction_type == "spent",
            )
            .all()
        )
        assert len(txns) == 1
        assert txns[0].amount == -40
        assert txns[0].balance_after == 60


# --- Login Streak Tests (Story 1.6) ---


class TestRecordLogin:
    def test_first_login_ever(self, db_session, service):
        user = _create_user(db_session, "login_first@test.com")
        service.ensure_progression_exists(db_session, user.id)

        result = service.record_login(db_session, user.id)
        assert result.is_new_day is True
        assert result.login_streak == 1
        assert result.coins_awarded == 10

    def test_consecutive_day_increments_streak(self, db_session, service):
        user = _create_user(db_session, "login_consec@test.com")
        prog = service.ensure_progression_exists(db_session, user.id)

        # Set yesterday as last login (use UTC to match service logic)
        yesterday = _utc_today() - timedelta(days=1)
        prog.last_login_date = yesterday
        prog.login_streak = 3
        db_session.flush()

        result = service.record_login(db_session, user.id)
        assert result.is_new_day is True
        assert result.login_streak == 4

    def test_missed_day_resets_streak(self, db_session, service):
        user = _create_user(db_session, "login_missed@test.com")
        prog = service.ensure_progression_exists(db_session, user.id)

        two_days_ago = _utc_today() - timedelta(days=2)
        prog.last_login_date = two_days_ago
        prog.login_streak = 5
        db_session.flush()

        result = service.record_login(db_session, user.id)
        assert result.login_streak == 1

    def test_same_day_is_noop(self, db_session, service):
        user = _create_user(db_session, "login_sameday@test.com")
        prog = service.ensure_progression_exists(db_session, user.id)

        prog.last_login_date = _utc_today()
        prog.login_streak = 2
        db_session.flush()

        result = service.record_login(db_session, user.id)
        assert result.is_new_day is False
        assert result.login_streak == 2
        assert result.total_coins_awarded == 0

    def test_streak_3_milestone(self, db_session, service):
        user = _create_user(db_session, "login_streak3@test.com")
        prog = service.ensure_progression_exists(db_session, user.id)

        yesterday = _utc_today() - timedelta(days=1)
        prog.last_login_date = yesterday
        prog.login_streak = 2  # Next login will make it 3
        db_session.flush()

        result = service.record_login(db_session, user.id)
        assert result.login_streak == 3
        assert result.total_coins_awarded == 60  # 10 daily + 50 streak_3

    def test_streak_7_milestone(self, db_session, service):
        user = _create_user(db_session, "login_streak7@test.com")
        prog = service.ensure_progression_exists(db_session, user.id)

        yesterday = _utc_today() - timedelta(days=1)
        prog.last_login_date = yesterday
        prog.login_streak = 6  # Next login will make it 7
        db_session.flush()

        result = service.record_login(db_session, user.id)
        assert result.login_streak == 7
        assert result.total_coins_awarded == 110  # 10 daily + 100 streak_7

    def test_streak_21_gets_both_bonuses(self, db_session, service):
        """Day 21 is divisible by both 3 and 7."""
        user = _create_user(db_session, "login_streak21@test.com")
        prog = service.ensure_progression_exists(db_session, user.id)

        yesterday = _utc_today() - timedelta(days=1)
        prog.last_login_date = yesterday
        prog.login_streak = 20  # Next login will make it 21
        db_session.flush()

        result = service.record_login(db_session, user.id)
        assert result.login_streak == 21
        assert result.total_coins_awarded == 160  # 10 + 100 + 50

    def test_streak_6_double_streak_3(self, db_session, service):
        """Day 6 is divisible by 3 but not 7: daily + streak_3 only."""
        user = _create_user(db_session, "login_streak6@test.com")
        prog = service.ensure_progression_exists(db_session, user.id)

        yesterday = _utc_today() - timedelta(days=1)
        prog.last_login_date = yesterday
        prog.login_streak = 5
        db_session.flush()

        result = service.record_login(db_session, user.id)
        assert result.login_streak == 6
        assert result.total_coins_awarded == 60  # 10 daily + 50 streak_3

    def test_full_7_day_cycle_coin_accumulation(self, db_session, service):
        """Story 3.2 AC5: Full 7-day cycle yields 270 coins total.

        Day 1: 10 (daily)
        Day 2: 10 (daily)
        Day 3: 10 + 50 (daily + streak_3)
        Day 4: 10 (daily)
        Day 5: 10 (daily)
        Day 6: 10 + 50 (daily + streak_3)
        Day 7: 10 + 100 (daily + streak_7)
        Total: 70 + 100 + 100 = 270
        """
        user = _create_user(db_session, "login_7day@test.com")
        prog = service.ensure_progression_exists(db_session, user.id)

        total_coins = 0
        expected_per_day = [10, 10, 60, 10, 10, 60, 110]

        for day in range(7):
            # Set last_login_date to yesterday relative to "today"
            if day == 0:
                prog.last_login_date = None
                prog.login_streak = 0
            else:
                prog.last_login_date = _utc_today() - timedelta(days=1)
            db_session.flush()

            result = service.record_login(db_session, user.id)
            assert result.is_new_day is True
            assert result.total_coins_awarded == expected_per_day[day], (
                f"Day {day + 1}: expected {expected_per_day[day]}, got {result.total_coins_awarded}"
            )
            total_coins += result.total_coins_awarded

        assert total_coins == 270

    def test_streak_reset_does_not_revoke_earned_bonuses(self, db_session, service):
        """Story 3.2 AC8: Breaking a streak does not revoke already-earned coins."""
        user = _create_user(db_session, "login_norevo@test.com")
        prog = service.ensure_progression_exists(db_session, user.id)

        # Build a 3-day streak to earn streak_3 bonus
        yesterday = _utc_today() - timedelta(days=1)
        prog.last_login_date = yesterday
        prog.login_streak = 2
        db_session.flush()

        result = service.record_login(db_session, user.id)
        assert result.login_streak == 3
        assert result.total_coins_awarded == 60  # 10 daily + 50 streak_3

        # Check balance after streak_3
        balance_after_streak3 = (
            db_session.query(UserProgression)
            .filter(UserProgression.user_id == user.id)
            .first()
        ).coin_balance

        # Now break the streak by setting last login 2 days ago
        prog = (
            db_session.query(UserProgression)
            .filter(UserProgression.user_id == user.id)
            .first()
        )
        prog.last_login_date = _utc_today() - timedelta(days=2)
        db_session.flush()

        result = service.record_login(db_session, user.id)
        assert result.login_streak == 1  # Reset

        # Balance should have grown (10 more daily coins), not decreased
        new_balance = (
            db_session.query(UserProgression)
            .filter(UserProgression.user_id == user.id)
            .first()
        ).coin_balance
        assert new_balance == balance_after_streak3 + 10


# --- Coin Economy Config Tests (Epic 3 Story 3.1) ---


class TestCoinEconomyConfig:
    """Verify REWARD_CONFIG has correct coin entries for all event types."""

    def test_daily_login_coins(self):
        from app.services.reward_hook_service import REWARD_CONFIG
        assert REWARD_CONFIG["daily_login"].coins == 10
        assert REWARD_CONFIG["daily_login"].xp == 0

    def test_streak_3_coins(self):
        from app.services.reward_hook_service import REWARD_CONFIG
        assert REWARD_CONFIG["streak_3"].coins == 50

    def test_streak_7_coins(self):
        from app.services.reward_hook_service import REWARD_CONFIG
        assert REWARD_CONFIG["streak_7"].coins == 100

    def test_first_module_week_coins(self):
        from app.services.reward_hook_service import REWARD_CONFIG
        assert REWARD_CONFIG["first_module_week"].coins == 40

    def test_peer_endorsement_coins(self):
        from app.services.reward_hook_service import REWARD_CONFIG
        assert REWARD_CONFIG["peer_endorsement"].coins == 25

    def test_side_quest_completed_coins(self):
        from app.services.reward_hook_service import REWARD_CONFIG
        assert REWARD_CONFIG["side_quest_completed"].coins == 100

    def test_mixed_xp_coin_events(self):
        from app.services.reward_hook_service import REWARD_CONFIG
        mixed = ["roadmap_generated", "first_match_view", "resume_uploaded", "profile_completed"]
        for event_type in mixed:
            assert REWARD_CONFIG[event_type].xp == 50
            assert REWARD_CONFIG[event_type].coins == 25


# --- Read Operations Tests ---


class TestGetProgression:
    def test_returns_none_for_missing(self, db_session, service):
        from uuid import uuid4

        result = service.get_progression(db_session, uuid4())
        assert result is None

    def test_returns_full_state(self, db_session, service):
        user = _create_user(db_session, "get_prog@test.com")
        service.ensure_progression_exists(db_session, user.id)

        state = service.get_progression(db_session, user.id)
        assert state is not None
        assert state["xp_total"] == 0
        assert state["level"] == 1
        assert state["title"] == "Apprentice"
        assert state["coin_balance"] == 0
        assert state["feature_unlocks"]["side_quests"] is False
        assert "equipped_items" in state

    def test_toggle_adventure_mode(self, db_session, service):
        user = _create_user(db_session, "toggle_adv@test.com")
        service.ensure_progression_exists(db_session, user.id)

        new_state = service.toggle_adventure_mode(db_session, user.id)
        assert new_state is True

        new_state = service.toggle_adventure_mode(db_session, user.id)
        assert new_state is False
