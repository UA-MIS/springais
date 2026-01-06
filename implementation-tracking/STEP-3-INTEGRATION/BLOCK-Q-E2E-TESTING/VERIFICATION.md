# BLOCK Q: E2E Testing & Polish - VERIFICATION

**Block:** BLOCK-Q-E2E-TESTING
**Purpose:** Verify entire SpringAIS system works end-to-end, performs well, and is ready for competition demo

---

## Quick Verification Commands

```bash
# 1. Run all E2E tests
npx playwright test

# 2. Run Lighthouse audit
npx lighthouse http://localhost:3000 --view

# 3. Check bundle size
npm run build && npx webpack-bundle-analyzer build/stats.json

# 4. Run security scan (OWASP ZAP)
docker run -t owasp/zap2docker-stable zap-baseline.py -t http://localhost:3000

# 5. Verify demo data
psql -d springais -c "SELECT COUNT(*) FROM employees;" # Should be 50-100
psql -d springais -c "SELECT COUNT(*) FROM job_postings;" # Should be 20-30
psql -d springais -c "SELECT COUNT(*) FROM users WHERE email LIKE 'demo%';" # Should be 3-5
```

---

## E2E Test Verification

### 1. User Authentication Flow Test

**Run E2E test:**
```bash
npx playwright test auth.spec.ts
```

**Expected output:**
```
✓ auth.spec.ts:5:1 › user can register new account (1.2s)
✓ auth.spec.ts:15:1 › user can login with valid credentials (800ms)
✓ auth.spec.ts:25:1 › login fails with invalid credentials (600ms)
✓ auth.spec.ts:35:1 › user can logout (500ms)
✓ auth.spec.ts:45:1 › protected route redirects to login when not authenticated (400ms)
```

**Manual verification:**
1. Open browser: `http://localhost:3000/register`
2. Register: `test-user-$(date +%s)@example.com`, password, name
3. Verify: Redirect to `/dashboard`, token in localStorage
4. Logout: Click logout button
5. Verify: Redirect to `/login`, token cleared
6. Try accessing `/dashboard` directly
7. Verify: Redirect to `/login` (protected route)

**Pass Criteria:**
- All 5 auth tests pass
- Registration creates user in database
- Login returns JWT token
- Logout clears token and redirects
- Protected routes require authentication

---

### 2. Skills Extraction Flow Test

**Run E2E test:**
```bash
npx playwright test skills.spec.ts
```

**Expected output:**
```
✓ skills.spec.ts:5:1 › user can upload resume PDF (2.5s)
✓ skills.spec.ts:20:1 › skills appear in dashboard after extraction (3.0s)
✓ skills.spec.ts:35:1 › skills mapped to O*NET taxonomy (1.5s)
✓ skills.spec.ts:45:1 › skill tree visualization renders (1.2s)
✓ skills.spec.ts:55:1 › invalid file upload shows error (800ms)
✓ skills.spec.ts:65:1 › large file upload shows error (600ms)
```

**Manual verification:**
1. Login as demo user: `demo@springais.com` / `DemoPass123`
2. Navigate to Skills Dashboard
3. Upload resume PDF: Drag-drop or click "Upload Resume"
4. Verify: Progress bar shows "Extracting skills... 60%"
5. Wait for extraction (5-10 seconds)
6. Verify: Skills appear in dashboard (skill cards or tree)
7. Verify: Skills have O*NET codes (hover or click for details)
8. Test invalid file: Upload .txt or .jpg file
9. Verify: Error message "Invalid file format. Please upload PDF or DOCX."

**Pass Criteria:**
- All 6 skills tests pass
- Resume upload triggers skill extraction
- Skills appear after extraction completes
- Skills mapped to O*NET taxonomy (codes visible)
- Skill tree visualization renders correctly
- Invalid files rejected with clear error message

---

### 3. Job Matching Flow Test

**Run E2E test:**
```bash
npx playwright test matching.spec.ts
```

