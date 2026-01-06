# BLOCK A: Synthetic Data Generation - CONTEXT

**Block ID:** BLOCK-A-SYNTHETIC-DATA
**Phase:** STEP-2-DEVELOPMENT
**Category:** #data #python #llm
**Estimated Time:** 2-3 days
**Dependencies:** None (requires STEP-1-SETUP complete)

---

## AI Quick Start Prompt

```
You are working on BLOCK-A: Synthetic Data Generation for SpringAIS.

Goal: Generate 900 realistic synthetic employees across 3 EY service lines using hybrid hard-coded + LLM approach.

Key constraints:
- 300 employees per service line (Assurance, Tax, Consulting)
- ~25 role types total with realistic distributions
- Cost target: ~$2 (use GPT-5 Nano for metrics, GPT-5.2 Instant for text)
- Output: SQL dump for git-based team sharing
- Must pass 5-layer validation (distribution, correlation, progression, boundary, semantic)

Read TASKS.md for step-by-step implementation checklist.
Read VERIFICATION.md for data quality validation tests.
```

---

## Purpose

Generate high-quality synthetic employee data that enables realistic testing of SpringAIS matching engine, success pattern analysis, and career visualization features.

**Why this matters:**
- EY won't provide real employee data for 8-week competition
- Matching engine needs realistic skill distributions to provide accurate recommendations
- Success pattern analysis requires statistically valid employee populations
- Demo requires convincing, diverse employee profiles

**Success outcome:**
- 900 synthetic employees with realistic skills, metrics, and career histories
- Data passes all validation layers (no impossible patterns)
- Cost under $3 for generation
- Team can load identical data via git SQL dump

---

## Background: EY Organizational Structure

SpringAIS models EY's three distinct service lines, each with different career progressions:

### Service Line 1: Assurance (300 employees, 33%)

**Career Path:**
```
Staff → Senior → Manager → Senior Manager → Partner
(5 levels)
```

**Core Skills:** Accounting, Audit, GAAP, IFRS, Financial Reporting, Internal Controls

**Focus Areas (not all technical):**
1. **Audit (40%):** Financial statement audit, SOX compliance, testing procedures
2. **Financial Reporting (25%):** SEC reporting, GAAP compliance, disclosure preparation
3. **Risk & Compliance (20%):** Internal audit, risk assessment, compliance testing
4. **SEC Reporting (15%):** 10-K/10-Q preparation, XBRL, regulatory filings

**Role Breakdown:**
- Staff: 90 employees (30%)
- Senior: 75 employees (25%)
- Manager: 60 employees (20%)
- Senior Manager: 45 employees (15%)
- Partner: 30 employees (10%)

### Service Line 2: Tax (300 employees, 33%)

**Career Path:**
```
Staff → Senior → Manager → Senior Manager → Partner
(5 levels)
```

**Core Skills:** Tax Law, Tax Planning, Tax Compliance, Tax Research, IRC Knowledge

**Focus Areas:**
1. **Corporate Tax (35%):** C-corp tax, consolidated returns, tax provision
2. **International Tax (25%):** Transfer pricing, foreign tax credits, treaty analysis
3. **M&A Tax (20%):** Transaction structuring, due diligence, integration
4. **State & Local Tax (20%):** Nexus, apportionment, credits & incentives

**Role Breakdown:**
- Staff: 90 employees (30%)
- Senior: 75 employees (25%)
- Manager: 60 employees (20%)
- Senior Manager: 45 employees (15%)
- Partner: 30 employees (10%)

### Service Line 3: Consulting (300 employees, 34%)

**Career Path:**
```
Analyst → Associate → Sr Associate → Consultant →
Sr Consultant → Manager → Sr Manager → Director → Partner
(9 levels)
```

**Core Skills:** Strategy, Client Management, Project Management, Business Analysis

