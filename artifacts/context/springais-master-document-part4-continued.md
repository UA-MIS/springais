## 16. Epics & Stories -- Cedric Avatar Companion System

This section contains the full content of all 8 Cedric avatar companion epics defining the interactive guide character, followed by the sprint status tracking.

---

### 16.1 Cedric Epic 1: Avatar Component Foundation

> **Phase**: 1 (Dev-1 starts here)
> **Estimated Stories**: 6
> **Dependencies**: Existing AdventureModeContext, progressionService, MainLayout
> **Architecture References**: Sections 2, 3, 7
> **ADR References**: D-CA-001, D-CA-002, D-CA-003

---

#### Story 1.1: Create CedricContext Provider with Core State

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

#### Story 1.2: Create AvatarSprite Component with Layered Rendering

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

#### Story 1.3: Create Pedestal and NamePlate Components

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

#### Story 1.4: Create AvatarCompanion Root Component

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

#### Story 1.5: Create Placeholder Sprite Assets

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

#### Story 1.6: Barrel Export and Integration Test

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

#### Story Dependency Graph (Cedric Epic 1)

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

---

### 16.2 Cedric Epic 2: Onboarding Walkthrough Quest

> **Phase**: 1 (Dev-1, after Epic 1)
> **Estimated Stories**: 7
> **Dependencies**: Epic 1 (Avatar Foundation), Epic 3 (SpeechBubble -- partial, Story 3.1 needed)
> **Architecture References**: Sections 4, 8, 11
> **ADR References**: D-CA-005, D-CA-006

---

#### Story 2.1: Install react-joyride and Create WalkthroughOverlay Component

**Size**: M

**Description**: Install `react-joyride` as a dependency and create the `WalkthroughOverlay` component that wraps Joyride in controlled mode. Create the `CedricTooltip` custom tooltip component that renders the avatar sprite + speech bubble as the Joyride tooltip.

**Acceptance Criteria**:
1. `react-joyride` (^2.9) is installed as a project dependency.
2. `WalkthroughOverlay` component accepts props: `isActive`, `currentStep`, `onStepComplete`, `onComplete`, `onSkip` as defined in architecture Section 2.
3. Joyride runs in controlled mode with `run={isActive}`, `stepIndex={currentStep}`, `continuous={false}`.
4. The `tooltipComponent` prop renders `CedricTooltip` which contains: step progress indicator (`Step [N/7]`), a "Skip Tutorial" button, the speech bubble with walkthrough text, and the avatar sprite in pointing animation.
5. Joyride styles set `zIndex: 45` (above HUD at 40, below modals at 50), transparent arrow, overlay at `rgba(0, 0, 0, 0.6)`.
6. `spotlightClicks` is enabled so users can interact with spotlighted elements.
7. `disableOverlayClose` and `disableCloseOnEsc` are both true.
8. Tests verify: Joyride renders with custom tooltip, step progress shows correct numbers, skip button is visible, overlay renders.

**Dev Notes**:
- File: `frontend/src/components/avatar/WalkthroughOverlay.tsx` (new)
- File: `frontend/src/components/avatar/CedricTooltip.tsx` (new)
- Run: `npm install react-joyride` in `frontend/` directory
- Architecture Section 4 defines the exact Joyride configuration and tooltip component.
- D-CA-006: React Joyride selected as walkthrough engine.
- The tooltip renders `AvatarSprite` at size 128 with `AnimationState.Pointing` (or step-specific state from `step.data.avatarState`).

**Dependencies**: Epic 1 (AvatarSprite, SpeechBubble placeholder), Epic 3 Story 3.1 (SpeechBubble component)

---

#### Story 2.2: Define Walkthrough Step Definitions and Dialogue

**Size**: M

**Description**: Create the 7 walkthrough step definitions with target selectors, Cedric dialogue text (medieval + modern variants), avatar animation states, reward amounts, and completion detection types. Add `data-tour` attributes to existing components.

**Acceptance Criteria**:
1. `WALKTHROUGH_STEPS` array is defined with 7 steps matching architecture Section 4:
   - Step 0: "Forge Your Identity" -- target `[data-tour="nav-profile"]`, completionDetection `action` (resume upload)
   - Step 1: "Survey the Quest Board" -- target `[data-tour="nav-matches"]`, completionDetection `timer` (5s)
   - Step 2: "Mark Your First Quest" -- target `[data-tour="save-role-button"]`, completionDetection `action` (save role)
   - Step 3: "Chart Your Course" -- target `[data-tour="nav-roadmap"]`, completionDetection `action` (roadmap generated)
   - Step 4: "Visit the Merchant's Armory" -- target `[data-tour="nav-store"]`, completionDetection `navigation`
   - Step 5: "Don Your Gear" -- target `[data-tour="inventory-tab"]`, completionDetection `action` (equip)
   - Step 6: "Return to the Quest Board" -- target `body`, completionDetection `timer` (5s)
