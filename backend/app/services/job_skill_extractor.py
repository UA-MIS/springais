"""
Job Skill Extraction Service using OpenAI GPT-5.2 chat.

Extracts structured skills from job posting descriptions including:
- Required skills (explicitly mentioned)
- Inferred skills (implied by responsibilities)
- Experience years (min/max)
- Primary domain
- Optional grouping of similar jobs
"""

import hashlib
import json
import logging
import asyncio
from typing import List, Dict, Optional, Tuple, TypedDict

from openai import AsyncOpenAI, APIError, RateLimitError, APITimeoutError
import redis.asyncio as redis

from app.config import get_openai_client, get_redis_client
from app.schemas.skill import ExtractedSkill, JobSkillExtraction

logger = logging.getLogger(__name__)


# ============================================
# Configuration
# ============================================

# Model configuration - GPT-5.2 chat for quality extraction
OPENAI_MODEL = "gpt-5.2-chat-latest"

# Map LLM-returned categories to valid SkillCategory values
CATEGORY_MAPPING = {
    # Direct mappings for LLM variations
    "protocol": "security",
    "cloud": "cloud_infrastructure",
    "infrastructure": "cloud_infrastructure",
    "data": "data_analytics",
    "analytics": "data_analytics",
    "leadership": "leadership_management",
    "management": "leadership_management",
    "business": "business_acumen",
    "finance": "domain",
    "accounting": "domain",
    "communication": "soft",
    "interpersonal": "soft",
    "framework": "tool",
    "platform": "tool",
    "software": "tool",
    "language": "programming",
    "database": "technical",
    "networking": "technical",
    "devops": "technical",
    "process": "methodology",
    "agile": "methodology",
    "compliance": "domain",
    "regulatory": "domain",
}
MAX_TOKENS = 4000  # Higher limit for batch job extraction
TEMPERATURE = 0.3  # Low temperature for consistent extractions

# Retry configuration
MAX_RETRIES = 3
RETRY_DELAYS = [1, 2, 4]  # Exponential backoff in seconds

# Cost tracking (GPT-5.2 pricing)
COST_PER_1M_INPUT = 1.75   # $1.75 per 1M input tokens
COST_PER_1M_OUTPUT = 14.00  # $14.00 per 1M output tokens

# Cache configuration
CACHE_PREFIX = "job_skill_extraction"
CACHE_TTL_SECONDS = 30 * 24 * 60 * 60  # 30 days


# ============================================
# Type Definitions
# ============================================

class JobInput(TypedDict):
    """Input format for a job posting."""
    id: str
    title: str
    description: str


class UsageStats(TypedDict):
    """Token usage and cost statistics."""
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cost_usd: float


# ============================================
# Prompt Template
# ============================================

JOB_SKILL_EXTRACTION_PROMPT = """You are a comprehensive skill extraction assistant for job postings. Extract ALL skills, tools, technologies, and qualifications mentioned.

## EXTRACTION RULES:
1. Be EXHAUSTIVE - extract every skill, tool, software, framework, methodology, and certification mentioned
2. Be SPECIFIC - use exact names (e.g., "Oracle EPM" not just "Oracle", "Anaplan" not just "planning tools")
3. Include ALL:
   - Software & Tools (e.g., Excel, Workday, SAP, Anaplan, Tableau, PowerApps)
   - Programming languages & frameworks
   - Methodologies (e.g., Agile, IFRS, GAAP, Six Sigma)
   - Domain knowledge (e.g., FP&A, GL Close, Record to Report, Intercompany Accounting)
   - Soft skills (e.g., stakeholder management, workshop facilitation)
   - Certifications (e.g., CPA, PMP, AWS Certified)

4. AIM FOR 10-25 SKILLS per job posting - most jobs have many requirements

## OUTPUT FORMAT:
For each skill provide:
- name: Specific skill name (be precise, not generic)
- category: "technical", "soft", "domain", "tool", "certification", "methodology", or "programming"
- confidence: 0.0-1.0

Return valid JSON array:
[
  {{
    "job_ids": ["ey_12345"],
    "required_skills": [
      {{"name": "Oracle EPM", "category": "tool", "confidence": 0.95}},
      {{"name": "Anaplan", "category": "tool", "confidence": 0.90}},
      {{"name": "FP&A", "category": "domain", "confidence": 0.95}},
      {{"name": "IFRS", "category": "domain", "confidence": 0.85}},
      {{"name": "Stakeholder Management", "category": "soft", "confidence": 0.80}}
    ],
    "inferred_skills": [
      {{"name": "Financial Modeling", "category": "technical", "confidence": 0.7}}
    ],
    "experience_years_min": 3,
    "experience_years_max": 5,
    "primary_domain": "Finance Transformation"
  }}
]

Jobs to analyze:
{jobs_text}"""


