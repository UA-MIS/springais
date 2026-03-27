# SpringAIS Master Documentation Manifest

**Date**: 2026-02-16
**Author**: Researcher Agent
**Purpose**: Complete inventory of all documentation sources, proposed master document structure, gap analysis, and overlap/duplication map.

---

## 1. Complete File Inventory

### 1.1 Root Project Files (4 files)

| File | Summary |
|------|---------|
| `README.md` | Project overview, tech stack, quick start guide, project structure, database schema summary, API endpoints, troubleshooting, data sharing workflow, contributing guide. |
| `CLAUDE.md` | BMAD swarm configuration: project type, language, framework, database, autonomy settings, artifact locations. |
| `project.yaml` | BMAD project metadata: name "SpringAis", type "web-app", phase "not-started", created 2026-02-11. |
| `swarm.yaml` | BMAD swarm configuration: stack (TypeScript/Python, React, Postgres+Redis), methodology (auto autonomy, all phases enabled, 2 parallel devs), quality gates (tests required, review required, human approval for PRD/architecture). |
| `docker-compose.yml` | Multi-service Docker Compose: postgres (pgvector/pg16), redis (7-alpine), backend (FastAPI on 8080), frontend (Vite on 3000), ey_scraper (on-demand profile). Resource limits defined per service. |

### 1.2 _bmad-output/ (44 files)

#### Analysis & Research (8 files)

| File | Summary |
|------|---------|
| `analysis/brainstorming-session-2025-12-18.md` | Comprehensive brainstorming session using Question Storming, Cross-Pollination, and Six Thinking Hats. Covers data strategy, LLM reliability, dual validation, bias mitigation, privacy, success patterns, UX flows. 14 key ideas generated. |
| `analysis/product-brief-SpringAIS-2025-12-18.md` | Product brief defining core vision, problem statement (invisible internal opportunities at EY), proposed solution (semantic AI matching, success pattern analysis, career journey maps), user personas, success metrics. |
| `analysis/research-prd-comparison-analysis.md` | Gap analysis comparing research findings to PRD. Identifies contradiction in utilization calculation, gaps in calibration session workflow, EY-Parthenon handling, skip promotion criteria. |
| `analysis/research/domain-ai-talent-mobility-platform-research-2025-12-18.md` | Domain research on AI-driven talent mobility: $40.53B HR tech market, regulatory landscape (Title VII, NYC Local Law 144, GDPR), technology trends (vector embeddings, explainable AI), strategic recommendations. |
| `analysis/research/domain-ey-career-progression-success-patterns-research-2025-12-20.md` | EY-specific career progression data: rank hierarchy (Staff to Partner), promotion timelines by business unit, EY-Parthenon exception, 6 success metric categories, promotion cycle details (August regular, January agile). |
| `analysis/research/domain-ey-performance-systems-promotion-evaluation-research-2025-12-18.md` | EY internal systems research: SuccessFactors, PX360, calibration sessions, internal mobility platforms, learning system integrations, performance review cycles. |
| `analysis/research/market-ai-talent-mobility-platform-research-2025-12-18.md` | Market research: top 10 players hold ~48% market share, internal hires cost 18% less, 51% employees unaware of internal opportunities, AI budgets projected $1.6M avg in 2026. |
| `analysis/research/technical-ai-talent-platform-technical-stack-research-2025-12-18.md` | Technical stack research: vector DB comparison (Chroma vs Qdrant), LLM strategy (dual validation, prompt/semantic caching), architecture patterns, external API integration (SuccessFactors, Credly, O*NET). |

#### Architecture Documents (5 files)

| File | Summary |
|------|---------|
| `architecture-backend.md` | Backend architecture: layered FastAPI (routes -> services -> models), 20 service files, 15 SQLAlchemy models, 7 route files, Redis multi-layer caching, OpenAI integration (GPT-5.2 + embeddings). |
| `architecture-frontend.md` | Frontend architecture: React 18 SPA, 9 context providers, 76 components across 10 directories, 9 pages with lazy loading, service layer with Axios APIClient. |
| `architecture-updates-2026.md` | Major architecture pivot from Azure cloud to local-first Docker development. Removed all Azure services, added git-based data sharing, simplified to vector-only matching for MVP. Cost from $30-50/month to $0. |
| `integration-architecture.md` | Frontend-backend communication: HTTP REST exclusively (no WebSocket/SSE/GraphQL), JWT Bearer auth, CORS config, API path conventions, endpoint mapping between services and contexts. |
| `integration-scan-findings.md` | Integration scan: frontend-backend API path mapping, auth lifecycle, CORS configuration, Docker networking, environment variable flow, shared dependencies. |

#### API & Data Models (2 files)

| File | Summary |
|------|---------|
| `api-contracts-backend.md` | Complete API contracts: auth endpoints (register/login/me/onboarding), matches, skills (extraction, modules, recommendations), patterns, roadmap (generate/save/progress), hiring manager, badges. All with request/response schemas. |
| `data-models-backend.md` | Full database schema: 16 tables across 5 domains (User/Auth, Jobs/Matching, Skills/Learning, Career/Roadmap, Hiring Manager). All columns, types, constraints, JSONB structures documented. 26 Alembic migrations. |

#### Development Guides (2 files)

| File | Summary |
|------|---------|
| `development-guide-backend.md` | Backend dev guide: prerequisites, Docker/local setup, environment variables, project structure, common patterns, testing with pytest. |
| `development-guide-frontend.md` | Frontend dev guide: prerequisites, Docker/local setup, environment variables, Vite config, component patterns, testing with Vitest. |

#### Scan Findings (3 files)

| File | Summary |
|------|---------|
| `backend-scan-findings.md` | Exhaustive backend scan: technology stack details (FastAPI, SQLAlchemy 2.0, psycopg3, pgvector, Redis, OpenAI models), 20 service files, 15 models, 7 route files, connection pooling, caching layers. |
| `frontend-scan-findings.md` | Exhaustive frontend scan: React 18, TypeScript, TailwindCSS v4, ReactFlow, Recharts, Framer Motion, dnd-kit, react-hook-form. 76 components inventoried with props and descriptions. |
| `component-inventory-frontend.md` | Complete React component catalog: 76 components across auth, common, career-viz, game, layout, matches, roadmap, role-detail, skills, successPatterns directories. |

