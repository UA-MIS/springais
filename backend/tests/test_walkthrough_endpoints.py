"""Tests for walkthrough-related endpoints (Story 2.5).

Covers:
- POST /api/progression/walkthrough-step -- idempotent step persistence + rewards
- POST /api/progression/complete-onboarding -- sets all completion flags
- GET /api/progression -- includes walkthrough_step, walkthrough_completed, onboarding_complete
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


def _ensure_progression(token: str) -> None:
    """Create a progression row by calling login."""
    client.post("/api/progression/login", headers=_auth_headers(token))


class TestWalkthroughStep:
    def test_requires_auth(self):
        resp = client.post("/api/progression/walkthrough-step", json={"step": 1})
        assert resp.status_code in {401, 403}

    def test_records_step_with_reward(self):
        token, _ = _register_user("wt_step_reward@test.com")
        _ensure_progression(token)
        resp = client.post(
            "/api/progression/walkthrough-step",
            headers=_auth_headers(token),
            json={"step": 1},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["step"] == 1
        assert data["already_completed"] is False
        assert data["reward"]["xp_awarded"] == 50
        assert data["reward"]["coins_awarded"] == 25

    def test_idempotent_same_step(self):
        token, _ = _register_user("wt_step_idem@test.com")
        _ensure_progression(token)
        client.post(
            "/api/progression/walkthrough-step",
            headers=_auth_headers(token),
            json={"step": 1},
        )
        resp = client.post(
            "/api/progression/walkthrough-step",
            headers=_auth_headers(token),
            json={"step": 1},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["already_completed"] is True

    def test_idempotent_lower_step(self):
        token, _ = _register_user("wt_step_lower@test.com")
        _ensure_progression(token)
        client.post(
            "/api/progression/walkthrough-step",
            headers=_auth_headers(token),
            json={"step": 3},
        )
        resp = client.post(
            "/api/progression/walkthrough-step",
            headers=_auth_headers(token),
            json={"step": 2},
        )
        assert resp.status_code == 200
        assert resp.json()["already_completed"] is True

    def test_advances_step_forward(self):
        token, _ = _register_user("wt_step_advance@test.com")
        _ensure_progression(token)
        client.post(
            "/api/progression/walkthrough-step",
            headers=_auth_headers(token),
            json={"step": 1},
        )
        resp = client.post(
            "/api/progression/walkthrough-step",
            headers=_auth_headers(token),
            json={"step": 3},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["step"] == 3
        assert data["already_completed"] is False

    def test_invalid_step_rejected(self):
        token, _ = _register_user("wt_step_invalid@test.com")
        _ensure_progression(token)
        resp = client.post(
            "/api/progression/walkthrough-step",
            headers=_auth_headers(token),
            json={"step": 99},
        )
        assert resp.status_code == 422

    def test_negative_step_rejected(self):
        token, _ = _register_user("wt_step_neg@test.com")
        _ensure_progression(token)
        resp = client.post(
            "/api/progression/walkthrough-step",
            headers=_auth_headers(token),
            json={"step": -1},
        )
        assert resp.status_code == 422


class TestCompleteOnboarding:
    def test_requires_auth(self):
        resp = client.post("/api/progression/complete-onboarding")
        assert resp.status_code in {401, 403}

    def test_sets_completion_flags(self):
        token, _ = _register_user("wt_complete@test.com")
        _ensure_progression(token)
        resp = client.post(
            "/api/progression/complete-onboarding",
            headers=_auth_headers(token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["onboarding_complete"] is True
        assert data["walkthrough_completed"] is True

    def test_progression_reflects_completion(self):
        token, _ = _register_user("wt_complete_prog@test.com")
        _ensure_progression(token)
        client.post(
            "/api/progression/complete-onboarding",
            headers=_auth_headers(token),
        )
        resp = client.get("/api/progression", headers=_auth_headers(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["walkthrough_step"] == 7
        assert data["walkthrough_completed"] is True
        assert data["onboarding_complete"] is True

    def test_idempotent_call(self):
        token, _ = _register_user("wt_complete_idem@test.com")
        _ensure_progression(token)
        client.post(
            "/api/progression/complete-onboarding",
            headers=_auth_headers(token),
        )
        resp = client.post(
            "/api/progression/complete-onboarding",
            headers=_auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["onboarding_complete"] is True


class TestProgressionIncludesWalkthroughFields:
    def test_default_walkthrough_fields(self):
        token, _ = _register_user("wt_fields_default@test.com")
        _ensure_progression(token)
        resp = client.get("/api/progression", headers=_auth_headers(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["walkthrough_step"] == 0
        assert data["walkthrough_completed"] is False
        assert "onboarding_complete" in data

    def test_walkthrough_step_persisted_in_progression(self):
        token, _ = _register_user("wt_fields_step@test.com")
        _ensure_progression(token)
        client.post(
            "/api/progression/walkthrough-step",
            headers=_auth_headers(token),
            json={"step": 4},
        )
        resp = client.get("/api/progression", headers=_auth_headers(token))
        assert resp.status_code == 200
        assert resp.json()["walkthrough_step"] == 4