# ============================================
# Job Skill Extractor Service
# ============================================

class JobSkillExtractorService:
    """
    Extracts structured skills from job posting descriptions using GPT-5 nano.

    Features:
    - Batch processing of multiple jobs
    - Redis caching with 30-day TTL
    - Optional job grouping for similar requirements
    - Token usage and cost tracking
    - Exponential backoff retry logic

    Usage:
        extractor = JobSkillExtractorService()
        extractions, usage = await extractor.extract_skills([
            {"id": "job1", "title": "Data Engineer", "description": "..."},
            {"id": "job2", "title": "ML Engineer", "description": "..."}
        ])
    """

    def __init__(
        self,
        model: str = OPENAI_MODEL,
        temperature: float = TEMPERATURE,
        max_tokens: int = MAX_TOKENS
    ):
        """
        Initialize job skill extractor.

        Args:
            model: OpenAI model to use (default: gpt-5.2-chat-latest)
            temperature: Sampling temperature (default: 0.3)
            max_tokens: Maximum tokens in response (default: 4000)
        """
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self._client: Optional[AsyncOpenAI] = None
        self._redis: Optional[redis.Redis] = None

    @property
    def client(self) -> AsyncOpenAI:
        """Lazy-load OpenAI client."""
        if self._client is None:
            self._client = get_openai_client()
        return self._client

    async def _get_redis(self) -> redis.Redis:
        """Lazy-load Redis client."""
        if self._redis is None:
            self._redis = await get_redis_client()
        return self._redis

    # ============================================
    # Public API
    # ============================================

    async def extract_skills(
        self,
        jobs: List[JobInput],
        use_cache: bool = True
    ) -> Tuple[List[JobSkillExtraction], UsageStats]:
        """
        Extract skills from a batch of job postings.

        Args:
            jobs: List of job dicts with id, title, description
            use_cache: Whether to use Redis caching (default: True)

        Returns:
            Tuple of (list of JobSkillExtraction objects, usage stats dict)

        Raises:
            ValueError: If jobs list is empty or extraction fails after retries
        """
        if not jobs:
            raise ValueError("Jobs list cannot be empty")

        logger.info(f"Extracting skills from {len(jobs)} job(s)")

        # Initialize usage stats
        total_usage: UsageStats = {
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0,
            "cost_usd": 0.0
        }

        # Separate cached and uncached jobs
        cached_extractions: List[JobSkillExtraction] = []
        uncached_jobs: List[JobInput] = []

        if use_cache:
            for job in jobs:
                cached = await self._check_cache(job["description"])
                if cached:
                    # Update job_ids to match current job
                    cached.job_ids = [job["id"]]
                    cached_extractions.append(cached)
                    logger.debug(f"Cache hit for job {job['id']}")
                else:
                    uncached_jobs.append(job)

            logger.info(
                f"Cache: {len(cached_extractions)} hits, "
                f"{len(uncached_jobs)} misses"
            )
        else:
            uncached_jobs = jobs

        # Process uncached jobs
        if uncached_jobs:
            extractions, usage = await self._extract_with_retry(uncached_jobs)

            # Update total usage
            total_usage["prompt_tokens"] += usage["prompt_tokens"]
            total_usage["completion_tokens"] += usage["completion_tokens"]
            total_usage["total_tokens"] += usage["total_tokens"]
            total_usage["cost_usd"] += usage["cost_usd"]

            # Cache results
            if use_cache:
                await self._cache_extractions(uncached_jobs, extractions)

            # Combine with cached results
            cached_extractions.extend(extractions)

        return cached_extractions, total_usage

    async def extract_skills_single(
        self,
        job: JobInput,
        use_cache: bool = True
    ) -> Tuple[JobSkillExtraction, UsageStats]:
        """
        Extract skills from a single job posting.

        Args:
            job: Job dict with id, title, description
            use_cache: Whether to use Redis caching (default: True)

        Returns:
            Tuple of (JobSkillExtraction object, usage stats dict)
        """
        extractions, usage = await self.extract_skills([job], use_cache)

        if not extractions:
            raise ValueError(f"Failed to extract skills for job {job['id']}")

        return extractions[0], usage

    # ============================================
    # Private: Caching Methods
    # ============================================

    def _get_description_hash(self, description: str) -> str:
        """
        Generate SHA256 hash of normalized description text.

        Args:
            description: Job description text

        Returns:
            SHA256 hash string
        """
        # Normalize: lowercase, strip whitespace, remove extra spaces
        normalized = " ".join(description.lower().split())
        return hashlib.sha256(normalized.encode("utf-8")).hexdigest()

    async def _check_cache(self, description: str) -> Optional[JobSkillExtraction]:
        """
        Check Redis cache for existing extraction.

        Args:
            description: Job description text

        Returns:
            Cached JobSkillExtraction if found, None otherwise
        """
        try:
            redis_client = await self._get_redis()
            desc_hash = self._get_description_hash(description)
            cache_key = f"{CACHE_PREFIX}:{desc_hash}"

            cached_data = await redis_client.get(cache_key)
            if cached_data:
                data = json.loads(cached_data)
                return JobSkillExtraction(**data)

            return None

        except (json.JSONDecodeError, redis.RedisError) as e:
            logger.warning(f"Cache check error: {e}")
            return None

    async def _store_cache(
        self,
        description: str,
        extraction: JobSkillExtraction
    ) -> None:
        """
        Store extraction in Redis cache with 30-day TTL.

        Args:
            description: Job description text
            extraction: Extraction result to cache
        """
        try:
            redis_client = await self._get_redis()
            desc_hash = self._get_description_hash(description)
            cache_key = f"{CACHE_PREFIX}:{desc_hash}"

            # Serialize extraction to JSON
            cache_data = extraction.model_dump_json()

            # Store with TTL
            await redis_client.set(
                cache_key,
                cache_data,
                ex=CACHE_TTL_SECONDS
            )

            logger.debug(f"Cached extraction with hash {desc_hash[:8]}...")

        except redis.RedisError as e:
            logger.warning(f"Cache store error: {e}")

    async def _cache_extractions(
        self,
        jobs: List[JobInput],
        extractions: List[JobSkillExtraction]
    ) -> None:
        """
        Cache all extraction results.

        Maps extractions back to jobs via job_ids and caches each
        unique description.

        Args:
            jobs: Original job inputs
            extractions: Extraction results (may be grouped)
        """
        # Build job_id -> description mapping
        job_descriptions = {job["id"]: job["description"] for job in jobs}

        # Cache each extraction for its associated jobs
        for extraction in extractions:
            for job_id in extraction.job_ids:
                if job_id in job_descriptions:
                    await self._store_cache(
                        job_descriptions[job_id],
                        extraction
                    )

    # ============================================
    # Private: LLM Extraction Methods
    # ============================================

    async def _extract_with_retry(
        self,
        jobs: List[JobInput]
    ) -> Tuple[List[JobSkillExtraction], UsageStats]:
        """
        Extract skills with retry logic for API failures.

        Args:
            jobs: List of job inputs

        Returns:
            Tuple of (extractions list, usage stats)
        """
        last_error = None

        for attempt in range(MAX_RETRIES):
            try:
                return await self._call_openai(jobs)

            except RateLimitError as e:
                last_error = e
                if attempt < MAX_RETRIES - 1:
                    delay = RETRY_DELAYS[attempt]
                    logger.warning(
                        f"Rate limit hit, retrying in {delay}s "
                        f"(attempt {attempt + 1}/{MAX_RETRIES})..."
                    )
                    await asyncio.sleep(delay)

            except APITimeoutError as e:
                last_error = e
                if attempt < MAX_RETRIES - 1:
                    delay = RETRY_DELAYS[attempt]
                    logger.warning(
                        f"API timeout, retrying in {delay}s "
                        f"(attempt {attempt + 1}/{MAX_RETRIES})..."
                    )
                    await asyncio.sleep(delay)

            except APIError as e:
                last_error = e
                if e.status_code >= 500 and attempt < MAX_RETRIES - 1:
                    delay = RETRY_DELAYS[attempt]
                    logger.warning(
                        f"API error {e.status_code}, retrying in {delay}s "
                        f"(attempt {attempt + 1}/{MAX_RETRIES})..."
                    )
                    await asyncio.sleep(delay)
                else:
                    raise

        raise ValueError(
            f"Job skill extraction failed after {MAX_RETRIES} retries: {last_error}"
        )

    async def _call_openai(
        self,
        jobs: List[JobInput]
    ) -> Tuple[List[JobSkillExtraction], UsageStats]:
        """
        Make the actual OpenAI API call.

        Args:
            jobs: List of job inputs

        Returns:
            Tuple of (extractions list, usage stats)
        """
        # Format jobs for prompt
        jobs_text = self._format_jobs_for_prompt(jobs)
        prompt = JOB_SKILL_EXTRACTION_PROMPT.format(jobs_text=jobs_text)

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a skill extraction assistant for job postings. "
                        "Always respond with valid JSON only."
                    )
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
        extractions = self._parse_response(content, jobs)

        # Calculate usage
        usage: UsageStats = {
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens,
            "total_tokens": response.usage.total_tokens,
            "cost_usd": self._calculate_cost(
                response.usage.prompt_tokens,
                response.usage.completion_tokens
            )
        }

        logger.info(
            f"Extracted skills for {len(jobs)} job(s) into {len(extractions)} group(s). "
            f"Tokens: {usage['total_tokens']}, Cost: ${usage['cost_usd']:.6f}"
        )

        return extractions, usage

    def _format_jobs_for_prompt(self, jobs: List[JobInput]) -> str:
        """
        Format jobs list into text for the prompt.

        Args:
            jobs: List of job inputs

        Returns:
            Formatted string representation of jobs
        """
        formatted_jobs = []
        for job in jobs:
            job_text = (
                f"---\n"
                f"JOB ID: {job['id']}\n"
                f"TITLE: {job['title']}\n"
                f"DESCRIPTION:\n{job['description']}\n"
            )
            formatted_jobs.append(job_text)

        return "\n".join(formatted_jobs)

    def _parse_response(
        self,
        content: str,
        jobs: List[JobInput]
    ) -> List[JobSkillExtraction]:
        """
        Parse LLM response into JobSkillExtraction objects.

        Args:
            content: JSON string from LLM
            jobs: Original job inputs (for fallback)

        Returns:
            List of validated JobSkillExtraction objects
        """
        try:
            data = json.loads(content)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.debug(f"Raw content: {content}")
            # Return empty extractions for each job
            return [
                JobSkillExtraction(job_ids=[job["id"]])
                for job in jobs
            ]

        # Handle both array and object with various wrapper keys
        if isinstance(data, dict):
            if "extractions" in data:
                data = data["extractions"]
            elif "jobs" in data:
                data = data["jobs"]
            elif "results" in data:
                data = data["results"]
            elif "job_ids" in data:
                # Single extraction wrapped in object
                data = [data]
            else:
                # Unknown structure, try to find array in values
                for key, value in data.items():
                    if isinstance(value, list):
                        data = value
                        break
                else:
                    # No array found, wrap the whole thing
                    data = [data]

        if not isinstance(data, list):
            logger.warning(f"Expected array, got {type(data)}")
            return [
                JobSkillExtraction(job_ids=[job["id"]])
                for job in jobs
            ]

        # Valid categories from SkillCategory literal
        VALID_CATEGORIES = {
            "technical", "soft", "domain", "certification", "tool", "methodology", "programming",
            "cloud_infrastructure", "data_analytics", "leadership_management", "business_acumen",
            "tools", "research", "consulting_excellence", "security"
        }

        def normalize_category(cat: str) -> str:
            """Map LLM category to valid SkillCategory."""
            cat_lower = cat.lower().strip()
            if cat_lower in VALID_CATEGORIES:
                return cat_lower
            # Check mapping
            if cat_lower in CATEGORY_MAPPING:
                return CATEGORY_MAPPING[cat_lower]
            # Default fallback
            return "technical"

        extractions = []
        for item in data:
            try:
                # Parse required skills
                required_skills = []
                for skill_data in item.get("required_skills", []):
                    try:
                        raw_category = skill_data.get("category", "technical")
                        skill = ExtractedSkill(
                            name=skill_data.get("name", "").strip(),
                            category=normalize_category(raw_category),
                            confidence=float(skill_data.get("confidence", 0.5))
                        )
                        if skill.name:
                            required_skills.append(skill)
                    except Exception as e:
                        logger.warning(f"Failed to parse required skill: {skill_data}, error: {e}")

                # Parse inferred skills
                inferred_skills = []
                for skill_data in item.get("inferred_skills", []):
                    try:
                        raw_category = skill_data.get("category", "technical")
                        skill = ExtractedSkill(
                            name=skill_data.get("name", "").strip(),
                            category=normalize_category(raw_category),
                            confidence=float(skill_data.get("confidence", 0.5))
                        )
                        if skill.name:
                            inferred_skills.append(skill)
                    except Exception as e:
                        logger.warning(f"Failed to parse inferred skill: {skill_data}, error: {e}")

                # Parse experience years
                exp_min = item.get("experience_years_min")
                exp_max = item.get("experience_years_max")

                # Handle various formats
                if exp_min is not None:
                    try:
                        exp_min = int(exp_min)
                    except (ValueError, TypeError):
                        exp_min = None

                if exp_max is not None:
                    try:
                        exp_max = int(exp_max)
                    except (ValueError, TypeError):
                        exp_max = None

                # Create extraction object
                extraction = JobSkillExtraction(
                    job_ids=item.get("job_ids", []),
                    required_skills=required_skills,
                    inferred_skills=inferred_skills,
                    experience_years_min=exp_min,
                    experience_years_max=exp_max,
                    primary_domain=item.get("primary_domain")
                )
                extractions.append(extraction)

            except Exception as e:
                logger.warning(f"Failed to parse extraction item: {item}, error: {e}")
                continue

        # Validate that all job_ids are accounted for
        all_job_ids = {job["id"] for job in jobs}
        extracted_job_ids = set()
        for extraction in extractions:
            extracted_job_ids.update(extraction.job_ids)

        missing_ids = all_job_ids - extracted_job_ids
        if missing_ids:
            logger.warning(f"Jobs not in extractions: {missing_ids}")
            # Add empty extractions for missing jobs
            for job_id in missing_ids:
                extractions.append(JobSkillExtraction(job_ids=[job_id]))

        return extractions

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
    # Cleanup
    # ============================================

    async def close(self) -> None:
        """Close Redis connection."""
        if self._redis:
            await self._redis.close()
            self._redis = None


