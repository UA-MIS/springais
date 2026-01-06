# BLOCK B: Job Posting Scraper - CONTEXT

**Block ID:** BLOCK-B-JOB-SCRAPER
**Phase:** STEP-2-DEVELOPMENT
**Category:** #data #python #scraping
**Estimated Time:** 1-2 days
**Dependencies:** None (requires STEP-1-SETUP complete)

---

## AI Quick Start Prompt

```
You are working on BLOCK-B: Job Posting Scraper for SpringAIS.

Goal: Build web scraper to extract EY job postings and store in database.

Key constraints:
- Target: EY careers page (https://www.ey.com/en_us/careers)
- Use BeautifulSoup + requests (no Selenium needed)
- Extract: title, service line, location, requirements, description, posted date
- Store in job_postings table
- Run daily/weekly via cron
- Archive closed postings (historical data valuable)

Read TASKS.md for implementation steps.
Read VERIFICATION.md for scraping validation tests.
```

---

## Purpose

Scrape real EY job postings to provide PRIMARY ground truth for role requirements, augmented by success pattern analysis from synthetic employees.

**Why this matters:**
- Job postings = actual current requirements (beats synthetic data)
- Success patterns become AUGMENTATION not PRIMARY source
- Growing database enables ML ranking later (Week 1: 30 postings → Month 3: 100+)
- Historical data shows requirement evolution over time

**Success outcome:**
- ~30-50 active job postings scraped within first week
- Database grows to 100+ postings by Month 3
- System gracefully handles both scraped postings AND success patterns
- Closed postings archived (not deleted) for trend analysis

---

## Architecture: Job Postings FIRST, Success Patterns SECOND

### OLD Priority (from initial PRD)

```
User wants: Senior Analyst role

System shows:
- Success pattern analysis ONLY (from synthetic employees)
- Common skills, metrics, paths
```

### NEW Priority (January 2026 update)

```
User wants: Senior Analyst role

IF job posting exists:
  PRIMARY: Job posting requirements
    "Senior Analyst requires: CPA, 3-5 years, GAAP, Excel"

  AUGMENTATION: Success pattern insights
    "✅ 92% of current Senior Analysts also have Excel
     💡 78% have strong communication skills (not in posting!)
     📊 Avg 4.2 years experience (you: 3.5 - on track)"

ELSE (no posting):
  PRIMARY: Success patterns only
    "Based on 47 current Senior Analysts:
     Common skills: Accounting (100%), Audit (98%)..."
```

**Why this approach:**
- Job postings = what EY officially requires (when available)
- Success patterns = hidden insights (always valuable)
- System works even without postings (graceful degradation)
- Database improves over time as scraper runs

---

## Target: EY Careers Page

### URLs to Scrape

**Main careers page:**
```
https://www.ey.com/en_us/careers
```

**Service line specific:**
```
https://www.ey.com/en_us/careers/assurance
https://www.ey.com/en_us/careers/tax
https://www.ey.com/en_us/careers/consulting
```

**Job search (if available via public API):**
```
https://www.ey.com/en_us/careers/search
```

**Note:** EY's actual job listings may be on a separate applicant tracking system (ATS) like Workday or SuccessFactors. Scraper should handle redirects.

### Fields to Extract

**Required fields:**
1. **job_title** - "Senior Analyst - Assurance"
2. **service_line** - "Assurance", "Tax", "Consulting"
3. **location** - "New York, NY" or "Remote"
4. **requirements_text** - Full text of requirements section
5. **description** - Full job description
6. **posted_date** - When job was posted
7. **job_url** - Direct link to posting
8. **external_id** - Job ID from EY system (for deduplication)

**Optional fields:**
9. **experience_min** - Extracted from text (e.g., "3 years")
10. **experience_max** - Extracted from text (e.g., "5 years")
11. **education** - Extracted (e.g., "Bachelor's degree required")
12. **certifications** - Extracted (e.g., "CPA preferred")

**Status tracking:**
13. **active** - Boolean (TRUE for current postings)
14. **last_seen** - Last time scraper saw this posting
15. **closed_date** - When posting disappeared (archived, not deleted)

---

## Database Schema

**Table:** `job_postings` (already created in STEP-1-SETUP)

