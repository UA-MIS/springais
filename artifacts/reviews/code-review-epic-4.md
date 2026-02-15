# Code Review: Epic 4 -- Achievement System

**Reviewer:** Adversarial Code Reviewer
**Files:** `backend/app/models/achievement.py`, `backend/app/services/achievement_service.py`, `backend/app/routes/achievements.py`, `backend/tests/test_achievement_service.py`, `backend/app/data/achievement_seed.py`
**Architecture Refs:** Section 4.3, FINDING-PERF-001
**PRD Refs:** FR-013

---

## Findings

### 1. BLOCKING -- `db.rollback()` on IntegrityError destroys enclosing transaction

**File:** `backend/app/services/achievement_service.py:156-158`
**Issue:** When unlocking an achievement, if a race condition causes an IntegrityError (duplicate user_achievement row), the code calls `db.rollback()`. This rolls back the ENTIRE transaction, not just the failed INSERT. Since `evaluate_achievements()` is called from `reward_hook_service.process_action()`, which itself runs within a larger transaction that may have already awarded XP and coins, this rollback destroys all those preceding mutations.
**Suggested Fix:** Use a savepoint:
```python
savepoint = db.begin_nested()
try:
    db.add(user_achievement)
    db.flush()
except IntegrityError:
    savepoint.rollback()
    continue
```

### 2. ADVISORY -- In-memory catalog cache has no TTL or invalidation strategy

**File:** `backend/app/services/achievement_service.py:69-81`
**Issue:** The catalog cache (`_catalog_cache`) is loaded once and never invalidated until the server restarts (or `invalidate_cache()` is explicitly called, which is only used in tests). If an admin adds new achievements to the database while the server is running, they will not be visible until restart.
**Suggested Fix:** Add a TTL (e.g., 5 minutes) to the cache, or use the existing `invalidate_cache()` as an admin endpoint.

### 3. ADVISORY -- `_check_trigger` uses `getattr(progression, field_name, 0)` with untrusted config

**File:** `backend/app/services/achievement_service.py:210-213`
**Issue:** For `threshold_based` achievements, the trigger config specifies a `field` name that is used in `getattr(progression, field_name, 0)`. If seed data contains a typo in the field name (e.g., `"login_steak"` instead of `"login_streak"`), the achievement will silently never trigger because `getattr` returns the default 0.
**Suggested Fix:** Validate that `field_name` is in a whitelist of known UserProgression fields (e.g., `{"login_streak", "level", "xp_total", "coin_balance"}`).

### 4. ADVISORY -- Achievement XP/Coin rewards bypass REWARD_CONFIG

**File:** `backend/app/services/achievement_service.py:162-178`
**Issue:** Achievement rewards call `self.progression.award_xp()` and `self.progression.award_coins()` directly, bypassing `reward_hook_service.process_action()`. This means achievement rewards do not themselves trigger further achievements (which is probably intended to prevent infinite loops), but they also don't trigger quest progress updates. If a quest requires "earn X achievements," the quest won't update.
**Suggested Fix:** Document that achievement rewards intentionally bypass the reward hook to prevent recursion.

### 5. ADVISORY -- Test seeds use hardcoded IDs prefixed with "t_" that could collide with real seeds

**File:** `backend/tests/test_achievement_service.py:94-155`
**Issue:** The test helper `_seed_achievements()` uses `db.merge()` with IDs like `"t_first_module"`. The real seed data uses IDs like `"first_module"`. While there's no collision, using `merge` means if the real seeds are also loaded (which happens in the session fixture), both sets coexist. Tests assert `len(items) >= 5` to account for this, which is correct.
**Suggested Fix:** No change needed, but consider using a transaction rollback per test to isolate from real seeds.

---

## Summary

| Severity | Count |
|----------|-------|
| BLOCKING | 1 |
| ADVISORY | 4 |

The FINDING-PERF-001 fix (batch GROUP BY query) is correctly implemented and verified by tests. The achievement evaluation engine is well-structured. The critical issue is the `db.rollback()` on IntegrityError that destroys the enclosing transaction.
