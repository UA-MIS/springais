# BLOCK K: Career Visualization (React Flow) - TASKS

**Block:** BLOCK-K-CAREER-VIZ
**Total Tasks:** 14
**Completed:** 0/14 (0%)

---

## ⚠️ IMPORTANT: Update Instructions

**When you complete a task:**
1. Check the box: `- [x] Task name`
2. Update the "Completed" count at the top
3. Update `PROJECT-STATUS.md`:
   - Find "Block K" row in Step 2 table
   - Update Progress column (e.g., "3/14 tasks")

**When ALL tasks complete:**
1. ✅ Run all verification steps in `VERIFICATION.md`
2. ✅ Change status in `PROJECT-STATUS.md` from ⏸️ to ✅
3. ✅ Update Progress to "14/14 tasks (100%)"
4. ✅ Update "Overall Progress" section
5. ✅ After verification passes, commit changes (do NOT commit until verification is complete)

See `CONTEXT.md` section "Update Instructions (For AI)" for full details.

---

## Progress Tracker

### 1. Project Setup & Dependencies (2 tasks)
- [ ] **Task 1.1:** Install React Flow and layout libraries
  ```bash
  cd frontend
  npm install reactflow dagre
  # Note: Tailwind CSS already installed from STEP-1-SETUP
  ```

- [ ] **Task 1.2:** Set up mock data file
  - File: `frontend/src/data/mockCareerGraphData.js`
  - Create mock graph with 5+ roles and 4+ transitions
  - Include all required fields: roles (id, label, department, employeeCount), transitions (source, target, successRate, avgTimeYears, sampleSize, commonSkills)
  - Set `employeeCurrentRole` to one of the roles for highlighting

### 2. Graph Data Transformation (2 tasks)
- [ ] **Task 2.1:** Create pattern service for API integration
  - File: `frontend/src/services/patternService.js`
  - Method: `fetchCareerGraph()` → GET /api/patterns/graph
  - For now, return mock data (real API in Step 3 Block P)
  - Handle loading and error states

- [ ] **Task 2.2:** Create graph layout utility
  - File: `frontend/src/components/career-viz/graphLayoutUtils.js`
  - Function: `layoutGraph(nodes, edges)` → Returns positioned nodes
  - Use Dagre for hierarchical layout (top-to-bottom, rankdir: 'TB')
  - Configure spacing: ranksep: 80px, nodesep: 100px
  - Node dimensions: 180x80px

### 3. Custom Node Component (2 tasks)
- [ ] **Task 3.1:** Create RoleNode component
  - File: `frontend/src/components/career-viz/RoleNode.jsx`
  - Props: `data` (label, department, employeeCount, isCurrentRole, isPossibleNext)
  - Layout: Role name (bold), department badge, employee count
  - Styling:
    - Current role: Yellow border (`border-yellow-400`), subtle glow
    - Possible next role: Green border (`border-green-500`)
    - Default: Gray border (`border-gray-300`)
  - Responsive: 180px wide, auto height
  - Add React Flow Handle components (source & target)

- [ ] **Task 3.2:** Register custom node type
  - In CareerVisualization component
  - Define `nodeTypes = { roleNode: RoleNode }`
  - Pass to ReactFlow component

### 4. Custom Edge Component (2 tasks)
- [ ] **Task 4.1:** Create TransitionEdge component
  - File: `frontend/src/components/career-viz/TransitionEdge.jsx`
  - Props: `data` (successRate, avgTimeYears, sampleSize, commonSkills)
  - Display success rate as label (e.g., "68%")
  - Color coding:
    - Success rate >70%: Green (`stroke-green-500`)
    - Success rate 50-70%: Yellow (`stroke-yellow-500`)
    - Success rate <50%: Gray (`stroke-gray-400`)
  - Add arrow marker at target end
  - Edge label positioned at midpoint

- [ ] **Task 4.2:** Add edge hover tooltip
  - Show on hover: Avg time, sample size, common skills
  - Use Tailwind for tooltip styling
  - Position tooltip near cursor or edge label
  - Register custom edge type in CareerVisualization

