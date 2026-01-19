"""Configuration module for SpringAIS backend."""

import os
from dotenv import load_dotenv
from openai import AsyncOpenAI

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

__all__ = [
    "MatchMode",
    "MatchingConfig",
    "get_matching_config",
    "MODE_WEIGHTS",
    "SKILL_MATCH_THRESHOLDS",
    "get_openai_client",
]
