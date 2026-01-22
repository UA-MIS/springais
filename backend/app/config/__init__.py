"""Configuration module for SpringAIS backend."""

import os
from dotenv import load_dotenv
from openai import AsyncOpenAI
import redis.asyncio as redis

from .matching_config import (
    MatchMode,
    MatchingConfig,
    get_matching_config,
    MODE_WEIGHTS,
    SKILL_MATCH_THRESHOLDS,
)

# Load environment variables
load_dotenv()

# OpenAI configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
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
    "MODE_WEIGHTS",
    "SKILL_MATCH_THRESHOLDS",
    "get_openai_client",
    "get_redis_client",
    "get_settings",
]
