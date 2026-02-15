# Epic 1: Avatar Component Foundation

> **Phase**: 1 (Dev-1 starts here)
> **Estimated Stories**: 6
> **Dependencies**: Existing AdventureModeContext, progressionService, MainLayout
> **Architecture References**: Sections 2, 3, 7
> **ADR References**: D-CA-001, D-CA-002, D-CA-003

---

## Story 1.1: Create CedricContext Provider with Core State

**Size**: L

**Description**: Create the `CedricContext` provider that manages all Cedric-specific state: visibility, animation state machine, speech queue, walkthrough progress, and guidance settings. The provider reads from `AdventureModeContext` via `useAdventureMode()` and from `progressionApi` via React Query.

**Acceptance Criteria**:
1. A new `CedricContext` is created with the full `CedricState` and `CedricContextType` interfaces as defined in architecture Section 3.
2. The provider exposes: `enqueueMessage`, `dismissCurrentMessage`, `suppressMessageType`, `triggerAnimation`, `startWalkthrough`, `advanceWalkthrough`, `skipWalkthrough`, `completeWalkthrough`, `minimize`, `restore`, `toggleQuietMode`, `openCharacterSheet`, `closeCharacterSheet`.
3. The provider reads `progression.walkthrough_step`, `progression.walkthrough_completed`, and `user.onboarding_complete` from the existing `progressionApi.getProgression()` query to determine `isNewUser` and walkthrough state.
4. The animation state machine implements the transition rules from architecture Section 3: idle states are interruptible by anything; contextual states are interruptible by reactions; reactions play to completion; major reactions (CelebrateLevelUp, VictoryPose) are never interrupted.
5. The speech queue implements FIFO with priority sorting: `walkthrough > reward > reaction > proactive`.
6. Queue overflow protection: when queue exceeds 3 messages, `proactive` and `reaction` messages are dropped.
7. The provider is placed in the component tree inside `AdventureModeProvider` and `ToastProvider`, wrapping `MatchesProvider` as shown in architecture Section 3.
8. A `useCedric()` hook is exported that throws if used outside the provider.
9. Tests verify: state initialization from progression data, animation state transitions, speech queue ordering, queue overflow, `isNewUser` detection.

**Dev Notes**:
- File: `frontend/src/context/CedricContext.tsx` (new)
- File: `frontend/src/App.tsx` (modify -- wrap `CedricProvider` around `MatchesProvider`)
- Read from `QUERY_KEYS.progression` data for walkthrough fields. The backend does NOT yet have these fields (added in Epic 2). For now, default to `walkthrough_step: 0`, `walkthrough_completed: false` when fields are absent.
- Architecture Section 3 defines the full `CedricState` and `CedricContextType` interfaces.
- D-CA-001: Separate context, not extending AdventureModeContext.

**Dependencies**: None (can start immediately)

---

## Story 1.2: Create AvatarSprite Component with Layered Rendering

**Size**: M

**Description**: Create the `AvatarSprite` component that renders the base character sprite with stacked `<img>` layers for equipment slots. For MVP, equipment layers render nothing (graceful fallback). The component applies `image-rendering: pixelated` and handles size variants (64, 128, 192).

**Acceptance Criteria**:
1. `AvatarSprite` accepts the props interface defined in architecture Section 2: `size`, `equippedItems`, `animationState`, `colorPalette`, `level`, `showPedestal`, `showNameplate`, `className`.
2. The base body sprite renders at the specified `size` with `image-rendering: pixelated`.
3. Equipment layers are rendered as stacked `<img>` elements with `position: absolute` in the z-order defined in architecture Section 2 (banner=0, base=1, boots=2, armor=3, cape=4, hairstyle=5, jewelry=6, emblem=7).
4. Each equipment `<img>` has an `onError` handler that hides the element (graceful fallback for missing assets).
5. The `getEquipmentAssetPath(category, itemName)` utility function generates paths as: `/assets/cedric/equipment/${category}/${slug}.png`.
6. Color palette overlay renders via a `<div>` with `mix-blend-mode: multiply` at z-index 9.
7. The container applies a CSS class based on `animationState` for sprite sheet animations.
8. Size variants render correctly: 64px (1x), 128px (2x), 192px (3x).
9. Tests verify: base sprite renders, equipment layers have correct z-order, onError hides broken images, size variants apply correct dimensions, animation state CSS class applied.

