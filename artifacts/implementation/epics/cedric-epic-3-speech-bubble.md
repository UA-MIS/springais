# Epic 3: Speech Bubble System

> **Phase**: 1 (Dev-2 starts here, parallel with Epic 1)
> **Estimated Stories**: 5
> **Dependencies**: Framer Motion (already installed), ThemeContext (existing)
> **Architecture References**: Sections 5, 3 (Speech Queue)
> **ADR References**: D-CA-004

---

## Story 3.1: Create SpeechBubble Component with Theme Variants

**Size**: M

**Description**: Create the `SpeechBubble` component that renders a themed speech bubble with support for text content, action buttons, dismiss button, and pointer triangle. The bubble supports game (parchment), light, and dark theme variants.

**Acceptance Criteria**:
1. `SpeechBubble` accepts the props interface defined in architecture Section 2: `message`, `theme`, `onDismiss`, `onAction`, `position`.
2. Game theme styling: parchment gradient (`#F5E6C8` to `#E8D5A8`), 2px solid `#8B6914` border, `Cinzel` serif for "Cedric:" label, dark brown text (`#3D2B1F`), max-width 280px, shadow `0 4px 16px rgba(0,0,0,0.3)`.
3. Light theme styling: white background, 1px solid `#E0E0E0` border, 12px rounded corners, system sans-serif.
4. Dark theme styling: `#2D2D3D` background, 1px solid `#404050` border, 12px rounded corners.
5. A pointer triangle (CSS border trick, 10px wide, 8px tall) points down toward the avatar in the `above` position, or up toward the avatar in the `below` position (per architecture Section 5 positioning logic).
6. The dismiss button (X) renders in the top-right corner when `message.dismissible` is true.
7. An optional "Don't show again" link renders below the message when `message.suppressible` is true.
8. Action buttons (max 2) render below the message text with `primary` and `ghost` variants.
9. Renders `null` when `message` is null.
10. Tests verify: each theme renders correct styles, pointer direction, dismiss button visibility, action buttons render, null message renders nothing.

**Dev Notes**:
- File: `frontend/src/components/avatar/SpeechBubble.tsx` (new)
- Architecture Section 5 defines the complete visual design for all three themes.
- The `SpeechMessage` interface is defined in architecture Section 3 (Speech Queue).
- Use Tailwind CSS for styling where possible; inline styles for theme-specific values.
- The "Cedric:" label only appears in game theme.

**Dependencies**: None (can start immediately)

---

## Story 3.2: Implement Typing Animation

**Size**: S

**Description**: Add a character-by-character typing animation to the `SpeechBubble` component for narrative and walkthrough messages.

**Acceptance Criteria**:
1. When `message.typing` is true, text appears character by character at 25ms per character (configurable via `message.typingSpeed`).
2. A blinking cursor (2px wide, line height) appears at the end of the text during typing and disappears when complete.
3. Action buttons fade in (`opacity: 0 -> 1`, 150ms) after the text finishes typing.
4. When `message.typing` is false, the full text appears immediately (no animation).
5. If the message changes while typing is in progress, the animation resets for the new message.
6. The typing animation can be skipped by clicking anywhere on the speech bubble text.
7. Tests verify: typing animation speed, cursor visibility during/after typing, button fade-in timing, click-to-skip, reset on message change.

**Dev Notes**:
- File: `frontend/src/components/avatar/SpeechBubble.tsx` (modify -- add typing animation logic)
- Use `useState` + `useEffect` with `setInterval` at the typing speed.
- Architecture Section 5 defines timing: 25ms/char default, 150ms button fade-in delay.
- The cursor is a CSS-animated element (`@keyframes blink { 0%, 50% { opacity: 1 } 51%, 100% { opacity: 0 } }`).

**Dependencies**: Story 3.1

---

## Story 3.3: Implement Framer Motion Entrance/Exit Animations

**Size**: S

**Description**: Add Framer Motion entrance and exit animations to the `SpeechBubble` component using `AnimatePresence`.

**Acceptance Criteria**:
1. Entrance animation: `opacity: 0 -> 1`, `y: 10 -> 0`, `scale: 0.95 -> 1`, duration 250ms, ease "easeOut".
2. Exit animation: `opacity: 1 -> 0`, `y: 0 -> -5`, duration 200ms, ease "easeIn".
3. When a message transitions to the next in the queue, the exit animation plays, then after a 500ms gap, the entrance animation plays for the new message.
4. `AnimatePresence` wraps the bubble with `mode="wait"` to ensure exit completes before entrance.
5. Animations respect `prefers-reduced-motion` (instant show/hide, no animation).
6. Tests verify: entrance/exit animation props, transition gap timing, reduced motion behavior.

