# BLOCK I: Skills Dashboard UI - TASKS

**Block:** BLOCK-I-SKILLS-DASHBOARD
**Total Tasks:** 16
**Completed:** 0/16 (0%)

---

## ⚠️ IMPORTANT: Update Instructions

**When you complete a task:**
1. Check the box: `- [x] Task name`
2. Update the "Completed" count at the top
3. Update `PROJECT-STATUS.md`:
   - Find "Block I" row in Step 2 table
   - Update Progress column (e.g., "3/16 tasks")

**When ALL tasks complete:**
1. ✅ Run all verification steps in `VERIFICATION.md`
2. ✅ Change status in `PROJECT-STATUS.md` from ⏸️ to ✅
3. ✅ Update Progress to "16/16 tasks (100%)"
4. ✅ Update "Overall Progress" section
5. ✅ After verification passes, commit changes (do NOT commit until verification is complete)

See `CONTEXT.md` section "Update Instructions (For AI)" for full details.

---

## Progress Tracker

### 1. Project Setup & Mock Data (2 tasks)

- [ ] **Task 1.1:** Create component folder structure
  - Create `frontend/src/components/skills/` directory
  - Create all component files (see list in CONTEXT.md)
  - Create `frontend/src/mocks/mockSkills.js` for test data
  - Create `frontend/src/hooks/useSkills.js` for state management

- [ ] **Task 1.2:** Define mock skills data
  - File: `frontend/src/mocks/mockSkills.js`
  - Create `MOCK_SKILLS` array (30-50 sample skills across categories)
  - Create `SKILL_CATEGORIES` array (6-8 categories with metadata)
  - Create `mockExtractSkills()` function to simulate AI extraction
  - Export mock data and helper functions

---

### 2. Core Dashboard Components (4 tasks)

- [ ] **Task 2.1:** Build SkillsDashboard container component
  - File: `frontend/src/components/skills/SkillsDashboard.jsx`
  - Import MainLayout from Block H (renders inside `<Outlet />`)
  - Set up state management: skills, filters, search, selected category
  - Add page header with title "Skills Portfolio"
  - Create grid layout for portfolio content

- [ ] **Task 2.2:** Build SkillCategory component
  - File: `frontend/src/components/skills/SkillCategory.jsx`
  - Props: `category`, `skills`, `onSkillClick`
  - Render category header: emoji icon, name, skill count
  - Render category progress bar (aggregate skill proficiency)
  - Display percentage completion
  - Make category collapsible (expand/collapse)

- [ ] **Task 2.3:** Build SkillCard component
  - File: `frontend/src/components/skills/SkillCard.jsx`
  - Props: `skill`, `onClick`
  - Render skill progress ring (use SkillProgressRing component)
  - Display skill name, metadata (modules, certification)
  - Show status badge (Active, Complete, Recommended)
  - Add hover effect (scale, shadow)
  - Make clickable to open detail modal

- [ ] **Task 2.4:** Build SkillProgressRing component (SVG circular progress)
  - File: `frontend/src/components/skills/SkillProgressRing.jsx`
  - Props: `percentage`, `size`, `strokeWidth`
  - Render SVG circle with background ring
  - Render SVG circle with progress arc (stroke-dasharray)
  - Display percentage text in center
  - Use EY yellow for progress, off-white for background
  - Support different sizes (small, medium, large)

---

### 3. Skills Portfolio Grid (2 tasks)

- [ ] **Task 3.1:** Build SkillsPortfolio component
  - File: `frontend/src/components/skills/SkillsPortfolio.jsx`
  - Props: `skills`, `categories`, `filterTab`, `searchQuery`, `onSkillClick`
  - Filter skills based on active tab (all, active, recommended)
  - Filter skills based on search query (name, category)
  - Group skills by category
  - Render SkillCategory components for each category
  - Handle empty states (no skills found)

- [ ] **Task 3.2:** Add filter tabs and search bar
  - File: `frontend/src/components/skills/SkillSearchBar.jsx`
  - Render tab buttons: "All Skills", "In Progress", "Recommended"
  - Highlight active tab with EY yellow
  - Render search input with icon
  - Debounce search input (300ms delay)
  - Emit filter/search changes to parent component
  - Add category filter dropdown (optional)

---

### 4. Resume Upload & Skill Extraction (3 tasks)

- [ ] **Task 4.1:** Build ResumeUpload component
  - File: `frontend/src/components/skills/ResumeUpload.jsx`
  - Install react-dropzone: `npm install react-dropzone`
  - Create drag-and-drop upload area (accept PDF, DOCX, TXT)
  - Show upload status: idle, uploading, success, error
  - Display file name and size after upload
  - Add "Upload Resume" button with EY yellow styling
  - Position in dashboard header or sidebar

