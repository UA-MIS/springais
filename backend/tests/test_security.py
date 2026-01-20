import os

os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key")

from app.utils.security import (  # noqa: E402
    create_jwt_token,
    hash_password,
    verify_jwt_token,
    verify_password,
)


def test_hash_and_verify_password():
    password = "SecurePass123"
    hashed = hash_password(password)
    assert hashed != password
    assert verify_password(password, hashed)


def test_create_and_verify_jwt():
    token = create_jwt_token({"user_id": "test-user", "email": "test@example.com"})
    payload = verify_jwt_token(token)
    assert payload["user_id"] == "test-user"
