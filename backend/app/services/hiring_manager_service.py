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
from typing import Optional, List, Tuple
from collections import Counter

from sqlalchemy import func, text
from sqlalchemy.orm import Session

from ..models.hm_saved_job import HMSavedJob
from ..models.job_posting import JobPosting
from ..models.match import Match
from ..models.user_profile import UserProfile
from ..models.skill_embedding import SkillEmbedding
from ..utils.text import normalize_skill_text
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

# Similarity thresholds for skill matching (same as matching_service.py)
SKILL_MATCH_THRESHOLD = 0.65  # Semantic match - count as "matched"
SKILL_TRANSFERABLE_THRESHOLD = 0.50  # Related skill - count as "transferable"


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
    # Semantic Skill Matching (pgvector)
    # ============================================================

    def _get_skill_embeddings_by_name(
        self,
        skill_names: List[str],
    ) -> dict:
        """
        Get embeddings for skills by their normalized text.

        Looks up any existing embedding for each skill (regardless of source).
        This matches how the matching service builds skill embeddings.

        Returns dict of skill_name -> embedding vector
        """
        if not skill_names:
            return {}

        embeddings = {}
        for skill in skill_names:
            normalized = normalize_skill_text(skill)
            # Query for any embedding with this normalized text
            result = (
                self.db.query(SkillEmbedding)
                .filter(SkillEmbedding.normalized_text == normalized)
                .first()
            )
            if result and result.embedding is not None:
                embeddings[skill] = result.embedding

        return embeddings

    def _pgvector_best_match(
        self,
        job_skill_embedding: List[float],
        user_id: str,
    ) -> Tuple[float, Optional[str]]:
        """
        Find best matching user skill using pgvector's HNSW index.

        Uses O(log N) similarity search with HNSW index.

        Args:
            job_skill_embedding: The job skill embedding to match against
            user_id: The user's ID to search their skills

        Returns:
            Tuple of (similarity_score, matched_skill_text)
        """
        if not job_skill_embedding:
            return 0.0, None

        try:
            # Format embedding as pgvector-compatible string: '[0.1,0.2,...]'
            embedding_str = '[' + ','.join(str(x) for x in job_skill_embedding) + ']'

            result = self.db.execute(
                text("""
                    SELECT
                        skill_text,
                        1 - (embedding <=> CAST(:embedding AS vector)) as similarity
                    FROM skill_embeddings
                    WHERE source_type = 'user' AND source_id = :user_id
                    ORDER BY embedding <=> CAST(:embedding AS vector)
                    LIMIT 1
                """),
                {
                    "embedding": embedding_str,
                    "user_id": user_id
                }
            ).fetchone()

            if result:
                return float(result.similarity), result.skill_text
            return 0.0, None

        except Exception as e:
            logger.debug(f"pgvector query failed: {e}")
            return 0.0, None

    def _get_job_required_skills(self, job: JobPosting) -> List[str]:
        """
        Get the effective required skills for a job posting.

        Uses LLM-extracted skills if available, falls back to regex-extracted.
        This matches the logic in matching_service.py.
        """
        if job.llm_required_skills:
            return [
                s["name"] for s in job.llm_required_skills
                if isinstance(s, dict) and s.get("name")
            ]
        return job.required_skills or []

    def _compute_transferable_skills(
        self,
        user_id: str,
        job: JobPosting,
        matched_skills: List[str],
    ) -> Tuple[List[str], List[str]]:
        """
        Compute transferable skills for a candidate using pgvector semantic matching.

        Transferable skills are user skills that semantically match job requirements
        with similarity >= 0.50 but < 0.65 (related but not exact match).

        Args:
            user_id: The candidate's user profile ID
            job: The job posting object
            matched_skills: Already matched skills (to exclude)

        Returns:
            Tuple of (transferable_skills, true_skill_gaps)
            - transferable_skills: List in format "Required Skill (via User Skill)"
            - true_skill_gaps: Skills that are genuine gaps (similarity < 0.50)
        """
        transferable = []
        true_gaps = []

        # Get full list of required skills from job (like matching service does)
        required_skills = self._get_job_required_skills(job)
        if not required_skills:
            return transferable, true_gaps

        # Get embeddings for all required skills
        skill_embeddings = self._get_skill_embeddings_by_name(required_skills)

        matched_lower = {s.lower() for s in matched_skills}

        for required_skill in required_skills:
            # Skip already matched skills
            if required_skill.lower() in matched_lower:
                continue

            skill_embedding = skill_embeddings.get(required_skill)
            if skill_embedding is None:
                # No embedding - count as gap
                true_gaps.append(required_skill)
                continue

            # Use pgvector to find best matching user skill
            similarity, user_skill = self._pgvector_best_match(
                list(skill_embedding), user_id
            )

            # Categorize based on similarity threshold
            if similarity >= SKILL_MATCH_THRESHOLD:
                # High similarity - should have been in matched_skills
                # This shouldn't happen often, but skip it
                continue
            elif similarity >= SKILL_TRANSFERABLE_THRESHOLD and user_skill:
                # Transferable skill (>= 0.50 but < 0.65)
                if user_skill.lower() not in matched_lower:
                    transferable.append(f"{required_skill} (via {user_skill})")
                    logger.debug(
                        f"Transferable skill found: '{user_skill}' -> '{required_skill}' "
                        f"(similarity: {similarity:.3f})"
                    )
            else:
                # True gap (< 0.50)
                true_gaps.append(required_skill)

        return transferable, true_gaps

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

            # Compute transferable skills on-demand using pgvector semantic matching
            transferable_skills = []
            final_skill_gaps = match.skill_gaps or []
            if match.user_id:
                try:
                    transferable_skills, final_skill_gaps = self._compute_transferable_skills(
                        user_id=str(match.user_id),
                        job=job,
                        matched_skills=match.matched_skills or [],
                    )
                except Exception as e:
                    logger.warning(f"Failed to compute transferable skills: {e}")
                    # Fall back to stored skill_gaps
                    final_skill_gaps = match.skill_gaps or []

            # Collect final skill gaps for aggregate statistics
            all_skill_gaps.extend(final_skill_gaps)

            # Create anonymized candidate detail
            anonymized_candidates.append(AnonymizedCandidateDetail(
                candidate_label=f"Candidate {idx}",
                overall_score=round(score, 3),
                skill_match_score=round(skill_score, 3),
                matched_skills=match.matched_skills or [],
                transferable_skills=transferable_skills,
                skill_gaps=final_skill_gaps,
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
