# Epic 4: Achievement System

> **Phase**: 2
> **Estimated Stories**: 5
> **Dependencies**: Epic 1 (Server Foundation) complete
> **PRD References**: FR-011, FR-012, FR-013
> **Architecture References**: Sections 2.5-2.6, 3.2, 4.3
> **Security Review Fixes**: FINDING-PERF-001

---

## Story 4.1: Achievement Catalog Table, Model, and Seed Data

**Size**: M

**Description**: Create the `achievement_catalog` table with all 24 achievements (14 migrated from the existing frontend + 10 new). This is a server-side catalog that replaces the hardcoded `ACHIEVEMENTS` array in `AdventureModeContext.tsx`.

**Acceptance Criteria**:
1. A SQLAlchemy model `AchievementCatalog` exists in `backend/app/models/achievement.py` with columns: `id` (string PK), `name`, `description`, `icon`, `category` (enum: onboarding/learning/engagement/exploration/mastery), `xp_reward`, `coin_reward`, `trigger_type` (enum: event_based/threshold_based/manual), `trigger_config` (JSONB), `is_active` (boolean), `sort_order`.
2. CHECK constraints validate `category` and `trigger_type` values.
3. The Alembic migration creates the table and seeds 24 achievement rows matching FR-012.1 exactly.
4. Seed data includes all 14 migrated achievements and 10 new achievements with correct trigger_config JSON.
5. The model is exported from `backend/app/models/__init__.py`.
6. Tests verify: all 24 rows are seeded, trigger_config JSON is well-formed for each trigger_type, categories are correct.

**Dev Notes**:
- File: `backend/app/models/achievement.py` (new)
- File: `backend/app/data/gamification_seed.py` (new or extend -- achievement seed data)
- File: Alembic migration (extend or new revision)
- Architecture Section 2.5 has the exact model code.
- `trigger_config` schema examples:
  - event_based: `{"event_type": "module_completed", "count": 5}` (for skill_master)
  - threshold_based: `{"field": "login_streak", "threshold": 3}` (for daily_login_3)
  - manual: `{"action": "enable_adventure_mode"}` (for first_login)
- The 24 achievements are defined in PRD FR-012.1 (14 migrated + 10 new).

**D-ID References**: D-MM-6, FR-011, FR-012

**Dependencies**: Epic 1 Story 1.1 (Alembic)

---

## Story 4.2: UserAchievement Model and Migration

**Size**: S

**Description**: Create the `user_achievements` table that tracks which achievements each user has unlocked, with timestamps.

**Acceptance Criteria**:
1. A SQLAlchemy model `UserAchievement` exists in `backend/app/models/achievement.py` with columns: `id` (UUID PK), `user_id` (UUID FK -> `user_profiles.id`), `achievement_id` (string FK -> `achievement_catalog.id`), `unlocked_at` (datetime).
2. UNIQUE constraint on `(user_id, achievement_id)` prevents duplicate unlocks.
3. Indexes on `user_id` and `(user_id, achievement_id)`.
4. Alembic migration creates the table.
5. Tests verify: inserting a user achievement, unique constraint prevents duplicates, cascade delete works when user is deleted.

**Dev Notes**:
- File: `backend/app/models/achievement.py` (extend)
- File: Alembic migration (extend)
- Architecture Section 2.6 has the exact model code.

**D-ID References**: FR-013

**Dependencies**: Story 4.1

---

## Story 4.3: Achievement Evaluation Engine

**Size**: L

**Description**: Implement `achievement_service.py` with the server-side achievement evaluation engine. After every gamification event, this service checks all relevant achievements and unlocks any whose conditions are newly met. Must incorporate FINDING-PERF-001 (batch event count queries).

**Acceptance Criteria**:
1. `AchievementService.load_catalog(db)` loads and caches the active achievement catalog in memory (catalog is small and static).
2. `evaluate_achievements(db, user_id, event_type, progression)`:
   - Loads catalog from cache.
   - Gets user's already-unlocked achievement IDs in a single query.
   - For event-based achievements: executes a SINGLE batch query `SELECT event_type, COUNT(*) FROM gamification_events WHERE user_id = ? GROUP BY event_type` (FINDING-PERF-001 fix) and evaluates all event-based triggers against the result.
   - For threshold-based achievements: checks `user_progression` fields against trigger_config thresholds.
   - For manual achievements: skips (handled by specific endpoints).
   - For each newly unlocked achievement: inserts `user_achievements` row, awards XP and Coins via `progression_service`.
   - Returns list of `UnlockedAchievement` with name, description, rewards.
