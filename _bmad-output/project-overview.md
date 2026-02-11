# SpringAIS - Project Overview

**Generated**: 2026-02-11

---

## Executive Summary

SpringAIS is an AI-powered matching and upskilling platform that connects professionals with job opportunities and generates personalized career development roadmaps. The system ingests job postings (scraped from EY Careers), extracts skills using large language models, generates vector embeddings for semantic matching, and pairs candidates with roles using a multi-layer matching algorithm (taxonomy, exact, semantic, fuzzy). Users can track skill development through AI-generated learning modules, visualize career paths as interactive graphs, and receive roadmaps tailored to their target roles. A hiring manager portal provides anonymized candidate interest data without exposing PII.

The platform is built as a full-stack web application with a React SPA frontend and a FastAPI Python backend, backed by PostgreSQL with pgvector for vector similarity search and Redis for multi-layer caching. AI capabilities are powered by multiple OpenAI models selected by task complexity.

---

## Technology Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend Framework** | React | 18.2.0 |
| **Frontend Language** | TypeScript / JSX | ~5.x |
| **Build Tool** | Vite | 5.0.8 |
| **CSS Framework** | TailwindCSS | v4 (4.1.18) |
| **Router** | React Router DOM | 6.30.2 |
| **Server State** | TanStack React Query | 5.90.16 |
| **HTTP Client** | Axios | 1.13.2 |
| **Backend Framework** | FastAPI | >=0.109.0 |
| **Backend Language** | Python | 3.11 |
| **ASGI Server** | Uvicorn | >=0.27.0 |
| **ORM** | SQLAlchemy | 2.0 |
| **Database** | PostgreSQL + pgvector | 16 |
| **Cache** | Redis | 7-alpine |
| **AI/ML** | OpenAI API (GPT-5.2, text-embedding-3-large) | Latest |
| **Dimensionality Reduction** | scikit-learn PCA | >=1.4.0 |
| **Graph Visualization** | ReactFlow | 11.11.4 |
| **Charts** | Recharts | 3.6.0 |
| **Animation** | Framer Motion | 11.18.2 |
| **Containerization** | Docker Compose | Multi-service |

---

## Architecture Type

**Monolithic frontend + monolithic backend** with containerized infrastructure.

- **Frontend**: Single-page application (SPA) built with React, served by Vite dev server (port 3000) or nginx (production)
- **Backend**: Monolithic FastAPI application with layered architecture (routes -> services -> models), served by Uvicorn (port 8000)
- **Communication**: HTTP REST API exclusively (no WebSocket, SSE, or GraphQL)
- **Database**: Single PostgreSQL instance with pgvector extension for vector similarity search
- **Cache**: Single Redis instance with multiple cache layers (match results, embeddings, patterns, job skills)
- **AI Pipeline**: OpenAI API calls from backend services with multi-tier caching

---

## Repository Structure