#### Other (10 files)

| File | Summary |
|------|---------|
| `prd.md` | Full Product Requirements Document: 11 steps, executive summary, project classification, success criteria, user personas, functional requirements (matching, skill extraction, success patterns, career paths, roadmaps), non-functional requirements, tech stack decisions. |
| `tech-stack.md` | Technical stack documentation: free-tier/local-first architecture, external APIs (OpenAI, O*NET), cost breakdown ($3 total), development and demo strategy. |
| `ux-design-specification.md` | UX design specification: target users (employees, hiring managers), user flows, information architecture, wireframe descriptions, interaction patterns, accessibility considerations. |
| `consulting-meeting-valent-partner-review.md` | Meeting brief for Senior Partner Valent: non-technical executive summary, competition context (SCLC 2026 EY AI Competition), core innovation explanation, matching algorithm description. |
| `data-generation-plan.md` | Synthetic data plan: 900 employees across 3 service lines, hybrid generation (templates + LLM), validation rules, cost ~$2, role templates, LLM prompt templates. |
| `database-setup-guide.md` | Database setup & collaboration: Docker PostgreSQL quickstart, team data sharing via git branches, schema overview, common operations, troubleshooting. |
| `deployment-guide.md` | Deployment guide: Docker Compose service topology, quickstart, container configuration, environment variables, health checks, resource limits. |
| `project-overview.md` | Generated project overview: executive summary, technology stack table, architecture type, repository structure with file counts, feature area descriptions. |
| `source-tree-analysis.md` | Annotated directory tree: every source file with purpose description, organized by frontend/backend/infrastructure. |
| `index.md` | Documentation index: quick reference table (frontend vs backend stats), getting started steps, links to all generated documentation files with descriptions and line counts. |

#### UX HTML Mockups (13 files)

| File | Summary |
|------|---------|
| `ux-design-directions.html` | Initial UX design direction explorations |
| `ux-design-directions-progress.html` | Progress visualization design directions |
| `ux-enhanced-portfolio-drafts.html` | Enhanced portfolio view drafts |
| `ux-insano-career-paths.html` | Career paths visualization mockup |
| `ux-insano-with-portfolio.html` | Integrated portfolio + career paths mockup |
| `ux-organic-data-visualizations.html` | Organic/nature-inspired data visualization mockup |
| `ux-portfolio-variations.html` | Portfolio page layout variations |
| `ux-professional-drafts.html` | Professional/corporate UX drafts |
| `ux-skill-tree-poe.html` | Path of Exile-inspired skill tree mockup |
| `ux-unified-dashboard-roadmap-enhanced.html` | Unified dashboard with enhanced roadmap |
| `ux-unified-dashboard-v2.html` | Unified dashboard v2 design |
| `ux-unified-dashboard-v2-with-enhanced-roadmap.html` | Unified dashboard v2 with roadmap integration |
| `ux-unified-feedback-integration.html` | Feedback integration into unified dashboard |

#### Other Non-MD Files (2 files)

| File | Summary |
|------|---------|
| `project-scan-report.json` | Machine-readable project scan data |
| `bmm-workflow-status.yaml` | BMAD workflow status tracker: discovery, planning, solutioning, implementation phase tracking |

### 1.3 reference-docs/ (17 files)

| File | Summary |
|------|---------|
| `README.md` | Reference docs index: organization structure, document summaries, cross-references, usage guide for new developers, backend devs, frontend devs, integration work. |
| `architecture/system-overview.md` | System overview: architecture diagram, tech stack, 900 employees/25 roles/3 service lines, key design decisions, performance targets, cost estimates. |
| `architecture/data-flow.md` | Data flow documentation: 4 core user journeys (profile creation, job matching, career path visualization, success pattern analysis), database query patterns, caching strategies. |
| `architecture/block-dependencies.md` | Block dependency graph: 18 blocks across 3 phases, parallelization strategy for 4 developers, critical path analysis, mock data strategy, risk mitigation. |
| `backend/api-reference.md` | API endpoint reference: all REST endpoints with request/response examples, authentication, error formats. Pre-implementation reference (uses /api/auth prefix). |
| `backend/database-schema.md` | Database schema: 12 core tables (pre-gamification) across 4 functional areas, ER diagram, indexes, pgvector HNSW, sample data, migration patterns. |
| `backend/llm-integration.md` | LLM integration guide: OpenAI API setup, GPT-5.2 Instant skill extraction prompts, text-embedding-3-large vectors, error handling, caching, cost optimization ($8 for MVP). |
| `backend/service-patterns.md` | Service layer patterns: layered architecture, service class structure, DB session management, caching with Redis decorators, error handling, logging, testing patterns. |
| `frontend/component-library.md` | Component library: layout, auth, skill, match, career viz, common components. Pre-implementation reference (describes planned rather than actual components). |
| `frontend/routing-structure.md` | Routing: route tree, App.tsx configuration, ProtectedRoute, navigation helpers. Pre-implementation reference. |
| `frontend/state-management.md` | State management: React Query setup, fetching/mutations, prefetching, auth context, custom hooks, cache invalidation, optimistic updates. |
| `frontend/styling-guide.md` | Styling guide: EY color palette, typography, spacing, layout patterns, component styling, responsive design, shadcn/ui usage. |
| `data/mock-data-formats.md` | Mock data formats: TypeScript interfaces for all data types, mock service implementations for frontend dev before backend integration. |
| `data/seed-scripts.md` | Seed scripts: role hierarchy (25 roles), synthetic employees (900), job postings (30-50 scraped), skills/embeddings, career transitions (5,000). |
| `data/synthetic-data-generation.md` | Synthetic data strategy: hybrid approach (templates + LLM), 900 employees for ~$2, data volume breakdown, quality validation. |
| `integration/api-contracts.md` | API contracts: frontend-backend contract definitions for auth, skills, matches, career paths, success patterns. For integration blocks M-P. |
| `integration/testing-strategy.md` | Testing strategy: pyramid (60% unit, 30% integration, 10% E2E), backend pytest, frontend Vitest, integration FastAPI TestClient, E2E Playwright, performance Locust, security OWASP ZAP. |

