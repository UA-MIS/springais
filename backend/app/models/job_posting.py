from __future__ import annotations

from datetime import date
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import Boolean, Date, DateTime, Index, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .hm_saved_job import HMSavedJob
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
    tags: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    experience_years_min: Mapped[int | None] = mapped_column(Integer)
    experience_years_max: Mapped[int | None] = mapped_column(Integer)
    posting_url: Mapped[str | None] = mapped_column(String)
    source_locale: Mapped[str | None] = mapped_column(String)
    posted_date: Mapped[date | None] = mapped_column(Date)
    scraped_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    responsibilities_text: Mapped[str | None] = mapped_column(Text)
    requirements_text: Mapped[str | None] = mapped_column(Text)
    preferred_text: Mapped[str | None] = mapped_column(Text)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    search_vector: Mapped[str | None] = mapped_column(
        TSVECTOR,
        server_default=text("NULL"),
    )

    # LLM-extracted skill columns
    llm_required_skills: Mapped[list[dict[str, Any]] | None] = mapped_column(JSONB)
    llm_inferred_skills: Mapped[list[dict[str, Any]] | None] = mapped_column(JSONB)
    llm_experience_years_min: Mapped[int | None] = mapped_column(Integer)
    llm_experience_years_max: Mapped[int | None] = mapped_column(Integer)
    llm_primary_domain: Mapped[str | None] = mapped_column(String(100))
    skill_extraction_hash: Mapped[str | None] = mapped_column(String(64))
    skills_extracted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Embedding columns
    description_embedding: Mapped[list[float] | None] = mapped_column(Vector(1536))
    title_embedding: Mapped[list[float] | None] = mapped_column(Vector(1536))

    matches: Mapped[list["Match"]] = relationship(
        "Match",
        back_populates="job_posting",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    hm_saves: Mapped[list["HMSavedJob"]] = relationship(
        "HMSavedJob",
        back_populates="job_posting",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
        Index("idx_job_posting_service_line", "service_line"),
        Index("idx_job_posting_is_active", "is_active"),
        Index("idx_job_posting_posted_date", "posted_date"),
        Index(
            "idx_job_posting_created_at",
            "created_at",
            postgresql_using="brin",
        ),
        Index("idx_job_posting_external_id", "external_id", unique=True),
        Index("idx_job_posting_required_skills", "required_skills", postgresql_using="gin"),
        Index("idx_job_posting_tags", "tags", postgresql_using="gin"),
        Index("idx_job_posting_search_vector", "search_vector", postgresql_using="gin"),
    )
