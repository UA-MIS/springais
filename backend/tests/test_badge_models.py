"""
Tests for badge models (BadgeCatalog, BadgeSkillMapping, BadgeInteraction, UserBadge).

TDD: Tests for Phase A model layer.
"""

from __future__ import annotations

import os
import sys
from uuid import uuid4

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from app.database import DATABASE_URL
from app.models import Base
from app.models.badge import (
    BadgeCatalog,
    BadgeInteraction,
    BadgeSkillMapping,
    UserBadge,
    BadgePlatform,
    DifficultyLevel,
    MappingSource,
    InteractionType,
    InteractionSource,
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


# ============================================
# Enum Tests
# ============================================

class TestBadgeEnums:
    def test_badge_platform_values(self):
        assert BadgePlatform.CREDLY.value == "credly"
        assert BadgePlatform.MICROSOFT.value == "microsoft"
        assert BadgePlatform.AWS.value == "aws"
        assert BadgePlatform.GOOGLE.value == "google"
        assert BadgePlatform.COMPTIA.value == "comptia"
        assert BadgePlatform.PMI.value == "pmi"
        assert BadgePlatform.OTHER.value == "other"

    def test_difficulty_level_values(self):
        assert DifficultyLevel.BEGINNER.value == "beginner"
        assert DifficultyLevel.INTERMEDIATE.value == "intermediate"
        assert DifficultyLevel.ADVANCED.value == "advanced"
        assert DifficultyLevel.EXPERT.value == "expert"

    def test_mapping_source_values(self):
        assert MappingSource.CURATED.value == "curated"
        assert MappingSource.API.value == "api"
        assert MappingSource.AI.value == "ai"

    def test_interaction_type_values(self):
        assert InteractionType.CLICK.value == "click"
        assert InteractionType.EARNED.value == "earned"
        assert InteractionType.THUMBS_UP.value == "thumbs_up"
        assert InteractionType.THUMBS_DOWN.value == "thumbs_down"

    def test_interaction_source_values(self):
        assert InteractionSource.SKILL_MODULE.value == "skill_module"
        assert InteractionSource.ROADMAP.value == "roadmap"
        assert InteractionSource.SEARCH.value == "search"


# ============================================
# BadgeCatalog Tests
# ============================================

class TestBadgeCatalog:
    def test_create_badge_catalog_entry(self, db_session):
        badge = BadgeCatalog(
            external_id="test-badge-001",
            name="Test Azure Badge",
            issuer="Microsoft",
            platform="microsoft",
            url="https://learn.microsoft.com/test",
            skills=["azure", "cloud computing"],
            difficulty_level="intermediate",
            estimated_cost_usd=165.0,
            estimated_hours=80,
            renewal_months=12,
            is_active=True,
        )
        db_session.add(badge)
        db_session.flush()

        assert badge.id is not None
        assert badge.name == "Test Azure Badge"
        assert badge.platform == "microsoft"
        assert badge.skills == ["azure", "cloud computing"]
        assert badge.is_active is True

    def test_badge_catalog_defaults(self, db_session):
        badge = BadgeCatalog(
            external_id="test-badge-defaults",
            name="Minimal Badge",
            issuer="Test",
            platform="other",
            url="https://example.com",
        )
        db_session.add(badge)
        db_session.flush()

        assert badge.is_active is True
        assert badge.image_url is None
        assert badge.difficulty_level is None
        assert badge.estimated_cost_usd is None

    def test_badge_catalog_unique_constraint(self, db_session):
        badge1 = BadgeCatalog(
            external_id="unique-test",
            name="Badge 1",
            issuer="Test",
            platform="microsoft",
            url="https://example.com/1",
        )
        db_session.add(badge1)
        db_session.flush()

        badge2 = BadgeCatalog(
            external_id="unique-test",
            name="Badge 2",
            issuer="Test",
            platform="microsoft",
            url="https://example.com/2",
        )
        db_session.add(badge2)

        with pytest.raises(Exception):  # IntegrityError for unique constraint
            db_session.flush()


# ============================================
# BadgeSkillMapping Tests
# ============================================

class TestBadgeSkillMapping:
    def test_create_skill_mapping(self, db_session):
        badge = BadgeCatalog(
            external_id="mapping-test",
            name="Mapping Test Badge",
            issuer="Test",
            platform="other",
            url="https://example.com",
        )
        db_session.add(badge)
        db_session.flush()

        mapping = BadgeSkillMapping(
            badge_id=badge.id,
            skill_name="python",
            mapping_confidence=1.0,
            source="curated",
        )
        db_session.add(mapping)
        db_session.flush()

        assert mapping.id is not None
        assert mapping.badge_id == badge.id
        assert mapping.skill_name == "python"
        assert mapping.mapping_confidence == 1.0
        assert mapping.source == "curated"

    def test_skill_mapping_relationship(self, db_session):
        badge = BadgeCatalog(
            external_id="rel-test",
            name="Relationship Test Badge",
            issuer="Test",
            platform="other",
            url="https://example.com",
        )
        db_session.add(badge)
        db_session.flush()

        mapping = BadgeSkillMapping(
            badge_id=badge.id,
            skill_name="azure",
            mapping_confidence=0.8,
            source="api",
        )
        db_session.add(mapping)
        db_session.flush()

        assert mapping.badge.name == "Relationship Test Badge"
        assert len(badge.skill_mappings) == 1
        assert badge.skill_mappings[0].skill_name == "azure"


# ============================================
# BadgeInteraction Tests
# ============================================

class TestBadgeInteraction:
    def test_create_interaction(self, db_session):
        from app.models.user_profile import UserProfile

        # Create a real user to satisfy FK constraint
        user = db_session.query(UserProfile).first()
        if not user:
            user = UserProfile(
                email="badge_interaction_test@test.com",
                hashed_password="fakehash",
                full_name="Test User",
            )
            db_session.add(user)
            db_session.flush()

        badge = BadgeCatalog(
            external_id="interaction-test",
            name="Interaction Test Badge",
            issuer="Test",
            platform="other",
            url="https://example.com",
        )
        db_session.add(badge)
        db_session.flush()

        interaction = BadgeInteraction(
            user_id=user.id,
            badge_id=badge.id,
            interaction_type="click",
            source="skill_module",
        )
        db_session.add(interaction)
        db_session.flush()

        assert interaction.id is not None
        assert interaction.interaction_type == "click"
        assert interaction.source == "skill_module"
        assert interaction.created_at is not None


# ============================================
# UserBadge Tests
# ============================================

class TestUserBadge:
    def test_create_user_badge(self, db_session):
        from app.models.user_profile import UserProfile

        # Create a real user to satisfy FK constraint
        user = db_session.query(UserProfile).first()
        if not user:
            user = UserProfile(
                email="badge_earned_test@test.com",
                hashed_password="fakehash",
                full_name="Test User",
            )
            db_session.add(user)
            db_session.flush()

        badge = BadgeCatalog(
            external_id="earned-test",
            name="Earned Test Badge",
            issuer="Test",
            platform="other",
            url="https://example.com",
        )
        db_session.add(badge)
        db_session.flush()

        user_badge = UserBadge(
            user_id=user.id,
            badge_id=badge.id,
            self_reported=True,
        )
        db_session.add(user_badge)
        db_session.flush()

        assert user_badge.id is not None
        assert user_badge.self_reported is True
        assert user_badge.earned_date is None
