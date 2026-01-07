# BLOCK G: Skill Extraction Pipeline - TASKS

**Block:** BLOCK-G-SKILL-EXTRACTION
**Total Tasks:** 15
**Completed:** 0/15 (0%)

---

## ⚠️ IMPORTANT: Update Instructions

**When you complete a task:**
1. Check the box: `- [x] Task name`
2. Update the "Completed" count at the top
3. Update `PROJECT-STATUS.md`:
   - Find "Block G" row in Step 2 table
   - Update Progress column (e.g., "3/15 tasks")

**When ALL tasks complete:**
1. ✅ Run all verification steps in `VERIFICATION.md`
2. ✅ Change status in `PROJECT-STATUS.md` from ⏸️ to ✅
3. ✅ Update Progress to "15/15 tasks (100%)"
4. ✅ Update "Overall Progress" section
5. ✅ After verification passes, commit changes (do NOT commit until verification is complete)

See `CONTEXT.md` section "Update Instructions (For AI)" for full details.

---

## Progress Tracker

### 1. Resume Parsing Infrastructure (3 tasks)
- [ ] **Task 1.1:** Set up file upload handling
  - Install dependencies: `PyPDF2`, `python-docx`, `python-multipart`
  - Create upload endpoint: `POST /api/skills/upload`
  - Accept file types: PDF, DOCX (validate mime types)
  - Max file size: 10MB

- [ ] **Task 1.2:** Implement PDF text extraction
  - File: `backend/app/services/resume_parser.py`
  - Method: `extract_text_from_pdf(file_path: str) -> str`
  - Use PyPDF2 to extract text from all pages
  - Handle encrypted PDFs gracefully (return error message)

- [ ] **Task 1.3:** Implement DOCX text extraction
  - Method: `extract_text_from_docx(file_path: str) -> str`
  - Use python-docx to extract text
  - Preserve paragraph structure
  - Clean: Remove headers, footers, page numbers

### 2. Text Cleaning & Preprocessing (2 tasks)
- [ ] **Task 2.1:** Create text cleaning utility
  - File: `backend/app/utils/text_cleaner.py`
  - Remove: Extra whitespace, special characters, formatting artifacts
  - Preserve: Skill names, years of experience, certifications
  - Method: `clean_resume_text(raw_text: str) -> str`

- [ ] **Task 2.2:** Add text chunking for long resumes
  - Split resumes >4000 tokens into chunks
  - Method: `chunk_text(text: str, max_tokens: int = 3000) -> List[str]`
  - Process chunks sequentially, merge results

### 3. OpenAI Skill Extraction (4 tasks)
- [ ] **Task 3.1:** Set up OpenAI client
  - File: `backend/app/services/skill_extractor.py`
  - Initialize OpenAI client with API key from .env
  - Configure: model (gpt-4.5-turbo), temperature (0.3), max_tokens (1000)

- [ ] **Task 3.2:** Create skill extraction prompt
  - Write prompt template for GPT-4.5
  - Request JSON output with: skill name, category, proficiency
  - Include examples in prompt (few-shot learning)
  - Add instruction to normalize skill names (e.g., "Javascript" → "JavaScript")

- [ ] **Task 3.3:** Implement LLM skill extraction method
  - Method: `extract_skills_from_text(text: str) -> List[Skill]`
  - Call OpenAI API with prompt + resume text
  - Parse JSON response → Pydantic Skill model
  - Handle API errors: retry with exponential backoff

- [ ] **Task 3.4:** Add response validation
  - Validate LLM response is valid JSON
  - Check required fields: name, category, proficiency
  - Log warnings for malformed responses
  - Fall back to empty skills list if parsing fails

### 4. Skill Taxonomy & Normalization (3 tasks)
- [ ] **Task 4.1:** Create skill taxonomy database
  - Table: `skill_taxonomy` (canonical_name, category, aliases JSONB)
  - Seed with 200+ common skills (technical, soft, domain, certifications)
  - Example: `{"canonical_name": "JavaScript", "aliases": ["Javascript", "JS", "ECMAScript"]}`

- [ ] **Task 4.2:** Implement skill normalization
  - File: `backend/app/services/skill_normalizer.py`
  - Method: `normalize_skill(skill_name: str) -> str`
  - Lookup skill in taxonomy, return canonical name
  - If not found, return original name (log for review)

- [ ] **Task 4.3:** Add skill deduplication
  - After extraction, deduplicate skills (case-insensitive)
  - If duplicate with different proficiencies, keep higher proficiency
  - Method: `deduplicate_skills(skills: List[Skill]) -> List[Skill]`

### 5. Batch Processing (2 tasks)
- [ ] **Task 5.1:** Create batch skill extraction script
  - File: `backend/scripts/batch_extract_skills.py`
  - Read all employees from database
  - For each employee: extract skills from profile/bio field
  - Update employee.skills JSONB field
  - Progress bar: Show X/900 processed

- [ ] **Task 5.2:** Add error handling and retry logic
  - Retry OpenAI API calls on rate limit (429) or timeout
  - Exponential backoff: 1s, 2s, 4s, 8s
  - Log failed extractions to file: `errors.log`
  - Skip employee if 3 retries fail, continue with next

### 6. API Endpoints (2 tasks)
- [ ] **Task 6.1:** Create skill extraction endpoints
  - `POST /api/skills/extract` - Extract from text
  - `POST /api/skills/upload` - Upload resume file, extract skills
  - `GET /api/skills/taxonomy` - Get full skill taxonomy (for autocomplete)

