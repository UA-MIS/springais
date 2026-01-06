# BLOCK P: Visualization Integration - CONTEXT

**Block ID:** BLOCK-P-VIZ-INTEGRATION
**Phase:** STEP-3-INTEGRATION
**Category:** #integration #frontend #visualization
**Estimated Time:** 1-2 days
**Dependencies:** STEP-2: Block F (Success Patterns), Block K (Career Viz), Block L (Success Pattern UI); STEP-3: Block M (Core Integration)

---

## AI Quick Start Prompt

```
You are working on BLOCK-P: Visualization Integration for SpringAIS.

Goal: Connect career visualization (Block K) and success pattern UI (Block L) to backend pattern analysis service (Block F).

Key constraints:
- MUST complete Block M (Core Integration) first - requires authenticated API calls
- Replace all mock data with real API calls to /api/patterns/* endpoints
- Implement loading states and error handling for async data
- Use API client from Block M for authenticated requests
- Ensure visualizations update in real-time when data changes

Read TASKS.md for implementation steps.
Read VERIFICATION.md for integration testing.
```

---

## Purpose

Connect the visualization components (career path graph and success pattern charts) to the backend pattern analysis service, transforming static mock visualizations into dynamic, data-driven components that display real employee success patterns.

**Why this matters:**
- Blocks K and L currently display mock data (static graphs and charts)
- Block F provides real pattern analysis via API endpoints
- This integration makes visualizations reflect actual employee career data
- Enables personalized career path recommendations based on real patterns

**Success outcome:**
- Career graph (React Flow) displays real role transitions from database
- Success pattern charts show real metrics (success rates, timelines, skills)
- Visualizations load smoothly with loading states
- Error handling gracefully manages API failures
- Data updates in real-time when user filters change

---

## What This Block Integrates

### From Block K: Career Visualization (React Flow)

**What's already built:**
- React Flow career graph component with custom nodes/edges
- Interactive controls (zoom, pan, search)
- Node details panel for clicked roles
- Graph layout algorithm (Dagre)
- **Current state:** Uses mock graph data (5 roles, 4 transitions)

**What this block does:**
- Replace mock data with API call to `/api/patterns/graph`
- Connect to `/api/patterns/role/{role_name}` for node details
- Add loading skeleton while graph data fetches
- Handle empty state (no pattern data available)
- Update graph when user's role changes

### From Block L: Success Pattern UI (Charts)

**What's already built (assumed):**
- Success rate charts (bar/pie charts using Recharts)
- Transition timeline charts
- Skill correlation charts
- Success metrics dashboard
- **Current state:** Uses mock metrics data

**What this block does:**
- Connect to `/api/patterns/employee/{employee_id}/recommendations`
- Connect to `/api/patterns/transition/{source_role}/{target_role}`
- Fetch skill correlation data for charts
- Add loading states for each chart
- Handle missing data gracefully

### From Block F: Success Pattern Analysis Service

**What's already built:**
- SQL-based pattern analysis engine
- Career path discovery algorithms
- Transition metrics calculations
- Skill correlation analysis
- **API endpoints:**
  - `GET /api/patterns/graph` - Full career graph data
  - `GET /api/patterns/role/{role_name}` - Paths from specific role
  - `GET /api/patterns/transition/{source}/{target}` - Transition details
  - `GET /api/patterns/employee/{employee_id}/recommendations` - Personalized suggestions

**What this block does:**
- Use these endpoints from frontend components
- Transform API responses to visualization formats
- Cache results to minimize API calls
- Handle authentication via Block M's API client

