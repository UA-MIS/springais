"""
Tests for BadgeDiscoveryService and matching engine.

TDD: Tests for Phase B discovery and matching.
"""

from __future__ import annotations

import os
import sys

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from app.database import DATABASE_URL
from app.models import Base
from app.models.badge import BadgeCatalog, BadgeSkillMapping

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
def seeded_db(db_session):
    """Seed the database with test badge data."""
    # Create test badges
    azure_badge = BadgeCatalog(
        external_id="test-azure-001",
        name="Azure Solutions Architect Expert",
        issuer="Microsoft",
        platform="microsoft",
        url="https://learn.microsoft.com/test/azure-architect",
        skills=["azure", "cloud architecture", "networking"],
        difficulty_level="expert",
        estimated_cost_usd=165.0,
        is_active=True,
    )
    aws_badge = BadgeCatalog(
        external_id="test-aws-001",
        name="AWS Cloud Practitioner",
        issuer="Amazon Web Services",
        platform="aws",
        url="https://aws.amazon.com/test/cloud-practitioner",
        skills=["aws", "cloud computing"],
        difficulty_level="beginner",
        estimated_cost_usd=100.0,
        is_active=True,
    )
    python_badge = BadgeCatalog(
        external_id="test-python-001",
        name="Python Data Analysis",
        issuer="CompTIA",
        platform="comptia",
        url="https://comptia.org/test/python",
        skills=["python", "data analysis"],
        difficulty_level="intermediate",
        is_active=True,
    )
    inactive_badge = BadgeCatalog(
        external_id="test-inactive-001",
        name="Inactive Badge",
        issuer="Test",
        platform="other",
        url="https://example.com/inactive",
        skills=["azure"],
        is_active=False,
    )

    db_session.add_all([azure_badge, aws_badge, python_badge, inactive_badge])
    db_session.flush()

    # Create curated skill mappings
    mappings = [
        BadgeSkillMapping(badge_id=azure_badge.id, skill_name="azure", mapping_confidence=1.0, source="curated"),
        BadgeSkillMapping(badge_id=azure_badge.id, skill_name="cloud architecture", mapping_confidence=1.0, source="curated"),
        BadgeSkillMapping(badge_id=aws_badge.id, skill_name="aws", mapping_confidence=1.0, source="curated"),
        BadgeSkillMapping(badge_id=aws_badge.id, skill_name="cloud computing", mapping_confidence=1.0, source="curated"),
        BadgeSkillMapping(badge_id=python_badge.id, skill_name="python", mapping_confidence=1.0, source="curated"),
        BadgeSkillMapping(badge_id=python_badge.id, skill_name="data analysis", mapping_confidence=1.0, source="curated"),
    ]
    db_session.add_all(mappings)
    db_session.flush()

    return db_session


# ============================================
# CuratedMatcher Tests
# ============================================

class TestCuratedMatcher:
    @pytest.mark.asyncio
    async def test_curated_match_finds_azure(self, seeded_db):
        from app.services.badge_discovery_service import CuratedMatcher

        matcher = CuratedMatcher(seeded_db)
        results = await matcher.find_matches(["azure"])

        assert len(results) >= 1
        names = [r.name for r in results]
        assert "Azure Solutions Architect Expert" in names

    @pytest.mark.asyncio
    async def test_curated_match_confidence_1(self, seeded_db):
        from app.services.badge_discovery_service import CuratedMatcher

        matcher = CuratedMatcher(seeded_db)
        results = await matcher.find_matches(["python"])

        assert len(results) >= 1
        for result in results:
            assert result.relevance_score == 1.0
            assert result.mapping_source == "curated"

    @pytest.mark.asyncio
    async def test_curated_match_no_results(self, seeded_db):
        from app.services.badge_discovery_service import CuratedMatcher

        matcher = CuratedMatcher(seeded_db)
        results = await matcher.find_matches(["nonexistent_skill_xyz"])

        assert len(results) == 0

    @pytest.mark.asyncio
    async def test_curated_match_excludes_inactive(self, seeded_db):
        from app.services.badge_discovery_service import CuratedMatcher

        matcher = CuratedMatcher(seeded_db)
        # The inactive badge has "azure" in skills but no curated mapping
        # This test verifies it doesn't appear through curated mappings
        results = await matcher.find_matches(["azure"])
        names = [r.name for r in results]
        assert "Inactive Badge" not in names


