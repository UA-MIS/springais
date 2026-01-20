# EY Job Scraper Guide

## What it does

`scripts/scrape_ey_jobs.py` scrapes job listings from `careers.ey.com` and upserts them into the `job_postings` table.

## Prereqs

- Docker stack up (Postgres running) or a reachable Postgres with `DATABASE_URL` set
- Backend deps installed (at minimum: `requests`, `beautifulsoup4`, `lxml`, `tqdm`, `sqlalchemy`, `psycopg`)

## Install deps

From repo root:

```bash
pip install -r backend/requirements.txt
```

## Run migrations

From `backend/`:

```bash
alembic upgrade head
```

## Run scraper

From repo root:

```bash
python scripts/scrape_ey_jobs.py --limit 25
```

Useful flags:

- `--dry-run`: fetch + parse only, no DB writes
- `--limit N`: cap number of job postings
- `--locationsearch "United States"`: filter listing search results
- `--service-line Tax|Assurance|Consulting`: filter after parsing
- `--use-cache`: use cached HTML in `.cache/ey_scraper`

Examples:

```bash
python scripts/scrape_ey_jobs.py --dry-run --limit 10
python scripts/scrape_ey_jobs.py --limit 50 --locationsearch "United States"
python scripts/scrape_ey_jobs.py --limit 25 --service-line Tax
```

## Logs

- `logs/scraper.log`
- `logs/scraper_errors.log`

## Quick DB checks

```sql
-- total
SELECT COUNT(*) FROM job_postings;

-- active vs archived (requires migration 004)
SELECT
  COUNT(*) FILTER (WHERE is_active = TRUE)  AS active,
  COUNT(*) FILTER (WHERE is_active = FALSE) AS archived
FROM job_postings;

-- show recent jobs
SELECT external_id, title, service_line, location, posted_date, last_seen_at
FROM job_postings
ORDER BY last_seen_at DESC NULLS LAST
LIMIT 20;
```

## Scheduling

Windows Task Scheduler (simple approach):

- Program/script: `python`
- Arguments: `scripts\\scrape_ey_jobs.py`
- Start in: repo root directory

Linux cron example (daily 2 AM):

```bash
0 2 * * * cd /path/to/SpringAIS && python scripts/scrape_ey_jobs.py >> logs/scraper.log 2>&1
```

Docker (one-off run):

```bash
docker compose --profile scraper run --rm ey_scraper --limit 25
```

