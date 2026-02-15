# Avatar-as-Guide: The Complete Companion Experience

**Date**: 2026-02-12
**Author**: Ideator agent
**Upstream**: avatar-concept.md, avatar-guide-research.md, avatar-research.md
**Status**: Concept Document -- Definitive Vision

---

## Vision Statement

The avatar is not decoration. It is the *voice* of SpringAIS.

From the moment a new user creates their account, they are greeted not by a blank dashboard and a list of features they do not understand, but by a tiny pixel-art knight who steps onto the screen, looks up at them, and says: "Hail, traveler! I am Cedric, your guide through the realm of SpringAIS."

Cedric is the thread that stitches together every piece of the gamification system. He is the onboarding guide who walks new users through their first session. He is the roadmap assistant who narrates the AI's work while it generates career paths. He is the contextual helper who notices when you have not checked your matches in a while and gently nudges you. He is the loading-state storyteller who transforms a 90-second wait into an animated scene of a knight consulting ancient tomes.

Without Cedric, the gamification system is numbers on a screen -- XP bars, gold counts, achievement badges. With Cedric, it becomes a *relationship*. You are not "using a career platform." You are adventuring with your loyal companion.

---

## 1. Meet Cedric: Character Identity

### Name and Title

**Cedric the Steadfast** -- your loyal squire-turned-guide.

The name "Cedric" is deliberately old-English, warm, and slightly formal without being intimidating. It evokes medieval fantasy without being generic. Users will come to know him by name. "Cedric told me to check my roadmap" is the sentence we want.

### Personality Profile

- **Tone**: Earnest, encouraging, mildly humorous. Never sarcastic, never condescending. Cedric genuinely believes in the user's potential.
- **Speech style**: Short, warm sentences with light medieval flavor. Not full Shakespearean -- more "fellow adventurer" than "thou art." Example: "Well met! Let us see what quests await you today."
- **Emotional range**: Excited when the user accomplishes something. Patient when the user is idle. Proud when the user levels up. Slightly dramatic when narrating loading states ("The ancient scribes work tirelessly on your behalf...").
- **Knowledge**: Cedric "knows" the app. He refers to features using their medieval names (Quest Board, Hero Sheet, Adventure Path) but explains what they do. He is a translator between the fantasy layer and the real functionality.
- **Quirks**: Occasionally references "his own adventures" in the third person. "I once knew a traveler who checked the Quest Board every morning. They rose to Journeyman in a fortnight!" Mentions the merchant by name ("Old Grimshaw has new wares"). Treats the AI roadmap generation as "consulting the Oracle."

### Visual Identity

Cedric IS the avatar companion described in `avatar-concept.md`. He is the chibi pixel-art squire at 64x64 pixels, standing on his stone pedestal. His appearance changes as the user equips items from the store. But his personality remains constant -- humble or gilded, he is always Cedric.

When adventure mode is OFF, Cedric's medieval personality is replaced with a friendly modern assistant persona (see Section 6).

---

## 2. The First-Time Experience: Complete Script

This is the single most important interaction in the entire application. A new user has just registered. They have no data, no context, no idea what to do. This is where Cedric earns his keep.

### Scene 1: Registration Complete -- "The Arrival"

**Trigger**: User completes registration, frontend redirects from `/register` to `/` to `/matches`.

**What the user sees**: The MatchResults page loads, but it is empty -- no skills uploaded, no resume parsed, so there are no matches to show. The page displays its empty state: "Upload your resume and add skills to see matching roles."

**What happens next** (after a 1.5-second pause to let the page settle):

1. A small dust cloud animation appears at the bottom-right corner of the screen (3 small grey-brown circles that puff outward and fade over 0.5s).

2. Cedric slides up from below the viewport, standing on his stone pedestal, with a Framer Motion spring animation (`y: 200 -> 0`, spring stiffness 120, damping 14). He arrives with a slight bounce and settles.

3. A beat of silence (0.8 seconds). Cedric looks left, then right (the "looking around" idle animation from the base concept), as if surveying the empty dashboard.

4. A speech bubble fades in above Cedric (Framer Motion: `opacity: 0 -> 1`, `y: 10 -> 0`, duration 0.3s). The bubble has a parchment texture in game theme -- warm cream background (`#F5E6C8`), a thin brown border (`#8B6914`), slightly rounded corners, and a small triangular pointer at the bottom aimed at Cedric.

