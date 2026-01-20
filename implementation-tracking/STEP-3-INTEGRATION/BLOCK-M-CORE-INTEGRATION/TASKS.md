# BLOCK M: Core Integration - TASKS

**Block:** BLOCK-M-CORE-INTEGRATION
**Total Tasks:** 14
**Completed:** 5/14 (36%)

---

## ⚠️ IMPORTANT: Update Instructions

**When you complete a task:**
1. Check the box: `- [x] Task name`
2. Update the "Completed" count at the top
3. Update `PROJECT-STATUS.md`:
   - Find "Block M" row in Step 3 table
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

### Phase 1: Backend Auth Implementation (Tasks 1-3)

- [ ] **Task 1:** Implement JWT security utilities
  - [x] Create `backend/app/utils/security.py`
  - [x] Implement `hash_password()` using bcrypt
  - [x] Implement `verify_password()`
  - [x] Implement `create_jwt_token()` with 7-day expiration
  - [x] Implement `verify_jwt_token()` with error handling
  - [x] Implement `get_current_user_from_token()` dependency
  - [ ] Add `JWT_SECRET_KEY` to `.env`
  - [x] Write unit tests for all security functions

- [x] **Task 2:** Create auth API endpoints
  - [x] Create `backend/app/routes/auth.py`
  - [x] Implement POST `/auth/register` endpoint
  - [x] Add email validation and duplicate check
  - [x] Implement POST `/auth/login` endpoint
  - [x] Add password verification
  - [x] Implement GET `/auth/me` endpoint (get current user)
  - [x] Create Pydantic schemas: RegisterRequest, LoginRequest, AuthResponse
  - [x] Add error handling (400 for duplicate, 401 for invalid credentials)
  - [x] Register auth router in `main.py`

- [ ] **Task 3:** Secure existing API routes
  - [x] Add `current_user: User = Depends(get_current_user_from_token)` to all routes
  - [ ] Update `/api/employees` routes to require authentication
  - [ ] Update `/api/jobs` routes (if exists)
  - [x] Return 401 for missing/invalid tokens
  - [x] Test protected routes with and without tokens

### Phase 2: Frontend API Client (Tasks 4-5)

- [ ] **Task 4:** Create API client with auth
  - [x] Create `frontend/src/lib/api.ts`
  - [x] Implement APIClient class with get/post/put/delete methods
  - [x] Add Authorization header with Bearer token
  - [x] Handle 401 responses (clear token, redirect to login)
  - [x] Add error handling for network failures
  - [x] Export singleton `api` instance
  - [ ] Add TypeScript types for requests/responses

- [x] **Task 5:** Create Auth Context
  - [x] Create `frontend/src/contexts/AuthContext.tsx`
  - [x] Implement AuthProvider with user state
  - [x] Implement `login(email, password)` function
  - [x] Implement `register(email, password, name)` function
  - [x] Implement `logout()` function
  - [x] Load user from localStorage on mount
  - [x] Export `useAuth()` hook
  - [x] Wrap App with AuthProvider in `main.tsx`

### Phase 3: Frontend Integration (Tasks 6-8)

- [ ] **Task 6:** Update Login page
  - [x] Import `useAuth` hook in `LoginPage.tsx`
  - [x] Replace mock login with `await login(email, password)`
  - [x] Add loading state during login
  - [x] Add error state for failed login
  - [x] Navigate to `/matches` on success
  - [x] Show validation errors (invalid email, empty password)
  - [ ] Test with valid and invalid credentials

- [ ] **Task 7:** Update Register page
  - [x] Import `useAuth` hook in `RegisterPage.tsx`
  - [x] Replace mock register with `await register(email, password, name)`
  - [x] Add loading state during registration
  - [x] Add error state for duplicate email
  - [x] Navigate to `/matches` on success
  - [x] Add password strength validation (frontend)
  - [ ] Test with valid and duplicate emails

- [ ] **Task 8:** Update protected routes
  - [x] Update `ProtectedRoute` component to use real token
  - [x] Check `localStorage.getItem('token')` instead of mock
  - [x] Redirect to `/login` if no token
  - [x] Add loading state while checking auth
  - [ ] Test navigation: dashboard without login → redirects to login

### Phase 4: Testing & Documentation (Tasks 9-10)

- [ ] **Task 9:** Write integration tests
  - [x] Backend: Test register → creates user in DB
  - [x] Backend: Test login → returns valid JWT
  - [x] Backend: Test protected route with token → 200
  - [x] Backend: Test protected route without token → 401
  - [x] Backend: Test token expiration (mock time)
  - [ ] Frontend: Test login flow end-to-end
  - [ ] Frontend: Test 401 response → clears token, redirects
  - [ ] Run all tests, ensure passing

- [x] **Task 10:** Update documentation for Blocks N, O, P
  - [x] Document API client pattern in `docs/integration_patterns.md`
  - [x] Add examples: how to make authenticated requests
  - [x] Update Block N CONTEXT.md: add auth requirement
  - [x] Update Block O CONTEXT.md: add auth requirement
  - [x] Update Block P CONTEXT.md: add auth requirement
  - [x] Document token management (storage, refresh, expiration)
  - [x] Create troubleshooting guide for common auth issues

### Phase 5: Skill Recommendations (Hybrid Approach) (Tasks 11-14)

