"""
Microsoft Learn Catalog API Client (ADR-002).

Free, public, no auth required. Fetches certifications from the Microsoft Learn catalog.
Endpoint: https://learn.microsoft.com/api/catalog/
"""

import logging
from typing import List, Optional

import requests

logger = logging.getLogger(__name__)

BASE_URL = "https://learn.microsoft.com/api/catalog/"
REQUEST_TIMEOUT = 15


class MicrosoftLearnClient:
    """
    Client for Microsoft Learn Catalog API (free, no auth).

    ADR-002: First external API integration.
    """

    def __init__(self):
        self._session = requests.Session()
        self._session.headers.update({
            "Accept": "application/json",
        })

    def get_certifications(
        self,
        skills: Optional[List[str]] = None,
        level: Optional[str] = None,
        role: Optional[str] = None,
    ) -> List[dict]:
        """
        Fetch certifications from MS Learn Catalog API.

        Args:
            skills: Filter by skill keywords (searches title, skills_gained)
            level: Filter by level (beginner, intermediate, advanced)
            role: Filter by role (e.g., "developer", "administrator")

        Returns:
            List of certification dicts with standardized fields.
        """
        try:
            params = {"type": "mergedCertifications"}
            if role:
                params["roles"] = role
            if level:
                params["levels"] = level

            response = self._session.get(
                BASE_URL,
                params=params,
                timeout=REQUEST_TIMEOUT,
            )
            response.raise_for_status()
            data = response.json()

            certs = data.get("certifications", [])

            # Filter by skills if provided
            if skills:
                skills_lower = [s.lower() for s in skills]
                filtered = []
                for cert in certs:
                    cert_title_lower = cert.get("title", "").lower()
                    cert_skills = [s.lower() for s in cert.get("skills_gained", [])]
                    cert_products = [p.lower() for p in cert.get("products", [])]

                    # Check if any skill matches title, skills_gained, or products
                    for skill in skills_lower:
                        if (
                            skill in cert_title_lower
                            or any(skill in cs for cs in cert_skills)
                            or any(skill in cp for cp in cert_products)
                        ):
                            filtered.append(cert)
                            break

                certs = filtered

            return [self._normalize_cert(c) for c in certs]

        except requests.RequestException as e:
            logger.warning(f"Microsoft Learn API request failed: {e}")
            return []
        except Exception as e:
            logger.error(f"Microsoft Learn API unexpected error: {e}")
            return []

    def get_full_catalog(self) -> List[dict]:
        """
        Fetch entire certification catalog for refresh job.

        Returns:
            List of all certification dicts.
        """
        try:
            response = self._session.get(
                BASE_URL,
                params={"type": "mergedCertifications"},
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()

            certs = data.get("certifications", [])
            return [self._normalize_cert(c) for c in certs]

        except requests.RequestException as e:
            logger.warning(f"Microsoft Learn full catalog fetch failed: {e}")
            return []

    def _normalize_cert(self, cert: dict) -> dict:
        """Normalize MS Learn cert data to our standard format."""
        uid = cert.get("uid", cert.get("certification_type", "unknown"))

        # Map MS Learn levels to our difficulty levels
        level_map = {
            "beginner": "beginner",
            "intermediate": "intermediate",
            "advanced": "advanced",
        }
        ms_level = ""
        levels = cert.get("levels", [])
        if levels:
            ms_level = levels[0].lower() if isinstance(levels[0], str) else ""

        difficulty = level_map.get(ms_level, "intermediate")

        # Build URL
        url = cert.get("url", "")
        if url and not url.startswith("http"):
            url = f"https://learn.microsoft.com{url}"

        # Extract skills
        skills = cert.get("skills_gained", []) + cert.get("products", [])

        return {
            "external_id": uid,
            "name": cert.get("title", "Unknown Certification"),
            "issuer": "Microsoft",
            "platform": "microsoft",
            "url": url,
            "image_url": cert.get("icon_url"),
            "skills": [s.lower() for s in skills if s],
            "difficulty_level": difficulty,
            "estimated_cost_usd": 165.0,  # Standard MS cert exam price
            "estimated_hours": None,
            "renewal_months": 12,
        }
