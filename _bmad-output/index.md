# SpringAIS Documentation Index

**Project**: SpringAIS -- AI-powered matching and upskilling platform
**Type**: Full-stack web application
**Language**: TypeScript (frontend) / Python (backend)
**Framework**: React 18 + FastAPI
**Database**: PostgreSQL 16 (pgvector) + Redis 7
**Generated**: 2026-02-11

---

## Quick Reference

| Aspect | Frontend | Backend |
|--------|----------|---------|
| **Language** | TypeScript / JSX | Python 3.11 |
| **Framework** | React 18.2 + Vite 5 | FastAPI + Uvicorn |
| **Port** | 3000 | 8000 |
| **Source files** | ~117 | ~90 |
| **Components / Routes** | 76 components, 16 routes | 68+ endpoints, 7 route files |
| **State management** | 9 React Context providers | 20 service files |
| **Database** | N/A (via API) | SQLAlchemy 2.0, 16 tables, 26 migrations |
| **AI/ML** | N/A (via API) | OpenAI GPT-5.2, text-embedding-3-large, PCA |
| **Testing** | Vitest + React Testing Library | pytest + pytest-asyncio |
| **Container** | node:18-alpine | python:3.11-slim |

---

## Getting Started

1. **Clone and configure**: Copy `.env.example` to `.env` and set `OPENAI_API_KEY`, `JWT_SECRET_KEY`
2. **Start services**: `docker compose up -d`
3. **Verify**: Frontend at http://localhost:3000, API docs at http://localhost:8000/docs
4. **Seed data**: See [Deployment Guide](deployment-guide.md) for database seeding instructions

For detailed setup, see:
- [Frontend Development Guide](development-guide-frontend.md)
- [Backend Development Guide](development-guide-backend.md)
- [Deployment Guide](deployment-guide.md)

---

## Generated Documentation Suite

### Overview and Architecture

| Document | Description | Lines |
|----------|-------------|-------|
| [Project Overview](project-overview.md) | Executive summary, tech stack, architecture type, repository structure, feature areas | 156 |
| [Source Tree Analysis](source-tree-analysis.md) | Annotated directory tree with purpose descriptions for every critical file and directory | 352 |
| [Integration Architecture](integration-architecture.md) | Frontend-backend communication, data flows, caching, CORS, shared dependencies | 412 |

### Frontend Documentation

| Document | Description | Lines |
|----------|-------------|-------|
| [Frontend Architecture](architecture-frontend.md) | Component hierarchy, routing, state management, API client layer, theme system | 345 |
| [Component Inventory](component-inventory-frontend.md) | Complete React component catalog (85 components across 11 categories) with props and descriptions | 218 |
| [Frontend Development Guide](development-guide-frontend.md) | Prerequisites, setup, environment, commands, project structure, patterns, testing | 302 |

### Backend Documentation

| Document | Description | Lines |
|----------|-------------|-------|
| [Backend Architecture](architecture-backend.md) | Layered architecture, API layer, services, AI/ML pipeline, data layer, caching, security | 315 |
| [API Contracts](api-contracts-backend.md) | All 68+ REST API endpoints with methods, paths, request/response schemas, auth requirements | 952 |
| [Data Models](data-models-backend.md) | Full database schema (16 tables), column types, relationships, pgvector columns, migration history | 468 |
| [Backend Development Guide](development-guide-backend.md) | Prerequisites, setup, environment, commands, architecture patterns, database operations, testing | 415 |

### Infrastructure

| Document | Description | Lines |
|----------|-------------|-------|
| [Deployment Guide](deployment-guide.md) | Docker Compose setup, service details, environment variables, health checks, resource allocation | 390 |

### Scan Findings (Raw Data)

| Document | Description | Lines |
|----------|-------------|-------|
| [Backend Scan Findings](backend-scan-findings.md) | Exhaustive scan of backend codebase: tech stack, models, routes, services, utils, tests | 908 |
| [Frontend Scan Findings](frontend-scan-findings.md) | Exhaustive scan of frontend codebase: components, routes, contexts, services, styling | 473 |
| [Integration Scan Findings](integration-scan-findings.md) | Integration analysis: API mapping, Docker Compose, data flows, caching, AI/ML pipeline | 757 |

