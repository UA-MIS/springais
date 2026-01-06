# SpringAIS Reference Documentation

**Last Updated:** 2026-01-06
**Purpose:** Comprehensive technical reference for the SpringAIS development team

---

## Overview

This directory contains complete reference documentation for the SpringAIS AI-powered talent mobility platform. All documentation is organized by category for easy navigation.

**Quick Links:**
- **New to the project?** Start with `architecture/system-overview.md`
- **Backend developer?** See `backend/` directory
- **Frontend developer?** See `frontend/` directory
- **Working on integration?** See `integration/` directory

---

## Documentation Structure

```
reference-docs/
├── architecture/          # System architecture and design
├── backend/              # Backend API, database, services
├── frontend/             # React components, state, routing
├── data/                 # Mock data, seeding, synthetic generation
└── integration/          # API contracts, testing strategy
```

---

## Architecture Documentation

### 📄 system-overview.md
**Purpose:** High-level system architecture overview

**Contents:**
- Technology stack (React, FastAPI, PostgreSQL, Redis, OpenAI)
- Data architecture (900 employees, 25 roles, 3 service lines)
- Key design decisions (local-first, vector-only matching, hybrid data)
- Performance targets and cost estimates

**Read this first** if you're new to the project.

---

### 📄 data-flow.md
**Purpose:** How data flows through the system

**Contents:**
- Employee profile creation flow (resume upload → skill extraction → embedding)
- Job matching flow (get employee → vector search → skill gap → ranking)
- Career path visualization flow (BFS graph traversal → Dagre layout)
- Success pattern analysis flow (SQL aggregations → skill frequency)
- Database query patterns and caching strategies

**Use this** to understand how user actions translate to system operations.

---

### 📄 block-dependencies.md
**Purpose:** Development workflow and parallelization

**Contents:**
- Visual dependency graph for all 18 blocks
- Parallelization strategy (4 developers, 5-6 weeks)
- Critical path analysis
- Mock data strategy for independent development
- Risk mitigation for dependency bottlenecks

**Use this** for sprint planning and task assignment.

---

## Backend Documentation

### 📄 backend/api-reference.md
**Purpose:** Complete API endpoint documentation

**Contents:**
- All REST API endpoints with request/response examples
- Authentication endpoints (login, logout, token refresh)
- Employee endpoints (profile, skills)
- Skill extraction endpoints (resume upload, status check)
- Matching endpoints (get matches, detailed gap analysis)
- Career path endpoints (graph generation)
- Success pattern endpoints (metrics, timeline)
- Error response formats and status codes

**Use this** when integrating frontend with backend.

---

### 📄 backend/database-schema.md
**Purpose:** PostgreSQL database schema reference

**Contents:**
- All 12 database tables with column definitions
- Relationships and foreign keys
- Indexes (including pgvector HNSW indexes)
- Sample data for each table
- Vector similarity query patterns
- Materialized views (future enhancement)
- Alembic migration patterns
- Data volume estimates

**Use this** when writing database queries or migrations.

---

### 📄 backend/llm-integration.md
**Purpose:** OpenAI API integration patterns

**Contents:**
- GPT-5.2 Instant skill extraction (prompts, API calls, response parsing)
- text-embedding-3-large vector generation
- Error handling and retry logic
- Caching strategies (Redis cache for skill extraction)
- Rate limiting patterns
- Cost optimization ($8 total for MVP)
- Testing strategies (mock vs real API)

**Use this** when working with OpenAI APIs.

---

### 📄 backend/service-patterns.md
**Purpose:** Backend service layer architecture

**Contents:**
- Layered architecture (API → Service → Data layers)
- Service class structure (MatchingService example)
- Database session management (FastAPI dependency injection)
- Caching patterns (Redis decorators, cache invalidation)
- Error handling patterns (custom exceptions, middleware)
- Logging patterns (structured JSON logging)
- Testing patterns (unit tests, integration tests, mocking)

**Use this** when implementing new backend features.

---

## Frontend Documentation

### 📄 frontend/component-library.md
**Purpose:** Reusable React component reference

**Contents:**
- Layout components (MainLayout, Header, Sidebar)
- Auth components (LoginPage, ProtectedRoute, LogoutButton)
- Skill components (SkillCard, SkillBadge, ResumeUpload)
- Match components (MatchCard, SkillGapDisplay, MatchFilters)
- Career viz components (CareerGraph, CareerNode, CareerEdge)
- Common components (LoadingSpinner, ErrorMessage, Button, Card)
- TypeScript patterns for props and generics

