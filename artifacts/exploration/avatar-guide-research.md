# Avatar-as-Guide Research: Onboarding Walkthrough & AI Assistant Persona

## 1. Current App Flow Analysis

### User Journey Map (Text-Based)

```
UNAUTHENTICATED FLOW:
  /login ──────────────> LoginPage (email + password)
       │                      │
       │                      ├── Success ──> "/" ──> HomeRedirect ──> /matches
       │                      └── "New here?" link
       │
  /register ───────────> RegisterPage (name + email + password)
       │                      │
       │                      ├── Success ──> "/" ──> HomeRedirect ──> /matches
       │                      └── "Already have an account?" link
       │
  /forgot-password ────> ForgotPasswordPage

AUTHENTICATED FLOW (wrapped in ProtectedRoute > AdventureModeProvider > MainLayout):
  ┌─────────────────────────────────────────────────────────────┐
  │  MainLayout                                                 │
  │  ┌──────────── Header ─────────────────────────────────┐   │
  │  │  "SkillBridge" logo | Nav tabs | Theme | User/Logout│   │
  │  └─────────────────────────────────────────────────────┘   │
  │  ┌── AdventureHUD (if enabled) ────────────────────────┐   │
  │  │  Level badge | XP bar | Gold | Achievements | Store │   │
  │  └─────────────────────────────────────────────────────┘   │
  │  ┌── Content (<Outlet>) ───────────────────────────────┐   │
  │  │                                                      │   │
  │  │  /matches ──────> MatchResultsPage (LANDING PAGE)   │   │
  │  │     - Shows role matches scored against user profile │   │
  │  │     - "Save" button on each match card              │   │
  │  │     - Click card -> /role/:roleId detail page       │   │
  │  │                                                      │   │
  │  │  /profile ──────> ProfilePage                       │   │
  │  │     - Resume upload, skills, current role           │   │
  │  │                                                      │   │
  │  │  /saved ────────> SavedRolesPage                    │   │
  │  │     - Roles user has bookmarked                     │   │
  │  │                                                      │   │
  │  │  /roadmap ──────> RoadmapPage                       │   │
  │  │     - List saved roadmaps OR create new             │   │
  │  │     - Select target roles from saved roles          │   │
  │  │     - Customize (emphasis, timeline, certs)         │   │
  │  │     - Generate via AI (1-2 min wait)                │   │
  │  │     - View roadmap with progress tracking           │   │
  │  │                                                      │   │
  │  │  /success-patterns > SuccessPatternPage             │   │
  │  │  /store ────────> StorePage (adventure mode only)    │   │
  │  │  /quests ───────> QuestsPage (level >= 3 only)      │   │
  │  │                                                      │   │
  │  └─────────────────────────────────────────────────────┘   │
  │  ┌── NotificationToasts ───────────────────────────────┐   │
  │  │  XP gains, gold gains, achievements, level-ups      │   │
  │  └─────────────────────────────────────────────────────┘   │
  └─────────────────────────────────────────────────────────────┘
```

### Key First-Time User Flow

1. User arrives at `/register` -> creates account (name, email, password)
2. Backend creates user + progression row on registration
3. Redirect to `/` -> `HomeRedirect` sends to `/matches`
4. MatchResultsPage loads -- but new user has NO skills/resume uploaded yet
5. User must go to `/profile` to upload resume and set skills
6. Then return to `/matches` to see role matches
7. Save interesting roles -> go to `/roadmap` to generate career path

**Problem**: There is NO guided onboarding. A new user lands on MatchResults with no data, no guidance, and no indication of what to do first. The existing `onboarding_complete` field on UserProfile is set to `False` but never checked or used in the frontend.

### Existing Gamification Infrastructure

The app already has a substantial gamification layer ("Adventure Mode"):
- **AdventureModeContext**: Manages XP, gold, levels, titles, achievements, login streaks
- **AdventureHUD**: Persistent top bar showing level, XP, gold, achievements
- **NotificationToasts**: Pop-up notifications for XP gains, achievements, level-ups
- **Fantasy text mappings**: All navigation/UI labels have medieval alternatives
- **Quest system**: `/quests` page (unlocked at level 3)
- **Store system**: `/store` page for purchasing cosmetics with gold
- **Theme system**: Light, dark, and "game" (medieval) themes
- **Framer Motion**: Already installed for animations

