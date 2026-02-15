# Avatar Rendering Research: 2D Customizable Companion Character

**Date**: 2026-02-12
**Researcher**: researcher agent
**Context**: SpringAIS "Medieval Mode" gamification -- user wants "a little mini-guy that can hang out with me on the screen and I can buy things for him to wear"

---

## 1. Executive Summary

The user wants a persistent on-screen 2D avatar/companion that displays equipped cosmetic items from the existing store system. The app already has 36 cosmetic items across 8 equipment slots (armor, cape, jewelry, boots, hairstyle, color_palette, banner, emblem), a full purchase/equip/unequip API, and an `equipped_items: Record<string, CosmeticBrief | null>` field in the progression state.

**Recommended approach**: DOM/CSS layered PNG composition with CSS sprite-sheet idle animations, enhanced by Framer Motion for micro-interactions. This provides the simplest integration path, lowest bundle size impact, and sufficient visual quality for a small persistent companion element.

---

## 2. Rendering Approach Comparison

| Approach | Complexity | Bundle Size | Animation | Scalability | Performance | Best For |
|----------|-----------|-------------|-----------|-------------|-------------|----------|
| **DOM/CSS Layers** | Low | ~0 KB (native) | CSS keyframes + Framer Motion | Poor at many layers | Excellent (< 10 layers) | Small persistent UI elements |
| **SVG Composition** | Medium | ~0 KB (native) | SMIL / CSS / Framer Motion | Good (vector) | Good | Resolution-independent art |
| **HTML Canvas (Konva)** | Medium | ~40 KB (react-konva) | requestAnimationFrame | Good | Good (Canvas2D) | Interactive editors |
| **WebGL (PixiJS)** | High | ~200 KB (@pixi/react) | Ticker-based, sprite sheets | Excellent | Best (WebGL) | Game-heavy apps, many sprites |
| **Lottie** | Medium | ~50 KB (lottie-react) | After Effects export | Limited (pre-baked) | Good | Pre-designed vector animations |
| **DiceBear** | Low | ~20 KB | None (static SVG) | N/A (pre-built styles) | N/A | Profile pics, not equipment |

### Performance Benchmarks (from canvas-engines-comparison, 8K objects)

| Engine | Chrome FPS | Firefox FPS | Safari FPS |
|--------|-----------|-------------|------------|
| PixiJS (WebGL) | 60 | 48 | 24 |
| Konva (Canvas2D) | 23 | 7 | 19 |
| SVG | 10 | 7 | 10 |
| DOM | 17 | 1 | 11 |

**Note**: These benchmarks are for 8,000 simultaneous objects. For a single avatar with ~10 layers, DOM/CSS is more than sufficient and the overhead of a full rendering engine is unjustified.

### Detailed Evaluation

#### DOM/CSS Layered PNGs (RECOMMENDED)

**How it works**: Stack `<img>` or `<div>` elements with `position: absolute` inside a relatively positioned container. Each equipment slot maps to a z-index layer. Equipment changes swap the `src` attribute.

**Pros**:
- Zero additional dependencies (uses native browser capabilities)
- Trivially integrable with React state management and existing Framer Motion
- Easy to debug (browser dev tools inspect each layer)
- CSS `animation` with `steps()` for sprite-sheet idle animations
- Smallest possible bundle impact
- Already proven by Habitica's avatar system (DOM-based layer composition)

**Cons**:
- Not resolution-independent (must provide multiple sizes for retina)
- Not ideal if we later need complex particle effects
- Limited to simple animations without a game engine

**Verdict**: Best fit for a small companion widget that sits in a fixed position. The app already uses Framer Motion for the HUD animations, so adding bounce/hover/reaction animations is trivial.

#### SVG Composition

**How it works**: Each equipment piece is an SVG element. They compose inside a parent `<svg>` using `<g>` groups with layered ordering.

