"""
Badge Discovery Service with Multi-Source Matching Engine.

Matching pipeline (ADR-001):
  1. Curated catalog (confidence=1.0)
  2. Microsoft Learn API (confidence=0.7-0.9)
  3. Credly API (Phase C, confidence=0.7-0.9)
  4. Keyword matching (confidence=0.4-0.6)
  5. AI semantic matching (Phase D, confidence=0.3-0.5)

Architecture Section 2.1.
"""

import hashlib
import json
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.badge import BadgeCatalog, BadgeSkillMapping

logger = logging.getLogger(__name__)


# ============================================
# Data Classes
# ============================================

@dataclass
class ScoredBadge:
    """A badge with a relevance score from a matcher."""
    external_id: str
    platform: str
    name: str
    issuer: str
    url: str
    image_url: Optional[str] = None
    skills: List[str] = field(default_factory=list)
    difficulty_level: Optional[str] = None
    estimated_cost_usd: Optional[float] = None
    estimated_hours: Optional[int] = None
    renewal_months: Optional[int] = None
    relevance_score: float = 0.0
    mapping_source: str = "curated"
    # Internal ID from badge_catalog (may be None for API-only results)
    catalog_id: Optional[str] = None


# ============================================
# Abstract Matcher
# ============================================

class BadgeMatcher(ABC):
    """Abstract base for matching strategies."""

    @abstractmethod
    async def find_matches(self, skills: List[str]) -> List[ScoredBadge]:
        """Return scored badge matches for given skills."""


# ============================================
# Concrete Matchers
# ============================================

class CuratedMatcher(BadgeMatcher):
    """Queries badge_skill_mapping where source='curated'. Confidence=1.0."""

    def __init__(self, db: Session):
        self.db = db

    async def find_matches(self, skills: List[str]) -> List[ScoredBadge]:
        skills_lower = [s.lower().strip() for s in skills]

        results = (
            self.db.query(BadgeCatalog, BadgeSkillMapping.mapping_confidence)
            .join(BadgeSkillMapping, BadgeCatalog.id == BadgeSkillMapping.badge_id)
            .filter(
                BadgeSkillMapping.skill_name.in_(skills_lower),
                BadgeSkillMapping.source == "curated",
                BadgeCatalog.is_active == True,
            )
            .all()
        )

        scored = []
        for badge, confidence in results:
            scored.append(ScoredBadge(
                external_id=badge.external_id,
                platform=badge.platform,
                name=badge.name,
                issuer=badge.issuer,
                url=badge.url,
                image_url=badge.image_url,
                skills=badge.skills or [],
                difficulty_level=badge.difficulty_level,
                estimated_cost_usd=badge.estimated_cost_usd,
                estimated_hours=badge.estimated_hours,
                renewal_months=badge.renewal_months,
                relevance_score=confidence,
                mapping_source="curated",
                catalog_id=str(badge.id),
            ))

        return scored


class MicrosoftLearnMatcher(BadgeMatcher):
    """Queries Microsoft Learn Catalog API by skill keywords. Confidence=0.7-0.9."""

    def __init__(self):
        from app.services.microsoft_learn_client import MicrosoftLearnClient
        self._client = MicrosoftLearnClient()

    async def find_matches(self, skills: List[str]) -> List[ScoredBadge]:
        try:
            certs = self._client.get_certifications(skills=skills)
        except Exception as e:
            logger.warning(f"MicrosoftLearnMatcher failed: {e}")
            return []

        scored = []
        for cert in certs:
            # Score based on how many queried skills match
            cert_skills_lower = [s.lower() for s in cert.get("skills", [])]
            skills_lower = [s.lower() for s in skills]
            matches = sum(1 for s in skills_lower if any(s in cs for cs in cert_skills_lower))
            base_confidence = 0.7
            if matches > 0:
                base_confidence = min(0.7 + (matches * 0.05), 0.9)

            scored.append(ScoredBadge(
                external_id=cert["external_id"],
                platform="microsoft",
                name=cert["name"],
                issuer="Microsoft",
                url=cert["url"],
                image_url=cert.get("image_url"),
                skills=cert.get("skills", []),
                difficulty_level=cert.get("difficulty_level"),
                estimated_cost_usd=cert.get("estimated_cost_usd"),
                estimated_hours=cert.get("estimated_hours"),
                renewal_months=cert.get("renewal_months"),
                relevance_score=base_confidence,
                mapping_source="api",
            ))

        return scored


