# SpringAIS Frontend Development Guide

**Generated**: 2026-02-11
**Source**: `frontend/` directory scan findings

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 18+ | Alpine variant used in Docker; Node 20 for production build |
| npm | 9+ | Comes with Node.js |
| Docker | Latest | For containerized development |
| Docker Compose | v2+ | Multi-service orchestration |

---

## Project Setup

### Option 1: Docker (Recommended)

From the project root:

```bash
# Start all services (frontend + backend + postgres + redis)
docker compose up

# Start only the frontend
docker compose up frontend
```

The frontend will be available at `http://localhost:3000`.

**Docker configuration**:
- Image: `node:18-alpine`
- Bind mount: `./frontend:/app` (enables hot reload)
- Named volume: `frontend_node_modules:/app/node_modules` (isolates node_modules from host)
- Port: 3000
- Command: `npm run dev -- --host`

### Option 2: Local Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The Vite dev server runs on `http://localhost:3000` (configured in `vite.config.ts`).

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000` | Backend API base URL |

**Note**: Vite requires the `VITE_` prefix for environment variables to be exposed to the client bundle. Set these in a `.env` file in the `frontend/` directory or pass via Docker Compose.

---

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (port 3000, HMR enabled) |
| `npm run build` | Production build (TypeScript check + Vite build) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest tests |

---

## Build Configuration

### Vite (`vite.config.ts`)

- **Path alias**: `@` resolves to `./src` (use `@/components/...`, `@/services/...`, etc.)
- **Dev server port**: 3000
- **Dev server host**: `0.0.0.0` (accessible from Docker and external)
- **No API proxy configured**: Frontend connects directly to `VITE_API_URL` via browser (requires CORS)

### TypeScript (`tsconfig.json`)

- **Strict mode**: Enabled
- **Path aliases**: `@/*` resolves to `./src/*`
- **Target**: ES2020+

### PostCSS (`postcss.config.js`)

- Uses `@tailwindcss/postcss` (TailwindCSS v4 plugin)

### TailwindCSS (`tailwind.config.js`)

- TailwindCSS v4 with `@theme` directive
- Custom EY brand colors defined in theme
- PostCSS integration via `@tailwindcss/postcss`

### ESLint (`.eslintrc.cjs`)

- Extends: `eslint:recommended`, `@typescript-eslint/recommended`, `plugin:react-hooks/recommended`
- React hooks rules enforced

---

## Project Structure

```
frontend/src/
├── main.tsx              # Entry point (React 18 createRoot)
├── App.tsx               # Root: providers, routes, QueryClient
├── index.css             # TailwindCSS v4 imports
├── components/           # 76 UI components (10 subdirectories)
├── context/              # 9 React context providers
├── services/             # 9 API service files
├── hooks/                # 2 custom hooks (useDebounce, useLocalStorage)
├── lib/                  # Axios API client
├── pages/                # 9 page components
├── data/                 # Static data (achievements, game themes)
└── mocks/                # Mock data (skill categories)
```

### Key Files

| File | Purpose |
|------|---------|
| `App.tsx` | Provider hierarchy, route definitions, QueryClient config |
| `context/AuthContext.tsx` | JWT authentication (login, register, logout, auto-401) |
| `context/ThemeContext.tsx` | Theme management (light, dark, game) |
| `services/api.ts` | Axios API client with auth interceptor |
| `services/authService.ts` | Auth API calls (separate Axios instance for `/auth/*`) |

---

## API Client Architecture

### Main API Client (`lib/api.ts` or `services/api.ts`)

- Wraps Axios with `Authorization: Bearer {token}` interceptor
- Base URL: `${VITE_API_URL}/api` (auto-appends `/api`)
- Auto-logout on 401 responses (clears localStorage, redirects to `/login`)

### Auth Service (`services/authService.ts`)

- Separate Axios instance with base URL `${VITE_API_URL}` (no `/api` suffix)
- Auth routes are mounted at `/auth/*` on the backend without the `/api` prefix
- Handles: `POST /auth/login`, `POST /auth/register`, `GET /auth/me`

### Adding a New Service

1. Create a new file in `frontend/src/services/`
2. Import the API client: `import { apiClient } from '@/services/api'`
3. Define typed request/response interfaces
4. Export async functions that call `apiClient.get<T>()`, `apiClient.post<T>()`, etc.

---

## State Management Patterns

### Context Providers

The app uses 9 React Context providers nested in `App.tsx`:

```
QueryClientProvider -> AuthProvider -> ThemeProvider -> AdventureProvider
  -> MatchesProvider -> SkillsProvider -> NotificationProvider -> Router
```

### TanStack React Query

Configured with:
- `staleTime`: 5 minutes
- `gcTime`: 10 minutes
- `refetchOnWindowFocus`: false

Use for server state. Context providers handle client-side state.

### Adding a New Context

1. Create `frontend/src/context/NewContext.tsx`
2. Define state interface and context value interface
3. Use `useState` or `useReducer` for state management
4. Export `NewProvider` component and `useNew()` hook
5. Add `NewProvider` to the provider hierarchy in `App.tsx`

---

## Routing

### Adding a New Route

1. Create a page component in `frontend/src/pages/`
2. Add a lazy import in `App.tsx`: `const NewPage = lazy(() => import('@/pages/NewPage'))`
3. Add the route inside the appropriate layout:
   - Personal routes: inside `<Route element={<MainLayout />}>`
   - HM routes: inside `<Route element={<HMLayout />}>`
4. Wrap with `ProtectedRoute` for auth and `AccountTypeRoute` for account type enforcement

### Route Guards

- `ProtectedRoute`: Checks `useAuth().isAuthenticated`
- `AccountTypeRoute`: Checks `useAuth().user.accountType` matches expected type

---

## Styling Guide

### TailwindCSS v4

Use Tailwind utility classes as the primary styling approach:
```tsx
<div className="bg-white/7 border border-white/15 rounded-sm shadow-2xl backdrop-blur-md">
```

### EY Brand Colors

| Token | Value | Usage |
|-------|-------|-------|
| `ey-yellow` | `#FFE600` | Primary accent |
| `ey-confident-black` | `#2E2E38` | Primary text |
| `ey-off-white` | `#F6F6FA` | Light backgrounds |

### Theme System

Three themes via `ThemeContext`:
1. **Light**: White cards, dark text
2. **Dark**: Glassmorphism (`backdrop-blur`, `rgba` backgrounds)
3. **Game**: Medieval fantasy overlay (Cinzel/Spectral/MedievalSharp fonts)

Access theme: `const { theme, isDark, isGame } = useTheme()`

### Skills Components (JSX)

Skills components use inline `style={{}}` objects from `ThemeSwitcher.jsx` exports (`DARK_THEME`, `LIGHT_THEME`). This is an existing pattern; new skills components should follow the same convention for consistency.

---

## Testing

### Framework

- **Unit/Component**: Vitest + React Testing Library
- **Config**: Embedded in `vite.config.ts`

### Running Tests

```bash
npm test           # Run tests
npm run test:watch # Watch mode
```

### Writing Tests

Place test files alongside components or in `__tests__/` directories:
```
components/matches/MatchCard.tsx
components/matches/__tests__/MatchCard.test.tsx
```

---

## Common Patterns

### Progressive Loading (Matches)

`MatchesContext` loads matches in batches of 20 with 5-minute cache TTL. Virtual scrolling kicks in at 50+ items.

### AI-Powered Features

Several components trigger AI operations:
- `ResumeUpload.jsx` -> skill extraction + grouping
- `SkillDetailModal.jsx` -> learning content generation
- `RoadmapViewer.tsx` -> roadmap generation, AI chat, AI editing
- `MatchDetailsModal.tsx` -> deep analysis

### localStorage Keys

| Key | Data |
|-----|------|
| `token` | JWT auth token |
| `theme` | Theme preference |
| Adventure state keys | XP, gold, achievements |
| `springais.successPatterns.layout.v1` | Widget order |
| Skill plan node positions | Per-role dragged positions |

---

## Known Technical Debt

1. Skills components (`.jsx`) predate TypeScript migration -- rest of app is `.tsx`
2. `SkillDetailModal.jsx` is ~1080 lines and handles many responsibilities
3. `MatchFilters.tsx` uses `MOCK_FILTER_OPTIONS` instead of API data
4. `ForgotPasswordPage.tsx` is a placeholder (not functional)
5. No React error boundaries in the component tree
6. `window.confirm()` / `window.alert()` used in some skills components
7. Debug `console.log` statements remain in `SkillDetailModal.jsx`
