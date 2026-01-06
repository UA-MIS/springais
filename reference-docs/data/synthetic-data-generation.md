# Synthetic Data Generation Strategy

**Last Updated:** 2026-01-06
**Purpose:** How SpringAIS generates realistic 900-employee dataset

---

## Overview

SpringAIS uses a **hybrid approach** to synthetic data generation:
- **Hard-coded templates** for structure and baseline quality (free)
- **LLM generation** for realistic variation ($2 total)

**Cost:** ~$2 for 900 employees (vs $60-80 for Azure OpenAI)
**Time:** ~2 minutes total
**Quality:** Realistic enough for MVP demo

---

## Data Volume

| Data Type | Count | Method | Cost |
|-----------|-------|--------|------|
| Roles | 25 | Hard-coded | $0 |
| Employees | 900 | Template + LLM | $2 |
| Skills per employee | 12 avg | Template + O*NET | $0 |
| Job postings | 30-50 | Scraped + manual | $0 |
| Career transitions | 5,000 | Simulated | $0 |
| Performance reviews | 4,500 | LLM variation | $1.50 |
| **Total** | **~20K rows** | | **~$2** |

---

## Employee Generation

### Hard-Coded Structure

```python
# backend/scripts/generate_synthetic_employees.py

# Role distribution (mirrors EY structure)
SERVICE_LINE_DISTRIBUTION = {
    "Assurance": 0.33,  # 300 employees
    "Tax": 0.33,        # 300 employees
    "Consulting": 0.34  # 300 employees
}

# Role level distribution (pyramid structure)
LEVEL_DISTRIBUTION = {
    1: 0.25,  # 25% entry-level
    2: 0.20,
    3: 0.18,
    4: 0.15,
    5: 0.12,
    6: 0.06,
    7: 0.03,
    8: 0.01,
    9: 0.005  # <1% partners
}

# Location distribution
LOCATIONS = ["New York", "London", "Tokyo", "Sydney", "Chicago", "San Francisco"]

# Department templates
DEPARTMENTS = {
    "Assurance": ["Audit", "Risk Advisory", "Financial Reporting"],
    "Tax": ["Corporate Tax", "International Tax", "M&A Tax"],
    "Consulting": ["Technology", "Strategy", "Operations"]
}
```

### Skill Templates

```python
# Skills by role (from O*NET database)
SKILLS_BY_ROLE = {
    "Analyst": {
        "required": ["Excel", "PowerPoint", "Data Analysis"],
        "common": ["Python", "SQL", "Tableau"],
        "rare": ["Machine Learning", "R"]
    },
    "Consultant": {
        "required": ["Python", "SQL", "Data Analysis"],
        "common": ["Machine Learning", "Cloud Platforms", "Leadership"],
        "rare": ["TensorFlow", "PyTorch", "Kubernetes"]
    },
    "Manager": {
        "required": ["Leadership", "Project Management", "Strategy"],
        "common": ["Python", "SQL", "Client Relations"],
        "rare": ["Machine Learning", "AI/ML Strategy"]
    }
}

# Generate employee skills
def generate_employee_skills(role_title, experience_years):
    skills = []

    # Always include required skills for role
    for skill_name in SKILLS_BY_ROLE[role_title]["required"]:
        skills.append({
            "name": skill_name,
            "proficiency": "Advanced" if experience_years > 3 else "Intermediate",
            "years_experience": min(experience_years, 5)
        })

    # Add 3-5 common skills
    common = random.sample(SKILLS_BY_ROLE[role_title]["common"], random.randint(3, 5))
    for skill_name in common:
        skills.append({
            "name": skill_name,
            "proficiency": random.choice(["Intermediate", "Advanced"]),
            "years_experience": random.randint(1, experience_years)
        })

    # Chance to add 1-2 rare skills
    if random.random() > 0.7:  # 30% chance
        rare = random.sample(SKILLS_BY_ROLE[role_title]["rare"], random.randint(1, 2))
        for skill_name in rare:
            skills.append({
                "name": skill_name,
                "proficiency": "Beginner",
                "years_experience": 1
            })

    return skills
```

---

## LLM-Enhanced Realism

### Use Case 1: Individual Metric Variation

**Problem:** Hard-coded employees all have similar performance scores (too uniform)

**Solution:** Use GPT-5.2 Instant Nano to add realistic variation

**Cost:** $0.04 total (900 employees × 10 tokens)

```python
# backend/scripts/llm_variation.py
from openai import OpenAI

client = OpenAI()

def add_performance_variation(employee):
    """
    Use LLM to generate realistic performance score variation.
    """
    response = client.chat.completions.create(
        model="gpt-5-nano",  # Cheapest model
        messages=[{
            "role": "user",
            "content": f"Performance score for {employee.role} with {employee.experience_years} years: "
        }],
        max_tokens=5,  # Just need a number
        temperature=0.8  # High variance
    )

    score = float(response.choices[0].message.content.strip())
    return min(max(score, 1.0), 5.0)  # Clamp to 1-5 range
```

