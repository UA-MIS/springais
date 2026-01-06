# BLOCK I: Skills Dashboard UI - CONTEXT

**Block ID:** BLOCK-I-SKILLS-DASHBOARD
**Phase:** STEP-2-DEVELOPMENT
**Category:** #frontend #react #dashboard
**Estimated Time:** 3-4 days
**Dependencies:** BLOCK-H (Auth & Layout)

---

## AI Quick Start Prompt

```
You are working on BLOCK-I: Skills Dashboard UI for SpringAIS.

Goal: Build a comprehensive skills management dashboard that displays employee skills, enables resume uploads, supports skill extraction, and provides skill editing capabilities.

Key constraints:
- Renders inside MainLayout from Block H
- Uses mock data for this block (real data integration in Step 3 Block N)
- Must match EY branding (yellow/black color scheme)
- Fully responsive design (mobile, tablet, desktop)
- References ux-unified-dashboard-v2-with-enhanced-roadmap.html for design patterns

Read TASKS.md for step-by-step implementation checklist.
Read VERIFICATION.md for UI testing and verification steps.
```

---

## Purpose

Create an interactive skills portfolio dashboard where employees can view, manage, and grow their professional skills. This is the **primary interface** where users interact with their career data.

**Why this matters:**
- Skills are the foundation of career matching and progression
- Visual presentation helps users understand their strengths and gaps
- Resume upload with AI extraction reduces manual data entry by 80%
- Categorized skill display makes it easy to identify areas for growth
- Progress tracking motivates continuous learning

**Success outcome:**
- Users can see all their skills organized by category at a glance
- Resume upload extracts skills automatically (saves 30+ minutes of manual entry)
- Skill editing is intuitive and quick
- Dashboard is visually appealing and matches EY branding
- Responsive design works on all devices (desktop, tablet, mobile)

---

## What This Block Delivers

### 1. Skills Portfolio View
**Primary display of all employee skills organized by category**

Features:
- **Skill Categories:** Group skills by domain (Cloud, Leadership, Data, etc.)
- **Skill Cards:** Individual skill items with progress rings, completion status
- **Category Progress:** Visual progress bars showing category-level completion
- **Skill Badges:** Visual indicators (Active, Complete, Recommended)
- **Filter Tabs:** All Skills, In Progress, Recommended

Visual Elements:
```
┌─────────────────────────────────────────────────────┐
│ Skills Portfolio                    [All] [Active] [Rec] │
├─────────────────────────────────────────────────────┤
│ ☁️ Cloud & Infrastructure (6 skills) ━━━━━━━━░░ 85%    │
│   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │
│   │ ⭕ 75% │ │ ⭕100%│ │ ⭕ 45% │ │ ⭕100%│        │
│   │  AWS   │ │AWS CP │ │K8s     │ │Docker  │        │
│   │  SA    │ │       │ │        │ │        │        │
│   │ Active │ │Complete│ │ Active │ │Complete│        │
│   └────────┘ └────────┘ └────────┘ └────────┘        │
│                                                         │
│ 👥 Leadership & Management (5 skills) ━━━░░░░░░ 45%    │
│   [Skill cards...]                                      │
└─────────────────────────────────────────────────────┘
```

### 2. Resume Upload & Skill Extraction
**AI-powered skill extraction from uploaded resumes**

Features:
- **Drag-and-drop upload area:** Accept PDF, DOCX, TXT files
- **Upload status:** Loading states, success/error messages
- **Skill Preview:** Show extracted skills before adding to profile
- **Skill Confirmation:** Users can review and edit extracted skills
- **Extraction Status:** Progress indicator during AI processing

Upload Flow:
```
1. User drops resume file
2. File uploads to backend
3. Loading state: "Extracting skills..."
4. Preview modal shows extracted skills
5. User confirms/edits skills
6. Skills added to profile
```

### 3. Skill Detail Modal
**Detailed view of individual skills with edit capabilities**

