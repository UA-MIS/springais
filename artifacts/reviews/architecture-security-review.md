# Security-Focused Architecture Review: Medieval Mode Economy & Progression System

> **Reviewer**: Reviewer Agent (Security Focus)
> **Date**: 2026-02-11
> **Artifact Reviewed**: `artifacts/design/architecture-medieval-mode.md` (v1.0)
> **Supporting Artifacts**: PRD, Codebase Analysis, ADR-MM-001 through ADR-MM-006
> **Review Type**: Multi-perspective adversarial security review (complexity 13)

---

## Review Summary

The architecture document is well-structured and demonstrates strong security awareness. The server-authority model, idempotency mechanism, SELECT FOR UPDATE locking, and CHECK constraints represent solid defensive design. However, the review identified **4 BLOCKING** and **12 ADVISORY** findings that should be addressed before and during implementation.

---

## 1. Security Vulnerabilities

### FINDING-SEC-001: XP/Coin Amounts Determined by Client-Chosen `event_type` [ADVISORY]

**Severity**: ADVISORY

The `reward_hook_service.process_action()` receives `event_type` as a parameter from the calling route handler. The architecture correctly places this call inside backend route handlers (not exposed as a direct client API), so the client cannot directly choose the event_type. This is well-designed.

However, the architecture should explicitly state: **there must never be a public API endpoint that accepts an arbitrary `event_type` from the client.** The reward config lookup (`REWARD_CONFIG` dict) is server-side, but if a future developer adds a generic `POST /api/progression/award` endpoint that accepts event_type from the request body, the entire anti-cheat system collapses.

**Recommendation**: Add an explicit statement in Section 4.4 or Section 6.2: "No API endpoint shall accept `event_type` or reward amounts from the client. All event emissions originate from server-side route handlers after validating the primary action."

---

### FINDING-SEC-002: Race Condition Gap in `award_xp()` -- Level-Up Coin Bonus [BLOCKING]

**Severity**: BLOCKING

Section 4.2 describes `award_xp()` performing these steps:
1. Check idempotency (event_key).
2. Insert gamification_event.
3. Increment xp_total on user_progression (SELECT FOR UPDATE).
4. Recompute level.
5. If level changed, call `award_coins()` for level-up bonus.

The problem: Step 3 uses SELECT FOR UPDATE, but step 2 (insert gamification_event) happens **before** the row lock is acquired. If two concurrent requests both pass the idempotency check (step 1) before either acquires the lock (step 3), both could insert events and both could award XP.

The partial unique index on `(user_id, event_key)` would catch this at the DB level for events with non-null event_keys (the second insert would fail with a unique constraint violation). However:
- The architecture does not specify how this constraint violation is handled. An unhandled IntegrityError would result in a 500 error.
- For events with `event_key = NULL` (repeatable events like `daily_login`), there is no deduplication.

**Recommendation**:
1. Move the SELECT FOR UPDATE to step 1 (acquire the row lock first, then do all subsequent operations).
2. Explicitly handle `IntegrityError` from the unique constraint on `(user_id, event_key)` as a graceful "already awarded" response, not a 500 error.
3. For repeatable events with null event_key, document that the idempotency is handled at the application level (e.g., the login guard in Redis) and that duplicate awards are possible if Redis is unavailable. Assess whether this is acceptable.

---

### FINDING-SEC-003: Double-Spend on Coin Purchases -- Transaction Boundary [BLOCKING]

**Severity**: BLOCKING

ADR-MM-004 correctly specifies SELECT FOR UPDATE for `spend_coins()`. However, the architecture document describes the purchase flow in Section 4.5 (`store_service.purchase()`) as:

1. Load cosmetic item (validate exists, active, not quest-exclusive).
2. Check user does not already own it.
3. Load user_progression and check level.
4. Call `progression_service.spend_coins()`.
5. Insert user_inventory row.

