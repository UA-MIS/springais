"""
Success Pattern API routes.

Endpoints for career transition patterns, recommendations, and visualization data.

Endpoints:
- GET /api/patterns/role/{role_name} - Get common transitions from a role
- GET /api/patterns/transition/{source}/{target} - Get specific transition details
- GET /api/patterns/graph - Get full career graph for React Flow visualization
- GET /api/patterns/employee/{employee_id}/recommendations - Get role recommendations
- GET /api/patterns/employee/{employee_id}/trajectory - Get trajectory metrics
- POST /api/patterns/cache/invalidate - Invalidate pattern cache
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.security import get_current_user_from_token
from app.services.pattern_service import SuccessPatternService
from app.services.recommendation_service import SkillRecommendationService
from app.models.career_path import CareerPath
from app.models.user_profile import UserProfile
from app.schemas.pattern import (
    PatternsByRoleResponse,
    TransitionDetailResponse,
    CareerGraphResponse,
    EmployeeRecommendationsResponse,
    TransitionPattern,
    TrajectoryMetrics,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/patterns",
    tags=["patterns"],
    dependencies=[Depends(get_current_user_from_token)],
)


class CareerGoalUpdate(BaseModel):
    target_position_node_id: str = Field(..., min_length=1)


def get_pattern_service(db: Session = Depends(get_db)) -> SuccessPatternService:
    """Dependency to get pattern service with database session."""
    return SuccessPatternService(db=db)


@router.post(
    "/career-goal",
    summary="Update career goal target",
    description="Set target position node for the current user and refresh recommendations.",
)
async def update_career_goal(
    payload: CareerGoalUpdate,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    career_path = (
        db.query(CareerPath)
        .filter(CareerPath.user_id == current_user.id)
        .first()
    )
    if career_path:
        career_path.target_position_node_id = payload.target_position_node_id
        career_path.last_updated_at = datetime.now(timezone.utc)
    else:
        career_path = CareerPath(
            user_id=current_user.id,
            target_position_node_id=payload.target_position_node_id,
            graph_data={},
            progression_status={},
            last_updated_at=datetime.now(timezone.utc),
        )
        db.add(career_path)

    db.commit()

    rec_service = SkillRecommendationService(db)
    await rec_service.compute_recommendations(current_user.id)

    return {"target_position_node_id": payload.target_position_node_id}


# ============================================
# Task 4.1: Pattern Endpoints
# ============================================

@router.get(
    "/role/{role_name}",
    response_model=PatternsByRoleResponse,
    summary="Get transitions from a role",
    description="Get all common career transitions from the specified role."
)
async def get_patterns_by_role(
    role_name: str,
    service_line: Optional[str] = Query(None, description="Filter by service line"),
    min_success_rate: Optional[float] = Query(None, ge=0, le=1, description="Minimum success rate"),
    min_sample_size: Optional[int] = Query(None, ge=1, description="Minimum sample size"),
    service: SuccessPatternService = Depends(get_pattern_service)
):
    """
    Get common career transitions from a specific role.
    
    - **role_name**: The source role to get transitions from
    - **service_line**: Optional filter by service line (Advisory, Technology, etc.)
    - **min_success_rate**: Optional minimum success rate (0.0 - 1.0)
    - **min_sample_size**: Optional minimum sample size
    """
    try:
        patterns = service.analyze_transitions(
            service_line=service_line,
            min_sample_size=min_sample_size
        )
        
        # Filter by source role
        transitions = [p for p in patterns if p.source_role.lower() == role_name.lower()]
        
        # Apply additional filters
        if min_success_rate is not None:
            transitions = [t for t in transitions if t.success_rate >= min_success_rate]
        
        return PatternsByRoleResponse(
            role=role_name,
            transitions=transitions,
            total_transitions=len(transitions)
        )
        
    except Exception as e:
        logger.error(f"Error getting patterns for role {role_name}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get patterns: {str(e)}"
        )


@router.get(
    "/transition/{source_role}/{target_role}",
    response_model=TransitionDetailResponse,
    summary="Get specific transition details",
    description="Get detailed information about a specific role transition."
)
async def get_transition_detail(
    source_role: str,
    target_role: str,
    service_line: Optional[str] = Query(None, description="Filter by service line"),
    service: SuccessPatternService = Depends(get_pattern_service)
):
    """
    Get detailed information about a specific role transition.
    
    - **source_role**: The starting role
    - **target_role**: The destination role
    - **service_line**: Optional filter by service line
    """
    try:
        patterns = service.analyze_transitions(service_line=service_line, min_sample_size=1)
        
        # Find the specific transition
        pattern = next(
            (p for p in patterns 
             if p.source_role.lower() == source_role.lower() 
             and p.target_role.lower() == target_role.lower()),
            None
        )
        
        if pattern:
            # Get additional skill correlation data
            skill_correlation = service.get_skill_correlation(source_role, target_role)
            
            return TransitionDetailResponse(
                pattern=pattern,
                exists=True,
                message=None
            )
        else:
            return TransitionDetailResponse(
                pattern=None,
                exists=False,
                message=f"No transition data found from '{source_role}' to '{target_role}'"
            )
            
    except Exception as e:
        logger.error(f"Error getting transition {source_role} -> {target_role}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get transition: {str(e)}"
        )


@router.get(
    "/graph",
    response_model=CareerGraphResponse,
    summary="Get career graph",
    description="Get full career graph for React Flow visualization."
)
async def get_career_graph(
    service_line: Optional[str] = Query(None, description="Filter by service line"),
    min_sample_size: Optional[int] = Query(2, ge=1, description="Minimum sample size for edges"),
    service: SuccessPatternService = Depends(get_pattern_service)
):
    """
    Get career graph data formatted for React Flow.
    
    Returns nodes (roles) and edges (transitions) with positions,
    success rates, and other metadata.
    
    - **service_line**: Optional filter by service line
    - **min_sample_size**: Minimum samples for a transition to appear as an edge
    """
    try:
        graph = service.build_career_graph(
            service_line=service_line,
            min_sample_size=min_sample_size
        )
        
        return CareerGraphResponse(
            graph=graph,
            total_nodes=len(graph.nodes),
            total_edges=len(graph.edges),
            service_line=service_line
        )
        
    except Exception as e:
        logger.error(f"Error building career graph: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to build career graph: {str(e)}"
        )


@router.get(
    "/transitions",
    response_model=list[TransitionPattern],
    summary="Get all transitions",
    description="Get all career transition patterns."
)
async def get_all_transitions(
    service_line: Optional[str] = Query(None, description="Filter by service line"),
    min_success_rate: Optional[float] = Query(None, ge=0, le=1),
    min_sample_size: Optional[int] = Query(2, ge=1),
    service: SuccessPatternService = Depends(get_pattern_service)
):
    """
    Get all career transition patterns.
    
    - **service_line**: Optional filter by service line
    - **min_success_rate**: Optional minimum success rate
    - **min_sample_size**: Minimum sample size (default: 2)
    """
    try:
        patterns = service.analyze_transitions(
            service_line=service_line,
            min_sample_size=min_sample_size
        )
        
        if min_success_rate is not None:
            patterns = [p for p in patterns if p.success_rate >= min_success_rate]
        
        return patterns
        
    except Exception as e:
        logger.error(f"Error getting transitions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get transitions: {str(e)}"
        )


# ============================================
# Task 4.2: Employee Recommendation Endpoints
# ============================================

@router.get(
    "/employee/{employee_id}/recommendations",
    response_model=EmployeeRecommendationsResponse,
    summary="Get role recommendations",
    description="Get recommended next roles for an employee based on their current role and skills."
)
async def get_employee_recommendations(
    employee_id: str,
    top_k: int = Query(5, ge=1, le=20, description="Number of recommendations"),
    service: SuccessPatternService = Depends(get_pattern_service)
):
    """
    Get recommended next roles for an employee.
    
    Returns roles ranked by success rate and skill match, with:
    - Required skills to develop
    - Skill gaps analysis
    - Estimated time to readiness
    
    - **employee_id**: The employee's ID
    - **top_k**: Number of recommendations to return (default: 5)
    """
    try:
        recommendations = service.get_next_role_recommendations(employee_id, top_k=top_k)
        trajectory = service.get_trajectory_metrics(employee_id)
        
        if not recommendations and not trajectory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Employee '{employee_id}' not found"
            )
        
        current_role = trajectory.current_role if trajectory else "Unknown"
        
        return EmployeeRecommendationsResponse(
            employee_id=employee_id,
            current_role=current_role,
            recommendations=recommendations,
            trajectory=trajectory
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting recommendations for {employee_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get recommendations: {str(e)}"
        )


@router.get(
    "/employee/{employee_id}/trajectory",
    response_model=TrajectoryMetrics,
    summary="Get trajectory metrics",
    description="Get career trajectory metrics comparing employee to peers."
)
async def get_employee_trajectory(
    employee_id: str,
    service: SuccessPatternService = Depends(get_pattern_service)
):
    """
    Get career trajectory metrics for an employee.
    
    Compares the employee's progression to peers with the same
    starting role and similar tenure.
    
    Returns:
    - Time in current role
    - Typical promotion time for peers
    - Percentile rank (higher = faster progression)
    - Status: "ahead", "on_track", or "behind"
    """
    try:
        metrics = service.get_trajectory_metrics(employee_id)
        
        if not metrics:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Employee '{employee_id}' not found"
            )
        
        return metrics
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting trajectory for {employee_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get trajectory: {str(e)}"
        )


# ============================================
# Cache Management
# ============================================

@router.post(
    "/cache/invalidate",
    summary="Invalidate pattern cache",
    description="Invalidate cached pattern data. Call after employee data changes."
)
async def invalidate_cache(
    service_line: Optional[str] = Query(None, description="Only invalidate for this service line"),
    service: SuccessPatternService = Depends(get_pattern_service)
):
    """
    Invalidate the pattern cache.
    
    Call this endpoint after importing new employee data or
    updating career history to ensure fresh pattern analysis.
    
    - **service_line**: Optional - only invalidate cache for this service line
    """
    try:
        count = service.invalidate_cache(service_line)
        
        return {
            "message": "Cache invalidated successfully",
            "keys_invalidated": count,
            "service_line": service_line or "all"
        }
        
    except Exception as e:
        logger.error(f"Error invalidating cache: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to invalidate cache: {str(e)}"
        )


# ============================================
# Skill Correlation Endpoint
# ============================================

@router.get(
    "/skills/{source_role}/{target_role}",
    summary="Get skill correlation",
    description="Get skill frequencies for employees who made a specific transition."
)
async def get_skill_correlation(
    source_role: str,
    target_role: str,
    threshold: float = Query(0.5, ge=0, le=1, description="Minimum frequency threshold"),
    service: SuccessPatternService = Depends(get_pattern_service)
):
    """
    Get skill correlation data for a specific transition.
    
    Returns the frequency of each skill among employees who
    successfully made this career transition.
    
    - **source_role**: Starting role
    - **target_role**: Destination role
    - **threshold**: Only return skills with frequency >= threshold
    """
    try:
        correlation = service.get_skill_correlation(source_role, target_role)
        common_skills = service.find_common_skills(source_role, target_role, threshold=threshold)
        
        return {
            "source_role": source_role,
            "target_role": target_role,
            "skill_frequencies": correlation,
            "common_skills": common_skills,
            "threshold": threshold
        }
        
    except Exception as e:
        logger.error(f"Error getting skill correlation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get skill correlation: {str(e)}"
        )

