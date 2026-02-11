# SpringAIS Frontend Component Inventory

**Generated**: 2026-02-11
**Source**: `frontend/src/` directory scan findings

---

## Component Catalog

76 components across 10 directories, organized by functional area.

---

## 1. Authentication Components

**Directory**: `frontend/src/components/auth/` (4 files, JSX)

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| `LoginPage` | `LoginPage.tsx` | None (uses `useAuth()`) | Email/password login form with EY branding (#FFE600 accents). Dark glassmorphism UI with loading spinner. Links to register and forgot-password routes. |
| `RegisterPage` | `RegisterPage.tsx` | None (uses `useAuth()`) | Registration form with name, email, and password fields. Minimum 8 character password validation. Same glassmorphism style as LoginPage. |
| `ForgotPasswordPage` | `ForgotPasswordPage.tsx` | None | Placeholder page not wired to real auth. Displays demo credentials (admin@ey.com / password). Notes "Block M will connect real auth + email". |
| `LogoutButton` | `LogoutButton.tsx` | None (uses `useAuth()`, `useTheme()`) | Theme-aware logout button. Calls `logout()` then navigates to `/login`. |

---

## 2. Common / Shared Components

**Directory**: `frontend/src/components/common/` (2 files, TSX)

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| `ProgressRing` | `ProgressRing.tsx` | `{percentage, size=120, strokeWidth=10, className}` | SVG circular progress ring with animated fill (1s duration, 60 steps). Uses EY yellow (#FFE600) stroke color. Reused across matches, skills, and roadmap views. |
| `SkillTag` | `SkillTag.tsx` | `{skill, variant: 'matched'\|'transferable'\|'gap', className}` | Pill badge for displaying skills. Color variants: green (#22C55E) for matched, blue (#3B82F6) for transferable, orange (#F59E0B) for gap. |

---

## 3. Career Visualization Components

**Directory**: `frontend/src/components/career-viz/` (10 files, TSX/TS)

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| `CareerVisualization` | `CareerVisualization.tsx` | `{employeeCurrentRoleId?}` | Main career graph container using ReactFlow. Features: department filter, search with 1-hop expansion, success rate threshold slider, goal path highlighting via BFS shortest path. Fetches data from `fetchCareerGraph` service. |
| `GraphControls` | `GraphControls.tsx` | `{state: GraphControlsState, onChange, departments}` | Filter panel for career graph. Controls: search input, department dropdown, minimum success rate slider. Exports `GraphControlsState = {search, department, minSuccessRate}`. |
| `NodeDetailsPanel` | `NodeDetailsPanel.tsx` | `{node, transitions, onClose, employeeCurrentRoleId}` | Side panel (420px width) showing selected role details, outgoing transitions with success rates/times/common skills, and embedded `RoleRequirementTree`. |
| `RoleNode` | `RoleNode.tsx` | ReactFlow custom node data | Custom ReactFlow node for career roles. Visual states: current (yellow border), goal (yellow glow), possible next (green border), selected (ring), default (gray). Displays label, department, employee count, avg years. |
| `RoleRequirementTree` | `RoleRequirementTree.tsx` | `{roleId, jobId?, onPlanGenerated?, onNodesReceived?, onNodeClick?, selectedPath?, isCustomizing?}` | Skill plan tree using ReactFlow with radial layout algorithm. Calls `POST /api/skills/plan/{jobId}`. Supports node dragging in customize mode with localStorage persistence of positions. |
| `SkillNode` | `SkillNode.tsx` | ReactFlow custom node: `SkillNodeData` | Custom node for skill plan tree. Types: `{label, kind: 'role'\|'path'\|'skill', emphasis?, has?, required?, progress?, isCustomizing?}`. Three visual variants: role (center SVG icon), path (category circle with emoji), skill (circular with progress ring). |
| `SkillPlanEdge` | `SkillPlanEdge.tsx` | ReactFlow custom edge | Custom edge supporting: bundled paths (quadratic bezier through hub point), straight edges for direct connections, standard bezier for fallback. Bundle strength is configurable. |
| `TransitionEdge` | `TransitionEdge.tsx` | ReactFlow custom edge | Career graph edge with color-coded success rate: >70% green, >50% amber, else gray. Shows percentage label badge. Supports highlight/dim modes for goal path visualization. |

**Utilities**:

| Function | File | Signature | Description |
|----------|------|-----------|-------------|
| `layoutGraph` | `graphLayoutUtils.ts` | `<TNodeData, TEdgeData>(nodes, edges, options?)` | Dagre-based graph layout with configurable direction (TB/LR), rank separation, node separation, and node dimensions. |
| `transformCareerGraphToReactFlow` | `graphTransformUtils.ts` | `(graph: CareerGraphData, override?)` | Transforms backend `CareerGraphData` to ReactFlow-compatible format. Returns `{nodes, edges, transitionsBySource}`. Also exports `RoleNodeData` and `TransitionEdgeData` types. |

---

## 4. Gamification Components

**Directory**: `frontend/src/components/game/` (8 files, TSX)

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| `AdventureHUD` | `AdventureHUD.tsx` | None (uses `useAdventure()`) | Fixed top HUD bar showing: level badge, XP progress bar, gold counter (clickable for CoinFlip), achievements count, login streak. Framer Motion entry animation. Only visible in adventure mode. |
| `AchievementsPanel` | `AchievementsPanel.tsx` | `{isOpen, onClose}` | Modal showing achievement grid (2 columns) with progress bars, unlock status, XP and gold reward values. 14 predefined achievements. Framer Motion animations. |
| `CoinFlipGame` | `CoinFlipGame.tsx` | `{isOpen, onClose}` | Mini-game modal. Bet options: 10, 25, 50, or 100 gold. Heads/tails selection. 50/50 odds. Win = 2x bet. Uses `spendGold()` and `completeMiniGame()` from AdventureContext. |
| `GameButton` | `GameButton.tsx` | `{variant, size, isLoading, className, children, ...props}` | Themed button component. Variants: primary, secondary, ghost, danger. Sizes: sm, md, lg. Framer Motion hover/tap animations. Uses Cinzel font in game mode. |
| `GameCard` | `GameCard.tsx` | `{children, className, highlight?, glow?}` | Themed card wrapper with optional highlight border and glow effect. Framer Motion hover animation. Uses Spectral font in game mode. |
| `GameProgressBar` | `GameProgressBar.tsx` | `{value, max, variant, size, showLabel?, className}` | Progress bar with variants: default, xp, gold, success, warning. Multiple sizes. Animated fill with shimmer effect in game mode. |
| `NotificationToasts` | `NotificationToasts.tsx` | None (uses `useAdventure()`) | Fixed bottom-right toast stack for game events: XP gain, gold gain, achievement unlock, level-up. Animated with Framer Motion (slide-in, shake for gold, scale for achievement). |
| `ThemeSwitcher` | `ThemeSwitcher.tsx` | None (uses `useTheme()`) | Dropdown with 3 theme options: Light (Sun icon), Dark (Moon icon), Medieval (Castle icon). Custom SVG icons. Plus Adventure Mode toggle button with Sword icon. |

---

## 5. Layout Components

**Directory**: `frontend/src/components/layout/` (8 files, TSX/TS)

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| `MainLayout` | `MainLayout.tsx` | Children via Outlet | Personal account layout. Sidebar navigation + main content area. Renders `AdventureHUD` + `NotificationToasts` when adventure mode is enabled. Consumes `ThemeContext`. |
| `HMLayout` | `HMLayout.tsx` | Children via Outlet | Hiring manager layout. Same sidebar + content pattern but with HM-specific navigation. |
| `Sidebar` | `Sidebar.tsx` | None | Navigation sidebar for personal accounts. Links: Dashboard, Matches, Skills, Career Path, Success Patterns. Active route highlighting. |
| `HMSidebar` | `HMSidebar.tsx` | None | Navigation sidebar for hiring managers. Links: Dashboard, Candidates, Matches, Analytics. |
| `Header` | `Header.tsx` | None | Top header bar with user greeting, notification bell, and `ThemeSwitcher` component. |
| `ProtectedRoute` | `ProtectedRoute.tsx` | Children | Route guard component. Checks `useAuth().isAuthenticated`. Redirects to `/login` if not authenticated. |
| `AccountTypeRoute` | `AccountTypeRoute.tsx` | `{accountType}` | Route guard checking `useAuth().user.accountType`. Redirects personal users away from HM routes (`/hm/*`) and vice versa. |
| Barrel exports | `index.ts` | N/A | Re-exports all layout components. |

---

## 6. Match Components

**Directory**: `frontend/src/components/matches/` (9 files, TSX)

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| `MatchResultsPage` | `MatchResultsPage.tsx` | None (uses multiple contexts) | Main matches page. Resume upload gate (must upload before viewing matches). Progressive loading with BATCH_SIZE=20. US location filtering. Sorting and pagination (10/page). Virtual scrolling for 50+ matches. Adventure mode XP/gold/achievement integration. |
| `MatchCard` | `MatchCard.tsx` | `{match, onViewDetails, onSaveMatch, isSaved}` | Card displaying: job title, service line, department, location, `ProgressRing` for overall score, `SkillGapDisplay`, explanation quote. Save/unsave toggle. |
| `MatchDetailsModal` | `MatchDetailsModal.tsx` | `{match, isOpen, onClose}` | Full-screen modal. Score breakdown (Skill Match 80%, Experience 10%, Role Fit 10%). Match explanation. GPT-5.2 deep analysis (on-demand). Skill gap display. Job details section. EY Careers external link. |
| `MatchFilters` | `MatchFilters.tsx` | `{filters: FilterState, onFilterChange}` | Filter panel with Department, Location, and Experience Level multi-select dropdowns plus US Only toggle. Uses `MOCK_FILTER_OPTIONS` for dropdown values. Exports `FilterState` type. |
| `MatchModeToggle` | `MatchModeToggle.tsx` | `{activeMode: MatchMode, onModeChange}` | Three-button toggle: Best Fit (90%+), Stretch (70-90%), Exploratory (<70%). Exports `MatchMode` type. |
| `MatchSortDropdown` | `MatchSortDropdown.tsx` | `{sortOption: SortOption, onSortChange}` | Sort dropdown with 4 options: score descending, score ascending, date newest, date oldest. Exports `SortOption` type. |
| `SkillGapDisplay` | `SkillGapDisplay.tsx` | `{matchedSkills, transferableSkills, gapSkills, matchScore}` | Displays matched, transferable, and gap skills using `SkillTag` components with count summaries. |
| `VirtualMatchList` | `VirtualMatchList.tsx` | `{matches, renderMatch, estimateSize}` | Virtualized list using `@tanstack/react-virtual`. Overscan: 5 items. Exports `useVirtualListStats` hook. Used when match count exceeds 50. |
| `EmptyMatchState` | `EmptyMatchState.tsx` | `{onResetFilters}` | Empty state component with search icon, descriptive message, and "Reset Filters" button. |

---

## 7. Roadmap Components

**Directory**: `frontend/src/components/roadmap/` (11 files, TSX)

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| `RoadmapViewer` | `RoadmapViewer.tsx` | None (uses `useRoadmap()`, `useParams()`) | Main roadmap container. Header with title and emphasis tag. `GlobalProgressBar`. `RoadmapTabNav` for navigation. Tab content: Overview, Insights, Phase detail. `RoadmapAssistant` chat. `EditModeToggle` modal. |
| `GlobalProgressBar` | `GlobalProgressBar.tsx` | `{roadmap, totalMilestones, completedMilestones, extrasCount}` | Sticky progress bar with SVG circle progress, milestone completed/total count, extras badge, celebration animation on completion, current phase indicator. |
| `RoadmapTabNav` | `RoadmapTabNav.tsx` | `{activeTab, roadmap, onTabChange, completedByPhase, totalByPhase}` | Horizontal scrollable tab navigation: Overview tab, Insights tab, dynamic Phase tabs (one per roadmap phase) with progress counts (completed/total). |
| `OverviewTab` | `OverviewTab.tsx` | `{roadmap}` | Hero stats cards, executive summary, vertical timeline with phase circles connected by lines, current status card with emphasis and estimated duration. |
| `InsightsTab` | `InsightsTab.tsx` | `{roadmap}` | Four sections: Quick wins (numbered list, green accent), Critical skills (yellow tag cloud), Potential challenges (red list), Journey summary narrative. |
| `PhaseTab` | `PhaseTab.tsx` | `{phase, phaseIndex, totalPhases, onNavigatePhase, roadmap}` | Phase detail view. Progress ring, phase info (description, target role), previous/next phase navigation buttons, `MilestoneCard` list, `ExtrasSection`. |
| `MilestoneCard` | `MilestoneCard.tsx` | `{milestone, phaseIndex, milestoneIndex, isEditMode}` | Interactive milestone card. Checkbox for completion toggle. Category icon (S=Skill, E=Experience, C=Certification, L=Leadership, N=Networking). Priority badge (high/medium/low). Expandable sections: skills, resources, success indicators, notes. Manual edit modal in edit mode. Category colors: skill=#3b82f6, experience=#8b5cf6, certification=#f59e0b, leadership=#ec4899, networking=#06b6d4. |
| `ExtrasSection` | `ExtrasSection.tsx` | `{extras, phaseIndex, isEditMode}` | Collapsible section for user-added extra achievements. Categories: certification, skill, project, achievement. Add and delete functionality. |
| `AddExtraModal` | `AddExtraModal.tsx` | `{isOpen, onClose, onAdd}` | Modal form for adding extra achievements. Fields: title (required), 4-category grid selector (certification/skill/project/achievement), optional description text area. |
| `EditModeToggle` | `EditModeToggle.tsx` | `{editMode, onEditModeChange}` | Three-mode selector: View (read-only), AI-Assisted (generates suggested edits with text instructions, preview/apply/cancel), Manual (warning + confirmation modal before enabling). |
| `RoadmapAssistant` | `RoadmapAssistant.tsx` | `{roadmap}` | Floating chat widget fixed to bottom-right (384px width). 5 suggested starter questions. Chat message history with user/assistant bubbles. Collapsible. Uses `useRoadmap().sendChatMessage`. |

---

## 8. Role Detail Components

**Directory**: `frontend/src/components/role-detail/` (5 files, TSX)

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| `RoleOverview` | `RoleOverview.tsx` | `{match}` | Role detail overview. `ProgressRing` with overall score. Explanation text. Role details grid (service line, department, location, experience range, posting date). Score breakdown bars (Skill Match, Experience, Role Fit). Matched skills as tags. GPT-5.2 deep analysis (on-demand load). |
| `RoleSkillsGap` | `RoleSkillsGap.tsx` | `{match}` | Skills gap analysis view. 3 stat cards (matched count, gap count, match percentage). Matched skills tags section. Gap skills tags with "Learn More" buttons linking to skill learning. Recommendations section. |
| `RolePathTo` | `RolePathTo.tsx` | `{match}` | Full skill development network view. Grid layout: 300px `NetworkSidebar` + ReactFlow canvas. Stats header row. Fetches role transition stats from `GET /api/patterns/role/{title}`. Embeds `RoleRequirementTree` with customize mode (node wiggle animation). |
| `RoleSuccessPatterns` | `RoleSuccessPatterns.tsx` | `{match}` | Success patterns analysis using skill-based API (`POST /api/patterns/role-skills`). Widget grid with dnd-kit drag reorder. localStorage layout persistence. Embedded charts: `MetricCards`, `SuccessRateChart`, `TimeToPromotionChart`, `SkillFrequencyChart`, `DepartmentDistributionChart`, each wrapped in `SortableWidget`. |
| `NetworkSidebar` | `NetworkSidebar.tsx` | `{paths, selectedPath, onPathSelect, onClearFilter, selectedNodeData}` | Left sidebar (300px) for skill plan view. Career paths list with progress bars. Path filter controls. Skill detail panel showing kind, has/required status, and learning hints. |

---

## 9. Skills Components

**Directory**: `frontend/src/components/skills/` (11 files, JSX)

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| `SkillsDashboard` | `SkillsDashboard.jsx` | None (uses `useSkillsContext()`, `useTheme()`) | Main skills container. Header with overall progress ring, stat cards (active skills, completed skills). Add Skill button. Empty state prompts resume upload. Integrates: `SkillSearchBar`, `SkillsPortfolio`, `SkillDetailModal`, `AddSkillModal`, `ResumeUpload`. Syncs selectedSkill state on skills array refresh. |
| `SkillsPortfolio` | `SkillsPortfolio.jsx` | `{skills, filterTab, searchQuery, onSkillClick, onMarkComplete, theme, progressColors}` | Portfolio grid organizing skills by category. Supports dynamic AI-generated categories from context or fallback to `SKILL_CATEGORIES` constant. Filters by tab (all/active/recommended) and search query. Groups skills by categoryId or name match. |
| `SkillCategory` | `SkillCategory.jsx` | `{category, skills, onSkillClick, onMarkComplete, theme, progressColors, onCategoryUpdated, onCategoryDeleted}` | Category section with header (emoji + name + skill count). CRUD operations: edit category name/emoji via `PUT /skills/groupings/categories/{id}`, delete via `DELETE`, add module via `POST`. Category progress meter. Learning modules panel. Skills grid (1-4 columns responsive). |
| `SkillCard` | `SkillCard.jsx` | `{skill, onClick, onMarkComplete, theme, progressColors}` | Individual skill card. `SkillProgressRing` for visual progress. Skill name. Status badge (Complete, Starting, Near Done, Active, Recommended). Progress percentage text. Hover "Mark Done" button. |
| `SkillDetailModal` | `SkillDetailModal.jsx` | `{skill, onClose, onUpdate, onRefresh, onMarkComplete}` | Complex modal (~1080 lines). Proficiency selector (0-5 scale, level 3+ counts for matching). Module tracking with start/complete/proof workflow. AI learning content generation via `generateModuleContent`. Task tracking with optimistic updates via `toggleModuleTask`. EY and external learning resources. Proof submission (description, link, or file upload with AI review). Skill decay warning (6+ months without update). |
| `SkillSearchBar` | `SkillSearchBar.jsx` | `{filterTab, onFilterChange, onSearchChange, theme}` | Filter tabs: All Skills, In Progress, Recommended. Debounced search input (300ms delay). |
| `SkillExtractionPreview` | `SkillExtractionPreview.jsx` | `{extractedSkills, onConfirm, onCancel}` | Preview modal for resume-extracted skills. Toggle individual skill selection. Inline edit of skill name and category. Shows confidence percentage. Confirm button adds selected skills to portfolio. |
| `SkillProgressRing` | `SkillProgressRing.jsx` | `{percentage, size='medium', strokeWidth=3, progressColors}` | SVG circular progress with green gradient. Sizes: small (48px), medium (64px), large (96px). Default gradient: dark green (#166534) to light green (#4ade80). |
| `ResumeUpload` | `ResumeUpload.jsx` | `{onSkillsExtracted, clearSkills, theme}` | Drag-and-drop file upload using react-dropzone. Accepts PDF, DOC, DOCX, TXT. Posts to `POST /skills/upload` with FormData. Maps backend proficiency values to confidence scores. Opens `SkillExtractionPreview` on success. Triggers AI skill grouping generation. |
| `AddSkillModal` | `AddSkillModal.jsx` | `{onClose, onAdd}` | Form for manually adding skills. Fields: name (required), category (from `SKILL_CATEGORIES`), proficiency (0-100 range slider), notes. Uses react-hook-form. Escape key and backdrop click to close. |
| `ThemeSwitcher` | `ThemeSwitcher.jsx` | N/A (config export) | Theme configuration objects for Skills Dashboard. Exports `DARK_THEME` and `LIGHT_THEME` objects with comprehensive token system (headerBg, cardBg, cardBorder, badges, tabs, category, search). Also exports `THEME` and `PROGRESS_COLORS` constants. |

---

## 10. Success Patterns Components

**Directory**: `frontend/src/components/successPatterns/` (8 files, TSX)

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| `SuccessPatternPage` | `SuccessPatternPage.tsx` | None | Main page component. Fetches data via `getSuccessPatterns`. Loading, error, and empty states. Widget layout with dnd-kit drag-and-drop reorder (4 widgets). Layout persistence in localStorage (`springais.successPatterns.layout.v1`). Rearrange mode with confirm/cancel. |
| `MetricCards` | `MetricCards.tsx` | `{metrics: SuccessPatternMetrics, transitionCount?, employeeCount?}` | 4-card grid: Career Transitions count, Avg Time to Promotion (years), Overall Success Rate (%), Sample Size. EY yellow (#FFE600) accent icons. Glassmorphic dark cards. |
| `SuccessRateChart` | `SuccessRateChart.tsx` | `{data: TransitionData[]}` | Recharts vertical BarChart. Color-coded bars: >70% = #FFE600 (yellow), >50% = #C4C4CD (light gray), else #52525B (dark gray). Custom tooltip showing success rate and sample size. Sorted by success rate descending. |
| `TimeToPromotionChart` | `TimeToPromotionChart.tsx` | `{data: {[department: string]: StageData[]}}` | Recharts multi-line LineChart. One line per department: Advisory=#FFE600, Tax=#A1A1AA, Consulting=#71717A, Audit=#52525B. Shows average years per career stage. Custom tooltip with all department values. |
| `SkillFrequencyChart` | `SkillFrequencyChart.tsx` | `{data: SkillFrequency[]}` | Recharts horizontal BarChart showing top 10 skills by frequency. EY yellow bars. Custom tooltip with skill name and frequency percentage. |
| `DepartmentDistributionChart` | `DepartmentDistributionChart.tsx` | `{data: DepartmentData[], onDepartmentClick?}` | Recharts donut PieChart with custom percentage labels (stroke outline for contrast). Fixed tooltip area on right side. Click-to-filter interaction. Colors: EY yellow plus grays. |
| `FilterControls` | `FilterControls.tsx` | `{onFilterChange}` | Filter bar with three dropdowns: Department (Advisory/Tax/Consulting/Audit), Role Level (Analyst/Consultant/Manager/Director), Time Period (All time/5yr/10yr). URL search param sync. Apply + Clear buttons with active filter indicator. Exports `FilterOptions` type. |
| `SortableWidget` | `SortableWidget.tsx` | `{id: string, enabled: boolean, children: ReactNode}` | dnd-kit sortable wrapper. Shows "Drag" handle button when rearrange mode is enabled. Reduces opacity during active drag. Uses `useSortable` hook from @dnd-kit/sortable. |

---

## 11. Page Components

**Directory**: `frontend/src/pages/` (9 files, TSX)

| Component | File | Description |
|-----------|------|-------------|
| `DashboardPage` | `DashboardPage.tsx` | Personal dashboard (placeholder structure) |
| `MatchesPage` | `MatchesPage.tsx` | Thin wrapper around `MatchResultsPage` component |
| `MatchDetailPage` | `MatchDetailPage.tsx` | Uses `useParams()` for matchId, renders `MatchDetailsModal` |
| `RoleDetailPage` | `RoleDetailPage.tsx` | Tab-based layout: Overview, Skills Gap, Path To, Success Patterns |
| `SkillsPage` | `SkillsPage.tsx` | Thin wrapper around `SkillsDashboard` component |
| `CareerPathPage` | `CareerPathPage.tsx` | Thin wrapper around `CareerVisualization` component |
| `RoadmapPage` | `RoadmapPage.tsx` | Wraps `RoadmapViewer` in `RoadmapProvider` context |
| `SuccessPatternsPage` | `SuccessPatternsPage.tsx` | Thin wrapper around `SuccessPatternPage` component |
| `HMDashboardPage` | `HMDashboardPage.tsx` | Hiring manager dashboard (placeholder structure) |

---

## Component Count Summary

| Category | Count |
|----------|-------|
| Auth | 4 |
| Common / Shared | 2 |
| Career Visualization | 10 |
| Gamification | 8 |
| Layout | 8 |
| Matches | 9 |
| Roadmap | 11 |
| Role Detail | 5 |
| Skills | 11 |
| Success Patterns | 8 |
| Pages | 9 |
| **Total** | **85** |
