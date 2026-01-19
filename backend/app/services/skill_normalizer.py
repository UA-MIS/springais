"""
Skill normalization service.

Normalizes skill names to canonical forms using:
1. Database taxonomy lookup
2. In-memory cache for performance
3. Deduplication logic
"""

import logging
from typing import List, Optional, Dict
from functools import lru_cache

from sqlalchemy.orm import Session

from app.models.skill_taxonomy import SkillTaxonomy, SEED_SKILLS
from app.schemas.skill import Skill

logger = logging.getLogger(__name__)


# ============================================
# In-Memory Skill Lookup Cache
# ============================================

class SkillNormalizerCache:
    """
    In-memory cache for skill normalization lookups.

    Builds a lookup table from alias → canonical_name for fast normalization.
    Falls back to database if cache miss.
    """

    def __init__(self):
        self._cache: Dict[str, Dict] = {}  # alias_lower → {canonical_name, category}
        self._initialized = False

    def initialize_from_seed(self):
        """Initialize cache from seed data (no database required)."""
        for skill in SEED_SKILLS:
            canonical = skill["canonical_name"]
            category = skill["category"]

            # Add canonical name
            self._cache[canonical.lower()] = {
                "canonical_name": canonical,
                "category": category
            }

            # Add all aliases
            for alias in skill.get("aliases", []):
                self._cache[alias.lower()] = {
                    "canonical_name": canonical,
                    "category": category
                }

        self._initialized = True
        logger.info(f"Skill normalizer cache initialized with {len(self._cache)} entries")

    def initialize_from_db(self, db: Session):
        """Initialize cache from database."""
        taxonomies = db.query(SkillTaxonomy).all()

        for taxonomy in taxonomies:
            canonical = taxonomy.canonical_name
            category = taxonomy.category

            # Add canonical name
            self._cache[canonical.lower()] = {
                "canonical_name": canonical,
                "category": category
            }

            # Add all aliases
            for alias in taxonomy.aliases or []:
                self._cache[alias.lower()] = {
                    "canonical_name": canonical,
                    "category": category
                }

        self._initialized = True
        logger.info(f"Skill normalizer cache initialized from DB with {len(self._cache)} entries")

    def lookup(self, skill_name: str) -> Optional[Dict]:
        """
        Look up a skill in the cache.

        Args:
            skill_name: Skill name to look up

        Returns:
            Dict with canonical_name and category, or None if not found
        """
        if not self._initialized:
            self.initialize_from_seed()

        return self._cache.get(skill_name.lower().strip())

    def add(self, skill_name: str, canonical_name: str, category: str):
        """Add a skill mapping to the cache."""
        self._cache[skill_name.lower().strip()] = {
            "canonical_name": canonical_name,
            "category": category
        }

    @property
    def is_initialized(self) -> bool:
        return self._initialized


# Global cache instance
_normalizer_cache = SkillNormalizerCache()


def get_normalizer_cache() -> SkillNormalizerCache:
    """Get the global normalizer cache, initializing if needed."""
    if not _normalizer_cache.is_initialized:
        _normalizer_cache.initialize_from_seed()
    return _normalizer_cache


# ============================================
# Normalization Functions
# ============================================

def normalize_skill(
    skill_name: str,
    db: Session = None
) -> str:
    """
    Normalize a skill name to its canonical form.

    Args:
        skill_name: Skill name to normalize
        db: Optional database session for taxonomy lookup

    Returns:
        Canonical skill name, or original if not found in taxonomy

    Examples:
        normalize_skill("Javascript") → "JavaScript"
        normalize_skill("ML") → "Machine Learning"
        normalize_skill("py") → "Python"
    """
    if not skill_name:
        return ""

    skill_name = skill_name.strip()
    cache = get_normalizer_cache()

    # Try cache lookup first
    result = cache.lookup(skill_name)
    if result:
        return result["canonical_name"]

    # Try database lookup if session provided
    if db:
        taxonomy = db.query(SkillTaxonomy).filter(
            SkillTaxonomy.canonical_name.ilike(skill_name)
        ).first()

        if taxonomy:
            cache.add(skill_name, taxonomy.canonical_name, taxonomy.category)
            return taxonomy.canonical_name

        # Check aliases in database (more expensive)
        # Note: This requires JSON search which varies by database
        # For now, rely on cache for aliases

    # Log unknown skill for review
    logger.debug(f"Unknown skill (not in taxonomy): {skill_name}")

    # Return original with title case as fallback
    return skill_name.title() if skill_name.islower() else skill_name