```
SpringAIS/
|
|-- frontend/                      # React SPA (TypeScript/JSX)
|   |-- src/
|   |   |-- components/            # UI components (76 files across 10 directories)
|   |   |   |-- auth/              # Login, Register, ForgotPassword, Logout (4 files)
|   |   |   |-- common/            # ProgressRing, SkillTag (2 files)
|   |   |   |-- career-viz/        # Career graph visualization (10 files)
|   |   |   |-- game/              # Gamification/adventure mode (8 files)
|   |   |   |-- layout/            # MainLayout, HMLayout, Sidebar, Header (8 files)
|   |   |   |-- matches/           # Match cards, filters, virtual list (9 files)
|   |   |   |-- roadmap/           # Roadmap viewer, milestones, chat (11 files)
|   |   |   |-- role-detail/       # Role overview, skill gap, patterns (5 files)
|   |   |   |-- skills/            # Skills dashboard, categories, modules (11 files)
|   |   |   |-- successPatterns/   # Charts, metrics, filters (8 files)
|   |   |-- context/               # React context providers (9 files)
|   |   |-- services/              # API service layer (9 files)
|   |   |-- hooks/                 # Custom React hooks (2 files)
|   |   |-- lib/                   # Axios API client (1 file)
|   |   |-- pages/                 # Page components (9 files)
|   |   |-- data/                  # Static data (achievements, game themes)
|   |   |-- mocks/                 # Mock data (skill categories)
|   |   |-- App.tsx                # Root component with provider hierarchy
|   |   |-- main.tsx               # React entry point
|   |   |-- index.css              # TailwindCSS v4 entry
|   |-- index.html                 # HTML shell
|   |-- vite.config.ts             # Vite configuration
|   |-- tsconfig.json              # TypeScript configuration
|   |-- tailwind.config.js         # TailwindCSS v4 configuration
|   |-- Dockerfile                 # Node 18-alpine container
|   |-- package.json               # ~117 frontend source files total
|
|-- backend/                       # FastAPI backend (Python 3.11)
|   |-- app/
|   |   |-- main.py                # FastAPI application entry point
|   |   |-- config.py              # OpenAI/Redis client factories
|   |   |-- database.py            # SQLAlchemy engine and session
|   |   |-- config/                # Matching configuration (1 file)
|   |   |-- models/                # SQLAlchemy ORM models (15 files, 16 tables)
|   |   |-- routes/                # API route handlers (7 files)
|   |   |-- schemas/               # Pydantic request/response schemas (9 files)
|   |   |-- services/              # Business logic services (20 files)
|   |   |-- utils/                 # Security, PCA, text processing (6 files)
|   |-- tests/                     # pytest test suite (12 files)
|   |-- alembic/                   # Database migrations (26 versions)
|   |-- requirements.txt           # Python dependencies (~30 packages)
|   |-- Dockerfile                 # Python 3.11-slim container
|   |-- alembic.ini                # Migration configuration
|
|-- scripts/                       # Data pipeline scripts (13 files)
|   |-- scrape_ey_jobs.py          # EY careers web scraper
|   |-- extract_all_job_skills.py  # Batch LLM skill extraction
|   |-- generate_all_embeddings.py # Batch embedding generation
|   |-- train_pca_model.py         # PCA model training (3072->1536 dims)
|   |-- generate_synthetic_data.py # Synthetic employee generation
|   |-- ...
|
|-- data/                          # Seed data and synthetic datasets
|-- docker/                        # Docker initialization scripts
|   |-- postgres-init/             # PostgreSQL init (pgvector, indexes)
|-- docker-compose.yml             # Multi-service orchestration
|-- .env                           # Environment variables (not in git)
|-- package.json                   # Root package (Playwright E2E)
```

---

## Core Feature Areas

1. **Job Matching**: Multi-layer algorithm (80% skill match, 10% experience, 10% role fit) using taxonomy, exact, pgvector semantic search, and fuzzy Jaccard matching
2. **Resume Processing**: PDF/DOCX/TXT upload with PII stripping and LLM-powered skill extraction (listed + inferred)
3. **Skill Portfolio**: Tracked skills with proficiency levels (0-5), learning modules, proof of completion, and AI-generated learning content
4. **Career Visualization**: Interactive career path graph (ReactFlow) with role nodes, transition edges, success rates, and goal path highlighting
5. **Roadmap Generation**: GPT-5.2 powered personalized career roadmaps with phases, milestones, AI chat assistant, and AI-assisted editing
6. **Success Patterns**: Career transition analytics with success rates, time-to-promotion, skill frequency charts, and department distribution
7. **Hiring Manager Portal**: Anonymized candidate interest data for saved job postings (no PII exposure)
8. **Gamification**: Adventure mode with XP, gold, achievements, login streaks, mini-games, and medieval fantasy theme

---

## AI Model Usage

| Model | Purpose | Use Cases |
|-------|---------|-----------|
| `gpt-5.2` (reasoning) | Deep analysis and generation | Match deep analysis, roadmap generation |
| `gpt-5.2-chat-latest` | Extraction and conversation | Skill extraction, grouping, learning content, chat |
| `gpt-5-nano` | Lightweight tasks | Recommendation bootstrapping |
| `text-embedding-3-large` | Vector embeddings | Skill, job, and resume embeddings (3072 dims, PCA to 1536) |

---

## Infrastructure Summary

| Service | Image | Port (Host) | Resources (Limit) |
|---------|-------|-------------|-------------------|
| Frontend | node:18-alpine | 3000 | 1.0 CPU / 512M |
| Backend | python:3.11-slim | 8000 | 2.0 CPU / 1G |
| PostgreSQL | pgvector/pgvector:pg16 | 5432 | 1.0 CPU / 512M |
| Redis | redis:7-alpine | 6380 | 0.5 CPU / 256M |
| EY Scraper | python:3.11-slim | N/A (on-demand) | 1.0 CPU / 512M |
