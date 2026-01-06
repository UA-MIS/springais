# BLOCK G: Skill Extraction Pipeline - CONTEXT

**Block ID:** BLOCK-G-SKILL-EXTRACTION
**Phase:** STEP-2-DEVELOPMENT
**Category:** #backend #ai #llm #openai
**Estimated Time:** 3-4 days
**Dependencies:** None (requires STEP-1-SETUP complete)

---

## Purpose

Build an AI-powered pipeline that extracts structured skills from unstructured text (resumes, job descriptions, project summaries). Uses OpenAI GPT-4.5 to:
- Parse uploaded resumes/profiles and extract skills
- Categorize skills (technical, soft, domain-specific)
- Validate and normalize skill names
- Store skills in structured format for matching and visualization

This is the "brain" that converts messy text → clean, structured skills data.

---

## What This Block Delivers

1. **Resume Parser** - Extract text from PDF/DOCX files
2. **LLM Skill Extractor** - GPT-4.5-powered skill extraction
3. **Skill Taxonomy** - Categorize skills into types and proficiency levels
4. **Validation & Normalization** - Deduplicate and standardize skill names
5. **Batch Processing** - Handle bulk skill extraction for synthetic data
6. **API Endpoints** - Upload resume, extract skills, update employee profile

---

## Key Concepts

### Skill Taxonomy
Skills are categorized into:
- **Technical Skills:** Programming languages, tools, frameworks (e.g., Python, SQL, React)
- **Soft Skills:** Communication, leadership, problem-solving
- **Domain Skills:** Industry-specific expertise (e.g., Financial Analysis, Tax Law)
- **Certifications:** Professional certifications (e.g., CPA, PMP, AWS Certified)

### Skill Proficiency Levels
- **Beginner:** <1 year experience
- **Intermediate:** 1-3 years
- **Advanced:** 3-5 years
- **Expert:** 5+ years

### Normalization
Convert variations to canonical form:
- "JavaScript" ← ["Javascript", "JS", "ECMAScript"]
- "Python" ← ["python", "Python3", "py"]
- "Machine Learning" ← ["ML", "machine learning", "Machine Learning"]

---

## Technical Approach

### 1. Resume Parsing (PDF/DOCX → Text)
- Use `PyPDF2` for PDF extraction
- Use `python-docx` for DOCX extraction
- Clean text: Remove formatting, headers, footers

### 2. LLM Skill Extraction
**Prompt to GPT-4.5:**
```
Extract all skills from the following resume. Categorize each skill as:
- technical (programming languages, tools, frameworks)
- soft (communication, leadership, problem-solving)
- domain (industry-specific expertise)
- certification (professional certifications)

Return JSON format:
{
  "skills": [
    {"name": "Python", "category": "technical", "proficiency": "advanced"},
    {"name": "Leadership", "category": "soft", "proficiency": "intermediate"},
    ...
  ]
}

Resume text:
[RESUME_TEXT]
```

### 3. Validation & Normalization
- Check extracted skills against skill taxonomy database
- Normalize variations (e.g., "Javascript" → "JavaScript")
- Flag unknown skills for manual review

### 4. Batch Processing
- For synthetic data (Block A), extract skills from generated profiles
- Queue-based processing with Celery or background tasks
- Track progress: processed/total

---

## Architecture

```
┌──────────────────────────────────────────┐
│  Upload Resume (PDF/DOCX)                │
└────────────────┬─────────────────────────┘
                 │
                 v
       ┌──────────────────┐
       │  Resume Parser   │
       │  (PyPDF2/docx)   │
       └────────┬─────────┘
                │
                v
       ┌──────────────────┐
       │  Text Cleaning   │
       └────────┬─────────┘
                │
                v
       ┌────────────────────────────┐
       │  GPT-4.5 Skill Extractor   │
       │  (OpenAI API)              │
       └────────┬───────────────────┘
                │
                v
       ┌──────────────────────────┐
       │  Skill Validator         │
       │  (Taxonomy Check)        │
       └────────┬─────────────────┘
                │
                v
       ┌──────────────────────────┐
       │  Skill Normalizer        │
       │  (Dedupe & Standardize)  │
       └────────┬─────────────────┘
                │
                v
       ┌──────────────────────────┐
       │  Save to Employee Model  │
       │  (skills JSONB field)    │
       └──────────────────────────┘
```

---

## Database Schema (Reference)

Uses existing `employees` table from Block C:

```sql
-- employees table
id SERIAL PRIMARY KEY
skills JSONB  -- [{"name": "Python", "category": "technical", "proficiency": "advanced"}, ...]
```

New table for skill taxonomy:

