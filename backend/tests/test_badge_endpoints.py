"""
Tests for badge API endpoints.

TDD: Tests for Phase A/B API routes.
"""

from __future__ import annotations

import os
import sys
from unittest.mock import patch, MagicMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from app.database import DATABASE_URL, get_db
from app.models import Base
from app.models.badge import BadgeCatalog, BadgeSkillMapping, BadgeInteraction, UserBadge
from app.models.user_profile import UserProfile
from app.main import app
from app.utils.security import get_current_user_from_token

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
def test_user(db_session):
    """Create a test user for authenticated endpoints."""
    user = db_session.query(UserProfile).first()
    if not user:
        user = UserProfile(
            email="badgetest@example.com",
            hashed_password="fakehash",
            full_name="Badge Test User",
            skills=["azure", "python"],
        )
        db_session.add(user)
        db_session.flush()
    return user


@pytest.fixture()
def test_badge(db_session):
    """Create a test badge."""
    badge = BadgeCatalog(
        external_id=f"endpoint-test-{uuid4().hex[:8]}",
        name="Endpoint Test Badge",
        issuer="Test Issuer",
        platform="other",
        url="https://example.com/endpoint-test",
        skills=["test", "python"],
        difficulty_level="intermediate",
        is_active=True,
    )
    db_session.add(badge)
    db_session.flush()

    # Add skill mapping
    mapping = BadgeSkillMapping(
        badge_id=badge.id,
        skill_name="python",
        mapping_confidence=1.0,
        source="curated",
    )
    db_session.add(mapping)
    db_session.flush()

    return badge