Features:
- **Skill Information:** Name, category, proficiency level, completion %
- **Progress History:** Timeline of skill development
- **Related Certifications:** Associated credentials
- **Learning Resources:** Recommended courses, materials
- **Edit Mode:** Update proficiency, add notes, change category

Modal Structure:
```
┌──────────────────────────────────────────┐
│ AWS Solutions Architect         [Edit] [×]│
├──────────────────────────────────────────┤
│ Category: Cloud & Infrastructure          │
│ Progress: ⭕ 75%  (6 of 8 modules)        │
│                                            │
│ ┌─────────────────────────────────────┐  │
│ │ Timeline:                            │  │
│ │ • Started: Jan 2024                  │  │
│ │ • Module 1-4: Completed Feb 2024     │  │
│ │ • Module 5-6: Completed Mar 2024     │  │
│ │ • Module 7-8: In Progress            │  │
│ └─────────────────────────────────────┘  │
│                                            │
│ [Update Progress] [Mark Complete]         │
└──────────────────────────────────────────┘
```

### 4. Skill Search & Filters
**Quick access to specific skills**

Features:
- **Search Bar:** Filter skills by name, keyword
- **Category Filter:** Show only specific categories
- **Status Filter:** All, Active, Complete, Recommended
- **Sort Options:** Alphabetical, Progress, Recently Updated

### 5. Add New Skill
**Manual skill entry for skills not extracted from resume**

Features:
- **Skill Name Input:** Text field with autocomplete
- **Category Selection:** Dropdown of skill categories
- **Proficiency Level:** Beginner, Intermediate, Advanced, Expert
- **Notes Field:** Optional description or context
- **Save Button:** Add skill to profile

---

## Technical Approach

### Tech Stack
- **React 18:** Functional components with hooks
- **Tailwind CSS:** Utility-first styling (EY branding colors)
- **React Hook Form:** Form handling and validation
- **React Dropzone:** File upload component
- **Framer Motion:** Animations (optional, for polish)
- **Axios:** API calls for skill data

### Component Structure
```
frontend/src/components/skills/
├── SkillsDashboard.jsx          # Main container
├── SkillsPortfolio.jsx          # Portfolio grid view
├── SkillCategory.jsx            # Category section
├── SkillCard.jsx                # Individual skill item
├── SkillDetailModal.jsx         # Skill detail/edit modal
├── ResumeUpload.jsx             # Upload component
├── SkillExtractionPreview.jsx   # Preview extracted skills
├── SkillSearchBar.jsx           # Search and filters
├── AddSkillModal.jsx            # Add new skill form
└── SkillProgressRing.jsx        # Circular progress indicator
```

### State Management
```javascript
// Using React Context or component state
const [skills, setSkills] = useState(MOCK_SKILLS);
const [selectedCategory, setSelectedCategory] = useState('all');
const [searchQuery, setSearchQuery] = useState('');
const [filterTab, setFilterTab] = useState('all'); // all, active, recommended
const [selectedSkill, setSelectedSkill] = useState(null); // for modal
const [isUploading, setIsUploading] = useState(false);
```

---

## Design Reference: UX File Analysis

### From `ux-unified-dashboard-v2-with-enhanced-roadmap.html`

**Key Design Elements:**

1. **Skill Cards (Lines 5279-5365):**
   - Circular progress rings (SVG-based)
   - Skill name, metadata (modules completed, certification date)
   - Badge indicators (Active, Complete)
   - Click to open detail modal

2. **Skill Categories (Lines 5265-5277):**
   - Category header with emoji icon
   - Skill count (e.g., "6 skills")
   - Progress bar showing category completion
   - Percentage display (e.g., "85%")

3. **Skills Grid (Line 5278):**
   - Responsive grid layout (auto-fit, min-width)
   - Consistent spacing between items
   - Hover effects for interactivity

