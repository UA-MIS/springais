# Badge Discovery & Integration System -- Architecture Document

> **Status**: DRAFT
> **Author**: Architect Agent
> **Date**: 2026-02-11
> **Version**: 1.0
> **Upstream Artifacts**:
>   - `artifacts/planning/badge-system-prd.md`
>   - `artifacts/exploration/badge-discovery-research.md`
>   - `artifacts/exploration/current-badge-analysis.md`

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Backend Architecture](#2-backend-architecture)
3. [Frontend Architecture](#3-frontend-architecture)
4. [AI Integration](#4-ai-integration)
5. [Caching Strategy](#5-caching-strategy)
6. [Migration Strategy](#6-migration-strategy)
7. [ADR Index](#7-adr-index)

---

## 1. System Overview

### 1.1 High-Level Component Diagram

```
                            +--------------------+
                            |    Frontend (React) |
                            |                    |
                            | SkillDetailModal   |
                            | MilestoneCard      |
                            | BadgeCard (new)    |
                            | BadgeSearch (new)  |
                            | BadgeSection (new) |
                            +--------+-----------+
                                     |
                                     | HTTP REST
                                     v
                 +-------------------------------------------+
                 |          FastAPI Backend                   |
                 |                                           |
                 |  /api/badges/*       (new router)         |
                 |  /api/skills/*       (existing, extended) |
                 |  /api/roadmap/*      (existing, extended) |
                 +--------+----------+----------+-----------+
                          |          |          |
              +-----------+    +-----+-----+   +----------+
              |                |           |              |
              v                v           v              v
    +------------------+  +--------+  +--------+  +------------------+
    | BadgeDiscovery   |  | Redis  |  | Postgres|  | learning_content |
    | Service (new)    |  | Cache  |  |   DB    |  | _service (mod)   |
    +--+-------+-------+  +--------+  +--------+  +------------------+
       |       |                          |
       |       |         +----------------+--------+
       |       |         |                |        |
       |       |    badge_catalog   badge_skill  badge_
       |       |    (new table)     _mapping     interaction
       |       |                   (new table)   (new table)
       v       v                                  user_badge
  +--------+ +---------+                         (new table)
  | MS     | | Credly  |
  | Learn  | | API     |
  | API    | | (Ph C)  |
  +--------+ +---------+
```

### 1.2 Data Flow -- Badge Discovery

```
User views SkillDetailModal for "Azure"
  |
  |--> Frontend: GET /api/badges/discover?skills=azure
  |
  |--> Backend: BadgeDiscoveryService.discover_badges(["azure"])
  |       |
  |       |--> 1. Check Redis cache (key: badge:discover:azure)
  |       |       |-- HIT: return cached results
  |       |       |-- MISS: continue
  |       |
  |       |--> 2. Query badge_catalog + badge_skill_mapping
  |       |       (curated matches, confidence=1.0)
  |       |
  |       |--> 3. Query Microsoft Learn Catalog API
  |       |       (live API, skill/role filter)
  |       |
  |       |--> 4. (Phase C) Query Credly API
  |       |       (org-specific badge templates, skill filter)
  |       |
  |       |--> 5. (Phase D) AI Semantic matching fallback
  |       |       (Sentence-BERT embedding similarity)
  |       |
  |       |--> 6. Merge, deduplicate, rank by relevance_score
  |       |
  |       |--> 7. Write to Redis cache (TTL=24h)
  |       |
  |       |--> Return BadgeDiscoverResponse
  |
  |--> Frontend renders BadgeCard components
  |       - Shows badge name, issuer, difficulty, direct link
  |       - On click: POST /api/badges/interactions (FR-5.1)
```

### 1.3 Data Flow -- Roadmap Certification Enrichment

```
User generates a roadmap with include_certifications=true
  |
  |--> roadmap_service.py: _build_prompt()
  |       |
  |       |--> BadgeDiscoveryService.get_badges_for_skills(target_role_skills)
  |       |       returns top 10-20 relevant certifications
  |       |
  |       |--> Injects known cert data into ROADMAP_GENERATION_PROMPT:
  |             "KNOWN CERTIFICATIONS FOR THESE SKILLS:
  |              - Azure Solutions Architect Expert (Microsoft, $165)
  |              - AWS Solutions Architect Associate (AWS, $150)"
  |
  |--> GPT generates roadmap referencing real certs
  |
  |--> _build_response() parses milestones
  |       - For cert milestones: attach structured certifications[]
  |       - Match milestone resource strings against badge_catalog
  |
  |--> Frontend: MilestoneCard renders clickable cert cards
```

---

## 2. Backend Architecture

### 2.1 Badge Discovery Service

**File**: `backend/app/services/badge_discovery_service.py`

```python
class BadgeDiscoveryService:
    """
    Multi-source badge discovery with caching and relevance ranking.

    Matching pipeline (ADR-001):
      1. Curated catalog (confidence=1.0)
      2. Microsoft Learn API (confidence=0.7-0.9)
      3. Credly API (Phase C, confidence=0.7-0.9)
      4. Keyword matching (confidence=0.4-0.6)
      5. AI semantic matching (Phase D, confidence=0.3-0.5)
    """

    def __init__(self, db: Session):
        self.db = db
        self._ms_learn_client = MicrosoftLearnClient()
        self._credly_client: Optional[CredlyClient] = None  # Phase C

    async def discover_badges(
        self,
        skills: List[str],
        page: int = 1,
        per_page: int = 20,
    ) -> BadgeDiscoverResponse:
        """
        Discover relevant badges for given skills.

        1. Check Redis cache
        2. Query curated catalog
        3. Query external APIs
        4. Merge, deduplicate, rank
        5. Cache results
        6. Return paginated response
        """

    async def get_badge_by_id(self, badge_id: str) -> Optional[BadgeCatalogEntry]:
        """Get a single badge by internal catalog ID."""

    async def get_badges_for_skills(
        self,
        skills: List[str],
        limit: int = 20,
    ) -> List[BadgeCatalogEntry]:
        """
        Get top badges for a list of skills (used by roadmap service).
        Lightweight version of discover_badges, catalog-only, no pagination.
        """

    async def search_catalog(
        self,
        query: str,
        limit: int = 10,
    ) -> List[BadgeCatalogEntry]:
        """Search badge catalog by name (for autocomplete)."""

    async def refresh_catalog(self, source: str = "microsoft") -> int:
        """
        Refresh catalog from external source. Called by background jobs.
        Returns number of badges added/updated.
        """
```

#### Matching Engine Design

```python
class BadgeMatchingEngine:
    """
    Extensible matching engine (FR-2.4).
    Matchers are tried in priority order; results are merged and deduplicated.
    """

    def __init__(self, db: Session):
        self.matchers: List[BadgeMatcher] = [
            CuratedMatcher(db),          # Priority 1: curated mappings
            MicrosoftLearnMatcher(),      # Priority 2: MS Learn API
            # CredlyMatcher(),            # Priority 3: Credly API (Phase C)
            KeywordMatcher(db),           # Priority 4: normalized keyword match
            # SemanticMatcher(),          # Priority 5: AI embeddings (Phase D)
        ]

    async def match(self, skills: List[str]) -> List[ScoredBadge]:
        """Run all matchers, merge, deduplicate by external_id+platform, sort by relevance_score desc."""

class BadgeMatcher(ABC):
    """Abstract base for matching strategies."""

    @abstractmethod
    async def find_matches(self, skills: List[str]) -> List[ScoredBadge]:
        """Return scored badge matches for given skills."""

class CuratedMatcher(BadgeMatcher):
    """Queries badge_skill_mapping where source='curated'. Confidence=1.0."""

class MicrosoftLearnMatcher(BadgeMatcher):
    """Queries Microsoft Learn Catalog API by skill keywords. Confidence=0.7-0.9."""

class KeywordMatcher(BadgeMatcher):
    """
    Normalized keyword matching against badge_catalog.skills array.
    Case-insensitive, abbreviation expansion (e.g., "JS" -> "JavaScript").
    Confidence=0.4-0.6.
    """
```

#### External API Clients

```python
class MicrosoftLearnClient:
    """
    Client for Microsoft Learn Catalog API (free, no auth).
    Endpoint: https://learn.microsoft.com/api/catalog/
    ADR-002: First external API integration.
    """

    BASE_URL = "https://learn.microsoft.com/api/catalog/"

    async def get_certifications(
        self,
        skills: Optional[List[str]] = None,
        level: Optional[str] = None,
        role: Optional[str] = None,
    ) -> List[dict]:
        """Fetch certifications from MS Learn Catalog API."""

    async def get_full_catalog(self) -> List[dict]:
        """Fetch entire certification catalog for refresh job."""


class CredlyClient:
    """
    Client for Credly API (Phase C, requires enterprise auth).
    ADR-002: Second external API integration.
    """

    BASE_URL = "https://api.credly.com/v1/"

    def __init__(self, api_token: str, organization_id: str):
        self.api_token = api_token
        self.organization_id = organization_id

    async def get_badge_templates(
        self,
        skills: Optional[List[str]] = None,
        state: str = "active",
        page: int = 1,
        per_page: int = 50,
    ) -> List[dict]:
        """Fetch badge templates from Credly org."""

    async def get_badge_template(self, template_id: str) -> dict:
        """Fetch single badge template by ID."""
```

### 2.2 Data Model

**File**: `backend/app/models/badge.py`

All models follow existing patterns from `backend/app/models/base.py` (Base, TimestampMixin) and `skill_progress.py` (UUID primary keys, PGUUID, mapped_column).

```python
import enum

class BadgePlatform(str, enum.Enum):
    CREDLY = "credly"
    MICROSOFT = "microsoft"
    AWS = "aws"
    GOOGLE = "google"
    COMPTIA = "comptia"
    PMI = "pmi"
    OTHER = "other"

class DifficultyLevel(str, enum.Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

class MappingSource(str, enum.Enum):
    CURATED = "curated"
    API = "api"
    AI = "ai"

class InteractionType(str, enum.Enum):
    CLICK = "click"
    EARNED = "earned"
    THUMBS_UP = "thumbs_up"
    THUMBS_DOWN = "thumbs_down"

class InteractionSource(str, enum.Enum):
    SKILL_MODULE = "skill_module"
    ROADMAP = "roadmap"
    SEARCH = "search"
```

#### BadgeCatalog Table

```python
class BadgeCatalog(Base, TimestampMixin):
    """Central catalog of known badges and certifications (FR-6.1)."""
    __tablename__ = "badge_catalog"

    id: Mapped[UUID]            = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    external_id: Mapped[str]    = mapped_column(String(255), nullable=False)
    name: Mapped[str]           = mapped_column(String(500), nullable=False)
    issuer: Mapped[str]         = mapped_column(String(255), nullable=False)
    platform: Mapped[str]       = mapped_column(String(50), nullable=False)  # BadgePlatform enum value
    url: Mapped[str]            = mapped_column(String(1000), nullable=False)
    image_url: Mapped[Optional[str]]     = mapped_column(String(1000))
    skills: Mapped[list]        = mapped_column(JSONB, default=list)  # ["azure", "cloud computing"]
    difficulty_level: Mapped[Optional[str]] = mapped_column(String(20))  # DifficultyLevel enum value
    estimated_cost_usd: Mapped[Optional[float]]  = mapped_column(Float)
    estimated_hours: Mapped[Optional[int]]       = mapped_column(Integer)
    renewal_months: Mapped[Optional[int]]        = mapped_column(Integer)  # 0 = lifetime
    is_active: Mapped[bool]     = mapped_column(Boolean, default=True)
    last_refreshed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Relationships
    skill_mappings: Mapped[List["BadgeSkillMapping"]] = relationship(back_populates="badge", cascade="all, delete-orphan")
    interactions: Mapped[List["BadgeInteraction"]]     = relationship(back_populates="badge")

    __table_args__ = (
        Index("idx_badge_catalog_platform_ext", "platform", "external_id", unique=True),
        Index("idx_badge_catalog_active", "is_active"),
        Index("idx_badge_catalog_issuer", "issuer"),
    )
```

#### BadgeSkillMapping Table

```python
class BadgeSkillMapping(Base, TimestampMixin):
    """Explicit skill-to-badge mapping with confidence scores (FR-6.3)."""
    __tablename__ = "badge_skill_mapping"

    id: Mapped[UUID]          = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    badge_id: Mapped[UUID]    = mapped_column(PGUUID(as_uuid=True), ForeignKey("badge_catalog.id", ondelete="CASCADE"))
    skill_name: Mapped[str]   = mapped_column(String(255), nullable=False)  # normalized lowercase
    mapping_confidence: Mapped[float] = mapped_column(Float, default=0.5)   # 0.0-1.0
    source: Mapped[str]       = mapped_column(String(20), default="curated")  # MappingSource enum value

    badge: Mapped["BadgeCatalog"] = relationship(back_populates="skill_mappings")

    __table_args__ = (
        Index("idx_badge_skill_mapping_skill", "skill_name"),
        Index("idx_badge_skill_mapping_badge", "badge_id"),
        Index("idx_badge_skill_mapping_unique", "badge_id", "skill_name", unique=True),
    )
```

#### BadgeInteraction Table

```python
class BadgeInteraction(Base):
    """Tracks user interactions with badge suggestions (FR-5.1, FR-5.3)."""
    __tablename__ = "badge_interactions"

    id: Mapped[UUID]         = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID]    = mapped_column(PGUUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"))
    badge_id: Mapped[UUID]   = mapped_column(PGUUID(as_uuid=True), ForeignKey("badge_catalog.id", ondelete="CASCADE"))
    interaction_type: Mapped[str] = mapped_column(String(20), nullable=False)  # InteractionType enum value
    source: Mapped[str]      = mapped_column(String(20), nullable=False)       # InteractionSource enum value
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    badge: Mapped["BadgeCatalog"] = relationship(back_populates="interactions")

    __table_args__ = (
        Index("idx_badge_interaction_user", "user_id"),
        Index("idx_badge_interaction_badge", "badge_id"),
        Index("idx_badge_interaction_type", "interaction_type"),
    )
```

#### UserBadge Table

```python
class UserBadge(Base, TimestampMixin):
    """Tracks badges a user has earned (FR-5.2)."""
    __tablename__ = "user_badges"

    id: Mapped[UUID]         = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID]    = mapped_column(PGUUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"))
    badge_id: Mapped[UUID]   = mapped_column(PGUUID(as_uuid=True), ForeignKey("badge_catalog.id", ondelete="CASCADE"))
    earned_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    self_reported: Mapped[bool] = mapped_column(Boolean, default=True)

    __table_args__ = (
        Index("idx_user_badge_user", "user_id"),
        Index("idx_user_badge_unique", "user_id", "badge_id", unique=True),
    )
```

### 2.3 API Endpoints

**File**: `backend/app/routes/badges.py`

Router prefix: `/badges`, tags: `["badges"]`

All endpoints follow existing patterns from `routes/skills.py` and `routes/roadmap.py`: FastAPI router, Depends(get_current_user_from_token), Depends(get_db), Pydantic request/response models.

| Method | Path | Description | FR |
|--------|------|-------------|-----|
| GET | `/api/badges/discover` | Discover badges for skills | FR-1.1 |
| GET | `/api/badges/{badge_id}` | Get badge detail | - |
| POST | `/api/badges/interactions` | Record click/rating | FR-5.1, FR-5.3 |
| POST | `/api/badges/earned` | Mark badge as earned | FR-5.2 |
| GET | `/api/badges/analytics` | Admin analytics | FR-5.4 |
| GET | `/api/badges/catalog/search` | Search catalog (autocomplete) | FR-4.5 |

#### Endpoint Details

```
GET /api/badges/discover?skills=azure,python&page=1&per_page=20
  Auth: Required (user token)
  Response: BadgeDiscoverResponse
    {
      "badges": [BadgeResponse, ...],
      "total_count": int,
      "page": int,
      "per_page": int,
      "skills_queried": ["azure", "python"]
    }

GET /api/badges/{badge_id}
  Auth: Required
  Response: BadgeResponse
    {
      "id": "uuid",
      "name": "Azure Solutions Architect Expert",
      "issuer": "Microsoft",
      "platform": "microsoft",
      "url": "https://learn.microsoft.com/...",
      "image_url": "https://...",
      "skills": ["azure", "cloud architecture"],
      "difficulty_level": "advanced",
      "estimated_cost_usd": 165.0,
      "estimated_hours": 120,
      "renewal_months": 12,
      "relevance_score": 0.95,
      "mapping_source": "curated"
    }

POST /api/badges/interactions
  Auth: Required
  Body: BadgeInteractionRequest
    {
      "badge_id": "uuid",
      "interaction_type": "click",  // click | thumbs_up | thumbs_down
      "source": "skill_module"      // skill_module | roadmap | search
    }
  Response: { "recorded": true }

POST /api/badges/earned
  Auth: Required
  Body: BadgeEarnedRequest
    {
      "badge_id": "uuid",
      "earned_date": "2026-01-15T00:00:00Z"  // optional, defaults to now
    }
  Response: { "id": "uuid", "badge_id": "uuid", "earned_date": "..." }

GET /api/badges/analytics
  Auth: Required (admin only)
  Response: BadgeAnalyticsResponse
    {
      "total_badges": int,
      "total_interactions": int,
      "click_through_rates": { "badge_id": float, ... },
      "top_clicked_badges": [...],
      "relevance_ratings": { "positive": int, "negative": int },
      "flagged_badges": [...]  // >60% negative ratings over 50+ ratings
    }

GET /api/badges/catalog/search?q=azure&limit=10
  Auth: Required
  Response: { "results": [BadgeResponse, ...], "count": int }
```

### 2.4 Pydantic Schemas

**File**: `backend/app/schemas/badge.py`

```python
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class BadgeResponse(BaseModel):
    """Single badge in API responses."""
    id: str
    name: str
    issuer: str
    platform: str
    url: str
    image_url: Optional[str] = None
    skills: List[str] = []
    difficulty_level: Optional[str] = None
    estimated_cost_usd: Optional[float] = None
    estimated_hours: Optional[int] = None
    renewal_months: Optional[int] = None
    relevance_score: float = 0.0
    mapping_source: str = "curated"  # curated | api | ai


class BadgeDiscoverResponse(BaseModel):
    """Paginated badge discovery response."""
    badges: List[BadgeResponse] = []
    total_count: int = 0
    page: int = 1
    per_page: int = 20
    skills_queried: List[str] = []


class BadgeInteractionRequest(BaseModel):
    """Record a user interaction with a badge."""
    badge_id: str
    interaction_type: str = Field(..., pattern="^(click|thumbs_up|thumbs_down)$")
    source: str = Field(..., pattern="^(skill_module|roadmap|search)$")


class BadgeEarnedRequest(BaseModel):
    """Mark a badge as earned."""
    badge_id: str
    earned_date: Optional[datetime] = None


class BadgeAnalyticsResponse(BaseModel):
    """Admin analytics for badge suggestions."""
    total_badges: int
    total_interactions: int
    click_through_rates: dict = {}
    top_clicked_badges: List[dict] = []
    relevance_ratings: dict = {"positive": 0, "negative": 0}
    flagged_badges: List[dict] = []
```

### 2.5 Schema Extensions (Existing Files)

#### EYResourceSchema Extension (ADR-003)

**File**: `backend/app/schemas/skill_progress.py`

Add optional fields to `EYResourceSchema`:

```python
class EYResourceSchema(BaseModel):
    title: str
    url: str
    type: str
    badge_available: bool = False
    description: str
    # New optional fields (ADR-003: additive, non-breaking)
    badge_id: Optional[str] = None       # Internal badge catalog ID
    issuer: Optional[str] = None         # "Microsoft", "AWS", "EY"
    image_url: Optional[str] = None      # Badge image URL
    difficulty_level: Optional[str] = None  # beginner/intermediate/advanced/expert
```

#### RoadmapMilestone Extension (ADR-003)

**File**: `backend/app/schemas/roadmap.py`

Add optional `certifications` array to `RoadmapMilestone`:

```python
class MilestoneCertification(BaseModel):
    """Structured certification data on a roadmap milestone."""
    name: str
    provider: str
    url: str
    difficulty_level: Optional[str] = None
    estimated_cost_usd: Optional[float] = None
    estimated_hours: Optional[int] = None

class RoadmapMilestone(BaseModel):
    # ... existing fields unchanged ...
    resources: List[str] = Field(default=[], description="Recommended resources/actions")
    # New optional field (ADR-003: additive, non-breaking)
    certifications: List[MilestoneCertification] = Field(
        default=[],
        description="Structured certification data (Phase B+)"
    )
```

### 2.6 Background Jobs

Background jobs follow the existing pattern in `routes/skills.py` where `BackgroundTasks` from FastAPI is used. For scheduled jobs, we add a lightweight scheduler module.

**File**: `backend/app/jobs/badge_refresh.py`

| Job | Schedule | Source | Description |
|-----|----------|--------|-------------|
| `refresh_microsoft_catalog` | Weekly (configurable) | Microsoft Learn API | Full catalog pull, upsert into badge_catalog |
| `refresh_credly_catalog` | Daily (Phase C) | Credly API | Incremental pull of EY badge templates |
| `validate_badge_urls` | Weekly | badge_catalog | HTTP HEAD check on all active badge URLs |
| `deactivate_stale_entries` | Monthly | badge_catalog | Mark inactive if last_refreshed_at > 90 days and source != curated |

```python
async def refresh_microsoft_catalog(db: Session) -> int:
    """
    Pull full Microsoft Learn certification catalog and upsert into badge_catalog.

    1. GET https://learn.microsoft.com/api/catalog/?type=mergedCertifications
    2. For each certification:
       - Upsert into badge_catalog (platform=microsoft, external_id=uid)
       - Upsert badge_skill_mapping entries from cert.skills array
    3. Update last_refreshed_at
    4. Return count of badges added/updated
    """

async def validate_badge_urls(db: Session) -> dict:
    """
    Validate all active badge URLs via HTTP HEAD.

    1. Query badge_catalog WHERE is_active=True
    2. For each badge, send HEAD request (timeout=10s)
    3. If 4xx/5xx: mark is_active=False, log warning
    4. Return {"checked": N, "deactivated": M}
    """
```

---

## 3. Frontend Architecture

### 3.1 New Components

All new components follow existing patterns: TypeScript (.tsx), Tailwind CSS classes, consistent with the dark/light theming in MilestoneCard.tsx and SkillDetailModal.jsx.

#### `frontend/src/components/badges/BadgeCard.tsx`

Reusable badge display component used in SkillDetailModal and MilestoneCard.

```typescript
interface BadgeCardProps {
  badge: Badge;
  source: 'skill_module' | 'roadmap' | 'search';
  onEarnedToggle?: (badgeId: string) => void;
  onRate?: (badgeId: string, rating: 'thumbs_up' | 'thumbs_down') => void;
  compact?: boolean;  // Compact mode for inline lists
}

// Renders:
// - Badge name + issuer logo/name
// - Difficulty level indicator (color-coded)
// - "View Badge" link (opens external URL, tracks click via POST /api/badges/interactions)
// - "Earned" toggle button (optional, Phase D)
// - Thumbs up/down rating (optional, Phase D)
// - Verified/Suggested indicator based on mapping_source
```

#### `frontend/src/components/badges/BadgeSearch.tsx`

Searchable autocomplete for badge catalog, used in AddExtraModal.

```typescript
interface BadgeSearchProps {
  onSelect: (badge: Badge) => void;
  placeholder?: string;
}

// Behavior:
// - Input with debounced search (300ms)
// - GET /api/badges/catalog/search?q={input}&limit=10
// - Dropdown with badge name, issuer, difficulty
// - On select: calls onSelect with full badge data
```

#### `frontend/src/components/badges/BadgeSection.tsx`

Section component for SkillDetailModal showing discovered badges.

```typescript
interface BadgeSectionProps {
  skillName: string;
}

// Behavior:
// - On mount: GET /api/badges/discover?skills={skillName}
// - Shows loading skeleton while fetching (ADR-004: async, non-blocking)
// - Renders list of BadgeCard components
// - Shows "Some results may be limited" if external APIs were unavailable
// - Falls back to skill-specific Credly search link if no results
```

### 3.2 Modified Components

#### `SkillDetailModal.jsx`

**Changes**:
1. Import and render `BadgeSection` component after EY Resources section
2. Update EY resource rendering to show distinct badge icon when `badge_id` is present
3. Remove or wire up the dead `certifications` section at line 620-634:
   - Phase A: Remove the section (it only renders with mock data)
   - Phase B+: Replace with `BadgeSection` which shows real data

#### `MilestoneCard.tsx`

**Changes**:
1. For certification milestones: render `certifications[]` array as clickable `BadgeCard` components (compact mode)
2. Auto-link URLs in `resources[]` strings:
   ```typescript
   // Detect URLs in resource strings
   const urlRegex = /(https?:\/\/[^\s]+)/g;
   // Replace with <a> tags
   ```
3. Track clicks on certification links via `badgeService.recordInteraction()`

#### `ExtrasSection.tsx`

**Changes**:
1. When category === "certification", show `BadgeSearch` autocomplete in the add modal
2. Pre-fill title and description from selected badge

#### `AddExtraModal.tsx`

**Changes**:
1. Add `BadgeSearch` integration when category is "Certification"
2. On badge select: populate title with badge name, add badge URL to description

### 3.3 New Service

**File**: `frontend/src/services/badgeService.ts`

```typescript
import api from './api';

export interface Badge {
  id: string;
  name: string;
  issuer: string;
  platform: string;
  url: string;
  image_url?: string;
  skills: string[];
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimated_cost_usd?: number;
  estimated_hours?: number;
  renewal_months?: number;
  relevance_score: number;
  mapping_source: 'curated' | 'api' | 'ai';
}

export interface BadgeDiscoverResponse {
  badges: Badge[];
  total_count: number;
  page: number;
  per_page: number;
  skills_queried: string[];
}

export async function discoverBadges(
  skills: string[],
  page: number = 1,
  perPage: number = 20
): Promise<BadgeDiscoverResponse> {
  const response = await api.get('/badges/discover', {
    params: { skills: skills.join(','), page, per_page: perPage }
  });
  return response.data;
}

export async function getBadge(badgeId: string): Promise<Badge> {
  const response = await api.get(`/badges/${badgeId}`);
  return response.data;
}

export async function recordInteraction(
  badgeId: string,
  interactionType: 'click' | 'thumbs_up' | 'thumbs_down',
  source: 'skill_module' | 'roadmap' | 'search'
): Promise<void> {
  await api.post('/badges/interactions', {
    badge_id: badgeId,
    interaction_type: interactionType,
    source,
  });
}

export async function markBadgeEarned(
  badgeId: string,
  earnedDate?: string
): Promise<{ id: string; badge_id: string; earned_date: string }> {
  const response = await api.post('/badges/earned', {
    badge_id: badgeId,
    earned_date: earnedDate,
  });
  return response.data;
}

export async function searchCatalog(
  query: string,
  limit: number = 10
): Promise<{ results: Badge[]; count: number }> {
  const response = await api.get('/badges/catalog/search', {
    params: { q: query, limit }
  });
  return response.data;
}
```

### 3.4 Frontend Type Extensions

**File**: `frontend/src/services/skillProgressService.ts`

Extend `EYResource` interface:

```typescript
export interface EYResource {
  title: string;
  url: string;
  type: string;
  badge_available: boolean;
  description: string;
  // New optional fields (Phase B+)
  badge_id?: string;
  issuer?: string;
  image_url?: string;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}
```

**File**: `frontend/src/services/roadmapService.ts`

Extend `RoadmapMilestone` interface:

```typescript
export interface MilestoneCertification {
  name: string;
  provider: string;
  url: string;
  difficulty_level?: string;
  estimated_cost_usd?: number;
  estimated_hours?: number;
}

export interface RoadmapMilestone {
  // ... existing fields unchanged ...
  resources: string[];
  // New optional field (Phase B+)
  certifications?: MilestoneCertification[];
}
```

---

## 4. AI Integration

### 4.1 Learning Content Service Enhancement

**File**: `backend/app/services/learning_content_service.py`

#### Phase A: Quick Wins

Replace static `EY_RESOURCES["badges"]` with skill-specific URLs:

```python
# Before (generic):
EY_RESOURCES = {
    "badges": "https://www.credly.com/organizations/ey/badges",
}

# After (skill-specific in fallback):
def _generate_fallback_content(skill_name, module_title, skill_type):
    skill_encoded = skill_name.replace(" ", "+").replace("#", "%23")
    ey_resources = [
        {
            "title": f"EY Badges for {skill_name}",
            "url": f"https://www.credly.com/organizations/ey/badges?search={skill_encoded}",
            "type": "badge",
            "badge_available": True,
            "description": f"Search EY badges related to {skill_name}"
        },
        # ... Virtual Academy unchanged ...
    ]
```

#### Phase B: Badge-Aware Content Generation

Update `LEARNING_CONTENT_PROMPT` to inject known badges:

```python
# In generate_module_learning_content():
# 1. Query BadgeDiscoveryService for this skill
# 2. Inject results into prompt:

BADGE_INJECTION = """
## VERIFIED BADGES AND CERTIFICATIONS FOR THIS SKILL:
{badge_list}

IMPORTANT: When suggesting EY resources or certifications, prefer the VERIFIED badges listed above.
For each verified badge, use the EXACT URL provided. Do NOT invent badge names or URLs.
Mark verified badges with badge_id so the frontend can display them with verification indicators.
"""
```

### 4.2 Roadmap Service Enhancement

**File**: `backend/app/services/roadmap_service.py`

Update `_build_prompt()` to inject known certifications:

```python
# In _build_prompt():
# 1. Collect all required_skills from target roles
# 2. Query BadgeDiscoveryService.get_badges_for_skills(all_skills)
# 3. Inject into prompt:

CERT_INJECTION = """
## KNOWN CERTIFICATIONS FOR TARGET ROLE SKILLS:
{cert_list}

When creating certification milestones, reference these REAL certifications with their exact names and URLs.
Include the certification name, provider, URL, cost, and difficulty level in the milestone resources.
Format certification resources as: "CERT: {name} | {provider} | {url} | ${cost} | {difficulty}"
"""
```

Update `_build_response()` to parse structured cert data:

```python
# In _build_response(), when parsing milestones:
# If category == "certification" and resources contain "CERT:" prefix:
#   Parse structured cert data into MilestoneCertification objects
#   Populate milestone.certifications[] array
```

### 4.3 Phase D: Sentence-BERT Semantic Matching

For skills that lack curated mappings and don't match API keywords, use embedding similarity:

```
1. Pre-compute embeddings for all badge_catalog entries:
   - Combine name + description + skills into a single text
   - Generate embedding using Sentence-BERT (all-MiniLM-L6-v2)
   - Store in badge_catalog.embedding column (pgvector)

2. At query time:
   - Generate embedding for user's skill name
   - Compute cosine similarity against all badge embeddings
   - Return badges with similarity > 0.3 threshold
   - Confidence = similarity_score * 0.5 (capped at 0.5)
```

This uses the same embedding infrastructure already present in `backend/app/models/skill_embedding.py`.

---

## 5. Caching Strategy

### 5.1 Redis Key Patterns and TTLs

| Key Pattern | TTL | Description |
|-------------|-----|-------------|
| `badge:discover:{skills_hash}` | 24 hours | Discovery results for a skill set |
| `badge:catalog:{badge_id}` | 7 days | Individual badge detail |
| `badge:catalog:search:{query}` | 1 hour | Search results |
| `badge:ms_learn:catalog` | 7 days | Full MS Learn catalog snapshot |
| `badge:credly:catalog:{org}` | 1 hour | Credly org badge templates |
| `badge:skills_map:{skill}` | 24 hours | Curated mappings for a skill |

Key format details:
- `skills_hash` = MD5 of sorted, lowercased, comma-joined skill names
- All values stored as JSON-serialized strings

### 5.2 Cache Invalidation

| Event | Invalidation |
|-------|--------------|
| Catalog refresh job completes | Delete `badge:discover:*`, `badge:catalog:*`, `badge:skills_map:*` |
| Manual catalog update (admin) | Delete affected `badge:catalog:{id}` and `badge:skills_map:{skill}` |
| Badge deactivated | Delete `badge:catalog:{id}` and all `badge:discover:*` |

### 5.3 Cache Warm-up

On application startup or post-refresh:
1. Pre-compute discovery results for top 50 skills (from user_skills frequency)
2. Load all curated badge_skill_mapping entries into Redis
3. Cache full Microsoft Learn catalog snapshot

### 5.4 Fallback Behavior

When Redis is unavailable (NFR-2):
- Query PostgreSQL directly
- Accept higher latency (200ms -> 500-1000ms)
- Log warning, do not fail the request

---

## 6. Migration Strategy

### 6.1 Alembic Migration

Create a single migration for all four new tables:

```python
# alembic/versions/xxxx_add_badge_tables.py

def upgrade():
    # 1. badge_catalog table
    op.create_table('badge_catalog', ...)

    # 2. badge_skill_mapping table
    op.create_table('badge_skill_mapping', ...)

    # 3. badge_interactions table
    op.create_table('badge_interactions', ...)

    # 4. user_badges table
    op.create_table('user_badges', ...)

def downgrade():
    op.drop_table('user_badges')
    op.drop_table('badge_interactions')
    op.drop_table('badge_skill_mapping')
    op.drop_table('badge_catalog')
```

### 6.2 Seed Data Strategy

**File**: `backend/app/data/badge_seed.py`

Seed with 50+ curated certifications across major platforms:

| Platform | Count | Examples |
|----------|-------|---------|
| Microsoft/Azure | 20+ | Azure Solutions Architect Expert, Azure Developer Associate, Azure AI Engineer, etc. |
| AWS | 12 | Solutions Architect (Assoc/Pro), Developer Associate, SysOps Associate, Cloud Practitioner, etc. |
| Google Cloud | 10 | Associate Cloud Engineer, Professional Cloud Architect, Professional Data Engineer, etc. |
| CompTIA | 15 | A+, Security+, Network+, Cloud+, Data+, Linux+, etc. |
| PMI | 7 | PMP, CAPM, PMI-ACP, PMI-PBA, PgMP, PfMP, PMI-RMP |
| EY/Credly | 5+ | EY Strategy Learning, EY Data Strategy, etc. (known vanity slugs) |

Each seed entry includes:
- `external_id`, `name`, `issuer`, `platform`, `url`
- `skills` array (for keyword matching)
- `difficulty_level`, `estimated_cost_usd`, `estimated_hours`, `renewal_months`
- Badge-skill mappings with `confidence=1.0`, `source=curated`

Seed script runs as a CLI command or Alembic data migration:
```bash
python -m backend.app.data.badge_seed
```

### 6.3 Backward Compatibility Plan (ADR-003)

All changes to existing schemas are additive:

1. **EYResourceSchema**: New fields (`badge_id`, `issuer`, `image_url`, `difficulty_level`) are Optional with `None` defaults. Existing data continues to work.

2. **RoadmapMilestone**: New `certifications` field defaults to `[]`. Existing roadmap JSON in `saved_roadmaps.roadmap_data` is unaffected since the field is optional.

3. **Frontend interfaces**: New optional properties added to `EYResource` and `RoadmapMilestone` TypeScript interfaces. Existing component rendering is unchanged for data without the new fields.

4. **No existing data migration needed**: Old records function identically. New fields are populated only for newly generated content.

---

## 7. ADR Index

| ADR | Title | File |
|-----|-------|------|
| ADR-001 | Curated Catalog as Primary Source | `artifacts/design/decisions/ADR-001-curated-catalog-primary.md` |
| ADR-002 | Microsoft Learn API First, Credly API Second | `artifacts/design/decisions/ADR-002-microsoft-learn-first.md` |
| ADR-003 | Additive Schema Changes with Optional Fields | `artifacts/design/decisions/ADR-003-additive-schema-changes.md` |
| ADR-004 | Async Badge Loading (Non-Blocking UI) | `artifacts/design/decisions/ADR-004-async-badge-loading.md` |
| ADR-005 | Badge Interaction Tracking for ROI Measurement | `artifacts/design/decisions/ADR-005-interaction-tracking.md` |

---

## Appendix A: Phase-to-File Mapping

### Phase A: Quick Wins + Curated Catalog

| File | Action | FR |
|------|--------|-----|
| `backend/app/services/learning_content_service.py` | Replace generic URLs with skill-specific | FR-7.1, FR-7.2 |
| `backend/app/models/badge.py` | Create BadgeCatalog, BadgeSkillMapping, BadgeInteraction, UserBadge models | FR-6.1, FR-6.3 |
| `backend/app/data/badge_seed.py` | Seed 50+ curated entries | FR-6.2 |
| `backend/app/schemas/badge.py` | Create badge schemas | - |
| `backend/app/routes/badges.py` | Create POST /interactions endpoint | FR-5.1 |
| `frontend/src/components/roadmap/MilestoneCard.tsx` | Auto-link URLs in resources | FR-7.3 |
| `frontend/src/components/skills/SkillDetailModal.jsx` | Remove dead certifications section | FR-7.4 |
| `frontend/src/components/skills/SkillDetailModal.jsx` | Badge icon for badge-type resources | FR-7.5 |
| Alembic migration | Create 4 new tables | - |

### Phase B: MS Learn API + Discovery Service

| File | Action | FR |
|------|--------|-----|
| `backend/app/services/badge_discovery_service.py` | Full discovery service with matching engine | FR-1, FR-2 |
| `backend/app/services/microsoft_learn_client.py` | MS Learn API client | FR-1.2 |
| `backend/app/routes/badges.py` | GET /discover, GET /{id}, GET /catalog/search endpoints | FR-1.1, FR-4.5 |
| `backend/app/schemas/skill_progress.py` | Extend EYResourceSchema | FR-3.2 |
| `backend/app/schemas/roadmap.py` | Extend RoadmapMilestone with certifications | FR-4.1 |
| `backend/app/services/learning_content_service.py` | Inject verified badges into AI prompt | FR-3.3 |
| `backend/app/services/roadmap_service.py` | Inject known certs into roadmap prompt | FR-4.2 |
| `backend/app/jobs/badge_refresh.py` | Weekly MS Learn catalog refresh | FR-6.4 |
| `frontend/src/services/badgeService.ts` | Badge API client | - |
| `frontend/src/components/badges/BadgeCard.tsx` | Badge display component | FR-3.1 |
| `frontend/src/components/badges/BadgeSection.tsx` | Badge section for skill modals | FR-3.1 |
| `frontend/src/components/roadmap/MilestoneCard.tsx` | Structured cert rendering | FR-4.3 |
| `frontend/src/services/skillProgressService.ts` | Extend EYResource interface | FR-3.2 |
| `frontend/src/services/roadmapService.ts` | Extend RoadmapMilestone interface | FR-4.1 |

### Phase C: Credly API

| File | Action | FR |
|------|--------|-----|
| `backend/app/services/credly_client.py` | Credly API client | FR-1.2 |
| `backend/app/services/badge_discovery_service.py` | Add CredlyMatcher | FR-2 |
| `backend/app/jobs/badge_refresh.py` | Daily Credly catalog refresh | FR-6.5 |
| `frontend/src/components/badges/BadgeSearch.tsx` | Searchable autocomplete | FR-4.5 |
| `frontend/src/components/roadmap/AddExtraModal.tsx` | Badge autocomplete integration | FR-4.5 |

### Phase D: AI Matching + Analytics

| File | Action | FR |
|------|--------|-----|
| `backend/app/services/badge_discovery_service.py` | Add SemanticMatcher | FR-2.4 |
| `backend/app/routes/badges.py` | POST /earned, GET /analytics endpoints | FR-5.2, FR-5.4 |
| `frontend/src/components/badges/BadgeCard.tsx` | Earned toggle, relevance rating | FR-5.2, FR-5.3 |
| `backend/app/jobs/badge_refresh.py` | Monthly confidence recalculation | FR-5.5 |