@pytest.fixture()
def client(db_session, test_user):
    """Create a test client with mocked auth and DB."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    def override_auth():
        return test_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user_from_token] = override_auth

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()


# ============================================
# POST /api/badges/interactions Tests
# ============================================

class TestBadgeInteractionsEndpoint:
    def test_record_click(self, client, test_badge, db_session):
        response = client.post("/api/badges/interactions", json={
            "badge_id": str(test_badge.id),
            "interaction_type": "click",
            "source": "skill_module",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["recorded"] is True

    def test_record_thumbs_up(self, client, test_badge):
        response = client.post("/api/badges/interactions", json={
            "badge_id": str(test_badge.id),
            "interaction_type": "thumbs_up",
            "source": "roadmap",
        })
        assert response.status_code == 200

    def test_record_thumbs_down(self, client, test_badge):
        response = client.post("/api/badges/interactions", json={
            "badge_id": str(test_badge.id),
            "interaction_type": "thumbs_down",
            "source": "search",
        })
        assert response.status_code == 200

    def test_record_interaction_badge_not_found(self, client):
        response = client.post("/api/badges/interactions", json={
            "badge_id": str(uuid4()),
            "interaction_type": "click",
            "source": "skill_module",
        })
        assert response.status_code == 404

    def test_record_interaction_invalid_type(self, client, test_badge):
        response = client.post("/api/badges/interactions", json={
            "badge_id": str(test_badge.id),
            "interaction_type": "invalid",
            "source": "skill_module",
        })
        assert response.status_code == 422


# ============================================
# GET /api/badges/discover Tests
# ============================================

class TestBadgeDiscoverEndpoint:
    def test_discover_with_matching_skill(self, client, test_badge):
        response = client.get("/api/badges/discover?skills=python")
        assert response.status_code == 200
        data = response.json()
        assert data["total_count"] >= 1
        assert data["skills_queried"] == ["python"]
        assert len(data["badges"]) >= 1

    def test_discover_pagination(self, client, test_badge):
        response = client.get("/api/badges/discover?skills=python&page=1&per_page=1")
        assert response.status_code == 200
        data = response.json()
        assert data["per_page"] == 1
        assert len(data["badges"]) <= 1

    def test_discover_no_matching_skills(self, client):
        response = client.get("/api/badges/discover?skills=xyznonexistent")
        assert response.status_code == 200
        data = response.json()
        assert data["total_count"] == 0

    def test_discover_multiple_skills(self, client, test_badge):
        response = client.get("/api/badges/discover?skills=python,test")
        assert response.status_code == 200
        data = response.json()
        assert "python" in data["skills_queried"]
        assert "test" in data["skills_queried"]


# ============================================
# GET /api/badges/{badge_id} Tests
# ============================================

class TestBadgeDetailEndpoint:
    def test_get_badge_by_id(self, client, test_badge):
        response = client.get(f"/api/badges/{test_badge.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Endpoint Test Badge"
        assert data["issuer"] == "Test Issuer"

    def test_get_badge_not_found(self, client):
        response = client.get(f"/api/badges/{uuid4()}")
        assert response.status_code == 404


# ============================================
# GET /api/badges/catalog/search Tests
# ============================================

class TestBadgeCatalogSearchEndpoint:
    def test_search_by_name(self, client, test_badge):
        response = client.get("/api/badges/catalog/search?q=Endpoint Test")
        assert response.status_code == 200
        data = response.json()
        assert data["count"] >= 1
        assert data["results"][0]["name"] == "Endpoint Test Badge"

    def test_search_no_results(self, client):
        response = client.get("/api/badges/catalog/search?q=xyznonexistent")
        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 0

    def test_search_query_too_short(self, client):
        response = client.get("/api/badges/catalog/search?q=a")
        assert response.status_code == 422


# ============================================
# POST /api/badges/earned Tests
# ============================================

class TestBadgeEarnedEndpoint:
    def test_mark_badge_earned(self, client, test_badge):
        response = client.post("/api/badges/earned", json={
            "badge_id": str(test_badge.id),
        })
        assert response.status_code == 200
        data = response.json()
        assert data["badge_id"] == str(test_badge.id)
        assert data["earned_date"] is not None

    def test_mark_badge_earned_with_date(self, client, test_badge, db_session):
        # Create a different badge to avoid duplicate
        badge2 = BadgeCatalog(
            external_id=f"earned-date-test-{uuid4().hex[:8]}",
            name="Earned Date Test Badge",
            issuer="Test",
            platform="other",
            url="https://example.com/earned-date",
            is_active=True,
        )
        db_session.add(badge2)
        db_session.flush()

        response = client.post("/api/badges/earned", json={
            "badge_id": str(badge2.id),
            "earned_date": "2026-01-15T00:00:00Z",
        })
        assert response.status_code == 200

    def test_mark_badge_earned_not_found(self, client):
        response = client.post("/api/badges/earned", json={
            "badge_id": str(uuid4()),
        })
        assert response.status_code == 404


# ============================================
# GET /api/badges/analytics Tests
# ============================================

class TestBadgeAnalyticsEndpoint:
    def test_get_analytics_non_admin_forbidden(self, client):
        """B-3 regression: non-admin user gets 403 on analytics."""
        response = client.get("/api/badges/analytics")
        assert response.status_code == 403
        assert response.json()["detail"] == "Admin access required"

    def test_get_analytics_admin_allowed(self, db_session):
        """B-3 regression: admin user can access analytics."""
        admin_user = UserProfile(
            email=f"admin-{uuid4().hex[:6]}@example.com",
            hashed_password="fakehash",
            full_name="Admin User",
            skills=[],
            account_type="admin",
        )
        db_session.add(admin_user)
        db_session.flush()

        def override_get_db():
            try:
                yield db_session
            finally:
                pass

        def override_auth():
            return admin_user

        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_current_user_from_token] = override_auth

        with TestClient(app) as c:
            response = c.get("/api/badges/analytics")

        app.dependency_overrides.clear()

        assert response.status_code == 200
        data = response.json()
        assert "total_badges" in data
        assert "total_interactions" in data
        assert "relevance_ratings" in data


# ============================================
# B-1 Regression: SQL Wildcard Injection
# ============================================

class TestSQLWildcardInjection:
    def test_search_with_percent_in_query(self, client, test_badge):
        """B-1 regression: % in search query should be escaped, not act as wildcard."""
        response = client.get("/api/badges/catalog/search?q=%%")
        assert response.status_code == 200
        data = response.json()
        # %% should not match all badges -- it should match only badges with literal %
        assert data["count"] == 0

    def test_search_with_underscore_in_query(self, client, test_badge):
        """B-1 regression: _ in search query should be escaped, not act as single-char wildcard."""
        response = client.get("/api/badges/catalog/search?q=Endpoint_Test")
        assert response.status_code == 200
        data = response.json()
        # _ should not match the space in "Endpoint Test Badge"
        assert data["count"] == 0

    def test_search_normal_query_still_works(self, client, test_badge):
        """Ensure normal search still works after wildcard escaping."""
        response = client.get("/api/badges/catalog/search?q=Endpoint Test")
        assert response.status_code == 200
        data = response.json()
        assert data["count"] >= 1


# ============================================
# B-2 Regression: Discover delegates to service
# ============================================

class TestDiscoverDelegation:
    def test_discover_delegates_to_service(self, db_session, test_user, test_badge):
        """B-2 regression: discover endpoint should delegate to BadgeDiscoveryService."""
        from unittest.mock import AsyncMock

        def override_get_db():
            try:
                yield db_session
            finally:
                pass

        def override_auth():
            return test_user

        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_current_user_from_token] = override_auth

        with patch(
            "app.routes.badges.BadgeDiscoveryService"
        ) as mock_cls:
            mock_service = MagicMock()
            mock_cls.return_value = mock_service
            mock_service.discover_badges = AsyncMock(return_value={
                "badges": [],
                "total_count": 0,
                "page": 1,
                "per_page": 20,
                "skills_queried": ["python"],
            })

            with TestClient(app) as c:
                response = c.get("/api/badges/discover?skills=python")

            assert response.status_code == 200
            mock_service.discover_badges.assert_called_once()

        app.dependency_overrides.clear()


# ============================================
# B-4 Regression: Malformed UUID returns 400
# ============================================

class TestMalformedUUID:
    def test_get_badge_malformed_uuid(self, client):
        """B-4 regression: malformed UUID returns 400, not 500."""
        response = client.get("/api/badges/not-a-uuid")
        assert response.status_code == 400
        assert response.json()["detail"] == "Invalid badge ID format"

    def test_interaction_malformed_uuid(self, client):
        """B-4 regression: malformed badge_id in interaction returns 400."""
        response = client.post("/api/badges/interactions", json={
            "badge_id": "not-a-uuid",
            "interaction_type": "click",
            "source": "skill_module",
        })
        assert response.status_code == 400
        assert response.json()["detail"] == "Invalid badge ID format"

    def test_earned_malformed_uuid(self, client):
        """B-4 regression: malformed badge_id in earned returns 400."""
        response = client.post("/api/badges/earned", json={
            "badge_id": "not-a-valid-uuid",
        })
        assert response.status_code == 400
        assert response.json()["detail"] == "Invalid badge ID format"
