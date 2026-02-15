# Architecture: Cedric Avatar Companion System

**Date**: 2026-02-12
**Author**: Architect agent
**Status**: Architecture Document
**Upstream**: avatar-guide-concept.md, avatar-concept.md, avatar-research.md, avatar-guide-research.md

---

## Table of Contents

1. [Overview](#1-overview)
2. [Component Hierarchy](#2-component-hierarchy)
3. [State Management Architecture](#3-state-management-architecture)
4. [React Joyride Integration](#4-react-joyride-integration)
5. [Speech Bubble System](#5-speech-bubble-system)
6. [Animation System](#6-animation-system)
7. [Asset Architecture](#7-asset-architecture)
8. [Onboarding Flow Architecture](#8-onboarding-flow-architecture)
9. [Loading Narrator Architecture](#9-loading-narrator-architecture)
10. [Contextual Guidance Architecture](#10-contextual-guidance-architecture)
11. [Backend Changes](#11-backend-changes)
12. [ADR Log](#12-adr-log)

---

## 1. Overview

### System Purpose

Cedric is a persistent on-screen pixel-art companion character that serves three roles:

1. **Onboarding guide** -- walks new users through the platform via a React Joyride walkthrough disguised as the first quest
2. **Roadmap assistant** -- narrates AI loading states with phased dialogue and animations
3. **Contextual companion** -- provides page-specific tips, celebrates achievements, and reflects equipped cosmetic items

### Integration Surface

Cedric plugs into the existing gamification infrastructure without replacing it:

| Existing System | How Cedric Uses It |
|---|---|
| `AdventureModeContext` | Reads `enabled`, `level`, `gold`, `equipped_items`, notification events |
| `progressionApi` | Reads `ProgressionState` for walkthrough detection and progression data |
| `storeApi.equip()` / `unequip()` | Equipment changes flow through React Query invalidation to the avatar |
| `NotificationToasts` | Remains the primary notification system; Cedric's reactions supplement it visually |
| `reward_hook_service` | Backend walkthrough step rewards dispatched through existing reward pipeline |
| `ThemeContext` | Determines speech bubble style (game/light/dark) and whether avatar is medieval or modern |

### New Dependency

| Package | Version | Size | Purpose |
|---|---|---|---|
| `react-joyride` | `^2.9` | ~25 KB | Walkthrough spotlight overlay with custom tooltip rendering |

### Key Design Decisions

- **D-CA-001**: Separate `CedricContext` rather than extending `AdventureModeContext` (see ADR section)
- **D-CA-002**: DOM/CSS layered PNGs for equipment rendering (validated by avatar-research.md)
- **D-CA-003**: CSS sprite sheets + Framer Motion for animation (zero new rendering dependencies)
- **D-CA-004**: Speech queue with priority levels and anti-annoyance protocol
- **D-CA-005**: Walkthrough as a real quest in the quest system with backend progression tracking

---

## 2. Component Hierarchy

### Tree

```
AvatarCompanion (root - fixed position wrapper)
├── AvatarSprite (the character + equipment layers)
│   ├── BaseSpriteLayer (base body, always present)
│   ├── EquipmentLayer × 8 (one per slot, z-indexed)
│   ├── RarityEffectLayer (glow/particles per highest-rarity equipped item)
│   ├── AnimationController (manages current animation state via CSS class)
│   └── Pedestal (base platform, changes with level)
├── SpeechBubble (dialogue/tips/actions)
│   ├── TypingAnimation (character-by-character reveal)
│   ├── ActionButtons (optional 1-2 buttons)
│   └── DismissButton (X close + optional "Don't show again")
├── CharacterSheet (mini popup on click)
│   ├── EquipmentGrid (8 slots, 2×4)
│   └── StatsDisplay (level, XP, coins)
├── NamePlate (title + level below pedestal)
└── WalkthroughOverlay (React Joyride wrapper, active during onboarding)
```

### Component Specifications

#### `AvatarCompanion` (Root)

**Location**: `frontend/src/components/avatar/AvatarCompanion.tsx`

```typescript
interface AvatarCompanionProps {
  // No props -- reads all state from CedricContext and AdventureModeContext
}

// Internal state managed by CedricContext:
// - visibility: 'full' | 'minimized' | 'hidden'
// - position: { anchor: 'bottom-right' | 'bottom-left' | 'bottom-center' }
// - characterSheetOpen: boolean
// - walkthroughActive: boolean
```

**Responsibilities**:
- Fixed-position container at `z-index: 35` (below HUD at 40, above page content)
- Default position: bottom-right, 24px from edges
- Renders nothing when `adventureMode.enabled === false` AND `isNewUser === false`
- For non-adventure new users: renders modern guide variant (compass icon)
- Manages entrance/exit animations via Framer Motion `AnimatePresence`
- Delegates all subcomponent rendering

**Sizing**:
- Full mode: 160×180px container (128×128 sprite + 128×32 pedestal + 128×20 nameplate)
- Minimized: 32×32px (just the character head, circular border)
- Store page expanded: 192×192px sprite (automatic on `/store` route)
- Loading narrator: 192×192px centered in loading area (not in the fixed-position container)

#### `AvatarSprite`

**Location**: `frontend/src/components/avatar/AvatarSprite.tsx`

```typescript
interface AvatarSpriteProps {
  size: 64 | 128 | 192;           // CSS pixel size (sprite renders at 2x, 3x, or 4x)
  equippedItems: Record<string, CosmeticBrief | null>;
  animationState: AnimationState;
  colorPalette: string | null;     // CSS color overlay value
  level: number;                   // For pedestal variant
  showPedestal?: boolean;          // Default true
  showNameplate?: boolean;         // Default true
  className?: string;
}
```

**Responsibilities**:
- Renders base sprite + equipment layers as stacked `<img>` elements with `position: absolute`
- Applies `image-rendering: pixelated` for crisp pixel art
- Applies color palette via CSS `mix-blend-mode: multiply` overlay div
- Applies rarity effects per-layer via CSS filters and Framer Motion particles
- Delegates animation state to CSS class on the container

**Equipment Layer Order** (back to front):

| Layer | Z-Index | Slot | Notes |
|---|---|---|---|
| Banner | 0 | `banner` | Behind character body |
| Base Body | 1 | (always) | Default sprite, never removed |
| Boots | 2 | `boots` | Feet layer |
| Armor | 3 | `armor` | Torso overlay |
| Cape | 4 | `cape` | Behind head, over armor |
| Hairstyle | 5 | `hairstyle` | Head layer, replaces default hair |
| Jewelry | 6 | `jewelry` | Small bright details on body |
| Emblem | 7 | `emblem` | Shield/badge on chest/arm |

Each `<img>` uses the same 64×64 canvas size with transparent backgrounds, pre-aligned so they stack without manual offsets.

#### `SpeechBubble`

**Location**: `frontend/src/components/avatar/SpeechBubble.tsx`

```typescript
interface SpeechBubbleProps {
  message: SpeechMessage | null;
  theme: 'game' | 'light' | 'dark';
  onDismiss: () => void;
  onAction?: (actionId: string) => void;
  position: 'above' | 'beside';     // 'above' default, 'beside' for loading stage
}
```

**Responsibilities**:
- Renders styled bubble with theme-appropriate styling
- Typing animation for narrative/walkthrough messages (25ms per character)
- Action button rendering with fade-in after text completes
- Dismiss button (X) and optional "Don't show again" link
- Framer Motion entrance/exit animations
- Pointer triangle aimed at the avatar

#### `CharacterSheet`

**Location**: `frontend/src/components/avatar/CharacterSheet.tsx`

```typescript
interface CharacterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  equippedItems: Record<string, CosmeticBrief | null>;
  level: number;
  title: string;
  xp: { current: number; toNext: number };
  gold: number;
}
```

**Responsibilities**:
- Slide-in panel from bottom-right on click
- 192×192 enlarged avatar preview at top
- 2×4 equipment grid showing slot name + item name (or "Empty")
- Stats: level, title, XP bar, gold
- "Visit Armory" link to `/store`

#### `WalkthroughOverlay`

**Location**: `frontend/src/components/avatar/WalkthroughOverlay.tsx`

```typescript
interface WalkthroughOverlayProps {
  isActive: boolean;
  currentStep: number;
  onStepComplete: (stepIndex: number) => void;
  onComplete: () => void;
  onSkip: () => void;
}
```

**Responsibilities**:
- Wraps `react-joyride` with `run={isActive}` and `controlled={true}`
- Custom `tooltipComponent` that renders `AvatarSprite` + `SpeechBubble` as the tooltip
- Step definitions with target selectors, Cedric dialogue, and avatar animation states
- Callback integration for step transitions, rewards, and navigation
- Skip button ("Skip Tutorial") in the step progress indicator

---

## 3. State Management Architecture

### New CedricContext

A dedicated `CedricContext` manages Cedric-specific state. It lives *inside* the `AdventureModeProvider` in the component tree and reads from `AdventureModeContext` via `useAdventureMode()`.

**Location**: `frontend/src/context/CedricContext.tsx`

**Rationale for separation (D-CA-001)**:
- `AdventureModeContext` already has 15+ state fields and 12+ methods; adding Cedric state (animation, speech queue, walkthrough, guidance) would push it to 30+ fields
- Cedric can be feature-flagged independently
- Clear ownership boundary: `AdventureModeContext` = gamification numbers, `CedricContext` = companion behavior

```typescript
interface CedricState {
  // Visibility
  visibility: 'full' | 'minimized' | 'hidden';
  position: { anchor: 'bottom-right' | 'bottom-left' | 'bottom-center' };

  // Animation
  animationState: AnimationState;
  animationQueue: AnimationQueueEntry[];

  // Speech
  currentMessage: SpeechMessage | null;
  speechQueue: SpeechMessage[];

  // Walkthrough
  walkthroughActive: boolean;
  walkthroughStep: number;       // 0-based, -1 = not started
  walkthroughComplete: boolean;  // From backend
  isNewUser: boolean;            // onboarding_complete === false

  // Guidance
  quietMode: boolean;
  sessionMessageCount: number;   // For daily cap (max 8 proactive)
  lastMessageTimestamp: number;  // For cooldown (90s)

  // UI
  characterSheetOpen: boolean;
}

interface CedricContextType {
  state: CedricState;

  // Speech
  enqueueMessage: (message: SpeechMessage) => void;
  dismissCurrentMessage: () => void;
  suppressMessageType: (messageType: string) => void;

  // Animation
  triggerAnimation: (animation: AnimationState, duration?: number) => void;

  // Walkthrough
  startWalkthrough: () => void;
  advanceWalkthrough: () => void;
  skipWalkthrough: () => void;
  completeWalkthrough: () => void;

  // Visibility
  minimize: () => void;
  restore: () => void;
  toggleQuietMode: () => void;

  // Character sheet
  openCharacterSheet: () => void;
  closeCharacterSheet: () => void;
}
```

### Provider Placement in Component Tree

```
<App>
  <ProtectedRoute>
    <AdventureModeProvider>
      <ToastProvider>
        <CedricProvider>           {/* NEW */}
          <MatchesProvider>
            <SavedRolesProvider>
              <SkillsProvider>
                <MainLayout />     {/* AvatarCompanion rendered inside */}
              </SkillsProvider>
            </SavedRolesProvider>
          </MatchesProvider>
        </CedricProvider>
      </ToastProvider>
    </AdventureModeProvider>
  </ProtectedRoute>
</App>
```

### Animation State Machine

```typescript
enum AnimationState {
  // Idle progression (automatic, inactivity-driven)
  Idle = 'idle',                      // Default: breathing/bobbing (2s cycle)
  LookAround = 'lookAround',         // Random every 15-20s
  Sitting = 'sitting',               // After 30s inactivity
  Sleeping = 'sleeping',             // After 2min inactivity
  WakeUp = 'wakeUp',                 // On user activity from sleeping

  // Reactions (triggered by game events, play once then return to Idle)
  JumpXP = 'jumpXP',                 // +6px jump, floating XP text
  CelebrateLevelUp = 'celebrateLevelUp',  // +16px jump, confetti, glow
  CatchCoin = 'catchCoin',           // Coin falls, character catches
  HoldTrophy = 'holdTrophy',         // Achievement unlocked
  VictoryPose = 'victoryPose',       // Quest complete
  SpinNewItem = 'spinNewItem',       // Store purchase
  WaveHello = 'waveHello',           // Login streak, first appearance

  // Contextual (held states during specific app activities)
  Thinking = 'thinking',             // Loading states <5s
  Reading = 'reading',               // Roadmap generation phase 1-2
  Pointing = 'pointing',             // Walkthrough, directing attention
  Confused = 'confused',             // API error
  Excited = 'excited',               // Higher bob rate, slight bouncing
  LookingFar = 'lookingFar',         // Match loading (spyglass)
  TracingLines = 'tracingLines',     // Roadmap generation phase 3
  LookingUp = 'lookingUp',           // Roadmap generation phase 4
}
```

**Transition Rules**:

| From | To | Trigger |
|---|---|---|
| Any | WakeUp | User activity when in Sleeping |
| Any | Reaction (Jump, Trophy, etc.) | Game event fires |
| Any reaction | Idle | Reaction animation completes |
| Idle | LookAround | Random timer (15-20s) |
| LookAround | Idle | After 2s hold |
| Idle | Sitting | 30s inactivity |
| Sitting | Sleeping | 2min inactivity |
| Sleeping | WakeUp → Idle | User activity (with 0.3s debounce) |
| Any | Contextual state | Loading/walkthrough/error begins |
| Contextual | Idle | Loading/walkthrough/error ends |

**Interrupt priority** (higher number interrupts lower):
1. Idle states (Idle, LookAround, Sitting, Sleeping) -- lowest, interruptible by anything
2. Contextual states (Thinking, Reading, Pointing) -- interruptible by reactions
3. Reactions (JumpXP, CatchCoin) -- play to completion, queue subsequent reactions
4. Major reactions (CelebrateLevelUp, VictoryPose) -- never interrupted, always play

### Speech Queue

```typescript
interface SpeechMessage {
  id: string;
  text: string;
  priority: 'walkthrough' | 'reward' | 'reaction' | 'proactive';
  duration: number;              // Auto-dismiss in ms (default 8000)
  typing: boolean;               // True for narrative, false for quick tips
  actions?: SpeechAction[];      // Up to 2 buttons
  dismissible: boolean;          // Show X button (default true)
  suppressible: boolean;         // Show "Don't show again" link
  messageType?: string;          // For frequency tracking
  avatarState?: AnimationState;  // Set avatar to this state while showing
  onDismiss?: () => void;
}

interface SpeechAction {
  id: string;
  label: string;
  variant: 'primary' | 'ghost';
  onClick: () => void;
}
```

**Queue Management Rules**:

1. Messages enter a FIFO queue sorted by priority
2. Current message displays for its `duration` or until dismissed
3. On dismissal/timeout, next queued message appears (with exit/entrance animation, ~0.5s gap)
4. If queue exceeds 3 messages, `proactive` and `reaction` priorities are dropped (only `walkthrough` and `reward` preserved)
5. Queue is cleared on route change except `reward` and `walkthrough` messages
6. 90-second cooldown between `proactive` messages (tracked by `lastMessageTimestamp`)
7. Maximum 8 `proactive` messages per session (tracked by `sessionMessageCount`)

### Walkthrough Progress Persistence

Walkthrough progress is stored in **two places**:

1. **Backend** (`user_progression` table, new fields): `walkthrough_step` (int), `walkthrough_completed` (bool) -- authoritative state, survives logout
2. **CedricContext** (in-memory): mirrors backend state, updated optimistically on step completion

On mount, `CedricProvider` reads `progressionApi.getProgression()` to determine:
- `isNewUser = !progression.onboarding_complete` (existing field on `UserProfile`)
- `walkthroughStep = progression.walkthrough_step` (new field)
- `walkthroughComplete = progression.walkthrough_completed` (new field)

---

## 4. React Joyride Integration

### Installation

```bash
npm install react-joyride
```

### Usage Pattern: Controlled Mode

React Joyride runs in controlled mode where `CedricContext` owns `stepIndex` and `run` state:

```typescript
<Joyride
  steps={WALKTHROUGH_STEPS}
  run={state.walkthroughActive}
  stepIndex={state.walkthroughStep}
  continuous={false}                    // We control step advancement
  scrollToFirstStep={true}
  showSkipButton={false}               // Custom skip in our tooltip
  disableOverlayClose={true}
  disableCloseOnEsc={true}
  tooltipComponent={CedricTooltip}     // Custom: renders avatar + speech bubble
  spotlightClicks={true}               // Allow clicking spotlighted elements
  callback={handleJoyrideCallback}
  styles={{
    options: {
      zIndex: 45,                      // Above HUD (40), below modals (50)
      arrowColor: 'transparent',       // We use our own pointer
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
  }}
/>
```

### Custom Tooltip Component

The `tooltipComponent` prop replaces Joyride's default tooltip with Cedric's avatar and speech bubble:

```typescript
function CedricTooltip({
  step,
  index,
  tooltipProps,
  primaryProps,
  backProps,
  skipProps,
  isLastStep,
}: TooltipRenderProps) {
  const { state: cedricState } = useCedric();

  return (
    <div {...tooltipProps} className="cedric-walkthrough-tooltip">
      {/* Step progress indicator */}
      <div className="text-xs text-amber-400 mb-1">
        Step [{index + 1}/{TOTAL_STEPS}]
        <button className="ml-4 text-gray-500 underline" {...skipProps}>
          Skip Tutorial
        </button>
      </div>

      {/* Speech bubble with walkthrough text */}
      <SpeechBubble
        message={{
          text: step.content as string,
          priority: 'walkthrough',
          typing: true,
          duration: 0,  // No auto-dismiss during walkthrough
          dismissible: false,
        }}
        theme={/* from ThemeContext */}
        onDismiss={() => {}}
        position="above"
      />

      {/* Avatar sprite in the tooltip */}
      <AvatarSprite
        size={128}
        equippedItems={/* from AdventureModeContext */}
        animationState={step.data?.avatarState || AnimationState.Pointing}
        colorPalette={null}
        level={/* from AdventureModeContext */}
        showPedestal={true}
        showNameplate={false}
      />
    </div>
  );
}
```

### Step Definitions

```typescript
interface WalkthroughStepData {
  avatarState: AnimationState;
  rewardXP: number;
  rewardGold: number;
  completionDetection: 'navigation' | 'action' | 'timer' | 'element-click';
  targetRoute?: string;         // Route to navigate to when step activates
  completionRoute?: string;     // Route that signals step completion
  completionSelector?: string;  // Element that must be clicked
  completionTimer?: number;     // Auto-complete after N ms
}

const WALKTHROUGH_STEPS: Step[] = [
  // Step 0: "Forge Your Identity" -- Navigate to Profile
  {
    target: '[data-tour="nav-profile"]',   // Sidebar nav item
    content: 'First, we must inscribe your name and abilities in the Guild Registry. The realm cannot match you to worthy quests without knowing your strengths!',
    placement: 'right',
    data: {
      avatarState: AnimationState.Pointing,
      rewardXP: 100,
      rewardGold: 50,
      completionDetection: 'action',       // Resume upload success callback
      targetRoute: '/profile',
    } as WalkthroughStepData,
  },
  // Step 1: "Survey the Quest Board" -- Navigate to Matches
  {
    target: '[data-tour="nav-matches"]',
    content: 'Now let us visit the Quest Board. The Guild has opportunities that match your abilities. This way!',
    placement: 'right',
    data: {
      avatarState: AnimationState.Pointing,
      rewardXP: 50,
      rewardGold: 0,
      completionDetection: 'timer',
      completionTimer: 5000,               // Auto-complete after 5s on page
      targetRoute: '/matches',
    } as WalkthroughStepData,
  },
  // Step 2: "Mark Your First Quest" -- Save a role
  {
    target: '[data-tour="save-role-button"]',
    content: 'A wise adventurer marks the quests that interest them most. Find a role that calls to you and press the "Mark Quest" button to save it!',
    placement: 'bottom',
    data: {
      avatarState: AnimationState.Pointing,
      rewardXP: 100,
      rewardGold: 50,
      completionDetection: 'action',       // Save role callback
    } as WalkthroughStepData,
  },
  // Step 3: "Chart Your Course" -- Navigate to Roadmap
  {
    target: '[data-tour="nav-roadmap"]',
    content: 'Every hero needs a map. Let us consult the Oracle of Paths to chart your journey. To the Adventure Path!',
    placement: 'right',
    data: {
      avatarState: AnimationState.Excited,
      rewardXP: 500,
      rewardGold: 200,
      completionDetection: 'action',       // Roadmap generation success callback
      targetRoute: '/roadmap',
    } as WalkthroughStepData,
  },
  // Step 4: "Visit the Merchant's Armory" -- Navigate to Store
  {
    target: '[data-tour="nav-store"]',
    content: 'You have earned gold through your deeds! Let us visit Old Grimshaw at the Merchant\'s Armory. He has wares that can... enhance your appearance.',
    placement: 'right',
    data: {
      avatarState: AnimationState.Excited,
      rewardXP: 50,
      rewardGold: 25,
      completionDetection: 'navigation',
      targetRoute: '/store',
    } as WalkthroughStepData,
  },
  // Step 5: "Don Your Gear" -- Equip first item
  {
    target: '[data-tour="inventory-tab"]',
    content: 'Switch to your Treasure Chest and equip those boots. You will see the change on me right away!',
    placement: 'bottom',
    data: {
      avatarState: AnimationState.Pointing,
      rewardXP: 50,
      rewardGold: 0,
      completionDetection: 'action',       // Equip callback
    } as WalkthroughStepData,
  },
  // Step 6: "Return to the Quest Board" -- Closing
  {
    target: 'body',                        // No specific element
    content: 'Your training is complete! As you grow in power, the Adventurer\'s Guild will offer you side quests for extra rewards. For now, return to the Quest Board and begin your journey in earnest!',
    placement: 'center',
    data: {
      avatarState: AnimationState.VictoryPose,
      rewardXP: 0,
      rewardGold: 0,
      completionDetection: 'timer',
      completionTimer: 5000,
    } as WalkthroughStepData,
  },
];
```

### Callback Integration

```typescript
function handleJoyrideCallback(data: CallbackProps) {
  const { action, status, index, type } = data;

  if (type === 'step:after') {
    // Step completed -- dispatch rewards
    const stepData = WALKTHROUGH_STEPS[index].data as WalkthroughStepData;
    if (stepData.rewardXP > 0) {
      addXP(stepData.rewardXP, 'walkthrough');
    }
    if (stepData.rewardGold > 0) {
      addGold(stepData.rewardGold, 'walkthrough');
    }

    // Persist step to backend
    progressionApi.completeWalkthroughStep(index + 1);

    // Advance to next step
    advanceWalkthrough();
  }

  if (status === 'finished' || action === 'skip') {
    completeWalkthrough();
  }
}
```

### First-Time User Detection

On `CedricProvider` mount:

```typescript
const { data: progression } = useQuery({ queryKey: QUERY_KEYS.progression, ... });

// Determine if this is a new user who needs onboarding
const isNewUser = !progression?.onboarding_complete && !progression?.walkthrough_completed;

// If new user, show the "Enable Adventure Mode?" prompt after 1.5s delay
useEffect(() => {
  if (isNewUser && !state.walkthroughActive) {
    const timer = setTimeout(() => {
      enqueueMessage({
        id: 'cedric-intro',
        text: 'Hail, traveler! I see you have just arrived at the realm of SpringAIS. My name is Cedric, and I shall be your guide through these lands.',
        priority: 'walkthrough',
        duration: 0,       // Don't auto-dismiss
        typing: true,
        dismissible: false,
        actions: [
          {
            id: 'enable-adventure',
            label: 'Enable Adventure Mode!',
            variant: 'primary',
            onClick: () => {
              enableAdventureMode();
              startWalkthrough();
            },
          },
          {
            id: 'maybe-later',
            label: 'Maybe Later',
            variant: 'ghost',
            onClick: () => handleMaybeLater(),
          },
        ],
      });
    }, 1500);
    return () => clearTimeout(timer);
  }
}, [isNewUser]);
```

The `onboarding_complete` field already exists on `UserProfile` (set to `False` on registration, currently unused). The new `walkthrough_completed` field on `UserProgression` tracks whether the avatar walkthrough specifically has been completed.

---

## 5. Speech Bubble System

### Message Interface

```typescript
interface SpeechMessage {
  id: string;                             // Unique message ID
  text: string;                           // Display text (supports medieval/modern variants)
  priority: SpeechPriority;
  duration: number;                       // Auto-dismiss in ms (0 = manual only)
  typing: boolean;                        // Enable typing animation
  typingSpeed?: number;                   // ms per character (default 25)
  actions?: SpeechAction[];               // Max 2 action buttons
  dismissible: boolean;                   // Show X button
  suppressible: boolean;                  // Show "Don't show again" link
  messageType?: string;                   // For frequency tracking key
  avatarState?: AnimationState;           // Set avatar state while showing
  onDismiss?: () => void;                 // Callback when dismissed
}

type SpeechPriority = 'walkthrough' | 'reward' | 'reaction' | 'proactive';
```

### Queue Management

Priority ordering (processed first):
1. `walkthrough` -- never dropped, never auto-dismissed
2. `reward` -- never dropped, auto-dismissed after duration
3. `reaction` -- dropped if queue > 3, auto-dismissed after duration
4. `proactive` -- lowest priority, first to drop, subject to cooldown and daily cap

**Queue overflow logic**:
```
if (queue.length >= 3) {
  queue = queue.filter(m => m.priority === 'walkthrough' || m.priority === 'reward');
}
```

**Route change behavior**:
- `walkthrough` and `reward` messages persist across navigation
- `reaction` and `proactive` messages are cleared on route change

### Timing

| Parameter | Value | Applies To |
|---|---|---|
| Default duration | 8000ms | All non-walkthrough messages |
| Typing speed | 25ms/char | Walkthrough and narrative messages |
| Button fade-in delay | 150ms after text completes | Messages with actions |
| Entrance animation | 250ms (opacity + translateY + scale) | All messages |
| Exit animation | 200ms (opacity + translateY) | All messages |
| Gap between messages | 500ms | Between queue items |
| Proactive cooldown | 90000ms (90s) | Between proactive messages |
| Session proactive cap | 8 messages | Per browser session |

### Medieval vs Modern Text

All dialogue text is stored in a config file with both variants:

**Location**: `frontend/src/components/avatar/cedricMessages.ts`

```typescript
interface MessageVariant {
  medieval: string;
  modern: string;
}

// Selected at render time based on adventureMode.enabled
function getCedricText(variant: MessageVariant, adventureEnabled: boolean): string {
  return adventureEnabled ? variant.medieval : variant.modern;
}
```

### Speech Bubble Visual Styles

**Game theme** (adventure mode on):
- Background: `linear-gradient(180deg, #F5E6C8 0%, #E8D5A8 100%)` (parchment)
- Border: `2px solid #8B6914`
- Font: `'Cinzel', serif` for "Cedric:" label, system sans-serif for body
- Text: `#3D2B1F` (dark brown)
- Max width: 280px
- Shadow: `0 4px 16px rgba(0, 0, 0, 0.3)`

**Light/dark themes** (adventure mode off):
- Background: `#FFFFFF` / `#2D2D3D`
- Border: `1px solid #E0E0E0` / `#404050`
- Font: System sans-serif throughout
- Rounded corners: 12px (more modern)
- Shadow: `0 2px 8px rgba(0, 0, 0, 0.1)` / `0 2px 12px rgba(0, 0, 0, 0.4)`

### Positioning Logic

The speech bubble renders **above** the avatar by default. If the avatar is in the top third of the viewport (e.g., during walkthrough when avatar is in a tooltip), the bubble flips to below. Calculation:

```typescript
const bubblePosition = avatarTop < window.innerHeight / 3 ? 'below' : 'above';
```

---

## 6. Animation System

### Animation States Enum

See the `AnimationState` enum in Section 3. There are 18 total states across three categories: idle progression, reactions, and contextual.

### CSS Sprite Sheet Approach

Animations use horizontal sprite strips at 64×64 per frame, animated with CSS `steps()`:

```css
.cedric-sprite {
  width: 64px;
  height: 64px;
  image-rendering: pixelated;
}

/* Idle breathing: 4 frames at 2fps (2s cycle) */
.cedric-sprite--idle {
  background: url('/assets/cedric/sprites/idle.png') no-repeat;
  animation: cedric-idle 2s steps(4) infinite;
}

@keyframes cedric-idle {
  from { background-position: 0 0; }
  to { background-position: -256px 0; }    /* 4 frames × 64px */
}

/* Look around: 3 frames (center, left, right) */
.cedric-sprite--lookAround {
  background: url('/assets/cedric/sprites/lookAround.png') no-repeat;
  animation: cedric-look 2s steps(3) 1;
}

/* Sitting: 2 frames (transition + sitting idle) */
.cedric-sprite--sitting {
  background: url('/assets/cedric/sprites/sitting.png') no-repeat;
  animation: cedric-sit 4s steps(2) infinite;
}

/* Sleeping: 2 frames + ZZZ particles */
.cedric-sprite--sleeping {
  background: url('/assets/cedric/sprites/sleeping.png') no-repeat;
  animation: cedric-sleep 4s steps(2) infinite;  /* Slower cycle */
}
```

### Framer Motion Reaction Animations

Reactions use Framer Motion `animate` for positional and scale transforms on the container, combined with CSS sprite swaps for the character pose:

```typescript
// XP gained: small jump
const xpJumpVariants = {
  initial: { y: 0 },
  animate: {
    y: [0, -6, 0],
    transition: { duration: 0.5, type: 'spring', stiffness: 300 }
  },
};

// Level up: big jump + scale pulse
const levelUpVariants = {
  initial: { y: 0, scale: 1 },
  animate: {
    y: [0, -16, 0],
    scale: [1, 1.1, 1],
    transition: { duration: 1.5, type: 'spring' }
  },
};

// Coin catch: coin falls from above
const coinCatchVariants = {
  initial: { y: -40, opacity: 0 },
  animate: {
    y: [null, 0],
    opacity: [null, 1],
    transition: { duration: 0.6, ease: 'easeIn' }
  },
};
```

### Animation Queue

When multiple game events fire in quick succession:

```typescript
interface AnimationQueueEntry {
  animation: AnimationState;
  duration: number;          // How long to hold before next
  onStart?: () => void;      // e.g., show floating "+50 XP" text
}
```

**Queue rules**:
1. Entries processed FIFO
2. Each animation plays for its `duration` before the next begins
3. If queue exceeds 3, intermediate `JumpXP` and `CatchCoin` are collapsed into a single combined animation showing total
4. `CelebrateLevelUp` and `HoldTrophy` are never collapsed

### Inactivity Timer

```typescript
// Managed inside CedricProvider
let inactivityTimer: number;

function resetInactivity() {
  clearTimeout(inactivityTimer);
  if (state.animationState === AnimationState.Sleeping) {
    triggerAnimation(AnimationState.WakeUp, 1000);
  }
  inactivityTimer = setTimeout(() => {
    if (state.animationState === AnimationState.Idle) {
      triggerAnimation(AnimationState.Sitting);
      inactivityTimer = setTimeout(() => {
        triggerAnimation(AnimationState.Sleeping);
      }, 90_000);  // 1.5 min more → sleeping
    }
  }, 30_000);  // 30s → sitting
}

// Listen for user activity
useEffect(() => {
  const handler = () => resetInactivity();
  window.addEventListener('mousemove', handler, { passive: true });
  window.addEventListener('keydown', handler, { passive: true });
  resetInactivity();
  return () => {
    window.removeEventListener('mousemove', handler);
    window.removeEventListener('keydown', handler);
    clearTimeout(inactivityTimer);
  };
}, []);
```

---

## 7. Asset Architecture

### Directory Structure

```
frontend/public/assets/cedric/
├── sprites/
│   ├── idle.png                    # 4-frame horizontal strip (256×64)
│   ├── lookAround.png              # 3-frame strip (192×64)
│   ├── sitting.png                 # 2-frame strip (128×64)
│   ├── sleeping.png                # 2-frame strip (128×64)
│   ├── wakeUp.png                  # 3-frame strip (192×64)
│   ├── jumpXP.png                  # 3-frame strip (192×64)
│   ├── celebrateLevelUp.png        # 6-frame strip (384×64)
│   ├── catchCoin.png               # 3-frame strip (192×64)
│   ├── holdTrophy.png              # 2-frame strip (128×64)
│   ├── victoryPose.png             # 3-frame strip (192×64)
│   ├── spinNewItem.png             # 4-frame strip (256×64)
│   ├── waveHello.png               # 4-frame strip (256×64)
│   ├── thinking.png                # 2-frame strip (128×64)
│   ├── reading.png                 # 2-frame strip (128×64)
│   ├── pointing.png                # 1 frame (64×64)
│   ├── confused.png                # 2-frame strip (128×64)
│   ├── excited.png                 # 3-frame strip (192×64)
│   ├── lookingFar.png              # 1 frame (64×64)
│   ├── tracingLines.png            # 3-frame strip (192×64)
│   └── lookingUp.png               # 1 frame (64×64)
├── equipment/
│   ├── armor/
│   │   ├── bronze-armor.png        # 64×64 transparent overlay
│   │   ├── iron-chainmail.png
│   │   ├── steel-plate-armor.png
│   │   └── golden-armor.png
│   ├── cape/
│   │   ├── travelers-cloak.png
│   │   ├── silver-cloak.png
│   │   ├── phoenix-cloak.png
│   │   ├── shadow-mantle.png
│   │   └── arena-champion-cape.png
│   ├── boots/
│   │   ├── leather-boots.png
│   │   ├── iron-shod-boots.png
│   │   ├── winged-sandals.png
│   │   └── void-walkers.png
│   ├── hairstyle/
│   │   ├── classic-warrior-cut.png
│   │   ├── noble-braids.png
│   │   ├── crown-of-flames.png
│   │   ├── celestial-locks.png
│   │   └── legendary-crown.png
│   ├── jewelry/
│   │   ├── copper-ring.png
│   │   ├── silver-amulet.png
│   │   ├── guild-ring.png
│   │   ├── dragon-pendant.png
│   │   └── merchant-ring.png
│   ├── banner/
│   │   ├── apprentice-banner.png
│   │   ├── knights-standard.png
│   │   ├── dragon-banner.png
│   │   ├── legendary-crest.png
│   │   └── scribes-quill-banner.png
│   └── emblem/
│       ├── novice-emblem.png
│       ├── scholars-seal.png
│       ├── dragon-emblem.png
│       ├── legendary-crown-emblem.png
│       ├── knights-crest-emblem.png
│       └── squires-trial-emblem.png  # Onboarding reward
├── pedestals/
│   ├── pedestal-level-1.png        # Plain grey stone
│   ├── pedestal-level-3.png        # Stone with moss
│   ├── pedestal-level-5.png        # Polished stone
│   ├── pedestal-level-7.png        # Dark marble with gold
│   └── pedestal-level-9.png        # Gilded with glow
├── particles/
│   ├── confetti.png                # Sprite sheet of confetti pieces
│   ├── sparkle.png                 # Sparkle particle
│   ├── zzz.png                     # Z character for sleeping
│   └── coin.png                    # Gold coin (8×8)
└── modern/
    └── compass-icon.png            # 32×32 modern guide icon
```

### Naming Convention

Equipment assets: `{slug}.png` where slug is derived from item name via `toLowerCase().replace(/[^a-z0-9]+/g, '-')`.

Example: "Iron Chainmail" → `iron-chainmail.png`

The mapping from cosmetic item to asset path:

```typescript
function getEquipmentAssetPath(category: string, itemName: string): string {
  const slug = itemName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `/assets/cedric/equipment/${category}/${slug}.png`;
}
```

### Layer Z-Order

| Z-Index | Layer | Slot |
|---|---|---|
| 0 | Banner | `banner` |
| 1 | Base body sprite | (always) |
| 2 | Boots | `boots` |
| 3 | Armor | `armor` |
| 4 | Cape | `cape` |
| 5 | Hairstyle | `hairstyle` |
| 6 | Jewelry | `jewelry` |
| 7 | Emblem | `emblem` |
| 8 | Rarity effects | (computed from equipped items) |
| 9 | Color palette overlay | `color_palette` (mix-blend-mode) |

### MVP Placeholder Strategy

For Phase 1 (MVP), equipment layers are **not rendered**. The base character sprite is sufficient. Equipment rendering begins in Phase 2. The `AvatarSprite` component accepts `equippedItems` from day one but gracefully renders nothing for slots where no asset file exists (the `<img>` has `onError` handler that hides the element).

### Color Palette Implementation

```typescript
// Color palette is CSS-only, no image asset needed
const COLOR_PALETTE_MAP: Record<string, string> = {
  'Earth Tones': 'rgba(139, 115, 85, 0.15)',
  'Royal Purple': 'rgba(128, 0, 128, 0.12)',
  'Crimson & Gold': 'rgba(180, 50, 20, 0.10)',
};

// Applied as an overlay div with mix-blend-mode: multiply
<div
  style={{
    position: 'absolute',
    inset: 0,
    backgroundColor: paletteColor,
    mixBlendMode: 'multiply',
    pointerEvents: 'none',
    zIndex: 9,
  }}
/>
```

### Rarity Visual Effects

| Rarity | Effect | Implementation |
|---|---|---|
| Common | None | No additional CSS |
| Uncommon | Shimmer sweep every 4s | CSS `@keyframes shimmer` with `background-position` animation on a gradient overlay |
| Rare | Soft blue glow outline | CSS `filter: drop-shadow(0 0 2px #3b82f6) drop-shadow(0 0 4px rgba(59,130,246,0.5))` on the equipment `<img>` |
| Epic | Purple particle dots (3-5) orbiting | Framer Motion animated `<div>` dots with circular motion keyframes |
| Legendary | Golden aura + sparkle particles | CSS `box-shadow: 0 0 8px rgba(255,215,0,0.6)` + Framer Motion sparkle dots |

The highest rarity among all equipped items determines an additional container-level effect. Individual item rarity effects apply per-layer.

---

## 8. Onboarding Flow Architecture

### Detection: Is This a New User?

```
CedricProvider mounts
  → reads progressionApi.getProgression()
  → checks: progression.walkthrough_completed === false (new field)
  → checks: userProfile.onboarding_complete === false (existing field)
  → if both false → isNewUser = true → Cedric onboarding mode
```

### Complete Flow

```
1. User registers → POST /auth/register
   → Creates user + progression row (existing behavior)
   → Redirect to "/" → HomeRedirect → /matches (empty)

2. /matches loads with empty state (no skills/resume)
   → CedricProvider detects isNewUser
   → After 1.5s delay: Cedric entrance animation (slide up from bottom with dust cloud)
   → After 0.8s more: Speech bubble with intro text + adventure mode prompt

3. User clicks "Enable Adventure Mode!" OR "Maybe Later"

   IF "Enable Adventure Mode!":
     → toggleAdventureMode() → POST /progression/toggle-adventure-mode
     → Theme switches to 'game'
     → AdventureHUD slides in
     → Quest notification: "THE SQUIRE'S TRIAL" (speech bubble)
     → After "Begin Quest" or 5s: React Joyride activates
     → Walkthrough begins (Steps 0-6, see Section 4)

   IF "Maybe Later":
     → Speech bubble: "No worries! Want a quick tour without the medieval flair?"
     → "Sure, show me around!" → Same walkthrough with modern language
     → "I'll explore on my own" → Cedric minimizes to compass icon
     → POST /progression/complete-onboarding (marks onboarding as dismissed)

4. Each walkthrough step:
   → Spotlight targets UI element (data-tour selector)
   → Cedric speaks walkthrough text in tooltip
   → User performs action (or timer auto-completes)
   → POST /progression/walkthrough-step with step index
   → Reward dispatch via reward_hook_service
   → NotificationToasts show XP/Gold gains
   → Cedric plays reaction animation (JumpXP)

5. Step 4 (Roadmap): special handling
   → If user generates roadmap → Oracle Sequence plays (Section 9)
   → Walkthrough pauses until roadmap completes
   → Large reward on completion (+500 XP, +200 Gold)

6. Step 4 (Store): free Leather Boots granted
   → POST /progression/walkthrough-step triggers one-time reward hook
   → Backend grants "Leather Boots" to inventory
   → Gift notification in speech bubble

7. All steps complete → Walkthrough Complete celebration
   → React Joyride overlay dismissed
   → Level Up celebration animation (confetti, glow, jump)
   → Quest completion banner (parchment card with rewards)
   → "Squire's Trial" emblem cosmetic awarded
   → POST /progression/complete-onboarding
   → Backend: onboarding_complete = true, walkthrough_completed = true
   → Quest "The Squire's Trial" marked completed in quest system
   → Cedric: "I am proud to call you my companion, adventurer."
   → Enters persistent companion mode
```

### Walkthrough as a Real Quest

"The Squire's Trial" is seeded in the `side_quest_catalog` as a level-0 quest. Unlike other quests (level 3+), it is available immediately and auto-started on registration. Its requirements track walkthrough step completion:

```python
# In quest_seed.py (new entry)
{
    "name": "The Squire's Trial",
    "description": (
        "Every legend begins with a single step. Prove your worth "
        "by mastering the tools of the realm."
    ),
    "level_required": 0,           # Available at level 0 (new users)
    "xp_reward": 950,              # Total quest XP
    "coin_reward": 475,            # Total quest gold
    "sort_order": 1,               # First in list
    "requirements": [
        {"type": "walkthrough_step", "target_id": None, "count": 7,
         "description": "Complete all walkthrough steps"},
    ],
}
```

### Squire's Trial Emblem

A new cosmetic item in `cosmetic_seed.py`:

```python
{
    "name": "Squire's Trial Emblem",
    "description": "A shield bearing a quill and compass. Awarded for completing the Squire's Trial.",
    "category": "emblem",
    "rarity": "uncommon",
    "coin_price": 0,
    "level_required": 0,
    "is_quest_exclusive": True,
    "sort_order": 84,
}
```

### Step Completion Detection

Each walkthrough step uses a specific detection mechanism:

| Step | Detection | How |
|---|---|---|
| 0: Profile/Resume | `action` | Listen for `resume_uploaded` event via `reward_hook_service` callback |
| 1: View Matches | `timer` | 5s after navigating to `/matches`, or on scroll/click |
| 2: Save a Role | `action` | Listen for `role_saved` event |
| 3: Generate Roadmap | `action` | Listen for `roadmap_generated` event |
| 4: Visit Store | `navigation` | Route change to `/store` |
| 5: Equip Item | `action` | Listen for `storeApi.equip()` success |
| 6: Closing | `timer` | 5s auto-complete |

Detection is implemented via React Query mutation success callbacks and route change listeners in `CedricProvider`.

### Backend Endpoint

```
POST /api/progression/complete-onboarding
```

**Request**: Empty body (user ID from auth token)

**Response**:
```json
{
  "onboarding_complete": true,
  "walkthrough_completed": true,
  "rewards": {
    "xp_total": 950,
    "gold_total": 475,
    "cosmetic_id": "...",
    "cosmetic_name": "Squire's Trial Emblem"
  }
}
```

**Backend logic**:
1. Set `user_profiles.onboarding_complete = True`
2. Set `user_progression.walkthrough_completed = True`
3. Set `user_progression.walkthrough_step = 7`
4. Complete "The Squire's Trial" quest via `quest_service`
5. Award the "Squire's Trial Emblem" cosmetic to user inventory
6. Return summary

---

## 9. Loading Narrator Architecture

### Hook: `useCedricNarrator`

**Location**: `frontend/src/components/avatar/useCedricNarrator.ts`

```typescript
interface NarratorPhase {
  minTime: number;               // Earliest time (ms) this phase can start
  maxTime: number;               // Latest time this phase transitions
  dialogue: MessageVariant;      // Medieval/modern text
  avatarState: AnimationState;
  tip?: MessageVariant;          // Optional cycling tip below progress bar
}

interface NarratorConfig {
  phases: NarratorPhase[];
  queryKey: readonly unknown[];  // React Query key to monitor
  onComplete?: () => void;       // Called when loading finishes
}

function useCedricNarrator(config: NarratorConfig): {
  isLoading: boolean;
  currentPhase: NarratorPhase | null;
  progress: number;              // 0-100 estimated progress
  elapsedTime: number;
  tip: string | null;
} {
  // 1. Monitor React Query loading state for the given queryKey
  // 2. Track elapsed time since loading began
  // 3. Determine current phase based on elapsed time
  // 4. Calculate estimated progress (phase-based percentage)
  // 5. Cycle tips within the current phase
}
```

### Oracle Sequence (Roadmap Generation)

The roadmap generation loading screen is the most elaborate narrator sequence:

```typescript
const ORACLE_PHASES: NarratorPhase[] = [
  {
    minTime: 0,
    maxTime: 15000,
    dialogue: {
      medieval: 'Ah, you seek the Oracle\'s wisdom! Let me consult the ancient tomes...',
      modern: 'Starting your career path analysis...',
    },
    avatarState: AnimationState.Reading,
    tip: {
      medieval: 'While we wait -- did you know you earn XP for completing roadmap milestones?',
      modern: 'Tip: You earn rewards for completing milestones on your roadmap.',
    },
  },
  {
    minTime: 15000,
    maxTime: 30000,
    dialogue: {
      medieval: 'The scribes are studying your skills and achievements. Your abilities are... impressive!',
      modern: 'Analyzing your skills and experience...',
    },
    avatarState: AnimationState.Thinking,
    tip: {
      medieval: 'Adventurers who follow their roadmap are more likely to reach their career goals.',
      modern: 'Following a structured roadmap significantly improves career outcomes.',
    },
  },
  {
    minTime: 30000,
    maxTime: 60000,
    dialogue: {
      medieval: 'The cartographers are mapping your optimal path through the realm...',
      modern: 'Mapping your optimal learning path...',
    },
    avatarState: AnimationState.TracingLines,
  },
  {
    minTime: 60000,
    maxTime: 90000,
    dialogue: {
      medieval: 'Your destiny is nearly revealed... The stars are aligning in your favor!',
      modern: 'Almost done -- finalizing your personalized roadmap...',
    },
    avatarState: AnimationState.LookingUp,
  },
  {
    minTime: 90000,
    maxTime: Infinity,
    dialogue: {
      medieval: 'Any moment now... The Oracle works to ensure every detail is perfect.',
      modern: 'Putting the finishing touches on your roadmap...',
    },
    avatarState: AnimationState.Excited,
  },
];
```

### Integration Pattern

The `useCedricNarrator` hook wraps existing loading states without modifying the underlying data-fetching code:

```typescript
// In RoadmapPage.tsx (or a wrapper component)
function RoadmapLoadingNarrator({ queryKey }: { queryKey: readonly unknown[] }) {
  const { isLoading, currentPhase, progress, tip } = useCedricNarrator({
    phases: ORACLE_PHASES,
    queryKey,
  });

  if (!isLoading || !currentPhase) return null;

  return (
    <div className="flex flex-col items-center py-12">
      {/* Speech bubble */}
      <SpeechBubble
        message={{
          text: getCedricText(currentPhase.dialogue, adventureEnabled),
          priority: 'reaction',
          duration: 0,
          typing: false,
          dismissible: false,
        }}
        theme={theme}
        onDismiss={() => {}}
        position="above"
      />

      {/* Enlarged avatar (192×192) */}
      <AvatarSprite
        size={192}
        equippedItems={equippedItems}
        animationState={currentPhase.avatarState}
        colorPalette={colorPalette}
        level={level}
        showPedestal={true}
        showNameplate={false}
      />

      {/* Progress bar */}
      <div className="w-80 mt-6">
        <div className="h-3 rounded-full overflow-hidden bg-amber-900/30">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-700 via-yellow-500 to-amber-700"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="text-center text-sm mt-2 text-amber-200/70">
          {progress}%
        </div>
      </div>

      {/* Tip */}
      {tip && (
        <div className="mt-4 text-center text-sm text-amber-200/50 max-w-md">
          {tip}
        </div>
      )}
    </div>
  );
}
```

### Generic Loading Fallback

For shorter loading states (match results, store catalog, etc.):

```typescript
const GENERIC_LOADING_PHASES: NarratorPhase[] = [
  {
    minTime: 0,
    maxTime: Infinity,
    dialogue: {
      medieval: 'One moment, adventurer...',
      modern: 'Loading...',
    },
    avatarState: AnimationState.Thinking,
  },
];
```

For loads under 2 seconds, no speech bubble is shown -- only the avatar state changes briefly.
For loads over 5 seconds, the speech bubble appears after a 1-second delay.

### Completion Animation

When loading finishes:
1. Avatar switches to `Excited` state
2. If roadmap: scroll reveal animation (sprite swap to holding scroll, 1.5s)
3. Confetti burst (8 particles, gold and blue)
4. Completion speech bubble fades in
5. After 1s: loading area fades out, results fade in
6. Avatar returns to normal size in fixed position

---

## 10. Contextual Guidance Architecture

### Page Config Map

**Location**: `frontend/src/components/avatar/cedricPageConfig.ts`

```typescript
interface PageConfig {
  firstVisitMessage: MessageVariant;
  firstVisitAvatarState: AnimationState;
  returnMessages: MessageVariant[];   // Rotated, shown with frequency decay
  returnAvatarState: AnimationState;
  emptyStateMessage?: MessageVariant; // Shown when page has no data
  emptyStateAvatarState?: AnimationState;
  proactiveSuggestions?: ProactiveSuggestion[];
}

interface ProactiveSuggestion {
  id: string;
  trigger: 'idle_time' | 'data_condition';
  condition?: (state: { gold: number; level: number; daysAway: number }) => boolean;
  message: MessageVariant;
  avatarState: AnimationState;
}

const PAGE_CONFIGS: Record<string, PageConfig> = {
  '/matches': {
    firstVisitMessage: {
      medieval: 'Welcome to the Quest Board! Each card shows a role matched to your abilities. Save the ones that interest you.',
      modern: 'Welcome to your matched roles! Each card shows a role based on your skills. Save the ones you like.',
    },
    firstVisitAvatarState: AnimationState.Pointing,
    returnMessages: [
      {
        medieval: 'Back to scout for opportunities? The realm always has new quests.',
        modern: 'Checking for new matches? Great habit!',
      },
    ],
    returnAvatarState: AnimationState.LookAround,
    emptyStateMessage: {
      medieval: 'Hmm, the Quest Board is empty. Have you uploaded your scroll of abilities on the Hero Sheet?',
      modern: 'No matches yet. Try uploading your resume on the Profile page.',
    },
    emptyStateAvatarState: AnimationState.Confused,
  },
  '/profile': { /* ... */ },
  '/saved': { /* ... */ },
  '/roadmap': { /* ... */ },
  '/store': { /* ... */ },
  '/quests': { /* ... */ },
  '/success-patterns': { /* ... */ },
};
```

### Tip Tracking

Tips are tracked to prevent repetition:

```typescript
// localStorage keys:
// cedric-first-visit-{path}     : boolean (has first visit been shown)
// cedric-msg-freq-{messageType} : number (how many times shown)
// cedric-msg-suppress-{messageType} : boolean (user clicked "Don't show again")
```

### Anti-Annoyance Protocol

Implemented in `CedricProvider`:

```typescript
function shouldShowProactiveMessage(messageType: string): boolean {
  // Rule 1: Quiet mode
  if (state.quietMode) return false;

  // Rule 2: Session cap
  if (state.sessionMessageCount >= 8) return false;

  // Rule 3: Cooldown
  if (Date.now() - state.lastMessageTimestamp < 90_000) return false;

  // Rule 4: Suppressed by user
  if (localStorage.getItem(`cedric-msg-suppress-${messageType}`)) return false;

  // Rule 5: Frequency decay
  const showCount = parseInt(localStorage.getItem(`cedric-msg-freq-${messageType}`) || '0');
  const probability = Math.max(0.1, 1 / Math.pow(2, showCount));
  if (Math.random() > probability) return false;

  // Rule 6: No exact repeats
  if (state.currentMessage?.messageType === messageType) return false;

  return true;
}
```

**Frequency decay formula**:
- 1st showing: 100% probability
- 2nd showing: 50%
- 3rd showing: 25%
- 4th+ showing: 10% (minimum floor)

### Route Change Listener

```typescript
// Inside CedricProvider
const location = useLocation();

useEffect(() => {
  // Clear non-persistent messages
  clearQueueExcept(['walkthrough', 'reward']);

  // Check if this is a first visit
  const path = location.pathname;
  const pageConfig = PAGE_CONFIGS[path];
  if (!pageConfig) return;

  const hasVisited = localStorage.getItem(`cedric-first-visit-${path}`);

  if (!hasVisited && !state.walkthroughActive) {
    // First visit message
    enqueueMessage({
      id: `first-visit-${path}`,
      text: getCedricText(pageConfig.firstVisitMessage, adventureEnabled),
      priority: 'reaction',
      duration: 8000,
      typing: false,
      dismissible: true,
      suppressible: false,
      avatarState: pageConfig.firstVisitAvatarState,
    });
    localStorage.setItem(`cedric-first-visit-${path}`, 'true');
  } else if (hasVisited && !state.walkthroughActive) {
    // Return visit -- subject to anti-annoyance rules
    const returnMsg = pageConfig.returnMessages[
      Math.floor(Math.random() * pageConfig.returnMessages.length)
    ];
    if (returnMsg && shouldShowProactiveMessage(`return-${path}`)) {
      enqueueMessage({
        id: `return-${path}-${Date.now()}`,
        text: getCedricText(returnMsg, adventureEnabled),
        priority: 'proactive',
        duration: 8000,
        typing: false,
        dismissible: true,
        suppressible: true,
        messageType: `return-${path}`,
        avatarState: pageConfig.returnAvatarState,
      });
    }
  }
}, [location.pathname]);
```

### Quiet Mode

Toggled via right-click context menu on the avatar. Stored in `localStorage`:

```typescript
// Key: cedric-quiet-mode (boolean)

// When quiet mode is on:
// - No proactive suggestions
// - First-visit messages still shown (once per page, ever)
// - Reaction animations still play
// - Speech bubbles for reactions are suppressed
// - Walkthrough/onboarding messages are unaffected
```

---

## 11. Backend Changes

### New Fields on `user_progression` Table

| Field | Type | Default | Description |
|---|---|---|---|
| `walkthrough_step` | `Integer` | `0` | Current walkthrough step (0-7) |
| `walkthrough_completed` | `Boolean` | `False` | Whether walkthrough has been completed or skipped |

**Migration**: New Alembic migration `031_add_walkthrough_fields.py`:

```python
# In migration
op.add_column('user_progression',
    sa.Column('walkthrough_step', sa.Integer(), nullable=False, server_default='0'))
op.add_column('user_progression',
    sa.Column('walkthrough_completed', sa.Boolean(), nullable=False, server_default='false'))
```

### Updated `UserProgression` Model

Add to `backend/app/models/progression.py`:

```python
class UserProgression(Base, TimestampMixin):
    # ... existing fields ...
    walkthrough_step: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    walkthrough_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
```

### New Seed Data

#### "The Squire's Trial" Quest

Add to `quest_seed.py`:

```python
{
    "name": "The Squire's Trial",
    "description": (
        "Every legend begins with a single step. Prove your worth "
        "by mastering the tools of the realm."
    ),
    "level_required": 0,
    "xp_reward": 950,
    "coin_reward": 475,
    "sort_order": 1,
    "requirements": [
        {
            "type": "walkthrough_step",
            "target_id": None,
            "count": 7,
            "description": "Complete the onboarding walkthrough",
        },
    ],
},
```

#### "Squire's Trial Emblem" Cosmetic

Add to `cosmetic_seed.py`:

```python
{
    "name": "Squire's Trial Emblem",
    "description": "A shield bearing a quill and compass. Awarded for completing the Squire's Trial.",
    "category": "emblem",
    "rarity": "uncommon",
    "coin_price": 0,
    "level_required": 0,
    "is_quest_exclusive": True,
    "sort_order": 84,
},
```

### New API Endpoints

#### `POST /progression/walkthrough-step`

Records completion of a walkthrough step and dispatches step-specific rewards.

```python
@router.post("/walkthrough-step")
def record_walkthrough_step(
    request: WalkthroughStepRequest,  # { step: int }
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user_from_token),
):
    prog = db.query(UserProgression).filter(
        UserProgression.user_id == current_user.id
    ).with_for_update().first()

    if prog is None or request.step <= prog.walkthrough_step:
        return {"step": prog.walkthrough_step if prog else 0, "already_completed": True}

    prog.walkthrough_step = request.step
    db.flush()

    # Dispatch step reward via reward_hook_service
    reward = reward_hook_service.process_action(
        db, current_user.id,
        event_type="walkthrough_step",
        event_key=f"walkthrough_step:{request.step}",
        metadata={"step": request.step},
    )

    db.commit()

    return {
        "step": request.step,
        "already_completed": False,
        "reward": {
            "xp_awarded": reward.xp_awarded if reward else 0,
            "coins_awarded": reward.coins_awarded if reward else 0,
        },
    }
```

#### `POST /progression/complete-onboarding`

Marks onboarding as complete and awards final quest rewards.

```python
@router.post("/complete-onboarding")
def complete_onboarding(
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user_from_token),
):
    # 1. Mark user profile onboarding complete
    current_user.onboarding_complete = True
    db.flush()

    # 2. Mark walkthrough complete
    prog = db.query(UserProgression).filter(
        UserProgression.user_id == current_user.id
    ).with_for_update().first()
    prog.walkthrough_completed = True
    prog.walkthrough_step = 7
    db.flush()

    # 3. Complete "The Squire's Trial" quest
    quest = db.query(SideQuestCatalog).filter(
        SideQuestCatalog.name == "The Squire's Trial"
    ).first()
    if quest:
        quest_service.complete_quest(db, current_user.id, quest.id)

    # 4. Award "Squire's Trial Emblem"
    emblem = db.query(CosmeticCatalog).filter(
        CosmeticCatalog.name == "Squire's Trial Emblem"
    ).first()
    if emblem:
        store_service.grant_cosmetic(db, current_user.id, emblem.id, source="quest_reward")

    db.commit()

    return {
        "onboarding_complete": True,
        "walkthrough_completed": True,
    }
```

### Updated `ProgressionState` Response

Add to the `get_progression` endpoint response:

```python
return {
    # ... existing fields ...
    "walkthrough_step": prog.walkthrough_step,
    "walkthrough_completed": prog.walkthrough_completed,
    "onboarding_complete": user.onboarding_complete,  # From UserProfile
}
```

### Updated Frontend Types

```typescript
// In progressionService.ts
export interface ProgressionState {
  // ... existing fields ...
  walkthrough_step: number;
  walkthrough_completed: boolean;
  onboarding_complete: boolean;
}
```

### New Reward Config Entries

Add to `REWARD_CONFIG` in `reward_hook_service.py`:

```python
"walkthrough_step": RewardConfig(xp=50, coins=25),   # Base per-step reward
```

Step-specific bonus rewards (beyond the base) are handled by the walkthrough step endpoint based on step index.

---

## 12. ADR Log

### D-CA-001: Separate CedricContext

**Decision**: Create a new `CedricContext` rather than extending `AdventureModeContext`.

**Rationale**:
- `AdventureModeContext` already has 15+ state fields and 12+ actions. Adding Cedric's state (animation, speech queue, walkthrough progress, guidance config) would push it past 30 fields, violating single responsibility.
- Cedric can be feature-flagged independently (e.g., disable avatar but keep gamification).
- Testing is simpler with a focused context.
- `CedricContext` reads from `AdventureModeContext` via `useAdventureMode()` -- no data duplication.

**Alternative considered**: Extend `AdventureModeContext`. Rejected due to complexity and coupling.

### D-CA-002: DOM/CSS Layers for Equipment Rendering

**Decision**: Use stacked `<img>` elements with `position: absolute` and z-index ordering.

**Rationale**:
- Zero additional dependencies (no PixiJS, no Canvas)
- Proven by Habitica at scale (millions of users)
- Sufficient performance for <10 layers on a single widget
- Easy to debug via browser dev tools
- Compatible with existing Framer Motion for reactions

**Alternative considered**: PixiJS (`@pixi/react`). Rejected: ~200KB bundle addition for a single small widget.

### D-CA-003: CSS Sprite Sheets + Framer Motion for Animation

**Decision**: Frame-based animations via CSS `@keyframes` with `steps()`, positional/scale animations via Framer Motion.

**Rationale**:
- Framer Motion is already in the project (11.18.2)
- CSS sprite sheets are the standard for pixel art animation
- No new dependencies
- Clear separation: CSS handles sprite frame cycling, Framer Motion handles container transforms

### D-CA-004: Priority Speech Queue with Anti-Annoyance Protocol

**Decision**: FIFO queue with 4 priority levels, frequency decay, cooldowns, session caps, and quiet mode.

**Rationale**:
- Multiple message sources (walkthrough, rewards, reactions, proactive tips) need coordination
- The #1 risk for companion characters is becoming annoying (Clippy problem)
- The anti-annoyance protocol (frequency decay, 90s cooldown, 8-message session cap, quiet mode) prevents this
- Priority levels ensure walkthrough and reward messages are never dropped

### D-CA-005: Walkthrough as Real Quest

**Decision**: "The Squire's Trial" is a seeded quest in `side_quest_catalog` with backend progression tracking.

**Rationale**:
- Leverages existing quest infrastructure (no new tables)
- Quest completion awards cosmetic reward via existing `cosmetic_reward_id` foreign key
- Progress tracked server-side (survives logout/device change)
- Consistent with the platform's gamification model: every user action = rewards

### D-CA-006: React Joyride for Walkthrough Engine

**Decision**: Use `react-joyride` (MIT, ~25KB) as the walkthrough spotlight overlay engine.

**Rationale**:
- Custom `tooltipComponent` prop allows rendering Cedric as the tooltip (no forced UI)
- Rich callback system for step transitions, rewards, and navigation
- Built-in spotlight overlay with click-through support
- React 18 compatible, TypeScript types included
- MIT license (free for commercial use)
- Largest React-specific walkthrough community

**Alternative considered**: Shepherd.js (more stars but less React-native), OnboardJS (headless but newer/smaller community).

---

## File Inventory

### New Frontend Files

```
frontend/src/
├── components/avatar/
│   ├── AvatarCompanion.tsx           # Root persistent component
│   ├── AvatarSprite.tsx              # Layered sprite rendering
│   ├── SpeechBubble.tsx              # Speech bubble with typing, buttons
│   ├── CharacterSheet.tsx            # Mini popup equipment panel
│   ├── WalkthroughOverlay.tsx        # React Joyride wrapper
│   ├── CedricTooltip.tsx             # Custom Joyride tooltip (avatar + bubble)
│   ├── AvatarLoadingStage.tsx        # 192×192 narrator for loading screens
│   ├── useCedricNarrator.ts          # Hook for loading state narration
│   ├── cedricMessages.ts             # All dialogue text (medieval + modern)
│   ├── cedricPageConfig.ts           # Page-specific guidance config
│   ├── cedricAnimations.ts           # Animation state machine + queue logic
│   ├── cedricConfig.ts               # Timing, sizing, and behavior constants
│   └── index.ts                      # Barrel export
├── context/
│   └── CedricContext.tsx             # Cedric state management
└── (modified)
    ├── App.tsx                       # Add CedricProvider to tree
    ├── components/layout/MainLayout.tsx  # Render AvatarCompanion
    └── services/progressionService.ts   # Add walkthrough fields to types
```

### New Backend Files

```
backend/
├── alembic/versions/
│   └── 031_add_walkthrough_fields.py      # Migration for new columns
├── app/data/
│   ├── cosmetic_seed.py                   # (modified) Add Squire's Trial Emblem
│   └── quest_seed.py                      # (modified) Add The Squire's Trial quest
├── app/routes/
│   └── progression.py                     # (modified) Add walkthrough-step and complete-onboarding endpoints
├── app/models/
│   └── progression.py                     # (modified) Add walkthrough_step, walkthrough_completed fields
└── app/services/
    └── reward_hook_service.py             # (modified) Add walkthrough_step to REWARD_CONFIG
```

### New Asset Files

```
frontend/public/assets/cedric/
├── sprites/                               # 20 sprite sheet PNGs
├── equipment/                             # 37 equipment overlay PNGs (8 subdirectories)
├── pedestals/                             # 5 pedestal PNGs
├── particles/                             # 4 particle PNGs
└── modern/                                # 1 compass icon PNG
```

Total new image assets: ~67 files. Phase 1 (MVP) requires only: base idle sprite, 1-2 sprite poses (pointing, waveHello), and the compass icon (~5 files).
