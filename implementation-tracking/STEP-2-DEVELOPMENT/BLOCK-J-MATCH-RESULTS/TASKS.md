# BLOCK J: Match Results UI - TASKS

**Block:** BLOCK-J-MATCH-RESULTS
**Total Tasks:** 12
**Completed:** 0/12 (0%)

---

## Progress Tracker

### 1. Project Setup & Mock Data (2 tasks)
- [ ] **Task 1.1:** Create folder structure
  ```bash
  # Create component folders
  mkdir -p frontend/src/components/matches
  mkdir -p frontend/src/services
  ```
  - Files to create:
    - `components/matches/MatchResultsPage.jsx`
    - `components/matches/MatchCard.jsx`
    - `components/matches/SkillGapDisplay.jsx`
    - `components/matches/MatchFilters.jsx`
    - `components/matches/MatchModeToggle.jsx`
    - `components/matches/MatchSortDropdown.jsx`
    - `components/matches/EmptyMatchState.jsx`
    - `services/matchService.js`
    - `services/mockMatchData.js`

- [ ] **Task 1.2:** Create mock data file
  - File: `frontend/src/services/mockMatchData.js`
  - Create 3 arrays: `MOCK_MATCHES_BEST_FIT`, `MOCK_MATCHES_STRETCH`, `MOCK_MATCHES_EXPLORATORY`
  - Each array: 10-12 realistic match objects
  - Best Fit: 90-100% scores
  - Stretch: 70-85% scores
  - Exploratory: 50-70% scores
  - Include varied: departments, locations, skill gaps
  - **Tip:** Use ChatGPT to generate realistic job titles and skill combinations

### 2. Core Match Display Components (3 tasks)
- [ ] **Task 2.1:** Create MatchCard component
  - File: `frontend/src/components/matches/MatchCard.jsx`
  - Props: `match`, `onViewDetails`, `onSave`
  - Display:
    - Job title (large, bold)
    - Match score (percentage + visual ring/bar)
    - Service line + department
    - Location + posted date
    - Matched skills (green badges)
    - Skill gaps (orange badges)
    - LLM explanation (2-3 sentences)
    - Action buttons: "View Details", "Save Match"
  - Style with Tailwind: Card, rounded corners, shadow, hover effect
  - **Bonus:** Animate match score ring on mount

- [ ] **Task 2.2:** Create SkillGapDisplay component
  - File: `frontend/src/components/matches/SkillGapDisplay.jsx`
  - Props: `matched_skills`, `skill_gaps`, `skill_match_score`
  - Display:
    - Section: "Matched Skills (X/Y)" with green checkmarks
    - Section: "Skill Gaps (X/Y)" with orange warning icons
    - Visual: Skill tags with appropriate colors
    - Optional: Progress bar showing X/Y ratio
  - Reusable for both card and detail views