**Tech Focus Areas (50%):**
1. **Cloud & Infrastructure (15%):** AWS, Azure, cloud migration, DevOps
2. **Data & Analytics (15%):** Data engineering, BI, predictive analytics
3. **Cybersecurity (10%):** Security architecture, compliance, risk management
4. **AI/ML (10%):** LLMs, predictive modeling, automation

**Business Focus Areas (50%):**
1. **Strategy (12%):** Corporate strategy, market entry, competitive analysis
2. **Operations (12%):** Process improvement, supply chain, operational excellence
3. **Finance Transformation (13%):** ERP implementation, financial planning, automation
4. **M&A Advisory (13%):** Due diligence, integration, synergy realization

**Role Breakdown:**
- Analyst: 45 employees (15%)
- Associate: 42 employees (14%)
- Sr Associate: 39 employees (13%)
- Consultant: 36 employees (12%)
- Sr Consultant: 33 employees (11%)
- Manager: 30 employees (10%)
- Sr Manager: 27 employees (9%)
- Director: 24 employees (8%)
- Partner: 24 employees (8%)

**Total Role Types:** ~25 unique roles across 3 service lines

---

## Hybrid Generation Approach

### What We Hard-Code (Deterministic, $0 cost)

**Guaranteed correctness for:**
1. **Role templates** - titles, hierarchy, required skills
2. **Core skills by role** - from O*NET + EY job postings
3. **Experience ranges** - realistic years per role level
4. **Performance metric ranges** - by role level (higher roles → better metrics)
5. **Distribution targets** - employee counts per role

**Why hard-code:**
- Ensures baseline quality (no "Junior with 10 years experience")
- Guarantees skills match role requirements
- Zero cost
- Deterministic (reproducible)

### What We Use LLM For (Variation, ~$2 cost)

**GPT-5 Nano ($0.04 total):** Individual metric variation
- Generate specific utilization % within range (e.g., 75-85% for Manager)
- Generate billing rate within range (e.g., $180-220/hr for Manager)
- Add realistic variation to otherwise identical roles

**GPT-5.2 Instant ($1.50 total):** User-facing text quality
- Feedback themes (3-5 phrases per employee)
- Notable achievements (1 sentence per employee)
- Career history descriptions (optional, for senior roles)

**Cost Breakdown:**
```
900 employees × 50 tokens avg × $0.05/1M input = $0.04 (Nano)
900 employees × 150 tokens avg × $14/1M output = $1.89 (5.2 text)
Total: ~$2 (with buffer)
```

---

## Role Templates (Sample)

### Example: Assurance Senior (Audit Focus)

```python
{
  "service_line": "Assurance",
  "role": "Senior",
  "role_level": 2,
  "focus_area": "Audit",
  "required_skills": [
    "Accounting", "Audit", "GAAP", "Financial Reporting",
    "Internal Controls", "Excel", "Attention to Detail"
  ],
  "optional_skills": [  # 30% of employees get specialization
    "SOX Compliance", "Testing Procedures", "Audit Documentation"
  ],
  "experience_range": [2.0, 4.0],  # years
  "performance_ranges": {
    "utilization": [78, 88],  # %
    "billing_rate": [140, 180],  # $/hr
    "realization": [88, 95],  # %
    "quality_score": [3.8, 4.3],  # out of 5
    "training_hours": [30, 50],  # per year
    "client_feedback": [4.0, 4.6]  # out of 5
  }
}
```

### Example: Consulting Manager (Cloud Focus)

```python
{
  "service_line": "Consulting",
  "role": "Manager",
  "role_level": 6,
  "focus_area": "Cloud & Infrastructure",
  "required_skills": [
    "Strategy", "Client Management", "Project Management",
    "AWS", "Azure", "Cloud Architecture", "DevOps"
  ],
  "optional_skills": [  # 30% get specialization
    "Kubernetes", "Terraform", "CI/CD", "Security"
  ],
  "experience_range": [7.0, 10.0],
  "performance_ranges": {
    "utilization": [72, 85],
    "billing_rate": [220, 280],
    "realization": [90, 97],
    "quality_score": [4.2, 4.7],
    "training_hours": [40, 70],
    "client_feedback": [4.3, 4.8]
  }
}
```

