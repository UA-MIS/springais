"""Progression API routes.

Endpoints:
- GET /api/progression -- Full progression state
- POST /api/progression/toggle-adventure-mode -- Toggle adventure mode
- POST /api/progression/login -- Record daily login
- POST /api/progression/visit -- Record page visit
- POST /api/progression/walkthrough-step -- Persist walkthrough step progress
- POST /api/progression/complete-onboarding -- Mark onboarding complete
- GET /api/progression/history -- Paginated event/transaction history
"""

from __future__ import annotations

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.page_visit import UserPageVisit
from app.models.progression import CoinTransaction, GamificationEvent
from app.models.user_profile import UserProfile
from app.schemas.progression import (
    ActionRequest,
    ActionResponse,
    AchievementBrief,
    CompleteOnboardingResponse,
    HistoryItem,
    HistoryResponse,
    LoginResponse,
    ProgressionResponse,
    ToggleAdventureModeResponse,
    VisitRequest,
    VisitResponse,
    WalkthroughStepRequest,
    WalkthroughStepResponse,
    WalkthroughStepReward,
)
from app.services.progression_service import (
    VALID_PAGES,
    progression_service,
)
from app.utils.security import get_current_user_from_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/progression", tags=["progression"])


@router.get("", response_model=ProgressionResponse)
def get_progression(
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
) -> ProgressionResponse:
    """Returns the authenticated user's full progression state."""
    state = progression_service.get_progression(db, current_user.id)
    if state is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Progression not found. Call POST /api/progression/login to initialize.",
        )
    return ProgressionResponse(**state)


@router.post("/toggle-adventure-mode", response_model=ToggleAdventureModeResponse)
def toggle_adventure_mode(
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
) -> ToggleAdventureModeResponse:
    """Toggles adventure_mode_enabled and returns the new state."""
    new_state = progression_service.toggle_adventure_mode(db, current_user.id)
    db.commit()
    return ToggleAdventureModeResponse(adventure_mode_enabled=new_state)


@router.post("/login", response_model=LoginResponse)
def record_login(
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
) -> LoginResponse:
    """Records a daily login. Awards daily login coins, updates streak."""
    result = progression_service.record_login(db, current_user.id)
    db.commit()
    return LoginResponse(
        login_streak=result.login_streak,
        coins_awarded=result.coins_awarded,
        streak_bonus=sum(b["coins"] for b in result.streak_bonuses),
        total_coins_awarded=result.total_coins_awarded,
        achievements_unlocked=[],
        is_new_day=result.is_new_day,
    )


@router.post("/visit", response_model=VisitResponse)
def record_visit(
    request: VisitRequest,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
) -> VisitResponse:
    """Records a page visit. Validates page against allowlist (FINDING-AUTH-002)."""
    if request.page not in VALID_PAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid page. Must be one of: {', '.join(sorted(VALID_PAGES))}",
        )

    # Upsert page visit
    visit = (
        db.query(UserPageVisit)
        .filter(
            UserPageVisit.user_id == current_user.id,
            UserPageVisit.page == request.page,
        )
        .first()
    )
    if visit is None:
        visit = UserPageVisit(
            user_id=current_user.id,
            page=request.page,
        )
        db.add(visit)
    else:
        visit.visit_count += 1

    db.flush()

    # Story 5.5: Check if all required pages visited for explorer achievement
    achievements_unlocked = []
    required_pages = {"/matches", "/profile", "/saved", "/roadmap", "/success-patterns"}
    visited_pages = {
        row.page
        for row in db.query(UserPageVisit.page)
        .filter(UserPageVisit.user_id == current_user.id)
        .all()
    }
    if required_pages.issubset(visited_pages):
        # All required pages visited -- fire gamification hook for exploration
        try:
            from app.services.reward_hook_service import reward_hook_service
            reward_hook_service.process_action(
                db, current_user.id, "explorer_completed",
                f"explorer:{current_user.id}"
            )
        except Exception:
            logger.exception("Gamification failed for explorer achievement")

    db.commit()

    return VisitResponse(
        page=request.page,
        visit_count=visit.visit_count,
        achievements_unlocked=achievements_unlocked,
    )


@router.post("/action", response_model=ActionResponse)
def record_action(
    request: ActionRequest,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
) -> ActionResponse:
    """Fire a gamification event for a user action. Awards XP, coins, and evaluates achievements.

    The event_key includes user_id + action to ensure idempotency for one-time events.
    """
    from app.services.reward_hook_service import reward_hook_service

    event_key = f"{request.action}:{current_user.id}"
    result = reward_hook_service.process_action(
        db, current_user.id, request.action, event_key
    )
    db.commit()

    if result is None:
        return ActionResponse()

    achievements = []
    for a in result.achievements_unlocked:
        achievements.append(AchievementBrief(
            id=a.get("id", ""),
            name=a.get("name", ""),
            description=a.get("description", ""),
            xp_reward=a.get("xp_reward", 0),
            coin_reward=a.get("coin_reward", 0),
        ))

    return ActionResponse(
        xp_awarded=result.xp_awarded,
        coins_awarded=result.coins_awarded,
        level_up=result.level_up,
        new_level=result.new_level,
        new_title=result.new_title,
        achievements_unlocked=achievements,
        already_awarded=result.already_awarded,
    )


