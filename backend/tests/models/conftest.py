from __future__ import annotations

import os
import sys

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if os.path.isdir(os.path.join(ROOT_DIR, "app")):
    BACKEND_DIR = ROOT_DIR
elif os.path.isdir(os.path.join(ROOT_DIR, "backend")):
    BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
else:
    BACKEND_DIR = ROOT_DIR
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.database import DATABASE_URL  # noqa: E402
from app.models import Base  # noqa: E402

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", DATABASE_URL)

engine = create_engine(TEST_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def _create_schema():
    Base.metadata.create_all(bind=engine)
    yield
    if os.getenv("TEST_DATABASE_URL"):
        Base.metadata.drop_all(bind=engine)


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