### Use Case 2: Feedback Themes

**Problem:** Performance review feedback too generic

**Solution:** GPT-5.2 Instant generates realistic feedback themes

**Cost:** $1.50 total (900 employees × 150 tokens)

```python
def generate_feedback_summary(employee, role, performance_score):
    """
    Generate realistic performance review feedback.
    """
    response = client.chat.completions.create(
        model="gpt-5.2-chat-latest",
        messages=[{
            "role": "system",
            "content": "Generate realistic performance review feedback in 2-3 sentences."
        }, {
            "role": "user",
            "content": f"Employee: {employee.name}, Role: {role}, Score: {performance_score}/5"
        }],
        max_tokens=150,
        temperature=0.7
    )

    return response.choices[0].message.content

# Example output:
# "John demonstrated exceptional technical leadership on the AI modernization project.
#  Strong Python skills and excellent client communication. Could improve delegation
#  and mentoring of junior team members."
```

---

## Career Transition Simulation

**Problem:** Need 5,000 realistic career transitions for success patterns

**Solution:** Probabilistic simulation based on EY promotion rates

```python
# backend/scripts/simulate_transitions.py
import random
from datetime import datetime, timedelta

# Promotion probabilities (from EY data)
PROMOTION_RATES = {
    ("Analyst", "Associate"): 0.85,  # 85% promoted after 1-2 years
    ("Consultant", "Senior Consultant"): 0.72,  # 72% promoted
    ("Senior Consultant", "Manager"): 0.68,
    ("Manager", "Senior Manager"): 0.55,
    ("Senior Manager", "Director"): 0.40,
    ("Director", "Partner"): 0.25
}

def simulate_career_transitions(employees):
    transitions = []

    for employee in employees:
        current_role = employee.role
        years_in_role = employee.experience_years % 3  # 0-3 years per role

        # Check if eligible for promotion (2+ years in role)
        if years_in_role >= 2:
            next_role = get_next_role(current_role)
            promotion_rate = PROMOTION_RATES.get((current_role.title, next_role.title), 0.5)

            # Probabilistic promotion
            if random.random() < promotion_rate:
                transition = CareerTransition(
                    employee_id=employee.id,
                    from_role_id=current_role.id,
                    to_role_id=next_role.id,
                    transition_date=employee.hire_date + timedelta(days=365 * 2),
                    months_to_transition=random.randint(18, 30),
                    was_promoted=True,
                    performance_score=random.uniform(3.5, 5.0)  # High performers get promoted
                )
                transitions.append(transition)

    return transitions
```

---

## Data Quality Checks

### Validation Script

```python
# backend/scripts/validate_data.py

def validate_synthetic_data(db):
    """
    Run quality checks on synthetic data.
    """
    # Check 1: Role distribution
    employee_count = db.query(Employee).count()
    assert employee_count == 900, f"Expected 900 employees, got {employee_count}"

    # Check 2: Service line distribution
    consulting_count = db.query(Employee).filter_by(service_line="Consulting").count()
    assert 280 <= consulting_count <= 320, "Consulting employees should be ~300"

    # Check 3: Skills per employee
    avg_skills = db.query(func.count(EmployeeSkill.id)).group_by(EmployeeSkill.employee_id).avg()
    assert 10 <= avg_skills <= 15, f"Avg skills per employee should be 10-15, got {avg_skills}"

    # Check 4: Embeddings generated
    embeddings_count = db.query(EmployeeEmbedding).count()
    assert embeddings_count == employee_count, "All employees should have embeddings"

    print("✅ All data quality checks passed")
```

---

## Comparison: Hard-coded vs LLM-Generated

| Aspect | Hard-coded | LLM-Generated | Hybrid (SpringAIS) |
|--------|------------|---------------|-------------------|
| Cost | $0 | $60-80 | **$2** ✅ |
| Realism | Low (uniform) | High | **Medium-High** ✅ |
| Time | Fast (instant) | Slow (10-20 min) | **Fast (2 min)** ✅ |
| Consistency | High | Low (random) | **High** ✅ |
| Customization | Easy | Hard | **Easy** ✅ |

**Winner:** Hybrid approach (best of both worlds)

---

## Related Documentation

- `reference-docs/data/seed-scripts.md` - Seeding scripts
- `reference-docs/backend/llm-integration.md` - LLM API usage
- `reference-docs/backend/database-schema.md` - Schema

**Implemented In:** Block A (Synthetic Data)
