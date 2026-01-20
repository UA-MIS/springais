import os

os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key")
os.environ.setdefault("OPENAI_API_KEY", "")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


client = TestClient(app)


def _register_user(email: str):
    payload = {
        "email": email,
        "password": "SecurePass123",
        "name": "Rec User",
    }
    response = client.post("/auth/register", json=payload)
    return response.json()["token"]


def test_recommendations_endpoint():
    token = _register_user("rec_endpoint@example.com")
    response = client.get(
        "/api/skills/recommendations",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "recommendations" in data

    if data["recommendations"]:
        skill_name = data["recommendations"][0]["skill"]
        patch_response = client.patch(
            f"/api/skills/recommendations/{skill_name}/status",
            headers={"Authorization": f"Bearer {token}"},
            json={"status": "in_progress"},
        )
        assert patch_response.status_code == 200
