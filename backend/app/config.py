"""
Configuration for SpringAIS backend services.

Provides client factories for:
- OpenAI API (text-embedding-3-large)
- Redis cache
- Database session
"""

import os
from typing import Optional
from dotenv import load_dotenv
from openai import AsyncOpenAI
import redis.asyncio as redis
from sqlalchemy.orm import Session

# Load environment variables
load_dotenv()


# ============================================
# Environment Variables
# ============================================

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/springais")

# Normalize common DSN formats to psycopg3 dialect.
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)


# ============================================
# Client Factories
# ============================================

def get_openai_client() -> AsyncOpenAI:
    """
    Create and return an OpenAI API client.

    Returns:
        AsyncOpenAI client configured with API key

    Raises:
        ValueError: If OPENAI_API_KEY is not set in environment

    Usage:
        client = get_openai_client()
        response = await client.embeddings.create(
            model="text-embedding-3-large",
            input="Python Programming"
        )
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

    Raises:
        ValueError: If REDIS_URL is invalid
        redis.ConnectionError: If cannot connect to Redis

    Usage:
        redis_client = await get_redis_client()
        await redis_client.set("key", "value")
        value = await redis_client.get("key")
    """
    if not REDIS_URL:
        raise ValueError(
            "REDIS_URL not found in environment variables. "
            "Please set it in .env file or environment."
        )

    try:
        # Create Redis client with connection pooling
        client = redis.from_url(
            REDIS_URL,
            encoding="utf-8",
            decode_responses=False,  # We'll handle JSON encoding manually
            max_connections=10
        )

        # Test connection
        await client.ping()

        return client

    except redis.ConnectionError as e:
        raise redis.ConnectionError(
            f"Failed to connect to Redis at {REDIS_URL}. "
            f"Ensure Redis is running. Error: {e}"
        )
    except Exception as e:
        raise ValueError(f"Invalid REDIS_URL: {REDIS_URL}. Error: {e}")


# ============================================
# Client Testing Utilities
# ============================================

async def test_openai_connection() -> bool:
    """
    Test OpenAI API connection.

    Returns:
        True if connection successful, False otherwise

    Usage:
        if await test_openai_connection():
            print("✓ OpenAI API connected")
    """
    try:
        client = get_openai_client()
        # Simple test: list models
        models = await client.models.list()
        return True
    except Exception as e:
        print(f"✗ OpenAI API connection failed: {e}")
        return False


async def test_redis_connection() -> bool:
    """
    Test Redis connection.

    Returns:
        True if connection successful, False otherwise

    Usage:
        if await test_redis_connection():
            print("✓ Redis connected")
    """
    try:
        client = await get_redis_client()
        await client.ping()
        await client.close()
        return True
    except Exception as e:
        print(f"✗ Redis connection failed: {e}")
        return False


async def test_all_connections() -> dict:
    """
    Test all service connections.

    Returns:
        Dictionary with connection status for each service

    Usage:
        status = await test_all_connections()
        print(f"OpenAI: {status['openai']}")
        print(f"Redis: {status['redis']}")
    """
    return {
        "openai": await test_openai_connection(),
        "redis": await test_redis_connection()
    }


# ============================================
# Main Test Function
# ============================================

if __name__ == "__main__":
    import asyncio

    async def main():
        print("Testing SpringAIS service connections...\n")

        # Test OpenAI
        print("Testing OpenAI API...")
        openai_ok = await test_openai_connection()
        if openai_ok:
            print("✓ OpenAI API connected successfully\n")
        else:
            print("✗ OpenAI API connection failed\n")

        # Test Redis
        print("Testing Redis...")
        redis_ok = await test_redis_connection()
        if redis_ok:
            print("✓ Redis connected successfully\n")
        else:
            print("✗ Redis connection failed\n")

        # Summary
        print("-" * 40)
        if openai_ok and redis_ok:
            print("✓ All services connected successfully!")
        else:
            print("✗ Some services failed to connect")
            if not openai_ok:
                print("  - Check OPENAI_API_KEY in .env")
            if not redis_ok:
                print("  - Check Redis is running (docker-compose up -d redis)")

    asyncio.run(main())
