# Code Review: Epic 6 -- Side Quest System

**Reviewer:** Adversarial Code Reviewer
**Files:** `backend/app/models/quest.py`, `backend/app/services/quest_service.py`, `backend/app/routes/quests.py`, `backend/app/schemas/quest.py`, `backend/tests/test_quest_service.py`, `backend/app/data/quest_seed.py`
**Architecture Refs:** Section 4.6, D-MM-9
**PRD Refs:** FR-019

---

## Findings

### 1. BLOCKING -- Quest completion does NOT deliver cosmetic rewards to user inventory

**File:** `backend/app/services/quest_service.py:292-334`
**Issue:** The `complete_quest()` method awards XP and Coins correctly, but when a quest has a `cosmetic_reward_id`, the method only sets `result.cosmetic_reward_id = quest.cosmetic_reward_id` at line 333. It does NOT insert a row into `UserInventory` to actually grant the cosmetic item to the user. This means quest-exclusive cosmetics are never delivered.
**Suggested Fix:** After awarding XP and coins, check if `quest.cosmetic_reward_id` is not None. If so, insert a `UserInventory` row:
```python
if quest.cosmetic_reward_id is not None:
    from app.models.cosmetic import UserInventory
    inv = UserInventory(
        user_id=user_id,
        cosmetic_id=quest.cosmetic_reward_id,
        source="quest_reward",
    )
    db.add(inv)
    db.flush()
```

### 2. BLOCKING -- Missing ForeignKey constraint on `SideQuestCatalog.cosmetic_reward_id`

**File:** `backend/app/models/quest.py`
**Issue:** The `cosmetic_reward_id` column is declared as `Column(UUID(as_uuid=True), nullable=True)` without a `ForeignKey("cosmetic_catalog.id")` constraint. This means the database does not enforce referential integrity -- a quest could reference a non-existent cosmetic ID without any error.
**Suggested Fix:** Add the ForeignKey constraint:
```python
cosmetic_reward_id = Column(UUID(as_uuid=True), ForeignKey("cosmetic_catalog.id"), nullable=True)
```

### 3. ADVISORY -- N+1 queries in `get_active_quests()` and `get_completed_quests()`

**File:** `backend/app/services/quest_service.py:90-130`
**Issue:** Both methods iterate over progress rows and issue individual `db.query(SideQuestCatalog).filter(id=...)` calls per row (lines 103-105 and 124-126). This is an N+1 query pattern. For a user with 5 active quests, this produces 6 queries instead of 2.
**Suggested Fix:** Batch-load all quest IDs from progress rows, then query all quests in a single `WHERE id IN (...)` query, similar to how `get_available_quests()` does it.

### 4. ADVISORY -- `evaluate_quest_progress()` re-queries quest catalog per in-progress quest

**File:** `backend/app/services/quest_service.py:224-228`
**Issue:** For each in-progress quest, the method queries `SideQuestCatalog` individually. Combined with the event count query per requirement (line 242-249), this creates O(Q * R) queries where Q = number of quests and R = number of requirements.
**Suggested Fix:** Batch-load all quest IDs from in-progress rows into a single query, and batch the event count queries using GROUP BY similar to the achievement service.

### 5. ADVISORY -- `_quest_to_dict()` returns `"cosmetic_reward": None` always

**File:** `backend/app/services/quest_service.py:373`
**Issue:** The comment says "Will be populated when cosmetic catalog exists" but the cosmetic catalog already exists (Epic 5). This should resolve the cosmetic_reward_id to a name/description for the frontend to display.
**Suggested Fix:** Query `CosmeticCatalog` for the quest's `cosmetic_reward_id` and return `{"id": ..., "name": ..., "rarity": ...}` instead of `None`.

### 6. ADVISORY -- No test for cosmetic reward delivery on quest completion

**File:** `backend/tests/test_quest_service.py`
**Issue:** The completion tests verify XP and coin rewards but do not test that cosmetic rewards are delivered. This is related to Finding #1 -- the feature is not implemented, so there's no test. When the feature is fixed, tests should be added.
**Suggested Fix:** Add a test that creates a quest with `cosmetic_reward_id`, completes it, and verifies a `UserInventory` row was created.

---

## Summary

| Severity | Count |
|----------|-------|
| BLOCKING | 2 |
| ADVISORY | 4 |

The quest lifecycle (catalog, start, progress, completion) is well-structured and thoroughly tested. The critical issues are the missing cosmetic reward delivery and the missing ForeignKey constraint on the quest model.
