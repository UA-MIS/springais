# BLOCK M: Core Integration - VERIFICATION

**Block:** BLOCK-M-CORE-INTEGRATION
**Purpose:** Verify authentication system connects frontend to backend via database

---

## Quick Verification Commands

```bash
# 1. Register a test user
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123","name":"Test User"}'

# 2. Login and capture token
TOKEN=$(curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123"}' \
  | jq -r '.token')

# 3. Test protected route with token
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/employees

# 4. Test protected route without token (should fail)
curl http://localhost:8000/api/employees

# 5. Test skill recommendations endpoint
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/skills/recommendations

# 6. Test recommendation status update
curl -X PATCH -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress"}' \
  "http://localhost:8000/api/skills/recommendations/Python/status"
```

---

## Manual Verification Steps

### 1. Backend Auth Endpoints Test

**Test registration:**
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123",
    "name": "John Doe"
  }'
```

**Expected response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

**Verify user in database:**
```sql
SELECT id, email, name, password_hash FROM users WHERE email = 'john@example.com';
```

**Expected:** 1 row, password_hash is bcrypt hash (starts with `$2b$`)

**✅ Pass Criteria:**
- Registration endpoint returns 200
- Token is valid JWT (check at jwt.io)
- User record created in database
- Password is hashed (not plaintext)

---

### 2. Login Test

**Test valid credentials:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123"
  }'
```

**Expected response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

**Test invalid password:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "WrongPassword"
  }'
```

**Expected response:**
```json
{
  "detail": "Invalid credentials"
}
```
Status code: 401

**Test non-existent email:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "notfound@example.com",
    "password": "AnyPassword"
  }'
```

**Expected:** 401 Unauthorized

**✅ Pass Criteria:**
- Valid credentials return 200 with token
- Invalid password returns 401
- Non-existent email returns 401
- Error messages don't leak information (don't say "email not found" vs "wrong password")

---

### 3. Protected Route Test

**Save token from login:**
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Test with valid token:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8000/api/employees
```

**Expected:** 200 OK with employee data (or empty array if no employees)

**Test without token:**
```bash
curl http://localhost:8000/api/employees
```

**Expected:** 401 Unauthorized

**Test with malformed token:**
```bash
curl -H "Authorization: Bearer invalid-token" \
     http://localhost:8000/api/employees
```

**Expected:** 401 Unauthorized with "Invalid token" message

**Test with expired token:**
```bash
# Use an expired token (you can create one with 1-second expiry for testing)
curl -H "Authorization: Bearer <expired-token>" \
     http://localhost:8000/api/employees
```

**Expected:** 401 Unauthorized with "Token expired" message

**✅ Pass Criteria:**
- Valid token allows access to protected routes
- Missing token returns 401
- Invalid token returns 401
- Expired token returns 401
- Error messages are clear

---

### 4. Frontend Login Flow Test

**Open browser:**
```
http://localhost:3000/login
```

**Test successful login:**
1. Enter email: `john@example.com`
2. Enter password: `SecurePassword123`
3. Click "Login"

**Expected:**
- Loading state shows briefly
- Redirect to `/dashboard` on success
- Dashboard shows user info (name, email)
- localStorage has `token` and `user` items

**Verify localStorage:**
```javascript
// In browser console
localStorage.getItem('token')  // Should return JWT token
localStorage.getItem('user')   // Should return JSON user object
```

**Test failed login:**
1. Enter email: `john@example.com`
2. Enter wrong password: `WrongPassword`
3. Click "Login"

**Expected:**
- Error message displays: "Invalid credentials" or similar
- No redirect
- localStorage remains empty

**✅ Pass Criteria:**
- Successful login redirects to dashboard
- Token and user stored in localStorage
- Failed login shows error, doesn't redirect
- No token stored on failed login

---

### 5. Frontend Registration Flow Test

**Open browser:**
```
http://localhost:3000/register
```

**Test successful registration:**
1. Enter name: `Jane Smith`
2. Enter email: `jane@example.com`
3. Enter password: `SecurePassword456`
4. Click "Register"

**Expected:**
- Loading state shows briefly
- Redirect to `/dashboard` on success
- Dashboard shows user info

**Verify in database:**
```sql
SELECT id, email, name FROM users WHERE email = 'jane@example.com';
```

**Expected:** 1 row with Jane's data

**Test duplicate email:**
1. Enter name: `Another User`
2. Enter same email: `jane@example.com`
3. Enter password: `DifferentPassword`
4. Click "Register"

**Expected:**
- Error message: "Email already registered" or similar
- No redirect
- No new user created

**✅ Pass Criteria:**
- New user can register successfully
- Duplicate email shows error
- Password requirements enforced (frontend validation)
- Successful registration auto-logs in (token stored)

---

### 6. Frontend Protected Route Test

**Test without login:**
1. Open browser in incognito/private mode
2. Navigate directly to: `http://localhost:3000/dashboard`

