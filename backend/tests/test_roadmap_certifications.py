"""
Tests for roadmap certification extraction across all milestone categories.

Verifies that _build_response extracts certifications for ALL milestones
when include_certifications=True, not just 'certification' category ones.
"""

from __future__ import annotations

import os
import sys
from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from app.schemas.roadmap import MilestoneCertification, RoadmapEmphasis, RoadmapGenerateRequest, TargetRole


def _make_request(**kwargs) -> RoadmapGenerateRequest:
    defaults = {
        "target_roles": [
            TargetRole(job_id="j1", job_title="Sr Consultant", order=1)
        ],
        "emphasis": RoadmapEmphasis.BALANCED,
        "include_certifications": True,
    }
    defaults.update(kwargs)
    return RoadmapGenerateRequest(**defaults)


def _make_user():
    user = MagicMock()
    user.current_role = "Consultant"
    user.skills = ["Python", "SQL"]
    user.full_name = "Test User"
    return user


# Sample GPT response data with milestones of different categories
SAMPLE_GPT_DATA = {
    "executive_summary": "Test summary.",
    "total_estimated_months": 12,
    "phases": [
        {
            "id": "phase-1",
            "name": "Foundation",
            "description": "Build foundation",
            "estimated_duration_months": 6,
            "milestones": [
                {
                    "id": "m-1-1",
                    "title": "Learn Azure",
                    "description": "Build Azure skills",
                    "category": "skill",
                    "priority": "critical",
                    "estimated_duration_months": 3,
                    "resources": ["Azure Solutions Architect Expert certification"],
                    "success_indicators": ["Pass exam"],
                    "skills_to_develop": ["Azure"],
                },
                {
                    "id": "m-1-2",
                    "title": "Get Azure Cert",
                    "description": "Earn the certification",
                    "category": "certification",
                    "priority": "high",
                    "estimated_duration_months": 2,
                    "resources": ["Azure Solutions Architect Expert certification"],
                    "success_indicators": ["Cert earned"],
                    "skills_to_develop": ["Azure"],
                },
            ],
            "status": "upcoming",
        }
    ],
    "critical_skills_to_develop": ["Azure"],
    "quick_wins": ["Start studying"],
    "potential_blockers": ["Time"],
}


class TestRoadmapCertificationExtraction:
    def test_certifications_extracted_for_skill_category_when_flag_true(self):
        """When include_certifications=True, skill-category milestones should also get certs."""
        from app.services.roadmap_service import RoadmapService

        db = MagicMock()
        service = RoadmapService(db)

        # Mock _extract_certifications to return a cert for any call
        mock_cert = MilestoneCertification(
            name="Azure Solutions Architect Expert",
            provider="Microsoft",
            url="https://learn.microsoft.com/test",
            difficulty_level="expert",
            estimated_cost_usd=165.0,
            estimated_hours=120,
        )

        with patch.object(service, "_extract_certifications", return_value=[mock_cert]) as mock_extract:
            user = _make_user()
            request = _make_request(include_certifications=True)

            response = service._build_response(user, request, SAMPLE_GPT_DATA, include_certifications=True)

            # _extract_certifications should be called for BOTH milestones
            assert mock_extract.call_count == 2

            # Both milestones should have certifications
            phase = response.phases[0]
            skill_milestone = phase.milestones[0]  # category=skill
            cert_milestone = phase.milestones[1]   # category=certification

            assert len(skill_milestone.certifications) > 0
            assert len(cert_milestone.certifications) > 0

    def test_certifications_not_extracted_when_flag_false(self):
        """When include_certifications=False, no milestones should get certs."""
        from app.services.roadmap_service import RoadmapService

        db = MagicMock()
        service = RoadmapService(db)

        with patch.object(service, "_extract_certifications") as mock_extract:
            user = _make_user()
            request = _make_request(include_certifications=False)

            response = service._build_response(user, request, SAMPLE_GPT_DATA, include_certifications=False)

            # _extract_certifications should NOT be called at all
            mock_extract.assert_not_called()

            # No milestones should have certifications
            for phase in response.phases:
                for milestone in phase.milestones:
                    assert len(milestone.certifications) == 0
