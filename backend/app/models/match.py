from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID, uuid4

import sqlalchemy as sa
from sqlalchemy import ForeignKey, Index, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import text

from .base import Base, TimestampMixin
from .schemas import MatchScores

if TYPE_CHECKING:
    from .employee import Employee
    from .job_posting import JobPosting
    from .user_profile import UserProfile


class Match(Base, TimestampMixin):
    __tablename__ = "matches"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    employee_id: Mapped[str | None] = mapped_column(
        String,
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=True,  # Nullable for user-based saves (not tied to employee)
    )
    job_posting_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("job_postings.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
    )
    match_mode: Mapped[str] = mapped_column(String, nullable=False)
    overall_score: Mapped[float] = mapped_column(Numeric, nullable=False)
    skill_match_score: Mapped[float] = mapped_column(Numeric, nullable=False)
    experience_score: Mapped[float] = mapped_column(Numeric, nullable=False)
    growth_potential_score: Mapped[float] = mapped_column(Numeric, nullable=False)
    skill_gaps: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    matched_skills: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    transferable_skills: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False, server_default="[]")
    explanation: Mapped[str | None] = mapped_column(Text)

    employee: Mapped["Employee"] = relationship(
        "Employee",
        back_populates="matches",
    )
    job_posting: Mapped["JobPosting"] = relationship(
        "JobPosting",
        back_populates="matches",
    )
    user_profile: Mapped[UserProfile | None] = relationship(
        "UserProfile",
        back_populates="matches",
    )

    __table_args__ = (
        Index("idx_match_employee_id", "employee_id"),
        Index("idx_match_job_posting_id", "job_posting_id"),
        Index("idx_match_user_score", "user_id", sa.desc("overall_score")),
        Index("idx_match_mode", "match_mode"),
    )

    @property
    def scores(self) -> MatchScores:
        """Type-safe access to score fields."""

        return MatchScores(
            overall_score=float(self.overall_score),
            skill_match_score=float(self.skill_match_score),
            experience_score=float(self.experience_score),
            growth_potential_score=float(self.growth_potential_score),
        )
