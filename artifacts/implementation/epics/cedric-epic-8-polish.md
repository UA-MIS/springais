# Epic 8: Non-Adventure Mode Variant & Polish

> **Phase**: 3 (Dev-2, after Epic 6)
> **Estimated Stories**: 5
> **Dependencies**: All prior epics (this is the final polish pass)
> **Architecture References**: Concept Document Section 7 (Non-Adventure Mode)
> **ADR References**: D-CA-001

---

## Story 8.1: Implement Modern/Professional Variant

**Size**: M

**Description**: When adventure mode is OFF, Cedric's medieval appearance is replaced with a modern guide variant: a compass icon (32x32) with non-medieval language. Speech bubbles use the light/dark theme styling. All messages use the `modern` text variant.

**Acceptance Criteria**:
1. When `adventureMode.enabled === false`, the avatar renders as a 32x32 compass icon from `/assets/cedric/modern/compass-icon.png`.
2. No pedestal, equipment layers, or nameplate are shown in modern mode.
3. Speech bubbles use the light or dark theme variant (not parchment game theme).
4. All messages from `cedricMessages.ts` use the `modern` variant via `getCedricText()`.
5. Animations are minimal: a subtle pulse on hover (CSS `transform: scale(1.05)` transition), gentle bounce on notification.
6. The compass icon sits in the same bottom-right position as the full avatar.
7. Clicking the compass icon shows a tooltip: "Click to open guide" and opens a simplified speech bubble (no typing animation).
8. On clicking the compass, a prompt appears: "Want to switch to Adventure Mode?" with an action button.
9. Tests verify: compass icon renders when adventure off, no medieval elements, modern text variant used, hover pulse, adventure mode prompt.

**Dev Notes**:
- File: `frontend/src/components/avatar/AvatarCompanion.tsx` (modify -- add modern variant rendering branch)
- File: `frontend/src/components/avatar/ModernGuideIcon.tsx` (new -- simple compass icon component)
- Concept document Section 7 defines the complete non-adventure mode behavior.
- The compass icon asset is created in Epic 1 Story 1.5.

**Dependencies**: Epic 1 (AvatarCompanion, AvatarSprite)

---

## Story 8.2: Implement Minimize to Icon and Drag to Reposition

**Size**: M

**Description**: Allow users to minimize Cedric to a small 32x32 icon and drag the avatar to reposition it on screen. Position is persisted in localStorage.

**Acceptance Criteria**:
1. Double-clicking the avatar minimizes it to 32x32 (character head in a circular border).
2. Hovering the minimized icon shows a tooltip: "Click to restore Cedric".
3. Single-clicking the minimized icon restores to full size with a Framer Motion pop-up spring animation.
4. The right-click context menu (from Epic 6 Story 6.5) includes "Minimize" option.
5. Drag to reposition: the user can click and hold (300ms) to start dragging the avatar to any screen edge (bottom-left, bottom-right, bottom-center).
6. The position is persisted in localStorage as `cedric-position` (JSON `{ anchor: string }`).
7. On provider mount, position is restored from localStorage (default: `bottom-right`).
8. The avatar snaps to the nearest valid anchor position on drag end (not free-form placement).
9. Tests verify: double-click minimizes, click restores, drag repositioning, position persistence, snap to anchor.

**Dev Notes**:
- File: `frontend/src/components/avatar/AvatarCompanion.tsx` (modify -- add minimize toggle, drag handlers)
- File: `frontend/src/context/CedricContext.tsx` (modify -- persist position to localStorage)
- Architecture Section 2 defines the valid positions: `bottom-right`, `bottom-left`, `bottom-center`.
- Drag implementation: use `onPointerDown` + `onPointerMove` + `onPointerUp` for cross-platform drag.
- Differentiate between click (toggle CharacterSheet) and drag (300ms hold threshold).

**Dependencies**: Epic 1 Story 1.4 (AvatarCompanion)

---

## Story 8.3: Implement prefers-reduced-motion Support

**Size**: S

**Description**: When the user's system has `prefers-reduced-motion` enabled, all Cedric animations become instant (no transitions, no sprite sheet animation, static poses only).

**Acceptance Criteria**:
1. A `usePrefersReducedMotion()` hook detects the `prefers-reduced-motion: reduce` media query.
2. When reduced motion is preferred:
   - CSS sprite sheet animations are paused (first frame only shown).
   - Framer Motion reaction animations are instant (duration: 0).
   - Speech bubble entrance/exit animations are instant (no opacity/translate transitions).
   - Confetti particles are not rendered.
   - Typing animation shows full text immediately.
   - Inactivity timer still runs but state changes are instant (no animation, just sprite swap).
3. The hook result is available via CedricContext as `state.reducedMotion`.
4. All animation components check `reducedMotion` before applying motion.
5. Tests verify: hook detects media query, animations disabled, static poses display correctly.

