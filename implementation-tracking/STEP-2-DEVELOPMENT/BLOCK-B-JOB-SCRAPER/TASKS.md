# BLOCK B: Job Posting Scraper - TASKS

**Block:** BLOCK-B-JOB-SCRAPER
**Total Tasks:** 10
**Completed:** 0/10 (0%)

---

## ⚠️ IMPORTANT: Update Instructions

**When you complete a task:**
1. Check the box: `- [x] Task name`
2. Update the "Completed" count at the top
3. Update `PROJECT-STATUS.md`:
   - Find "Block B" row in Step 2 table
   - Update Progress column (e.g., "3/10 tasks")

**When ALL tasks complete:**
1. ✅ Run all verification steps in `VERIFICATION.md`
2. ✅ Change status in `PROJECT-STATUS.md` from ⏸️ to ✅
3. ✅ Update Progress to "10/10 tasks (100%)"
4. ✅ Update "Overall Progress" section
5. ✅ After verification passes, commit changes (do NOT commit until verification is complete)

See `CONTEXT.md` section "Update Instructions (For AI)" for full details.

---

## Progress Tracker

### Phase 1: Setup & Reconnaissance (Tasks 1-2)

- [ ] **Task 1:** Analyze EY careers page structure
  - [ ] Visit https://www.ey.com/en_us/careers manually
  - [ ] Inspect HTML structure (Chrome DevTools)
  - [ ] Identify job listing container elements
  - [ ] Document CSS selectors for: job title, service line, location, link
  - [ ] Check if JavaScript rendering is required (View Page Source vs Inspect)
  - [ ] Check robots.txt: https://www.ey.com/robots.txt
  - [ ] Document findings in `docs/scraping_notes.md`

- [ ] **Task 2:** Set up scraping environment
  - [ ] Add dependencies to `backend/requirements.txt`: beautifulsoup4==4.12.3, requests==2.31.0, lxml==5.1.0
  - [ ] Install: `pip install beautifulsoup4 requests lxml`
  - [ ] Create `scripts/scrape_ey_jobs.py` skeleton
  - [ ] Add User-Agent header configuration
  - [ ] Add rate limiting helper (1-2 second delay)
  - [ ] Test basic page fetch: `requests.get('https://www.ey.com/en_us/careers')`

### Phase 2: Core Scraping Logic (Tasks 3-5)

- [ ] **Task 3:** Implement job listing extractor
  - [ ] Write `extract_job_links(careers_page_html)` function
  - [ ] Parse HTML with BeautifulSoup
  - [ ] Find all job posting links (adjust selectors based on Task 1 findings)
  - [ ] Return list of job URLs + external IDs
  - [ ] Test with cached HTML page (no live requests yet)
  - [ ] Verify extracts 30-50 links from careers page

- [ ] **Task 4:** Implement individual job page parser
  - [ ] Write `parse_job_page(job_url)` function
  - [ ] Fetch individual job page
  - [ ] Extract job_title (try multiple selectors)
  - [ ] Extract service_line (from breadcrumb or title)
  - [ ] Extract location
  - [ ] Extract requirements_text (full section)
  - [ ] Extract description (full text)
  - [ ] Extract posted_date (if available)
  - [ ] Return structured dict with all fields
  - [ ] Test with 5 sample job URLs

- [ ] **Task 5:** Implement field extraction helpers
  - [ ] Write `extract_experience(text)` - extract min/max years from text
  - [ ] Write `extract_education(text)` - extract degree requirements
  - [ ] Write `extract_certifications(text)` - find CPA, CMA, MBA, etc.
  - [ ] Add regex patterns for common requirements
  - [ ] Test with sample requirements text
  - [ ] Verify extraction accuracy >60%

### Phase 3: Database Integration (Tasks 6-7)

- [ ] **Task 6:** Implement database upsert logic
  - [ ] Create `models/job_posting.py` with SQLAlchemy model (if not exists)
  - [ ] Write `upsert_job_posting(job_data)` function
  - [ ] Check if external_id exists in database
  - [ ] If exists: UPDATE last_seen, keep active=TRUE
  - [ ] If new: INSERT with first_seen=NOW(), active=TRUE
  - [ ] Add error handling for database failures
  - [ ] Test with sample job data

- [ ] **Task 7:** Implement archive strategy
  - [ ] Write `mark_inactive_postings(cutoff_time)` function
  - [ ] Find postings with last_seen < cutoff_time AND active=TRUE
  - [ ] Update: active=FALSE, closed_date=NOW()
  - [ ] Log number of archived postings
  - [ ] DO NOT DELETE (keep for historical analysis)
  - [ ] Test with sample data

### Phase 4: Full Pipeline (Tasks 8-9)