def normalize_skill_with_category(
    skill_name: str,
    db: Session = None
) -> tuple:
    """
    Normalize skill and return both canonical name and category.

    Args:
        skill_name: Skill name to normalize
        db: Optional database session

    Returns:
        Tuple of (canonical_name, category or None)
    """
    if not skill_name:
        return ("", None)

    skill_name = skill_name.strip()
    cache = get_normalizer_cache()

    result = cache.lookup(skill_name)
    if result:
        return (result["canonical_name"], result["category"])

    # Fallback
    return (skill_name.title() if skill_name.islower() else skill_name, None)


# ============================================
# Skill Deduplication
# ============================================

def deduplicate_skills(
    skills: List[Skill],
    normalize: bool = True,
    db: Session = None
) -> List[Skill]:
    """
    Deduplicate skills, keeping highest proficiency for duplicates.

    Args:
        skills: List of skills to deduplicate
        normalize: Whether to normalize skill names
        db: Optional database session for normalization

    Returns:
        Deduplicated list of skills

    Example:
        Input: [
            Skill(name="Python", proficiency="intermediate"),
            Skill(name="python", proficiency="advanced"),
            Skill(name="JavaScript", proficiency="beginner")
        ]
        Output: [
            Skill(name="Python", proficiency="advanced"),
            Skill(name="JavaScript", proficiency="beginner")
        ]
    """
    if not skills:
        return []

    proficiency_order = {
        "beginner": 0,
        "intermediate": 1,
        "advanced": 2,
        "expert": 3
    }

    skill_map: Dict[str, Skill] = {}

    for skill in skills:
        # Normalize if requested
        if normalize:
            normalized_name = normalize_skill(skill.name, db)
        else:
            normalized_name = skill.name

        key = normalized_name.lower()

        if key not in skill_map:
            # First occurrence - update name to normalized form
            skill_map[key] = Skill(
                name=normalized_name,
                category=skill.category,
                proficiency=skill.proficiency,
                years_experience=skill.years_experience
            )
        else:
            # Duplicate - keep higher proficiency
            existing = skill_map[key]
            existing_level = proficiency_order.get(existing.proficiency, 0)
            new_level = proficiency_order.get(skill.proficiency, 0)

            if new_level > existing_level:
                skill_map[key] = Skill(
                    name=normalized_name,
                    category=skill.category,
                    proficiency=skill.proficiency,
                    years_experience=skill.years_experience or existing.years_experience
                )
            elif skill.years_experience and not existing.years_experience:
                # Keep years experience if new skill has it
                existing.years_experience = skill.years_experience

    return list(skill_map.values())


def normalize_and_deduplicate(
    skills: List[Skill],
    db: Session = None
) -> List[Skill]:
    """
    Convenience function to normalize and deduplicate skills in one call.

    Args:
        skills: List of skills to process
        db: Optional database session

    Returns:
        Normalized and deduplicated list of skills
    """
    return deduplicate_skills(skills, normalize=True, db=db)


# ============================================
# Skill Categorization
# ============================================

def categorize_skills(skills: List[Skill]) -> Dict[str, List[str]]:
    """
    Group skills by category.

    Args:
        skills: List of skills

    Returns:
        Dict mapping category to list of skill names
    """
    categories = {
        "technical": [],
        "soft": [],
        "domain": [],
        "certification": []
    }

    for skill in skills:
        category = skill.category
        if category in categories:
            categories[category].append(skill.name)
        else:
            # Default to technical if unknown category
            categories["technical"].append(skill.name)

    return categories


# ============================================
# Database Seeding
# ============================================

def seed_skill_taxonomy(db: Session) -> int:
    """
    Seed the skill_taxonomy table with initial data.

    Args:
        db: Database session

    Returns:
        Number of skills seeded
    """
    count = 0

    for skill_data in SEED_SKILLS:
        # Check if already exists
        existing = db.query(SkillTaxonomy).filter(
            SkillTaxonomy.canonical_name == skill_data["canonical_name"]
        ).first()

        if existing:
            # Update aliases if needed
            existing.aliases = skill_data.get("aliases", [])
            existing.category = skill_data["category"]
        else:
            # Create new
            taxonomy = SkillTaxonomy(
                canonical_name=skill_data["canonical_name"],
                category=skill_data["category"],
                aliases=skill_data.get("aliases", [])
            )
            db.add(taxonomy)
            count += 1

    db.commit()
    logger.info(f"Seeded {count} new skills to taxonomy")

    # Refresh cache
    _normalizer_cache.initialize_from_db(db)

    return count


def get_taxonomy_stats(db: Session) -> Dict:
    """
    Get statistics about the skill taxonomy.

    Args:
        db: Database session

    Returns:
        Dict with taxonomy statistics
    """
    total = db.query(SkillTaxonomy).count()

    categories = {}
    for category in ["technical", "soft", "domain", "certification"]:
        categories[category] = db.query(SkillTaxonomy).filter(
            SkillTaxonomy.category == category
        ).count()

    return {
        "total_skills": total,
        "categories": categories
    }
