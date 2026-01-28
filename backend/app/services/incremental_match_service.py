"""
Incremental match update service.

When a user adds/removes skills, we only need to recalculate
matches affected by those specific skills, not all 2000+ jobs.

This service provides significant performance improvements by:
1. Tracking which skills changed (added/removed)
2. Finding jobs that require those specific skills
3. Only recalculating scores for affected jobs
4. Merging with cached scores for unaffected jobs
"""

import logging
from typing import List, Set, Dict, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.models.job_posting import JobPosting
from app.models.user_profile import UserProfile
from app.config.matching_config import MatchMode

logger = logging.getLogger(__name__)


class IncrementalMatchService:
    """
    Optimized matching that only recalculates affected jobs.

    Strategy:
    1. Track which skills changed (added/removed)
    2. Find jobs that require those specific skills
    3. Only recalculate scores for affected jobs
    4. Merge with cached scores for unaffected jobs
    """

    def __init__(self, db: Session, user: UserProfile):
        self.db = db
        self.user = user

    def get_skill_diff(
        self,
        previous_skills: List[str],
        current_skills: List[str]
    ) -> Dict[str, List[str]]:
        """
        Calculate the difference between previous and current skills.

        Args:
            previous_skills: User's skills before the change
            current_skills: User's skills after the change

        Returns:
            Dict with 'added' and 'removed' skill lists
        """
        prev_set = set(s.lower() for s in previous_skills)
        curr_set = set(s.lower() for s in current_skills)

        added = list(curr_set - prev_set)
        removed = list(prev_set - curr_set)

        return {
            "added": added,
            "removed": removed,
            "unchanged_count": len(prev_set & curr_set)
        }

    def get_affected_jobs(
        self,
        added_skills: List[str],
        removed_skills: List[str]
    ) -> Set[str]:
        """
        Find job IDs that are affected by skill changes.

        Uses database queries to find jobs that require any of the
        changed skills, making this operation efficient even with
        thousands of jobs.

        Args:
            added_skills: Skills that were added
            removed_skills: Skills that were removed

        Returns:
            Set of job IDs that need recalculation
        """
        if not added_skills and not removed_skills:
            return set()

        changed_skills = set(s.lower() for s in added_skills + removed_skills)
        affected_job_ids: Set[str] = set()

        # Build search patterns for each skill
        for skill in changed_skills:
            skill_lower = skill.lower()

            # Search in required_skills array
            jobs_required = self.db.query(JobPosting.id).filter(
                JobPosting.is_active == True,
                func.array_to_string(JobPosting.required_skills, ',').ilike(f'%{skill_lower}%')
            ).all()
            affected_job_ids.update(str(j.id) for j in jobs_required)

            # Search in preferred_skills array
            jobs_preferred = self.db.query(JobPosting.id).filter(
                JobPosting.is_active == True,
                func.array_to_string(JobPosting.preferred_skills, ',').ilike(f'%{skill_lower}%')
            ).all()
            affected_job_ids.update(str(j.id) for j in jobs_preferred)

            # Search in LLM-extracted skills (JSONB)
            # Note: This uses text search on the JSONB column
            if self.db.bind and 'postgresql' in str(self.db.bind.url):
                try:
                    jobs_llm = self.db.query(JobPosting.id).filter(
                        JobPosting.is_active == True,
                        JobPosting.llm_required_skills.cast(str).ilike(f'%{skill_lower}%')
                    ).all()
                    affected_job_ids.update(str(j.id) for j in jobs_llm)
                except Exception as e:
                    logger.debug(f"JSONB search failed (may not be supported): {e}")

        logger.info(f"Found {len(affected_job_ids)} jobs affected by skill changes: "
                   f"added={len(added_skills)}, removed={len(removed_skills)}")
        return affected_job_ids

    async def update_matches_incrementally(
        self,
        previous_skills: List[str],
        current_skills: List[str],
        cached_matches: Dict[str, Dict[str, Any]],
        mode: MatchMode = MatchMode.BEST_FIT
    ) -> List[Dict[str, Any]]:
        """
        Update match scores incrementally.

        This is the main optimization method. Instead of recalculating
        all matches, it:
        1. Determines which skills changed
        2. Finds jobs affected by those changes
        3. Only recalculates affected jobs
        4. Merges with cached scores for unaffected jobs

        Args:
            previous_skills: User's skills before the change
            current_skills: User's skills after the change
            cached_matches: Previously calculated matches {job_id: match_data}
            mode: Matching mode

        Returns:
            Updated list of match results
        """
        diff = self.get_skill_diff(previous_skills, current_skills)
        added_skills = diff["added"]
        removed_skills = diff["removed"]

        if not added_skills and not removed_skills:
            logger.debug("No skill changes, returning cached matches")
            return list(cached_matches.values())

        # Find affected jobs
        affected_job_ids = self.get_affected_jobs(added_skills, removed_skills)

        if not affected_job_ids:
            logger.debug("No jobs affected by skill changes")
            return list(cached_matches.values())

        # Import here to avoid circular dependency
        from app.services.matching_service import MatchingService

        # Initialize matching service for recalculation
        matching_service = MatchingService(
            db=self.db,
            user_profile=self.user,
            mode=mode,
        )

        # Preload embeddings for efficient scoring
        matching_service._preload_all_embeddings()

        updated_matches: Dict[str, Dict[str, Any]] = {}

        # Keep unaffected cached matches
        for job_id, match_data in cached_matches.items():
            if job_id not in affected_job_ids:
                updated_matches[job_id] = match_data

        # Recalculate affected jobs
        recalculated_count = 0
        for job_id in affected_job_ids:
            try:
                job = self.db.query(JobPosting).filter(
                    JobPosting.id == job_id,
                    JobPosting.is_active == True
                ).first()

                if job:
                    # Get detailed match for this specific job
                    try:
                        match_detail = matching_service.get_detailed_match(
                            employee_id=1,  # Will use user_profile
                            job_id=job_id,
                        )
                        updated_matches[job_id] = {
                            "job_id": job_id,
                            "title": match_detail.title,
                            "department": match_detail.department,
                            "service_line": match_detail.service_line,
                            "location": match_detail.location,
                            "scores": {
                                "skill_match": match_detail.scores.skill_match,
                                "experience_match": match_detail.scores.experience_match,
                                "role_fit": match_detail.scores.role_fit,
                                "overall": match_detail.scores.overall,
                            },
                            "gap_analysis": {
                                "overlapping_skills": match_detail.gap_analysis.overlapping_skills,
                                "missing_skills": match_detail.gap_analysis.missing_skills,
                                "transferable_skills": match_detail.gap_analysis.transferable_skills,
                            },
                            "explanation": match_detail.explanation,
                        }
                        recalculated_count += 1
                    except Exception as e:
                        logger.warning(f"Failed to recalculate match for job {job_id}: {e}")
                        # Keep the old cached value if recalculation fails
                        if job_id in cached_matches:
                            updated_matches[job_id] = cached_matches[job_id]
            except Exception as e:
                logger.warning(f"Error processing job {job_id}: {e}")

        logger.info(f"Incremental update complete: recalculated {recalculated_count} jobs, "
                   f"kept {len(updated_matches) - recalculated_count} cached")

        # Sort by score
        result = sorted(
            updated_matches.values(),
            key=lambda m: m.get("scores", {}).get("overall", 0),
            reverse=True
        )

        return result

    def estimate_recalculation_savings(
        self,
        previous_skills: List[str],
        current_skills: List[str],
        total_jobs: int
    ) -> Dict[str, Any]:
        """
        Estimate how much work is saved by incremental updates.

        Useful for monitoring and optimization decisions.

        Args:
            previous_skills: Skills before change
            current_skills: Skills after change
            total_jobs: Total number of active jobs

        Returns:
            Dict with savings metrics
        """
        diff = self.get_skill_diff(previous_skills, current_skills)
        affected_jobs = self.get_affected_jobs(diff["added"], diff["removed"])

        affected_count = len(affected_jobs)
        savings_percent = ((total_jobs - affected_count) / total_jobs * 100) if total_jobs > 0 else 0

        return {
            "total_jobs": total_jobs,
            "affected_jobs": affected_count,
            "cached_jobs": total_jobs - affected_count,
            "savings_percent": round(savings_percent, 1),
            "skills_added": len(diff["added"]),
            "skills_removed": len(diff["removed"]),
            "skills_unchanged": diff["unchanged_count"],
        }
