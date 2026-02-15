# SpringAIS Codebase Analysis - Medieval Mode Overhaul

**Date**: 2026-02-11
**Author**: Researcher Agent
**Purpose**: Comprehensive codebase analysis for the medieval mode economy and progression system overhaul.

---

## 1. Executive Summary

SpringAIS (also called "SkillBridge") is an AI-powered talent mobility platform built with a **Python/FastAPI backend** and **React/TypeScript frontend**. It matches employees to jobs, generates career roadmaps, and tracks skill development.

The app currently has a basic "Adventure Mode" gamification layer with XP, gold, achievements, and a medieval theme. **The critical bug is that ALL progression data (XP, gold, achievements, login streak, visited pages) is stored exclusively in browser `localStorage`**, meaning:
- Progression is lost when clearing browser data
- Progression is NOT tied to user accounts
- Different browsers/devices show different progression
- There is ZERO server-side persistence for gamification state

---

## 2. Project Architecture Overview

### 2.1 Technology Stack

| Layer | Technology | Details |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript | Vite build, TailwindCSS 4, react-router-dom 6 |
| **State Management** | React Context + @tanstack/react-query | Contexts for Auth, Theme, AdventureMode, Skills, Matches, Roadmap |
| **Backend** | Python 3.11 + FastAPI | Uvicorn server, Pydantic v2 schemas |
| **Database** | PostgreSQL 16 + pgvector | SQLAlchemy 2.0 ORM, psycopg3 driver |
| **Cache** | Redis 7 | Used for match caching, connection pooling |
| **AI/ML** | OpenAI (text-embedding-3-large) | LangChain, scikit-learn PCA |
| **Auth** | JWT (HS256) + bcrypt | Custom implementation, 7-day token expiry |
| **Containerization** | Docker Compose | 4 services: postgres, redis, backend, frontend |

### 2.2 Directory Structure

```
SpringAIS/
  backend/
    app/
      config/           # matching_config.py
      config.py          # Redis/OpenAI clients (singleton)
      database.py        # SQLAlchemy engine + session
      main.py            # FastAPI app entrypoint
      data/              # badge_seed.py
      jobs/              # badge_refresh.py
      models/            # SQLAlchemy models (13 model files)
      routes/            # API route handlers (7 routers)
      schemas/           # Pydantic schemas (7 schema files)
      services/          # Business logic services (16 service files)
      utils/             # security.py, text utils, PCA loader
    Dockerfile
    requirements.txt
  frontend/
    src/
      components/
        auth/            # LoginPage, RegisterPage, ForgotPasswordPage, LogoutButton
        career-viz/      # CareerVisualization, RoleNode, etc.
        common/          # ProgressRing, SkillTag
        game/            # AdventureHUD, AchievementsPanel, CoinFlipGame, etc.
        layout/          # MainLayout, Sidebar, ProtectedRoute, HomeRedirect
        matches/         # MatchResultsPage, MatchCard, MatchFilters, etc.
        roadmap/         # RoadmapViewer, PhaseTab, InsightsTab, etc.
        role-detail/     # NetworkSidebar, RolePathTo, RoleSuccessPatterns
        skills/          # SkillsDashboard, ResumeUpload, SkillCard, etc.
        successPatterns/ # SuccessPatternPage, charts
      context/           # Auth, Theme, AdventureMode, Skills, Matches, Roadmap, Toast, etc.
      data/              # Mock data (career graphs, role skill trees)
      hooks/             # useRoadmap, useSkills
      lib/               # api.ts (re-export)
      pages/             # CareerPathPage, ProfilePage, RoadmapPage, etc.
      services/          # api.ts, authService.ts, patternService.ts, etc.
    Dockerfile
    package.json
  docker/
    postgres-init/       # 01_extensions.sql, 02_pattern_indexes.sql
  scripts/
    init_database.sql    # Original schema DDL
  data/                  # SQL seed files
  artifacts/             # BMAD swarm artifacts
  docker-compose.yml
```

---

## 3. Authentication System

### 3.1 Backend Auth

**File**: `backend/app/routes/auth.py`
**Endpoints**:
- `POST /auth/register` - Creates UserProfile, returns JWT + UserResponse
- `POST /auth/login` - Validates credentials, updates last_login_at, returns JWT + UserResponse
- `GET /auth/me` - Returns current user from JWT token

