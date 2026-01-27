"""
Deep Analysis Service using GPT-5.2 with reasoning.

Provides comprehensive AI-powered analysis of candidate-job fit including:
- Multi-paragraph narrative assessment
- Skill impact analysis with gap severity
- Success and risk factor identification
- Learning path recommendations

Uses GPT-5.2 with reasoning_effort="medium" for thoughtful, nuanced analysis.
"""

import json
import logging
import asyncio
from typing import Optional
from uuid import UUID
from concurrent.futures import ThreadPoolExecutor

from openai import AsyncOpenAI, APIError, RateLimitError, APITimeoutError
from sqlalchemy.orm import Session

from app.config import get_openai_client
from app.models.job_posting import JobPosting
from app.models.user_profile import UserProfile
from app.schemas.analysis import (
    ComplexAnalysis,
    SkillImpactAnalysis,
    ImportanceLevel,
    GapSeverity,
)
from app.services.matching_service import MatchingService
from app.config.matching_config import MatchMode

logger = logging.getLogger(__name__)


# ============================================
# Configuration
# ============================================

# Model configuration - GPT-5.2 for deep reasoning
OPENAI_MODEL = "gpt-5.2"
REASONING_EFFORT = "medium"
MAX_TOKENS = 8000
TEMPERATURE = 0.7  # Slightly higher for nuanced narrative generation

# Retry configuration
MAX_RETRIES = 3
RETRY_DELAYS = [2, 4, 8]  # Longer delays for reasoning model

# Cost tracking (GPT-5.2 pricing estimates)
COST_PER_1M_INPUT = 2.50
COST_PER_1M_OUTPUT = 10.00


# ============================================
# Prompt Template
# ============================================

DEEP_ANALYSIS_PROMPT = """You are a senior career advisor and talent analyst. Provide a comprehensive, thoughtful analysis of how well this candidate fits the specified job role.

## CANDIDATE PROFILE:
Name: {candidate_name}
Current Role: {current_role}
Years of Experience: {years_experience}
Skills: {candidate_skills}
Service Line: {service_line}

## JOB POSTING:
Title: {job_title}
Department: {job_department}
Location: {job_location}
Description: {job_description}
Required Skills: {required_skills}
Preferred Skills: {preferred_skills}
Experience Required: {experience_required}

## MATCH ANALYSIS:
Overall Match Score: {overall_score}%
Skill Match Score: {skill_score}%
Experience Match Score: {experience_score}%
Role Fit Score: {role_fit_score}%

Overlapping Skills: {overlapping_skills}
Missing Skills: {missing_skills}
Transferable Skills: {transferable_skills}

## YOUR TASK:
Provide a deep, nuanced analysis in the following JSON format. Be specific, actionable, and honest about both strengths and challenges.

Return ONLY valid JSON (no markdown, no explanation):
{{
    "overall_fit_narrative": "2-3 paragraph analysis of the overall fit. Discuss strengths, areas of alignment, potential challenges, and your honest assessment of whether this is a good match. Be specific about WHY, not just WHAT.",

    "growth_opportunity": "Describe the specific career growth opportunities this role offers. What new skills, responsibilities, or experiences will the candidate gain?",

    "transition_reasoning": "Explain why this career transition does or doesn't make sense. Consider the candidate's trajectory, the market, and long-term career implications.",

    "matched_skill_impacts": [
        {{
            "skill_name": "Name of skill candidate has",
            "importance_level": "critical|important|nice_to_have",
            "why_it_matters": "Why this skill matters for THIS specific role",
            "current_proficiency": "beginner|intermediate|advanced|expert",
            "required_proficiency": "The level needed for the role",
            "gap_severity": "none|minor|moderate|major",
            "learning_estimate": null
        }}
    ],

    "gap_impacts": [
        {{
            "skill_name": "Name of skill candidate lacks",
            "importance_level": "critical|important|nice_to_have",
            "why_it_matters": "Why this skill gap matters",
            "current_proficiency": null,
            "required_proficiency": "The level needed",
            "gap_severity": "minor|moderate|major",
            "learning_estimate": "Realistic time to develop this skill"
        }}
    ],

    "critical_success_factors": [
        "Factor 1: Specific action or condition for success",
        "Factor 2: Another key success factor",
        "Factor 3: Third important factor"
    ],

    "risk_factors": [
        "Risk 1: Specific concern or challenge",
        "Risk 2: Another risk to consider",
        "Risk 3: Third risk factor"
    ],

    "estimated_ramp_up": "Realistic estimate of time to full productivity with context",

    "comparable_roles": [
        "Alternative Role 1",
        "Alternative Role 2",
        "Alternative Role 3"
    ],

    "recommended_learning_path": [
        "Step 1: Specific, actionable learning recommendation",
        "Step 2: Next learning step",
        "Step 3: Additional recommendation"
    ]
}}

Important guidelines:
- Be honest and balanced - don't oversell or undersell the fit
- Provide specific, actionable insights rather than generic advice
- Consider both immediate fit and long-term career trajectory
- Limit matched_skill_impacts to the 5-7 most important matching skills
- Limit gap_impacts to the 3-5 most critical skill gaps
- All time estimates should be realistic and account for the candidate's experience level"""


