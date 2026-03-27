## Table of Contents

### Part 1: Product and Planning

- **[1. Executive Summary](#1-executive-summary)**
- **[2. Product Vision & Discovery](#2-product-vision--discovery)**
  - [2.1 Brainstorming Session](#21-brainstorming-session)
  - [2.2 Product Brief](#22-product-brief)
  - [2.3 Domain Research: AI Talent Mobility Platforms](#23-domain-research-ai-talent-mobility-platforms)
  - [2.4 Domain Research: EY Career Progression & Success Patterns](#24-domain-research-ey-career-progression--success-patterns)
  - [2.5 Domain Research: EY Performance Systems & Promotion Evaluation](#25-domain-research-ey-performance-systems--promotion-evaluation)
  - [2.6 Market Research: AI Talent Mobility Platforms](#26-market-research-ai-talent-mobility-platforms)
  - [2.7 Technical Stack Research](#27-technical-stack-research)
  - [2.8 Consulting Meeting Brief](#28-consulting-meeting-brief)
  - [2.9 Research-PRD Comparison Analysis](#29-research-prd-comparison-analysis)
- **[3. Product Requirements Documents](#3-product-requirements-documents)**
  - [3.1 Main PRD -- SpringAIS](#31-main-prd----springais)
  - [3.2 Badge Discovery System PRD](#32-badge-discovery-system-prd)
  - [3.3 Medieval Mode Economy & Progression PRD](#33-medieval-mode-economy--progression-prd)
- **[4. UX Design](#4-ux-design)**
  - [4.1 UX Design Specification](#41-ux-design-specification)
  - [4.2 UX Mockup Index](#42-ux-mockup-index)

### Part 2: Architecture and Decisions

- **[7. System Architecture](#7-system-architecture)**
  - [7.1 System Overview](#71-system-overview)
  - [7.2 Data Flow](#72-data-flow)
  - [7.3 Block Dependencies](#73-block-dependencies)
  - [7.4 Backend Architecture](#74-backend-architecture)
  - [7.5 Frontend Architecture](#75-frontend-architecture)
  - [7.6 Integration Architecture](#76-integration-architecture)
  - [7.7 Architecture Updates 2026](#77-architecture-updates-2026)
  - [7.8 Badge System Architecture](#78-badge-system-architecture) *(cross-ref: ADR-001 through ADR-005)*
  - [7.9 Cedric Avatar Architecture](#79-cedric-avatar-architecture)
  - [7.10 Medieval Mode Architecture](#710-medieval-mode-architecture) *(cross-ref: ADR-MM-001 through ADR-MM-007)*
- **[8. Architecture Decision Records (ADRs)](#8-architecture-decision-records-adrs)**
  - [8.1 ADR-001: Curated Catalog Primary](#81-adr-001-curated-catalog-primary)
  - [8.2 ADR-002: Microsoft Learn First](#82-adr-002-microsoft-learn-first)
  - [8.3 ADR-003: Additive Schema Changes](#83-adr-003-additive-schema-changes)
  - [8.4 ADR-004: Async Badge Loading](#84-adr-004-async-badge-loading)
  - [8.5 ADR-005: Interaction Tracking](#85-adr-005-interaction-tracking)
  - [8.6 ADR-MM-001: Alembic Migrations](#86-adr-mm-001-alembic-migrations)
  - [8.7 ADR-MM-002: Redis Progression Cache](#87-adr-mm-002-redis-progression-cache)
  - [8.8 ADR-MM-003: Sync Achievement Evaluation](#88-adr-mm-003-sync-achievement-evaluation)
  - [8.9 ADR-MM-004: Coin Balance Locking](#89-adr-mm-004-coin-balance-locking)
  - [8.10 ADR-MM-005: Linear XP Curve](#810-adr-mm-005-linear-xp-curve)
  - [8.11 ADR-MM-006: No LocalStorage Migration](#811-adr-mm-006-no-localstorage-migration)
  - [8.12 ADR-MM-007: Cosmetic Equipment Rendering](#812-adr-mm-007-cosmetic-equipment-rendering)
- **[9. Technology Stack](#9-technology-stack)**
  - [9.1 Technology Stack Document](#91-technology-stack-document)
  - [9.2 Docker Compose Configuration](#92-docker-compose-configuration)
- **[10. Security Review](#10-security-review)**
  - [10.1 Architecture Security Review](#101-architecture-security-review)

### Part 3: Implementation Details

- **[11. Backend Technical Reference](#section-11-backend-technical-reference)**
  - [11.1 API Reference (Design)](#111-api-reference-design)
  - [11.2 Database Schema (Design)](#112-database-schema-design)
  - [11.3 LLM Integration Guide](#113-llm-integration-guide)
  - [11.4 Service Patterns](#114-service-patterns)
  - [11.5 API Contracts (Implemented)](#115-api-contracts-implemented)
  - [11.6 Data Models (Implemented)](#116-data-models-implemented)
  - [11.7 Backend Scan Findings](#117-backend-scan-findings)
  - [11.8 Backend Development Guide](#118-backend-development-guide)
- **[12. Frontend Technical Reference](#section-12-frontend-technical-reference)**
  - [12.1 Component Library (Design)](#121-component-library-design)
  - [12.2 Routing Structure](#122-routing-structure)
  - [12.3 State Management](#123-state-management)
  - [12.4 Styling Guide](#124-styling-guide)
  - [12.5 Component Inventory (Implemented)](#125-component-inventory-implemented)
  - [12.6 Frontend Development Guide](#126-frontend-development-guide)
  - [12.7 Frontend Scan Findings](#127-frontend-scan-findings)
- **[13. Data and Integration](#section-13-data-and-integration)**
  - [13.1 API Contracts (Frontend-Backend)](#131-api-contracts-frontend-backend)
  - [13.2 Testing Strategy](#132-testing-strategy)
  - [13.3 Integration Patterns](#133-integration-patterns)
  - [13.4 Scraping Guide](#134-scraping-guide)
  - [13.5 Scraping Notes](#135-scraping-notes)
  - [13.6 Mock Data Formats](#136-mock-data-formats)
  - [13.7 Seed Scripts](#137-seed-scripts)
  - [13.8 Synthetic Data Generation](#138-synthetic-data-generation)
  - [13.9 Data Generation Plan](#139-data-generation-plan)
  - [13.10 Integration Scan Findings](#1310-integration-scan-findings)
- **[14. Database and Deployment](#section-14-database-and-deployment)**
  - [14.1 Database Setup Guide](#141-database-setup-guide)
  - [14.2 Deployment Guide](#142-deployment-guide)

### Part 4: Epics, Stories, and Project History

- **[15. Epics & Stories -- Medieval Mode](#15-epics--stories----medieval-mode-gamification)**
  - [15.1 Epic 1: Server-Side Progression Foundation](#151-epic-1-server-side-progression-foundation)
  - [15.2 Epic 2: XP System & Leveling Engine](#152-epic-2-xp-system--leveling-engine)
  - [15.3 Epic 3: Coin Economy System](#153-epic-3-coin-economy-system)
  - [15.4 Epic 4: Achievement System](#154-epic-4-achievement-system)
  - [15.5 Epic 5: Event/Action Reward Hook System](#155-epic-5-eventaction-reward-hook-system)
  - [15.6 Epic 6: Cosmetic Store](#156-epic-6-cosmetic-store)
  - [15.7 Epic 7: Side Quest System](#157-epic-7-side-quest-system)
  - [15.8 Epic 8: Frontend UI Overhaul](#158-epic-8-frontend-ui-overhaul)
  - [15.9 Epic 9: Integration & Polish](#159-epic-9-integration--polish)
  - [15.10 Medieval Mode Sprint Status](#1510-medieval-mode-sprint-status)
- **[16. Epics & Stories -- Cedric Avatar](#16-epics--stories----cedric-avatar-companion-system)**
  - [16.1 Cedric Epic 1: Avatar Component Foundation](#161-cedric-epic-1-avatar-component-foundation)
  - [16.2 Cedric Epic 2: Onboarding Walkthrough Quest](#162-cedric-epic-2-onboarding-walkthrough-quest)
  - [16.3 Cedric Epic 3: Speech Bubble System](#163-cedric-epic-3-speech-bubble-system)
  - [16.4 Cedric Epic 4: Idle Animations & Reactions](#164-cedric-epic-4-idle-animations--reactions)
  - [16.5 Cedric Epic 5: Roadmap Assistant / Loading Narrator](#165-cedric-epic-5-roadmap-assistant--loading-narrator)
  - [16.6 Cedric Epic 6: Contextual Guidance System](#166-cedric-epic-6-contextual-guidance-system)
  - [16.7 Cedric Epic 7: Store Live Preview & Interactions](#167-cedric-epic-7-store-live-preview--interactions)
  - [16.8 Cedric Epic 8: Non-Adventure Mode Variant & Polish](#168-cedric-epic-8-non-adventure-mode-variant--polish)
  - [16.9 Cedric Avatar Sprint Status](#169-cedric-avatar-sprint-status)
- **[17. Implementation Tracking History (Pre-BMAD)](#17-implementation-tracking-history-pre-bmad)**
  - [17.1 Project Status Overview](#171-project-status-overview)
  - [17.2 STEP 1: Setup](#172-step-1-setup)
  - [17.3 STEP 2: Development (Blocks A-L)](#173-step-2-development)
  - [17.4 STEP 3: Integration (Blocks M-R)](#174-step-3-integration)
- **[18. Exploration & Research](#18-exploration--research)**
  - [18.1 Avatar Concept](#181-avatar-concept)
  - [18.2 Avatar Research](#182-avatar-research)
  - [18.3 Avatar Guide Concept](#183-avatar-guide-concept)
  - [18.4 Avatar Guide Research](#184-avatar-guide-research)
  - [18.5 Badge Discovery Research](#185-badge-discovery-research)
  - [18.6 Current Badge Analysis](#186-current-badge-analysis)
  - [18.7 Codebase Analysis](#187-codebase-analysis)
- **[19. Code Reviews](#19-code-reviews)**
  - [19.1-19.8 Code Reviews: Epics 1-8](#191-code-review-epic-1)
  - [19.9 Code Review: Cedric Avatar](#199-code-review-cedric-avatar)
  - [19.10 Code Review: Cedric Fixes](#1910-code-review-cedric-fixes)
- **[20. QA & Delivery](#20-qa--delivery)**
  - [20.1 QA Test Results](#201-qa-test-results)
  - [20.2 Delivery Summary](#202-delivery-summary)
  - [20.3 Delivery Summary: Cedric Avatar](#203-delivery-summary-cedric-avatar)
- **[21. Source Tree & Project Analysis](#21-source-tree--project-analysis)**
  - [21.1 Source Tree Analysis](#211-source-tree-analysis)
  - [21.2 Project Scan Report](#212-project-scan-report)

### Supplementary

- **[22. Undocumented Features & Patterns](#22-undocumented-features--patterns)** *(from codebase analysis)*
- **[Appendix A: Document Index](#appendix-a-document-index)** *(source file to section mapping)*

---

