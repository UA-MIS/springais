# Epic 1: Server-Side Progression Foundation

> **Priority**: 0 (CRITICAL -- everything depends on this)
> **Phase**: 1
> **Estimated Stories**: 8
> **Dependencies**: None (this is the foundation)
> **PRD References**: FR-001, FR-002, FR-003, FR-004, FR-005
> **Architecture References**: Sections 2.2-2.4, 3.1, 4.2, 5.1, 8, 9
> **Security Review Fixes**: FINDING-SEC-002, FINDING-INT-001, FINDING-ARCH-001

---

## Story 1.1: Alembic Setup and Initial Migration Framework

**Size**: S

**Description**: Initialize Alembic migration framework in the backend so all new gamification tables are managed through versioned migrations rather than `Base.metadata.create_all()`. This is the foundational infrastructure that all subsequent database stories depend on.

**Acceptance Criteria**:
1. `alembic init alembic` has been run in `backend/`, creating `backend/alembic/` directory and `backend/alembic.ini`.
2. `backend/alembic/env.py` is configured to:
   - Import `Base` from `app.models.base`.
   - Import all model modules so they register with `Base.metadata`.
   - Read `DATABASE_URL` from the same environment variable used by `backend/app/database.py`.
   - Set `target_metadata = Base.metadata`.
3. `alembic` is confirmed present in `backend/requirements.txt` (already listed per codebase analysis).
4. Running `alembic revision --autogenerate -m "test"` from `backend/` produces a valid (possibly empty) migration file, confirming the setup works.
5. A test verifies that Alembic can connect to the database and detect the existing tables.

**Dev Notes**:
- File: `backend/alembic.ini` (new)
- File: `backend/alembic/env.py` (new, auto-generated then customized)
- File: `backend/alembic/versions/` (new directory)
- The existing `Base.metadata.create_all()` call in `backend/app/main.py` remains for existing tables. New gamification tables are Alembic-only.
- Reference the database URL pattern from `backend/app/database.py` -- uses `postgresql+psycopg://` driver.
- D-MM-11: Adopt Alembic for schema migrations.

**D-ID References**: D-MM-11, ADR-MM-001

**Dependencies**: None

---

## Story 1.2: UserProgression Model and Migration

**Size**: M

**Description**: Create the `user_progression` table and SQLAlchemy model that stores per-user gamification state (XP, level, coin balance, login streak, adventure mode toggle). This replaces the localStorage `springais-adventure-mode` key with a server-side, per-user row.

**Acceptance Criteria**:
1. A SQLAlchemy model `UserProgression` exists in `backend/app/models/progression.py` with columns: `id` (UUID PK), `user_id` (UUID FK -> `user_profiles.id`, unique), `xp_total` (integer, default 0), `level` (integer, default 1), `coin_balance` (integer, default 0), `login_streak` (integer, default 0), `last_login_date` (date, nullable), `adventure_mode_enabled` (boolean, default false), `created_at`, `updated_at`.
2. CHECK constraints exist: `coin_balance >= 0`, `xp_total >= 0`, `level >= 1`.
3. A unique index exists on `user_id`.
4. An Alembic migration creates this table.
5. The model is exported from `backend/app/models/__init__.py`.
6. A test creates a `UserProgression` row, verifies all defaults, verifies the unique constraint on `user_id`, and verifies CHECK constraints reject invalid values (negative coin_balance, negative xp_total, level < 1).

**Dev Notes**:
- File: `backend/app/models/progression.py` (new)
- File: `backend/app/models/__init__.py` (modify -- add export)
- File: `backend/alembic/versions/001_add_gamification_tables.py` (new migration)
- Use `TimestampMixin` from `backend/app/models/base.py` for `created_at` / `updated_at`.
- Use `PGUUID(as_uuid=True)` for UUID columns (matching existing model patterns).
- FK uses `ondelete="CASCADE"` so deleting a user profile cascades to gamification data.
- Architecture Section 2.2 has the exact model code.

**D-ID References**: D-MM-1, FR-001

**Dependencies**: Story 1.1 (Alembic setup)

---

## Story 1.3: GamificationEvent Model and Migration

**Size**: M

**Description**: Create the `gamification_events` append-only event log table that records every action triggering a reward. This table supports idempotency via the `event_key` column with a partial unique index.