### 1.4 artifacts/ (58 files)

#### Planning (2 files)

| File | Summary |
|------|---------|
| `planning/prd-medieval-mode.md` | PRD for medieval mode economy overhaul: 9 epics, server-side progression, XP/coins, achievements, cosmetic store, side quests, event hooks, frontend migration, anti-cheat. Complexity score 13. |
| `planning/badge-system-prd.md` | PRD for badge discovery system: specific badge suggestions per skill, roadmap milestone certification links, interaction tracking for ROI, feedback loop for improvement. |

#### Architecture Design (3 files)

| File | Summary |
|------|---------|
| `design/architecture-medieval-mode.md` | Architecture for medieval mode: database schema (11 new tables), API endpoints, service layer, XP calculation engine, event system, frontend changes, Redis caching, migration plan, 7 ADRs. |
| `design/architecture-cedric-avatar.md` | Architecture for Cedric avatar companion: component hierarchy, state management (CedricContext), React Joyride integration, speech bubble system, animation system, asset architecture, onboarding flow, loading narrator, contextual guidance. |
| `design/badge-system-architecture.md` | Architecture for badge discovery: backend (badge catalog, discovery service, API router), frontend (BadgeCard, BadgeSearch, BadgeSection), AI integration, caching strategy, migration strategy, 5 ADRs. |

#### ADRs (12 files)

| File | Summary |
|------|---------|
| `design/decisions/ADR-001-curated-catalog-primary.md` | Badge system: curated catalog is primary source, external APIs (Microsoft Learn, Credly) enrich but never override. Matching pipeline priority order. |
| `design/decisions/ADR-002-microsoft-learn-first.md` | Badge system: integrate Microsoft Learn API first (free, public, no auth) before Credly API (requires enterprise agreement). |
| `design/decisions/ADR-003-additive-schema-changes.md` | Badge system: all schema changes additive with optional fields and defaults. No breaking changes to existing JSONB data. |
| `design/decisions/ADR-004-async-badge-loading.md` | Badge system: badge suggestions load asynchronously, never block primary UI. Latency budget: Redis <5ms, PostgreSQL 10-50ms, external APIs 200-1000ms. |
| `design/decisions/ADR-005-interaction-tracking.md` | Badge system: track 4 interaction types (click, rating, completion, dismiss) in dedicated table for ROI measurement. |
| `design/decisions/ADR-MM-001-alembic-migrations.md` | Medieval mode: adopt Alembic for gamification schema migrations. Existing tables stay on create_all(). |
| `design/decisions/ADR-MM-002-redis-progression-cache.md` | Medieval mode: cache full progression state in Redis (5-min TTL), invalidate on any mutation. |
| `design/decisions/ADR-MM-003-sync-achievement-eval.md` | Medieval mode: synchronous in-process achievement evaluation (~25 rows, <10ms). No background workers. |
| `design/decisions/ADR-MM-004-coin-balance-locking.md` | Medieval mode: SELECT FOR UPDATE row-level locking on user_progression for all coin mutations. Prevents race conditions and negative balances. |
| `design/decisions/ADR-MM-005-linear-xp-curve.md` | Medieval mode: replace exponential XP curve with linear-step curve. Old curve made level 20 unreachable (8,870 modules). |
| `design/decisions/ADR-MM-006-no-localstorage-migration.md` | Medieval mode: no migration of localStorage gamification data. Data is unverifiable, not per-user, different schema. Fresh start on server. |
| `design/decisions/ADR-MM-007-cosmetic-equipment-rendering.md` | Cedric avatar: cosmetic rendering strategy for 20 animation states. Addresses 480+ overlay asset problem with palette swaps and category-based rendering. |

#### Exploration (7 files)

| File | Summary |
|------|---------|
| `exploration/codebase-analysis.md` | Codebase analysis for medieval mode overhaul: technology stack, frontend components, backend services, existing gamification (localStorage-only), database models, critical bugs identified. |
| `exploration/avatar-concept.md` | Avatar companion concept "Your Knight": pixel-art squire (64x64), 8 equipment slots, chibi proportions, idle animations, visual progression from peasant to armored knight. |
| `exploration/avatar-guide-concept.md` | Definitive vision for Cedric as voice of SpringAIS: onboarding guide, roadmap narrator, contextual companion. Character identity, personality, dialogue system, integration with existing gamification. |
| `exploration/avatar-guide-research.md` | Research on avatar-as-guide: current app flow analysis, onboarding walkthrough approaches (React Joyride), AI assistant persona patterns, loading state narration. |
| `exploration/avatar-research.md` | Avatar rendering research: DOM/CSS layers vs SVG vs Canvas vs WebGL vs Lottie comparison. Recommends DOM/CSS layered PNG composition for small persistent companion. |
| `exploration/badge-discovery-research.md` | Badge discovery research: Credly API (authenticated, enterprise agreement needed), Microsoft Learn API (free, public), structured URL patterns, AI-powered curated mapping. Hybrid approach recommended. |
| `exploration/current-badge-analysis.md` | Current badge integration analysis: data flow map, gap analysis (generic links, AI hallucination, dead display code, plain-text resources, no tracking), schema/type analysis, UI/UX audit, quick wins, technical debt. |

#### Epics (17 files)

