# Epic 5: Roadmap Assistant / Loading Narrator

> **Phase**: 2 (Dev-1, after Epic 2)
> **Estimated Stories**: 5
> **Dependencies**: Epic 1 (AvatarSprite), Epic 3 (SpeechBubble), Epic 4 (Animations)
> **Architecture References**: Section 9
> **ADR References**: D-CA-003

---

## Story 5.1: Create useCedricNarrator Hook

**Size**: M

**Description**: Create the `useCedricNarrator` hook that monitors React Query loading states, tracks elapsed time, determines the current narration phase, calculates estimated progress, and cycles tips.

**Acceptance Criteria**:
1. `useCedricNarrator` accepts a `NarratorConfig` with: `phases` (array of `NarratorPhase`), `queryKey` (React Query key to monitor), `onComplete` callback.
2. The hook returns: `isLoading`, `currentPhase`, `progress` (0-100), `elapsedTime`, `tip`.
3. `isLoading` reflects the React Query loading state for the given `queryKey`.
4. `elapsedTime` tracks milliseconds since loading began (using `useRef` + `setInterval` at 100ms).
5. `currentPhase` is the phase whose `minTime <= elapsedTime < maxTime`.
6. `progress` is calculated as a percentage based on the current phase's position within the total phase timeline (e.g., phase 1 = 0-15%, phase 2 = 15-35%, etc.).
7. `tip` cycles between available tips in the current phase, changing every 12 seconds.
8. When loading completes, `onComplete` fires and the hook resets.
9. Tests verify: phase transitions at correct times, progress calculation, tip cycling, reset on completion.

**Dev Notes**:
- File: `frontend/src/components/avatar/useCedricNarrator.ts` (new)
- Architecture Section 9 defines the `NarratorConfig`, `NarratorPhase` interfaces and the hook signature.
- Monitor loading state via `useIsFetching({ queryKey })` from @tanstack/react-query.
- Progress holds at 99% until actual completion, then jumps to 100%.

**Dependencies**: None (hook is standalone)

---

## Story 5.2: Define Oracle Sequence Phase Configuration

**Size**: S

**Description**: Define the 5-phase Oracle Sequence narration configuration for roadmap generation, and a generic loading configuration for shorter API calls.

**Acceptance Criteria**:
1. `ORACLE_PHASES` array is defined with 5 phases matching architecture Section 9:
   - Phase 1 (0-15s): Reading, "Consulting ancient tomes...", tip about XP from milestones.
   - Phase 2 (15-30s): Thinking, "Studying your skills...", tip about roadmap value.
   - Phase 3 (30-60s): TracingLines, "Mapping your path..."
   - Phase 4 (60-90s): LookingUp, "Stars are aligning..."
   - Phase 5 (90s+): Excited, "Any moment now..."
2. Each phase has both medieval and modern text variants.
3. `GENERIC_LOADING_PHASES` array with a single phase: Thinking, "One moment..." / "Loading...".
4. A match loading config: LookingFar, "The scouts are searching...".
5. A resume parsing config: Reading, "The Guild Master deciphers...".
6. Each config has appropriate avatar states per architecture Section 9.
7. Tests verify: all phases have valid time ranges, no gaps between phases, both text variants exist.

**Dev Notes**:
- File: `frontend/src/components/avatar/cedricNarratorConfig.ts` (new)
- Architecture Section 9 has the complete Oracle Sequence phases.
- Concept document Section 3 has additional loading state configurations.
- The generic config is used for loads under 10 seconds.

**Dependencies**: None (can start in parallel)

---

## Story 5.3: Create AvatarLoadingStage Component

**Size**: M

**Description**: Create the `AvatarLoadingStage` component that renders a 192x192 enlarged avatar centered on the page, with a speech bubble above, a progress bar below, and optional cycling tips.

**Acceptance Criteria**:
1. `AvatarLoadingStage` renders: SpeechBubble (above, with phase dialogue), AvatarSprite at size 192, progress bar (styled per architecture Section 9), tip text below progress bar.
2. The progress bar uses an amber/gold gradient (`from-amber-700 via-yellow-500 to-amber-700`) with Framer Motion `animate` for smooth width transitions.
3. Progress percentage displays centered below the bar.
4. The tip text fades in/out when cycling (crossfade animation).
5. The component integrates with `useCedricNarrator` -- it receives `currentPhase`, `progress`, and `tip` as props.
6. The speech bubble uses `position="above"` and does not auto-dismiss (duration=0).
7. The component is centered in its parent container with `flex flex-col items-center`.
8. Tests verify: all sub-components render, progress bar width matches progress value, tip text cycles, speech bubble shows phase dialogue.

