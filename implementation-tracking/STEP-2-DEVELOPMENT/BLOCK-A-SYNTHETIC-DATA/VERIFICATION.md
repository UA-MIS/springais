# BLOCK A: Synthetic Data Generation - VERIFICATION

**Block:** BLOCK-A-SYNTHETIC-DATA
**Purpose:** Verify 900 synthetic employees meet quality standards and enable realistic testing

---

## Automated Verification Script

Run this script to verify data quality:

**File:** `scripts/verify_synthetic_data.sh`

```bash
#!/bin/bash

echo "🔍 Verifying Synthetic Employee Data..."
echo

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILED=0
WARNINGS=0

# Test 1: Total Count
echo "1. Checking total employee count..."
COUNT=$(docker exec springais-postgres psql -U postgres springais -t -c "SELECT COUNT(*) FROM employees;")
if [ "$COUNT" -eq 900 ]; then
    echo -e "${GREEN}✓${NC} Total employees: 900"
else
    echo -e "${RED}✗${NC} Total employees: $COUNT (expected 900)"
    FAILED=$((FAILED + 1))
fi

# Test 2: Service Line Distribution
echo
echo "2. Checking service line distribution..."
ASR=$(docker exec springais-postgres psql -U postgres springais -t -c "SELECT COUNT(*) FROM employees WHERE service_line = 'Assurance';")
TAX=$(docker exec springais-postgres psql -U postgres springais -t -c "SELECT COUNT(*) FROM employees WHERE service_line = 'Tax';")
CON=$(docker exec springais-postgres psql -U postgres springais -t -c "SELECT COUNT(*) FROM employees WHERE service_line = 'Consulting';")

if [ "$ASR" -ge 285 ] && [ "$ASR" -le 315 ]; then
    echo -e "${GREEN}✓${NC} Assurance: $ASR (target 300 ±5%)"
else
    echo -e "${RED}✗${NC} Assurance: $ASR (expected 285-315)"
    FAILED=$((FAILED + 1))
fi

if [ "$TAX" -ge 285 ] && [ "$TAX" -le 315 ]; then
    echo -e "${GREEN}✓${NC} Tax: $TAX (target 300 ±5%)"
else
    echo -e "${RED}✗${NC} Tax: $TAX (expected 285-315)"
    FAILED=$((FAILED + 1))
fi

if [ "$CON" -ge 285 ] && [ "$CON" -le 315 ]; then
    echo -e "${GREEN}✓${NC} Consulting: $CON (target 300 ±5%)"
else
    echo -e "${RED}✗${NC} Consulting: $CON (expected 285-315)"
    FAILED=$((FAILED + 1))
fi

# Test 3: Role Distribution
echo
echo "3. Checking role distribution..."
MIN_ROLE_COUNT=$(docker exec springais-postgres psql -U postgres springais -t -c "SELECT MIN(cnt) FROM (SELECT current_role, COUNT(*) as cnt FROM employees GROUP BY current_role) sub;")
if [ "$MIN_ROLE_COUNT" -ge 20 ]; then
    echo -e "${GREEN}✓${NC} All roles have ≥20 employees (min: $MIN_ROLE_COUNT)"
else
    echo -e "${YELLOW}⚠${NC} Some roles have <20 employees (min: $MIN_ROLE_COUNT)"
    WARNINGS=$((WARNINGS + 1))
fi

# Test 4: Experience Correlation
echo
echo "4. Checking experience increases with role level..."
EXP_CORR=$(docker exec springais-postgres psql -U postgres springais -t -c "SELECT CORR(role_level, years_experience) FROM employees;")
if (( $(echo "$EXP_CORR > 0.8" | bc -l) )); then
    echo -e "${GREEN}✓${NC} Experience-level correlation: $EXP_CORR (>0.8)"
else
    echo -e "${RED}✗${NC} Experience-level correlation: $EXP_CORR (expected >0.8)"
    FAILED=$((FAILED + 1))
fi

# Test 5: Performance Metrics by Level
echo
echo "5. Checking performance metrics increase with level..."
BILLING_TREND=$(docker exec springais-postgres psql -U postgres springais -t -c "
    SELECT
        CASE
            WHEN MAX(avg_rate) > MIN(avg_rate) * 2 THEN 'PASS'
            ELSE 'FAIL'
        END
    FROM (
        SELECT role_level, AVG((performance_metrics->>'billing_rate')::numeric) as avg_rate
        FROM employees
        GROUP BY role_level
    ) sub;
")
if [ "$BILLING_TREND" == " PASS" ]; then
    echo -e "${GREEN}✓${NC} Billing rates increase with role level"
else
    echo -e "${RED}✗${NC} Billing rates don't show expected trend"
    FAILED=$((FAILED + 1))
fi

# Test 6: Required Skills Present
echo
echo "6. Checking required skills present..."
MISSING_SKILLS=$(docker exec springais-postgres psql -U postgres springais -t -c "
    SELECT COUNT(*) FROM employees
    WHERE service_line = 'Assurance'
      AND NOT (skills::jsonb @> '[\"Accounting\"]'::jsonb OR skills::jsonb @> '[\"Audit\"]'::jsonb);
")
if [ "$MISSING_SKILLS" -eq 0 ]; then
    echo -e "${GREEN}✓${NC} All Assurance employees have Accounting or Audit"
else
    echo -e "${RED}✗${NC} $MISSING_SKILLS Assurance employees missing core skills"
    FAILED=$((FAILED + 1))
fi

# Test 7: Boundary Validation
echo
echo "7. Checking value boundaries..."
OUT_OF_BOUNDS=$(docker exec springais-postgres psql -U postgres springais -t -c "
    SELECT COUNT(*) FROM employees
    WHERE (performance_metrics->>'utilization')::numeric NOT BETWEEN 50 AND 100
       OR (performance_metrics->>'billing_rate')::numeric NOT BETWEEN 80 AND 500
       OR (performance_metrics->>'quality_score')::numeric NOT BETWEEN 1.0 AND 5.0;
")
if [ "$OUT_OF_BOUNDS" -eq 0 ]; then
    echo -e "${GREEN}✓${NC} All metrics within realistic bounds"
else
    echo -e "${RED}✗${NC} $OUT_OF_BOUNDS employees have out-of-bounds metrics"
    FAILED=$((FAILED + 1))
fi

# Test 8: Data Variety
echo
echo "8. Checking data variety..."
UNIQUE_FEEDBACK=$(docker exec springais-postgres psql -U postgres springais -t -c "
    SELECT COUNT(DISTINCT notable_achievement) FROM employees;
")
if [ "$UNIQUE_FEEDBACK" -ge 700 ]; then
    echo -e "${GREEN}✓${NC} High variety in achievements ($UNIQUE_FEEDBACK unique)"
elif [ "$UNIQUE_FEEDBACK" -ge 500 ]; then
    echo -e "${YELLOW}⚠${NC} Moderate variety in achievements ($UNIQUE_FEEDBACK unique)"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${RED}✗${NC} Low variety in achievements ($UNIQUE_FEEDBACK unique, expected >700)"
    FAILED=$((FAILED + 1))
fi

# Test 9: Focus Area Distribution
echo
echo "9. Checking focus area distribution..."
FOCUS_COUNT=$(docker exec springais-postgres psql -U postgres springais -t -c "
    SELECT COUNT(DISTINCT (performance_metrics->>'focus_area')) FROM employees;
")
if [ "$FOCUS_COUNT" -ge 12 ]; then
    echo -e "${GREEN}✓${NC} Multiple focus areas represented ($FOCUS_COUNT unique)"
else
    echo -e "${YELLOW}⚠${NC} Limited focus area variety ($FOCUS_COUNT unique, expected ≥12)"
    WARNINGS=$((WARNINGS + 1))
fi

# Test 10: SQL Dump Exists
echo
echo "10. Checking SQL dump in git..."
git checkout data-dumps 2>/dev/null
if [ -f "data/synthetic_employees.sql" ]; then
    SIZE=$(du -h data/synthetic_employees.sql | cut -f1)
    echo -e "${GREEN}✓${NC} SQL dump exists in data-dumps branch ($SIZE)"
else
    echo -e "${RED}✗${NC} SQL dump not found in data-dumps branch"
    FAILED=$((FAILED + 1))
fi
git checkout main 2>/dev/null

# Summary
echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FAILED -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo "Synthetic data meets all quality standards."
    exit 0
elif [ $FAILED -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s)${NC}"
    echo "Data is usable but could be improved."
    exit 0
else
    echo -e "${RED}❌ $FAILED check(s) failed, $WARNINGS warning(s)${NC}"
    echo "Please fix the issues above before proceeding."
    exit 1
fi
```

