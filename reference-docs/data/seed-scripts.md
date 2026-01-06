# SpringAIS Database Seeding

**Last Updated:** 2026-01-06
**Purpose:** Database seeding scripts for development and testing

---

## Overview

Database seeding populates the database with:
1. **Role hierarchy** (25 roles across Assurance, Tax, Consulting)
2. **Synthetic employees** (900 employees)
3. **Job postings** (30-50 scraped jobs)
4. **Skills and embeddings** (for matching)
5. **Career transitions** (5,000 transitions for success patterns)

---

## Quick Start

```bash
# Run all seeds in order
cd backend
python scripts/seed_database.py

# Or run individually
python scripts/seed_roles.py
python scripts/generate_synthetic_employees.py
python scripts/scrape_job_postings.py
python scripts/generate_embeddings.py
```

---

## Seed Scripts

### 1. seed_roles.py

**Purpose:** Create role hierarchy for Assurance, Tax, Consulting

```python
# backend/scripts/seed_roles.py
from app.database import SessionLocal
from app.models import Role

roles = [
    # Consulting (9 levels)
    {"title": "Analyst", "service_line": "Consulting", "level": 1},
    {"title": "Associate", "service_line": "Consulting", "level": 2},
    {"title": "Senior Associate", "service_line": "Consulting", "level": 3},
    {"title": "Consultant", "service_line": "Consulting", "level": 4},
    {"title": "Senior Consultant", "service_line": "Consulting", "level": 5},
    {"title": "Manager", "service_line": "Consulting", "level": 6},
    {"title": "Senior Manager", "service_line": "Consulting", "level": 7},
    {"title": "Director", "service_line": "Consulting", "level": 8},
    {"title": "Partner", "service_line": "Consulting", "level": 9},

    # Assurance (5 levels)
    {"title": "Staff", "service_line": "Assurance", "level": 1},
    {"title": "Senior", "service_line": "Assurance", "level": 2},
    {"title": "Manager", "service_line": "Assurance", "level": 3},
    {"title": "Senior Manager", "service_line": "Assurance", "level": 4},
    {"title": "Partner", "service_line": "Assurance", "level": 5},

    # Tax (5 levels)
    {"title": "Staff", "service_line": "Tax", "level": 1},
    {"title": "Senior", "service_line": "Tax", "level": 2},
    {"title": "Manager", "service_line": "Tax", "level": 3},
    {"title": "Senior Manager", "service_line": "Tax", "level": 4},
    {"title": "Partner", "service_line": "Tax", "level": 5},
]

db = SessionLocal()
for role_data in roles:
    role = Role(**role_data)
    db.add(role)
db.commit()
db.close()
```

**Implemented In:** Block A (Synthetic Data)

---

### 2. generate_synthetic_employees.py

**Purpose:** Generate 900 realistic employees with skills

**Cost:** ~$2 (GPT-5.2 Instant Nano for realistic variation)

```python
# backend/scripts/generate_synthetic_employees.py
import random
from app.database import SessionLocal
from app.models import Employee, EmployeeSkill, Role

# Template skills by role
CONSULTING_SKILLS = {
    "Analyst": ["Excel", "PowerPoint", "Data Analysis", "Python", "SQL"],
    "Consultant": ["Python", "SQL", "Data Analysis", "Machine Learning", "Cloud Platforms"],
    "Manager": ["Python", "Leadership", "Project Management", "Strategy", "Client Relations"]
}

db = SessionLocal()

# Get all roles
roles = db.query(Role).filter(Role.service_line == "Consulting").all()

for i in range(300):  # 300 consulting employees
    role = random.choice(roles)

    employee = Employee(
        email=f"employee{i}@ey.com",
        password_hash="$2b$12$...",  # Hashed "password"
        name=f"Employee {i}",
        role_id=role.id,
        department="Advisory",
        service_line="Consulting",
        location=random.choice(["New York", "London", "Tokyo"]),
        experience_years=random.randint(1, 15),
        hire_date=fake.date_between(start_date="-10y", end_date="today")
    )
    db.add(employee)
    db.flush()  # Get employee.id

    # Add skills for role
    skills_template = CONSULTING_SKILLS.get(role.title, [])
    for skill_name in skills_template:
        skill = EmployeeSkill(
            employee_id=employee.id,
            skill_name=skill_name,
            proficiency=random.choice(["Intermediate", "Advanced", "Expert"]),
            years_experience=random.randint(1, 5)
        )
        db.add(skill)

db.commit()
db.close()
```

