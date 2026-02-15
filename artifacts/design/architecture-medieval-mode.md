# Medieval Mode Economy & Progression System -- Architecture Document

> **Status**: DRAFT -- Awaiting Human Approval
> **Author**: Architect Agent
> **Date**: 2026-02-11
> **Version**: 1.0
> **Upstream Artifacts**:
>   - `artifacts/exploration/codebase-analysis.md`
>   - `artifacts/planning/prd-medieval-mode.md`

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Database Schema Design](#2-database-schema-design)
3. [API Endpoint Design](#3-api-endpoint-design)
4. [Service Layer Architecture](#4-service-layer-architecture)
5. [XP Calculation Engine](#5-xp-calculation-engine)
6. [Event System Architecture](#6-event-system-architecture)
7. [Frontend Architecture Changes](#7-frontend-architecture-changes)
8. [Redis Usage](#8-redis-usage)
9. [Migration Plan](#9-migration-plan)
10. [ADR Index](#10-adr-index)

---

## 1. System Overview

### 1.1 Architecture Diagram

```
+------------------+       +-------------------+       +-----------+
|   React Frontend |<----->|   FastAPI Backend  |<----->| PostgreSQL|
| (TypeScript)     |  JWT  |   (Python 3.11)   |  SQL  |    16     |
|                  |       |                    |       +-----------+
| AdventureModeCtx |       | Routes:            |
| -> React Query   |       |   /api/progression |       +-----------+
| -> API Client    |       |   /api/achievements|<----->|   Redis 7 |
|                  |       |   /api/store       |       | (Cache)   |
| New Pages:       |       |   /api/quests      |       +-----------+
|   StorePage      |       |                    |
|   QuestsPage     |       | Services:          |
+------------------+       |   progression_svc  |
                           |   achievement_svc  |
                           |   reward_hook_svc  |
                           |   store_svc        |
                           |   quest_svc        |
                           |   streak_svc       |
                           +-------------------+
```

### 1.2 Key Design Principles

1. **Server Authority**: The server is the single source of truth for all gamification state. The client never directly mutates XP, Coins, level, or inventory.
2. **Atomic Mutations**: All XP/Coin changes happen within a single database transaction with corresponding event/transaction log entries.
3. **Idempotent Rewards**: Every reward-triggering action uses an `event_key` to prevent duplicate rewards.
4. **Fire-and-Forget Hooks**: Gamification event emission never blocks the primary action. Failures are logged, not propagated.
5. **Separation of Tracks**: XP (learning) and Coins (engagement) serve different purposes and are never interconverted except through designed bridges (side quests, level-ups).

### 1.3 Technology Decisions

| Concern | Decision | ADR |
|---------|----------|-----|
| Schema migrations | Alembic (already in requirements.txt) | ADR-MM-001 |
| Progression caching | Redis with fallback to direct DB | ADR-MM-002 |
| Achievement evaluation | In-process, synchronous after event insert | ADR-MM-003 |
| Coin balance integrity | SELECT FOR UPDATE + CHECK constraint | ADR-MM-004 |
| XP curve | Linear-step (not exponential) | ADR-MM-005 |
| localStorage removal | No migration; clean start for all users | ADR-MM-006 |

---

## 2. Database Schema Design

### 2.1 Entity Relationship Overview

```
user_profiles (existing)
    |
    |-- 1:1 -- user_progression
    |               |
    |               |-- 1:N -- gamification_events
    |               |-- 1:N -- coin_transactions
    |
    |-- 1:N -- user_achievements --> achievement_catalog
    |
    |-- 1:N -- user_inventory --> cosmetic_catalog
    |-- 1:N -- user_equipped_items --> cosmetic_catalog
    |
    |-- 1:N -- user_quest_progress --> side_quest_catalog --> cosmetic_catalog
    |
    |-- 1:N -- user_page_visits
```

### 2.2 Table: `user_progression`

Stores per-user gamification state. One row per user. Replaces all localStorage gamification data.

**References**: FR-001, D-MM-1

```python
# backend/app/models/progression.py

class UserProgression(Base, TimestampMixin):
    __tablename__ = "user_progression"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True,
        default=uuid4, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        unique=True, nullable=False,
    )
    xp_total: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    level: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    coin_balance: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    login_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_login_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    adventure_mode_enabled: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    # Relationships
    user: Mapped["UserProfile"] = relationship("UserProfile", backref="progression")
    events: Mapped[list["GamificationEvent"]] = relationship(
        back_populates="progression", cascade="all, delete-orphan"
    )
    coin_txns: Mapped[list["CoinTransaction"]] = relationship(
        back_populates="progression", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_user_progression_user_id", "user_id", unique=True),
        CheckConstraint("coin_balance >= 0", name="ck_coin_balance_non_negative"),
        CheckConstraint("xp_total >= 0", name="ck_xp_total_non_negative"),
        CheckConstraint("level >= 1", name="ck_level_positive"),
    )
```

**DDL equivalent**:
```sql
CREATE TABLE user_progression (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
    xp_total INTEGER NOT NULL DEFAULT 0 CHECK (xp_total >= 0),
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
    coin_balance INTEGER NOT NULL DEFAULT 0 CHECK (coin_balance >= 0),
    login_streak INTEGER NOT NULL DEFAULT 0,
    last_login_date DATE,
    adventure_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_user_progression_user_id ON user_progression(user_id);
```

### 2.3 Table: `gamification_events`

Append-only event log. Records every action that triggers a reward. Supports idempotency via `event_key`.

**References**: FR-002, D-MM-2

```python
class GamificationEvent(Base):
    __tablename__ = "gamification_events"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True,
        default=uuid4, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user_progression.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    event_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    xp_awarded: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    coins_awarded: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    metadata: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    progression: Mapped["UserProgression"] = relationship(
        back_populates="events", foreign_keys=[user_id]
    )

    __table_args__ = (
        Index("idx_gamification_events_user_id", "user_id"),
        Index("idx_gamification_events_type", "event_type"),
        Index("idx_gamification_events_created", "created_at"),
        Index(
            "uq_gamification_events_user_key",
            "user_id", "event_key",
            unique=True,
            postgresql_where=text("event_key IS NOT NULL"),
        ),
    )
```

**DDL equivalent**:
```sql
CREATE TABLE gamification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_progression(user_id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_key VARCHAR(255),
    xp_awarded INTEGER NOT NULL DEFAULT 0,
    coins_awarded INTEGER NOT NULL DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gamification_events_user_id ON gamification_events(user_id);
CREATE INDEX idx_gamification_events_type ON gamification_events(event_type);
CREATE INDEX idx_gamification_events_created ON gamification_events(created_at);
CREATE UNIQUE INDEX uq_gamification_events_user_key
    ON gamification_events(user_id, event_key)
    WHERE event_key IS NOT NULL;
```

**Key Design Notes**:
- The partial unique index on `(user_id, event_key) WHERE event_key IS NOT NULL` enforces idempotency for one-time events while allowing repeatable events (null `event_key`).
- FK references `user_progression.user_id` (not `user_profiles.id`) to keep the gamification domain self-contained.

### 2.4 Table: `coin_transactions`

Transaction ledger for all Coin movements. Every credit and debit is recorded.

**References**: FR-003, D-MM-3

```python
class CoinTransaction(Base):
    __tablename__ = "coin_transactions"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True,
        default=uuid4, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user_progression.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    balance_after: Mapped[int] = mapped_column(Integer, nullable=False)
    transaction_type: Mapped[str] = mapped_column(String(20), nullable=False)
    source: Mapped[str] = mapped_column(String(100), nullable=False)
    reference_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    progression: Mapped["UserProgression"] = relationship(
        back_populates="coin_txns", foreign_keys=[user_id]
    )

    __table_args__ = (
        Index("idx_coin_transactions_user_id", "user_id"),
        Index("idx_coin_transactions_created", "created_at"),
        CheckConstraint("balance_after >= 0", name="ck_balance_after_non_negative"),
        CheckConstraint(
            "transaction_type IN ('earned', 'spent', 'refund')",
            name="ck_transaction_type_valid",
        ),
    )
```

### 2.5 Table: `achievement_catalog`

Server-side achievement definitions. Seeded with data; new achievements added via seed scripts.

**References**: FR-011, D-MM-6

```python
# backend/app/models/achievement.py

class AchievementCatalog(Base):
    __tablename__ = "achievement_catalog"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    icon: Mapped[str] = mapped_column(String(100), default="trophy", nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    xp_reward: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    coin_reward: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    trigger_type: Mapped[str] = mapped_column(String(50), nullable=False)
    trigger_config: Mapped[dict] = mapped_column(JSONB, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    __table_args__ = (
        Index("idx_achievement_catalog_category", "category"),
        Index("idx_achievement_catalog_active", "is_active"),
        CheckConstraint(
            "category IN ('onboarding', 'learning', 'engagement', 'exploration', 'mastery')",
            name="ck_achievement_category_valid",
        ),
        CheckConstraint(
            "trigger_type IN ('event_based', 'threshold_based', 'manual')",
            name="ck_trigger_type_valid",
        ),
    )
```

**`trigger_config` Schema**:

For `event_based` triggers:
```json
{
  "event_type": "module_completed",
  "count": 1
}
```
Meaning: triggers when the user has `count` events of type `event_type`.

For `threshold_based` triggers:
```json
{
  "field": "login_streak",
  "threshold": 7
}
```
Meaning: triggers when `user_progression.{field} >= threshold`.

For `manual` triggers:
```json
{
  "action": "enable_adventure_mode"
}
```
Meaning: triggers only via explicit code call in a specific endpoint.

### 2.6 Table: `user_achievements`

Tracks which achievements each user has unlocked.

**References**: FR-013

```python
class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True,
        default=uuid4, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    achievement_id: Mapped[str] = mapped_column(
        String(100),
        ForeignKey("achievement_catalog.id", ondelete="CASCADE"),
        nullable=False,
    )
    unlocked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    achievement: Mapped["AchievementCatalog"] = relationship("AchievementCatalog")

    __table_args__ = (
        Index("uq_user_achievement", "user_id", "achievement_id", unique=True),
        Index("idx_user_achievements_user_id", "user_id"),
    )
```

### 2.7 Table: `cosmetic_catalog`

Store item definitions. Seeded with data.

**References**: FR-014, D-MM-7

```python
# backend/app/models/cosmetic.py

class CosmeticCatalog(Base):
    __tablename__ = "cosmetic_catalog"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True,
        default=uuid4, server_default=text("gen_random_uuid()")
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    rarity: Mapped[str] = mapped_column(String(20), nullable=False)
    coin_price: Mapped[int] = mapped_column(Integer, nullable=False)
    level_required: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_quest_exclusive: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        Index("idx_cosmetic_catalog_category", "category"),
        Index("idx_cosmetic_catalog_rarity", "rarity"),
        Index("idx_cosmetic_catalog_active", "is_active"),
        CheckConstraint(
            "category IN ('armor', 'cape', 'jewelry', 'boots', 'hairstyle', "
            "'color_palette', 'banner', 'emblem')",
            name="ck_cosmetic_category_valid",
        ),
        CheckConstraint(
            "rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')",
            name="ck_cosmetic_rarity_valid",
        ),
        CheckConstraint("coin_price >= 0", name="ck_cosmetic_price_non_negative"),
    )
```

### 2.8 Table: `user_inventory`

Per-user owned cosmetics.

**References**: FR-015

```python
class UserInventory(Base):
    __tablename__ = "user_inventory"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True,
        default=uuid4, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    cosmetic_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("cosmetic_catalog.id", ondelete="CASCADE"),
        nullable=False,
    )
    source: Mapped[str] = mapped_column(String(50), nullable=False)
    acquired_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    cosmetic: Mapped["CosmeticCatalog"] = relationship("CosmeticCatalog")

    __table_args__ = (
        Index("uq_user_inventory", "user_id", "cosmetic_id", unique=True),
        Index("idx_user_inventory_user_id", "user_id"),
        CheckConstraint(
            "source IN ('store_purchase', 'quest_reward', 'achievement_reward')",
            name="ck_inventory_source_valid",
        ),
    )
```

### 2.9 Table: `user_equipped_items`

Tracks which cosmetic is equipped in each slot. One item per slot per user.

**References**: FR-015

```python
class UserEquippedItem(Base):
    __tablename__ = "user_equipped_items"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True,
        default=uuid4, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    slot: Mapped[str] = mapped_column(String(50), nullable=False)
    cosmetic_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("cosmetic_catalog.id", ondelete="CASCADE"),
        nullable=False,
    )

    cosmetic: Mapped["CosmeticCatalog"] = relationship("CosmeticCatalog")

    __table_args__ = (
        Index("uq_user_equipped_slot", "user_id", "slot", unique=True),
        Index("idx_user_equipped_user_id", "user_id"),
        CheckConstraint(
            "slot IN ('armor', 'cape', 'jewelry', 'boots', 'hairstyle', "
            "'color_palette', 'banner', 'emblem')",
            name="ck_equipped_slot_valid",
        ),
    )
```

### 2.10 Table: `side_quest_catalog`

Quest definitions with level requirements and rewards.

**References**: FR-018, D-MM-9

```python
# backend/app/models/quest.py

class SideQuestCatalog(Base):
    __tablename__ = "side_quest_catalog"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True,
        default=uuid4, server_default=text("gen_random_uuid()")
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(1000), nullable=False)
    level_required: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    xp_reward: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    coin_reward: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    cosmetic_reward_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("cosmetic_catalog.id", ondelete="SET NULL"),
        nullable=True,
    )
    requirements: Mapped[list] = mapped_column(JSONB, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    cosmetic_reward: Mapped["CosmeticCatalog | None"] = relationship("CosmeticCatalog")

    __table_args__ = (
        Index("idx_side_quest_catalog_level", "level_required"),
        Index("idx_side_quest_catalog_active", "is_active"),
    )
```

**`requirements` Schema**:
```json
[
  {
    "type": "module_completed",
    "target_id": null,
    "count": 2,
    "description": "Complete 2 analytics modules"
  },
  {
    "type": "assessment_passed",
    "target_id": "data-challenge-01",
    "count": 1,
    "description": "Pass the data challenge"
  }
]
```

### 2.11 Table: `user_quest_progress`

Tracks user progress toward side quest requirements.

**References**: FR-019

```python
class UserQuestProgress(Base):
    __tablename__ = "user_quest_progress"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True,
        default=uuid4, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    quest_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("side_quest_catalog.id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(20), default="available", nullable=False
    )
    progress: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    quest: Mapped["SideQuestCatalog"] = relationship("SideQuestCatalog")

    __table_args__ = (
        Index("uq_user_quest", "user_id", "quest_id", unique=True),
        Index("idx_user_quest_user_id", "user_id"),
        Index("idx_user_quest_status", "status"),
        CheckConstraint(
            "status IN ('available', 'in_progress', 'completed')",
            name="ck_quest_status_valid",
        ),
    )
```

**`progress` Schema**:
```json
{
  "requirements": [
    { "index": 0, "completed": true, "current_count": 2, "required_count": 2 },
    { "index": 1, "completed": false, "current_count": 0, "required_count": 1 }
  ]
}
```

### 2.12 Table: `user_page_visits`

Tracks page visits for the "explorer" achievement and engagement metrics.

**References**: FR-021

```python
# backend/app/models/page_visit.py

class UserPageVisit(Base):
    __tablename__ = "user_page_visits"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True,
        default=uuid4, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    page: Mapped[str] = mapped_column(String(100), nullable=False)
    first_visited_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    visit_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    __table_args__ = (
        Index("uq_user_page_visit", "user_id", "page", unique=True),
        Index("idx_user_page_visits_user_id", "user_id"),
    )
```

### 2.13 Complete Table Summary

| Table | Row Count Estimate | Growth Pattern | Indexes |
|-------|-------------------|----------------|---------|
| `user_progression` | 1 per user | Slow | user_id (unique) |
| `gamification_events` | ~50-200 per user/month | Unbounded, append-only | user_id, event_type, created_at, (user_id, event_key) partial unique |
| `coin_transactions` | ~10-50 per user/month | Unbounded, append-only | user_id, created_at |
| `achievement_catalog` | ~25 rows (seed) | Static | category, is_active |
| `user_achievements` | ~5-15 per user | Slow | (user_id, achievement_id) unique |
| `cosmetic_catalog` | ~30-50 rows (seed) | Static | category, rarity, is_active |
| `user_inventory` | ~5-20 per user | Slow | (user_id, cosmetic_id) unique |
| `user_equipped_items` | 0-8 per user | Slow | (user_id, slot) unique |
| `side_quest_catalog` | ~5-10 rows (seed) | Static | level_required, is_active |
| `user_quest_progress` | ~2-5 per user | Slow | (user_id, quest_id) unique |
| `user_page_visits` | ~5-8 per user | Slow | (user_id, page) unique |

### 2.14 Alembic Migration Strategy

**References**: D-MM-11

1. Initialize Alembic in the backend root: `alembic init alembic`
2. Configure `alembic/env.py` to use the same `DATABASE_URL` and `Base.metadata` from the project.
3. Create the initial migration with all 11 new tables.
4. Seed data is applied in the same migration using `op.bulk_insert()` for:
   - `achievement_catalog` (24 rows)
   - `cosmetic_catalog` (30+ rows)
   - `side_quest_catalog` (5 rows)
5. The existing `Base.metadata.create_all()` call in `main.py` continues to work for existing tables. New gamification tables are managed exclusively by Alembic.
6. On deployment: run `alembic upgrade head` before starting the FastAPI process.

---

## 3. API Endpoint Design

All endpoints require JWT authentication via the existing `get_current_user_from_token` dependency unless otherwise noted. All endpoints use the `/api` prefix (applied by `app.include_router(router, prefix="/api")`).

### 3.1 Progression Endpoints

**Router**: `backend/app/routes/progression.py`
**Prefix**: `/api/progression`
**Tags**: `["progression"]`

---

#### `GET /api/progression`

Returns the authenticated user's full progression state.

**Response** (200):
```json
{
  "xp_total": 1250,
  "level": 6,
  "title": "Knight",
  "coin_balance": 430,
  "login_streak": 5,
  "last_login_date": "2026-02-10",
  "adventure_mode_enabled": true,
  "current_level_xp": 250,
  "xp_to_next_level": 350,
  "feature_unlocks": {
    "side_quests": true,
    "guild_rank": true,
    "advanced_arena": false,
    "special_title": false
  },
  "equipped_items": {
    "armor": { "id": "uuid", "name": "Bronze Armor", "category": "armor", "rarity": "common" },
    "cape": null,
    "jewelry": null,
    "boots": null,
    "hairstyle": null,
    "color_palette": null,
    "banner": null,
    "emblem": null
  },
  "unlocked_achievements_count": 5,
  "active_quests_count": 2
}
```

**Response** (404 -- no progression row):
```json
{ "detail": "Progression not found. Call POST /api/progression/login to initialize." }
```

**Performance target**: < 100ms (p95). Uses Redis cache.

---

#### `POST /api/progression/toggle-adventure-mode`

Toggles `adventure_mode_enabled` and returns the new state.

**Response** (200):
```json
{
  "adventure_mode_enabled": true
}
```

---

#### `POST /api/progression/login`

Records a daily login. Awards daily login Coins, updates streak. Idempotent per calendar day.

**Response** (200):
```json
{
  "login_streak": 5,
  "coins_awarded": 10,
  "streak_bonus": 0,
  "total_coins_awarded": 10,
  "achievements_unlocked": [],
  "is_new_day": true
}
```

If called again on the same day:
```json
{
  "login_streak": 5,
  "coins_awarded": 0,
  "streak_bonus": 0,
  "total_coins_awarded": 0,
  "achievements_unlocked": [],
  "is_new_day": false
}
```

---

#### `GET /api/progression/history`

Returns paginated event or transaction history.

**Query params**:
- `type`: `"event"` | `"transaction"` (required)
- `limit`: int, default 50, max 100
- `offset`: int, default 0

**Response** (200):
```json
{
  "items": [
    {
      "id": "uuid",
      "event_type": "module_completed",
      "xp_awarded": 50,
      "coins_awarded": 0,
      "created_at": "2026-02-10T14:30:00Z"
    }
  ],
  "total": 142,
  "limit": 50,
  "offset": 0
}
```

---

#### `POST /api/progression/visit`

Records a page visit. Used for the "explorer" achievement.

**Request**:
```json
{ "page": "/matches" }
```

**Response** (200):
```json
{
  "page": "/matches",
  "visit_count": 3,
  "achievements_unlocked": []
}
```

---

### 3.2 Achievement Endpoints

**Router**: `backend/app/routes/achievements.py`
**Prefix**: `/api/achievements`
**Tags**: `["achievements"]`

---

#### `GET /api/achievements/catalog`

Returns all active achievements with unlock status for the current user.

**Response** (200):
```json
{
  "achievements": [
    {
      "id": "first_login",
      "name": "The Journey Begins",
      "description": "Enable adventure mode",
      "icon": "scroll",
      "category": "onboarding",
      "xp_reward": 100,
      "coin_reward": 50,
      "is_unlocked": true,
      "unlocked_at": "2026-02-01T10:00:00Z"
    },
    {
      "id": "first_match",
      "name": "Seeker of Destiny",
      "description": "View match results",
      "icon": "compass",
      "category": "exploration",
      "xp_reward": 150,
      "coin_reward": 75,
      "is_unlocked": false,
      "unlocked_at": null
    }
  ]
}
```

---

#### `GET /api/achievements`

Returns only the user's unlocked achievements with timestamps.

**Response** (200):
```json
{
  "achievements": [
    {
      "id": "first_login",
      "name": "The Journey Begins",
      "unlocked_at": "2026-02-01T10:00:00Z",
      "xp_reward": 100,
      "coin_reward": 50
    }
  ],
  "count": 5
}
```

---

### 3.3 Store Endpoints

**Router**: `backend/app/routes/store.py`
**Prefix**: `/api/store`
**Tags**: `["store"]`

---

#### `GET /api/store/catalog`

Returns paginated store items with optional filters.

**Query params**:
- `category`: optional filter (armor, cape, jewelry, boots, hairstyle, color_palette, banner, emblem)
- `rarity`: optional filter (common, uncommon, rare, epic, legendary)
- `limit`: int, default 50, max 100
- `offset`: int, default 0

**Response** (200):
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Bronze Armor",
      "description": "Basic protective armor",
      "category": "armor",
      "rarity": "common",
      "coin_price": 200,
      "level_required": 1,
      "image_url": null,
      "is_quest_exclusive": false,
      "is_affordable": true,
      "is_owned": false,
      "is_level_locked": false
    }
  ],
  "total": 30,
  "limit": 50,
  "offset": 0
}
```

---

#### `POST /api/store/purchase`

Purchase a cosmetic item.

**Request**:
```json
{ "cosmetic_id": "uuid" }
```

**Response** (200):
```json
{
  "item": {
    "id": "uuid",
    "name": "Bronze Armor",
    "category": "armor",
    "rarity": "common"
  },
  "new_coin_balance": 230,
  "achievements_unlocked": []
}
```

**Error Responses** (400):
```json
{ "detail": "insufficient_coins", "required": 200, "current_balance": 150 }
{ "detail": "already_owned" }
{ "detail": "level_too_low", "required_level": 5, "current_level": 3 }
{ "detail": "item_unavailable" }
{ "detail": "quest_exclusive" }
```

---

#### `GET /api/store/inventory`

Returns all cosmetics owned by the user.

**Response** (200):
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Bronze Armor",
      "category": "armor",
      "rarity": "common",
      "source": "store_purchase",
      "acquired_at": "2026-02-05T12:00:00Z",
      "is_equipped": true
    }
  ],
  "count": 5
}
```

---

#### `POST /api/store/equip`

Equip a cosmetic item into a slot.

**Request**:
```json
{ "cosmetic_id": "uuid", "slot": "armor" }
```

**Response** (200):
```json
{
  "slot": "armor",
  "cosmetic": {
    "id": "uuid",
    "name": "Bronze Armor",
    "category": "armor",
    "rarity": "common"
  }
}
```

**Errors** (400):
```json
{ "detail": "item_not_owned" }
{ "detail": "category_slot_mismatch", "item_category": "cape", "requested_slot": "armor" }
```

---

#### `POST /api/store/unequip`

Remove a cosmetic from a slot.

**Request**:
```json
{ "slot": "armor" }
```

**Response** (200):
```json
{ "slot": "armor", "cosmetic": null }
```

---

### 3.4 Quest Endpoints

**Router**: `backend/app/routes/quests.py`
**Prefix**: `/api/quests`
**Tags**: `["quests"]`

---

#### `GET /api/quests/catalog`

Returns all quests the user has unlocked (level >= `level_required`), with progress status.

**Response** (200):
```json
{
  "quests": [
    {
      "id": "uuid",
      "name": "Trade Data Analysis",
      "description": "A merchant requests assistance analyzing trade data...",
      "level_required": 3,
      "xp_reward": 200,
      "coin_reward": 150,
      "cosmetic_reward": {
        "id": "uuid",
        "name": "Merchant Ring",
        "category": "jewelry",
        "rarity": "rare"
      },
      "requirements": [
        {
          "type": "module_completed",
          "count": 2,
          "description": "Complete 2 analytics modules",
          "current_count": 1,
          "completed": false
        }
      ],
      "status": "in_progress",
      "started_at": "2026-02-08T09:00:00Z",
      "completed_at": null
    }
  ]
}
```

---

#### `GET /api/quests/active`

Returns the user's in-progress quests with current progress.

**Response** (200): Same schema as catalog, filtered to `status == "in_progress"`.

---

#### `GET /api/quests/completed`

Returns completed quests.

**Response** (200): Same schema as catalog, filtered to `status == "completed"`.

---

#### `POST /api/quests/{quest_id}/start`

Start a quest.

**Response** (200):
```json
{
  "quest_id": "uuid",
  "status": "in_progress",
  "started_at": "2026-02-11T10:00:00Z"
}
```

**Errors**:
- `403`: User level too low (`{ "detail": "level_too_low", "required_level": 5, "current_level": 3 }`)
- `400`: Quest already started or completed (`{ "detail": "quest_already_started" }`)

---

### 3.5 Error Response Convention

All error responses follow this pattern:

```json
{
  "detail": "error_code_string",
  ...additional_context_fields
}
```

HTTP status codes:
- `400` Bad Request: Invalid input, business rule violation
- `401` Unauthorized: Missing or invalid JWT
- `403` Forbidden: Level-locked content
- `404` Not Found: Resource does not exist
- `409` Conflict: Duplicate operation (already owned, already started)
- `500` Internal Server Error: Unexpected failure

---

## 4. Service Layer Architecture

### 4.1 Service Dependency Graph

```
reward_hook_service.py
    |-- progression_service.py
    |       |-- (DB: user_progression, gamification_events, coin_transactions)
    |       |-- (Redis: progression cache)
    |-- achievement_service.py
    |       |-- (DB: achievement_catalog, user_achievements)
    |       |-- progression_service.py (for awarding achievement XP/Coins)
    |-- quest_service.py
    |       |-- (DB: side_quest_catalog, user_quest_progress)
    |       |-- progression_service.py (for awarding quest rewards)
    |       |-- store_service.py (for awarding quest cosmetics)

store_service.py
    |-- progression_service.py (for spend_coins)
    |-- (DB: cosmetic_catalog, user_inventory, user_equipped_items)

streak_service.py  (embedded in progression_service.record_login)
    |-- (Redis: streak cache)
```

### 4.2 `progression_service.py`

**File**: `backend/app/services/progression_service.py`
**References**: FR-005

```python
class ProgressionService:
    """Encapsulates all XP, Coin, Level, and Login Streak mutations.

    All methods accept a SQLAlchemy Session and operate within the caller's
    transaction. The caller is responsible for commit/rollback.
    """

    # --- XP Operations ---

    def award_xp(
        self,
        db: Session,
        user_id: UUID,
        amount: int,
        event_type: str,
        event_key: str | None = None,
        metadata: dict | None = None,
    ) -> AwardXPResult:
        """
        Atomically awards XP to a user.

        Steps:
        1. If event_key is provided, check for existing event. If found, return
           {already_awarded: True} without modification.
        2. Insert gamification_event row.
        3. Increment xp_total on user_progression (SELECT FOR UPDATE).
        4. Recompute level from new xp_total using threshold table.
        5. If level changed, emit level_up event and award level-up Coin bonus.
        6. Return AwardXPResult with xp_awarded, new_total, old_level, new_level,
           level_up (bool), coins_from_level_up.
        """

    # --- Coin Operations ---

    def award_coins(
        self,
        db: Session,
        user_id: UUID,
        amount: int,
        source: str,
        reference_id: UUID | None = None,
    ) -> AwardCoinsResult:
        """
        Atomically awards Coins.

        Steps:
        1. SELECT FOR UPDATE on user_progression.
        2. Increment coin_balance.
        3. Insert coin_transaction (type="earned", balance_after=new balance).
        4. Invalidate Redis cache.
        5. Return AwardCoinsResult with coins_awarded, new_balance.
        """

    def spend_coins(
        self,
        db: Session,
        user_id: UUID,
        amount: int,
        source: str,
        reference_id: UUID | None = None,
    ) -> SpendCoinsResult:
        """
        Atomically spends Coins.

        Steps:
        1. SELECT FOR UPDATE on user_progression.
        2. Check coin_balance >= amount. If not, return {success: False, reason: "insufficient_coins"}.
        3. Decrement coin_balance.
        4. Insert coin_transaction (type="spent", amount=-amount, balance_after=new balance).
        5. Invalidate Redis cache.
        6. Return SpendCoinsResult with success, new_balance.
        """

    # --- Login Streak ---

    def record_login(
        self,
        db: Session,
        user_id: UUID,
    ) -> LoginResult:
        """
        Records daily login. Manages streak logic.

        Steps:
        1. SELECT FOR UPDATE on user_progression.
        2. Get today's date (server timezone, UTC).
        3. If last_login_date == today: return no-op (is_new_day=False).
        4. If last_login_date == yesterday: increment login_streak.
        5. Else: reset login_streak to 1.
        6. Update last_login_date = today.
        7. Award daily login Coins (10 coins).
        8. Check streak milestones (multiples of 3 and 7), award bonus Coins.
        9. Update Redis cache.
        10. Return LoginResult with streak, coins_awarded, streak_bonuses.
        """

    # --- Read Operations ---

    def get_progression(
        self,
        db: Session,
        user_id: UUID,
    ) -> ProgressionState | None:
        """
        Returns full progression state. Checks Redis first, falls back to DB.
        Includes computed fields: title, current_level_xp, xp_to_next_level,
        feature_unlocks.
        """

    def ensure_progression_exists(
        self,
        db: Session,
        user_id: UUID,
    ) -> UserProgression:
        """
        Returns existing progression row or creates one with defaults.
        Called during registration and on first API access.
        """
```

**Result Dataclasses**:

```python
@dataclass
class AwardXPResult:
    already_awarded: bool = False
    xp_awarded: int = 0
    new_xp_total: int = 0
    old_level: int = 1
    new_level: int = 1
    level_up: bool = False
    coins_from_level_up: int = 0

@dataclass
class AwardCoinsResult:
    coins_awarded: int = 0
    new_balance: int = 0

@dataclass
class SpendCoinsResult:
    success: bool = False
    reason: str | None = None
    new_balance: int = 0

@dataclass
class LoginResult:
    is_new_day: bool = False
    login_streak: int = 0
    coins_awarded: int = 0
    streak_bonuses: list[dict] = field(default_factory=list)
    total_coins_awarded: int = 0
```

### 4.3 `achievement_service.py`

**File**: `backend/app/services/achievement_service.py`
**References**: FR-013

```python
class AchievementService:
    """Evaluates and unlocks achievements based on gamification events."""

    def __init__(self):
        self._catalog_cache: list[AchievementCatalog] | None = None

    def load_catalog(self, db: Session) -> list[AchievementCatalog]:
        """Load and cache the active achievement catalog.

        Catalog is small (~25 rows) and static. Cached in memory after first load.
        """

    def evaluate_achievements(
        self,
        db: Session,
        user_id: UUID,
        event_type: str,
        progression: UserProgression,
    ) -> list[UnlockedAchievement]:
        """
        Evaluate all active achievements against the user's current state.

        Steps:
        1. Load catalog (from cache).
        2. Get user's already-unlocked achievement IDs.
        3. For each not-yet-unlocked achievement:
           a. If event_based: count events of matching type for user, compare to trigger_config.count.
           b. If threshold_based: check user_progression field against trigger_config.threshold.
           c. If manual: skip (handled by specific endpoints).
        4. For each newly unlocked:
           a. Insert user_achievements row.
           b. Award XP and Coins via progression_service.
        5. Return list of UnlockedAchievement with name, description, rewards.
        """

    def get_user_achievements(
        self, db: Session, user_id: UUID
    ) -> list[UserAchievement]:
        """Return all achievements unlocked by user."""

    def get_catalog_with_status(
        self, db: Session, user_id: UUID
    ) -> list[AchievementWithStatus]:
        """Return full catalog with is_unlocked and unlocked_at per user."""
```

### 4.4 `reward_hook_service.py`

**File**: `backend/app/services/reward_hook_service.py`
**References**: FR-020

This is the **central dispatcher** that existing endpoints call when an action occurs. It orchestrates XP/Coin awards and achievement/quest evaluation in a single call.

```python
class RewardHookService:
    """Central event-to-reward dispatcher.

    Existing route handlers call a single method on this service after
    a rewarded action succeeds. The service handles all downstream effects:
    XP, Coins, achievements, quest progress.
    """

    def __init__(
        self,
        progression_service: ProgressionService,
        achievement_service: AchievementService,
        quest_service: QuestService,
    ):
        self.progression = progression_service
        self.achievement = achievement_service
        self.quest = quest_service

    def process_action(
        self,
        db: Session,
        user_id: UUID,
        event_type: str,
        event_key: str | None = None,
        metadata: dict | None = None,
    ) -> RewardResult:
        """
        Process a platform action and distribute all rewards.

        Steps:
        1. Look up XP and Coin amounts from the reward config table.
        2. If XP > 0: call progression_service.award_xp().
        3. If Coins > 0: call progression_service.award_coins().
        4. Call achievement_service.evaluate_achievements().
        5. Call quest_service.evaluate_quest_progress().
        6. Aggregate all results into RewardResult.
        7. Return RewardResult (XP gained, Coins gained, level changes,
           achievements unlocked, quest progress updates).

        IMPORTANT: This method catches all exceptions internally. If any step
        fails, it logs the error but does NOT propagate the exception to the
        caller. The primary action must never fail due to gamification.
        """

    def get_reward_config(self, event_type: str) -> RewardConfig:
        """Look up XP/Coin amounts for an event type from the config table."""
```

**Reward Configuration Table** (Python dict, loaded at startup):

```python
REWARD_CONFIG: dict[str, RewardConfig] = {
    "module_completed":      RewardConfig(xp=50,  coins=0),
    "assessment_completed":  RewardConfig(xp=75,  coins=0),
    "milestone_passed":      RewardConfig(xp=150, coins=0),
    "certification_earned":  RewardConfig(xp=300, coins=0),
    "weekly_consistency":    RewardConfig(xp=100, coins=0),
    "daily_login":           RewardConfig(xp=0,   coins=10),
    "streak_3":              RewardConfig(xp=0,   coins=50),
    "streak_7":              RewardConfig(xp=0,   coins=100),
    "first_module_week":     RewardConfig(xp=0,   coins=40),
    "peer_endorsement":      RewardConfig(xp=0,   coins=25),
    "side_quest_completed":  RewardConfig(xp=0,   coins=100),
    "roadmap_generated":     RewardConfig(xp=50,  coins=25),
    "first_match_view":      RewardConfig(xp=50,  coins=25),
    "resume_uploaded":       RewardConfig(xp=50,  coins=25),
    "profile_completed":     RewardConfig(xp=50,  coins=25),
}
```

### 4.5 `store_service.py`

**File**: `backend/app/services/store_service.py`
**References**: FR-016

```python
class StoreService:
    """Cosmetic store: browse, purchase, inventory, equip/unequip."""

    def get_catalog(
        self,
        db: Session,
        user_id: UUID,
        category: str | None = None,
        rarity: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> PaginatedCatalog:
        """
        Returns catalog items with is_affordable, is_owned, is_level_locked
        computed per-user.
        """

    def purchase(
        self,
        db: Session,
        user_id: UUID,
        cosmetic_id: UUID,
    ) -> PurchaseResult:
        """
        Atomic purchase flow:
        1. Load cosmetic item. Validate: exists, is_active, not quest_exclusive.
        2. Check user does not already own it (user_inventory).
        3. Load user_progression. Check level >= level_required.
        4. Call progression_service.spend_coins(). If fails, return error.
        5. Insert user_inventory row (source="store_purchase").
        6. Check for "first_purchase" achievement via achievement_service.
        7. Return PurchaseResult.

        All steps in a single transaction.
        """

    def get_inventory(
        self, db: Session, user_id: UUID
    ) -> list[InventoryItem]:
        """Return all cosmetics owned by user with equipped status."""

    def equip(
        self,
        db: Session,
        user_id: UUID,
        cosmetic_id: UUID,
        slot: str,
    ) -> EquipResult:
        """
        Equip a cosmetic.
        1. Validate user owns item.
        2. Validate item category matches slot.
        3. Upsert user_equipped_items (replace existing item in slot).
        """

    def unequip(
        self, db: Session, user_id: UUID, slot: str
    ) -> None:
        """Remove equipped item from slot."""
```

### 4.6 `quest_service.py`

**File**: `backend/app/services/quest_service.py`
**References**: FR-019

```python
class QuestService:
    """Side quest management: catalog, start, progress, completion."""

    def get_available_quests(
        self, db: Session, user_id: UUID, user_level: int
    ) -> list[QuestWithProgress]:
        """Return quests user has unlocked (level >= required), with progress."""

    def start_quest(
        self,
        db: Session,
        user_id: UUID,
        quest_id: UUID,
        user_level: int,
    ) -> UserQuestProgress:
        """
        Start a quest.
        1. Validate quest exists and is active.
        2. Validate user level >= level_required.
        3. Validate quest not already started/completed.
        4. Create user_quest_progress row with status="in_progress" and
           initialized progress JSON.
        """

    def evaluate_quest_progress(
        self,
        db: Session,
        user_id: UUID,
        event_type: str,
        event_key: str | None = None,
    ) -> list[QuestProgressUpdate]:
        """
        Check all in-progress quests for this user. For each quest:
        1. Check if any requirement matches the event_type.
        2. If so, count matching events for the user.
        3. Update progress JSON.
        4. If all requirements met, complete the quest and award rewards.

        Returns list of quests that had progress updates or completions.
        """

    def complete_quest(
        self,
        db: Session,
        user_id: UUID,
        quest_progress: UserQuestProgress,
    ) -> QuestCompletionResult:
        """
        Award quest rewards:
        1. XP via progression_service.award_xp().
        2. Coins via progression_service.award_coins().
        3. Cosmetic (if any) added to user_inventory with source="quest_reward".
        4. Set quest status to "completed", completed_at to now.
        """
```

### 4.7 Service Instantiation Pattern

Services are instantiated as module-level singletons (matching the existing pattern in the codebase where services are functions/classes in `backend/app/services/`):

```python
# backend/app/services/progression_service.py
progression_service = ProgressionService()

# backend/app/services/achievement_service.py
achievement_service = AchievementService()

# backend/app/services/quest_service.py
quest_service = QuestService()

# backend/app/services/store_service.py
store_service = StoreService()

# backend/app/services/reward_hook_service.py
reward_hook_service = RewardHookService(
    progression_service=progression_service,
    achievement_service=achievement_service,
    quest_service=quest_service,
)
```

Route handlers receive the `db: Session` via `Depends(get_db)` and pass it to service methods. The route handler is responsible for `db.commit()` on success.

---

## 5. XP Calculation Engine

### 5.1 Level Threshold Table

**References**: FR-007, D-MM-5

The exponential curve from the current implementation (`100 * 1.5^(level-1)`) makes high levels unreachable. The new system uses a linear-step curve:

```python
# backend/app/services/progression_service.py

XP_THRESHOLDS: list[tuple[int, int, str]] = [
    # (level, total_xp_required, title)
    (1,   0,      "Apprentice"),
    (2,   100,    "Apprentice"),
    (3,   300,    "Apprentice"),
    (4,   600,    "Squire"),
    (5,   1000,   "Squire"),
    (6,   1500,   "Knight"),
    (7,   2100,   "Knight"),
    (8,   2800,   "Warrior"),
    (9,   3600,   "Warrior"),
    (10,  4500,   "Champion"),
]

def compute_level_from_xp(xp_total: int) -> tuple[int, str]:
    """Derive level and title from total XP.

    For levels 1-10, use the threshold table.
    For levels 11+: threshold = 4500 + (level - 10) * 1000.
    Title mapping for 11+:
      11-14: Master
      15-19: Grandmaster
      20+: Legend
    """
    # Check levels 1-10
    for i in range(len(XP_THRESHOLDS) - 1, -1, -1):
        level, threshold, title = XP_THRESHOLDS[i]
        if xp_total >= threshold:
            # Check if there's a higher level above 10
            if level == 10:
                extra_level = (xp_total - 4500) // 1000
                if extra_level > 0:
                    actual_level = 10 + extra_level
                    if actual_level >= 20:
                        return actual_level, "Legend"
                    elif actual_level >= 15:
                        return actual_level, "Grandmaster"
                    else:
                        return actual_level, "Master"
            return level, title
    return 1, "Apprentice"


def compute_xp_for_next_level(level: int) -> int:
    """Return the total XP required to reach level+1."""
    if level < 10:
        return XP_THRESHOLDS[level][1]  # next level's threshold
    return 4500 + (level - 9) * 1000


def compute_level_progress(xp_total: int, level: int) -> tuple[int, int]:
    """Return (current_level_xp, xp_to_next_level).

    current_level_xp: XP earned within the current level.
    xp_to_next_level: XP remaining to reach the next level.
    """
    if level <= 10:
        current_threshold = XP_THRESHOLDS[level - 1][1]
    else:
        current_threshold = 4500 + (level - 10) * 1000

    next_threshold = compute_xp_for_next_level(level)

    current_level_xp = xp_total - current_threshold
    xp_to_next_level = next_threshold - xp_total

    return current_level_xp, max(0, xp_to_next_level)
```

### 5.2 Level-Up Detection

When `award_xp()` is called:

```
1. old_xp = user.xp_total
2. new_xp = old_xp + amount
3. old_level, _ = compute_level_from_xp(old_xp)
4. new_level, new_title = compute_level_from_xp(new_xp)
5. user.xp_total = new_xp
6. user.level = new_level
7. if new_level > old_level:
     for each level from old_level+1 to new_level:
       award_coins(user_id, level * 10, "level_up_bonus")
       insert gamification_event(type="level_up", metadata={"level": level})
     check feature_unlocks(new_level)
```

### 5.3 Feature Unlock Evaluation

**References**: FR-008

```python
FEATURE_UNLOCKS = {
    3:  "side_quests",
    5:  "guild_rank",
    8:  "advanced_arena",
    10: "special_title",
}

def get_feature_unlocks(level: int) -> dict[str, bool]:
    return {
        "side_quests": level >= 3,
        "guild_rank": level >= 5,
        "advanced_arena": level >= 8,
        "special_title": level >= 10,
    }
```

---

## 6. Event System Architecture

### 6.1 Event Flow

```
User Action (e.g., complete module)
    |
    v
Existing Route Handler (e.g., POST /api/skills/progress/module/{id}/complete)
    |
    | (primary action succeeds)
    |
    v
reward_hook_service.process_action(
    db, user_id,
    event_type="module_completed",
    event_key="module:{module_id}"
)
    |
    +---> progression_service.award_xp(50 XP)
    |         |
    |         +---> (level-up check)
    |         +---> (level-up Coin bonus if applicable)
    |
    +---> achievement_service.evaluate_achievements()
    |         |
    |         +---> (unlock achievements if conditions met)
    |         +---> (award achievement XP/Coins)
    |
    +---> quest_service.evaluate_quest_progress()
    |         |
    |         +---> (update quest progress)
    |         +---> (complete quest if all requirements met)
    |         +---> (award quest XP/Coins/Cosmetic)
    |
    v
RewardResult returned to route handler
    |
    v
Route response includes gamification_rewards field (optional)
```

### 6.2 Fire-and-Forget Pattern

**References**: FR-020.3, D-MM-10

```python
# In each route handler:
try:
    reward_result = reward_hook_service.process_action(
        db, user_id,
        event_type="module_completed",
        event_key=f"module:{module_id}",
    )
except Exception:
    logger.exception("Gamification reward failed for module %s", module_id)
    reward_result = None

# The primary response is always returned regardless of reward_result
return ModuleCompletionResponse(
    module=module_data,
    gamification=reward_result,  # None if gamification failed
)
```

### 6.3 Event Type Registry

| Event Type | XP | Coins | Event Key Pattern | Triggered By |
|------------|-----|-------|-------------------|--------------|
| `module_completed` | 50 | 0 | `module:{module_id}` | `POST /api/skills/progress/module/{id}/complete` |
| `assessment_completed` | 75 | 0 | `assessment:{id}` | Assessment completion flow |
| `milestone_passed` | 150 | 0 | `milestone:{id}` | `POST /api/roadmap/progress/milestone/{id}` |
| `certification_earned` | 300 | 0 | `cert:{badge_id}` | Badge earned flow |
| `weekly_consistency` | 100 | 0 | `weekly:{year}:{week}` | Login tracking (checked weekly) |
| `daily_login` | 0 | 10 | null (repeatable) | `POST /api/progression/login` |
| `streak_3` | 0 | 50 | null (repeatable) | Login streak evaluation |
| `streak_7` | 0 | 100 | null (repeatable) | Login streak evaluation |
| `first_module_week` | 0 | 40 | `first_module:{year}:{week}` | Module completion (weekly first) |
| `roadmap_generated` | 50 | 25 | `roadmap:{roadmap_id}` | `POST /api/roadmap/generate` |
| `first_match_view` | 50 | 25 | `first_match:{user_id}` | `POST /api/matches` |
| `resume_uploaded` | 50 | 25 | `resume:{user_id}` | `POST /api/skills/upload` |
| `profile_completed` | 50 | 25 | `profile:{user_id}` | Profile update endpoint |
| `level_up` | 0 | level * 10 | `level_up:{level}` | Auto-emitted by award_xp |
| `side_quest_completed` | varies | varies | `quest:{quest_id}` | Quest completion |
| `page_visit` | 0 | 0 | null | `POST /api/progression/visit` |

### 6.4 Integration Points in Existing Routes

| File | Modification | Event |
|------|-------------|-------|
| `backend/app/routes/auth.py` | After user creation in `register()`: call `progression_service.ensure_progression_exists()`. After login: call `reward_hook_service.process_action("daily_login")` | `daily_login` |
| `backend/app/routes/skills.py` | After module completion: call `reward_hook_service.process_action("module_completed", event_key=f"module:{id}")` | `module_completed` |
| `backend/app/routes/roadmap.py` | After milestone marked complete: call `reward_hook_service.process_action("milestone_passed", event_key=f"milestone:{id}")`. After roadmap generation: call `reward_hook_service.process_action("roadmap_generated", event_key=f"roadmap:{id}")` | `milestone_passed`, `roadmap_generated` |
| `backend/app/routes/matches.py` | After first match query: call `reward_hook_service.process_action("first_match_view", event_key=f"first_match:{user_id}")` | `first_match_view` |
| `backend/app/routes/__init__.py` | Add imports for new routers | N/A |
| `backend/app/main.py` | Register new routers (progression, achievements, store, quests) | N/A |

### 6.5 First-Time Action Detection

First-time actions are automatically handled by the idempotency mechanism:
- The `event_key` includes the entity ID (e.g., `module:abc123`).
- The partial unique index on `(user_id, event_key)` prevents duplicate inserts.
- If the insert is a duplicate, `award_xp()` returns `{already_awarded: True}` and no XP/Coins are granted.

This means **no special first-time detection code is needed**. The event system inherently handles it.

---

## 7. Frontend Architecture Changes

### 7.1 AdventureModeContext Migration

**File**: `frontend/src/context/AdventureModeContext.tsx`
**References**: FR-022, D-MM-12

**Current state**: All gamification data in localStorage key `springais-adventure-mode`.
**Target state**: All gamification data fetched from `GET /api/progression` via React Query. Zero localStorage usage for gamification.

**Changes**:
1. Remove `STORAGE_KEY`, `loadState()`, `saveState()` functions entirely.
2. Remove all `localStorage.getItem`/`localStorage.setItem` calls.
3. On mount (when `AuthContext` has a valid user), fetch progression from server.
4. Store progression data in React state, fed by `useQuery('progression')`.
5. Expose the same public API (totalXP, gold, level, title, etc.) but backed by server data.
6. Keep derived calculations (currentXP, xpToNextLevel) client-side for instant UI.
7. Validate client-side level against server-provided level on each fetch.

**React Query Integration**:

```typescript
// frontend/src/services/progressionService.ts

export const progressionApi = {
  getProgression: () => api.get('/progression'),
  toggleAdventureMode: () => api.post('/progression/toggle-adventure-mode'),
  recordLogin: () => api.post('/progression/login'),
  recordVisit: (page: string) => api.post('/progression/visit', { page }),
  getHistory: (type: 'event' | 'transaction', limit = 50, offset = 0) =>
    api.get(`/progression/history?type=${type}&limit=${limit}&offset=${offset}`),
};
```

```typescript
// In AdventureModeContext.tsx:

const { data: progression, refetch } = useQuery({
  queryKey: ['progression'],
  queryFn: () => progressionApi.getProgression(),
  enabled: !!user,  // Only fetch when logged in
  staleTime: 30_000,  // 30s cache
  refetchOnWindowFocus: true,
});
```

### 7.2 New API Client Functions

**File**: `frontend/src/services/progressionService.ts` (new)

```typescript
export const progressionApi = {
  getProgression: () => api.get<ProgressionState>('/progression'),
  toggleAdventureMode: () => api.post<{ adventure_mode_enabled: boolean }>('/progression/toggle-adventure-mode'),
  recordLogin: () => api.post<LoginResult>('/progression/login'),
  recordVisit: (page: string) => api.post<VisitResult>('/progression/visit', { page }),
  getHistory: (type: string, limit?: number, offset?: number) =>
    api.get<PaginatedHistory>(`/progression/history`, { params: { type, limit, offset } }),
};
```

**File**: `frontend/src/services/storeService.ts` (new)

```typescript
export const storeApi = {
  getCatalog: (params?: { category?: string; rarity?: string; limit?: number; offset?: number }) =>
    api.get<PaginatedCatalog>('/store/catalog', { params }),
  purchase: (cosmetic_id: string) =>
    api.post<PurchaseResult>('/store/purchase', { cosmetic_id }),
  getInventory: () => api.get<InventoryResponse>('/store/inventory'),
  equip: (cosmetic_id: string, slot: string) =>
    api.post<EquipResult>('/store/equip', { cosmetic_id, slot }),
  unequip: (slot: string) =>
    api.post<UnequipResult>('/store/unequip', { slot }),
};
```

**File**: `frontend/src/services/questService.ts` (new)

```typescript
export const questApi = {
  getCatalog: () => api.get<QuestCatalogResponse>('/quests/catalog'),
  getActive: () => api.get<QuestCatalogResponse>('/quests/active'),
  getCompleted: () => api.get<QuestCatalogResponse>('/quests/completed'),
  startQuest: (questId: string) => api.post<StartQuestResult>(`/quests/${questId}/start`),
};
```

**File**: `frontend/src/services/achievementService.ts` (new)

```typescript
export const achievementApi = {
  getCatalog: () => api.get<AchievementCatalogResponse>('/achievements/catalog'),
  getUnlocked: () => api.get<UnlockedAchievementsResponse>('/achievements'),
};
```

### 7.3 React Query Integration Strategy

All gamification data uses `@tanstack/react-query` (already installed):

| Query Key | Endpoint | Stale Time | Refetch Strategy |
|-----------|----------|------------|------------------|
| `['progression']` | `GET /api/progression` | 30s | On window focus, after mutations |
| `['achievements', 'catalog']` | `GET /api/achievements/catalog` | 5min | After gamification events |
| `['store', 'catalog', filters]` | `GET /api/store/catalog` | 5min | After purchase |
| `['store', 'inventory']` | `GET /api/store/inventory` | 1min | After purchase/equip |
| `['quests', 'catalog']` | `GET /api/quests/catalog` | 2min | After gamification events |
| `['quests', 'active']` | `GET /api/quests/active` | 1min | After gamification events |

**Invalidation Pattern**: After any action that triggers a gamification event, the mutation's `onSuccess` callback invalidates `['progression']` and relevant query keys:

```typescript
const completeMutation = useMutation({
  mutationFn: completeModule,
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['progression'] });
    queryClient.invalidateQueries({ queryKey: ['quests', 'active'] });
    queryClient.invalidateQueries({ queryKey: ['achievements', 'catalog'] });

    // Show toasts for gamification rewards
    if (data.gamification?.level_up) {
      showLevelUpToast(data.gamification.new_level);
    }
    if (data.gamification?.achievements_unlocked?.length) {
      data.gamification.achievements_unlocked.forEach(showAchievementToast);
    }
  },
});
```

### 7.4 New Components

| Component | Purpose | Route |
|-----------|---------|-------|
| `frontend/src/pages/StorePage.tsx` | Cosmetic store with catalog grid, filters, purchase dialog | `/store` |
| `frontend/src/pages/QuestsPage.tsx` | Quest board with available/active/completed tabs | `/quests` |
| `frontend/src/components/store/StoreItemCard.tsx` | Individual item in the store grid | N/A (used in StorePage) |
| `frontend/src/components/store/InventoryPanel.tsx` | User inventory with equip/unequip | N/A (tab in StorePage) |
| `frontend/src/components/store/PurchaseDialog.tsx` | Confirmation dialog for purchases | N/A (modal in StorePage) |
| `frontend/src/components/quests/QuestCard.tsx` | Individual quest with progress | N/A (used in QuestsPage) |
| `frontend/src/components/quests/QuestProgressBar.tsx` | Requirement progress visualization | N/A (used in QuestCard) |

### 7.5 Routing Changes

**File**: `frontend/src/App.tsx`

Add two new routes inside the `ProtectedRoute` wrapper:

```typescript
<Route path="/store" element={<StorePage />} />
<Route path="/quests" element={<QuestsPage />} />
```

### 7.6 Sidebar Navigation

**File**: `frontend/src/components/layout/Sidebar.tsx`

Add navigation items for Store and Quests (conditionally shown when adventure mode is enabled):

```typescript
// When adventure mode is active:
{ path: '/store', label: 'Merchant\'s Armory', icon: ShoppingBag, fantasyLabel: 'Merchant\'s Armory' }
{ path: '/quests', label: 'Quest Board', icon: Scroll, fantasyLabel: 'Adventurer\'s Guild' }
```

### 7.7 State Management for Equipped Cosmetics

Equipped cosmetics are part of the progression state returned by `GET /api/progression`. The `equipped_items` field is a dict of slot -> cosmetic data. This data is used by:

1. **AdventureHUD**: Display equipped items as visual indicators.
2. **ProfilePage**: Show equipped cosmetics on user profile.
3. **StorePage**: Show equipped status on items in inventory.

No separate React context is needed. The `['progression']` query provides this data.

---

## 8. Redis Usage

### 8.1 Progression State Cache

**Key**: `progression:{user_id}`
**Value**: JSON blob of full progression state
**TTL**: 300 seconds (5 minutes)
**Invalidation**: On any XP/Coin/level/streak mutation

```python
async def get_cached_progression(redis: Redis, user_id: UUID) -> dict | None:
    data = await redis.get(f"progression:{user_id}")
    return json.loads(data) if data else None

async def set_cached_progression(redis: Redis, user_id: UUID, state: dict):
    await redis.setex(
        f"progression:{user_id}",
        300,  # 5 min TTL
        json.dumps(state, default=str),
    )

async def invalidate_progression_cache(redis: Redis, user_id: UUID):
    await redis.delete(f"progression:{user_id}")
```

### 8.2 Login Streak Tracking

Login streak logic is primarily database-driven (using `last_login_date` and `login_streak` on `user_progression`). Redis is used as a short-lived guard to prevent duplicate daily login processing:

**Key**: `login_guard:{user_id}:{date}`
**Value**: `"1"`
**TTL**: 86400 seconds (24 hours)

```python
async def is_login_processed_today(redis: Redis, user_id: UUID) -> bool:
    today = date.today().isoformat()
    return await redis.exists(f"login_guard:{user_id}:{today}") > 0

async def mark_login_processed(redis: Redis, user_id: UUID):
    today = date.today().isoformat()
    await redis.setex(f"login_guard:{user_id}:{today}", 86400, "1")
```

### 8.3 Rate Limiting

Rate limiting for reward hooks is handled via the idempotency mechanism (event_key) rather than Redis. The daily login rate limit is handled by the login guard above. No additional Redis-based rate limiting is needed for MVP.

### 8.4 Graceful Degradation

**References**: NFR-005

```python
async def get_progression_with_fallback(
    db: Session, redis: Redis | None, user_id: UUID
) -> ProgressionState:
    """Try Redis first, fall back to DB if Redis unavailable."""
    if redis:
        try:
            cached = await get_cached_progression(redis, user_id)
            if cached:
                return ProgressionState(**cached)
        except Exception:
            logger.warning("Redis unavailable, falling back to DB")

    # Direct DB query
    return progression_service.get_progression(db, user_id)
```

---

## 9. Migration Plan

### 9.1 Alembic Setup

**References**: D-MM-11

1. The `alembic` package is already in `backend/requirements.txt`.
2. Run `alembic init alembic` in `backend/` to create the `alembic/` directory.
3. Configure `alembic/env.py`:
   - Import `Base` from `app.models.base`
   - Import all new models so they register with Base.metadata
   - Set `target_metadata = Base.metadata`
   - Configure `sqlalchemy.url` from `DATABASE_URL` env var
4. Create initial migration: `alembic revision --autogenerate -m "add_gamification_tables"`

### 9.2 Initial Migration Content

The initial migration creates all 11 new tables and seeds catalog data:

```python
# alembic/versions/001_add_gamification_tables.py

def upgrade():
    # 1. Create tables (in dependency order)
    op.create_table("user_progression", ...)
    op.create_table("gamification_events", ...)
    op.create_table("coin_transactions", ...)
    op.create_table("achievement_catalog", ...)
    op.create_table("user_achievements", ...)
    op.create_table("cosmetic_catalog", ...)
    op.create_table("user_inventory", ...)
    op.create_table("user_equipped_items", ...)
    op.create_table("side_quest_catalog", ...)
    op.create_table("user_quest_progress", ...)
    op.create_table("user_page_visits", ...)

    # 2. Seed achievement catalog (24 rows)
    op.bulk_insert(achievement_catalog_table, ACHIEVEMENT_SEED_DATA)

    # 3. Seed cosmetic catalog (30+ rows)
    op.bulk_insert(cosmetic_catalog_table, COSMETIC_SEED_DATA)

    # 4. Seed side quest catalog (5 rows)
    op.bulk_insert(side_quest_catalog_table, QUEST_SEED_DATA)

def downgrade():
    # Drop tables in reverse dependency order
    op.drop_table("user_page_visits")
    op.drop_table("user_quest_progress")
    op.drop_table("side_quest_catalog")
    op.drop_table("user_equipped_items")
    op.drop_table("user_inventory")
    op.drop_table("cosmetic_catalog")
    op.drop_table("user_achievements")
    op.drop_table("achievement_catalog")
    op.drop_table("coin_transactions")
    op.drop_table("gamification_events")
    op.drop_table("user_progression")
```

### 9.3 Existing User Handling

**References**: D-MM-12

- **No migration of localStorage data**. All localStorage gamification data is untrusted.
- When an existing user first calls `POST /api/progression/login` (triggered on frontend login), the service creates a `user_progression` row with defaults if one does not exist.
- New users get a `user_progression` row created during registration (in `auth.py` register endpoint).

### 9.4 Frontend Cleanup

After backend is deployed:
1. Remove `STORAGE_KEY` constant from `AdventureModeContext.tsx`.
2. Remove `loadState()` and `saveState()` functions.
3. Remove all `localStorage.getItem('springais-adventure-mode')` / `localStorage.setItem(...)` calls.
4. The `localStorage` keys for theme (`springais-theme`) and auth (`token`, `user`) remain unchanged.

### 9.5 Deployment Order

1. **Backend first**: Deploy new tables, endpoints, services. Existing endpoints are backward-compatible (new gamification calls are additive).
2. **Frontend second**: Deploy the React changes that switch from localStorage to API calls.
3. **Rollback**: Frontend can be reverted independently; backend changes are additive and do not break existing functionality.

### 9.6 Backward Compatibility Notes

**References**: NFR-006

- The `Base.metadata.create_all()` call in `main.py` remains for existing tables. It will NOT create the new gamification tables (those are Alembic-managed).
- Existing endpoints are not broken by the new code. The reward hooks are additive (try/except wrapped).
- The `user_profiles` table is NOT modified. The `user_progression` table has a FK to `user_profiles.id`.

---

## 10. ADR Index

| ADR | Title | Location |
|-----|-------|----------|
| ADR-MM-001 | Adopt Alembic for gamification schema migrations | `artifacts/design/decisions/ADR-MM-001-alembic-migrations.md` |
| ADR-MM-002 | Redis caching for progression state with DB fallback | `artifacts/design/decisions/ADR-MM-002-redis-progression-cache.md` |
| ADR-MM-003 | Synchronous in-process achievement evaluation | `artifacts/design/decisions/ADR-MM-003-sync-achievement-eval.md` |
| ADR-MM-004 | SELECT FOR UPDATE for Coin balance integrity | `artifacts/design/decisions/ADR-MM-004-coin-balance-locking.md` |
| ADR-MM-005 | Linear-step XP curve replacing exponential | `artifacts/design/decisions/ADR-MM-005-linear-xp-curve.md` |
| ADR-MM-006 | No migration of localStorage data | `artifacts/design/decisions/ADR-MM-006-no-localstorage-migration.md` |

---

## Appendix A: Pydantic Schema Summary

### Progression Schemas (`backend/app/schemas/progression.py`)

```python
class ProgressionResponse(BaseModel):
    xp_total: int
    level: int
    title: str
    coin_balance: int
    login_streak: int
    last_login_date: date | None
    adventure_mode_enabled: bool
    current_level_xp: int
    xp_to_next_level: int
    feature_unlocks: FeatureUnlocks
    equipped_items: dict[str, CosmeticBrief | None]
    unlocked_achievements_count: int
    active_quests_count: int

class FeatureUnlocks(BaseModel):
    side_quests: bool
    guild_rank: bool
    advanced_arena: bool
    special_title: bool

class LoginResponse(BaseModel):
    login_streak: int
    coins_awarded: int
    streak_bonus: int
    total_coins_awarded: int
    achievements_unlocked: list[AchievementBrief]
    is_new_day: bool

class ToggleAdventureModeResponse(BaseModel):
    adventure_mode_enabled: bool

class VisitRequest(BaseModel):
    page: str

class VisitResponse(BaseModel):
    page: str
    visit_count: int
    achievements_unlocked: list[AchievementBrief]

class HistoryResponse(BaseModel):
    items: list[dict]
    total: int
    limit: int
    offset: int
```

### Achievement Schemas (`backend/app/schemas/achievement.py`)

```python
class AchievementBrief(BaseModel):
    id: str
    name: str
    description: str
    xp_reward: int
    coin_reward: int

class AchievementCatalogItem(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    category: str
    xp_reward: int
    coin_reward: int
    is_unlocked: bool
    unlocked_at: datetime | None

class AchievementCatalogResponse(BaseModel):
    achievements: list[AchievementCatalogItem]

class UserAchievementsResponse(BaseModel):
    achievements: list[AchievementBrief]
    count: int
```

### Store Schemas (`backend/app/schemas/cosmetic.py`)

```python
class CosmeticBrief(BaseModel):
    id: str
    name: str
    category: str
    rarity: str

class StoreCatalogItem(BaseModel):
    id: str
    name: str
    description: str
    category: str
    rarity: str
    coin_price: int
    level_required: int
    image_url: str | None
    is_quest_exclusive: bool
    is_affordable: bool
    is_owned: bool
    is_level_locked: bool

class PaginatedCatalogResponse(BaseModel):
    items: list[StoreCatalogItem]
    total: int
    limit: int
    offset: int

class PurchaseRequest(BaseModel):
    cosmetic_id: str

class PurchaseResponse(BaseModel):
    item: CosmeticBrief
    new_coin_balance: int
    achievements_unlocked: list[AchievementBrief]

class InventoryItem(BaseModel):
    id: str
    name: str
    category: str
    rarity: str
    source: str
    acquired_at: datetime
    is_equipped: bool

class InventoryResponse(BaseModel):
    items: list[InventoryItem]
    count: int

class EquipRequest(BaseModel):
    cosmetic_id: str
    slot: str

class UnequipRequest(BaseModel):
    slot: str
```

### Quest Schemas (`backend/app/schemas/quest.py`)

```python
class QuestRequirement(BaseModel):
    type: str
    count: int
    description: str
    current_count: int = 0
    completed: bool = False

class QuestCatalogItem(BaseModel):
    id: str
    name: str
    description: str
    level_required: int
    xp_reward: int
    coin_reward: int
    cosmetic_reward: CosmeticBrief | None
    requirements: list[QuestRequirement]
    status: str  # "available", "in_progress", "completed"
    started_at: datetime | None
    completed_at: datetime | None

class QuestCatalogResponse(BaseModel):
    quests: list[QuestCatalogItem]

class StartQuestResponse(BaseModel):
    quest_id: str
    status: str
    started_at: datetime
```

---

## Appendix B: New File Inventory

### Backend -- New Files

| File | Purpose |
|------|---------|
| `backend/app/models/progression.py` | UserProgression, GamificationEvent, CoinTransaction |
| `backend/app/models/achievement.py` | AchievementCatalog, UserAchievement |
| `backend/app/models/cosmetic.py` | CosmeticCatalog, UserInventory, UserEquippedItem |
| `backend/app/models/quest.py` | SideQuestCatalog, UserQuestProgress |
| `backend/app/models/page_visit.py` | UserPageVisit |
| `backend/app/schemas/progression.py` | Pydantic schemas for progression API |
| `backend/app/schemas/achievement.py` | Pydantic schemas for achievement API |
| `backend/app/schemas/cosmetic.py` | Pydantic schemas for store API |
| `backend/app/schemas/quest.py` | Pydantic schemas for quest API |
| `backend/app/services/progression_service.py` | XP/Coin/Level/Streak management |
| `backend/app/services/achievement_service.py` | Achievement evaluation and unlock |
| `backend/app/services/store_service.py` | Cosmetic store operations |
| `backend/app/services/quest_service.py` | Side quest management |
| `backend/app/services/reward_hook_service.py` | Central reward dispatcher |
| `backend/app/routes/progression.py` | Progression API endpoints |
| `backend/app/routes/achievements.py` | Achievement API endpoints |
| `backend/app/routes/store.py` | Store API endpoints |
| `backend/app/routes/quests.py` | Quest API endpoints |
| `backend/app/data/gamification_seed.py` | Seed data for catalogs |
| `backend/alembic/` | Alembic config and migrations |
| `backend/alembic.ini` | Alembic configuration |
| `backend/alembic/env.py` | Alembic environment config |
| `backend/alembic/versions/001_add_gamification_tables.py` | Initial migration |

### Backend -- Modified Files

| File | Changes |
|------|---------|
| `backend/app/routes/auth.py` | Create progression row on register; record login |
| `backend/app/routes/skills.py` | Emit module_completed event |
| `backend/app/routes/roadmap.py` | Emit milestone_passed, roadmap_generated events |
| `backend/app/routes/matches.py` | Emit first_match_view event |
| `backend/app/routes/__init__.py` | Register new routers |
| `backend/app/main.py` | Include new routers |
| `backend/app/models/__init__.py` | Export new models |

### Frontend -- New Files

| File | Purpose |
|------|---------|
| `frontend/src/services/progressionService.ts` | Progression API client |
| `frontend/src/services/storeService.ts` | Store API client |
| `frontend/src/services/questService.ts` | Quest API client |
| `frontend/src/services/achievementService.ts` | Achievement API client |
| `frontend/src/pages/StorePage.tsx` | Cosmetic store page |
| `frontend/src/pages/QuestsPage.tsx` | Side quests page |
| `frontend/src/components/store/StoreItemCard.tsx` | Store item card |
| `frontend/src/components/store/InventoryPanel.tsx` | Inventory with equip |
| `frontend/src/components/store/PurchaseDialog.tsx` | Purchase confirmation |
| `frontend/src/components/quests/QuestCard.tsx` | Quest card with progress |
| `frontend/src/components/quests/QuestProgressBar.tsx` | Requirement progress |

### Frontend -- Modified Files

| File | Changes |
|------|---------|
| `frontend/src/context/AdventureModeContext.tsx` | Remove localStorage, add API sync, expand fantasy text |
| `frontend/src/components/game/AdventureHUD.tsx` | Dual-track display, Store/Quest buttons |
| `frontend/src/components/game/AchievementsPanel.tsx` | Fetch from server API |
| `frontend/src/components/game/CoinFlipGame.tsx` | Remove or replace |
| `frontend/src/components/game/NotificationToasts.tsx` | Coin gain toasts, quest toasts |
| `frontend/src/components/game/ThemeSwitcher.tsx` | Toggle calls server API |
| `frontend/src/components/layout/Sidebar.tsx` | Add Store and Quest nav items |
| `frontend/src/App.tsx` | Add /store and /quests routes |