```sql
CREATE TABLE job_postings (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(100) UNIQUE NOT NULL,  -- EY's job ID
    job_title VARCHAR(200) NOT NULL,
    service_line VARCHAR(50),
    location VARCHAR(200),
    requirements_text TEXT,
    description TEXT,
    posted_date DATE,
    job_url TEXT,

    -- Extracted fields
    experience_min INTEGER,
    experience_max INTEGER,
    education VARCHAR(200),
    certifications TEXT[],

    -- Status tracking
    active BOOLEAN DEFAULT TRUE,
    first_seen TIMESTAMP DEFAULT NOW(),
    last_seen TIMESTAMP DEFAULT NOW(),
    closed_date TIMESTAMP,

    -- Full-text search
    search_vector tsvector,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_job_postings_service_line ON job_postings(service_line);
CREATE INDEX idx_job_postings_active ON job_postings(active);
CREATE INDEX idx_job_postings_posted_date ON job_postings(posted_date);
CREATE INDEX idx_job_postings_search ON job_postings USING GIN(search_vector);
```

**Note:** Schema already created in STEP-1-SETUP, this block implements the scraper that populates it.

---

## Scraping Strategy

### Technology Stack

**Recommended:** BeautifulSoup + requests
- Most job boards render server-side (no JavaScript required)
- Faster than Selenium
- Lower resource usage
- Easier to debug

**Fallback (if needed):** Selenium + headless Chrome
- Only if EY uses heavy JavaScript rendering
- Slower but more reliable for dynamic content

### Scraping Flow

```
1. Fetch EY careers page
2. Extract all job posting links
3. For each link:
   a. Fetch individual job page
   b. Parse HTML for required fields
   c. Check if external_id exists in database
   d. If new: INSERT
   e. If existing: UPDATE last_seen
4. Mark postings NOT seen this run as inactive (active=FALSE, closed_date=NOW())
5. Archive historical data
```

### Rate Limiting

**Be respectful:**
- 1-2 second delay between requests
- Run daily or weekly (not hourly)
- Cache pages locally for development
- Add User-Agent header

```python
import time
import requests

HEADERS = {
    'User-Agent': 'SpringAIS/1.0 (Educational Project; contact@example.com)'
}

def fetch_page(url):
    time.sleep(2)  # Be nice to servers
    response = requests.get(url, headers=HEADERS)
    return response.text
```

---

## HTML Parsing Examples

### Example: Extract Job Title

```python
from bs4 import BeautifulSoup

html = fetch_page(job_url)
soup = BeautifulSoup(html, 'html.parser')

# Try common selectors (adjust based on actual HTML)
job_title = (
    soup.find('h1', class_='job-title') or
    soup.find('h1', {'data-testid': 'job-title'}) or
    soup.find('h1')
).get_text(strip=True)
```

### Example: Extract Requirements Section

```python
# Find requirements section
requirements_section = (
    soup.find('div', class_='requirements') or
    soup.find('div', string=re.compile('Requirements', re.I)) or
    soup.find('section', {'aria-label': 'Requirements'})
)

if requirements_section:
    requirements_text = requirements_section.get_text(strip=True)
else:
    # Fallback: extract all text, search for requirements keyword
    full_text = soup.get_text()
    # Use regex to extract section...
```

### Example: Extract Service Line

```python
# Option 1: From breadcrumb
breadcrumb = soup.find('nav', {'aria-label': 'Breadcrumb'})
if breadcrumb:
    links = breadcrumb.find_all('a')
    for link in links:
        text = link.get_text(strip=True)
        if text in ['Assurance', 'Tax', 'Consulting']:
            service_line = text

# Option 2: From job title
if 'Assurance' in job_title:
    service_line = 'Assurance'
elif 'Tax' in job_title:
    service_line = 'Tax'
elif 'Consultant' in job_title or 'Advisory' in job_title:
    service_line = 'Consulting'
```

---

## Field Extraction with Regex

### Extract Experience Requirements

```python
import re

def extract_experience(text):
    """Extract min/max years of experience from text"""
    # Pattern: "3-5 years", "3 to 5 years", "3+ years"
    patterns = [
        r'(\d+)\s*-\s*(\d+)\s*years?',  # 3-5 years
        r'(\d+)\s*to\s*(\d+)\s*years?',  # 3 to 5 years
        r'(\d+)\+\s*years?',  # 3+ years (min only)
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            groups = match.groups()
            if len(groups) == 2:
                return int(groups[0]), int(groups[1])
            else:
                return int(groups[0]), None  # min only

    return None, None  # No match
```

