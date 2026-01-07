# BLOCK G: Skill Extraction Pipeline - VERIFICATION

**Block:** BLOCK-G-SKILL-EXTRACTION
**Purpose:** Verify AI-powered skill extraction accurately parses resumes and structures skills

---

## Quick Verification Commands

```bash
# Run skill extraction tests (with mocked OpenAI)
pytest backend/tests/test_skill_extraction.py -v

# Test skill extraction API
curl -X POST http://localhost:8000/api/skills/extract \
  -H "Content-Type: application/json" \
  -d '{"text": "5 years Python, SQL, Machine Learning experience"}' | jq

# Test resume upload
curl -X POST http://localhost:8000/api/skills/upload \
  -F "file=@sample_resume.pdf" | jq

# Run batch extraction (dry run - first 10 employees)
python backend/scripts/batch_extract_skills.py --limit 10 --dry-run
```

---

## Automated Verification Checklist

### 1. Resume Parsing Tests

```bash
# Test PDF extraction
pytest backend/tests/test_skill_extraction.py::test_pdf_extraction -v

# Test DOCX extraction
pytest backend/tests/test_skill_extraction.py::test_docx_extraction -v

# Test text cleaning
pytest backend/tests/test_skill_extraction.py::test_text_cleaning -v
```

**Expected Results:**
- ✅ PDF text extracted without formatting artifacts
- ✅ DOCX text extracted with paragraph structure preserved
- ✅ Text cleaning removes headers, footers, extra whitespace
- ✅ Handles encrypted PDFs gracefully (error message)

### 2. LLM Skill Extraction Tests (Mocked)

```bash
# Test skill extraction with mock OpenAI response
pytest backend/tests/test_skill_extraction.py::test_llm_extraction_mock -v

# Test JSON parsing from LLM response
pytest backend/tests/test_skill_extraction.py::test_json_parsing -v

# Test error handling for malformed responses
pytest backend/tests/test_skill_extraction.py::test_malformed_llm_response -v
```

**Expected Results:**
- ✅ Mock LLM response parsed correctly into Skill models
- ✅ Skills categorized as technical, soft, domain, or certification
- ✅ Proficiency levels assigned correctly
- ✅ Malformed JSON handled gracefully (logs warning, returns empty list)

### 3. Skill Normalization Tests

```bash
# Test skill normalization
pytest backend/tests/test_skill_extraction.py::test_skill_normalization -v

# Test deduplication
pytest backend/tests/test_skill_extraction.py::test_skill_deduplication -v
```

**Expected Results:**
- ✅ "Javascript" normalized to "JavaScript"
- ✅ "python" normalized to "Python"
- ✅ "ML" normalized to "Machine Learning"
- ✅ Duplicate skills removed (keep higher proficiency)

### 4. API Endpoint Tests

```bash
# Start backend server
cd backend && uvicorn app.main:app --reload

# Test extraction endpoint
curl -X POST http://localhost:8000/api/skills/extract \
  -H "Content-Type: application/json" \
  -d '{"text": "Senior Python Developer with 5 years of Django, Flask, SQL experience. Strong communication and leadership skills."}' | jq

# Expected response:
{
  "skills": [
    {"name": "Python", "category": "technical", "proficiency": "expert"},
    {"name": "Django", "category": "technical", "proficiency": "expert"},
    {"name": "Flask", "category": "technical", "proficiency": "expert"},
    {"name": "SQL", "category": "technical", "proficiency": "expert"},
    {"name": "Communication", "category": "soft", "proficiency": "intermediate"},
    {"name": "Leadership", "category": "soft", "proficiency": "intermediate"}
  ]
}
```

### 5. Batch Processing Tests

```bash
# Run batch extraction on first 10 employees (dry run)
python backend/scripts/batch_extract_skills.py --limit 10 --dry-run

# Check progress logging
# Should see: "Processing employee 1/10... Done. Extracted 8 skills."
```

**Expected Results:**
- ✅ Processes 10 employees without errors
- ✅ Progress bar shows X/10 completed
- ✅ Logs skill count for each employee
- ✅ No OpenAI API calls in dry-run mode (uses mock data)

---

## Manual Verification Steps

### Step 1: Verify Skill Taxonomy Seed Data

