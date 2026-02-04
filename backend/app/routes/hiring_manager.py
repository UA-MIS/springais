"""
Hiring Manager API Routes.

Endpoints for HM-specific features:
- GET /api/hm/jobs - Browse all jobs
- POST /api/hm/my-jobs - Save a job to "My Jobs"
- GET /api/hm/my-jobs - Get HM's saved jobs
- DELETE /api/hm/my-jobs/{saved_job_id} - Remove from "My Jobs"
- PATCH /api/hm/my-jobs/{saved_job_id}/notes - Update notes
- GET /api/hm/my-jobs/{job_posting_id}/interest - Get ANONYMIZED candidate interest

CRITICAL: All candidate interest data is anonymized.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user_profile import UserProfile
from ..schemas.hiring_manager import (
    HMSaveJobRequest,
    HMSavedJobResponse,
    HMSavedJobsListResponse,
    HMUpdateJobNotesRequest,
    CandidateInterestResponse,
    JobBrowseResponse,
)
from ..services.hiring_manager_service import HiringManagerService
from ..utils.security import get_current_user_from_token

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/hm",
    tags=["hiring-manager"],
    dependencies=[Depends(get_current_user_from_token)],
)


def _require_hm_account(user: UserProfile) -> None:
    """Raise 403 if user is not a hiring manager."""
    if user.account_type != "hiring_manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature requires a Hiring Manager account"
        )


# ============================================================
# Job Browsing
# ============================================================

@router.get(
    "/jobs",
    response_model=JobBrowseResponse,
    summary="Browse all jobs",
    description="Browse all job postings. HMs can filter and search to find jobs they hire for.",
)
async def browse_jobs(
    service_line: Optional[str] = Query(None, description="Filter by service line"),
    location: Optional[str] = Query(None, description="Filter by location"),
    search: Optional[str] = Query(None, description="Search in title/description"),
    is_active: Optional[bool] = Query(True, description="Filter by active status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Browse all jobs in the system."""
    _require_hm_account(current_user)

    try:
        service = HiringManagerService(db)
        result = await run_in_threadpool(
            service.browse_jobs,
            current_user,
            service_line,
            location,
            search,
            is_active,
            page,
            page_size,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to browse jobs: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to browse jobs"
        )


# ============================================================
# My Jobs Management
# ============================================================

@router.post(
    "/my-jobs",
    response_model=HMSavedJobResponse,
    summary="Save a job to My Jobs",
    description="Add a job posting to the HM's 'My Jobs' list.",
)
async def save_job(
    request: HMSaveJobRequest,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Save a job to HM's 'My Jobs' list."""
    _require_hm_account(current_user)

    try:
        service = HiringManagerService(db)
        result = await run_in_threadpool(
            service.save_job,
            current_user,
            request.job_posting_id,
            request.notes,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to save job: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save job"
        )


@router.get(
    "/my-jobs",
    response_model=HMSavedJobsListResponse,
    summary="Get My Jobs",
    description="Get all jobs saved by this HM.",
)
async def get_my_jobs(
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Get HM's saved jobs."""
    _require_hm_account(current_user)

    try:
        service = HiringManagerService(db)
        result = await run_in_threadpool(service.get_my_jobs, current_user)
        return result
    except Exception as e:
        logger.error(f"Failed to get my jobs: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get saved jobs"
        )


@router.delete(
    "/my-jobs/{saved_job_id}",
    summary="Remove from My Jobs",
    description="Remove a job from the HM's 'My Jobs' list.",
)
async def unsave_job(
    saved_job_id: str,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Remove a job from HM's 'My Jobs' list."""
    _require_hm_account(current_user)

    try:
        service = HiringManagerService(db)
        deleted = await run_in_threadpool(
            service.unsave_job,
            current_user,
            saved_job_id,
        )
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Saved job not found"
            )
        return {"deleted": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to unsave job: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove job"
        )


@router.patch(
    "/my-jobs/{saved_job_id}/notes",
    response_model=HMSavedJobResponse,
    summary="Update job notes",
    description="Update HM's notes on a saved job.",
)
async def update_job_notes(
    saved_job_id: str,
    request: HMUpdateJobNotesRequest,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Update notes on a saved job."""
    _require_hm_account(current_user)

    try:
        service = HiringManagerService(db)
        result = await run_in_threadpool(
            service.update_job_notes,
            current_user,
            saved_job_id,
            request.notes,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to update notes: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update notes"
        )


# ============================================================
# Candidate Interest (ANONYMIZED)
# ============================================================

@router.get(
    "/my-jobs/{job_posting_id}/interest",
    response_model=CandidateInterestResponse,
    summary="Get anonymized candidate interest",
    description="""
    Get ANONYMIZED aggregate candidate interest data for a job posting.

    **Privacy Guarantee:**
    - Only aggregate counts and distributions are returned
    - No individual candidate data is exposed
    - No names, emails, departments, or any PII
    - HM can only see interest for jobs in their 'My Jobs' list

    **Data Returned:**
    - Total count of interested candidates
    - Fit level distribution (strong/good/moderate/developing)
    - Average match scores (not individual scores)
    - Common skill gaps among candidates (skill names only)
    """,
)
async def get_candidate_interest(
    job_posting_id: str,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Get anonymized candidate interest for a job."""
    _require_hm_account(current_user)

    try:
        service = HiringManagerService(db)
        result = await run_in_threadpool(
            service.get_candidate_interest,
            current_user,
            job_posting_id,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to get candidate interest: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get candidate interest data"
        )
