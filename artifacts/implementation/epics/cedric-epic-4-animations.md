# Epic 4: Idle Animations & Reactions

> **Phase**: 2 (Dev-2, after Epic 3)
> **Estimated Stories**: 5
> **Dependencies**: Epic 1 (AvatarSprite), Epic 3 (SpeechBubble), CedricContext
> **Architecture References**: Sections 6, 3 (Animation State Machine)
> **ADR References**: D-CA-003

---

## Story 4.1: Implement CSS Sprite Sheet Idle Animations

**Size**: M

**Description**: Create CSS sprite sheet animations for the idle state progression: idle (breathing), lookAround, sitting, and sleeping. Each animation uses horizontal sprite strips at 64x64 per frame, animated with CSS `steps()`.

**Acceptance Criteria**:
1. CSS keyframes defined for each idle animation:
   - `cedric-idle`: 4 frames, 2s cycle, `steps(4)`, infinite loop.
   - `cedric-lookAround`: 3 frames, 2s duration, `steps(3)`, plays once.
   - `cedric-sitting`: 2 frames, 4s cycle, `steps(2)`, infinite loop.
   - `cedric-sleeping`: 2 frames, 4s cycle, `steps(2)`, infinite loop.
   - `cedric-wakeUp`: 3 frames, 1s duration, `steps(3)`, plays once.
2. CSS classes `.cedric-sprite--{state}` apply the correct background image and animation.
3. The `.cedric-sprite` base class sets `width: 64px`, `height: 64px`, `image-rendering: pixelated`.
4. Sprite sheets are loaded from `/assets/cedric/sprites/{state}.png`.
5. When the animation state changes on `AvatarSprite`, the CSS class swaps cleanly (no flash or jump).
6. Placeholder sprite sheets exist for all 5 idle states (can be colored rectangles with frame markers).
7. Tests verify: correct CSS class applied per animation state, keyframe definitions match frame counts, sprite sheet paths resolve.

**Dev Notes**:
- File: `frontend/src/components/avatar/cedricAnimations.css` (new or modify from Epic 1 Story 1.5)
- File: `frontend/src/components/avatar/AvatarSprite.tsx` (modify -- apply CSS classes based on `animationState`)
- Architecture Section 6 defines the exact CSS for each animation.
- D-CA-003: CSS sprite sheets for frame-based animation.
- The sprite size scales with the `size` prop: at 128px, the background-size doubles; at 192px, triples.

**Dependencies**: Epic 1 Story 1.2 (AvatarSprite), Story 1.5 (placeholder assets)

---

## Story 4.2: Implement Inactivity Timer and State Progression

**Size**: M

**Description**: Implement the inactivity timer hook that drives idle state progression: Idle -> Sitting (30s) -> Sleeping (2min). Mouse/keyboard activity resets the timer and triggers WakeUp from sleeping.

**Acceptance Criteria**:
1. A `useInactivityTimer` hook (or logic within CedricProvider) manages the inactivity state machine.
2. After 30 seconds of no user activity (mousemove, keydown), Cedric transitions from Idle to Sitting.
3. After 90 more seconds of no activity (total 2 minutes), Cedric transitions from Sitting to Sleeping.
4. On any user activity while in Sleeping state, Cedric plays WakeUp animation (1s) then returns to Idle.
5. Activity detection uses passive event listeners on `window` for `mousemove` and `keydown`.
6. WakeUp has a 0.3s debounce to prevent rapid wake/sleep cycling.
7. LookAround fires randomly every 15-20 seconds during the Idle state (random interval via `Math.random() * 5000 + 15000`).
8. Event listeners are properly cleaned up on component unmount.
9. Tests verify: timer transitions at correct intervals, activity resets timer, WakeUp triggers on activity from sleeping, debounce prevents rapid cycling, cleanup on unmount.

**Dev Notes**:
- File: `frontend/src/context/CedricContext.tsx` (modify -- add inactivity timer logic)
- Architecture Section 6 (Inactivity Timer) has the exact implementation pattern.
- Use `window.addEventListener('mousemove', handler, { passive: true })` for performance.
- The timer runs only when visibility is `full` (not minimized or hidden).

**Dependencies**: Story 1.1 (CedricContext)

---

## Story 4.3: Implement Framer Motion Reaction Animations

**Size**: L

**Description**: Implement the 7 reaction animations using Framer Motion for positional/scale transforms combined with CSS sprite swaps: JumpXP, CelebrateLevelUp, CatchCoin, HoldTrophy, VictoryPose, SpinNewItem, WaveHello.

**Acceptance Criteria**:
1. Each reaction animation is defined as a Framer Motion variants object:
   - `JumpXP`: y: [0, -6, 0], duration 0.5s, spring stiffness 300.
   - `CelebrateLevelUp`: y: [0, -16, 0], scale: [1, 1.1, 1], duration 1.5s, spring.
   - `CatchCoin`: Coin element falls from y: -40 to 0, opacity fade-in, duration 0.6s.
   - `HoldTrophy`: Scale: [1, 1.05, 1], duration 1.2s.
   - `VictoryPose`: y: [0, -8, 0], scale: [1, 1.08, 1], duration 1s.
   - `SpinNewItem`: rotateY: [0, 360], duration 0.8s.
   - `WaveHello`: rotate: [0, -10, 10, -10, 0] (hand wave), duration 1s.