@router.post("/walkthrough-step", response_model=WalkthroughStepResponse)
def record_walkthrough_step(
    request: WalkthroughStepRequest,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
) -> WalkthroughStepResponse:
    """Persists walkthrough step progress. Idempotent -- returns early if step already completed."""
    from app.models.progression import UserProgression
    from app.services.reward_hook_service import reward_hook_service

    prog = (
        db.query(UserProgression)
        .filter(UserProgression.user_id == current_user.id)
        .with_for_update()
        .first()
    )
    if prog is None:
        prog = progression_service.ensure_progression_exists(db, current_user.id)
        prog = (
            db.query(UserProgression)
            .filter(UserProgression.user_id == current_user.id)
            .with_for_update()
            .first()
        )

    # Idempotent: already at or past this step
    if request.step <= prog.walkthrough_step:
        db.commit()
        return WalkthroughStepResponse(
            step=request.step,
            already_completed=True,
        )

    # B5 fix: Enforce sequential completion -- cannot skip steps
    if request.step != prog.walkthrough_step + 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Steps must be completed sequentially. Current step: {prog.walkthrough_step}, requested: {request.step}.",
        )

    prog.walkthrough_step = request.step
    db.flush()

    # Dispatch reward via hook service
    reward_result = reward_hook_service.process_action(
        db,
        current_user.id,
        "walkthrough_step",
        f"walkthrough_step:{current_user.id}:{request.step}",
        {"step": request.step},
    )

    db.commit()

    reward = WalkthroughStepReward()
    if reward_result:
        reward = WalkthroughStepReward(
            xp_awarded=reward_result.xp_awarded,
            coins_awarded=reward_result.coins_awarded,
        )

    return WalkthroughStepResponse(
        step=request.step,
        already_completed=False,
        reward=reward,
    )


@router.post("/complete-onboarding", response_model=CompleteOnboardingResponse)
def complete_onboarding(
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
) -> CompleteOnboardingResponse:
    """Marks onboarding as complete. Sets walkthrough_completed, onboarding_complete flags."""
    from app.models.progression import UserProgression

    # Update user_profiles.onboarding_complete
    current_user.onboarding_complete = True
    db.flush()

    # Update user_progression
    prog = (
        db.query(UserProgression)
        .filter(UserProgression.user_id == current_user.id)
        .with_for_update()
        .first()
    )
    if prog is None:
        prog = progression_service.ensure_progression_exists(db, current_user.id)
        prog = (
            db.query(UserProgression)
            .filter(UserProgression.user_id == current_user.id)
            .with_for_update()
            .first()
        )

    prog.walkthrough_completed = True
    prog.walkthrough_step = 7
    db.flush()

    # Complete "The Squire's Trial" quest if it exists
    try:
        from app.services.quest_service import quest_service
        quest_service.complete_quest_by_title(
            db, current_user.id, "The Squire's Trial"
        )
    except Exception:
        logger.debug("Quest completion for Squire's Trial skipped (quest may not exist)")

    # Award "Squire's Trial Emblem" cosmetic if it exists
    try:
        from app.services.store_service import store_service
        store_service.award_quest_cosmetic(
            db, current_user.id, "Squire's Trial Emblem"
        )
    except Exception:
        logger.debug("Cosmetic award for Squire's Trial Emblem skipped (cosmetic may not exist)")

    db.commit()

    return CompleteOnboardingResponse(
        onboarding_complete=True,
        walkthrough_completed=True,
    )


@router.get("/history", response_model=HistoryResponse)
def get_history(
    type: str = Query(..., pattern="^(event|transaction)$"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
) -> HistoryResponse:
    """Returns paginated event or transaction history."""
    if type == "event":
        total = (
            db.query(func.count(GamificationEvent.id))
            .filter(GamificationEvent.user_id == current_user.id)
            .scalar()
        )
        rows = (
            db.query(GamificationEvent)
            .filter(GamificationEvent.user_id == current_user.id)
            .order_by(GamificationEvent.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        items = [
            HistoryItem(
                id=str(r.id),
                event_type=r.event_type,
                xp_awarded=r.xp_awarded,
                coins_awarded=r.coins_awarded,
                created_at=r.created_at,
            )
            for r in rows
        ]
    else:
        total = (
            db.query(func.count(CoinTransaction.id))
            .filter(CoinTransaction.user_id == current_user.id)
            .scalar()
        )
        rows = (
            db.query(CoinTransaction)
            .filter(CoinTransaction.user_id == current_user.id)
            .order_by(CoinTransaction.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        items = [
            HistoryItem(
                id=str(r.id),
                amount=r.amount,
                balance_after=r.balance_after,
                transaction_type=r.transaction_type,
                source=r.source,
                created_at=r.created_at,
            )
            for r in rows
        ]

    return HistoryResponse(
        items=items,
        total=total or 0,
        limit=limit,
        offset=offset,
    )
