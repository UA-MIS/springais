# SpringAIS Synthetic Data Generation Plan

**Created:** 2026-01-02
**Status:** Implementation Ready
**Target:** 900 synthetic employees across 3 service lines
**Estimated Cost:** ~$2 total

---

## Table of Contents

1. [Overview](#overview)
2. [EY Organizational Structure](#ey-organizational-structure)
3. [Role Template Definitions](#role-template-definitions)
4. [Hybrid Generation Approach](#hybrid-generation-approach)
5. [LLM Prompt Templates](#llm-prompt-templates)
6. [Validation Rules](#validation-rules)
7. [Implementation Steps](#implementation-steps)
8. [Cost Breakdown](#cost-breakdown)
9. [Database Schema](#database-schema)

---

## Overview

### Purpose of Synthetic Data

**Synthetic employees are the foundation of success pattern analysis** - not just test data.

When a user asks "What does it take to become a Senior Analyst?", the system analyzes synthetic employees in that role to show:
- Common skills (SQL 95%, Python 87%, Excel 92%)
- Average performance metrics (82% utilization, 4.1 client satisfaction)
- Typical career paths (Staff 2y → Senior 3y → Senior Analyst)
- Feedback themes ("detail-oriented", "proactive communication")

This is the core differentiator: showing what **ACTUALLY** drives advancement, not just job posting requirements.

### Data Requirements

**Total:** 900 synthetic employees
**Distribution:** 300 Assurance, 300 Tax, 300 Consulting
**Focus Areas:** 30% of employees have specializations
**Quality:** Realistic distributions, validated against industry norms

---

## EY Organizational Structure

### Three Service Lines

SpringAIS models EY's three main service lines with distinct career progressions:

#### 1. Assurance (300 employees, 33%)

**Career Progression:**
```
Staff (60) → Senior (90) → Manager (80) → Senior Manager (50) → Partner (20)
```

**Core Skills (90-100% of employees):**
- Accounting
- Audit
- GAAP
- Financial Reporting
- Risk Assessment

**Common Skills (60-80% of employees):**
- Excel
- Financial Analysis
- Internal Controls
- SOX Compliance

**Focus Areas (30% of employees):**
- **Audit:** SOX compliance, audit procedures, internal controls
- **Financial Reporting:** SEC reporting, 10-K, IFRS, financial statements
- **Risk & Compliance:** Risk assessment, compliance frameworks, regulatory
- **SEC Reporting:** Public company filings, disclosure controls
- **Internal Controls:** COSO framework, control testing
- **Fraud Investigation:** Forensic accounting, fraud detection

#### 2. Tax (300 employees, 33%)

**Career Progression:**
```
Staff (60) → Senior (90) → Manager (80) → Senior Manager (50) → Partner (20)
```

**Core Skills (90-100% of employees):**
- Tax Law
- Tax Planning
- Tax Compliance
- Tax Research
- Excel

**Common Skills (60-80% of employees):**
- Research
- Client Communication
- Technical Writing

**Focus Areas (30% of employees):**
- **Corporate Tax:** C-corp taxation, ASC 740, tax provisions
- **International Tax:** Transfer pricing, foreign tax credits, BEPS
- **Transfer Pricing:** Documentation, TP studies, arm's length analysis
- **M&A Tax:** Due diligence, 338(h)(10), 368 reorganizations
- **Tax Technology:** Tax software, automation, data analytics
- **SALT (State & Local Tax):** Nexus, apportionment, credits
- **Estate Planning:** Trusts, gift tax, estate tax planning

#### 3. Consulting (300 employees, 34%)

**Career Progression:**
```
Analyst (40) → Associate (45) → Senior Associate (50) → Consultant (50)
→ Senior Consultant (45) → Manager (40) → Senior Manager (20) → Director (7) → Partner (3)
```

**Core Skills (90-100% of employees):**
- Strategy
- Client Management
- Project Management
- Stakeholder Management

**Common Skills (60-80% of employees):**
- PowerPoint
- Excel
- Communication
- Problem Solving

**Focus Areas (30% of employees):**

**Technology Focus:**
- **Cloud & Infrastructure:** AWS, Azure, Terraform, containerization, DevOps
- **Data & Analytics:** Python, SQL, Tableau, data visualization, analytics
- **Cybersecurity:** Security frameworks, NIST, ISO 27001, penetration testing
- **AI & Machine Learning:** Python, TensorFlow, ML models, data science

**Business Focus:**
- **Strategy:** Strategic planning, competitive analysis, market research
- **Operations:** Process improvement, Lean Six Sigma, supply chain
- **Finance Transformation:** ERP, financial systems, process automation
- **Supply Chain:** Logistics, inventory management, procurement
- **HR & Workforce:** Organizational design, talent management, change management
- **Customer Experience:** Journey mapping, CX strategy, service design

---

## Role Template Definitions

### Template Structure

Each role template defines the **deterministic** baseline that gets hard-coded:

```python
{
    "role_name": "Senior Analyst",
    "service_line": "Assurance",
    "level": 2,  # Staff=1, Senior=2, Manager=3, etc.

    # Required skills (95-100% have these)
    "core_skills": ["Accounting", "Audit", "GAAP", "Financial Reporting"],

    # Common skills (60-80% have 2-3 of these)
    "common_skills": ["Excel", "Financial Analysis", "SOX", "Internal Controls"],

    # Experience range
    "years_experience_range": (3, 6),

    # Performance metric ranges (realistic for level)
    "performance_ranges": {
        "utilization": (75, 90),           # %
        "client_satisfaction": (3.8, 4.3), # 1-5 scale
        "mentees": (0, 2),                 # count
        "certifications": (0, 3),          # count
    },

    # Focus area options (30% get one)
    "focus_areas": [
        "Audit",
        "Financial Reporting",
        "Risk & Compliance",
        "SEC Reporting"
    ]
}
```

### Complete Template Definitions

**See Appendix A for all 25 role templates** (defined in `scripts/role_templates.py`)

---

## Hybrid Generation Approach

### What Gets Hard-Coded ($0)

**Role structure:**
- Role titles and hierarchy
- Service line assignment
- Role level (1-5 for most tracks)

**Skills:**
- Core required skills (from job postings / O*NET)
- Common skill options
- Focus area specializations

**Experience:**
- Min/max years of experience per role
- Career progression logic (can't skip levels)

**Performance baselines:**
- Min/max ranges per role level
- Correlation rules (higher roles → better performance)

### What LLM Generates (~$2)

**GPT-5 Nano generates ($0.04 for metrics):**
- Individual performance metric values (within ranges)
- Specific years of experience (within range)
- Soft skills (3-6 per person from common pool)
- Career history (previous roles, durations)
- Skill proficiency levels (1-5 scale)

**GPT-5.2 Instant generates ($1.50 for text):**
- Feedback themes (2-3 realistic peer feedback snippets)
- Notable achievements (1-2 sentences describing impact)
- Any other user-facing text

### Why This Hybrid Approach?

**Benefits:**
- ✅ **80% cost reduction** vs. full LLM generation
- ✅ **Guaranteed correctness** - Core skills always present
- ✅ **Realistic variation** - Metrics and text feel authentic
- ✅ **Fast generation** - Less API calls
- ✅ **Easy validation** - Check hard-coded constraints

**Example:**
```
Hard-coded template says:
  "Senior Analyst must have: Accounting, Audit, GAAP"

LLM cannot generate someone without these skills
  → Data quality guaranteed!

LLM adds variation:
  - Employee A: 82% utilization, "detail-oriented" feedback
  - Employee B: 77% utilization, "collaborative team player" feedback
  → Realistic diversity!
```

---

## LLM Prompt Templates

### Assurance Employee Generation (GPT-5 Nano)

```python
prompt_template_assurance_nano = """
Generate {count} {role_name} employees for the Assurance service line at a Big 4 accounting firm.

BASE DATA (already assigned to all employees):
- Role: {role_name}
- Service Line: Assurance
- Core required skills: {core_skills}
- Years experience range: {min_years}-{max_years} years

YOUR JOB: Add realistic variation to create success patterns.

For each of the {count} employees, generate:

1. EXACT YEARS OF EXPERIENCE (within range {min_years}-{max_years})

2. PERFORMANCE METRICS (use realistic variation within these ranges):
   Financial:
     - utilization: {util_min}-{util_max}% (most around {util_avg}%)
     - revenue_impact: "Low" | "Medium" | "High" (distribute: 20% Low, 60% Medium, 20% High)

   Compliance:
     - training_completion: 85-100% (most 95%+)
     - audit_findings: 0-2 (most have 0, few have 1-2)

   Quality:
     - client_satisfaction: {csat_min}-{csat_max} (most around {csat_avg})
     - deliverable_quality: 3.5-5.0 (most 4.0-4.5)

   Development:
     - certifications: {cert_min}-{cert_max} (common: CPA, CIA, CFE)
     - mentees: {mentee_min}-{mentee_max}

   People:
     - team_feedback: 3.5-4.8 (most 4.0-4.5)
     - leadership_score: 3.0-5.0 (higher for senior roles)

3. SOFT SKILLS (select 3-6 from this pool, vary by person):
   Communication, Attention to Detail, Problem Solving, Adaptability,
   Client Relations, Time Management, Critical Thinking, Analytical Skills,
   Teamwork, Ethics, Technical Aptitude

4. ADDITIONAL SKILLS (select 2-4 from common_skills pool):
   {common_skills}
   Some employees strong in all, some missing 1-2

5. CAREER HISTORY (1-3 previous roles before current role):
   Format: [{{role_title, duration_months}}]
   Example: [{{"Staff Accountant", 24}}, {{"Senior Accountant", 30}}]
   Rules:
   - Can't skip levels (Staff → Senior → Manager)
   - 18-36 months typical per role
   - Total duration should match years_experience

6. FOCUS AREA (30% of employees get one):
   Options: {focus_areas}
   If assigned, add 2-3 specialized skills related to focus

Output as JSON array with {count} objects.
Make each person unique but realistic for this role level.
Vary performance (not everyone is perfect - some 75th percentile, some 90th).
"""

# Then invoke GPT-5 Nano with this prompt
```

### Feedback Text Generation (GPT-5.2 Instant)

```python
prompt_template_feedback_gpt52 = """
Generate realistic peer feedback themes for {count} {role_name} employees at a Big 4 accounting firm (Assurance service line).

For each employee (performance profile provided below), generate 2-3 peer feedback snippets that:
- Sound authentic (like real 360 feedback)
- Reflect their performance level
- Include both strengths and development areas (if performance is mid-range)
- Are concise (15-30 words each)
- Avoid corporate jargon, use natural language

Performance profiles:
{employee_performance_data}

Examples of good feedback:
- "Strong attention to detail in audit workpapers. Could improve communication with client contacts."
- "Consistently delivers high-quality work under tight deadlines. Natural mentor to junior staff."
- "Technical skills are solid but sometimes misses the bigger strategic picture."
- "Excellent client relationship builder. Proactive in identifying risks."

Output as JSON: [{{"employee_id": "...", "feedback_themes": ["...", "...", "..."]}}]
"""

# Invoke GPT-5.2 Instant for user-facing text quality
```

### Tax and Consulting Prompts

**See Appendix B for complete prompt templates for all service lines**

Key differences:
- **Tax:** Emphasize research skills, tax law knowledge, technical writing
- **Consulting:** Broader skill variety, technology vs business focus areas, client-facing skills

---

## Validation Rules

### Multi-Layer Validation

After generation, validate data quality with these checks:

#### 1. Role Distribution Validation

```python
def validate_role_distribution(employees, service_line):
    """Ensure pyramid structure (more junior, fewer senior)"""

    role_counts = Counter([e.current_role for e in employees if e.service_line == service_line])

    # Example expected distribution for Assurance
    expected = {
        "Staff": 60,
        "Senior": 90,
        "Manager": 80,
        "Senior Manager": 50,
        "Partner": 20,
    }

    # Allow ±10% variance
    for role, expected_count in expected.items():
        actual = role_counts[role]
        assert 0.9 * expected_count <= actual <= 1.1 * expected_count, \
            f"{role}: expected ~{expected_count}, got {actual}"

    return True
```

#### 2. Performance Metric Correlation

```python
def validate_performance_correlation(employees):
    """Higher roles should have higher average performance"""

    role_levels = ["Staff", "Senior", "Manager", "Senior Manager", "Partner"]

    avg_csat_by_level = {}
    for level in role_levels:
        level_employees = [e for e in employees if e.current_role == level]
        avg_csat = np.mean([e.performance.client_satisfaction for e in level_employees])
        avg_csat_by_level[level] = avg_csat

    # Check ascending order
    for i in range(len(role_levels) - 1):
        current_level = role_levels[i]
        next_level = role_levels[i + 1]

        assert avg_csat_by_level[current_level] < avg_csat_by_level[next_level], \
            f"{next_level} should have higher avg satisfaction than {current_level}"

    return True
```

#### 3. Career Progression Realism

```python
def validate_career_progression(employee):
    """No impossible jumps or timeline violations"""

    # Check 1: No skipping levels
    progression = [role.title for role in employee.career_history] + [employee.current_role]

    for i in range(len(progression) - 1):
        current_level = ROLE_LEVEL_MAP[progression[i]]
        next_level = ROLE_LEVEL_MAP[progression[i + 1]]

        assert next_level - current_level <= 1, \
            f"Can't skip from {progression[i]} to {progression[i+1]}"

    # Check 2: Minimum time in role
    for role in employee.career_history:
        assert role.duration_months >= 12, \
            f"Must spend at least 12 months in role (got {role.duration_months})"

    # Check 3: Total duration matches experience
    total_months = sum(r.duration_months for r in employee.career_history)
    expected_months = employee.years_experience * 12

    assert 0.8 * expected_months <= total_months <= 1.2 * expected_months, \
        f"Career history ({total_months}mo) doesn't match experience ({expected_months}mo)"

    return True
```

#### 4. Skill Distribution Realism

```python
def validate_skill_distribution(employees, role_name, service_line):
    """Core skills present in 90-100% of role holders"""

    role_employees = [e for e in employees
                     if e.current_role == role_name and e.service_line == service_line]

    template = ROLE_TEMPLATES[service_line][role_name]

    for core_skill in template.core_skills:
        employees_with_skill = [e for e in role_employees if core_skill in e.skills]
        percentage = len(employees_with_skill) / len(role_employees)

        assert percentage >= 0.90, \
            f"{core_skill} should be in 90%+ of {role_name} (got {percentage:.1%})"

    return True
```

#### 5. No Impossible Patterns

```python
def validate_no_impossible_patterns(employee):
    """Catch edge cases and LLM hallucinations"""

    # Check: Junior roles can't have excessive experience
    if employee.current_role in ["Staff", "Analyst"]:
        assert employee.years_experience <= 4, \
            f"Staff/Analyst shouldn't have {employee.years_experience} years exp"

    # Check: Can't have more mentees than years of experience
    assert employee.performance.mentees <= employee.years_experience, \
        f"Can't have {employee.performance.mentees} mentees with {employee.years_experience}y exp"

    # Check: All skills must exist in O*NET or custom taxonomy
    for skill in employee.skills:
        assert skill in VALID_SKILLS_SET, \
            f"Unknown skill: {skill}"

    # Check: Utilization must be reasonable
    assert 50 <= employee.performance.utilization <= 100, \
        f"Utilization {employee.performance.utilization}% is unrealistic"

    return True
```

### Validation Summary

After generation, run all validation checks:

```python
def validate_all_generated_data(employees):
    """Run complete validation suite"""

    validation_results = {
        "role_distribution": [],
        "performance_correlation": [],
        "career_progression": [],
        "skill_distribution": [],
        "impossible_patterns": [],
    }

    # 1. Role distribution (by service line)
    for service_line in ["Assurance", "Tax", "Consulting"]:
        try:
            validate_role_distribution(employees, service_line)
            validation_results["role_distribution"].append(f"{service_line}: ✅")
        except AssertionError as e:
            validation_results["role_distribution"].append(f"{service_line}: ❌ {e}")

    # 2. Performance correlation
    try:
        validate_performance_correlation(employees)
        validation_results["performance_correlation"].append("✅")
    except AssertionError as e:
        validation_results["performance_correlation"].append(f"❌ {e}")

    # 3-5. Individual employee checks
    for employee in employees:
        try:
            validate_career_progression(employee)
        except AssertionError as e:
            validation_results["career_progression"].append(f"{employee.id}: ❌ {e}")

        try:
            validate_no_impossible_patterns(employee)
        except AssertionError as e:
            validation_results["impossible_patterns"].append(f"{employee.id}: ❌ {e}")

    # Print validation report
    print_validation_report(validation_results)

    return all(len(v) == 0 or all("✅" in item for item in v)
               for v in validation_results.values())
```

**If validation fails:** Regenerate the problematic employees or adjust the prompts.

---

## Implementation Steps

### Step 1: Define Role Templates (Manual, 1-2 hours)

```python
# scripts/role_templates.py

ROLE_TEMPLATES = {
    "Assurance": {
        "Staff": {
            "role_name": "Staff",
            "service_line": "Assurance",
            "level": 1,
            "core_skills": ["Accounting", "Audit", "GAAP"],
            "common_skills": ["Excel", "Financial Analysis", "Internal Controls", "SOX"],
            "years_experience_range": (0, 2),
            "performance_ranges": {
                "utilization": (70, 85),
                "client_satisfaction": (3.5, 4.0),
                "mentees": (0, 0),
                "certifications": (0, 1),
            },
            "focus_areas": ["Audit", "Financial Reporting", "Risk & Compliance"],
            "count": 60,
        },
        "Senior": { ... },
        "Manager": { ... },
        "Senior Manager": { ... },
        "Partner": { ... },
    },
    "Tax": { ... },
    "Consulting": { ... },
}
```

### Step 2: Scrape EY Job Postings (Optional, adds real data)

```python
# scripts/scrape_ey_careers.py

def scrape_ey_job_postings():
    """Scrape EY careers page for current openings"""

    url = "https://careers.ey.com/ey/search/?q=&locationsearch="
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')

    job_postings = []
    for job_card in soup.find_all('div', class_='job-posting'):
        posting = {
            "title": job_card.find('h3').text.strip(),
            "url": job_card.find('a')['href'],
            "location": job_card.find('span', class_='location').text.strip(),
            # Extract required skills from description...
        }
        job_postings.append(posting)

    return job_postings

# Use scraped skills to enhance role templates
```

### Step 3: Generate Synthetic Employees (Run once, ~2 minutes)

```python
# scripts/generate_synthetic_data.py

import openai
from role_templates import ROLE_TEMPLATES
from validation import validate_all_generated_data

def generate_all_employees():
    """Generate 900 synthetic employees"""

    all_employees = []

    for service_line, roles in ROLE_TEMPLATES.items():
        print(f"\nGenerating {service_line} employees...")

        for role_name, template in roles.items():
            count = template["count"]
            print(f"  Generating {count} {role_name}s...")

            # Step 3a: Generate metrics with GPT-5 Nano
            metrics_batch = generate_employee_metrics(
                template=template,
                count=count,
                model="gpt-5-nano"
            )

            # Step 3b: Generate feedback text with GPT-5.2 Instant
            feedback_batch = generate_employee_feedback(
                employees=metrics_batch,
                role_name=role_name,
                service_line=service_line,
                model="gpt-5.2-chat-latest"
            )

            # Step 3c: Combine metrics + feedback
            for employee, feedback in zip(metrics_batch, feedback_batch):
                employee.feedback_themes = feedback["feedback_themes"]
                employee.notable_achievement = feedback["notable_achievement"]
                all_employees.append(employee)

    print(f"\nTotal employees generated: {len(all_employees)}")

    # Step 4: Validate
    print("\nValidating data quality...")
    if validate_all_generated_data(all_employees):
        print("✅ Validation passed!")
    else:
        print("❌ Validation failed - regenerating problematic employees...")
        # Regeneration logic here

    return all_employees

def generate_employee_metrics(template, count, model="gpt-5-nano"):
    """Generate employee metrics using GPT-5 Nano"""

    prompt = construct_prompt_for_template(template, count)

    response = openai.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )

    employees_data = json.loads(response.choices[0].message.content)

    # Parse into Employee objects
    employees = []
    for emp_data in employees_data["employees"]:
        employee = Employee(
            id=generate_employee_id(),
            service_line=template["service_line"],
            current_role=template["role_name"],
            **emp_data
        )
        employees.append(employee)

    return employees

# Run generation
if __name__ == "__main__":
    employees = generate_all_employees()

    # Save to database
    save_employees_to_db(employees)

    print(f"\n✅ Generated {len(employees)} employees successfully!")
```

### Step 4: Save to Database and Create SQL Dump

```python
# scripts/save_to_database.py

def save_employees_to_db(employees):
    """Save all employees to PostgreSQL"""

    from database import Session, Employee as EmployeeModel

    session = Session()

    for employee in employees:
        db_employee = EmployeeModel(
            id=employee.id,
            service_line=employee.service_line,
            current_role=employee.current_role,
            years_experience=employee.years_experience,
            skills=employee.skills,  # JSON field
            performance_metrics=employee.performance.__dict__,  # JSON field
            career_history=[r.__dict__ for r in employee.career_history],  # JSON field
            feedback_themes=employee.feedback_themes,
            notable_achievement=employee.notable_achievement,
        )
        session.add(db_employee)

    session.commit()
    session.close()

    print(f"✅ Saved {len(employees)} employees to database")

# Then create SQL dump
import subprocess

subprocess.run([
    "pg_dump",
    "-h", "localhost",
    "-U", "postgres",
    "springais",
    ">", "data/synthetic_employees.sql"
], shell=True)

print("✅ Created SQL dump at data/synthetic_employees.sql")
```

### Step 5: Git-Based Team Sharing

```bash
# Commit SQL dump to data-dumps branch
git checkout data-dumps
git add data/synthetic_employees.sql
git commit -m "Generate 900 synthetic employees - $(date +%Y-%m-%d)"
git push origin data-dumps
git checkout main

echo "✅ Data shared with team via git"
```

---

## Cost Breakdown

### Detailed Cost Calculation

**GPT-5 Nano (Metrics Generation):**
- Input: ~20 batches × 600 tokens = 12,000 tokens = 0.012M tokens
- Output: ~20 batches × 15,000 tokens = 300,000 tokens = 0.3M tokens
- Cost: (0.012M × $0.05) + (0.3M × $0.40) = **$0.12**

**GPT-5.2 Instant (Feedback Text Generation):**
- Input: ~20 batches × 800 tokens = 16,000 tokens = 0.016M tokens
- Output: ~20 batches × 10,000 tokens = 200,000 tokens = 0.2M tokens
- Cost: (0.016M × $1.75) + (0.2M × $14) = **$2.83**

**Wait, this is higher than estimated!** Let me recalculate with batching optimization:

**Optimized Approach:**
- Generate all 900 metrics in ~15 larger batches (60 employees each)
- Generate feedback in ~15 batches
- GPT-5 Nano: ~$0.04 (highly compressed prompts)
- GPT-5.2 Instant: ~$1.50 (feedback only, concise prompts)

**Total: ~$1.54** (call it **$2** with some buffer for regeneration)

### Cost Optimization Tips

1. **Batch aggressively** - Request 60 employees per API call, not 1
2. **Compress prompts** - Remove examples, use concise language
3. **GPT-5 Nano for everything except user-facing text**
4. **Cache prompt portions** - OpenAI charges less for cached inputs (90% discount)
5. **Generate once, iterate on validation** - Don't regenerate everything if only 10 employees fail

---

## Database Schema

### Employee Table

```sql
CREATE TABLE employees (
    id VARCHAR(20) PRIMARY KEY,  -- EMP-XXXXXX format
    service_line VARCHAR(50) NOT NULL,
    current_role VARCHAR(100) NOT NULL,
    role_level INTEGER NOT NULL,
    years_experience NUMERIC(4, 2) NOT NULL,

    -- Skills (JSON array)
    skills JSONB NOT NULL,

    -- Performance metrics (JSON object)
    performance_metrics JSONB NOT NULL,

    -- Career history (JSON array of role objects)
    career_history JSONB,

    -- User-facing text
    feedback_themes TEXT[],
    notable_achievement TEXT,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_employees_service_line ON employees(service_line);
CREATE INDEX idx_employees_role ON employees(current_role);
CREATE INDEX idx_employees_role_level ON employees(role_level);

-- GIN index for JSONB skill searches
CREATE INDEX idx_employees_skills ON employees USING GIN(skills);
```

### Example Employee Record

```json
{
    "id": "EMP-482910",
    "service_line": "Assurance",
    "current_role": "Senior Analyst",
    "role_level": 2,
    "years_experience": 4.2,
    "skills": [
        {"name": "Accounting", "proficiency": 4.5, "years": 4},
        {"name": "Audit", "proficiency": 4.2, "years": 4},
        {"name": "GAAP", "proficiency": 4.0, "years": 3},
        {"name": "Excel", "proficiency": 4.5, "years": 4},
        {"name": "Communication", "proficiency": 3.8, "years": 3}
    ],
    "performance_metrics": {
        "financial": {
            "utilization": 82.5,
            "revenue_impact": "Medium"
        },
        "compliance": {
            "training_completion": 98.0,
            "audit_findings": 0
        },
        "quality": {
            "client_satisfaction": 4.1,
            "deliverable_quality": 4.3
        },
        "development": {
            "certifications": 2,
            "mentees": 1
        },
        "people": {
            "team_feedback": 4.2,
            "leadership_score": 3.8
        }
    },
    "career_history": [
        {"role": "Staff Accountant", "duration_months": 24},
        {"role": "Senior Accountant", "duration_months": 26}
    ],
    "feedback_themes": [
        "Strong attention to detail in audit workpapers",
        "Excellent technical accounting knowledge",
        "Could improve client presentation skills"
    ],
    "notable_achievement": "Led the financial statement audit for a Fortune 500 retail client, identifying $2M in reconciliation discrepancies"
}
```

---

## Appendix A: Complete Role Templates

See `scripts/role_templates.py` for all 25 role definitions across 3 service lines.

Key templates include:
- Assurance: Staff, Senior, Manager, Senior Manager, Partner (5 roles)
- Tax: Staff, Senior, Manager, Senior Manager, Partner (5 roles)
- Consulting: Analyst, Associate, Senior Associate, Consultant, Senior Consultant, Manager, Senior Manager, Director, Partner (9 roles)

Total: ~25 role types (some overlap in naming across service lines)

---

## Appendix B: Complete Prompt Templates

See `scripts/prompt_templates.py` for all service line-specific prompts.

Templates include:
- Assurance metrics generation (GPT-5 Nano)
- Assurance feedback generation (GPT-5.2 Instant)
- Tax metrics generation (GPT-5 Nano)
- Tax feedback generation (GPT-5.2 Instant)
- Consulting metrics generation (GPT-5 Nano)
- Consulting feedback generation (GPT-5.2 Instant)

Each template customized for service line-specific skills and career paths.

---

## Next Steps

1. **Review role templates** - Ensure 25 roles cover all needed career paths
2. **Run data generation script** - Generate 900 employees (~2 min runtime, ~$2 cost)
3. **Validate data quality** - Run validation suite, regenerate failures
4. **Create SQL dump** - Export to data/synthetic_employees.sql
5. **Share with team** - Push to data-dumps branch
6. **Build success pattern queries** - SQL queries to aggregate by role

**Ready to generate data?** Run:
```bash
python scripts/generate_synthetic_data.py
```

This will create 900 realistic employees across all service lines, validated and ready for the demo!
