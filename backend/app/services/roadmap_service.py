"""
Career Roadmap Generation Service using GPT-5.2 with reasoning.

Generates personalized career roadmaps based on:
- User's current skills and role
- Selected target roles (from saved roles)
- Customization preferences (emphasis, custom instructions)
- Success patterns from the database

Uses GPT-5.2 with reasoning_effort="medium" for thoughtful, comprehensive plans.
"""

import json
import logging
import asyncio
from typing import List, Optional
from uuid import uuid4
from datetime import datetime

from openai import AsyncOpenAI, APIError, RateLimitError, APITimeoutError
from sqlalchemy.orm import Session

from app.config import get_openai_client
from app.models.user_profile import UserProfile
from app.models.job_posting import JobPosting
from app.schemas.roadmap import (
    RoadmapGenerateRequest,
    RoadmapResponse,
    RoadmapPhase,
    RoadmapMilestone,
    RoadmapEmphasis,
    TargetRole,
)
from app.services.pattern_service import SuccessPatternService

logger = logging.getLogger(__name__)


# ============================================
# Configuration
# ============================================

OPENAI_MODEL = "gpt-5.2"
REASONING_EFFORT = "medium"
MAX_TOKENS = 12000  # Roadmaps need more tokens than single-job analysis
TEMPERATURE = 0.7

MAX_RETRIES = 3
RETRY_DELAYS = [2, 4, 8]

COST_PER_1M_INPUT = 2.50
COST_PER_1M_OUTPUT = 10.00


# ============================================
# Prompt Template
# ============================================

ROADMAP_GENERATION_PROMPT = """You are a senior career advisor and talent development strategist at a top professional services firm. Create a comprehensive, personalized career roadmap.

## USER'S CURRENT STATE:
Name: {user_name}
Current Role: {current_role}
Years of Experience: {years_experience}
Current Skills: {current_skills}
Service Line: {service_line}

## TARGET ROLES (user wants to achieve ALL of these):
{target_roles_section}

## ROLE ORDERING:
{order_instructions}

## CUSTOMIZATION PREFERENCES:
Emphasis: {emphasis} ({emphasis_description})
Custom Instructions: {custom_instructions}
Include Certifications: {include_certifications}
Timeline Preference: {timeline_preference}

## SUCCESS PATTERN INSIGHTS:
{success_patterns_section}

## YOUR TASK:
Create a detailed, actionable career roadmap that takes this person from their current state through their target roles. The roadmap should be realistic, personalized, and actionable.

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{{
    "executive_summary": "2-3 paragraphs providing a high-level overview of the entire journey. Include the 'why' - why this path makes sense, what the person will gain, and what success looks like. Be encouraging but realistic.",

    "total_estimated_months": <integer - total months for full roadmap>,

    "phases": [
        {{
            "id": "phase-1",
            "name": "Foundation Building",
            "description": "What this phase accomplishes and why it matters",
            "target_role": null or "Target Role Name if this phase ends with a transition",
            "estimated_duration_months": <integer>,
            "milestones": [
                {{
                    "id": "m-1-1",
                    "title": "Milestone title",
                    "description": "Detailed description of what to accomplish",
                    "category": "skill|experience|certification|leadership|networking",
                    "priority": "critical|high|medium|optional",
                    "estimated_duration_months": <integer>,
                    "prerequisites": ["m-1-0"] or [],
                    "skills_to_develop": ["Skill 1", "Skill 2"],
                    "resources": ["Specific course/action 1", "Specific action 2"],
                    "success_indicators": ["How to know this is complete"]
                }}
            ],
            "status": "upcoming"
        }}
    ],

    "critical_skills_to_develop": ["Top 5-7 skills that are most critical across the entire journey"],

    "quick_wins": ["3-5 things that can be started THIS WEEK with immediate impact"],

    "potential_blockers": ["3-5 realistic challenges to be aware of and prepare for"],

    "customization_notes": "1-2 sentences explaining how the custom instructions were incorporated into the roadmap"
}}

IMPORTANT GUIDELINES:
1. Be SPECIFIC and ACTIONABLE - not generic advice. Reference the user's actual skills and gaps.
2. Create 2-4 phases depending on complexity of the journey.
3. Each phase should have 3-6 concrete milestones.
4. Milestones should build on each other logically (use prerequisites).
5. Include a mix of categories in each phase (skills + experience + networking, etc.).
6. Quick wins should be immediately actionable - things someone could start today.
7. Potential blockers should be realistic and include mitigation suggestions.
8. If emphasis is "technical", weight more technical skills and certifications.
9. If emphasis is "leadership", include more people management and client-facing milestones.
10. Honor the user's custom instructions while maintaining a coherent roadmap.
11. Time estimates should account for someone working full-time (not dedicated study time).
12. Include certifications ONLY if include_certifications is true AND they're relevant."""


