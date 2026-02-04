"""Pydantic schemas for Hiring Manager features."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# ============================================================
# HM Saved Jobs Schemas
# ============================================================

class HMSaveJobRequest(BaseModel):
    """Request to save a job to HM's 'My Jobs' list."""
    job_posting_id: str
    notes: Optional[str] = None


class HMSavedJobResponse(BaseModel):
    """Response for a single saved job."""
    id: str
    job_posting_id: str
    job_title: str
    service_line: str
    location: str
    is_active: bool
    notes: Optional[str] = None
    saved_at: datetime
    candidate_interest_count: int = 0  # Quick count for list view


class HMSavedJobsListResponse(BaseModel):
    """Response for list of HM's saved jobs."""
    jobs: list[HMSavedJobResponse]
    total_count: int


class HMUpdateJobNotesRequest(BaseModel):
    """Request to update notes on a saved job."""
    notes: Optional[str] = None


# ============================================================
# Candidate Interest Schemas (ANONYMIZED - NO PII)
# ============================================================

class FitLevelDistribution(BaseModel):
    """
    Distribution of candidate fit levels.

    PRIVACY: Only counts, no individual data.
    Fit levels are bucketed from match scores:
    - strong_fit: overall_score >= 0.8
    - good_fit: 0.65 <= overall_score < 0.8
    - moderate_fit: 0.5 <= overall_score < 0.65
    - developing: overall_score < 0.5
    """
    strong_fit: int = 0
    good_fit: int = 0
    moderate_fit: int = 0
    developing: int = 0


class SkillGapSummary(BaseModel):
    """
    Aggregate skill gap information across all interested candidates.

    PRIVACY: Only skill names and counts, no candidate info.
    """
    skill_name: str
    candidates_missing: int  # How many candidates are missing this skill
    percentage_missing: float  # What % of interested candidates lack this


class AnonymizedCandidateDetail(BaseModel):
    """
    Anonymized individual candidate data for HM view.

    PRIVACY: No PII - just skills and scores with anonymous label.
    """
    candidate_label: str = Field(description="Anonymous label like 'Candidate 1'")
    overall_score: float
    skill_match_score: float
    matched_skills: list[str] = Field(default_factory=list)
    transferable_skills: list[str] = Field(default_factory=list)
    skill_gaps: list[str] = Field(default_factory=list)
    fit_level: str = Field(description="strong_fit, good_fit, moderate_fit, or developing")


class CandidateInterestResponse(BaseModel):
    """
    ANONYMIZED candidate interest data for a job posting.

    CRITICAL PRIVACY REQUIREMENTS:
    - NO user IDs
    - NO names or emails
    - NO departments or teams
    - NO timestamps that could identify individuals
    - Anonymous labels only (Candidate 1, Candidate 2, etc.)
    """
    job_posting_id: str
    job_title: str

    # Aggregate metrics only
    total_interested: int = Field(
        description="Total number of candidates who have saved this job"
    )
    fit_distribution: FitLevelDistribution = Field(
        description="Distribution of candidate fit levels (counts only)"
    )

    # Average scores (not individual)
    average_overall_score: Optional[float] = Field(
        None,
        description="Average match score across all interested candidates"
    )
    average_skill_match: Optional[float] = Field(
        None,
        description="Average skill match score"
    )

    # Aggregate skill gaps (top N most common gaps)
    common_skill_gaps: list[SkillGapSummary] = Field(
        default_factory=list,
        description="Most common skill gaps among interested candidates"
    )

    # Individual candidate details (anonymized)
    candidates: list[AnonymizedCandidateDetail] = Field(
        default_factory=list,
        description="Anonymized individual candidate skill profiles"
    )

    # Metadata
    last_updated: datetime = Field(
        description="When this aggregate data was computed"
    )

    # Privacy notice
    privacy_notice: str = Field(
        default="This data is fully anonymized. No individual candidate information is available.",
        description="Privacy notice for HM"
    )


# ============================================================
# Job Browse Schemas (for HM job browsing)
# ============================================================

class JobBrowseFilters(BaseModel):
    """Filters for HM job browsing."""
    service_line: Optional[str] = None
    location: Optional[str] = None
    search_query: Optional[str] = None
    is_active: Optional[bool] = True


class JobBrowseItem(BaseModel):
    """Job item for HM browsing view."""
    id: str
    title: str
    service_line: str
    location: str
    is_active: bool
    posted_date: Optional[str] = None
    required_skills: list[str] = []
    is_saved: bool = False  # Whether HM has saved this to "My Jobs"


class JobBrowseResponse(BaseModel):
    """Response for job browsing."""
    jobs: list[JobBrowseItem]
    total_count: int
    page: int
    page_size: int
