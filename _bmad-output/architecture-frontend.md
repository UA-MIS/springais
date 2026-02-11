# SpringAIS Frontend Architecture

**Generated**: 2026-02-11
**Source**: `frontend/` directory scan findings

---

## 1. High-Level Architecture

The frontend is a React 18 single-page application written in TypeScript (with some JSX for skills components). It follows a context-driven state management pattern with a service layer for API communication.

```
                    ┌────────────────────────────────┐
                    │           App.tsx               │
                    │   Provider Hierarchy + Routes   │
                    └────────────┬───────────────────┘
                                 │
                    ┌────────────┴───────────────────┐
                    │       Context Providers (9)     │
                    │  Auth, Theme, Adventure,        │
                    │  Matches, Skills, Roadmap,      │
                    │  CareerPath, HM, Notification   │
                    └────────────┬───────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                    │
     ┌────────┴────────┐  ┌─────┴──────┐  ┌────────┴────────┐
     │  Layout Layer   │  │   Pages    │  │  Components     │
     │  MainLayout     │  │  9 pages   │  │  76 components  │
     │  HMLayout       │  │  (lazy)    │  │  10 directories │
     │  Sidebar/Header │  └─────┬──────┘  └────────┬────────┘
     └─────────────────┘        │                   │
                                └───────┬───────────┘
                                        │
                              ┌─────────┴──────────┐
                              │   Services Layer   │
                              │   9 service files  │
                              │   Axios APIClient  │
                              └─────────┬──────────┘
                                        │
                                        v
                              ┌─────────────────────┐
                              │  FastAPI Backend     │
                              │  http://localhost:8000│
                              └─────────────────────┘
```

---

## 2. Component Hierarchy

### Provider Tree (App.tsx)

```
QueryClientProvider (TanStack React Query)
  └── AuthProvider
      └── ThemeProvider
          └── AdventureProvider
              └── MatchesProvider
                  └── SkillsProvider
                      └── NotificationProvider
                          └── BrowserRouter
                              └── Routes (React Router v6)
```

### Layout Structure

**Personal Account Layout** (`MainLayout.tsx`):
```
┌─────────────────────────────────────────┐
│  Header (user greeting, ThemeSwitcher)  │
├────────┬────────────────────────────────┤
│        │                                │
│ Sidebar│       Page Content             │
│ (nav)  │       (lazy loaded)            │
│        │                                │
├────────┴────────────────────────────────┤
│  [AdventureHUD + NotificationToasts]    │  (when adventure mode enabled)
└─────────────────────────────────────────┘
```

**Hiring Manager Layout** (`HMLayout.tsx`):
```
┌─────────────────────────────────────────┐
│  Header                                 │
├────────┬────────────────────────────────┤
│ HM     │                                │
│ Sidebar│       HM Page Content          │
│ (nav)  │                                │
└────────┴────────────────────────────────┘
```

### Component Directory Map

```
components/
├── auth/              (4 files)  Login, Register, ForgotPassword, Logout
├── common/            (2 files)  ProgressRing, SkillTag (shared UI atoms)
├── career-viz/       (10 files)  Career graph (ReactFlow), layout utils, transforms
├── game/              (8 files)  Adventure HUD, achievements, coin flip, themed UI
├── layout/            (8 files)  MainLayout, HMLayout, Sidebar, Header, route guards
├── matches/           (9 files)  Match cards, filters, sort, virtual list, details modal
├── roadmap/          (11 files)  Roadmap viewer, tabs, milestones, chat assistant, editing
├── role-detail/       (5 files)  Role overview, skill gap, path planning, success patterns
├── skills/           (11 files)  Dashboard, categories, modules, resume upload, search
└── successPatterns/   (8 files)  Charts (Recharts), filters, sortable widgets (dnd-kit)
```

---

## 3. Routing Configuration

All routes use `React.lazy()` with `Suspense` fallback for code splitting.

### Personal Routes (requires auth, account_type = "personal")

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `DashboardPage` | Personal dashboard |
| `/matches` | `MatchesPage` | Job match results with progressive loading |
| `/match/:matchId` | `MatchDetailPage` | Detailed match view with deep analysis |
| `/role/:roleId` | `RoleDetailPage` | Role detail with tabs (Overview, Skills Gap, Path To, Patterns) |
| `/skills` | `SkillsPage` | Skills portfolio and learning dashboard |
| `/career-path` | `CareerPathPage` | Interactive career graph visualization |
| `/roadmap/:matchId` | `RoadmapPage` | AI-generated career roadmap viewer |
| `/success-patterns` | `SuccessPatternsPage` | Career transition analytics |

### Hiring Manager Routes (requires auth, account_type = "hiring_manager")

