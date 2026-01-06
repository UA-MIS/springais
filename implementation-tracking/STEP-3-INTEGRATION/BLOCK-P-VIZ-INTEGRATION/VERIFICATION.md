# BLOCK P: Visualization Integration - VERIFICATION

**Block:** BLOCK-P-VIZ-INTEGRATION
**Purpose:** Verify career visualization and success pattern UI display real data from backend pattern service

---

## Quick Verification Commands

```bash
# 1. Start backend (Block F pattern service must be running)
cd backend
python -m uvicorn app.main:app --reload

# 2. Start frontend
cd frontend
npm run dev

# 3. Test pattern API endpoints
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/patterns/graph

# 4. Check if graph endpoint returns data
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/patterns/graph | jq '.roles | length'

# 5. Check transition details
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/patterns/transition/analyst/senior-analyst" | jq .
```

---

## Manual Verification Steps

### 1. Career Graph Data Integration Test

**Prerequisites:**
- Block M (Core Integration) complete - auth working
- Block F (Success Patterns) complete - API endpoints implemented
- Block K (Career Viz) complete - graph component built
- User logged in with valid JWT token

**Open browser:**
```
http://localhost:3000/career-paths
```

**Expected behavior:**
1. Loading skeleton appears briefly
2. Career graph renders with nodes and edges
3. Nodes display role names from database
4. Edges show success rate percentages
5. Employee's current role has yellow border (highlighted)

**Verify graph data is from API:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Refresh page
4. Find request: `GET /api/patterns/graph`
5. Check request headers include: `Authorization: Bearer <token>`
6. Check response status: 200 OK
7. Inspect response body:
   ```json
   {
     "roles": [...],
     "transitions": [...],
     "employeeCurrentRole": "analyst"
   }
   ```

**Verify graph displays API data:**
1. Count nodes in graph - should match `roles` array length
2. Count edges in graph - should match `transitions` array length
3. Click a node labeled "Analyst" (or any role from API)
4. Verify role exists in API response
5. Check edge labels show success rates from API (e.g., "72%")

**✅ Pass Criteria:**
- Graph makes API call with Authorization header
- API returns 200 with pattern data
- Graph displays same number of roles as API response
- Node labels match API data
- Edge labels match API success rates
- Employee's current role is highlighted correctly
- No console errors

---

### 2. Loading States Test

**Test loading skeleton:**
1. Open browser DevTools
2. Go to Network tab, set throttling to "Slow 3G"
3. Refresh career path page
4. Observe loading skeleton displays while fetching

**Expected:**
- Loading skeleton appears immediately
- Shows spinning icon and "Loading career paths..." message
- Skeleton displays for duration of API call
- Graph appears after data loads
- Loading skeleton disappears smoothly

**Test different loading states:**
1. Skills dashboard loading (different skeleton)
2. Node details panel loading (when clicking node)
3. Chart loading in success patterns

**✅ Pass Criteria:**
- Loading skeleton displays during API calls
- Loading message is clear and helpful
- Transition from loading to data is smooth
- No flash of empty content before loading state

---

### 3. Error Handling Test

**Test API error:**
1. Stop backend server: `Ctrl+C` in backend terminal
2. Refresh career path page in browser
3. Wait for API call to fail

**Expected:**
- Error component displays
- Shows error icon (red exclamation or similar)
- Message: "Failed to Load Career Graph"
- Shows error details (e.g., "Network error" or "Failed to fetch")
- "Try Again" button appears

**Test retry functionality:**
1. Restart backend server
2. Click "Try Again" button on error screen

**Expected:**
- Loading skeleton appears
- API call retries
- Graph loads successfully
- Error screen disappears

**Test different error scenarios:**
1. **401 Unauthorized:** Expire token (clear localStorage), try to load graph
   - Expected: Redirect to login page
2. **404 Not Found:** Call non-existent endpoint
   - Expected: Error message with 404 details
3. **500 Server Error:** Backend throws error
   - Expected: Clear error message, not crash

**✅ Pass Criteria:**
- Error state displays when API fails
- Error message is clear and user-friendly
- Retry button works correctly
- 401 errors redirect to login
- Frontend doesn't crash on API errors
- Console shows error details (for debugging)

---

### 4. Empty State Test

**Test with no pattern data:**
1. Clear all employee data from database:
   ```sql
   DELETE FROM employees;
   ```
2. Refresh career path page

**Expected:**
- Empty state component displays
- Shows empty icon (document or chart icon)
- Message: "No Career Path Data Available"
- Explanation: "There isn't enough historical data to generate career paths yet."
- No graph renders (not broken/empty graph)

**Test with filters that match nothing:**
1. Add back employee data
2. Set department filter to "Non-Existent Department"
3. Apply filter

**Expected:**
- Empty state displays
- Message indicates no data matches filters
- User can clear filters to see data again