**Pros**:
- Resolution-independent (crisp at any size)
- Can be styled with CSS (color changes, hover effects)
- Good for the color_palette slot (CSS fill overrides)
- SVGR can transform SVGs into React components

**Cons**:
- Medieval pixel art aesthetic does not benefit from vector scalability
- Creating SVG equipment assets is significantly harder than pixel art PNGs
- SVG animation is less intuitive than CSS sprite sheets
- Chibi pixel art style looks better as actual pixel art, not vectors

**Verdict**: Would be ideal if the art style were vector/flat-design. For a medieval pixel art companion, SVG adds complexity without benefit.

#### PixiJS (@pixi/react)

**How it works**: WebGL-accelerated 2D rendering. Sprites load as textures, composed in a Container with z-ordering. The `@pixi/react` library provides declarative `<Sprite>` and `<Container>` components.

**Pros**:
- Best performance for complex scenes
- Native sprite sheet support with animation
- Rich ecosystem (filters, particles, blend modes)
- React bindings available via `@pixi/react`

**Cons**:
- ~200 KB bundle size addition for a single small avatar
- WebGL context overhead for a single widget
- Overkill for < 10 static layers with occasional animation
- Additional learning curve for the team
- PixiJS v8 React bindings still maturing

**Verdict**: Overkill for this use case. Would be appropriate if the app evolved into a full browser game, but for a persistent companion widget, the complexity/bundle tradeoff is poor.

#### Lottie Animations

**How it works**: Designers create animations in After Effects, export as JSON. `lottie-react` renders them in React with play/pause/loop control.

**Pros**:
- Stunning pre-designed animations
- Small file sizes (JSON)
- Cursor/scroll sync capabilities

**Cons**:
- Equipment customization requires creating separate Lottie files per combination (combinatorial explosion)
- Not suited for dynamic layer composition
- Requires After Effects workflow for asset creation
- Cannot swap individual layers at runtime

**Verdict**: Could complement the main approach for special animations (level-up celebration, quest complete), but cannot serve as the primary avatar rendering method due to the inability to dynamically swap equipment layers.

---

## 3. Recommended Architecture: DOM/CSS Layered PNG System

### 3.1 Component Structure

```
<AvatarCompanion>                    -- Fixed position container (Framer Motion)
  <div class="avatar-container">      -- Relative container, sized to sprite
    <img class="layer base" />        -- Base character body (always present)
    <img class="layer boots" />       -- z-index: 1
    <img class="layer armor" />       -- z-index: 2
    <img class="layer cape" />        -- z-index: 3
    <img class="layer hairstyle" />   -- z-index: 4
    <img class="layer jewelry" />     -- z-index: 5
    <img class="layer emblem" />      -- z-index: 6 (overlay on armor)
    <img class="layer banner" />      -- z-index: 7 (held item or background)
  </div>
  <div class="name-plate">           -- Title display below avatar
    <span>{title}</span>
  </div>
</AvatarCompanion>
```

### 3.2 Layer Rendering Order

Based on the existing 8 cosmetic categories, the recommended z-index layer order (back to front):

| Layer | Z-Index | Category | Notes |
|-------|---------|----------|-------|
| Banner/Background | 0 | banner | Behind character |
| Base Body | 1 | (always) | Default character sprite |
| Boots | 2 | boots | Feet layer |
| Armor | 3 | armor | Torso layer |
| Cape | 4 | cape | Over armor, behind head |
| Hairstyle | 5 | hairstyle | Head layer |
| Jewelry | 6 | jewelry | Accessory overlay |
| Emblem | 7 | emblem | Shield/chest overlay |
| Color Overlay | - | color_palette | CSS filter or multiply blend mode |

### 3.3 Color Palette Integration

The `color_palette` category is special -- it does not add a visual layer but modifies the appearance of existing layers. Implementation options:

1. **CSS filter**: `hue-rotate()` + `saturate()` applied to the container
2. **CSS mix-blend-mode**: A colored overlay `<div>` with `mix-blend-mode: multiply`
3. **Pre-tinted assets**: Ship multiple color variants of each equipment piece