**Dev Notes**:
- File: `frontend/src/components/avatar/AvatarSprite.tsx` (new)
- Architecture Section 2 (`AvatarSprite`) and Section 7 (Asset Architecture).
- D-CA-002: DOM/CSS layers, not Canvas/PixiJS.
- For MVP, create a placeholder base sprite (colored rectangle) at `frontend/public/assets/cedric/sprites/idle.png`. Actual pixel art comes later.
- Equipment rendering from `equipped_items` in `ProgressionState` (already available via `CosmeticBrief`).

**Dependencies**: None (can start in parallel with 1.1)

---

## Story 1.3: Create Pedestal and NamePlate Components

**Size**: S

**Description**: Create the Pedestal component that renders a level-based platform beneath the avatar sprite, and the NamePlate component that shows "Cedric" + title + level below the pedestal.

**Acceptance Criteria**:
1. `Pedestal` component renders a pedestal image from `/assets/cedric/pedestals/pedestal-level-{n}.png` based on the user's level: level 1-2 uses `pedestal-level-1`, level 3-4 uses `pedestal-level-3`, level 5-6 uses `pedestal-level-5`, level 7-8 uses `pedestal-level-7`, level 9+ uses `pedestal-level-9`.
2. Pedestal renders at the bottom of the avatar container, sized to match the sprite width (128px wide at default size).
3. `NamePlate` renders below the pedestal with: "Cedric the {title}" and "Lv. {level}".
4. In adventure mode, uses `Cinzel` font. In normal mode, uses system sans-serif.
5. NamePlate text color matches the current theme (dark brown for game, appropriate colors for light/dark).
6. Both components accept a `size` prop to scale proportionally with the avatar.
7. Tests verify: correct pedestal image for each level range, nameplate text content, font switching by theme.

**Dev Notes**:
- File: `frontend/src/components/avatar/Pedestal.tsx` (new)
- File: `frontend/src/components/avatar/NamePlate.tsx` (new)
- For MVP, create CSS-only placeholder pedestals (colored rectangles with borders). Actual pixel art assets come later.
- The title comes from `AdventureModeContext.state.title`.

**Dependencies**: None

---

## Story 1.4: Create AvatarCompanion Root Component

**Size**: M

**Description**: Create the `AvatarCompanion` root component that manages the fixed-position container, renders `AvatarSprite`, and handles visibility states (full, minimized, hidden). Integrate into `MainLayout`.

**Acceptance Criteria**:
1. `AvatarCompanion` renders as a fixed-position container at `z-index: 35`, positioned bottom-right with 24px margin from edges.
2. Three visibility states work correctly:
   - `full`: Shows full avatar (160x180px container) with sprite, pedestal, and nameplate.
   - `minimized`: Shows 32x32px circular icon (just the character head or compass icon for non-adventure mode).
   - `hidden`: Renders nothing.
3. The component renders nothing when `adventureMode.enabled === false` AND `cedric.isNewUser === false` (no companion for existing non-adventure users).
4. For non-adventure new users, renders the modern guide variant (compass icon at 32x32).
5. Entrance/exit animations use Framer Motion `AnimatePresence` (slide up from bottom for entrance, slide down for exit).
6. Clicking the minimized icon restores to full mode with a pop-up spring animation.
7. `AvatarCompanion` is rendered inside `MainLayout` (after the `<Outlet>`).
8. Tests verify: visibility states, fixed positioning, adventure mode gating, entrance/exit animations, click-to-restore.

**Dev Notes**:
- File: `frontend/src/components/avatar/AvatarCompanion.tsx` (new)
- File: `frontend/src/components/layout/MainLayout.tsx` (modify -- add `<AvatarCompanion />` after `<NotificationToasts />`)
- Reads all state from `useCedric()` and `useAdventureMode()`.
- Architecture Section 2 defines sizing: full=160x180, minimized=32x32, store=192x192, loading=192x192.
- For the `/store` route, automatically use 192px sprite (detect via `useLocation`).

