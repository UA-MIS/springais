"""Cosmetic store models.

Tables:
- cosmetic_catalog: Store item definitions (seeded)
- user_inventory: Per-user owned cosmetics
- user_equipped_items: One item per slot per user

References: FR-014, FR-015, D-MM-7
Architecture Sections: 2.7, 2.8, 2.9
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    text,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from .base import Base


class CosmeticCatalog(Base):
    """Store item definitions. Seeded with data.

    References: FR-014, D-MM-7
    Architecture Section 2.7
    """

    __tablename__ = "cosmetic_catalog"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    rarity: Mapped[str] = mapped_column(String(20), nullable=False)
    coin_price: Mapped[int] = mapped_column(Integer, nullable=False)
    level_required: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_quest_exclusive: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        Index("idx_cosmetic_catalog_category", "category"),
        Index("idx_cosmetic_catalog_rarity", "rarity"),
        Index("idx_cosmetic_catalog_active", "is_active"),
        CheckConstraint(
            "category IN ('armor', 'cape', 'jewelry', 'boots', 'hairstyle', "
            "'color_palette', 'banner', 'emblem')",
            name="ck_cosmetic_category_valid",
        ),
        CheckConstraint(
            "rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')",
            name="ck_cosmetic_rarity_valid",
        ),
        CheckConstraint("coin_price >= 0", name="ck_cosmetic_price_non_negative"),
    )


class UserInventory(Base):
    """Per-user owned cosmetics.

    References: FR-015
    Architecture Section 2.8
    """

    __tablename__ = "user_inventory"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    cosmetic_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("cosmetic_catalog.id", ondelete="CASCADE"),
        nullable=False,
    )
    source: Mapped[str] = mapped_column(String(50), nullable=False)
    acquired_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    cosmetic: Mapped["CosmeticCatalog"] = relationship("CosmeticCatalog")

    __table_args__ = (
        Index("uq_user_inventory", "user_id", "cosmetic_id", unique=True),
        Index("idx_user_inventory_user_id", "user_id"),
        CheckConstraint(
            "source IN ('store_purchase', 'quest_reward', 'achievement_reward')",
            name="ck_inventory_source_valid",
        ),
    )


class UserEquippedItem(Base):
    """Tracks which cosmetic is equipped in each slot.

    One item per slot per user.
    References: FR-015
    Architecture Section 2.9
    """

    __tablename__ = "user_equipped_items"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    slot: Mapped[str] = mapped_column(String(50), nullable=False)
    cosmetic_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("cosmetic_catalog.id", ondelete="CASCADE"),
        nullable=False,
    )

    cosmetic: Mapped["CosmeticCatalog"] = relationship("CosmeticCatalog")

    __table_args__ = (
        Index("uq_user_equipped_slot", "user_id", "slot", unique=True),
        Index("idx_user_equipped_user_id", "user_id"),
        CheckConstraint(
            "slot IN ('armor', 'cape', 'jewelry', 'boots', 'hairstyle', "
            "'color_palette', 'banner', 'emblem')",
            name="ck_equipped_slot_valid",
        ),
    )