2. Each step has both medieval and modern dialogue text variants in `cedricMessages.ts`.
3. `data-tour` attributes are added to: Sidebar nav items (`nav-profile`, `nav-matches`, `nav-roadmap`, `nav-store`), save role button (`save-role-button`), inventory tab (`inventory-tab`).
4. The `WalkthroughStepData` interface is defined per architecture Section 4 with: `avatarState`, `rewardXP`, `rewardGold`, `completionDetection`, `targetRoute`, `completionRoute`, `completionSelector`, `completionTimer`.
5. Tests verify: all 7 steps have valid targets, dialogue text exists for both variants, data-tour attributes are present on relevant components.

**Dev Notes**:
- File: `frontend/src/components/avatar/cedricMessages.ts` (new)
- File: `frontend/src/components/avatar/walkthroughSteps.ts` (new)
- File: `frontend/src/components/layout/Sidebar.tsx` (modify -- add `data-tour` attributes to nav links)
- File: `frontend/src/components/matches/MatchResultsPage.tsx` (modify -- add `data-tour="save-role-button"` to save buttons)
- File: `frontend/src/pages/StorePage.tsx` (modify -- add `data-tour="inventory-tab"` to inventory tab)
- Architecture Section 4 has the complete step definitions with all field values.

**Dependencies**: Story 2.1

---

#### Story 2.3: Implement First-Time User Detection and Adventure Mode Prompt

**Size**: M

**Description**: Implement the new user detection logic in `CedricProvider` and the "Enable Adventure Mode" intro prompt that appears 1.5 seconds after a new user's first page load.

**Acceptance Criteria**:
1. `CedricProvider` detects new users via: `isNewUser = !progression?.onboarding_complete && !progression?.walkthrough_completed`.
2. For new users, after a 1.5-second delay, Cedric's intro message is enqueued with:
   - Text: "Hail, traveler! I see you have just arrived at the realm of SpringAIS..." (medieval) / "Welcome! I see you're new to SpringAIS..." (modern)
   - Priority: `walkthrough`
   - Two action buttons: "Enable Adventure Mode!" (primary, calls `enableAdventureMode()` + `startWalkthrough()`) and "Maybe Later" (ghost).
   - Duration: 0 (no auto-dismiss)
   - Dismissible: false
3. Clicking "Maybe Later" shows a follow-up message: "No worries! Want a quick tour without the medieval flair?" with buttons "Sure, show me around!" and "I'll explore on my own".
4. "Sure, show me around!" starts the walkthrough with modern language (adventure mode stays off).
5. "I'll explore on my own" minimizes Cedric and calls `POST /progression/complete-onboarding` to mark onboarding as dismissed.
6. Cedric entrance animation plays: slide up from bottom with Framer Motion spring (`y: 200 -> 0`, stiffness 120, damping 14).
7. Tests verify: new user detection, 1.5s delay, prompt message content, button actions, "Maybe Later" follow-up flow, entrance animation.

**Dev Notes**:
- File: `frontend/src/context/CedricContext.tsx` (modify -- add `useEffect` for new user detection per architecture Section 4)
- The `onboarding_complete` field already exists on `UserProfile` (set to `False` on registration, currently unused).
- `walkthrough_completed` is a new field (added in Story 2.5). Until the backend migration is done, treat missing field as `false`.
- Architecture Section 4 and Section 8 define the complete first-time user flow.

**Dependencies**: Story 1.1 (CedricContext), Story 1.4 (AvatarCompanion)

---

#### Story 2.4: Implement Walkthrough Step Completion Detection and Rewards

**Size**: L

**Description**: Implement the step completion detection system that listens for user actions (route changes, API success callbacks, timers) and dispatches step rewards via the existing gamification system.

**Acceptance Criteria**:
1. Each walkthrough step uses its specific detection mechanism:
   - `navigation`: Step completes when route changes to `completionRoute`.
   - `action`: Step completes when a specific event fires (resume upload success, role save, roadmap generated, item equipped).
   - `timer`: Step auto-completes after `completionTimer` milliseconds.
   - `element-click`: Step completes when `completionSelector` element is clicked.
2. On step completion, the Joyride `callback` handler:
   - Dispatches XP reward via `addXP(stepData.rewardXP, 'walkthrough')`.
   - Dispatches Gold reward via `addGold(stepData.rewardGold, 'walkthrough')`.
   - Calls `POST /progression/walkthrough-step` with the step index (persists to backend).
   - Advances the walkthrough to the next step.
3. Cedric plays a reaction animation (JumpXP) after each step completion.
4. The existing `NotificationToasts` system shows XP/Gold gain notifications.
5. If the user navigates away during a step, the walkthrough pauses and resumes when they return.
6. Step 3 (Roadmap): Special handling -- walkthrough pauses during roadmap generation and resumes on completion.
7. Step 4 (Store): Triggers a one-time "Leather Boots" gift (handled by backend reward hook).
8. Tests verify: each detection type works, rewards dispatch correctly, backend step persisted, walkthrough advancement, pause/resume on navigation.

**Dev Notes**:
- File: `frontend/src/context/CedricContext.tsx` (modify -- add step completion detection in walkthrough effects)
- File: `frontend/src/components/avatar/WalkthroughOverlay.tsx` (modify -- implement `handleJoyrideCallback`)
- File: `frontend/src/services/progressionService.ts` (modify -- add `completeWalkthroughStep` API call)
- Architecture Section 4 (`handleJoyrideCallback`) and Section 8 (step completion detection table).
- For `action` detection, listen to React Query mutation success callbacks or use a custom event system within CedricContext.
- The backend endpoint `POST /progression/walkthrough-step` is created in Story 2.5.