**Security** (`backend/app/utils/security.py`):
- Password hashing: bcrypt
- JWT: PyJWT library, HS256 algorithm
- Token expiry: 7 days (configurable via `ACCESS_TOKEN_EXPIRE_DAYS`)
- Auth middleware: `HTTPBearer` scheme, `get_current_user_from_token` dependency
- JWT payload: `{"user_id": "<uuid>", "email": "<email>", "exp": <timestamp>}`

**Key observation**: `JWT_SECRET_KEY` defaults to empty string `""` if not set in env, but `_require_secret()` will raise 500 if empty. This must be set via `JWT_SECRET_KEY` env var.

### 3.2 Frontend Auth

**File**: `frontend/src/context/AuthContext.tsx`
**Storage**: Token stored in `localStorage` as key `"token"`, user data as `"user"`
**API Client** (`frontend/src/services/api.ts`):
- Axios instance with interceptors
- Auto-attaches `Bearer` token from localStorage
- Auto-redirects to `/login` on 401

### 3.3 User Model

**File**: `backend/app/models/user_profile.py`
**Table**: `user_profiles`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | gen_random_uuid() |
| email | String (unique) | Indexed |
| hashed_password | String | bcrypt |
| full_name | String (nullable) | |
| current_role | String (nullable) | |
| years_experience | Numeric (nullable) | |
| target_service_line | String (nullable) | Indexed |
| skills | JSONB | Array of strings, GIN indexed |
| employee_id | String (FK -> employees.id, nullable) | |
| resume_text | Text (nullable) | |
| resume_file_url | String (nullable) | |
| skill_assessment_scores | JSONB | Dict |
| onboarding_complete | Boolean | Default false |
| account_type | String(20) | 'personal' or 'hiring_manager' |
| last_login_at | DateTime (nullable) | |
| llm_listed_skills | JSONB (nullable) | AI-extracted |
| llm_inferred_skills | JSONB (nullable) | AI-extracted |
| skill_groupings | JSONB (nullable) | AI-generated groupings |
| resume_embedding | Vector(1536) (nullable) | pgvector |
| created_at | DateTime | TimestampMixin |
| updated_at | DateTime | TimestampMixin |

**Relationships**: matches, employee, career_path, saved_roadmaps, hm_saved_jobs

**CRITICAL**: The UserProfile has NO columns for gamification data (XP, gold, level, achievements, login streak). All gamification state is client-side only.

---

## 4. Current Adventure Mode Implementation (THE CRITICAL BUG)

### 4.1 How It Works Now

**Context File**: `frontend/src/context/AdventureModeContext.tsx`
**Storage**: ALL state persisted to `localStorage` key `"springais-adventure-mode"`

**State tracked (ALL in localStorage)**:
- `enabled` (boolean) - Whether adventure mode is on
- `totalXP` (number) - Accumulated experience points
- `gold` (number) - Virtual currency (starts at 100)
- `unlockedAchievements` (string[]) - IDs of earned achievements
- `loginStreak` (number) - Consecutive login days
- `lastLoginDate` (string) - Last login date string
- `completedSkillsCount` (number) - Skills completed counter
- `visitedPages` (string[]) - Pages visited for "explorer" achievement

**Computed State (derived from totalXP)**:
- `level` - Calculated via exponential XP curve: `100 * 1.5^(level-1)` XP per level
- `currentXP` - XP within current level
- `xpToNextLevel` - XP needed for next level
- `title` - Text title based on level ranges (Novice -> Apprentice -> Journeyman -> ... -> Legend)

### 4.2 XP System

**Formula**: `xpForLevel(level) = floor(100 * 1.5^(level-1))`

| Level | XP Required | Total XP | Title |
|-------|------------|----------|-------|
| 1 | 100 | 0 | Novice |
| 2 | 150 | 100 | Novice |
| 5 | 506 | 862 | Apprentice |
| 10 | 3844 | 7538 | Journeyman |
| 15 | 29193 | 58287 | Adept |
| 20 | 221803 | 443504 | Expert |

**XP Sources**:
- Achievement rewards: 100-500 XP each
- Skill completion: 75 XP
- Mini-game victory: 50 XP
- Mini-game participation: 25 XP

