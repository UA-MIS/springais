# BLOCK L: Success Pattern UI - TASKS

**Block:** BLOCK-L-SUCCESS-PATTERN-UI
**Total Tasks:** 11
**Completed:** 0/11 (0%)

---

## Progress Tracker

### 1. Project Setup & Dependencies (1 task)
- [ ] **Task 1.1:** Install Recharts library
  ```bash
  cd frontend
  npm install recharts
  # Verify installation
  npm list recharts
  ```

### 2. Mock Data Service (1 task)
- [ ] **Task 2.1:** Create success pattern mock data service
  - File: `frontend/src/services/successPatternService.js`
  - Export `mockSuccessPatterns` object with:
    - `metrics` object (avgTimeToPromotion, overallSuccessRate, totalSampleSize, topSkills)
    - `successRateByTransition` array (transitions with success rates and sample sizes)
    - `timeToPromotion` object (data by department with stage progressions)
    - `skillFrequency` array (top skills with frequency percentages)
    - `departmentDistribution` array (department counts)
  - Export async functions: `getSuccessPatterns(filters)`, `getMetrics(filters)`
  - For now, return mock data (real API in Step 3 Block P)

### 3. Metric Cards Component (1 task)
- [ ] **Task 3.1:** Create MetricCards component
  - File: `frontend/src/components/successPatterns/MetricCards.jsx`
  - Display three key metrics:
    1. Average Time to Promotion (e.g., "2.5 years")
    2. Overall Success Rate (e.g., "68%")
    3. Sample Size (e.g., "47 transitions")
  - Card styling: White background, EY yellow border on hover, icon on left
  - Responsive: 3 columns on desktop, stack on mobile
  - Props: `metrics` object
  - Use Tailwind CSS for styling (match EY branding)

### 4. Chart Components (4 tasks)
- [ ] **Task 4.1:** Create SuccessRateChart component
  - File: `frontend/src/components/successPatterns/SuccessRateChart.jsx`
  - Use Recharts `<BarChart>` component
  - X-axis: Transition names (e.g., "Analyst → Sr. Analyst")
  - Y-axis: Success rate (0-100%)
  - Bar colors: Green (>70%), Yellow (50-70%), Red (<50%)
  - Tooltip: Show transition name, success rate, sample size
  - Legend: Explain color coding
  - Responsive: Use `<ResponsiveContainer>`
  - Props: `data` array

- [ ] **Task 4.2:** Create TimeToPromotionChart component
  - File: `frontend/src/components/successPatterns/TimeToPromotionChart.jsx`
  - Use Recharts `<LineChart>` component
  - X-axis: Career stages (Analyst, Sr. Analyst, Consultant, Manager)
  - Y-axis: Years
  - Multiple lines: One per department (Advisory, Tax, Consulting)
  - Different colors for each line (use EY palette)
  - Tooltip: Show stage, department, avg years
  - Legend: Department names with colors
  - Markers on data points
  - Props: `data` object (keyed by department)