**Expected:**
- Redirect to `/login` automatically
- No dashboard content shown

**Test with login:**
1. Login as existing user
2. Navigate to `/dashboard`

**Expected:**
- Dashboard loads successfully
- User data displayed
- No redirect

**Test logout:**
1. While logged in, click "Logout" button
2. Verify redirect to homepage or login

**Expected:**
- localStorage cleared (no token or user)
- Redirect to `/login`
- Accessing `/dashboard` now redirects to login

**✅ Pass Criteria:**
- Unauthenticated users can't access dashboard
- Authenticated users can access dashboard
- Logout clears token and redirects

---

### 7. Token Expiration Handling Test

**Simulate expired token:**
```javascript
// In browser console (while on dashboard)
// Replace token with expired one
localStorage.setItem('token', '<expired-token>')

// Try making an API call (e.g., fetch employees)
fetch('http://localhost:8000/api/employees', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
})
```

**Expected:**
- API returns 401
- Frontend API client catches 401
- Token cleared from localStorage
- Redirect to `/login`

**Or test by waiting:**
1. Set `ACCESS_TOKEN_EXPIRE_DAYS = 0.000001` (very short expiry)
2. Login
3. Wait a few seconds
4. Try to access dashboard or make API call

**Expected:**
- API returns 401 "Token expired"
- Auto-redirect to login

**✅ Pass Criteria:**
- Expired tokens properly rejected by backend
- Frontend handles 401 gracefully
- User redirected to login
- Clear error message (not crash)

---

### 8. CORS Verification Test

