"""Pydantic schemas for API request/response models."""

from .match_result import (
    SkillGapAnalysis,
    MatchScores,
    MatchResult,
    MatchResultDetail,
    EmployeeMatchesResponse,
    DetailedMatchResponse,
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
)

__all__ = [
    # Match result schemas
    "SkillGapAnalysis",
    "MatchScores",
    "MatchResult",
    "MatchResultDetail",
    "EmployeeMatchesResponse",
    "DetailedMatchResponse",
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
]
