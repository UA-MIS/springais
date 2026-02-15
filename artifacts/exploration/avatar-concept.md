# Avatar Companion Concept: "Your Knight"

**Date**: 2026-02-12
**Author**: Ideator agent
**Context**: SpringAIS Medieval Mode -- persistent on-screen 2D companion character
**Upstream**: avatar-research.md (researcher findings)

---

## Vision Statement

Imagine logging into SpringAIS and being greeted by a tiny knight standing in the bottom-right corner of your screen. He's your companion -- a little pixel-art adventurer no bigger than a postage stamp, standing on a stone pedestal, breathing gently as he surveys the realm. He starts humble: a peasant in a linen tunic with a wooden practice sword propped against the pedestal. But as you earn gold and visit the Merchant's Armory, he transforms. Bronze armor appears on his torso. A traveler's cloak billows behind him. Iron-shod boots replace his bare feet. And when you finally earn that Legendary Dragon Pendant, a warm golden aura pulses around him, particles of light drifting upward like embers from a campfire.

He is not a distraction. He is a reflection of your progress -- a visual trophy case that lives and breathes alongside your work.

---

## 1. Character Design

### Base Character: "The Squire"

The base character is a **chibi-proportioned medieval squire** rendered in pixel art at **64x64 pixels**. The art style sits at the intersection of classic 16-bit RPG sprites (think Final Fantasy VI overworld characters) and the warm, approachable aesthetic of Stardew Valley. The proportions are exaggerated in the chibi tradition: the head occupies roughly 40% of the character's height, with large expressive eyes (2-3 pixels each) and a simplified but readable face.

**Default appearance (Level 1, no equipment)**:
- **Body**: A simple linen tunic in muted tan/brown, belted at the waist with a thin rope
- **Head**: Round, friendly face with dot eyes and a slight smile; short messy brown hair (the "default" hair before any hairstyle purchase)
- **Feet**: Bare feet or simple cloth wrappings
- **Hands**: Visible at the sides, proportionally small
- **Posture**: Standing upright with a slight forward lean, suggesting eagerness
- **Accessories**: None -- this is a fresh adventurer who owns nothing yet
- **Pedestal**: A small stone platform (16x8 pixels) that the character stands on, giving them a "home" on the screen

The squire looks humble but hopeful. There is a deliberate contrast between the plain starting state and the fully-equipped endgame look -- this drives the desire to earn and equip items.

### Progression Visual: Levels 1 through 10

The **base character body does not change** with level. All visual progression comes from equipment. This is a deliberate design choice:

1. It makes the store meaningful -- every visual change is a purchase you made
2. It avoids complexity of multiple base sprites
3. It mirrors how real RPGs work -- your gear defines your look

However, the **pedestal evolves** subtly with level to reward progression even without purchases:

| Level | Pedestal Change |
|-------|----------------|
| 1-2 | Plain grey stone block |
| 3-4 | Stone block with a small crack of green moss |
| 5-6 | Polished stone with a carved border |
| 7-8 | Dark marble with gold trim |
| 9-10 | Ornate gilded pedestal with faint magical glow |

This gives every player a sense of visual progression, even free-to-play users who never visit the store.

### Art Style Reference

**Primary influences**:
- **Stardew Valley** -- warm colors, readable silhouettes at small sizes, character charm
- **Habitica** -- layered paper-doll system, chibi RPG proportions
- **Final Fantasy VI (SNES)** -- 16-bit sprite detail level, expressive within pixel constraints
- **Celeste** -- clean pixel art with subtle animation that conveys personality

**Color palette**: Warm browns, deep golds, and muted earth tones for the base character. This matches the existing AdventureHUD gradient (`#8B5A2B` to `#FFE600`) and the medieval game theme's palette of `rgba(42, 37, 32)` backgrounds.

**Pixel density**: Each logical pixel in the 64x64 sprite renders as a 2x2 block on screen (128x128 CSS pixels), preserving the crisp pixel art look via `image-rendering: pixelated`. On retina displays, this means each sprite pixel maps to 4 physical pixels -- still sharp, still small.

---

## 2. Equipment Visualization: All 8 Slots

Each equipment slot maps to a **PNG overlay layer** that composites on top of the base character. All equipment PNGs are 64x64 with transparent backgrounds, pre-aligned to the base character's body position so they stack correctly.

### Armor (Body Layer -- z-index 3)

The armor slot covers the character's torso, replacing the visible portion of the default tunic.

| Item | Rarity | Visual Description |
|------|--------|--------------------|
| **Bronze Armor** | Common | A simple breastplate in dull copper tones. Two horizontal bands across the chest. No shoulder guards. The tunic is still visible at the arms and waist. Looks like a new recruit's first real piece of gear. |
| **Iron Chainmail** | Uncommon | A full chainmail shirt rendered as a fine crosshatch pattern in silver-grey. Covers the torso and upper arms. A subtle green shimmer effect (uncommon rarity). Heavier, more serious -- this character has seen some battles. |
| **Steel Plate Armor** | Rare | Polished steel plates covering chest, shoulders, and upper arms. A blue-tinted highlight on the shoulder pauldrons. A central chest ridge gives it a knightly silhouette. The blue rarity glow outlines the edges softly. |
| **Golden Armor** | Epic | Magnificent full plate armor in warm gold tones with dark accents at the joints. Ornate scrollwork etched into the chest plate (1-pixel detail lines). Broad shoulder guards. Purple particle motes drift slowly around the character -- the hallmark of epic rarity. This is the armor of a champion. |

