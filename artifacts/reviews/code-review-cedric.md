# Code Review: Cedric Avatar Companion System

**Reviewer**: reviewer agent
**Date**: 2026-02-12
**Scope**: All new and modified files for the Cedric Avatar implementation (Epics 1-8)
**Architecture Reference**: `artifacts/design/architecture-cedric-avatar.md`

---

## Summary

| Category | Count |
|----------|-------|
| **Blocking** | 7 |
| **Advisory** | 8 |

---

## Blocking Findings

### B1: Stale closure in inactivity/lookAround callbacks causes incorrect behavior

**Severity**: blocking
**File**: `frontend/src/context/CedricContext.tsx`
**Line**: ~706-756 (scheduleLookAround and resetInactivity)

**Issue**: Both `scheduleLookAround` and `resetInactivity` are `useCallback` hooks that close over `state.animationState` and `state.visibility`. However, the effect at line 758 that registers the event listeners uses `[state.visibility]` as its dependency array (with an eslint-disable). This means:

1. `resetInactivity` and `scheduleLookAround` are recreated every time `state.animationState` or `state.visibility` changes (because they list these as deps in useCallback).
2. But the `mousemove`/`keydown` event listeners hold references to the *initial* versions from when the effect last ran (only when `state.visibility` changes).
3. The `setTimeout` callbacks inside `scheduleLookAround` capture `state.animationState` at the time the callback was *created*, not at the time it fires. So 15-20 seconds later, the check `if (state.animationState === AnimationState.Idle)` uses a stale value.

This means the inactivity system will frequently check the wrong animation state and either fail to trigger sitting/sleeping or trigger them at incorrect times.

**Fix**: Use refs to track the current animation state for timer callbacks. Store `animationState` in a ref (`animStateRef.current = state.animationState`) and read from the ref inside `setTimeout` callbacks. Alternatively, restructure to use `useRef` for the handler function and update it without re-registering event listeners.

---

### B2: Double reward dispatch during walkthrough -- both WalkthroughOverlay and CedricContext dispatch rewards for the same step

**Severity**: blocking
**File**: `frontend/src/components/avatar/WalkthroughOverlay.tsx` (lines 40-63) and `frontend/src/context/CedricContext.tsx` (lines 622-633)

**Issue**: There are two independent reward dispatch mechanisms for walkthrough step completion:

1. **WalkthroughOverlay.tsx** `handleCallback` (line 40): On `type === 'step:after'`, it calls `addXP()`, `addGold()`, and `progressionApi.completeWalkthroughStep()`.
2. **CedricContext.tsx** `completeCurrentStep` (line 622): On step completion detection, it also calls `doAddXP()`, `doAddGold()`, and `progressionApi.completeWalkthroughStep()`.

Both code paths fire for the same walkthrough step, resulting in double XP/Gold rewards on the frontend (the backend is idempotent via `event_key`, so the server-side is protected, but the frontend `addXP`/`addGold` calls update the AdventureModeContext state directly with doubled values before the next server sync).

**Fix**: Remove the reward dispatch from `WalkthroughOverlay.tsx` `handleCallback` (lines 46-52 and 55-57). Let the CedricContext step-completion detection be the single source of truth for rewards. WalkthroughOverlay should only notify CedricContext about step transitions (call `onStepComplete`), and CedricContext handles all reward logic.

---

### B3: Unsafe type cast for equippedItems from adventureState

**Severity**: blocking
**File**: `frontend/src/components/avatar/AvatarCompanion.tsx` (line 160) and `frontend/src/components/avatar/CharacterSheet.tsx` (line 37-38) and `frontend/src/components/avatar/StoreAvatarPreview.tsx` (line 27-29)

**Issue**: Three components use the same unsafe pattern to extract equipped items:

```typescript
const equippedItems = adventureState.enabled
  ? ((adventureState as unknown as Record<string, unknown>).equippedItems as Record<string, null> ?? {})
  : {};
```

