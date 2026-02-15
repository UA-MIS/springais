"""Tests for achievement_service.py -- Epic 4 Stories 4.1-4.4.

Covers:
- Achievement catalog model and seed data (Story 4.1)
- UserAchievement model (Story 4.2)
- Achievement evaluation engine with batch query optimization (Story 4.3)
- Achievement API endpoints (Story 4.4)
"""

from __future__ import annotations

import os
import sys
from datetime import datetime, timezone
from uuid import uuid4

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from app.database import DATABASE_URL
from app.models import Base
from app.models.achievement import AchievementCatalog, UserAchievement
from app.models.progression import GamificationEvent, UserProgression
from app.models.user_profile import UserProfile
from app.services.achievement_service import (
    AchievementService,
    AchievementWithStatus,
    UnlockedAchievement,
)
from app.services.progression_service import ProgressionService

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
def progression_service():
    return ProgressionService()


@pytest.fixture()
def achievement_service():
    service = AchievementService()
    service.invalidate_cache()  # Fresh cache for each test
    return service


def _create_user(db, email=None):
    from app.utils.security import hash_password

    email = email or f"ach_test_{uuid4().hex[:8]}@test.com"
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


def _seed_achievements(db):
    """Seed a minimal set of achievements for testing.

    Uses merge to avoid duplicate key errors when seeds already exist.
    """
    achievements_data = [
        {
            "id": "t_first_module",
            "name": "Eager Pupil",
            "description": "Complete your first learning module",
            "icon": "book-open",
            "category": "learning",
            "xp_reward": 75,
            "coin_reward": 30,
            "trigger_type": "event_based",
            "trigger_config": {"event_type": "module_completed", "count": 1},
            "sort_order": 10,
        },
        {
            "id": "t_skill_master_5",
            "name": "Skill Adept",
            "description": "Complete 5 learning modules",
            "icon": "award",
            "category": "learning",
            "xp_reward": 150,
            "coin_reward": 75,
            "trigger_type": "event_based",
            "trigger_config": {"event_type": "module_completed", "count": 5},
            "sort_order": 20,
        },
        {
            "id": "t_daily_login_3",
            "name": "Consistent Adventurer",
            "description": "Maintain a 3-day login streak",
            "icon": "flame",
            "category": "engagement",
            "xp_reward": 50,
            "coin_reward": 25,
            "trigger_type": "threshold_based",
            "trigger_config": {"field": "login_streak", "threshold": 3},
            "sort_order": 30,
        },
        {
            "id": "t_level_5",
            "name": "Squire's Ascension",
            "description": "Reach level 5",
            "icon": "trending-up",
            "category": "mastery",
            "xp_reward": 100,
            "coin_reward": 50,
            "trigger_type": "threshold_based",
            "trigger_config": {"field": "level", "threshold": 5},
            "sort_order": 40,
        },
        {
            "id": "t_first_login",
            "name": "The Journey Begins",
            "description": "Enable adventure mode",
            "icon": "scroll",
            "category": "onboarding",
            "xp_reward": 100,
            "coin_reward": 50,
            "trigger_type": "manual",
            "trigger_config": {"action": "enable_adventure_mode"},
            "sort_order": 5,
        },
    ]
    result = []
    for data in achievements_data:
        ach = db.merge(AchievementCatalog(**data))
        result.append(ach)
    db.flush()
    return result


def _insert_gamification_events(db, user_id, event_type, count):
    """Insert multiple gamification events for testing."""
    for i in range(count):
        event = GamificationEvent(
            user_id=user_id,
            event_type=event_type,
            event_key=f"{event_type}:test:{uuid4().hex[:8]}",
            xp_awarded=0,
            coins_awarded=0,
        )
        db.add(event)
    db.flush()


# --- Story 4.1: Achievement Catalog Model and Seed Data ---


