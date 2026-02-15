# Epic 2: XP System & Leveling Engine

> **Phase**: 2
> **Estimated Stories**: 5
> **Dependencies**: Epic 1 (Server Foundation) complete
> **PRD References**: FR-006, FR-007, FR-008, FR-009
> **Architecture References**: Sections 5.1-5.3, 4.4, 6.3

---

## Story 2.1: XP Reward Configuration and Threshold Seed Data

**Size**: S

**Description**: Define the canonical XP reward amounts for all learning actions and the level threshold table as server-side configuration. Seed the XP thresholds into the progression service. This is the authoritative reward table that the reward hook service will use.

**Acceptance Criteria**:
1. A `REWARD_CONFIG` dictionary exists in `backend/app/services/reward_hook_service.py` (or a dedicated config module) defining XP/coin amounts for all 16 event types per Architecture Section 4.4.
2. The `XP_THRESHOLDS` table is defined in `backend/app/services/progression_service.py` matching Architecture Section 5.1 (levels 1-10 explicit, 11+ formula-based).
3. The title mapping is implemented: Apprentice (1-3), Squire (4-5), Knight (6-7), Warrior (8-9), Champion (10), Master (11-14), Grandmaster (15-19), Legend (20+).
4. `compute_level_from_xp(xp_total)` correctly returns `(level, title)` for all ranges including edge cases (0 XP, exactly on threshold, between thresholds, levels 11+).
5. `compute_level_progress(xp_total, level)` returns `(current_level_xp, xp_to_next_level)` correctly.
6. Tests cover: each level boundary, multi-level jumps, title changes at correct levels, levels above 20, edge case xp_total=0.

**Dev Notes**:
- File: `backend/app/services/progression_service.py` (extend or confirm already implemented in Story 1.5)
- File: `backend/app/services/reward_hook_service.py` (new -- REWARD_CONFIG dict)
- File: `backend/app/data/gamification_seed.py` (new -- centralized seed data constants)
- The XP threshold and title logic may already be partially in Story 1.5. This story ensures the full table is correct and tested independently.
- Architecture Section 5.1 has the exact code for `compute_level_from_xp`, `compute_xp_for_next_level`, and `compute_level_progress`.
- XP-only rule (FR-009): No `spend_xp` or `convert_xp_to_coins` method exists. Verify this explicitly.

**D-ID References**: D-MM-5, FR-006, FR-007, FR-009, ADR-MM-005

**Dependencies**: Epic 1 complete

---

## Story 2.2: Level-Up Detection with Multi-Level Jumps

**Size**: M

**Description**: Ensure the `award_xp()` method correctly handles scenarios where a single XP award causes the user to jump multiple levels. Each intermediate level-up must award its own coin bonus, emit its own level_up event, and check for feature unlocks.

**Acceptance Criteria**:
1. When `award_xp()` causes a multi-level jump (e.g., from level 2 to level 5), the system:
   - Awards coin bonus for EACH level gained: level 3 * 10 + level 4 * 10 + level 5 * 10 = 120 coins total.
   - Inserts a `level_up` gamification event for each level gained with metadata `{"level": N}`.
   - Each coin bonus creates its own `coin_transaction` with correct `balance_after`.
2. `AwardXPResult` returns: `old_level`, `new_level`, `level_up=True`, `coins_from_level_up` (total across all levels).
3. Feature unlocks are evaluated at the final level (not intermediate levels) for the API response.
4. Tests cover:
   - Single level-up (level 1 -> 2).
   - Multi-level jump (level 1 -> 5, verifying 3 level-up events and coin bonuses).
   - No level-up (XP increases but stays within current level).
   - Level 10 -> 11+ transition (formula-based thresholds).
   - Large XP dump jumping to level 20+ (Legend).

**Dev Notes**:
- File: `backend/app/services/progression_service.py` (ensure `award_xp` handles multi-level)
- The loop: `for level in range(old_level + 1, new_level + 1): award_coins(db, user_id, level * 10, "level_up_bonus")`.
- Each `award_coins` call must have `db.flush()` after it (FINDING-INT-001) to keep `balance_after` correct.
- Architecture Section 5.2 defines the exact level-up detection flow.

**D-ID References**: FR-007.3, FR-010 (level_up_bonus)

**Dependencies**: Story 2.1

---

## Story 2.3: Level-Based Feature Unlock Evaluation

**Size**: S

