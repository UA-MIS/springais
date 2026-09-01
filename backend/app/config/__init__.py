"""Configuration module for SpringAIS backend."""

import os
from dotenv import load_dotenv
from openai import AsyncOpenAI
import redis.asyncio as redis

from .matching_config import (
    MatchMode,
    MatchingConfig,
    get_matching_config,
    SCORING_WEIGHTS,
    ScoringWeights,
)

# Load environment variables
load_dotenv()

# OpenAI configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Chat model used for resume/job skill extraction, roadmaps and learning content.
#
# Env-configurable on purpose. This model id used to be hardcoded as
# "gpt-5.2-chat-latest" in eight places; OpenAI has since deprecated that id, so
# every LLM-backed feature failed with a 404 "model has been deprecated" that
# only surfaced when a user actually uploaded a resume. Overriding
# OPENAI_CHAT_MODEL in .env now recovers from a future deprecation with no code
# change. Note a retired model can still appear in models.list(), so presence in
# that listing is not a validity check - you have to call it.
OPENAI_CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-5.4")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")


def get_openai_client() -> AsyncOpenAI:
    """
    Create and return an OpenAI API client.

    Returns:
        AsyncOpenAI client configured with API key

    Raises:
        ValueError: If OPENAI_API_KEY is not set in environment
    """
    if not OPENAI_API_KEY:
        raise ValueError(
            "OPENAI_API_KEY not found in environment variables. "
            "Please set it in .env file or environment."
        )

    return AsyncOpenAI(api_key=OPENAI_API_KEY)


async def get_redis_client() -> redis.Redis:
    """
    Create and return a Redis client with async support.

    Returns:
        Redis client configured with connection URL
    """
    if not REDIS_URL:
        raise ValueError(
            "REDIS_URL not found in environment variables. "
            "Please set it in .env file or environment."
        )

    client = redis.from_url(
        REDIS_URL,
        encoding="utf-8",
        decode_responses=False,
        max_connections=10
    )
    return client


def get_settings():
    """Return settings object with configuration values."""
    class Settings:
        REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    return Settings()


__all__ = [
    "MatchMode",
    "MatchingConfig",
    "get_matching_config",
    "SCORING_WEIGHTS",
    "ScoringWeights",
    "get_openai_client",
    "get_redis_client",
    "get_settings",
]
