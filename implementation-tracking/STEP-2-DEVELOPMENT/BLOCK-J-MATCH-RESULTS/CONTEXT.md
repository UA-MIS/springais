# BLOCK J: Match Results UI - CONTEXT

**Block ID:** BLOCK-J-MATCH-RESULTS
**Phase:** STEP-2-DEVELOPMENT
**Category:** #frontend #react #ui
**Estimated Time:** 2-3 days
**Dependencies:** None (requires STEP-1-SETUP complete)

---

## Purpose

Build the Match Results interface that displays job matches for employees with similarity scores, skill gap analysis, and filtering options. This block creates:
- Match cards showing job opportunities with match percentages
- Skill gap visualization (what skills are missing)
- Filter controls (department, location, minimum match score)
- Sort options (by score, by date posted)
- Three view modes (Best Fit, Stretch, Exploratory)

This UI is the **primary value delivery interface** - where users discover career opportunities they didn't know existed.

---

## What This Block Delivers

1. **Match Cards** - Visual cards showing job title, match score, skill gaps, and quick actions
2. **Skill Gap Display** - Visual breakdown of matching vs. missing skills
3. **Filter Controls** - Department, location, minimum score, experience level
4. **Sort Options** - By match score (high to low), by date posted (newest first)
5. **Match Mode Toggle** - Switch between Best Fit (90%+), Stretch (70-85%), Exploratory (50-70%)
6. **Pagination** - Handle 10+ matches per mode without overwhelming UI
7. **Empty States** - Helpful messages when no matches found

---

## Key Concepts

### Three Match Modes (Block E Integration)

The UI displays different matches based on user's selected mode:

```
┌─────────────────────────────────────────────┐
│  [Best Fit] [Stretch] [Exploratory]         │  ← Mode selector
├─────────────────────────────────────────────┤
│  Filters: [Department ▼] [Location ▼]       │
│          [Min Score: 70%]                    │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐   │
│  │ Data Engineer                  92%  │   │  ← Match card
│  │ Advisory · New York             ⭐⭐⭐ │   │
│  │ Skills: Python ✓ AWS ✓ SQL (gap) │   │
│  │ [View Details] [Save]             │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ Senior Data Scientist          78%  │   │
│  │ Consulting · Remote            ⭐⭐   │
│  │ Skills: Python ✓ ML (gap) Stats (gap)│
│  │ [View Details] [Save]             │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**Mode characteristics:**
- **Best Fit:** 90-100% matches, conservative, "jobs I'm qualified for now"
- **Stretch:** 70-85% matches, growth-oriented, "jobs I can grow into"
- **Exploratory:** 50-70% matches, discovery-focused, "paths I haven't considered"

---

## Technical Approach

### Tech Stack
- **React 18** with functional components and hooks
- **Tailwind CSS** for styling
- **React Query** for data fetching and caching
- **Axios** for API calls
- **Radix UI** or **Headless UI** for accessible components (dropdowns, modals)
- **Framer Motion** for smooth transitions (optional)

### Folder Structure
```
frontend/src/
├── components/
│   ├── matches/
│   │   ├── MatchResultsPage.jsx       # Main page
│   │   ├── MatchCard.jsx              # Individual match card
│   │   ├── SkillGapDisplay.jsx        # Skill gap visualization
│   │   ├── MatchFilters.jsx           # Filter controls
│   │   ├── MatchModeToggle.jsx        # Best Fit/Stretch/Exploratory
│   │   ├── MatchSortDropdown.jsx      # Sort options
│   │   └── EmptyMatchState.jsx        # No results found
│   └── common/
│       ├── SkillTag.jsx               # Reusable skill badge
│       └── ProgressRing.jsx           # Match score ring
└── services/
    └── matchService.js                # API calls for matches
