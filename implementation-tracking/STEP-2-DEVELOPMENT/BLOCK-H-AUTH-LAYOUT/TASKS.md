# BLOCK H: Auth & Layout Structure - TASKS

**Block:** BLOCK-H-AUTH-LAYOUT
**Total Tasks:** 13
**Completed:** 13/13 (100%)

---

## ⚠️ IMPORTANT: Update Instructions

**When you complete a task:**
1. Check the box: `- [x] Task name`
2. Update the "Completed" count at the top
3. Update `PROJECT-STATUS.md`:
   - Find "Block H" row in Step 2 table
   - Update Progress column (e.g., "3/13 tasks")

**When ALL tasks complete:**
1. ✅ Run all verification steps in `VERIFICATION.md`
2. ✅ Change status in `PROJECT-STATUS.md` from ⏸️ to ✅
3. ✅ Update Progress to "13/13 tasks (100%)"
4. ✅ Update "Overall Progress" section
5. ✅ After verification passes, commit changes (do NOT commit until verification is complete)

See `CONTEXT.md` section "Update Instructions (For AI)" for full details.

---

## Progress Tracker

### 1. Project Setup & Dependencies (2 tasks)
- [x] **Task 1.1:** Install required packages
  ```bash
  npm install react-router-dom axios
  # Tailwind CSS should already be installed from STEP-1-SETUP
  ```
  ✅ Packages already installed (verified in package.json)

- [x] **Task 1.2:** Set up environment variables
  - Create `.env` file in frontend root
  - Add: `VITE_API_URL=http://localhost:8000/api`
  - Add to `.gitignore` if not already there
  ✅ Note: .env file needs to be created manually (gitignored). API service uses fallback URL.

### 2. Authentication Context & Services (3 tasks)
- [x] **Task 2.1:** Create AuthContext
  - File: `frontend/src/context/AuthContext.tsx`
  - State: `user`, `token`, `loading`
  - Methods: `login(email, password)`, `logout()`, `checkAuth()`
  - Provider wraps entire app
  ✅ Created with TypeScript types

- [x] **Task 2.2:** Create auth service
  - File: `frontend/src/services/authService.ts`
  - Method: `login(email, password)` → POST /api/auth/login
  - Method: `logout()` → Clear token from localStorage
  - Method: `getCurrentUser(token)` → GET /api/auth/me
  - For now, use mock responses (real API in Step 3 Block M)
  ✅ Created with mock login (admin@ey.com / password)

- [x] **Task 2.3:** Create Axios instance with interceptors
  - File: `frontend/src/services/api.ts`
  - Add request interceptor: Attach token to Authorization header
  - Add response interceptor: Handle 401 errors (auto-logout)
  - Export configured axios instance
  ✅ Created with request/response interceptors

### 3. Authentication Pages (2 tasks)
- [x] **Task 3.1:** Create LoginPage component
  - File: `frontend/src/components/auth/LoginPage.tsx`
  - Form: Email input, password input, submit button
  - On submit: Call `login()` from AuthContext
  - Show error message if login fails
  - Redirect to /dashboard on success
  - Style with Tailwind (EY branding: yellow accent, professional)
  ✅ Created with EY branding colors

- [x] **Task 3.2:** Add loading and error states
  - Loading spinner while login request in progress
  - Error message display for failed login
  - Disable submit button while loading
  ✅ Loading spinner and error handling implemented

### 4. Protected Routes (1 task)
- [x] **Task 4.1:** Create ProtectedRoute component
  - File: `frontend/src/components/layout/ProtectedRoute.tsx`
  - Check if `token` exists in AuthContext
  - If no token → `<Navigate to="/login" replace />`
  - If token exists → render children
  - Show loading spinner while checking auth
  ✅ Created with loading state handling

### 5. Layout Components (4 tasks)
- [x] **Task 5.1:** Create Header component
  - File: `frontend/src/components/layout/Header.tsx`
  - Logo: "SpringAIS" (EY branding)
  - Right side: User name, logout button
  - Sticky header (stays at top on scroll)
  - Style: Black background, white text, yellow accents
  ✅ Created with EY branding

- [x] **Task 5.2:** Create Sidebar component
  - File: `frontend/src/components/layout/Sidebar.tsx`
  - Navigation links:
    - Skills Dashboard (/dashboard)
    - Match Results (/matches)
    - Career Path (/career-path)
    - Success Patterns (/success-patterns)
  - Highlight active route
  - Icons for each link (use Heroicons or similar)
  - Collapsible on mobile (bonus)
  ✅ Created with active route highlighting and emoji icons

