"""Pydantic schemas for the progression API."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, Field


class FeatureUnlocks(BaseModel):
    side_quests: bool
    guild_rank: bool
    advanced_arena: bool
    special_title: bool


class CosmeticBrief(BaseModel):
    id: str
    name: str
    category: str
    rarity: str


class ProgressionResponse(BaseModel):
    xp_total: int
    level: int
    title: str
    coin_balance: int
    login_streak: int
    last_login_date: date | None
    adventure_mode_enabled: bool
    current_level_xp: int
    xp_to_next_level: int
    feature_unlocks: FeatureUnlocks
    equipped_items: dict[str, CosmeticBrief | None]
    unlocked_achievements_count: int
    active_quests_count: int
    walkthrough_step: int = 0
    walkthrough_completed: bool = False
    onboarding_complete: bool = True


class ToggleAdventureModeResponse(BaseModel):
    adventure_mode_enabled: bool


class AchievementBrief(BaseModel):
    id: str
    name: str
    description: str
    xp_reward: int
    coin_reward: int


class LoginResponse(BaseModel):
    login_streak: int
    coins_awarded: int
    streak_bonus: int
    total_coins_awarded: int
    achievements_unlocked: list[AchievementBrief]
    is_new_day: bool


class VisitRequest(BaseModel):
    page: str = Field(..., min_length=1, max_length=100)


class VisitResponse(BaseModel):
    page: str
    visit_count: int
    achievements_unlocked: list[AchievementBrief]


class HistoryItem(BaseModel):
    id: str
    event_type: str | None = None
    xp_awarded: int | None = None
    coins_awarded: int | None = None
    amount: int | None = None
    balance_after: int | None = None
    transaction_type: str | None = None
    source: str | None = None
    created_at: datetime


class HistoryResponse(BaseModel):
    items: list[HistoryItem]
    total: int
    limit: int
    offset: int


class RewardResultResponse(BaseModel):
    """Gamification reward data optionally included in API responses."""

    xp_awarded: int = 0
    coins_awarded: int = 0
    level_up: bool = False
    new_level: int | None = None
    new_title: str | None = None
    achievements_unlocked: list[AchievementBrief] = []
    quest_updates: list[dict[str, Any]] = []


class ActionRequest(BaseModel):
    action: str = Field(..., min_length=1, max_length=100)


class ActionResponse(BaseModel):
    xp_awarded: int = 0
    coins_awarded: int = 0
    level_up: bool = False
    new_level: int | None = None
    new_title: str | None = None
    achievements_unlocked: list[AchievementBrief] = []
    already_awarded: bool = False


class WalkthroughStepRequest(BaseModel):
    step: int = Field(..., ge=0, le=7)


class WalkthroughStepReward(BaseModel):
    xp_awarded: int = 0
    coins_awarded: int = 0


class WalkthroughStepResponse(BaseModel):
    step: int
    already_completed: bool = False
    reward: WalkthroughStepReward = WalkthroughStepReward()


class CompleteOnboardingResponse(BaseModel):
    onboarding_complete: bool
    walkthrough_completed: bool