---

## 2. Guided Tour Library Comparison

| Feature | React Joyride | Shepherd.js | Reactour | Intro.js | Onborda | OnboardJS |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|
| **GitHub Stars** | ~4.3k | ~13k (core) | ~3.3k | ~22k | ~1k | ~500 |
| **License** | MIT | MIT | MIT | AGPL / Commercial | MIT | MIT |
| **React 18 Support** | Yes | Yes (via react-shepherd) | Yes | Wrapper needed | Yes | Yes |
| **Custom Tooltip Rendering** | Yes (tooltipComponent prop) | Yes (custom templates) | Yes (custom content) | Limited | Yes (custom cards) | Yes (headless) |
| **Character in Tooltip** | Full custom React component | HTML template | React content | HTML only | React component | Full custom |
| **Step Callbacks** | onStart, onEnd, onChange, skip | on(), before(), after(), cancel | onAfterOpen, onBeforeClose | onchange, oncomplete, onexit | onComplete per step | onStepChange, onComplete |
| **Spotlight/Overlay** | Yes | Yes | Yes (mask) | Yes | Yes | Yes |
| **Route Navigation** | Manual (via callback) | Manual | Manual | No | Built-in (route per step) | Manual |
| **Bundle Size** | ~25KB | ~18KB | ~8KB | ~12KB | ~15KB | ~10KB |
| **TypeScript** | Yes | Yes | Yes | Types available | Yes | Yes |
| **Maintenance** | Active | Active | Active | Active | Active | Newer |

### Recommendation: React Joyride

**Why React Joyride is the best fit for this project:**

1. **Custom tooltip component**: The `tooltipComponent` prop allows rendering a fully custom React component as the tooltip. This is critical -- we can render the pixel-art avatar WITH a speech bubble as the tooltip itself, making the avatar "speak" each walkthrough step.

2. **Rich callback system**: `callback` prop fires on every state change (step transitions, tour start/end, skip, close). This lets us:
   - Trigger adventure mode rewards (XP, gold, achievements) on step completion
   - Track walkthrough progress server-side
   - Navigate between routes during the tour

3. **Framer Motion compatible**: Since the project already uses framer-motion, custom tooltip animations integrate naturally.

4. **React 18 support**: Fully compatible with the project's React 18 setup.

5. **Spotlight overlay**: Built-in element highlighting draws attention to specific UI elements.

6. **MIT license**: Free for commercial use.

7. **Largest React-specific community**: Most examples, Stack Overflow answers, and maintained actively.

**Runner-up**: OnboardJS (headless approach gives total UI control) or Shepherd.js (most stars overall, but less React-native).

---

## 3. Character-Guided Onboarding Examples & Patterns

### Duolingo (Duo the Owl)
- Owl mascot appears during onboarding with speech bubbles and animations
- Character has distinct personality: encouraging, sometimes guilt-tripping
- Appears at loading states, achievements, streak celebrations
- 25% reduction in user drop-off with mascot vs without
- 34% increase in DAU after refining Duo's interaction strategy
- Key insight: The character REACTS to user actions, creating emotional connection

### Habitica (Justin the Guide)
- NPC character "Justin" gives a guided tour after account creation
- Tour includes sample tasks that teach the core loop
- Avatar customization is part of onboarding (user invests in their character)
- Gamified onboarding: completing tour steps gives first XP/gold
- Key insight: Tutorial IS the first quest -- not a separate overlay

