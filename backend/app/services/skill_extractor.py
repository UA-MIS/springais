"""
Skill extraction service using OpenAI GPT-5 nano.

Extracts structured skills from resume text including:
- Technical skills (programming languages, tools, frameworks)
- Soft skills (communication, leadership, teamwork)
- Domain skills (industry-specific expertise)
- Certifications (professional certifications)
"""

import json
import logging
import asyncio
from typing import List, Optional, Tuple

from openai import AsyncOpenAI, APIError, RateLimitError, APITimeoutError

from app.config import get_openai_client
from app.schemas.skill import Skill, SkillList
from app.utils.text_cleaner import clean_resume_text, chunk_text, count_tokens

logger = logging.getLogger(__name__)


# ============================================
# Configuration
# ============================================

# Model configuration - GPT-5 nano for fast, cheap extraction
OPENAI_MODEL = "gpt-5-nano"
MAX_TOKENS = 1000
TEMPERATURE = 0.3  # Low temperature for consistent extractions

# Retry configuration
MAX_RETRIES = 3
RETRY_DELAYS = [1, 2, 4]  # Exponential backoff in seconds

# Cost tracking (GPT-5 nano pricing)
COST_PER_1M_INPUT = 0.05   # $0.05 per 1M input tokens
COST_PER_1M_OUTPUT = 0.40  # $0.40 per 1M output tokens


# ============================================
# Prompt Template
# ============================================

SKILL_EXTRACTION_PROMPT = """You are a skill extraction assistant. Extract all skills from the resume below.

Instructions:
1. Identify all technical skills (programming languages, tools, frameworks, databases, cloud platforms)
2. Identify all soft skills (communication, leadership, teamwork, problem-solving)
3. Identify all domain skills (industry-specific expertise like financial analysis, marketing, etc.)
4. Identify all certifications (professional certifications like AWS Certified, PMP, CPA)
5. Infer proficiency level based on years mentioned or context:
   - beginner: <1 year or just learning
   - intermediate: 1-3 years or working knowledge
   - advanced: 3-5 years or strong proficiency
   - expert: 5+ years or deep expertise
6. Normalize skill names to standard forms (e.g., "Javascript" → "JavaScript", "ML" → "Machine Learning")

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{{
  "skills": [
    {{"name": "Python", "category": "technical", "proficiency": "advanced"}},
    {{"name": "Leadership", "category": "soft", "proficiency": "intermediate"}},
    {{"name": "AWS Certified Solutions Architect", "category": "certification", "proficiency": "advanced"}}
  ]
}}

Resume text:
{resume_text}"""


# ============================================
# Skill Extractor Class
# ============================================

class SkillExtractor:
    """
    Extracts structured skills from resume text using GPT-5 nano.

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
            model: OpenAI model to use (default: gpt-5-nano)
            temperature: Sampling temperature (default: 0.3)
            max_tokens: Maximum tokens in response (default: 1000)
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
    ) -> Tuple[List[Skill], dict]:
        """
        Extract skills from resume text.

        Args:
            text: Resume text to extract skills from
            clean_text: Whether to clean the text first (default: True)

        Returns:
            Tuple of (list of Skill objects, usage dict with tokens/cost)

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
    ) -> Tuple[List[Skill], dict]:
        """
        Extract skills with retry logic for API failures.

        Args:
            text: Cleaned resume text

        Returns:
            Tuple of (skills list, usage dict)
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

    async def _call_openai(self, text: str) -> Tuple[List[Skill], dict]:
        """
        Make the actual OpenAI API call.

        Args:
            text: Resume text

        Returns:
            Tuple of (skills list, usage dict)
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
            temperature=self.temperature,
            max_tokens=self.max_tokens,
            response_format={"type": "json_object"}
        )

        # Parse response
        content = response.choices[0].message.content
        skills = self._parse_response(content)

        # Calculate usage
        usage = {
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens,
            "total_tokens": response.usage.total_tokens,
            "cost_usd": self._calculate_cost(
                response.usage.prompt_tokens,
                response.usage.completion_tokens
            )
        }

        logger.info(
            f"Extracted {len(skills)} skills. "
            f"Tokens: {usage['total_tokens']}, Cost: ${usage['cost_usd']:.6f}"
        )

        return skills, usage

    def _parse_response(self, content: str) -> List[Skill]:
        """
        Parse LLM response into Skill objects.

        Args:
            content: JSON string from LLM

        Returns:
            List of validated Skill objects
        """
        try:
            data = json.loads(content)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.debug(f"Raw content: {content}")
            return []

        if "skills" not in data:
            logger.warning("Response missing 'skills' key")
            return []

        skills = []
        for item in data["skills"]:
            try:
                # Validate and create Skill object
                skill = Skill(
                    name=item.get("name", "").strip(),
                    category=item.get("category", "technical"),
                    proficiency=item.get("proficiency", "intermediate")
                )
                if skill.name:  # Only add if name is not empty
                    skills.append(skill)
            except Exception as e:
                logger.warning(f"Failed to parse skill: {item}, error: {e}")
                continue

        return skills

    async def _extract_from_chunks(
        self,
        text: str
    ) -> Tuple[List[Skill], dict]:
        """
        Extract skills from chunked text (for long resumes).

        Args:
            text: Long resume text

        Returns:
            Tuple of (merged skills list, combined usage dict)
        """
        chunks = chunk_text(text, max_tokens=3000)
        logger.info(f"Text chunked into {len(chunks)} parts")

        all_skills = []
        total_usage = {
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0,
            "cost_usd": 0.0
        }

        for i, chunk in enumerate(chunks):
            logger.info(f"Processing chunk {i + 1}/{len(chunks)}")
            skills, usage = await self._extract_with_retry(chunk)

            all_skills.extend(skills)
            total_usage["prompt_tokens"] += usage["prompt_tokens"]
            total_usage["completion_tokens"] += usage["completion_tokens"]
            total_usage["total_tokens"] += usage["total_tokens"]
            total_usage["cost_usd"] += usage["cost_usd"]

        # Deduplicate skills across chunks
        unique_skills = self._deduplicate_skills(all_skills)

        return unique_skills, total_usage

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
) -> Tuple[List[Skill], dict]:
    """
    Convenience function to extract skills from text.

    Args:
        text: Resume or profile text
        clean_text: Whether to clean text first

    Returns:
        Tuple of (skills list, usage dict)

    Usage:
        skills, usage = await extract_skills_from_text("Resume text...")
    """
    extractor = SkillExtractor()
    return await extractor.extract_skills(text, clean_text)
