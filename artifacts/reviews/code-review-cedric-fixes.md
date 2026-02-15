# Code Review: Cedric Fixes (Tasks 2-4)

**Reviewer**: reviewer agent
**Date**: 2026-02-15
**Branch**: feature/adventure-mode-advancements
**Scope**: Bug fixes for XP/Gold persistence, adventure mode prompt duplication, and Cedric/Roadmap Assistant overlap

---

## Summary

Three bugs were fixed across backend and frontend. Overall the fixes are correct, targeted, and well-tested. One blocking finding related to transaction safety in the backend, plus several advisory items.

---

## Task #2: XP/Gold/Achievements Not Updating

### Root Cause Analysis

**Correct.** The `reward_hook_service.process_action()` mutates the database session (awards XP, coins, evaluates achievements/quests), but the route handlers were not committing those changes. The fix adds `db.commit()` after each `process_action()` call.

### Backend Changes

#### `backend/app/routes/roadmap.py`

**Lines 132, 576**: Added `db.commit()` after gamification hooks for `roadmap_generated` and `milestone_passed` events.

- **BLOCKING -- B1: Missing rollback on gamification failure in `generate_roadmap`** (line 126-134)

  The roadmap is saved and committed on line 119. Then the gamification hook runs and commits again on line 132. If the gamification hook raises an exception, the `except` block logs and continues. However, if `db.commit()` on line 132 fails (e.g., database constraint violation inside `process_action`), the session may be left in a dirty state. The outer `except Exception` on line 145 would catch this, but would then attempt to raise an HTTPException with a potentially corrupted session.

  **Recommendation**: Add `db.rollback()` in the gamification except block to ensure the session is clean:

  ```python
  except Exception:
      db.rollback()
      logger.exception("Gamification failed for roadmap %s", saved_roadmap.id)
  ```

  This pattern should be applied to all four gamification hook locations (roadmap.py:133, roadmap.py:577, matches.py:358, skills.py:199).

- **Advisory -- A1: Gamification commit is a separate transaction from the primary action.**

  The roadmap save commits on line 119, then gamification commits on line 132. If gamification fails, the roadmap is saved but rewards are lost. This is the intended "fire-and-forget" pattern per the architecture (the comment says so explicitly), so this is acceptable. Just noting that in a future iteration, these could be combined into a single transaction for atomicity.

#### `backend/app/routes/matches.py`

**Line 357**: Added `db.commit()` after `first_match_view` gamification hook in `save_match`.

- The `save_match` function already commits the match on line 345. The gamification commit on line 357 is a separate transaction. Same pattern as roadmap -- acceptable for fire-and-forget.
- **Same B1 concern applies**: no `db.rollback()` in the except block.

#### `backend/app/routes/skills.py`

**Line 199**: Added `db.commit()` after `module_completed` gamification hook in `complete_module`.
**Line 863**: Added `db.commit()` after `resume_uploaded` gamification hook in `upload_resume`.

- `complete_module` (line 199): The commit is inside the try/except for gamification. The function continues to build the response including `reward_result` data. If `db.commit()` fails, `reward_result` will still be the return from `process_action`, but the DB changes won't be persisted. The except block correctly logs and continues, but leaves the session potentially dirty.
  - **Same B1 concern applies.**

- `upload_resume` (line 863): The skills are already committed on line 831. The gamification commit is separate. Same acceptable fire-and-forget pattern.
  - **Same B1 concern applies.**

### Frontend Changes

#### `frontend/src/context/AdventureModeContext.tsx`

**Lines 325-327 (addXP), 341-343 (addGold)**: Added `setTimeout(() => queryClient.invalidateQueries(...), 1500)` to trigger a deferred server refetch after optimistic updates.

- **Correct.** The optimistic update via `setQueryData` makes the HUD respond instantly, while the deferred invalidation ensures the HUD eventually shows persisted server values.
- The 1500ms delay is reasonable -- long enough for the backend commit to complete, short enough that the user sees accurate data promptly.
- The existing 3000ms timeout for clearing `recentXPGain`/`recentGoldGain` notifications is unaffected.

#### `frontend/src/components/game/AdventureHUD.tsx`

**Line 16-18**: Fixed XP bar calculation.

```typescript
const xpPercent = state.xpToNextLevel > 0
  ? (state.currentXP / (state.currentXP + state.xpToNextLevel)) * 100
  : 0;
```

- **Correct.** The formula `currentXP / (currentXP + xpToNextLevel)` properly computes the fill percentage. When `currentXP = 100` and `xpToNextLevel = 200`, the bar shows 33%, which means "100 XP earned out of 300 total needed for this level." This aligns with the server's `current_level_xp` and `xp_to_next_level` fields from the progression API.

