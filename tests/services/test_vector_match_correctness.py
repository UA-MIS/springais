"""
Regression tests for the silent-failure family in the vector matching path.

Every test here pins behaviour that used to fail *quietly*: an error converted
into a plausible-looking value with nothing logged. The assertions are as much
about the log record and the query count as about the return value, because the
return value alone was never the part that looked wrong.

Covers:
  1. matching_service._pgvector_batch_match / _pgvector_best_match
     - a failed vector query is LOUD and distinguishable from "no match"
  2. embedding_service._apply_pca
     - a missing PCA model raises instead of emitting a wrong-width vector
  3. embedding_service cache keys
     - keys are namespaced by embedding model + PCA version
  4. the N+1 -> LATERAL rewrite
     - N skills cost ONE query, not N
"""

import logging
import sys
import os
from unittest.mock import MagicMock, patch

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from app.services.matching_service import MatchingService, HNSW_EF_SEARCH
from app.services.embedding_service import (
    EmbeddingService,
    PCAUnavailableError,
    EMBEDDING_MODEL,
    PCA_EMBEDDING_DIMENSIONS,
    RAW_EMBEDDING_DIMENSIONS,
)


def _service_with_db(db):
    """MatchingService wired to a given (mock) session and a user profile."""
    profile = MagicMock()
    profile.id = "11111111-1111-1111-1111-111111111111"
    return MatchingService(db=db, user_profile=profile)


def _row(skill_key, skill_text, similarity):
    row = MagicMock()
    row.skill_key = skill_key
    row.skill_text = skill_text
    row.similarity = similarity
    return row


# =====================================================================
# 1. A failed vector query must be loud, and must NOT look like 0.0
# =====================================================================

class TestVectorQueryFailureIsLoud:

    def test_batch_match_returns_none_on_db_error(self):
        """A database error yields None (unknown), never a 0.0 similarity."""
        db = MagicMock()
        db.execute.side_effect = RuntimeError("connection refused")

        service = _service_with_db(db)
        result = service._pgvector_batch_match({"Python": [0.1] * 8}, "user-1")

        assert result is None, (
            "A failed query must be distinguishable from a successful query "
            "that found nothing. Returning {} or 0.0 is the original bug."
        )

    def test_batch_match_logs_at_error_level_with_traceback(self, caplog):
        """The failure is logged at ERROR (not debug) and carries the exception."""
        db = MagicMock()
        db.execute.side_effect = RuntimeError("connection refused")
        service = _service_with_db(db)

        with caplog.at_level(logging.ERROR):
            service._pgvector_batch_match({"Python": [0.1] * 8}, "user-1")

        errors = [r for r in caplog.records if r.levelno >= logging.ERROR]
        assert errors, "a hard DB error produced no ERROR log record"

        rec = errors[0]
        assert "connection refused" in rec.getMessage()
        assert rec.exc_info is not None, "exception not attached to the log record"

    def test_failure_is_not_logged_below_warning(self, caplog):
        """
        Guards the specific regression: logger.debug is below production log
        level, so the original code produced ZERO records in any real
        deployment.
        """
        db = MagicMock()
        db.execute.side_effect = RuntimeError("boom")
        service = _service_with_db(db)

        with caplog.at_level(logging.WARNING):
            service._pgvector_batch_match({"Python": [0.1] * 8}, "user-1")

        assert caplog.records, (
            "nothing was logged at WARNING or above; the failure would be "
            "invisible in production"
        )

    def test_best_match_propagates_failure_as_none(self):
        db = MagicMock()
        db.execute.side_effect = RuntimeError("boom")
        service = _service_with_db(db)

        assert service._pgvector_best_match([0.1] * 8, "user-1") is None

    def test_failure_increments_degradation_counter(self):
        db = MagicMock()
        db.execute.side_effect = RuntimeError("boom")
        service = _service_with_db(db)

        assert service._vector_query_failures == 0
        service._pgvector_batch_match({"Python": [0.1] * 8}, "user-1")
        assert service._vector_query_failures == 1

    def test_genuine_no_match_is_zero_not_none(self):
        """
        The other half of the distinction: when the query SUCCEEDS but the user
        has no skills, we get 0.0 - and no error is logged.
        """
        db = MagicMock()
        db.execute.return_value.fetchall.return_value = [_row("Python", None, None)]
        service = _service_with_db(db)

        result = service._pgvector_batch_match({"Python": [0.1] * 8}, "user-1")

        assert result == {"Python": (0.0, None)}
        assert service._vector_query_failures == 0


# =====================================================================
# 2. N+1 -> LATERAL: N skills must cost exactly ONE query
# =====================================================================

