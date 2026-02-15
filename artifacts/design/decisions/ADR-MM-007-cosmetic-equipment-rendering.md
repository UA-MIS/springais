# ADR-MM-007: Cosmetic Equipment Rendering Strategy

**Status**: Proposed
**Date**: 2026-02-15
**Decision**: D-CA-007

## Context

The Cedric avatar companion is a 2D pixel-art character (64x64 base) that appears in the bottom-right of the screen. He has 20 different animation states (idle, sitting, sleeping, celebrating, pointing, etc.), each rendered as a horizontal sprite strip with 1-6 frames per animation.

The current architecture (D-CA-002) specifies DOM/CSS layered PNGs for equipment rendering: transparent overlay images stacked on top of the base sprite via `position: absolute` and z-index ordering. `AvatarSprite.tsx` implements this with 8 equipment slots (banner, boots, armor, cape, hairstyle, jewelry, emblem) plus a color palette overlay.

### The Problem

The overlay approach assumes that equipment PNGs are pre-aligned to the base sprite at a specific pose. However, Cedric has **20 distinct animation states** with different body positions:

- **Idle states**: idle (breathing), lookAround (head turns), sitting (legs bent), sleeping (lying down)
- **Reactions**: jumpXP (airborne +6px), celebrateLevelUp (airborne +16px), catchCoin (arms up), holdTrophy (arms extended), victoryPose (arms raised), spinNewItem (rotating), waveHello (arm waving)
- **Contextual**: thinking (hand on chin), reading (holding book), pointing (arm extended), confused (scratching head), excited (bouncing), lookingFar (hand on brow), tracingLines (drawing), lookingUp (head tilted back)

Body-conforming items (armor, boots, capes, hairstyles, jewelry) must align with the character's body in each pose. Creating overlay PNGs for all combinations would require:

- 6 body-conforming categories x ~4 items each x 20 poses = **480 overlay assets**
- Each must be pixel-perfect aligned to the corresponding sprite frame
- Any future animation or item addition multiplies this further

This is impractical for an MVP and likely impractical even at scale for AI-generated pixel art where subtle frame-to-frame alignment is difficult to guarantee.

### Current Cosmetic Inventory

The 36 cosmetic items break down as follows:

| Category | Count | Body-Conforming? | Alignment Difficulty |
|---|---|---|---|
| Armor | 4 | Yes | High -- covers torso, changes shape with poses |
| Boots | 4 | Yes | High -- feet move with sitting, jumping, sleeping |
| Cape | 5 | Yes | High -- drapes behind body, affected by all poses |
| Hairstyle | 5 | Yes | Medium -- head position changes but less dramatically |
| Jewelry | 5 | Yes | Medium-High -- small items on body, hard to see if misaligned |
| Banner | 5 | No | Low -- behind character, fixed position relative to container |
| Emblem | 6 | No | Low -- badge/shield element, can be pinned to fixed position |
| Color Palette | 3 | No | None -- CSS `mix-blend-mode` overlay, works regardless of pose |

**22 items are body-conforming** (require per-pose alignment), **14 items are non-body-conforming** (work with any pose).

### Options Considered

**Option A: Idle-only overlays**
Keep the overlay approach but only render equipment layers when Cedric is in the `idle` animation state. Other poses fall back to the base sprite with no equipment visible.

- Pro: Simple implementation, reuses existing code
- Con: Equipment disappears during most interactions (reactions, loading, walkthrough) -- the moments when users are most likely watching Cedric. Breaks the visual contract: "I equipped golden armor but it vanishes when Cedric jumps"

**Option B: Reclassify cosmetics into body-conforming vs. non-body categories**
Keep items that work without body alignment (color palettes, banners, emblems). Reclassify or remove items that require body alignment (armor, boots, capes, hairstyles, jewelry). Replace them with new non-body items: auras, particles, pets, title plates, frame borders.

- Pro: All cosmetics render correctly in all poses
- Con: Requires reworking 22 of 36 existing catalog items; invalidates the store seed data, pricing tiers, and quest rewards that reference armor/boots/capes; removes the most visually exciting items (golden armor, phoenix cloak, void walkers)

**Option C: AI-generated sprite variants**
Generate complete sprite sheets for every item+pose combination using AI image generation. Each equipped item produces a full 20-pose sprite set where the item is baked into every frame.

- Pro: Highest visual quality, items appear in all poses perfectly
- Con: Requires 22 items x 20 poses x ~3 frames avg = ~1,320 individual sprite frames generated and validated; ongoing cost for new items; inconsistent style between AI batches; asset management complexity

**Option D: Non-body cosmetics only**
Simplify the cosmetic system to only include categories that never need body alignment: color palettes, banners/frames, emblems/badges, and add new non-body categories (aura effects, pedestal styles, title styles, pet companions).

- Pro: Every cosmetic always renders correctly in every pose
- Con: Similar to Option B but more aggressive; removes even more items; store feels less exciting without wearable gear

**Option E: Hybrid -- idle-pose overlays for body items, always-on for non-body items (Recommended)**
Render body-conforming equipment overlays (armor, boots, capes, hairstyles, jewelry) only during idle-family poses where the body position is known and consistent. Render non-body cosmetics (banners, emblems, color palettes) in all poses. Add visual feedback so the transition feels intentional rather than broken.

## Decision

**Option E: Hybrid rendering with idle-pose overlays for body-conforming items.**

### How It Works

1. **Classify each equipment slot as body-conforming or non-body**:

```typescript
const BODY_CONFORMING_SLOTS = new Set(['armor', 'boots', 'cape', 'hairstyle', 'jewelry']);
const ALWAYS_VISIBLE_SLOTS = new Set(['banner', 'emblem', 'color_palette']);
```

