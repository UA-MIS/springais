# SpringAIS Routing Structure

**Last Updated:** 2026-01-06
**Library:** React Router v6

---

## Route Tree

```
/
├── /login (public)
├── / (protected - redirects to /dashboard)
├── /dashboard (protected - Skills Dashboard)
├── /matches (protected - Match Results)
├── /career-path (protected - Career Visualization)
└── /success-patterns (protected - Success Metrics)
```

---

## App.tsx Configuration

```tsx
// frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './components/auth/LoginPage';
import SkillsDashboard from './pages/SkillsDashboard';
import MatchResults from './pages/MatchResults';
import CareerVisualization from './pages/CareerVisualization';
import SuccessPatterns from './pages/SuccessPatterns';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes with layout */}
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
  );
}
```

---

## ProtectedRoute Component

```tsx
// frontend/src/components/layout/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

---

## Navigation Helpers

### useNavigate Hook

```tsx
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/matches');
  };

  return <button onClick={handleClick}>View Matches</button>;
}
```

### Link Component

```tsx
import { Link } from 'react-router-dom';

<Link to="/dashboard" className="text-blue-600 hover:underline">
  Go to Dashboard
</Link>
```

### NavLink (Active Link Styling)

```tsx
import { NavLink } from 'react-router-dom';

<NavLink
  to="/matches"
  className={({ isActive }) =>
    isActive
      ? "bg-yellow-400 text-gray-900 font-medium"
      : "text-gray-700 hover:bg-gray-100"
  }
>
  Match Results
</NavLink>
```

---

## Query Parameters

```tsx
import { useSearchParams } from 'react-router-dom';

function MatchResults() {
  const [searchParams, setSearchParams] = useSearchParams();

  const department = searchParams.get('department'); // ?department=Technology
  const minScore = searchParams.get('min_score'); // ?min_score=0.7

  const updateFilters = (newDept: string) => {
    setSearchParams({ department: newDept, min_score: '0.6' });
  };

  return <div>Filtered by: {department}</div>;
}
```

---

## Related Documentation

- `reference-docs/frontend/component-library.md` - Layout components
- `reference-docs/frontend/state-management.md` - Auth context

**Implemented In:** Block H (Auth & Layout)