class KeywordMatcher(BadgeMatcher):
    """
    Normalized keyword matching against badge_catalog.skills array.
    Case-insensitive, abbreviation expansion. Confidence=0.4-0.6.
    """

    # Common abbreviation expansions
    ABBREVIATIONS = {
        "js": "javascript",
        "ts": "typescript",
        "py": "python",
        "ml": "machine learning",
        "ai": "artificial intelligence",
        "db": "database",
        "k8s": "kubernetes",
        "tf": "terraform",
        "gcp": "google cloud",
        "aws": "amazon web services",
    }

    def __init__(self, db: Session):
        self.db = db

    async def find_matches(self, skills: List[str]) -> List[ScoredBadge]:
        # Expand abbreviations
        expanded_skills = set()
        for skill in skills:
            skill_lower = skill.lower().strip()
            expanded_skills.add(skill_lower)
            if skill_lower in self.ABBREVIATIONS:
                expanded_skills.add(self.ABBREVIATIONS[skill_lower])

        # Query all active badges
        badges = (
            self.db.query(BadgeCatalog)
            .filter(BadgeCatalog.is_active == True)
            .all()
        )

        scored = []
        for badge in badges:
            badge_skills_lower = [s.lower() for s in (badge.skills or [])]
            badge_name_lower = badge.name.lower()

            # Count matching skills using substring matching
            matching = 0
            for skill in expanded_skills:
                # Exact match in skills list or substring match in name
                if skill in badge_skills_lower or skill in badge_name_lower:
                    matching += 1
                # Substring match (min 3 chars to avoid false positives):
                # skill appears within any badge skill, or vice versa
                elif len(skill) >= 3 and any(skill in bs or bs in skill for bs in badge_skills_lower):
                    matching += 1

            if matching > 0:
                # Confidence: 0.4 base + up to 0.2 based on match ratio
                confidence = 0.4 + (0.2 * min(matching / max(len(expanded_skills), 1), 1.0))
                scored.append(ScoredBadge(
                    external_id=badge.external_id,
                    platform=badge.platform,
                    name=badge.name,
                    issuer=badge.issuer,
                    url=badge.url,
                    image_url=badge.image_url,
                    skills=badge.skills or [],
                    difficulty_level=badge.difficulty_level,
                    estimated_cost_usd=badge.estimated_cost_usd,
                    estimated_hours=badge.estimated_hours,
                    renewal_months=badge.renewal_months,
                    relevance_score=confidence,
                    mapping_source="keyword",
                    catalog_id=str(badge.id),
                ))

        return scored


# ============================================
# Matching Engine
# ============================================

class BadgeMatchingEngine:
    """
    Extensible matching engine (FR-2.4).
    Matchers are tried in priority order; results are merged and deduplicated.
    """

    def __init__(self, db: Session, include_external_apis: bool = True):
        self.matchers: List[BadgeMatcher] = [
            CuratedMatcher(db),
        ]

        if include_external_apis:
            self.matchers.append(MicrosoftLearnMatcher())

        self.matchers.append(KeywordMatcher(db))
        # CredlyMatcher() - Phase C
        # SemanticMatcher() - Phase D

    async def match(self, skills: List[str]) -> List[ScoredBadge]:
        """Run all matchers, merge, deduplicate by external_id+platform, sort by relevance_score desc."""
        all_results: List[ScoredBadge] = []

        for matcher in self.matchers:
            try:
                results = await matcher.find_matches(skills)
                all_results.extend(results)
            except Exception as e:
                logger.warning(f"Matcher {matcher.__class__.__name__} failed: {e}")

        # Deduplicate: keep highest score per external_id+platform
        seen = {}
        for badge in all_results:
            key = f"{badge.platform}:{badge.external_id}"
            if key not in seen or badge.relevance_score > seen[key].relevance_score:
                seen[key] = badge

        # Sort by relevance_score descending
        deduped = sorted(seen.values(), key=lambda b: b.relevance_score, reverse=True)

        # Filter below threshold (FR-2.5)
        return [b for b in deduped if b.relevance_score >= 0.3]


# ============================================
# Discovery Service
# ============================================