Recommendation: CSS `mix-blend-mode: multiply` with a semi-transparent color overlay. Simple, performant, and allows the 3 color palettes (Earth Tones, Royal Purple, Crimson & Gold) to modify all layers uniformly.

### 3.4 Sprite Animation Strategy

**Idle Animation** (always playing when visible):
- CSS sprite sheet animation using `@keyframes` + `steps()` timing function
- 4-6 frames: subtle breathing/bobbing motion
- Example: `animation: idle 2s steps(4) infinite`

**Reaction Animations** (triggered by events):
- Framer Motion `animate` prop changes triggered by context state
- Level up: scale bounce + golden glow (`boxShadow` animation)
- XP gain: small jump (`y: -10` spring)
- Achievement: celebratory spin or arms-up pose
- Purchase: item flash/sparkle overlay
- Quest complete: victory pose (swap to victory sprite sheet for 2s)

**Hover Interaction**:
- `whileHover={{ scale: 1.05 }}` via Framer Motion (already in use)
- Tooltip with character stats

### 3.5 Integration with Existing System

The existing codebase provides a clean integration path:

**Data flow**:
```
progressionApi.getProgression()
  -> ProgressionState.equipped_items: Record<string, CosmeticBrief | null>
  -> AdventureModeContext.state (via useQuery)
  -> AvatarCompanion component reads equipped_items
  -> Each slot maps to an image asset URL
```

**Key integration points**:

1. **`equipped_items` field** (progressionService.ts:28): Already returns `Record<string, CosmeticBrief | null>` where keys are slot names (armor, cape, etc.) and values contain the cosmetic brief with id, name, category, rarity.

2. **`storeApi.equip()` / `storeApi.unequip()`** (storeService.ts:70-74): Already trigger equipment changes. After a successful equip/unequip, query invalidation updates the progression state, which flows to the avatar.

3. **`AdventureModeContext`** (AdventureModeContext.tsx:228-234): Already fetches progression with `useQuery` and `staleTime: 30000`. The avatar component can consume this context directly.

4. **`AdventureHUD`** (AdventureHUD.tsx): The avatar could live next to the HUD or be a separate fixed-position element. Both share the same context.

5. **`CosmeticCatalog.image_url`** (cosmetic_seed.py:94): Currently `None` for all items. This field needs to be populated with actual asset paths.

**Minimal changes required**:
- Add `image_url` values to cosmetic seed data (pointing to `/assets/cosmetics/{category}/{item_slug}.png`)
- Create new `AvatarCompanion` React component
- Add the component to the app layout (visible when adventure mode is enabled)
- No backend API changes needed -- all data is already available

---

## 4. Asset Requirements and Creation Workflow

### 4.1 Recommended Sprite Size

**64x64 pixels** is the sweet spot for this use case:
- Large enough to show equipment detail (armor trim, cape patterns, jewelry gems)
- Small enough to work as a persistent on-screen companion without dominating the UI
- Standard size with abundant free/open-source asset availability
- Renders at 128x128 CSS pixels on retina displays (still compact)

For comparison:
- 32x32: Too small to distinguish equipment details at screen size
- 128x128: Takes too much screen real estate for a persistent companion
- 64x64: The Goldilocks zone -- used by many successful pixel art games

### 4.2 Asset List

Based on the 36 existing cosmetic items + base character:

| Asset Category | Count | Files Needed |
|---------------|-------|-------------|
| Base body (default, no equipment) | 1 | base_idle.png (sprite sheet, 4-6 frames) |
| Armor variants | 4 | bronze_armor.png, iron_chainmail.png, steel_plate.png, golden_armor.png |
| Cape variants | 5 | travelers_cloak.png, silver_cloak.png, phoenix_cloak.png, shadow_mantle.png, arena_champion_cape.png |
| Jewelry variants | 4 | copper_ring.png, silver_amulet.png, guild_ring.png, dragon_pendant.png, merchant_ring.png |
| Boots variants | 4 | leather_boots.png, iron_shod_boots.png, winged_sandals.png, void_walkers.png |
| Hairstyle variants | 5 | classic_warrior.png, noble_braids.png, crown_of_flames.png, celestial_locks.png, legendary_crown.png |
| Banner variants | 4 | apprentice_banner.png, knights_standard.png, dragon_banner.png, legendary_crest.png, scribes_quill.png |
| Emblem variants | 4 | novice_emblem.png, scholars_seal.png, dragon_emblem.png, legendary_crown_emblem.png, knights_crest.png |
| Color palette overlays | 3 | (CSS-based, no image needed) |
| Special animations | 3-4 | level_up.png, quest_complete.png, achievement.png (sprite sheets) |
| **Total image assets** | **~38** | Plus 4 animation sprite sheets |

Each equipment image must:
- Be 64x64 pixels
- Have transparent background (PNG-32)
- Be pre-aligned to the base character body (same canvas size, positioned correctly)
- For idle animation: be a horizontal sprite sheet (e.g., 256x64 for 4 frames)

### 4.3 Asset Creation Tools

| Tool | Type | Cost | Best For |
|------|------|------|----------|
| **Aseprite** | Desktop app | $20 | Professional pixel art + animation; industry standard |
| **Piskel** | Web app | Free | Quick sprite editing, good for beginners |
| **LibreSprite** | Desktop app | Free (open source) | Aseprite alternative, full-featured |
| **Pixelorama** | Desktop app | Free (open source, Godot-based) | Full pixel art editor with animation |
| **GIMP** | Desktop app | Free | General image editing, layer support |
| **TexturePacker** | Desktop app | $40 | Sprite sheet packing from individual frames |

**Recommended workflow**:
1. Design base character in Aseprite/LibreSprite (64x64, 4-frame idle)
2. Create each equipment piece as a separate layer in the same file
3. Export each layer as individual PNG sprite sheets (matching base alignment)
4. Use TexturePacker or manual arrangement for sprite sheet creation
5. Place assets in `frontend/public/assets/cosmetics/{category}/`

### 4.4 Free Asset Sources (Medieval Fantasy)

| Source | License | Notes |
|--------|---------|-------|
| **OpenGameArt.org LPC** | CC-BY-SA 3.0 / GPL 3.0 | Extensive medieval character sprites with modular equipment layers. The Universal LPC Spritesheet Character Generator has hundreds of layerable clothing/weapon/armor pieces. Primarily 64x64 character sprites. |
| **itch.io free medieval assets** | Varies (check per pack) | Knight Chibi Character Sprites, Tiny Swords, medieval RPG character packs. Many free options available. |
| **CraftPix.net freebies** | Royalty-free (free tier) | 64x64 Medieval Pixel Character Portraits; some free packs available. |
| **Kenney.nl** | CC0 (public domain) | Simple style, limited medieval options but very permissive license. |

**Strongest option**: The **LPC (Liberated Pixel Cup)** asset library is the gold standard for this use case. It provides:
- Modular, layerable character sprites (body + individual equipment pieces)
- Hundreds of medieval-themed items already created by the community
- Web-based character generator for preview
- CC-BY-SA 3.0 license (requires attribution, allows commercial use)
- 64x64 character size with walk/idle/attack animations

The LPC system's layer approach directly mirrors the app's 8-slot equipment system, making it a natural fit.

---

## 5. Inspiration and Precedents

### 5.1 Habitica (Primary Inspiration)

Habitica is the closest precedent -- a productivity app with a full RPG gamification layer including an avatar paper doll system.

**How Habitica does it**:
- DOM-based rendering: layers are `<img>` elements composed via CSS positioning
- Each sprite is pre-aligned to a common canvas (transparent padding positions items correctly)
- Layer order: background -> mount -> body -> shirt -> hair -> head accessories -> armor -> weapon -> shield -> pet
- Equipment has both "battle gear" (affects stats) and "costume" (visual only)
- The `habitica-avatar` npm module exposes this as a reusable component
- Pixel art at approximately 90x90 rendered size