---

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend Visualization Components                          │
│                                                              │
│  ┌──────────────────────────┐  ┌──────────────────────────┐│
│  │  CareerVisualization.jsx │  │  SuccessPatternUI.jsx   ││
│  │  (Block K)               │  │  (Block L)              ││
│  │                          │  │                          ││
│  │  - React Flow Graph      │  │  - Success Rate Charts  ││
│  │  - Custom Nodes/Edges    │  │  - Timeline Charts      ││
│  │  - Node Details Panel    │  │  - Skill Charts         ││
│  └──────────┬───────────────┘  └──────────┬───────────────┘│
│             │                              │                 │
│             └──────────┬───────────────────┘                 │
│                        │                                     │
│                        v                                     │
│             ┌──────────────────────┐                        │
│             │  API Client          │                        │
│             │  (from Block M)      │                        │
│             │  - Auth headers      │                        │
│             │  - Error handling    │                        │
│             └──────────┬───────────┘                        │
└────────────────────────┼────────────────────────────────────┘
                         │
                         │ HTTP + JWT
                         v
┌─────────────────────────────────────────────────────────────┐
│  Backend Pattern Service (Block F)                          │
│                                                              │
│  GET /api/patterns/graph                                    │
│  GET /api/patterns/role/{role_name}                         │
│  GET /api/patterns/transition/{source}/{target}             │
│  GET /api/patterns/employee/{employee_id}/recommendations   │
│                                                              │
│  ┌──────────────────────────┐                              │
│  │  Pattern Analysis Engine │                              │
│  │  - SQL queries           │                              │
│  │  - Skill correlation     │                              │
│  │  - Success rate calc     │                              │
│  └──────────┬───────────────┘                              │
│             │                                               │
│             v                                               │
│  ┌──────────────────────────┐                              │
│  │  PostgreSQL Database     │                              │
│  │  - employees table       │                              │
│  │  - previous_roles (JSONB)│                              │
│  │  - skills (JSONB)        │                              │
│  └──────────────────────────┘                              │
└─────────────────────────────────────────────────────────────┘
```

---

## API Integration Details

### 1. Career Graph Data Integration

**Endpoint:** `GET /api/patterns/graph`

**Query Parameters:**
- `employee_id` (optional) - Highlights employee's current role
- `department` (optional) - Filter graph by department
- `min_success_rate` (optional) - Only show transitions above threshold

**Response Format:**
```json
{
  "roles": [
    {
      "id": "analyst",
      "label": "Analyst",
      "department": "Advisory",
      "employeeCount": 120,
      "avgYearsInRole": 2.3
    },
    {
      "id": "senior-analyst",
      "label": "Senior Analyst",
      "department": "Advisory",
      "employeeCount": 87,
      "avgYearsInRole": 3.1
    }
  ],
  "transitions": [
    {
      "source": "analyst",
      "target": "senior-analyst",
      "successRate": 0.72,
      "avgTimeYears": 2.3,
      "sampleSize": 64,
      "commonSkills": ["Excel", "Client Management", "Problem Solving"]
    }
  ],
  "employeeCurrentRole": "analyst"
}
```

**Frontend Integration:**
```javascript
// components/career-viz/CareerVisualization.jsx
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';  // From Block M
import { transformToReactFlow } from './graphTransformUtils';

export function CareerVisualization({ employeeId, department, minSuccessRate }) {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchGraphData() {
      try {
        setLoading(true);
        setError(null);

        // Build query params
        const params = new URLSearchParams();
        if (employeeId) params.append('employee_id', employeeId);
        if (department) params.append('department', department);
        if (minSuccessRate) params.append('min_success_rate', minSuccessRate);

        // Fetch from API
        const data = await api.get(`/api/patterns/graph?${params}`);

        // Transform to React Flow format
        const { nodes, edges } = transformToReactFlow(data);

        setGraphData({ nodes, edges });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchGraphData();
  }, [employeeId, department, minSuccessRate]);

  if (loading) return <GraphLoadingSkeleton />;
  if (error) return <GraphError error={error} />;
  if (!graphData || graphData.nodes.length === 0) {
    return <EmptyGraphState />;
  }

  return <ReactFlowGraph nodes={graphData.nodes} edges={graphData.edges} />;
}
```

**Data Transformation Utility:**
```javascript
// components/career-viz/graphTransformUtils.js
import { layoutGraph } from './graphLayoutUtils';