**Run:** `bash scripts/verify_synthetic_data.sh`

---

## Manual Verification Steps

### 1. Generation Cost Verification

**Check OpenAI dashboard:**

```
1. Go to https://platform.openai.com/usage
2. Filter date range to generation date
3. Check total cost for GPT-5 Nano + GPT-5.2 Instant
```

**Expected:**

- GPT-5 Nano usage: ~$0.04
- GPT-5.2 Instant usage: ~$1.50-2.00
- Total: <$3.00

**✅ Pass Criteria:** Total cost ≤$3.00

---

### 2. Distribution Verification

**Check service line counts:**

```sql
SELECT service_line, COUNT(*) as count,
       ROUND(COUNT(*) * 100.0 / 900, 1) as percentage
FROM employees
GROUP BY service_line
ORDER BY service_line;
```

**Expected:**

```
 service_line | count | percentage
--------------+-------+------------
 Assurance    |   300 |       33.3
 Consulting   |   300 |       33.3
 Tax          |   300 |       33.3
```

**Check role distribution:**

```sql
SELECT service_line, current_role, COUNT(*) as count
FROM employees
GROUP BY service_line, current_role
ORDER BY service_line, role_level;
```

**Expected (Assurance/Tax):**

- Staff: ~90 (30%)
- Senior: ~75 (25%)
- Manager: ~60 (20%)
- Senior Manager: ~45 (15%)
- Partner: ~30 (10%)