class TestBatchIsASingleQuery:

    def _select_calls(self, db):
        """Executed statements that are real SELECTs, excluding SET LOCAL."""
        calls = []
        for c in db.execute.call_args_list:
            sql = str(c.args[0]) if c.args else ""
            if "SET LOCAL" in sql.upper():
                continue
            calls.append(sql)
        return calls

    def test_ten_skills_issue_one_select(self):
        db = MagicMock()
        skills = {f"skill-{i}": [0.1] * 8 for i in range(10)}
        db.execute.return_value.fetchall.return_value = [
            _row(k, "Python", 0.9) for k in skills
        ]
        service = _service_with_db(db)

        service._pgvector_batch_match(skills, "user-1")

        selects = self._select_calls(db)
        assert len(selects) == 1, (
            f"expected 1 SELECT for 10 skills, got {len(selects)}. "
            "This is the N+1 the docstring always claimed was fixed."
        )

    def test_query_actually_uses_lateral_join(self):
        """The docstring claims LATERAL; assert the SQL really contains it."""
        db = MagicMock()
        db.execute.return_value.fetchall.return_value = []
        service = _service_with_db(db)

        service._pgvector_batch_match({"a": [0.1] * 8, "b": [0.2] * 8}, "user-1")

        sql = self._select_calls(db)[0].upper()
        assert "LATERAL" in sql
        assert "VALUES" in sql

    def test_ef_search_is_set_before_the_query(self):
        """hnsw.ef_search was never set anywhere in the repo before this fix."""
        db = MagicMock()
        db.execute.return_value.fetchall.return_value = []
        service = _service_with_db(db)

        service._pgvector_batch_match({"a": [0.1] * 8}, "user-1")

        statements = [str(c.args[0]) for c in db.execute.call_args_list if c.args]
        set_stmts = [s for s in statements if "ef_search" in s]
        assert set_stmts, "hnsw.ef_search was never set"
        assert str(HNSW_EF_SEARCH) in set_stmts[0]
        assert "SET LOCAL" in set_stmts[0].upper(), (
            "must be SET LOCAL so it cannot leak across pooled connections"
        )

    def test_every_requested_skill_appears_in_result(self):
        """A short result set must never silently drop a skill."""
        db = MagicMock()
        # DB returns a row for only one of the three requested skills.
        db.execute.return_value.fetchall.return_value = [_row("b", "Python", 0.8)]
        service = _service_with_db(db)

        result = service._pgvector_batch_match(
            {"a": [0.1] * 8, "b": [0.2] * 8, "c": [0.3] * 8}, "user-1"
        )

        assert set(result) == {"a", "b", "c"}
        assert result["a"] == (0.0, None)
        assert result["b"] == (0.8, "Python")
        assert result["c"] == (0.0, None)


# =====================================================================
# 3. PCA must fail loudly rather than emit a wrong-width vector
# =====================================================================

class TestPCAFailsLoudly:

    @pytest.fixture
    def service_without_pca(self, mock_openai_client, redis_client, mock_db_session):
        with patch(
            'app.services.embedding_service.load_pca_model_safe',
            return_value=None,
        ):
            return EmbeddingService(
                openai_client=mock_openai_client,
                redis_client=redis_client,
                db_session=mock_db_session,
            )

    def test_apply_pca_raises_when_model_missing(self, service_without_pca):
        """
        Previously returned the raw 3072-dim vector, which is in a DIFFERENT
        space from every 1536-dim vector already indexed - so matching compared
        incomparable vectors and reported confident scores.
        """
        assert service_without_pca.pca is None

        with pytest.raises(PCAUnavailableError):
            service_without_pca._apply_pca([0.1] * RAW_EMBEDDING_DIMENSIONS)

    def test_missing_pca_logs_at_error_on_construction(
        self, mock_openai_client, redis_client, mock_db_session, caplog
    ):
        with caplog.at_level(logging.ERROR):
            with patch(
                'app.services.embedding_service.load_pca_model_safe',
                return_value=None,
            ):
                EmbeddingService(
                    openai_client=mock_openai_client,
                    redis_client=redis_client,
                    db_session=mock_db_session,
                )

        assert any(r.levelno >= logging.ERROR for r in caplog.records), (
            "a missing PCA model was only ever announced via print()"
        )

    def test_apply_pca_still_reduces_normally_when_loaded(self, embedding_service):
        reduced = embedding_service._apply_pca([0.1] * RAW_EMBEDDING_DIMENSIONS)
        assert len(reduced) == PCA_EMBEDDING_DIMENSIONS


# =====================================================================
# 4. Cache keys must be namespaced by embedding model + PCA version
# =====================================================================

class TestCacheKeyNamespacing:

    def test_key_contains_model_and_pca_version(self, embedding_service):
        key = embedding_service._exact_match_cache_key("Python Programming")

        assert EMBEDDING_MODEL in key, "embedding model missing from cache key"
        assert "pca-v1" in key, "PCA version missing from cache key"

    def test_key_changes_when_pca_version_changes(self, embedding_service):
        """
        The whole point: retraining PCA must MISS the cache, not serve 30 days
        of vectors from an incompatible space.
        """
        before = embedding_service._exact_match_cache_key("Python Programming")

        embedding_service.pca_metadata.version = "v2"
        embedding_service._cache_namespace = f"{EMBEDDING_MODEL}:pca-v2"
        after = embedding_service._exact_match_cache_key("Python Programming")

        assert before != after

    @pytest.mark.asyncio
    async def test_wrong_width_cached_vector_is_rejected(self, embedding_service):
        """Defence in depth: a wrong-width cached vector is treated as a miss."""
        import json

        key = embedding_service._exact_match_cache_key("Python Programming")
        await embedding_service.redis.set(
            key,
            json.dumps({"embedding": [0.1] * RAW_EMBEDDING_DIMENSIONS}),
        )

        got = await embedding_service._get_exact_match_cache("Python Programming")
        assert got is None, "a 3072-dim cached vector must not be served as 1536-dim"

    @pytest.mark.asyncio
    async def test_round_trip_still_works(self, embedding_service):
        vec = [0.01] * PCA_EMBEDDING_DIMENSIONS
        await embedding_service._save_exact_match_cache("Python Programming", vec)
        got = await embedding_service._get_exact_match_cache("Python Programming")
        assert got == vec

    @pytest.mark.asyncio
    async def test_refuses_to_cache_wrong_width_vector(self, embedding_service):
        await embedding_service._save_exact_match_cache(
            "Bad Skill", [0.1] * RAW_EMBEDDING_DIMENSIONS
        )
        key = embedding_service._exact_match_cache_key("Bad Skill")
        assert await embedding_service.redis.get(key) is None
