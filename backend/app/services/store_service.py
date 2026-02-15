"""Store Service -- Cosmetic store: browse, purchase, inventory, equip/unequip.

FINDING-SEC-003 fix: Acquires SELECT FOR UPDATE on user_progression at the
START of the purchase flow (before any validation checks). Entire purchase
wrapped in a single transaction with rollback on failure.

References: FR-016, ADR-MM-004, FINDING-SEC-003
Architecture Section 4.5
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.cosmetic import CosmeticCatalog, UserEquippedItem, UserInventory
from app.models.progression import UserProgression
from app.services.progression_service import (
    ProgressionService,
    progression_service as _default_progression_service,
)

logger = logging.getLogger(__name__)


@dataclass
class PurchaseResult:
    success: bool = False
    error: str | None = None
    item_id: UUID | None = None
    item_name: str = ""
    item_category: str = ""
    item_rarity: str = ""
    new_coin_balance: int = 0
    # Extra context for error responses
    required: int | None = None
    current_balance: int | None = None
    required_level: int | None = None
    current_level: int | None = None


@dataclass
class InventoryItem:
    id: str
    name: str
    category: str
    rarity: str
    source: str
    acquired_at: str
    is_equipped: bool


@dataclass
class EquipResult:
    slot: str
    cosmetic_id: str | None = None
    cosmetic_name: str | None = None
    cosmetic_category: str | None = None
    cosmetic_rarity: str | None = None


class StoreService:
    """Cosmetic store: browse, purchase, inventory, equip/unequip."""

    def __init__(self, progression_service: ProgressionService | None = None):
        self.progression = progression_service or _default_progression_service

    def get_catalog(
        self,
        db: Session,
        user_id: UUID,
        category: str | None = None,
        rarity: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[dict], int]:
        """Returns catalog items with per-user computed flags.

        Returns (items, total_count).
        """
        query = db.query(CosmeticCatalog).filter(
            CosmeticCatalog.is_active.is_(True)
        )
        count_query = db.query(func.count(CosmeticCatalog.id)).filter(
            CosmeticCatalog.is_active.is_(True)
        )

        if category:
            query = query.filter(CosmeticCatalog.category == category)
            count_query = count_query.filter(CosmeticCatalog.category == category)
        if rarity:
            query = query.filter(CosmeticCatalog.rarity == rarity)
            count_query = count_query.filter(CosmeticCatalog.rarity == rarity)

        total = count_query.scalar() or 0

        items = (
            query.order_by(CosmeticCatalog.sort_order)
            .offset(offset)
            .limit(limit)
            .all()
        )

        # Get user's progression and inventory
        prog = (
            db.query(UserProgression)
            .filter(UserProgression.user_id == user_id)
            .first()
        )
        user_level = prog.level if prog else 1
        coin_balance = prog.coin_balance if prog else 0

        owned_ids = set(
            row[0]
            for row in db.query(UserInventory.cosmetic_id)
            .filter(UserInventory.user_id == user_id)
            .all()
        )

        result = []
        for item in items:
            result.append({
                "id": str(item.id),
                "name": item.name,
                "description": item.description,
                "category": item.category,
                "rarity": item.rarity,
                "coin_price": item.coin_price,
                "level_required": item.level_required,
                "image_url": item.image_url,
                "is_quest_exclusive": item.is_quest_exclusive,
                "is_affordable": coin_balance >= item.coin_price,
                "is_owned": item.id in owned_ids,
                "is_level_locked": user_level < item.level_required,
            })

        return result, total

    def purchase(
        self,
        db: Session,
        user_id: UUID,
        cosmetic_id: UUID,
    ) -> PurchaseResult:
        """Atomic purchase flow.

        FINDING-SEC-003 fix: Acquires SELECT FOR UPDATE on user_progression
        at the BEGINNING of the flow, before any validation checks.
        """
        # 1. FINDING-SEC-003: Acquire row lock FIRST
        prog = (
            db.query(UserProgression)
            .filter(UserProgression.user_id == user_id)
            .with_for_update()
            .first()
        )
        if prog is None:
            return PurchaseResult(error="progression_not_found")

        # 2. Load cosmetic item
        item = (
            db.query(CosmeticCatalog)
            .filter(CosmeticCatalog.id == cosmetic_id)
            .first()
        )
        if item is None or not item.is_active:
            return PurchaseResult(error="item_unavailable")

        # 3. Validate not quest exclusive
        if item.is_quest_exclusive:
            return PurchaseResult(error="quest_exclusive")

        # 4. Check already owned
        existing = (
            db.query(UserInventory)
            .filter(
                UserInventory.user_id == user_id,
                UserInventory.cosmetic_id == cosmetic_id,
            )
            .first()
        )
        if existing is not None:
            return PurchaseResult(error="already_owned")

        # 5. Check level requirement
        if prog.level < item.level_required:
            return PurchaseResult(
                error="level_too_low",
                required_level=item.level_required,
                current_level=prog.level,
            )

        # 6. Check and spend coins
        if prog.coin_balance < item.coin_price:
            return PurchaseResult(
                error="insufficient_coins",
                required=item.coin_price,
                current_balance=prog.coin_balance,
            )

        spend_result = self.progression.spend_coins(
            db, user_id, item.coin_price, "store_purchase", reference_id=item.id
        )
        if not spend_result.success:
            return PurchaseResult(
                error=spend_result.reason,
                required=item.coin_price,
                current_balance=prog.coin_balance,
            )

        # 7. Insert inventory row
        inventory_item = UserInventory(
            user_id=user_id,
            cosmetic_id=cosmetic_id,
            source="store_purchase",
        )
        try:
            savepoint = db.begin_nested()
            db.add(inventory_item)
            savepoint.commit()
        except IntegrityError:
            # FINDING-SEC-003: Race condition -- another request already bought it
            # Savepoint is automatically rolled back; coin deduction preserved
            return PurchaseResult(error="already_owned")

        return PurchaseResult(
            success=True,
            item_id=item.id,
            item_name=item.name,
            item_category=item.category,
            item_rarity=item.rarity,
            new_coin_balance=spend_result.new_balance,
        )

    def get_inventory(
        self, db: Session, user_id: UUID
    ) -> list[InventoryItem]:
        """Return all cosmetics owned by user with equipped status."""
        inventory_rows = (
            db.query(UserInventory)
            .filter(UserInventory.user_id == user_id)
            .order_by(UserInventory.acquired_at.desc())
            .all()
        )

        equipped_cosmetic_ids = set(
            row[0]
            for row in db.query(UserEquippedItem.cosmetic_id)
            .filter(UserEquippedItem.user_id == user_id)
            .all()
        )

        result = []
        for inv in inventory_rows:
            cosmetic = inv.cosmetic
            result.append(
                InventoryItem(
                    id=str(cosmetic.id),
                    name=cosmetic.name,
                    category=cosmetic.category,
                    rarity=cosmetic.rarity,
                    source=inv.source,
                    acquired_at=inv.acquired_at.isoformat(),
                    is_equipped=cosmetic.id in equipped_cosmetic_ids,
                )
            )

        return result

    def equip(
        self,
        db: Session,
        user_id: UUID,
        cosmetic_id: UUID,
        slot: str,
    ) -> EquipResult | str:
        """Equip a cosmetic into a slot.

        Returns EquipResult on success or an error string.
        """
        # Validate user owns item
        inv = (
            db.query(UserInventory)
            .filter(
                UserInventory.user_id == user_id,
                UserInventory.cosmetic_id == cosmetic_id,
            )
            .first()
        )
        if inv is None:
            return "item_not_owned"

        # Validate item category matches slot
        cosmetic = inv.cosmetic
        if cosmetic.category != slot:
            return "category_slot_mismatch"

        # Upsert equipped item (replace existing item in slot)
        existing = (
            db.query(UserEquippedItem)
            .filter(
                UserEquippedItem.user_id == user_id,
                UserEquippedItem.slot == slot,
            )
            .first()
        )
        if existing:
            existing.cosmetic_id = cosmetic_id
        else:
            equipped = UserEquippedItem(
                user_id=user_id,
                slot=slot,
                cosmetic_id=cosmetic_id,
            )
            db.add(equipped)

        db.flush()

        return EquipResult(
            slot=slot,
            cosmetic_id=str(cosmetic.id),
            cosmetic_name=cosmetic.name,
            cosmetic_category=cosmetic.category,
            cosmetic_rarity=cosmetic.rarity,
        )

    def award_quest_cosmetic(
        self,
        db: Session,
        user_id: UUID,
        cosmetic_name: str,
    ) -> bool:
        """Awards a quest-exclusive cosmetic to user's inventory.

        Returns True if awarded, False if cosmetic not found or already owned.
        """
        cosmetic = (
            db.query(CosmeticCatalog)
            .filter(CosmeticCatalog.name == cosmetic_name)
            .first()
        )
        if cosmetic is None:
            return False

        # Check if already owned
        existing = (
            db.query(UserInventory)
            .filter(
                UserInventory.user_id == user_id,
                UserInventory.cosmetic_id == cosmetic.id,
            )
            .first()
        )
        if existing is not None:
            return False

        inventory_item = UserInventory(
            user_id=user_id,
            cosmetic_id=cosmetic.id,
            source="quest_reward",
        )
        db.add(inventory_item)
        db.flush()
        return True

    def unequip(
        self, db: Session, user_id: UUID, slot: str
    ) -> None:
        """Remove equipped item from slot."""
        existing = (
            db.query(UserEquippedItem)
            .filter(
                UserEquippedItem.user_id == user_id,
                UserEquippedItem.slot == slot,
            )
            .first()
        )
        if existing:
            db.delete(existing)
            db.flush()


# Module-level singleton
store_service = StoreService()
