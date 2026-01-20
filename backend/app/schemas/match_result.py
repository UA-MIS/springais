"""
Pydantic schemas for match results.

These schemas define the API response format for matching endpoints.
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum


class MatchModeEnum(str, Enum):
    """Match mode for API requests."""
    BEST_FIT = "best_fit"
    STRETCH = "stretch"
    EXPLORATORY = "exploratory"


class SkillGapAnalysis(BaseModel):
    """Analysis of skill gaps between employee and job."""

    overlapping_skills: List[str] = Field(
        default_factory=list,
        description="Skills the employee has that match job requirements"
    )
    missing_skills: List[str] = Field(
        default_factory=list,
        description="Required skills the employee lacks"
    )
    transferable_skills: List[str] = Field(
        default_factory=list,
        description="Employee skills that could transfer to this role"
    )
    gap_count: int = Field(
        default=0,
        description="Number of missing required skills"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "overlapping_skills": ["Python", "AWS", "Data Analysis"],
                "missing_skills": ["Kubernetes", "Terraform"],
                "transferable_skills": ["SQL", "Leadership"],
                "gap_count": 2
            }
        }


class MatchScores(BaseModel):
    """Individual score components for a match."""

    skill_match: float = Field(
        ge=0.0, le=1.0,
        description="Semantic skill similarity score (0-1)"
    )
    experience_match: float = Field(
        ge=0.0, le=1.0,
        description="Experience level alignment score (0-1)"
    )
    growth_potential: float = Field(
        ge=0.0, le=1.0,
        description="Career growth opportunity score (0-1)"
    )
    overall: float = Field(
        ge=0.0, le=1.0,
        description="Weighted overall match score (0-1)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "skill_match": 0.85,
                "experience_match": 0.92,
                "growth_potential": 0.65,
                "overall": 0.83
            }
        }


class MatchResult(BaseModel):
    """Summary match result for list display."""

    job_id: int = Field(description="Job posting ID")
    title: str = Field(description="Job title")
    department: str = Field(description="Department name")
    service_line: str = Field(description="Service line (Consulting, Assurance, Tax)")
    location: str = Field(description="Job location")
    scores: MatchScores = Field(description="Match score breakdown")
    gap_analysis: SkillGapAnalysis = Field(description="Skill gap analysis")
    match_mode: MatchModeEnum = Field(description="Mode used for this match")
    explanation: Optional[str] = Field(
        default=None,
        description="LLM-generated explanation of why this job matches"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": 42,
                "title": "Senior Data Scientist",
                "department": "Technology",
                "service_line": "Consulting",
                "location": "New York",
                "scores": {
                    "skill_match": 0.85,
                    "experience_match": 0.92,
                    "growth_potential": 0.65,
                    "overall": 0.83
                },
                "gap_analysis": {
                    "overlapping_skills": ["Python", "AWS"],
                    "missing_skills": ["Kubernetes"],
                    "transferable_skills": ["SQL"],
                    "gap_count": 1
                },
                "match_mode": "best_fit",
                "explanation": "This role is an excellent fit based on your Python and AWS expertise."
            }
        }


class MatchSaveRequest(BaseModel):
    """Request to save a match for a user."""

    employee_id: str = Field(..., description="Employee identifier")
    job_posting_id: str = Field(..., description="Job posting identifier")
    match_mode: MatchModeEnum = Field(..., description="Match mode used")
    scores: MatchScores = Field(..., description="Score breakdown")
    skill_gaps: List[str] = Field(default_factory=list, description="Missing skills")
    matched_skills: List[str] = Field(default_factory=list, description="Matched skills")
    explanation: Optional[str] = Field(default=None, description="Match explanation")


class MatchResultDetail(MatchResult):
    """Detailed match result with additional context."""

    job_description: str = Field(description="Full job description")
    required_skills: List[str] = Field(description="All required skills for the job")
    preferred_skills: List[str] = Field(
        default_factory=list,
        description="Nice-to-have skills"
    )
    experience_years_min: int = Field(description="Minimum years experience required")
    experience_years_max: int = Field(description="Maximum years experience")
    salary_range: Optional[str] = Field(default=None, description="Salary range if available")
    role_level: int = Field(description="Role level in hierarchy (1-9)")
    role_level_delta: int = Field(
        description="Difference from employee's current level (positive = promotion)"
    )
    success_pattern_insights: Optional[str] = Field(
        default=None,
        description="Insights from historical success patterns for this transition"
    )


class EmployeeMatchesResponse(BaseModel):
    """Response for GET /api/matches/employee/{employee_id}."""

    employee_id: int = Field(description="Employee ID")
    employee_name: str = Field(description="Employee name")
    current_role: str = Field(description="Employee's current role")
    match_mode: MatchModeEnum = Field(description="Mode used for matching")
    matches: List[MatchResult] = Field(description="List of job matches")
    total_count: int = Field(description="Total number of matches found")
    cached: bool = Field(
        default=False,
        description="Whether results were served from cache"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "employee_id": 1,
                "employee_name": "John Doe",
                "current_role": "Senior Consultant",
                "match_mode": "best_fit",
                "matches": [],
                "total_count": 0,
                "cached": False
            }
        }


class DetailedMatchResponse(BaseModel):
    """Response for GET /api/matches/employee/{employee_id}/job/{job_id}."""

    employee_id: int = Field(description="Employee ID")
    employee_name: str = Field(description="Employee name")
    match: MatchResultDetail = Field(description="Detailed match information")

    class Config:
        json_schema_extra = {
            "example": {
                "employee_id": 1,
                "employee_name": "John Doe",
                "match": {
                    "job_id": 42,
                    "title": "Senior Data Scientist",
                    "department": "Technology",
                    "service_line": "Consulting",
                    "location": "New York",
                    "scores": {
                        "skill_match": 0.85,
                        "experience_match": 0.92,
                        "growth_potential": 0.65,
                        "overall": 0.83
                    },
                    "gap_analysis": {
                        "overlapping_skills": ["Python", "AWS"],
                        "missing_skills": ["Kubernetes"],
                        "transferable_skills": [],
                        "gap_count": 1
                    },
                    "match_mode": "best_fit",
                    "explanation": "This role is an excellent fit.",
                    "job_description": "We are looking for a Senior Data Scientist...",
                    "required_skills": ["Python", "AWS", "Kubernetes"],
                    "preferred_skills": ["TensorFlow"],
                    "experience_years_min": 5,
                    "experience_years_max": 8,
                    "salary_range": "$120,000 - $160,000",
                    "role_level": 6,
                    "role_level_delta": 1,
                    "success_pattern_insights": "85% of similar transitions were successful."
                }
            }
        }