### Microsoft Copilot (Mico Avatar)
- Animated blob character with micro-animations indicating state (listening, thinking)
- Intentionally abstract to avoid uncanny valley
- Opt-in and role-scoped (learned from Clippy's failures)
- Key insight: Avatar is an "interface layer" not a separate intelligence
- Shows conversational state through color shifts and animations

### Clippy (What NOT to do)
- Unsolicited, intrusive, system-wide interruptions
- No way to permanently dismiss
- Did not respect user context or expertise level
- Key insight: Make the companion opt-in and contextually aware

### Key Patterns for Success
1. **Character has personality** but is not annoying -- opt-in, dismissible
2. **Character reacts** to user actions (celebrates wins, encourages on failure)
3. **Character is contextual** -- says different things on different pages
4. **Tutorial as quest** -- completing onboarding IS the first adventure, with rewards
5. **Visual consistency** -- character style matches app theme (pixel art for medieval/game theme)

---

## 4. AI Assistant with Avatar Persona Patterns

### Character-Companion UI vs Chatbot UI

| Aspect | Chatbot UI | Character-Companion UI |
|--------|-----------|----------------------|
| **Visual** | Text input + message list | Character sprite + speech bubble |
| **Interaction** | User types, AI responds | AI proactively comments, user clicks/acts |
| **Persistence** | Opens/closes like a panel | Always visible on screen (minimizable) |
| **Personality** | Generic assistant | Named character with backstory |
| **Content framing** | "Here are your results" | "I found 12 quests that match your abilities!" |
| **Emotional connection** | Low | High (character loyalty) |

### How to Present AI-Generated Content as Character Dialogue

For the roadmap generation specifically:
- **Before generation**: Avatar says "I'll consult the ancient scrolls to forge your path..." (in adventure mode)
- **During generation** (1-2 min wait): Avatar performs idle animations, shows "tips" in speech bubbles
- **After generation**: Avatar celebrates "Your path has been revealed!" with confetti animation
- **On roadmap view**: Avatar provides contextual commentary on phases/milestones

### Speech Bubble UI Patterns

```
     ┌─────────────────────────────────┐
     │  Welcome, adventurer! I see you │
     │  haven't uploaded your scroll   │
     │  of abilities yet. Let's start  │
     │  there!                         │
     │           [Let's go!] [Later]   │
     └──────────────┬──────────────────┘
                    │
              ┌─────┴─────┐
              │  (avatar)  │
              │  pixel-art │
              │  character │
              └────────────┘
```

Best practices:
- Speech bubble appears ABOVE or BESIDE the avatar (not as a modal)
- Max 2-3 sentences per bubble
- Clear action buttons (primary + dismiss)
- Animate bubble entrance (fade + slide)
- Different bubble styles for different message types (info, celebration, hint)

---

## 5. Wait Time UX / Loading State Storytelling

### Current Loading States in the App

1. **Roadmap generation**: 1-2 minutes (GPT-5.2 reasoning). Currently shows a simple "Generating your personalized roadmap..." with animate-pulse and a text note about timing.
2. **Match results loading**: Progressive loading with spinner
3. **Page lazy loading**: Generic spinner (`PageLoader` component)

### Recommended Patterns for Character-Driven Loading

| Pattern | Description | Best For |
|---------|-------------|----------|
| **Character idle animation** | Avatar performs small animations (stretching, looking around, reading a map) | Short waits (< 5s) |
| **Storytelling tips** | Avatar shares tips/lore in speech bubbles that cycle | Medium waits (5-30s) |
| **Progress narration** | Avatar narrates what's happening ("Consulting the oracle...") | Long waits (30s-2min) |
| **Interactive mini-game** | Small activity while waiting | Very long waits (> 1min) |

### For the Roadmap Generation Wait (1-2 min):

This is the biggest opportunity. Instead of a generic loading message, the avatar could:

1. **Phase 1 (0-15s)**: "The ancient scribes are studying your abilities..." (avatar reading a scroll)
2. **Phase 2 (15-30s)**: "I've seen many adventurers walk similar paths..." + random career tip
3. **Phase 3 (30-60s)**: "The cartographers are mapping your journey..." (avatar looking at a map)
4. **Phase 4 (60-90s)**: "Almost there! Your destiny is being revealed..." (avatar getting excited)
5. **Phase 5 (90s+)**: Cycling through fun facts / tips about the platform features

### Real-World Loading Examples
- **Customer.io**: Animated pigeon mascot "Ami" that keeps users company
- **Calm**: Mindful loading message matching brand ("Take a deep breath...")
- **TurboTax**: Intentionally slower to build trust ("Checking your accounts...")
- **Slack**: Loading messages with personality ("You look nice today")

---

## 6. Onboarding-as-Quest Pattern

### How to Disguise the Tutorial as the First Quest

The existing quest system (`/quests`, `QuestsPage`) unlocks at level 3. The onboarding walkthrough should be the **Level 0 quest** -- the quest that gets users FROM registration TO their first meaningful action.

#### Proposed "First Quest" Structure

```
QUEST: "The Adventurer's Arrival" (Onboarding)
├── Step 1: "Forge Your Identity"
│   └── Action: Upload resume on /profile
│   └── Reward: 100 XP, 50 Gold, "Identity Forged" achievement
│
├── Step 2: "Survey the Quest Board"
│   └── Action: View match results on /matches
│   └── Reward: 50 XP, 25 Gold
│
├── Step 3: "Mark Your First Quest"
│   └── Action: Save a role on /matches or /role/:id
│   └── Reward: 100 XP, 50 Gold, "Marked for Greatness" achievement
│
├── Step 4: "Chart Your Course"
│   └── Action: Generate a roadmap on /roadmap
│   └── Reward: 500 XP, 200 Gold, "Path Forged" achievement
│
└── COMPLETION BONUS: 200 XP, 100 Gold, "The Journey Begins" achievement
    └── Unlocks: Adventure Mode fully enabled, Level 2
```

#### Why This Works

1. **Natural flow**: Steps follow the actual user journey (profile -> matches -> save -> roadmap)
2. **Each step has a reward**: Users feel progress immediately
3. **Builds on existing systems**: Uses the XP/gold/achievement infrastructure already built
4. **Not skippable** (but dismissible): Users can close the guide but the quest stays in their quest log
5. **Teaches core features**: By completing the quest, users have used every major feature

#### Reward Structure Best Practices
- Front-load rewards (bigger XP for early steps to hook users)
- Visual celebration for each step (avatar animation + notification toast)
- Unlock something tangible (store items, theme options)
- Show progress bar for the overall onboarding quest

---

## 7. Integration Points for Avatar-as-Assistant

### Where the Avatar Lives in the App

```
MainLayout (existing)
├── Header (existing)
├── AdventureHUD (existing, if enabled)
├── Content (Outlet)
├── NotificationToasts (existing)
└── AvatarCompanion (NEW - persistent, positioned bottom-right)
    ├── CharacterSprite (pixel-art, animated)
    ├── SpeechBubble (contextual messages)
    ├── WalkthroughOverlay (React Joyride integration)
    └── MinimizeButton (opt-in visibility)
```

### Avatar States

| State | Visual | Trigger |
|-------|--------|---------|
| **Idle** | Subtle breathing/floating animation | Default when visible |
| **Speaking** | Mouth animation + speech bubble | Walkthrough step, tip, greeting |
| **Celebrating** | Jump + sparkles | Achievement unlocked, quest complete |
| **Thinking** | Scratch head, look at scroll | AI generating content (roadmap) |
| **Pointing** | Point at highlighted element | Walkthrough targeting specific UI |
| **Sleeping** | Z's animation | User hasn't interacted in a while |
| **Waving** | Wave greeting | First visit to a page |

### Contextual Messages by Page

| Page | First Visit Message | Return Visit Message |
|------|-------------------|---------------------|
| `/matches` | "Behold the Quest Board! Each card shows a role that matches your abilities." | "Back to check the quests? New ones appear as you grow!" |
| `/profile` | "This is your Hero Sheet! Upload your scroll of abilities to begin." | "Keep your skills updated to get better quest matches." |
| `/saved` | "Your Quest Log! Save roles to compare and plan your journey." | "Ready to forge a path? Head to the Adventure Path!" |
| `/roadmap` | "The Adventure Path! Select your destiny and I'll chart the course." | "How's the journey going? Check off completed milestones!" |
| `/store` | "Welcome to the Merchant's Armory! Spend your hard-earned gold here." | (varies based on new items) |
| `/quests` | "The Adventurer's Guild! Take on side quests for extra rewards." | (varies based on available quests) |

### Technical Integration Points

1. **React Joyride** wraps inside `MainLayout`, controlled by `AvatarCompanion` component
2. **Avatar state** managed in a new `AvatarContext` (or extends `AdventureModeContext`)
3. **Walkthrough progress** persisted via backend API (new field on user or progression table)
4. **Page-specific messages** loaded from a config object keyed by route
5. **Speech bubble content** supports both static text and dynamic AI-generated text
6. **Framer Motion** for all avatar animations (already installed)

---

## 8. Technology & Implementation Recommendations

### Recommended Stack Addition

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Walkthrough engine | React Joyride | Custom tooltip, callbacks, spotlight, MIT license |
| Avatar animation | Framer Motion (existing) + CSS sprite sheet | Pixel art frames animated via CSS or framer variants |
| Speech bubbles | Custom React component | Tailwind-styled, theme-aware, framer-animated |
| Avatar sprites | Static pixel-art PNG/SVG assets | Multiple poses/states as separate images or sprite sheet |
| State management | Extend AdventureModeContext or new AvatarContext | Walkthrough step, avatar state, message queue |
| Persistence | Backend API (progression table extension) | Track onboarding_complete, walkthrough_step |

### Sprite Art Approach

For the pixel-art medieval companion:
- Create a small character (32x32 or 64x64 pixel art) rendered at 2-4x scale
- Multiple sprite states: idle (2-3 frame loop), speaking (2-3 frames), celebrating (4-6 frames), thinking (2-3 frames)
- Use CSS `image-rendering: pixelated` for crisp scaling
- Theme-adaptive: different outfits for light/dark/game themes (or just keep medieval always)
- Character concept: A small knight, wizard, or scribe companion

### Architecture Overview

```
frontend/src/
├── components/
│   └── avatar/
│       ├── AvatarCompanion.tsx      # Main persistent component
│       ├── CharacterSprite.tsx       # Animated pixel art sprite
│       ├── SpeechBubble.tsx          # Speech bubble with text
│       ├── WalkthroughOverlay.tsx    # React Joyride integration
│       └── avatarMessages.ts        # Contextual message configs
├── context/
│   └── AvatarContext.tsx            # Avatar state management
└── assets/
    └── avatar/
        ├── idle.png                  # Sprite sheet or individual frames
        ├── speaking.png
        ├── celebrating.png
        └── thinking.png
```

---

## 9. References

### Walkthrough Libraries
- React Joyride docs: https://docs.react-joyride.com/
- Shepherd.js: https://shepherdjs.dev/
- Onborda: https://onborda.dev/
- OnboardJS: https://onboardjs.com/

### Character UX Research
- Duolingo onboarding UX analysis: https://goodux.appcues.com/blog/duolingo-user-onboarding
- How mascots improve UX (25% drop-off reduction): https://raw.studio/blog/how-mascots-improve-user-experience/
- Habitica onboarding with Justin the Guide: https://habitica.fandom.com/wiki/Habitica_Wiki
- Microsoft Mico avatar design philosophy: https://techcrunch.com/2025/10/23/microsofts-mico-is-a-clippy-for-the-ai-era/

### Gamification & Onboarding
- Yu-kai Chou onboarding bundle: https://yukaichou.com/gamification-study/game-design-techniques-the-onboarding-bundle/
- Onboarding phase gamification: https://yukaichou.com/gamification-study/4-experience-phases-gamification-2-onboarding-phase/
- Nintendo onboarding lessons: https://www.appcues.com/blog/3-fundamental-user-onboarding-lessons-from-classic-nintendo-games

### Loading UX
- UX patterns for loading: https://www.pencilandpaper.io/articles/ux-pattern-analysis-loading-feedback
- Engaging loading pages: https://www.appcues.com/blog/loading-pages-design
- Skeleton screens (NN/g): https://www.nngroup.com/articles/skeleton-screens/

### Library Comparisons
- React Joyride alternatives: https://userguiding.com/blog/react-joyride-alternatives-competitors
- Best React onboarding libraries 2026: https://onboardjs.com/blog/5-best-react-onboarding-libraries-in-2025-compared
- React product tour libraries: https://www.chameleon.io/blog/react-product-tour
