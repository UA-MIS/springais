from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import text

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .job_posting import JobPosting
    from .user_profile import UserProfile


class HMSavedJob(Base, TimestampMixin):
    """
    Represents a job posting saved by a Hiring Manager to their "My Jobs" list.

    This is separate from the Match table which tracks candidate interest.
    HMs save jobs they are responsible for hiring, then can view aggregate
    candidate interest data.
    """
    __tablename__ = "hm_saved_jobs"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    hm_user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    job_posting_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("job_postings.id", ondelete="CASCADE"),
        nullable=False,
    )
    notes: Mapped[str | None] = mapped_column(Text)

    # Relationships
    hm_user: Mapped["UserProfile"] = relationship(
        "UserProfile",
        back_populates="hm_saved_jobs",
    )
    job_posting: Mapped["JobPosting"] = relationship(
        "JobPosting",
        back_populates="hm_saves",
    )