- [ ] **Task 11:** Create skill recommendation model and migration
  - [x] Create `backend/app/models/skill_recommendation.py`
  - [x] Define `UserSkillRecommendation` model with fields:
    - `id`, `user_id`, `skill_name`, `category`, `priority_score`
    - `source` (career_goal, saved_matches, success_patterns, llm_bootstrap)
    - `related_job_ids` (JSONB), `status` (recommended, in_progress, dismissed)
  - [x] Register model in `backend/app/models/__init__.py`
  - [x] Create Alembic migration: `alembic revision --autogenerate -m "add_user_skill_recommendations"`
  - [ ] Run migration: `alembic upgrade head`
  - [ ] Verify table exists in database

- [x] **Task 12:** Create skill recommendation service
  - [x] Create `backend/app/services/recommendation_service.py`
  - [x] Implement `SkillRecommendationService` class
  - [x] Implement `compute_recommendations(user_id)` main method
  - [x] Implement Source 1: Aggregate skill_gaps from saved matches
  - [x] Implement Source 2: Get skills for career goal target position
  - [x] Implement Source 3: LLM bootstrap for cold start (no matches/goals)
  - [x] Implement `_persist_recommendations()` to save to database
  - [x] Calculate priority scores (normalize by match count)
  - [x] Write unit tests for service methods

- [x] **Task 13:** Create skill recommendation API endpoints
  - [x] Add `GET /api/skills/recommendations` endpoint to `routes/skills.py`
    - [x] Return cached recommendations by default
    - [x] If `refresh=true`, recompute from all sources
    - [x] Require authentication (use `get_current_user_from_token`)
  - [x] Add `PATCH /api/skills/recommendations/{skill_name}/status` endpoint
    - [x] Allow updating status: recommended, in_progress, dismissed
    - [x] Validate status value
  - [x] Add triggers to recompute on events:
    - [x] After resume upload (new current skills)
    - [x] After saving a match (new skill gaps)
    - [x] After setting career goal (new target)
  - [x] Write integration tests for endpoints

- [ ] **Task 14:** Update frontend to fetch recommendations
  - [x] Update `frontend/src/hooks/useSkills.js`
  - [x] Fetch from `/api/skills/recommendations` instead of mock data
  - [x] Merge current skills + recommendations into unified list
  - [x] Map recommendation status to UI status (recommended, in_progress)
  - [x] Implement `updateRecommendationStatus()` function
  - [x] Implement `refreshRecommendations()` function
  - [x] Add fallback to mock data for development
  - [ ] Test skills dashboard displays real recommendations

---

## Acceptance Criteria

All tasks must be complete AND:

**Authentication (Tasks 1-10):**
- [ ] User can register via frontend form
- [ ] Registration creates record in `users` table
- [ ] User can login via frontend form
- [ ] Login returns JWT token, stored in localStorage
- [ ] Token included in all API requests (Authorization header)
- [ ] Protected routes return 401 without token
- [ ] Protected routes work with valid token
- [ ] 401 responses clear token and redirect to login
- [ ] Logout clears token and user state
- [ ] All backend auth tests pass
- [ ] All frontend auth tests pass
- [ ] Documentation updated for Blocks N, O, P

**Skill Recommendations (Tasks 11-14):**
- [ ] `user_skill_recommendations` table exists in database
- [ ] Recommendations computed from saved matches (skill_gaps aggregation)
- [ ] Recommendations computed from career goal (if set)
- [ ] LLM bootstrap generates recommendations for cold start users
- [ ] `GET /api/skills/recommendations` returns prioritized list
- [ ] `PATCH /api/skills/recommendations/{skill}/status` updates status
- [ ] Recommendations auto-refresh on resume upload, match save, career goal set
- [ ] Frontend displays recommended skills from API (not mock data)
- [ ] User can mark recommendations as "in_progress" or "dismissed"
- [ ] Priority scores correctly reflect frequency across saved matches

---

## Dependencies

**This block depends on:**
- ✅ Block C (Database Models) - User model exists
- ✅ Block H (Auth & Layout) - Frontend auth pages exist

**This block enables:**
- Block N (Skills Dashboard Integration)
- Block O (Matching Integration)
- Block P (Visualization Integration)

**Critical files:**
- `backend/app/utils/security.py` - JWT and password utilities
- `backend/app/routes/auth.py` - Auth endpoints
- `frontend/src/lib/api.ts` - Authenticated API client
- `frontend/src/contexts/AuthContext.tsx` - Auth state management
- `frontend/src/pages/LoginPage.tsx` - Updated with real auth
- `frontend/src/pages/RegisterPage.tsx` - Updated with real auth
- `backend/app/models/skill_recommendation.py` - Skill recommendation model
- `backend/app/services/recommendation_service.py` - Aggregation logic
- `backend/app/routes/skills.py` - Recommendation endpoints
- `frontend/src/hooks/useSkills.js` - Fetch recommendations from API

---

## Troubleshooting

### Issue: "401 Unauthorized" on protected routes

**Symptom:** API returns 401 even with token

**Solution:**
- Check token format: `Bearer <token>` (note the space)
- Verify token is in Authorization header (not query string)
- Check JWT_SECRET_KEY matches between token creation and verification
- Verify user still exists in database

### Issue: Token not included in requests

**Symptom:** All API calls fail with 401

**Solution:**
- Check `localStorage.getItem('token')` returns value
- Verify API client adds Authorization header
- Check CORS allows Authorization header
- Inspect network tab: verify header present

### Issue: "CORS error" from backend

**Symptom:** Frontend can't call backend API

**Solution:**
- Add CORS middleware to FastAPI:
  ```python
  from fastapi.middleware.cors import CORSMiddleware
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["http://localhost:3000"],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"]
  )
  ```

---

**Last Updated:** 2026-01-20
**Status:** Not Started
