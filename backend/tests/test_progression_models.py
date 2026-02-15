"""Tests for gamification progression models.

Covers Stories 1.2, 1.3, 1.4: UserProgression, GamificationEvent, CoinTransaction.
"""

from __future__ import annotations

import os
import sys

import pytest
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from app.database import DATABASE_URL
from app.models import Base
from app.models.progression import CoinTransaction, GamificationEvent, UserProgression
from app.models.page_visit import UserPageVisit
from app.models.user_profile import UserProfile

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", DATABASE_URL)
engine = create_engine(TEST_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def _create_schema():
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture()
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = SessionLocal(bind=connection)
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


def _create_user(db, email="prog_test@test.com"):
    from app.utils.security import hash_password

    user = UserProfile(
        email=email,
        hashed_password=hash_password("TestPass123"),
        full_name="Test User",
        skills=[],
        skill_assessment_scores={},
    )
    db.add(user)
    db.flush()
    return user


# --- UserProgression Tests ---


class TestUserProgression:
    def test_create_with_defaults(self, db_session):
        user = _create_user(db_session, "prog_defaults@test.com")
        prog = UserProgression(user_id=user.id)
        db_session.add(prog)
        db_session.flush()

        assert prog.xp_total == 0
        assert prog.level == 1
        assert prog.coin_balance == 0
        assert prog.login_streak == 0
        assert prog.last_login_date is None
        assert prog.adventure_mode_enabled is False

    def test_unique_user_id_constraint(self, db_session):
        user = _create_user(db_session, "prog_unique@test.com")
        prog1 = UserProgression(user_id=user.id)
        db_session.add(prog1)
        db_session.flush()

        prog2 = UserProgression(user_id=user.id)
        db_session.add(prog2)
        with pytest.raises(IntegrityError):
            db_session.flush()
        db_session.rollback()

    def test_coin_balance_non_negative_check(self, db_session):
        user = _create_user(db_session, "prog_check1@test.com")
        prog = UserProgression(user_id=user.id, coin_balance=-1)
        db_session.add(prog)
        with pytest.raises(IntegrityError):
            db_session.flush()
        db_session.rollback()

    def test_xp_total_non_negative_check(self, db_session):
        user = _create_user(db_session, "prog_check2@test.com")
        prog = UserProgression(user_id=user.id, xp_total=-1)
        db_session.add(prog)
        with pytest.raises(IntegrityError):
            db_session.flush()
        db_session.rollback()

    def test_level_positive_check(self, db_session):
        user = _create_user(db_session, "prog_check3@test.com")
        prog = UserProgression(user_id=user.id, level=0)
        db_session.add(prog)
        with pytest.raises(IntegrityError):
            db_session.flush()
        db_session.rollback()


# --- GamificationEvent Tests ---


class TestGamificationEvent:
    def test_create_event(self, db_session):
        user = _create_user(db_session, "event_create@test.com")
        prog = UserProgression(user_id=user.id)
        db_session.add(prog)
        db_session.flush()

        event = GamificationEvent(
            user_id=user.id,
            event_type="module_completed",
            event_key="module:abc123",
            xp_awarded=50,
        )
        db_session.add(event)
        db_session.flush()

        assert event.id is not None
        assert event.xp_awarded == 50
        assert event.coins_awarded == 0

    def test_duplicate_event_key_raises(self, db_session):
        user = _create_user(db_session, "event_dup@test.com")
        prog = UserProgression(user_id=user.id)
        db_session.add(prog)
        db_session.flush()

        event1 = GamificationEvent(
            user_id=user.id,
            event_type="module_completed",
            event_key="module:same",
            xp_awarded=50,
        )
        db_session.add(event1)
        db_session.flush()

        event2 = GamificationEvent(
            user_id=user.id,
            event_type="module_completed",
            event_key="module:same",
            xp_awarded=50,
        )
        db_session.add(event2)
        with pytest.raises(IntegrityError):
            db_session.flush()
        db_session.rollback()

    def test_null_event_key_allows_duplicates(self, db_session):
        user = _create_user(db_session, "event_null@test.com")
        prog = UserProgression(user_id=user.id)
        db_session.add(prog)
        db_session.flush()

        event1 = GamificationEvent(
            user_id=user.id,
            event_type="daily_login",
            event_key=None,
            coins_awarded=10,
        )
        event2 = GamificationEvent(
            user_id=user.id,
            event_type="daily_login",
            event_key=None,
            coins_awarded=10,
        )
        db_session.add(event1)
        db_session.add(event2)
        db_session.flush()  # Should not raise


# --- CoinTransaction Tests ---


class TestCoinTransaction:
    def test_create_earned_transaction(self, db_session):
        user = _create_user(db_session, "txn_create@test.com")
        prog = UserProgression(user_id=user.id, coin_balance=100)
        db_session.add(prog)
        db_session.flush()

        txn = CoinTransaction(
            user_id=user.id,
            amount=50,
            balance_after=150,
            transaction_type="earned",
            source="daily_login",
        )
        db_session.add(txn)
        db_session.flush()

        assert txn.id is not None
        assert txn.amount == 50
        assert txn.balance_after == 150

    def test_balance_after_non_negative_check(self, db_session):
        user = _create_user(db_session, "txn_check1@test.com")
        prog = UserProgression(user_id=user.id)
        db_session.add(prog)
        db_session.flush()

        txn = CoinTransaction(
            user_id=user.id,
            amount=-100,
            balance_after=-50,
            transaction_type="spent",
            source="test",
        )
        db_session.add(txn)
        with pytest.raises(IntegrityError):
            db_session.flush()
        db_session.rollback()

    def test_invalid_transaction_type_check(self, db_session):
        user = _create_user(db_session, "txn_check2@test.com")
        prog = UserProgression(user_id=user.id)
        db_session.add(prog)
        db_session.flush()

        txn = CoinTransaction(
            user_id=user.id,
            amount=10,
            balance_after=10,
            transaction_type="invalid",
            source="test",
        )
        db_session.add(txn)
        with pytest.raises(IntegrityError):
            db_session.flush()
        db_session.rollback()


# --- UserPageVisit Tests ---


class TestUserPageVisit:
    def test_create_visit(self, db_session):
        user = _create_user(db_session, "visit_create@test.com")
        visit = UserPageVisit(
            user_id=user.id,
            page="/matches",
        )
        db_session.add(visit)
        db_session.flush()

        assert visit.visit_count == 1
        assert visit.page == "/matches"

    def test_unique_user_page_constraint(self, db_session):
        user = _create_user(db_session, "visit_unique@test.com")
        visit1 = UserPageVisit(user_id=user.id, page="/profile")
        db_session.add(visit1)
        db_session.flush()

        visit2 = UserPageVisit(user_id=user.id, page="/profile")
        db_session.add(visit2)
        with pytest.raises(IntegrityError):
            db_session.flush()
        db_session.rollback()
