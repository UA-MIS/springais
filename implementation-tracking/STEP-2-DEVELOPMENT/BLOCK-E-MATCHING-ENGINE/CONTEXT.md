# BLOCK E: Matching Engine - CONTEXT

**Block ID:** BLOCK-E-MATCHING-ENGINE
**Phase:** STEP-2-DEVELOPMENT
**Category:** #backend #ai #algorithms
**Estimated Time:** 2-3 days
**Dependencies:** BLOCK-C (models), BLOCK-D (embeddings)

---

## AI Quick Start Prompt

```
You are working on BLOCK-E: Matching Engine for SpringAIS.

Goal: Implement AI-powered job matching with three modes (Best Fit, Stretch, Exploratory) using cosine similarity and multi-dimensional scoring.

Key constraints:
- Three match modes with different score weighting
- Multi-dimensional scores: skill_match, experience, growth_potential
- Uses Block D vector embeddings for semantic skill matching
- Generates LLM explanations for each match
- Stores results in Match table

Read TASKS.md for step-by-step implementation checklist.
Read VERIFICATION.md for matching quality validation tests.
```

---

## Purpose

Create an intelligent matching engine that goes beyond simple keyword matching to find ideal career opportunities based on skills, experience, and growth potential. The engine supports three distinct matching strategies to serve different career goals.

**Why this matters:**
- Traditional job boards use exact keyword matching (misses 70% of relevant jobs)
- Semantic matching finds conceptually similar skills across terminology gaps
- Multi-mode matching serves different user intents (play it safe vs stretch goals)
- Explainable AI builds trust (users see why job recommended)

**Success outcome:**
- Matching engine generates high-quality matches for all employees/users
- Three modes produce distinctly different results (validated manually)
- Semantic skill matching outperforms exact matching (measured via precision/recall)
- Match explanations are clear and actionable
- Performance: <500ms to generate top 10 matches per user

---

## Background: Three Match Modes

### Mode 1: Best Fit (Conservative, 90%+ skill match)

**Target user:** "I want a job I'm already qualified for"

**Weighting:**
- Skill match: 60% (highest weight)
- Experience: 30%
- Growth potential: 10% (lowest weight)

**Characteristics:**
- High skill overlap (90-100%)
- Experience within job requirements
- Low risk, high confidence matches
- Immediate job readiness

**Example match:**
```
User: Senior Consultant (5 years) with Python, AWS, Data Analysis
Match: Data Engineer role requiring Python, AWS, SQL
Skill match: 95% (Python ✓, AWS ✓, SQL similar to Data Analysis)
Experience: 100% (5 years matches 3-7 year requirement)
Growth: 30% (lateral move, moderate growth)
Overall: 0.88 (Best Fit)
```

---

### Mode 2: Stretch (Ambitious, 70-85% skill match)

**Target user:** "I want to grow into a new role"

**Weighting:**
- Skill match: 40%
- Experience: 30%
- Growth potential: 30% (balanced)

**Characteristics:**
- Moderate skill overlap (70-85%)
- Skill gaps are learnable (1-2 missing skills)
- Higher growth potential
- Career progression opportunity

**Example match:**
```
User: Senior Consultant (5 years) with Python, AWS, Data Analysis
Match: Senior Data Scientist requiring Python, ML, Statistics, R
Skill match: 75% (Python ✓, ML learnable, Statistics partial, R missing)
Experience: 90% (5 years close to 4-8 year requirement)
Growth: 85% (new domain, high learning potential)
Overall: 0.82 (Stretch)
```

---

### Mode 3: Exploratory (Exploratory, 50-70% skill match)

**Target user:** "Show me adjacent career paths I haven't considered"

**Weighting:**
- Skill match: 30%
- Experience: 20%
- Growth potential: 50% (highest weight)

**Characteristics:**
- Lower skill overlap (50-70%)
- Cross-domain opportunities
- High growth potential
- Career pivot opportunities

