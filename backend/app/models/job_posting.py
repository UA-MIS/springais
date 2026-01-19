from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .match import Match


class JobPosting(Base, TimestampMixin):
    __tablename__ = "job_postings"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    external_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    service_line: Mapped[str] = mapped_column(String, nullable=False)
    location: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    required_skills: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    preferred_skills: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    experience_years_min: Mapped[int | None] = mapped_column(Integer)
    experience_years_max: Mapped[int | None] = mapped_column(Integer)
    posting_url: Mapped[str | None] = mapped_column(String)
    scraped_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    matches: Mapped[list["Match"]] = relationship(
        "Match",
        back_populates="job_posting",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
        Index("idx_job_posting_service_line", "service_line"),
        Index(
            "idx_job_posting_created_at",
            "created_at",
            postgresql_using="brin",
        ),
        Index("idx_job_posting_external_id", "external_id", unique=True),
        Index("idx_job_posting_required_skills", "required_skills", postgresql_using="gin"),
    )