**Acceptance Criteria**:
1. A SQLAlchemy model `GamificationEvent` exists in `backend/app/models/progression.py` with columns: `id` (UUID PK), `user_id` (UUID FK -> `user_progression.user_id`), `event_type` (string 100), `event_key` (string 255, nullable), `xp_awarded` (integer, default 0), `coins_awarded` (integer, default 0), `metadata` (JSONB, nullable), `created_at`.
2. A partial unique index exists on `(user_id, event_key) WHERE event_key IS NOT NULL` to enforce idempotency for one-time events.
3. Standard indexes exist on `user_id`, `event_type`, and `created_at`.
4. The Alembic migration creates this table.
5. A test verifies: inserting two events with the same `(user_id, event_key)` raises IntegrityError; inserting two events with `event_key = NULL` succeeds (repeatable events); indexes are created.

**Dev Notes**:
- File: `backend/app/models/progression.py` (extend -- add GamificationEvent)
- FK references `user_progression.user_id` (not `user_profiles.id`) per architecture Section 2.3.
- FINDING-INT-002 (advisory): The FK to `user_progression.user_id` means a progression row must exist first. The `reward_hook_service` will call `ensure_progression_exists()` before inserting events.
- The partial unique index uses `postgresql_where=text("event_key IS NOT NULL")`.
- Architecture Section 2.3 has the exact model code.

**D-ID References**: D-MM-2, FR-002

**Dependencies**: Story 1.2 (UserProgression model)

---

## Story 1.4: CoinTransaction Model and Migration

**Size**: S

**Description**: Create the `coin_transactions` ledger table that records every coin credit and debit for auditability and cheat prevention.

**Acceptance Criteria**:
1. A SQLAlchemy model `CoinTransaction` exists in `backend/app/models/progression.py` with columns: `id` (UUID PK), `user_id` (UUID FK -> `user_progression.user_id`), `amount` (integer), `balance_after` (integer), `transaction_type` (string 20), `source` (string 100), `reference_id` (UUID, nullable), `created_at`.
2. CHECK constraints exist: `balance_after >= 0`, `transaction_type IN ('earned', 'spent', 'refund')`.
3. Indexes exist on `user_id` and `created_at`.
4. The Alembic migration creates this table.
5. A test verifies: creating a transaction with negative `balance_after` raises an error; `transaction_type` must be one of the valid values.

**Dev Notes**:
- File: `backend/app/models/progression.py` (extend -- add CoinTransaction)
- Architecture Section 2.4 has the exact model code.
- The `amount` column is positive for credits (earned/refund) and negative for debits (spent).

**D-ID References**: D-MM-3, FR-003

**Dependencies**: Story 1.2 (UserProgression model)

---

## Story 1.5: Progression Service -- Core Mutations

**Size**: L

**Description**: Implement `progression_service.py` with `award_xp()`, `award_coins()`, `spend_coins()`, and `ensure_progression_exists()`. This is the single gateway for all XP and coin balance changes. Must incorporate FINDING-SEC-002 (lock before event insert) and FINDING-INT-001 (flush after each mutation).

**Acceptance Criteria**:
1. `award_xp(db, user_id, amount, event_type, event_key, metadata)` atomically:
   - Acquires SELECT FOR UPDATE on `user_progression` row FIRST (FINDING-SEC-002 fix).
   - Checks idempotency: if `event_key` exists for this user in `gamification_events`, returns `{already_awarded: True}`.
   - Handles `IntegrityError` from the unique constraint gracefully, returning `{already_awarded: True}` (FINDING-SEC-002 fix).
   - Inserts a `gamification_events` row.
   - Increments `xp_total`.
   - Recomputes `level` using the XP threshold table.
   - If level changed, awards level-up coin bonus (`level * 10` per level gained).
   - Calls `db.flush()` after each balance mutation (FINDING-INT-001 fix).
   - Returns `AwardXPResult` dataclass.
2. `award_coins(db, user_id, amount, source, reference_id)` atomically:
   - Acquires SELECT FOR UPDATE on `user_progression`.
   - Increments `coin_balance`.
   - Inserts `coin_transaction` with correct `balance_after`.
   - Calls `db.flush()` after mutation (FINDING-INT-001 fix).
   - Returns `AwardCoinsResult`.
3. `spend_coins(db, user_id, amount, source, reference_id)` atomically:
   - Acquires SELECT FOR UPDATE on `user_progression`.
   - Checks `coin_balance >= amount`; returns failure if not.
   - Decrements `coin_balance`.
   - Inserts `coin_transaction` with negative amount and correct `balance_after`.
   - Calls `db.flush()`.
   - Returns `SpendCoinsResult`.
