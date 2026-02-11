# SpringAIS Source Tree Analysis

**Generated**: 2026-02-11

---

## Annotated Directory Tree

```
SpringAIS/                                  # Project root
│
├── frontend/                               # React SPA (TypeScript/JSX, ~117 source files)
│   ├── src/
│   │   ├── main.tsx                        # React 18 createRoot entry point, renders <App />
│   │   ├── App.tsx                         # Root component: provider hierarchy, lazy routes, QueryClient config
│   │   ├── index.css                       # TailwindCSS v4 entry stylesheet
│   │   │
│   │   ├── components/                     # UI components (76 files across 10 directories)
│   │   │   ├── auth/                       # Authentication UI (4 files, JSX)
│   │   │   │   ├── LoginPage.tsx           # Email/password login with EY branding, glassmorphism
│   │   │   │   ├── RegisterPage.tsx        # Registration with name/email/password, min 8 char validation
│   │   │   │   ├── ForgotPasswordPage.tsx  # Placeholder page (not wired to real auth)
│   │   │   │   └── LogoutButton.tsx        # Theme-aware logout, navigates to /login
│   │   │   │
│   │   │   ├── common/                     # Shared UI atoms (2 files, TSX)
│   │   │   │   ├── ProgressRing.tsx        # SVG circular progress ring (animated, EY yellow stroke)
│   │   │   │   └── SkillTag.tsx            # Pill badge for skills (matched/transferable/gap variants)
│   │   │   │
│   │   │   ├── career-viz/                 # Career graph visualization (10 files, TSX/TS)
│   │   │   │   ├── CareerVisualization.tsx # Main career graph container (ReactFlow, department filter, BFS goal path)
│   │   │   │   ├── GraphControls.tsx       # Filter panel (search, department, min success rate)
│   │   │   │   ├── NodeDetailsPanel.tsx    # Side panel (420px) for role details and transitions
│   │   │   │   ├── RoleNode.tsx            # ReactFlow custom node for career roles (color-coded states)
│   │   │   │   ├── RoleRequirementTree.tsx # Skill plan tree (radial layout, draggable, localStorage positions)
│   │   │   │   ├── SkillNode.tsx           # ReactFlow custom node for skills (role/path/skill variants)
│   │   │   │   ├── SkillPlanEdge.tsx       # ReactFlow custom edge (bundled paths, bezier curves)
│   │   │   │   ├── TransitionEdge.tsx      # Career graph edge (success rate color-coded)
│   │   │   │   ├── graphLayoutUtils.ts     # Dagre-based graph layout algorithm
│   │   │   │   └── graphTransformUtils.ts  # CareerGraphData -> ReactFlow format transformer
│   │   │   │
│   │   │   ├── game/                       # Gamification/adventure mode (8 files, TSX)
│   │   │   │   ├── AdventureHUD.tsx        # Fixed top HUD bar (level, XP, gold, achievements, streak)
│   │   │   │   ├── AchievementsPanel.tsx   # Modal grid of 14 achievements with XP/gold rewards
│   │   │   │   ├── CoinFlipGame.tsx        # Mini-game modal (10/25/50/100 gold bets, 50/50 odds)
│   │   │   │   ├── GameButton.tsx          # Themed button (primary/secondary/ghost/danger)
│   │   │   │   ├── GameCard.tsx            # Themed card wrapper with optional glow
│   │   │   │   ├── GameProgressBar.tsx     # Progress bar (xp/gold/success/warning variants)
│   │   │   │   ├── NotificationToasts.tsx  # Toast stack for XP/gold/achievement/level-up events
│   │   │   │   └── ThemeSwitcher.tsx       # Theme dropdown (Light/Dark/Medieval) + Adventure Mode toggle
│   │   │   │
│   │   │   ├── layout/                     # Application layout (8 files, TSX/TS)
│   │   │   │   ├── MainLayout.tsx          # Personal account layout (sidebar + content + optional HUD)
│   │   │   │   ├── HMLayout.tsx            # Hiring manager layout (sidebar + content)
│   │   │   │   ├── Sidebar.tsx             # Personal nav: Dashboard, Matches, Skills, Career Path, Patterns
│   │   │   │   ├── HMSidebar.tsx           # HM nav: Dashboard, Candidates, Matches, Analytics
│   │   │   │   ├── Header.tsx              # Top header with user greeting, notifications, ThemeSwitcher
│   │   │   │   ├── ProtectedRoute.tsx      # Auth route guard (redirects to /login)
│   │   │   │   ├── AccountTypeRoute.tsx    # Account type route guard (personal vs hiring_manager)
│   │   │   │   └── index.ts               # Barrel exports
│   │   │   │
│   │   │   ├── matches/                    # Job match UI (9 files, TSX)
│   │   │   │   ├── MatchResultsPage.tsx    # Main page: resume gate, progressive loading, filters, pagination
│   │   │   │   ├── MatchCard.tsx           # Match card: title, scores, skill gap display
│   │   │   │   ├── MatchDetailsModal.tsx   # Full-screen modal: score breakdown, deep analysis, job details
│   │   │   │   ├── MatchFilters.tsx        # Department/Location/Experience multi-select + US toggle
│   │   │   │   ├── MatchModeToggle.tsx     # Three-button toggle: Best Fit / Stretch / Exploratory
│   │   │   │   ├── MatchSortDropdown.tsx   # Sort by score/date asc/desc
│   │   │   │   ├── SkillGapDisplay.tsx     # Matched/transferable/gap skills with SkillTag components
│   │   │   │   ├── VirtualMatchList.tsx    # Virtualized list (@tanstack/react-virtual, 5 overscan)
│   │   │   │   └── EmptyMatchState.tsx     # Empty state with reset filters button
│   │   │   │
│   │   │   ├── roadmap/                    # Career roadmap (11 files, TSX)
│   │   │   │   ├── RoadmapViewer.tsx       # Main container: header, progress, tabs, chat, edit mode
│   │   │   │   ├── GlobalProgressBar.tsx   # Sticky progress (SVG circle, milestone count, celebration)
│   │   │   │   ├── RoadmapTabNav.tsx       # Horizontal scrollable tabs (Overview, Insights, Phase N...)
│   │   │   │   ├── OverviewTab.tsx         # Hero stats, executive summary, vertical timeline
│   │   │   │   ├── InsightsTab.tsx         # Quick wins, critical skills, challenges, journey summary
│   │   │   │   ├── PhaseTab.tsx            # Phase detail with progress ring, milestones, prev/next nav
│   │   │   │   ├── MilestoneCard.tsx       # Interactive milestone: checkbox, category icon, expand/collapse
│   │   │   │   ├── ExtrasSection.tsx       # User-added extra achievements (cert/skill/project/achievement)
│   │   │   │   ├── AddExtraModal.tsx       # Form modal for adding extra achievements
│   │   │   │   ├── EditModeToggle.tsx      # Three-mode: View / AI-Assisted / Manual
│   │   │   │   └── RoadmapAssistant.tsx    # Floating chat widget (384px, 5 suggested questions)
│   │   │   │
│   │   │   ├── role-detail/                # Role detail views (5 files, TSX)
│   │   │   │   ├── RoleOverview.tsx        # Role detail: scores, explanation, deep analysis
│   │   │   │   ├── RoleSkillsGap.tsx       # Skills gap analysis: stat cards, matched/gap tags
│   │   │   │   ├── RolePathTo.tsx          # Skill development network (sidebar + RoleRequirementTree)
│   │   │   │   ├── RoleSuccessPatterns.tsx  # Success patterns with dnd-kit draggable chart widgets
│   │   │   │   └── NetworkSidebar.tsx      # Left sidebar (300px) for skill plan paths
│   │   │   │
│   │   │   ├── skills/                     # Skills portfolio (11 files, JSX)
│   │   │   │   ├── SkillsDashboard.jsx     # Main container: progress ring, stats, modals, resume upload
│   │   │   │   ├── SkillsPortfolio.jsx     # Grid organizing skills by AI-generated or default categories
│   │   │   │   ├── SkillCategory.jsx       # Category section: CRUD, progress meter, learning modules
│   │   │   │   ├── SkillCard.jsx           # Skill card: progress ring, status badge, hover actions
│   │   │   │   ├── SkillDetailModal.jsx    # Complex modal (~1080 lines): proficiency, modules, proof, AI content
│   │   │   │   ├── SkillSearchBar.jsx      # Filter tabs (All/In Progress/Recommended) + search
│   │   │   │   ├── SkillExtractionPreview.jsx # Preview resume-extracted skills before adding
│   │   │   │   ├── SkillProgressRing.jsx   # SVG circular progress (small/medium/large)
│   │   │   │   ├── ResumeUpload.jsx        # Drag-and-drop resume upload (react-dropzone)
│   │   │   │   ├── AddSkillModal.jsx       # Manual skill creation form (react-hook-form)
│   │   │   │   └── ThemeSwitcher.jsx       # Skills-specific theme config (DARK_THEME, LIGHT_THEME)
│   │   │   │
│   │   │   └── successPatterns/            # Career analytics (8 files, TSX)
│   │   │       ├── SuccessPatternPage.tsx  # Main page: dnd-kit widget layout, localStorage persistence
│   │   │       ├── MetricCards.tsx          # 4-card grid: transitions, time, success rate, sample size
│   │   │       ├── SuccessRateChart.tsx     # Vertical bar chart (Recharts, color-coded by rate)
│   │   │       ├── TimeToPromotionChart.tsx # Multi-line chart (Recharts, per department)
│   │   │       ├── SkillFrequencyChart.tsx  # Horizontal bar chart (top 10 skills)
│   │   │       ├── DepartmentDistributionChart.tsx # Donut pie chart (Recharts)
│   │   │       ├── FilterControls.tsx       # Department/Role Level/Time Period dropdowns
│   │   │       └── SortableWidget.tsx       # dnd-kit sortable wrapper for chart widgets
│   │   │
│   │   ├── context/                        # React context providers (9 files)
│   │   │   ├── AuthContext.tsx              # JWT auth: login, register, logout, auto-401 logout
│   │   │   ├── ThemeContext.tsx             # Theme: light/dark/game, CSS custom properties
│   │   │   ├── AdventureContext.tsx         # Gamification: XP, gold, level, achievements, streak
│   │   │   ├── MatchesContext.tsx           # Match state: progressive loading, 5-min cache, save/unsave
│   │   │   ├── SkillsContext.tsx            # Skills state: CRUD, AI groupings, filter/search
│   │   │   ├── RoadmapContext.tsx           # Roadmap state: useReducer with 17 action types
│   │   │   ├── CareerPathContext.tsx        # Career graph: node selection, goal setting
│   │   │   ├── HMContext.tsx               # Hiring manager: candidates, jobs, analytics
│   │   │   └── NotificationContext.tsx     # In-app notifications
│   │   │
│   │   ├── services/                       # API service layer (9 files)
│   │   │   ├── api.ts                      # APIClient class (Axios wrapper, auth interceptor)
│   │   │   ├── authService.ts              # Auth endpoints (separate Axios instance, no /api prefix)
│   │   │   ├── matchService.ts             # Match endpoints + type exports (Match, DeepAnalysis)
│   │   │   ├── skillService.ts             # Skill CRUD + resume upload + groupings
│   │   │   ├── skillProgressService.ts     # Skill progress + modules + proof + content generation
│   │   │   ├── careerGraphService.ts       # Career graph data fetching
│   │   │   ├── roadmapService.ts           # Roadmap generation, progress, chat, AI editing
│   │   │   ├── successPatternService.ts    # Success pattern data with filters
│   │   │   └── hmService.ts               # Hiring manager data endpoints
│   │   │
│   │   ├── hooks/                          # Custom React hooks (2 files)
│   │   │   ├── useDebounce.ts              # Generic debounce hook
│   │   │   └── useLocalStorage.ts          # localStorage state persistence hook
│   │   │
│   │   ├── lib/                            # Shared utilities (1 file)
│   │   │   └── api.ts                      # APIClient instance (same as services/api.ts)
│   │   │
│   │   ├── pages/                          # Page components (9 files)
│   │   │   ├── DashboardPage.tsx           # Personal dashboard
│   │   │   ├── MatchesPage.tsx             # Wraps MatchResultsPage
│   │   │   ├── MatchDetailPage.tsx         # Match detail with modal
│   │   │   ├── RoleDetailPage.tsx          # Tabbed role detail (Overview/Skills/Path/Patterns)
│   │   │   ├── SkillsPage.tsx              # Wraps SkillsDashboard
│   │   │   ├── CareerPathPage.tsx          # Wraps CareerVisualization
│   │   │   ├── RoadmapPage.tsx             # Wraps RoadmapViewer in RoadmapProvider
│   │   │   ├── SuccessPatternsPage.tsx     # Wraps SuccessPatternPage
│   │   │   └── HMDashboardPage.tsx         # Hiring manager dashboard
│   │   │
│   │   ├── data/                           # Static data files (2 files)
│   │   │   ├── achievements.ts             # 14 achievement definitions (id, name, xp, gold, condition)
│   │   │   └── gameThemes.ts               # Medieval fantasy theme config (fonts, colors, level titles)
│   │   │
│   │   └── mocks/                          # Mock data (1 file)
│   │       └── mockSkills.js               # 7 skill categories + learning resource generator
│   │
│   ├── index.html                          # HTML shell with Google Fonts (Cinzel, Spectral, MedievalSharp)
│   ├── vite.config.ts                      # Vite: path alias @->./src, port 3000, Vitest config
│   ├── tsconfig.json                       # TypeScript strict mode, path aliases
│   ├── tailwind.config.js                  # TailwindCSS v4 with @theme directive
│   ├── postcss.config.js                   # @tailwindcss/postcss plugin
│   ├── .eslintrc.cjs                       # ESLint: TypeScript + React hooks rules
│   ├── Dockerfile                          # Node 18-alpine, npm run dev
│   └── package.json                        # Dependencies: React 18, Vite 5, TailwindCSS v4, etc.
│
├── backend/                                # FastAPI backend (Python 3.11, ~90 source files)
│   ├── app/
│   │   ├── main.py                         # FastAPI app entry: lifespan, middleware, routers
│   │   ├── config.py                       # OpenAI/Redis client factories (singletons)
│   │   ├── database.py                     # SQLAlchemy engine, session factory, get_db()
│   │   ├── __init__.py
│   │   │
│   │   ├── config/                         # Application configuration
│   │   │   ├── __init__.py
│   │   │   └── matching_config.py          # ScoringWeights(0.80/0.10/0.10), MatchMode enum, role hierarchy
│   │   │
│   │   ├── models/                         # SQLAlchemy ORM models (15 files, 16 tables)
│   │   │   ├── base.py                     # DeclarativeBase + TimestampMixin
│   │   │   ├── employee.py                 # employees table (skills JSONB, career_history JSONB)
│   │   │   ├── job_posting.py              # job_postings table (Vector(1536), TSVECTOR, GIN indexes)
│   │   │   ├── user_profile.py             # user_profiles table (resume_embedding Vector(1536))
│   │   │   ├── match.py                    # matches table (scores, skill_gaps JSONB)
│   │   │   ├── skill_embedding.py          # skill_embeddings table (HNSW indexed Vector(1536))
│   │   │   ├── skill_taxonomy.py           # skill_taxonomy table (120+ seed skills, aliases)
│   │   │   ├── skill_recommendation.py     # user_skill_recommendations table
│   │   │   ├── skill_progress.py           # user_skills + skill_modules + user_module_progress tables
│   │   │   ├── career_path.py              # career_paths table (React Flow graph_data JSONB)
│   │   │   ├── roadmap.py                  # saved_roadmaps table (roadmap_data JSONB)
│   │   │   ├── roadmap_progress.py         # milestone_progress + extras + edits tables
│   │   │   ├── hm_saved_job.py             # hm_saved_jobs table
│   │   │   ├── schemas.py                  # Pydantic utility models (PerformanceMetrics, ReactFlow)
│   │   │   └── __init__.py
│   │   │
│   │   ├── routes/                         # API route handlers (7 files)
│   │   │   ├── auth.py                     # /auth: register, login, me (~150 lines)
│   │   │   ├── matches.py                  # /api/matches: find, save, delete, deep analysis (~400 lines)
│   │   │   ├── skills.py                   # /api/skills: 25+ endpoints (~1800 lines)
│   │   │   ├── patterns.py                 # /api/patterns: career patterns, graph, transitions (~300 lines)
│   │   │   ├── roadmap.py                  # /api/roadmap: generate, progress, chat, editing (~1150 lines)
│   │   │   ├── hiring_manager.py           # /api/hm: jobs, saved jobs, anonymized candidates (~200 lines)
│   │   │   └── __init__.py
│   │   │
│   │   ├── schemas/                        # Pydantic request/response schemas (9 files)
│   │   │   ├── auth.py                     # RegisterRequest, LoginRequest, AuthResponse
│   │   │   ├── match_result.py             # MatchScores, SkillGapAnalysis, MatchResult, SavedMatch
│   │   │   ├── skill.py                    # SkillCategory (16 values), Skill, SkillExtraction
│   │   │   ├── pattern.py                  # TransitionPattern, CareerGraph, RoleRecommendation
│   │   │   ├── roadmap.py                  # RoadmapPhase, RoadmapMilestone, RoadmapGenerateRequest
│   │   │   ├── analysis.py                 # ImportanceLevel, GapSeverity, ComplexAnalysis
│   │   │   ├── hiring_manager.py           # AnonymizedCandidateDetail, CandidateInterestResponse
│   │   │   ├── skill_progress.py           # ModuleSchema, SkillProgressSchema
│   │   │   └── __init__.py
│   │   │
│   │   ├── services/                       # Business logic (20 files)
│   │   │   ├── __init__.py                 # Lazy imports via __getattr__
│   │   │   ├── matching_service.py         # Core matching engine (~1420 lines)
│   │   │   ├── embedding_service.py        # Vector embeddings + PCA + caching (~400 lines)
│   │   │   ├── embedding_integration.py    # Convenience functions for batch vectorization
│   │   │   ├── analysis_service.py         # GPT-5.2 deep analysis (~200 lines)
│   │   │   ├── skill_extractor.py          # Resume skill extraction via LLM (~350 lines)
│   │   │   ├── skill_normalizer.py         # Skill name normalization + cache
│   │   │   ├── skill_taxonomy.py           # 50+ skill relationships, parent/child/alias
│   │   │   ├── pattern_service.py          # Career pattern analysis (~1377 lines)
│   │   │   ├── recommendation_service.py   # Skill recommendations (matches, goals, LLM bootstrap)
│   │   │   ├── skill_grouping_service.py   # AI skill categorization
│   │   │   ├── skill_progress_service.py   # Skill learning progress (~709 lines)
│   │   │   ├── job_skill_extractor.py      # Batch job skill extraction via LLM
│   │   │   ├── job_import_service.py       # Job enrichment with embeddings
│   │   │   ├── match_cache_service.py      # Redis match caching + version invalidation
│   │   │   ├── incremental_match_service.py # Recalculate affected matches only
│   │   │   ├── learning_content_service.py # AI learning content + proof review
│   │   │   ├── hiring_manager_service.py   # Anonymized candidate data
│   │   │   ├── roadmap_service.py          # AI roadmap generation (~500 lines)
│   │   │   ├── roadmap_progress_service.py # Milestone tracking + edit audit
│   │   │   └── resume_parser.py            # PDF/DOCX/TXT parsing
│   │   │
│   │   └── utils/                          # Utility modules (6 files)
│   │       ├── security.py                 # bcrypt hashing, JWT create/verify, auth dependency
│   │       ├── pca_loader.py               # PCA model load/save with metadata
│   │       ├── text.py                     # normalize_skill_text(), cosine_similarity()
│   │       ├── text_cleaner.py             # PII stripping, text cleaning, chunking, token counting
│   │       ├── skill_categorizer.py        # Keyword-based skill categorization
│   │       └── __init__.py
│   │
│   ├── tests/                              # pytest test suite (12 files)
│   │   ├── __init__.py
│   │   ├── models/                         # Model unit tests
│   │   │   ├── conftest.py                 # Test fixtures
│   │   │   ├── test_career_path.py
│   │   │   ├── test_employee.py
│   │   │   ├── test_match.py
│   │   │   ├── test_skill_embedding.py
│   │   │   └── test_user_profile.py
│   │   ├── test_auth.py                    # Auth endpoint tests
│   │   ├── test_pattern_service.py         # Pattern service tests (mock data)
│   │   ├── test_recommendation_endpoints.py # Recommendation API tests
│   │   ├── test_recommendation_service.py  # Recommendation service tests
│   │   └── test_security.py               # JWT/bcrypt tests
│   │
│   ├── alembic/                            # Database migrations
│   │   ├── env.py                          # Alembic environment config
│   │   └── versions/                       # 26 migration files (001-026)
│   │
│   ├── backend/models/pca/                 # Pre-trained PCA model
│   │   ├── pca_v1.pkl                      # scikit-learn PCA model (3072->1536)
│   │   └── metadata.json                   # Model metadata (version, variance, training info)
│   │
│   ├── debug_matching.py - debug_matching6.py  # 6 matching debug scripts
│   ├── test_embedding_similarity.py        # Embedding similarity test
│   ├── test_fix.py, test_fix2.py           # Ad-hoc fix validation
│   ├── requirements.txt                    # Python dependencies (~30 packages)
│   ├── Dockerfile                          # Python 3.11-slim container
│   ├── alembic.ini                         # Alembic migration config
│   └── pytest.ini                          # pytest configuration (asyncio_mode=auto)
│
├── scripts/                                # Data pipeline scripts (13 files)
│   ├── scrape_ey_jobs.py                   # EY careers web scraper (BeautifulSoup, ThreadPool)
│   ├── field_extractors.py                 # Extract experience/education/certs from job HTML
│   ├── extract_all_job_skills.py           # Batch LLM skill extraction for all jobs
│   ├── generate_all_embeddings.py          # Batch embedding generation for skills/jobs
│   ├── train_pca_model.py                  # PCA model training (3072->1536, 1600 skill variations)
│   ├── validate_embedding_quality.py       # PCA model quality validation
│   ├── generate_synthetic_data.py          # Synthetic employee generation
│   ├── llm_generator.py                    # LLM-based synthetic data generation
│   ├── onet_client.py                      # O*NET API client for occupation data
│   ├── role_templates.py                   # Role/skill templates for synthetic data
│   ├── sql_exporter.py                     # Export data to SQL INSERT statements
│   ├── validators.py                       # Data validation utilities
│   └── test_llm_generator.py              # Tests for LLM generator
│
├── data/                                   # Seed data and synthetic datasets
│   ├── README.md                           # Data documentation
│   ├── seed_job_postings.sql               # Initial job posting seed data
│   ├── test_employees.sql                  # Test employee data
│   ├── synthetic_employees.sql             # Generated employee data v1
│   ├── synthetic_employees_v2.sql          # Generated employee data v2
│   ├── synthetic_employees_llm.json        # LLM-generated employees (JSON)
│   ├── synthetic_employees_llm.sql         # LLM-generated employees (SQL)
│   ├── pipeline_test.json                  # Pipeline test data
│   ├── pipeline_test.sql                   # Pipeline test SQL
│   ├── test_real_api.json                  # Real API test data
│   └── test_real_api.sql                   # Real API test SQL
│
├── docker/                                 # Docker initialization
│   └── postgres-init/                      # PostgreSQL init scripts (run on fresh volume only)
│       ├── 01_extensions.sql               # CREATE EXTENSION vector, pgcrypto
│       └── 02_pattern_indexes.sql          # 6 indexes on employees table
│
├── .cache/                                 # Scraper HTTP response cache
│   └── ey_scraper/                         # Thousands of .meta.json files (page cache)
│
├── docker-compose.yml                      # Multi-service orchestration (5 services)
├── .env                                    # Environment variables (not in git)
├── package.json                            # Root: Playwright E2E dependency
├── .gitignore                              # Git ignore rules
└── CLAUDE.md                               # Project instructions for AI agents
```

---

## File Count Summary

| Directory | Files | Primary Language |
|-----------|-------|-----------------|
| `frontend/src/components/` | 76 | TSX / JSX |
| `frontend/src/context/` | 9 | TSX |
| `frontend/src/services/` | 9 | TS |
| `frontend/src/pages/` | 9 | TSX |
| `frontend/src/hooks/` | 2 | TS |
| `frontend/src/data/` | 2 | TS |
| `frontend/src/mocks/` | 1 | JS |
| `frontend/` config files | 8 | Various |
| **Frontend total** | **~117** | |
| `backend/app/models/` | 15 | Python |
| `backend/app/routes/` | 7 | Python |
| `backend/app/schemas/` | 9 | Python |
| `backend/app/services/` | 20 | Python |
| `backend/app/utils/` | 6 | Python |
| `backend/app/` top-level | 4 | Python |
| `backend/tests/` | 12 | Python |
| `backend/alembic/versions/` | 27 | Python |
| `backend/` debug scripts | 9 | Python |
| **Backend total** | **~90** | |
| `scripts/` | 13 | Python |
| `data/` | 11 | SQL / JSON |
| `docker/` | 2 | SQL |
| **Grand total** | **~233+** | |
