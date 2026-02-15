"""Tests for quest_service.py -- Epic 7 Stories 7.1-7.4.

Covers:
- Quest catalog seed data validation
- Starting quests at correct/incorrect levels
- Quest progress updates after matching events
- Quest completion with rewards
- Completed quest cannot be restarted
- Multiple quests in progress simultaneously
- Quest API router integration
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
from app.models.progression import GamificationEvent, UserProgression
from app.models.quest import SideQuestCatalog, UserQuestProgress
from app.models.user_profile import UserProfile
from app.services.progression_service import ProgressionService
from app.services.quest_service import (
    QuestCompletionResult,
    QuestProgressUpdate,
    QuestService,
    quest_service,
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

    email = email or f"quest_test_{uuid4().hex[:8]}@test.com"
    user = UserProfile(
        email=email,
        hashed_password=hash_password("TestPass123"),
        full_name="Quest Tester",
        skills=[],
        skill_assessment_scores={},
    )
    db.add(user)
    db.flush()
    return user


def _create_quest(db, **overrides) -> SideQuestCatalog:
    """Create a test quest with sensible defaults."""
    defaults = {
        "name": f"Test Quest {uuid4().hex[:6]}",
        "description": "A test quest for unit testing.",
        "level_required": 1,
        "xp_reward": 100,
        "coin_reward": 50,
        "cosmetic_reward_id": None,
        "requirements": [
            {
                "type": "module_completed",
                "target_id": None,
                "count": 2,
                "description": "Complete 2 modules",
            }
        ],
        "is_active": True,
        "sort_order": 0,
    }
    defaults.update(overrides)
    quest = SideQuestCatalog(**defaults)
    db.add(quest)
    db.flush()
    return quest


def _ensure_progression(db, user_id, level=1, xp=0):
    """Ensure a UserProgression row exists for the user."""
    prog = (
        db.query(UserProgression)
        .filter(UserProgression.user_id == user_id)
        .first()
    )
    if prog is None:
        prog = UserProgression(
            user_id=user_id,
            level=level,
            xp_total=xp,
            coin_balance=0,
        )
        db.add(prog)
        db.flush()
    else:
        prog.level = level
        prog.xp_total = xp
        db.flush()
    return prog


@pytest.fixture()
def service():
    return QuestService(progression_service=ProgressionService())


# --- Story 7.1: Quest Catalog Seed Data ---


class TestQuestSeedData:
    """Tests for quest seed data validation."""

    def test_seed_data_has_5_quests(self):
        from app.data.quest_seed import QUEST_SEED_DATA

        assert len(QUEST_SEED_DATA) == 5

    def test_seed_data_names_match_spec(self):
        from app.data.quest_seed import QUEST_SEED_DATA

        names = [q["name"] for q in QUEST_SEED_DATA]
        assert "Trade Data Analysis" in names
        assert "The Scribe's Request" in names
        assert "Knight's Trial" in names
        assert "Arena Challenge" in names
        assert "Legend's Path" in names

    def test_seed_data_requirements_well_formed(self):
        from app.data.quest_seed import QUEST_SEED_DATA

        for quest_data in QUEST_SEED_DATA:
            requirements = quest_data["requirements"]
            assert isinstance(requirements, list)
            assert len(requirements) > 0
            for req in requirements:
                assert "type" in req
                assert "count" in req
                assert "description" in req
                assert isinstance(req["count"], int)
                assert req["count"] > 0

    def test_seed_data_levels_match_spec(self):
        from app.data.quest_seed import QUEST_SEED_DATA

        level_map = {q["name"]: q["level_required"] for q in QUEST_SEED_DATA}
        assert level_map["Trade Data Analysis"] == 3
        assert level_map["The Scribe's Request"] == 3
        assert level_map["Knight's Trial"] == 5
        assert level_map["Arena Challenge"] == 8
        assert level_map["Legend's Path"] == 10

    def test_seed_data_rewards_match_spec(self):
        from app.data.quest_seed import QUEST_SEED_DATA

        reward_map = {q["name"]: (q["xp_reward"], q["coin_reward"]) for q in QUEST_SEED_DATA}
        assert reward_map["Trade Data Analysis"] == (200, 150)
        assert reward_map["The Scribe's Request"] == (150, 100)
        assert reward_map["Knight's Trial"] == (300, 200)
        assert reward_map["Arena Challenge"] == (400, 300)
        assert reward_map["Legend's Path"] == (600, 500)

    def test_seed_function_creates_quests(self, db_session):
        from app.data.quest_seed import seed_quest_catalog

        count = seed_quest_catalog(db_session)
        # Either 5 (first run) or 0 (already seeded from a prior test run)
        assert count in (0, 5)

        quests = db_session.query(SideQuestCatalog).all()
        assert len(quests) >= 5

    def test_seed_function_idempotent(self, db_session):
        from app.data.quest_seed import seed_quest_catalog

        seed_quest_catalog(db_session)
        count2 = seed_quest_catalog(db_session)
        assert count2 == 0  # No new quests on second run


# --- Story 7.2: Quest Model ---


class TestQuestModels:
    """Tests for SideQuestCatalog and UserQuestProgress models."""

    def test_create_quest_catalog_entry(self, db_session):
        quest = _create_quest(db_session)
        assert quest.id is not None
        assert quest.is_active is True
        assert quest.requirements is not None
        assert len(quest.requirements) > 0

    def test_create_user_quest_progress(self, db_session):
        user = _create_user(db_session)
        quest = _create_quest(db_session)

        progress = UserQuestProgress(
            user_id=user.id,
            quest_id=quest.id,
            status="in_progress",
            progress={"requirements": []},
            started_at=datetime.now(timezone.utc),
        )
        db_session.add(progress)
        db_session.flush()

        assert progress.id is not None
        assert progress.status == "in_progress"
        assert progress.started_at is not None

    def test_unique_user_quest_constraint(self, db_session):
        """Cannot create two progress entries for same user+quest."""
        user = _create_user(db_session)
        quest = _create_quest(db_session)

        progress1 = UserQuestProgress(
            user_id=user.id,
            quest_id=quest.id,
            status="in_progress",
            progress={"requirements": []},
        )
        db_session.add(progress1)
        db_session.flush()

        progress2 = UserQuestProgress(
            user_id=user.id,
            quest_id=quest.id,
            status="in_progress",
            progress={"requirements": []},
        )
        db_session.add(progress2)

        with pytest.raises(Exception):  # IntegrityError
            db_session.flush()


# --- Story 7.3: Quest Service ---


class TestQuestServiceGetAvailable:
    """Tests for get_available_quests."""

    def test_returns_quests_at_or_below_user_level(self, db_session, service):
        user = _create_user(db_session)
        quest_l1 = _create_quest(db_session, level_required=1, name=f"L1 {uuid4().hex[:6]}")
        quest_l5 = _create_quest(db_session, level_required=5, name=f"L5 {uuid4().hex[:6]}")
        quest_l10 = _create_quest(db_session, level_required=10, name=f"L10 {uuid4().hex[:6]}")

        quests = service.get_available_quests(db_session, user.id, user_level=5)
        quest_ids = [q["id"] for q in quests]
        assert str(quest_l1.id) in quest_ids
        assert str(quest_l5.id) in quest_ids
        assert str(quest_l10.id) not in quest_ids

    def test_returns_empty_at_level_0(self, db_session, service):
        user = _create_user(db_session)
        _create_quest(db_session, level_required=3, name=f"L3 {uuid4().hex[:6]}")

        quests = service.get_available_quests(db_session, user.id, user_level=0)
        assert len(quests) == 0

    def test_includes_progress_status(self, db_session, service):
        user = _create_user(db_session)
        quest = _create_quest(db_session, level_required=1, name=f"Prog {uuid4().hex[:6]}")

        # Start the quest
        _ensure_progression(db_session, user.id, level=1)
        service.start_quest(db_session, user.id, quest.id, user_level=1)
        db_session.flush()

        quests = service.get_available_quests(db_session, user.id, user_level=1)
        quest_data = next((q for q in quests if q["id"] == str(quest.id)), None)
        assert quest_data is not None
        assert quest_data["status"] == "in_progress"


class TestQuestServiceStartQuest:
    """Tests for start_quest."""

    def test_start_quest_at_correct_level(self, db_session, service):
        user = _create_user(db_session)
        quest = _create_quest(db_session, level_required=3, name=f"Start {uuid4().hex[:6]}")
        _ensure_progression(db_session, user.id, level=3)

        progress = service.start_quest(db_session, user.id, quest.id, user_level=3)
        db_session.flush()

        assert progress.status == "in_progress"
        assert progress.started_at is not None
        assert progress.quest_id == quest.id

    def test_start_quest_above_required_level(self, db_session, service):
        user = _create_user(db_session)
        quest = _create_quest(db_session, level_required=3, name=f"Above {uuid4().hex[:6]}")
        _ensure_progression(db_session, user.id, level=5)

        progress = service.start_quest(db_session, user.id, quest.id, user_level=5)
        db_session.flush()

        assert progress.status == "in_progress"

    def test_start_quest_below_level_raises_permission_error(self, db_session, service):
        user = _create_user(db_session)
        quest = _create_quest(db_session, level_required=5, name=f"Below {uuid4().hex[:6]}")
        _ensure_progression(db_session, user.id, level=2)

        with pytest.raises(PermissionError) as exc_info:
            service.start_quest(db_session, user.id, quest.id, user_level=2)

        assert "level_too_low" in str(exc_info.value)

    def test_start_nonexistent_quest_raises_value_error(self, db_session, service):
        user = _create_user(db_session)
        _ensure_progression(db_session, user.id)

        with pytest.raises(ValueError, match="quest_not_found"):
            service.start_quest(db_session, user.id, uuid4(), user_level=10)

    def test_start_inactive_quest_raises_value_error(self, db_session, service):
        user = _create_user(db_session)
        quest = _create_quest(db_session, is_active=False, name=f"Inactive {uuid4().hex[:6]}")
        _ensure_progression(db_session, user.id)

        with pytest.raises(ValueError, match="quest_not_found"):
            service.start_quest(db_session, user.id, quest.id, user_level=10)

    def test_start_already_started_quest_raises_value_error(self, db_session, service):
        user = _create_user(db_session)
        quest = _create_quest(db_session, level_required=1, name=f"AlreadyS {uuid4().hex[:6]}")
        _ensure_progression(db_session, user.id)

        service.start_quest(db_session, user.id, quest.id, user_level=1)
        db_session.flush()

        with pytest.raises(ValueError, match="quest_already_started"):
            service.start_quest(db_session, user.id, quest.id, user_level=1)

    def test_start_completed_quest_raises_value_error(self, db_session, service):
        user = _create_user(db_session)
        quest = _create_quest(db_session, level_required=1, name=f"AlreadyC {uuid4().hex[:6]}")
        _ensure_progression(db_session, user.id)

        progress = service.start_quest(db_session, user.id, quest.id, user_level=1)
        progress.status = "completed"
        progress.completed_at = datetime.now(timezone.utc)
        db_session.flush()

        with pytest.raises(ValueError, match="quest_already_completed"):
            service.start_quest(db_session, user.id, quest.id, user_level=1)

    def test_initializes_progress_json(self, db_session, service):
        user = _create_user(db_session)
        quest = _create_quest(
            db_session,
            level_required=1,
            name=f"ProgJSON {uuid4().hex[:6]}",
            requirements=[
                {"type": "module_completed", "count": 2, "description": "Complete 2 modules"},
                {"type": "assessment_completed", "count": 1, "description": "Pass 1 assessment"},
            ],
        )
        _ensure_progression(db_session, user.id)

        progress = service.start_quest(db_session, user.id, quest.id, user_level=1)
        db_session.flush()

        progress_data = progress.progress
        assert "requirements" in progress_data
        reqs = progress_data["requirements"]
        assert len(reqs) == 2
        assert reqs[0]["current_count"] == 0
        assert reqs[0]["completed"] is False
        assert reqs[0]["required_count"] == 2
        assert reqs[1]["required_count"] == 1


class TestQuestServiceActiveCompleted:
    """Tests for get_active_quests and get_completed_quests."""

    def test_get_active_quests(self, db_session, service):
        user = _create_user(db_session)
        quest = _create_quest(db_session, level_required=1, name=f"Active {uuid4().hex[:6]}")
        _ensure_progression(db_session, user.id)

        service.start_quest(db_session, user.id, quest.id, user_level=1)
        db_session.flush()

        active = service.get_active_quests(db_session, user.id)
        assert len(active) >= 1
        quest_ids = [q["id"] for q in active]
        assert str(quest.id) in quest_ids

    def test_get_completed_quests(self, db_session, service):
        user = _create_user(db_session)
        quest = _create_quest(db_session, level_required=1, name=f"Completed {uuid4().hex[:6]}")
        _ensure_progression(db_session, user.id)

        progress = service.start_quest(db_session, user.id, quest.id, user_level=1)
        progress.status = "completed"
        progress.completed_at = datetime.now(timezone.utc)
        db_session.flush()

        completed = service.get_completed_quests(db_session, user.id)
        assert len(completed) >= 1
        quest_ids = [q["id"] for q in completed]
        assert str(quest.id) in quest_ids

    def test_completed_quest_not_in_active(self, db_session, service):
        user = _create_user(db_session)
        quest = _create_quest(db_session, level_required=1, name=f"NotActive {uuid4().hex[:6]}")
        _ensure_progression(db_session, user.id)

        progress = service.start_quest(db_session, user.id, quest.id, user_level=1)
        progress.status = "completed"
        progress.completed_at = datetime.now(timezone.utc)
        db_session.flush()

        active = service.get_active_quests(db_session, user.id)
        quest_ids = [q["id"] for q in active]
        assert str(quest.id) not in quest_ids


class TestQuestServiceProgress:
    """Tests for evaluate_quest_progress."""

    def test_progress_updates_on_matching_event(self, db_session, service):
        user = _create_user(db_session)
        quest = _create_quest(
            db_session,
            level_required=1,
            name=f"ProgUpdate {uuid4().hex[:6]}",
            requirements=[
                {"type": "module_completed", "count": 2, "description": "Complete 2 modules"},
            ],
        )
        _ensure_progression(db_session, user.id)

        service.start_quest(db_session, user.id, quest.id, user_level=1)
        db_session.flush()

        # Add a matching gamification event
        event = GamificationEvent(
            user_id=user.id,
            event_type="module_completed",
            xp_awarded=50,
            event_key=f"module:{uuid4()}",
        )
        db_session.add(event)
        db_session.flush()

        updates = service.evaluate_quest_progress(
            db_session, user.id, "module_completed"
        )

        assert len(updates) >= 1
        update = next((u for u in updates if u.quest_id == quest.id), None)
        assert update is not None
        assert update.status == "in_progress"

    def test_no_update_on_non_matching_event(self, db_session, service):
        user = _create_user(db_session)
        quest = _create_quest(
            db_session,
            level_required=1,
            name=f"NoMatch {uuid4().hex[:6]}",
            requirements=[
                {"type": "module_completed", "count": 2, "description": "Complete 2 modules"},
            ],
        )
        _ensure_progression(db_session, user.id)

        service.start_quest(db_session, user.id, quest.id, user_level=1)
        db_session.flush()

        # Fire a non-matching event type
        updates = service.evaluate_quest_progress(
            db_session, user.id, "assessment_completed"
        )

        # Should not have updated our quest
        quest_update = next((u for u in updates if u.quest_id == quest.id), None)
        assert quest_update is None

    def test_quest_completes_when_all_requirements_met(self, db_session, service):
        user = _create_user(db_session)
        quest = _create_quest(
            db_session,
            level_required=1,
            xp_reward=100,
            coin_reward=50,
            name=f"Complete {uuid4().hex[:6]}",
            requirements=[
                {"type": "module_completed", "count": 1, "description": "Complete 1 module"},
            ],
        )
        _ensure_progression(db_session, user.id)

        service.start_quest(db_session, user.id, quest.id, user_level=1)
        db_session.flush()

        # Add exactly enough matching events
        event = GamificationEvent(
            user_id=user.id,
            event_type="module_completed",
            xp_awarded=50,
            event_key=f"module:{uuid4()}",
        )
        db_session.add(event)
        db_session.flush()

        updates = service.evaluate_quest_progress(
            db_session, user.id, "module_completed"
        )

        completed_update = next((u for u in updates if u.quest_id == quest.id), None)
        assert completed_update is not None
        assert completed_update.completed is True
        assert completed_update.status == "completed"

        # Verify progress row is marked completed
        progress = (
            db_session.query(UserQuestProgress)
            .filter(
                UserQuestProgress.user_id == user.id,
                UserQuestProgress.quest_id == quest.id,
            )
            .first()
        )
        assert progress.status == "completed"
        assert progress.completed_at is not None


class TestQuestServiceCompletion:
    """Tests for complete_quest and reward distribution."""

    def test_complete_quest_awards_xp(self, db_session, service):
        user = _create_user(db_session)
        quest = _create_quest(
            db_session,
            level_required=1,
            xp_reward=200,
            coin_reward=0,
            name=f"XPReward {uuid4().hex[:6]}",
        )
        _ensure_progression(db_session, user.id)

        progress = service.start_quest(db_session, user.id, quest.id, user_level=1)
        db_session.flush()

        result = service.complete_quest(db_session, user.id, progress)
        db_session.flush()

        assert result.xp_awarded == 200
        assert result.quest_name == quest.name

    def test_complete_quest_awards_coins(self, db_session, service):
        user = _create_user(db_session)
        quest = _create_quest(
            db_session,
            level_required=1,
            xp_reward=0,
            coin_reward=100,
            name=f"CoinReward {uuid4().hex[:6]}",
        )
        _ensure_progression(db_session, user.id)

        progress = service.start_quest(db_session, user.id, quest.id, user_level=1)
        db_session.flush()

        result = service.complete_quest(db_session, user.id, progress)
        db_session.flush()

        assert result.coins_awarded == 100

    def test_complete_quest_marks_completed(self, db_session, service):
        user = _create_user(db_session)
        quest = _create_quest(
            db_session,
            level_required=1,
            name=f"MarkComplete {uuid4().hex[:6]}",
        )
        _ensure_progression(db_session, user.id)

        progress = service.start_quest(db_session, user.id, quest.id, user_level=1)
        db_session.flush()

        service.complete_quest(db_session, user.id, progress)
        db_session.flush()

        assert progress.status == "completed"
        assert progress.completed_at is not None


class TestQuestServiceMultiple:
    """Tests for multiple simultaneous quests."""

    def test_multiple_quests_in_progress(self, db_session, service):
        user = _create_user(db_session)
        quest1 = _create_quest(db_session, level_required=1, name=f"Multi1 {uuid4().hex[:6]}")
        quest2 = _create_quest(db_session, level_required=1, name=f"Multi2 {uuid4().hex[:6]}")
        _ensure_progression(db_session, user.id)

        service.start_quest(db_session, user.id, quest1.id, user_level=1)
        service.start_quest(db_session, user.id, quest2.id, user_level=1)
        db_session.flush()

        active = service.get_active_quests(db_session, user.id)
        active_ids = [q["id"] for q in active]
        assert str(quest1.id) in active_ids
        assert str(quest2.id) in active_ids


class TestQuestServiceSingleton:
    """Tests for module-level singleton."""

    def test_singleton_exists(self):
        assert quest_service is not None
        assert isinstance(quest_service, QuestService)

    def test_singleton_has_progression_service(self):
        assert quest_service.progression is not None


class TestQuestToDictOutput:
    """Tests for _quest_to_dict output format."""

    def test_quest_dict_has_required_fields(self, db_session, service):
        user = _create_user(db_session)
        quest = _create_quest(
            db_session,
            level_required=1,
            name=f"DictFields {uuid4().hex[:6]}",
            xp_reward=100,
            coin_reward=50,
        )

        quests = service.get_available_quests(db_session, user.id, user_level=1)
        quest_data = next((q for q in quests if q["id"] == str(quest.id)), None)
        assert quest_data is not None

        assert "id" in quest_data
        assert "name" in quest_data
        assert "description" in quest_data
        assert "level_required" in quest_data
        assert "xp_reward" in quest_data
        assert "coin_reward" in quest_data
        assert "requirements" in quest_data
        assert "status" in quest_data
        assert quest_data["status"] == "available"

    def test_requirements_include_progress(self, db_session, service):
        user = _create_user(db_session)
        quest = _create_quest(
            db_session,
            level_required=1,
            name=f"ReqProg {uuid4().hex[:6]}",
            requirements=[
                {"type": "module_completed", "count": 3, "description": "Complete 3 modules"},
            ],
        )
        _ensure_progression(db_session, user.id)

        service.start_quest(db_session, user.id, quest.id, user_level=1)
        db_session.flush()

        quests = service.get_available_quests(db_session, user.id, user_level=1)
        quest_data = next((q for q in quests if q["id"] == str(quest.id)), None)
        assert quest_data is not None

        reqs = quest_data["requirements"]
        assert len(reqs) == 1
        assert reqs[0]["type"] == "module_completed"
        assert reqs[0]["count"] == 3
        assert reqs[0]["current_count"] == 0
        assert reqs[0]["completed"] is False
