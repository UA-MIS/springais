from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import text

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .user_profile import UserProfile


class CareerPath(Base, TimestampMixin):
    __tablename__ = "career_paths"

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
    current_position_node_id: Mapped[str | None] = mapped_column(String)
    target_position_node_id: Mapped[str | None] = mapped_column(String)
    graph_data: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    progression_status: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    last_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user_profile: Mapped["UserProfile"] = relationship(
        "UserProfile",
        back_populates="career_path",
    )

    __table_args__ = (Index("idx_career_path_user_id", "user_id", unique=True),)

    def update_progress(self, completed_step: str) -> None:
        """Update progression_status with a completed step."""

        status = self.progression_status or {}
        completed = list(status.get("completed_steps", []))
        if completed_step not in completed:
            completed.append(completed_step)
        status["completed_steps"] = completed
        status["current_step"] = completed_step
        self.progression_status = status
