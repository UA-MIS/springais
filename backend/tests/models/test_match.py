from __future__ import annotations

import bcrypt
from sqlalchemy import select

from app.models import Employee, JobPosting, Match, UserProfile


def _create_employee(db_session) -> Employee:
    employee = Employee(
        id="EMP-MATCH-001",
        service_line="Consulting",
        current_role="Manager",
        role_level=6,
        years_experience=8.0,
        skills=["Strategy", "AWS"],
        feedback_themes=["Leadership"],
    )
    db_session.add(employee)
    return employee


def _create_job_posting(db_session) -> JobPosting:
    job = JobPosting(
        id="JOB-MATCH-001",
        external_id="EY-123456",
        title="Senior Manager - Cloud Consulting",
        service_line="Consulting",
        location="New York, NY",
        description="Lead cloud transformation projects.",
        required_skills=["AWS", "Strategy"],
        preferred_skills=["Leadership"],
        experience_years_min=7,
        experience_years_max=12,
    )
    db_session.add(job)
    return job


def _create_user(db_session) -> UserProfile:
    hashed = bcrypt.hashpw(b"password123", bcrypt.gensalt()).decode("utf-8")
    user = UserProfile(
        email="match-user@example.com",
        hashed_password=hashed,
        full_name="Match User",
        skills=["AWS"],
        skill_assessment_scores={},
        onboarding_complete=True,
    )
    db_session.add(user)
    return user


def test_match_relationships(db_session):
    employee = _create_employee(db_session)
    job = _create_job_posting(db_session)
    user = _create_user(db_session)

    match = Match(
        employee=employee,
        job_posting=job,
        user_profile=user,
        match_mode="best_fit",
        overall_score=0.92,
        skill_match_score=0.9,
        experience_score=0.95,
        growth_potential_score=0.88,
        skill_gaps=["Azure"],
        matched_skills=["AWS", "Strategy"],
    )
    db_session.add(match)
    db_session.flush()

    assert match.employee.service_line == "Consulting"
    assert match.job_posting.title.startswith("Senior Manager")
    assert match.user_profile.email == "match-user@example.com"


def test_match_composite_order_query(db_session):
    employee = _create_employee(db_session)
    job = _create_job_posting(db_session)
    user = _create_user(db_session)

    db_session.add_all(
        [
            Match(
                employee=employee,
                job_posting=job,
                user_profile=user,
                match_mode="best_fit",
                overall_score=0.9,
                skill_match_score=0.85,
                experience_score=0.9,
                growth_potential_score=0.9,
                skill_gaps=[],
                matched_skills=[],
            ),
            Match(
                employee=employee,
                job_posting=job,
                user_profile=user,
                match_mode="best_fit",
                overall_score=0.95,
                skill_match_score=0.88,
                experience_score=0.92,
                growth_potential_score=0.93,
                skill_gaps=[],
                matched_skills=[],
            ),
        ]
    )
    db_session.flush()

    results = db_session.execute(
        select(Match)
        .where(Match.user_id == user.id)
        .order_by(Match.overall_score.desc())
        .limit(10)
    ).scalars().all()
    assert results[0].overall_score >= results[1].overall_score


def test_match_cascade_delete(db_session):
    employee = _create_employee(db_session)
    job = _create_job_posting(db_session)
    user = _create_user(db_session)

    match = Match(
        employee=employee,
        job_posting=job,
        user_profile=user,
        match_mode="best_fit",
        overall_score=0.9,
        skill_match_score=0.85,
        experience_score=0.9,
        growth_potential_score=0.9,
        skill_gaps=[],
        matched_skills=[],
    )
    db_session.add(match)
    db_session.flush()

    db_session.delete(employee)
    db_session.flush()

    remaining = db_session.execute(
        select(Match).where(Match.employee_id == "EMP-MATCH-001")
    ).scalars().all()
    assert remaining == []