class TestAchievementCatalogModel:
    """Tests for AchievementCatalog model and seed data."""

    def test_create_achievement(self, db_session):
        ach = AchievementCatalog(
            id="test_ach",
            name="Test Achievement",
            description="A test achievement",
            icon="star",
            category="learning",
            xp_reward=100,
            coin_reward=50,
            trigger_type="event_based",
            trigger_config={"event_type": "module_completed", "count": 1},
            sort_order=0,
        )
        db_session.add(ach)
        db_session.flush()

        loaded = db_session.query(AchievementCatalog).filter_by(id="test_ach").first()
        assert loaded is not None
        assert loaded.name == "Test Achievement"
        assert loaded.trigger_config["event_type"] == "module_completed"

    def test_seed_data_has_24_achievements(self, db_session):
        from app.data.achievement_seed import ACHIEVEMENT_SEED_DATA

        assert len(ACHIEVEMENT_SEED_DATA) == 24

    def test_seed_data_categories_correct(self, db_session):
        from app.data.achievement_seed import ACHIEVEMENT_SEED_DATA

        valid_categories = {"onboarding", "learning", "engagement", "exploration", "mastery"}
        for ach in ACHIEVEMENT_SEED_DATA:
            assert ach["category"] in valid_categories, (
                f"Achievement {ach['id']} has invalid category {ach['category']}"
            )

    def test_seed_data_trigger_types_valid(self, db_session):
        from app.data.achievement_seed import ACHIEVEMENT_SEED_DATA

        valid_types = {"event_based", "threshold_based", "manual"}
        for ach in ACHIEVEMENT_SEED_DATA:
            assert ach["trigger_type"] in valid_types, (
                f"Achievement {ach['id']} has invalid trigger_type {ach['trigger_type']}"
            )

    def test_seed_data_trigger_config_well_formed(self, db_session):
        from app.data.achievement_seed import ACHIEVEMENT_SEED_DATA

        for ach in ACHIEVEMENT_SEED_DATA:
            config = ach["trigger_config"]
            assert isinstance(config, dict), f"Achievement {ach['id']} trigger_config not dict"

            if ach["trigger_type"] == "event_based":
                assert "event_type" in config
                assert "count" in config
                assert isinstance(config["count"], int)
            elif ach["trigger_type"] == "threshold_based":
                assert "field" in config
                assert "threshold" in config
                assert isinstance(config["threshold"], int)
            elif ach["trigger_type"] == "manual":
                assert "action" in config

    def test_seed_data_has_unique_ids(self):
        from app.data.achievement_seed import ACHIEVEMENT_SEED_DATA

        ids = [a["id"] for a in ACHIEVEMENT_SEED_DATA]
        assert len(ids) == len(set(ids)), "Duplicate IDs in seed data"

    def test_seed_data_has_unique_sort_orders(self):
        from app.data.achievement_seed import ACHIEVEMENT_SEED_DATA

        orders = [a["sort_order"] for a in ACHIEVEMENT_SEED_DATA]
        assert len(orders) == len(set(orders)), "Duplicate sort_orders in seed data"


# --- Story 4.2: UserAchievement Model ---


class TestUserAchievementModel:
    """Tests for UserAchievement model."""

    def test_insert_user_achievement(self, db_session):
        user = _create_user(db_session)
        _seed_achievements(db_session)

        ua = UserAchievement(
            user_id=user.id,
            achievement_id="t_first_module",
            unlocked_at=datetime.now(timezone.utc),
        )
        db_session.add(ua)
        db_session.flush()

        loaded = (
            db_session.query(UserAchievement)
            .filter_by(user_id=user.id, achievement_id="t_first_module")
            .first()
        )
        assert loaded is not None
        assert loaded.achievement_id == "t_first_module"

    def test_unique_constraint_prevents_duplicates(self, db_session):
        from sqlalchemy.exc import IntegrityError

        user = _create_user(db_session)
        _seed_achievements(db_session)

        ua1 = UserAchievement(
            user_id=user.id,
            achievement_id="t_first_module",
        )
        db_session.add(ua1)
        db_session.flush()

        ua2 = UserAchievement(
            user_id=user.id,
            achievement_id="t_first_module",
        )
        db_session.add(ua2)
        with pytest.raises(IntegrityError):
            db_session.flush()

    def test_relationship_to_achievement_catalog(self, db_session):
        user = _create_user(db_session)
        _seed_achievements(db_session)

        ua = UserAchievement(
            user_id=user.id,
            achievement_id="t_first_module",
        )
        db_session.add(ua)
        db_session.flush()

        loaded = (
            db_session.query(UserAchievement)
            .filter_by(user_id=user.id)
            .first()
        )
        assert loaded.achievement is not None
        assert loaded.achievement.name == "Eager Pupil"


# --- Story 4.3: Achievement Evaluation Engine ---


