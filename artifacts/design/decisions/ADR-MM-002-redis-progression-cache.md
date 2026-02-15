# ADR-MM-002: Redis Caching for Progression State with DB Fallback

**Status**: Proposed
**Date**: 2026-02-11
**Decision**: D-MM-4

## Context

`GET /api/progression` will be the most frequently called gamification endpoint -- invoked on every page load, by the AdventureHUD, and after every action that triggers rewards. The response aggregates data from `user_progression`, `user_equipped_items`, `user_achievements` (count), and `user_quest_progress` (count). Without caching, this requires multiple DB queries on every request.

Redis is already used in the project for match caching (`backend/app/services/match_cache_service.py`, `backend/app/config.py`).

## Decision

Cache the full progression state in Redis with a 5-minute TTL. Invalidate on any mutation (XP award, Coin change, level-up, equip/unequip, login streak update).

### Cache Strategy

- **Key**: `progression:{user_id}` (string)
- **Value**: JSON blob of the full `ProgressionResponse` data
- **TTL**: 300 seconds (5 minutes)
- **Invalidation**: Explicit `DELETE` after any mutation in `progression_service`

### Read Path

```
1. Check Redis for progression:{user_id}
2. If cache hit: deserialize and return
3. If cache miss or Redis unavailable: query DB, compute derived fields, cache result, return
```

### Write Path

```
1. Perform DB mutation (within transaction)
2. After commit: delete Redis key progression:{user_id}
3. Next read will repopulate the cache
```

### Graceful Degradation

If Redis is unavailable:
- All operations fall back to direct DB queries.
- A warning is logged.
- No user-facing errors.
- Performance degrades but functionality is preserved.

## Consequences

- **Positive**: `GET /api/progression` response time < 100ms (p95) from cache.
- **Positive**: Reduces DB load for the most frequent query.
- **Positive**: Uses existing Redis infrastructure.
- **Negative**: Cache invalidation adds complexity to every mutation method.
- **Negative**: Brief window (between DB commit and cache delete) where stale data could be served. Acceptable for gamification data.

## Alternatives Considered

1. **No caching (DB only)**: Rejected. The progression query joins multiple tables and will be called very frequently.
2. **In-memory cache (Python dict/lru_cache)**: Rejected. Does not survive process restarts. Not shared across multiple workers if scaled.
3. **Write-through cache (update cache on mutation instead of invalidate)**: Considered but rejected for simplicity. Invalidate-on-write is simpler and the read-through rebuild is fast.