**Example match:**
```
User: Senior Consultant (5 years) with Python, AWS, Data Analysis
Match: Product Manager role requiring Product Strategy, SQL, Data Analytics
Skill match: 60% (Data Analysis ✓, SQL learnable, Product Strategy new)
Experience: 70% (5 years consulting transferable)
Growth: 95% (career pivot, leadership path)
Overall: 0.75 (Exploratory)
```

---

## Scoring Algorithm

### 1. Skill Match Score (Semantic)

**Method:** Cosine similarity using Block D vector embeddings

**Formula:**
```python
def calculate_skill_match_score(user_skills, job_required_skills):
    """Calculate semantic skill overlap"""
    # Embed all skills (uses Block D caching)
    user_embeddings = [embed_skill(skill) for skill in user_skills]
    job_embeddings = [embed_skill(skill) for skill in job_required_skills]

    # For each job skill, find best matching user skill
    matches = []
    for job_emb in job_embeddings:
        best_match = max([cosine_similarity(job_emb, user_emb) for user_emb in user_embeddings])
        matches.append(best_match)

    # Average best matches
    skill_match_score = sum(matches) / len(matches)
    return skill_match_score  # 0.0-1.0
```

**Example:**
```
User skills: ["Python", "AWS", "Data Analysis"]
Job required: ["Python", "Machine Learning", "Statistics"]

Match calculation:
- Python → Python: 0.99 (exact match)
- Machine Learning → Data Analysis: 0.75 (related)
- Statistics → Data Analysis: 0.70 (related)

Skill match score: (0.99 + 0.75 + 0.70) / 3 = 0.81 (81%)
```

---

### 2. Experience Score

**Method:** Compare user's years of experience to job requirements

**Formula:**
```python
def calculate_experience_score(user_years, job_min_years, job_max_years):
    """Calculate experience alignment"""
    if user_years < job_min_years:
        # Under-qualified (penalize based on gap)
        gap = job_min_years - user_years
        return max(0, 1 - (gap / job_min_years))
    elif user_years > job_max_years:
        # Over-qualified (slight penalty)
        excess = user_years - job_max_years
        return max(0.7, 1 - (excess / 10))
    else:
        # Within range (perfect)
        return 1.0
```

**Examples:**
```
User: 5 years, Job: 3-7 years → 1.0 (perfect fit)
User: 2 years, Job: 3-7 years → 0.67 (under-qualified by 1 year)
User: 10 years, Job: 3-7 years → 0.70 (over-qualified)
```

---

### 3. Growth Potential Score

**Method:** Estimate learning opportunity and career advancement

**Factors:**
```python
def calculate_growth_potential_score(user_skills, job_skills, user_role_level, job_role_level):
    """Calculate growth opportunity"""
    # Factor 1: Skill gap (new skills to learn)
    skill_gap = [skill for skill in job_skills if skill not in user_skills]
    skill_gap_factor = min(len(skill_gap) / 3, 1.0)  # Normalized to 0-1

    # Factor 2: Role level progression
    role_progression = (job_role_level - user_role_level) / 3  # Normalized
    role_factor = min(max(role_progression, 0), 1.0)

    # Factor 3: Cross-domain potential (different service line)
    domain_factor = 0.3 if job_service_line != user_service_line else 0.0

    # Weighted combination
    growth_score = (skill_gap_factor * 0.5) + (role_factor * 0.4) + (domain_factor * 0.1)
    return growth_score
```

**Example:**
```
User: Consultant L5, Skills: ["AWS", "Python"]
Job: Manager L6, Skills: ["AWS", "Python", "Leadership", "Strategy"]

Skill gap: 2 new skills (Leadership, Strategy) → 2/3 = 0.67
Role progression: (6-5)/3 = 0.33
Domain factor: Same service line → 0.0

Growth score: (0.67 * 0.5) + (0.33 * 0.4) + 0.0 = 0.47
```

---

### 4. Overall Score (Weighted)

