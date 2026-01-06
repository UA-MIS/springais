# BLOCK K: Career Visualization (React Flow) - CONTEXT

**Block ID:** BLOCK-K-CAREER-VIZ
**Phase:** STEP-2-DEVELOPMENT
**Category:** #frontend #react #visualization
**Estimated Time:** 3-4 days
**Dependencies:** None (requires STEP-1-SETUP complete)

---

## Purpose

Build an interactive career path visualization using React Flow that shows:
- **Role transitions** as a graph network (nodes = roles, edges = transition paths)
- **Success rates** for each transition (edge labels)
- **Employee's current position** (highlighted node)
- **Possible next roles** (highlighted outgoing edges)
- **Interactive exploration** (zoom, pan, click nodes for details)

This visualization transforms abstract career data into an intuitive, explorable map that helps employees understand their career options at EY.

---

## What This Block Delivers

1. **React Flow Career Graph** - Interactive node-edge visualization
2. **Custom Node Components** - Styled role nodes with metadata
3. **Custom Edge Components** - Transition edges with success rate labels
4. **Interactive Controls** - Zoom, pan, fit view, search roles
5. **Node Details Panel** - Click node to see role details and outgoing paths
6. **Graph Layout Algorithm** - Auto-arrange nodes for readability
7. **Current Position Highlighting** - Emphasize employee's current role

---

## Key Concepts

### React Flow Library
React Flow is a powerful library for building node-based graphs:
- **Nodes:** Represent roles (e.g., "Consultant", "Senior Consultant")
- **Edges:** Represent transitions with directional arrows
- **Interactive:** Built-in zoom, pan, drag nodes
- **Customizable:** Full control over node/edge appearance

### Graph Structure
```
Analyst ──────> Senior Analyst ──────> Manager
  │               │                      │
  │               │                      └──> Senior Manager
  │               └──> Team Lead
  │
  └──> Business Analyst
```

### Data Flow
1. **Block F (Success Patterns)** → Pattern data (transitions, success rates)
2. **Block K (This Block)** → Transform to React Flow format
3. **Frontend Visualization** → Render interactive graph

---

## Technical Approach

### Tech Stack
- **React Flow** (v11+) - Graph visualization library
- **React 18** - Component framework
- **Tailwind CSS** - Styling
- **Dagre** (optional) - Auto-layout algorithm
- **Zustand** (optional) - State management for graph interactions

### Folder Structure
```
frontend/src/
├── components/
│   └── career-viz/
│       ├── CareerVisualization.jsx      # Main component
│       ├── RoleNode.jsx                 # Custom node component
│       ├── TransitionEdge.jsx           # Custom edge component
│       ├── NodeDetailsPanel.jsx         # Side panel for clicked node
│       ├── GraphControls.jsx            # Zoom, fit view, search
│       └── graphLayoutUtils.js          # Layout algorithm
├── services/
│   └── patternService.js                # API calls to fetch pattern data
└── pages/
    └── CareerPathPage.jsx               # Page wrapper
```

---

## React Flow Node & Edge Format

### Node Structure
```javascript
{
  id: 'consultant',
  type: 'roleNode',  // Custom node type
  position: { x: 100, y: 200 },
  data: {
    label: 'Consultant',
    department: 'Advisory',
    employeeCount: 47,
    avgYearsInRole: 2.5,
    isCurrentRole: false,
    isPossibleNext: false
  }
}
```

### Edge Structure
```javascript
{
  id: 'consultant-to-senior-consultant',
  source: 'consultant',
  target: 'senior-consultant',
  type: 'transitionEdge',  // Custom edge type
  animated: false,
  data: {
    successRate: 0.68,
    avgTimeYears: 2.5,
    sampleSize: 47,
    commonSkills: ['Client Management', 'Problem Solving']
  }
}
```

---

## Custom Node Component (RoleNode)

Features:
- **Role title** (e.g., "Senior Consultant")
- **Department badge** (e.g., "Advisory")
- **Employee count** (e.g., "47 employees")
- **Visual states:**
  - Current role: Yellow border (EY yellow)
  - Possible next role: Green glow
  - Default: Gray border

```jsx
// Example RoleNode.jsx
function RoleNode({ data }) {
  const isCurrentRole = data.isCurrentRole;
  const isPossibleNext = data.isPossibleNext;

  return (
    <div className={`
      px-4 py-3 rounded-lg border-2 bg-white shadow-md
      ${isCurrentRole ? 'border-yellow-400' : ''}
      ${isPossibleNext ? 'border-green-500 shadow-green-200' : 'border-gray-300'}
    `}>
      <div className="font-bold text-sm">{data.label}</div>
      <div className="text-xs text-gray-600">{data.department}</div>
      <div className="text-xs text-gray-500 mt-1">
        {data.employeeCount} employees
      </div>
    </div>
  );
}
```

---

## Custom Edge Component (TransitionEdge)

Features:
- **Success rate label** (e.g., "68%")
- **Hover tooltip** (shows avg time, sample size, skills)
- **Color coding:**
  - High success (>70%): Green
  - Medium success (50-70%): Yellow
  - Low success (<50%): Gray
- **Arrow marker** indicating direction

```jsx
// Example TransitionEdge.jsx
function TransitionEdge({ data, sourceX, sourceY, targetX, targetY }) {
  const successRate = (data.successRate * 100).toFixed(0);
  const edgeColor = data.successRate > 0.7 ? '#22c55e' :
                    data.successRate > 0.5 ? '#f59e0b' : '#9ca3af';

  return (
    <>
      <path stroke={edgeColor} strokeWidth={2} d={edgePath} />
      <text>
        <textPath href={`#${id}`}>
          {successRate}%
        </textPath>
      </text>
    </>
  );
}
```

---

## Graph Layout Algorithm

Use Dagre for automatic hierarchical layout:

```javascript
// graphLayoutUtils.js
import dagre from 'dagre';

export function layoutGraph(nodes, edges) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 100 });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((node) => {
    g.setNode(node.id, { width: 180, height: 80 });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return nodes.map((node) => {
    const position = g.node(node.id);
    return {
      ...node,
      position: { x: position.x, y: position.y }
    };
  });
}
```

---

## Interactive Features

### 1. Zoom & Pan Controls
- Zoom in/out buttons
- Fit view button (center entire graph)
- Mini-map (optional)

### 2. Node Click → Details Panel
When user clicks a node:
- Show side panel with role details
- List all outgoing transitions with success rates
- Show required skills for each transition
- Highlight outgoing edges on graph

### 3. Search & Filter
- Search bar to find specific role
- Filter by department
- Filter by min success rate (e.g., only show >60% transitions)

### 4. Highlight Current & Next Roles
- On load, auto-highlight employee's current role
- Highlight recommended next roles (based on success patterns)

---

## Integration with Block F (Success Patterns)

Block F provides pattern data via API:

```javascript
// Example API response from Block F
GET /api/patterns/graph

{
  "roles": [
    { "id": "analyst", "label": "Analyst", "department": "Advisory", "employeeCount": 120 },
    { "id": "senior-analyst", "label": "Senior Analyst", "department": "Advisory", "employeeCount": 87 }
  ],
  "transitions": [
    {
      "source": "analyst",
      "target": "senior-analyst",
      "successRate": 0.72,
      "avgTimeYears": 2.3,
      "sampleSize": 64,
      "commonSkills": ["Excel", "Client Management"]
    }
  ],
  "employeeCurrentRole": "analyst"  // For highlighting
}
```

Transform this data to React Flow format:

```javascript
function transformToReactFlow(apiData) {
  const nodes = apiData.roles.map(role => ({
    id: role.id,
    type: 'roleNode',
    position: { x: 0, y: 0 },  // Will be set by layout algorithm
    data: {
      label: role.label,
      department: role.department,
      employeeCount: role.employeeCount,
      isCurrentRole: role.id === apiData.employeeCurrentRole
    }
  }));

  const edges = apiData.transitions.map(t => ({
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

  return { nodes, edges };
}
```

---

## Mock Data for Testing

For this block, use mock graph data until Block F is ready:

```javascript
// Mock career graph data
const mockGraphData = {
  roles: [
    { id: 'analyst', label: 'Analyst', department: 'Advisory', employeeCount: 120 },
    { id: 'senior-analyst', label: 'Senior Analyst', department: 'Advisory', employeeCount: 87 },
    { id: 'manager', label: 'Manager', department: 'Advisory', employeeCount: 45 },
    { id: 'senior-manager', label: 'Senior Manager', department: 'Advisory', employeeCount: 28 },
    { id: 'business-analyst', label: 'Business Analyst', department: 'Consulting', employeeCount: 56 }
  ],
  transitions: [
    { source: 'analyst', target: 'senior-analyst', successRate: 0.72, avgTimeYears: 2.3, sampleSize: 64, commonSkills: ['Excel', 'Client Management'] },
    { source: 'senior-analyst', target: 'manager', successRate: 0.58, avgTimeYears: 3.1, sampleSize: 41, commonSkills: ['Leadership', 'Project Management'] },
    { source: 'analyst', target: 'business-analyst', successRate: 0.42, avgTimeYears: 2.8, sampleSize: 18, commonSkills: ['SQL', 'Business Process'] },
    { source: 'manager', target: 'senior-manager', successRate: 0.65, avgTimeYears: 3.5, sampleSize: 24, commonSkills: ['Strategic Thinking', 'Stakeholder Management'] }
  ],
  employeeCurrentRole: 'analyst'
};
```

---

## Design Reference

See `_bmad-output/ux-unified-dashboard-v2-with-enhanced-roadmap.html` for:
- Color scheme (EY yellow, black, gray)
- Card styling patterns
- Interactive component styles
- Responsive layout approach

### EY Branding for Graph
- **Current role node:** Yellow border (`--ey-yellow`)
- **Possible next role:** Green border with subtle glow
- **High success edges:** Green (`--success`)
- **Medium success edges:** Yellow (`--warning`)
- **Low success edges:** Gray (`--ey-gray-01`)
- **Background:** Light gray (`--ey-off-white`)

---

## Integration Points

**Feeds Into:**
- **Block P (Visualization Integration):** Connects to real pattern data from Block F (Step 3)

**Depends On:**
- **Block F (Success Patterns):** Provides pattern data (integrated in Step 3 Block P)
- **Block H (Auth & Layout):** Renders inside MainLayout

**Works With:**
- **Block L (Success Pattern UI):** Complementary visualization (charts vs. graph)

---

## Success Criteria

✅ Block K is complete when:
1. Career graph renders with nodes and edges
2. Custom RoleNode component displays role info with correct styling
3. Custom TransitionEdge component shows success rate labels
4. Graph auto-layouts using Dagre (nodes positioned hierarchically)
5. Employee's current role is highlighted (yellow border)
6. Clicking a node shows details panel with outgoing transitions
7. Zoom/pan controls work correctly
8. Fit view button centers entire graph
9. Search bar filters graph to specific role
10. Styling matches EY branding (colors, typography)
11. Graph is responsive (works on different screen sizes)
12. Mock data displays 5+ roles with 4+ transitions

---

## References

- **React Flow Docs:** https://reactflow.dev/
- **Dagre Layout:** https://github.com/dagrejs/dagre
- **Pattern Data API:** `GET /api/patterns/graph` (to be built in Block F → integrated in Block P)
- **UX Design:** `_bmad-output/ux-unified-dashboard-v2-with-enhanced-roadmap.html`

---

## Notes

- React Flow v11+ has built-in TypeScript support (optional)
- Consider adding mini-map for large graphs (10+ nodes)
- Edge labels can be challenging to read - ensure good contrast
- Auto-layout may need tweaking for optimal readability
- Mobile support: Graph might need horizontal scroll or simplified view
- For performance, limit graph to 50 nodes max (filter by department if needed)

---

**Next Steps:** See `TASKS.md` for implementation tasks