**✅ Pass Criteria:**

- Each service line: 285-315 employees (±5%)
- Each role type: ≥20 employees
- Distribution matches targets ±10%

---

### 3. Correlation Verification

**Check billing rate increases with level:**

```sql
SELECT role_level,
       MIN((performance_metrics->>'billing_rate')::numeric) as min_rate,
       AVG((performance_metrics->>'billing_rate')::numeric) as avg_rate,
       MAX((performance_metrics->>'billing_rate')::numeric) as max_rate
FROM employees
GROUP BY role_level
ORDER BY role_level;
```

**Expected:**

- Level 1 avg: ~$100-120/hr
- Level 5 avg: ~$250-300/hr
- Level 9 avg: ~$400-450/hr
- Monotonic increase (each level > previous)

**Check quality score increases:**

```sql
SELECT role_level,
       AVG((performance_metrics->>'quality_score')::numeric) as avg_quality,
       AVG((performance_metrics->>'utilization')::numeric) as avg_util
FROM employees
GROUP BY role_level
ORDER BY role_level;
```

**Expected:**

- Quality scores increase from ~3.5 (Staff) to ~4.7 (Partner)
- Utilization relatively stable (75-85%)

**✅ Pass Criteria:**

- Billing rate shows monotonic increase
- Quality score correlation >0.8 with role_level
- No level has lower avg metrics than previous level

---

### 4. Progression Verification

**Check experience aligns with role:**

```sql
SELECT current_role, role_level,
       MIN(years_experience) as min_exp,
       AVG(years_experience) as avg_exp,
       MAX(years_experience) as max_exp
FROM employees
GROUP BY current_role, role_level
ORDER BY role_level;
```

**Expected:**