4. **Color Scheme:**
   - EY Yellow: `#ffe600` (primary accent)
   - EY Black: `#2e2e38` (text, backgrounds)
   - EY Off-White: `#f6f6fa` (backgrounds)
   - EY Gray: `#c4c4cd`, `#747480` (secondary elements)
   - Success: `#22c55e` (complete badges)
   - Warning: `#f59e0b` (in-progress indicators)

5. **Typography:**
   - Font: Inter (primary), Cinzel (adventure mode headings)
   - Sizes: 11-16px for most UI, larger for titles

---

## Mock Data Structure

### Mock Skills Data
```javascript
// mocks/mockSkills.js
export const MOCK_SKILLS = [
  {
    id: "skill-001",
    name: "AWS Solutions Architect",
    category: "cloud_infrastructure",
    proficiency: 75,
    status: "active", // active, complete, recommended
    progress: {
      current: 6,
      total: 8,
      unit: "modules"
    },
    lastUpdated: "2024-03-15",
    certifications: ["AWS SAA-C03"],
    notes: "Currently preparing for certification exam"
  },
  {
    id: "skill-002",
    name: "AWS Cloud Practitioner",
    category: "cloud_infrastructure",
    proficiency: 100,
    status: "complete",
    progress: {
      current: 1,
      total: 1,
      unit: "certification"
    },
    completedDate: "2023-12-15",
    certifications: ["AWS CP"],
    notes: "Certified December 2023"
  },
  // ... more skills
];

export const SKILL_CATEGORIES = [
  {
    id: "cloud_infrastructure",
    name: "Cloud & Infrastructure",
    emoji: "☁️",
    skillCount: 6,
    completionPercent: 85
  },
  {
    id: "leadership_management",
    name: "Leadership & Management",
    emoji: "👥",
    skillCount: 5,
    completionPercent: 45
  },
  {
    id: "data_analytics",
    name: "Data & Analytics",
    emoji: "📊",
    skillCount: 4,
    completionPercent: 70
  },
  // ... more categories
];
```

### Mock Resume Upload Response
```javascript
// Mock API response from skill extraction
const mockExtractionResponse = {
  success: true,
  extractedSkills: [
    { name: "Python", category: "programming", confidence: 0.95 },
    { name: "Machine Learning", category: "data_analytics", confidence: 0.88 },
    { name: "AWS", category: "cloud_infrastructure", confidence: 0.92 },
    { name: "Team Leadership", category: "leadership_management", confidence: 0.78 }
  ],
  metadata: {
    fileName: "resume.pdf",
    uploadedAt: "2024-03-20T14:30:00Z",
    processingTime: 3.2 // seconds
  }
};
```

---

## EY Branding & Styling

### Tailwind Color Configuration
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'ey-yellow': '#ffe600',
        'ey-yellow-dark': '#e6cf00',
        'ey-black': '#2e2e38',
        'ey-confident-black': '#1a1a24',
        'ey-off-white': '#f6f6fa',
        'ey-gray-light': '#c4c4cd',
        'ey-gray': '#747480',
      }
    }
  }
}
```

### Common Tailwind Classes
```javascript
// Card styling
className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200"

// EY Yellow accent button
className="bg-ey-yellow text-ey-black font-semibold px-6 py-2 rounded-lg hover:bg-ey-yellow-dark transition-colors"

// Skill category header
className="flex justify-between items-center mb-4 text-ey-black font-semibold"

// Progress ring (SVG component)
<svg viewBox="0 0 36 36" className="w-16 h-16">
  <circle className="fill-none stroke-ey-off-white" />
  <circle className="fill-none stroke-ey-yellow" />
