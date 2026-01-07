# BLOCK A: Synthetic Data Generation - TASKS

**Block:** BLOCK-A-SYNTHETIC-DATA
**Total Tasks:** 12
**Completed:** 0/12 (0%)

---

## ⚠️ IMPORTANT: Update Instructions

**When you complete a task:**
1. Check the box: `- [x] Task name`
2. Update the "Completed" count at the top
3. Update `PROJECT-STATUS.md`:
   - Find "Block A" row in Step 2 table
   - Update Progress column (e.g., "3/12 tasks")

**When ALL tasks complete:**
1. ✅ Run all verification steps in `VERIFICATION.md`
2. ✅ Change status in `PROJECT-STATUS.md` from ⏸️ to ✅
3. ✅ Update Progress to "12/12 tasks (100%)"
4. ✅ Update "Overall Progress" section
5. ✅ After verification passes, commit changes (do NOT commit until verification is complete)

See `CONTEXT.md` section "Update Instructions (For AI)" for full details.

---

## Progress Tracker

### Phase 1: Setup & Research (Tasks 1-2)

- [ ] **Task 1:** Define role templates for all 25 roles
  - [ ] Create `role_templates.py` with template class structure
  - [ ] Define 5 Assurance roles (Staff → Partner)
  - [ ] Define 5 Tax roles (Staff → Partner)
  - [ ] Define 9 Consulting roles (Analyst → Partner)
  - [ ] Add all 4 focus areas per service line
  - [ ] Document required_skills vs optional_skills for each role
  - [ ] Set experience_range for each role level
  - [ ] Set performance_ranges (6 metrics per role)

- [ ] **Task 2:** Set up O*NET API integration
  - [ ] Register for O*NET API key at onetcenter.org
  - [ ] Add `ONET_API_KEY` to `.env`
  - [ ] Create `onet_client.py` module
  - [ ] Write `get_skills(occupation_code)` function
  - [ ] Map EY service lines to O*NET occupation codes
  - [ ] Fetch and cache skills for: Accountants (13-2011.00), Tax Preparers (13-2081.00), Management Analysts (13-1111.00)
  - [ ] Merge O*NET skills with EY-specific skills
  - [ ] Validate skills make sense for each service line

### Phase 2: LLM Integration (Tasks 3-4)

- [ ] **Task 3:** Create GPT-5 Nano metric generator
  - [ ] Create `llm_generator.py` module
  - [ ] Write `generate_metrics(role_template)` function using GPT-5 Nano
  - [ ] Implement batch processing (100 employees per API call)
  - [ ] Add retry logic for API failures
  - [ ] Track token usage and cost
  - [ ] Validate metrics fall within role's performance_ranges
  - [ ] Test with 10 sample employees, verify cost <$0.01

- [ ] **Task 4:** Create GPT-5.2 Instant text generator
  - [ ] Write `generate_feedback_themes(role, focus_area)` function using GPT-5.2 Instant
  - [ ] Write `generate_notable_achievement(role, skills)` function
  - [ ] Implement batch processing to minimize cost
  - [ ] Add caching for similar roles (reuse themes)
  - [ ] Track token usage and cost
  - [ ] Test with 10 samples, verify quality and cost <$0.05

### Phase 3: Generation Script (Tasks 5-6)

- [ ] **Task 5:** Write main generation script
  - [ ] Create `scripts/generate_synthetic_data.py`
  - [ ] Add argparse for CLI (--output, --count, --validate-only)
  - [ ] Load role templates and distribution targets
  - [ ] Generate 900 employee IDs (EMP-ASR-XXXX, EMP-TAX-XXXX, EMP-CON-XXXX)
  - [ ] Assign roles based on distribution (30% Staff, 25% Senior, ...)
  - [ ] Assign focus areas (40% Audit, 25% Financial Reporting, ...)
  - [ ] For each employee: merge hard-coded data + LLM-generated data
  - [ ] Add progress bar (tqdm) for generation
  - [ ] Print cost breakdown (Nano vs 5.2 spending)

- [ ] **Task 6:** Implement specialization logic
  - [ ] For 30% of employees, add optional_skills to required_skills
  - [ ] Ensure specialization matches focus_area (Cloud → Kubernetes, Audit → SOX)
  - [ ] Higher role levels more likely to have specialization (50% for Partners vs 20% for Staff)
  - [ ] Validate specialized employees have realistic skill combinations

### Phase 4: Validation (Tasks 7-9)

- [ ] **Task 7:** Implement Layer 1-2 validation
  - [ ] Create `validators.py` module
  - [ ] Write `validate_distribution(employees)` - check counts per service line and role
  - [ ] Write `validate_correlation(employees)` - check metrics increase with role_level
  - [ ] Add detailed error messages for failures
  - [ ] Test with intentionally broken data

- [ ] **Task 8:** Implement Layer 3-5 validation
  - [ ] Write `validate_progression(employees)` - check experience aligns with role
  - [ ] Write `validate_boundaries(employees)` - check all values in realistic ranges
  - [ ] Write `validate_semantics(employees)` - check skills match service line
  - [ ] Run all 5 validators on generated dataset
  - [ ] Fix any validation failures by adjusting templates or generation logic

- [ ] **Task 9:** Add validation reporting
  - [ ] Generate validation report: `data/validation_report.txt`
  - [ ] Include distribution tables (service line, role, focus area)
  - [ ] Include correlation tables (avg metrics by role_level)
  - [ ] Include outlier detection (employees outside 2 std devs)
  - [ ] Print pass/fail for each validation layer
  - [ ] Save report to git alongside SQL dump

