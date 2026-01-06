# BLOCK P: Visualization Integration - TASKS

**Block:** BLOCK-P-VIZ-INTEGRATION
**Total Tasks:** 7
**Completed:** 0/7 (0%)

---

## Progress Tracker

### Phase 1: Career Visualization Integration (Tasks 1-3)

- [ ] **Task 1:** Connect CareerVisualization component to `/api/patterns/graph` endpoint
  - [ ] Import `api` client from Block M in `CareerVisualization.jsx`
  - [ ] Replace mock graph data with `useEffect` hook that fetches real data
  - [ ] Add state variables: `graphData`, `loading`, `error`
  - [ ] Build query params from props (employeeId, department, minSuccessRate)
  - [ ] Call `api.get('/api/patterns/graph?...')` with params
  - [ ] Transform API response using `transformToReactFlow()` utility
  - [ ] Set graphData state with transformed nodes and edges
  - [ ] Add error handling with try/catch
  - [ ] Test with real backend API running
  - [ ] Verify graph displays correct roles and transitions from database

- [ ] **Task 2:** Add loading states and error handling to career graph
  - [ ] Create `GraphLoadingSkeleton.jsx` component
  - [ ] Display loading skeleton while `loading === true`
  - [ ] Create `GraphError.jsx` component with retry button
  - [ ] Display error component when API call fails
  - [ ] Add retry functionality (re-fetch on button click)
  - [ ] Create `EmptyGraphState.jsx` component
  - [ ] Display empty state when API returns 0 roles
  - [ ] Test loading state (add artificial delay)
  - [ ] Test error state (disconnect backend)
  - [ ] Test empty state (empty database or filters that match nothing)

- [ ] **Task 3:** Connect NodeDetailsPanel to `/api/patterns/role/{role_name}` endpoint
  - [ ] Import `api` client in `NodeDetailsPanel.jsx`
  - [ ] Add `useEffect` that triggers when `selectedRole` changes
  - [ ] Fetch role details: `api.get(\`/api/patterns/role/${selectedRole}\`)`
  - [ ] Add loading state for details panel
  - [ ] Display role info: department, employee count, avg years in role
  - [ ] Display outgoing transitions with success rates
  - [ ] Show common skills and recommended skills for each transition
  - [ ] Add error handling for failed API calls
  - [ ] Test clicking different nodes shows different details
  - [ ] Verify data matches backend response

### Phase 2: Success Pattern UI Integration (Tasks 4-5)

- [ ] **Task 4:** Connect SuccessPatternDashboard to `/api/patterns/employee/{employee_id}/recommendations` endpoint
  - [ ] Create or update `SuccessPatternDashboard.jsx`
  - [ ] Import `api` client and `useAuth` hook from Block M
  - [ ] Get current user: `const { user } = useAuth()`
  - [ ] Fetch recommendations: `api.get(\`/api/patterns/employee/${user.id}/recommendations\`)`
  - [ ] Add state: `recommendations`, `loading`, `error`
  - [ ] Create `DashboardLoadingSkeleton.jsx` for loading state
  - [ ] Display current role card with years in role
  - [ ] Display recommended paths chart (Recharts bar chart)
  - [ ] Show skill gap visualization
  - [ ] Add error handling and empty state
  - [ ] Test with different user IDs
  - [ ] Verify recommendations are personalized

- [ ] **Task 5:** Connect TransitionDetailsChart to `/api/patterns/transition/{source}/{target}` endpoint
  - [ ] Create or update `TransitionDetailsChart.jsx`
  - [ ] Import `api` client
  - [ ] Fetch transition details when source and target roles provided
  - [ ] Call: `api.get(\`/api/patterns/transition/${sourceRole}/${targetRole}\`)`
  - [ ] Add loading state specific to this chart
  - [ ] Display success rate and avg time metrics
  - [ ] Render time distribution bar chart using Recharts
  - [ ] Display skill breakdown table with percentages
  - [ ] Add hover tooltips showing additional details
  - [ ] Test with various role combinations
  - [ ] Verify chart data matches API response

### Phase 3: Real-Time Updates & Optimization (Tasks 6-7)

