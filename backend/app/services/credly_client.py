"""
Credly API Client (Phase C, requires enterprise auth).

ADR-002: Second external API integration.
Endpoint: https://api.credly.com/v1/
"""

import logging
from typing import List, Optional

import requests

logger = logging.getLogger(__name__)

BASE_URL = "https://api.credly.com/v1/"
REQUEST_TIMEOUT = 15


class CredlyClient:
    """
    Client for Credly API (Phase C, requires enterprise auth).

    Requires:
    - api_token: Credly enterprise API token
    - organization_id: The EY organization ID on Credly
    """

    def __init__(self, api_token: str, organization_id: str):
        self.api_token = api_token
        self.organization_id = organization_id
        self._session = requests.Session()
        self._session.headers.update({
            "Authorization": f"Basic {api_token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        })

    def get_badge_templates(
        self,
        skills: Optional[List[str]] = None,
        state: str = "active",
        page: int = 1,
        per_page: int = 50,
    ) -> List[dict]:
        """
        Fetch badge templates from Credly org.

        Args:
            skills: Optional skill keywords to filter by
            state: Badge state (active, archived, etc.)
            page: Page number
            per_page: Results per page (max 50)

        Returns:
            List of normalized badge template dicts.
        """
        try:
            url = f"{BASE_URL}organizations/{self.organization_id}/badge_templates"
            params = {
                "filter": f"state::{state}",
                "page": page,
                "page_size": per_page,
            }

            # Add skill filter if provided
            if skills:
                params["filter"] += f",skills::{'|'.join(skills)}"

            response = self._session.get(url, params=params, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            data = response.json()

            templates = data.get("data", [])
            return [self._normalize_template(t) for t in templates]

        except requests.RequestException as e:
            logger.warning(f"Credly API request failed: {e}")
            return []
        except Exception as e:
            logger.error(f"Credly API unexpected error: {e}")
            return []

    def get_badge_template(self, template_id: str) -> Optional[dict]:
        """Fetch single badge template by ID."""
        try:
            url = f"{BASE_URL}organizations/{self.organization_id}/badge_templates/{template_id}"
            response = self._session.get(url, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            data = response.json()
            return self._normalize_template(data.get("data", {}))

        except requests.RequestException as e:
            logger.warning(f"Credly API template fetch failed: {e}")
            return None

    def _normalize_template(self, template: dict) -> dict:
        """Normalize Credly badge template to our standard format."""
        template_id = template.get("id", "unknown")
        vanity_slug = template.get("vanity_slug", template_id)

        # Build the public badge URL using vanity slug
        url = f"https://www.credly.com/org/ey/badge/{vanity_slug}"

        # Extract skills from template
        skills = []
        for skill in template.get("skills", []):
            if isinstance(skill, dict):
                skills.append(skill.get("name", "").lower())
            elif isinstance(skill, str):
                skills.append(skill.lower())

        # Map Credly difficulty levels
        difficulty = template.get("level", "intermediate")
        if difficulty not in ("beginner", "intermediate", "advanced", "expert"):
            difficulty = "intermediate"

        return {
            "external_id": str(template_id),
            "name": template.get("name", "Unknown Badge"),
            "issuer": template.get("issuer", {}).get("name", "EY") if isinstance(template.get("issuer"), dict) else "EY",
            "platform": "credly",
            "url": url,
            "image_url": template.get("image_url"),
            "skills": skills,
            "difficulty_level": difficulty,
            "estimated_cost_usd": 0.0,  # EY badges are typically free for employees
            "estimated_hours": None,
            "renewal_months": None,
        }
