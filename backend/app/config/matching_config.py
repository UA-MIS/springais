"""
Matching Engine Configuration.

Simplified single-formula scoring based on research:
- Skills are the strongest predictor of job success (80%)
- Experience has low predictive validity but is still useful (10%)
- Role fit via embedding similarity captures holistic alignment (10%)

Reference: TestGorilla State of Skills-Based Hiring 2025, MSPB Research
"""

from enum import Enum
from dataclasses import dataclass
from typing import Dict


class MatchMode(str, Enum):
    """Match mode - kept for backwards compatibility but all use same weights."""
    BEST_FIT = "best_fit"
    STRETCH = "stretch"
    EXPLORATORY = "exploratory"


@dataclass
class ScoringWeights:
    """
    Weights for scoring components based on hiring research.

    - skill: 80% - Strongest predictor of job success
    - experience: 10% - Low validity (0.18 coefficient) but contextually useful
    - role_fit: 10% - Holistic alignment via embedding similarity
    """
    skill: float = 0.80
    experience: float = 0.10
    role_fit: float = 0.10

    def __post_init__(self):
        """Validate weights sum to 1.0."""
        total = self.skill + self.experience + self.role_fit
        if abs(total - 1.0) > 0.001:
            raise ValueError(f"Weights must sum to 1.0, got {total}")


# Single unified weights - no more mode-based differences
SCORING_WEIGHTS = ScoringWeights()


@dataclass
class MatchingConfig:
    """
    Configuration for the matching engine.

    Attributes:
        mode: Match mode (kept for backwards compatibility, same weights used)
        weights: Score component weights (unified across all modes)
        top_k: Number of top matches to return
        min_overall_score: Minimum overall score to include in results
        include_explanations: Whether to generate LLM explanations
        cache_ttl_seconds: Cache TTL for match results
    """
    mode: MatchMode
    weights: ScoringWeights
    top_k: int = 10
    min_overall_score: float = 0.0  # Show all matches, let UI filter
    include_explanations: bool = True
    cache_ttl_seconds: int = 3600  # 1 hour


def get_matching_config(
    mode: MatchMode = MatchMode.BEST_FIT,  # Kept for API compatibility
    top_k: int = 10,
    min_overall_score: float = 0.0,
    include_explanations: bool = True,
) -> MatchingConfig:
    """
    Get matching configuration.

    Note: mode parameter is kept for backwards compatibility but all modes
    now use the same unified scoring weights (80% skill, 10% experience, 10% role fit).

    Args:
        mode: Ignored - kept for API compatibility
        top_k: Number of top matches to return
        min_overall_score: Minimum overall score threshold
        include_explanations: Whether to include LLM explanations

    Returns:
        MatchingConfig instance with unified scoring weights
    """
    return MatchingConfig(
        mode=mode,
        weights=SCORING_WEIGHTS,
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