export function transformToReactFlow(apiData) {
  // Transform roles to React Flow nodes
  const nodes = apiData.roles.map(role => ({
    id: role.id,
    type: 'roleNode',
    position: { x: 0, y: 0 },  // Will be set by layout algorithm
    data: {
      label: role.label,
      department: role.department,
      employeeCount: role.employeeCount,
      avgYearsInRole: role.avgYearsInRole,
      isCurrentRole: role.id === apiData.employeeCurrentRole,
      isPossibleNext: false  // Will be calculated based on outgoing edges
    }
  }));

  // Transform transitions to React Flow edges
  const edges = apiData.transitions.map(t => ({
    id: `${t.source}-${t.target}`,
    source: t.source,
    target: t.target,
    type: 'transitionEdge',
    animated: false,
    data: {
      successRate: t.successRate,
      avgTimeYears: t.avgTimeYears,
      sampleSize: t.sampleSize,
      commonSkills: t.commonSkills
    }
  }));

  // Mark possible next roles (targets of current role's outgoing edges)
  if (apiData.employeeCurrentRole) {
    const possibleNextRoleIds = edges
      .filter(e => e.source === apiData.employeeCurrentRole)
      .map(e => e.target);

    nodes.forEach(node => {
      if (possibleNextRoleIds.includes(node.id)) {
        node.data.isPossibleNext = true;
      }
    });
  }

  // Apply layout algorithm
  const layoutedNodes = layoutGraph(nodes, edges);

  return { nodes: layoutedNodes, edges };
}
```

---

### 2. Node Details Integration

**Endpoint:** `GET /api/patterns/role/{role_name}`

**Response Format:**
```json
{
  "role": {
    "name": "Analyst",
    "department": "Advisory",
    "employeeCount": 120,
    "avgYearsInRole": 2.3,
    "avgYearsToPromotion": 2.8
  },
  "outgoingTransitions": [
    {
      "targetRole": "Senior Analyst",
      "successRate": 0.72,
      "avgTimeYears": 2.3,
      "sampleSize": 64,
      "commonSkills": ["Excel", "Client Management"],
      "recommendedSkills": ["Leadership", "Project Management"]
    },
    {
      "targetRole": "Business Analyst",
      "successRate": 0.42,
      "avgTimeYears": 2.8,
      "sampleSize": 18,
      "commonSkills": ["SQL", "Business Process"],
      "recommendedSkills": ["Data Modeling", "Stakeholder Management"]
    }
  ]
}
```

**Frontend Integration:**
```javascript
// components/career-viz/NodeDetailsPanel.jsx
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export function NodeDetailsPanel({ selectedRole, onClose }) {
  const [roleDetails, setRoleDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRoleDetails() {
      try {
        setLoading(true);
        const data = await api.get(`/api/patterns/role/${selectedRole}`);
        setRoleDetails(data);
      } catch (err) {
        console.error('Failed to fetch role details:', err);
      } finally {
        setLoading(false);
      }
    }

    if (selectedRole) {
      fetchRoleDetails();
    }
  }, [selectedRole]);

  if (!selectedRole) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-lg p-6">
      {loading ? (
        <DetailsLoadingSkeleton />
      ) : (
        <>
          <h2 className="text-xl font-bold mb-4">{roleDetails.role.name}</h2>
          <div className="mb-6">
            <p className="text-sm text-gray-600">Department: {roleDetails.role.department}</p>
            <p className="text-sm text-gray-600">{roleDetails.role.employeeCount} employees</p>
            <p className="text-sm text-gray-600">Avg time in role: {roleDetails.role.avgYearsInRole} years</p>
          </div>

          <h3 className="font-semibold mb-3">Career Paths from this Role</h3>
          {roleDetails.outgoingTransitions.map((transition, idx) => (
            <TransitionCard key={idx} transition={transition} />
          ))}
        </>
      )}
      <button onClick={onClose} className="mt-4">Close</button>
    </div>
  );
}
```

---

### 3. Success Pattern Charts Integration

**Endpoint:** `GET /api/patterns/employee/{employee_id}/recommendations`

**Response Format:**
```json
{
  "currentRole": "Analyst",
  "yearsInRole": 1.5,
  "recommendations": [
    {
      "targetRole": "Senior Analyst",
      "successRate": 0.72,
      "matchScore": 0.85,
      "avgTimeYears": 2.3,
      "yourSkillsMatch": ["Excel", "SQL"],
      "skillsToAcquire": ["Leadership", "Client Management"],
      "estimatedTimeToReady": 0.8
    }
  ],
  "skillGaps": {
    "Leadership": { "importance": 0.9, "yourLevel": 0.3 },
    "Client Management": { "importance": 0.85, "yourLevel": 0.5 }
  }
}
```

**Frontend Integration:**
```javascript
// components/success-patterns/SuccessPatternDashboard.jsx
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';  // From Block M