---

## 5-Layer Validation Strategy

### Layer 1: Distribution Validation

**Purpose:** Ensure employee counts match targets

**Tests:**
- Total employees = 900 ✅
- Assurance: 300 (33%) ✅
- Tax: 300 (33%) ✅
- Consulting: 300 (34%) ✅
- Each role type has expected count ±5% ✅

**Example validation:**
```python
assert len(employees) == 900
assert 285 <= len([e for e in employees if e.service_line == "Assurance"]) <= 315
assert all(20 <= role_count <= 100 for role_count in employees_per_role.values())
```

### Layer 2: Correlation Validation

**Purpose:** Higher roles have better metrics

**Tests:**
- Avg utilization increases with role_level ✅
- Avg billing_rate increases with role_level ✅
- Avg quality_score increases with role_level ✅
- Senior roles have higher training hours ✅

**Example validation:**
```python
by_level = employees.groupby('role_level').agg({
  'utilization': 'mean',
  'billing_rate': 'mean',
  'quality_score': 'mean'
})

# Check monotonic increase (allow small dips)
assert by_level['billing_rate'].is_monotonic_increasing
assert by_level['quality_score'].diff().fillna(0).min() >= -0.1  # allow 0.1 dip
```

### Layer 3: Progression Validation

**Purpose:** No impossible career patterns

**Tests:**
- Years of experience aligns with role level ✅
- No "Staff with 15 years experience" ✅
- No "Partner with 2 years experience" ✅
- Experience ranges don't overlap unrealistically ✅

**Example validation:**
```python
for employee in employees:
    if employee.role_level == 1:  # Staff
        assert 0 <= employee.years_experience <= 2.5
    elif employee.role_level == 5:  # Senior Manager (Assurance/Tax)
        assert 8 <= employee.years_experience <= 15
    # etc.
```

### Layer 4: Boundary Validation

**Purpose:** All values within realistic bounds

**Tests:**
- Utilization: 50-100% ✅
- Billing rate: $80-500/hr ✅
- Quality score: 1.0-5.0 ✅
- Training hours: 0-120/year ✅
- All required skills present for role ✅

**Example validation:**
```python
assert employees['utilization'].between(50, 100).all()
assert employees['billing_rate'].between(80, 500).all()
assert all(
    set(role_template.required_skills).issubset(emp.skills)
    for emp, role_template in zip(employees, templates)
)
```

### Layer 5: Semantic Validation

**Purpose:** Skills and focus areas make sense

**Tests:**
- Assurance employees have accounting-related skills ✅
- Tax employees have tax-related skills ✅
- Cloud consultants have AWS/Azure, not tax skills ✅
- Feedback themes match role type ✅

**Example validation:**
```python
assurance_employees = [e for e in employees if e.service_line == "Assurance"]
assert all("Accounting" in e.skills or "Audit" in e.skills for e in assurance_employees)

cloud_consultants = [e for e in employees if e.focus_area == "Cloud & Infrastructure"]
assert all("AWS" in e.skills or "Azure" in e.skills for e in cloud_consultants)
assert not any("Tax Law" in e.skills for e in cloud_consultants)
```

---

## O*NET API Integration

**Purpose:** Get standardized skill taxonomy for roles

**API Endpoint:** `https://services.onetcenter.org/ws/`
**Documentation:** https://services.onetcenter.org/reference/
**Authentication:** API key (free, register at onetcenter.org)

### Relevant O*NET Occupations

**Assurance:**
- 13-2011.00 - Accountants and Auditors
- 11-2011.00 - Financial Managers

**Tax:**
- 13-2081.00 - Tax Preparers
- 23-1011.00 - Lawyers (for tax law)

**Consulting:**
- 13-1111.00 - Management Analysts
- 15-1211.00 - Computer Systems Analysts
- 11-1011.00 - Chief Executives (for strategy)