### 5. Main Visualization Component (2 tasks)
- [ ] **Task 5.1:** Create CareerVisualization component
  - File: `frontend/src/components/career-viz/CareerVisualization.jsx`
  - State: `nodes`, `edges`, `selectedNode`
  - Load mock data on mount
  - Transform data to React Flow format
  - Apply layout algorithm to position nodes
  - Mark current role (`isCurrentRole: true`)
  - Render `<ReactFlow>` with custom nodes/edges

- [ ] **Task 5.2:** Add React Flow controls
  - Import: `Controls`, `MiniMap`, `Background` from reactflow
  - Add `<Controls />` (zoom in/out, fit view buttons)
  - Add `<Background />` (dot pattern for visual guidance)
  - Optional: Add `<MiniMap />` for large graphs (bonus)
  - Configure initial viewport: `defaultViewport={{ zoom: 1, x: 0, y: 0 }}`

### 6. Interactive Features (3 tasks)
- [ ] **Task 6.1:** Create NodeDetailsPanel component
  - File: `frontend/src/components/career-viz/NodeDetailsPanel.jsx`
  - Props: `node` (selected node data), `onClose`
  - Display: Role name, department, employee count, avg years in role
  - List outgoing transitions with success rates
  - Show required skills for each transition
  - Style: Slide-in panel from right (fixed position)
  - Close button with X icon

- [ ] **Task 6.2:** Implement node click handler
  - In CareerVisualization component
  - `onNodeClick={(event, node) => setSelectedNode(node)}`
  - Highlight clicked node and outgoing edges
  - Open NodeDetailsPanel with selected node data
  - Update edge styles to highlight outgoing paths

- [ ] **Task 6.3:** Create GraphControls component
  - File: `frontend/src/components/career-viz/GraphControls.jsx`
  - Search bar: Filter graph to specific role (by label)
  - Dropdown: Filter by department
  - Slider: Min success rate filter (show only edges >X%)
  - "Reset Filters" button
  - Style: Floating toolbar above graph (top-right corner)

### 7. Page Integration & Styling (3 tasks)
- [ ] **Task 7.1:** Create CareerPathPage component
  - File: `frontend/src/pages/CareerPathPage.jsx`
  - Wrapper for CareerVisualization
  - Page title: "Career Path Explorer"
  - Subtitle: "Explore common career transitions at EY"
  - Instructions: "Click a role to see possible next steps"
  - Render inside MainLayout (from Block H)

- [ ] **Task 7.2:** Add route to App.jsx
  - Route: `/career-path`
  - Component: `<CareerPathPage />`
  - Protected route (requires authentication)
  - Update sidebar navigation (if not already added in Block H)

- [ ] **Task 7.3:** Apply EY branding and polish
  - Ensure all components use EY color palette:
    - Yellow: `#ffe600` (current role)
    - Green: `#22c55e` (high success)
    - Yellow: `#f59e0b` (medium success)
    - Gray: `#9ca3af` (low success)
  - Background: `#f6f6fa` (EY off-white)
  - Typography: Inter font (from UX reference)
  - Add loading spinner while graph loads
  - Add empty state if no data available

---

## Acceptance Criteria

✅ **Block K is complete when:**
1. Career graph renders with 5+ role nodes and 4+ transition edges
2. Nodes positioned automatically using Dagre layout (hierarchical, top-to-bottom)
3. Custom RoleNode displays role name, department, and employee count
4. Current role highlighted with yellow border
5. Custom TransitionEdge shows success rate label
6. Edge color matches success rate (green/yellow/gray)
7. Clicking a node opens NodeDetailsPanel with transition details
8. Zoom/pan/fit controls work correctly
9. Search bar filters graph to specific role
10. Department filter shows only roles in selected department
11. Min success rate slider filters edges dynamically
12. Styling matches EY branding (colors, typography, layout)
13. Graph is responsive (works on desktop, mobile needs horizontal scroll)
14. No console errors or warnings

---

## Files to Create/Modify

**New Files:**
- `frontend/src/components/career-viz/CareerVisualization.jsx`
- `frontend/src/components/career-viz/RoleNode.jsx`
- `frontend/src/components/career-viz/TransitionEdge.jsx`
- `frontend/src/components/career-viz/NodeDetailsPanel.jsx`
- `frontend/src/components/career-viz/GraphControls.jsx`
- `frontend/src/components/career-viz/graphLayoutUtils.js`
- `frontend/src/services/patternService.js`
- `frontend/src/pages/CareerPathPage.jsx`
- `frontend/src/data/mockCareerGraphData.js`