# ============================================
# Deep Analysis Service
# ============================================

class DeepAnalysisService:
    """
    AI-powered deep analysis service using GPT-5.2 with reasoning.

    Provides comprehensive candidate-job fit analysis with detailed
    narratives, skill impact assessments, and actionable recommendations.

    Usage:
        service = DeepAnalysisService(db)
        analysis = await service.analyze_candidate_job_fit(user, job_id)
    """

    def __init__(self, db: Session):
        """
        Initialize the deep analysis service.

        Args:
            db: Database session for querying job postings and user profiles
        """
        self.db = db
        self._client: Optional[AsyncOpenAI] = None

    @property
    def client(self) -> AsyncOpenAI:
        """Lazy-load OpenAI client."""
        if self._client is None:
            self._client = get_openai_client()
        return self._client

    async def analyze_candidate_job_fit(
        self,
        user: UserProfile,
        job_id: str,
    ) -> ComplexAnalysis:
        """
        Perform deep analysis of candidate-job fit using GPT-5.2.

        Args:
            user: The user profile (candidate)
            job_id: The job posting ID to analyze fit for

        Returns:
            ComplexAnalysis with comprehensive fit assessment

        Raises:
            ValueError: If job posting not found or analysis fails
        """
        # Run blocking DB operations in a thread pool to avoid blocking event loop
        loop = asyncio.get_event_loop()

        def fetch_job_and_match():
            # Get job posting from database
            job = self.db.query(JobPosting).filter(JobPosting.id == job_id).first()
            if not job:
                return None, None

            # Get match details using MatchingService
            matching_service = MatchingService(
                db=self.db,
                user_profile=user,
                mode=MatchMode.BEST_FIT,
            )

            try:
                # Use the user's ID as employee_id for matching
                match_detail = matching_service.get_detailed_match(
                    employee_id=int(str(user.id).replace("-", "")[:8], 16) % 1000000,
                    job_id=job_id,
                )
            except Exception as e:
                logger.warning(f"Could not get match details: {e}, using default scores")
                match_detail = None

            return job, match_detail

        # Execute blocking operations in thread pool
        with ThreadPoolExecutor(max_workers=1) as executor:
            job, match_detail = await loop.run_in_executor(executor, fetch_job_and_match)

        if not job:
            raise ValueError(f"Job posting not found: {job_id}")

        # Build the prompt with all context
        prompt = self._build_prompt(user, job, match_detail)

        # Call GPT-5.2 with reasoning
        analysis = await self._call_gpt_with_retry(prompt)

        return analysis

    def _build_prompt(
        self,
        user: UserProfile,
        job: JobPosting,
        match_detail,
    ) -> str:
        """Build the analysis prompt with all context."""
        # Get skills from job posting (prefer LLM-extracted)
        if job.llm_required_skills:
            required_skills = [s.get("name", s) if isinstance(s, dict) else s
                            for s in job.llm_required_skills]
        else:
            required_skills = job.required_skills or []

        preferred_skills = job.preferred_skills or []

        # Extract match scores if available
        if match_detail:
            overall_score = round(match_detail.scores.overall * 100, 1)
            skill_score = round(match_detail.scores.skill_match * 100, 1)
            experience_score = round(match_detail.scores.experience_match * 100, 1)
            role_fit_score = round(match_detail.scores.role_fit * 100, 1)
            overlapping_skills = match_detail.gap_analysis.overlapping_skills
            missing_skills = match_detail.gap_analysis.missing_skills
            transferable_skills = match_detail.gap_analysis.transferable_skills
        else:
            overall_score = "N/A"
            skill_score = "N/A"
            experience_score = "N/A"
            role_fit_score = "N/A"
            overlapping_skills = []
            missing_skills = required_skills
            transferable_skills = []

        # Format experience requirement
        exp_parts = []
        if job.llm_experience_years_min is not None:
            exp_parts.append(f"{job.llm_experience_years_min}+")
        elif job.experience_years_min is not None:
            exp_parts.append(f"{job.experience_years_min}+")
        if job.llm_experience_years_max is not None or job.experience_years_max is not None:
            exp_max = job.llm_experience_years_max or job.experience_years_max
            exp_parts.append(f"up to {exp_max}")
        experience_required = " years, ".join(exp_parts) if exp_parts else "Not specified"
        if exp_parts:
            experience_required += " years"

        return DEEP_ANALYSIS_PROMPT.format(
            candidate_name=user.full_name or "Candidate",
            current_role=user.current_role or "Not specified",
            years_experience=user.years_experience or "Not specified",
            candidate_skills=", ".join(user.skills or []) or "Not specified",
            service_line=user.target_service_line or "Not specified",
            job_title=job.title,
            job_department=job.service_line,
            job_location=job.location,
            job_description=job.description[:2000] if job.description else "Not provided",
            required_skills=", ".join(required_skills) or "Not specified",
            preferred_skills=", ".join(preferred_skills) or "None specified",
            experience_required=experience_required,
            overall_score=overall_score,
            skill_score=skill_score,
            experience_score=experience_score,
            role_fit_score=role_fit_score,
            overlapping_skills=", ".join(overlapping_skills) or "None",
            missing_skills=", ".join(missing_skills) or "None",
            transferable_skills=", ".join(transferable_skills) or "None",
        )

    async def _call_gpt_with_retry(self, prompt: str) -> ComplexAnalysis:
        """
        Call GPT-5.2 with retry logic for API failures.

        Args:
            prompt: The analysis prompt

        Returns:
            ComplexAnalysis parsed from the response
        """
        last_error = None

        for attempt in range(MAX_RETRIES):
            try:
                return await self._call_openai(prompt)

            except RateLimitError as e:
                last_error = e
                if attempt < MAX_RETRIES - 1:
                    delay = RETRY_DELAYS[attempt]
                    logger.warning(f"Rate limit hit, retrying in {delay}s...")
                    await asyncio.sleep(delay)

            except APITimeoutError as e:
                last_error = e
                if attempt < MAX_RETRIES - 1:
                    delay = RETRY_DELAYS[attempt]
                    logger.warning(f"API timeout, retrying in {delay}s...")
                    await asyncio.sleep(delay)

            except APIError as e:
                last_error = e
                if e.status_code >= 500 and attempt < MAX_RETRIES - 1:
                    delay = RETRY_DELAYS[attempt]
                    logger.warning(f"API error {e.status_code}, retrying in {delay}s...")
                    await asyncio.sleep(delay)
                else:
                    raise

        raise ValueError(f"Deep analysis failed after {MAX_RETRIES} retries: {last_error}")

    async def _call_openai(self, prompt: str) -> ComplexAnalysis:
        """
        Make the actual OpenAI API call to GPT-5.2.

        Args:
            prompt: The analysis prompt

        Returns:
            ComplexAnalysis parsed from the response
        """
        logger.info(f"Calling GPT-5.2 with reasoning_effort={REASONING_EFFORT}")

        response = await self.client.chat.completions.create(
            model=OPENAI_MODEL,
            reasoning_effort=REASONING_EFFORT,
            messages=[
                {
                    "role": "system",
                    "content": "You are a senior career advisor providing deep, nuanced analysis. Always respond with valid JSON only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format={"type": "json_object"},
            max_completion_tokens=MAX_TOKENS,
        )

        # Parse response
        content = response.choices[0].message.content
        analysis = self._parse_response(content)

        # Log usage
        if response.usage:
            tokens_used = response.usage.total_tokens
            cost_usd = self._calculate_cost(
                response.usage.prompt_tokens,
                response.usage.completion_tokens
            )
            logger.info(f"Deep analysis complete. Tokens: {tokens_used}, Cost: ${cost_usd:.4f}")

        return analysis

    def _parse_response(self, content: str) -> ComplexAnalysis:
        """
        Parse GPT response into ComplexAnalysis.

        Args:
            content: JSON string from GPT

        Returns:
            ComplexAnalysis object
        """
        try:
            data = json.loads(content)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.debug(f"Raw content: {content[:500]}...")
            raise ValueError(f"Failed to parse analysis response: {e}")

        # Parse skill impacts for matched skills
        matched_skill_impacts = []
        for item in data.get("matched_skill_impacts", []):
            try:
                impact = SkillImpactAnalysis(
                    skill_name=item.get("skill_name", "Unknown"),
                    importance_level=ImportanceLevel(item.get("importance_level", "important")),
                    why_it_matters=item.get("why_it_matters", ""),
                    current_proficiency=item.get("current_proficiency"),
                    required_proficiency=item.get("required_proficiency", "intermediate"),
                    gap_severity=GapSeverity(item.get("gap_severity", "none")),
                    learning_estimate=item.get("learning_estimate"),
                )
                matched_skill_impacts.append(impact)
            except Exception as e:
                logger.warning(f"Failed to parse matched skill impact: {item}, error: {e}")

        # Parse skill impacts for gaps
        gap_impacts = []
        for item in data.get("gap_impacts", []):
            try:
                impact = SkillImpactAnalysis(
                    skill_name=item.get("skill_name", "Unknown"),
                    importance_level=ImportanceLevel(item.get("importance_level", "important")),
                    why_it_matters=item.get("why_it_matters", ""),
                    current_proficiency=item.get("current_proficiency"),
                    required_proficiency=item.get("required_proficiency", "intermediate"),
                    gap_severity=GapSeverity(item.get("gap_severity", "moderate")),
                    learning_estimate=item.get("learning_estimate"),
                )
                gap_impacts.append(impact)
            except Exception as e:
                logger.warning(f"Failed to parse gap impact: {item}, error: {e}")

        return ComplexAnalysis(
            overall_fit_narrative=data.get("overall_fit_narrative", "Analysis not available."),
            growth_opportunity=data.get("growth_opportunity", "Not specified."),
            transition_reasoning=data.get("transition_reasoning", "Not specified."),
            matched_skill_impacts=matched_skill_impacts,
            gap_impacts=gap_impacts,
            critical_success_factors=data.get("critical_success_factors", [])[:5],
            risk_factors=data.get("risk_factors", [])[:5],
            estimated_ramp_up=data.get("estimated_ramp_up", "Not specified."),
            comparable_roles=data.get("comparable_roles", []),
            recommended_learning_path=data.get("recommended_learning_path", []),
        )

    def _calculate_cost(
        self,
        input_tokens: int,
        output_tokens: int
    ) -> float:
        """
        Calculate cost for API call.

        Args:
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens

        Returns:
            Cost in USD
        """
        input_cost = (input_tokens / 1_000_000) * COST_PER_1M_INPUT
        output_cost = (output_tokens / 1_000_000) * COST_PER_1M_OUTPUT
        return input_cost + output_cost


# ============================================
# Convenience Function
# ============================================

async def get_deep_analysis(
    db: Session,
    user: UserProfile,
    job_id: str,
) -> ComplexAnalysis:
    """
    Convenience function to get deep analysis for a candidate-job pair.

    Args:
        db: Database session
        user: User profile (candidate)
        job_id: Job posting ID

    Returns:
        ComplexAnalysis with comprehensive fit assessment

    Usage:
        analysis = await get_deep_analysis(db, user, "job-123")
        print(analysis.overall_fit_narrative)
    """
    service = DeepAnalysisService(db)
    return await service.analyze_candidate_job_fit(user, job_id)