### 4.3 Gold System

**Starting balance**: 100 gold
**Sources**:
- Achievement rewards: 50-2500 gold each
- Skill completion: 25 gold
- Level-up bonus: `level * 25` gold
- Mini-game win: bet * 2 gold (coin flip)

**Spending**: Only the coin flip game (bets of 10, 25, 50, or 100 gold)

### 4.4 Achievement System (Hardcoded)

14 achievements defined in `ACHIEVEMENTS` array in AdventureModeContext.tsx:

| ID | Name | Trigger | XP | Gold |
|----|------|---------|----|----|
| first_login | The Journey Begins | Enable adventure mode | 100 | 50 |
| first_match | Seeker of Destiny | View match results | 150 | 75 |
| save_role | Marked for Greatness | Save a role | 100 | 50 |
| create_roadmap | Path Forged | Generate a roadmap | 500 | 200 |
| complete_milestone | Milestone Conquered | Complete a milestone | 300 | 150 |
| level_5 | Apprentice | Reach level 5 | 0 | 500 |
| level_10 | Journeyman | Reach level 10 | 0 | 1000 |
| level_20 | Expert | Reach level 20 | 0 | 2500 |
| skill_master | Skill Master | Complete 5 skills | 400 | 200 |
| daily_login_3 | Dedicated Adventurer | 3-day login streak | 200 | 100 |
| daily_login_7 | Steadfast Hero | 7-day login streak | 500 | 300 |
| mini_game_master | Game Champion | Win a mini-game | 150 | 100 |
| profile_complete | Identity Forged | Complete profile | 200 | 100 |
| explorer | Realm Explorer | Visit all pages | 150 | 75 |

**Achievement unlock mechanism**: React `useEffect` hooks watch state changes and auto-unlock when conditions are met. Some achievements (first_match, save_role, create_roadmap, complete_milestone, profile_complete) require manual triggering via `unlockAchievement()` calls from other components.

### 4.5 UI Components

All in `frontend/src/components/game/`:

| Component | Purpose |
|-----------|---------|
| `AdventureHUD.tsx` | Top bar showing level, XP bar, gold, achievement count, login streak |
| `AchievementsPanel.tsx` | Modal showing all achievements with unlock status |
| `CoinFlipGame.tsx` | Mini-game: bet gold on heads/tails coin flip |
| `GameButton.tsx` | Themed button component (medieval styling) |
| `GameCard.tsx` | Themed card component |
| `GameProgressBar.tsx` | Themed progress bar with shimmer animation |
| `NotificationToasts.tsx` | Toast notifications for XP gain, gold gain, achievement unlock, level up |
| `ThemeSwitcher.tsx` | Dropdown to switch themes (Light/Dark/Medieval) + adventure mode toggle |
| `index.ts` | Barrel export for all game components |

### 4.6 Theme System

**File**: `frontend/src/context/ThemeContext.tsx`
Three themes: `light`, `dark`, `game` (medieval)
Theme stored in localStorage key `"springais-theme"`
The `game` theme provides:
- Dark brown parchment backgrounds
- Gold/bronze accent colors
- Cinzel serif font family
- Leather border styles
- Fantasy glow effects

### 4.7 Fantasy Text Mapping

`fantasyText` dict in AdventureModeContext.tsx maps standard text to fantasy equivalents:
- "Match Results" -> "Quest Board"
- "My Profile" -> "Hero Sheet"
- "Save Role" -> "Mark Quest"
- "Skills" -> "Abilities"
- "Logout" -> "Rest at Camp"
- etc.

Helper function `getFantasyText(text, adventureMode)` used for conditional text replacement.

### 4.8 The Bug: Browser Cache Storage

**Root Cause**: `AdventureModeContext.tsx` lines 237-267

```typescript
const STORAGE_KEY = 'springais-adventure-mode';

function loadState(): Partial<AdventureModeState> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load adventure mode state:', e);
  }
  return {};
}

function saveState(state: Partial<AdventureModeState>) {
  try {
    const toSave = {
      enabled, totalXP, gold, unlockedAchievements,
      loginStreak, lastLoginDate, completedSkillsCount, visitedPages,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error('Failed to save adventure mode state:', e);
  }
}
```

