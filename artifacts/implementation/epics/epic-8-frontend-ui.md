# Epic 8: Frontend UI Overhaul

> **Phase**: 2-4 (cross-cutting, parallels backend epics)
> **Estimated Stories**: 7
> **Dependencies**: Epic 1 (Server Foundation) for API-backed context
> **PRD References**: FR-022, FR-025, FR-026
> **Architecture References**: Section 7
> **Security Review Fixes**: FINDING-AUTH-002

---

## Story 8.1: Remove ALL localStorage Gamification Persistence

**Size**: M

**Description**: Remove every reference to localStorage for gamification state in `AdventureModeContext.tsx`. This is the critical bug fix -- the single most important change in the entire project.

**Acceptance Criteria**:
1. The `STORAGE_KEY = 'springais-adventure-mode'` constant is removed.
2. The `loadState()` function is removed.
3. The `saveState()` function is removed.
4. ALL `localStorage.getItem('springais-adventure-mode')` calls are removed.
5. ALL `localStorage.setItem('springais-adventure-mode', ...)` calls are removed.
6. No gamification data is read from or written to localStorage.
7. The theme localStorage key (`springais-theme`) and auth localStorage keys (`token`, `user`) remain unchanged.
8. After this change, refreshing the page shows default gamification state (until API sync is wired in Story 8.2).
9. Tests verify: no localStorage calls for gamification, theme persistence unaffected.

**Dev Notes**:
- File: `frontend/src/context/AdventureModeContext.tsx` (modify)
- This is a surgical removal. Do not change any other logic in this story -- just remove the persistence layer.
- The existing `useState` initializers will use default values instead of `loadState()` values.
- Architecture Section 7.1 step 1: "Remove STORAGE_KEY, loadState(), saveState() functions entirely."
- Architecture Section 9.4 lists the exact cleanup.

**D-ID References**: FR-022.2, D-MM-12

**Dependencies**: None (can start immediately)

---

## Story 8.2: AdventureModeContext Refactor to API-Backed State

**Size**: L

**Description**: Refactor `AdventureModeContext.tsx` to fetch all gamification state from `GET /api/progression` via React Query on login, replacing the localStorage-based state management.

**Acceptance Criteria**:
1. On mount (when `AuthContext` provides a valid user), the provider calls `GET /api/progression` to load progression state.
2. All state variables (`totalXP`, `gold`, `level`, `title`, `loginStreak`, etc.) are derived from the server response.
3. The context uses `useQuery('progression')` from `@tanstack/react-query` with `staleTime: 30000`.
4. The toggle adventure mode function calls `POST /api/progression/toggle-adventure-mode`.
5. On logout, adventure mode state is cleared from React context (not from server).
6. The context exposes the same public API as before (totalXP, gold, level, title, etc.) for backward compatibility with consuming components.
7. `refetchOnWindowFocus: true` ensures fresh data when user returns to the app.
8. Tests cover: initial load from API, data populates context, logout clears state, refetch updates state.

**Dev Notes**:
- File: `frontend/src/context/AdventureModeContext.tsx` (major refactor)
- File: `frontend/src/services/progressionService.ts` (new)
- This is the big switch: from localStorage to API. The context interface stays the same; only the data source changes.
- Architecture Section 7.1 describes the full migration.
- The `enabled: !!user` option on useQuery ensures it only fetches when logged in.
- Keep the `computeLevelFromXP()` client-side function for optimistic display but validate against server level.

**D-ID References**: FR-022.1, FR-022.3, FR-022.4, FR-022.5, FR-022.6

**Dependencies**: Story 8.1, Epic 1 Story 1.7 (API endpoints)

---

## Story 8.3: React Query Integration for All Progression Data

**Size**: M

**Description**: Set up React Query hooks and mutation patterns for all gamification API calls. Define query keys, invalidation strategies, and optimistic update patterns.

**Acceptance Criteria**:
1. Query keys are standardized:
   - `['progression']` for main progression state
   - `['achievements', 'catalog']` for achievement catalog
   - `['store', 'catalog', { category, rarity }]` for store items
   - `['store', 'inventory']` for user inventory
   - `['quests', 'catalog']` for quest listing
   - `['quests', 'active']` for active quests
2. After any mutation that triggers gamification rewards, the `onSuccess` callback invalidates `['progression']` and relevant query keys.
3. Optimistic updates: when an action awards XP/Coins, the client immediately updates the UI, then reconciles with server response.
4. If server returns different values, client syncs to server state (server is authoritative).
5. Tests cover: query invalidation after mutations, optimistic update and reconciliation, stale time behavior.

**Dev Notes**:
- File: `frontend/src/context/AdventureModeContext.tsx` (extend with mutation hooks)
- File: `frontend/src/services/progressionService.ts` (extend)
- Architecture Section 7.3 defines the invalidation pattern and stale times.
- The mutation pattern for gamification-triggering actions:
  ```typescript
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['progression'] });
    if (data.gamification?.achievements_unlocked?.length) {
      queryClient.invalidateQueries({ queryKey: ['achievements', 'catalog'] });
    }
  }
  ```

**D-ID References**: FR-022.4

**Dependencies**: Story 8.2

---

## Story 8.4: Updated AdventureHUD with Dual-Track Display