| Path | Component | Description |
|------|-----------|-------------|
| `/hm` | `HMDashboardPage` | Hiring manager dashboard |
| `/hm/candidates` | `HMCandidatesPage` | Anonymized candidate management |
| `/hm/matches` | `HMMatchesPage` | Job-candidate matches |
| `/hm/analytics` | `HMAnalyticsPage` | Hiring analytics |

### Public Routes

| Path | Component |
|------|-----------|
| `/login` | `LoginPage` |
| `/register` | `RegisterPage` |
| `/forgot-password` | `ForgotPasswordPage` |

### Route Guards

- **`ProtectedRoute`**: Checks `useAuth().isAuthenticated`, redirects to `/login` if false
- **`AccountTypeRoute`**: Checks `useAuth().user.accountType`, redirects personal users away from `/hm/*` routes and vice versa

---

## 4. State Management

### Context Provider Details

| Context | State | Key Methods | Persistence |
|---------|-------|-------------|-------------|
| **AuthContext** | user, token, isAuthenticated, isLoading | login(), register(), logout() | localStorage (JWT token) |
| **ThemeContext** | theme ('light'/'dark'/'game'), isDark, isGame | setTheme() | localStorage |
| **AdventureContext** | xp, gold, level, achievements, loginStreak, notifications, isAdventureMode | addXP(), addGold(), spendGold(), unlockAchievement(), completeMiniGame(), toggleAdventureMode() | localStorage |
| **MatchesContext** | matches[], allMatches[], isLoading, hasMore, savedMatches[] | loadMatches(), loadMoreMatches(), saveMatch(), unsaveMatch(), getMatchById() | 5-min memory cache |
| **SkillsContext** | skills[], selectedSkill, filterTab, searchQuery, skillCategories[] | addSkill(), updateSkill(), clearSkills(), fetchSkillsWithProgress(), generateSkillGroupings(), markSkillComplete() | None |
| **RoadmapContext** | roadmap, isLoading, error, editMode, chatMessages[] | generateRoadmap(), toggleMilestone(), addExtra(), removeExtra(), sendChatMessage(), applyAIEdits(), previewAIEdits() | None |
| **CareerPathContext** | graphData, selectedNode, goalNode | setGoalNode(), fetchGraph() | None |
| **HMContext** | candidates[], jobs[], analytics | fetchCandidates(), fetchJobs(), fetchAnalytics() | None |
| **NotificationContext** | notifications[], unreadCount | addNotification(), markRead(), clearAll() | None |

The RoadmapContext is the most complex, using `useReducer` with 17 action types for managing roadmap state, AI edits, and chat messages.

### TanStack React Query Configuration

Configured in `App.tsx` with:
- `staleTime`: 5 minutes
- `gcTime`: 10 minutes
- `refetchOnWindowFocus`: false

---

## 5. API Client Layer

### Primary Client (`lib/api.ts`)

The `APIClient` class wraps Axios with:
- **Base URL**: `VITE_API_URL` env var (default `http://localhost:8000`) with `/api` auto-appended
- **Auth interceptor**: Injects `Authorization: Bearer {token}` header from localStorage on every request
- **401 interceptor**: Auto-clears token and user from localStorage, redirects to `/login`
- **Network error handling**: Overrides error messages when `!error.response`
- **Methods**: `get<T>()`, `post<T>()`, `put<T>()`, `delete<T>()`, `patch<T>()`

### Auth Service (`services/authService.ts`)

Uses a **separate** Axios instance with:
- Base URL: `VITE_API_URL || 'http://localhost:8000'` (no `/api` suffix)
- Calls auth endpoints at `/auth/*` directly
- This is because the backend auth router is mounted without the `/api` prefix

### Service Files

| Service | Endpoints Called |
|---------|----------------|
| `authService.ts` | POST /auth/login, POST /auth/register, GET /auth/me |
| `matchService.ts` | GET /matches/employee/{id}, GET /matches/saved, POST /matches/save, DELETE /matches/saved/{id}, GET /matches/job/{id}/deep-analysis |
| `skillService.ts` | GET /skills, POST /skills, POST /skills/upload, GET/POST /skills/groupings |
| `skillProgressService.ts` | GET /skills/me/progress, POST /skills/{name}/start, PATCH /skills/{name}/modules/{id}/progress, POST /skills/{name}/modules/{id}/complete, POST /skills/{name}/modules/{id}/generate-content, POST /skills/{name}/modules/{id}/upload-proof, and 8 more |
| `careerGraphService.ts` | GET /career-graph |
| `roadmapService.ts` | POST /roadmap/generate, GET /roadmap/saved, GET/DELETE /roadmap/saved/{id}, POST /roadmap/saved/{id}/milestones/{id}/toggle, POST /roadmap/saved/{id}/chat/enhanced, POST /roadmap/saved/{id}/edit/ai, POST /roadmap/saved/{id}/edit/apply, and more |
| `successPatternService.ts` | GET /patterns/transitions (with filter query params) |
| `hmService.ts` | GET /hm/candidates, GET /hm/jobs, GET /hm/analytics |