| File | Summary |
|------|---------|
| `implementation/epics/epic-1-server-foundation.md` | Epic 1: Alembic setup, progression/event/coin tables, progression API endpoints, login streak, page visit tracking. 8 stories. |
| `implementation/epics/epic-2-xp-leveling.md` | Epic 2: XP calculation engine, linear-step curve, level-up detection, XP history. 5 stories. |
| `implementation/epics/epic-3-coin-economy.md` | Epic 3: Coin transactions, SELECT FOR UPDATE locking, coin history, balance validation. 4 stories. |
| `implementation/epics/epic-4-achievements.md` | Epic 4: Achievement catalog, evaluation engine, unlock flow, achievement display. 5 stories. |
| `implementation/epics/epic-5-event-hooks.md` | Epic 5: Reward hook service, event type config, action-to-reward mapping, idempotency. 5 stories. |
| `implementation/epics/epic-6-cosmetic-store.md` | Epic 6: Cosmetic catalog, store API, purchase/equip flow, equipment slots. 7 stories. |
| `implementation/epics/epic-7-side-quests.md` | Epic 7: Quest catalog, progress tracking, quest completion, daily/weekly quests. 6 stories. |
| `implementation/epics/epic-8-frontend-ui.md` | Epic 8: AdventureModeContext migration to React Query, HUD updates, store page, quest page, notification integration. 8 stories. |
| `implementation/epics/epic-9-integration-polish.md` | Epic 9: Cross-feature integration, edge cases, performance optimization, final polish. 6 stories. |
| `implementation/epics/cedric-epic-1-foundation.md` | Cedric Epic 1: CedricContext provider, AvatarSprite component, pedestal/nameplate, root companion component, placeholder assets. 6 stories. |
| `implementation/epics/cedric-epic-2-onboarding.md` | Cedric Epic 2: React Joyride walkthrough, step definitions, first-time detection, rewards, backend walkthrough fields. 7 stories. |
| `implementation/epics/cedric-epic-3-speech-bubble.md` | Cedric Epic 3: Speech bubble component, typing animation, theme variants, queue display, auto-dismiss. 5 stories. |
| `implementation/epics/cedric-epic-4-animations.md` | Cedric Epic 4: Sprite sheet animations, transition system, reaction animations, idle state cycling. 5 stories. |
| `implementation/epics/cedric-epic-5-loading-narrator.md` | Cedric Epic 5: Loading narrator during roadmap generation, phased dialogue, animation sync, progress stages. 5 stories. |
| `implementation/epics/cedric-epic-6-contextual-guidance.md` | Cedric Epic 6: Page-specific tips, inactivity prompts, achievement celebrations, contextual reactions. 6 stories. |
| `implementation/epics/cedric-epic-7-store-preview.md` | Cedric Epic 7: Store page avatar preview, equipment try-on, before/after comparison. 4 stories. |
| `implementation/epics/cedric-epic-8-polish.md` | Cedric Epic 8: Performance optimization, accessibility, edge cases, cross-browser testing, final polish. 4 stories. |

#### Sprint Status (2 files)

| File | Summary |
|------|---------|
| `implementation/sprint-status.yaml` | Medieval mode sprint status: 9 epics, 50 stories total, all ready for development. Epic dependency chain and phase assignments. |
| `implementation/sprint-status-cedric.yaml` | Cedric avatar sprint status: 8 epics, 42 stories total. Two-developer assignment, dependency chains, immediately startable stories per epic. |

#### Reviews (13 files)

| File | Summary |
|------|---------|
| `reviews/architecture-security-review.md` | Security review of medieval mode architecture: 4 blocking, 12 advisory findings. Covers XP/coin manipulation, rate limiting, SQL injection, IDOR, session management. |
| `reviews/code-review-epic-1.md` | Code review for Epic 1 (server-side progression foundation): blocking finding on login not calling record_login, advisory on deprecated datetime.utcnow(). |
| `reviews/code-review-epic-2.md` | Code review for Epic 2 (XP/leveling): findings on XP calculation edge cases, level boundary handling. |
| `reviews/code-review-epic-3.md` | Code review for Epic 3 (coin economy): findings on transaction isolation, balance checking. |
| `reviews/code-review-epic-4.md` | Code review for Epic 4 (achievements): findings on evaluation performance, batch queries. |
| `reviews/code-review-epic-5.md` | Code review for Epic 5 (event hooks): findings on reward configuration, idempotency enforcement. |
| `reviews/code-review-epic-6.md` | Code review for Epic 6 (cosmetic store): findings on purchase flow, equipment slot validation. |
| `reviews/code-review-epic-7.md` | Code review for Epic 7 (side quests): findings on quest progress tracking, completion detection. |
| `reviews/code-review-epic-8.md` | Code review for Epic 8 (frontend UI): findings on context migration, React Query integration. |
| `reviews/code-review-cedric.md` | Code review for Cedric avatar: 7 blocking (stale closures, memory leaks, animation conflicts), 8 advisory findings. |
| `reviews/code-review-cedric-fixes.md` | Follow-up review for Cedric fixes: verification of blocking finding resolutions. |
| `reviews/delivery-summary.md` | Delivery summary for medieval mode: 9 epics implemented across 5 phases, complete server-side gamification economy replacing localStorage. |
| `reviews/delivery-summary-cedric.md` | Delivery summary for Cedric avatar: 46 new frontend files, components for sprite rendering, speech bubbles, walkthrough, character sheet, loading narrator. |
| `reviews/qa-test-results.md` | QA test results: full PRD traceability matrix for 28 functional requirements (FR-001 through FR-028), implementation files mapped to tests. |
| `reviews/badge-system-code-review.md` | Code review for badge discovery system implementation. |

### 1.5 implementation-tracking/ (60 files)

| File | Summary |
|------|---------|
| `PROJECT-STATUS.md` | Master project status: 19 blocks across 3 steps, completion status per block, assignees, progress percentages, estimated times. Setup complete, several Step 2 blocks complete. |

#### STEP-1-SETUP/ (3 files)

| File | Summary |
|------|---------|
| `CONTEXT.md` | Setup context: Docker Compose, database creation, pgvector extension, CORS, health checks. |
| `TASKS.md` | 15 setup tasks with checkboxes. |
| `VERIFICATION.md` | Verification checklist for setup completion. |

