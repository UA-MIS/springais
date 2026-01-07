# BLOCK K: Career Visualization (React Flow) - VERIFICATION

**Block:** BLOCK-K-CAREER-VIZ
**Purpose:** Verify interactive career path graph works correctly with React Flow

---

## Quick Verification Commands

```bash
# Start frontend dev server
cd frontend
npm run dev

# Open browser
http://localhost:5173/career-path

# Check for console errors
# Open DevTools → Console (should have no errors)

# Check React Flow rendering
# Open DevTools → Elements → Look for .react-flow elements
```

---

## Manual Verification Checklist

### 1. Graph Renders Correctly

**Steps:**
1. Login to application
2. Navigate to `/career-path` (via sidebar or direct URL)

**Expected Results:**
- ✅ Career graph displays with 5+ role nodes
- ✅ Nodes positioned hierarchically (top-to-bottom layout)
- ✅ 4+ transition edges connecting nodes
- ✅ Graph is centered in viewport
- ✅ Background has dot pattern (React Flow Background)
- ✅ No overlapping nodes
- ✅ Loading spinner shows while data loads (if implemented)

**Visual Check:**
```
       Analyst
         │
         ├─────> Senior Analyst ───> Manager ───> Senior Manager
         │              │
         └─────> Business Analyst
```

### 2. Custom RoleNode Component

**Visual Verification:**
Each node should display:
- ✅ Role name (bold, dark text) - e.g., "Senior Analyst"
- ✅ Department badge (smaller text) - e.g., "Advisory"
- ✅ Employee count (gray text) - e.g., "87 employees"
- ✅ White background with border
- ✅ Rounded corners (rounded-lg)
- ✅ Subtle shadow (shadow-md)
- ✅ Connection handles visible (small circles at top/bottom)

**Current Role Highlighting:**
- ✅ Employee's current role has yellow border (`border-yellow-400`)
- ✅ Current role has subtle yellow glow/shadow
- ✅ Only ONE node is marked as current role

**Styling Check:**
- ✅ Node width: ~180px
- ✅ Node height: auto (based on content)
- ✅ Text is readable and properly aligned

### 3. Custom TransitionEdge Component

**Visual Verification:**
Each edge should:
- ✅ Display success rate label (e.g., "72%", "58%")
- ✅ Have arrow pointing to target node
- ✅ Label positioned at edge midpoint
- ✅ Label has white background with border (readable on any background)

**Color Coding (Success Rate):**
Test each edge visually:
- ✅ >70% success rate: Green edge (`#22c55e`)
- ✅ 50-70% success rate: Yellow edge (`#f59e0b`)
- ✅ <50% success rate: Gray edge (`#9ca3af`)

**Example:**
- Analyst → Senior Analyst (72%): Should be GREEN
- Senior Analyst → Manager (58%): Should be YELLOW
- Analyst → Business Analyst (42%): Should be GRAY

### 4. Graph Layout Algorithm

**Verification:**
1. Refresh page multiple times
2. Check if layout is consistent

**Expected Results:**
- ✅ Nodes positioned hierarchically (senior roles higher/lower based on direction)
- ✅ No overlapping nodes
- ✅ Edges don't cross unnecessarily
- ✅ Layout is deterministic (same layout on each reload)
- ✅ Spacing between nodes is adequate (80px rank separation, 100px node separation)

**Manual Test:**
- ✅ Entry-level roles (Analyst) should be at one end
- ✅ Senior roles (Manager, Senior Manager) should progress logically

### 5. React Flow Controls

**Test A: Zoom Controls**
1. Click "+" zoom button (top-left controls)
2. Click "-" zoom button
3. Use mouse wheel to zoom

**Expected Results:**
- ✅ Zoom in button enlarges graph
- ✅ Zoom out button shrinks graph
- ✅ Mouse wheel zoom works smoothly
- ✅ Min zoom: Can see entire graph
- ✅ Max zoom: Can read node text clearly

**Test B: Fit View**
1. Zoom in very close
2. Click "fit view" button (icon with 4 corners)

**Expected Result:**
- ✅ Graph auto-centers and fits entire viewport
- ✅ All nodes visible without scrolling

**Test C: Pan (Drag Canvas)**
1. Click and drag on empty canvas area

**Expected Result:**
- ✅ Graph moves with mouse/finger
- ✅ Smooth panning (no lag)

### 6. Node Click Interaction

**Steps:**
1. Click on any role node (e.g., "Senior Analyst")