**Impact**:
1. User A logs in on Chrome, earns 500 XP -> stored in Chrome localStorage
2. User A logs in on Firefox -> starts at 0 XP (different localStorage)
3. User B uses same Chrome browser -> sees User A's progression
4. User A clears browser data -> all progression permanently lost
5. No server-side validation of XP/gold -> client can manipulate values freely

---

## 5. Database Schema

### 5.1 Current Tables (SQLAlchemy models in `backend/app/models/`)

| Table | Model File | Purpose |
|-------|-----------|---------|
| `user_profiles` | user_profile.py | User accounts with skills, resume, embeddings |
| `employees` | employee.py | Synthetic employee data (service_line, role, skills, metrics) |
| `job_postings` | job_posting.py | Scraped job listings with skills, descriptions |
| `matches` | match.py | User-to-job match results with scores |
| `saved_roadmaps` | roadmap.py | Generated career roadmaps (JSONB data) |
| `roadmap_milestone_progress` | roadmap_progress.py | Milestone completion tracking |
| `roadmap_extras` | roadmap_progress.py | User-added achievements |
| `roadmap_edits` | roadmap_progress.py | Edit audit trail |
| `skill_embeddings` | skill_embedding.py | Cached vector embeddings (1536-dim) |
| `user_skills` | skill_progress.py | User-skill relationships and proficiency |
| `skill_modules` | skill_progress.py | Learning modules within skills |
| `user_module_progress` | skill_progress.py | Module completion tracking |
| `badge_catalog` | badge.py | Certificate/badge catalog |
| `badge_skill_mapping` | badge.py | Badge-to-skill mappings |
| `badge_interactions` | badge.py | User interactions with badges |
| `user_badges` | badge.py | Badges earned by users |
| `career_paths` | career_path.py | Career path data |
| `hm_saved_jobs` | hm_saved_job.py | Hiring manager saved jobs |
| `skill_taxonomy` | skill_taxonomy.py | Skill taxonomy/categorization |
| `skill_recommendations` | skill_recommendation.py | AI skill recommendations |
| `roles` | (init_database.sql) | Role definitions |

### 5.2 Database Configuration

- **Engine**: PostgreSQL 16 with pgvector extension
- **Driver**: psycopg3 (via `postgresql+psycopg://`)
- **Connection Pool**: QueuePool, 20 base + 30 overflow connections
- **Table Creation**: `Base.metadata.create_all()` on startup (no Alembic migrations in use despite being in requirements)
- **Sessions**: `SessionLocal` factory with `autocommit=False, autoflush=False`

### 5.3 Missing Tables for Gamification

There are NO existing tables for:
- User progression (XP, gold, level)
- Gamification achievements (server-side)
- Login streaks (server-tracked)
- Cosmetic store items
- Side quests
- Action/event reward logs
- Gamification transaction history

---

## 6. Backend API Architecture

### 6.1 API Router Structure

**File**: `backend/app/main.py` -> `backend/app/routes/__init__.py`

| Router | Prefix | Auth Required | Key Endpoints |
|--------|--------|--------------|---------------|
| auth | /auth | No (register/login), Yes (me) | register, login, me |
| badges | /api/badges | Yes | discover, catalog/search, interactions, earned, analytics |
| matches | /api/matches | Yes | employee matches, deep analysis, save matches |
| skills | /api/skills | Yes | me, extract, upload, taxonomy, recommendations, progress |
| patterns | /api/patterns | Yes | success pattern analytics |
| roadmap | /api/roadmap | Yes | generate, save, progress, milestones |
| hiring_manager | /api/hiring-manager | Yes | job management, candidate interest |

### 6.2 Service Layer

Key services in `backend/app/services/`:

| Service | Purpose |
|---------|---------|
| `matching_service.py` | Core job matching engine |
| `embedding_service.py` | OpenAI embedding generation |
| `recommendation_service.py` | AI skill recommendations |
| `roadmap_service.py` | Career roadmap generation |
| `roadmap_progress_service.py` | Milestone/progress tracking |
| `skill_progress_service.py` | User skill progress management |
| `badge_discovery_service.py` | Badge recommendation engine |
| `match_cache_service.py` | Redis caching for matches |
| `resume_parser.py` | PDF/DOCX resume parsing |
| `skill_extractor.py` | LLM-based skill extraction |
| `analysis_service.py` | Deep match analysis (LLM) |
| `pattern_service.py` | Success pattern analytics |

