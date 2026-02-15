# Epic 7: Side Quest System

> **Phase**: 4
> **Estimated Stories**: 5
> **Dependencies**: Epic 1 (Server Foundation), Epic 2 (Leveling for level gates), Epic 6 (Cosmetic Store for quest rewards)
> **PRD References**: FR-018, FR-019
> **Architecture References**: Sections 2.10-2.11, 3.4, 4.6

---

## Story 7.1: Side Quest Catalog Table, Model, and Seed Data

**Size**: M

**Description**: Create the `side_quest_catalog` table with at least 5 themed side quests. Each quest has level requirements, learning-task requirements, and rewards (XP, Coins, exclusive cosmetic).

**Acceptance Criteria**:
1. A SQLAlchemy model `SideQuestCatalog` exists in `backend/app/models/quest.py` with columns: `id` (UUID PK), `name`, `description` (narrative text), `level_required`, `xp_reward`, `coin_reward`, `cosmetic_reward_id` (UUID FK -> `cosmetic_catalog.id`, nullable), `requirements` (JSONB), `is_active`, `sort_order`, `created_at`.
2. Indexes on `level_required` and `is_active`.
3. The Alembic migration seeds 5 quests matching FR-018.2:
   - Level 3: "Trade Data Analysis" (2 modules + assessment, 200 XP, 150 Coins, Merchant Ring)
   - Level 3: "The Scribe's Request" (resume + profile, 150 XP, 100 Coins, Scribe's Quill Banner)
   - Level 5: "Knight's Trial" (3 modules + assessment, 300 XP, 200 Coins, Knight's Crest Emblem)
   - Level 8: "Arena Challenge" (5 assessments, 400 XP, 300 Coins, Arena Champion Cape)
   - Level 10: "Legend's Path" (10 modules + 3 milestones + 1 cert, 600 XP, 500 Coins, Legendary Crown)
4. Each quest's `cosmetic_reward_id` references a `cosmetic_catalog` item with `is_quest_exclusive = true`.
5. Requirements JSONB follows the schema: `[{ "type": "module_completed", "target_id": null, "count": 2, "description": "Complete 2 analytics modules" }]`.
6. Tests verify: all 5 quests seeded, requirements JSON is well-formed, cosmetic references are valid.

**Dev Notes**:
- File: `backend/app/models/quest.py` (new)
- File: `backend/app/data/gamification_seed.py` (extend -- quest seed data)
- File: Alembic migration (extend)
- Architecture Section 2.10 has the exact model code.
- The quest-exclusive cosmetics should already exist in the cosmetic catalog (created in Epic 6 Story 6.1).

**D-ID References**: D-MM-9, FR-018

**Dependencies**: Epic 6 Story 6.1 (cosmetic catalog for reward references)

---

## Story 7.2: User Quest Progress Model and Migration

**Size**: S

**Description**: Create the `user_quest_progress` table that tracks user progress toward side quest requirements.

**Acceptance Criteria**:
1. A SQLAlchemy model `UserQuestProgress` exists in `backend/app/models/quest.py` with columns: `id` (UUID PK), `user_id` (UUID FK -> `user_profiles.id`), `quest_id` (UUID FK -> `side_quest_catalog.id`), `status` (enum: available/in_progress/completed), `progress` (JSONB), `started_at` (nullable), `completed_at` (nullable).
2. UNIQUE constraint on `(user_id, quest_id)`.
3. CHECK constraint validates `status` values.
4. Alembic migration creates the table.
5. `progress` JSONB follows the schema: `{ "requirements": [{ "index": 0, "completed": true, "current_count": 2, "required_count": 2 }] }`.
6. Tests verify: creating progress, unique constraint, status transitions.

**Dev Notes**:
- File: `backend/app/models/quest.py` (extend)
- File: Alembic migration (extend)
- Architecture Section 2.11 has the exact model code.

**D-ID References**: FR-019

**Dependencies**: Story 7.1

---

## Story 7.3: Quest Service -- Start, Progress, Complete

**Size**: L

**Description**: Implement `quest_service.py` with quest lifecycle management: listing available quests, starting quests, evaluating progress after gamification events, and completing quests with reward distribution.

**Acceptance Criteria**:
1. `get_available_quests(db, user_id, user_level)` returns quests where `level_required <= user_level`, with progress status for each.
2. `start_quest(db, user_id, quest_id, user_level)`:
   - Validates quest exists and is active.
   - Validates user level >= level_required. Returns 403-style error if not.
   - Validates quest not already started or completed.
   - Creates `user_quest_progress` row with `status="in_progress"`, initialized progress JSON, `started_at=now()`.
3. `evaluate_quest_progress(db, user_id, event_type, event_key)`:
   - Queries all `in_progress` quests for the user.
   - For each quest, checks if any requirement matches the event_type.
   - Counts matching events for the user (from `gamification_events`).
   - Updates progress JSON.
   - If all requirements met, calls `complete_quest()`.
   - Returns list of quest updates/completions.
4. `complete_quest(db, user_id, quest_progress)`:
   - Awards XP via `progression_service.award_xp()`.
   - Awards Coins via `progression_service.award_coins()`.
   - If `cosmetic_reward_id` exists, inserts into `user_inventory` with `source="quest_reward"`.
   - Sets quest status to "completed", `completed_at=now()`.
5. Completed quests cannot be replayed (UNIQUE constraint + status check).
6. Tests cover:
   - Starting a quest at correct level.
   - Starting quest below level returns error.
   - Quest progress updates after matching event.
   - Quest completion awards all rewards (XP, Coins, cosmetic).
   - Completed quest cannot be restarted.
   - Multiple quests can be in progress simultaneously.

**Dev Notes**:
- File: `backend/app/services/quest_service.py` (new)
- Service singleton: `quest_service = QuestService()`.
- Architecture Section 4.6 has the full service interface.
- Quest progress evaluation is called by `reward_hook_service.process_action()` after other reward processing.
- The event count query for quest progress should be efficient -- query counts for the specific event types needed by in-progress quests.

**D-ID References**: FR-019, D-MM-9

**Dependencies**: Stories 7.1, 7.2, Epic 1 Story 1.5, Epic 6 Story 6.2

---

## Story 7.4: Quest API Router and Pydantic Schemas

**Size**: M

**Description**: Create the quest API router with endpoints for catalog, active quests, completed quests, and starting quests.

**Acceptance Criteria**:
1. `GET /api/quests/catalog` returns all quests the user has unlocked (level >= required), with progress status and requirement details.
2. `GET /api/quests/active` returns in-progress quests with current progress.
3. `GET /api/quests/completed` returns completed quests.
4. `POST /api/quests/{quest_id}/start` starts a quest. Returns 403 if level too low, 400 if already started/completed.
5. All endpoints require JWT authentication.
6. Pydantic schemas in `backend/app/schemas/quest.py`.
7. Router registered in routes init and main.py.
8. Tests cover: catalog filtering by level, starting quests, error cases, progress display.

**Dev Notes**:
- File: `backend/app/routes/quests.py` (new)
- File: `backend/app/schemas/quest.py` (new)
- File: `backend/app/routes/__init__.py` (modify)
- File: `backend/app/main.py` (modify)
- Architecture Section 3.4 has all endpoint schemas.
- Appendix A has the Pydantic models.

**D-ID References**: FR-018.3, FR-019.2, FR-019.5

**Dependencies**: Story 7.3

---

## Story 7.5: Frontend Quest Board UI

**Size**: L

**Description**: Create the QuestsPage component with a quest board showing available, active, and completed quests with progress tracking.

**Acceptance Criteria**:
1. A new `/quests` route renders `QuestsPage.tsx` inside the protected layout.
2. Available quests show: name, narrative description, level requirement, requirements checklist, rewards (XP, Coins, cosmetic preview), "Start Quest" button.
3. Active quests show: progress bar, checklist of requirements with completion status (checkmarks), started date.
4. Completed quests show: completion date, rewards earned, "Completed" badge.
5. The "Start Quest" button calls `POST /api/quests/{id}/start`. Disabled if level too low.
6. Quest progress updates in real-time via React Query invalidation after gamification events.
7. The Sidebar navigation includes a "Quest Board" / "Adventurer's Guild" link (conditionally shown when adventure mode enabled AND level >= 3).
8. Medieval theme styling applied when adventure mode is active.
9. Tests cover: quest listing, starting a quest, progress display, completion display.

**Dev Notes**:
- File: `frontend/src/pages/QuestsPage.tsx` (new)
- File: `frontend/src/components/quests/QuestCard.tsx` (new)
- File: `frontend/src/components/quests/QuestProgressBar.tsx` (new)
- File: `frontend/src/services/questService.ts` (new)
- File: `frontend/src/components/layout/Sidebar.tsx` (modify -- add Quest link, level-gated)
- File: `frontend/src/App.tsx` (modify -- add /quests route)
- React Query keys: `['quests', 'catalog']`, `['quests', 'active']`, `['quests', 'completed']`.
- Use `getFantasyText('Quests')` -> "Adventurer's Guild" for adventure mode.
- The quest link should only appear in the sidebar when the user's level >= 3 (side_quests feature unlock).

**D-ID References**: FR-024

**Dependencies**: Story 7.4

---

## Story Dependency Graph (Epic 7)

```
Epic 1 + Epic 2 + Epic 6 Story 6.1
 |
 v
7.1 Quest Catalog + Seed
 |
 v
7.2 Quest Progress Model
 |
 v
7.3 Quest Service
 |
 v
7.4 Quest API Router
 |
 v
7.5 Frontend Quest Board
```
