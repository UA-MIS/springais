# Scraping Notes: EY Careers (careers.ey.com)

## Summary

- **`ey.com/en_us/careers`** is mostly a marketing/landing page; it does **not** expose job posting links in server-rendered HTML.
- **Actual job listings** are available (server-rendered) at **`https://careers.ey.com/ey/search/`**.
- The search results page is **HTML-rendered** (no Selenium needed for basic extraction).
- `robots.txt` on `ey.com` allows broad access; still keep delays and a reasonable crawl rate.

## Verified endpoints (2026-01-19)

- **Landing page (US):** `https://www.ey.com/en_us/careers`
  - Server-rendered HTML, but no job posting links.
  - Links out to job search and student job boards.

- **Job search results (EY careers site):** `https://careers.ey.com/ey/search/`
  - Contains ~50 job links per page.
  - Pagination uses a query parameter: `startrow=25` (25 results/page).
  - Example: `https://careers.ey.com/ey/search/?q=&sortColumn=referencedate&sortDirection=desc&startrow=25`

- **Individual job page pattern:**
  - `/ey/job/<slug>/<job_id>/`
  - Example: `/ey/job/Amman-Senior-Consultant-.../1284590701/`
  - The numeric tail (`1284590701`) is stable and usable as `external_id`.

## HTML selectors (search results)

- **Job link:** `a.jobTitle-link[href]`
  - The `href` contains the job page path: `/ey/job/.../<id>/`
  - Duplicate anchors appear for responsiveness; de-dupe by `external_id`.

## HTML selectors (job detail page)

- **Title:** `h1`
- **Description:** `[data-careersite-propertyid=description]`
- **Token fields (Location / Date / Requisition ID):** `.joblayouttoken-label` + next `<span>`
  - Labels observed:
    - `Location:`
    - `Date:` (posting date)
    - `Requisition ID:`

## robots.txt quick note

- `https://www.ey.com/robots.txt` returns 200 and is broadly permissive.
- Still: use delays (1–2s), retries, and don’t crawl deeply by default.

