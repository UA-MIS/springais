# BLOCK B: Job Posting Scraper - VERIFICATION

**Block:** BLOCK-B-JOB-SCRAPER
**Purpose:** Verify scraper extracts job postings and populates database correctly

---

## Quick Verification Commands

```bash
# 1. Run scraper
python scripts/scrape_ey_jobs.py --limit 10

# 2. Check active postings
psql springais -c "SELECT COUNT(*) FROM job_postings WHERE active=TRUE;"

# 3. View sample postings
psql springais -c "SELECT job_title, service_line, location FROM job_postings LIMIT 10;"

# 4. Check extraction quality
psql springais -c "SELECT
  COUNT(*) as total,
  COUNT(requirements_text) as has_requirements,
  COUNT(experience_min) as has_experience
FROM job_postings WHERE active=TRUE;"
```

---

## Manual Verification Steps

### 1. Scraper Execution Test

**Run with dry-run mode:**
```bash
python scripts/scrape_ey_jobs.py --dry-run
```

**Expected output:**
```
Fetching EY careers page...
Found 47 job postings
Parsing job 1/47: Senior Analyst - Assurance...
  Title: Senior Analyst - Assurance
  Service Line: Assurance
  Location: New York, NY
  Requirements: 487 characters
  Experience: 3-5 years
...
DRY RUN - No database changes made
Summary: 47 jobs would be added/updated
```

**✅ Pass Criteria:**
- Script runs without errors
- Extracts 30+ job postings
- All required fields present for >80% of jobs

---

### 2. Database Population Test

**Run full scrape:**
```bash
python scripts/scrape_ey_jobs.py
```

**Check total count:**
```sql
SELECT COUNT(*) as total_jobs FROM job_postings;
```

**Expected:** 30-50 (or all available on EY careers)

**Check active count:**
```sql
SELECT COUNT(*) as active_jobs FROM job_postings WHERE active=TRUE;
```

**Expected:** Same as total (first run)

**Check service line distribution:**
```sql
SELECT service_line, COUNT(*) as count
FROM job_postings
WHERE active=TRUE
GROUP BY service_line
ORDER BY count DESC;
```

**Expected:**
```
 service_line | count
--------------+-------
 Consulting   |    20
 Assurance    |    15
 Tax          |    12
```

**✅ Pass Criteria:**
- Database contains 30+ active job postings
- All 3 service lines represented
- No NULL values in required fields (job_title, external_id)

---

### 3. Deduplication Test

**Run scraper twice:**
```bash
python scripts/scrape_ey_jobs.py
python scripts/scrape_ey_jobs.py  # Second run
```

**Check for duplicates:**
```sql
SELECT external_id, COUNT(*) as occurrences
FROM job_postings
GROUP BY external_id
HAVING COUNT(*) > 1;
```

**Expected:** 0 rows (no duplicates)

**Check last_seen updated:**
```sql
SELECT COUNT(*) FROM job_postings
WHERE last_seen > created_at;
```

**Expected:** Equal to total jobs (second run updated all)

**✅ Pass Criteria:**
- No duplicate external_ids
- Second run updates last_seen, doesn't insert duplicates
- active remains TRUE for existing postings

---

### 4. Archive Strategy Test

**Simulate closed posting:**
```sql
-- Manually mark one posting as old
UPDATE job_postings
SET last_seen = NOW() - INTERVAL '2 days'
WHERE id = (SELECT id FROM job_postings LIMIT 1);
```