**Dependencies**: Stories 2.1, 2.2, 2.3

---

#### Story 2.5: Backend -- Walkthrough Fields, Migration, and Endpoints

**Size**: M

**Description**: Add `walkthrough_step` and `walkthrough_completed` fields to the `UserProgression` model, create the Alembic migration, and implement the two new API endpoints: `POST /progression/walkthrough-step` and `POST /progression/complete-onboarding`.

**Acceptance Criteria**:
1. Alembic migration `031_add_walkthrough_fields.py` adds:
   - `walkthrough_step` (Integer, NOT NULL, default 0) to `user_progression` table.
   - `walkthrough_completed` (Boolean, NOT NULL, default False) to `user_progression` table.
2. `UserProgression` model in `backend/app/models/progression.py` is updated with the two new fields.
3. `POST /api/progression/walkthrough-step` endpoint:
   - Accepts `{ step: int }` request body.
   - Returns early if `step <= prog.walkthrough_step` (idempotent, returns `already_completed: true`).
   - Updates `prog.walkthrough_step = step`.
   - Dispatches reward via `reward_hook_service.process_action()` with event_type `walkthrough_step`.
   - Returns `{ step, already_completed, reward: { xp_awarded, coins_awarded } }`.
4. `POST /api/progression/complete-onboarding` endpoint:
   - Sets `user_profiles.onboarding_complete = True`.
   - Sets `user_progression.walkthrough_completed = True`, `walkthrough_step = 7`.
   - Completes "The Squire's Trial" quest via `quest_service` (if quest exists).
   - Awards "Squire's Trial Emblem" cosmetic to user inventory (if cosmetic exists).
   - Returns `{ onboarding_complete, walkthrough_completed }`.
5. `GET /api/progression` response is updated to include `walkthrough_step`, `walkthrough_completed`, and `onboarding_complete` fields.
6. `reward_hook_service.REWARD_CONFIG` includes `"walkthrough_step": RewardConfig(xp=50, coins=25)`.
7. Tests verify: migration applies/downgrades cleanly, walkthrough-step endpoint is idempotent, complete-onboarding sets all flags, progression response includes new fields.

**Dev Notes**:
- File: `backend/alembic/versions/031_add_walkthrough_fields.py` (new)
- File: `backend/app/models/progression.py` (modify -- add fields)
- File: `backend/app/routes/progression.py` (modify -- add two endpoints)
- File: `backend/app/schemas/progression.py` (modify -- add fields to request/response schemas)
- File: `backend/app/services/progression_service.py` (modify -- update `get_progression` to include new fields)
- File: `backend/app/services/reward_hook_service.py` (modify -- add `walkthrough_step` to REWARD_CONFIG)
- File: `frontend/src/services/progressionService.ts` (modify -- add `walkthrough_step`, `walkthrough_completed`, `onboarding_complete` to `ProgressionState` interface; add `completeWalkthroughStep` and `completeOnboarding` API methods)
- Architecture Section 11 defines the exact migration, model changes, and endpoint implementations.
- Use `with_for_update()` on the progression row for the walkthrough-step endpoint to prevent race conditions.

**Dependencies**: None (backend work can start in parallel with frontend stories)

---

#### Story 2.6: Seed Data -- "The Squire's Trial" Quest and Emblem Cosmetic

**Size**: S

**Description**: Add seed data for the onboarding quest and its reward cosmetic so the walkthrough completion flow has real backend entities to reference.

**Acceptance Criteria**:
1. `quest_seed.py` includes "The Squire's Trial" quest with: `level_required=0`, `xp_reward=950`, `coin_reward=475`, `sort_order=1`, requirement `type="walkthrough_step"` with `count=7`.
2. `cosmetic_seed.py` includes "Squire's Trial Emblem" with: `category="emblem"`, `rarity="uncommon"`, `coin_price=0`, `level_required=0`, `is_quest_exclusive=True`, `sort_order=84`.
3. Running the seed script creates these entries in the database without errors.
4. The quest is available at level 0 (unlike other quests at level 3+).
5. Tests verify: seed data creates valid database entries, quest has correct requirements, cosmetic is quest-exclusive.

**Dev Notes**:
- File: `backend/app/data/quest_seed.py` (modify -- add entry)
- File: `backend/app/data/cosmetic_seed.py` (modify -- add entry)
- Architecture Section 8 and Section 11 define the exact seed data.
- The `is_quest_exclusive` field on cosmetics should already exist from Epic 6. If not, add it.

**Dependencies**: Story 2.5 (walkthrough fields must exist before quest requirements reference them)

---

#### Story 2.7: Walkthrough Completion Celebration and Final Flow

**Size**: M

**Description**: Implement the walkthrough completion celebration: quest completion banner, confetti animation, victory pose, emblem award notification, and Cedric's final message. Wire up the full end-to-end flow from walkthrough completion to persistent companion mode.