#### STEP-2-DEVELOPMENT/ BLOCK-A through BLOCK-L (36 files)

Each block has CONTEXT.md, TASKS.md, and VERIFICATION.md covering:
- **Block A**: Synthetic data generation (900 employees, 3 service lines)
- **Block B**: Job posting scraper (EY careers site)
- **Block C**: Database models & ORM (SQLAlchemy models)
- **Block D**: Vector embeddings infrastructure (pgvector, text-embedding-3-large)
- **Block E**: Matching engine core (cosine similarity, multi-layer matching)
- **Block F**: Success pattern analysis (SQL aggregations, metric benchmarking)
- **Block G**: Skill extraction pipeline (GPT-5.2 resume parsing, dual validation)
- **Block H**: Auth & layout structure (JWT auth, protected routes, layouts)
- **Block I**: Skills dashboard UI (profile, skill cards, resume upload)
- **Block J**: Match results UI (match cards, filters, virtual scrolling)
- **Block K**: Career visualization (ReactFlow graph, Dagre layout)
- **Block L**: Success pattern UI (Recharts, metrics, filters)

#### STEP-3-INTEGRATION/ BLOCK-M through BLOCK-R (18 files)

Each block has CONTEXT.md, TASKS.md, and VERIFICATION.md covering:
- **Block M**: Core integration (auth + DB connection)
- **Block N**: Skills dashboard integration (frontend-backend connection)
- **Block O**: Matching integration (end-to-end matching flow)
- **Block P**: Visualization integration (career graph + success patterns)
- **Block Q**: E2E testing & polish (Playwright, performance)
- **Block R**: Embeddings persistence (vector storage optimization)

### 1.6 docs/ (3 files)

| File | Summary |
|------|---------|
| `integration_patterns.md` | Shared integration patterns for Step 3: authenticated API calls, auth lifecycle, skill recommendations, save match trigger. |
| `scraping_guide.md` | EY job scraper guide: prerequisites, install deps, run migrations, run scraper, Docker-based scraping. |
| `scraping_notes.md` | Scraping research notes: EY careers site endpoints (careers.ey.com), HTML selectors, pagination, job page URL patterns, external_id extraction. |

---

## 2. Proposed Master Document Structure

### Table of Contents

