from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any, Optional
from uuid import UUID, uuid4

import bcrypt
from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import text
from pgvector.sqlalchemy import Vector

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .career_path import CareerPath
    from .employee import Employee
    from .hm_saved_job import HMSavedJob
    from .match import Match
    from .roadmap import SavedRoadmap


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
    employee_id: Mapped[str | None] = mapped_column(
        String,
        ForeignKey("employees.id"),
        nullable=True,
    )
    resume_text: Mapped[str | None] = mapped_column(Text)
    resume_file_url: Mapped[str | None] = mapped_column(String)
    skill_assessment_scores: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    onboarding_complete: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # Account type: 'personal' (default) or 'hiring_manager'
    account_type: Mapped[str] = mapped_column(
        String(20),
        default="personal",
        server_default="personal",
        nullable=False,
    )
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # LLM-extracted skill columns
    llm_listed_skills: Mapped[list[dict[str, Any]] | None] = mapped_column(JSONB)
    llm_inferred_skills: Mapped[list[dict[str, Any]] | None] = mapped_column(JSONB)

    # AI-generated skill groupings with modules
    skill_groupings: Mapped[dict[str, Any] | None] = mapped_column(JSONB, default=dict)

    # Embedding column
    resume_embedding: Mapped[list[float] | None] = mapped_column(Vector(1536))

    matches: Mapped[list["Match"]] = relationship(
        "Match",
        back_populates="user_profile",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    employee: Mapped[Optional["Employee"]] = relationship("Employee", uselist=False)
    career_path: Mapped[CareerPath | None] = relationship(
        "CareerPath",
        back_populates="user_profile",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    saved_roadmaps: Mapped[list["SavedRoadmap"]] = relationship(
        "SavedRoadmap",
        back_populates="user_profile",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    hm_saved_jobs: Mapped[list["HMSavedJob"]] = relationship(
        "HMSavedJob",
        back_populates="hm_user",
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
