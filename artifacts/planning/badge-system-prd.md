# Badge Discovery & Integration System -- Product Requirements Document

> **Status**: DRAFT -- Awaiting Human Approval
> **Author**: Strategist Agent
> **Date**: 2026-02-11
> **Version**: 1.0
> **Upstream Artifacts**:
>   - `artifacts/exploration/badge-discovery-research.md`
>   - `artifacts/exploration/current-badge-analysis.md`

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Goals](#2-goals)
3. [User Personas](#3-user-personas)
4. [Glossary](#4-glossary)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Success Metrics](#7-success-metrics)
8. [Phased Delivery Plan](#8-phased-delivery-plan)
9. [Out of Scope](#9-out-of-scope)
10. [Risks & Mitigations](#10-risks--mitigations)
11. [Decision Log](#11-decision-log)

---

## 1. Problem Statement

SpringAIS helps EY employees develop skills through personalized learning modules and career roadmaps. The platform currently references badges and certifications, but the implementation is **generic and unreliable**:

- **Generic links**: EY resource URLs always point to `https://www.credly.com/organizations/ey/badges` -- the top-level org page -- regardless of the user's skill or learning context. Users must manually search for relevant badges after clicking through.
- **AI hallucination**: The AI prompt asks GPT to suggest "relevant EY resources," but there is no validation against real badge catalogs. The AI frequently invents badge names and URLs that do not exist.
- **Dead display code**: A certifications display section exists in `SkillDetailModal.jsx` but only works with mock data. The production API never populates the `certifications` field.
- **Plain-text roadmap resources**: Roadmap certification milestones list resources as unstructured strings (e.g., "Coursera: AWS Solutions Architect course"). These are not clickable and carry no metadata.
- **No tracking**: There is no way to measure whether badge/certification suggestions are useful. No click tracking, no completion tracking, no user feedback mechanism.

The net effect: users see badge references that look helpful but lead to generic pages, eroding trust in the platform's recommendations.

---

## 2. Goals

| ID | Goal | Description |
|----|------|-------------|
| **D-G1** | Specific, relevant badge suggestions per skill | Each skill module surfaces real badges/certifications matched to that specific skill, with direct links to the badge or certification page -- not a generic provider homepage. |
| **D-G2** | Roadmap milestones linked to real certification programs | Certification milestones in career roadmaps include structured data: cert name, provider, direct URL, estimated cost, and difficulty level. Users can click through to enroll. |
| **D-G3** | Prove badge suggestions are useful | The system tracks badge link click-through rates, user-reported cert completions, and user relevance ratings. This data demonstrates ROI and informs future improvements. |
| **D-G4** | Badge suggestions improve over time | A feedback loop exists: user interactions (clicks, ratings, completions) and periodic catalog refreshes keep badge suggestions accurate and current. |

---

## 3. User Personas

### 3.1 Early-Career Analyst (Priya)

- **Role**: EY Technology Consulting Analyst, 1-2 years experience
- **Context**: Building foundational cloud and data skills. Overwhelmed by the number of certifications available. Needs guidance on which certs are worth pursuing first.
- **Needs**: Clear "start here" certification recommendations for beginner-level skills. Direct links so she doesn't waste time searching. Cost and time-to-earn info to plan around her schedule.

### 3.2 Mid-Career Manager (David)

- **Role**: EY Advisory Manager, 6-8 years experience
- **Context**: Transitioning from generalist to cloud architecture specialization. Has some certifications already. Roadmap includes certification milestones.
- **Needs**: Advanced-level certification recommendations that match his roadmap trajectory. Ability to mark certs he has already earned so they don't appear as suggestions. Structured roadmap milestones with real cert links.

### 3.3 Senior Technical Lead (Aisha)

- **Role**: EY Technology Senior Manager, 12+ years experience
- **Context**: Mentors teams and wants to recommend specific certifications to direct reports. Uses SpringAIS to plan team skill development.
- **Needs**: Comprehensive badge catalog coverage. Ability to trust that badge suggestions are real and current. Analytics on which badge suggestions her team actually pursues.

---

## 4. Glossary

Establishing consistent terminology (ref: codebase analysis Section 7.5):

| Term | Definition |
|------|------------|
| **Badge** | A digital credential issued through platforms like Credly. Represents verified achievement. Has an image, metadata, and a unique URL. |
| **Certification** | An industry-recognized professional credential (e.g., AWS Solutions Architect, PMP). May or may not have an associated digital badge. Typically requires passing an exam. |
| **Certificate** | A proof of course or program completion (e.g., Coursera course certificate). Less formal than a certification. Not the focus of this PRD. |
| **Badge Catalog** | The internal database of known badges and certifications with metadata (provider, URL, skills, difficulty). |
| **Badge Discovery** | The process of searching external APIs and the internal catalog to find badges relevant to a given skill or set of skills. |

---

## 5. Functional Requirements

### FR-1: Badge Discovery Service (Backend)

**Description**: A backend service that accepts skill names and returns a ranked list of relevant, verified badges and certifications from multiple sources.

**Acceptance Criteria**:
- FR-1.1: Service exposes a `GET /api/badges/discover?skills=<comma-separated>` endpoint that returns matching badges.
- FR-1.2: Service queries the internal curated badge catalog first, then external APIs (Microsoft Learn Catalog API, Credly API when available).
- FR-1.3: Each returned badge includes at minimum: `id`, `name`, `issuer`, `platform`, `url`, `skills`, `difficulty_level`, and `relevance_score`.
- FR-1.4: Results are ranked by `relevance_score` (descending). Curated matches score highest, followed by API matches, followed by AI-inferred matches.
- FR-1.5: When no external API is reachable, the service falls back to the curated catalog and returns results within 200ms.
- FR-1.6: Service supports pagination (`page`, `per_page` parameters) with a default page size of 20.

**References**: D-G1, D-G4

---

### FR-2: Badge-Skill Relevance Matching

**Description**: A matching engine that determines how relevant a badge is to a given skill, producing a numeric relevance score.

**Acceptance Criteria**:
- FR-2.1: Curated skill-to-badge mappings (manually maintained) receive the highest relevance score (1.0).
- FR-2.2: Badges returned from external APIs where the skill appears in the badge's `skills` array receive a high relevance score (0.7-0.9 based on position/specificity).
- FR-2.3: Keyword matching with normalization (case-insensitive, whitespace-trimmed, common abbreviation expansion) is used as a baseline matcher.
- FR-2.4: The matching engine is extensible -- new matching strategies (e.g., AI semantic similarity) can be added as plugins without modifying existing matchers.
- FR-2.5: Badges with a relevance score below a configurable threshold (default 0.3) are excluded from results.

**References**: D-G1, D-G4

---

### FR-3: Profile Integration -- Specific Badges per Skill Module

**Description**: Skill detail modals and skill cards surface specific, verified badge recommendations matched to the user's current skill, replacing generic EY resource links.

**Acceptance Criteria**:
- FR-3.1: The `SkillDetailModal` EY Resources section shows badge cards with: badge name, issuer logo/name, difficulty level, and a direct "View Badge" link that opens the specific badge page (not a generic org page).
- FR-3.2: The `EYResource` schema (backend and frontend) is extended with: `badge_id` (optional string), `issuer` (optional string), `image_url` (optional string), `difficulty_level` (optional enum: beginner/intermediate/advanced/expert).
- FR-3.3: The `generate-content` endpoint (`/skills/generate-content`) merges AI-generated resource suggestions with verified badge data from the discovery service. Verified badges are marked distinctly from AI suggestions.
- FR-3.4: Fallback content (`_generate_fallback_content`) returns skill-specific Credly search URLs (e.g., `https://www.credly.com/organizations/ey/badges?search={skill}`) instead of the generic org page URL.
- FR-3.5: The existing dead `certifications` display in `SkillDetailModal` is either wired to real data from the badge discovery service or removed.

**References**: D-G1

---

### FR-4: Roadmap Integration -- Certification Milestones Linked to Real Programs

**Description**: Roadmap certification milestones carry structured badge/certification data with direct links, costs, and difficulty information.

**Acceptance Criteria**:
- FR-4.1: The `RoadmapMilestone` schema adds an optional `certifications` array field alongside the existing `resources` string array. Each entry includes: `name`, `provider`, `url`, `difficulty_level`, `estimated_cost_usd` (optional), `estimated_hours` (optional).
- FR-4.2: The `ROADMAP_GENERATION_PROMPT` is updated to inject known certifications for the target role's skills from the badge catalog, so GPT references real certs instead of inventing them.
- FR-4.3: `MilestoneCard` renders certification entries as clickable cards with provider name, direct enrollment/info link, and difficulty indicator.
- FR-4.4: Plain-text resources that contain recognizable URLs are auto-linked (rendered as clickable links).
- FR-4.5: The `AddExtraModal` shows a searchable autocomplete of known certifications when the user selects the "Certification" category, populated from the badge catalog.

**References**: D-G2

---

### FR-5: Badge Usefulness Tracking

**Description**: The system tracks user interactions with badge suggestions to measure their effectiveness and feed the improvement loop.

**Acceptance Criteria**:
- FR-5.1: Every badge link click is recorded with: `user_id`, `badge_id`, `source` (skill_module | roadmap_milestone | search), `timestamp`.
- FR-5.2: Users can mark a badge/certification as "Earned" from any badge card. Earned badges are stored in a `user_badges` table with `earned_date`.
- FR-5.3: Users can rate a badge suggestion as "Relevant" or "Not Relevant" via a thumbs-up/thumbs-down interaction on the badge card.
- FR-5.4: A `GET /api/badges/analytics` endpoint (admin/internal) returns aggregated metrics: click-through rates per badge, per skill, per source; completion counts; relevance rating distribution.
- FR-5.5: Badges that consistently receive "Not Relevant" ratings (>60% negative over 50+ ratings) are flagged for review in the curated catalog.

**References**: D-G3, D-G4

---

### FR-6: Curated Badge Catalog with Periodic Refresh

**Description**: An internal database of verified badges and certifications, seeded with high-value entries and refreshed periodically from external sources.

**Acceptance Criteria**:
- FR-6.1: A `badge_catalog` database table stores badge metadata: `id`, `external_id`, `name`, `issuer`, `platform` (enum: credly, microsoft, aws, google, comptia, pmi, other), `url`, `image_url`, `skills` (array), `difficulty_level`, `estimated_cost_usd`, `estimated_hours`, `renewal_months`, `is_active`, `last_refreshed_at`.
- FR-6.2: The catalog is seeded with an initial curated set of at least 50 high-value certifications spanning: AWS (12), Azure/Microsoft (20+), Google Cloud (10), CompTIA (15), PMI (7), and EY-specific Credly badges.
- FR-6.3: A `badge_skill_mapping` table explicitly links badges to skills with a `mapping_confidence` score (1.0 for manually curated, lower for auto-generated).
- FR-6.4: A background job refreshes the catalog from the Microsoft Learn Catalog API on a configurable schedule (default: weekly).
- FR-6.5: When Credly API access is available, a refresh job pulls EY organization badge templates and updates the catalog.
- FR-6.6: Stale entries (not refreshed in 90 days and not manually curated) are marked inactive and excluded from discovery results.

**References**: D-G1, D-G4

---

### FR-7: Quick Wins (Immediate Improvements)

**Description**: Low-effort changes to the existing codebase that deliver immediate value before the full badge system is built.

**Acceptance Criteria**:
- FR-7.1: `EY_RESOURCES["badges"]` in `learning_content_service.py` is replaced with a skill-specific Credly search URL: `https://www.credly.com/organizations/ey/badges?search={skill_name}`.
- FR-7.2: `_generate_fallback_content()` generates skill-specific EY resource titles (e.g., "EY Badges for Python" instead of "EY Badges").
- FR-7.3: Roadmap milestone resources that contain URLs (detected by regex) are rendered as clickable links in `MilestoneCard.tsx`.
- FR-7.4: The `SkillDetailModal` certifications section is either connected to live data or removed to avoid showing dead UI.
- FR-7.5: Badge-type EY resources display a distinct badge/certificate icon instead of the generic building icon.

**References**: D-G1, D-G2

---

## 6. Non-Functional Requirements

### NFR-1: Performance

| Requirement | Target |
|-------------|--------|
| Badge discovery API response time (cached) | < 200ms (p95) |
| Badge discovery API response time (cache miss, external API call) | < 2000ms (p95) |
| Impact on skill detail modal load time | < 100ms additional latency |
| Impact on roadmap generation time | < 500ms additional latency |

- Badge suggestions must be cached aggressively. Skill-to-badge mappings from the curated catalog are loaded at startup and kept in Redis.
- External API calls (Microsoft Learn, Credly) are cached in Redis with configurable TTL (default: 24 hours for Microsoft, 1 hour for Credly).
- Badge discovery for skill modules happens asynchronously -- the modal loads immediately and badge suggestions populate after the discovery call resolves.

### NFR-2: Reliability & Graceful Degradation

| Scenario | Fallback Behavior |
|----------|-------------------|
| Microsoft Learn API unavailable | Return curated catalog matches only. Log warning. |
| Credly API unavailable | Return curated catalog matches + Microsoft Learn results. Log warning. |
| All external APIs unavailable | Return curated catalog matches only. Display "Some results may be limited" indicator. |
| Badge catalog empty for a skill | Return skill-specific Credly search URL as a last resort. |
| Redis cache unavailable | Query database directly. Accept higher latency. |

- No badge-related failure should prevent the skill detail modal or roadmap from loading. Badge suggestions are always supplementary, never blocking.

### NFR-3: Data Freshness

| Data Source | Refresh Frequency | Strategy |
|-------------|-------------------|----------|
| Curated badge catalog | Manual + quarterly review | Admin interface or migration scripts |
| Microsoft Learn Catalog API | Weekly (configurable) | Background job, full catalog pull |
| Credly badge templates (when available) | Daily (configurable) | Background job, incremental via `updated_at` filter |
| Badge-skill mapping confidence scores | Monthly recalculation | Based on user feedback (FR-5.5) |

### NFR-4: Data Integrity

- All badge URLs stored in the catalog must be validated (HTTP HEAD check returning 2xx or 3xx) before insertion.
- External badge IDs must be unique per platform (composite key: `platform` + `external_id`).
- Badge-skill mappings reference skills by normalized name (lowercase, trimmed, common aliases resolved).

---

## 7. Success Metrics

These metrics address goal D-G3 (prove badge suggestions are useful):

### 7.1 Primary Metrics

| Metric | Baseline (Current) | Target (Phase A) | Target (Phase B+) | Measurement |
|--------|---------------------|-------------------|--------------------|-------------|
| **Badge link click-through rate** | Unknown (no tracking) | > 15% of users who see a badge card click it | > 25% | FR-5.1 event tracking |
| **Specific link CTR vs generic link CTR** | 0% specific (all links are generic) | 80% of badge links are specific | 95% | Compare badge URLs against known generic URLs |
| **Badge/cert completion after suggestion** | Unknown | > 5% of clicked badges result in "Earned" marking within 6 months | > 10% | FR-5.2 earned tracking |
| **User relevance rating** | N/A | > 70% positive (thumbs-up) | > 80% positive | FR-5.3 feedback |

### 7.2 Secondary Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Roadmap milestone completion rate (cert milestones) | Increase by 20% vs current unlinked milestones | Compare completion rates before/after structured cert data |
| Badge catalog coverage | > 80% of skills in the system have at least 1 matched badge | Catalog coverage report |
| Time from badge suggestion to "Earned" marking | Decrease over time as suggestions become more relevant | Event timestamp analysis |
| Number of users adding cert extras manually | Decrease as system auto-suggests relevant certs | Compare manual cert extras before/after |

### 7.3 A/B Comparison Plan

For Phase A, run an A/B test:
- **Control**: Users see current generic EY resource links (no changes).
- **Treatment**: Users see skill-specific Credly search URLs (FR-7.1) and clickable roadmap resources (FR-7.3).
- **Duration**: 4 weeks minimum, or until 500+ badge impressions per group.
- **Primary measure**: Click-through rate difference.

---

## 8. Phased Delivery Plan

### Phase A: Quick Wins + Curated Catalog Foundation

**Goal**: Deliver immediate, visible improvements with zero external dependencies.

| Item | Scope | References |
|------|-------|------------|
| Skill-specific Credly search URLs | Replace generic EY badge URL with `?search={skill}` pattern | FR-7.1, FR-7.2 |
| Clickable roadmap resources | Auto-detect and link URLs in milestone resource strings | FR-7.3 |
| Clean up dead certifications UI | Wire to data or remove dead `certifications` section | FR-7.4 |
| Badge icon for badge-type resources | Visual distinction for badge resources | FR-7.5 |
| Badge catalog table + seed data | Create `badge_catalog` and `badge_skill_mapping` tables; seed with 50+ curated entries | FR-6.1, FR-6.2, FR-6.3 |
| Basic click tracking | Record badge link clicks | FR-5.1 |

**Dependencies**: None. All work uses existing infrastructure + static data.
**Estimated Scope**: 5-8 stories.

---

### Phase B: Microsoft Learn API Integration + Badge Discovery Service

**Goal**: Live badge discovery from the best free API source, integrated into skill modules and roadmaps.

| Item | Scope | References |
|------|-------|------------|
| Badge discovery service | Backend service with `/api/badges/discover` endpoint | FR-1 |
| Microsoft Learn Catalog API integration | Query Microsoft's free public API for certifications by skill/role | FR-1.2 |
| Relevance matching engine | Score and rank badge results from catalog + API | FR-2 |
| Profile integration | Badge cards in SkillDetailModal with real data, issuer, direct links | FR-3 |
| Roadmap certification enrichment | Structured cert data on milestone cards; inject real certs into roadmap prompt | FR-4.1, FR-4.2, FR-4.3 |
| Catalog auto-refresh | Weekly background job pulling Microsoft Learn data | FR-6.4 |
| Extended EYResource schema | Add badge_id, issuer, image_url, difficulty_level fields | FR-3.2 |
| RoadmapMilestone schema extension | Add optional `certifications` structured array | FR-4.1 |
| Redis caching layer | Cache discovery results and catalog lookups | NFR-1 |

**Dependencies**: Phase A completed (catalog tables exist, click tracking works).
**Estimated Scope**: 8-12 stories.

---

### Phase C: Credly API Integration

**Goal**: Unlock EY-specific and organization-specific badge discovery via Credly's enterprise API.

| Item | Scope | References |
|------|-------|------------|
| Credly API client | Authenticated integration with Credly `badge_templates` endpoint | FR-1.2 |
| Skill-based Credly search | Use `filter=skills::` parameter for dynamic badge discovery | FR-2 |
| EY badge catalog refresh | Daily pull of EY org badge templates from Credly | FR-6.5 |
| Badge deep-linking via vanity slugs | Construct `/org/ey/badge/{vanity_slug}` links from API data | FR-3.1 |
| Cert autocomplete in AddExtraModal | Searchable dropdown of known certs when adding extras | FR-4.5 |

**Dependencies**: Phase B completed. EY Credly enterprise API access secured (external coordination required).
**Estimated Scope**: 4-6 stories.

---

### Phase D: AI Semantic Matching + Analytics Dashboard

**Goal**: Handle the long tail of skills that don't have curated mappings. Provide visibility into badge suggestion effectiveness.

| Item | Scope | References |
|------|-------|------------|
| AI semantic matching | Embedding-based similarity between user skills and badge descriptions as a fallback matcher | FR-2.4 |
| User badge earning tracking | "Mark as Earned" flow, user_badges table | FR-5.2 |
| Relevance feedback (thumbs up/down) | User rates badge suggestions | FR-5.3 |
| Analytics endpoint | Admin metrics: CTR, completion rates, rating distributions | FR-5.4 |
| Auto-flagging low-relevance badges | System flags badges with consistently negative ratings | FR-5.5 |
| Confidence score recalculation | Monthly job adjusting mapping confidence from feedback data | NFR-3 |

**Dependencies**: Phase B completed. Phase C is independent (can run in parallel).
**Estimated Scope**: 6-10 stories.

---

## 9. Out of Scope

The following are explicitly **not** part of this PRD:

| Item | Reason |
|------|--------|
| **Badge issuance** | SpringAIS does not issue badges. It recommends external badges/certs. Issuance is handled by Credly, cert providers, etc. |
| **Credential verification** | Verifying that a user actually earned a badge (e.g., via Credly badge verification API) is a future enhancement. Phase D allows self-reported "Earned" status. |
| **LMS integration** | Integration with EY's internal LMS (e.g., Virtual Academy) for automatic course enrollment is out of scope. Links to external pages are sufficient. |
| **Badge wallet / portfolio** | A user-facing "my badges" portfolio page where users showcase earned badges. May be a future project. |
| **Team-level badge analytics** | Manager-facing dashboards showing team certification progress. The admin analytics endpoint (FR-5.4) provides raw data but not a manager UI. |
| **Gamification bridge** | Connecting real-world cert completions to the AdventureHUD game-mode XP/achievements system. Noted as a future opportunity. |
| **Certificate (course completion) tracking** | This PRD focuses on professional certifications and digital badges, not course completion certificates. |
| **Custom badge creation** | EY-internal badge design or creation tools. |

---

## 10. Risks & Mitigations

| ID | Risk | Severity | Probability | Mitigation |
|----|------|----------|-------------|------------|
| **R-1** | Credly API access not available | High | Medium | Phase C is fully optional. Phases A and B deliver value without Credly. Curated mappings + Microsoft Learn API cover the highest-value certs. Fall back to skill-specific Credly search URLs (no API needed). |
| **R-2** | Badge/certification data goes stale | Medium | High | Automated refresh jobs (FR-6.4, FR-6.5). Stale entries auto-deactivated after 90 days (FR-6.6). URL validation on catalog insert (NFR-4). |
| **R-3** | Skill name mismatch between SpringAIS and badge catalogs | Medium | High | Normalize skill names (lowercase, trim, alias expansion). Keyword matching with fuzzy tolerance (FR-2.3). AI semantic matching in Phase D handles remaining mismatches. |
| **R-4** | AI still hallucinates badge names despite improvements | Medium | Medium | Separate verified badges (from catalog/API) from AI suggestions visually. Verified badges get a "Verified" indicator. AI suggestions are labeled "Suggested" and carry lower relevance scores. |
| **R-5** | Low user engagement with badge features | Medium | Low | Quick wins (Phase A) provide immediate value with minimal investment. A/B testing validates engagement before investing in Phases C/D. |
| **R-6** | External API rate limiting | Low | Low | Aggressive caching (NFR-1). Microsoft Learn API has generous limits. Credly pagination at 50/page is manageable. |
| **R-7** | Schema changes break existing data | Medium | Low | New fields on `EYResource` and `RoadmapMilestone` are optional (nullable). Existing data continues to work without migration of old records. |

---

## 11. Decision Log

| D-ID | Decision | Rationale | Status |
|------|----------|-----------|--------|
| **D-PRD-1** | Use a phased delivery approach (A/B/C/D) rather than big-bang | Phases A and B deliver value without external dependencies. Phase C depends on Credly access which requires coordination. Phase D adds AI matching which is highest-effort. This de-risks the project. | Proposed |
| **D-PRD-2** | Microsoft Learn Catalog API is the first live API integration (Phase B) | Free, public, no auth required, rich skill data, direct cert URLs. Lowest-effort, highest-value API integration. See research artifact Section 2. | Proposed |
| **D-PRD-3** | Curated mapping table is the foundation, not AI matching | Curated mappings are most accurate and deterministic. AI matching is a fallback for uncovered skills in Phase D. This avoids hallucination issues (the core problem we're solving). | Proposed |
| **D-PRD-4** | New schema fields are additive/optional, not breaking changes | Adding `badge_id`, `issuer`, `certifications[]` as optional fields preserves backward compatibility. No migration needed for existing records. | Proposed |
| **D-PRD-5** | Badge suggestions are supplementary, never blocking | No badge-related failure prevents core features (skill modals, roadmaps) from loading. Badges load asynchronously. | Proposed |
| **D-PRD-6** | Self-reported "Earned" status (no verification) in initial phases | Credential verification via Credly API adds complexity and is out of scope. Trust users to self-report. Can add verification later. | Proposed |
| **D-PRD-7** | Establish badge/certification/certificate glossary | Codebase uses terms interchangeably (research artifact Section 7.5). Consistent terminology prevents confusion in UI and code. | Proposed |

---

## Appendix A: Affected Files Summary

From codebase analysis, these files will be modified across phases:

### Backend (Existing Files to Modify)
| File | Changes |
|------|---------|
| `backend/app/services/learning_content_service.py` | FR-3.3, FR-3.4, FR-7.1, FR-7.2 |
| `backend/app/services/roadmap_service.py` | FR-4.2 |
| `backend/app/schemas/skill_progress.py` | FR-3.2 |
| `backend/app/schemas/roadmap.py` | FR-4.1 |
| `backend/app/routes/skills.py` | FR-3.3 |
| `backend/app/routes/roadmap.py` | FR-4.5 |

### Backend (New Files)
| File | Purpose |
|------|---------|
| `backend/app/services/badge_discovery_service.py` | FR-1, FR-2 |
| `backend/app/models/badge.py` | FR-6.1, FR-6.3 |
| `backend/app/schemas/badge.py` | FR-1.3 |
| `backend/app/routes/badges.py` | FR-1.1, FR-5.4 |

### Frontend (Existing Files to Modify)
| File | Changes |
|------|---------|
| `frontend/src/components/skills/SkillDetailModal.jsx` | FR-3.1, FR-3.5, FR-7.4, FR-7.5 |
| `frontend/src/components/skills/SkillCard.jsx` | FR-3.1 |
| `frontend/src/components/roadmap/MilestoneCard.tsx` | FR-4.3, FR-4.4, FR-7.3 |
| `frontend/src/components/roadmap/ExtrasSection.tsx` | FR-4.5 |
| `frontend/src/components/roadmap/AddExtraModal.tsx` | FR-4.5 |
| `frontend/src/services/roadmapService.ts` | FR-4.1 |
| `frontend/src/services/skillProgressService.ts` | FR-3.2 |

### Frontend (New Files)
| File | Purpose |
|------|---------|
| `frontend/src/services/badgeService.ts` | FR-1 (API client) |
| `frontend/src/components/badges/BadgeCard.tsx` | FR-3.1 (reusable badge display) |
| `frontend/src/components/badges/BadgeSearch.tsx` | FR-4.5 (search/autocomplete) |
