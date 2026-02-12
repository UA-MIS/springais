"""
Tests for learning content service badge integration (FR-7.1, FR-7.2).

TDD: Tests for Phase A quick wins in learning_content_service.
"""

from __future__ import annotations

import os
import sys

import pytest

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from app.services.learning_content_service import _generate_fallback_content


class TestFallbackContentBadgeUrls:
    """Test FR-7.1 and FR-7.2: Skill-specific Credly search URLs."""

    def test_fallback_ey_badge_url_contains_skill_name(self):
        """FR-7.1: EY badge URL should be skill-specific, not generic."""
        content = _generate_fallback_content("Python", "Python Fundamentals", "technical")
        ey_resources = content["ey_resources"]

        badge_resource = next(r for r in ey_resources if r["type"] == "badge")
        assert "search=Python" in badge_resource["url"]
        assert "credly.com/organizations/ey/badges" in badge_resource["url"]

    def test_fallback_ey_badge_url_not_generic(self):
        """FR-7.1: URL should NOT be the generic /organizations/ey/badges page."""
        content = _generate_fallback_content("Azure", "Azure Fundamentals", "technical")
        ey_resources = content["ey_resources"]

        badge_resource = next(r for r in ey_resources if r["type"] == "badge")
        # Should have ?search= parameter, not be the bare URL
        assert "?search=" in badge_resource["url"]

    def test_fallback_ey_badge_title_contains_skill(self):
        """FR-7.2: Badge resource title should include the skill name."""
        content = _generate_fallback_content("Machine Learning", "ML Basics", "technical")
        ey_resources = content["ey_resources"]

        badge_resource = next(r for r in ey_resources if r["type"] == "badge")
        assert "Machine Learning" in badge_resource["title"]

    def test_fallback_encodes_special_characters(self):
        """Skill names with special chars should be URL-encoded."""
        content = _generate_fallback_content("C#", "C# Basics", "technical")
        ey_resources = content["ey_resources"]

        badge_resource = next(r for r in ey_resources if r["type"] == "badge")
        # '#' should be encoded as '%23'
        assert "%23" in badge_resource["url"]

    def test_fallback_encodes_spaces(self):
        """Skill names with spaces should use + encoding."""
        content = _generate_fallback_content("Data Science", "DS Intro", "technical")
        ey_resources = content["ey_resources"]

        badge_resource = next(r for r in ey_resources if r["type"] == "badge")
        assert "Data+Science" in badge_resource["url"]

    def test_fallback_virtual_academy_unchanged(self):
        """EY Virtual Academy resource should remain unchanged."""
        content = _generate_fallback_content("Python", "Python Basics", "technical")
        ey_resources = content["ey_resources"]

        va_resource = next(r for r in ey_resources if r["type"] == "course")
        assert "eyvirtualacademy.com" in va_resource["url"]
        assert va_resource["badge_available"] is False

    def test_fallback_description_is_skill_specific(self):
        """FR-7.2: Description should mention the specific skill."""
        content = _generate_fallback_content("Kubernetes", "K8s Basics", "technical")
        ey_resources = content["ey_resources"]

        badge_resource = next(r for r in ey_resources if r["type"] == "badge")
        assert "Kubernetes" in badge_resource["description"]