```
SPRINGAIS MASTER DOCUMENTATION
================================

PART I: EXECUTIVE OVERVIEW
  1. Executive Summary
     - Project description
     - Competition context (SCLC 2026 EY AI Competition)
     - Key innovations (semantic matching, dual LLM validation, success patterns)
  2. Technology Stack Summary
     - Frontend: React 18, TypeScript, Vite, TailwindCSS v4
     - Backend: FastAPI, Python 3.11, SQLAlchemy 2.0
     - Database: PostgreSQL 16 + pgvector, Redis 7
     - AI/ML: OpenAI GPT-5.2, text-embedding-3-large
     - Infrastructure: Docker Compose, local-first architecture

PART II: PRODUCT VISION & DISCOVERY
  3. Brainstorming Session
     (Source: _bmad-output/analysis/brainstorming-session-2025-12-18.md)
  4. Product Brief
     (Source: _bmad-output/analysis/product-brief-SpringAIS-2025-12-18.md)
  5. Domain Research
     5.1 AI Talent Mobility Platform Research
     (Source: analysis/research/domain-ai-talent-mobility-platform-research-2025-12-18.md)
     5.2 EY Performance Systems & Promotion Evaluation
     (Source: analysis/research/domain-ey-performance-systems-promotion-evaluation-research-2025-12-18.md)
     5.3 EY Career Progression & Success Patterns
     (Source: analysis/research/domain-ey-career-progression-success-patterns-research-2025-12-20.md)
  6. Market Research
     (Source: analysis/research/market-ai-talent-mobility-platform-research-2025-12-18.md)
  7. Technical Stack Research
     (Source: analysis/research/technical-ai-talent-platform-technical-stack-research-2025-12-18.md)
  8. Consulting Meeting Brief (Valent Partner Review)
     (Source: _bmad-output/consulting-meeting-valent-partner-review.md)

PART III: PRODUCT REQUIREMENTS
  9. Main Product Requirements Document (PRD)
     (Source: _bmad-output/prd.md)
  10. Research-PRD Comparison Analysis
     (Source: _bmad-output/analysis/research-prd-comparison-analysis.md)
  11. Medieval Mode Economy PRD
     (Source: artifacts/planning/prd-medieval-mode.md)
  12. Badge Discovery System PRD
     (Source: artifacts/planning/badge-system-prd.md)

PART IV: UX DESIGN
  13. UX Design Specification
     (Source: _bmad-output/ux-design-specification.md)
  14. UX Mockup Index
     (Catalog of 13 HTML mockups in _bmad-output/)

PART V: SYSTEM ARCHITECTURE
  15. Architecture Overview
     15.1 System Overview
     (Source: reference-docs/architecture/system-overview.md)
     15.2 Architecture Updates (Jan 2026 pivot)
     (Source: _bmad-output/architecture-updates-2026.md)
  16. Backend Architecture
     (Source: _bmad-output/architecture-backend.md)
  17. Frontend Architecture
     (Source: _bmad-output/architecture-frontend.md)
  18. Integration Architecture
     (Source: _bmad-output/integration-architecture.md)
  19. Data Flow Architecture
     (Source: reference-docs/architecture/data-flow.md)
  20. Medieval Mode Architecture
     (Source: artifacts/design/architecture-medieval-mode.md)
  21. Cedric Avatar Architecture
     (Source: artifacts/design/architecture-cedric-avatar.md)
  22. Badge System Architecture
     (Source: artifacts/design/badge-system-architecture.md)

PART VI: ARCHITECTURE DECISION RECORDS
  23. Badge System ADRs
     23.1 ADR-001: Curated Catalog as Primary Source
     23.2 ADR-002: Microsoft Learn API First
     23.3 ADR-003: Additive Schema Changes
     23.4 ADR-004: Async Badge Loading
     23.5 ADR-005: Badge Interaction Tracking
  24. Medieval Mode ADRs
     24.1 ADR-MM-001: Alembic Migrations
     24.2 ADR-MM-002: Redis Progression Cache
     24.3 ADR-MM-003: Synchronous Achievement Evaluation
     24.4 ADR-MM-004: Coin Balance Locking (SELECT FOR UPDATE)
     24.5 ADR-MM-005: Linear XP Curve
     24.6 ADR-MM-006: No localStorage Migration
     24.7 ADR-MM-007: Cosmetic Equipment Rendering

PART VII: TECHNOLOGY STACK & INFRASTRUCTURE
  25. Technical Stack Documentation
     (Source: _bmad-output/tech-stack.md)
  26. Deployment Guide
     (Source: _bmad-output/deployment-guide.md)
  27. Database Setup & Collaboration Guide
     (Source: _bmad-output/database-setup-guide.md)
  28. Docker Compose Configuration
     (Source: docker-compose.yml)

PART VIII: BACKEND REFERENCE
  29. API Contracts (Actual Implementation)
     (Source: _bmad-output/api-contracts-backend.md)
  30. Database Schema (Actual Implementation - 16 tables)
     (Source: _bmad-output/data-models-backend.md)
  31. LLM Integration Guide
     (Source: reference-docs/backend/llm-integration.md)
  32. Service Layer Patterns
     (Source: reference-docs/backend/service-patterns.md)
  33. Backend Development Guide
     (Source: _bmad-output/development-guide-backend.md)
  34. Backend Scan Findings
     (Source: _bmad-output/backend-scan-findings.md)

PART IX: FRONTEND REFERENCE
  35. Component Inventory (76 components)
     (Source: _bmad-output/component-inventory-frontend.md)
  36. State Management Patterns
     (Source: reference-docs/frontend/state-management.md)
  37. Routing Structure
     (Source: reference-docs/frontend/routing-structure.md)
  38. Styling Guide (EY Branding)
     (Source: reference-docs/frontend/styling-guide.md)
  39. Frontend Development Guide
     (Source: _bmad-output/development-guide-frontend.md)
  40. Frontend Scan Findings
     (Source: _bmad-output/frontend-scan-findings.md)

PART X: DATA & INTEGRATION
  41. Synthetic Data Generation Plan
     (Source: _bmad-output/data-generation-plan.md)
  42. Mock Data Formats
     (Source: reference-docs/data/mock-data-formats.md)
  43. Seed Scripts Reference
     (Source: reference-docs/data/seed-scripts.md)
  44. Job Scraping Guide & Notes
     (Sources: docs/scraping_guide.md, docs/scraping_notes.md)
  45. Integration Patterns
     (Source: docs/integration_patterns.md)
  46. Testing Strategy
     (Source: reference-docs/integration/testing-strategy.md)

PART XI: EPICS & STORIES
  47. Medieval Mode Epics (9 epics, 50 stories)
     47.1 Epic 1: Server-Side Progression Foundation
     47.2 Epic 2: XP System & Leveling Engine
     47.3 Epic 3: Coin Economy System
     47.4 Epic 4: Achievement System
     47.5 Epic 5: Event/Action Reward Hooks
     47.6 Epic 6: Cosmetic Store
     47.7 Epic 7: Side Quest System
     47.8 Epic 8: Frontend UI Migration
     47.9 Epic 9: Integration & Polish
  48. Cedric Avatar Epics (8 epics, 42 stories)
     48.1 Epic 1: Avatar Component Foundation
     48.2 Epic 2: Onboarding Walkthrough Quest
     48.3 Epic 3: Speech Bubble System
     48.4 Epic 4: Animation System
     48.5 Epic 5: Loading Narrator
     48.6 Epic 6: Contextual Guidance
     48.7 Epic 7: Store Preview
     48.8 Epic 8: Polish & Performance

PART XII: IMPLEMENTATION HISTORY
  49. Project Status Overview
     (Source: implementation-tracking/PROJECT-STATUS.md)
  50. Block Dependencies & Parallelization
     (Source: reference-docs/architecture/block-dependencies.md)
  51. Implementation Blocks A-L (Development)
     (Summary of 36 CONTEXT/TASKS/VERIFICATION files)
  52. Implementation Blocks M-R (Integration)
     (Summary of 18 CONTEXT/TASKS/VERIFICATION files)

PART XIII: CODE REVIEWS
  53. Medieval Mode Code Reviews
     53.1 Epic 1 Review
     53.2 Epic 2 Review
     53.3 Epic 3 Review
     53.4 Epic 4 Review
     53.5 Epic 5 Review
     53.6 Epic 6 Review
     53.7 Epic 7 Review
     53.8 Epic 8 Review
  54. Cedric Avatar Code Reviews
     54.1 Initial Review
     54.2 Fix Verification Review
  55. Badge System Code Review

PART XIV: QA & DELIVERY
  56. QA Test Results (PRD Traceability Matrix)
     (Source: artifacts/reviews/qa-test-results.md)
  57. Medieval Mode Delivery Summary
     (Source: artifacts/reviews/delivery-summary.md)
  58. Cedric Avatar Delivery Summary
     (Source: artifacts/reviews/delivery-summary-cedric.md)

PART XV: SECURITY REVIEW
  59. Architecture Security Review
     (Source: artifacts/reviews/architecture-security-review.md)

PART XVI: EXPLORATION & RESEARCH ARTIFACTS
  60. Codebase Analysis
     (Source: artifacts/exploration/codebase-analysis.md)
  61. Avatar Research & Concepts
     61.1 Avatar Rendering Research
     61.2 Avatar Companion Concept
     61.3 Avatar-as-Guide Research
     61.4 Avatar-as-Guide Concept (Definitive Vision)
  62. Badge Discovery Research
     62.1 Badge Discovery Research
     62.2 Current Badge Analysis

APPENDICES
  A. Source Tree Analysis
     (Source: _bmad-output/source-tree-analysis.md)
  B. Project Scan Report
     (Source: _bmad-output/project-scan-report.json)
  C. Sprint Status YAML Files
     (Sources: artifacts/implementation/sprint-status.yaml, sprint-status-cedric.yaml)
  D. BMAD Workflow Status
     (Source: _bmad-output/bmm-workflow-status.yaml)
```