**Implemented In:** Block A (Synthetic Data)

---

### 3. scrape_job_postings.py

**Purpose:** Scrape job postings from EY careers site

```python
# backend/scripts/scrape_job_postings.py
import requests
from bs4 import BeautifulSoup
from app.database import SessionLocal
from app.models import JobPosting, JobPostingSkill

# Scrape EY careers (or use mock data for MVP)
job_postings = [
    {
        "title": "Senior AI Engineer",
        "description": "We are seeking...",
        "department": "Technology",
        "location": "New York",
        "required_skills": ["Python", "Machine Learning", "TensorFlow", "Kubernetes"]
    }
]

db = SessionLocal()
for job_data in job_postings:
    skills = job_data.pop("required_skills")

    job = JobPosting(**job_data)
    db.add(job)
    db.flush()

    for skill_name in skills:
        skill = JobPostingSkill(
            job_posting_id=job.id,
            skill_name=skill_name,
            required_proficiency="Advanced",
            is_required=True
        )
        db.add(skill)

db.commit()
db.close()
```

**Implemented In:** Block B (Job Scraper)

---

### 4. generate_embeddings.py

**Purpose:** Generate vector embeddings for employees and jobs

**Cost:** ~$0.02 total (text-embedding-3-large)

```python
# backend/scripts/generate_embeddings.py
from app.database import SessionLocal
from app.services.embedding_service import EmbeddingService

db = SessionLocal()
embedding_service = EmbeddingService(db)

# Generate employee embeddings
employees = db.query(Employee).all()
for employee in employees:
    text = format_employee_skills_for_embedding(employee.id)
    embedding = embedding_service.generate_embedding(text)

    db.add(EmployeeEmbedding(
        employee_id=employee.id,
        embedding_vector=embedding
    ))

# Generate job embeddings
jobs = db.query(JobPosting).all()
for job in jobs:
    text = format_job_for_embedding(job.id)
    embedding = embedding_service.generate_embedding(text)

    db.add(JobPostingEmbedding(
        job_posting_id=job.id,
        embedding_vector=embedding
    ))

db.commit()
db.close()
```

**Implemented In:** Block D (Vector Embeddings)

---

## Team Data Sharing

### Git-Based Data Dumps

```bash
# One team member generates data
python scripts/seed_database.py
pg_dump springais > data/synthetic_employees.sql

# Commit to data-dumps branch
git checkout -b data-dumps
git add data/synthetic_employees.sql
git commit -m "Generate 900 employees - 2026-01-06"
git push origin data-dumps

# Teammates pull and load
git checkout data-dumps
git pull
psql springais < data/synthetic_employees.sql
```

**Benefits:**
- Only one person pays OpenAI API costs (~$2)
- Consistent data across team
- Version controlled (can revert to previous data)

---

## Minimal Seed (For Testing)

```python
# backend/scripts/seed_minimal.py
# Quick seed for testing (no AI costs)

db = SessionLocal()

# 1 role
role = Role(title="Consultant", service_line="Consulting", level=4)
db.add(role)
db.flush()

# 10 employees
for i in range(10):
    employee = Employee(
        email=f"test{i}@ey.com",
        password_hash="...",
        name=f"Test User {i}",
        role_id=role.id,
        department="Advisory",
        service_line="Consulting"
    )
    db.add(employee)

# 5 jobs
for i in range(5):
    job = JobPosting(
        title=f"Test Job {i}",
        department="Technology",
        location="New York"
    )
    db.add(job)

db.commit()
```

---

## Related Documentation

- `reference-docs/data/mock-data-formats.md` - Data structures
- `reference-docs/data/synthetic-data-generation.md` - Detailed generation process
- `reference-docs/backend/database-schema.md` - Database schema

**Implemented In:** Block A (Synthetic Data), Block B (Job Scraper)
