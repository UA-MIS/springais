"""Achievement system models.

Tables:
- achievement_catalog: Server-side achievement definitions (seeded)
- user_achievements: Tracks which achievements each user has unlocked

References: FR-011, FR-012, FR-013, D-MM-6
Architecture Sections: 2.5, 2.6
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
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
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from .base import Base

if TYPE_CHECKING:
    pass


class AchievementCatalog(Base):
    """Server-side achievement definitions. Seeded with data.

    References: FR-011, D-MM-6
    Architecture Section 2.5
    """

    __tablename__ = "achievement_catalog"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    icon: Mapped[str] = mapped_column(String(100), default="trophy", nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    xp_reward: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    coin_reward: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    trigger_type: Mapped[str] = mapped_column(String(50), nullable=False)
    trigger_config: Mapped[dict] = mapped_column(JSONB, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    __table_args__ = (
        Index("idx_achievement_catalog_category", "category"),
        Index("idx_achievement_catalog_active", "is_active"),
        CheckConstraint(
            "category IN ('onboarding', 'learning', 'engagement', 'exploration', 'mastery')",
            name="ck_achievement_category_valid",
        ),
        CheckConstraint(
            "trigger_type IN ('event_based', 'threshold_based', 'manual')",
            name="ck_trigger_type_valid",
        ),
    )


class UserAchievement(Base):
    """Tracks which achievements each user has unlocked.

    References: FR-013
    Architecture Section 2.6
    """

    __tablename__ = "user_achievements"

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
    achievement_id: Mapped[str] = mapped_column(
        String(100),
        ForeignKey("achievement_catalog.id", ondelete="CASCADE"),
        nullable=False,
    )
    unlocked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    achievement: Mapped["AchievementCatalog"] = relationship("AchievementCatalog")

    __table_args__ = (
        Index("uq_user_achievement", "user_id", "achievement_id", unique=True),
        Index("idx_user_achievements_user_id", "user_id"),
    )