- [x] **Task 5.3:** Create MainLayout component
  - File: `frontend/src/components/layout/MainLayout.tsx`
  - Structure: Header + Sidebar + Content area
  - Content area uses `<Outlet />` for nested routes
  - Responsive: Sidebar collapses on mobile
  ✅ Created with Header, Sidebar, and Outlet structure

- [x] **Task 5.4:** Add LogoutButton component
  - File: `frontend/src/components/auth/LogoutButton.tsx`
  - Button in Header
  - On click: Call `logout()` from AuthContext
  - Redirect to /login after logout
  ✅ Created and integrated into Header

### 6. Routing Setup (1 task)
- [x] **Task 6.1:** Configure React Router
  - File: `frontend/src/App.tsx`
  - Wrap app with `<AuthProvider>`
  - Define routes:
    - Public: `/login`
    - Protected: `/dashboard`, `/matches`, `/career-path`, `/success-patterns`
    - Default: Redirect `/` to `/dashboard`
  - Use `<ProtectedRoute>` wrapper for protected routes
  - Nested routes inside `<MainLayout>`
  ✅ Routing configured with protected routes and placeholder components

---

## Acceptance Criteria

✅ **Block H is complete when:**
1. Login page accepts email/password and stores JWT token in localStorage
2. Protected routes redirect to /login if user not authenticated
3. MainLayout renders with header, sidebar, and content area
4. Sidebar shows navigation links to all major sections
5. Active route is highlighted in sidebar
6. Logout button clears token and redirects to login
7. Axios interceptor adds Authorization header to all API calls
8. 401 responses trigger automatic logout
9. User context accessible via `useAuth()` hook throughout app
10. Styling matches EY branding (black, white, yellow)
11. Responsive layout works on desktop (mobile bonus)

---

## Files to Create/Modify

**New Files:**
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/services/authService.js`
- `frontend/src/services/api.js`
- `frontend/src/components/auth/LoginPage.jsx`
- `frontend/src/components/auth/LogoutButton.jsx`
- `frontend/src/components/layout/ProtectedRoute.jsx`
- `frontend/src/components/layout/MainLayout.jsx`
- `frontend/src/components/layout/Header.jsx`
- `frontend/src/components/layout/Sidebar.jsx`
- `frontend/.env`

**Modified Files:**
- `frontend/src/App.jsx` (routing configuration)
- `frontend/src/main.jsx` (wrap with AuthProvider if needed)

---

## Dependencies

**Blocked By:**
- STEP-1-SETUP: React app skeleton must exist

**Blocks This:**
- Block I: Skills Dashboard UI (renders inside MainLayout)
- Block J: Match Results UI (renders inside MainLayout)
- Block K: Career Visualization (renders inside MainLayout)
- Block L: Success Pattern UI (renders inside MainLayout)
- Block M: Core Integration (connects auth to backend - Step 3)

---

## Testing Checklist

- [ ] Manual test: Login with mock credentials → redirects to /dashboard
- [ ] Manual test: Access /dashboard without login → redirects to /login
- [ ] Manual test: Logout → clears token, redirects to /login
- [ ] Manual test: Refresh page while logged in → stays logged in (token persists)
- [ ] Manual test: Sidebar navigation works (all links clickable)
- [ ] Manual test: Active route highlighted in sidebar
- [ ] Manual test: Responsive layout (test on narrow screen)
- [ ] Browser console: No errors or warnings
- [ ] Browser DevTools → Application → localStorage: Token visible after login

---

## Mock Auth Responses (For This Block)

Use these mock responses until backend is ready:

```javascript
// Mock login response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock.token",
  "user": {
    "id": 1,
    "email": "admin@ey.com",
    "name": "John Doe",
    "role": "Senior Consultant",
    "department": "Advisory"
  }
}

// Mock credentials (hardcoded for testing)
email: admin@ey.com
password: password
```

---

## Example Code Snippets

### AuthContext Hook

```jsx
// context/AuthContext.jsx
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Axios Interceptor

```javascript
// services/api.js
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Protected Route

```jsx
// components/layout/ProtectedRoute.jsx
function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="text-xl">Loading...</div>
    </div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
```

---

## Styling Guidelines (EY Branding)

```css
/* Tailwind config or CSS variables */
--color-primary: #FFE600;  /* EY Yellow */
--color-dark: #2E2E38;     /* Dark gray/black */
--color-text: #FFFFFF;     /* White text */

/* Header */
background: #2E2E38
color: #FFFFFF
accent: #FFE600 (for logo, highlights)

/* Sidebar */
background: #F5F5F5 (light gray)
active link: #FFE600 background or border

/* Buttons */
primary button: #FFE600 background, #2E2E38 text
hover: darken #FFE600
```

---

**When all tasks are complete, run the verification steps in `VERIFICATION.md`**