- Staff (L1): 0-2 years
- Senior (L2): 2-4 years
- Manager (L3): 5-8 years
- Senior Manager (L4/L5): 8-15 years
- Partner (L5+): 12-20 years

**Check for impossible patterns:**

```sql
-- Should return 0 rows
SELECT id, current_role, role_level, years_experience
FROM employees
WHERE (role_level = 1 AND years_experience > 3)  -- Staff with >3 years
   OR (role_level >= 5 AND years_experience < 7)  -- Senior Manager with <7 years
   OR (years_experience > 30);  -- Anyone with >30 years
```

**✅ Pass Criteria:**

- Experience ranges don't overlap unrealistically
- Zero employees with impossible experience/role combinations
- Average experience increases monotonically with level

---

### 5. Semantic Validation

**Check Assurance skills:**

```sql
SELECT id, skills
FROM employees
WHERE service_line = 'Assurance'
  AND NOT (skills::jsonb @> '[\"Accounting\"]'::jsonb
       OR skills::jsonb @> '[\"Audit\"]'::jsonb)
LIMIT 10;
```

**Expected:** 0 rows (all have Accounting or Audit)

**Check Tax skills:**

```sql
SELECT id, skills
FROM employees
WHERE service_line = 'Tax'
  AND NOT (skills::jsonb @> '[\"Tax Law\"]'::jsonb
       OR skills::jsonb @> '[\"Tax Planning\"]'::jsonb)
LIMIT 10;
```

**Expected:** 0 rows (all have Tax Law or Tax Planning)

**Check cross-contamination:**

```sql
-- Cloud consultants shouldn't have Tax skills
SELECT id, current_role, skills
FROM employees
WHERE service_line = 'Consulting'
  AND (performance_metrics->>'focus_area') = 'Cloud & Infrastructure'
  AND skills::jsonb @> '[\"Tax Law\"]'::jsonb
LIMIT 10;
```

**Expected:** 0 rows (no cross-contamination)

**✅ Pass Criteria:**

- All employees have required skills for their service line
- No cross-contamination (Tax skills in Cloud consultants, etc.)
- Skills match focus area (Cloud → AWS/Azure, Audit → SOX/GAAP)

---

### 6. Data Variety Verification

**Check unique achievements:**

```sql
SELECT COUNT(*) as total,
       COUNT(DISTINCT notable_achievement) as unique_achievements,
       ROUND(COUNT(DISTINCT notable_achievement) * 100.0 / COUNT(*), 1) as uniqueness_pct
FROM employees;
```

**Expected:**

- Uniqueness: >75% (>675 unique out of 900)

**Check feedback theme variety:**

```sql
SELECT unnest(feedback_themes) as theme, COUNT(*) as frequency
FROM employees
GROUP BY theme
ORDER BY frequency DESC
LIMIT 20;
```

**Expected:**

- Top themes: <10% of total employees
- Wide variety of themes (50+ unique)

**Sample employee quality:**

```sql
SELECT id, service_line, current_role, skills, feedback_themes, notable_achievement
FROM employees
WHERE service_line = 'Consulting' AND current_role = 'Manager'
LIMIT 5;
```

**Manual check:**

- Achievements are realistic and specific
- Feedback themes match role level (Partners → "strategic", Staff → "detail-oriented")
- No gibberish or repetitive text

**✅ Pass Criteria:**

- > 75% unique achievements
- > 50 unique feedback themes
- No obviously bad LLM output (gibberish, repetition)

---

### 7. Boundary Verification

**Check all metrics in bounds:**

```sql
SELECT
    COUNT(CASE WHEN (performance_metrics->>'utilization')::numeric NOT BETWEEN 50 AND 100 THEN 1 END) as util_violations,
    COUNT(CASE WHEN (performance_metrics->>'billing_rate')::numeric NOT BETWEEN 80 AND 500 THEN 1 END) as rate_violations,
    COUNT(CASE WHEN (performance_metrics->>'quality_score')::numeric NOT BETWEEN 1.0 AND 5.0 THEN 1 END) as quality_violations,
    COUNT(CASE WHEN (performance_metrics->>'training_hours')::numeric NOT BETWEEN 0 AND 120 THEN 1 END) as training_violations,
    COUNT(CASE WHEN (performance_metrics->>'realization')::numeric NOT BETWEEN 70 AND 100 THEN 1 END) as real_violations
FROM employees;
```

