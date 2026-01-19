"""
Matching Engine Service.

Implements AI-powered job matching with three modes:
- Best Fit: Conservative matches (90%+ skill match)
- Stretch: Ambitious matches (70-85% skill match)
- Exploratory: Career pivot opportunities (50-70% skill match)

This implementation uses mock data for testing. In Block O (Integration),
this will be connected to real database models from Block C.
"""

from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import numpy as np

from ..config.matching_config import (
    MatchMode,
    MatchingConfig,
    get_matching_config,
    is_valid_role_transition,
)
from ..schemas.match_result import (
    SkillGapAnalysis,
    MatchScores,
    MatchResult,
    MatchResultDetail,
    MatchModeEnum,
)

# Import mock data - will be replaced with DB queries in Block O
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))
try:
    from tests.fixtures.mock_data import (
        MockEmployee,
        MockJobPosting,
        MOCK_EMPLOYEES,
        MOCK_JOB_POSTINGS,
        MOCK_SKILL_EMBEDDINGS,
        get_mock_employee,
        get_mock_job_posting,
    )
except ImportError:
    # Fallback for when tests.fixtures is not available
    MockEmployee = None
    MockJobPosting = None
    MOCK_EMPLOYEES = []
    MOCK_JOB_POSTINGS = []
    MOCK_SKILL_EMBEDDINGS = {}
    get_mock_employee = lambda x: None
    get_mock_job_posting = lambda x: None


@dataclass
class MatchCandidate:
    """Internal representation of a match candidate during scoring."""
    job: "MockJobPosting"
    skill_score: float = 0.0
    experience_score: float = 0.0
    growth_score: float = 0.0
    overall_score: float = 0.0
    gap_analysis: Optional[SkillGapAnalysis] = None