---

## 3. Gap Analysis: Undocumented Features & Patterns

### 3.1 Backend Services Not Fully Documented

The following backend services exist in code but have limited or no dedicated documentation:

| Service | File | What's Missing |
|---------|------|----------------|
| `analysis_service.py` | `backend/app/services/analysis_service.py` | Not mentioned in any reference doc. Purpose and API unclear from docs alone. |
| `embedding_integration.py` | `backend/app/services/embedding_integration.py` | Integration layer between embedding service and other services. Not documented. |
| `incremental_match_service.py` | `backend/app/services/incremental_match_service.py` | Incremental matching (vs full recalculation) not documented. Performance optimization pattern. |
| `job_import_service.py` | `backend/app/services/job_import_service.py` | Job import pipeline not documented beyond scraper notes. |
| `skill_normalizer.py` | `backend/app/services/skill_normalizer.py` | Skill normalization (handling synonyms like C#/csharp) -- mentioned in brainstorming but no dedicated documentation of the actual implementation. |
| `skill_taxonomy.py` | `backend/app/services/skill_taxonomy.py` | Skill taxonomy service -- the O*NET integration and taxonomy hierarchy are not fully documented. |
| `skill_grouping_service.py` | `backend/app/services/skill_grouping_service.py` | AI-powered skill grouping into categories. Not documented. |
| `recommendation_service.py` | `backend/app/services/recommendation_service.py` | Skill recommendation engine. Not documented. |
| `roadmap_progress_service.py` | `backend/app/services/roadmap_progress_service.py` | Roadmap milestone progress tracking. Not documented separately. |
| `badge_discovery_service.py` | `backend/app/services/badge_discovery_service.py` | Badge discovery implementation. Architecture doc exists but no implementation reference. |
| `microsoft_learn_client.py` | `backend/app/services/microsoft_learn_client.py` | Microsoft Learn API client. Architecture doc exists but no implementation guide. |
| `credly_client.py` | `backend/app/services/credly_client.py` | Credly API client. Architecture doc exists but no implementation guide. |

### 3.2 Matching Engine Specifics

The matching engine (`matching_service.py`) uses a multi-layer approach that is documented at a high level but lacks detailed documentation of:
- **4-layer matching algorithm**: taxonomy match, exact match, semantic match, fuzzy match -- the weights and thresholds for each layer
- **Match scoring formula**: how the final match percentage is computed from individual layer scores
- **Skill version invalidation**: how Redis cache invalidation works when user skills change
- **Match cache service**: `match_cache_service.py` patterns for caching match results (5-min TTL with skill-version keys)

### 3.3 Dual LLM Validation Pattern

The brainstorming and PRD extensively describe dual LLM validation as a key innovation, but the actual implementation in `skill_extractor.py` is not documented with:
- Exact prompts used for extraction vs validation
- How confidence scores are calculated
- Evidence quote extraction format
- Error handling when LLMs disagree
- Cost per extraction operation

### 3.4 Auth Flow Details

The actual auth implementation has evolved beyond the reference docs:
- JWT implementation details (HS256, 7-day expiry) are in the scan findings but not in a dedicated auth doc
- Account types ("personal" vs "hiring_manager") and their routing implications
- Onboarding flow (the `onboarding_complete` flag and what triggers it)
- The split auth path convention (auth routes at `/auth/*` without `/api` prefix)
- Password hashing (bcrypt)

### 3.5 Redis Usage Patterns

Redis is used extensively but no single document covers all cache layers:
- **Match result cache**: 5-min TTL, skill-version invalidation
- **Embedding cache**: exact match Layer 1
- **Pattern cache**: 24h TTL
- **Job skill extraction cache**: 30-day TTL
- **Progression state cache**: 5-min TTL, mutation invalidation (medieval mode)
- Connection pooling: max_connections=20

### 3.6 Game Mechanics Implementation

The medieval mode is well-documented in PRD/architecture, but the following implementation details are not captured:
- **Actual reward amounts** per action type (module_completed, roadmap_generated, match_saved, etc.)
- **Feature unlock thresholds** by level
- **Achievement catalog** (24 achievements with trigger conditions)
- **Cosmetic catalog** (30+ items across 8 slots with prices)
- **Side quest catalog** (5 quests with completion criteria)
- **Login streak calculation** logic and timezone handling

### 3.7 Frontend Context Providers (Actual Implementation)

The reference docs describe 9 context providers, but the actual codebase has evolved:
- `SavedRolesContext.tsx` -- not in any documentation
- `ToastContext.tsx` -- not in any documentation
- `CedricContext.tsx` -- documented in architecture but no implementation reference
- `RoadmapContext.tsx` -- mentioned but not detailed
- `AdventureModeContext.tsx` -- fully migrated to React Query backend calls, but reference docs still describe the old localStorage version

### 3.8 Pages Added After Reference Docs

Several pages exist in the codebase that were added after the reference docs were written:
- `QuestsPage.tsx` -- Side quest interface
- `StorePage.tsx` -- Cosmetic store
- `SavedRolesPage.tsx` -- Saved roles
- `RoadmapPage.tsx` -- Roadmap viewer (separate from career path)
- `RoleDetailPage.tsx` -- Role detail view
- `RoleRequirementPage.tsx` -- Role requirement breakdown

### 3.9 Database Schema Divergence

The reference-docs database schema (12 tables) is outdated. The actual schema (_bmad-output/data-models-backend.md) has 16 tables. The following tables are NOT in the reference docs:
- `career_paths` -- career path data
- `saved_roadmaps` -- user-saved roadmaps
- `roadmap_milestone_progress` -- milestone tracking
- `roadmap_extras` -- additional roadmap data
- `roadmap_edits` -- user edits to roadmaps
- `hm_saved_jobs` -- hiring manager saved jobs
- `skill_taxonomy` -- skill taxonomy data

Plus the gamification tables (from medieval mode) are entirely absent from reference docs:
- `user_progression`, `gamification_events`, `coin_transactions`
- `achievement_catalog`, `user_achievements`
- `cosmetic_catalog`, `user_owned_cosmetics`, `user_equipped_items`
- `side_quest_catalog`, `user_quest_progress`
- `page_visits`

And badge tables:
- `badge_catalog`, `skill_badge_mappings`, `badge_interactions`

---

## 4. Overlap/Duplication Map

### 4.1 High Overlap (Should Merge, Not Duplicate)

| Topic | Files That Overlap | Recommendation |
|-------|-------------------|----------------|
| **Database Schema** | reference-docs/backend/database-schema.md (12 tables, outdated) vs _bmad-output/data-models-backend.md (16 tables, current) | Use _bmad-output version as authoritative. Reference-docs version is stale. |
| **API Reference** | reference-docs/backend/api-reference.md (pre-implementation, /api/auth prefix) vs _bmad-output/api-contracts-backend.md (actual implementation, /auth prefix) | Use _bmad-output version. Reference-docs version has incorrect path conventions. |
| **System Architecture** | reference-docs/architecture/system-overview.md vs _bmad-output/project-overview.md vs _bmad-output/architecture-backend.md + architecture-frontend.md | Use _bmad-output/project-overview.md as executive summary, then _bmad-output architecture files for detail. Reference-docs version is thinner. |
| **Component Library** | reference-docs/frontend/component-library.md (pre-implementation) vs _bmad-output/component-inventory-frontend.md (76 components, actual scan) vs _bmad-output/frontend-scan-findings.md (same data, different format) | Use component-inventory-frontend.md as authoritative. Reference-docs version describes planned, not actual components. frontend-scan-findings.md is a superset. |
| **Frontend Architecture** | reference-docs/frontend/ (routing, state, styling) vs _bmad-output/architecture-frontend.md | _bmad-output version is based on actual codebase scan. Reference-docs versions are planning docs. Merge where reference-docs have useful patterns not in scan. |
| **Integration Architecture** | _bmad-output/integration-architecture.md vs _bmad-output/integration-scan-findings.md vs reference-docs/integration/api-contracts.md vs docs/integration_patterns.md | _bmad-output/integration-architecture.md is the most complete. integration-scan-findings.md adds raw findings. Reference-docs and docs/ versions are pre-implementation. |
| **Synthetic Data** | _bmad-output/data-generation-plan.md vs reference-docs/data/synthetic-data-generation.md vs reference-docs/data/seed-scripts.md | _bmad-output version is the most detailed. Reference-docs versions are summaries. |
| **Deployment** | README.md (quickstart) vs _bmad-output/deployment-guide.md vs _bmad-output/database-setup-guide.md | README has user-facing quickstart. deployment-guide.md and database-setup-guide.md have operational detail. Minimal overlap -- can coexist. |
| **Tech Stack** | _bmad-output/tech-stack.md vs _bmad-output/project-overview.md (tech stack table) vs README.md (tech stack section) | tech-stack.md is the authoritative detailed version. Others are summaries. |

### 4.2 Partial Overlap (Keep Both, Cross-Reference)

| Topic | Files | Recommendation |
|-------|-------|----------------|
| **PRD + Product Brief** | _bmad-output/prd.md vs _bmad-output/analysis/product-brief-SpringAIS-2025-12-18.md | Product brief is the precursor to PRD. Keep both for traceability. PRD supersedes brief on all specifics. |
| **Matching Algorithm** | _bmad-output/prd.md (algorithm section) vs reference-docs/architecture/data-flow.md (matching flow) vs _bmad-output/backend-scan-findings.md (implementation details) | Each covers a different aspect. PRD has the spec, data-flow has the journey, scan has the implementation. All useful. |
| **Scraping** | docs/scraping_guide.md vs docs/scraping_notes.md | Guide is the how-to, notes is the research. Keep both, guide references notes. |
| **Avatar** | artifacts/exploration/avatar-*.md (4 files) vs artifacts/design/architecture-cedric-avatar.md | Exploration files show the evolution of thinking. Architecture is the final spec. Keep exploration for context. |

### 4.3 Stale Documents (Should Be Marked or Updated)

| File | Issue |
|------|-------|
| `reference-docs/backend/database-schema.md` | Lists 12 tables; actual schema has 16+ tables plus gamification and badge tables. |
| `reference-docs/backend/api-reference.md` | Uses `/api/auth/login` path; actual implementation uses `/auth/login` (no /api prefix for auth). |
| `reference-docs/frontend/component-library.md` | Describes planned components (SkillCard, SkillBadge); actual components are different (SkillTag, ProgressRing). |
| `reference-docs/frontend/routing-structure.md` | Shows 5 routes; actual implementation has 9+ pages including Store, Quests, SavedRoles, Roadmap, RoleDetail. |
| `reference-docs/frontend/styling-guide.md` | References "Tailwind CSS 3.3" and "shadcn/ui"; actual codebase uses TailwindCSS v4 (4.1.18) and no shadcn/ui. |
| `implementation-tracking/PROJECT-STATUS.md` | Last updated 2026-01-19; does not reflect medieval mode or Cedric implementation. |

---

## 5. Total File Counts

| Source | MD Files | YAML Files | HTML Files | JSON Files | Total |
|--------|----------|------------|------------|------------|-------|
| artifacts/ | 56 | 2 | 0 | 0 | 58 |
| reference-docs/ | 17 | 0 | 0 | 0 | 17 |
| implementation-tracking/ | 60 | 0 | 0 | 0 | 60 |
| _bmad-output/ | 30 | 1 | 13 | 1 | 45 |
| docs/ | 3 | 0 | 0 | 0 | 3 |
| Root | 2 | 2 | 0 | 0 | 4 |
| **Total** | **168** | **5** | **13** | **1** | **187** |