**✅ Pass Criteria:**
- Empty state shows when no data available
- Message explains why data is missing
- UI doesn't break or show errors
- User understands next action (wait for data, change filters)

---

### 5. Node Details Integration Test

**Test node click:**
1. Load career graph (with data)
2. Click on any role node (e.g., "Analyst")

**Expected:**
1. Details panel slides in from right
2. Loading skeleton appears briefly in panel
3. Panel displays role details:
   - Role name: "Analyst"
   - Department: "Advisory"
   - Employee count: "120 employees"
   - Avg years in role: "2.3 years"
4. Shows list of outgoing transitions:
   - Target role names
   - Success rates
   - Common skills
   - Recommended skills

**Verify API call:**
1. Check Network tab for: `GET /api/patterns/role/analyst`
2. Verify response includes:
   ```json
   {
     "role": { "name": "Analyst", "department": "Advisory", ... },
     "outgoingTransitions": [...]
   }
   ```

**Test multiple nodes:**
1. Click different nodes (Senior Analyst, Manager)
2. Verify each makes separate API call
3. Verify panel updates with correct data for each role

**✅ Pass Criteria:**
- Clicking node opens details panel
- Panel fetches data from `/api/patterns/role/{role_name}`
- Role details match API response
- Outgoing transitions display correctly
- Closing panel works
- Clicking different nodes updates panel

---

### 6. Success Pattern Dashboard Test

**Open success patterns page:**
```
http://localhost:3000/success-patterns
```

**Expected behavior:**
1. Dashboard loads with loading skeletons
2. API call: `GET /api/patterns/employee/{user.id}/recommendations`
3. Dashboard displays:
   - Current role card (e.g., "Analyst - 1.5 years")
   - Recommended career paths (bar chart)
   - Skill gap chart
   - Success metrics

**Verify data is personalized:**
1. Login as different users
2. Verify recommendations differ based on user's role
3. Check API is called with correct employee_id

**Verify charts display API data:**
1. Check Network tab for API response
2. Compare chart values to API data:
   - Success rates match
   - Skill gaps match
   - Recommended roles match

**✅ Pass Criteria:**
- Dashboard makes authenticated API call
- Recommendations are personalized (user-specific)
- Charts display real metrics from API
- Loading states work
- No console errors

---

### 7. Transition Details Chart Test

**Test transition details:**
1. On career graph, click edge between two roles
   OR
2. On success patterns dashboard, click a recommended transition

**Expected:**
1. Transition details chart displays
2. API call: `GET /api/patterns/transition/{source}/{target}`
3. Chart shows:
   - Success rate metric (e.g., "72%")
   - Avg time metric (e.g., "2.3 years")
   - Time distribution bar chart
   - Skill breakdown table

**Verify chart data:**
1. Check Network tab response
2. Verify bar chart values match `timeDistribution` in response:
   ```json
   {
     "timeDistribution": {
       "1-2 years": 12,
       "2-3 years": 35,
       "3-4 years": 14
     }
   }
   ```
3. Verify skill table matches `skillBreakdown`

**Test different transitions:**
1. Click different edges or recommendations
2. Verify each fetches correct API endpoint
3. Verify chart updates with new data

**✅ Pass Criteria:**
- Clicking transition shows details chart
- Chart fetches data from API
- Metrics match API response
- Bar chart values are correct
- Skill breakdown displays accurately

---

### 8. Real-Time Filter Updates Test

**Test department filter:**
1. Load career graph (all departments visible)
2. Select department: "Advisory"
3. Observe graph update

**Expected:**
1. Loading indicator appears briefly
2. API call: `GET /api/patterns/graph?department=Advisory`
3. Graph re-renders with only Advisory roles
4. Nodes outside Advisory disappear
5. Edges update accordingly

**Test success rate filter:**
1. Set "Min Success Rate" slider to 60%
2. Observe graph update

**Expected:**
1. API call: `GET /api/patterns/graph?min_success_rate=0.6`
2. Graph shows only transitions with >60% success rate
3. Low-success edges disappear

**Test filter combinations:**
1. Set department: "Advisory" AND min_success_rate: 0.7
2. Verify API call includes both params
3. Verify graph shows filtered results

**✅ Pass Criteria:**
- Changing filters triggers API call
- API call includes filter params in query string
- Graph updates to show filtered data
- Loading state shows during update
- Filters work independently and combined

---

### 9. Cache Verification Test

**Test cache reduces API calls:**
1. Load career graph (first load - API call made)
2. Navigate away from page
3. Navigate back to career graph (within 5 minutes)

**Expected:**
- Graph loads instantly (no API call)
- Check Network tab: No new request to `/api/patterns/graph`
- Data is from cache

**Test cache expiration:**
1. Load career graph (cache populated)
2. Wait 5+ minutes (cache expiration time)
3. Navigate away and back

