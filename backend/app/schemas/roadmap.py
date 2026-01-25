"""
Pydantic schemas for Career Roadmap feature.

Defines request/response models for AI-powered career roadmap generation
using GPT-5.2 with reasoning capabilities.
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum
from datetime import datetime


class RoadmapEmphasis(str, Enum):
    """Emphasis options for roadmap customization."""
    TECHNICAL = "technical"
    LEADERSHIP = "leadership"
    BALANCED = "balanced"


class TargetRole(BaseModel):
    """A target role selected for the roadmap."""
    job_id: str = Field(..., description="The job posting ID")
    job_title: str = Field(..., description="The job title")
    service_line: Optional[str] = Field(None, description="Service line/department")
    order: int = Field(..., description="Order in progression (1 = first target, 2 = second, etc.)")


class RoadmapGenerateRequest(BaseModel):
    """Request to generate a career roadmap."""
    target_roles: List[TargetRole] = Field(
        ...,
        min_length=1,
        max_length=5,
        description="Target roles in order of progression"
    )
    auto_order: bool = Field(
        default=True,
        description="Let AI determine the optimal progression order for target roles"
    )
    emphasis: RoadmapEmphasis = Field(
        default=RoadmapEmphasis.BALANCED,
        description="Primary focus area for the roadmap"
    )
    custom_instructions: Optional[str] = Field(
        default=None,
        max_length=2000,
        description="Custom text/priorities for roadmap generation"
    )
    include_certifications: bool = Field(
        default=True,
        description="Whether to include certification recommendations"
    )
    timeline_preference: Optional[str] = Field(
        default=None,
        description="Preferred timeline (e.g., 'aggressive', 'balanced', '2-3 years')"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "target_roles": [
                    {"job_id": "job-123", "job_title": "Senior Consultant", "service_line": "Advisory", "order": 1},
                    {"job_id": "job-456", "job_title": "Manager", "service_line": "Advisory", "order": 2}
                ],
                "emphasis": "balanced",
                "custom_instructions": "I want to focus on cloud technologies and client-facing work",
                "include_certifications": True,
                "timeline_preference": "2-3 years"
            }
        }


class RoadmapMilestone(BaseModel):
    """A single milestone in the roadmap."""
    id: str = Field(..., description="Unique milestone ID")
    title: str = Field(..., description="Milestone title")
    description: str = Field(..., description="Detailed description of what to accomplish")
    category: str = Field(..., description="Category: skill, experience, certification, leadership, networking")
    priority: str = Field(..., description="Priority: critical, high, medium, optional")
    estimated_duration_months: int = Field(..., description="Estimated time to complete")
    prerequisites: List[str] = Field(default=[], description="IDs of prerequisite milestones")
    skills_to_develop: List[str] = Field(default=[], description="Skills associated with this milestone")
    resources: List[str] = Field(default=[], description="Recommended resources/actions")
    success_indicators: List[str] = Field(default=[], description="How to know this milestone is complete")


class RoadmapPhase(BaseModel):
    """A phase in the career roadmap (e.g., 'Foundation', 'Growth', 'Transition')."""
    id: str = Field(..., description="Unique phase ID")
    name: str = Field(..., description="Phase name")
    description: str = Field(..., description="What this phase accomplishes")
    target_role: Optional[str] = Field(None, description="Target role for this phase (if transitioning)")
    estimated_duration_months: int = Field(..., description="Estimated duration")
    milestones: List[RoadmapMilestone] = Field(default=[], description="Milestones in this phase")
    status: str = Field(default="upcoming", description="Status: completed, in_progress, upcoming")


class RoadmapResponse(BaseModel):
    """Complete career roadmap response."""
    roadmap_id: str = Field(..., description="Unique roadmap ID")
    generated_at: datetime = Field(..., description="When the roadmap was generated")

    # User context
    current_role: str = Field(..., description="User's current role")
    current_skills: List[str] = Field(default=[], description="User's current skills")

    # Roadmap content
    executive_summary: str = Field(..., description="2-3 paragraph overview of the entire journey")
    total_estimated_months: int = Field(..., description="Total estimated time for full roadmap")
    phases: List[RoadmapPhase] = Field(default=[], description="Ordered phases of the roadmap")

    # Key insights
    critical_skills_to_develop: List[str] = Field(default=[], description="Most important skills to prioritize")
    quick_wins: List[str] = Field(default=[], description="Things that can be started immediately")
    potential_blockers: List[str] = Field(default=[], description="Potential challenges to be aware of")

    # Personalization notes
    emphasis_applied: RoadmapEmphasis = Field(..., description="The emphasis that was applied")
    customization_notes: Optional[str] = Field(None, description="How custom instructions were incorporated")

    class Config:
        json_schema_extra = {
            "example": {
                "roadmap_id": "rm-abc123",
                "generated_at": "2024-01-15T10:30:00Z",
                "current_role": "Consultant",
                "current_skills": ["Python", "SQL", "Client Management"],
                "executive_summary": "Your journey from Consultant to Manager...",
                "total_estimated_months": 24,
                "phases": [],
                "critical_skills_to_develop": ["Leadership", "Strategic Planning"],
                "quick_wins": ["Start AWS certification prep"],
                "potential_blockers": ["Limited client-facing opportunities"],
                "emphasis_applied": "balanced",
                "customization_notes": "Incorporated your focus on cloud technologies..."
            }
        }


class SavedRoadmapSummary(BaseModel):
    """Summary of a saved roadmap for list views."""
    id: str = Field(..., description="Saved roadmap ID")
    title: str = Field(..., description="Roadmap title")
    target_role_titles: List[str] = Field(..., description="Target roles in this roadmap")
    total_phases: int = Field(..., description="Number of phases")
    total_milestones: int = Field(..., description="Number of milestones")
    total_estimated_months: int = Field(..., description="Total estimated duration")
    emphasis: str = Field(..., description="Emphasis used")
    executive_summary: Optional[str] = Field(None, description="Executive summary preview")
    generated_at: datetime = Field(..., description="When the roadmap was generated")
    created_at: datetime = Field(..., description="When the roadmap was saved")


class SavedRoadmapDetail(BaseModel):
    """Full saved roadmap with all data."""
    id: str = Field(..., description="Saved roadmap ID")
    title: str = Field(..., description="Roadmap title")
    roadmap: RoadmapResponse = Field(..., description="Full roadmap data")
    created_at: datetime = Field(..., description="When the roadmap was saved")


class SavedRoadmapsListResponse(BaseModel):
    """Response for listing saved roadmaps."""
    roadmaps: List[SavedRoadmapSummary] = Field(..., description="List of saved roadmaps")
    total_count: int = Field(..., description="Total number of saved roadmaps")
