"""Pydantic schemas for API request/response models."""

from .match_result import (
    SkillGapAnalysis,
    MatchScores,
    MatchResult,
    MatchResultDetail,
    EmployeeMatchesResponse,
    DetailedMatchResponse,
    MatchSaveRequest,
)

from .auth import (
    RegisterRequest,
    LoginRequest,
    AuthResponse,
    UserResponse,
)

from .skill import (
    Skill,
    SkillList,
    SkillCategory,
    ProficiencyLevel,
    SkillExtractionRequest,
    SkillExtractionResponse,
    ResumeUploadResponse,
    EmployeeSkillsUpdate,
    SkillTaxonomyEntry,
    SkillTaxonomyResponse,
    SkillRecommendationItem,
    SkillRecommendationsResponse,
)

__all__ = [
    # Match result schemas
    "SkillGapAnalysis",
    "MatchScores",
    "MatchResult",
    "MatchResultDetail",
    "EmployeeMatchesResponse",
    "DetailedMatchResponse",
    "MatchSaveRequest",
    # Skill schemas
    "Skill",
    "SkillList",
    "SkillCategory",
    "ProficiencyLevel",
    "SkillExtractionRequest",
    "SkillExtractionResponse",
    "ResumeUploadResponse",
    "EmployeeSkillsUpdate",
    "SkillTaxonomyEntry",
    "SkillTaxonomyResponse",
    "SkillRecommendationItem",
    "SkillRecommendationsResponse",
    "RegisterRequest",
    "LoginRequest",
    "AuthResponse",
    "UserResponse",
]
