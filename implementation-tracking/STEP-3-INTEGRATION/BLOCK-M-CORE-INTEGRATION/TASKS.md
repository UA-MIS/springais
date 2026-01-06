# BLOCK M: Core Integration - TASKS

**Block:** BLOCK-M-CORE-INTEGRATION
**Total Tasks:** 10
**Completed:** 0/10 (0%)

---

## Progress Tracker

### Phase 1: Backend Auth Implementation (Tasks 1-3)

- [ ] **Task 1:** Implement JWT security utilities
  - [ ] Create `backend/app/utils/security.py`
  - [ ] Implement `hash_password()` using bcrypt
  - [ ] Implement `verify_password()`
  - [ ] Implement `create_jwt_token()` with 7-day expiration
  - [ ] Implement `verify_jwt_token()` with error handling
  - [ ] Implement `get_current_user_from_token()` dependency
  - [ ] Add `JWT_SECRET_KEY` to `.env`
  - [ ] Write unit tests for all security functions

- [ ] **Task 2:** Create auth API endpoints
  - [ ] Create `backend/app/routes/auth.py`
  - [ ] Implement POST `/auth/register` endpoint
  - [ ] Add email validation and duplicate check
  - [ ] Implement POST `/auth/login` endpoint
  - [ ] Add password verification
  - [ ] Implement GET `/auth/me` endpoint (get current user)
  - [ ] Create Pydantic schemas: RegisterRequest, LoginRequest, AuthResponse
  - [ ] Add error handling (400 for duplicate, 401 for invalid credentials)
  - [ ] Register auth router in `main.py`

- [ ] **Task 3:** Secure existing API routes
  - [ ] Add `current_user: User = Depends(get_current_user_from_token)` to all routes
  - [ ] Update `/api/employees` routes to require authentication
  - [ ] Update `/api/jobs` routes (if exists)
  - [ ] Return 401 for missing/invalid tokens
  - [ ] Test protected routes with and without tokens

### Phase 2: Frontend API Client (Tasks 4-5)

- [ ] **Task 4:** Create API client with auth
  - [ ] Create `frontend/src/lib/api.ts`
  - [ ] Implement APIClient class with get/post/put/delete methods
  - [ ] Add Authorization header with Bearer token
  - [ ] Handle 401 responses (clear token, redirect to login)
  - [ ] Add error handling for network failures
  - [ ] Export singleton `api` instance
  - [ ] Add TypeScript types for requests/responses

- [ ] **Task 5:** Create Auth Context
  - [ ] Create `frontend/src/contexts/AuthContext.tsx`
  - [ ] Implement AuthProvider with user state
  - [ ] Implement `login(email, password)` function
  - [ ] Implement `register(email, password, name)` function
  - [ ] Implement `logout()` function
  - [ ] Load user from localStorage on mount
  - [ ] Export `useAuth()` hook
  - [ ] Wrap App with AuthProvider in `main.tsx`

### Phase 3: Frontend Integration (Tasks 6-8)

- [ ] **Task 6:** Update Login page
  - [ ] Import `useAuth` hook in `LoginPage.tsx`
  - [ ] Replace mock login with `await login(email, password)`
  - [ ] Add loading state during login
  - [ ] Add error state for failed login
  - [ ] Navigate to `/dashboard` on success
  - [ ] Show validation errors (invalid email, empty password)
  - [ ] Test with valid and invalid credentials

- [ ] **Task 7:** Update Register page
  - [ ] Import `useAuth` hook in `RegisterPage.tsx`
  - [ ] Replace mock register with `await register(email, password, name)`
  - [ ] Add loading state during registration
  - [ ] Add error state for duplicate email
  - [ ] Navigate to `/dashboard` on success
  - [ ] Add password strength validation (frontend)
  - [ ] Test with valid and duplicate emails

- [ ] **Task 8:** Update protected routes
  - [ ] Update `ProtectedRoute` component to use real token
  - [ ] Check `localStorage.getItem('token')` instead of mock
  - [ ] Redirect to `/login` if no token
  - [ ] Add loading state while checking auth
  - [ ] Test navigation: dashboard without login → redirects to login

### Phase 4: Testing & Documentation (Tasks 9-10)

- [ ] **Task 9:** Write integration tests
  - [ ] Backend: Test register → creates user in DB
  - [ ] Backend: Test login → returns valid JWT
  - [ ] Backend: Test protected route with token → 200
  - [ ] Backend: Test protected route without token → 401
  - [ ] Backend: Test token expiration (mock time)
  - [ ] Frontend: Test login flow end-to-end
  - [ ] Frontend: Test 401 response → clears token, redirects
  - [ ] Run all tests, ensure passing

- [ ] **Task 10:** Update documentation for Blocks N, O, P
  - [ ] Document API client pattern in `docs/integration_patterns.md`
  - [ ] Add examples: how to make authenticated requests
  - [ ] Update Block N CONTEXT.md: add auth requirement
  - [ ] Update Block O CONTEXT.md: add auth requirement
  - [ ] Update Block P CONTEXT.md: add auth requirement
  - [ ] Document token management (storage, refresh, expiration)
  - [ ] Create troubleshooting guide for common auth issues

---

## Update Instructions

**When you complete a task:**
1. Check the box: `- [x] Task name`
2. Update the "Completed" count at the top
3. Update `PROJECT-STATUS.md`:
   - Find "Block M" row in Step 3 table
   - Update Progress column (e.g., "3/10 tasks")

**When ALL tasks complete:**
1. Change status in `PROJECT-STATUS.md` from ⏸️ to ✅
2. Update Progress to "10/10 tasks (100%)"
3. Update "Overall Progress" section
4. Commit: `git add . && git commit -m "Complete BLOCK-M: Core integration - Auth connected"`
5. Notify team: "Block M complete - Blocks N, O, P are now unblocked!"

---

## Acceptance Criteria

All tasks must be complete AND:
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

**Last Updated:** 2026-01-06
**Status:** Not Started