- [ ] **Task 8:** Implement main scraping pipeline
  - [ ] Write `main()` function in `scrape_ey_jobs.py`
  - [ ] Add command-line args: --dry-run, --limit, --service-line
  - [ ] Fetch EY careers page
  - [ ] Extract all job links
  - [ ] For each link: parse page + upsert to DB
  - [ ] Add progress bar (tqdm)
  - [ ] Mark inactive postings after scraping
  - [ ] Print summary: X new, Y updated, Z archived
  - [ ] Add comprehensive logging
  - [ ] Test with --dry-run (no DB writes)
  - [ ] Test with --limit 5 (only 5 jobs)

- [ ] **Task 9:** Add error handling and resilience
  - [ ] Wrap requests in try/except (handle timeouts, 404s, etc.)
  - [ ] Add retry logic (3 attempts with exponential backoff)
  - [ ] Handle malformed HTML gracefully (skip job, log error)
  - [ ] Continue scraping even if individual jobs fail
  - [ ] Log all errors to `logs/scraper_errors.log`
  - [ ] Send summary email on completion (optional)
  - [ ] Test with intentional failures

### Phase 5: Automation & Documentation (Task 10)

- [ ] **Task 10:** Set up scheduling and documentation
  - [ ] Create cron job entry (daily at 2 AM)
  - [ ] Or: Create `docker-compose` scraper service
  - [ ] Write `docs/scraping_guide.md` with instructions
  - [ ] Document how to run manually: `python scripts/scrape_ey_jobs.py`
  - [ ] Document how to check results: `SELECT COUNT(*) FROM job_postings WHERE active=TRUE;`
  - [ ] Create seed data file: `data/seed_job_postings.sql` (10 realistic postings)
  - [ ] Test cron job works (run manually first)
  - [ ] Verify logs are created and readable

---

## Acceptance Criteria

All tasks must be complete AND:
- [ ] Script runs: `python scripts/scrape_ey_jobs.py`
- [ ] Scraping completes in <10 minutes
- [ ] Extracts 30-50 active job postings (or all available)
- [ ] All required fields populated for >80% of jobs
- [ ] Experience extracted for >60% of jobs
- [ ] No duplicate external_ids in database
- [ ] Closed postings marked inactive (not deleted)
- [ ] Cron job configured for daily/weekly runs
- [ ] Seed data available: `data/seed_job_postings.sql`
- [ ] Documentation shows how to run manually

---

## Dependencies

**This block depends on:**
- ✅ STEP-1-SETUP complete (database schema exists, job_postings table created)

**This block enables:**
- Block E (Matching Engine) - match users against real job requirements
- Block F (Success Patterns) - augment job postings with success insights
- Block J (Match Results UI) - display job requirements in UI

**Critical files:**
- `scripts/scrape_ey_jobs.py` - Main scraping script
- `scripts/field_extractors.py` - Regex extraction helpers
- `models/job_posting.py` - SQLAlchemy model (optional, may exist already)
- `data/seed_job_postings.sql` - Seed data for testing
- `docs/scraping_guide.md` - Usage documentation
- `logs/scraper.log` - Execution logs

---

## Cost Tracking

**Budget:** $0.00 (no API costs)

**Infrastructure:**
- BeautifulSoup + requests: Free
- EY careers page: Public (no authentication)
- Cron job: $0 (runs on existing server)

**Time:**
- Initial run: ~5-10 minutes (30-50 jobs)
- Daily runs: ~2-5 minutes (check for updates)
- Weekly runs: ~5-10 minutes (full rescrape)

---

## Troubleshooting

### Issue: No job links extracted

**Symptom:** `extract_job_links()` returns empty list

**Solution:**
- Check if HTML structure changed (EY updated website)
- Verify CSS selectors in `docs/scraping_notes.md`
- Try alternative selectors
- Check if JavaScript rendering required (switch to Selenium)

### Issue: Scraper blocked (403 Forbidden)

**Symptom:** `requests.get()` returns 403

**Solution:**
- Add User-Agent header
- Increase delay between requests (3-5 seconds)
- Check robots.txt for restrictions
- Use proxy rotation (advanced)

### Issue: Database connection timeout

**Symptom:** `psycopg2.OperationalError` during upsert

**Solution:**
- Check DATABASE_URL is correct
- Verify PostgreSQL is running: `docker-compose ps`
- Add connection retry logic
- Batch commits (commit every 10 jobs, not after each)

### Issue: Extraction accuracy low

**Symptom:** Experience extracted for <40% of jobs

**Solution:**
- Review regex patterns in `field_extractors.py`
- Add more pattern variations (e.g., "3 yrs", "three years")
- Log failed extractions, review manually
- Consider using LLM for extraction (GPT-5 Nano, ~$0.01 per 100 jobs)

---

**Last Updated:** 2026-01-06
**Status:** Not Started