**Expected Results:**
- ✅ NodeDetailsPanel opens (slide-in from right or overlay)
- ✅ Panel displays clicked node's information:
  - Role name
  - Department
  - Employee count
  - Avg years in role
- ✅ Panel lists outgoing transitions:
  - Target role names
  - Success rates
  - Avg time to transition
  - Common skills required
- ✅ Clicked node is visually highlighted (optional: different border)
- ✅ Outgoing edges from clicked node are highlighted (optional: thicker or different color)

**Close Panel:**
1. Click "X" close button or click outside panel

**Expected Result:**
- ✅ Panel closes smoothly
- ✅ Highlights removed from node/edges

### 7. NodeDetailsPanel Component

**Visual Verification:**
When panel is open:
- ✅ Panel appears on right side (or as modal)
- ✅ Panel has white background with shadow
- ✅ Close button (X) visible in top-right
- ✅ Content is scrollable if too long
- ✅ Panel width: ~300-400px
- ✅ Panel doesn't block entire graph

**Content Verification:**
Example: Click "Analyst" node
- ✅ Title: "Analyst"
- ✅ Department: "Advisory"
- ✅ Employee count: "120 employees"
- ✅ Avg years: "2.1 years"
- ✅ Section: "Possible Next Roles"
  - Senior Analyst (72% success, 2.3 years avg)
  - Business Analyst (42% success, 2.8 years avg)
- ✅ Skills listed for each transition

### 8. GraphControls Component (Search & Filters)

**Test A: Search by Role Name**
1. Type "Manager" in search bar

**Expected Results:**
- ✅ Graph filters to show only "Manager" and "Senior Manager" nodes
- ✅ Related edges update (only edges to/from visible nodes)
- ✅ Typing updates graph in real-time

**Clear Search:**
1. Clear search bar

**Expected Result:**
- ✅ Full graph reappears

**Test B: Department Filter**
1. Select "Advisory" from department dropdown

**Expected Results:**
- ✅ Only Advisory roles shown
- ✅ Consulting roles (e.g., Business Analyst) hidden
- ✅ Edges update accordingly

**Test C: Min Success Rate Slider**
1. Move slider to 60%

**Expected Results:**
- ✅ All edges with <60% success rate are hidden
- ✅ Nodes remain visible (only edges filtered)
- ✅ Slider value displayed (e.g., "Min Success: 60%")

**Test D: Reset Filters Button**
1. Apply multiple filters (search + department + min success)
2. Click "Reset Filters"

**Expected Result:**
- ✅ All filters cleared
- ✅ Full graph restored
- ✅ Search bar empty, dropdown set to "All", slider at 0%

### 9. MiniMap (Optional)

**If implemented:**
- ✅ MiniMap visible in bottom-right corner
- ✅ Shows entire graph overview
- ✅ Current viewport highlighted in minimap
- ✅ Click minimap to jump to area

### 10. Styling & EY Branding

**Color Verification:**
- ✅ Current role node: Yellow border (`#ffe600` or `border-yellow-400`)
- ✅ High success edges: Green (`#22c55e`)
- ✅ Medium success edges: Yellow (`#f59e0b`)
- ✅ Low success edges: Gray (`#9ca3af`)
- ✅ Background: Light gray/off-white (`#f6f6fa`)
- ✅ Text: Dark gray/black for readability

**Typography:**
- ✅ Font family: Inter (consistent with UX reference)
- ✅ Role names: Bold, easily readable
- ✅ Department/counts: Smaller, lighter weight

**Layout:**
- ✅ Page title: "Career Path Explorer" (or similar)
- ✅ Subtitle/instructions: Brief explanation
- ✅ Graph container: Adequate height (600px minimum)
- ✅ Professional, clean appearance

### 11. Responsive Design

**Test A: Desktop (1920px width)**
- ✅ Graph takes full container width
- ✅ Controls visible and accessible
- ✅ NodeDetailsPanel doesn't overlap graph entirely

**Test B: Tablet (768px width)**
- ✅ Graph resizes to fit viewport
- ✅ Nodes remain readable
- ✅ May need horizontal scroll or zoom out

**Test C: Mobile (375px width, bonus)**
- ✅ Graph container uses horizontal scroll
- ✅ Controls stack vertically (if needed)
- ✅ NodeDetailsPanel takes full screen width (or slides up from bottom)

### 12. Loading & Error States

**Test A: Loading State**
1. Refresh page
2. Observe initial load

**Expected Results:**
- ✅ Loading spinner/skeleton shows while fetching data
- ✅ Message: "Loading career paths..." (or similar)
- ✅ Graph appears after data loads

**Test B: Empty State**
1. Mock service to return empty data: `{ roles: [], transitions: [] }`

**Expected Result:**
- ✅ Empty state message: "No career paths available" (or similar)
- ✅ No errors in console

**Test C: Error State**
1. Mock service to throw error

**Expected Result:**
- ✅ Error message: "Failed to load career paths"
- ✅ Retry button (optional)
- ✅ Error logged to console (but not shown to user in ugly format)

---

## Browser DevTools Verification

### React Flow Elements Check

```javascript
// Open DevTools → Console
// Check if React Flow rendered
document.querySelector('.react-flow')
// Should return: <div class="react-flow">...</div>

// Count nodes
document.querySelectorAll('.react-flow__node').length
// Should return: 5 (or number of roles in mock data)

// Count edges
document.querySelectorAll('.react-flow__edge').length
// Should return: 4 (or number of transitions in mock data)
```

### Mock Data Check

```javascript
// In DevTools → Console
// Check if mock data loads correctly
// (Add console.log in patternService.js to verify)
```

### Network Tab

- ✅ No failed requests (all assets load)
- ✅ `patternService.js` returns mock data (check in Sources tab if needed)
- (Real API call will happen in Step 3 Block P)

---

## Console Error Check

**Expected:**
- ✅ No errors in console
- ✅ No warnings about missing keys, deprecated methods
- ✅ No React Flow warnings (e.g., missing node/edge IDs)

**Common Errors to Fix:**
- ❌ "Node/edge with id 'X' not found" → Check mock data structure
- ❌ "Cannot read property 'label' of undefined" → Check data transformation logic
- ❌ "Dagre is not defined" → Ensure dagre is installed: `npm install dagre`
- ❌ "Handle type 'source' not found" → Ensure Handle components in RoleNode

---

## Acceptance Criteria Checklist

- [ ] **Graph Rendering:** 5+ nodes and 4+ edges render correctly
- [ ] **Layout:** Dagre positions nodes hierarchically with no overlaps
- [ ] **Custom Nodes:** RoleNode displays role name, department, employee count
- [ ] **Current Role:** Employee's current role highlighted with yellow border
- [ ] **Custom Edges:** TransitionEdge shows success rate label with correct color
- [ ] **Edge Colors:** Green (>70%), yellow (50-70%), gray (<50%)
- [ ] **Node Click:** Clicking node opens NodeDetailsPanel with transition details
- [ ] **Details Panel:** Shows role info and outgoing transitions with skills
- [ ] **Zoom Controls:** Zoom in/out and fit view buttons work
- [ ] **Pan:** Drag canvas to pan graph
- [ ] **Search:** Filter graph by role name
- [ ] **Department Filter:** Show only roles in selected department
- [ ] **Success Rate Filter:** Slider hides edges below threshold
- [ ] **Reset Filters:** Restores full graph
- [ ] **Styling:** EY branding (yellow, green, gray colors), Inter font
- [ ] **Responsive:** Works on desktop (mobile bonus)
- [ ] **Loading State:** Shows spinner while loading
- [ ] **No Errors:** Console has no errors or warnings

---

## Performance Check

**Expected:**
- ✅ Graph renders within 1 second (with 5-10 nodes)
- ✅ Zoom/pan is smooth (60fps)
- ✅ Node click response is instant (<100ms)
- ✅ Filter updates happen in real-time (<200ms)
- ✅ No lag when interacting with graph

**Large Graph Test (Bonus):**
1. Mock data with 20+ nodes and 30+ edges
2. Verify performance still acceptable
3. MiniMap helpful for navigation

---

## Screenshot Verification

Take screenshots of:
1. Full graph view (5+ nodes, 4+ edges)
2. Current role highlighted (yellow border)
3. NodeDetailsPanel open with transition details
4. Edge labels showing success rates
5. Graph controls (zoom, search, filters)
6. Different edge colors (green, yellow, gray)

Compare with:
- UX reference: `_bmad-output/ux-unified-dashboard-v2-with-enhanced-roadmap.html`
- EY branding guidelines (yellow, black, gray palette)

---

## Common Issues & Solutions

### Issue: Nodes all positioned at (0, 0)