**Expected:**
- New API call made (cache expired)
- Fresh data fetched

**Test cache invalidation:**
1. Load graph (cache populated)
2. Change filter (should bust cache)
3. Verify new API call made with new params

**Test manual refresh:**
1. Load graph (cache populated)
2. Click "Refresh" button (if implemented)
3. Verify new API call made (cache ignored)

**✅ Pass Criteria:**
- Repeated loads use cache (no redundant API calls)
- Cache expires after configured duration
- Filter changes bust cache
- Manual refresh bypasses cache

---

### 10. Authentication Integration Test

**Test with valid token:**
1. Login as user
2. Navigate to career paths
3. Verify graph loads successfully
4. Check request includes Authorization header

**Test with expired token:**
1. Use browser console to set expired token:
   ```javascript
   localStorage.setItem('token', 'expired-token-here')
   ```
2. Refresh career path page
3. Try to load graph

**Expected:**
- API returns 401 Unauthorized
- Frontend API client catches 401
- Token cleared from localStorage
- Redirect to login page

**Test without token:**
1. Clear localStorage: `localStorage.clear()`
2. Navigate to career paths page

**Expected:**
- Protected route component redirects to login
- No API call made (not authenticated)

**✅ Pass Criteria:**
- Valid token allows graph to load
- API calls include Authorization header
- Expired token triggers logout and redirect
- Missing token redirects to login
- No crashes or infinite loops

---

### 11. Edge Cases Test

**Test with minimal data:**
1. Database has only 1 employee with 1 role
2. Load career graph

**Expected:**
- Graph shows single node
- No edges (no transitions)
- No errors or crashes

**Test with large dataset:**
1. Database has 50+ roles, 100+ transitions
2. Load career graph

**Expected:**
- Graph loads within reasonable time (<3 seconds)
- Layout algorithm handles many nodes
- Graph is navigable (zoom, pan work)
- Performance is acceptable (no lag)

**Test with missing fields:**
1. API returns role without `employeeCount` field
2. Load graph

**Expected:**
- Graph still renders
- Missing fields show default/empty values
- No console errors

**Test concurrent API calls:**
1. Quickly click multiple nodes (details panel)
2. Verify each API call completes
3. Panel shows data for most recently clicked node
4. No race conditions

**✅ Pass Criteria:**
- Handles minimal data (1 role)
- Handles large data (50+ roles)
- Handles missing fields gracefully
- No race conditions with concurrent calls
- Performance acceptable on large graphs

---

### 12. Integration Test Suite

**Run frontend integration tests:**
```bash
cd frontend
npm test -- viz-integration.test.jsx
```

**Expected tests:**
```
✓ CareerVisualization loads real graph data
✓ CareerVisualization shows loading state
✓ CareerVisualization handles API errors
✓ CareerVisualization shows empty state when no data
✓ NodeDetailsPanel fetches and displays role details
✓ SuccessPatternDashboard loads recommendations
✓ TransitionDetailsChart renders with API data
✓ Filters trigger new API calls
✓ Cache prevents redundant calls
✓ 401 errors redirect to login
```

**Run backend integration tests (Block F):**
```bash
cd backend
pytest tests/test_patterns.py -v
```

**Expected tests:**
```
✓ test_get_graph_endpoint_returns_data
✓ test_get_role_details_endpoint
✓ test_get_transition_details_endpoint
✓ test_get_employee_recommendations_endpoint
✓ test_graph_with_filters
✓ test_authentication_required
```

**✅ Pass Criteria:**
- All frontend integration tests pass
- All backend API tests pass
- No flaky tests (run twice to confirm)
- Test coverage >80% for integration code

---

## End-to-End Manual Test Flow

**Complete user journey:**

1. **Login:**
   - Go to http://localhost:3000/login
   - Login as test user
   - Verify redirect to dashboard

2. **Navigate to Career Paths:**
   - Click "Career Paths" in navigation
   - Observe loading skeleton
   - Verify graph loads with real data from API
   - Check DevTools Network tab for API call

3. **Explore Graph:**
   - Zoom in/out on graph (controls work)
   - Pan around graph (drag to move)
   - Click "Fit View" button (centers graph)

4. **View Node Details:**
   - Click role node (e.g., "Analyst")
   - Wait for details panel to load
   - Verify outgoing transitions display
   - Check Network tab for `/api/patterns/role/analyst` call

5. **Apply Filters:**
   - Select department: "Advisory"
   - Observe graph update (only Advisory roles)
   - Change min success rate: 60%
   - Verify graph shows only high-success transitions

6. **View Success Patterns:**
   - Navigate to "Success Patterns" page
   - Observe loading
   - Verify recommendations load
   - Check charts display data