```

---

## Match Data Structure (Mock for This Block)

### Mock API Response
```javascript
// GET /api/matches?mode=best_fit&user_id=123
{
  "mode": "best_fit",
  "matches": [
    {
      "id": "match-001",
      "job_id": "job-001",
      "job_title": "Data Engineer",
      "service_line": "Advisory",
      "department": "Technology Consulting",
      "location": "New York, NY",
      "posted_date": "2026-01-03",
      "experience_required": "3-7 years",
      "overall_score": 0.92,          // 92% match
      "skill_match_score": 0.95,      // 95% skill match
      "experience_score": 0.90,       // 90% experience match
      "growth_potential_score": 0.30, // 30% growth potential
      "matched_skills": ["Python", "AWS", "Data Analysis"],
      "skill_gaps": ["SQL", "ETL"],
      "explanation": "This role is an excellent fit for your Python and AWS expertise. You'll need to develop SQL and ETL skills, which are highly learnable given your data analysis background.",
      "salary_range": "$100k - $130k",
      "job_posting_url": "https://careers.ey.com/jobs/data-engineer-001"
    },
    // ... more matches
  ],
  "total_matches": 12,
  "filters_applied": {
    "min_score": 0.70,
    "departments": [],
    "locations": []
  }
}
```

### Mock Data File for Development
```javascript
// services/mockMatchData.js
export const MOCK_MATCHES = {
  best_fit: [
    { /* 10-12 matches with 90-100% scores */ },
  ],
  stretch: [
    { /* 10-12 matches with 70-85% scores */ },
  ],
  exploratory: [
    { /* 10-12 matches with 50-70% scores */ },
  ]
};
```

---

## Component Specifications

### 1. MatchCard Component

**Visual Design:**
```
┌─────────────────────────────────────────────┐
│  Data Engineer                         92%   │  ← Title + Score
│  [Match Score Ring]                          │  ← Visual score
│                                              │
│  Advisory · Technology Consulting           │  ← Service line + dept
│  New York, NY · Posted 3 days ago          │  ← Location + date
│                                              │
│  Skill Match:                               │
│  ✓ Python  ✓ AWS  ✓ Data Analysis          │  ← Matched skills
│  ⚠ SQL (gap)  ⚠ ETL (gap)                   │  ← Skill gaps
│                                              │
│  "Excellent fit for your Python and AWS..." │  ← LLM explanation
│                                              │
│  [View Details]  [Save Match]               │  ← Actions
└─────────────────────────────────────────────┘
```

**Props:**
```typescript
interface MatchCardProps {
  match: {
    id: string;
    job_title: string;
    service_line: string;
    department: string;
    location: string;
    posted_date: string;
    overall_score: number;
    matched_skills: string[];
    skill_gaps: string[];
    explanation: string;
  };
  onViewDetails: (matchId: string) => void;
  onSave: (matchId: string) => void;
}
```

---

### 2. SkillGapDisplay Component

**Visual Design:**
```
Skills Match Breakdown:

Matched Skills (3/5):
[✓ Python]  [✓ AWS]  [✓ Data Analysis]

Skill Gaps (2/5):
[⚠ SQL]  [⚠ ETL]

Match Score: 60%  (3 of 5 required skills)
```

**Props:**
```typescript
interface SkillGapDisplayProps {
  matched_skills: string[];
  skill_gaps: string[];
  skill_match_score: number;
}
```

---

### 3. MatchFilters Component

**Visual Design:**
```
┌────────────────────────────────────────────┐
│  Filters:                                  │
│  [Department ▼]  [Location ▼]  [Reset]    │
│  Min Match Score: [70] ──●────────── 100   │  ← Slider
└────────────────────────────────────────────┘
```

**State:**
```typescript
interface FilterState {
  departments: string[];        // ["Advisory", "Assurance"]
  locations: string[];          // ["New York, NY", "Remote"]
  min_score: number;            // 70 (0-100 scale)
  experience_level: string[];   // ["3-5 years", "5-7 years"]
}
```

---

### 4. MatchModeToggle Component

**Visual Design:**
```
┌────────────────────────────────────────────┐
│  [Best Fit]  [Stretch]  [Exploratory]     │  ← Toggle buttons
│   ⭐⭐⭐      ⭐⭐       ⭐                    │  ← Visual indicator
│   90%+       70-85%    50-70%              │  ← Score range
└────────────────────────────────────────────┘
```

**State:**
```typescript
type MatchMode = "best_fit" | "stretch" | "exploratory";
```

---

## Integration Points

**Feeds Into:**
- **Block K (Career Visualization):** Match results can be visualized as career paths
- **Block L (Success Pattern UI):** Clicked match shows success patterns for that role
- **Block O (Matching Integration - Step 3):** Connect to real matching engine from Block E

**Depends On:**
- **Block E (Matching Engine):** Provides match scores and explanations (Step 3 integration)
- **Block H (Auth & Layout):** Renders inside MainLayout
- **STEP-1-SETUP:** React app skeleton

**For this block (Step 2):**
- Uses **mock data** (no backend dependency)
- Block O (Step 3) will connect this UI to Block E backend

---

## Mock Data for Testing

For independent development, create mock matches:

```javascript
// services/mockMatchData.js
export const MOCK_USER_PROFILE = {
  id: "user-001",
  name: "John Doe",
  current_role: "Senior Consultant",
  skills: ["Python", "AWS", "Data Analysis", "Client Management"]
};