**Dev Notes**:
- File: `frontend/src/components/avatar/AvatarLoadingStage.tsx` (new)
- Architecture Section 9 (Integration Pattern) has the exact JSX structure.
- The progress bar is purely visual (estimated, not connected to actual API progress).
- Avatar uses equipped items from `useAdventureMode()` context.

**Dependencies**: Story 5.1 (useCedricNarrator), Epic 1 Story 1.2 (AvatarSprite), Epic 3 Story 3.1 (SpeechBubble)

---

## Story 5.4: Implement Completion Animation Sequence

**Size**: M

**Description**: Implement the loading completion animation that transitions from the loading stage to the loaded content: avatar switches to Excited, confetti burst, completion speech bubble, fade-out of loading area, avatar returns to normal position.

**Acceptance Criteria**:
1. When loading completes, the avatar switches to `Excited` animation state.
2. A confetti burst of 8 particles (gold and blue) fires around the avatar using Framer Motion.
3. A completion speech bubble appears: "Behold! Your path has been charted..." (roadmap) or "The scouts have returned!" (matches).
4. After 1 second, the loading area fades out (`opacity: 1 -> 0`, 500ms) and the results fade in (`opacity: 0 -> 1`, 500ms).
5. The avatar returns to its normal size (128px) in the fixed bottom-right position.
6. For loads under 2 seconds, no speech bubble is shown -- only a brief avatar state change.
7. For loads between 2-5 seconds, the speech bubble appears immediately.
8. For loads over 5 seconds, the speech bubble appeared during loading (already handled by narrator).
9. Tests verify: completion animation sequence, confetti rendering, fade transition timing, short-load suppression.

**Dev Notes**:
- File: `frontend/src/components/avatar/AvatarLoadingStage.tsx` (modify -- add completion state handling)
- Reuse `ConfettiEffect` from Epic 4 Story 4.3 if available, otherwise create a simpler version.
- Architecture Section 9 (Completion Animation) and the short loading optimization rules.

**Dependencies**: Story 5.3 (AvatarLoadingStage)

---

## Story 5.5: Integrate Narrator with Existing Pages

**Size**: M

**Description**: Integrate the `useCedricNarrator` hook and `AvatarLoadingStage` component with the existing RoadmapPage loading state and other pages with significant loading times (MatchResultsPage).

**Acceptance Criteria**:
1. `RoadmapPage`: When roadmap generation is loading, `AvatarLoadingStage` replaces the existing loading spinner. Uses the Oracle Sequence phases.
2. `MatchResultsPage`: When match results are loading (initial load after resume upload), a brief narrator plays. Uses the generic loading config.
3. Error state handling: When an API call fails, the avatar shows `Confused` state with a speech bubble: "Something went awry..." and a "Try Again" action button.
4. The existing loading UI (spinners, pulse animations) is hidden when Cedric's narrator is active.
5. On pages where Cedric's narrator is NOT active (or when adventure mode is off and user is not new), the existing loading UI remains unchanged.
6. The narrator only activates when `CedricContext` visibility is `full` (not when minimized or hidden).
7. Tests verify: narrator replaces loading on RoadmapPage, generic narrator on MatchResultsPage, error state renders correctly, existing loading preserved when narrator inactive.

**Dev Notes**:
- File: `frontend/src/pages/RoadmapPage.tsx` (modify -- wrap loading state with AvatarLoadingStage)
- File: `frontend/src/components/matches/MatchResultsPage.tsx` (modify -- add generic narrator)
- File: `frontend/src/components/avatar/AvatarLoadingStage.tsx` (modify -- add error state variant)
- Architecture Section 9 defines the integration pattern for RoadmapPage.
- Use the existing React Query loading states -- do NOT modify the underlying data fetching.
- The narrator reads `queryKey` from the existing React Query setup on each page.

**Dependencies**: Stories 5.2, 5.3, 5.4

---

## Story Dependency Graph (Epic 5)

```
5.1 useCedricNarrator Hook     5.2 Phase Configurations
        |                           |
        v                           v
             5.3 AvatarLoadingStage
                    |
                    v
             5.4 Completion Animation
                    |
                    v
             5.5 Page Integration
```

Stories 5.1 and 5.2 can start in parallel.
Story 5.3 depends on 5.1 and 5.2.
Story 5.4 depends on 5.3.
Story 5.5 depends on 5.4.
