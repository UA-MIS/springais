"""
Tests for badge Pydantic schemas.

TDD: Tests for schema validation and serialization.
"""

from __future__ import annotations

import os
import sys

import pytest

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from app.schemas.badge import (
    BadgeResponse,
    BadgeDiscoverResponse,
    BadgeInteractionRequest,
    BadgeEarnedRequest,
    BadgeAnalyticsResponse,
    BadgeCatalogSearchResponse,
)
from app.schemas.skill_progress import EYResourceSchema
from app.schemas.roadmap import MilestoneCertification, RoadmapMilestone


# ============================================
# BadgeResponse Tests
# ============================================

class TestBadgeResponse:
    def test_minimal_badge_response(self):
        badge = BadgeResponse(
            id="test-id",
            name="Test Badge",
            issuer="Microsoft",
            platform="microsoft",
            url="https://example.com",
        )
        assert badge.id == "test-id"
        assert badge.skills == []
        assert badge.relevance_score == 0.0
        assert badge.mapping_source == "curated"

    def test_full_badge_response(self):
        badge = BadgeResponse(
            id="full-id",
            name="Azure Expert",
            issuer="Microsoft",
            platform="microsoft",
            url="https://learn.microsoft.com/test",
            image_url="https://images.credly.com/test.png",
            skills=["azure", "cloud architecture"],
            difficulty_level="expert",
            estimated_cost_usd=165.0,
            estimated_hours=120,
            renewal_months=12,
            relevance_score=0.95,
            mapping_source="curated",
        )
        assert badge.difficulty_level == "expert"
        assert badge.estimated_cost_usd == 165.0
        assert len(badge.skills) == 2


# ============================================
# BadgeDiscoverResponse Tests
# ============================================

class TestBadgeDiscoverResponse:
    def test_empty_discover_response(self):
        response = BadgeDiscoverResponse()
        assert response.badges == []
        assert response.total_count == 0
        assert response.page == 1
        assert response.per_page == 20
        assert response.skills_queried == []

    def test_discover_response_with_results(self):
        badges = [
            BadgeResponse(
                id="1", name="Badge 1", issuer="MS", platform="microsoft", url="https://example.com/1"
            ),
            BadgeResponse(
                id="2", name="Badge 2", issuer="AWS", platform="aws", url="https://example.com/2"
            ),
        ]
        response = BadgeDiscoverResponse(
            badges=badges,
            total_count=2,
            page=1,
            per_page=20,
            skills_queried=["python", "azure"],
        )
        assert len(response.badges) == 2
        assert response.skills_queried == ["python", "azure"]


# ============================================
# BadgeInteractionRequest Tests
# ============================================

class TestBadgeInteractionRequest:
    def test_valid_click_interaction(self):
        req = BadgeInteractionRequest(
            badge_id="badge-123",
            interaction_type="click",
            source="skill_module",
        )
        assert req.interaction_type == "click"
        assert req.source == "skill_module"

    def test_valid_thumbs_up(self):
        req = BadgeInteractionRequest(
            badge_id="badge-123",
            interaction_type="thumbs_up",
            source="roadmap",
        )
        assert req.interaction_type == "thumbs_up"

    def test_valid_thumbs_down(self):
        req = BadgeInteractionRequest(
            badge_id="badge-123",
            interaction_type="thumbs_down",
            source="search",
        )
        assert req.interaction_type == "thumbs_down"

    def test_invalid_interaction_type(self):
        with pytest.raises(Exception):
            BadgeInteractionRequest(
                badge_id="badge-123",
                interaction_type="invalid",
                source="skill_module",
            )

    def test_invalid_source(self):
        with pytest.raises(Exception):
            BadgeInteractionRequest(
                badge_id="badge-123",
                interaction_type="click",
                source="invalid_source",
            )


# ============================================
# BadgeEarnedRequest Tests
# ============================================

class TestBadgeEarnedRequest:
    def test_earned_without_date(self):
        req = BadgeEarnedRequest(badge_id="badge-123")
        assert req.earned_date is None

    def test_earned_with_date(self):
        req = BadgeEarnedRequest(
            badge_id="badge-123",
            earned_date="2026-01-15T00:00:00Z",
        )
        assert req.earned_date is not None


# ============================================
# BadgeAnalyticsResponse Tests
# ============================================

class TestBadgeAnalyticsResponse:
    def test_analytics_response_defaults(self):
        resp = BadgeAnalyticsResponse(
            total_badges=50,
            total_interactions=100,
        )
        assert resp.total_badges == 50
        assert resp.relevance_ratings == {"positive": 0, "negative": 0}
        assert resp.flagged_badges == []


# ============================================
# EYResourceSchema Extension Tests
# ============================================

class TestEYResourceSchemaExtension:
    def test_ey_resource_backward_compatible(self):
        """Existing data without badge fields still works (ADR-003)."""
        resource = EYResourceSchema(
            title="EY Badges",
            url="https://www.credly.com/organizations/ey/badges",
            type="badge",
            badge_available=True,
            description="EY Badges on Credly",
        )
        assert resource.badge_id is None
        assert resource.issuer is None
        assert resource.image_url is None
        assert resource.difficulty_level is None

    def test_ey_resource_with_badge_fields(self):
        """New badge fields work correctly."""
        resource = EYResourceSchema(
            title="Azure Solutions Architect Expert",
            url="https://learn.microsoft.com/cert/azure-solutions-architect",
            type="badge",
            badge_available=True,
            description="Azure certification",
            badge_id="badge-uuid-123",
            issuer="Microsoft",
            image_url="https://images.credly.com/test.png",
            difficulty_level="expert",
        )
        assert resource.badge_id == "badge-uuid-123"
        assert resource.issuer == "Microsoft"
        assert resource.difficulty_level == "expert"


# ============================================
# MilestoneCertification Tests
# ============================================

class TestMilestoneCertification:
    def test_milestone_certification(self):
        cert = MilestoneCertification(
            name="AWS Solutions Architect",
            provider="Amazon Web Services",
            url="https://aws.amazon.com/certification/",
            difficulty_level="intermediate",
            estimated_cost_usd=150.0,
            estimated_hours=80,
        )
        assert cert.name == "AWS Solutions Architect"
        assert cert.estimated_cost_usd == 150.0

    def test_milestone_certification_minimal(self):
        cert = MilestoneCertification(
            name="PMP",
            provider="PMI",
            url="https://pmi.org/pmp",
        )
        assert cert.difficulty_level is None
        assert cert.estimated_cost_usd is None


class TestRoadmapMilestoneCertifications:
    def test_milestone_backward_compatible(self):
        """Existing milestones without certifications still work (ADR-003)."""
        milestone = RoadmapMilestone(
            id="m-1",
            title="Learn Python",
            description="Master Python fundamentals",
            category="skill",
            priority="high",
            estimated_duration_months=2,
        )
        assert milestone.certifications == []

    def test_milestone_with_certifications(self):
        milestone = RoadmapMilestone(
            id="m-2",
            title="Get AWS Certified",
            description="Earn AWS Solutions Architect cert",
            category="certification",
            priority="critical",
            estimated_duration_months=3,
            certifications=[
                MilestoneCertification(
                    name="AWS Solutions Architect - Associate",
                    provider="AWS",
                    url="https://aws.amazon.com/cert",
                    estimated_cost_usd=150.0,
                ),
            ],
        )
        assert len(milestone.certifications) == 1
        assert milestone.certifications[0].name == "AWS Solutions Architect - Associate"