# ============================================
# KeywordMatcher Tests
# ============================================

class TestKeywordMatcher:
    @pytest.mark.asyncio
    async def test_keyword_match_finds_by_skill(self, seeded_db):
        from app.services.badge_discovery_service import KeywordMatcher

        matcher = KeywordMatcher(seeded_db)
        results = await matcher.find_matches(["azure"])

        assert len(results) >= 1
        # Should find Azure badge via keyword matching on skills array
        names = [r.name for r in results]
        assert "Azure Solutions Architect Expert" in names

    @pytest.mark.asyncio
    async def test_keyword_match_excludes_inactive(self, seeded_db):
        from app.services.badge_discovery_service import KeywordMatcher

        matcher = KeywordMatcher(seeded_db)
        results = await matcher.find_matches(["azure"])

        names = [r.name for r in results]
        assert "Inactive Badge" not in names

    @pytest.mark.asyncio
    async def test_keyword_match_confidence_range(self, seeded_db):
        from app.services.badge_discovery_service import KeywordMatcher

        matcher = KeywordMatcher(seeded_db)
        results = await matcher.find_matches(["azure"])

        for result in results:
            assert 0.4 - 1e-9 <= result.relevance_score <= 0.6 + 1e-9

    @pytest.mark.asyncio
    async def test_keyword_match_abbreviation_expansion(self, seeded_db):
        from app.services.badge_discovery_service import KeywordMatcher

        matcher = KeywordMatcher(seeded_db)
        # "py" should expand to "python" and match
        results = await matcher.find_matches(["py"])

        names = [r.name for r in results]
        assert "Python Data Analysis" in names

    @pytest.mark.asyncio
    async def test_keyword_match_substring_matching(self, seeded_db):
        """Substring matching: 'network' should match badges with 'networking' in skills."""
        from app.services.badge_discovery_service import KeywordMatcher

        matcher = KeywordMatcher(seeded_db)
        results = await matcher.find_matches(["network"])

        names = [r.name for r in results]
        # Azure badge has "networking" in skills, "network" is a substring
        assert "Azure Solutions Architect Expert" in names

    @pytest.mark.asyncio
    async def test_keyword_match_reverse_substring(self, seeded_db):
        """Reverse substring: 'cloud architecture design' should match 'cloud architecture'."""
        from app.services.badge_discovery_service import KeywordMatcher

        matcher = KeywordMatcher(seeded_db)
        results = await matcher.find_matches(["cloud architecture design"])

        names = [r.name for r in results]
        # "cloud architecture" is a substring of "cloud architecture design"
        assert "Azure Solutions Architect Expert" in names


# ============================================
# BadgeMatchingEngine Tests
# ============================================

class TestBadgeMatchingEngine:
    @pytest.mark.asyncio
    async def test_engine_deduplication(self, seeded_db):
        from app.services.badge_discovery_service import BadgeMatchingEngine

        # With external APIs disabled, curated + keyword will both find same badges
        engine = BadgeMatchingEngine(seeded_db, include_external_apis=False)
        results = await engine.match(["azure"])

        # Should be deduplicated - Azure badge should appear only once
        external_ids = [r.external_id for r in results]
        assert len(external_ids) == len(set(external_ids))

    @pytest.mark.asyncio
    async def test_engine_sorted_by_relevance(self, seeded_db):
        from app.services.badge_discovery_service import BadgeMatchingEngine

        engine = BadgeMatchingEngine(seeded_db, include_external_apis=False)
        results = await engine.match(["azure"])

        for i in range(len(results) - 1):
            assert results[i].relevance_score >= results[i + 1].relevance_score

    @pytest.mark.asyncio
    async def test_engine_filters_below_threshold(self, seeded_db):
        from app.services.badge_discovery_service import BadgeMatchingEngine

        engine = BadgeMatchingEngine(seeded_db, include_external_apis=False)
        results = await engine.match(["azure"])

        for result in results:
            assert result.relevance_score >= 0.3


# ============================================
# BadgeDiscoveryService Tests
# ============================================

