"""Pydantic schemas for the cosmetic store API.

References: FR-014, FR-015, FR-016
Architecture Section 3.3, Appendix A
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class CatalogItemResponse(BaseModel):
    id: str
    name: str
    description: str
    category: str
    rarity: str
    coin_price: int
    level_required: int
    image_url: str | None
    is_quest_exclusive: bool
    is_affordable: bool
    is_owned: bool
    is_level_locked: bool


class CatalogResponse(BaseModel):
    items: list[CatalogItemResponse]
    total: int
    limit: int
    offset: int


class PurchaseRequest(BaseModel):
    cosmetic_id: str = Field(..., min_length=1)


class PurchaseResponse(BaseModel):
    success: bool
    error: str | None = None
    item_id: str | None = None
    item_name: str | None = None
    item_category: str | None = None
    item_rarity: str | None = None
    new_coin_balance: int = 0


class InventoryItemResponse(BaseModel):
    id: str
    name: str
    category: str
    rarity: str
    source: str
    acquired_at: str
    is_equipped: bool


class InventoryResponse(BaseModel):
    items: list[InventoryItemResponse]


class EquipRequest(BaseModel):
    cosmetic_id: str = Field(..., min_length=1)
    slot: str = Field(..., min_length=1)


class EquipResponse(BaseModel):
    slot: str
    cosmetic_id: str | None = None
    cosmetic_name: str | None = None
    cosmetic_category: str | None = None
    cosmetic_rarity: str | None = None


class UnequipRequest(BaseModel):
    slot: str = Field(..., min_length=1)
