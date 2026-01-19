from __future__ import annotations

import bcrypt

from app.models import CareerPath, UserProfile


def _create_user(db_session) -> UserProfile:
    hashed = bcrypt.hashpw(b"careerpass", bcrypt.gensalt()).decode("utf-8")
    user = UserProfile(
        email="career-path@example.com",
        hashed_password=hashed,
        skills=[],
        skill_assessment_scores={},
        onboarding_complete=True,
    )
    db_session.add(user)
    db_session.flush()
    return user


def test_create_career_path(db_session):
    user = _create_user(db_session)
    path = CareerPath(
        user_id=user.id,
        current_position_node_id="node-1",
        target_position_node_id="node-2",
        graph_data={"nodes": [], "edges": []},
        progression_status={"completed_steps": []},
    )
    db_session.add(path)
    db_session.flush()

    assert path.id is not None
    assert path.user_id == user.id


def test_update_progress(db_session):
    user = _create_user(db_session)
    path = CareerPath(
        user_id=user.id,
        graph_data={"nodes": [], "edges": []},
        progression_status={"completed_steps": []},
    )
    db_session.add(path)
    db_session.flush()

    path.update_progress("step-1")
    db_session.flush()

    assert "step-1" in path.progression_status.get("completed_steps", [])
    assert path.progression_status.get("current_step") == "step-1"


def test_one_to_one_relationship(db_session):
    user = _create_user(db_session)
    path = CareerPath(
        user_id=user.id,
        graph_data={"nodes": [], "edges": []},
        progression_status={"completed_steps": []},
    )
    db_session.add(path)
    db_session.flush()

    assert user.career_path is not None
    assert user.career_path.user_id == user.id