class MatchingService:
    """
    AI-powered job matching service.

    Implements semantic skill matching using cosine similarity,
    multi-factor scoring, and three distinct matching modes.

    Attributes:
        config: Matching configuration for the current mode

    Example:
        >>> service = MatchingService(mode=MatchMode.STRETCH)
        >>> matches = service.find_matches_for_employee(employee_id=1)
        >>> print(matches[0].scores.overall)
        0.82
    """

    def __init__(
        self,
        mode: MatchMode = MatchMode.BEST_FIT,
        top_k: int = 10,
        min_overall_score: float = 0.5,
    ):
        """
        Initialize the matching service.

        Args:
            mode: Matching mode (best_fit, stretch, exploratory)
            top_k: Number of top matches to return
            min_overall_score: Minimum overall score threshold
        """
        self.config = get_matching_config(
            mode=mode,
            top_k=top_k,
            min_overall_score=min_overall_score,
        )

    # ============================================
    # Public API Methods
    # ============================================

    def find_matches_for_employee(
        self,
        employee_id: int,
        department_filter: Optional[str] = None,
        location_filter: Optional[str] = None,
    ) -> List[MatchResult]:
        """
        Find top job matches for an employee.

        Args:
            employee_id: The employee's ID
            department_filter: Optional department filter
            location_filter: Optional location filter

        Returns:
            List of MatchResult sorted by overall score (descending)

        Raises:
            ValueError: If employee not found
        """
        # Get employee (mock data for now)
        employee = get_mock_employee(employee_id)
        if not employee:
            raise ValueError(f"Employee {employee_id} not found")

        # Get all job postings (mock data for now)
        job_postings = self._get_filtered_jobs(department_filter, location_filter)

        # Score all candidates
        candidates = []
        for job in job_postings:
            # Skip invalid role transitions
            if not is_valid_role_transition(employee.role_level, job.role_level):
                continue

            candidate = self._score_candidate(employee, job)
            candidates.append(candidate)

        # Filter by mode-specific thresholds and minimum score
        filtered = self._filter_by_mode(candidates)

        # Sort by overall score and take top K
        filtered.sort(key=lambda c: c.overall_score, reverse=True)
        top_matches = filtered[:self.config.top_k]

        # Convert to MatchResult
        results = [self._to_match_result(c) for c in top_matches]

        return results

    def get_detailed_match(
        self,
        employee_id: int,
        job_id: int,
    ) -> MatchResultDetail:
        """
        Get detailed match information for a specific employee-job pair.

        Args:
            employee_id: The employee's ID
            job_id: The job posting ID

        Returns:
            Detailed match result with all scoring components

        Raises:
            ValueError: If employee or job not found
        """
        employee = get_mock_employee(employee_id)
        if not employee:
            raise ValueError(f"Employee {employee_id} not found")

        job = get_mock_job_posting(job_id)
        if not job:
            raise ValueError(f"Job posting {job_id} not found")

        candidate = self._score_candidate(employee, job)
        return self._to_match_result_detail(candidate, employee)

    def analyze_skill_gaps(
        self,
        employee_id: int,
        job_id: int,
    ) -> SkillGapAnalysis:
        """
        Analyze skill gaps between an employee and a job posting.

        Args:
            employee_id: The employee's ID
            job_id: The job posting ID

        Returns:
            SkillGapAnalysis with overlapping, missing, and transferable skills
        """
        employee = get_mock_employee(employee_id)
        if not employee:
            raise ValueError(f"Employee {employee_id} not found")

        job = get_mock_job_posting(job_id)
        if not job:
            raise ValueError(f"Job posting {job_id} not found")

        return self._calculate_skill_gaps(employee, job)

    # ============================================
    # Scoring Methods
    # ============================================

    def _score_candidate(
        self,
        employee: "MockEmployee",
        job: "MockJobPosting",
    ) -> MatchCandidate:
        """
        Calculate all score components for an employee-job pair.

        Args:
            employee: The employee
            job: The job posting

        Returns:
            MatchCandidate with all scores calculated
        """
        candidate = MatchCandidate(job=job)

        # Calculate individual scores
        candidate.skill_score = self._calculate_skill_match_score(employee, job)
        candidate.experience_score = self._calculate_experience_score(
            employee.experience_years,
            job.experience_years_min,
            job.experience_years_max,
        )
        candidate.growth_score = self._calculate_growth_potential_score(
            employee, job
        )

        # Calculate weighted overall score
        weights = self.config.weights
        candidate.overall_score = (
            candidate.skill_score * weights.skill +
            candidate.experience_score * weights.experience +
            candidate.growth_score * weights.growth
        )

        # Calculate skill gaps
        candidate.gap_analysis = self._calculate_skill_gaps(employee, job)

        return candidate

    def _calculate_skill_match_score(
        self,
        employee: "MockEmployee",
        job: "MockJobPosting",
    ) -> float:
        """
        Calculate semantic skill match score using cosine similarity.

        For each required job skill, find the best matching employee skill
        using vector similarity. Return the average of best matches.

        Args:
            employee: The employee with skill embeddings
            job: The job posting with required skill embeddings

        Returns:
            Skill match score between 0.0 and 1.0
        """
        if not job.required_skills:
            return 1.0  # No requirements = perfect match

        if not employee.skills:
            return 0.0  # No skills = no match

        # Get embeddings
        employee_embeddings = [
            employee.skill_embeddings.get(skill)
            for skill in employee.skills
            if skill in employee.skill_embeddings
        ]

        if not employee_embeddings:
            # Fallback to exact string matching
            return self._exact_skill_match_score(employee.skills, job.required_skills)

        matches = []
        employee_skills_lower = {s.lower() for s in employee.skills}

        for required_skill in job.required_skills:
            # First, check for exact string match (case-insensitive)
            if required_skill.lower() in employee_skills_lower:
                matches.append(1.0)
                continue

            # No exact match - try embedding similarity
            job_embedding = job.skill_embeddings.get(required_skill)
            if not job_embedding:
                # No embedding available, no match
                matches.append(0.0)
                continue

            # Find best matching employee skill using embeddings
            best_similarity = 0.0
            for emp_embedding in employee_embeddings:
                if emp_embedding:
                    similarity = self._cosine_similarity(emp_embedding, job_embedding)
                    best_similarity = max(best_similarity, similarity)

            matches.append(best_similarity)

        # Return average of best matches
        return sum(matches) / len(matches) if matches else 0.0

    def _calculate_experience_score(
        self,
        user_years: int,
        job_min_years: int,
        job_max_years: int,
    ) -> float:
        """
        Calculate experience alignment score.

        Args:
            user_years: Employee's years of experience
            job_min_years: Job's minimum required years
            job_max_years: Job's maximum years

        Returns:
            Experience score between 0.0 and 1.0

        Formula from CONTEXT.md:
        - In range: 1.0 (perfect)
        - Under-qualified: penalize based on gap
        - Over-qualified: slight penalty (min 0.7)
        """
        if job_min_years <= user_years <= job_max_years:
            return 1.0
        elif user_years < job_min_years:
            # Under-qualified
            gap = job_min_years - user_years
            return max(0.0, 1.0 - (gap / max(job_min_years, 1)))
        else:
            # Over-qualified (slight penalty)
            excess = user_years - job_max_years
            return max(0.7, 1.0 - (excess / 10))

    def _calculate_growth_potential_score(
        self,
        employee: "MockEmployee",
        job: "MockJobPosting",
    ) -> float:
        """
        Calculate growth potential score.

        Factors:
        1. Skill gap (new skills to learn) - 50%
        2. Role level progression - 40%
        3. Cross-domain potential - 10%

        Args:
            employee: The employee
            job: The job posting

        Returns:
            Growth potential score between 0.0 and 1.0
        """
        # Factor 1: Skill gap (more gaps = more growth potential)
        employee_skill_set = set(employee.skills)
        job_skill_set = set(job.required_skills)
        skill_gaps = job_skill_set - employee_skill_set
        skill_gap_factor = min(len(skill_gaps) / 3, 1.0)  # Normalized to 0-1

        # Factor 2: Role level progression
        role_delta = job.role_level - employee.role_level
        role_factor = min(max(role_delta / 3, 0), 1.0)  # Normalized, 0 for lateral/down

        # Factor 3: Cross-domain potential
        domain_factor = 0.3 if job.service_line != employee.service_line else 0.0

        # Weighted combination
        growth_score = (
            skill_gap_factor * 0.5 +
            role_factor * 0.4 +
            domain_factor * 0.1
        )

        return growth_score

    # ============================================
    # Skill Gap Analysis
    # ============================================

    def _calculate_skill_gaps(
        self,
        employee: "MockEmployee",
        job: "MockJobPosting",
    ) -> SkillGapAnalysis:
        """
        Analyze skill gaps between employee and job.

        Args:
            employee: The employee
            job: The job posting

        Returns:
            SkillGapAnalysis with categorized skills
        """
        employee_skills = set(employee.skills)
        required_skills = set(job.required_skills)
        preferred_skills = set(job.preferred_skills)

        # Exact overlapping skills
        overlapping = list(employee_skills & required_skills)

        # Missing required skills
        missing = list(required_skills - employee_skills)

        # Transferable: employee skills that match preferred or could help
        transferable = list(employee_skills & preferred_skills)

        # Also check for semantically similar skills that could transfer
        for emp_skill in employee_skills - required_skills - preferred_skills:
            emp_embedding = employee.skill_embeddings.get(emp_skill)
            if not emp_embedding:
                continue

            # Check if any missing skill is semantically close
            for miss_skill in missing:
                miss_embedding = job.skill_embeddings.get(miss_skill)
                if miss_embedding:
                    similarity = self._cosine_similarity(emp_embedding, miss_embedding)
                    if similarity > 0.7 and emp_skill not in transferable:
                        transferable.append(emp_skill)
                        break

        return SkillGapAnalysis(
            overlapping_skills=overlapping,
            missing_skills=missing,
            transferable_skills=transferable,
            gap_count=len(missing),
        )

    # ============================================
    # Helper Methods
    # ============================================

    def _cosine_similarity(
        self,
        vec1: List[float],
        vec2: List[float],
    ) -> float:
        """
        Calculate cosine similarity between two vectors.

        Args:
            vec1: First embedding vector
            vec2: Second embedding vector

        Returns:
            Similarity score between -1 and 1
        """
        if len(vec1) != len(vec2):
            raise ValueError(f"Vector dimensions don't match: {len(vec1)} vs {len(vec2)}")

        vec1_np = np.array(vec1)
        vec2_np = np.array(vec2)

        dot_product = np.dot(vec1_np, vec2_np)
        norm1 = np.linalg.norm(vec1_np)
        norm2 = np.linalg.norm(vec2_np)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        return float(dot_product / (norm1 * norm2))

    def _batch_cosine_similarity(
        self,
        query_vec: List[float],
        candidate_vecs: List[List[float]],
    ) -> List[float]:
        """
        Calculate cosine similarity between query and multiple candidates.

        Args:
            query_vec: Query embedding vector
            candidate_vecs: List of candidate embedding vectors

        Returns:
            List of similarity scores
        """
        query_np = np.array(query_vec)
        candidates_np = np.array(candidate_vecs)

        # Normalize vectors
        query_norm = query_np / np.linalg.norm(query_np)
        candidates_norm = candidates_np / np.linalg.norm(candidates_np, axis=1, keepdims=True)

        # Batch dot product
        similarities = np.dot(candidates_norm, query_norm)

        return similarities.tolist()

    def _exact_skill_match_score(
        self,
        employee_skills: List[str],
        job_skills: List[str],
    ) -> float:
        """
        Fallback to exact string matching for skill score.

        Args:
            employee_skills: List of employee skills
            job_skills: List of required job skills

        Returns:
            Fraction of job skills that employee has
        """
        if not job_skills:
            return 1.0

        employee_set = set(s.lower() for s in employee_skills)
        matches = sum(1 for s in job_skills if s.lower() in employee_set)

        return matches / len(job_skills)

    def _get_filtered_jobs(
        self,
        department: Optional[str] = None,
        location: Optional[str] = None,
    ) -> List["MockJobPosting"]:
        """
        Get job postings with optional filters.

        Args:
            department: Optional department filter
            location: Optional location filter

        Returns:
            List of matching job postings
        """
        jobs = MOCK_JOB_POSTINGS

        if department:
            jobs = [j for j in jobs if j.department.lower() == department.lower()]

        if location:
            jobs = [j for j in jobs if j.location.lower() == location.lower()]

        return jobs

    def _filter_by_mode(
        self,
        candidates: List[MatchCandidate],
    ) -> List[MatchCandidate]:
        """
        Filter candidates based on mode-specific thresholds.

        For Best Fit: prefer high skill match (>= 0.9)
        For Stretch: prefer moderate skill match (0.7-0.85)
        For Exploratory: accept lower skill match, high growth (0.5-0.7)

        Args:
            candidates: List of scored candidates

        Returns:
            Filtered list of candidates
        """
        threshold = self.config.skill_threshold
        min_score = self.config.min_overall_score

        filtered = []
        for c in candidates:
            # Must meet minimum overall score
            if c.overall_score < min_score:
                continue

            # Mode-specific skill threshold filtering
            # For Best Fit, we want high skill matches
            # For Exploratory, we actually want lower skill matches (more growth)
            if self.config.mode == MatchMode.BEST_FIT:
                # Accept if skill threshold met OR overall score is very high
                if c.skill_score >= threshold.min_score or c.overall_score >= 0.75:
                    filtered.append(c)
            elif self.config.mode == MatchMode.STRETCH:
                # Stretch: moderate skill match is ideal
                if threshold.min_score <= c.skill_score <= threshold.max_score:
                    filtered.append(c)
                elif c.skill_score > threshold.max_score:
                    # Also include high matches but prefer stretch range
                    filtered.append(c)
            else:  # Exploratory
                # Exploratory: lower skill match is fine, growth is key
                if c.skill_score >= 0.4 and c.growth_score >= 0.3:
                    filtered.append(c)

        return filtered

    def _to_match_result(
        self,
        candidate: MatchCandidate,
    ) -> MatchResult:
        """
        Convert a MatchCandidate to a MatchResult.

        Args:
            candidate: The scored candidate

        Returns:
            MatchResult for API response
        """
        job = candidate.job

        scores = MatchScores(
            skill_match=round(candidate.skill_score, 4),
            experience_match=round(candidate.experience_score, 4),
            growth_potential=round(candidate.growth_score, 4),
            overall=round(candidate.overall_score, 4),
        )

        return MatchResult(
            job_id=job.id,
            title=job.title,
            department=job.department,
            service_line=job.service_line,
            location=job.location,
            scores=scores,
            gap_analysis=candidate.gap_analysis or SkillGapAnalysis(),
            match_mode=MatchModeEnum(self.config.mode.value),
            explanation=self._generate_explanation(candidate),
        )

    def _to_match_result_detail(
        self,
        candidate: MatchCandidate,
        employee: "MockEmployee",
    ) -> MatchResultDetail:
        """
        Convert a MatchCandidate to a detailed MatchResultDetail.

        Args:
            candidate: The scored candidate
            employee: The employee for context

        Returns:
            MatchResultDetail for API response
        """
        job = candidate.job
        basic = self._to_match_result(candidate)

        return MatchResultDetail(
            job_id=basic.job_id,
            title=basic.title,
            department=basic.department,
            service_line=basic.service_line,
            location=basic.location,
            scores=basic.scores,
            gap_analysis=basic.gap_analysis,
            match_mode=basic.match_mode,
            explanation=basic.explanation,
            job_description=job.description,
            required_skills=job.required_skills,
            preferred_skills=job.preferred_skills,
            experience_years_min=job.experience_years_min,
            experience_years_max=job.experience_years_max,
            salary_range=job.salary_range,
            role_level=job.role_level,
            role_level_delta=job.role_level - employee.role_level,
            success_pattern_insights=None,  # Will be populated in Block F integration
        )

    def _generate_explanation(
        self,
        candidate: MatchCandidate,
    ) -> str:
        """
        Generate a human-readable explanation for the match.

        In production, this would use GPT-5.2 Instant. For now,
        we generate a template-based explanation.

        Args:
            candidate: The scored match candidate

        Returns:
            2-3 sentence explanation
        """
        job = candidate.job
        gap = candidate.gap_analysis

        # Determine match quality
        if candidate.overall_score >= 0.85:
            quality = "excellent"
        elif candidate.overall_score >= 0.7:
            quality = "strong"
        elif candidate.overall_score >= 0.55:
            quality = "good"
        else:
            quality = "potential"

        # Build explanation
        parts = []

        # Opening based on mode
        if self.config.mode == MatchMode.BEST_FIT:
            parts.append(f"This {job.title} role is an {quality} fit for your current skill set.")
        elif self.config.mode == MatchMode.STRETCH:
            parts.append(f"This {job.title} role represents a {quality} stretch opportunity.")
        else:
            parts.append(f"This {job.title} role offers a {quality} career pivot opportunity.")

        # Skill commentary
        if gap and gap.overlapping_skills:
            skills_str = ", ".join(gap.overlapping_skills[:3])
            parts.append(f"Your {skills_str} skills directly apply.")

        # Growth commentary
        if gap and gap.missing_skills:
            missing_str = ", ".join(gap.missing_skills[:2])
            parts.append(f"You'll gain expertise in {missing_str}.")

        return " ".join(parts)


# Convenience functions for API usage

def match_by_skills(
    employee_id: int,
    mode: MatchMode = MatchMode.BEST_FIT,
    top_k: int = 10,
    department: Optional[str] = None,
    location: Optional[str] = None,
) -> List[MatchResult]:
    """
    Find top job matches for an employee by skills.

    Convenience function that creates a MatchingService and finds matches.

    Args:
        employee_id: The employee's ID
        mode: Matching mode
        top_k: Number of results
        department: Optional department filter
        location: Optional location filter

    Returns:
        List of MatchResult sorted by overall score
    """
    service = MatchingService(mode=mode, top_k=top_k)
    return service.find_matches_for_employee(
        employee_id,
        department_filter=department,
        location_filter=location,
    )


def get_match_detail(
    employee_id: int,
    job_id: int,
    mode: MatchMode = MatchMode.BEST_FIT,
) -> MatchResultDetail:
    """
    Get detailed match information for employee-job pair.

    Args:
        employee_id: The employee's ID
        job_id: The job posting ID
        mode: Matching mode for scoring

    Returns:
        Detailed match result
    """
    service = MatchingService(mode=mode)
    return service.get_detailed_match(employee_id, job_id)
