# Code Review: Epic 7 -- Event-Driven Reward Hooks

**Reviewer:** Adversarial Code Reviewer
**Files:** `backend/app/services/reward_hook_service.py`, `backend/app/routes/skills.py`, `backend/app/routes/roadmap.py`, `backend/app/routes/matches.py`, `backend/app/routes/progression.py` (visit endpoint), `backend/tests/test_reward_hook_service.py`
**Architecture Refs:** Section 4.4, Section 6.4, FINDING-ARCH-001, FINDING-INT-002
**PRD Refs:** FR-020, FR-021

---

## Findings

### 1. BLOCKING -- Visit endpoint fires "profile_completed" event for explorer achievement

**File:** `backend/app/routes/progression.py:132-137`
**Issue:** When all required pages have been visited, the visit endpoint calls `reward_hook_service.process_action(db, current_user.id, "profile_completed", ...)`. This fires the `"profile_completed"` event type, which awards 50 XP + 25 coins per the REWARD_CONFIG. However, this is the WRONG event type -- `"profile_completed"` is intended for when a user completes their profile (upload resume, fill in details). The explorer/page-visit achievement should use a distinct event type like `"explorer_completed"` or `"all_pages_visited"`. Currently, visiting all pages gives the same reward as completing your profile, and the two actions share the same reward config entry. Since the event_key is different (`"explorer:{user_id}"` vs `"profile:{user_id}"`), both awards will fire, giving 100 XP + 50 coins total for what should be a single reward.
**Suggested Fix:** Add a new REWARD_CONFIG entry for `"explorer_completed"` and use that event type in the visit endpoint.

### 2. ADVISORY -- Visit endpoint returns empty `achievements_unlocked` despite evaluating achievements

**File:** `backend/app/routes/progression.py:122, 143`
**Issue:** The `achievements_unlocked` list is initialized empty at line 122 and returned unchanged at line 143. The `reward_hook_service.process_action()` call at line 134 returns a `RewardResult` that includes `achievements_unlocked`, but this result is discarded. The client never sees which achievements were unlocked by the visit.
**Suggested Fix:** Capture the result and populate the response:
```python
result = reward_hook_service.process_action(...)
if result and result.achievements_unlocked:
    achievements_unlocked = result.achievements_unlocked
```

### 3. ADVISORY -- Module-level imports of achievement_service and quest_service at bottom of file

**File:** `backend/app/services/reward_hook_service.py:220-226`
**Issue:** The module-level imports at the bottom of the file (`from app.services.achievement_service import achievement_service` and `from app.services.quest_service import quest_service`) break the conventional Python import style. While this resolves circular import issues, it makes the module harder to understand and test. If any of the imported modules fail to load, the error will be raised at import time with an unhelpful traceback.
**Suggested Fix:** Document why these imports are at the bottom (circular dependency resolution), or restructure to use lazy loading / dependency injection.

### 4. ADVISORY -- `process_action()` coins-only events can't be idempotent

**File:** `backend/app/services/reward_hook_service.py:146-164`
**Issue:** When `config.xp > 0`, the XP award uses `event_key` for idempotency. But when `config.xp == 0 and config.coins > 0` (e.g., `daily_login`, `streak_3`, `peer_endorsement`), `award_coins()` is called without any event_key check. This means coins-only events are NOT idempotent through the reward hook. Calling `process_action(db, user_id, "peer_endorsement", event_key="same")` twice will award 50 coins total.
**Suggested Fix:** For coins-only events, add idempotency checking similar to XP events, or document that coins-only events are intentionally repeatable.

### 5. ADVISORY -- REWARD_CONFIG for `side_quest_completed` has coins=100 but quest completion already awards coins

**File:** `backend/app/services/reward_hook_service.py:67`
**Issue:** The `"side_quest_completed"` event type in REWARD_CONFIG has `coins=100`. However, quest completion awards coins directly via `quest_service.complete_quest()` which calls `progression.award_coins()`. If the quest completion also fires through `reward_hook_service`, the user gets DOUBLE coins. Currently, quest completion does NOT go through the reward hook (it calls `progression` directly), so this is not an active bug. But if the integration is later changed to route through the hook, it will cause duplication.
**Suggested Fix:** Either set `side_quest_completed.coins = 0` in REWARD_CONFIG (since quests award their own coins), or document that quest rewards are separate from the reward hook.

### 6. ADVISORY -- Fire-and-forget pattern swallows all exceptions including OOM/SystemExit

**File:** `backend/app/services/reward_hook_service.py:111-120`
**Issue:** The `process_action()` method catches `Exception`, which includes `MemoryError`, `KeyboardInterrupt` (inherited from BaseException, actually not caught), and other critical errors. While `Exception` is the standard catch-all in Python (and does NOT catch `BaseException` subtypes), it still catches `RuntimeError`, `RecursionError`, etc. The structured logging is good, but the caller has no way to know if the failure was transient or permanent.
**Suggested Fix:** Acceptable as designed per FINDING-ARCH-001. No change needed.

---

## Summary

| Severity | Count |
|----------|-------|
| BLOCKING | 1 |
| ADVISORY | 5 |

The FINDING-ARCH-001 fix (structured error logging) and FINDING-INT-002 fix (ensure_progression_exists before processing) are correctly implemented. The fire-and-forget pattern is well-executed. The critical issue is the wrong event type being used for the explorer achievement.
