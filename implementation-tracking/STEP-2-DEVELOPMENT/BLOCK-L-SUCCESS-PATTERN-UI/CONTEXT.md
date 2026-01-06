# BLOCK L: Success Pattern UI - CONTEXT

**Block ID:** BLOCK-L-SUCCESS-PATTERN-UI
**Phase:** STEP-2-DEVELOPMENT
**Category:** #frontend #react #charts
**Estimated Time:** 2-3 days
**Dependencies:** None (requires STEP-1-SETUP complete)

---

## Purpose

Build the Success Pattern UI dashboard that displays career transition insights, success metrics, and data visualizations. This block creates:
- Interactive charts showing success patterns across roles
- Metric cards with key success indicators
- Filter controls for department, role level, and time periods
- Visual representations of transition success rates
- Time-to-promotion analysis
- Common skills associated with successful career moves

This UI provides employees with **data-driven insights** into successful career paths, helping them understand what skills and timelines are realistic for their desired transitions.

---

## What This Block Delivers

1. **Success Rate Charts** - Bar/column charts showing transition success rates by role
2. **Time-to-Promotion Visualization** - Line charts showing average promotion timelines
3. **Skill Frequency Charts** - Bar/pie charts showing most common skills in successful transitions
4. **Metric Cards** - Key statistics (avg time, success rate, sample size)
5. **Filter Controls** - Department, role level, time period filters
6. **Comparison Views** - Compare multiple career paths side-by-side

---

## Key Concepts

### Success Pattern Metrics

A success pattern displays:
- **Transition Path:** Consultant → Senior Consultant
- **Success Rate:** 68% (% of employees who successfully made this transition)
- **Average Time:** 2.5 years (median time between roles)
- **Sample Size:** 47 employees (confidence in data)
- **Common Skills:** Client Management, Problem Solving, Excel, PowerPoint
- **Recommended Skills:** Leadership, Project Management (skills successful transitioners had)

### Chart Types to Implement

1. **Bar Chart (Success Rate by Transition)**
   - X-axis: Role transitions (e.g., "Analyst → Sr. Analyst")
   - Y-axis: Success rate (0-100%)
   - Color: Green (high success), Yellow (medium), Red (low)

2. **Line Chart (Time-to-Promotion)**
   - X-axis: Career path stages
   - Y-axis: Years
   - Multiple lines for different departments

3. **Bar Chart (Skill Frequency)**
   - X-axis: Skills
   - Y-axis: Frequency (% of successful transitions with this skill)
   - Top 10 skills shown

4. **Pie/Donut Chart (Department Distribution)**
   - Slices: Different departments
   - Shows where successful transitions most commonly occur

---

## Technical Approach

### Tech Stack
- **React 18** with functional components and hooks
- **Recharts** for data visualization (lightweight, React-friendly)
- **Tailwind CSS** for styling
- **React Router v6** for navigation (already set up in Block H)

### Recharts Library
Recharts is a composable charting library built on React components:
```jsx
<BarChart data={data} width={600} height={300}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Bar dataKey="successRate" fill="#FFE600" />
</BarChart>
```

### Folder Structure
```
frontend/src/
├── components/
│   ├── successPatterns/
│   │   ├── SuccessPatternPage.jsx        (Main page container)
│   │   ├── MetricCards.jsx               (Key stats cards)
│   │   ├── SuccessRateChart.jsx          (Bar chart component)
│   │   ├── TimeToPromotionChart.jsx      (Line chart component)
│   │   ├── SkillFrequencyChart.jsx       (Bar chart component)
│   │   ├── DepartmentDistributionChart.jsx (Pie chart component)
│   │   ├── FilterControls.jsx            (Department, role, date filters)
│   │   └── ComparisonView.jsx            (Side-by-side path comparison)
│   └── layout/
│       └── MainLayout.jsx                (From Block H)
└── services/
    └── successPatternService.js          (API calls - mocked for now)
```

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│  SuccessPatternPage (Main Container)                    │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ FilterControls                                     │ │
│  │ [Department ▼] [Role Level ▼] [Time Period ▼]     │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ MetricCards                                        │ │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐           │ │
│  │ │Avg Time  │ │ Success  │ │ Sample   │           │ │
│  │ │2.5 years │ │  Rate 68%│ │ Size: 47 │           │ │
│  │ └──────────┘ └──────────┘ └──────────┘           │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────┐  ┌─────────────────────────┐   │
│  │ SuccessRateChart   │  │ TimeToPromotionChart    │   │
│  │ (Bar Chart)        │  │ (Line Chart)            │   │
│  └────────────────────┘  └─────────────────────────┘   │
│                                                          │
│  ┌────────────────────┐  ┌─────────────────────────┐   │
│  │ SkillFrequencyChart│  │ DepartmentDistribution  │   │
│  │ (Bar Chart)        │  │ (Pie Chart)             │   │
│  └────────────────────┘  └─────────────────────────┘   │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ ComparisonView (Optional)                          │ │
│  │ Compare: Consultant→Manager vs Consultant→Director│ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Chart Specifications

