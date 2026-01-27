"""
Roadmap model for storing generated career roadmaps.

Stores the full roadmap data as JSONB for flexibility,
with key fields extracted for querying and display.
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any, List, Optional
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, String, Text, Integer, Boolean
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import text

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .user_profile import UserProfile
    from .roadmap_progress import RoadmapMilestoneProgress, RoadmapExtra, RoadmapEdit


class SavedRoadmap(Base, TimestampMixin):
    """
    Stores a generated career roadmap for a user.

    The full roadmap data is stored in the `roadmap_data` JSONB field,
    with key fields extracted for easier querying and display.
    """
    __tablename__ = "saved_roadmaps"

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

    # Display fields (extracted from roadmap for easy querying)
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        default="Career Roadmap",
    )

    # Target roles as a simple list for display
    target_role_titles: Mapped[List[str]] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
    )

    # Summary stats
    total_phases: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_milestones: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_estimated_months: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # The emphasis used when generating
    emphasis: Mapped[str] = mapped_column(String(50), nullable=False, default="balanced")

    # Executive summary for preview
    executive_summary: Mapped[str] = mapped_column(Text, nullable=True)

    # Full roadmap data as JSONB
    roadmap_data: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
    )

    # Generation metadata
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    # Edit tracking fields
    edit_mode: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="view",
    )  # view | ai_edit | manual_edit
    has_manual_edits: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )
    current_phase_id: Mapped[Optional[str]] = mapped_column(String(100))

    # Relationships
    user_profile: Mapped["UserProfile"] = relationship(
        "UserProfile",
        back_populates="saved_roadmaps",
    )

    milestone_progress: Mapped[List["RoadmapMilestoneProgress"]] = relationship(
        "RoadmapMilestoneProgress",
        backref="roadmap",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )

    extras: Mapped[List["RoadmapExtra"]] = relationship(
        "RoadmapExtra",
        backref="roadmap",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )

    edits: Mapped[List["RoadmapEdit"]] = relationship(
        "RoadmapEdit",
        backref="roadmap",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )
