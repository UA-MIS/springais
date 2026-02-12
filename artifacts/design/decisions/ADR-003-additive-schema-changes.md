# ADR-003: Additive Schema Changes with Optional Fields

> **Status**: Accepted
> **Date**: 2026-02-11
> **Decision Makers**: Architect Agent
> **References**: D-PRD-4, D-PRD-7, FR-3.2, FR-4.1

---

## Context

The badge discovery system requires changes to two existing data schemas:

1. **EYResourceSchema** (`backend/app/schemas/skill_progress.py`): Currently has `title`, `url`, `type`, `badge_available`, `description`. Badge integration needs `badge_id`, `issuer`, `image_url`, `difficulty_level`.

2. **RoadmapMilestone** (`backend/app/schemas/roadmap.py`): Currently has `resources: List[str]` (plain strings). Badge integration needs structured certification data alongside resources.

Both schemas are used extensively:
- `EYResourceSchema` data is stored in `skill_modules.ey_resources` (JSONB column) with existing generated content for many users
- `RoadmapMilestone` data is stored in `saved_roadmaps.roadmap_data` (JSONB column) with existing saved roadmaps

A breaking schema change would require migrating all existing JSONB data or cause deserialization errors.

## Decision

**All schema changes are additive: new fields are optional with default values.** Existing data continues to work without modification.

Specifically:

### EYResourceSchema Extensions

```python
class EYResourceSchema(BaseModel):
    # Existing fields (unchanged)
    title: str
    url: str
    type: str
    badge_available: bool = False
    description: str
    # New optional fields
    badge_id: Optional[str] = None
    issuer: Optional[str] = None
    image_url: Optional[str] = None
    difficulty_level: Optional[str] = None
```

### RoadmapMilestone Extensions

```python
class RoadmapMilestone(BaseModel):
    # Existing fields (unchanged)
    resources: List[str] = Field(default=[])
    # New optional field
    certifications: List[MilestoneCertification] = Field(default=[])
```

### Frontend Type Extensions

```typescript
export interface EYResource {
  // Existing fields (unchanged)
  title: string;
  url: string;
  type: string;
  badge_available: boolean;
  description: string;
  // New optional fields
  badge_id?: string;
  issuer?: string;
  image_url?: string;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}
```

## Consequences

### Positive

- **Zero downtime**: No data migration needed. Existing saved roadmaps and learning content work immediately.
- **Backward compatible**: Old API clients that don't send new fields get default values. Old data without new fields deserializes correctly.
- **Incremental adoption**: Frontend can check for new fields with optional chaining (`resource.badge_id?.`) and progressively enhance the UI.
- **No JSONB migration**: The JSONB columns in `skill_modules` and `saved_roadmaps` do not need schema-level changes. New fields are simply present or absent in the JSON.

### Negative

- **Data inconsistency**: Older records lack badge metadata. Some skill modules have rich badge data while others have generic EY resource links.
- **Optional field checks**: Frontend and backend code must handle the absence of new fields gracefully.

### Mitigations

- New content generation (Phase B+) always includes badge data when available. Over time, as users generate new content, coverage improves organically.
- Frontend components degrade gracefully: if `badge_id` is absent, the EY resource renders as before (generic link). If present, it renders with enhanced badge display.
- A background job could optionally re-generate content for existing modules, but this is not required for the initial rollout.
