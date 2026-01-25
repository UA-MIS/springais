"""
Matching Engine Service.

Implements AI-powered job matching with three modes:
- Best Fit: Conservative matches (90%+ skill match)
- Stretch: Ambitious matches (70-85% skill match)
- Exploratory: Career pivot opportunities (50-70% skill match)

Uses real database models and vector embeddings for semantic skill matching.
"""

import logging
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.job_posting import JobPosting
from app.models.employee import Employee
from app.models.user_profile import UserProfile
from app.models.skill_embedding import SkillEmbedding
from app.utils.text import normalize_skill_text
from app.services.skill_taxonomy import get_taxonomy_service

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

logger = logging.getLogger(__name__)


@dataclass
class EmployeeProfile:
    id: str
    name: str
    current_role: str
    role_level: int
    experience_years: Optional[float]  # None means unknown/not provided
    service_line: str
    skills: List[str]
    skill_embeddings: Dict[str, List[float]]


@dataclass
class JobPostingData:
    id: str
    title: str
    department: str
    service_line: str
    location: str
    description: str
    required_skills: List[str]
    preferred_skills: List[str]
    experience_years_min: Optional[int]
    experience_years_max: Optional[int]
    salary_range: Optional[str]
    posting_url: Optional[str]
    role_level: int
    skill_embeddings: Dict[str, List[float]]


@dataclass
class MatchCandidate:
    """Internal representation of a match candidate during scoring."""
    job: "JobPostingData"
    skill_score: float = 0.0
    experience_score: float = 0.0
    role_fit_score: float = 0.0  # Embedding similarity between resume and job
    overall_score: float = 0.0
    gap_analysis: Optional[SkillGapAnalysis] = None