class BadgeDiscoveryService:
    """
    Multi-source badge discovery with caching and relevance ranking.

    Architecture Section 2.1.
    """

    def __init__(self, db: Session):
        self.db = db
        self._engine = BadgeMatchingEngine(db)

    async def discover_badges(
        self,
        skills: List[str],
        page: int = 1,
        per_page: int = 20,
    ) -> dict:
        """
        Discover relevant badges for given skills.

        Returns dict with badges, total_count, page, per_page, skills_queried.
        """
        # TODO: Phase B - Add Redis cache check here

        results = await self._engine.match(skills)

        total_count = len(results)

        # Paginate
        start = (page - 1) * per_page
        end = start + per_page
        page_results = results[start:end]

        return {
            "badges": page_results,
            "total_count": total_count,
            "page": page,
            "per_page": per_page,
            "skills_queried": skills,
        }

    async def get_badge_by_id(self, badge_id: str) -> Optional[BadgeCatalog]:
        """Get a single badge by internal catalog ID."""
        return self.db.query(BadgeCatalog).filter(
            BadgeCatalog.id == badge_id
        ).first()

    async def get_badges_for_skills(
        self,
        skills: List[str],
        limit: int = 20,
    ) -> List[ScoredBadge]:
        """
        Get top badges for a list of skills (used by roadmap service).
        Lightweight: catalog-only, no external APIs, no pagination.
        """
        engine = BadgeMatchingEngine(self.db, include_external_apis=False)
        results = await engine.match(skills)
        return results[:limit]

    async def search_catalog(
        self,
        query: str,
        limit: int = 10,
    ) -> List[BadgeCatalog]:
        """Search badge catalog by name (for autocomplete)."""
        query_safe = query.replace("%", r"\%").replace("_", r"\_")
        return (
            self.db.query(BadgeCatalog)
            .filter(
                BadgeCatalog.is_active == True,
                BadgeCatalog.name.ilike(f"%{query_safe}%", escape="\\"),
            )
            .limit(limit)
            .all()
        )

    async def refresh_catalog(self, source: str = "microsoft") -> int:
        """
        Refresh catalog from external source. Called by background jobs.
        Returns number of badges added/updated.
        """
        if source == "microsoft":
            return await self._refresh_microsoft_catalog()
        return 0

    async def _refresh_microsoft_catalog(self) -> int:
        """Pull full Microsoft Learn certification catalog and upsert."""
        from app.services.microsoft_learn_client import MicrosoftLearnClient
        from datetime import datetime, timezone

        client = MicrosoftLearnClient()
        certs = client.get_full_catalog()

        if not certs:
            logger.warning("Microsoft Learn catalog refresh returned no certs")
            return 0

        count = 0
        now = datetime.now(timezone.utc)

        for cert in certs:
            existing = self.db.query(BadgeCatalog).filter(
                BadgeCatalog.platform == "microsoft",
                BadgeCatalog.external_id == cert["external_id"],
            ).first()

            if existing:
                existing.name = cert["name"]
                existing.url = cert["url"]
                existing.image_url = cert.get("image_url")
                existing.skills = cert.get("skills", [])
                existing.difficulty_level = cert.get("difficulty_level")
                existing.is_active = True
                existing.last_refreshed_at = now
            else:
                badge = BadgeCatalog(
                    external_id=cert["external_id"],
                    name=cert["name"],
                    issuer="Microsoft",
                    platform="microsoft",
                    url=cert["url"],
                    image_url=cert.get("image_url"),
                    skills=cert.get("skills", []),
                    difficulty_level=cert.get("difficulty_level"),
                    estimated_cost_usd=cert.get("estimated_cost_usd", 165.0),
                    renewal_months=cert.get("renewal_months", 12),
                    is_active=True,
                    last_refreshed_at=now,
                )
                self.db.add(badge)
                self.db.flush()

                # Create skill mappings from cert skills
                for skill in cert.get("skills", []):
                    skill_lower = skill.lower().strip()
                    if skill_lower:
                        mapping = BadgeSkillMapping(
                            badge_id=badge.id,
                            skill_name=skill_lower,
                            mapping_confidence=0.8,
                            source="api",
                        )
                        self.db.add(mapping)

                count += 1

        self.db.commit()
        logger.info(f"Microsoft Learn catalog refresh: {count} new badges added")
        return count
