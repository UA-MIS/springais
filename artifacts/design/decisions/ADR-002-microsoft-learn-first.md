# ADR-002: Microsoft Learn API First, Credly API Second

> **Status**: Accepted
> **Date**: 2026-02-11
> **Decision Makers**: Architect Agent
> **References**: D-PRD-2, FR-1.2, FR-6.4, FR-6.5

---

## Context

Two major external APIs are candidates for live badge discovery:

1. **Microsoft Learn Catalog API**
   - Free, public, no authentication required
   - ~150 certifications with rich metadata (skills arrays, roles, levels, direct URLs)
   - Covers Azure, Microsoft 365, Dynamics, Power Platform, Security
   - Generous rate limits (no documented restrictions)
   - Endpoint: `https://learn.microsoft.com/api/catalog/`

2. **Credly API**
   - Requires enterprise agreement ($2,500-$20,000/year)
   - EY-specific badges available via org filter
   - Skill-based search (`filter=skills::value`)
   - Includes vanity slugs for deep-linking
   - EY likely already has enterprise access (they actively issue badges)

Both APIs provide skill-based filtering and detailed badge metadata. The question is which to integrate first.

## Decision

**Integrate Microsoft Learn Catalog API in Phase B. Integrate Credly API in Phase C.**

Rationale:
1. **Zero external dependencies**: Microsoft Learn API is free and requires no API keys, contracts, or coordination with external teams. Development can begin immediately.
2. **High coverage for technical skills**: Microsoft/Azure certifications are among the most sought-after in EY's technology consulting practice. ~150 certifications cover a significant portion of user needs.
3. **Rich skill metadata**: MS Learn response includes `skills[]` arrays, making relevance matching straightforward.
4. **Direct deep-link URLs**: Every certification has a deterministic URL pattern (`/credentials/certifications/{id}/`).
5. **Credly requires coordination**: Obtaining API credentials requires engagement with EY's Credly enterprise agreement administrators. This coordination is decoupled from development work.

## Consequences

### Positive

- **Immediate progress**: Phase B development proceeds without any external dependencies or procurement.
- **Proven value before investment**: By Phase C, the badge system has demonstrated value with curated + MS Learn data. This justifies the Credly investment.
- **Risk isolation**: Phase C (Credly) is fully optional. If Credly API access cannot be obtained, Phases A+B still deliver significant value.
- **Parallel development**: Phase C and Phase D can develop in parallel since neither depends on the other.

### Negative

- **No EY-specific badges until Phase C**: EY organization badges on Credly are not discoverable via API until Phase C. Curated mappings and skill-specific Credly search URLs (Phase A) partially mitigate this.
- **No AWS/GCP/CompTIA API discovery**: These providers lack public APIs. Coverage depends on the curated catalog until Credly API (which hosts their badges) is available in Phase C.

### Mitigations

- Phase A seeds the curated catalog with AWS (12), GCP (10), CompTIA (15), and PMI (7) certifications with known URLs. These are available immediately.
- Phase A replaces generic Credly links with skill-specific search URLs (`?search={skill}`), providing better UX even without API access.
- Credly API integration in Phase C is designed as a pluggable matcher, adding the `CredlyMatcher` to the matching engine without modifying existing matchers.
