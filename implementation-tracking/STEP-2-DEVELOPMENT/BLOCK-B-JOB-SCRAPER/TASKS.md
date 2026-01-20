# BLOCK B: Job Posting Scraper - TASKS

**Block:** BLOCK-B-JOB-SCRAPER
**Total Tasks:** 10
**Completed:** 10/10 (100%)

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

- [x] **Task 1:** Analyze EY careers page structure
  - [x] Visit https://www.ey.com/en_us/careers manually
  - [x] Inspect HTML structure (View Source + parsed HTML)
  - [x] Identify job listing container elements (careers.ey.com search)
  - [x] Document CSS selectors for: job title, location, link
  - [x] Check if JavaScript rendering is required (not required on careers.ey.com search pages)
  - [x] Check robots.txt: https://www.ey.com/robots.txt
  - [x] Document findings in `docs/scraping_notes.md`

- [x] **Task 2:** Set up scraping environment
  - [x] Add dependencies to `backend/requirements.txt` (already had bs4+requests; added `lxml` + `tqdm`)
  - [x] Install: `pip install -r backend/requirements.txt`
  - [x] Create `scripts/scrape_ey_jobs.py` skeleton
  - [x] Add User-Agent header configuration
  - [x] Add rate limiting helper (1-2 second delay)
  - [x] Test basic page fetch

### Phase 2: Core Scraping Logic (Tasks 3-5)

- [x] **Task 3:** Implement job listing extractor
  - [x] Write `extract_job_links(listing_html)` function
  - [x] Parse HTML with BeautifulSoup + lxml
  - [x] Find all job posting links via `a.jobTitle-link[href]`
  - [x] Return list of job URLs + external IDs
  - [x] Verify extracts ~50 links per search page

- [x] **Task 4:** Implement individual job page parser
  - [x] Write `parse_job_page(job_url)` function
  - [x] Fetch individual job page
  - [x] Extract title (`h1`)
  - [x] Extract tokens (location/date/requisition id) via `.joblayouttoken-label`
  - [x] Extract description via `[data-careersite-propertyid=description]`
  - [x] Extract posted_date (best-effort from token `Date:`)
  - [x] Return structured object with all fields

- [x] **Task 5:** Implement field extraction helpers
  - [x] Write `extract_experience(text)` - extract min/max years from text
  - [x] Write `extract_education(text)` - extract degree requirements
  - [x] Write `extract_certifications(text)` - find CPA, CMA, MBA, etc.
  - [x] Add regex patterns for common requirements

### Phase 3: Database Integration (Tasks 6-7)

- [x] **Task 6:** Implement database upsert logic
  - [x] Use existing SQLAlchemy model `backend/app/models/job_posting.py`
  - [x] Write `upsert_job_posting(job_data)` in `scripts/scrape_ey_jobs.py`
  - [x] Check if external_id exists in database
  - [x] If exists: UPDATE fields + `last_seen_at`, keep `is_active=TRUE`
  - [x] If new: INSERT with deterministic `id`
  - [x] Add error handling for database failures

- [x] **Task 7:** Implement archive strategy
  - [x] Add lifecycle fields via Alembic migration `004_job_posting_status_and_search.py`
  - [x] Write `mark_inactive_postings(cutoff_time)` function
  - [x] Find postings with `last_seen_at < cutoff_time AND is_active=TRUE`
  - [x] Update: `is_active=FALSE, closed_at=NOW()`
  - [x] Log number of archived postings
  - [x] DO NOT DELETE (keep for historical analysis)

### Phase 4: Full Pipeline (Tasks 8-9)

- [x] **Task 8:** Implement main scraping pipeline
  - [x] Write `main()` function in `scripts/scrape_ey_jobs.py`
  - [x] Add command-line args: --dry-run, --limit, --service-line
  - [x] Crawl listing pages + extract all job links
  - [x] For each link: parse page + upsert to DB
  - [x] Add progress bar (tqdm)
  - [x] Mark inactive postings after scraping
  - [x] Print summary: X new, Y updated, Z archived
  - [x] Add comprehensive logging

- [x] **Task 9:** Add error handling and resilience
  - [x] Wrap requests in try/except (handle timeouts, 404s, etc.)
  - [x] Add retry logic (3 attempts with backoff)
  - [x] Handle malformed HTML gracefully (skip job, log error)
  - [x] Continue scraping even if individual jobs fail
  - [x] Log all errors to `logs/scraper_errors.log`

### Phase 5: Automation & Documentation (Task 10)

- [x] **Task 10:** Set up scheduling and documentation
  - [x] Create `docker-compose` scraper service (profile: `scraper`)
  - [x] Write `docs/scraping_guide.md` with instructions
  - [x] Document how to run manually: `python scripts/scrape_ey_jobs.py`
  - [x] Document how to check results (active vs archived)
  - [x] Create seed data file: `data/seed_job_postings.sql` (10 realistic postings)
  - [x] Verify logs are created and readable (`logs/`)

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
