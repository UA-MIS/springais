# BLOCK H: Auth & Layout Structure - VERIFICATION

**Block:** BLOCK-H-AUTH-LAYOUT
**Purpose:** Verify authentication flow and layout structure work correctly

---

## Quick Verification Commands

```bash
# Start frontend dev server
cd frontend
npm run dev

# Open browser
http://localhost:5173

# Check for console errors
# Open DevTools → Console (should have no errors)

# Check localStorage after login
# Open DevTools → Application → Local Storage → Check for 'token' key
```

---

## Manual Verification Checklist

### 1. Login Flow

**Steps:**
1. Navigate to `http://localhost:5173`
2. Should redirect to `/login` (not authenticated)
3. Enter mock credentials:
   - Email: `admin@ey.com`
   - Password: `password`
4. Click "Login" button

**Expected Results:**
- ✅ Redirects to `/dashboard` on successful login
- ✅ Token stored in localStorage (check DevTools → Application → Local Storage)
- ✅ User name displayed in header (e.g., "John Doe")
- ✅ No console errors

### 2. Protected Routes

**Test A: Access Without Login**
1. Open incognito/private window
2. Navigate directly to `http://localhost:5173/dashboard`

**Expected Result:**
- ✅ Redirects to `/login`

**Test B: Access With Login**
1. Login with mock credentials
2. Navigate to `/dashboard`, `/matches`, `/career-path`, `/success-patterns`

**Expected Results:**
- ✅ All routes accessible (show MainLayout with placeholders)
- ✅ No redirects to login

### 3. Session Persistence

**Steps:**
1. Login with mock credentials
2. Refresh page (F5 or Cmd+R)

**Expected Results:**
- ✅ Still logged in (not redirected to login)
- ✅ Token still in localStorage
- ✅ User name still displayed in header

### 4. Layout Structure

**Visual Verification:**
1. After login, verify layout structure:

**Expected Layout:**
```
┌─────────────────────────────────────────────┐
│  Header: [Logo "SpringAIS"] [John Doe] [Logout] │
├──────────┬──────────────────────────────────┤
│          │                                  │
│ Sidebar  │  Content Area                    │
│          │                                  │
│ • Skills │  [Dashboard content]             │
│   Matches│                                  │
│   Career │                                  │
│   Success│                                  │
│          │                                  │
└──────────┴──────────────────────────────────┘
```

**Checklist:**
- ✅ Header visible at top (black background, white text)
- ✅ Sidebar on left with navigation links
- ✅ Content area takes remaining space
- ✅ Logo "SpringAIS" visible in header
- ✅ User name "John Doe" visible in header
- ✅ Logout button visible in header

### 5. Sidebar Navigation

**Steps:**
1. Click each sidebar link:
   - Skills Dashboard
   - Match Results
   - Career Path
   - Success Patterns

**Expected Results:**
- ✅ URL updates to correct route (/dashboard, /matches, etc.)
- ✅ Active link is highlighted (yellow background or border)
- ✅ Content area updates (may show placeholder "Coming soon" for now)
- ✅ No page refresh (SPA navigation)

### 6. Logout Flow

**Steps:**
1. Login with mock credentials
2. Click "Logout" button in header

**Expected Results:**
- ✅ Redirects to `/login`
- ✅ Token removed from localStorage (check DevTools)
- ✅ Accessing `/dashboard` now redirects to login

### 7. Axios Interceptor

**Test A: Request Interceptor**
1. Login with mock credentials
2. Open DevTools → Network tab
3. Navigate to `/dashboard` (will trigger API call in future blocks)
4. Check request headers

**Expected Result:**
- ✅ `Authorization: Bearer [token]` header present in API requests
- (For now, may not see API calls if using mock data)

**Test B: Response Interceptor (401 Handling)**
1. Manually edit token in localStorage to invalid value:
   ```javascript
   localStorage.setItem('token', 'invalid-token-12345');
   ```
2. Refresh page
3. Trigger any API call (in future blocks)

**Expected Result:**
- ✅ Automatically redirects to `/login` on 401 error
- ✅ Token cleared from localStorage

### 8. Styling & Branding

