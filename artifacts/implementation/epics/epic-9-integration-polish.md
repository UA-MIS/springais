# Epic 9: Integration & Polish

> **Phase**: 5
> **Estimated Stories**: 5
> **Dependencies**: Epics 1-8 complete
> **PRD References**: FR-017, FR-027, FR-028, NFR-002.4
> **Architecture References**: Sections 6, 8, 9

---

## Story 9.1: CoinFlipGame Removal (EY Compliance)

**Size**: S

**Description**: Remove the `CoinFlipGame.tsx` gambling mini-game to comply with EY corporate guidelines. The component is removed entirely -- no replacement mini-game is implemented in this story (a knowledge-quiz replacement is out of scope for MVP).

**Acceptance Criteria**:
1. `frontend/src/components/game/CoinFlipGame.tsx` is deleted.
2. All imports and references to `CoinFlipGame` in other files are removed.
3. The barrel export in `frontend/src/components/game/index.ts` no longer includes CoinFlipGame.
4. Any navigation or UI elements that link to the coin flip game are removed.
5. No feature in the application allows users to wager or risk losing Coins on random outcomes.
6. Tests verify: no references to CoinFlipGame remain in the codebase.

**Dev Notes**:
- File: `frontend/src/components/game/CoinFlipGame.tsx` (delete)
- File: `frontend/src/components/game/index.ts` (modify -- remove export)
- Grep codebase for "CoinFlipGame", "coin-flip", "coinFlip" to find all references.
- FR-017.2: No gambling features remain.
- D-MM-8: Remove gambling mini-game.

**D-ID References**: D-MM-8, FR-017, FR-028.1

**Dependencies**: None (can start anytime)

---

## Story 9.2: End-to-End Behavioral Loop Validation

**Size**: L

**Description**: Create integration tests that validate the complete engagement loop: user action -> XP/Coin award -> level-up -> feature unlock -> side quest -> cosmetic purchase. Verify that every link in the chain works correctly.

**Acceptance Criteria**:
1. Integration test: user registers -> progression row created -> record login -> daily coins awarded -> login streak tracked.
2. Integration test: user completes module -> XP awarded -> level-up detected -> coin bonus awarded -> achievement checked.
3. Integration test: user reaches level 3 -> side quests become available -> start quest -> complete requirements -> quest completed -> rewards awarded including cosmetic.
4. Integration test: user earns coins -> browses store -> purchases cosmetic -> coin balance decremented -> item in inventory -> equip item -> appears in progression response.
5. Integration test: idempotency -- duplicate actions do not award duplicate rewards.
6. Integration test: concurrent requests -- two simultaneous purchases/awards resolve correctly without race conditions.
7. All tests use the actual service layer (not mocks) against a test database.

**Dev Notes**:
- File: `backend/tests/integration/test_behavioral_loop.py` (new)
- These tests exercise the full stack: route -> service -> model -> DB.
- Use pytest fixtures for database setup/teardown.
- Test concurrent scenarios using threading or asyncio.

**D-ID References**: G-3 (sustainable engagement loop)

**Dependencies**: Epics 1-7 complete

---

## Story 9.3: Server-Side Validation Hardening

**Size**: M

**Description**: Audit and harden all server-side validation to ensure no API endpoint accepts arbitrary XP/Coin amounts from the client, no endpoint allows direct balance manipulation, and all anti-cheat measures are in place.

**Acceptance Criteria**:
1. No API endpoint accepts `event_type`, `xp_amount`, or `coin_amount` from the request body (FINDING-SEC-001 compliance).
2. `award_xp` and `award_coins` are the ONLY code paths that modify XP and Coin balances (FR-027.2).
3. Coin balance cannot go below 0 (verified by both service-layer check AND database CHECK constraint).
4. The daily login endpoint processes at most 1 reward per user per calendar day (FR-027.4).
5. Rate limiting review: document that `roadmap_generated` event_keys are unique per roadmap, so rapid roadmap generation can farm XP (FINDING-SEC-005). Add a rate limit note or cap if needed.
6. Tests: attempt to call endpoints with forged data, verify rejection; attempt direct SQL bypass, verify CHECK constraints hold; attempt concurrent exploits.

**Dev Notes**:
- File: `backend/tests/security/test_validation_hardening.py` (new)
- This is primarily an audit and test story. May require minor fixes if gaps are found.
- Review all routes that call `reward_hook_service.process_action()` to confirm the event_type and amounts are server-determined.
- FR-027 defines all validation requirements.

**D-ID References**: FR-027, FR-028, FINDING-SEC-001

**Dependencies**: Epics 1-7 complete

---

## Story 9.4: Performance Optimization -- Indexes and Query Efficiency

**Size**: M

**Description**: Review query performance across all gamification endpoints. Add missing indexes, optimize slow queries, and verify NFR-001 response time targets are met.

**Acceptance Criteria**:
1. `GET /api/progression` response time < 100ms (p95) on cache hit, < 200ms on cache miss.
2. `POST /api/progression/login` response time < 200ms (p95).
3. `POST /api/store/purchase` response time < 200ms (p95).
4. Achievement evaluation adds < 50ms to triggering endpoint.
5. Quest progress evaluation adds < 50ms to triggering endpoint.
6. All queries have appropriate EXPLAIN ANALYZE output showing index usage.
7. The batch achievement query (FINDING-PERF-001) is confirmed to use a single GROUP BY instead of N+1 queries.
8. Any missing composite indexes are added if query performance warrants them.

**Dev Notes**:
- File: `backend/tests/performance/test_response_times.py` (new)
- File: Alembic migration (if new indexes needed)
- Use `EXPLAIN ANALYZE` on key queries to verify index usage.
- NFR-001 defines all performance targets.
- FINDING-PERF-001: Verify single GROUP BY query for achievement evaluation.

**D-ID References**: NFR-001, NFR-003, FINDING-PERF-001

**Dependencies**: Epics 1-7 complete

---

## Story 9.5: Data Seed Scripts for All Catalogs

**Size**: S

**Description**: Create or consolidate data seed scripts that can be used to populate all catalog tables (achievements, cosmetics, side quests) in development, testing, and production environments.

**Acceptance Criteria**:
1. A centralized seed data file (`backend/app/data/gamification_seed.py`) contains all seed data constants:
   - 24 achievement definitions
   - 30+ cosmetic items
   - 5 side quest definitions
2. The Alembic migration uses these constants for `op.bulk_insert()`.
3. A standalone seed script (`backend/scripts/seed_gamification.py`) can be run independently to re-seed catalog data (useful for development resets).
4. Seed data is idempotent -- running the script on an already-seeded database does not create duplicates (uses ON CONFLICT DO NOTHING or checks).
5. All seed data matches the PRD specifications exactly (FR-012, FR-014.2, FR-018.2).

**Dev Notes**:
- File: `backend/app/data/gamification_seed.py` (consolidate)
- File: `backend/scripts/seed_gamification.py` (new)
- Centralize all seed data that was created across Epics 4, 6, and 7 into a single authoritative file.
- Ensure cosmetic items for quest rewards are cross-referenced correctly.

**D-ID References**: FR-012, FR-014.2, FR-018.2

**Dependencies**: Epics 4, 6, 7 (seed data created in those epics)

---

## Story Dependency Graph (Epic 9)

```
9.1 CoinFlipGame Removal (independent)

Epics 1-8 complete
 |
 v
9.2 E2E Behavioral Loop Tests
9.3 Validation Hardening
9.4 Performance Optimization
9.5 Seed Script Consolidation
(all can run in parallel)
```