- [ ] **Task 4.2:** Build SkillExtractionPreview modal
  - File: `frontend/src/components/skills/SkillExtractionPreview.jsx`
  - Props: `extractedSkills`, `onConfirm`, `onCancel`
  - Show modal with list of extracted skills
  - Display skill name, category, confidence score
  - Allow user to check/uncheck skills to add
  - Allow user to edit skill name/category before adding
  - Add "Add Selected Skills" button
  - Add "Cancel" button

- [ ] **Task 4.3:** Implement mock skill extraction flow
  - In `ResumeUpload.jsx`, on file drop:
    - Set uploading state to true
    - Simulate 2-3 second delay (setTimeout)
    - Call `mockExtractSkills()` from mock data
    - Open SkillExtractionPreview modal with results
    - On confirm, add skills to user profile
    - Show success message, close modal
  - Handle errors gracefully

---

### 5. Skill Detail & Editing (2 tasks)

- [ ] **Task 5.1:** Build SkillDetailModal component
  - File: `frontend/src/components/skills/SkillDetailModal.jsx`
  - Props: `skill`, `onClose`, `onUpdate`
  - Render modal overlay and content card
  - Display skill name, category, proficiency percentage
  - Show progress ring (large size)
  - Display progress details (modules completed, timeline)
  - Show certifications, notes
  - Add "Edit" button to toggle edit mode
  - Add "Close" button (X icon in top-right)

- [ ] **Task 5.2:** Add edit mode to SkillDetailModal
  - Toggle to edit mode on "Edit" button click
  - Show input fields: proficiency slider, category dropdown, notes textarea
  - Add "Save Changes" button (EY yellow)
  - Add "Cancel" button
  - On save, update skill in state (call onUpdate prop)
  - Close edit mode, show success message
  - Validate inputs (proficiency 0-100, required fields)

---

### 6. Add New Skill Feature (1 task)

- [ ] **Task 6.1:** Build AddSkillModal component
  - File: `frontend/src/components/skills/AddSkillModal.jsx`
  - Install react-hook-form: `npm install react-hook-form`
  - Props: `onClose`, `onAdd`
  - Render modal with form fields:
    - Skill name (text input, required)
    - Category (dropdown, required)
    - Proficiency level (slider 0-100, default 0)
    - Notes (textarea, optional)
  - Add "Add Skill" button in dashboard header
  - On submit, validate form and add skill to state
  - Show success message, close modal
  - Handle validation errors

---

### 7. Styling & Responsive Design (2 tasks)

- [ ] **Task 7.1:** Apply EY branding with Tailwind CSS
  - Ensure all components use Tailwind utility classes
  - Apply EY color palette (yellow, black, gray, off-white)
  - Style buttons with EY yellow background, hover effects
  - Add shadows, rounded corners to cards (rounded-2xl, shadow-sm)
  - Use Inter font family (already configured in HTML)
  - Add spacing: p-6 for cards, gap-6 for grids
  - Style badges: bg-green-500 (complete), bg-yellow-500 (active), bg-blue-500 (recommended)

- [ ] **Task 7.2:** Implement responsive design
  - **Mobile (<768px):**
    - Single column skill grid (grid-cols-1)
    - Stack category sections vertically
    - Full-screen modals on mobile
    - Larger touch targets (min 44x44px)
    - Simplified upload UI (tap to upload)
  - **Tablet (768px-1024px):**
    - Two column skill grid (md:grid-cols-2)
    - Modal takes 80% width
  - **Desktop (>1024px):**
    - Multi-column grid (lg:grid-cols-3 xl:grid-cols-4)
    - Fixed modal width (max-w-2xl)
    - Hover effects enabled
  - Test on all breakpoints

---

### 8. Integration & Polish (2 tasks)

- [ ] **Task 8.1:** Integrate with MainLayout from Block H
  - Import SkillsDashboard in `App.jsx`
  - Add route: `<Route path="/dashboard" element={<SkillsDashboard />} />`
  - Ensure dashboard renders inside MainLayout `<Outlet />`
  - Update sidebar navigation in Block H to highlight "/dashboard"
  - Test navigation from other routes
  - Verify auth protection (redirect to login if not authenticated)

- [ ] **Task 8.2:** Add polish and micro-interactions
  - Add loading states: skeleton loaders for skills while "fetching"
  - Add animations: fade-in for skill cards (stagger effect)
  - Add success toasts: "Skills uploaded!", "Skill updated!"
  - Add empty states: "No skills yet. Upload your resume to get started!"
  - Add keyboard shortcuts: Escape to close modals
  - Add focus management: focus first input in modals on open
  - Test all interactions, edge cases