**Test from frontend:**
```javascript
// In browser console on http://localhost:3000
fetch('http://localhost:8000/api/employees')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

**Expected:**
- If no CORS error: Successfully fetches data (or gets 401 if not authenticated)
- If CORS error: "Access to fetch at ... from origin ... has been blocked by CORS policy"

**If CORS error, check backend:**
```python
# backend/app/main.py should have:
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
```

**✅ Pass Criteria:**
- Frontend can make requests to backend without CORS errors
- Authorization header allowed
- Credentials (cookies) allowed if needed

---

### 9. Integration Test Suite

**Run backend tests:**
```bash
cd backend
pytest tests/test_auth.py -v
```

**Expected output:**
```
test_register ... PASSED
test_register_duplicate_email ... PASSED
test_login_success ... PASSED
test_login_invalid_credentials ... PASSED
test_protected_route_with_token ... PASSED
test_protected_route_without_token ... PASSED
test_token_expiration ... PASSED
```

**Run frontend tests:**
```bash
cd frontend
npm test -- auth.test.tsx
```

**Expected output:**
```
✓ redirects to login when not authenticated
✓ shows dashboard when authenticated
✓ clears token on 401 response
✓ login form submits correctly
✓ register form submits correctly
```

**✅ Pass Criteria:**
- All backend auth tests pass
- All frontend auth tests pass
- No flaky tests (run twice to confirm)

---

### 10. End-to-End Manual Test

**Complete user journey:**

1. **Register:**
   - Go to `/register`
   - Register as `user1@example.com`
   - Verify auto-login (token in localStorage)
   - Verify redirect to dashboard

2. **Logout:**
   - Click logout
   - Verify redirect to login
   - Verify token cleared

3. **Login:**
   - Go to `/login`
   - Login as `user1@example.com`
   - Verify redirect to dashboard

4. **Navigate:**
   - Go to different pages while logged in
   - All should work
   - Token should persist

5. **Refresh page:**
   - While on dashboard, refresh browser (F5)
   - Should stay logged in (not redirect to login)
   - User state restored from localStorage

6. **Open new tab:**
   - Open new tab, navigate to `/dashboard`
   - Should be logged in (token shared across tabs)

7. **Close browser, reopen:**
   - Close browser completely
   - Reopen, go to `/dashboard`
   - Should still be logged in (token persisted)

**✅ Pass Criteria:**
- Complete flow works without errors
- Token persists across refreshes and tabs
- Logout properly clears state
- No console errors at any point

---

## Troubleshooting Common Issues

### Issue: "CORS policy blocking requests"

**Symptom:** Browser console shows CORS error

**Diagnosis:**
```javascript
// Check in browser Network tab
// Look for OPTIONS preflight request
// Check response headers for Access-Control-Allow-*
```

**Solution:**
- Add CORSMiddleware to FastAPI (see Task 2)
- Ensure `allow_origins` includes frontend URL
- Ensure `allow_headers` includes "Authorization"
- Restart backend after changes

---

### Issue: "Invalid token" immediately after login

**Symptom:** Login succeeds but API calls fail with 401

**Diagnosis:**
```javascript
// In browser console
const token = localStorage.getItem('token')
console.log(token)  // Should be long JWT string

// Try decoding at jwt.io
// Check expiration date
```

**Solution:**
- Verify JWT_SECRET_KEY matches between token creation and verification
- Check token is stored correctly (no extra quotes or whitespace)
- Verify token format in Authorization header: `Bearer <token>` (note space)

---

### Issue: "User logged out randomly"

**Symptom:** User redirected to login while browsing

**Diagnosis:**
- Check browser console for 401 errors
- Check backend logs for "Token expired" or "Invalid token"
- Verify token expiration time (should be 7 days, not 7 seconds)

**Solution:**
- Check `ACCESS_TOKEN_EXPIRE_DAYS` in .env (should be 7, not 0.000001)
- Verify system clock is correct (affects JWT exp claim)
- Consider implementing token refresh logic

---

### Issue: "Password hash mismatch"

**Symptom:** Login fails even with correct password

**Diagnosis:**
```sql
SELECT password_hash FROM users WHERE email = 'user@example.com';
-- Should start with $2b$ (bcrypt)
-- Should be ~60 characters long
```

**Solution:**
- Verify bcrypt is installed: `pip list | grep bcrypt`
- Check password is hashed on registration: `hash_password(request.password)`
- Verify password is NOT hashed on login check: `verify_password(request.password, user.password_hash)`

---

### 11. Skill Recommendations - Database Test

**Verify table exists:**
```sql
-- Check table created
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_skill_recommendations';
```

**Expected columns:**
- `id` (uuid)
- `user_id` (uuid)
- `skill_name` (varchar)
- `category` (varchar)
- `priority_score` (numeric)
- `source` (varchar)
- `related_job_ids` (jsonb)
- `status` (varchar)
- `created_at`, `updated_at` (timestamp)

**✅ Pass Criteria:**
- Table exists with all required columns
- Foreign key to `user_profiles` exists
- Indexes on `user_id` and `priority_score`

---

### 12. Skill Recommendations - API Test

**Test get recommendations (empty - cold start):**
```bash
# User with no matches or career goal
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8000/api/skills/recommendations
```

**Expected response (LLM bootstrap):**
```json
{
  "recommendations": [
    {
      "skill": "Python",
      "category": "programming",
      "priority": 0.5,
      "source": "llm_bootstrap",
      "related_roles": [],
      "status": "recommended"
    },
    ...
  ]
}
```

**Test refresh recommendations:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
     "http://localhost:8000/api/skills/recommendations?refresh=true"
```

