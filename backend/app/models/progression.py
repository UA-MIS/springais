"""Gamification progression models.

Tables:
- user_progression: Per-user gamification state (XP, coins, level, streak)
- gamification_events: Append-only event log for reward tracking
- coin_transactions: Ledger for all coin movements
"""

from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
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

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .user_profile import UserProfile


class UserProgression(Base, TimestampMixin):
    """Per-user gamification state. One row per user.

    Replaces all localStorage gamification data with server-side persistence.
    References: FR-001, D-MM-1
    """

    __tablename__ = "user_progression"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    xp_total: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    level: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    coin_balance: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    login_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_login_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    adventure_mode_enabled: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    walkthrough_step: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    walkthrough_completed: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    # Relationships
    user: Mapped["UserProfile"] = relationship("UserProfile", backref="progression")
    events: Mapped[list["GamificationEvent"]] = relationship(
        back_populates="progression", cascade="all, delete-orphan"
    )
    coin_txns: Mapped[list["CoinTransaction"]] = relationship(
        back_populates="progression", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_user_progression_user_id", "user_id", unique=True),
        CheckConstraint("coin_balance >= 0", name="ck_coin_balance_non_negative"),
        CheckConstraint("xp_total >= 0", name="ck_xp_total_non_negative"),
        CheckConstraint("level >= 1", name="ck_level_positive"),
    )


class GamificationEvent(Base):
    """Append-only event log. Records every action that triggers a reward.

    Supports idempotency via event_key with a partial unique index.
    References: FR-002, D-MM-2
    """

    __tablename__ = "gamification_events"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user_progression.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    event_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    xp_awarded: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    coins_awarded: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    metadata_: Mapped[dict | None] = mapped_column(
        "metadata", JSONB, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    progression: Mapped["UserProgression"] = relationship(
        back_populates="events", foreign_keys=[user_id]
    )

    __table_args__ = (
        Index("idx_gamification_events_user_id", "user_id"),
        Index("idx_gamification_events_type", "event_type"),
        Index("idx_gamification_events_created", "created_at"),
        Index(
            "uq_gamification_events_user_key",
            "user_id",
            "event_key",
            unique=True,
            postgresql_where=text("event_key IS NOT NULL"),
        ),
    )


class CoinTransaction(Base):
    """Transaction ledger for all coin movements. Every credit and debit is recorded.

    References: FR-003, D-MM-3
    """

    __tablename__ = "coin_transactions"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user_progression.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    balance_after: Mapped[int] = mapped_column(Integer, nullable=False)
    transaction_type: Mapped[str] = mapped_column(String(20), nullable=False)
    source: Mapped[str] = mapped_column(String(100), nullable=False)
    reference_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    progression: Mapped["UserProgression"] = relationship(
        back_populates="coin_txns", foreign_keys=[user_id]
    )

    __table_args__ = (
        Index("idx_coin_transactions_user_id", "user_id"),
        Index("idx_coin_transactions_created", "created_at"),
        CheckConstraint("balance_after >= 0", name="ck_balance_after_non_negative"),
        CheckConstraint(
            "transaction_type IN ('earned', 'spent', 'refund')",
            name="ck_transaction_type_valid",
        ),
    )
