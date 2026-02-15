"""Achievement API routes.

Endpoints:
- GET /api/achievements/catalog -- Full catalog with user unlock status
- GET /api/achievements -- User's unlocked achievements

References: FR-011.3, FR-013.4
Architecture Section 3.2
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user_profile import UserProfile
from app.schemas.achievement import (
    AchievementCatalogItem,
    AchievementCatalogResponse,
    UnlockedAchievementItem,
    UserAchievementsResponse,
)
from app.services.achievement_service import achievement_service
from app.utils.security import get_current_user_from_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/achievements", tags=["achievements"])


@router.get("/catalog", response_model=AchievementCatalogResponse)
def get_achievement_catalog(
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
) -> AchievementCatalogResponse:
    """Returns all active achievements with unlock status for the current user."""
    items = achievement_service.get_catalog_with_status(db, current_user.id)
    return AchievementCatalogResponse(
        achievements=[
            AchievementCatalogItem(
                id=item.id,
                name=item.name,
                description=item.description,
                icon=item.icon,
                category=item.category,
                xp_reward=item.xp_reward,
                coin_reward=item.coin_reward,
                is_unlocked=item.is_unlocked,
                unlocked_at=item.unlocked_at,
            )
            for item in items
        ]
    )


@router.get("", response_model=UserAchievementsResponse)
def get_user_achievements(
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
) -> UserAchievementsResponse:
    """Returns only the user's unlocked achievements with timestamps."""
    user_achievements = achievement_service.get_user_achievements(
        db, current_user.id
    )
    return UserAchievementsResponse(
        achievements=[
            UnlockedAchievementItem(
                id=ua.achievement_id,
                name=ua.achievement.name,
                unlocked_at=ua.unlocked_at,
                xp_reward=ua.achievement.xp_reward,
                coin_reward=ua.achievement.coin_reward,
            )
            for ua in user_achievements
        ],
        count=len(user_achievements),
    )