This double-cast through `unknown` bypasses TypeScript's type system entirely. If `adventureState` does not have an `equippedItems` property (e.g., during loading, or if the AdventureModeContext interface changes), this silently returns `undefined`, and the `?? {}` fallback only catches `null`/`undefined` at the top level -- not deeply nested access.

More critically, in `AvatarCompanion.tsx` line 160, the type is cast to `Record<string, null>` instead of `Record<string, CosmeticBrief | null>`, which loses all type information about the cosmetic items. `AvatarSprite` expects `Record<string, CosmeticBrief | null>` but receives `Record<string, null>`, meaning `item.name` calls in AvatarSprite will throw at runtime if items are actually equipped.

**Fix**: Add `equippedItems` to the `AdventureModeState` interface properly, or create a typed helper hook (e.g., `useEquippedItems()`) that safely extracts and types the data. Do not use `as unknown as Record<string, unknown>` casts.

---

### B4: Missing `suppressible` field on SpeechMessage objects in multiple dispatch sites

**Severity**: blocking
**File**: `frontend/src/context/CedricContext.tsx` (multiple locations) and `frontend/src/context/cedricTypes.ts` (line 54)

**Issue**: The `SpeechMessage` interface in `cedricTypes.ts` has `suppressible` as an optional field (`suppressible?: boolean`). However, the architecture document (Section 5) specifies it as a required `boolean` field. In `CedricContext.tsx`, onboarding messages at lines 452-486 and 562-573 omit the `suppressible` field entirely, meaning it defaults to `undefined`. The SpeechBubble component checks `message.suppressible && isComplete` (line 366 of SpeechBubble.tsx), so `undefined` is falsy and won't show the "Don't show again" link. This is inconsistent -- some messages set it explicitly to `false`, others omit it. If a future change sets the default to `true`, all omitted usages would break.

More importantly, first-visit messages dispatched in the route-change listener (CedricContext.tsx line 918-929) set `suppressible: false`, but return-visit messages set `suppressible: true` -- which is correct per the architecture. However, `enqueueMessage` in the proactive suggestion system (line 996-1008) correctly sets `suppressible: true`, but there is no corresponding call to `incrementProactiveCount` that tracks the frequency, which IS present at line 1009. Wait -- actually, it IS there. Let me re-check...

Actually, on closer re-reading, the main issue here is the interface inconsistency. The `suppressible` field MUST be required (not optional) in `cedricTypes.ts` to match the architecture and to prevent accidental omission. Currently 4 dispatch sites omit it entirely.

**Fix**: Change `suppressible?: boolean` to `suppressible: boolean` in the `SpeechMessage` interface, then fix all dispatch sites that omit it to explicitly set `suppressible: false`.

---

### B5: WalkthroughStepRequest allows step=0, enabling regression of walkthrough progress

**Severity**: blocking
**File**: `backend/app/schemas/progression.py` (line 107) and `backend/app/routes/progression.py` (line 182)

**Issue**: The `WalkthroughStepRequest` schema allows `step: int = Field(..., ge=0, le=7)`. The route handler's idempotency check is `if request.step <= prog.walkthrough_step`. This means a client can send `step=0` at any time, and it will always return `already_completed: True` (since `walkthrough_step` starts at 0). While this is harmless, the real issue is that the frontend sends `index + 1` as the step value (CedricContext.tsx line 630: `progressionApi.completeWalkthroughStep(state.walkthroughStep + 1)`), so valid values are 1-7. Allowing 0 in the schema is confusing and serves no purpose.

But the actual blocking issue is: the `le=7` constraint means step 7 is the maximum. The frontend sends `state.walkthroughStep + 1` where `walkthroughStep` is 0-indexed. After step 6 (the last step), the frontend sends `7`. This is correct. However, the `complete_onboarding` endpoint (line 246) also sets `walkthrough_step = 7`. If a user calls `walkthrough-step` with step=7 and THEN calls `complete-onboarding`, the step will be set to 7 twice -- which is benign. But if someone calls `walkthrough-step` with step=7 WITHOUT completing steps 1-6, the backend will happily accept it because the only check is `request.step <= prog.walkthrough_step`.