### Phase 5: SQL Export & Git Workflow (Tasks 10-12)

- [ ] **Task 10:** Implement SQL exporter
  - [ ] Create `sql_exporter.py` module
  - [ ] Write `export_to_sql(employees, output_path)` function
  - [ ] Generate `TRUNCATE TABLE employees CASCADE;`
  - [ ] Generate batch `INSERT INTO employees VALUES ...` (100 rows per statement)
  - [ ] Add SQL comments (generation date, counts, validation status)
  - [ ] Add verification query at end: `SELECT service_line, COUNT(*) ...`
  - [ ] Test SQL loads into PostgreSQL without errors

- [ ] **Task 11:** Test full generation pipeline
  - [ ] Run `python scripts/generate_synthetic_data.py --output data/synthetic_employees.sql`
  - [ ] Verify generation completes in <5 minutes
  - [ ] Verify total cost <$3 (check OpenAI dashboard)
  - [ ] Load SQL into local database: `psql springais < data/synthetic_employees.sql`
  - [ ] Run manual queries to spot-check data quality
  - [ ] Verify all 5 validation layers pass

- [ ] **Task 12:** Set up git-based team sharing
  - [ ] Switch to data-dumps branch: `git checkout data-dumps`
  - [ ] Add SQL dump: `git add data/synthetic_employees.sql`
  - [ ] Add validation report: `git add data/validation_report.txt`
  - [ ] Commit: `git commit -m "Generate 900 employees - [date]"`
  - [ ] Push: `git push`
  - [ ] Test teammate workflow: pull from another machine, load into DB
  - [ ] Document workflow in `data/README.md`
  - [ ] Return to main: `git checkout main`

---

## Acceptance Criteria

All tasks must be complete AND:
- [ ] Script runs: `python scripts/generate_synthetic_data.py --output data/synthetic_employees.sql`
- [ ] Generation time: <5 minutes
- [ ] Total cost: <$3 (verify OpenAI dashboard)
- [ ] SQL dump size: 10-50MB
- [ ] SQL loads without errors: `psql springais < data/synthetic_employees.sql`
- [ ] Query returns 900: `SELECT COUNT(*) FROM employees;`
- [ ] Distribution correct: `SELECT service_line, COUNT(*) FROM employees GROUP BY service_line;` shows ~300 each
- [ ] All 5 validation layers pass
- [ ] Validation report generated: `data/validation_report.txt`
- [ ] SQL dump committed to data-dumps branch
- [ ] Team can load data: `git checkout data-dumps && git pull`

---

## Dependencies

**This block depends on:**
- ✅ STEP-1-SETUP complete (database schema exists, employees table created)

**This block enables:**
- All Step 2 blocks can use this data for testing (replace their mock data)
- Step 3 integration blocks have realistic data to work with

**Critical files:**
- `scripts/role_templates.py` - Role definitions (hard-coded)
- `scripts/onet_client.py` - O*NET API integration
- `scripts/llm_generator.py` - GPT-5 Nano + 5.2 calls
- `scripts/validators.py` - 5-layer validation
- `scripts/sql_exporter.py` - SQL dump generation
- `scripts/generate_synthetic_data.py` - Main orchestration
- `data/synthetic_employees.sql` - Output (committed to data-dumps branch)
- `data/validation_report.txt` - Quality report

---

## Cost Tracking

**Budget:** $3.00
**Actual:** $TBD

| Component | Budget | Actual | Notes |
|-----------|--------|--------|-------|
| GPT-5 Nano (metrics) | $0.04 | - | 900 employees × 50 tokens |
| GPT-5.2 Instant (feedback) | $1.89 | - | 900 employees × 150 tokens |
| O*NET API | $0.00 | - | Free tier |
| Buffer | $1.07 | - | For retries/adjustments |
| **Total** | **$3.00** | **-** | Track in OpenAI dashboard |

**How to track:**
1. Note OpenAI account balance before: `$X.XX`
2. Run generation script
3. Note OpenAI account balance after: `$Y.YY`
4. Actual cost = `$X.XX - $Y.YY`

---

## Troubleshooting

### Issue: O*NET API rate limit

**Symptom:** 429 Too Many Requests from O*NET

**Solution:**
- Free tier: 10 requests/minute
- Add sleep(6) between requests
- Or: Cache results, only fetch once per occupation code

### Issue: OpenAI API cost exceeds budget

**Symptom:** Generation costs $5-10 instead of $2

**Solution:**
- Check batch size (should be 100 employees per call)
- Verify using GPT-5 Nano (not GPT-5.2 Instant) for metrics
- Reduce token usage in prompts
- Cache LLM results for similar roles

### Issue: Validation layer fails

**Symptom:** `validate_correlation()` fails - metrics don't increase with role level

**Solution:**
- Check performance_ranges in role templates (higher roles should have higher mins/maxs)
- Check LLM prompt - ensure it respects the ranges
- Add explicit correlation check in generation logic

### Issue: SQL dump too large

**Symptom:** SQL file >100MB, slow to load

**Solution:**
- Remove unnecessary fields (career_history optional)
- Use batch INSERTs (100 rows per statement)
- Compress before committing: `gzip synthetic_employees.sql`
- Document decompression: `gunzip synthetic_employees.sql.gz`

---

**Last Updated:** 2026-01-06
**Status:** Not Started
