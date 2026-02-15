"""
Authentication API routes.

Endpoints:
- POST /auth/register
- POST /auth/login
- GET /auth/me
"""

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user_profile import UserProfile
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserResponse
from app.utils.security import (
    create_jwt_token,
    get_current_user_from_token,
    hash_password,
    verify_password,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
    existing = db.query(UserProfile).filter(UserProfile.email == request.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = UserProfile(
        email=request.email,
        hashed_password=hash_password(request.password),
        full_name=request.name,
        skills=[],
        skill_assessment_scores={},
        onboarding_complete=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create progression row on registration (Story 5.4)
    try:
        from app.services.progression_service import progression_service
        progression_service.ensure_progression_exists(db, user.id)
        db.commit()
    except Exception:
        logger.exception("Failed to create progression for user %s", user.id)

    token = create_jwt_token({"user_id": str(user.id), "email": user.email})
    return AuthResponse(
        token=token,
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            name=user.full_name or "",
            role=user.current_role,
            account_type=user.account_type,
        ),
    )


@router.post("/login", response_model=AuthResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = db.query(UserProfile).filter(UserProfile.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    user.last_login_at = datetime.utcnow()
    db.commit()

    token = create_jwt_token({"user_id": str(user.id), "email": user.email})
    return AuthResponse(
        token=token,
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            name=user.full_name or "",
            role=user.current_role,
            account_type=user.account_type,
        ),
    )


@router.get("/me", response_model=UserResponse)
def get_current_user(current_user: UserProfile = Depends(get_current_user_from_token)) -> UserResponse:
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        name=current_user.full_name or "",
        role=current_user.current_role,
        account_type=current_user.account_type,
    )