The problem: Steps 1-3 are read operations that happen **before** the SELECT FOR UPDATE in step 4. A time-of-check-to-time-of-use (TOCTOU) vulnerability exists:
- Two concurrent purchase requests for the same item could both pass step 2 ("user does not own it") before either reaches step 4.
- Both would succeed in spending coins, and both would attempt to insert a user_inventory row.
- The UNIQUE constraint on `(user_id, cosmetic_id)` would catch the second insert, but the coins would already be deducted. The user loses coins without getting the item.

**Recommendation**:
1. The entire purchase flow must be wrapped in a single transaction where the SELECT FOR UPDATE on `user_progression` is acquired at the beginning (before checking ownership).
2. Alternatively, use SELECT FOR UPDATE on the `user_inventory` check as well, or handle the IntegrityError from the duplicate inventory insert by rolling back the entire transaction (including the coin deduction).
3. Explicitly specify: "If any step in the purchase flow fails after coins are deducted, the entire transaction rolls back and coins are restored."

---

### FINDING-SEC-004: Users Could Equip Items They Don't Own [ADVISORY]

**Severity**: ADVISORY

The equip flow (Section 4.5) validates that the user owns the item before equipping. However, the check and the upsert happen in separate operations. If a user sells/loses an item between the ownership check and the equip upsert, they could equip an item they no longer own.

In the current design, items cannot be sold or lost (no sell endpoint, no item expiry), so this is not currently exploitable. However, if a future "sell" or "trade" feature is added, this becomes a vulnerability.

**Recommendation**: Add a note in the equip flow: "The ownership check and equip upsert must be atomic. If item trading or selling is added in the future, a foreign key from `user_equipped_items.cosmetic_id` to `user_inventory.cosmetic_id` (not just `cosmetic_catalog.id`) should be added to enforce this at the database level."

---

### FINDING-SEC-005: Forged Gamification Events via Replay [ADVISORY]

**Severity**: ADVISORY

The idempotency mechanism (event_key) prevents duplicate rewards for the same action. However, the architecture does not address whether a user can trigger the underlying action multiple times to generate multiple legitimate events.

For example:
- Can a user call `POST /api/roadmap/generate` 100 times to generate 100 roadmaps and earn 100 * 50 XP? The event_key is `roadmap:{roadmap_id}`, and each call generates a new roadmap with a new ID, so each event_key is unique.
- Can a user call `POST /api/progression/visit` with the same page repeatedly? The architecture says it uses a unique constraint on `(user_id, page)` with a visit_count, so this is handled correctly for visits.

**Recommendation**: Review each integration point in Section 6.4 and confirm that the primary action cannot be trivially repeated to farm rewards. Specifically:
- `roadmap_generated`: Ensure there is a rate limit or cap on roadmap generation (e.g., max 10 per day, or only the first N roadmaps award XP).
- `first_match_view`: The event_key `first_match:{user_id}` ensures this is one-time. Correct.
- `resume_uploaded`: The event_key `resume:{user_id}` ensures this is one-time. Correct.
- `module_completed`: The event_key `module:{module_id}` ensures per-module uniqueness. Correct, assuming modules can only be completed once.

---

## 2. Data Integrity

### FINDING-INT-001: Coin Ledger Can Desync from Balance [BLOCKING]

**Severity**: BLOCKING

FR-003.3 and NFR-002.4 specify that `balance_after` must match the running total, and that a weekly validation job checks this. However, the architecture has a subtle desync risk:

In `award_coins()` (Section 4.2):
1. SELECT FOR UPDATE on user_progression.
2. Increment coin_balance.
3. Insert coin_transaction with `balance_after = new balance`.

The problem: If `award_coins()` is called from `award_xp()` (for level-up bonuses) and ALSO called from `reward_hook_service.process_action()` (for direct coin rewards), and both happen within the same DB transaction (before commit), the second `award_coins()` call would read the **uncommitted** balance from step 2 of the first call (since they share the same session). This is actually correct behavior in SQLAlchemy with `autoflush=True` (which reads dirty state), but the architecture specifies `autoflush=False` in Section 5 of the codebase analysis (database.py: `autocommit=False, autoflush=False`).

With `autoflush=False`, the second `award_coins()` call within the same transaction might read the **old** balance from the DB (before the first increment was flushed), resulting in an incorrect `balance_after` in the second transaction record.