**Key takeaway**: DOM/CSS layering works at Habitica scale (millions of users). No canvas or WebGL required.

### 5.2 Other Precedents

| App/Product | Companion Type | Tech | Notes |
|-------------|---------------|------|-------|
| **Habitica** | Paper doll avatar | DOM layers | Full equipment system, pixel art |
| **GitHub Copilot** | Mascot (Mona octocat) | SVG + CSS | Static/animated logo, not customizable |
| **Clippy (Office)** | Assistant character | Sprite animation | Classic persistent companion, sprite-sheet based |
| **vscode-pets** | Desktop pets in VS Code | Canvas/sprite sheets | Multiple pet types, idle + walk animations |
| **Tamagotchi web clones** | Virtual pet | DOM/Canvas | Persistent state, needs management |
| **Browser sidebar pets** | Pixel companions | DOM + CSS animation | Small, unobtrusive, animated idle |

### 5.3 Design Direction

Based on the medieval theme and the "little mini-guy" description:

**Chibi knight style**: A cute, proportionally exaggerated (large head, small body) medieval character. Think Habitica meets Stardew Valley.

Key characteristics:
- 64x64 pixel art
- 2-3 head-to-body ratio (chibi proportions)
- Clear silhouette even at small sizes
- Equipment pieces should be recognizable and visually distinct per rarity tier
- Rarity reflected in visual complexity: Common items are simple shapes/colors, Legendary items have glow effects, animated particles, or elaborate detail
- Color palette should match the existing game theme (browns, golds, deep reds from the HUD)

---

## 6. Placement and UX Considerations

### 6.1 Position Options

| Position | Pros | Cons |
|----------|------|------|
| **Bottom-right corner (fixed)** | Unobtrusive, like a virtual pet; easy to notice | May overlap content on small screens |
| **Inside the AdventureHUD** | Contextually grouped with stats | HUD is already dense; adds visual clutter |
| **Sidebar bottom** | Always visible, natural placement | Sidebar may be collapsed |
| **Floating (draggable)** | User controls position | Implementation complexity |

**Recommendation**: Fixed position in the bottom-right corner, with a small collapse/expand toggle. When adventure mode is off, the avatar is hidden. When on, it appears with a Framer Motion entrance animation (slide up from bottom). Clicking the avatar opens a quick-view panel showing equipped items.

### 6.2 Responsive Behavior

- **Desktop (> 1024px)**: Full 128x128 CSS pixels (64x64 at 2x), with name plate and tooltip
- **Tablet (768-1024px)**: 96x96 CSS pixels, no name plate
- **Mobile (< 768px)**: Hidden or minimized to 48x48 icon in corner, tap to expand

---

## 7. Complexity Estimate

| Component | Effort | Notes |
|-----------|--------|-------|
| `AvatarCompanion` React component | Small | DOM layers + Framer Motion, ~150 LOC |
| CSS sprite-sheet idle animation | Small | CSS keyframes with `steps()`, ~30 LOC CSS |
| Event reaction animations | Small | Framer Motion variants, ~50 LOC |
| Asset creation (base + 36 items) | **Large** | ~38 PNG sprite sheets to create/source. This is the primary bottleneck. |
| `image_url` population in seed data | Trivial | Update strings in cosmetic_seed.py |
| Asset pipeline (loading, caching) | Small | Browser image caching, optional preload |
| Responsive/positioning | Small | CSS fixed positioning + media queries |
| **Total frontend dev work** | Medium | ~2-3 stories, 1-2 days dev time |
| **Total asset creation work** | Large | 3-5 days for custom art, or 1 day if using LPC assets |

### Overall Complexity: Medium