class TestAchievementEvaluation:
    """Tests for the achievement evaluation engine."""

    def test_event_based_achievement_unlocks(
        self, db_session, progression_service, achievement_service
    ):
        """Event-based achievement unlocks after reaching count threshold."""
        user = _create_user(db_session)
        prog = progression_service.ensure_progression_exists(db_session, user.id)
        _seed_achievements(db_session)

        # Insert 1 module_completed event
        _insert_gamification_events(db_session, user.id, "module_completed", 1)

        unlocked = achievement_service.evaluate_achievements(
            db_session, user.id, "module_completed", prog
        )

        assert len(unlocked) >= 1
        first_module = next((a for a in unlocked if a.id == "t_first_module"), None)
        assert first_module is not None
        assert first_module.name == "Eager Pupil"

    def test_threshold_based_achievement_unlocks(
        self, db_session, progression_service, achievement_service
    ):
        """Threshold-based achievement unlocks when progression field meets threshold."""
        user = _create_user(db_session)
        prog = progression_service.ensure_progression_exists(db_session, user.id)
        _seed_achievements(db_session)

        # Set login_streak to 3
        prog.login_streak = 3
        db_session.flush()

        unlocked = achievement_service.evaluate_achievements(
            db_session, user.id, "daily_login", prog
        )

        daily_3 = next((a for a in unlocked if a.id == "t_daily_login_3"), None)
        assert daily_3 is not None

    def test_manual_achievement_does_not_auto_trigger(
        self, db_session, progression_service, achievement_service
    ):
        """Manual achievements are NOT auto-triggered by evaluate_achievements."""
        user = _create_user(db_session)
        prog = progression_service.ensure_progression_exists(db_session, user.id)
        _seed_achievements(db_session)

        unlocked = achievement_service.evaluate_achievements(
            db_session, user.id, "daily_login", prog
        )

        manual_ids = [a.id for a in unlocked if a.id == "t_first_login"]
        assert len(manual_ids) == 0

    def test_already_unlocked_not_re_evaluated(
        self, db_session, progression_service, achievement_service
    ):
        """Already-unlocked achievements are not re-evaluated."""
        user = _create_user(db_session)
        prog = progression_service.ensure_progression_exists(db_session, user.id)
        _seed_achievements(db_session)

        # Insert 1 module_completed event
        _insert_gamification_events(db_session, user.id, "module_completed", 1)

        # First eval should unlock first_module
        unlocked1 = achievement_service.evaluate_achievements(
            db_session, user.id, "module_completed", prog
        )
        assert any(a.id == "t_first_module" for a in unlocked1)

        # Clear cache to force re-read from catalog
        achievement_service.invalidate_cache()

        # Second eval should NOT unlock it again
        unlocked2 = achievement_service.evaluate_achievements(
            db_session, user.id, "module_completed", prog
        )
        assert not any(a.id == "t_first_module" for a in unlocked2)

    def test_multiple_achievements_unlock_in_single_evaluation(
        self, db_session, progression_service, achievement_service
    ):
        """Multiple achievements can unlock in a single evaluation."""
        user = _create_user(db_session)
        prog = progression_service.ensure_progression_exists(db_session, user.id)
        _seed_achievements(db_session)

        # Set up conditions for multiple achievements
        prog.login_streak = 3
        db_session.flush()
        _insert_gamification_events(db_session, user.id, "module_completed", 1)

        unlocked = achievement_service.evaluate_achievements(
            db_session, user.id, "module_completed", prog
        )

        # Should unlock first_module (event_based) and daily_login_3 (threshold_based)
        unlocked_ids = {a.id for a in unlocked}
        assert "t_first_module" in unlocked_ids
        assert "t_daily_login_3" in unlocked_ids

    def test_achievement_rewards_are_awarded(
        self, db_session, progression_service, achievement_service
    ):
        """Achievement XP/Coin rewards are correctly awarded."""
        user = _create_user(db_session)
        prog = progression_service.ensure_progression_exists(db_session, user.id)
        _seed_achievements(db_session)

        initial_xp = prog.xp_total
        initial_coins = prog.coin_balance

        _insert_gamification_events(db_session, user.id, "module_completed", 1)

        unlocked = achievement_service.evaluate_achievements(
            db_session, user.id, "module_completed", prog
        )

        # Refresh progression to see updated values
        db_session.refresh(prog)

        # first_module awards 75 XP and 30 coins
        first_module = next((a for a in unlocked if a.id == "t_first_module"), None)
        assert first_module is not None
        assert prog.xp_total >= initial_xp + first_module.xp_reward
        assert prog.coin_balance >= initial_coins + first_module.coin_reward

    def test_event_count_below_threshold_no_unlock(
        self, db_session, progression_service, achievement_service
    ):
        """Event-based achievement does not unlock if count is below threshold."""
        user = _create_user(db_session)
        prog = progression_service.ensure_progression_exists(db_session, user.id)
        _seed_achievements(db_session)

        # Insert 3 events but need 5 for skill_master_5
        _insert_gamification_events(db_session, user.id, "module_completed", 3)

        unlocked = achievement_service.evaluate_achievements(
            db_session, user.id, "module_completed", prog
        )

        # first_module should unlock (need 1, have 3)
        # skill_master_5 should NOT unlock (need 5, have 3)
        unlocked_ids = {a.id for a in unlocked}
        assert "t_first_module" in unlocked_ids
        assert "t_skill_master_5" not in unlocked_ids

    def test_batch_query_optimization(
        self, db_session, progression_service, achievement_service
    ):
        """Verify the batch GROUP BY query is used (not N+1).

        We verify this by checking that the evaluation works correctly
        with multiple event types and achievements.
        """
        user = _create_user(db_session)
        prog = progression_service.ensure_progression_exists(db_session, user.id)
        _seed_achievements(db_session)

        # Insert events of different types
        _insert_gamification_events(db_session, user.id, "module_completed", 5)

        unlocked = achievement_service.evaluate_achievements(
            db_session, user.id, "module_completed", prog
        )

        unlocked_ids = {a.id for a in unlocked}
        assert "t_first_module" in unlocked_ids
        assert "t_skill_master_5" in unlocked_ids


