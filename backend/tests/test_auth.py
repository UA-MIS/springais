import os

os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key")

from datetime import datetime, timedelta, timezone  # noqa: E402
import jwt  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


client = TestClient(app)


def test_register_and_login_flow():
    register_payload = {
        "email": "auth_test@example.com",
        "password": "SecurePass123",
        "name": "Auth Tester",
    }
    register_response = client.post("/api/auth/register", json=register_payload)
    assert register_response.status_code == 200
    register_data = register_response.json()
    assert "token" in register_data
    assert register_data["user"]["email"] == register_payload["email"]

    login_payload = {
        "email": register_payload["email"],
        "password": register_payload["password"],
    }
    login_response = client.post("/api/auth/login", json=login_payload)
    assert login_response.status_code == 200
    login_data = login_response.json()
    assert "token" in login_data


def test_protected_route_requires_token():
    response = client.get("/api/skills/stats")
    assert response.status_code == 403 or response.status_code == 401


def test_protected_route_with_token():
    register_payload = {
        "email": "auth_token@example.com",
        "password": "SecurePass123",
        "name": "Token Tester",
    }
    register_response = client.post("/api/auth/register", json=register_payload)
    token = register_response.json()["token"]

    response = client.get("/api/skills/stats", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200


def test_protected_route_with_expired_token():
    secret = os.environ["JWT_SECRET_KEY"]
    expired_payload = {
        "user_id": "expired-user",
        "email": "expired@example.com",
        "exp": datetime.now(timezone.utc) - timedelta(seconds=1),
    }
    expired_token = jwt.encode(expired_payload, secret, algorithm="HS256")

    response = client.get(
        "/api/skills/stats",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert response.status_code in {401, 403}