# ============================================
# Convenience Functions
# ============================================

async def extract_job_skills(
    jobs: List[JobInput],
    use_cache: bool = True
) -> Tuple[List[JobSkillExtraction], UsageStats]:
    """
    Convenience function to extract skills from job postings.

    Args:
        jobs: List of job dicts with id, title, description
        use_cache: Whether to use Redis caching

    Returns:
        Tuple of (extractions list, usage stats dict)

    Usage:
        extractions, usage = await extract_job_skills([
            {"id": "job1", "title": "Data Engineer", "description": "..."}
        ])
    """
    extractor = JobSkillExtractorService()
    try:
        return await extractor.extract_skills(jobs, use_cache)
    finally:
        await extractor.close()


async def extract_single_job_skills(
    job_id: str,
    title: str,
    description: str,
    use_cache: bool = True
) -> Tuple[JobSkillExtraction, UsageStats]:
    """
    Convenience function to extract skills from a single job.

    Args:
        job_id: Job identifier
        title: Job title
        description: Job description text
        use_cache: Whether to use Redis caching

    Returns:
        Tuple of (JobSkillExtraction object, usage stats dict)

    Usage:
        extraction, usage = await extract_single_job_skills(
            job_id="ey_12345",
            title="Data Engineer",
            description="We are looking for..."
        )
    """
    extractor = JobSkillExtractorService()
    try:
        job: JobInput = {
            "id": job_id,
            "title": title,
            "description": description
        }
        return await extractor.extract_skills_single(job, use_cache)
    finally:
        await extractor.close()