**Expected output:**
```
✓ matching.spec.ts:5:1 › user can find job matches (1.8s)
✓ matching.spec.ts:20:1 › match results sorted by score (1.2s)
✓ matching.spec.ts:30:1 › gap analysis shows for selected match (1.5s)
✓ matching.spec.ts:45:1 › gap analysis shows required vs current skills (1.0s)
✓ matching.spec.ts:55:1 › filter matches by role type (900ms)
✓ matching.spec.ts:65:1 › no matches scenario shows helpful message (700ms)
```

**Manual verification:**
1. Login and navigate to Skills Dashboard
2. Click "Find Matches" button
3. Verify: Loading state shows (spinner or skeleton cards)
4. Wait for results (1-2 seconds)
5. Verify: 5-10 match cards appear
6. Verify: Cards sorted by match score (highest first, e.g., 92%, 88%, 85%)
7. Click on top match card
8. Verify: Gap analysis modal/section appears
9. Verify: Shows "You have 8/10 required skills"
10. Verify: Lists missing skills (e.g., "Docker, Kubernetes")
11. Test filters: Select "Senior" role type
12. Verify: Results update to show only senior roles

**Pass Criteria:**
- All 6 matching tests pass
- Match results load within 2 seconds
- Results sorted by match score (descending)
- Gap analysis shows required vs. current skills
- Missing skills clearly highlighted
- Filters work (role type, seniority, etc.)

---

### 4. Career Path Visualization Flow Test

**Run E2E test:**
```bash
npx playwright test career-path.spec.ts
```

**Expected output:**
```
✓ career-path.spec.ts:5:1 › user can view career path (2.0s)
✓ career-path.spec.ts:20:1 › career path nodes render correctly (1.5s)
✓ career-path.spec.ts:35:1 › click node shows success patterns (1.2s)
✓ career-path.spec.ts:50:1 › success patterns show time and skills (1.0s)
✓ career-path.spec.ts:60:1 › zoom and pan controls work (800ms)
✓ career-path.spec.ts:70:1 › mobile view is scrollable (600ms)
```

**Manual verification:**
1. From match details, click "View Career Path" button
2. Verify: React Flow canvas loads (may take 2-3 seconds)
3. Verify: Career path nodes appear (Junior → Mid → Senior → Lead)
4. Verify: Edges connect nodes (arrows showing progression)
5. Click on "Senior Software Engineer" node
6. Verify: Success patterns panel appears (sidebar or modal)
7. Verify: Shows "Average time: 2.3 years"
8. Verify: Shows common skills (e.g., "Python, React, Docker")
9. Verify: Shows successful transitions (e.g., "80% progress to Tech Lead")
10. Test zoom: Scroll wheel to zoom in/out
11. Test pan: Click-drag to move canvas
12. Test mobile: Resize browser to 375px width
13. Verify: Canvas scrollable/pannable on mobile

**Pass Criteria:**
- All 6 career path tests pass
- React Flow visualization renders correctly
- Nodes clickable and show success patterns
- Success patterns data accurate (time, skills, transitions)
- Zoom/pan controls functional
- Mobile view usable (scrollable/pannable)

---

## Performance Verification

### 1. Frontend Performance Audit

**Run Lighthouse audit:**
```bash
npx lighthouse http://localhost:3000 --view
```

**Expected scores:**
- Performance: >90
- Accessibility: >90
- Best Practices: >90
- SEO: >80

**Manual measurement (Chrome DevTools):**

1. **Homepage load time:**
   - Open Chrome DevTools → Network tab
   - Hard refresh: Ctrl+Shift+R (clear cache)
   - Check "DOMContentLoaded": Should be <1.5s
   - Check "Load": Should be <2s

2. **Dashboard load time:**
   - Navigate to `/dashboard`
   - Check "DOMContentLoaded": Should be <2s
   - Check "Load": Should be <2.5s

3. **Skills dashboard load time:**
   - Navigate to Skills Dashboard
   - Check "Load": Should be <2.5s (includes API calls)

4. **Bundle size:**
   ```bash
   npm run build
   ls -lh build/static/js/*.js
   ```
   - Main bundle: <300KB gzipped
   - Total JS: <500KB gzipped

**Pass Criteria:**
- Lighthouse performance score >90
- Homepage loads in <2s
- Dashboard loads in <2.5s
- Bundle size <500KB gzipped
- No console errors or warnings