### 1. Success Rate Chart (Bar Chart)
**Data Format:**
```javascript
const successRateData = [
  { transition: "Analyst → Sr. Analyst", successRate: 85, sampleSize: 120 },
  { transition: "Consultant → Sr. Consultant", successRate: 68, sampleSize: 47 },
  { transition: "Manager → Sr. Manager", successRate: 45, sampleSize: 23 },
];
```

**Features:**
- Hover tooltip showing exact percentage and sample size
- Color gradient based on success rate (green > 70%, yellow 50-70%, red < 50%)
- Click to drill down into specific transition details
- Sorted by success rate (highest to lowest)

### 2. Time-to-Promotion Chart (Line Chart)
**Data Format:**
```javascript
const timeData = [
  { stage: "Analyst", avgYears: 0 },
  { stage: "Sr. Analyst", avgYears: 2.5 },
  { stage: "Consultant", avgYears: 5.2 },
  { stage: "Manager", avgYears: 8.7 },
];
```

**Features:**
- Multiple lines for different departments (Advisory, Tax, Consulting)
- Shaded area showing variance/range
- Markers at each data point
- Legend with department colors

### 3. Skill Frequency Chart (Horizontal Bar Chart)
**Data Format:**
```javascript
const skillData = [
  { skill: "Leadership", frequency: 92, color: "#FFE600" },
  { skill: "Client Management", frequency: 87, color: "#FFE600" },
  { skill: "Excel", frequency: 75, color: "#FFE600" },
  { skill: "Problem Solving", frequency: 68, color: "#FFE600" },
];
```

**Features:**
- Top 10 skills only (avoid clutter)
- Sorted by frequency (highest to lowest)
- Percentage labels on bars
- Tooltip with additional context (e.g., "Required for 87% of successful transitions")

### 4. Department Distribution Chart (Pie/Donut Chart)
**Data Format:**
```javascript
const departmentData = [
  { name: "Advisory", value: 145, color: "#FFE600" },
  { name: "Tax", value: 98, color: "#2E2E38" },
  { name: "Consulting", value: 87, color: "#C4C4CD" },
  { name: "Audit", value: 56, color: "#747480" },
];
```

**Features:**
- Donut chart with center label showing total
- Hover to see department name, count, percentage
- Click to filter all charts by department

---

## Mock Data for Testing

For this block, use comprehensive mock data to demonstrate charts:

```javascript
// services/successPatternService.js (mock implementation)
export const mockSuccessPatterns = {
  metrics: {
    avgTimeToPromotion: 2.5,
    overallSuccessRate: 0.68,
    totalSampleSize: 47,
    topSkills: ["Leadership", "Client Management", "Excel"],
  },
  successRateByTransition: [
    { transition: "Analyst → Sr. Analyst", successRate: 85, sampleSize: 120 },
    { transition: "Sr. Analyst → Consultant", successRate: 72, sampleSize: 89 },
    { transition: "Consultant → Sr. Consultant", successRate: 68, sampleSize: 47 },
    { transition: "Consultant → Manager", successRate: 35, sampleSize: 31 },
    { transition: "Manager → Sr. Manager", successRate: 45, sampleSize: 23 },
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
  ],
  departmentDistribution: [
    { name: "Advisory", value: 145 },
    { name: "Tax", value: 98 },
    { name: "Consulting", value: 87 },
    { name: "Audit", value: 56 },
  ],
};
```

---

## Design Reference

