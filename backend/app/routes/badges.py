"""
Badge Discovery API routes.

Endpoints:
- GET /api/badges/discover - Discover badges for skills
- GET /api/badges/catalog/search - Search badge catalog
- GET /api/badges/{badge_id} - Get badge detail
- POST /api/badges/interactions - Record click/rating
- POST /api/badges/earned - Mark badge as earned (Phase D)
- GET /api/badges/analytics - Admin analytics (Phase D)
"""

import logging
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from app.database import get_db
from app.models.badge import (
    BadgeCatalog,
    BadgeInteraction,
    BadgeSkillMapping,
    UserBadge,
)
from app.schemas.badge import (
    BadgeAnalyticsResponse,
    BadgeCatalogSearchResponse,
    BadgeDiscoverResponse,
    BadgeEarnedRequest,
    BadgeInteractionRequest,
    BadgeResponse,
)
from app.utils.security import get_current_user_from_token
from app.models.user_profile import UserProfile
from app.services.badge_discovery_service import BadgeDiscoveryService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/badges", tags=["badges"])


def _badge_to_response(
    badge: BadgeCatalog = None,
    relevance_score: float = 0.0,
    mapping_source: str = "curated",
    scored_badge=None,
) -> BadgeResponse:
    """Convert a BadgeCatalog ORM object or ScoredBadge to a BadgeResponse schema."""
    if scored_badge is not None:
        return BadgeResponse(
            id=scored_badge.catalog_id or scored_badge.external_id,
            name=scored_badge.name,
            issuer=scored_badge.issuer,
            platform=scored_badge.platform,
            url=scored_badge.url,
            image_url=scored_badge.image_url,
            skills=scored_badge.skills or [],
            difficulty_level=scored_badge.difficulty_level,
            estimated_cost_usd=scored_badge.estimated_cost_usd,
            estimated_hours=scored_badge.estimated_hours,
            renewal_months=scored_badge.renewal_months,
            relevance_score=scored_badge.relevance_score,
            mapping_source=scored_badge.mapping_source,
        )
    return BadgeResponse(
        id=str(badge.id),
        name=badge.name,
        issuer=badge.issuer,
        platform=badge.platform,
        url=badge.url,
        image_url=badge.image_url,
        skills=badge.skills or [],
        difficulty_level=badge.difficulty_level,
        estimated_cost_usd=badge.estimated_cost_usd,
        estimated_hours=badge.estimated_hours,
        renewal_months=badge.renewal_months,
        relevance_score=relevance_score,
        mapping_source=mapping_source,
    )


# ============================================
# Discovery Endpoints
# ============================================