---

### 2. Backend Performance Audit

**Measure API response times:**

```bash
# Auth endpoints
time curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@springais.com","password":"DemoPass123"}'
# Should complete in <500ms

# Get matches (with token)
TOKEN="your-jwt-token"
time curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/matches/1
# Should complete in <1s

# Get career path
time curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/career-path/2
# Should complete in <1s

# Get success patterns
time curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/success-patterns/2
# Should complete in <800ms
```

**Database query performance:**

```sql
-- Check slow queries
SELECT query, calls, total_time, mean_time, min_time, max_time
FROM pg_stat_statements
WHERE mean_time > 100  -- Queries averaging >100ms
ORDER BY mean_time DESC
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan < 10  -- Indexes rarely used
ORDER BY idx_scan;

-- Check cache hit rate (should be >90%)
SELECT
  sum(heap_blks_read) as heap_read,
  sum(heap_blks_hit) as heap_hit,
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as cache_hit_ratio
FROM pg_statio_user_tables;
```

**Redis cache monitoring:**

```bash
# Check Redis cache hit rate
redis-cli INFO stats | grep keyspace
redis-cli INFO stats | grep hit_rate

# Check cached keys
redis-cli KEYS "skill:*" | wc -l  # Should have many skill embeddings cached
redis-cli KEYS "onet:*" | wc -l   # Should have O*NET data cached
redis-cli KEYS "llm:*" | wc -l    # Should have LLM responses cached
```

**Pass Criteria:**
- Auth endpoints <500ms
- Matching API <1s
- Career path API <1s
- Success patterns API <800ms
- Database queries <200ms average
- Cache hit rate >90%
- No slow queries (>1s)

---

## Security Verification

### 1. Authentication Security Test

**Password hashing:**
```sql
SELECT password_hash FROM users WHERE email = 'demo@springais.com';
-- Should start with $2b$ (bcrypt)
-- Should be ~60 characters long
```

**JWT token validation:**
```bash
# Get token
TOKEN=$(curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@springais.com","password":"DemoPass123"}' \
  | jq -r '.token')

# Decode token at jwt.io (check expiration, user_id)
echo $TOKEN

# Test with invalid token
curl -H "Authorization: Bearer invalid-token" \
  http://localhost:8000/api/employees
# Should return 401 Unauthorized
```

**Protected routes:**
```bash
# Without token
curl http://localhost:8000/api/employees
# Should return 401

# With valid token
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/employees
# Should return 200 with data
```

**Rate limiting:**
```bash
# Try 10 login attempts in quick succession
for i in {1..10}; do
  curl -X POST http://localhost:8000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"demo@springais.com","password":"wrong"}' &
done
# Should block after 5 attempts (429 Too Many Requests)
```

**Pass Criteria:**
- Passwords hashed with bcrypt
- JWT tokens properly signed and expire after 7 days
- Protected routes require valid token
- Rate limiting prevents brute force (5 attempts per minute)
- Error messages don't leak information

---

### 2. Input Validation & Injection Prevention Test

**SQL injection attempts:**
```bash
# Try SQL injection in email field
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com'\'' OR '\''1'\''='\''1","password":"anything"}'
# Should return 401, not bypass authentication

# Try SQL injection in search
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/jobs?search=' OR '1'='1"
# Should return 400 or empty results, not all records
```

**XSS attempts:**
```bash
# Try XSS in name field during registration
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"xss@test.com","password":"Test123","name":"<script>alert('\''XSS'\'')</script>"}'

# Verify in frontend: Name should be escaped (no script execution)
# Check database: Script tag should be stored as-is or escaped
```

**File upload validation:**
```bash
# Try uploading non-PDF file
curl -X POST http://localhost:8000/api/skills/extract \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@malicious.exe"
# Should return 400 "Invalid file format"

# Try uploading large file (>10MB)
dd if=/dev/zero of=large.pdf bs=1M count=20
curl -X POST http://localhost:8000/api/skills/extract \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@large.pdf"
# Should return 413 "File too large"
```