**Dependencies**: Story 1.1 (CedricContext), Story 1.2 (AvatarSprite), Story 1.3 (Pedestal/NamePlate)

---

## Story 1.5: Create Placeholder Sprite Assets

**Size**: S

**Description**: Create minimal CSS-only placeholder sprites for the MVP avatar. These are temporary colored shapes that allow component development to proceed before pixel art assets are created.

**Acceptance Criteria**:
1. A base "idle" placeholder exists at `frontend/public/assets/cedric/sprites/idle.png` -- a simple 256x64 horizontal strip (4 frames of a colored knight silhouette shape).
2. A "pointing" placeholder exists at `frontend/public/assets/cedric/sprites/pointing.png` -- a single 64x64 frame.
3. A "waveHello" placeholder exists at `frontend/public/assets/cedric/sprites/waveHello.png` -- a 256x64 strip (4 frames).
4. A compass icon exists at `frontend/public/assets/cedric/modern/compass-icon.png` -- a 32x32 simple compass shape.
5. Five pedestal placeholders exist at `frontend/public/assets/cedric/pedestals/pedestal-level-{1,3,5,7,9}.png` -- each 128x32 with increasing detail/color.
6. All sprites use `image-rendering: pixelated` and render crisply at 2x and 3x scale.
7. CSS animation keyframes for `cedric-idle` are defined (4-frame breathing at 2s cycle).
8. Tests verify: all placeholder files load without 404, idle animation CSS works.

**Dev Notes**:
- Directory: `frontend/public/assets/cedric/` (new structure per architecture Section 7)
- File: `frontend/src/components/avatar/cedricAnimations.css` (new -- CSS sprite sheet keyframes)
- These can be simple programmatically-generated PNGs or hand-drawn basic shapes. The point is to unblock component development.
- Architecture Section 7 defines the full asset directory structure. Only create the minimum needed for Epic 1.

**Dependencies**: None (can start in parallel)

---

## Story 1.6: Barrel Export and Integration Test

**Size**: S

**Description**: Create the barrel export for the avatar component directory and write an integration test that verifies the full component tree renders correctly with CedricContext.

**Acceptance Criteria**:
1. `frontend/src/components/avatar/index.ts` exports: `AvatarCompanion`, `AvatarSprite`, `SpeechBubble` (placeholder), `useCedric` (re-export from context).
2. An integration test renders `<CedricProvider><AvatarCompanion /></CedricProvider>` within a mock `AdventureModeProvider` and verifies:
   - Avatar is visible when adventure mode is enabled.
   - Avatar is hidden when adventure mode is disabled and user is not new.
   - Avatar shows modern variant when user is new but adventure mode is off.
3. The `CedricProvider` integration with `App.tsx` component tree is verified: provider wraps the correct children as specified in architecture Section 3.
4. No console errors or warnings in test output.
5. Tests verify: component tree renders without errors, visibility gating works, context is accessible.

**Dev Notes**:
- File: `frontend/src/components/avatar/index.ts` (new)
- File: `frontend/src/components/avatar/AvatarCompanion.integration.test.tsx` (new)
- Uses React Testing Library with mock providers.
- SpeechBubble export is a placeholder (empty component) until Epic 3.

**Dependencies**: Stories 1.1-1.4

---

## Story Dependency Graph (Epic 1)

```
1.1 CedricContext     1.2 AvatarSprite     1.3 Pedestal/NamePlate     1.5 Placeholder Assets
     \                     |                    /
      \                    |                   /
       v                   v                  v
              1.4 AvatarCompanion (root)
                        |
                        v
              1.6 Barrel Export & Integration Test
```

Stories 1.1, 1.2, 1.3, and 1.5 can all start in parallel.
Story 1.4 depends on 1.1, 1.2, and 1.3.
Story 1.6 depends on 1.4.