- [ ] **Task 4.3:** Create SkillFrequencyChart component
  - File: `frontend/src/components/successPatterns/SkillFrequencyChart.jsx`
  - Use Recharts `<BarChart>` (horizontal orientation)
  - Y-axis: Skill names (top 10 skills)
  - X-axis: Frequency percentage (0-100%)
  - Bars: EY yellow (#FFE600)
  - Labels: Show percentage on bars
  - Tooltip: Show skill name and frequency
  - Sorted: Highest frequency first
  - Props: `data` array

- [ ] **Task 4.4:** Create DepartmentDistributionChart component
  - File: `frontend/src/components/successPatterns/DepartmentDistributionChart.jsx`
  - Use Recharts `<PieChart>` with `<Pie>` (donut chart variant)
  - Slices: Different departments
  - Colors: Use distinct colors from EY palette
  - Tooltip: Department name, count, percentage
  - Legend: Show department names
  - Center label: Total count
  - Props: `data` array
  - Click handler: Emit selected department for filtering (bonus)

### 5. Filter Controls Component (1 task)
- [ ] **Task 5.1:** Create FilterControls component
  - File: `frontend/src/components/successPatterns/FilterControls.jsx`
  - Three dropdowns:
    1. Department: ["All", "Advisory", "Tax", "Consulting", "Audit"]
    2. Role Level: ["All", "Analyst", "Consultant", "Manager", "Director"]
    3. Time Period: ["Last 5 years", "Last 10 years", "All time"]
  - "Apply Filters" button (EY yellow background)
  - "Clear Filters" button (visible when filters are active)
  - Show "Filtered by: [active filters]" indicator
  - Props: `onFilterChange` callback
  - Update URL query params when filters change
  - Style with Tailwind (match EY branding)

### 6. Main Page Component (2 tasks)
- [ ] **Task 6.1:** Create SuccessPatternPage component
  - File: `frontend/src/components/successPatterns/SuccessPatternPage.jsx`
  - Page title: "Success Patterns & Career Insights"
  - Subtitle: "Data-driven insights from successful career transitions at EY"
  - Layout structure:
    - FilterControls at top
    - MetricCards below filters
    - 2x2 grid of charts:
      - Row 1: SuccessRateChart, TimeToPromotionChart
      - Row 2: SkillFrequencyChart, DepartmentDistributionChart
  - State management:
    - `filters` state (department, roleLevel, timePeriod)
    - `data` state (fetched from service)
    - `loading` state (show spinner while loading)
    - `error` state (show error message if fetch fails)
  - useEffect: Fetch data on mount and when filters change
  - Responsive grid: 2 columns on desktop, 1 column on mobile

- [ ] **Task 6.2:** Add loading and error states
  - Loading: Show skeleton loaders or spinner for each chart
  - Error: Display error message with retry button
  - Empty state: Show message if no data matches filters
  - Loading animation: Use Tailwind CSS spinner or custom animation

### 7. Routing & Integration (1 task)
- [ ] **Task 7.1:** Connect SuccessPatternPage to routing
  - File: `frontend/src/App.jsx` (should already have route from Block H)
  - Verify route exists: `/success-patterns` → `<SuccessPatternPage />`
  - If not, add route inside MainLayout protected routes
  - Test navigation from sidebar link
  - Verify page renders inside MainLayout (header + sidebar visible)

---

## Acceptance Criteria

✅ **Block L is complete when:**
1. Recharts library installed and verified
2. Mock data service returns comprehensive success pattern data
3. MetricCards component displays 3 key metrics with proper styling
4. SuccessRateChart renders bar chart with color-coded success rates
5. TimeToPromotionChart renders multi-line chart with department data
6. SkillFrequencyChart renders horizontal bar chart with top skills
7. DepartmentDistributionChart renders donut chart with department breakdown
8. FilterControls component has 3 dropdowns and apply/clear buttons
9. SuccessPatternPage combines all components in responsive layout
10. Loading states display while fetching data
11. Error handling works (try/catch, display error message)
12. Page accessible via `/success-patterns` route in sidebar
13. Styling matches EY branding (yellow #FFE600, black #2E2E38)
14. Responsive layout works on desktop and mobile
15. No console errors or warnings

---

## Files to Create/Modify

**New Files:**
- `frontend/src/services/successPatternService.js`
- `frontend/src/components/successPatterns/SuccessPatternPage.jsx`
- `frontend/src/components/successPatterns/MetricCards.jsx`
- `frontend/src/components/successPatterns/SuccessRateChart.jsx`
- `frontend/src/components/successPatterns/TimeToPromotionChart.jsx`
- `frontend/src/components/successPatterns/SkillFrequencyChart.jsx`
- `frontend/src/components/successPatterns/DepartmentDistributionChart.jsx`
- `frontend/src/components/successPatterns/FilterControls.jsx`

**Modified Files:**
- `frontend/src/App.jsx` (verify route exists - should be from Block H)
- `frontend/package.json` (add recharts dependency)

---

## Dependencies

**Blocked By:**
- STEP-1-SETUP: React app skeleton must exist
- Block H: MainLayout and routing must exist

**Blocks This:**
- Block P: Visualization Integration (connects to Block F API - Step 3)

**Works With:**
- Block K: Career Visualization (both use success pattern data)
- Block F: Success Pattern Analysis (provides real data in Step 3)

---

## Testing Checklist

### Manual Tests
- [ ] Navigate to `/success-patterns` → Page loads without errors
- [ ] All four charts render with mock data
- [ ] Metric cards show correct values
- [ ] Hover over chart elements → Tooltips appear
- [ ] Change filter dropdown → Apply filters → Charts update
- [ ] Click "Clear Filters" → Filters reset, charts show all data
- [ ] Resize browser window → Charts resize responsively
- [ ] Test on mobile viewport → Layout stacks vertically
- [ ] Check browser console → No errors or warnings

### Visual Tests
- [ ] Charts use EY color palette (yellow, black, gray)
- [ ] Card shadows and hover effects work
- [ ] Text is readable (sufficient contrast)
- [ ] Spacing is consistent (matches UX reference)
- [ ] Loading spinner displays before data loads
- [ ] Error message displays if mock fetch fails (simulate by throwing error)

### Data Tests
- [ ] SuccessRateChart shows correct transitions and percentages
- [ ] TimeToPromotionChart shows correct timeline progression
- [ ] SkillFrequencyChart shows top 10 skills sorted by frequency
- [ ] DepartmentDistributionChart shows all departments with correct proportions
- [ ] Metric cards calculate and display correct aggregated values

---

## Mock Data Example

Use this structure in `successPatternService.js`:

```javascript
// services/successPatternService.js
export const mockSuccessPatterns = {
  metrics: {
    avgTimeToPromotion: 2.5,
    overallSuccessRate: 0.68,
    totalSampleSize: 47,
    topSkills: ["Leadership", "Client Management", "Excel"],
  },
  successRateByTransition: [
    { transition: "Analyst → Sr. Analyst", successRate: 85, sampleSize: 120, color: "#22c55e" },
    { transition: "Sr. Analyst → Consultant", successRate: 72, sampleSize: 89, color: "#FFE600" },
    { transition: "Consultant → Sr. Consultant", successRate: 68, sampleSize: 47, color: "#FFE600" },
    { transition: "Consultant → Manager", successRate: 35, sampleSize: 31, color: "#dc2626" },
    { transition: "Manager → Sr. Manager", successRate: 45, sampleSize: 23, color: "#dc2626" },
  ],
  timeToPromotion: {
    Advisory: [
      { stage: "Analyst", avgYears: 0 },
      { stage: "Sr. Analyst", avgYears: 2.5 },
      { stage: "Consultant", avgYears: 5.2 },
      { stage: "Manager", avgYears: 8.7 },
    ],
    Tax: [
      { stage: "Analyst", avgYears: 0 },
      { stage: "Sr. Analyst", avgYears: 2.8 },
      { stage: "Consultant", avgYears: 5.8 },
      { stage: "Manager", avgYears: 9.2 },
    ],
    Consulting: [
      { stage: "Analyst", avgYears: 0 },
      { stage: "Sr. Analyst", avgYears: 2.3 },
      { stage: "Consultant", avgYears: 4.9 },
      { stage: "Manager", avgYears: 8.1 },
    ],
  },
  skillFrequency: [
    { skill: "Leadership", frequency: 92 },
    { skill: "Client Management", frequency: 87 },
    { skill: "Excel", frequency: 75 },
    { skill: "Problem Solving", frequency: 68 },
    { skill: "Project Management", frequency: 65 },
    { skill: "PowerPoint", frequency: 58 },
    { skill: "Communication", frequency: 55 },
    { skill: "Data Analysis", frequency: 47 },
    { skill: "Strategic Thinking", frequency: 42 },
    { skill: "Team Collaboration", frequency: 38 },
  ],
  departmentDistribution: [
    { name: "Advisory", value: 145, color: "#FFE600" },
    { name: "Tax", value: 98, color: "#2E2E38" },
    { name: "Consulting", value: 87, color: "#747480" },
    { name: "Audit", value: 56, color: "#C4C4CD" },
  ],
};

// Simulate async API call
export const getSuccessPatterns = async (filters = {}) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // In Step 3, replace with: return api.get('/api/patterns/...')

  // For now, return mock data (optionally filter locally)
  return mockSuccessPatterns;
};

export const getMetrics = async (filters = {}) => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return mockSuccessPatterns.metrics;
};
```

---

## Example Chart Component Code

### SuccessRateChart.jsx

```jsx
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function SuccessRateChart({ data }) {
  // Custom color based on success rate
  const getBarColor = (successRate) => {
    if (successRate >= 70) return '#22c55e'; // Green
    if (successRate >= 50) return '#FFE600'; // Yellow
    return '#dc2626'; // Red
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        Success Rate by Transition
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="transition" angle={-45} textAnchor="end" height={100} />
          <YAxis label={{ value: 'Success Rate (%)', angle: -90, position: 'insideLeft' }} />
          <Tooltip
            formatter={(value, name, props) => [`${value}%`, 'Success Rate']}
            labelFormatter={(label) => `Transition: ${label}`}
          />
          <Legend />
          <Bar dataKey="successRate" fill="#FFE600" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### TimeToPromotionChart.jsx

```jsx
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function TimeToPromotionChart({ data }) {
  // Transform data for multi-line chart
  const chartData = data.Advisory.map((item, index) => ({
    stage: item.stage,
    Advisory: item.avgYears,
    Tax: data.Tax[index]?.avgYears,
    Consulting: data.Consulting[index]?.avgYears,
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        Average Time to Promotion
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="stage" />
          <YAxis label={{ value: 'Years', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="Advisory" stroke="#FFE600" strokeWidth={2} />
          <Line type="monotone" dataKey="Tax" stroke="#2E2E38" strokeWidth={2} />
          <Line type="monotone" dataKey="Consulting" stroke="#747480" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

## Styling Guidelines (EY Branding)

```css
/* Color Palette */
--ey-yellow: #FFE600;
--ey-confident-black: #2E2E38;
--ey-gray-01: #747480;
--ey-gray-02: #C4C4CD;
--ey-off-white: #F6F6FA;
--success: #22c55e;
--warning: #f59e0b;
--caution: #dc2626;

/* Card Styling */
.chart-card {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  transition: box-shadow 0.3s;
}

.chart-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Metric Cards */
.metric-card {
  background: white;
  border: 2px solid transparent;
  border-radius: 0.5rem;
  padding: 1.5rem;
  text-align: center;
}

.metric-card:hover {
  border-color: var(--ey-yellow);
}
```

---

**When all tasks are complete, run the verification steps in `VERIFICATION.md`**
