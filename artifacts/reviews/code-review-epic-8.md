# Code Review: Epic 8 -- Frontend Migration & UI

**Reviewer:** Adversarial Code Reviewer
**Files:** `frontend/src/context/AdventureModeContext.tsx`, `frontend/src/services/progressionService.ts`, `frontend/src/services/storeService.ts`, `frontend/src/pages/StorePage.tsx`, `frontend/src/components/game/AdventureHUD.tsx`, `frontend/src/components/game/NotificationToasts.tsx`, `frontend/src/components/layout/Sidebar.tsx`, `frontend/src/App.tsx`, frontend test files
**Architecture Refs:** Section 5, FR-022 through FR-028
**PRD Refs:** FR-022, FR-023, FR-024, FR-025, FR-026, FR-027, FR-028

---

## Findings

### 1. BLOCKING -- `/quests` route missing from App.tsx

**File:** `frontend/src/App.tsx`
**Issue:** The Sidebar component conditionally adds a "Quests" link to `/quests` when adventure mode is enabled and level >= 3 (Sidebar.tsx:23). However, App.tsx does NOT define a `<Route path="/quests" ... />`. Clicking the "Quests" link in the sidebar will show a blank page or hit the default redirect. The StorePage is lazy-loaded and routed at line 72, but there is no corresponding QuestsPage.
**Suggested Fix:** Create a QuestsPage component (or a placeholder) and add a route in App.tsx:
```tsx
const QuestsPage = lazy(() => import('./pages/QuestsPage'));
// Inside routes:
<Route path="/quests" element={<Suspense fallback={<PageLoader />}><QuestsPage /></Suspense>} />
```

### 2. BLOCKING -- AdventureHUD displays legacy `unlockedAchievements.length` instead of server count

**File:** `frontend/src/components/game/AdventureHUD.tsx:144`
**Issue:** The AdventureHUD displays `state.unlockedAchievements.length` for the achievement count. This is the CLIENT-SIDE legacy array that starts empty and is only populated by `unlockAchievement()` calls from the legacy client-side system. The server provides `unlocked_achievements_count` in the ProgressionState, but this field is not used anywhere in the UI. New server-side achievements (from Epic 4) will never increment the client-side counter.
**Suggested Fix:** Replace `state.unlockedAchievements.length` with `progression?.unlocked_achievements_count ?? 0` from the server data, or add an `achievementCount` field to the context state that reads from server data.

### 3. ADVISORY -- `addXP()` and `addGold()` optimistic updates don't update level or title

**File:** `frontend/src/context/AdventureModeContext.tsx:314-336`
**Issue:** The `addXP()` function optimistically updates `xp_total` in the query cache but does not recalculate `level`, `title`, `current_level_xp`, or `xp_to_next_level`. After a large XP award, the XP bar and level badge will show stale data until the next server refetch. Similarly, `addGold()` updates `coin_balance` but not `is_affordable` flags in the store catalog.
**Suggested Fix:** Either remove optimistic updates entirely (let server refetch handle it) or compute derived fields from the new xp_total. Since the server is authoritative, removing optimistic updates is simpler and safer.

### 4. ADVISORY -- Legacy client-side achievements still present alongside server achievements

**File:** `frontend/src/context/AdventureModeContext.tsx:23-141`
**Issue:** The ACHIEVEMENTS array (13 hardcoded achievements) and all associated functions (`unlockAchievement`, `getAchievements`, `isAchievementUnlocked`) remain in the codebase alongside the server-side achievement system (Epic 4). These are labeled as "legacy" but are still actively used by `AdventureHUD.tsx` (Finding #2). This dual system is confusing and creates discrepancy between client-side and server-side achievement counts.
**Suggested Fix:** Remove the legacy ACHIEVEMENTS array and related functions. Use server-side achievement data exclusively. If backward compatibility is needed, gate it behind a feature flag.

### 5. ADVISORY -- Store purchase mutation does not show success/error feedback

**File:** `frontend/src/pages/StorePage.tsx:46-54`
**Issue:** The purchase mutation's `onSuccess` handler closes the dialog and invalidates queries, but does not show a success notification toast. There's no `onError` handler either -- if the purchase fails (e.g., insufficient coins race condition), the user sees no feedback other than the dialog closing.
**Suggested Fix:** Add `onError` handler to show an error toast, and show a success notification using the existing NotificationToasts system.

### 6. ADVISORY -- No Redis caching implemented (Architecture Section 3.5)

**File:** All frontend and backend files
**Issue:** The architecture document specifies Redis caching for progression data, achievement catalog, and quest catalog (Section 3.5). No Redis integration exists in the codebase. All data is fetched from PostgreSQL on every request. The frontend uses React Query with `staleTime: 30000` (30s), which provides client-side caching but not server-side.
**Suggested Fix:** This is a performance optimization that can be deferred, but should be tracked as tech debt. Add Redis caching at the service layer for `get_progression()`, `load_catalog()`, and `get_available_quests()`.

### 7. ADVISORY -- Frontend test coverage gaps for StorePage and NotificationToasts

**File:** `frontend/src/pages/StorePage.test.tsx`, `frontend/src/components/game/NotificationToasts.test.tsx`
**Issue:** While these test files exist, the core AdventureModeContext tests focus on state management (localStorage removal, API backing, mutations). The StorePage tests should verify purchase flow, error handling, and catalog rendering. The NotificationToasts tests should verify that each toast type renders and auto-dismisses.
**Suggested Fix:** Expand test coverage for StorePage (purchase confirmation, error states) and NotificationToasts (level-up, quest complete, gold gain).

---

## Summary

| Severity | Count |
|----------|-------|
| BLOCKING | 2 |
| ADVISORY | 5 |

The frontend migration from localStorage to API-backed state is well-executed. React Query integration is correct with proper cache invalidation. The main issues are the missing `/quests` route and the HUD showing stale client-side achievement counts instead of server data.