### Sample API Call

```python
import requests

def get_onet_skills(occupation_code):
    """Fetch skills for O*NET occupation"""
    url = f"https://services.onetcenter.org/ws/online/occupations/{occupation_code}/summary/skills"
    headers = {"Authorization": f"Basic {ONET_API_KEY}"}

    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        data = response.json()
        return [skill['element_name'] for skill in data.get('skill', [])]
    return []

# Example: Get skills for Accountants/Auditors
accountant_skills = get_onet_skills("13-2011.00")
# Returns: ["Critical Thinking", "Active Listening", "Mathematics", ...]
```

**Usage in generation:**
1. Fetch O*NET skills for each service line's base occupation
2. Merge with EY-specific skills (from job postings)
3. Use as required_skills in role templates
4. Ensures skills are real, standardized, and industry-recognized

---

## Git-Based Team Sharing

**Purpose:** All 4 team members have identical synthetic data

### One-Time Setup (Already done in STEP-1-SETUP)

```bash
# Create data-dumps branch (separate from main, never merge)
git checkout -b data-dumps
git push -u origin data-dumps
```

### Data Generator Workflow

```bash
# 1. Generate synthetic data (this block's output)
python scripts/generate_synthetic_data.py --output data/synthetic_employees.sql

# 2. Switch to data-dumps branch
git checkout data-dumps

# 3. Commit SQL dump
git add data/synthetic_employees.sql
git commit -m "Generate 900 employees - $(date +%Y-%m-%d)"
git push

# 4. Return to main
git checkout main
```

### Teammate Workflow

```bash
# 1. Fetch data-dumps branch
git checkout data-dumps
git pull

# 2. Load into local database
docker exec -i springais-postgres psql -U postgres springais < data/synthetic_employees.sql

# 3. Verify
docker exec -it springais-postgres psql -U postgres springais -c "SELECT COUNT(*) FROM employees;"
# Expected: 900

# 4. Return to main
git checkout main
```

**File size:** ~10-50MB SQL dump (text-based, compresses well)

---

## Technical Implementation Details

### Script Structure

**File:** `scripts/generate_synthetic_data.py`

**Modules:**
1. **Role Templates** (`role_templates.py`) - Hard-coded definitions
2. **O*NET Client** (`onet_client.py`) - Fetch standardized skills
3. **LLM Generator** (`llm_generator.py`) - GPT-5 Nano + 5.2 calls
4. **Validators** (`validators.py`) - 5-layer validation
5. **SQL Exporter** (`sql_exporter.py`) - Generate INSERT statements
6. **Main Script** (`generate_synthetic_data.py`) - Orchestration

### Dependencies

```python
# requirements.txt additions
openai==1.10.0  # Already in project
requests==2.31.0  # For O*NET API
pydantic==2.5.3  # Already in project (for validation)
python-dotenv==1.0.0  # Already in project
```

### Environment Variables

```bash
# .env additions for this block
OPENAI_API_KEY=sk-...  # Already configured
ONET_API_KEY=your_onet_key_here  # Register at onetcenter.org
```

### Output Format

**SQL dump structure:**
```sql
-- File: data/synthetic_employees.sql
-- Generated: 2026-01-06
-- Employees: 900 (Assurance: 300, Tax: 300, Consulting: 300)

-- Clear existing data
TRUNCATE TABLE employees CASCADE;

-- Insert Assurance employees
INSERT INTO employees (id, service_line, current_role, role_level, years_experience, skills, performance_metrics, career_history, feedback_themes, notable_achievement)
VALUES
('EMP-ASR-0001', 'Assurance', 'Senior', 2, 3.2, '["Accounting","Audit","GAAP","Financial Reporting","Internal Controls","Excel","Attention to Detail"]'::jsonb, '{"utilization":82,"billing_rate":165,"realization":91,"quality_score":4.1,"training_hours":42,"client_feedback":4.3}'::jsonb, NULL, ARRAY['detail-oriented','thorough','reliable'], 'Led audit of Fortune 500 retail client'),
-- ... 299 more Assurance employees

-- Insert Tax employees
INSERT INTO employees (id, service_line, current_role, ...)
VALUES
-- ... 300 Tax employees

-- Insert Consulting employees
INSERT INTO employees (id, service_line, current_role, ...)
VALUES
-- ... 300 Consulting employees

-- Verify counts
SELECT service_line, COUNT(*) FROM employees GROUP BY service_line;
```