**Pass Criteria:**
- SQL injection prevented (parameterized queries)
- XSS prevented (React escapes HTML)
- CSRF protection in place (SameSite cookies)
- File uploads validated (type, size, content)
- Path traversal prevented
- Error messages don't reveal system details

---

### 3. Security Scan with OWASP ZAP

**Run automated security scan:**
```bash
# Start ZAP Docker container
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:3000 \
  -r zap-report.html

# Review report
open zap-report.html
```

**Expected results:**
- 0 critical vulnerabilities
- 0 high vulnerabilities
- <5 medium vulnerabilities (review and fix or document)
- Warnings about missing security headers (acceptable for MVP)

**Common findings to address:**
- Missing Content-Security-Policy header
- Missing X-Frame-Options header
- Missing X-Content-Type-Options header
- Clickjacking vulnerability (add X-Frame-Options: DENY)

**Pass Criteria:**
- No critical vulnerabilities
- No high vulnerabilities
- Medium vulnerabilities documented and mitigated
- Security headers configured (CSP, X-Frame-Options, etc.)

---

## UI/UX Verification

### 1. Loading States Test

**Manual verification:**

1. **Skills extraction loading:**
   - Upload resume
   - Verify: Progress bar shows (e.g., "Extracting skills... 60%")
   - Verify: "Cancel" button available
   - Verify: Upload button disabled during processing

2. **Match results loading:**
   - Click "Find Matches"
   - Verify: Skeleton cards appear (not just spinner)
   - Verify: Smooth transition to actual cards

3. **Career path loading:**
   - Click "View Career Path"
   - Verify: Loading overlay on canvas
   - Verify: Smooth fade-in when diagram appears

4. **Login loading:**
   - Submit login form
   - Verify: Button shows "Logging in..." (not just "Login")
   - Verify: Button disabled during submission

**Pass Criteria:**
- All loading states user-friendly (progress bars, skeletons, etc.)
- No jarring transitions (smooth fade-ins)
- Buttons disabled during operations
- Cancel options for long operations

---

### 2. Error Handling Test

**Manual verification:**

