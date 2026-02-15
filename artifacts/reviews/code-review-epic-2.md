# Code Review: Epic 2 -- Dual-Track Economy (XP + Coins)

**Reviewer:** Adversarial Code Reviewer
**Files:** `backend/app/services/progression_service.py`, `backend/tests/test_progression_service.py`
**Architecture Refs:** Section 4.2, ADR-MM-004, ADR-MM-005
**PRD Refs:** FR-004, FR-005, FR-006, FR-007, FR-008

---

## Findings

### 1. BLOCKING -- `db.rollback()` on IntegrityError destroys entire transaction

**File:** `backend/app/services/progression_service.py:250-253`
**Issue:** When inserting a GamificationEvent, if an IntegrityError occurs (duplicate event_key), the code calls `db.rollback()`. This rolls back the ENTIRE transaction, not just the failed INSERT. Since `award_xp()` is called within a larger transaction (e.g., from `reward_hook_service.process_action()`), this rollback destroys all preceding mutations in that transaction -- including the SELECT FOR UPDATE lock, any prior coin awards, and any other state changes. This is a data integrity issue.
**Suggested Fix:** Use a savepoint via `db.begin_nested()` before the INSERT, and only roll back the savepoint on IntegrityError:
```python
savepoint = db.begin_nested()
try:
    db.add(event)
    db.flush()
except IntegrityError:
    savepoint.rollback()
    return AwardXPResult(already_awarded=True, new_xp_total=prog.xp_total)
```

### 2. BLOCKING -- Same `db.rollback()` issue in level-up event insertion

**File:** `backend/app/services/progression_service.py:286-288`
**Issue:** The level-up event insertion also uses `db.rollback()` on IntegrityError. If a level_up event already exists, this rolls back the entire transaction, losing the XP update that was just flushed at line 263 and any coin bonuses already awarded.
**Suggested Fix:** Same savepoint pattern as Finding #1.

### 3. ADVISORY -- `award_coins()` acquires a second SELECT FOR UPDATE inside `award_xp()`

**File:** `backend/app/services/progression_service.py:271, 313-318`
**Issue:** `award_xp()` already holds a FOR UPDATE lock on the progression row (line 209-213). When it calls `self.award_coins()` at line 271 for level-up bonuses, `award_coins()` acquires a SECOND FOR UPDATE lock on the same row (line 313-318). This is redundant and adds unnecessary query overhead. In PostgreSQL, the second FOR UPDATE on an already-locked row in the same transaction is a no-op, but it wastes a query round-trip.
**Suggested Fix:** Add an internal `_award_coins_locked()` method that skips the FOR UPDATE when the caller already holds the lock.

### 4. ADVISORY -- `compute_xp_for_next_level()` off-by-one potential for level 10

**File:** `backend/app/services/progression_service.py:91-95`
**Issue:** For level < 10, the function returns `XP_THRESHOLDS[level][1]` which is the threshold for level+1. For level=9, this returns `XP_THRESHOLDS[9][1] = 4500`, the threshold for level 10. For level=10, it returns `4500 + (10-9)*1000 = 5500`, the threshold for level 11. This is correct, but the boundary between the two formulas at level=10 is subtle and deserves a comment.
**Suggested Fix:** Add a clarifying comment at the boundary.

### 5. ADVISORY -- Test coverage missing for `spend_coins()` with zero amount

**File:** `backend/tests/test_progression_service.py`
**Issue:** There is no test for calling `spend_coins()` with amount=0 or negative amount. The service returns `SpendCoinsResult(success=False, reason="invalid_amount")` for amount <= 0, but this path is untested.
**Suggested Fix:** Add tests for `spend_coins(db, user_id, 0, "test")` and `spend_coins(db, user_id, -10, "test")`.

---

## Summary

| Severity | Count |
|----------|-------|
| BLOCKING | 2 |
| ADVISORY | 3 |

The XP threshold table and level computation functions are solid and well-tested. The FINDING-SEC-002 fix (SELECT FOR UPDATE before event insert) is correctly implemented. The critical issue is the `db.rollback()` calls that destroy the enclosing transaction on IntegrityError.
