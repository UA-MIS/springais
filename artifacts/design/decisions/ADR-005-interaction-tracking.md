# ADR-005: Badge Interaction Tracking for ROI Measurement

> **Status**: Accepted
> **Date**: 2026-02-11
> **Decision Makers**: Architect Agent
> **References**: D-G3, D-G4, FR-5.1, FR-5.2, FR-5.3, FR-5.4, FR-5.5

---

## Context

A central goal of the badge discovery system is proving that badge suggestions are useful (D-G3). The current system has **zero tracking** -- there is no data on whether users click badge links, find them relevant, or eventually earn certifications.

Without tracking data, we cannot:
- Measure ROI of the badge system
- Identify which badges are most/least relevant
- Improve suggestion quality over time (D-G4 feedback loop)
- Compare specific badge links vs generic links (A/B test in Phase A)

We need to decide what interactions to track, where to store them, and how to use the data.

## Decision

**Track four interaction types in a dedicated `badge_interactions` table, with an admin analytics endpoint for aggregation.**

### Tracked Interactions

| Type | Trigger | Data Captured | Phase |
|------|---------|---------------|-------|
| `click` | User clicks a badge link (opens in new tab) | user_id, badge_id, source (skill_module/roadmap/search), timestamp | Phase A |
| `earned` | User marks a badge as "Earned" | user_id, badge_id, earned_date (stored in user_badges table) | Phase D |
| `thumbs_up` | User rates a badge suggestion positively | user_id, badge_id, source, timestamp | Phase D |
| `thumbs_down` | User rates a badge suggestion negatively | user_id, badge_id, source, timestamp | Phase D |

### Storage Design

```
badge_interactions table:
  id (UUID PK)
  user_id (FK -> user_profiles)
  badge_id (FK -> badge_catalog)
  interaction_type (click|earned|thumbs_up|thumbs_down)
  source (skill_module|roadmap|search)
  created_at (timestamp)

user_badges table:
  id (UUID PK)
  user_id (FK -> user_profiles)
  badge_id (FK -> badge_catalog)
  earned_date (timestamp)
  self_reported (bool, default true)
  created_at, updated_at
```

### Analytics Endpoint

`GET /api/badges/analytics` returns aggregated metrics:

```json
{
  "total_badges": 75,
  "total_interactions": 1234,
  "click_through_rates": {
    "overall": 0.23,
    "by_source": {
      "skill_module": 0.18,
      "roadmap": 0.31,
      "search": 0.25
    }
  },
  "top_clicked_badges": [...],
  "relevance_ratings": {
    "positive": 892,
    "negative": 134,
    "positive_rate": 0.87
  },
  "flagged_badges": [
    {
      "badge_id": "...",
      "name": "...",
      "negative_rate": 0.65,
      "total_ratings": 52
    }
  ]
}
```

### Flagging Logic (FR-5.5)

Badges with > 60% negative ratings over 50+ total ratings are flagged for review. Flagged badges are surfaced in the analytics endpoint and can be deactivated from the curated catalog.

## Consequences

### Positive

- **ROI measurement**: Click-through rates, completion rates, and relevance ratings provide concrete evidence of badge system value.
- **Continuous improvement**: User feedback identifies low-quality suggestions. Flagging mechanism automates quality control.
- **A/B testing support**: Click tracking in Phase A enables comparison of specific vs. generic badge links.
- **Personalization potential**: Future work can use interaction data to personalize badge rankings (e.g., boost badges similar to ones the user clicked before).

### Negative

- **Storage growth**: Each badge click generates a row. At 100 clicks/day, this is ~36,500 rows/year -- negligible for PostgreSQL.
- **Privacy considerations**: Tracking user interactions with specific badges could raise privacy concerns. Data is only accessible via the admin analytics endpoint, not exposed to other users.
- **Write overhead**: Every badge click triggers a POST request. This is fire-and-forget and does not block the user.

### Mitigations

- Click tracking is asynchronous and fire-and-forget (ADR-004). No impact on user experience.
- Analytics endpoint is admin-only (internal use). User-level interaction data is not exposed in any public API.
- Interaction data can be periodically aggregated and purged (e.g., keep raw data for 12 months, then aggregate to daily summaries).
- The `source` field enables filtering analytics by context (skill module vs roadmap vs search), providing actionable insights.
