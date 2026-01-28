"""Pydantic schemas for success pattern analysis."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


# ============================================
# Core Pattern Models
# ============================================

class TransitionPattern(BaseModel):
    """A single career transition pattern."""
    
    pattern_id: str = Field(..., description="Unique identifier for this transition pattern")
    source_role: str = Field(..., description="Starting role")
    target_role: str = Field(..., description="Destination role")
    success_rate: float = Field(..., ge=0.0, le=1.0, description="Percentage of employees who made this transition")
    avg_time_to_promotion_years: float = Field(..., description="Average years in source role before transition")
    sample_size: int = Field(..., ge=1, description="Number of employees who made this transition")
    service_line: Optional[str] = Field(default=None, description="Service line/department")
    common_skills: List[str] = Field(default_factory=list, description="Skills present in 70%+ of successful transitioners")
    recommended_skills_to_develop: List[str] = Field(default_factory=list, description="Skills that improve transition success")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "pattern_id": "consultant_to_senior_consultant",
            "source_role": "Consultant",
            "target_role": "Senior Consultant",
            "success_rate": 0.68,
            "avg_time_to_promotion_years": 2.5,
            "sample_size": 47,
            "service_line": "Advisory",
            "common_skills": ["Client Management", "Problem Solving", "Excel"],
            "recommended_skills_to_develop": ["Leadership", "Project Management"]
        }
    })


class CareerGraphNode(BaseModel):
    """A node in the career graph (represents a role)."""
    
    id: str = Field(..., description="Unique node identifier")
    role: str = Field(..., description="Role name")
    role_level: Optional[int] = Field(default=None, description="Role level (1-10)")
    service_line: Optional[str] = Field(default=None)
    employee_count: int = Field(default=0, description="Number of employees in this role")
    
    # React Flow positioning (will be calculated)
    position: Dict[str, float] = Field(default_factory=lambda: {"x": 0, "y": 0})


class CareerGraphEdge(BaseModel):
    """An edge in the career graph (represents a transition)."""
    
    id: str = Field(..., description="Unique edge identifier")
    source: str = Field(..., description="Source node ID")
    target: str = Field(..., description="Target node ID")
    success_rate: float = Field(..., ge=0.0, le=1.0)
    avg_time_years: float = Field(...)
    sample_size: int = Field(...)
    label: Optional[str] = Field(default=None, description="Edge label for display")


class CareerGraph(BaseModel):
    """Full career graph for React Flow visualization."""
    
    nodes: List[CareerGraphNode] = Field(default_factory=list)
    edges: List[CareerGraphEdge] = Field(default_factory=list)
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "nodes": [
                {"id": "analyst", "role": "Analyst", "role_level": 2, "employee_count": 50},
                {"id": "senior_analyst", "role": "Senior Analyst", "role_level": 3, "employee_count": 35}
            ],
            "edges": [
                {"id": "analyst_to_senior_analyst", "source": "analyst", "target": "senior_analyst", 
                 "success_rate": 0.72, "avg_time_years": 2.3, "sample_size": 28}
            ]
        }
    })


class RoleRecommendation(BaseModel):
    """A recommended next role for an employee."""
    
    role: str = Field(..., description="Recommended role name")
    success_rate: float = Field(..., description="Historical success rate for this transition")
    avg_time_to_promotion: float = Field(..., description="Average years to achieve this transition")
    skill_match_score: float = Field(..., ge=0.0, le=1.0, description="How well employee skills match")
    skill_gaps: List[str] = Field(default_factory=list, description="Skills employee needs to develop")
    matching_skills: List[str] = Field(default_factory=list, description="Skills employee already has")
    estimated_readiness_months: Optional[int] = Field(default=None, description="Estimated months to readiness")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "role": "Senior Consultant",
            "success_rate": 0.68,
            "avg_time_to_promotion": 2.5,
            "skill_match_score": 0.75,
            "skill_gaps": ["Leadership", "Project Management"],
            "matching_skills": ["Client Management", "Problem Solving", "Excel"],
            "estimated_readiness_months": 8
        }
    })


class TrajectoryMetrics(BaseModel):
    """Career trajectory metrics for an employee."""
    
    employee_id: str = Field(...)
    current_role: str = Field(...)
    time_in_current_role_years: float = Field(...)
    typical_promotion_time_years: float = Field(..., description="Median time peers spend before promotion")
    percentile_rank: float = Field(..., ge=0.0, le=100.0, description="Percentile vs peers (higher = faster progression)")
    trajectory_status: str = Field(..., description="'on_track', 'ahead', or 'behind'")
    peer_comparison: Dict[str, Any] = Field(default_factory=dict, description="Comparison with peers who started in same role")


# ============================================
# API Request/Response Models
# ============================================

class PatternsByRoleResponse(BaseModel):
    """Response for GET /api/patterns/role/{role_name}."""
    
    role: str = Field(...)
    transitions: List[TransitionPattern] = Field(default_factory=list)
    total_transitions: int = Field(...)


class TransitionDetailResponse(BaseModel):
    """Response for GET /api/patterns/transition/{source}/{target}."""
    
    pattern: Optional[TransitionPattern] = Field(default=None)
    exists: bool = Field(...)
    message: Optional[str] = Field(default=None)


class EmployeeRecommendationsResponse(BaseModel):
    """Response for GET /api/patterns/employee/{employee_id}/recommendations."""
    
    employee_id: str = Field(...)
    current_role: str = Field(...)
    recommendations: List[RoleRecommendation] = Field(default_factory=list)
    trajectory: Optional[TrajectoryMetrics] = Field(default=None)


class CareerGraphResponse(BaseModel):
    """Response for GET /api/patterns/graph."""

    graph: CareerGraph = Field(...)
    total_nodes: int = Field(...)
    total_edges: int = Field(...)
    service_line: Optional[str] = Field(default=None)


# ============================================
# Skill-Based Success Patterns (for job pages)
# ============================================

class SuccessPatternMetrics(BaseModel):
    """Summary metrics for success patterns."""

    avg_time_to_promotion: float = Field(..., description="Average years to next promotion")
    overall_success_rate: float = Field(..., ge=0.0, le=1.0, description="Overall transition success rate")
    total_sample_size: int = Field(..., description="Total employees in sample")
    top_skills: List[str] = Field(default_factory=list, description="Most common skills")


class TransitionData(BaseModel):
    """Transition data for charts."""

    transition: str = Field(..., description="Transition label e.g. 'Analyst → Senior'")
    success_rate: float = Field(..., description="Success rate as percentage (0-100)")
    sample_size: int = Field(..., description="Number of employees")
    color: Optional[str] = Field(default=None, description="Chart color")


class StageData(BaseModel):
    """Career stage data for time-to-promotion charts."""

    stage: str = Field(..., description="Role/stage name")
    avg_years: float = Field(..., description="Average years to reach this stage")


class SkillFrequency(BaseModel):
    """Skill frequency data."""

    skill: str = Field(...)
    frequency: float = Field(..., description="Frequency as percentage (0-100)")


class DepartmentData(BaseModel):
    """Department/service line distribution."""

    name: str = Field(...)
    value: int = Field(..., description="Employee count")
    color: Optional[str] = Field(default=None)


class SkillBasedPatternsResponse(BaseModel):
    """Response for skill-based success patterns (used on job detail pages)."""

    metrics: SuccessPatternMetrics = Field(...)
    success_rate_by_transition: List[TransitionData] = Field(default_factory=list)
    time_to_promotion: Dict[str, List[StageData]] = Field(default_factory=dict)
    skill_frequency: List[SkillFrequency] = Field(default_factory=list)
    department_distribution: List[DepartmentData] = Field(default_factory=list)
    matched_employee_count: int = Field(..., description="Number of employees matched by skills")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "metrics": {
                "avg_time_to_promotion": 2.5,
                "overall_success_rate": 0.68,
                "total_sample_size": 47,
                "top_skills": ["Leadership", "Excel", "Communication"]
            },
            "success_rate_by_transition": [
                {"transition": "Staff → Senior", "success_rate": 85, "sample_size": 120}
            ],
            "time_to_promotion": {
                "Consulting": [
                    {"stage": "Staff", "avg_years": 0},
                    {"stage": "Senior", "avg_years": 2.5}
                ]
            },
            "skill_frequency": [
                {"skill": "Leadership", "frequency": 92}
            ],
            "department_distribution": [
                {"name": "Consulting", "value": 45}
            ],
            "matched_employee_count": 47
        }
    })

