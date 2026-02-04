"""
Hiring Manager Service.

Handles HM-specific operations:
- Saving jobs to "My Jobs"
- Computing ANONYMIZED candidate interest data

CRITICAL: This service must NEVER expose PII. All candidate data
must be aggregated before returning to the HM.
"""

import logging
from datetime import datetime, timezone
from typing import Optional
from collections import Counter

from sqlalchemy import func
from sqlalchemy.orm import Session

from ..models.hm_saved_job import HMSavedJob
from ..models.job_posting import JobPosting
from ..models.match import Match
from ..models.user_profile import UserProfile
from ..schemas.hiring_manager import (
    HMSavedJobResponse,
    HMSavedJobsListResponse,
    CandidateInterestResponse,
    FitLevelDistribution,
    SkillGapSummary,
    AnonymizedCandidateDetail,
    JobBrowseItem,
    JobBrowseResponse,
)

logger = logging.getLogger(__name__)


class HiringManagerService:
    """Service for Hiring Manager operations."""

    def __init__(self, db: Session):
        self.db = db

    def _verify_hm_account(self, user: UserProfile) -> None:
        """
        Verify that the user has a hiring_manager account type.
        Raises ValueError if not.
        """
        if user.account_type != "hiring_manager":
            raise ValueError("This feature is only available to Hiring Manager accounts")

    # ============================================================
    # Job Browsing
    # ============================================================

    def browse_jobs(
        self,
        user: UserProfile,
        service_line: Optional[str] = None,
        location: Optional[str] = None,
        search_query: Optional[str] = None,
        is_active: Optional[bool] = True,
        page: int = 1,
        page_size: int = 20,
    ) -> JobBrowseResponse:
        """
        Browse all jobs in the system.
        HMs can see all jobs to find ones they're hiring for.
        """
        self._verify_hm_account(user)

        query = self.db.query(JobPosting)

        # Apply filters
        if is_active is not None:
            query = query.filter(JobPosting.is_active == is_active)
        if service_line:
            query = query.filter(JobPosting.service_line.ilike(f"%{service_line}%"))
        if location:
            query = query.filter(JobPosting.location.ilike(f"%{location}%"))
        if search_query:
            query = query.filter(
                JobPosting.title.ilike(f"%{search_query}%") |
                JobPosting.description.ilike(f"%{search_query}%")
            )

        # Get total count
        total_count = query.count()

        # Apply pagination
        offset = (page - 1) * page_size
        jobs = query.order_by(JobPosting.posted_date.desc().nullslast()).offset(offset).limit(page_size).all()

        # Get HM's saved job IDs for marking
        saved_job_ids = set(
            self.db.query(HMSavedJob.job_posting_id)
            .filter(HMSavedJob.hm_user_id == user.id)
            .all()
        )
        saved_job_ids = {j[0] for j in saved_job_ids}

        items = []
        for job in jobs:
            items.append(JobBrowseItem(
                id=job.id,
                title=job.title,
                service_line=job.service_line,
                location=job.location,
                is_active=job.is_active,
                posted_date=job.posted_date.isoformat() if job.posted_date else None,
                required_skills=job.required_skills or [],
                is_saved=job.id in saved_job_ids,
            ))

        return JobBrowseResponse(
            jobs=items,
            total_count=total_count,
            page=page,
            page_size=page_size,
        )

    # ============================================================
    # My Jobs Management
    # ============================================================

    def save_job(
        self,
        user: UserProfile,
        job_posting_id: str,
        notes: Optional[str] = None,
    ) -> HMSavedJobResponse:
        """Save a job to HM's 'My Jobs' list."""
        self._verify_hm_account(user)

        # Check if job exists
        job = self.db.query(JobPosting).filter(JobPosting.id == job_posting_id).first()
        if not job:
            raise ValueError(f"Job posting not found: {job_posting_id}")

        # Check if already saved
        existing = self.db.query(HMSavedJob).filter(
            HMSavedJob.hm_user_id == user.id,
            HMSavedJob.job_posting_id == job_posting_id,
        ).first()

        if existing:
            # Update notes if provided
            if notes is not None:
                existing.notes = notes
                self.db.commit()
            saved = existing
        else:
            # Create new save
            saved = HMSavedJob(
                hm_user_id=user.id,
                job_posting_id=job_posting_id,
                notes=notes,
            )
            self.db.add(saved)
            self.db.commit()
            self.db.refresh(saved)

        # Get candidate interest count
        interest_count = self.db.query(func.count(Match.id)).filter(
            Match.job_posting_id == job_posting_id
        ).scalar() or 0

        return HMSavedJobResponse(
            id=str(saved.id),
            job_posting_id=job.id,
            job_title=job.title,
            service_line=job.service_line,
            location=job.location,
            is_active=job.is_active,
            notes=saved.notes,
            saved_at=saved.created_at,
            candidate_interest_count=interest_count,
        )

    def get_my_jobs(self, user: UserProfile) -> HMSavedJobsListResponse:
        """Get all jobs saved by this HM."""
        self._verify_hm_account(user)

        saved_jobs = (
            self.db.query(HMSavedJob)
            .filter(HMSavedJob.hm_user_id == user.id)
            .order_by(HMSavedJob.created_at.desc())
            .all()
        )

        items = []
        for saved in saved_jobs:
            job = saved.job_posting

            # Get candidate interest count
            interest_count = self.db.query(func.count(Match.id)).filter(
                Match.job_posting_id == job.id
            ).scalar() or 0

            items.append(HMSavedJobResponse(
                id=str(saved.id),
                job_posting_id=job.id,
                job_title=job.title,
                service_line=job.service_line,
                location=job.location,
                is_active=job.is_active,
                notes=saved.notes,
                saved_at=saved.created_at,
                candidate_interest_count=interest_count,
            ))

        return HMSavedJobsListResponse(jobs=items, total_count=len(items))

    def unsave_job(self, user: UserProfile, saved_job_id: str) -> bool:
        """Remove a job from HM's 'My Jobs' list."""
        self._verify_hm_account(user)

        saved = self.db.query(HMSavedJob).filter(
            HMSavedJob.id == saved_job_id,
            HMSavedJob.hm_user_id == user.id,
        ).first()

        if not saved:
            return False

        self.db.delete(saved)
        self.db.commit()
        return True

    def update_job_notes(
        self,
        user: UserProfile,
        saved_job_id: str,
        notes: Optional[str],
    ) -> HMSavedJobResponse:
        """Update notes on a saved job."""
        self._verify_hm_account(user)

        saved = self.db.query(HMSavedJob).filter(
            HMSavedJob.id == saved_job_id,
            HMSavedJob.hm_user_id == user.id,
        ).first()

        if not saved:
            raise ValueError("Saved job not found")

        saved.notes = notes
        self.db.commit()
        self.db.refresh(saved)

        job = saved.job_posting
        interest_count = self.db.query(func.count(Match.id)).filter(
            Match.job_posting_id == job.id
        ).scalar() or 0

        return HMSavedJobResponse(
            id=str(saved.id),
            job_posting_id=job.id,
            job_title=job.title,
            service_line=job.service_line,
            location=job.location,
            is_active=job.is_active,
            notes=saved.notes,
            saved_at=saved.created_at,
            candidate_interest_count=interest_count,
        )

    # ============================================================
    # Candidate Interest (ANONYMIZED)
    # ============================================================

    def get_candidate_interest(
        self,
        user: UserProfile,
        job_posting_id: str,
    ) -> CandidateInterestResponse:
        """
        Get ANONYMIZED candidate interest data for a job posting.

        CRITICAL PRIVACY REQUIREMENTS:
        - This method MUST NOT return any PII
        - Only aggregate counts and distributions
        - No way to identify individual candidates
        """
        self._verify_hm_account(user)

        # Verify HM has saved this job
        saved = self.db.query(HMSavedJob).filter(
            HMSavedJob.hm_user_id == user.id,
            HMSavedJob.job_posting_id == job_posting_id,
        ).first()

        if not saved:
            raise ValueError(
                "You can only view candidate interest for jobs in your 'My Jobs' list"
            )

        job = self.db.query(JobPosting).filter(
            JobPosting.id == job_posting_id
        ).first()

        if not job:
            raise ValueError("Job posting not found")

        # Get all matches for this job (candidates who saved it)
        matches = self.db.query(Match).filter(
            Match.job_posting_id == job_posting_id
        ).all()

        total_interested = len(matches)

        if total_interested == 0:
            return CandidateInterestResponse(
                job_posting_id=job_posting_id,
                job_title=job.title,
                total_interested=0,
                fit_distribution=FitLevelDistribution(),
                average_overall_score=None,
                average_skill_match=None,
                common_skill_gaps=[],
                candidates=[],
                last_updated=datetime.now(timezone.utc),
            )

        # Calculate fit distribution and collect individual candidate data
        fit_distribution = FitLevelDistribution()
        overall_scores = []
        skill_scores = []
        all_skill_gaps = []
        anonymized_candidates = []

        for idx, match in enumerate(matches, start=1):
            score = float(match.overall_score)
            skill_score = float(match.skill_match_score)
            overall_scores.append(score)
            skill_scores.append(skill_score)

            # Collect skill gaps (just the skill names, no user info)
            if match.skill_gaps:
                all_skill_gaps.extend(match.skill_gaps)

            # Determine fit level
            if score >= 0.8:
                fit_distribution.strong_fit += 1
                fit_level = "strong_fit"
            elif score >= 0.65:
                fit_distribution.good_fit += 1
                fit_level = "good_fit"
            elif score >= 0.5:
                fit_distribution.moderate_fit += 1
                fit_level = "moderate_fit"
            else:
                fit_distribution.developing += 1
                fit_level = "developing"

            # Create anonymized candidate detail
            anonymized_candidates.append(AnonymizedCandidateDetail(
                candidate_label=f"Candidate {idx}",
                overall_score=round(score, 3),
                skill_match_score=round(skill_score, 3),
                matched_skills=match.matched_skills or [],
                transferable_skills=[],  # Not stored in Match model currently
                skill_gaps=match.skill_gaps or [],
                fit_level=fit_level,
            ))

        # Calculate averages
        avg_overall = sum(overall_scores) / len(overall_scores) if overall_scores else None
        avg_skill = sum(skill_scores) / len(skill_scores) if skill_scores else None

        # Calculate common skill gaps (top 10)
        gap_counts = Counter(all_skill_gaps)
        common_gaps = []
        for skill, count in gap_counts.most_common(10):
            common_gaps.append(SkillGapSummary(
                skill_name=skill,
                candidates_missing=count,
                percentage_missing=round((count / total_interested) * 100, 1),
            ))

        # Sort candidates by overall score (best fit first)
        anonymized_candidates.sort(key=lambda c: c.overall_score, reverse=True)

        return CandidateInterestResponse(
            job_posting_id=job_posting_id,
            job_title=job.title,
            total_interested=total_interested,
            fit_distribution=fit_distribution,
            average_overall_score=round(avg_overall, 3) if avg_overall else None,
            average_skill_match=round(avg_skill, 3) if avg_skill else None,
            common_skill_gaps=common_gaps,
            candidates=anonymized_candidates,
            last_updated=datetime.now(timezone.utc),
        )