**Expected:** All zeros

**Check outliers:**

```sql
WITH stats AS (
    SELECT
        AVG((performance_metrics->>'billing_rate')::numeric) as avg_rate,
        STDDEV((performance_metrics->>'billing_rate')::numeric) as std_rate
    FROM employees
)
SELECT id, current_role, (performance_metrics->>'billing_rate')::numeric as rate
FROM employees, stats
WHERE (performance_metrics->>'billing_rate')::numeric > avg_rate + 3 * std_rate
   OR (performance_metrics->>'billing_rate')::numeric < avg_rate - 3 * std_rate;
```

**Expected:** <5 employees (outliers are OK, but not too many)

**✅ Pass Criteria:**

- Zero hard violations (values outside possible ranges)
- <1% soft outliers (>3 std devs)

---

### 8. Git Workflow Verification

**Check SQL dump committed:**

```bash
git checkout data-dumps
ls -lh data/synthetic_employees.sql
```

**Expected:**

- File exists
- Size: 10-50MB
- Recent timestamp

**Check validation report:**

```bash
cat data/validation_report.txt
```

**Expected:**

- All 5 validation layers: PASS
- Distribution tables
- Cost breakdown

**Test teammate workflow:**

```bash
# On different machine or fresh clone
git clone <repo-url> springais-test
cd springais-test
git checkout data-dumps
git pull

# Load data
docker exec -i springais-postgres psql -U postgres springais < data/synthetic_employees.sql

# Verify
docker exec -it springais-postgres psql -U postgres springais -c "SELECT COUNT(*) FROM employees;"
# Expected: 900
```

**✅ Pass Criteria:**

- SQL dump in data-dumps branch
- Validation report shows all PASS
- Team members can load via git pull

---

### 9. Generation Performance Verification

**Check generation time:**

```bash
time python scripts/generate_synthetic_data.py --output data/synthetic_employees.sql
```

**Expected:**

- Total time: <5 minutes
- Progress bar shows smooth progress

**Check script logging:**

```
Expected output:
  Loading role templates... (25 roles)
  Fetching O*NET skills... (3 occupations)
  Generating employees... [████████████████████] 900/900
  Calling GPT-5 Nano for metrics... (9 batches of 100)
  Calling GPT-5.2 Instant for feedback... (9 batches of 100)
  Running validation layers...
    ✓ Layer 1: Distribution (PASS)
    ✓ Layer 2: Correlation (PASS)
    ✓ Layer 3: Progression (PASS)
    ✓ Layer 4: Boundaries (PASS)
    ✓ Layer 5: Semantics (PASS)
  Exporting SQL... data/synthetic_employees.sql (35.2 MB)

  Cost breakdown:
    GPT-5 Nano: $0.04
    GPT-5.2 Instant: $1.87
    Total: $1.91

  Generated 900 employees in 3m 47s
```

**✅ Pass Criteria:**

- Generation completes in <5 minutes
- All validation layers pass automatically
- Clear cost breakdown shown

---

### 10. Integration Readiness Verification

**Test data works with other blocks:**

**For Block E (Matching Engine):**

```sql
-- Check embeddings table can reference employees
SELECT COUNT(*) FROM employees e
WHERE EXISTS (
    SELECT 1 FROM skill_embeddings se
    WHERE se.skill_text = ANY(SELECT jsonb_array_elements_text(e.skills::jsonb))
);
```

**For Block F (Success Patterns):**

```sql
-- Check can query success patterns by role
SELECT current_role,
       AVG((performance_metrics->>'quality_score')::numeric) as avg_quality,
       jsonb_agg(DISTINCT jsonb_array_elements(skills::jsonb)) as common_skills
FROM employees
WHERE service_line = 'Consulting'
GROUP BY current_role;
```