**Solution:**
```javascript
// Ensure layoutGraph is called BEFORE setting nodes state
const layoutedNodes = layoutGraph(transformedNodes, transformedEdges);
setNodes(layoutedNodes);  // Nodes should have x, y positions
```

### Issue: Dagre layout not working

**Solution:**
1. Verify dagre is installed: `npm list dagre`
2. Check import: `import dagre from 'dagre';`
3. Ensure node dimensions are set: `dagreGraph.setNode(node.id, { width: 180, height: 80 });`

### Issue: Edge labels not showing

**Solution:**
```jsx
// Use EdgeLabelRenderer from reactflow
import { EdgeLabelRenderer } from 'reactflow';

// In TransitionEdge component
<EdgeLabelRenderer>
  <div style={{ position: 'absolute', transform: `translate(${labelX}px, ${labelY}px)` }}>
    {successRate}%
  </div>
</EdgeLabelRenderer>
```

### Issue: Current role not highlighted

**Solution:**
```javascript
// In data transformation, ensure isCurrentRole is set correctly
data: {
  ...role,
  isCurrentRole: role.id === mockGraphData.employeeCurrentRole
}
```

### Issue: NodeDetailsPanel doesn't show outgoing transitions

**Solution:**
- Filter edges where `edge.source === selectedNode.id`
- Map to target nodes with transition details
- Ensure edges are passed to NodeDetailsPanel component

### Issue: Graph too small or too large

**Solution:**
```jsx
// Adjust default zoom in ReactFlow
<ReactFlow
  defaultViewport={{ zoom: 0.8, x: 0, y: 0 }}
  fitView
  minZoom={0.5}
  maxZoom={1.5}
>
```

### Issue: Nodes overlap after filtering

**Solution:**
- Re-run layout algorithm after filtering
- Or: Hide nodes with `hidden: true` property (maintains layout)

---

## Integration with Block F Verification

**Future Test (Step 3 Block P):**
When real API is connected:
1. Verify API call to `GET /api/patterns/graph`
2. Check response structure matches expected format
3. Test with real employee data (not mock)
4. Verify current role matches logged-in employee

**For Now (Block K):**
- ✅ Mock data structure matches expected API format
- ✅ Graph renders correctly with mock data
- ✅ Ready to swap mock service for real API calls

---

## Accessibility Check (Bonus)

- ✅ Keyboard navigation works (tab through controls)
- ✅ Focus indicators visible on buttons
- ✅ Color contrast sufficient (text readable on backgrounds)
- ✅ Alt text for icons (zoom buttons, close button)
- ✅ Screen reader friendly (role labels, edge labels)

---

## Cross-Browser Testing (Bonus)

**Test on:**
- ✅ Chrome (primary)
- ✅ Firefox
- ✅ Safari (if on Mac)
- ✅ Edge

**Expected:**
- Consistent rendering across browsers
- No layout shifts or visual bugs

---

## Next Steps After Verification

Once all checks pass:

1. ✅ Mark all tasks complete in `TASKS.md` (14/14)
2. ✅ Update `PROJECT-STATUS.md`:
   - Block K: ✅ Completed | [Your Name] | 14/14 tasks
3. ✅ Commit and push changes:
   ```bash
   git add .
   git commit -m "✅ Complete BLOCK-K: Career visualization - React Flow graph with transitions"
   git push
   ```
4. ✅ Document any deviations from original plan
5. ✅ Share screenshots/demo with team
6. ✅ Update `STEP-3-INTEGRATION/BLOCK-P-*/CONTEXT.md` with integration notes:
   - API endpoint structure required from Block F
   - Data transformation logic used
   - Any gotchas or edge cases discovered
7. ✅ Prepare for Step 3 Block P (Visualization Integration):
   - Replace mock `patternService` with real API calls
   - Test with real employee data from Block F
   - Handle dynamic employee's current role (from auth context)

---

## Demo Preparation Checklist

Before showing to stakeholders:
- [ ] Use realistic mock data (real EY role names, reasonable numbers)
- [ ] Current role set to mid-level position (shows both upward and lateral moves)
- [ ] At least 1 high-success path (green edge >70%)
- [ ] At least 1 lateral move (different department)
- [ ] NodeDetailsPanel shows actionable insights (skills to develop)
- [ ] Search/filter features work smoothly
- [ ] No console errors visible during demo
- [ ] Graph looks professional (EY branding, clean layout)

---

**Block K is complete when all acceptance criteria are met and manual tests pass** ✅