**Dev Notes**:
- File: `frontend/src/components/avatar/SpeechBubble.tsx` (modify -- wrap with Framer Motion)
- Framer Motion is already installed (v11.18.2).
- Architecture Section 5 defines the exact animation parameters and timing.
- The 500ms gap between messages is managed by `CedricContext` (sets `currentMessage = null` for 500ms before showing the next queue item).

**Dependencies**: Story 3.1

---

## Story 3.4: Implement Priority Speech Queue in CedricContext

**Size**: M

**Description**: Implement the full speech queue management system in `CedricContext` with priority ordering, auto-dismiss timers, route change cleanup, and overflow protection.

**Acceptance Criteria**:
1. `enqueueMessage()` adds messages to the queue sorted by priority: `walkthrough` (highest) > `reward` > `reaction` > `proactive` (lowest).
2. The current message displays for its `duration` (ms). When duration is 0, the message does not auto-dismiss.
3. On dismissal or timeout, the next queued message appears after a 500ms gap.
4. Queue overflow: when queue exceeds 3 messages, `proactive` and `reaction` messages are dropped; only `walkthrough` and `reward` are preserved.
5. Route change behavior: `walkthrough` and `reward` messages persist across navigation; `reaction` and `proactive` messages are cleared on route change.
6. `dismissCurrentMessage()` immediately removes the current message and triggers the next.
7. `suppressMessageType(messageType)` sets `localStorage` key `cedric-msg-suppress-${messageType}` to prevent future messages of that type.
8. Auto-dismiss timer resets if a higher-priority message is enqueued while a lower-priority message is showing (the new message preempts).
9. Tests verify: priority ordering, auto-dismiss timing, overflow protection, route change cleanup, suppress persistence, preemption.

**Dev Notes**:
- File: `frontend/src/context/CedricContext.tsx` (modify -- implement speech queue in the `enqueueMessage`, `dismissCurrentMessage`, `suppressMessageType` methods)
- Architecture Section 3 (Speech Queue) and Section 5 (Queue Management Rules) define all queue behavior.
- Use `useLocation()` from react-router-dom for route change detection.
- The 500ms gap between messages is implemented via a `setTimeout` that sets `currentMessage` from the queue.
- D-CA-004: Priority queue with anti-annoyance protocol.

**Dependencies**: Story 1.1 (CedricContext exists)

---

## Story 3.5: Create cedricMessages.ts Dialogue Configuration

**Size**: S

**Description**: Create the centralized dialogue configuration file with all Cedric messages in both medieval and modern variants, and the `getCedricText()` helper function.

**Acceptance Criteria**:
1. `cedricMessages.ts` defines the `MessageVariant` interface with `medieval` and `modern` string fields.
2. `getCedricText(variant, adventureEnabled)` returns the medieval string when adventure mode is on, modern string when off.
3. All walkthrough dialogue text is defined (7 steps, intro prompt, "maybe later" follow-up, completion message).
4. Placeholder page-specific messages are defined for: `/matches`, `/profile`, `/saved`, `/roadmap`, `/store`, `/quests`, `/success-patterns` (first-visit + return messages).
5. Error state message defined: "Something went awry..." / "Something went wrong...".
6. Loading state messages defined: generic loading, roadmap Oracle phases (5 phases).
7. All messages follow the brevity rule: max 2 sentences per message.
8. Tests verify: `getCedricText` returns correct variant, all required message keys exist, no message exceeds 2 sentences.

**Dev Notes**:
- File: `frontend/src/components/avatar/cedricMessages.ts` (new)
- Architecture Section 5 (Medieval vs Modern Text) defines the `MessageVariant` interface and `getCedricText` function.
- Walkthrough text is in architecture Section 4 (step definitions).
- Page-specific messages are in architecture Section 10 and concept document Section 4.
- Loading phase messages are in architecture Section 9 (Oracle Sequence).

**Dependencies**: None (can start in parallel with other stories)

---

## Story Dependency Graph (Epic 3)

```
3.1 SpeechBubble Component     3.5 cedricMessages.ts
 |           |
 v           v
3.2 Typing   3.3 Framer Motion Animations
Animation
                    3.4 Priority Queue (depends on Epic 1 Story 1.1)
```

Stories 3.1, 3.4, and 3.5 can start in parallel.
Stories 3.2 and 3.3 depend on 3.1.
Story 3.4 depends on CedricContext from Epic 1 Story 1.1.
