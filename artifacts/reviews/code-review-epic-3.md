# Code Review: Epic 3 -- Level & Unlock System (Login Streak + Coin Economy)

**Reviewer:** Adversarial Code Reviewer
**Files:** `backend/app/services/progression_service.py` (record_login), `backend/app/routes/progression.py` (login endpoint), `backend/tests/test_progression_service.py` (streak tests)
**Architecture Refs:** Section 4.2, ADR-MM-003
**PRD Refs:** FR-009, FR-010

---

## Findings

### 1. ADVISORY -- Streak bonus ordering gives both bonuses at day 21 (by design but surprising)

**File:** `backend/app/services/progression_service.py:455-481`
**Issue:** The streak logic checks `% 7` before `% 3`. On day 21 (divisible by both 3 and 7), both bonuses are awarded: 10 (daily) + 100 (streak_7) + 50 (streak_3) = 160 coins. The test at line 459 of `test_progression_service.py` confirms this is intentional (FR-010.3). However, the ordering means streak_7 is always checked first. If the intent was that streak_7 subsumes streak_3, this would be a bug. The PRD does not explicitly state whether they stack.
**Suggested Fix:** Add a comment in the code clarifying that streak_3 and streak_7 bonuses intentionally stack per FR-010.3.

### 2. ADVISORY -- Login endpoint returns hardcoded empty `achievements_unlocked` array

**File:** `backend/app/routes/progression.py:83`
**Issue:** The `POST /api/progression/login` endpoint always returns `achievements_unlocked=[]`. The login flow should evaluate achievements after awarding daily coins (e.g., "Consistent Adventurer" achievement for login_streak >= 3). Currently, achievements are only evaluated when `reward_hook_service.process_action()` is called, but the login endpoint does not call it.
**Suggested Fix:** Call `reward_hook_service.process_action(db, user_id, "daily_login")` from the login endpoint (or after `record_login()`), and populate `achievements_unlocked` from the result.

### 3. ADVISORY -- 7-day cycle test relies on manual streak manipulation

**File:** `backend/tests/test_progression_service.py:487-521`
**Issue:** The full 7-day cycle test manually sets `prog.last_login_date` before each iteration rather than advancing a mock clock. This works but is fragile -- if the service changes to use `datetime.now()` differently or if tests run near midnight UTC, behavior could change. The test also flushes directly after mutating the progression row.
**Suggested Fix:** Use `unittest.mock.patch` to mock `datetime.now()` to control the "current date" for each iteration.

### 4. ADVISORY -- record_login does not insert events through reward_hook_service

**File:** `backend/app/services/progression_service.py:444-481`
**Issue:** `record_login()` creates `daily_login`, `streak_3`, and `streak_7` GamificationEvent rows directly, bypassing `reward_hook_service.process_action()`. This means these events do not trigger achievement evaluation or quest progress checks. The events are correctly inserted, but the downstream effects (achievements, quests) are missed.
**Suggested Fix:** Either call `reward_hook_service.process_action()` for each event type instead of directly inserting events, or call `achievement_service.evaluate_achievements()` at the end of `record_login()`.

### 5. ADVISORY -- No rate limiting on login endpoint

**File:** `backend/app/routes/progression.py:70-85`
**Issue:** The `POST /api/progression/login` endpoint has no rate limiting. While the same-day check prevents duplicate coin awards, an attacker could flood the endpoint to consume database connections and CPU via repeated SELECT FOR UPDATE queries.
**Suggested Fix:** Add a rate limit (e.g., 10 requests per minute per user) at the middleware or endpoint level.

---

## Summary

| Severity | Count |
|----------|-------|
| BLOCKING | 0 |
| ADVISORY | 5 |

The login streak logic is correct and thoroughly tested (including the full 7-day cycle and streak-reset scenarios). The main gap is that login events bypass the reward hook, so achievements related to login streaks are not automatically evaluated.