### Cape (Back Layer -- z-index 4)

The cape renders behind the character's body but in front of the banner. It drapes from the shoulders and hangs to roughly knee height. Idle animation gently sways the cape's bottom edge (2-frame alternation).

| Item | Rarity | Visual Description |
|------|--------|--------------------|
| **Traveler's Cloak** | Common | A short brown cloak that barely reaches the character's waist. Rough-hemmed, practical. The kind of thing you'd find in any village market. Simple and unassuming. |
| **Silver Cloak** | Uncommon | A longer cloak in pale silver-grey that reaches the knees. The hem has a thin border of darker grey. A faint shimmer plays across the fabric. Elegant without being ostentatious. |
| **Phoenix Cloak** | Rare | A striking cloak in deep crimson and orange gradient that flows from the shoulders. The bottom edge is ragged and flame-shaped -- as if the cloak is perpetually smoldering. A soft blue glow traces the outer edge. Warm embers (1-pixel orange dots) occasionally drift upward from the hem. |
| **Shadow Mantle** | Epic | A deep black cloak that seems to absorb the light around it. The edges are wispy and indistinct, as if the cloak is made of living shadow. Purple particles swirl at the fringe. When combined with dark armor, the character becomes a silhouette of mystery. |
| **Arena Champion Cape** | Epic (Quest) | A rich royal blue cape with a gold-embroidered border. A small shield crest is visible at the clasp point on the shoulder. The purple epic particles circle the crest specifically. This cape tells the world you conquered the Arena. |

### Jewelry (Accessory Overlay -- z-index 6)

Jewelry renders as small bright details on the character -- a glint at the neck, a glow on the hand, or a gem on the chest. Because the character is 64x64, jewelry must be economical: 2-4 pixels of bright color in the right place convey the item.

| Item | Rarity | Visual Description |
|------|--------|--------------------|
| **Copper Ring** | Common | A tiny warm-toned dot on the character's right hand. Subtle -- you have to look for it. But it's there, your first treasure. |
| **Silver Amulet** | Uncommon | A small bright pixel at the character's neck/upper chest, with a faint green shimmer. An amulet on a thin chain. Catches the light. |
| **Guild Ring** | Rare | A slightly larger bright dot on the hand, with a 1-pixel gem in blue. A thin blue glow radiates outward by 1 pixel. This ring marks you as guild-certified. |
| **Dragon Pendant** | Legendary | A 3x3 pixel gem suspended at the chest, glowing in alternating warm tones (red to gold, 2-frame animation). A golden aura halo surrounds the pendant area. Sparkle particles (tiny white dots) appear and fade in a 4-frame cycle. The single most visually impressive jewelry piece -- unmistakable even at small size. |
| **Merchant Ring** | Rare (Quest) | Similar to Guild Ring but with a gold-toned gem instead of blue. A coin-shaped glint. |

### Boots (Feet Layer -- z-index 2)

Boots replace the character's bare feet / cloth wrappings. They cover the lower legs and feet.

| Item | Rarity | Visual Description |
|------|--------|--------------------|
| **Leather Boots** | Common | Simple brown boots that reach just above the ankle. Slightly darker than the tunic. Practical. The first step up from bare feet -- literally. |
| **Iron-Shod Boots** | Uncommon | Grey-silver boots with visible metal plating on the shins. Heavier-looking, with a darker sole. The shimmer effect makes the metal plates glint. A warrior's footwear. |
| **Winged Sandals** | Rare | Open-toed sandals in white/silver with tiny wing-like protrusions at the ankles (2 pixels each, angled upward). A soft blue glow at the wings. Ethereal and light -- the character looks like they could take flight. |
| **Void Walkers** | Epic | Black boots that fade to transparency at the sole, as if the character is standing on darkness itself. Purple particles drift downward from the boots, pooling briefly before fading. Walking on void. Unsettling and powerful. |

### Hairstyle (Head Layer -- z-index 5)

The hairstyle layer replaces the character's default messy brown hair. It sits on top of the head and can dramatically change the character's silhouette.