**Size**: M

**Description**: Update the AdventureHUD component to display the full dual-track economy: level + title, XP progress bar, Coin balance, login streak, and quick-access buttons for Store and Quests.

**Acceptance Criteria**:
1. The HUD displays: level number + title text, XP progress bar (current_level_xp / total for level), Coin balance with icon, login streak count with fire icon.
2. Quick-access buttons for "Store" and "Quests" are shown (navigating to `/store` and `/quests`).
3. The Quests button is hidden or disabled if user level < 3 (side_quests not unlocked).
4. All data comes from the `['progression']` React Query data (no localStorage).
5. The HUD uses `getFantasyText()` for labels when adventure mode is active.
6. Medieval theme styling preserved.
7. Tests cover: HUD renders all fields, buttons navigate correctly, level-gated button visibility.

**Dev Notes**:
- File: `frontend/src/components/game/AdventureHUD.tsx` (modify)
- The HUD already exists and shows level/XP/gold. This updates it to use server data and adds Store/Quest buttons.
- Architecture Section 7.1 and FR-025.1 define the HUD requirements.

**D-ID References**: FR-025.1

**Dependencies**: Story 8.2

---

## Story 8.5: Level-Up Celebration Modal

**Size**: S

**Description**: Create or enhance the level-up notification to show a celebration modal with the new level, title, coin bonus, and any newly unlocked features.

**Acceptance Criteria**:
1. When a gamification API response indicates `level_up: true`, a celebration modal/toast appears.
2. The modal shows: "Level Up!" header, new level number, new title, coin bonus amount, list of newly unlocked features (if any).
3. The modal auto-dismisses after 5 seconds or on user click.
4. Uses framer-motion for entrance animation (consistent with existing toast animations).
5. Tests cover: modal renders with level-up data, feature unlock messages display, auto-dismiss works.

**Dev Notes**:
- File: `frontend/src/components/game/NotificationToasts.tsx` (modify or new LevelUpModal component)
- The existing toast system has a LEVEL_UP type. Enhance or replace with a more prominent modal.
- Architecture Section 7.3 describes detecting level-up from API responses.

**D-ID References**: FR-025.2, FR-007.3

**Dependencies**: Story 8.3

---

## Story 8.6: Reward Toast Notification System

**Size**: M

**Description**: Create a comprehensive toast notification system for all gamification rewards: XP gains, Coin gains, achievement unlocks, quest completions, and level-ups.

**Acceptance Criteria**:
1. XP gain toast shows: "+{amount} XP" with an XP icon and animation.
2. Coin gain toast shows: "+{amount} Gold" (adventure mode) / "+{amount} Coins" (normal mode).
3. Achievement unlock toast shows: achievement name, description, and reward amounts.
4. Quest completion toast shows: quest name, rewards earned including cosmetic preview.
5. Multiple toasts stack vertically and dismiss in order.
6. Toasts are triggered from gamification reward responses in API mutation callbacks.
7. Tests cover: each toast type renders correctly, multiple toasts stack, auto-dismiss timing.

**Dev Notes**:
- File: `frontend/src/components/game/NotificationToasts.tsx` (modify)
- File: `frontend/src/context/ToastContext.tsx` (may need extension for new toast types)
- The existing toast system handles XP_GAIN, GOLD_GAIN, ACHIEVEMENT, LEVEL_UP. Extend with QUEST_COMPLETE type.
- Use `getFantasyText()` for labels.

**D-ID References**: FR-025.3, FR-025.4

**Dependencies**: Story 8.3

---

## Story 8.7: Updated Sidebar Navigation and Fantasy Text Expansion

**Size**: S

**Description**: Update the sidebar to include Store and Quest navigation links and expand the fantasy text mapping with new terms.

**Acceptance Criteria**:
1. Sidebar includes "Store" / "Merchant's Armory" link (shown when adventure mode enabled).
2. Sidebar includes "Quests" / "Adventurer's Guild" link (shown when adventure mode enabled AND level >= 3).
3. Fantasy text mappings added per FR-026.1: Store -> Merchant's Armory, Quests -> Adventurer's Guild, Inventory -> Treasure Chest, Purchase -> Acquire, Equip -> Don, Unequip -> Remove, Coins -> Gold, Side Quest -> Adventure, Start Quest -> Accept Quest, Level Up -> Promotion.
4. All new UI elements use `getFantasyText()` consistently.
5. Tests cover: sidebar shows correct links based on adventure mode and level, fantasy text renders correctly.

**Dev Notes**:
- File: `frontend/src/components/layout/Sidebar.tsx` (modify)
- File: `frontend/src/context/AdventureModeContext.tsx` (modify -- extend fantasyText dict)
- Architecture Section 7.6 describes the sidebar changes.
- FR-026 defines all new fantasy text mappings.

**D-ID References**: FR-026

**Dependencies**: Story 8.2

---

## Story Dependency Graph (Epic 8)

```
8.1 Remove localStorage (independent, start first)
 |
 v
8.2 API-Backed Context (requires Epic 1 API)
 |         \
 v          v
8.3 React Query Integration   8.4 Updated HUD   8.7 Sidebar + Fantasy Text
 |         \
 v          v
8.5 Level-Up Modal   8.6 Reward Toasts
```
