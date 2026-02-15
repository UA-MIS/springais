"""Pydantic schemas for the achievement API.

References: FR-011, FR-013
Architecture Section 3.2, Appendix A
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class AchievementBrief(BaseModel):
    id: str
    name: str
    description: str
    xp_reward: int
    coin_reward: int


class AchievementCatalogItem(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    category: str
    xp_reward: int
    coin_reward: int
    is_unlocked: bool
    unlocked_at: datetime | None


class AchievementCatalogResponse(BaseModel):
    achievements: list[AchievementCatalogItem]


class UnlockedAchievementItem(BaseModel):
    id: str
    name: str
    unlocked_at: datetime
    xp_reward: int
    coin_reward: int


class UserAchievementsResponse(BaseModel):
    achievements: list[UnlockedAchievementItem]
    count: int