4. `ensure_progression_exists(db, user_id)` creates a default row if none exists.
5. All result types are dataclasses: `AwardXPResult`, `AwardCoinsResult`, `SpendCoinsResult`.
6. Tests cover:
   - Normal XP award and level-up detection.
   - Multi-level jumps (awarding enough XP to skip levels).
   - Idempotent XP award (same event_key returns already_awarded).
   - Coin award updates balance and creates transaction.
   - Coin spend succeeds when balance sufficient.
   - Coin spend fails when balance insufficient (no state change).
   - Concurrent spend (two spends that would overdraw -- only one succeeds).
   - `db.flush()` ensures correct `balance_after` in multi-step operations.

**Dev Notes**:
- File: `backend/app/services/progression_service.py` (new)
- CRITICAL: Acquire row lock (`SELECT FOR UPDATE`) BEFORE checking idempotency or inserting events (FINDING-SEC-002).
- CRITICAL: Call `db.flush()` after every balance mutation so subsequent reads in the same transaction see updated values (FINDING-INT-001).
- The XP threshold table and `compute_level_from_xp()` function are defined in Architecture Section 5.1.
- Level-up coin bonus: for each level gained, award `level * 10` coins (FR-010, event type `level_up_bonus`).
- Service is instantiated as module-level singleton: `progression_service = ProgressionService()`.
- Route handlers pass `db: Session` from `Depends(get_db)`.

**D-ID References**: D-MM-1, D-MM-2, D-MM-3, D-MM-5, FR-005, ADR-MM-004, ADR-MM-005

**Dependencies**: Stories 1.2, 1.3, 1.4 (all three models)

---

## Story 1.6: Progression Service -- Login and Streak Tracking

**Size**: M

**Description**: Implement `record_login()` in the progression service to handle daily login recording, streak calculation, daily coin awards, and streak milestone bonuses. Includes the Redis login guard for idempotency.

**Acceptance Criteria**:
1. `record_login(db, user_id)`:
   - Acquires SELECT FOR UPDATE on `user_progression`.
   - If `last_login_date == today`: returns no-op (`is_new_day=False`).
   - If `last_login_date == yesterday`: increments `login_streak`.
   - Otherwise: resets `login_streak` to 1.
   - Updates `last_login_date = today` (UTC).
   - Awards 10 daily login coins via `award_coins()`.
   - Checks streak milestones: awards 50 bonus coins at multiples of 3, 100 bonus coins at multiples of 7.
   - Returns `LoginResult` with streak, coins_awarded, streak_bonuses, total_coins_awarded.
2. Redis login guard (`login_guard:{user_id}:{date}`) prevents processing the same login twice:
   - Before DB operations, checks Redis for the guard key.
   - After successful processing, sets the guard key with 24h TTL.
   - If Redis is unavailable, falls back to DB-based check (FINDING-ARCH-003: use sync Redis matching existing codebase pattern).
3. Tests cover:
   - First login ever (streak = 1, 10 coins).
   - Consecutive day login (streak increments, 10 coins).
   - 3-day streak milestone (10 + 50 = 60 coins on day 3).
   - 7-day streak milestone (10 + 100 = 110 coins on day 7).
   - 6-day streak with 3-day multiple (10 + 50 on day 6).
   - Missed day resets streak to 1.
   - Same-day duplicate login is no-op.
   - Redis unavailable falls back to DB check gracefully.

**Dev Notes**:
- File: `backend/app/services/progression_service.py` (extend)
- Redis usage: Use synchronous Redis client from `backend/app/config.py` (matching existing `match_cache_service.py` pattern -- FINDING-ARCH-003).
- Key pattern: `login_guard:{user_id}:{YYYY-MM-DD}`, TTL 86400s.
- Date comparison uses UTC (`datetime.utcnow().date()`).
- Streak milestone logic: if `new_streak % 3 == 0`, award streak_3 bonus. If `new_streak % 7 == 0`, award streak_7 bonus. Both can fire on the same day (e.g., day 21).
- Architecture Section 4.2 and Section 8.2 define the exact behavior.

**D-ID References**: FR-005.4, FR-010, ADR-MM-002

**Dependencies**: Story 1.5 (core mutations)

---

## Story 1.7: Progression API Router and Pydantic Schemas

