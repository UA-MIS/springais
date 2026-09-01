"""
Match Results API Routes.

Endpoints for job matching:
- GET /api/matches/employee/{employee_id} - Get top matches for employee
- GET /api/matches/employee/{employee_id}/job/{job_id} - Get detailed match
- GET /api/matches/job/{job_id}/deep-analysis - Get AI-powered deep analysis

Optimizations:
- Smart caching with skill-version invalidation (match_cache_service)
- Per-user cache isolation
- Background cache warming
"""

import logging
import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from ..services.match_cache_service import get_match_cache

from ..config.matching_config import MatchMode
from ..schemas.match_result import (
    MatchModeEnum,
    MatchScores,
    EmployeeMatchesResponse,
    DetailedMatchResponse,
    MatchSaveRequest,
    SavedMatchesResponse,
    SavedMatchResponse,
)
from ..schemas.analysis import ComplexAnalysis
from ..services.matching_service import MatchingService
from ..services.analysis_service import DeepAnalysisService
from ..utils.security import get_current_user_from_token
from ..database import get_db
from ..models.match import Match
from ..models.user_profile import UserProfile
from ..models.job_posting import JobPosting
from ..services.recommendation_service import SkillRecommendationService

logger = logging.getLogger(__name__)

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
    employee_id: str,
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
        default=20,  # Increased default from 10 to 20, but NOT 500
        ge=1,
        le=100,  # Reduced from 500 - prevent over-fetching
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
    Uses smart caching with skill-version invalidation for performance.
    """
    # Convert enum to MatchMode
    match_mode = MatchMode(mode.value)

    # Check cache first using the improved match_cache_service
    cache_service = get_match_cache()
    # employee_id MUST be part of the cache key. The key is otherwise scoped only
    # to the logged-in user, so requesting matches for a second employee returned
    # the first employee's cached results.
    filters = {
        "employee_id": str(employee_id),
        "department": department,
        "location": location,
        "min_score": min_score,
    }

    try:
        cached_data = await cache_service.get_cached_matches(
            user_id=str(current_user.id),
            mode=mode.value,
            filters=filters,
            limit=limit,
            offset=offset
        )
        if cached_data and "matches" in cached_data:
            logger.debug(f"Cache hit for user {current_user.id} matches")
            # Reconstruct response from cached data
            return EmployeeMatchesResponse(
                employee_id=employee_id,
                employee_name="",  # Not stored in cache, will be fetched if needed
                current_role="",
                match_mode=mode,
                matches=cached_data["matches"],
                total_count=cached_data.get("total_count", len(cached_data["matches"])),
                cached=True,
            )
    except Exception as e:
        # A cache read failure is survivable (we recompute) but it is not
        # normal, and at debug level a permanently broken cache is
        # indistinguishable from a cold one.
        logger.warning("Match cache read failed; recomputing: %s", e, exc_info=True)

    try:
        # Request more matches to support pagination
        service = MatchingService(
            db=db,
            user_profile=current_user,
            mode=match_mode,
            top_k=offset + limit,  # Get enough for offset + limit
            min_overall_score=min_score,
        )

        # Run blocking DB operations in thread pool to avoid blocking event loop
        employee_profile = await run_in_threadpool(
            service._get_employee_profile, employee_id
        )
        if not employee_profile:
            raise HTTPException(status_code=404, detail="Employee not found")

        matches, total_count = await run_in_threadpool(
            service.find_matches_for_employee_with_total,
            employee_id,
            department,
            location,
        )

        # Filter by min_score if different from default
        if min_score > 0.5:
            matches = [m for m in matches if m.scores.overall >= min_score]
            total_count = len(matches)

        # Apply pagination (offset and limit)
        paginated_matches = matches[offset:offset + limit]

        response = EmployeeMatchesResponse(
            employee_id=employee_profile.id,
            employee_name=employee_profile.name,
            current_role=employee_profile.current_role,
            match_mode=mode,
            matches=paginated_matches,
            total_count=total_count,
            cached=True,  # Using match_cache_service
        )

        # Cache the response using match_cache_service (with skill-version tracking)
        try:
            # Convert to dict for JSON serialization
            response_dict = response.model_dump()
            # Handle enum serialization
            response_dict['match_mode'] = response_dict['match_mode'].value if hasattr(response_dict['match_mode'], 'value') else response_dict['match_mode']
            for match in response_dict.get('matches', []):
                if 'match_mode' in match and hasattr(match['match_mode'], 'value'):
                    match['match_mode'] = match['match_mode'].value

            await cache_service.cache_matches(
                user_id=str(current_user.id),
                mode=mode.value,
                filters=filters,
                limit=limit,
                offset=offset,
                matches=response_dict.get('matches', []),
                total_count=total_count
            )
            logger.debug(f"Cached matches for user {current_user.id}")
        except Exception as e:
            logger.warning(
                "Match cache write failed; every subsequent request will "
                "recompute from scratch: %s", e, exc_info=True,
            )

        return response

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
    employee_id: str,
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

        # Run blocking DB operations in thread pool
        employee_profile = await run_in_threadpool(
            service._get_employee_profile, employee_id
        )
        if not employee_profile:
            raise HTTPException(status_code=404, detail="Employee not found")

        match_detail = await run_in_threadpool(
            service.get_detailed_match, employee_id, job_id
        )

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
    employee_id: str,
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

        # Run blocking DB operations in thread pool
        gap_analysis = await run_in_threadpool(
            service.analyze_skill_gaps, employee_id, job_id
        )
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
        growth_potential_score=payload.scores.role_fit,
        skill_gaps=payload.skill_gaps,
        matched_skills=payload.matched_skills,
        transferable_skills=payload.transferable_skills,
        explanation=payload.explanation,
    )

    # Run blocking DB operations in thread pool
    def save_to_db():
        db.add(match)
        db.commit()
        db.refresh(match)
        return match.id

    match_id = await run_in_threadpool(save_to_db)

    # Fire-and-forget gamification hook (Story 5.4 -- first_match_view)
    try:
        from app.services.reward_hook_service import reward_hook_service
        reward_hook_service.process_action(
            db, current_user.id, "first_match_view",
            f"first_match:{current_user.id}"
        )
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Gamification failed for first match view")

    # Refresh recommendations after saving a match (run in background, don't block response)
    try:
        service = SkillRecommendationService(db)
        await service.compute_recommendations(current_user.id)
    except Exception as e:
        logger.warning(f"Failed to refresh recommendations: {e}")

    return {"saved": True, "match_id": str(match_id)}


@router.get(
    "/saved",
    response_model=SavedMatchesResponse,
    summary="Get saved matches for current user",
    description="Retrieve all saved matches for the authenticated user.",
)
async def get_saved_matches(
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """
    Get all saved matches for the current user.

    Returns matches with job details, scores, and skill analysis.
    Results are sorted by overall score (descending) and saved date (newest first).
    """
    try:
        # Run blocking DB query in thread pool
        def fetch_matches():
            return (
                db.query(Match)
                .join(JobPosting, Match.job_posting_id == JobPosting.id)
                .filter(Match.user_id == current_user.id)
                .order_by(Match.overall_score.desc(), Match.created_at.desc())
                .all()
            )

        matches = await run_in_threadpool(fetch_matches)

        saved_matches = []
        for match in matches:
            job = match.job_posting
            # Build MatchScores with correct field names for the API schema
            scores = MatchScores(
                skill_match=float(match.skill_match_score),
                experience_match=float(match.experience_score),
                role_fit=float(match.growth_potential_score),  # DB column still named growth_potential
                overall=float(match.overall_score),
            )
            saved_matches.append(SavedMatchResponse(
                match_id=str(match.id),
                job_id=str(match.job_posting_id),
                job_title=job.title if job else "Unknown",
                department=job.service_line if job else "",  # JobPosting uses service_line, not department
                service_line=job.service_line if job else "",
                location=job.location if job else "",
                match_mode=MatchModeEnum(match.match_mode),
                scores=scores,
                skill_gaps=match.skill_gaps or [],
                matched_skills=match.matched_skills or [],
                transferable_skills=match.transferable_skills or [],
                explanation=match.explanation,
                saved_at=match.created_at.isoformat() if match.created_at else "",
            ))
        
        return SavedMatchesResponse(
            matches=saved_matches,
            total_count=len(saved_matches)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve saved matches: {str(e)}"
        )


@router.get(
    "/job/{job_id}/deep-analysis",
    response_model=ComplexAnalysis,
    summary="Get AI-powered deep analysis of candidate-job fit",
    description="""
    Get a comprehensive AI-generated analysis of how well the current user
    fits a specific job posting using GPT-5.2 with reasoning.

    Returns:
    - Multi-paragraph narrative assessment of overall fit
    - Detailed skill impact analysis for matched and gap skills
    - Critical success factors and risk factors
    - Estimated ramp-up time
    - Comparable roles and recommended learning path

    Note: This endpoint uses GPT-5.2 with reasoning, which may take 10-30 seconds.
    """,
)
async def get_deep_analysis(
    job_id: str,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """
    Get AI-powered deep analysis of candidate-job fit.

    Uses GPT-5.2 with reasoning_effort="medium" to provide thoughtful,
    nuanced analysis including narratives, skill impacts, and recommendations.
    """
    try:
        logger.info(f"Starting deep analysis for user {current_user.id} and job {job_id}")

        service = DeepAnalysisService(db)
        analysis = await service.analyze_candidate_job_fit(
            user=current_user,
            job_id=job_id,
        )

        logger.info(f"Deep analysis complete for job {job_id}")
        return analysis

    except ValueError as e:
        logger.warning(f"Deep analysis failed - not found: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Deep analysis failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Deep analysis failed: {str(e)}"
        )


@router.delete(
    "/saved/{match_id}",
    summary="Delete a saved match",
    description="Remove a saved match by ID.",
)
async def delete_saved_match(
    match_id: str,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """
    Delete a saved match.
    
    Only the user who saved the match can delete it.
    """
    try:
        from uuid import UUID
        
        # Parse UUID
        try:
            match_uuid = UUID(match_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid match ID format"
            )
        
        # Run blocking DB operations in thread pool
        def find_and_delete():
            match = db.query(Match).filter(
                Match.id == match_uuid,
                Match.user_id == current_user.id
            ).first()

            if not match:
                return False

            db.delete(match)
            db.commit()
            return True

        deleted = await run_in_threadpool(find_and_delete)

        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Saved match not found"
            )

        return {"deleted": True, "match_id": match_id}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete saved match: {str(e)}"
        )