**Acceptance Criteria**:
1. When all 7 steps are completed, the React Joyride overlay is dismissed.
2. Cedric performs the `CelebrateLevelUp` animation (high jump, confetti).
3. A quest completion banner slides in from the top showing: "THE SQUIRE'S TRIAL -- COMPLETE!", reward summary (950 XP, 475 Gold, Squire's Trial Emblem), and a "Dismiss" button.
4. `POST /progression/complete-onboarding` is called.
5. Cedric's final walkthrough message displays: "I am proud to call you my companion, adventurer..." with typing animation.
6. After the final message dismisses, Cedric enters persistent companion mode (default idle state).
7. The walkthrough state is cleared: `walkthroughActive = false`, `walkthroughComplete = true`.
8. If the user clicks "Skip Tutorial" at any point, `POST /progression/complete-onboarding` is called with no rewards, and Cedric enters companion mode with a brief message.
9. Tests verify: celebration sequence, quest banner content, API call on completion, skip flow, final state.

**Dev Notes**:
- File: `frontend/src/context/CedricContext.tsx` (modify -- `completeWalkthrough` implementation)
- File: `frontend/src/components/avatar/QuestCompleteBanner.tsx` (new -- parchment-styled reward card)
- File: `frontend/src/components/avatar/WalkthroughOverlay.tsx` (modify -- skip handler)
- Architecture Section 8 (Scene 10: "The Squire's Triumph") defines the complete celebration flow.
- The confetti animation can reuse patterns from existing NotificationToasts or use Framer Motion particles.

**Dependencies**: Stories 2.4, 2.5, 2.6

---

#### Story Dependency Graph (Cedric Epic 2)

```
2.5 Backend (migration + endpoints)     2.6 Seed Data
       |                                      |
       v                                      v
2.1 WalkthroughOverlay -----> 2.2 Step Definitions
       |                          |
       v                          v
       2.3 First-Time User Detection
             |
             v
       2.4 Step Completion + Rewards
             |
             v
       2.7 Completion Celebration
```

Stories 2.5 and 2.1 can start in parallel.
Story 2.6 depends on 2.5.
Story 2.2 depends on 2.1.
Stories 2.3 and 2.4 are sequential.
Story 2.7 depends on 2.4 + 2.5 + 2.6.

---

### 16.3 Cedric Epic 3: Speech Bubble System

> **Phase**: 1 (Dev-2 starts here, parallel with Epic 1)
> **Estimated Stories**: 5
> **Dependencies**: Framer Motion (already installed), ThemeContext (existing)
> **Architecture References**: Sections 5, 3 (Speech Queue)
> **ADR References**: D-CA-004

---

#### Story 3.1: Create SpeechBubble Component with Theme Variants

**Size**: M

**Description**: Create the `SpeechBubble` component that renders a themed speech bubble with support for text content, action buttons, dismiss button, and pointer triangle. The bubble supports game (parchment), light, and dark theme variants.

**Acceptance Criteria**:
1. `SpeechBubble` accepts the props interface defined in architecture Section 2: `message`, `theme`, `onDismiss`, `onAction`, `position`.
2. Game theme styling: parchment gradient (`#F5E6C8` to `#E8D5A8`), 2px solid `#8B6914` border, `Cinzel` serif for "Cedric:" label, dark brown text (`#3D2B1F`), max-width 280px, shadow `0 4px 16px rgba(0,0,0,0.3)`.
3. Light theme styling: white background, 1px solid `#E0E0E0` border, 12px rounded corners, system sans-serif.
4. Dark theme styling: `#2D2D3D` background, 1px solid `#404050` border, 12px rounded corners.
5. A pointer triangle (CSS border trick, 10px wide, 8px tall) points down toward the avatar in the `above` position, or up toward the avatar in the `below` position.
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

#### Story 3.2: Implement Typing Animation

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
- The cursor is a CSS-animated element.

**Dependencies**: Story 3.1

---

#### Story 3.3: Implement Framer Motion Entrance/Exit Animations

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

#### Story 3.4: Implement Priority Speech Queue in CedricContext

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

#### Story 3.5: Create cedricMessages.ts Dialogue Configuration

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

#### Story Dependency Graph (Cedric Epic 3)

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

---

### 16.4 Cedric Epic 4: Idle Animations & Reactions

> **Phase**: 2 (Dev-2, after Epic 3)
> **Estimated Stories**: 5
> **Dependencies**: Epic 1 (AvatarSprite), Epic 3 (SpeechBubble), CedricContext
> **Architecture References**: Sections 6, 3 (Animation State Machine)
> **ADR References**: D-CA-003

---

#### Story 4.1: Implement CSS Sprite Sheet Idle Animations

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

#### Story 4.2: Implement Inactivity Timer and State Progression

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

#### Story 4.3: Implement Framer Motion Reaction Animations

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

#### Story 4.4: Implement Animation Queue with Collapse Rules

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

#### Story 4.5: Integrate Reactions with AdventureModeContext Events

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

#### Story Dependency Graph (Cedric Epic 4)

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

---

### 16.5 Cedric Epic 5: Roadmap Assistant / Loading Narrator

> **Phase**: 2 (Dev-1, after Epic 2)
> **Estimated Stories**: 5
> **Dependencies**: Epic 1 (AvatarSprite), Epic 3 (SpeechBubble), Epic 4 (Animations)
> **Architecture References**: Section 9
> **ADR References**: D-CA-003

---

#### Story 5.1: Create useCedricNarrator Hook

**Size**: M

**Description**: Create the `useCedricNarrator` hook that monitors React Query loading states, tracks elapsed time, determines the current narration phase, calculates estimated progress, and cycles tips.

**Acceptance Criteria**:
1. `useCedricNarrator` accepts a `NarratorConfig` with: `phases` (array of `NarratorPhase`), `queryKey` (React Query key to monitor), `onComplete` callback.
2. The hook returns: `isLoading`, `currentPhase`, `progress` (0-100), `elapsedTime`, `tip`.
3. `isLoading` reflects the React Query loading state for the given `queryKey`.
4. `elapsedTime` tracks milliseconds since loading began (using `useRef` + `setInterval` at 100ms).
5. `currentPhase` is the phase whose `minTime <= elapsedTime < maxTime`.
6. `progress` is calculated as a percentage based on the current phase's position within the total phase timeline.
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

#### Story 5.2: Define Oracle Sequence Phase Configuration

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
- The generic config is used for loads under 10 seconds.

**Dependencies**: None (can start in parallel)

---

#### Story 5.3: Create AvatarLoadingStage Component

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

#### Story 5.4: Implement Completion Animation Sequence

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

#### Story 5.5: Integrate Narrator with Existing Pages

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

#### Story Dependency Graph (Cedric Epic 5)

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

---

### 16.6 Cedric Epic 6: Contextual Guidance System

> **Phase**: 2 (Dev-2, after Epic 4)
> **Estimated Stories**: 5
> **Dependencies**: Epic 1 (CedricContext), Epic 3 (SpeechBubble), Epic 4 (Reactions)
> **Architecture References**: Section 10
> **ADR References**: D-CA-004

---

#### Story 6.1: Create Page Configuration Map

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
- Proactive suggestions use condition functions that check: `gold`, `level`, `daysAway` (from progression state).

**Dependencies**: Epic 3 Story 3.5 (cedricMessages.ts for MessageVariant interface)

---

#### Story 6.2: Implement First-Visit Detection and Route Change Listener

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

#### Story 6.3: Implement Anti-Annoyance Protocol

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

#### Story 6.4: Implement Proactive Suggestion System

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

**Dependencies**: Story 6.3 (anti-annoyance protocol)

---

#### Story 6.5: Implement Quiet Mode and Tip Tracking Persistence

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

**Dependencies**: Story 6.3 (anti-annoyance uses quietMode flag)

---

#### Story Dependency Graph (Cedric Epic 6)

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

---

### 16.7 Cedric Epic 7: Store Live Preview & Interactions

> **Phase**: 3 (Dev-1, after Epic 5)
> **Estimated Stories**: 4
> **Dependencies**: Epic 1 (AvatarSprite), Epic 3 (SpeechBubble), StorePage
> **Architecture References**: Sections 2, 7

---

#### Story 7.1: Implement Avatar Preview Mode on StorePage

**Size**: M

**Description**: When the user navigates to `/store`, the avatar automatically enlarges to 192x192 (3x scale) and enters a "preview mode" where equipment changes are reflected in real time.

**Acceptance Criteria**:
1. When the route is `/store`, `AvatarCompanion` renders the sprite at 192px size instead of the default 128px.
2. The enlarged avatar is positioned in a dedicated preview area on the store page (not the fixed bottom-right position).
3. The preview avatar shows all currently equipped items from `progression.equipped_items`.
4. When an item is equipped/unequipped via the store, the avatar updates immediately via React Query invalidation of `QUERY_KEYS.progression`.
5. The pedestal and nameplate are visible in preview mode.
6. The avatar returns to normal size (128px) and fixed position when navigating away from `/store`.
7. Tests verify: 192px rendering on store page, real-time equipment update, return to normal on navigation.

**Dev Notes**:
- File: `frontend/src/components/avatar/AvatarCompanion.tsx` (modify -- detect `/store` route via `useLocation()`, switch to preview mode)
- File: `frontend/src/pages/StorePage.tsx` (modify -- add a preview area div that AvatarCompanion renders into when on store route)
- Architecture Section 2 defines store page sizing: 192x192 sprite.

**Dependencies**: Epic 1 (AvatarSprite, AvatarCompanion)

---

#### Story 7.2: Implement Hover-to-Preview for Store Items

**Size**: M

**Description**: When the user hovers over a store item, the avatar temporarily shows that item equipped (swapping the relevant equipment layer) without actually equipping it. On mouse leave, the avatar reverts to the actual equipped items.

**Acceptance Criteria**:
1. Hovering over a store catalog item triggers a temporary equipment layer swap on the avatar preview.
2. The swap only affects the relevant slot (e.g., hovering over "Iron Chainmail" temporarily replaces the armor layer).
3. Other equipped items remain visible during the preview.
4. On mouse leave, the avatar reverts to the actual `equipped_items` from progression state.
5. The preview state is managed locally in the store page component, not in CedricContext.
6. If the item's asset file doesn't exist, the layer falls back gracefully (onError hides the img).
7. A brief Framer Motion crossfade (150ms) animates the equipment layer swap.
8. Tests verify: hover triggers layer swap, correct slot affected, revert on mouse leave, crossfade animation, missing asset fallback.

**Dev Notes**:
- File: `frontend/src/pages/StorePage.tsx` (modify -- add `onMouseEnter`/`onMouseLeave` handlers to catalog items)
- File: `frontend/src/components/avatar/AvatarSprite.tsx` (modify -- accept optional `previewOverrides` prop)
- The `previewOverrides` prop is a `Partial<Record<string, CosmeticBrief | null>>` that merges with `equippedItems`.

**Dependencies**: Story 7.1 (preview mode)

---

#### Story 7.3: Implement CharacterSheet Popup

**Size**: M

**Description**: Create the `CharacterSheet` component that opens when the user clicks the avatar. It shows an enlarged avatar, an equipment grid with 8 slots, and stats (level, title, XP bar, gold).

**Acceptance Criteria**:
1. Clicking the avatar anywhere (not just on the store page) opens the `CharacterSheet` as a slide-in panel from the bottom-right.
2. The CharacterSheet displays: 192x192 enlarged avatar preview at the top, 2x4 equipment grid showing slot name + item name (or "Empty"), stats section with level, title, XP bar, and gold.
3. Each equipment slot shows: slot name (e.g., "Armor"), item name if equipped (e.g., "Iron Chainmail"), "Empty" if no item equipped.
4. A "Visit Armory" link navigates to `/store`.
5. The panel has a close button (X) and closes on Escape key or click-outside.
6. The panel opens with Framer Motion slide animation (`x: 300 -> 0`).
7. `CedricContext.openCharacterSheet()` and `closeCharacterSheet()` manage the open/close state.
8. Tests verify: click opens sheet, equipment grid shows correct data, stats display, close on X/Escape/click-outside, slide animation.

**Dev Notes**:
- File: `frontend/src/components/avatar/CharacterSheet.tsx` (new)
- File: `frontend/src/components/avatar/AvatarCompanion.tsx` (modify -- add click handler to open CharacterSheet)
- Architecture Section 2 defines the `CharacterSheet` props interface.
- The 8 slots are: banner, boots, armor, cape, hairstyle, jewelry, emblem, color_palette.

**Dependencies**: Epic 1 (AvatarSprite, CedricContext)

---

#### Story 7.4: Implement Cursor Tracking on Hover

**Size**: S

**Description**: When the user hovers over the avatar, Cedric's eyes/head subtly track the cursor position, adding a sense of life to the character.

**Acceptance Criteria**:
1. When the cursor is within 200px of the avatar, the sprite container applies a small CSS transform to simulate looking toward the cursor.
2. The transform is a subtle `translateX` shift (-2px to +2px) and `rotateY` (-3deg to +3deg) based on cursor position relative to the avatar center.
3. The movement is smoothed with CSS `transition: transform 0.3s ease`.
4. When the cursor leaves the 200px radius, the transform returns to neutral.
5. Cursor tracking is disabled when: the avatar is minimized, an animation is playing, the walkthrough is active.
6. `prefers-reduced-motion` disables cursor tracking entirely.
7. Tests verify: transform applied on hover, direction matches cursor position, smooth return, disabled states.

**Dev Notes**:
- File: `frontend/src/components/avatar/AvatarCompanion.tsx` (modify -- add `onMouseMove` handler within a wrapper div)
- This is a polish feature -- keep the implementation simple.

**Dependencies**: Epic 1 Story 1.4 (AvatarCompanion)

---

#### Story Dependency Graph (Cedric Epic 7)

```
7.1 Store Preview Mode
        |
        v
7.2 Hover-to-Preview

7.3 CharacterSheet Popup (independent)

7.4 Cursor Tracking (independent)
```

Story 7.1 must come first for store-specific features.
Story 7.2 depends on 7.1.
Stories 7.3 and 7.4 are independent and can run in parallel with 7.1/7.2.

---

### 16.8 Cedric Epic 8: Non-Adventure Mode Variant & Polish

> **Phase**: 3 (Dev-2, after Epic 6)
> **Estimated Stories**: 5
> **Dependencies**: All prior epics (this is the final polish pass)
> **Architecture References**: Concept Document Section 7 (Non-Adventure Mode)
> **ADR References**: D-CA-001

---

#### Story 8.1: Implement Modern/Professional Variant

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

#### Story 8.2: Implement Minimize to Icon and Drag to Reposition

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

**Dependencies**: Epic 1 Story 1.4 (AvatarCompanion)

---

#### Story 8.3: Implement prefers-reduced-motion Support

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

#### Story 8.4: Implement Responsive Adjustments

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

**Dependencies**: All prior avatar components

---

#### Story 8.5: Implement Accessibility Features

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

**Dependencies**: Epic 7 Story 7.3 (CharacterSheet)

---

#### Story Dependency Graph (Cedric Epic 8)

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

---

### 16.9 Cedric Avatar Sprint Status

```yaml
project: SpringAIS Cedric Avatar Companion System
date: 2026-02-12
status: stories_complete
total_epics: 8
total_stories: 42

epics:
  - id: cedric-epic-1
    name: "Avatar Component Foundation"
    phase: 1
    assigned_to: dev-1
    stories: 6
    dependencies: none
    status: ready_for_development
    stories_list:
      - "1.1: CedricContext Provider with Core State (L)"
      - "1.2: AvatarSprite Component with Layered Rendering (M)"
      - "1.3: Pedestal and NamePlate Components (S)"
      - "1.4: AvatarCompanion Root Component (M)"
      - "1.5: Placeholder Sprite Assets (S)"
      - "1.6: Barrel Export and Integration Test (S)"
    immediately_startable:
      - "1.1: CedricContext Provider"
      - "1.2: AvatarSprite Component"
      - "1.3: Pedestal and NamePlate"
      - "1.5: Placeholder Sprite Assets"

  - id: cedric-epic-2
    name: "Onboarding Walkthrough Quest"
    phase: 1
    assigned_to: dev-1
    stories: 7
    dependencies: [cedric-epic-1, cedric-epic-3 (Story 3.1)]
    status: blocked_by_epic_1
    stories_list:
      - "2.1: Install react-joyride and WalkthroughOverlay (M)"
      - "2.2: Walkthrough Step Definitions and Dialogue (M)"
      - "2.3: First-Time User Detection and Adventure Mode Prompt (M)"
      - "2.4: Walkthrough Step Completion Detection and Rewards (L)"
      - "2.5: Backend -- Walkthrough Fields, Migration, Endpoints (M)"
      - "2.6: Seed Data -- Squire's Trial Quest and Emblem (S)"
      - "2.7: Walkthrough Completion Celebration (M)"
    immediately_startable:
      - "2.5: Backend migration and endpoints (no frontend deps)"

  - id: cedric-epic-3
    name: "Speech Bubble System"
    phase: 1
    assigned_to: dev-2
    stories: 5
    dependencies: none
    status: ready_for_development
    notes: "Dev-2 starts here, parallel with Epic 1"
    stories_list:
      - "3.1: SpeechBubble Component with Theme Variants (M)"
      - "3.2: Typing Animation (S)"
      - "3.3: Framer Motion Entrance/Exit Animations (S)"
      - "3.4: Priority Speech Queue in CedricContext (M)"
      - "3.5: cedricMessages.ts Dialogue Configuration (S)"
    immediately_startable:
      - "3.1: SpeechBubble Component"
      - "3.4: Priority Queue (after Epic 1 Story 1.1)"
      - "3.5: cedricMessages.ts"

  - id: cedric-epic-4
    name: "Idle Animations & Reactions"
    phase: 2
    assigned_to: dev-2
    stories: 5
    dependencies: [cedric-epic-1, cedric-epic-3]
    status: blocked_by_epic_3
    stories_list:
      - "4.1: CSS Sprite Sheet Idle Animations (M)"
      - "4.2: Inactivity Timer and State Progression (M)"
      - "4.3: Framer Motion Reaction Animations (L)"
      - "4.4: Animation Queue with Collapse Rules (M)"
      - "4.5: Integrate Reactions with AdventureModeContext Events (M)"

  - id: cedric-epic-5
    name: "Roadmap Assistant / Loading Narrator"
    phase: 2
    assigned_to: dev-1
    stories: 5
    dependencies: [cedric-epic-1, cedric-epic-2, cedric-epic-3]
    status: blocked_by_epic_2
    stories_list:
      - "5.1: useCedricNarrator Hook (M)"
      - "5.2: Oracle Sequence Phase Configuration (S)"
      - "5.3: AvatarLoadingStage Component (M)"
      - "5.4: Completion Animation Sequence (M)"
      - "5.5: Integrate Narrator with Existing Pages (M)"

  - id: cedric-epic-6
    name: "Contextual Guidance System"
    phase: 2
    assigned_to: dev-2
    stories: 5
    dependencies: [cedric-epic-1, cedric-epic-3, cedric-epic-4]
    status: blocked_by_epic_4
    stories_list:
      - "6.1: Page Configuration Map (M)"
      - "6.2: First-Visit Detection and Route Change Listener (M)"
      - "6.3: Anti-Annoyance Protocol (M)"
      - "6.4: Proactive Suggestion System (M)"
      - "6.5: Quiet Mode and Tip Tracking Persistence (S)"

  - id: cedric-epic-7
    name: "Store Live Preview & Interactions"
    phase: 3
    assigned_to: dev-1
    stories: 4
    dependencies: [cedric-epic-1, cedric-epic-5]
    status: blocked_by_epic_5
    stories_list:
      - "7.1: Avatar Preview Mode on StorePage (M)"
      - "7.2: Hover-to-Preview for Store Items (M)"
      - "7.3: CharacterSheet Popup (M)"
      - "7.4: Cursor Tracking on Hover (S)"

  - id: cedric-epic-8
    name: "Non-Adventure Mode Variant & Polish"
    phase: 3
    assigned_to: dev-2
    stories: 5
    dependencies: [cedric-epic-1, cedric-epic-6]
    status: blocked_by_epic_6
    stories_list:
      - "8.1: Modern/Professional Variant (M)"
      - "8.2: Minimize to Icon and Drag to Reposition (M)"
      - "8.3: prefers-reduced-motion Support (S)"
      - "8.4: Responsive Adjustments (M)"
      - "8.5: Accessibility Features (M)"

story_summary:
  total: 42
  by_size:
    small: 11
    medium: 24
    large: 7
  by_phase:
    phase_1: 18
    phase_2: 15
    phase_3: 9
  by_developer:
    dev_1: 22
    dev_2: 20

developer_assignment:
  dev_1:
    - "Epic 1: Avatar Component Foundation (6 stories)"
    - "Epic 2: Onboarding Walkthrough Quest (7 stories)"
    - "Epic 5: Roadmap Assistant / Loading Narrator (5 stories)"
    - "Epic 7: Store Live Preview & Interactions (4 stories)"
  dev_2:
    - "Epic 3: Speech Bubble System (5 stories)"
    - "Epic 4: Idle Animations & Reactions (5 stories)"
    - "Epic 6: Contextual Guidance System (5 stories)"
    - "Epic 8: Non-Adventure Mode Variant & Polish (5 stories)"

critical_path:
  - "Epic 1 Stories 1.1+1.2+1.3+1.5 (parallel) -> 1.4 -> 1.6"
  - "Then: Epic 2 (Dev-1) and Epic 4 (Dev-2, after Epic 3)"
  - "Then: Epic 5 (Dev-1, after Epic 2) and Epic 6 (Dev-2, after Epic 4)"
  - "Then: Epic 7 (Dev-1) and Epic 8 (Dev-2)"

parallelization_opportunities:
  - "Epic 1 (Dev-1) and Epic 3 (Dev-2) run in parallel from day one"
  - "Epic 1 Stories 1.1, 1.2, 1.3, 1.5 are all independent and can start simultaneously"
  - "Epic 2 Story 2.5 (backend) can start in parallel with frontend stories"
  - "Epic 3 Stories 3.1, 3.4, 3.5 can start in parallel"
  - "Epic 5 Stories 5.1 and 5.2 can start in parallel"
  - "Epic 7 Stories 7.3 and 7.4 are independent of 7.1/7.2"
  - "Epic 8 Stories 8.1, 8.2, 8.3 can all start in parallel"

new_dependency:
  package: "react-joyride"
  version: "^2.9"
  size: "~25KB"
  license: "MIT"
  purpose: "Walkthrough spotlight overlay with custom tooltip rendering"
  installed_in: "Epic 2 Story 2.1"

backend_changes:
  new_migration: "031_add_walkthrough_fields.py"
  new_model_fields:
    - "user_progression.walkthrough_step (Integer, default 0)"
    - "user_progression.walkthrough_completed (Boolean, default False)"
  new_endpoints:
    - "POST /api/progression/walkthrough-step"
    - "POST /api/progression/complete-onboarding"
  modified_endpoints:
    - "GET /api/progression (add walkthrough fields to response)"
  seed_data:
    - "quest_seed.py: 'The Squire's Trial' quest (level 0)"
    - "cosmetic_seed.py: 'Squire's Trial Emblem' cosmetic"
  reward_config:
    - "walkthrough_step: RewardConfig(xp=50, coins=25)"

frontend_new_files:
  - "frontend/src/context/CedricContext.tsx"
  - "frontend/src/components/avatar/AvatarCompanion.tsx"
  - "frontend/src/components/avatar/AvatarSprite.tsx"
  - "frontend/src/components/avatar/SpeechBubble.tsx"
  - "frontend/src/components/avatar/CharacterSheet.tsx"
  - "frontend/src/components/avatar/WalkthroughOverlay.tsx"
  - "frontend/src/components/avatar/CedricTooltip.tsx"
  - "frontend/src/components/avatar/AvatarLoadingStage.tsx"
  - "frontend/src/components/avatar/useCedricNarrator.ts"
  - "frontend/src/components/avatar/cedricMessages.ts"
  - "frontend/src/components/avatar/cedricPageConfig.ts"
  - "frontend/src/components/avatar/cedricAnimations.ts"
  - "frontend/src/components/avatar/cedricAnimations.css"
  - "frontend/src/components/avatar/cedricNarratorConfig.ts"
  - "frontend/src/components/avatar/walkthroughSteps.ts"
  - "frontend/src/components/avatar/Pedestal.tsx"
  - "frontend/src/components/avatar/NamePlate.tsx"
  - "frontend/src/components/avatar/FloatingText.tsx"
  - "frontend/src/components/avatar/ConfettiEffect.tsx"
  - "frontend/src/components/avatar/ModernGuideIcon.tsx"
  - "frontend/src/components/avatar/QuestCompleteBanner.tsx"
  - "frontend/src/components/avatar/index.ts"
  - "frontend/src/hooks/usePrefersReducedMotion.ts"
  - "frontend/src/hooks/useBreakpoint.ts"

frontend_modified_files:
  - "frontend/src/App.tsx (add CedricProvider)"
  - "frontend/src/components/layout/MainLayout.tsx (render AvatarCompanion)"
  - "frontend/src/components/layout/Sidebar.tsx (add data-tour attributes)"
  - "frontend/src/services/progressionService.ts (add walkthrough types/methods)"
  - "frontend/src/pages/RoadmapPage.tsx (integrate loading narrator)"
  - "frontend/src/pages/StorePage.tsx (avatar preview, data-tour attributes)"
  - "frontend/src/components/matches/MatchResultsPage.tsx (generic narrator, data-tour)"
```

---