**Run scraper (which won't see this posting):**
```bash
python scripts/scrape_ey_jobs.py
```

**Check archived posting:**
```sql
SELECT id, job_title, active, closed_date
FROM job_postings
WHERE active=FALSE;
```

**Expected:** 1 row with active=FALSE, closed_date set

**Check count changes:**
```sql
SELECT
  COUNT(*) FILTER (WHERE active=TRUE) as active,
  COUNT(*) FILTER (WHERE active=FALSE) as archived
FROM job_postings;
```

**Expected:** active decreased by 1, archived increased by 1

**✅ Pass Criteria:**
- Postings not seen marked as inactive (active=FALSE)
- closed_date set correctly
- Data NOT deleted (archived for historical analysis)

---

### 5. Field Extraction Quality Test

**Check requirements extraction:**
```sql
SELECT
  ROUND(AVG(CASE WHEN requirements_text IS NOT NULL THEN 1 ELSE 0 END) * 100, 1) as pct_has_requirements,
  ROUND(AVG(CASE WHEN experience_min IS NOT NULL THEN 1 ELSE 0 END) * 100, 1) as pct_has_experience,
  ROUND(AVG(CASE WHEN certifications IS NOT NULL THEN 1 ELSE 0 END) * 100, 1) as pct_has_certs
FROM job_postings
WHERE active=TRUE;
```

**Expected:**
```
 pct_has_requirements | pct_has_experience | pct_has_certs
----------------------+--------------------+--------------
                 85.0 |               65.0 |          40.0
```

**Sample extracted data:**
```sql
SELECT job_title, experience_min, experience_max, certifications
FROM job_postings
WHERE experience_min IS NOT NULL
LIMIT 5;
```

**Expected realistic values:**
```
         job_title          | experience_min | experience_max | certifications
----------------------------+----------------+----------------+----------------
 Senior Analyst - Assurance |              3 |              5 | {CPA}
 Manager - Tax              |              5 |              7 | {CPA,CMA}
 Consultant - Cloud         |              4 |              6 | {}
```

**✅ Pass Criteria:**
- Requirements extracted for >80% of postings
- Experience extracted for >60% of postings
- Extracted values are realistic (not 0 or 100 years)

---

### 6. Full-Text Search Test

**Test search functionality:**
```sql
SELECT job_title, service_line,
       ts_rank(search_vector, query) AS rank
FROM job_postings,
     to_tsquery('english', 'audit & GAAP') AS query
WHERE search_vector @@ query
  AND active = TRUE
ORDER BY rank DESC
LIMIT 5;
```

**Expected:** Returns Assurance jobs mentioning audit and GAAP

**Test keyword search:**
```sql
SELECT job_title, service_line
FROM job_postings
WHERE search_vector @@ to_tsquery('english', 'cloud | kubernetes')
  AND active = TRUE
LIMIT 5;
```

**Expected:** Returns Consulting jobs with cloud keywords

**✅ Pass Criteria:**
- Search returns relevant results
- Rank ordering makes sense
- No errors in search queries

---

### 7. Data Quality Spot Check

**Review sample postings manually:**
```sql
SELECT job_title, requirements_text, description
FROM job_postings
WHERE active=TRUE
ORDER BY RANDOM()
LIMIT 3;
```

**Manual checks:**
- [ ] Requirements text is complete sentences (not truncated)
- [ ] Description is meaningful (not error messages)
- [ ] Job title matches requirements (Tax job has tax requirements)
- [ ] Location is realistic (not "null" or blank)

**Check for malformed data:**
```sql
SELECT COUNT(*) FROM job_postings
WHERE active=TRUE
  AND (requirements_text LIKE '%<div%'  -- HTML tags leaked
    OR description LIKE '%error%'
    OR job_title = ''
    OR LENGTH(requirements_text) < 50);  -- Too short
```

**Expected:** 0 rows (no malformed data)

**✅ Pass Criteria:**
- All sample postings look realistic
- No HTML tags in text fields
- No error messages or truncation
- Reasonable text lengths

---

### 8. Scheduling Test

**Test cron job (if configured):**
```bash
# Check cron entry exists
crontab -l | grep scrape_ey_jobs

# Or check Docker Compose service
docker-compose config | grep scraper
```

**Manual trigger test:**
```bash
# Run scraper as it would run via cron
cd /path/to/springais && python scripts/scrape_ey_jobs.py >> logs/scraper.log 2>&1

# Check log created
cat logs/scraper.log
```

**Expected log output:**
```
2026-01-06 02:00:01 - Starting EY job scraper
2026-01-06 02:00:05 - Fetched careers page (47 jobs found)
2026-01-06 02:02:15 - Parsed 47 jobs
2026-01-06 02:02:17 - Upserted 47 jobs (5 new, 42 updated, 0 archived)
2026-01-06 02:02:17 - Scraping complete
```

**✅ Pass Criteria:**
- Cron job or Docker service configured
- Logs are created and readable
- Scraper runs without user interaction

---

### 9. Seed Data Test

**Load seed data:**
```bash
psql springais < data/seed_job_postings.sql
```

**Verify seed data loaded:**
```sql
SELECT COUNT(*) FROM job_postings WHERE external_id LIKE 'SEED-%';
```

**Expected:** 10 (or number of seed postings)

**Check seed quality:**
```sql
SELECT job_title, service_line, requirements_text
FROM job_postings
WHERE external_id LIKE 'SEED-%'
LIMIT 3;
```

**Expected:** Realistic-looking postings for testing

**✅ Pass Criteria:**
- Seed data loads without errors
- 10 diverse postings (all 3 service lines)
- Can be used by other blocks for testing

---

### 10. Error Handling Test

**Test with invalid URL:**
```bash
python scripts/scrape_ey_jobs.py --url https://invalid-url-404.com
```

**Expected:** Graceful error, not crash

**Test with network timeout:**
```bash
# Temporarily block network or use invalid proxy
python scripts/scrape_ey_jobs.py --timeout 1
```

**Expected:** Retry logic activates, logs error, exits gracefully

**Check error log:**
```bash
cat logs/scraper_errors.log
```

**Expected:**
```
2026-01-06 02:00:05 - ERROR: Failed to fetch job page: timeout
2026-01-06 02:00:05 - ERROR: Skipping job EY-CON-042 (parse error)
```

**✅ Pass Criteria:**
- Script doesn't crash on errors
- Errors logged to file
- Continues scraping other jobs after individual failures

---

## Troubleshooting Common Issues

### Issue: "No jobs extracted"

**Symptom:** Scraper runs but finds 0 job postings

**Diagnosis:**
```python
# Add debug prints
html = fetch_page(url)
print(f"Page length: {len(html)}")
print(f"Contains 'Careers': {'Careers' in html}")

soup = BeautifulSoup(html, 'html.parser')
print(f"Job links found: {len(soup.select('a.job-link'))}")  # Adjust selector
```

**Solution:**
- EY website structure changed → update CSS selectors
- JavaScript rendering required → switch to Selenium
- Check robots.txt → adjust delay or change approach

---

### Issue: "duplicate key value violates unique constraint"

**Symptom:** Database error during second run

**Diagnosis:**
```sql
SELECT external_id, COUNT(*) FROM job_postings GROUP BY external_id HAVING COUNT(*) > 1;
```

**Solution:**
- Ensure external_id extraction is consistent
- Add ON CONFLICT clause to INSERT
- Use upsert logic (UPDATE if exists, INSERT if not)

---

### Issue: "Extraction accuracy <50%"

**Symptom:** experience_min NULL for most jobs

**Diagnosis:**
```python
# Test regex patterns
test_texts = [
    "3-5 years of experience required",
    "3 to 5 years experience",
    "5+ years in tax",
    "At least 3 years"
]

for text in test_texts:
    print(f"{text} → {extract_experience(text)}")
```

**Solution:**
- Add more regex pattern variations
- Consider using LLM extraction for complex cases
- Log failed extractions, review patterns

---

## Final Checklist

Before marking BLOCK-B as complete:

- [ ] `python scripts/scrape_ey_jobs.py` runs without errors
- [ ] Scraping completes in <10 minutes
- [ ] Database contains 30+ active job postings
- [ ] All required fields populated for >80% of jobs
- [ ] Experience extracted for >60% of jobs
- [ ] Certifications extracted for >40% of jobs
- [ ] No duplicate external_ids in database
- [ ] Second run updates (not duplicates) existing postings
- [ ] Closed postings marked inactive (not deleted)
- [ ] Full-text search works on job_postings
- [ ] Seed data created: `data/seed_job_postings.sql`
- [ ] Cron job or Docker service configured
- [ ] Logs created: `logs/scraper.log`
- [ ] Error handling works (doesn't crash on individual failures)
- [ ] Documentation complete: `docs/scraping_guide.md`

---

## Success Criteria Met

If all above checks pass:

1. ✅ Update `TASKS.md` - all 10 tasks checked
2. ✅ Update `PROJECT-STATUS.md`:
   - Status: 🔄 → ✅
   - Progress: 10/10 tasks
3. ✅ Update Overall Progress section
4. ✅ Commit changes:
   ```bash
   git add .
   git commit -m "✅ Complete BLOCK-B: Job posting scraper - X active postings"
   git push
   ```
5. ✅ Notify team: "Block B complete! Scraping X job postings from EY careers"

---

**Last Updated:** 2026-01-06
**Status:** Ready for verification
