# Epic 3: Coin Economy System

> **Phase**: 2
> **Estimated Stories**: 4
> **Dependencies**: Epic 1 (Server Foundation) complete
> **PRD References**: FR-010, FR-005.4
> **Architecture References**: Sections 4.2, 4.4, 6.3, 8.2
> **Security Review Fixes**: FINDING-SEC-005

---

## Story 3.1: Coin Reward Configuration Table

**Size**: S

**Description**: Define the canonical Coin reward amounts for all engagement actions in the server-side configuration. This is the authoritative Coin reward table that the reward hook service uses alongside the XP reward table.

**Acceptance Criteria**:
1. The `REWARD_CONFIG` dictionary in `backend/app/services/reward_hook_service.py` includes all Coin reward entries:
   - `daily_login`: 0 XP, 10 Coins
   - `streak_3`: 0 XP, 50 Coins
   - `streak_7`: 0 XP, 100 Coins
   - `first_module_week`: 0 XP, 40 Coins
   - `peer_endorsement`: 0 XP, 25 Coins
   - `side_quest_completed`: 0 XP, 100 Coins
   - `level_up_bonus`: 0 XP, `level * 10` Coins (dynamic)
2. Mixed XP+Coin events are also present: `roadmap_generated` (50 XP, 25 Coins), `first_match_view` (50 XP, 25 Coins), `resume_uploaded` (50 XP, 25 Coins), `profile_completed` (50 XP, 25 Coins).
3. The `RewardConfig` dataclass supports both fixed and dynamic reward amounts.
4. Tests verify that every event type in the architecture's event registry (Section 6.3) has a corresponding entry in `REWARD_CONFIG`.

**Dev Notes**:
- File: `backend/app/services/reward_hook_service.py` (extend REWARD_CONFIG)
- The `level_up_bonus` is dynamic -- the reward amount depends on the level being reached. The config entry stores `coins=0` as a placeholder; the actual amount is computed in `award_xp()` during level-up handling.
- Architecture Section 4.4 has the exact `REWARD_CONFIG` dictionary.

**D-ID References**: FR-010, D-MM-13

**Dependencies**: Epic 1 complete

---

## Story 3.2: Streak Tracking with Milestone Bonuses

**Size**: M

**Description**: Implement the full streak bonus logic including daily login coins, 3-day streak bonuses, 7-day streak bonuses, and weekly consistency tracking. Ensure streak milestones are awarded correctly at exact multiples.

**Acceptance Criteria**:
1. Daily login awards 10 Coins (always, on every new day).
2. When `login_streak` reaches a multiple of 3 (3, 6, 9, 12...), a `streak_3` bonus of 50 Coins is awarded.
3. When `login_streak` reaches a multiple of 7 (7, 14, 21...), a `streak_7` bonus of 100 Coins is awarded.
4. Both bonuses can fire on the same day (e.g., day 21: daily + streak_3 + streak_7 = 10 + 50 + 100 = 160 Coins).
5. A 7-day period accumulates correctly: 7 daily logins (70) + 2 streak_3 bonuses at day 3 and 6 (100) + 1 streak_7 bonus at day 7 (100) = 270 Coins total.
6. Each streak bonus creates its own `gamification_event` (type `streak_3` or `streak_7`) and `coin_transaction`.
7. FINDING-SEC-005: Rate limiting on repeatable actions -- the login endpoint processes at most 1 reward per user per calendar day (enforced by `last_login_date` check and Redis guard).
8. Tests cover:
   - Full 7-day cycle with correct coin accumulation.
   - Day 21 (triple milestone: daily + streak_3 + streak_7).
   - Streak reset does not retroactively revoke earned bonuses.
   - Duplicate same-day calls are no-ops.

**Dev Notes**:
- File: `backend/app/services/progression_service.py` (verify/extend `record_login`)
- This may already be partially implemented in Epic 1 Story 1.6. This story ensures the full streak milestone logic is correct and comprehensively tested.
- Architecture Section 4.2 (`record_login`) and Section 8.2 (Redis login guard) define the behavior.
- FR-010.3 specifies the exact 7-day Coin accumulation formula.

**D-ID References**: FR-010.3, FR-027.4

**Dependencies**: Epic 1 Story 1.6

---

## Story 3.3: Redis-Backed Login Guard

**Size**: S

**Description**: Implement the Redis-based login guard that provides a fast-path check to prevent duplicate daily login processing, reducing DB load for repeated login calls throughout the day.

**Acceptance Criteria**:
1. Before processing a login, the service checks Redis key `login_guard:{user_id}:{YYYY-MM-DD}`.
2. If the key exists, the login is a no-op (returns cached result without DB queries).
3. After successful login processing, the key is set with 24h TTL.
4. If Redis is unavailable, the guard is skipped and the DB-based `last_login_date` check serves as fallback.
5. Tests cover: guard prevents duplicate processing, guard absent allows processing, Redis failure falls back to DB check.

**Dev Notes**:
- File: `backend/app/services/progression_service.py` (ensure Redis guard in `record_login`)
- This may already be implemented in Epic 1 Story 1.6. This story ensures the Redis guard is independently tested.
- Architecture Section 8.2 has the exact key pattern and TTL.
- Use synchronous Redis client from `backend/app/config.py`.

**D-ID References**: NFR-001, NFR-005, ADR-MM-002

**Dependencies**: Epic 1 Story 1.6

---

## Story 3.4: Frontend Coin Display Integration

**Size**: S

**Description**: Update the AdventureHUD to display the server-provided Coin balance and show Coin gain toasts when Coins are awarded.

**Acceptance Criteria**:
1. The Coin balance in `AdventureHUD.tsx` displays the server-provided `coin_balance` from the progression API.
2. When an API response includes Coin rewards (e.g., from login, achievement, quest), a Coin gain toast is shown via `NotificationToasts.tsx`.
3. The toast shows the amount gained and the new balance.
4. The label uses `getFantasyText('Coins')` which maps to "Gold" in adventure mode.
5. Tests cover: HUD renders correct Coin balance, Coin gain toast appears with correct amount.

**Dev Notes**:
- File: `frontend/src/components/game/AdventureHUD.tsx` (modify -- use server coin_balance)
- File: `frontend/src/components/game/NotificationToasts.tsx` (modify -- add Coin gain toast type)
- The existing toast system has `XP_GAIN` and `GOLD_GAIN` types. Ensure `GOLD_GAIN` fires from server responses.
- Architecture Section 7.3 describes the invalidation pattern.

**D-ID References**: FR-025.1, FR-025.3

**Dependencies**: Epic 1 Story 1.7 (API endpoint), Story 3.1 (Coin config)

---

## Story Dependency Graph (Epic 3)

```
Epic 1 complete
 |
 v
3.1 Coin Reward Config
 |
 v
3.2 Streak Milestones ----> 3.3 Redis Login Guard
 |
 v
3.4 Frontend Coin Display
```