- [ ] **Task 6.2:** Create employee skill management endpoint
  - `PUT /api/employees/{employee_id}/skills` - Update skills manually
  - `GET /api/employees/{employee_id}/skills` - Get current skills
  - Validate skill format before saving

### 7. Testing & Documentation (1 task)
- [ ] **Task 7.1:** Write unit tests and documentation
  - Test: PDF extraction with sample resume
  - Test: DOCX extraction
  - Test: LLM skill extraction with mock response
  - Test: Skill normalization logic
  - Test: Deduplication logic
  - Mock OpenAI API calls in tests (avoid costs)
  - Document: API endpoints, skill taxonomy format

---

## Acceptance Criteria

✅ **Block G is complete when:**
1. Can parse PDF and DOCX resumes to extract text
2. OpenAI GPT-4.5 extracts skills with category and proficiency
3. Skill normalizer deduplicates and standardizes skill names
4. API endpoints accept resume upload and return structured skills
5. Batch script can extract skills for 900 synthetic employees
6. Skill taxonomy has 200+ skills with canonical names and aliases
7. Error handling: Retries on API failures, logs errors
8. Unit tests cover extraction, normalization, deduplication (mock OpenAI)
9. Cost per resume extraction: ~$0.016 (tracked in logs)

---

## Files to Create/Modify

**New Files:**
- `backend/app/services/resume_parser.py`
- `backend/app/services/skill_extractor.py`
- `backend/app/services/skill_normalizer.py`
- `backend/app/utils/text_cleaner.py`
- `backend/app/schemas/skill.py` (Pydantic models)
- `backend/app/api/routes/skills.py`
- `backend/scripts/batch_extract_skills.py`
- `backend/data/skill_taxonomy.sql` (seed data)
- `backend/tests/test_skill_extraction.py`

**Modified Files:**
- `backend/app/api/main.py` (register skills router)
- `backend/app/config/settings.py` (add OpenAI config)
- `backend/requirements.txt` (add PyPDF2, python-docx, openai)

---

## Dependencies

**Blocked By:**
- Block C: Employee model must have `skills` JSONB field
- OpenAI API Key: Must be set in `.env`

**Blocks This:**
- Block D: Vector Embeddings (needs skills to generate embeddings)
- Block I: Skills Dashboard UI (needs skills to display)
- Block N: Skills Dashboard Integration (Step 3)

---

## Testing Checklist

- [ ] Unit test: PDF text extraction
- [ ] Unit test: DOCX text extraction
- [ ] Unit test: LLM skill extraction (mock OpenAI response)
- [ ] Unit test: Skill normalization
- [ ] Unit test: Skill deduplication
- [ ] Integration test: Full resume upload → skills saved to DB
- [ ] Performance test: Batch extract 100 profiles in <5 minutes
- [ ] Edge case test: Empty resume
- [ ] Edge case test: Resume with no skills mentioned
- [ ] Edge case test: OpenAI API failure (retry logic)

---

## Example Skill Taxonomy Seed Data

```sql
-- backend/data/skill_taxonomy.sql
INSERT INTO skill_taxonomy (canonical_name, category, aliases) VALUES
('Python', 'technical', '["python", "Python3", "py"]'),
('JavaScript', 'technical', '["Javascript", "JS", "ECMAScript", "js"]'),
('SQL', 'technical', '["sql", "Structured Query Language", "MySQL", "PostgreSQL"]'),
('React', 'technical', '["react", "React.js", "ReactJS"]'),
('Leadership', 'soft', '["leadership", "Team Leadership", "Leading Teams"]'),
('Communication', 'soft', '["communication", "Communication Skills", "Verbal Communication"]'),
('Project Management', 'domain', '["project management", "PM", "PMP"]'),
('Data Analysis', 'domain', '["data analysis", "Data Analytics", "Analyzing Data"]'),
('AWS', 'technical', '["aws", "Amazon Web Services", "AWS Cloud"]'),
('Machine Learning', 'technical', '["ML", "machine learning", "Machine Learning"]');
-- ... add 190+ more
```

---

## Example LLM Prompt Template

```python
SKILL_EXTRACTION_PROMPT = """
You are a skill extraction assistant. Extract all skills from the resume below.

Instructions:
1. Identify all technical skills (programming languages, tools, frameworks)
2. Identify all soft skills (communication, leadership, teamwork)
3. Identify all domain skills (industry-specific expertise)
4. Identify all certifications (professional certifications)
5. Infer proficiency level based on years mentioned or context:
   - beginner: <1 year
   - intermediate: 1-3 years
   - advanced: 3-5 years
   - expert: 5+ years
6. Normalize skill names (e.g., "Javascript" → "JavaScript")

Return ONLY valid JSON in this format:
{
  "skills": [
    {"name": "Python", "category": "technical", "proficiency": "advanced"},
    {"name": "Leadership", "category": "soft", "proficiency": "intermediate"}
  ]
}

Resume text:
{resume_text}
"""
```

---

## OpenAI Cost Tracking

Add logging to track costs:

```python
# Log after each extraction
logger.info(f"Extracted skills for employee {employee_id}")
logger.info(f"Tokens used: {response.usage.total_tokens}")
logger.info(f"Estimated cost: ${response.usage.total_tokens * 0.000015:.4f}")
```

---

**When all tasks are complete, run the verification steps in `VERIFICATION.md`**