export function SuccessPatternDashboard() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        setLoading(true);
        const data = await api.get(`/api/patterns/employee/${user.id}/recommendations`);
        setRecommendations(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (user?.id) {
      fetchRecommendations();
    }
  }, [user]);

  if (loading) return <DashboardLoadingSkeleton />;
  if (error) return <ErrorState error={error} />;
  if (!recommendations) return <EmptyState />;

  return (
    <div className="space-y-6">
      <CurrentRoleCard role={recommendations.currentRole} years={recommendations.yearsInRole} />
      <RecommendedPathsChart data={recommendations.recommendations} />
      <SkillGapChart gaps={recommendations.skillGaps} />
    </div>
  );
}
```

---

### 4. Transition Details Chart

**Endpoint:** `GET /api/patterns/transition/{source_role}/{target_role}`

**Response Format:**
```json
{
  "transition": {
    "sourceRole": "Analyst",
    "targetRole": "Senior Analyst",
    "successRate": 0.72,
    "avgTimeYears": 2.3,
    "medianTimeYears": 2.1,
    "sampleSize": 64
  },
  "skillBreakdown": {
    "Excel": { "percentage": 0.95, "importance": 0.8 },
    "Client Management": { "percentage": 0.73, "importance": 0.9 },
    "Leadership": { "percentage": 0.81, "importance": 0.85 }
  },
  "timeDistribution": {
    "1-2 years": 12,
    "2-3 years": 35,
    "3-4 years": 14,
    "4+ years": 3
  }
}
```

**Frontend Integration:**
```javascript
// components/success-patterns/TransitionDetailsChart.jsx
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export function TransitionDetailsChart({ sourceRole, targetRole }) {
  const [transitionData, setTransitionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransitionDetails() {
      try {
        setLoading(true);
        const data = await api.get(
          `/api/patterns/transition/${sourceRole}/${targetRole}`
        );
        setTransitionData(data);
      } catch (err) {
        console.error('Failed to fetch transition details:', err);
      } finally {
        setLoading(false);
      }
    }

    if (sourceRole && targetRole) {
      fetchTransitionDetails();
    }
  }, [sourceRole, targetRole]);

  if (loading) return <ChartLoadingSkeleton />;
  if (!transitionData) return null;

  // Transform time distribution for chart
  const timeData = Object.entries(transitionData.timeDistribution).map(([range, count]) => ({
    range,
    count
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">
        {sourceRole} → {targetRole}
      </h3>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <MetricCard
          label="Success Rate"
          value={`${(transitionData.transition.successRate * 100).toFixed(0)}%`}
        />
        <MetricCard
          label="Avg Time"
          value={`${transitionData.transition.avgTimeYears} years`}
        />
      </div>

      <h4 className="font-semibold mb-2">Time to Transition Distribution</h4>
      <BarChart width={400} height={200} data={timeData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="range" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#2563eb" />
      </BarChart>

      <h4 className="font-semibold mt-6 mb-2">Key Skills</h4>
      <SkillBreakdownTable skills={transitionData.skillBreakdown} />
    </div>
  );
}
```

---

## Loading States & Error Handling

### Loading Skeletons

**Graph Loading Skeleton:**
```javascript
// components/career-viz/GraphLoadingSkeleton.jsx
export function GraphLoadingSkeleton() {
  return (
    <div className="w-full h-[600px] flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading career paths...</p>
      </div>
    </div>
  );
}
```

**Chart Loading Skeleton:**
```javascript
// components/success-patterns/ChartLoadingSkeleton.jsx
export function ChartLoadingSkeleton() {
  return (
    <div className="bg-white p-6 rounded-lg shadow animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="h-40 bg-gray-100 rounded mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  );
}
```

### Error States

**Graph Error Component:**
```javascript
// components/career-viz/GraphError.jsx
export function GraphError({ error, onRetry }) {
  return (
    <div className="w-full h-[600px] flex items-center justify-center bg-red-50">
      <div className="text-center max-w-md">
        <div className="text-red-600 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Career Graph</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
```

**Empty State Component:**
```javascript
// components/career-viz/EmptyGraphState.jsx
export function EmptyGraphState() {
  return (
    <div className="w-full h-[600px] flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Career Path Data Available</h3>
        <p className="text-gray-600">
          There isn't enough historical data to generate career paths yet.
          Check back later as more employee data becomes available.
        </p>
      </div>
    </div>
  );
}
```

---

## Real-Time Data Updates

### Refresh on Filter Change

```javascript
// components/career-viz/CareerPathPage.jsx
import { useState } from 'react';
import { CareerVisualization } from './CareerVisualization';

export function CareerPathPage() {
  const [filters, setFilters] = useState({
    department: null,
    minSuccessRate: 0.5
  });

  return (
    <div>
      <FilterBar filters={filters} onFilterChange={setFilters} />
      <CareerVisualization
        employeeId={user.id}
        department={filters.department}
        minSuccessRate={filters.minSuccessRate}
      />
    </div>
  );
}
```

### Cache Management

```javascript
// lib/patternCache.js
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class PatternCache {
  constructor() {
    this.cache = new Map();
  }

  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear() {
    this.cache.clear();
  }
}

export const patternCache = new PatternCache();
```

**Using Cache in API Calls:**
```javascript
// services/patternService.js
import { api } from '@/lib/api';
import { patternCache } from '@/lib/patternCache';

export async function fetchGraphData(params) {
  const cacheKey = `graph:${JSON.stringify(params)}`;

  // Check cache first
  const cached = patternCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch from API
  const queryString = new URLSearchParams(params).toString();
  const data = await api.get(`/api/patterns/graph?${queryString}`);

  // Cache result
  patternCache.set(cacheKey, data);

  return data;
}
```

---

## Environment Setup

No new environment variables needed - uses existing setup from Block M:
- `VITE_API_URL` - API base URL (already configured)
- Authentication uses existing JWT token from Block M

---

## Testing Strategy

### Integration Tests

**Test: Graph loads real data from API**
```javascript
// tests/integration/careerViz.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import { CareerVisualization } from '@/components/career-viz/CareerVisualization';
import { api } from '@/lib/api';

jest.mock('@/lib/api');

test('loads and displays real graph data', async () => {
  // Mock API response
  api.get.mockResolvedValue({
    roles: [
      { id: 'analyst', label: 'Analyst', department: 'Advisory', employeeCount: 120 }
    ],
    transitions: [
      { source: 'analyst', target: 'senior-analyst', successRate: 0.72 }
    ]
  });

  render(<CareerVisualization employeeId={1} />);

  // Should show loading first
  expect(screen.getByText(/Loading career paths/i)).toBeInTheDocument();

  // Then show graph after data loads
  await waitFor(() => {
    expect(screen.getByText('Analyst')).toBeInTheDocument();
  });

  // Verify API was called
  expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/api/patterns/graph'));
});
```

**Test: Handles API errors gracefully**
```javascript
test('shows error state when API fails', async () => {
  api.get.mockRejectedValue(new Error('Network error'));

  render(<CareerVisualization employeeId={1} />);

  await waitFor(() => {
    expect(screen.getByText(/Failed to Load Career Graph/i)).toBeInTheDocument();
    expect(screen.getByText(/Network error/i)).toBeInTheDocument();
  });
});
```

---

## What Blocks N, O Built On (Reference)

This block follows the same integration pattern as:
- **Block N (Skills Dashboard Integration):** Connected skills UI to extraction pipeline
- **Block O (Matching Integration):** Connected match results to matching engine

**Common pattern:**
1. Import `api` client from Block M
2. Replace mock data with `useEffect` + API call
3. Add loading/error states
4. Transform API response to component format
5. Handle authentication via JWT (automatic with `api` client)

---

## References

**Related Step 2 Blocks:**
- `BLOCK-F-SUCCESS-PATTERNS/CONTEXT.md` - Backend pattern service
- `BLOCK-K-CAREER-VIZ/CONTEXT.md` - Frontend graph component
- `BLOCK-L-SUCCESS-PATTERN-UI/CONTEXT.md` - Frontend charts (if exists)

**Related Step 3 Blocks:**
- `BLOCK-M-CORE-INTEGRATION/CONTEXT.md` - API client and auth setup

**Related Documentation:**
- `_bmad-output/tech-stack.md` - Architecture overview
- `_bmad-output/ux-unified-dashboard-v2-with-enhanced-roadmap.html` - UX design

**Technology Docs:**
- React Flow: https://reactflow.dev/
- Recharts: https://recharts.org/
- React Hooks: https://react.dev/reference/react

---

## Success Criteria

**This block is complete when:**

1. Career graph loads real pattern data from `/api/patterns/graph`
2. Graph displays correct number of roles and transitions from API
3. Employee's current role is highlighted based on API data
4. Clicking a node fetches and displays real role details
5. Success pattern charts load real metrics from API
6. All loading states display while fetching data
7. Error states show when API calls fail
8. Empty states show when no data available
9. Authentication works (401 redirects to login)
10. Data updates when filters change
11. All integration tests pass
12. No console errors in browser

**Integration Checklist:**
- [ ] CareerVisualization component calls `/api/patterns/graph`
- [ ] NodeDetailsPanel calls `/api/patterns/role/{role_name}`
- [ ] SuccessPatternDashboard calls `/api/patterns/employee/{employee_id}/recommendations`
- [ ] TransitionDetailsChart calls `/api/patterns/transition/{source}/{target}`
- [ ] Loading skeletons display during API calls
- [ ] Error messages are clear and helpful
- [ ] Empty states handle missing data gracefully
- [ ] Graph updates when filters change
- [ ] All visualizations use authenticated API client from Block M
- [ ] Cache prevents redundant API calls

---

## AI Auto-Update Instructions

When you complete a task in TASKS.md:

1. **Update the task checkbox:**
   ```markdown
   - [x] Task 1: Connect CareerVisualization to /api/patterns/graph
   ```

2. **Update PROJECT-STATUS.md:**
   ```markdown
   | **P** | Visualization Integration | 🔄 In Progress | [Your name] | 3/7 tasks | 1-2 days |
   ```

3. **When block complete:**
   - Change status to ✅ Completed in PROJECT-STATUS.md
   - Update "Overall Progress" section
   - Add note: "Block P complete - Visualizations now display real pattern data"

---

**Last Updated:** 2026-01-06
**Status:** Ready for development
**Blocking:** Block Q (E2E Testing)
**Blocked by:** Block M (Core Integration), Block F (Success Patterns), Block K (Career Viz), Block L (Success Pattern UI)