2. **Define idle-family poses** where body-conforming overlays are safe to render:

```typescript
const IDLE_FAMILY_POSES = new Set([
  'idle',           // Default standing -- primary equipment display pose
  'lookAround',     // Head turns but body stays same
  'wakeUp',         // Transitional, brief
]);
```

3. **In AvatarSprite.tsx**, conditionally render equipment layers:

```typescript
{EQUIPMENT_LAYERS.filter(({ slot }) => {
  const item = equippedItems[slot];
  if (!item) return false;
  if (ALWAYS_VISIBLE_SLOTS.has(slot)) return true;
  if (BODY_CONFORMING_SLOTS.has(slot)) return IDLE_FAMILY_POSES.has(animationState);
  return true;
}).map(({ slot, zIndex }) => (
  // ... render <img> overlay
))}
```

4. **Smooth transition**: When switching away from an idle-family pose, body-conforming layers fade out over 200ms (CSS `opacity` transition). When returning to idle, they fade back in. This prevents jarring pop-in/pop-out.

```css
.equipment-layer--body-conforming {
  transition: opacity 200ms ease-in-out;
}
.equipment-layer--body-conforming.hidden {
  opacity: 0;
  pointer-events: none;
}
```

5. **Equipment overlays only need to be created for the idle pose** -- a single 64x64 transparent PNG per item, aligned to the default standing position. This means:
   - 22 body-conforming items x 1 pose = **22 overlay assets** (not 480)
   - 5 banners x 1 asset = 5 assets (banners are position-fixed behind the sprite)
   - 6 emblems x 1 asset = 6 assets (emblems are position-fixed on the sprite)
   - 3 color palettes = 0 assets (CSS only)
   - **Total: 33 overlay assets** (same as original plan, no multiplication)

6. **Store preview and Character Sheet always show idle pose**: The 192x192 enlarged avatar in the store page and character sheet popup always renders in idle state, so equipped items are always visible in the "inspection" context where users care most about how their loadout looks.

### Rationale

- **Cedric spends most time in idle-family states.** The inactivity cycle is: idle (0-30s) -> sitting (30s-2min) -> sleeping (2min+). Reactions are brief (0.5-1.5s). During typical usage, Cedric is in idle/lookAround ~70-80% of the time. Body equipment is visible for the majority of the experience.
- **Reactions are brief and attention-grabbing.** When Cedric jumps for XP or catches a coin, the user's attention is on the animation itself, not on whether the armor overlay is pixel-perfect. A brief fade-out during the 0.5s jump animation is unlikely to be noticed.
- **Non-body items stay visible always.** Banners behind the character, emblems pinned to a fixed position, and color palette tints all render regardless of pose. Users always see some customization.
- **The store/character sheet shows full equipment.** The moments where users deliberately inspect their loadout (store page, character sheet) always use idle pose, so all items are visible.
- **Asset cost stays at O(N items) not O(N items x M poses).** Adding a new cosmetic item requires exactly one overlay PNG, not 20.
- **No catalog rework needed.** All 36 existing cosmetic items remain in the catalog. No renaming, re-pricing, or removal.
- **No external dependencies.** Pure CSS transitions handle the show/hide. No canvas rendering, no PixiJS, no AI generation pipeline.
- **Forward-compatible.** If in the future specific high-value items (e.g., legendary armor) warrant per-pose overlays, they can be added incrementally. The system checks for pose-specific assets first, falls back to idle-only.

### Future Enhancement Path

For high-priority items, the system can be extended to support per-pose overlays:

```
equipment/armor/golden-armor.png           # Default (idle) overlay
equipment/armor/golden-armor--sitting.png  # Optional: sitting pose overlay
equipment/armor/golden-armor--sleeping.png # Optional: sleeping pose overlay
```

Asset resolution logic:
```typescript
function getEquipmentAssetPath(category: string, itemName: string, pose?: string): string {
  const slug = itemName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (pose) {
    // Try pose-specific asset first
    return `/assets/cedric/equipment/${category}/${slug}--${pose}.png`;
  }
  return `/assets/cedric/equipment/${category}/${slug}.png`;
}
```

The existing `onError` handler already hides missing images, so pose-specific assets are a graceful enhancement that degrades to idle-only when not available. This can be done selectively for high-rarity or heavily-promoted items without requiring a full sprite matrix.

## Consequences

- **Positive**: All 36 cosmetic items remain viable with a manageable asset budget (33 PNGs).
- **Positive**: Equipment is visible during the majority of user interaction time (idle states).
- **Positive**: No catalog data changes, no seed data rework, no pricing rebalance needed.
- **Positive**: Simple implementation: one `Set` lookup + CSS opacity transition in `AvatarSprite.tsx`.
- **Positive**: Forward-compatible with per-pose overlays for specific items if justified later.
- **Negative**: Body-conforming equipment is not visible during reactions and contextual states (sitting, sleeping, thinking, etc.). Mitigated by fade transitions and the brevity of most non-idle states.
- **Negative**: Users in sitting/sleeping states for extended periods (AFK) will not see their armor. Mitigated by the fact that AFK users are not actively looking at the screen, and the character sheet is always available for inspection.

## Alternatives Rejected

1. **Option A (Idle-only, no transition)**: Rejected because abrupt show/hide is visually jarring. The fade transition in Option E solves this.
2. **Option B (Reclassify catalog)**: Rejected because it removes the most exciting items and requires significant rework to seed data, pricing, and quest rewards.
3. **Option C (AI-generated variants)**: Rejected because of the 1,300+ asset generation requirement, ongoing AI costs, and style consistency risk. May be revisited for a future "premium" tier.
4. **Option D (Non-body only)**: Rejected because it is too aggressive -- removes 22 of 36 items and makes the store less compelling.