---

## 6. Build and Bundle Configuration

### Vite Configuration (`vite.config.ts`)

- **Path alias**: `@` maps to `./src`
- **Dev server**: Port 3000, host `0.0.0.0`
- **No API proxy**: Frontend connects directly via `VITE_API_URL` (CORS required)
- **Test**: Vitest configuration embedded

### TypeScript Configuration (`tsconfig.json`)

- **Strict mode**: Enabled
- **Path alias**: `@/*` maps to `./src/*`
- **Target**: ES2020+

### PostCSS Configuration

- Uses `@tailwindcss/postcss` (TailwindCSS v4 approach)
- TailwindCSS v4 uses `@theme` directive instead of `tailwind.config.js` `theme.extend`

### Docker Configuration

**Development** (current Dockerfile):
- Base: `node:18-alpine`
- Runs `npm run dev -- --host` (Vite dev server)
- Bind mount for hot reload
- Named volume for `node_modules` isolation

**Production** (referenced but not wired):
- Multi-stage build: Node 20 build stage + nginx:alpine serve stage
- Serves built assets on port 80

---

## 7. Testing Strategy

### Framework

- **Unit/Component**: Vitest + React Testing Library
- **E2E**: Playwright listed in root `package.json` (no test files found)
- **Lint**: ESLint with `eslint:recommended`, `@typescript-eslint/recommended`, `react-hooks/recommended`

### Test Coverage

Minimal test files were found in the frontend scan. Testing infrastructure is configured but test coverage is limited.

---

## 8. Theme System

Three themes managed by `ThemeContext`:

### Light Theme
- White cards, dark text, slate headers
- Standard professional appearance

### Dark Theme
- Glassmorphic cards: `rgba(255,255,255,0.07)` with `backdrop-blur`
- White text on dark backgrounds
- Consistent with EY brand colors

### Game Theme (Medieval/Adventure)
- Dark theme base with medieval fantasy overlay
- Custom fonts: Cinzel (headings), Spectral (body), MedievalSharp (accents)
- Level titles: Squire, Knight, Baron, Count, Duke, King
- Castle/sword iconography
- Framer Motion animations throughout

### EY Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `ey-yellow` | `#FFE600` | Primary accent, buttons, progress rings |
| `ey-yellow-dark` | `#e6cf00` | Hover states |
| `ey-confident-black` | `#2E2E38` | Primary text, dark backgrounds |
| `ey-off-white` | `#F6F6FA` | Light backgrounds |

---

## 9. Key Libraries and Patterns

### Graph Visualization (ReactFlow)

Used in two distinct views:
1. **Career Graph** (`components/career-viz/`): Custom `RoleNode` and `TransitionEdge` components with dagre layout, BFS shortest path highlighting, department filtering, and search with 1-hop expansion
2. **Skill Plan Tree** (`components/career-viz/RoleRequirementTree.tsx`): Radial layout algorithm with custom `SkillNode` and `SkillPlanEdge`, edge bundling, draggable nodes in customize mode with localStorage persistence

### Charts (Recharts)

Used in success patterns for:
- Vertical bar charts (success rate by transition)
- Horizontal bar charts (skill frequency top 10)
- Donut pie charts (department distribution)
- Multi-line charts (time-to-promotion by department)

### Drag-and-Drop (dnd-kit)

Used for widget reorder in:
- `SuccessPatternPage.tsx`: 4 draggable chart widgets
- `RoleSuccessPatterns.tsx`: Draggable analytics widgets
- Layout persisted to localStorage

### Virtual Scrolling (@tanstack/react-virtual)

`VirtualMatchList.tsx` enables efficient rendering of 50+ match results with 5-item overscan.

### Framer Motion

Animations throughout game components:
- Entry animations (slide-in, scale)
- Hover/tap interactions (`whileHover`, `whileTap`)
- Toast notifications (slide-in, shake, scale)
- Achievement unlock (bounce)

### Forms (react-hook-form)

Used in `AddSkillModal.jsx` for skill creation form with validation.

### File Upload (react-dropzone)

`ResumeUpload.jsx` accepts PDF/DOC/DOCX/TXT files via drag-and-drop or click.

---

## 10. localStorage Persistence

| Key Pattern | Data | Used By |
|-------------|------|---------|
| Auth token | JWT bearer token | AuthContext |
| Theme preference | 'light' / 'dark' / 'game' | ThemeContext |
| Adventure state | XP, gold, level, achievements, login streak | AdventureContext |
| Skill plan node positions | Dragged node positions per role | RoleRequirementTree |
| Widget layout (Success Patterns) | `springais.successPatterns.layout.v1` | SuccessPatternPage |
| Widget layout (Role Detail) | Widget order array | RoleSuccessPatterns |