**Expected:** Fresh recommendations computed

**Test update status:**
```bash
curl -X PATCH -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"status": "in_progress"}' \
     "http://localhost:8000/api/skills/recommendations/Python/status"
```

**Expected response:**
```json
{
  "skill": "Python",
  "status": "in_progress"
}
```

**Test dismiss recommendation:**
```bash
curl -X PATCH -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"status": "dismissed"}' \
     "http://localhost:8000/api/skills/recommendations/Python/status"
```

**Expected:** Skill no longer appears in default recommendations list

**✅ Pass Criteria:**
- Empty user gets LLM bootstrap recommendations
- Refresh parameter triggers recomputation
- Status updates persist to database
- Dismissed skills excluded from results

---

### 13. Skill Recommendations - Aggregation Test

**Setup: Create user with saved matches**
```sql
-- Insert test matches with skill_gaps
INSERT INTO matches (id, user_id, employee_id, job_posting_id, match_mode, 
                     overall_score, skill_match_score, experience_score, 
                     growth_potential_score, skill_gaps, matched_skills)
VALUES 
  (gen_random_uuid(), '<user_id>', 'EMP001', 'JOB001', 'best_fit', 
   0.8, 0.7, 0.9, 0.75, '["Python", "AWS", "Leadership"]', '["SQL", "Java"]'),
  (gen_random_uuid(), '<user_id>', 'EMP001', 'JOB002', 'best_fit', 
   0.75, 0.65, 0.85, 0.8, '["Python", "Docker", "Leadership"]', '["SQL"]'),
  (gen_random_uuid(), '<user_id>', 'EMP001', 'JOB003', 'best_fit', 
   0.7, 0.6, 0.8, 0.7, '["Python", "Kubernetes"]', '["Java"]');
```

**Test aggregated recommendations:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
     "http://localhost:8000/api/skills/recommendations?refresh=true"
```

**Expected response:**
```json
{
  "recommendations": [
    {
      "skill": "Python",
      "priority": 1.0,        // 3/3 matches = highest
      "source": "saved_matches",
      "related_roles": ["JOB001", "JOB002", "JOB003"]
    },
    {
      "skill": "Leadership",
      "priority": 0.67,       // 2/3 matches
      "source": "saved_matches",
      "related_roles": ["JOB001", "JOB002"]
    },
    {
      "skill": "AWS",
      "priority": 0.33,       // 1/3 matches
      "source": "saved_matches",
      "related_roles": ["JOB001"]
    },
    ...
  ]
}
```

**✅ Pass Criteria:**
- Skills appearing in more matches have higher priority
- `related_roles` correctly lists which jobs need each skill
- Priority scores normalized (0.0 - 1.0)
- Skills user already has are excluded

---

### 14. Skill Recommendations - Career Goal Test

**Setup: Set user's career goal**
```sql
UPDATE career_paths 
SET target_position_node_id = 'senior_data_scientist'
WHERE user_id = '<user_id>';
```

**Test career goal recommendations:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
     "http://localhost:8000/api/skills/recommendations?refresh=true"
```

**Expected:** Recommendations include skills for "Senior Data Scientist" role with `source: "career_goal"` and higher priority weighting.

**✅ Pass Criteria:**
- Career goal skills included in recommendations
- Career goal skills have elevated priority (2x weight)
- Source correctly marked as "career_goal"

---

### 15. Skill Recommendations - Trigger Test

**Test auto-refresh after match save:**
1. Save a new match with unique skill gaps
2. Check recommendations updated automatically

```bash
# Save match (mock - adjust to actual endpoint)
curl -X POST -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"job_posting_id": "JOB_NEW", "skill_gaps": ["NewSkill123"]}' \
     http://localhost:8000/api/matches/save

# Get recommendations (should include NewSkill123)
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8000/api/skills/recommendations
```

