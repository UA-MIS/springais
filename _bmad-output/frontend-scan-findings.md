# Frontend Codebase Scan Findings

> Exhaustive scan of `frontend/` directory -- SpringAIS React SPA
> Scanned: 2026-02-11

---

## 1. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Runtime** | React | 18.2.0 |
| **Language** | TypeScript (strict mode) + JSX (skills components) | ~5.x |
| **Build Tool** | Vite | 5.0.8 |
| **CSS Framework** | TailwindCSS v4 | 4.1.18 (uses `@tailwindcss/postcss`, `@theme` directive) |
| **Router** | React Router DOM | 6.30.2 |
| **Server State** | TanStack React Query | 5.90.16 |
| **HTTP Client** | Axios | 1.13.2 |
| **Graph Visualization** | ReactFlow | 11.11.4 |
| **Charts** | Recharts | 3.6.0 |
| **Animation** | Framer Motion | 11.18.2 |
| **Drag-and-Drop** | dnd-kit (core 6.3.1, sortable 10.0.0) | 6.3.1 / 10.0.0 |
| **Forms** | react-hook-form | 7.71.1 |
| **File Upload** | react-dropzone | 14.3.8 |
| **Virtual Scrolling** | @tanstack/react-virtual | 3.13.18 |
| **Graph Layout** | dagre | 0.8.5 |
| **Dev Server** | Vite dev server | port 5173 |
| **Container** | Docker (nginx:alpine) | multi-stage build |

### Build Configuration

- **Path Alias**: `@` maps to `./src` (configured in `vite.config.ts` and `tsconfig.json`)
- **PostCSS**: Uses `@tailwindcss/postcss` (TailwindCSS v4 style)
- **Proxy**: Vite dev server proxies `/api` to `http://localhost:8000`
- **Docker**: Multi-stage build -- Node 20 build stage, nginx:alpine serve stage, port 80

---

## 2. Component Inventory

### 2.1 Auth Components (`components/auth/`) -- 4 files (JSX)

| File | Export | Props | Description |
|------|--------|-------|-------------|
| `LoginPage.tsx` | `default` | none (uses `useAuth()`) | Email/password login form with EY branding (#FFE600 accents), dark glassmorphism UI, loading spinner. Links to register/forgot-password. |
| `RegisterPage.tsx` | `default` | none (uses `useAuth()`) | Registration form with name/email/password, min 8 char validation, same glassmorphism style. |
| `ForgotPasswordPage.tsx` | `default` | none | Placeholder page, not wired to real auth. Shows demo credentials (admin@ey.com / password). Notes "Block M will connect real auth + email". |
| `LogoutButton.tsx` | `default` | none (uses `useAuth()`, `useTheme()`) | Theme-aware logout button, calls `logout()` then navigates to `/login`. |

### 2.2 Common Components (`components/common/`) -- 2 files (TSX)

| File | Export | Props | Description |
|------|--------|-------|-------------|
| `ProgressRing.tsx` | `default` | `{percentage, size=120, strokeWidth=10, className}` | SVG circular progress ring with animated fill (1s duration, 60 steps). Uses EY yellow (#FFE600) stroke. |
| `SkillTag.tsx` | `default` | `{skill, variant: 'matched'\|'transferable'\|'gap', className}` | Pill badge for skills. Colors: green (#22C55E), blue (#3B82F6), orange (#F59E0B). |

### 2.3 Career Visualization Components (`components/career-viz/`) -- 10 files (TSX/TS)

| File | Export | Props / Signature | Description |
|------|--------|-------------------|-------------|
| `CareerVisualization.tsx` | `default` | `{employeeCurrentRoleId?}` | Main career graph using ReactFlow with custom `RoleNode` and `TransitionEdge`. Department filter, search with 1-hop expansion, success rate threshold, goal path highlighting via BFS shortest path. Uses `fetchCareerGraph` service. |
| `GraphControls.tsx` | `default`, `GraphControlsState`, `GraphControlsProps` | `{state, onChange, departments}` | Filter panel for career graph. Exports `GraphControlsState = {search, department, minSuccessRate}`. |
| `NodeDetailsPanel.tsx` | `default` | `{node, transitions, onClose, employeeCurrentRoleId}` | Side panel (420px) showing role details, outgoing transitions with success rates/times/skills, and embedded `RoleRequirementTree`. |
| `RoleNode.tsx` | `default` | ReactFlow custom node | Custom node for career roles. Visual states: current (yellow border), goal (yellow glow), possible next (green), selected, default. Shows label, department, employee count, avg years. |
| `RoleRequirementTree.tsx` | `default` | `{roleId, jobId?, onPlanGenerated?, onNodesReceived?, onNodeClick?, selectedPath?, isCustomizing?}` | Skill plan tree using ReactFlow with radial layout. Calls `POST /api/skills/plan/{jobId}`. Supports node dragging in customize mode with localStorage persistence. |
| `SkillNode.tsx` | `default`, `SkillNodeData` | ReactFlow custom node | Custom node for skill plan. Type `SkillNodeData = {label, kind: 'role'\|'path'\|'skill', emphasis?, has?, required?, progress?, isCustomizing?}`. Three visual variants: role (center SVG), path (category circles with emojis), skill (circular with progress ring). |
| `SkillPlanEdge.tsx` | `default` | ReactFlow custom edge | Custom edge supporting bundled paths (quadratic bezier through hub point), straight for direct edges, standard bezier. Bundle strength configurable. |
| `TransitionEdge.tsx` | `default` | ReactFlow custom edge | Career graph edge with color-coded success rate (>70% green, >50% amber, else gray). Shows percentage label badge. Supports highlight/dim for goal path. |
| `graphLayoutUtils.ts` | `layoutGraph<TNodeData, TEdgeData>` | `(nodes, edges, options?)` | Dagre-based graph layout with configurable direction, rank/node separation, node dimensions. |
| `graphTransformUtils.ts` | `transformCareerGraphToReactFlow`, `RoleNodeData`, `TransitionEdgeData` | `(graph, override?)` | Transforms `CareerGraphData` to ReactFlow format. Returns `{nodes, edges, transitionsBySource}`. |

### 2.4 Game Components (`components/game/`) -- 8 files (TSX)

| File | Export | Props | Description |
|------|--------|-------|-------------|
| `AchievementsPanel.tsx` | `default` | `{isOpen, onClose}` | Modal showing achievement grid (2-col) with progress bar, unlock status, XP/gold rewards. Framer Motion animations. |
| `AdventureHUD.tsx` | `default` | none (uses `useAdventure()`) | Fixed top HUD bar showing level badge, XP bar, gold (clickable for CoinFlip), achievements count, login streak. Framer Motion entry animation. |
| `CoinFlipGame.tsx` | `default` | `{isOpen, onClose}` | Mini-game modal with heads/tails betting. Bet options: 10/25/50/100 gold. 50/50 odds, win = 2x bet. Uses `spendGold` and `completeMiniGame`. |
| `GameButton.tsx` | `default` | `{variant, size, isLoading, className, children, ...props}` | Themed button with variants (primary/secondary/ghost/danger), sizes (sm/md/lg), Framer Motion hover/tap, Cinzel font in game mode. |
| `GameCard.tsx` | `default` | `{children, className, highlight?, glow?}` | Themed card wrapper with optional highlight/glow, Framer Motion hover, Spectral font in game mode. |
| `GameProgressBar.tsx` | `default` | `{value, max, variant, size, showLabel?, className}` | Progress bar with variants (default/xp/gold/success/warning), sizes, animated fill with shimmer in game mode. |
| `NotificationToasts.tsx` | `default` | none (uses `useAdventure()`) | Fixed bottom-right toast stack for XP gain, gold gain, achievement unlock, level-up events. Animated with Framer Motion (slide-in, shake, scale). |
| `ThemeSwitcher.tsx` | `default` | none (uses `useTheme()`) | Dropdown with 3 themes (Light/Dark/Medieval) using custom SVG icons (Sun/Moon/Castle). Plus Adventure Mode toggle button with Sword icon. |

### 2.5 Matches Components (`components/matches/`) -- 9 files (TSX)

| File | Export | Props | Description |
|------|--------|-------|-------------|
| `MatchCard.tsx` | `default` | `{match, onViewDetails, onSaveMatch, isSaved}` | Card showing job title, service line, department, location, ProgressRing, SkillGapDisplay, explanation quote. |
| `MatchDetailsModal.tsx` | `default` | `{match, isOpen, onClose}` | Full-screen modal with score breakdown (Skill/Experience/Role Fit), explanation, deep analysis (GPT-5.2), skill gap, job details, EY Careers link. |
| `MatchFilters.tsx` | `default`, `FilterState` | `{filters, onFilterChange}` | Filter panel with Department/Location/Experience Level multi-select dropdowns + US Only toggle. Uses `MOCK_FILTER_OPTIONS`. |
| `MatchModeToggle.tsx` | `default`, `MatchMode` | `{activeMode, onModeChange}` | Three-button toggle: Best Fit (90%+), Stretch (70-90%), Exploratory (<70%). |
| `MatchResultsPage.tsx` | `default` | none (uses multiple contexts) | Main matches page with resume upload gate, progressive loading, US location filtering, sorting, pagination (10/page), virtual scrolling for 50+ matches. Adventure mode XP/gold/achievement integration. |
| `MatchSortDropdown.tsx` | `default`, `SortOption` | `{sortOption, onSortChange}` | Sort dropdown with 4 options (score/date asc/desc). |
| `SkillGapDisplay.tsx` | `default` | `{matchedSkills, transferableSkills, gapSkills, matchScore}` | Shows matched/transferable/gap skills using SkillTag components with counts. |
| `VirtualMatchList.tsx` | `default`, `useVirtualListStats` | `{matches, renderMatch, estimateSize}` | Virtualized list using `@tanstack/react-virtual`. Overscan: 5 items. |
| `EmptyMatchState.tsx` | `default` | `{onResetFilters}` | Empty state with search icon, message, and Reset Filters button. |

### 2.6 Roadmap Components (`components/roadmap/`) -- 11 files (TSX)

| File | Export | Props | Description |
|------|--------|-------|-------------|
| `RoadmapViewer.tsx` | `default` | none (uses `useRoadmap()`, `useParams()`) | Main container with header, GlobalProgressBar, RoadmapTabNav, tab content (Overview/Insights/Phase), RoadmapAssistant chat, EditMode modal. |
| `GlobalProgressBar.tsx` | `default` | `{roadmap, totalMilestones, completedMilestones, extrasCount}` | Sticky progress bar with SVG circle, milestone count, extras badge, celebration, phase indicator. |
| `RoadmapTabNav.tsx` | `default` | `{activeTab, roadmap, onTabChange, completedByPhase, totalByPhase}` | Horizontal scrollable tabs: Overview, Insights, dynamic phase tabs with progress counts. |
| `OverviewTab.tsx` | `default` | `{roadmap}` | Hero stats, executive summary, vertical timeline with phase circles, current status card. |
| `InsightsTab.tsx` | `default` | `{roadmap}` | Quick wins (numbered, green), critical skills (yellow tag cloud), potential challenges (red), journey summary. |
| `PhaseTab.tsx` | `default` | `{phase, phaseIndex, totalPhases, onNavigatePhase, roadmap}` | Phase detail with progress ring, phase info, prev/next navigation, MilestoneCard list, ExtrasSection. |
| `MilestoneCard.tsx` | `default` | `{milestone, phaseIndex, milestoneIndex, isEditMode}` | Interactive milestone with checkbox, category icon (S/E/C/L/N), priority badge, expand/collapse for skills/resources/success indicators/notes. Manual edit with modal. Category colors: skill=#3b82f6, experience=#8b5cf6, certification=#f59e0b, leadership=#ec4899, networking=#06b6d4. |
| `ExtrasSection.tsx` | `default` | `{extras, phaseIndex, isEditMode}` | Collapsible section for user-added extra achievements. Categories: certification/skill/project/achievement. Add/delete functionality. |
| `AddExtraModal.tsx` | `default` | `{isOpen, onClose, onAdd}` | Modal form with title, 4-category grid selector, optional description. `CATEGORIES` constant. |
| `EditModeToggle.tsx` | `default` | `{editMode, onEditModeChange}` | Three-mode selector (View/AI-Assisted/Manual). AI edit: suggested edits, text instructions, generate/preview/apply/cancel. Manual: warning + confirmation modal. |
| `RoadmapAssistant.tsx` | `default` | `{roadmap}` | Floating chat widget (fixed bottom-right, 384px). 5 suggested questions. Chat message history. Collapsible. Uses `useRoadmap().sendChatMessage`. |

### 2.7 Role Detail Components (`components/role-detail/`) -- 5 files (TSX)

| File | Export | Props | Description |
|------|--------|-------|-------------|
| `NetworkSidebar.tsx` | `default` | `{paths, selectedPath, onPathSelect, onClearFilter, selectedNodeData}` | Left sidebar (300px) for skill plan. Career paths with progress bars, path filter, skill detail panel (kind, has/required, hints). |
| `RoleOverview.tsx` | `default` | `{match}` | Role detail overview with ProgressRing, explanation, role details grid (service line, department, location, etc.), score breakdown bars, matched skills tags, deep analysis (GPT-5.2). |
| `RolePathTo.tsx` | `default` | `{match}` | Full skill development network view. Grid layout (300px sidebar + canvas). Stats header, fetches role transition stats from `GET /api/patterns/role/{title}`. Embeds RoleRequirementTree with customize mode (node wiggle animation). |
| `RoleSkillsGap.tsx` | `default` | `{match}` | Skills gap analysis with 3 stat cards, matched/gap skills tags, "Learn More" buttons, recommendations. |
| `RoleSuccessPatterns.tsx` | `default` | `{match}` | Success patterns using skill-based API (`POST /api/patterns/role-skills`). Widget grid with dnd-kit drag reorder, localStorage layout persistence. Uses MetricCards, SuccessRateChart, TimeToPromotionChart, SkillFrequencyChart, DepartmentDistributionChart, SortableWidget. |

### 2.8 Skills Components (`components/skills/`) -- 11 files (JSX)

| File | Export | Props | Description |
|------|--------|-------|-------------|
| `AddSkillModal.jsx` | `default` | `{onClose, onAdd}` | Form for manually adding skills. Fields: name (required), category (from SKILL_CATEGORIES), proficiency (0-100 range slider), notes. Uses react-hook-form. Escape key + backdrop click to close. |
| `ResumeUpload.jsx` | `default` | `{onSkillsExtracted, clearSkills, theme}` | Drag-and-drop file upload using react-dropzone. Accepts PDF/DOC/DOCX/TXT. Posts to `POST /skills/upload` with FormData. Maps backend proficiency to confidence scores. Opens SkillExtractionPreview on success. Triggers AI skill grouping generation. |
| `SkillCard.jsx` | `default` | `{skill, onClick, onMarkComplete, theme, progressColors}` | Individual skill card with SkillProgressRing, name, status badge (Complete/Starting/Near Done/Active/Recommended), progress text, hover "Mark Done" button. |
| `SkillCategory.jsx` | `default` | `{category, skills, onSkillClick, onMarkComplete, theme, progressColors, onCategoryUpdated, onCategoryDeleted}` | Category section with header (emoji + name + skill count), CRUD operations (edit name/emoji via `PUT /skills/groupings/categories/{id}`, delete via `DELETE`, add module via `POST`), category progress meter, learning modules panel, skills grid (1-4 cols responsive). |
| `SkillDetailModal.jsx` | `default` | `{skill, onClose, onUpdate, onRefresh, onMarkComplete}` | Complex modal (~1080 lines). Proficiency selector (0-5 scale, level 3+ counts for matching), module tracking with start/complete/proof workflow, AI learning content generation (`generateModuleContent`), task tracking with optimistic updates (`toggleModuleTask`), EY and external learning resources, proof submission (description/link/file upload with AI review), skill decay warning. |
| `SkillExtractionPreview.jsx` | `default` | `{extractedSkills, onConfirm, onCancel}` | Preview modal for resume-extracted skills. Toggle selection, inline edit name/category, shows confidence %, confirm adds selected skills. |
| `SkillProgressRing.jsx` | `default` | `{percentage, size='medium', strokeWidth=3, progressColors}` | SVG circular progress with green gradient. Sizes: small (48px), medium (64px), large (96px). Default gradient: dark green to light green. |
| `SkillsDashboard.jsx` | `default` | none (uses `useSkillsContext()`, `useTheme()`) | Main skills container. Header with overall progress ring, stat cards (active/completed), Add Skill button. Empty state prompts resume upload. Integrates SkillSearchBar, SkillsPortfolio, SkillDetailModal, AddSkillModal, ResumeUpload. Syncs selectedSkill on skills array refresh. |
| `SkillSearchBar.jsx` | `default` | `{filterTab, onFilterChange, onSearchChange, theme}` | Filter tabs (All Skills / In Progress / Recommended) + debounced search input (300ms). |
| `SkillsPortfolio.jsx` | `default` | `{skills, filterTab, searchQuery, onSkillClick, onMarkComplete, theme, progressColors}` | Portfolio grid organizing skills by category. Supports dynamic AI-generated categories from context or fallback to SKILL_CATEGORIES. Filters by tab (all/active/recommended) and search query. Groups skills by categoryId or name match. |
| `ThemeSwitcher.jsx` | `DARK_THEME`, `LIGHT_THEME`, `THEME`, `PROGRESS_COLORS` | N/A (config export) | Theme configuration objects for Skills Dashboard. DARK_THEME: glass effect, white text, rgba backgrounds. LIGHT_THEME: white cards, dark text. Both use EY yellow (#FFE600) primary button. PROGRESS_COLORS: green gradient (#166534 to #4ade80). |

### 2.9 Success Patterns Components (`components/successPatterns/`) -- 8 files (TSX)

| File | Export | Props | Description |
|------|--------|-------|-------------|
| `DepartmentDistributionChart.tsx` | `default` | `{data: DepartmentData[], onDepartmentClick?}` | Recharts donut PieChart with custom percentage labels (stroke outline for contrast), fixed tooltip area on right, click-to-filter. Colors: EY yellow, grays. |
| `FilterControls.tsx` | `default`, `FilterOptions` | `{onFilterChange}` | Filter bar with Department (Advisory/Tax/Consulting/Audit), Role Level (Analyst/Consultant/Manager/Director), Time Period (All time/5yr/10yr) dropdowns. URL search param sync. Apply + Clear buttons. Active filter indicator. |
| `MetricCards.tsx` | `default` | `{metrics: SuccessPatternMetrics, transitionCount?, employeeCount?}` | 4-card grid showing Career Transitions, Avg Time to Promotion (years), Overall Success Rate (%), Sample Size. EY yellow (#FFE600) accent icons. Glassmorphic dark cards. |
| `SkillFrequencyChart.tsx` | `default` | `{data: SkillFrequency[]}` | Recharts horizontal BarChart showing top 10 skills by frequency. EY yellow bars. Custom tooltip with skill name + frequency %. |
| `SortableWidget.tsx` | `default` | `{id: string, enabled: boolean, children: ReactNode}` | dnd-kit sortable wrapper. Shows "Drag" button when enabled. Reduces opacity when dragging. Uses `useSortable` hook. |
| `SuccessPatternPage.tsx` | `default` | none | Main page component. Fetches data via `getSuccessPatterns`. Loading/error/empty states. Widget layout with drag-and-drop reorder via dnd-kit (4 widgets: successRate, timeToPromotion, skillFrequency, departmentDistribution). Layout persistence in localStorage (`springais.successPatterns.layout.v1`). Rearrange mode with confirm/cancel. |
| `SuccessRateChart.tsx` | `default` | `{data: TransitionData[]}` | Recharts vertical BarChart. Color-coded bars: >70% = #FFE600 (yellow), >50% = #C4C4CD (light gray), else #52525B (dark). Custom tooltip with success rate + sample size. Sorted by success rate descending. |
| `TimeToPromotionChart.tsx` | `default` | `{data: {[department: string]: StageData[]}}` | Recharts multi-line LineChart. One line per department (Advisory=#FFE600, Tax=#A1A1AA, Consulting=#71717A, Audit=#52525B). Shows avg years per career stage. Custom tooltip with all department values. |

---

## 3. Pages and Routes

### Route Configuration (`App.tsx`)

All routes use `React.lazy()` with `Suspense` fallback (loading spinner).

| Path | Component | Layout | Auth | Account Type |
|------|-----------|--------|------|-------------|
| `/login` | `LoginPage` | none | public | - |
| `/register` | `RegisterPage` | none | public | - |
| `/forgot-password` | `ForgotPasswordPage` | none | public | - |
| `/` | `DashboardPage` | `MainLayout` | required | personal |
| `/matches` | `MatchesPage` | `MainLayout` | required | personal |
| `/match/:matchId` | `MatchDetailPage` | `MainLayout` | required | personal |
| `/role/:roleId` | `RoleDetailPage` | `MainLayout` | required | personal |
| `/skills` | `SkillsPage` | `MainLayout` | required | personal |
| `/career-path` | `CareerPathPage` | `MainLayout` | required | personal |
| `/roadmap/:matchId` | `RoadmapPage` | `MainLayout` | required | personal |
| `/success-patterns` | `SuccessPatternsPage` | `MainLayout` | required | personal |
| `/hm` | `HMDashboardPage` | `HMLayout` | required | hiring_manager |
| `/hm/candidates` | `HMCandidatesPage` | `HMLayout` | required | hiring_manager |
| `/hm/matches` | `HMMatchesPage` | `HMLayout` | required | hiring_manager |
| `/hm/analytics` | `HMAnalyticsPage` | `HMLayout` | required | hiring_manager |

### Page Components (`pages/`) -- 9 files (TSX)

| File | Description |
|------|-------------|
| `DashboardPage.tsx` | Personal dashboard (placeholder structure) |
| `MatchesPage.tsx` | Wraps `MatchResultsPage` component |
| `MatchDetailPage.tsx` | Uses `useParams()` for matchId, shows `MatchDetailsModal` |
| `RoleDetailPage.tsx` | Tab-based role detail (Overview, Skills Gap, Path To, Success Patterns) |
| `SkillsPage.tsx` | Wraps `SkillsDashboard` component |
| `CareerPathPage.tsx` | Wraps `CareerVisualization` component |
| `RoadmapPage.tsx` | Wraps `RoadmapViewer` in `RoadmapProvider` |
| `SuccessPatternsPage.tsx` | Wraps `SuccessPatternPage` component |
| `HMDashboardPage.tsx` | Hiring manager dashboard (placeholder) |

### Layout Components (`components/layout/`) -- 8 files

| File | Description |
|------|-------------|
| `MainLayout.tsx` | Personal account layout. Sidebar navigation + main content area. Renders AdventureHUD + NotificationToasts in adventure mode. Uses `ThemeContext`. |
| `HMLayout.tsx` | Hiring manager layout. Similar sidebar pattern for HM routes. |
| `Sidebar.tsx` | Navigation sidebar for personal accounts. Links: Dashboard, Matches, Skills, Career Path, Success Patterns. Active route highlighting. |
| `HMSidebar.tsx` | Navigation sidebar for hiring managers. Links: Dashboard, Candidates, Matches, Analytics. |
| `Header.tsx` | Top header with user greeting, notifications, ThemeSwitcher. |
| `ProtectedRoute.tsx` | Route guard checking `useAuth().isAuthenticated`. Redirects to `/login`. |
| `AccountTypeRoute.tsx` | Route guard checking `useAuth().user.accountType`. Redirects personal users away from HM routes and vice versa. |
| `index.ts` | Barrel exports for layout components. |

---

## 4. State Management

### Context Providers (9 total, `context/`)

| Context | File | State Shape | Key Methods | Notes |
|---------|------|-------------|-------------|-------|
| **AuthContext** | `AuthContext.tsx` | `{user, token, isAuthenticated, isLoading}` | `login(email, pw)`, `register(name, email, pw)`, `logout()` | JWT token in localStorage. Dual account types: `personal` / `hiring_manager`. Auto-logout on 401. |
| **ThemeContext** | `ThemeContext.tsx` | `{theme: 'light'\|'dark'\|'game', isDark, isGame}` | `setTheme(theme)` | Persists to localStorage. Game theme = medieval fantasy. CSS custom properties applied to `<html>`. |
| **AdventureContext** | `AdventureContext.tsx` | `{xp, gold, level, achievements[], loginStreak, notifications[], isAdventureMode}` | `addXP(amount)`, `addGold(amount)`, `spendGold(amount)`, `unlockAchievement(id)`, `completeMiniGame(result)`, `toggleAdventureMode()` | 14 predefined achievements. Level = floor(xp/100). Persists to localStorage. Streak tracking by day. |
| **MatchesContext** | `MatchesContext.tsx` | `{matches[], allMatches[], isLoading, hasMore, savedMatches[]}` | `loadMatches()`, `loadMoreMatches()`, `saveMatch(id)`, `unsaveMatch(id)`, `getMatchById(id)` | Progressive loading with BATCH_SIZE=20. 5-min cache TTL. Fetches from `GET /api/matches/batch`. |
| **SkillsContext** | `SkillsContext.tsx` | `{skills[], selectedSkill, filterTab, searchQuery, skillCategories[]}` | `addSkill()`, `updateSkill()`, `clearSkills()`, `fetchSkillsWithProgress()`, `generateSkillGroupings()`, `markSkillComplete()` | Fetches from `GET /api/skills/progress`. AI grouping via `POST /api/skills/groupings`. Category CRUD. |
| **RoadmapContext** | `RoadmapContext.tsx` | `{roadmap, isLoading, error, editMode, chatMessages[]}` | `generateRoadmap(matchId)`, `toggleMilestone()`, `addExtra()`, `removeExtra()`, `sendChatMessage()`, `applyAIEdits()`, `previewAIEdits()` | Uses `useReducer` with 17 action types. Most complex context. AI edit preview/apply flow. |
| **CareerPathContext** | `CareerPathContext.tsx` | `{graphData, selectedNode, goalNode}` | `setGoalNode()`, `fetchGraph()` | Career graph data from `GET /api/career-graph`. |
| **HMContext** | `HMContext.tsx` | `{candidates[], jobs[], analytics}` | `fetchCandidates()`, `fetchJobs()`, `fetchAnalytics()` | Hiring manager data context. |
| **NotificationContext** | `NotificationContext.tsx` | `{notifications[], unreadCount}` | `addNotification()`, `markRead(id)`, `clearAll()` | In-app notification system. |

### Provider Hierarchy (in `App.tsx`)

```
QueryClientProvider
  AuthProvider
    ThemeProvider
      AdventureProvider
        MatchesProvider
          SkillsProvider
            NotificationProvider
              Router
                Routes...
```

---

## 5. Services / API Layer

### HTTP Client (`lib/api.ts`)

- Custom `APIClient` class wrapping Axios
- Base URL: `http://localhost:8000/api` (or `VITE_API_URL`)
- Auth interceptor: adds `Authorization: Bearer {token}` header
- 401 response interceptor: auto-logout + redirect to `/login`
- Methods: `get<T>()`, `post<T>()`, `put<T>()`, `delete<T>()`, `patch<T>()`

### Service Files (`services/`) -- 9 files

| Service | Key Functions | API Endpoints |
|---------|---------------|--------------|
| `api.ts` | `APIClient` instance | Base HTTP client |
| `authService.ts` | `login()`, `register()`, `getProfile()` | `POST /auth/login`, `POST /auth/register`, `GET /auth/me` |
| `matchService.ts` | `getMatches()`, `getMatchById()`, `getMatchesBatch()`, `fetchDeepAnalysis()` | `GET /matches`, `GET /matches/{id}`, `GET /matches/batch`, `GET /matches/{id}/deep-analysis` |
| `skillService.ts` | `getSkills()`, `addSkill()`, `uploadResume()`, `getSkillGroupings()`, `generateSkillGroupings()` | `GET /skills`, `POST /skills`, `POST /skills/upload`, `GET /skills/groupings`, `POST /skills/groupings` |
| `skillProgressService.ts` | `getSkillsWithProgress()`, `updateProficiency()`, `completeModule()`, `completeModuleWithProof()`, `uploadModuleProof()`, `generateModuleContent()`, `toggleModuleTask()`, `completeSkill()` | `GET /skills/progress`, `PUT /skills/{name}/proficiency`, `POST /skills/{name}/modules/{id}/complete`, `POST /skills/{name}/modules/{id}/complete-with-proof`, `POST /skills/{name}/modules/{id}/proof`, `POST /skills/{name}/modules/{id}/content`, `POST /skills/{name}/modules/{id}/tasks/{idx}/toggle`, `POST /skills/{name}/complete` |
| `careerGraphService.ts` | `fetchCareerGraph()` | `GET /career-graph` |
| `roadmapService.ts` | `generateRoadmap()`, `getRoadmap()`, `updateRoadmap()`, `sendChatMessage()`, `previewAIEdits()`, `applyAIEdits()` | `POST /roadmap/generate`, `GET /roadmap/{id}`, `PUT /roadmap/{id}`, `POST /roadmap/{id}/chat`, `POST /roadmap/{id}/preview-edits`, `POST /roadmap/{id}/apply-edits` |
| `successPatternService.ts` | `getSuccessPatterns()` | `GET /patterns/success` (with filter query params) |
| `hmService.ts` | `getCandidates()`, `getJobs()`, `getAnalytics()` | `GET /hm/candidates`, `GET /hm/jobs`, `GET /hm/analytics` |

### Exported Types from Services

- `matchService.ts`: `Match`, `MatchSkill`, `DeepAnalysis`, `SkillImpact`, `SuccessFactor`, `RiskFactor`
- `skillService.ts`: `Skill`, `SkillCategory`, `SkillGrouping`
- `skillProgressService.ts`: `SkillWithProgress`, `Module`, `PROFICIENCY_LABELS` (array: None/Novice/Beginner/Intermediate/Advanced/Expert)
- `successPatternService.ts`: `SuccessPatternsData`, `SuccessPatternMetrics`, `TransitionData`, `StageData`, `SkillFrequency`, `DepartmentData`, `FilterOptions`
- `careerGraphService.ts`: `CareerGraphData`, `CareerRole`, `CareerTransition`
- `roadmapService.ts`: `Roadmap`, `Phase`, `Milestone`, `Extra`, `ChatMessage`

---

## 6. Custom Hooks

| Hook | File | Signature | Description |
|------|------|-----------|-------------|
| `useDebounce` | `hooks/useDebounce.ts` | `<T>(value: T, delay: number): T` | Generic debounce hook. Returns debounced value after specified delay. |
| `useLocalStorage` | `hooks/useLocalStorage.ts` | `<T>(key: string, initialValue: T): [T, (value: T) => void]` | Persists state to localStorage with JSON serialization. |

---

## 7. Data and Configuration Files

| File | Purpose | Key Exports |
|------|---------|-------------|
| `data/achievements.ts` | 14 predefined achievements | `ACHIEVEMENTS[]` -- each with id, name, description, icon (emoji), xp reward, gold reward, condition |
| `data/gameThemes.ts` | Medieval fantasy theme configuration | `GAME_THEME` object with colors, fonts (Cinzel, Spectral, MedievalSharp), icon set, level titles (Squire, Knight, Baron, Count, Duke, King) |
| `mocks/mockSkills.js` | Skill category definitions + mock learning resources | `SKILL_CATEGORIES[]` (7 categories: programming, cloud, data, security, leadership, domain, tools), `generateDefaultLearningResources(skill)` |

### SKILL_CATEGORIES (from `mockSkills.js`)

| ID | Name | Emoji |
|----|------|-------|
| `programming` | Programming & Development | rocket |
| `cloud` | Cloud & Infrastructure | cloud |
| `data` | Data & Analytics | chart_with_upwards_trend |
| `security` | Security & Compliance | shield |
| `leadership` | Leadership & Management | briefcase |
| `domain` | Domain Expertise | bulb |
| `tools` | Tools & Platforms | wrench |

---

## 8. Mocks

| File | Exports | Description |
|------|---------|-------------|
| `mocks/mockSkills.js` | `SKILL_CATEGORIES`, `generateDefaultLearningResources` | 7 skill categories with id/name/emoji. Resource generator creates course/practice/certification links based on skill name. |

---

## 9. Entry Points

| File | Role |
|------|------|
| `index.html` | HTML shell. `<div id="root">`. Loads `/src/main.tsx`. Google Fonts: Cinzel, Spectral, MedievalSharp. |
| `main.tsx` | React 18 `createRoot` entry. Renders `<App />` with `StrictMode`. Imports `index.css`. |
| `App.tsx` | Root component. Provider hierarchy. Route definitions with lazy loading. `QueryClient` config: 5min staleTime, 10min gcTime, no refetch on window focus. |

---

## 10. Styling

### TailwindCSS v4 Configuration

- **Config**: `tailwind.config.js` with `@theme` directive (v4 approach)
- **PostCSS**: `postcss.config.js` uses `@tailwindcss/postcss`
- **Entry CSS**: `index.css` with Tailwind v4 imports

### EY Brand Colors (used throughout)

| Name | Value | Usage |
|------|-------|-------|
| `ey-yellow` | `#FFE600` | Primary accent, buttons, highlights, progress rings |
| `ey-yellow-dark` | `#e6cf00` | Button hover states |
| `ey-confident-black` | `#2E2E38` | Primary text, dark backgrounds |
| `ey-off-white` | `#F6F6FA` | Light backgrounds, hover states |
| `ey-gray` | Various | Secondary text, borders |

### Theme System

Three themes managed by `ThemeContext`:

1. **Light**: White cards, dark text, slate headers. Standard professional look.
2. **Dark**: Glass-effect cards (`rgba(255,255,255,0.07)`), white text, dark backgrounds with backdrop blur.
3. **Game (Medieval)**: Dark theme base + medieval fantasy overlay. Custom fonts (Cinzel for headings, Spectral for body, MedievalSharp for accents). Level titles (Squire through King). Castle/sword iconography.

### Component-Level Theme Patterns

- **Skills Dashboard** (`ThemeSwitcher.jsx`): Exports `DARK_THEME` and `LIGHT_THEME` objects with comprehensive token system (headerBg, cardBg, cardBorder, badges, tabs, category, search).
- **Success Patterns**: Consistently uses glassmorphic dark style (`border border-white/15 bg-white/7 rounded-sm shadow-2xl backdrop-blur-md`).
- **Game Components**: Conditional styling based on `isGame` from ThemeContext. Game mode adds Framer Motion animations, medieval fonts, shimmer effects.

### CSS Animation Classes (referenced in code)

- `animate-fadeIn` -- used in modals
- `animate-spin` -- loading spinners
- `animate-bounce` -- achievement unlock
- `animate-wiggle` -- skill plan node customization mode
- Framer Motion: `whileHover`, `whileTap`, `initial/animate/exit` transitions throughout game components

---

## 11. Test Files

### Test Summary (`TESTING-SUMMARY.md`)

- **Framework**: Vitest + React Testing Library
- **Coverage Target**: Not specified in config
- **Test Location**: Tests appear to be co-located or in `__tests__/` directories
- **ESLint**: `.eslintrc.cjs` configured with React + TypeScript rules

### Configuration

- **Vitest**: Configured in `vite.config.ts` (test section)
- **ESLint**: `.eslintrc.cjs` with `eslint:recommended`, `@typescript-eslint/recommended`, `react-hooks/recommended`

---

## 12. Key Architecture Patterns

### Progressive Loading (Matches)

- `MatchesContext` fetches matches in batches of 20
- 5-minute cache TTL to avoid redundant API calls
- Virtual scrolling (`VirtualMatchList`) kicks in at 50+ matches with 5-item overscan
- Pagination at 10 items per page

### AI-Powered Features

- **Resume Skill Extraction**: Upload resume -> backend extracts skills -> preview/select -> AI generates skill groupings
- **Skill Learning Content**: On-demand AI generation per module (`generateModuleContent`)
- **Roadmap Generation**: AI generates personalized learning roadmap for target role
- **Roadmap AI Editing**: Preview suggested edits -> apply/cancel flow
- **Roadmap Chat Assistant**: Context-aware chat about the user's roadmap
- **Deep Analysis**: GPT-5.2 powered analysis for match details (skill impacts, success factors, risk factors, ramp-up time)
- **Skill Plan Generation**: `POST /api/skills/plan/{jobId}` generates radial skill tree

### Graph Visualization

- **Career Graph**: ReactFlow with custom RoleNode/TransitionEdge, dagre layout, BFS shortest path for goal highlighting
- **Skill Plan Tree**: ReactFlow with radial layout algorithm, custom SkillNode/SkillPlanEdge, edge bundling, draggable nodes in customize mode

### Gamification System

- XP and gold currency with level progression (XP/100)
- 14 achievements with unlock conditions
- Login streak tracking (consecutive days)
- CoinFlip mini-game (10/25/50/100 gold bets, 50/50 odds)
- Toast notifications for XP gain, gold gain, achievement unlock, level-up
- Medieval fantasy theme ("Adventure Mode") with custom fonts and iconography
- Adventure HUD overlay on all personal pages when enabled

### Dual Account System

- **Personal** (`/`): Skills portfolio, match finding, career path, roadmap, success patterns
- **Hiring Manager** (`/hm/`): Candidate management, job matches, analytics
- Separate layouts (`MainLayout` vs `HMLayout`), sidebars, and route guards (`AccountTypeRoute`)

### localStorage Persistence

| Key Pattern | Data |
|-------------|------|
| Auth token | JWT bearer token |
| Theme preference | `light` / `dark` / `game` |
| Adventure mode state | XP, gold, level, achievements, login streak |
| Skill plan node positions | Dragged node positions per role |
| Widget layout (Success Patterns) | `springais.successPatterns.layout.v1` -- widget order array |
| Widget layout (Role Detail) | Widget order for role success patterns |

---

## 13. File Count Summary

| Directory | Count | Extension |
|-----------|-------|-----------|
| `components/auth/` | 4 | .tsx |
| `components/common/` | 2 | .tsx |
| `components/career-viz/` | 10 | .tsx/.ts |
| `components/game/` | 8 | .tsx |
| `components/layout/` | 8 | .tsx/.ts |
| `components/matches/` | 9 | .tsx |
| `components/roadmap/` | 11 | .tsx |
| `components/role-detail/` | 5 | .tsx |
| `components/skills/` | 11 | .jsx |
| `components/successPatterns/` | 8 | .tsx |
| `context/` | 9 | .tsx |
| `services/` | 9 | .ts |
| `hooks/` | 2 | .ts |
| `lib/` | 1 | .ts |
| `data/` | 2 | .ts |
| `mocks/` | 1 | .js |
| `pages/` | 9 | .tsx |
| Config files | 8 | various |
| **Total** | ~117 | |

---

## 14. Notable Technical Debt / Observations

1. **Mixed JSX/TSX**: Skills components are `.jsx` while rest of app is `.tsx`. Indicates these were written before TypeScript migration or by a different team.
2. **ForgotPasswordPage**: Placeholder only, shows demo credentials, notes "Block M will connect real auth + email".
3. **Direct DOM manipulation**: `AddSkillModal.jsx` uses `document.getElementById('proficiency-value').textContent` instead of React state for proficiency display.
4. **Large component**: `SkillDetailModal.jsx` is ~1080 lines with many responsibilities (view, edit, modules, proof, content generation, task tracking).
5. **Mock filter options**: `MatchFilters.tsx` uses `MOCK_FILTER_OPTIONS` for dropdown values instead of fetching from API.
6. **Inline styles**: Skills components heavily use inline `style={{}}` for theming rather than Tailwind classes, creating inconsistency with the rest of the codebase.
7. **Console.log statements**: `SkillDetailModal.jsx` contains debug console.log statements that should be removed for production.
8. **No error boundaries**: No React error boundaries found in the component tree.
9. **window.confirm/alert**: `SkillCategory.jsx` and `SkillDetailModal.jsx` use `confirm()` and `alert()` for user prompts instead of custom modals.
10. **Duplicate theme logic**: Theme is managed both by `ThemeContext` (global) and local theme objects in `skills/ThemeSwitcher.jsx`, creating potential inconsistency.