---

## Mock Data for Independent Testing

**Problem:** Other Step 2 blocks depend on employee data but can't wait for this block

**Solution:** Each block creates its own tiny mock dataset for unit testing

**Example mock for Block E (Matching Engine):**
```python
# tests/mock_data.py
MOCK_EMPLOYEES = [
    {
        "id": "MOCK-001",
        "service_line": "Consulting",
        "current_role": "Manager",
        "skills": ["Strategy", "Client Management", "AWS"],
        "performance_metrics": {"quality_score": 4.5}
    },
    # ... 10-20 mock employees for testing
]
```

**Integration in Step 3:** Replace mocks with real synthetic data from this block

---

## References

**Related Documentation:**
- `_bmad-output/data-generation-plan.md` - Detailed generation strategy
- `_bmad-output/tech-stack.md` - Architecture overview (Section: Data Strategy)
- `_bmad-output/architecture-updates-2026.md` - Hybrid generation rationale
- `implementation-tracking/STEP-1-SETUP/CONTEXT.md` - Database schema

**O*NET Resources:**
- O*NET Online: https://www.onetonline.org/
- API Documentation: https://services.onetcenter.org/reference/
- Skill Taxonomy: https://www.onetcenter.org/taxonomy.html

**EY Career Pages (for validation):**
- EY Careers: https://www.ey.com/en_us/careers
- Assurance: https://www.ey.com/en_us/careers/assurance
- Tax: https://www.ey.com/en_us/careers/tax
- Consulting: https://www.ey.com/en_us/careers/consulting

---

## Success Criteria

**This block is complete when:**

1. ✅ Script generates 900 employees in ~2 minutes
2. ✅ Total cost under $3
3. ✅ All 5 validation layers pass
4. ✅ SQL dump loads into PostgreSQL without errors
5. ✅ SQL dump committed to data-dumps branch
6. ✅ Team members can load data via git pull
7. ✅ Query: `SELECT COUNT(*) FROM employees;` returns 900
8. ✅ Documentation shows how to regenerate if needed

**Data Quality Checklist:**
- [ ] 300 employees per service line (±5%)
- [ ] All role types have 20+ employees
- [ ] Higher roles have better average metrics
- [ ] No impossible experience/role combinations
- [ ] All employees have required skills for their role
- [ ] Feedback themes are realistic and varied
- [ ] Distribution matches EY's actual structure (from careers page)

---

## AI Auto-Update Instructions

When you complete a task in TASKS.md:

1. **Update the task checkbox:**
   ```markdown
   - [x] Task 1: Define role templates for all 25 roles
   ```

2. **Update PROJECT-STATUS.md:**
   ```markdown
   | **A** | Synthetic Data Generation | 🔄 In Progress | [Your name] | 3/12 tasks | 2-3 days | #data #python #llm |
   ```

3. **Update this CONTEXT.md if you discover:**
   - Missing role types
   - Better skill sources
   - Cost optimization opportunities
   - Validation edge cases

4. **When block complete:**
   - Change status to ✅ Completed in PROJECT-STATUS.md
   - Update "Overall Progress" section
   - Add note: "Block A complete - synthetic data available for all Step 2 blocks"

---

**Last Updated:** 2026-01-06
**Status:** Ready for development
**Blocking:** None (can start after STEP-1-SETUP)
**Blocked by:** STEP-1-SETUP must be complete (database schema exists)
