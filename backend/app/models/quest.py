"""Side quest models.

Tables:
- side_quest_catalog: Quest definitions with level requirements and rewards
- user_quest_progress: Tracks user progress toward side quest requirements

References: FR-018, FR-019, D-MM-9
Architecture Sections: 2.10, 2.11
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


class SideQuestCatalog(Base):
    """Quest definitions with level requirements and rewards.

    References: FR-018, D-MM-9
    Architecture Section 2.10
    """

    __tablename__ = "side_quest_catalog"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(1000), nullable=False)
    level_required: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    xp_reward: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    coin_reward: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    cosmetic_reward_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("cosmetic_catalog.id"),
        nullable=True,
    )
    requirements: Mapped[list] = mapped_column(JSONB, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        Index("idx_side_quest_catalog_level", "level_required"),
        Index("idx_side_quest_catalog_active", "is_active"),
    )


class UserQuestProgress(Base):
    """Tracks user progress toward side quest requirements.

    References: FR-019
    Architecture Section 2.11
    """

    __tablename__ = "user_quest_progress"

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
    quest_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("side_quest_catalog.id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(20), default="available", nullable=False
    )
    progress: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    quest: Mapped["SideQuestCatalog"] = relationship("SideQuestCatalog")

    __table_args__ = (
        Index("uq_user_quest", "user_id", "quest_id", unique=True),
        Index("idx_user_quest_user_id", "user_id"),
        Index("idx_user_quest_status", "status"),
        CheckConstraint(
            "status IN ('available', 'in_progress', 'completed')",
            name="ck_quest_status_valid",
        ),
    )