export const MOCK_MATCHES_BEST_FIT = [
  {
    id: "match-001",
    job_title: "Data Engineer",
    service_line: "Advisory",
    department: "Technology Consulting",
    location: "New York, NY",
    posted_date: "2026-01-03",
    overall_score: 0.92,
    skill_match_score: 0.95,
    matched_skills: ["Python", "AWS", "Data Analysis"],
    skill_gaps: ["SQL", "ETL"],
    explanation: "Excellent fit for your Python and AWS expertise..."
  },
  // ... 10-12 more matches
];

export const MOCK_MATCHES_STRETCH = [
  // 10-12 matches with 70-85% scores
];

export const MOCK_MATCHES_EXPLORATORY = [
  // 10-12 matches with 50-70% scores
];
```

---

## Design Reference

See `_bmad-output/ux-unified-dashboard-v2-with-enhanced-roadmap.html` for:
- **Match score ring visualization** (line 209-260: `.match-ring` styles)
- **Color scheme:** EY yellow (#FFE600), black (#2E2E38), white (#FFFFFF)
- **Card styling:** Rounded corners, subtle shadows, clean spacing
- **Skill tags:** Small badges with appropriate colors

**Key design elements from reference:**
```css
/* Match Score Ring */
.match-ring {
  width: 120px;
  height: 120px;
  position: relative;
}

.match-ring svg {
  stroke: #FFE600;  /* EY yellow for progress */
  stroke-width: 10;
  stroke-linecap: round;
}

/* Match percentage in center */
.match-value .number {
  font-size: 36px;
  font-weight: 700;
  color: #2E2E38;
}

/* Skill tags */
.skill-tag {
  background: #F5F5F5;
  color: #2E2E38;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
}

.skill-tag.matched {
  background: #22C55E;  /* Green for matched */
  color: white;
}

.skill-tag.gap {
  background: #F59E0B;  /* Orange for gaps */
  color: white;
}
```

---

## User Experience Flow

### Scenario: User discovers new opportunities

1. **User navigates to /matches** from sidebar
2. **Default view:** Best Fit matches (90%+ score)
3. **User sees 12 match cards** sorted by score (highest first)
4. **User clicks "Stretch"** toggle → sees different matches (70-85%)
5. **User applies filters:**
   - Department: "Technology Consulting"
   - Location: "Remote"
   - Min score: 75%
6. **Results update:** Now showing 5 matches
7. **User clicks "View Details"** on top match
8. **Details modal opens** (or navigation to detail page)
9. **User clicks "Save Match"** → saved for later review

---

## Accessibility Considerations

- **Keyboard navigation:** Tab through cards, Enter to open details
- **Screen reader support:** ARIA labels for match scores, skill gaps
- **Color contrast:** Ensure text readable against backgrounds
- **Focus indicators:** Clear visual focus for keyboard users
- **Alt text:** Images and icons have descriptive alt text

---

## Performance Considerations

- **Pagination:** Load 10 matches at a time (lazy load more on scroll)
- **Virtual scrolling:** If 50+ matches, use react-window or react-virtualized
- **Image optimization:** Lazy load company logos
- **Debounced filters:** Wait 300ms after filter change before re-fetching
- **Cached results:** React Query caches match results per mode

---

## Success Criteria

✅ Block J is complete when:
1. Match cards display with score, skills, gaps, and explanation
2. Three match modes (Best Fit, Stretch, Exploratory) show different results
3. Filters work (department, location, min score)
4. Sort options work (by score, by date)
5. Skill gap visualization clearly shows matched vs. missing skills
6. Match score ring animates smoothly (visual polish)
7. Pagination handles 10+ matches without performance issues
8. Empty states display when no matches found
9. Styling matches EY branding (yellow, black, white)
10. Responsive layout works on desktop (mobile bonus)
11. All interactions accessible via keyboard

---

## References

- **UX Design:** `_bmad-output/ux-unified-dashboard-v2-with-enhanced-roadmap.html`
- **Match Data Structure:** See Block E (Matching Engine) CONTEXT.md
- **API Endpoints:** To be connected in Block O (Step 3 Integration)
- **React Query Docs:** https://tanstack.com/query/latest
- **Radix UI Docs:** https://www.radix-ui.com/

---

## Notes

- For demo, use mock data with realistic match scores (90-100%, 70-85%, 50-70%)
- Match explanations should be 2-3 sentences (concise but informative)
- Consider adding "Why this match?" tooltip for each score component
- Skill gaps should be actionable (link to learning resources in future)
- Real match data connects in Step 3 Block O (Matching Integration)

---

**Next Steps:** See `TASKS.md` for implementation tasks
