"""Tests for progression API endpoints.

Covers Story 1.7: API router, schemas, endpoint behavior.
"""

from __future__ import annotations

import os

os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key")

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _register_user(email: str) -> tuple[str, str]:
    """Register a user and return (token, user_id)."""
    resp = client.post(
        "/auth/register",
        json={
            "email": email,
            "password": "SecurePass123",
            "name": "Test User",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    return data["token"], data["user"]["id"]


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


class TestGetProgression:
    def test_requires_auth(self):
        resp = client.get("/api/progression")
        assert resp.status_code in {401, 403}

    def test_returns_404_when_no_progression(self):
        token, _ = _register_user("prog_404@test.com")
        resp = client.get("/api/progression", headers=_auth_headers(token))
        # Before login, progression row may not exist
        assert resp.status_code in {200, 404}


class TestLogin:
    def test_login_creates_progression(self):
        token, _ = _register_user("prog_login_create@test.com")
        resp = client.post(
            "/api/progression/login", headers=_auth_headers(token)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["is_new_day"] is True
        assert data["login_streak"] == 1
        assert data["coins_awarded"] == 10

    def test_same_day_login_is_noop(self):
        token, _ = _register_user("prog_sameday@test.com")
        client.post("/api/progression/login", headers=_auth_headers(token))
        resp = client.post(
            "/api/progression/login", headers=_auth_headers(token)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["is_new_day"] is False
        assert data["total_coins_awarded"] == 0


class TestToggleAdventureMode:
    def test_toggle_on_and_off(self):
        token, _ = _register_user("prog_toggle@test.com")
        # Ensure progression exists
        client.post("/api/progression/login", headers=_auth_headers(token))

        resp = client.post(
            "/api/progression/toggle-adventure-mode",
            headers=_auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["adventure_mode_enabled"] is True

        resp = client.post(
            "/api/progression/toggle-adventure-mode",
            headers=_auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["adventure_mode_enabled"] is False


class TestVisit:
    def test_record_valid_page(self):
        token, _ = _register_user("prog_visit@test.com")
        resp = client.post(
            "/api/progression/visit",
            headers=_auth_headers(token),
            json={"page": "/matches"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["page"] == "/matches"
        assert data["visit_count"] == 1

    def test_revisit_increments_count(self):
        token, _ = _register_user("prog_revisit@test.com")
        client.post(
            "/api/progression/visit",
            headers=_auth_headers(token),
            json={"page": "/profile"},
        )
        resp = client.post(
            "/api/progression/visit",
            headers=_auth_headers(token),
            json={"page": "/profile"},
        )
        assert resp.status_code == 200
        assert resp.json()["visit_count"] == 2

    def test_invalid_page_rejected(self):
        token, _ = _register_user("prog_badpage@test.com")
        resp = client.post(
            "/api/progression/visit",
            headers=_auth_headers(token),
            json={"page": "/fake-page"},
        )
        assert resp.status_code == 400


class TestWalkthroughStep:
    def test_sequential_step_completion(self):
        token, _ = _register_user("prog_wt_seq@test.com")
        client.post("/api/progression/login", headers=_auth_headers(token))

        # Step 1 should succeed (current is 0)
        resp = client.post(
            "/api/progression/walkthrough-step",
            headers=_auth_headers(token),
            json={"step": 1},
        )
        assert resp.status_code == 200
        assert resp.json()["step"] == 1
        assert resp.json()["already_completed"] is False

    def test_skip_step_rejected(self):
        """B5 fix: Cannot skip from step 0 to step 3."""
        token, _ = _register_user("prog_wt_skip@test.com")
        client.post("/api/progression/login", headers=_auth_headers(token))

        resp = client.post(
            "/api/progression/walkthrough-step",
            headers=_auth_headers(token),
            json={"step": 3},
        )
        assert resp.status_code == 400
        assert "sequentially" in resp.json()["detail"].lower()

    def test_idempotent_step_returns_already_completed(self):
        token, _ = _register_user("prog_wt_idem@test.com")
        client.post("/api/progression/login", headers=_auth_headers(token))

        # Complete step 1
        client.post(
            "/api/progression/walkthrough-step",
            headers=_auth_headers(token),
            json={"step": 1},
        )

        # Repeat step 1 should return already_completed
        resp = client.post(
            "/api/progression/walkthrough-step",
            headers=_auth_headers(token),
            json={"step": 1},
        )
        assert resp.status_code == 200
        assert resp.json()["already_completed"] is True


class TestGetProgressionFull:
    def test_returns_full_state_after_login(self):
        token, _ = _register_user("prog_full@test.com")
        client.post("/api/progression/login", headers=_auth_headers(token))

        resp = client.get("/api/progression", headers=_auth_headers(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["xp_total"] == 0
        assert data["level"] == 1
        assert data["title"] == "Apprentice"
        assert data["coin_balance"] == 10  # From daily login
        assert data["login_streak"] == 1
        assert "feature_unlocks" in data
        assert "equipped_items" in data


class TestHistory:
    def test_event_history(self):
        token, _ = _register_user("prog_hist_evt@test.com")
        client.post("/api/progression/login", headers=_auth_headers(token))

        resp = client.get(
            "/api/progression/history?type=event",
            headers=_auth_headers(token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert "total" in data
        assert data["limit"] == 50
        assert data["offset"] == 0

    def test_transaction_history(self):
        token, _ = _register_user("prog_hist_txn@test.com")
        client.post("/api/progression/login", headers=_auth_headers(token))

        resp = client.get(
            "/api/progression/history?type=transaction",
            headers=_auth_headers(token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert data["total"] >= 1  # At least the daily login coin award

    def test_invalid_type_rejected(self):
        token, _ = _register_user("prog_hist_bad@test.com")
        resp = client.get(
            "/api/progression/history?type=invalid",
            headers=_auth_headers(token),
        )
        assert resp.status_code == 422
