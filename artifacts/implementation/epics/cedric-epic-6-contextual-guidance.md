# Epic 6: Contextual Guidance System

> **Phase**: 2 (Dev-2, after Epic 4)
> **Estimated Stories**: 5
> **Dependencies**: Epic 1 (CedricContext), Epic 3 (SpeechBubble), Epic 4 (Reactions)
> **Architecture References**: Section 10
> **ADR References**: D-CA-004

---

## Story 6.1: Create Page Configuration Map

**Size**: M

**Description**: Create the `cedricPageConfig.ts` configuration file that maps routes to Cedric's behavior: first-visit messages, return-visit messages, empty-state messages, and proactive suggestions for each page.

**Acceptance Criteria**:
1. `PAGE_CONFIGS` record is defined with entries for: `/matches`, `/profile`, `/saved`, `/roadmap`, `/store`, `/quests`, `/success-patterns`.
2. Each `PageConfig` has: `firstVisitMessage` (MessageVariant), `firstVisitAvatarState`, `returnMessages` (array of MessageVariant, rotated), `returnAvatarState`, optional `emptyStateMessage`, optional `emptyStateAvatarState`, optional `proactiveSuggestions`.
3. All messages exist in both medieval and modern variants per architecture Section 10.
4. `/matches` has: first-visit ("Welcome to the Quest Board!"), return ("Back to scout..."), empty state ("The Quest Board is empty. Have you uploaded your scroll?").
5. `/profile` has: first-visit ("This is your Hero Sheet..."), return ("Updating your abilities?"), incomplete profile ("Your Hero Sheet has empty fields...").
6. `/store` has: return ("Old Grimshaw has his finest wares..."), proactive suggestion for affordable items.
7. The `ProactiveSuggestion` interface includes: `id`, `trigger` ('idle_time' | 'data_condition'), `condition` function, `message`, `avatarState`.
8. Tests verify: all routes have configs, all messages have both variants, config structure matches interface.

**Dev Notes**:
- File: `frontend/src/components/avatar/cedricPageConfig.ts` (new)
- Architecture Section 10 defines the complete `PageConfig` interface and all page entries.
- Concept document Section 4 has the detailed page-specific behavior tables.
- Proactive suggestions use condition functions that check: `gold`, `level`, `daysAway` (from progression state).

**Dependencies**: Epic 3 Story 3.5 (cedricMessages.ts for MessageVariant interface)

---

## Story 6.2: Implement First-Visit Detection and Route Change Listener

**Size**: M

**Description**: Implement the route change listener in `CedricContext` that detects page navigations and triggers first-visit or return-visit messages based on the page configuration and visit history.

**Acceptance Criteria**:
1. On route change, `CedricContext` clears non-persistent messages (keeps `walkthrough` and `reward`).
2. If the route has a `PageConfig` and the user has NOT visited this page before (tracked in localStorage as `cedric-first-visit-{path}`), the first-visit message is enqueued with priority `reaction`.
3. After showing the first-visit message, `localStorage.setItem('cedric-first-visit-{path}', 'true')` is set.
4. If the user HAS visited before (first-visit already shown), a return message is selected randomly from `returnMessages` and subject to anti-annoyance rules.
5. If the page has an `emptyStateMessage` and the page data is empty (no matches, no saved roles, etc.), the empty-state message shows instead of the return message.
6. First-visit messages are NOT shown during an active walkthrough.
7. First-visit messages use the `firstVisitAvatarState` animation; return messages use `returnAvatarState`.
8. Tests verify: first-visit triggers once per page, localStorage tracking, return message rotation, empty-state override, walkthrough suppression, queue cleanup on route change.

**Dev Notes**:
- File: `frontend/src/context/CedricContext.tsx` (modify -- add `useEffect` on `location.pathname`)
- Architecture Section 10 (Route Change Listener) has the exact implementation pattern.
- Use `useLocation()` from react-router-dom.
- Empty state detection: for `/matches`, check if match results are empty via React Query data; for `/saved`, check saved roles count.

**Dependencies**: Story 6.1, Epic 1 Story 1.1 (CedricContext), Epic 3 Story 3.4 (speech queue)

---

## Story 6.3: Implement Anti-Annoyance Protocol

**Size**: M

**Description**: Implement the complete anti-annoyance protocol in `CedricContext`: frequency decay, cooldown period, session cap, suppression tracking, quiet mode, and no-repeat rules.

**Acceptance Criteria**:
1. `shouldShowProactiveMessage(messageType)` function implements all 6 rules from architecture Section 10:
   - Rule 1: Returns false if `quietMode` is true.
   - Rule 2: Returns false if `sessionMessageCount >= 8`.
   - Rule 3: Returns false if less than 90 seconds since `lastMessageTimestamp`.
   - Rule 4: Returns false if `localStorage` key `cedric-msg-suppress-{messageType}` exists.
   - Rule 5: Frequency decay -- probability = `max(0.1, 1 / Math.pow(2, showCount))`. Returns false if `Math.random() > probability`.
   - Rule 6: Returns false if `currentMessage?.messageType === messageType` (no exact repeats).
