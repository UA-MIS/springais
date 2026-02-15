# Epic 6: Cosmetic Store

> **Phase**: 3
> **Estimated Stories**: 6
> **Dependencies**: Epic 1 (Server Foundation), Epic 2 (XP/Leveling for level gates)
> **PRD References**: FR-014, FR-015, FR-016, FR-017
> **Architecture References**: Sections 2.7-2.9, 3.3, 4.5
> **Security Review Fixes**: FINDING-SEC-003

---

## Story 6.1: Cosmetic Catalog Table, Model, and Seed Data

**Size**: M

**Description**: Create the `cosmetic_catalog` table with at least 30 cosmetic items spanning all 8 categories and 5 rarity tiers. This is the store inventory that users browse and purchase from.

**Acceptance Criteria**:
1. A SQLAlchemy model `CosmeticCatalog` exists in `backend/app/models/cosmetic.py` with columns: `id` (UUID PK), `name`, `description`, `category` (enum: armor/cape/jewelry/boots/hairstyle/color_palette/banner/emblem), `rarity` (enum: common/uncommon/rare/epic/legendary), `coin_price`, `level_required` (default 1), `image_url` (nullable), `is_quest_exclusive` (default false), `is_active` (default true), `sort_order`, `created_at`.
2. CHECK constraints validate `category`, `rarity`, and `coin_price >= 0`.
3. Indexes on `category`, `rarity`, `is_active`.
4. The Alembic migration seeds at least 30 items with pricing per FR-014.2:
   - Common: 100-200 Coins
   - Uncommon: 200-400 Coins
   - Rare: 400-700 Coins
   - Epic: 700-1200 Coins
   - Legendary: 1200-2000 Coins
5. At least 5 items are marked `is_quest_exclusive = true` (one per side quest reward).
6. Tests verify: all 30+ items seeded, categories and rarities distributed, quest-exclusive items flagged correctly.

**Dev Notes**:
- File: `backend/app/models/cosmetic.py` (new)
- File: `backend/app/data/gamification_seed.py` (extend -- cosmetic seed data)
- File: Alembic migration (extend)
- Architecture Section 2.7 has the exact model code.
- Seed items should be themed (medieval): Bronze Armor, Leather Boots, Silver Cloak, Guild Ring, Golden Armor, Dragon Emblem, Phoenix Cloak, Legendary Crown, etc.

**D-ID References**: D-MM-7, FR-014

**Dependencies**: Epic 1 Story 1.1 (Alembic)

---

## Story 6.2: User Inventory and Equipped Items Models

**Size**: S

**Description**: Create the `user_inventory` and `user_equipped_items` tables for tracking owned and equipped cosmetics.

**Acceptance Criteria**:
1. `UserInventory` model in `backend/app/models/cosmetic.py` with columns: `id` (UUID PK), `user_id` (UUID FK -> `user_profiles.id`), `cosmetic_id` (UUID FK -> `cosmetic_catalog.id`), `source` (enum: store_purchase/quest_reward/achievement_reward), `acquired_at`.
2. UNIQUE constraint on `(user_id, cosmetic_id)` prevents duplicates.
3. `UserEquippedItem` model with columns: `id` (UUID PK), `user_id` (UUID FK), `slot` (enum matching cosmetic categories), `cosmetic_id` (UUID FK -> `cosmetic_catalog.id`).
4. UNIQUE constraint on `(user_id, slot)` ensures one item per slot.
5. CHECK constraint validates `slot` values match category enum.
6. Alembic migration creates both tables.
7. Tests verify: inventory insertion, duplicate prevention, equip slot uniqueness, cascade deletes.

**Dev Notes**:
- File: `backend/app/models/cosmetic.py` (extend)
- File: Alembic migration (extend)
- Architecture Sections 2.8-2.9 have the exact model code.

**D-ID References**: FR-015

**Dependencies**: Story 6.1

---

## Story 6.3: Store Service -- Purchase, Inventory, Equip/Unequip

**Size**: L

**Description**: Implement `store_service.py` with the full purchase flow (atomic with FINDING-SEC-003 fix), inventory management, and equip/unequip operations.

**Acceptance Criteria**:
1. `purchase(db, user_id, cosmetic_id)`:
   - FINDING-SEC-003 fix: Acquires SELECT FOR UPDATE on `user_progression` at the BEGINNING of the flow (before any validation checks).
   - Validates: item exists and is_active, not quest_exclusive, user does not own it, user level >= level_required, user coin_balance >= coin_price.
   - Calls `progression_service.spend_coins()`.
   - Inserts `user_inventory` row with source="store_purchase".
   - If any step after coin deduction fails, the entire transaction rolls back (coins restored).
   - Returns `PurchaseResult` with item data and new balance.
   - Handles `IntegrityError` from duplicate inventory insert as "already_owned" (FINDING-SEC-003).
2. `get_catalog(db, user_id, category, rarity, limit, offset)` returns paginated items with computed `is_affordable`, `is_owned`, `is_level_locked` flags.
3. `get_inventory(db, user_id)` returns all owned items with equipped status.
4. `equip(db, user_id, cosmetic_id, slot)`:
   - Validates user owns item.
   - Validates item category matches slot.
   - Upserts `user_equipped_items` (replaces existing item in slot).
5. `unequip(db, user_id, slot)` removes equipped item from slot.
6. Tests cover:
   - Successful purchase deducts coins and adds to inventory.
   - Purchase fails with descriptive errors: insufficient_coins, already_owned, level_too_low, quest_exclusive, item_unavailable.
   - Concurrent purchases of same item: only one succeeds, other gets already_owned (race condition test).
   - Concurrent purchases that would overdraw: only one succeeds.
   - Equip/unequip flow.
   - Category-slot mismatch rejected.