```sql
-- Connect to database
psql -U springais_user -d springais_db

-- Check skill taxonomy records
SELECT COUNT(*) FROM skill_taxonomy;
-- Should be: >= 200

-- View sample records
SELECT canonical_name, category, aliases FROM skill_taxonomy LIMIT 10;

-- Check specific skill normalization
SELECT canonical_name, aliases
FROM skill_taxonomy
WHERE canonical_name = 'JavaScript';
-- Should show: ["Javascript", "JS", "ECMAScript"]
```

### Step 2: Test Resume Upload (Real File)

Create a test resume file `test_resume.txt`:

```
John Doe
Senior Data Analyst

Experience:
- 5 years of SQL, Excel, Python experience
- Built dashboards using Tableau and Power BI
- Strong data visualization and communication skills
- Team leadership experience

Certifications:
- Google Data Analytics Certificate
```

Upload it:

```bash
# Convert to PDF or use as text
curl -X POST http://localhost:8000/api/skills/extract \
  -H "Content-Type: application/json" \
  -d @test_resume.txt | jq
```

**Expected Output:**
```json
{
  "skills": [
    {"name": "SQL", "category": "technical", "proficiency": "expert"},
    {"name": "Excel", "category": "technical", "proficiency": "expert"},
    {"name": "Python", "category": "technical", "proficiency": "expert"},
    {"name": "Tableau", "category": "technical", "proficiency": "advanced"},
    {"name": "Power BI", "category": "technical", "proficiency": "advanced"},
    {"name": "Data Visualization", "category": "domain", "proficiency": "advanced"},
    {"name": "Communication", "category": "soft", "proficiency": "intermediate"},
    {"name": "Leadership", "category": "soft", "proficiency": "intermediate"}
  ]
}
```

### Step 3: Test Real OpenAI Extraction (1 Sample)

**WARNING: This will incur ~$0.02 cost**

```python
# In Python shell
from app.services.skill_extractor import SkillExtractor
from app.db.session import SessionLocal

extractor = SkillExtractor()

resume_text = """
Jane Smith - Machine Learning Engineer

Skills:
- Python, TensorFlow, PyTorch, Scikit-learn
- 4 years experience building ML models
- AWS, Docker, Kubernetes for deployment
- Strong problem-solving and teamwork skills

Education:
- MS in Computer Science
"""

skills = extractor.extract_skills_from_text(resume_text)

for skill in skills:
    print(f"{skill.name} ({skill.category}) - {skill.proficiency}")
```

**Expected Output:**
```
Python (technical) - advanced
TensorFlow (technical) - advanced
PyTorch (technical) - advanced
Scikit-learn (technical) - advanced
AWS (technical) - intermediate
Docker (technical) - intermediate
Kubernetes (technical) - intermediate
Problem Solving (soft) - intermediate
Teamwork (soft) - intermediate
```

### Step 4: Verify Error Handling & Retry Logic

```python
# Test retry logic with bad API key (should fail after 3 retries)
import os
os.environ['OPENAI_API_KEY'] = 'bad-key'

# This should retry 3 times, then raise error
try:
    skills = extractor.extract_skills_from_text(resume_text)
except Exception as e:
    print(f"Expected error: {e}")
    # Should log: "Retry 1/3... Retry 2/3... Retry 3/3... Failed."
```

### Step 5: Test Batch Extraction (Full 900 Employees)

**WARNING: This will cost ~$14.40 in OpenAI API calls**

```bash
# Run batch extraction for all 900 employees
python backend/scripts/batch_extract_skills.py

# Monitor progress
# Should see:
# Processing employee 1/900... Done. Extracted 12 skills.
# Processing employee 2/900... Done. Extracted 8 skills.
# ...
# Processing employee 900/900... Done. Extracted 10 skills.
#
# Total cost: $14.23
# Failed: 0
# Success rate: 100%
```

**After completion, verify in database:**

```sql
-- Check that skills are populated
SELECT id, name, jsonb_array_length(skills) as skill_count
FROM employees
WHERE skills IS NOT NULL
LIMIT 10;

-- Should show: employees with 5-15 skills each

-- Sample skills for one employee
SELECT skills FROM employees WHERE id = 1;
-- Should show: [{"name": "Python", "category": "technical", "proficiency": "advanced"}, ...]
```

---

## Acceptance Criteria Checklist