3. Achievement evaluation completes within 50ms (NFR-001 budget).
4. Tests cover:
   - Event-based achievement unlocks after reaching count threshold.
   - Threshold-based achievement unlocks (e.g., login_streak >= 3).
   - Manual achievement does not auto-trigger.
   - Already-unlocked achievements are not re-evaluated.
   - Multiple achievements can unlock in a single evaluation.
   - Achievement XP/Coin rewards are correctly awarded.
   - Batch query optimization (verify single GROUP BY query, not N+1).

**Dev Notes**:
- File: `backend/app/services/achievement_service.py` (new)
- CRITICAL: FINDING-PERF-001 fix -- use `SELECT event_type, COUNT(*) FROM gamification_events WHERE user_id = :uid GROUP BY event_type` instead of individual COUNT queries per achievement.
- The catalog is cached in memory (`self._catalog_cache`). Cache is loaded on first call. For ~25 rows this is safe.
- Architecture Section 4.3 has the service interface.
- Service singleton: `achievement_service = AchievementService()`.

**D-ID References**: FR-013, NFR-001, D-MM-6

**Dependencies**: Stories 4.1, 4.2, Epic 1 Story 1.5 (progression_service)

---

## Story 4.4: Achievement API Endpoints

**Size**: S

**Description**: Create the achievement API router with endpoints for fetching the catalog (with unlock status) and the user's unlocked achievements.

**Acceptance Criteria**:
1. `GET /api/achievements/catalog` returns all active achievements with `is_unlocked` and `unlocked_at` per user.
2. `GET /api/achievements` returns only the user's unlocked achievements with timestamps.
3. Both endpoints require JWT authentication.
4. Router is registered in `backend/app/routes/__init__.py` and `backend/app/main.py`.
5. Pydantic schemas exist in `backend/app/schemas/achievement.py`.
6. Tests cover: catalog returns all 24 achievements, some unlocked and some not; unlocked endpoint returns only earned achievements with correct count.

**Dev Notes**:
- File: `backend/app/routes/achievements.py` (new)
- File: `backend/app/schemas/achievement.py` (new)
- File: `backend/app/routes/__init__.py` (modify -- register router)
- File: `backend/app/main.py` (modify -- include router)
- Architecture Section 3.2 has the endpoint schemas and responses.
- Appendix A has the Pydantic models.

**D-ID References**: FR-011.3, FR-013.4

**Dependencies**: Story 4.3

---

## Story 4.5: Frontend Achievement Panel Migration from localStorage

**Size**: M

**Description**: Migrate the `AchievementsPanel.tsx` component to fetch achievement data from the server API instead of reading from the localStorage-backed context. Remove the hardcoded `ACHIEVEMENTS` array from `AdventureModeContext.tsx`.

**Acceptance Criteria**:
1. `AchievementsPanel.tsx` fetches achievement data from `GET /api/achievements/catalog` via React Query.
2. The hardcoded `ACHIEVEMENTS` array in `AdventureModeContext.tsx` is removed.
3. All `useEffect` hooks in `AdventureModeContext.tsx` that auto-unlock achievements client-side are removed (achievements are now evaluated server-side).
4. The `unlockAchievement()` function is removed from the context or replaced with a no-op (achievements are now server-driven).
5. Achievement unlock toasts still fire when the server indicates a new unlock (from gamification reward responses).
6. Tests cover: panel renders server achievements correctly, locked/unlocked states display properly, achievement unlock toast fires from API response.

**Dev Notes**:
- File: `frontend/src/components/game/AchievementsPanel.tsx` (modify)
- File: `frontend/src/context/AdventureModeContext.tsx` (modify -- remove ACHIEVEMENTS array, remove useEffect triggers)
- File: `frontend/src/services/achievementService.ts` (new -- API client)
- Use React Query key `['achievements', 'catalog']` with 5-minute stale time.
- Architecture Section 7.1 describes removing localStorage. Section 7.3 has the query invalidation pattern.

**D-ID References**: FR-013, FR-022

**Dependencies**: Story 4.4

---

## Story Dependency Graph (Epic 4)

```
Epic 1 complete
 |
 v
4.1 Achievement Catalog + Seed
 |
 v
4.2 UserAchievement Model
 |
 v
4.3 Achievement Engine (FINDING-PERF-001)
 |
 v
4.4 Achievement API Endpoints
 |
 v
4.5 Frontend Achievement Panel Migration
```
