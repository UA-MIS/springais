"""
Match Results API Routes.

Endpoints for job matching:
- GET /api/matches/employee/{employee_id} - Get top matches for employee
- GET /api/matches/employee/{employee_id}/job/{job_id} - Get detailed match
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..config.matching_config import MatchMode
from ..schemas.match_result import (
    MatchModeEnum,
    EmployeeMatchesResponse,
    DetailedMatchResponse,
    MatchSaveRequest,
)
from ..services.matching_service import MatchingService
from ..utils.security import get_current_user_from_token
from ..database import get_db
from ..models.match import Match
from ..models.user_profile import UserProfile
from ..services.recommendation_service import SkillRecommendationService

router = APIRouter(
    prefix="/matches",
    tags=["matches"],
    dependencies=[Depends(get_current_user_from_token)],
)


@router.get(
    "/employee/{employee_id}",
    response_model=EmployeeMatchesResponse,
    summary="Get job matches for employee",
    description="""
    Find top job matches for an employee using AI-powered semantic matching.

    **Match Modes:**
    - `best_fit`: Conservative matches with 90%+ skill match (default)
    - `stretch`: Ambitious matches with 70-85% skill match
    - `exploratory`: Career pivot opportunities with 50-70% skill match

    **Scoring Components:**
    - Skill match: Semantic similarity using embeddings
    - Experience match: Years of experience alignment
    - Growth potential: Career advancement opportunity

    The overall score is a weighted combination based on the selected mode.
    """,
)
async def get_employee_matches(
    employee_id: int,
    mode: MatchModeEnum = Query(
        default=MatchModeEnum.BEST_FIT,
        description="Matching mode determines score weights and thresholds"
    ),
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
    min_score: float = Query(
        default=0.5,
        ge=0.0,
        le=1.0,
        description="Minimum overall score threshold (0-1)"
    ),
    department: Optional[str] = Query(
        default=None,
        description="Filter by department (e.g., 'Technology', 'Advisory')"
    ),
    location: Optional[str] = Query(
        default=None,
        description="Filter by location (e.g., 'New York', 'San Francisco')"
    ),
    limit: int = Query(
        default=10,
        ge=1,
        le=500,  # Increased to support fetching all matches
        description="Maximum number of matches to return"
    ),
    offset: int = Query(
        default=0,
        ge=0,
        description="Number of matches to skip (for pagination)"
    ),
):
    """
    Get top job matches for an employee.

    Returns a list of matching jobs with scores and skill gap analysis.
    Results are sorted by overall match score (descending).
    """
    # Convert enum to MatchMode
    match_mode = MatchMode(mode.value)

    try:
        # Request more matches to support pagination
        service = MatchingService(
            db=db,
            user_profile=current_user,
            mode=match_mode,
            top_k=offset + limit,  # Get enough for offset + limit
            min_overall_score=min_score,
        )
        employee_profile = service._get_employee_profile(employee_id)
        if not employee_profile:
            raise HTTPException(status_code=404, detail="Employee not found")
        matches, total_count = service.find_matches_for_employee_with_total(
            employee_id=employee_id,
            department_filter=department,
            location_filter=location,
        )

        # Filter by min_score if different from default
        if min_score > 0.5:
            matches = [m for m in matches if m.scores.overall >= min_score]
            total_count = len(matches)

        # Apply pagination (offset and limit)
        paginated_matches = matches[offset:offset + limit]

        return EmployeeMatchesResponse(
            employee_id=employee_profile.id,
            employee_name=employee_profile.name,
            current_role=employee_profile.current_role,
            match_mode=mode,
            matches=paginated_matches,
            total_count=total_count,
            cached=False,  # TODO: Add caching in Block O
        )

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Matching failed: {str(e)}")


@router.get(
    "/employee/{employee_id}/job/{job_id}",
    response_model=DetailedMatchResponse,
    summary="Get detailed match for employee-job pair",
    description="""
    Get detailed match information for a specific employee and job posting.

    Returns:
    - Full scoring breakdown (skill, experience, growth, overall)
    - Complete skill gap analysis
    - Job description and requirements
    - Role level comparison
    - LLM-generated match explanation
    """,
)
async def get_detailed_match(
    employee_id: int,
    job_id: str,
    mode: MatchModeEnum = Query(
        default=MatchModeEnum.BEST_FIT,
        description="Matching mode for scoring"
    ),
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """
    Get detailed match information for a specific employee-job pair.

    Includes full job description, all required/preferred skills,
    and detailed explanation of why this job matches the employee.
    """
    try:
        match_mode = MatchMode(mode.value)
        service = MatchingService(db=db, user_profile=current_user, mode=match_mode)
        employee_profile = service._get_employee_profile(employee_id)
        if not employee_profile:
            raise HTTPException(status_code=404, detail="Employee not found")
        match_detail = service.get_detailed_match(employee_id=employee_id, job_id=job_id)

        return DetailedMatchResponse(
            employee_id=employee_profile.id,
            employee_name=employee_profile.name,
            match=match_detail,
        )

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Match detail failed: {str(e)}")


@router.get(
    "/employee/{employee_id}/skill-gaps/{job_id}",
    summary="Analyze skill gaps for employee-job pair",
    description="Get detailed skill gap analysis between an employee and a job posting.",
)
async def analyze_skill_gaps(
    employee_id: int,
    job_id: str,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """
    Analyze skill gaps between an employee and a job posting.

    Returns:
    - Overlapping skills (employee has, job requires)
    - Missing skills (job requires, employee lacks)
    - Transferable skills (employee has, could apply)
    - Gap count
    """
    try:
        service = MatchingService(db=db, user_profile=current_user)
        gap_analysis = service.analyze_skill_gaps(employee_id, job_id)
        return gap_analysis

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gap analysis failed: {str(e)}")


@router.post(
    "/save",
    summary="Save a match for a user",
    description="Persist a match and trigger skill recommendation refresh.",
)
async def save_match(
    payload: MatchSaveRequest,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """
    Save a match to the database.

    Required fields include job_posting_id, employee_id, match_mode, scores,
    and skill gap details.
    """
    match = Match(
        employee_id=payload.employee_id,
        job_posting_id=payload.job_posting_id,
        user_id=current_user.id,
        match_mode=payload.match_mode.value,
        overall_score=payload.scores.overall,
        skill_match_score=payload.scores.skill_match,
        experience_score=payload.scores.experience_match,
        growth_potential_score=payload.scores.growth_potential,
        skill_gaps=payload.skill_gaps,
        matched_skills=payload.matched_skills,
        explanation=payload.explanation,
    )
    db.add(match)
    db.commit()
    db.refresh(match)

    # Refresh recommendations after saving a match
    service = SkillRecommendationService(db)
    await service.compute_recommendations(current_user.id)

    return {"saved": True, "match_id": str(match.id)}
