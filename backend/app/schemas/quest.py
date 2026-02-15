"""Pydantic schemas for the quest API.

References: FR-018.3, FR-019.2, FR-019.5
Architecture Section 3.4, Appendix A
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.schemas.progression import CosmeticBrief


class QuestRequirement(BaseModel):
    type: str
    count: int
    description: str
    current_count: int = 0
    completed: bool = False


class QuestCatalogItem(BaseModel):
    id: str
    name: str
    description: str
    level_required: int
    xp_reward: int
    coin_reward: int
    cosmetic_reward: CosmeticBrief | None = None
    requirements: list[QuestRequirement]
    status: str  # "available", "in_progress", "completed"
    started_at: datetime | str | None = None
    completed_at: datetime | str | None = None


class QuestCatalogResponse(BaseModel):
    quests: list[QuestCatalogItem]


class StartQuestResponse(BaseModel):
    quest_id: str
    status: str
    started_at: datetime