### Extract Certifications

```python
def extract_certifications(text):
    """Extract certifications from text"""
    cert_patterns = [
        r'\b(CPA)\b',
        r'\b(CMA)\b',
        r'\b(CIA)\b',
        r'\b(MBA)\b',
        r'\b(CFA)\b',
        r'\b(PMP)\b',
        # Add more as needed
    ]

    certifications = []
    for pattern in cert_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            certifications.append(pattern.strip('\\b()'))

    return certifications
```

---

## Deduplication Strategy

**Problem:** Same job may appear on multiple runs

**Solution:** Use external_id (EY's job ID) as unique key

```python
def upsert_job_posting(job_data):
    """Insert or update job posting"""
    existing = session.query(JobPosting).filter_by(
        external_id=job_data['external_id']
    ).first()

    if existing:
        # Update: mark as still active, update last_seen
        existing.last_seen = datetime.now()
        existing.active = True
        # Update other fields if changed (optional)
    else:
        # Insert: new job posting
        new_job = JobPosting(**job_data)
        session.add(new_job)

    session.commit()
```

**Archiving closed postings:**

```python
def mark_inactive_postings():
    """Mark postings not seen in this run as inactive"""
    cutoff = datetime.now() - timedelta(hours=24)  # Last run was <24h ago

    session.query(JobPosting).filter(
        JobPosting.last_seen < cutoff,
        JobPosting.active == True
    ).update({
        'active': False,
        'closed_date': datetime.now()
    })

    session.commit()
```

---

## Scheduling: Cron Job

**Run scraper daily at 2 AM:**

```bash
# crontab -e
0 2 * * * cd /path/to/springais && python scripts/scrape_ey_jobs.py >> logs/scraper.log 2>&1
```

**Or weekly (Sundays at 2 AM):**

```bash
0 2 * * 0 cd /path/to/springais && python scripts/scrape_ey_jobs.py >> logs/scraper.log 2>&1
```

**Docker-friendly approach:**

```yaml
# docker-compose.yml (add service)
services:
  scraper:
    build: ./backend
    command: python scripts/scrape_ey_jobs.py
    environment:
      - DATABASE_URL=${DATABASE_URL}
    volumes:
      - ./backend:/app
    depends_on:
      - postgres
```

Run manually: `docker-compose run scraper`

---

## Error Handling

### Common Issues and Solutions

**Issue 1: HTML structure changed**
```python
def safe_extract(soup, selectors, default=''):
    """Try multiple selectors, return first match"""
    for selector in selectors:
        element = soup.select_one(selector)
        if element:
            return element.get_text(strip=True)
    return default

# Usage
job_title = safe_extract(soup, [
    'h1.job-title',
    'h1[data-testid="job-title"]',
    'div.posting-title h1',
    'h1'  # Fallback
])
```

**Issue 2: Request timeout**
```python
def fetch_with_retry(url, retries=3):
    for attempt in range(retries):
        try:
            response = requests.get(url, headers=HEADERS, timeout=10)
            response.raise_for_status()
            return response.text
        except requests.RequestException as e:
            if attempt == retries - 1:
                print(f"Failed after {retries} attempts: {e}")
                return None
            time.sleep(5 * (attempt + 1))  # Exponential backoff
```

**Issue 3: Blocked by rate limiting**
```python
# Add random delays
import random

def polite_fetch(url):
    time.sleep(random.uniform(2, 5))  # 2-5 second delay
    return requests.get(url, headers=HEADERS)
```

---

## Mock Data for Independent Testing

**Problem:** Other blocks need job postings but can't wait for scraper

**Solution:** Create seed data with ~10 realistic postings

**File:** `data/seed_job_postings.sql`

```sql
-- Seed job postings for testing
INSERT INTO job_postings (external_id, job_title, service_line, location, requirements_text, description, posted_date, job_url, active)
VALUES
('EY-ASR-001', 'Senior Analyst - Assurance', 'Assurance', 'New York, NY',
 'Requirements: CPA, 3-5 years audit experience, GAAP knowledge, Excel proficiency',
 'Join our Assurance practice...', '2026-01-01', 'https://ey.com/jobs/EY-ASR-001', TRUE),

('EY-TAX-001', 'Manager - Corporate Tax', 'Tax', 'Boston, MA',
 'Requirements: CPA, 5-7 years corporate tax, IRC knowledge, tax provision experience',
 'Lead complex tax engagements...', '2026-01-02', 'https://ey.com/jobs/EY-TAX-001', TRUE),

('EY-CON-001', 'Consultant - Cloud & Infrastructure', 'Consulting', 'Remote',
 'Requirements: AWS Certified, 4-6 years cloud experience, DevOps, Kubernetes',
 'Drive cloud transformation projects...', '2026-01-03', 'https://ey.com/jobs/EY-CON-001', TRUE)

-- Add 7-10 more...
;
```

Load for testing: `psql springais < data/seed_job_postings.sql`

**Integration in Step 3:** Replace seed data with real scraped postings from this block

---

## Full-Text Search Integration

**Purpose:** Enable searching job postings by keywords

**Update search_vector on INSERT/UPDATE:**

```sql
-- Trigger to update search_vector
CREATE OR REPLACE FUNCTION update_job_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.job_title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.requirements_text, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_search_vector_update
    BEFORE INSERT OR UPDATE ON job_postings
    FOR EACH ROW EXECUTE FUNCTION update_job_search_vector();
```

**Search query example:**

```sql
SELECT job_title, service_line, ts_rank(search_vector, query) AS rank
FROM job_postings, to_tsquery('english', 'audit & GAAP') AS query
WHERE search_vector @@ query
  AND active = TRUE
ORDER BY rank DESC
LIMIT 10;
```

---

## References

**Related Documentation:**
- `_bmad-output/architecture-updates-2026.md` - Job postings priority shift
- `_bmad-output/tech-stack.md` - Architecture overview (Section: Data Strategy)
- `implementation-tracking/STEP-1-SETUP/CONTEXT.md` - Database schema
- `implementation-tracking/STEP-2-DEVELOPMENT/BLOCK-A-SYNTHETIC-DATA/CONTEXT.md` - Success patterns augmentation

**Scraping Resources:**
- BeautifulSoup docs: https://www.crummy.com/software/BeautifulSoup/bs4/doc/
- Requests docs: https://requests.readthedocs.io/
- EY Careers: https://www.ey.com/en_us/careers
- Python regex: https://docs.python.org/3/library/re.html

**Best Practices:**
- robots.txt: Check https://www.ey.com/robots.txt before scraping
- Rate limiting: 1-2 second delays
- User-Agent: Identify your bot
- Caching: Save pages locally for development

---

## Success Criteria

**This block is complete when:**

1. ✅ Scraper runs successfully against EY careers page
2. ✅ Extracts 30-50 active job postings
3. ✅ All required fields populated (title, service line, requirements, etc.)
4. ✅ Deduplication works (same job not inserted twice)
5. ✅ Archive strategy works (closed postings marked inactive, not deleted)
6. ✅ Cron job configured for daily/weekly runs
7. ✅ Full-text search enabled on job_postings table
8. ✅ Documentation shows how to run scraper manually

**Data Quality Checklist:**
- [ ] 30+ active job postings in database
- [ ] All 3 service lines represented
- [ ] Requirements extracted from >80% of postings
- [ ] Experience ranges extracted from >60% of postings
- [ ] No duplicate external_ids
- [ ] Full-text search returns relevant results
- [ ] Historical data preserved (closed postings archived)

---

## AI Auto-Update Instructions

When you complete a task in TASKS.md:

1. **Update the task checkbox:**
   ```markdown
   - [x] Task 1: Set up BeautifulSoup scraping skeleton
   ```

2. **Update PROJECT-STATUS.md:**
   ```markdown
   | **B** | Job Posting Scraper | 🔄 In Progress | [Your name] | 3/10 tasks | 1-2 days | #data #python #scraping |
   ```

3. **Update this CONTEXT.md if you discover:**
   - Different HTML structure on EY careers page
   - Better extraction patterns
   - Additional useful fields to extract
   - Alternative scraping targets

4. **When block complete:**
   - Change status to ✅ Completed in PROJECT-STATUS.md
   - Update "Overall Progress" section
   - Add note: "Block B complete - ~X job postings scraped"

---

**Last Updated:** 2026-01-06
**Status:** Ready for development
**Blocking:** None (can start after STEP-1-SETUP)
**Blocked by:** STEP-1-SETUP must be complete (job_postings table exists)