class MatchingService:
    """
    AI-powered job matching service.

    Implements simplified scoring based on hiring research:
    - 80% skill match (strongest predictor of job success)
    - 10% experience fit (low but useful validity)
    - 10% role fit (holistic alignment via embedding similarity)

    Example:
        >>> service = MatchingService(db=db, user_profile=user)
        >>> matches = service.find_matches_for_employee(employee_id=1)
        >>> print(matches[0].scores.overall)
        0.82
    """

    def __init__(
        self,
        db: Optional[Session] = None,
        user_profile: Optional[UserProfile] = None,
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
        self.db = db
        self.user_profile = user_profile
        self.config = get_matching_config(
            mode=mode,
            top_k=top_k,
            min_overall_score=min_overall_score,
        )
        # Cache for skill embeddings to avoid repeated DB queries
        self._embedding_cache: Dict[str, List[float]] = {}

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
        results, _total = self.find_matches_for_employee_with_total(
            employee_id=employee_id,
            department_filter=department_filter,
            location_filter=location_filter,
        )
        return results

    def find_matches_for_employee_with_total(
        self,
        employee_id: int,
        department_filter: Optional[str] = None,
        location_filter: Optional[str] = None,
    ) -> tuple[List[MatchResult], int]:
        # Pre-load all embeddings in one query to avoid N+1 problem
        self._preload_all_embeddings()

        employee = self._get_employee_profile(employee_id)
        if not employee:
            raise ValueError("Employee not found")

        job_postings = self._get_filtered_jobs(department_filter, location_filter)

        candidates = []
        for job in job_postings:
            if not is_valid_role_transition(employee.role_level, job.role_level):
                continue
            candidate = self._score_candidate(employee, job)
            candidates.append(candidate)

        filtered = self._filter_by_mode(candidates)
        total_count = len(filtered)

        filtered.sort(key=lambda c: c.overall_score, reverse=True)
        top_matches = filtered[:self.config.top_k]

        results = [self._to_match_result(c) for c in top_matches]
        return results, total_count

    def get_detailed_match(
        self,
        employee_id: int,
        job_id: str,
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
        # Preload embeddings for semantic matching
        self._preload_all_embeddings()

        employee = self._get_employee_profile(employee_id)
        if not employee:
            raise ValueError("Employee not found")

        job = self._get_job_by_id(str(job_id))
        if not job:
            raise ValueError("Job posting not found")

        candidate = self._score_candidate(employee, job)
        return self._to_match_result_detail(candidate, employee)

    def analyze_skill_gaps(
        self,
        employee_id: int,
        job_id: str,
    ) -> SkillGapAnalysis:
        """
        Analyze skill gaps between an employee and a job posting.

        Args:
            employee_id: The employee's ID
            job_id: The job posting ID

        Returns:
            SkillGapAnalysis with overlapping, missing, and transferable skills
        """
        # Preload embeddings for semantic matching
        self._preload_all_embeddings()

        employee = self._get_employee_profile(employee_id)
        if not employee:
            raise ValueError("Employee not found")

        job = self._get_job_by_id(str(job_id))
        if not job:
            raise ValueError("Job posting not found")

        return self._calculate_skill_gaps(employee, job)

    # ============================================
    # Scoring Methods
    # ============================================

    def _score_candidate(
        self,
        employee: "EmployeeProfile",
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
        candidate.role_fit_score = self._calculate_role_fit_score(employee, job)

        # Calculate weighted overall score (80% skill, 10% experience, 10% role fit)
        weights = self.config.weights
        candidate.overall_score = (
            candidate.skill_score * weights.skill +
            candidate.experience_score * weights.experience +
            candidate.role_fit_score * weights.role_fit
        )

        # Calculate skill gaps
        candidate.gap_analysis = self._calculate_skill_gaps(employee, job)

        return candidate

    def _calculate_skill_match_score(
        self,
        employee: "EmployeeProfile",
        job: "JobPostingData",
    ) -> float:
        """
        Calculate semantic skill match score using:
        1. Skill taxonomy (parent/child/alias relationships) - fast and accurate
        2. Cosine similarity on embeddings - semantic matching
        3. Fuzzy token matching as fallback

        Args:
            employee: The employee with skill embeddings
            job: The job posting with required skill embeddings

        Returns:
            Skill match score between 0.0 and 1.0
        """
        required_skills = self._effective_required_skills(job)
        if not required_skills:
            return 0.0  # No skills listed = no signal

        if not employee.skills:
            return 0.0  # No skills = no match

        # Get taxonomy service for relationship matching
        taxonomy = get_taxonomy_service()

        matches = []
        employee_skills_lower = {s.lower() for s in employee.skills}

        # Get embeddings for fallback
        employee_embeddings = [
            employee.skill_embeddings.get(skill)
            for skill in employee.skills
            if skill in employee.skill_embeddings
        ]

        for required_skill in required_skills:
            # 1. Check taxonomy-based coverage first (fast, accurate)
            # This handles aliases, parent/child relationships, and implied skills
            taxonomy_score = taxonomy.calculate_skill_coverage(
                employee.skills, required_skill
            )
            if taxonomy_score > 0:
                matches.append(taxonomy_score)
                continue

            # 2. Check for exact string match (case-insensitive)
            if required_skill.lower() in employee_skills_lower:
                matches.append(1.0)
                continue

            # 3. Try embedding similarity
            job_embedding = job.skill_embeddings.get(required_skill)
            if job_embedding is None or not employee_embeddings:
                # No embedding available, try fuzzy matching
                fuzzy_score = self._fuzzy_token_match_score(employee.skills, [required_skill])
                matches.append(fuzzy_score)
                continue

            # Find best matching employee skill using embeddings
            best_similarity = 0.0
            for emp_embedding in employee_embeddings:
                if emp_embedding is not None:
                    similarity = self._cosine_similarity(emp_embedding, job_embedding)
                    best_similarity = max(best_similarity, similarity)

            matches.append(best_similarity)

        # Return average of best matches
        return sum(matches) / len(matches) if matches else 0.0

    def _calculate_experience_score(
        self,
        user_years: Optional[float],
        job_min_years: Optional[int],
        job_max_years: Optional[int],
    ) -> float:
        """
        Calculate experience alignment score.

        Args:
            user_years: Employee's years of experience
            job_min_years: Job's minimum required years
            job_max_years: Job's maximum years

        Returns:
            Experience score between 0.0 and 1.0

        Scoring logic:
        - If user has no experience data, return 0 (not 100%)
        - If job has no requirements, assume entry-level friendly
        - In range: 1.0 (perfect)
        - Under-qualified: linear decay (-15% per year under)
        - Over-qualified: slight penalty (-5% per year over, floor at 50%)
        """
        # If user has no experience data, assume entry-level (0-2 years)
        # This ensures jobs requiring 8+ years get penalized appropriately
        if user_years is None:
            logger.debug("No user experience data, assuming entry-level (1 year)")
            user_years = 1.0  # Assume entry-level

        # If job has no experience requirements, assume entry-level friendly
        if job_min_years is None and job_max_years is None:
            logger.debug("No job experience requirements, using entry-level heuristic")
            return 0.8 if user_years <= 3 else 0.5  # Slight penalty for overqualified

        # If only min specified, assume no max cap (add reasonable upper bound)
        if job_max_years is None:
            job_max_years = job_min_years + 10  # Reasonable upper bound

        if job_min_years is None:
            job_min_years = 0

        # Score based on fit
        if job_min_years <= user_years <= job_max_years:
            return 1.0
        elif user_years < job_min_years:
            # Underqualified: linear decay
            gap = job_min_years - user_years
            score = max(0.0, 1.0 - (gap * 0.15))  # -15% per year under
            logger.debug(f"Underqualified by {gap} years, score: {score}")
            return score
        else:
            # Overqualified: slight penalty
            gap = user_years - job_max_years
            score = max(0.5, 1.0 - (gap * 0.05))  # -5% per year over, floor at 50%
            logger.debug(f"Overqualified by {gap} years, score: {score}")
            return score

    def _calculate_role_fit_score(
        self,
        employee: "EmployeeProfile",
        job: "JobPostingData",
    ) -> float:
        """
        Calculate role fit score using embedding similarity.

        Compares the user's resume embedding with the job description embedding
        to capture holistic alignment that skill keywords might miss:
        - Communication style and language
        - Industry/domain familiarity
        - Soft skills implied by experience
        - Overall career trajectory alignment

        Args:
            employee: The employee profile
            job: The job posting

        Returns:
            Role fit score between 0.0 and 1.0 (cosine similarity)
        """
        # Get user's resume embedding from user_profile
        resume_embedding = None
        if self.user_profile and self.user_profile.resume_embedding is not None:
            resume_embedding = self.user_profile.resume_embedding

        # Get job's description embedding
        job_embedding = self._get_job_description_embedding(job.id)

        # If either embedding is missing, return neutral score
        if resume_embedding is None or job_embedding is None:
            logger.debug(f"Missing embedding for role fit: resume={resume_embedding is not None}, job={job_embedding is not None}")
            return 0.5  # Neutral score when we can't calculate

        # Calculate cosine similarity
        try:
            resume_vec = np.array(resume_embedding)
            job_vec = np.array(job_embedding)

            # Normalize vectors
            resume_norm = np.linalg.norm(resume_vec)
            job_norm = np.linalg.norm(job_vec)

            if resume_norm == 0 or job_norm == 0:
                return 0.5

            # Cosine similarity
            similarity = np.dot(resume_vec, job_vec) / (resume_norm * job_norm)

            # Clamp to [0, 1] range (similarity can be negative for very different vectors)
            return float(max(0.0, min(1.0, similarity)))

        except Exception as e:
            logger.warning(f"Error calculating role fit: {e}")
            return 0.5

    def _get_job_description_embedding(self, job_id: str) -> Optional[List[float]]:
        """Get job description embedding from database."""
        try:
            job = self.db.query(JobPosting).filter(JobPosting.id == job_id).first()
            if job and job.description_embedding is not None:
                return list(job.description_embedding)
        except Exception as e:
            logger.debug(f"Error fetching job embedding: {e}")
        return None

    # ============================================
    # Skill Gap Analysis
    # ============================================

    # Similarity thresholds for skill matching
    SKILL_MATCH_THRESHOLD = 0.65  # Semantic match - count as "matched"
    SKILL_TRANSFERABLE_THRESHOLD = 0.50  # Related skill - count as "transferable"

    def _calculate_skill_gaps(
        self,
        employee: "EmployeeProfile",
        job: "JobPostingData",
    ) -> SkillGapAnalysis:
        """
        Analyze skill gaps between employee and job using semantic matching.

        Uses embedding similarity to recognize that skills like
        "Quantitative Data Collection" match "Quantitative Research".

        Thresholds:
        - >= 0.65: Matched (overlapping) - user has this skill
        - >= 0.50: Transferable - user has related skill
        - < 0.50: Gap - user needs to develop this skill

        Args:
            employee: The employee
            job: The job posting

        Returns:
            SkillGapAnalysis with categorized skills
        """
        employee_skills = set(employee.skills or [])
        required_skills = list(self._effective_required_skills(job))
        preferred_skills = set(job.preferred_skills or []) if job.required_skills else set()

        # Get taxonomy for alias/parent-child matching
        taxonomy = get_taxonomy_service()

        overlapping = []
        missing = []
        transferable = []

        for req_skill in required_skills:
            # 1. Check exact string match (case-insensitive)
            if req_skill.lower() in {s.lower() for s in employee_skills}:
                overlapping.append(req_skill)
                continue

            # 2. Check taxonomy-based match (aliases, parent/child relationships)
            taxonomy_score = taxonomy.calculate_skill_coverage(
                list(employee_skills), req_skill
            )
            if taxonomy_score >= 0.70:
                overlapping.append(req_skill)
                continue

            # 3. Check embedding similarity
            req_embedding = job.skill_embeddings.get(req_skill)
            if req_embedding is not None:
                best_similarity = 0.0
                best_matching_skill = None

                for emp_skill in employee_skills:
                    emp_embedding = employee.skill_embeddings.get(emp_skill)
                    if emp_embedding is not None:
                        similarity = self._cosine_similarity(emp_embedding, req_embedding)
                        if similarity > best_similarity:
                            best_similarity = similarity
                            best_matching_skill = emp_skill

                # Determine category based on similarity
                if best_similarity >= self.SKILL_MATCH_THRESHOLD:
                    # Strong semantic match - count as matched
                    overlapping.append(req_skill)
                    logger.debug(
                        f"Semantic match: '{best_matching_skill}' -> '{req_skill}' "
                        f"(similarity: {best_similarity:.3f})"
                    )
                    continue
                elif best_similarity >= self.SKILL_TRANSFERABLE_THRESHOLD:
                    # Partial match - count as transferable
                    transferable.append(f"{req_skill} (via {best_matching_skill})")
                    continue

            # 4. No match - this is a genuine skill gap
            missing.append(req_skill)

        # Also add any preferred skills the user has
        for pref_skill in preferred_skills:
            if pref_skill.lower() in {s.lower() for s in employee_skills}:
                if pref_skill not in overlapping:
                    transferable.append(pref_skill)

        return SkillGapAnalysis(
            overlapping_skills=overlapping,
            missing_skills=missing,
            transferable_skills=transferable,
            gap_count=len(missing),
        )

    def _effective_required_skills(self, job: "JobPostingData") -> List[str]:
        if job.required_skills:
            return job.required_skills
        if job.preferred_skills:
            return job.preferred_skills
        return []

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

    def _fuzzy_token_match_score(
        self,
        employee_skills: List[str],
        job_skills: List[str],
    ) -> float:
        """
        Fuzzy matching using Jaccard similarity on word tokens.

        Computes token-based similarity between employee skills and job skills.
        For each job skill, finds the best matching employee skill using
        Jaccard similarity on word tokens.

        Args:
            employee_skills: List of employee skills
            job_skills: List of required job skills

        Returns:
            Average of best Jaccard similarities for each job skill
        """
        if not job_skills:
            return 1.0
        if not employee_skills:
            return 0.0

        def tokenize(skill: str) -> set:
            """Tokenize a skill into lowercase words."""
            return set(skill.lower().split())

        def jaccard_similarity(set1: set, set2: set) -> float:
            """Calculate Jaccard similarity between two sets."""
            if not set1 or not set2:
                return 0.0
            intersection = len(set1 & set2)
            union = len(set1 | set2)
            return intersection / union if union > 0 else 0.0

        employee_tokens = [tokenize(s) for s in employee_skills]
        matches = []

        for job_skill in job_skills:
            job_tokens = tokenize(job_skill)
            best_similarity = 0.0
            for emp_tokens in employee_tokens:
                similarity = jaccard_similarity(job_tokens, emp_tokens)
                best_similarity = max(best_similarity, similarity)
            matches.append(best_similarity)

        return sum(matches) / len(matches) if matches else 0.0

    def _get_filtered_jobs(
        self,
        department: Optional[str] = None,
        location: Optional[str] = None,
    ) -> List["JobPostingData"]:
        """
        Get job postings with optional filters.

        Args:
            department: Optional department filter
            location: Optional location filter

        Returns:
            List of matching job postings
        """
        if not self.db:
            logger.warning("No database session available, returning empty job list")
            return []

        query = self.db.query(JobPosting).filter(JobPosting.is_active == True)
        if department:
            query = query.filter(JobPosting.service_line.ilike(f"%{department}%"))
        if location:
            query = query.filter(JobPosting.location.ilike(f"%{location}%"))
        jobs = query.all()
        return [self._to_job_posting_data(job) for job in jobs]

    def _get_employee_profile(self, employee_id: int) -> Optional["EmployeeProfile"]:
        if self.user_profile:
            mapped_employee = self._resolve_employee_from_user()
            if mapped_employee:
                return EmployeeProfile(
                    id=str(mapped_employee.id),
                    name=self.user_profile.full_name or "User",
                    current_role=mapped_employee.current_role,
                    role_level=mapped_employee.role_level,
                    experience_years=float(mapped_employee.years_experience),
                    service_line=mapped_employee.service_line,
                    skills=mapped_employee.skills or [],
                    skill_embeddings=self._build_skill_embeddings(mapped_employee.skills or []),
                )

            # Don't default experience - None means unknown
            exp_years = None
            if self.user_profile.years_experience is not None:
                exp_years = float(self.user_profile.years_experience)

            return EmployeeProfile(
                id=str(self.user_profile.id),
                name=self.user_profile.full_name or "User",
                current_role=self.user_profile.current_role or "Employee",
                role_level=3,
                experience_years=exp_years,
                service_line=self.user_profile.target_service_line or "General",
                skills=self.user_profile.skills or [],
                skill_embeddings=self._build_skill_embeddings(self.user_profile.skills or []),
            )

        # No mock data fallback - require database or user profile
        return None

    def _get_job_by_id(self, job_id: str) -> Optional["JobPostingData"]:
        if self.db:
            job = self.db.query(JobPosting).filter(JobPosting.id == job_id).first()
            if job:
                return self._to_job_posting_data(job)
        # No mock data fallback - require database
        return None

    def _to_job_posting_data(self, job: JobPosting) -> JobPostingData:
        # Use LLM-extracted skills if available, fall back to regex-extracted
        if job.llm_required_skills:
            required_skills = [s["name"] for s in job.llm_required_skills if isinstance(s, dict) and s.get("name")]
        else:
            required_skills = job.required_skills or []

        if job.llm_inferred_skills:
            # Include inferred skills in preferred skills
            inferred_skills = [s["name"] for s in job.llm_inferred_skills if isinstance(s, dict) and s.get("name")]
            preferred_skills = (job.preferred_skills or []) + inferred_skills
        else:
            preferred_skills = job.preferred_skills or []

        # Use LLM experience years if available
        exp_min = job.llm_experience_years_min if job.llm_experience_years_min is not None else job.experience_years_min
        exp_max = job.llm_experience_years_max if job.llm_experience_years_max is not None else job.experience_years_max

        skills_for_embeddings = required_skills + preferred_skills
        return JobPostingData(
            id=str(job.id),
            title=job.title,
            department=job.service_line,
            service_line=job.service_line,
            location=job.location,
            description=job.description,
            required_skills=required_skills,
            preferred_skills=preferred_skills,
            experience_years_min=exp_min,
            experience_years_max=exp_max,
            salary_range=None,
            posting_url=job.posting_url,
            role_level=3,
            skill_embeddings=self._build_skill_embeddings(skills_for_embeddings),
        )

    def _preload_all_embeddings(self) -> None:
        """
        Pre-load ALL skill embeddings from database into cache.

        This prevents N+1 query problem when processing thousands of jobs.
        Called once at the start of matching to load all embeddings in a single query.
        """
        if not self.db:
            return  # No DB available
        if len(self._embedding_cache) > 1000:
            return  # Already fully loaded

        logger.info("Pre-loading all skill embeddings into cache...")
        results = self.db.query(SkillEmbedding).all()

        for result in results:
            if result.embedding is not None:
                # Cache by normalized text for fast lookup
                self._embedding_cache[result.normalized_text] = list(result.embedding)

        logger.info(f"Loaded {len(self._embedding_cache)} skill embeddings into cache")

    def _build_skill_embeddings(self, skills: List[str]) -> Dict[str, List[float]]:
        """Build skill embeddings from cache or return empty dict."""
        embeddings: Dict[str, List[float]] = {}
        if not self.db:
            return embeddings

        for skill in skills:
            normalized = normalize_skill_text(skill)
            # Look up in cache first (fast path)
            if normalized in self._embedding_cache:
                embeddings[skill] = self._embedding_cache[normalized]
            # Fallback to DB query only if cache miss and cache is empty (not preloaded)
            elif not self._embedding_cache:
                result = self.db.query(SkillEmbedding).filter(
                    SkillEmbedding.normalized_text == normalized
                ).first()
                if result and result.embedding is not None:
                    embeddings[skill] = list(result.embedding)
                    self._embedding_cache[normalized] = embeddings[skill]

        return embeddings

    def _resolve_employee_from_user(self) -> Optional[Employee]:
        if not self.db or not self.user_profile:
            return None

        if self.user_profile.employee_id:
            return self.db.query(Employee).filter(Employee.id == self.user_profile.employee_id).first()

        query = self.db.query(Employee)
        if self.user_profile.target_service_line:
            query = query.filter(Employee.service_line == self.user_profile.target_service_line)

        candidates = query.all()
        if not candidates:
            return None

        user_skills = set((self.user_profile.skills or []))
        if not user_skills:
            chosen = candidates[0]
        else:
            chosen = max(
                candidates,
                key=lambda emp: len(user_skills & set(emp.skills or [])),
            )

        self.user_profile.employee_id = chosen.id
        self.db.add(self.user_profile)
        self.db.commit()
        return chosen

    def _filter_by_mode(
        self,
        candidates: List[MatchCandidate],
    ) -> List[MatchCandidate]:
        """
        Filter candidates based on minimum score threshold.

        With unified scoring (80% skill, 10% experience, 10% role fit),
        all modes use the same weights. Filtering is just by min_overall_score.

        Args:
            candidates: List of scored candidates

        Returns:
            Filtered list of candidates meeting minimum score
        """
        min_score = self.config.min_overall_score

        return [c for c in candidates if c.overall_score >= min_score]

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
            role_fit=round(candidate.role_fit_score, 4),
            overall=round(candidate.overall_score, 4),
        )

        return MatchResult(
            job_id=str(job.id),
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
            required_skills=self._effective_required_skills(job),
            preferred_skills=job.preferred_skills or [],
            experience_years_min=job.experience_years_min,
            experience_years_max=job.experience_years_max,
            salary_range=job.salary_range,
            job_posting_url=job.posting_url,
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
