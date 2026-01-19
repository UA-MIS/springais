from __future__ import annotations

import bcrypt
import pytest
from sqlalchemy.exc import IntegrityError

from app.models import UserProfile


def test_create_user(db_session):
    hashed = bcrypt.hashpw(b"password123", bcrypt.gensalt()).decode("utf-8")
    user = UserProfile(
        email="user-profile@example.com",
        hashed_password=hashed,
        full_name="User Profile",
        skills=["Python"],
        skill_assessment_scores={},
        onboarding_complete=True,
    )
    db_session.add(user)
    db_session.flush()

    assert user.id is not None
    assert user.email == "user-profile@example.com"


def test_password_hashing(db_session):
    hashed = bcrypt.hashpw(b"secret", bcrypt.gensalt()).decode("utf-8")
    user = UserProfile(
        email="hash-test@example.com",
        hashed_password=hashed,
        skills=[],
        skill_assessment_scores={},
    )
    db_session.add(user)
    db_session.flush()

    assert user.verify_password("secret") is True
    assert user.verify_password("wrong") is False


def test_unique_email_constraint(db_session):
    hashed = bcrypt.hashpw(b"pass", bcrypt.gensalt()).decode("utf-8")
    user1 = UserProfile(
        email="unique@example.com",
        hashed_password=hashed,
        skills=[],
        skill_assessment_scores={},
    )
    user2 = UserProfile(
        email="unique@example.com",
        hashed_password=hashed,
        skills=[],
        skill_assessment_scores={},
    )
    db_session.add(user1)
    db_session.flush()

    db_session.add(user2)
    with pytest.raises(IntegrityError):
        db_session.flush()