### New Tests

#### `frontend/src/context/AdventureModeContext.refetch.test.tsx`

- 5 tests covering optimistic updates and deferred refetch behavior.
- Tests verify: immediate optimistic XP/gold update, deferred `invalidateQueries` call after 1500ms, and notification clearing after 3000ms.
- **Well-structured.** Uses fake timers correctly. Mocks are comprehensive.
- **Advisory -- A2**: The test doesn't verify that the refetch actually updates the displayed values (i.e., it only checks `invalidateQueries` was called, not that the re-fetched data overwrites the optimistic value). This is acceptable since React Query's invalidation behavior is tested by the library itself.

---

## Task #3: Adventure Mode Prompt When Already Enabled

### Root Cause Analysis

**Correct.** The onboarding intro in `CedricContext.tsx` always showed the "Enable Adventure Mode!" prompt regardless of whether adventure mode was already active. The fix adds an early-return branch that checks `adventureState.enabled` and shows a tour-only prompt instead.

### Changes

#### `frontend/src/context/CedricContext.tsx`

**Lines 419-456**: New early-return branch when `adventureState.enabled` is true.

- When adventure mode is already on, shows `onboarding-intro-tour` message with "Show me around!" and "I'll explore on my own" buttons.
- "Show me around!" dispatches `DISMISS_CURRENT_MESSAGE` then `START_WALKTHROUGH` -- does NOT call `enableAdventureMode()`.
- "I'll explore on my own" minimizes Cedric and calls `progressionApi.completeOnboarding()`.
- **Correct and well-targeted.** The fix is minimal -- only the intro useEffect is modified.

### Conflict Check: Dev-1 vs Dev-2

Both dev-1 and dev-2 modified `CedricContext.tsx` for Task #3. Examining the changes:

- **Dev-2** (CedricContext.onboarding.test.tsx, lines 421-494): Wrote tests for the "Adventure Mode Already Enabled" scenario. The test mock sets `mockAdventureState.enabled = true` and verifies the correct behavior.
- **Dev-1** (CedricContext.adventurePromptFix.test.tsx): Also wrote tests for the same scenario with a slightly different mock setup.
- **The implementation in CedricContext.tsx itself**: Only one version of the early-return branch exists (lines 419-456). There is no evidence of conflicting changes to the implementation file -- both developers appear to have agreed on the same fix.

**No merge conflict detected.** The implementation is singular. The two test files are complementary:
- `CedricContext.onboarding.test.tsx` (dev-2): Tests the full onboarding flow including the "adventure mode already enabled" sub-scenario.
- `CedricContext.adventurePromptFix.test.tsx` (dev-1): Focused exclusively on the "adventure mode already enabled" case with 6 dedicated tests.

- **Advisory -- A3: Overlapping test coverage.** Both test files test the same "adventure mode already on" scenario. The tests from dev-1 (`adventurePromptFix.test.tsx`) and the "Adventure Mode Already Enabled" describe block from dev-2 (`onboarding.test.tsx`, lines 421-494) are testing essentially identical behavior with slightly different mock setups. This isn't harmful but adds maintenance burden. Consider consolidating in a future cleanup.

### New Tests

#### `frontend/src/context/CedricContext.onboarding.test.tsx` (dev-2)

- 12 tests in two describe blocks.
- First block: Standard onboarding flow (adventure mode OFF) -- 10 tests.
- Second block: Adventure mode already enabled -- 4 tests.
- Good coverage of the full onboarding journey including "Maybe Later" flow.

#### `frontend/src/context/CedricContext.adventurePromptFix.test.tsx` (dev-1)

- 6 tests focused on the adventure-mode-already-enabled scenario.
- Tests: new user detection, no "Enable Adventure Mode!" button, correct buttons shown, walkthrough start without enableAdventureMode, minimize + completeOnboarding, medieval text variant.
- **Good edge case**: test for medieval text variant (line 261-268) verifies the `getCedricText` function uses the medieval variant when adventure mode is on.

---

## Task #4: Cedric Overlaying Roadmap Assistant

### Root Cause Analysis

**Correct.** Both Cedric (fixed position, bottom-right, z-index 35) and the Roadmap Assistant occupy the bottom-right corner. The fix adds a per-page visibility override system.

### Changes

#### `frontend/src/components/avatar/cedricPageConfig.ts`

**Line 27**: Added `defaultVisibility` field to `PageConfig` interface.
**Line 82**: Set `defaultVisibility: 'minimized'` for the `/roadmap` route.

- **Correct.** The architecture document (Section 10) defines `PageConfig` but did not originally include `defaultVisibility`. This is a reasonable extension to the interface.
- **Advisory -- A4**: The `defaultVisibility` field is only used for `/roadmap` currently. If more pages need visibility overrides in the future, the pattern is already in place.