**Recommendation**:
1. Explicitly call `db.flush()` after each balance mutation within a transaction to ensure subsequent reads within the same transaction see the updated value.
2. Or, change the session configuration to `autoflush=True` for gamification operations.
3. Add this as an explicit implementation note in Section 4.2.

---

### FINDING-INT-002: Foreign Key on `gamification_events` References `user_progression.user_id` [ADVISORY]

**Severity**: ADVISORY

Section 2.3 specifies that `gamification_events.user_id` has a FK to `user_progression.user_id`, not to `user_profiles.id`. The stated rationale is "to keep the gamification domain self-contained."

This creates a dependency ordering issue: a `user_progression` row must exist before any gamification events can be inserted. If `ensure_progression_exists()` fails or is not called before a reward hook fires, the event insert will fail with a FK violation.

The fire-and-forget pattern (Section 6.2) would catch this as an exception and log it, but the user would silently lose their reward with no indication.

**Recommendation**:
1. Either change the FK to reference `user_profiles.id` (simpler, no ordering dependency).
2. Or ensure that `reward_hook_service.process_action()` calls `ensure_progression_exists()` at the top of every invocation before inserting events.
3. Document this dependency explicitly.

---

### FINDING-INT-003: `balance_after` CHECK Constraint Insufficient Alone [ADVISORY]

**Severity**: ADVISORY

The `coin_transactions` table has `CHECK (balance_after >= 0)`. This is good, but `balance_after` is computed by the application. A bug in the application could set `balance_after` to an incorrect positive value while the actual `coin_balance` goes negative.

The defense-in-depth is provided by the `CHECK (coin_balance >= 0)` on `user_progression`, which is correct. The two constraints together provide adequate protection.

No action needed -- this is a confirmation that the design is sound.

---

## 3. Authentication & Authorization

### FINDING-AUTH-001: All Gamification Endpoints Use JWT Authentication [ADVISORY -- CONFIRMED CORRECT]

**Severity**: ADVISORY (Positive confirmation)

Section 3 states: "All endpoints require JWT authentication via the existing `get_current_user_from_token` dependency." The architecture correctly specifies that user_id is derived from the JWT token, never from the request body.

Confirmed that:
- `GET /api/progression` returns only the authenticated user's data.
- `POST /api/store/purchase` uses the authenticated user_id.
- `POST /api/quests/{quest_id}/start` uses the authenticated user_id.
- No endpoint accepts a `user_id` parameter in the request body.

This is correct. No action needed.

---

### FINDING-AUTH-002: `POST /api/progression/visit` Accepts Arbitrary Page String [ADVISORY]

**Severity**: ADVISORY