2. When a proactive message IS shown, the show count is incremented in localStorage (`cedric-msg-freq-{messageType}`).
3. `sessionMessageCount` increments for each proactive message shown and resets on page reload (not persisted).
4. `lastMessageTimestamp` updates when any proactive message is shown.
5. The "Don't show again" link in SpeechBubble calls `suppressMessageType(messageType)`.
6. Tests verify: each rule independently, frequency decay probability, session cap, cooldown timing, suppression persistence, combined rule evaluation.

**Dev Notes**:
- File: `frontend/src/context/CedricContext.tsx` (modify -- add `shouldShowProactiveMessage` and tracking state)
- Architecture Section 10 (Anti-Annoyance Protocol) defines all 6 rules.
- D-CA-004: Anti-annoyance protocol is critical to prevent Clippy behavior.
- The frequency decay uses `localStorage.getItem(`cedric-msg-freq-${messageType}`)` to track show counts across sessions.

**Dependencies**: Story 6.2

---

## Story 6.4: Implement Proactive Suggestion System

**Size**: M

**Description**: Implement the proactive suggestion system that triggers context-aware suggestions based on idle time, data conditions, and route-specific triggers.

**Acceptance Criteria**:
1. Proactive suggestions from `PAGE_CONFIGS[route].proactiveSuggestions` are evaluated on a 30-second interval when the user is on a page.
2. `idle_time` triggers fire after 5+ minutes on a single page without interaction.
3. `data_condition` triggers evaluate their `condition` function against current state (gold, level, daysAway).
4. Suggestions are subject to the anti-annoyance protocol (`shouldShowProactiveMessage`).
5. Example triggers implemented:
   - Gold > 500 and haven't visited store recently: "Your coffers are filling up!"
   - Active roadmap with uncompleted milestones: "Your Adventure Path has uncompleted milestones."
   - 3+ days since last match check: "It has been a few days since you visited the Quest Board."
6. Proactive messages use priority `proactive` (lowest, first to be dropped by queue overflow).
7. The evaluation interval is cleared on route change and on unmount.
8. Tests verify: idle_time trigger after 5 minutes, data_condition evaluation, anti-annoyance gating, interval cleanup.

**Dev Notes**:
- File: `frontend/src/context/CedricContext.tsx` (modify -- add proactive suggestion evaluation loop)
- File: `frontend/src/components/avatar/cedricPageConfig.ts` (verify suggestion definitions)
- Architecture Section 10 and concept document Section 4 define the proactive triggers.
- Use `setInterval(evaluateProactiveSuggestions, 30000)` within a `useEffect` that depends on `location.pathname`.
- "Days away" calculation: compare current date with `last_login_date` from progression state.

**Dependencies**: Story 6.3 (anti-annoyance protocol)

---

## Story 6.5: Implement Quiet Mode and Tip Tracking Persistence

**Size**: S

**Description**: Implement the quiet mode toggle and persist tip tracking data in localStorage for cross-session consistency.

**Acceptance Criteria**:
1. Right-clicking the avatar opens a context menu with "Quiet Mode" toggle, "Minimize", and "Reset Position".
2. Quiet mode is stored in localStorage as `cedric-quiet-mode` (boolean).
3. When quiet mode is on:
   - No proactive suggestions shown.
   - First-visit messages still show (one time only, ever).
   - Reaction animations still play.
   - Speech bubbles for reactions are suppressed.
   - Walkthrough/onboarding messages are unaffected.
4. `CedricContext.toggleQuietMode()` toggles the state and persists to localStorage.
5. On provider mount, quiet mode is restored from localStorage.
6. The context menu uses `onContextMenu` event on the avatar container.
7. Tests verify: context menu appears on right-click, quiet mode toggle persists, suppression rules applied per category, restoration on mount.

**Dev Notes**:
- File: `frontend/src/components/avatar/AvatarCompanion.tsx` (modify -- add `onContextMenu` handler and context menu component)
- File: `frontend/src/context/CedricContext.tsx` (modify -- restore quiet mode from localStorage on mount)
- Architecture Section 10 (Quiet Mode) defines the exact behavior.
- The context menu can be a simple absolute-positioned div that appears on right-click and closes on click-outside.

**Dependencies**: Story 6.3 (anti-annoyance uses quietMode flag)

---

## Story Dependency Graph (Epic 6)

```
6.1 Page Config Map
        |
        v
6.2 First-Visit & Route Change
        |
        v
6.3 Anti-Annoyance Protocol
        |
        v
6.4 Proactive Suggestions     6.5 Quiet Mode & Persistence
```

Story 6.1 can start immediately.
Story 6.2 depends on 6.1.
Story 6.3 depends on 6.2.
Stories 6.4 and 6.5 depend on 6.3 and can run in parallel.
