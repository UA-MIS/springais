# Medieval Mode Economy & Progression System -- Product Requirements Document

> **Status**: DRAFT -- Awaiting Human Approval
> **Author**: Strategist Agent
> **Date**: 2026-02-11
> **Version**: 1.0
> **Complexity Score**: 13 (Full lifecycle)
> **Upstream Artifacts**:
>   - `artifacts/exploration/codebase-analysis.md`

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Goals & Design Principles](#2-goals--design-principles)
3. [User Personas](#3-user-personas)
4. [Glossary](#4-glossary)
5. [Functional Requirements](#5-functional-requirements)
   - Epic 1: Server-Side Progression Foundation (Priority 0 -- Critical Bug Fix)
   - Epic 2: Dual-Track Economy (XP + Coins)
   - Epic 3: Level & Unlock System
   - Epic 4: Achievement System Overhaul
   - Epic 5: Cosmetic Store
   - Epic 6: Side Quest System
   - Epic 7: Event-Driven Reward Hooks
   - Epic 8: Frontend Migration & UI
   - Epic 9: Anti-Cheat & EY Guardrails
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Migration Strategy](#7-migration-strategy)
8. [Success Metrics](#8-success-metrics)
9. [Phased Delivery Plan](#9-phased-delivery-plan)
10. [Out of Scope](#10-out-of-scope)
11. [Risks & Mitigations](#11-risks--mitigations)
12. [Decision Log](#12-decision-log)
13. [Appendix: Affected Files](#appendix-affected-files)

---

## 1. Problem Statement

SpringAIS ("SkillBridge") has an existing "Adventure Mode" gamification layer with XP, gold, achievements, and a medieval theme. **ALL gamification state is stored exclusively in browser `localStorage`** (key: `springais-adventure-mode` in `frontend/src/context/AdventureModeContext.tsx`). This causes five critical failures:

1. **Data loss**: Clearing browser data permanently destroys all progression.
2. **No account binding**: Progression is per-browser, not per-user. User A's progress leaks to User B on the same browser. User A sees zero progress on a different browser or device.
3. **No server validation**: XP and gold can be freely manipulated via browser devtools. There is zero integrity enforcement.
4. **No cross-device sync**: Users cannot resume their progression on another device or browser.
5. **Gold has no utility**: The only gold sink is a coin-flip gambling mini-game (`CoinFlipGame.tsx`), which violates EY corporate guidelines.

Beyond the critical bug, the current gamification layer is shallow: 14 hardcoded achievements, a single mini-game, no cosmetic system, no quests, and no meaningful spending destinations. The system does not create a sustainable engagement loop.

This PRD specifies a full overhaul: migrate all state server-side, implement a dual-track XP/Coin economy, add a cosmetic store, introduce a side quest system, and wire every notable platform action to the reward system -- all within EY-compliant guardrails.

---

## 2. Goals & Design Principles

### 2.1 Goals

| ID | Goal | Rationale |
|----|------|-----------|
| **G-1** | Eliminate the localStorage bug | All gamification state must be per-account, server-persisted, and tamper-resistant. |
| **G-2** | Implement dual-track economy | XP tracks professional growth (competence). Coins track personal expression (autonomy). Separate motivational drivers prevent pay-to-win and keep learning intrinsic. |
| **G-3** | Create a sustainable engagement loop | Tasks -> XP -> Level -> Side Quest -> Coins -> Cosmetic -> Identity -> Return. Each element feeds the next. |
| **G-4** | Reward every notable platform action | No meaningful action should go unrewarded. First-time actions grant achievement bonuses. |
| **G-5** | EY compliance | No gambling, no loot boxes, transparent pricing, no pay-to-win. Coins earned only via engagement, never purchased. |

### 2.2 Design Principles

| Principle | Description |
|-----------|-------------|
| **Separation of tracks** | XP and Coins are earned from different actions and serve different purposes. XP is never spent. Coins are never used to bypass learning. |
| **Server authority** | The server is the single source of truth for all progression. The client renders server state and sends action events. The client never directly modifies XP, Coins, level, or inventory. |
| **Idempotent rewards** | Each reward-triggering action is recorded with a unique event ID. Replaying the same event does not grant duplicate rewards. |
| **Transparent economy** | All XP tables, Coin sources, and store prices are visible to users. No hidden mechanics. |

---

## 3. User Personas

### 3.1 New Hire (Jordan)
- **Context**: Just joined EY, exploring SkillBridge for the first time. Motivated by visible progress and early rewards.
- **Needs**: Clear onboarding rewards, immediate feedback on actions, a sense of progression from day one.

### 3.2 Consistent Learner (Priya)
- **Context**: Uses SkillBridge regularly, completing modules and assessments. Has built a multi-day login streak.
- **Needs**: Streak rewards, level-gated content that feels earned, cosmetics that reflect dedication.

### 3.3 Completionist (Marcus)
- **Context**: Wants to unlock everything. Pursues side quests and rare cosmetics.
- **Needs**: Clear unlock paths, visible collection progress, exclusive cosmetics for high-level achievements.

---

## 4. Glossary

| Term | Definition |
|------|------------|
| **XP (Experience Points)** | Professional growth currency. Earned from learning tasks (modules, assessments, milestones, certifications). Accumulates forever. Determines level. Cannot be spent. |
| **Coins** | Personal expression currency. Earned from engagement actions (logins, streaks, side quests, endorsements). Spent on cosmetics. Cannot be used to skip learning. |
| **Level** | Derived from total XP via threshold table. Unlocks features (side quests, guild ranks, arena, titles). |
| **Side Quest** | A themed learning challenge unlocked at a specific level. Requires completing a set of learning tasks. Rewards XP, Coins, and an exclusive cosmetic. |
| **Cosmetic** | A visual customization item (armor, cape, jewelry, boots, hairstyle, color palette, banner, emblem). Purchased with Coins. Does not affect gameplay or learning. |
| **Achievement** | A one-time milestone triggered by a specific action or threshold. Grants bonus XP and/or Coins. |
| **Equipped Items** | The subset of owned cosmetics a user has actively applied to their profile/avatar. |
| **Inventory** | All cosmetics owned by a user. |
| **Event** | A server-recorded action (e.g., "module_completed", "daily_login") that triggers reward evaluation. |

---

## 5. Functional Requirements

### Epic 1: Server-Side Progression Foundation (Priority 0 -- Critical Bug Fix)

---

#### FR-001: User Progression Table

**Description**: Create a server-side `user_progression` table that stores per-user gamification state, replacing localStorage.

**Acceptance Criteria**:
- FR-001.1: A `user_progression` table exists with columns: `id` (UUID PK), `user_id` (UUID FK -> `user_profiles.id`, unique), `xp_total` (integer, default 0), `level` (integer, default 1), `coin_balance` (integer, default 0), `login_streak` (integer, default 0), `last_login_date` (date, nullable), `adventure_mode_enabled` (boolean, default false), `created_at`, `updated_at`.
- FR-001.2: A `user_progression` row is automatically created when a user registers (INSERT trigger or service-layer logic in the registration endpoint at `backend/app/routes/auth.py`).
- FR-001.3: The `user_id` column has a UNIQUE constraint and a foreign key to `user_profiles.id` with ON DELETE CASCADE.
- FR-001.4: Level is derived from `xp_total` using the threshold table defined in FR-006. The `level` column is denormalized for query performance but always recomputed when `xp_total` changes.

**References**: G-1, D-MM-1

---

#### FR-002: Gamification Event Log

**Description**: Create an append-only event log table that records every action that triggers a reward.

**Acceptance Criteria**:
- FR-002.1: A `gamification_events` table exists with columns: `id` (UUID PK), `user_id` (UUID FK), `event_type` (string, e.g., "module_completed", "daily_login", "assessment_passed"), `event_key` (string, nullable, for idempotency -- e.g., "module:{module_id}"), `xp_awarded` (integer), `coins_awarded` (integer), `metadata` (JSONB, nullable), `created_at`.
- FR-002.2: The combination `(user_id, event_key)` has a UNIQUE constraint when `event_key` is not null. This prevents duplicate rewards for the same action.
- FR-002.3: Events with a null `event_key` are repeatable (e.g., daily login). Events with a non-null `event_key` are one-time.

**References**: G-1, G-4, D-MM-2

---

#### FR-003: Coin Transaction Ledger

**Description**: Create a transaction ledger for all Coin movements (earned and spent) for auditability and cheat prevention.

**Acceptance Criteria**:
- FR-003.1: A `coin_transactions` table exists with columns: `id` (UUID PK), `user_id` (UUID FK), `amount` (integer, positive for credit, negative for debit), `balance_after` (integer), `transaction_type` (enum: "earned", "spent", "refund"), `source` (string, e.g., "daily_login", "store_purchase", "side_quest"), `reference_id` (UUID, nullable, links to event/purchase), `created_at`.
- FR-003.2: Every Coin balance change creates a transaction record. Direct manipulation of `coin_balance` without a corresponding transaction record is not possible through the service layer.
- FR-003.3: The `balance_after` column is computed server-side and matches the running total. A CHECK constraint ensures `balance_after >= 0`.

**References**: G-1, G-5, D-MM-3

---

#### FR-004: Progression API Endpoints

**Description**: Create REST endpoints for reading and updating user progression.

**Acceptance Criteria**:
- FR-004.1: `GET /api/progression` returns the authenticated user's full progression state: `xp_total`, `level`, `coin_balance`, `login_streak`, `title`, `xp_to_next_level`, `current_level_xp`, `adventure_mode_enabled`, `equipped_items`, `unlocked_achievements`, `active_quests`.
- FR-004.2: `POST /api/progression/toggle-adventure-mode` toggles `adventure_mode_enabled` and returns the new state.
- FR-004.3: `POST /api/progression/login` records a daily login event. Awards daily login Coins per FR-010. Updates login streak. Returns the updated streak and any rewards granted. This endpoint is idempotent per calendar day (calling twice on the same day has no additional effect).
- FR-004.4: All endpoints require JWT authentication via the existing `get_current_user_from_token` dependency in `backend/app/utils/security.py`.
- FR-004.5: `GET /api/progression/history?type={event|transaction}&limit=50&offset=0` returns paginated event or transaction history for the current user.

**References**: G-1, D-MM-4

---

#### FR-005: Progression Service Layer

**Description**: Create a `progression_service.py` that encapsulates all XP/Coin/Level mutation logic.

**Acceptance Criteria**:
- FR-005.1: `award_xp(user_id, amount, event_type, event_key, metadata)` atomically: (a) inserts a gamification event, (b) increments `xp_total`, (c) recomputes `level` from the new `xp_total`, (d) returns the delta (including whether a level-up occurred). If `event_key` already exists for this user, the call is a no-op and returns `{already_awarded: true}`.
- FR-005.2: `award_coins(user_id, amount, source, reference_id)` atomically: (a) increments `coin_balance`, (b) inserts a coin transaction with `balance_after`. Returns the new balance.
- FR-005.3: `spend_coins(user_id, amount, source, reference_id)` atomically: (a) checks `coin_balance >= amount`, (b) decrements `coin_balance`, (c) inserts a coin transaction with negative amount. Returns success/failure. Uses SELECT FOR UPDATE to prevent race conditions.
- FR-005.4: `record_login(user_id)` computes login streak: if `last_login_date` is yesterday, increment streak; if `last_login_date` is today, no-op; otherwise reset streak to 1. Updates `last_login_date`. Awards daily login Coins and any streak bonus Coins. Returns streak info and rewards.
- FR-005.5: All mutations happen within a single database transaction. If any step fails, the entire operation rolls back.

**References**: G-1, G-4, D-MM-1

---

### Epic 2: Dual-Track Economy (XP + Coins)

---

#### FR-006: XP Reward Table

**Description**: Define the canonical XP reward amounts for all learning actions.

**Acceptance Criteria**:
- FR-006.1: The following XP rewards are implemented server-side:

| Action | XP | Event Type | Repeatable |
|--------|-----|------------|------------|
| Complete a learning module | 50 | `module_completed` | No (per module) |
| Complete an assessment | 75 | `assessment_completed` | No (per assessment) |
| Pass a roadmap milestone | 150 | `milestone_passed` | No (per milestone) |
| Earn a certification/badge | 300 | `certification_earned` | No (per cert) |
| Weekly consistency (login 5+ days in a week) | 100 | `weekly_consistency` | No (per ISO week) |

- FR-006.2: Each non-repeatable action uses an `event_key` derived from the entity ID (e.g., `module:{module_id}`, `milestone:{milestone_id}`) to enforce idempotency.
- FR-006.3: XP rewards are defined in a server-side configuration (Python dict or config table) that can be tuned without code changes. Default values match the table above.

**References**: G-2, G-4

---

#### FR-007: Level Thresholds and Titles

**Description**: Define the level-up thresholds derived from XP and associated titles.

**Acceptance Criteria**:
- FR-007.1: Level thresholds use a simplified linear-step curve. The progression service derives level from `xp_total` using these thresholds:

| Level | Total XP Required | Title |
|-------|-------------------|-------|
| 1 | 0 | Apprentice |
| 2 | 100 | Apprentice |
| 3 | 300 | Apprentice |
| 4 | 600 | Squire |
| 5 | 1000 | Squire |
| 6 | 1500 | Knight |
| 7 | 2100 | Knight |
| 8 | 2800 | Warrior |
| 9 | 3600 | Warrior |
| 10 | 4500 | Champion |
| 11+ | 4500 + (level-10)*1000 | See title table |

- FR-007.2: Titles follow this mapping:

| Level Range | Title |
|-------------|-------|
| 1-3 | Apprentice |
| 4-5 | Squire |
| 6-7 | Knight |
| 8-9 | Warrior |
| 10 | Champion |
| 11-14 | Master |
| 15-19 | Grandmaster |
| 20+ | Legend |

- FR-007.3: When a user levels up, the system: (a) emits a `level_up` gamification event, (b) checks for new feature unlocks (FR-008), (c) returns the level-up data to the client for celebration UI.
- FR-007.4: The `GET /api/progression` endpoint includes `xp_to_next_level` (XP remaining until next level) and `current_level_xp` (XP earned within the current level) for progress bar rendering.

**References**: G-2, G-3, D-MM-5

---

#### FR-008: Level-Based Feature Unlocks

**Description**: Specific features unlock when the user reaches certain levels.

**Acceptance Criteria**:
- FR-008.1: The following unlocks are enforced server-side:

| Level | Unlock |
|-------|--------|
| 1 | Apprentice title (default) |
| 3 | Side Quests become available |
| 5 | Guild Rank Upgrade (new title tier) |
| 8 | Advanced Arena (mini-game access) |
| 10 | Special Title ("Champion") |

- FR-008.2: `GET /api/progression` returns a `feature_unlocks` object indicating which features are available based on the user's current level: `{ side_quests: bool, guild_rank: bool, advanced_arena: bool, special_title: bool }`.
- FR-008.3: Side quest endpoints (FR-019) return 403 if the user's level is below 3. The store endpoint (FR-016) returns items but marks level-gated items as locked.

**References**: G-3, D-MM-5

---

#### FR-009: XP-Only Rule

**Description**: XP is earned exclusively from learning-related actions. XP cannot be spent, traded, or converted to Coins.

**Acceptance Criteria**:
- FR-009.1: The progression service has no `spend_xp` or `convert_xp_to_coins` method. XP only accumulates.
- FR-009.2: No API endpoint accepts a request to reduce a user's XP.
- FR-009.3: The XP reward table (FR-006) only contains learning-related actions. Engagement actions (logins, streaks, endorsements) do not award XP except where explicitly specified (side quest completion awards both XP and Coins per FR-019).

**References**: G-2, G-5

---

#### FR-010: Coin Reward Table

**Description**: Define the canonical Coin reward amounts for engagement actions.

**Acceptance Criteria**:
- FR-010.1: The following Coin rewards are implemented server-side:

| Action | Coins | Event Type | Repeatable |
|--------|-------|------------|------------|
| Daily login | 10 | `daily_login` | Yes (once per day) |
| 3-day login streak | 50 | `streak_3` | Yes (each time streak reaches 3 multiple) |
| 7-day login streak | 100 | `streak_7` | Yes (each time streak reaches 7 multiple) |
| First module of the week | 40 | `first_module_week` | Yes (once per ISO week) |
| Peer endorsement received | 25 | `peer_endorsement` | No (per endorser per endorsee) |
| Side quest completion | 100 | `side_quest_completed` | No (per quest) |
| Level-up bonus | level * 10 | `level_up_bonus` | No (per level) |

- FR-010.2: Coin rewards are defined in a server-side configuration that can be tuned without code changes.
- FR-010.3: Streak bonuses are awarded when the streak count is an exact multiple of 3 or 7. A user with a 7-day streak receives: 7 daily logins (70), 2 streak-3 bonuses (100), 1 streak-7 bonus (100) = 270 Coins total over those 7 days.

**References**: G-2, G-3, G-4

---

### Epic 3: Level & Unlock System

(Covered by FR-007 and FR-008 above.)

---

### Epic 4: Achievement System Overhaul

---

#### FR-011: Server-Side Achievement Catalog

**Description**: Move achievement definitions from hardcoded frontend array to a server-side catalog.

**Acceptance Criteria**:
- FR-011.1: An `achievement_catalog` table exists with columns: `id` (string PK, e.g., "first_login"), `name` (string), `description` (string), `icon` (string), `category` (enum: "onboarding", "learning", "engagement", "exploration", "mastery"), `xp_reward` (integer), `coin_reward` (integer), `trigger_type` (enum: "event_based", "threshold_based", "manual"), `trigger_config` (JSONB -- e.g., `{"event_type": "module_completed", "count": 1}` or `{"field": "login_streak", "threshold": 3}`), `is_active` (boolean, default true), `sort_order` (integer).
- FR-011.2: The catalog is seeded with the 14 existing achievements from `AdventureModeContext.tsx` plus at least 10 new achievements covering the expanded economy. See FR-012.
- FR-011.3: `GET /api/achievements/catalog` returns all active achievements with their unlock status for the current user.

**References**: G-4, D-MM-6

---

#### FR-012: Expanded Achievement List

**Description**: Expand the achievement catalog to cover the new economy systems.

**Acceptance Criteria**:
- FR-012.1: The following achievements are seeded into the catalog (in addition to the 14 existing ones, re-mapped to server-side):

**Existing achievements (migrated)**:

| ID | Name | Trigger | XP | Coins |
|----|------|---------|-----|-------|
| first_login | The Journey Begins | Enable adventure mode | 100 | 50 |
| first_match | Seeker of Destiny | View match results | 150 | 75 |
| save_role | Marked for Greatness | Save a role | 100 | 50 |
| create_roadmap | Path Forged | Generate a roadmap | 500 | 200 |
| complete_milestone | Milestone Conquered | Complete a milestone | 300 | 150 |
| level_5 | Squire Promoted | Reach level 5 | 0 | 200 |
| level_10 | Champion Crowned | Reach level 10 | 0 | 500 |
| level_20 | Legend Ascended | Reach level 20 | 0 | 1000 |
| skill_master | Skill Master | Complete 5 skill modules | 400 | 200 |
| daily_login_3 | Dedicated Adventurer | 3-day login streak | 0 | 100 |
| daily_login_7 | Steadfast Hero | 7-day login streak | 0 | 200 |
| mini_game_master | Game Champion | Win a mini-game | 150 | 100 |
| profile_complete | Identity Forged | Complete profile | 200 | 100 |
| explorer | Realm Explorer | Visit all main pages | 150 | 75 |

**New achievements**:

| ID | Name | Trigger | XP | Coins |
|----|------|---------|-----|-------|
| first_purchase | First Acquisition | Buy first cosmetic | 0 | 50 |
| first_side_quest | Quest Seeker | Complete first side quest | 200 | 100 |
| collector_10 | Aspiring Collector | Own 10 cosmetics | 0 | 150 |
| collector_25 | Grand Collector | Own 25 cosmetics | 0 | 300 |
| first_assessment | Tested in Battle | Complete first assessment | 100 | 50 |
| first_certification | Certified Knight | Earn first certification | 300 | 200 |
| daily_login_14 | Fortnight Guardian | 14-day login streak | 0 | 400 |
| daily_login_30 | Monthly Sentinel | 30-day login streak | 0 | 1000 |
| resume_uploaded | Scroll Presented | Upload resume | 100 | 50 |
| roadmap_3 | Path Collector | Generate 3 roadmaps | 200 | 100 |

- FR-012.2: Achievement definitions are stored in the database, not hardcoded. New achievements can be added via database seed scripts without a code deploy.

**References**: G-4, D-MM-6

---

#### FR-013: Server-Side Achievement Unlock Engine

**Description**: Achievements are evaluated and unlocked server-side, triggered by gamification events.

**Acceptance Criteria**:
- FR-013.1: An `achievement_service.py` evaluates relevant achievements after every gamification event. For event-based achievements, it checks if the event matches the `trigger_config`. For threshold-based achievements, it checks if the user's current state meets the threshold.
- FR-013.2: A `user_achievements` table exists with columns: `id` (UUID PK), `user_id` (UUID FK), `achievement_id` (string FK -> `achievement_catalog.id`), `unlocked_at` (datetime). UNIQUE constraint on `(user_id, achievement_id)`.
- FR-013.3: When an achievement is unlocked: (a) a `user_achievements` row is inserted, (b) XP and Coin rewards from the achievement are awarded via the progression service, (c) the response to the triggering API call includes the unlocked achievement data so the client can show a toast.
- FR-013.4: `GET /api/achievements` returns the user's unlocked achievements with timestamps. `GET /api/achievements/catalog` returns all achievements with unlock status.

**References**: G-4, D-MM-6

---

### Epic 5: Cosmetic Store

---

#### FR-014: Cosmetic Item Catalog

**Description**: Define the cosmetic items available for purchase with Coins.

**Acceptance Criteria**:
- FR-014.1: A `cosmetic_catalog` table exists with columns: `id` (UUID PK), `name` (string), `description` (string), `category` (enum: "armor", "cape", "jewelry", "boots", "hairstyle", "color_palette", "banner", "emblem"), `rarity` (enum: "common", "uncommon", "rare", "epic", "legendary"), `coin_price` (integer), `level_required` (integer, default 1), `image_url` (string, nullable), `is_quest_exclusive` (boolean, default false), `is_active` (boolean, default true), `sort_order` (integer), `created_at`.
- FR-014.2: The catalog is seeded with at least 30 items spanning all categories. Example pricing tiers:

| Rarity | Price Range | Examples |
|--------|-------------|---------|
| Common | 100-200 | Bronze Armor (200), Leather Boots (100), Simple Banner (150) |
| Uncommon | 200-400 | Silver Cloak (350), Iron Gauntlets (250), Studded Belt (200) |
| Rare | 400-700 | Guild Ring (150), Rare Banner (600), Enchanted Cape (500) |
| Epic | 700-1200 | Golden Armor (1000), Dragon Emblem (900), Royal Hairstyle (800) |
| Legendary | 1200-2000 | Legendary Sword Banner (1500), Phoenix Cloak (1800) |

- FR-014.3: Quest-exclusive items (`is_quest_exclusive = true`) cannot be purchased from the store. They are awarded only through side quest completion.
- FR-014.4: `GET /api/store/catalog?category={cat}&rarity={rar}` returns paginated store items with optional filters. Each item includes an `is_affordable` flag (user's current Coin balance >= price) and an `is_owned` flag.

**References**: G-3, G-5, D-MM-7

---

#### FR-015: User Inventory & Equipment

**Description**: Track cosmetics owned by the user and which items are currently equipped.

**Acceptance Criteria**:
- FR-015.1: A `user_inventory` table exists with columns: `id` (UUID PK), `user_id` (UUID FK), `cosmetic_id` (UUID FK -> `cosmetic_catalog.id`), `source` (enum: "store_purchase", "quest_reward", "achievement_reward"), `acquired_at` (datetime). UNIQUE constraint on `(user_id, cosmetic_id)`.
- FR-015.2: A `user_equipped_items` table exists with columns: `id` (UUID PK), `user_id` (UUID FK), `slot` (enum: "armor", "cape", "jewelry", "boots", "hairstyle", "color_palette", "banner", "emblem"), `cosmetic_id` (UUID FK -> `cosmetic_catalog.id`). UNIQUE constraint on `(user_id, slot)` so only one item per slot.
- FR-015.3: `GET /api/store/inventory` returns all cosmetics owned by the user.
- FR-015.4: `POST /api/store/equip` accepts `{ cosmetic_id, slot }`. Validates the user owns the item and the item matches the slot category. Returns the updated equipped items.
- FR-015.5: `POST /api/store/unequip` accepts `{ slot }`. Removes the equipped item from that slot.
- FR-015.6: `GET /api/progression` includes `equipped_items` as a dict of `{ slot: cosmetic_data }`.

**References**: G-3, D-MM-7

---

#### FR-016: Store Purchase Flow

**Description**: Users spend Coins to purchase cosmetics from the store.

**Acceptance Criteria**:
- FR-016.1: `POST /api/store/purchase` accepts `{ cosmetic_id }`. The server validates: (a) item exists and `is_active`, (b) item is not quest-exclusive, (c) user does not already own it, (d) user's Coin balance >= `coin_price`, (e) user's level >= `level_required`.
- FR-016.2: On valid purchase: (a) `spend_coins` is called, creating a coin transaction, (b) item is added to `user_inventory`, (c) response includes the purchased item data and new Coin balance.
- FR-016.3: On invalid purchase, the endpoint returns a descriptive error: "insufficient_coins", "already_owned", "level_too_low", "item_unavailable", "quest_exclusive".
- FR-016.4: The entire purchase is atomic. If any step fails, no state changes.

**References**: G-3, G-5, D-MM-7

---

#### FR-017: Remove Coin-Flip Gambling Game

**Description**: Replace the CoinFlipGame with an EY-compliant alternative.

**Acceptance Criteria**:
- FR-017.1: The `CoinFlipGame.tsx` component is removed or replaced with a non-gambling mini-game (e.g., a knowledge quiz or skill challenge that awards XP/Coins based on correct answers, not random chance).
- FR-017.2: No feature in the application allows users to wager or risk losing Coins/XP on random outcomes.
- FR-017.3: If a replacement mini-game is implemented, it awards fixed Coin/XP amounts for participation and completion, not variable amounts based on chance.

**References**: G-5, D-MM-8

---

### Epic 6: Side Quest System

---

#### FR-018: Side Quest Catalog

**Description**: Define side quests as themed learning challenges unlocked by level.

**Acceptance Criteria**:
- FR-018.1: A `side_quest_catalog` table exists with columns: `id` (UUID PK), `name` (string), `description` (string, the narrative text e.g., "A merchant requests assistance analyzing trade data"), `level_required` (integer), `xp_reward` (integer), `coin_reward` (integer), `cosmetic_reward_id` (UUID FK -> `cosmetic_catalog.id`, nullable), `requirements` (JSONB -- array of `{ type: "module_completed"|"assessment_passed"|"certification_earned", target_id: string|null, count: number }`), `is_active` (boolean, default true), `sort_order` (integer), `created_at`.
- FR-018.2: The catalog is seeded with at least 5 side quests:

| Level | Name | Requirements | Rewards |
|-------|------|-------------|---------|
| 3 | Trade Data Analysis | Complete 2 analytics modules + pass data challenge | 200 XP, 150 Coins, Exclusive Merchant Ring |
| 3 | The Scribe's Request | Upload resume + complete profile | 150 XP, 100 Coins, Scribe's Quill Banner |
| 5 | Knight's Trial | Complete 3 modules in a single skill track + pass assessment | 300 XP, 200 Coins, Knight's Crest Emblem |
| 8 | Arena Challenge | Complete 5 assessments with score > 80% | 400 XP, 300 Coins, Arena Champion Cape |
| 10 | Legend's Path | Complete 10 modules + 3 milestones + earn 1 certification | 600 XP, 500 Coins, Legendary Crown |

- FR-018.3: `GET /api/quests/catalog` returns all quests the user has unlocked (level >= `level_required`), with progress status.

**References**: G-3, D-MM-9

---

#### FR-019: Side Quest Progress & Completion

**Description**: Track user progress toward side quest requirements and award rewards on completion.

**Acceptance Criteria**:
- FR-019.1: A `user_quest_progress` table exists with columns: `id` (UUID PK), `user_id` (UUID FK), `quest_id` (UUID FK -> `side_quest_catalog.id`), `status` (enum: "available", "in_progress", "completed"), `progress` (JSONB -- tracks completion of each requirement), `started_at` (datetime, nullable), `completed_at` (datetime, nullable). UNIQUE constraint on `(user_id, quest_id)`.
- FR-019.2: `POST /api/quests/{quest_id}/start` marks a quest as `in_progress`. Validates user level >= required level. A user can have multiple quests in progress simultaneously.
- FR-019.3: The quest service evaluates quest progress after relevant gamification events. When a module is completed or an assessment is passed, the service checks all in-progress quests for the user and updates progress.
- FR-019.4: When all requirements for a quest are met, the quest status changes to "completed" and rewards are atomically awarded: XP via `award_xp`, Coins via `award_coins`, and if `cosmetic_reward_id` is set, the cosmetic is added to `user_inventory` with source "quest_reward".
- FR-019.5: `GET /api/quests/active` returns the user's in-progress quests with current progress. `GET /api/quests/completed` returns completed quests.
- FR-019.6: Completed quests cannot be replayed. Each quest can only be completed once per user.

**References**: G-3, D-MM-9

---

### Epic 7: Event-Driven Reward Hooks

---

#### FR-020: Reward Hook Integration Points

**Description**: Wire existing platform actions to the gamification event system so that every notable action triggers rewards.

**Acceptance Criteria**:
- FR-020.1: The following existing backend endpoints/services are modified to emit gamification events after successful actions:

| Existing Endpoint/Service | Event Type | XP | Coins | Event Key |
|--------------------------|------------|-----|-------|-----------|
| `POST /api/skills/progress/module/{id}/complete` | `module_completed` | 50 | 0 | `module:{id}` |
| `POST /api/roadmap/progress/milestone/{id}` (mark complete) | `milestone_passed` | 150 | 0 | `milestone:{id}` |
| `POST /api/roadmap/generate` | `roadmap_generated` | 50 | 25 | `roadmap:{roadmap_id}` |
| `POST /api/matches` (first view) | `first_match_view` | 50 | 25 | `first_match:{user_id}` |
| `POST /api/skills/upload` (resume) | `resume_uploaded` | 50 | 25 | `resume:{user_id}` |
| `PUT /auth/me` (profile complete) | `profile_completed` | 50 | 25 | `profile:{user_id}` |
| Badge/cert earned flow | `certification_earned` | 300 | 0 | `cert:{badge_id}` |

- FR-020.2: Each integration point calls `progression_service.award_xp()` and/or `progression_service.award_coins()` after the primary action succeeds but within the same request lifecycle.
- FR-020.3: The gamification event emission does NOT block or fail the primary action. If the reward service throws an exception, it is logged but the primary action's response is still returned successfully.
- FR-020.4: First-time actions (identified by unique `event_key`) automatically trigger achievement evaluation (FR-013).
- FR-020.5: A `reward_hook_service.py` centralizes the logic for "given action X, award Y XP and Z Coins and check achievements". Each integration point calls a single method on this service.

**References**: G-4, D-MM-10

---

#### FR-021: Page Visit Tracking (Server-Side)

**Description**: Track page visits server-side for the "explorer" achievement and engagement metrics.

**Acceptance Criteria**:
- FR-021.1: `POST /api/progression/visit` accepts `{ page: string }`. Records the visit in a `user_page_visits` table with columns: `user_id`, `page` (string), `first_visited_at`, `visit_count`. UNIQUE on `(user_id, page)`.
- FR-021.2: The "explorer" achievement is evaluated server-side: when the user has visited all required pages (`/matches`, `/profile`, `/saved`, `/roadmap`, `/success-patterns`), the achievement is unlocked.
- FR-021.3: The frontend sends a visit event on each page mount, replacing the current `trackPageVisit` localStorage call.

**References**: G-4

---

### Epic 8: Frontend Migration & UI

---

#### FR-022: AdventureModeContext Server Sync

**Description**: Replace localStorage persistence in `AdventureModeContext.tsx` with server API calls.

**Acceptance Criteria**:
- FR-022.1: On login (when `AuthContext` sets a valid user), the `AdventureModeProvider` calls `GET /api/progression` to load the full progression state from the server.
- FR-022.2: The `STORAGE_KEY = 'springais-adventure-mode'` localStorage read/write is completely removed. No gamification state is persisted in localStorage.
- FR-022.3: The `loadState()` and `saveState()` functions are replaced with API calls via `@tanstack/react-query` queries and mutations.
- FR-022.4: Optimistic updates: when the user performs an action that awards XP/Coins, the client immediately updates the UI (XP bar, Coin count) and then confirms with the server response. If the server returns a different value, the client syncs to the server state.
- FR-022.5: On logout, the adventure mode state is cleared from the React context (but NOT from the server).
- FR-022.6: The existing computed state (`level`, `currentXP`, `xpToNextLevel`, `title`) is still derived client-side from the server-provided `xp_total` for instant UI responsiveness, but level is validated against the server-provided `level` value.

**References**: G-1, D-MM-1

---

#### FR-023: Cosmetic Store UI

**Description**: Add a store page/panel where users browse and purchase cosmetics.

**Acceptance Criteria**:
- FR-023.1: A new "Store" page or sidebar panel is accessible from the main navigation (medieval theme: "Merchant" or "Armory").
- FR-023.2: The store displays items in a grid, filterable by category and rarity. Each item card shows: name, image/icon, rarity indicator, Coin price, level requirement, and owned/equipped status.
- FR-023.3: Clicking an item shows a detail view with description and a "Purchase" button (disabled if not affordable, already owned, or level-locked, with a tooltip explaining why).
- FR-023.4: Purchase triggers a confirmation dialog showing the Coin cost and new balance. On confirmation, calls `POST /api/store/purchase`.
- FR-023.5: After purchase, the item immediately appears in the user's inventory with an option to equip.
- FR-023.6: An "Inventory" tab shows all owned items with equip/unequip controls.

**References**: G-3, G-5

---

#### FR-024: Side Quest UI

**Description**: Add a quest panel where users view available, active, and completed side quests.

**Acceptance Criteria**:
- FR-024.1: A "Quests" page or panel is accessible from the main navigation (medieval theme: "Quest Board" or "Adventurer's Guild").
- FR-024.2: Available quests (unlocked by level, not yet started) show: name, narrative description, level requirement, requirements list, and rewards (XP, Coins, cosmetic preview).
- FR-024.3: Active quests show a progress bar and checklist of requirements with completion status.
- FR-024.4: Completed quests show completion date and rewards earned.
- FR-024.5: A "Start Quest" button on available quests calls `POST /api/quests/{id}/start`.
- FR-024.6: Quest progress updates in real-time as the user completes qualifying actions (via react-query invalidation after gamification events).

**References**: G-3

---

#### FR-025: Updated AdventureHUD

**Description**: Update the HUD to display the dual-track economy and new features.

**Acceptance Criteria**:
- FR-025.1: The AdventureHUD (`frontend/src/components/game/AdventureHUD.tsx`) displays: level + title, XP progress bar (current level XP / XP to next level), Coin balance, login streak count, quick-access buttons for Store and Quests.
- FR-025.2: Level-up celebrations continue to use the existing toast/animation system (`NotificationToasts.tsx`) but include information about any new feature unlocks.
- FR-025.3: Coin gains show a toast animation similar to the existing XP gain toast.
- FR-025.4: Achievement unlock toasts show the achievement name, description, and rewards.

**References**: G-3

---

#### FR-026: Fantasy Text Expansion

**Description**: Expand the `fantasyText` mapping in `AdventureModeContext.tsx` to cover new features.

**Acceptance Criteria**:
- FR-026.1: The following mappings are added:

| Standard | Fantasy |
|----------|---------|
| Store | Merchant's Armory |
| Quests | Adventurer's Guild |
| Inventory | Treasure Chest |
| Purchase | Acquire |
| Equip | Don |
| Unequip | Remove |
| Coins | Gold |
| Side Quest | Adventure |
| Start Quest | Accept Quest |
| Level Up | Promotion |

- FR-026.2: All new UI elements use `getFantasyText()` for text rendering when adventure mode is active.

**References**: G-3

---

### Epic 9: Anti-Cheat & EY Guardrails

---

#### FR-027: Server-Side Validation

**Description**: All progression mutations are validated server-side.

**Acceptance Criteria**:
- FR-027.1: No API endpoint accepts arbitrary XP or Coin amounts from the client. All awards are computed server-side based on the action type and the reward table.
- FR-027.2: The `award_xp` and `award_coins` methods in the progression service are the ONLY code paths that modify XP and Coin balances. No direct SQL updates bypass the service.
- FR-027.3: Coin balance cannot go below 0. The `spend_coins` method uses `SELECT FOR UPDATE` locking and rejects the transaction if the balance would go negative.
- FR-027.4: Rate limiting: The daily login endpoint accepts at most 1 successful call per user per calendar day. Multiple calls return the cached result without re-awarding.

**References**: G-1, G-5, D-MM-2

---

#### FR-028: EY Compliance Guardrails

**Description**: Enforce EY corporate guidelines within the gamification system.

**Acceptance Criteria**:
- FR-028.1: **No gambling**: No feature allows wagering Coins or XP on random outcomes. The CoinFlipGame is removed or replaced per FR-017.
- FR-028.2: **No loot boxes**: No feature offers randomized item bundles for purchase. All store items are individually priced and visible before purchase.
- FR-028.3: **Transparent pricing**: All store prices are visible in the catalog. No hidden costs or surprise charges.
- FR-028.4: **No pay-to-win**: Coins cannot be purchased with real money. Coins are earned exclusively through platform engagement. Cosmetics do not affect learning outcomes, match scores, or any functional behavior.
- FR-028.5: **Coins earned only via engagement**: There is no endpoint or mechanism to directly add Coins to a user's balance outside of the defined Coin reward table (FR-010) and achievement/quest rewards.

**References**: G-5, D-MM-8

---

## 6. Non-Functional Requirements

### NFR-001: Performance

| Requirement | Target |
|-------------|--------|
| `GET /api/progression` response time | < 100ms (p95) |
| `POST /api/progression/login` response time | < 200ms (p95) |
| `POST /api/store/purchase` response time | < 200ms (p95) |
| Achievement evaluation after event | < 50ms added latency to the triggering endpoint |
| Quest progress evaluation after event | < 50ms added latency to the triggering endpoint |

**Implementation notes**:
- Use Redis to cache the current progression state per user (keyed by `progression:{user_id}`). Cache invalidation on any mutation.
- Achievement catalog and quest catalog are small datasets; load into memory at service startup.
- Coin transaction history and event log are append-only; no performance concern for writes.

---

### NFR-002: Data Integrity

| Requirement | Details |
|-------------|---------|
| NFR-002.1 | All XP/Coin mutations happen within a single database transaction. |
| NFR-002.2 | Coin balance cannot go negative (enforced by CHECK constraint and service-layer validation). |
| NFR-002.3 | Idempotency keys (`event_key`) prevent duplicate rewards. |
| NFR-002.4 | The coin transaction ledger must balance: sum of all transaction amounts for a user must equal their `coin_balance`. A background validation job checks this weekly. |
| NFR-002.5 | Foreign key constraints with ON DELETE CASCADE ensure orphan cleanup. |

---

### NFR-003: Scalability

| Requirement | Details |
|-------------|---------|
| NFR-003.1 | The `gamification_events` table will grow unboundedly. Partition by `created_at` (monthly) once the table exceeds 1M rows. |
| NFR-003.2 | The `coin_transactions` table follows the same partitioning strategy. |
| NFR-003.3 | Redis caching prevents the progression query from becoming a bottleneck as user count grows. |

---

### NFR-004: Security

| Requirement | Details |
|-------------|---------|
| NFR-004.1 | All progression endpoints require JWT authentication. |
| NFR-004.2 | Users can only access their own progression data. No endpoint exposes another user's XP, Coins, or inventory (except leaderboard, if added later -- out of scope). |
| NFR-004.3 | The coin transaction ledger provides an audit trail for all Coin movements. |
| NFR-004.4 | Rate limiting on the login endpoint prevents abuse (1 successful reward per calendar day per user). |

---

### NFR-005: Reliability & Graceful Degradation

| Scenario | Behavior |
|----------|----------|
| Redis unavailable | Fall back to direct database queries. Accept higher latency. Log warning. |
| Gamification service failure | Primary action (module completion, etc.) still succeeds. Reward is logged as pending for retry. |
| Database transaction failure | Entire mutation rolls back. Client receives error. User retries the action. |

---

### NFR-006: Backward Compatibility

| Requirement | Details |
|-------------|---------|
| NFR-006.1 | Existing users who have never used adventure mode get a `user_progression` row with defaults on their next login. |
| NFR-006.2 | The frontend gracefully handles the case where `GET /api/progression` returns a 404 (no row yet) by creating one via the login flow. |
| NFR-006.3 | The theme system (`ThemeContext.tsx`) continues to use localStorage for theme preference. Theme is NOT part of this migration. |

---

## 7. Migration Strategy

### 7.1 Database Schema Creation

Since the project uses `Base.metadata.create_all()` (no Alembic), new tables will be auto-created on backend restart. However:

- **D-MM-11**: Adopt Alembic for this project going forward. The number of new tables (9+) and the need for seed data make auto-create insufficient for production reliability.
- Create an Alembic migration that: (a) creates all new tables, (b) seeds the achievement catalog, (c) seeds the cosmetic catalog, (d) seeds the side quest catalog.

### 7.2 Existing User Migration

- **No automatic migration of localStorage data**. LocalStorage data is per-browser, not per-user, and may represent shared/leaked state. It is not trustworthy.
- Existing users start fresh with the new server-side system. This is acceptable because: (a) the current system was broken (data loss, cross-user leakage), (b) users have no way to have earned anything meaningful due to the gold-only-for-gambling economy, (c) a clean start with the new dual-track system is a better experience.
- On first login after migration, a `user_progression` row is created with defaults.

### 7.3 Frontend Cutover

- Deploy backend changes first (new tables, endpoints, services).
- Deploy frontend changes second (replace localStorage with API calls).
- The frontend change is a single atomic switch: replace `loadState()`/`saveState()` with API calls.
- Remove the `STORAGE_KEY` constant and all `localStorage.getItem/setItem` calls from `AdventureModeContext.tsx`.

### 7.4 Rollback Plan

- If issues are discovered post-deploy, the frontend can be reverted to the localStorage version independently of the backend.
- Backend tables and data are additive; no existing tables are modified or dropped.

---

## 8. Success Metrics

### 8.1 Primary Metrics

| Metric | Baseline | Target (30 days) | Target (90 days) |
|--------|----------|-------------------|-------------------|
| Adventure mode adoption (% of active users with adventure mode enabled) | Unknown (localStorage, no tracking) | 40% | 60% |
| DAU with login streak >= 3 | Unknown | 25% of adventure mode users | 40% |
| Side quests started | N/A (new feature) | 20% of eligible users (level >= 3) | 40% |
| Cosmetic purchases per active user per week | N/A | 1.5 | 2.5 |
| Average session duration (adventure mode users vs non) | Unknown | +15% | +25% |

### 8.2 Secondary Metrics

| Metric | Target |
|--------|--------|
| Data loss incidents (progression lost) | 0 (vs unknown count with localStorage) |
| Cross-device consistency complaints | 0 |
| Coin balance integrity violations | 0 |
| Mean time to first cosmetic purchase | < 5 days from first login |
| Achievement unlock rate (% of users who earn 5+ achievements in 30 days) | > 30% |

---

## 9. Phased Delivery Plan

### Phase 1: Server-Side Foundation (Critical Bug Fix)

**Goal**: Eliminate the localStorage bug. All progression server-persisted and per-account.

| Stories | Requirements |
|---------|-------------|
| Database tables + models | FR-001, FR-002, FR-003 |
| Progression service | FR-005 |
| Progression API endpoints | FR-004 |
| Frontend migration (remove localStorage) | FR-022 |
| Server-side login tracking | FR-005.4, FR-020 (login only) |
| Alembic setup + initial migration | NFR-006, Migration 7.1 |

**Dependencies**: None. This is the foundation everything else builds on.
**Estimated Scope**: 6-8 stories.

---

### Phase 2: Dual-Track Economy + Achievement Overhaul

**Goal**: Implement XP and Coin systems with the full reward table and server-side achievements.

| Stories | Requirements |
|---------|-------------|
| XP reward table + integration hooks | FR-006, FR-020 |
| Coin reward table + integration hooks | FR-010, FR-020 |
| Level threshold system | FR-007, FR-008 |
| Achievement catalog + engine | FR-011, FR-012, FR-013 |
| Page visit tracking | FR-021 |
| Updated AdventureHUD | FR-025 |
| Remove CoinFlipGame | FR-017 |
| Reward hook service | FR-020.5 |

**Dependencies**: Phase 1 complete.
**Estimated Scope**: 10-14 stories.

---

### Phase 3: Cosmetic Store

**Goal**: Give Coins meaningful spending destinations.

| Stories | Requirements |
|---------|-------------|
| Cosmetic catalog + seed data | FR-014 |
| User inventory + equip system | FR-015 |
| Store purchase flow | FR-016 |
| Store UI | FR-023 |
| Fantasy text expansion | FR-026 |

**Dependencies**: Phase 2 complete (Coin system functional).
**Estimated Scope**: 5-7 stories.

---

### Phase 4: Side Quest System

**Goal**: Complete the engagement loop with level-gated themed challenges.

| Stories | Requirements |
|---------|-------------|
| Quest catalog + seed data | FR-018 |
| Quest progress + completion engine | FR-019 |
| Quest UI | FR-024 |
| Quest-exclusive cosmetics | FR-014.3, FR-018.2 |

**Dependencies**: Phase 2 complete (XP/Level system), Phase 3 complete (cosmetic rewards).
**Estimated Scope**: 4-6 stories.

---

### Phase 5: Polish & Guardrails

**Goal**: Finalize anti-cheat, compliance, and edge cases.

| Stories | Requirements |
|---------|-------------|
| Server-side validation hardening | FR-027 |
| EY guardrail audit | FR-028 |
| Coin ledger integrity validation job | NFR-002.4 |
| Redis caching layer | NFR-001 |
| Performance testing + optimization | NFR-001, NFR-003 |

**Dependencies**: Phases 1-4 complete.
**Estimated Scope**: 3-5 stories.

---

**Total estimated scope**: 28-40 stories across 5 phases.

---

## 10. Out of Scope

| Item | Reason |
|------|--------|
| **Leaderboards** | Social comparison features need separate UX research and privacy review. Future project. |
| **Peer endorsement system** | FR-010 references peer endorsements as a Coin source, but the endorsement UX itself (how users endorse each other) is a separate feature. For now, this Coin source is reserved but not activated until an endorsement feature exists. |
| **Real-money purchases** | Coins are earned only through engagement. No monetization. Per EY guidelines. |
| **Avatar/character builder** | Equipped cosmetics affect profile display but a full 3D/2D avatar builder is out of scope. Cosmetics are displayed as badges/icons/color changes. |
| **Guild/team system** | Group-based gamification (guilds, team quests, team leaderboards) is a future project. |
| **Admin dashboard for gamification** | An admin UI for managing catalogs, viewing metrics, and adjusting reward tables is desirable but out of scope. Catalog management is via database seed scripts. |
| **Notification push/email** | Achievement and level-up notifications are in-app only. No email or push notifications. |
| **Badge system integration** | The existing badge PRD (`artifacts/planning/badge-system-prd.md`) is a separate project. The "certification_earned" event in FR-020 will integrate with that system when both are implemented. |

---

## 11. Risks & Mitigations

| ID | Risk | Severity | Probability | Mitigation |
|----|------|----------|-------------|------------|
| **R-1** | Large scope (28-40 stories) leads to delayed delivery | High | Medium | Phased delivery. Phase 1 delivers the critical bug fix independently. Each phase delivers standalone value. |
| **R-2** | No Alembic means schema changes are risky on existing data | High | High | D-MM-11: Adopt Alembic before deploying. Create proper migration scripts. Test on a copy of production data. |
| **R-3** | Redis dependency adds infrastructure complexity | Medium | Low | NFR-005: Graceful degradation to direct DB queries if Redis is down. Redis is already used for match caching. |
| **R-4** | Reward table tuning is wrong (too generous or too stingy) | Medium | Medium | FR-006.3 and FR-010.2: Reward values are configurable without code changes. Monitor metrics (Section 8) and adjust within first 30 days. |
| **R-5** | Frontend migration breaks existing adventure mode UX | Medium | Low | Phase 1 preserves the existing UX exactly. Only the data layer changes (localStorage -> API). All UI components are reused. |
| **R-6** | Achievement evaluation adds latency to primary actions | Medium | Medium | NFR-001: Achievement evaluation is <50ms. FR-020.3: Gamification failures do not block primary actions. |
| **R-7** | Cosmetic assets (images) not available | Low | High | Cosmetic items use text descriptions and color-coded rarity indicators initially. Image URLs are nullable. Visual assets can be added incrementally. |
| **R-8** | Users upset about losing localStorage progression | Low | Medium | Current progression is unreliable (cross-user leakage, data loss). Communicate that the new system is a fresh start with a much richer experience. Consider a one-time "Welcome Back" Coin bonus for existing users. |

---

## 12. Decision Log

| D-ID | Decision | Rationale | Status |
|------|----------|-----------|--------|
| **D-MM-1** | Separate `user_progression` table rather than adding columns to `user_profiles` | `user_profiles` already has 20+ columns. Separation of concerns. Gamification state has different access patterns (frequent reads/writes) vs profile data. | Proposed |
| **D-MM-2** | Append-only event log for all reward triggers | Enables audit trail, cheat detection, and replay/reconciliation. Prevents duplicate rewards via idempotency keys. | Proposed |
| **D-MM-3** | Coin transaction ledger (double-entry style) | Prevents unaudited Coin manipulation. Balance can be verified against transaction history. Required for EY compliance. | Proposed |
| **D-MM-4** | Single progression API endpoint returns full state | Reduces frontend API calls. One query on login populates the entire AdventureModeContext. Redis caching makes this fast. | Proposed |
| **D-MM-5** | Linear-step XP curve instead of exponential | The current exponential curve (`100 * 1.5^(level-1)`) makes level 20 require 443K total XP, which is unreachable. A linear-step curve keeps levels achievable while still requiring increasing effort. | Proposed |
| **D-MM-6** | Achievement catalog in database, not hardcoded | Enables adding achievements without frontend deploy. Supports server-side evaluation. Matches the server-authority principle. | Proposed |
| **D-MM-7** | Cosmetics are display-only, no functional effects | EY guardrail: no pay-to-win. Cosmetics affect profile appearance only. No learning advantages. | Proposed |
| **D-MM-8** | Remove gambling mini-game (CoinFlipGame) | EY corporate policy prohibits gambling mechanics. The coin-flip game is explicitly a wager on random chance. Replace with skill-based alternative. | Proposed |
| **D-MM-9** | Side quests unlocked by level, not purchased | Keeps the XP -> Level -> Unlock loop intact. Quests are earned, not bought. Maintains separation between XP (learning) and Coins (expression). | Proposed |
| **D-MM-10** | Reward hooks are fire-and-forget, never blocking | A gamification failure must never prevent a user from completing a module or generating a roadmap. Rewards are supplementary. | Proposed |
| **D-MM-11** | Adopt Alembic for schema migrations | The project has 9+ new tables and seed data. `Base.metadata.create_all()` is insufficient for production. Alembic provides versioned, reversible migrations. | Proposed |
| **D-MM-12** | No migration of existing localStorage data | LocalStorage data is untrusted (not per-user, manipulable, lossy). Clean start is safer and simpler. | Proposed |
| **D-MM-13** | XP earned from learning actions only; Coins from engagement only (with cross-track exceptions for side quests and level-ups) | Maintains clean separation of motivational tracks while allowing the behavioral loop to function (side quests bridge both tracks). | Proposed |

---

## Appendix: Affected Files

### Backend -- New Files

| File | Purpose | Requirements |
|------|---------|-------------|
| `backend/app/models/progression.py` | UserProgression, GamificationEvent, CoinTransaction models | FR-001, FR-002, FR-003 |
| `backend/app/models/achievement.py` | AchievementCatalog, UserAchievement models | FR-011, FR-013 |
| `backend/app/models/cosmetic.py` | CosmeticCatalog, UserInventory, UserEquippedItem models | FR-014, FR-015 |
| `backend/app/models/quest.py` | SideQuestCatalog, UserQuestProgress models | FR-018, FR-019 |
| `backend/app/models/page_visit.py` | UserPageVisit model | FR-021 |
| `backend/app/schemas/progression.py` | Pydantic schemas for progression API | FR-004 |
| `backend/app/schemas/achievement.py` | Pydantic schemas for achievement API | FR-013 |
| `backend/app/schemas/cosmetic.py` | Pydantic schemas for store API | FR-014, FR-016 |
| `backend/app/schemas/quest.py` | Pydantic schemas for quest API | FR-018, FR-019 |
| `backend/app/services/progression_service.py` | XP/Coin/Level management | FR-005 |
| `backend/app/services/achievement_service.py` | Achievement evaluation and unlock | FR-013 |
| `backend/app/services/store_service.py` | Cosmetic store transactions | FR-016 |
| `backend/app/services/quest_service.py` | Side quest progress and completion | FR-019 |
| `backend/app/services/reward_hook_service.py` | Centralized reward distribution | FR-020 |
| `backend/app/routes/progression.py` | Progression API endpoints | FR-004 |
| `backend/app/routes/store.py` | Store API endpoints | FR-014, FR-015, FR-016 |
| `backend/app/routes/quests.py` | Quest API endpoints | FR-018, FR-019 |
| `backend/app/routes/achievements.py` | Achievement API endpoints | FR-013 |
| `alembic/` | Migration framework | D-MM-11 |
| `alembic/versions/001_gamification_tables.py` | Initial migration + seed data | FR-001 through FR-018 |

### Backend -- Modified Files

| File | Changes | Requirements |
|------|---------|-------------|
| `backend/app/routes/auth.py` | Create `user_progression` row on register; call `record_login` on login | FR-001.2, FR-005.4 |
| `backend/app/routes/skills.py` | Emit `module_completed` event on skill module completion | FR-020.1 |
| `backend/app/routes/roadmap.py` | Emit `milestone_passed` and `roadmap_generated` events | FR-020.1 |
| `backend/app/routes/matches.py` | Emit `first_match_view` event | FR-020.1 |
| `backend/app/routes/__init__.py` | Register new routers (progression, store, quests, achievements) | FR-004 |
| `backend/app/main.py` | Include new routers | FR-004 |
| `backend/app/models/__init__.py` | Export new models | FR-001 |
| `backend/requirements.txt` | Add alembic dependency | D-MM-11 |

### Frontend -- Modified Files

| File | Changes | Requirements |
|------|---------|-------------|
| `frontend/src/context/AdventureModeContext.tsx` | Remove localStorage, add API sync, expand fantasy text | FR-022, FR-026 |
| `frontend/src/components/game/AdventureHUD.tsx` | Update to show dual-track, add Store/Quest buttons | FR-025 |
| `frontend/src/components/game/AchievementsPanel.tsx` | Fetch achievements from server API | FR-013 |
| `frontend/src/components/game/CoinFlipGame.tsx` | Remove or replace | FR-017 |
| `frontend/src/components/game/NotificationToasts.tsx` | Add Coin gain toasts, quest completion toasts | FR-025 |
| `frontend/src/components/game/ThemeSwitcher.tsx` | Adventure mode toggle calls server API | FR-004.2 |
| `frontend/src/components/layout/Sidebar.tsx` | Add Store and Quest navigation items | FR-023, FR-024 |
| `frontend/src/App.tsx` | Add routes for Store and Quest pages | FR-023, FR-024 |
| `frontend/src/services/api.ts` | Add progression, store, quest, achievement API methods | FR-004 |

### Frontend -- New Files

| File | Purpose | Requirements |
|------|---------|-------------|
| `frontend/src/services/progressionService.ts` | API client for progression endpoints | FR-004 |
| `frontend/src/services/storeService.ts` | API client for store endpoints | FR-014, FR-016 |
| `frontend/src/services/questService.ts` | API client for quest endpoints | FR-018, FR-019 |
| `frontend/src/pages/StorePage.tsx` | Cosmetic store page | FR-023 |
| `frontend/src/pages/QuestsPage.tsx` | Side quests page | FR-024 |
| `frontend/src/components/store/StoreItemCard.tsx` | Individual store item display | FR-023 |
| `frontend/src/components/store/InventoryPanel.tsx` | User inventory with equip controls | FR-023.6 |
| `frontend/src/components/store/PurchaseDialog.tsx` | Purchase confirmation dialog | FR-023.4 |
| `frontend/src/components/quests/QuestCard.tsx` | Individual quest display with progress | FR-024 |
| `frontend/src/components/quests/QuestProgressBar.tsx` | Quest requirement progress visualization | FR-024.3 |

### Database -- New Tables Summary

| Table | Purpose | Key |
|-------|---------|-----|
| `user_progression` | Per-user XP, Coins, level, streak | FK -> user_profiles |
| `gamification_events` | Append-only reward event log | Idempotency via event_key |
| `coin_transactions` | Coin credit/debit ledger | FK -> user_progression |
| `achievement_catalog` | Achievement definitions | Seed data |
| `user_achievements` | Per-user achievement unlocks | FK -> achievement_catalog |
| `cosmetic_catalog` | Store item definitions | Seed data |
| `user_inventory` | Per-user owned cosmetics | FK -> cosmetic_catalog |
| `user_equipped_items` | Per-user equipped cosmetics | FK -> cosmetic_catalog |
| `side_quest_catalog` | Quest definitions | Seed data |
| `user_quest_progress` | Per-user quest progress | FK -> side_quest_catalog |
| `user_page_visits` | Page visit tracking | FK -> user_profiles |
