"""Tests for reward_hook_service.py -- Epic 5 Story 5.1.

Covers:
- Successful action processes all reward types
- Idempotent action (same event_key) returns already_awarded without duplicates
- DB exception is caught, logged, and returns None
- Missing REWARD_CONFIG entry logs warning and awards nothing
- Quest service unavailable does not break processing
- Integration hook patterns (fire-and-forget)
"""

from __future__ import annotations

import os
import sys
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from app.database import DATABASE_URL
from app.models import Base
from app.models.progression import GamificationEvent, UserProgression
from app.models.user_profile import UserProfile
from app.services.progression_service import ProgressionService
from app.services.reward_hook_service import (
    REWARD_CONFIG,
    RewardConfig,
    RewardHookService,
    RewardResult,
    reward_hook_service,
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


def _create_user(db, email=None):
    from app.utils.security import hash_password

    email = email or f"rhs_test_{uuid4().hex[:8]}@test.com"
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


@pytest.fixture()
def progression_service():
    return ProgressionService()


@pytest.fixture()
def hook_service(progression_service):
    return RewardHookService(
        progression_service=progression_service,
        achievement_service=None,
        quest_service=None,
    )


# --- Story 5.1: Reward Hook Service ---


class TestRewardHookServiceBasic:
    """Basic reward processing tests."""

    def test_process_action_awards_xp(self, db_session, hook_service):
        """Successful action with XP reward."""
        user = _create_user(db_session)
        hook_service.progression.ensure_progression_exists(db_session, user.id)

        result = hook_service.process_action(
            db_session, user.id, "module_completed", event_key=f"module:{uuid4()}"
        )

        assert result is not None
        assert result.xp_awarded == 50
        assert result.already_awarded is False

    def test_process_action_awards_coins(self, db_session, hook_service):
        """Successful action with coin reward."""
        user = _create_user(db_session)
        hook_service.progression.ensure_progression_exists(db_session, user.id)

        result = hook_service.process_action(
            db_session, user.id, "peer_endorsement", event_key=f"endorsement:{uuid4()}"
        )

        assert result is not None
        assert result.coins_awarded == 25

    def test_process_action_awards_xp_and_coins(self, db_session, hook_service):
        """Successful action with both XP and coin rewards."""
        user = _create_user(db_session)
        hook_service.progression.ensure_progression_exists(db_session, user.id)

        result = hook_service.process_action(
            db_session, user.id, "roadmap_generated", event_key=f"roadmap:{uuid4()}"
        )

        assert result is not None
        assert result.xp_awarded == 50
        assert result.coins_awarded >= 25  # 25 from config, possibly more from level-up

    def test_idempotent_action_same_event_key(self, db_session, hook_service):
        """Same event_key returns already_awarded without duplicate rewards."""
        user = _create_user(db_session)
        hook_service.progression.ensure_progression_exists(db_session, user.id)
        event_key = f"module:{uuid4()}"

        result1 = hook_service.process_action(
            db_session, user.id, "module_completed", event_key=event_key
        )
        assert result1 is not None
        assert result1.xp_awarded == 50
        assert result1.already_awarded is False

        result2 = hook_service.process_action(
            db_session, user.id, "module_completed", event_key=event_key
        )
        assert result2 is not None
        assert result2.already_awarded is True
        assert result2.xp_awarded == 0

    def test_missing_reward_config_awards_nothing(self, db_session, hook_service):
        """Unknown event_type logs warning and awards nothing."""
        user = _create_user(db_session)
        hook_service.progression.ensure_progression_exists(db_session, user.id)

        result = hook_service.process_action(
            db_session, user.id, "unknown_event_type", event_key=f"unknown:{uuid4()}"
        )

        assert result is not None
        assert result.xp_awarded == 0
        assert result.coins_awarded == 0

    def test_db_exception_returns_none(self, db_session, hook_service):
        """DB exception is caught, logged, and returns None."""
        user = _create_user(db_session)

        # Patch progression to raise an exception
        with patch.object(
            hook_service.progression, "ensure_progression_exists", side_effect=Exception("DB error")
        ):
            result = hook_service.process_action(
                db_session, user.id, "module_completed", event_key=f"module:{uuid4()}"
            )

        assert result is None

    def test_quest_service_unavailable_does_not_break(self, db_session):
        """Quest service failure does not break reward processing."""
        mock_quest = MagicMock()
        mock_quest.evaluate_quest_progress.side_effect = Exception("Quest service down")

        service = RewardHookService(
            progression_service=ProgressionService(),
            achievement_service=None,
            quest_service=mock_quest,
        )

        user = _create_user(db_session)
        service.progression.ensure_progression_exists(db_session, user.id)

        result = service.process_action(
            db_session, user.id, "module_completed", event_key=f"module:{uuid4()}"
        )

        assert result is not None
        assert result.xp_awarded == 50
        assert result.quest_updates == []

    def test_achievement_service_failure_does_not_break(self, db_session):
        """Achievement service failure does not break reward processing."""
        mock_achievement = MagicMock()
        mock_achievement.evaluate_achievements.side_effect = Exception("Achievement error")

        service = RewardHookService(
            progression_service=ProgressionService(),
            achievement_service=mock_achievement,
            quest_service=None,
        )

        user = _create_user(db_session)
        service.progression.ensure_progression_exists(db_session, user.id)

        result = service.process_action(
            db_session, user.id, "module_completed", event_key=f"module:{uuid4()}"
        )

        assert result is not None
        assert result.xp_awarded == 50


class TestRewardHookServiceConfig:
    """Tests for REWARD_CONFIG completeness."""

    def test_all_event_types_configured(self):
        """All documented event types have config entries."""
        expected_types = [
            "module_completed",
            "assessment_completed",
            "milestone_passed",
            "certification_earned",
            "weekly_consistency",
            "daily_login",
            "streak_3",
            "streak_7",
            "first_module_week",
            "peer_endorsement",
            "side_quest_completed",
            "roadmap_generated",
            "first_match_view",
            "resume_uploaded",
            "profile_completed",
        ]
        for event_type in expected_types:
            assert event_type in REWARD_CONFIG, f"Missing config for {event_type}"
            config = REWARD_CONFIG[event_type]
            assert isinstance(config, RewardConfig)
            assert config.xp >= 0
            assert config.coins >= 0

    def test_get_reward_config_returns_config(self):
        """get_reward_config returns config for known types."""
        service = RewardHookService()
        config = service.get_reward_config("module_completed")
        assert config is not None
        assert config.xp == 50
        assert config.coins == 0

    def test_get_reward_config_returns_none_for_unknown(self):
        """get_reward_config returns None for unknown types."""
        service = RewardHookService()
        config = service.get_reward_config("nonexistent")
        assert config is None


class TestRewardHookServiceSingleton:
    """Tests for module-level singleton."""

    def test_singleton_exists(self):
        """Module-level singleton is available."""
        assert reward_hook_service is not None
        assert isinstance(reward_hook_service, RewardHookService)

    def test_singleton_has_progression_service(self):
        """Singleton has progression service wired."""
        assert reward_hook_service.progression is not None


class TestFireAndForgetPattern:
    """Tests that verify the fire-and-forget integration pattern."""

    def test_process_action_never_raises(self, db_session, hook_service):
        """process_action catches all exceptions and returns None."""
        # Use an invalid user_id that will cause a DB error
        fake_user_id = uuid4()

        # This should NOT raise -- it should log and return None
        result = hook_service.process_action(
            db_session, fake_user_id, "module_completed", event_key="test"
        )
        # It may return a result (with 0 awards since progression was just created)
        # or None if there was an unexpected error -- but it should never raise

    def test_ensures_progression_exists_before_processing(self, db_session, hook_service):
        """ensure_progression_exists is called before any reward processing."""
        user = _create_user(db_session)

        # No progression row exists yet
        prog = (
            db_session.query(UserProgression)
            .filter(UserProgression.user_id == user.id)
            .first()
        )
        assert prog is None

        # Process action should create progression row automatically
        result = hook_service.process_action(
            db_session, user.id, "module_completed", event_key=f"module:{uuid4()}"
        )

        assert result is not None
        assert result.xp_awarded == 50

        # Progression row should now exist
        prog = (
            db_session.query(UserProgression)
            .filter(UserProgression.user_id == user.id)
            .first()
        )
        assert prog is not None
        assert prog.xp_total == 50


class TestIntegrationHookRewards:
    """Tests for specific integration hook reward amounts."""

    def test_module_completed_awards_50_xp(self, db_session, hook_service):
        user = _create_user(db_session)
        hook_service.progression.ensure_progression_exists(db_session, user.id)
        result = hook_service.process_action(
            db_session, user.id, "module_completed", event_key=f"module:{uuid4()}"
        )
        assert result.xp_awarded == 50

    def test_milestone_passed_awards_150_xp(self, db_session, hook_service):
        user = _create_user(db_session)
        hook_service.progression.ensure_progression_exists(db_session, user.id)
        result = hook_service.process_action(
            db_session, user.id, "milestone_passed", event_key=f"milestone:{uuid4()}"
        )
        assert result.xp_awarded == 150

    def test_roadmap_generated_awards_50_xp_25_coins(self, db_session, hook_service):
        user = _create_user(db_session)
        hook_service.progression.ensure_progression_exists(db_session, user.id)
        result = hook_service.process_action(
            db_session, user.id, "roadmap_generated", event_key=f"roadmap:{uuid4()}"
        )
        assert result.xp_awarded == 50
        assert result.coins_awarded >= 25

    def test_first_match_view_awards_50_xp_25_coins(self, db_session, hook_service):
        user = _create_user(db_session)
        hook_service.progression.ensure_progression_exists(db_session, user.id)
        result = hook_service.process_action(
            db_session, user.id, "first_match_view", event_key=f"first_match:{user.id}"
        )
        assert result.xp_awarded == 50
        assert result.coins_awarded >= 25

    def test_resume_uploaded_awards_50_xp_25_coins(self, db_session, hook_service):
        user = _create_user(db_session)
        hook_service.progression.ensure_progression_exists(db_session, user.id)
        result = hook_service.process_action(
            db_session, user.id, "resume_uploaded", event_key=f"resume:{user.id}"
        )
        assert result.xp_awarded == 50
        assert result.coins_awarded >= 25

    def test_profile_completed_awards_50_xp_25_coins(self, db_session, hook_service):
        user = _create_user(db_session)
        hook_service.progression.ensure_progression_exists(db_session, user.id)
        result = hook_service.process_action(
            db_session, user.id, "profile_completed", event_key=f"profile:{user.id}"
        )
        assert result.xp_awarded == 50
        assert result.coins_awarded >= 25

    def test_duplicate_first_match_view_is_idempotent(self, db_session, hook_service):
        user = _create_user(db_session)
        hook_service.progression.ensure_progression_exists(db_session, user.id)
        event_key = f"first_match:{user.id}"

        result1 = hook_service.process_action(
            db_session, user.id, "first_match_view", event_key=event_key
        )
        assert result1.xp_awarded == 50

        result2 = hook_service.process_action(
            db_session, user.id, "first_match_view", event_key=event_key
        )
        assert result2.already_awarded is True
        assert result2.xp_awarded == 0