```sql
-- skill_taxonomy table
CREATE TABLE skill_taxonomy (
  id SERIAL PRIMARY KEY,
  canonical_name VARCHAR(255) UNIQUE,
  category VARCHAR(50),  -- technical, soft, domain, certification
  aliases JSONB          -- ["Javascript", "JS", "ECMAScript"]
);
```

---

## Example Skill Extraction Output

**Input (Resume Text):**
```
John Doe
Senior Software Engineer

Skills:
- Python, JavaScript, React
- AWS, Docker, Kubernetes
- Team leadership, Agile methodologies
- 5+ years experience in full-stack development
```

**Output (Extracted Skills JSON):**
```json
{
  "skills": [
    {"name": "Python", "category": "technical", "proficiency": "advanced"},
    {"name": "JavaScript", "category": "technical", "proficiency": "advanced"},
    {"name": "React", "category": "technical", "proficiency": "advanced"},
    {"name": "AWS", "category": "technical", "proficiency": "intermediate"},
    {"name": "Docker", "category": "technical", "proficiency": "intermediate"},
    {"name": "Kubernetes", "category": "technical", "proficiency": "intermediate"},
    {"name": "Leadership", "category": "soft", "proficiency": "intermediate"},
    {"name": "Agile", "category": "domain", "proficiency": "intermediate"}
  ]
}
```

---

## Integration Points

**Feeds Into:**
- **Block D (Vector Embeddings):** Skills → embeddings for matching
- **Block I (Skills Dashboard UI):** Display extracted skills
- **Block N (Skills Dashboard Integration):** Connect extraction to frontend

**Depends On:**
- **Block C (Database Models):** Employee model must have `skills` JSONB field
- **OpenAI API Key:** Must be configured in `.env`

---

## Mock Data for Testing

Use mock resume text for unit tests:

```python
mock_resume_text = """
Jane Smith
Data Analyst

Experience:
- 3 years of SQL and Excel experience
- Python for data analysis (Pandas, NumPy)
- Created dashboards using Tableau
- Strong communication and presentation skills

Certifications:
- Google Data Analytics Certificate
"""
```

---

## API Endpoints to Build

1. **POST /api/skills/extract**
   - Body: `{"text": "resume text or profile description"}`
   - Returns: `{"skills": [...]}`

2. **POST /api/skills/upload**
   - Upload PDF/DOCX file
   - Parse → extract skills → save to employee profile
   - Returns: `{"employee_id": 123, "skills": [...]}`

3. **PUT /api/employees/{employee_id}/skills**
   - Update employee skills manually
   - Body: `{"skills": [...]}`
   - Returns: Updated employee profile

4. **GET /api/skills/taxonomy**
   - Returns: Full skill taxonomy (for autocomplete in frontend)

---

## OpenAI API Configuration

```python
# .env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.5-turbo  # Or gpt-4o

# backend/app/config/settings.py
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.5-turbo")
MAX_TOKENS = 1000
TEMPERATURE = 0.3  # Lower for more consistent extractions
```

---

## Success Criteria

✅ Block G is complete when:
1. Can parse PDF and DOCX resumes to extract text
2. GPT-4.5 extracts skills with category and proficiency
3. Skill normalizer deduplicates and standardizes skill names
4. API endpoint accepts resume upload and returns structured skills
5. Batch processing can extract skills for 900 synthetic employees
6. Skill taxonomy database has 200+ common skills with aliases
7. Unit tests verify extraction logic with mock resumes
8. Error handling for OpenAI API failures (retry logic)

---

## Cost Estimation (OpenAI API)

**Assumptions:**
- Average resume: ~1000 tokens
- GPT-4.5 cost: $0.01 per 1K input tokens, $0.03 per 1K output tokens
- Average output: ~200 tokens

**Cost per Resume:**
- Input: $0.01
- Output: $0.006
- **Total: ~$0.016 per resume**

**For 900 employees:**
- Total cost: ~$14.40

---

## References

**Reference Docs:**
- `reference-docs/backend/llm-integration.md` - OpenAI GPT integration patterns and best practices
- `reference-docs/backend/api-reference.md` - Skill extraction API endpoint documentation
- `reference-docs/architecture/data-flow.md` - Skill extraction data flow diagram

**External Resources:**
- **OpenAI API Docs:** https://platform.openai.com/docs/api-reference
- **Skill Taxonomy:** Can use O*NET database as reference
- **Resume Parsing:** PyPDF2, python-docx libraries

---

## Notes

- Start with simple keyword extraction, then use LLM for better accuracy
- Consider caching LLM responses to avoid duplicate API calls
- Add retry logic for OpenAI API (rate limits, timeouts)
- For demo, pre-extract skills for synthetic employees (don't run live)
- Skill proficiency can be inferred from years of experience mentioned

---

**Next Steps:** See `TASKS.md` for implementation tasks
