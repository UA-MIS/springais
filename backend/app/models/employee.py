from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Index, Numeric, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin
from .schemas import PerformanceMetrics

if TYPE_CHECKING:
    from .match import Match


class Employee(Base, TimestampMixin):
    __tablename__ = "employees"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    service_line: Mapped[str] = mapped_column(String, nullable=False)
    current_role: Mapped[str] = mapped_column(String, nullable=False)
    role_level: Mapped[int] = mapped_column(nullable=False)
    years_experience: Mapped[float] = mapped_column(Numeric, nullable=False)
    skills: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    performance_metrics: Mapped[dict] = mapped_column(
        JSONB,
        default=lambda: {
            "utilization": 0,
            "billing_rate": 0,
            "realization": 0,
            "quality_score": 1.0,
            "training_hours": 0,
            "client_feedback": 1.0,
        },
        nullable=False,
    )
    feedback_themes: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        default=list,
        nullable=False,
    )
    notable_achievement: Mapped[str | None] = mapped_column(Text)
    # Prior roles, e.g. [{"role": "Analyst", "years": 2, "service_line": "Advisory"}].
    # Read by app/services/pattern_service.py; added in migration 033.
    career_history: Mapped[list[dict] | None] = mapped_column(JSONB, nullable=True)

    matches: Mapped[list["Match"]] = relationship(
        "Match",
        back_populates="employee",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
        Index("idx_employee_service_line", "service_line"),
        Index("idx_employee_current_role", "current_role"),
        Index("idx_employee_role_level", "role_level"),
        Index("idx_employee_skills", "skills", postgresql_using="gin"),
    )

    @property
    def metrics(self) -> PerformanceMetrics:
        """Type-safe access to performance metrics."""

        return PerformanceMetrics(**self.performance_metrics)

    @metrics.setter
    def metrics(self, value: PerformanceMetrics) -> None:
        """Type-safe setter with validation."""

        self.performance_metrics = value.model_dump()