- [ ] **Task 2.3:** Create match score visualization
  - Option A: Use SVG circle progress ring (see UX reference)
  - Option B: Use CSS circular progress
  - Option C: Use simple percentage with colored bar
  - Display: Large percentage number + visual indicator
  - Color: EY yellow (#FFE600) for progress, gray for background
  - Animation: Animate from 0% to actual percentage on mount
  - **Tip:** Extract to reusable `ProgressRing.jsx` component

### 3. Match Mode Toggle & Filtering (3 tasks)
- [ ] **Task 3.1:** Create MatchModeToggle component
  - File: `frontend/src/components/matches/MatchModeToggle.jsx`
  - Three buttons: "Best Fit", "Stretch", "Exploratory"
  - State: `const [mode, setMode] = useState('best_fit')`
  - Visual: Active button highlighted (yellow background or border)
  - Display score ranges: "90%+", "70-85%", "50-70%"
  - On change: Call `onModeChange(mode)` to update parent
  - Style: Toggle button group (similar to tabs)

- [ ] **Task 3.2:** Create MatchFilters component
  - File: `frontend/src/components/matches/MatchFilters.jsx`
  - Filters:
    1. **Department dropdown:** Multi-select (Advisory, Assurance, Tax, Consulting)
    2. **Location dropdown:** Multi-select (New York, Remote, Chicago, etc.)
    3. **Min Score slider:** Range 0-100, default 70
    4. **Experience Level dropdown:** Multi-select (0-3 years, 3-5 years, 5-7 years, 7+ years)
  - State: `const [filters, setFilters] = useState({...})`
  - "Reset Filters" button to clear all
  - On change: Call `onFiltersChange(filters)` to update parent
  - Use Radix UI or Headless UI for accessible dropdowns

- [ ] **Task 3.3:** Create MatchSortDropdown component
  - File: `frontend/src/components/matches/MatchSortDropdown.jsx`
  - Sort options:
    - "Match Score (High to Low)" - default
    - "Match Score (Low to High)"
    - "Date Posted (Newest First)"
    - "Date Posted (Oldest First)"
  - State: `const [sortBy, setSortBy] = useState('score_desc')`
  - Dropdown with selected option displayed
  - On change: Call `onSortChange(sortBy)` to update parent

### 4. Main Page & Integration (2 tasks)
- [ ] **Task 4.1:** Create MatchResultsPage component
  - File: `frontend/src/components/matches/MatchResultsPage.jsx`
  - Layout:
    ```
    ┌─────────────────────────────────────┐
    │  <MatchModeToggle />                │
    ├─────────────────────────────────────┤
    │  <MatchFilters />                   │
    │  Sort: <MatchSortDropdown />        │
    ├─────────────────────────────────────┤
    │  Showing 12 matches                 │
    │                                     │
    │  <MatchCard />                      │
    │  <MatchCard />                      │
    │  ...                                │
    └─────────────────────────────────────┘
    ```
  - State:
    - `mode` (best_fit, stretch, exploratory)
    - `filters` (departments, locations, min_score)
    - `sortBy` (score_desc, date_desc, etc.)
    - `matches` (filtered and sorted from mock data)
  - Logic:
    - Load mock data based on `mode`
    - Filter matches based on `filters`
    - Sort matches based on `sortBy`
    - Display filtered/sorted matches
  - Handle empty state (no matches found)

- [ ] **Task 4.2:** Implement filtering and sorting logic
  - **Filter logic:**
    ```javascript
    const filteredMatches = matches.filter(match => {
      // Filter by departments
      if (filters.departments.length > 0 && !filters.departments.includes(match.department)) {
        return false;
      }
      // Filter by locations
      if (filters.locations.length > 0 && !filters.locations.includes(match.location)) {
        return false;
      }
      // Filter by min score
      if (match.overall_score < filters.min_score / 100) {
        return false;
      }
      return true;
    });
    ```
  - **Sort logic:**
    ```javascript
    const sortedMatches = [...filteredMatches].sort((a, b) => {
      if (sortBy === 'score_desc') return b.overall_score - a.overall_score;
      if (sortBy === 'score_asc') return a.overall_score - b.overall_score;
      if (sortBy === 'date_desc') return new Date(b.posted_date) - new Date(a.posted_date);
      if (sortBy === 'date_asc') return new Date(a.posted_date) - new Date(b.posted_date);
    });
    ```

### 5. UI Polish & States (2 tasks)
- [ ] **Task 5.1:** Create EmptyMatchState component
  - File: `frontend/src/components/matches/EmptyMatchState.jsx`
  - Display when no matches found (filters too restrictive)
  - Message: "No matches found. Try adjusting your filters."
  - Icon: Empty state illustration or icon
  - Button: "Reset Filters" to clear all filters
  - Style: Centered, friendly, helpful

- [ ] **Task 5.2:** Add loading states and pagination
  - Loading state: Show skeleton cards while loading (optional for mock data)
  - Pagination:
    - Display 10 matches per page
    - "Load More" button at bottom (or infinite scroll)
    - Show "Showing X of Y matches" count
  - Smooth transitions: Fade in/out when switching modes or filtering
  - **Bonus:** Use Framer Motion for smooth animations

### 6. Routing & Integration (1 task)
- [ ] **Task 6.1:** Add route to App.jsx and navigation
  - File: `frontend/src/App.jsx`
  - Add route: `<Route path="/matches" element={<MatchResultsPage />} />`
  - Ensure protected by `<ProtectedRoute>` wrapper (from Block H)
  - Test navigation from sidebar (Block H sidebar should have /matches link)
  - Verify page renders inside MainLayout

---

## Acceptance Criteria

✅ **Block J is complete when:**
1. Match Results page renders at `/matches` route
2. Three match modes (Best Fit, Stretch, Exploratory) display different mock data
3. Match cards show job title, score, skills, gaps, and explanation
4. Skill gap display clearly distinguishes matched vs. missing skills
5. Filters work: Department, Location, Min Score, Experience Level
6. Sort options work: By score (high/low), by date (newest/oldest)
7. Empty state displays when no matches found
8. Match score visualization is clear and animated (bonus)
9. Pagination handles 10+ matches smoothly
10. Styling matches EY branding (yellow, black, white)
11. Responsive layout works on desktop
12. All components accessible via keyboard navigation

---

## Files to Create/Modify

**New Files:**
- `frontend/src/components/matches/MatchResultsPage.jsx`
- `frontend/src/components/matches/MatchCard.jsx`
- `frontend/src/components/matches/SkillGapDisplay.jsx`
- `frontend/src/components/matches/MatchFilters.jsx`
- `frontend/src/components/matches/MatchModeToggle.jsx`
- `frontend/src/components/matches/MatchSortDropdown.jsx`
- `frontend/src/components/matches/EmptyMatchState.jsx`
- `frontend/src/components/common/ProgressRing.jsx` (optional)
- `frontend/src/components/common/SkillTag.jsx` (optional)
- `frontend/src/services/matchService.js`
- `frontend/src/services/mockMatchData.js`

**Modified Files:**
- `frontend/src/App.jsx` (add /matches route)

---

## Dependencies

**Blocked By:**
- STEP-1-SETUP: React app skeleton must exist
- Block H: Auth & Layout (renders inside MainLayout, uses sidebar navigation)

**Blocks This:**
- Block K: Career Visualization (match results can show career paths)
- Block L: Success Pattern UI (clicked match shows success patterns)
- Block O: Matching Integration (connects to real Block E backend - Step 3)

---

## Testing Checklist

- [ ] Manual test: Navigate to /matches from sidebar
- [ ] Manual test: Switch between Best Fit, Stretch, Exploratory modes
- [ ] Manual test: Apply filters (department, location, min score)
- [ ] Manual test: Sort by score (high to low, low to high)
- [ ] Manual test: Sort by date (newest first, oldest first)
- [ ] Manual test: Reset filters button clears all filters
- [ ] Manual test: Empty state displays when filters exclude all matches
- [ ] Manual test: "Load More" pagination (if implemented)
- [ ] Manual test: Match cards display all required information
- [ ] Manual test: Skill gap display shows matched vs. missing skills
- [ ] Manual test: Match score ring/bar animates on page load
- [ ] Browser console: No errors or warnings
- [ ] Accessibility: Keyboard navigation works (Tab through cards)
- [ ] Accessibility: Screen reader can read match scores and skills

---

## Mock Data Example

Use this structure for `mockMatchData.js`:

```javascript
export const MOCK_MATCHES_BEST_FIT = [
  {
    id: "match-bf-001",
    job_id: "job-001",
    job_title: "Data Engineer",
    service_line: "Advisory",
    department: "Technology Consulting",
    location: "New York, NY",
    posted_date: "2026-01-03",
    experience_required: "3-7 years",
    overall_score: 0.92,
    skill_match_score: 0.95,
    experience_score: 0.90,
    growth_potential_score: 0.30,
    matched_skills: ["Python", "AWS", "Data Analysis"],
    skill_gaps: ["SQL", "ETL"],
    explanation: "This role is an excellent fit for your Python and AWS expertise. Your data analysis background provides a strong foundation. You'll need to develop SQL and ETL skills, which are highly learnable.",
    salary_range: "$100k - $130k",
    job_posting_url: "https://careers.ey.com/jobs/data-engineer-001"
  },
  {
    id: "match-bf-002",
    job_title: "Cloud Solutions Architect",
    service_line: "Consulting",
    department: "Infrastructure Advisory",
    location: "Remote",
    posted_date: "2026-01-05",
    overall_score: 0.90,
    skill_match_score: 0.93,
    matched_skills: ["AWS", "Cloud Architecture", "Client Management"],
    skill_gaps: ["Azure", "GCP"],
    explanation: "Your AWS expertise and client management skills make you an ideal candidate. This role offers the chance to expand into multi-cloud environments with Azure and GCP.",
  },
  // ... 10 more matches
];

export const MOCK_MATCHES_STRETCH = [
  {
    id: "match-st-001",
    job_title: "Senior Data Scientist",
    service_line: "Consulting",
    department: "Analytics",
    location: "New York, NY",
    posted_date: "2026-01-02",
    overall_score: 0.78,
    skill_match_score: 0.75,
    matched_skills: ["Python", "Data Analysis"],
    skill_gaps: ["Machine Learning", "Statistics", "R"],
    explanation: "This is a stretch role that leverages your Python and data analysis skills while offering significant learning opportunities in ML and statistics. Perfect for career growth.",
  },
  // ... 10 more matches
];

export const MOCK_MATCHES_EXPLORATORY = [
  {
    id: "match-ex-001",
    job_title: "Product Manager - Data Products",
    service_line: "Consulting",
    department: "Product Strategy",
    location: "San Francisco, CA",
    posted_date: "2026-01-01",
    overall_score: 0.65,
    skill_match_score: 0.60,
    matched_skills: ["Data Analysis", "Client Management"],
    skill_gaps: ["Product Strategy", "Roadmapping", "Stakeholder Management"],
    explanation: "This exploratory path combines your data expertise with product management. Your client management skills translate well, and you'd gain valuable strategic leadership experience.",
  },
  // ... 10 more matches
];

export const MOCK_FILTER_OPTIONS = {
  departments: [
    "Technology Consulting",
    "Analytics",
    "Infrastructure Advisory",
    "Product Strategy",
    "Risk & Compliance",
    "Financial Reporting"
  ],
  locations: [
    "New York, NY",
    "Remote",
    "San Francisco, CA",
    "Chicago, IL",
    "Boston, MA"
  ],
  experience_levels: [
    "0-3 years",
    "3-5 years",
    "5-7 years",
    "7-10 years",
    "10+ years"
  ]
};
```

---

## Example Component Code

### MatchCard.jsx (starter)

```jsx
import React from 'react';

export function MatchCard({ match, onViewDetails, onSave }) {
  const scorePercentage = Math.round(match.overall_score * 100);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      {/* Header: Title + Score */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-gray-900">{match.job_title}</h3>
        <div className="text-3xl font-bold text-yellow-500">{scorePercentage}%</div>
      </div>

      {/* Metadata */}
      <div className="text-sm text-gray-600 mb-4">
        <p>{match.service_line} · {match.department}</p>
        <p>{match.location} · Posted {formatDate(match.posted_date)}</p>
      </div>

      {/* Skill Gap Display */}
      <div className="mb-4">
        <div className="mb-2">
          <span className="text-sm font-medium text-gray-700">Matched Skills:</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {match.matched_skills.map(skill => (
              <span key={skill} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                ✓ {skill}
              </span>
            ))}
          </div>
        </div>
        {match.skill_gaps.length > 0 && (
          <div>
            <span className="text-sm font-medium text-gray-700">Skill Gaps:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {match.skill_gaps.map(skill => (
                <span key={skill} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                  ⚠ {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Explanation */}
      <p className="text-sm text-gray-600 mb-4 italic">"{match.explanation}"</p>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => onViewDetails(match.id)}
          className="flex-1 px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 font-medium"
        >
          View Details
        </button>
        <button
          onClick={() => onSave(match.id)}
          className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:border-yellow-500"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  return `${diffDays} days ago`;
}
```

---

## Styling Guidelines (EY Branding)

```css
/* Color palette */
--ey-yellow: #FFE600;
--ey-yellow-dark: #E6CF00;
--ey-black: #2E2E38;
--ey-gray: #747480;
--ey-light-gray: #F6F6FA;
--success: #22C55E;
--warning: #F59E0B;

/* Match card */
.match-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.match-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* Match score */
.match-score {
  color: var(--ey-yellow);
  font-size: 36px;
  font-weight: 700;
}

/* Skill tags */
.skill-tag-matched {
  background: var(--success);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
}

.skill-tag-gap {
  background: var(--warning);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
}

/* Buttons */
.btn-primary {
  background: var(--ey-yellow);
  color: var(--ey-black);
  font-weight: 600;
}

.btn-primary:hover {
  background: var(--ey-yellow-dark);
}
```

---

**When all tasks are complete, run the verification steps in `VERIFICATION.md`**