**Formula:**
```python
def calculate_overall_score(skill_score, experience_score, growth_score, mode):
    """Calculate weighted overall match score"""
    weights = {
        "best_fit": {"skill": 0.6, "experience": 0.3, "growth": 0.1},
        "stretch": {"skill": 0.4, "experience": 0.3, "growth": 0.3},
        "exploratory": {"skill": 0.3, "experience": 0.2, "growth": 0.5}
    }

    w = weights[mode]
    overall = (skill_score * w["skill"]) + (experience_score * w["experience"]) + (growth_score * w["growth"])
    return overall  # 0.0-1.0
```

**Example (Best Fit mode):**
```
Skill match: 0.85
Experience: 0.95
Growth: 0.40

Overall = (0.85 * 0.6) + (0.95 * 0.3) + (0.40 * 0.1)
        = 0.51 + 0.285 + 0.04
        = 0.835 (83.5% match)
```

---

## LLM Match Explanations

**Purpose:** Generate human-readable explanation for why job matched

**GPT-5.2 Instant Prompt Template:**
```
You are a career advisor explaining why a job matches a candidate.

Candidate:
- Role: {user_role}
- Years Experience: {user_years}
- Skills: {user_skills}

Job:
- Title: {job_title}
- Required Skills: {job_required_skills}
- Experience: {job_min_years}-{job_max_years} years

Match Scores:
- Skill Match: {skill_score} (matching skills: {matched_skills}, gaps: {skill_gaps})
- Experience: {experience_score}
- Growth Potential: {growth_score}
- Overall: {overall_score}

Write a 2-3 sentence explanation of why this job is a good match and what the candidate would learn. Be encouraging but realistic about skill gaps.
```

**Example output:**
```
"This Senior Data Scientist role is an excellent stretch opportunity for you. Your Python and AWS skills directly apply, and your data analysis background provides a strong foundation for learning machine learning. You'll gain expertise in ML and statistics, positioning you for senior data roles."
```

---

## Mock Data for Independent Testing

**File:** `tests/fixtures/mock_matches.py`

```python
MOCK_USER = {
    "id": "MOCK-USER-001",
    "current_role": "Senior Consultant",
    "role_level": 5,
    "years_experience": 5.0,
    "skills": ["Python", "AWS", "Data Analysis", "Client Management"]
}

MOCK_JOBS = [
    {
        "id": "MOCK-JOB-001",
        "title": "Data Engineer",
        "service_line": "Consulting",
        "required_skills": ["Python", "AWS", "SQL", "ETL"],
        "experience_years_min": 3,
        "experience_years_max": 7
    },
    # ... 10-20 mock jobs
]
```

---

## References

**Related Documentation:**
- `BLOCK-D-VECTOR-EMBEDDINGS/CONTEXT.md` - Semantic similarity search
- `BLOCK-C-DATABASE-MODELS/CONTEXT.md` - Match model definition
- `_bmad-output/architecture-updates-2026.md` - Matching algorithm design

**Reference Docs:**
- `reference-docs/backend/service-patterns.md` - Service layer architecture patterns
- `reference-docs/backend/database-schema.md` - Database models and queries
- `reference-docs/architecture/data-flow.md` - Matching flow diagram
- `reference-docs/integration/api-contracts.md` - Matches API contract

**Algorithm Resources:**
- Cosine Similarity: https://en.wikipedia.org/wiki/Cosine_similarity
- Approximate Nearest Neighbors: https://github.com/pgvector/pgvector

---

## Success Criteria

**This block is complete when:**

1. ✅ MatchingEngine service implemented with all three modes
2. ✅ Skill match scoring uses Block D semantic similarity
3. ✅ Experience and growth scores implemented
4. ✅ LLM match explanations generated (GPT-5.2 Instant)
5. ✅ Matches stored in Match table
6. ✅ Performance: <500ms to generate top 10 matches
7. ✅ Manual validation: three modes produce distinct results
8. ✅ Pytest tests validate scoring logic and match quality

---

**Last Updated:** 2026-01-06
**Status:** Ready for development
**Blocking:** BLOCK-I (Skills Dashboard needs matches to display), BLOCK-J (Match Results UI)
**Blocked by:** BLOCK-C (Match model), BLOCK-D (vector embeddings)