### 6.3 Middleware

- **CORS**: Allows `http://localhost:3000` origin, all methods/headers, credentials
- **GZip**: Compression for responses > 1000 bytes

---

## 7. Frontend Architecture

### 7.1 Component Provider Hierarchy

```
React.StrictMode
  QueryClientProvider (react-query)
    BrowserRouter (react-router-dom v6)
      ThemeProvider (localStorage: springais-theme)
        AuthProvider (localStorage: token, user)
          Routes
            /login, /register, /forgot-password (public)
            ProtectedRoute (requires auth)
              AdventureModeProvider (localStorage: springais-adventure-mode)
                ToastProvider
                  MatchesProvider
                    SavedRolesProvider
                      SkillsProvider
                        MainLayout (with Sidebar, AdventureHUD, NotificationToasts)
                          <Page components>
```

### 7.2 Key Frontend Patterns

- **Lazy loading**: Heavy page components loaded with `React.lazy()` + `Suspense`
- **API layer**: Centralized `APIClient` class in `frontend/src/services/api.ts`
- **Auth interceptor**: Auto-attaches JWT token, auto-redirects on 401
- **Styling**: TailwindCSS 4 + inline styles (heavy use of inline `style` props for theme-aware colors)
- **Animations**: framer-motion for transitions, hover effects, toasts
- **Data fetching**: Mix of @tanstack/react-query and manual fetch in contexts
- **Forms**: react-hook-form for form handling
- **Charts**: recharts for data visualization
- **Drag & drop**: @dnd-kit for sortable widgets
- **Virtual lists**: @tanstack/react-virtual for match results

### 7.3 Routing Structure

| Path | Component | Layout |
|------|-----------|--------|
| /login | LoginPage | Public |
| /register | RegisterPage | Public |
| /forgot-password | ForgotPasswordPage | Public |
| /matches | MatchResultsPage | MainLayout |
| /profile | ProfilePage | MainLayout |
| /saved | SavedRolesPage | MainLayout |
| /roadmap | RoadmapPage | MainLayout |
| /success-patterns | SuccessPatternPage | MainLayout |
| /role/:roleId | RoleDetailPage | MainLayout |
| /hm/browse | HMJobBrowsePage | HMMainLayout |
| /hm/my-jobs | HMMyJobsPage | HMMainLayout |
| /hm/interest/:jobPostingId | HMCandidateInterestPage | HMMainLayout |
| / | HomeRedirect | Redirects based on account_type |

---

## 8. What Needs to Change for Medieval Mode Overhaul

### 8.1 Critical Changes Required

1. **New Database Tables**:
   - `user_progression` - XP, gold, level, title, login_streak, etc.
   - `user_achievements` - Server-tracked achievements with timestamps
   - `achievement_catalog` - Server-side achievement definitions
   - `gamification_events` - Event/action log for reward triggers
   - `cosmetic_store` - Store items (themes, badges, titles)
   - `user_cosmetics` - User-owned cosmetic items
   - `side_quests` - Quest definitions
   - `user_quests` - User quest progress
   - `gold_transactions` - Transaction ledger for gold

2. **New Backend API Routes**:
   - `GET/POST /api/progression` - Get/update user progression
   - `POST /api/progression/xp` - Award XP (server-validated)
   - `POST /api/progression/gold` - Award/spend gold (server-validated)
   - `GET /api/achievements` - Get user achievements
   - `POST /api/achievements/unlock` - Server-side achievement unlock
   - `GET /api/store/items` - Get store catalog
   - `POST /api/store/purchase` - Purchase item (server-validated)
   - `GET /api/quests` - Get available/active quests
   - `POST /api/quests/{id}/progress` - Update quest progress

3. **Backend Services**:
   - `progression_service.py` - XP/level/gold management
   - `achievement_service.py` - Achievement unlock logic
   - `store_service.py` - Cosmetic store transactions
   - `quest_service.py` - Side quest management
   - `reward_hook_service.py` - Event-based reward distribution

4. **Frontend Migration**:
   - Replace localStorage in `AdventureModeContext.tsx` with API calls
   - Add server sync on login/page load
   - Move achievement definitions to server
   - Add store UI components
   - Add quest UI components
   - Keep client-side optimistic updates with server validation

