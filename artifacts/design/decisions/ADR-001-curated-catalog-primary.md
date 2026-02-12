# ADR-001: Curated Catalog as Primary Source, External APIs as Enrichment

> **Status**: Accepted
> **Date**: 2026-02-11
> **Decision Makers**: Architect Agent
> **References**: D-PRD-3, FR-1.2, FR-2.1, FR-6.1

---

## Context

The badge discovery system needs to match user skills to relevant badges and certifications. Multiple data sources are available:

1. **Curated catalog**: Manually maintained mappings of skills to known certifications (e.g., "Azure" -> "Azure Solutions Architect Expert")
2. **Microsoft Learn Catalog API**: Free public API with ~150 certifications including skill tags
3. **Credly API**: Enterprise API with org-specific badges (requires paid access)
4. **AI inference**: GPT or embedding-based matching (probabilistic, may hallucinate)
5. **Keyword matching**: Automated text matching against badge metadata

The core problem this system solves is **AI hallucination of badge names and URLs** (PRD Section 1). The AI currently invents badges that do not exist, eroding user trust.

## Decision

**The curated badge catalog is the authoritative primary source.** External APIs and AI matching enrich and extend the catalog but never override curated data.

The matching pipeline executes in this order:
1. **Curated mappings** (confidence = 1.0) -- highest priority
2. **External API results** (confidence = 0.7-0.9) -- second priority
3. **Keyword matching** (confidence = 0.4-0.6) -- third priority
4. **AI semantic matching** (confidence = 0.3-0.5, Phase D) -- fallback only

Results from all sources are merged and deduplicated. When a badge appears in both the curated catalog and an API result, the curated data takes precedence for metadata (URL, skills mapping, difficulty level).

## Consequences

### Positive

- **Deterministic accuracy**: Curated mappings guarantee correct badge names, URLs, and skill associations. No hallucination risk for curated entries.
- **Trust foundation**: Users see verified badges prominently. Curated entries can display a "Verified" indicator.
- **Graceful degradation**: If all external APIs fail, the curated catalog still provides results (NFR-2, FR-1.5).
- **Fast responses**: Curated catalog queries are database-only, meeting the 200ms p95 target (NFR-1).

### Negative

- **Maintenance burden**: Curated catalog requires periodic manual review (~2-4 hours/quarter per the research artifact). Initial seeding of 50+ entries requires one-time effort.
- **Coverage gaps**: Skills not in the curated catalog rely on external APIs or AI matching, which may return less accurate results.
- **Scaling ceiling**: The curated approach does not scale to thousands of niche certifications. Phase D's AI matching addresses the long tail.

### Mitigations

- Start with 50+ high-value certifications covering the most common skills (AWS, Azure, GCP, CompTIA, PMI, EY badges).
- External API results are automatically added to the catalog as "api-sourced" entries, reducing future manual curation.
- Phase D adds AI semantic matching as a fallback for uncovered skills.
- User feedback (FR-5.3, FR-5.5) identifies gaps in coverage and informs catalog updates.