**Dev Notes**:
- File: `frontend/src/hooks/usePrefersReducedMotion.ts` (new)
- File: `frontend/src/context/CedricContext.tsx` (modify -- expose `reducedMotion` in state)
- Modify components: `AvatarSprite.tsx`, `SpeechBubble.tsx`, `ConfettiEffect.tsx`, `FloatingText.tsx`
- Use `window.matchMedia('(prefers-reduced-motion: reduce)')` with an event listener for changes.
- Framer Motion supports `transition: { duration: 0 }` for instant animations.

**Dependencies**: Epic 4 (animations must exist to be conditionally disabled)

---

## Story 8.4: Implement Responsive Adjustments

**Size**: M

**Description**: Adjust Cedric's size and behavior for different viewport sizes. On tablets, the avatar scales to 96x96. On mobile, it auto-minimizes to a 48x48 icon or hides entirely.

**Acceptance Criteria**:
1. Viewport >= 1024px (desktop): Full 128x128 avatar with all features.
2. Viewport 768-1023px (tablet): Avatar scales to 96x96, pedestal and nameplate hidden, speech bubbles render as full-width bottom sheets.
3. Viewport < 768px (mobile): Avatar auto-minimizes to 48x48 icon. Speech bubbles render as full-width bottom sheets. Walkthrough still works but with simplified spotlight (top-aligned tooltips).
4. The resize behavior uses a `useBreakpoint()` hook that tracks `window.innerWidth` with debouncing (150ms).
5. On mobile, the context menu includes "Hide Cedric" option that sets visibility to `hidden` for the session.
6. The store page preview (192px) only renders on desktop. On tablet/mobile, the store page shows a smaller inline avatar.
7. Tests verify: size adjustments at each breakpoint, bottom sheet speech bubbles on small screens, walkthrough adaptation, hide option on mobile.

**Dev Notes**:
- File: `frontend/src/hooks/useBreakpoint.ts` (new)
- File: `frontend/src/components/avatar/AvatarCompanion.tsx` (modify -- responsive sizing)
- File: `frontend/src/components/avatar/SpeechBubble.tsx` (modify -- bottom sheet variant for small screens)
- Concept document Section 11 mentions mobile behavior: auto-minimize on viewports under 768px.
- Bottom sheet speech bubble: full-width, fixed to bottom of viewport, with larger touch targets.

**Dependencies**: All prior avatar components

---

## Story 8.5: Implement Accessibility Features

**Size**: M

**Description**: Add keyboard navigation, ARIA labels, and screen reader support to all Cedric components.

**Acceptance Criteria**:
1. The avatar container has `role="complementary"` and `aria-label="Cedric companion guide"`.
2. Tab key can focus the avatar (it has `tabIndex={0}`).
3. Enter key on focused avatar opens the CharacterSheet (same as click).
4. Escape key closes the CharacterSheet (already implemented in Epic 7 Story 7.3).
5. Speech bubbles have `role="alert"` for screen reader announcements and `aria-live="polite"`.
6. Action buttons in speech bubbles are keyboard-accessible (Tab + Enter).
7. The dismiss button (X) has `aria-label="Dismiss message"`.
8. The "Don't show again" link has `aria-label="Stop showing this type of message"`.
9. Equipment layers have `alt=""` (decorative) since the CharacterSheet provides the textual inventory.
10. The walkthrough overlay inherits Joyride's built-in ARIA support.
11. Tests verify: focus via Tab, Enter to open CharacterSheet, Escape to close, screen reader labels present, speech bubble announced.

**Dev Notes**:
- File: `frontend/src/components/avatar/AvatarCompanion.tsx` (modify -- add ARIA attributes and keyboard handlers)
- File: `frontend/src/components/avatar/SpeechBubble.tsx` (modify -- add `role="alert"`, `aria-live`)
- File: `frontend/src/components/avatar/CharacterSheet.tsx` (modify -- focus trap when open)
- File: `frontend/src/components/avatar/AvatarSprite.tsx` (modify -- decorative `alt=""` on equipment images)
- React Joyride has built-in ARIA support via its `aria-*` props.
- Focus trap for CharacterSheet: use `useEffect` to trap Tab key within the panel when open.

**Dependencies**: Epic 7 Story 7.3 (CharacterSheet)

---

## Story Dependency Graph (Epic 8)

```
8.1 Modern Variant     8.2 Minimize & Drag     8.3 Reduced Motion
        \                     |                       /
         \                    |                      /
          ----> All independent, can run in parallel <----
                              |
                              v
                    8.4 Responsive Adjustments
                              |
                              v
                    8.5 Accessibility
```

Stories 8.1, 8.2, and 8.3 can all start in parallel.
Story 8.4 depends on having the base components from prior epics complete.
Story 8.5 depends on 8.4 (needs responsive variants to add ARIA to).