# ============================================
# Roadmap Service
# ============================================

class RoadmapService:
    """
    Service for generating personalized career roadmaps using GPT-5.2.

    Combines user profile data, saved role information, and success patterns
    to create comprehensive development plans.

    Usage:
        service = RoadmapService(db)
        roadmap = await service.generate_roadmap(user, request)
    """

    def __init__(self, db: Session):
        """Initialize the roadmap service."""
        self.db = db
        self._client: Optional[AsyncOpenAI] = None
        self._pattern_service = SuccessPatternService(db=db)

    @property
    def client(self) -> AsyncOpenAI:
        """Lazy-load OpenAI client."""
        if self._client is None:
            self._client = get_openai_client()
        return self._client

    async def generate_roadmap(
        self,
        user: UserProfile,
        request: RoadmapGenerateRequest,
    ) -> RoadmapResponse:
        """
        Generate a personalized career roadmap.

        Args:
            user: The user profile (current state)
            request: Roadmap generation request with targets and preferences

        Returns:
            RoadmapResponse with complete roadmap

        Raises:
            ValueError: If target roles not found or generation fails
        """
        # Fetch target role details from database
        target_roles_data = self._fetch_target_roles(request.target_roles)

        # Get relevant success patterns
        success_patterns = self._get_relevant_patterns(user, target_roles_data)

        # Build the prompt
        prompt = self._build_prompt(user, request, target_roles_data, success_patterns)

        # Call GPT-5.2 with reasoning
        roadmap_data = await self._call_gpt_with_retry(prompt)

        # Build and return response
        return self._build_response(user, request, roadmap_data)

    def _fetch_target_roles(
        self,
        target_roles: List[TargetRole]
    ) -> List[dict]:
        """Fetch full job posting data for target roles."""
        result = []
        for target in target_roles:
            job = self.db.query(JobPosting).filter(JobPosting.id == target.job_id).first()
            if job:
                result.append({
                    "order": target.order,
                    "job_id": target.job_id,
                    "title": job.title,
                    "service_line": job.service_line,
                    "description": job.description[:1500] if job.description else "",
                    "required_skills": job.llm_required_skills or job.required_skills or [],
                    "preferred_skills": job.preferred_skills or [],
                    "experience_min": job.llm_experience_years_min or job.experience_years_min,
                    "experience_max": job.llm_experience_years_max or job.experience_years_max,
                })
            else:
                # Use the provided data if job not found
                result.append({
                    "order": target.order,
                    "job_id": target.job_id,
                    "title": target.job_title,
                    "service_line": target.service_line,
                    "description": "",
                    "required_skills": [],
                    "preferred_skills": [],
                    "experience_min": None,
                    "experience_max": None,
                })

        # Sort by order
        result.sort(key=lambda x: x["order"])
        return result

    def _get_relevant_patterns(
        self,
        user: UserProfile,
        target_roles: List[dict]
    ) -> str:
        """Get success patterns relevant to the user's journey."""
        patterns_text = []

        current_role = user.current_role or "Unknown"

        for i, target in enumerate(target_roles):
            source_role = current_role if i == 0 else target_roles[i - 1]["title"]
            target_role = target["title"]

            # Get transition patterns
            transitions = self._pattern_service.analyze_transitions()
            relevant = [t for t in transitions if t.source_role.lower() == source_role.lower()
                        or t.target_role.lower() == target_role.lower()]

            if relevant:
                for trans in relevant[:2]:  # Top 2 patterns
                    patterns_text.append(
                        f"- {trans.source_role} -> {trans.target_role}: "
                        f"{int(trans.success_rate * 100)}% success rate, "
                        f"avg {trans.avg_time_to_promotion_years} years, "
                        f"key skills: {', '.join(trans.common_skills[:3])}"
                    )

        if not patterns_text:
            patterns_text.append("- No specific historical patterns found; using general best practices")

        return "\n".join(patterns_text)

    def _build_prompt(
        self,
        user: UserProfile,
        request: RoadmapGenerateRequest,
        target_roles: List[dict],
        success_patterns: str,
    ) -> str:
        """Build the roadmap generation prompt."""

        # Build target roles section
        target_roles_lines = []
        for i, role in enumerate(target_roles, 1):
            exp_str = ""
            if role.get("experience_min") or role.get("experience_max"):
                exp_str = f" (requires {role.get('experience_min', '?')}-{role.get('experience_max', '?')} years)"

            skills = role.get("required_skills", [])
            if isinstance(skills, list) and len(skills) > 0:
                if isinstance(skills[0], dict):
                    skills = [s.get("name", str(s)) for s in skills]
            skills_str = ", ".join(skills[:10]) if skills else "Not specified"

            target_roles_lines.append(
                f"Target {i}: {role['title']} ({role.get('service_line', 'Unknown')}){exp_str}\n"
                f"  Required Skills: {skills_str}\n"
                f"  Description: {role.get('description', 'Not available')[:500]}"
            )

        # Emphasis descriptions
        emphasis_descriptions = {
            RoadmapEmphasis.TECHNICAL: "Focus on technical skills, certifications, and technical depth",
            RoadmapEmphasis.LEADERSHIP: "Focus on people leadership, client management, and business development",
            RoadmapEmphasis.BALANCED: "Balance between technical expertise and leadership capabilities",
        }

        # Order instructions based on auto_order flag
        if request.auto_order:
            order_instructions = (
                "IMPORTANT: You must analyze these roles and determine the OPTIMAL progression order. "
                "Consider experience requirements, skill prerequisites, natural career progression, and logical stepping stones. "
                "The user has NOT specified an order - you decide the best sequence to achieve all roles. "
                "Start from their current role and build a path through the target roles in whatever order makes the most sense career-wise."
            )
        else:
            order_instructions = (
                "The user has specified the order they want to achieve these roles. "
                "Follow the numbered order exactly (Target 1 first, then Target 2, etc.)."
            )

        return ROADMAP_GENERATION_PROMPT.format(
            user_name=user.full_name or "User",
            current_role=user.current_role or "Not specified",
            years_experience=user.years_experience or "Not specified",
            current_skills=", ".join(user.skills or []) or "Not specified",
            service_line=user.target_service_line or "Not specified",
            target_roles_section="\n\n".join(target_roles_lines),
            order_instructions=order_instructions,
            emphasis=request.emphasis.value,
            emphasis_description=emphasis_descriptions[request.emphasis],
            custom_instructions=request.custom_instructions or "None provided",
            include_certifications="Yes" if request.include_certifications else "No",
            timeline_preference=request.timeline_preference or "Standard/Balanced",
            success_patterns_section=success_patterns,
        )

    async def _call_gpt_with_retry(self, prompt: str) -> dict:
        """Call GPT-5.2 with retry logic."""
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

        raise ValueError(f"Roadmap generation failed after {MAX_RETRIES} retries: {last_error}")

    async def _call_openai(self, prompt: str) -> dict:
        """Make the actual OpenAI API call."""
        logger.info(f"Calling GPT-5.2 for roadmap generation with reasoning_effort={REASONING_EFFORT}")

        response = await self.client.chat.completions.create(
            model=OPENAI_MODEL,
            reasoning_effort=REASONING_EFFORT,
            messages=[
                {
                    "role": "system",
                    "content": "You are a senior career advisor creating personalized development roadmaps. Always respond with valid JSON only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format={"type": "json_object"},
            max_completion_tokens=MAX_TOKENS,
        )

        content = response.choices[0].message.content

        # Log usage
        if response.usage:
            tokens_used = response.usage.total_tokens
            cost_usd = self._calculate_cost(
                response.usage.prompt_tokens,
                response.usage.completion_tokens
            )
            logger.info(f"Roadmap generation complete. Tokens: {tokens_used}, Cost: ${cost_usd:.4f}")

        try:
            return json.loads(content)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.debug(f"Raw content: {content[:500]}...")
            raise ValueError(f"Failed to parse roadmap response: {e}")

    def _build_response(
        self,
        user: UserProfile,
        request: RoadmapGenerateRequest,
        data: dict
    ) -> RoadmapResponse:
        """Build the RoadmapResponse from GPT output."""

        # Parse phases
        phases = []
        for phase_data in data.get("phases", []):
            milestones = []
            for m_data in phase_data.get("milestones", []):
                milestones.append(RoadmapMilestone(
                    id=m_data.get("id", f"m-{uuid4().hex[:8]}"),
                    title=m_data.get("title", "Untitled"),
                    description=m_data.get("description", ""),
                    category=m_data.get("category", "skill"),
                    priority=m_data.get("priority", "medium"),
                    estimated_duration_months=m_data.get("estimated_duration_months", 1),
                    prerequisites=m_data.get("prerequisites", []),
                    skills_to_develop=m_data.get("skills_to_develop", []),
                    resources=m_data.get("resources", []),
                    success_indicators=m_data.get("success_indicators", []),
                ))

            phases.append(RoadmapPhase(
                id=phase_data.get("id", f"phase-{uuid4().hex[:8]}"),
                name=phase_data.get("name", "Phase"),
                description=phase_data.get("description", ""),
                target_role=phase_data.get("target_role"),
                estimated_duration_months=phase_data.get("estimated_duration_months", 6),
                milestones=milestones,
                status=phase_data.get("status", "upcoming"),
            ))

        return RoadmapResponse(
            roadmap_id=f"rm-{uuid4().hex[:12]}",
            generated_at=datetime.utcnow(),
            current_role=user.current_role or "Not specified",
            current_skills=user.skills or [],
            executive_summary=data.get("executive_summary", "Roadmap generation complete."),
            total_estimated_months=data.get("total_estimated_months", 12),
            phases=phases,
            critical_skills_to_develop=data.get("critical_skills_to_develop", [])[:7],
            quick_wins=data.get("quick_wins", [])[:5],
            potential_blockers=data.get("potential_blockers", [])[:5],
            emphasis_applied=request.emphasis,
            customization_notes=data.get("customization_notes"),
        )

    def _calculate_cost(self, input_tokens: int, output_tokens: int) -> float:
        """Calculate API cost."""
        input_cost = (input_tokens / 1_000_000) * COST_PER_1M_INPUT
        output_cost = (output_tokens / 1_000_000) * COST_PER_1M_OUTPUT
        return input_cost + output_cost


# ============================================
# Convenience Function
# ============================================

async def generate_career_roadmap(
    db: Session,
    user: UserProfile,
    request: RoadmapGenerateRequest,
) -> RoadmapResponse:
    """
    Convenience function to generate a career roadmap.

    Args:
        db: Database session
        user: User profile
        request: Generation request

    Returns:
        RoadmapResponse with complete roadmap
    """
    service = RoadmapService(db)
    return await service.generate_roadmap(user, request)