#### `frontend/src/context/CedricContext.tsx`

**Lines 956-973**: Route change handler applies page visibility overrides.

```typescript
const pageVisibilityOverrideRef = useRef(false);

// Apply per-page default visibility
if (pageConfig?.defaultVisibility && pageConfig.defaultVisibility !== 'full') {
  dispatch({ type: 'SET_VISIBILITY', visibility: pageConfig.defaultVisibility });
  pageVisibilityOverrideRef.current = true;
} else if (pageVisibilityOverrideRef.current) {
  // Restore to full when leaving a page that had an override
  dispatch({ type: 'SET_VISIBILITY', visibility: 'full' });
  pageVisibilityOverrideRef.current = false;
}
```

- **Correct.** The `pageVisibilityOverrideRef` tracks whether the current minimized state was caused by an automatic page override (vs. user action). When navigating away from `/roadmap`, Cedric is restored to full visibility.
- **Edge case handled**: If user manually restores Cedric on `/roadmap`, the ref still tracks the override. On next navigation, the `else if` branch fires and sets full visibility (which is already the state). No harm done.
- **Architecture compliance**: This aligns with Section 10 of architecture-cedric-avatar.md, which specifies route change behavior including clearing non-persistent messages and applying page configs.

### New Tests

#### `frontend/src/context/CedricContext.routeChange.test.tsx`

- 4 tests for page visibility override behavior plus 7 tests for route change listener and anti-annoyance protocol.
- Tests verify: auto-minimize on `/roadmap`, full visibility on non-overridden pages, restore when navigating away, manual restore override.
- **Good boundary test**: "allows user to manually restore from minimized on /roadmap" (line 158-169) verifies that the automatic minimization doesn't lock the user out.
- **Advisory -- A5**: The route change test uses `mockPathname` variable and rerenders, but doesn't simulate React Router's actual location change. This is fine for unit testing the hook behavior, but may not catch issues with the `useEffect` dependency on `location.pathname`. Consider integration-level testing in the future.

---

## Security Review

### db.commit() additions (B1 -- see above)

The `db.commit()` calls in the gamification try/except blocks are the primary security concern. If `process_action()` corrupts the session (e.g., integrity error inside achievement evaluation), the commit will fail and the except block swallows the error without rolling back. This leaves the SQLAlchemy session in a potentially inconsistent state for subsequent operations in the same request.

**Risk**: Low-to-medium. The gamification hooks are wrapped in try/except with `logger.exception`, and the service itself (`RewardHookService.process_action`) catches all exceptions internally (lines 109-122 of `reward_hook_service.py`). So the outer try/except in routes should only catch unexpected failures. But defensive `db.rollback()` is still best practice.

### No new SQL injection vectors

All gamification hooks pass UUIDs and string literals, not user input. No risk.

### No new XSS vectors

Frontend changes are React state updates and React Query cache manipulation. No dangerouslySetInnerHTML or raw DOM insertion. No risk.

### No CSRF concerns

All endpoints require `get_current_user_from_token` authentication. No change to auth flow.

---

## Findings Summary

### Blocking

| ID | Severity | Location | Description |
|----|----------|----------|-------------|
| B1 | Medium | `roadmap.py:133`, `roadmap.py:577`, `matches.py:358`, `skills.py:199`, `skills.py:863` | Missing `db.rollback()` in gamification except blocks. If `db.commit()` fails, session is left dirty. Add `db.rollback()` before logging in each except block. |

### Advisory

| ID | Severity | Location | Description |
|----|----------|----------|-------------|
| A1 | Low | Backend routes | Gamification uses separate commit from primary action (fire-and-forget). Acceptable per architecture but noted for future atomicity improvement. |
| A2 | Low | `AdventureModeContext.refetch.test.tsx` | Tests verify `invalidateQueries` is called but not that refetched data overwrites optimistic values. Acceptable since React Query internals are library-tested. |
| A3 | Low | `CedricContext.onboarding.test.tsx` + `CedricContext.adventurePromptFix.test.tsx` | Overlapping test coverage for "adventure mode already enabled" scenario. Consider consolidating in future cleanup. |
| A4 | Info | `cedricPageConfig.ts` | `defaultVisibility` field only used for `/roadmap`. Pattern is extensible for future pages. |
| A5 | Low | `CedricContext.routeChange.test.tsx` | Mock-based route simulation. Consider integration tests for real React Router location changes. |

---

## Verdict

**Conditional approval.** The fixes are correct and well-tested. Resolve B1 (add `db.rollback()` to gamification except blocks) before merge. Advisory items can be addressed in subsequent iterations.