---

## Acceptance Criteria

✅ **Block I is complete when:**

1. **Skills Portfolio displays 30+ mock skills organized by 6+ categories**
2. **Each skill card shows progress ring, name, metadata, status badge**
3. **Categories show aggregated progress bars and skill counts**
4. **Filter tabs (All, Active, Recommended) work correctly**
5. **Search bar filters skills by name in real-time**
6. **Resume upload accepts PDF/DOCX files with drag-and-drop**
7. **Mock skill extraction shows preview modal after 2-3 second delay**
8. **User can select/edit extracted skills before adding to profile**
9. **Skill detail modal opens on card click, shows full information**
10. **Edit mode allows updating proficiency, category, notes**
11. **Add new skill modal allows manual skill entry**
12. **All styling uses Tailwind CSS and EY branding**
13. **Responsive design works on mobile (320px), tablet (768px), desktop (1440px)**
14. **Dashboard integrates with MainLayout and renders in protected route**
15. **Loading states, animations, and success messages work**
16. **No console errors, warnings, or accessibility issues**

---

## Files to Create/Modify

**New Files:**
```
frontend/src/components/skills/
├── SkillsDashboard.jsx           # Main container
├── SkillsPortfolio.jsx           # Portfolio grid
├── SkillCategory.jsx             # Category section
├── SkillCard.jsx                 # Individual skill card
├── SkillProgressRing.jsx         # SVG progress ring
├── SkillDetailModal.jsx          # Detail/edit modal
├── ResumeUpload.jsx              # Upload component
├── SkillExtractionPreview.jsx    # Preview modal
├── SkillSearchBar.jsx            # Search/filter bar
└── AddSkillModal.jsx             # Add skill form

frontend/src/mocks/
└── mockSkills.js                 # Mock data

frontend/src/hooks/
└── useSkills.js                  # Skills state management (optional)
```

**Modified Files:**
- `frontend/src/App.jsx` (add /dashboard route)
- `frontend/tailwind.config.js` (ensure EY colors configured)

---

## Dependencies

**Blocked By:**
- Block H: Auth & Layout must be complete (MainLayout, routing, auth)

**Blocks This:**
- Block N: Skills Integration (Step 3) - connects real data

**NPM Packages:**
```bash
npm install react-dropzone react-hook-form
```

---

## Testing Checklist

### Manual Testing
- [ ] Skills render correctly organized by category
- [ ] Clicking skill card opens detail modal
- [ ] Resume upload accepts PDF/DOCX files
- [ ] Skill extraction preview shows after upload
- [ ] Edit skill works (update proficiency, save changes)
- [ ] Add new skill works (form validation, add to list)
- [ ] Search filters skills by name
- [ ] Filter tabs show correct subset of skills
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Navigation from sidebar works
- [ ] All buttons, links, modals function correctly

### Edge Cases
- [ ] Empty state: No skills yet
- [ ] Search with no results
- [ ] Upload invalid file type (should error)
- [ ] Add skill with missing required fields (validation)
- [ ] Large dataset (100+ skills) performs well

### Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Accessibility
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Screen reader announces skill names, progress
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA standards

---

## Performance Targets

- **Initial render:** <500ms for 50 skills
- **Search filtering:** <100ms response time
- **Modal open:** <50ms (instant feel)
- **Resume upload UI:** Immediate feedback on drop
- **Smooth animations:** 60fps (use CSS transforms, opacity)

---

## Common Issues & Solutions

### Issue: Too many re-renders on search
**Solution:** Use debounce (lodash.debounce or custom hook) with 300ms delay

### Issue: Modals not centering on mobile
**Solution:** Use fixed positioning with transform: `fixed inset-0 flex items-center justify-center`

### Issue: SVG progress rings not animating
**Solution:** Use CSS transition on stroke-dashoffset, calculate correctly based on circumference

### Issue: Upload not accepting files
**Solution:** Check react-dropzone accept prop: `accept={{ 'application/pdf': ['.pdf'], 'application/msword': ['.doc', '.docx'] }}`

---

## Next Steps After Completion

Once all tasks are complete:

1. ✅ Run full manual test suite (see Testing Checklist)
2. ✅ Run verification steps in `VERIFICATION.md`
3. ✅ Mark all tasks complete in this file
4. ✅ Update `PROJECT-STATUS.md`:
   - Block I: ✅ Completed | [Your Name] | 16/16 tasks
5. ✅ Take screenshots of dashboard for documentation
6. ✅ Notify team that Block I is ready
7. ✅ Update Step 3 Block N (Skills Integration) CONTEXT.md with integration notes

---

**When all tasks are complete, run the verification steps in `VERIFICATION.md`**
