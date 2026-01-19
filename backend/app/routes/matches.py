"""
Match Results API Routes.

Endpoints for job matching:
- GET /api/matches/employee/{employee_id} - Get top matches for employee
- GET /api/matches/employee/{employee_id}/job/{job_id} - Get detailed match
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from ..config.matching_config import MatchMode
from ..schemas.match_result import (
    MatchModeEnum,
    EmployeeMatchesResponse,
    DetailedMatchResponse,
)
from ..services.matching_service import (
    MatchingService,
    match_by_skills,
    get_match_detail,
)

# Import mock data for employee info (will be replaced with DB in Block O)
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))
try:
    from tests.fixtures.mock_data import get_mock_employee
except ImportError:
    get_mock_employee = lambda x: None

router = APIRouter(prefix="/matches", tags=["matches"])


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
        le=50,
        description="Maximum number of matches to return"
    ),
):
    """
    Get top job matches for an employee.

    Returns a list of matching jobs with scores and skill gap analysis.
    Results are sorted by overall match score (descending).
    """
    # Get employee info (mock data for now)
    employee = get_mock_employee(employee_id)
    if not employee:
        raise HTTPException(
            status_code=404,
            detail=f"Employee {employee_id} not found"
        )

    # Convert enum to MatchMode
    match_mode = MatchMode(mode.value)

    try:
        # Find matches
        matches = match_by_skills(
            employee_id=employee_id,
            mode=match_mode,
            top_k=limit,
            department=department,
            location=location,
        )

        # Filter by min_score if different from default
        if min_score > 0.5:
            matches = [m for m in matches if m.scores.overall >= min_score]

        return EmployeeMatchesResponse(
            employee_id=employee_id,
            employee_name=employee.name,
            current_role=employee.current_role,
            match_mode=mode,
            matches=matches,
            total_count=len(matches),
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
    job_id: int,
    mode: MatchModeEnum = Query(
        default=MatchModeEnum.BEST_FIT,
        description="Matching mode for scoring"
    ),
):
    """
    Get detailed match information for a specific employee-job pair.

    Includes full job description, all required/preferred skills,
    and detailed explanation of why this job matches the employee.
    """
    # Get employee info (mock data for now)
    employee = get_mock_employee(employee_id)
    if not employee:
        raise HTTPException(
            status_code=404,
            detail=f"Employee {employee_id} not found"
        )

    # Convert enum to MatchMode
    match_mode = MatchMode(mode.value)

    try:
        # Get detailed match
        match_detail = get_match_detail(
            employee_id=employee_id,
            job_id=job_id,
            mode=match_mode,
        )

        return DetailedMatchResponse(
            employee_id=employee_id,
            employee_name=employee.name,
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
    job_id: int,
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
        service = MatchingService()
        gap_analysis = service.analyze_skill_gaps(employee_id, job_id)
        return gap_analysis

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gap analysis failed: {str(e)}")
