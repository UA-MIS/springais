"""
Match caching service with smart invalidation.

Cache keys structure:
- matches:{user_id}:{mode}:{filters_hash} -> cached match results
- user_skills:{user_id}:version -> skill set version for invalidation
- embeddings:version -> global embedding cache version

This service provides efficient caching for match results with automatic
invalidation when user skills change.
"""

import json
import hashlib
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime

import redis.asyncio as aioredis
from app.config import get_redis_client

logger = logging.getLogger(__name__)

MATCH_CACHE_TTL = 300  # 5 minutes for match results
SKILL_VERSION_TTL = 3600  # 1 hour for skill versions


class MatchCacheService:
    """Smart caching for match results with proper invalidation."""

    def __init__(self):
        self._redis: Optional[aioredis.Redis] = None

    async def _get_redis(self) -> aioredis.Redis:
        if self._redis is None:
            self._redis = await get_redis_client()
        return self._redis

    def _make_cache_key(
        self,
        user_id: str,
        mode: str,
        filters: Dict[str, Any],
        limit: int,
        offset: int
    ) -> str:
        """Generate deterministic cache key with user_id prefix for targeted invalidation."""
        filter_str = json.dumps(filters, sort_keys=True)
        key_data = f"{mode}:{filter_str}:{limit}:{offset}"
        key_hash = hashlib.md5(key_data.encode()).hexdigest()[:12]
        # Include user_id as prefix for easy pattern-based deletion
        return f"matches:{user_id}:{key_hash}"

    async def get_cached_matches(
        self,
        user_id: str,
        mode: str,
        filters: Dict[str, Any],
        limit: int,
        offset: int
    ) -> Optional[Dict[str, Any]]:
        """Get cached match results if valid."""
        redis = await self._get_redis()
        key = self._make_cache_key(user_id, mode, filters, limit, offset)

        try:
            cached = await redis.get(key)
            if cached:
                data = json.loads(cached)
                # Verify cache is still valid (skills haven't changed)
                skill_version = await self._get_user_skill_version(user_id)
                if data.get("skill_version") == skill_version:
                    logger.debug(f"Cache hit for matches: {key}")
                    return data
                else:
                    logger.debug(f"Cache stale (skill version mismatch): {key}")
        except Exception as e:
            logger.warning(f"Cache read error: {e}")

        return None

    async def cache_matches(
        self,
        user_id: str,
        mode: str,
        filters: Dict[str, Any],
        limit: int,
        offset: int,
        matches: List[Dict],
        total_count: int
    ) -> None:
        """Cache match results with skill version for invalidation."""
        redis = await self._get_redis()
        key = self._make_cache_key(user_id, mode, filters, limit, offset)

        try:
            skill_version = await self._get_user_skill_version(user_id)
            cache_data = {
                "matches": matches,
                "total_count": total_count,
                "skill_version": skill_version,
                "cached_at": datetime.utcnow().isoformat(),
            }
            await redis.setex(key, MATCH_CACHE_TTL, json.dumps(cache_data, default=str))
            logger.debug(f"Cached matches: {key}")
        except Exception as e:
            logger.warning(f"Cache write error: {e}")

    async def _get_user_skill_version(self, user_id: str) -> str:
        """Get user's skill version for cache validation."""
        redis = await self._get_redis()
        key = f"user_skills:{user_id}:version"

        version = await redis.get(key)
        if version:
            return version.decode() if isinstance(version, bytes) else version
        return "v1"

    async def invalidate_user_cache(self, user_id: str) -> None:
        """Invalidate all cached matches for a specific user (call when skills change)."""
        redis = await self._get_redis()

        # Update skill version (invalidates all caches that check version)
        version_key = f"user_skills:{user_id}:version"
        new_version = f"v{datetime.utcnow().timestamp()}"
        await redis.setex(version_key, SKILL_VERSION_TTL, new_version)

        # Delete only THIS user's cache entries (not other users')
        try:
            # Pattern matches only this user's keys: matches:{user_id}:*
            pattern = f"matches:{user_id}:*"
            deleted_count = 0
            async for key in redis.scan_iter(match=pattern, count=100):
                await redis.delete(key)
                deleted_count += 1
            if deleted_count > 0:
                logger.info(f"Deleted {deleted_count} match cache entries for user {user_id}")
        except Exception as e:
            logger.warning(f"Cache invalidation error: {e}")

        logger.info(f"Invalidated match cache for user {user_id}")

    async def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics for monitoring."""
        redis = await self._get_redis()

        try:
            match_keys = 0
            skill_version_keys = 0
            async for key in redis.scan_iter(match="matches:*", count=100):
                match_keys += 1
            async for key in redis.scan_iter(match="user_skills:*", count=100):
                skill_version_keys += 1

            return {
                "match_cache_entries": match_keys,
                "skill_version_entries": skill_version_keys,
                "match_cache_ttl_seconds": MATCH_CACHE_TTL,
            }
        except Exception as e:
            logger.warning(f"Cache stats error: {e}")
            return {"error": str(e)}


# Singleton instance
_match_cache: Optional[MatchCacheService] = None


def get_match_cache() -> MatchCacheService:
    """Get singleton match cache service instance."""
    global _match_cache
    if _match_cache is None:
        _match_cache = MatchCacheService()
    return _match_cache
