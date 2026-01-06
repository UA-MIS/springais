# SpringAIS State Management

**Last Updated:** 2026-01-06
**Framework:** React 18 + TypeScript
**Tools:** React Query (TanStack Query) + Context API

---

## Overview

SpringAIS uses two state management strategies:

1. **Server State** - React Query (TanStack Query) for API data
2. **Client State** - Context API for global UI state (auth, theme, etc.)

**Why not Redux/Zustand?**
- React Query handles 90% of state (server data)
- Context API is sufficient for remaining global state
- Simpler stack, less boilerplate

---

## Server State with React Query

### Setup

```tsx
// frontend/src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

root.render(
  <QueryClientProvider client={queryClient}>
    <App />
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
);
```

### Fetching Data

```tsx
// frontend/src/hooks/useMatches.ts
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

interface UseMatchesParams {
  employeeId: number;
  minScore?: number;
  department?: string;
}

export function useMatches({ employeeId, minScore, department }: UseMatchesParams) {
  return useQuery({
    queryKey: ['matches', employeeId, minScore, department],
    queryFn: async () => {
      const { data } = await api.get(`/matches/employee/${employeeId}`, {
        params: { min_score: minScore, department }
      });
      return data;
    },
    enabled: !!employeeId, // Only run if employeeId exists
  });
}

// Usage in component:
function MatchResults() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useMatches({
    employeeId: user.id,
    minScore: 0.6
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load matches" onRetry={refetch} />;

  return (
    <div>
      {data.matches.map(match => (
        <MatchCard key={match.job_id} {...match} />
      ))}
    </div>
  );
}
```

### Mutations (POST/PUT/DELETE)

```tsx
// frontend/src/hooks/useUploadResume.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export function useUploadResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/skill-extraction', formData);
      return data;
    },
    onSuccess: (data, variables, context) => {
      // Invalidate employee skills cache
      queryClient.invalidateQueries({ queryKey: ['employee', 'skills'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
    onError: (error) => {
      console.error('Upload failed:', error);
    },
  });
}

// Usage:
function ResumeUploadPage() {
  const { mutate, isLoading, error } = useUploadResume();

  const handleUpload = (file: File) => {
    mutate(file, {
      onSuccess: () => {
        toast.success('Skills extracted successfully!');
      },
    });
  };

  return <ResumeUpload onUpload={handleUpload} />;
}
```

### Prefetching

```tsx
// Prefetch matches when user hovers over "Matches" link
import { useQueryClient } from '@tanstack/react-query';

function Sidebar() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const prefetchMatches = () => {
    queryClient.prefetchQuery({
      queryKey: ['matches', user.id],
      queryFn: async () => {
        const { data } = await api.get(`/matches/employee/${user.id}`);
        return data;
      },
    });
  };

  return (
    <Link
      to="/matches"
      onMouseEnter={prefetchMatches}  // Prefetch on hover
    >
      Match Results
    </Link>
  );
}
```

**Implemented In:** Block N, O, P (Integration blocks)

---

## Client State with Context API

### Auth Context

```tsx
// frontend/src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if token is valid on mount
    if (token) {
      fetchCurrentUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async (token: string) => {
    try {
      const { data } = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(data);
    } catch (error) {
      // Token invalid, clear it
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    navigate('/dashboard');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

**Implemented In:** Block H (Auth & Layout), Block M (Core Integration)

---

## Custom Hooks Patterns

### Combining React Query with Context

```tsx
// frontend/src/hooks/useEmployeeSkills.ts
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

export function useEmployeeSkills() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['employee', user?.id, 'skills'],
    queryFn: async () => {
      const { data } = await api.get(`/employees/${user?.id}`);
      return data.skills;
    },
    enabled: !!user, // Only fetch if logged in
  });
}
```

### Dependent Queries

```tsx
// Fetch employee first, then fetch their matches
function useEmployeeWithMatches(employeeId: number) {
  const employeeQuery = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => fetchEmployee(employeeId),
  });

  const matchesQuery = useQuery({
    queryKey: ['matches', employeeId],
    queryFn: () => fetchMatches(employeeId),
    enabled: !!employeeQuery.data, // Only run after employee loaded
  });

  return {
    employee: employeeQuery.data,
    matches: matchesQuery.data,
    isLoading: employeeQuery.isLoading || matchesQuery.isLoading,
  };
}
```

---

## Cache Invalidation Strategies

### Manual Invalidation

```tsx
import { useQueryClient } from '@tanstack/react-query';

function SkillsPage() {
  const queryClient = useQueryClient();

  const handleSkillUpdate = async () => {
    await updateSkill();

    // Invalidate related caches
    queryClient.invalidateQueries({ queryKey: ['employee', 'skills'] });
    queryClient.invalidateQueries({ queryKey: ['matches'] }); // Matches depend on skills
  };
}
```

### Automatic Invalidation (Mutation Callbacks)

```tsx
const mutation = useMutation({
  mutationFn: updateSkill,
  onSuccess: () => {
    // Invalidate all queries with 'employee' key
    queryClient.invalidateQueries({ queryKey: ['employee'] });
  },
});
```

### Time-Based Invalidation

```tsx
// Refetch every 5 minutes if page is visible
useQuery({
  queryKey: ['matches'],
  queryFn: fetchMatches,
  refetchInterval: 1000 * 60 * 5, // 5 minutes
  refetchIntervalInBackground: false, // Stop when tab not visible
});
```

---

## Optimistic Updates

```tsx
// Update UI immediately, rollback if fails
const { mutate } = useMutation({
  mutationFn: saveMatch,
  onMutate: async (newMatch) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['saved-matches'] });

    // Snapshot previous value
    const previous = queryClient.getQueryData(['saved-matches']);

    // Optimistically update cache
    queryClient.setQueryData(['saved-matches'], (old) => [...old, newMatch]);

    return { previous }; // Return context
  },
  onError: (err, newMatch, context) => {
    // Rollback on error
    queryClient.setQueryData(['saved-matches'], context.previous);
  },
  onSettled: () => {
    // Refetch after mutation (success or error)
    queryClient.invalidateQueries({ queryKey: ['saved-matches'] });
  },
});
```

---

## Loading States Best Practices

### Skeleton Loading

```tsx
function MatchResults() {
  const { data, isLoading } = useMatches();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return <MatchList matches={data.matches} />;
}
```

### Suspense (Future)

```tsx
import { Suspense } from 'react';

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <MatchResults />
    </Suspense>
  );
}
```

---

## Related Documentation

- `reference-docs/frontend/component-library.md` - Components
- `reference-docs/frontend/routing-structure.md` - Routes
- `reference-docs/backend/api-reference.md` - API endpoints

**Implemented In:** All integration blocks (M, N, O, P)

---

**Document Purpose:** State management patterns with React Query + Context
**Audience:** Frontend developers
**Last Updated:** 2026-01-06