</svg>
```

---

## Integration Points

**Renders Inside:**
- **Block H (MainLayout):** This dashboard renders in the `<Outlet />` area

**Feeds Into:**
- **Block N (Skills Integration - Step 3):** Connects to real skill extraction pipeline, embeddings
- **Block E (Matching Engine):** Uses skills for job matching

**Depends On:**
- **Block H (Auth & Layout):** Requires MainLayout, navigation, auth context
- **Block G (Skill Extraction - for reference):** Defines skill extraction API contract

**Does NOT depend on:**
- Backend services (uses mock data)
- Database (mock data in component state)
- Other frontend blocks (standalone)

---

## Responsive Design Breakpoints

### Mobile (< 768px)
- Single column skill grid
- Stacked category sections
- Bottom sheet modal (full screen on mobile)
- Simplified upload UI (tap to upload)

### Tablet (768px - 1024px)
- Two column skill grid
- Collapsible sidebar (hamburger menu)
- Modal takes 80% of screen width

### Desktop (> 1024px)
- Multi-column skill grid (3-4 columns)
- Full sidebar navigation
- Modal centered, max-width 600px
- Hover effects enabled

---

## Accessibility Features

1. **Keyboard Navigation:**
   - Tab through skills, categories
   - Enter to open modal
   - Escape to close modal

2. **Screen Reader Support:**
   - ARIA labels on interactive elements
   - Descriptive alt text for progress rings
   - Semantic HTML (nav, section, article)

3. **Color Contrast:**
   - Text meets WCAG AA standards (4.5:1 ratio)
   - EY yellow used for accents, not primary text

4. **Focus Indicators:**
   - Visible focus rings on interactive elements
   - Skip to content link

---

## Performance Considerations

1. **Virtualization:** For large skill lists (100+ skills), use react-window or react-virtualized
2. **Lazy Loading:** Load skill categories on-demand as user scrolls
3. **Image Optimization:** Use SVG for icons, compress badge images
4. **Debounce Search:** 300ms delay on search input to reduce re-renders
5. **Memoization:** Use React.memo for SkillCard to prevent unnecessary re-renders

---

## Success Criteria

✅ **Block I is complete when:**

1. **Skills Portfolio displays all skills organized by category**
2. **Skill cards show progress rings, proficiency, status badges**
3. **Resume upload component accepts PDF/DOCX files**
4. **Mock skill extraction shows preview modal with extracted skills**
5. **Skill detail modal opens on click, supports editing**
6. **Search and filter functionality works (by name, category, status)**
7. **Add new skill modal allows manual skill entry**
8. **Responsive design works on mobile, tablet, desktop**
9. **Styling matches EY branding (yellow/black color scheme)**
10. **All components use Tailwind CSS (no custom CSS files)**
11. **Navigation from MainLayout (Block H) renders dashboard correctly**
12. **Performance: Dashboard renders <500ms with 50+ skills**

---

## References

**Related Documentation:**
- `BLOCK-H-AUTH-LAYOUT/CONTEXT.md` - MainLayout integration
- `BLOCK-G-SKILL-EXTRACTION/CONTEXT.md` - Skill extraction API contract
- `BLOCK-N-SKILLS-INTEGRATION/CONTEXT.md` - Step 3 integration (connects real data)

**Design Reference:**
- `_bmad-output/ux-unified-dashboard-v2-with-enhanced-roadmap.html` - Visual design, colors, layout

**External Resources:**
- React Dropzone: https://react-dropzone.js.org/
- Tailwind CSS: https://tailwindcss.com/docs
- React Hook Form: https://react-hook-form.com/

---

## Notes

- **Mock data only:** This block does not connect to backend APIs (that's Step 3 Block N)
- **Skill extraction:** Simulate with setTimeout() and mock response data
- **Resume upload:** Store file locally, don't send to backend yet
- **EY branding:** Strictly follow color palette from UX reference file
- **Testing:** Focus on UI rendering, interactions, responsive design
- **Adventure Mode:** Optional - implement adventure mode theme toggle (see UX file)

---

**Next Steps:** See `TASKS.md` for 16 implementation tasks
**Last Updated:** 2026-01-06
**Status:** Ready for development
