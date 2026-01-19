from __future__ import annotations

from sqlalchemy import select

from app.models import Employee, PerformanceMetrics


def test_employee_crud(db_session):
    employee = Employee(
        id="EMP-TEST-001",
        service_line="Consulting",
        current_role="Manager",
        role_level=6,
        years_experience=8.0,
        skills=["Strategy", "AWS"],
        performance_metrics={
            "utilization": 82,
            "billing_rate": 250,
            "realization": 90,
            "quality_score": 4.5,
            "training_hours": 40,
            "client_feedback": 4.7,
        },
        feedback_themes=["Leadership", "Client focus"],
        notable_achievement="Led cloud transformation program.",
    )
    db_session.add(employee)
    db_session.flush()

    found = db_session.execute(
        select(Employee).where(Employee.id == "EMP-TEST-001")
    ).scalar_one()
    assert found.current_role == "Manager"

    found.current_role = "Senior Manager"
    db_session.flush()

    updated = db_session.execute(
        select(Employee).where(Employee.id == "EMP-TEST-001")
    ).scalar_one()
    assert updated.current_role == "Senior Manager"

    db_session.delete(updated)
    db_session.flush()

    remaining = db_session.execute(
        select(Employee).where(Employee.id == "EMP-TEST-001")
    ).scalars().all()
    assert remaining == []


def test_employee_metrics_property(db_session):
    employee = Employee(
        id="EMP-TEST-002",
        service_line="Tax",
        current_role="Senior",
        role_level=4,
        years_experience=5.0,
        skills=["Tax", "Excel"],
        performance_metrics={
            "utilization": 75,
            "billing_rate": 180,
            "realization": 88,
            "quality_score": 4.2,
            "training_hours": 20,
            "client_feedback": 4.3,
        },
        feedback_themes=["Detail oriented"],
    )
    db_session.add(employee)
    db_session.flush()

    metrics = employee.metrics
    assert isinstance(metrics, PerformanceMetrics)
    assert metrics.utilization == 75


def test_employee_skills_gin_query(db_session):
    employee = Employee(
        id="EMP-TEST-003",
        service_line="Assurance",
        current_role="Analyst",
        role_level=2,
        years_experience=2.0,
        skills=["SQL", "Python"],
        feedback_themes=[],
    )
    db_session.add(employee)
    db_session.flush()

    results = db_session.execute(
        select(Employee).where(Employee.skills.contains(["Python"]))
    ).scalars().all()
    assert any(item.id == "EMP-TEST-003" for item in results)
