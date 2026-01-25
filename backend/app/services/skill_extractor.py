"""
Skill extraction service using OpenAI GPT-5.2 chat.

Extracts structured skills from resume text including:
- Technical skills (programming languages, tools, frameworks)
- Soft skills (communication, leadership, teamwork)
- Domain skills (industry-specific expertise)
- Certifications (professional certifications)

Skills are categorized as:
- Listed skills: Explicitly mentioned by name in the resume
- Inferred skills: Implied by experience, projects, or responsibilities
"""

import json
import logging
import asyncio
from typing import List, Optional, Tuple

from openai import AsyncOpenAI, APIError, RateLimitError, APITimeoutError
from pydantic import BaseModel

from app.config import get_openai_client
from app.schemas.skill import Skill, SkillList
from app.utils.text_cleaner import clean_resume_text, chunk_text, count_tokens

logger = logging.getLogger(__name__)


# ============================================
# Configuration
# ============================================

# Model configuration - GPT-5.2 chat for quality extraction
OPENAI_MODEL = "gpt-5.2-chat-latest"
MAX_TOKENS = 4000  # Increased to handle 40+ skills
TEMPERATURE = 0.3  # Low temperature for consistent extractions

# Retry configuration
MAX_RETRIES = 3
RETRY_DELAYS = [1, 2, 4]  # Exponential backoff in seconds

# Cost tracking (GPT-5.2 pricing)
COST_PER_1M_INPUT = 1.75   # $1.75 per 1M input tokens
COST_PER_1M_OUTPUT = 14.00  # $14.00 per 1M output tokens


# ============================================
# Result Model
# ============================================

class SkillExtractionResult(BaseModel):
    """Result of skill extraction containing listed and inferred skills."""

    listed_skills: List[Skill]
    inferred_skills: List[Skill]
    tokens_used: int
    cost_usd: float


# ============================================
# Prompt Template
# ============================================

SKILL_EXTRACTION_PROMPT = """You are a comprehensive skill extraction assistant. Your goal is to extract EVERY skill from this resume - be EXHAUSTIVE.

## EXTRACTION TYPES:
1. LISTED SKILLS: Skills explicitly mentioned by name (e.g., "Skills: Python, Java", "Proficient in AWS")
2. INFERRED SKILLS: Skills implied by experience but not explicitly listed (e.g., led a team → "Team Leadership", built APIs → "API Design")

## EXTRACTION RULES:
1. Be EXHAUSTIVE - extract EVERY skill, tool, technology, framework, methodology, and certification
2. Be SPECIFIC - use exact names (e.g., "PostgreSQL" not "SQL databases", "React" not "frontend frameworks")
3. Extract EACH item separately - if they list "Python, Java, JavaScript", that's 3 separate skills
4. Include ALL soft skills mentioned or demonstrated
5. Include ALL certifications with their full names
6. AIM FOR 30-60 SKILLS for a detailed resume - most professionals have many skills

## CATEGORIES (use ONLY these exact values - no other categories allowed):
- technical: programming languages, algorithms, system design, frameworks (React, .NET, Next.js, etc.)
- programming: same as technical, use for coding languages
- tool: specific software, platforms, IDEs (e.g., Docker, Kubernetes, VS Code, Jira)
- tools: same as tool
- soft: communication, teamwork, problem-solving, mentoring
- leadership_management: leadership, management, people skills
- domain: industry expertise (e.g., "Financial Analysis", "Healthcare IT", "E-commerce")
- certification: professional certifications (e.g., "AWS Solutions Architect", "PMP", "CKA")
- methodology: processes and frameworks (e.g., "Agile", "Scrum", "DevOps", "CI/CD")
- cloud_infrastructure: AWS, Azure, GCP, cloud services
- data_analytics: data science, ML, analytics, visualization
- business_acumen: business strategy, finance, marketing
- research: research methodologies, analysis
- security: cybersecurity, compliance
- consulting_excellence: client management, consulting skills

IMPORTANT: Do NOT use any category not listed above. For frameworks like React, Next.js, .NET, use "technical".

## PROFICIENCY LEVELS:
- beginner: <1 year or just learning
- intermediate: 1-3 years or working knowledge
- advanced: 3-5 years or strong proficiency
- expert: 5+ years or demonstrated deep expertise

## OUTPUT FORMAT:
Return ONLY valid JSON (no markdown, no explanation):
{{
  "listed_skills": [
    {{"name": "Python", "category": "technical", "proficiency": "expert"}},
    {{"name": "Docker", "category": "tool", "proficiency": "advanced"}},
    {{"name": "AWS Solutions Architect", "category": "certification", "proficiency": "expert"}},
    {{"name": "Agile", "category": "methodology", "proficiency": "advanced"}}
  ],
  "inferred_skills": [
    {{"name": "Team Leadership", "category": "soft", "proficiency": "advanced"}},
    {{"name": "System Design", "category": "technical", "proficiency": "advanced"}}
  ]
}}

Resume text:
{resume_text}"""