The visit endpoint accepts `{ "page": string }` from the client. While this is not a direct security vulnerability (it only affects the user's own page visit records), a malicious client could:
1. Send thousands of unique page strings to bloat the `user_page_visits` table.
2. Send very long page strings (up to 100 chars per the schema).

**Recommendation**:
1. Validate the `page` parameter against an allowlist of known pages: `/matches`, `/profile`, `/saved`, `/roadmap`, `/success-patterns`, `/store`, `/quests`.
2. Reject any page string not in the allowlist.
3. This also prevents the "explorer" achievement from being trivially unlocked by sending fake page visits.

---

### FINDING-AUTH-003: No Endpoint Leaks Other Users' Data [ADVISORY -- CONFIRMED CORRECT]

**Severity**: ADVISORY (Positive confirmation)

All API responses return data scoped to the authenticated user. The store catalog is public data (item definitions), which is appropriate. No endpoint exposes another user's XP, Coins, inventory, or achievements.

Confirmed correct. No action needed.

---

## 4. EY Compliance

### FINDING-EY-001: CoinFlipGame Removal Correctly Specified [ADVISORY -- CONFIRMED CORRECT]

**Severity**: ADVISORY (Positive confirmation)

FR-017 specifies removing the CoinFlipGame. The architecture correctly removes it from the modified files list. The replacement (if any) must award fixed amounts, not variable amounts based on chance. This is correctly specified.

No action needed.

---

### FINDING-EY-002: No Hidden Randomization Mechanics [ADVISORY -- CONFIRMED CORRECT]

**Severity**: ADVISORY (Positive confirmation)

The architecture has no loot boxes, no random item drops, no random reward amounts. All XP/Coin values are deterministic and defined in the REWARD_CONFIG table. Store prices are fixed and visible. Side quest rewards are fixed and visible before starting.

No action needed.

---

### FINDING-EY-003: No Pay-to-Win Vectors [ADVISORY -- CONFIRMED CORRECT]

**Severity**: ADVISORY (Positive confirmation)

Cosmetics are display-only (no functional effects). Coins cannot be purchased with real money. XP cannot be bought with Coins. No endpoint allows direct balance manipulation.

The only bridge between tracks is: (a) level-up Coin bonus (XP -> Coins, earned), and (b) side quest completion awards both XP and Coins (earned through learning tasks). Both are engagement-gated, not purchasable.

No action needed.

---

## 5. Performance

### FINDING-PERF-001: N+1 Query Risk in Achievement Evaluation [ADVISORY]

**Severity**: ADVISORY

Section 4.3 describes `evaluate_achievements()` iterating over all ~25 achievements and checking event counts for event-based triggers. If each event-based achievement requires a separate `COUNT(*)` query on `gamification_events`, this could result in 15-20 individual queries per evaluation cycle.

The NFR specifies < 50ms budget. With proper indexing (which the architecture provides: `idx_gamification_events_user_id` and `idx_gamification_events_type`), each COUNT query should be < 2ms. 20 queries at 2ms each = 40ms, which is tight against the 50ms budget.

**Recommendation**:
1. Batch the event count queries into a single aggregation query: `SELECT event_type, COUNT(*) FROM gamification_events WHERE user_id = ? GROUP BY event_type`. This returns all counts in one query.
2. Use this result set to evaluate all event-based achievements in memory.
3. Document this optimization in Section 4.3.

---

### FINDING-PERF-002: `gamification_events` Unbounded Growth [ADVISORY]

**Severity**: ADVISORY

Section 2.13 acknowledges unbounded growth (~50-200 rows per user per month) and NFR-003.1 specifies monthly partitioning once the table exceeds 1M rows.

However, the architecture does not specify:
1. Who monitors the table size and triggers partitioning?
2. How partitioning affects the event count queries used by achievement evaluation?
3. Whether old events can be archived or purged?

**Recommendation**: Add a note in Section 2.13: "Partitioning and archival strategy will be designed as a separate operational task when the table approaches 1M rows. The current index-based approach is sufficient for the expected user base during initial deployment."

---

### FINDING-PERF-003: Redis Cache Invalidation Creates Brief Stale Window [ADVISORY]

**Severity**: ADVISORY

ADR-MM-002 acknowledges a brief window between DB commit and cache deletion where stale data could be served. For gamification data, this is acceptable.

However, the write path described is: "After commit: delete Redis key." If the Redis delete fails (network issue), the cache will serve stale data until the 5-minute TTL expires. This could mean a user sees their old coin balance for up to 5 minutes after a purchase.

**Recommendation**: This is acceptable for MVP but should be documented as a known limitation. The graceful degradation section (8.4) already handles Redis unavailability for reads; it should also note that cache invalidation failures result in temporary stale reads.

---

### FINDING-PERF-004: Index Coverage for Common Query Patterns [ADVISORY -- CONFIRMED ADEQUATE]

**Severity**: ADVISORY (Positive confirmation)

The architecture specifies indexes for:
- `user_progression.user_id` (unique) -- covers all per-user lookups.
- `gamification_events(user_id)`, `(event_type)`, `(created_at)`, `(user_id, event_key)` partial unique -- covers dedup and count queries.
- `coin_transactions(user_id)`, `(created_at)` -- covers ledger queries.
- All catalog tables have category/active indexes.
- All user-specific tables have `(user_id, entity_id)` unique indexes.

The store catalog query (`GET /api/store/catalog?category=X&rarity=Y`) has individual indexes on `category` and `rarity` but no composite index. For 30-50 rows, this is fine. A composite index would only matter at 1000+ rows.

No action needed for current scale.

---

## 6. Architecture Consistency

### FINDING-ARCH-001: Fire-and-Forget Pattern Masks Silent Failures [BLOCKING]

**Severity**: BLOCKING

The fire-and-forget pattern (Section 6.2) catches ALL exceptions from the reward hook and returns `reward_result = None`. While this correctly prevents gamification from blocking primary actions, it creates an observability gap:

1. If a reward hook consistently fails for a specific event type (e.g., due to a bug in achievement evaluation), users silently lose XP/Coins with no indication.
2. There is no retry mechanism. A transient DB error during reward processing means the reward is permanently lost.
3. The architecture does not specify logging, monitoring, or alerting for reward hook failures.

**Recommendation**:
1. Add structured logging with severity "ERROR" for reward hook failures, including user_id, event_type, event_key, and the exception details.
2. Add a "pending rewards" mechanism: if the reward hook fails, insert a record into a `pending_rewards` table. A background job retries pending rewards periodically.
3. At minimum, add a metric/counter for reward hook failures so operational alerts can be configured.
4. If a full retry mechanism is out of scope for MVP, document this as a known gap and ensure the logging is sufficient for manual investigation and remediation.

---

### FINDING-ARCH-002: Service Boundary Between Progression and Store [ADVISORY]

**Severity**: ADVISORY

The `store_service.purchase()` calls `progression_service.spend_coins()`. This creates a bidirectional dependency if `progression_service` ever needs to call `store_service` (e.g., to award quest cosmetics). Currently, quest cosmetics are handled by `quest_service.complete_quest()` calling both `progression_service` and inserting directly into `user_inventory`, bypassing `store_service`.

This means inventory insertion logic exists in two places: `store_service.purchase()` and `quest_service.complete_quest()`. If inventory rules change (e.g., inventory cap, duplicate handling), both must be updated.

**Recommendation**: Consider extracting inventory management into a dedicated method (either on `store_service` or a shared `inventory_service`) that both purchase and quest completion call. This is not blocking but improves maintainability.

---

### FINDING-ARCH-003: Async vs Sync Redis Operations [ADVISORY]

**Severity**: ADVISORY

Section 8 shows Redis operations using `async def` and `await` (e.g., `await redis.get(...)`, `await redis.setex(...)`). However, the existing codebase uses synchronous Redis operations (the `match_cache_service.py` uses synchronous Redis client from `backend/app/config.py`).

The architecture should specify whether the new gamification services use:
- The existing synchronous Redis client (simpler, consistent with existing code).
- A new async Redis client (better performance but requires async route handlers).

FastAPI supports both sync and async route handlers. The existing routes appear to be synchronous (`def` not `async def`). If the new routes are also synchronous, the async Redis calls shown in Section 8 would need to be synchronous.

**Recommendation**: Align the Redis usage pattern with the existing codebase. If existing services use synchronous Redis, the new services should too. If async is desired, document that new gamification routes will use `async def` handlers and note the implications for the DB session management (async sessions vs sync sessions).

---

### FINDING-ARCH-004: `autoflush=False` Interaction with Multi-Step Mutations [ADVISORY]

**Severity**: ADVISORY (Related to FINDING-INT-001)

The codebase analysis notes `SessionLocal` uses `autocommit=False, autoflush=False`. The architecture's multi-step mutation flows (award_xp -> award_coins -> evaluate_achievements -> evaluate_quests) all operate within a single session transaction. With autoflush=False, intermediate state changes (e.g., xp_total increment) are not visible to subsequent queries within the same transaction unless explicitly flushed.

This is critical for:
- `award_xp()` incrementing xp_total, then `evaluate_achievements()` checking if xp_total meets a threshold.
- `spend_coins()` decrementing coin_balance, then the ownership check querying the balance.

**Recommendation**: Document in Section 4.2 and 4.7 that `db.flush()` must be called after each balance mutation within a multi-step flow to ensure subsequent reads see the updated state. This is an implementation requirement, not a design change.

---

## Finding Summary

| ID | Category | Severity | Summary |
|----|----------|----------|---------|
| FINDING-SEC-001 | Security | ADVISORY | Add explicit prohibition against client-facing event_type endpoints |
| FINDING-SEC-002 | Security | **BLOCKING** | Race condition in award_xp: lock before event insert, handle IntegrityError |
| FINDING-SEC-003 | Security | **BLOCKING** | TOCTOU in purchase flow: acquire lock before ownership check, rollback on failure |
| FINDING-SEC-004 | Security | ADVISORY | Equip flow ownership check not atomic (not exploitable today) |
| FINDING-SEC-005 | Security | ADVISORY | Review action repeatability for reward farming (roadmap_generated) |
| FINDING-INT-001 | Data Integrity | **BLOCKING** | autoflush=False causes coin ledger desync in multi-step transactions |
| FINDING-INT-002 | Data Integrity | ADVISORY | FK to user_progression.user_id creates ordering dependency |
| FINDING-INT-003 | Data Integrity | ADVISORY | balance_after CHECK adequate with defense-in-depth (confirmed correct) |
| FINDING-AUTH-001 | Auth | ADVISORY | All endpoints use JWT auth (confirmed correct) |
| FINDING-AUTH-002 | Auth | ADVISORY | Validate page parameter against allowlist |
| FINDING-AUTH-003 | Auth | ADVISORY | No cross-user data leakage (confirmed correct) |
| FINDING-EY-001 | EY Compliance | ADVISORY | CoinFlipGame removal correct (confirmed) |
| FINDING-EY-002 | EY Compliance | ADVISORY | No hidden randomization (confirmed) |
| FINDING-EY-003 | EY Compliance | ADVISORY | No pay-to-win vectors (confirmed) |
| FINDING-PERF-001 | Performance | ADVISORY | Batch achievement event count queries to avoid N+1 |
| FINDING-PERF-002 | Performance | ADVISORY | Document partitioning trigger criteria |
| FINDING-PERF-003 | Performance | ADVISORY | Document cache invalidation failure as known limitation |
| FINDING-PERF-004 | Performance | ADVISORY | Index coverage adequate (confirmed) |
| FINDING-ARCH-001 | Architecture | **BLOCKING** | Fire-and-forget masks failures: add logging, consider retry mechanism |
| FINDING-ARCH-002 | Architecture | ADVISORY | Inventory insertion logic duplicated in store and quest services |
| FINDING-ARCH-003 | Architecture | ADVISORY | Async vs sync Redis: align with existing codebase pattern |
| FINDING-ARCH-004 | Architecture | ADVISORY | Document db.flush() requirement for multi-step mutations |

---

## Blocking Findings Summary

The following 4 findings **must be resolved** before implementation begins:

1. **FINDING-SEC-002**: The `award_xp()` flow must acquire the SELECT FOR UPDATE lock before inserting the gamification event. IntegrityError from the event_key unique constraint must be caught and returned as "already awarded", not a 500 error.

2. **FINDING-SEC-003**: The store purchase flow must be fully atomic. If coins are deducted but inventory insertion fails (e.g., duplicate), the entire transaction must roll back. The SELECT FOR UPDATE should be acquired at the beginning of the flow, not partway through.

3. **FINDING-INT-001**: The architecture must document that `db.flush()` is required after each balance mutation in multi-step transaction flows (due to `autoflush=False`). Without this, coin ledger `balance_after` values will be incorrect, and achievement threshold checks will evaluate stale data.

4. **FINDING-ARCH-001**: The fire-and-forget pattern must include structured error logging with user_id, event_type, and exception details. A mechanism for recovering lost rewards (either a retry queue or manual reconciliation process) must be specified, even if implementation is deferred to Phase 5.

---

## Overall Assessment

**Verdict**: The architecture is fundamentally sound and demonstrates strong security thinking. The server-authority model, dual-layer coin balance protection (SELECT FOR UPDATE + CHECK constraint), idempotency mechanism, and EY compliance guardrails are well-designed. The 4 blocking findings are implementation-level ordering and atomicity issues that are straightforward to resolve with minor architectural amendments. Once these are addressed, the design is ready for implementation.