---

## Pre-Existing Documentation

These documents existed before the scan and provide additional project context:

| Document | Description |
|----------|-------------|
| [README.md](../README.md) | Project README |
| [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) | Implementation plan |
| [PRD](prd.md) | Product Requirements Document |
| [Tech Stack](tech-stack.md) | Original tech stack decisions |
| [UX Design Specification](ux-design-specification.md) | UX design specification |
| [Database Setup Guide](database-setup-guide.md) | Original database setup guide |
| [Data Generation Plan](data-generation-plan.md) | Data generation plan |
| [Architecture Updates 2026](architecture-updates-2026.md) | Architecture evolution notes |
| [Consulting Meeting Notes](consulting-meeting-valent-partner-review.md) | Consulting partner review notes |

### Research and Analysis (Pre-Existing)

| Document | Location |
|----------|----------|
| Brainstorming Session | `_bmad-output/analysis/brainstorming-session-2025-12-18.md` |
| Product Brief | `_bmad-output/analysis/product-brief-SpringAIS-2025-12-18.md` |
| PRD Comparison Analysis | `_bmad-output/analysis/research-prd-comparison-analysis.md` |
| Domain Research: AI Talent Mobility | `_bmad-output/analysis/research/domain-ai-talent-mobility-platform-research-2025-12-18.md` |
| Domain Research: EY Career Patterns | `_bmad-output/analysis/research/domain-ey-career-progression-success-patterns-research-2025-12-20.md` |
| Domain Research: EY Performance | `_bmad-output/analysis/research/domain-ey-performance-systems-promotion-evaluation-research-2025-12-18.md` |
| Market Research | `_bmad-output/analysis/research/market-ai-talent-mobility-platform-research-2025-12-18.md` |
| Technical Research | `_bmad-output/analysis/research/technical-ai-talent-platform-technical-stack-research-2025-12-18.md` |

---

## AI-Assisted Development Guidance

### Understanding the Codebase

For AI agents or developers exploring the codebase:

1. **Start with** [Project Overview](project-overview.md) for high-level understanding
2. **Explore the structure** via [Source Tree Analysis](source-tree-analysis.md)
3. **Understand data flow** through [Integration Architecture](integration-architecture.md)

### For Frontend Work

1. Read [Frontend Architecture](architecture-frontend.md) for component hierarchy and state management
2. Check [Component Inventory](component-inventory-frontend.md) to find existing components before creating new ones
3. Follow [Frontend Development Guide](development-guide-frontend.md) for setup and patterns
4. Note: Skills components use JSX (not TSX) with inline styles -- match existing patterns

### For Backend Work

1. Read [Backend Architecture](architecture-backend.md) for layered architecture and service patterns
2. Check [API Contracts](api-contracts-backend.md) for existing endpoints before adding new ones
3. Review [Data Models](data-models-backend.md) for database schema and relationships
4. Follow [Backend Development Guide](development-guide-backend.md) for setup and testing

### For Infrastructure Work

1. Read [Deployment Guide](deployment-guide.md) for Docker Compose topology and configuration
2. Review [Integration Architecture](integration-architecture.md) for networking and caching layers

### Key Design Decisions

- **Matching Algorithm**: 80% skill match (4-layer), 10% experience, 10% role fit
- **Embedding Pipeline**: OpenAI 3072 dims -> PCA to 1536 dims -> pgvector HNSW index
- **PII Protection**: Resume text stripped before LLM processing; hiring manager views anonymized
- **Caching**: 5-layer strategy (frontend memory, React Query, Redis match/embedding/pattern caches)
- **AI Models**: GPT-5.2 for reasoning tasks, GPT-5.2-chat for extraction/chat, GPT-5-nano for lightweight tasks

---

## Document Statistics

| Category | Files | Total Lines |
|----------|-------|-------------|
| Generated documentation (11 files) | 11 | 4,325 |
| Scan findings (3 files) | 3 | 2,138 |
| **Total generated this session** | **14** | **6,463** |