7. **View Transition Details:**
   - Click a recommended transition
   - Observe transition details chart
   - Verify metrics and bar chart display

8. **Test Error Handling:**
   - Stop backend server
   - Try to refresh career graph
   - Verify error message displays
   - Restart backend, click retry
   - Verify graph loads successfully

9. **Test Cache:**
   - Navigate away from career paths
   - Navigate back (within 5 minutes)
   - Check Network tab (no new API call - cached)

10. **Logout:**
    - Click logout
    - Verify redirect to login
    - Try to access career paths directly
    - Verify redirect back to login (protected route)

**✅ Pass Criteria:**
- Complete flow works without errors
- All visualizations display real data
- Loading states smooth and informative
- Error handling graceful
- Authentication works throughout
- Cache improves performance
- No console errors at any point
- UI is responsive and intuitive

---

## Performance Benchmarks

**API Response Times (acceptable):**
- `GET /api/patterns/graph`: <500ms
- `GET /api/patterns/role/{role_name}`: <200ms
- `GET /api/patterns/transition/{source}/{target}`: <200ms
- `GET /api/patterns/employee/{id}/recommendations`: <300ms

**Frontend Render Times (acceptable):**
- Career graph initial render: <1 second (after data loads)
- Filter update re-render: <500ms
- Node details panel open: <200ms
- Chart render: <300ms

**Test with Chrome DevTools Performance tab:**
1. Open Performance tab
2. Click "Record"
3. Load career path page
4. Stop recording
5. Analyze timeline

**✅ Pass Criteria:**
- No long tasks (>50ms)
- Frame rate stable (60fps)
- Memory usage stable (no leaks)
- Network waterfall shows efficient loading

---

## Browser Compatibility Test

**Test in multiple browsers:**
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)

**Verify in each browser:**
- Graph renders correctly
- Interactions work (click, zoom, pan)
- Charts display properly
- API calls succeed
- No browser-specific errors

**Test responsive design:**
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768px width)
- [ ] Mobile (375px width)

**✅ Pass Criteria:**
- Works in all major browsers
- Responsive design adapts to screen sizes
- Touch interactions work on mobile
- No layout breaks at any breakpoint

---

## Final Checklist

Before marking BLOCK-P as complete:

- [ ] Career graph loads real data from `/api/patterns/graph`
- [ ] Graph displays correct roles and transitions from database
- [ ] Employee's current role is highlighted
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
- [ ] No console errors or warnings
- [ ] Performance is acceptable (<3s total load time)
- [ ] Works in all major browsers
- [ ] Responsive design works on all screen sizes
- [ ] API endpoints return expected data formats
- [ ] Network tab shows correct API calls with auth headers

---

## Success Criteria Met

If all above checks pass:

1. ✅ Update `TASKS.md` - all 7 tasks checked
2. ✅ Update `PROJECT-STATUS.md`:
   - Status: 🔄 → ✅
   - Progress: 7/7 tasks
3. ✅ Update Overall Progress section
4. ✅ Update Block Q CONTEXT.md (can now test full visualization flow)
5. ✅ Commit changes:
   ```bash
   git add .
   git commit -m "✅ Complete BLOCK-P: Visualization integration - Real pattern data connected"
   git push
   ```
6. ✅ Notify team: "Block P complete! Career graph and success patterns now display real data from backend."

---

## Troubleshooting Common Issues

### Issue: "Graph shows no data but API returns data"

**Diagnosis:**
- Check browser console for errors
- Verify `transformToReactFlow()` is called
- Log API response and transformed data
- Check React Flow component receives nodes/edges

**Solution:**
- Ensure transformation function returns correct format
- Verify node IDs are strings (not numbers)
- Check edge source/target IDs match node IDs
- Review React Flow documentation for data format

---

### Issue: "API call returns 500 error"

**Diagnosis:**
- Check backend logs for stack trace
- Verify database has employee data
- Test API endpoint with curl
- Check if Block F service is working

**Solution:**
- Fix backend error (check Block F implementation)
- Ensure database schema is correct
- Verify pattern analysis queries work
- Add error handling in backend service

---

### Issue: "Graph layout looks wrong"

**Diagnosis:**
- Check if Dagre is installed
- Verify `layoutGraph()` is called
- Inspect node positions in state

**Solution:**
- Install Dagre: `npm install dagre`
- Adjust layout config (ranksep, nodesep)
- Try different rankdir ('TB' vs 'LR')
- Manually position nodes if needed

---

### Issue: "Charts not rendering"

**Diagnosis:**
- Check if Recharts is installed
- Verify chart data format
- Inspect chart container dimensions

**Solution:**
- Install Recharts: `npm install recharts`
- Ensure data is array of objects
- Set explicit width/height on chart
- Check for CSS conflicts

---

**Last Updated:** 2026-01-06
**Status:** Ready for verification