- [ ] **Task 6:** Implement real-time data updates and filtering
  - [ ] Create `FilterBar.jsx` component with department and success rate filters
  - [ ] Add filter state to `CareerPathPage.jsx`
  - [ ] Pass filters as props to CareerVisualization
  - [ ] Re-fetch graph data when filters change (useEffect dependency)
  - [ ] Add debouncing to prevent excessive API calls (300ms delay)
  - [ ] Show loading indicator during filter updates
  - [ ] Create `patternCache.js` utility for caching API responses
  - [ ] Cache graph data for 5 minutes
  - [ ] Check cache before making API call
  - [ ] Add cache key based on filter params
  - [ ] Add "Refresh" button to clear cache and force re-fetch
  - [ ] Test filter changes update graph correctly
  - [ ] Verify cache reduces API calls

- [ ] **Task 7:** Integration testing and verification
  - [ ] Write integration test: CareerVisualization loads real data
  - [ ] Write test: Graph shows loading state then data
  - [ ] Write test: Error handling displays error message
  - [ ] Write test: Empty state shows when no data
  - [ ] Write test: NodeDetailsPanel fetches and displays details
  - [ ] Write test: SuccessPatternDashboard shows personalized recommendations
  - [ ] Write test: TransitionDetailsChart renders with API data
  - [ ] Test authentication: 401 response redirects to login
  - [ ] Test with real backend API (Block F must be complete)
  - [ ] Verify all API endpoints return expected data
  - [ ] Check Network tab: verify correct API calls with auth headers
  - [ ] Test edge cases: no employee data, no transitions, API timeout
  - [ ] Run all tests, ensure passing
  - [ ] Verify no console errors or warnings
  - [ ] Test on different screen sizes (responsive design)

---

## Update Instructions

**When you complete a task:**
1. Check the box: `- [x] Task name`
2. Update the "Completed" count at the top
3. Update `PROJECT-STATUS.md`:
   - Find "Block P" row in Step 3 table
   - Update Progress column (e.g., "3/7 tasks")

**When ALL tasks complete:**
1. Change status in `PROJECT-STATUS.md` from ⏸️ to ✅
2. Update Progress to "7/7 tasks (100%)"
3. Update "Overall Progress" section
4. Commit: `git add . && git commit -m "Complete BLOCK-P: Visualization integration - Graphs and charts display real pattern data"`
5. Notify team: "Block P complete - Visualizations now show real data from pattern service!"

---

## Acceptance Criteria

All tasks must be complete AND:
- [ ] Career graph loads data from `/api/patterns/graph`
- [ ] Graph displays correct roles and transitions from database
- [ ] Employee's current role is highlighted based on API data
- [ ] Clicking node shows real role details from API
- [ ] Success pattern dashboard loads personalized recommendations
- [ ] Charts display real metrics (success rates, timelines, skills)
- [ ] All loading states work (skeletons display while fetching)
- [ ] Error states show clear messages when API fails
- [ ] Empty states handle no data gracefully
- [ ] Authentication works (uses JWT from Block M)
- [ ] 401 responses redirect to login
- [ ] Filters update visualizations in real-time
- [ ] Cache prevents redundant API calls
- [ ] All integration tests pass
- [ ] No console errors

---

## Dependencies

**This block depends on:**
- ✅ Block M (Core Integration) - API client and authentication
- ✅ Block F (Success Patterns) - Backend pattern service and API endpoints
- ✅ Block K (Career Viz) - Frontend graph component structure
- ✅ Block L (Success Pattern UI) - Frontend chart components (if exists)

**This block enables:**
- Block Q (E2E Testing & Polish) - Full system testing with real data

**Critical files:**
- `frontend/src/components/career-viz/CareerVisualization.jsx` - Main graph component
- `frontend/src/components/career-viz/NodeDetailsPanel.jsx` - Details panel
- `frontend/src/components/career-viz/graphTransformUtils.js` - API data transformation
- `frontend/src/components/success-patterns/SuccessPatternDashboard.jsx` - Dashboard
- `frontend/src/components/success-patterns/TransitionDetailsChart.jsx` - Transition chart
- `frontend/src/lib/api.ts` - API client (from Block M)
- `frontend/src/lib/patternCache.js` - Caching utility (new)
- `frontend/src/services/patternService.js` - Pattern API service (new)

**Backend API endpoints (from Block F):**
- `GET /api/patterns/graph` - Full career graph
- `GET /api/patterns/role/{role_name}` - Role details
- `GET /api/patterns/transition/{source}/{target}` - Transition details
- `GET /api/patterns/employee/{employee_id}/recommendations` - Personalized suggestions

