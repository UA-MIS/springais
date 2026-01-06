# BLOCK H: Auth & Layout Structure - CONTEXT

**Block ID:** BLOCK-H-AUTH-LAYOUT
**Phase:** STEP-2-DEVELOPMENT
**Category:** #frontend #react #auth
**Estimated Time:** 2 days
**Dependencies:** None (requires STEP-1-SETUP complete)

---

## Purpose

Build the frontend authentication system and application layout structure. This block creates:
- Login/logout functionality
- Protected routes (require authentication)
- Main application layout (header, sidebar, content area)
- Navigation components
- User session management

This is the **foundation** for all frontend blocks - every other UI component will sit within this layout.

---

## What This Block Delivers

1. **Authentication Pages** - Login, logout, (optional: register)
2. **Protected Route Wrapper** - Redirect to login if not authenticated
3. **Main Layout Component** - Header, sidebar, content area
4. **Navigation Sidebar** - Links to all major sections
5. **User Context** - Global state for current user
6. **Session Management** - Token storage, auto-logout on expiry

---

## Key Concepts

### Authentication Flow
1. User enters credentials on login page
2. Frontend sends `POST /api/auth/login` to backend
3. Backend returns JWT token + user info
4. Frontend stores token in localStorage
5. All subsequent API calls include token in `Authorization` header
6. Protected routes check for valid token before rendering

### Layout Structure
```
┌─────────────────────────────────────────────┐
│  Header (Logo, User Menu, Logout)          │
├──────────┬──────────────────────────────────┤
│          │                                  │
│ Sidebar  │  Content Area                    │
│          │                                  │
│ - Skills │  <Outlet /> ← Nested routes      │
│ - Matches│                                  │
│ - Career │                                  │
│ - Pattern│                                  │
│          │                                  │
└──────────┴──────────────────────────────────┘
```

---

## Technical Approach

### Tech Stack
- **React 18** with functional components and hooks
- **React Router v6** for routing and protected routes
- **Context API** for global auth state (or Zustand if preferred)
- **Axios** for API calls with interceptors
- **Tailwind CSS** for styling
- **localStorage** for token persistence

### Folder Structure
```
frontend/src/
├── components/
│   ├── layout/
│   │   ├── MainLayout.jsx
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   └── ProtectedRoute.jsx
│   └── auth/
│       ├── LoginPage.jsx
│       └── LogoutButton.jsx
├── context/
│   └── AuthContext.jsx
├── services/
│   └── authService.js
├── App.jsx
└── main.jsx
```

---

## Authentication Implementation

### AuthContext (Global State)
```jsx
// context/AuthContext.jsx
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('token', response.token);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### ProtectedRoute Component
```jsx
// components/layout/ProtectedRoute.jsx
function ProtectedRoute({ children }) {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
```

---

## Layout Components

### MainLayout
- Header: Logo, user name, logout button
- Sidebar: Navigation links (Skills, Matches, Career Path, Success Patterns)
- Content area: `<Outlet />` for nested routes

### Sidebar Navigation
Links to:
- `/dashboard` - Main dashboard (Skills Dashboard - Block I)
- `/matches` - Match Results (Block J)
- `/career-path` - Career Visualization (Block K)
- `/success-patterns` - Success Pattern UI (Block L)

---

## Routing Structure

```jsx
// App.jsx
<BrowserRouter>
  <AuthProvider>
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<SkillsDashboard />} />
        <Route path="/matches" element={<MatchResults />} />
        <Route path="/career-path" element={<CareerVisualization />} />
        <Route path="/success-patterns" element={<SuccessPatterns />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </AuthProvider>
</BrowserRouter>
```

---

## API Integration

### Axios Interceptor (Add Auth Token)
```javascript
// services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 Unauthorized (auto-logout)
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

export default api;
```

---

## Design Reference

See `_bmad-output/ux-unified-dashboard-v2-with-enhanced-roadmap.html` for:
- Color scheme (EY yellow/black branding)
- Layout structure
- Component styling

---

## Integration Points

**Feeds Into:**
- **Block I (Skills Dashboard UI):** Renders inside MainLayout
- **Block J (Match Results UI):** Renders inside MainLayout
- **Block K (Career Visualization):** Renders inside MainLayout
- **Block L (Success Pattern UI):** Renders inside MainLayout
- **Block M (Core Integration):** Connects auth to backend DB (Step 3)

**Depends On:**
- **Block C (Database Models):** For user model structure
- **STEP-1-SETUP:** Backend auth endpoint must exist

---

## Mock Data for Testing

For this block, mock the backend auth API:

```javascript
// Mock login (remove when backend is ready)
const mockLogin = async (email, password) => {
  return {
    token: 'mock-jwt-token-12345',
    user: {
      id: 1,
      name: 'John Doe',
      email: 'john@ey.com',
      role: 'Consultant'
    }
  };
};
```

---

## Success Criteria

✅ Block H is complete when:
1. Login page accepts credentials and stores JWT token
2. Protected routes redirect to /login if not authenticated
3. MainLayout renders with header, sidebar, content area
4. Sidebar navigation links to all major sections
5. Logout button clears token and redirects to login
6. Axios interceptor adds token to all API requests
7. 401 responses trigger auto-logout
8. User context provides global access to user/token state
9. Styling matches EY branding (see UX reference)

---

## References

**Reference Docs:**
- `reference-docs/frontend/component-library.md` - Layout component patterns (Header, Sidebar, MainLayout)
- `reference-docs/frontend/routing-structure.md` - React Router setup and protected routes
- `reference-docs/frontend/state-management.md` - Auth context and state management
- `reference-docs/frontend/styling-guide.md` - Tailwind CSS and EY branding colors

**Related Documentation:**
- **UX Design:** `_bmad-output/ux-unified-dashboard-v2-with-enhanced-roadmap.html`
- **Backend Auth Endpoint:** `POST /api/auth/login` (to be built in Block M)

**External Resources:**
- **React Router Docs:** https://reactrouter.com/en/main

---

## Notes

- For demo, can use hardcoded credentials (admin@ey.com / password)
- Real authentication connects in Step 3 Block M (Core Integration)
- Consider adding "Remember Me" checkbox (store token longer)
- Add loading state while checking auth on app load
- Sidebar should highlight current active route

---

**Next Steps:** See `TASKS.md` for implementation tasks
