"""
Mock data for testing the matching engine.

This module provides mock employees, job postings, and skill embeddings
for testing Block E without requiring Block C database models.

In Block O (Integration), these will be replaced with real database queries.
"""

from typing import Dict, List, Optional
from dataclasses import dataclass, field
import numpy as np


@dataclass
class MockEmployee:
    """Mock employee for testing."""
    id: int
    name: str
    email: str
    current_role: str
    role_level: int
    service_line: str
    department: str
    location: str
    experience_years: int
    skills: List[str] = field(default_factory=list)
    skill_embeddings: Dict[str, List[float]] = field(default_factory=dict)


@dataclass
class MockJobPosting:
    """Mock job posting for testing."""
    id: int
    title: str
    description: str
    department: str
    service_line: str
    location: str
    role_level: int
    experience_years_min: int
    experience_years_max: int
    required_skills: List[str] = field(default_factory=list)
    preferred_skills: List[str] = field(default_factory=list)
    salary_range: Optional[str] = None
    skill_embeddings: Dict[str, List[float]] = field(default_factory=dict)


def _generate_mock_embedding(seed: int, dim: int = 1536) -> List[float]:
    """Generate a deterministic mock embedding for testing."""
    np.random.seed(seed)
    embedding = np.random.randn(dim)
    # Normalize to unit vector
    embedding = embedding / np.linalg.norm(embedding)
    return embedding.tolist()


# Precomputed skill embeddings (mock - in production these come from OpenAI)
# Using seed-based generation for reproducibility
MOCK_SKILL_EMBEDDINGS: Dict[str, List[float]] = {
    # Technical skills
    "Python": _generate_mock_embedding(1),
    "Java": _generate_mock_embedding(2),
    "JavaScript": _generate_mock_embedding(3),
    "SQL": _generate_mock_embedding(4),
    "AWS": _generate_mock_embedding(5),
    "Azure": _generate_mock_embedding(6),
    "GCP": _generate_mock_embedding(7),
    "Kubernetes": _generate_mock_embedding(8),
    "Docker": _generate_mock_embedding(9),
    "Terraform": _generate_mock_embedding(10),
    "Machine Learning": _generate_mock_embedding(11),
    "Data Analysis": _generate_mock_embedding(12),
    "Statistics": _generate_mock_embedding(13),
    "TensorFlow": _generate_mock_embedding(14),
    "PyTorch": _generate_mock_embedding(15),
    "R": _generate_mock_embedding(16),
    "Tableau": _generate_mock_embedding(17),
    "Power BI": _generate_mock_embedding(18),
    "ETL": _generate_mock_embedding(19),
    "Spark": _generate_mock_embedding(20),
    # Soft skills
    "Leadership": _generate_mock_embedding(21),
    "Communication": _generate_mock_embedding(22),
    "Project Management": _generate_mock_embedding(23),
    "Client Management": _generate_mock_embedding(24),
    "Strategic Planning": _generate_mock_embedding(25),
    "Team Building": _generate_mock_embedding(26),
    "Problem Solving": _generate_mock_embedding(27),
    "Presentation": _generate_mock_embedding(28),
    # Domain skills
    "Financial Modeling": _generate_mock_embedding(29),
    "Risk Assessment": _generate_mock_embedding(30),
    "Audit": _generate_mock_embedding(31),
    "Tax Planning": _generate_mock_embedding(32),
    "Consulting": _generate_mock_embedding(33),
    "Business Strategy": _generate_mock_embedding(34),
    "Product Strategy": _generate_mock_embedding(35),
    "Agile": _generate_mock_embedding(36),
    "Scrum": _generate_mock_embedding(37),
}


