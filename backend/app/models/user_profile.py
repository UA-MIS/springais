from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

import bcrypt
from sqlalchemy import Boolean, DateTime, Index, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import text

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .career_path import CareerPath
    from .match import Match


class UserProfile(Base, TimestampMixin):
    __tablename__ = "user_profiles"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String)
    current_role: Mapped[str | None] = mapped_column(String)
    years_experience: Mapped[float | None] = mapped_column(Numeric)
    target_service_line: Mapped[str | None] = mapped_column(String)
    skills: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    resume_text: Mapped[str | None] = mapped_column(Text)
    resume_file_url: Mapped[str | None] = mapped_column(String)
    skill_assessment_scores: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    onboarding_complete: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    matches: Mapped[list["Match"]] = relationship(
        "Match",
        back_populates="user_profile",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    career_path: Mapped[CareerPath | None] = relationship(
        "CareerPath",
        back_populates="user_profile",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
        Index("idx_user_profile_email", "email", unique=True),
        Index("idx_user_profile_target_service_line", "target_service_line"),
        Index("idx_user_profile_skills", "skills", postgresql_using="gin"),
    )

    def verify_password(self, plain_password: str) -> bool:
        """Verify a plaintext password against the stored bcrypt hash."""

        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            self.hashed_password.encode("utf-8"),
        )