**Visual Checklist:**
- ✅ Header: Black background (#2E2E38), white text
- ✅ Logo uses EY yellow (#FFE600) accent
- ✅ Sidebar: Light gray background (#F5F5F5)
- ✅ Active link: Yellow highlight or border
- ✅ Login button: Yellow background, dark text
- ✅ Professional, clean design
- ✅ Matches UX reference design (generally)

### 9. Responsive Layout (Bonus)

**Steps:**
1. Resize browser window to mobile width (<768px)

**Expected Results:**
- ✅ Sidebar collapses or becomes hamburger menu (if implemented)
- ✅ Header remains visible
- ✅ Content area stacks vertically
- (This is bonus - OK if not fully responsive yet)

---

## Browser DevTools Verification

### Check LocalStorage

```javascript
// Open DevTools → Console
localStorage.getItem('token')
// Should return: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock.token"

// Check after logout
localStorage.getItem('token')
// Should return: null
```

### Check React Context

```javascript
// In DevTools → React Components (if React DevTools installed)
// Find <AuthProvider>
// Check state: user, token, loading
```

### Network Tab

After login:
- ✅ POST request to `/api/auth/login` (if using real endpoint)
- ✅ Response includes `token` and `user` object
- (For now, using mock, so may not see network request)

---

## Console Error Check

**Expected:**
- ✅ No errors in console
- ✅ No warnings about missing keys, deprecated methods
- ✅ No CORS errors (backend CORS configured in STEP-1)

**Common Errors to Fix:**
- ❌ "Cannot read property 'user' of undefined" → AuthContext not provided
- ❌ "Uncaught Error: useAuth must be used within AuthProvider" → Check provider wraps app
- ❌ "Network Error" → Check backend is running, CORS configured

---

## Acceptance Criteria Checklist

- [x] **Login:** Mock login works, stores token, redirects to dashboard ✅ (Code verified)
- [x] **Protected Routes:** Cannot access /dashboard without login ✅ (Code verified)
- [x] **Session Persistence:** Refresh page keeps user logged in ✅ (Code verified - token from localStorage)
- [x] **Layout:** Header + Sidebar + Content area render correctly ✅ (Code verified)
- [x] **Navigation:** Sidebar links navigate to correct routes ✅ (Code verified - NavLink used)
- [x] **Active Route:** Current route highlighted in sidebar ✅ (Code verified - isActive prop)
- [x] **Logout:** Clears token, redirects to login ✅ (Code verified)
- [x] **Axios Interceptor:** Adds Authorization header to requests ✅ (Code verified)
- [x] **401 Handling:** Auto-logout on 401 response ✅ (Code verified)
- [x] **Styling:** Matches EY branding (black, white, yellow) ✅ (Code verified)
- [x] **No Errors:** Console has no errors or warnings ✅ (Linter verified, manual test needed)

---

## Screenshot Verification

Take screenshots of:
1. Login page
2. Main layout (header + sidebar + content)
3. Sidebar with active link highlighted
4. DevTools showing token in localStorage

Compare with UX reference: `_bmad-output/ux-unified-dashboard-v2-with-enhanced-roadmap.html`

---

## Common Issues & Solutions

### Issue: Infinite redirect loop (/login → /dashboard → /login)

**Solution:**
- Check that `token` is being stored in localStorage
- Verify ProtectedRoute is checking for token correctly
- Check that login sets both `token` and `user` in context

### Issue: "Cannot read property 'token' of undefined"

**Solution:**
```jsx
// Make sure App.jsx is wrapped with AuthProvider
<AuthProvider>
  <BrowserRouter>
    <Routes>...</Routes>
  </BrowserRouter>
</AuthProvider>
```

### Issue: Sidebar links don't navigate

**Solution:**
- Use `<Link to="/dashboard">` from react-router-dom, not `<a href>`
- Ensure routes are defined in App.jsx
- Check that MainLayout uses `<Outlet />` for nested routes

### Issue: Token not persisting after refresh

**Solution:**
- Check that AuthContext initializes `token` from localStorage on mount
```jsx
const [token, setToken] = useState(() => localStorage.getItem('token'));
```

### Issue: Styling not applied

**Solution:**
- Verify Tailwind CSS is configured (STEP-1-SETUP)
- Check `tailwind.config.js` content paths include components
- Run `npm run dev` to rebuild

---

## Performance Check

**Expected:**
- ✅ Login redirect happens instantly (<100ms)
- ✅ Route navigation is instant (no page reload)
- ✅ No unnecessary re-renders (check React DevTools Profiler)

---

## Next Steps After Verification

Once all checks pass:

1. ✅ Mark all tasks complete in `TASKS.md`
2. ✅ Update `PROJECT-STATUS.md`:
   - Block H: ✅ Completed | [Your Name] | 13/13 tasks
3. ✅ Commit and push changes:
   ```bash
   git add .
   git commit -m "✅ Complete BLOCK-H: Auth & layout structure - Navigation and protected routes"
   git push
   ```
4. ✅ Create placeholder pages for Blocks I, J, K, L (can render "Coming soon")
5. ✅ Share layout components with team (other frontend blocks will use MainLayout)
6. ✅ Prepare for Step 3 Block M (Core Integration) - connect auth to real backend

---

**Block H is complete when all acceptance criteria are met and manual tests pass** ✅