**Expected:** `NewSkill123` appears in recommendations

**Test auto-refresh after resume upload:**
1. Upload new resume with different skills
2. Recommendations should exclude new current skills

**✅ Pass Criteria:**
- New matches trigger recommendation refresh
- Resume upload triggers recommendation refresh
- Career goal change triggers recommendation refresh

---

### 16. Skill Recommendations - Frontend Test

**Open browser:**
```
http://localhost:3000/profile
```

**Test skills dashboard loads recommendations:**
1. Login as user with saved matches
2. Navigate to Profile → My Skills tab

**Expected:**
- Skills display includes "recommended" status items
- Recommended skills show with visual indicator (different from active/complete)
- Priority-based ordering (highest priority first)

**Test status update from UI:**
1. Click on a recommended skill
2. Mark as "Start Learning" (in_progress)
3. Verify skill moves to active section

**Test dismiss from UI:**
1. Click dismiss on a recommended skill
2. Verify skill removed from list
3. Refresh page - skill should stay dismissed

**Verify localStorage fallback:**
```javascript
// In browser console
// Disable network, refresh page
// Should fall back to mock data with console warning
```

**✅ Pass Criteria:**
- Skills dashboard fetches from `/api/skills/recommendations`
- Recommended skills display correctly
- Status updates work (in_progress, dismissed)
- Mock data fallback works when API unavailable

---

## Final Checklist

Before marking BLOCK-M as complete:

**Authentication:**
- [ ] User can register via frontend (creates DB record)
- [ ] User can login via frontend (returns JWT token)
- [ ] Token stored in localStorage
- [ ] Token included in all API requests (Authorization header)
- [ ] Protected routes return 200 with valid token
- [ ] Protected routes return 401 without token
- [ ] Invalid credentials return 401 (not 500)
- [ ] Duplicate email registration returns 400
- [ ] Logout clears token and redirects
- [ ] Token persists across page refreshes
- [ ] 401 responses auto-redirect to login
- [ ] CORS configured correctly (no browser errors)
- [ ] All backend tests pass
- [ ] All frontend tests pass
- [ ] No security vulnerabilities (passwords hashed, tokens signed)
- [ ] Documentation updated for Blocks N, O, P (how to use API client)

**Skill Recommendations:**
- [ ] `user_skill_recommendations` table exists with correct schema
- [ ] `GET /api/skills/recommendations` returns prioritized list
- [ ] `PATCH /api/skills/recommendations/{skill}/status` works
- [ ] Aggregation from saved matches works (skill_gaps)
- [ ] Career goal skills included with elevated priority
- [ ] LLM bootstrap works for cold start users
- [ ] Priority scores normalized correctly (0.0 - 1.0)
- [ ] `related_roles` field correctly populated
- [ ] Status updates persist (in_progress, dismissed)
- [ ] Dismissed skills excluded from results
- [ ] Auto-refresh triggers work (match save, resume upload, career goal)
- [ ] Frontend displays recommendations from API
- [ ] Frontend can update recommendation status
- [ ] Mock data fallback works when API unavailable

---

## Success Criteria Met

If all above checks pass:

1. ✅ Update `TASKS.md` - all 14 tasks checked
2. ✅ Update `PROJECT-STATUS.md`:
   - Status: 🔄 → ✅
   - Progress: 14/14 tasks
3. ✅ Update Overall Progress section
4. ✅ Unblock Blocks N, O, P (update their CONTEXT.md files)
5. ✅ Commit changes:
   ```bash
   git add .
   git commit -m "✅ Complete BLOCK-M: Core integration - Auth + Skill Recommendations"
   git push
   ```
6. ✅ Notify team: "Block M complete! Core auth + skill recommendations working. Blocks N, O, P can now start."

---

**Last Updated:** 2026-01-20
**Status:** Ready for verification