**A malicious client can skip directly to step 7 and claim all intermediate step rewards by sending step=1, step=2, ..., step=7 in rapid succession.** The idempotency check (`request.step <= prog.walkthrough_step`) only prevents re-completing the SAME step, but does not validate that steps are completed sequentially. A user at step 0 can jump directly to step 5 by posting `{"step": 5}`.

**Fix**: Add a sequential validation check: `if request.step != prog.walkthrough_step + 1: raise HTTPException(400, "Steps must be completed sequentially")`. This ensures step progression is monotonic and sequential.

---

### B6: `onFadeOutComplete` callback in AvatarLoadingStage creates stale closure and may not fire

**Severity**: blocking
**File**: `frontend/src/components/avatar/AvatarLoadingStage.tsx` (lines 57-95)

**Issue**: The `onFadeOutComplete` prop is listed in the `useEffect` dependency array at line 96. However, `NarratorWrapper.tsx` creates this callback with `useCallback(() => { setShowContent(true) }, [])` (line 85-87). The AvatarLoadingStage effect at line 57 runs when `isLoading` changes. Inside the effect, `onFadeOutComplete` is called in a `setTimeout` at line 89 (after 1500ms). If the parent re-renders between when the effect fires and when the 1500ms timer completes, the `onFadeOutComplete` reference in the closure could be stale.

More critically, the effect's cleanup function (lines 92-95) clears `fadeTimer` and `doneTimer`. But when `isLoading` transitions from `true` to `false`, React runs:
1. Cleanup of the previous effect (which was set when `isLoading=true`) -- this would clear any timers from the loading phase
2. Then the new effect with `isLoading=false`

The timers set at lines 81 and 87 are created when `isLoading` becomes `false`. But the cleanup at lines 92-95 belongs to THIS effect invocation, so it will only run when `isLoading` changes AGAIN. This is actually correct for this case. However, the real concern is: if the component unmounts while the timers are pending (e.g., user navigates away during the completion animation), the `setStageState` and `onFadeOutComplete` calls will fire on an unmounted component, potentially causing React memory leak warnings.

**Fix**: Track mount status with a ref (`isMounted.current`) and check it before calling `setStageState` and `onFadeOutComplete` in the timer callbacks. Or use an AbortController pattern in the cleanup.

---

### B7: SpeechBubble calls `message.onDismiss?.()` twice on dismiss

**Severity**: blocking
**File**: `frontend/src/components/avatar/SpeechBubble.tsx` (lines 209-211) and `frontend/src/context/CedricContext.tsx` (lines 521-522)

**Issue**: When the user clicks the dismiss button:
1. `SpeechBubbleInner.handleDismiss()` is called (line 209), which calls `message.onDismiss?.()` and then `onDismiss()` (the prop)
2. The `onDismiss` prop maps to `CedricContext.dismissCurrentMessage` (via AvatarCompanion -> SpeechBubble wiring, though this wiring is not directly visible since SpeechBubble is rendered in AvatarLoadingStage and CedricTooltip separately)
3. `CedricContext.dismissCurrentMessage` (line 520-528) ALSO calls `state.currentMessage.onDismiss()` at line 522

So `message.onDismiss` is called twice: once by SpeechBubble directly, and once by the context's `dismissCurrentMessage`. This could cause side effects to fire twice (e.g., navigation, API calls, state changes).

**Fix**: Remove the `message.onDismiss?.()` call from `SpeechBubbleInner.handleDismiss` (line 210) since the context already handles it. Or remove it from the context and keep it only in SpeechBubble. Pick one single place.

---

## Advisory Findings

### A1: `colorPalette` prop is always `null` -- dead code path