| Item | Rarity | Visual Description |
|------|--------|--------------------|
| **Classic Warrior Cut** | Common | Short, practical hair in dark brown. Slightly more styled than the default -- think a clean military cut. The hair sits tight to the head with a slight peak at the front. |
| **Noble Braids** | Uncommon | Longer hair pulled into two visible braids that drape over the shoulders. Medium brown with lighter highlights. An uncommon shimmer plays through the strands. Dignified and regal. |
| **Crown of Flames** | Rare | Hair in fiery orange and red that stands upward, styled as if caught in an updraft. 2-3 pixels extend above the normal head silhouette. A blue rarity glow traces the hair tips. The character looks fierce and untameable. |
| **Celestial Locks** | Epic | Long, flowing hair in silver-white that cascades down the character's back (overlapping the cape layer at the top). Tiny star-like sparkles (white pixels) flicker through the hair on a slow cycle. Purple motes orbit the hair. Otherworldly and beautiful. |
| **Legendary Crown** | Legendary (Quest) | A golden crown with three visible points, each tipped with a tiny gem (red, blue, green -- 1 pixel each). The crown sits atop the default hair (or any equipped hair). Golden aura radiates outward. This is the ultimate status symbol -- proof of absolute mastery. |

### Color Palette (CSS Overlay -- no z-index layer)

The color palette does not add a visible layer. Instead, it applies a **CSS `mix-blend-mode: multiply`** overlay to the entire avatar container, tinting all layers uniformly.

| Item | Rarity | Visual Effect |
|------|--------|---------------|
| **Earth Tones** | Common | A warm brown-orange tint (`rgba(139, 115, 85, 0.15)`). Makes everything feel grounded and natural. The default medieval look. Subtle enough that equipment colors still read clearly. |
| **Royal Purple** | Uncommon | A regal purple tint (`rgba(128, 0, 128, 0.12)`). Gives the entire character a majestic, noble bearing. Armor takes on a purple sheen, cloaks deepen toward violet. The character looks like royalty. |
| **Crimson & Gold** | Rare | A warm red-gold tint (`rgba(180, 50, 20, 0.10)` blended with `rgba(255, 215, 0, 0.08)`). The character radiates warmth and power. Everything shifts toward the champion's colors. Particularly stunning with Golden Armor. |

### Banner (Background Layer -- z-index 0)

The banner renders **behind** the character, planted into or beside the pedestal. It extends upward from the pedestal to roughly the character's head height. A small flag or pennant on a thin pole.

| Item | Rarity | Visual Description |
|------|--------|--------------------|
| **Apprentice Banner** | Common | A small triangular pennant on a thin wooden pole, in plain beige with no markings. Planted on the right side of the pedestal. The cloth has a gentle 2-frame sway animation. Humble beginnings. |
| **Knight's Standard** | Uncommon | A rectangular banner on a taller pole, in blue and white stripes. The pole is metal (grey). An uncommon shimmer highlights the banner's edge. More imposing, more official. |
| **Dragon Banner** | Rare | A large pennant in deep red with a simplified dragon silhouette (3x4 pixel darker shape). The pole is dark iron. A blue glow traces the dragon shape. Wind animation is more pronounced (3 frames). This banner announces you to the realm. |
| **Legendary Crest** | Legendary | An ornate standard with a golden frame around a deep purple field. A detailed crest (crown + crossed swords, ~5x5 pixels) is centered on the flag. Golden aura emanates from the entire banner. Sparkle particles orbit the crest. The most prestigious symbol in the land. |
| **Scribe's Quill Banner** | Rare (Quest) | A unique banner featuring a quill-and-scroll motif on parchment-colored cloth. The pole is topped with a small ink bottle ornament. Scholarly and distinctive. |

### Emblem (Shield/Badge Overlay -- z-index 7)

The emblem appears as a small shield or badge on the character's chest or left arm. It sits on the topmost layer so it's always visible, even over armor.

| Item | Rarity | Visual Description |
|------|--------|--------------------|
| **Novice Emblem** | Common | A tiny round badge (3x3 pixels) in grey, positioned on the character's left chest. Barely noticeable -- a beginner's mark. |
| **Scholar's Seal** | Uncommon | A small shield shape (4x4 pixels) in blue and silver on the left arm. A book symbol (1-pixel open shape) is faintly visible. The uncommon shimmer draws the eye. |
| **Dragon Emblem** | Rare | A 5x5 pixel shield with a red field and a black dragon silhouette. Positioned prominently on the left arm. The blue rarity glow makes it stand out against any armor. A badge of serious achievement. |
| **Legendary Crown Emblem** | Legendary | A golden shield (5x5) with a crown design, positioned on the chest over armor. The golden aura is intense here -- the emblem seems to radiate its own light. Sparkle particles orbit it specifically. The character bears the mark of a legend. |
| **Knight's Crest Emblem** | Epic (Quest) | A shield bearing crossed swords on a purple field. The purple particle effect circles the emblem. Earned through combat prowess. |

### Rarity Visual Effects (Applied Globally)

These effects apply to ALL equipment of the given rarity, in addition to any item-specific visuals:

| Rarity | Effect | Technical Implementation |
|--------|--------|--------------------------|
| **Common** | No effect. Clean, plain appearance. | No additional CSS/overlay. |
| **Uncommon** | A subtle **shimmer** that passes across the item every 4 seconds. Like light catching polished metal. | CSS `@keyframes shimmer` -- a semi-transparent white gradient that sweeps left-to-right across the layer using `background-position` animation. |
| **Rare** | A soft **blue glow outline** around the item. Constant, gentle, like moonlight. | CSS `filter: drop-shadow(0 0 2px #3b82f6) drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))` on the layer's `<img>`. |
| **Epic** | A **purple particle effect** -- 3-5 small purple dots that orbit or drift around the item. Slow, hypnotic. | Framer Motion animated `<div>` dots with circular motion keyframes, layered above the equipment image. |
| **Legendary** | A **golden aura** that radiates outward from the item, plus **sparkle particles** -- tiny white/gold dots that appear, twinkle, and fade in random positions. | CSS `box-shadow: 0 0 8px rgba(255, 215, 0, 0.6)` for the aura. Framer Motion animated sparkle dots with opacity + scale keyframes at random offsets. |

When multiple items of different rarities are equipped, each item shows its own rarity effect independently. A character wearing Common boots and a Legendary pendant will have plain feet and a chest that radiates golden light. The visual hierarchy is self-explanatory.

---

## 3. On-Screen Placement and Behavior

### Position and Size

The avatar lives in a **fixed-position widget in the bottom-right corner** of the viewport, sitting above the page content at `z-index: 35` (below the AdventureHUD at `z-index: 40` but above all page content).

**Dimensions**:
- Container: 160px wide x 180px tall (includes pedestal, character, and name plate)
- Character sprite: 128x128 CSS pixels (64x64 at 2x, rendered with `image-rendering: pixelated`)
- Pedestal: 128x32 CSS pixels below the character
- Name plate: 128px wide, 20px tall, below the pedestal
- Margin from screen edge: 24px right, 24px bottom

The widget has a **subtle backdrop**: a rounded rectangle with a very faint dark gradient background (`rgba(26, 21, 16, 0.4)`) and a thin border (`rgba(139, 90, 43, 0.3)`), matching the AdventureHUD's medieval aesthetic. This prevents the character from getting lost against variable page backgrounds.

### Idle Behaviors

The character is alive. Even when the user is working, the companion has a presence -- subtle, never distracting, but unmistakably animate.

**1. Breathing / Bobbing (Default Idle)**
- The character's body moves up by 1-2 CSS pixels, then back down, on a smooth 2-second cycle
- Implementation: CSS `@keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }` with `ease-in-out`
- The cape (if equipped) sways opposite to the bob -- when the body goes up, the cape hem dips down slightly
- This animation runs continuously and is the baseline "alive" state

**2. Looking Around (every 15-20 seconds)**
- The character's head (and eyes) shift 1 pixel to the left or right, hold for 2 seconds, then return to center
- Implementation: A sprite frame swap to a "look left" or "look right" variant, triggered by a random interval timer
- Frequency: once every 15-20 seconds (randomized to feel natural)
- The character appears curious, watchful -- like a real companion surveying the room

**3. Sitting Down (30 seconds of user inactivity)**
- After 30 seconds with no mouse/keyboard activity, the character transitions to a sitting pose
- The sprite swaps to a "sitting" frame: legs crossed, body lowered, leaning slightly forward
- The transition is animated with a Framer Motion spring: the character drops down 8px over 0.5 seconds
- The pedestal is now a bench

**4. Sleeping with ZZZ (2+ minutes of inactivity)**
- After 2 minutes idle, the sitting character closes their eyes and leans to one side
- Small "Z" characters (pixel-art, 4x4px) drift upward from the character's head in a slow cycle
- Three Z's at staggered heights, each fading out as it rises, replaced by a new one at the bottom
- The breathing animation slows to a 4-second cycle (half speed)
- Peaceful. The companion is resting until you return.

**5. Waking Up (when user returns)**
- Any mouse movement or keypress triggers the wake sequence
- The Z's disappear. The character springs upright (Framer Motion spring with slight overshoot)
- A brief stretch animation: arms extend outward for 0.5 seconds, then return to idle
- The breathing rate returns to normal (2-second cycle)
- There is a 0.3-second delay before the wake to avoid false triggers from brief cursor passes

### Reaction Animations

These are triggered by specific game events and play once before returning to idle. They are the companion's way of celebrating your achievements alongside you.

**1. XP Earned**
- The character does a **small jump** -- 6px upward, landing with a tiny bounce (Framer Motion spring)
- A floating text particle appears above the character: "+50 XP" in gold pixel-font, drifting upward and fading over 1.5 seconds
- Duration: ~1 second total
- Trigger: any XP gain event from AdventureModeContext

**2. Level Up**
- This is the big one. The companion's moment of glory.
- The character **jumps high** (16px upward) with arms raised in a victory pose (sprite swap)
- A burst of **confetti particles** (8-12 small colored squares) explodes outward from the character, arcing with gravity and fading
- A **golden glow ring** expands outward from the character (CSS box-shadow animation scaling from 0 to 20px radius)
- The character's sprite briefly **flashes white** (CSS filter: brightness(2) for 0.1s, twice)
- A floating "LEVEL UP!" text in large gold letters appears above, with a subtle bounce
- Duration: ~3 seconds, then return to idle
- This animation should make the user feel genuinely rewarded

