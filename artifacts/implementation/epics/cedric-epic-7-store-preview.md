# Epic 7: Store Live Preview & Interactions

> **Phase**: 3 (Dev-1, after Epic 5)
> **Estimated Stories**: 4
> **Dependencies**: Epic 1 (AvatarSprite), Epic 3 (SpeechBubble), StorePage
> **Architecture References**: Sections 2, 7

---

## Story 7.1: Implement Avatar Preview Mode on StorePage

**Size**: M

**Description**: When the user navigates to `/store`, the avatar automatically enlarges to 192x192 (3x scale) and enters a "preview mode" where equipment changes are reflected in real time.

**Acceptance Criteria**:
1. When the route is `/store`, `AvatarCompanion` renders the sprite at 192px size instead of the default 128px.
2. The enlarged avatar is positioned in a dedicated preview area on the store page (not the fixed bottom-right position).
3. The preview avatar shows all currently equipped items from `progression.equipped_items`.
4. When an item is equipped/unequipped via the store (existing `storeApi.equip()` / `storeApi.unequip()`), the avatar updates immediately via React Query invalidation of `QUERY_KEYS.progression`.
5. The pedestal and nameplate are visible in preview mode.
6. The avatar returns to normal size (128px) and fixed position when navigating away from `/store`.
7. Tests verify: 192px rendering on store page, real-time equipment update, return to normal on navigation.

**Dev Notes**:
- File: `frontend/src/components/avatar/AvatarCompanion.tsx` (modify -- detect `/store` route via `useLocation()`, switch to preview mode)
- File: `frontend/src/pages/StorePage.tsx` (modify -- add a preview area div that AvatarCompanion renders into when on store route)
- Architecture Section 2 defines store page sizing: 192x192 sprite.
- The equipment update already works via React Query -- when `storeApi.equip()` succeeds, it invalidates `QUERY_KEYS.progression`, which re-fetches `equipped_items`.

**Dependencies**: Epic 1 (AvatarSprite, AvatarCompanion)

---

## Story 7.2: Implement Hover-to-Preview for Store Items

**Size**: M

**Description**: When the user hovers over a store item, the avatar temporarily shows that item equipped (swapping the relevant equipment layer) without actually equipping it. On mouse leave, the avatar reverts to the actual equipped items.

**Acceptance Criteria**:
1. Hovering over a store catalog item triggers a temporary equipment layer swap on the avatar preview.
2. The swap only affects the relevant slot (e.g., hovering over "Iron Chainmail" temporarily replaces the armor layer).
3. Other equipped items remain visible during the preview.
4. On mouse leave, the avatar reverts to the actual `equipped_items` from progression state.
5. The preview state is managed locally in the store page component, not in CedricContext (to avoid unnecessary re-renders).
6. If the item's asset file doesn't exist, the layer falls back gracefully (onError hides the img).
7. A brief Framer Motion crossfade (150ms) animates the equipment layer swap.
8. Tests verify: hover triggers layer swap, correct slot affected, revert on mouse leave, crossfade animation, missing asset fallback.

**Dev Notes**:
- File: `frontend/src/pages/StorePage.tsx` (modify -- add `onMouseEnter`/`onMouseLeave` handlers to catalog items)
- File: `frontend/src/components/avatar/AvatarSprite.tsx` (modify -- accept optional `previewOverrides` prop that temporarily overrides specific equipment slots)
- The `previewOverrides` prop is a `Partial<Record<string, CosmeticBrief | null>>` that merges with `equippedItems`.
- Use `getEquipmentAssetPath()` from Story 1.2 to construct the preview asset path.

**Dependencies**: Story 7.1 (preview mode)

---

## Story 7.3: Implement CharacterSheet Popup

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
- Equipment data from `progression.equipped_items` (Record<string, CosmeticBrief | null>).
- The 8 slots are: banner, boots, armor, cape, hairstyle, jewelry, emblem, color_palette.

**Dependencies**: Epic 1 (AvatarSprite, CedricContext)

---

## Story 7.4: Implement Cursor Tracking on Hover

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
- Calculate offset: `const dx = mouseX - avatarCenterX; const shift = Math.max(-2, Math.min(2, dx / 100));`
- Use `useRef` for the avatar container to get bounding rect.
- This is a polish feature -- keep the implementation simple.

**Dependencies**: Epic 1 Story 1.4 (AvatarCompanion)

---

## Story Dependency Graph (Epic 7)

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