@router.get("/discover", response_model=BadgeDiscoverResponse)
async def discover_badges(
    skills: str = Query(..., description="Comma-separated skill names"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """
    Discover relevant badges for given skills (FR-1.1).

    Queries the curated badge catalog and skill mappings.
    Phase B adds external API queries; Phase D adds AI matching.
    """
    skill_list = [s.strip().lower() for s in skills.split(",") if s.strip()]

    if not skill_list:
        return BadgeDiscoverResponse(skills_queried=[])

    service = BadgeDiscoveryService(db)
    result = await service.discover_badges(skill_list, page=page, per_page=per_page)

    badges = [
        _badge_to_response(
            badge=None,
            relevance_score=scored.relevance_score,
            mapping_source=scored.mapping_source,
            scored_badge=scored,
        )
        for scored in result["badges"]
    ]

    return BadgeDiscoverResponse(
        badges=badges,
        total_count=result["total_count"],
        page=result["page"],
        per_page=result["per_page"],
        skills_queried=skill_list,
    )


@router.get("/catalog/search", response_model=BadgeCatalogSearchResponse)
async def search_catalog(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(10, ge=1, le=50),
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Search badge catalog by name for autocomplete (FR-4.5)."""
    q_safe = q.replace("%", r"\%").replace("_", r"\_")
    badges = (
        db.query(BadgeCatalog)
        .filter(
            BadgeCatalog.is_active == True,
            BadgeCatalog.name.ilike(f"%{q_safe}%", escape="\\"),
        )
        .limit(limit)
        .all()
    )

    results = [_badge_to_response(b, relevance_score=1.0) for b in badges]

    return BadgeCatalogSearchResponse(results=results, count=len(results))


# ============================================
# Interaction Tracking Endpoints
# ============================================

@router.post("/interactions")
async def record_interaction(
    request: BadgeInteractionRequest,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Record a user interaction with a badge suggestion (FR-5.1, FR-5.3)."""
    try:
        badge_uuid = UUID(request.badge_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid badge ID format")

    # Verify badge exists
    badge = db.query(BadgeCatalog).filter(
        BadgeCatalog.id == badge_uuid
    ).first()

    if not badge:
        raise HTTPException(status_code=404, detail="Badge not found")

    interaction = BadgeInteraction(
        user_id=current_user.id,
        badge_id=badge.id,
        interaction_type=request.interaction_type,
        source=request.source,
    )
    db.add(interaction)
    db.commit()

    return {"recorded": True}


# ============================================
# Phase D Endpoints
# ============================================

@router.post("/earned")
async def mark_badge_earned(
    request: BadgeEarnedRequest,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Mark a badge as earned by the user (FR-5.2)."""
    try:
        badge_uuid = UUID(request.badge_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid badge ID format")

    badge = db.query(BadgeCatalog).filter(
        BadgeCatalog.id == badge_uuid
    ).first()

    if not badge:
        raise HTTPException(status_code=404, detail="Badge not found")

    # Check if already earned
    existing = db.query(UserBadge).filter(
        UserBadge.user_id == current_user.id,
        UserBadge.badge_id == badge.id,
    ).first()

    if existing:
        raise HTTPException(status_code=409, detail="Badge already marked as earned")

    earned_date = request.earned_date or datetime.now(timezone.utc)

    user_badge = UserBadge(
        user_id=current_user.id,
        badge_id=badge.id,
        earned_date=earned_date,
        self_reported=True,
    )
    db.add(user_badge)

    # Also record an "earned" interaction
    interaction = BadgeInteraction(
        user_id=current_user.id,
        badge_id=badge.id,
        interaction_type="earned",
        source="skill_module",
    )
    db.add(interaction)

    db.commit()

    return {
        "id": str(user_badge.id),
        "badge_id": str(user_badge.badge_id),
        "earned_date": user_badge.earned_date.isoformat() if user_badge.earned_date else None,
    }


@router.get("/analytics", response_model=BadgeAnalyticsResponse)
async def get_badge_analytics(
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Admin analytics for badge suggestions (FR-5.4)."""
    if getattr(current_user, "account_type", None) != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    total_badges = db.query(BadgeCatalog).filter(BadgeCatalog.is_active == True).count()
    total_interactions = db.query(BadgeInteraction).count()

    # Click-through rates per badge
    click_counts = (
        db.query(
            BadgeInteraction.badge_id,
            func.count(BadgeInteraction.id).label("click_count"),
        )
        .filter(BadgeInteraction.interaction_type == "click")
        .group_by(BadgeInteraction.badge_id)
        .order_by(func.count(BadgeInteraction.id).desc())
        .limit(20)
        .all()
    )

    top_clicked = []
    for badge_id, count in click_counts:
        badge = db.query(BadgeCatalog).filter(BadgeCatalog.id == badge_id).first()
        if badge:
            top_clicked.append({
                "badge_id": str(badge_id),
                "name": badge.name,
                "clicks": count,
            })

    # Relevance ratings
    positive = db.query(BadgeInteraction).filter(
        BadgeInteraction.interaction_type == "thumbs_up"
    ).count()
    negative = db.query(BadgeInteraction).filter(
        BadgeInteraction.interaction_type == "thumbs_down"
    ).count()

    # Flagged badges: >60% negative over 50+ ratings (FR-5.5)
    flagged = []
    if total_interactions > 0:
        neg_case = func.sum(
            case(
                (BadgeInteraction.interaction_type == "thumbs_down", 1),
                else_=0,
            )
        ).label("negative_count")

        rated_badges = (
            db.query(
                BadgeInteraction.badge_id,
                func.count(BadgeInteraction.id).label("total"),
                neg_case,
            )
            .filter(BadgeInteraction.interaction_type.in_(["thumbs_up", "thumbs_down"]))
            .group_by(BadgeInteraction.badge_id)
            .having(func.count(BadgeInteraction.id) >= 50)
            .all()
        )

        for badge_id, total, neg_count in rated_badges:
            if neg_count and total and (neg_count / total) > 0.6:
                badge = db.query(BadgeCatalog).filter(BadgeCatalog.id == badge_id).first()
                if badge:
                    flagged.append({
                        "badge_id": str(badge_id),
                        "name": badge.name,
                        "negative_rate": round(neg_count / total, 2),
                        "total_ratings": total,
                    })

    return BadgeAnalyticsResponse(
        total_badges=total_badges,
        total_interactions=total_interactions,
        top_clicked_badges=top_clicked,
        relevance_ratings={"positive": positive, "negative": negative},
        flagged_badges=flagged,
    )


# ============================================
# Badge Detail (must be last - catch-all path)
# ============================================

@router.get("/{badge_id}", response_model=BadgeResponse)
async def get_badge(
    badge_id: str,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Get a single badge by ID."""
    try:
        badge_uuid = UUID(badge_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid badge ID format")

    badge = db.query(BadgeCatalog).filter(BadgeCatalog.id == badge_uuid).first()

    if not badge:
        raise HTTPException(status_code=404, detail="Badge not found")

    return _badge_to_response(badge, relevance_score=1.0)
