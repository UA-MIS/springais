"""
Matching Engine Configuration.

Defines weights, thresholds, and settings for the three matching modes:
- Best Fit: Conservative matches (90%+ skill match)
- Stretch: Ambitious matches (70-85% skill match)
- Exploratory: Career pivot opportunities (50-70% skill match)
"""

from enum import Enum
from dataclasses import dataclass
from typing import Dict


class MatchMode(str, Enum):
    """Match mode determines scoring weights and thresholds."""
    BEST_FIT = "best_fit"
    STRETCH = "stretch"
    EXPLORATORY = "exploratory"


@dataclass
class ModeWeights:
    """Weights for each scoring component in a match mode."""
    skill: float
    experience: float
    growth: float

    def __post_init__(self):
        """Validate weights sum to 1.0."""
        total = self.skill + self.experience + self.growth
        if abs(total - 1.0) > 0.001:
            raise ValueError(f"Weights must sum to 1.0, got {total}")


@dataclass
class SkillMatchThreshold:
    """Skill match score thresholds for a match mode."""
    min_score: float
    max_score: float
    description: str


# Mode weights as defined in CONTEXT.md
MODE_WEIGHTS: Dict[MatchMode, ModeWeights] = {
    MatchMode.BEST_FIT: ModeWeights(
        skill=0.6,
        experience=0.3,
        growth=0.1
    ),
    MatchMode.STRETCH: ModeWeights(
        skill=0.4,
        experience=0.3,
        growth=0.3
    ),
    MatchMode.EXPLORATORY: ModeWeights(
        skill=0.3,
        experience=0.2,
        growth=0.5
    ),
}

# Skill match thresholds per mode
SKILL_MATCH_THRESHOLDS: Dict[MatchMode, SkillMatchThreshold] = {
    MatchMode.BEST_FIT: SkillMatchThreshold(
        min_score=0.90,
        max_score=1.0,
        description="High skill overlap (90-100%)"
    ),
    MatchMode.STRETCH: SkillMatchThreshold(
        min_score=0.70,
        max_score=0.85,
        description="Moderate skill overlap (70-85%)"
    ),
    MatchMode.EXPLORATORY: SkillMatchThreshold(
        min_score=0.0,
        max_score=0.70,
        description="Lower skill overlap (50-70%)"
    ),
}


@dataclass
class MatchingConfig:
    """
    Complete configuration for the matching engine.

    Attributes:
        mode: The matching mode (best_fit, stretch, exploratory)
        weights: Score component weights for this mode
        skill_threshold: Skill match score thresholds
        top_k: Number of top matches to return
        min_overall_score: Minimum overall score to include in results
        include_explanations: Whether to generate LLM explanations
        cache_ttl_seconds: Cache TTL for match results
    """
    mode: MatchMode
    weights: ModeWeights
    skill_threshold: SkillMatchThreshold
    top_k: int = 10
    min_overall_score: float = 0.5
    include_explanations: bool = True
    cache_ttl_seconds: int = 3600  # 1 hour


def get_matching_config(
    mode: MatchMode = MatchMode.BEST_FIT,
    top_k: int = 10,
    min_overall_score: float = 0.5,
    include_explanations: bool = True,
) -> MatchingConfig:
    """
    Get matching configuration for a specific mode.

    Args:
        mode: The matching mode to use
        top_k: Number of top matches to return
        min_overall_score: Minimum overall score threshold
        include_explanations: Whether to include LLM explanations

    Returns:
        MatchingConfig instance configured for the specified mode

    Example:
        >>> config = get_matching_config(MatchMode.STRETCH, top_k=20)
        >>> config.weights.skill
        0.4
        >>> config.skill_threshold.min_score
        0.70
    """
    return MatchingConfig(
        mode=mode,
        weights=MODE_WEIGHTS[mode],
        skill_threshold=SKILL_MATCH_THRESHOLDS[mode],
        top_k=top_k,
        min_overall_score=min_overall_score,
        include_explanations=include_explanations,
    )


# Role level hierarchy for transition validation
ROLE_LEVELS = {
    # Consulting roles
    "Analyst": 1,
    "Associate": 2,
    "Senior Associate": 3,
    "Consultant": 4,
    "Senior Consultant": 5,
    "Manager": 6,
    "Senior Manager": 7,
    "Director": 8,
    "Partner": 9,
    # Assurance roles
    "Staff": 1,
    "Senior": 2,
    # Tax roles map to same levels
}

# Valid role transitions (from_level -> [valid_to_levels])
# Allows promotion (+1 or +2), lateral (0), or minor step-back (-1)
VALID_TRANSITION_DELTAS = [-1, 0, 1, 2]


def is_valid_role_transition(from_level: int, to_level: int) -> bool:
    """
    Check if a role transition is valid.

    Args:
        from_level: Current role level (1-9)
        to_level: Target role level (1-9)

    Returns:
        True if transition is valid (promotion, lateral, or minor step-back)

    Example:
        >>> is_valid_role_transition(5, 6)  # Promotion
        True
        >>> is_valid_role_transition(5, 5)  # Lateral
        True
        >>> is_valid_role_transition(5, 3)  # Big step-back
        False
    """
    delta = to_level - from_level
    return delta in VALID_TRANSITION_DELTAS