**Size**: M

**Description**: Create the progression API router with endpoints for reading progression state, toggling adventure mode, recording logins, recording page visits, and viewing history. Create all associated Pydantic schemas.

**Acceptance Criteria**:
1. `GET /api/progression` returns full progression state (ProgressionResponse schema): xp_total, level, title, coin_balance, login_streak, last_login_date, adventure_mode_enabled, current_level_xp, xp_to_next_level, feature_unlocks, equipped_items, unlocked_achievements_count, active_quests_count.
2. `POST /api/progression/toggle-adventure-mode` toggles `adventure_mode_enabled` and returns new state.
3. `POST /api/progression/login` calls `record_login()` and returns LoginResponse.
4. `POST /api/progression/visit` accepts `{ page: string }`, validates page against allowlist (FINDING-AUTH-002: `/matches`, `/profile`, `/saved`, `/roadmap`, `/success-patterns`, `/store`, `/quests`), records visit in `user_page_visits` table, and returns VisitResponse.
5. `GET /api/progression/history?type={event|transaction}&limit=50&offset=0` returns paginated history.
6. All endpoints require JWT authentication via `get_current_user_from_token`.
7. If no progression row exists, `GET /api/progression` returns 404 with descriptive message.
8. Pydantic schemas are defined in `backend/app/schemas/progression.py`.
9. Router is registered in `backend/app/routes/__init__.py` and `backend/app/main.py`.
10. Tests cover: all endpoint responses, 404 for missing progression, authentication required, page visit with invalid page rejected, pagination on history.

**Dev Notes**:
- File: `backend/app/routes/progression.py` (new)
- File: `backend/app/schemas/progression.py` (new)
- File: `backend/app/models/page_visit.py` (new -- UserPageVisit model)
- File: `backend/app/routes/__init__.py` (modify -- register router)
- File: `backend/app/main.py` (modify -- include router)
- FINDING-AUTH-002 fix: The `page` field in VisitRequest must be validated against an allowlist. Reject unknown pages with 400.
- The `equipped_items` and `unlocked_achievements_count` fields return defaults (empty dict, 0) until Epics 4 and 6 are implemented.
- Architecture Section 3.1 defines all endpoint schemas. Appendix A has Pydantic models.
- Feature unlocks computed from level using `get_feature_unlocks()` from Architecture Section 5.3.

**D-ID References**: FR-004, FR-021, ADR-MM-002

**Dependencies**: Stories 1.5, 1.6 (progression service)

---

## Story 1.8: Redis Caching Layer for Progression State

**Size**: M

**Description**: Add Redis caching to the progression read path so `GET /api/progression` achieves < 100ms p95. Implement cache invalidation on all mutations and graceful degradation when Redis is unavailable.

**Acceptance Criteria**:
1. `get_progression()` checks Redis cache first (`progression:{user_id}`), falls back to DB if miss or Redis unavailable.
2. Cache is populated on DB read with 5-minute TTL.
3. Cache is invalidated (key deleted) after any XP, coin, level, or streak mutation.
4. If Redis is unavailable (connection error), operations fall back to direct DB queries with a logged warning.
5. `GET /api/progression` response time < 100ms on cache hit (verified via test timing).
6. Tests cover: cache miss -> DB read -> cache populated; cache hit returns cached data; mutation invalidates cache; Redis unavailable falls back gracefully.

**Dev Notes**:
- File: `backend/app/services/progression_service.py` (extend -- add caching to `get_progression`)
- Cache key: `progression:{user_id}`, value: JSON blob, TTL: 300 seconds.
- Use synchronous Redis client from `backend/app/config.py`.
- Architecture Section 8 defines the caching pattern.
- FINDING-PERF-003: Document that cache invalidation failure results in stale reads up to 5 minutes.
- Invalidation points: `award_xp()`, `award_coins()`, `spend_coins()`, `record_login()`, `toggle_adventure_mode()`.

**D-ID References**: NFR-001, ADR-MM-002

**Dependencies**: Story 1.7 (progression API)

---

## Story Dependency Graph (Epic 1)

```
1.1 Alembic Setup
 |
 v
1.2 UserProgression Model
 |          \
 v           v
1.3 Events  1.4 CoinTransaction
 |          /
 v         v
1.5 Progression Service (Core)
 |
 v
1.6 Login & Streak
 |
 v
1.7 API Router & Schemas
 |
 v
1.8 Redis Caching
```