**Dev Notes**:
- File: `backend/app/services/store_service.py` (new)
- CRITICAL: FINDING-SEC-003 fix: The SELECT FOR UPDATE on `user_progression` must happen FIRST, before any read validations. This serializes concurrent purchase requests for the same user.
- CRITICAL: Wrap the entire purchase in a single DB transaction. If `user_inventory` insert raises IntegrityError (duplicate), catch it and rollback, returning "already_owned".
- Architecture Section 4.5 has the service interface.
- Service singleton: `store_service = StoreService()`.

**D-ID References**: FR-016, ADR-MM-004, FINDING-SEC-003

**Dependencies**: Stories 6.1, 6.2, Epic 1 Story 1.5 (spend_coins)

---

## Story 6.4: Store API Router and Pydantic Schemas

**Size**: M

**Description**: Create the store API router with endpoints for catalog, purchase, inventory, equip, and unequip.

**Acceptance Criteria**:
1. `GET /api/store/catalog?category=&rarity=&limit=50&offset=0` returns paginated catalog with per-user flags.
2. `POST /api/store/purchase` accepts `{ cosmetic_id }` and returns purchase result.
3. `GET /api/store/inventory` returns user's owned items with equipped status.
4. `POST /api/store/equip` accepts `{ cosmetic_id, slot }` and equips item.
5. `POST /api/store/unequip` accepts `{ slot }` and unequips item.
6. All endpoints require JWT authentication.
7. Error responses follow the convention: `{ "detail": "error_code", ...context }`.
8. Pydantic schemas in `backend/app/schemas/cosmetic.py`.
9. Router registered in routes init and main.py.
10. Tests cover: all CRUD operations, error responses, pagination, filtering.

**Dev Notes**:
- File: `backend/app/routes/store.py` (new)
- File: `backend/app/schemas/cosmetic.py` (new)
- File: `backend/app/routes/__init__.py` (modify)
- File: `backend/app/main.py` (modify)
- Architecture Section 3.3 has all endpoint schemas and responses.
- Appendix A has the Pydantic models.

**D-ID References**: FR-014.4, FR-015.3-5, FR-016

**Dependencies**: Story 6.3

---

## Story 6.5: Frontend Store Page

**Size**: L

**Description**: Create the StorePage component with catalog browsing, filtering, purchase dialog, and inventory management with equip/unequip controls.

**Acceptance Criteria**:
1. A new `/store` route renders `StorePage.tsx` inside the protected layout.
2. Store displays items in a grid, filterable by category and rarity.
3. Each item card shows: name, description snippet, rarity indicator (color-coded), Coin price, level requirement, owned/equipped status.
4. Items that are unaffordable, already owned, or level-locked are visually distinct with tooltip explanations.
5. Clicking an item shows a detail view with a "Purchase" button.
6. Purchase triggers a confirmation dialog showing cost and projected new balance.
7. After purchase, the item appears in inventory immediately.
8. An "Inventory" tab shows all owned items with equip/unequip controls.
9. The Sidebar navigation includes a "Merchant's Armory" link (adventure mode) / "Store" link (normal mode).
10. Medieval theme styling applied when adventure mode is active.
11. Tests cover: catalog renders, filtering works, purchase flow, inventory display, equip/unequip.

**Dev Notes**:
- File: `frontend/src/pages/StorePage.tsx` (new)
- File: `frontend/src/components/store/StoreItemCard.tsx` (new)
- File: `frontend/src/components/store/InventoryPanel.tsx` (new)
- File: `frontend/src/components/store/PurchaseDialog.tsx` (new)
- File: `frontend/src/services/storeService.ts` (new)
- File: `frontend/src/components/layout/Sidebar.tsx` (modify -- add Store link)
- File: `frontend/src/App.tsx` (modify -- add /store route)
- Use React Query for data fetching (keys: `['store', 'catalog', filters]`, `['store', 'inventory']`).
- Architecture Sections 7.4-7.6 describe new components and routing.
- Use `getFantasyText('Store')` -> "Merchant's Armory" for adventure mode text.

**D-ID References**: FR-023, FR-026

**Dependencies**: Story 6.4 (API endpoints)

---

## Story 6.6: Equipped Items in Progression Response

**Size**: S

**Description**: Ensure the `GET /api/progression` response includes the user's equipped items so the HUD and profile can display them.

**Acceptance Criteria**:
1. The `ProgressionResponse` schema includes `equipped_items` as a dict of `{ slot: CosmeticBrief | null }` for all 8 slots.
2. The progression service queries `user_equipped_items` joined with `cosmetic_catalog` to populate this field.
3. Empty slots return `null`.
4. Tests cover: no equipped items returns all nulls, equipped items return cosmetic data, equipping/unequipping updates the progression response.

**Dev Notes**:
- File: `backend/app/services/progression_service.py` (extend `get_progression`)
- File: `backend/app/routes/progression.py` (ensure response includes equipped_items)
- This was stubbed as an empty dict in Epic 1 Story 1.7. Now it returns real data.

**D-ID References**: FR-015.6

**Dependencies**: Stories 6.2, 6.4

---

## Story Dependency Graph (Epic 6)

```
Epic 1 + Epic 2
 |
 v
6.1 Cosmetic Catalog + Seed
 |
 v
6.2 Inventory + Equipped Models
 |
 v
6.3 Store Service (FINDING-SEC-003)
 |
 v
6.4 Store API Router ---------> 6.6 Equipped Items in Progression
 |
 v
6.5 Frontend Store Page
```