# ============================================
# Skill Extractor Class
# ============================================

class SkillExtractor:
    """
    Extracts structured skills from resume text using GPT-5.2 chat.

    Usage:
        extractor = SkillExtractor()
        skills, usage = await extractor.extract_skills("Resume text here...")
    """

    def __init__(
        self,
        model: str = OPENAI_MODEL,
        temperature: float = TEMPERATURE,
        max_tokens: int = MAX_TOKENS
    ):
        """
        Initialize skill extractor.

        Args:
            model: OpenAI model to use (default: gpt-5.2-chat-latest)
            temperature: Sampling temperature (default: 0.3)
            max_tokens: Maximum tokens in response (default: 4000)
        """
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self._client: Optional[AsyncOpenAI] = None

    @property
    def client(self) -> AsyncOpenAI:
        """Lazy-load OpenAI client."""
        if self._client is None:
            self._client = get_openai_client()
        return self._client

    async def extract_skills(
        self,
        text: str,
        clean_text: bool = True
    ) -> SkillExtractionResult:
        """
        Extract skills from resume text, separating listed vs inferred skills.

        Args:
            text: Resume text to extract skills from
            clean_text: Whether to clean the text first (default: True)

        Returns:
            SkillExtractionResult containing listed_skills, inferred_skills,
            tokens_used, and cost_usd

        Raises:
            ValueError: If text is empty or extraction fails after retries
        """
        if not text or not text.strip():
            raise ValueError("Text cannot be empty")

        # Clean text if requested
        if clean_text:
            text = clean_resume_text(text)

        # Check if text needs to be chunked
        text_tokens = count_tokens(text)
        if text_tokens > 3500:  # Leave room for prompt and response
            return await self._extract_from_chunks(text)

        # Single extraction
        return await self._extract_with_retry(text)

    async def _extract_with_retry(
        self,
        text: str
    ) -> SkillExtractionResult:
        """
        Extract skills with retry logic for API failures.

        Args:
            text: Cleaned resume text

        Returns:
            SkillExtractionResult with listed and inferred skills
        """
        last_error = None

        for attempt in range(MAX_RETRIES):
            try:
                return await self._call_openai(text)

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

        raise ValueError(f"Skill extraction failed after {MAX_RETRIES} retries: {last_error}")

    async def _call_openai(self, text: str) -> SkillExtractionResult:
        """
        Make the actual OpenAI API call.

        Args:
            text: Resume text

        Returns:
            SkillExtractionResult with listed and inferred skills
        """
        prompt = SKILL_EXTRACTION_PROMPT.format(resume_text=text)

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "You are a skill extraction assistant. Always respond with valid JSON only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_completion_tokens=self.max_tokens,
            response_format={"type": "json_object"}
        )

        # Parse response
        content = response.choices[0].message.content
        listed_skills, inferred_skills = self._parse_response(content)

        # Calculate usage
        tokens_used = response.usage.total_tokens
        cost_usd = self._calculate_cost(
            response.usage.prompt_tokens,
            response.usage.completion_tokens
        )

        total_skills = len(listed_skills) + len(inferred_skills)
        logger.info(
            f"Extracted {total_skills} skills ({len(listed_skills)} listed, {len(inferred_skills)} inferred). "
            f"Tokens: {tokens_used}, Cost: ${cost_usd:.6f}"
        )

        return SkillExtractionResult(
            listed_skills=listed_skills,
            inferred_skills=inferred_skills,
            tokens_used=tokens_used,
            cost_usd=cost_usd
        )

    def _parse_response(self, content: str) -> Tuple[List[Skill], List[Skill]]:
        """
        Parse LLM response into listed and inferred Skill objects.

        Args:
            content: JSON string from LLM

        Returns:
            Tuple of (listed_skills, inferred_skills)
        """
        try:
            data = json.loads(content)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.debug(f"Raw content: {content}")
            return [], []

        listed_skills = []
        inferred_skills = []

        # Parse listed skills
        for item in data.get("listed_skills", []):
            skill = self._parse_skill_item(item)
            if skill:
                listed_skills.append(skill)

        # Parse inferred skills
        for item in data.get("inferred_skills", []):
            skill = self._parse_skill_item(item)
            if skill:
                inferred_skills.append(skill)

        # Fallback: if old format with just "skills" key, treat all as listed
        if not listed_skills and not inferred_skills and "skills" in data:
            for item in data["skills"]:
                skill = self._parse_skill_item(item)
                if skill:
                    listed_skills.append(skill)

        return listed_skills, inferred_skills

    # Map invalid categories to valid ones
    CATEGORY_FALLBACK = {
        "framework": "technical",
        "language": "programming",
        "library": "technical",
        "database": "technical",
        "cloud": "cloud_infrastructure",
        "devops": "cloud_infrastructure",
        "data": "data_analytics",
        "analytics": "data_analytics",
        "management": "leadership_management",
        "leadership": "leadership_management",
        "business": "business_acumen",
        "communication": "soft",
        "interpersonal": "soft",
        "other": "technical",
    }

    def _parse_skill_item(self, item: dict) -> Optional[Skill]:
        """Parse a single skill item from LLM response."""
        try:
            category = item.get("category", "technical")
            # Map invalid categories to valid ones
            if category in self.CATEGORY_FALLBACK:
                category = self.CATEGORY_FALLBACK[category]

            skill = Skill(
                name=item.get("name", "").strip(),
                category=category,
                proficiency=item.get("proficiency", "intermediate")
            )
            if skill.name:
                return skill
        except Exception as e:
            logger.warning(f"Failed to parse skill: {item}, error: {e}")
        return None

    async def _extract_from_chunks(
        self,
        text: str
    ) -> SkillExtractionResult:
        """
        Extract skills from chunked text (for long resumes).

        Args:
            text: Long resume text

        Returns:
            SkillExtractionResult with merged skills
        """
        chunks = chunk_text(text, max_tokens=3000)
        logger.info(f"Text chunked into {len(chunks)} parts")

        all_listed = []
        all_inferred = []
        total_tokens = 0
        total_cost = 0.0

        for i, chunk in enumerate(chunks):
            logger.info(f"Processing chunk {i + 1}/{len(chunks)}")
            result = await self._extract_with_retry(chunk)

            all_listed.extend(result.listed_skills)
            all_inferred.extend(result.inferred_skills)
            total_tokens += result.tokens_used
            total_cost += result.cost_usd

        # Deduplicate skills across chunks
        unique_listed = self._deduplicate_skills(all_listed)
        unique_inferred = self._deduplicate_skills(all_inferred)

        return SkillExtractionResult(
            listed_skills=unique_listed,
            inferred_skills=unique_inferred,
            tokens_used=total_tokens,
            cost_usd=total_cost
        )

    def _deduplicate_skills(self, skills: List[Skill]) -> List[Skill]:
        """
        Remove duplicate skills, keeping highest proficiency.

        Args:
            skills: List of skills that may contain duplicates

        Returns:
            Deduplicated list of skills
        """
        skill_map = {}

        proficiency_order = {
            "beginner": 0,
            "intermediate": 1,
            "advanced": 2,
            "expert": 3
        }

        for skill in skills:
            key = skill.name.lower()

            if key not in skill_map:
                skill_map[key] = skill
            else:
                # Keep the one with higher proficiency
                existing_level = proficiency_order.get(skill_map[key].proficiency, 0)
                new_level = proficiency_order.get(skill.proficiency, 0)

                if new_level > existing_level:
                    skill_map[key] = skill

        return list(skill_map.values())

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

async def extract_skills_from_text(
    text: str,
    clean_text: bool = True
) -> SkillExtractionResult:
    """
    Convenience function to extract skills from text.

    Args:
        text: Resume or profile text
        clean_text: Whether to clean text first

    Returns:
        SkillExtractionResult with listed_skills, inferred_skills, tokens_used, cost_usd

    Usage:
        result = await extract_skills_from_text("Resume text...")
        print(result.listed_skills, result.inferred_skills)
    """
    extractor = SkillExtractor()
    return await extractor.extract_skills(text, clean_text)
