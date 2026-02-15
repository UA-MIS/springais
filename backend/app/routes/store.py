"""Store API routes.

Endpoints:
- GET /api/store/catalog -- Browse cosmetic catalog with filtering
- POST /api/store/purchase -- Purchase a cosmetic item
- GET /api/store/inventory -- View owned cosmetics
- POST /api/store/equip -- Equip a cosmetic into a slot
- POST /api/store/unequip -- Remove a cosmetic from a slot

All endpoints require JWT authentication.
References: FR-014, FR-015, FR-016
"""

from __future__ import annotations

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user_profile import UserProfile
from app.schemas.cosmetic import (
    CatalogResponse,
    CatalogItemResponse,
    EquipRequest,
    EquipResponse,
    InventoryItemResponse,
    InventoryResponse,
    PurchaseRequest,
    PurchaseResponse,
    UnequipRequest,
)
from app.services.store_service import EquipResult, store_service
from app.utils.security import get_current_user_from_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/store", tags=["store"])


@router.get("/catalog", response_model=CatalogResponse)
def get_catalog(
    category: str | None = Query(None),
    rarity: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
) -> CatalogResponse:
    """Browse the cosmetic catalog with optional filtering."""
    items, total = store_service.get_catalog(
        db, current_user.id, category=category, rarity=rarity,
        limit=limit, offset=offset,
    )
    return CatalogResponse(
        items=[CatalogItemResponse(**item) for item in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("/purchase", response_model=PurchaseResponse)
def purchase_item(
    body: PurchaseRequest,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
) -> PurchaseResponse:
    """Purchase a cosmetic item from the store."""
    try:
        cosmetic_id = UUID(body.cosmetic_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="invalid_cosmetic_id",
        )

    result = store_service.purchase(db, current_user.id, cosmetic_id)

    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.error,
        )

    db.commit()

    return PurchaseResponse(
        success=True,
        item_id=str(result.item_id) if result.item_id else None,
        item_name=result.item_name,
        item_category=result.item_category,
        item_rarity=result.item_rarity,
        new_coin_balance=result.new_coin_balance,
    )


@router.get("/inventory", response_model=InventoryResponse)
def get_inventory(
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
) -> InventoryResponse:
    """Get the authenticated user's owned cosmetics."""
    items = store_service.get_inventory(db, current_user.id)
    return InventoryResponse(
        items=[
            InventoryItemResponse(
                id=item.id,
                name=item.name,
                category=item.category,
                rarity=item.rarity,
                source=item.source,
                acquired_at=item.acquired_at,
                is_equipped=item.is_equipped,
            )
            for item in items
        ]
    )


@router.post("/equip", response_model=EquipResponse)
def equip_item(
    body: EquipRequest,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
) -> EquipResponse:
    """Equip a cosmetic item into a slot."""
    try:
        cosmetic_id = UUID(body.cosmetic_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="invalid_cosmetic_id",
        )

    result = store_service.equip(db, current_user.id, cosmetic_id, body.slot)

    if isinstance(result, str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result,
        )

    db.commit()

    return EquipResponse(
        slot=result.slot,
        cosmetic_id=result.cosmetic_id,
        cosmetic_name=result.cosmetic_name,
        cosmetic_category=result.cosmetic_category,
        cosmetic_rarity=result.cosmetic_rarity,
    )


@router.post("/unequip")
def unequip_item(
    body: UnequipRequest,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
) -> dict:
    """Remove a cosmetic from a slot."""
    store_service.unequip(db, current_user.id, body.slot)
    db.commit()
    return {"slot": body.slot, "unequipped": True}