The frontend implementation is straightforward (the data model already exists). The primary challenge is asset creation -- either sourcing from LPC/open-source libraries or commissioning custom pixel art.

---

## 8. Integration Plan

### Phase 1: Foundation (MVP)
1. Create `AvatarCompanion` component with DOM/CSS layer rendering
2. Use placeholder/free LPC assets for base character + a few equipment pieces
3. Wire to `equipped_items` from AdventureModeContext
4. Add fixed position in bottom-right, visible when adventure mode enabled
5. Basic idle animation (CSS sprite sheet, 4 frames)

### Phase 2: Full Equipment
1. Create or source all 36 equipment piece assets
2. Populate `image_url` in cosmetic seed data
3. Add rarity visual effects (glow borders for Epic/Legendary)
4. Add color palette support via CSS mix-blend-mode

### Phase 3: Personality
1. Add reaction animations (level up, XP gain, achievement, quest complete)
2. Add hover interaction (tooltip with stats)
3. Add click interaction (quick equipment panel)
4. Add special animations for legendary items

### Phase 4: Polish
1. Responsive behavior for tablet/mobile
2. Accessibility considerations (reduced motion preference, alt text)
3. Optional: draggable positioning
4. Optional: Lottie animations for special events (level up celebration)

---

## 9. References

### Libraries
- **Framer Motion**: Already in use in AdventureHUD; handles micro-interactions
- **@pixi/react**: https://github.com/pixijs/pixi-react (evaluated, not recommended for this scope)
- **react-konva**: https://github.com/konvajs/react-konva (evaluated, not recommended)
- **lottie-react**: https://www.npmjs.com/package/lottie-react (useful for special animations only)
- **SVGR**: https://github.com/gregberge/svgr (useful if SVG path is chosen)

### Asset Sources
- **LPC Universal Spritesheet Generator**: https://liberatedpixelcup.github.io/Universal-LPC-Spritesheet-Character-Generator/
- **OpenGameArt.org medieval sprites**: https://opengameart.org/content/lpc-medieval-fantasy-character-sprites
- **itch.io medieval pixel art**: https://itch.io/game-assets/free/tag-medieval/tag-pixel-art
- **CraftPix.net medieval sprites**: https://craftpix.net/categorys/medieval-sprites/
- **Piskel (free sprite editor)**: https://www.piskelapp.com/

### Tools
- **Aseprite**: https://www.aseprite.org/ (sprite editor, $20)
- **LibreSprite**: https://libresprite.github.io/ (free Aseprite fork)
- **TexturePacker**: https://www.codeandweb.com/texturepacker (sprite sheet packing)

### Inspiration
- **Habitica avatar system**: https://habitica.fandom.com/wiki/Avatar
- **habitica-avatar module**: https://github.com/crookedneighbor/habitica-avatar
- **CSS sprite sheet animation**: https://blog.logrocket.com/making-css-animations-using-a-sprite-sheet/
- **Canvas engine benchmarks**: https://github.com/slaylines/canvas-engines-comparison

### Performance Data
- Canvas engines comparison: https://benchmarks.slaylines.io/
- PixiJS vs Konva comparison: https://aircada.com/blog/pixijs-vs-konva

---

## 10. Decision Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Rendering engine | DOM/CSS layers | Simplest, zero dependencies, proven by Habitica, sufficient for ~10 layers |
| Animation library | Framer Motion + CSS keyframes | Already in the project, covers micro-interactions and idle animation |
| Sprite size | 64x64 pixels | Best detail-to-size ratio for persistent companion |
| Asset format | PNG-32 sprite sheets | Transparent backgrounds, widely supported, easy to create |
| Art style | Chibi medieval pixel art | Matches theme, cute + compact, abundant free assets available |
| Asset source | LPC + custom | LPC for base + common items, custom for unique rarity-specific pieces |
| Placement | Fixed bottom-right | Unobtrusive, always visible, easy to collapse |
| Color palette slot | CSS mix-blend-mode | No additional assets needed per palette |