5. The text appears with a typing animation (30ms per character for the first bubble, to establish the character's "voice"):

> **Cedric**: "Hail, traveler! I see you have just arrived at the realm of SpringAIS. My name is Cedric, and I shall be your guide through these lands."

6. After the text finishes typing (about 3 seconds), a second bubble replaces the first (0.3s crossfade):

> **Cedric**: "Together we shall discover your destined path, uncover opportunities worthy of your talents, and forge a roadmap to greatness. But first -- shall we embark upon an adventure?"

7. Below the text, two buttons appear inside the bubble:

```
+-------------------------------------------+
|  Cedric: "Together we shall discover      |
|  your destined path, uncover opportunities|
|  worthy of your talents, and forge a      |
|  roadmap to greatness. But first --       |
|  shall we embark upon an adventure?"      |
|                                           |
|  [ Enable Adventure Mode! ]  [ Maybe Later ]
+-------------------------------------------+
         \
          \
     .-------.
     | o   o |
     |  ___  |
     '-------'
        |T|
       /   \
   ============
   [  pedestal ]
   ============
```

- **"Enable Adventure Mode!"** -- Primary button. Glowing gold gradient (`#FFE600` to `#8B5A2B`), pulsing glow animation (box-shadow oscillates between 0 and `0 0 12px rgba(255, 230, 0, 0.5)` on a 2s cycle). Text is bold, dark brown. This is clearly the intended choice.
- **"Maybe Later"** -- Ghost button. Subtle, transparent background with thin border in muted brown. Text in muted grey. Respectful, not guilt-tripping.

### Scene 2: Adventure Mode Enabled -- "The Awakening"

**Trigger**: User clicks "Enable Adventure Mode!"

**What happens** (in rapid succession, total duration ~4 seconds):

1. **Theme transition**: The app's theme toggles to "game" mode. The background shifts from clean modern to the warm dark medieval palette (`rgba(42, 37, 32)` backgrounds, `#8B5A2B` borders). This transition takes 0.5s via CSS transitions (already supported by the ThemeContext).

2. **Cedric celebrates**: He does the victory jump animation (16px upward, arms raised). A burst of 6-8 small golden particle sprites scatter outward and arc downward with simulated gravity, fading as they fall. The pedestal gains a warm golden glow for 2 seconds.

3. **The AdventureHUD slides in**: The existing AdventureHUD component at the top-center animates in from above (`y: -100 -> 0`, already implemented). The user sees their Level 1 badge, empty XP bar, 0 Gold, and 0 Achievements for the first time.

4. **Cedric speaks**:

> **Cedric**: "Magnificent! The realm transforms before us. From this day forward, I shall be your loyal companion. Now then... every great adventurer needs a first quest."

5. A **quest notification** slides in from the right side of the screen -- a parchment-styled card with golden edges:

```
+------------------------------------------+
|  QUEST UNLOCKED                          |
|  ========================================|
|                                          |
|  THE SQUIRE'S TRIAL                      |
|                                          |
|  "Every legend begins with a single      |
|   step. Prove your worth by mastering    |
|   the tools of the realm."              |
|                                          |
|  Rewards: 950 XP | 475 Gold             |
|           + "The Squire's Trial" Emblem  |
|                                          |
|  [ Begin Quest ]                         |
+------------------------------------------+
```

6. Clicking **"Begin Quest"** (or after 5 seconds, auto-proceeding) initiates the walkthrough. The quest card slides away, and the React Joyride overlay activates.

### Scene 3: "Forge Your Identity" (Profile Page)

**Step 1 of 7** -- Progress indicator: `[1/7]` shown in the speech bubble header

**Cedric says**:

> "First, we must inscribe your name and abilities in the Guild Registry. The realm cannot match you to worthy quests without knowing your strengths!"

**React Joyride spotlight**: The Sidebar navigation item "My Profile" (or "Hero Sheet" in adventure mode) is highlighted with a pulsing golden border. A translucent dark overlay covers everything else (opacity 0.6).

**What the user does**: Clicks the highlighted nav item. The app navigates to `/profile`.

**On arrival at /profile**, the spotlight shifts to the resume upload area. Cedric's bubble updates:

> "Present your scroll of achievements to the Guild Master. Upload your resume here, and I shall decipher your abilities."

**What the user does**: Uploads their resume (or manually adds skills). The resume upload component fires its success callback.

**Cedric reacts** (on successful upload):
- Small jump animation (+6px, spring)
- Floating text: "+100 XP" and "+50 Gold" drift upward from Cedric in gold text
- Speech bubble:

> "Well done! The Guild Master has recorded your abilities. Your legend grows!"

**Reward notification toast**: The existing NotificationToasts system shows "+100 XP" and "+50 Gold" in the top-right corner (already implemented).

**Transition**: After 2.5 seconds, Cedric's next bubble appears automatically.

### Scene 4: "Survey the Quest Board" (Matches Page)

**Step 2 of 7** -- Progress: `[2/7]`

**Cedric says**:

> "Now let us visit the Quest Board. The Guild has opportunities that match your abilities. This way!"

**Spotlight**: Sidebar "Match Results" / "Quest Board" is highlighted.

**What the user does**: Clicks the nav item. App navigates to `/matches`.

**On arrival at /matches**: The match results are now loading (since the user just uploaded their resume). While loading:

> "The scouts are searching the realm for opportunities worthy of your talents..."

**When matches load**, the spotlight shifts to the first match card:

> "Behold! Each of these cards represents a role that aligns with your skills. The brighter the Destiny Alignment score, the stronger the match. Have a look around!"

**What the user does**: Views the match results page (no specific action required -- this step auto-completes after 5 seconds of being on the page, or immediately if the user scrolls or clicks a card).

**Cedric reacts**:
- Nods animation (1-pixel head bob, 3 cycles)
- "+50 XP" floats upward

> "The realm is vast with opportunity! Let us mark one for your quest log."

### Scene 5: "Mark Your First Quest" (Save a Role)

**Step 3 of 7** -- Progress: `[3/7]`

**Cedric says**:

> "A wise adventurer marks the quests that interest them most. Find a role that calls to you and press the 'Mark Quest' button to save it!"

**Spotlight**: The "Save" / "Mark Quest" button on the first (or any) match card is highlighted.

**What the user does**: Clicks "Save" on any match card.

**Cedric reacts** (on save):
- Fist pump animation (brief, 0.5s)
- "+100 XP" and "+50 Gold" float up

> "A worthy choice! That quest has been inscribed in your Quest Log. You can find all saved quests there anytime."

### Scene 6: "Chart Your Course" (Roadmap Generation)

**Step 4 of 7** -- Progress: `[4/7]`

This is the big one. The user will generate their first AI roadmap, which takes 1-2 minutes. Cedric transforms this wait into a narrative experience.

**Cedric says**:

> "Every hero needs a map. Let us consult the Oracle of Paths to chart your journey. To the Adventure Path!"

**Spotlight**: Sidebar "Career Roadmap" / "Adventure Path" is highlighted.

**What the user does**: Clicks the nav item. App navigates to `/roadmap`.

**On arrival at /roadmap**, the spotlight shifts to the roadmap generation controls:

> "Select the quest you saved as your target destination, then press 'Forge Your Path' to summon the Oracle!"

**What the user does**: Selects their saved role and clicks "Generate Roadmap" / "Forge Your Path."

**The Oracle Sequence begins** (see Section 3 for full detail). Cedric narrates the entire 1-2 minute loading process.

**When roadmap completes**:
- Cedric unrolls a scroll (sprite swap to scroll-holding pose, 1.5s)
- Confetti burst (12 particles, gold and blue)
- "+500 XP" and "+200 Gold" float up (the largest single reward so far)

> "Behold! Your path has been charted by the Oracle itself. Follow this roadmap, and mastery awaits!"

### Scene 7: "Visit the Merchant's Armory" (Store Page)

**Step 5 of 7** -- Progress: `[5/7]`

**Cedric says**:

> "You have earned gold through your deeds! Let us visit Old Grimshaw at the Merchant's Armory. He has wares that can... enhance your appearance."

(Cedric winks -- a quick eye-close sprite frame, 0.2s)

**Spotlight**: Sidebar "Store" / "Merchant's Armory" is highlighted.

**What the user does**: Clicks the nav item. App navigates to `/store`.

**On arrival at /store**:

> "Welcome to the Armory! Here you can spend your gold on gear, cloaks, and emblems. Each piece appears on your avatar -- that is me! Let me give you a gift to start your collection."

**Automatic reward**: The user receives a free "Leather Boots" item (Common rarity) added to their inventory. A special notification appears:

```
+------------------------------------------+
|  GIFT FROM CEDRIC                        |
|  ========================================|
|  Leather Boots (Common)                  |
|  "Every journey begins with sturdy boots"|
|  Added to your inventory!                |
+------------------------------------------+
```

> "A pair of Leather Boots! Not much to look at yet, but every legend starts somewhere. Shall we put them on?"

**Reward**: "+50 XP" and "+25 Gold"

### Scene 8: "Don Your Gear" (Equip First Item)

**Step 6 of 7** -- Progress: `[6/7]`

**The spotlight shifts** to the Inventory tab on the Store page:

> "Switch to your Treasure Chest and equip those boots. You will see the change on me right away!"

**What the user does**: Clicks the "Inventory" tab, then clicks "Equip" / "Don" on the Leather Boots.

**Cedric reacts** (on equip):
- The "Store Purchase" spin animation plays (4-frame rotation: front, right, back, left, front -- showing off the new boots)
- Leather Boots appear on Cedric's sprite (the boots equipment layer updates in real time)

> "Ha! Now THAT is more like it. Not quite Golden Armor, but we shall get there. Earn more gold, and the finest gear in the realm can be yours!"

**Reward**: "+50 XP"

### Scene 9: "Return to the Quest Board" (Quests Preview)

**Step 7 of 7** -- Progress: `[7/7]`

**Cedric says**:

> "One final thing, adventurer. As you grow in power, the Adventurer's Guild will offer you side quests for extra rewards. You will unlock the Guild at Level 3. For now, let us return to the Quest Board and begin your journey in earnest!"

**Spotlight**: None (this is a closing message). If the user is level 3+, the quests nav item is highlighted instead.

> "Your training is complete!"

### Scene 10: Walkthrough Complete -- "The Squire's Triumph"

**Trigger**: All 7 steps completed.

**The big celebration** (duration ~5 seconds):

1. The React Joyride overlay disappears. Normal app interactivity is fully restored.

2. Cedric performs the **Level Up** celebration animation from the base concept: high jump (16px), arms raised, confetti burst (12 particles in gold, blue, and purple), golden glow ring expanding outward, sprite flashing white twice.

3. A **quest completion banner** slides in from the top:

```
+============================================================+
|                                                              |
|             THE SQUIRE'S TRIAL -- COMPLETE!                 |
|                                                              |
|  "You have proven yourself worthy, adventurer.              |
|   The realm of SpringAIS is now open to you."              |
|                                                              |
|  +------+  +-------+  +-------------------+                |
|  |950 XP|  |475 Gold|  |"Squire's Trial"  |                |
|  +------+  +-------+  | Emblem Unlocked!  |                |
|                        +-------------------+                |
|                                                              |
+============================================================+
```

4. Achievement notification fires: **"The Squire's Trial"** -- a unique emblem cosmetic item is added to the user's inventory. This emblem (a small shield with a quill and compass design) is exclusive to completing the onboarding walkthrough and cannot be obtained any other way.

5. Cedric's final walkthrough message:

> "I am proud to call you my companion, adventurer. I shall remain by your side -- click me anytime you need guidance, and I shall offer what wisdom I can. Now go forth. Your destiny awaits!"

6. The speech bubble fades. Cedric returns to his default idle state (breathing, occasional look-around). The walkthrough is complete.

**Backend state update**: The user's `onboarding_complete` field (on UserProfile) is set to `true`. The walkthrough step counter is set to `7/7`. The "Squire's Trial" quest is marked as completed in the quest system.

---

## 3. Avatar as Roadmap Assistant: The Oracle Sequence

The AI roadmap generation is the crown jewel of SpringAIS. It takes 1-2 minutes. Today, users see a spinner and a message. Tomorrow, they see a story.

### The Loading Transformation

**Current state** (what exists today):
```
+-------------------------------------------+
|                                            |
|    (pulse animation)                       |
|    Generating your personalized roadmap... |
|                                            |
|    This may take 1-2 minutes.             |
|    We're using AI to analyze your skills   |
|    and create a detailed learning path.    |
|                                            |
+-------------------------------------------+
```

**New state** (with Cedric):

The loading area becomes a **stage** for Cedric. The existing loading message is replaced with a larger avatar view (192x192, 3x scale) centered on the page, with a dedicated speech bubble above it and a progress indicator below.

```
+-----------------------------------------------------------+
|                                                             |
|     +-----------------------------------------+            |
|     | "The ancient scribes are studying your   |            |
|     |  skills and experience..."               |            |
|     +-----------------------------------------+            |
|                    |                                        |
|              .-----------.                                  |
|              |           |                                  |
|              |  192x192  |                                  |
|              |  Cedric   |                                  |
|              |  reading  |                                  |
|              |  a scroll |                                  |
|              '-----------'                                  |
|                                                             |
|     ========================================== 35%          |
|     [##############                          ]              |
|                                                             |
|     "The Oracle works diligently. Great paths              |
|      take time to reveal themselves."                      |
|                                                             |
+-----------------------------------------------------------+
```

### Phase-by-Phase Narration

The loading sequence is divided into timed phases. Each phase has a Cedric sprite state, a speech bubble, and optionally a "fun fact" tip that cycles.

**Phase 1 (0-15 seconds): "Consulting the Scrolls"**

- **Sprite**: Cedric pulls out a scroll from behind his back (sprite swap to "reading scroll" pose -- character holds a parchment at chest height, head tilted down)
- **Speech bubble**: "Ah, you seek the Oracle's wisdom! Let me consult the ancient tomes..."
- **Progress bar**: 0-15%, slow steady fill
- **After 10s, tip appears below**: "While we wait -- did you know you earn XP for completing roadmap milestones?"

**Phase 2 (15-30 seconds): "Studying Your Abilities"**

- **Sprite**: Cedric looks up from the scroll with a thoughtful expression (sprite swap to "thinking" pose -- one hand on chin)
- **Speech bubble**: "The scribes are studying your skills and achievements. Your abilities are... impressive!"
- **Progress bar**: 15-35%
- **Tip**: "Adventurers who follow their roadmap are 3x more likely to reach their career goals."

**Phase 3 (30-60 seconds): "Mapping the Path"**

- **Sprite**: Cedric traces lines in the air with one hand (sprite swap to "pointing" pose, hand moves in a slow arc via CSS transform). The scroll hovers beside him.
- **Speech bubble**: "The cartographers are mapping your optimal path through the realm..."
- **After 45s**: "Patience, adventurer. The Oracle charts each milestone with care."
- **Progress bar**: 35-65%
- **Tip cycles** (every 12 seconds):
  - "Each milestone on your roadmap includes specific resources and estimated time to complete."
  - "You can mark milestones as complete to track your progress and earn XP."
  - "The Oracle considers your current skills, target role, and the most efficient learning path."

**Phase 4 (60-90 seconds): "The Stars Align"**

- **Sprite**: Cedric stands upright, looking upward. Small star/sparkle particles drift slowly downward around him (4-5 tiny white dots with fade-in/fade-out animation)
- **Speech bubble**: "Your destiny is nearly revealed... The stars are aligning in your favor!"
- **After 75s**: "Almost there! I can feel the Oracle's power crescendo..."
- **Progress bar**: 65-90%

**Phase 5 (90+ seconds): "The Final Revelation"**

- **Sprite**: Cedric is visibly excited -- slight faster bob animation (1.5s cycle instead of 2s), occasional small jump
- **Speech bubble**: "Any moment now... The Oracle works to ensure every detail is perfect."
- **Tip cycles**: Random encouraging tips about the platform
- **Progress bar**: 90-99% (holds at 99% until actual completion)

**Completion: "Behold!"**

- **Sprite**: Cedric dramatically unrolls a large scroll (sprite swap to "scroll reveal" pose -- both arms extended holding a wide scroll). The scroll unrolling is animated over 1 second (scroll width expands from 0 to full with a Framer Motion spring).
- **Speech bubble** (large, dramatic):

> "Behold! Your path has been charted by the Oracle itself!"

- **Transition**: The loading area fades out (0.5s), and the roadmap results fade in (0.5s). Cedric returns to his normal size (128x128) in the bottom-right corner.
- **Confetti burst** around Cedric (8 particles, gold and blue)
- **Cedric's follow-up** (after roadmap is visible, 2 second delay):

> "This is where your journey begins. Each milestone brings you closer to mastery. I shall be here to guide you along the way."

### Regular AI Interaction Transformations

The Oracle Sequence pattern applies to other AI-powered features:

**Match Processing** (when new matches are being generated):
- **Sprite**: Cedric holds a spyglass to one eye (sprite: "looking far" pose)
- **Speech**: "Scanning the realm for opportunities worthy of your abilities..."
- **On complete**: "The scouts have returned! Let us see what they found."

**Resume Parsing** (when a resume is being analyzed):
- **Sprite**: Cedric holds a scroll up to his face, reading intently
- **Speech**: "The Guild Master is studying your scroll of achievements..."
- **On complete**: "Your abilities have been catalogued! The Guild knows your strengths."

**Skills Analysis** (when skills are being evaluated):
- **Sprite**: Cedric examines a glowing crystal (sprite: "examining" pose -- hands cupped around a small bright object at chest height)
- **Speech**: "Let me examine the resonance of your abilities..."
- **On complete**: "Fascinating! Your skills shine brightly in several areas."

**Any API Error**:
- **Sprite**: Cedric looks confused -- tilted head, question mark particle above head (2-frame blink animation of a small "?" symbol)
- **Speech**: "Something went awry in the archives. Shall we try again?"
- **Action button in bubble**: `[ Try Again ]`

---

## 4. Contextual Guidance: The Living Companion

After the onboarding walkthrough is complete, Cedric settles into his long-term role: a persistent, contextual, and non-intrusive companion.

### Page-Specific Behaviors

Each page in the app has a set of Cedric messages. Messages are divided into **first visit** (shown once per page, ever) and **return visit** (shown with decreasing frequency over time).

**`/matches` -- The Quest Board**

| Visit | Cedric Says | Sprite State |
|-------|-------------|-------------|
| First | "Welcome to the Quest Board! Each card shows a role matched to your abilities. Save the ones that interest you." | Pointing right (toward the content) |
| Return (early) | "Back to scout for opportunities? The realm always has new quests." | Looking around |
| Return (later) | (Silent -- Cedric is idle, no bubble) | Default idle |
| If no matches | "Hmm, the Quest Board is empty. Have you uploaded your scroll of abilities on the Hero Sheet?" | Scratching head |

**`/profile` -- The Hero Sheet**

| Visit | Cedric Says | Sprite State |
|-------|-------------|-------------|
| First | "This is your Hero Sheet -- the Guild's record of your abilities. Keep it updated for the best quest matches!" | Pointing down (toward the form) |
| Return | "Updating your abilities? Wise. The Guild rewards thorough records." | Nods |
| If profile incomplete | "Your Hero Sheet has empty fields. The more the Guild knows, the better quests they can find!" | Concerned look |

**`/saved` -- The Quest Log**

| Visit | Cedric Says | Sprite State |
|-------|-------------|-------------|
| First | "Your Quest Log! All the roles you have marked for consideration. From here, you can forge an Adventure Path." | Reading scroll |
| Return | "Reviewing your saved quests? A careful adventurer considers their options." | Idle |
| If empty | "Your Quest Log is bare! Visit the Quest Board and save roles that interest you." | Pointing left (toward sidebar) |

**`/roadmap` -- The Adventure Path**

| Visit | Cedric Says | Sprite State |
|-------|-------------|-------------|
| First | "The Adventure Path! Here the Oracle charts your course to mastery. Complete milestones to earn XP!" | Excited (faster bob) |
| Return | "How fares the journey? Check off completed milestones to track your progress." | Looking at scroll |
| If no roadmap | "You haven't consulted the Oracle yet! Select a saved role and forge your path." | Pointing at "Generate" button |

**`/store` -- The Merchant's Armory**

| Visit | Cedric Says | Sprite State |
|-------|-------------|-------------|
| First | (Handled during onboarding) | -- |
| Return | "Old Grimshaw has his finest wares on display. See anything that catches your eye?" | Looking at items (head turns toward store grid) |
| When user can afford new items | "You have enough gold for some new gear! Shall we browse?" | Excited bounce |
| When new items available at user's level | "New items have appeared in the Armory! Your growing reputation unlocks finer wares." | Pointing up |

**`/quests` -- The Adventurer's Guild**

| Visit | Cedric Says | Sprite State |
|-------|-------------|-------------|
| First | "The Adventurer's Guild! Here you can undertake side quests for extra rewards. Some require a higher rank..." | Reading a posted notice |
| Return | "Checking the Guild board? Active quests track your progress automatically." | Idle |

**`/success-patterns` -- Victory Scrolls**

| Visit | Cedric Says | Sprite State |
|-------|-------------|-------------|
| First | "The Victory Scrolls! Study the patterns of those who came before you. Their wisdom lights the path." | Reading scroll |
| Return | (Silent) | Idle |

### Proactive Suggestions

After the user has been on the platform for some time, Cedric occasionally offers gentle nudges. These are NOT tied to page navigation -- they appear after idle periods or on specific triggers.

**Trigger: 5+ minutes on any single page without interaction**

> "Taking a breather? When you are ready, perhaps check if new quests have appeared on the Quest Board."

**Trigger: 3+ days since last match check (based on page_visit data)**

> "It has been a few days since you visited the Quest Board. New opportunities may await!"

**Trigger: User has an active roadmap with uncompleted milestones**

> "Your Adventure Path has uncompleted milestones. Shall we check on your progress?"

**Trigger: User has gold > 500 and has not visited the store recently**

> "Your coffers are filling up! Old Grimshaw might have something worth your gold."

**Trigger: A new quest becomes available (user reached required level)**

> "News from the Adventurer's Guild! A new quest has become available. You have earned the right to attempt it!"

**Trigger: Login streak milestone (3, 7, 14, 30 days)**

> "A {N}-day streak! The realm takes notice of your dedication, adventurer."

### The Anti-Annoyance Protocol

This is critical. The single biggest risk of a companion character is becoming Clippy -- an intrusive, repetitive interruption that users grow to hate. Cedric must be the opposite.

**Rule 1: Frequency Decay**

Every contextual message has a **frequency multiplier** that decreases with each showing:
- 1st showing of a message type: 100% chance when triggered
- 2nd showing: 50% chance
- 3rd showing: 25% chance
- 4th+ showing: 10% chance (minimum, never fully silenced)

This is tracked per-message-type in localStorage: `cedric-message-frequency-{messageType}`.

**Rule 2: No Repeats**

Cedric never shows the exact same message text twice in a row. If a message would repeat, he either stays silent or selects an alternative phrasing from a pool of 2-3 variants per message type.

**Rule 3: Cooldown Period**

After any speech bubble is shown, there is a **minimum 90-second cooldown** before the next proactive message can appear. Reactive messages (page-specific first-visit, reaction to user actions) ignore this cooldown.

**Rule 4: "Quiet Mode" Toggle**

The right-click context menu on Cedric includes a "Quiet Mode" toggle. When enabled:
- No proactive suggestions at all
- Page-specific first-visit messages still appear (one time only)
- Reaction animations still play (XP, level up, etc.)
- Speech bubbles for reactions are suppressed
- Walkthrough/onboarding messages are unaffected

**Rule 5: Dismissibility**

Every speech bubble has:
- An auto-dismiss timer (8-10 seconds, configurable)
- A small "X" close button in the top-right corner
- A "Don't show this again" link in subtle text below the message (for proactive suggestions only)

**Rule 6: Brevity**

No speech bubble ever contains more than 2 sentences. Most contain 1 sentence. If more context is needed, it is spread across sequential bubbles rather than presented as a wall of text.

**Rule 7: Maximum Daily Messages**

After 8 proactive messages in a single session, Cedric goes silent for the remainder of the session. Page reactions and walkthrough messages are exempt from this cap.

---

## 5. Speech Bubble System: Complete Design

### Visual Design

The speech bubble is a React component (`SpeechBubble.tsx`) that renders above Cedric's avatar widget.

**Adventure Mode (Game Theme):**

```
  +-------------------------------------+
  |  .--. .--.                      [X]  |
  |  |  | |  |  (parchment pattern)      |
  |  '--' '--'                           |
  |                                      |
  |  "Welcome to the Quest Board!        |
  |   Each card shows a role matched     |
  |   to your abilities."                |
  |                                      |
  |        [ Got It ]  [ Show Me ]       |
  +-------------------------------------+
           \
            \  (triangular pointer)
```

- **Background**: Parchment texture -- a warm cream gradient (`linear-gradient(180deg, #F5E6C8 0%, #E8D5A8 100%)`)
- **Border**: 2px solid `#8B6914` (warm brown-gold), rounded corners (8px)
- **Font**: `'Cinzel', serif` for the character name, system sans-serif for body text
- **Text color**: Dark brown (`#3D2B1F`)
- **Max width**: 280px
- **Shadow**: `0 4px 16px rgba(0, 0, 0, 0.3)`
- **Pointer**: CSS triangle (10px wide, 8px tall) using `border-left`, `border-right`, `border-top` trick, positioned at the bottom center of the bubble, pointing down at Cedric

**Normal Mode (Light/Dark Theme):**

- **Background**: White (`#FFFFFF`) in light theme, dark grey (`#2D2D3D`) in dark theme
- **Border**: 1px solid `#E0E0E0` (light) or `#404050` (dark)
- **Font**: System sans-serif for all text
- **Rounded corners**: 12px (more modern)
- **Shadow**: `0 2px 8px rgba(0, 0, 0, 0.1)` (light) or `0 2px 12px rgba(0, 0, 0, 0.4)` (dark)

### Bubble Content Types

The speech bubble supports several content configurations:

**Type 1: Text Only**
```
"Your Adventure Path has uncompleted milestones."
```

**Type 2: Text + Action Buttons (1-2 buttons)**
```
"A new quest has become available!"
        [ View Quests ]  [ Later ]
```

**Type 3: Text + Dismiss Link**
```
"Have you checked your matches lately?"
                    Don't show again
```

**Type 4: Reward Display**
```
"Quest step complete!"
   +100 XP    +50 Gold
```

### Animation

- **Entrance**: Framer Motion -- `opacity: 0 -> 1`, `y: 10 -> 0`, `scale: 0.95 -> 1`, duration 0.25s, ease "easeOut"
- **Exit**: `opacity: 1 -> 0`, `y: 0 -> -5`, duration 0.2s, ease "easeIn"
- **Typing effect** (for narrative/walkthrough bubbles only): Characters appear one at a time, 25ms per character. A small blinking cursor (2px wide, height of one line) appears at the end of the text during typing and disappears when complete.
- **Button appearance**: Buttons fade in (`opacity: 0 -> 1`, duration 0.15s) after the text finishes typing

### Message Queue System

Multiple messages can be triggered in quick succession (e.g., page navigation fires a context message while a reward notification is pending). The queue works as follows:

1. Messages enter a FIFO queue
2. The current bubble displays for its configured duration (or until dismissed)
3. On dismissal or timeout, the next queued message appears (with exit/entrance animation sequence)
4. If the queue exceeds 3 messages, intermediate "info" type messages are dropped (only "reward" and "walkthrough" types are preserved)
5. The queue is cleared on page navigation (except for reward messages, which persist)

Priority levels (higher = shown first):
1. **Walkthrough** (onboarding steps) -- never dropped, always shown
2. **Reward** (XP, gold, achievement) -- never dropped, always shown
3. **Reaction** (page-specific response to user action) -- can be dropped if queue > 3
4. **Proactive** (idle suggestions, reminders) -- lowest priority, first to be dropped

---

## 6. Loading State Transformations: Complete Map

Every existing loading state in the app is mapped to a Cedric behavior. The goal: no user ever sees a generic spinner when Cedric is present.

| Loading Scenario | Current State | Cedric Sprite | Cedric Speech | Duration |
|---|---|---|---|---|
| **Roadmap generation** | "Generating your personalized roadmap..." | Reading scroll -> thinking -> tracing lines -> looking up | Full Oracle Sequence (Section 3) | 60-120s |
| **Match results loading** | Spinner | Holding spyglass | "The scouts are searching the realm for opportunities..." | 2-10s |
| **Resume parsing** | "Processing your resume..." | Reading scroll | "The Guild Master deciphers your scroll of achievements..." | 5-15s |
| **Skills analysis** | Spinner | Examining crystal | "Assessing the resonance of your abilities..." | 2-5s |
| **Page lazy loading** | Spinner (`PageLoader`) | Walking animation (2-frame walk cycle: left foot, right foot) | None (too brief for speech) | <2s |
| **Store catalog loading** | Spinner | Looking at shelves (head panning left-to-right slowly) | "Let me see what Old Grimshaw has in stock today..." | 1-3s |
| **Quest catalog loading** | Spinner | Reading posted notice | "Checking the Guild board for available adventures..." | 1-3s |
| **API error (any)** | Error message | Confused (tilted head, "?" above) | "Something went awry in the archives. Shall we try again?" | Until retry |
| **Network timeout** | Error message | Sitting down, looking tired | "The messenger pigeons seem to be delayed. The realm's pathways may be congested." | Until retry |

### Short Loading Optimization

For loading states under 2 seconds, Cedric does NOT show a speech bubble (it would appear and disappear too quickly, feeling janky). Instead, he only changes his sprite state to the appropriate pose, then returns to idle when loading completes. The user perceives a subtle shift in the companion's behavior rather than an intrusive notification.

For loading states over 5 seconds, the speech bubble appears after a 1-second delay (to avoid flashing it for loads that complete quickly).

---

## 7. Non-Adventure Mode: The Professional Variant

If the user clicks "Maybe Later" during onboarding, or has Adventure Mode disabled, the companion experience still exists -- but in a modern, professional skin.

### "Maybe Later" Flow

When the user clicks "Maybe Later":
1. Cedric's speech bubble updates:

> "No worries! I can still show you around without the medieval flair. Want a quick tour of the platform?"

2. Two new buttons appear: **"Sure, show me around!"** / **"I'll explore on my own"**

**If "Sure, show me around!"**: The same walkthrough plays, but with modern language (see below). Adventure Mode remains OFF. The user still earns XP and gold (the gamification system works regardless of theme -- adventure mode only controls the visual theme and fantasy text).

**If "I'll explore on my own"**: Cedric says "Fair enough! I'll be here if you need me. Just click me anytime." Then minimizes to a small circular icon (32x32, a friendly guide icon -- a compass or lightbulb, not a pixel knight) in the bottom-right corner.

### Modern Language Equivalents

| Adventure Mode | Normal Mode |
|---|---|
| "Hail, traveler!" | "Welcome!" |
| "The Quest Board" | "Your matched roles" |
| "Your Hero Sheet" | "Your profile" |
| "Inscribe your name in the Guild Registry" | "Set up your profile" |
| "Present your scroll of achievements" | "Upload your resume" |
| "The Oracle of Paths" | "Our AI career advisor" |
| "Forge Your Path" | "Generate your roadmap" |
| "Old Grimshaw's Armory" | "The rewards shop" |
| "Gold" | "Points" |
| "Quest Board" | "Opportunities" |
| "Adventure Path" | "Career Roadmap" |
| "Adventurer's Guild" | "Challenges" |

### Modern Avatar Appearance

When Adventure Mode is OFF:
- The avatar is NOT the pixel knight. It is a small, clean **compass icon** (32x32) or a simple **guide mascot** in a flat, modern art style (think a friendly robot or abstract character)
- No pedestal, no equipment layers, no medieval decorations
- The speech bubble is the modern variant (white/dark background, sans-serif font, clean rounded corners)
- Animations are minimal: a subtle pulse on hover, a gentle bounce on notifications
- The icon sits in the same bottom-right position

### Re-enabling Adventure Mode

From any state, the user can enable Adventure Mode via:
1. Settings/Preferences page (toggle switch)
2. Clicking the guide icon in the corner -> a prompt appears: "Want to switch to Adventure Mode? It adds a medieval theme and a pixel-art companion!"
3. The AdventureHUD "Store" button (if somehow visible)

On enabling: Cedric's entrance animation plays (slide up from bottom, dust cloud, introduction bubble).

---

## 8. Comprehensive Text Wireframes

### 8a. The "Enable Adventure Mode" Prompt (Registration)

```
+================================================================+
|                                                                  |
|   [SkillBridge Logo]                          [Light/Dark] [?]  |
|   ==============================================================|
|                                                                  |
|   Match Results                                                  |
|   ---------------------------------------------------------------
|                                                                  |
|            +------------------------------------------+          |
|            |                                          |          |
|            |   Upload your resume and add skills      |          |
|            |   to see matching roles.                 |          |
|            |                                          |          |
|            |          [ Go to Profile ]               |          |
|            |                                          |          |
|            +------------------------------------------+          |
|                                                                  |
|                                                                  |
|                                                                  |
|                                                                  |
|                                                                  |
|                     +--------------------------------------+     |
|                     | "Hail, traveler! I see you have just |     |
|                     |  arrived at the realm of SpringAIS.  |     |
|                     |  My name is Cedric, and I shall be   |     |
|                     |  your guide through these lands."    |     |
|                     |                                      |     |
|                     |  "Shall we embark upon an adventure?"|     |
|                     |                                      |     |
|                     |  [*Enable Adventure Mode!*] [Later]  |     |
|                     +--------------------------------------+     |
|                                  |                               |
|                            .----------.                          |
|                            |  Cedric  |                          |
|                            |  pixel   |                          |
|                            |  knight  |                          |
|                            '----------'                          |
|                            ============                          |
|                            [ pedestal ]                          |
+================================================================+
```

### 8b. Walkthrough Step In Progress (Avatar + Spotlight + Speech Bubble)

```
+================================================================+
|                                                                  |
|   [SkillBridge]   [==== AdventureHUD: Lv1 | XP | 150 Gold ====]|
|   ==============================================================|
|   |                |                                             |
|   | +-----------+  |                                             |
|   | |Quest Board|  |  .------ DIMMED OVERLAY (opacity 0.6) ----.|
|   | +-----------+  |  |                                         ||
|   | | Hero Sheet|  |  |  +---Match Card 1---+  +---Match C---+ ||
|   | +-----------+  |  |  |                  |  |             | ||
|   | |*QUEST LOG*|<-+--+  |  Role: Senior    |  |  Role:...   | ||
|   | | (GLOWING) |  |  |  |  Developer       |  |             | ||
|   | +-----------+  |  |  |  Match: 87%      |  |             | ||
|   | |Adv. Path  |  |  |  |                  |  |             | ||
|   | +-----------+  |  |  | [*SAVE*] <SPOTLIGHT>  |           | ||
|   | | Store     |  |  |  |  (pulsing gold   |  |             | ||
|   | +-----------+  |  |  |   highlight)      |  |             | ||
|   |                |  |  +------------------+  +-------------+ ||
|   |                |  |                                         ||
|   |                |  '------------------------------------------'|
|   |                |                                             |
|   |                |  Step [3/7]                                  |
|   |                |  +--------------------------------------+   |
|   |                |  | "A wise adventurer marks the quests  |   |
|   |                |  |  that interest them. Find a role and |   |
|   |                |  |  press 'Mark Quest' to save it!"     |   |
|   |                |  +--------------------------------------+   |
|   |                |                   |                         |
|   |                |             .----------.                    |
|   |                |             |  Cedric  |                    |
|   |                |             | (pointing|                    |
|   |                |             |  at card)|                    |
|   |                |             '----------'                    |
|   |                |             ============                    |
+================================================================+
```

### 8c. Roadmap Generation Loading Screen with Avatar

```
+================================================================+
|                                                                  |
|   [SkillBridge]   [==== AdventureHUD: Lv1 | XP | 350 Gold ====]|
|   ==============================================================|
|   |                |                                             |
|   | [Quest Board]  |                                             |
|   | [Hero Sheet ]  |     Forging Your Adventure Path...         |
|   | [Quest Log  ]  |                                             |
|   | [*Adv. Path*]  |                                             |
|   | [Store      ]  |     +------------------------------------+  |
|   |                |     | "The cartographers are mapping     |  |
|   |                |     |  your optimal path through the     |  |
|   |                |     |  realm..."                          |  |
|   |                |     +------------------------------------+  |
|   |                |                    |                        |
|   |                |              .-----------.                  |
|   |                |              |           |                  |
|   |                |              |  192x192  |                  |
|   |                |              |  Cedric   |                  |
|   |                |              | (tracing  |                  |
|   |                |              |  lines in |                  |
|   |                |              |  the air) |                  |
|   |                |              |           |                  |
|   |                |              '-----------'                  |
|   |                |                                             |
|   |                |     ================================ 52%     |
|   |                |     [##############################      ]  |
|   |                |                                             |
|   |                |     Tip: Each milestone on your roadmap     |
|   |                |     includes specific resources and         |
|   |                |     estimated time to complete.             |
|   |                |                                             |
+================================================================+
```

### 8d. Avatar Presenting Roadmap Results

```
+================================================================+
|                                                                  |
|   [SkillBridge]   [==== AdventureHUD: Lv2 | XP | 550 Gold ====]|
|   ==============================================================|
|   |                |                                             |
|   | [Quest Board]  |  Your Adventure Path: Senior Developer      |
|   | [Hero Sheet ]  |  ==========================================|
|   | [Quest Log  ]  |                                             |
|   | [*Adv. Path*]  |  Phase 1: Foundation (3 months)             |
|   | [Store      ]  |  +--------------------------------------+  |
|   |                |  | [ ] Learn TypeScript Advanced        |  |
|   |                |  | [ ] Complete System Design Course    |  |
|   |                |  | [ ] Build Portfolio Project          |  |
|   |                |  +--------------------------------------+  |
|   |                |                                             |
|   |                |  Phase 2: Growth (3 months)                 |
|   |                |  +--------------------------------------+  |
|   |                |  | [ ] AWS Solutions Architect Cert     |  |
|   |                |  | [ ] Lead a Team Project              |  |
|   |                |  +--------------------------------------+  |
|   |                |                                             |
|   |                |  +--------------------------------------+  |
|   |                |  | "This is where your journey begins.  |  |
|   |                |  |  Each milestone brings you closer     |  |
|   |                |  |  to mastery!"                         |  |
|   |                |  +--------------------------------------+  |
|   |                |                   |                         |
|   |                |             .----------.                    |
|   |                |             |  Cedric  |                    |
|   |                |             | (pointing|                    |
|   |                |             |  at      |                    |
|   |                |             |  Phase 1)|                    |
|   |                |             '----------'                    |
|   |                |             ============                    |
+================================================================+
```

### 8e. Contextual Tip on Matches Page

```
+================================================================+
|                                                                  |
|   [SkillBridge]   [==== AdventureHUD: Lv3 | XP | 800 Gold ====]|
|   ==============================================================|
|   |                |                                             |
|   | [Quest Board]  |  Quest Board                                |
|   | [Hero Sheet ]  |  ==========================================|
|   | [Quest Log  ]  |                                             |
|   | [Adv. Path  ]  |  +---Match Card---+  +---Match Card---+   |
|   | [Store      ]  |  | Senior Dev     |  | Lead Engineer  |   |
|   | [Quests     ]  |  | 87% Match      |  | 74% Match      |   |
|   |                |  | [Save]         |  | [Save]         |   |
|   |                |  +-----------------+  +-----------------+   |
|   |                |                                             |
|   |                |  +---Match Card---+  +---Match Card---+   |
|   |                |  | Architect      |  | Staff Eng      |   |
|   |                |  | 65% Match      |  | 59% Match      |   |
|   |                |  | [Save]         |  | [Save]         |   |
|   |                |  +-----------------+  +-----------------+   |
|   |                |                                             |
|   |                |                                             |
|   |                |  +--------------------------------------+   |
|   |                |  | "New opportunities await! The Guild  |[X]|
|   |                |  |  updates its board regularly."       |   |
|   |                |  |                      Don't show again|   |
|   |                |  +--------------------------------------+   |
|   |                |                   |                         |
|   |                |             .----------.                    |
|   |                |             |  Cedric  |                    |
|   |                |             |  (idle)  |                    |
|   |                |             '----------'                    |
|   |                |             ============                    |
+================================================================+
```

### 8f. Walkthrough Quest Completion Celebration

```
+================================================================+
|                                                                  |
|  +============================================================+ |
|  |                                                              | |
|  |             THE SQUIRE'S TRIAL -- COMPLETE!                 | |
|  |                                                              | |
|  |  "You have proven yourself worthy, adventurer.              | |
|  |   The realm of SpringAIS is now open to you."              | |
|  |                                                              | |
|  |  +--------+  +---------+  +-------------------------+      | |
|  |  | 950 XP |  | 475 Gold|  | "Squire's Trial" Emblem |      | |
|  |  |  (gold)|  | (gold)  |  |   (unique cosmetic)     |      | |
|  |  +--------+  +---------+  +-------------------------+      | |
|  |                                                              | |
|  |                     [ Dismiss ]                              | |
|  +============================================================+ |
|                                                                  |
|           *  *  confetti  *  *  *                                |
|        *      *   falling   *     *                              |
|     *    *                    *      *                            |
|                                                                  |
|                       ~~~~golden glow~~~~                        |
|                         .-----------.                            |
|                         |  Cedric   |                            |
|                         |  (arms    |                            |
|                         |  raised,  |                            |
|                         |  victory  |                            |
|                         |  pose!)   |                            |
|                         '-----------'                            |
|                         =============                            |
|                         [  pedestal  ]                            |
+================================================================+
```

### 8g. Avatar in Quiet/Minimized State

```
+================================================================+
|                                                                  |
|   [SkillBridge]   [==== AdventureHUD ====]                      |
|   ==============================================================|
|   |                |                                             |
|   | [Navigation]   |  (Normal page content here)                |
|   |                |                                             |
|   |                |                                             |
|   |                |                                             |
|   |                |                                             |
|   |                |                                             |
|   |                |                                             |
|   |                |                                             |
|   |                |                                             |
|   |                |                                             |
|   |                |                                             |
|   |                |                                             |
|   |                |                                             |
|   |                |                                   .----.    |
|   |                |                                   |:) |    |
|   |                |                                   '----'    |
|   |                |                               Cedric (mini) |
+================================================================+
```

The minimized state is just Cedric's head (32x32 pixels) with a subtle circular border. Hover shows a tooltip: "Click to restore Cedric". Click restores to full size with a pop-up spring animation. Right-click opens the context menu.

---

## 9. Phased Delivery Plan (Updated)

The original avatar concept proposed 4 phases. With the guide/assistant functionality, the plan expands to 5 phases, reordered to prioritize the onboarding experience.

### Phase 1: MVP -- Onboarding Quest Walkthrough (4-5 stories)

**Goal**: Cedric appears, guides new users through the app, and completes the first quest.

**Deliverables**:
- `AvatarCompanion` component with basic sprite rendering (base character, no equipment yet)
- `SpeechBubble` component with typing animation and action buttons
- `WalkthroughOverlay` component integrating React Joyride with custom tooltip
- Full "Squire's Trial" walkthrough script (Scenes 1-10)
- "Enable Adventure Mode" prompt for first-time users
- Walkthrough progress persistence via backend (`walkthrough_step` field)
- "Squire's Trial" emblem reward on completion
- Basic entrance/exit animations (Framer Motion)
- Non-adventure mode fallback (modern language + compass icon)

**What the user sees**: On first registration, a pixel knight appears, introduces himself, and walks them through every major feature. They earn XP, gold, and a unique emblem. At the end, they understand the entire platform.

**Why start here**: The onboarding gap is the most critical problem identified in the research. A new user who does not understand the platform will leave. Cedric's first job is retention.

**Estimated effort**: 4-5 stories, primary bottleneck is walkthrough scripting + React Joyride integration.

### Phase 2: Equipment Rendering + Idle Animations (4-5 stories)

**Goal**: Cedric becomes a living character that reflects equipped items and feels alive.

**Deliverables**:
- DOM/CSS layered PNG rendering for all 8 equipment slots
- All 36 equipment piece sprites (sourced from LPC + custom)
- Idle breathing/bobbing animation (CSS keyframes)
- Looking around behavior (15-20s interval)
- Sitting idle (30s inactivity)
- Sleeping with ZZZ (2min inactivity)
- Wake-up animation
- Pedestal level progression (5 variants)
- Rarity visual effects (shimmer, glow, particles)
- Color palette support (CSS mix-blend-mode)
- Name plate with title and level

**What the user sees**: Cedric is now fully alive. He breathes, looks around, sits down when idle, sleeps when abandoned, and wears whatever gear the user has equipped. Legendary items glow. The pedestal evolves with level.

**Why second**: Equipment rendering is the emotional core of the store system. Without it, the store sells abstract names. With it, every purchase transforms Cedric.

**Estimated effort**: 4-5 stories, primary bottleneck is sprite asset creation (36 items).

### Phase 3: Roadmap Assistant + Loading Transformations (3-4 stories)

**Goal**: Cedric narrates AI operations and transforms loading states.

**Deliverables**:
- Full Oracle Sequence for roadmap generation (Section 3)
- Loading state transformations for all existing loading scenarios (Section 6)
- Enlarged avatar view (192x192) for dedicated loading screens
- Phase-based narration with timed speech bubbles
- Progress bar integration
- Fun fact / tip cycling system
- Error state handling with retry prompts
- "Thinking," "reading scroll," "examining crystal," "holding spyglass" sprite poses (4-6 new sprite states)

**What the user sees**: Waiting for the roadmap becomes an experience, not an annoyance. Every loading state has Cedric doing something relevant. The 90-second roadmap generation feels like 30 seconds because the user is watching Cedric consult ancient tomes.

**Why third**: This solves the second most important UX problem -- the roadmap generation wait time. It also demonstrates the avatar's role as more than decoration.

**Estimated effort**: 3-4 stories, primary bottleneck is sprite states and narration timing.

### Phase 4: Contextual Guidance + Reactions (3-4 stories)

**Goal**: Cedric responds to game events and provides contextual help on every page.

**Deliverables**:
- All 7 reaction animations (XP, level up, coins, achievement, quest complete, store purchase, login streak)
- Animation queue system
- Page-specific contextual messages (Section 4)
- Proactive suggestion system with frequency decay
- Anti-annoyance protocol (quiet mode, cooldowns, limits)
- Click to open mini character sheet
- Hover interaction (look at cursor, tooltip)
- Right-click context menu (minimize, restore, reset position, quiet mode)
- Message frequency tracking in localStorage

**What the user sees**: Cedric is now a full companion. He celebrates victories, offers tips on new pages, and gently nudges when the user has been away. He is always helpful, never annoying. Clicking him shows your equipment loadout.

**Why fourth**: Contextual guidance is valuable but not critical for day-one retention. The walkthrough (Phase 1) handles initial guidance. Phase 4 adds long-term companion value.

**Estimated effort**: 3-4 stories, primary bottleneck is reaction animation polish and message system.

### Phase 5: Polish, Store Preview, Accessibility (2-3 stories)

**Goal**: Deep integration with the store and production-quality polish.

**Deliverables**:
- Store page live preview (hover item to preview on avatar at 192x192)
- Expanded avatar view on store page
- Drag to reposition (with localStorage persistence)
- `prefers-reduced-motion` support (all animations become static)
- Responsive behavior (tablet: 96x96, mobile: minimized to 48x48 or hidden)
- Keyboard accessibility (Tab to avatar, Enter to open character sheet, Escape to close)
- Screen reader alt text for all avatar states
- Performance optimization (lazy-load sprites, preload equipped items)
- Accessibility audit pass

**What the user sees**: The store becomes a dressing room where hovering over items shows them on Cedric in real time. The avatar is accessible, performant, and production-ready.

**Why last**: These are polish features that enhance an already-working system. They are important for production quality but not for core value delivery.

**Estimated effort**: 2-3 stories, primary bottleneck is store integration UX.

### Total Delivery Estimate

| Phase | Stories | Primary Bottleneck |
|-------|---------|-------------------|
| Phase 1: Onboarding Walkthrough | 4-5 | React Joyride integration + walkthrough scripting |
| Phase 2: Equipment + Idle | 4-5 | Asset creation (36 sprites) |
| Phase 3: Roadmap Assistant | 3-4 | Loading narration + sprite poses |
| Phase 4: Contextual Guidance | 3-4 | Reaction animations + message system |
| Phase 5: Polish + Store Preview | 2-3 | Store integration + accessibility |
| **Total** | **16-21 stories** | **Phase 1 is the critical path** |

---

## 10. Technical Architecture Summary

### New Components

```
frontend/src/
  components/
    avatar/
      AvatarCompanion.tsx         # Root persistent component, manages state
      CharacterSprite.tsx          # Layered PNG rendering + idle animations
      SpeechBubble.tsx             # Speech bubble with typing, buttons, queue
      WalkthroughOverlay.tsx       # React Joyride custom wrapper
      AvatarLoadingStage.tsx       # 192x192 enlarged view for loading screens
      MiniCharacterSheet.tsx       # Click-to-open equipment panel
      avatarMessages.ts            # All dialogue text (medieval + modern variants)
      avatarConfig.ts              # Timing, animation, and behavior constants
  context/
    AvatarContext.tsx              # Avatar state: current pose, speech queue,
                                  #   walkthrough progress, quiet mode, etc.
                                  #   OR extends AdventureModeContext
```

### New Dependencies

- `react-joyride` (~25KB) -- walkthrough engine with spotlight overlay

### Backend Changes

- Add `walkthrough_step` (integer, default 0) to user progression table
- Add `walkthrough_complete` (boolean, default false)
- Add `onboarding_quest_id` to quest system (a special quest seeded on user creation)
- API endpoint: `POST /progression/walkthrough-step` to record step completion
- Free "Leather Boots" item granted on walkthrough Step 5 (via a one-time reward hook)

### Data Flow

```
Registration
  -> HomeRedirect -> /matches (empty state)
  -> AvatarCompanion mounts
  -> Checks: user.walkthrough_complete === false
  -> Enters onboarding mode
  -> SpeechBubble: "Enable Adventure Mode?" prompt
  -> On accept: toggleAdventureMode() + start React Joyride
  -> Each step: POST /progression/walkthrough-step + XP/Gold rewards
  -> On complete: POST /quests/{onboarding_quest_id}/complete
  -> Achievement + Emblem unlocked
  -> user.walkthrough_complete = true
  -> Cedric enters persistent companion mode
```

---

## 11. Open Questions

1. **Cedric's gender**: The name and character are currently male-presenting. Should there be a character selection (Cedric / Elara / a gender-neutral option)? Recommendation: start with Cedric, add alternatives in a future phase if requested.

2. **Voice lines vs text-to-speech**: Should Cedric ever have audio? Recommendation: No. The base concept explicitly mandates "no sound effects" for professional context. Text-only is safer.

3. **Walkthrough skip**: Should power users be able to skip the entire walkthrough? Recommendation: Yes. Add a "Skip Tutorial" link in the walkthrough step counter. The quest is marked as "skipped" (no rewards) and the user is flagged as having completed onboarding.

4. **Multiple walkthroughs**: Should there be additional walkthroughs when new features launch? Recommendation: Yes, but only for major features. "Cedric has a new quest for you!" pattern scales well.

5. **A/B testing**: Should we measure onboarding completion rates with vs without Cedric? Recommendation: Strongly yes. The `onboarding_complete` field already exists in the backend. Comparing completion rates between users who see Cedric and those who don't would validate the entire feature.

6. **Cedric on mobile**: The avatar takes up valuable screen real estate on mobile. Recommendation: Auto-minimize to 32x32 on viewports under 768px. Speech bubbles become full-width bottom sheets. Walkthrough still works but with simplified spotlight (top-aligned tooltips).

---

## 12. Closing: Why This Matters

The avatar-as-guide concept transforms three disconnected problems into one unified solution:

**Problem 1: New users don't know what to do.** No onboarding exists. The `onboarding_complete` field is set to `false` and never checked. Users land on an empty matches page and bounce.

**Solution**: Cedric's onboarding walkthrough guides every new user through the complete platform in 5-10 minutes, rewarding them at every step.

**Problem 2: The AI roadmap generation takes too long.** 60-120 seconds of staring at a spinner. Users leave or lose focus.

**Solution**: Cedric's Oracle Sequence transforms the wait into a narrated, animated experience. Tips cycle. The avatar performs contextual animations. Time perception shortens dramatically.

**Problem 3: The gamification system feels abstract.** XP, gold, and achievements are numbers. The store sells items that do nothing visible.

**Solution**: Cedric wears the items. He celebrates the achievements. He narrates the rewards. The gamification system becomes tangible because there is a *character* at the center of it.

One feature. Three problems solved. One loyal companion.

Build Cedric, and the platform comes alive.