**Severity**: advisory
**File**: `frontend/src/components/avatar/AvatarSprite.tsx` (lines 35-39, 136-148) and every call site

**Issue**: The `colorPalette` prop is hard-coded to `null` in every single call site:
- `AvatarCompanion.tsx` line 204: `colorPalette={null}`
- `CedricTooltip.tsx` line 104: `colorPalette={null}`
- `CharacterSheet.tsx` line 128: `colorPalette={null}`
- `StoreAvatarPreview.tsx` line 54: not even passed (missing)
- `AvatarLoadingStage.tsx` lines 138, 199: not passed (missing)

The `COLOR_PALETTE_MAP` and the overlay div rendering code in AvatarSprite are dead code that adds complexity without functionality. The architecture mentions color palette as part of the equipment system, but no code reads or passes it.

**Fix**: Accept this as MVP scope and add a TODO comment, or remove the dead code paths until color palette support is actually implemented.

---

### A2: `useBreakpoint` hook is defined but never imported or used anywhere

**Severity**: advisory
**File**: `frontend/src/hooks/useBreakpoint.ts`

**Issue**: This hook exists as a new file but is not imported in any component. The architecture does not specify responsive breakpoint behavior for Cedric components. This is dead code.

**Fix**: Either remove the file or document where it will be used in a future story.

---

### A3: `WalkthroughOverlay` receives props it doesn't fully use

**Severity**: advisory
**File**: `frontend/src/components/avatar/WalkthroughOverlay.tsx`

**Issue**: The `WalkthroughOverlayProps` interface defines `onStepComplete`, `onComplete`, and `onSkip`, but:
- `onStepComplete` is called at line 63 (correct)
- `onComplete` is called at line 66-68 (correct)
- `onSkip` is called at line 70-72 (correct)

However, WalkthroughOverlay is never rendered in any visible component. It is exported from the barrel `index.ts` but never imported or rendered in `AvatarCompanion.tsx`, `MainLayout.tsx`, or anywhere else. This means the entire Joyride walkthrough overlay is defined but not wired into the component tree. The walkthrough step detection in CedricContext works via custom DOM events, but the Joyride spotlight overlay never actually appears on screen.

**Fix**: WalkthroughOverlay needs to be rendered inside MainLayout or AvatarCompanion (gated by `state.walkthroughActive`) and wired to CedricContext methods. Without this, the walkthrough has no visual spotlight overlay.

---

### A4: `SpeechBubble` is not rendered in `AvatarCompanion` -- speech system has no visible output

**Severity**: advisory
**File**: `frontend/src/components/avatar/AvatarCompanion.tsx`

**Issue**: The `AvatarCompanion` root component renders `AvatarSprite` but does NOT render `SpeechBubble`. According to the architecture (Section 2), `SpeechBubble` is a direct child of `AvatarCompanion`. The entire speech queue system in CedricContext manages `currentMessage` state, but no component reads and renders it in the main companion view.

`SpeechBubble` IS rendered inside `CedricTooltip` (for walkthrough tooltips) and `AvatarLoadingStage` (for loading narration), but the persistent companion's speech bubble -- which should display first-visit messages, return-visit messages, proactive suggestions, and reaction text -- is missing from the AvatarCompanion component.

This means all the contextual guidance messages (route change tips, anti-annoyance system, etc.) are dispatched to the queue but never shown to the user.

**Fix**: Add `<SpeechBubble message={state.currentMessage} theme={speechTheme} onDismiss={dismissCurrentMessage} onSuppress={suppressMessageType} position="above" />` to the AvatarCompanion full-visibility render, positioned above the AvatarSprite.

---

### A5: Proactive suggestion `setInterval` uses stale references

**Severity**: advisory
**File**: `frontend/src/context/CedricContext.tsx` (lines 961-1017)