2. Reaction animations play to completion before returning to Idle (no interruption by lower-priority states).
3. CelebrateLevelUp and VictoryPose are never interrupted (highest priority, always play full).
4. The sprite CSS class swaps to the reaction-specific sprite during the animation.
5. Floating text overlays ("+50 XP", "+200 Gold") drift upward and fade during JumpXP and CatchCoin.
6. CelebrateLevelUp includes a confetti burst (8 particles, gold/blue, using Framer Motion animated divs).
7. Tests verify: each animation has correct motion values, reactions play to completion, floating text appears, confetti renders for level-up.

**Dev Notes**:
- File: `frontend/src/components/avatar/cedricAnimations.ts` (new -- Framer Motion variant definitions)
- File: `frontend/src/components/avatar/AvatarSprite.tsx` (modify -- apply Framer Motion `motion.div` wrapper)
- File: `frontend/src/components/avatar/FloatingText.tsx` (new -- animated "+XP" / "+Gold" text)
- File: `frontend/src/components/avatar/ConfettiEffect.tsx` (new -- particle burst for celebrations)
- Architecture Section 6 defines all animation variants and their motion values.
- D-CA-003: Framer Motion for positional/scale transforms.

**Dependencies**: Story 4.1 (CSS sprite sheets), Story 1.2 (AvatarSprite)

---

## Story 4.4: Implement Animation Queue with Collapse Rules

**Size**: M

**Description**: Implement the animation queue system in CedricContext that manages rapid-fire game events. The queue processes animations FIFO with collapse rules for repeated minor animations.

**Acceptance Criteria**:
1. `AnimationQueueEntry` interface with: `animation`, `duration`, `onStart` callback.
2. Entries are processed FIFO: each animation plays for its `duration` before the next begins.
3. Queue collapse rule: if queue exceeds 3 entries, intermediate `JumpXP` and `CatchCoin` entries are collapsed into a single combined animation showing the total (e.g., "+150 XP" instead of three "+50 XP").
4. `CelebrateLevelUp` and `HoldTrophy` entries are never collapsed.
5. `triggerAnimation(animation, duration)` in CedricContext adds entries to the queue.
6. The queue drains automatically: when the current animation completes, the next starts.
7. If no entries remain, the avatar returns to Idle state.
8. Tests verify: FIFO processing, collapse of minor animations, preservation of major animations, queue drain to idle, combined total display.

**Dev Notes**:
- File: `frontend/src/context/CedricContext.tsx` (modify -- implement animation queue processing)
- Architecture Section 6 (Animation Queue) defines the queue rules.
- The `onStart` callback is used for side effects like showing floating text.
- Use `useEffect` with the queue as a dependency to process entries.

**Dependencies**: Story 4.3 (reaction animations defined)

---

## Story 4.5: Integrate Reactions with AdventureModeContext Events

**Size**: M

**Description**: Connect Cedric's reaction animations to actual game events from `AdventureModeContext`: XP gains trigger JumpXP, level-ups trigger CelebrateLevelUp, gold gains trigger CatchCoin, achievements trigger HoldTrophy, quest completions trigger VictoryPose.

**Acceptance Criteria**:
1. When `adventureState.recentXPGain` changes from null to a number, Cedric plays JumpXP with floating "+{amount} XP" text.
2. When `adventureState.levelUpPending` becomes true, Cedric plays CelebrateLevelUp with confetti.
3. When `adventureState.recentGoldGain` changes from null to a number, Cedric plays CatchCoin with floating "+{amount} Gold" text.
4. When `adventureState.recentAchievement` becomes non-null, Cedric plays HoldTrophy.
5. When `adventureState.recentQuestComplete` becomes non-null, Cedric plays VictoryPose.
6. On first login of the day (after `recordLogin` mutation), Cedric plays WaveHello.
7. Reactions are suppressed when the walkthrough is active (walkthrough has its own animation control).
8. Reactions are suppressed in quiet mode (animation plays but no speech bubble).
9. Tests verify: each event type triggers correct animation, suppression during walkthrough, quiet mode behavior.

**Dev Notes**:
- File: `frontend/src/context/CedricContext.tsx` (modify -- add `useEffect` watchers for AdventureModeContext notification state)
- The existing `AdventureModeContext` already tracks `recentXPGain`, `recentGoldGain`, `recentAchievement`, `levelUpPending`, `recentQuestComplete` in state. Watch these with useEffect.
- Clear the notification states after triggering the reaction (call `clearRecentXP()`, etc.).
- Architecture Section 3 (Animation State Machine) defines the event-to-animation mapping.

**Dependencies**: Story 4.4 (animation queue), Epic 1 Story 1.1 (CedricContext reads AdventureModeContext)

---

## Story Dependency Graph (Epic 4)

```
4.1 CSS Sprite Sheets     4.2 Inactivity Timer
        |                       |
        v                       v
4.3 Framer Motion Reactions (depends on 4.1)
        |
        v
4.4 Animation Queue
        |
        v
4.5 Event Integration (depends on 4.4)
```

Stories 4.1 and 4.2 can start in parallel.
Story 4.3 depends on 4.1.
Story 4.4 depends on 4.3.
Story 4.5 depends on 4.4.
