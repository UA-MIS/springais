"""Quest API routes.

Endpoints:
- GET /api/quests/catalog -- All quests user has unlocked
- GET /api/quests/active -- In-progress quests
- GET /api/quests/completed -- Completed quests
- POST /api/quests/{quest_id}/start -- Start a quest

References: FR-018.3, FR-019.2, FR-019.5
Architecture Section 3.4
"""

from __future__ import annotations

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.progression import UserProgression
from app.models.user_profile import UserProfile
from app.schemas.quest import (
    QuestCatalogItem,
    QuestCatalogResponse,
    QuestRequirement,
    StartQuestResponse,
)
from app.services.quest_service import quest_service
from app.utils.security import get_current_user_from_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/quests", tags=["quests"])


def _get_user_level(db: Session, user_id: UUID) -> int:
    """Get user's current level from progression."""
    prog = (
        db.query(UserProgression)
        .filter(UserProgression.user_id == user_id)
        .first()
    )
    return prog.level if prog else 1


@router.get("/catalog", response_model=QuestCatalogResponse)
def get_quest_catalog(
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
) -> QuestCatalogResponse:
    """Returns all quests the user has unlocked (level >= required), with progress status."""
    user_level = _get_user_level(db, current_user.id)
    quests = quest_service.get_available_quests(db, current_user.id, user_level)

    items = [
        QuestCatalogItem(
            id=q["id"],
            name=q["name"],
            description=q["description"],
            level_required=q["level_required"],
            xp_reward=q["xp_reward"],
            coin_reward=q["coin_reward"],
            cosmetic_reward=q.get("cosmetic_reward"),
            requirements=[QuestRequirement(**r) for r in q["requirements"]],
            status=q["status"],
            started_at=q.get("started_at"),
            completed_at=q.get("completed_at"),
        )
        for q in quests
    ]

    return QuestCatalogResponse(quests=items)


@router.get("/active", response_model=QuestCatalogResponse)
def get_active_quests(
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
) -> QuestCatalogResponse:
    """Returns in-progress quests with current progress."""
    quests = quest_service.get_active_quests(db, current_user.id)

    items = [
        QuestCatalogItem(
            id=q["id"],
            name=q["name"],
            description=q["description"],
            level_required=q["level_required"],
            xp_reward=q["xp_reward"],
            coin_reward=q["coin_reward"],
            cosmetic_reward=q.get("cosmetic_reward"),
            requirements=[QuestRequirement(**r) for r in q["requirements"]],
            status=q["status"],
            started_at=q.get("started_at"),
            completed_at=q.get("completed_at"),
        )
        for q in quests
    ]

    return QuestCatalogResponse(quests=items)


@router.get("/completed", response_model=QuestCatalogResponse)
def get_completed_quests(
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
) -> QuestCatalogResponse:
    """Returns completed quests."""
    quests = quest_service.get_completed_quests(db, current_user.id)

    items = [
        QuestCatalogItem(
            id=q["id"],
            name=q["name"],
            description=q["description"],
            level_required=q["level_required"],
            xp_reward=q["xp_reward"],
            coin_reward=q["coin_reward"],
            cosmetic_reward=q.get("cosmetic_reward"),
            requirements=[QuestRequirement(**r) for r in q["requirements"]],
            status=q["status"],
            started_at=q.get("started_at"),
            completed_at=q.get("completed_at"),
        )
        for q in quests
    ]

    return QuestCatalogResponse(quests=items)


@router.post("/{quest_id}/start", response_model=StartQuestResponse)
def start_quest(
    quest_id: str,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
) -> StartQuestResponse:
    """Start a quest."""
    try:
        quest_uuid = UUID(quest_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid quest ID format",
        )

    user_level = _get_user_level(db, current_user.id)

    try:
        quest_progress = quest_service.start_quest(
            db, current_user.id, quest_uuid, user_level
        )
        db.commit()
        return StartQuestResponse(
            quest_id=str(quest_progress.quest_id),
            status=quest_progress.status,
            started_at=quest_progress.started_at,
        )
    except PermissionError as e:
        parts = str(e).split(":")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "detail": "level_too_low",
                "required_level": int(parts[1]) if len(parts) > 1 else 0,
                "current_level": int(parts[2]) if len(parts) > 2 else 0,
            },
        )
    except ValueError as e:
        error_msg = str(e)
        if error_msg == "quest_not_found":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quest not found",
            )
        elif error_msg in ("quest_already_started", "quest_already_completed"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg,
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
