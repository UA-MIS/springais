# ADR-004: Async Badge Loading (Non-Blocking UI)

> **Status**: Accepted
> **Date**: 2026-02-11
> **Decision Makers**: Architect Agent
> **References**: D-PRD-5, NFR-1, NFR-2

---

## Context

Badge discovery involves querying the local database, Redis cache, and potentially external APIs (Microsoft Learn, Credly). Response times vary:

| Source | Typical Latency |
|--------|----------------|
| Redis cache hit | < 5ms |
| PostgreSQL query (curated catalog) | 10-50ms |
| Microsoft Learn API | 200-800ms |
| Credly API | 300-1000ms |

The SkillDetailModal currently loads immediately when a user clicks a skill. Adding a synchronous badge discovery call would delay the modal opening by 200-1000ms, degrading the user experience.

Similarly, roadmap generation already takes 30-90 seconds (GPT-5.2 with reasoning). Adding badge discovery to the generation pipeline should not increase this time significantly.

The PRD states: "No badge-related failure should prevent the skill detail modal or roadmap from loading" (NFR-2).

## Decision

**Badge suggestions load asynchronously and never block the primary UI.**

### SkillDetailModal

1. The modal opens immediately with existing data (learning content, EY resources, progress).
2. A separate `BadgeSection` component mounts and triggers `GET /api/badges/discover?skills={skill}`.
3. While loading, a skeleton/shimmer placeholder is shown in the badge section.
4. On success, badge cards animate in.
5. On failure (API error, timeout), the section shows a fallback: "Could not load badge suggestions" with a retry link, or a skill-specific Credly search URL.
6. Impact on modal load time: 0ms (badge load is decoupled).

### Roadmap Generation

1. When `include_certifications=true`, the roadmap service queries `BadgeDiscoveryService.get_badges_for_skills()` before building the prompt.
2. This uses only the curated catalog (fast, no external API calls), adding < 50ms.
3. External API results are not used during roadmap generation -- they are too slow and could timeout.
4. After the roadmap is generated and saved, a background task can optionally enrich certification milestones with additional badge data from APIs.

### Click Tracking

1. Badge click tracking (`POST /api/badges/interactions`) fires asynchronously on click.
2. The user's browser navigates to the badge URL immediately; the tracking request is fire-and-forget.
3. If the tracking request fails, the click is lost but the user experience is unaffected.

## Consequences

### Positive

- **No UX degradation**: Modal load time unchanged. Roadmap generation time unchanged.
- **Resilience**: External API failures never block core features. The UI always loads.
- **Progressive enhancement**: Badge data appears when available, enriching the experience without being required.
- **Meets NFR-1**: Badge discovery impact on skill detail modal < 100ms (0ms for modal itself, badge section loads independently).

### Negative

- **Visual shift**: Badge cards appearing after the modal is open causes a layout shift. Must be handled with reserved space (skeleton) to avoid jarring reflow.
- **Stale data possible**: If the user opens the modal while a cache refresh is in progress, they may see slightly outdated results.
- **Lost tracking events**: Fire-and-forget click tracking may lose events under high failure rates. Acceptable tradeoff for UX.

### Mitigations

- `BadgeSection` reserves vertical space with a fixed-height skeleton to prevent layout shift.
- Cache TTLs (24h for discovery results) ensure data freshness without real-time overhead.
- Click tracking failures are logged server-side for monitoring. A retry mechanism can be added if loss rates exceed 5%.