**Modified Files:**
- `frontend/src/App.jsx` (add `/career-path` route)
- `frontend/src/components/layout/Sidebar.jsx` (add Career Path link, if not already there)
- `frontend/package.json` (new dependencies: reactflow, dagre)

---

## Dependencies

**Blocked By:**
- STEP-1-SETUP: React app skeleton must exist
- Block H (Auth & Layout): MainLayout and routing must exist

**Blocks This:**
- Block P (Visualization Integration): Connects this UI to real pattern data (Step 3)

**Works With:**
- Block F (Success Patterns): Provides pattern data (integrated in Step 3)
- Block L (Success Pattern UI): Complementary charts view

---

## Testing Checklist

- [ ] Manual test: Graph renders with mock data (5+ nodes, 4+ edges)
- [ ] Manual test: Current role has yellow border
- [ ] Manual test: Click node → NodeDetailsPanel opens with correct data
- [ ] Manual test: Zoom in/out buttons work
- [ ] Manual test: Fit view button centers graph
- [ ] Manual test: Search "Manager" → filters graph to manager roles
- [ ] Manual test: Department filter "Advisory" → shows only Advisory roles
- [ ] Manual test: Min success rate slider to 60% → hides edges <60%
- [ ] Manual test: Hover over edge → tooltip shows details (if implemented)
- [ ] Manual test: Close NodeDetailsPanel → panel disappears
- [ ] Browser console: No errors or warnings
- [ ] Browser DevTools → Network: patternService mock returns data correctly
- [ ] Visual test: Colors match EY branding (yellow, green, gray)
- [ ] Responsive test: Graph works on narrow screen (needs horizontal scroll or zoom out)

---

## Mock Data Structure (Example)

Use this structure in `mockCareerGraphData.js`:

```javascript
export const mockCareerGraphData = {
  roles: [
    {
      id: 'analyst',
      label: 'Analyst',
      department: 'Advisory',
      employeeCount: 120,
      avgYearsInRole: 2.1
    },
    {
      id: 'senior-analyst',
      label: 'Senior Analyst',
      department: 'Advisory',
      employeeCount: 87,
      avgYearsInRole: 2.8
    },
    {
      id: 'manager',
      label: 'Manager',
      department: 'Advisory',
      employeeCount: 45,
      avgYearsInRole: 3.5
    },
    {
      id: 'senior-manager',
      label: 'Senior Manager',
      department: 'Advisory',
      employeeCount: 28,
      avgYearsInRole: 4.2
    },
    {
      id: 'business-analyst',
      label: 'Business Analyst',
      department: 'Consulting',
      employeeCount: 56,
      avgYearsInRole: 2.3
    }
  ],
  transitions: [
    {
      source: 'analyst',
      target: 'senior-analyst',
      successRate: 0.72,
      avgTimeYears: 2.3,
      sampleSize: 64,
      commonSkills: ['Excel', 'Client Management', 'Problem Solving']
    },
    {
      source: 'senior-analyst',
      target: 'manager',
      successRate: 0.58,
      avgTimeYears: 3.1,
      sampleSize: 41,
      commonSkills: ['Leadership', 'Project Management', 'Stakeholder Management']
    },
    {
      source: 'analyst',
      target: 'business-analyst',
      successRate: 0.42,
      avgTimeYears: 2.8,
      sampleSize: 18,
      commonSkills: ['SQL', 'Business Process Analysis', 'Communication']
    },
    {
      source: 'manager',
      target: 'senior-manager',
      successRate: 0.65,
      avgTimeYears: 3.5,
      sampleSize: 24,
      commonSkills: ['Strategic Thinking', 'Stakeholder Management', 'Budgeting']
    }
  ],
  employeeCurrentRole: 'analyst'  // Highlight this role
};
```

---

## Example Code Snippets

### Dagre Layout Function

```javascript
// graphLayoutUtils.js
import dagre from 'dagre';

export function layoutGraph(nodes, edges) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 180, height: 80 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 90,  // Center node (180px / 2)
        y: nodeWithPosition.y - 40   // Center node (80px / 2)
      }
    };
  });

  return layoutedNodes;
}
```

