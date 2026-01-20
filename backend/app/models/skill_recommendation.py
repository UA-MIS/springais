from __future__ import annotations

from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, Index, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import text

from .base import Base, TimestampMixin


class UserSkillRecommendation(Base, TimestampMixin):
    __tablename__ = "user_skill_recommendations"

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

    skill_name: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str | None] = mapped_column(String)
    priority_score: Mapped[float] = mapped_column(Numeric, default=0.5)
    source: Mapped[str] = mapped_column(String, nullable=False)
    related_job_ids: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)

    status: Mapped[str] = mapped_column(String, default="recommended")
    user_notes: Mapped[str | None] = mapped_column(Text)

    __table_args__ = (
        Index("idx_skill_rec_user_id", "user_id"),
        Index("idx_skill_rec_priority", "user_id", "priority_score"),
    )