MOCK_EMPLOYEES: List[MockEmployee] = [
    MockEmployee(
        id=1,
        name="John Doe",
        email="john.doe@ey.com",
        current_role="Senior Consultant",
        role_level=5,
        service_line="Consulting",
        department="Technology",
        location="New York",
        experience_years=5,
        skills=["Python", "AWS", "Data Analysis", "Client Management", "SQL"],
        skill_embeddings={
            skill: MOCK_SKILL_EMBEDDINGS[skill]
            for skill in ["Python", "AWS", "Data Analysis", "Client Management", "SQL"]
        }
    ),
    MockEmployee(
        id=2,
        name="Jane Smith",
        email="jane.smith@ey.com",
        current_role="Manager",
        role_level=6,
        service_line="Consulting",
        department="Technology",
        location="San Francisco",
        experience_years=8,
        skills=["Python", "Machine Learning", "Leadership", "Project Management", "TensorFlow"],
        skill_embeddings={
            skill: MOCK_SKILL_EMBEDDINGS[skill]
            for skill in ["Python", "Machine Learning", "Leadership", "Project Management", "TensorFlow"]
        }
    ),
    MockEmployee(
        id=3,
        name="Bob Johnson",
        email="bob.johnson@ey.com",
        current_role="Consultant",
        role_level=4,
        service_line="Consulting",
        department="Advisory",
        location="Chicago",
        experience_years=3,
        skills=["Java", "AWS", "Docker", "Agile", "Communication"],
        skill_embeddings={
            skill: MOCK_SKILL_EMBEDDINGS[skill]
            for skill in ["Java", "AWS", "Docker", "Agile", "Communication"]
        }
    ),
    MockEmployee(
        id=4,
        name="Alice Williams",
        email="alice.williams@ey.com",
        current_role="Senior Associate",
        role_level=3,
        service_line="Assurance",
        department="Audit",
        location="Boston",
        experience_years=2,
        skills=["SQL", "Tableau", "Financial Modeling", "Audit", "Risk Assessment"],
        skill_embeddings={
            skill: MOCK_SKILL_EMBEDDINGS[skill]
            for skill in ["SQL", "Tableau", "Financial Modeling", "Audit", "Risk Assessment"]
        }
    ),
    MockEmployee(
        id=5,
        name="Charlie Brown",
        email="charlie.brown@ey.com",
        current_role="Associate",
        role_level=2,
        service_line="Tax",
        department="Tax Advisory",
        location="Los Angeles",
        experience_years=1,
        skills=["Tax Planning", "SQL", "Communication", "Problem Solving"],
        skill_embeddings={
            skill: MOCK_SKILL_EMBEDDINGS[skill]
            for skill in ["Tax Planning", "SQL", "Communication", "Problem Solving"]
        }
    ),
]


