"""
Roadmap progress tracking models.

Tracks milestone completion, user-added extras, and edit history
separate from the core roadmap data.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, String, Text, Boolean
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import text

from .base import Base, TimestampMixin


class RoadmapMilestoneProgress(Base, TimestampMixin):
    """Tracks completion status for individual milestones."""
    __tablename__ = "roadmap_milestone_progress"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    roadmap_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("saved_roadmaps.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    milestone_id: Mapped[str] = mapped_column(String(100), nullable=False)
    phase_id: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="not_started"
    )  # not_started | in_progress | completed
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    notes: Mapped[Optional[str]] = mapped_column(Text)


class RoadmapExtra(Base, TimestampMixin):
    """User-added achievements beyond the roadmap."""
    __tablename__ = "roadmap_extras"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    roadmap_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("saved_roadmaps.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    phase_id: Mapped[str] = mapped_column(String(100), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(50), nullable=False)  # certification | skill | project | achievement
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class RoadmapEdit(Base, TimestampMixin):
    """Tracks all edits to a roadmap for audit trail."""
    __tablename__ = "roadmap_edits"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    roadmap_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("saved_roadmaps.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    edit_type: Mapped[str] = mapped_column(String(20), nullable=False)  # ai_assisted | manual
    change_description: Mapped[str] = mapped_column(Text, nullable=False)
    affected_elements: Mapped[list[str]] = mapped_column(JSONB, default=list)
    original_values: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    new_values: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
