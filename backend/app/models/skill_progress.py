from datetime import datetime
from typing import Optional, List
from uuid import UUID, uuid4

from sqlalchemy import String, Integer, Text, ForeignKey, Index, DateTime, LargeBinary
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import text

from .base import Base, TimestampMixin


class UserSkill(Base, TimestampMixin):
    """Tracks a user's relationship with a skill."""
    __tablename__ = "user_skills"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True,
        default=uuid4, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=False
    )
    skill_name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="not_started")
    # Proficiency scale: 0=None, 1=Beginner, 2=Elementary, 3=Intermediate, 4=Advanced, 5=Expert
    # Resume skills start at 3, new skills at 0. Skills at 3+ count toward job matching.
    proficiency_level: Mapped[int] = mapped_column(Integer, default=0)
    # Source: resume, job_gap, manual, roadmap
    source: Mapped[str] = mapped_column(String(20), default="manual")
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    last_updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    module_progress: Mapped[List["UserModuleProgress"]] = relationship(
        "UserModuleProgress", back_populates="user_skill", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_user_skill_user_id", "user_id"),
        Index("idx_user_skill_name", "user_id", "skill_name", unique=True),
    )


class SkillModule(Base, TimestampMixin):
    """Defines modules within a skill (shared across users)."""
    __tablename__ = "skill_modules"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True,
        default=uuid4, server_default=text("gen_random_uuid()")
    )
    skill_name: Mapped[str] = mapped_column(String(255), nullable=False)
    module_number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    sequence_order: Mapped[int] = mapped_column(Integer, nullable=False)
    estimated_hours: Mapped[Optional[int]] = mapped_column(Integer)
    resources: Mapped[list] = mapped_column(JSONB, default=list)
    # AI-generated learning content
    learning_content: Mapped[Optional[str]] = mapped_column(Text)
    external_resources: Mapped[list] = mapped_column(JSONB, default=list)  # Curated external URLs
    ey_resources: Mapped[list] = mapped_column(JSONB, default=list)  # EY-specific resources (Credly, Virtual Academy)
    skill_type: Mapped[str] = mapped_column(String(20), default="technical")  # technical, soft, tool

    __table_args__ = (
        Index("idx_skill_module_name", "skill_name"),
        Index("idx_skill_module_order", "skill_name", "sequence_order", unique=True),
    )


class UserModuleProgress(Base, TimestampMixin):
    """Tracks a user's progress on a specific module."""
    __tablename__ = "user_module_progress"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True,
        default=uuid4, server_default=text("gen_random_uuid()")
    )
    user_skill_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user_skills.id", ondelete="CASCADE"),
        nullable=False
    )
    module_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("skill_modules.id", ondelete="CASCADE"),
        nullable=False
    )
    status: Mapped[str] = mapped_column(String(20), default="not_started")
    progress_percentage: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    extra_data: Mapped[dict] = mapped_column(JSONB, default=dict)
    # Task tracking within modules (list of completed task indices)
    tasks_completed: Mapped[list] = mapped_column(JSONB, default=list)

    # Proof of completion (all optional)
    completion_type: Mapped[str] = mapped_column(String(20), default="self_reported")  # self_reported, with_proof
    proof_description: Mapped[Optional[str]] = mapped_column(Text)
    proof_link: Mapped[Optional[str]] = mapped_column(String(500))
    # File storage in database (PostgreSQL BYTEA)
    proof_file_data: Mapped[Optional[bytes]] = mapped_column(LargeBinary)
    proof_file_name: Mapped[Optional[str]] = mapped_column(String(255))
    proof_file_type: Mapped[Optional[str]] = mapped_column(String(100))  # MIME type
    ai_feedback: Mapped[Optional[str]] = mapped_column(Text)  # AI review of submission

    user_skill: Mapped["UserSkill"] = relationship("UserSkill", back_populates="module_progress")
    module: Mapped["SkillModule"] = relationship("SkillModule")

    __table_args__ = (
        Index("idx_user_module_skill", "user_skill_id"),
        Index("idx_user_module_unique", "user_skill_id", "module_id", unique=True),
    )