### 8.2 What Works and Should Be Preserved

- Theme system (ThemeContext) - works fine with localStorage, no change needed
- Game UI components (GameButton, GameCard, GameProgressBar) - reusable
- Fantasy text mappings - can be expanded
- XP curve formula - can be reused server-side
- Achievement unlock UX (toasts, animations) - keep the UX pattern
- AdventureHUD layout - keep but wire to server data
- CoinFlipGame UX - keep but validate server-side

### 8.3 What's Broken

- **All gamification state in localStorage** - must move to server
- **No server validation** - gold can be manipulated via devtools
- **No per-user isolation** - progression shared across users on same browser
- **Achievement triggers scattered** - some auto-detect, some manual, none server-verified
- **Login streak unreliable** - calculated client-side from date strings
- **No gold transaction log** - can't audit spending/earning
- **No spending destinations** - gold has no real utility beyond coin flip game
- **Achievement definitions hardcoded** - can't add new ones without frontend deploy

### 8.4 Integration Points for Event/Action Rewards

Current actions that should trigger rewards (but currently don't persist server-side):

| Action | Current Location | XP/Gold/Achievement |
|--------|-----------------|---------------------|
| View match results | MatchResultsPage | first_match achievement |
| Save a role | SavedRolesContext | save_role achievement |
| Generate roadmap | RoadmapContext | create_roadmap achievement |
| Complete milestone | RoadmapViewer | complete_milestone achievement |
| Complete skill module | Skills routes/service | incrementSkillsCompleted |
| Upload resume | Skills upload route | Should reward XP |
| Complete profile | ProfilePage | profile_complete achievement |
| Visit all pages | trackPageVisit | explorer achievement |
| Win mini-game | CoinFlipGame | mini_game_master achievement |
| Daily login | AdventureModeContext mount | Login streak + daily_login_X |

---

## 9. Key File Map

### Backend - Models
- `backend/app/models/base.py` - Base, TimestampMixin
- `backend/app/models/user_profile.py` - UserProfile (auth user table)
- `backend/app/models/match.py` - Match results
- `backend/app/models/roadmap.py` - SavedRoadmap
- `backend/app/models/roadmap_progress.py` - RoadmapMilestoneProgress, RoadmapExtra, RoadmapEdit
- `backend/app/models/skill_progress.py` - UserSkill, SkillModule, UserModuleProgress
- `backend/app/models/badge.py` - BadgeCatalog, BadgeSkillMapping, BadgeInteraction, UserBadge
- `backend/app/models/employee.py` - Employee (synthetic data)
- `backend/app/models/job_posting.py` - JobPosting
- `backend/app/models/career_path.py` - CareerPath
- `backend/app/models/skill_embedding.py` - SkillEmbedding
- `backend/app/models/skill_taxonomy.py` - SkillTaxonomy
- `backend/app/models/skill_recommendation.py` - UserSkillRecommendation
- `backend/app/models/__init__.py` - Barrel exports

### Backend - Routes
- `backend/app/routes/auth.py` - Authentication (register, login, me)
- `backend/app/routes/badges.py` - Badge discovery and tracking
- `backend/app/routes/matches.py` - Job matching
- `backend/app/routes/skills.py` - Skill management and extraction
- `backend/app/routes/roadmap.py` - Roadmap generation and progress
- `backend/app/routes/patterns.py` - Success pattern analysis
- `backend/app/routes/hiring_manager.py` - Hiring manager features

### Backend - Services
- `backend/app/services/matching_service.py` - Core matching engine
- `backend/app/services/roadmap_service.py` - Roadmap generation
- `backend/app/services/roadmap_progress_service.py` - Milestone tracking
- `backend/app/services/skill_progress_service.py` - Skill progress
- `backend/app/services/badge_discovery_service.py` - Badge recommendations
- `backend/app/services/match_cache_service.py` - Redis caching
- `backend/app/services/embedding_service.py` - Embeddings
- `backend/app/services/resume_parser.py` - Resume parsing
- `backend/app/services/skill_extractor.py` - LLM skill extraction
- `backend/app/services/analysis_service.py` - Deep analysis
- `backend/app/services/recommendation_service.py` - Skill recommendations

### Backend - Config & Utils
- `backend/app/config.py` - OpenAI/Redis client factories
- `backend/app/database.py` - SQLAlchemy engine/session
- `backend/app/utils/security.py` - JWT/bcrypt auth utilities
- `backend/requirements.txt` - Python dependencies

### Frontend - Core
- `frontend/src/main.tsx` - App entrypoint (providers hierarchy)
- `frontend/src/App.tsx` - Route definitions
- `frontend/src/services/api.ts` - Axios API client with auth interceptor
- `frontend/src/services/authService.ts` - Auth API calls
- `frontend/src/lib/api.ts` - API re-export

### Frontend - Context (State Management)
- `frontend/src/context/AuthContext.tsx` - Auth state (user, token, login/register/logout)
- `frontend/src/context/ThemeContext.tsx` - Theme state (light/dark/game) + color definitions
- `frontend/src/context/AdventureModeContext.tsx` - **GAMIFICATION STATE (localStorage bug)**
- `frontend/src/context/MatchesContext.tsx` - Match results state
- `frontend/src/context/SavedRolesContext.tsx` - Saved roles state
- `frontend/src/context/SkillsContext.tsx` - Skills state
- `frontend/src/context/RoadmapContext.tsx` - Roadmap state
- `frontend/src/context/ToastContext.tsx` - Toast notifications
- `frontend/src/context/HiringManagerContext.tsx` - HM features

### Frontend - Game Components
- `frontend/src/components/game/AdventureHUD.tsx` - Top HUD (level, XP, gold, achievements, streak)
- `frontend/src/components/game/AchievementsPanel.tsx` - Achievement modal
- `frontend/src/components/game/CoinFlipGame.tsx` - Coin flip mini-game
- `frontend/src/components/game/GameButton.tsx` - Themed button
- `frontend/src/components/game/GameCard.tsx` - Themed card
- `frontend/src/components/game/GameProgressBar.tsx` - Themed progress bar
- `frontend/src/components/game/NotificationToasts.tsx` - XP/gold/achievement/level-up toasts
- `frontend/src/components/game/ThemeSwitcher.tsx` - Theme dropdown + adventure toggle
- `frontend/src/components/game/index.ts` - Barrel exports

### Frontend - Layout
- `frontend/src/components/layout/MainLayout.tsx` - Main app layout with sidebar
- `frontend/src/components/layout/Sidebar.tsx` - Navigation sidebar
- `frontend/src/components/layout/ProtectedRoute.tsx` - Auth guard
- `frontend/src/components/layout/HomeRedirect.tsx` - Redirect based on account type
- `frontend/src/components/layout/HMMainLayout.tsx` - Hiring manager layout
- `frontend/src/components/layout/HMSidebar.tsx` - HM navigation

### Infrastructure
- `docker-compose.yml` - 4 services (postgres, redis, backend, frontend)
- `backend/Dockerfile` - Python 3.11 slim
- `frontend/Dockerfile` - Node/Vite
- `docker/postgres-init/01_extensions.sql` - pgvector + pgcrypto extensions
- `docker/postgres-init/02_pattern_indexes.sql` - Performance indexes
- `scripts/init_database.sql` - Original DDL schema

---

## 10. Recommendations for Architecture

1. **Add columns to `user_profiles` OR create separate `user_progression` table** for XP, gold, level. A separate table is cleaner for separation of concerns and avoids widening an already wide table.

2. **Server-side achievement system**: Move achievement catalog to DB, track unlocks per-user with timestamps and reward logs.

3. **Gold transaction ledger**: Every gold earn/spend should create a transaction record for auditability and cheat prevention.

4. **Event-driven rewards**: Create a reward hook service that listens for platform actions (match view, roadmap creation, milestone completion) and awards XP/gold/achievements atomically.

5. **Redis for real-time state**: Cache current progression in Redis for fast reads, persist to Postgres on significant changes.

6. **Migration strategy**: Since `Base.metadata.create_all()` is used (no Alembic), new tables will auto-create on restart. However, consider adopting Alembic for proper schema migrations.

7. **Frontend sync**: On login, fetch full progression state from server. Use optimistic updates with server confirmation. Remove localStorage persistence entirely for gamification data.

8. **Anti-cheat**: All XP/gold awards must go through server-side validation. Client should never directly modify progression values.