MOCK_JOB_POSTINGS: List[MockJobPosting] = [
    MockJobPosting(
        id=1,
        title="Data Engineer",
        description="We are seeking a Data Engineer to join our Technology Consulting team. "
                   "You will design and build data pipelines using Python and AWS services.",
        department="Technology",
        service_line="Consulting",
        location="New York",
        role_level=5,
        experience_years_min=3,
        experience_years_max=7,
        required_skills=["Python", "AWS", "SQL", "ETL"],
        preferred_skills=["Spark", "Kubernetes"],
        salary_range="$100,000 - $140,000",
        skill_embeddings={
            skill: MOCK_SKILL_EMBEDDINGS[skill]
            for skill in ["Python", "AWS", "SQL", "ETL", "Spark", "Kubernetes"]
            if skill in MOCK_SKILL_EMBEDDINGS
        }
    ),
    MockJobPosting(
        id=2,
        title="Senior Data Scientist",
        description="Join our AI/ML team as a Senior Data Scientist. You will build "
                   "machine learning models and work directly with clients.",
        department="Technology",
        service_line="Consulting",
        location="San Francisco",
        role_level=6,
        experience_years_min=5,
        experience_years_max=10,
        required_skills=["Python", "Machine Learning", "Statistics", "TensorFlow"],
        preferred_skills=["PyTorch", "Leadership"],
        salary_range="$140,000 - $180,000",
        skill_embeddings={
            skill: MOCK_SKILL_EMBEDDINGS[skill]
            for skill in ["Python", "Machine Learning", "Statistics", "TensorFlow", "PyTorch", "Leadership"]
            if skill in MOCK_SKILL_EMBEDDINGS
        }
    ),
    MockJobPosting(
        id=3,
        title="Cloud Architect",
        description="Design and implement cloud solutions for enterprise clients. "
                   "Multi-cloud experience required.",
        department="Technology",
        service_line="Consulting",
        location="Chicago",
        role_level=7,
        experience_years_min=7,
        experience_years_max=12,
        required_skills=["AWS", "Azure", "Kubernetes", "Terraform"],
        preferred_skills=["GCP", "Docker"],
        salary_range="$160,000 - $200,000",
        skill_embeddings={
            skill: MOCK_SKILL_EMBEDDINGS[skill]
            for skill in ["AWS", "Azure", "Kubernetes", "Terraform", "GCP", "Docker"]
            if skill in MOCK_SKILL_EMBEDDINGS
        }
    ),
    MockJobPosting(
        id=4,
        title="Product Manager - Data Platform",
        description="Lead product strategy for our internal data platform. "
                   "Work with engineering and business stakeholders.",
        department="Technology",
        service_line="Consulting",
        location="New York",
        role_level=6,
        experience_years_min=4,
        experience_years_max=8,
        required_skills=["Product Strategy", "SQL", "Data Analysis", "Leadership"],
        preferred_skills=["Agile", "Communication"],
        salary_range="$130,000 - $170,000",
        skill_embeddings={
            skill: MOCK_SKILL_EMBEDDINGS[skill]
            for skill in ["Product Strategy", "SQL", "Data Analysis", "Leadership", "Agile", "Communication"]
            if skill in MOCK_SKILL_EMBEDDINGS
        }
    ),
    MockJobPosting(
        id=5,
        title="Business Analyst",
        description="Analyze business processes and recommend improvements. "
                   "Work closely with clients to gather requirements.",
        department="Advisory",
        service_line="Consulting",
        location="Boston",
        role_level=4,
        experience_years_min=2,
        experience_years_max=5,
        required_skills=["SQL", "Data Analysis", "Communication", "Problem Solving"],
        preferred_skills=["Tableau", "Power BI"],
        salary_range="$80,000 - $110,000",
        skill_embeddings={
            skill: MOCK_SKILL_EMBEDDINGS[skill]
            for skill in ["SQL", "Data Analysis", "Communication", "Problem Solving", "Tableau", "Power BI"]
            if skill in MOCK_SKILL_EMBEDDINGS
        }
    ),
    MockJobPosting(
        id=6,
        title="Audit Manager",
        description="Lead audit engagements and manage client relationships. "
                   "Supervise junior staff and ensure quality deliverables.",
        department="Audit",
        service_line="Assurance",
        location="Boston",
        role_level=5,
        experience_years_min=4,
        experience_years_max=8,
        required_skills=["Audit", "Financial Modeling", "Leadership", "Risk Assessment"],
        preferred_skills=["SQL", "Communication"],
        salary_range="$110,000 - $150,000",
        skill_embeddings={
            skill: MOCK_SKILL_EMBEDDINGS[skill]
            for skill in ["Audit", "Financial Modeling", "Leadership", "Risk Assessment", "SQL", "Communication"]
            if skill in MOCK_SKILL_EMBEDDINGS
        }
    ),
    MockJobPosting(
        id=7,
        title="Tax Senior",
        description="Prepare and review tax returns for corporate clients. "
                   "Research tax issues and advise clients.",
        department="Tax Advisory",
        service_line="Tax",
        location="Los Angeles",
        role_level=3,
        experience_years_min=2,
        experience_years_max=4,
        required_skills=["Tax Planning", "Financial Modeling", "Communication"],
        preferred_skills=["SQL", "Problem Solving"],
        salary_range="$70,000 - $95,000",
        skill_embeddings={
            skill: MOCK_SKILL_EMBEDDINGS[skill]
            for skill in ["Tax Planning", "Financial Modeling", "Communication", "SQL", "Problem Solving"]
            if skill in MOCK_SKILL_EMBEDDINGS
        }
    ),
    MockJobPosting(
        id=8,
        title="DevOps Engineer",
        description="Build and maintain CI/CD pipelines. Implement infrastructure as code "
                   "and ensure system reliability.",
        department="Technology",
        service_line="Consulting",
        location="Seattle",
        role_level=5,
        experience_years_min=3,
        experience_years_max=6,
        required_skills=["AWS", "Docker", "Kubernetes", "Terraform"],
        preferred_skills=["Python", "Azure"],
        salary_range="$110,000 - $145,000",
        skill_embeddings={
            skill: MOCK_SKILL_EMBEDDINGS[skill]
            for skill in ["AWS", "Docker", "Kubernetes", "Terraform", "Python", "Azure"]
            if skill in MOCK_SKILL_EMBEDDINGS
        }
    ),
    MockJobPosting(
        id=9,
        title="Strategy Consultant",
        description="Advise C-suite executives on business strategy and transformation. "
                   "Lead high-impact client engagements.",
        department="Strategy",
        service_line="Consulting",
        location="New York",
        role_level=7,
        experience_years_min=8,
        experience_years_max=15,
        required_skills=["Business Strategy", "Leadership", "Strategic Planning", "Presentation"],
        preferred_skills=["Financial Modeling", "Client Management"],
        salary_range="$180,000 - $250,000",
        skill_embeddings={
            skill: MOCK_SKILL_EMBEDDINGS[skill]
            for skill in ["Business Strategy", "Leadership", "Strategic Planning", "Presentation",
                         "Financial Modeling", "Client Management"]
            if skill in MOCK_SKILL_EMBEDDINGS
        }
    ),
    MockJobPosting(
        id=10,
        title="Junior Data Analyst",
        description="Entry-level position for analyzing data and creating reports. "
                   "Great opportunity to learn and grow.",
        department="Advisory",
        service_line="Consulting",
        location="Austin",
        role_level=2,
        experience_years_min=0,
        experience_years_max=2,
        required_skills=["SQL", "Data Analysis"],
        preferred_skills=["Python", "Tableau"],
        salary_range="$60,000 - $75,000",
        skill_embeddings={
            skill: MOCK_SKILL_EMBEDDINGS[skill]
            for skill in ["SQL", "Data Analysis", "Python", "Tableau"]
            if skill in MOCK_SKILL_EMBEDDINGS
        }
    ),
]


def get_mock_employee(employee_id: int) -> Optional[MockEmployee]:
    """Get a mock employee by ID."""
    for emp in MOCK_EMPLOYEES:
        if emp.id == employee_id:
            return emp
    return None


def get_mock_job_posting(job_id: int) -> Optional[MockJobPosting]:
    """Get a mock job posting by ID."""
    for job in MOCK_JOB_POSTINGS:
        if job.id == job_id:
            return job
    return None


def get_mock_embedding(skill: str) -> Optional[List[float]]:
    """Get a mock embedding for a skill."""
    return MOCK_SKILL_EMBEDDINGS.get(skill)
