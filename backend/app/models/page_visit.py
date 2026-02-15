"""User page visit tracking model.

Tracks page visits for the "explorer" achievement and engagement metrics.
References: FR-021
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .base import Base


class UserPageVisit(Base):
    """Tracks page visits per user for achievement evaluation."""

    __tablename__ = "user_page_visits"

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
    page: Mapped[str] = mapped_column(String(100), nullable=False)
    first_visited_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    visit_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    __table_args__ = (
        Index("uq_user_page_visit", "user_id", "page", unique=True),
        Index("idx_user_page_visits_user_id", "user_id"),
    )