**Description**: Implement the feature unlock system that determines which features are available based on the user's current level. Integrate this into the `GET /api/progression` response.

**Acceptance Criteria**:
1. `get_feature_unlocks(level)` returns a dictionary: `{ side_quests: bool, guild_rank: bool, advanced_arena: bool, special_title: bool }`.
2. Unlock thresholds: side_quests at level 3, guild_rank at level 5, advanced_arena at level 8, special_title at level 10.
3. The `GET /api/progression` response includes the `feature_unlocks` field populated from this function.
4. Tests cover: each threshold level, below threshold returns false, above threshold returns true, all unlocked at level 10+.

**Dev Notes**:
- File: `backend/app/services/progression_service.py` (add `get_feature_unlocks`)
- File: `backend/app/routes/progression.py` (ensure response includes feature_unlocks)
- Architecture Section 5.3 has the exact code for `FEATURE_UNLOCKS` and `get_feature_unlocks()`.
- The quest and store endpoints (Epics 6, 7) will use these unlocks to enforce level gates.

**D-ID References**: FR-008

**Dependencies**: Story 2.1

---

## Story 2.4: XP Display Integration in Frontend

**Size**: M

**Description**: Update the frontend `AdventureModeContext` and `AdventureHUD` to display server-provided XP, level, title, and progress bar data instead of client-computed values from localStorage.

**Acceptance Criteria**:
1. `AdventureModeContext.tsx` derives `level`, `title`, `currentXP`, `xpToNextLevel` from the server-provided `xp_total`, `level`, `title`, `current_level_xp`, `xp_to_next_level` fields.
2. The XP progress bar in `AdventureHUD.tsx` renders using `current_level_xp / (current_level_xp + xp_to_next_level)` ratio from server data.
3. The level and title display in the HUD uses server-provided values.
4. Client-side level calculation is used only as a fallback for optimistic updates; the server value is authoritative and overrides on refetch.
5. The old exponential XP curve calculation (`100 * 1.5^(level-1)`) is removed from the frontend.
6. Tests cover: HUD renders correct level/title/XP bar from mock API data, optimistic update shows immediate feedback, server correction syncs correctly.

**Dev Notes**:
- File: `frontend/src/context/AdventureModeContext.tsx` (modify)
- File: `frontend/src/components/game/AdventureHUD.tsx` (modify)
- This story modifies the context to read from the `['progression']` React Query data.
- The `xpForLevel()` function (exponential curve) should be removed or replaced with the linear-step equivalent for optimistic client-side display.
- Architecture Section 7.1 describes the migration pattern.

**D-ID References**: FR-007.4, FR-022.6

**Dependencies**: Story 2.1, Epic 1 Story 1.7 (API endpoints exist)

---

## Story 2.5: Level-Up Celebration and Feature Unlock Notification

**Size**: S

**Description**: When a user levels up (detected from API response), show a celebration modal/toast that includes the new level, new title, coin bonus earned, and any newly unlocked features.

**Acceptance Criteria**:
1. When an API response includes `level_up: true` in the gamification rewards, a level-up celebration toast or modal is displayed.
2. The celebration shows: new level number, new title, coins earned from level-up bonus.
3. If new features are unlocked (comparing old vs new feature_unlocks), the celebration includes a message like "Side Quests unlocked!" or "You can now access the Arena!".
4. The existing `NotificationToasts.tsx` system is used for the level-up notification (extending the existing `LEVEL_UP` toast type).
5. Tests cover: level-up toast renders with correct data, feature unlock message appears when applicable, no toast when no level-up.

**Dev Notes**:
- File: `frontend/src/components/game/NotificationToasts.tsx` (modify -- enhance level-up toast)
- File: `frontend/src/context/AdventureModeContext.tsx` (modify -- detect level-up from API response)
- The existing toast system already has a `LEVEL_UP` type. Enhance it with feature unlock info.
- Architecture Section 7.3 describes the invalidation pattern that triggers refetch after gamification events.

**D-ID References**: FR-007.3, FR-025.2

**Dependencies**: Story 2.4

---

## Story Dependency Graph (Epic 2)

```
Epic 1 complete
 |
 v
2.1 XP Config & Thresholds
 |         \
 v          v
2.2 Multi-Level Jumps   2.3 Feature Unlocks
 |                        |
 v                        v
2.4 Frontend XP Display <-+
 |
 v
2.5 Level-Up Celebration
```