**3. Coins Earned**
- A small **gold coin sprite** (8x8 pixels) falls from above the character
- The character reaches up and **catches it** (sprite swap to "hands up" for 0.5s)
- A small "+25" text in yellow appears briefly
- A satisfying *clink* particle effect (tiny yellow spark) at the catch point
- Duration: ~1.2 seconds

**4. Achievement Unlocked**
- The character **holds up a trophy** (sprite swap to "trophy pose" -- one arm raised holding a small cup)
- A **sparkle burst** radiates from the trophy
- The achievement name appears in a small banner above the character for 3 seconds
- Duration: ~2.5 seconds

**5. Quest Completed**
- The character strikes a **victory pose** -- fist pump with a wide stance
- A small **banner unfurls** behind the character (expanding from 0 to full width over 0.5 seconds)
- A subtle **fanfare visual** -- three small stars appear in sequence above the character (pop, pop, pop)
- Duration: ~2 seconds

**6. Store Purchase**
- The character **inspects the new item** -- a brief animation where the new equipment piece floats in front of the character, then snaps into its equipped position
- The character does a **spin** (4-frame rotation: front, right, back, left, front)
- This lets the user see the item from the "front" before it settles
- Duration: ~2 seconds

**7. Login Streak**
- When the user first loads the page with an active streak, the character **waves hello** -- arm raised, 3 back-and-forth sways
- A small flame icon (matching the streak display) appears above the character with the streak number
- Duration: ~2 seconds

### Animation Queue

Multiple events can fire in quick succession (e.g., quest completion that awards XP + gold + achievement). The animation system uses a **queue**:
1. Events are queued in order of arrival
2. Each animation plays to completion before the next begins
3. If the queue exceeds 3 items, intermediate XP/gold animations are collapsed into a single combined animation
4. Level-up and achievement animations are never collapsed -- they always play

---

## 4. Interaction Model

### Click: Open Character Sheet

Clicking the avatar opens a **mini character sheet** -- a compact overlay panel that appears above/beside the character widget, showing the paper-doll equipment view and basic stats.

**Character Sheet contents**:
- A larger view of the character (192x192, 3x sprite size) centered at the top
- Current title and level below the character
- 8 equipment slots displayed in a 2x4 grid, each showing the equipped item name (or "Empty" in grey)
- A small "View Store" link at the bottom that navigates to `/store`
- A close button (X) in the top-right

The panel slides in with a Framer Motion `spring` animation from the bottom-right.

### Hover: Character Reacts

When the cursor enters the avatar widget:
- The character **looks toward the cursor** -- if the cursor is to the left, the character faces left; above, it tilts up slightly
- A subtle **tooltip** fades in after 0.5 seconds showing the character's title and level: "Sir Adventurer -- Level 7"
- The character's idle bob gets slightly more pronounced (amplitude increases from 2px to 4px) -- it's excited to see you

### Drag: Reposition

Users can **click and drag** the avatar widget to reposition it anywhere along the edges of the screen.

- The drag handle is the entire widget
- While dragging, the widget has a slight opacity reduction (0.8) and a stronger drop shadow
- On release, the widget snaps to the nearest screen edge (bottom-right, bottom-left, or bottom-center)
- The position is saved to `localStorage` with key `avatar-companion-position`
- Default position: bottom-right

### Right-Click: Context Menu