**Issue**: The proactive suggestion `setInterval` at line 974 runs every 30 seconds. Inside the callback (lines 975-1011), it reads `state.walkthroughActive`, `adventureState.gold`, `adventureState.level`, and calls `shouldShowProactiveMessage` and `dispatch`. The effect dependency array is `[location.pathname]` (with eslint-disable).

Because `state` and `adventureState` are not in the dependency array, the interval callback captures their initial values at the time of effect creation. 30+ seconds later, the state values could be significantly different. For example, `state.walkthroughActive` could have become `true` in the meantime, but the callback still sees `false`.

**Fix**: Use refs for state values that need to be current inside intervals (`walkthroughActiveRef`, `goldRef`, `levelRef`), updated in a separate effect.

---

### A6: `cedricPageConfig.ts` uses `as unknown as MessageVariant[]` casts

**Severity**: advisory
**File**: `frontend/src/components/avatar/cedricPageConfig.ts` (lines 33, 54, 65, 78, 97, 117, 123)

**Issue**: Every `returnMessages` field uses `PAGE_MESSAGES[path].return as unknown as MessageVariant[]`. This double cast is needed because `PAGE_MESSAGES` uses `as const`, making the array readonly. The fix is trivial.

**Fix**: Either remove `as const` from the `PAGE_MESSAGES` object, or type `returnMessages` as `readonly MessageVariant[]` in the `PageConfig` interface.

---

### A7: No input sanitization on walkthrough step custom events

**Severity**: advisory
**File**: `frontend/src/context/CedricContext.tsx` (lines 648-654)

**Issue**: The walkthrough action event listener reads `(e as CustomEvent).detail.step` without validation:

```typescript
const handleAction = (e: Event) => {
  const detail = (e as CustomEvent).detail;
  if (stepData.completionDetection === 'action' && detail?.step === state.walkthroughStep) {
    completeCurrentStep();
  }
};
```

Any script on the page can dispatch `new CustomEvent('cedric-walkthrough-action', { detail: { step: N } })` to force-complete any walkthrough step. While the backend is idempotent, this allows client-side progression manipulation and double-triggers the `addXP`/`addGold` calls before server validation.

**Fix**: Add a nonce or token to the custom event that only the dispatching component knows, or use a callback ref pattern instead of global DOM events for inter-component communication.

---

### A8: `ThemeContext` used in `NamePlate` but not in `AvatarCompanion` -- inconsistent theme awareness

**Severity**: advisory
**File**: `frontend/src/components/avatar/NamePlate.tsx` (line 12) vs `frontend/src/components/avatar/AvatarCompanion.tsx`

**Issue**: `NamePlate` imports and uses `useTheme()` to determine `isGame` for font styling. But `AvatarCompanion` does not use `useTheme()` at all -- it determines the speech bubble theme directly from `adventureState.enabled`. The architecture specifies that `ThemeContext` should determine bubble style (`game`/`light`/`dark`), and `SpeechBubble` accepts a `theme` prop. But since `SpeechBubble` is never rendered in `AvatarCompanion` (see A4), this inconsistency is currently moot but will surface when A4 is fixed.

**Fix**: When adding SpeechBubble to AvatarCompanion, use `useTheme()` to determine the speech theme: `const speechTheme = isGame ? 'game' : theme === 'dark' ? 'dark' : 'light'` (as done in CedricTooltip.tsx line 30).

---

## Positive Observations

- The reducer pattern in CedricContext is well-structured with clear action types and predictable state transitions.
- The anti-annoyance protocol (frequency decay, cooldowns, session caps) is thoughtfully implemented.
- Backend endpoints use `with_for_update()` for row-level locking on progression updates -- good concurrency handling.
- The migration is clean with proper `server_default` values and a `downgrade()` function.
- Seed data for "The Squire's Trial" quest and emblem are well-integrated into existing seed infrastructure.
- The typing animation hook with skip-on-click is a nice UX touch.
- CSS sprite sheet animations are performant and appropriate for pixel art.
- The `SpeechMessage` priority queue with overflow protection is a solid design.