---

## Troubleshooting

### Issue: "Graph shows no data" but API returns data

**Symptom:** Loading completes but graph is empty

**Solution:**
- Check browser console for transformation errors
- Verify `transformToReactFlow()` returns correct format
- Check React Flow expects `{ nodes: [], edges: [] }` structure
- Log API response to verify data structure matches expectations
- Ensure node IDs are unique strings
- Verify edge source/target IDs match node IDs

### Issue: "API call returns 401 Unauthorized"

**Symptom:** All visualization API calls fail with 401

**Solution:**
- Verify Block M (Core Integration) is complete
- Check token exists: `localStorage.getItem('token')`
- Verify API client adds Authorization header
- Check backend requires auth on `/api/patterns/*` endpoints
- Test with curl: `curl -H "Authorization: Bearer <token>" http://localhost:8000/api/patterns/graph`
- Re-login if token expired

### Issue: "Graph layout looks wrong"

**Symptom:** Nodes overlap or are positioned incorrectly

**Solution:**
- Verify Dagre layout algorithm is installed: `npm list dagre`
- Check `layoutGraph()` function is called on nodes before render
- Ensure node dimensions (width, height) are correct in layout config
- Try different layout directions: `rankdir: 'TB'` (top-to-bottom) or `'LR'` (left-to-right)
- Adjust `ranksep` and `nodesep` values for spacing

### Issue: "Charts not rendering"

**Symptom:** Chart components show but no data visualized

**Solution:**
- Verify Recharts is installed: `npm list recharts`
- Check data format matches Recharts requirements (array of objects)
- Log chart data to console to verify structure
- Ensure chart dimensions are set (width, height)
- Check for CSS conflicts hiding chart elements
- Verify data values are numbers, not strings

### Issue: "Filters don't update graph"

**Symptom:** Changing filters doesn't re-fetch data

**Solution:**
- Check `useEffect` dependency array includes filter values
- Verify filter state is updating (add console.log)
- Ensure filter params are passed to API call
- Check query string is built correctly
- Test API endpoint manually with filter params
- Clear cache if caching is implemented

---

## Example API Integration Code

### Complete CareerVisualization Integration

```javascript
// frontend/src/components/career-viz/CareerVisualization.jsx
import { useState, useEffect } from 'react';
import ReactFlow from 'reactflow';
import { api } from '@/lib/api';
import { transformToReactFlow } from './graphTransformUtils';
import { layoutGraph } from './graphLayoutUtils';
import { GraphLoadingSkeleton } from './GraphLoadingSkeleton';
import { GraphError } from './GraphError';
import { EmptyGraphState } from './EmptyGraphState';
import { RoleNode } from './RoleNode';
import { TransitionEdge } from './TransitionEdge';

const nodeTypes = {
  roleNode: RoleNode
};

const edgeTypes = {
  transitionEdge: TransitionEdge
};

export function CareerVisualization({ employeeId, department, minSuccessRate }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
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
        const { nodes: transformedNodes, edges: transformedEdges } = transformToReactFlow(data);

        setNodes(transformedNodes);
        setEdges(transformedEdges);
      } catch (err) {
        console.error('Failed to fetch graph data:', err);
        setError(err.message || 'Failed to load career graph');
      } finally {
        setLoading(false);
      }
    }

    fetchGraphData();
  }, [employeeId, department, minSuccessRate]);

  if (loading) {
    return <GraphLoadingSkeleton />;
  }

  if (error) {
    return <GraphError error={error} onRetry={() => window.location.reload()} />;
  }

  if (nodes.length === 0) {
    return <EmptyGraphState />;
  }

  return (
    <div className="w-full h-[600px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      />
    </div>
  );
}
```

### Data Transformation Utility

```javascript
// frontend/src/components/career-viz/graphTransformUtils.js
import { layoutGraph } from './graphLayoutUtils';

export function transformToReactFlow(apiData) {
  // Validate API data
  if (!apiData || !apiData.roles || !apiData.transitions) {
    console.error('Invalid API data:', apiData);
    return { nodes: [], edges: [] };
  }

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
      isPossibleNext: false  // Will be calculated
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
      commonSkills: t.commonSkills || []
    }
  }));

  // Mark possible next roles
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

**Last Updated:** 2026-01-06
**Status:** Not Started