**Use this** when building new UI features.

---

### 📄 frontend/state-management.md
**Purpose:** React Query + Context API patterns

**Contents:**
- React Query setup and configuration
- Fetching data (useQuery examples)
- Mutations (useMutation for POST/PUT/DELETE)
- Prefetching strategies
- Auth context implementation
- Custom hooks patterns (combining Query + Context)
- Cache invalidation strategies
- Optimistic updates
- Loading states and Suspense

**Use this** when managing client or server state.

---

### 📄 frontend/routing-structure.md
**Purpose:** React Router configuration

**Contents:**
- Complete route tree (public vs protected routes)
- App.tsx configuration with nested routes
- ProtectedRoute component implementation
- Navigation helpers (useNavigate, Link, NavLink)
- Query parameters handling

**Use this** when adding new routes or navigation.

---

### 📄 frontend/styling-guide.md
**Purpose:** Tailwind CSS and design system

**Contents:**
- EY color palette (yellow, black, grays)
- Typography system (headings, body text)
- Spacing system (Tailwind scale)
- Layout patterns (cards, grids, flexbox)
- Component styling (buttons, inputs, badges)
- Responsive design patterns
- shadcn/ui component usage
- Custom utility functions (cn helper)

**Use this** when styling components.

---

## Data Documentation

### 📄 data/mock-data-formats.md
**Purpose:** Standard mock data for frontend development

**Contents:**
- TypeScript interfaces for all data types
- Employee, skills, job match, career path, success pattern formats
- Auth response formats
- Mock service implementations
- Switching between mock and real API

**Use this** when developing frontend before backend is ready.

---

### 📄 data/seed-scripts.md
**Purpose:** Database seeding for development

**Contents:**
- Quick start commands
- seed_roles.py (25 roles across service lines)
- generate_synthetic_employees.py (900 employees)
- scrape_job_postings.py (30-50 jobs)
- generate_embeddings.py (vector generation)
- Team data sharing via Git (pg_dump → data-dumps branch)
- Minimal seed for quick testing

**Use this** when setting up local development environment.

---

### 📄 data/synthetic-data-generation.md
**Purpose:** Hybrid synthetic data strategy

**Contents:**
- Hard-coded templates vs LLM generation
- Role distribution and skill templates
- LLM-enhanced realism (performance variation, feedback themes)
- Career transition simulation
- Data quality validation
- Cost comparison ($2 hybrid vs $60-80 full LLM)

**Use this** to understand data generation approach.

---

## Integration Documentation

### 📄 integration/api-contracts.md
**Purpose:** Frontend-backend API contracts

**Contents:**
- Authentication contract (POST /api/auth/login)
- Skills dashboard contract (GET /api/employees/{id}, POST /api/skill-extraction)
- Match results contract (GET /api/matches/employee/{id})
- Career path contract (GET /api/career-paths/employee/{id})
- Success patterns contract (GET /api/success-patterns)
- Standard error response format
- Contract testing examples (frontend + backend)
- API versioning strategy

**Use this** when integrating frontend and backend (Blocks M, N, O, P).

---

### 📄 integration/testing-strategy.md
**Purpose:** Complete testing approach

**Contents:**
- Testing pyramid (60% unit, 30% integration, 10% E2E)
- Backend unit tests (pytest examples)
- Frontend unit tests (Vitest examples)
- Integration tests (FastAPI TestClient, React Testing Library)
- E2E tests (Playwright full user journeys)
- Performance testing (Locust load tests)
- Security testing (OWASP ZAP scan)
- Lighthouse audit (frontend performance)
- CI/CD pipeline (GitHub Actions)
- Test coverage targets

**Use this** for Block Q (E2E Testing & Polish) and ongoing testing.

---

## How to Use This Documentation

### For New Developers

1. **Start here:** `architecture/system-overview.md`
2. **Understand data flow:** `architecture/data-flow.md`
3. **Set up local environment:**
   - Run `docker-compose up -d`
   - Seed database: `python scripts/seed_database.py`
   - See `data/seed-scripts.md` for details
4. **Pick a task:** See `implementation-tracking/PROJECT-STATUS.md` for available blocks
5. **Read block documentation:**
   - `implementation-tracking/STEP-*-*/BLOCK-*/CONTEXT.md` for overview
   - `implementation-tracking/STEP-*-*/BLOCK-*/TASKS.md` for step-by-step tasks
   - `implementation-tracking/STEP-*-*/BLOCK-*/VERIFICATION.md` for testing