- [ ] **Resume Parsing:** Can extract text from PDF and DOCX files
- [ ] **LLM Extraction:** GPT-4.5 extracts skills with category and proficiency
- [ ] **Normalization:** Skill names standardized (JavaScript, Python, SQL)
- [ ] **Deduplication:** Duplicate skills removed, highest proficiency kept
- [ ] **API Endpoints:** Extract endpoint and upload endpoint work correctly
- [ ] **Batch Processing:** Can process 900 employees with progress tracking
- [ ] **Error Handling:** Retries on API failures, logs errors
- [ ] **Skill Taxonomy:** 200+ skills seeded with canonical names and aliases
- [ ] **Cost Tracking:** Logs token usage and estimated cost per extraction
- [ ] **Test Coverage:** Unit tests cover extraction, normalization (mock OpenAI)

---

## Common Issues & Solutions

### Issue: OpenAI API rate limit errors (429)

**Solution:**
```python
# Add exponential backoff in retry logic
time.sleep(2 ** retry_count)  # 1s, 2s, 4s, 8s

# Or reduce batch processing concurrency
# Process 10 at a time instead of all 900 sequentially
```

### Issue: LLM returns invalid JSON

**Solution:**
- Add JSON validation in response parsing
- Log malformed responses for debugging
- Fall back to keyword extraction if JSON parsing fails
- Adjust prompt to emphasize "return ONLY valid JSON"

### Issue: Skills not normalized (e.g., "Javascript" instead of "JavaScript")

**Solution:**
```sql
-- Check skill taxonomy has aliases
SELECT * FROM skill_taxonomy WHERE canonical_name = 'JavaScript';

-- Add missing alias
UPDATE skill_taxonomy
SET aliases = aliases || '["Javascript"]'::jsonb
WHERE canonical_name = 'JavaScript';
```

### Issue: Batch processing very slow (>30 minutes for 900)

**Solution:**
- Add parallel processing (Celery workers)
- Use asyncio for concurrent OpenAI API calls
- Cache LLM responses for duplicate resume text
- Pre-extract skills during synthetic data generation (Block A)

---

## Performance Benchmarks

**Target Performance:**
- PDF extraction: <1 second
- LLM skill extraction: 2-5 seconds per resume (depends on OpenAI API)
- Batch processing (900 employees): <30 minutes with parallelization
- API endpoint response time: <5 seconds

**Cost Benchmarks:**
- Per resume: ~$0.016
- 900 employees: ~$14.40
- 1000 job postings: ~$16.00

---

## Security & Privacy Checklist

- [ ] Resume uploads validated (PDF/DOCX only, max 10MB)
- [ ] Uploaded files deleted after processing (don't store permanently)
- [ ] OpenAI API key stored in .env, not committed to git
- [ ] No PII (names, emails) sent to OpenAI (only skill-related text)
- [ ] Rate limiting on upload endpoint (prevent abuse)

---

## Next Steps After Verification

Once all checks pass:

1. ✅ Mark all tasks complete in `TASKS.md`
2. ✅ Update `PROJECT-STATUS.md`:
   - Block G: ✅ Completed | [Your Name] | 15/15 tasks
3. ✅ Commit and push changes:
   ```bash
   git add .
   git commit -m "✅ Complete BLOCK-G: Skill extraction pipeline - Resume parsing and LLM extraction"
   git push
   ```
4. ✅ Run batch extraction for 900 synthetic employees (if not done in Block A)
5. ✅ Share skill taxonomy with frontend team (Block I - autocomplete)
6. ✅ Update Step 3 Block N (Skills Dashboard Integration) with API endpoints

---

## Sample Test Resume for Manual Testing

Save as `sample_resume.txt`:

```
Sarah Johnson
Product Manager

Experience:
Product Manager at TechCorp (3 years)
- Led cross-functional teams of 5-10 people
- Managed product roadmap using Jira and Asana
- Conducted user research and A/B testing
- Strong stakeholder communication

Skills:
- Agile/Scrum methodologies
- SQL for data analysis
- Figma for wireframing
- Excellent presentation and leadership skills

Education:
- MBA, Stanford University

Certifications:
- Certified Scrum Product Owner (CSPO)
```

---

**Block G is complete when all acceptance criteria are met and tests pass** ✅