class TestBadgeDiscoveryService:
    @pytest.mark.asyncio
    async def test_discover_badges_returns_results(self, seeded_db):
        from app.services.badge_discovery_service import BadgeDiscoveryService

        service = BadgeDiscoveryService(seeded_db)
        response = await service.discover_badges(["azure"])

        assert response["total_count"] > 0
        assert response["skills_queried"] == ["azure"]

    @pytest.mark.asyncio
    async def test_discover_badges_pagination(self, seeded_db):
        from app.services.badge_discovery_service import BadgeDiscoveryService

        service = BadgeDiscoveryService(seeded_db)
        response = await service.discover_badges(["azure", "aws", "python"], per_page=1)

        assert response["per_page"] == 1
        assert len(response["badges"]) <= 1

    @pytest.mark.asyncio
    async def test_get_badges_for_skills(self, seeded_db):
        from app.services.badge_discovery_service import BadgeDiscoveryService

        service = BadgeDiscoveryService(seeded_db)
        results = await service.get_badges_for_skills(["python", "data analysis"])

        assert len(results) >= 1
        names = [r.name for r in results]
        assert "Python Data Analysis" in names

    @pytest.mark.asyncio
    async def test_search_catalog(self, seeded_db):
        from app.services.badge_discovery_service import BadgeDiscoveryService

        service = BadgeDiscoveryService(seeded_db)
        results = await service.search_catalog("Azure")

        assert len(results) >= 1
        assert results[0].name == "Azure Solutions Architect Expert"

    @pytest.mark.asyncio
    async def test_search_catalog_no_results(self, seeded_db):
        from app.services.badge_discovery_service import BadgeDiscoveryService

        service = BadgeDiscoveryService(seeded_db)
        results = await service.search_catalog("xyznonexistent")

        assert len(results) == 0


# ============================================
# Seed Data Tests
# ============================================

class TestBadgeSeedData:
    def test_seed_data_has_minimum_entries(self):
        from app.data.badge_seed import BADGE_SEED_DATA

        assert len(BADGE_SEED_DATA) >= 50

    def test_seed_data_covers_all_platforms(self):
        from app.data.badge_seed import BADGE_SEED_DATA

        platforms = set(entry["platform"] for entry in BADGE_SEED_DATA)
        assert "microsoft" in platforms
        assert "aws" in platforms
        assert "google" in platforms
        assert "comptia" in platforms
        assert "pmi" in platforms
        assert "credly" in platforms

    def test_seed_data_entries_have_required_fields(self):
        from app.data.badge_seed import BADGE_SEED_DATA

        for entry in BADGE_SEED_DATA:
            assert "external_id" in entry
            assert "name" in entry
            assert "issuer" in entry
            assert "platform" in entry
            assert "url" in entry
            assert "skills" in entry
            assert len(entry["skills"]) > 0

    def test_seed_data_microsoft_count(self):
        from app.data.badge_seed import BADGE_SEED_DATA

        ms_count = sum(1 for e in BADGE_SEED_DATA if e["platform"] == "microsoft")
        assert ms_count >= 20

    def test_seed_data_aws_count(self):
        from app.data.badge_seed import BADGE_SEED_DATA

        aws_count = sum(1 for e in BADGE_SEED_DATA if e["platform"] == "aws")
        assert aws_count >= 12

    def test_seed_badge_catalog(self, db_session):
        """Test that seed_badge_catalog inserts data correctly."""
        from app.data.badge_seed import seed_badge_catalog

        count = seed_badge_catalog(db_session)
        assert count >= 50

        # Verify data was inserted
        total = db_session.query(BadgeCatalog).count()
        assert total >= 50

        # Verify skill mappings were created
        mapping_count = db_session.query(BadgeSkillMapping).filter(
            BadgeSkillMapping.source == "curated"
        ).count()
        assert mapping_count > 0

    def test_seed_is_idempotent(self, db_session):
        """Running seed twice should not duplicate entries."""
        from app.data.badge_seed import seed_badge_catalog

        count1 = seed_badge_catalog(db_session)
        count2 = seed_badge_catalog(db_session)

        # Second run should add 0 new entries
        assert count2 == 0