1. **Login error:**
   - Enter wrong password
   - Verify: Error message "Invalid credentials" (clear, not technical)
   - Verify: Error shown inline (below form, not popup)
   - Verify: Form remains filled (don't clear email)

2. **Resume upload error:**
   - Upload invalid file (.txt)
   - Verify: Error message "Invalid file format. Please upload PDF or DOCX."
   - Verify: "Try again" or "Choose different file" button

3. **Network error:**
   - Disconnect internet
   - Try to find matches
   - Verify: Error message "Network error. Please check your connection and try again."
   - Verify: "Retry" button available

4. **API error:**
   - (Simulate by stopping backend)
   - Try to load dashboard
   - Verify: Error message "Unable to load data. Please try again."
   - Verify: "Refresh" button available

**Pass Criteria:**
- All error messages user-friendly (not technical jargon)
- Errors shown inline (not blocking popups)
- Retry/recovery options provided
- Form state preserved (don't clear user input)

---

### 3. Responsive Design Test

**Breakpoints to test:**
- Mobile: 375px (iPhone SE), 360px (Android)
- Tablet: 768px (iPad portrait), 1024px (iPad landscape)
- Desktop: 1280px, 1920px

**Manual verification (Chrome DevTools):**

1. **Navigation:**
   - Mobile: Hamburger menu (3 lines icon)
   - Desktop: Full navigation bar
   - Test: Click hamburger, menu slides in

2. **Skills Dashboard:**
   - Mobile: 1 column grid
   - Tablet: 2 column grid
   - Desktop: 3 column grid
   - Verify: Cards resize smoothly

3. **Match Results:**
   - Mobile: Stacked cards (full width)
   - Desktop: Grid layout (2-3 columns)
   - Verify: Gap analysis modal responsive

4. **Career Path:**
   - Mobile: Scrollable/pannable canvas (full width)
   - Desktop: Full canvas with zoom controls
   - Verify: Touch gestures work on mobile (pinch-zoom, pan)

5. **Forms:**
   - Mobile: Full width inputs, larger tap targets
   - Desktop: Max-width forms (centered)
   - Verify: Inputs readable, buttons tappable (min 44x44px)

**Pass Criteria:**
- All pages responsive (mobile, tablet, desktop)
- Navigation adapts (hamburger menu on mobile)
- Content readable on all screen sizes
- Touch targets adequate (min 44x44px on mobile)
- No horizontal scrolling (except intentional, like career path canvas)

---

### 4. Accessibility Test

**Run Lighthouse accessibility audit:**
```bash
npx lighthouse http://localhost:3000 --only-categories=accessibility --view
```

**Expected score:** >90

**Manual verification:**

1. **Keyboard navigation:**
   - Use only Tab, Enter, Escape (no mouse)
   - Verify: Can navigate entire site
   - Verify: Focus indicators visible (blue outline)
   - Verify: Can submit forms with Enter key

2. **Screen reader test (basic):**
   - Install NVDA (Windows) or VoiceOver (Mac)
   - Navigate through site
   - Verify: All content read correctly
   - Verify: Form labels announced
   - Verify: Button purposes clear

3. **Color contrast:**
   - Use Chrome DevTools: Lighthouse audit
   - Verify: Text contrast ratio >4.5:1 (WCAG AA)
   - Verify: Important buttons contrast >3:1

4. **Alt text:**
   - Inspect all images
   - Verify: All images have alt text
   - Verify: Decorative images have empty alt (alt="")

**Pass Criteria:**
- Lighthouse accessibility score >90
- Keyboard navigation works (Tab, Enter, Escape)
- Focus indicators visible
- Screen reader announces content correctly
- Color contrast meets WCAG AA (4.5:1)
- All images have alt text

---

## Demo Preparation Verification

### 1. Demo Data Verification

**Check database counts:**
```sql
-- Users (should have 3-5 demo accounts)
SELECT COUNT(*) FROM users WHERE email LIKE 'demo%';

-- Employees (should have 50-100)
SELECT COUNT(*) FROM employees;

-- Job postings (should have 20-30)
SELECT COUNT(*) FROM job_postings;

-- Skills (should have O*NET taxonomy imported)
SELECT COUNT(*) FROM skills;

-- Embeddings (should be pre-computed)
SELECT COUNT(*) FROM embeddings;
```

**Verify demo account:**
```bash
# Login as demo user
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@springais.com","password":"DemoPass123"}'
# Should return token and user data
```

**Verify demo employee data quality:**
```sql
-- Check for realistic names (not "Employee 1", "Employee 2")
SELECT name, current_role FROM employees LIMIT 10;

-- Check for career progressions (employees with multiple roles)
SELECT employee_id, COUNT(*) as role_count
FROM employee_role_history
GROUP BY employee_id
HAVING COUNT(*) > 1
LIMIT 10;
-- Should have 5-10 employees with multiple roles

-- Check for success patterns
SELECT role_id, COUNT(*) as transition_count
FROM career_transitions
GROUP BY role_id
HAVING COUNT(*) > 5
LIMIT 10;
-- Should have patterns for multiple roles
```

**Pass Criteria:**
- 3-5 demo user accounts exist
- 50-100 realistic employee profiles
- 20-30 realistic job postings
- O*NET taxonomy imported (39K+ skills)
- Skill embeddings pre-computed (avoid OpenAI calls during demo)
- 5-10 success story employees with clear progressions

---

### 2. Demo Script Verification

**Demo script checklist:**

- [ ] Introduction prepared (30 seconds)
- [ ] User registration flow (1 minute)
- [ ] Resume upload and skill extraction (1.5 minutes)
- [ ] Job matching and gap analysis (1.5 minutes)
- [ ] Career path visualization (1.5 minutes)
- [ ] Closing and impact (1 minute)
- [ ] Total time: 5-7 minutes
- [ ] Q&A prepared (tech stack, challenges, future work)

**Rehearsal checklist:**

- [ ] Demo rehearsed 3+ times
- [ ] Timing measured (aim for 5-6 minutes, leave 1-2 min for Q&A)
- [ ] Common questions prepared (see DEMO.md)
- [ ] Backup plan prepared (video recording if live demo fails)
- [ ] Team feedback incorporated (clarity, pacing, enthusiasm)

**Pass Criteria:**
- Demo script written and rehearsed
- Timing appropriate (5-7 minutes)
- Q&A answers prepared
- Backup plan ready (video or screenshots)

---

### 3. Documentation Verification

**Check all documentation exists:**

```bash
# Core documentation
ls -l README.md          # Project overview, features
ls -l SETUP.md           # Environment setup
ls -l API.md             # API documentation (or link to /docs)
ls -l ARCHITECTURE.md    # System architecture
ls -l DEMO.md            # Demo script, troubleshooting
ls -l .env.example       # Environment variables template
ls -l CONTRIBUTING.md    # Guidelines for future developers (optional)
ls -l LICENSE            # License file (optional)
```

**Review documentation quality:**

1. **README.md:**
   - [ ] Project overview and features
   - [ ] Screenshots or GIF demos
   - [ ] Setup instructions (quick start)
   - [ ] Tech stack listed
   - [ ] Links to other docs (SETUP.md, API.md, etc.)

2. **SETUP.md:**
   - [ ] Prerequisites (Docker, Node.js, Python versions)
   - [ ] Step-by-step installation (clone, install, seed data)
   - [ ] Configuration (environment variables)
   - [ ] Running services (docker-compose up)
   - [ ] Troubleshooting common issues

3. **API.md:**
   - [ ] Authentication endpoints (/auth/login, /auth/register)
   - [ ] Skills endpoints (/api/skills/extract)
   - [ ] Matching endpoints (/api/matches)
   - [ ] Career path endpoints (/api/career-path)
   - [ ] Request/response examples
   - [ ] Error codes and messages

4. **ARCHITECTURE.md:**
   - [ ] System architecture diagram (frontend, backend, database)
   - [ ] Technology stack explained
   - [ ] Data flow (user → skills → matches → career path)
   - [ ] Key design decisions (local-first, pgvector, React Flow)

5. **DEMO.md:**
   - [ ] Demo script (step-by-step)
   - [ ] Demo data seeding instructions
   - [ ] Troubleshooting demo issues
   - [ ] Q&A common questions

**Pass Criteria:**
- All core documentation files exist
- Documentation accurate and up-to-date
- Setup instructions tested (follow step-by-step on fresh machine)
- API documentation complete (all endpoints documented)
- Architecture diagram clear and helpful

---

## Final Integration Test

### Complete User Journey Test (Manual)

**Objective:** Verify complete flow works end-to-end without errors

**Steps:**

1. **Setup:**
   - [ ] Start Docker services: `docker-compose up -d`
   - [ ] Verify services healthy: `docker-compose ps` (all "Up")
   - [ ] Open browser: `http://localhost:3000`

2. **Registration:**
   - [ ] Click "Register" link
   - [ ] Enter email: `test-final-$(date +%s)@example.com`
   - [ ] Enter name: "Final Test User"
   - [ ] Enter password: "FinalTest123"
   - [ ] Click "Register" button
   - [ ] Verify: Redirect to `/dashboard`
   - [ ] Verify: Token in localStorage (F12 → Application → Local Storage)

3. **Skills Extraction:**
   - [ ] Navigate to Skills Dashboard (if not already there)
   - [ ] Click "Upload Resume" button
   - [ ] Select PDF resume: `tests/fixtures/sample-resume.pdf`
   - [ ] Verify: Progress bar shows "Extracting skills... X%"
   - [ ] Wait for extraction (5-10 seconds)
   - [ ] Verify: Skills appear in dashboard (skill cards or tree)
   - [ ] Verify: Skills have O*NET codes (hover or click)

4. **Job Matching:**
   - [ ] Click "Find Matches" button
   - [ ] Verify: Loading state shows (skeleton cards)
   - [ ] Wait for results (1-2 seconds)
   - [ ] Verify: 5-10 match cards appear
   - [ ] Verify: Cards sorted by score (highest first)
   - [ ] Click on top match
   - [ ] Verify: Gap analysis appears
   - [ ] Verify: Shows "You have X/Y required skills"
   - [ ] Verify: Lists missing skills

5. **Career Path:**
   - [ ] Click "View Career Path" button
   - [ ] Verify: React Flow canvas loads
   - [ ] Verify: Career path nodes appear (Junior → Senior → Lead)
   - [ ] Click on a node
   - [ ] Verify: Success patterns appear (sidebar or modal)
   - [ ] Verify: Shows average time, skills, transitions
   - [ ] Test zoom: Scroll wheel to zoom in/out
   - [ ] Test pan: Click-drag to move canvas

6. **Navigation:**
   - [ ] Navigate back to Dashboard
   - [ ] Verify: User data persists (name shown)
   - [ ] Navigate to Skills Dashboard
   - [ ] Verify: Extracted skills still there (cached)
   - [ ] Refresh page (F5)
   - [ ] Verify: Still logged in (token persists)

7. **Logout:**
   - [ ] Click "Logout" button
   - [ ] Verify: Redirect to `/login` or homepage
   - [ ] Verify: Token cleared from localStorage
   - [ ] Try accessing `/dashboard` directly
   - [ ] Verify: Redirect to `/login` (protected route)

8. **Login (Returning User):**
   - [ ] Click "Login" link
   - [ ] Enter previous email and password
   - [ ] Click "Login" button
   - [ ] Verify: Redirect to `/dashboard`
   - [ ] Navigate to Skills Dashboard
   - [ ] Verify: Skills load instantly (from cache, no re-extraction)

**Pass Criteria:**
- Complete journey works without errors
- No console errors at any step
- All features work as expected
- Data persists across page refreshes
- Cached data loads instantly (skills, matches)
- Logout/login cycle works correctly

---

### Performance Test (Manual)

**Measure page load times:**

1. **Clear cache:**
   - Open Chrome DevTools → Network tab
   - Check "Disable cache"
   - Hard refresh: Ctrl+Shift+R

2. **Measure homepage:**
   - Navigate to `http://localhost:3000`
   - Check "Load" time in Network tab
   - Target: <2s

3. **Measure dashboard:**
   - Login and navigate to `/dashboard`
   - Check "Load" time
   - Target: <2.5s

4. **Measure API response times:**
   - Open Network tab
   - Trigger API call (e.g., "Find Matches")
   - Check response time for `/api/matches` call
   - Target: <1s

**Pass Criteria:**
- Homepage loads in <2s
- Dashboard loads in <2.5s
- API calls respond in <1s
- No blocking operations (long waits)

---

### Demo Rehearsal (Final)

**Full demo rehearsal:**

1. **Setup:**
   - [ ] Demo laptop ready (Docker services running)
   - [ ] Browser open to `http://localhost:3000`
   - [ ] Demo account ready: `demo@springais.com` / `DemoPass123`
   - [ ] Sample resume ready: `tests/fixtures/demo-resume.pdf`
   - [ ] Timer ready (for 5-7 minute limit)

2. **Run demo:**
   - [ ] Start timer
   - [ ] Follow demo script (DEMO.md)
   - [ ] Introduction (30s)
   - [ ] Registration and resume upload (1 min)
   - [ ] Skills dashboard (1.5 min)
   - [ ] Job matching (1.5 min)
   - [ ] Career path (1.5 min)
   - [ ] Closing (1 min)
   - [ ] Stop timer

3. **Verify timing:**
   - [ ] Total time: 5-7 minutes
   - [ ] Pacing appropriate (not rushed, not slow)
   - [ ] Time for Q&A (1-2 minutes remaining)

4. **Q&A practice:**
   - [ ] "What tech stack did you use?"
   - [ ] "How do you handle data privacy?"
   - [ ] "What was your biggest challenge?"
   - [ ] "What would you add next?"
   - [ ] "How scalable is this?"

**Pass Criteria:**
- Demo runs smoothly (no errors)
- Timing appropriate (5-7 minutes)
- Q&A answers clear and concise
- Team confident and enthusiastic

---

## Troubleshooting Verification Issues

### Issue: E2E tests failing

**Diagnosis:**
```bash
# Run tests with debug output
DEBUG=pw:api npx playwright test --headed

# Check for specific errors
npx playwright test --reporter=line
```

**Common causes:**
- Services not running (docker-compose ps)
- Database not seeded (run seed script)
- Timing issues (add explicit waits)
- Network issues (check API connectivity)

---

### Issue: Performance benchmarks not met

**Diagnosis:**
```bash
# Check bundle size
npm run build
ls -lh build/static/js/*.js

# Check database query performance
psql -d springais -c "EXPLAIN ANALYZE SELECT * FROM employees LIMIT 10;"

# Check Redis cache hit rate
redis-cli INFO stats | grep hit_rate
```

**Common causes:**
- Large bundle size (use webpack-bundle-analyzer)
- Slow database queries (missing indexes)
- Low cache hit rate (increase TTL, warm cache)
- Production mode not enabled (NODE_ENV=production)

---

### Issue: Security scan fails

**Diagnosis:**
```bash
# Review OWASP ZAP report
open zap-report.html

# Check for specific vulnerabilities
grep -i "critical\|high" zap-report.html
```

**Common causes:**
- Missing security headers (add CSP, X-Frame-Options)
- Weak password policy (enforce complexity)
- SQL injection (use parameterized queries)
- XSS vulnerability (escape user input)

---

### Issue: Demo crashes or errors

**Diagnosis:**
```bash
# Check Docker logs
docker-compose logs backend
docker-compose logs frontend

# Check database connection
psql -d springais -c "SELECT 1;"

# Check Redis connection
redis-cli PING
```

**Common causes:**
- Services not running (restart Docker)
- Database empty (re-seed demo data)
- OpenAI API rate limit (use cached data)
- Network timeout (increase timeout settings)

---

## Final Checklist

Before marking BLOCK-Q as complete:

**E2E Tests:**
- [ ] All E2E tests pass (auth, skills, matching, career path)
- [ ] Tests cover happy path and error scenarios
- [ ] Tests run reliably (no flakiness)

**Performance:**
- [ ] Lighthouse score >90 on all pages
- [ ] Page load times <2s
- [ ] API response times <1s
- [ ] Bundle size optimized (<500KB gzipped)

**Security:**
- [ ] Security audit complete (OWASP ZAP or manual)
- [ ] No critical vulnerabilities
- [ ] Passwords hashed, tokens signed
- [ ] Input validation comprehensive
- [ ] Rate limiting implemented

**UI/UX:**
- [ ] All pages responsive (mobile, tablet, desktop)
- [ ] Loading states user-friendly
- [ ] Error handling clear and actionable
- [ ] Accessibility score >90
- [ ] Animations smooth and respectful of user preferences

**Demo:**
- [ ] Demo data seeded (50+ employees, 20+ jobs)
- [ ] Demo script prepared and rehearsed (5-7 min)
- [ ] Q&A answers ready
- [ ] Backup plan prepared (video or screenshots)

**Documentation:**
- [ ] README.md complete (overview, setup, features)
- [ ] SETUP.md complete (detailed installation)
- [ ] API.md complete (all endpoints documented)
- [ ] ARCHITECTURE.md complete (diagram, tech stack)
- [ ] DEMO.md complete (script, troubleshooting, Q&A)

**Integration:**
- [ ] Complete user journey works (register → skills → matches → career path)
- [ ] All integrations work together (not just isolated)
- [ ] System stable on demo laptop (no crashes)
- [ ] Backup database created (SQL dump)

---

## Success Criteria Met

If all above checks pass:

1. ✅ Update `TASKS.md` - all 12 tasks checked
2. ✅ Update `PROJECT-STATUS.md`:
   - Status: 🔄 → ✅
   - Progress: 12/12 tasks
   - Overall Progress: 18/18 blocks (100%)
3. ✅ Commit changes:
   ```bash
   git add .
   git commit -m "✅ Complete BLOCK-Q: E2E Testing & Polish - SpringAIS ready for demo!"
   git push
   ```
4. ✅ Celebrate: "All blocks complete! SpringAIS ready for competition!"
5. ✅ Final preparation: Charge laptop, print materials, rehearse demo

---

**Last Updated:** 2026-01-06
**Status:** Ready for verification