**For Block G (Skill Extraction):**

```sql
-- Check skills format is parseable
SELECT id, jsonb_array_length(skills::jsonb) as skill_count
FROM employees
WHERE jsonb_array_length(skills::jsonb) < 3;
-- Expected: 0 rows (all employees have ≥3 skills)
```

**✅ Pass Criteria:**

- Other blocks can query employee data
- JSON fields are properly formatted
- Foreign key relationships work (if applicable)

---

## Troubleshooting Common Issues

### Issue: "Correlation validation fails"

**Symptom:** Layer 2 validation fails, metrics don't increase with level

**Diagnosis:**

```sql
SELECT role_level, AVG((performance_metrics->>'billing_rate')::numeric)
FROM employees
GROUP BY role_level
ORDER BY role_level;
```

**Solution:**

- Check role templates - higher levels should have higher min/max ranges
- Check LLM prompt - ensure it respects the provided ranges
- Regenerate with corrected templates

---

### Issue: "Some roles have <20 employees"

**Symptom:** Distribution validation warning

**Diagnosis:**

```sql
SELECT current_role, COUNT(*)
FROM employees
GROUP BY current_role
HAVING COUNT(*) < 20;
```

**Solution:**

- Adjust distribution targets in generation script
- Ensure rounding doesn't create gaps
- Regenerate data

---

### Issue: "High cost ($5-10 instead of $2)"

**Symptom:** OpenAI dashboard shows unexpected spending

**Diagnosis:**

- Check which model was used (should be GPT-5 Nano for metrics)
- Check batch size (should be 100 employees per call)
- Check token usage per call

**Solution:**

- Verify model selection in code: `model="gpt-5-nano"`
- Implement batching if missing
- Reduce prompt verbosity
- Add caching for similar roles

---

### Issue: "SQL dump fails to load"

**Symptom:** `psql` error when loading SQL dump

**Diagnosis:**

```bash
psql springais < data/synthetic_employees.sql 2>&1 | head -20
```

**Common errors:**

- Syntax error in SQL
- Duplicate key violation
- JSON parse error

**Solution:**

- Test SQL export with small dataset first (10 employees)
- Validate JSON before export: `json.loads(json.dumps(data))`
- Ensure IDs are unique
- Run `TRUNCATE TABLE employees CASCADE;` before loading

---

## Final Checklist

Before marking BLOCK-A as complete:

- [ ] `python scripts/generate_synthetic_data.py` runs without errors
- [ ] Generation completes in <5 minutes
- [ ] Total cost <$3 (verified in OpenAI dashboard)
- [ ] SQL dump generated: `data/synthetic_employees.sql`
- [ ] Validation report generated: `data/validation_report.txt`
- [ ] All 5 validation layers pass
- [ ] 900 employees in database: `SELECT COUNT(*) FROM employees;`
- [ ] Distribution correct: ~300 per service line
- [ ] All roles have ≥20 employees
- [ ] Metrics increase with role level
- [ ] No impossible patterns (experience vs role)
- [ ] All employees have required skills
- [ ] High variety in achievements and feedback (>75% unique)
- [ ] SQL dump committed to data-dumps branch
- [ ] Team members can load via `git checkout data-dumps && git pull`
- [ ] Documentation includes regeneration instructions

---

## Success Criteria Met

If all above checks pass:

1. ✅ Update `TASKS.md` - all 12 tasks checked
2. ✅ Update `PROJECT-STATUS.md`:
   - Status: 🔄 → ✅
   - Progress: 12/12 tasks
3. ✅ Update Overall Progress section
4. ✅ Commit changes:
   ```bash
   git add .
   git commit -m "✅ Complete BLOCK-A: Synthetic data generation - 900 employees"
   git push
   ```
5. ✅ Notify team: "Block A complete! 900 employees available in data-dumps branch. Cost: $X.XX"

---

**Last Updated:** 2026-01-06
**Status:** Ready for verification
