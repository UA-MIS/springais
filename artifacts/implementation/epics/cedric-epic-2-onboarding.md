# Epic 2: Onboarding Walkthrough Quest

> **Phase**: 1 (Dev-1, after Epic 1)
> **Estimated Stories**: 7
> **Dependencies**: Epic 1 (Avatar Foundation), Epic 3 (SpeechBubble -- partial, Story 3.1 needed)
> **Architecture References**: Sections 4, 8, 11
> **ADR References**: D-CA-005, D-CA-006

---

## Story 2.1: Install react-joyride and Create WalkthroughOverlay Component

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

## Story 2.2: Define Walkthrough Step Definitions and Dialogue

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

## Story 2.3: Implement First-Time User Detection and Adventure Mode Prompt

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

## Story 2.4: Implement Walkthrough Step Completion Detection and Rewards

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

## Story 2.5: Backend -- Walkthrough Fields, Migration, and Endpoints

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

## Story 2.6: Seed Data -- "The Squire's Trial" Quest and Emblem Cosmetic

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

## Story 2.7: Walkthrough Completion Celebration and Final Flow

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

## Story Dependency Graph (Epic 2)

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
