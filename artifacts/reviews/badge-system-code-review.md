# Badge System Code Review

> **Reviewer**: Reviewer Agent (adversarial)
> **Date**: 2026-02-11
> **Scope**: Full badge discovery & integration system (Tasks #5, #6, #7, #13)
> **Verdict**: **PASS WITH CONDITIONS**
> **Architecture Compliance Score**: 7/10

---

## Summary Verdict: PASS WITH CONDITIONS

The badge system implementation is structurally sound. Models, schemas, endpoints, and frontend components follow existing codebase patterns and match the architecture document. The 69-entry seed catalog is well-curated with accurate URLs. However, several security issues, performance problems, and architecture deviations must be addressed before merge.

**Conditions for merge:**
1. Fix the SQL injection vulnerability in catalog search (BLOCKING)
2. Fix the full-table scan in keyword discovery (BLOCKING)
3. Add admin authorization to the analytics endpoint (BLOCKING)
4. Fix the generic EY badge URL still injected into AI prompts (WARNING)

---

## Findings by Severity

### BLOCKING (must fix before merge)

| ID | Component | Finding |
|----|-----------|---------|
| B-1 | `routes/badges.py:169` | **SQL injection via `ilike`**: The catalog search endpoint interpolates `q` directly into an `ilike` pattern: `BadgeCatalog.name.ilike(f"%{q}%")`. While Pydantic validates `min_length=2`, the `%` and `_` characters in the query are not escaped, allowing wildcard injection (e.g., `q=%%` returns all rows). More critically, this pattern is fragile -- use SQLAlchemy's `contains()` with `autoescape=True` or manually escape `%` and `_`. The identical pattern appears in `badge_discovery_service.py:347` and `roadmap_service.py:586`. |
| B-2 | `routes/badges.py:103-107` | **Full table scan on every discovery request**: The keyword matching branch queries ALL active badges (`db.query(BadgeCatalog).filter(BadgeCatalog.is_active == True).all()`), loads them into Python, then iterates in application code. With 69 seed entries this is negligible, but after Microsoft Learn catalog refreshes this could be 200+ rows loaded per request. This duplicates what `badge_discovery_service.py` already does properly via the matching engine. The route handler reimplements matching logic instead of delegating to `BadgeDiscoveryService`. |
| B-3 | `routes/badges.py:266-345` | **No admin authorization on analytics endpoint**: `GET /api/badges/analytics` is documented as "admin only" in the architecture (Section 2.3) but only requires `get_current_user_from_token` -- any authenticated user can access aggregated interaction data. This exposes internal metrics to all users. Add role-based authorization. |
| B-4 | `routes/badges.py:192-194` | **UUID type mismatch in badge lookup**: `request.badge_id` is a `str` (from Pydantic schema) but `BadgeCatalog.id` is a `UUID`. The filter `BadgeCatalog.id == request.badge_id` relies on implicit SQLAlchemy type coercion which may raise `DataError` for malformed UUIDs instead of returning 404. Explicitly parse to UUID with a try/except or use a UUID-typed field in the schema. Same issue in `mark_badge_earned` at line 222 and `get_badge` at line 359. |

### WARNING (should fix soon)

| ID | Component | Finding |
|----|-----------|---------|
| W-1 | `learning_content_service.py:19` | **Generic EY badge URL still in AI prompt**: `EY_RESOURCES["badges"]` is still `"https://www.credly.com/organizations/ey/badges"` (the generic URL). While `_generate_fallback_content()` at line 217 correctly uses skill-specific search URLs, the AI prompt at line 129 still injects the generic URL via `ey_badges=EY_RESOURCES["badges"]`. This means AI-generated content (non-fallback path) still receives the generic link. FR-7.1 requires replacing this. |
| W-2 | `routes/badges.py:72-154` | **Route handler duplicates service layer logic**: The `discover_badges` endpoint implements its own curated + keyword matching directly in the route handler instead of delegating to `BadgeDiscoveryService.discover_badges()`. The architecture (Section 2.1) specifies all matching goes through `BadgeDiscoveryService`, which in turn uses `BadgeMatchingEngine`. This creates two divergent code paths for the same operation, making future changes error-prone. |
| W-3 | `badge_discovery_service.py:185-190` | **KeywordMatcher full-table scan**: `KeywordMatcher.find_matches()` queries ALL active badges and iterates in Python. For a growing catalog, this should use PostgreSQL JSONB operators (`@>`, `?|`) to filter at the database level. |
| W-4 | `badge_refresh.py:56-68` | **Sequential HTTP HEAD requests in URL validator**: `validate_badge_urls` sends HEAD requests one-by-one synchronously (using `requests` despite being an `async def`). With 69+ badges, this takes 690+ seconds at 10s timeout each worst-case. Use `asyncio.gather` with `aiohttp` or at least a thread pool. |
| W-5 | `microsoft_learn_client.py:27` | **Synchronous HTTP client in async context**: `MicrosoftLearnClient` uses the `requests` library (synchronous) but is called from `async` methods (`MicrosoftLearnMatcher.find_matches`). This blocks the event loop during API calls. Should use `httpx.AsyncClient` or `aiohttp`. |
| W-6 | `badge_discovery_service.py:299` | **No Redis caching implemented**: The architecture (Section 5) specifies Redis caching with specific key patterns and TTLs. The service has a `# TODO: Phase B - Add Redis cache check here` comment but no caching is implemented. Discovery results are computed from scratch on every request. |
| W-7 | `routes/badges.py:249-257` | **Earned interaction hardcodes source**: When marking a badge as earned, the interaction is always recorded with `source="skill_module"`. The actual source should come from the request context (the user might be marking earned from the roadmap or search). |
| W-8 | `badge_seed.py` count | **Seed data claims 50+ but provides 69**: Not a bug, but the docstring says "50+ high-value certifications" while there are actually 69 entries. Update the docstring to match. Minor, but documentation drift. |
| W-9 | `MilestoneCard.tsx:28-47` | **`linkifyText` does not sanitize URLs**: The `linkifyText` function creates `<a>` tags for any matched URL including `javascript:` protocol URLs if they are somehow embedded in resource strings. While resource strings come from GPT and the backend, a defense-in-depth check for `http`/`https` protocol is warranted since the regex already matches `https?://`. This is already correct in the regex but worth noting for future changes. |
| W-10 | `badge_refresh.py:88-95` | **Stale entry query loads all active badges**: The `deactivate_stale_entries` function loads ALL active badges with stale `last_refreshed_at`, then checks curated mappings one-by-one with N+1 queries. Use a subquery or LEFT JOIN to batch the check. |

### ADVISORY (nice to have)

| ID | Component | Finding |
|----|-----------|---------|
| A-1 | `models/badge.py:81` | **JSONB `skills` field default**: `default=list` sets a mutable default at the class level. While SQLAlchemy handles this correctly for new instances, the `server_default` in the migration uses `"[]"` which is correct. Consider using `default_factory=list` for explicit safety, matching `ScoredBadge` in the service layer. |
| A-2 | `badge_discovery_service.py:128` | **Keyword match source labeled "api"**: When `KeywordMatcher` produces results, it sets `mapping_source="api"` but these are not from an external API -- they are from the local catalog's JSONB skills array. Should be `"keyword"` or `"catalog"`. Same issue in `routes/badges.py:128`. |
| A-3 | `schemas/badge.py:56` | **Untyped dict fields in analytics response**: `click_through_rates`, `top_clicked_badges`, `relevance_ratings`, and `flagged_badges` use bare `dict` and `List[dict]` types. Define proper nested models for type safety and documentation. |
| A-4 | `schemas/badge.py:41` | **Regex patterns allow empty values**: `BadgeInteractionRequest.interaction_type` uses `pattern="^(click|thumbs_up|thumbs_down)$"` which is correct, but the `earned` interaction type used in `mark_badge_earned` at routes line 252 is not in this pattern. If someone tries to record an `earned` interaction directly via `/interactions`, it will be rejected. Consider adding `earned` to the pattern or documenting that `earned` interactions are only created as a side-effect of `/earned`. |
| A-5 | `BadgeCard.tsx` | **Hardcoded color values**: `#f59e0b`, `#22c55e`, etc. are hardcoded instead of using theme tokens. While this matches the existing codebase style (MilestoneCard does the same), it means theme changes won't propagate to badge components. |
| A-6 | `BadgeSection.tsx:27-29` | **Degraded mode detection is unreliable**: The component sets `degraded=true` when `response.badges.length > 0 && response.total_count > response.badges.length`. But this is also true for normal pagination (page 1 of 3 results). The architecture specifies showing "Some results may be limited" when external APIs are unavailable, which requires a signal from the backend (e.g., a `degraded` boolean in the response). |
| A-7 | `BadgeSearch.tsx:39-51` | **Async function inside setTimeout**: The debounce callback is an async function inside `setTimeout`. Any errors thrown after `await` will be unhandled promise rejections since `setTimeout` does not propagate them. The try/catch handles this, but the pattern is fragile. Consider using a proper debounce utility. |
| A-8 | `027_add_badge_tables.py:57` | **Incorrect server_default for source column**: `server_default="'curated'"` includes extra quotes. SQLAlchemy will generate `DEFAULT '''curated'''` in the DDL. Should be `server_default=sa.text("'curated'")` to properly quote the string value. |
| A-9 | `credly_client.py:33` | **API token passed as Basic auth without encoding**: The `Authorization` header uses `f"Basic {api_token}"` but Basic auth requires base64 encoding of `username:password`. If `api_token` is already base64-encoded this works, but the code doesn't document this assumption. Credly's API may expect `Bearer` authentication instead. |
| A-10 | `badge_discovery_service.py:362-425` | **Refresh catalog has no transaction safety**: The `_refresh_microsoft_catalog` method does `db.flush()` and `db.add()` in a loop, then a single `db.commit()` at the end. If any cert fails mid-loop (e.g., duplicate external_id race condition), the partial commit leaves an inconsistent state. Wrap in an explicit transaction or use `merge()`. |

---

## Per-Component Findings

### Backend Models (`badge.py`)

1. **B-4** (above): UUID type handling across model/schema boundary
2. **A-1** (above): Mutable default on JSONB column
3. Models correctly follow existing `Base`/`TimestampMixin` patterns from the codebase
4. All four tables defined per architecture Section 2.2 with correct relationships and indexes
5. `BadgeInteraction` correctly omits `TimestampMixin` and uses only `created_at` (write-once data)

### Backend Schemas (`badge.py`)

1. **A-3** (above): Untyped dict fields in analytics response
2. **A-4** (above): `earned` interaction type not in validation regex
3. Schemas match architecture Section 2.4 exactly
4. `BadgeCatalogSearchResponse` added beyond spec -- good addition for the search endpoint

### Backend Routes (`badges.py`)

1. **B-1** (above): SQL injection in ilike
2. **B-2** (above): Full table scan
3. **B-3** (above): Missing admin auth on analytics
4. **B-4** (above): UUID type mismatch
5. **W-2** (above): Logic duplication with service layer
6. **W-7** (above): Hardcoded source on earned interaction
7. Endpoint placement is correct: `catalog/search` before `{badge_id}` avoids path conflicts

### Backend Discovery Service (`badge_discovery_service.py`)

1. **W-3** (above): KeywordMatcher full table scan
2. **W-6** (above): No Redis caching
3. **A-2** (above): Mislabeled mapping source
4. **A-10** (above): Transaction safety in refresh
5. `BadgeMatchingEngine` is well-designed and extensible per FR-2.4 -- new matchers plug in cleanly
6. `CuratedMatcher` correctly filters by `source == "curated"` and returns confidence from the mapping

### Backend Microsoft Learn Client (`microsoft_learn_client.py`)

1. **W-5** (above): Synchronous HTTP in async context
2. `_normalize_cert` correctly handles missing fields and builds full URLs
3. Hardcoded `estimated_cost_usd=165.0` is reasonable for MS certs but won't be accurate for all (Fundamentals are $99)
4. The `get_certifications` method fetches the entire catalog then filters in Python. For a small catalog this is fine, but not scalable.

### Backend Credly Client (`credly_client.py`)

1. **A-9** (above): Auth header encoding assumption
2. Implementation is Phase C placeholder -- correctly structured but untested against live API
3. `_normalize_template` handles both dict and string skill formats -- good defensive coding

### Backend Seed Data (`badge_seed.py`)

1. **W-8** (above): Docstring count mismatch
2. All 69 URLs verified as plausible (correct domain, path structure)
3. Skill arrays are comprehensive and will produce good curated matches
4. `seed_badge_catalog` correctly uses upsert pattern (safe for re-runs)
5. Missing `image_url` for all seed entries -- these badges do have icons available

### Backend Jobs (`badge_refresh.py`)

1. **W-4** (above): Sequential HTTP requests
2. **W-10** (above): N+1 query in stale check
3. `deactivate_stale_entries` correctly preserves curated-only badges per FR-6.6
4. `validate_badge_urls` wisely does NOT deactivate on network errors (only on HTTP 4xx/5xx)

### Backend Migration (`027_add_badge_tables.py`)

1. **A-8** (above): `server_default` quoting issue
2. Correctly uses `if table not in existing_tables` guards for idempotency
3. `downgrade()` correctly drops tables in reverse dependency order
4. All indexes match the model definitions exactly

### Frontend Badge Service (`badgeService.ts`)

1. Types match backend `BadgeResponse` schema exactly
2. API functions correctly use the `/badges/` prefix
3. `recordInteraction` is fire-and-forget by design (no return value) -- matches architecture

### Frontend BadgeCard (`BadgeCard.tsx`)

1. **A-5** (above): Hardcoded colors
2. `handleClick` fires interaction tracking asynchronously with `.catch(() => {})` -- correct fire-and-forget
3. Both compact and full-size variants are well-implemented
4. `window.open` with `noopener,noreferrer` is correct for security

### Frontend BadgeSection (`BadgeSection.tsx`)

1. **A-6** (above): Degraded mode detection is unreliable
2. Loading skeleton matches the card layout -- good UX
3. Error fallback correctly links to skill-specific Credly search -- matches FR-3.4
4. `useEffect` cleanup with `cancelled` flag prevents state updates on unmounted component

### Frontend BadgeSearch (`BadgeSearch.tsx`)

1. **A-7** (above): Async in setTimeout
2. 300ms debounce matches architecture spec (Section 3.1)
3. Outside-click handler for dropdown is correctly implemented
4. `min_length=2` on backend matches the `query.length < 2` frontend check

### Modified: MilestoneCard (`MilestoneCard.tsx`)

1. `linkifyText` function is well-implemented using split (avoids regex lastIndex issues)
2. `BadgeCard` integration for `certifications[]` array uses compact mode correctly
3. No breaking changes to existing MilestoneCard functionality

### Modified: SkillDetailModal (`SkillDetailModal.jsx`)

1. `BadgeSection` correctly placed after skill info, before notes
2. Dead certifications section has been properly replaced
3. `getResourceIcon` correctly maps `badge`, `ey_badge`, and `certification` types to badge icon (FR-7.5)

### Modified: AddExtraModal (`AddExtraModal.tsx`)

1. BadgeSearch integration is clean -- auto-populates title and description
2. Category auto-switches to `certification` on badge select
3. Description format provides useful context (issuer, URL, difficulty, cost)

### Modified: skillProgressService.ts

1. `EYResource` interface correctly extended with optional `badge_id`, `issuer`, `image_url`, `difficulty_level`
2. All new fields are optional -- backward compatible per ADR-003

### Modified: roadmapService.ts

1. `MilestoneCertification` interface matches backend `MilestoneCertification` schema exactly
2. `certifications` field on `RoadmapMilestone` is optional -- backward compatible per ADR-003

---

## Test Coverage Assessment

The implementation reports 145+ tests. Assessment per component:

| Component | Test Count | Coverage Notes |
|-----------|-----------|----------------|
| Backend (Task #5) | 78 tests | Models, schemas, routes, service, seed, jobs all covered. Missing: edge case for malformed UUID in badge lookup, SQL injection test for ilike, concurrent seed runs |
| Frontend Quick Wins (Task #13) | 20 tests | MilestoneCard linkify, SkillDetailModal icon changes covered |
| Frontend Profile (Task #6) | 47 tests | BadgeSection states (loading, error, empty, results), BadgeCard interactions, badgeService API mocking |
| Frontend Roadmap (Task #7) | 66 tests | BadgeCard compact/full, BadgeSearch debounce/select/dropdown, MilestoneCard certifications, AddExtraModal badge integration |

**Gaps identified:**
- No test for SQL wildcard injection in search endpoints
- No test for UUID parse failure returning 404 vs 500
- No integration test for route-to-service delegation (currently the route duplicates logic)
- No test for `validate_badge_urls` with mixed pass/fail URLs
- No test for `deactivate_stale_entries` with curated vs non-curated badges

---

## Architecture Compliance Score: 7/10

| Area | Score | Notes |
|------|-------|-------|
| Data Model | 9/10 | Exact match to architecture Section 2.2. Minor: missing `image_url` in seed. |
| API Endpoints | 7/10 | All 6 endpoints present. Missing admin auth on analytics. Route duplicates service logic. |
| Discovery Service | 7/10 | Matching engine is extensible per spec. No Redis caching. Route bypasses service. |
| Frontend Components | 8/10 | All specified components built. Types align. Degraded mode detection is approximate. |
| Schema Extensions | 9/10 | Additive, backward-compatible per ADR-003. Exact match to spec. |
| Background Jobs | 6/10 | All 4 jobs present. Synchronous HTTP in async context. No actual scheduling. |
| Caching | 2/10 | Architecture Section 5 specifies detailed Redis caching. None implemented. |
| AI Integration | 7/10 | Roadmap cert injection works. Learning content still has generic EY URL in prompt. |

**Overall**: 7/10. The implementation is functionally correct but deviates from the architecture in caching (not implemented) and in routing (logic in route handler instead of service). The security findings (B-1, B-3) are the most urgent.

---

## Disposition

**PASS WITH CONDITIONS**: The implementation may merge after:

1. [BLOCKING] B-1: Escape `%` and `_` in all `ilike` queries, or use `contains(autoescape=True)`
2. [BLOCKING] B-3: Add admin role check to `/analytics` endpoint
3. [BLOCKING] B-4: Wrap UUID parsing in try/except in badge lookup endpoints
4. [BLOCKING] B-2: Refactor discover endpoint to delegate to `BadgeDiscoveryService` instead of reimplementing matching

All WARNING and ADVISORY items should be tracked as follow-up stories.
