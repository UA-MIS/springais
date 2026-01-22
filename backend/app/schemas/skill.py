"""Pydantic schemas for skill extraction and management."""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field, ConfigDict


# ============================================
# Skill Categories and Proficiency Levels
# ============================================

SkillCategory = Literal["technical", "soft", "domain", "certification"]
ProficiencyLevel = Literal["beginner", "intermediate", "advanced", "expert"]
RecommendationStatus = Literal["recommended", "in_progress", "dismissed"]


# ============================================
# Core Skill Models
# ============================================

class Skill(BaseModel):
    """A single extracted skill with category and proficiency."""

    name: str = Field(..., description="The skill name (normalized)")
    category: SkillCategory = Field(..., description="Skill category")
    proficiency: ProficiencyLevel = Field(
        default="intermediate",
        description="Proficiency level based on experience"
    )
    years_experience: Optional[float] = Field(
        default=None,
        description="Years of experience if mentioned"
    )
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "name": "Python",
            "category": "technical",
            "proficiency": "advanced",
            "years_experience": 5.0
        }
    })


class SkillList(BaseModel):
    """List of skills returned from extraction."""

    skills: List[Skill] = Field(default_factory=list)
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "skills": [
                {"name": "Python", "category": "technical", "proficiency": "advanced"},
                {"name": "Leadership", "category": "soft", "proficiency": "intermediate"}
            ]
        }
    })


# ============================================
# API Request/Response Models
# ============================================

class SkillExtractionRequest(BaseModel):
    """Request body for text-based skill extraction."""

    text: str = Field(
        ...,
        min_length=10,
        max_length=50000,
        description="Resume text or profile description to extract skills from"
    )
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "text": "Senior Software Engineer with 5 years of Python experience..."
        }
    })


class SkillExtractionResponse(BaseModel):
    """Response from skill extraction endpoint."""

    skills: List[Skill] = Field(default_factory=list)
    total_count: int = Field(..., description="Total number of skills extracted")
    categories: dict = Field(
        default_factory=dict,
        description="Skills grouped by category"
    )
    tokens_used: Optional[int] = Field(
        default=None,
        description="OpenAI tokens used for extraction"
    )
    cost_usd: Optional[float] = Field(
        default=None,
        description="Estimated cost in USD"
    )
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "skills": [
                {"name": "Python", "category": "technical", "proficiency": "advanced"},
                {"name": "Leadership", "category": "soft", "proficiency": "intermediate"}
            ],
            "total_count": 2,
            "categories": {
                "technical": ["Python"],
                "soft": ["Leadership"]
            },
            "tokens_used": 450,
            "cost_usd": 0.00013
        }
    })


class ResumeUploadResponse(BaseModel):
    """Response from resume file upload endpoint."""

    filename: str = Field(..., description="Uploaded filename")
    file_type: str = Field(..., description="File type (pdf, docx)")
    text_length: int = Field(..., description="Length of extracted text")
    skills: List[Skill] = Field(default_factory=list)
    total_count: int = Field(..., description="Total skills extracted")
    categories: dict = Field(default_factory=dict)


class EmployeeSkillsUpdate(BaseModel):
    """Request to update employee skills manually."""

    skills: List[Skill] = Field(..., description="List of skills to set")
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "skills": [
                {"name": "Python", "category": "technical", "proficiency": "advanced"},
                {"name": "SQL", "category": "technical", "proficiency": "intermediate"}
            ]
        }
    })


# ============================================
# Skill Taxonomy Models
# ============================================

class SkillTaxonomyEntry(BaseModel):
    """A skill in the taxonomy with canonical name and aliases."""

    canonical_name: str = Field(..., description="The standard skill name")
    category: SkillCategory = Field(..., description="Skill category")
    aliases: List[str] = Field(
        default_factory=list,
        description="Alternative names/spellings"
    )
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "canonical_name": "JavaScript",
            "category": "technical",
            "aliases": ["Javascript", "JS", "ECMAScript", "js"]
        }
    })


class SkillTaxonomyResponse(BaseModel):
    """Full skill taxonomy for autocomplete."""

    skills: List[SkillTaxonomyEntry] = Field(default_factory=list)
    total_count: int = Field(..., description="Total skills in taxonomy")
    categories: dict = Field(
        default_factory=dict,
        description="Count of skills per category"
    )


# ============================================
# Skill Recommendation Models
# ============================================

class SkillRecommendationItem(BaseModel):
    """A single skill recommendation."""

    skill: str = Field(..., description="Recommended skill name")
    category: Optional[str] = Field(
        default=None,
        description="Skill category (UI categories such as leadership_management)"
    )
    priority: float = Field(..., ge=0.0, le=1.0, description="Priority score (0-1)")
    source: str = Field(..., description="Recommendation source")
    related_roles: List[str] = Field(default_factory=list, description="Related job IDs")
    status: RecommendationStatus = Field(default="recommended")


class SkillRecommendationsResponse(BaseModel):
    """Response for skill recommendations endpoint."""

    recommendations: List[SkillRecommendationItem] = Field(default_factory=list)


# ============================================
# Job Skill Extraction Models
# ============================================

class ExtractedSkill(BaseModel):
    """A skill extracted from a job posting with confidence score."""

    name: str = Field(..., description="Normalized skill name")
    category: Literal["technical", "soft", "domain", "certification", "tool", "methodology"] = Field(
        ..., description="Skill category"
    )
    confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Confidence score (0.0 - 1.0)"
    )
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "name": "Python",
            "category": "technical",
            "confidence": 0.95
        }
    })


class JobSkillExtraction(BaseModel):
    """Extracted skills and metadata from one or more job postings."""

    job_ids: List[str] = Field(
        ..., description="Job IDs (multiple if LLM grouped similar jobs)"
    )
    required_skills: List[ExtractedSkill] = Field(
        default_factory=list,
        description="Skills explicitly mentioned as requirements"
    )
    inferred_skills: List[ExtractedSkill] = Field(
        default_factory=list,
        description="Skills implied by responsibilities"
    )
    experience_years_min: Optional[int] = Field(
        default=None,
        description="Minimum years of experience required"
    )
    experience_years_max: Optional[int] = Field(
        default=None,
        description="Maximum years of experience (if range given)"
    )
    primary_domain: Optional[str] = Field(
        default=None,
        description="Primary domain (e.g., 'Data Engineering', 'Cybersecurity')"
    )
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "job_ids": ["ey_12345"],
            "required_skills": [
                {"name": "Python", "category": "technical", "confidence": 0.95}
            ],
            "inferred_skills": [
                {"name": "Data Pipelines", "category": "technical", "confidence": 0.7}
            ],
            "experience_years_min": 3,
            "experience_years_max": 5,
            "primary_domain": "Data Engineering"
        }
    })