6. **Refer to this reference docs** for detailed patterns and examples

---

### For Backend Developers

**Common Tasks:**

| Task | Reference Docs |
|------|---------------|
| Add new API endpoint | `backend/api-reference.md`, `backend/service-patterns.md` |
| Write database query | `backend/database-schema.md` |
| Integrate OpenAI API | `backend/llm-integration.md` |
| Implement caching | `backend/service-patterns.md` (caching section) |
| Write tests | `integration/testing-strategy.md` |

---

### For Frontend Developers

**Common Tasks:**

| Task | Reference Docs |
|------|---------------|
| Build new component | `frontend/component-library.md` |
| Fetch API data | `frontend/state-management.md` |
| Add new route | `frontend/routing-structure.md` |
| Style component | `frontend/styling-guide.md` |
| Use mock data | `data/mock-data-formats.md` |
| Integrate with backend | `integration/api-contracts.md` |

---

### For Integration Work (Step 3)

1. **Read API contract first:** `integration/api-contracts.md`
2. **Review data flow:** `architecture/data-flow.md`
3. **Implement backend endpoint:** Use `backend/api-reference.md` as template
4. **Connect frontend:** Use `frontend/state-management.md` for React Query
5. **Test integration:** Follow `integration/testing-strategy.md`
6. **Verify:** Use block-specific `VERIFICATION.md` checklist

---

## Cross-References

Each block's CONTEXT.md file now includes "Reference Docs" section pointing to relevant documentation here. Example:

```markdown
## References

**Reference Docs:**
- `reference-docs/backend/llm-integration.md` - OpenAI integration patterns
- `reference-docs/backend/api-reference.md` - API endpoint documentation
- `reference-docs/architecture/data-flow.md` - Data flow diagrams
```

This creates a bidirectional link between implementation tracking and reference docs.

---

## Document Conventions

### File Naming
- All lowercase with hyphens: `api-reference.md`, `state-management.md`
- No spaces, no underscores
- Descriptive but concise

### Section Structure
All reference docs follow this structure:
1. **Header** with title, date, purpose
2. **Overview** - What this document covers
3. **Detailed Content** - The actual reference material
4. **Related Documentation** - Links to other docs
5. **Implemented In** - Which blocks use this

### Code Examples
- Always include **complete, runnable examples**
- Use proper syntax highlighting (```python, ```typescript)
- Include comments explaining key parts
- Show both basic and advanced patterns

### Diagrams
- Use ASCII art for simple diagrams
- Keep diagrams concise and readable in monospace font
- Include both visual and text explanations

---

## Maintenance

**Last Updated:** 2026-01-06

**Update Frequency:**
- **During development:** Update as new patterns emerge
- **After each block:** Validate examples still work
- **Before major demos:** Review all docs for accuracy

**Who Updates:**
- **Architecture docs:** Technical lead
- **Backend docs:** Backend developers (as patterns evolve)
- **Frontend docs:** Frontend developers (as patterns evolve)
- **Integration docs:** Full-stack developers working on Step 3

---

## Quick Reference Card

### Most Used Documents (by Phase)

**Phase 1: Setup**
- `architecture/system-overview.md`
- `data/seed-scripts.md`

**Phase 2: Development (Blocks A-L)**
- `backend/service-patterns.md`
- `backend/database-schema.md`
- `backend/llm-integration.md`
- `frontend/component-library.md`
- `frontend/state-management.md`
- `data/mock-data-formats.md`

**Phase 3: Integration (Blocks M-Q)**
- `integration/api-contracts.md`
- `backend/api-reference.md`
- `architecture/data-flow.md`
- `integration/testing-strategy.md`

---

## Related Documentation

**Implementation Tracking:**
- `implementation-tracking/PROJECT-STATUS.md` - Overall progress
- `implementation-tracking/STEP-*-*/BLOCK-*/` - Block-specific implementation docs

**Product Documentation:**
- `_bmad-output/prd.md` - Product requirements
- `_bmad-output/architecture-updates-2026.md` - Architecture decisions
- `_bmad-output/tech-stack.md` - Technical specification

---

## Feedback & Improvements

Found an error or have a suggestion?
- Update the doc directly (all devs have write access)
- Add a comment in the doc with `<!-- TODO: ... -->`
- Discuss in team meetings

**Goal:** Keep this reference docs as the **single source of truth** for technical patterns.

---

**Welcome to SpringAIS! Happy coding! 🚀**