See `_bmad-output/ux-unified-dashboard-v2-with-enhanced-roadmap.html` for:
- Success pattern card styling (line 441-461)
- Comparison bars visual pattern (line 5207)
- EY branding colors (yellow #FFE600, black #2E2E38)
- Card layout and spacing patterns
- Professional, data-driven aesthetic

**Key Design Elements:**
- Clean white cards with subtle shadows
- EY yellow (#FFE600) as primary accent color
- Dark gray (#2E2E38) for text
- Generous spacing between charts
- Responsive grid layout (2 columns on desktop, 1 on mobile)

---

## Integration Points

**Feeds Into:**
- **Block P (Visualization Integration):** Connects to Block F (Success Pattern Analysis) in Step 3
- **Block K (Career Visualization):** Success patterns inform career path nodes

**Depends On:**
- **Block H (Auth & Layout):** Renders inside MainLayout
- **Block F (Success Pattern Analysis):** Provides real data in Step 3

**Uses Data From (in Step 3):**
- **Block F API Endpoints:**
  - `GET /api/patterns/role/{role_name}` - Success patterns for a role
  - `GET /api/patterns/transition/{source}/{target}` - Specific transition data
  - `GET /api/patterns/metrics/summary` - Overall metrics

---

## Filter Implementation

### Filter Controls
```jsx
<FilterControls>
  <Select name="department" options={["All", "Advisory", "Tax", "Consulting"]} />
  <Select name="roleLevel" options={["All", "Analyst", "Consultant", "Manager"]} />
  <Select name="timePeriod" options={["Last 5 years", "Last 10 years", "All time"]} />
  <Button onClick={applyFilters}>Apply Filters</Button>
</FilterControls>
```

### Filter Logic
When filters change:
1. Update URL query params (e.g., `?dept=Advisory&level=Consultant`)
2. Re-fetch data from API (or filter mock data locally)
3. Update all charts with filtered data
4. Show "Filtered by: Advisory, Consultant" indicator
5. Add "Clear Filters" button when filters are active

---

## Responsive Design

### Desktop (>1024px)
- 2x2 grid of charts
- Metric cards in a row (3 cards)
- Full-width filter controls at top

### Tablet (768px-1024px)
- 2x2 grid of charts (slightly smaller)
- Metric cards in a row (may wrap to 2 rows)

### Mobile (<768px)
- Single column layout
- Charts stack vertically
- Metric cards stack vertically
- Filter controls collapse to expandable panel

---

## Accessibility

- All charts have descriptive `aria-label` attributes
- Color is not the only indicator (use patterns/labels)
- Keyboard navigation for interactive elements
- High contrast mode support
- Screen reader-friendly tooltips
- Focus indicators on clickable chart elements

---

## Success Criteria

✅ Block L is complete when:
1. All four chart types render with mock data (Success Rate, Time-to-Promotion, Skill Frequency, Department Distribution)
2. Metric cards display key statistics correctly
3. Filter controls update charts when changed
4. Charts are interactive (hover tooltips, click events)
5. Responsive layout works on desktop, tablet, mobile
6. Styling matches EY branding (yellow/black color scheme)
7. Charts use Recharts library components
8. Page is accessible via `/success-patterns` route (already defined in Block H)
9. Loading states display while fetching data (even with mock data)
10. Error handling for failed data fetches
11. No console errors or warnings

---

## References

- **UX Design:** `_bmad-output/ux-unified-dashboard-v2-with-enhanced-roadmap.html` (line 441-461, 5203-5210)
- **Recharts Documentation:** https://recharts.org/
- **Success Pattern Data Source:** Block F (Success Pattern Analysis) - will connect in Step 3 Block P
- **Layout Component:** Block H (MainLayout with sidebar navigation)

---

## Notes

- Start with simple bar/line charts, add sophistication later
- Use Recharts' ResponsiveContainer for all charts (handles resizing)
- Mock data should be realistic and comprehensive (demonstrate all features)
- Consider adding export to PNG/CSV functionality (bonus)
- Chart colors should follow EY branding (primary: #FFE600, secondary: #2E2E38)
- Add "Learn More" tooltips explaining what each metric means
- Consider adding a "How to Read This Chart" help icon

---

**Next Steps:** See `TASKS.md` for implementation tasks