Right-clicking the avatar opens a small context menu:
- **Minimize** -- collapses the avatar to a tiny 32x32 icon (just the character's head) with no animations
- **Restore** -- restores from minimized state (with a pop-up spring animation)
- **Reset Position** -- returns the avatar to the default bottom-right position
- **View Equipment** -- opens the character sheet (same as click)

### Speech Bubbles

Periodically (every 60-90 seconds), the character displays a **small speech bubble** with a medieval-themed tip or encouragement. The bubble appears above the character, holds for 5 seconds, then fades.

Example lines:
- "A wise adventurer checks the Quest Board daily."
- "Your skills grow sharper with each challenge, hero."
- "The Merchant has new wares... perhaps worth a visit?"
- "Fortune favors the bold. And the well-equipped."
- "Your journey is {xpPercent}% to the next level!"
- "A {loginStreak}-day streak! The realm takes notice."
- "Have you inspected the Roadmap lately?"

The bubbles are context-aware:
- If the user has unspent gold > 500: "Your coffers overflow! The Armory awaits."
- If a quest is available but not started: "An adventure beckons at the Guild..."
- If the user hasn't visited in a few days: "Welcome back, brave one! We missed you."
- On the Store page: "Choose wisely -- each piece tells your story."

Speech bubbles can be disabled via the right-click context menu.

---

## 5. Integration with Existing UI

### Main Dashboard (Persistent Companion)

The avatar widget is rendered as a **fixed-position element** in the root app layout, outside of route-specific page content. It appears on every page when Medieval Mode is enabled.

**Placement in component tree**:
```
<App>
  <AdventureModeProvider>
    <ThemeProvider>
      <Sidebar />
      <main>{page content}</main>
      <AdventureHUD />            {/* existing -- top center */}
      <AvatarCompanion />         {/* NEW -- bottom right */}
      <NotificationToasts />      {/* existing -- notifications */}
    </ThemeProvider>
  </AdventureModeProvider>
</App>
```

The companion is visible on all pages -- dashboard, matches, roadmap, skills, profile, store, quests. It provides continuity and persistence to the gamification experience.

### Store Page (Live Equipment Preview)

This is where the avatar becomes a **critical UX element**, not just decoration.

When the user is on the Store page (`/store`):
- The avatar widget **expands** to a larger preview size (192x192, 3x scale) and repositions to the left side of the store grid
- The expanded view shows the full character with all equipment
- When the user **hovers over a store item**, the avatar temporarily shows that item equipped (replacing the current item in that slot), so the user can preview how it looks before purchasing
- A "Preview" label appears above the avatar when showing a previewed item
- When the cursor leaves the item, the avatar reverts to the actual equipped loadout
- When the user **purchases an item**, the "Store Purchase" reaction animation plays on the avatar

This transforms the store from an abstract list of names into a tangible visual experience. "I wonder how the Phoenix Cloak looks" is answered instantly by hovering.

### Quest Board

When the user is on the Quests page (`/quests`):
- The avatar remains in its standard position
- When a quest is accepted, the character does the "Login Streak" wave but with a determined expression (arm raised, fist clenched)
- When a quest is completed from this page, the Quest Complete animation plays
- A potential future enhancement: the character "walks" to the quest board (a decorative detail only)

### AdventureHUD Relationship

The AdventureHUD (top-center bar) and the AvatarCompanion (bottom-right widget) serve complementary roles:
- **HUD**: Quick-reference numbers (Level, XP bar, Gold count, Achievements, Streak)
- **Avatar**: Visual representation of your character and their equipment

They share the same context (`AdventureModeContext`) and react to the same events. When the HUD shows "+50 XP" in its notification, the avatar simultaneously does its XP jump animation. They are synchronized but independent UI elements.

### Level-Up Modal

When a level-up occurs, the existing notification system (NotificationToasts) fires. Simultaneously:
- The avatar plays its full level-up celebration animation
- The avatar's pedestal transitions to its new level appearance (if applicable)
- The golden glow lingers for 5 seconds after the celebration ends

### Medieval Mode OFF

When Medieval Mode is toggled off:
- The avatar plays a **farewell wave** animation (0.5s)
- The widget slides down off the bottom of the screen (Framer Motion exit animation: `y: 200, opacity: 0`)
- The component returns `null` -- fully unmounted, zero performance cost
- When Medieval Mode is toggled back on, the avatar slides up from the bottom with a wave-hello entrance

---

## 6. Text-Based Wireframes

### 6.1 Avatar Widget (Bottom-Right Corner, Default State)

```
                                                    Page Content
                                              ......................
                                              ......................
                                              ......................
                                              ......................
                                              ......................
                                              ......................
                                              ......................
                                                         +------------------------+
                                                         |                        |
                                                         |     [Banner Flag]      |
                                                         |        |               |
                                                         |    .-------.           |
                                                         |    | o   o |  <hair>   |
                                                         |    |  ___  |           |
                                                         |    '-------'           |
                                                         |  [cape] |torso| [emblem]|
                                                         |    [armor overlay]      |
                                                         |    [jewelry glint]      |
                                                         |       |    |           |
                                                         |     [boots][boots]      |
                                                         |   ==================   |
                                                         |   [ stone pedestal ]   |
                                                         |   ==================   |
                                                         |   " Apprentice Lv.3 "  |
                                                         +------------------------+
```

### 6.2 Mini Character Sheet (On Click)

```
                                     +----------------------------------+
                                     |  [X]                             |
                                     |                                  |
                                     |        .-----------.             |
                                     |        |           |             |
                                     |        |   3x size |             |
                                     |        |  preview  |             |
                                     |        |  of your  |             |
                                     |        | character |             |
                                     |        |           |             |
                                     |        '-----------'             |
                                     |                                  |
                                     |     "Knight Errant" -- Level 5   |
                                     |                                  |
                                     |  +----------+  +----------+     |
                                     |  | Armor:   |  | Cape:    |     |
                                     |  | Steel    |  | Phoenix  |     |
                                     |  | Plate    |  | Cloak    |     |
                                     |  +----------+  +----------+     |
                                     |  +----------+  +----------+     |
                                     |  | Boots:   |  | Hair:    |     |
                                     |  | Iron-Shod|  | Noble    |     |
                                     |  |          |  | Braids   |     |
                                     |  +----------+  +----------+     |
                                     |  +----------+  +----------+     |
                                     |  | Jewelry: |  | Banner:  |     |
                                     |  |  (empty) |  | Dragon   |     |
                                     |  |          |  | Banner   |     |
                                     |  +----------+  +----------+     |
                                     |  +----------+  +----------+     |
                                     |  | Emblem:  |  | Palette: |     |
                                     |  | Scholar's|  | Royal    |     |
                                     |  | Seal     |  | Purple   |     |
                                     |  +----------+  +----------+     |
                                     |                                  |
                                     |     [ Visit the Armory --> ]     |
                                     +----------------------------------+
```

### 6.3 Avatar on Store Page (Live Preview)

```
+-------------------------------------------------------------------+
|  The Merchant's Armory                                             |
+-------------------------------------------------------------------+
|                                                                     |
|  +----------------+    +--------+ +--------+ +--------+ +--------+ |
|  |                |    | Bronze | | Iron   | | Steel  | | Golden | |
|  |  .-----------. |    | Armor  | | Chain  | | Plate  | | Armor  | |
|  |  |           | |    | Common | | Uncomm | | *HOVER*| | Epic   | |
|  |  |  192x192  | |    | 150g   | | 300g   | | 600g   | | 1000g  | |
|  |  |  PREVIEW  | |    +--------+ +--------+ +--------+ +--------+ |
|  |  | (showing  | |                                                 |
|  |  |  Steel    | |    +--------+ +--------+ +--------+ +--------+ |
|  |  |  Plate    | |    | Trvlr  | | Silver | | Phoenx | | Shadow | |
|  |  |  preview) | |    | Cloak  | | Cloak  | | Cloak  | | Mantle | |
|  |  |           | |    | Common | | Uncomm | | Rare   | | Epic   | |
|  |  '-----------' |    | 100g   | | 250g   | | 550g   | | 900g   | |
|  |   "Preview"    |    +--------+ +--------+ +--------+ +--------+ |
|  +----------------+                                                 |
|                                                                     |
+-------------------------------------------------------------------+
```

### 6.4 Avatar Celebrating a Level Up

```
                                                         +------------------------+
                                                         |    *  *        *       |
                                                         |       * LEVEL UP! *    |
                                                         |    *        *    *     |
                                                         |                        |
                                                         |    .-------.           |
                                                         |    | ^   ^ |           |
                                                         |    |  \o/  |           |
                                                         |    '-------'           |
                                                         |       \|/              |
                                                         |     [  |  ]            |
                                                         | ~~~~golden glow~~~~    |
                                                         |       / \              |
                                                         |   ==================   |
                                                         |   [ stone pedestal ]   |
                                                         |   ==================   |
                                                         |  < confetti falling >  |
                                                         +------------------------+
```

---

## 7. Professional Balance

This feature lives inside a platform associated with EY -- a professional services firm. The avatar must enhance the experience without undermining credibility.

### Guard Rails

1. **Only visible when Medieval Mode is ON.** Users who never toggle it will never see the avatar. The professional platform experience is completely unaffected.

2. **Minimizable to a 32x32 icon.** One right-click and the character collapses to a tiny head icon in the corner. For users who want the gamification system (XP, gold, achievements) but find the character too much, this is the escape hatch.

3. **Animations are subtle by default.** The idle bob is 2 pixels. The looking-around is 1 pixel. The breathing cycle is 2 seconds. Nothing is hyperactive, flashing, or attention-demanding. The character is a calm, quiet presence.

4. **Reaction animations are brief.** The longest animation (level-up) is 3 seconds. XP/gold notifications are 1-1.5 seconds. They celebrate and stop. No looping fanfares.

5. **Speech bubbles are infrequent and useful.** One every 60-90 seconds. They nudge the user toward platform features, not toward the gamification system itself. "Have you checked the Roadmap?" is a productivity nudge dressed in medieval language.

6. **No sound effects.** The avatar is entirely visual. No chimes, no beeps, no "hey listen!" audio cues. This is non-negotiable for a professional context.

7. **Respects `prefers-reduced-motion`.** If the user's OS or browser requests reduced motion, all animations are disabled. The character is rendered as a static sprite. Rarity effects become static glows (no particles, no shimmer).

8. **Does not obstruct content.** The widget is positioned in the bottom-right corner, which is traditionally dead space in most web layouts. It does not overlap navigation, content areas, or interactive elements. The drag feature allows repositioning if it ever gets in the way.

9. **Art style is "cute professional."** Think the difference between a Slack emoji and a Fortnite skin. The pixel art aesthetic is nostalgic, approachable, and deliberately low-fidelity. It reads as a charming design choice, not a children's game.

### The Professional Argument

The avatar companion makes the gamification system tangible. Without it, the store is a list of abstract names ("Bronze Armor," "Silver Cloak") that affect nothing visual. With the avatar, every purchase has visible impact. Every level gained changes the pedestal. Every rarity tier glows differently. The gamification system goes from "numbers on a screen" to "my character is growing."

This is the same insight that makes Habitica effective for millions of productivity-focused adults. The visual companion creates emotional investment that abstract metrics cannot.

---

## 8. Phased Delivery Recommendation

### Phase 1: MVP -- "Get the Companion on Screen" (3-4 stories)

**Goal**: A static character that appears on screen and reflects equipped items.

**Deliverables**:
- `AvatarCompanion` React component with DOM/CSS layer rendering
- Base character sprite (idle, single frame -- no animation yet)
- 4 placeholder equipment sprites (one per category, using LPC or simple hand-drawn assets)
- Fixed bottom-right position, visible when adventure mode is enabled
- Basic entrance/exit animation (slide up/down via Framer Motion)
- Wire `equipped_items` from `AdventureModeContext` to layer rendering
- Populate `image_url` for the initial 4 items in `cosmetic_seed.py`

**What the user sees**: A little character in the corner that shows whatever armor/cape they have equipped. It stands there. It exists. It is real.

**Why start here**: This validates the core concept with minimal investment. If the user loves it, we invest in animation. If they want changes, we pivot early.

### Phase 2: Full Equipment + Idle Animations (4-5 stories)

**Goal**: All 36 items render on the character, and the character feels alive.

**Deliverables**:
- All 36 equipment piece sprites created/sourced (the big asset effort)
- Idle breathing/bobbing animation (CSS keyframes)
- Looking around behavior (random interval sprite swap)
- Sitting idle animation (30s inactivity)
- Sleeping animation (2min inactivity, ZZZ particles)
- Wake-up animation (on user activity)
- Rarity visual effects (shimmer, glow, particles for all 5 tiers)
- Color palette support via CSS `mix-blend-mode`
- Pedestal level progression (5 pedestal variants)
- Name plate showing title and level

**What the user sees**: A living companion that breathes, looks around, sits down when you're away, and wears all the gear you've bought. Rarity effects make expensive items visually distinct.

### Phase 3: Reactions + Interaction (3-4 stories)

**Goal**: The character responds to events and the user can interact with it.

**Deliverables**:
- All 7 reaction animations (XP, level up, coins, achievement, quest, purchase, login)
- Animation queue system
- Click to open mini character sheet
- Hover interaction (character looks at cursor, tooltip)
- Speech bubble system with context-aware messages
- Right-click context menu (minimize, restore, reset position)

**What the user sees**: The character celebrates when you level up, catches coins when you earn them, and gives you tips. Clicking it shows your equipment loadout. It feels like a companion, not a decoration.

### Phase 4: Polish + Store Preview (2-3 stories)

**Goal**: Deep integration with the store and final polish.

**Deliverables**:
- Store page live preview (hover item to preview on avatar)
- Expanded avatar view on store page
- Drag to reposition (with localStorage persistence)
- `prefers-reduced-motion` support
- Responsive behavior (tablet: smaller, mobile: icon)
- Performance optimization (lazy-load sprites, preload equipped items)
- Accessibility: alt text for screen readers, keyboard interaction

**What the user sees**: The store becomes a dressing room. The avatar can be moved around. The feature is polished, accessible, and production-ready.

### Estimated Total Effort

| Phase | Stories | Primary Bottleneck |
|-------|---------|-------------------|
| Phase 1 | 3-4 | Component architecture + initial sprites |
| Phase 2 | 4-5 | Asset creation (36 sprites) |
| Phase 3 | 3-4 | Animation system + interaction |
| Phase 4 | 2-3 | Store integration + polish |
| **Total** | **12-16 stories** | Asset pipeline is the long pole |

---

## 9. Open Questions

1. **Character gender/customization**: Should the base character be gender-neutral, or should there be a selection? (Recommendation: start gender-neutral, consider options later)
2. **Multiple characters**: Could the user ever have multiple companion types (knight, mage, rogue)? (Recommendation: not in V1, but the layer system could support it)
3. **Social features**: Could other users see your avatar? (On a leaderboard, in a team view?) This dramatically increases the value of cosmetics.
4. **Animation budget**: How many unique sprite frames are we comfortable creating? More frames = smoother animation = more art time.
5. **LPC licensing**: If we use LPC assets, we need CC-BY-SA 3.0 attribution. Is this acceptable for an EY-associated platform?

---

## 10. Closing Thoughts

This feature transforms the Medieval Mode gamification system from an abstract number game into a visual, emotional experience. The avatar is the difference between "I have 1,200 gold" (abstract) and "my knight is wearing Golden Armor and a Phoenix Cloak" (tangible, personal, worth showing off).

Every great gamification system has a visual anchor -- the character, the avatar, the hero. Habitica has its pixel warrior. Duolingo has its owl. We will have our Knight.

The technical foundation is already built. The `equipped_items` field flows from the backend through the progression API, through React Query, through the AdventureModeContext, and is ready to be consumed by an `AvatarCompanion` component. The store has 36 items across 8 slots. The data model is a near-perfect match for a layered paper-doll system.

The primary investment is **art assets** and **animation design**, not engineering. The DOM/CSS layer approach means the component itself is straightforward React -- the magic is in the sprites.

Build this, and the "little mini-guy" becomes the heart of Medieval Mode.