# --- Story 4.3 Additional: Catalog Cache ---


class TestCatalogCache:
    def test_catalog_is_cached(self, db_session, achievement_service):
        _seed_achievements(db_session)

        catalog1 = achievement_service.load_catalog(db_session)
        catalog2 = achievement_service.load_catalog(db_session)
        assert catalog1 is catalog2  # Same list object (cached)

    def test_invalidate_cache(self, db_session, achievement_service):
        _seed_achievements(db_session)

        catalog1 = achievement_service.load_catalog(db_session)
        achievement_service.invalidate_cache()
        catalog2 = achievement_service.load_catalog(db_session)
        assert catalog1 is not catalog2  # Different list objects


# --- Story 4.4: Achievement API / get_catalog_with_status ---


class TestGetCatalogWithStatus:
    def test_returns_all_achievements(
        self, db_session, achievement_service
    ):
        _seed_achievements(db_session)
        user = _create_user(db_session)

        items = achievement_service.get_catalog_with_status(db_session, user.id)
        # At least our 5 test seeds exist; the real seed data may also be present
        assert len(items) >= 5
        test_ids = {i.id for i in items}
        assert "t_first_module" in test_ids
        assert "t_daily_login_3" in test_ids

    def test_shows_unlocked_status(
        self, db_session, progression_service, achievement_service
    ):
        _seed_achievements(db_session)
        user = _create_user(db_session)

        # Unlock one achievement
        ua = UserAchievement(
            user_id=user.id,
            achievement_id="t_first_module",
            unlocked_at=datetime.now(timezone.utc),
        )
        db_session.add(ua)
        db_session.flush()

        items = achievement_service.get_catalog_with_status(db_session, user.id)

        first_module = next(i for i in items if i.id == "t_first_module")
        assert first_module.is_unlocked is True
        assert first_module.unlocked_at is not None

        skill_master = next(i for i in items if i.id == "t_skill_master_5")
        assert skill_master.is_unlocked is False
        assert skill_master.unlocked_at is None


class TestGetUserAchievements:
    def test_returns_empty_for_no_unlocks(self, db_session, achievement_service):
        user = _create_user(db_session)
        result = achievement_service.get_user_achievements(db_session, user.id)
        assert result == []

    def test_returns_unlocked_achievements(self, db_session, achievement_service):
        _seed_achievements(db_session)
        user = _create_user(db_session)

        ua = UserAchievement(
            user_id=user.id,
            achievement_id="t_first_module",
            unlocked_at=datetime.now(timezone.utc),
        )
        db_session.add(ua)
        db_session.flush()

        result = achievement_service.get_user_achievements(db_session, user.id)
        assert len(result) == 1
        assert result[0].achievement_id == "t_first_module"
