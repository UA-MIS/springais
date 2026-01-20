import asyncio
import os
from uuid import uuid4

os.environ.setdefault("OPENAI_API_KEY", "")

from app.models.career_path import CareerPath  # noqa: E402
from app.models.job_posting import JobPosting  # noqa: E402
from app.models.match import Match  # noqa: E402
from app.models.user_profile import UserProfile  # noqa: E402
from app.services.recommendation_service import SkillRecommendationService  # noqa: E402


def test_recommendations_aggregate_from_matches(db_session):
    user = UserProfile(
        email="rec_user@example.com",
        hashed_password="hashed",
        full_name="Rec User",
        skills=["SQL"],
        skill_assessment_scores={},
        onboarding_complete=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    match_one = Match(
        employee_id="EMP001",
        job_posting_id="JOB001",
        user_id=user.id,
        match_mode="best_fit",
        overall_score=0.8,
        skill_match_score=0.7,
        experience_score=0.9,
        growth_potential_score=0.75,
        skill_gaps=["Python", "AWS"],
        matched_skills=["SQL"],
    )
    match_two = Match(
        employee_id="EMP001",
        job_posting_id="JOB002",
        user_id=user.id,
        match_mode="best_fit",
        overall_score=0.75,
        skill_match_score=0.65,
        experience_score=0.85,
        growth_potential_score=0.8,
        skill_gaps=["Python", "Leadership"],
        matched_skills=["SQL"],
    )
    db_session.add_all([match_one, match_two])
    db_session.commit()

    service = SkillRecommendationService(db_session)
    recs = asyncio.run(service.compute_recommendations(user.id))
    skill_names = {rec.skill_name for rec in recs}
    assert "Python" in skill_names
    assert "AWS" in skill_names or "Leadership" in skill_names


def test_recommendations_from_career_goal(db_session):
    user = UserProfile(
        email="career_user@example.com",
        hashed_password="hashed",
        full_name="Career User",
        skills=[],
        skill_assessment_scores={},
        onboarding_complete=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    job = JobPosting(
        id="data_scientist",
        external_id=str(uuid4()),
        title="Data Scientist",
        service_line="Advisory",
        location="Remote",
        description="Test role",
        required_skills=["Python", "SQL"],
        preferred_skills=["Leadership"],
        tags=[],
        experience_years_min=2,
        experience_years_max=5,
    )
    db_session.add(job)

    career_path = CareerPath(
        user_id=user.id,
        target_position_node_id="data_scientist",
        graph_data={},
        progression_status={},
    )
    db_session.add(career_path)
    db_session.commit()

    service = SkillRecommendationService(db_session)
    recs = asyncio.run(service.compute_recommendations(user.id))
    skill_names = {rec.skill_name for rec in recs}
    assert "Python" in skill_names
    assert "SQL" in skill_names