### RoleNode Component

```jsx
// RoleNode.jsx
import { Handle, Position } from 'reactflow';

export function RoleNode({ data }) {
  const isCurrentRole = data.isCurrentRole;
  const isPossibleNext = data.isPossibleNext;

  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 bg-white shadow-md min-w-[180px]
        ${isCurrentRole ? 'border-yellow-400 shadow-yellow-200' : ''}
        ${isPossibleNext && !isCurrentRole ? 'border-green-500 shadow-green-200' : ''}
        ${!isCurrentRole && !isPossibleNext ? 'border-gray-300' : ''}
      `}
    >
      <Handle type="target" position={Position.Top} className="w-2 h-2" />

      <div className="font-bold text-sm text-gray-900">{data.label}</div>
      <div className="text-xs text-gray-600 mt-1">{data.department}</div>
      <div className="text-xs text-gray-500 mt-1">
        {data.employeeCount} employees
      </div>

      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    </div>
  );
}
```

### TransitionEdge Component

```jsx
// TransitionEdge.jsx
import { getBezierPath, EdgeLabelRenderer } from 'reactflow';

export function TransitionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const successRate = (data.successRate * 100).toFixed(0);
  const strokeColor = data.successRate > 0.7 ? '#22c55e' :
                      data.successRate > 0.5 ? '#f59e0b' : '#9ca3af';

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        stroke={strokeColor}
        strokeWidth={2}
        fill="none"
        markerEnd="url(#arrow)"
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan bg-white px-2 py-1 rounded shadow-sm border border-gray-200 text-xs font-semibold"
        >
          {successRate}%
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
```

### CareerVisualization Component

```jsx
// CareerVisualization.jsx
import { useCallback, useEffect, useState } from 'react';
import ReactFlow, { Controls, Background, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import { RoleNode } from './RoleNode';
import { TransitionEdge } from './TransitionEdge';
import { layoutGraph } from './graphLayoutUtils';
import { fetchCareerGraph } from '../../services/patternService';

const nodeTypes = { roleNode: RoleNode };
const edgeTypes = { transitionEdge: TransitionEdge };

export function CareerVisualization() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    loadGraphData();
  }, []);

  const loadGraphData = async () => {
    const data = await fetchCareerGraph();
    const transformedNodes = data.roles.map(role => ({
      id: role.id,
      type: 'roleNode',
      position: { x: 0, y: 0 },
      data: {
        label: role.label,
        department: role.department,
        employeeCount: role.employeeCount,
        isCurrentRole: role.id === data.employeeCurrentRole
      }
    }));

    const transformedEdges = data.transitions.map(t => ({
      id: `${t.source}-${t.target}`,
      source: t.source,
      target: t.target,
      type: 'transitionEdge',
      data: {
        successRate: t.successRate,
        avgTimeYears: t.avgTimeYears,
        sampleSize: t.sampleSize,
        commonSkills: t.commonSkills
      }
    }));

    const layoutedNodes = layoutGraph(transformedNodes, transformedEdges);
    setNodes(layoutedNodes);
    setEdges(transformedEdges);
  };

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  return (
    <div className="h-[600px] bg-gray-50 rounded-lg border border-gray-200">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Controls />
        <Background color="#aaa" gap={16} />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
```

---

## Styling Guidelines (EY Branding)

```css
/* Color palette from UX reference */
--ey-yellow: #ffe600;
--ey-confident-black: #1a1a24;
--ey-off-white: #f6f6fa;
--success: #22c55e;
--warning: #f59e0b;

/* Node states */
Current role: border-yellow-400, shadow-yellow-200
Possible next: border-green-500, shadow-green-200
Default: border-gray-300

/* Edge colors */
High success (>70%): stroke-green-500
Medium success (50-70%): stroke-yellow-500
Low success (<50%): stroke-gray-400

/* Typography */
Font: Inter (from UX reference)
Role name: font-bold text-sm
Department: text-xs text-gray-600
Count: text-xs text-gray-500
```

---

**When all tasks are complete, run the verification steps in `VERIFICATION.md`**
