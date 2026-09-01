"""Shared fixtures for backend/tests.

WHY THIS FILE EXISTS
--------------------
`test_recommendation_service.py` asks for a `db_session` fixture that nothing at its
level provides, so both of its tests error at setup with:

    E       fixture 'db_session' not found

Every other DB-backed module in this directory defines its OWN module-level `db_session`,
so the fixture "obviously exists" when you grep for it — but pytest resolves fixtures from
the test's own module, then conftest files from its directory upward. A fixture defined in
a SIBLING module is not visible, and one defined in a SUBdirectory conftest
(backend/tests/models/conftest.py) is visible only downward. So this one file had no way
to see any of them.

Putting the shared fixture in the directory conftest — where pytest actually looks — is
the minimal correct fix. It is purely ADDITIVE: a fixture defined in a test module takes
precedence over one from conftest, so every existing module keeps its own definition and
behaves exactly as before. Only modules that define no `db_session` pick this one up.

The shape is copied from the established sibling pattern (test_quest_service.py,
test_store_service.py, ...): a real connection, a transaction opened before the test and
rolled back after, so tests do not leak rows into one another.
"""

import os

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import DATABASE_URL
from app.models.base import Base

# TEST_DATABASE_URL lets a developer point the suite at a throwaway database without
# touching DATABASE_URL (which the application itself reads). Same knob the sibling
# modules use.
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", DATABASE_URL)

_engine = create_engine(TEST_DATABASE_URL)
_SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)


@pytest.fixture(scope="session", autouse=True)
def _create_schema_for_shared_fixture(request):
    """Build the schema for the throwaway TEST database.

    ⚠ MUST NOT TOUCH THE DATABASE WHEN THERE ISN'T ONE. This fixture is `autouse` at
    DIRECTORY scope, so it fires for the first test collected from backend/tests —
    including the handful (test_security.py and friends) that need no database at all and
    are therefore deliberately NOT skipped by the root conftest's guard. Without the check
    below it connected unconditionally and turned those DB-free tests into 53
    `sqlalchemy.exc.OperationalError` errors, i.e. it re-created the exact CI failure the
    guard exists to remove. The flag is set once by the root conftest.py.

    NOTE the asymmetry with the application, which no longer calls create_all() at all
    (see the long comment in backend/app/main.py): there, Alembic owns the schema and
    create_all() actively broke fresh deployments by skipping the raw-SQL HNSW indexes and
    never stamping alembic_version. Here the target is a disposable test database that is
    dropped and recreated, nothing queries it through the ANN indexes, and no migration
    history is being tracked — so building tables straight from the models is the right
    tool. Do not "make these consistent" by reintroducing create_all() into the app.
    """
    if not getattr(request.config, "stash_springais_db", False):
        yield
        return
    Base.metadata.create_all(bind=_engine)
    yield


@pytest.fixture()
def db_session():
    connection = _engine.connect()
    transaction = connection.begin()
    session = _SessionLocal(bind=connection)
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()
