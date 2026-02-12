"""
Badge Catalog and Discovery Models.

Defines the badge catalog, skill mappings, interaction tracking,
and user badge earning tables per architecture Section 2.2.
"""

import enum
from datetime import datetime
from typing import Optional, List
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean, DateTime, Float, ForeignKey, Index, Integer, String,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func, text

from .base import Base, TimestampMixin


# ============================================
# Enums
# ============================================

class BadgePlatform(str, enum.Enum):
    CREDLY = "credly"
    MICROSOFT = "microsoft"
    AWS = "aws"
    GOOGLE = "google"
    COMPTIA = "comptia"
    PMI = "pmi"
    OTHER = "other"


class DifficultyLevel(str, enum.Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class MappingSource(str, enum.Enum):
    CURATED = "curated"
    API = "api"
    AI = "ai"


class InteractionType(str, enum.Enum):
    CLICK = "click"
    EARNED = "earned"
    THUMBS_UP = "thumbs_up"
    THUMBS_DOWN = "thumbs_down"


class InteractionSource(str, enum.Enum):
    SKILL_MODULE = "skill_module"
    ROADMAP = "roadmap"
    SEARCH = "search"


# ============================================
# Models
# ============================================

class BadgeCatalog(Base, TimestampMixin):
    """Central catalog of known badges and certifications (FR-6.1)."""
    __tablename__ = "badge_catalog"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True,
        default=uuid4, server_default=text("gen_random_uuid()")
    )
    external_id: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    issuer: Mapped[str] = mapped_column(String(255), nullable=False)
    platform: Mapped[str] = mapped_column(String(50), nullable=False)
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    image_url: Mapped[Optional[str]] = mapped_column(String(1000))
    skills: Mapped[list] = mapped_column(JSONB, default=list)
    difficulty_level: Mapped[Optional[str]] = mapped_column(String(20))
    estimated_cost_usd: Mapped[Optional[float]] = mapped_column(Float)
    estimated_hours: Mapped[Optional[int]] = mapped_column(Integer)
    renewal_months: Mapped[Optional[int]] = mapped_column(Integer)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_refreshed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Relationships
    skill_mappings: Mapped[List["BadgeSkillMapping"]] = relationship(
        back_populates="badge", cascade="all, delete-orphan"
    )
    interactions: Mapped[List["BadgeInteraction"]] = relationship(
        back_populates="badge"
    )

    __table_args__ = (
        Index("idx_badge_catalog_platform_ext", "platform", "external_id", unique=True),
        Index("idx_badge_catalog_active", "is_active"),
        Index("idx_badge_catalog_issuer", "issuer"),
    )


class BadgeSkillMapping(Base, TimestampMixin):
    """Explicit skill-to-badge mapping with confidence scores (FR-6.3)."""
    __tablename__ = "badge_skill_mapping"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True,
        default=uuid4, server_default=text("gen_random_uuid()")
    )
    badge_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("badge_catalog.id", ondelete="CASCADE"),
        nullable=False,
    )
    skill_name: Mapped[str] = mapped_column(String(255), nullable=False)
    mapping_confidence: Mapped[float] = mapped_column(Float, default=0.5)
    source: Mapped[str] = mapped_column(String(20), default="curated")

    badge: Mapped["BadgeCatalog"] = relationship(back_populates="skill_mappings")

    __table_args__ = (
        Index("idx_badge_skill_mapping_skill", "skill_name"),
        Index("idx_badge_skill_mapping_badge", "badge_id"),
        Index("idx_badge_skill_mapping_unique", "badge_id", "skill_name", unique=True),
    )


class BadgeInteraction(Base):
    """Tracks user interactions with badge suggestions (FR-5.1, FR-5.3)."""
    __tablename__ = "badge_interactions"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True,
        default=uuid4, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    badge_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("badge_catalog.id", ondelete="CASCADE"),
        nullable=False,
    )
    interaction_type: Mapped[str] = mapped_column(String(20), nullable=False)
    source: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    badge: Mapped["BadgeCatalog"] = relationship(back_populates="interactions")

    __table_args__ = (
        Index("idx_badge_interaction_user", "user_id"),
        Index("idx_badge_interaction_badge", "badge_id"),
        Index("idx_badge_interaction_type", "interaction_type"),
    )


class UserBadge(Base, TimestampMixin):
    """Tracks badges a user has earned (FR-5.2)."""
    __tablename__ = "user_badges"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True,
        default=uuid4, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    badge_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("badge_catalog.id", ondelete="CASCADE"),
        nullable=False,
    )
    earned_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    self_reported: Mapped[bool] = mapped_column(Boolean, default=True)

    __table_args__ = (
        Index("idx_user_badge_user", "user_id"),
        Index("idx_user_badge_unique", "user_id", "badge_id", unique=True),
    )
